import type { ViewTransform, ViewportSize } from "./viewport";

export type DrawableLayer = CanvasImageSource & { width: number; height: number };

const pyramids = new WeakMap<DrawableLayer, Array<DrawableLayer>>();

function halveLayer(layer: DrawableLayer): DrawableLayer | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(layer.width / 2));
  canvas.height = Math.max(1, Math.ceil(layer.height / 2));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(layer, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function getLayerForDeviceScale(layer: DrawableLayer, deviceScale: number): DrawableLayer {
  const targetWidth = layer.width * deviceScale;
  const pyramid = pyramids.get(layer) ?? [layer];
  pyramids.set(layer, pyramid);
  let level = pyramid[0];
  for (let index = 1; level.width / 2 >= targetWidth && level.width > 1; index++) {
    const next = pyramid[index] ?? halveLayer(level);
    if (!next) break;
    pyramid[index] = next;
    level = next;
  }
  return level;
}

export function drawLayer(ctx: CanvasRenderingContext2D, layer: DrawableLayer, transform: ViewTransform, size: ViewportSize = layer): void {
  const deviceScale = transform.scale * (ctx.getTransform().a || 1) * (size.width / layer.width);
  const source = getLayerForDeviceScale(layer, deviceScale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, transform.offsetX, transform.offsetY, size.width * transform.scale, size.height * transform.scale);
}
