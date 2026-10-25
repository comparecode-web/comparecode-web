import type { ThemePalette } from "./paletteSchema";
import { bubblegumPalette } from "./palettes/bubblegum";
import { darkPalette } from "./palettes/dark";
import { draculaPalette } from "./palettes/dracula";
import { forestPalette } from "./palettes/forest";
import { lightPalette } from "./palettes/light";
import { nordPalette } from "./palettes/nord";
import { sandPalette } from "./palettes/sand";
import { solarizedDarkPalette } from "./palettes/solarized-dark";
import { solarizedLightPalette } from "./palettes/solarized-light";
import { spacePalette } from "./palettes/space";

export const THEME_PALETTES: ReadonlyArray<ThemePalette> = [
  lightPalette,
  solarizedLightPalette,
  sandPalette,
  bubblegumPalette,
  darkPalette,
  draculaPalette,
  nordPalette,
  solarizedDarkPalette,
  spacePalette,
  forestPalette
];

export const DEFAULT_THEME_ID = lightPalette.id;

export const LEGACY_THEME_ALIASES: Readonly<Record<string, string>> = {
  monokai: darkPalette.id
};
