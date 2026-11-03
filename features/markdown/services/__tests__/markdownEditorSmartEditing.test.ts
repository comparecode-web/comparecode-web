import { describe, expect, it } from "vitest";
import { applyMarkdownEditorCommand, continueMarkdownList, getMarkdownHeadingLevel } from "@/features/markdown/services/markdownEditorCommands";
import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";

function run(value: string, command: MarkdownFormatAction, selectionStart = value.length, selectionEnd = selectionStart, extra = {}) {
  return applyMarkdownEditorCommand({ value, selectionStart, selectionEnd, command, ...extra });
}

describe("markdown smart editing commands", () => {
  it("turns headings back into paragraphs", () => {
    expect(run("### Title", "paragraph", 3).value).toBe("Title");
    expect(run("Plain", "paragraph", 2).value).toBe("Plain");
  });

  it("detects the heading level of the current line", () => {
    expect(getMarkdownHeadingLevel("Intro\n## Section\nText", 9)).toBe(2);
    expect(getMarkdownHeadingLevel("Intro\n## Section\nText", 2)).toBe(0);
  });

  it("inserts inline and block math", () => {
    expect(run("", "mathInline").value).toBe("$x^2$");
    expect(run("Use a+b now", "mathInline", 4, 7).value).toBe("Use $a+b$ now");
    expect(run("", "mathBlock").value).toMatch(/^\$\$\n.+\n\$\$$/);
  });

  it("inserts terminal blocks, collapsible sections and Mermaid templates", () => {
    expect(run("", "terminalBlock").value).toBe("```bash\nnpm run dev\n```");
    const details = run("", "details");
    expect(details.value).toBe("<details>\n<summary>Summary</summary>\n\nHidden content\n\n</details>");
    expect(details.value.slice(details.selectionStart, details.selectionEnd)).toBe("Hidden content");
    expect(run("", "mermaidTemplate", 0, 0, { mermaidTemplate: "sequence" }).value).toMatch(/^```mermaid\nsequenceDiagram\n/);
  });

  it("adds a numbered footnote and selects its text", () => {
    const result = run("Fact[^1].\n\n[^1]: Known.\n\nNew claim", "footnote");

    expect(result.value).toBe("Fact[^1].\n\n[^1]: Known.\n\nNew claim[^2]\n\n[^2]: Footnote text");
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe("Footnote text");
  });

  it("indents list items to the content column of the previous item", () => {
    expect(run("- one\n- two", "indent", 8).value).toBe("- one\n  - two");
    expect(run("1. one\n1. two", "indent", 9).value).toBe("1. one\n   1. two");
    expect(run("10. one\n11. two", "indent", 10).value).toBe("10. one\n    11. two");
  });

  it("outdents list items back to their parent marker", () => {
    expect(run("1. one\n   - two", "outdent", 12).value).toBe("1. one\n- two");
    expect(run("    text", "outdent", 6).value).toBe("  text");
  });

  it("indents plain lines and every selected line", () => {
    const value = "first\nsecond";
    const result = run(value, "indent", 0, value.length);

    expect(result.value).toBe("  first\n  second");
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe("  first\n  second");
  });

  it("keeps the caret on the same text after indenting", () => {
    const result = run("- one\n- two", "indent", 10);

    expect(result.value.slice(result.selectionStart)).toBe("o");
  });
});

describe("continueMarkdownList", () => {
  it("continues bullets, tasks, numbers and quotes", () => {
    expect(continueMarkdownList("- item", 6, 6)?.value).toBe("- item\n- ");
    expect(continueMarkdownList("  * item", 8, 8)?.value).toBe("  * item\n  * ");
    expect(continueMarkdownList("- [x] done", 10, 10)?.value).toBe("- [x] done\n- [ ] ");
    expect(continueMarkdownList("9. nine", 7, 7)?.value).toBe("9. nine\n10. ");
    expect(continueMarkdownList("> quote", 7, 7)?.value).toBe("> quote\n> ");
  });

  it("splits the item when the caret is inside its text", () => {
    const result = continueMarkdownList("- first second", 8, 8);

    expect(result?.value).toBe("- first \n- second");
    expect(result?.selectionStart).toBe(11);
  });

  it("leaves the list with a blank line when the item is empty, so the next text starts a new paragraph", () => {
    expect(continueMarkdownList("- one\n- ", 8, 8)).toEqual({ value: "- one\n\n", selectionStart: 7, selectionEnd: 7 });
    expect(continueMarkdownList("- one\n- [ ] ", 12, 12)?.value).toBe("- one\n\n");
    expect(continueMarkdownList("- ", 2, 2)).toEqual({ value: "", selectionStart: 0, selectionEnd: 0 });
  });

  it("does nothing outside lists, inside code fences, before the marker or with a selection", () => {
    expect(continueMarkdownList("text", 4, 4)).toBeNull();
    expect(continueMarkdownList("```\n- item", 10, 10)).toBeNull();
    expect(continueMarkdownList("- item", 1, 1)).toBeNull();
    expect(continueMarkdownList("- item", 2, 6)).toBeNull();
  });
});
