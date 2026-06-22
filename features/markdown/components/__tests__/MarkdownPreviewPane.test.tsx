import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownPreviewPane } from "@/features/markdown/components/MarkdownPreviewPane";

function renderPreview(value: string) {
  const previewRef = createRef<HTMLDivElement>();
  return render(<MarkdownPreviewPane value={value} previewRef={previewRef} />);
}

describe("MarkdownPreviewPane", () => {
  it("renders malformed markdown as user text without throwing", () => {
    const { container } = renderPreview("This **bold text never closes\nStill visible");

    expect(container.textContent).toContain("This **bold text never closes");
    expect(container.textContent).toContain("Still visible");
  });

  it("renders malformed KaTeX input without throwing", () => {
    renderPreview("Broken math: $\\not_a_real_command{");

    expect(screen.getByText(/Broken math/)).toBeInTheDocument();
  });

  it("keeps invalid Mermaid source visible before rendering", () => {
    renderPreview("```mermaid\nflowchart LR\n  A -->\n```");

    expect(screen.getByText(/flowchart LR/)).toBeInTheDocument();
    expect(screen.getByText(/A -->/)).toBeInTheDocument();
  });

  it("keeps soft line breaks visible in preview", () => {
    const { container } = renderPreview("First line\nSecond line");
    const paragraph = container.querySelector("p");

    expect(paragraph?.textContent).toContain("First line");
    expect(paragraph?.textContent).toContain("Second line");
    expect(paragraph?.querySelector("br")).toBeInTheDocument();
  });
});
