# Markdown Architecture

## Scope and Public API

The Markdown feature owns editor state, formatting commands, keyboard editing, file import, rich paste conversion, preview preprocessing, sanitized rendering, Mermaid and KaTeX output, the document outline, diagram viewing and export, document export, full screen, synchronized scrolling, layout settings, and session history. Its implementation lives under `features/markdown`.

External modules must use the public entry point at `features/markdown/index.ts`, which exports `MarkdownView`. Unrelated features must not import Markdown internals.

## Main Flow

1. `MarkdownView` loads persisted content and UI state, wires formatting actions, export, full screen, and the Outline and History panels, schedules content saves, and composes the workspace.
2. `MarkdownToolbar` sends semantic formatting actions through `useMarkdownFormattingActions` and export actions through `useMarkdownExport`.
3. `markdownEditorCommands.ts` applies deterministic text and selection transformations, including list continuation and marker-aware indentation.
4. `MarkdownEditorPane` owns textarea interaction, file import, and rich paste handling. `useMarkdownKeyboardShortcuts` owns its keyboard editing. Its file drop feedback uses the shared `FileDropZone` component also used by Text Compare.
5. `MarkdownSplitView` coordinates editor, preview, resizing, and optional synchronized scrolling.
6. `MarkdownPreviewPane` renders the shared `MarkdownDocumentRenderer` inside the scrollable preview.

Keep text transformation rules in services and hooks rather than duplicating them in toolbar or editor components.

## Document Processing

`markdownSource.ts` prepares the text once for every consumer. It normalizes line endings, runs `markdownPreprocess.ts`, and handles frontmatter. Valid frontmatter, invalid frontmatter, and frontmatter placed directly before the `<!-- comparecode-frontmatter-table -->` marker are replaced by the same number of blank lines, so source line numbers stay identical to the editor.

The whole document renders as one Markdown syntax tree. Reference definitions, footnotes, heading ids, and the Outline are therefore document-wide. `markdownRemarkPlugins.ts` is the single remark plugin list. `remarkMarkdownSpecialBlocks.ts` handles the existing special cases inside the tree:

- A top-level paragraph is shown as raw text only when it looks like a table attempt: its first line starts with `|`, or at least two lines contain a pipe outside inline code and escapes. A sentence such as `a | b` stays a paragraph.
- A top-level table whose source contains a line without a pipe is shown as raw text.
- The first standalone frontmatter table marker becomes the position of the frontmatter table.

`markdownDocument.ts` parses the same prepared source with `unified`, `remark-parse`, and the same plugins. It returns the heading list with depth, text, source line, and id for the Outline and the table of contents, even when the preview is not mounted.

### Heading ids and fragment links

`remarkMarkdownHeadingIds` assigns ids in the syntax tree with the GitHub-compatible `markdownSlug.ts`. Duplicates are numbered document-wide. Slugs that would collide with footnote ids (`fn-*`, `fnref-*`, `footnote-label`) get a `section-` prefix. The sanitizer adds the `user-content-` prefix, as on GitHub, and `remark-rehype` runs with an empty `clobberPrefix` so footnote ids are prefixed once.

`rehypeMarkdownFragmentLinks.ts` runs after sanitization. It rewrites `#slug` links to `#user-content-slug` when that target exists, leaves already prefixed links and missing targets unchanged, and therefore works without JavaScript in exported HTML. In the preview, fragment links scroll inside the document and never open a new tab. External links open in a new tab with `noopener noreferrer`.

## Rendering and Security Boundary

The renderer uses the shared remark plugins, raw HTML parsing, the feature-owned sanitize schema, the fragment link plugin, and KaTeX. Preserve the order in which content is preprocessed, parsed, sanitized, and rendered. The preview and every export instance use the same `MarkdownDocumentRenderer`, so there is no parallel render path.

`markdownSanitizeSchema.ts` is the canonical allowlist for rendered HTML. Never bypass sanitization, render untrusted HTML through a parallel path, or expand the schema without checking the resulting element, attribute, URL, and style surface. Custom components pass through the sanitized `id`, footnote `data-*`, and ARIA attributes.

`MarkdownRenderBoundary` isolates failures. The whole document falls back to its plain source, while alerts and Mermaid diagrams have their own boundaries so one failing block does not hide the document.

