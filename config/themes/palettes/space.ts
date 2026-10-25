import { ensureContrast, mix } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#0e1626";
const surface = "#16233a";
const textPrimary = "#eaf2ff";
const codeSurface = "#0a111e";
const diffAddedLine = mix(page, "#2ea043", 0.2);
const diffRemovedLine = mix(page, "#f85149", 0.2);
const code = (color: string) => ensureContrast(color, [page, surface, codeSurface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);

export const spacePalette: ThemePalette = {
  id: "space",
  name: "Space",
  isDark: true,
  roles: {
    page,
    surface,
    selected: "#1f3a63",
    border: "#263654",
    borderStrong: ensureContrast("#4a6690", [page, surface], 3, textPrimary),
    textPrimary,
    textSecondary: "#a8b8d4",
    accent: "#7eb0ff",
    accentHover: "#9cc3ff",
    accentContent: "#06101f",
    destructive: "#ff7a8a",
    destructiveHover: "#ff9aa6",
    destructiveContent: "#1a0508",
    success: "#4ade80",
    successHover: "#6ee7a0",
    successContent: "#052e16",
    ...supportHeartRoles(page, surface, textPrimary, page),
    info: "#67c7ff",
    warning: "#ffc864",
    important: "#c4a1ff",
    diffAddedLine,
    diffAddedStrong: mix(page, "#2ea043", 0.45),
    diffRemovedLine,
    diffRemovedStrong: mix(page, "#f85149", 0.42),
    diffEmpty: "#131d31",
    syntaxComment: code("#7d8fb3"),
    syntaxString: code("#a5e3a0"),
    syntaxNumber: code("#ffb86b"),
    syntaxKeyword: code("#c792ea"),
    syntaxType: code("#7dcfff"),
    syntaxProperty: code("#82aaff"),
    codeSurface,
    markBg: mix(page, "#ffd166", 0.3)
  }
};
