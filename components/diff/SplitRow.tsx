import React, { memo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { ChangeBlock, DiffChangeType } from "@/types/diff";
import { MergeDirection } from "@/types/ui";
import { AppSettings } from "@/types/settings";
import { getBlockColorClass, getFragmentColorClass } from "@/utils/diffHelpers";
import { getRowContainerClass, getWordWrapClass } from "@/utils/uiHelpers";
import { RowControls } from "./RowControls";
import clsx from "clsx";

export interface SplitRowData {
  id: string;
  type: "line" | "controls";
  block: ChangeBlock;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isSelectable: boolean;
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

  const oldLine = row.block.oldLines[row.index] || { lineNumber: null, kind: DiffChangeType.Imaginary, fragments: [ ] };
  const newLine = row.block.newLines[row.index] || { lineNumber: null, kind: DiffChangeType.Imaginary, fragments: [ ] };

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
        {isHovered && <div className="absolute inset-0 bg-hover-overlay pointer-events-none z-10" />}
        {row.isFirst && row.block.isSelected && row.isSelectable && <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-primary z-20 pointer-events-none" />}
        <div className="flex min-h-[24px] w-full relative z-0">
          {(renderMode === "wrap" || renderMode === "left") && (
            <div
              onMouseDown={() => setSelectionSide("left")}
              className={clsx("flex flex-1", renderMode === "wrap" ? "w-1/2" : "w-full flex-col z-0", getBlockColorClass(row.block.kind, "old", row.block.isWhitespaceChange, settings.ignoreWhitespace), oldLine.kind === DiffChangeType.Imaginary && "bg-diff-empty-bg", selectionSide === "right" && "select-none")}
            >
              <div className="flex min-h-[24px] w-full">
                <div className="w-10 shrink-0 select-none bg-bg-secondary px-2 text-right text-text-secondary border-r border-border-default py-0.5 sticky left-0 z-10">
                  {oldLine.lineNumber}
                </div>
                <div className={clsx("px-2 py-0.5 font-mono", wordWrapClass)}>
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
              className={clsx("flex flex-1", renderMode === "wrap" ? "w-1/2 border-l border-border-default" : "w-full flex-col z-0", getBlockColorClass(row.block.kind, "new", row.block.isWhitespaceChange, settings.ignoreWhitespace), newLine.kind === DiffChangeType.Imaginary && "bg-diff-empty-bg", selectionSide === "left" && "select-none")}
            >
              <div className="flex min-h-[24px] w-full">
                <div className="w-10 shrink-0 select-none bg-bg-secondary px-2 text-right text-text-secondary border-r border-border-default py-0.5 sticky left-0 z-10">
                  {newLine.lineNumber}
                </div>
                <div className={clsx("px-2 py-0.5 font-mono", wordWrapClass)}>
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