import type { ImageFileMeta } from "../../store/useImageCompareStore";
import type { ImageAffineTransform, ImageAlignmentOptions } from "./types";
import { estimateOpenCvAutoAlignment } from "./opencvAutoAlignService";

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

interface Keypoint {
  x: number;
  y: number;
  response: number;
  descriptor: Float32Array;
}

interface FeatureMatch {
  original: Keypoint;
  modified: Keypoint;
  distance: number;
}

interface SimilaritySeed {
  scale: number;
  rotationDeg: number;
  offsetX: number;
  offsetY: number;
  inliers: number;
  error: number;
}

interface WeightedMoments {
  weight: number;
  centerX: number;
  centerY: number;
  varianceX: number;
  varianceY: number;
  covariance: number;
}

interface LumaData {
  values: Float32Array;
  edges: Float32Array;
  colors: Uint8ClampedArray;
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

const WORK_SIZE = 256;
const MIN_OVERLAP_RATIO = 0.35;
const PREFERRED_MIN_OVERLAP_RATIO = 0.70;
const ROTATION_SCAN_LIMIT = 5;
const SCALE_SCAN_LIMIT = 0.2;
const OVERLAP_SCORE_PENALTY = 0.12;
const PREFERRED_OVERLAP_SCORE_PENALTY = 0.85;
const SCALE_PRIOR_PENALTY = 1.15;
const CENTER_PRIOR_PENALTY = 0.18;
const FEATURE_PATCH_RADIUS = 5;
const FEATURE_MIN_MATCHES = 10;
const FEATURE_INLIER_THRESHOLD = 7;

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
  const colors = new Uint8ClampedArray(data);
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

  return { values, edges, colors, mask };
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
  sampleStep: number,
  minOverlapRatio: number
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

  let lumaOriginalSum = 0;
  let lumaModifiedSum = 0;
  let lumaOriginalSquareSum = 0;
  let lumaModifiedSquareSum = 0;
  let lumaCrossSum = 0;
  let edgeOriginalSum = 0;
  let edgeModifiedSum = 0;
  let edgeOriginalSquareSum = 0;
  let edgeModifiedSquareSum = 0;
  let edgeCrossSum = 0;
  let sameCount = 0;
  let count = 0;
  let corrCount = 0;
  for (let y = startY; y < endY; y += sampleStep) {
    const modifiedY = y - offsetY;
    for (let x = startX; x < endX; x += sampleStep) {
      const modifiedX = x - offsetX;
      const modifiedIndex = modifiedY * modifiedWidth + modifiedX;
      if (modified.mask && modified.mask[modifiedIndex] < 0.35) {
        continue;
      }
      const originalIndex = y * originalWidth + x;
      const originalColorIndex = originalIndex * 4;
      const modifiedColorIndex = modifiedIndex * 4;
      const originalLuma = original.values[originalIndex];
      const modifiedLuma = modified.values[modifiedIndex];
      const originalEdge = original.edges[originalIndex];
      const modifiedEdge = modified.edges[modifiedIndex];
      const redDifference = original.colors[originalColorIndex] - modified.colors[modifiedColorIndex];
      const greenDifference = original.colors[originalColorIndex + 1] - modified.colors[modifiedColorIndex + 1];
      const blueDifference = original.colors[originalColorIndex + 2] - modified.colors[modifiedColorIndex + 2];
      const colorDelta = Math.sqrt(redDifference * redDifference + greenDifference * greenDifference + blueDifference * blueDifference);
      const lumaDelta = Math.abs(originalLuma - modifiedLuma);
      const useForCorr = (lumaDelta <= 0.20 && colorDelta <= 48);
      if (useForCorr) {
        lumaOriginalSum += originalLuma;
        lumaModifiedSum += modifiedLuma;
        lumaOriginalSquareSum += originalLuma * originalLuma;
        lumaModifiedSquareSum += modifiedLuma * modifiedLuma;
        lumaCrossSum += originalLuma * modifiedLuma;
        edgeOriginalSum += originalEdge;
        edgeModifiedSum += modifiedEdge;
        edgeOriginalSquareSum += originalEdge * originalEdge;
        edgeModifiedSquareSum += modifiedEdge * modifiedEdge;
        edgeCrossSum += originalEdge * modifiedEdge;
        corrCount++;
      }
      if (colorDelta <= 30) {
        sameCount++;
      }
      count++;
    }
  }

