import type { ReactNode } from "react";
import { cn } from "@/utils/uiHelpers";

interface CodeBlockProps {
  children: string;
  language?: string;
  inline?: boolean;
}

const KEYWORDS = new Set([
  "as",
  "async",
  "await",
  "const",
  "else",
  "export",
  "false",
  "from",
  "function",
  "if",
  "import",
  "interface",
  "let",
  "null",
  "return",
  "string",
  "true",
  "type",
  "undefined"
]);

const TOKEN_PATTERN = /(\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b|[{}()[\]:;,.?=|<>+-])/g;

function isHighlightable(language?: string): boolean {
  return language === "ts" || language === "tsx" || language === "js" || language === "jsx" || language === "typescript" || language === "javascript";
}

function getTokenClass(token: string, previousToken: string | null): string {
  if (token.startsWith("//") || token.startsWith("/*")) {
    return "text-slate-500";
  }

  if (token.startsWith("\"") || token.startsWith("'") || token.startsWith("`")) {
    return "text-blue-700";
  }

  if (/^\d/.test(token)) {
    return "text-emerald-700";
  }

  if (KEYWORDS.has(token)) {
    return token === "string" ? "text-orange-600" : "text-rose-600";
  }

  if (previousToken === "function" || previousToken === "type" || previousToken === "interface") {
    return "text-violet-700";
  }

  if (/^[{}()[\]:;,.?=|<>+-]$/.test(token)) {
    return "text-slate-700";
  }

  return "text-slate-950";
}

function renderHighlightedCode(value: string, language?: string) {
  if (!isHighlightable(language)) {
    return value;
  }

  const nodes: Array<ReactNode> = [];
  let lastIndex = 0;
  let previousToken: string | null = null;

  for (const match of value.matchAll(TOKEN_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(value.slice(lastIndex, index));
    }

    nodes.push(
      <span key={`${index}-${token}`} className={getTokenClass(token, previousToken)}>
        {token}
      </span>
    );

    if (/\b[A-Za-z_$][\w$]*\b/.test(token)) {
      previousToken = token;
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  return nodes;
}

export function CodeBlock({ children, language, inline = false }: CodeBlockProps) {
  if (inline) {
    return (
      <code className="max-w-full rounded border border-blue-100 bg-slate-50 px-1.5 py-0.5 font-mono text-[0.9em] text-blue-700">
        {renderHighlightedCode(children, "ts")}
      </code>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-md bg-slate-50">
      <pre className="min-w-0 max-w-full overflow-auto p-4 text-sm leading-7 custom-scrollbar">
        <code className={cn("font-mono text-slate-950", language && `language-${language}`)}>
          {renderHighlightedCode(children, language)}
        </code>
      </pre>
    </div>
  );
}
