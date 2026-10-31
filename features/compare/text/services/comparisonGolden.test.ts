import { describe, expect, it } from "vitest";
import { PrecisionLevel } from "@/types/settings";
import { ComparisonService } from "./comparisonService";
import { modifiedTestText, originalTestText } from "@/utils/testData";
import { legacyModifiedLorem, legacyOriginalLorem } from "./fixtures/legacyLorem";

const fixtures: Record<string, [string, string]> = {
  "legacy lorem": [legacyOriginalLorem, legacyModifiedLorem],
  "bundled test text": [originalTestText, modifiedTestText],
  "line endings": ["alpha\r\nbeta\ngamma\rdelta", "alpha\nbeta\r\ngamma\rdelta\n"],
  "whitespace only changes": ["if (a) {\n  call( x );\n}\n\nnext", "if (a) {\n\tcall(x);\n}\n\n\n  next"],
  "unicode": ["Árvíztűrő tükörfúrógép 👍🏽\néclair 🇭🇺\nZażółć", "Árvíztűrő Tükörfúrógép 👍🏿\néclair 🇭🇺\nZażółć gęślą"],
  "moved section": [
    "intro line\nfunction alpha() {\n  return computeAlphaValue(1);\n}\nmiddle line\nend line",
    "intro line\nmiddle line\nfunction alpha() {\n  return computeAlphaValue(1);\n}\nend line"
  ],
  "unequal character hunk": ["const value = compute(1);\nreturn value;", "const result =\n  compute(2);\nreturn result;\nexit();"],
  "empty sides": ["", "only right\nside"]
};

const modes = [
  { precision: PrecisionLevel.Word, ignoreWhitespace: false },
  { precision: PrecisionLevel.Word, ignoreWhitespace: true },
  { precision: PrecisionLevel.Character, ignoreWhitespace: false },
  { precision: PrecisionLevel.Character, ignoreWhitespace: true }
];

describe("comparison golden results", () => {
  for (const [name, [original, modified]] of Object.entries(fixtures)) {
    for (const mode of modes) {
      it(`${name} (${mode.precision}, ignore whitespace ${mode.ignoreWhitespace ? "on" : "off"})`, () => {
        expect(ComparisonService.compare(original, modified, mode)).toMatchSnapshot();
      });
    }
  }
});
