import { describe, expect, it } from "vitest";
import {
  buildMarkdownStandaloneHtml,
  getMarkdownDocumentTitle,
  getReferencedCssVariables,
  markdownExportCsp,
  prepareMarkdownExportClone
} from "@/features/markdown/services/markdownExport";
import { markdownContentCss } from "@/features/markdown/styles/markdownContentStyles";

describe("markdown export helpers", () => {
  it("uses the first level 1 heading as the document title", () => {
    expect(getMarkdownDocumentTitle("Intro\n\n# Release notes\n\n# Later")).toBe("Release notes");
    expect(getMarkdownDocumentTitle("## Only a section")).toBe("CompareCode document");
  });

  it("builds a self-contained HTML document without scripts", () => {
    const html = buildMarkdownStandaloneHtml({
      title: "Release <notes>",
      bodyHtml: "<h1 id=\"user-content-release\">Release</h1><a href=\"#user-content-release\">Top</a>",
      themeVariables: "--bg-primary: #ffffff;",
      fontSize: 18
    });

    expect(html).toContain("<title>Release &lt;notes&gt;</title>");
    expect(html).toContain(`content="${markdownExportCsp}"`);
    expect(html).toContain("--bg-primary: #ffffff;");
    expect(html).toContain(markdownContentCss);
    expect(html).toContain("href=\"#user-content-release\"");
    expect(html).toContain("font-size: 18px");
    expect(html).not.toMatch(/<script/i);
  });

  it("removes controls and KaTeX layout markup from the export clone", () => {
    const article = document.createElement("article");
    article.setAttribute("data-export", "html");
    article.innerHTML = "<div data-export-exclude=\"\"><button>Copy</button></div><span class=\"katex\"><span class=\"katex-mathml\"><math></math></span><span class=\"katex-html\">x</span></span><p>Text</p>";

    const clone = prepareMarkdownExportClone(article);

    expect(clone.querySelector("button")).toBeNull();
    expect(clone.querySelector(".katex-html")).toBeNull();
    expect(clone.querySelector("math")).not.toBeNull();
    expect(clone.querySelector(".katex-mathml")).toBeNull();
    expect(clone.hasAttribute("data-export")).toBe(false);
    expect(article.querySelector("button")).not.toBeNull();
  });

  it("collects the theme variables used by the content stylesheet", () => {
    const names = getReferencedCssVariables(markdownContentCss);

    expect(names).toContain("--markdown-inline-code-fg");
    expect(names).toContain("--markdown-mermaid-bg");
    expect(names).not.toContain("--cc-alert-bg");
  });
});

describe("markdown content stylesheet", () => {
  it("scopes every rule to the Markdown root and uses theme variables only", () => {
    const selectors = Array.from(markdownContentCss.matchAll(/(^|})\s*([^{}@]+)\{/g), (match) => match[2].trim()).filter(Boolean);

    expect(selectors.length).toBeGreaterThan(20);
    for (const selector of selectors) {
      for (const part of selector.split(",")) {
        expect(part.trim().startsWith(".cc-markdown")).toBe(true);
      }
    }
    expect(markdownContentCss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(markdownContentCss).not.toMatch(/@apply|@tailwind|theme\(/);
  });
});
