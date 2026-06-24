"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { MarkdownEditorPane } from "./MarkdownEditorPane";
import { MarkdownPreviewPane } from "./MarkdownPreviewPane";
import { MarkdownStatsBar } from "./MarkdownStatsBar";
import { useMarkdownScrollSync } from "@/features/markdown/hooks/useMarkdownScrollSync";
import { useResizableMarkdownSplit } from "@/features/markdown/hooks/useResizableMarkdownSplit";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";
import { cn } from "@/utils/uiHelpers";

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
        <span className="min-w-0 shrink-0 sm:ml-auto">
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

function useMobileMarkdownLayout() {
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateMobileLayout = () => {
      setIsMobileLayout(mediaQuery.matches);
    };

    updateMobileLayout();
    mediaQuery.addEventListener("change", updateMobileLayout);

    return () => {
      mediaQuery.removeEventListener("change", updateMobileLayout);
    };
  }, []);

  return isMobileLayout;
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
  const [mobileSplitPane, setMobileSplitPane] = useState<"editor" | "preview">("editor");
  const isMobileLayout = useMobileMarkdownLayout();
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
    isEnabled: isSyncScrollEnabled,
    syncKey: `${viewMode}:${mobileSplitPane}`
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

  if (isMobileLayout) {
    const isEditorPaneVisible = mobileSplitPane === "editor";

    return (
      <div ref={containerRef} className="flex w-full min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden bg-bg-primary max-sm:w-[100dvw] max-sm:max-w-[100dvw]">
        <div className="flex w-full min-w-0 max-w-full shrink-0 items-center gap-1 overflow-hidden border-b border-border-default bg-bg-secondary p-1">
          {(["editor", "preview"] as const).map((pane) => (
            <button
              key={pane}
              type="button"
              onClick={() => setMobileSplitPane(pane)}
              className={cn(
                "h-8 w-28 min-w-0 rounded px-3 text-sm font-semibold transition-colors",
                mobileSplitPane === pane
                  ? "bg-accent-primary text-white"
                  : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
              )}
            >
              {pane === "editor" ? "Editor" : "Preview"}
            </button>
          ))}
        </div>
        <section className="min-h-0 min-w-0 max-w-full flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            <MarkdownPaneHeader title={isEditorPaneVisible ? "Markdown" : "Preview"} showStats value={value} />
            {isEditorPaneVisible ? (
              <MarkdownEditorPane
                value={value}
                onChange={onChange}
                textareaRef={textareaRef}
                onUndo={onUndo}
                onRedo={onRedo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            ) : (
              <MarkdownPreviewPane value={value} previewRef={previewRef} />
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="grid min-h-0 min-w-0 flex-1 overflow-hidden bg-bg-primary"
      style={{ gridTemplateColumns: `${editorPaneWidthPercent}fr 0.5rem ${100 - editorPaneWidthPercent}fr` }}
    >
      <section className="min-h-0 min-w-0 overflow-hidden border-r border-border-default">
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
        className="min-h-0 cursor-ew-resize bg-border-default/35 transition-colors hover:bg-accent-primary/75"
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
