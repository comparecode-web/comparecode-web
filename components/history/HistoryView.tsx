"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { MdHistory, MdDelete, MdHistoryToggleOff } from "react-icons/md";
import { AnimatedHistoryList } from "./AnimatedHistoryList";
import { HistoryTransfer } from "./HistoryTransfer";
import { downloadHistoryBackup } from "@/services/historyDownload";
import { useToastStore } from "@/store/useToastStore";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContent } from "@/components/layout/PageContent";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useTextHistoryRestore } from "@/features/compare/text";
import { useImageHistoryRestore } from "@/features/compare/image";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Button } from "@/components/ui/Button";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { HistoryItemCard } from "./HistoryItemCard";
import { DiffHistoryItem } from "@/types/history";
import { useLiveTimeTicker } from "@/hooks/useLiveTimeTicker";
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
  const tickerNowMs = useLiveTimeTicker(items.map((item) => item.lastActionAt ?? item.updatedAt ?? item.createdAt));
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [historySort, setHistorySort] = useState<HistorySort>("default");
  const [sortDirection, setSortDirection] = useState<HistorySortDirection>("desc");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (id: string) => {
    setIsExporting(true);
    try {
      await downloadHistoryBackup(id);
    } catch (error) {
      useToastStore.getState().pushToast({ message: error instanceof Error ? error.message : "The comparison could not be exported.", tone: "error" });
    } finally {
      setIsExporting(false);
    }
  }, []);

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

  const handleHistoryFilterChange = useCallback((value: string) => {
    setHistoryFilter(value as HistoryFilter);
  }, []);

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
    await toggleBookmark(id, currentStatus);
  }, [toggleBookmark]);

  return (
    <PageContent className="@container/history" contentClassName="space-y-5">
      <PageHeader title="History" description="Revisit your comparisons, saved in this browser." icon={MdHistory} actions={items.length > 0 && (
          <div className="flex flex-wrap gap-3 rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-sm font-semibold">
            <span className="text-text-secondary">Text: {textHistoryCount}</span>
            <span className="text-text-secondary">Image: {imageHistoryCount}</span>
            <span className="text-accent-primary" title="Bookmarked items in the current filter">Bookmarked: {bookmarkedCount}</span>
          </div>
        )} />
        <HistoryTransfer onImported={loadHistory} />
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
        <AnimatedHistoryList items={sortedItems} empty={items.length === 0 ? (
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
        ) : null}>
            {(item) => (
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
                onExport={handleExport}
                isExporting={isExporting}
              />
            )}
          </AnimatedHistoryList>
      </div>
      </PageContent>
  );
}
