"use client";

import { useMemo, useState, type RefObject } from "react";
import { MdContentCopy, MdOpenInFull } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useToastStore } from "@/store/useToastStore";
import { downloadBlob } from "@/utils/downloadBlob";
import { normalizeDiagramSvg, renderDiagramPngWithFallback } from "@/features/markdown/services/markdownDiagramExport";
import { readMermaidThemeVariables, renderMermaidDiagram } from "@/features/markdown/services/markdownMermaidRenderer";
import { markdownExportExcludeAttribute } from "@/features/markdown/services/markdownExport";
import { MermaidViewerDialog } from "./MermaidViewerDialog";

interface MermaidDiagramToolbarProps {
  svg: string;
  chart: string;
  containerRef: RefObject<HTMLDivElement | null>;
}

let fallbackCounter = 0;

function getDiagramNumber(container: HTMLElement | null): number {
  const root = container?.closest(".cc-markdown");
  const diagrams = root ? Array.from(root.querySelectorAll(".cc-markdown-mermaid")) : [];
  return Math.max(1, diagrams.indexOf(container as Element) + 1);
}

export function MermaidDiagramToolbar({ svg, chart, containerRef }: MermaidDiagramToolbarProps) {
  const pushToast = useToastStore((state) => state.pushToast);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const normalized = useMemo(() => normalizeDiagramSvg(svg), [svg]);
  const excludeProps = { [markdownExportExcludeAttribute]: "" };

  const createPng = () => {
    const container = containerRef.current;
    if (!container) {
      return Promise.reject(new Error("The diagram is not available."));
    }

    const background = getComputedStyle(container).getPropertyValue("--markdown-mermaid-bg").trim() || "#ffffff";
    return renderDiagramPngWithFallback(svg, background, () => {
      fallbackCounter += 1;
      return renderMermaidDiagram({
        id: `comparecode-mermaid-export-${fallbackCounter}`,
        chart,
        themeVariables: readMermaidThemeVariables(container),
        htmlLabels: false
      });
    });
  };

  const download = async (format: "png" | "svg") => {
    const fileName = `comparecode-diagram-${getDiagramNumber(containerRef.current)}.${format}`;
    try {
      if (format === "svg") {
        if (!normalized) {
          throw new Error("The diagram could not be exported.");
        }
        downloadBlob(new Blob([normalized.markup], { type: "image/svg+xml;charset=utf-8" }), fileName);
        return;
      }

      downloadBlob(await createPng(), fileName);
    } catch {
      pushToast({ message: "The diagram could not be downloaded.", tone: "warning", icon: "warning", dedupeKey: "markdown-diagram-download-error" });
    }
  };

  const copy = async () => {
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        throw new Error("Image copy is not supported.");
      }

      await navigator.clipboard.write([new ClipboardItem({ "image/png": createPng() })]);
      pushToast({ message: "Diagram image copied.", tone: "success", icon: "success", dedupeKey: "markdown-diagram-copied" });
    } catch {
      pushToast({ message: "This browser could not copy the diagram image. Download it as PNG instead.", tone: "warning", icon: "warning", dedupeKey: "markdown-diagram-copy-error" });
    }
  };

  return (
    <>
      <div
        {...excludeProps}
        role="toolbar"
        aria-label="Diagram actions"
        className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg border border-border-default bg-bg-primary/95 p-0.5 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover/diagram:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <IconButton size="sm" title="Expand diagram" aria-label="Expand diagram" disabled={!normalized} onClick={() => setIsViewerOpen(true)}><MdOpenInFull /></IconButton>
        <IconButton size="sm" title="Copy diagram image" aria-label="Copy diagram image" onClick={() => void copy()}><MdContentCopy /></IconButton>
        <Button size="sm" variant="ghost" onClick={() => void download("png")}>PNG</Button>
        <Button size="sm" variant="ghost" onClick={() => void download("svg")}>SVG</Button>
      </div>
      {normalized && isViewerOpen && (
        <MermaidViewerDialog open={isViewerOpen} onOpenChange={setIsViewerOpen} svg={normalized} onDownload={(format) => void download(format)} />
      )}
    </>
  );
}
