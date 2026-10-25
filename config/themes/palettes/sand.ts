import { ensureContrast, mix } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#fbf4e4";
const surface = "#f3e7cb";
const textPrimary = "#2b2114";
const codeSurface = "#f4ead2";
const diffAddedLine = mix(page, "#4f9d3a", 0.18);
const diffRemovedLine = mix(page, "#d0453a", 0.16);
const code = (color: string) => ensureContrast(color, [page, surface, codeSurface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);

export const sandPalette: ThemePalette = {
  id: "sand",
  name: "Sand",
  isDark: false,
  roles: {
    page,
    surface,
    selected: "#ead9b0",
    border: "#e2d2ad",
    borderStrong: ensureContrast("#a88f5e", [page, surface], 3, textPrimary),
    textPrimary,
    textSecondary: "#6b5634",
    accent: "#8a4f1d",
    accentHover: "#6f3e14",
    accentContent: "#ffffff",
    destructive: "#a3311a",
    destructiveHover: "#842513",
    destructiveContent: "#ffffff",
    success: "#3f6b2e",
    successHover: "#2f5422",
    successContent: "#ffffff",
    ...supportHeartRoles(page, surface, textPrimary, "#ffffff"),
    info: "#2f5f8a",
    warning: "#8a5a00",
    important: "#6d4a9e",
    diffAddedLine,
    diffAddedStrong: mix(page, "#4f9d3a", 0.4),
    diffRemovedLine,
    diffRemovedStrong: mix(page, "#d0453a", 0.36),
    diffEmpty: "#f1e8d2",
    syntaxComment: code("#8a7a5c"),
    syntaxString: code("#2f6f5e"),
    syntaxNumber: code("#a0522d"),
    syntaxKeyword: code("#9b2c5a"),
    syntaxType: code("#2f5f8a"),
    syntaxProperty: code("#7a5a10"),
    codeSurface,
    markBg: "#f6dc8a"
  }
};
