import type { TextSyntaxLanguage } from "@/types/settings";
import type { SyntaxKind } from "../tokenizeSyntax";

interface LanguageSample {
  original: string;
  modified: string;
  expected: readonly { text: string; kind: SyntaxKind }[];
}
const sample = (original: string, change: readonly [string, string], expected: LanguageSample["expected"]): LanguageSample => ({
  original, modified: original.replace(change[0], change[1]), expected
});

export const SYNTAX_REGRESSION_SAMPLES: Record<"ruby" | "shell" | "yaml", LanguageSample> = {
  ruby: sample('items = []\nvalue = 1\nitems << value\nitems<<value\nmessage = <<TEXT\nreturn # literal\nTEXT\nreturn 42', ["42", "43"], [
    { text: "return", kind: "keyword" }, { text: "return # literal", kind: "string" }, { text: "1", kind: "number" }
  ]),
  shell: sample('count=12\nshift=1\nresult=$((count << shift))\n((count << shift))\nread -r value <<<word\necho "$result"\ncat <<EOF\nreturn # literal\nEOF\nprintf "done\\n"', ["12", "24"], [
    { text: "echo", kind: "type" }, { text: "return # literal", kind: "string" }, { text: "printf", kind: "type" }
  ]),
  yaml: sample('message: hello true 123 null world # note\nmultiline: hello\n  true 123 null world\nflow: [hello true 123 null world, true, 123, null]\nnumber: 42', ["42", "43"], [
    { text: "hello true 123 null world", kind: "string" }, { text: "  true 123 null world", kind: "string" },
    { text: "true", kind: "keyword" }, { text: "123", kind: "number" }, { text: "# note", kind: "comment" }
  ])
};

