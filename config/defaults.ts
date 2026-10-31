import { AppSettings, PrecisionLevel, TimeFormat, ViewMode } from "@/types/settings";
import { DEFAULT_THEME_ID, getThemeHighlightDefaults } from "@/config/themes";

const defaultHighlightColors = getThemeHighlightDefaults(DEFAULT_THEME_ID);

export const defaultSettings: AppSettings = {
  isWordWrapEnabled: true,
  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreRules: [],
  isRealtimeCompareEnabled: false,
  precision: PrecisionLevel.Word,
  viewMode: ViewMode.Split,
  isHideUnchangedEnabled: false,
  unchangedContextLines: 3,
  fontSize: 13.0,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  isSyntaxHighlightingEnabled: false,
  textSyntaxLanguage: "javascript",
  theme: DEFAULT_THEME_ID,
  useCustomHighlightColors: false,
  customDiffAddedBg: defaultHighlightColors.diffAddedBg,
  customDiffAddedFg: defaultHighlightColors.diffAddedFg,
  customDiffRemovedBg: defaultHighlightColors.diffRemovedBg,
  customDiffRemovedFg: defaultHighlightColors.diffRemovedFg,
  dateFormat: "yyyy-MM-dd",
  timeFormat: TimeFormat.TwentyFourHour,
  isContinuousMergeEnabled: true,
  isJumpButtonsVisible: true,
  isMergeJumpButtonsVisible: false
};
