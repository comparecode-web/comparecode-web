import { beforeEach, describe, expect, it, vi } from "vitest";
import { markdownDefaultContent } from "@/features/markdown/services/markdownDefaultContent";
import { scheduleMarkdownContentSave, useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";

function resetMarkdownStore() {
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
}

describe("useMarkdownStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    resetMarkdownStore();
    vi.useRealTimers();
  });

  it("loads default markdown when no persisted draft exists", () => {
    useMarkdownStore.getState().loadPersistedMarkdownText();

    expect(useMarkdownStore.getState().markdownText).toBe(markdownDefaultContent);
    expect(useMarkdownStore.getState().isLoaded).toBe(true);
  });

  it("loads persisted markdown when a draft exists", () => {
    window.localStorage.setItem("comparecode.markdownPreview.content.v1", "# Persisted draft");

    useMarkdownStore.getState().loadPersistedMarkdownText();

    expect(useMarkdownStore.getState().markdownText).toBe("# Persisted draft");
  });

  it("resets markdown content and updates persisted storage", () => {
    window.localStorage.setItem("comparecode.markdownPreview.content.v1", "# Custom draft");

    useMarkdownStore.getState().resetMarkdownText();

    expect(useMarkdownStore.getState().markdownText).toBe(markdownDefaultContent);
    expect(window.localStorage.getItem("comparecode.markdownPreview.content.v1")).toBe(markdownDefaultContent);
  });

  it("debounces markdown content persistence", () => {
    vi.useFakeTimers();

    scheduleMarkdownContentSave("# First");
    scheduleMarkdownContentSave("# Second");

    expect(window.localStorage.getItem("comparecode.markdownPreview.content.v1")).toBeNull();

    vi.advanceTimersByTime(400);

    expect(window.localStorage.getItem("comparecode.markdownPreview.content.v1")).toBe("# Second");
  });

  it("undoes and redoes checkpoint changes", () => {
    useMarkdownStore.getState().setMarkdownText("# First", { history: "checkpoint" });
    useMarkdownStore.getState().setMarkdownText("# Second", { history: "checkpoint" });

    expect(useMarkdownStore.getState().canUndo).toBe(true);

    useMarkdownStore.getState().undoMarkdownText();

    expect(useMarkdownStore.getState().markdownText).toBe("# First");
    expect(useMarkdownStore.getState().canRedo).toBe(true);

    useMarkdownStore.getState().redoMarkdownText();

    expect(useMarkdownStore.getState().markdownText).toBe("# Second");
  });

  it("persists undo history in session storage", () => {
    useMarkdownStore.getState().setMarkdownText("# Session draft", { history: "checkpoint" });
    resetMarkdownStore();

    useMarkdownStore.getState().loadPersistedMarkdownText();

    expect(useMarkdownStore.getState().canUndo).toBe(true);

    useMarkdownStore.getState().undoMarkdownText();

    expect(useMarkdownStore.getState().markdownText).toBe(markdownDefaultContent);
  });

  it("groups typing changes into one pending undo step", () => {
    vi.useFakeTimers();

    useMarkdownStore.getState().setMarkdownText("# A");
    useMarkdownStore.getState().setMarkdownText("# AB");

    expect(useMarkdownStore.getState().canUndo).toBe(true);

    vi.advanceTimersByTime(1000);
    useMarkdownStore.getState().undoMarkdownText();

    expect(useMarkdownStore.getState().markdownText).toBe(markdownDefaultContent);
  });

  it("restores a previous session history snapshot without dropping redo states", () => {
    useMarkdownStore.getState().setMarkdownText("# First", { history: "checkpoint" });
    useMarkdownStore.getState().setMarkdownText("# Second", { history: "checkpoint" });
    useMarkdownStore.getState().setMarkdownText("# Third", { history: "checkpoint" });

    useMarkdownStore.getState().restoreMarkdownHistorySnapshot("past", 1);

    expect(useMarkdownStore.getState().markdownText).toBe("# First");
    expect(useMarkdownStore.getState().canRedo).toBe(true);

    useMarkdownStore.getState().redoMarkdownText();

    expect(useMarkdownStore.getState().markdownText).toBe("# Second");
  });

  it("clears session history without changing current markdown text", () => {
    useMarkdownStore.getState().setMarkdownText("# First", { history: "checkpoint" });
    useMarkdownStore.getState().setMarkdownText("# Second", { history: "checkpoint" });

    useMarkdownStore.getState().clearMarkdownHistory();

    expect(useMarkdownStore.getState().markdownText).toBe("# Second");
    expect(useMarkdownStore.getState().canUndo).toBe(false);
    expect(useMarkdownStore.getState().canRedo).toBe(false);
    expect(window.sessionStorage.getItem("comparecode.markdownPreview.history.v1")).toBeNull();
  });
});
