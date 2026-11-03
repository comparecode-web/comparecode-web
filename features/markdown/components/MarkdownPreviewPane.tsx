"use client";

import { MarkdownDocumentRenderer } from "./MarkdownDocumentRenderer";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

interface MarkdownPreviewPaneProps {
  value: string;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export function MarkdownPreviewPane({ value, previewRef }: MarkdownPreviewPaneProps) {
  const fontSize = useMarkdownUIStore((state) => state.fontSize);

  return (
    <div ref={previewRef} data-markdown-preview="" className="h-full min-w-0 overflow-auto overflow-x-hidden bg-bg-primary custom-scrollbar">
      <article className="cc-markdown mx-auto px-4 py-1 sm:px-6" style={{ fontSize: `${fontSize}px` }}>
        <MarkdownDocumentRenderer value={value} />
      </article>
    </div>
  );
}
