# Theming Contract

## Purpose

CompareCode themes are typed color palettes. One registry is the source of truth for theme IDs, names, light or dark grouping, generated CSS variables, diff highlight defaults, and the pre-hydration theme script. Automated tests keep every palette readable.

## Ownership

| Owner | Responsibility |
| --- | --- |
| `config/themes/paletteSchema.ts` | `ThemePalette` and the required color roles |
| `config/themes/palettes/*.ts` | One palette per theme |
| `config/themes/registry.ts` | Theme order, `DEFAULT_THEME_ID`, and `LEGACY_THEME_ALIASES` |
| `config/themes/derive.ts` | Converts roles into the CSS variables used by the application |
| `config/themes/color.ts` | Local color math: parsing, OKLab mixing, alpha compositing, WCAG contrast, and contrast adjustment |
| `config/themes/buildThemeCss.ts` | Deterministic CSS output |
| `config/themes/index.ts` | Public API: `AVAILABLE_THEMES`, `THEME_GROUPS`, `normalizeThemeId`, `getThemeHighlightDefaults`, and `buildThemeInitScript` |
| `styles/themes/generated-themes.css` | Generated output imported by `app/globals.css`. Never edit it by hand |

## Roles

Each palette defines opaque colors for these roles:

- Surfaces: `page`, `surface`, `selected`, `border` (decorative divider), and `borderStrong` (control boundary).
- Text: `textPrimary` and `textSecondary`.
- Color pairs follow the tmmp-android palette naming: a color, its hover state, and a `*Content` color placed on top of it. The pairs are `accent` / `accentContent`, `destructive` / `destructiveContent`, `success` / `successContent`, and `supportHeart` / `supportHeartContent`, each with a `*Hover` role. Every pair color is used both as text, icons, borders, or focus indicators and as a solid fill, so it must stay readable on surfaces and under its content color.
- Other states: `info`, `warning`, and `important`. They are used as text and as alert accents.
- CSS variables use the same names in kebab case, for example `--accent-content` and `--destructive-surface` (the tinted destructive background). Tailwind utilities follow them, for example `bg-accent text-accent-content`.
- Diff: `diffAddedLine`, `diffAddedStrong`, `diffRemovedLine`, `diffRemovedStrong`, and `diffEmpty`. The released CSS names `--diff-added-fg` and `--diff-removed-fg` hold the strong inline highlight backgrounds, not foreground colors. The names are kept for compatibility with the `customDiff*` settings.
- Code: six `syntax*` roles, `codeSurface`, and `markBg`. Text compare syntax colors and Markdown code tokens use the same roles.

Palettes may start from canonical brand colors and pass them through `ensureContrast`, which moves a color toward the text color only as far as needed to reach the required ratio.

## Derived Tokens

`deriveThemeTokens` emits every CSS variable consumed by the application, including state tints, Markdown alerts, Mermaid colors, minimap colors, history merge colors, the hover overlay, `color-scheme`, and the themed checkbox check image. Derived values are concrete colors computed in OKLab at generation time. Mermaid and the canvas text export read CSS variables through `getComputedStyle`, so those tokens must stay opaque `#rrggbb` values instead of runtime `color-mix()` expressions. A palette may override a derived token through `overrides`. The same tests apply to the overridden value.

Tailwind maps the variables in an `@theme inline` block, so utilities reference the theme variable directly and also work inside a nested `data-theme` scope.

## Persistence and Startup

The theme ID is stored in the existing settings object. `SettingsService` normalizes it with `normalizeThemeId`: known IDs are kept, legacy aliases are mapped, and missing, malformed, or unknown values fall back to the default in memory. Loading never rewrites stored settings. The stored value changes only when the user saves a setting.

`buildThemeInitScript` runs before hydration from `app/layout.tsx`. It applies the stored theme, including the same legacy aliases, so the first paint matches the loaded settings. Unknown IDs keep the `:root` default theme.

The retired Monokai theme maps to Dark through `LEGACY_THEME_ALIASES`. The change is silent. Custom diff colors are never rewritten.

## Adding a Theme

1. Add `config/themes/palettes/<id>.ts` with every role. Prefer low-chroma surfaces so diff red and green remain distinct. Avoid palettes dominated by red or green.
2. Add it to `THEME_PALETTES` in its light or dark group position.
3. Run `npm run themes:generate`, then `npm run test`.
4. Check the theme in the browser on Home, Text compare with syntax highlighting, Markdown alerts and Mermaid, Image compare, QR, Settings, and `/dev/ui`.

Removing or renaming a released theme requires a `LEGACY_THEME_ALIASES` entry and a persistence contract update.

## Validation

- `config/themes/__tests__/paletteContrast.test.ts` enforces WCAG 2.2 ratios for every palette: 4.5 for text, content on fills, syntax colors on code and diff backgrounds, and derived alert or tint pairs, plus 3 for control borders. It also checks OKLab distance between diff lines and the page and between added and removed highlights, opaque roles, and hex output for JavaScript-read tokens.
- `config/themes/__tests__/themeCss.generated.test.ts` fails when the committed CSS differs from the registry. `npm run themes:generate` runs it with `UPDATE_THEME_CSS=1` to rewrite the file.
- `config/themes/__tests__/registry.test.ts` covers ordering, groups, aliases, normalization, highlight defaults, and the init script.

## Theme-Independent Colors

Image compare difference visualizations, their legends, the image slider handle, and QR export colors are output or data-visualization colors. They intentionally do not follow the active theme.
