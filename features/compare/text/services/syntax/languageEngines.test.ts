import { describe, expect, it } from "vitest";
import { TEXT_SYNTAX_LANGUAGES, type TextSyntaxLanguage } from "@/types/settings";
import { LANGUAGE_SAMPLES } from "./__fixtures__/languageSamples";
import { SYNTAX_LANGUAGE_OPTIONS } from "./languages";
import { SYNTAX_LIMITS, tokenizeSyntax } from "./tokenizeSyntax";

const languages = TEXT_SYNTAX_LANGUAGES.filter((language) => language !== "plain");
function tokens(source: string, language: TextSyntaxLanguage) {
  const result = tokenizeSyntax(source, language);
  expect(result.limited).toBe(false);
  return result.lines!.flatMap((line) => line.tokens.map((token) => ({ text: line.text.slice(token.start, token.end), kind: token.kind })));
}

describe("Diffchecker language parity", () => {
  it("matches the live Syntax menu inspected on 2026-10-11, with Plain text replacing None", () => {
    expect(SYNTAX_LANGUAGE_OPTIONS.map(({ label }) => label)).toEqual([
      "Plain text", "C", "C++", "C#", "Clojure", "CSS", "Go", "Java", "JavaScript", "JSON", "Markdown",
      "Objective-C", "PHP", "Python", "HTML, XML", "Ruby", "Rust", "Shell", "SQL", "Swift", "TypeScript", "YAML"
    ]);
    expect(Object.keys(LANGUAGE_SAMPLES).sort()).toEqual([...languages].sort());
  });

  it.each(languages)("recognizes the representative %s sample and its changed version", (language) => {
    const { original, modified, expected } = LANGUAGE_SAMPLES[language];
    expect(original).not.toBe(modified);
    expect(tokens(original, language)).toEqual(expect.arrayContaining(expected));
    const expectedChanged = expected.filter(({ text }) => !["12", "12px", '"12"'].includes(text));
    expect(tokens(modified, language)).toEqual(expect.arrayContaining(expectedChanged));
    const changedToken = language === "markdown" ? { text: "count = 24", kind: "string" }
      : language === "htmlxml" ? { text: '\"24\"', kind: "string" }
      : { text: language === "css" ? "24px" : "24", kind: "number" };
    expect(tokens(modified, language)).toContainEqual(changedToken);
  });

  describe.each(languages)("%s source contracts", (language) => {
    it.each(["\n", "\r\n", "\r"])("preserves exact lines and valid UTF-16 token boundaries with %j", (ending) => {
      const source = `${LANGUAGE_SAMPLES[language].original}\n\t😀‍😀 árvíz <script> &\n`.replaceAll("\n", ending);
      const result = tokenizeSyntax(source, language);
      expect(result.limited).toBe(false);
      expect(result.lines!.map(({ text }) => text)).toEqual(source.split(/\r\n|\r|\n/));
      for (const line of result.lines!) {
        let previous = 0;
        for (const token of line.tokens) {
          expect(token.start).toBeGreaterThanOrEqual(previous);
          expect(token.end).toBeGreaterThan(token.start);
          expect(token.end).toBeLessThanOrEqual(line.text.length);
          for (const boundary of [token.start, token.end]) {
            expect(/[\uD800-\uDBFF]/.test(line.text[boundary - 1] ?? "") && /[\uDC00-\uDFFF]/.test(line.text[boundary] ?? "")).toBe(false);
          }
          previous = token.end;
        }
      }
    });

    it("enforces the same atomic size limits", () => {
      expect(tokenizeSyntax("x".repeat(SYNTAX_LIMITS.characters + 1), language)).toEqual({ lines: null, limited: true });
      expect(tokenizeSyntax("x".repeat(SYNTAX_LIMITS.lineLength + 1), language)).toEqual({ lines: null, limited: true });
      expect(tokenizeSyntax("\n".repeat(SYNTAX_LIMITS.lines), language)).toEqual({ lines: null, limited: true });
    });

    it("handles incomplete, foreign and untrusted syntax without losing source text", () => {
      for (const tail of ['"unterminated', "/* open\n nested", "<<EOF\nreturn", "```\n<script>", "r###\"open", "<!-- open", "#_([", "key: |\n  text"]) {
        const source = `${LANGUAGE_SAMPLES[language].original}\n${tail}`;
        const result = tokenizeSyntax(source, language);
        expect(result.limited).toBe(false);
        expect(result.lines!.map(({ text }) => text)).toEqual(source.split("\n"));
      }
    });
  });
});

