import { describe, expect, it } from "vitest";
import { PrecisionLevel } from "@/types/settings";
import { ComparisonService } from "@/features/compare/text/services/comparisonService";
import { BlockType } from "@/features/compare/text/types/diff";
import { getHiddenRanges, getUnchangedKey, MINIMUM_HIDDEN_LINES } from "../unchangedRegions";
import { calculateSplitRows } from "@/features/compare/text/hooks/useCalculateSplitRows";
import { calculateUnifiedRows } from "@/features/compare/text/hooks/useCalculateUnifiedRows";

const lines = (count: number, prefix = "line") => Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}`);
const compare = (old: string[], next: string[], ignoreWhitespace = false) =>
  ComparisonService.compare(old.join("\n"), next.join("\n"), { ignoreWhitespace, precision: PrecisionLevel.Word });

function withChanges(count: number, changed: number[]) {
  const old = lines(count);
  const next = old.map((line, index) => changed.includes(index + 1) ? `${line} changed` : line);
  return compare(old, next);
}

describe("unchanged regions", () => {
  it("keeps context around a change and hides the rest at the file edges", () => {
    const result = withChanges(60, [30]);
    const ranges = getHiddenRanges(result.blocks, { contextLines: 3, expansions: {} });
    const [first, , last] = result.blocks;
    expect(ranges.get(first.id)).toMatchObject({ start: 0, end: 26 });
    expect(ranges.get(last.id)).toMatchObject({ start: 3, end: 30 });
  });

  it("hides the middle of a block between two changes", () => {
    const result = withChanges(60, [10, 50]);
    const middle = result.blocks[2];
    expect(middle.kind).toBe(BlockType.Unchanged);
    expect(getHiddenRanges(result.blocks, { contextLines: 5, expansions: {} }).get(middle.id)).toMatchObject({ start: 5, end: 34 });
  });

  it("does not hide fewer than the minimum number of lines", () => {
    const result = withChanges(20, [5, 5 + 6 + MINIMUM_HIDDEN_LINES]);
    const middle = result.blocks[2];
    expect(Math.max(middle.oldLines.length, middle.newLines.length)).toBe(6 + MINIMUM_HIDDEN_LINES - 1);
    expect(getHiddenRanges(result.blocks, { contextLines: 3, expansions: {} }).has(middle.id)).toBe(false);
    const wider = withChanges(20, [5, 5 + 7 + MINIMUM_HIDDEN_LINES]);
    expect(getHiddenRanges(wider.blocks, { contextLines: 3, expansions: {} }).get(wider.blocks[2].id)).toMatchObject({ start: 3, end: 6 });
  });

  it("supports zero context lines", () => {
    const result = withChanges(30, [15]);
    const ranges = getHiddenRanges(result.blocks, { contextLines: 0, expansions: {} });
    expect(ranges.get(result.blocks[0].id)).toMatchObject({ start: 0, end: 14 });
    expect(ranges.get(result.blocks[2].id)).toMatchObject({ start: 0, end: 15 });
  });

  it("applies partial and complete expansions by stable key", () => {
    const result = withChanges(100, [50]);
    const [first, , last] = result.blocks;
    const ranges = getHiddenRanges(result.blocks, {
      contextLines: 3,
      expansions: { [getUnchangedKey(first)]: { above: 20, below: 20 }, [getUnchangedKey(last)]: "all" }
    });
    expect(ranges.get(first.id)).toMatchObject({ start: 20, end: 26 });
    expect(ranges.has(last.id)).toBe(false);
    const overExpanded = getHiddenRanges(result.blocks, { contextLines: 3, expansions: { [getUnchangedKey(first)]: { above: 40, below: 20 } } });
    expect(overExpanded.has(first.id)).toBe(false);
  });

  it("hides nothing when there are no changes", () => {
    const same = compare(lines(50), lines(50));
    expect(getHiddenRanges(same.blocks, { contextLines: 3, expansions: {} }).size).toBe(0);
    const whitespaceOnly = compare(lines(50), lines(50).map((line) => `  ${line}`), true);
    expect(whitespaceOnly.blocks.every((block) => block.kind === BlockType.Unchanged)).toBe(true);
    expect(getHiddenRanges(whitespaceOnly.blocks, { contextLines: 3, expansions: {} }).size).toBe(0);
  });

  it("handles unchanged blocks with unequal sides under ignore whitespace", () => {
    const old = [...lines(30), "tail changed"];
    const next = [...lines(10), "   ", ...lines(30).slice(10), "tail"];
    const result = compare(old, next, true);
    const block = result.blocks[0];
    expect(block.oldLines.length).not.toBe(block.newLines.length);
    const range = getHiddenRanges(result.blocks, { contextLines: 3, expansions: {} }).get(block.id)!;
    expect(range).toMatchObject({ start: 0, end: Math.max(block.oldLines.length, block.newLines.length) - 3 });
    const rows = calculateSplitRows(result, getHiddenRanges(result.blocks, { contextLines: 3, expansions: {} }));
    expect(rows.filter((row) => row.type === "collapsed")).toHaveLength(1);
    expect(rows.filter((row) => row.type === "line" && row.block.id === block.id)).toHaveLength(3);
  });

  it("collapses split and unified rows in the same way and leaves changed blocks visible", () => {
    const result = withChanges(200, [40, 160]);
    const ranges = getHiddenRanges(result.blocks, { contextLines: 3, expansions: {} });
    const split = calculateSplitRows(result, ranges);
    const unified = calculateUnifiedRows(result, ranges);
    const visible = (rows: Array<{ type: string }>) => rows.filter((row) => row.type === "line").length;
    expect(split.filter((row) => row.type === "collapsed")).toHaveLength(3);
    expect(unified.filter((row) => row.type === "collapsed")).toHaveLength(3);
    expect(visible(split)).toBe(3 + 1 + 6 + 1 + 3);
    expect(visible(unified)).toBe(3 + 2 + 6 + 2 + 3);
    const collapsed = split.find((row) => row.type === "collapsed")!;
    expect(collapsed.collapsed).toMatchObject({ hiddenCount: 36, oldStartLine: 1, oldEndLine: 36, newStartLine: 1, newEndLine: 36, isAtStart: true });
    expect(calculateSplitRows(result).some((row) => row.type === "collapsed")).toBe(false);
  });
});
