export const markdownDefaultContent = `---
title: CompareCode Markdown Preview
description: A local GitHub-style Markdown renderer with live preview, math, diagrams, and safe draft persistence.
author: CompareCode
tags: ["markdown", "preview", "mermaid", "latex", "local-first"]
---

# CompareCode Markdown Preview

> [!NOTE]
> This tab is a local Markdown workspace for drafting technical notes, issue descriptions, pull request text, release notes, and documentation snippets. Your latest draft is stored locally in this browser and is not added to CompareCode history.

## Formatting Essentials

Use **bold**, *italic*, and ~~strikethrough~~ to shape short inline text.

**This bold example intentionally spans multiple lines.
The preview should keep the full block bold when the opening and closing markers stay attached to text.**

*This italic example also spans multiple lines.
It is useful when imported Markdown wraps emphasis across soft line breaks.*

~~This strikethrough example spans multiple lines as well.
It can represent removed notes or outdated draft content.~~

### Headings

# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

## Lists

### Bullet List

- Fast local editing
- Live preview
- GitHub-style Markdown support
- Mermaid diagrams and KaTeX formulas

### Numbered List

1. Write the Markdown draft.
2. Review the preview.
3. Copy the final content where you need it.

### Task List

- [x] Support GitHub Flavored Markdown
- [x] Render emoji shortcodes like :joy:
- [x] Support Mermaid diagrams
- [x] Support KaTeX math
- [ ] Finalize your own document

## Quotes and Alerts

> Keep comparison notes close to the work, then move the final Markdown to the destination that needs it.

> [!TIP]
> Use the split handle between the editor and preview to resize the workspace.

> [!IMPORTANT]
> The latest draft is restored from this browser only. It is not synced to an account and is not written into CompareCode history.

> [!WARNING]
> Raw HTML is intentionally limited. Alignment helpers are supported, but unsafe HTML is sanitized.

> [!CAUTION]
> Clearing browser storage can remove the locally saved Markdown draft.

## Alignment Helpers

<div align="left">
Left aligned HTML content is supported through a safe allowlist.
</div>

<div align="center">
Centered content can be used for small callouts or formulas.
</div>

<div align="right">
Right aligned content is supported too.
</div>

## Tables

| Feature | Status | Notes |
| --- | --- | --- |
| GitHub Flavored Markdown | Supported | Tables, task lists, autolinks, and strikethrough |
| Emoji shortcodes | Supported | Try :joy:, :rocket:, or :memo: |
| Mermaid | Supported | Diagrams render automatically when visible |
| KaTeX | Supported | Inline and block math |
| Local persistence | Supported | Draft content is restored on reopen |

## Code Blocks

Inline code works like \`const mode = "markdown"\`.

\`\`\`ts
type CompareCodeTool = "text-compare" | "image-compare" | "markdown-preview";

function getToolTitle(tool: CompareCodeTool): string {
  if (tool === "markdown-preview") {
    return "Markdown Preview";
  }

  return tool === "text-compare" ? "Text Compare" : "Image Compare";
}
\`\`\`

## Mermaid Diagram

\`\`\`mermaid
flowchart LR
  Start[Write Markdown] --> Preview[Live Preview]
  Preview --> Refine[Refine Draft]
  Refine --> Copy[Use Final Text]
  Preview --> Persist[Restore Latest Draft]
\`\`\`

## Math with KaTeX

Inline math: $E = mc^2$

Block math:

$$
\\Delta = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}
$$

## Autolink Example

https://github.com/comparecode-web/comparecode-web

## Scroll Sync Check

This section adds enough content to test synchronized scrolling between the editor and preview panes.

### Notes A

CompareCode keeps browser-based workflows practical by avoiding account requirements and keeping comparison work local.

### Notes B

The Markdown preview follows the same product direction: compact controls, predictable local behavior, and fast feedback while drafting.

### Notes C

The latest draft is restored when you reopen the page, but it does not create history entries.

### Notes D

Use this area to test long documents, tables, code blocks, diagrams, and formulas while resizing the split view.
`;
