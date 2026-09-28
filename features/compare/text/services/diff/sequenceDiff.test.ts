import { describe, expect, it } from "vitest";
import { diffSequence } from "./sequenceDiff";

function verify(old: string[], next: string[], budget?: number) {
  const result = diffSequence(old, next, (a, b) => a === b, budget);
  let oi = 0, ni = 0;
  for (const edit of result.edits) {
    if (edit === "equal") {
      expect(old[oi]).toBe(next[ni]);
      oi++; ni++;
    } else if (edit === "delete") oi++;
    else ni++;
  }
  expect(oi).toBe(old.length);
  expect(ni).toBe(next.length);
  return result;
}

describe("bounded sequence diff", () => {
  it("reconstructs edits around repeated lines", () => {
    verify(["}", "a", "}", "b", "}"], ["}", "b", "}", "a", "}"]);
    verify([], ["a"]);
    verify(["a"], []);
    verify(["a", "b", "c"], ["a", "x", "c"]);
  });

  it("uses a correct coarse replacement when the work budget is exhausted", () => {
    const result = verify(Array.from({ length: 100 }, (_, i) => `old ${i}`),
      Array.from({ length: 100 }, (_, i) => `new ${i}`), 50);
    expect(result.limited).toBe(true);
  });

  it("reconstructs deterministic varied inputs", () => {
    const alphabet = ["a", "b", "c", "}"];
    for (let seed = 0; seed < 200; seed++) {
      const old = Array.from({ length: seed % 13 }, (_, i) => alphabet[(seed * 7 + i * i) % 4]);
      const next = Array.from({ length: (seed * 3) % 14 }, (_, i) => alphabet[(seed * 5 + i * 3) % 4]);
      verify(old, next);
    }
  });
});
