import {
  advanceCodePoint, isNewline, lineEnd, matchAt, nextLine, readDelimited, readQuote, readUntil, type EmitToken
} from "./scannerSupport";

const cssName = /(?:--)?[\p{L}_-][\p{L}\p{N}_-]*/uy;
const cssNumber = /(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?(?:%|[a-zA-Z]+)?/y;
const cssHex = /#[\da-fA-F]{3,8}\b/y;
const entity = /&(?:#[xX][\da-fA-F]+|#\d+|[A-Za-z][\w]*);/y;
const markupName = /[\p{L}_:][\p{L}\p{N}_.:-]*/uy;
const yamlNumber = /^[+-]?(?:0[xX][\da-fA-F_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?|\.inf|\.nan)$/i;

export function scanCss(source: string, emit: EmitToken, exhausted: () => boolean): boolean {
  let index = 0;
  let inValue = false;
  let braceDepth = 0;
  let declarationName = false;
  while (index < source.length) {
    if (exhausted()) return false;
    const start = index;
    const char = source[index];
    if (/\s/u.test(char)) { index++; continue; }
    if (source.startsWith("/*", index)) { index = readDelimited(source, index, "/*", "*/"); emit(start, index, "comment"); continue; }
    if (char === '"' || char === "'") { index = readQuote(source, index); emit(start, index, "string"); continue; }
    const hex = inValue ? matchAt(cssHex, source, index) : null;
    if (hex) { index += hex[0].length; emit(start, index, "number"); continue; }
    const numeric = matchAt(cssNumber, source, index);
    if (numeric) { index += numeric[0].length; emit(start, index, "number"); continue; }
    const prefix = ["@", ".", "#"].includes(char) ? 1 : 0;
    const name = matchAt(cssName, source, index + prefix);
    if (name) {
      index += prefix + name[0].length;
      let next = index;
      while (/\s/.test(source[next] ?? "") && next < source.length) next++;
      if (name[0].toLowerCase() === "url" && source[next] === "(") {
        index = next + 1;
        while (index < source.length && source[index] !== ")") {
          if (source[index] === '"' || source[index] === "'") index = readQuote(source, index);
          else if (source[index] === "\\") index = Math.min(source.length, index + 2);
          else index++;
        }
        if (source[index] === ")") index++;
        emit(start, index, "string");
      } else {
        declarationName = !prefix && ((braceDepth > 0 && source[next] === ":") || name[0].startsWith("--"));
        emit(start, index, char === "@" ? "keyword" : declarationName ? "property" : "type");
      }
      continue;
    }
    if (char === ":") inValue = declarationName;
    if (char === "{") braceDepth++;
    if (char === "}") braceDepth--;
    if (["{", "}", ";"].includes(char)) inValue = false;
    index = advanceCodePoint(source, index);
    emit(start, index, "punctuation");
  }
  return !exhausted();
}

export function scanMarkup(source: string, emit: EmitToken, exhausted: () => boolean): boolean {
  let index = 0;
  let inTag = false;
  let tagName = false;
  let rawTag: string | undefined;
  let openingName: string | undefined;
  let closingTag = false;
  while (index < source.length) {
    if (exhausted()) return false;
    const start = index;
    const char = source[index];
    if (rawTag && !inTag) {
      const closing = new RegExp(`</${rawTag}\\s*>`, "ig");
      closing.lastIndex = index;
      const end = closing.exec(source);
      const rawEnd = end?.index ?? source.length;
      if (rawTag === "title" || rawTag === "textarea") {
        let chunk = index;
        while (index < rawEnd) {
          if (exhausted()) return false;
          const reference = matchAt(entity, source, index);
          if (reference) {
            emit(chunk, index, "string");
            const referenceStart = index;
            index += reference[0].length;
            emit(referenceStart, index, "type");
            chunk = index;
          } else index = advanceCodePoint(source, index);
        }
        emit(chunk, rawEnd, "string");
      } else { index = rawEnd; emit(start, index, "string"); }
      rawTag = undefined;
      continue;
    }
    if (source.startsWith("<!--", index)) { index = readDelimited(source, index, "<!--", "-->"); emit(start, index, "comment"); continue; }
    if (source.startsWith("<![CDATA[", index)) { index = readUntil(source, index + 9, "]]>"); emit(start, index, "string"); continue; }
    if (source.startsWith("<?", index)) { index = readUntil(source, index + 2, "?>"); emit(start, index, "keyword"); continue; }
    if (/\s/u.test(char)) { index++; continue; }
    if (!inTag && char === "<" && /[\p{L}_/!]/u.test(source[index + 1] ?? "")) {
      closingTag = source[index + 1] === "/";
      inTag = true;
      tagName = true;
      openingName = undefined;
      index += closingTag || source[index + 1] === "!" ? 2 : 1;
      emit(start, index, "punctuation");
      continue;
    }
    if (inTag && (char === '"' || char === "'")) {
      index = readQuote(source, index, { multiline: true, escapes: false });
      emit(start, index, "string");
      continue;
    }
    if (inTag && (char === ">" || source.startsWith("/>", index))) {
      const selfClosing = char === "/";
      index += selfClosing ? 2 : 1;
      emit(start, index, "punctuation");
      inTag = false;
      if (!closingTag && !selfClosing && openingName && ["script", "style", "textarea", "title"].includes(openingName)) rawTag = openingName;
      continue;
    }
    if (inTag) {
      const name = matchAt(markupName, source, index);
      if (name) {
        index += name[0].length;
        emit(start, index, tagName ? "keyword" : "property");
        if (tagName) openingName = name[0].toLowerCase();
        tagName = false;
        continue;
      }
      index = advanceCodePoint(source, index);
      emit(start, index, "punctuation");
      continue;
    }
    const reference = matchAt(entity, source, index);
    if (reference) { index += reference[0].length; emit(start, index, "type"); }
    else index = advanceCodePoint(source, index);
  }
  return !exhausted();
}

function readYamlBlock(source: string, marker: number, indentation: number, explicitIndent: number): number {
  let index = nextLine(source, lineEnd(source, marker));
  let minimumIndent = explicitIndent ? indentation + explicitIndent : undefined;
  while (index < source.length) {
    const start = index;
    const end = lineEnd(source, index);
    while (index < end && source[index] === " ") index++;
    if (index !== end) {
      const currentIndent = index - start;
      if (minimumIndent === undefined) minimumIndent = currentIndent > indentation ? currentIndent : indentation + 1;
      if (currentIndent < minimumIndent) return start;
    }
    index = nextLine(source, end);
  }
  return source.length;
}

function readYamlPlain(source: string, start: number, lineStart: number, flowDepth: number, indentation: number): { end: number; lineStart: number } {
  let index = start;
  let end = start;
  let endLineStart = lineStart;
  while (index < source.length) {
    const char = source[index];
    if ((flowDepth > 0 && ",[]{}".includes(char)) ||
      (char === "#" && /\s/.test(source[index - 1] ?? "")) ||
      (char === ":" && (index + 1 === source.length || /\s/.test(source[index + 1]) || (flowDepth > 0 && ",[]{}".includes(source[index + 1]))))) break;
    if (isNewline(char)) {
      let nextStart = nextLine(source, index);
      let next = nextStart;
      while (next < source.length) {
        while (source[next] === " " || source[next] === "\t") next++;
        if (!isNewline(source[next])) break;
        nextStart = nextLine(source, next);
        next = nextStart;
      }
      if (next >= source.length || source[next] === "#" || (!flowDepth && next - nextStart <= indentation)) break;
      lineStart = nextStart;
      index = next;
      continue;
    }
    index = advanceCodePoint(source, index);
    if (!/\s/u.test(char)) { end = index; endLineStart = lineStart; }
  }
  return { end, lineStart: endLineStart };
}

export function scanYaml(source: string, emit: EmitToken, exhausted: () => boolean): boolean {
  let index = 0;
  let lineStart = 0;
  let keyCandidate = true;
  let flowDepth = 0;
  let afterKey = false;
  let plainIndentation = 0;
  while (index < source.length) {
    if (exhausted()) return false;
    const start = index;
    const char = source[index];
    if (isNewline(char)) { index = nextLine(source, index); lineStart = index; keyCandidate = true; continue; }
    if (/\s/u.test(char)) { index++; continue; }
    if (char === "#" && (index === 0 || /[\s,[{]/.test(source[index - 1]))) {
      index = lineEnd(source, index); emit(start, index, "comment"); continue;
    }
    if ((source.startsWith("---", index) || source.startsWith("...", index)) && (index === lineStart) || char === "%") {
      index = lineEnd(source, index); emit(start, index, "keyword"); continue;
    }
    if (char === "'" || char === '"') {
      index = readQuote(source, index, { multiline: true, doubled: char === "'", escapes: char === '"' });
      let next = index;
      while (/[ \t]/.test(source[next] ?? "") && next < source.length) next++;
      afterKey = source[next] === ":";
      if (afterKey) plainIndentation = start - lineStart;
      emit(start, index, afterKey ? "property" : "string");
      keyCandidate = false;
      continue;
    }
    if (char === "|" || char === ">") {
      let indentation = 0;
      while (source[lineStart + indentation] === " ") indentation++;
      const header = matchAt(/[|>](?:[+-]?[1-9]?|[1-9][+-]?)(?=[ \t\r\n#]|$)/y, source, index);
      if (header) {
        index = readYamlBlock(source, index, indentation, Number(header[0].match(/[1-9]/)?.[0] ?? 0));
        emit(start, index, "string");
        lineStart = index;
        keyCandidate = true;
        continue;
      }
    }
    if (char === "&" || char === "*" || char === "!") {
      const tag = matchAt(/[&*!][^\s,\[\]{}]+/y, source, index);
      if (tag) { index += tag[0].length; emit(start, index, char === "!" ? "type" : "property"); continue; }
    }
    if ("{}[]".includes(char) || (char === "," && flowDepth > 0) ||
      (char === ":" && afterKey) ||
      (":?".includes(char) && (index + 1 === source.length || /\s/.test(source[index + 1]) || (flowDepth > 0 && ",[]{}".includes(source[index + 1])))) ||
      (char === "-" && /\s/.test(source[index + 1] ?? ""))) {
      if (char === "{" || char === "[") flowDepth++;
      if (char === "}" || char === "]") flowDepth = Math.max(0, flowDepth - 1);
      if (char === "-") plainIndentation = start - lineStart;
      afterKey = false;
      index++;
      emit(start, index, "punctuation");
      keyCandidate = char !== ":" && char !== "]" && char !== "}";
      continue;
    }
    if (keyCandidate) {
      const key = matchAt(/[^\r\n{}\[\],#]+?(?=:(?:[\s,\]}]|$))/y, source, index);
      if (key) {
        index += key[0].trimEnd().length;
        emit(start, index, "property");
        keyCandidate = false;
        afterKey = true;
        plainIndentation = start - lineStart;
        continue;
      }
    }
    const plain = readYamlPlain(source, index, lineStart, flowDepth, plainIndentation);
    if (plain.end > index) {
      index = plain.end;
      lineStart = plain.lineStart;
      const value = source.slice(start, index);
      emit(start, index, /^(true|false|null|~)$/i.test(value) ? "keyword" : yamlNumber.test(value) ? "number" : "string");
      keyCandidate = false;
      afterKey = false;
      continue;
    }
    index = advanceCodePoint(source, index);
    emit(start, index, "punctuation");
  }
  return !exhausted();
}

export function scanMarkdown(source: string, emit: EmitToken, exhausted: () => boolean): boolean {
  let index = 0;
  let atLineStart = true;
  let inlineEnd = -1;
  let lookaheadBudget = source.length * 4 + 1024;
  while (index < source.length) {
    if (exhausted()) return false;
    const start = index;
    const char = source[index];
    if (isNewline(char)) { index = nextLine(source, index); atLineStart = true; continue; }
    if (atLineStart) {
      const fence = matchAt(/ {0,3}(`{3,}|~{3,})[^\r\n]*/y, source, index);
      if (fence) {
        index += fence[0].length;
        while (index < source.length) {
          index = nextLine(source, index);
          const end = lineEnd(source, index);
          const close = matchAt(/ {0,3}(`+|~+)[ \t]*(?=\r|\n|$)/y, source, index);
          if (close && close[1][0] === fence[1][0] && close[1].length >= fence[1].length) { index = end; break; }
          index = end;
        }
        emit(start, index, "string");
        atLineStart = false;
        continue;
      }
      const heading = matchAt(/ {0,3}#{1,6}(?:[ \t]+|$)/y, source, index);
      if (heading) { index = lineEnd(source, index); emit(start, index, "keyword"); atLineStart = false; continue; }
      const marker = matchAt(/ {0,3}(?:>[ \t]?|[-+*][ \t]+|\d+[.)][ \t]+|(?:={3,}|-{3,}|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})(?=\r|\n|$))/y, source, index);
      if (marker) { index += marker[0].length; emit(start, index, "punctuation"); atLineStart = false; continue; }
      if (source.startsWith("    ", index) || char === "\t") { index = lineEnd(source, index); emit(start, index, "string"); atLineStart = false; continue; }
      atLineStart = false;
    }
    if (source.startsWith("<!--", index)) { index = readDelimited(source, index, "<!--", "-->"); emit(start, index, "comment"); continue; }
    if (char === "\\" && index + 1 < source.length) { index = advanceCodePoint(source, index + 1); continue; }
    if (char === "`") {
      let count = 1;
      while (source[index + count] === "`") count++;
      const delimiter = "`".repeat(count);
      const end = source.indexOf(delimiter, index + count);
      if (end >= 0) { index = end + count; emit(start, index, "string"); continue; }
      index += count;
      emit(start, index, "punctuation");
      continue;
    }
    if (char === "[" || (char === "!" && source[index + 1] === "[")) {
      if (inlineEnd < index) inlineEnd = lineEnd(source, index);
      const link = matchAt(/!?\[[^\]\r\n]*\]\([^\s()]*\)/y, source, index);
      lookaheadBudget -= link ? link[0].length : inlineEnd - index;
      if (lookaheadBudget < 0) return false;
      if (link) { index += link[0].length; emit(start, index, "property"); continue; }
    }
    const emphasis = matchAt(/(?:\*\*[^*\r\n]+\*\*|__[^_\r\n]+__|\*[^*\r\n]+\*|_[^_\r\n]+_|~~[^~\r\n]+~~)/y, source, index);
    if (emphasis && !/\s/.test(source[index + 1] ?? " ") && (char !== "_" || index === 0 || !/[\p{L}\p{N}]/u.test(source[index - 1]))) {
      index += emphasis[0].length; emit(start, index, "type"); continue;
    }
    const reference = matchAt(entity, source, index);
    if (reference) { index += reference[0].length; emit(start, index, "type"); continue; }
    index = advanceCodePoint(source, index);
  }
  return !exhausted();
}
