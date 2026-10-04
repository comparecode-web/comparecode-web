# Image Compare Architecture

## Scope and Public API

The Image Compare feature owns image input, metadata extraction, comparison modes, canvas rendering, visual diff algorithms, manual and automatic alignment, and image-history restoration. Its implementation lives under `features/compare/image`.

External modules must use the public entry point at `features/compare/image/index.ts`, which exports `ImageView` and `useImageHistoryRestore`. Image code must not import Text Compare internals.

## Main Flow

1. `ImageView` switches between image upload and the active comparison workspace.
2. `ImageUploadPanel` creates `ImageFileMeta` records for the original and modified inputs, including object URLs, dimensions, and EXIF metadata.
3. `useImageCompareStore` owns the selected images, comparison mode, diff algorithm, controls, metadata panel, and alignment state.
4. `ImageCompareToolbar` changes comparison and diff modes.
5. `ImageCompareCanvas` renders side-by-side, fade, slider, and diff presentations.
6. `ImageDiffService` produces visual diff output and statistics on canvas data.
7. `ImageSnapshotService` renders full-resolution comparison snapshots across fade, slider, diff, and side-by-side modes and manages lossless PNG export.

Keep canvas and pixel-processing rules in image services or focused image utilities. UI components may coordinate gestures and presentation but must not create independent diff or transform rules.

## Alignment

- `services/alignment/types.ts` owns alignment state, options, transforms, metadata, and defaults.
- `services/alignment/transformUtils.ts` owns affine transform calculations, normalization, bounds, and image-pair identity.
- `services/alignment/registrationEngine.ts` owns deterministic, dependency-free registration of bounded RGBA buffers.
- `services/alignment/autoAlignService.ts` decodes bounded work images and manages the cancellable `autoAlign.worker.ts` lifecycle.
- `useImageCompareStore.runAutoAlignment` is the single request owner for both entry points. Components must not estimate or apply automatic results independently.
- `AlignmentPrompt` and `ImageAlignmentPanel` own the user-facing alignment workflow.

Preserve coordinate-system assumptions across preview, applied transforms, canvas rendering, diff generation, and saved history. A transform change must be checked in every affected consumer rather than patched in one view only.

### Activation and lifecycle

- Offer alignment once for each loaded pair whose pixel width or height differs, including equal aspect ratios. Equal-size images never trigger the prompt; the alignment panel remains available for shifted or resized content within equal-size canvases.
- Skipping or resetting must not reopen the prompt for the current pair. Pair identity includes the object URLs so replacing a file with identical name/size/dimension metadata is still a new pair.
- Rotate and Scale start enabled. As observed in Diffchecker, disabling both disables Auto align. `isAutoAlignmentAvailable` owns this policy. Translation is fitted whenever an allowed alignment runs.
- Manual alignment starts centered at natural size. Image dimensions alone do not imply that content needs rescaling.
- The store rejects duplicate runs. Image replacement, clear, reset, panel close, manual transform changes, option changes, and history restoration cancel pending work. A late result cannot replace a newer pair or manual edit. Metadata-only updates to the same image do not invalidate the request.
- Success from the prompt closes it; success from the panel keeps the panel available for refinement. Applying a transform preserves Fade, Slider, or Advanced; Side by side switches to Slider so the alignment is visible. Skipping preserves the current comparison mode.
- Failure preserves any previously applied transform and opens a usable manual draft. The error scrolls into view and another attempt remains possible. The service terminates workers on completion, abort, error, or the 15-second deadline.
- The panel fits the union of the original and applied transformed bounds with room for handles. It does not continually refit the view while dragging a manual draft. This keeps enlarged and rotated automatic results visible without changing image coordinates.

### Registration pipeline

