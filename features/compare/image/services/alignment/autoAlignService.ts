import type { ImageFileMeta } from "../../store/useImageCompareStore";
import type { ImageAffineTransform, ImageAlignmentOptions } from "./types";
import type { AlignmentPixels, RegistrationResult } from "./registrationEngine";

export interface AutoAlignResult {
  success: boolean;
  transform?: ImageAffineTransform;
  confidence?: number;
  matchCount?: number;
  error?: { code: string; message: string };
}

const WORK_SIZE = 640;
const TIMEOUT_MS = 15000;

function loadPixels(meta: ImageFileMeta, signal?: AbortSignal): Promise<AlignmentPixels> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      image.src = "";
      reject(new DOMException("Alignment cancelled", "AbortError"));
    };
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    image.onload = () => {
      cleanup();
      try {
        const scale = Math.min(1, WORK_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Could not create alignment canvas");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({
          width: canvas.width, height: canvas.height,
          sourceWidth: image.naturalWidth, sourceHeight: image.naturalHeight,
          data: ctx.getImageData(0, 0, canvas.width, canvas.height).data
        });
      } catch (error) { reject(error); }
    };
    image.onerror = () => { cleanup(); reject(new Error("Failed to load alignment image")); };
    image.src = meta.url;
  });
}

function runWorker(original: AlignmentPixels, modified: AlignmentPixels, options: ImageAlignmentOptions, signal?: AbortSignal): Promise<RegistrationResult | null> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./autoAlign.worker.ts", import.meta.url));
    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      worker.terminate();
    };
    const abort = () => { cleanup(); reject(new DOMException("Alignment cancelled", "AbortError")); };
    const timeout = setTimeout(() => { cleanup(); reject(new Error("Alignment timed out")); }, TIMEOUT_MS);
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<RegistrationResult | null>) => { cleanup(); resolve(event.data); };
    worker.onerror = () => { cleanup(); reject(new Error("Alignment worker failed")); };
    worker.onmessageerror = () => { cleanup(); reject(new Error("Invalid alignment worker response")); };
    try {
      worker.postMessage({ original, modified, options }, [original.data.buffer, modified.data.buffer]);
    } catch (error) { cleanup(); reject(error); }
  });
}

export async function estimateAutoAlignment(original: ImageFileMeta, modified: ImageFileMeta, options: ImageAlignmentOptions, signal?: AbortSignal): Promise<AutoAlignResult> {
  try {
    const [originalPixels, modifiedPixels] = await Promise.all([loadPixels(original, signal), loadPixels(modified, signal)]);
    if (signal?.aborted) throw new DOMException("Alignment cancelled", "AbortError");
    const result = await runWorker(originalPixels, modifiedPixels, options, signal);
    return result ? { success: true, ...result } : {
      success: false,
      error: { code: "alignment/no-match", message: "Auto align could not find enough matching image detail. Try adjusting the images manually." }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: signal?.aborted ? "alignment/cancelled" : "alignment/failed",
        message: error instanceof Error && error.name === "AbortError" ? "Auto align cancelled." : "Auto align failed while processing the images. Try again or adjust them manually."
      }
    };
  }
}
