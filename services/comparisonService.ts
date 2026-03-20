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

    const mergedChunks = this.mergeWhitespaceAnchoredChunks(chunks);
    const normalizedChunks = this.normalizeWhitespaceEdgesInModifiedChunks(mergedChunks);

    const blocks: Array<ChangeBlock> = [ ];
    let currentOldIndex = 0;
    let currentNewIndex = 0;

    for (let i = 0; i < normalizedChunks.length; i++) {
      const chunk = normalizedChunks[i];

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

  private static mergeWhitespaceAnchoredChunks(chunks: Array<Chunk>): Array<Chunk> {
    if (chunks.length < 3) {
      return chunks;
    }

    const result: Array<Chunk> = [ ];
    let i = 0;

    while (i < chunks.length) {
      const current = chunks[i];
      const previous = result.length > 0 ? result[result.length - 1] : null;
      const next = i + 1 < chunks.length ? chunks[i + 1] : null;

      // Prevent whitespace-only unchanged lines from acting as split anchors between changed regions.
      if (
        previous !== null &&
        next !== null &&
        this.isChangedChunk(previous) &&
        this.isWhitespaceOnlyUnchangedChunk(current) &&
        this.isChangedChunk(next)
      ) {
        // Keep two independent replace regions separated by whitespace-only unchanged lines.
        if (this.isBidirectionalChange(previous) && this.isBidirectionalChange(next)) {
          result.push(current);
          i++;
          continue;
        }

        result.pop();

        const oldLines = previous.oldLines.concat(current.oldLines, next.oldLines);
        const newLines = previous.newLines.concat(current.newLines, next.newLines);

        result.push({
          type: this.resolveChunkType(oldLines, newLines),
          oldLines,
          newLines
        });

        i += 2;
        continue;
      }

      result.push(current);
      i++;
    }

    return result;
  }

  private static isChangedChunk(chunk: Chunk): boolean {
    return chunk.type !== BlockType.Unchanged;
  }

  private static isBidirectionalChange(chunk: Chunk): boolean {
    return chunk.oldLines.length > 0 && chunk.newLines.length > 0;
  }

  private static isWhitespaceOnlyUnchangedChunk(chunk: Chunk): boolean {
    if (chunk.type !== BlockType.Unchanged) {
      return false;
    }

    if (chunk.oldLines.length === 0) {
      return false;
    }

    for (let i = 0; i < chunk.oldLines.length; i++) {
      if (chunk.oldLines[i].trim() !== "") {
        return false;
      }
    }

    return true;
  }

  private static resolveChunkType(oldLines: Array<string>, newLines: Array<string>): BlockType {
    if (oldLines.length > 0 && newLines.length === 0) {
      return BlockType.Removed;
    }

    if (oldLines.length === 0 && newLines.length > 0) {
      return BlockType.Added;
    }

    if (oldLines.length > 0 && newLines.length > 0) {
      return BlockType.Modified;
    }

    return BlockType.Unchanged;
  }

  private static normalizeWhitespaceEdgesInModifiedChunks(chunks: Array<Chunk>): Array<Chunk> {
    const normalized: Array<Chunk> = [ ];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const splitChunks = chunk.type === BlockType.Modified
        ? this.splitModifiedChunkWhitespaceEdges(chunk)
        : [ chunk ];

      for (let j = 0; j < splitChunks.length; j++) {
        const piece = splitChunks[j];
        const previous = normalized.length > 0 ? normalized[normalized.length - 1] : null;

        if (previous !== null && previous.type === piece.type) {
          previous.oldLines = previous.oldLines.concat(piece.oldLines);
          previous.newLines = previous.newLines.concat(piece.newLines);
        } else {
          normalized.push(piece);
        }
      }
    }

    return normalized;
  }

  private static splitModifiedChunkWhitespaceEdges(chunk: Chunk): Array<Chunk> {
    const maxPrefixLength = Math.min(chunk.oldLines.length, chunk.newLines.length);
    let prefixLength = 0;

    while (
      prefixLength < maxPrefixLength &&
      this.isEquivalentWhitespaceLine(chunk.oldLines[prefixLength], chunk.newLines[prefixLength])
    ) {
      prefixLength++;
    }

    let suffixLength = 0;
    while (
      suffixLength < (chunk.oldLines.length - prefixLength) &&
      suffixLength < (chunk.newLines.length - prefixLength) &&
      this.isEquivalentWhitespaceLine(
        chunk.oldLines[chunk.oldLines.length - 1 - suffixLength],
        chunk.newLines[chunk.newLines.length - 1 - suffixLength]
      )
    ) {
      suffixLength++;
    }

    if (prefixLength === 0 && suffixLength === 0) {
      return [ chunk ];
    }

    const splitChunks: Array<Chunk> = [ ];

    if (prefixLength > 0) {
      splitChunks.push({
        type: BlockType.Unchanged,
        oldLines: chunk.oldLines.slice(0, prefixLength),
        newLines: chunk.newLines.slice(0, prefixLength)
      });
    }

    const middleOldLines = chunk.oldLines.slice(prefixLength, chunk.oldLines.length - suffixLength);
    const middleNewLines = chunk.newLines.slice(prefixLength, chunk.newLines.length - suffixLength);

    if (middleOldLines.length > 0 || middleNewLines.length > 0) {
      splitChunks.push({
        type: this.resolveChunkType(middleOldLines, middleNewLines),
        oldLines: middleOldLines,
        newLines: middleNewLines
      });
    }

    if (suffixLength > 0) {
      splitChunks.push({
        type: BlockType.Unchanged,
        oldLines: chunk.oldLines.slice(chunk.oldLines.length - suffixLength),
        newLines: chunk.newLines.slice(chunk.newLines.length - suffixLength)
      });
    }

    return splitChunks.length > 0 ? splitChunks : [ chunk ];
  }

  private static isEquivalentWhitespaceLine(oldLine: string, newLine: string): boolean {
    if (oldLine !== newLine) {
      return false;
    }

    return oldLine.trim() === "";
  }

  private static alignAndDiffLines(
    oldBlockLines: Array<string>, 
    newBlockLines: Array<string>, 
    settings: CompareSettings, 
    startOldLineNum: number, 
    startNewLineNum: number
  ) {
    if (
      settings.precision === PrecisionLevel.Character &&
      oldBlockLines.length !== newBlockLines.length
    ) {
      return this.generateCrossLineCharacterDiff(oldBlockLines, newBlockLines, startOldLineNum, startNewLineNum);
    }

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

  private static generateCrossLineCharacterDiff(
    oldBlockLines: Array<string>,
    newBlockLines: Array<string>,
    startOldLineNum: number,
    startNewLineNum: number
  ) {
    const oldJoined = oldBlockLines.join("\n");
    const newJoined = newBlockLines.join("\n");
    const stableMatches = this.findStableSubstringMatches(oldJoined, newJoined, 4);

    const oldFlatFragments: Array<TextFragment> = [ ];
    const newFlatFragments: Array<TextFragment> = [ ];
    let oldCursor = 0;
    let newCursor = 0;

    for (let i = 0; i < stableMatches.length; i++) {
      const match = stableMatches[i];

      if (oldCursor < match.oldStart) {
        this.appendMergedFragment(oldFlatFragments, oldJoined.slice(oldCursor, match.oldStart), DiffChangeType.Deleted);
      }

      if (newCursor < match.newStart) {
        this.appendMergedFragment(newFlatFragments, newJoined.slice(newCursor, match.newStart), DiffChangeType.Inserted);
      }

      const unchangedText = oldJoined.slice(match.oldStart, match.oldStart + match.length);
      this.appendMergedFragment(oldFlatFragments, unchangedText, DiffChangeType.Unchanged);
      this.appendMergedFragment(newFlatFragments, unchangedText, DiffChangeType.Unchanged);

      oldCursor = match.oldStart + match.length;
      newCursor = match.newStart + match.length;
    }

    if (oldCursor < oldJoined.length) {
      this.appendMergedFragment(oldFlatFragments, oldJoined.slice(oldCursor), DiffChangeType.Deleted);
    }

    if (newCursor < newJoined.length) {
      this.appendMergedFragment(newFlatFragments, newJoined.slice(newCursor), DiffChangeType.Inserted);
    }

    let isWhitespaceOnlyBlock = true;
    for (let i = 0; i < oldFlatFragments.length; i++) {
      if (oldFlatFragments[i].kind === DiffChangeType.Deleted && oldFlatFragments[i].text.trim() !== "") {
        isWhitespaceOnlyBlock = false;
        break;
      }
    }

    if (isWhitespaceOnlyBlock) {
      for (let i = 0; i < newFlatFragments.length; i++) {
        if (newFlatFragments[i].kind === DiffChangeType.Inserted && newFlatFragments[i].text.trim() !== "") {
          isWhitespaceOnlyBlock = false;
          break;
        }
      }
    }

    const oldLinesResult = this.projectFragmentsToLines(
      oldFlatFragments,
      oldBlockLines.length,
      startOldLineNum,
      DiffChangeType.Deleted
    );

    const newLinesResult = this.projectFragmentsToLines(
      newFlatFragments,
      newBlockLines.length,
      startNewLineNum,
      DiffChangeType.Inserted
    );

    return { oldLinesResult, newLinesResult, isWhitespaceOnlyBlock };
  }

  private static appendMergedFragment(
    target: Array<TextFragment>,
    text: string,
    kind: DiffChangeType
  ) {
    if (text.length === 0) {
      return;
    }

    const isWhitespaceChange = text.trim() === "";
    const last = target.length > 0 ? target[target.length - 1] : null;

    if (last && last.kind === kind && last.isWhitespaceChange === isWhitespaceChange) {
      last.text += text;
      return;
    }

    target.push({
      text,
      kind,
      isWhitespaceChange
    });
  }

  private static normalizeCharacterChanges(changes: Array<Diff.Change>, minInternalUnchangedLength: number): Array<Diff.Change> {
    if (changes.length === 0 || minInternalUnchangedLength <= 1) {
      return changes;
    }

    const normalized: Array<Diff.Change> = [ ];

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      const isUnchanged = !change.added && !change.removed;

      if (!isUnchanged) {
        normalized.push(change);
        continue;
      }

      const isWhitespace = change.value.trim() === "";
      const isShort = change.value.length < minInternalUnchangedLength;
      const prev = i > 0 ? changes[i - 1] : null;
      const next = i + 1 < changes.length ? changes[i + 1] : null;
      const isInternal = prev !== null && next !== null;
      const prevIsChanged = prev !== null && (prev.added || prev.removed);
      const nextIsChanged = next !== null && (next.added || next.removed);

      if (!isWhitespace && isShort && isInternal && prevIsChanged && nextIsChanged) {
        normalized.push({ value: change.value, added: false, removed: true, count: change.value.length });
        normalized.push({ value: change.value, added: true, removed: false, count: change.value.length });
      } else {
        normalized.push(change);
      }
    }

    return normalized;
  }

  private static findStableSubstringMatches(
    oldText: string,
    newText: string,
    minLength: number
  ): Array<{ oldStart: number; newStart: number; length: number }> {
    interface Segment {
      oldStart: number;
      oldEnd: number;
      newStart: number;
      newEnd: number;
    }

    const stack: Array<Segment> = [
      {
        oldStart: 0,
        oldEnd: oldText.length,
        newStart: 0,
        newEnd: newText.length
      }
    ];
    const matches: Array<{ oldStart: number; newStart: number; length: number }> = [ ];

    while (stack.length > 0) {
      const segment = stack.pop()!;
      const match = this.findLongestCommonSubstringInSegment(oldText, newText, segment);

      if (match.length === 0) {
        continue;
      }

      const isEdgeMatch =
        match.oldStart === 0 ||
        match.newStart === 0 ||
        match.oldStart + match.length === oldText.length ||
        match.newStart + match.length === newText.length;

      if (match.length < minLength && !isEdgeMatch) {
        continue;
      }

      matches.push(match);

      const leftSegment: Segment = {
        oldStart: segment.oldStart,
        oldEnd: match.oldStart,
        newStart: segment.newStart,
        newEnd: match.newStart
      };

      const rightSegment: Segment = {
        oldStart: match.oldStart + match.length,
        oldEnd: segment.oldEnd,
        newStart: match.newStart + match.length,
        newEnd: segment.newEnd
      };

      if (leftSegment.oldEnd > leftSegment.oldStart && leftSegment.newEnd > leftSegment.newStart) {
        stack.push(leftSegment);
      }

      if (rightSegment.oldEnd > rightSegment.oldStart && rightSegment.newEnd > rightSegment.newStart) {
        stack.push(rightSegment);
      }
    }

    matches.sort((a, b) => {
      if (a.oldStart !== b.oldStart) {
        return a.oldStart - b.oldStart;
      }

      return a.newStart - b.newStart;
    });
    return matches;
  }

  private static findLongestCommonSubstringInSegment(
    oldText: string,
    newText: string,
    segment: { oldStart: number; oldEnd: number; newStart: number; newEnd: number }
  ): { oldStart: number; newStart: number; length: number } {
    const oldLen = segment.oldEnd - segment.oldStart;
    const newLen = segment.newEnd - segment.newStart;

    if (oldLen <= 0 || newLen <= 0) {
      return { oldStart: segment.oldStart, newStart: segment.newStart, length: 0 };
    }

    const prev = new Array<number>(newLen + 1).fill(0);
    const curr = new Array<number>(newLen + 1).fill(0);
    let bestLength = 0;
    let bestOldEnd = segment.oldStart;
    let bestNewEnd = segment.newStart;

    for (let i = 1; i <= oldLen; i++) {
      curr.fill(0);
      const oldChar = oldText.charCodeAt(segment.oldStart + i - 1);

      for (let j = 1; j <= newLen; j++) {
        if (oldChar === newText.charCodeAt(segment.newStart + j - 1)) {
          curr[j] = prev[j - 1] + 1;

          if (curr[j] > bestLength) {
            bestLength = curr[j];
            bestOldEnd = segment.oldStart + i;
            bestNewEnd = segment.newStart + j;
          }
        }
      }

      for (let j = 0; j <= newLen; j++) {
        prev[j] = curr[j];
      }
    }

    return {
      oldStart: bestOldEnd - bestLength,
      newStart: bestNewEnd - bestLength,
      length: bestLength
    };
  }

  private static projectFragmentsToLines(
    flatFragments: Array<TextFragment>,
    expectedLineCount: number,
    startLineNum: number,
    lineKind: DiffChangeType
  ): Array<ChangeLine> {
    const lineBuckets: Array<Array<TextFragment>> = [ [ ] ];

    const appendFragment = (bucket: Array<TextFragment>, fragment: TextFragment, text: string) => {
      if (text.length === 0) {
        return;
      }

      bucket.push({
        text,
        kind: fragment.kind,
        isWhitespaceChange: text.trim() === ""
      });
    };

    for (let i = 0; i < flatFragments.length; i++) {
      const fragment = flatFragments[i];
      let cursor = 0;

      while (cursor < fragment.text.length) {
        const newlineIndex = fragment.text.indexOf("\n", cursor);

        if (newlineIndex === -1) {
          appendFragment(lineBuckets[lineBuckets.length - 1], fragment, fragment.text.slice(cursor));
          break;
        }

        appendFragment(lineBuckets[lineBuckets.length - 1], fragment, fragment.text.slice(cursor, newlineIndex));
        lineBuckets.push([ ]);
        cursor = newlineIndex + 1;
      }
    }

    if (expectedLineCount > 0 && lineBuckets.length > expectedLineCount) {
      const overflowStart = expectedLineCount;
      for (let i = overflowStart; i < lineBuckets.length; i++) {
        lineBuckets[expectedLineCount - 1] = lineBuckets[expectedLineCount - 1].concat(lineBuckets[i]);
      }
      lineBuckets.length = expectedLineCount;
    }

    while (lineBuckets.length < expectedLineCount) {
      lineBuckets.push([ ]);
    }

    const result: Array<ChangeLine> = [ ];
    for (let i = 0; i < expectedLineCount; i++) {
      result.push({
        lineNumber: startLineNum + i,
        kind: lineKind,
        isInModifiedBlock: true,
        fragments: lineBuckets[i]
      });
    }

    return result;
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
      inlineChanges = this.normalizeCharacterChanges(Diff.diffChars(oldStr, newStr), 3);
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