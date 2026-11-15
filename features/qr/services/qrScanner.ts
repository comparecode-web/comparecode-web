import { SAFE_CANVAS_PIXELS } from "@/utils/canvasBudget";
import type { QrScanRequest, QrScanResponse } from "../workers/qrScanner.worker";

export class QrScanError extends Error {}

type PendingScan = { resolve: (texts: string[]) => void; reject: (error: QrScanError) => void };

const scanFailedMessage = "Scanning failed. Reload the page and try again.";

let worker: Worker | null = null;
let nextRequestId = 0;
const pendingScans = new Map<number, PendingScan>();

function rejectAll(message: string) {
  for (const pending of pendingScans.values()) pending.reject(new QrScanError(message));
  pendingScans.clear();
}

function getWorker(): Worker {
  if (worker) return worker;
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
    throw new QrScanError("Your browser can't scan images. Try a recent version of Chrome, Edge, Firefox, or Safari.");
  }
  const created = new Worker(new URL("../workers/qrScanner.worker.ts", import.meta.url), { type: "module" });
  created.onmessage = (event: MessageEvent<QrScanResponse>) => {
    const pending = pendingScans.get(event.data.id);
    if (!pending) return;
    pendingScans.delete(event.data.id);
    if ("texts" in event.data) pending.resolve(event.data.texts);
    else pending.reject(new QrScanError(scanFailedMessage));
  };
  created.onerror = () => {
    rejectAll(scanFailedMessage);
    disposeQrScanner();
  };
  worker = created;
  return created;
}

export function disposeQrScanner() {
  worker?.terminate();
  worker = null;
  rejectAll(scanFailedMessage);
}

export function loadScanImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0
      ? resolve(image)
      : reject(new QrScanError("This image has no size, so it can't be scanned."));
    image.onerror = () => reject(new QrScanError("This image couldn't be opened. Try a PNG or JPEG file."));
    image.src = url;
  });
}

async function toBitmap(image: HTMLImageElement): Promise<ImageBitmap> {
  const pixels = image.naturalWidth * image.naturalHeight;
  const scale = pixels > SAFE_CANVAS_PIXELS ? Math.sqrt(SAFE_CANVAS_PIXELS / pixels) : 1;
  const width = Math.max(1, Math.floor(image.naturalWidth * scale));
  const height = Math.max(1, Math.floor(image.naturalHeight * scale));
  try {
    return await createImageBitmap(image, { resizeWidth: width, resizeHeight: height, resizeQuality: "high" });
  } catch {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
    try {
      return await createImageBitmap(canvas);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

export async function scanQrImage(image: HTMLImageElement): Promise<string[]> {
  const scanner = getWorker();
  const bitmap = await toBitmap(image);
  const id = ++nextRequestId;
  return new Promise<string[]>((resolve, reject) => {
    pendingScans.set(id, { resolve, reject });
    const request: QrScanRequest = { id, bitmap };
    scanner.postMessage(request, [bitmap]);
  });
}
