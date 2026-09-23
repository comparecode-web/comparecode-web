import { ImageFileMeta, ImageCompareMode, DiffAlgorithm } from "../store/useImageCompareStore";
import { ImageAffineTransform } from "./alignment/types";
import { renderDiff, renderFade, renderSlider, renderSideBySide } from "./ImageDiffService";

export interface SnapshotRenderOptions {
  compareMode: ImageCompareMode;
  originalImage: ImageFileMeta;
  modifiedImage: ImageFileMeta;
  fadeValue: number;
  sliderPosition: number;
  diffAlgorithm: DiffAlgorithm;
  alignmentTransform: ImageAffineTransform | null;
}

function sanitizeName(name: string): string {
  const stripped = name.replace(/\.[^/.]+$/, "");
  const normalized = stripped.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return normalized.slice(0, 24);
}

function formatTimestamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}${m}${d}-${h}${min}${s}`;
}

export function formatSnapshotFilename(options: SnapshotRenderOptions, timestamp = formatTimestamp()): string {
  const origClean = sanitizeName(options.originalImage.name);
  const modClean = sanitizeName(options.modifiedImage.name);

  let modeSuffix: string;
  switch (options.compareMode) {
    case "fade":
      modeSuffix = `fade-${Math.round((options.fadeValue / 1000) * 100)}pct`;
      break;
    case "slider":
      modeSuffix = `slider-${Math.round(options.sliderPosition * 100)}pct`;
      break;
    case "diff":
      modeSuffix = `diff-${options.diffAlgorithm}`;
      break;
    case "side-by-side":
      modeSuffix = "side-by-side";
      break;
    default:
      modeSuffix = "snapshot";
  }

  const basePair = origClean && modClean ? `${origClean}-vs-${modClean}` : (origClean || modClean || "snapshot");
  return `comparecode-${basePair}-${modeSuffix}-${timestamp}.png`;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fallbackToDataUrl = () => {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const parts = dataUrl.split(",");
        const base64 = parts[1] || "";
        const byteString = typeof atob === "function" ? atob(base64) : "";
        const mimeString = (parts[0]?.split(":")[1] || "").split(";")[0] || "image/png";
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new Blob([ab], { type: mimeString }));
      } catch (err) {
        reject(err);
      }
    };

    if (typeof canvas.toBlob === "function") {
      timeoutId = setTimeout(() => {
        if (!settled) {
          fallbackToDataUrl();
        }
      }, 3000);

      try {
        canvas.toBlob((blob) => {
          if (settled) return;
          if (blob) {
            settled = true;
            if (timeoutId !== null) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            resolve(blob);
          } else {
            fallbackToDataUrl();
          }
        }, "image/png");
        return;
      } catch {
        fallbackToDataUrl();
        return;
      }
    }

    fallbackToDataUrl();
  });
}

export class ImageSnapshotService {
  public static async renderSnapshotCanvas(options: SnapshotRenderOptions): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");

    switch (options.compareMode) {
      case "fade":
        await renderFade(
          options.originalImage.url,
          options.modifiedImage.url,
          canvas,
          options.fadeValue / 1000,
          options.alignmentTransform
        );
        break;
      case "slider":
        await renderSlider(
          options.originalImage.url,
          options.modifiedImage.url,
          canvas,
          options.sliderPosition,
          options.alignmentTransform
        );
        break;
      case "diff":
        await renderDiff(
          options.originalImage.url,
          options.modifiedImage.url,
          canvas,
          options.diffAlgorithm,
          options.alignmentTransform
        );
        break;
      case "side-by-side":
        await renderSideBySide(
          options.originalImage.url,
          options.modifiedImage.url,
          canvas
        );
        break;
      default:
        await renderFade(
          options.originalImage.url,
          options.modifiedImage.url,
          canvas,
          0.5,
          options.alignmentTransform
        );
    }

    return canvas;
  }

  public static async downloadSnapshot(options: SnapshotRenderOptions): Promise<string> {
    if (!options.originalImage?.url || !options.modifiedImage?.url) {
      throw new Error("Both original and modified images are required to export a snapshot");
    }

    const canvas = await this.renderSnapshotCanvas(options);
    const blob = await canvasToBlob(canvas);
    const filename = formatSnapshotFilename(options);

    const hasCreateObjectUrl = typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
    const objectUrl = hasCreateObjectUrl ? URL.createObjectURL(blob) : canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (hasCreateObjectUrl && objectUrl.startsWith("blob:")) {
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    }

    return filename;
  }
}
