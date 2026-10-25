# Changelog

User-visible changes to CompareCode. Each release is dated when it reaches `main`, in UTC. Changes released before this changelog started are in the Git history and pull requests.

Add entries under "Unreleased" in the same commit as the change. Use the categories Added, Changed, Fixed, Removed, and Security in this order, and start each entry with its area, for example `- **Image compare:** Zoom in every comparison mode.` `npm run changelog:check` validates the structure, and the [changelog guide](docs/changelog.md) has the full rules.

## Unreleased

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
