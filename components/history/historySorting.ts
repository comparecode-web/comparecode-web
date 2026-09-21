import type { DiffHistoryItem } from "@/types/history";

export type HistorySort = "default" | "activity" | "created";
export type HistorySortDirection = "desc" | "asc";

export const HISTORY_SORT_OPTIONS: Array<{ value: HistorySort; label: string }> = [
  { value: "default", label: "Default" },
  { value: "activity", label: "Last activity" },
  { value: "created", label: "Created" }
];

function getSortTime(item: DiffHistoryItem, sort: HistorySort): number | null {
  const values = sort === "created" ? [item.createdAt] : [item.lastActionAt, item.updatedAt, item.createdAt];
  for (const value of values) {
    if (!value) continue;
    const time = Date.parse(value);
    if (Number.isFinite(time)) return time;
  }
  return null;
}

export function sortHistoryItems(items: readonly DiffHistoryItem[], sort: HistorySort, direction: HistorySortDirection): DiffHistoryItem[] {
  if (sort === "default") return [...items];
  return items.map((item, index) => ({ item, index, time: getSortTime(item, sort) })).sort((a, b) => {
    if (a.item.isBookmarked !== b.item.isBookmarked) return a.item.isBookmarked ? -1 : 1;
    if (a.time === null || b.time === null) {
      if (a.time !== b.time) return a.time === null ? 1 : -1;
    } else if (a.time !== b.time) {
      return direction === "asc" ? a.time - b.time : b.time - a.time;
    }
    return a.index - b.index;
  }).map(({ item }) => item);
}
