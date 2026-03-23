export enum ViewMode {
  Split = "Split",
  Unified = "Unified"
}

export enum PrecisionLevel {
  Word = "Word",
  Character = "Character"
}

export interface CompareSettings {
  ignoreWhitespace: boolean;
  precision: PrecisionLevel;
}

export interface AppSettings {
  isWordWrapEnabled: boolean;
  ignoreWhitespace: boolean;
  precision: PrecisionLevel;
  viewMode: ViewMode;
  fontSize: number;
  fontFamily: string;
  theme: string;
  isContinuousMergeEnabled: boolean;
}