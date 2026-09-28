import { describe, expect, it } from "vitest";
import { BlockType, DiffChangeType } from "@/features/compare/text/types/diff";
import { PrecisionLevel } from "@/types/settings";
import { MergeDirection } from "@/types/ui";
import { ComparisonService } from "./comparisonService";
import { MergeService } from "./mergeService";
import { calculateStats } from "@/features/compare/text/utils/diffHelpers";
import { modifiedTestText, originalTestText } from "@/utils/testData";
import { legacyModifiedLorem, legacyOriginalLorem } from "./fixtures/legacyLorem";
import { calculateSplitRows } from "@/features/compare/text/hooks/useCalculateSplitRows";

const compare = (old: string, next: string, ignoreWhitespace = false, precision = PrecisionLevel.Word) =>
  ComparisonService.compare(old, next, { ignoreWhitespace, precision });
const active = (old: string, next: string, ignoreWhitespace = false) =>
  compare(old, next, ignoreWhitespace).blocks.filter((block) => block.kind !== BlockType.Unchanged);

describe("text comparison", () => {
  it("preserves the published lorem comparison as a regression baseline", () => {
    const result = compare(legacyOriginalLorem, legacyModifiedLorem);
    expect(calculateStats(result.blocks)).toEqual({ removals: 21, additions: 17 });
    expect(result.blocks.filter((block) => block.kind !== BlockType.Unchanged).every((block) => !block.move)).toBe(true);
    const changedLines = result.blocks.filter((block) => block.kind === BlockType.Modified);
    expect(changedLines.some((block) => block.oldLines.some((line) => line.lineNumber === 9) &&
      block.newLines.some((line) => line.lineNumber === 5))).toBe(true);
    expect(changedLines.some((block) => block.oldLines.some((line) => line.lineNumber === 19) &&
      block.newLines.some((line) => line.lineNumber === 16))).toBe(true);
    const rows = calculateSplitRows(result).filter((row) => row.type === "line");
    const linePairs = rows.map((row) => [row.block.oldLines[row.oldIndex]?.lineNumber ?? null,
      row.block.newLines[row.newIndex]?.lineNumber ?? null]);
    expect(linePairs).toContainEqual([9, 5]);
    expect(linePairs).toContainEqual([11, 10]);
    expect(linePairs).toContainEqual([19, 13]);
    expect(linePairs.indexOf(linePairs.find((pair) => pair[0] === 19)!)).toBeLessThan(
      linePairs.indexOf(linePairs.find((pair) => pair[1] === 14)!));
    const oldLine = (number: number) => result.blocks.flatMap((block) => block.oldLines)
      .find((line) => line.lineNumber === number)!;
    const newLine = (number: number) => result.blocks.flatMap((block) => block.newLines)
      .find((line) => line.lineNumber === number)!;
    const changedText = (line: ReturnType<typeof oldLine>, kind: DiffChangeType) => line.fragments
      .filter((fragment) => fragment.kind === kind).map((fragment) => fragment.text).join("");
    expect(changedText(oldLine(4), DiffChangeType.Deleted)).toBe("");
    expect(changedText(oldLine(9), DiffChangeType.Deleted)).toBe("\tInenim(porelementumsemper())");
    expect(changedText(oldLine(16), DiffChangeType.Deleted)).toBe("(vel augue.)");
    expect(changedText(oldLine(19), DiffChangeType.Deleted)).toBe("tramba");
    expect(changedText(newLine(16), DiffChangeType.Inserted)).toBe("tellus");
    expect(changedText(newLine(20), DiffChangeType.Inserted)).toBe("");
  });

  it("keeps stable character spans across changed line boundaries", () => {
    const result = compare(legacyOriginalLorem, legacyModifiedLorem, false, PrecisionLevel.Character);
    const oldNine = result.blocks.flatMap((block) => block.oldLines).find((line) => line.lineNumber === 9)!;
    const newEight = result.blocks.flatMap((block) => block.newLines).find((line) => line.lineNumber === 8)!;
    const oldSixteen = result.blocks.flatMap((block) => block.oldLines).find((line) => line.lineNumber === 16)!;
    const newTen = result.blocks.flatMap((block) => block.newLines).find((line) => line.lineNumber === 10)!;
    expect(oldNine.fragments.map((fragment) => fragment.text).join("")).toBe("\tInenim(porelementumsemper())");
    expect(oldNine.fragments.filter((fragment) => fragment.kind === DiffChangeType.Deleted).map((fragment) => fragment.text).join("")).toBe("\t");
    expect(newEight.fragments.filter((fragment) => fragment.kind === DiffChangeType.Inserted).map((fragment) => fragment.text).join("")).toBe("\tVivamus  nisi.");
    expect(oldSixteen.fragments.filter((fragment) => fragment.kind === DiffChangeType.Deleted).map((fragment) => fragment.text).join("")).toBe("\tvelaugue");
    expect(newTen.fragments.filter((fragment) => fragment.kind === DiffChangeType.Inserted).map((fragment) => fragment.text).join("")).toBe("porguband");
    expect(calculateStats(result.blocks)).toEqual({ removals: 15, additions: 12 });
    expect(compare(legacyOriginalLorem, legacyModifiedLorem, true, PrecisionLevel.Character).blocks
      .filter((block) => block.kind !== BlockType.Unchanged)).toHaveLength(4);
    expect(compare(legacyOriginalLorem, legacyModifiedLorem, true, PrecisionLevel.Word).blocks
      .filter((block) => block.kind !== BlockType.Unchanged)).toHaveLength(4);
    expect(calculateStats(compare(legacyOriginalLorem, legacyModifiedLorem, true, PrecisionLevel.Word).blocks))
      .toEqual({ removals: 18, additions: 14 });
    const ignoredWord = compare(legacyOriginalLorem, legacyModifiedLorem, true, PrecisionLevel.Word);
    const oldNineteen = ignoredWord.blocks.flatMap((block) => block.oldLines).find((line) => line.lineNumber === 19)!;
    const newSixteen = ignoredWord.blocks.flatMap((block) => block.newLines).find((line) => line.lineNumber === 16)!;
    expect(oldNineteen.fragments.filter((fragment) => fragment.kind === DiffChangeType.Deleted)
      .map((fragment) => fragment.text).join("")).toBe("tramba");
    expect(newSixteen.fragments.filter((fragment) => fragment.kind === DiffChangeType.Inserted)
      .map((fragment) => fragment.text).join("")).toBe("tellus");
    const ignoredCharacter = compare(legacyOriginalLorem, legacyModifiedLorem, true, PrecisionLevel.Character);
    expect(calculateStats(ignoredCharacter.blocks)).toEqual({ removals: 12, additions: 9 });
    const ignoredOldNine = ignoredCharacter.blocks.flatMap((block) => block.oldLines).find((line) => line.lineNumber === 9)!;
    expect(ignoredOldNine.fragments).toEqual([{ kind: DiffChangeType.Unchanged, text: "\tInenim(porelementumsemper())" }]);
  });

  it("makes whitespace-only lines neutral without losing the original text", () => {
    const old = "  value = 1;\r\nnext\r\n";
    const next = "\tvalue  =  1;\n\nnext\n";
    const result = compare(old, next, true);
    expect(result.blocks.every((block) => block.kind === BlockType.Unchanged)).toBe(true);
    expect(result.blocks.flatMap((block) => block.oldLines).map((line) => line.fragments.map((fragment) => fragment.text).join(""))).toEqual(["  value = 1;", "next"]);
    expect(result.blocks.flatMap((block) => block.newLines).map((line) => line.fragments.map((fragment) => fragment.text).join(""))).toEqual(["\tvalue  =  1;", "", "next"]);
  });

  it("matches Diffchecker's whitespace hiding while retaining content changes", () => {
    expect(active("foo bar", "foobar", true)).toHaveLength(0);
    expect(active("foo\nbar\n", "foobar\n", true).length).toBeGreaterThan(0);
    expect(active("value = 1", "value = 2", true)).toHaveLength(1);
    expect(active("a\n", "a\n\n", true)).toHaveLength(0);
  });

  it("counts a paired modified row on both sides in word mode", () => {
    const block = active("foo bar\n", "foobar\n")[0];
    expect(calculateStats(compare("foo bar\n", "foobar\n").blocks)).toEqual({ removals: 1, additions: 1 });
    expect(block.oldLines[0].fragments.filter((fragment) => fragment.kind === DiffChangeType.Deleted).map((fragment) => fragment.text).join("")).toBe("foo bar");
    expect(block.newLines[0].fragments.filter((fragment) => fragment.kind === DiffChangeType.Inserted).map((fragment) => fragment.text).join("")).toBe("foobar");
    expect(calculateStats(compare("foo\nbar\n", "foobar\n", true).blocks)).toEqual({ removals: 2, additions: 2 });
  });

  it("keeps whitespace neutral inside a line with a content edit", () => {
    const block = active("  value = 1;", "\tvalue  = 2;", true)[0];
    expect(block.oldLines[0].fragments.filter((fragment) => fragment.kind === DiffChangeType.Deleted).map((fragment) => fragment.text).join("")).toBe("1");
    expect(block.newLines[0].fragments.filter((fragment) => fragment.kind === DiffChangeType.Inserted).map((fragment) => fragment.text).join("")).toBe("2");
  });

  it("projects character edits through removed whitespace without highlighting it", () => {
    const result = compare("foo bar1", "foobar2", true, PrecisionLevel.Character);
    const block = result.blocks.find((item) => item.kind !== BlockType.Unchanged)!;
    expect(block.oldLines[0].fragments.map((fragment) => fragment.text).join("")).toBe("foo bar1");
    expect(block.newLines[0].fragments.map((fragment) => fragment.text).join("")).toBe("foobar2");
    expect(block.oldLines[0].fragments.filter((fragment) => fragment.kind === DiffChangeType.Deleted).map((fragment) => fragment.text).join("")).toBe("1");
    expect(block.newLines[0].fragments.filter((fragment) => fragment.kind === DiffChangeType.Inserted).map((fragment) => fragment.text).join("")).toBe("2");
  });

  it("keeps cross-line whitespace neutral and reconstructs both sides in character mode", () => {
    const old = "header\n  alpha beta\ngamma\nfooter\n";
    const next = "header\n\talpha\n beta delta\ngamma\nfooter\n";
    const result = compare(old, next, true, PrecisionLevel.Character);
    const changed = result.blocks.filter((block) => block.kind !== BlockType.Unchanged);
    expect(changed).toHaveLength(1);
    expect(changed[0].oldLines.map((line) => line.fragments.map((fragment) => fragment.text).join(""))).toEqual(["  alpha beta"]);
    expect(changed[0].newLines.map((line) => line.fragments.map((fragment) => fragment.text).join(""))).toEqual(["\talpha", " beta delta"]);
    expect(changed[0].oldLines.flatMap((line) => line.fragments)
      .filter((fragment) => fragment.kind === DiffChangeType.Deleted).map((fragment) => fragment.text).join("")).toBe("");
    expect(changed[0].newLines.flatMap((line) => line.fragments)
      .filter((fragment) => fragment.kind === DiffChangeType.Inserted).map((fragment) => fragment.text).join("")).toBe("delta");
    expect(MergeService.mergeBlock(next, old, changed[0], MergeDirection.LeftToRight)).toBe(old);
  });

  it("merges original source slices including CRLF and missing terminal newline", () => {
    const old = "one\r\ntwo\r\nthree";
    const next = "one\nTWO\nthree\n";
    const blocks = active(old, next);
    let merged = next;
    for (const block of [...blocks].reverse()) merged = MergeService.mergeBlock(merged, old, block, MergeDirection.LeftToRight);
    expect(merged).toBe(old);
  });

  it("shows a line-ending-only change while keeping both source formats", () => {
    const block = active("same\r\n", "same\n")[0];
    expect(block.kind).toBe(BlockType.Modified);
    expect(block.oldLines[0].lineEndingLabel).toBe("CRLF");
    expect(block.newLines[0].lineEndingLabel).toBe("LF");
    expect(MergeService.mergeBlock("same\n", "same\r\n", block, MergeDirection.LeftToRight)).toBe("same\r\n");
  });

  it("preserves Unicode graphemes and reconstructs highlighted lines", () => {
    const old = "const café = '👨‍👩‍👧';";
    const next = "const café = '👨‍👩‍👦';";
    const block = compare(old, next, false, PrecisionLevel.Character).blocks.find((item) => item.kind !== BlockType.Unchanged)!;
    expect(block.oldLines[0].fragments.map((fragment) => fragment.text).join("")).toBe(old);
    expect(block.newLines[0].fragments.map((fragment) => fragment.text).join("")).toBe(next);
    expect(block.oldLines[0].fragments.some((fragment) => fragment.kind === DiffChangeType.Deleted)).toBe(true);
  });

  it("links a distinctive relocated section without changing addition and removal counts", () => {
    const moved = "function total(items) {\n  return items.reduce((sum, item) => sum + item, 0);\n}\n";
    const old = `const header = 1;\n${moved}const middle = 2;\nconst footer = 3;\n`;
    const next = `const header = 1;\nconst middle = 2;\nconst footer = 3;\n${moved}`;
    const blocks = active(old, next);
    expect(blocks.filter((block) => block.move?.role === "from")).toHaveLength(1);
    expect(blocks.filter((block) => block.move?.role === "to")).toHaveLength(1);
    expect(blocks.filter((block) => block.move).every((block) => !block.move?.modified)).toBe(true);
  });

  it("adds an independent moved section without changing either published lorem input", () => {
    expect(originalTestText.endsWith(legacyOriginalLorem)).toBe(true);
    const addedSection = originalTestText.slice(0, -legacyOriginalLorem.length);
    expect(modifiedTestText.replace(addedSection, "")).toBe(legacyModifiedLorem);
    for (const ignoreWhitespace of [false, true]) for (const precision of [PrecisionLevel.Word, PrecisionLevel.Character]) {
      const blocks = compare(originalTestText, modifiedTestText, ignoreWhitespace, precision).blocks;
      const moved = blocks.filter((block) => block.move);
      expect(moved).toHaveLength(2);
      expect(moved.map((block) => block.move?.role).sort()).toEqual(["from", "to"]);
      expect(moved.every((block) => block.move?.modified === false)).toBe(true);
      expect(moved[0].move?.counterpartBlockId).toBe(moved[1].id);
      expect(moved[1].move?.counterpartBlockId).toBe(moved[0].id);
      expect(moved.every((block) => block.move?.number === 1)).toBe(true);
      expect(moved.find((block) => block.move?.role === "from")?.oldLines
        .map((line) => line.fragments.map((fragment) => fragment.text).join(""))).toContain("Sed fringilla mauris sit amet nibh.");
    }
  });

  it("does not label duplicated or short braces as moves", () => {
    expect(active("}\n}\nalpha\n", "alpha\n}\n}\n").some((block) => block.move)).toBe(false);
  });

  it("links a unique edited relocation when two substantive lines remain intact", () => {
    const old = "header\nfunction total(items) {\n  const values = items.filter(Boolean);\n  return values.length;\n}\nanchor one\nanchor two\nanchor three\n";
    const next = "header\nanchor one\nanchor two\nanchor three\nfunction total(items) {\n  const values = items.filter(Boolean);\n  return values.length + 1;\n}\n";
    const blocks = active(old, next);
    expect(blocks.some((block) => block.move?.modified)).toBe(true);
    expect(active(old, next, true).some((block) => block.move?.modified)).toBe(true);
  });

  it("uses a visible coarse result for a very long changed line while keeping merge exact", () => {
    const old = "a".repeat(60_000) + "X\r\n";
    const next = "a".repeat(60_000) + "Y\n";
    const result = compare(old, next);
    expect(result.limited).toBe(true);
    expect(result.blocks.filter((block) => block.kind !== BlockType.Unchanged)).toHaveLength(1);
    expect(MergeService.mergeBlock(next, old, result.blocks[0], MergeDirection.LeftToRight)).toBe(old);
  });

  it("keeps a complete coarse merge for repeated-line stress", () => {
    const old = Array(1_000).fill("old repeated line").join("\n");
    const next = Array(1_000).fill("new repeated line").join("\n");
    const result = compare(old, next);
    expect(result.limited).toBe(true);
    const block = result.blocks.find((item) => item.kind !== BlockType.Unchanged)!;
    expect(MergeService.mergeBlock(next, old, block, MergeDirection.LeftToRight)).toBe(old);
  });
});