### Mermaid

`MermaidBlock` renders with `securityLevel: "strict"`, `suppressErrorRendering: true`, the `base` theme, and root-level `htmlLabels`. Results are keyed by chart and theme. A result that finishes after the chart or theme changed is discarded, so a stale diagram never replaces a newer one. An invalid diagram shows its source and leaves no error graphic in the page body.

`markdownMermaidRenderer.ts` reads theme variables from the block's own element, so a nested `data-theme` scope, such as an export instance, applies. It also serializes `initialize` and `render`, because Mermaid configuration is global. The theme derives distinct node, edge label, line, and group colors (see [Theming](theming.md)).

A rendered diagram shows a toolbar for Expand, Copy image, PNG, and SVG. `MermaidViewerDialog` is portaled to `document.body`, outside the content stylesheet scope. It follows the image alignment dialog layout: a title bar with only the close button, a control bar with the pan hint and the shared `ZoomControls`, the diagram stage, and Download SVG and Download PNG in the footer. It supports wheel, pinch, drag, double-click between fit and 100%, and keyboard control. Dragging never selects text, because the stage is `select-none` and the pointer down default is prevented. Zoom changes the SVG size rather than scaling a raster, so the diagram stays sharp. `markdownDiagramExport.ts` gives the SVG its intrinsic size from the view box and draws it to a canvas from a `data:` URL, within the shared `utils/canvasBudget.ts` limits. If the canvas is blocked for SVG with HTML labels, it renders an export copy with `htmlLabels: false` and retries.

### Code

`CodeBlock` renders inline code as plain text with the dedicated inline code colors. Fenced code shows its language label, a terminal icon for shell languages, and a Copy button. `markdownCodeLanguage.ts` reads the complete fence language, for example `c++`, and maps aliases. `markdownCodeHighlight.ts` uses the shared scanner in `services/syntax` with its budgets and a small cache. Unknown languages and inputs over the budget render as plain text.

The scanner is lexical, not a parser. It can color unusual constructs such as nested languages, deep template nesting, or edge-case heredocs incorrectly, but it never changes the code text.

## Content Stylesheet

The Markdown content appearance lives in one static CSS string, `styles/markdownContentStyles.ts`. This is a deliberate exception to the Tailwind utility rule for document content only. Controls such as the Copy button, the diagram toolbar, and menus keep using Tailwind and the shared primitives, and carry `data-export-exclude`.

- Every rule is scoped under `.cc-markdown`, uses plain CSS and theme variables, and does not depend on Tailwind utilities or application-wide resets, so exported HTML looks the same.
- `MarkdownDocumentRenderer` adds the string through a React `<style>` element with a stable `href` and precedence. The content never changes with the theme. Theme values come from the document root or from the `data-theme` attribute of an export container.
- The stylesheet is unlayered, so it takes effect over Tailwind's layered utilities inside the scope regardless of insertion order.
- `[data-export]` rules wrap long code lines for image and print output and avoid page breaks inside blocks when printing. Table cells keep the preview wrapping, so words are not split.

## Editing

- `useMarkdownKeyboardShortcuts` handles Ctrl/Cmd+B, I, K, and E, undo and redo, Enter list continuation, and Tab indentation in the focused editor. It ignores input during IME composition and any combination with Alt or AltGr, so characters typed with AltGr on keyboards such as the Hungarian layout keep working. Heading and list shortcuts are intentionally not provided yet.
- Enter continues bullets, numbered items, task items, and quotes, and replaces an empty marker with a blank line to leave the list, so the next text starts a new paragraph. It does nothing inside fenced code.
- Tab and Shift+Tab indent and outdent the touched lines. List items move to the content column of the previous item, so `- `, `1. `, and `10. ` markers nest correctly. Other lines move by two spaces.
- Escape arms a one-shot exit: the next Tab or Shift+Tab moves focus normally. Any other key or blur clears it, and Escape that another control already handled does not arm it. The editor pane header explains this while the editor is focused, through text linked with `aria-describedby`. Its space is reserved, so focus does not shift the layout.
- Formatting, indentation, and list continuation use the `operation` history mode: pending typing is committed first, then the operation is one separate undo step. The new line and its inserted marker are one step.
- The toolbar groups headings (Paragraph and Heading 1 to 6, with the current level marked), case (Title case, Uppercase, Lowercase), and alignment into menus. Tables use an 8 by 8 size grid plus custom dimensions. The Insert menu adds inline or block math, terminal blocks, collapsible sections, footnotes, and tested Mermaid templates.

