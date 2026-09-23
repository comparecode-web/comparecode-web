import { describe, expect, it, vi } from "vitest";
import { createQrSvg, createQrSymbol, DEFAULT_QR_COLORS, drawQrCanvas, getQrColorError, getQrColorWarning, QR_BORDER } from "../qrImage";

describe("QR image generation", () => {
  it("includes the required clear border and encodes without embedding raw content in SVG", () => {
    const symbol = createQrSymbol("Árvíztűrő 🙂", "M");
    const svg = createQrSvg(symbol, DEFAULT_QR_COLORS);
    const total = symbol.modules.size + QR_BORDER * 2;
    expect(svg).toContain(`viewBox="0 0 ${total} ${total}"`);
    expect(svg).toContain(`M0 0h${total}v${total}H0z`);
    expect(svg).not.toContain("Árvíztűrő");
    expect(svg).not.toContain("🙂");
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill="#ffffff"');
  });

  it("draws an exact-size PNG canvas with sharp integer pixel boundaries", () => {
    const symbol = createQrSymbol("https://example.com", "M");
    const fillRect = vi.fn();
    const context = { fillRect, fillStyle: "" } as unknown as CanvasRenderingContext2D;
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    try {
      const canvas = drawQrCanvas(symbol, DEFAULT_QR_COLORS, 1024);
      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(1024);
      expect(fillRect).toHaveBeenCalledWith(0, 0, 1024, 1024);
      for (const call of fillRect.mock.calls) {
        expect(call.every(Number.isInteger)).toBe(true);
      }
    } finally {
      getContext.mockRestore();
    }
  });

  it("rejects invalid color syntax but only warns about difficult-to-scan colors", () => {
    expect(getQrColorError(DEFAULT_QR_COLORS)).toBeNull();
    expect(getQrColorWarning(DEFAULT_QR_COLORS)).toBeNull();
    expect(getQrColorError({ dark: "red", light: "#ffffff" })).toMatch(/hex/);
    expect(getQrColorWarning({ dark: "red", light: "#ffffff" })).toBeNull();
    expect(getQrColorError({ dark: "#ffffff", light: "#000000" })).toBeNull();
    expect(getQrColorWarning({ dark: "#ffffff", light: "#000000" })).toMatch(/darker/);
    expect(getQrColorError({ dark: "#aaaaaa", light: "#ffffff" })).toBeNull();
    expect(getQrColorWarning({ dark: "#aaaaaa", light: "#ffffff" })).toMatch(/contrast/);
  });
});
