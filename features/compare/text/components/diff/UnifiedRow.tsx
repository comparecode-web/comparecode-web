import React, { memo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { ChangeBlock, TextFragment } from "@/features/compare/text/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";
import { getWordWrapClass, cn } from "@/utils/uiHelpers";
import { RowControls } from "./RowControls";
import { BlockHeaderControls } from "./BlockHeaderControls";
import { DiffFragmentList } from "./DiffFragmentList";
import { MoveAnnotation } from "./MoveAnnotation";
import { LINE_CELL_CLASS, LINE_NUMBER_GUTTER_CLASS, getRowContainerClass } from "./rowLayout";
import type { SyntaxLine } from "../../services/syntax/tokenizeSyntax";
import type { CollapsedRowInfo } from "@/features/compare/text/utils/unchangedRegions";

export interface UnifiedLineData {
  line1: number | string | null;
  line2: number | string | null;
  sign: string;
  fragments: Array<TextFragment>;
  bgClass: string;
  lineEndingLabel?: string;
}

export interface UnifiedRowData {
  id: string;
  type: "line" | "controls" | "header-controls" | "collapsed";
  block: ChangeBlock;
  lineIndex: number;
  unifiedLine?: UnifiedLineData;
  isFirst: boolean;
  isLast: boolean;
  isSelectable: boolean;
  isFirstLine?: boolean;
  isLastLine?: boolean;
  collapsed?: CollapsedRowInfo;
}

interface UnifiedRowProps {
  syntaxLine?: SyntaxLine;
  row: UnifiedRowData;
  virtualRow: VirtualItem;
  settings: AppSettings;
  selectedBlockId: string | null;
  activeMoveId: string | null;
  onActivateMove: (block: ChangeBlock) => void;
  setHoveredBlockId: (id: string | null) => void;
  selectBlock: (id: string | null) => void;
  mergeBlock: (block: ChangeBlock, dir: MergeDirection, settings: AppSettings) => void;
  measureRef: (node: HTMLElement | null) => void;
}

export const UnifiedRow = memo(({ row, virtualRow, settings, selectedBlockId, activeMoveId, onActivateMove, setHoveredBlockId, selectBlock, mergeBlock, measureRef, syntaxLine }: UnifiedRowProps) => {
  const isLinked = row.block.move?.counterpartBlockId === selectedBlockId;
  const moveFocused = !!row.block.move && row.block.move.id === activeMoveId;
  const wordWrapClass = getWordWrapClass(settings.isWordWrapEnabled);
  const containerClass = cn(
    getRowContainerClass(row.isSelectable, row.block.isSelected || false),
    row.block.move && "border-l-accent",
    (row.block.isSelected || isLinked || moveFocused) && "border-r-accent",
    (row.block.move || row.block.isSelected) && row.isFirstLine && "rounded-t-md border-t border-t-accent",
    (row.block.move || row.block.isSelected) && row.isLastLine && "rounded-b-md border-b border-b-accent"
  );

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
        {row.block.move && <MoveAnnotation block={row.block} onActivate={onActivateMove} />}
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

  const l = row.unifiedLine!;

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
      <div className={containerClass}>
        <div className="flex w-full flex-col relative z-0">
          <div className="flex min-h-6 w-full bg-transparent">
            <div className={cn(LINE_NUMBER_GUTTER_CLASS, "select-none px-2 text-right text-text-secondary py-0.5 sticky left-0 z-10 bg-transparent")}>
              {l.line1}
            </div>
            <div className={cn(LINE_NUMBER_GUTTER_CLASS, "select-none px-2 text-right text-text-secondary py-0.5 sticky z-10 bg-transparent")} style={{ left: 'calc(var(--line-num-width, 3ch) + 1rem)' }}>
              {l.line2}
            </div>
            <div className={cn(LINE_CELL_CLASS, "flex min-w-0 min-h-6", row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
              <div className="w-6 shrink-0 select-none px-1 text-center font-bold text-text-secondary py-0.5 sticky z-10 bg-transparent" style={{ left: 'calc((var(--line-num-width, 3ch) + 1rem) * 2)' }}>
                {l.sign}
              </div>
              <div className={cn("flex-1 px-2 py-0.5 min-h-6", wordWrapClass)}>
                <DiffFragmentList fragments={l.fragments} lineEndingLabel={l.lineEndingLabel} suppressHighlight={!!row.block.move} syntaxLine={syntaxLine} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

UnifiedRow.displayName = "UnifiedRow";


