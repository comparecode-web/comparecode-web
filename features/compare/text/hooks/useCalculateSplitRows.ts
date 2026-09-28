import { useMemo } from "react";
import { ComparisonResult, DiffChangeType, BlockType } from "@/features/compare/text/types/diff";
import { SplitRowData } from "@/features/compare/text/components/diff/SplitRow";

export function calculateSplitRows(comparisonResult: ComparisonResult | null): SplitRowData[] {
    const result: Array<SplitRowData> = [];
    if (!comparisonResult) return result;

    const isImaginary = (line: { kind: DiffChangeType } | undefined) => !line || line.kind === DiffChangeType.Imaginary;
    const displayIndices = (lines: Array<{ kind: DiffChangeType }>, count: number) => {
      const real: number[] = [], imaginary: number[] = [];
      for (let index = 0; index < count; index++) {
        (isImaginary(lines[index]) ? imaginary : real).push(index);
      }
      return real.concat(imaginary);
    };
    comparisonResult.blocks.forEach((block) => {
      const isSelectable = block.kind !== BlockType.Unchanged;
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

      const oldIndices = block.kind === BlockType.Modified ? displayIndices(block.oldLines, maxLines) : null;
      const newIndices = block.kind === BlockType.Modified ? displayIndices(block.newLines, maxLines) : null;
      const lineRows: Array<{ oldIndex: number; newIndex: number }> = [];

      for (let i = 0; i < maxLines; i++) {
        const oldIndex = oldIndices?.[i] ?? i;
        const newIndex = newIndices?.[i] ?? i;

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
}

export function useCalculateSplitRows(comparisonResult: ComparisonResult | null) {
  return useMemo(() => calculateSplitRows(comparisonResult), [comparisonResult]);
}

