import type { ImageAffineTransform, ImageAlignmentOptions } from "./types";

export interface AlignmentPixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  sourceWidth: number;
  sourceHeight: number;
}

export interface RegistrationResult {
  transform: ImageAffineTransform;
  confidence: number;
  matchCount: number;
}

interface GrayImage {
  width: number;
  height: number;
  values: Float32Array;
  alpha: Float32Array;
}

interface Feature {
  x: number;
  y: number;
  descriptor: Float32Array;
}

interface Match {
  source: Feature;
  target: Feature;
  distance: number;
}

interface Similarity {
  a: number;
  b: number;
  x: number;
  y: number;
}

const TAU = Math.PI * 2;
const MIN_MATCHES = 6;

function grayImage(image: AlignmentPixels): GrayImage {
  const values = new Float32Array(image.width * image.height);
  const alpha = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) {
    const p = i * 4;
    alpha[i] = image.data[p + 3] / 255;
    values[i] = ((image.data[p] * 0.299 + image.data[p + 1] * 0.587 + image.data[p + 2] * 0.114) / 255) * alpha[i] + 1 - alpha[i];
  }
  return { width: image.width, height: image.height, values, alpha };
}

function sample(values: Float32Array, width: number, x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const dx = x - ix;
  const dy = y - iy;
  const p = iy * width + ix;
  return (values[p] * (1 - dx) + values[p + 1] * dx) * (1 - dy)
    + (values[p + width] * (1 - dx) + values[p + width + 1] * dx) * dy;
}

function reduce(image: GrayImage): GrayImage {
  const width = Math.floor(image.width / Math.SQRT2);
  const height = Math.floor(image.height / Math.SQRT2);
  const values = new Float32Array(width * height);
  const alpha = new Float32Array(values.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = (x + 0.5) * image.width / width - 0.5;
      const sy = (y + 0.5) * image.height / height - 0.5;
      values[y * width + x] = sample(image.values, image.width, sx, sy);
      alpha[y * width + x] = sample(image.alpha, image.width, sx, sy);
    }
  }
  return { width, height, values, alpha };
}

function blur(image: GrayImage): GrayImage {
  const { width, height, values } = image;
  const temp = new Float32Array(values.length);
  const output = new Float32Array(values.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      temp[p] = (values[y * width + Math.max(0, x - 1)] + 2 * values[p] + values[y * width + Math.min(width - 1, x + 1)]) / 4;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      output[p] = (temp[Math.max(0, y - 1) * width + x] + 2 * temp[p] + temp[Math.min(height - 1, y + 1) * width + x]) / 4;
    }
  }
  return { ...image, values: output };
}

function describePoint(gx: Float32Array, gy: Float32Array, width: number, x: number, y: number, angle: number): Float32Array {
  const descriptor = new Float32Array(128);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let dy = -12; dy < 12; dy++) {
    for (let dx = -12; dx < 12; dx++) {
      const sx = x + cos * dx - sin * dy;
      const sy = y + sin * dx + cos * dy;
      const vx = sample(gx, width, sx, sy);
      const vy = sample(gy, width, sx, sy);
      const magnitude = Math.hypot(vx, vy) * Math.exp(-(dx * dx + dy * dy) / 180);
      const orientation = ((Math.atan2(vy, vx) - angle + TAU * 2) % TAU) * 8 / TAU;
      const bin = Math.floor(orientation);
      const cx = (dx + 12) / 6 - 0.5;
      const cy = (dy + 12) / 6 - 0.5;
      for (let by = Math.max(0, Math.floor(cy)); by <= Math.min(3, Math.floor(cy) + 1); by++) {
        for (let bx = Math.max(0, Math.floor(cx)); bx <= Math.min(3, Math.floor(cx) + 1); bx++) {
          const weight = magnitude * (1 - Math.abs(cx - bx)) * (1 - Math.abs(cy - by));
          const offset = (by * 4 + bx) * 8;
          descriptor[offset + bin] += weight * (1 - orientation + bin);
          descriptor[offset + (bin + 1) % 8] += weight * (orientation - bin);
        }
      }
    }
  }
  let norm = Math.sqrt(descriptor.reduce((sum, v) => sum + v * v, 0));
  for (let i = 0; i < descriptor.length; i++) descriptor[i] = Math.min(0.2, descriptor[i] / Math.max(norm, 1e-9));
  norm = Math.sqrt(descriptor.reduce((sum, v) => sum + v * v, 0));
  for (let i = 0; i < descriptor.length; i++) descriptor[i] /= Math.max(norm, 1e-9);
  return descriptor;
}

