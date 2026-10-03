import type { ChangeLine, ComparisonResult, TextFragment } from "@/features/compare/text/types/diff";
import { BlockType, DiffChangeType } from "@/features/compare/text/types/diff";
import { calculateSplitRows } from "@/features/compare/text/hooks/useCalculateSplitRows";
import { encodeImagePdf } from "./pdfDocument";
import { downloadBlob } from "@/utils/downloadBlob";
export { downloadBlob } from "@/utils/downloadBlob";

export function downloadText(text: string, side: "original" | "modified"): void {
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `comparecode-${side}.txt`);
}

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const SCALE = 2;
const MARGIN = 28;
const GAP = 12;
const COLUMN_WIDTH = (PAGE_WIDTH - MARGIN * 2 - GAP) / 2;
const TEXT_OFFSET = 37;
const FONT_SIZE = 8.5;
const LINE_HEIGHT = 12;
const BOTTOM = PAGE_HEIGHT - MARGIN;

interface Palette {
  page: string;
  text: string;
  muted: string;
  added: string;
  removed: string;
  addedFragment: string;
  removedFragment: string;
  empty: string;
  accent: string;
}

interface DrawRun { text: string; kind: DiffChangeType }

function palette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const color = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    page: color("--bg-primary", "#ffffff"),
    text: color("--text-primary", "#24292e"),
    muted: color("--text-secondary", "#656d76"),
    added: color("--diff-added-bg", "#e6ffed"),
    removed: color("--diff-removed-bg", "#ffeef0"),
    addedFragment: color("--diff-added-fg", "#acf2bd"),
    removedFragment: color("--diff-removed-fg", "#fdb8c0"),
    empty: color("--diff-empty-bg", "#f0f0f0"),
    accent: color("--accent-primary", "#2563eb")
  };
}

function wrappedFragments(ctx: CanvasRenderingContext2D, line: ChangeLine | undefined): DrawRun[][] {
  if (!line || line.kind === DiffChangeType.Imaginary) return [[]];
  const fragments: TextFragment[] = line.lineEndingLabel
    ? [...line.fragments, { text: ` [${line.lineEndingLabel}]`, kind: DiffChangeType.Unchanged }]
    : line.fragments;
  const rows: DrawRun[][] = [[]];
  let width = 0;
  const maxWidth = COLUMN_WIDTH - TEXT_OFFSET - 9;
  for (const fragment of fragments) {
    for (const character of fragment.text.replaceAll("\t", "    ")) {
      const advance = ctx.measureText(character).width;
      if (width > 0 && width + advance > maxWidth) {
        rows.push([]);
        width = 0;
      }
      const row = rows[rows.length - 1];
      const previous = row[row.length - 1];
      if (previous?.kind === fragment.kind) previous.text += character;
      else row.push({ text: character, kind: fragment.kind });
      width += advance;
    }
  }
  return rows;
}

function drawRuns(ctx: CanvasRenderingContext2D, runs: DrawRun[], x: number, y: number, colors: Palette, suppressHighlight: boolean) {
  for (const run of runs) {
    const width = ctx.measureText(run.text).width;
    if (!suppressHighlight && run.kind !== DiffChangeType.Unchanged) {
      ctx.fillStyle = run.kind === DiffChangeType.Inserted ? colors.addedFragment : colors.removedFragment;
      ctx.fillRect(x, y - 9, width, LINE_HEIGHT - 1);
    }
    ctx.fillStyle = colors.text;
    ctx.fillText(run.text, x, y);
    x += width;
  }
}

function drawSide(ctx: CanvasRenderingContext2D, line: ChangeLine | undefined, runs: DrawRun[][], start: number, count: number, x: number, y: number, height: number, blockKind: BlockType, old: boolean, moved: boolean, colors: Palette) {
  const imaginary = !line || line.kind === DiffChangeType.Imaginary;
  const background = imaginary ? colors.empty : blockKind === BlockType.Unchanged ? null : old ? colors.removed : colors.added;
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(x + 30, y, COLUMN_WIDTH - 34, height);
  }
  if (imaginary) return;
  ctx.font = `${FONT_SIZE}px monospace`;
  ctx.textBaseline = "alphabetic";
  if (start === 0 && line.lineNumber !== null) {
    ctx.fillStyle = colors.muted;
    ctx.textAlign = "right";
    ctx.fillText(String(line.lineNumber), x + 24, y + 12);
    ctx.textAlign = "left";
  }
  for (let index = 0; index < count; index++) {
    drawRuns(ctx, runs[start + index] ?? [], x + TEXT_OFFSET, y + 12 + index * LINE_HEIGHT, colors, moved);
  }
}