  const overlap = count * sampleStep * sampleStep / (originalWidth * originalHeight);
  if (overlap < minOverlapRatio) {
    return { score: Number.POSITIVE_INFINITY, overlap };
  }

  if (count <= 0) {
    return { score: Number.POSITIVE_INFINITY, overlap };
  }

  const effCount = corrCount > 3 ? corrCount : count;
  const lumaCorrelation = getNormalizedCorrelation(
    lumaOriginalSum,
    lumaModifiedSum,
    lumaOriginalSquareSum,
    lumaModifiedSquareSum,
    lumaCrossSum,
    effCount
  );
  const edgeCorrelation = getNormalizedCorrelation(
    edgeOriginalSum,
    edgeModifiedSum,
    edgeOriginalSquareSum,
    edgeModifiedSquareSum,
    edgeCrossSum,
    effCount
  );
  const correlationScore = (1 - lumaCorrelation) * 0.35 + (1 - edgeCorrelation) * 0.65;
  const rgbDifferenceScore = 1 - sameCount / count;

  return {
    score: correlationScore * 0.65 + rgbDifferenceScore * 0.35,
    overlap
  };
}

function getNormalizedCorrelation(
  originalSum: number,
  modifiedSum: number,
  originalSquareSum: number,
  modifiedSquareSum: number,
  crossSum: number,
  count: number
): number {
  const originalMean = originalSum / count;
  const modifiedMean = modifiedSum / count;
  const covariance = crossSum - count * originalMean * modifiedMean;
  const originalVariance = originalSquareSum - count * originalMean * originalMean;
  const modifiedVariance = modifiedSquareSum - count * modifiedMean * modifiedMean;
  const denominator = Math.sqrt(Math.max(0, originalVariance) * Math.max(0, modifiedVariance));

  if (denominator <= 1e-6) return 0;
  return Math.min(1, Math.max(-1, covariance / denominator));
}

function createDescriptor(luma: LumaData, width: number, height: number, x: number, y: number): Float32Array | null {
  if (x < FEATURE_PATCH_RADIUS || y < FEATURE_PATCH_RADIUS || x >= width - FEATURE_PATCH_RADIUS || y >= height - FEATURE_PATCH_RADIUS) return null;

  const values: number[] = [];
  let sum = 0;
  for (let dy = -FEATURE_PATCH_RADIUS; dy <= FEATURE_PATCH_RADIUS; dy++) {
    for (let dx = -FEATURE_PATCH_RADIUS; dx <= FEATURE_PATCH_RADIUS; dx++) {
      const index = (y + dy) * width + x + dx;
      const value = luma.values[index] * 0.45 + luma.edges[index] * 0.55;
      values.push(value);
      sum += value;
    }
  }

  const mean = sum / values.length;
  let variance = 0;
  values.forEach((value) => {
    variance += (value - mean) * (value - mean);
  });
  const deviation = Math.sqrt(variance / values.length);
  if (deviation <= 0.015) return null;

  return Float32Array.from(values.map((value) => (value - mean) / deviation));
}

function descriptorDistance(a: Float32Array, b: Float32Array): number {
  let total = 0;
  for (let index = 0; index < a.length; index++) {
    const difference = a[index] - b[index];
    total += difference * difference;
  }

  return total / a.length;
}

function detectKeypoints(luma: LumaData, width: number, height: number, limit: number): Keypoint[] {
  const responses: Array<{ x: number; y: number; response: number }> = [];
  const margin = FEATURE_PATCH_RADIUS + 2;
  for (let y = margin; y < height - margin; y++) {
    for (let x = margin; x < width - margin; x++) {
      let xx = 0;
      let yy = 0;
      let xy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const index = (y + dy) * width + x + dx;
          const gx = luma.values[index + 1] - luma.values[index - 1];
          const gy = luma.values[index + width] - luma.values[index - width];
          xx += gx * gx;
          yy += gy * gy;
          xy += gx * gy;
        }
      }
      const trace = xx + yy;
      const determinant = xx * yy - xy * xy;
      const response = determinant - 0.04 * trace * trace;
      if (response > 0.00005) {
        responses.push({ x, y, response });
      }
    }
  }

  const selected: Keypoint[] = [];
  responses.sort((a, b) => b.response - a.response);
  for (const response of responses) {
    if (selected.some((keypoint) => Math.hypot(keypoint.x - response.x, keypoint.y - response.y) < 7)) continue;
    const descriptor = createDescriptor(luma, width, height, response.x, response.y);
    if (!descriptor) continue;
    selected.push({ ...response, descriptor });
    if (selected.length >= limit) break;
  }

  return selected;
}

