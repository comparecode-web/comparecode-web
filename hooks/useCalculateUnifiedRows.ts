import { useMemo } from "react";
import { ComparisonResult, DiffChangeType, BlockType } from "@/types/diff";
import { AppSettings } from "@/types/settings";
import { UnifiedRowData } from "@/components/diff/UnifiedRow";
import { getBlockColorClass } from "@/utils/diffHelpers";

export function useCalculateUnifiedRows(comparisonResult: ComparisonResult | null, settings: AppSettings) {
  return useMemo(() => {
    const result: Array<UnifiedRowData> = [];
    if (!comparisonResult) return result;

    comparisonResult.blocks.forEach((block) => {
      const isIgnoredWhitespace = settings.ignoreWhitespace && block.isWhitespaceChange;
      const isSelectable = block.kind !== BlockType.Unchanged && !isIgnoredWhitespace;

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
  }, [comparisonResult, settings.ignoreWhitespace]);
}