async function jpegPage(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("The PDF page could not be rendered.")), "image/jpeg", 0.94);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

export async function createComparisonPdf(result: ComparisonResult): Promise<Blob> {
  const colors = palette();
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH * SCALE;
  canvas.height = PAGE_HEIGHT * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.scale(SCALE, SCALE);
  const pages: Array<{ jpeg: Uint8Array; width: number; height: number }> = [];
  let pageNumber = 0;
  let y = 0;
  const startPage = () => {
    pageNumber += 1;
    ctx.fillStyle = colors.page;
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = colors.text;
    ctx.fillText("CompareCode text comparison", MARGIN, 31);
    ctx.font = "9px sans-serif";
    ctx.fillStyle = colors.muted;
    ctx.fillText(`Page ${pageNumber}`, PAGE_WIDTH - MARGIN - 42, 30);
    ctx.fillStyle = colors.text;
    ctx.fillText("Original", MARGIN, 52);
    ctx.fillText("Modified", MARGIN + COLUMN_WIDTH + GAP, 52);
    y = 63;
  };
  const nextPage = async () => {
    pages.push({ jpeg: await jpegPage(canvas), width: canvas.width, height: canvas.height });
    startPage();
  };
  startPage();
  const rows = calculateSplitRows(result).filter((row) => row.type === "line");
  for (const row of rows) {
    const block = row.block;
    if (row.isFirstLine && block.move) {
      if (y + 35 > BOTTOM) await nextPage();
      const move = block.move;
      const label = `#${move.number ?? move.id}  ${move.role === "from" ? "Moved to" : "Moved from"} lines ${move.counterpartStartLine}-${move.counterpartEndLine}${move.modified ? " · edited" : ""}`;
      ctx.font = "bold 9px sans-serif";
      const labelX = move.role === "from" ? MARGIN + COLUMN_WIDTH - ctx.measureText(label).width - 4 : MARGIN + COLUMN_WIDTH + GAP + 4;
      ctx.fillStyle = colors.accent;
      ctx.fillText(label, labelX, y + 11);
      y += 19;
    }
    const oldLine = block.oldLines[row.oldIndex];
    const newLine = block.newLines[row.newIndex];
    ctx.font = `${FONT_SIZE}px monospace`;
    const oldRows = wrappedFragments(ctx, oldLine);
    const newRows = wrappedFragments(ctx, newLine);
    const total = Math.max(oldRows.length, newRows.length);
    let start = 0;
    while (start < total) {
      const available = Math.floor((BOTTOM - y - 4) / LINE_HEIGHT);
      if (available < 1) { await nextPage(); continue; }
      const count = Math.min(total - start, available);
      const height = Math.max(17, count * LINE_HEIGHT + 4);
      if (y + height > BOTTOM) { await nextPage(); continue; }
      drawSide(ctx, oldLine, oldRows, start, count, MARGIN, y, height, block.kind, true, !!block.move, colors);
      drawSide(ctx, newLine, newRows, start, count, MARGIN + COLUMN_WIDTH + GAP, y, height, block.kind, false, !!block.move, colors);
      if (block.move) {
        const x = (block.move.role === "from" ? MARGIN : MARGIN + COLUMN_WIDTH + GAP) + 30;
        const right = x + COLUMN_WIDTH - 34;
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x, y + height);
        ctx.moveTo(right, y); ctx.lineTo(right, y + height);
        if (row.isFirstLine && start === 0) { ctx.moveTo(x, y); ctx.lineTo(right, y); }
        if (row.isLastLine && start + count === total) { ctx.moveTo(x, y + height); ctx.lineTo(right, y + height); }
        ctx.stroke();
      }
      y += height;
      start += count;
    }
  }
  pages.push({ jpeg: await jpegPage(canvas), width: canvas.width, height: canvas.height });
  return encodeImagePdf(pages);
}
