# CompareCode

CompareCode is a free and open-source browser tool for comparing text, code, images, and Markdown.

It is designed for local, account-free review workflows: compare code snippets, inspect visual differences between images, draft Markdown notes with live preview, and keep recent work in browser storage.

> [!NOTE]
> This project is currently under development.

## 🧱 Module Architecture

The project is organized into clear modules:

- **Text:** Text and code comparison logic and UI.
- **Image:** Image comparison logic and UI.
- **Markdown:** Markdown editor, preview, formatting, paste handling, and session history.
- **Shared:** Common types, utilities, and reusable building blocks used by multiple modules.

When contributing, keep module boundaries strict: implement module-specific changes inside that module, and move reusable cross-module code to Shared.

## 🚀 Main Features

- **Text and Code Diff:** Compare text or code side by side, with split and unified views.
- **High-Precision Highlighting:** Choose word-level or character-level highlighting to spot small changes.
- **Flexible Merging:** Move changes block-by-block from left to right or right to left.
- **Image Comparison:** Compare screenshots and images with visual diff modes, alignment, threshold, heatmap, fade, and slider tools.
- **Markdown Preview:** Write Markdown with live preview, line numbers, local draft persistence, GitHub-style formatting, Mermaid diagrams, KaTeX formulas, and rich paste support.
- **Session Undo/Redo:** Use Markdown undo/redo during the current browser session, with a dedicated history panel.
- **Local History:** Store recent comparison history locally in the browser.
- **No Account Required:** Core workflows run directly in the browser.

## 🛠 Technology Stack

- **Framework:** Next.js and React
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Diff Engine:** `diff`
- **Local Database:** Dexie.js (IndexedDB)
- **Markdown Rendering:** `react-markdown`, Remark/Rehype plugins, Mermaid, KaTeX
- **Rich Paste Conversion:** Turndown
- **Icons:** React Icons

## 📖 How to Use

### Text Compare

1. Paste or type the original text in the left panel and the modified text in the right panel.
2. Click **Check it!** to generate the comparison.
3. Review highlighted differences, adjust options, and use merge controls when needed.
4. Copy the final text back to your clipboard.

### Image Compare

1. Load two images or screenshots.
2. Choose a comparison mode such as side-by-side, slider, fade, heatmap, or threshold.
3. Adjust alignment and visual settings to inspect differences clearly.

### Markdown Preview

1. Open the Markdown preview page.
2. Write or paste Markdown in the editor.
3. Use formatting tools, line-numbered editing, live preview, Mermaid diagrams, KaTeX formulas, and session undo/redo.
4. Reset to the default text whenever you want a clean sample document.

## 💻 Local Development

To run this project locally, you need Node.js installed on your machine.

1. Clone the repository.
2. Navigate to the project folder:
   ```bash
   cd comparecode-web
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.

## 🤝 Contributing

We welcome contributions. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the [MIT License](LICENSE). See the LICENSE file for details.
