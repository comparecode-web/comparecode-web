import { describe, expect, it } from "vitest";
import { composite, contrastRatio, deltaE, ensureContrast, formatColor, mix, parseColor, withAlpha } from "../color";

describe("theme color utilities", () => {
  it("parses hex and rgb colors", () => {
    expect(parseColor("#abc")).toEqual({ r: 170, g: 187, b: 204, a: 1 });
    expect(parseColor("#11223380")).toEqual({ r: 17, g: 34, b: 51, a: 128 / 255 });
    expect(parseColor("rgba(80, 250, 123, 0.24)")).toEqual({ r: 80, g: 250, b: 123, a: 0.24 });
    expect(() => parseColor("red")).toThrow("Unsupported color value");
  });

  it("formats opaque and translucent colors", () => {
    expect(formatColor({ r: 255, g: 0, b: 16, a: 1 })).toBe("#ff0010");
    expect(withAlpha("#24292e", 0.05)).toBe("rgba(36, 41, 46, 0.05)");
  });

  it("measures WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#2563eb", "#ffffff")).toBeCloseTo(5.17, 2);
  });

  it("composites translucent colors onto an opaque background", () => {
    expect(composite("rgba(0, 0, 0, 0.5)", "#ffffff")).toBe("#808080");
    expect(composite("#123456", "#ffffff")).toBe("#123456");
    expect(() => composite("#000000", "rgba(0, 0, 0, 0.5)")).toThrow("Background must be opaque");
  });

  it("mixes in OKLab and keeps the endpoints", () => {
    expect(mix("#2563eb", "#ffffff", 0)).toBe("#2563eb");
    expect(mix("#2563eb", "#ffffff", 1)).toBe("#ffffff");
    expect(deltaE(mix("#000000", "#ffffff", 0.5), "#636363")).toBeLessThan(1);
  });

  it("adjusts a color until it is readable on every background", () => {
    expect(ensureContrast("#2563eb", "#ffffff", 4.5, "#000000")).toBe("#2563eb");
    const adjusted = ensureContrast("#268bd2", ["#fdf6e3", "#eee8d5"], 4.5, "#073642");
    expect(contrastRatio(adjusted, "#fdf6e3")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(adjusted, "#eee8d5")).toBeGreaterThanOrEqual(4.5);
  });
});
