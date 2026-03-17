import { BlockType, ChangeBlock, ChangeLine, DiffChangeType } from "@/types/diff";
import { MergeDirection } from "@/types/ui";

export class MergeService {
  public static mergeBlock(targetText: string, block: ChangeBlock, direction: MergeDirection): string {
    const lines = targetText ? targetText.replace(/\r\n/g, "\n").split("\n") : [ ];

    let sourceLines: Array<ChangeLine>;
    let targetLines: Array<ChangeLine>;
    let insertIndex: number;

    if (direction === MergeDirection.LeftToRight) {
      sourceLines = block.oldLines;
      targetLines = block.newLines;
      insertIndex = block.startIndexNew;
    } else {
      sourceLines = block.newLines;
      targetLines = block.oldLines;
      insertIndex = block.startIndexOld;
    }

    const textToInsert = sourceLines
      .filter(l => l.kind !== DiffChangeType.Imaginary)
      .map(l => l.fragments.map(f => f.text).join(""));

    if (block.kind === BlockType.Added) {
      if (direction === MergeDirection.LeftToRight) {
        this.removeLines(lines, targetLines);
      } else {
        this.insertLines(lines, insertIndex, textToInsert);
      }
    } else if (block.kind === BlockType.Removed) {
      if (direction === MergeDirection.LeftToRight) {
        this.insertLines(lines, insertIndex, textToInsert);
      } else {
        this.removeLines(lines, targetLines);
      }
    } else if (block.kind === BlockType.Modified) {
      this.replaceLines(lines, targetLines, textToInsert);
    }

    return lines.join("\n");
  }

  private static removeLines(textLines: Array<string>, linesToRemove: Array<ChangeLine>): void {
    const indices = linesToRemove
      .filter(l => l.lineNumber !== null)
      .map(l => (l.lineNumber as number) - 1)
      .sort((a, b) => b - a);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      if (index >= 0 && index < textLines.length) {
        textLines.splice(index, 1);
      }
    }
  }

  private static insertLines(textLines: Array<string>, insertIndex: number, linesToInsert: Array<string>): void {
    let idx = insertIndex;

    if (idx > textLines.length) {
      idx = textLines.length;
    }

    if (idx < 0) {
      idx = 0;
    }

    textLines.splice(idx, 0, ...linesToInsert);
  }

  private static replaceLines(textLines: Array<string>, targets: Array<ChangeLine>, newContent: Array<string>): void {
    const firstRealLine = targets.find(l => l.lineNumber !== null);
    if (!firstRealLine || firstRealLine.lineNumber === null) {
      return;
    }

    const startIndex = firstRealLine.lineNumber - 1;
    const countToRemove = targets.filter(l => l.kind !== DiffChangeType.Imaginary).length;

    if (startIndex >= 0 && startIndex < textLines.length) {
      const actualRemovable = Math.min(countToRemove, textLines.length - startIndex);
      if (actualRemovable > 0) {
        textLines.splice(startIndex, actualRemovable, ...newContent);
      } else {
        textLines.splice(startIndex, 0, ...newContent);
      }
    }
  }
}