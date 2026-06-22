"use client";

import { useRef, type RefObject } from "react";
import { MarkdownEditorPane } from "./MarkdownEditorPane";
import { MarkdownPreviewPane } from "./MarkdownPreviewPane";
import { useMarkdownScrollSync } from "@/features/markdown/hooks/useMarkdownScrollSync";
import { useResizableMarkdownSplit } from "@/features/markdown/hooks/useResizableMarkdownSplit";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

interface MarkdownSplitViewProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function MarkdownSplitView({ value, onChange, textareaRef }: MarkdownSplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncScrollEnabled = useMarkdownUIStore((state) => state.isSyncScrollEnabled);
  const editorPaneWidthPercent = useMarkdownUIStore((state) => state.editorPaneWidthPercent);
  const viewMode = useMarkdownUIStore((state) => state.viewMode);
  const setEditorPaneWidthPercent = useMarkdownUIStore((state) => state.setEditorPaneWidthPercent);

  const resizeHandlers = useResizableMarkdownSplit({
    containerRef,
    setEditorPaneWidthPercent
  });

  useMarkdownScrollSync({
    editorRef: textareaRef,
    previewRef,
    isEnabled: isSyncScrollEnabled
  });

  if (viewMode === "editor") {
    return (
      <div ref={containerRef} className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-bg-primary">
        <section className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="flex h-9 shrink-0 items-center border-b border-border-default bg-bg-secondary px-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
              Markdown
            </div>
            <MarkdownEditorPane value={value} onChange={onChange} textareaRef={textareaRef} />
          </div>
        </section>
      </div>
    );
  }

  if (viewMode === "preview") {
    return (
      <div ref={containerRef} className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-bg-primary">
        <section className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="flex h-9 shrink-0 items-center border-b border-border-default bg-bg-secondary px-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
              Preview
            </div>
            <MarkdownPreviewPane value={value} previewRef={previewRef} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-bg-primary sm:grid"
      style={{ gridTemplateColumns: `${editorPaneWidthPercent}fr 0.5rem ${100 - editorPaneWidthPercent}fr` }}
    >
      <section className="min-h-0 min-w-0 overflow-hidden border-b border-border-default sm:border-b-0 sm:border-r">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex h-9 shrink-0 items-center border-b border-border-default bg-bg-secondary px-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
            Markdown
          </div>
          <MarkdownEditorPane value={value} onChange={onChange} textareaRef={textareaRef} />
        </div>
      </section>

      <button
        type="button"
        title="Resize panels"
        className="hidden min-h-0 cursor-col-resize bg-border-default transition-colors hover:bg-accent-primary sm:block"
        {...resizeHandlers}
      />

      <section className="min-h-0 min-w-0 overflow-hidden">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex h-9 shrink-0 items-center border-b border-border-default bg-bg-secondary px-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
            Preview
          </div>
          <MarkdownPreviewPane value={value} previewRef={previewRef} />
        </div>
      </section>
    </div>
  );
}
