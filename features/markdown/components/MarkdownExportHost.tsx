"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { MarkdownDocumentRenderer, type MarkdownRenderOptions } from "./MarkdownDocumentRenderer";
import { markdownExportContentWidth, markdownExportExcludeAttribute, type MarkdownExportMode } from "@/features/markdown/services/markdownExport";

export interface MarkdownExportJob {
  id: number;
  mode: MarkdownExportMode;
  theme: string;
  value: string;
  fontSize: number;
}

interface MarkdownExportHostProps {
  job: MarkdownExportJob;
  onMount: (article: HTMLElement) => void;
}

const printCss = `
@media print {
  @page { margin: 16mm; }
  body > :not([data-markdown-export-host]) { display: none !important; }
  html, body { height: auto !important; overflow: visible !important; background: var(--bg-primary) !important; }
  [data-markdown-export-host] { position: static !important; left: auto !important; width: auto !important; visibility: visible !important; }
  [data-markdown-export-host] * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  [data-markdown-export-host] [${markdownExportExcludeAttribute}] { display: none !important; }
}
@media screen {
  [data-markdown-export-host] { visibility: hidden; }
}
`;

export function MarkdownExportHost({ job, onMount }: MarkdownExportHostProps) {
  const articleRef = useRef<HTMLElement | null>(null);
  const options = useMemo<MarkdownRenderOptions>(() => ({ renderDiagramsImmediately: true }), []);

  useLayoutEffect(() => {
    if (articleRef.current) {
      onMount(articleRef.current);
    }
  }, [job.id, onMount]);

  return createPortal(
    <div
      data-markdown-export-host=""
      data-theme={job.theme}
      aria-hidden="true"
      inert
      className="pointer-events-none fixed top-0 bg-bg-primary text-text-primary"
      style={{ left: "-100000px", width: `${markdownExportContentWidth + 48}px` }}
    >
      {job.mode === "print" && <style>{printCss}</style>}
      <article ref={articleRef} className="cc-markdown px-6 py-6" data-export={job.mode} style={{ fontSize: `${job.fontSize}px` }}>
        <MarkdownDocumentRenderer value={job.value} options={options} />
      </article>
    </div>,
    document.body
  );
}
