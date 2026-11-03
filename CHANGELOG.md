# Changelog

User-visible changes to CompareCode. Each release is dated when it reaches `main`, in UTC. Changes released before this changelog started are in the Git history and pull requests.

Add entries under "Unreleased" in the same commit as the change. Use the categories Added, Changed, Fixed, Removed, and Security in this order, and start each entry with its area, for example `- **Image compare:** Zoom in every comparison mode.` `npm run changelog:check` validates the structure, and the [changelog guide](docs/changelog.md) has the full rules.

## Unreleased

### Added

- **Markdown:** Download the rendered document as HTML or a PNG image, print it or save it as PDF, and copy it as Markdown or formatted text, even from the editor-only view.
- **Markdown:** Mermaid diagrams can be expanded in a zoomable viewer, copied as an image, and downloaded as PNG or SVG.
- **Markdown:** Full screen mode hides the navigation and keeps the current Editor, Split, or Preview layout.
- **Markdown:** Outline panel lists the document headings, jumps to them in the preview and the editor, and copies a table of contents.
- **Markdown:** Headings get anchors, so links such as `[Intro](#intro)` jump to the matching section.
- **Markdown:** Ctrl+B, Ctrl+I, Ctrl+K, and Ctrl+E (Cmd on macOS) format the selection as bold, italic, link, or inline code.
- **Markdown:** Pressing Enter continues bullet, numbered, task, and quote lists, and Tab or Shift+Tab indents and outdents lines. Press Esc, then Tab to leave the editor.
- **Markdown:** Code blocks show their language and a Copy button, and highlight 21 languages.
- **Markdown:** The toolbar can insert inline or block math, terminal blocks, collapsible sections, footnotes, and Mermaid diagram templates.
- **Markdown:** Tables can be inserted by picking a size on an 8 by 8 grid.
- **Markdown:** The preview shows an estimated reading time.

### Changed

- **Markdown:** Heading levels, text case, and alignment are grouped into compact toolbar menus, with all six heading levels and a Paragraph option.
- **Markdown:** Inline code is highlighted in a rose red color that stays readable in every theme.
- **Markdown:** Mermaid diagram boxes, arrow labels, notes, and groups use distinct theme colors, with notes in a highlighter yellow where the theme allows it.
- **Markdown:** Undo reverts formatting, indentation, and automatic list items separately from the text typed just before them.

### Fixed

- **Markdown:** Footnote links and back links now jump to their targets instead of opening a new tab.
- **Markdown:** Reference links keep working anywhere in the document.
- **Markdown:** Sentences that contain a "|" character render as normal paragraphs instead of raw text.
- **Markdown:** A Mermaid diagram edited while it was rendering no longer keeps showing the previous version.
- **Markdown:** Code blocks keep the full language name, such as `c++`.
- **Markdown:** Formatting from the toolbar, keyboard shortcuts, or paste no longer makes the editor or the preview jump to another position.

## 2026-10-31

### Added

- **Text compare:** Hide unchanged lines with adjustable context, and reveal them step by step or all at once.
- **Text compare:** Case sensitive option that can be turned off to treat uppercase and lowercase letters as equal.
- **Text compare:** Ignore rules that skip text such as timestamps or build numbers on both sides.
- **Text compare:** Transform menu in the input editor to lowercase text, sort lines, replace line breaks with spaces, or trim whitespace on one or both sides.
- **Text compare:** JSON formatting in the Transform menu with 2-space, 4-space, or tab indentation, plus minify and sort keys, keeping numbers and key order exactly.
- **Text compare:** Live input editor option that recalculates the comparison while you edit the input after the first comparison. When it is off, an out-of-date comparison can be updated with one click.

### Changed

- **Text compare:** Test text includes examples for hidden unchanged lines and case sensitivity.
- **Themes:** The Support the project link uses a brighter rose red in every theme.

### Fixed

- **Text compare:** Undo and redo no longer discard text typed after a comparison or merge, and Merge history shows these manual edits.

## 2026-10-25

### Added

- **Themes:** Bubblegum, Forest, Sand, and Space themes.
- **Image compare:** Zoom and pan in every comparison mode with the mouse wheel, pinch, keyboard, Fit and 100% buttons, and double-click.
- **Image compare:** Space + drag pans the Slider view without moving the divider.
- **Image compare:** The Slider divider can be moved with the keyboard.

### Changed

- **Themes:** Themes share one consistent color system with readable contrast in every theme.
- **Themes:** The theme picker groups light and dark themes.
- **Image compare:** The zoom level and position stay the same when switching comparison modes.
- **Image compare:** One control bar holds the zoom, fade, and diff statistics controls in every mode.
- **Image compare:** The Slider divider is slimmer and has no shadow.
- **Image compare:** The Fade slider labels its original and modified ends.
- **Image compare:** Images stay sharp on high-density displays.

### Fixed

- **Image compare:** Files that are not images, cannot be opened, or are too large for the browser now show a message instead of being ignored.
- **Image compare:** Very large comparisons are shown at reduced resolution instead of an empty view.
- **Text compare:** Rapid merges, such as holding an arrow key, are saved to history in order, so undo restores every step.
- **Text compare:** A merge made right after comparing is saved with that comparison in history.
- **History:** A change that cannot be saved to history now shows a message, including when browser storage is full.
- **Markdown:** An invalid Mermaid diagram no longer adds an error graphic below the app, and the diagram renders again once it is fixed.
- **Text compare:** Highlighted rows no longer show thin lines between them when the browser is zoomed.
- **Image compare:** Slider labels and divider arrows now appear for aligned images too.
- **Image compare:** Moving the Fade slider no longer reloads the images.

### Removed

- **Themes:** The Monokai theme. A saved Monokai choice switches to Dark.
