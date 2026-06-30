import { describe, expect, it } from "vitest";
import { markdownSanitizeSchema } from "@/features/markdown/services/markdownSanitizeSchema";

describe("markdownSanitizeSchema", () => {
  it("allows div and p alignment attributes for markdown alignment", () => {
    expect(markdownSanitizeSchema.tagNames).toContain("div");
    expect(markdownSanitizeSchema.tagNames).toContain("p");
    expect(markdownSanitizeSchema.attributes?.div).toContainEqual(["align", "left", "center", "right"]);
    expect(markdownSanitizeSchema.attributes?.p).toContainEqual(["align", "left", "center", "right"]);
  });

  it("allows safe table span attributes and inline formatting tags", () => {
    expect(markdownSanitizeSchema.tagNames).toEqual(expect.arrayContaining(["ins", "kbd", "mark", "sub", "sup", "u"]));
    expect(markdownSanitizeSchema.attributes?.th).toEqual(expect.arrayContaining([
      ["align", "left", "center", "right"],
      "colSpan",
      "rowSpan",
      "colspan",
      "rowspan"
    ]));
    expect(markdownSanitizeSchema.attributes?.td).toEqual(expect.arrayContaining([
      ["align", "left", "center", "right"],
      "colSpan",
      "rowSpan",
      "colspan",
      "rowspan"
    ]));
  });

  it("keeps link and image protocols constrained", () => {
    expect(markdownSanitizeSchema.protocols?.href).toEqual(["http", "https", "mailto"]);
    expect(markdownSanitizeSchema.protocols?.src).toEqual(["http", "https"]);
  });

  it("allows safe image sizing attributes", () => {
    expect(markdownSanitizeSchema.attributes?.img).toEqual(expect.arrayContaining([
      "height",
      "width"
    ]));
  });

  it("allows collapsed details sections without broad event attributes", () => {
    expect(markdownSanitizeSchema.tagNames).toEqual(expect.arrayContaining(["details", "summary"]));
    expect(markdownSanitizeSchema.attributes?.details).toEqual(expect.arrayContaining(["open"]));
    expect(markdownSanitizeSchema.attributes?.details).not.toContain("onclick");
    expect(markdownSanitizeSchema.attributes?.summary).not.toContain("onclick");
  });
});
