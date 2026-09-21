# UI Sizing and Units

## Basis and Scope

This is the project's sizing policy, derived from the official references below. CSS specifications define how units behave; they do not require every length to use `rem`. WCAG evaluates resizing and access to content and controls, not a blanket prohibition of pixels.

Keep the root font size at the browser default. Do not force `html` to 16px or 62.5% to simplify arithmetic. A 16px root is a baseline for preserving the current appearance, not a guaranteed user preference. Previously saved editor font sizes remain explicit CSS-pixel settings.

## Decision Table

| Use | Preferred unit | CompareCode examples |
| --- | --- | --- |
| UI text, spacing, control dimensions, rounded corners, scalable panel limits | Existing Tailwind tokens backed by `rem`; explicit `rem` when the scale has no equivalent | `p-2`, `w-60`, `min-h-30`, small history labels, 14rem dropdown cap |
| An icon or decoration that should follow its local text size | `em` or the existing icon primitive | React Icons' intrinsic `1em` size |
| Space shared between panes or constrained by a parent | Flex/Grid, `fr`, `%`, `auto`, intrinsic sizing | Editor split ratios, compact options fitting |
| Mobile viewport containment | `dvh`, viewport units combined with scalable limits | Navigation height, `min(90vw, 20rem)` history width |
| Text-column geometry | `ch`, with suitable scalable gutters | Line numbers and unwrapped diff width |
| Thin borders, fine outlines, deliberately fine visual effects | CSS `px` | 1px borders, alignment overlay outlines, subtle blur |
| Browser geometry and drawing calculations | CSS-pixel numbers from the relevant API | DOMRect, scroll positions, virtualized row offsets, pointer coordinates |
| Image resolution and canvas backing buffers | Image/device pixel counts appropriate to the algorithm | Source dimensions, pixel diff, devicePixelRatio handling |
| User-selected editor font size | Existing persisted CSS-pixel value | Text/Markdown size sliders and their existing rendering contract |

Use unitless line height for ordinary text and unitless zero where accepted. Keep an existing fixed line-height/measurement contract when editor virtualization depends on it. CSS pixels are reference pixels, not necessarily physical display pixels.

## Layout and Breakpoints

Prefer existing spacing and typography tokens instead of spelling their pixel equivalents. Do not replace a fluid layout with fixed rem widths. Text-containing controls need wrapping, intrinsic sizing, or scrolling where appropriate; rem alone does not prevent clipping.

Tailwind's default screen breakpoints use rem. `config/responsive.ts` is the shared JavaScript owner for the matching queries: below 40rem, desktop navigation from 48rem, and expanded navigation from 80rem. Keep those queries, Tailwind configuration, and the corresponding global CSS rules aligned when changing breakpoints. Use the same unit when adding Tailwind breakpoints to preserve ordering.

Font-relative units in media queries resolve against the browser's initial font size, including user preferences, rather than an author-styled root size. Do not multiply media-query thresholds by `getComputedStyle(html).fontSize`. A test that changes the root style exercises rem layout scaling, but does not simulate changing the browser's default-font preference for media queries.

## DOM Geometry Boundaries

Keep `getBoundingClientRect`, scroll, pointer, and virtualization values in their native coordinate system. Convert a rem design constraint to CSS pixels only when combining it with measured geometry, using `utils/domSizing.ts`; never divide measured coordinates by 16. Popup positioning uses this boundary for its 0.5rem edge margin, 0.25rem trigger gap, and 14rem dropdown limit. It recalculates on trigger resize, viewport resize, and scroll. The dropdown limit also respects the available viewport space.

Tooltips use scalable CSS bounds and convert their spacing at the same geometry boundary. Canvas coordinates, image dimensions, device-pixel ratios, and saved font settings must not be reinterpreted as rem values. The mobile form-control rule retains a 16px minimum while allowing the root-relative size to grow with `max(1rem, 16px)`.

## Validation

- Preserve the baseline appearance at the usual root size and verify a larger root font size, such as 20px and 32px.
- Check compact-control overflow, dropdown scrolling and placement, section resets, navigation, and short/narrow viewports. Validate with screenshots and actual interactions, not just computed values.
- Check CSS/JavaScript breakpoint agreement at boundaries. Test browser default-font preferences separately when the test environment supports them.
- Check text enlargement through 200% and reflow at a 320 CSS-pixel viewport without losing controls. A 320px viewport is a reflow check, not proof of full browser-zoom or WCAG conformance. Two-dimensional comparison content may need its own scrolling while surrounding controls remain usable.
- Retain targeted tests for geometry conversions and breakpoint-dependent behavior, then run the applicable repository validation.

## Official References

Reviewed on 2026-09-21:

- [W3C CSS Values and Units, font-relative and absolute lengths](https://www.w3.org/TR/css-values-4/#lengths): rem/em semantics, reference pixels, and viewport units. Level 4 is a working draft; the unit behavior used here is already established.
- [W3C Media Queries, units](https://www.w3.org/TR/mediaqueries-4/#units): media-query relative units use initial values.
- [Tailwind CSS responsive design](https://tailwindcss.com/docs/responsive-design): rem breakpoints and consistent breakpoint units.
- [Tailwind CSS width](https://tailwindcss.com/docs/width): spacing, container, and flexible sizing utilities.
- [MDN getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect): viewport-relative DOM geometry.
- [W3C WAI, Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): enlargement through 200% without losing content or functionality.
- [W3C WAI, Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): narrow viewport behavior and two-dimensional content exceptions.
