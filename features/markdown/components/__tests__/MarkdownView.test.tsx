import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MarkdownView } from "@/features/markdown/components/MarkdownView";
import { markdownDefaultContent } from "@/features/markdown/services/markdownDefaultContent";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

function resetMarkdownState() {
  window.localStorage.clear();

  useMarkdownStore.setState({
    markdownText: markdownDefaultContent,
    isLoaded: false,
    lastEditedAt: null
  });

  useMarkdownUIStore.setState({
    isLoaded: false,
    isOptionsPanelOpen: true,
    isSyncScrollEnabled: true,
    editorPaneWidthPercent: 50,
    isWordWrapEnabled: true,
    fontSize: 16,
    viewMode: "split"
  });
}

describe("MarkdownView", () => {
  beforeEach(() => {
    resetMarkdownState();
  });

  it("renders editor and preview panes with default content", async () => {
    render(<MarkdownView />);

    expect(await screen.findByText("Markdown")).toBeInTheDocument();
    expect(screen.getAllByText("Preview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CompareCode Markdown Preview").length).toBeGreaterThan(0);
  });
});
