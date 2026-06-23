"use client";

import { MdDeleteSweep, MdHistoryToggleOff } from "react-icons/md";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { cn } from "@/utils/uiHelpers";

interface MarkdownHistoryItem {
  id: string;
  title: string;
  detail: string;
  value: string;
  kind: "past" | "current" | "future";
  index: number;
}

function summarizeMarkdown(value: string): string {
  const firstContentLine = value
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstContentLine ?? "Empty Markdown";
}

function getWordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function buildHistoryItems(markdownText: string, past: Array<string>, future: Array<string>, pendingUndoValue: string | null): Array<MarkdownHistoryItem> {
  const undoStack = pendingUndoValue === null ? past : [...past, pendingUndoValue];
  const pastItems = undoStack.map((value, index) => ({
    id: `past-${index}`,
    title: index === 0 ? "Initial state" : `Undo point ${index}`,
    detail: `${getWordCount(value)} words · ${value.length} chars`,
    value,
    kind: "past" as const,
    index
  })).reverse();
  const futureItems = future.map((value, index) => ({
    id: `future-${index}`,
    title: `Redo point ${future.length - index}`,
    detail: `${getWordCount(value)} words · ${value.length} chars`,
    value,
    kind: "future" as const,
    index
  })).reverse();

  return [
    ...futureItems,
    {
      id: "current",
      title: "Current state",
      detail: `${getWordCount(markdownText)} words · ${markdownText.length} chars`,
      value: markdownText,
      kind: "current",
      index: -1
    },
    ...pastItems
  ];
}

function getItemClass(kind: MarkdownHistoryItem["kind"]): string {
  if (kind === "current") {
    return "border-accent-primary bg-hover-overlay";
  }

  if (kind === "future") {
    return "border-border-default bg-bg-primary";
  }

  return "border-border-default bg-bg-secondary";
}

export function MarkdownHistoryView() {
  const markdownText = useMarkdownStore((state) => state.markdownText);
  const past = useMarkdownStore((state) => state.past);
  const future = useMarkdownStore((state) => state.future);
  const pendingUndoValue = useMarkdownStore((state) => state.pendingUndoValue);
  const restoreMarkdownHistorySnapshot = useMarkdownStore((state) => state.restoreMarkdownHistorySnapshot);
  const clearMarkdownHistory = useMarkdownStore((state) => state.clearMarkdownHistory);
  const items = buildHistoryItems(markdownText, past, future, pendingUndoValue);
  const hasHistory = past.length > 0 || future.length > 0 || pendingUndoValue !== null;

  if (!hasHistory) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <MdHistoryToggleOff className="text-4xl text-text-secondary" />
        <p className="text-sm font-semibold text-text-secondary">No Markdown history yet</p>
        <p className="text-xs text-text-secondary">Undo and redo points appear here during this session.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4">
      <button
        type="button"
        onClick={clearMarkdownHistory}
        className="mb-1 flex h-8 items-center justify-center gap-2 rounded border border-border-default bg-bg-primary px-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-hover-overlay hover:text-text-primary"
      >
        <MdDeleteSweep className="text-base" />
        <span>Clear session history</span>
      </button>
      {items.map((item) => {
        const isCurrent = item.kind === "current";

        return (
          <button
            key={item.id}
            type="button"
            disabled={isCurrent}
            onClick={() => {
              if (item.kind === "past" || item.kind === "future") {
                restoreMarkdownHistorySnapshot(item.kind, item.index);
              }
            }}
            className={cn(
              "w-full rounded-md border px-2.5 py-2 text-left transition-all hover:brightness-95 disabled:cursor-default disabled:hover:brightness-100",
              getItemClass(item.kind)
            )}
            title={isCurrent ? "Current Markdown state" : "Restore this Markdown state"}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text-primary">{item.title}</span>
              {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wider text-accent-primary">Active</span>}
            </div>
            <p className="mt-1 truncate text-xs text-text-secondary">{summarizeMarkdown(item.value)}</p>
            <p className="mt-0.5 text-[10px] text-text-secondary">{item.detail}</p>
          </button>
        );
      })}
    </div>
  );
}
