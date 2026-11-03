import { getMarkdownDocument } from "@/features/markdown/services/markdownDocument";
import { markdownContentCss } from "@/features/markdown/styles/markdownContentStyles";

export const markdownExportFileName = "comparecode-document";
export const markdownExportContentWidth = 880;
export const markdownExportMaxWidth = 1600;
export const markdownExportExcludeAttribute = "data-export-exclude";

export type MarkdownExportMode = "image" | "print" | "html";

export const markdownExportCsp = "default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline'; font-src data:";

const exportBodyCss = `
html, body { margin: 0; padding: 0; background: var(--bg-primary); color: var(--text-primary); }
body { font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; -webkit-text-size-adjust: 100%; }
.cc-markdown-export { max-width: 56rem; margin: 0 auto; padding: 2rem 1.5rem; }
`;

export function getMarkdownDocumentTitle(value: string): string {
  const firstHeading = getMarkdownDocument(value).headings.find((heading) => heading.depth === 1 && heading.text);
  return firstHeading?.text ?? "CompareCode document";
}

export function getReferencedCssVariables(css: string): Array<string> {
  return Array.from(new Set(Array.from(css.matchAll(/var\((--[a-z0-9-]+)/gi), (match) => match[1])))
    .filter((name) => !name.startsWith("--cc-alert-"));
}

export function readCssVariables(element: Element, names: Array<string>): string {
  const style = getComputedStyle(element);

  return names
    .map((name) => [name, style.getPropertyValue(name).trim()] as const)
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}: ${value};`)
    .join(" ");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function prepareMarkdownExportClone(article: HTMLElement): HTMLElement {
  const clone = article.cloneNode(true) as HTMLElement;

  clone.querySelectorAll(`[${markdownExportExcludeAttribute}]`).forEach((element) => element.remove());
  clone.querySelectorAll(".katex-html").forEach((element) => element.remove());
  clone.querySelectorAll(".katex-mathml").forEach((element) => element.classList.remove("katex-mathml"));
  clone.querySelectorAll("[inert]").forEach((element) => element.removeAttribute("inert"));
  clone.removeAttribute("style");
  clone.removeAttribute("data-export");

  return clone;
}

interface StandaloneHtmlInput {
  title: string;
  bodyHtml: string;
  themeVariables: string;
  fontSize: number;
}

export function buildMarkdownStandaloneHtml({ title, bodyHtml, themeVariables, fontSize }: StandaloneHtmlInput): string {
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `<meta http-equiv="Content-Security-Policy" content="${markdownExportCsp}">`,
    `<title>${escapeHtml(title)}</title>`,
    `<style>:root { ${themeVariables} }${exportBodyCss}${markdownContentCss}</style>`,
    "</head>",
    "<body>",
    `<article class="cc-markdown cc-markdown-export" style="font-size: ${fontSize}px">${bodyHtml}</article>`,
    "</body>",
    "</html>"
  ].join("\n");
}

export function createUnavailableImagePlaceholder(label: string): string {
  const text = escapeHtml(label || "Image unavailable").slice(0, 80);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80"><rect width="320" height="80" rx="6" fill="#f3f4f6" stroke="#9ca3af"/><text x="160" y="45" font-family="sans-serif" font-size="14" fill="#4b5563" text-anchor="middle">${text}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
