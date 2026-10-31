import { useMemo } from "react";
import { ComparisonResult, DiffChangeType, BlockType } from "@/features/compare/text/types/diff";
import { UnifiedRowData } from "@/features/compare/text/components/diff/UnifiedRow";
import { getBlockColorClass } from "@/features/compare/text/utils/diffHelpers";
import { getCollapsedRowInfo, HiddenRange } from "@/features/compare/text/utils/unchangedRegions";

export function calculateUnifiedRows(comparisonResult: ComparisonResult | null, hiddenRanges?: ReadonlyMap<string, HiddenRange> | null): UnifiedRowData[] {
    const result: Array<UnifiedRowData> = [];
    if (!comparisonResult) return result;

    const lastBlockIndex = comparisonResult.blocks.length - 1;
    comparisonResult.blocks.forEach((block, blockIndex) => {
      const isSelectable = block.kind !== BlockType.Unchanged;

      if (isSelectable) {
        result.push({
          id: `${block.id}-header-controls`,
          type: "header-controls",
          block,
          lineIndex: -1,
          isSelectable,
          isFirst: true,
          isLast: false
        });
      }

      const blockRows: Array<Omit<UnifiedRowData, "isFirst" | "isLast" | "isFirstLine" | "isLastLine">> = [];

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
                lineEndingLabel: line.lineEndingLabel,
                bgClass: getBlockColorClass(BlockType.Removed, "old")
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
                lineEndingLabel: line.lineEndingLabel,
                bgClass: getBlockColorClass(BlockType.Added, "new")
              },
              isSelectable
            });
          }
        });
      } else {
        const maxLines = Math.max(block.oldLines.length, block.newLines.length);
        const hidden = hiddenRanges?.get(block.id);
        for (let idx = 0; idx < maxLines; idx++) {
          if (hidden && idx >= hidden.start && idx < hidden.end) {
            if (idx === hidden.start) {
              blockRows.push({
                id: `${block.id}-collapsed`,
                type: "collapsed",
                block,
                lineIndex: -1,
                isSelectable: false,
                collapsed: getCollapsedRowInfo(block, hidden, blockIndex === 0, blockIndex === lastBlockIndex)
              });
            }
            continue;
          }
          const oldLine = block.oldLines[idx];
          const newLine = block.newLines[idx];
          const isRemoved = block.kind === BlockType.Removed;
          const isAdded = block.kind === BlockType.Added;

          let bgClass = "bg-transparent";
          if (isRemoved) bgClass = getBlockColorClass(BlockType.Removed, "old");
          if (isAdded) bgClass = getBlockColorClass(BlockType.Added, "new");

          blockRows.push({
            id: `${block.id}-line-${idx}`,
            type: "line",
            block,
            lineIndex: idx,
            unifiedLine: {
              line1: oldLine?.lineNumber || "",
              line2: newLine?.lineNumber || "",
              sign: isRemoved && oldLine?.kind !== DiffChangeType.Unchanged ? "-"
                : isAdded && newLine?.kind !== DiffChangeType.Unchanged ? "+" : " ",
              fragments: isAdded ? (newLine?.fragments || []) : (oldLine?.fragments || []),
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
          isLast: i === len - 1 && !block.isSelected,
          isFirstLine: i === 0,
          isLastLine: i === len - 1
        });
      });

      if (isSelectable) {
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
}

export function useCalculateUnifiedRows(comparisonResult: ComparisonResult | null, hiddenRanges?: ReadonlyMap<string, HiddenRange> | null) {
  return useMemo(() => calculateUnifiedRows(comparisonResult, hiddenRanges), [comparisonResult, hiddenRanges]);
}

