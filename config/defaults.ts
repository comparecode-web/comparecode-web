import { AppSettings, PrecisionLevel, ViewMode } from "@/types/settings";

export const defaultSettings: AppSettings = {
  isWordWrapEnabled: true,
  ignoreWhitespace: false,
  precision: PrecisionLevel.Word,
  viewMode: ViewMode.Split,
  fontSize: 13.0,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  theme: "light",
  isContinuousMergeEnabled: true
};