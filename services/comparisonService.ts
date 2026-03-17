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
        const diffResult = this.alignAndDiffLines(chunk.oldLines, chunk.newLines, settings, currentOldIndex + 1, currentNewIndex + 1);
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

  private static alignAndDiffLines(
    oldBlockLines: Array<string>, 
    newBlockLines: Array<string>, 
    settings: CompareSettings, 
    startOldLineNum: number, 
    startNewLineNum: number
  ) {
    const n = oldBlockLines.length;
    const m = newBlockLines.length;
    const dp: number[][] = [ ];
    const dir: number[][] = [ ];
    
    for (let i = 0; i <= n; i++) {
      dp[i] = [ ];
      dir[i] = [ ];
      for (let j = 0; j <= m; j++) {
        dp[i][j] = 0;
        dir[i][j] = 0;
      }
    }
    
    for (let i = 1; i <= n; i++) { dp[i][0] = -i; dir[i][0] = 2; }
    for (let j = 1; j <= m; j++) { dp[0][j] = -j; dir[0][j] = 3; }
    
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const sim = this.getSimilarity(oldBlockLines[i - 1], newBlockLines[j - 1]);
        const matchScore = sim >= 0.35 ? (sim * 3) : -3;
        
        const diag = dp[i - 1][j - 1] + matchScore;
        const up = dp[i - 1][j] - 1;
        const left = dp[i][j - 1] - 1;
        
        if (diag >= up && diag >= left) {
          dp[i][j] = diag;
          dir[i][j] = 1;
        } else if (up >= left) {
          dp[i][j] = up;
          dir[i][j] = 2;
        } else {
          dp[i][j] = left;
          dir[i][j] = 3;
        }
      }
    }
    
    const dpResult: Array<{ oldLine: string | null, newLine: string | null }> = [ ];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (dir[i][j] === 1) {
        dpResult.unshift({ oldLine: oldBlockLines[i - 1], newLine: newBlockLines[j - 1] });
        i--; j--;
      } else if (dir[i][j] === 2) {
        dpResult.unshift({ oldLine: oldBlockLines[i - 1], newLine: null });
        i--;
      } else {
        dpResult.unshift({ oldLine: null, newLine: newBlockLines[j - 1] });
        j--;
      }
    }
    
    const compressed: Array<{ oldLine: string | null, newLine: string | null }> = [ ];
    let oldBuffer: string[] = [ ];
    let newBuffer: string[] = [ ];
    
    const flushBuffers = () => {
      const maxLen = Math.max(oldBuffer.length, newBuffer.length);
      for (let idx = 0; idx < maxLen; idx++) {
        compressed.push({
          oldLine: idx < oldBuffer.length ? oldBuffer[idx] : null,
          newLine: idx < newBuffer.length ? newBuffer[idx] : null
        });
      }
      oldBuffer = [ ];
      newBuffer = [ ];
    };
    
    for (let k = 0; k < dpResult.length; k++) {
      const pair = dpResult[k];
      if (pair.oldLine !== null && pair.newLine !== null) {
        flushBuffers();
        compressed.push({ oldLine: pair.oldLine, newLine: pair.newLine });
      } else if (pair.oldLine !== null) {
        oldBuffer.push(pair.oldLine);
      } else if (pair.newLine !== null) {
        newBuffer.push(pair.newLine);
      }
    }
    flushBuffers();
    
    const oldLinesResult: Array<ChangeLine> = [ ];
    const newLinesResult: Array<ChangeLine> = [ ];
    let isWhitespaceOnlyBlock = true;
    let currentOldLineNum = startOldLineNum;
    let currentNewLineNum = startNewLineNum;
    
    for (let k = 0; k < compressed.length; k++) {
      const row = compressed[k];
      
      if (row.oldLine !== null && row.newLine !== null) {
        const diffResult = this.generateInlineDiff(row.oldLine, row.newLine, settings, currentOldLineNum++, currentNewLineNum++);
        oldLinesResult.push(diffResult.oldLine);
        newLinesResult.push(diffResult.newLine);
        if (!diffResult.isWhitespaceOnly) isWhitespaceOnlyBlock = false;
      } else if (row.oldLine !== null) {
        oldLinesResult.push(this.createLine(row.oldLine, DiffChangeType.Deleted, currentOldLineNum++, DiffChangeType.Deleted));
        newLinesResult.push(this.createImaginaryLine());
        if (row.oldLine.trim() !== "") isWhitespaceOnlyBlock = false;
      } else if (row.newLine !== null) {
        oldLinesResult.push(this.createImaginaryLine());
        newLinesResult.push(this.createLine(row.newLine, DiffChangeType.Inserted, currentNewLineNum++, DiffChangeType.Inserted));
        if (row.newLine.trim() !== "") isWhitespaceOnlyBlock = false;
      }
    }
    
    return { oldLinesResult, newLinesResult, isWhitespaceOnlyBlock };
  }

  private static getSimilarity(s1: string, s2: string): number {
    if (s1 === s2 && s1.trim() !== "") return 1;
    const s1Trim = s1.trim();
    const s2Trim = s2.trim();
    
    if (s1Trim === s2Trim && s1Trim.length > 0) return 1;
    if (s1Trim === "" && s2Trim === "") return 0.5; 
    
    const len = Math.max(s1Trim.length, s2Trim.length);
    if (len === 0) return 0;
    
    const diffs = Diff.diffWords(s1Trim, s2Trim);
    let matchCount = 0;
    for (let i = 0; i < diffs.length; i++) {
      if (!diffs[i].added && !diffs[i].removed) {
        matchCount += diffs[i].value.length;
      }
    }
    return matchCount / len;
  }

  private static createLine(
    text: string, 
    kind: DiffChangeType, 
    lineNumber: number, 
    fragmentKind: DiffChangeType = DiffChangeType.Unchanged
  ): ChangeLine {
    return {
      lineNumber,
      kind,
      isInModifiedBlock: false,
      fragments: [
        {
          text,
          kind: fragmentKind,
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