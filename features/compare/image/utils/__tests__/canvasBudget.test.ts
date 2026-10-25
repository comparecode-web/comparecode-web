import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_CANVAS_SIDE, MAX_WORKING_PIXELS, SAFE_CANVAS_PIXELS, canAllocateCanvas, getWorkingScale, scaleSize } from "../canvasBudget";

describe("canvasBudget", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps images that every browser can draw at full resolution without probing", () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    expect(getWorkingScale(4000, 3000)).toBe(1);
    expect(canAllocateCanvas(4096, 4096)).toBe(true);
    expect(getContext).not.toHaveBeenCalled();
  });

  it("rejects empty sizes", () => {
    expect(canAllocateCanvas(0, 100)).toBe(false);
    expect(getWorkingScale(0, 100)).toBe(1);
  });

  it("limits the longest side", () => {
    const scale = getWorkingScale(40_000, 100);
    expect(scale).toBeCloseTo(MAX_CANVAS_SIDE / 40_000, 6);
    expect(scaleSize(40_000, 100, scale).width).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
  });

  it("uses the working pixel budget when the browser can allocate it", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ({
      fillStyle: "",
      fillRect: vi.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray([0, 0, 0, 255]) })
    }) as unknown as CanvasRenderingContext2D);
    const scale = getWorkingScale(8_000, 6_000);
    const size = scaleSize(8_000, 6_000, scale);
    expect(size.width * size.height).toBeLessThanOrEqual(MAX_WORKING_PIXELS + size.width + size.height);
    expect(size.width * size.height).toBeGreaterThan(SAFE_CANVAS_PIXELS);
  });

  it("falls back to the size every browser supports when a large canvas cannot be allocated", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const scale = getWorkingScale(9_000, 7_000);
    const size = scaleSize(9_000, 7_000, scale);
    expect(size.width * size.height).toBeLessThanOrEqual(SAFE_CANVAS_PIXELS);
    expect(canAllocateCanvas(9_000, 7_000)).toBe(false);
  });
});
