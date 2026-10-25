import { STORAGE_KEYS } from "@/config/constants";
import { DEFAULT_THEME_ID, LEGACY_THEME_ALIASES, THEME_PALETTES } from "./registry";

export { DEFAULT_THEME_ID, LEGACY_THEME_ALIASES, THEME_PALETTES } from "./registry";

export interface ThemeOption {
  id: string;
  name: string;
  isDark: boolean;
}

export interface ThemeOptionGroup {
  label: string;
  themes: ReadonlyArray<ThemeOption>;
}

export interface ThemeHighlightDefaults {
  diffAddedBg: string;
  diffAddedFg: string;
  diffRemovedBg: string;
  diffRemovedFg: string;
}

export const AVAILABLE_THEMES: ReadonlyArray<ThemeOption> = THEME_PALETTES.map(({ id, name, isDark }) => ({ id, name, isDark }));

export const THEME_GROUPS: ReadonlyArray<ThemeOptionGroup> = [
  { label: "Light themes", themes: AVAILABLE_THEMES.filter((theme) => !theme.isDark) },
  { label: "Dark themes", themes: AVAILABLE_THEMES.filter((theme) => theme.isDark) }
];

export function normalizeThemeId(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_THEME_ID;
  }
  const resolved = Object.hasOwn(LEGACY_THEME_ALIASES, value) ? LEGACY_THEME_ALIASES[value] : value;
  return THEME_PALETTES.some((palette) => palette.id === resolved) ? resolved : DEFAULT_THEME_ID;
}

export function getThemeHighlightDefaults(themeId: string): ThemeHighlightDefaults {
  const normalizedId = normalizeThemeId(themeId);
  const { roles } = THEME_PALETTES.find((palette) => palette.id === normalizedId)!;
  return {
    diffAddedBg: roles.diffAddedLine,
    diffAddedFg: roles.diffAddedStrong,
    diffRemovedBg: roles.diffRemovedLine,
    diffRemovedFg: roles.diffRemovedStrong
  };
}

export function buildThemeInitScript(): string {
  return `(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(STORAGE_KEYS.SETTINGS)});
    if (!raw) {
      return;
    }
    var parsed = JSON.parse(raw);
    var theme = parsed && parsed.theme;
    if (typeof theme !== "string" || !theme) {
      return;
    }
    var aliases = ${JSON.stringify(LEGACY_THEME_ALIASES)};
    if (Object.prototype.hasOwnProperty.call(aliases, theme)) {
      theme = aliases[theme];
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (_) {
    // Keep the default theme when stored settings are unavailable.
  }
})();`;
}
