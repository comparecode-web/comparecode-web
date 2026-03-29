export interface TextHistorySnapshot {
  mode: "text";
  originalText: string;
  modifiedText: string;
}

export interface ImageHistorySnapshot {
  mode: "image";
  originalImageUrl: string;
  modifiedImageUrl: string;
}

export type CompareHistorySnapshot = TextHistorySnapshot | ImageHistorySnapshot;

export interface HistoryStepMeta {
  originalLinesAffected?: number;
  modifiedLinesAffected?: number;
  blockId?: string | null;
  blockKind?: string | null;
}