function features(input: AlignmentPixels): Feature[] {
  const result: Feature[] = [];
  let image = blur(grayImage(input));
  for (let level = 0; level < 6 && Math.min(image.width, image.height) >= 56; level++) {
    const { width, height, values, alpha } = image;
    const gx = new Float32Array(values.length);
    const gy = new Float32Array(values.length);
    const response = new Float32Array(values.length);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const p = y * width + x;
        gx[p] = values[p + 1] - values[p - 1];
        gy[p] = values[p + width] - values[p - width];
      }
    }
    const candidates: { x: number; y: number; response: number }[] = [];
    for (let y = 19; y < height - 19; y++) {
      for (let x = 19; x < width - 19; x++) {
        if (alpha[y * width + x] < 0.9) continue;
        let xx = 0, yy = 0, xy = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const p = (y + dy) * width + x + dx;
            xx += gx[p] * gx[p];
            yy += gy[p] * gy[p];
            xy += gx[p] * gy[p];
          }
        }
        response[y * width + x] = xx * yy - xy * xy - 0.04 * (xx + yy) ** 2;
      }
    }
    for (let y = 20; y < height - 20; y++) {
      for (let x = 20; x < width - 20; x++) {
        const p = y * width + x;
        const value = response[p];
        if (value < 0.00001) continue;
        if ([p - 1, p + 1, p - width, p + width, p - width - 1, p - width + 1, p + width - 1, p + width + 1].some(i => response[i] > value)) continue;
        candidates.push({ x, y, response: value });
      }
    }
    candidates.sort((a, b) => b.response - a.response);
    const selected: { x: number; y: number }[] = [];
    for (const point of candidates) {
      if (selected.some(p => Math.hypot(p.x - point.x, p.y - point.y) < 7)) continue;
      selected.push(point);
      const histogram = new Float32Array(36);
      for (let dy = -8; dy <= 8; dy++) {
        for (let dx = -8; dx <= 8; dx++) {
          const p = (point.y + dy) * width + point.x + dx;
          const bin = Math.floor((Math.atan2(gy[p], gx[p]) + TAU) % TAU * 36 / TAU);
          histogram[bin] += Math.hypot(gx[p], gy[p]) * Math.exp(-(dx * dx + dy * dy) / 50);
        }
      }
      const smooth = histogram.map((v, i) => (histogram[(i + 35) % 36] + v * 2 + histogram[(i + 1) % 36]) / 4);
      const max = Math.max(...smooth);
      const orientations: number[] = [];
      for (let i = 0; i < 36; i++) {
        const left = smooth[(i + 35) % 36], right = smooth[(i + 1) % 36];
        if (smooth[i] < max * 0.85 || smooth[i] <= left || smooth[i] <= right) continue;
        const offset = 0.5 * (left - right) / (left - 2 * smooth[i] + right);
        orientations.push((i + 0.5 + offset) * TAU / 36);
      }
      for (const angle of orientations.slice(0, 2)) {
        result.push({
          x: (point.x + 0.5) * input.sourceWidth / width,
          y: (point.y + 0.5) * input.sourceHeight / height,
          descriptor: describePoint(gx, gy, width, point.x, point.y, angle)
        });
      }
      if (selected.length >= 160) break;
    }
    image = blur(reduce(image));
  }
  return result;
}

function matchFeatures(targets: Feature[], sources: Feature[], sourceSize: number, targetSize: number): Match[] {
  const matches: Match[] = [];
  for (const source of sources) {
    let best = Infinity, second = Infinity;
    let target: Feature | undefined;
    for (const candidate of targets) {
      let distance = 0;
      for (let i = 0; i < source.descriptor.length; i++) {
        distance += (source.descriptor[i] - candidate.descriptor[i]) ** 2;
        if (distance > second) break;
      }
      if (distance < best) {
        if (!target || Math.hypot(target.x - candidate.x, target.y - candidate.y) > targetSize * 0.008) second = best;
        target = candidate;
        best = distance;
      } else if (distance < second && target && Math.hypot(target.x - candidate.x, target.y - candidate.y) > targetSize * 0.008) second = distance;
    }
    if (target && best < 0.55 && best < second * 0.64) matches.push({ source, target, distance: best });
  }
  matches.sort((a, b) => a.distance - b.distance);
  const unique: Match[] = [];
  for (const match of matches) {
    if (unique.some(m => Math.hypot(m.source.x - match.source.x, m.source.y - match.source.y) < sourceSize * 0.008
      || Math.hypot(m.target.x - match.target.x, m.target.y - match.target.y) < targetSize * 0.008)) continue;
    unique.push(match);
  }
  return unique;
}

