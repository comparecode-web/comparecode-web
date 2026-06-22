import { markdownDefaultContent } from "./markdownDefaultContent";

const CONTENT_KEY = "comparecode.markdownPreview.content.v1";
const UI_KEY = "comparecode.markdownPreview.ui.v1";

export interface PersistedMarkdownUIState {
  editorPaneWidthPercent: number;
  isSyncScrollEnabled: boolean;
  fontSize: number;
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