function matchKeypoints(original: Keypoint[], modified: Keypoint[]): FeatureMatch[] {
  const matches: FeatureMatch[] = [];
  original.forEach((originalPoint) => {
    let bestKeypoint: Keypoint | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    let secondBest = Number.POSITIVE_INFINITY;
    modified.forEach((modifiedPoint) => {
      const distance = descriptorDistance(originalPoint.descriptor, modifiedPoint.descriptor);
      if (distance < bestDistance) {
        secondBest = bestDistance;
        bestDistance = distance;
        bestKeypoint = modifiedPoint;
        return;
      }
      if (distance < secondBest) {
        secondBest = distance;
      }
    });
    if (bestKeypoint && bestDistance < 0.62 && bestDistance < secondBest * 0.82) {
      matches.push({ original: originalPoint, modified: bestKeypoint, distance: bestDistance });
    }
  });

  return matches.sort((a, b) => a.distance - b.distance);
}

function createPairSeed(a: FeatureMatch, b: FeatureMatch, options: ImageAlignmentOptions): SimilaritySeed | null {
  const sourceDx = b.modified.x - a.modified.x;
  const sourceDy = b.modified.y - a.modified.y;
  const targetDx = b.original.x - a.original.x;
  const targetDy = b.original.y - a.original.y;
  const sourceDistance = Math.hypot(sourceDx, sourceDy);
  const targetDistance = Math.hypot(targetDx, targetDy);
  if (sourceDistance < 12 || targetDistance < 12) return null;

  const scale = options.scale ? targetDistance / sourceDistance : 1;
  if (!Number.isFinite(scale) || scale < 0.45 || scale > 1.7) return null;
  const rotation = options.rotate ? Math.atan2(targetDy, targetDx) - Math.atan2(sourceDy, sourceDx) : 0;
  const cos = Math.cos(rotation) * scale;
  const sin = Math.sin(rotation) * scale;
  const offsetX = a.original.x - (cos * a.modified.x - sin * a.modified.y);
  const offsetY = a.original.y - (sin * a.modified.x + cos * a.modified.y);

  return {
    scale,
    rotationDeg: rotation * 180 / Math.PI,
    offsetX,
    offsetY,
    inliers: 0,
    error: Number.POSITIVE_INFINITY
  };
}

function scoreSeed(seed: SimilaritySeed, matches: FeatureMatch[]): SimilaritySeed {
  const rotation = seed.rotationDeg * Math.PI / 180;
  const cos = Math.cos(rotation) * seed.scale;
  const sin = Math.sin(rotation) * seed.scale;
  let inliers = 0;
  let error = 0;
  matches.forEach((match) => {
    const x = cos * match.modified.x - sin * match.modified.y + seed.offsetX;
    const y = sin * match.modified.x + cos * match.modified.y + seed.offsetY;
    const distance = Math.hypot(x - match.original.x, y - match.original.y);
    if (distance <= FEATURE_INLIER_THRESHOLD) {
      inliers++;
      error += distance;
    }
  });

  return {
    ...seed,
    inliers,
    error: inliers > 0 ? error / inliers : Number.POSITIVE_INFINITY
  };
}

