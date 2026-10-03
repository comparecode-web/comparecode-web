import { describe, expect, it } from "vitest";
import { createQrSvg, createQrSymbol, DEFAULT_QR_COLORS, drawQrCanvas, QR_BORDER } from "../qrImage";
import { DEFAULT_QR_STYLE, qrShapePaths, type QrEyeShape, type QrModuleShape } from "../qrShapes";
import { vi } from "vitest";

describe("styled QR rendering", () => {
  const symbol = createQrSymbol("https://example.com", "M");
  const modules: QrModuleShape[] = ["square", "rounded", "dots", "connected"];
  const eyes: QrEyeShape[] = ["square", "rounded", "circle"];
  it.each(modules)("shares %s geometry and colors between SVG and PNG", module => {
    const fill = vi.fn();
    const scale = vi.fn();
    const context = { fillRect: vi.fn(), fill, scale, fillStyle: "" };
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    class TestPath { constructor(public d: string) {} }
    vi.stubGlobal("Path2D", TestPath);
    try {
      for (const border of eyes) for (const center of eyes) {
        const style = { ...DEFAULT_QR_STYLE, modules: module, border, center, borderColor: "#123456", centerColor: "#234567" };
        const paths = qrShapePaths(symbol, style, DEFAULT_QR_COLORS, QR_BORDER);
        const svg = createQrSvg(symbol, DEFAULT_QR_COLORS, style);
        fill.mockClear();
        const canvas = drawQrCanvas(symbol, DEFAULT_QR_COLORS, 512, style);
        expect([canvas.width, canvas.height]).toEqual([512, 512]);
        expect(fill.mock.calls.map(([path]) => path.d)).toEqual(paths.map(path => path.d));
        for (const path of paths) expect(svg).toContain(`<path fill="${path.fill}" d="${path.d}"/>`);
        expect(svg).toContain(`viewBox="0 0 ${symbol.modules.size + 8} ${symbol.modules.size + 8}"`);
      }
    } finally { getContext.mockRestore(); vi.unstubAllGlobals(); }
  });
  it("rejects unsafe custom corner colors before rendering", () => {
    const style = { ...DEFAULT_QR_STYLE, borderColor: '\"/><script>alert(1)</script>' };
    expect(() => createQrSvg(symbol, DEFAULT_QR_COLORS, style)).toThrow(/hex/);
    expect(() => drawQrCanvas(symbol, DEFAULT_QR_COLORS, 512, style)).toThrow(/hex/);
  });
  it("does not change the QR matrix when styling it", () => {
    const before = [...symbol.modules.data];
    for (const shape of modules) qrShapePaths(symbol, { ...DEFAULT_QR_STYLE, modules: shape }, DEFAULT_QR_COLORS, QR_BORDER);
    expect([...symbol.modules.data]).toEqual(before);
  });
});
