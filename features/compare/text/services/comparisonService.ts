import * as Diff from "diff";
import { BlockType, ChangeBlock, ComparisonResult, DiffChangeType } from "@/features/compare/text/types/diff";
import { CompareSettings } from "@/types/settings";
import { Chunk } from "@/features/compare/text/services/diff/types";
import { mergeWhitespaceAnchoredChunks, normalizeWhitespaceEdgesInModifiedChunks } from "@/features/compare/text/services/diff/whitespaceUtils";
import { alignAndDiffLines } from "@/features/compare/text/services/diff/characterDiff";
import { createLine } from "@/features/compare/text/services/diff/coreUtils";

export class ComparisonService {
  public static compare(oldText: string, newText: string, settings: CompareSettings): ComparisonResult {
    const oldLines = oldText ? oldText.split(/\r?\n/) : [];
    const newLines = newText ? newText.split(/\r?\n/) : [];
    const lineDiffs = Diff.diffArrays(oldLines, newLines);
    const chunks: Array<Chunk> = [];

    for (let i = 0; i < lineDiffs.length; i++) {
      const diff = lineDiffs[i];
      if (!diff.added && !diff.removed) {
        chunks.push({ type: BlockType.Unchanged, oldLines: diff.value, newLines: diff.value });
      } else {
        let oldL = diff.removed ? diff.value : [];
        let newL = diff.added ? diff.value : [];

        while (i + 1 < lineDiffs.length && (lineDiffs[i + 1].added || lineDiffs[i + 1].removed)) {
          i++;
          if (lineDiffs[i].removed) {
            oldL = oldL.concat(lineDiffs[i].value);
          }
          if (lineDiffs[i].added) {
            newL = newL.concat(lineDiffs[i].value);
          }
        }

        let type = BlockType.Modified;
        if (oldL.length > 0 && newL.length === 0) {
          type = BlockType.Removed;
        }
        if (oldL.length === 0 && newL.length > 0) {
          type = BlockType.Added;
        }
        chunks.push({ type, oldLines: oldL, newLines: newL });
      }
    }

    const mergedChunks = mergeWhitespaceAnchoredChunks(chunks);
    const normalizedChunks = normalizeWhitespaceEdgesInModifiedChunks(mergedChunks);
    const blocks: Array<ChangeBlock> = [];
    let currentOldIndex = 0;
    let currentNewIndex = 0;

    for (let i = 0; i < normalizedChunks.length; i++) {
      const chunk = normalizedChunks[i];
      const block: ChangeBlock = {
        id: crypto.randomUUID(),
        kind: chunk.type,
        oldLines: [],
        newLines: [],
        startIndexOld: currentOldIndex,
        startIndexNew: currentNewIndex,
        isWhitespaceChange: false
      };

      if (chunk.type === BlockType.Unchanged) {
        for (let j = 0; j < chunk.oldLines.length; j++) {
          block.oldLines.push(createLine(chunk.oldLines[j], DiffChangeType.Unchanged, currentOldIndex + j + 1));
          block.newLines.push(createLine(chunk.newLines[j], DiffChangeType.Unchanged, currentNewIndex + j + 1));
        }
        currentOldIndex += chunk.oldLines.length;
        currentNewIndex += chunk.newLines.length;
      } else if (chunk.type === BlockType.Added) {
        let isWs = true;
        for (let j = 0; j < chunk.newLines.length; j++) {
          if (chunk.newLines[j].trim() !== "") {
            isWs = false;
          }
          block.newLines.push(createLine(chunk.newLines[j], DiffChangeType.Inserted, currentNewIndex + j + 1));
        }
        block.isWhitespaceChange = isWs;
        currentNewIndex += chunk.newLines.length;
      } else if (chunk.type === BlockType.Removed) {
        let isWs = true;
        for (let j = 0; j < chunk.oldLines.length; j++) {
          if (chunk.oldLines[j].trim() !== "") {
            isWs = false;
          }
          block.oldLines.push(createLine(chunk.oldLines[j], DiffChangeType.Deleted, currentOldIndex + j + 1));
        }
        block.isWhitespaceChange = isWs;
        currentOldIndex += chunk.oldLines.length;
      } else {
        const diffResult = alignAndDiffLines(chunk.oldLines, chunk.newLines, settings, currentOldIndex + 1, currentNewIndex + 1);
        block.oldLines = diffResult.oldLinesResult;
        block.newLines = diffResult.newLinesResult;
        block.isWhitespaceChange = diffResult.isWhitespaceOnlyBlock;
        currentOldIndex += chunk.oldLines.length;
        currentNewIndex += chunk.newLines.length;
      }

      blocks.push(block);
    }

    return { blocks };
  }
}

