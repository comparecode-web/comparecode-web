---
name: comparecode-image-compare
description: Implement or review CompareCode image upload, comparison modes, canvas rendering, visual diff algorithms, alignment, metadata, or image-history restoration.
---

# CompareCode Image Compare

Keep Image Compare behavior coherent across file input, state, canvas rendering, alignment, metadata, resource cleanup, and saved history.

## Required Context

Read `docs/architecture/image-compare.md` before changing Image Compare code. Read `docs/PERSISTENCE_MIGRATIONS.md` as well when the task changes saved snapshots, image metadata compatibility, storage, or history restoration.

## Workflow

1. Classify the task as upload or clipboard input, store state, comparison controls, canvas interaction, diff processing, alignment, metadata, or history restoration.
2. Inspect the public entry point, the canonical store or service for that area, its direct callers, and the nearest tests before editing.
3. Keep pixel, canvas, transform, and alignment rules in image services or focused utilities. Keep current image, comparison, and alignment state in `useImageCompareStore`.
4. Preserve coordinate systems, differing image dimensions, object-URL lifetime, load and failure behavior, and the relationship between previewed, applied, rendered, and persisted transforms.
5. Use public feature exports outside the module. Do not import Text Compare internals or create parallel image state, transform calculations, diff implementations, or history writers.
6. Use `$comparecode-ui-components` when shared primitives change, `$comparecode-data-migration` for persisted contracts, and `$comparecode-browser-testing` for upload, clipboard, canvas, pointer, responsive, or restore behavior.

## Validation

Run the smallest focused Image tests that cover the changed owner, then complete the validation required by `AGENTS.md`. Use task-owned image fixtures and isolated browser storage. Exercise every affected comparison mode and alignment path, including meaningful failure behavior.
