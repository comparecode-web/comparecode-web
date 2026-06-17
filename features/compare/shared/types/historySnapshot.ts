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
  originalImageType?: string;
  modifiedImageType?: string;
  originalImageSize?: number;
  modifiedImageSize?: number;
  originalImageDataUrl?: string;
  modifiedImageDataUrl?: string;
  originalImageWidth?: number;
  originalImageHeight?: number;
  modifiedImageWidth?: number;
  modifiedImageHeight?: number;
  originalThumbnailDataUrl?: string;
  modifiedThumbnailDataUrl?: string;
  imageAlignmentTransform?: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotationDeg: number;
    flipX: boolean;
    flipY: boolean;
  } | null;
  imageAlignmentMetadata?: {
    method: "manual" | "auto";
    confidence: number | null;
    matchCount: number | null;
    timestamp: number;
  } | null;
}

export type CompareHistorySnapshot = TextHistorySnapshot | ImageHistorySnapshot;

export interface HistoryStepMeta {
  originalLinesAffected?: number;
  modifiedLinesAffected?: number;
  blockId?: string | null;
  blockKind?: string | null;
}
