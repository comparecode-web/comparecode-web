import { composite, ensureContrast } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#002b36";
const surface = "#073642";
const selected = "#0b4554";
const textPrimary = "#fdf6e3";
const diffAddedLine = composite("rgba(133, 153, 0, 0.22)", page);
const diffRemovedLine = composite("rgba(220, 50, 47, 0.22)", page);
const readable = (color: string) => ensureContrast(color, [page, surface, selected], 4.5, textPrimary);
const code = (color: string) => ensureContrast(color, [page, surface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);
const accent = readable("#268bd2");
const destructive = readable("#dc322f");
const success = readable("#859900");

export const solarizedDarkPalette: ThemePalette = {
  id: "solarized-dark",
  name: "Solarized Dark",
  isDark: true,
  roles: {
    page,
    surface,
    selected,
    border: "#1a4d5b",
    borderStrong: ensureContrast("#586e75", [page, surface], 3, textPrimary),
    textPrimary,
    textSecondary: readable("#93a1a1"),
    accent,
    accentHover: readable("#4ba3e3"),
    accentContent: "#002b36",
    destructive,
    destructiveHover: readable("#ec6a67"),
    destructiveContent: "#002b36",
    success,
    successHover: readable("#a3b82b"),
    successContent: "#002b36",
    ...supportHeartRoles(page, surface, textPrimary, page),
    info: readable("#2aa198"),
    warning: readable("#b58900"),
    important: readable("#6c71c4"),
    diffAddedLine,
    diffAddedStrong: "#4d5900",
    diffRemovedLine,
    diffRemovedStrong: "#801d1b",
    diffEmpty: composite("rgba(88, 110, 117, 0.2)", page),
    syntaxComment: code("#586e75"),
    syntaxString: code("#2aa198"),
    syntaxNumber: code("#d33682"),
    syntaxKeyword: code("#859900"),
    syntaxType: code("#b58900"),
    syntaxProperty: code("#268bd2"),
    codeSurface: surface,
    markBg: composite("rgba(181, 137, 0, 0.28)", page)
  }
};
