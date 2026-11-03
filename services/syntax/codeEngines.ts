import { CODE_PROFILES, profileWordKind, type ProfileLanguage } from "./codeProfiles";
import {
  advanceCodePoint, identifier, isNewline, lineEnd, matchAt, nextLine, numeric,
  readDelimited, readQuote, readUntil, type EmitToken
} from "./scannerSupport";

const rustRaw = /(?:br|cr|r)(#{0,255})"/y;
const cppRaw = /(?:u8|u|U|L)?R"([^ ()\\\t\r\n]{0,16})\(/y;
const cppPrefix = /(?:u8|u|U|L)(?=["'])/y;
const swiftRaw = /(#+)("""|")/y;
const csharpPrefix = /(?:\$+@?|@\$?)(?=")/y;
const shellHeredoc = /<<(-)?[ \t]*(?:'([A-Za-z_][\w]*)'|"([A-Za-z_][\w]*)"|\\?([A-Za-z_][\w]*))/y;
const rubyHeredoc = /<<(-|~)?(?:'([A-Za-z_][\w]*)'|"([A-Za-z_][\w]*)"|([A-Za-z_][\w]*))/y;
const phpHeredoc = /<<<[ \t]*(?:'([A-Za-z_][\w]*)'|"([A-Za-z_][\w]*)"|([A-Za-z_][\w]*))[ \t]*(?=\r|\n)/y;
const rubyPercent = /%(?:[qQwWiIxrs])?([^\w\s])/y;
const clojureSymbol = /[\p{L}_*+!?<>=\/][\p{L}\p{N}_*+!?<>=.\/-]*/uy;
const clojureKeyword = /::?[\p{L}\p{N}_*+!?<>=.\/-]+/uy;
const clojureNumber = /(?:0[xX][\da-fA-F]+|\d+[rR][\da-zA-Z]+|\d+\/\d+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[MN]?)/y;
const rustLifetime = /'[\p{ID_Start}_][\p{ID_Continue}_]*/uy;
const rustChar = /'(?:[^'\\\r\n]|\\(?:u\{[\da-fA-F_]+\}|x[\da-fA-F]{2}|[^\r\n]))'/uy;
const shellVariable = /\$(?:[\p{L}_][\p{L}\p{N}_]*|\d+|[?!#$*@-])/uy;
const phpVariable = /\$[\p{ID_Start}_][\p{ID_Continue}_]*/uy;
const rubyVariable = /(?:@@?|\$)[\p{ID_Start}_][\p{ID_Continue}_]*/uy;
const rubySymbol = /:[\p{ID_Start}_][\p{ID_Continue}_]*[!?]?/uy;

function readHeredoc(source: string, start: number, label: string, indentation: "none" | "tabs" | "spaces", php = false): number {
  let index = nextLine(source, lineEnd(source, start));
  while (index < source.length) {
    const end = lineEnd(source, index);
    let contentStart = index;
    while (contentStart < end && (source[contentStart] === "\t" || (indentation === "spaces" && source[contentStart] === " ")) && indentation !== "none") contentStart++;
    if (source.startsWith(label, contentStart)) {
      const after = contentStart + label.length;
      if (after === end || (php && /[;,)}\]\s]/.test(source[after]))) return php ? after : end;
    }
    index = nextLine(source, end);
  }
  return source.length;
}

function readClojureDiscard(source: string, start: number): number {
  let index = start + 2;
  while (/\s|,/.test(source[index] ?? "") && index < source.length) index++;
  const opening = source[index];
  if (opening === '"') return readQuote(source, index, { multiline: true });
  if (!["(", "[", "{"].includes(opening)) {
    while (index < source.length && !/[\s,()\[\]{}]/.test(source[index])) index++;
    return index;
  }
  let depth = 0;
  while (index < source.length) {
    if (source[index] === '"') index = readQuote(source, index, { multiline: true });
    else if (source[index] === ";") index = lineEnd(source, index);
    else if (source[index] === "(" || source[index] === "[" || source[index] === "{") { depth++; index++; }
    else if (source[index] === ")" || source[index] === "]" || source[index] === "}") {
      index++;
      if (--depth === 0) return index;
    } else index = advanceCodePoint(source, index);
  }
  return index;
}

function specialString(source: string, index: number, language: ProfileLanguage, allowHeredoc: boolean): number | undefined {
  if (language === "rust") {
    const raw = matchAt(rustRaw, source, index);
    if (raw) return readUntil(source, index + raw[0].length, `"${raw[1]}`);
    if ((source[index] === "b" || source[index] === "c") && /["']/.test(source[index + 1] ?? "")) {
      return readQuote(source, index + 1, { multiline: source[index + 1] === '"' });
    }
  }
  if (language === "cpp") {
    const raw = matchAt(cppRaw, source, index);
    if (raw) return readUntil(source, index + raw[0].length, `)${raw[1]}"`);
  }
  if (["c", "cpp", "objectivec"].includes(language)) {
    const prefix = matchAt(cppPrefix, source, index);
    if (prefix) return readQuote(source, index + prefix[0].length);
  }
  if (language === "objectivec" && source.startsWith('@"', index)) return readQuote(source, index + 1);
  if (language === "swift") {
    const raw = matchAt(swiftRaw, source, index);
    if (raw) return readUntil(source, index + raw[0].length, raw[2] + raw[1]);
  }
  if (language === "csharp") {
    const prefix = matchAt(csharpPrefix, source, index);
    const quoteStart = index + (prefix?.[0].length ?? 0);
    if (source[quoteStart] === '"') {
      let count = 0;
      while (source[quoteStart + count] === '"') count++;
      if (count >= 3) return readUntil(source, quoteStart + count, '"'.repeat(count));
      if (prefix) return readQuote(source, quoteStart, {
        multiline: prefix[0].includes("@"), doubled: prefix[0].includes("@"), escapes: !prefix[0].includes("@")
      });
    }
  }
  if ((language === "java" || language === "swift") && source.startsWith('"""', index)) {
    return readQuote(source, index, { delimiter: '"""', multiline: true });
  }
  if (language === "go" && source[index] === "`") return readQuote(source, index, { multiline: true, escapes: false });
  if (language === "sql") {
    const dollar = matchAt(/\$(?:[A-Za-z_][\w]*)?\$/y, source, index);
    if (dollar) return readUntil(source, index + dollar[0].length, dollar[0]);
  }
  if (language === "php") {
    const match = matchAt(phpHeredoc, source, index);
    if (match) return readHeredoc(source, index + match[0].length, match[1] ?? match[2] ?? match[3], "spaces", true);
  }
  if (language === "shell" || language === "ruby") {
    const match = allowHeredoc ? matchAt(language === "ruby" ? rubyHeredoc : shellHeredoc, source, index) : null;
    if (match) return readHeredoc(source, index + match[0].length, match[2] ?? match[3] ?? match[4],
      language === "ruby" && match[1] ? "spaces" : match[1] === "-" ? "tabs" : "none");
    if (language === "ruby") {
      const percent = matchAt(rubyPercent, source, index);
      if (percent) {
        const delimiter = percent[1];
        const close = ({ "(": ")", "[": "]", "{": "}", "<": ">" } as Record<string, string>)[delimiter];
        if (close) return readDelimited(source, index + percent[0].length - 1, delimiter, close, true, true);
        return readQuote(source, index + percent[0].length - 1, { multiline: true });
      }
    }
  }
  return undefined;
}

export function scanCode(source: string, language: ProfileLanguage, emit: EmitToken, exhausted: () => boolean): boolean {
  const profile = CODE_PROFILES[language];
  let index = 0;
  let afterDot = false;
  let canStartRegex = true;
  let shellArithmeticDepth = 0;
  let rubyCommandPosition = true;
  let rubyCommandArgument = false;
  const rubyLocals = new Set<string>();
  while (index < source.length) {
    if (exhausted()) return false;
    const start = index;
    const char = source[index];
    if (/\s/u.test(char)) {
      if (language === "ruby" && isNewline(char)) {
        rubyCommandPosition = true;
        rubyCommandArgument = false;
        canStartRegex = true;
      }
      index++;
      continue;
    }

    if (language === "shell") {
      if (!shellArithmeticDepth && (source.startsWith("$((", index) || source.startsWith("((", index))) {
        shellArithmeticDepth = 2;
        index += char === "$" ? 3 : 2;
        emit(start, index, "punctuation");
        continue;
      }
      if (char === "(" && shellArithmeticDepth) shellArithmeticDepth++;
      if (char === ")" && shellArithmeticDepth) shellArithmeticDepth--;
      if (source.startsWith("<<<", index)) {
        index += 3;
        emit(start, index, "punctuation");
        continue;
      }
    }

    if (profile.lineComments.some((comment) => source.startsWith(comment, index)) &&
      !(language === "php" && source.startsWith("#[", index)) &&
      (language !== "shell" || index === 0 || /[\s;(|&>]/.test(source[index - 1]))) {
      index = lineEnd(source, index);
      emit(start, index, "comment");
      continue;
    }
    if (profile.blockComment && source.startsWith(profile.blockComment[0], index)) {
      index = readDelimited(source, index, ...profile.blockComment, profile.nestedComments);
      emit(start, index, "comment");
      continue;
    }
    if (language === "ruby" && (index === 0 || isNewline(source[index - 1])) && /^=begin(?:\s|$)/.test(source.slice(index, index + 7))) {
      let end = lineEnd(source, index);
      while (end < source.length) {
        end = nextLine(source, end);
        if (source.startsWith("=end", end) && /\s|$/.test(source[end + 4] ?? "")) { end = lineEnd(source, end); break; }
        end = lineEnd(source, end);
      }
      index = end;
      emit(start, index, "comment");
      continue;
    }
    if (language === "clojure" && source.startsWith("#_", index)) {
      index = readClojureDiscard(source, index);
      emit(start, index, "comment");
      continue;
    }
    if (["c", "cpp", "objectivec", "csharp"].includes(language) && char === "#") {
      let previous = index - 1;
      while (previous >= 0 && /[ \t]/.test(source[previous])) previous--;
      if (previous < 0 || isNewline(source[previous])) {
        const directive = matchAt(/#[ \t]*[A-Za-z_]+/y, source, index);
        if (directive) { index += directive[0].length; emit(start, index, "keyword"); continue; }
      }
    }

    const allowHeredoc = language === "shell" ? shellArithmeticDepth === 0
      : canStartRegex || (rubyCommandArgument && /[ \t]/.test(source[index - 1] ?? ""));
    const specialEnd = specialString(source, index, language, allowHeredoc);
    if (specialEnd !== undefined) {
      index = specialEnd;
      emit(start, index, "string");
      canStartRegex = false;
      afterDot = false;
      rubyCommandArgument = false;
      rubyCommandPosition = false;
      continue;
    }
    if (language === "rust" && char === "'") {
      const character = matchAt(rustChar, source, index);
      const lifetime = character ? null : matchAt(rustLifetime, source, index);
      if (character || lifetime) {
        index += (character ?? lifetime)![0].length;
        emit(start, index, character ? "string" : "type");
        continue;
      }
    }
    if (language === "clojure" && source.startsWith('#"', index)) {
      index = readQuote(source, index + 1, { multiline: true });
      emit(start, index, "string");
      continue;
    }
    if (char === '"' || (char === "'" && language !== "clojure" && language !== "rust") ||
      (char === "`" && ["shell", "ruby", "sql", "php"].includes(language))) {
      const sql = language === "sql";
      index = readQuote(source, index, {
        multiline: ["clojure", "ruby", "php", "shell", "sql", "rust"].includes(language),
        doubled: sql, escapes: !(sql || (language === "shell" && char === "'"))
      });
      emit(start, index, sql && char !== "'" ? "property" : "string");
      afterDot = false;
      canStartRegex = false;
      rubyCommandArgument = false;
      rubyCommandPosition = false;
      continue;
    }
    if (language === "sql" && char === "[") {
      index = readQuote(source, index, { delimiter: "]", doubled: true, escapes: false, multiline: true });
      emit(start, index, "property");
      continue;
    }
    if (language === "shell" && source.startsWith("${", index)) {
      index = readDelimited(source, index + 1, "{", "}", true);
      emit(start, index, "property");
      continue;
    }
    const variable = language === "shell" ? matchAt(shellVariable, source, index) : language === "php" ? matchAt(phpVariable, source, index) : language === "ruby" ? matchAt(rubyVariable, source, index) : null;
    if (variable) { index += variable[0].length; emit(start, index, "property"); canStartRegex = false; rubyCommandArgument = false; continue; }
    if (language === "ruby") {
      const symbol = matchAt(rubySymbol, source, index);
      if (symbol) { index += symbol[0].length; emit(start, index, "property"); continue; }
      if (char === "/" && canStartRegex) {
        index = readQuote(source, index);
        while (/[imxounes]/.test(source[index] ?? "") && index < source.length) index++;
        emit(start, index, "string");
        canStartRegex = false;
        continue;
      }
    }
    if (language === "clojure") {
      const keyword = matchAt(clojureKeyword, source, index);
      if (keyword) { index += keyword[0].length; emit(start, index, "property"); continue; }
      if (char === "\\") {
        index++;
        if (index < source.length) index = advanceCodePoint(source, index);
        while (index < source.length && /[\p{L}\p{N}]/u.test(source[index])) index++;
        emit(start, index, "string");
        continue;
      }
    }
    const number = matchAt(language === "clojure" ? clojureNumber : numeric, source, index);
    if (number) { index += number[0].length; emit(start, index, "number"); canStartRegex = false; afterDot = false; rubyCommandArgument = false; rubyCommandPosition = false; continue; }

    if ((language === "rust" && source.startsWith("r#", index)) || (language === "csharp" && char === "@")) {
      const escaped = matchAt(identifier, source, index + (language === "rust" ? 2 : 1));
      if (escaped) { index += escaped[0].length + (language === "rust" ? 2 : 1); emit(start, index, "property"); continue; }
    }
    if (language === "objectivec" && char === "@") index++;
    const word = matchAt(language === "clojure" ? clojureSymbol : identifier, source, index);
    if (word) {
      index += word[0].length;
      if (language === "ruby" && /[!?]/.test(source[index] ?? "")) index++;
      const value = source.slice(language === "objectivec" && char === "@" ? start + 1 : start, index);
      const kind = afterDot ? undefined : profileWordKind(value, profile);
      if (kind) emit(start, index, kind);
      if (language === "ruby") {
        let next = index;
        while (/[ \t]/.test(source[next] ?? "") && next < source.length) next++;
        if (source[next] === "=" && !/[=>~]/.test(source[next + 1] ?? "")) rubyLocals.add(value);
        rubyCommandArgument = rubyCommandPosition && !kind && !rubyLocals.has(value);
        rubyCommandPosition = false;
      }
      canStartRegex = ["return", "when", "if", "unless"].includes(value);
      afterDot = false;
      continue;
    }
    const range = char === "." && source[index + 1] === ".";
    if (language === "swift" && char === "#") {
      do { index++; } while (source[index] === "#");
    } else if (index === start) index = range ? index + (source[index + 2] === "." ? 3 : 2) : advanceCodePoint(source, index);
    emit(start, index, "punctuation");
    afterDot = char === "." && !range;
    canStartRegex = ![")", "]", "}", "."].includes(char);
    rubyCommandArgument = false;
    rubyCommandPosition = char === ";";
  }
  return !exhausted();
}
