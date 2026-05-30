import { DiffAlgorithm } from "../store/useImageCompareStore";

export interface DiffStats {
  totalPixels: number;
  differentPixels: number;
  percentDifferent: number;
}

function loadImageToCanvas(url: string): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get 2D context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({ canvas, ctx });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  let rn = r / 255, gn = g / 255, bn = b / 255;
  rn = rn > 0.04045 ? ((rn + 0.055) / 1.055) ** 2.4 : rn / 12.92;
  gn = gn > 0.04045 ? ((gn + 0.055) / 1.055) ** 2.4 : gn / 12.92;
  bn = bn > 0.04045 ? ((bn + 0.055) / 1.055) ** 2.4 : bn / 12.92;
  const x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047;
  const y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.00000;
  const z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883;
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function heatmapColor(t: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [0, 0, 0], [0, 0, 255], [0, 255, 255], [0, 255, 0], [255, 255, 0], [255, 0, 0]
  ];
  const scaled = Math.min(4.9999, t * 5);
  const seg = Math.floor(scaled);
  const f = scaled - seg;
  const a = stops[seg], b = stops[seg + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

function buildIntegral(arr: Float32Array, width: number, height: number): Float64Array {
  const W = width + 1;
  const integral = new Float64Array(W * (height + 1));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      integral[(y + 1) * W + (x + 1)] =
        arr[y * width + x] +
        integral[y * W + (x + 1)] +
        integral[(y + 1) * W + x] -
        integral[y * W + x];
    }
  }
  return integral;
}

function boxQuery(
  integral: Float64Array, x1: number, y1: number, x2: number, y2: number, W: number
): number {
  return integral[(y2 + 1) * W + (x2 + 1)]
       - integral[y1 * W + (x2 + 1)]
       - integral[(y2 + 1) * W + x1]
       + integral[y1 * W + x1];
}

