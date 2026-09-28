import React, { memo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { BlockType, ChangeBlock, DiffChangeType } from "@/features/compare/text/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";
import { getBlockColorClass } from "@/features/compare/text/utils/diffHelpers";
import { getRowContainerClass, getWordWrapClass, cn } from "@/utils/uiHelpers";
import { RowControls } from "./RowControls";
import { BlockHeaderControls } from "./BlockHeaderControls";
import { DiffFragmentList } from "./DiffFragmentList";
import { MoveAnnotation } from "./MoveAnnotation";

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
  selectedBlockId: string | null;
  activeMoveId: string | null;
  onActivateMove: (block: ChangeBlock) => void;
  setHoveredBlockId: (id: string | null) => void;
  selectBlock: (id: string | null) => void;
  mergeBlock: (block: ChangeBlock, dir: MergeDirection, settings: AppSettings) => void;
  selectionSide: "left" | "right" | null;
  setSelectionSide: (side: "left" | "right" | null) => void;
  measureRef: (node: HTMLElement | null) => void;
}

export const SplitRow = memo(({ row, virtualRow, settings, hoveredBlockId, selectedBlockId, activeMoveId, onActivateMove, setHoveredBlockId, selectBlock, mergeBlock, selectionSide, setSelectionSide, measureRef }: SplitRowProps) => {
  const isLinked = row.block.move?.counterpartBlockId === selectedBlockId;
  const moveSide = row.block.move?.role === "from" ? "left" : row.block.move?.role === "to" ? "right" : null;
  const moveFocused = !!row.block.move && row.block.move.id === activeMoveId;
  const isHovered = hoveredBlockId === row.block.id && row.isSelectable && !row.block.isSelected;
  const textContentClass = getWordWrapClass(settings.isWordWrapEnabled, settings.isWordWrapEnabled ? "w-full" : "w-max min-w-full");
  const containerClass = getRowContainerClass(row.isSelectable, !!row.block.isSelected);

  if (row.type === "header-controls") {
    return (
      <div
        data-index={virtualRow.index}
        data-block-id={row.block.id}
        data-row-type={row.type}
        ref={measureRef}
        className="absolute top-0 left-0 w-full"
        style={{ transform: `translateY(${virtualRow.start}px)` }}
      >
        {row.block.move && <MoveAnnotation block={row.block} split onActivate={onActivateMove} />}
        {row.block.isSelected && <BlockHeaderControls />}
      </div>
    );
  }

  if (row.type === "controls") {
    return (
      <div
        data-index={virtualRow.index}
        data-block-id={row.block.id}
        data-row-type={row.type}
        ref={measureRef}
        className="absolute top-0 left-0 w-full"
        style={{ transform: `translateY(${virtualRow.start}px)` }}
      >
        {row.block.isSelected && (
          <RowControls
            block={row.block}
            settings={settings}
            selectBlock={selectBlock}
            mergeBlock={mergeBlock}
          />
        )}
      </div>
    );
  }

  const oldLine = row.block.oldLines[row.oldIndex] || { lineNumber: null, kind: DiffChangeType.Imaginary, fragments: [ ] };
  const newLine = row.block.newLines[row.newIndex] || { lineNumber: null, kind: DiffChangeType.Imaginary, fragments: [ ] };

  const oldBackgroundClass = oldLine.kind === DiffChangeType.Imaginary
    ? "bg-diff-empty-bg"
    : row.block.kind === BlockType.Unchanged
      ? "bg-transparent"
    : getBlockColorClass(row.block.kind, "old");

  const newBackgroundClass = newLine.kind === DiffChangeType.Imaginary
    ? "bg-diff-empty-bg"
    : row.block.kind === BlockType.Unchanged
      ? "bg-transparent"
    : getBlockColorClass(row.block.kind, "new");

  const transformStyle = !settings.isWordWrapEnabled ? { transform: 'translateX(calc(-1 * var(--scroll-x, 0px)))' } : undefined;

  return (
    <div
      data-index={virtualRow.index}
      data-block-id={row.block.id}
      data-row-type={row.type}
      data-first-line={row.type === "line" && row.isFirstLine ? "true" : undefined}
      data-move-id={row.block.move?.id}
      data-move-linked={isLinked ? "true" : undefined}
      data-move-focused={moveFocused ? "true" : undefined}
      ref={measureRef}
      className="absolute top-0 left-0 w-full"
      style={{ transform: `translateY(${virtualRow.start}px)` }}
      onMouseEnter={() => setHoveredBlockId(row.block.id)}
      onMouseLeave={() => setHoveredBlockId(null)}
      onClick={row.isSelectable ? () => {
        if (!window.getSelection()?.isCollapsed) return;
        selectBlock(row.block.id);
      } : undefined}
    >
      {moveSide && <div className={cn(
        "pointer-events-none absolute inset-y-0 z-20 border-x border-accent-primary/70",
        moveSide === "left" ? "left-1 right-1/2" : "left-1/2 right-1",
        row.isFirstLine && "rounded-t-md border-t",
        row.isLastLine && "rounded-b-md border-b",
        (moveFocused || row.block.isSelected || isLinked) && "border-accent-primary"
      )} />}
      <div className={containerClass}>
        {isHovered && (
          <div className={cn(
            "absolute inset-0 bg-hover-overlay pointer-events-none z-10 transition-opacity duration-(--duration-short)",
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
              <div className={cn("flex-1 overflow-hidden relative mx-1 transition-colors duration-(--duration-medium)", oldBackgroundClass, row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
                <div className={cn("px-2 py-0.5 min-h-6", textContentClass)} style={transformStyle}>
                  <DiffFragmentList fragments={oldLine.fragments} lineEndingLabel={oldLine.lineEndingLabel} suppressHighlight={!!row.block.move} />
                </div>
              </div>
            </div>
          </div>

          <div
            onMouseDown={() => setSelectionSide("right")}
            className={cn("flex flex-1 w-1/2 overflow-hidden", selectionSide === "left" && "select-none")}
          >
            <div className="flex min-h-6 w-full">
              <div className="shrink-0 select-none px-2 text-right text-text-secondary py-0.5 w-[calc(var(--line-num-width,3ch)+1rem)] bg-transparent z-10">
                {newLine.lineNumber}
              </div>
              <div className={cn("flex-1 overflow-hidden relative mx-1 transition-colors duration-(--duration-medium)", newBackgroundClass, row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
                <div className={cn("px-2 py-0.5 min-h-6", textContentClass)} style={transformStyle}>
                  <DiffFragmentList fragments={newLine.fragments} lineEndingLabel={newLine.lineEndingLabel} suppressHighlight={!!row.block.move} />
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


