---
name: comparecode-qr
description: Implement or review CompareCode QR content inputs, payload encoding, symbol generation, preview, PNG/SVG export, or QR-specific validation.
---

# CompareCode QR

Keep QR content, rendering, and export consistent with the supported product scope and local-only data flow.

## Required Context

Read `docs/architecture/qr-code.md` before changing QR code. Its supported content list, deferred features, and validation gates are the feature contract.

## Workflow

1. Inspect the `/qr` route, the affected component or service, its direct callers, and the nearest tests.
2. Keep content encoding in `features/qr/services/qrPayload.ts` and matrix, color, SVG, and PNG behavior in `features/qr/services/qrImage.ts`. Keep page-local UI state in the generator component; do not add persistence or network calls without a separate product decision.
3. Preserve one generated symbol as the source for preview and both exports. Keep the four-module clear border, exact PNG dimensions, and validated colors. Never interpolate raw user content into SVG markup.
4. Reject unsupported content safely before symbol generation. Check the architecture contract before exposing a new content type or claiming scanner compatibility.
5. Use `$comparecode-ui-components` when shared controls change and `$comparecode-browser-testing` for visible, responsive, or download behavior.

## Validation

Run focused QR payload, image, and component tests, then the checks required by `AGENTS.md`. Exercise changed input, error, preview, and export paths in an isolated browser. Check generated symbols against independent reference vectors; automated checks alone do not establish device compatibility.
