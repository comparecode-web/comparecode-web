import { describe, expect, it } from "vitest";
import { buildMarkdownPasteResult } from "@/features/markdown/services/markdownPaste";

function clipboardData(values: Record<string, string>): DataTransfer {
  return {
    getData: (format: string) => values[format] ?? ""
  } as DataTransfer;
}

describe("buildMarkdownPasteResult", () => {
  it("converts pasted HTML into Markdown before inserting it", () => {
    const result = buildMarkdownPasteResult({
      value: "Before\nAfter",
      selectionStart: 7,
      selectionEnd: 7,
      clipboardData: clipboardData({
        "text/html": "<h2>Title</h2><ul><li>First</li><li>Second</li></ul>",
        "text/plain": "Title\nFirst\nSecond"
      })
    });

    expect(result?.value).toBe("Before\n## Title\n\n- First\n- SecondAfter");
    expect(result?.selectionStart).toBe("Before\n## Title\n\n- First\n- Second".length);
    expect(result?.selectionEnd).toBe("Before\n## Title\n\n- First\n- Second".length);
  });

  it("falls back to plain text when the clipboard has no HTML", () => {
    const result = buildMarkdownPasteResult({
      value: "Replace this",
      selectionStart: 0,
      selectionEnd: 7,
      clipboardData: clipboardData({
        "text/plain": "**Markdown** text"
      })
    });

    expect(result?.value).toBe("**Markdown** text this");
  });

  it("does not escape Markdown syntax from pasted HTML", () => {
    const result = buildMarkdownPasteResult({
      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      clipboardData: clipboardData({
        "text/html": "<p># Heading</p><p>`inline code` and **bold** [link](https://example.com)</p>",
        "text/plain": "# Heading\n\n`inline code` and **bold** [link](https://example.com)"
      })
    });

    expect(result?.value).toBe("# Heading\n\n`inline code` and **bold** [link](https://example.com)");
  });

  it("keeps compact plain Markdown when HTML would add extra blank lines", () => {
    const markdown = `# Heading
Text line
- First
- Second
\`inline code\``;
    const result = buildMarkdownPasteResult({
      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      clipboardData: clipboardData({
        "text/html": "<h1>Heading</h1><p>Text line</p><ul><li>First</li><li>Second</li></ul><p><code>inline code</code></p>",
        "text/plain": markdown
      })
    });

    expect(result?.value).toBe(markdown);
    expect(result?.value.split("\n")).toHaveLength(5);
  });

  it("normalizes non-breaking spaces from pasted HTML", () => {
    const result = buildMarkdownPasteResult({
      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      clipboardData: clipboardData({
        "text/html": "<p>First&nbsp;Second&#160;Third</p>"
      })
    });

    expect(result?.value).toBe("First Second Third");
  });

  it("strips unsafe clipboard HTML before Markdown conversion", () => {
    const result = buildMarkdownPasteResult({
      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      clipboardData: clipboardData({
        "text/html": `<div onclick="alert(1)">Safe text<script>alert(1)</script><a href="javascript:alert(1)">bad link</a><img src="javascript:alert(1)" alt="bad image"></div>`
      })
    });

    expect(result?.value).toContain("Safe text");
    expect(result?.value).toContain("bad link");
    expect(result?.value).not.toContain("alert(1)");
    expect(result?.value).not.toContain("bad image");
    expect(result?.value).not.toContain("javascript:");
    expect(result?.value).not.toContain("onclick");
  });

  it("keeps pasted HTML tables as GitHub-flavored Markdown tables", () => {
    const result = buildMarkdownPasteResult({
      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      clipboardData: clipboardData({
        "text/html": "<table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>Value 1</td><td>Value 2</td></tr></tbody></table>"
      })
    });

    expect(result?.value).toContain("| Column 1 | Column 2 |");
    expect(result?.value).toContain("| Value 1 | Value 2 |");
  });

  it("simplifies copied key-value HTML tables instead of preserving rich cell markup", () => {
    const result = buildMarkdownPasteResult({
      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      clipboardData: clipboardData({
        "text/html": `<table>
          <tbody>
            <tr><th>purpose</th><td><span>Friendly compare notes</span></td></tr>
            <tr><th>tags</th><td><div><span>compare-notes</span><span>community</span><span>open-source</span><span>ad-free</span></div></td></tr>
          </tbody>
        </table>`
      })
    });

    expect(result?.value).toBe(`| Field | Value |
| --- | --- |
| purpose | Friendly compare notes |
| tags | compare-notes, community, open-source, ad-free |`);
  });
});
