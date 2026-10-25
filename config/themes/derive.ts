import { ensureContrast, mix, withAlpha } from "./color";
import type { ThemePalette, ThemeTokens } from "./paletteSchema";

const ALERT_KINDS = [
  ["note", "info"],
  ["tip", "success"],
  ["important", "important"],
  ["warning", "warning"],
  ["caution", "destructive"]
] as const;

export const DIFF_TOKEN_NAMES = ["diff-added-bg", "diff-added-fg", "diff-removed-bg", "diff-removed-fg"] as const;

function checkboxCheckImage(color: string): string {
  const path = "M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z";
  const svg = `<svg viewBox='0 0 16 16' fill='${color}' xmlns='http://www.w3.org/2000/svg'><path d='${path}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function deriveThemeTokens(palette: ThemePalette): ThemeTokens {
  const { roles, isDark } = palette;
  const tint = (color: string, light: number, dark: number) => mix(roles.page, color, isDark ? dark : light);
  const readableOn = (color: string, background: string) => ensureContrast(color, background, 4.5, roles.textPrimary);
  const mergeLtrBg = tint(roles.success, 0.12, 0.2);
  const mergeRtlBg = tint(roles.destructive, 0.1, 0.2);
  const minimapAdded = mix(roles.diffAddedStrong, roles.success, 0.3);
  const minimapRemoved = mix(roles.diffRemovedStrong, roles.destructive, 0.3);

  const tokens: ThemeTokens = {
    "bg-primary": roles.page,
    "bg-secondary": roles.surface,
    "bg-selected": roles.selected,
    "text-primary": roles.textPrimary,
    "text-secondary": roles.textSecondary,
    "border-default": roles.border,
    "border-strong": roles.borderStrong,
    "accent": roles.accent,
    "accent-hover": roles.accentHover,
    "accent-content": roles.accentContent,
    "destructive": roles.destructive,
    "destructive-hover": roles.destructiveHover,
    "destructive-content": roles.destructiveContent,
    "destructive-surface": tint(roles.destructive, 0.08, 0.18),
    "success": roles.success,
    "success-hover": roles.successHover,
    "success-content": roles.successContent,
    "support-heart": roles.supportHeart,
    "support-heart-hover": roles.supportHeartHover,
    "support-heart-content": roles.supportHeartContent,
    "warning": roles.warning,
    "info": roles.info,
    "info-hover": mix(roles.info, roles.textPrimary, 0.2),
    "info-bg": tint(roles.info, 0.1, 0.16),
    "info-border": tint(roles.info, 0.45, 0.45),
    "history-merge-ltr-bg": mergeLtrBg,
    "history-merge-ltr-fg": readableOn(roles.success, mergeLtrBg),
    "history-merge-rtl-bg": mergeRtlBg,
    "history-merge-rtl-fg": readableOn(roles.destructive, mergeRtlBg),
    "diff-added-bg": roles.diffAddedLine,
    "diff-added-fg": roles.diffAddedStrong,
    "diff-removed-bg": roles.diffRemovedLine,
    "diff-removed-fg": roles.diffRemovedStrong,
    "diff-empty-bg": roles.diffEmpty,
    "hover-overlay": withAlpha(roles.textPrimary, isDark ? 0.08 : 0.05),
    "syntax-comment": roles.syntaxComment,
    "syntax-string": roles.syntaxString,
    "syntax-number": roles.syntaxNumber,
    "syntax-keyword": roles.syntaxKeyword,
    "syntax-type": roles.syntaxType,
    "syntax-property": roles.syntaxProperty,
    "minimap-bg": roles.surface,
    "minimap-added": minimapAdded,
    "minimap-added-selected": mix(roles.diffAddedStrong, roles.success, 0.7),
    "minimap-removed": minimapRemoved,
    "minimap-removed-selected": mix(roles.diffRemovedStrong, roles.destructive, 0.7),
    "minimap-empty": roles.border,
    "minimap-empty-selected": roles.borderStrong,
    "markdown-code-bg": roles.codeSurface,
    "markdown-code-fg": roles.textPrimary,
    "markdown-code-border": roles.border,
    "markdown-token-comment": roles.syntaxComment,
    "markdown-token-string": roles.syntaxString,
    "markdown-token-number": roles.syntaxNumber,
    "markdown-token-keyword": roles.syntaxKeyword,
    "markdown-token-type": roles.syntaxType,
    "markdown-token-punctuation": roles.textPrimary,
    "markdown-token-name": roles.textPrimary,
    "markdown-mark-bg": roles.markBg,
    "markdown-mark-fg": roles.textPrimary
  };

  for (const [kind, role] of ALERT_KINDS) {
    const base = roles[role];
    const background = tint(base, 0.12, 0.16);
    tokens[`markdown-alert-${kind}-bg`] = background;
    tokens[`markdown-alert-${kind}-border`] = base;
    tokens[`markdown-alert-${kind}-fg`] = readableOn(base, background);
  }

  tokens["checkbox-check"] = checkboxCheckImage(roles.accentContent);
  tokens["markdown-mermaid-bg"] = roles.codeSurface;
  tokens["markdown-mermaid-surface"] = isDark ? mix(roles.codeSurface, roles.textPrimary, 0.08) : roles.page;
  tokens["markdown-mermaid-border"] = roles.borderStrong;

  return { ...tokens, ...palette.overrides } as ThemeTokens;
}
