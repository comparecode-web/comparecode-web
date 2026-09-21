# Markdown Architecture

## Scope and Public API

The Markdown feature owns editor state, formatting commands, file import, rich paste conversion, preview preprocessing, sanitized rendering, Mermaid and KaTeX output, synchronized scrolling, layout settings, and session history. Its implementation lives under `features/markdown`.

External modules must use the public entry point at `features/markdown/index.ts`, which exports `MarkdownView`. Unrelated features must not import Markdown internals.

## Main Flow

1. `MarkdownView` loads persisted content and UI state, wires formatting actions, schedules content saves, and composes the workspace.
2. `MarkdownToolbar` sends semantic formatting actions through `useMarkdownFormattingActions`.
3. `markdownEditorCommands.ts` applies deterministic text and selection transformations.
4. `MarkdownEditorPane` owns textarea interaction, file import, and rich paste handling.
5. `MarkdownSplitView` coordinates editor, preview, resizing, and optional synchronized scrolling.
6. `MarkdownPreviewPane` parses frontmatter, normalizes supported syntax, renders Markdown, and maps specialized blocks to feature components.

Keep text transformation rules in services and hooks rather than duplicating them in toolbar or editor components.

## Rendering and Security Boundary

The preview pipeline uses Remark plugins, raw HTML parsing, the feature-owned sanitize schema, and Rehype rendering. Preserve the order in which content is preprocessed, parsed, sanitized, and rendered.

`markdownSanitizeSchema.ts` is the canonical allowlist for rendered HTML. Never bypass sanitization, render untrusted HTML through a parallel path, or expand the schema without checking the resulting element, attribute, URL, and style surface. Mermaid, code blocks, alerts, tables, frontmatter, and KaTeX remain downstream of the established preview boundary.

## State and Persistence

- `store/useMarkdownStore.ts` owns Markdown content, debounced durable saves, undo/redo state, and the bounded session history.
- `store/useMarkdownUIStore.ts` owns view mode, split size, scroll sync, editor font size, wrapping, and Options/Markdown History panel state.
- `services/markdownStorage.ts` owns the released local-storage and session-storage keys and their serialized shapes.

Markdown content and persisted UI preferences are durable local data. Undo/redo history is session-scoped. Changes to keys, stored shapes, defaults, compatibility readers, or durability must also use `$comparecode-data-migration` and follow `docs/PERSISTENCE_MIGRATIONS.md`.

## Import, Paste, and Formatting

- `markdownFileImport.ts` validates supported text files, enforces the import size limit, and normalizes imported content.
- `markdownPaste.ts` converts supported rich clipboard content into Markdown.
- `markdownEditorCommands.ts` owns formatting transformations and selection results.
- `markdownFrontmatter.ts`, `markdownPreprocess.ts`, and `markdownSoftBreaks.ts` own their respective parsing and normalization rules.

Treat file content, clipboard HTML, raw Markdown HTML, Mermaid source, links, and images as untrusted input at their relevant boundaries.

## UI Boundaries

Use `ToolWorkspaceShell` and shared primitives from `components/ui`. Keep Markdown-only components and product rules in the feature. Changes to shared controls, responsive shell behavior, or theme tokens must also use `$comparecode-ui-components`.

Preserve selection and focus after formatting, undo/redo checkpoints, split resizing, scroll synchronization, and editor/preview/split parity.

Options opens above the editor in the shell's scrollable details area. The icon-labelled Editor/Split/Preview selection bar appears in the compact toolbar with details closed and moves into Layout when open. Session history opens from the icon beside Options in an animated, non-modal right sidebar. The toolbar and editor/preview subtree stay mounted when shell controls change. The mobile view uses its available container width rather than the viewport width, preventing overflow beside application navigation. Formatting popups use the shared portal-based `PopoverMenu` so toolbars cannot clip them. The `O` shortcut opens Options and respects tool controls and modal navigation. See [Workspace UI](workspace-ui.md).

## Validation Map

- Formatting, preprocessing, sanitization, frontmatter, paste, import, or soft breaks: run the focused service tests under `features/markdown/services/__tests__`.
- Content, history, or UI state: run the store tests under `features/markdown/store/__tests__`.
- Editor, preview, split view, alerts, code, or history UI: run the affected component and hook tests.
- Focus, selection, file input, clipboard, responsive layout, synchronized scrolling, Mermaid, or KaTeX behavior: use `$comparecode-browser-testing` when static tests are insufficient.
- Complete the repository validation required by `AGENTS.md` for the type of change.
