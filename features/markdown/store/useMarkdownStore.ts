import { create } from "zustand";
import { markdownDefaultContent } from "@/features/markdown/services/markdownDefaultContent";
import { loadMarkdownContent, resetMarkdownContent, saveMarkdownContent } from "@/features/markdown/services/markdownStorage";

interface MarkdownState {
  markdownText: string;
  isLoaded: boolean;
  lastEditedAt: number | null;
  loadPersistedMarkdownText: () => void;
  setMarkdownText: (value: string) => void;
  resetMarkdownText: () => void;
}

export const useMarkdownStore = create<MarkdownState>((set) => ({
  markdownText: markdownDefaultContent,
  isLoaded: false,
  lastEditedAt: null,
  loadPersistedMarkdownText: () => {
    set({
      markdownText: loadMarkdownContent(),
      isLoaded: true
    });
  },
  setMarkdownText: (value) => {
    set({
      markdownText: value,
      isLoaded: true,
      lastEditedAt: Date.now()
    });
  },
  resetMarkdownText: () => {
    set({
      markdownText: resetMarkdownContent(),
      isLoaded: true,
      lastEditedAt: Date.now()
    });
  }
}));

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleMarkdownContentSave(value: string): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    saveMarkdownContent(value);
    saveTimer = null;
  }, 400);
}
