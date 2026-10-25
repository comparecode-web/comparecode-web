import { deriveThemeTokens } from "./derive";
import type { ThemePalette } from "./paletteSchema";

export const THEME_CSS_HEADER = "/* Generated from config/themes by `npm run themes:generate`. Do not edit by hand. */";

export function buildThemeCss(palettes: ReadonlyArray<ThemePalette>, defaultThemeId: string): string {
  const blocks = palettes.map((palette) => {
    const selector = palette.id === defaultThemeId ? `:root,\n[data-theme="${palette.id}"]` : `[data-theme="${palette.id}"]`;
    const declarations = Object.entries(deriveThemeTokens(palette)).map(([name, value]) => `  --${name}: ${value};`);
    return `${selector} {\n  color-scheme: ${palette.isDark ? "dark" : "light"};\n${declarations.join("\n")}\n}\n`;
  });
  return `${THEME_CSS_HEADER}\n\n${blocks.join("\n")}`;
}
