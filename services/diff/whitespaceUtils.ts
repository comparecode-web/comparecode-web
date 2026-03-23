import { BlockType } from "@/types/diff";
import { Chunk } from "./types";
import { resolveChunkType } from "./coreUtils";

export function isChangedChunk(chunk: Chunk): boolean {
  return chunk.type !== BlockType.Unchanged;
}

export function isBidirectionalChange(chunk: Chunk): boolean {
  return chunk.oldLines.length > 0 && chunk.newLines.length > 0;
}

export function isWhitespaceOnlyUnchangedChunk(chunk: Chunk): boolean {
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

export function mergeWhitespaceAnchoredChunks(chunks: Array<Chunk>): Array<Chunk> {
  if (chunks.length < 3) {
    return chunks;
  }
  const result: Array<Chunk> = [];
  let i = 0;
  while (i < chunks.length) {
    const current = chunks[i];
    const previous = result.length > 0 ? result[result.length - 1] : null;
    const next = i + 1 < chunks.length ? chunks[i + 1] : null;
    if (previous !== null && next !== null && isChangedChunk(previous) && isWhitespaceOnlyUnchangedChunk(current) && isChangedChunk(next)) {
      if (isBidirectionalChange(previous) && isBidirectionalChange(next)) {
        result.push(current);
        i++;
        continue;
      }
      result.pop();
      const oldLines = previous.oldLines.concat(current.oldLines, next.oldLines);
      const newLines = previous.newLines.concat(current.newLines, next.newLines);
      result.push({
        type: resolveChunkType(oldLines, newLines),
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

export function isEquivalentWhitespaceLine(oldLine: string, newLine: string): boolean {
  if (oldLine !== newLine) {
    return false;
  }
  return oldLine.trim() === "";
}

export function splitModifiedChunkWhitespaceEdges(chunk: Chunk): Array<Chunk> {
  const maxPrefixLength = Math.min(chunk.oldLines.length, chunk.newLines.length);
  let prefixLength = 0;
  while (prefixLength < maxPrefixLength && isEquivalentWhitespaceLine(chunk.oldLines[prefixLength], chunk.newLines[prefixLength])) {
    prefixLength++;
  }
  let suffixLength = 0;
  while (suffixLength < (chunk.oldLines.length - prefixLength) && suffixLength < (chunk.newLines.length - prefixLength) && isEquivalentWhitespaceLine(chunk.oldLines[chunk.oldLines.length - 1 - suffixLength], chunk.newLines[chunk.newLines.length - 1 - suffixLength])) {
    suffixLength++;
  }
  if (prefixLength === 0 && suffixLength === 0) {
    return [chunk];
  }
  const splitChunks: Array<Chunk> = [];
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
      type: resolveChunkType(middleOldLines, middleNewLines),
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
  return splitChunks.length > 0 ? splitChunks : [chunk];
}

export function normalizeWhitespaceEdgesInModifiedChunks(chunks: Array<Chunk>): Array<Chunk> {
  const normalized: Array<Chunk> = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const splitChunks = chunk.type === BlockType.Modified ? splitModifiedChunkWhitespaceEdges(chunk) : [chunk];
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