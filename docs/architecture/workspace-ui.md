# Workspace UI Architecture

## Application Navigation

`app/(workspace)/layout.tsx` owns the persistent application frame. `WorkspaceSidebarProvider` stores only navigation presentation state in React memory, independently of feature stores. `NavigationSidebar` uses one route definition for Home, Text, Image, Markdown, History, and Settings. Destination selection retains `router.replace`; restoring a comparison from History retains `router.push`.

Desktop navigation is 4rem wide below 1280px and 15rem wide from 1280px until explicitly toggled. CSS supplies the initial responsive layout without reading browser state during server rendering. A manual choice survives route changes and mobile round trips; a reload restores the responsive default. Below 768px, the header opens a native modal `dialog` with labels. Native modal behavior contains focus and disables background interaction. Selection, cancellation, backdrop activation, browser history navigation, and returning to desktop close it; cleanup restores focus to the connected trigger.

There is no desktop header. `NavigationSidebar` places the brand beside the collapse control and GitHub plus `ThemeSelect` in its footer. The compact footer exposes the same theme selector through a palette icon; the trigger does not animate its text color, so its label disappears together with the other navigation labels at the container breakpoint; its popup opens upward when needed. The mobile dialog contains the brand and footer too. `MainNavHeader` is only the 44px mobile menu trigger strip. Sidebar and Settings selectors use the same `settings.theme`, `AVAILABLE_THEMES`, and `updateSettings`. No new storage key or navigation preference is persisted.

## Tool Layout and Popup Boundaries

`ToolWorkspaceShell` places feature options above stable workspace children. Text and Markdown start with details closed. Icon-labelled selection bars share a compact row with a primary Options button. Text keeps this row on one line, reserving space for Test text, Options, and History before fitting optional settings. The workspace inset is 0.5rem. The control row has a 3rem minimum height so moving the compact font-size slider into Options does not shift the disclosure buttons vertically. Opening Options moves the active controls into their settings sections without changing their values. Details remain mounted for a 200ms grid-row/opacity transition and are inert and hidden from the accessibility tree when closed; reduced motion disables the transition. The details scroller reserves a stable scrollbar gutter and clips overflow during the 200ms reveal, enabling scrolling only after the reveal to avoid transient scrollbars and horizontal reflow. Reduced motion also disables this reveal delay. The disclosure controls precede a scrollable area capped with the whole controls section at 40% of workspace height. Options closes on a second activation or Escape inside controls. Narrow initial/mobile layout closes details through the existing feature state callback.

Text uses its feature-owned `CompactTextOptions` to measure the available width and each control with `ResizeObserver`. It shows only the fitting prefix: precision, layout, word wrap, font size, then font family. Overflow controls are invisible and inert, never partially clipped or wrapped; every setting remains available in expanded Options. Compact and expanded controls reuse the same setting components and canonical setters. Button visibility contains the session-only Show text test switch, enabled by default; its section reset restores visibility as well as the existing saved button settings. The Test text action uses the primary button variant at the start of the toolbar. The global Text reset button is removed. Markdown moves Editor/Split/Preview between the compact row and Layout in the same way. Image retains its feature-owned compact toolbar: a segmented mode control in wide containers becomes a dropdown in narrow ones. The three history models remain independent.

Local history tabs declare right-side placement. An icon button beside Options toggles a right sidebar that animates between zero and 20rem width over 200ms, matching the navigation timing and respecting reduced motion. At desktop widths it takes space beside the workspace; below 768px it overlays the workspace and is capped at 90vw. It is non-modal, has its own scrolling area and close button, and leaves the editor usable. Escape and the close button return focus to the trigger. Closed content is inert and hidden from the accessibility tree while remaining mounted for the closing animation. The standalone application History route is unchanged.

`PopoverMenu` portals into the nearest dialog or `document.body`. It measures the trigger and available viewport space, repositions on resize/scroll, and can open above its trigger. This avoids clipping inside scrollable tool controls. Dropdown lists are capped at 14rem (224 CSS pixels at a 16px root) or the available viewport space, whichever is smaller, with internal scrolling. Popups close when their trigger becomes inert, including responsive overflow and collapsed details. Its capture-phase Escape handler consumes the event and returns trigger focus before an enclosing panel can also close. `utils/workspaceKeyboard.ts` prevents background shortcuts from consuming keys handled by tool controls, menus, or open native dialogs.

Container queries govern option grids, image controls, diff toolbar labels, and History cards. Navigation width animates over 200ms; existing diff `measureElement` and canvas `ResizeObserver` ownership handle the resulting size changes. Reduced-motion CSS disables the transition. Settings color-field columns depend on their actual container width, with shrinkable text inputs and fixed-size picker/reset controls. Date/time controls fill their columns below their labels.

## Settings and History

`OptionsSection` is the common section/reset composition. Reset actions are icon-only even in Settings; descriptive section headings do not change the reset presentation. Root `AGENTS.md` owns the sentence-case, shortcut-label, reset-button, and tooltip-free navigation policies. Each caller retains its own canonical reset key set. Settings adds a static `DiffColorPreview` using the same four diff CSS tokens as real comparisons. The existing `ThemeProvider` resolves themes and custom overrides. The preview does not compare text, mutate settings, or write history.

`components/history/historySorting.ts` is presentation-only:

- Default copies the incoming service order unchanged and exposes no direction control.
- Last activity uses the first valid timestamp from `lastActionAt`, `updatedAt`, then `createdAt`.
- Created uses `createdAt` alone.
- Explicit date modes keep bookmarks first, then apply ascending/descending dates within each bookmark group.
- Invalid/missing dates sort last in their group in either direction; ties preserve incoming order.
- Sorting never mutates records or the input array. Mode and direction live only in `HistoryView` component state.

Filtering precedes sorting. Text/Image totals describe all loaded items; the bookmarked count describes the current filter. Delete All continues to cover the entire database, including hidden records. History cards retain existing thumbnails and previews, restore on row activation, and provide an explicit keyboard-accessible Open comparison action. Bookmark/delete handlers preserve event isolation.

See [UI sizing and units](ui-sizing.md) for scalable sizes, CSS/JavaScript breakpoint alignment, and deliberate pixel-based geometry.

## Validation

Relevant tests live under `components/layout/__tests__`, `components/ui/__tests__`, `components/settings/__tests__`, and `components/history/__tests__`, alongside the existing feature tests. They cover route/action contracts, dialog dismissal, stable workspace children, shortcut isolation, popup dismissal/portals, shared settings and reset boundaries, immutable sorting, filtering, and record actions.

Build and DOM tests cannot establish real viewport geometry, native focus trapping across browsers, touch gestures, virtual keyboards, or visual quality. Use the isolated browser-testing workflow for material layout changes and test navigation resizing with wrapped diffs, image canvases, and Markdown selection. Inspect actual screenshots as well as overflow measurements; a passing build is not visual evidence.
