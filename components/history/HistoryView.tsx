"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { MdHistory, MdDelete, MdHistoryToggleOff } from "react-icons/md";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useRouter } from "next/navigation";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useTextHistoryRestore } from "@/features/compare/text";
import { useImageHistoryRestore } from "@/features/compare/image";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Button } from "@/components/ui/Button";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { HistoryItemCard } from "./HistoryItemCard";
import { DiffHistoryItem } from "@/types/history";
import { useLiveTimeTicker } from "@/hooks/useLiveTimeTicker";
import { cn } from "@/utils/uiHelpers";
import type { CompareMode } from "@/features/compare/shared/types/compareMode";
import { HISTORY_SORT_OPTIONS, sortHistoryItems, type HistorySort, type HistorySortDirection } from "./historySorting";

type HistoryFilter = "all" | CompareMode;

const HISTORY_FILTER_OPTIONS: Array<{ value: HistoryFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "text", label: "Text compare" },
  { value: "image", label: "Image compare" }
];

function getHistoryItemMode(item: DiffHistoryItem): CompareMode {
  return item.snapshot?.mode ?? item.compareMode ?? "text";
}

export function HistoryView() {
  const { items, loadHistory, deleteItem, deleteAll, toggleBookmark } = useHistoryStore();
  const { restoreTextHistoryItem } = useTextHistoryRestore();
  const { restoreImageHistoryItem } = useImageHistoryRestore();
  const router = useRouter();
  const settings = useSettingsStore((state) => state.settings);
  const [listRef, setListAutoAnimateEnabled] = useAutoAnimate<HTMLDivElement>({ duration: 300, easing: 'ease-out' });
  const tickerNowMs = useLiveTimeTicker(items.map((item) => item.lastActionAt ?? item.updatedAt ?? item.createdAt));
  const [movingItemId, setMovingItemId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [historySort, setHistorySort] = useState<HistorySort>("default");
  const [sortDirection, setSortDirection] = useState<HistorySortDirection>("desc");
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const movingResetTimerRef = useRef<number | null>(null);
  const filterAnimationFrameRef = useRef<number | null>(null);
  const filterAnimationTimerRef = useRef<number | null>(null);

  const filteredItems = useMemo(() => (
    historyFilter === "all"
      ? items
      : items.filter((item) => getHistoryItemMode(item) === historyFilter)
  ), [historyFilter, items]);
  const sortedItems = useMemo(() => sortHistoryItems(filteredItems, historySort, sortDirection), [filteredItems, historySort, sortDirection]);
  const bookmarkedCount = useMemo(() => filteredItems.filter((i) => i.isBookmarked).length, [filteredItems]);
  const textHistoryCount = useMemo(() => items.filter((item) => getHistoryItemMode(item) === "text").length, [items]);
  const imageHistoryCount = useMemo(() => items.filter((item) => getHistoryItemMode(item) === "image").length, [items]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    return () => {
      if (movingResetTimerRef.current !== null) {
        window.clearTimeout(movingResetTimerRef.current);
      }
      if (filterAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(filterAnimationFrameRef.current);
      }
      if (filterAnimationTimerRef.current !== null) {
        window.clearTimeout(filterAnimationTimerRef.current);
      }
    };
  }, []);

  const handleHistoryFilterChange = useCallback((value: string) => {
    const nextFilter = value as HistoryFilter;
    if (nextFilter === historyFilter) {
      return;
    }

    setListAutoAnimateEnabled(false);
    setIsFilterTransitioning(true);
    setHistoryFilter(nextFilter);

    if (filterAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(filterAnimationFrameRef.current);
    }
    if (filterAnimationTimerRef.current !== null) {
      window.clearTimeout(filterAnimationTimerRef.current);
    }

    filterAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setIsFilterTransitioning(false);
      filterAnimationFrameRef.current = null;
    });

    filterAnimationTimerRef.current = window.setTimeout(() => {
      setListAutoAnimateEnabled(true);
      filterAnimationTimerRef.current = null;
    }, 220);
  }, [historyFilter, setListAutoAnimateEnabled]);

  const handleRestore = useCallback((item: DiffHistoryItem) => {
    const compareMode = getHistoryItemMode(item);
    if (compareMode === "image") {
      restoreImageHistoryItem(item);
      router.push("/image");
      return;
    }

    restoreTextHistoryItem(item, settings);
    router.push("/text");
  }, [restoreImageHistoryItem, restoreTextHistoryItem, router, settings]);

  const handleDeleteAll = useCallback(async () => {
    if (window.confirm("You are about to delete the whole history database, including items hidden by the current filter. Are you sure?")) {
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
    setMovingItemId(id);

    if (movingResetTimerRef.current !== null) {
      window.clearTimeout(movingResetTimerRef.current);
      movingResetTimerRef.current = null;
    }

    try {
      await toggleBookmark(id, currentStatus);
    } finally {
      movingResetTimerRef.current = window.setTimeout(() => {
        setMovingItemId((current) => (current === id ? null : current));
        movingResetTimerRef.current = null;
      }, 400);
    }
  }, [toggleBookmark]);

  return (
    <div className="@container/history h-full min-w-0 w-full overflow-y-auto bg-bg-secondary p-3 sm:p-6 custom-scrollbar">
      <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <MdHistory className="text-xl sm:text-2xl text-text-secondary" />
          <div><h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">History</h2><p className="mt-1 text-sm text-text-secondary">Revisit your comparisons, saved in this browser.</p></div>
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap gap-3 rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-sm font-semibold">
            <span className="text-text-secondary">Text: {textHistoryCount}</span>
            <span className="text-text-secondary">Image: {imageHistoryCount}</span>
            <span className="text-accent-primary" title="Bookmarked items in the current filter">Bookmarked: {bookmarkedCount}</span>
          </div>
        )}

      </div>
        {items.length > 0 && (
          <div className="relative z-30 flex flex-wrap items-center gap-3 rounded-xl border border-border-default bg-bg-primary p-3 shadow-sm" data-tool-controls>
              <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">Filter:</span>
              <SelectDropdown
                value={historyFilter}
                onChange={handleHistoryFilterChange}
                options={HISTORY_FILTER_OPTIONS}
                className="w-32 sm:w-40"
                triggerClassName="h-8 py-1 pl-2 pr-7 text-xs sm:h-9 sm:text-sm"
                menuClassName="min-w-40"
              />
              </div>
              <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">Sort:</span>
              <SelectDropdown value={historySort} options={HISTORY_SORT_OPTIONS} onChange={(value) => setHistorySort(value as HistorySort)} className="w-36 sm:w-40" />
              </div>
              {historySort !== "default" && <Button variant="outline" size="sm" onClick={() => setSortDirection((value) => value === "desc" ? "asc" : "desc")}>{sortDirection === "desc" ? "Newest first" : "Oldest first"}</Button>}
              <span className="mr-auto text-xs text-text-secondary">Bookmarks first · Bookmarked count follows filter</span>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAll}
                leftIcon={<MdDelete className="text-xl" />}
                title="Clear all history"
                className="min-h-10"
              >
                Delete all
              </Button>
          </div>
        )}
      <div className="min-h-40">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <MdHistoryToggleOff className="mb-4 text-5xl sm:text-6xl text-text-secondary" />
            <h3 className="text-base sm:text-lg font-semibold text-text-secondary">No history yet</h3>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">Comparisons will appear here automatically.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MdHistoryToggleOff className="mb-4 text-5xl sm:text-6xl text-text-secondary" />
            <h3 className="text-base sm:text-lg font-semibold text-text-secondary">No matching history items</h3>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">Try switching the history filter to All.</p>
          </div>
        ) : (
          <div
            ref={listRef}
            className={cn(
              "flex w-full flex-col gap-3 transition-[opacity,transform] duration-200 ease-out",
              isFilterTransitioning ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
            )}
          >
            {sortedItems.map((item) => (
              <HistoryItemCard
                key={item.id}
                item={item}
                isTransitioning={movingItemId === item.id}
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
    </div>
  );
}