describe("language-specific lexical behavior", () => {
  it("keeps C directives distinct from comments and C++ keywords", () => {
    expect(tokens('#define VALUE 12\nint classify = 1; // class', "c")).toEqual(expect.arrayContaining([
      { text: "#define", kind: "keyword" }, { text: "// class", kind: "comment" }
    ]));
    expect(tokens("class constexpr", "c")).toEqual([]);
    expect(tokens("class constexpr", "cpp")).toEqual([{ text: "class", kind: "keyword" }, { text: "constexpr", kind: "keyword" }]);
  });

  it("handles C++ raw delimiters and escaped prefixed characters", () => {
    expect(tokens('u8R"delim(a )" b\nreturn)delim"; L\'\\n\'; return;', "cpp")).toEqual(expect.arrayContaining([
      { text: 'u8R"delim(a )" b', kind: "string" }, { text: "return)delim\"", kind: "string" },
      { text: "L'\\n'", kind: "string" }, { text: "return", kind: "keyword" }
    ]));
  });

  it("handles C# escaped identifiers, verbatim strings and variable-length raw delimiters", () => {
    expect(tokens('var @class = @"a ""b""\nc"; var s = """"a """ b\nc""""; return;', "csharp")).toEqual(expect.arrayContaining([
      { text: "@class", kind: "property" }, { text: '@"a ""b""', kind: "string" },
      { text: '""""a """ b', kind: "string" }, { text: "return", kind: "keyword" }
    ]));
  });

  it("recognizes Clojure reader forms, qualified symbols, character literals and discarded expressions", () => {
    const result = tokens('; note\n(defn valid? [] {:user/name "x" :ratio 22/7 :pattern #"\\d+" :char \\newline})\n#_ (do (def hidden 1) ["}"])\n(def visible 2)', "clojure");
    expect(result).toEqual(expect.arrayContaining([
      { text: ":user/name", kind: "property" }, { text: "22/7", kind: "number" },
      { text: '#"\\d+"', kind: "string" }, { text: "\\newline", kind: "string" },
      { text: '#_ (do (def hidden 1) ["}"])', kind: "comment" }
    ]));
    expect(result.filter(({ kind, text }) => kind === "keyword" && text === "def")).toHaveLength(1);
  });

  it("recognizes CSS selectors, custom properties, color literals, units and URLs", () => {
    expect(tokens('.card { --accent: #aabbcc; width: 1.5rem; background: url(https://a.test/a#x); content: "/* text */"; }', "css")).toEqual(expect.arrayContaining([
      { text: ".card", kind: "type" }, { text: "--accent", kind: "property" }, { text: "#aabbcc", kind: "number" },
      { text: "1.5rem", kind: "number" }, { text: "url(https://a.test/a#x)", kind: "string" }
    ]));
  });

  it("keeps Go raw strings opaque while resuming at the following keyword", () => {
    expect(tokens('var text = `"\n// not a comment`; return text', "go")).toEqual(expect.arrayContaining([
      { text: '`"', kind: "string" }, { text: '// not a comment`', kind: "string" }, { text: "return", kind: "keyword" }
    ]));
  });

  it("recognizes Java text blocks without treating their contents as code", () => {
    expect(tokens('String s = """\nreturn /* text */\n"""; return s;', "java")).toEqual(expect.arrayContaining([
      { text: "return /* text */", kind: "string" }, { text: "return", kind: "keyword" }
    ]));
  });

  it("handles Markdown fences, inline code, escapes and incomplete fences", () => {
    const result = tokens('# Heading\n~~~js\n// text **still code**\n~~~\n\\*plain* and **bold** and `code`', "markdown");
    expect(result).toEqual(expect.arrayContaining([
      { text: "# Heading", kind: "keyword" }, { text: "// text **still code**", kind: "string" },
      { text: "**bold**", kind: "type" }, { text: "`code`", kind: "string" }
    ]));
    expect(tokens("````js\n```\nstill code", "markdown").at(-1)).toEqual({ text: "still code", kind: "string" });
  });

  it("recognizes Objective-C declarations and strings without coloring ordinary identifiers", () => {
    expect(tokens('@interface Greeter\nNSString *text = @"@end // text";\n@end', "objectivec")).toEqual(expect.arrayContaining([
      { text: "@interface", kind: "keyword" }, { text: "NSString", kind: "type" },
      { text: '@"@end // text"', kind: "string" }, { text: "@end", kind: "keyword" }
    ]));
  });

  it("recognizes PHP variables, case-insensitive words and indented nowdoc boundaries", () => {
    expect(tokens("FUNCTION greet() { $return = <<<'TEXT'\n  # not a comment\n  TEXT;\n  RETURN $return; }", "php")).toEqual(expect.arrayContaining([
      { text: "FUNCTION", kind: "keyword" }, { text: "$return", kind: "property" },
      { text: "  # not a comment", kind: "string" }, { text: "RETURN", kind: "keyword" }
    ]));
  });

  it("keeps markup text separate from tags, attributes, CDATA and raw text elements", () => {
    const result = tokens('<div title="a > b">Hello &amp; world<!-- note --><script>const s = "<fake>";</script><![CDATA[<x/>]]></div>', "htmlxml");
    expect(result).toEqual(expect.arrayContaining([
      { text: "div", kind: "keyword" }, { text: "title", kind: "property" }, { text: '"a > b"', kind: "string" },
      { text: "&amp;", kind: "type" }, { text: "<!-- note -->", kind: "comment" },
      { text: 'const s = "<fake>";', kind: "string" }, { text: "<![CDATA[<x/>]]>", kind: "string" }
    ]));
    expect(result.some(({ text }) => text === "fake")).toBe(false);
  });

  it("handles Ruby percent strings, symbols, variables, regex and block comments", () => {
    expect(tokens('def valid?\n@name = %q{a {nested} # string}\npattern = /a+/i\nlabel = :demo\n=begin\nreturn ignored\n=end\nreturn @name\nend', "ruby")).toEqual(expect.arrayContaining([
      { text: "%q{a {nested} # string}", kind: "string" }, { text: "@name", kind: "property" },
      { text: "/a+/i", kind: "string" }, { text: ":demo", kind: "property" }, { text: "return ignored", kind: "comment" }
    ]));
  });

  it("distinguishes Rust lifetimes, characters, escaped identifiers, raw strings and nested comments", () => {
    expect(tokens('fn f<\'a>(x: &\'a str) { let c = \'🦀\'; let r#type = br##"a "# b"##; /* a /* b */ c */ return; }', "rust")).toEqual(expect.arrayContaining([
      { text: "'a", kind: "type" }, { text: "'🦀'", kind: "string" }, { text: "r#type", kind: "property" },
      { text: 'br##"a "# b"##', kind: "string" }, { text: "/* a /* b */ c */", kind: "comment" }, { text: "return", kind: "keyword" }
    ]));
  });

  it("handles Shell quoted and tab-stripped heredocs, variables and non-comment hashes", () => {
    const result = tokens("echo foo#bar # comment\ncat <<-'EOF'\n\tif # literal\n\tEOF\nif true; then echo ${name:-guest} $count; fi", "shell");
    expect(result).toEqual(expect.arrayContaining([
      { text: "# comment", kind: "comment" }, { text: "\tif # literal", kind: "string" },
      { text: "if", kind: "keyword" }, { text: "${name:-guest}", kind: "property" }, { text: "$count", kind: "property" }
    ]));
    expect(result.some(({ text, kind }) => text.includes("#bar") && kind === "comment")).toBe(false);
  });

  it("recognizes SQL quoted identifiers, doubled quotes, nested comments and dollar quoting", () => {
    expect(tokens('select [order], "name", `key`, \'it\'\'s\', $tag$return -- string$tag$ /* a /* b */ c */ from users', "sql")).toEqual(expect.arrayContaining([
      { text: "[order]", kind: "property" }, { text: '"name"', kind: "property" }, { text: "`key`", kind: "property" },
      { text: "'it''s'", kind: "string" }, { text: "$tag$return -- string$tag$", kind: "string" },
      { text: "/* a /* b */ c */", kind: "comment" }, { text: "from", kind: "keyword" }
    ]));
  });

  it("handles Swift raw and multiline strings with nested comments", () => {
    expect(tokens('let s = ##"a "# b"##; let m = """\nreturn // literal\n"""; /* a /* b */ c */ return;', "swift")).toEqual(expect.arrayContaining([
      { text: '##"a "# b"##', kind: "string" }, { text: "return // literal", kind: "string" },
      { text: "/* a /* b */ c */", kind: "comment" }, { text: "return", kind: "keyword" }
    ]));
  });

  it("handles YAML flow mappings, quoted keys, scalars, anchors and indentation-sensitive blocks", () => {
    expect(tokens('"name": \'it\'\'s\'\nitems: {active: true, count: 12}\nurl: https://a.test/#part\ndetail: |2-\n  if # literal\nnext: &id false # note\ncopy: *id', "yaml")).toEqual(expect.arrayContaining([
      { text: '"name"', kind: "property" }, { text: "'it''s'", kind: "string" }, { text: "active", kind: "property" },
      { text: "true", kind: "keyword" }, { text: "12", kind: "number" }, { text: "https://a.test/#part", kind: "string" },
      { text: "  if # literal", kind: "string" }, { text: "next", kind: "property" }, { text: "&id", kind: "property" }, { text: "# note", kind: "comment" }
    ]));
  });

  it("handles escaped Ruby percent delimiters, quoted CSS URLs and PHP attributes", () => {
    expect(tokens('%q{a \\} b} return', "ruby")).toContainEqual({ text: "%q{a \\} b}", kind: "string" });
    expect(tokens('a { background: url("a)b.png"); }', "css")).toContainEqual({ text: 'url("a)b.png")', kind: "string" });
    const php = tokens('#[Route("/demo")] function greet() {} # comment', "php");
    expect(php).toContainEqual({ text: "function", kind: "keyword" });
    expect(php.filter(({ kind }) => kind === "comment")).toEqual([{ text: "# comment", kind: "comment" }]);
  });

  it("keeps typed numeric suffixes and range operators distinct in Rust and Swift", () => {
    expect(tokens("let n = 12u32; for i in 1..3 {}", "rust")).toEqual(expect.arrayContaining([
      { text: "12u32", kind: "number" }, { text: "1", kind: "number" }, { text: "..", kind: "punctuation" }, { text: "3", kind: "number" }
    ]));
    expect(tokens("for i in 1...3 {}", "swift")).toContainEqual({ text: "3", kind: "number" });
  });

  it.each(["c", "cpp", "csharp", "clojure", "css", "go", "java", "objectivec", "php", "ruby", "rust", "shell", "sql", "swift"] as const)("bounds token production in %s", (language) => {
    const source = ("1)".repeat(5000) + "\n").repeat(7);
    expect(tokenizeSyntax(source, language)).toEqual({ lines: null, limited: true });
  });

  it("bounds Markdown token production and keeps indentation-based YAML work finite", () => {
    expect(tokenizeSyntax(("**a** ".repeat(1500) + "\n").repeat(41), "markdown")).toEqual({ lines: null, limited: true });
    const yaml = "key: |\n" + "  text # opaque\n".repeat(18000) + "next: true";
    expect(tokens(yaml, "yaml").at(-1)).toEqual({ text: "true", kind: "keyword" });
  });

  it("bounds repeated failed Markdown link lookahead", () => {
    const source = ("[".repeat(19000) + "\n").repeat(25);
    expect(tokenizeSyntax(source, "markdown")).toEqual({ lines: null, limited: true });
  });

  it("scans long incomplete Swift raw-string prefixes without retrying every suffix", () => {
    const source = ("#".repeat(19000) + "\n").repeat(25) + "return 12";
    expect(tokens(source, "swift")).toContainEqual({ text: "return", kind: "keyword" });
  });
});
