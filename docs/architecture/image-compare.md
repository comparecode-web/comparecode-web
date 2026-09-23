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
- `services/alignment/autoAlignService.ts` implements the local automatic alignment strategy.
- `services/alignment/opencvAutoAlignService.ts` integrates the OpenCV-backed path.
- `AlignmentPrompt` and `ImageAlignmentPanel` own the user-facing alignment workflow.

Preserve coordinate-system assumptions across preview, applied transforms, canvas rendering, diff generation, and saved history. A transform change must be checked in every affected consumer rather than patched in one view only.

## Resource and History Ownership

The image store owns object-URL replacement and revocation. Do not leak blob URLs or revoke an image still used by current state.

`ImageView` creates durable image history snapshots after both inputs are available. Snapshot data may include source data URLs, thumbnails, dimensions, metadata, and alignment details. `api/useImageHistoryRestore.ts` reconstructs current image state and backfills missing released metadata through `HistoryService`.

Changes to saved image snapshots, metadata compatibility, IndexedDB records, or restore behavior must also use `$comparecode-data-migration` and follow `docs/PERSISTENCE_MIGRATIONS.md`.

## UI Boundaries

Reuse primitives from `components/ui` and keep Image-only controls inside the feature. Changes to shared controls, responsive behavior, or theme tokens must also use `$comparecode-ui-components`.

Image comparison is canvas- and browser-dependent. Treat pointer gestures, zoom, pan, slider boundaries, image load failures, clipboard input, object URLs, and differing dimensions as material behavior.

The feature keeps its own compact comparison toolbar above the canvas within the common application navigation. Mode controls use a segmented control in wide image containers and a dropdown in narrow ones; both use the same canonical mode setter. The metadata area scrolls independently with a bounded height. Hiding metadata retains its component while removing hidden controls from navigation. On narrow screens, alignment controls sit below the preview with an independently scrolling form rather than covering the preview. These layout changes must not update image identity, zoom/pan state, or stored transforms. See [Workspace UI](workspace-ui.md) for common navigation and popups.

## Validation Map

Metadata cards stack below the image container's two-column breakpoint so file sizes, dimensions, and hashes remain readable on narrow screens.

- Image state and object-URL lifecycle: run `features/compare/image/store/__tests__/useImageCompareStore.test.ts`.
- Diff, alignment, transform, snapshot export, or metadata logic: add or run focused tests for the changed service or utility when deterministic automation is practical.
- Upload, clipboard, canvas rendering, gestures, responsive layout, and history restoration: use `$comparecode-browser-testing` with task-owned images and browser storage.
- Complete the repository validation required by `AGENTS.md` for the type of change.
