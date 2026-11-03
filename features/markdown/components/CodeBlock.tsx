"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MdCheck, MdContentCopy, MdTerminal } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/store/useToastStore";
import { getMarkdownCodeLanguage } from "@/features/markdown/services/markdownCodeLanguage";
import { highlightMarkdownCode } from "@/features/markdown/services/markdownCodeHighlight";

interface CodeBlockProps {
  children: string;
  className?: string;
  inline?: boolean;
}

function renderHighlightedCode(value: string, languageId: string | undefined): ReactNode {
  const lines = highlightMarkdownCode(value, languageId);
  if (!lines) {
    return value;
  }

  return lines.map((line, lineIndex) => {
    const nodes: Array<ReactNode> = [];
    let cursor = 0;

    for (const token of line.tokens) {
      if (token.start > cursor) {
        nodes.push(line.text.slice(cursor, token.start));
      }

      nodes.push(
        <span key={token.start} className={`cc-token-${token.kind}`}>
          {line.text.slice(token.start, token.end)}
        </span>
      );
      cursor = token.end;
    }

    if (cursor < line.text.length) {
      nodes.push(line.text.slice(cursor));
    }

    return (
      <span key={lineIndex}>
        {nodes}
        {lineIndex < lines.length - 1 ? "\n" : null}
      </span>
    );
  });
}

function CodeCopyButton({ value, label }: { value: string; label: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const pushToast = useToastStore((state) => state.pushToast);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsCopied(false), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [isCopied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
    } catch {
      pushToast({
        message: "The code could not be copied. Select it and copy it manually.",
        tone: "warning",
        icon: "warning",
        dedupeKey: "markdown-code-copy-error"
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      data-export-exclude=""
      aria-label={isCopied ? `${label} code copied` : `Copy ${label} code`}
      leftIcon={isCopied ? <MdCheck /> : <MdContentCopy />}
      onClick={() => void copy()}
    >
      {isCopied ? "Copied" : "Copy"}
    </Button>
  );
}

export function CodeBlock({ children, className, inline = false }: CodeBlockProps) {
  const language = getMarkdownCodeLanguage(className);
  const highlighted = useMemo(() => inline ? null : renderHighlightedCode(children, language?.id), [children, inline, language?.id]);

  if (inline) {
    return <code className="cc-markdown-inline-code">{children}</code>;
  }

  const label = language?.raw ?? "Text";

  return (
    <div className="cc-markdown-code" data-code-language={language?.id ?? "plain"}>
      <div className="cc-markdown-code-header">
        <span className="cc-markdown-code-language" title={label}>
          {language?.isTerminal && <MdTerminal aria-hidden="true" />}
          <span>{label}</span>
        </span>
        <CodeCopyButton value={children} label={label} />
      </div>
      <pre className="custom-scrollbar">
        <code className={className}>{highlighted}</code>
      </pre>
    </div>
  );
}
