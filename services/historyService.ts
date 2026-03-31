import { db } from "@/services/db";
import {
  DiffHistoryItem,
  HistoryActionDirection,
  HistoryActionType,
  HistoryStepItem
} from "@/types/history";
import type { CompareMode } from "@/features/compare/shared/types/compareMode";
import type { CompareHistorySnapshot, HistoryStepMeta, TextHistorySnapshot } from "@/features/compare/shared/types/historySnapshot";

interface HistorySnapshotState {
  snapshot: CompareHistorySnapshot;
  stepCount: number;
  stepCursor: number;
}

interface LegacyTextPair {
  originalText: string;
  modifiedText: string;
}

export class HistoryService {
  private static toTextSnapshot(originalText: string, modifiedText: string): TextHistorySnapshot {
    return {
      mode: "text",
      originalText,
      modifiedText
    };
  }

  private static toLegacyTextPair(snapshot: CompareHistorySnapshot): LegacyTextPair {
    if (snapshot.mode === "text") {
      return {
        originalText: snapshot.originalText,
        modifiedText: snapshot.modifiedText
      };
    }

    return {
      originalText: "",
      modifiedText: ""
    };
  }

  private static buildComparableKey(snapshot: CompareHistorySnapshot): string {
    if (snapshot.mode === "text") {
      return `${snapshot.mode}::${snapshot.originalText}::${snapshot.modifiedText}`;
    }

    return `${snapshot.mode}::${snapshot.originalImageUrl}::${snapshot.modifiedImageUrl}`;
  }

  public static async createSessionAsync(snapshot: CompareHistorySnapshot, actionType: HistoryActionType = HistoryActionType.Compare): Promise<string> {
    const now = new Date().toISOString();
    const textPair = this.toLegacyTextPair(snapshot);
    const newItem: DiffHistoryItem = {
      id: crypto.randomUUID(),
      compareMode: snapshot.mode,
      snapshot,
      originalText: textPair.originalText,
      modifiedText: textPair.modifiedText,
      createdAt: now,
      updatedAt: now,
      lastActionAt: now,
      lastActionType: actionType,
      lastActionDirection: null,
      stepCount: 0,
      stepCursor: 0,
      isBookmarked: false
    };

    await db.history.add(newItem);
    return newItem.id;
  }

  public static async createMergeSessionAsync(original: string, modified: string, compareMode: CompareMode = "text"): Promise<string> {
    if (compareMode === "image") {
      return this.createSessionAsync({ mode: "image", originalImageUrl: original, modifiedImageUrl: modified }, HistoryActionType.Merge);
    }

    return this.createSessionAsync(this.toTextSnapshot(original, modified), HistoryActionType.Merge);
  }

  public static async getSessionAsync(sessionId: string): Promise<DiffHistoryItem | undefined> {
    return db.history.get(sessionId);
  }

  public static async getSessionMetaAsync(sessionId: string): Promise<{ stepCount: number; stepCursor: number } | null> {
    const session = await db.history.get(sessionId);
    if (!session) {
      return null;
    }

    const stepCount = session.stepCount ?? 0;
    const stepCursor = session.stepCursor ?? stepCount;

    return { stepCount, stepCursor };
  }

  public static async addAsync(original: string, modified: string, compareMode: CompareMode = "text"): Promise<string> {
    const snapshot = compareMode === "image"
      ? { mode: "image", originalImageUrl: original, modifiedImageUrl: modified } as const
      : this.toTextSnapshot(original, modified);

    return this.addSnapshotAsync(snapshot);
  }

  public static async addSnapshotAsync(snapshot: CompareHistorySnapshot): Promise<string> {
    const now = new Date().toISOString();
    const targetKey = this.buildComparableKey(snapshot);
    const existingItems = await db.history
      .filter((item) => {
        const mode = item.compareMode ?? "text";
        if (mode !== snapshot.mode) {
          return false;
        }

        if (item.snapshot) {
          return this.buildComparableKey(item.snapshot) === targetKey;
        }

        if (snapshot.mode === "text") {
          return item.originalText === snapshot.originalText && item.modifiedText === snapshot.modifiedText;
        }

        return false;
      })
      .toArray();

    if (existingItems.length > 0) {
      const item = existingItems[0];
      const textPair = this.toLegacyTextPair(snapshot);
      item.compareMode = snapshot.mode;
      item.snapshot = snapshot;
      item.originalText = textPair.originalText;
      item.modifiedText = textPair.modifiedText;
      item.updatedAt = now;
      item.lastActionAt = now;
      item.lastActionType = HistoryActionType.Compare;
      item.lastActionDirection = null;
      await db.history.put(item);
      return item.id;
    }

    return this.createSessionAsync(snapshot, HistoryActionType.Compare);
  }

