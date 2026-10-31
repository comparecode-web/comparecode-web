import { describe, expect, it } from "vitest";
import { BlockType, DiffChangeType, TextFragment } from "@/features/compare/text/types/diff";
import { IgnoreRule, PrecisionLevel } from "@/types/settings";
import { ComparisonService } from "./comparisonService";
import { calculateStats } from "@/features/compare/text/utils/diffHelpers";
import { activeIgnorePatterns, findLiteralRanges } from "./diff/comparisonNormalizer";

const modes = [
  { precision: PrecisionLevel.Word, ignoreWhitespace: false },
  { precision: PrecisionLevel.Word, ignoreWhitespace: true },
  { precision: PrecisionLevel.Character, ignoreWhitespace: false },
  { precision: PrecisionLevel.Character, ignoreWhitespace: true }
];
const rule = (pattern: string, overrides: Partial<IgnoreRule> = {}): IgnoreRule => ({ id: pattern, pattern, kind: "literal", isEnabled: true, ...overrides });
const compare = (old: string, next: string, rules: IgnoreRule[], mode = modes[0], ignoreCase = false) =>
  ComparisonService.compare(old, next, { ...mode, ignoreCase, ignoreRules: rules });
const text = (fragments: TextFragment[]) => fragments.map((fragment) => fragment.text).join("");
const highlighted = (fragments: TextFragment[], kind: DiffChangeType) => fragments.filter((fragment) => fragment.kind === kind).map((fragment) => fragment.text).join("");

const pad = (value: number) => String(value).padStart(2, "0");
const logOld = Array.from({ length: 60 }, (_, index) => `line ${index + 1} Value=${index} ts=2026-10-29T10:${pad(index)}`);
const logNew = logOld.map((line) => line.replace("29T10", "30T11"));
logNew[29] = "line 30 VALUE=999 changed ts=2026-10-30T11:29";
logNew[4] = "LINE 5 Value=4 ts=2026-10-30T11:04";