function fit(matches: Match[], options: ImageAlignmentOptions): Similarity | null {
  let sx = 0, sy = 0, tx = 0, ty = 0;
  for (const m of matches) { sx += m.source.x; sy += m.source.y; tx += m.target.x; ty += m.target.y; }
  sx /= matches.length; sy /= matches.length; tx /= matches.length; ty /= matches.length;
  let dot = 0, cross = 0, denominator = 0;
  for (const m of matches) {
    const x = m.source.x - sx, y = m.source.y - sy;
    dot += x * (m.target.x - tx) + y * (m.target.y - ty);
    cross += x * (m.target.y - ty) - y * (m.target.x - tx);
    denominator += x * x + y * y;
  }
  if (denominator < 1e-6) return null;
  const angle = options.rotate ? Math.atan2(cross, dot) : 0;
  const scale = options.scale ? (options.rotate ? Math.hypot(dot, cross) : dot) / denominator : 1;
  if (scale < 0.01 || scale > 20) return null;
  const a = Math.cos(angle) * scale, b = Math.sin(angle) * scale;
  return { a, b, x: tx - a * sx + b * sy, y: ty - b * sx - a * sy };
}

function error(model: Similarity, match: Match): number {
  return Math.hypot(model.a * match.source.x - model.b * match.source.y + model.x - match.target.x,
    model.b * match.source.x + model.a * match.source.y + model.y - match.target.y);
}

function consensus(matches: Match[], options: ImageAlignmentOptions, threshold: number): { model: Similarity; inliers: Match[] } | null {
  let best: Match[] = [];
  let bestError = Infinity;
  let randomState = 0x12345678;
  const randomIndex = () => {
    randomState ^= randomState << 13; randomState ^= randomState >>> 17; randomState ^= randomState << 5;
    return (randomState >>> 0) % matches.length;
  };
  for (let i = 0; i < Math.min(1600, matches.length * matches.length); i++) {
    const first = matches[randomIndex()], second = matches[randomIndex()];
    if (first === second || Math.hypot(first.source.x - second.source.x, first.source.y - second.source.y) < threshold * 3) continue;
    const model = fit([first, second], options);
    if (!model) continue;
    const inliers = matches.filter(m => error(model, m) <= threshold);
    const totalError = inliers.reduce((sum, m) => sum + error(model, m), 0);
    if (inliers.length > best.length || (inliers.length === best.length && totalError < bestError)) {
      best = inliers;
      bestError = totalError;
    }
  }
  if (best.length < MIN_MATCHES || best.length < matches.length * 0.25) return null;
  let model = fit(best, options);
  for (let i = 0; i < 3 && model; i++) {
    const current = model;
    best = matches.filter(m => error(current, m) <= threshold);
    model = fit(best, options);
  }
  return model && best.length >= MIN_MATCHES ? { model, inliers: best } : null;
}

