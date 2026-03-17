export interface ThemeOption {
  id: string;
  name: string;
}

export const AVAILABLE_THEMES: Array<ThemeOption> = [
  { id: "light", name: "Light Mode" },
  { id: "dark", name: "Dark Mode" }
];