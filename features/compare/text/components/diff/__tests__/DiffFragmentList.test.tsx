import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiffFragmentList } from "../DiffFragmentList";
import { DiffChangeType } from "../../../types/diff";
import { tokenizeSyntax } from "../../../services/syntax/tokenizeSyntax";

describe("syntax and diff composition", () => {
  it("splits a syntax token across character diff fragments without changing text or rounded backgrounds", () => {
    const text = "return value;";
    const fragments = [
      { text: "ret", kind: DiffChangeType.Unchanged },
      { text: "u", kind: DiffChangeType.Inserted },
      { text: "rn value;", kind: DiffChangeType.Unchanged }
    ];
    const { container } = render(<DiffFragmentList fragments={fragments} syntaxLine={tokenizeSyntax(text, "javascript").lines![0]} />);
    expect(container.textContent).toBe(text);
    expect(Array.from(container.querySelectorAll('[data-syntax-kind="keyword"]')).map((node) => node.textContent)).toEqual(["ret", "u", "rn"]);
    expect(container.querySelector(".bg-diff-added-fg")).toHaveClass("rounded", "text-text-primary");
    expect(container.querySelector(".bg-diff-added-fg [data-syntax-kind]")).toHaveClass("text-inherit");
    expect(container.querySelector(".text-syntax-keyword")).toBeInTheDocument();
  });

  it("renders untrusted source as text and preserves Unicode and whitespace", () => {
    const text = '\tconst x = "😀 <img src=x onerror=alert(1)> &";';
    const { container } = render(<DiffFragmentList fragments={[{ text, kind: DiffChangeType.Unchanged }]} syntaxLine={tokenizeSyntax(text, "javascript").lines![0]} />);
    expect(container.textContent).toBe(text);
    expect(container.querySelector("img")).toBeNull();
  });

  it("retains syntax on moved text without restoring suppressed inline diff backgrounds", () => {
    const text = "return 42;";
    const { container } = render(<DiffFragmentList fragments={[{ text, kind: DiffChangeType.Deleted }]} suppressHighlight syntaxLine={tokenizeSyntax(text, "javascript").lines![0]} />);
    expect(container.querySelector(".bg-diff-removed-fg")).toBeNull();
    expect(container.querySelector(".text-syntax-keyword")).toHaveTextContent("return");
  });

  it("falls back safely when a line does not match the compared source", () => {
    const { container } = render(<DiffFragmentList fragments={[{ text: "old source", kind: DiffChangeType.Deleted }]} syntaxLine={tokenizeSyntax("const newSource = 1;", "javascript").lines![0]} />);
    expect(container.textContent).toBe("old source");
    expect(container.querySelector("[data-syntax-kind]")).toBeNull();
    expect(container.querySelector(".bg-diff-removed-fg")).toBeInTheDocument();
  });

  it("keeps line ending annotations separate from syntax", () => {
    const text = "const x = 1;";
    const { container } = render(<DiffFragmentList fragments={[{ text, kind: DiffChangeType.Unchanged }]} lineEndingLabel="CRLF" syntaxLine={tokenizeSyntax(text, "javascript").lines![0]} />);
    expect(container.querySelector('[title="Changed line ending"]')).toHaveTextContent("CRLF");
    expect(container.querySelector('[title="Changed line ending"] [data-syntax-kind]')).toBeNull();
  });
});
