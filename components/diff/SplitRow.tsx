import React, { memo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { ChangeBlock, DiffChangeType } from "@/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";
import { getBlockColorClass, getFragmentColorClass } from "@/utils/diffHelpers";
import { getRowContainerClass, getWordWrapClass, cn } from "@/utils/uiHelpers";
import { RowControls } from "./RowControls";
import { BlockHeaderControls } from "./BlockHeaderControls";

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
  renderMode: "wrap" | "left" | "right";
  measureRef: (node: HTMLElement | null) => void;
}

export const SplitRow = memo(({ row, virtualRow, settings, hoveredBlockId, setHoveredBlockId, selectBlock, mergeBlock, selectionSide, setSelectionSide, renderMode, measureRef }: SplitRowProps) => {
  const isHovered = hoveredBlockId === row.block.id && row.isSelectable && !row.block.isSelected;
  const wordWrapClass = getWordWrapClass(settings.isWordWrapEnabled, renderMode === "wrap" ? "w-full" : "");
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
    const layoutMode = renderMode === "wrap" ? "split-wrap" : renderMode === "left" ? "split-left" : "split-right";

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
          layout={layoutMode}
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
        <div className="flex min-h-[24px] w-full relative z-0">
          {(renderMode === "wrap" || renderMode === "left") && (
            <div
              onMouseDown={() => setSelectionSide("left")}
              className={cn("flex flex-1", renderMode === "wrap" ? "w-1/2" : "w-full flex-col z-0", selectionSide === "right" && "select-none")}
            >
              <div className="flex min-h-[24px] w-full">
                <div className="shrink-0 select-none px-2 text-right text-text-secondary py-0.5 sticky left-0 z-10 w-[calc(var(--line-num-width,3ch)+1rem)] bg-transparent">
                  {oldLine.lineNumber}
                </div>
                <div className={cn("flex-1 px-2 py-0.5 font-mono mr-2", wordWrapClass, oldBackgroundClass, row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
                  {oldLine.fragments.map((frag, fIdx) => (
                    <span key={fIdx} className={getFragmentColorClass(frag.kind, frag.isWhitespaceChange, settings.ignoreWhitespace)}>
                      {frag.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(renderMode === "wrap" || renderMode === "right") && (
            <div
              onMouseDown={() => setSelectionSide("right")}
              className={cn("flex flex-1", renderMode === "wrap" ? "w-1/2 border-l border-border-default" : "w-full flex-col z-0", selectionSide === "left" && "select-none")}
            >
              <div className="flex min-h-[24px] w-full">
                <div className="shrink-0 select-none px-2 text-right text-text-secondary py-0.5 sticky left-0 z-10 w-[calc(var(--line-num-width,3ch)+1rem)] bg-transparent">
                  {newLine.lineNumber}
                </div>
                <div className={cn("flex-1 px-2 py-0.5 font-mono mr-2", wordWrapClass, newBackgroundClass, row.isFirstLine && "rounded-t-md", row.isLastLine && "rounded-b-md")}>
                  {newLine.fragments.map((frag, fIdx) => (
                    <span key={fIdx} className={getFragmentColorClass(frag.kind, frag.isWhitespaceChange, settings.ignoreWhitespace)}>
                      {frag.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SplitRow.displayName = "SplitRow";