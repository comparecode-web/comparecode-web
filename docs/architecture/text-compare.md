# Text Compare Architecture

## Scope and Public API

The Text Compare feature owns text input, diff calculation, split and unified rendering, block navigation, merge behavior, and text-history restoration. Its implementation lives under `features/compare/text`.

External modules must use the public entry point at `features/compare/text/index.ts`, which exports `TextView` and `useTextHistoryRestore`. Text code must not import Image Compare internals.

## Main Flow


1. `TextView` renders `EditorView`, the feature-level workspace composition.
2. `InputView` edits the original and modified text held by `useTextStore` and invokes `useTextCompareActions`.
3. `TextCompareService` delegates comparison to `ComparisonService`.
4. `ComparisonService` splits the original text into lines with UTF-16 offsets and exact line terminators. Weighted unique-line anchors favor contiguous runs over scattered matches; each gap uses a bounded Myers edit script. The service then creates active or neutral blocks. Ignore whitespace removes horizontal whitespace for line matching, including a space between words, but keeps line boundaries; isolated whitespace-only insertions and removals become neutral rows. Blank lines inside a substantive changed run remain part of that run and its line count, while their text remains unhighlighted. This matches the observed Diffchecker Hide whitespace changes behavior for `foo bar` versus `foobar`, while `foo\nbar` versus `foobar` remains a change. Modified hunks receive bounded similarity-based line pairing; unmatched runs are compacted into opposing display rows. Word precision groups whitespace and non-whitespace runs to preserve the published text comparison's highlighting, while character precision uses `Intl.Segmenter` graphemes with a local fallback. Under ignore whitespace, token edits are projected back to the original text and only the content is highlighted. Changed line endings are labelled in both views. The result carries a `limited` flag when a budget triggers a correct coarse replacement.
   When Character precision has unequal line counts, the service searches bounded stable grapheme spans across the entire changed hunk. Short matching letter or number runs surrounded by edits are treated as part of the replacement; this prevents incidental shared characters from splitting a word change into misleading fragments. Ignore whitespace projects the resulting fragments onto exact source lines. Whitespace-only neutral gaps between adjacent substantive changes join the active block when one flank is one-sided, so block navigation and minimap use the same four-block result on the published lorem fixture.
5. `ComparisonView` selects split or unified presentation from application settings.
6. Split and unified row hooks derive render rows, while `useDiffVirtualizer` limits DOM work for large comparisons.

Keep comparison rules in services and diff utilities. Components may derive presentation state but must not become a second implementation of diff or merge behavior.

The active `ComparisonResult` is the only source for selectable blocks, counts, minimap segments, and merge targets. A settings change recomputes it and clears the previous selection. No ignored change flag or block is retained for later UI filtering. Move detection links only distinctive removed and added sections; it never changes their edit semantics or line counts. Exact moves are checked first; edited moves require multiple shared unique substantive lines, bounded token similarity, and a unique target. An uncertain candidate remains a regular diff. Each pair receives one number. In split view, the source annotation and outline belong to the original pane, while the destination annotation and outline belong to the modified pane. Activating either annotation focuses the moved text and scrolls to its counterpart without selecting a merge block. Clicking anywhere in a changed split row, including the empty opposing pane, selects the merge block; its side borders do not alter row height. Hovering tints the entire unselected block without tinting its moved counterpart. Selected blocks do not receive a hover tint, and move outlines remain one pixel wide when selected. Unified view focuses the paired moved blocks without a connector. Active block tint covers blank source lines under ignore whitespace, while their text remains unhighlighted. Moved sections use a block tint without per-token highlighting, because the whole section is relocated. Diff blocks are derived state and are never persisted.

In Word mode, modified blocks count each aligned display row as one removal and one addition, including its imaginary opposing line. In cross-line Character mode, counts reflect real source lines on each side. Whole added and removed blocks use block-level tint without per-token highlighting. Split presentation places real lines before imaginary lines on each side of a modified block; it changes only display order, while the source offsets and merge semantics remain intact. The published lorem input is frozen in a service fixture as a regression baseline. The bundled Test text preserves both original inputs verbatim and adds only an independent lorem section at different positions to demonstrate an exact move.

