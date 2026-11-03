import { useEffect } from "react";
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownExportHost } from "@/features/markdown/components/MarkdownExportHost";
import { useMarkdownExport } from "@/features/markdown/hooks/useMarkdownExport";
import { useMarkdownStore } from "@/features/markdown/store/useMarkdownStore";
import { useMarkdownUIStore } from "@/features/markdown/store/useMarkdownUIStore";

const downloads = vi.hoisted(() => [] as Array<{ blob: Blob; name: string }>);
const screenshot = vi.hoisted(() => ({ domToBlob: vi.fn(async () => new Blob(["png"], { type: "image/png" })) }));

vi.mock("@/utils/downloadBlob", () => ({
  downloadBlob: (blob: Blob, name: string) => downloads.push({ blob, name })
}));
vi.mock("modern-screenshot", () => screenshot);
vi.mock("@/utils/canvasBudget", () => ({ canAllocateCanvas: () => true }));

let exporter: ReturnType<typeof useMarkdownExport> | null = null;

async function runExport(action: Parameters<ReturnType<typeof useMarkdownExport>["runExport"]>[0]) {
  act(() => {
    void exporter?.runExport(action);
  });
  await waitFor(() => expect(downloads.length).toBeGreaterThan(0));
}

function Harness() {
  const value = useMarkdownExport();
  useEffect(() => {
    exporter = value;
  });
  return value.exportJob ? <MarkdownExportHost job={value.exportJob} onMount={value.handleExportMount} /> : null;
}

describe("useMarkdownExport", () => {
  beforeEach(() => {
    downloads.length = 0;
    screenshot.domToBlob.mockClear();
    useMarkdownStore.setState({ markdownText: "# Release notes\n\n[Jump](#details)\n\n## Details\n\n<details><summary>More</summary>\n\nHidden\n\n</details>", isLoaded: true });
    useMarkdownUIStore.setState({ fontSize: 18 });
  });

  it("downloads Markdown without rendering an export instance", async () => {
    render(<Harness />);

    await runExport("markdown");

    expect(downloads[0].name).toBe("comparecode-document.md");
    expect(await downloads[0].blob.text()).toContain("# Release notes");
  });

  it("renders a standalone HTML file from an export instance independent of the preview", async () => {
    render(<Harness />);

    await runExport("html");

    const html = await downloads[0].blob.text();
    expect(downloads[0].name).toBe("comparecode-document.html");
    expect(html).toContain("<title>Release notes</title>");
    expect(html).toContain("id=\"user-content-details\"");
    expect(html).toContain("href=\"#user-content-details\"");
    expect(html).toContain("font-size: 18px");
    expect(html).not.toContain("data-export-exclude");
    await waitFor(() => expect(document.querySelector("[data-markdown-export-host]")).toBeNull());
  });

  it("captures the PNG with collapsed sections opened and controls excluded", async () => {
    render(<Harness />);

    await runExport("png");

    expect(screenshot.domToBlob).toHaveBeenCalledTimes(1);
    const [article, options] = screenshot.domToBlob.mock.calls[0] as unknown as [HTMLElement, { scale: number; filter: (node: Node) => boolean }];
    expect(article.getAttribute("data-export")).toBe("image");
    expect(article.querySelector("details")?.open).toBe(true);
    expect(options.scale).toBe(2);
    const control = document.createElement("button");
    control.setAttribute("data-export-exclude", "");
    expect(options.filter(control)).toBe(false);
    expect(downloads[0].name).toBe("comparecode-document.png");
  });

  describe("with the document changing or containing controls", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      Reflect.deleteProperty(document, "fonts");
      Reflect.deleteProperty(HTMLElement.prototype, "innerText");
    });

    it("builds the HTML title and font size from the text captured when the export started", async () => {
      let releaseFonts: () => void = () => undefined;
      Object.defineProperty(document, "fonts", { configurable: true, value: { ready: new Promise<void>((resolve) => { releaseFonts = resolve; }) } });
      render(<Harness />);

      act(() => {
        void exporter?.runExport("html");
      });
      await waitFor(() => expect(document.querySelector("[data-markdown-export-host]")).not.toBeNull());
      act(() => {
        useMarkdownStore.setState({ markdownText: "# After export" });
        useMarkdownUIStore.setState({ fontSize: 12 });
      });
      releaseFonts();
      await waitFor(() => expect(downloads.length).toBeGreaterThan(0));

      const html = await downloads[0].blob.text();
      expect(html).toContain("<title>Release notes</title>");
      expect(html).toContain("font-size: 18px");
      expect(html).not.toContain("After export");
    });

    it("leaves control labels out of both formatted clipboard representations", async () => {
      Object.defineProperty(HTMLElement.prototype, "innerText", { configurable: true, get(this: HTMLElement) { return this.textContent ?? ""; } });
      const write = vi.fn(async () => undefined);
      vi.stubGlobal("ClipboardItem", class {
        items: Record<string, Blob>;
        constructor(items: Record<string, Blob>) {
          this.items = items;
        }
      });
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { write, writeText: vi.fn() } });
      useMarkdownStore.setState({ markdownText: "Intro\n\n```js\nconst value = 1\n```" });
      render(<Harness />);

      act(() => {
        void exporter?.runExport("copyFormatted");
      });
      await waitFor(() => expect(write).toHaveBeenCalledTimes(1));

      const [[[item]]] = write.mock.calls as unknown as [[[{ items: Record<string, Blob> }]]];
      const text = await item.items["text/plain"].text();
      const html = await item.items["text/html"].text();
      expect(text).toContain("const value = 1");
      expect(text).not.toContain("Copy");
      expect(html).toContain("const");
      expect(html).not.toContain("Copy");
    });

    it("hides controls in the printed document", () => {
      render(<MarkdownExportHost job={{ id: 1, mode: "print", theme: "light", value: "```js\nx\n```", fontSize: 16 }} onMount={vi.fn()} />);

      const printCss = document.querySelector("[data-markdown-export-host] style")?.textContent ?? "";
      expect(printCss).toMatch(/@media print \{[\s\S]*\[data-export-exclude\] \{ display: none !important; \}/);
      expect(document.querySelector("[data-markdown-export-host] [data-export-exclude]")).not.toBeNull();
    });
  });
});
