# Contributing to CompareCode

First off, thank you for considering contributing to CompareCode! It's people like you that make the open-source community such a great place to learn, inspire, and create.

## How to Contribute

We use the standard **Fork & Pull Request** workflow. You don't need direct access to this repository to contribute.

### 1. Fork the Repository

Click the **Fork** button at the top right corner of this repository to create a copy of the project in your own GitHub account.

### 2. Clone Your Fork

Clone the forked repository to your local machine.

### 3. Create a Branch

Always create a new branch for your changes. Avoid working directly on the `main` or `development` branch. Use descriptive names for your branches:

```bash
git checkout -b feature/your-amazing-feature
# or
git checkout -b fix/issue-description
```

### 4. Make Your Changes

- Write your code.
- Ensure your code follows the existing style and uses **TypeScript** properly.
- Follow the documented module boundaries:
  - [Text Compare architecture](docs/architecture/text-compare.md)
  - [Image Compare architecture](docs/architecture/image-compare.md)
  - [Markdown architecture](docs/architecture/markdown.md)
- Avoid coupling Text internals to Image internals or unrelated features to Markdown internals.
- Run `npm run lint` and `npm run test` before submitting production code changes.
- Run `npm run build` when production code, configuration, or dependencies change.

### 5. Commit Your Changes

Use an English, subject-only [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) message.

Every commit requires a [Developer Certificate of Origin](https://developercertificate.org/) sign-off. Create it with `git commit -s`:

```bash
git commit -s -m "feat(text): add unified view toggle"
```

### 6. The "One PR = One Feature/Fix" Rule

**Please keep your pull requests focused!** Each PR should address exactly **one** specific feature or bug fix. Do not mix multiple unrelated changes into a single PR.

If you want to contribute multiple features or fixes, create separate branches and open a separate pull request for each. This makes reviewing much faster and easier.

### 7. Push and Open a Pull Request

Push your branch to your forked repository on GitHub:

```bash
git push origin feature/your-amazing-feature
```

Then go to the original CompareCode repository on GitHub, open a pull request to `development`, describe your changes, and submit it.

## Code Guidelines

- **Components:** Use functional React components with hooks.
- **Styling:** Use Tailwind CSS and the existing theme tokens and shared UI primitives.
- **State Management:** Extend the canonical Zustand store for the affected feature or application-wide concern. Do not create a parallel source of truth.

## Found a Bug?

If you find a bug in the source code, submit an issue to the GitHub repository. Even better, submit a pull request with a fix.

Thank you for your help!
