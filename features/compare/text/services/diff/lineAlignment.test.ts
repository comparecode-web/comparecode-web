import { describe, expect, it } from "vitest";
import { alignLines } from "./lineAlignment";

describe("modified line alignment", () => {
  it("pairs opposing unmatched runs in source order", () => {
    expect(alignLines(["original passage"], ["different sentence", "further sentence"]).pairs).toEqual([
      { oldIndex: 0, newIndex: 0 },
      { oldIndex: null, newIndex: 1 }
    ]);
  });
});
