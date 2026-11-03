const languageAliases: Record<string, string> = {
  "c++": "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  "c#": "csharp",
  cs: "csharp",
  "f#": "fsharp",
  "objective-c": "objectivec",
  objc: "objectivec",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  golang: "go",
  kt: "kotlin",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  console: "shell",
  shellscript: "shell",
  ps1: "powershell",
  pwsh: "powershell",
  yml: "yaml",
  md: "markdown",
  htm: "html",
  xhtml: "html",
  svg: "xml",
  jsonc: "json",
  json5: "json"
};

const terminalLanguages = new Set(["shell", "powershell", "bat", "cmd", "terminal"]);

export interface MarkdownCodeLanguage {
  raw: string;
  id: string;
  isTerminal: boolean;
}

export function getMarkdownCodeLanguage(className: string | undefined): MarkdownCodeLanguage | null {
  const raw = /(?:^|\s)language-(\S+)/.exec(className ?? "")?.[1];
  if (!raw) {
    return null;
  }

  const normalized = raw.toLowerCase();
  const id = languageAliases[normalized] ?? normalized;

  return { raw, id, isTerminal: terminalLanguages.has(id) || normalized === "console" };
}
