import * as Diff from "diff";
import { BlockType, ChangeLine, DiffChangeType } from "@/types/diff";

export function resolveChunkType(oldLines: Array<string>, newLines: Array<string>): BlockType {
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

export function getTrimmedEndIndex(text: string): number {
  let end = text.length;
  while (end > 0 && /\s/.test(text[end - 1])) {
    end--;
  }
  return end;
}

export function getCommonPrefixLength(oldText: string, oldEnd: number, newText: string, newEnd: number): number {
  const limit = Math.min(oldEnd, newEnd);
  let idx = 0;
  while (idx < limit && oldText.charCodeAt(idx) === newText.charCodeAt(idx)) {
    idx++;
  }
  return idx;
}

export function getCommonSuffixLength(oldText: string, oldEnd: number, newText: string, newEnd: number, protectedPrefixLength: number): number {
  let oldIdx = oldEnd - 1;
  let newIdx = newEnd - 1;
  let length = 0;
  while (oldIdx >= protectedPrefixLength && newIdx >= protectedPrefixLength && oldText.charCodeAt(oldIdx) === newText.charCodeAt(newIdx)) {
    length++;
    oldIdx--;
    newIdx--;
  }
  return length;
}

export function isMeaningfulShortCrossLineAnchor(value: string): boolean {
  if (value.indexOf("\n") !== -1 || value.indexOf("\r") !== -1) {
    return true;
  }
  if (/^[0-9]+$/.test(value)) {
    return true;
  }
  return /^[\"'<>/=]+$/.test(value);
}

export function isWordCharacter(charCode: number): boolean {
  return (charCode >= 48 && charCode <= 57) || (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || charCode === 95;
}

export function isBoundaryAt(text: string, leftIndex: number, rightIndex: number): boolean {
  const leftIsWord = leftIndex >= 0 ? isWordCharacter(text.charCodeAt(leftIndex)) : false;
  const rightIsWord = rightIndex < text.length ? isWordCharacter(text.charCodeAt(rightIndex)) : false;
  return leftIsWord !== rightIsWord;
}

export function isTokenBoundaryAnchor(oldText: string, newText: string, oldStart: number, newStart: number, length: number): boolean {
  const oldEnd = oldStart + length;
  const newEnd = newStart + length;
  const oldLeftBoundary = isBoundaryAt(oldText, oldStart - 1, oldStart);
  const oldRightBoundary = isBoundaryAt(oldText, oldEnd - 1, oldEnd);
  const newLeftBoundary = isBoundaryAt(newText, newStart - 1, newStart);
  const newRightBoundary = isBoundaryAt(newText, newEnd - 1, newEnd);
  return oldLeftBoundary && oldRightBoundary && newLeftBoundary && newRightBoundary;
}

export function tokenizeByWhitespace(text: string): Array<string> {
  const tokens = text.match(/\s+|\S+/g);
  return tokens ?? [];
}

export function hasWordLikeContent(text: string): boolean {
  return /[A-Za-z0-9_]/.test(text);
}

export function getSimilarity(s1: string, s2: string): number {
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

export function createLine(text: string, kind: DiffChangeType, lineNumber: number, fragmentKind: DiffChangeType = DiffChangeType.Unchanged): ChangeLine {
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

export function createImaginaryLine(): ChangeLine {
  return {
    lineNumber: null,
    kind: DiffChangeType.Imaginary,
    isInModifiedBlock: false,
    fragments: []
  };
}