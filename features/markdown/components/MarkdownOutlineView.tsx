"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { MdContentCopy } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/utils/uiHelpers";
import { buildMarkdownTableOfContents, getMarkdownDocument, markdownHeadingIdPrefix } from "@/features/markdown/services/markdownDocument";
import { pauseMarkdownScrollSync } from "@/features/markdown/hooks/useMarkdownScrollSync";
import { revealTextareaLine } from "@/features/markdown/services/markdownTextareaPosition";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";

interface MarkdownOutlineViewProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

const outlineIndentClasses = ["pl-2", "pl-5", "pl-8", "pl-11", "pl-14", "pl-17"];

function getPreviewScroller(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-markdown-preview]");
}

function useActiveHeadingId(ids: Array<string>): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let frameId = 0;
    let scroller: HTMLElement | null = null;

    const update = () => {
      frameId = 0;
      const container = getPreviewScroller();
      if (!container) {
        setActiveId(null);
        return;
      }

      const top = container.getBoundingClientRect().top + 24;
      let current: string | null = null;
      for (const id of ids) {
        const element = document.getElementById(`${markdownHeadingIdPrefix}${id}`);
        if (element && element.getBoundingClientRect().top <= top) {
          current = id;
        }
      }
      setActiveId(current ?? ids[0] ?? null);
    };

    const schedule = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(update);
      }
    };

    const attach = () => {
      const next = getPreviewScroller();
      if (next === scroller) {
        return;
      }
      scroller?.removeEventListener("scroll", schedule);
      scroller = next;
      scroller?.addEventListener("scroll", schedule, { passive: true });
      schedule();
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      scroller?.removeEventListener("scroll", schedule);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [ids]);

  return activeId;
}

export function MarkdownOutlineView({ textareaRef }: MarkdownOutlineViewProps) {
  const markdownText = useMarkdownStore((state) => state.markdownText);
  const pushToast = useToastStore((state) => state.pushToast);
  const headings = useMemo(() => getMarkdownDocument(markdownText).headings, [markdownText]);
  const ids = useMemo(() => headings.map((heading) => heading.id), [headings]);
  const activeId = useActiveHeadingId(ids);
  const minimumDepth = headings.reduce((minimum, heading) => Math.min(minimum, heading.depth), 6);

  const navigate = (id: string, line: number) => {
    pauseMarkdownScrollSync();
    const target = document.getElementById(`${markdownHeadingIdPrefix}${id}`);
    const previewScroller = getPreviewScroller();
    if (target && previewScroller?.contains(target)) {
      target.scrollIntoView({ block: "start" });
    }

    const textarea = textareaRef.current;
    if (textarea) {
      window.requestAnimationFrame(() => revealTextareaLine(textarea, line));
    }
  };

  const copyTableOfContents = async () => {
    const toc = buildMarkdownTableOfContents(headings);
    if (!toc) {
      pushToast({ message: "Add level 2 to 4 headings to build a table of contents.", tone: "info", icon: "info", dedupeKey: "markdown-toc-empty" });
      return;
    }

    try {
      await navigator.clipboard.writeText(toc);
      pushToast({ message: "Table of contents copied.", tone: "success", icon: "success", dedupeKey: "markdown-toc-copied" });
    } catch {
      pushToast({ message: "The table of contents could not be copied.", tone: "warning", icon: "warning", dedupeKey: "markdown-toc-copy-error" });
    }
  };

  if (headings.length === 0) {
    return <p className="p-4 text-sm text-text-secondary">No headings yet. Add a heading, for example <code className="font-mono">## Section</code>, to see it here.</p>;
  }

  return (
    <div className="flex min-h-full flex-col">
      <nav aria-label="Document outline" className="flex-1 p-2">
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-0.5">
          {headings.map((heading) => (
            <li key={`${heading.id}-${heading.offset}`} className="min-w-0">
              <button
                type="button"
                aria-current={activeId === heading.id ? "location" : undefined}
                className={cn(
                  "w-full truncate rounded-md py-1 pr-2 text-left text-sm transition-colors hover:bg-hover-overlay hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
                  activeId === heading.id ? "bg-hover-overlay font-semibold text-accent" : "text-text-secondary",
                  heading.depth === minimumDepth && "font-semibold",
                  outlineIndentClasses[Math.min(outlineIndentClasses.length - 1, heading.depth - minimumDepth)]
                )}
                onClick={() => navigate(heading.id, heading.line)}
              >
                {heading.text || "Untitled heading"}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sticky bottom-0 border-t border-border-default bg-bg-primary p-2">
        <Button size="sm" variant="outline" className="w-full" leftIcon={<MdContentCopy />} onClick={() => void copyTableOfContents()}>
          Copy table of contents
        </Button>
      </div>
    </div>
  );
}
