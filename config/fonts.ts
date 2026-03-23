export interface FontOption {
  id: string;
  name: string;
  value: string;
}

export const AVAILABLE_FONTS: Array<FontOption> = [
  {
    id: "system",
    name: "System (default)",
    value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
  },
  {
    id: "inter",
    name: "Inter",
    value: "'Inter', sans-serif"
  },
  {
    id: "fira-code",
    name: "Fira Code",
    value: "'Fira Code', monospace"
  },
  {
    id: "inconsolata",
    name: "Inconsolata",
    value: "'Inconsolata', monospace"
  },
  {
    id: "jetbrains-mono",
    name: "JetBrains Mono",
    value: "'JetBrains Mono', monospace"
  },
  {
    id: "roboto-mono",
    name: "Roboto Mono",
    value: "'Roboto Mono', monospace"
  },
  {
    id: "source-code-pro",
    name: "Source Code Pro",
    value: "'Source Code Pro', monospace"
  }
];