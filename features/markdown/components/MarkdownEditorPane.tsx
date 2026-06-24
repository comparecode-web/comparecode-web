"use client";

import type React from "react";
import { useMemo, useRef, useState } from "react";
import { MdUploadFile } from "react-icons/md";
import { IconButton } from "@/components/ui/IconButton";
import {
  findFirstSupportedMarkdownTextFile,
  MarkdownFileImportError,
  readMarkdownTextFile
} from "@/features/markdown/services/markdownFileImport";
import { buildMarkdownPasteResult } from "@/features/markdown/services/markdownPaste";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";
import { useToastStore } from "@/store/useToastStore";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const isWordWrapEnabled = useMarkdownUIStore((state) => state.isWordWrapEnabled);
  const fontSize = useMarkdownUIStore((state) => state.fontSize);
  const pushToast = useToastStore((state) => state.pushToast);
  const lineNumbers = useMemo(() => {
    const count = value.split(/\r\n|\r|\n/).length;
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [value]);
  const editorStyle = {
    fontSize: `${fontSize}px`,
    lineHeight: "1.5"
  };

  const isFileDrag = (dataTransfer: DataTransfer) => Array.from(dataTransfer.types).includes("Files");

  const importFile = async (file: File) => {
    try {
      const importedText = await readMarkdownTextFile(file);
      onChange(importedText, { history: "checkpoint" });

      window.requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
          return;
        }

        textarea.focus();
        textarea.setSelectionRange(importedText.length, importedText.length);
      });

      pushToast({
        message: `Imported ${file.name}`,
        tone: "success",
        icon: "success",
        dedupeKey: "markdown-file-import-success"
      });
    } catch (error) {
      const message = error instanceof MarkdownFileImportError && error.code === "file-too-large"
        ? "Markdown import supports files up to 5 MB."
        : "Drop a Markdown or text file to import.";

      pushToast({
        message,
        tone: "warning",
        icon: "warning",
        dedupeKey: "markdown-file-import-error"
      });
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = findFirstSupportedMarkdownTextFile(files);
    if (!file) {
      pushToast({
        message: "Drop a Markdown or text file to import.",
        tone: "warning",
        icon: "warning",
        dedupeKey: "markdown-file-import-error"
      });
      return;
    }

    void importFile(file);
  };

  const resetDragState = () => {
    dragDepthRef.current = 0;
    setIsDraggingFile(false);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    resetDragState();
    handleFiles(event.dataTransfer.files);
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
    <div
      className="relative flex h-full w-full min-w-0 max-w-full overflow-hidden bg-bg-primary"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
      <IconButton
        variant="toolbar"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        title="Import Markdown or text file"
        className="absolute right-3 top-3 bg-bg-primary/95 shadow-sm backdrop-blur-sm"
      >
        <span className="text-lg"><MdUploadFile /></span>
      </IconButton>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.mdown,.mkd,.txt,.text,text/plain,text/markdown"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {isDraggingFile && (
        <div className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-md border-2 border-dashed border-accent-primary bg-accent-primary/10 text-sm font-bold text-accent-primary backdrop-blur-[1px]">
          Drop Markdown or text file to import
        </div>
      )}
    </div>
  );
}
