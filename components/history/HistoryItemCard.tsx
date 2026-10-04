import Image from "next/image";
import { memo } from "react";
import { MdDelete, MdDownload, MdArrowForward, MdArrowDownward, MdBookmark, MdBookmarkBorder } from "react-icons/md";
import { formatAbsoluteDateTimeWithSettings, generatePreviewLines, getLineCount, getRelativeTime } from "@/utils/formatters";
import { cn } from "@/utils/uiHelpers";
import { DiffHistoryItem } from "@/types/history";
import { DateFormat, TimeFormat } from "@/types/settings";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";

function formatImageDimensions(width?: number, height?: number): string {
  if (!width || !height) {
    return "Unknown size";
  }

  return `${width}x${height}`;
}

interface HistoryItemCardProps {
  item: DiffHistoryItem;
  isTransitioning?: boolean;
  fontFamily: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  tickerNowMs: number;
  onRestore: (item: DiffHistoryItem) => void;
  onToggleBookmark: (e: React.MouseEvent, id: string, currentStatus: boolean) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onExport: (id: string) => void;
  isExporting?: boolean;
}

export const HistoryItemCard = memo(({ item, isTransitioning, fontFamily, dateFormat, timeFormat, tickerNowMs, onRestore, onToggleBookmark, onDelete, onExport, isExporting }: HistoryItemCardProps) => {
  const actionAt = item.lastActionAt ?? item.updatedAt ?? item.createdAt;
  const createdAt = item.createdAt;
  const imageSnapshot = item.snapshot?.mode === "image" ? item.snapshot : null;
  const isImageSnapshot = imageSnapshot !== null;
  const originalPreviewImageUrl = imageSnapshot?.originalThumbnailDataUrl || imageSnapshot?.originalImageDataUrl || imageSnapshot?.originalImageUrl || "";
  const modifiedPreviewImageUrl = imageSnapshot?.modifiedThumbnailDataUrl || imageSnapshot?.modifiedImageDataUrl || imageSnapshot?.modifiedImageUrl || "";
  const originalDimensions = formatImageDimensions(imageSnapshot?.originalImageWidth, imageSnapshot?.originalImageHeight);
  const modifiedDimensions = formatImageDimensions(imageSnapshot?.modifiedImageWidth, imageSnapshot?.modifiedImageHeight);
  const originalImageName = imageSnapshot?.originalImageName || "Original image";
  const modifiedImageName = imageSnapshot?.modifiedImageName || "Modified image";

  const originalPreviewSource = isImageSnapshot
    ? (imageSnapshot.originalImageUrl || "[No original image]")
    : item.originalText;
  const modifiedPreviewSource = isImageSnapshot
    ? (imageSnapshot.modifiedImageUrl || "[No modified image]")
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
        "group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border bg-bg-primary p-4 shadow-sm transition-colors hover:border-accent-primary",
        isTransitioning ? "z-50" : item.isBookmarked ? "z-20" : "z-0",
        item.isBookmarked ? "border-accent-primary" : "border-border-default"
      )}
    >
      {item.isBookmarked && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-accent-primary" />
      )}
      <span className={cn(
        "absolute right-4 top-4 rounded-md px-2 py-0.5 text-xs font-semibold",
        isImageSnapshot ? "bg-success/10 text-success" : "bg-bg-selected text-accent-primary"
      )}>{isImageSnapshot ? "Image" : "Text"}</span>

      <div className="relative z-10 grid min-w-0 items-center gap-4 @5xl/history:grid-cols-[10rem_minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <div className="flex min-w-0 max-w-full flex-col gap-1 pr-14 @5xl/history:pr-0">
            <span className="truncate text-[0.625rem] font-semibold text-text-secondary">
              Last activity
            </span>
            <span className="truncate text-xs font-bold text-accent-primary">
              {getRelativeTime(actionAt, tickerNowMs)}
            </span>
            <span className="truncate text-[0.6875rem] text-text-secondary">
              {formatAbsoluteDateTimeWithSettings(actionAt, dateFormat, timeFormat)}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              size="lg"
              onClick={(e) => onToggleBookmark(e, item.id, item.isBookmarked)}
              title="Bookmark this item"
              aria-pressed={item.isBookmarked}
            >
              {item.isBookmarked ? (
                <MdBookmark className="text-xl text-accent-primary sm:text-2xl" />
              ) : (
                <MdBookmarkBorder className="text-xl text-accent-primary sm:text-2xl" />
              )}
            </IconButton>
            <IconButton size="lg" title="Export this comparison" disabled={isExporting} onClick={event => { event.stopPropagation(); onExport(item.id); }}><MdDownload className="text-xl sm:text-2xl" /></IconButton>
            <IconButton
              size="lg"
              onClick={(e) => onDelete(e, item.id)}
              title="Delete this item"
            >
              <MdDelete className="text-xl text-danger sm:text-2xl" />
            </IconButton>
          </div>
          <div className="pointer-events-none text-xs text-text-secondary">
            Created: {formatAbsoluteDateTimeWithSettings(createdAt, dateFormat, timeFormat)}
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-stretch gap-3 @2xl/history:flex-row @2xl/history:items-center">
          <div className="relative flex min-w-0 flex-1 flex-col">
            <span className="mb-1 text-[0.6875rem] font-semibold text-danger @5xl/history:absolute @5xl/history:bottom-full">
              {isImageSnapshot ? "Original image" : `${getLineCount(item.originalText)} lines`}
            </span>
            {isImageSnapshot ? (
              <div className="flex items-center gap-2 rounded border border-border-default bg-bg-secondary px-2 sm:px-3 py-1.5 sm:py-2">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded border border-border-default bg-bg-primary">
                  {originalPreviewImageUrl ? (
                    <Image
                      src={originalPreviewImageUrl}
                      alt="Original image preview"
                      width={56}
                      height={56}
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[0.625rem] text-text-secondary">No preview</div>
                  )}
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="truncate text-[0.6875rem] sm:text-xs font-semibold text-text-primary">{originalImageName}</span>
                  <span className="truncate text-[0.6875rem] text-text-secondary">{originalDimensions}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 rounded border border-border-default bg-bg-secondary px-2 sm:px-3 py-1.5 sm:py-2" style={{ fontFamily }}>
                {displayOrigLines.map((line, idx) => (
                  <span key={`orig-${idx}`} className="block truncate text-[0.6875rem] sm:text-xs font-semibold text-text-primary min-h-3.5 sm:min-h-4">
                    {line === "" ? "\u00A0" : line}
                  </span>
                ))}
              </div>
            )}
          </div>

          <MdArrowForward className="hidden shrink-0 text-lg text-text-secondary @2xl/history:block" />
          <MdArrowDownward className="shrink-0 self-center text-lg text-text-secondary @2xl/history:hidden" />

          <div className="relative flex min-w-0 flex-1 flex-col">
            <span className="mb-1 text-[0.6875rem] font-semibold text-success @5xl/history:absolute @5xl/history:bottom-full">
              {isImageSnapshot ? "Modified image" : `${getLineCount(item.modifiedText)} lines`}
            </span>
            {isImageSnapshot ? (
              <div className="flex items-center gap-2 rounded border border-border-default bg-bg-secondary px-2 sm:px-3 py-1.5 sm:py-2">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded border border-border-default bg-bg-primary">
                  {modifiedPreviewImageUrl ? (
                    <Image
                      src={modifiedPreviewImageUrl}
                      alt="Modified image preview"
                      width={56}
                      height={56}
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[0.625rem] text-text-secondary">No preview</div>
                  )}
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="truncate text-[0.6875rem] sm:text-xs font-semibold text-text-primary">{modifiedImageName}</span>
                  <span className="truncate text-[0.6875rem] text-text-secondary">{modifiedDimensions}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 rounded border border-border-default bg-bg-secondary px-2 sm:px-3 py-1.5 sm:py-2" style={{ fontFamily }}>
                {displayModLines.map((line, idx) => (
                  <span key={`mod-${idx}`} className="block truncate text-[0.6875rem] sm:text-xs font-semibold text-text-primary min-h-3.5 sm:min-h-4">
                    {line === "" ? "\u00A0" : line}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button className="min-h-11" onClick={(event) => { event.stopPropagation(); onRestore(item); }} rightIcon={<MdArrowForward />}>Open comparison</Button>
      </div>

    </div>
  );
});

HistoryItemCard.displayName = "HistoryItemCard";
