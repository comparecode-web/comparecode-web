import { beforeEach, describe, expect, it, vi } from "vitest";
import { markdownDefaultContent } from "@/features/markdown/services/markdownDefaultContent";
import { scheduleMarkdownContentSave, useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";

function resetMarkdownStore() {
  useMarkdownStore.setState({
    markdownText: markdownDefaultContent,
    isLoaded: false,
    lastEditedAt: null
  });
}

describe("useMarkdownStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
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
});
