---
name: comparecode-text-compare
description: Implement or review CompareCode text input, diff calculation and rendering, merge behavior, block navigation, text settings, or text-history restoration.
---

# CompareCode Text Compare

Keep Text Compare behavior coherent across input, calculation, presentation, merge state, and saved history.

## Required Context

Read `docs/architecture/text-compare.md` before changing Text Compare code. Read `docs/PERSISTENCE_MIGRATIONS.md` as well when the task changes saved history, snapshots, settings, storage keys, defaults, or serialized data.

## Workflow

1. Classify the task as input/editor, diff algorithm, split or unified rendering, merge/navigation, settings, or history restoration.
2. Inspect the public entry point, the canonical store or service for that area, its direct callers, and the nearest tests before editing.
3. Keep diff and merge rules in services or focused utilities. Keep durable feature state in `useTextStore`, transient workspace state in `useTextUIStore`, and persisted application settings in `useSettingsStore`.
4. Preserve parity between split and unified views and account for whitespace filtering, precision, virtualized measurement, selected blocks, and scroll targeting when affected.
5. Use public feature exports outside the module. Do not import Image Compare internals or create a parallel text state, diff pipeline, or history writer.
6. Use `$comparecode-ui-components` when shared primitives or the workspace shell change, `$comparecode-data-migration` for persisted contracts, and `$comparecode-browser-testing` for visible or interaction behavior that static tests cannot establish.

## Validation

Run the smallest focused Text tests that cover the changed owner, then complete the validation required by `AGENTS.md`. Exercise comparison, selection, merge direction, undo or redo, layout, keyboard, scrolling, and history only where the change can affect them.