function refineSeed(seed: SimilaritySeed, matches: FeatureMatch[], options: ImageAlignmentOptions): SimilaritySeed {
  const inliers = matches.filter((match) => {
    const rotation = seed.rotationDeg * Math.PI / 180;
    const cos = Math.cos(rotation) * seed.scale;
    const sin = Math.sin(rotation) * seed.scale;
    const x = cos * match.modified.x - sin * match.modified.y + seed.offsetX;
    const y = sin * match.modified.x + cos * match.modified.y + seed.offsetY;
    return Math.hypot(x - match.original.x, y - match.original.y) <= FEATURE_INLIER_THRESHOLD;
  });
  if (inliers.length < FEATURE_MIN_MATCHES) return seed;

  const sourceCenter = inliers.reduce((sum, match) => ({ x: sum.x + match.modified.x, y: sum.y + match.modified.y }), { x: 0, y: 0 });
  const targetCenter = inliers.reduce((sum, match) => ({ x: sum.x + match.original.x, y: sum.y + match.original.y }), { x: 0, y: 0 });
  sourceCenter.x /= inliers.length;
  sourceCenter.y /= inliers.length;
  targetCenter.x /= inliers.length;
  targetCenter.y /= inliers.length;

  let dot = 0;
  let cross = 0;
  let denominator = 0;
  inliers.forEach((match) => {
    const sx = match.modified.x - sourceCenter.x;
    const sy = match.modified.y - sourceCenter.y;
    const tx = match.original.x - targetCenter.x;
    const ty = match.original.y - targetCenter.y;
    dot += sx * tx + sy * ty;
    cross += sx * ty - sy * tx;
    denominator += sx * sx + sy * sy;
  });
  if (denominator <= 1e-6) return seed;

  const rotation = options.rotate ? Math.atan2(cross, dot) : 0;
  const scale = options.scale ? Math.hypot(dot, cross) / denominator : 1;
  const cos = Math.cos(rotation) * scale;
  const sin = Math.sin(rotation) * scale;
  const refined = {
    scale,
    rotationDeg: rotation * 180 / Math.PI,
    offsetX: targetCenter.x - (cos * sourceCenter.x - sin * sourceCenter.y),
    offsetY: targetCenter.y - (sin * sourceCenter.x + cos * sourceCenter.y),
    inliers: 0,
    error: Number.POSITIVE_INFINITY
  };

  return scoreSeed(refined, matches);
}

function estimateFeatureSeed(originalLuma: LumaData, modifiedLuma: LumaData, originalWidth: number, originalHeight: number, modifiedWidth: number, modifiedHeight: number, options: ImageAlignmentOptions): SimilaritySeed | null {
  const originalKeypoints = detectKeypoints(originalLuma, originalWidth, originalHeight, 140);
  const modifiedKeypoints = detectKeypoints(modifiedLuma, modifiedWidth, modifiedHeight, 160);
  const matches = matchKeypoints(originalKeypoints, modifiedKeypoints).slice(0, 90);
  if (matches.length < FEATURE_MIN_MATCHES) return null;

  let best: SimilaritySeed | null = null;
  const trialLimit = 220;
  let trials = 0;
  for (let a = 0; a < matches.length && trials < trialLimit; a++) {
    for (let b = a + 1; b < matches.length && trials < trialLimit; b++) {
      const seed = createPairSeed(matches[a], matches[b], options);
      if (!seed) continue;
      const scored = scoreSeed(seed, matches);
      if (scored.inliers < FEATURE_MIN_MATCHES) continue;
      if (!best || scored.inliers > best.inliers || (scored.inliers === best.inliers && scored.error < best.error)) {
        best = scored;
      }
      trials++;
    }
  }

  return best ? refineSeed(best, matches, options) : null;
}

function getWeightedMoments(luma: LumaData, width: number, height: number): WeightedMoments | null {
  let weight = 0;
  let sumX = 0;
  let sumY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const pixelWeight = Math.max(luma.edges[index] * 1.8, Math.max(0, 0.58 - luma.values[index]) * 1.6);
      if (pixelWeight <= 0.02) continue;
      weight += pixelWeight;
      sumX += x * pixelWeight;
      sumY += y * pixelWeight;
    }
  }
  if (weight <= 1e-6) return null;

  const centerX = sumX / weight;
  const centerY = sumY / weight;
  let varianceX = 0;
  let varianceY = 0;
  let covariance = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const pixelWeight = Math.max(luma.edges[index] * 1.8, Math.max(0, 0.58 - luma.values[index]) * 1.6);
      if (pixelWeight <= 0.02) continue;
      const dx = x - centerX;
      const dy = y - centerY;
      varianceX += dx * dx * pixelWeight;
      varianceY += dy * dy * pixelWeight;
      covariance += dx * dy * pixelWeight;
    }
  }

  return {
    weight,
    centerX,
    centerY,
    varianceX: varianceX / weight,
    varianceY: varianceY / weight,
    covariance: covariance / weight
  };
}

function getMomentAngle(moments: WeightedMoments): number {
  return 0.5 * Math.atan2(2 * moments.covariance, moments.varianceX - moments.varianceY);
}

