import type { IgnoreRule } from "@/types/settings";
import { normalizeWhitespace } from "./tokenize";

export interface NormalizerOptions {
  ignoreWhitespace: boolean;
  ignoreCase?: boolean;
  ignoreRules?: ReadonlyArray<IgnoreRule>;
}

export interface Projection {
  text: string;
  positions: number[];
}

export type MaskRange = readonly [start: number, end: number];

const NO_RANGES: ReadonlyArray<MaskRange> = [];

export function foldCase(text: string): string {
  return text.toLowerCase().replace(/ς/gu, "σ");
}

export function activeIgnorePatterns(rules: ReadonlyArray<IgnoreRule> | undefined): string[] {
  const patterns = new Set<string>();
  for (const rule of rules ?? []) {
    if (rule.isEnabled && rule.kind === "literal" && rule.pattern) patterns.add(rule.pattern);
  }
  return [...patterns];
}

function mergeRanges(ranges: MaskRange[]): MaskRange[] {
  if (ranges.length < 2) return ranges;
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: Array<[number, number]> = [[ranges[0][0], ranges[0][1]]];
  for (let index = 1; index < ranges.length; index++) {
    const last = merged[merged.length - 1];
    const [start, end] = ranges[index];
    if (start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

export function findLiteralRanges(content: string, patterns: ReadonlyArray<string>, ignoreCase: boolean): MaskRange[] {
  if (!content || !patterns.length) return [];
  let haystack = content;
  let starts: number[] | null = null;
  let ends: number[] | null = null;
  if (ignoreCase) {
    haystack = "";
    starts = [];
    ends = [];
    let offset = 0;
    for (const character of content) {
      const folded = foldCase(character);
      for (let unit = 0; unit < folded.length; unit++) {
        starts.push(offset);
        ends.push(offset + character.length);
      }
      haystack += folded;
      offset += character.length;
    }
  }
  const ranges: MaskRange[] = [];
  for (const raw of patterns) {
    const pattern = ignoreCase ? foldCase(raw) : raw;
    for (let index = haystack.indexOf(pattern); index >= 0; index = haystack.indexOf(pattern, index + pattern.length)) {
      const last = index + pattern.length - 1;
      ranges.push(starts && ends ? [starts[index], ends[last]] : [index, last + 1]);
    }
  }
  return mergeRanges(ranges);
}

export class ComparisonNormalizer {
  readonly ignoresWhitespace: boolean;
  readonly ignoresCase: boolean;
  private readonly patterns: string[];
  private readonly maskCache = new Map<string, ReadonlyArray<MaskRange>>();

  constructor(options: NormalizerOptions) {
    this.ignoresWhitespace = options.ignoreWhitespace;
    this.ignoresCase = options.ignoreCase === true;
    this.patterns = activeIgnorePatterns(options.ignoreRules);
  }

  get hasRules(): boolean {
    return this.patterns.length > 0;
  }

  get isActive(): boolean {
    return this.ignoresWhitespace || this.ignoresCase || this.hasRules;
  }

  get hasIgnorableLines(): boolean {
    return this.ignoresWhitespace || this.hasRules;
  }

  maskRanges(content: string): ReadonlyArray<MaskRange> {
    if (!this.hasRules || !content) return NO_RANGES;
    let ranges = this.maskCache.get(content);
    if (!ranges) {
      ranges = findLiteralRanges(content, this.patterns, this.ignoresCase);
      this.maskCache.set(content, ranges);
    }
    return ranges;
  }

  private masked(content: string): string {
    const ranges = this.maskRanges(content);
    if (!ranges.length) return content;
    let result = "";
    let cursor = 0;
    for (const [start, end] of ranges) {
      result += content.slice(cursor, start);
      cursor = end;
    }
    return result + content.slice(cursor);
  }

  private key(text: string): string {
    const folded = this.ignoresCase ? foldCase(text) : text;
    return this.ignoresWhitespace ? normalizeWhitespace(folded) : folded;
  }

  contentKey(content: string): string {
    return this.key(this.masked(content));
  }

  lineKey(content: string, raw: string): string {
    if (!this.isActive) return raw;
    return this.ignoresWhitespace ? this.contentKey(content) : this.contentKey(content) + raw.slice(content.length);
  }

  textKey(text: string): string {
    if (!this.hasRules) return this.key(text);
    return this.key(text.split(/(\r\n|\r|\n)/u).map((part, index) => index % 2 ? part : this.masked(part)).join(""));
  }

  moveLineKey(content: string): string {
    const masked = this.masked(content);
    return normalizeWhitespace(this.ignoresCase ? foldCase(masked) : masked);
  }

  isIgnorable(content: string): boolean {
    if (this.ignoresWhitespace) return normalizeWhitespace(this.masked(content)) === "";
    return this.hasRules && content.length > 0 && this.masked(content) === "";
  }

  tokenKey(text: string): string {
    return this.ignoresCase ? foldCase(text) : text;
  }

  project(content: string, removeWhitespace: boolean): Projection | null {
    const ranges = this.maskRanges(content);
    if (!removeWhitespace && !ranges.length) return null;
    let text = "";
    const positions: number[] = [];
    let rangeIndex = 0;
    for (let index = 0; index < content.length; index++) {
      while (rangeIndex < ranges.length && ranges[rangeIndex][1] <= index) rangeIndex++;
      const range = ranges[rangeIndex];
      if (range && index >= range[0]) {
        index = range[1] - 1;
        continue;
      }
      const character = content[index];
      if (removeWhitespace && /\s/u.test(character)) continue;
      text += character;
      positions.push(index);
    }
    return { text, positions };
  }
}
