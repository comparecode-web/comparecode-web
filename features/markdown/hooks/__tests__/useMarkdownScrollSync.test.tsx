import { useRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMarkdownScrollSync } from "@/features/markdown/hooks/useMarkdownScrollSync";

function defineScrollMetrics(element: HTMLElement, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
}

function ScrollSyncHarness({ syncKey }: { syncKey: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useMarkdownScrollSync({
    editorRef,
    previewRef,
    isEnabled: true,
    syncKey
  });

  return (
    <>
      <div data-testid="editor" ref={editorRef} />
      <div key={syncKey} data-testid="preview" ref={previewRef} />
    </>
  );
}

describe("useMarkdownScrollSync", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reattaches scroll sync when the preview pane is remounted", () => {
    const { rerender } = render(<ScrollSyncHarness syncKey="split:editor" />);
    const editor = screen.getByTestId("editor");
    const firstPreview = screen.getByTestId("preview");

    defineScrollMetrics(editor, 300, 100);
    defineScrollMetrics(firstPreview, 500, 100);
    editor.scrollTop = 50;
    fireEvent.scroll(editor);

    expect(firstPreview.scrollTop).toBe(100);

    rerender(<ScrollSyncHarness syncKey="split:preview" />);

    const remountedPreview = screen.getByTestId("preview");
    defineScrollMetrics(editor, 300, 100);
    defineScrollMetrics(remountedPreview, 500, 100);
    editor.scrollTop = 100;
    fireEvent.scroll(editor);

    expect(remountedPreview.scrollTop).toBe(200);
  });
});
