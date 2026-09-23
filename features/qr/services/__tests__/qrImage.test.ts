import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { buildQrPayload, DEFAULT_QR_WEBSITE_URL, type QrContent } from "../qrPayload";
import { createQrSvg, createQrSymbol, DEFAULT_QR_COLORS, drawQrCanvas, getQrColorError, getQrColorWarning, QR_BORDER } from "../qrImage";

// Reference matrices: https://github.com/nayuki/QR-Code-generator/blob/3c6d0b3cefb4e049dc337e82237c9644399716a8/python/qrcodegen.py
// All use error correction M and mask 2; Wi-Fi uses an alphanumeric prefix followed by a UTF-8 byte segment.
const referenceCases: { label: string; content: QrContent; payload: string; size: number; sha256: string }[] = [
  {
    label: "Website",
    content: { type: "url", url: DEFAULT_QR_WEBSITE_URL },
    payload: DEFAULT_QR_WEBSITE_URL,
    size: 29,
    sha256: "48a4bf70fbf305d904da839972730e8459134441e74a824c8097f2fc978e7a72",
  },
  {
    label: "Text",
    content: { type: "text", text: "Árvíztűrő 🙂" },
    payload: "Árvíztűrő 🙂",
    size: 25,
    sha256: "5bccbd4fa4164acc397898988f9ab57a62b4458cd506f3d672bde022a540dca5",
  },
  {
    label: "Wi-Fi",
    content: { type: "wifi", ssid: "Cafe", password: "secret", security: "WPA", hidden: false },
    payload: "WIFI:T:WPA;S:Cafe;P:secret;;",
    size: 25,
    sha256: "08a9462ba9ad4deaf5ea6b35ee585b616f4bbb0a9ab5f1e4497454d8e527da8c",
  },
];

function hashRows(rows: string[]): string {
  return createHash("sha256").update(rows.join("\n")).digest("hex");
}

describe("QR image generation", () => {
  it.each(referenceCases)("matches the independent $label reference matrix in the symbol and SVG", ({ content, payload, size, sha256 }) => {
    const result = buildQrPayload(content);
    expect(result).toEqual({ value: payload, error: null });
    if (!result.value) throw new Error("Reference payload was not generated.");

    const symbol = createQrSymbol(result.value, "M");
    expect(symbol.modules.size).toBe(size);
    const symbolRows = Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, column) => symbol.modules.get(row, column)).join(""),
    );
    expect(hashRows(symbolRows)).toBe(sha256);

    const svg = createQrSvg(symbol, DEFAULT_QR_COLORS);
    const path = svg.match(/<path fill="#000000" d="([^"]*)"\/>/)?.[1];
    expect(path).toBeDefined();
    const svgRows = Array.from({ length: size }, () => Array<string>(size).fill("0"));
    const runs = [...path!.matchAll(/M(\d+) (\d+)h(\d+)v1H(\d+)z/g)];
    expect(runs.length).toBeGreaterThan(0);
    for (const [, x, y, width, returnX] of runs) {
      expect(returnX).toBe(x);
      for (let column = Number(x) - QR_BORDER; column < Number(x) - QR_BORDER + Number(width); column += 1) {
        svgRows[Number(y) - QR_BORDER][column] = "1";
      }
    }
    expect(hashRows(svgRows.map((row) => row.join("")))).toBe(sha256);
  });

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
      const total = symbol.modules.size + QR_BORDER * 2;
      const edge = (index: number) => Math.floor(index * 1024 / total);
      const expectedModules: number[][] = [];
      for (let row = 0; row < symbol.modules.size; row += 1) {
        for (let column = 0; column < symbol.modules.size; column += 1) {
          if (symbol.modules.get(row, column) === 1) {
            const x = edge(column + QR_BORDER);
            const y = edge(row + QR_BORDER);
            expectedModules.push([x, y, edge(column + QR_BORDER + 1) - x, edge(row + QR_BORDER + 1) - y]);
          }
        }
      }
      expect(fillRect.mock.calls.slice(1)).toEqual(expectedModules);
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
