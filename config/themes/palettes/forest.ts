import { ensureContrast, mix } from "../color";
import type { ThemePalette } from "../paletteSchema";
import { supportHeartRoles } from "./shared";

const page = "#121a15";
const surface = "#1a251e";
const textPrimary = "#e6f0e8";
const codeSurface = "#0d140f";
const diffAddedLine = mix(page, "#3fb950", 0.22);
const diffRemovedLine = mix(page, "#f0645a", 0.22);
const code = (color: string) => ensureContrast(color, [page, surface, codeSurface, diffAddedLine, diffRemovedLine], 4.5, textPrimary);

export const forestPalette: ThemePalette = {
  id: "forest",
  name: "Forest",
  isDark: true,
  roles: {
    page,
    surface,
    selected: "#25392c",
    border: "#2b3a30",
    borderStrong: ensureContrast("#52695a", [page, surface], 3, textPrimary),
    textPrimary,
    textSecondary: "#a9bdae",
    accent: "#e3b05c",
    accentHover: "#ecc277",
    accentContent: "#2a1a00",
    destructive: "#ff8a7a",
    destructiveHover: "#ffa597",
    destructiveContent: "#2a0a05",
    success: "#7bd389",
    successHover: "#95e0a1",
    successContent: "#06240f",
    ...supportHeartRoles(page, surface, textPrimary, page),
    info: "#8ccfe0",
    warning: "#ffb070",
    important: "#c9a7e8",
    diffAddedLine,
    diffAddedStrong: mix(page, "#3fb950", 0.45),
    diffRemovedLine,
    diffRemovedStrong: mix(page, "#f0645a", 0.42),
    diffEmpty: "#18211b",
    syntaxComment: code("#8a9c8f"),
    syntaxString: code("#c3e88d"),
    syntaxNumber: code("#f6a87a"),
    syntaxKeyword: code("#e9b872"),
    syntaxType: code("#8ccfe0"),
    syntaxProperty: code("#a8d8b9"),
    codeSurface,
    markBg: mix(page, "#e3b05c", 0.3)
  }
};
