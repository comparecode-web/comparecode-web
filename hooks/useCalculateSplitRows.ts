import { useMemo } from "react";
import { ComparisonResult, DiffChangeType, BlockType } from "@/types/diff";
import { AppSettings } from "@/types/settings";
import { SplitRowData } from "@/components/diff/SplitRow";

export function useCalculateSplitRows(comparisonResult: ComparisonResult | null, settings: AppSettings) {
  return useMemo(() => {
    const result: Array<SplitRowData> = [];
    if (!comparisonResult) return result;

    const isImaginary = (line: { kind: DiffChangeType } | undefined) => !line || line.kind === DiffChangeType.Imaginary;
    const reorderGhostRowsToBottom = (lines: Array<{ kind: DiffChangeType }>, maxLines: number): Array<number> => {
      const nonGhost: Array<number> = [];
      const ghost: Array<number> = [];

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

      if (isSelectable) {
        result.push({
          id: `${block.id}-header-controls`,
          type: "header-controls",
          block,
          oldIndex: -1,
          newIndex: -1,
          isFirst: true,
          isLast: false,
          isSelectable
        });
      }

      let oldDisplayIndices = Array.from({ length: maxLines }, (_, idx) => idx);
      let newDisplayIndices = Array.from({ length: maxLines }, (_, idx) => idx);

      if (block.kind === BlockType.Modified && maxLines > 1) {
        oldDisplayIndices = reorderGhostRowsToBottom(block.oldLines, maxLines);
        newDisplayIndices = reorderGhostRowsToBottom(block.newLines, maxLines);
      }

      const lineRows: Array<{ oldIndex: number; newIndex: number }> = [];

      for (let i = 0; i < maxLines; i++) {
        const oldIndex = oldDisplayIndices[i] ?? -1;
        const newIndex = newDisplayIndices[i] ?? -1;

        const oldLine = oldIndex >= 0 ? block.oldLines[oldIndex] : undefined;
        const newLine = newIndex >= 0 ? block.newLines[newIndex] : undefined;

        if (isImaginary(oldLine) && isImaginary(newLine)) {
          continue;
        }

        lineRows.push({ oldIndex, newIndex });
      }

      for (let i = 0; i < lineRows.length; i++) {
        const lineRow = lineRows[i];
        result.push({
          id: `${block.id}-line-${i}`,
          type: "line",
          block,
          oldIndex: lineRow.oldIndex,
          newIndex: lineRow.newIndex,
          isFirst: i === 0,
          isLast: i === lineRows.length - 1 && !block.isSelected,
          isSelectable,
          isFirstLine: i === 0,
          isLastLine: i === lineRows.length - 1
        });
      }

      if (isSelectable) {
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
}