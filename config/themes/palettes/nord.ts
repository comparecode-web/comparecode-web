import { composite, ensureContrast } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#2e3440";
const surface = "#3b4252";
const textPrimary = "#eceff4";
const diffAddedLine = composite("rgba(163, 190, 140, 0.24)", page);
const diffRemovedLine = composite("rgba(191, 97, 106, 0.28)", page);
const selected = "#434c5e";
const readable = (color: string) => ensureContrast(color, [page, surface], 4.5, textPrimary);
const code = (color: string) => ensureContrast(color, [page, surface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);

export const nordPalette: ThemePalette = {
  id: "nord",
  name: "Nord",
  isDark: true,
  roles: {
    page,
    surface,
    selected,
    border: "#4c566a",
    borderStrong: ensureContrast("#7b88a1", [page, surface], 3, textPrimary),
    textPrimary,
    textSecondary: readable("#c0c8d8"),
    accent: ensureContrast("#88c0d0", [page, surface, selected], 4.5, textPrimary),
    accentHover: "#8fbcbb",
    accentContent: "#2e3440",
    destructive: ensureContrast("#bf616a", [page, surface], 5.2, textPrimary),
    destructiveHover: readable("#d08770"),
    destructiveContent: "#2e3440",
    success: "#a3be8c",
    successHover: "#b5d39c",
    successContent: "#2e3440",
    ...supportHeartRoles(page, surface, textPrimary, page),
    info: "#88c0d0",
    warning: "#ebcb8b",
    important: "#b48ead",
    diffAddedLine,
    diffAddedStrong: "#4f6b40",
    diffRemovedLine,
    diffRemovedStrong: "#8b4c56",
    diffEmpty: "#3f4657",
    syntaxComment: code("#616e88"),
    syntaxString: code("#a3be8c"),
    syntaxNumber: code("#b48ead"),
    syntaxKeyword: code("#81a1c1"),
    syntaxType: code("#8fbcbb"),
    syntaxProperty: code("#88c0d0"),
    codeSurface: surface,
    markBg: composite("rgba(235, 203, 139, 0.26)", page)
  }
};
