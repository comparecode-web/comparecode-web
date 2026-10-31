import React, { memo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { BlockType, ChangeBlock, ChangeLine, DiffChangeType } from "@/features/compare/text/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";
import { getBlockColorClass } from "@/features/compare/text/utils/diffHelpers";
import { getWordWrapClass, cn } from "@/utils/uiHelpers";
import { RowControls } from "./RowControls";
import { BlockHeaderControls } from "./BlockHeaderControls";
import { DiffFragmentList } from "./DiffFragmentList";
import { MoveAnnotation } from "./MoveAnnotation";
import { LINE_CELL_CLASS, LINE_NUMBER_GUTTER_CLASS, getRowContainerClass } from "./rowLayout";
import type { SyntaxLine } from "../../services/syntax/tokenizeSyntax";
import type { CollapsedRowInfo } from "@/features/compare/text/utils/unchangedRegions";

export interface SplitRowData {
  id: string;
  type: "line" | "controls" | "header-controls" | "collapsed";
  block: ChangeBlock;
  oldIndex: number;
  newIndex: number;
  isFirst: boolean;
  isLast: boolean;
  isSelectable: boolean;
  isFirstLine?: boolean;
  isLastLine?: boolean;
  collapsed?: CollapsedRowInfo;
}

interface SplitRowProps {
  oldSyntaxLine?: SyntaxLine;
  newSyntaxLine?: SyntaxLine;
  row: SplitRowData;
  virtualRow: VirtualItem;
  settings: AppSettings;
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

const IMAGINARY_LINE: ChangeLine = { lineNumber: null, kind: DiffChangeType.Imaginary, fragments: [] };

function getSplitLine(row: SplitRowData, side: "old" | "new"): ChangeLine {
  return (side === "old" ? row.block.oldLines[row.oldIndex] : row.block.newLines[row.newIndex]) || IMAGINARY_LINE;
}

export function getSplitCellBackground(row: SplitRowData, side: "old" | "new"): string {
  if (getSplitLine(row, side).kind === DiffChangeType.Imaginary) return "bg-diff-empty-bg";
  if (row.block.kind === BlockType.Unchanged) return "bg-transparent";
  return getBlockColorClass(row.block.kind, side);
}

export const SplitRow = memo(({ row, virtualRow, settings, selectedBlockId, activeMoveId, onActivateMove, setHoveredBlockId, selectBlock, mergeBlock, selectionSide, setSelectionSide, measureRef, oldSyntaxLine, newSyntaxLine }: SplitRowProps) => {
  const isLinked = row.block.move?.counterpartBlockId === selectedBlockId;
  const moveSide = row.block.move?.role === "from" ? "left" : row.block.move?.role === "to" ? "right" : null;
  const moveFocused = !!row.block.move && row.block.move.id === activeMoveId;
  const textContentClass = getWordWrapClass(settings.isWordWrapEnabled, settings.isWordWrapEnabled ? "w-full" : "w-max min-w-full");
  const containerClass = getRowContainerClass(row.isSelectable, !!row.block.isSelected);

  if (row.type === "header-controls") {
    return (
      <div
        data-index={virtualRow.index}
        data-block-id={row.block.id}
        data-row-type={row.type}
        ref={measureRef}
        className="absolute left-0 w-full"
        style={{ top: virtualRow.start }}
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
        className="absolute left-0 w-full"
        style={{ top: virtualRow.start }}
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

  const oldLine = getSplitLine(row, "old");
  const newLine = getSplitLine(row, "new");

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
      className="absolute left-0 w-full"
      style={{ top: virtualRow.start }}
      onMouseEnter={() => setHoveredBlockId(row.block.id)}
      onMouseLeave={() => setHoveredBlockId(null)}
      onClick={row.isSelectable ? () => {
        if (!window.getSelection()?.isCollapsed) return;
        selectBlock(row.block.id);
      } : undefined}
    >
      {moveSide && <div className={cn(
        "pointer-events-none absolute inset-y-0 z-20 border-x border-accent/70",
        moveSide === "left" ? "left-1 right-1/2" : "left-1/2 right-1",
        row.isFirstLine && "rounded-t-md border-t",
        row.isLastLine && "rounded-b-md border-b",
        (moveFocused || row.block.isSelected || isLinked) && "border-accent"
      )} />}
      <div className={containerClass}>
        <div className="flex min-h-6 w-full relative z-0">
          <div
            onMouseDown={() => setSelectionSide("left")}
            className={cn("flex flex-1 w-1/2 overflow-hidden", selectionSide === "right" && "select-none")}
          >
            <div className="flex min-h-6 w-full">
              <div className={cn(LINE_NUMBER_GUTTER_CLASS, "select-none px-2 text-right text-text-secondary py-0.5 bg-transparent z-10")}>
                {oldLine.lineNumber}
              </div>
              <div className={cn(LINE_CELL_CLASS, "overflow-hidden relative", row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
                <div className={cn("px-2 py-0.5 min-h-6", textContentClass)} style={transformStyle}>
                  <DiffFragmentList fragments={oldLine.fragments} lineEndingLabel={oldLine.lineEndingLabel} suppressHighlight={!!row.block.move} syntaxLine={oldSyntaxLine} />
                </div>
              </div>
            </div>
          </div>

          <div
            onMouseDown={() => setSelectionSide("right")}
            className={cn("flex flex-1 w-1/2 overflow-hidden", selectionSide === "left" && "select-none")}
          >
            <div className="flex min-h-6 w-full">
              <div className={cn(LINE_NUMBER_GUTTER_CLASS, "select-none px-2 text-right text-text-secondary py-0.5 bg-transparent z-10")}>
                {newLine.lineNumber}
              </div>
              <div className={cn(LINE_CELL_CLASS, "overflow-hidden relative", row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
                <div className={cn("px-2 py-0.5 min-h-6", textContentClass)} style={transformStyle}>
                  <DiffFragmentList fragments={newLine.fragments} lineEndingLabel={newLine.lineEndingLabel} suppressHighlight={!!row.block.move} syntaxLine={newSyntaxLine} />
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


