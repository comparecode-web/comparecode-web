import type { TextSyntaxLanguage } from "@/types/settings";
import { getWordKind } from "./languages";
import { SYNTAX_ENGINES } from "./engines";
import { identifier, isNewline, readQuote } from "./scannerSupport";

export type SyntaxKind = "comment" | "string" | "number" | "keyword" | "type" | "punctuation" | "property";
export interface SyntaxToken { start: number; end: number; kind: SyntaxKind }
export interface SyntaxLine { text: string; tokens: SyntaxToken[] }
export interface SyntaxResult { lines: SyntaxLine[] | null; limited: boolean }

export const SYNTAX_LIMITS = { characters: 500_000, lines: 20_000, lineLength: 20_000, tokens: 60_000 } as const;
const limitedResult: SyntaxResult = { lines: null, limited: true };
const number = /(?:0[xX][\da-fA-F](?:_?[\da-fA-F])*|0[bB][01](?:_?[01])*|0[oO][0-7](?:_?[0-7])*|(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?)[nj]?/y;
const regexLeadingWords = new Set("return throw case delete void typeof instanceof in of yield await else do".split(" "));
const controlWords = new Set("if while for with switch catch".split(" "));

function readQuoted(source: string, start: number, prefixLength = 0, triple = false): number {
  const quoteStart = start + prefixLength;
  const delimiter = source[quoteStart].repeat(triple ? 3 : 1);
  return readQuote(source, quoteStart, { delimiter, multiline: triple });
}

function readRegex(source: string, start: number, budget: { remaining: number }): number | null {
  let inClass = false;
  for (let index = start + 1; index < source.length; index++) {
    if (--budget.remaining <= 0) return null;
    const char = source[index];
    if (isNewline(char)) return null;
    if (char === "\\") {
      if (isNewline(source[index + 1])) return null;
      index++;
    } else if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    else if (char === "/" && !inClass) {
      index++;
      while (/[a-z]/i.test(source[index] ?? "") && index < source.length) index++;
      return index;
    }
  }
  return null;
}

type CodeFrame = {
  mode: "code"; interpolation: boolean; braces: number; canStartRegex: boolean;
  previousWord: string; afterDot: boolean; parentheses: boolean[];
};
type Frame = CodeFrame | { mode: "template" };
const codeFrame = (interpolation = false): CodeFrame => ({
  mode: "code", interpolation, braces: 0, canStartRegex: true,
  previousWord: "", afterDot: false, parentheses: []
});

function projectTokens(lines: SyntaxLine[], starts: number[], tokens: SyntaxToken[]): SyntaxResult {
  let lineIndex = 0;
  if (tokens.length > SYNTAX_LIMITS.tokens) return limitedResult;
  for (const token of tokens) {
    while (lineIndex + 1 < starts.length && starts[lineIndex + 1] <= token.start) lineIndex++;
    let current = lineIndex;
    while (current < lines.length && starts[current] < token.end) {
      const start = Math.max(token.start, starts[current]) - starts[current];
      const end = Math.min(token.end, starts[current] + lines[current].text.length) - starts[current];
      if (end > start) lines[current].tokens.push({ start, end, kind: token.kind });
      current++;
    }
  }
  return { lines, limited: false };
}

export function tokenizeSyntax(source: string, language: TextSyntaxLanguage): SyntaxResult {
  if (language === "plain") return { lines: null, limited: false };
  if (source.length > SYNTAX_LIMITS.characters) return limitedResult;

  const lines: SyntaxLine[] = [];
  const starts: number[] = [];
  let lineStart = 0;
  for (let index = 0; index <= source.length; index++) {
    if (index !== source.length && !isNewline(source[index])) continue;
    if (index - lineStart > SYNTAX_LIMITS.lineLength || lines.length >= SYNTAX_LIMITS.lines) return limitedResult;
    starts.push(lineStart);
    lines.push({ text: source.slice(lineStart, index), tokens: [] });
    if (source[index] === "\r" && source[index + 1] === "\n") index++;
    lineStart = index + 1;
  }

  const tokens: SyntaxToken[] = [];
  const emit = (start: number, end: number, kind: SyntaxKind) => {
    if (end <= start) return;
    const previous = tokens[tokens.length - 1];
    if (kind === "punctuation" && previous?.kind === kind && previous.end === start) previous.end = end;
    else tokens.push({ start, end, kind });
  };
  if (language !== "javascript" && language !== "typescript" && language !== "json" && language !== "python") {
    const completed = SYNTAX_ENGINES[language](source, emit, () => tokens.length >= SYNTAX_LIMITS.tokens);
    return completed ? projectTokens(lines, starts, tokens) : limitedResult;
  }
  const frames: Frame[] = [codeFrame()];
  const isJavaScript = language === "javascript" || language === "typescript";
  const regexBudget = { remaining: source.length * 4 + 1024 };
  let index = 0;
  while (index < source.length) {
    if (tokens.length >= SYNTAX_LIMITS.tokens) return limitedResult;
    const frame = frames[frames.length - 1];
    const start = index;
    const char = source[index];

    if (frame.mode === "template") {
      while (index < source.length) {
        if (source[index] === "\\") index = Math.min(source.length, index + 2);
        else if (source[index] === "`") {
          emit(start, ++index, "string");
          frames.pop();
          break;
        } else if (source.startsWith("${", index)) {
          emit(start, index, "string");
          emit(index, index + 2, "punctuation");
          index += 2;
          frames.push(codeFrame(true));
          break;
        } else index++;
      }
      if (index === source.length && frames[frames.length - 1] === frame) emit(start, index, "string");
      continue;
    }

    if (/\s/u.test(char)) { index++; continue; }
    if ((language === "python" && char === "#") || (isJavaScript && (source.startsWith("//", index) || (index === 0 && source.startsWith("#!", index))))) {
      while (index < source.length && !isNewline(source[index])) index++;
      emit(start, index, "comment");
      continue;
    }
    if (isJavaScript && source.startsWith("/*", index)) {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? source.length : end + 2;
      emit(start, index, "comment");
      continue;
    }

    let prefixLength = 0;
    if (language === "python") {
      while (prefixLength < 2 && /[bruf]/i.test(source[index + prefixLength] ?? "")) prefixLength++;
      if (source[index + prefixLength] !== "'" && source[index + prefixLength] !== '"') prefixLength = 0;
    }
    const quote = source[index + prefixLength];
    if (quote === '"' || (quote === "'" && language !== "json")) {
      const triple = language === "python" && source.startsWith(quote.repeat(3), index + prefixLength);
      index = readQuoted(source, index, prefixLength, triple);
      let kind: SyntaxKind = "string";
      if (language === "json") {
        let next = index;
        while (next < source.length && /\s/u.test(source[next])) next++;
        if (source[next] === ":") kind = "property";
      }
      emit(start, index, kind);
      frame.canStartRegex = false;
      frame.afterDot = false;
      frame.previousWord = "";
      continue;
    }

    if (isJavaScript && char === "`") {
      emit(index, ++index, "string");
      frame.canStartRegex = false;
      frame.afterDot = false;
      frames.push({ mode: "template" });
      continue;
    }
    if (isJavaScript && char === "/" && frame.canStartRegex) {
      const end = readRegex(source, index, regexBudget);
      if (regexBudget.remaining <= 0) return limitedResult;
      if (end !== null) {
        emit(index, end, "string");
        index = end;
        frame.canStartRegex = false;
        frame.previousWord = "";
        continue;
      }
    }

    number.lastIndex = index;
    const numeric = number.exec(source);
    if (numeric) {
      index += numeric[0].length;
      emit(start, index, "number");
      frame.canStartRegex = false;
      frame.afterDot = false;
      frame.previousWord = "";
      continue;
    }

    identifier.lastIndex = index;
    const word = identifier.exec(source);
    if (word) {
      index += word[0].length;
      const kind = frame.afterDot && isJavaScript ? undefined : getWordKind(word[0], language);
      if (kind) emit(start, index, kind);
      frame.canStartRegex = kind === "keyword" && regexLeadingWords.has(word[0]);
      frame.previousWord = word[0];
      frame.afterDot = false;
      continue;
    }

    if (char === "}" && frame.interpolation && frame.braces === 0) {
      emit(index, ++index, "punctuation");
      frames.pop();
      continue;
    }
    if (char === "{") frame.braces++;
    if (char === "}") frame.braces--;
    if (char === "(") frame.parentheses.push(controlWords.has(frame.previousWord));
    const closedControl = char === ")" && frame.parentheses.pop();
    const doubled = (char === "+" || char === "-") && source[index + 1] === char;
    frame.canStartRegex = !!closedControl || (!doubled && ![")", "]", "}", "."].includes(char));
    frame.afterDot = char === ".";
    frame.previousWord = "";
    index += doubled || source.codePointAt(index)! > 0xffff ? 2 : 1;
    emit(start, index, "punctuation");
  }

  return projectTokens(lines, starts, tokens);
}