function estimateMomentSeed(originalLuma: LumaData, modifiedLuma: LumaData, originalWidth: number, originalHeight: number, modifiedWidth: number, modifiedHeight: number, options: ImageAlignmentOptions): SimilaritySeed | null {
  const originalMoments = getWeightedMoments(originalLuma, originalWidth, originalHeight);
  const modifiedMoments = getWeightedMoments(modifiedLuma, modifiedWidth, modifiedHeight);
  if (!originalMoments || !modifiedMoments) return null;

  const originalTrace = originalMoments.varianceX + originalMoments.varianceY;
  const modifiedTrace = modifiedMoments.varianceX + modifiedMoments.varianceY;
  if (modifiedTrace <= 1e-6) return null;

  const scale = options.scale ? Math.sqrt(originalTrace / modifiedTrace) : 1;
  if (!Number.isFinite(scale) || scale < 0.45 || scale > 1.7) return null;
  const rotation = options.rotate ? getMomentAngle(originalMoments) - getMomentAngle(modifiedMoments) : 0;
  const cos = Math.cos(rotation) * scale;
  const sin = Math.sin(rotation) * scale;

  return {
    scale,
    rotationDeg: rotation * 180 / Math.PI,
    offsetX: originalMoments.centerX - (cos * modifiedMoments.centerX - sin * modifiedMoments.centerY),
    offsetY: originalMoments.centerY - (sin * modifiedMoments.centerX + cos * modifiedMoments.centerY),
    inliers: Math.round(Math.min(originalMoments.weight, modifiedMoments.weight)),
    error: 0
  };
}

function getSeedBoundsOffset(seed: SimilaritySeed, width: number, height: number): { x: number; y: number } {
  const rotation = seed.rotationDeg * Math.PI / 180;
  const cos = Math.cos(rotation) * seed.scale;
  const sin = Math.sin(rotation) * seed.scale;
  const points = [
    { x: seed.offsetX, y: seed.offsetY },
    { x: cos * width + seed.offsetX, y: sin * width + seed.offsetY },
    { x: cos * width - sin * height + seed.offsetX, y: sin * width + cos * height + seed.offsetY },
    { x: -sin * height + seed.offsetX, y: cos * height + seed.offsetY }
  ];

  return {
    x: Math.round(Math.min(...points.map((point) => point.x))),
    y: Math.round(Math.min(...points.map((point) => point.y)))
  };
}

function getPreferredDimensionScale(original: ImageFileMeta, modified: ImageFileMeta, options: ImageAlignmentOptions): number | null {
  if (!options.scale) return null;
  const widthScale = original.width / modified.width;
  const heightScale = original.height / modified.height;
  const originalRatio = original.width / original.height;
  const modifiedRatio = modified.width / modified.height;
  if (!Number.isFinite(originalRatio) || !Number.isFinite(modifiedRatio)) return null;
  if (Math.abs(originalRatio - modifiedRatio) > 0.03) return null;

  const preferredScale = (widthScale + heightScale) / 2;
  if (Math.abs(Math.log(preferredScale)) > 0.08) return null;

  return Number.isFinite(preferredScale) && preferredScale > 0 ? preferredScale : null;
}

function regularizeNearIdentityScale(original: ImageFileMeta, modified: ImageFileMeta, transform: ImageAffineTransform): ImageAffineTransform {
  const aspectDelta = Math.abs(original.width / original.height - modified.width / modified.height);
  if (aspectDelta >= 0.03) return transform;
  if (Math.abs(transform.scaleX - 1) >= 0.07 || Math.abs(transform.scaleY - 1) >= 0.07) return transform;

  return {
    ...transform,
    scaleX: 1,
    scaleY: 1
  };
}

function getScaleCandidates(original: ImageFileMeta, modified: ImageFileMeta, options: ImageAlignmentOptions): Array<number> {
  if (!options.scale) return [1];

  const fitScale = Math.min(original.width / modified.width, original.height / modified.height);
  const widthScale = original.width / modified.width;
  const heightScale = original.height / modified.height;
  const preferredScale = getPreferredDimensionScale(original, modified, options);
  const candidates = preferredScale && Math.abs(Math.log(preferredScale)) > 0.035
    ? [
      preferredScale,
      widthScale,
      heightScale,
      fitScale,
      preferredScale * 0.94,
      preferredScale * 0.97,
      preferredScale * 1.03,
      preferredScale * 1.06,
      0.96,
      0.98,
      1,
      1.02,
      1.04
    ]
    : [
      fitScale,
      widthScale,
      heightScale,
      1,
      fitScale * 0.9,
      fitScale * 1.1,
      ...createScaleRange(1 - SCALE_SCAN_LIMIT, 1 + SCALE_SCAN_LIMIT, 0.06)
    ];

  return [...new Set(candidates
    .filter((value) => Number.isFinite(value) && value > 0.05 && value < 20)
    .map((value) => Number(value.toFixed(4))))];
}

