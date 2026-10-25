import { ensureContrast } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#0d1117";
const surface = "#161b22";
const textPrimary = "#c9d1d9";
const diffAddedLine = "#0f2a18";
const diffRemovedLine = "#331317";
const code = (color: string) => ensureContrast(color, [page, surface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);

export const darkPalette: ThemePalette = {
  id: "dark",
  name: "Dark",
  isDark: true,
  roles: {
    page,
    surface,
    selected: "#1f2937",
    border: "#30363d",
    borderStrong: "#6e7681",
    textPrimary,
    textSecondary: "#8b949e",
    accent: "#58a6ff",
    accentHover: "#79c0ff",
    accentContent: "#0d1117",
    destructive: "#f85149",
    destructiveHover: "#ff7b72",
    destructiveContent: "#0d1117",
    success: "#3fb950",
    successHover: "#56d364",
    successContent: "#0d1117",
    ...supportHeartRoles(page, surface, textPrimary, page),
    info: "#58a6ff",
    warning: "#d29922",
    important: "#bc8cff",
    diffAddedLine,
    diffAddedStrong: "#1a5c2e",
    diffRemovedLine,
    diffRemovedStrong: "#8e2a2e",
    diffEmpty: "#21262d",
    syntaxComment: code("#8b949e"),
    syntaxString: code("#a5d6ff"),
    syntaxNumber: code("#7ee787"),
    syntaxKeyword: code("#ff7b72"),
    syntaxType: code("#d2a8ff"),
    syntaxProperty: code("#79c0ff"),
    codeSurface: surface,
    markBg: "#5a4514"
  }
};
