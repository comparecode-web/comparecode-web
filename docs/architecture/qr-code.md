# QR Code Generator Architecture

## Ownership and route

`app/(workspace)/qr/page.tsx` owns the `/qr` route and its metadata. `features/qr` owns the input forms, payload encoding, QR matrix creation, SVG/PNG rendering, and export. The module does not depend on Text, Image, Markdown, or comparison history. Shared UI controls remain in `components/ui` and `components/settings`.

The route renders a server page with the interactive `QrGeneratorView` client component. `NavigationSidebar` and the home page link to the route; `config/seo.ts` and `app/sitemap.ts` describe it to search engines.

## Data flow

1. `QrGeneratorView` holds the active content form and appearance options in page-local React state. The Website form starts with `https://www.comparecodeweb.com/` so a QR preview is ready immediately. Nothing is written to IndexedDB, local storage, session storage, a URL, or an API. Navigating away or reloading restores defaults.
2. `qrPayload.ts` converts a typed form into one payload string. Website URLs are limited to `http:` and `https:`; text is preserved; Wi-Fi syntax follows the ZXing convention with escaped separators. Unknown runtime content types return an error without producing a payload.
3. `qrImage.ts` passes the payload to the MIT-licensed `qrcode` package. The package selects the version and mask; the user selects the error correction level. Its matrix is the single source for SVG preview, SVG export, and pixel-aligned PNG export.
4. The preview is a local SVG data URL. Downloads create a Blob URL and release it after the browser starts the download. No remote QR service, redirect, or analytics endpoint is used.

## Invariants

- Four light modules surround all four sides of every symbol. The border is mandatory and not user-configurable.
- Default colors are black on white. Custom colors must be six-digit hexadecimal values. All valid color combinations remain available for preview and export without contrast or readability warnings; syntactically invalid colors cannot be rendered.
- PNG dimensions match the selected size exactly. The four-module border remains part of the exported image.
- Classic square PNG output retains integer pixel boundaries. Styled output uses the same vector paths as SVG, scaled to the exact PNG size, with antialiasing for curves. `qrShapes.ts` owns square, rounded, dots and connected modules plus independently styled square, rounded or circular corner borders and centers. All modules outside the three corner markers follow the selected module style, including timing, format and alignment modules; Dots does not retain square strips. The encoded matrix is unchanged. Corner colors follow the code color until explicitly unlinked. All color syntax is validated before either renderer runs.
- SVG assigns crisp edge rendering to square geometry and geometric precision to curved geometry independently, so changing one corner cannot soften square modules elsewhere. Styled SVG has a 1024-pixel intrinsic size while retaining its module-based viewBox. The shared `ColorInput` uses a visible native color input as its own popup anchor, including in scrolled panels.
- The SVG preview is displayed within the preview area independently of the selected PNG size. SVG export remains resolution-independent.
- Error correction choices use plain-language labels with approximate recoverable codeword percentages: L 7%, M 15%, Q 25%, H 30%, following [DENSO WAVE's QR specification outline](https://www.qrcode.com/en/about/standards.html). They do not guarantee a scan of every damaged or low-contrast code.
- SVG contains only the generated paths and validated colors. User content is encoded in the matrix and never interpolated into SVG markup or HTML.
- Invalid or oversized content and invalid colors disable downloads and show a clear message. No payload is silently truncated.
- QR codes are static. Wi-Fi passwords are readable by anyone who obtains the code; the interface states this plainly.
- The supported content types are Website, Text, and Wi-Fi. Unknown runtime content types cannot produce a code.

## Validation

Focused tests under `features/qr` cover payload escaping, unknown content rejection, URL restrictions, independently generated reference matrices for all supported content types, SVG border/markup, exact PNG canvas size and integer pixel boundaries, colors, and UI state. Browser checks cover responsive layout, navigation, input errors, exports, and the absence of network transfer or persistence.

Shape changes additionally require independent decoding of exported symbols, PNG/SVG appearance parity, and representative scanning checks. A desktop decoder pass does not establish compatibility with every phone camera. Gradients and transparent backgrounds are deferred; this release keeps the required clear background and border.
