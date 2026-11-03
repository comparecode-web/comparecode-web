import { useEffect, useRef, type RefObject } from "react";

interface ScrollSyncInput {
  editorRef: RefObject<HTMLElement | null>;
  previewRef: RefObject<HTMLElement | null>;
  isEnabled: boolean;
  syncKey?: string;
}

function getScrollRatio(element: HTMLElement): number {
  const maxScroll = element.scrollHeight - element.clientHeight;
  if (maxScroll <= 0) {
    return 0;
  }

  return element.scrollTop / maxScroll;
}

function setScrollRatio(element: HTMLElement, ratio: number): void {
  const maxScroll = element.scrollHeight - element.clientHeight;
  element.scrollTop = maxScroll * ratio;
}

const scrollSyncPauseMs = 400;
let scrollSyncPausedUntil = 0;

export function pauseMarkdownScrollSync() {
  scrollSyncPausedUntil = performance.now() + scrollSyncPauseMs;
}

export function useMarkdownScrollSync({ editorRef, previewRef, isEnabled, syncKey }: ScrollSyncInput): void {
  const activeSourceRef = useRef<"editor" | "preview" | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    const preview = previewRef.current;

    if (!editor || !preview || !isEnabled) {
      return;
    }

    const sync = (source: HTMLElement, target: HTMLElement, sourceName: "editor" | "preview") => {
      if (performance.now() < scrollSyncPausedUntil) {
        return;
      }

      if (activeSourceRef.current && activeSourceRef.current !== sourceName) {
        return;
      }

      activeSourceRef.current = sourceName;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        setScrollRatio(target, getScrollRatio(source));
        window.setTimeout(() => {
          activeSourceRef.current = null;
        }, 60);
      });
    };

    let previewScrollHeight = preview.scrollHeight;
    const onEditorScroll = () => sync(editor, preview, "editor");
    const onPreviewScroll = () => {
      // A preview scroll that comes with a height change is the browser keeping its place after an edit, not the reader scrolling.
      if (preview.scrollHeight !== previewScrollHeight) {
        previewScrollHeight = preview.scrollHeight;
        return;
      }

      sync(preview, editor, "preview");
    };

    editor.addEventListener("scroll", onEditorScroll, { passive: true });
    preview.addEventListener("scroll", onPreviewScroll, { passive: true });

    return () => {
      editor.removeEventListener("scroll", onEditorScroll);
      preview.removeEventListener("scroll", onPreviewScroll);
      activeSourceRef.current = null;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [editorRef, isEnabled, previewRef, syncKey]);
}
