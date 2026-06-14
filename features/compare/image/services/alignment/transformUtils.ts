import type { ImageFileMeta } from "../../store/useImageCompareStore";
import { ImageAffineTransform } from "./types";

export interface AffineMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createDefaultAlignmentTransform(original: ImageFileMeta, modified: ImageFileMeta): ImageAffineTransform {
  const scale = Math.min(original.width / modified.width, original.height / modified.height);

  return {
    x: original.width / 2,
    y: original.height / 2,
    scaleX: Number.isFinite(scale) && scale > 0 ? scale : 1,
    scaleY: Number.isFinite(scale) && scale > 0 ? scale : 1,
    rotationDeg: 0,
    flipX: false,
    flipY: false
  };
}

export function createIdentityAlignmentTransform(original: ImageFileMeta, modified: ImageFileMeta): ImageAffineTransform {
  return {
    x: modified.width / 2,
    y: modified.height / 2,
    scaleX: 1,
    scaleY: 1,
    rotationDeg: 0,
    flipX: false,
    flipY: false
  };
}

export function getEffectiveScaleX(transform: ImageAffineTransform): number {
  return transform.scaleX * (transform.flipX ? -1 : 1);
}

export function getEffectiveScaleY(transform: ImageAffineTransform): number {
  return transform.scaleY * (transform.flipY ? -1 : 1);
}

export function buildAffineMatrix(transform: ImageAffineTransform, sourceWidth: number, sourceHeight: number): AffineMatrix {
  const rotation = transform.rotationDeg * Math.PI / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const scaleX = getEffectiveScaleX(transform);
  const scaleY = getEffectiveScaleY(transform);
  const a = cos * scaleX;
  const b = sin * scaleX;
  const c = -sin * scaleY;
  const d = cos * scaleY;
  const e = transform.x - a * sourceWidth / 2 - c * sourceHeight / 2;
  const f = transform.y - b * sourceWidth / 2 - d * sourceHeight / 2;

  return { a, b, c, d, e, f };
}

export function transformPoint(matrix: AffineMatrix, x: number, y: number): { x: number; y: number } {
  return {
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f
  };
}

export function getTransformedBounds(transform: ImageAffineTransform, sourceWidth: number, sourceHeight: number): RectBounds {
  const matrix = buildAffineMatrix(transform, sourceWidth, sourceHeight);
  const points = [
    transformPoint(matrix, 0, 0),
    transformPoint(matrix, sourceWidth, 0),
    transformPoint(matrix, sourceWidth, sourceHeight),
    transformPoint(matrix, 0, sourceHeight)
  ];
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export function normalizeTransform(transform: ImageAffineTransform): ImageAffineTransform {
  return {
    x: Number.isFinite(transform.x) ? transform.x : 0,
    y: Number.isFinite(transform.y) ? transform.y : 0,
    scaleX: clampNumber(Math.abs(transform.scaleX), 0.01, 20),
    scaleY: clampNumber(Math.abs(transform.scaleY), 0.01, 20),
    rotationDeg: Number.isFinite(transform.rotationDeg) ? transform.rotationDeg : 0,
    flipX: transform.flipX,
    flipY: transform.flipY
  };
}

export function getPairKey(original: ImageFileMeta | null, modified: ImageFileMeta | null): string | null {
  if (!original || !modified) return null;

  return [
    original.name,
    original.size,
    original.width,
    original.height,
    modified.name,
    modified.size,
    modified.width,
    modified.height
  ].join("|");
}

export function imagesNeedAlignmentPrompt(original: ImageFileMeta | null, modified: ImageFileMeta | null): boolean {
  if (!original || !modified) return false;

  return original.width !== modified.width || original.height !== modified.height;
}
