import { create } from "zustand";
import { markdownDefaultContent } from "@/features/markdown/services/markdownDefaultContent";
import {
  loadMarkdownContent,
  loadMarkdownHistoryState,
  resetMarkdownContent,
  resetMarkdownHistoryState,
  saveMarkdownContent,
  saveMarkdownHistoryState
} from "@/features/markdown/services/markdownStorage";

type MarkdownHistoryMode = "typing" | "checkpoint" | "skip";

interface SetMarkdownTextOptions {
  history?: MarkdownHistoryMode;
}

interface MarkdownState {
  markdownText: string;
  isLoaded: boolean;
  lastEditedAt: number | null;
  past: Array<string>;
  future: Array<string>;
  pendingUndoValue: string | null;
  canUndo: boolean;
  canRedo: boolean;
  loadPersistedMarkdownText: () => void;
  setMarkdownText: (value: string, options?: SetMarkdownTextOptions) => void;
  resetMarkdownText: () => void;
  undoMarkdownText: () => void;
  redoMarkdownText: () => void;
  restoreMarkdownHistorySnapshot: (kind: "past" | "future", index: number) => void;
  clearMarkdownHistory: () => void;
  commitPendingMarkdownHistory: () => void;
}

const maxHistoryEntries = 100;
const typingHistoryDelay = 1000;

function trimHistory(values: Array<string>): Array<string> {
  return values.slice(Math.max(0, values.length - maxHistoryEntries));
}

function buildHistoryFlags(past: Array<string>, future: Array<string>, pendingUndoValue: string | null) {
  return {
    canUndo: past.length > 0 || pendingUndoValue !== null,
    canRedo: future.length > 0
  };
}

function persistHistory(past: Array<string>, future: Array<string>, pendingUndoValue: string | null): void {
  saveMarkdownHistoryState({
    past: pendingUndoValue === null ? past : trimHistory([...past, pendingUndoValue]),
    future
  });
}

let historyTimer: ReturnType<typeof setTimeout> | null = null;

function clearHistoryTimer(): void {
  if (historyTimer) {
    clearTimeout(historyTimer);
    historyTimer = null;
  }
}

export const useMarkdownStore = create<MarkdownState>((set) => ({
  markdownText: markdownDefaultContent,
  isLoaded: false,
  lastEditedAt: null,
  past: [],
  future: [],
  pendingUndoValue: null,
  canUndo: false,
  canRedo: false,
  loadPersistedMarkdownText: () => {
    const history = loadMarkdownHistoryState();
    set({
      markdownText: loadMarkdownContent(),
      isLoaded: true,
      past: trimHistory(history.past),
      future: trimHistory(history.future),
      pendingUndoValue: null,
      ...buildHistoryFlags(history.past, history.future, null)
    });
  },
  setMarkdownText: (value, options) => {
    set((state) => {
      if (state.markdownText === value) {
        return state;
      }

      const historyMode = options?.history ?? "typing";
      let past = state.past;
      let future = state.future;
      let pendingUndoValue = state.pendingUndoValue;

      if (historyMode === "skip") {
        clearHistoryTimer();
      } else if (historyMode === "checkpoint") {
        clearHistoryTimer();
        const baseValue = pendingUndoValue ?? state.markdownText;
        past = baseValue === value ? past : trimHistory([...past, baseValue]);
        future = [];
        pendingUndoValue = null;
      } else {
        if (pendingUndoValue === null) {
          pendingUndoValue = state.markdownText;
        }

        future = [];
        clearHistoryTimer();
        historyTimer = setTimeout(() => {
          useMarkdownStore.getState().commitPendingMarkdownHistory();
        }, typingHistoryDelay);
      }

      persistHistory(past, future, pendingUndoValue);

      return {
        markdownText: value,
        isLoaded: true,
        lastEditedAt: Date.now(),
        past,
        future,
        pendingUndoValue,
        ...buildHistoryFlags(past, future, pendingUndoValue)
      };
    });
  },
  resetMarkdownText: () => {
    const nextValue = resetMarkdownContent();
    useMarkdownStore.getState().setMarkdownText(nextValue, { history: "checkpoint" });
  },
  undoMarkdownText: () => {
    set((state) => {
      clearHistoryTimer();

      const future = trimHistory([...state.future, state.markdownText]);
      let past = state.past;
      let nextValue: string | null = null;

      if (state.pendingUndoValue !== null) {
        nextValue = state.pendingUndoValue;
      } else if (past.length > 0) {
        nextValue = past[past.length - 1];
        past = past.slice(0, -1);
      }

      if (nextValue === null) {
        return state;
      }

      persistHistory(past, future, null);

      return {
        markdownText: nextValue,
        isLoaded: true,
        lastEditedAt: Date.now(),
        past,
        future,
        pendingUndoValue: null,
        ...buildHistoryFlags(past, future, null)
      };
    });
  },
  redoMarkdownText: () => {
    set((state) => {
      clearHistoryTimer();

      if (state.future.length === 0) {
        return state;
      }

      const nextValue = state.future[state.future.length - 1];
      const future = state.future.slice(0, -1);
      const past = trimHistory([...state.past, state.markdownText]);

      persistHistory(past, future, null);

      return {
        markdownText: nextValue,
        isLoaded: true,
        lastEditedAt: Date.now(),
        past,
        future,
        pendingUndoValue: null,
        ...buildHistoryFlags(past, future, null)
      };
    });
  },
  restoreMarkdownHistorySnapshot: (kind, index) => {
    set((state) => {
      clearHistoryTimer();

      const past = state.pendingUndoValue === null ? state.past : trimHistory([...state.past, state.pendingUndoValue]);
      const future = state.future;

      if (kind === "past") {
        if (index < 0 || index >= past.length) {
          return state;
        }

        const nextValue = past[index];
        const nextPast = past.slice(0, index);
        const nextFuture = trimHistory([...future, state.markdownText, ...past.slice(index + 1)]);
        persistHistory(nextPast, nextFuture, null);

        return {
          markdownText: nextValue,
          isLoaded: true,
          lastEditedAt: Date.now(),
          past: nextPast,
          future: nextFuture,
          pendingUndoValue: null,
          ...buildHistoryFlags(nextPast, nextFuture, null)
        };
      }

      if (index < 0 || index >= future.length) {
        return state;
      }

      const nextValue = future[index];
      const nextPast = trimHistory([...past, state.markdownText, ...future.slice(index + 1)]);
      const nextFuture = future.slice(0, index);
      persistHistory(nextPast, nextFuture, null);

      return {
        markdownText: nextValue,
        isLoaded: true,
        lastEditedAt: Date.now(),
        past: nextPast,
        future: nextFuture,
        pendingUndoValue: null,
        ...buildHistoryFlags(nextPast, nextFuture, null)
      };
    });
  },
  clearMarkdownHistory: () => {
    clearHistoryTimer();
    resetMarkdownHistoryState();
    set({
      past: [],
      future: [],
      pendingUndoValue: null,
      canUndo: false,
      canRedo: false
    });
  },
  commitPendingMarkdownHistory: () => {
    set((state) => {
      clearHistoryTimer();

      if (state.pendingUndoValue === null) {
        return state;
      }

      const past = trimHistory([...state.past, state.pendingUndoValue]);
      const future: Array<string> = [];
      persistHistory(past, future, null);

      return {
        past,
        future,
        pendingUndoValue: null,
        ...buildHistoryFlags(past, future, null)
      };
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
