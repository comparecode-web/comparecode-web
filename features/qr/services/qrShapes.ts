import type { QRCode } from "qrcode";

export const QR_MODULE_SHAPES = ["square", "rounded", "dots", "connected", "diamond", "vertical-bars", "horizontal-bars", "leaf", "plus", "star"] as const;
export const QR_BORDER_SHAPES = ["square", "rounded", "circle", "leaf", "octagon"] as const;
export const QR_CENTER_SHAPES = ["square", "rounded", "circle", "leaf", "octagon", "diamond", "star"] as const;
export type QrModuleShape = typeof QR_MODULE_SHAPES[number];
export type QrBorderShape = typeof QR_BORDER_SHAPES[number];
export type QrCenterShape = typeof QR_CENTER_SHAPES[number];
export type QrEyeShape = QrCenterShape;
export interface QrStyle {
  modules: QrModuleShape;
  border: QrBorderShape;
  center: QrCenterShape;
  borderColor: string | null;
  centerColor: string | null;
}
export const DEFAULT_QR_STYLE: QrStyle = { modules: "square", border: "square", center: "square", borderColor: null, centerColor: null };
export function isClassicQrStyle(style: QrStyle): boolean {
  return style.modules === "square" && style.border === "square" && style.center === "square" && style.borderColor === null && style.centerColor === null;
}

const n = (value: number) => +value.toFixed(3);