function refinePixels(original: AlignmentPixels, modified: AlignmentPixels, seed: Similarity, options: ImageAlignmentOptions): Similarity {
  const target = grayImage(original), source = grayImage(modified);
  const points: { x: number; y: number; value: number }[] = [];
  const step = Math.max(1, Math.ceil(Math.sqrt(source.width * source.height / 6000)));
  for (let y = 1; y < source.height - 1; y += step) {
    for (let x = 1; x < source.width - 1; x += step) {
      const p = y * source.width + x;
      if (source.alpha[p] < 0.9) continue;
      const sx = (x + 0.5) * modified.sourceWidth / source.width;
      const sy = (y + 0.5) * modified.sourceHeight / source.height;
      const tx = (seed.a * sx - seed.b * sy + seed.x) * target.width / original.sourceWidth - 0.5;
      const ty = (seed.b * sx + seed.a * sy + seed.y) * target.height / original.sourceHeight - 0.5;
      if (tx < 2 || ty < 2 || tx >= target.width - 3 || ty >= target.height - 3) continue;
      if (sample(target.alpha, target.width, tx, ty) < 0.9) continue;
      points.push({ x: sx, y: sy, value: source.values[p] });
    }
  }
  if (points.length < 64) return seed;
  const cx = modified.sourceWidth / 2, cy = modified.sourceHeight / 2;
  const toModel = ([x, y, scale, angle]: number[]): Similarity => {
    const a = Math.cos(angle) * scale, b = Math.sin(angle) * scale;
    return { a, b, x: x - a * cx + b * cy, y: y - b * cx - a * cy };
  };
  const score = (parameters: number[]) => {
    const m = toModel(parameters);
    let sum = 0;
    for (const p of points) {
      const x = (m.a * p.x - m.b * p.y + m.x) * target.width / original.sourceWidth - 0.5;
      const y = (m.b * p.x + m.a * p.y + m.y) * target.height / original.sourceHeight - 0.5;
      const difference = x < 0 || y < 0 || x >= target.width - 1 || y >= target.height - 1
        ? 0.15 : Math.abs(sample(target.values, target.width, x, y) - p.value);
      sum += Math.min(difference, 0.15);
    }
    return sum / points.length;
  };
  let parameters = [seed.a * cx - seed.b * cy + seed.x, seed.b * cx + seed.a * cy + seed.y, Math.hypot(seed.a, seed.b), Math.atan2(seed.b, seed.a)];
  let best = score(parameters);
  if (best > 0.03) return seed;
  const pixel = original.sourceWidth / original.width;
  const scale = parameters[2];
  const radius = Math.max(modified.sourceWidth, modified.sourceHeight) * scale;
  for (let level = 0; level < 5; level++) {
    const delta = pixel / 2 ** level;
    const steps = [delta, delta, options.scale ? delta * scale / radius : 0, options.rotate ? delta / radius : 0];
    for (let iteration = 0; iteration < 8; iteration++) {
      let improved = false;
      for (let axis = 0; axis < steps.length; axis++) {
        if (!steps[axis]) continue;
        for (const direction of [-1, 1]) {
          const candidate = [...parameters];
          candidate[axis] += direction * steps[axis];
          const cost = score(candidate);
          if (cost < best) { parameters = candidate; best = cost; improved = true; }
        }
      }
      if (!improved) break;
    }
  }
  // Prefer an exact raster transform only when the pixels support it.
  const simpleScales = options.scale ? [1, original.sourceWidth / modified.sourceWidth] : [1];
  for (const candidateScale of simpleScales) {
    if (Math.abs(candidateScale - parameters[2]) * Math.max(cx, cy) > pixel) continue;
    if (Math.abs(parameters[3]) * radius > pixel) continue;
    const candidate = [Math.round(parameters[0] - cx * candidateScale) + cx * candidateScale,
      Math.round(parameters[1] - cy * candidateScale) + cy * candidateScale, candidateScale, 0];
    if (score(candidate) <= best + 1e-7) { parameters = candidate; best = score(candidate); }
  }
  return toModel(parameters);
}

export function registerImages(original: AlignmentPixels, modified: AlignmentPixels, options: ImageAlignmentOptions): RegistrationResult | null {
  if (options.warp) return null;
  for (const image of [original, modified]) {
    if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1
      || image.data.length !== image.width * image.height * 4 || !Number.isFinite(image.sourceWidth) || !Number.isFinite(image.sourceHeight)
      || image.sourceWidth <= 0 || image.sourceHeight <= 0) return null;
  }
  const originalSize = Math.max(original.sourceWidth, original.sourceHeight);
  const modifiedSize = Math.max(modified.sourceWidth, modified.sourceHeight);
  const matches = matchFeatures(features(original), features(modified), modifiedSize, originalSize);
  if (matches.length < MIN_MATCHES) return null;
  const threshold = 3 * originalSize / Math.max(original.width, original.height);
  const result = consensus(matches, options, threshold);
  if (!result) return null;
  const { inliers } = result;
  const model = inliers.length / matches.length >= 0.6 ? refinePixels(original, modified, result.model, options) : result.model;
  const xs = inliers.map(m => m.target.x), ys = inliers.map(m => m.target.y);
  if ((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)) < original.sourceWidth * original.sourceHeight * 0.01) return null;
  const scale = Math.hypot(model.a, model.b);
  return {
    transform: {
      x: model.a * modified.sourceWidth / 2 - model.b * modified.sourceHeight / 2 + model.x,
      y: model.b * modified.sourceWidth / 2 + model.a * modified.sourceHeight / 2 + model.y,
      scaleX: scale, scaleY: scale, rotationDeg: Math.atan2(model.b, model.a) * 180 / Math.PI,
      flipX: false, flipY: false
    },
    confidence: inliers.length / matches.length,
    matchCount: inliers.length
  };
}
