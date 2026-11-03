import { TEXT_SYNTAX_LANGUAGES, type TextSyntaxLanguage } from "@/types/settings";

const languageLabels: Record<TextSyntaxLanguage, string> = {
  plain: "Plain text", c: "C", cpp: "C++", csharp: "C#", clojure: "Clojure", css: "CSS", go: "Go",
  java: "Java", javascript: "JavaScript", json: "JSON", markdown: "Markdown", objectivec: "Objective-C",
  php: "PHP", python: "Python", htmlxml: "HTML, XML", ruby: "Ruby", rust: "Rust", shell: "Shell",
  sql: "SQL", swift: "Swift", typescript: "TypeScript", yaml: "YAML"
};
export const SYNTAX_LANGUAGE_OPTIONS = TEXT_SYNTAX_LANGUAGES.map((value) => ({ value, label: languageLabels[value] }));

const javascriptKeywords = new Set((
  "async await break case catch class const continue debugger default delete do else export extends finally " +
  "for from function get if import in instanceof let new of return set static super switch this throw try typeof " +
  "var void while with yield true false null"
).split(" "));

const typescriptKeywords = new Set([
  ...javascriptKeywords,
  ...("abstract as asserts declare enum implements infer interface is keyof namespace never override private " +
    "protected public readonly satisfies type unique using").split(" ")
]);

const pythonKeywords = new Set((
  "and as assert async await break case class continue def del elif else except False finally for from global " +
  "if import in is lambda match None nonlocal not or pass raise return True try while with yield"
).split(" "));

const typescriptTypes = new Set("any bigint boolean number object string symbol unknown undefined".split(" "));
const pythonTypes = new Set("bool bytes complex dict float frozenset int list object set str tuple type".split(" "));

export function getWordKind(word: string, language: "javascript" | "typescript" | "json" | "python"): "keyword" | "type" | undefined {
  if (language === "json") return ["true", "false", "null"].includes(word) ? "keyword" : undefined;
  if (language === "python") return pythonKeywords.has(word) ? "keyword" : pythonTypes.has(word) ? "type" : undefined;
  if (language === "typescript" && typescriptTypes.has(word)) return "type";
  return (language === "typescript" ? typescriptKeywords : javascriptKeywords).has(word) ? "keyword" : undefined;
}