## Outline

The Outline is a right-side panel of `ToolWorkspaceShell`, beside Markdown history, with one panel open at a time. It lists the headings from `markdownDocument.ts` as an indented list, highlights the section at the top of the preview, and on click scrolls the preview and moves the editor caret to the heading line. `markdownTextareaPosition.ts` measures wrapped lines with a mirror element. Copy table of contents writes a GitHub-compatible list of level 2 to 4 headings. Its content renders only while the panel is open.

The preview statistics include an estimated reading time at 200 words per minute.

## Export

The Download menu groups Download (Markdown, HTML, Image), Print (Print / Save as PDF), and Copy (Copy Markdown, Copy formatted text). Markdown download and copy use the store text directly.

Other outputs never read the visible preview, which is not mounted in Editor mode or on the mobile editor tab. `useMarkdownExport` captures the current text, font size, and theme in the export job, and renders `MarkdownExportHost`: a hidden, inert instance of the same renderer at a fixed content width, portaled to `document.body`. Diagrams in it render immediately. The export waits for diagrams (up to 15 seconds), fonts, and images, then removes the instance. Every output, including the HTML title and font size, comes from that job, so edits made while the export is being prepared do not mix into it. No output contains elements marked `data-export-exclude`.

- **Image (.png):** `modern-screenshot` captures the instance with the current theme background. Collapsed sections are opened, code wraps, controls are excluded, and wide content widens the capture up to 1600 pixels. The scale is 2, 1.5, or 1, whichever fits the shared canvas budget. A document too large for every scale shows a message suggesting Print / Save as PDF. Images that cannot be fetched are replaced by a labelled placeholder and reported.
- **HTML:** a standalone file with the content stylesheet, the captured theme variables, a restrictive Content Security Policy, and no scripts. Collapsed sections keep their state and fragment links work. KaTeX math is kept as its MathML output, which browsers render without KaTeX fonts or styles. External images remain remote references, so the file is not guaranteed to be complete offline.
- **Print / Save as PDF:** the instance renders in the light theme, print styles hide the application and the excluded controls, and the browser print dialog opens. The instance is removed after printing.
- **Copy formatted text:** writes HTML and plain text from the instance to the clipboard. The HTML comes from the cleaned clone. For the plain text, the excluded controls are removed from the disposable instance itself, because only a rendered element keeps the line breaks of `innerText`.

## Full Screen

`useMarkdownFullscreen` requests full screen on `document.documentElement`, so popovers, tooltips, and toasts stay visible, and turns on the workspace focus mode. `WorkspaceSidebarProvider` owns focus mode for the current route, and the header and navigation sidebar hide while it is on. When full screen is unavailable, as on iPhone, an expanded view with the same exit button is used instead.

The session follows `fullscreenchange` and `fullscreenElement` rather than an editor key handler, because the browser handles Escape for full screen itself. Only sessions started by the Markdown tool are handled. When a session ends by the button, Escape, the browser, navigation, or unmount, focus mode ends too, the view mode and editor selection stay, and if the editor is focused the next Tab moves focus. In the expanded view, Escape that a dialog or popover consumed does not end the session.

## State and Persistence

- `store/useMarkdownStore.ts` owns Markdown content, debounced durable saves, undo/redo state, and the bounded session history. History modes are `typing`, `checkpoint`, `operation`, and `skip`.
- `store/useMarkdownUIStore.ts` owns view mode, split size, scroll sync, editor font size, wrapping, and the Options, Outline, and Markdown History panel state.
- `services/markdownStorage.ts` owns the released local-storage and session-storage keys and their serialized shapes.

Content hydration occurs once per store lifetime. Pending durable saves are flushed on workspace unmount, page hide, and document visibility loss so navigating back cannot replace a newer draft with an older stored value. The existing keys and formats are unchanged. The panel tab, full screen, focus mode, and viewer zoom are not persisted.

