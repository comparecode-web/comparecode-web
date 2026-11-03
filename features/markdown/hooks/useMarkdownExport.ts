import { useCallback, useRef, useState } from "react";
import { useToastStore } from "@/store/useToastStore";
import { downloadBlob } from "@/utils/downloadBlob";
import { canAllocateCanvas } from "@/utils/canvasBudget";
import type { MarkdownExportJob } from "@/features/markdown/components/MarkdownExportHost";
import type { MarkdownExportAction } from "@/features/markdown/components/MarkdownToolbar";
import {
  buildMarkdownStandaloneHtml,
  createUnavailableImagePlaceholder,
  getMarkdownDocumentTitle,
  getReferencedCssVariables,
  markdownExportContentWidth,
  markdownExportExcludeAttribute,
  markdownExportFileName,
  markdownExportMaxWidth,
  prepareMarkdownExportClone,
  readCssVariables,
  type MarkdownExportMode
} from "@/features/markdown/services/markdownExport";
import { markdownContentCss } from "@/features/markdown/styles/markdownContentStyles";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

const diagramTimeoutMs = 15_000;
const imageTimeoutMs = 10_000;
const pngScales = [2, 1.5, 1];

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForDiagrams(root: HTMLElement) {
  const deadline = Date.now() + diagramTimeoutMs;
  while (root.querySelector("[data-mermaid-state='pending']") && Date.now() < deadline) {
    await delay(100);
  }
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(images.map((image) => image.complete
    ? Promise.resolve()
    : Promise.race([image.decode().catch(() => undefined), delay(imageTimeoutMs)])));
}

async function waitForExportContent(root: HTMLElement) {
  await waitForDiagrams(root);
  await document.fonts?.ready;
  await waitForImages(root);
}

function getCurrentTheme(): string {
  return document.documentElement.getAttribute("data-theme") || "light";
}

function excludeControls(node: Node): boolean {
  return !(node instanceof Element && node.hasAttribute(markdownExportExcludeAttribute));
}

function openCollapsedSections(root: HTMLElement) {
  root.querySelectorAll("details").forEach((details) => {
    details.open = true;
  });
}

function widenForWideContent(article: HTMLElement) {
  const host = article.parentElement;
  if (!host) {
    return;
  }

  const overflow = Math.max(0, article.scrollWidth - article.clientWidth);
  if (overflow > 0) {
    host.style.width = `${Math.min(markdownExportMaxWidth, markdownExportContentWidth + 48 + overflow)}px`;
  }
}

