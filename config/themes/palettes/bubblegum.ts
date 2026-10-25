import { ensureContrast, mix } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#fff7fb";
const surface = "#fbe7f1";
const textPrimary = "#341a26";
const codeSurface = "#fbeef4";
const diffAddedLine = mix(page, "#3fae6a", 0.18);
const diffRemovedLine = mix(page, "#e0533d", 0.16);
const code = (color: string) => ensureContrast(color, [page, surface, codeSurface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);

export const bubblegumPalette: ThemePalette = {
  id: "bubblegum",
  name: "Bubblegum",
  isDark: false,
  roles: {
    page,
    surface,
    selected: "#f6d0e2",
    border: "#f0d0df",
    borderStrong: ensureContrast("#c78aa6", [page, surface], 3, textPrimary),
    textPrimary,
    textSecondary: "#7a4f63",
    accent: "#b01f52",
    accentHover: "#8f1843",
    accentContent: "#ffffff",
    destructive: ensureContrast("#c2410c", [page, surface], 4.5, textPrimary),
    destructiveHover: "#9a3412",
    destructiveContent: "#ffffff",
    success: "#276b43",
    successHover: "#1d5535",
    successContent: "#ffffff",
    ...supportHeartRoles(page, surface, textPrimary, "#ffffff"),
    info: "#2563a8",
    warning: "#a35400",
    important: "#7b3fc4",
    diffAddedLine,
    diffAddedStrong: mix(page, "#3fae6a", 0.4),
    diffRemovedLine,
    diffRemovedStrong: mix(page, "#e0533d", 0.36),
    diffEmpty: "#f8ecf2",
    syntaxComment: code("#9a7186"),
    syntaxString: code("#2e7d4f"),
    syntaxNumber: code("#c2410c"),
    syntaxKeyword: code("#b01f52"),
    syntaxType: code("#6b3fa0"),
    syntaxProperty: code("#2563a8"),
    codeSurface,
    markBg: "#ffe3a3"
  }
};