describe("custom ignore rules", () => {
  it("finds literal ranges, merges overlaps, and maps case-insensitive matches to source offsets", () => {
    expect(findLiteralRanges("abcabc", ["bc"], false)).toEqual([[1, 3], [4, 6]]);
    expect(findLiteralRanges("abcdef", ["bcd", "cde", "a"], false)).toEqual([[0, 5]]);
    expect(findLiteralRanges("aaaa", ["aa"], false)).toEqual([[0, 4]]);
    expect(findLiteralRanges("abXcd", ["ab", "cd"], false)).toEqual([[0, 2], [3, 5]]);
    expect(findLiteralRanges("İstanbul TS", ["İSTANBUL", "ts"], true)).toEqual([[0, 8], [9, 11]]);
    expect(findLiteralRanges("xİstanbul", ["istanbul"], true)).toEqual([]);
    expect(findLiteralRanges("Value", ["value"], false)).toEqual([]);
    expect(activeIgnorePatterns([rule(""), rule("a", { isEnabled: false }), rule("b", { kind: "regex" }), rule("c"), rule("c", { id: "other" })])).toEqual(["c"]);
  });

  it.each(modes)("ignores repeating timestamps in a log in $precision mode, whitespace $ignoreWhitespace", (mode) => {
    const result = compare(logOld.join("\n"), logNew.join("\n"), [rule("29T10"), rule("30T11")], mode);
    const changed = result.blocks.filter((block) => block.kind !== BlockType.Unchanged);
    expect(changed.map((block) => block.oldLines[0].lineNumber)).toEqual([5, 30]);
    expect(compare(logOld.join("\n"), logNew.join("\n"), [], mode).blocks.filter((block) => block.kind !== BlockType.Unchanged).length).toBe(1);
  });

  it("shows ignored text without highlighting it", () => {
    const [block] = compare("id=111 name=Ann", "id=222 name=Bob", [rule("111"), rule("222")]).blocks.filter((block) => block.kind !== BlockType.Unchanged);
    expect(text(block.oldLines[0].fragments)).toBe("id=111 name=Ann");
    expect(highlighted(block.oldLines[0].fragments, DiffChangeType.Deleted)).not.toContain("111");
    expect(highlighted(block.newLines[0].fragments, DiffChangeType.Inserted)).not.toContain("222");
    const [character] = compare("id=111 name=Ann", "id=222 name=Bob", [rule("111"), rule("222")], modes[2]).blocks.filter((block) => block.kind !== BlockType.Unchanged);
    expect(highlighted(character.oldLines[0].fragments, DiffChangeType.Deleted)).toBe("Ann");
    expect(highlighted(character.newLines[0].fragments, DiffChangeType.Inserted)).toBe("Bob");
  });

  it("follows ignore case for rule matching", () => {
    const old = "Build BUILD-17 done", next = "Build build-42 done";
    expect(compare(old, next, [rule("build-17"), rule("build-42")], modes[0], false).blocks.some((block) => block.kind !== BlockType.Unchanged)).toBe(true);
    expect(compare(old, next, [rule("build-17"), rule("build-42")], modes[0], true).blocks.every((block) => block.kind === BlockType.Unchanged)).toBe(true);
  });

  it("treats added or removed lines that are entirely ignored as unchanged", () => {
    const result = compare("alpha\nbeta\n", "alpha\nDEBUG\nbeta\nDEBUGDEBUG\n", [rule("DEBUG")]);
    expect(result.blocks.every((block) => block.kind === BlockType.Unchanged)).toBe(true);
    expect(calculateStats(result.blocks)).toEqual({ removals: 0, additions: 0 });
    const partial = compare("alpha\nbeta", "alpha\nDEBUG x\nbeta", [rule("DEBUG")]);
    expect(calculateStats(partial.blocks)).toEqual({ removals: 0, additions: 1 });
    const emptyLine = compare("alpha\nbeta", "alpha\n\nbeta", [rule("DEBUG")]);
    expect(calculateStats(emptyLine.blocks)).toEqual({ removals: 0, additions: 1 });
  });

  it("ignores rules that are disabled, empty, or of an unknown kind", () => {
    for (const rules of [[rule("1", { isEnabled: false })], [rule("")], [rule("1", { kind: "regex" })]]) {
      expect(compare("v1", "v2", rules).blocks.some((block) => block.kind !== BlockType.Unchanged)).toBe(true);
    }
  });

  it("keeps character hunks across lines aligned when rules hide text", () => {
    const result = compare("const a = 1; // id 111\nreturn a;", "const a =\n  2; // id 222\nreturn a;\nexit();", [rule("111"), rule("222")], modes[2]);
    const oldText = result.blocks.flatMap((block) => block.oldLines).map((line) => text(line.fragments)).join("\n");
    expect(oldText).toBe("const a = 1; // id 111\nreturn a;");
    const deleted = result.blocks.flatMap((block) => block.oldLines).flatMap((line) => line.fragments)
      .filter((fragment) => fragment.kind === DiffChangeType.Deleted).map((fragment) => fragment.text).join("");
    expect(deleted).not.toContain("111");
  });

  it("detects moved sections whose ignored parts differ", () => {
    const section = (id: string) => `function alpha() { // ${id}\n  return computeAlphaValue(1);\n}`;
    const middle = "middle one\nmiddle two\nmiddle three\nmiddle four";
    const old = `intro\n${section("rev 1")}\n${middle}\nend`;
    const next = `intro\n${middle}\n${section("rev 2")}\nend`;
    expect(compare(old, next, [rule("rev 1"), rule("rev 2")]).blocks.filter((block) => block.move && !block.move.modified)).toHaveLength(2);
  });

  it("handles patterns that cover the whole line, repeat, or contain special characters", () => {
    expect(compare("a.b*c", "a.b*d", [rule(".b*")]).blocks.some((block) => block.kind !== BlockType.Unchanged)).toBe(true);
    expect(compare("x(1)", "x(2)", [rule("(1)"), rule("(2)")]).blocks.every((block) => block.kind === BlockType.Unchanged)).toBe(true);
    expect(compare("same", "same", [rule("same")]).blocks.every((block) => block.kind === BlockType.Unchanged)).toBe(true);
  });
});
