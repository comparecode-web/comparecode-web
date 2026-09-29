import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockType, DiffChangeType, type ChangeLine, type ComparisonResult } from "../types/diff";
import { encodeImagePdf } from "./pdfDocument";
import { createComparisonPdf } from "./textExport";

const line = (number: number, text: string, kind: DiffChangeType): ChangeLine => ({
  lineNumber: number,
  kind,
  fragments: [{ kind, text }]
});

describe("comparison PDF", () => {
  afterEach(() => vi.restoreAllMocks());

  it("writes consistent page objects, image streams and xref offsets", async () => {
    const jpeg = Uint8Array.from([255, 216, 255, 217]);
    const pdf = await encodeImagePdf([{ jpeg, width: 20, height: 10 }, { jpeg, width: 20, height: 10 }]).arrayBuffer();
    const bytes = new Uint8Array(pdf);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("/Count 2");
    expect(text.match(/\/Subtype \/Image/g)).toHaveLength(2);
    const xref = Number(text.match(/startxref\n(\d+)/)?.[1]);
    expect(new TextDecoder().decode(bytes.slice(xref, xref + 4))).toBe("xref");
    const offsets = new TextDecoder().decode(bytes.slice(xref)).split("\n").slice(3, 11).map((entry) => Number(entry.slice(0, 10)));
    offsets.forEach((offset, index) => expect(new TextDecoder().decode(bytes.slice(offset, offset + 5))).toBe(`${index + 1} 0 o`));
  });

  it("draws moved borders, fragment highlights, opposing empty rows and multiple pages", async () => {
    const labels: string[] = [];
    const fills: string[] = [];
    let strokes = 0;
    const ctx = {
      fillStyle: "", strokeStyle: "", font: "", lineWidth: 1, textBaseline: "alphabetic", textAlign: "left",
      scale: vi.fn(), fillRect: vi.fn(function (this: { fillStyle: string }) { fills.push(this.fillStyle); }),
      fillText: vi.fn((value: string) => labels.push(value)),
      measureText: vi.fn((value: string) => ({ width: value.length * 5 })),
      beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(() => { strokes += 1; })
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(new Blob([Uint8Array.from([255, 216, 255, 217])], { type: "image/jpeg" })));
    const oldLines = Array.from({ length: 60 }, (_, index) => line(index + 1, `old ${index}`, DiffChangeType.Deleted));
    const newLines = Array.from({ length: 60 }, (_, index) => line(index + 1, `new ${index}`, DiffChangeType.Inserted));
    const result: ComparisonResult = { limited: false, blocks: [{
      id: "moved", kind: BlockType.Modified, oldLines, newLines,
      startIndexOld: 0, startIndexNew: 0, startOffsetOld: 0, endOffsetOld: 1,
      startOffsetNew: 0, endOffsetNew: 1, removalCount: 60, additionCount: 60,
      move: { id: "move-1", number: 1, role: "from", counterpartStartLine: 1, counterpartEndLine: 60, counterpartBlockId: "target", modified: false }
    }, {
      id: "missing", kind: BlockType.Added, oldLines: [], newLines: [line(61, "addition", DiffChangeType.Inserted)],
      startIndexOld: 60, startIndexNew: 60, startOffsetOld: 1, endOffsetOld: 1,
      startOffsetNew: 1, endOffsetNew: 2, removalCount: 0, additionCount: 1
    }] };
    const blob = await createComparisonPdf(result);
    expect(blob.type).toBe("application/pdf");
    expect(labels.some((value) => value.includes("#1"))).toBe(true);
    expect(strokes).toBeGreaterThan(0);
    expect(fills).toContain("#f0f0f0");
    expect(fills).toContain("#acf2bd");
    expect(labels.filter((value) => value.startsWith("Page ")).length).toBeGreaterThan(1);
  });
});