1. Decode each input into a work canvas with a maximum dimension of 640 pixels, keeping its natural source dimensions. Transfer the RGBA buffers to a bundled local worker; neither image uploads nor external runtime downloads are needed.
2. Composite luminance against white using alpha, and exclude transparent feature centers. Build up to six progressively blurred pyramid levels. Detect spatially separated Harris corners, assign gradient orientations, and form normalized spatial gradient histograms.
3. Match descriptors using a nearest/second-nearest distance ratio and deduplicate spatial matches. Estimate a similarity transform with deterministic consensus sampling and least-squares refinement, constrained by the allowed rotation/scale options during fitting.
4. Require at least six distinct inliers, at least 25% consensus, and support covering at least 1% of the original image's bounding area. Weak, flat, transparent, or unrelated inputs return no match rather than a dimension-based guess.
5. For strong geometric matches with low photometric error, refine position, rotation, and scale against bounded pixel samples. Truncated residuals limit the influence of edited regions. Exact raster placements are selected only when supported by the pixel objective; small real rotations/scales are not unconditionally rounded away.
6. Return the modified image's center in original-image pixels, uniform scale, and rotation. Work-canvas rounding is accounted for on each coordinate axis. Confidence is the geometric inlier fraction; match count counts distinct correspondences, not overlapping pixels.

