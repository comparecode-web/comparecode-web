import type { ImageFileMeta } from "../../store/useImageCompareStore";
import type { ImageAffineTransform, ImageAlignmentOptions } from "./types";

interface LoadedImageCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

interface AutoAlignCandidate {
  transform: ImageAffineTransform;
  score: number;
  overlap: number;
}

interface LumaData {
  values: Float32Array;
  edges: Float32Array;
  mask: Float32Array | null;
}

export interface AutoAlignResult {
  success: boolean;
  transform?: ImageAffineTransform;
  confidence?: number;
  matchCount?: number;
  error?: {
    code: string;
    message: string;
  };
}

const WORK_SIZE = 190;
const MIN_OVERLAP_RATIO = 0.18;
const ROTATION_SCAN_LIMIT = 4;

function loadImageCanvas(url: string): Promise<LoadedImageCanvas> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }
      ctx.drawImage(image, 0, 0);
      resolve({ canvas, ctx, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = url;
  });
}

function createWorkCanvas(source: LoadedImageCanvas, scale: number): LoadedImageCanvas {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create work canvas");
  }
  ctx.drawImage(source.canvas, 0, 0, canvas.width, canvas.height);

  return { canvas, ctx, width: canvas.width, height: canvas.height };
}

function createTransformedWorkCanvas(source: LoadedImageCanvas, scale: number, rotationDeg: number): LoadedImageCanvas {
  const scaledWidth = Math.max(1, source.width * scale);
  const scaledHeight = Math.max(1, source.height * scale);
  const rotation = rotationDeg * Math.PI / 180;
  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(scaledWidth * cos + scaledHeight * sin));
  canvas.height = Math.max(1, Math.ceil(scaledWidth * sin + scaledHeight * cos));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create transformed work canvas");
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotation);
  ctx.drawImage(source.canvas, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);

  return { canvas, ctx, width: canvas.width, height: canvas.height };
}