## State and Settings

- `store/useTextStore.ts` is the canonical owner of input text, comparison results, selected blocks, merge state, and the active text-history session.
- `store/useTextUIStore.ts` owns transient workspace state such as input expansion, compare progress, Options/Merge History visibility, and the session-only Show text test preference.
- `store/useSettingsStore.ts` owns persisted application settings used by Text Compare, including precision, whitespace handling, layout, font, wrapping, merge behavior, and diff colors.

Preserve the existing compatibility aliases exported by the feature stores unless a task explicitly includes their removal and all callers are updated.

## Merge and History

- `services/mergeService.ts` applies block-level left-to-right or right-to-left merges by copying original source slices into target UTF-16 offsets. This preserves CRLF, lone CR, LF, and terminal newline state.
- `useTextStore` coordinates merge, undo, redo, navigation, and session state.
- `services/historyService.ts` is the application-level persistence boundary for comparison sessions and merge steps.
- `api/useTextHistoryRestore.ts` converts a history item back into current Text Compare state.

Changes to saved snapshots, IndexedDB records, history keys, or compatibility behavior must also use `$comparecode-data-migration` and follow `docs/PERSISTENCE_MIGRATIONS.md`.

## UI Boundaries

Options and compact controls are inactive while both inputs are empty; Test text, input editing, and Merge History remain available. The sidebar brand is a Home link separate from the icon-only collapse control, and idle navigation icons inherit the subdued footer icon color.


Use `ToolWorkspaceShell` for the feature workspace and reuse primitives from `components/ui`. Keep Text-only compositions inside the feature. Changes to shared primitives, responsive shell behavior, or theme tokens must also use `$comparecode-ui-components`.

Preserve keyboard behavior, selected-block semantics, virtualized measurement, scroll targeting, and split/unified parity when changing the comparison UI.

The compact toolbar fits ignore whitespace, precision, layout, word wrap, font size, and font family in priority order when Options is closed. `CompactTextOptions` measures actual control widths and hides overflow controls from view and keyboard navigation; all settings remain available in expanded Options. Opening Options places them inside Comparison and Layout, retaining the same canonical settings. `OptionsView` keeps the existing section resets; there is no global reset button. Button visibility contains Show text test, enabled by default. It controls the primary Test text action at the start of the toolbar without persisting a new preference, and the Button visibility reset restores it to enabled. Merge History opens from the icon beside Options in an animated, non-modal right sidebar. Input and comparison remain separate, stable children of the shell; changing navigation width or opening details does not remount them. The input occupies half the available content height when expanded alongside a result, with a 16rem input minimum and a 12rem result minimum. The surrounding workspace scrolls on short screens so controls remain reachable. A collapsed input stays mounted but is inert. Below 40rem viewport width or 32rem viewport height, enabled diff jump controls occupy a separate row outside the scrolling diff, so they cannot cover merge actions or each other. Larger viewports retain floating controls. Block navigation keeps its counter on one line and uses icon-only previous/next controls in narrow workspace containers.

`O`, `E`, and diff navigation respect `utils/workspaceKeyboard.ts`: tool controls, open menus, and modal navigation must not activate background workspace shortcuts. Existing editable-target and modifier exclusions still apply. See [Workspace UI](workspace-ui.md) for shell and navigation ownership.

## Validation Map

- Store, compare, merge, or history behavior: run `features/compare/text/store/__tests__/useTextStore.test.ts` and add focused service tests when the changed rule is not adequately covered.
- Diff information UI: run the affected component tests under `features/compare/text/components`.
- Virtualization, scrolling, keyboard interaction, responsive layout, or visible merge behavior: use `$comparecode-browser-testing` in addition to targeted tests.
- Complete the repository validation required by `AGENTS.md` for the type of change.
