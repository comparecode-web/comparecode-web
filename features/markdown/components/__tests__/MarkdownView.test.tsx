import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownView } from "@/features/markdown/components/MarkdownView";
import { markdownDefaultContent } from "@/features/markdown/services/markdownDefaultContent";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

const originalMarkdownState = useMarkdownStore.getState();
const originalMarkdownUIState = useMarkdownUIStore.getState();

function resetMarkdownState() {
  window.localStorage.clear();
  window.sessionStorage.clear();

  useMarkdownStore.setState({
    markdownText: markdownDefaultContent,
    isLoaded: false,
    lastEditedAt: null,
    past: [],
    future: [],
    pendingUndoValue: null,
    canUndo: false,
    canRedo: false
  });

  useMarkdownUIStore.setState({
    isLoaded: false,
    isOptionsPanelOpen: true,
    optionsPanelTab: "options",
    isSyncScrollEnabled: true,
    editorPaneWidthPercent: 50,
    isWordWrapEnabled: true,
    fontSize: 16,
    viewMode: "split"
  });
}

function restoreMarkdownActions() {
  useMarkdownStore.setState({
    loadPersistedMarkdownText: originalMarkdownState.loadPersistedMarkdownText,
    setMarkdownText: originalMarkdownState.setMarkdownText,
    resetMarkdownText: originalMarkdownState.resetMarkdownText,
    undoMarkdownText: originalMarkdownState.undoMarkdownText,
    redoMarkdownText: originalMarkdownState.redoMarkdownText,
    restoreMarkdownHistorySnapshot: originalMarkdownState.restoreMarkdownHistorySnapshot,
    clearMarkdownHistory: originalMarkdownState.clearMarkdownHistory,
    commitPendingMarkdownHistory: originalMarkdownState.commitPendingMarkdownHistory
  });

  useMarkdownUIStore.setState({
    setIsOptionsPanelOpen: originalMarkdownUIState.setIsOptionsPanelOpen,
    setOptionsPanelTab: originalMarkdownUIState.setOptionsPanelTab,
    setIsSyncScrollEnabled: originalMarkdownUIState.setIsSyncScrollEnabled,
    setEditorPaneWidthPercent: originalMarkdownUIState.setEditorPaneWidthPercent,
    setIsWordWrapEnabled: originalMarkdownUIState.setIsWordWrapEnabled,
    setFontSize: originalMarkdownUIState.setFontSize,
    setViewMode: originalMarkdownUIState.setViewMode,
    resetSectionToDefaults: originalMarkdownUIState.resetSectionToDefaults,
    loadPersistedMarkdownUIState: originalMarkdownUIState.loadPersistedMarkdownUIState
  });
}

describe("MarkdownView", () => {
  beforeEach(() => {
    resetMarkdownState();
  });

  afterEach(() => {
    restoreMarkdownActions();
  });

  it("keeps default content hidden while persisted markdown loads", () => {
    useMarkdownStore.setState({
      loadPersistedMarkdownText: vi.fn()
    });
    useMarkdownUIStore.setState({
      loadPersistedMarkdownUIState: vi.fn()
    });

    render(<MarkdownView />);

    expect(screen.getByText("Loading markdown...")).toBeInTheDocument();
    expect(screen.queryByText("CompareCode Community Note")).not.toBeInTheDocument();
  });

  it("renders editor and preview panes with default content", async () => {
    render(<MarkdownView />);

    expect(await screen.findByText("Markdown")).toBeInTheDocument();
    expect(screen.getAllByText("Preview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CompareCode Community Note").length).toBeGreaterThan(0);
  });

  it("toggles the options panel with O outside editable fields", async () => {
    render(<MarkdownView />);

    await screen.findByText("CompareCode Community Note");
    expect(useMarkdownUIStore.getState().isOptionsPanelOpen).toBe(true);

    fireEvent.keyDown(document, { key: "o" });

    await waitFor(() => {
      expect(useMarkdownUIStore.getState().isOptionsPanelOpen).toBe(false);
    });
  });

  it("keeps O available for markdown text input", async () => {
    render(<MarkdownView />);

    const textarea = await screen.findByRole("textbox");
    expect(useMarkdownUIStore.getState().isOptionsPanelOpen).toBe(true);

    fireEvent.keyDown(textarea, { key: "o" });

    expect(useMarkdownUIStore.getState().isOptionsPanelOpen).toBe(true);
  });
});
