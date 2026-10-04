# Shared UI components

## Ownership and defaults

`components/ui` owns reusable controls and interactions. Feature modules own product rules, parsing, state, and feature-specific compositions. Keep the existing PascalCase names; a second `Cc*` component family or compatibility wrappers would create competing owners.

| Need | Owner | Default and extension points |
| --- | --- | --- |
| Labelled action | `Button` | `primary`, `md`, `type="button"`; native button props, left/right icons |
| Icon-only action | `IconButton` | `ghost`, `md`, square; shared button variants, circle shape, explicit active state |
| Restore defaults | `ResetButton` | Icon-only, `sm`; dirty styling and caller-owned reset handler/scope |
| Text, URL, password, number input | `Input` | `md`; native input props, ref, shared field appearance |
| Multiline form input | `Textarea` | `md`, five rows, vertically resizable; native textarea props |
| Field label and message | `FormField` | Label plus optional description/error; render function supplies control ID and message association |
| Collapsed choice | `SelectDropdown` | `md`; typed string values, disabled state, shared popover positioning |
| Visible choices | `SelectionBar` | `sm`, inline, single selection; multiple selection and stacked content when needed |
| Boolean, range, color | `Checkbox`, `Switch`, `Slider`, `ColorInput` | Preserve their native interaction and feature-owned values; `ColorInput` composes `Input` and `FormField` |
| Anchored arbitrary content | `Popover` | Portal positioning, outside-click dismissal, Escape, inert-trigger handling; no menu role by default |
| Action menu | `PopoverMenu`, `MenuItem` | `Popover` composition with menu semantics, initial focus and enabled-item arrow/Home/End navigation |
| Modal content | `Dialog`, `DialogHeader` | Controlled native modal; focus containment/return, Escape cancellation, scrollable viewport bounds |
| Tool action row | `WorkspaceToolbar` | Inline surface; `card` for a standalone bordered toolbar |
| Settings group | `components/settings/OptionsSection.tsx` | Explicit `compact` density; `comfortable` for page sections. Description does not select the density |
| Page heading and gutters | `components/layout/PageHeader.tsx`, `PageContent.tsx` | Shared QR, History and Settings layout; optional heading actions |

`controlStyles.ts` is the canonical owner of the button variants, shared focus/disabled classes and the `sm`/`md`/`lg` control scale. At the usual 16px root, minimum control heights are 32/36/44 CSS pixels. Labelled controls may grow with content; icon buttons have square 2/2.25/2.75rem geometry. Icon slots inherit the corresponding default icon size. These are scalable rem-based sizes, not persisted pixel settings. Follow [UI sizing and units](ui-sizing.md).

## Composition and overrides

Start with the semantic component and its size/variant props. Keep `className` for container layout, responsive visibility and justified exceptions. Repeated height, padding, radius, focus or color overrides should move into the existing owner rather than become a feature-local style recipe. Do not add a variant solely to reproduce one incidental historical difference.

Use `Button` for text with optional icons and `IconButton` for icon-only actions. There is no `Button size="icon"` or duplicate `toolbar` button variant. `ghost` is the subdued action style. Icon-only controls retain their accessible name and applicable tooltip; navigation controls remain tooltip-free. `isActive` controls appearance; the caller supplies the appropriate pressed/expanded/selected semantics.

The reset handler and dirty calculation stay with the setting or feature. `OptionsSection` owns section-reset composition; `ResetButton` owns the icon control appearance. Compact sections use a 1.75rem reset control to preserve their header height; section spacing supplies the gap above controls without additional first-control margins. The per-color Restore text action is a `Button`, separate from section resets.

Use `FormField` to associate a visible label and optional message without nesting unrelated controls inside one label:

```tsx
<FormField label="Website URL" error={error}>
  {field => <Input {...field} type="url" value={url} onChange={event => setUrl(event.target.value)} />}
</FormField>
```

Parsing, clamping, validation rules and persistence remain with the feature. An image-alignment number field can compose `Input` with a suffix while retaining its draft/commit/cancel behavior. Text and Markdown document editors remain specialized editors, not generic form textareas.

`Popover` owns geometry and dismissal, while `SelectDropdown` owns choice behavior and `PopoverMenu` owns action-menu navigation. Forms inside popovers must not acquire a menu role. Popovers mark their content as tool controls so workspace shortcuts do not act underneath them. Popups and global tooltips portal into the nearest dialog when necessary to remain in its top layer. Formatting actions retain their feature-owned editor focus/selection restoration.

Use controlled `Dialog` for modals. The owner chooses whether cancellation is permitted during pending work and what closing means. Native close events must not undo a reopened dialog during React strict effects. A field consuming Escape must prevent its default before the dialog handles cancellation. The navigation drawer keeps its existing native-dialog lifecycle because it also coordinates breakpoints, route changes and history navigation.

Do not merge `PageHeader`, `WorkspaceToolbar`, `ToolWorkspaceShell` and mobile navigation into a universal header: their roles differ. Keep canvas handles, resize separators, navigation destinations, selectable history rows and diff annotations feature-specific where their geometry or semantics require it. Reuse primitives inside those compositions where appropriate.

## Development preview and validation

`/dev/ui` renders `components/dev/UiComponentsPreview.tsx` using the real controls. It demonstrates sizes, variants, disabled/active/error states, fields, resets, toolbars, popovers and dialogs. Its theme control uses the existing theme selector; no separate theme state or storage schema exists. The route returns not found outside development and is absent from product navigation and the sitemap.

When changing shared defaults, inspect representative Text, Image, Markdown, QR, History and Settings consumers, plus the navigation shell. Validate keyboard activation, form submission, disabled controls, menu selection, Escape, modal focus, tooltip/popup layering, and feature-specific reset scopes. Keep behavior tests under `components/ui/__tests__` and feature integration tests with their owners.

Use an isolated browser to inspect light/dark themes, narrow layouts, larger root fonts, and popup/dialog placement. Compare before/after screenshots with the same viewport, data and theme when assessing visual drift. Run the applicable repository lint, test and build checks; DOM tests alone do not establish native modal focus or responsive geometry.
