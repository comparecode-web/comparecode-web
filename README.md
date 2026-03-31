# CompareCode

CompareCode is a free and open-source text comparison utility built with **Next.js** and **React** (planned to be packaged with Electron).

It is designed to provide high-precision text comparison and flexible merging capabilities, allowing developers to analyze and synchronize differences between two text sources with ease.

> [!NOTE]
> 
> This project is currently **under development**.

## 🧱 Module Architecture

The project is organized into three clear modules:

-   **Text:** Text comparison logic and UI.
-   **Image:** Image comparison logic and UI.
-   **Shared:** Common types, utilities, and reusable building blocks used by multiple modules.

When contributing, keep module boundaries strict: implement module-specific changes inside that module, and move reusable cross-module code to Shared.

## 🚀 Main Features

-   **Dual View Modes:** Switch between **Split (Side-by-Side)** and **Unified** views to visualize differences in the way that suits you best.
-   **High-Precision Highlighting:** Choose between **Word-level** or **Character-level** highlighting to spot even the smallest changes.
-   **Flexible Merging:** Interactively merge changes block-by-block from left-to-right or right-to-left to build the final result.
-   **Smart Comparison:** Optional "Ignore Whitespace" toggle to focus only on meaningful code or text changes.
-   **History Tracking:** Automatically saves comparison history locally so you can revisit previous diffs.
-   **Integrated Editor:** Edit original or modified texts on the fly and re-run comparisons instantly.

## 🛠 Technology Stack

-   **Framework:** Next.js & React
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **State Management:** Zustand
-   **Diff Engine:** `diff` (npm package)
-   **Local Database:** Dexie.js (IndexedDB)
-   **Icons:** React Icons (Material Design)

## 📖 How to Use

1.  **Input Text:** Paste or type your original text in the left panel and the modified version in the right panel.
2.  **Compare:** Click the **Check it!** button to generate the visual comparison.
3.  **Analyze & Merge:**
    -   Select a difference block to reveal merge controls.
    -   Use the arrow buttons to move changes between sides.
    -   Toggle **Word Wrap** or **View Mode** in the Settings panel for better visibility.
4.  **Export:** Copy the final result back to your clipboard using the quick-copy buttons.

## 💻 Local Development

To run this project locally, you need Node.js installed on your machine.

1.  Clone the repository.
2.  Navigate to the project folder:
    ```bash
    cd comparecode-web
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
5.  Open `http://localhost:3000` in your browser.

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how to get started.

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.