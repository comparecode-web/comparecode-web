---
name: comparecode-markdown
description: Implement or review CompareCode Markdown editing, preview rendering, formatting, paste or import, scroll sync, session history, or Markdown persistence.
---

# CompareCode Markdown

Keep Markdown behavior coherent across editing, transformations, persistence, history, preprocessing, sanitization, rendering, and responsive presentation.

## Required Context

Read `docs/architecture/markdown.md` before changing Markdown code. Read `docs/PERSISTENCE_MIGRATIONS.md` as well when the task changes storage keys, stored shapes, defaults, durability, compatibility behavior, or session history serialization.

## Workflow

1. Classify the task as editor interaction, formatting command, import or paste, content or UI state, history, split or scroll behavior, preprocessing, sanitization, or specialized rendering.
2. Inspect the public entry point, the canonical store or service for that area, its direct callers, and the nearest tests before editing.
3. Keep text transformations in feature services and hooks, content and undo state in `useMarkdownStore`, UI preferences in `useMarkdownUIStore`, and storage access in `markdownStorage.ts`.
4. Preserve the preprocess, parse, sanitize, and render order. Do not bypass `markdownSanitizeSchema` or introduce a parallel raw-HTML rendering path.
5. Use public feature exports outside the module. Keep file, clipboard, raw HTML, Mermaid, link, and image input inside their established validation and sanitization boundaries.
6. Use `$comparecode-ui-components` when shared primitives or the workspace shell change, `$comparecode-data-migration` for persisted contracts, and `$comparecode-browser-testing` for focus, selection, clipboard, file input, resize, scroll, Mermaid, KaTeX, or responsive behavior.

## Validation

Run the focused Markdown service, store, hook, or component tests for the changed owner, then complete the validation required by `AGENTS.md`. Verify selection and focus, undo or redo checkpoints, editor/preview/split parity, and safe rendering only where the change can affect them.
