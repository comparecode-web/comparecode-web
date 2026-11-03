export const markdownContentStyleHref = "cc-markdown-content";
export const markdownContentStylePrecedence = "cc-markdown";

const monoFont = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
const smallShadow = "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)";

export const markdownContentCss = `
.cc-markdown {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.75rem;
  overflow-wrap: break-word;
}
.cc-markdown *, .cc-markdown *::before, .cc-markdown *::after { box-sizing: border-box; max-width: 100%; }
.cc-markdown > :first-child { margin-top: 0; }
.cc-markdown h1, .cc-markdown h2, .cc-markdown h3, .cc-markdown h4, .cc-markdown h5, .cc-markdown h6 { color: inherit; scroll-margin-top: 0.75rem; }
.cc-markdown h1 { margin: 0.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-default); font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; }
.cc-markdown h2 { margin: 1.5rem 0 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid var(--border-default); font-size: 1.5rem; line-height: 2rem; font-weight: 600; }
.cc-markdown h3 { margin: 1.25rem 0 0.5rem; font-size: 1.25rem; line-height: 1.75rem; font-weight: 600; }
.cc-markdown h4 { margin: 1rem 0 0.5rem; font-size: 1rem; line-height: 1.5rem; font-weight: 600; }
.cc-markdown h5 { margin: 1rem 0 0.375rem; font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; }
.cc-markdown h6 { margin: 1rem 0 0.375rem; font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; color: var(--text-secondary); }
.cc-markdown p { margin: 0.5rem 0; }
.cc-markdown ul { margin: 0.5rem 0; padding-left: 1.5rem; list-style: disc; }
.cc-markdown ol { margin: 0.5rem 0; padding-left: 1.5rem; list-style: decimal; }
.cc-markdown li { margin: 0.125rem 0; }
.cc-markdown li.task-list-item { list-style: none; padding-left: 0; }
.cc-markdown hr { height: 0; margin: 1.5rem 0; border: 0; border-top: 1px solid var(--border-default); }
.cc-markdown img { display: block; height: auto; border: 1px solid var(--border-default); border-radius: 0.375rem; }
.cc-markdown a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.cc-markdown a:hover { color: var(--accent-hover); }
.cc-markdown a code { color: inherit; }
.cc-markdown strong, .cc-markdown b { font-weight: 700; }
.cc-markdown sub, .cc-markdown sup { position: relative; font-size: 75%; line-height: 0; vertical-align: baseline; }
.cc-markdown sub { bottom: -0.25em; }
.cc-markdown sup { top: -0.5em; }
.cc-markdown u, .cc-markdown ins { text-decoration: underline; }
.cc-markdown mark { padding: 0 0.25rem; border-radius: 0.25rem; background: var(--markdown-mark-bg); color: var(--markdown-mark-fg); }
.cc-markdown kbd { padding: 0.125rem 0.375rem; border: 1px solid var(--markdown-code-border); border-radius: 0.25rem; background: var(--markdown-code-bg); color: var(--text-primary); font-family: ${monoFont}; font-size: 0.75rem; line-height: 1rem; font-weight: 600; box-shadow: ${smallShadow}; }
.cc-markdown input[type="checkbox"] { margin: 0 0.5rem 0 0; vertical-align: middle; accent-color: var(--accent); }
.cc-markdown blockquote { margin: 0.75rem 0; padding: 0.125rem 0.75rem; border-left: 4px solid var(--border-default); }
.cc-markdown .cc-markdown-table-wrap { max-width: 100%; overflow: auto; }
.cc-markdown table { width: auto; max-width: 100%; table-layout: auto; border-collapse: collapse; font-size: 0.875rem; line-height: 1.25rem; }
.cc-markdown th, .cc-markdown td { padding: 0.5rem 0.75rem; border: 1px solid var(--border-default); overflow-wrap: break-word; }
.cc-markdown th { background: var(--bg-secondary); text-align: left; font-weight: 600; }
.cc-markdown td { vertical-align: top; }
.cc-markdown details { margin: 0.75rem 0; padding: 0.5rem 0.75rem; border: 1px solid var(--border-default); border-radius: 0.375rem; background: color-mix(in oklab, var(--bg-secondary) 40%, transparent); }
.cc-markdown summary { cursor: pointer; font-weight: 600; outline: none; }
.cc-markdown summary::marker { color: var(--text-secondary); }
.cc-markdown summary:hover { color: var(--accent-hover); }
.cc-markdown summary:focus-visible { color: var(--accent); }
.cc-markdown .cc-markdown-raw { margin: 0.5rem 0; padding: 0.75rem; border: 1px solid var(--border-default); border-radius: 0.25rem; background: var(--bg-secondary); font-family: ${monoFont}; font-size: 0.875rem; line-height: 1.5rem; white-space: pre-wrap; overflow-wrap: break-word; }
.cc-markdown .cc-markdown-fallback { margin: 0; font-family: inherit; white-space: pre-wrap; overflow-wrap: break-word; }
.cc-markdown code.cc-markdown-inline-code { padding: 0.125rem 0.375rem; border: 1px solid var(--markdown-code-border); border-radius: 0.25rem; background: var(--markdown-inline-code-bg); color: var(--markdown-inline-code-fg); font-family: ${monoFont}; font-size: 0.9em; }
.cc-markdown a code.cc-markdown-inline-code { color: inherit; }
.cc-markdown .cc-markdown-code { min-width: 0; max-width: 100%; margin: 0.5rem 0; overflow: hidden; border: 1px solid var(--markdown-code-border); border-radius: 0.375rem; background: var(--markdown-code-bg); }
.cc-markdown .cc-markdown-code-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; min-height: 2rem; padding: 0.125rem 0.25rem 0.125rem 0.75rem; border-bottom: 1px solid var(--markdown-code-border); color: var(--text-secondary); font-size: 0.75rem; line-height: 1rem; }
.cc-markdown .cc-markdown-code-language { display: inline-flex; align-items: center; gap: 0.375rem; min-width: 0; overflow: hidden; font-family: ${monoFont}; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.cc-markdown .cc-markdown-code pre { min-width: 0; max-width: 100%; margin: 0; padding: 1rem; overflow: auto; font-size: 0.875rem; line-height: 1.25rem; }
.cc-markdown .cc-markdown-code code { font-family: ${monoFont}; color: var(--markdown-code-fg); white-space: pre; }
.cc-markdown .cc-token-comment { color: var(--markdown-token-comment); }
.cc-markdown .cc-token-string { color: var(--markdown-token-string); }
.cc-markdown .cc-token-number { color: var(--markdown-token-number); }
.cc-markdown .cc-token-keyword { color: var(--markdown-token-keyword); }
.cc-markdown .cc-token-type { color: var(--markdown-token-type); }
.cc-markdown .cc-token-property { color: var(--markdown-token-property); }
.cc-markdown .cc-token-punctuation { color: var(--markdown-token-punctuation); }
.cc-markdown .cc-token-name { color: var(--markdown-token-name); }
.cc-markdown .cc-markdown-alert { margin: 0.75rem 0; padding: 0.5rem 0.75rem; border-left: 4px solid var(--cc-alert-border); border-radius: 0.375rem; background: var(--cc-alert-bg); }
.cc-markdown .cc-markdown-alert-title { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.125rem; color: var(--cc-alert-fg); font-weight: 600; }
.cc-markdown .cc-markdown-alert-title svg { width: 1rem; height: 1rem; flex-shrink: 0; }
.cc-markdown .cc-markdown-alert-body p { margin: 0; }
.cc-markdown .cc-markdown-alert-note { --cc-alert-bg: var(--markdown-alert-note-bg); --cc-alert-border: var(--markdown-alert-note-border); --cc-alert-fg: var(--markdown-alert-note-fg); }
.cc-markdown .cc-markdown-alert-tip { --cc-alert-bg: var(--markdown-alert-tip-bg); --cc-alert-border: var(--markdown-alert-tip-border); --cc-alert-fg: var(--markdown-alert-tip-fg); }
.cc-markdown .cc-markdown-alert-important { --cc-alert-bg: var(--markdown-alert-important-bg); --cc-alert-border: var(--markdown-alert-important-border); --cc-alert-fg: var(--markdown-alert-important-fg); }
.cc-markdown .cc-markdown-alert-warning { --cc-alert-bg: var(--markdown-alert-warning-bg); --cc-alert-border: var(--markdown-alert-warning-border); --cc-alert-fg: var(--markdown-alert-warning-fg); }
.cc-markdown .cc-markdown-alert-caution { --cc-alert-bg: var(--markdown-alert-caution-bg); --cc-alert-border: var(--markdown-alert-caution-border); --cc-alert-fg: var(--markdown-alert-caution-fg); }
.cc-markdown .cc-markdown-frontmatter { margin-bottom: 1.25rem; overflow: hidden; border: 1px solid var(--border-default); border-radius: 0.25rem; background: var(--bg-primary); }
.cc-markdown .cc-markdown-frontmatter table { width: 100%; table-layout: fixed; }
.cc-markdown .cc-markdown-frontmatter th, .cc-markdown .cc-markdown-frontmatter td { border: 0; border-bottom: 1px solid var(--border-default); }
.cc-markdown .cc-markdown-frontmatter tr:last-child th, .cc-markdown .cc-markdown-frontmatter tr:last-child td { border-bottom: 0; }
.cc-markdown .cc-markdown-frontmatter th { width: 8rem; border-right: 1px solid var(--border-default); text-align: right; }
.cc-markdown .cc-markdown-frontmatter-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.cc-markdown .cc-markdown-frontmatter-tag { padding: 0.125rem 0.625rem; border: 1px solid var(--border-default); border-radius: 9999px; background: var(--bg-secondary); color: var(--accent); font-size: 0.75rem; line-height: 1rem; font-weight: 600; }
.cc-markdown .cc-markdown-mermaid { position: relative; margin: 0.5rem 0; border: 1px solid var(--markdown-mermaid-border); border-radius: 0.375rem; background: var(--markdown-mermaid-bg); box-shadow: ${smallShadow}; }
.cc-markdown .cc-markdown-mermaid-svg { padding: 1rem; overflow: auto; }
.cc-markdown .cc-markdown-mermaid-svg svg { display: block; height: auto; margin: 0 auto; }
.cc-markdown .cc-markdown-mermaid-pending { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; color: var(--text-secondary); font-size: 0.875rem; line-height: 1.25rem; }
.cc-markdown .cc-markdown-mermaid-source { padding: 0.75rem; box-shadow: none; font-size: 0.875rem; }
.cc-markdown .cc-markdown-mermaid-title { display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); font-weight: 600; }
.cc-markdown .cc-markdown-mermaid-title svg { width: 1.125rem; height: 1.125rem; color: var(--accent); }
.cc-markdown .cc-markdown-mermaid pre { margin: 0; max-height: 14rem; overflow: auto; font-family: ${monoFont}; font-size: 0.75rem; line-height: 1.25rem; white-space: pre-wrap; }
.cc-markdown .cc-markdown-mermaid-pending pre { padding: 0.75rem; border: 1px solid var(--markdown-code-border); border-radius: 0.25rem; background: var(--markdown-code-bg); }
.cc-markdown .cc-markdown-mermaid-source pre { max-height: none; color: var(--text-primary); }
.cc-markdown .cc-markdown-mermaid-status { font-size: 0.75rem; line-height: 1rem; font-weight: 600; }
.cc-markdown .footnotes, .cc-markdown section[data-footnotes] { margin-top: 2rem; padding-top: 0.75rem; border-top: 1px solid var(--border-default); color: var(--text-secondary); font-size: 0.875em; }
.cc-markdown section[data-footnotes] h2 { margin-top: 0; border-bottom: 0; font-size: 1rem; line-height: 1.5rem; }
.cc-markdown .katex-display { overflow-x: auto; overflow-y: hidden; }
.cc-markdown[data-export] .cc-markdown-code pre, .cc-markdown[data-export] .cc-markdown-code code { overflow: visible; white-space: pre-wrap; overflow-wrap: anywhere; }
.cc-markdown[data-export] .cc-markdown-table-wrap, .cc-markdown[data-export] .cc-markdown-mermaid-svg, .cc-markdown[data-export] .katex-display { overflow: visible; }
.cc-markdown[data-export="print"] .cc-markdown-code, .cc-markdown[data-export="print"] .cc-markdown-mermaid, .cc-markdown[data-export="print"] tr, .cc-markdown[data-export="print"] img, .cc-markdown[data-export="print"] .cc-markdown-alert { break-inside: avoid; }
.cc-markdown[data-export="print"] h1, .cc-markdown[data-export="print"] h2, .cc-markdown[data-export="print"] h3 { break-after: avoid; }
.cc-markdown .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
`;
