import { beforeEach, describe, expect, it } from "vitest";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

function resetMarkdownUIStore() {
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

describe("useMarkdownUIStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetMarkdownUIStore();
  });

  it("persists sync scrolling and editor pane width", () => {
    useMarkdownUIStore.getState().setIsSyncScrollEnabled(false);
    useMarkdownUIStore.getState().setEditorPaneWidthPercent(64);
    useMarkdownUIStore.getState().setFontSize(18);
    useMarkdownUIStore.getState().setViewMode("preview");

    const stored = JSON.parse(window.localStorage.getItem("comparecode.markdownPreview.ui.v1") ?? "{}");

    expect(stored).toMatchObject({
      isSyncScrollEnabled: false,
      editorPaneWidthPercent: 64,
      fontSize: 18,
      viewMode: "preview"
    });
  });

  it("clamps editor pane width before persisting", () => {
    useMarkdownUIStore.getState().setEditorPaneWidthPercent(90);

    expect(useMarkdownUIStore.getState().editorPaneWidthPercent).toBe(70);
  });

  it("loads persisted UI state", () => {
    window.localStorage.setItem("comparecode.markdownPreview.ui.v1", JSON.stringify({
      isSyncScrollEnabled: false,
      editorPaneWidthPercent: 35,
      fontSize: 19,
      viewMode: "editor"
    }));

    useMarkdownUIStore.getState().loadPersistedMarkdownUIState();

    expect(useMarkdownUIStore.getState()).toMatchObject({
      isLoaded: true,
      isSyncScrollEnabled: false,
      editorPaneWidthPercent: 35,
      fontSize: 19,
      viewMode: "editor"
    });
  });

  it("resets selected markdown UI sections to defaults and persists them", () => {
    useMarkdownUIStore.getState().setIsSyncScrollEnabled(false);
    useMarkdownUIStore.getState().setFontSize(20);
    useMarkdownUIStore.getState().setViewMode("preview");

    useMarkdownUIStore.getState().resetSectionToDefaults(["isSyncScrollEnabled", "fontSize", "viewMode"]);

    expect(useMarkdownUIStore.getState()).toMatchObject({
      isSyncScrollEnabled: true,
      fontSize: 16,
      viewMode: "split"
    });

    const stored = JSON.parse(window.localStorage.getItem("comparecode.markdownPreview.ui.v1") ?? "{}");
    expect(stored).toMatchObject({
      isSyncScrollEnabled: true,
      fontSize: 16,
      viewMode: "split"
    });
  });
});
