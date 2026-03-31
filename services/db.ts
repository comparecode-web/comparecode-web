import Dexie, { type Table } from "dexie";
import { DiffHistoryItem, HistoryActionType, HistoryStepItem } from "@/types/history";
import { DB_CONFIG } from "@/config/constants";
import type { CompareHistorySnapshot } from "@/features/compare/shared/types/historySnapshot";

export class CompareCodeDatabase extends Dexie {
  history!: Table<DiffHistoryItem, string>;
  historySteps!: Table<HistoryStepItem, string>;

  constructor() {
    super(DB_CONFIG.NAME);
    this.version(1).stores({
      history: "id, createdAt, isBookmarked"
    });

    this.version(2).stores({
      history: "id, createdAt, updatedAt, isBookmarked, lastActionAt, lastActionType, stepCursor",
      historySteps: "id, sessionId, [sessionId+sequenceNumber], createdAt, sequenceNumber, actionType, direction"
    });

    this.version(DB_CONFIG.VERSION).stores({
      history: "id, createdAt, updatedAt, isBookmarked, lastActionAt, lastActionType, stepCursor",
      historySteps: "id, sessionId, [sessionId+sequenceNumber], createdAt, sequenceNumber, actionType, direction"
    }).upgrade(async (tx) => {
      await tx.table("history").toCollection().modify((item: DiffHistoryItem) => {
        const timestamp = item.createdAt ?? new Date().toISOString();
        item.compareMode = item.compareMode ?? "text";

        if (!item.snapshot) {
          const mode = item.compareMode ?? "text";
          const snapshot: CompareHistorySnapshot = mode === "image"
            ? {
                mode: "image",
                originalImageUrl: "",
                modifiedImageUrl: ""
              }
            : {
                mode: "text",
                originalText: item.originalText ?? "",
                modifiedText: item.modifiedText ?? ""
              };

          item.snapshot = snapshot;
        }

        item.updatedAt = item.updatedAt ?? timestamp;
        item.lastActionAt = item.lastActionAt ?? timestamp;
        item.lastActionType = item.lastActionType ?? HistoryActionType.Compare;
        item.lastActionDirection = item.lastActionDirection ?? null;
        item.stepCount = item.stepCount ?? 0;
        item.stepCursor = item.stepCursor ?? item.stepCount;
      });

      await tx.table("historySteps").toCollection().modify((step: HistoryStepItem) => {
        if (!step.beforeSnapshot) {
          step.beforeSnapshot = {
            mode: "text",
            originalText: step.beforeOriginalText ?? "",
            modifiedText: step.beforeModifiedText ?? ""
          };
        }

        if (!step.afterSnapshot) {
          step.afterSnapshot = {
            mode: "text",
            originalText: step.afterOriginalText ?? "",
            modifiedText: step.afterModifiedText ?? ""
          };
        }
      });
    });
  }
}

export const db = new CompareCodeDatabase();