The descriptor design uses the established orientation-normalized gradient-histogram principles described in [Lowe's feature matching paper](https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf). The implementation is locally authored and is not a copy of Diffchecker or OpenCV code. It uses Harris corners and a bounded pyramid rather than implementing the complete SIFT detector.

The existing affine transform/snapshot schema is unchanged. Perspective warp is not exposed in CompareCode and is explicitly rejected by this engine; a similarity transform cannot represent a homography. Manual flips and nonuniform manual scales keep their existing behavior. OpenCV and its vendored runtime are no longer required.

## Resource and History Ownership

The image store owns object-URL replacement and revocation. Do not leak blob URLs or revoke an image still used by current state.

`ImageView` creates durable image history snapshots after both inputs are available. Snapshot data may include source data URLs, thumbnails, dimensions, metadata, and alignment details. `api/useImageHistoryRestore.ts` reconstructs current image state and backfills missing released metadata through `HistoryService`.

Changes to saved image snapshots, metadata compatibility, IndexedDB records, or restore behavior must also use `$comparecode-data-migration` and follow `docs/PERSISTENCE_MIGRATIONS.md`.

## UI Boundaries

The comparison toolbar composes the shared `WorkspaceToolbar` card variant, choices and button family. Zoom/fade controls reuse `Slider` and `ResetButton`. Alignment prompt/panel modals use the shared native `Dialog`; number fields compose `Input` and `FormField` while preserving feature-owned parsing and draft values. Escape cancels a number draft before modal cancellation, and arrow keys in editable fields do not move the image. Canvas manipulation handles remain Image-owned. See [Shared UI components](ui-components.md).

Reuse primitives from `components/ui` and keep Image-only controls inside the feature. Changes to shared controls, responsive behavior, or theme tokens must also use `$comparecode-ui-components`.

Image comparison is canvas- and browser-dependent. Treat pointer gestures, zoom, pan, slider boundaries, image load failures, clipboard input, object URLs, and differing dimensions as material behavior.

The feature keeps its own compact comparison toolbar above the canvas within the common application navigation. Mode controls use a segmented control in wide image containers and a dropdown in narrow ones; both use the same canonical mode setter. The metadata area scrolls independently with a bounded height. Hiding metadata retains its component while removing hidden controls from navigation. On narrow screens, alignment controls sit below the preview with an independently scrolling form rather than covering the preview. These layout changes must not update image identity, zoom/pan state, or stored transforms. See [Workspace UI](workspace-ui.md) for common navigation and popups.

## Validation Map

Metadata cards stack below the image container's two-column breakpoint so file sizes, dimensions, and hashes remain readable on narrow screens.

- Image state and object-URL lifecycle: run `features/compare/image/store/__tests__/useImageCompareStore.test.ts`.
- Diff, alignment, transform, snapshot export, or metadata logic: add or run focused tests for the changed service or utility when deterministic automation is practical.
- Upload, clipboard, canvas rendering, gestures, responsive layout, and history restoration: use `$comparecode-browser-testing` with task-owned images and browser storage.
- Complete the repository validation required by `AGENTS.md` for the type of change.

### Auto align comparison evidence

Browser observations on 2026-10-02 used [Diffchecker's image comparison](https://www.diffchecker.com/image-compare/) and isolated CompareCode browser storage. This is a behavioral reference, not a guarantee of identical proprietary internals or bit-for-bit transforms.

| Input pair | Prompt | Diffchecker estimate | CompareCode estimate |
| --- | --- | --- | --- |
| `grinch_1.png`, `grinch_2.png` (1122 × 1402) | No | Scale about 1.398, rotation −0.390° | Scale about 1.403, rotation −0.518° |
| `mountains_1.png`, `mountains_2.png` (1672 × 941) | No | Approximately identity | Scale 1.0001, rotation 0.012° |
| `red_car_1.png` (1672 × 941), `red_car_2.png` (1636 × 905) | Yes | Scale 1.0014, rotation 0.016° | Scale 1.0007, rotation 0.019° |
| `scholar_1.bmp` (624 × 804), `scholar_2.png` (719 × 927) | Yes | Scale 1.082, rotation −1.126° | Scale 1.077, rotation −0.750° |
| `space_1.png`, `space_2.png` (1408 × 768) | No | Approximately identity | Scale 0.9999, rotation −0.010° |

The user-supplied examples remain external fixtures; unit tests do not depend on them. The Grinch and scholar images contain content changes that cannot all be registered by one rigid similarity transform. Their estimates differ slightly between engines; both align shared detail while leaving genuinely changed shapes visibly different. Do not special-case these filenames or dimensions to force equality.

Additional browser controls used a 640 × 360 base and mechanically transformed copies: half resolution, a 540 × 300 crop, a 40/24-pixel same-size shift, 17° rotation, combined 0.75 scale/−12° rotation, and a blank image. Both applications offered alignment for the unequal-size controls, omitted the prompt for equal-size controls, recovered the known geometric changes, and reported a failure for the blank image. Disabling Scale retained a scale of exactly 1; disabling both options disabled the action. CompareCode repeated alignment deterministically.

Automated regression tests use code-authored geometric rasters with known transforms. They cover unchanged and locally edited images, crops, translations, rescaling, large and small rotations, combined transforms, option constraints, swapped inputs, brightness differences, transparency, unrelated inputs, coordinate conversion, worker lifecycle, prompt identity, and stale-result cancellation. Run:

```sh
npx vitest run features/compare/image/services/alignment features/compare/image/store/__tests__/useImageCompareStore.test.ts
```

Manual validation must include the prompt/skip/reset/retry paths, all four comparison modes, snapshot export and history restoration, the production worker bundle, and a narrow alignment panel. Side by side retains its existing presentation of the source images; Fade, Slider, and Advanced consume the applied transform. Comparison/diff algorithms themselves are unchanged by registration work.

The implementation validation covered `/image` and `/history` on the task-owned development server at `http://localhost:3000`, plus the production worker at `http://localhost:3001/image`. Chromium used Playwright MCP isolated mode. Visual checks covered 929 × 925, 1400 × 900, 390 × 844, and 320 × 740 viewports, with no page-level horizontal overflow at the narrow sizes. A 3840 × 2160 input paired with its 640 × 360 source aligned at exactly 600% in approximately 1.2 seconds end to end on the test machine. This timing is an observation, not a portable performance guarantee. The Grinch PNG export and history-restored Fade canvas both measured 1593 × 1994 pixels and retained the same transform.

On 2026-10-02, the full suite passed 280 tests in 54 files, `npm run build` passed, and `npm run lint` passed with the existing Text Compare `react-hooks/incompatible-library` warning. Local browser checks produced no application errors; a logo-preload warning appeared in development. Diffchecker emitted unrelated advertising/telemetry request errors during testing. The additional `npx tsc --noEmit` check still reported five pre-existing test-type errors in the unchanged Text `OptionsView.test.tsx` and Markdown `markdownFileImport.test.ts`, `markdownSanitizeSchema.test.ts`, and `markdownSettingsReset.test.ts` files. They are outside this change; the Next production type/build check passed.
