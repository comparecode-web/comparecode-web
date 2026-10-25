import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEWPORT,
  MAX_PIXEL_SCALE,
  MIN_FIT_ZOOM,
  clampViewport,
  getFitScale,
  getMaxZoom,
  getViewTransform,
  panViewport,
  zoomAtPoint,
  zoomForPixelScale
} from "../viewport";

const view = { width: 400, height: 300 };
const content = { width: 800, height: 600 };

describe("image viewport math", () => {
  it("fits and centers content by default", () => {
    expect(getFitScale(view, content)).toBe(0.5);
    expect(getViewTransform(DEFAULT_VIEWPORT, view, content)).toEqual({ scale: 0.5, offsetX: 0, offsetY: 0 });
    expect(getViewTransform(DEFAULT_VIEWPORT, view, { width: 400, height: 100 })).toEqual({ scale: 1, offsetX: 0, offsetY: 100 });
  });

  it("limits zoom between half of the fit size and the maximum pixel scale", () => {
    expect(clampViewport({ ...DEFAULT_VIEWPORT, zoom: 0.1 }, view, content).zoom).toBe(MIN_FIT_ZOOM);
    expect(getMaxZoom(0.5)).toBe(MAX_PIXEL_SCALE / 0.5);
    expect(clampViewport({ ...DEFAULT_VIEWPORT, zoom: 1000 }, view, content).zoom).toBe(32);
  });

  it("keeps the content point under the cursor while zooming", () => {
    const point = { x: 100, y: 75 };
    const before = getViewTransform(DEFAULT_VIEWPORT, view, content);
    const contentPoint = { x: (point.x - before.offsetX) / before.scale, y: (point.y - before.offsetY) / before.scale };
    const zoomed = zoomAtPoint(DEFAULT_VIEWPORT, 4, point, view, content);
    const after = getViewTransform(zoomed, view, content);
    expect(contentPoint.x * after.scale + after.offsetX).toBeCloseTo(point.x, 6);
    expect(contentPoint.y * after.scale + after.offsetY).toBeCloseTo(point.y, 6);
  });

  it("pans in screen pixels and stops at the content edges", () => {
    const zoomed = { zoom: 2, centerX: 0.5, centerY: 0.5 };
    expect(panViewport(zoomed, -100, 0, view, content).centerX).toBeCloseTo(0.625, 6);
    const clamped = panViewport(zoomed, -10_000, 10_000, view, content);
    expect(clamped.centerX).toBeCloseTo(0.75, 6);
    expect(clamped.centerY).toBeCloseTo(0.25, 6);
    expect(panViewport(DEFAULT_VIEWPORT, 50, 50, view, content)).toEqual(DEFAULT_VIEWPORT);
  });

  it("converts a pixel scale to a fit-relative zoom", () => {
    expect(zoomForPixelScale(1, 0.5)).toBe(2);
    expect(getViewTransform({ ...DEFAULT_VIEWPORT, zoom: zoomForPixelScale(1, 0.5) }, view, content).scale).toBe(1);
  });
});
