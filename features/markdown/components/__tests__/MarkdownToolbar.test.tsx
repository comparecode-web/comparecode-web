import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarkdownToolbar } from "@/features/markdown/components/MarkdownToolbar";

function renderToolbar(overrides: Partial<Parameters<typeof MarkdownToolbar>[0]> = {}) {
  const props = {
    onFormat: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: true,
    canRedo: false,
    onExport: vi.fn(),
    ...overrides
  };
  render(<MarkdownToolbar {...props} />);
  return props;
}

describe("MarkdownToolbar", () => {
  it("chooses heading levels from one heading menu and marks the current level", async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ getHeadingLevel: () => 2 });

    await user.click(screen.getByRole("button", { name: "Heading" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "PParagraph", "H1Heading 1", "H2Heading 2", "H3Heading 3", "H4Heading 4", "H5Heading 5", "H6Heading 6"
    ]);
    expect(screen.getByRole("menuitem", { name: /Heading 2/ }).querySelector("svg")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /Heading 3/ }));
    expect(props.onFormat).toHaveBeenCalledWith("h3");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("groups case changes in one menu with sentence case labels", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Change case" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["AaTitle case", "AAUppercase", "aaLowercase"]);

    await user.click(screen.getByRole("menuitem", { name: /Uppercase/ }));
    expect(props.onFormat).toHaveBeenCalledWith("upperCase");
  });

  it("inserts Mermaid templates and other blocks from the insert menu", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Insert" }));
    await user.click(screen.getByRole("menuitem", { name: /Sequence diagram/ }));
    expect(props.onFormat).toHaveBeenCalledWith("mermaidTemplate", { mermaidTemplate: "sequence" });

    await user.click(screen.getByRole("button", { name: "Insert" }));
    await user.click(screen.getByRole("menuitem", { name: /Footnote/ }));
    expect(props.onFormat).toHaveBeenCalledWith("footnote");
  });

  it("offers every export action with an accurate print label", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Download and export" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Markdown (.md)", "HTML", "Image (.png)", "Print / Save as PDF", "Copy Markdown", "Copy formatted text"
    ]);

    await user.click(screen.getByRole("menuitem", { name: "Image (.png)" }));
    expect(props.onExport).toHaveBeenCalledWith("png");
  });

  it("inserts a table from the size grid", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Table" }));
    await user.click(screen.getByRole("gridcell", { name: "4 columns, 3 rows" }));

    expect(props.onFormat).toHaveBeenCalledWith("table", { tableRows: 3, tableColumns: 4 });
  });

  it("toggles full screen", async () => {
    const user = userEvent.setup();
    const onToggleFullscreen = vi.fn();
    renderToolbar({ onToggleFullscreen, isFullscreen: false });

    await user.click(screen.getByRole("button", { name: "Full screen" }));
    expect(onToggleFullscreen).toHaveBeenCalled();
  });
});