  public static async appendStepAsync(
    sessionId: string,
    actionType: HistoryActionType,
    direction: HistoryActionDirection | null,
    beforeSnapshot: CompareHistorySnapshot,
    afterSnapshot: CompareHistorySnapshot,
    stepMeta: HistoryStepMeta = {}
  ): Promise<void> {
    const session = await db.history.get(sessionId);
    if (!session) {
      return;
    }

    const now = new Date().toISOString();
    const currentStepCount = session.stepCount ?? 0;
    const currentCursor = session.stepCursor ?? currentStepCount;

    const beforeTextPair = this.toLegacyTextPair(beforeSnapshot);
    const afterTextPair = this.toLegacyTextPair(afterSnapshot);

    const originalLinesAffected = stepMeta.originalLinesAffected
      ?? (beforeSnapshot.mode === "text" ? this.getLineCount(beforeSnapshot.originalText) : 0);
    const modifiedLinesAffected = stepMeta.modifiedLinesAffected
      ?? (beforeSnapshot.mode === "text" ? this.getLineCount(beforeSnapshot.modifiedText) : 0);

    await db.transaction("rw", db.history, db.historySteps, async () => {
      if (currentCursor < currentStepCount) {
        await db.historySteps
          .where("sessionId")
          .equals(sessionId)
          .and((step) => step.sequenceNumber > currentCursor)
          .delete();
      }

      const nextSequence = currentCursor + 1;

      const step: HistoryStepItem = {
        id: crypto.randomUUID(),
        sessionId,
        actionType,
        direction,
        beforeSnapshot,
        afterSnapshot,
        stepMeta,
        originalLinesAffected,
        modifiedLinesAffected,
        beforeOriginalText: beforeTextPair.originalText,
        beforeModifiedText: beforeTextPair.modifiedText,
        afterOriginalText: afterTextPair.originalText,
        afterModifiedText: afterTextPair.modifiedText,
        blockId: stepMeta.blockId ?? null,
        blockKind: stepMeta.blockKind ?? null,
        sequenceNumber: nextSequence,
        createdAt: now
      };

      await db.historySteps.add(step);
      await db.history.update(sessionId, {
        compareMode: afterSnapshot.mode,
        snapshot: afterSnapshot,
        originalText: afterTextPair.originalText,
        modifiedText: afterTextPair.modifiedText,
        updatedAt: now,
        lastActionAt: now,
        lastActionType: actionType,
        lastActionDirection: direction,
        stepCount: nextSequence,
        stepCursor: nextSequence
      });
    });
  }

  public static async appendMergeStepAsync(
    sessionId: string,
    direction: HistoryActionDirection,
    originalLinesAffected: number,
    modifiedLinesAffected: number,
    beforeOriginalText: string,
    beforeModifiedText: string,
    afterOriginalText: string,
    afterModifiedText: string,
    blockId: string,
    blockKind: string
  ): Promise<void> {
    return this.appendStepAsync(
      sessionId,
      HistoryActionType.Merge,
      direction,
      this.toTextSnapshot(beforeOriginalText, beforeModifiedText),
      this.toTextSnapshot(afterOriginalText, afterModifiedText),
      {
        originalLinesAffected,
        modifiedLinesAffected,
        blockId,
        blockKind
      }
    );
  }

  public static async appendSwapStepAsync(
    sessionId: string,
    beforeOriginalText: string,
    beforeModifiedText: string,
    afterOriginalText: string,
    afterModifiedText: string
  ): Promise<void> {
    return this.appendStepAsync(
      sessionId,
      HistoryActionType.Swap,
      null,
      this.toTextSnapshot(beforeOriginalText, beforeModifiedText),
      this.toTextSnapshot(afterOriginalText, afterModifiedText),
      {
        originalLinesAffected: this.getLineCount(beforeOriginalText),
        modifiedLinesAffected: this.getLineCount(beforeModifiedText),
        blockId: null,
        blockKind: null
      }
    );
  }

