import React, { memo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { ChangeBlock, TextFragment } from "@/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";
import { getRowContainerClass, getWordWrapClass, cn } from "@/utils/uiHelpers";
import { RowControls } from "./RowControls";
import { BlockHeaderControls } from "./BlockHeaderControls";
import { DiffFragmentList } from "./DiffFragmentList";

export interface UnifiedLineData {
  line1: number | string | null;
  line2: number | string | null;
  sign: string;
  fragments: Array<TextFragment>;
  bgClass: string;
}

export interface UnifiedRowData {
  id: string;
  type: "line" | "controls" | "header-controls";
  block: ChangeBlock;
  lineIndex: number;
  unifiedLine?: UnifiedLineData;
  isFirst: boolean;
  isLast: boolean;
  isSelectable: boolean;
  isFirstLine?: boolean;
  isLastLine?: boolean;
}

interface UnifiedRowProps {
  row: UnifiedRowData;
  virtualRow: VirtualItem;
  settings: AppSettings;
  hoveredBlockId: string | null;
  setHoveredBlockId: (id: string | null) => void;
  selectBlock: (id: string | null) => void;
  mergeBlock: (block: ChangeBlock, dir: MergeDirection, settings: AppSettings) => void;
  measureRef: (node: HTMLElement | null) => void;
}

export const UnifiedRow = memo(({ row, virtualRow, settings, hoveredBlockId, setHoveredBlockId, selectBlock, mergeBlock, measureRef }: UnifiedRowProps) => {
  const isHovered = hoveredBlockId === row.block.id && row.isSelectable && !row.block.isSelected;
  const wordWrapClass = getWordWrapClass(settings.isWordWrapEnabled);
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
          layout="unified"
          selectBlock={selectBlock}
          mergeBlock={mergeBlock}
        />
      </div>
    );
  }

  const l = row.unifiedLine!;

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
        <div className="flex w-full flex-col relative z-0">
          <div className="flex min-h-6 w-full bg-transparent">
            <div className="shrink-0 select-none px-2 text-right text-text-secondary py-0.5 sticky left-0 z-10 w-[calc(var(--line-num-width,3ch)+1rem)] bg-transparent">
              {l.line1}
            </div>
            <div className="shrink-0 select-none px-2 text-right text-text-secondary py-0.5 sticky z-10 w-[calc(var(--line-num-width,3ch)+1rem)] bg-transparent" style={{ left: 'calc(var(--line-num-width, 3ch) + 1rem)' }}>
              {l.line2}
            </div>
            <div className={cn("flex flex-1 min-w-0 mr-2", l.bgClass, row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
              <div className="w-6 shrink-0 select-none px-1 text-center font-bold text-text-secondary py-0.5 sticky z-10 bg-transparent" style={{ left: 'calc((var(--line-num-width, 3ch) + 1rem) * 2)' }}>
                {l.sign}
              </div>
              <div className={cn("flex-1 px-2 py-0.5 font-mono", wordWrapClass)}>
                <DiffFragmentList fragments={l.fragments} ignoreWhitespace={settings.ignoreWhitespace} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

UnifiedRow.displayName = "UnifiedRow";