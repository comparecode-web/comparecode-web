import { describe, expect, it } from "vitest";
import { diffLines } from "./lineDiff";

describe("anchored line diff", () => {
  it("preserves unique lines around a large changed gap", () => {
    const old = ["start", ...Array.from({ length: 100 }, (_, index) => `old ${index}`), "end"];
    const next = ["start", ...Array.from({ length: 100 }, (_, index) => `new ${index}`), "end"];
    const result = diffLines(old, next, 100);
    expect(result.limited).toBe(true);
    expect(result.edits[0]).toBe("equal");
    expect(result.edits.at(-1)).toBe("equal");
  });

  it("returns a complete edit script for repeated-line stress", () => {
    const old = Array(600).fill("}");
    const next = Array(600).fill("{");
    const result = diffLines(old, next, 1000);
    expect(result.limited).toBe(true);
    expect(result.edits.filter((edit) => edit === "delete")).toHaveLength(600);
    expect(result.edits.filter((edit) => edit === "insert")).toHaveLength(600);
  });
});