export function useMarkdownExport() {
  const pushToast = useToastStore((state) => state.pushToast);
  const [job, setJob] = useState<MarkdownExportJob | null>(null);
  const jobIdRef = useRef(0);
  const mountResolverRef = useRef<((article: HTMLElement) => void) | null>(null);
  const isBusy = job !== null;

  const handleMount = useCallback((article: HTMLElement) => {
    mountResolverRef.current?.(article);
    mountResolverRef.current = null;
  }, []);

  const withExportInstance = useCallback(async <T,>(mode: MarkdownExportMode, theme: string, run: (article: HTMLElement, job: MarkdownExportJob) => Promise<T>) => {
    jobIdRef.current += 1;
    const mounted = new Promise<HTMLElement>((resolve) => {
      mountResolverRef.current = resolve;
    });
    const exportJob: MarkdownExportJob = {
      id: jobIdRef.current,
      mode,
      theme,
      value: useMarkdownStore.getState().markdownText,
      fontSize: useMarkdownUIStore.getState().fontSize
    };

    setJob(exportJob);

    try {
      const article = await mounted;
      await waitForExportContent(article);
      return await run(article, exportJob);
    } finally {
      setJob(null);
    }
  }, []);

  const exportPng = useCallback(async () => {
    let unavailableImages = 0;

    const blob = await withExportInstance("image", getCurrentTheme(), async (article) => {
      openCollapsedSections(article);
      widenForWideContent(article);
      await delay(50);
      const width = article.scrollWidth;
      const height = article.scrollHeight;
      const scale = pngScales.find((candidate) => canAllocateCanvas(Math.ceil(width * candidate), Math.ceil(height * candidate)));
      if (!scale) {
        return null;
      }

      const { domToBlob } = await import("modern-screenshot");
      return domToBlob(article, {
        scale,
        type: "image/png",
        backgroundColor: getComputedStyle(article).getPropertyValue("--bg-primary").trim() || "#ffffff",
        filter: excludeControls,
        fetch: {
          placeholderImage: (image) => {
            unavailableImages += 1;
            return createUnavailableImagePlaceholder(image instanceof HTMLImageElement ? image.alt : "");
          }
        }
      });
    });

    if (!blob) {
      pushToast({ message: "This document is too long for a single image. Use Print / Save as PDF instead.", tone: "warning", icon: "warning", dedupeKey: "markdown-export-png-too-large" });
      return;
    }

    downloadBlob(blob, `${markdownExportFileName}.png`);
    if (unavailableImages > 0) {
      pushToast({
        message: unavailableImages === 1 ? "1 image could not be included in the PNG." : `${unavailableImages} images could not be included in the PNG.`,
        tone: "warning",
        icon: "warning",
        dedupeKey: "markdown-export-png-images"
      });
    }
  }, [pushToast, withExportInstance]);

  const exportHtml = useCallback(async () => {
    const html = await withExportInstance("html", getCurrentTheme(), async (article, exportJob) => buildMarkdownStandaloneHtml({
      title: getMarkdownDocumentTitle(exportJob.value),
      bodyHtml: prepareMarkdownExportClone(article).innerHTML,
      themeVariables: readCssVariables(article, getReferencedCssVariables(markdownContentCss)),
      fontSize: exportJob.fontSize
    }));

    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${markdownExportFileName}.html`);
  }, [withExportInstance]);

  const print = useCallback(async () => {
    await withExportInstance("print", "light", async (article) => {
      openCollapsedSections(article);
      await new Promise<void>((resolve) => {
        const finish = () => {
          window.removeEventListener("afterprint", finish);
          resolve();
        };
        window.addEventListener("afterprint", finish);
        window.print();
        window.setTimeout(finish, 60_000);
      });
    });
  }, [withExportInstance]);

  const copyFormatted = useCallback(async () => {
    const content = await withExportInstance("html", getCurrentTheme(), async (article) => {
      const clone = prepareMarkdownExportClone(article);
      // The export instance is disposable, so remove its controls in place and keep the rendered line breaks of innerText.
      article.querySelectorAll(`[${markdownExportExcludeAttribute}]`).forEach((element) => element.remove());
      return { html: clone.innerHTML, text: article.innerText };
    });

    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([content.html], { type: "text/html" }),
        "text/plain": new Blob([content.text], { type: "text/plain" })
      })]);
    } else {
      await navigator.clipboard.writeText(content.text);
    }

    pushToast({ message: "Formatted text copied.", tone: "success", icon: "success", dedupeKey: "markdown-copy-formatted" });
  }, [pushToast, withExportInstance]);

  const runExport = useCallback(async (action: MarkdownExportAction) => {
    if (isBusy) {
      return;
    }

    const value = useMarkdownStore.getState().markdownText;
    try {
      switch (action) {
        case "markdown":
          downloadBlob(new Blob([value], { type: "text/markdown;charset=utf-8" }), `${markdownExportFileName}.md`);
          return;
        case "copyMarkdown":
          await navigator.clipboard.writeText(value);
          pushToast({ message: "Markdown copied.", tone: "success", icon: "success", dedupeKey: "markdown-copy-markdown" });
          return;
        case "copyFormatted":
          await copyFormatted();
          return;
        case "html":
          await exportHtml();
          return;
        case "png":
          await exportPng();
          return;
        case "print":
          await print();
          return;
      }
    } catch {
      pushToast({ message: "The export could not be completed. Try again.", tone: "warning", icon: "warning", dedupeKey: "markdown-export-error" });
    }
  }, [copyFormatted, exportHtml, exportPng, isBusy, print, pushToast]);

  return { exportJob: job, isExporting: isBusy, runExport, handleExportMount: handleMount };
}
