import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownOutlineView } from "@/features/markdown/components/MarkdownOutlineView";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useToastStore } from "@/store/useToastStore";

describe("MarkdownOutlineView", () => {
  beforeEach(() => {
    useToastStore.setState({ activeToasts: [], queuedToasts: [] });
  });

  it("shows an empty state without headings", () => {
    useMarkdownStore.setState({ markdownText: "Plain text only" });
    render(<MarkdownOutlineView textareaRef={createRef()} />);

    expect(screen.getByText(/No headings yet/)).toBeInTheDocument();
  });

  it("lists headings and moves the editor caret to the selected heading", async () => {
    const user = userEvent.setup();
    const value = "# Title\n\nText\n\n## Section";
    useMarkdownStore.setState({ markdownText: value });
    const textareaRef = createRef<HTMLTextAreaElement>();
    render(
      <>
        <textarea ref={textareaRef} defaultValue={value} />
        <MarkdownOutlineView textareaRef={textareaRef} />
      </>
    );

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["Title", "Section", "Copy table of contents"]);
    await user.click(screen.getByRole("button", { name: "Section" }));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(textareaRef.current?.selectionStart).toBe(value.indexOf("## Section"));
  });

  it("copies a table of contents", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    useMarkdownStore.setState({ markdownText: "# Title\n\n## First\n\n### Nested" });
    render(<MarkdownOutlineView textareaRef={createRef()} />);

    await user.click(screen.getByRole("button", { name: "Copy table of contents" }));

    expect(writeText).toHaveBeenCalledWith("- [First](#first)\n  - [Nested](#nested)");
  });
});
