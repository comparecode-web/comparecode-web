export interface ThemeOption {
  id: string;
  name: string;
}

export const AVAILABLE_THEMES: Array<ThemeOption> = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
  { id: "dracula", name: "Dracula" }
];