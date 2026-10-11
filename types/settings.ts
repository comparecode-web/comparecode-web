export enum ViewMode {
  Split = "Split",
  Unified = "Unified"
}

export enum PrecisionLevel {
  Word = "Word",
  Character = "Character"
}

export type DateFormat = string;

export const TEXT_SYNTAX_LANGUAGES = [
  "plain", "c", "cpp", "csharp", "clojure", "css", "go", "java", "javascript", "json", "markdown",
  "objectivec", "php", "python", "htmlxml", "ruby", "rust", "shell", "sql", "swift", "typescript", "yaml"
] as const;
export type TextSyntaxLanguage = typeof TEXT_SYNTAX_LANGUAGES[number];

export enum TimeFormat {
  TwentyFourHour = "TwentyFourHour",
  TwelveHour = "TwelveHour"
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
  isSyntaxHighlightingEnabled: boolean;
  textSyntaxLanguage: TextSyntaxLanguage;
  theme: string;
  useCustomHighlightColors: boolean;
  customDiffAddedBg: string;
  customDiffAddedFg: string;
  customDiffRemovedBg: string;
  customDiffRemovedFg: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  isContinuousMergeEnabled: boolean;
  isJumpButtonsVisible: boolean;
  isMergeJumpButtonsVisible: boolean;
}
