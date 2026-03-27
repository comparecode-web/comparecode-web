"use client";

import { useRef, useState, useMemo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { useEditorStore } from "@/store/useEditorStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useDiffVirtualizer } from "@/hooks/useDiffVirtualizer";
import { SplitRow } from "./SplitRow";
import { useCalculateSplitRows } from "@/hooks/useCalculateSplitRows";
import { UI_CONSTANTS } from "@/config/constants";

export function SplitView() {
  const { comparisonResult, selectBlock, mergeBlock, leftText, rightText } = useEditorStore();
  const { settings } = useSettingsStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const fakeScrollRef = useRef<HTMLDivElement>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [selectionSide, setSelectionSide] = useState<"left" | "right" | null>(null);

  const rows = useCalculateSplitRows(comparisonResult, settings);

  const maxLineChars = useMemo(() => {
    let max = 0;
    if (!comparisonResult || settings.isWordWrapEnabled) return max;

    comparisonResult.blocks.forEach((block) => {
      block.oldLines.forEach((line) => {
        const len = line.fragments.reduce((acc, f) => acc + f.text.length, 0);
        if (len > max) max = len;
      });
      block.newLines.forEach((line) => {
        const len = line.fragments.reduce((acc, f) => acc + f.text.length, 0);
        if (len > max) max = len;
      });
    });
    return max;
  }, [comparisonResult, settings.isWordWrapEnabled]);

  const estimateSize = (index: number) => {
    const row = rows[index];
    if (row.type === "header-controls") return row.block.isSelected ? UI_CONSTANTS.VIRTUAL_ROW_HEADER_HEIGHT : 0;
    if (row.type === "controls") return row.block.isSelected ? UI_CONSTANTS.VIRTUAL_ROW_CONTROLS_HEIGHT : 0;
    return UI_CONSTANTS.VIRTUAL_ROW_DEFAULT_HEIGHT;
  };

  const virtualizer = useDiffVirtualizer(
    rows.length,
    () => scrollRef.current,
    estimateSize,
    (index) => rows[index]?.id ?? `${index}`
  );

  if (!comparisonResult) {
    return null;
  }

  const lineNumChars = Math.max(
    UI_CONSTANTS.LINE_NUM_MIN_CHARS,
    Math.max(leftText?.split(/\r?\n/).length || 0, rightText?.split(/\r?\n/).length || 0).toString().length
  );

  const customStyles = { '--line-num-width': `${lineNumChars}ch` } as React.CSSProperties;

  const handleScrollX = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      scrollRef.current.style.setProperty('--scroll-x', `${e.currentTarget.scrollLeft}px`);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!settings.isWordWrapEnabled && Math.abs(e.deltaX) > 0 && fakeScrollRef.current) {
      fakeScrollRef.current.scrollLeft += e.deltaX;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full relative pr-0 sm:pr-6" style={customStyles}>
      <div
        id="diff-scroll-area"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pb-2"
        ref={scrollRef}
        onWheel={handleWheel}
      >
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
            const row = rows[virtualRow.index];
            return (
              <SplitRow
                key={virtualRow.key}
                row={row}
                virtualRow={virtualRow}
                settings={settings}
                hoveredBlockId={hoveredBlockId}
                setHoveredBlockId={setHoveredBlockId}
                selectBlock={selectBlock}
                mergeBlock={mergeBlock}
                selectionSide={selectionSide}
                setSelectionSide={setSelectionSide}
                measureRef={virtualizer.measureElement}
              />
            );
          })}
        </div>
      </div>

      {!settings.isWordWrapEnabled && maxLineChars > 0 && (
        <div
          className="h-3 sm:h-4 overflow-x-auto overflow-y-hidden custom-scrollbar shrink-0 border-t border-border-default bg-bg-primary z-20"
          ref={fakeScrollRef}
          onScroll={handleScrollX}
        >
          <div style={{ width: `calc(50% + ${maxLineChars}ch + 4rem)` }} className="h-1"></div>
        </div>
      )}
    </div>
  );
}