import { afterEach, describe, expect, it, vi } from "vitest";
import { drawLayer, getLayerForDeviceScale } from "../layerRendering";

function createLayer(width: number, height: number): HTMLCanvasElement {
  return Object.assign(document.createElement("canvas"), { width, height });
}

describe("layerRendering", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("always draws with high-quality smoothing, even when magnified", () => {
    const ctx = {
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
      getTransform: () => ({ a: 1 }),
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D;
    drawLayer(ctx, createLayer(100, 50), { scale: 16, offsetX: 0, offsetY: 0 });
    expect(ctx.imageSmoothingEnabled).toBe(true);
    expect(ctx.imageSmoothingQuality).toBe("high");
  });

  it("draws from the full-size layer unless the view halves it", () => {
    const layer = createLayer(1000, 500);
    expect(getLayerForDeviceScale(layer, 1)).toBe(layer);
    expect(getLayerForDeviceScale(layer, 0.6)).toBe(layer);
  });

  it("picks a cached half-size level that still covers the target size", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    const layer = createLayer(4000, 2000);

    const level = getLayerForDeviceScale(layer, 0.2);
    expect(level.width).toBe(1000);
    expect(level.height).toBe(500);
    expect(getLayerForDeviceScale(layer, 0.2)).toBe(level);
    expect(getLayerForDeviceScale(layer, 0.4).width).toBe(2000);
  });
});
