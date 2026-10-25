"use client";

import { useRef, useState, useMemo } from "react";
import { VirtualItem } from "@tanstack/react-virtual";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { UnifiedRow } from "./UnifiedRow";
import { DiffSurfaceLayer } from "./DiffSurfaceLayer";
import { buildDiffSurfaces, getHoveredBlockSurface, getLineSurface, getSelectedBlockSurface } from "@/features/compare/text/utils/diffSurfaces";
import { useDiffVirtualizer } from "@/features/compare/text/hooks/useDiffVirtualizer";
import { cn } from "@/utils/uiHelpers";
import { useCalculateUnifiedRows } from "@/features/compare/text/hooks/useCalculateUnifiedRows";
import { UI_CONSTANTS } from "@/config/constants";
import { ComparisonResult } from "@/features/compare/text/types/diff";
import { useMoveFocus } from "@/features/compare/text/hooks/useMoveFocus";
import type { SyntaxLine } from "../../services/syntax/tokenizeSyntax";

export function UnifiedView({ syntax }: { syntax: { left: SyntaxLine[] | null; right: SyntaxLine[] | null } }) {
  const { comparisonResult, selectBlock, mergeBlock, leftText, rightText } = useEditorStore();
  const { settings } = useSettingsStore();

  const unifiedScrollRef = useRef<HTMLDivElement>(null);
  const [hoveredBlock, setHoveredBlock] = useState<{ result: ComparisonResult | null; id: string | null }>({ result: null, id: null });
  const hoveredBlockId = hoveredBlock.result === comparisonResult ? hoveredBlock.id : null;
  const setHoveredBlockId = (id: string | null) => setHoveredBlock({ result: comparisonResult, id });
  const selectedBlockId = comparisonResult?.blocks.find((block) => block.isSelected)?.id ?? null;
  const { activeMoveId, activateMove } = useMoveFocus(comparisonResult);

  const rows = useCalculateUnifiedRows(comparisonResult);

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
    if (row.type === "header-controls") return (row.block.move ? 28 : 0) + (row.block.isSelected ? UI_CONSTANTS.VIRTUAL_ROW_HEADER_HEIGHT : 0);
    if (row.type === "controls") return row.block.isSelected ? UI_CONSTANTS.VIRTUAL_ROW_CONTROLS_HEIGHT : 0;
    return UI_CONSTANTS.VIRTUAL_ROW_DEFAULT_HEIGHT;
  };

  const unifiedVirtualizer = useDiffVirtualizer(
    rows.length,
    () => unifiedScrollRef.current,
    estimateSize,
    (index) => rows[index]?.id ?? `${index}`
  );

  if (!comparisonResult) {
    return null;
  }

  const containerWidthClass = settings.isWordWrapEnabled ? "w-full" : "w-max min-w-full";
  const minWidthStyle = !settings.isWordWrapEnabled && maxLineChars > 0 ? { minWidth: `calc(${maxLineChars}ch + 6.25rem)` } : {};

  const lineNumChars = Math.max(UI_CONSTANTS.LINE_NUM_MIN_CHARS, Math.max(leftText?.split(/\r\n|\r|\n/).length || 0, rightText?.split(/\r\n|\r|\n/).length || 0).toString().length);
  const customStyles = { '--line-num-width': `${lineNumChars}ch` } as React.CSSProperties;
  const virtualItems = unifiedVirtualizer.getVirtualItems();

  return (
    <div id="diff-scroll-area" className="flex-1 min-h-0 overflow-auto custom-scrollbar pb-2" ref={unifiedScrollRef} style={customStyles}>
      <div className={cn("relative pr-0 sm:pr-6", containerWidthClass)} style={{ height: `${unifiedVirtualizer.getTotalSize()}px`, ...minWidthStyle }}>
        <DiffSurfaceLayer target="row" surfaces={buildDiffSurfaces(virtualItems, (index) => getSelectedBlockSurface(rows[index], true))} />
        <DiffSurfaceLayer target="unified-line" surfaces={buildDiffSurfaces(virtualItems, (index) => {
          const row = rows[index];
          return row?.unifiedLine ? getLineSurface(row, row.unifiedLine.sign, row.unifiedLine.bgClass) : null;
        })} />
        {virtualItems.map((virtualRow: VirtualItem) => {
          const row = rows[virtualRow.index];
          return (
            <UnifiedRow
              key={virtualRow.key}
              row={row}
              syntaxLine={row.block.kind === "Added" || row.unifiedLine?.line1 === ""
                ? syntax.right?.[Number(row.unifiedLine?.line2 ?? 0) - 1]
                : syntax.left?.[Number(row.unifiedLine?.line1 ?? 0) - 1]}
              virtualRow={virtualRow}
              settings={settings}
              selectedBlockId={selectedBlockId}
              activeMoveId={activeMoveId}
              onActivateMove={activateMove}
              setHoveredBlockId={setHoveredBlockId}
              selectBlock={selectBlock}
              mergeBlock={mergeBlock}
              measureRef={unifiedVirtualizer.measureElement}
            />
          );
        })}
        <DiffSurfaceLayer target="row" className="z-10" surfaces={buildDiffSurfaces(virtualItems, (index) => getHoveredBlockSurface(rows[index], hoveredBlockId))} />
      </div>
    </div>
  );
}


