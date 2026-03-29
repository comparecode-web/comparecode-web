
# Contributing to CompareCode

First off, thank you for considering contributing to CompareCode! It's people like you that make the open-source community such a great place to learn, inspire, and create.

## 🛠️ How to Contribute

We use the standard **Fork & Pull Request** workflow. You don't need direct access to this repository to contribute.

### 1. Fork the Repository

Click the **Fork** button at the top right corner of this repository to create a copy of the project in your own GitHub account.

### 2. Clone Your Fork

Clone the forked repository to your local machine.

### 3. Create a Branch

Always create a new branch for your changes. Avoid working directly on the `main` or `development` branch. Use descriptive names for your branches:

```
git checkout -b feature/your-amazing-feature
# or
git checkout -b fix/issue-description

```

### 4. Make Your Changes

-   Write your code.
    
-   Ensure your code follows the existing style and uses **TypeScript** properly.

-   Follow module boundaries strictly:
	- Text-related logic/UI changes belong in the Text module.
	- Image-related logic/UI changes belong in the Image module.
	- Cross-module reusable code belongs in Shared.
	- Avoid coupling Text internals to Image internals (and vice versa).
    
-   Run `npm run lint` to check for any formatting or linting issues.
    
-   Test your changes locally by running `npm run dev`.
    

### 5. Commit Your Changes

Write clear and concise commit messages explaining _what_ you changed and _why_.

**⚠️ IMPORTANT: Sign Your Commits** Our CI pipeline requires all commits to be signed (e.g., via GPG, SSH, or S/MIME) to be accepted. You can sign your commit by adding the `-S` flag:

```
git commit -S -m "Add: unified view toggle feature"

```

### 6. 🎯 The "One PR = One Feature/Fix" Rule

**Please keep your Pull Requests focused!** Each PR should address exactly **one** specific feature or bug fix. Do not mix multiple, unrelated changes into a single PR.

If you want to contribute multiple features or fixes, please create separate branches and open a separate Pull Request for each. This makes reviewing much faster and easier!

### 7. Push and Open a Pull Request

Push your branch to your forked repository on GitHub:

```
git push origin feature/your-amazing-feature

```

Then, go to the original CompareCode repository on GitHub, and you will see a prompt to open a **Pull Request (PR)**. Click it, describe your changes, and submit!

## 🧑‍💻 Code Guidelines

-   **Components:** We use functional React components with hooks.
    
-   **Styling:** We use Tailwind CSS. Try to use utility classes instead of writing custom CSS whenever possible.
    
-   **State Management:** For global state, use the existing `Zustand` stores located in the `/store` directory.
    

## 🐛 Found a Bug?

If you find a bug in the source code, you can help us by submitting an issue to our GitHub Repository. Even better, you can submit a Pull Request with a fix!

Thank you for your help!