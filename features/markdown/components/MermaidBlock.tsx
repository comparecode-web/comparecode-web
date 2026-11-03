"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MdAccountTree } from "react-icons/md";
import { readMermaidThemeVariables, renderMermaidDiagram } from "@/features/markdown/services/markdownMermaidRenderer";
import { MermaidDiagramToolbar } from "./MermaidDiagramToolbar";

interface MermaidBlockProps {
  chart: string;
  renderImmediately?: boolean;
}

interface MermaidRenderResult {
  key: string;
  svg: string;
  failed: boolean;
}

let renderCounter = 0;

export function MermaidBlock({ chart, renderImmediately = false }: MermaidBlockProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [themeVersion, setThemeVersion] = useState(0);
  const [isVisible, setIsVisible] = useState(renderImmediately);
  const [result, setResult] = useState<MermaidRenderResult | null>(null);
  const renderKey = `${themeVersion}\u0000${chart}`;
  const current = result?.key === renderKey ? result : null;

  useEffect(() => {
    if (typeof MutationObserver === "undefined") {
      return;
    }

    const observer = new MutationObserver(() => {
      setThemeVersion((value) => value + 1);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (isVisible || !element) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      const frameId = globalThis.requestAnimationFrame(() => setIsVisible(true));
      return () => globalThis.cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        setIsVisible(true);
      }
    }, { rootMargin: "240px" });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  useEffect(() => {
    const element = containerRef.current;
    if (!isVisible || current || !element) {
      return;
    }

    let isCancelled = false;
    const key = renderKey;
    const run = () => {
      renderCounter += 1;
      const id = `comparecode-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}-${renderCounter}`;

      renderMermaidDiagram({ id, chart, themeVariables: readMermaidThemeVariables(element) })
        .then((svg) => {
          if (!isCancelled) {
            setResult({ key, svg, failed: false });
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setResult({ key, svg: "", failed: true });
          }
        });
    };

    if (renderImmediately) {
      run();
      return () => {
        isCancelled = true;
      };
    }

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(run, { timeout: 1500 });
      return () => {
        isCancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(run, 120);
    return () => {
      isCancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, [chart, current, isVisible, reactId, renderImmediately, renderKey]);

  if (current?.failed) {
    return (
      <div ref={containerRef} className="cc-markdown-mermaid cc-markdown-mermaid-source" data-mermaid-state="error">
        <pre className="custom-scrollbar">{chart}</pre>
      </div>
    );
  }

  if (!current) {
    return (
      <div ref={containerRef} className="cc-markdown-mermaid cc-markdown-mermaid-pending" data-mermaid-state="pending">
        <div className="cc-markdown-mermaid-title">
          <MdAccountTree aria-hidden="true" />
          <span>Mermaid diagram</span>
        </div>
        <pre className="custom-scrollbar">{chart}</pre>
        <span className="cc-markdown-mermaid-status">{isVisible ? "Rendering diagram..." : "Diagram will render automatically when visible."}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="cc-markdown-mermaid group/diagram" data-mermaid-state="ready">
      <MermaidDiagramToolbar svg={current.svg} chart={chart} containerRef={containerRef} />
      <div className="cc-markdown-mermaid-svg custom-scrollbar" dangerouslySetInnerHTML={{ __html: current.svg }} />
    </div>
  );
}
