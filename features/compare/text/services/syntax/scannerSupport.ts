import type { SyntaxKind } from "./tokenizeSyntax";

export type EmitToken = (start: number, end: number, kind: SyntaxKind) => void;
export const isNewline = (char: string | undefined) => char === "\r" || char === "\n";
export const identifier = /[\p{ID_Start}_$][\p{ID_Continue}$\u200C\u200D]*/uy;
export const numeric = /(?:0[xX][\da-fA-F](?:[_'][\da-fA-F]|[\da-fA-F])*|0[bB][01](?:[_'][01]|[01])*|0[oO][0-7](?:_?[0-7])*|(?:\d(?:[_']?\d)*(?:\.(?!\.)(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eEpP][+-]?\d(?:_?\d)*)?)(?:(?:i|u)(?:8|16|32|64|128|size)|f(?:32|64)|[uUlLfFdDmMnN])*/y;

export function matchAt(pattern: RegExp, source: string, index: number): RegExpExecArray | null {
  pattern.lastIndex = index;
  return pattern.exec(source);
}

export function lineEnd(source: string, index: number): number {
  while (index < source.length && !isNewline(source[index])) index++;
  return index;
}

export function nextLine(source: string, index: number): number {
  return index + (source[index] === "\r" && source[index + 1] === "\n" ? 2 : 1);
}

export function readDelimited(source: string, index: number, open: string, close: string, nested = false, escapes = false): number {
  let depth = 1;
  index += open.length;
  while (index < source.length) {
    if (escapes && source[index] === "\\") index = Math.min(source.length, index + 2);
    else if (source.startsWith(close, index)) {
      index += close.length;
      if (--depth === 0) return index;
    } else if (nested && source.startsWith(open, index)) {
      depth++;
      index += open.length;
    } else index++;
  }
  return source.length;
}

export function readQuote(source: string, quoteStart: number, options: {
  multiline?: boolean; doubled?: boolean; escapes?: boolean; delimiter?: string;
} = {}): number {
  const delimiter = options.delimiter ?? source[quoteStart];
  let index = quoteStart + delimiter.length;
  while (index < source.length) {
    if (source.startsWith(delimiter, index)) {
      index += delimiter.length;
      if (options.doubled && source.startsWith(delimiter, index)) index += delimiter.length;
      else return index;
    } else if (options.escapes !== false && source[index] === "\\") {
      index = Math.min(source.length, index + (source[index + 1] === "\r" && source[index + 2] === "\n" ? 3 : 2));
    } else if (!options.multiline && isNewline(source[index])) return index;
    else index++;
  }
  return index;
}

export function readUntil(source: string, start: number, close: string): number {
  const end = source.indexOf(close, start);
  return end < 0 ? source.length : end + close.length;
}

export function advanceCodePoint(source: string, index: number): number {
  return index + (source.codePointAt(index)! > 0xffff ? 2 : 1);
}
