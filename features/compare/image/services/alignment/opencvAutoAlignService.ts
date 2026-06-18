import type { ImageFileMeta } from "../../store/useImageCompareStore";
import type { AutoAlignResult } from "./autoAlignService";
import type { ImageAlignmentOptions } from "./types";

interface WorkImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  scale: number;
}

interface WorkerSuccess {
  id: number;
  success: true;
  matrix: number[];
  matches: number;
  inliers: number;
}

interface WorkerFailure {
  id: number;
  success: false;
  error: string;
}

type WorkerResult = WorkerSuccess | WorkerFailure;

const OPENCV_WORK_SIZE = 400;
const OPENCV_TIMEOUT_MS = 12000;
const MIN_INLIERS = 8;

function loadWorkImage(image: ImageFileMeta): Promise<WorkImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, OPENCV_WORK_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({ data: imageData.data, width: canvas.width, height: canvas.height, scale });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = image.url;
  });
}

function runOpenCvWorker(original: WorkImage, modified: WorkImage): Promise<WorkerResult> {
  return new Promise((resolve) => {
    const worker = new Worker("/vendor/opencv-align-worker.js");
    const id = Date.now();
    const timeout = window.setTimeout(() => {
      worker.terminate();
      resolve({ id, success: false, error: "OpenCV alignment timed out" });
    }, OPENCV_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<WorkerResult>) => {
      if (event.data.id !== id) return;
      window.clearTimeout(timeout);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      worker.terminate();
      resolve({ id, success: false, error: "OpenCV worker failed" });
    };

    worker.postMessage(
      {
        id,
        original: { width: original.width, height: original.height, data: original.data.buffer },
        modified: { width: modified.width, height: modified.height, data: modified.data.buffer }
      },
      [original.data.buffer, modified.data.buffer]
    );
  });
}

function matToTransform(matrix: number[], original: ImageFileMeta, modified: ImageFileMeta, workScale: number) {
  if (matrix.length < 6) return null;

  const a = matrix[0];
  const c = matrix[1];
  const e = matrix[2];
  const b = matrix[3];
  const d = matrix[4];
  const f = matrix[5];
  const estimatedScale = Math.sqrt(a * a + b * b);
  if (!Number.isFinite(estimatedScale) || estimatedScale <= 0) return null;
  const aspectDelta = Math.abs(original.width / original.height - modified.width / modified.height);
  const scale = aspectDelta < 0.03 && Math.abs(estimatedScale - 1) < 0.07 ? 1 : estimatedScale;

  return {
    x: (a * modified.width * workScale / 2 + c * modified.height * workScale / 2 + e) / workScale,
    y: (b * modified.width * workScale / 2 + d * modified.height * workScale / 2 + f) / workScale,
    scaleX: scale,
    scaleY: scale,
    rotationDeg: Math.atan2(b, a) * 180 / Math.PI,
    flipX: false,
    flipY: false
  };
}

export async function estimateOpenCvAutoAlignment(
  original: ImageFileMeta,
  modified: ImageFileMeta,
  options: ImageAlignmentOptions
): Promise<AutoAlignResult> {
  if (typeof Worker === "undefined") {
    return {
      success: false,
      error: {
        code: "alignment/opencv-disabled",
        message: "OpenCV alignment requires Web Workers."
      }
    };
  }

  try {
    const [originalWork, modifiedWork] = await Promise.all([loadWorkImage(original), loadWorkImage(modified)]);
    const result = await runOpenCvWorker(originalWork, modifiedWork);
    if (!result.success || result.inliers < MIN_INLIERS) {
      return {
        success: false,
        error: {
          code: "alignment/opencv-failed",
          message: result.success ? "Not enough OpenCV inliers" : result.error
        }
      };
    }

    let transform = matToTransform(result.matrix, original, modified, originalWork.scale);
    if (!transform) {
      return {
        success: false,
        error: {
          code: "alignment/opencv-failed",
          message: "OpenCV transform failed."
        }
      };
    }
    if (!options.rotate) {
      transform = { ...transform, rotationDeg: 0 };
    }
    if (!options.scale) {
      transform = { ...transform, scaleX: 1, scaleY: 1 };
    }

    return {
      success: true,
      transform,
      confidence: Math.min(1, result.inliers / Math.max(MIN_INLIERS, result.matches)),
      matchCount: result.inliers
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "alignment/opencv-failed",
        message: error instanceof Error ? error.message : "OpenCV alignment failed."
      }
    };
  }
}
