"use client";

import type React from "react";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";
import { cn } from "@/utils/uiHelpers";

interface MarkdownEditorPaneProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function MarkdownEditorPane({ value, onChange, textareaRef }: MarkdownEditorPaneProps) {
  const isWordWrapEnabled = useMarkdownUIStore((state) => state.isWordWrapEnabled);
  const fontSize = useMarkdownUIStore((state) => state.fontSize);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      className={cn(
        "h-full min-w-0 w-full max-w-full resize-none border-0 bg-bg-primary p-4 font-mono text-text-primary outline-none custom-scrollbar sm:p-6",
        isWordWrapEnabled ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"
      )}
      style={{
        fontSize: `${fontSize}px`
      }}
    />
  );
}
