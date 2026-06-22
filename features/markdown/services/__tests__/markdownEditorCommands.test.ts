import { describe, expect, it } from "vitest";
import { applyMarkdownEditorCommand } from "@/features/markdown/services/markdownEditorCommands";
import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";

function runCommand(value: string, command: MarkdownFormatAction, selectedText?: string) {
  const selectionStart = selectedText ? value.indexOf(selectedText) : 0;
  const selectionEnd = selectedText ? selectionStart + selectedText.length : 0;

  return applyMarkdownEditorCommand({
    value,
    selectionStart,
    selectionEnd,
    command
  });
}

describe("applyMarkdownEditorCommand", () => {
  it("wraps selected text with bold markers", () => {
    const result = runCommand("Use bold text here", "bold", "bold text");

    expect(result.value).toBe("Use **bold text** here");
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe("bold text");
  });

  it("removes matching inline markers around selected text", () => {
    const result = runCommand("Use **bold text** here", "bold", "bold text");

    expect(result.value).toBe("Use bold text here");
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe("bold text");
  });

  it("keeps standalone marker blocks unchanged", () => {
    const value = `**
Line one
Line two
**`;

    const result = applyMarkdownEditorCommand({
      value,
      selectionStart: 0,
      selectionEnd: value.length,
      command: "bold"
    });

    expect(result.value).toBe(value);
  });

  it("toggles heading levels across touched lines", () => {
    const first = runCommand("Heading", "h4", "Heading");
    const second = applyMarkdownEditorCommand({
      value: first.value,
      selectionStart: 0,
      selectionEnd: first.value.length,
      command: "h4"
    });

    expect(first.value).toBe("#### Heading");
    expect(second.value).toBe("Heading");
  });

  it("replaces an existing heading level", () => {
    const result = runCommand("## Heading", "h6", "Heading");

    expect(result.value).toBe("###### Heading");
  });

  it("preserves line breaks when applying headings to multiple selected lines", () => {
    const value = "First line\n\nSecond line\nThird line";
    const result = applyMarkdownEditorCommand({
      value,
      selectionStart: 0,
      selectionEnd: value.length,
      command: "h2"
    });

    expect(result.value).toBe("## First line\n\n## Second line\n## Third line");
  });

  it("toggles bullet lists for selected lines", () => {
    const value = "First\nSecond";
    const first = applyMarkdownEditorCommand({
      value,
      selectionStart: 0,
      selectionEnd: value.length,
      command: "bulletList"
    });
    const second = applyMarkdownEditorCommand({
      value: first.value,
      selectionStart: 0,
      selectionEnd: first.value.length,
      command: "bulletList"
    });

    expect(first.value).toBe("- First\n- Second");
    expect(second.value).toBe("First\nSecond");
  });

  it("renumbers ordered lists for selected lines", () => {
    const value = "Alpha\nBeta\nGamma";
    const result = applyMarkdownEditorCommand({
      value,
      selectionStart: 0,
      selectionEnd: value.length,
      command: "orderedList"
    });

    expect(result.value).toBe("1. Alpha\n2. Beta\n3. Gamma");
  });

  it("inserts a horizontal rule with spacing inside text", () => {
    const result = applyMarkdownEditorCommand({
      value: "BeforeAfter",
      selectionStart: 6,
      selectionEnd: 6,
      command: "horizontalRule"
    });

    expect(result.value).toBe("Before\n\n---\n\nAfter");
  });

  it("uses selected text as image alt text", () => {
    const result = runCommand("Screenshot", "image", "Screenshot");

    expect(result.value).toBe("![Screenshot](https://example.com/image.png)");
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe("https://example.com/image.png");
  });

  it("builds a reference link snippet", () => {
    const result = runCommand("Docs", "reference", "Docs");

    expect(result.value).toBe("[Docs][reference-id]\n\n[reference-id]: https://example.com");
  });

  it("builds a table with the requested size", () => {
    const result = applyMarkdownEditorCommand({
      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      command: "table",
      tableRows: 3,
      tableColumns: 4
    });

    expect(result.value).toBe([
      "| Column 1 | Column 2 | Column 3 | Column 4 |",
      "| --- | --- | --- | --- |",
      "| Value 1.1 | Value 1.2 | Value 1.3 | Value 1.4 |",
      "| Value 2.1 | Value 2.2 | Value 2.3 | Value 2.4 |",
      "| Value 3.1 | Value 3.2 | Value 3.3 | Value 3.4 |"
    ].join("\n"));
  });

  it("clamps requested table size", () => {
    const result = applyMarkdownEditorCommand({
      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      command: "table",
      tableRows: 99,
      tableColumns: 99
    });
    const lines = result.value.split("\n");

    expect(lines).toHaveLength(22);
    expect(lines[0].split("|").filter(Boolean)).toHaveLength(10);
  });

  it("builds typed alert snippets", () => {
    const result = runCommand("Check this", "alertWarning", "Check this");

    expect(result.value).toBe("> [!WARNING]\n> Check this");
  });

  it("transforms selected text casing", () => {
    const upper = runCommand("Mixed Case", "upperCase", "Mixed Case");
    const lower = runCommand("Mixed Case", "lowerCase", "Mixed Case");
    const title = runCommand("mixed case", "titleCase", "mixed case");

    expect(upper.value).toBe("MIXED CASE");
    expect(lower.value).toBe("mixed case");
    expect(title.value).toBe("Mixed Case");
  });

  it("uses KaTeX-compatible block math when no text is selected", () => {
    const result = runCommand("", "math");

    expect(result.value).toContain("$$");
    expect(result.value).toContain("\\Delta");
  });
});
