"use client";

import { useRef, useState, useMemo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { useEditorStore } from "@/store/useEditorStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { BlockType, DiffChangeType } from "@/types/diff";
import { useSyncedScroll } from "@/hooks/useSyncedScroll";
import { useDiffVirtualizer } from "@/hooks/useDiffVirtualizer";
import { SplitRow, SplitRowData } from "./SplitRow";
import clsx from "clsx";

export function SplitView() {
  const { comparisonResult, selectBlock, mergeBlock } = useEditorStore();
  const { settings } = useSettingsStore();

  const wrapScrollRef = useRef<HTMLDivElement>(null);
  const { leftScrollRef, rightScrollRef, handleLeftScroll, handleRightScroll } = useSyncedScroll();

  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [selectionSide, setSelectionSide] = useState<"left" | "right" | null>(null);

  const rows = useMemo(() => {
    const result: Array<SplitRowData> = [ ];
    if (!comparisonResult) return result;

    const isImaginary = (line: { kind: DiffChangeType } | undefined) => !line || line.kind === DiffChangeType.Imaginary;
    const reorderGhostRowsToBottom = (lines: Array<{ kind: DiffChangeType }>, maxLines: number): Array<number> => {
      const nonGhost: Array<number> = [ ];
      const ghost: Array<number> = [ ];

      for (let idx = 0; idx < maxLines; idx++) {
        if (isImaginary(lines[idx])) {
          ghost.push(idx);
        } else {
          nonGhost.push(idx);
        }
      }

      return nonGhost.concat(ghost);
    };

    comparisonResult.blocks.forEach((block) => {
      const isIgnoredWhitespace = settings.ignoreWhitespace && block.isWhitespaceChange;
      const isSelectable = block.kind !== BlockType.Unchanged && !isIgnoredWhitespace;
      const maxLines = Math.max(block.oldLines.length, block.newLines.length);

      if (maxLines === 0) return;

      let oldDisplayIndices = Array.from({ length: maxLines }, (_, idx) => idx);
      let newDisplayIndices = Array.from({ length: maxLines }, (_, idx) => idx);

      if (block.kind === BlockType.Modified && maxLines > 1) {
        oldDisplayIndices = reorderGhostRowsToBottom(block.oldLines, maxLines);
        newDisplayIndices = reorderGhostRowsToBottom(block.newLines, maxLines);
      }

      for (let i = 0; i < maxLines; i++) {
        const oldIndex = oldDisplayIndices[i] ?? -1;
        const newIndex = newDisplayIndices[i] ?? -1;

        result.push({
          id: `${block.id}-line-${i}`,
          type: "line",
          block,
          oldIndex,
          newIndex,
          isFirst: i === 0,
          isLast: i === maxLines - 1 && !block.isSelected,
          isSelectable
        });
      }

      if (block.isSelected && isSelectable) {
        result.push({
          id: `${block.id}-controls`,
          type: "controls",
          block,
          oldIndex: -1,
          newIndex: -1,
          isFirst: false,
          isLast: true,
          isSelectable
        });
      }
    });
    return result;
  }, [comparisonResult, settings.ignoreWhitespace]);

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

  const wrapVirtualizer = useDiffVirtualizer(
    settings.isWordWrapEnabled ? rows.length : 0,
    () => wrapScrollRef.current
  );

  const leftVirtualizer = useDiffVirtualizer(
    !settings.isWordWrapEnabled ? rows.length : 0,
    () => leftScrollRef.current
  );

  const rightVirtualizer = useDiffVirtualizer(
    !settings.isWordWrapEnabled ? rows.length : 0,
    () => rightScrollRef.current
  );

  if (!comparisonResult) {
    return null;
  }

  const containerWidthClass = settings.isWordWrapEnabled ? "w-full" : "w-max min-w-full";
  const minWidthStyle = !settings.isWordWrapEnabled && maxLineChars > 0 ? { minWidth: `calc(${maxLineChars}ch + 80px)` } : {};

  if (settings.isWordWrapEnabled) {
    return (
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-8" ref={wrapScrollRef}>
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
    <div className="flex h-full w-full">
      <div
        className={clsx("flex-1 overflow-auto hide-vertical-scrollbar border-r border-border-default", selectionSide === "right" && "select-none")}
        ref={leftScrollRef}
        onScroll={handleLeftScroll}
        onMouseDown={() => setSelectionSide("left")}
      >
        <div className={clsx("relative", containerWidthClass)} style={{ height: `${leftVirtualizer.getTotalSize()}px`, ...minWidthStyle }}>
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
        className={clsx("flex-1 overflow-auto custom-scrollbar", selectionSide === "left" && "select-none")}
        ref={rightScrollRef}
        onScroll={handleRightScroll}
        onMouseDown={() => setSelectionSide("right")}
      >
        <div className={clsx("relative pr-8", containerWidthClass)} style={{ height: `${rightVirtualizer.getTotalSize()}px`, ...minWidthStyle }}>
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