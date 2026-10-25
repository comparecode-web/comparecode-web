import { ensureContrast } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#ffffff";
const surface = "#f6f8fa";
const textPrimary = "#24292e";
const diffAddedLine = "#e6ffed";
const diffRemovedLine = "#ffeef0";
const code = (color: string) => ensureContrast(color, [page, surface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);

export const lightPalette: ThemePalette = {
  id: "light",
  name: "Light",
  isDark: false,
  roles: {
    page,
    surface,
    selected: "#eef5ff",
    border: "#d1d5db",
    borderStrong: "#848d97",
    textPrimary,
    textSecondary: "#5f6773",
    accent: "#2563eb",
    accentHover: "#1d4ed8",
    accentContent: "#ffffff",
    destructive: "#c81e1e",
    destructiveHover: "#991b1b",
    destructiveContent: "#ffffff",
    success: "#15803d",
    successHover: "#166534",
    successContent: "#ffffff",
    ...supportHeartRoles(page, surface, textPrimary, "#ffffff"),
    info: "#1d4ed8",
    warning: "#b45309",
    important: "#7c3aed",
    diffAddedLine,
    diffAddedStrong: "#acf2bd",
    diffRemovedLine,
    diffRemovedStrong: "#fdb8c0",
    diffEmpty: "#f0f0f0",
    syntaxComment: code("#57606a"),
    syntaxString: code("#0a3069"),
    syntaxNumber: code("#116329"),
    syntaxKeyword: code("#cf222e"),
    syntaxType: code("#8250df"),
    syntaxProperty: code("#0550ae"),
    codeSurface: surface,
    markBg: "#fff3b0"
  }
};
