import { describe, expect, it } from "vitest";
import { parseMarkdownFrontmatter } from "@/features/markdown/services/markdownFrontmatter";

describe("parseMarkdownFrontmatter", () => {
  it("extracts scalar fields and inline tag arrays from frontmatter", () => {
    const result = parseMarkdownFrontmatter(`---
title: CompareCode Markdown Preview
description: Local preview
author: CompareCode
tags: ["markdown", "preview", "local-first"]
---

# Content`);

    expect(result.fields).toEqual([
      { key: "title", value: "CompareCode Markdown Preview" },
      { key: "description", value: "Local preview" },
      { key: "author", value: "CompareCode" },
      { key: "tags", value: ["markdown", "preview", "local-first"] }
    ]);
    expect(result.content).toBe("# Content");
  });
});
