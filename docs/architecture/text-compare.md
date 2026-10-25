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
6. Split and unified row hooks derive render rows, while `useDiffVirtualizer` limits DOM work for large comparisons. Rows carry content, line numbers, borders, and interaction. Line tints, the selected block background, and the hover tint are painted by `DiffSurfaceLayer` as one element per contiguous run of rendered rows, built by `utils/diffSurfaces.ts`. Per-row backgrounds would leave hairline gaps between rows at fractional device pixel ratios, such as browser zoom levels like 110%. `components/diff/rowLayout.ts` owns the shared row, gutter, and cell geometry, so rows and surfaces stay aligned.

Keep comparison rules in services and diff utilities. Components may derive presentation state but must not become a second implementation of diff or merge behavior.

The active `ComparisonResult` is the only source for selectable blocks, counts, minimap segments, and merge targets. A settings change recomputes it and clears the previous selection. No ignored change flag or block is retained for later UI filtering. Move detection links only distinctive removed and added sections; it never changes their edit semantics or line counts. Exact moves are checked first; edited moves require multiple shared unique substantive lines, bounded token similarity, and a unique target. An uncertain candidate remains a regular diff. Each pair receives one number. In split view, the source annotation and outline belong to the original pane, while the destination annotation and outline belong to the modified pane. Activating either annotation focuses the moved text and scrolls to its counterpart without selecting a merge block. Clicking anywhere in a changed split row, including the empty opposing pane, selects the merge block; its side borders do not alter row height. Hovering tints the entire unselected block without tinting its moved counterpart. Selected blocks do not receive a hover tint, and move outlines remain one pixel wide when selected. Unified view focuses the paired moved blocks without a connector. Active block tint covers blank source lines under ignore whitespace, while their text remains unhighlighted. Moved sections use a block tint without per-token highlighting, because the whole section is relocated. Diff blocks are derived state and are never persisted.

In Word mode, modified blocks count each aligned display row as one removal and one addition, including its imaginary opposing line. In cross-line Character mode, counts reflect real source lines on each side. Whole added and removed blocks use block-level tint without per-token highlighting. Split presentation places real lines before imaginary lines on each side of a modified block; it changes only display order, while the source offsets and merge semantics remain intact. The published lorem input is frozen in a service fixture as a regression baseline. The bundled Test text preserves both original inputs verbatim and adds only an independent lorem section at different positions to demonstrate an exact move.

## State and Settings

Local text file import is owned by `services/textFileImport.ts`. It accepts known text/code/data extensions or `text/*` MIME, verifies the 5 MiB limit and UTF-8 bytes, rejects binary control characters, removes a UTF-8 BOM, and preserves line endings. The two input panels and comparison area use the shared `FileDropZone` visual behavior; dropping on the comparison area's left or right half imports into that side. Each side has an import icon beside its Copy action in the comparison toolbar; the file inputs remain outside the collapsible editor's inert subtree. Successful import uses the store's atomic `importText` action and expands the input editor. It never starts comparison: any previous result, selection, and merge session are cleared, and Check it! produces the next result. Import alone does not create a durable History entry. Invalid files leave both sources unchanged.

`services/textExport.ts` exports exact source strings as separate UTF-8 TXT files and creates a local, paginated side-by-side PDF from the active `ComparisonResult`. It uses the canonical split row ordering and browser Canvas text rendering for Unicode, fragment highlights, gray opposing empty areas, and moved-section borders and labels. `services/pdfDocument.ts` writes a small PDF wrapper around the rendered JPEG pages without a PDF dependency. PDF pages are visual images rather than selectable text; TXT preserves the exact source text. Tabs display as four spaces in the PDF. The export dialog is owned by `components/diff/ExportDialog.tsx`; PDF requires a current comparison, while each TXT action requires content on its own side. Downloads never send content to a server.

- `store/useTextStore.ts` is the canonical owner of input text, comparison results, selected blocks, merge state, and the active text-history session.
- `store/useTextUIStore.ts` owns transient workspace state such as input expansion, compare progress, Options/Merge History visibility, and the session-only Show text test preference.
- `store/useSettingsStore.ts` owns persisted application settings used by Text Compare, including precision, whitespace handling, layout, font, wrapping, merge behavior, and diff colors.

Preserve the existing compatibility aliases exported by the feature stores unless a task explicitly includes their removal and all callers are updated.

## Syntax Highlighting

