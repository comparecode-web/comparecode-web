import { describe, expect, it } from "vitest";
import { buildMarkdownTableOfContents, getMarkdownDocument } from "@/features/markdown/services/markdownDocument";
import { createMarkdownSlugger, toMarkdownSlug } from "@/features/markdown/services/markdownSlug";

describe("markdown slugs", () => {
  it("follows GitHub-style slugs with Unicode letters", () => {
    expect(toMarkdownSlug("Hello, World!")).toBe("hello-world");
    expect(toMarkdownSlug("Árvíztűrő tükörfúrógép")).toBe("árvíztűrő-tükörfúrógép");
    expect(toMarkdownSlug("Use `code` & more")).toBe("use-code--more");
  });

  it("numbers duplicates across the whole document", () => {
    const slug = createMarkdownSlugger();

    expect([slug("Intro"), slug("Intro"), slug("Intro-1"), slug("Intro")]).toEqual(["intro", "intro-1", "intro-1-1", "intro-2"]);
  });

  it("keeps heading slugs away from footnote ids", () => {
    const slug = createMarkdownSlugger();

    expect(slug("fn 1")).toBe("section-fn-1");
    expect(slug("footnote label")).toBe("section-footnote-label");
    expect(slug("")).toBe("heading");
  });
});

describe("getMarkdownDocument", () => {
  it("lists headings with ids and original line numbers", () => {
    const { headings } = getMarkdownDocument("---\ntitle: Note\n---\n\n# Title\n\nText\n\n## Part *one*\n\nSetext\n---\n\n```md\n# Not a heading\n```");

    expect(headings).toEqual([
      expect.objectContaining({ depth: 1, text: "Title", id: "title", line: 5 }),
      expect.objectContaining({ depth: 2, text: "Part one", id: "part-one", line: 9 }),
      expect.objectContaining({ depth: 2, text: "Setext", id: "setext", line: 11 })
    ]);
  });

  it("builds a GitHub table of contents from level 2 to 4 headings", () => {
    const { headings } = getMarkdownDocument("# Title\n## Start\n#### Deep\n### Middle\n##### Too deep\n## [Links]");

    expect(buildMarkdownTableOfContents(headings)).toBe([
      "- [Start](#start)",
      "  - [Deep](#deep)",
      "  - [Middle](#middle)",
      "- [\\[Links\\]](#links)"
    ].join("\n"));
    expect(buildMarkdownTableOfContents(getMarkdownDocument("# Only title").headings)).toBe("");
  });
});
