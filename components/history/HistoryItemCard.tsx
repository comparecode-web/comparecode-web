import { memo } from "react";
import { MdDelete, MdArrowForward, MdArrowDownward, MdBookmark, MdBookmarkBorder } from "react-icons/md";
import { formatAbsoluteDateTimeWithSettings, generatePreviewLines, getLineCount, getRelativeTime } from "@/utils/formatters";
import { cn } from "@/utils/uiHelpers";
import { DiffHistoryItem } from "@/types/history";
import { DateFormat, TimeFormat } from "@/types/settings";

interface HistoryItemCardProps {
  item: DiffHistoryItem;
  fontFamily: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  tickerNowMs: number;
  onRestore: (item: DiffHistoryItem) => void;
  onToggleBookmark: (e: React.MouseEvent, id: string, currentStatus: boolean) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export const HistoryItemCard = memo(({ item, fontFamily, dateFormat, timeFormat, tickerNowMs, onRestore, onToggleBookmark, onDelete }: HistoryItemCardProps) => {
  const actionAt = item.lastActionAt ?? item.updatedAt ?? item.createdAt;
  const createdAt = item.createdAt;
  const isImageSnapshot = item.snapshot?.mode === "image";

  const originalPreviewSource = isImageSnapshot
    ? (item.snapshot.originalImageUrl || "[No original image]")
    : item.originalText;
  const modifiedPreviewSource = isImageSnapshot
    ? (item.snapshot.modifiedImageUrl || "[No modified image]")
    : item.modifiedText;

  const origLines = generatePreviewLines(originalPreviewSource);
  const modLines = generatePreviewLines(modifiedPreviewSource);
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
      onClick={() => onRestore(item)}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-md border bg-bg-primary p-3 pb-7 sm:p-4 sm:pb-8 shadow-sm transition-all duration-(--duration-medium) hover:border-accent-primary hover:shadow-md",
        item.isBookmarked ? "border-accent-primary" : "border-border-default"
      )}
    >
      {item.isBookmarked && (
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-accent-primary/25 pointer-events-none" />
      )}

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 z-10">
        <div className="flex items-center justify-between sm:contents">
          <div className="min-w-36 flex flex-col gap-1">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
              Last activity
            </span>
            <span className="truncate text-xs font-bold text-accent-primary">
              {getRelativeTime(actionAt, tickerNowMs)}
            </span>
            <span className="truncate text-[11px] text-text-secondary">
              {formatAbsoluteDateTimeWithSettings(actionAt, dateFormat, timeFormat)}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={(e) => onToggleBookmark(e, item.id, item.isBookmarked)}
              className="rounded p-1.5 sm:p-2 text-accent-primary transition-colors duration-(--duration-short) hover:bg-hover-overlay"
              title="Bookmark this item"
            >
              {item.isBookmarked ? (
                <MdBookmark className="text-xl sm:text-2xl" />
              ) : (
                <MdBookmarkBorder className="text-xl sm:text-2xl" />
              )}
            </button>
            <button
              onClick={(e) => onDelete(e, item.id)}
              className="rounded p-1.5 sm:p-2 text-danger transition-colors duration-(--duration-short) hover:bg-hover-overlay"
              title="Delete this item"
            >
              <MdDelete className="text-xl sm:text-2xl" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2 sm:gap-4 overflow-hidden sm:mx-4">
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="mb-1 text-[11px] font-semibold text-danger">
              {isImageSnapshot ? "Original image" : `${getLineCount(item.originalText)} lines`}
            </span>
            <div className="flex flex-col gap-0.5 rounded border border-border-default bg-bg-secondary px-2 sm:px-3 py-1.5 sm:py-2" style={{ fontFamily }}>
              {displayOrigLines.map((line, idx) => (
                <span key={`orig-${idx}`} className="block truncate text-[11px] sm:text-xs font-semibold text-text-primary min-h-3.5 sm:min-h-4">
                  {line === "" ? "\u00A0" : line}
                </span>
              ))}
            </div>
          </div>

          <MdArrowForward className="text-lg shrink-0 text-text-secondary hidden sm:block" />
          <MdArrowDownward className="text-lg shrink-0 text-text-secondary self-center sm:hidden" />

          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="mb-1 text-[11px] font-semibold text-success">
              {isImageSnapshot ? "Modified image" : `${getLineCount(item.modifiedText)} lines`}
            </span>
            <div className="flex flex-col gap-0.5 rounded border border-border-default bg-bg-secondary px-2 sm:px-3 py-1.5 sm:py-2" style={{ fontFamily }}>
              {displayModLines.map((line, idx) => (
                <span key={`mod-${idx}`} className="block truncate text-[11px] sm:text-xs font-semibold text-text-primary min-h-3.5 sm:min-h-4">
                  {line === "" ? "\u00A0" : line}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-2 left-3 z-10 text-[10px] text-text-secondary sm:bottom-2.5 sm:left-4">
        Created: {formatAbsoluteDateTimeWithSettings(createdAt, dateFormat, timeFormat)}
      </div>
    </div>
  );
});

HistoryItemCard.displayName = "HistoryItemCard";