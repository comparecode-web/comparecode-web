import { describe, expect, it } from "vitest";
import { normalizeMultilineStyleMarkers } from "@/features/markdown/services/markdownPreprocess";

describe("normalizeMultilineStyleMarkers", () => {
  it("keeps standalone marker lines unchanged", () => {
    expect(normalizeMultilineStyleMarkers(`**
Line one
Line two
**`)).toBe(`**
Line one
Line two
**`);
  });

  it("keeps text-attached multiline emphasis unchanged for the markdown parser", () => {
    const markdown = `**Line one
Line two**`;

    expect(normalizeMultilineStyleMarkers(markdown)).toBe(markdown);
  });
});
