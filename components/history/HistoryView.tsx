"use client";

import { useEffect } from "react";
import { MdHistory, MdDelete, MdHistoryToggleOff, MdArrowForward, MdBookmark, MdBookmarkBorder } from "react-icons/md";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useEditorStore } from "@/store/useEditorStore";
import { useAppStore } from "@/store/useAppStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getLineCount, generatePreviewLines, getRelativeTime } from "@/utils/formatters";
import clsx from "clsx";

export function HistoryView() {
  const { items, loadHistory, deleteItem, deleteAll, toggleBookmark } = useHistoryStore();
  const loadFromHistory = useEditorStore((state) => state.loadFromHistory);
  const navigate = useAppStore((state) => state.navigate);
  const settings = useSettingsStore((state) => state.settings);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRestore = (original: string, modified: string) => {
    loadFromHistory(original, modified, settings);
    navigate("editor");
  };

  const handleDeleteAll = async () => {
    if (window.confirm("You are about to delete the whole history database. Are you sure?")) {
      await deleteAll();
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this item?")) {
      await deleteItem(id);
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    await toggleBookmark(id, currentStatus);
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg-secondary">
      <div className="flex items-center justify-between border-b border-border-default bg-bg-primary px-6 py-1.5">
        <div className="flex items-center gap-3">
          <MdHistory className="text-2xl text-text-secondary" />
          <h2 className="text-xl font-bold text-text-primary">History</h2>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-1 rounded bg-danger px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-danger-hover"
            title="Clear all history"
          >
            <MdDelete className="text-lg" />
            Delete All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <MdHistoryToggleOff className="mb-4 text-6xl text-text-secondary" />
            <h3 className="text-lg font-semibold text-text-secondary">No history yet</h3>
            <p className="mt-1 text-sm text-text-secondary">Comparisons will appear here automatically.</p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
            {items.map((item) => {
              const origLines = generatePreviewLines(item.originalText);
              const modLines = generatePreviewLines(item.modifiedText);
              const maxDisplayLines = Math.max(origLines.length, modLines.length);

              const displayOrigLines = [...origLines];
              while (displayOrigLines.length < maxDisplayLines) {
                displayOrigLines.push("");
              }

              const displayModLines = [...modLines];
              while (displayModLines.length < maxDisplayLines) {
                displayModLines.push("");
              }

              return (
                <div
                  key={item.id}
                  onClick={() => handleRestore(item.originalText, item.modifiedText)}
                  className={clsx(
                    "group relative flex cursor-pointer flex-col overflow-hidden rounded-md border bg-bg-primary p-4 shadow-sm transition-all hover:border-accent-primary hover:shadow-md",
                    item.isBookmarked ? "border-accent-primary" : "border-border-default"
                  )}
                >
                  {item.isBookmarked && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent-primary/10 pointer-events-none" />
                  )}

                  <div className="relative flex items-center justify-between">
                    <span className="min-w-[70px] truncate text-xs font-bold text-accent-primary">
                      {getRelativeTime(item.createdAt)}
                    </span>

                    <div className="mx-4 flex flex-1 items-center gap-4 overflow-hidden">
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="mb-1 text-[11px] font-semibold text-danger">
                          {getLineCount(item.originalText)} lines
                        </span>
                        <div className="flex flex-col gap-0.5 rounded bg-bg-secondary px-3 py-2">
                          {displayOrigLines.map((line, idx) => (
                            <span key={`orig-${idx}`} className="block truncate font-mono text-xs text-text-secondary min-h-[16px]">
                              {line === "" ? "\u00A0" : line}
                            </span>
                          ))}
                        </div>
                      </div>

                      <MdArrowForward className="text-lg shrink-0 text-text-secondary" />

                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="mb-1 text-[11px] font-semibold text-success">
                          {getLineCount(item.modifiedText)} lines
                        </span>
                        <div className="flex flex-col gap-0.5 rounded bg-bg-secondary px-3 py-2">
                          {displayModLines.map((line, idx) => (
                            <span key={`mod-${idx}`} className="block truncate font-mono text-xs font-semibold text-text-primary min-h-[16px]">
                              {line === "" ? "\u00A0" : line}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={(e) => handleToggleBookmark(e, item.id, item.isBookmarked)}
                        className="rounded p-2 text-accent-primary transition-colors hover:bg-hover-overlay"
                        title="Bookmark this item"
                      >
                        {item.isBookmarked ? (
                          <MdBookmark className="text-2xl" />
                        ) : (
                          <MdBookmarkBorder className="text-2xl" />
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(e, item.id)}
                        className="rounded p-2 text-danger transition-colors hover:bg-hover-overlay"
                        title="Delete this item"
                      >
                        <MdDelete className="text-2xl" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}