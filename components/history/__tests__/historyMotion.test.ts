import { describe, expect, it } from "vitest";
import { historySpringEasing, MAX_HISTORY_OVERSHOOT } from "../historyMotion";

describe("bounded original history spring", () => {
  it("preserves the exact original curve while its rebound fits the limit", () => {
    for (const distance of [0, 1, 24, 54, 100]) {
      expect(historySpringEasing(distance)).toBe("cubic-bezier(.2,1.4,.35,1)");
    }
  });

  it.each([114, 178, 240, 1000, 10_000, 100_000, 1_000_000])("bounds overshoot along the entire smooth curve at %i px", distance => {
    const controls = historySpringEasing(distance).slice(13, -1).split(",").map(Number);
    const [x1, y1, x2, y2] = controls;
    expect([x1, x2, y2]).toEqual([.2, .35, 1]);
    expect(y1).toBeGreaterThan(1);
    expect(y1).toBeLessThan(1.4);
    let maxRebound = 0;
    for (let step = 0; step <= 10_000; step++) {
      const t = step / 10_000;
      const progress = 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3;
      maxRebound = Math.max(maxRebound, (progress - 1) * distance);
    }
    expect(maxRebound).toBeLessThanOrEqual(MAX_HISTORY_OVERSHOOT + 1e-8);
    expect(maxRebound).toBeGreaterThan(5.99);
    // Keeping y2 at one makes the final velocity zero, with no extra return segment.
    expect(3 * (1 - y2)).toBe(0);
  });
});
