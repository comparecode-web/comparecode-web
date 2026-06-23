"use client";

import type React from "react";
import { useMemo, useRef } from "react";
import { buildMarkdownPasteResult } from "@/features/markdown/services/markdownPaste";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";
import { cn } from "@/utils/uiHelpers";

interface MarkdownEditorPaneProps {
  value: string;
  onChange: (value: string, options?: { history?: "typing" | "checkpoint" | "skip" }) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function MarkdownEditorPane({
  value,
  onChange,
  textareaRef,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: MarkdownEditorPaneProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const isWordWrapEnabled = useMarkdownUIStore((state) => state.isWordWrapEnabled);
  const fontSize = useMarkdownUIStore((state) => state.fontSize);
  const lineNumbers = useMemo(() => {
    const count = value.split(/\r\n|\r|\n/).length;
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [value]);
  const editorStyle = {
    fontSize: `${fontSize}px`,
    lineHeight: "1.5"
  };

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const result = buildMarkdownPasteResult({
      value,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
      clipboardData: event.clipboardData
    });

    if (!result) {
      return;
    }

    event.preventDefault();
    onChange(result.value, { history: "checkpoint" });

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isModifierPressed = event.ctrlKey || event.metaKey;
    if (!isModifierPressed || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey && canUndo) {
      event.preventDefault();
      onUndo?.();
      return;
    }

    if ((key === "y" || (key === "z" && event.shiftKey)) && canRedo) {
      event.preventDefault();
      onRedo?.();
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 max-w-full overflow-hidden bg-bg-primary">
      <div
        ref={gutterRef}
        className="min-h-0 w-12 shrink-0 overflow-hidden border-r border-border-default bg-bg-secondary/70 px-2 py-4 text-right font-mono text-text-secondary select-none sm:py-6"
        style={editorStyle}
      >
        {lineNumbers.map((lineNumber) => (
          <div key={lineNumber} className="h-[1.5em] tabular-nums">
            {lineNumber}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={handleScroll}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className={cn(
          "h-full min-w-0 flex-1 resize-none border-0 bg-bg-primary p-4 font-mono text-text-primary outline-none custom-scrollbar sm:p-6",
          isWordWrapEnabled ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"
        )}
        style={editorStyle}
      />
    </div>
  );
}
