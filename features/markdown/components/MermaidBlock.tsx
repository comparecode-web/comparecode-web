"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MdAccountTree } from "react-icons/md";

interface MermaidBlockProps {
  chart: string;
}

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [isRendering, setIsRendering] = useState(false);

  const renderChart = useCallback(async () => {
    setIsRendering(true);
    setError("");

    try {
      const mermaid = (await import("mermaid/dist/mermaid.esm.min.mjs")).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "default"
      });

      const id = `comparecode-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
      const result = await mermaid.render(id, chart);

      setSvg(result.svg);
    } catch (err) {
      setSvg("");
      setError(err instanceof Error ? err.message : "Unable to render Mermaid diagram.");
    } finally {
      setIsRendering(false);
    }
  }, [chart, reactId]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || svg || isRendering) {
      return;
    }

    let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;

    const scheduleRender = () => {
      if ("requestIdleCallback" in window) {
        const idleId = window.requestIdleCallback(() => {
          renderChart();
        }, { timeout: 1500 });

        return () => window.cancelIdleCallback(idleId);
      }

      timeoutId = globalThis.setTimeout(() => {
        renderChart();
      }, 120);

      return () => {
        if (timeoutId !== null) {
          globalThis.clearTimeout(timeoutId);
        }
      };
    };

    if (!("IntersectionObserver" in window)) {
      return scheduleRender();
    }

    let cancelScheduledRender: (() => void) | null = null;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        cancelScheduledRender = scheduleRender();
      }
    }, { rootMargin: "240px" });

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelScheduledRender?.();
    };
  }, [isRendering, renderChart, svg]);

  if (error) {
    return (
      <div className="rounded-md border border-border-default bg-bg-secondary p-3 text-sm text-text-primary">
        <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 custom-scrollbar">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div ref={containerRef} className="flex flex-col gap-3 rounded-md border border-border-default bg-bg-secondary p-4 text-sm text-text-secondary">
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          <MdAccountTree className="text-lg text-accent-primary" />
          <span>Mermaid diagram</span>
        </div>
        <pre className="max-h-56 overflow-auto rounded border border-border-default bg-bg-primary p-3 font-mono text-xs leading-5 text-text-secondary custom-scrollbar">
          {chart}
        </pre>
        <span className="text-xs font-semibold text-text-secondary">{isRendering ? "Rendering diagram..." : "Diagram will render automatically when visible."}</span>
      </div>
    );
  }

  return (
    <div
      className="overflow-auto rounded-md border border-border-default bg-bg-secondary p-3 custom-scrollbar [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
