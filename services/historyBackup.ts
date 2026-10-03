import type { DiffHistoryItem, HistoryStepItem } from "@/types/history";
import { HistoryActionDirection, HistoryActionType } from "@/types/history";
import type { CompareHistorySnapshot, ImageHistorySnapshot } from "@/features/compare/shared/types/historySnapshot";

export const MAX_HISTORY_BACKUP_BYTES = 100 * 1024 * 1024;
export interface HistoryBackupSession { item: DiffHistoryItem; steps: HistoryStepItem[] }
export interface HistoryBackup { format: "comparecode-history"; version: 1; exportedAt: string; sessions: HistoryBackupSession[] }

function invalid(): never { throw new Error("This history backup is malformed or incomplete. Nothing was imported."); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function string(value: unknown): string { return typeof value === "string" ? value : invalid(); }
function date(value: unknown): string { const text = string(value); return Number.isFinite(Date.parse(text)) ? text : invalid(); }
function number(value: unknown, min = 0): number { return typeof value === "number" && Number.isFinite(value) && value >= min ? value : invalid(); }
function integer(value: unknown): number { const result = number(value); return Number.isSafeInteger(result) ? result : invalid(); }
function boolean(value: unknown): boolean { return typeof value === "boolean" ? value : invalid(); }
function nullableString(value: unknown): string | null { return value == null ? null : string(value); }
function action(value: unknown): HistoryActionType { return Object.values(HistoryActionType).includes(value as HistoryActionType) ? value as HistoryActionType : invalid(); }
function direction(value: unknown): HistoryActionDirection | null { return value == null ? null : Object.values(HistoryActionDirection).includes(value as HistoryActionDirection) ? value as HistoryActionDirection : invalid(); }
function imageData(value: unknown): string {
  const result = string(value);
  if (!/^data:image\/(?:png|jpeg|gif|webp|bmp|avif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/.test(result)) {
    throw new Error("The backup must contain embedded image data, not temporary or remote image links.");
  }
  return result;
}

function snapshot(value: unknown): CompareHistorySnapshot {
  const data = object(value);
  if (data.mode === "text") return { mode: "text", originalText: string(data.originalText), modifiedText: string(data.modifiedText) };
  if (data.mode !== "image") return invalid();
  const result: ImageHistorySnapshot = { mode: "image", originalImageUrl: "", modifiedImageUrl: "", originalImageDataUrl: imageData(data.originalImageDataUrl || data.originalImageUrl), modifiedImageDataUrl: imageData(data.modifiedImageDataUrl || data.modifiedImageUrl) };
  for (const key of ["originalImageName", "modifiedImageName", "originalImageType", "modifiedImageType"] as const) if (data[key] !== undefined) result[key] = string(data[key]);
  for (const key of ["originalImageSize", "modifiedImageSize", "originalImageWidth", "originalImageHeight", "modifiedImageWidth", "modifiedImageHeight"] as const) if (data[key] !== undefined) result[key] = integer(data[key]);
  for (const key of ["originalThumbnailDataUrl", "modifiedThumbnailDataUrl"] as const) if (data[key]) result[key] = imageData(data[key]);
  if (data.imageAlignmentTransform != null) {
    const t = object(data.imageAlignmentTransform);
    result.imageAlignmentTransform = { x: number(t.x, -Infinity), y: number(t.y, -Infinity), scaleX: number(t.scaleX, Number.MIN_VALUE), scaleY: number(t.scaleY, Number.MIN_VALUE), rotationDeg: number(t.rotationDeg, -Infinity), flipX: boolean(t.flipX), flipY: boolean(t.flipY) };
  }
  if (data.imageAlignmentMetadata != null) {
    const m = object(data.imageAlignmentMetadata);
    if (m.method !== "manual" && m.method !== "auto") return invalid();
    result.imageAlignmentMetadata = { method: m.method, confidence: m.confidence === null ? null : number(m.confidence), matchCount: m.matchCount === null ? null : integer(m.matchCount), timestamp: number(m.timestamp) };
  }
  return result;
}

function textPair(value: CompareHistorySnapshot) {
  return value.mode === "text" ? { originalText: value.originalText, modifiedText: value.modifiedText } : { originalText: "", modifiedText: "" };
}

function session(value: unknown): HistoryBackupSession {
  const data = object(value);
  const raw = object(data.item);
  if (!Array.isArray(data.steps) || data.steps.length > 100_000) return invalid();
  const current = snapshot(raw.snapshot ?? { mode: raw.compareMode ?? "text", originalText: raw.originalText, modifiedText: raw.modifiedText });
  const id = string(raw.id);
  if (!id) return invalid();
  if (raw.compareMode !== undefined && raw.compareMode !== current.mode) return invalid();
  const createdAt = date(raw.createdAt);
  const item: DiffHistoryItem = { id, compareMode: current.mode, snapshot: current, ...textPair(current), createdAt, updatedAt: date(raw.updatedAt ?? createdAt), lastActionAt: date(raw.lastActionAt ?? raw.updatedAt ?? createdAt), lastActionType: action(raw.lastActionType ?? HistoryActionType.Compare), lastActionDirection: direction(raw.lastActionDirection), stepCount: integer(raw.stepCount ?? data.steps.length), stepCursor: integer(raw.stepCursor ?? raw.stepCount ?? data.steps.length), isBookmarked: boolean(raw.isBookmarked) };
  const steps = data.steps.map((value): HistoryStepItem => {
    const s = object(value);
    if (s.sessionId !== id) return invalid();
    const before = snapshot(s.beforeSnapshot ?? { mode: "text", originalText: s.beforeOriginalText, modifiedText: s.beforeModifiedText });
    const after = snapshot(s.afterSnapshot ?? { mode: "text", originalText: s.afterOriginalText, modifiedText: s.afterModifiedText });
    if (before.mode !== current.mode || after.mode !== current.mode) return invalid();
    const beforePair = textPair(before), afterPair = textPair(after);
    const meta = s.stepMeta === undefined ? {} : object(s.stepMeta);
    const stepMeta = {
      ...(meta.originalLinesAffected !== undefined ? { originalLinesAffected: integer(meta.originalLinesAffected) } : {}),
      ...(meta.modifiedLinesAffected !== undefined ? { modifiedLinesAffected: integer(meta.modifiedLinesAffected) } : {}),
      ...(meta.blockId !== undefined ? { blockId: nullableString(meta.blockId) } : {}),
      ...(meta.blockKind !== undefined ? { blockKind: nullableString(meta.blockKind) } : {})
    };
    return { id: string(s.id), sessionId: id, actionType: action(s.actionType), direction: direction(s.direction), beforeSnapshot: before, afterSnapshot: after, stepMeta, beforeOriginalText: beforePair.originalText, beforeModifiedText: beforePair.modifiedText, afterOriginalText: afterPair.originalText, afterModifiedText: afterPair.modifiedText, originalLinesAffected: integer(s.originalLinesAffected), modifiedLinesAffected: integer(s.modifiedLinesAffected), blockId: nullableString(s.blockId), blockKind: nullableString(s.blockKind), sequenceNumber: integer(s.sequenceNumber), createdAt: date(s.createdAt) };
  }).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  if (item.stepCount !== steps.length || item.stepCursor! > steps.length || steps.some((step, index) => step.sequenceNumber !== index + 1) || new Set(steps.map(step => step.id)).size !== steps.length) return invalid();
  return { item, steps };
}

export function normalizeBackupSession(value: HistoryBackupSession): HistoryBackupSession { return session(value); }

export function parseHistoryBackup(text: string): HistoryBackup {
  if (new Blob([text]).size > MAX_HISTORY_BACKUP_BYTES) throw new Error("History backups can be up to 100 MiB.");
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return invalid(); }
  const data = object(raw);
  if (data.format !== "comparecode-history" || data.version !== 1) throw new Error("This backup format or version is not supported. Nothing was imported.");
  if (!Array.isArray(data.sessions) || data.sessions.length > 10_000) return invalid();
  const sessions = data.sessions.map(session);
  if (new Set(sessions.map(({ item }) => item.id)).size !== sessions.length || sessions.reduce((sum, entry) => sum + entry.steps.length, 0) > 100_000) return invalid();
  return { format: "comparecode-history", version: 1, exportedAt: date(data.exportedAt), sessions };
}

export function backupSessionKey(value: HistoryBackupSession): string {
  const normalized = session(value);
  return JSON.stringify({ item: { ...normalized.item, id: "" }, steps: normalized.steps.map(step => ({ ...step, id: "", sessionId: "" })) });
}
