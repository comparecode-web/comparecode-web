import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MarkdownDocumentRenderer } from "@/features/markdown/components/MarkdownDocumentRenderer";

function renderDocument(value: string) {
  return render(<article className="cc-markdown"><MarkdownDocumentRenderer value={value} /></article>);
}

describe("MarkdownDocumentRenderer", () => {
  it("renders a sentence containing a pipe as a normal paragraph", () => {
    const { container } = renderDocument("Use a | b here.\n\nNormal **bold** paragraph.");

    expect(container.querySelector("pre")).not.toBeInTheDocument();
    expect(screen.getByText("Use a | b here.").tagName).toBe("P");
  });

  it("ignores pipes inside inline code and escaped pipes", () => {
    const { container } = renderDocument("Run `a | b` first\nand keep a \\| b too.");

    expect(container.querySelector("pre")).not.toBeInTheDocument();
    expect(container.querySelector("p code")).toHaveTextContent("a | b");
  });

  it("keeps reference links working next to a malformed table", () => {
    const { container } = renderDocument("See [docs][d].\n\n| A | B\n| C\n\n[d]: https://example.com");

    expect(screen.getByRole("link", { name: "docs" })).toHaveAttribute("href", "https://example.com");
    expect(container.querySelector("pre")).toHaveTextContent("| A | B");
  });

  it("resolves reference definitions placed after a frontmatter table marker", () => {
    renderDocument("See [docs][d].\n\n<!-- comparecode-frontmatter-table -->\n\n[d]: https://example.com");

    expect(screen.getByRole("link", { name: "docs" })).toHaveAttribute("href", "https://example.com");
  });

  it("keeps footnote targets and back references connected", () => {
    const { container } = renderDocument("Text[^1].\n\n[^1]: Note.");
    const reference = container.querySelector("a[data-footnote-ref]");
    const targetId = reference?.getAttribute("href")?.slice(1) ?? "";

    expect(targetId).toBe("user-content-fn-1");
    expect(container.querySelector(`[id="${targetId}"]`)?.tagName).toBe("LI");
    expect(reference).not.toHaveAttribute("target");
    expect(container.querySelector("a[data-footnote-backref]")).toHaveAttribute("href", "#user-content-fnref-1");
    expect(container.querySelector("[id='user-content-fnref-1']")).toBe(reference);
  });

  it("opens external links in a new tab but keeps fragment links in the document", () => {
    renderDocument("[Out](https://example.com) and [Jump](#intro)\n\n## Intro");

    expect(screen.getByRole("link", { name: "Out" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Jump" })).not.toHaveAttribute("target");
  });

  it("assigns prefixed heading ids and rewrites fragment links to them", () => {
    renderDocument("[Jump](#getting-started) [Again](#getting-started-1) [Kept](#user-content-getting-started)\n\n## Getting started\n\n## Getting started");
    const headings = screen.getAllByRole("heading", { name: "Getting started" });

    expect(headings[0]).toHaveAttribute("id", "user-content-getting-started");
    expect(headings[1]).toHaveAttribute("id", "user-content-getting-started-1");
    expect(screen.getByRole("link", { name: "Jump" })).toHaveAttribute("href", "#user-content-getting-started");
    expect(screen.getByRole("link", { name: "Again" })).toHaveAttribute("href", "#user-content-getting-started-1");
    expect(screen.getByRole("link", { name: "Kept" })).toHaveAttribute("href", "#user-content-getting-started");
  });

  it("leaves fragment links without a matching target unchanged", () => {
    renderDocument("[Missing](#nowhere)");

    expect(screen.getByRole("link", { name: "Missing" })).toHaveAttribute("href", "#nowhere");
  });

  it("does not let heading ids collide with footnote ids", () => {
    const { container } = renderDocument("## fn 1\n\nText[^1].\n\n[^1]: Note.");

    expect(screen.getByRole("heading", { name: "fn 1" })).toHaveAttribute("id", "user-content-section-fn-1");
    expect(container.querySelectorAll("[id='user-content-fn-1']")).toHaveLength(1);
  });

  it("scrolls to a fragment target inside the document", async () => {
    renderDocument("[Jump](#intro)\n\n## Intro");
    const heading = screen.getByRole("heading", { name: "Intro" });
    let scrolled = false;
    heading.scrollIntoView = () => {
      scrolled = true;
    };

    await userEvent.click(screen.getByRole("link", { name: "Jump" }));

    expect(scrolled).toBe(true);
  });

  it("keeps the full fence language for highlighting labels", () => {
    const { container } = renderDocument("```c++\nint value = 1;\n```");

    expect(container.querySelector("pre code")).toHaveClass("language-c++");
    expect(container.querySelector(".cc-markdown-code")).toHaveAttribute("data-code-language", "cpp");
    expect(screen.getByText("c++")).toBeInTheDocument();
  });

  it("renders inline code as plain text without syntax tokens", () => {
    const { container } = renderDocument("Inline `const value = \"shared\"` code.");
    const code = container.querySelector("code.cc-markdown-inline-code");

    expect(code).toHaveTextContent("const value = \"shared\"");
    expect(code?.querySelector("span")).not.toBeInTheDocument();
  });
});