function createScaleRange(min: number, max: number, step: number): Array<number> {
  const scales: number[] = [];
  for (let value = min; value <= max + step / 2; value += step) {
    scales.push(Number(value.toFixed(4)));
  }

  return scales;
}

function getRefinedScaleCandidates(scales: Array<number>, options: ImageAlignmentOptions): Array<number> {
  if (!options.scale) return [1];

  const candidates = scales.flatMap((scale) => createScaleRange(
    Math.max(0.05, scale - 0.045),
    Math.min(20, scale + 0.045),
    0.015
  ));

  return [...new Set(candidates)];
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

  const candidates = rotations.flatMap((rotation) => {
    const span = Math.abs(rotation) > ROTATION_SCAN_LIMIT ? 2.8 : 0.8;
    const step = Math.abs(rotation) > ROTATION_SCAN_LIMIT ? 0.35 : 0.2;
    return createRotationRange(rotation - span, rotation + span, step);
  });

  return [...new Set(candidates)];
}

function evaluateCandidate(
  originalWork: LoadedImageCanvas,
  modified: LoadedImageCanvas,
  sourceScale: number,
  candidateScale: number,
  rotationDeg: number,
  originalLuma: LumaData,
  preferredScale: number | null,
  seedOffset?: { x: number; y: number }
): AutoAlignCandidate | null {
  const modifiedWork = createTransformedWorkCanvas(modified, sourceScale * candidateScale, rotationDeg);
  const modifiedLuma = toLuma(modifiedWork.ctx, modifiedWork.width, modifiedWork.height, rotationDeg !== 0);
  const centerOffsetX = Math.round((originalWork.width - modifiedWork.width) / 2);
  const centerOffsetY = Math.round((originalWork.height - modifiedWork.height) / 2);
  const rangeX = Math.max(12, Math.round(originalWork.width * 0.18));
  const rangeY = Math.max(12, Math.round(originalWork.height * 0.18));
  const hasPreferredScale = preferredScale !== null;
  const minOverlapRatio = hasPreferredScale ? PREFERRED_MIN_OVERLAP_RATIO : MIN_OVERLAP_RATIO;
  const overlapPenalty = hasPreferredScale ? PREFERRED_OVERLAP_SCORE_PENALTY : OVERLAP_SCORE_PENALTY;
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
          step >= 6 ? 4 : 2,
          minOverlapRatio
        );
        if (scored.score < best.score) {
          best = { offsetX: Math.round(x), offsetY: Math.round(y), score: scored.score, overlap: scored.overlap };
        }
      }
    }
  };

  if (seedOffset) {
    scan(4, 24, 24, seedOffset.x, seedOffset.y);
    scan(1, 8, 8, best.offsetX, best.offsetY);
  } else {
    scan(8, rangeX, rangeY, centerOffsetX, centerOffsetY);
    scan(2, 12, 12, best.offsetX, best.offsetY);
  }

  if (!Number.isFinite(best.score)) {
    return null;
  }

  const sourceOffsetX = best.offsetX / sourceScale;
  const sourceOffsetY = best.offsetY / sourceScale;
  const centerDistance = Math.hypot(best.offsetX - centerOffsetX, best.offsetY - centerOffsetY) / Math.max(originalWork.width, originalWork.height);

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
    score: best.score
      + (1 - best.overlap) * overlapPenalty
      + (preferredScale ? Math.abs(Math.log(candidateScale / preferredScale)) * SCALE_PRIOR_PENALTY : 0)
      + (preferredScale ? centerDistance * CENTER_PRIOR_PENALTY : 0),
    overlap: best.overlap
  };
}

