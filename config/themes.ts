export interface ThemeOption {
  id: string;
  name: string;
}

export const AVAILABLE_THEMES: Array<ThemeOption> = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
  { id: "dracula", name: "Dracula" },
  { id: "monokai", name: "Monokai" },
  { id: "solarized-light", name: "Solarized Light" },
  { id: "solarized-dark", name: "Solarized Dark" },
  { id: "nord", name: "Nord" }
];