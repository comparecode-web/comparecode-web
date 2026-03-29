"use client";

import { useEffect, useCallback, useMemo } from "react";
import { MdHistory, MdDelete, MdHistoryToggleOff } from "react-icons/md";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useAppStore } from "@/store/useAppStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Button } from "@/components/ui/Button";
import { HistoryItemCard } from "./HistoryItemCard";
import { DiffHistoryItem } from "@/types/history";
import { useLiveTimeTicker } from "@/hooks/useLiveTimeTicker";

export function HistoryView() {
  const { items, loadHistory, deleteItem, deleteAll, toggleBookmark } = useHistoryStore();
  const loadFromHistory = useEditorStore((state) => state.loadFromHistory);
  const navigate = useAppStore((state) => state.navigate);
  const settings = useSettingsStore((state) => state.settings);
  const [listRef] = useAutoAnimate<HTMLDivElement>({ duration: 300, easing: 'ease-out' });
  const tickerNowMs = useLiveTimeTicker(items.map((item) => item.lastActionAt ?? item.updatedAt ?? item.createdAt));

  const bookmarkedCount = useMemo(() => items.filter((i) => i.isBookmarked).length, [items]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRestore = useCallback((item: DiffHistoryItem) => {
    const compareMode = item.compareMode ?? "text";
    if (compareMode === "image") {
      navigate("image");
      return;
    }

    loadFromHistory(item.originalText, item.modifiedText, settings, item.id);
    navigate("text");
  }, [loadFromHistory, navigate, settings]);

  const handleDeleteAll = useCallback(async () => {
    if (window.confirm("You are about to delete the whole history database. Are you sure?")) {
      await deleteAll();
    }
  }, [deleteAll]);

  const handleDeleteItem = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this item?")) {
      await deleteItem(id);
    }
  }, [deleteItem]);

  const handleToggleBookmark = useCallback(async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    await toggleBookmark(id, currentStatus);
  }, [toggleBookmark]);

  return (
    <div className="flex h-full w-full flex-col bg-bg-secondary">
      <div className="flex h-(--header-height) shrink-0 items-center justify-between border-b border-border-default bg-bg-primary px-3 sm:px-6 relative">
        <div className="flex items-center gap-2 sm:gap-3">
          <MdHistory className="text-xl sm:text-2xl text-text-secondary" />
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">History</h2>
        </div>

        {items.length > 0 && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden items-center gap-3 sm:gap-6 text-sm font-bold min-[400px]:flex">
            <span className="text-text-secondary">Items: {items.length}</span>
            <span className="text-accent-primary">Bookmarked: {bookmarkedCount}</span>
          </div>
        )}

        <div className="flex items-center">
          {items.length > 0 && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAll}
                leftIcon={<MdDelete className="text-xl" />}
                title="Clear all history"
                className="hidden sm:inline-flex"
              >
                Delete All
              </Button>
              <button
                onClick={handleDeleteAll}
                className="sm:hidden p-1.5 text-danger hover:bg-hover-overlay rounded transition-colors"
                title="Clear all history"
              >
                <MdDelete className="text-xl" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <MdHistoryToggleOff className="mb-4 text-5xl sm:text-6xl text-text-secondary" />
            <h3 className="text-base sm:text-lg font-semibold text-text-secondary">No history yet</h3>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">Comparisons will appear here automatically.</p>
          </div>
        ) : (
          <div ref={listRef} className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:gap-3">
            {items.map((item) => (
              <HistoryItemCard
                key={item.id}
                item={item}
                fontFamily={settings.fontFamily}
                dateFormat={settings.dateFormat}
                timeFormat={settings.timeFormat}
                tickerNowMs={tickerNowMs}
                onRestore={handleRestore}
                onToggleBookmark={handleToggleBookmark}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}