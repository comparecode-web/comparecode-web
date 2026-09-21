import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HistoryItemCard } from "../HistoryItemCard";
import { defaultSettings } from "@/config/defaults";
import type { DiffHistoryItem } from "@/types/history";
import type { MouseEvent } from "react";

describe("HistoryItemCard", () => {
  it("keeps open, bookmark and delete actions separate", async () => {
    const user = userEvent.setup();
    const item: DiffHistoryItem = {
      id: "comparison", originalText: "Original content", modifiedText: "Modified content",
      createdAt: "2026-09-01T00:00:00Z", isBookmarked: false
    };
    const onRestore = vi.fn();
    const onToggleBookmark = vi.fn((event: MouseEvent) => event.stopPropagation());
    const onDelete = vi.fn((event: MouseEvent) => event.stopPropagation());
    render(<HistoryItemCard item={item} isTransitioning={false} fontFamily={defaultSettings.fontFamily}
      dateFormat={defaultSettings.dateFormat} timeFormat={defaultSettings.timeFormat}
      tickerNowMs={Date.parse("2026-09-20T00:00:00Z")} onRestore={onRestore}
      onToggleBookmark={onToggleBookmark} onDelete={onDelete} />);

    await user.click(screen.getByTitle("Bookmark this item"));
    await user.click(screen.getByTitle("Delete this item"));
    expect(onToggleBookmark).toHaveBeenCalledWith(expect.anything(), item.id, false);
    expect(onDelete).toHaveBeenCalledWith(expect.anything(), item.id);
    expect(onRestore).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Open comparison/ }));
    expect(onRestore).toHaveBeenCalledExactlyOnceWith(item);
    await user.click(screen.getByText("Original content"));
    expect(onRestore).toHaveBeenCalledTimes(2);
  });
});
