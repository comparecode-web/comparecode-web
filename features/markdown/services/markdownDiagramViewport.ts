export const diagramMinZoom = 0.1;
export const diagramMaxZoom = 10;
export const diagramZoomStep = 1.25;

export interface DiagramViewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface DiagramSize {
  width: number;
  height: number;
}

export function clampDiagramZoom(zoom: number): number {
  return Math.min(diagramMaxZoom, Math.max(diagramMinZoom, zoom));
}

export function getDiagramFitZoom(view: DiagramSize, content: DiagramSize, padding = 32): number {
  if (view.width <= 0 || view.height <= 0 || content.width <= 0 || content.height <= 0) {
    return 1;
  }

  return clampDiagramZoom(Math.min((view.width - padding) / content.width, (view.height - padding) / content.height));
}

export function zoomDiagramAt(viewport: DiagramViewport, nextZoom: number, point: { x: number; y: number }, view: DiagramSize): DiagramViewport {
  const zoom = clampDiagramZoom(nextZoom);
  const ratio = zoom / viewport.zoom;
  const centerX = view.width / 2;
  const centerY = view.height / 2;
  const offsetX = point.x - centerX - viewport.panX;
  const offsetY = point.y - centerY - viewport.panY;

  return {
    zoom,
    panX: viewport.panX - offsetX * (ratio - 1),
    panY: viewport.panY - offsetY * (ratio - 1)
  };
}

export function getDiagramContentBox(viewport: DiagramViewport, view: DiagramSize, content: DiagramSize) {
  const width = content.width * viewport.zoom;
  const height = content.height * viewport.zoom;

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    left: Math.round((view.width - width) / 2 + viewport.panX),
    top: Math.round((view.height - height) / 2 + viewport.panY)
  };
}