export function roundedShape(x: number, y: number, size: number, radius: number): string {
  const r = Math.min(radius, size / 2);
  return `M${x + r} ${y}H${x + size - r}Q${x + size} ${y} ${x + size} ${y + r}V${y + size - r}Q${x + size} ${y + size} ${x + size - r} ${y + size}H${x + r}Q${x} ${y + size} ${x} ${y + size - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
}

function cornerShape(x: number, y: number, width: number, height: number, [tl, tr, br, bl]: [number, number, number, number]): string {
  return `M${n(x + tl)} ${n(y)}H${n(x + width - tr)}Q${n(x + width)} ${n(y)} ${n(x + width)} ${n(y + tr)}V${n(y + height - br)}Q${n(x + width)} ${n(y + height)} ${n(x + width - br)} ${n(y + height)}H${n(x + bl)}Q${n(x)} ${n(y + height)} ${n(x)} ${n(y + height - bl)}V${n(y + tl)}Q${n(x)} ${n(y)} ${n(x + tl)} ${n(y)}Z`;
}

function polygon(points: Array<[number, number]>): string {
  return `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}Z`;
}

function starShape(cx: number, cy: number, outer: number, inner: number): string {
  return polygon(Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const radius = index % 2 ? inner : outer;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  }));
}

function diamondShape(cx: number, cy: number, radius: number): string {
  return polygon([[cx, cy - radius], [cx + radius, cy], [cx, cy + radius], [cx - radius, cy]]);
}

function octagonShape(x: number, y: number, size: number): string {
  const cut = size * .22;
  return polygon([[x + cut, y], [x + size - cut, y], [x + size, y + cut], [x + size, y + size - cut], [x + size - cut, y + size], [x + cut, y + size], [x, y + size - cut], [x, y + cut]]);
}

/** Corner marker part. Mirrored leaves round the other diagonal, so every leaf points toward the code center. */
export function eyeShape(x: number, y: number, size: number, shape: QrEyeShape, mirrored = false): string {
  switch (shape) {
    case "circle": { const r = size / 2; return `M${x} ${y + r}a${r} ${r} 0 1 0 ${size} 0a${r} ${r} 0 1 0 ${-size} 0Z`; }
    case "leaf": { const r = size * .38; return cornerShape(x, y, size, size, mirrored ? [0, r, 0, r] : [r, 0, r, 0]); }
    case "octagon": return octagonShape(x, y, size);
    case "diamond": return diamondShape(x + size / 2, y + size / 2, size * .64);
    case "star": return starShape(x + size / 2, y + size / 2, size * .64, size * .38);
    default: return roundedShape(x, y, size, shape === "rounded" ? size * .22 : 0);
  }
}

export interface QrShapePath {
  d: string;
  fill: string;
  shapeRendering: "crispEdges" | "geometricPrecision";
}

type DarkAt = (row: number, col: number) => boolean;

function modulePath(shape: QrModuleShape, dark: DarkAt, row: number, col: number, x: number, y: number): string {
  switch (shape) {
    case "dots": return eyeShape(x, y, 1, "circle");
    case "connected": {
      let path = roundedShape(x, y, 1, .35);
      if (dark(row, col + 1)) path += `M${x + .5} ${y}h.5v1h-.5Z`;
      if (dark(row, col - 1)) path += `M${x} ${y}h.5v1h-.5Z`;
      if (dark(row + 1, col)) path += `M${x} ${y + .5}h1v.5h-1Z`;
      if (dark(row - 1, col)) path += `M${x} ${y}h1v.5h-1Z`;
      return path;
    }
    case "diamond": return diamondShape(x + .5, y + .5, .62);
    case "vertical-bars": {
      if (dark(row - 1, col)) return "";
      let length = 1;
      while (dark(row + length, col)) length++;
      return cornerShape(x + .1, y + .05, .8, length - .1, [.4, .4, .4, .4]);
    }
    case "horizontal-bars": {
      if (dark(row, col - 1)) return "";
      let length = 1;
      while (dark(row, col + length)) length++;
      return cornerShape(x + .05, y + .1, length - .1, .8, [.4, .4, .4, .4]);
    }
    case "leaf": {
      const topLeft = dark(row - 1, col) || dark(row, col - 1) ? 0 : .5;
      const bottomRight = dark(row + 1, col) || dark(row, col + 1) ? 0 : .5;
      return cornerShape(x, y, 1, 1, [topLeft, 0, bottomRight, 0]);
    }
    case "plus": return `M${x + .3} ${y}h.4v1h-.4ZM${x} ${y + .3}h1v.4h-1Z`;
    case "star": return starShape(x + .5, y + .5, .62, .3);
    default: return roundedShape(x, y, 1, shape === "rounded" ? .25 : 0);
  }
}

export function qrModulePreviewPath(shape: QrModuleShape, cells: Array<[number, number]>): string {
  const dark: DarkAt = (row, col) => cells.some(([r, c]) => r === row && c === col);
  return cells.map(([row, col]) => modulePath(shape, dark, row, col, col, row)).join("");
}

export function qrShapePaths(symbol: QRCode, style: QrStyle, colors: { dark: string; light: string }, border: number): QrShapePath[] {
  if (!QR_MODULE_SHAPES.includes(style.modules) || !QR_BORDER_SHAPES.includes(style.border) || !QR_CENTER_SHAPES.includes(style.center)) throw new Error("Unsupported QR shape.");
  const size = symbol.modules.size;
  const eyes = [[0, 0], [size - 7, 0], [0, size - 7]];
  const inEye = (row: number, col: number) => eyes.some(([x, y]) => col >= x && col < x + 7 && row >= y && row < y + 7);
  const dark: DarkAt = (row, col) => row >= 0 && col >= 0 && row < size && col < size && symbol.modules.get(row, col) === 1 && !inEye(row, col);
  const modules: string[] = [];
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
    if (dark(row, col)) modules.push(modulePath(style.modules, dark, row, col, col + border, row + border));
  }
  const paths: QrShapePath[] = [{ d: modules.join(""), fill: colors.dark, shapeRendering: style.modules === "square" ? "crispEdges" : "geometricPrecision" }];
  eyes.forEach(([x, y], index) => {
    const mirrored = index > 0;
    const borderRendering = style.border === "square" ? "crispEdges" : "geometricPrecision";
    paths.push({ d: eyeShape(x + border, y + border, 7, style.border, mirrored), fill: style.borderColor ?? colors.dark, shapeRendering: borderRendering });
    paths.push({ d: eyeShape(x + border + 1, y + border + 1, 5, style.border, mirrored), fill: colors.light, shapeRendering: borderRendering });
    paths.push({ d: eyeShape(x + border + 2, y + border + 2, 3, style.center, mirrored), fill: style.centerColor ?? colors.dark, shapeRendering: style.center === "square" ? "crispEdges" : "geometricPrecision" });
  });
  return paths;
}
