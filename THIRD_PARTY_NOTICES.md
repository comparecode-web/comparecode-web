# Third-Party Notices

This project uses third-party open-source software.

## OpenCV.js

- Package: `@techstark/opencv-js`
- License: Apache License 2.0
- Source: https://github.com/TechStark/opencv-js
- Upstream project: https://opencv.org

The OpenCV.js package is used for browser-side image feature detection, descriptor matching, and affine alignment estimation.

Apache License 2.0 text: https://www.apache.org/licenses/LICENSE-2.0

## Markdown Preview Runtime Libraries

- Packages: `react-markdown`, `remark-gfm`, `remark-gemoji`, `remark-math`, `rehype-raw`, `rehype-sanitize`, `rehype-katex`, `katex`, `mermaid`, `turndown`, `turndown-plugin-gfm`
- License: MIT
- Sources:
  - https://github.com/remarkjs/react-markdown
  - https://github.com/remarkjs/remark-gfm
  - https://github.com/remarkjs/remark-gemoji
  - https://github.com/remarkjs/remark-math
  - https://github.com/rehypejs/rehype-raw
  - https://github.com/rehypejs/rehype-sanitize
  - https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex
  - https://github.com/KaTeX/KaTeX
  - https://github.com/mermaid-js/mermaid
  - https://github.com/mixmark-io/turndown
  - https://github.com/domchristie/turndown-plugin-gfm

These packages are used for browser-side Markdown rendering, GitHub Flavored Markdown support, emoji shortcodes, limited sanitized HTML alignment, mathematical notation, Mermaid diagrams, and rich HTML paste conversion to Markdown.

MIT License text: https://opensource.org/license/mit

Notable transitive license finding:

- Package: `@mixmark-io/domino`
- License: BSD 2-Clause
- Source: https://github.com/mixmark-io/domino
- Used transitively by `turndown`.
