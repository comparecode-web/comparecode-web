import { composite, ensureContrast } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#282a36";
const surface = "#343746";
const textPrimary = "#f8f8f2";
const diffAddedLine = composite("rgba(80, 250, 123, 0.2)", page);
const diffRemovedLine = composite("rgba(255, 85, 85, 0.2)", page);
const codeSurface = "#21222c";
const selected = "#44475a";
const code = (color: string) => ensureContrast(color, [page, surface, codeSurface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);

export const draculaPalette: ThemePalette = {
  id: "dracula",
  name: "Dracula",
  isDark: true,
  roles: {
    page,
    surface,
    selected,
    border: "#4d5168",
    borderStrong: "#8b97c2",
    textPrimary,
    textSecondary: "#b4bedf",
    accent: ensureContrast("#bd93f9", [page, surface, selected], 4.5, textPrimary),
    accentHover: "#ff79c6",
    accentContent: "#282a36",
    destructive: "#ff8a80",
    destructiveHover: "#ffa8a0",
    destructiveContent: "#282a36",
    success: "#50fa7b",
    successHover: "#69ff94",
    successContent: "#282a36",
    ...supportHeartRoles(page, surface, textPrimary, page),
    info: "#8be9fd",
    warning: "#ffb86c",
    important: "#bd93f9",
    diffAddedLine,
    diffAddedStrong: "#2f7a45",
    diffRemovedLine,
    diffRemovedStrong: "#9c4750",
    diffEmpty: "#3a3d4e",
    syntaxComment: code("#6272a4"),
    syntaxString: code("#f1fa8c"),
    syntaxNumber: code("#bd93f9"),
    syntaxKeyword: code("#ff79c6"),
    syntaxType: code("#8be9fd"),
    syntaxProperty: code("#ffb86c"),
    codeSurface,
    markBg: composite("rgba(241, 250, 140, 0.28)", page)
  }
};
