import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAlignedPair } from "../ImageDiffService";

describe("ImageDiffService createAlignedPair", () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
  });

  function createMockCanvas(width: number, height: number) {
    const drawImageMock = vi.fn();
    const getImageDataMock = vi.fn((_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4)
    }));

    const ctx = {
      drawImage: drawImageMock,
      getImageData: getImageDataMock,
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn()
    } as unknown as CanvasRenderingContext2D;

    const canvas = {
      width,
      height,
      getContext: vi.fn(() => ctx)
    } as unknown as HTMLCanvasElement;

    return { canvas, ctx, drawImageMock, getImageDataMock };
  }

  it("returns original and modified data directly when dimensions are identical and no transform is provided", () => {
    const orig = createMockCanvas(1920, 1080);
    const mod = createMockCanvas(1920, 1080);

    const result = createAlignedPair(orig, mod, null);

    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(orig.getImageDataMock).toHaveBeenCalledWith(0, 0, 1920, 1080);
    expect(mod.getImageDataMock).toHaveBeenCalledWith(0, 0, 1920, 1080);
  });

  it("scales both images to common bounds when dimensions differ with matching aspect ratio and no transform is provided", () => {
    interface MockContext {
      drawImage: ReturnType<typeof vi.fn>;
      getImageData: ReturnType<typeof vi.fn>;
      imageSmoothingEnabled: boolean;
      imageSmoothingQuality: string;
    }
    const createdContexts: MockContext[] = [];
    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => {
      const ctx: MockContext = {
        drawImage: vi.fn(),
        getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4)
        })),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: "low"
      };
      createdContexts.push(ctx);
      return ctx as unknown as CanvasRenderingContext2D;
    });

    const orig = createMockCanvas(1910, 1098);
    const mod = createMockCanvas(1024, 590);

    const result = createAlignedPair(orig, mod, null);

    expect(result.width).toBe(1910);
    expect(result.height).toBe(1098);
    expect(createdContexts.length).toBe(2);
    expect(createdContexts[0].imageSmoothingEnabled).toBe(true);
    expect(createdContexts[0].imageSmoothingQuality).toBe("high");
    expect(createdContexts[0].drawImage).toHaveBeenCalledWith(orig.canvas, 0, 0, 1910, 1098);
    expect(createdContexts[1].imageSmoothingEnabled).toBe(true);
    expect(createdContexts[1].imageSmoothingQuality).toBe("high");
    expect(createdContexts[1].drawImage).toHaveBeenCalledWith(mod.canvas, 0, 0, 1910, 1098);
  });

  it("preserves aspect ratio without stretching when aspect ratios differ and no transform is provided", () => {
    interface MockContext {
      canvasWidth: number;
      canvasHeight: number;
      buffer: Uint8ClampedArray;
      drawImage: ReturnType<typeof vi.fn>;
      getImageData: ReturnType<typeof vi.fn>;
      imageSmoothingEnabled: boolean;
      imageSmoothingQuality: string;
    }
    const createdContexts: MockContext[] = [];
    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (this: HTMLCanvasElement) {
      const w = this.width;
      const h = this.height;
      const buffer = new Uint8ClampedArray(w * h * 4);
      const ctx: MockContext = {
        canvasWidth: w,
        canvasHeight: h,
        buffer,
        drawImage: vi.fn((img: HTMLCanvasElement, dx: number, dy: number, dw?: number, dh?: number) => {
          // If dw and dh are provided, stretching occurs; otherwise natural dimensions are drawn
          const drawW = dw !== undefined ? dw : img.width;
          const drawH = dh !== undefined ? dh : img.height;
          for (let y = 0; y < drawH; y++) {
            for (let x = 0; x < drawW; x++) {
              const targetX = dx + x;
              const targetY = dy + y;
              if (targetX < w && targetY < h) {
                const idx = (targetY * w + targetX) * 4;
                buffer[idx] = 255;     // R
                buffer[idx + 1] = 255; // G
                buffer[idx + 2] = 255; // B
                buffer[idx + 3] = 255; // A
              }
            }
          }
        }),
        getImageData: vi.fn(() => ({
          data: buffer
        })),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: "low"
      };
      createdContexts.push(ctx);
      return ctx as unknown as CanvasRenderingContext2D;
    });

    // 800x450 (16:9) vs 400x400 (1:1)
    const orig = createMockCanvas(800, 450);
    const mod = createMockCanvas(400, 400);

    const result = createAlignedPair(orig, mod, null);

    expect(result.width).toBe(800);
    expect(result.height).toBe(450);
    expect(createdContexts.length).toBe(2);

    // Mismatched aspect ratios should NOT be scaled with (w, h)
    expect(createdContexts[0].drawImage).toHaveBeenCalledWith(orig.canvas, 0, 0);
    expect(createdContexts[1].drawImage).toHaveBeenCalledWith(mod.canvas, 0, 0);
    expect(createdContexts[1].drawImage).not.toHaveBeenCalledWith(mod.canvas, 0, 0, 800, 450);

    // Verify modified image pixel geometry:
    // Inside the 400x400 area, pixel is solid
    const insideIdx = (200 * 800 + 200) * 4;
    expect(result.modifiedData[insideIdx + 3]).toBe(255);

    // To the right (x=600, y=200): transparent margin
    const rightMarginIdx = (200 * 800 + 600) * 4;
    expect(result.modifiedData[rightMarginIdx + 3]).toBe(0);

    // Below (x=200, y=425): transparent margin
    const bottomMarginIdx = (425 * 800 + 200) * 4;
    expect(result.modifiedData[bottomMarginIdx + 3]).toBe(0);
  });
});
