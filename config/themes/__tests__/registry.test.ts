import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/config/constants";
import {
  AVAILABLE_THEMES,
  DEFAULT_THEME_ID,
  LEGACY_THEME_ALIASES,
  THEME_GROUPS,
  THEME_PALETTES,
  buildThemeInitScript,
  getThemeHighlightDefaults,
  normalizeThemeId
} from "..";

const ids = THEME_PALETTES.map((palette) => palette.id);

describe("theme registry", () => {
  it("lists unique themes in grouped order", () => {
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_THEME_ID);
    expect(AVAILABLE_THEMES.map((theme) => theme.id)).toEqual(ids);
    expect(THEME_GROUPS.map((group) => group.label)).toEqual(["Light themes", "Dark themes"]);
    expect(THEME_GROUPS.flatMap((group) => group.themes.map((theme) => theme.id))).toEqual(ids);
    expect(THEME_GROUPS.every((group) => group.themes.length > 0)).toBe(true);
    expect(ids).not.toContain("monokai");
  });

  it("maps every legacy alias to a current theme", () => {
    for (const [legacyId, targetId] of Object.entries(LEGACY_THEME_ALIASES)) {
      expect(ids).not.toContain(legacyId);
      expect(ids).toContain(targetId);
    }
    expect(LEGACY_THEME_ALIASES.monokai).toBe("dark");
  });

  it.each([
    ["nord", "nord"],
    ["space", "space"],
    ["monokai", "dark"],
    ["unknown-theme", DEFAULT_THEME_ID],
    ["", DEFAULT_THEME_ID],
    [undefined, DEFAULT_THEME_ID],
    [42, DEFAULT_THEME_ID],
    ["toString", DEFAULT_THEME_ID]
  ])("normalizes %j to %s", (value, expected) => {
    expect(normalizeThemeId(value)).toBe(expected);
  });

  it("resolves diff highlight defaults through the registry", () => {
    expect(getThemeHighlightDefaults("light")).toEqual({
      diffAddedBg: "#e6ffed",
      diffAddedFg: "#acf2bd",
      diffRemovedBg: "#ffeef0",
      diffRemovedFg: "#fdb8c0"
    });
    expect(getThemeHighlightDefaults("monokai")).toEqual(getThemeHighlightDefaults("dark"));
    expect(getThemeHighlightDefaults("missing")).toEqual(getThemeHighlightDefaults(DEFAULT_THEME_ID));
  });
});

describe("theme init script", () => {
  const runScript = () => new Function(buildThemeInitScript())();

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it.each([
    ["nord", "nord"],
    ["monokai", "dark"],
    ["unknown-theme", "unknown-theme"]
  ])("applies stored theme %s as %s before hydration", (stored, expected) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ theme: stored, fontSize: 18 }));
    runScript();
    expect(document.documentElement).toHaveAttribute("data-theme", expected);
  });

  it.each([null, "not json", JSON.stringify({ theme: 7 }), JSON.stringify({ fontSize: 18 })])("keeps the default for %j", (stored) => {
    if (stored !== null) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, stored);
    }
    runScript();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("does not rewrite stored settings", () => {
    const stored = JSON.stringify({ theme: "monokai" });
    localStorage.setItem(STORAGE_KEYS.SETTINGS, stored);
    runScript();
    expect(localStorage.getItem(STORAGE_KEYS.SETTINGS)).toBe(stored);
  });
});
