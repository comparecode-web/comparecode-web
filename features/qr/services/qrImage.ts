import QRCode, { type QRCode as QrSymbol } from "qrcode";

export type QrErrorCorrection = "L" | "M" | "Q" | "H";
export type QrImageColors = { dark: string; light: string };

export const QR_BORDER = 4;
export const DEFAULT_QR_COLORS: QrImageColors = { dark: "#000000", light: "#ffffff" };

export function createQrSymbol(value: string, errorCorrectionLevel: QrErrorCorrection): QrSymbol {
  return QRCode.create(value, { errorCorrectionLevel });
}

function luminance(color: string): number {
  const channels = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(color.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function getQrColorError({ dark, light }: QrImageColors): string | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(dark) || !/^#[0-9a-fA-F]{6}$/.test(light)) {
    return "Enter six-digit hex colors for the code and background.";
  }
  return null;
}

export function getQrColorWarning({ dark, light }: QrImageColors): string | null {
  if (getQrColorError({ dark, light })) return null;
  const darkLuminance = luminance(dark);
  const lightLuminance = luminance(light);
  if (darkLuminance >= lightLuminance) {
    return "The code color is as light as or lighter than its background and may be difficult to scan. Choose a darker code color for more reliable scanning.";
  }
  if ((lightLuminance + 0.05) / (darkLuminance + 0.05) < 4.5) {
    return "These colors have low contrast and may be difficult to scan. Choose colors with stronger contrast for more reliable scanning.";
  }
  return null;
}

export function createQrSvg(symbol: QrSymbol, colors: QrImageColors): string {
  const moduleCount = symbol.modules.size;
  const total = moduleCount + QR_BORDER * 2;
  const runs: string[] = [];

  for (let row = 0; row < moduleCount; row += 1) {
    let start = -1;
    for (let column = 0; column <= moduleCount; column += 1) {
      const active = column < moduleCount && symbol.modules.get(row, column) === 1;
      if (active && start < 0) start = column;
      if (!active && start >= 0) {
        runs.push(`M${start + QR_BORDER} ${row + QR_BORDER}h${column - start}v1H${start + QR_BORDER}z`);
        start = -1;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}" shape-rendering="crispEdges"><path fill="${colors.light}" d="M0 0h${total}v${total}H0z"/><path fill="${colors.dark}" d="${runs.join("")}"/></svg>`;
}

export function drawQrCanvas(symbol: QrSymbol, colors: QrImageColors, targetSize: number): HTMLCanvasElement {
  const total = symbol.modules.size + QR_BORDER * 2;
  const edges = Array.from({ length: total + 1 }, (_, index) => Math.floor(index * targetSize / total));
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable in this browser.");

  context.fillStyle = colors.light;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = colors.dark;
  for (let row = 0; row < symbol.modules.size; row += 1) {
    for (let column = 0; column < symbol.modules.size; column += 1) {
      if (symbol.modules.get(row, column) === 1) {
        const x = edges[column + QR_BORDER];
        const y = edges[row + QR_BORDER];
        const right = edges[column + QR_BORDER + 1];
        const bottom = edges[row + QR_BORDER + 1];
        context.fillRect(x, y, right - x, bottom - y);
      }
    }
  }
  return canvas;
}

export async function createQrPng(symbol: QrSymbol, colors: QrImageColors, targetSize: number): Promise<Blob> {
  const canvas = drawQrCanvas(symbol, colors, targetSize);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG export failed."));
    }, "image/png");
  });
}
