export interface TextHistorySnapshot {
  mode: "text";
  originalText: string;
  modifiedText: string;
}

export interface ImageHistorySnapshot {
  mode: "image";
  originalImageUrl: string;
  modifiedImageUrl: string;
  originalImageName?: string;
  modifiedImageName?: string;
  originalImageDataUrl?: string;
  modifiedImageDataUrl?: string;
  originalImageWidth?: number;
  originalImageHeight?: number;
  modifiedImageWidth?: number;
  modifiedImageHeight?: number;
  originalThumbnailDataUrl?: string;
  modifiedThumbnailDataUrl?: string;
}

export type CompareHistorySnapshot = TextHistorySnapshot | ImageHistorySnapshot;

export interface HistoryStepMeta {
  originalLinesAffected?: number;
  modifiedLinesAffected?: number;
  blockId?: string | null;
  blockKind?: string | null;
}