Syntax highlighting is an optional presentation layer for split and unified results. `services/syntax/tokenizeSyntax.ts` owns the dependency-free scanner, budgets and line projection; `services/syntax/languages.ts` owns language labels and the JavaScript, TypeScript, JSON and Python word profiles. The persisted setting contract lists the supported language IDs in `types/settings.ts`. The selector matches the 21 language options in the [Diffchecker web Syntax menu](https://www.diffchecker.com/) inspected on 2026-10-11, with Plain text corresponding to None. Highlighting defaults to off and the selected language defaults to JavaScript. Appearance owns these settings and their section reset; compact options expose them as one overflow group after the existing font controls.

`services/syntax/engines.ts` registers every additional language explicitly. `codeProfiles.ts` supplies separate keyword, type, comment and case rules; `codeEngines.ts` applies their language-specific lexical states. `documentEngines.ts` owns dedicated CSS, HTML/XML, Markdown and YAML scanners. `scannerSupport.ts` shares only scanning mechanics, such as delimiters and Unicode advancement. Languages never fall back to a JavaScript keyword profile. These are local implementations; no syntax-highlighting dependency or third-party grammar is bundled.

| Language | Representative lexical rules |
| --- | --- |
| C | Preprocessor directives, primitive types, comments, prefixed strings and characters |
| C++ | C++ keywords and types, custom-delimited raw strings, numeric separators |
| C# | Escaped identifiers, verbatim strings, interpolated string delimiters, variable-length raw strings |
| Clojure | Symbols, namespaced keywords, reader discard, regex and character literals, ratios |
| CSS | Selectors, at-rules, declarations, custom properties, units, colors and quoted/unquoted URLs |
| Go | Go keywords and types, raw backtick strings, interpreted strings and runes |
| Java | Java keywords and types, strings, characters and multiline text blocks |
| JavaScript | Keywords, templates with nested expression states, regex literals and comments |
| JSON | Property names, strings, numeric values and JSON literals |
| Markdown | Headings, list/quote markers, emphasis, links, inline code, fences and HTML comments |
| Objective-C | Directives, `@` declarations and strings, Objective-C types and literals |
| PHP | Variables, attributes, case-insensitive keywords, heredoc and indented nowdoc |
| Python | Keywords, built-in types, prefixed strings and triple-quoted strings |
| HTML, XML | Tags, attributes, processing instructions, comments, entities, CDATA and raw text elements |
| Ruby | Symbols, variables, regex, percent strings, block comments and indented heredoc |
| Rust | Lifetimes versus characters, escaped identifiers, hashed raw strings, numeric suffixes and nested comments |
| Shell | Reserved words, built-ins, variables, parameter expansions, quoted/tab-stripped heredoc and shell comment boundaries |
| SQL | Case-insensitive keywords/types, quoted identifiers, doubled quotes, dollar quoting and nested comments |
| Swift | Swift keywords/types, hashed and multiline strings, range operators and nested comments |
| TypeScript | JavaScript rules plus TypeScript keywords and built-in types |
| YAML | Mapping keys, flow collections, anchors, aliases, tags, quoted/plain scalars and indentation-sensitive block scalars |

`TextCompareService` attaches the exact original and modified strings as `ComparisonResult.sourceTexts`. This transient snapshot follows the result through selection and never enters History storage. It keeps highlighting correct when input editing leaves an older comparison visible. `useSyntaxHighlighting` memoizes each source and language; selection, hover, theme, font and layout changes do not rerun the scanner. Syntax tokens use UTF-16 offsets within source lines, preserving tabs, Unicode and CRLF/CR/LF boundaries. Each side is scanned independently before virtualized rows consume their numbered source lines. Unified removed rows use the original source and added rows use the modified source; unchanged rows use the same original source as their displayed fragments.

`DiffFragmentList` keeps canonical diff fragments and backgrounds, projecting syntax ranges into nested React text spans through `SyntaxText`. It checks that syntax and displayed line text match before applying colors. Inline inserted/deleted fragments retain the primary diff text color for contrast; other text, including whole added/removed and moved sections, receives theme-specific syntax colors. Highlighting changes no source text, comparison rule, merge target, row geometry, or saved history. Input textareas and the PDF export retain their existing rendering.

The engines are tolerant lexical highlighters, not parsers, validators or full compiler grammars. Context-dependent JavaScript and Ruby regex classification is heuristic. JSX/TSX and embedded languages are not parsed. Interpolation inside Python, C#, Ruby, PHP, Shell and Swift strings remains part of the string token; JavaScript template expressions are scanned separately. Markdown fenced code and HTML script/style bodies are opaque source text. Heredoc scanning covers an individual literal delimiter, not shell evaluation or multiple queued redirections. Unsupported or incomplete constructs remain readable text.

Ruby heredoc recognition requires an adjacent delimiter and expression or command-argument context; observed local assignments distinguish compact append expressions from command calls. Ruby scope and command-call ambiguity remain lexical heuristics. Shell arithmetic parentheses and here-string operators prevent shifts or `<<<` from entering heredoc state. YAML plain scalars are scanned as complete values before literal classification, including indentation-based continuations and context-sensitive flow delimiters. These rules have focused fixtures in `SYNTAX_REGRESSION_SAMPLES` and are verified through both result layouts and precision modes.

Per-source limits are 500,000 UTF-16 code units, 20,000 lines, 20,000 code units per line and 60,000 scanned tokens. Repeated JavaScript regex and failed Markdown link lookahead have linear work budgets. Incomplete Swift raw-string hash prefixes are consumed as one run. Exceeding a budget disables highlighting for that entire side and shows a status message without changing the comparison. Tests cover lexical states, exact offsets, token/diff intersections, input snapshot lifecycle, caching, limits and settings compatibility.

`services/syntax/__fixtures__/languageSamples.ts` provides an original/modified sample and expected lexical tokens for every supported language. `languageEngines.test.ts` freezes the observed language inventory and exercises every sample, source line ending, size boundary and incomplete-input path. `components/diff/__tests__/SyntaxViews.test.tsx` verifies every sample in split/unified and Word/Character modes, including safe text rendering, diff backgrounds and disabling highlighting. Browser validation must run this same 21-language/four-mode matrix and visually inspect every language, plus the affected controls, themes and responsive layouts. The snapshot, merge/undo/redo, wrapping and virtualized-scroll contracts remain covered by focused tests and browser checks.

## Merge and History

- `services/mergeService.ts` applies block-level left-to-right or right-to-left merges by copying original source slices into target UTF-16 offsets. This preserves CRLF, lone CR, LF, and terminal newline state.
- `useTextStore` coordinates merge, undo, redo, navigation, and session state. History writes from merge, swap, undo, and redo run one at a time through `queueHistoryWrite`, so rapid merges, such as a held arrow key, keep their order and undo waits for pending merges. `trackHistorySession` registers the session saved by a comparison, so a merge made before that save finishes joins the comparison's session. A failed write is reported with an error toast through `store/reportHistoryWriteError.ts`, which also explains a full browser storage quota.
- `services/historyService.ts` is the application-level persistence boundary for comparison sessions and merge steps. Appending, undoing, and redoing a step read and update the session cursor inside one IndexedDB transaction, so step sequence numbers stay unique even when writes overlap.
- `api/useTextHistoryRestore.ts` converts a history item back into current Text Compare state.

Changes to saved snapshots, IndexedDB records, history keys, or compatibility behavior must also use `$comparecode-data-migration` and follow `docs/PERSISTENCE_MIGRATIONS.md`.

## UI Boundaries

Options and compact controls are inactive while both inputs are empty; Test text, input editing, and Merge History remain available. The sidebar brand is a Home link separate from the icon-only collapse control, and idle navigation icons inherit the subdued footer icon color.


Use `ToolWorkspaceShell` for the feature workspace and reuse primitives from `components/ui`. Keep Text-only compositions inside the feature. Changes to shared primitives, responsive shell behavior, or theme tokens must also use `$comparecode-ui-components`.

Labelled actions, import icons, merge controls and floating navigation use the shared button family. The export composition uses `Dialog` and `DialogHeader`; export generation stays in Text services. Document textareas, virtualized row geometry and diff annotations retain their specialized owners. See [Shared UI components](ui-components.md).

Preserve keyboard behavior, selected-block semantics, virtualized measurement, scroll targeting, and split/unified parity when changing the comparison UI.

The compact toolbar fits ignore whitespace, precision, layout, word wrap, font size, and font family in priority order when Options is closed. `CompactTextOptions` measures actual control widths and hides overflow controls from view and keyboard navigation; all settings remain available in expanded Options. Opening Options places them inside Comparison and Layout, retaining the same canonical settings. `OptionsView` keeps the existing section resets; there is no global reset button. Button visibility contains Show text test, enabled by default. It controls the primary Test text action at the start of the toolbar without persisting a new preference, and the Button visibility reset restores it to enabled. Merge History opens from the icon beside Options in an animated, non-modal right sidebar. Input and comparison remain separate, stable children of the shell; changing navigation width or opening details does not remount them. The input occupies half the available content height when expanded alongside a result, with a 16rem input minimum and a 12rem result minimum. The surrounding workspace scrolls on short screens so controls remain reachable. A collapsed input stays mounted but is inert. Below 40rem viewport width or 32rem viewport height, enabled diff jump controls occupy a separate row outside the scrolling diff, so they cannot cover merge actions or each other. Larger viewports retain floating controls. Block navigation keeps its counter on one line and uses icon-only previous/next controls in narrow workspace containers.

`O`, `E`, and diff navigation respect `utils/workspaceKeyboard.ts`: tool controls, open menus, and modal navigation must not activate background workspace shortcuts. Existing editable-target and modifier exclusions still apply. See [Workspace UI](workspace-ui.md) for shell and navigation ownership.

## Validation Map

- Store, compare, merge, or history behavior: run `features/compare/text/store/__tests__/useTextStore.test.ts` and add focused service tests when the changed rule is not adequately covered.
- Diff information UI: run the affected component tests under `features/compare/text/components`.
- Virtualization, scrolling, keyboard interaction, responsive layout, or visible merge behavior: use `$comparecode-browser-testing` in addition to targeted tests.
- Complete the repository validation required by `AGENTS.md` for the type of change.
