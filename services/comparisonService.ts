import * as Diff from "diff";
import { BlockType, ChangeBlock, ChangeLine, ComparisonResult, DiffChangeType, TextFragment } from "@/types/diff";
import { CompareSettings, PrecisionLevel } from "@/types/settings";

interface Chunk {
  type: BlockType;
  oldLines: Array<string>;
  newLines: Array<string>;
}

export class ComparisonService {
  public static compare(oldText: string, newText: string, settings: CompareSettings): ComparisonResult {
    const oldLines = oldText ? oldText.split(/\r?\n/) : [ ];
    const newLines = newText ? newText.split(/\r?\n/) : [ ];

    const lineDiffs = Diff.diffArrays(oldLines, newLines);
    const chunks: Array<Chunk> = [ ];

    for (let i = 0; i < lineDiffs.length; i++) {
      const diff = lineDiffs[i];

      if (!diff.added && !diff.removed) {
        chunks.push({ type: BlockType.Unchanged, oldLines: diff.value, newLines: diff.value });
      } else {
        let oldL = diff.removed ? diff.value : [ ];
        let newL = diff.added ? diff.value : [ ];

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

    const blocks: Array<ChangeBlock> = [ ];
    let currentOldIndex = 0;
    let currentNewIndex = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const block: ChangeBlock = {
        id: crypto.randomUUID(),
        kind: chunk.type,
        oldLines: [ ],
        newLines: [ ],
        startIndexOld: currentOldIndex,
        startIndexNew: currentNewIndex,
        isWhitespaceChange: false
      };

      if (chunk.type === BlockType.Unchanged) {
        for (let j = 0; j < chunk.oldLines.length; j++) {
          block.oldLines.push(this.createLine(chunk.oldLines[j], DiffChangeType.Unchanged, currentOldIndex + j + 1));
          block.newLines.push(this.createLine(chunk.newLines[j], DiffChangeType.Unchanged, currentNewIndex + j + 1));
        }
        currentOldIndex += chunk.oldLines.length;
        currentNewIndex += chunk.newLines.length;
      } else if (chunk.type === BlockType.Added) {
        let isWs = true;
        for (let j = 0; j < chunk.newLines.length; j++) {
          if (chunk.newLines[j].trim() !== "") {
            isWs = false;
          }
          block.newLines.push(this.createLine(chunk.newLines[j], DiffChangeType.Inserted, currentNewIndex + j + 1));
        }
        block.isWhitespaceChange = isWs;
        currentNewIndex += chunk.newLines.length;
      } else if (chunk.type === BlockType.Removed) {
        let isWs = true;
        for (let j = 0; j < chunk.oldLines.length; j++) {
          if (chunk.oldLines[j].trim() !== "") {
            isWs = false;
          }
          block.oldLines.push(this.createLine(chunk.oldLines[j], DiffChangeType.Deleted, currentOldIndex + j + 1));
        }
        block.isWhitespaceChange = isWs;
        currentOldIndex += chunk.oldLines.length;
      } else {
        const maxLen = Math.max(chunk.oldLines.length, chunk.newLines.length);
        let isWhitespaceOnlyBlock = true;

        for (let j = 0; j < maxLen; j++) {
          const oldStr = j < chunk.oldLines.length ? chunk.oldLines[j] : null;
          const newStr = j < chunk.newLines.length ? chunk.newLines[j] : null;

          if (oldStr !== null && newStr !== null) {
            const diffResult = this.generateInlineDiff(oldStr, newStr, settings, currentOldIndex + j + 1, currentNewIndex + j + 1);
            block.oldLines.push(diffResult.oldLine);
            block.newLines.push(diffResult.newLine);
            if (!diffResult.isWhitespaceOnly) {
              isWhitespaceOnlyBlock = false;
            }
          } else if (oldStr !== null) {
            block.oldLines.push(this.createLine(oldStr, DiffChangeType.Deleted, currentOldIndex + j + 1));
            block.newLines.push(this.createImaginaryLine());
            if (oldStr.trim() !== "") {
              isWhitespaceOnlyBlock = false;
            }
          } else if (newStr !== null) {
            block.oldLines.push(this.createImaginaryLine());
            block.newLines.push(this.createLine(newStr, DiffChangeType.Inserted, currentNewIndex + j + 1));
            if (newStr.trim() !== "") {
              isWhitespaceOnlyBlock = false;
            }
          }
        }

        block.isWhitespaceChange = isWhitespaceOnlyBlock;
        currentOldIndex += chunk.oldLines.length;
        currentNewIndex += chunk.newLines.length;
      }

      blocks.push(block);
    }

    return { blocks };
  }

  private static createLine(text: string, kind: DiffChangeType, lineNumber: number): ChangeLine {
    return {
      lineNumber,
      kind,
      isInModifiedBlock: kind === DiffChangeType.Modified,
      fragments: [
        {
          text,
          kind,
          isWhitespaceChange: text.trim() === ""
        }
      ]
    };
  }

  private static createImaginaryLine(): ChangeLine {
    return {
      lineNumber: null,
      kind: DiffChangeType.Imaginary,
      isInModifiedBlock: false,
      fragments: [ ]
    };
  }

  private static generateInlineDiff(oldStr: string, newStr: string, settings: CompareSettings, oldLineNum: number, newLineNum: number) {
    let inlineChanges: Array<Diff.Change>;
    if (settings.precision === PrecisionLevel.Character) {
      inlineChanges = Diff.diffChars(oldStr, newStr);
    } else {
      inlineChanges = Diff.diffWordsWithSpace(oldStr, newStr);
    }

    const oldFragments: Array<TextFragment> = [ ];
    const newFragments: Array<TextFragment> = [ ];
    let isWhitespaceOnly = true;

    for (let i = 0; i < inlineChanges.length; i++) {
      const change = inlineChanges[i];
      const isWhitespace = change.value.trim() === "";

      if (!isWhitespace && (change.added || change.removed)) {
        isWhitespaceOnly = false;
      }

      if (change.added) {
        newFragments.push({ text: change.value, kind: DiffChangeType.Inserted, isWhitespaceChange: isWhitespace });
      } else if (change.removed) {
        oldFragments.push({ text: change.value, kind: DiffChangeType.Deleted, isWhitespaceChange: isWhitespace });
      } else {
        oldFragments.push({ text: change.value, kind: DiffChangeType.Unchanged, isWhitespaceChange: isWhitespace });
        newFragments.push({ text: change.value, kind: DiffChangeType.Unchanged, isWhitespaceChange: isWhitespace });
      }
    }

    return {
      oldLine: { lineNumber: oldLineNum, kind: DiffChangeType.Deleted, isInModifiedBlock: true, fragments: oldFragments },
      newLine: { lineNumber: newLineNum, kind: DiffChangeType.Inserted, isInModifiedBlock: true, fragments: newFragments },
      isWhitespaceOnly
    };
  }
}