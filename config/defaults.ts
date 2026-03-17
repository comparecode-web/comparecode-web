import { AppSettings, PrecisionLevel, ViewMode } from "@/types/settings";

export const defaultSettings: AppSettings = {
  isWordWrapEnabled: true,
  ignoreWhitespace: false,
  precision: PrecisionLevel.Word,
  viewMode: ViewMode.Split,
  fontSize: 13.0,
  theme: "light"
};