function toLuma(ctx: CanvasRenderingContext2D, width: number, height: number, includeMask = false): LumaData {
  const data = ctx.getImageData(0, 0, width, height).data;
  const values = new Float32Array(width * height);
  const edges = new Float32Array(width * height);
  const mask = includeMask ? new Float32Array(width * height) : null;
  for (let i = 0; i < values.length; i++) {
    const p = i * 4;
    values[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
    if (mask) {
      mask[i] = data[p + 3] / 255;
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      const dx = values[index + 1] - values[index - 1];
      const dy = values[index + width] - values[index - width];
      edges[index] = Math.min(1, Math.hypot(dx, dy));
    }
  }

  return { values, edges, mask };
}

function scoreOffset(
  original: LumaData,
  modified: LumaData,
  originalWidth: number,
  originalHeight: number,
  modifiedWidth: number,
  modifiedHeight: number,
  offsetX: number,
  offsetY: number,
  sampleStep: number
): { score: number; overlap: number } {
  const startX = Math.max(0, offsetX);
  const startY = Math.max(0, offsetY);
  const endX = Math.min(originalWidth, offsetX + modifiedWidth);
  const endY = Math.min(originalHeight, offsetY + modifiedHeight);
  const overlapWidth = endX - startX;
  const overlapHeight = endY - startY;
  if (overlapWidth <= 0 || overlapHeight <= 0) {
    return { score: Number.POSITIVE_INFINITY, overlap: 0 };
  }

  let total = 0;
  let count = 0;
  for (let y = startY; y < endY; y += sampleStep) {
    const modifiedY = y - offsetY;
    for (let x = startX; x < endX; x += sampleStep) {
      const modifiedX = x - offsetX;
      const modifiedIndex = modifiedY * modifiedWidth + modifiedX;
      if (modified.mask && modified.mask[modifiedIndex] < 0.35) {
        continue;
      }
      const originalIndex = y * originalWidth + x;
      const lumaScore = Math.abs(original.values[originalIndex] - modified.values[modifiedIndex]);
      const edgeScore = Math.abs(original.edges[originalIndex] - modified.edges[modifiedIndex]);
      total += lumaScore * 0.35 + edgeScore * 0.65;
      count++;
    }
  }

  const overlap = count * sampleStep * sampleStep / (originalWidth * originalHeight);
  if (overlap < MIN_OVERLAP_RATIO) {
    return { score: Number.POSITIVE_INFINITY, overlap };
  }

  return {
    score: count > 0 ? total / count : Number.POSITIVE_INFINITY,
    overlap
  };
}

function getScaleCandidates(original: ImageFileMeta, modified: ImageFileMeta, options: ImageAlignmentOptions): Array<number> {
  if (!options.scale) return [1];

  const fitScale = Math.min(original.width / modified.width, original.height / modified.height);
  const widthScale = original.width / modified.width;
  const heightScale = original.height / modified.height;
  const candidates = [fitScale, widthScale, heightScale, 1, fitScale * 0.9, fitScale * 1.1];

  return [...new Set(candidates
    .filter((value) => Number.isFinite(value) && value > 0.05 && value < 20)
    .map((value) => Number(value.toFixed(4))))];
}

function createRotationRange(min: number, max: number, step: number): Array<number> {
  const rotations: number[] = [];
  for (let value = min; value <= max + step / 2; value += step) {
    rotations.push(Number(value.toFixed(2)));
  }

  return rotations;
}

function getCoarseRotationCandidates(options: ImageAlignmentOptions): Array<number> {
  if (!options.rotate) return [0];

  return createRotationRange(-ROTATION_SCAN_LIMIT, ROTATION_SCAN_LIMIT, 1);
}

function getRefinedRotationCandidates(rotations: Array<number>, options: ImageAlignmentOptions): Array<number> {
  if (!options.rotate) return [0];

  const candidates = rotations.flatMap((rotation) => createRotationRange(
    Math.max(-ROTATION_SCAN_LIMIT, rotation - 0.75),
    Math.min(ROTATION_SCAN_LIMIT, rotation + 0.75),
    0.1
  ));

  return [...new Set(candidates)];
}

function evaluateCandidate(
  originalWork: LoadedImageCanvas,
  modified: LoadedImageCanvas,
  sourceScale: number,
  candidateScale: number,
  rotationDeg: number,
  originalLuma: LumaData
): AutoAlignCandidate | null {
  const modifiedWork = createTransformedWorkCanvas(modified, sourceScale * candidateScale, rotationDeg);
  const modifiedLuma = toLuma(modifiedWork.ctx, modifiedWork.width, modifiedWork.height, rotationDeg !== 0);
  const centerOffsetX = Math.round((originalWork.width - modifiedWork.width) / 2);
  const centerOffsetY = Math.round((originalWork.height - modifiedWork.height) / 2);
  const rangeX = Math.max(12, Math.round(originalWork.width * 0.18));
  const rangeY = Math.max(12, Math.round(originalWork.height * 0.18));
  let best = {
    offsetX: centerOffsetX,
    offsetY: centerOffsetY,
    score: Number.POSITIVE_INFINITY,
    overlap: 0
  };

  const scan = (step: number, radiusX: number, radiusY: number, originX: number, originY: number) => {
    for (let y = originY - radiusY; y <= originY + radiusY; y += step) {
      for (let x = originX - radiusX; x <= originX + radiusX; x += step) {
        const scored = scoreOffset(
          originalLuma,
          modifiedLuma,
          originalWork.width,
          originalWork.height,
          modifiedWork.width,
          modifiedWork.height,
          Math.round(x),
          Math.round(y),
          step >= 6 ? 4 : 2
        );
        if (scored.score < best.score) {
          best = { offsetX: Math.round(x), offsetY: Math.round(y), score: scored.score, overlap: scored.overlap };
        }
      }
    }
  };

  scan(8, rangeX, rangeY, centerOffsetX, centerOffsetY);
  scan(2, 12, 12, best.offsetX, best.offsetY);

  if (!Number.isFinite(best.score)) {
    return null;
  }

  const sourceOffsetX = best.offsetX / sourceScale;
  const sourceOffsetY = best.offsetY / sourceScale;

  return {
    transform: {
      x: sourceOffsetX + modifiedWork.width / sourceScale / 2,
      y: sourceOffsetY + modifiedWork.height / sourceScale / 2,
      scaleX: candidateScale,
      scaleY: candidateScale,
      rotationDeg,
      flipX: false,
      flipY: false
    },
    score: best.score,
    overlap: best.overlap
  };
}

export async function estimateAutoAlignment(
  original: ImageFileMeta,
  modified: ImageFileMeta,
  options: ImageAlignmentOptions
): Promise<AutoAlignResult> {
  try {
    const [originalCanvas, modifiedCanvas] = await Promise.all([
      loadImageCanvas(original.url),
      loadImageCanvas(modified.url)
    ]);
    const sourceScale = Math.min(1, WORK_SIZE / Math.max(original.width, original.height));
    const originalWork = createWorkCanvas(originalCanvas, sourceScale);
    const originalLuma = toLuma(originalWork.ctx, originalWork.width, originalWork.height);
    const scaleCandidates = getScaleCandidates(original, modified, options);
    const coarseRotationCandidates = getCoarseRotationCandidates(options);
    const coarseResults = scaleCandidates
      .flatMap((scale) => coarseRotationCandidates.map((rotation) => evaluateCandidate(originalWork, modifiedCanvas, sourceScale, scale, rotation, originalLuma)))
      .filter((candidate): candidate is AutoAlignCandidate => candidate !== null)
      .sort((a, b) => a.score - b.score);
    const refinementSeeds = coarseResults.slice(0, 6);
    const refinedResults = refinementSeeds
      .flatMap((candidate) => getRefinedRotationCandidates([candidate.transform.rotationDeg], options)
        .map((rotation) => evaluateCandidate(originalWork, modifiedCanvas, sourceScale, candidate.transform.scaleX, rotation, originalLuma)))
      .filter((candidate): candidate is AutoAlignCandidate => candidate !== null)
      .sort((a, b) => a.score - b.score);
    const results = [...coarseResults, ...refinedResults].sort((a, b) => a.score - b.score);
    const best = results[0];

    if (!best) {
      return {
        success: false,
        error: {
          code: "alignment/not-enough-overlap",
          message: "Auto align could not find enough overlapping image content."
        }
      };
    }

    const confidence = Math.max(0, Math.min(1, (1 - best.score) * best.overlap));
    if (confidence < 0.12) {
      return {
        success: false,
        error: {
          code: "alignment/low-confidence",
          message: "Auto align found a weak match. Use manual alignment to place the images precisely."
        }
      };
    }

    return {
      success: true,
      transform: best.transform,
      confidence,
      matchCount: Math.round(best.overlap * originalWork.width * originalWork.height)
    };
  } catch {
    return {
      success: false,
      error: {
        code: "alignment/failed",
        message: "Auto align failed while processing the images."
      }
    };
  }
}
