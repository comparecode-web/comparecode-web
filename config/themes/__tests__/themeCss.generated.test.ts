import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildThemeCss } from "../buildThemeCss";
import { DEFAULT_THEME_ID, THEME_PALETTES } from "../registry";

const GENERATED_CSS_PATH = path.resolve(__dirname, "../../../styles/themes/generated-themes.css");

describe("generated theme CSS", () => {
  it("matches the palette registry", () => {
    const expected = buildThemeCss(THEME_PALETTES, DEFAULT_THEME_ID);
    if (process.env.UPDATE_THEME_CSS === "1") {
      mkdirSync(path.dirname(GENERATED_CSS_PATH), { recursive: true });
      writeFileSync(GENERATED_CSS_PATH, expected, "utf8");
    }
    const actual = readFileSync(GENERATED_CSS_PATH, "utf8").replace(/\r\n/g, "\n");
    expect(actual, "Run `npm run themes:generate` after changing a palette.").toBe(expected);
  });
});
