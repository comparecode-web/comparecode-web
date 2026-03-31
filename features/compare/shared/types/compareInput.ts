import { CompareMode } from "./compareMode";

export interface TextCompareInput {
  mode: "text";
  originalText: string;
  modifiedText: string;
}

export interface ImageCompareInput {
  mode: "image";
  originalImageUrl: string;
  modifiedImageUrl: string;
}

export type CompareInput = TextCompareInput | ImageCompareInput;

export interface CompareResult {
  mode: CompareMode;
}
