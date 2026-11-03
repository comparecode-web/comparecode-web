import { describe, expect, it } from "vitest";
import { normalizeDiagramSvg } from "@/features/markdown/services/markdownDiagramExport";
import { clampDiagramZoom, getDiagramContentBox, getDiagramFitZoom, zoomDiagramAt } from "@/features/markdown/services/markdownDiagramViewport";
import { markdownMermaidTemplates } from "@/features/markdown/services/markdownMermaidTemplates";

describe("diagram viewport", () => {
  it("fits content into the view within the zoom limits", () => {
    expect(getDiagramFitZoom({ width: 432, height: 332 }, { width: 800, height: 300 })).toBe(0.5);
    expect(getDiagramFitZoom({ width: 10_000, height: 10_000 }, { width: 10, height: 10 })).toBe(10);
    expect(clampDiagramZoom(0.01)).toBe(0.1);
  });

  it("keeps the point under the cursor fixed while zooming", () => {
    const view = { width: 400, height: 300 };
    const content = { width: 200, height: 100 };
    const start = { zoom: 1, panX: 0, panY: 0 };
    const point = { x: 300, y: 150 };
    const next = zoomDiagramAt(start, 2, point, view);
    const before = getDiagramContentBox(start, view, content);
    const after = getDiagramContentBox(next, view, content);

    expect((point.x - before.left) / before.width).toBeCloseTo((point.x - after.left) / after.width, 2);
  });

  it("uses whole pixels for the content box", () => {
    const box = getDiagramContentBox({ zoom: 1.333, panX: 0.4, panY: 0.6 }, { width: 401, height: 301 }, { width: 123, height: 77 });

    expect(Number.isInteger(box.left) && Number.isInteger(box.top) && Number.isInteger(box.width) && Number.isInteger(box.height)).toBe(true);
  });
});

describe("normalizeDiagramSvg", () => {
  it("gives the SVG its intrinsic size from the view box", () => {
    const result = normalizeDiagramSvg("<svg viewBox=\"0 0 320 180\" width=\"100%\" style=\"max-width: 320px;\"><text>Hi</text></svg>");

    expect(result).toMatchObject({ width: 320, height: 180 });
    expect(result?.markup).toContain("width=\"320\"");
    expect(result?.markup).toContain("height=\"180\"");
    expect(result?.markup).not.toContain("max-width");
  });

  it("produces well-formed XML for Mermaid HTML labels with line breaks", () => {
    const result = normalizeDiagramSvg("<svg viewBox=\"0 0 100 50\"><foreignObject width=\"100\" height=\"50\"><div xmlns=\"http://www.w3.org/1999/xhtml\"><p>First<br>Second</p></div></foreignObject></svg>");
    const xml = new DOMParser().parseFromString(result?.markup ?? "", "image/svg+xml");

    expect(result).not.toBeNull();
    expect(xml.querySelector("parsererror")).toBeNull();
    expect(xml.documentElement.textContent).toBe("FirstSecond");
  });

  it("rejects markup that is not a sized SVG", () => {
    expect(normalizeDiagramSvg("<div></div>")).toBeNull();
    expect(normalizeDiagramSvg("<svg></svg>")).toBeNull();
  });
});

describe("Mermaid templates", () => {
  it("provides unique, labelled templates with a diagram type on the first line", () => {
    const ids = markdownMermaidTemplates.map((template) => template.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const template of markdownMermaidTemplates) {
      expect(template.label).toMatch(/^[A-Z][a-z]/);
      expect(template.source.split("\n")[0]).toMatch(/^(flowchart|sequenceDiagram|classDiagram|stateDiagram-v2|gantt|pie|mindmap)\b/);
    }
  });
});
