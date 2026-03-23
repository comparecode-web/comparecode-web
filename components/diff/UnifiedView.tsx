"use client";

import { useRef, useState, useMemo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { useEditorStore } from "@/store/useEditorStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { UnifiedRow } from "./UnifiedRow";
import { useDiffVirtualizer } from "@/hooks/useDiffVirtualizer";
import { cn } from "@/utils/uiHelpers";
import { useCalculateUnifiedRows } from "@/hooks/useCalculateUnifiedRows";
import { UI_CONSTANTS } from "@/config/constants";

export function UnifiedView() {
  const { comparisonResult, selectBlock, mergeBlock, leftText, rightText } = useEditorStore();
  const { settings } = useSettingsStore();

  const unifiedScrollRef = useRef<HTMLDivElement>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const rows = useCalculateUnifiedRows(comparisonResult, settings);

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

  const estimateSize = (index: number) => {
    const row = rows[index];
    if (row.type === "header-controls") return row.block.isSelected ? UI_CONSTANTS.VIRTUAL_ROW_HEADER_HEIGHT : 0;
    if (row.type === "controls") return row.block.isSelected ? UI_CONSTANTS.VIRTUAL_ROW_CONTROLS_HEIGHT : 0;
    return UI_CONSTANTS.VIRTUAL_ROW_DEFAULT_HEIGHT;
  };

  const unifiedVirtualizer = useDiffVirtualizer(
    rows.length,
    () => unifiedScrollRef.current,
    estimateSize
  );

  if (!comparisonResult) {
    return null;
  }

  const containerWidthClass = settings.isWordWrapEnabled ? "w-full" : "w-max min-w-full";
  const minWidthStyle = !settings.isWordWrapEnabled && maxLineChars > 0 ? { minWidth: `calc(${maxLineChars}ch + 100px)` } : {};

  const lineNumChars = Math.max(UI_CONSTANTS.LINE_NUM_MIN_CHARS, Math.max(leftText?.split(/\r?\n/).length || 0, rightText?.split(/\r?\n/).length || 0).toString().length);
  const customStyles = { '--line-num-width': `${lineNumChars}ch` } as React.CSSProperties;

  return (
    <div className="flex-1 overflow-auto custom-scrollbar py-2" ref={unifiedScrollRef} style={customStyles}>
      <div className={cn("relative pr-0 sm:pr-6", containerWidthClass)} style={{ height: `${unifiedVirtualizer.getTotalSize()}px`, ...minWidthStyle }}>
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