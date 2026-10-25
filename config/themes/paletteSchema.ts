export interface ThemeColorRoles {
  page: string;
  surface: string;
  selected: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  accentContent: string;
  destructive: string;
  destructiveHover: string;
  destructiveContent: string;
  success: string;
  successHover: string;
  successContent: string;
  supportHeart: string;
  supportHeartHover: string;
  supportHeartContent: string;
  info: string;
  warning: string;
  important: string;
  diffAddedLine: string;
  diffAddedStrong: string;
  diffRemovedLine: string;
  diffRemovedStrong: string;
  diffEmpty: string;
  syntaxComment: string;
  syntaxString: string;
  syntaxNumber: string;
  syntaxKeyword: string;
  syntaxType: string;
  syntaxProperty: string;
  codeSurface: string;
  markBg: string;
}

export type ThemeColorRole = keyof ThemeColorRoles;

export interface ThemePalette {
  id: string;
  name: string;
  isDark: boolean;
  roles: ThemeColorRoles;
  overrides?: Partial<Record<string, string>>;
}

export type ThemeTokens = Record<string, string>;