  public static async undoStepAsync(sessionId: string): Promise<HistorySnapshotState | null> {
    const session = await db.history.get(sessionId);
    if (!session) {
      return null;
    }

    const stepCount = session.stepCount ?? 0;
    const stepCursor = session.stepCursor ?? stepCount;
    if (stepCursor <= 0) {
      return null;
    }

    const step = await db.historySteps
      .where("[sessionId+sequenceNumber]")
      .equals([sessionId, stepCursor])
      .first();

    if (!step) {
      return null;
    }

    const beforeSnapshot = step.beforeSnapshot ?? this.toTextSnapshot(step.beforeOriginalText, step.beforeModifiedText);
    const beforeTextPair = this.toLegacyTextPair(beforeSnapshot);
    const now = new Date().toISOString();
    const nextCursor = stepCursor - 1;

    await db.history.update(sessionId, {
      compareMode: beforeSnapshot.mode,
      snapshot: beforeSnapshot,
      originalText: beforeTextPair.originalText,
      modifiedText: beforeTextPair.modifiedText,
      updatedAt: now,
      lastActionAt: now,
      lastActionType: HistoryActionType.Undo,
      lastActionDirection: step.direction,
      stepCursor: nextCursor
    });

    return {
      snapshot: beforeSnapshot,
      stepCount,
      stepCursor: nextCursor
    };
  }

  public static async redoStepAsync(sessionId: string): Promise<HistorySnapshotState | null> {
    const session = await db.history.get(sessionId);
    if (!session) {
      return null;
    }

    const stepCount = session.stepCount ?? 0;
    const stepCursor = session.stepCursor ?? stepCount;
    if (stepCursor >= stepCount) {
      return null;
    }

    const targetSequence = stepCursor + 1;
    const step = await db.historySteps
      .where("[sessionId+sequenceNumber]")
      .equals([sessionId, targetSequence])
      .first();

    if (!step) {
      return null;
    }

    const afterSnapshot = step.afterSnapshot ?? this.toTextSnapshot(step.afterOriginalText, step.afterModifiedText);
    const afterTextPair = this.toLegacyTextPair(afterSnapshot);
    const now = new Date().toISOString();

    await db.history.update(sessionId, {
      compareMode: afterSnapshot.mode,
      snapshot: afterSnapshot,
      originalText: afterTextPair.originalText,
      modifiedText: afterTextPair.modifiedText,
      updatedAt: now,
      lastActionAt: now,
      lastActionType: HistoryActionType.Redo,
      lastActionDirection: step.direction,
      stepCursor: targetSequence
    });

    return {
      snapshot: afterSnapshot,
      stepCount,
      stepCursor: targetSequence
    };
  }

  private static getLineCount(text: string): number {
    if (!text) {
      return 0;
    }

    return text.split(/\r?\n/).length;
  }

  public static async undoMergeStepAsync(sessionId: string): Promise<{
    originalText: string;
    modifiedText: string;
    stepCount: number;
    stepCursor: number;
  } | null> {
    const result = await this.undoStepAsync(sessionId);
    if (!result || result.snapshot.mode !== "text") {
      return null;
    }

    return {
      originalText: result.snapshot.originalText,
      modifiedText: result.snapshot.modifiedText,
      stepCount: result.stepCount,
      stepCursor: result.stepCursor
    };
  }

  public static async redoMergeStepAsync(sessionId: string): Promise<{
    originalText: string;
    modifiedText: string;
    stepCount: number;
    stepCursor: number;
  } | null> {
    const result = await this.redoStepAsync(sessionId);
    if (!result || result.snapshot.mode !== "text") {
      return null;
    }

    return {
      originalText: result.snapshot.originalText,
      modifiedText: result.snapshot.modifiedText,
      stepCount: result.stepCount,
      stepCursor: result.stepCursor
    };
  }

  public static async getSessionStepsAsync(sessionId: string): Promise<Array<HistoryStepItem>> {
    const steps = await db.historySteps.where("sessionId").equals(sessionId).sortBy("sequenceNumber");
    return steps;
  }

  public static async getAllAsync(): Promise<Array<DiffHistoryItem>> {
    const items = await db.history.toArray();
    return items.sort((a, b) => {
      if (a.isBookmarked === b.isBookmarked) {
        const aTime = new Date(a.lastActionAt ?? a.updatedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.lastActionAt ?? b.updatedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      }
      return a.isBookmarked ? -1 : 1;
    });
  }

  public static async updateBookmarkAsync(id: string, isBookmarked: boolean): Promise<void> {
    await db.history.update(id, { isBookmarked });
  }

  public static async deleteAsync(id: string): Promise<void> {
    await db.transaction("rw", db.history, db.historySteps, async () => {
      await db.history.delete(id);
      await db.historySteps.where("sessionId").equals(id).delete();
    });
  }

  public static async clearAllAsync(): Promise<void> {
    await db.transaction("rw", db.history, db.historySteps, async () => {
      await db.history.clear();
      await db.historySteps.clear();
    });
  }
}