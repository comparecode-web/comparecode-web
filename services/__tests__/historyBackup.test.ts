import { describe, expect, it } from "vitest";
import { backupSessionKey, normalizeBackupSession, parseHistoryBackup, type HistoryBackup } from "../historyBackup";
import { HistoryActionType } from "@/types/history";

function backup(): HistoryBackup {
  return { format: "comparecode-history", version: 1, exportedAt: "2026-10-03T09:00:00.000Z", sessions: [{ item: { id: "one", originalText: "a::b", modifiedText: "c", createdAt: "2026-10-03T08:00:00.000Z", isBookmarked: true }, steps: [] }] };
}

describe("portable history backup", () => {
  it("normalizes legacy text sessions without changing text, bookmarks or timestamps", () => {
    const result = parseHistoryBackup(JSON.stringify(backup()));
    expect(result.sessions[0].item).toMatchObject({ originalText: "a::b", modifiedText: "c", isBookmarked: true, stepCount: 0, stepCursor: 0, snapshot: { mode: "text", originalText: "a::b", modifiedText: "c" } });
    expect(parseHistoryBackup(JSON.stringify(result))).toEqual(result);
  });
  it("distinguishes delimiter collisions but recognizes identical sessions with remapped IDs", () => {
    const first = backup().sessions[0];
    expect(backupSessionKey(first)).toBe(backupSessionKey({ ...first, item: { ...first.item, id: "another" } }));
    expect(backupSessionKey(first)).not.toBe(backupSessionKey({ ...first, item: { ...first.item, originalText: "a", modifiedText: "b::c" } }));
  });
  it.each(["{", "null", JSON.stringify({ ...backup(), version: 2 }), JSON.stringify({ ...backup(), format: "other" })])("rejects malformed or future documents without returning partial data", text => {
    expect(() => parseHistoryBackup(text)).toThrow();
  });
  it("rejects duplicate sessions, invalid fields and broken step relationships", () => {
    const value = backup();
    value.sessions.push(value.sessions[0]);
    expect(() => parseHistoryBackup(JSON.stringify(value))).toThrow();
    const broken = backup();
    broken.sessions[0].item.stepCount = 2;
    expect(() => parseHistoryBackup(JSON.stringify(broken))).toThrow();
    broken.sessions[0].item.stepCount = 0;
    broken.sessions[0].item.createdAt = "not a date";
    expect(() => parseHistoryBackup(JSON.stringify(broken))).toThrow();
  });
  it("preserves merge snapshots and undo cursor", () => {
    const value = backup();
    const entry = value.sessions[0];
    entry.item.stepCount = 1; entry.item.stepCursor = 0;
    entry.steps.push({ id: "step", sessionId: "one", actionType: HistoryActionType.Merge, direction: null, beforeOriginalText: "a::b", beforeModifiedText: "c", afterOriginalText: "a::b", afterModifiedText: "a::b", originalLinesAffected: 1, modifiedLinesAffected: 1, blockId: "block", blockKind: "modified", sequenceNumber: 1, createdAt: value.exportedAt });
    const result = parseHistoryBackup(JSON.stringify(value));
    expect(result.sessions[0].item.stepCursor).toBe(0);
    expect(result.sessions[0].steps[0].afterSnapshot).toEqual({ mode: "text", originalText: "a::b", modifiedText: "a::b" });
    entry.steps[0].sessionId = "missing";
    expect(() => parseHistoryBackup(JSON.stringify(value))).toThrow();
  });
  it("requires embedded image content and preserves alignment", () => {
    const entry = backup().sessions[0];
    const data = "data:image/png;base64,aGVsbG8=";
    entry.item.snapshot = { mode: "image", originalImageUrl: "blob:old", modifiedImageUrl: "blob:old2", originalImageDataUrl: data, modifiedImageDataUrl: data, imageAlignmentTransform: { x: -2, y: 5, scaleX: 1, scaleY: 1, rotationDeg: 10, flipX: false, flipY: true } };
    expect(normalizeBackupSession(entry).item.snapshot).toMatchObject({ originalImageUrl: "", originalImageDataUrl: data, imageAlignmentTransform: { x: -2, flipY: true } });
    entry.item.snapshot.originalImageDataUrl = undefined;
    expect(() => normalizeBackupSession(entry)).toThrow(/embedded image/);
  });
});
