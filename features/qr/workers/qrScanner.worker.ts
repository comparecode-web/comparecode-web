import { prepareZXingModule, readBarcodes, type ReaderOptions } from "zxing-wasm/reader";

export interface QrScanRequest {
  id: number;
  bitmap: ImageBitmap;
}

export type QrScanResponse = { id: number; texts: string[] } | { id: number; failed: true };

// Turbopack emits a root-relative asset path, and the worker itself may run from a blob URL.
const wasmUrl = new URL(String(new URL("zxing-wasm/reader/zxing_reader.wasm", import.meta.url)), self.location.origin).href;
const retryLongSide = 1200;
const baseOptions: ReaderOptions = { formats: ["QRCodeModel1", "QRCodeModel2"], maxNumberOfSymbols: 16 };

prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => path.endsWith(".wasm") ? wasmUrl : prefix + path } });

function readPixels(bitmap: ImageBitmap, scale: number): ImageData {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is not available");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

async function decode(bitmap: ImageBitmap): Promise<string[]> {
  const attempts: Array<{ scale: number; options: ReaderOptions }> = [{ scale: 1, options: baseOptions }];
  const longSide = Math.max(bitmap.width, bitmap.height);
  if (longSide > retryLongSide) attempts.push({ scale: retryLongSide / longSide, options: baseOptions });
  attempts.push({ scale: Math.min(1, retryLongSide / longSide), options: { ...baseOptions, tryDenoise: true } });

  for (const attempt of attempts) {
    const results = await readBarcodes(readPixels(bitmap, attempt.scale), attempt.options);
    const texts = [...new Set(results.filter((result) => result.isValid).map((result) => result.text))];
    if (texts.length > 0) return texts;
  }
  return [];
}

self.onmessage = async (event: MessageEvent<QrScanRequest>) => {
  const { id, bitmap } = event.data;
  let response: QrScanResponse;
  try {
    response = { id, texts: await decode(bitmap) };
  } catch {
    response = { id, failed: true };
  } finally {
    bitmap.close();
  }
  self.postMessage(response);
};
