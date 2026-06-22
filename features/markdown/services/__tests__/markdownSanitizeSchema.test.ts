import { describe, expect, it } from "vitest";
import { markdownSanitizeSchema } from "@/features/markdown/services/markdownSanitizeSchema";

describe("markdownSanitizeSchema", () => {
  it("allows div and p alignment attributes for markdown alignment", () => {
    expect(markdownSanitizeSchema.tagNames).toContain("div");
    expect(markdownSanitizeSchema.tagNames).toContain("p");
    expect(markdownSanitizeSchema.attributes?.div).toContainEqual(["align", "left", "center", "right"]);
    expect(markdownSanitizeSchema.attributes?.p).toContainEqual(["align", "left", "center", "right"]);
  });

  it("keeps link and image protocols constrained", () => {
    expect(markdownSanitizeSchema.protocols?.href).toEqual(["http", "https", "mailto"]);
    expect(markdownSanitizeSchema.protocols?.src).toEqual(["http", "https"]);
  });
});
