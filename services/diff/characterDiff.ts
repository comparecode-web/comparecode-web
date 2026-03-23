import * as Diff from "diff";
import { DiffChangeType, TextFragment, ChangeLine } from "@/types/diff";
import { CompareSettings, PrecisionLevel } from "@/types/settings";
import { getTrimmedEndIndex, getCommonPrefixLength, getCommonSuffixLength, isTokenBoundaryAnchor, getSimilarity, createLine, createImaginaryLine } from "./coreUtils";
import { appendMergedFragment, normalizeCharacterChanges, normalizeCrossLineCharacterChanges, projectFragmentsToLines, generateWordPrecisionChanges, rebalanceDuplicateBoundaryHighlights, mergeWhitespaceBetweenChangedFragments, normalizeTrailingWhitespaceAtChangeBoundary } from "./fragmentUtils";

export function findLongestCommonSubstringInSegment(oldText: string, newText: string, segment: { oldStart: number; oldEnd: number; newStart: number; newEnd: number }): { oldStart: number; newStart: number; length: number } {
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

export function findStableSubstringMatches(oldText: string, newText: string, minLength: number): Array<{ oldStart: number; newStart: number; length: number }> {
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
  const matches: Array<{ oldStart: number; newStart: number; length: number }> = [];
  while (stack.length > 0) {
    const segment = stack.pop()!;
    const match = findLongestCommonSubstringInSegment(oldText, newText, segment);
    if (match.length === 0) {
      continue;
    }
    if (match.length < minLength) {
      continue;
    }
    if (match.length < 8 && !isTokenBoundaryAnchor(oldText, newText, match.oldStart, match.newStart, match.length)) {
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

export function appendCrossLineGapDiff(oldTarget: Array<TextFragment>, newTarget: Array<TextFragment>, oldGap: string, newGap: string) {
  if (oldGap.length === 0 && newGap.length === 0) {
    return;
  }
  if (oldGap.length === 0) {
    appendMergedFragment(newTarget, newGap, DiffChangeType.Inserted);
    return;
  }
  if (newGap.length === 0) {
    appendMergedFragment(oldTarget, oldGap, DiffChangeType.Deleted);
    return;
  }
  const changes = normalizeCrossLineCharacterChanges(Diff.diffChars(oldGap, newGap), 3);
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    if (change.added) {
      appendMergedFragment(newTarget, change.value, DiffChangeType.Inserted);
    } else if (change.removed) {
      appendMergedFragment(oldTarget, change.value, DiffChangeType.Deleted);
    } else {
      appendMergedFragment(oldTarget, change.value, DiffChangeType.Unchanged);
      appendMergedFragment(newTarget, change.value, DiffChangeType.Unchanged);
    }
  }
}

export function generateCrossLineCharacterDiff(oldBlockLines: Array<string>, newBlockLines: Array<string>, startOldLineNum: number, startNewLineNum: number) {
  const oldJoined = oldBlockLines.join("\n");
  const newJoined = newBlockLines.join("\n");
  const minStableInternalLength = 4;
  const oldTrimEnd = getTrimmedEndIndex(oldJoined);
  const newTrimEnd = getTrimmedEndIndex(newJoined);
  const prefixLength = getCommonPrefixLength(oldJoined, oldTrimEnd, newJoined, newTrimEnd);
  const suffixLength = getCommonSuffixLength(oldJoined, oldTrimEnd, newJoined, newTrimEnd, prefixLength);
  const middleOldStart = prefixLength;
  const middleOldEnd = oldTrimEnd - suffixLength;
  const middleNewStart = prefixLength;
  const middleNewEnd = newTrimEnd - suffixLength;
  const middleOld = oldJoined.slice(middleOldStart, middleOldEnd);
  const middleNew = newJoined.slice(middleNewStart, middleNewEnd);
  const stableMatches = findStableSubstringMatches(middleOld, middleNew, minStableInternalLength);
  const oldFlatFragments: Array<TextFragment> = [];
  const newFlatFragments: Array<TextFragment> = [];
  if (prefixLength > 0) {
    const prefix = oldJoined.slice(0, prefixLength);
    appendMergedFragment(oldFlatFragments, prefix, DiffChangeType.Unchanged);
    appendMergedFragment(newFlatFragments, prefix, DiffChangeType.Unchanged);
  }
  let oldCursor = middleOldStart;
  let newCursor = middleNewStart;
  for (let i = 0; i < stableMatches.length; i++) {
    const match = stableMatches[i];
    const matchOldStart = middleOldStart + match.oldStart;
    const matchNewStart = middleNewStart + match.newStart;
    appendCrossLineGapDiff(oldFlatFragments, newFlatFragments, oldJoined.slice(oldCursor, matchOldStart), newJoined.slice(newCursor, matchNewStart));
    const unchangedText = oldJoined.slice(matchOldStart, matchOldStart + match.length);
    appendMergedFragment(oldFlatFragments, unchangedText, DiffChangeType.Unchanged);
    appendMergedFragment(newFlatFragments, unchangedText, DiffChangeType.Unchanged);
    oldCursor = matchOldStart + match.length;
    newCursor = matchNewStart + match.length;
  }
  appendCrossLineGapDiff(oldFlatFragments, newFlatFragments, oldJoined.slice(oldCursor, middleOldEnd), newJoined.slice(newCursor, middleNewEnd));
  if (suffixLength > 0) {
    const suffixStart = oldTrimEnd - suffixLength;
    const suffix = oldJoined.slice(suffixStart, oldTrimEnd);
    appendMergedFragment(oldFlatFragments, suffix, DiffChangeType.Unchanged);
    appendMergedFragment(newFlatFragments, suffix, DiffChangeType.Unchanged);
  }
  if (oldTrimEnd < oldJoined.length) {
    appendMergedFragment(oldFlatFragments, oldJoined.slice(oldTrimEnd), DiffChangeType.Deleted);
  }
  if (newTrimEnd < newJoined.length) {
    appendMergedFragment(newFlatFragments, newJoined.slice(newTrimEnd), DiffChangeType.Inserted);
  }
  const normalizedOldFlatFragments = rebalanceDuplicateBoundaryHighlights(oldFlatFragments);
  const normalizedNewFlatFragments = rebalanceDuplicateBoundaryHighlights(newFlatFragments);
  let isWhitespaceOnlyBlock = true;
  for (let i = 0; i < normalizedOldFlatFragments.length; i++) {
    if (normalizedOldFlatFragments[i].kind === DiffChangeType.Deleted && normalizedOldFlatFragments[i].text.trim() !== "") {
      isWhitespaceOnlyBlock = false;
      break;
    }
  }
  if (isWhitespaceOnlyBlock) {
    for (let i = 0; i < normalizedNewFlatFragments.length; i++) {
      if (normalizedNewFlatFragments[i].kind === DiffChangeType.Inserted && normalizedNewFlatFragments[i].text.trim() !== "") {
        isWhitespaceOnlyBlock = false;
        break;
      }
    }
  }
  const oldLinesResult = projectFragmentsToLines(normalizedOldFlatFragments, oldBlockLines.length, startOldLineNum, DiffChangeType.Deleted);
  const newLinesResult = projectFragmentsToLines(normalizedNewFlatFragments, newBlockLines.length, startNewLineNum, DiffChangeType.Inserted);
  return { oldLinesResult, newLinesResult, isWhitespaceOnlyBlock };
}

export function generateInlineDiff(oldStr: string, newStr: string, settings: CompareSettings, oldLineNum: number, newLineNum: number) {
  let inlineChanges: Array<Diff.Change>;
  if (settings.precision === PrecisionLevel.Character) {
    inlineChanges = normalizeCharacterChanges(Diff.diffChars(oldStr, newStr), 3);
  } else {
    inlineChanges = generateWordPrecisionChanges(oldStr, newStr);
  }
  const oldFragments: Array<TextFragment> = [];
  const newFragments: Array<TextFragment> = [];
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
  let balancedOldFragments = rebalanceDuplicateBoundaryHighlights(oldFragments);
  let balancedNewFragments = rebalanceDuplicateBoundaryHighlights(newFragments);
  if (settings.precision === PrecisionLevel.Word) {
    balancedOldFragments = mergeWhitespaceBetweenChangedFragments(balancedOldFragments, DiffChangeType.Deleted);
    balancedNewFragments = mergeWhitespaceBetweenChangedFragments(balancedNewFragments, DiffChangeType.Inserted);
    balancedOldFragments = normalizeTrailingWhitespaceAtChangeBoundary(balancedOldFragments);
    balancedNewFragments = normalizeTrailingWhitespaceAtChangeBoundary(balancedNewFragments);
  }
  return {
    oldLine: { lineNumber: oldLineNum, kind: DiffChangeType.Deleted, isInModifiedBlock: true, fragments: balancedOldFragments },
    newLine: { lineNumber: newLineNum, kind: DiffChangeType.Inserted, isInModifiedBlock: true, fragments: balancedNewFragments },
    isWhitespaceOnly
  };
}

export function alignAndDiffLines(oldBlockLines: Array<string>, newBlockLines: Array<string>, settings: CompareSettings, startOldLineNum: number, startNewLineNum: number) {
  if (settings.precision === PrecisionLevel.Character && oldBlockLines.length !== newBlockLines.length) {
    return generateCrossLineCharacterDiff(oldBlockLines, newBlockLines, startOldLineNum, startNewLineNum);
  }
  const n = oldBlockLines.length;
  const m = newBlockLines.length;
  const dp: number[][] = [];
  const dir: number[][] = [];
  for (let i = 0; i <= n; i++) {
    dp[i] = [];
    dir[i] = [];
    for (let j = 0; j <= m; j++) {
      dp[i][j] = 0;
      dir[i][j] = 0;
    }
  }
  for (let i = 1; i <= n; i++) { dp[i][0] = -i; dir[i][0] = 2; }
  for (let j = 1; j <= m; j++) { dp[0][j] = -j; dir[0][j] = 3; }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sim = getSimilarity(oldBlockLines[i - 1], newBlockLines[j - 1]);
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
  const dpResult: Array<{ oldLine: string | null, newLine: string | null }> = [];
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
  const compressed: Array<{ oldLine: string | null, newLine: string | null }> = [];
  let oldBuffer: string[] = [];
  let newBuffer: string[] = [];
  const flushBuffers = () => {
    const maxLen = Math.max(oldBuffer.length, newBuffer.length);
    for (let idx = 0; idx < maxLen; idx++) {
      compressed.push({
        oldLine: idx < oldBuffer.length ? oldBuffer[idx] : null,
        newLine: idx < newBuffer.length ? newBuffer[idx] : null
      });
    }
    oldBuffer = [];
    newBuffer = [];
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
  const oldLinesResult: Array<ChangeLine> = [];
  const newLinesResult: Array<ChangeLine> = [];
  let isWhitespaceOnlyBlock = true;
  let currentOldLineNum = startOldLineNum;
  let currentNewLineNum = startNewLineNum;
  for (let k = 0; k < compressed.length; k++) {
    const row = compressed[k];
    if (row.oldLine !== null && row.newLine !== null) {
      const diffResult = generateInlineDiff(row.oldLine, row.newLine, settings, currentOldLineNum++, currentNewLineNum++);
      oldLinesResult.push(diffResult.oldLine);
      newLinesResult.push(diffResult.newLine);
      if (!diffResult.isWhitespaceOnly) isWhitespaceOnlyBlock = false;
    } else if (row.oldLine !== null) {
      oldLinesResult.push(createLine(row.oldLine, DiffChangeType.Deleted, currentOldLineNum++, DiffChangeType.Deleted));
      newLinesResult.push(createImaginaryLine());
      if (row.oldLine.trim() !== "") isWhitespaceOnlyBlock = false;
    } else if (row.newLine !== null) {
      oldLinesResult.push(createImaginaryLine());
      newLinesResult.push(createLine(row.newLine, DiffChangeType.Inserted, currentNewLineNum++, DiffChangeType.Inserted));
      if (row.newLine.trim() !== "") isWhitespaceOnlyBlock = false;
    }
  }
  return { oldLinesResult, newLinesResult, isWhitespaceOnlyBlock };
}