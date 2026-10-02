import type { AlignmentPixels } from "../registrationEngine";
import { buildAffineMatrix } from "../transformUtils";
import type { ImageAffineTransform } from "../types";

export function createScene(seed = 42, width = 320, height = 240): AlignmentPixels {
  const data = new Uint8ClampedArray(width * height * 4);
  let state = seed;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 2 ** 32; };
  const shapes = Array.from({ length: 85 }, () => ({
    x: random() * width, y: random() * height, w: 4 + random() * 32, h: 4 + random() * 25,
    color: [random() * 255, random() * 255, random() * 255], circle: random() > 0.5
  }));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      data.set([220, 225, 230, 255], p);
      for (const shape of shapes) {
        const dx = (x - shape.x) / shape.w, dy = (y - shape.y) / shape.h;
        if (shape.circle ? dx * dx + dy * dy < 1 : Math.abs(dx) < 1 && Math.abs(dy) < 1) data.set(shape.color, p);
      }
    }
  }
  return { width, height, sourceWidth: width, sourceHeight: height, data };
}

export function transformScene(source: AlignmentPixels, width: number, height: number, transform: ImageAffineTransform): AlignmentPixels {
  const data = new Uint8ClampedArray(width * height * 4);
  const m = buildAffineMatrix(transform, width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = m.a * (x + 0.5) + m.c * (y + 0.5) + m.e - 0.5;
      const sy = m.b * (x + 0.5) + m.d * (y + 0.5) + m.f - 0.5;
      const p = (y * width + x) * 4;
      data.set([255, 255, 255, 255], p);
      if (sx < 0 || sy < 0 || sx >= source.width - 1 || sy >= source.height - 1) continue;
      const ix = Math.floor(sx), iy = Math.floor(sy), dx = sx - ix, dy = sy - iy;
      for (let c = 0; c < 4; c++) {
        const q = (iy * source.width + ix) * 4 + c;
        data[p + c] = (source.data[q] * (1 - dx) + source.data[q + 4] * dx) * (1 - dy)
          + (source.data[q + source.width * 4] * (1 - dx) + source.data[q + source.width * 4 + 4] * dx) * dy;
      }
    }
  }
  return { width, height, sourceWidth: width, sourceHeight: height, data };
}

export function transform(overrides: Partial<ImageAffineTransform> = {}): ImageAffineTransform {
  return { x: 160, y: 120, scaleX: 1, scaleY: 1, rotationDeg: 0, flipX: false, flipY: false, ...overrides };
}
