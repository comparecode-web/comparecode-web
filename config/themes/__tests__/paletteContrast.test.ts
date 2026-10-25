import { describe, expect, it } from "vitest";
import { composite, contrastRatio, deltaE, parseColor } from "../color";
import { deriveThemeTokens } from "../derive";
import type { ThemeColorRole, ThemePalette } from "../paletteSchema";
import { THEME_PALETTES } from "../registry";

const TEXT = 4.5;
const NON_TEXT = 3;
const MIN_LINE_DELTA_E = 3;
const MIN_ADDED_REMOVED_DELTA_E = 10;

const SYNTAX_ROLES: ReadonlyArray<ThemeColorRole> = ["syntaxComment", "syntaxString", "syntaxNumber", "syntaxKeyword", "syntaxType", "syntaxProperty"];
const TEXT_SURFACES: ReadonlyArray<ThemeColorRole> = ["page", "surface"];

type Pair = [foreground: string, background: string, minimum: number, label: string];

function rolePairs(palette: ThemePalette): Pair[] {
  const { roles } = palette;
  const pairs: Pair[] = [];
  const add = (foreground: ThemeColorRole, background: ThemeColorRole, minimum: number) => {
    pairs.push([roles[foreground], roles[background], minimum, `${foreground} on ${background}`]);
  };

  for (const surface of ["page", "surface", "selected"] as const) {
    add("textPrimary", surface, TEXT);
    add("accent", surface, TEXT);
  }
  for (const surface of TEXT_SURFACES) {
    for (const role of ["textSecondary", "accentHover", "destructive", "destructiveHover", "success", "supportHeart", "supportHeartHover", "info", "warning"] as const) {
      add(role, surface, TEXT);
    }
    add("borderStrong", surface, NON_TEXT);
  }
  for (const [content, fills] of [
    ["accentContent", ["accent", "accentHover"]],
    ["destructiveContent", ["destructive", "destructiveHover"]],
    ["successContent", ["success", "successHover"]],
    ["supportHeartContent", ["supportHeart", "supportHeartHover"]]
  ] as const) {
    for (const fill of fills) {
      add(content, fill, TEXT);
    }
  }
  for (const line of ["diffAddedLine", "diffRemovedLine", "diffAddedStrong", "diffRemovedStrong", "diffEmpty", "markBg", "codeSurface"] as const) {
    add("textPrimary", line, TEXT);
  }
  for (const role of SYNTAX_ROLES) {
    for (const background of ["page", "codeSurface", "diffAddedLine", "diffRemovedLine"] as const) {
      add(role, background, TEXT);
    }
  }
  return pairs;
}

function derivedPairs(palette: ThemePalette): Pair[] {
  const tokens = deriveThemeTokens(palette);
  const page = palette.roles.page;
  const pairs: Pair[] = [];
  const add = (foreground: string, background: string, minimum = TEXT) => {
    const resolvedBackground = composite(tokens[background], page);
    pairs.push([composite(tokens[foreground], resolvedBackground), resolvedBackground, minimum, `--${foreground} on --${background}`]);
  };

  for (const kind of ["note", "tip", "important", "warning", "caution"]) {
    add(`markdown-alert-${kind}-fg`, `markdown-alert-${kind}-bg`);
    add("text-primary", `markdown-alert-${kind}-bg`);
  }
  add("history-merge-ltr-fg", "history-merge-ltr-bg");
  add("history-merge-rtl-fg", "history-merge-rtl-bg");
  add("info", "info-bg");
  add("text-primary", "info-bg");
  add("text-primary", "destructive-surface");
  add("destructive", "destructive-surface");
  add("text-primary", "markdown-mermaid-surface");
  add("text-primary", "markdown-mermaid-bg");
  return pairs;
}

describe.each(THEME_PALETTES.map((palette) => [palette.id, palette] as const))("%s palette", (_id, palette) => {
  it("keeps text and content colors readable", () => {
    const failures = [...rolePairs(palette), ...derivedPairs(palette)]
      .map(([foreground, background, minimum, label]) => ({ label, minimum, ratio: contrastRatio(foreground, background) }))
      .filter(({ ratio, minimum }) => ratio < minimum)
      .map(({ label, minimum, ratio }) => `${label}: ${ratio.toFixed(2)} < ${minimum}`);
    expect(failures).toEqual([]);
  });

  it("keeps diff lines visible and distinguishable", () => {
    const { roles } = palette;
    expect(deltaE(roles.diffAddedLine, roles.page)).toBeGreaterThanOrEqual(MIN_LINE_DELTA_E);
    expect(deltaE(roles.diffRemovedLine, roles.page)).toBeGreaterThanOrEqual(MIN_LINE_DELTA_E);
    expect(deltaE(roles.diffAddedStrong, roles.diffRemovedStrong)).toBeGreaterThanOrEqual(MIN_ADDED_REMOVED_DELTA_E);
    expect(deltaE(roles.diffAddedLine, roles.diffRemovedLine)).toBeGreaterThanOrEqual(MIN_LINE_DELTA_E);
  });

  it("uses opaque colors for every role", () => {
    const translucent = Object.entries(palette.roles).filter(([, value]) => parseColor(value).a < 1).map(([role]) => role);
    expect(translucent).toEqual([]);
  });

  it("emits opaque hex colors for tokens read by Mermaid and canvas export", () => {
    const tokens = deriveThemeTokens(palette);
    const jsTokens = Object.keys(tokens).filter((name) => name.startsWith("markdown-mermaid-") || name.startsWith("markdown-alert-note-")
      || ["bg-primary", "text-primary", "text-secondary", "accent", ...["diff-added-bg", "diff-added-fg", "diff-removed-bg", "diff-removed-fg", "diff-empty-bg"]].includes(name));
    const invalid = jsTokens.filter((name) => !/^#[0-9a-f]{6}$/.test(tokens[name]));
    expect(invalid).toEqual([]);
  });
});
