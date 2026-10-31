import { describe, expect, it } from "vitest";
import { BlockType, DiffChangeType } from "@/features/compare/text/types/diff";
import { PrecisionLevel } from "@/types/settings";
import { ComparisonService } from "./comparisonService";
import { calculateStats } from "@/features/compare/text/utils/diffHelpers";

const modes = [
  { precision: PrecisionLevel.Word, ignoreWhitespace: false },
  { precision: PrecisionLevel.Word, ignoreWhitespace: true },
  { precision: PrecisionLevel.Character, ignoreWhitespace: false },
  { precision: PrecisionLevel.Character, ignoreWhitespace: true }
];
const compare = (old: string, next: string, mode = modes[0], ignoreCase = true) =>
  ComparisonService.compare(old, next, { ...mode, ignoreCase });
const changed = (old: string, next: string, mode = modes[0], ignoreCase = true) =>
  compare(old, next, mode, ignoreCase).blocks.filter((block) => block.kind !== BlockType.Unchanged);
const highlighted = (fragments: Array<{ kind: DiffChangeType; text: string }>, kind: DiffChangeType) =>
  fragments.filter((fragment) => fragment.kind === kind).map((fragment) => fragment.text).join("");

describe("ignore case", () => {
  it.each(modes)("treats case-only differences as unchanged in $precision mode, whitespace $ignoreWhitespace", (mode) => {
    const pairs: Array<[string, string]> = [
      ["Hello World", "hello world"],
      ["ÁRVÍZTŰRŐ TÜKÖRFÚRÓGÉP", "árvíztűrő tükörfúrógép"],
      ["ŐSZ ÉS Ű", "ősz és ű"],
      ["ΟΔΟΣ", "οδοσ"],
      ["Straße 👍", "STRASSE 👍".toLowerCase().replace("ss", "ß")]
    ];
    for (const [old, next] of pairs) {
      expect(changed(old, next, mode)).toHaveLength(0);
      expect(changed(old, next, mode, false).length).toBeGreaterThan(0);
    }
  });

  it("keeps the original text and highlights only the real change", () => {
    const [block] = changed("The Quick brown fox", "the quick BROWN cat");
    expect(block.oldLines[0].fragments.map((fragment) => fragment.text).join("")).toBe("The Quick brown fox");
    expect(block.newLines[0].fragments.map((fragment) => fragment.text).join("")).toBe("the quick BROWN cat");
    expect(highlighted(block.oldLines[0].fragments, DiffChangeType.Deleted)).toBe("fox");
    expect(highlighted(block.newLines[0].fragments, DiffChangeType.Inserted)).toBe("cat");
  });

  it("keeps length-changing lowercase mappings aligned to the source text", () => {
    const [block] = changed("İstanbul AB", "i̇stanbul XY", modes[2]);
    expect(block.oldLines[0].fragments.map((fragment) => fragment.text).join("")).toBe("İstanbul AB");
    expect(highlighted(block.oldLines[0].fragments, DiffChangeType.Deleted)).toBe("AB");
    expect(highlighted(block.newLines[0].fragments, DiffChangeType.Inserted)).toBe("XY");
  });

  it("does not treat full case folding pairs as equal", () => {
    expect(changed("Straße", "STRASSE")).toHaveLength(1);
  });

  it("still reports line ending differences when whitespace is not ignored", () => {
    expect(changed("Alpha\r\nbeta", "alpha\nBETA").length).toBeGreaterThan(0);
    expect(changed("Alpha\r\nbeta", "alpha\nBETA", modes[1])).toHaveLength(0);
  });

  it("matches character hunks across lines with folded keys", () => {
    const result = compare("const Value = Compute(1);\nreturn Value;", "const value =\n  compute(2);\nreturn value;\nexit();", modes[2]);
    const lines = result.blocks.flatMap((block) => block.oldLines);
    expect(lines.map((line) => line.fragments.map((fragment) => fragment.text).join("")).join("\n")).toBe("const Value = Compute(1);\nreturn Value;");
    const deleted = lines.flatMap((line) => line.fragments).filter((fragment) => fragment.kind === DiffChangeType.Deleted).map((fragment) => fragment.text).join("");
    expect(deleted).not.toMatch(/V|C/);
  });

  it("detects moved sections that differ only in case", () => {
    const section = "function Alpha() {\n  return computeAlphaValue(1);\n}";
    const middle = "middle one\nmiddle two\nmiddle three\nmiddle four";
    const old = `intro line\n${section}\n${middle}\nend line`;
    const next = `intro line\n${middle}\n${section.toUpperCase()}\nend line`;
    expect(compare(old, next).blocks.filter((block) => block.move).map((block) => block.move!.modified)).toEqual([false, false]);
    expect(compare(old, next, modes[0], false).blocks.some((block) => block.move)).toBe(false);
  });

  it("counts only real changes", () => {
    const result = compare("A\nB\nC\nD", "a\nb\nX\nd");
    expect(calculateStats(result.blocks)).toEqual({ removals: 1, additions: 1 });
  });
});
