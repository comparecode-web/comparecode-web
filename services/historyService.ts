import { db } from "@/services/db";
import {
  DiffHistoryItem,
  HistoryActionDirection,
  HistoryActionType,
  HistoryStepItem
} from "@/types/history";

export class HistoryService {
  public static async createMergeSessionAsync(original: string, modified: string, compareMode: "text" | "image" = "text"): Promise<string> {
    const now = new Date().toISOString();
    const newItem: DiffHistoryItem = {
      id: crypto.randomUUID(),
      compareMode,
      originalText: original,
      modifiedText: modified,
      createdAt: now,
      updatedAt: now,
      lastActionAt: now,
      lastActionType: HistoryActionType.Merge,
      lastActionDirection: null,
      stepCount: 0,
      stepCursor: 0,
      isBookmarked: false
    };

    await db.history.add(newItem);
    return newItem.id;
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

  public static async addAsync(original: string, modified: string, compareMode: "text" | "image" = "text"): Promise<string> {
    const now = new Date().toISOString();
    const existingItems = await db.history
      .filter(x => x.originalText === original && x.modifiedText === modified && (x.compareMode ?? "text") === compareMode)
      .toArray();

    if (existingItems.length > 0) {
      const item = existingItems[0];
      item.compareMode = compareMode;
      item.updatedAt = now;
      item.lastActionAt = now;
      item.lastActionType = HistoryActionType.Compare;
      item.lastActionDirection = null;
      await db.history.put(item);
      return item.id;
    } else {
      const newItem: DiffHistoryItem = {
        id: crypto.randomUUID(),
        compareMode,
        originalText: original,
        modifiedText: modified,
        createdAt: now,
        updatedAt: now,
        lastActionAt: now,
        lastActionType: HistoryActionType.Compare,
        lastActionDirection: null,
        stepCount: 0,
        stepCursor: 0,
        isBookmarked: false
      };
      await db.history.add(newItem);
      return newItem.id;
    }
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
    const session = await db.history.get(sessionId);
    if (!session) {
      return;
    }

    const now = new Date().toISOString();
    const currentStepCount = session.stepCount ?? 0;
    const currentCursor = session.stepCursor ?? currentStepCount;

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
        actionType: HistoryActionType.Merge,
        direction,
        originalLinesAffected,
        modifiedLinesAffected,
        beforeOriginalText,
        beforeModifiedText,
        afterOriginalText,
        afterModifiedText,
        blockId,
        blockKind,
        sequenceNumber: nextSequence,
        createdAt: now
      };

      await db.historySteps.add(step);
      await db.history.update(sessionId, {
        originalText: afterOriginalText,
        modifiedText: afterModifiedText,
        updatedAt: now,
        lastActionAt: now,
        lastActionType: HistoryActionType.Merge,
        lastActionDirection: direction,
        stepCount: nextSequence,
        stepCursor: nextSequence
      });
    });
  }

  public static async appendSwapStepAsync(
    sessionId: string,
    beforeOriginalText: string,
    beforeModifiedText: string,
    afterOriginalText: string,
    afterModifiedText: string
  ): Promise<void> {
    const session = await db.history.get(sessionId);
    if (!session) {
      return;
    }

    const now = new Date().toISOString();
    const currentStepCount = session.stepCount ?? 0;
    const currentCursor = session.stepCursor ?? currentStepCount;

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
        actionType: HistoryActionType.Swap,
        direction: null,
        originalLinesAffected: this.getLineCount(beforeOriginalText),
        modifiedLinesAffected: this.getLineCount(beforeModifiedText),
        beforeOriginalText,
        beforeModifiedText,
        afterOriginalText,
        afterModifiedText,
        blockId: null,
        blockKind: null,
        sequenceNumber: nextSequence,
        createdAt: now
      };

      await db.historySteps.add(step);
      await db.history.update(sessionId, {
        originalText: afterOriginalText,
        modifiedText: afterModifiedText,
        updatedAt: now,
        lastActionAt: now,
        lastActionType: HistoryActionType.Swap,
        lastActionDirection: null,
        stepCount: nextSequence,
        stepCursor: nextSequence
      });
    });
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

    const now = new Date().toISOString();
    const nextCursor = stepCursor - 1;

    await db.history.update(sessionId, {
      originalText: step.beforeOriginalText,
      modifiedText: step.beforeModifiedText,
      updatedAt: now,
      lastActionAt: now,
      lastActionType: HistoryActionType.Undo,
      lastActionDirection: step.direction,
      stepCursor: nextCursor
    });

    return {
      originalText: step.beforeOriginalText,
      modifiedText: step.beforeModifiedText,
      stepCount,
      stepCursor: nextCursor
    };
  }

  public static async redoMergeStepAsync(sessionId: string): Promise<{
    originalText: string;
    modifiedText: string;
    stepCount: number;
    stepCursor: number;
  } | null> {
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

    const now = new Date().toISOString();
    await db.history.update(sessionId, {
      originalText: step.afterOriginalText,
      modifiedText: step.afterModifiedText,
      updatedAt: now,
      lastActionAt: now,
      lastActionType: HistoryActionType.Redo,
      lastActionDirection: step.direction,
      stepCursor: targetSequence
    });

    return {
      originalText: step.afterOriginalText,
      modifiedText: step.afterModifiedText,
      stepCount,
      stepCursor: targetSequence
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