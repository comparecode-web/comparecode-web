export interface ThemeOption {
  id: string;
  name: string;
}

export interface ThemeHighlightDefaults {
  diffAddedBg: string;
  diffAddedFg: string;
  diffRemovedBg: string;
  diffRemovedFg: string;
}

export const AVAILABLE_THEMES: Array<ThemeOption> = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
  { id: "dracula", name: "Dracula" },
  { id: "monokai", name: "Monokai" },
  { id: "solarized-light", name: "Solarized Light" },
  { id: "solarized-dark", name: "Solarized Dark" },
  { id: "nord", name: "Nord" }
];

const THEME_HIGHLIGHT_DEFAULTS: Record<string, ThemeHighlightDefaults> = {
  light: {
    diffAddedBg: "#e6ffed",
    diffAddedFg: "#acf2bd",
    diffRemovedBg: "#ffeef0",
    diffRemovedFg: "#fdb8c0"
  },
  dark: {
    diffAddedBg: "#0d2115",
    diffAddedFg: "#1f6b35",
    diffRemovedBg: "#2d0e12",
    diffRemovedFg: "#a1292d"
  },
  dracula: {
    diffAddedBg: "#1d3324",
    diffAddedFg: "#357a49",
    diffRemovedBg: "#381b1f",
    diffRemovedFg: "#8f464d"
  },
  monokai: {
    diffAddedBg: "#a6e22e26",
    diffAddedFg: "#8bb529",
    diffRemovedBg: "#f9267226",
    diffRemovedFg: "#d3205f"
  },
  "solarized-light": {
    diffAddedBg: "#85990026",
    diffAddedFg: "#85990059",
    diffRemovedBg: "#dc322f26",
    diffRemovedFg: "#dc322f59"
  },
  "solarized-dark": {
    diffAddedBg: "#85990040",
    diffAddedFg: "#4d5900",
    diffRemovedBg: "#dc322f40",
    diffRemovedFg: "#801d1b"
  },
  nord: {
    diffAddedBg: "#a3be8c1f",
    diffAddedFg: "#4f6343",
    diffRemovedBg: "#bf616a1f",
    diffRemovedFg: "#6b3a40"
  }
};

export function getThemeHighlightDefaults(themeId: string): ThemeHighlightDefaults {
  return THEME_HIGHLIGHT_DEFAULTS[themeId] ?? THEME_HIGHLIGHT_DEFAULTS.light;
}