export const SAFE_CANVAS_PIXELS = 16_777_216;
export const MAX_WORKING_PIXELS = 33_554_432;
export const MAX_CANVAS_SIDE = 16_384;

const allocationResults = new Map<string, boolean>();

function isKnownSafe(width: number, height: number): boolean {
  return width * height <= SAFE_CANVAS_PIXELS && width <= MAX_CANVAS_SIDE && height <= MAX_CANVAS_SIDE;
}

function probeCanvas(width: number, height: number): boolean {
  const canvas = document.createElement("canvas");
  try {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || canvas.width !== width || canvas.height !== height) return false;
    ctx.fillStyle = "#000";
    ctx.fillRect(width - 1, height - 1, 1, 1);
    return ctx.getImageData(width - 1, height - 1, 1, 1).data[3] === 255;
  } catch {
    return false;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export function canAllocateCanvas(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return false;
  if (isKnownSafe(width, height)) return true;
  const key = `${width}x${height}`;
  let result = allocationResults.get(key);
  if (result === undefined) {
    result = probeCanvas(width, height);
    allocationResults.set(key, result);
  }
  return result;
}

export function getWorkingScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1;
  const scale = Math.min(1, Math.sqrt(MAX_WORKING_PIXELS / (width * height)), MAX_CANVAS_SIDE / width, MAX_CANVAS_SIDE / height);
  const scaledWidth = Math.max(1, Math.ceil(width * scale));
  const scaledHeight = Math.max(1, Math.ceil(height * scale));
  if (canAllocateCanvas(scaledWidth, scaledHeight)) return scale;
  return Math.min(scale, Math.sqrt(SAFE_CANVAS_PIXELS / (width * height)) * 0.999);
}

export function scaleSize(width: number, height: number, scale: number): { width: number; height: number } {
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
