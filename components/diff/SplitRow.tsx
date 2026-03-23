import React, { memo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { ChangeBlock, DiffChangeType } from "@/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";
import { getBlockColorClass } from "@/utils/diffHelpers";
import { getRowContainerClass, getWordWrapClass, cn } from "@/utils/uiHelpers";
import { RowControls } from "./RowControls";
import { BlockHeaderControls } from "./BlockHeaderControls";
import { DiffFragmentList } from "./DiffFragmentList";

export interface SplitRowData {
  id: string;
  type: "line" | "controls" | "header-controls";
  block: ChangeBlock;
  oldIndex: number;
  newIndex: number;
  isFirst: boolean;
  isLast: boolean;
  isSelectable: boolean;
  isFirstLine?: boolean;
  isLastLine?: boolean;
}

interface SplitRowProps {
  row: SplitRowData;
  virtualRow: VirtualItem;
  settings: AppSettings;
  hoveredBlockId: string | null;
  setHoveredBlockId: (id: string | null) => void;
  selectBlock: (id: string | null) => void;
  mergeBlock: (block: ChangeBlock, dir: MergeDirection, settings: AppSettings) => void;
  selectionSide: "left" | "right" | null;
  setSelectionSide: (side: "left" | "right" | null) => void;
  measureRef: (node: HTMLElement | null) => void;
}

export const SplitRow = memo(({ row, virtualRow, settings, hoveredBlockId, setHoveredBlockId, selectBlock, mergeBlock, selectionSide, setSelectionSide, measureRef }: SplitRowProps) => {
  const isHovered = hoveredBlockId === row.block.id && row.isSelectable && !row.block.isSelected;
  const textContentClass = getWordWrapClass(settings.isWordWrapEnabled, settings.isWordWrapEnabled ? "w-full" : "w-max min-w-full");
  const containerClass = getRowContainerClass(row.isSelectable, row.block.isSelected || false);

  if (row.type === "header-controls") {
    return (
      <div
        data-index={virtualRow.index}
        ref={measureRef}
        className="absolute top-0 left-0 w-full"
        style={{ transform: `translateY(${virtualRow.start}px)` }}
      >
        <BlockHeaderControls />
      </div>
    );
  }

  if (row.type === "controls") {
    return (
      <div
        data-index={virtualRow.index}
        ref={measureRef}
        className="absolute top-0 left-0 w-full"
        style={{ transform: `translateY(${virtualRow.start}px)` }}
      >
        <RowControls
          block={row.block}
          settings={settings}
          selectBlock={selectBlock}
          mergeBlock={mergeBlock}
        />
      </div>
    );
  }

  const oldLine = row.block.oldLines[row.oldIndex] || { lineNumber: null, kind: DiffChangeType.Imaginary, fragments: [ ] };
  const newLine = row.block.newLines[row.newIndex] || { lineNumber: null, kind: DiffChangeType.Imaginary, fragments: [ ] };

  const oldBackgroundClass = oldLine.kind === DiffChangeType.Imaginary
    ? "bg-diff-empty-bg"
    : getBlockColorClass(row.block.kind, "old", row.block.isWhitespaceChange, settings.ignoreWhitespace);

  const newBackgroundClass = newLine.kind === DiffChangeType.Imaginary
    ? "bg-diff-empty-bg"
    : getBlockColorClass(row.block.kind, "new", row.block.isWhitespaceChange, settings.ignoreWhitespace);

  const transformStyle = !settings.isWordWrapEnabled ? { transform: 'translateX(calc(-1 * var(--scroll-x, 0px)))' } : undefined;

  return (
    <div
      data-index={virtualRow.index}
      ref={measureRef}
      className="absolute top-0 left-0 w-full"
      style={{ transform: `translateY(${virtualRow.start}px)` }}
      onMouseEnter={() => setHoveredBlockId(row.block.id)}
      onMouseLeave={() => setHoveredBlockId(null)}
      onClick={row.isSelectable ? () => selectBlock(row.block.id) : undefined}
    >
      <div className={containerClass}>
        {isHovered && (
          <div className={cn(
            "absolute inset-0 bg-hover-overlay pointer-events-none z-10",
            row.isFirstLine && "rounded-t-md",
            row.isLastLine && "rounded-b-md"
          )} />
        )}
        <div className="flex min-h-6 w-full relative z-0">
          <div
            onMouseDown={() => setSelectionSide("left")}
            className={cn("flex flex-1 w-1/2 overflow-hidden", selectionSide === "right" && "select-none")}
          >
            <div className="flex min-h-6 w-full">
              <div className="shrink-0 select-none px-2 text-right text-text-secondary py-0.5 w-[calc(var(--line-num-width,3ch)+1rem)] bg-transparent z-10">
                {oldLine.lineNumber}
              </div>
              <div className={cn("flex-1 overflow-hidden relative", oldBackgroundClass, row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
                <div className={cn("px-2 py-0.5 font-mono min-h-6", textContentClass)} style={transformStyle}>
                  <DiffFragmentList fragments={oldLine.fragments} ignoreWhitespace={settings.ignoreWhitespace} />
                </div>
              </div>
            </div>
          </div>

          <div
            onMouseDown={() => setSelectionSide("right")}
            className={cn("flex flex-1 w-1/2 overflow-hidden border-l border-border-default", selectionSide === "left" && "select-none")}
          >
            <div className="flex min-h-6 w-full">
              <div className="shrink-0 select-none px-2 text-right text-text-secondary py-0.5 w-[calc(var(--line-num-width,3ch)+1rem)] bg-transparent z-10">
                {newLine.lineNumber}
              </div>
              <div className={cn("flex-1 overflow-hidden relative", newBackgroundClass, row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
                <div className={cn("px-2 py-0.5 font-mono min-h-6", textContentClass)} style={transformStyle}>
                  <DiffFragmentList fragments={newLine.fragments} ignoreWhitespace={settings.ignoreWhitespace} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SplitRow.displayName = "SplitRow";