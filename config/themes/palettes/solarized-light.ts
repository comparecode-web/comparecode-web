import { composite, ensureContrast } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#fdf6e3";
const surface = "#eee8d5";
const selected = "#e6dfca";
const textPrimary = "#073642";
const diffAddedLine = composite("rgba(133, 153, 0, 0.15)", page);
const diffRemovedLine = composite("rgba(220, 50, 47, 0.13)", page);
const readable = (color: string) => ensureContrast(color, [page, surface, selected], 4.5, textPrimary);
const code = (color: string) => ensureContrast(color, [page, surface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);
const accent = readable("#268bd2");
const destructive = readable("#dc322f");
const success = readable("#859900");

export const solarizedLightPalette: ThemePalette = {
  id: "solarized-light",
  name: "Solarized Light",
  isDark: false,
  roles: {
    page,
    surface,
    selected,
    border: "#d3cbb7",
    borderStrong: ensureContrast("#93a1a1", [page, surface], 3, textPrimary),
    textPrimary,
    textSecondary: readable("#586e75"),
    accent,
    accentHover: readable("#2075b3"),
    accentContent: "#fdf6e3",
    destructive,
    destructiveHover: "#a3221f",
    destructiveContent: "#fdf6e3",
    success,
    successHover: "#4f5c00",
    successContent: "#fdf6e3",
    ...supportHeartRoles(page, surface, textPrimary, "#ffffff"),
    info: accent,
    warning: readable("#b58900"),
    important: readable("#6c71c4"),
    diffAddedLine,
    diffAddedStrong: composite("rgba(133, 153, 0, 0.42)", page),
    diffRemovedLine,
    diffRemovedStrong: composite("rgba(220, 50, 47, 0.36)", page),
    diffEmpty: composite("rgba(147, 161, 161, 0.15)", page),
    syntaxComment: code("#93a1a1"),
    syntaxString: code("#2aa198"),
    syntaxNumber: code("#d33682"),
    syntaxKeyword: code("#859900"),
    syntaxType: code("#b58900"),
    syntaxProperty: code("#268bd2"),
    codeSurface: surface,
    markBg: composite("rgba(181, 137, 0, 0.24)", page)
  }
};
