import type { QRCode } from "qrcode";

export type QrModuleShape = "square" | "rounded" | "dots" | "connected";
export type QrEyeShape = "square" | "rounded" | "circle";
export interface QrStyle {
  modules: QrModuleShape;
  border: QrEyeShape;
  center: QrEyeShape;
  borderColor: string | null;
  centerColor: string | null;
}
export const DEFAULT_QR_STYLE: QrStyle = { modules: "square", border: "square", center: "square", borderColor: null, centerColor: null };
export function isClassicQrStyle(style: QrStyle): boolean {
  return style.modules === "square" && style.border === "square" && style.center === "square" && style.borderColor === null && style.centerColor === null;
}

export function roundedShape(x: number, y: number, size: number, radius: number): string {
  const r = Math.min(radius, size / 2);
  return `M${x + r} ${y}H${x + size - r}Q${x + size} ${y} ${x + size} ${y + r}V${y + size - r}Q${x + size} ${y + size} ${x + size - r} ${y + size}H${x + r}Q${x} ${y + size} ${x} ${y + size - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
}
export function eyeShape(x: number, y: number, size: number, shape: QrEyeShape): string {
  if (shape === "circle") { const r = size / 2; return `M${x} ${y + r}a${r} ${r} 0 1 0 ${size} 0a${r} ${r} 0 1 0 ${-size} 0Z`; }
  return roundedShape(x, y, size, shape === "rounded" ? size * .22 : 0);
}

export function qrShapePaths(symbol: QRCode, style: QrStyle, colors: { dark: string; light: string }, border: number): Array<{ d: string; fill: string }> {
  if (!["square", "rounded", "dots", "connected"].includes(style.modules) || !["square", "rounded", "circle"].includes(style.border) || !["square", "rounded", "circle"].includes(style.center)) throw new Error("Unsupported QR shape.");
  const size = symbol.modules.size;
  const eyes = [[0, 0], [size - 7, 0], [0, size - 7]];
  const paths: Array<{ d: string; fill: string }> = [];
  const modules: string[] = [];
  const dark = (row: number, col: number) => row >= 0 && col >= 0 && row < size && col < size && symbol.modules.get(row, col) === 1;
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
    if (!dark(row, col) || eyes.some(([x, y]) => col >= x && col < x + 7 && row >= y && row < y + 7)) continue;
    const x = col + border, y = row + border;
    const shape = symbol.modules.isReserved(row, col) ? "square" : style.modules;
    if (shape === "dots") modules.push(eyeShape(x, y, 1, "circle"));
    else if (shape === "connected") {
      modules.push(roundedShape(x, y, 1, .35));
      if (dark(row, col + 1)) modules.push(`M${x + .5} ${y}h.5v1h-.5Z`);
      if (dark(row, col - 1)) modules.push(`M${x} ${y}h.5v1h-.5Z`);
      if (dark(row + 1, col)) modules.push(`M${x} ${y + .5}h1v.5h-1Z`);
      if (dark(row - 1, col)) modules.push(`M${x} ${y}h1v.5h-1Z`);
    } else modules.push(roundedShape(x, y, 1, shape === "rounded" ? .25 : 0));
  }
  paths.push({ d: modules.join(""), fill: colors.dark });
  for (const [x, y] of eyes) {
    paths.push({ d: eyeShape(x + border, y + border, 7, style.border), fill: style.borderColor ?? colors.dark });
    paths.push({ d: eyeShape(x + border + 1, y + border + 1, 5, style.border), fill: colors.light });
    paths.push({ d: eyeShape(x + border + 2, y + border + 2, 3, style.center), fill: style.centerColor ?? colors.dark });
  }
  return paths;
}
