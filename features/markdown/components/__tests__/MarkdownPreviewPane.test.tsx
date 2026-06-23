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

  it("renders invalid frontmatter as raw text instead of swallowing the preview", () => {
    const { container } = renderPreview(`---
fwws

| Column 1 | Column 2 |
etaewef
aeraer--- | ---wr |
| Value 1.1 | Value 1.2 |
wtr
aeraereraerlert content
|aitation: Share irwet when it helps
tags: ["compare-notes", "community", "open-source", "ad-free"]
---`);

    expect(container.textContent).toContain("fwws");
    expect(container.textContent).toContain("aeraer--- | ---wr |");
    expect(container.querySelector("pre")?.textContent).toContain("tags:");
  });

  it("keeps valid sections rendered when only a table-like block is malformed", () => {
    const { container } = renderPreview(`# Good heading

| Column 1 | Column 2 |
bad row
| Value 1 | Value 2 |

## After`);

    expect(screen.getByRole("heading", { name: "Good heading" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "After" })).toBeInTheDocument();
    expect(container.querySelector("pre")?.textContent).toContain("bad row");
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

  it("does not treat Mermaid edge labels with pipes as malformed tables", () => {
    const { container } = renderPreview(`\`\`\`mermaid
flowchart TD
  UseApp[Use CompareCode for a real task] --> Helpful{Was it helpful?}
  Helpful -->|Yes| Share[Share it with someone who may need it]
\`\`\``);

    expect(screen.getByText("Mermaid diagram")).toBeInTheDocument();
    expect(container.querySelector("article > pre")).not.toBeInTheDocument();
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

  it("renders frontmatter table at marker position when marker is present", () => {
    renderPreview(`---
purpose: Friendly compare notes
workspace: Local browser draft
---

## A Small Welcome

Welcome text.

<!-- comparecode-frontmatter-table -->

## After Table`);

    const welcomeHeading = screen.getByRole("heading", { name: "A Small Welcome" });
    const purposeHeader = screen.getByText("purpose");
    const afterHeading = screen.getByRole("heading", { name: "After Table" });

    expect(welcomeHeading.compareDocumentPosition(purposeHeader) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(purposeHeader.compareDocumentPosition(afterHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders marker-adjacent frontmatter as a table without moving the opening title", () => {
    renderPreview(`# CompareCode Community Note

## Frontmatter Example

---
purpose: Friendly compare notes
workspace: Local browser draft
---

<!-- comparecode-frontmatter-table -->

## After Table`);

    const title = screen.getByRole("heading", { name: "CompareCode Community Note" });
    const exampleHeading = screen.getByRole("heading", { name: "Frontmatter Example" });
    const purposeHeader = screen.getByText("purpose");
    const afterHeading = screen.getByRole("heading", { name: "After Table" });

    expect(title.compareDocumentPosition(exampleHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(exampleHeading.compareDocumentPosition(purposeHeader) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(purposeHeader.compareDocumentPosition(afterHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
