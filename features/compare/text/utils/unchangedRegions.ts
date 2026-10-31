import { BlockType, ChangeBlock } from "@/features/compare/text/types/diff";

export const MINIMUM_HIDDEN_LINES = 3;
export const UNCHANGED_REVEAL_STEP = 20;

export type UnchangedExpansion = { above: number; below: number } | "all";
export type UnchangedExpansions = Readonly<Record<string, UnchangedExpansion>>;

export interface HiddenRange {
  key: string;
  start: number;
  end: number;
}

export interface CollapseOptions {
  contextLines: number;
  expansions: UnchangedExpansions;
}

export function getUnchangedKey(block: ChangeBlock): string {
  return `${block.startIndexOld}:${block.startIndexNew}`;
}

export function getHiddenRanges(blocks: ReadonlyArray<ChangeBlock>, options: CollapseOptions): Map<string, HiddenRange> {
  const ranges = new Map<string, HiddenRange>();
  if (!blocks.some((block) => block.kind !== BlockType.Unchanged)) return ranges;
  const context = Math.max(0, Math.floor(options.contextLines));
  blocks.forEach((block, index) => {
    if (block.kind !== BlockType.Unchanged) return;
    const key = getUnchangedKey(block);
    const expansion = options.expansions[key];
    if (expansion === "all") return;
    const lineCount = Math.max(block.oldLines.length, block.newLines.length);
    const hasChangeBefore = index > 0;
    const hasChangeAfter = index < blocks.length - 1;
    const start = (hasChangeBefore ? context : 0) + (expansion?.above ?? 0);
    const end = lineCount - (hasChangeAfter ? context : 0) - (expansion?.below ?? 0);
    if (end - start >= MINIMUM_HIDDEN_LINES) ranges.set(block.id, { key, start, end });
  });
  return ranges;
}

export function countHiddenLines(ranges: ReadonlyMap<string, HiddenRange> | null | undefined, blockId: string): number {
  const range = ranges?.get(blockId);
  return range ? range.end - range.start : 0;
}

export interface CollapsedRowInfo {
  key: string;
  hiddenCount: number;
  oldStartLine: number | null;
  oldEndLine: number | null;
  newStartLine: number | null;
  newEndLine: number | null;
  isAtStart: boolean;
  isAtEnd: boolean;
}

export function getCollapsedRowInfo(block: ChangeBlock, range: HiddenRange, isAtStart: boolean, isAtEnd: boolean): CollapsedRowInfo {
  const lineAt = (lines: ChangeBlock["oldLines"], index: number) => lines[index]?.lineNumber ?? null;
  const oldEnd = Math.min(range.end, block.oldLines.length) - 1;
  const newEnd = Math.min(range.end, block.newLines.length) - 1;
  return {
    key: range.key,
    hiddenCount: range.end - range.start,
    oldStartLine: lineAt(block.oldLines, range.start),
    oldEndLine: oldEnd >= range.start ? lineAt(block.oldLines, oldEnd) : null,
    newStartLine: lineAt(block.newLines, range.start),
    newEndLine: newEnd >= range.start ? lineAt(block.newLines, newEnd) : null,
    isAtStart,
    isAtEnd
  };
}
