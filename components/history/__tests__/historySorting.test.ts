import { describe, expect, it } from "vitest";
import { sortHistoryItems } from "../historySorting";
import type { DiffHistoryItem } from "@/types/history";

const item = (id: string, values: Partial<DiffHistoryItem> = {}): DiffHistoryItem => ({ id, originalText: "", modifiedText: "", createdAt: "2026-01-01T00:00:00Z", isBookmarked: false, ...values });
const ids = (items: DiffHistoryItem[]) => items.map(({ id }) => id);

describe("history sorting", () => {
  it("preserves the exact service order for Default without mutating its array", () => {
    const source = Object.freeze([item("second"), item("first", { isBookmarked: true })]);
    const result = sortHistoryItems(source, "default", "asc");
    expect(ids(result)).toEqual(["second", "first"]);
    expect(result).not.toBe(source);
  });

  it.each(["asc", "desc"] as const)("keeps bookmarks first with %s date order", (direction) => {
    const source = Object.freeze([item("recent", { createdAt: "2026-09-01" }), item("old"), item("pinned-old", { isBookmarked: true }), item("pinned-new", { isBookmarked: true, createdAt: "2026-08-01" })]);
    expect(ids(sortHistoryItems(source, "created", direction))).toEqual(direction === "asc" ? ["pinned-old", "pinned-new", "old", "recent"] : ["pinned-new", "pinned-old", "recent", "old"]);
    expect(ids([...source])).toEqual(["recent", "old", "pinned-old", "pinned-new"]);
  });

  it("uses the first valid activity date and retains tie order", () => {
    const source = [item("activity", { lastActionAt: "2026-04-01", updatedAt: "2026-09-01" }), item("fallback", { lastActionAt: "invalid", updatedAt: "2026-05-01" }), item("tie-1"), item("tie-2"), item("missing", { createdAt: "invalid" })];
    expect(ids(sortHistoryItems(source, "activity", "desc"))).toEqual(["fallback", "activity", "tie-1", "tie-2", "missing"]);
    expect(ids(sortHistoryItems(source, "activity", "asc"))).toEqual(["tie-1", "tie-2", "activity", "fallback", "missing"]);
  });

  it("does not use activity as a fallback for invalid creation dates", () => {
    expect(ids(sortHistoryItems([item("missing", { createdAt: "", lastActionAt: "2026-09-01" }), item("valid")], "created", "asc"))).toEqual(["valid", "missing"]);
    expect(sortHistoryItems([], "created", "desc")).toEqual([]);
  });
});
