import { canAllocateCanvas } from "@/utils/canvasBudget";

export interface NormalizedDiagramSvg {
  markup: string;
  width: number;
  height: number;
}

export function normalizeDiagramSvg(svgMarkup: string): NormalizedDiagramSvg | null {
  const svg = new DOMParser().parseFromString(svgMarkup, "text/html").body.querySelector("svg");
  if (!svg) {
    return null;
  }

  const viewBox = svg.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
  const width = viewBox && viewBox.length === 4 && viewBox[2] > 0 ? viewBox[2] : parseFloat(svg.getAttribute("width") ?? "");
  const height = viewBox && viewBox.length === 4 && viewBox[3] > 0 ? viewBox[3] : parseFloat(svg.getAttribute("height") ?? "");
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  for (const element of [svg, ...Array.from(svg.querySelectorAll("*"))]) {
    element.removeAttribute("xmlns");
  }
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  const style = (svg.getAttribute("style") ?? "").replace(/(?:^|;)\s*max-width\s*:[^;]*/gi, "").replace(/^;\s*/, "").trim();
  if (style) {
    svg.setAttribute("style", style);
  } else {
    svg.removeAttribute("style");
  }

  return { markup: new XMLSerializer().serializeToString(svg), width, height };
}

function loadSvgImage(markup: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The diagram image could not be loaded."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });
}

export function getDiagramPngScale(width: number, height: number): number | null {
  return [2, 1.5, 1].find((scale) => canAllocateCanvas(Math.ceil(width * scale), Math.ceil(height * scale))) ?? null;
}

export async function renderDiagramPng(svg: NormalizedDiagramSvg, background: string): Promise<Blob> {
  const scale = getDiagramPngScale(svg.width, svg.height);
  if (!scale) {
    throw new Error("The diagram is too large to export as an image.");
  }

  const image = await loadSvgImage(svg.markup);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(svg.width * scale);
  canvas.height = Math.ceil(svg.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("The diagram image could not be drawn.");
  }

  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The diagram image could not be created.")), "image/png");
    } catch (error) {
      reject(error);
    }
  });
}

export async function renderDiagramPngWithFallback(
  svgMarkup: string,
  background: string,
  renderWithoutHtmlLabels: () => Promise<string>
): Promise<Blob> {
  const primary = normalizeDiagramSvg(svgMarkup);
  if (primary) {
    try {
      return await renderDiagramPng(primary, background);
    } catch {
      // Canvas export can be blocked for SVG with HTML labels, so retry with plain SVG text labels.
    }
  }

  const fallback = normalizeDiagramSvg(await renderWithoutHtmlLabels());
  if (!fallback) {
    throw new Error("The diagram could not be exported.");
  }

  return renderDiagramPng(fallback, background);
}