A failed content write keeps the draft pending and displays a persistent toast suggesting Markdown download. A subsequent successful save dismisses the warning.

The Markdown formatting toolbar and Text comparison toolbar share `components/ui/WorkspaceToolbar.tsx` for their 2.75rem minimum height, padding, border, and surface. Markdown line numbers and editor text share the same small vertical inset. The Markdown toolbar stays on one horizontally scrollable row; keyboard focus reveals controls outside the visible area and popup menus remain in portals.

Markdown content and persisted UI preferences are durable local data. Undo/redo history is session-scoped. Changes to keys, stored shapes, defaults, compatibility readers, or durability must also use `$comparecode-data-migration` and follow `docs/PERSISTENCE_MIGRATIONS.md`.

## Import and Paste

- `markdownFileImport.ts` validates supported text files, enforces the import size limit, and normalizes imported content.
- `markdownPaste.ts` converts supported rich clipboard content into Markdown.
- `markdownFrontmatter.ts`, `markdownPreprocess.ts`, and `markdownSoftBreaks.ts` own their respective parsing and normalization rules.

Treat file content, clipboard HTML, raw Markdown HTML, Mermaid source, links, and images as untrusted input at their relevant boundaries.

## UI Boundaries

Formatting actions use shared buttons. Menus use `PopoverMenu`/`MenuItem`, the table grid and custom size form use `Popover`, `FormField`, and `Input`, and the diagram viewer uses `Dialog`/`DialogHeader`. All retain feature-owned formatting and editor focus restoration. The document editor, split resize handle, and table size grid remain specialized. See [Shared UI components](ui-components.md).

After both content and UI hydration complete, the Markdown Options tab, compact Layout control, and `O` shortcut require non-whitespace content. Empty content closes an open Options panel, while Markdown History and Outline remain available. The first compact-toolbar action is always `Test text`, using the canonical `resetMarkdownText` store action.

Use `ToolWorkspaceShell` and shared primitives from `components/ui`. Keep Markdown-only components and product rules in the feature. Changes to shared controls, responsive shell behavior, or theme tokens must also use `$comparecode-ui-components`.

`applyMarkdownEditResult` commits a toolbar, shortcut, list, or paste edit with `flushSync`, then restores the editor scroll position and selection before the next paint, and focuses the editor with `preventScroll`. Otherwise the browser briefly puts the caret at the end of the new value and scrolls to it. Scroll sync ignores a preview scroll event that comes with a preview height change, because that is the browser keeping its place after an edit, not the reader scrolling, and following it would move the editor.

Preserve selection and focus after formatting, undo/redo checkpoints, split resizing, scroll synchronization, and editor/preview/split parity.

Options opens above the editor in the shell's scrollable details area. The icon-labelled Editor/Split/Preview selection bar appears in the compact toolbar with details closed and moves into Layout when open. Outline and session history open from the icons beside Options in an animated, non-modal right sidebar. The toolbar and editor/preview subtree stay mounted when shell controls change. The mobile view uses its available container width rather than the viewport width, preventing overflow beside application navigation. The `O` shortcut opens Options and respects tool controls and modal navigation. See [Workspace UI](workspace-ui.md).

## Validation Map

- Formatting, smart editing, preprocessing, sanitization, frontmatter, paste, import, soft breaks, document processing, slugs, export helpers, or diagram helpers: run the focused service tests under `features/markdown/services/__tests__`.
- Content, history, or UI state: run the store tests under `features/markdown/store/__tests__`.
- Editor, keyboard, preview, document renderer, toolbar, Outline, split view, alerts, code, Mermaid, or history UI: run the affected component tests.
- Export and full screen: run the hook tests under `features/markdown/hooks/__tests__`.
- Content stylesheet: `markdownExport.test.ts` checks that every rule is scoped and uses theme variables only. Visual changes still need before and after screenshots with the default content in light, dark, and one strongly colored theme.
- Focus, selection, file input, clipboard, responsive layout, synchronized scrolling, Mermaid, KaTeX, diagram and document export, printing, full screen, Escape delivery, and AltGr typing: use `$comparecode-browser-testing` when static tests are insufficient.
- Complete the repository validation required by `AGENTS.md` for the type of change.
