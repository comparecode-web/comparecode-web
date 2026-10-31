export class TextTransformError extends Error {}

export type TextTransformId = "lowercase" | "sort-lines" | "join-lines" | "trim-whitespace";

interface LineParts {
  contents: string[];
  endings: string[];
}

function splitWithEndings(text: string): LineParts {
  const contents: string[] = [];
  const endings: string[] = [];
  let start = 0;
  for (const match of text.matchAll(/\r\n|\r|\n/gu)) {
    contents.push(text.slice(start, match.index));
    endings.push(match[0]);
    start = match.index + match[0].length;
  }
  if (start < text.length) {
    contents.push(text.slice(start));
    endings.push("");
  }
  return { contents, endings };
}

function dominantEnding(endings: string[]): string {
  const counts = new Map<string, number>();
  for (const ending of endings) if (ending) counts.set(ending, (counts.get(ending) ?? 0) + 1);
  let best = "\n", bestCount = 0;
  for (const [ending, count] of counts) {
    if (count > bestCount) {
      best = ending;
      bestCount = count;
    }
  }
  return best;
}

export function toLowercase(text: string): string {
  return text.toLowerCase();
}

export function trimWhitespace(text: string): string {
  const { contents, endings } = splitWithEndings(text);
  return contents.map((content, index) => content.trim() + endings[index]).join("");
}

export function sortLines(text: string, locale?: string): string {
  if (!text) return text;
  const { contents, endings } = splitWithEndings(text);
  const ending = dominantEnding(endings);
  const hasFinalLineEnding = endings[endings.length - 1] !== "";
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "variant" });
  const sorted = [...contents].sort(collator.compare);
  return sorted.join(ending) + (hasFinalLineEnding ? ending : "");
}

export function joinLines(text: string): string {
  return text.replace(/(?:\r\n|\r|\n)+$/u, "").replace(/\r\n|\r|\n/gu, " ");
}

export const TEXT_TRANSFORMS: Record<TextTransformId, (text: string) => string> = {
  "lowercase": toLowercase,
  "sort-lines": (text) => sortLines(text),
  "join-lines": joinLines,
  "trim-whitespace": trimWhitespace
};