export const LANGUAGE_SAMPLES: Record<Exclude<TextSyntaxLanguage, "plain">, LanguageSample> = {
  c: sample('#include <stdio.h>\n/* A local C sample */\nint main(void) {\n  const char *name = "CompareCode";\n  int count = 12;\n  printf("%s: %d\\n", name, count);\n  return 0;\n}', ["12", "24"], [
    { text: "#include", kind: "keyword" }, { text: "/* A local C sample */", kind: "comment" },
    { text: "int", kind: "type" }, { text: '"CompareCode"', kind: "string" }, { text: "12", kind: "number" }
  ]),
  cpp: sample('#include <string>\n// C++ raw strings preserve delimiters\nconstexpr int count = 12;\nstd::string message = R"tag(Hello "world"\nreturn // still a string)tag";\nclass Greeter {\npublic:\n  bool active = true;\n};', ["12", "24"], [
    { text: "constexpr", kind: "keyword" }, { text: "// C++ raw strings preserve delimiters", kind: "comment" },
    { text: 'R"tag(Hello "world"', kind: "string" }, { text: "12", kind: "number" }, { text: "bool", kind: "type" }
  ]),
  csharp: sample('// C# verbatim and raw strings\npublic record User(string Name);\nvar path = @"C:\\tools\\""demo""";\nvar message = """\nreturn // still a string\n""";\nint count = 12;\nreturn new User("CompareCode");', ["12", "24"], [
    { text: "record", kind: "keyword" }, { text: "string", kind: "type" }, { text: "// C# verbatim and raw strings", kind: "comment" },
    { text: '@"C:\\tools\\""demo"""', kind: "string" }, { text: "12", kind: "number" }
  ]),
  clojure: sample('; Clojure symbols and reader forms\n(ns demo.core)\n(defn greet [name]\n  (let [count 12\n        config {:active true :name "CompareCode"}]\n    #_(println "discarded")\n    (str name " / " count)))', ["12", "24"], [
    { text: "; Clojure symbols and reader forms", kind: "comment" }, { text: "defn", kind: "keyword" },
    { text: ":active", kind: "property" }, { text: '"CompareCode"', kind: "string" }, { text: "12", kind: "number" }
  ]),
  css: sample('/* Responsive card styling */\n@media (min-width: 40rem) {\n  .card:hover {\n    --accent: #aabbcc;\n    padding: 12px;\n    color: var(--accent);\n    content: "CompareCode";\n  }\n}', ["12px", "24px"], [
    { text: "/* Responsive card styling */", kind: "comment" }, { text: "@media", kind: "keyword" },
    { text: "padding", kind: "property" }, { text: "12px", kind: "number" }, { text: '"CompareCode"', kind: "string" }
  ]),
  go: sample('package main\n// Go raw strings span lines\nfunc greet(name string) string {\n  count := 12\n  message := `Hello\nreturn // still a string`\n  if count > 0 { return message + name }\n  return "Guest"\n}', ["12", "24"], [
    { text: "package", kind: "keyword" }, { text: "// Go raw strings span lines", kind: "comment" },
    { text: "string", kind: "type" }, { text: "`Hello", kind: "string" }, { text: "12", kind: "number" }
  ]),
  java: sample('// Java text blocks and primitive types\npublic class Greeter {\n  private int count = 12;\n  String message = """\n      Hello, CompareCode\n      """;\n  public String greet() {\n    return message;\n  }\n}', ["12", "24"], [
    { text: "class", kind: "keyword" }, { text: "// Java text blocks and primitive types", kind: "comment" },
    { text: "int", kind: "type" }, { text: "      Hello, CompareCode", kind: "string" }, { text: "12", kind: "number" }
  ]),
  javascript: sample('// JavaScript templates and regex\nconst count = 12;\nconst name = "CompareCode";\nconst message = `Hello ${name}!`;\nconst pattern = /hello\\s+world/i;\nfunction greet() {\n  return message;\n}', ["12", "24"], [
    { text: "const", kind: "keyword" }, { text: "// JavaScript templates and regex", kind: "comment" },
    { text: '"CompareCode"', kind: "string" }, { text: "/hello\\s+world/i", kind: "string" }, { text: "12", kind: "number" }
  ]),
  json: sample('{\n  "name": "CompareCode",\n  "count": 12,\n  "active": true,\n  "empty": null,\n  "items": ["alpha", "beta"]\n}', ["12", "24"], [
    { text: '"name"', kind: "property" }, { text: '"CompareCode"', kind: "string" },
    { text: "true", kind: "keyword" }, { text: "12", kind: "number" }
  ]),
  markdown: sample('# CompareCode sample\n\n<!-- Local Markdown source -->\nUse **bold**, *emphasis* and `inline code`.\n\n[Documentation](https://example.com/docs)\n\n```text\ncount = 12\n```', ["12", "24"], [
    { text: "# CompareCode sample", kind: "keyword" }, { text: "<!-- Local Markdown source -->", kind: "comment" },
    { text: "**bold**", kind: "type" }, { text: "`inline code`", kind: "string" },
    { text: "[Documentation](https://example.com/docs)", kind: "property" }
  ]),
  objectivec: sample('#import <Foundation/Foundation.h>\n// Objective-C declarations and literals\n@interface Greeter : NSObject\n@property (nonatomic, copy) NSString *name;\n@end\n@implementation Greeter\n- (NSString *)greet {\n  NSInteger count = 12;\n  return @"CompareCode";\n}\n@end', ["12", "24"], [
    { text: "@interface", kind: "keyword" }, { text: "// Objective-C declarations and literals", kind: "comment" },
    { text: "NSString", kind: "type" }, { text: '@"CompareCode"', kind: "string" }, { text: "12", kind: "number" }
  ]),
  php: sample('<?php\n// PHP variables and nowdoc\nfunction greet(string $name): string {\n  $count = 12;\n  $message = <<<\'TEXT\'\nreturn // still a string\nTEXT;\n  return "CompareCode: " . $name;\n}', ["12", "24"], [
    { text: "function", kind: "keyword" }, { text: "// PHP variables and nowdoc", kind: "comment" },
    { text: "$count", kind: "property" }, { text: "return // still a string", kind: "string" }, { text: "12", kind: "number" }
  ]),
  python: sample('# Python prefixes and triple strings\ndef greet(name: str):\n    count = 12\n    message = r"""Hello\nreturn # still a string\n"""\n    if count > 0:\n        return f"CompareCode: {name}"', ["12", "24"], [
    { text: "def", kind: "keyword" }, { text: "# Python prefixes and triple strings", kind: "comment" },
    { text: "str", kind: "type" }, { text: "return # still a string", kind: "string" }, { text: "12", kind: "number" }
  ]),
  htmlxml: sample('<?xml version="1.0"?>\n<!-- Markup is displayed as text -->\n<panel id="demo" count="12">\n  <title>CompareCode &amp; syntax</title>\n  <content><![CDATA[<script>not executable</script>]]></content>\n</panel>', ['count="12"', 'count="24"'], [
    { text: "<!-- Markup is displayed as text -->", kind: "comment" }, { text: "panel", kind: "keyword" },
    { text: "count", kind: "property" }, { text: '"12"', kind: "string" }, { text: "&amp;", kind: "type" }
  ]),
  ruby: sample('# Ruby symbols, percent strings and heredoc\ndef greet(name)\n  count = 12\n  options = {active: true, label: :demo}\n  message = %q{Hello "CompareCode"}\n  detail = <<~TEXT\n    return # still a string\n  TEXT\n  return message + name\nend', ["12", "24"], [
    { text: "def", kind: "keyword" }, { text: "# Ruby symbols, percent strings and heredoc", kind: "comment" },
    { text: ":demo", kind: "property" }, { text: '%q{Hello "CompareCode"}', kind: "string" }, { text: "12", kind: "number" }
  ]),
  rust: sample('// Rust raw strings, lifetimes and nested comments\nfn greet<\'a>(name: &\'a str) -> &\'a str {\n    let count: u32 = 12;\n    let message = r##"Hello "CompareCode"\nreturn // still a string"##;\n    /* outer /* inner */ outer */\n    if count > 0 { return name; }\n    name\n}', ["12", "24"], [
    { text: "fn", kind: "keyword" }, { text: "// Rust raw strings, lifetimes and nested comments", kind: "comment" },
    { text: "'a", kind: "type" }, { text: 'r##"Hello "CompareCode"', kind: "string" }, { text: "12", kind: "number" }
  ]),
  shell: sample('#!/usr/bin/env bash\n# Shell variables and quoted heredoc\ncount=12\nname="CompareCode"\nif [ "$count" -gt 0 ]; then\n  cat <<\'TEXT\'\nreturn # still a string\nTEXT\n  echo ${name:-Guest}\nfi', ["12", "24"], [
    { text: "#!/usr/bin/env bash", kind: "comment" }, { text: "if", kind: "keyword" },
    { text: '"CompareCode"', kind: "string" }, { text: "${name:-Guest}", kind: "property" }, { text: "12", kind: "number" }
  ]),
  sql: sample('-- SQL keywords are case insensitive\nCREATE TABLE users (name VARCHAR(100), count INTEGER);\nINSERT INTO users VALUES (\'CompareCode\', 12);\nSELECT "name", count\nFROM users\nWHERE count > 0 AND name <> \'It\'\'s empty\'\nORDER BY count DESC;', ["12", "24"], [
    { text: "-- SQL keywords are case insensitive", kind: "comment" }, { text: "SELECT", kind: "keyword" },
    { text: "INTEGER", kind: "type" }, { text: "'It''s empty'", kind: "string" }, { text: "12", kind: "number" }
  ]),
  swift: sample('// Swift raw strings and nested comments\nstruct Greeter {\n  let count: Int = 12\n  let message = #"Hello "CompareCode""#\n  /* outer /* inner */ outer */\n  func greet(name: String) -> String {\n    guard count > 0 else { return "Guest" }\n    return message + name\n  }\n}', ["12", "24"], [
    { text: "struct", kind: "keyword" }, { text: "// Swift raw strings and nested comments", kind: "comment" },
    { text: "Int", kind: "type" }, { text: '#"Hello "CompareCode""#', kind: "string" }, { text: "12", kind: "number" }
  ]),
  typescript: sample('// TypeScript interfaces and built-in types\ninterface User { name: string; active: boolean }\nconst count: number = 12;\nconst message = `Hello ${user.name}!`;\nfunction greet(user: User): string {\n  if (user.active) return "CompareCode: " + user.name;\n  return "Guest";\n}', ["12", "24"], [
    { text: "interface", kind: "keyword" }, { text: "// TypeScript interfaces and built-in types", kind: "comment" },
    { text: "number", kind: "type" }, { text: '"Guest"', kind: "string" }, { text: "12", kind: "number" }
  ]),
  yaml: sample('# YAML keys, anchors and block scalars\ndefaults: &defaults\n  name: "CompareCode"\n  count: 12\n  active: true\n  description: |-\n    return # still a string\n    Hello, world\ncopy: *defaults\nempty: null', ["12", "24"], [
    { text: "# YAML keys, anchors and block scalars", kind: "comment" }, { text: "name", kind: "property" },
    { text: '"CompareCode"', kind: "string" }, { text: "true", kind: "keyword" }, { text: "12", kind: "number" }
  ])
};
