import { describe, expect, it } from "vitest";
import { PrecisionLevel } from "@/types/settings";
import { tokenize, tokenizeWhitespaceDelimited } from "./tokenize";

describe("Unicode tokenization", () => {
  it("keeps punctuation with a word in legacy word precision", () => {
    const text = "(vel augue.)\tEtiam";
    expect(tokenizeWhitespaceDelimited(text).map((token) => token.text)).toEqual(["(vel", " ", "augue.)", "\t", "Etiam"]);
  });

  it("keeps source offsets and punctuation boundaries", () => {
    const text = "return subtotal * 2; magyar 👨‍👩‍👧";
    const tokens = tokenize(text, PrecisionLevel.Word);
    expect(tokens.map((token) => token.text).join("")).toBe(text);
    expect(tokens.every((token) => text.slice(token.start, token.end) === token.text)).toBe(true);
    expect(tokens.some((token) => token.text === "*")).toBe(true);
  });

  it("keeps emoji and combining marks together when Segmenter is unavailable", () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl, "Segmenter");
    Object.defineProperty(Intl, "Segmenter", { configurable: true, value: undefined });
    try {
      const text = "é 👨‍👩‍👧 🇭🇺";
      expect(tokenize(text, PrecisionLevel.Character).map((token) => token.text)).toEqual(["é", " ", "👨‍👩‍👧", " ", "🇭🇺"]);
    } finally {
      if (descriptor) Object.defineProperty(Intl, "Segmenter", descriptor);
    }
  });
});