export async function renderDiff(
  originalUrl: string,
  modifiedUrl: string,
  targetCanvas: HTMLCanvasElement,
  algorithm: DiffAlgorithm
): Promise<DiffStats> {
  const [original, modified] = await Promise.all([
    loadImageToCanvas(originalUrl),
    loadImageToCanvas(modifiedUrl)
  ]);

  const width = Math.max(original.canvas.width, modified.canvas.width);
  const height = Math.max(original.canvas.height, modified.canvas.height);
  const totalPixels = width * height;
  let differentPixels = 0;
  const DIFF_THRESHOLD = 30;

  const normOrig = document.createElement("canvas");
  normOrig.width = width; normOrig.height = height;
  normOrig.getContext("2d")!.drawImage(original.canvas, 0, 0, width, height);

  const normMod = document.createElement("canvas");
  normMod.width = width; normMod.height = height;
  normMod.getContext("2d")!.drawImage(modified.canvas, 0, 0, width, height);

  const o = normOrig.getContext("2d")!.getImageData(0, 0, width, height).data;
  const m = normMod.getContext("2d")!.getImageData(0, 0, width, height).data;


  if (algorithm === "channel-split") {
    targetCanvas.width = width * 3;
    targetCanvas.height = height;
    const ctx = targetCanvas.getContext("2d")!;

    const panels: [ImageData, ImageData, ImageData] = [
      ctx.createImageData(width, height),
      ctx.createImageData(width, height),
      ctx.createImageData(width, height),
    ];
    for (let i = 0; i < o.length; i += 4) {
      const dr = Math.abs(o[i] - m[i]);
      const dg = Math.abs(o[i + 1] - m[i + 1]);
      const db = Math.abs(o[i + 2] - m[i + 2]);
      panels[0].data[i] = Math.min(255, dr * 4); panels[0].data[i + 1] = 0;               panels[0].data[i + 2] = 0;               panels[0].data[i + 3] = 255;
      panels[1].data[i] = 0;               panels[1].data[i + 1] = Math.min(255, dg * 4); panels[1].data[i + 2] = 0;               panels[1].data[i + 3] = 255;
      panels[2].data[i] = 0;               panels[2].data[i + 1] = 0;               panels[2].data[i + 2] = Math.min(255, db * 4); panels[2].data[i + 3] = 255;
      if (Math.sqrt(dr * dr + dg * dg + db * db) > DIFF_THRESHOLD) differentPixels++;
    }
    const tmp = document.createElement("canvas");
    tmp.width = width; tmp.height = height;
    const tmpCtx = tmp.getContext("2d")!;
    (["R", "G", "B"] as const).forEach((label, idx) => {
      tmpCtx.putImageData(panels[idx], 0, 0);
      ctx.drawImage(tmp, width * idx, 0);
    });
    const fs = Math.max(12, Math.round(height * 0.025));
    ctx.font = `bold ${fs}px system-ui, sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 4;
    (["R", "G", "B"] as const).forEach((label, idx) => {
      ctx.fillStyle = idx === 0 ? "#ff8080" : idx === 1 ? "#80ff80" : "#80a0ff";
      ctx.fillText(label, width * idx + 14, 32);
    });
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1;
    [width, width * 2].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); });
    return { totalPixels, differentPixels, percentDifferent: (differentPixels / totalPixels) * 100 };
  }

  if (algorithm === "ssim") {
    targetCanvas.width = width; targetCanvas.height = height;
    const ctx = targetCanvas.getContext("2d")!;
    const out = ctx.createImageData(width, height);

    const L1 = new Float32Array(totalPixels);
    const L2 = new Float32Array(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      L1[i] = 0.299 * o[i * 4] + 0.587 * o[i * 4 + 1] + 0.114 * o[i * 4 + 2];
      L2[i] = 0.299 * m[i * 4] + 0.587 * m[i * 4 + 1] + 0.114 * m[i * 4 + 2];
    }
    const L1sq = L1.map((v) => v * v);
    const L2sq = L2.map((v) => v * v);
    const L1L2 = L1.map((v, i) => v * L2[i]);

    const IW = width + 1;
    const intL1 = buildIntegral(L1, width, height);
    const intL2 = buildIntegral(L2, width, height);
    const intL1sq = buildIntegral(L1sq, width, height);
    const intL2sq = buildIntegral(L2sq, width, height);
    const intL1L2 = buildIntegral(L1L2, width, height);

    const half = 5;
    const C1 = (0.01 * 255) ** 2;
    const C2 = (0.03 * 255) ** 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const x1 = Math.max(0, x - half), x2 = Math.min(width - 1, x + half);
        const y1 = Math.max(0, y - half), y2 = Math.min(height - 1, y + half);
        const n = (x2 - x1 + 1) * (y2 - y1 + 1);
        const mu1 = boxQuery(intL1, x1, y1, x2, y2, IW) / n;
        const mu2 = boxQuery(intL2, x1, y1, x2, y2, IW) / n;
        const sig1sq = Math.max(0, boxQuery(intL1sq, x1, y1, x2, y2, IW) / n - mu1 * mu1);
        const sig2sq = Math.max(0, boxQuery(intL2sq, x1, y1, x2, y2, IW) / n - mu2 * mu2);
        const sig12 = boxQuery(intL1L2, x1, y1, x2, y2, IW) / n - mu1 * mu2;
        const ssimVal = ((2 * mu1 * mu2 + C1) * (2 * sig12 + C2)) /
                        ((mu1 * mu1 + mu2 * mu2 + C1) * (sig1sq + sig2sq + C2));
        const dissim = Math.max(0, 1 - ssimVal);
        const [r, g, b] = heatmapColor(Math.min(1, dissim / 0.25));
        const pi = (y * width + x) * 4;
        out.data[pi] = r; out.data[pi + 1] = g; out.data[pi + 2] = b; out.data[pi + 3] = 255;
        if (dissim > 0.05) differentPixels++;
      }
    }
    ctx.putImageData(out, 0, 0);
    return { totalPixels, differentPixels, percentDifferent: (differentPixels / totalPixels) * 100 };
  }

  if (algorithm === "edge") {
    targetCanvas.width = width; targetCanvas.height = height;
    const ctx = targetCanvas.getContext("2d")!;
    const out = ctx.createImageData(width, height);

    const diffMag = new Float32Array(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      const pi = i * 4;
      const dr = Math.abs(o[pi] - m[pi]);
      const dg = Math.abs(o[pi + 1] - m[pi + 1]);
      const db = Math.abs(o[pi + 2] - m[pi + 2]);
      diffMag[i] = Math.sqrt(dr * dr + dg * dg + db * db);
    }
    const getDM = (x: number, y: number) =>
      diffMag[Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const Gx = -getDM(x-1,y-1) + getDM(x+1,y-1) - 2*getDM(x-1,y) + 2*getDM(x+1,y) - getDM(x-1,y+1) + getDM(x+1,y+1);
        const Gy = -getDM(x-1,y-1) - 2*getDM(x,y-1) - getDM(x+1,y-1) + getDM(x-1,y+1) + 2*getDM(x,y+1) + getDM(x+1,y+1);
        const mag = Math.min(255, Math.sqrt(Gx * Gx + Gy * Gy) * 1.5);
        const pi = (y * width + x) * 4;
        out.data[pi] = 0; out.data[pi + 1] = Math.round(mag); out.data[pi + 2] = Math.round(mag); out.data[pi + 3] = 255;
        if (mag > 20) differentPixels++;
      }
    }
    ctx.putImageData(out, 0, 0);
    return { totalPixels, differentPixels, percentDifferent: (differentPixels / totalPixels) * 100 };
  }

  targetCanvas.width = width; targetCanvas.height = height;
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context for target canvas");
  const outputData = ctx.createImageData(width, height);
  const out = outputData.data;

  for (let i = 0; i < o.length; i += 4) {
    const dr = Math.abs(o[i] - m[i]);
    const dg = Math.abs(o[i + 1] - m[i + 1]);
    const db = Math.abs(o[i + 2] - m[i + 2]);
    const deltaE = Math.sqrt(dr * dr + dg * dg + db * db);

    switch (algorithm) {
      case "absolute": {
        out[i] = Math.min(255, dr * 4);
        out[i + 1] = Math.min(255, dg * 4);
        out[i + 2] = Math.min(255, db * 4);
        out[i + 3] = 255;
        if (deltaE > DIFF_THRESHOLD) differentPixels++;
        break;
      }
      case "subtract": {
        out[i] = Math.max(0, m[i] - o[i]);
        out[i + 1] = Math.max(0, m[i + 1] - o[i + 1]);
        out[i + 2] = Math.max(0, m[i + 2] - o[i + 2]);
        out[i + 3] = 255;
        if (deltaE > DIFF_THRESHOLD) differentPixels++;
        break;
      }
      case "xor": {
        out[i] = o[i] ^ m[i];
        out[i + 1] = o[i + 1] ^ m[i + 1];
        out[i + 2] = o[i + 2] ^ m[i + 2];
        out[i + 3] = 255;
        if (deltaE > DIFF_THRESHOLD) differentPixels++;
        break;
      }
      case "heatmap": {
        const [r, g, b] = heatmapColor(Math.min(1, deltaE / 441.67));
        out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
        if (deltaE > DIFF_THRESHOLD) differentPixels++;
        break;
      }
      case "perceptual": {
        const [L1, a1, b1] = rgbToLab(o[i], o[i + 1], o[i + 2]);
        const [L2, a2, b2] = rgbToLab(m[i], m[i + 1], m[i + 2]);
        const dE = Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
        if (dE < 2) {
          const v = Math.round((dE / 2) * 25);
          out[i] = v; out[i + 1] = v; out[i + 2] = Math.min(255, v + 18); out[i + 3] = 255;
        } else {
          const t = Math.min(1, (dE - 2) / 48);
          out[i] = 255; out[i + 1] = Math.round(230 * (1 - t)); out[i + 2] = 0; out[i + 3] = 255;
        }
        if (dE > 2.3) differentPixels++;
        break;
      }
      case "threshold": {
        const v = deltaE > DIFF_THRESHOLD ? 255 : 0;
        out[i] = v; out[i + 1] = v; out[i + 2] = v; out[i + 3] = 255;
        if (deltaE > DIFF_THRESHOLD) differentPixels++;
        break;
      }
      default: {
        if (deltaE > DIFF_THRESHOLD) {
          differentPixels++;
          const origLuma = 0.299 * o[i] + 0.587 * o[i + 1] + 0.114 * o[i + 2];
          const modLuma = 0.299 * m[i] + 0.587 * m[i + 1] + 0.114 * m[i + 2];
          if (modLuma > origLuma) {
            out[i] = 40; out[i + 1] = 200; out[i + 2] = 80; out[i + 3] = 255;
          } else {
            out[i] = 240; out[i + 1] = 60; out[i + 2] = 60; out[i + 3] = 255;
          }
        } else {
          const gray = Math.round(0.299 * o[i] + 0.587 * o[i + 1] + 0.114 * o[i + 2]);
          out[i] = gray; out[i + 1] = gray; out[i + 2] = gray; out[i + 3] = 180;
        }
        break;
      }
    }
  }

  ctx.putImageData(outputData, 0, 0);
  return {
    totalPixels,
    differentPixels,
    percentDifferent: totalPixels > 0 ? (differentPixels / totalPixels) * 100 : 0
  };
}

export async function renderFade(
  originalUrl: string,
  modifiedUrl: string,
  targetCanvas: HTMLCanvasElement,
  alpha: number
): Promise<void> {
  const [original, modified] = await Promise.all([
    loadImageToCanvas(originalUrl),
    loadImageToCanvas(modifiedUrl)
  ]);

  const width = Math.max(original.canvas.width, modified.canvas.width);
  const height = Math.max(original.canvas.height, modified.canvas.height);
  targetCanvas.width = width;
  targetCanvas.height = height;

  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.globalAlpha = 1 - alpha;
  ctx.drawImage(original.canvas, 0, 0, width, height);
  ctx.globalAlpha = alpha;
  ctx.drawImage(modified.canvas, 0, 0, width, height);
  ctx.globalAlpha = 1;
}
