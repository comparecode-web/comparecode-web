export enum HistoryActionType {
  Compare = "COMPARE",
  Merge = "MERGE",
  Swap = "SWAP",
  Restore = "RESTORE",
  Undo = "UNDO",
  Redo = "REDO"
}

export enum HistoryActionDirection {
  LeftToRight = "LTR",
  RightToLeft = "RTL"
}

export interface DiffHistoryItem {
  id: string;
  originalText: string;
  modifiedText: string;
  createdAt: string;
  updatedAt?: string;
  lastActionAt?: string;
  lastActionType?: HistoryActionType;
  lastActionDirection?: HistoryActionDirection | null;
  stepCount?: number;
  stepCursor?: number;
  isBookmarked: boolean;
}

export interface HistoryStepItem {
  id: string;
  sessionId: string;
  actionType: HistoryActionType;
  direction: HistoryActionDirection | null;
  originalLinesAffected: number;
  modifiedLinesAffected: number;
  beforeOriginalText: string;
  beforeModifiedText: string;
  afterOriginalText: string;
  afterModifiedText: string;
  blockId: string | null;
  blockKind: string | null;
  sequenceNumber: number;
  createdAt: string;
}