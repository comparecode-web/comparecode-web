"use client";

import { useRef, type RefObject } from "react";
import { MarkdownEditorPane } from "./MarkdownEditorPane";
import { MarkdownPreviewPane } from "./MarkdownPreviewPane";
import { MarkdownStatsBar } from "./MarkdownStatsBar";
import { useMarkdownScrollSync } from "@/features/markdown/hooks/useMarkdownScrollSync";
import { useResizableMarkdownSplit } from "@/features/markdown/hooks/useResizableMarkdownSplit";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

interface MarkdownSplitViewProps {
  value: string;
  onChange: (value: string, options?: { history?: "typing" | "checkpoint" | "skip" }) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

function MarkdownPaneHeader({ title, showStats, value }: { title: string; showStats?: boolean; value: string }) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border-default bg-bg-secondary px-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
      <span className="min-w-0 truncate">{title}</span>
      {showStats && (
        <span className="ml-auto min-w-0 shrink-0">
          <span className="hidden sm:block">
            <MarkdownStatsBar value={value} />
          </span>
          <span className="sm:hidden">
            <MarkdownStatsBar value={value} compact />
          </span>
        </span>
      )}
    </div>
  );
}

export function MarkdownSplitView({
  value,
  onChange,
  textareaRef,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: MarkdownSplitViewProps) {
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
            <MarkdownPaneHeader title="Markdown" showStats value={value} />
            <MarkdownEditorPane
              value={value}
              onChange={onChange}
              textareaRef={textareaRef}
              onUndo={onUndo}
              onRedo={onRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
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
            <MarkdownPaneHeader title="Preview" showStats value={value} />
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
          <MarkdownPaneHeader title="Markdown" value={value} />
          <MarkdownEditorPane
            value={value}
            onChange={onChange}
            textareaRef={textareaRef}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      </section>

      <button
        type="button"
        className="hidden min-h-0 cursor-ew-resize bg-border-default/35 transition-colors hover:bg-accent-primary/75 sm:block"
        {...resizeHandlers}
      />

      <section className="min-h-0 min-w-0 overflow-hidden">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <MarkdownPaneHeader title="Preview" showStats value={value} />
          <MarkdownPreviewPane value={value} previewRef={previewRef} />
        </div>
      </section>
    </div>
  );
}
