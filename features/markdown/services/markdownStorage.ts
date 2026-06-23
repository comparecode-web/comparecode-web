import { markdownDefaultContent } from "./markdownDefaultContent";
import type { MarkdownViewMode } from "@/features/markdown/types/markdown";

const CONTENT_KEY = "comparecode.markdownPreview.content.v1";
const UI_KEY = "comparecode.markdownPreview.ui.v1";
const HISTORY_KEY = "comparecode.markdownPreview.history.v1";

export interface PersistedMarkdownUIState {
  editorPaneWidthPercent: number;
  isSyncScrollEnabled: boolean;
  fontSize: number;
  viewMode: MarkdownViewMode;
}

export interface PersistedMarkdownHistoryState {
  past: Array<string>;
  future: Array<string>;
}

export function loadMarkdownContent(): string {
  if (typeof window === "undefined") {
    return markdownDefaultContent;
  }

  const stored = window.localStorage.getItem(CONTENT_KEY);
  return stored ?? markdownDefaultContent;
}

export function saveMarkdownContent(value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CONTENT_KEY, value);
}

export function resetMarkdownContent(): string {
  saveMarkdownContent(markdownDefaultContent);
  return markdownDefaultContent;
}

export function loadMarkdownUIState(): Partial<PersistedMarkdownUIState> {
  if (typeof window === "undefined") {
    return {};
  }

  const stored = window.localStorage.getItem(UI_KEY);
  if (!stored) {
    return {};
  }

  try {
    const parsed = JSON.parse(stored) as Partial<PersistedMarkdownUIState>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveMarkdownUIState(value: PersistedMarkdownUIState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(UI_KEY, JSON.stringify(value));
}

export function loadMarkdownHistoryState(): PersistedMarkdownHistoryState {
  if (typeof window === "undefined") {
    return { past: [], future: [] };
  }

  const stored = window.sessionStorage.getItem(HISTORY_KEY);
  if (!stored) {
    return { past: [], future: [] };
  }

  try {
    const parsed = JSON.parse(stored) as Partial<PersistedMarkdownHistoryState>;
    return {
      past: Array.isArray(parsed.past) ? parsed.past.filter((item): item is string => typeof item === "string") : [],
      future: Array.isArray(parsed.future) ? parsed.future.filter((item): item is string => typeof item === "string") : []
    };
  } catch {
    return { past: [], future: [] };
  }
}

export function saveMarkdownHistoryState(value: PersistedMarkdownHistoryState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(value));
  } catch {
    window.sessionStorage.removeItem(HISTORY_KEY);
  }
}

export function resetMarkdownHistoryState(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(HISTORY_KEY);
}
