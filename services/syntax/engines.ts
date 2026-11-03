import type { TextSyntaxLanguage } from "@/types/settings";
import { scanCode } from "./codeEngines";
import { scanCss, scanMarkdown, scanMarkup, scanYaml } from "./documentEngines";
import type { EmitToken } from "./scannerSupport";

export type AdditionalLanguage = Exclude<TextSyntaxLanguage, "plain" | "javascript" | "typescript" | "json" | "python">;
type Engine = (source: string, emit: EmitToken, exhausted: () => boolean) => boolean;

export const SYNTAX_ENGINES: Record<AdditionalLanguage, Engine> = {
  c: (source, emit, exhausted) => scanCode(source, "c", emit, exhausted),
  cpp: (source, emit, exhausted) => scanCode(source, "cpp", emit, exhausted),
  csharp: (source, emit, exhausted) => scanCode(source, "csharp", emit, exhausted),
  clojure: (source, emit, exhausted) => scanCode(source, "clojure", emit, exhausted),
  css: scanCss,
  go: (source, emit, exhausted) => scanCode(source, "go", emit, exhausted),
  java: (source, emit, exhausted) => scanCode(source, "java", emit, exhausted),
  markdown: scanMarkdown,
  objectivec: (source, emit, exhausted) => scanCode(source, "objectivec", emit, exhausted),
  php: (source, emit, exhausted) => scanCode(source, "php", emit, exhausted),
  htmlxml: scanMarkup,
  ruby: (source, emit, exhausted) => scanCode(source, "ruby", emit, exhausted),
  rust: (source, emit, exhausted) => scanCode(source, "rust", emit, exhausted),
  shell: (source, emit, exhausted) => scanCode(source, "shell", emit, exhausted),
  sql: (source, emit, exhausted) => scanCode(source, "sql", emit, exhausted),
  swift: (source, emit, exhausted) => scanCode(source, "swift", emit, exhausted),
  yaml: scanYaml
};
