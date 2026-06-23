import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MarkdownHistoryView } from "@/features/markdown/components/MarkdownHistoryView";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";

function resetMarkdownStore() {
  window.sessionStorage.clear();
  useMarkdownStore.setState({
    markdownText: "# Current",
    isLoaded: true,
    lastEditedAt: null,
    past: [],
    future: [],
    pendingUndoValue: null,
    canUndo: false,
    canRedo: false
  });
}

describe("MarkdownHistoryView", () => {
  beforeEach(() => {
    resetMarkdownStore();
  });

  it("shows an empty state when the session has no history", () => {
    render(<MarkdownHistoryView />);

    expect(screen.getByText("No Markdown history yet")).toBeInTheDocument();
  });

  it("restores a past Markdown snapshot from the session history", () => {
    useMarkdownStore.setState({
      markdownText: "# Current",
      past: ["# Initial", "# Previous"],
      future: [],
      pendingUndoValue: null,
      canUndo: true,
      canRedo: false
    });

    render(<MarkdownHistoryView />);

    fireEvent.click(screen.getByText("Undo point 1"));

    expect(useMarkdownStore.getState().markdownText).toBe("# Previous");
    expect(useMarkdownStore.getState().canRedo).toBe(true);
  });

  it("clears session history without changing the current Markdown", () => {
    useMarkdownStore.setState({
      markdownText: "# Current",
      past: ["# Initial"],
      future: ["# Future"],
      pendingUndoValue: null,
      canUndo: true,
      canRedo: true
    });

    render(<MarkdownHistoryView />);

    fireEvent.click(screen.getByText("Clear session history"));

    expect(useMarkdownStore.getState().markdownText).toBe("# Current");
    expect(useMarkdownStore.getState().canUndo).toBe(false);
    expect(useMarkdownStore.getState().canRedo).toBe(false);
  });
});
