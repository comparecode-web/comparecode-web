---
name: comparecode-ui-components
description: Implement or review CompareCode shared React UI components, theme-aware styling, responsive layouts, variants, and reusable interaction patterns.
---

# CompareCode UI Components

Keep shared UI behavior reusable, semantic, responsive, and aligned with the existing component and theme system.

Read `docs/architecture/ui-components.md` for ownership, defaults, supported variants, exceptions and the development preview before changing shared control contracts. Read `docs/architecture/ui-sizing.md` when dimensions or geometry change.

## Component Routing

Use this map as a starting point, then inspect current source and production usage before choosing or changing a component:

- Actions: use `Button` for labelled actions, `IconButton` for icon-only actions, and `ResetButton` for icon-only resets. Extend `components/ui/controlStyles.ts` for recurring geometry or button styles instead of duplicating them in callers.
- Form controls: compose `Input` or `Textarea` with `FormField`; keep parsing, validation and persistence with the feature. Specialized document editors retain their own owner.
- Boolean and ranged input: start with `Checkbox`, `Switch`, `Slider`, and `ColorInput` according to the interaction contract.
- Choice controls: start with `SelectionBar` for visible compact alternatives and `SelectDropdown` for a collapsed list of options.
- Popup content: use `Popover` for arbitrary anchored content, `PopoverMenu` and `MenuItem` for action menus, and `Dialog` with `DialogHeader` for modal content. Preserve feature-specific focus restoration after actions.
- Layout: reuse `PageHeader`, `PageContent`, `WorkspaceToolbar` and `OptionsSection` according to their roles. Choose section density explicitly rather than deriving it from the presence of a description.
- Feature-specific compositions stay with their owning feature unless multiple independent features genuinely share the same semantic and interaction contract.

The implementation under `components/ui` and its current consumers are authoritative. This routing is not a substitute for searching them.

## Workflow

1. Inspect the requested UI, the relevant shared primitive, every directly affected consumer, theme tokens, and existing component tests.
2. Search `components/ui` and production sources for an existing component or composition with the same semantic purpose and interaction behavior.
3. Reuse or narrowly extend the canonical component when it can express the requirement. Create a new shared primitive only for a genuine cross-feature contract that composition cannot meet.
4. Keep feature-specific state and product rules out of shared primitives. Prefer typed, semantic variants over raw style-string or color props, and avoid a generic component API that merely exposes internal styling decisions.
5. Preserve existing defaults, focus behavior, keyboard handling, disabled states, popup dismissal, and active/selected semantics unless the task explicitly changes that contract.
6. Use established Tailwind semantic classes and CSS theme variables. When theme behavior changes, inspect `styles/themes`, `config/themes.ts`, `components/layout/ThemeProvider.tsx`, settings defaults, and every affected override together.
7. Build layouts from container constraints and meaningful breakpoints. Do not assume a fixed screen or browser size. Reserve fixed dimensions for intrinsic controls, documented minimum or maximum constraints, and interaction targets.
8. Avoid feature-local near-duplicates and one-off visual variants. If an existing primitive cannot meet a concrete requirement, record that unmet behavior in the change or pull-request rationale.
9. Preserve meaningful accessibility behavior, including native semantics, keyboard navigation, focus visibility, roles, and state announcements. Follow the root `AGENTS.md` policy for `aria-label`-only work.

## Validation

- Add or update focused component tests for meaningful state, keyboard, popup, or interaction behavior.
- Check representative existing consumers after changing a shared primitive or variant.
- Exercise `/dev/ui` alongside production consumers when adding or changing reusable states. Keep the preview composed from real components and unavailable in production.
- Use `$comparecode-browser-testing` for visual, responsive, focus, or interaction validation when static tests are insufficient.
- Complete the code validation required by the root `AGENTS.md` and report any untested responsive or browser-specific behavior.
