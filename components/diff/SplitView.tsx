"use client";

import { useRef, useState, useMemo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { useEditorStore } from "@/store/useEditorStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSyncedScroll } from "@/hooks/useSyncedScroll";
import { useDiffVirtualizer } from "@/hooks/useDiffVirtualizer";
import { SplitRow } from "./SplitRow";
import { cn } from "@/utils/uiHelpers";
import { useCalculateSplitRows } from "@/hooks/useCalculateSplitRows";

export function SplitView() {
  const { comparisonResult, selectBlock, mergeBlock, leftText, rightText } = useEditorStore();
  const { settings } = useSettingsStore();

  const wrapScrollRef = useRef<HTMLDivElement>(null);
  const { leftScrollRef, rightScrollRef, handleLeftScroll, handleRightScroll } = useSyncedScroll();
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
    if (row.type === "header-controls") return 40;
    if (row.type === "controls") return 56;
    return 24;
  };

  const wrapVirtualizer = useDiffVirtualizer(
    settings.isWordWrapEnabled ? rows.length : 0,
    () => wrapScrollRef.current,
    estimateSize
  );

  const leftVirtualizer = useDiffVirtualizer(
    !settings.isWordWrapEnabled ? rows.length : 0,
    () => leftScrollRef.current,
    estimateSize
  );

  const rightVirtualizer = useDiffVirtualizer(
    !settings.isWordWrapEnabled ? rows.length : 0,
    () => rightScrollRef.current,
    estimateSize
  );

  if (!comparisonResult) {
    return null;
  }

  const containerWidthClass = settings.isWordWrapEnabled ? "w-full" : "w-max min-w-full";
  const minWidthStyle = !settings.isWordWrapEnabled && maxLineChars > 0 ? { minWidth: `calc(${maxLineChars}ch + 80px)` } : {};
  const lineNumChars = Math.max(3, Math.max(leftText?.split(/\r?\n/).length || 0, rightText?.split(/\r?\n/).length || 0).toString().length);
  const customStyles = { '--line-num-width': `${lineNumChars}ch` } as React.CSSProperties;

  if (settings.isWordWrapEnabled) {
    return (
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-0 sm:pr-8" ref={wrapScrollRef} style={customStyles}>
        <div className="w-full relative" style={{ height: `${wrapVirtualizer.getTotalSize()}px` }}>
          {wrapVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
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
                renderMode="wrap"
                measureRef={wrapVirtualizer.measureElement}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full" style={customStyles}>
      <div
        className={cn("flex-1 overflow-auto hide-vertical-scrollbar border-r border-border-default", selectionSide === "right" && "select-none")}
        ref={leftScrollRef}
        onScroll={handleLeftScroll}
        onMouseDown={() => setSelectionSide("left")}
      >
        <div className={cn("relative", containerWidthClass)} style={{ height: `${leftVirtualizer.getTotalSize()}px`, ...minWidthStyle }}>
          {leftVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
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
                renderMode="left"
                measureRef={leftVirtualizer.measureElement}
              />
            );
          })}
        </div>
      </div>

      <div
        className={cn("flex-1 overflow-auto custom-scrollbar", selectionSide === "left" && "select-none")}
        ref={rightScrollRef}
        onScroll={handleRightScroll}
        onMouseDown={() => setSelectionSide("right")}
      >
        <div className={cn("relative pr-0 sm:pr-8", containerWidthClass)} style={{ height: `${rightVirtualizer.getTotalSize()}px`, ...minWidthStyle }}>
          {rightVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
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
                renderMode="right"
                measureRef={rightVirtualizer.measureElement}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}