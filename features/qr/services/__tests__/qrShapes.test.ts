import { describe, expect, it } from "vitest";
import { createQrSvg, createQrSymbol, DEFAULT_QR_COLORS, drawQrCanvas, QR_BORDER } from "../qrImage";
import { DEFAULT_QR_STYLE, QR_BORDER_SHAPES, QR_CENTER_SHAPES, QR_MODULE_SHAPES, qrShapePaths, type QrModuleShape } from "../qrShapes";
import { vi } from "vitest";

describe("styled QR rendering", () => {
  const symbol = createQrSymbol("https://example.com", "M");
  const modules: readonly QrModuleShape[] = QR_MODULE_SHAPES;
  it.each(modules)("shares %s geometry and colors between SVG and PNG", module => {
    const fill = vi.fn();
    const scale = vi.fn();
    const context = { fillRect: vi.fn(), fill, scale, fillStyle: "" };
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    class TestPath { constructor(public d: string) {} }
    vi.stubGlobal("Path2D", TestPath);
    try {
      for (const border of QR_BORDER_SHAPES) for (const center of QR_CENTER_SHAPES) {
        const style = { ...DEFAULT_QR_STYLE, modules: module, border, center, borderColor: "#123456", centerColor: "#234567" };
        const paths = qrShapePaths(symbol, style, DEFAULT_QR_COLORS, QR_BORDER);
        const svg = createQrSvg(symbol, DEFAULT_QR_COLORS, style);
        fill.mockClear();
        const canvas = drawQrCanvas(symbol, DEFAULT_QR_COLORS, 512, style);
        expect([canvas.width, canvas.height]).toEqual([512, 512]);
        expect(fill.mock.calls.map(([path]) => path.d)).toEqual(paths.map(path => path.d));
        for (const path of paths) expect(svg).toContain(`<path fill="${path.fill}" d="${path.d}" shape-rendering="${path.shapeRendering}"/>`);
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
  it("keeps square modules crisp when only the corner shape changes", () => {
    const paths = qrShapePaths(symbol, { ...DEFAULT_QR_STYLE, border: "rounded" }, DEFAULT_QR_COLORS, QR_BORDER);
    expect(paths[0].shapeRendering).toBe("crispEdges");
    expect(paths[1].shapeRendering).toBe("geometricPrecision");
    expect(paths[3].shapeRendering).toBe("crispEdges");
  });
  it("renders every dark module outside the three corners as a dot, including reserved modules", () => {
    const size = symbol.modules.size;
    const eyes = [[0, 0], [size - 7, 0], [0, size - 7]];
    let count = 0;
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
      if (symbol.modules.get(row, col) && !eyes.some(([x, y]) => col >= x && col < x + 7 && row >= y && row < y + 7)) count++;
    }
    const path = qrShapePaths(symbol, { ...DEFAULT_QR_STYLE, modules: "dots" }, DEFAULT_QR_COLORS, QR_BORDER)[0].d;
    expect(path.match(/M/g)).toHaveLength(count);
    expect(path.match(/a0.5 0.5/g)).toHaveLength(count * 2);
    expect(path).not.toMatch(/[HVQ]/);
  });

  it("joins vertical and horizontal runs into one bar each", () => {
    const size = symbol.modules.size;
    const eyes = [[0, 0], [size - 7, 0], [0, size - 7]];
    const dark = (row: number, col: number) => row >= 0 && col >= 0 && row < size && col < size && symbol.modules.get(row, col) === 1 && !eyes.some(([x, y]) => col >= x && col < x + 7 && row >= y && row < y + 7);
    let verticalRuns = 0;
    let horizontalRuns = 0;
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
      if (dark(row, col) && !dark(row - 1, col)) verticalRuns++;
      if (dark(row, col) && !dark(row, col - 1)) horizontalRuns++;
    }
    expect(qrShapePaths(symbol, { ...DEFAULT_QR_STYLE, modules: "vertical-bars" }, DEFAULT_QR_COLORS, QR_BORDER)[0].d.match(/M/g)).toHaveLength(verticalRuns);
    expect(qrShapePaths(symbol, { ...DEFAULT_QR_STYLE, modules: "horizontal-bars" }, DEFAULT_QR_COLORS, QR_BORDER)[0].d.match(/M/g)).toHaveLength(horizontalRuns);
  });

  it("points every leaf corner toward the code center", () => {
    const size = symbol.modules.size;
    const paths = qrShapePaths(symbol, { ...DEFAULT_QR_STYLE, border: "leaf", center: "leaf" }, DEFAULT_QR_COLORS, QR_BORDER);
    const startsSharp = (d: string, x: number, y: number) => d.startsWith(`M${x} ${y}H`);
    const far = QR_BORDER + size - 7;
    const eyes: Array<[number, number, boolean]> = [[QR_BORDER, QR_BORDER, false], [far, QR_BORDER, true], [QR_BORDER, far, true]];
    eyes.forEach(([x, y, mirrored], index) => {
      expect(startsSharp(paths[index * 3 + 1].d, x, y)).toBe(mirrored);
      expect(startsSharp(paths[index * 3 + 3].d, x + 2, y + 2)).toBe(mirrored);
    });
  });

  it("rejects shape names that are not offered", () => {
    expect(() => qrShapePaths(symbol, { ...DEFAULT_QR_STYLE, modules: "heart" as QrModuleShape }, DEFAULT_QR_COLORS, QR_BORDER)).toThrow(/Unsupported/);
    expect(() => qrShapePaths(symbol, { ...DEFAULT_QR_STYLE, border: "star" as never }, DEFAULT_QR_COLORS, QR_BORDER)).toThrow(/Unsupported/);
  });
});
