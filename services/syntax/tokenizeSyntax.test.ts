import { describe, expect, it } from "vitest";
import type { TextSyntaxLanguage } from "@/types/settings";
import { SYNTAX_LIMITS, tokenizeSyntax } from "./tokenizeSyntax";

function tokens(source: string, language: TextSyntaxLanguage = "javascript") {
  const result = tokenizeSyntax(source, language);
  expect(result.limited).toBe(false);
  return result.lines!.flatMap((line, index) => line.tokens.map((token) => ({
    text: line.text.slice(token.start, token.end), kind: token.kind, line: index + 1
  })));
}

describe("syntax tokenizer", () => {
  it("recognizes JavaScript keywords, numbers and strings without coloring identifiers", () => {
    expect(tokens('const constant = 0xff + 1_000.5e-2; const s = "return // text";')).toEqual(expect.arrayContaining([
      { text: "const", kind: "keyword", line: 1 },
      { text: "0xff", kind: "number", line: 1 },
      { text: "1_000.5e-2", kind: "number", line: 1 },
      { text: '"return // text"', kind: "string", line: 1 }
    ]));
    expect(tokens("constant returnValue obj.return").filter((token) => token.kind === "keyword")).toEqual([]);
  });

  it("keeps comments and escaped strings opaque", () => {
    expect(tokens('const s = "a\\\" // b"; // return 123').filter((token) => ["string", "comment"].includes(token.kind))).toEqual([
      { text: '"a\\\" // b"', kind: "string", line: 1 }, { text: "// return 123", kind: "comment", line: 1 }
    ]);
  });

  it("projects multiline comments onto LF, CRLF and lone CR lines", () => {
    const source = "/* start\r\nconst hidden = 1;\rstill hidden\n*/ const visible = 2;";
    const result = tokens(source);
    expect(result.filter((token) => token.kind === "comment")).toEqual([
      { text: "/* start", kind: "comment", line: 1 },
      { text: "const hidden = 1;", kind: "comment", line: 2 },
      { text: "still hidden", kind: "comment", line: 3 }, { text: "*/", kind: "comment", line: 4 }
    ]);
    expect(result.filter((token) => token.kind === "keyword")).toEqual([{ text: "const", kind: "keyword", line: 4 }]);
  });

  it("handles nested template interpolations and braces", () => {
    const source = 'const s = `hello\n${true ? `nested ${1 + 2}` : ({value: "x"}).value} end`;';
    const result = tokens(source);
    expect(result).toEqual(expect.arrayContaining([
      { text: "hello", kind: "string", line: 1 }, { text: "true", kind: "keyword", line: 2 },
      { text: "nested ", kind: "string", line: 2 }, { text: "1", kind: "number", line: 2 },
      { text: " end`", kind: "string", line: 2 }
    ]));
    expect(result.filter((token) => token.text === "${")).toHaveLength(2);
  });

  it("keeps escaped template interpolation inside the string", () => {
    expect(tokens('`\\${return} \\` end`').filter((token) => token.kind === "keyword")).toEqual([]);
  });

  it.each([
    ['const r = /a[\\/]b+/gi;', '/a[\\/]b+/gi'],
    ['return /https?:\\/\\//i;', '/https?:\\/\\//i'],
    ['if (ok) /x/.test(value);', '/x/']
  ])("recognizes common regex contexts: %s", (source, regex) => {
    expect(tokens(source)).toContainEqual({ text: regex, kind: "string", line: 1 });
  });

  it.each(["const n = a / b / c;", "call() / divisor;", "n++ / 2;", "const n = 12 / 3;"])("keeps division distinct: %s", (source) => {
    expect(tokens(source).filter((token) => token.kind === "string")).toEqual([]);
  });

  it("recovers from unfinished strings and regexes at a line boundary", () => {
    expect(tokens('"unfinished\nconst x = 1;\nreturn /unfinished\nconst y = 2;').filter((token) => token.kind === "keyword" && token.text === "const")).toHaveLength(2);
  });

  it("accepts incomplete multiline comments and template strings", () => {
    expect(tokens("/* unfinished\nreturn")).toContainEqual({ text: "return", kind: "comment", line: 2 });
    expect(tokens("`unfinished\nreturn")).toContainEqual({ text: "return", kind: "string", line: 2 });
  });

  it("distinguishes TypeScript types from JavaScript identifiers", () => {
    expect(tokens("interface User { name: string; age: number }", "typescript")).toEqual(expect.arrayContaining([
      { text: "interface", kind: "keyword", line: 1 }, { text: "string", kind: "type", line: 1 },
      { text: "number", kind: "type", line: 1 }
    ]));
    expect(tokens("interface string number")).toEqual([]);
  });

  it("colors JSON keys, values and literals without accepting comments as comments", () => {
    const result = tokens('{"name" : "const", "active": true, "count": 42, "empty": null}', "json");
    expect(result).toEqual(expect.arrayContaining([
      { text: '"name"', kind: "property", line: 1 }, { text: '"const"', kind: "string", line: 1 },
      { text: "true", kind: "keyword", line: 1 }, { text: "42", kind: "number", line: 1 },
      { text: "null", kind: "keyword", line: 1 }
    ]));
    expect(tokens("// text", "json").some((token) => token.kind === "comment")).toBe(false);
  });

  it("handles Python comments, string prefixes and triple quoted strings", () => {
    expect(tokens('def greet(name: str):\n    text = rf"""hello\nreturn # still a string\n"""\n    return True # comment', "python")).toEqual(expect.arrayContaining([
      { text: "def", kind: "keyword", line: 1 }, { text: "str", kind: "type", line: 1 },
      { text: 'rf"""hello', kind: "string", line: 2 },
      { text: "return # still a string", kind: "string", line: 3 },
      { text: "True", kind: "keyword", line: 5 }, { text: "# comment", kind: "comment", line: 5 }
    ]));
  });

  it("supports escaped newline continuation in quoted strings", () => {
    expect(tokens('"a\\\r\nb"\nconst x = 1;')).toContainEqual({ text: 'b"', kind: "string", line: 2 });
  });

  it("keeps UTF-16 offsets and exact text including tabs and Unicode", () => {
    const source = '\tconst árvíz = "😀 <script> &";\r\n\r\n';
    const result = tokenizeSyntax(source, "javascript");
    expect(result.lines!.map((line) => line.text)).toEqual(['\tconst árvíz = "😀 <script> &";', "", ""]);
    for (const line of result.lines!) {
      let previousEnd = 0;
      for (const token of line.tokens) {
        expect(token.start).toBeGreaterThanOrEqual(previousEnd);
        expect(token.end).toBeGreaterThan(token.start);
        expect(token.end).toBeLessThanOrEqual(line.text.length);
        previousEnd = token.end;
      }
    }
    expect(tokens(source)).toContainEqual({ text: '"😀 <script> &"', kind: "string", line: 1 });
  });

  it("treats JavaScript hashbang as a comment", () => {
    expect(tokens("#!/usr/bin/env node\nconst x = 1;")[0]).toEqual({ text: "#!/usr/bin/env node", kind: "comment", line: 1 });
  });

  it("does not split surrogate pairs or contiguous emoji sequences into separate spans", () => {
    const text = "😀‍😀";
    expect(tokens(text)).toEqual([{ text, kind: "punctuation", line: 1 }]);
  });

  it("does not process plain text even above the highlighting limits", () => {
    expect(tokenizeSyntax("x".repeat(SYNTAX_LIMITS.characters + 1), "plain")).toEqual({ lines: null, limited: false });
  });

  it.each([
    "x".repeat(SYNTAX_LIMITS.characters + 1),
    "x".repeat(SYNTAX_LIMITS.lineLength + 1),
    "\n".repeat(SYNTAX_LIMITS.lines),
    ("1;".repeat(5_000) + "\n").repeat(7),
    "[/ ".repeat(6000)
  ])("falls back atomically for excessive source or scanning work (%#)", (source) => {
    expect(tokenizeSyntax(source, "javascript")).toEqual({ lines: null, limited: true });
  });
});
