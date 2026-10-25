export interface ImageViewportState {
  zoom: number;
  centerX: number;
  centerY: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_VIEWPORT: ImageViewportState = { zoom: 1, centerX: 0.5, centerY: 0.5 };
export const MIN_FIT_ZOOM = 0.5;
export const MAX_PIXEL_SCALE = 16;
export const ZOOM_STEP = 1.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getFitScale(view: ViewportSize, content: ViewportSize): number {
  if (view.width <= 0 || view.height <= 0 || content.width <= 0 || content.height <= 0) {
    return 1;
  }
  return Math.min(view.width / content.width, view.height / content.height);
}

export function getMaxZoom(fitScale: number): number {
  return Math.max(1, MAX_PIXEL_SCALE / fitScale);
}

function clampCenter(center: number, visibleFraction: number): number {
  if (visibleFraction >= 1) {
    return 0.5;
  }
  return clamp(center, visibleFraction / 2, 1 - visibleFraction / 2);
}

export function clampViewport(viewport: ImageViewportState, view: ViewportSize, content: ViewportSize): ImageViewportState {
  const fitScale = getFitScale(view, content);
  const zoom = clamp(viewport.zoom, MIN_FIT_ZOOM, getMaxZoom(fitScale));
  const scale = fitScale * zoom;
  return {
    zoom,
    centerX: clampCenter(viewport.centerX, view.width / (content.width * scale)),
    centerY: clampCenter(viewport.centerY, view.height / (content.height * scale))
  };
}

export function getViewTransform(viewport: ImageViewportState, view: ViewportSize, content: ViewportSize): ViewTransform {
  const clamped = clampViewport(viewport, view, content);
  const scale = getFitScale(view, content) * clamped.zoom;
  return {
    scale,
    offsetX: view.width / 2 - clamped.centerX * content.width * scale,
    offsetY: view.height / 2 - clamped.centerY * content.height * scale
  };
}

export function zoomAtPoint(
  viewport: ImageViewportState,
  nextZoom: number,
  point: { x: number; y: number },
  view: ViewportSize,
  content: ViewportSize
): ImageViewportState {
  const before = getViewTransform(viewport, view, content);
  const contentX = (point.x - before.offsetX) / (content.width * before.scale);
  const contentY = (point.y - before.offsetY) / (content.height * before.scale);
  const fitScale = getFitScale(view, content);
  const zoom = clamp(nextZoom, MIN_FIT_ZOOM, getMaxZoom(fitScale));
  const scale = fitScale * zoom;
  return clampViewport({
    zoom,
    centerX: contentX - (point.x - view.width / 2) / (content.width * scale),
    centerY: contentY - (point.y - view.height / 2) / (content.height * scale)
  }, view, content);
}

export function panViewport(
  viewport: ImageViewportState,
  deltaX: number,
  deltaY: number,
  view: ViewportSize,
  content: ViewportSize
): ImageViewportState {
  const { scale } = getViewTransform(viewport, view, content);
  return clampViewport({
    zoom: viewport.zoom,
    centerX: viewport.centerX - deltaX / (content.width * scale),
    centerY: viewport.centerY - deltaY / (content.height * scale)
  }, view, content);
}

export function zoomForPixelScale(pixelScale: number, fitScale: number): number {
  return pixelScale / fitScale;
}
