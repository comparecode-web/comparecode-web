import { AppSettings, PrecisionLevel, TimeFormat, ViewMode } from "@/types/settings";

export const defaultSettings: AppSettings = {
  isWordWrapEnabled: true,
  ignoreWhitespace: false,
  precision: PrecisionLevel.Word,
  viewMode: ViewMode.Split,
  fontSize: 13.0,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  theme: "light",
  useCustomHighlightColors: false,
  customDiffAddedBg: "#e6ffed",
  customDiffAddedFg: "#acf2bd",
  customDiffRemovedBg: "#ffeef0",
  customDiffRemovedFg: "#fdb8c0",
  dateFormat: "MMMM d",
  timeFormat: TimeFormat.TwentyFourHour,
  isContinuousMergeEnabled: true,
  isJumpButtonsVisible: true
};