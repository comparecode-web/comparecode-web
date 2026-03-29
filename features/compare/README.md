# Compare Feature Structure

This directory contains compare-mode-specific modules.

- shared: contracts and mode-agnostic types.
- text: text compare UI/state/services/types/utils.
- image: image compare UI/state/services.

Architecture guideline:

- Keep text-only logic under `features/compare/text/**`.
- Keep image-only logic under `features/compare/image/**`.
- Keep only mode-agnostic contracts under `features/compare/shared/**`.

Encapsulation guideline:

- External layers (`app`, `components`, `services`, `store`, `types`, `hooks`) must not import Text/Image internals.
- Use public module entry points:
	- `@/features/compare`
	- `@/features/compare/text`
	- `@/features/compare/image`
- Shared cross-module contracts stay under `@/features/compare/shared/**`.
