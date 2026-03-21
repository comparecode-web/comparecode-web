"use client";

import { useRef, useState, useMemo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { useEditorStore } from "@/store/useEditorStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getBlockColorClass } from "@/utils/diffHelpers";
import { BlockType, DiffChangeType } from "@/types/diff";
import { UnifiedRow, UnifiedRowData } from "./UnifiedRow";
import { useDiffVirtualizer } from "@/hooks/useDiffVirtualizer";
import { cn } from "@/utils/uiHelpers";

export function UnifiedView() {
  const { comparisonResult, selectBlock, mergeBlock, leftText, rightText } = useEditorStore();
  const { settings } = useSettingsStore();

  const unifiedScrollRef = useRef<HTMLDivElement>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const result: Array<UnifiedRowData> = [ ];
    if (!comparisonResult) return result;

    comparisonResult.blocks.forEach((block) => {
      const isIgnoredWhitespace = settings.ignoreWhitespace && block.isWhitespaceChange;
      const isSelectable = block.kind !== BlockType.Unchanged && !isIgnoredWhitespace;

      const blockRows: Array<Omit<UnifiedRowData, "isFirst" | "isLast">> = [ ];

      if (block.kind === BlockType.Modified) {
        block.oldLines.forEach((line, idx) => {
          if (line.kind !== DiffChangeType.Imaginary) {
            blockRows.push({
              id: `${block.id}-old-${idx}`,
              type: "line",
              block,
              lineIndex: idx,
              unifiedLine: {
                line1: line.lineNumber,
                line2: "",
                sign: "-",
                fragments: line.fragments,
                bgClass: getBlockColorClass(BlockType.Removed, "old", block.isWhitespaceChange, settings.ignoreWhitespace)
              },
              isSelectable
            });
          }
        });
        block.newLines.forEach((line, idx) => {
          if (line.kind !== DiffChangeType.Imaginary) {
            blockRows.push({
              id: `${block.id}-new-${idx}`,
              type: "line",
              block,
              lineIndex: idx + block.oldLines.length,
              unifiedLine: {
                line1: "",
                line2: line.lineNumber,
                sign: "+",
                fragments: line.fragments,
                bgClass: getBlockColorClass(BlockType.Added, "new", block.isWhitespaceChange, settings.ignoreWhitespace)
              },
              isSelectable
            });
          }
        });
      } else {
        const maxLines = Math.max(block.oldLines.length, block.newLines.length);

        for (let idx = 0; idx < maxLines; idx++) {
          const oldLine = block.oldLines[idx];
          const newLine = block.newLines[idx];
          const isRemoved = block.kind === BlockType.Removed;
          const isAdded = block.kind === BlockType.Added;

          let bgClass = "bg-transparent";

          if (isRemoved) bgClass = getBlockColorClass(BlockType.Removed, "old", block.isWhitespaceChange, settings.ignoreWhitespace);
          if (isAdded) bgClass = getBlockColorClass(BlockType.Added, "new", block.isWhitespaceChange, settings.ignoreWhitespace);

          blockRows.push({
            id: `${block.id}-line-${idx}`,
            type: "line",
            block,
            lineIndex: idx,
            unifiedLine: {
              line1: oldLine?.lineNumber || "",
              line2: newLine?.lineNumber || "",
              sign: isRemoved ? "-" : isAdded ? "+" : " ",
              fragments: isAdded ? (newLine?.fragments || [ ]) : (oldLine?.fragments || [ ]),
              bgClass
            },
            isSelectable
          });
        }
      }

      const len = blockRows.length;

      blockRows.forEach((r, i) => {
        result.push({
          ...r,
          isFirst: i === 0,
          isLast: i === len - 1 && !block.isSelected
        });
      });

      if (block.isSelected && isSelectable) {
        result.push({
          id: `${block.id}-controls`,
          type: "controls",
          block,
          lineIndex: -1,
          isSelectable,
          isFirst: false,
          isLast: true
        });
      }
    });

    return result;
  }, [comparisonResult, settings.ignoreWhitespace]);

  const maxLineChars = useMemo(() => {
    let max = 0;
    if (!comparisonResult || settings.isWordWrapEnabled) return max;

    rows.forEach((row) => {
      if (row.type === "line" && row.unifiedLine) {
        const len = row.unifiedLine.fragments.reduce((acc, f) => acc + f.text.length, 0);
        if (len > max) max = len;
      }
    });
    return max;
  }, [comparisonResult, settings.isWordWrapEnabled, rows]);

  const unifiedVirtualizer = useDiffVirtualizer(
    rows.length,
    () => unifiedScrollRef.current
  );

  if (!comparisonResult) {
    return null;
  }

  const containerWidthClass = settings.isWordWrapEnabled ? "w-full" : "w-max min-w-full";
  const minWidthStyle = !settings.isWordWrapEnabled && maxLineChars > 0 ? { minWidth: `calc(${maxLineChars}ch + 100px)` } : {};

  const lineNumChars = Math.max(3, Math.max(leftText?.split(/\r?\n/).length || 0, rightText?.split(/\r?\n/).length || 0).toString().length);
  const customStyles = { '--line-num-width': `${lineNumChars}ch` } as React.CSSProperties;

  return (
    <div className="flex-1 overflow-auto custom-scrollbar" ref={unifiedScrollRef} style={customStyles}>
      <div className={cn("relative pr-8", containerWidthClass)} style={{ height: `${unifiedVirtualizer.getTotalSize()}px`, ...minWidthStyle }}>
        {unifiedVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
          const row = rows[virtualRow.index];
          return (
            <UnifiedRow
              key={virtualRow.key}
              row={row}
              virtualRow={virtualRow}
              settings={settings}
              hoveredBlockId={hoveredBlockId}
              setHoveredBlockId={setHoveredBlockId}
              selectBlock={selectBlock}
              mergeBlock={mergeBlock}
              measureRef={unifiedVirtualizer.measureElement}
            />
          );
        })}
      </div>
    </div>
  );
}