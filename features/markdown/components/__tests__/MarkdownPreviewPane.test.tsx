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

  it("applies GFM table column alignment", () => {
    const { container } = renderPreview(`| Feature | Ours | Others |
|:---|:---:|:---:|
| Live Preview | Yes | Partial |`);
    const table = container.querySelector("table");
    const cells = container.querySelectorAll("tbody td");

    expect(table).toHaveClass("w-auto");
    expect(table).toHaveClass("table-auto");
    expect(table).not.toHaveClass("w-full");
    expect(cells[0]).not.toHaveStyle({ textAlign: "center" });
    expect(cells[1]).toHaveStyle({ textAlign: "center" });
    expect(cells[2]).toHaveStyle({ textAlign: "center" });
  });

  it("preserves safe HTML table row and column spans", () => {
    const { container } = renderPreview(`<table>
  <thead>
    <tr>
      <th rowspan="2">Document Type</th>
      <th colspan="2">Support</th>
    </tr>
    <tr>
      <th>Markdown Viewer</th>
      <th>Other Editors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Technical Docs</td>
      <td>Full + Diagrams</td>
      <td>Limited</td>
    </tr>
  </tbody>
</table>`);

    const documentType = screen.getByText("Document Type").closest("th");
    const support = screen.getByText("Support").closest("th");

    expect(documentType).toHaveAttribute("rowspan", "2");
    expect(support).toHaveAttribute("colspan", "2");
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("renders safe highlight, underline, and keyboard tags", () => {
    renderPreview("Use <mark>highlighted text</mark>, <u>underlines</u>, and <kbd>Ctrl</kbd>.");

    expect(screen.getByText("highlighted text").tagName).toBe("MARK");
    expect(screen.getByText("underlines").tagName).toBe("U");
    expect(screen.getByText("underlines")).toHaveClass("underline");
    expect(screen.getByText("underlines")).not.toHaveClass("decoration-accent-primary");
    expect(screen.getByText("Ctrl").tagName).toBe("KBD");
  });

  it("renders task list checkboxes as controlled read-only inputs", () => {
    const { container } = renderPreview("- [x] Done\n- [ ] Todo");
    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    const taskItems = container.querySelectorAll("li.task-list-item");

    expect(checkboxes).toHaveLength(2);
    expect(taskItems).toHaveLength(2);
    expect(taskItems[0]).toHaveClass("list-none");
    expect(taskItems[1]).toHaveClass("list-none");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[0]).toHaveAttribute("readonly");
    expect(checkboxes[1]).toHaveAttribute("readonly");
  });
});
