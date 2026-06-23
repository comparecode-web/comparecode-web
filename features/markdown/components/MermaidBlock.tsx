"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MdAccountTree } from "react-icons/md";

interface MermaidBlockProps {
  chart: string;
}

function readThemeVariable(name: string, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function getMermaidThemeVariables() {
  const mermaidBg = readThemeVariable("--markdown-mermaid-bg", "#eef2f7");
  const mermaidSurface = readThemeVariable("--markdown-mermaid-surface", "#ffffff");
  const mermaidBorder = readThemeVariable("--markdown-mermaid-border", "#c7d0dc");

  return {
    background: "transparent",
    mainBkg: mermaidSurface,
    secondBkg: mermaidBg,
    primaryColor: mermaidSurface,
    primaryTextColor: readThemeVariable("--text-primary", "#24292e"),
    primaryBorderColor: mermaidBorder,
    lineColor: readThemeVariable("--text-secondary", "#6b7280"),
    secondaryColor: mermaidSurface,
    tertiaryColor: mermaidBg,
    noteBkgColor: readThemeVariable("--markdown-alert-note-bg", "#dbeafe"),
    noteTextColor: readThemeVariable("--text-primary", "#24292e"),
    noteBorderColor: readThemeVariable("--markdown-alert-note-border", "#2563eb"),
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
  };
}

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);

  const renderChart = useCallback(async () => {
    setIsRendering(true);
    setError("");

    try {
      const mermaid = (await import("mermaid/dist/mermaid.esm.min.mjs")).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: getMermaidThemeVariables()
      });

      const id = `comparecode-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}-${themeVersion}`;
      const result = await mermaid.render(id, chart);

      setSvg(result.svg);
    } catch (err) {
      setSvg("");
      setError(err instanceof Error ? err.message : "Unable to render Mermaid diagram.");
    } finally {
      setIsRendering(false);
    }
  }, [chart, reactId, themeVersion]);

  useEffect(() => {
    setSvg("");
    setError("");
  }, [chart, themeVersion]);

  useEffect(() => {
    if (typeof MutationObserver === "undefined") {
      return;
    }

    const observer = new MutationObserver(() => {
      setThemeVersion((current) => current + 1);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });

    return () => {
      observer.disconnect();
    };
  }, []);

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
      <div className="rounded-md border border-[var(--markdown-mermaid-border)] bg-[var(--markdown-mermaid-bg)] p-3 text-sm text-text-primary">
        <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 custom-scrollbar">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div ref={containerRef} className="flex flex-col gap-3 rounded-md border border-[var(--markdown-mermaid-border)] bg-[var(--markdown-mermaid-bg)] p-4 text-sm text-text-secondary shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          <MdAccountTree className="text-lg text-accent-primary" />
          <span>Mermaid diagram</span>
        </div>
        <pre className="max-h-56 overflow-auto rounded border border-[var(--markdown-code-border)] bg-[var(--markdown-code-bg)] p-3 font-mono text-xs leading-5 text-text-secondary custom-scrollbar">
          {chart}
        </pre>
        <span className="text-xs font-semibold text-text-secondary">{isRendering ? "Rendering diagram..." : "Diagram will render automatically when visible."}</span>
      </div>
    );
  }

  return (
    <div
      className="overflow-auto rounded-md border border-[var(--markdown-mermaid-border)] bg-[var(--markdown-mermaid-bg)] p-4 text-text-primary shadow-sm custom-scrollbar [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
