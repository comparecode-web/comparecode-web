# CompareCode

CompareCode is a free and open-source text comparison utility built with **Next.js** and **React** (planned to be packaged with Electron).

It is designed to provide high-precision text comparison and flexible merging capabilities, allowing developers to analyze and synchronize differences between two text sources with ease.

> [!NOTE]
> 
> This project is currently **under development**.

## 🎯 Project Goals & Vision

Our primary goal is to build a free and open-source text comparison tool inspired by **Diffchecker**. At this stage, we are focusing strictly on **Text-to-Text comparison**.

### 🥇 Top Priorities: The Diffing Engine

Diffchecker serves as our main inspiration, particularly for its highly accurate diff highlighting. Our absolute top priority is to build a diffing engine that achieves this same level of quality. Specifically, we want to master:

-   **"Word" and "Character" precision levels**
-   **"Ignore Whitespace" functionality**

Adopting these core concepts will allow us to provide a seamless highlighting experience. To assist with this, we have included a **"Debug: TestText"** button in the application. This dynamically loads a pre-defined original and modified text pair, allowing us to generate a result in our app and manually compare it side-by-side with our inspiration to verify the accuracy of our algorithm.

### 🎨 Low Priorities: UI/UX & Theming

Currently, UI/UX design, detailed styling, and theming are low priorities. While the visual aspects will eventually need polishing, **perfecting the core diffing engine is what matters most right now**.

_(However, any sensible UI improvements or design modernizations are still warmly welcome if they enhance the overall experience!)_

> **Ultimately, refining the diffing logic and the highlighting engine is our number one priority; everything else is secondary.**

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