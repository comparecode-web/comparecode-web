import { PrecisionLevel } from "@/types/settings";

export interface Token {
  text: string;
  start: number;
  end: number;
  category: "word" | "space" | "punctuation";
}

const wordCharacter = /[\p{L}\p{N}\p{M}_]/u;

function classify(text: string): Token["category"] {
  return /^\s+$/u.test(text) ? "space" : wordCharacter.test(text) ? "word" : "punctuation";
}

export function tokenize(text: string, precision: PrecisionLevel): Token[] {
  if (!text) return [];
  const granularity = precision === PrecisionLevel.Character ? "grapheme" : "word";
  const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity }) : null;
  const segments = segmenter
    ? Array.from(segmenter.segment(text), ({ segment, index }) => ({ text: segment, start: index }))
    : Array.from(text.matchAll(precision === PrecisionLevel.Character
      ? /\p{Regional_Indicator}{2}|\P{M}(?:\p{M}|\p{Emoji_Modifier})*(?:\u200D\P{M}(?:\p{M}|\p{Emoji_Modifier})*)*|\p{M}+/gu
      : /\s+|[\p{L}\p{N}\p{M}_]+|[^\s\p{L}\p{N}\p{M}_]/gu),
      (match) => ({ text: match[0], start: match.index }));
  const result: Token[] = [];
  for (const segment of segments) {
    const category = classify(segment.text);
    if (precision === PrecisionLevel.Word && category === "punctuation" && segment.text.length > 1) {
      for (const match of segment.text.matchAll(/./gu)) {
        const start = segment.start + match.index;
        result.push({ text: match[0], start, end: start + match[0].length, category });
      }
    } else if (precision === PrecisionLevel.Word && category === "space" && result.at(-1)?.category === "space") {
      result[result.length - 1].text += segment.text;
      result[result.length - 1].end = segment.start + segment.text.length;
    } else {
      result.push({ text: segment.text, start: segment.start, end: segment.start + segment.text.length, category });
    }
  }
  return result;
}

export function tokenizeWhitespaceDelimited(text: string): Token[] {
  return Array.from(text.matchAll(/\s+|\S+/gu), (match) => ({
    text: match[0],
    start: match.index,
    end: match.index + match[0].length,
    category: /^\s+$/u.test(match[0]) ? "space" as const : "word" as const
  }));
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n|\r/gu, "\n").replace(/[^\S\n]+/gu, "");
}
