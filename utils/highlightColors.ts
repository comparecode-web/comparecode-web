import { AppSettings } from "@/types/settings";
import { ThemeHighlightDefaults, getThemeHighlightDefaults } from "@/config/themes";

type CustomHighlightColorKeys =
  | "customDiffAddedBg"
  | "customDiffAddedFg"
  | "customDiffRemovedBg"
  | "customDiffRemovedFg";

export type CustomHighlightColorValues = Pick<AppSettings, CustomHighlightColorKeys>;

export function getThemeDefaultsAsCustomColors(themeId: string): CustomHighlightColorValues {
  const defaults = getThemeHighlightDefaults(themeId);
  return {
    customDiffAddedBg: defaults.diffAddedBg,
    customDiffAddedFg: defaults.diffAddedFg,
    customDiffRemovedBg: defaults.diffRemovedBg,
    customDiffRemovedFg: defaults.diffRemovedFg
  };
}

export function resolveCustomHighlightColors(
  customColors: CustomHighlightColorValues,
  themeDefaults: ThemeHighlightDefaults
): ThemeHighlightDefaults {
  return {
    diffAddedBg: customColors.customDiffAddedBg.trim() || themeDefaults.diffAddedBg,
    diffAddedFg: customColors.customDiffAddedFg.trim() || themeDefaults.diffAddedFg,
    diffRemovedBg: customColors.customDiffRemovedBg.trim() || themeDefaults.diffRemovedBg,
    diffRemovedFg: customColors.customDiffRemovedFg.trim() || themeDefaults.diffRemovedFg
  };
}