export async function estimateAutoAlignment(
  original: ImageFileMeta,
  modified: ImageFileMeta,
  options: ImageAlignmentOptions
): Promise<AutoAlignResult> {
  try {
    const openCvResult = await estimateOpenCvAutoAlignment(original, modified, options);

    const [originalCanvas, modifiedCanvas] = await Promise.all([
      loadImageCanvas(original.url),
      loadImageCanvas(modified.url)
    ]);
    const sourceScale = Math.min(1, WORK_SIZE / Math.max(original.width, original.height));
    const originalWork = createWorkCanvas(originalCanvas, sourceScale);
    const modifiedWorkBase = createWorkCanvas(modifiedCanvas, sourceScale);
    const originalLuma = toLuma(originalWork.ctx, originalWork.width, originalWork.height);
    const modifiedBaseLuma = toLuma(modifiedWorkBase.ctx, modifiedWorkBase.width, modifiedWorkBase.height);
    const scaleCandidates = getScaleCandidates(original, modified, options);
    const preferredScale = getPreferredDimensionScale(original, modified, options);
    const centerCandidate = evaluateCandidate(originalWork, modifiedCanvas, sourceScale, 1, 0, originalLuma, preferredScale);
    if (centerCandidate && centerCandidate.score < 0.08 && centerCandidate.overlap > 0.82) {
      return {
        success: true,
        transform: regularizeNearIdentityScale(original, modified, centerCandidate.transform),
        confidence: Math.max(0, Math.min(1, (1 - centerCandidate.score) * centerCandidate.overlap)),
        matchCount: Math.round(centerCandidate.overlap * originalWork.width * originalWork.height)
      };
    }
    const featureSeed = estimateFeatureSeed(
      originalLuma,
      modifiedBaseLuma,
      originalWork.width,
      originalWork.height,
      modifiedWorkBase.width,
      modifiedWorkBase.height,
      options
    );
    const momentSeed = estimateMomentSeed(
      originalLuma,
      modifiedBaseLuma,
      originalWork.width,
      originalWork.height,
      modifiedWorkBase.width,
      modifiedWorkBase.height,
      options
    );
    const cvCandidate = (openCvResult.success && openCvResult.transform)
      ? evaluateCandidate(
        originalWork,
        modifiedCanvas,
        sourceScale,
        openCvResult.transform.scaleX,
        openCvResult.transform.rotationDeg,
        originalLuma,
        preferredScale
      )
      : null;
    const featureCandidate = featureSeed
      ? evaluateCandidate(
        originalWork,
        modifiedCanvas,
        sourceScale,
        featureSeed.scale,
        featureSeed.rotationDeg,
        originalLuma,
        preferredScale,
        getSeedBoundsOffset(featureSeed, modifiedWorkBase.width, modifiedWorkBase.height)
      )
      : null;
    const momentCandidate = momentSeed
      ? evaluateCandidate(
        originalWork,
        modifiedCanvas,
        sourceScale,
        momentSeed.scale,
        momentSeed.rotationDeg,
        originalLuma,
        preferredScale,
        getSeedBoundsOffset(momentSeed, modifiedWorkBase.width, modifiedWorkBase.height)
      )
      : null;
    const coarseRotationCandidates = getCoarseRotationCandidates(options);
    const coarseResults = scaleCandidates
      .flatMap((scale) => coarseRotationCandidates.map((rotation) => evaluateCandidate(originalWork, modifiedCanvas, sourceScale, scale, rotation, originalLuma, preferredScale)))
      .filter((candidate): candidate is AutoAlignCandidate => candidate !== null)
      .sort((a, b) => a.score - b.score);
    const modelCandidates = [cvCandidate, featureCandidate, momentCandidate].filter((candidate): candidate is AutoAlignCandidate => candidate !== null);
    const refinementSeeds = [...modelCandidates, ...coarseResults].slice(0, 5);
    const refinedResults = refinementSeeds
      .flatMap((candidate) => getRefinedScaleCandidates([candidate.transform.scaleX], options)
        .flatMap((scale) => getRefinedRotationCandidates([candidate.transform.rotationDeg], options)
          .map((rotation) => evaluateCandidate(originalWork, modifiedCanvas, sourceScale, scale, rotation, originalLuma, preferredScale))))
      .filter((candidate): candidate is AutoAlignCandidate => candidate !== null)
      .sort((a, b) => a.score - b.score);
    const results = [...modelCandidates, ...coarseResults, ...refinedResults].sort((a, b) => a.score - b.score);
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
      transform: regularizeNearIdentityScale(original, modified, best.transform),
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
