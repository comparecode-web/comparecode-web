# Compare Feature Structure

This directory contains compare-mode-specific modules.

- shared: contracts and mode-agnostic types.
- text: text compare UI/state/services/types/utils.
- image: image compare UI/state/services.

Architecture guideline:

- Keep text-only logic under `features/compare/text/**`.
- Keep image-only logic under `features/compare/image/**`.
- Keep only mode-agnostic contracts under `features/compare/shared/**`.
