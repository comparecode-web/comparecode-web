# QR Code Generator Architecture

## Ownership and route

`app/(workspace)/qr/page.tsx` owns the `/qr` route and its metadata. `features/qr` owns the input forms, payload encoding, QR matrix creation, SVG/PNG rendering, and export. The module does not depend on Text, Image, Markdown, or comparison history. Shared UI controls remain in `components/ui` and `components/settings`.

The route renders a server page with the interactive `QrGeneratorView` client component. `NavigationSidebar` and the home page link to the route; `config/seo.ts` and `app/sitemap.ts` describe it to search engines.

## Data flow

1. `QrGeneratorView` holds the active content form and appearance options in page-local React state. The Website form starts with `https://www.comparecodeweb.com/` so a QR preview is ready immediately. Nothing is written to IndexedDB, local storage, session storage, a URL, or an API. Navigating away or reloading restores defaults.
2. `qrPayload.ts` converts a typed form into one payload string. Website URLs are limited to `http:` and `https:`; text is preserved; Wi-Fi syntax follows the ZXing convention with escaped separators; contacts are vCard 4.0 text with CRLF line endings and escaped fields.
3. `qrImage.ts` passes the payload to the MIT-licensed `qrcode` package. The package selects the version and mask; the user selects the error correction level. Its matrix is the single source for SVG preview, SVG export, and pixel-aligned PNG export.
4. The preview is a local SVG data URL. Downloads create a Blob URL and release it after the browser starts the download. No remote QR service, redirect, or analytics endpoint is used.

## Invariants

- Four light modules surround all four sides of every symbol. The border is mandatory and not user-configurable.
- Default colors are black on white. Custom colors must be six-digit hexadecimal values. Inverted or low-contrast colors show a readability warning but remain available for preview and export; syntactically invalid colors cannot be rendered.
- PNG dimensions match the selected size exactly. Module boundaries are rounded to whole pixels so the output remains sharp; some adjacent modules may differ by one pixel. The four-module border remains part of the exported image.
- The SVG preview is displayed within the preview area independently of the selected PNG size. SVG export remains resolution-independent.
- Error correction choices use plain-language labels with approximate recoverable codeword percentages: L 7%, M 15%, Q 25%, H 30%, following [DENSO WAVE's QR specification outline](https://www.qrcode.com/en/about/standards.html). They do not guarantee a scan of every damaged or low-contrast code.
- SVG contains only the generated paths and validated colors. User content is encoded in the matrix and never interpolated into SVG markup or HTML.
- Invalid or oversized content and invalid colors disable downloads and show a clear message. No payload is silently truncated.
- QR codes are static. Wi-Fi passwords and contact details are readable by anyone who obtains the code; the interface states this plainly.

## Validation

Focused tests under `features/qr` cover payload escaping, vCard line endings, URL restrictions, SVG border/markup, exact PNG canvas size and integer pixel boundaries, colors, and UI state. Browser checks cover responsive layout, navigation, input errors, exports, and the absence of network transfer or persistence. The vCard 4.0 release gate also requires successful scanning on physical Android and iOS devices. Simulators and matrix decoders cannot replace that gate; if devices are unavailable, report it as incomplete.
