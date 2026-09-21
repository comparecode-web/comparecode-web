# Text Compare Architecture

## Scope and Public API

The Text Compare feature owns text input, diff calculation, split and unified rendering, block navigation, merge behavior, and text-history restoration. Its implementation lives under `features/compare/text`.

External modules must use the public entry point at `features/compare/text/index.ts`, which exports `TextView` and `useTextHistoryRestore`. Text code must not import Image Compare internals.

## Main Flow

1. `TextView` renders `EditorView`, the feature-level workspace composition.
2. `InputView` edits the original and modified text held by `useTextStore` and invokes `useTextCompareActions`.
3. `TextCompareService` delegates comparison to `ComparisonService`.
4. `ComparisonService` builds line-level blocks with the `diff` package, then applies whitespace normalization and character- or word-level fragment logic from `services/diff`.
5. `ComparisonView` selects split or unified presentation from application settings.
6. Split and unified row hooks derive render rows, while `useDiffVirtualizer` limits DOM work for large comparisons.

Keep comparison rules in services and diff utilities. Components may derive presentation state but must not become a second implementation of diff or merge behavior.

## State and Settings

- `store/useTextStore.ts` is the canonical owner of input text, comparison results, selected blocks, merge state, and the active text-history session.
- `store/useTextUIStore.ts` owns transient workspace state such as input expansion, compare progress, Options/Merge History visibility, and the session-only Show text test preference.
- `store/useSettingsStore.ts` owns persisted application settings used by Text Compare, including precision, whitespace handling, layout, font, wrapping, merge behavior, and diff colors.

Preserve the existing compatibility aliases exported by the feature stores unless a task explicitly includes their removal and all callers are updated.

## Merge and History

- `services/mergeService.ts` applies block-level left-to-right or right-to-left merges.
- `useTextStore` coordinates merge, undo, redo, navigation, and session state.
- `services/historyService.ts` is the application-level persistence boundary for comparison sessions and merge steps.
- `api/useTextHistoryRestore.ts` converts a history item back into current Text Compare state.

Changes to saved snapshots, IndexedDB records, history keys, or compatibility behavior must also use `$comparecode-data-migration` and follow `docs/PERSISTENCE_MIGRATIONS.md`.

## UI Boundaries

Use `ToolWorkspaceShell` for the feature workspace and reuse primitives from `components/ui`. Keep Text-only compositions inside the feature. Changes to shared primitives, responsive shell behavior, or theme tokens must also use `$comparecode-ui-components`.

Preserve keyboard behavior, selected-block semantics, virtualized measurement, scroll targeting, and split/unified parity when changing the comparison UI.

The compact toolbar fits precision, layout, word wrap, font size, and font family in priority order when Options is closed. `CompactTextOptions` measures actual control widths and hides overflow controls from view and keyboard navigation; all settings remain available in expanded Options. Opening Options places them inside Comparison and Layout, retaining the same canonical settings. `OptionsView` keeps the existing section resets; there is no global reset button. Button visibility contains Show text test, enabled by default. It controls the primary Test text action at the start of the toolbar without persisting a new preference, and the Button visibility reset restores it to enabled. Merge History opens from the icon beside Options in an animated, non-modal right sidebar. Input and comparison remain separate, stable children of the shell; changing navigation width or opening details does not remount them. The input occupies half the available content height when expanded alongside a result, with a 16rem input minimum and a 12rem result minimum. The surrounding workspace scrolls on short screens so controls remain reachable. A collapsed input stays mounted but is inert. Below 40rem viewport width or 32rem viewport height, enabled diff jump controls occupy a separate row outside the scrolling diff, so they cannot cover merge actions or each other. Larger viewports retain floating controls. Block navigation keeps its counter on one line and uses icon-only previous/next controls in narrow workspace containers.

`O`, `E`, and diff navigation respect `utils/workspaceKeyboard.ts`: tool controls, open menus, and modal navigation must not activate background workspace shortcuts. Existing editable-target and modifier exclusions still apply. See [Workspace UI](workspace-ui.md) for shell and navigation ownership.

## Validation Map

- Store, compare, merge, or history behavior: run `features/compare/text/store/__tests__/useTextStore.test.ts` and add focused service tests when the changed rule is not adequately covered.
- Diff information UI: run the affected component tests under `features/compare/text/components`.
- Virtualization, scrolling, keyboard interaction, responsive layout, or visible merge behavior: use `$comparecode-browser-testing` in addition to targeted tests.
- Complete the repository validation required by `AGENTS.md` for the type of change.
