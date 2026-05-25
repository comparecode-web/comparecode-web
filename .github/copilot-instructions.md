# GitHub Copilot Instructions for CompareCode

## Project Context
- Repository: https://github.com/comparecode-web/comparecode-web
- This is a free and open-source project.
- This file is repository-shared guidance for Copilot usage.

## Optional Personal Override (Local Only)
- If needed, create `.github/copilot-instructions.local.md` for personal/local preferences.
- The local override file must stay untracked and should not be committed.
- Keep personal identity data, private workflow preferences, and machine-specific details in the local override file only.

## Contribution and Workflow Rules
- Follow the Fork & Pull Request workflow.
- Do not work directly on `main` or `development`; use feat/fix branches.
- Branch naming must be English and start with `feature/` or `fix/`.
- Keep changes focused: one branch and one PR should target one feature or one fix.
- Creating/switching branches, committing, and pushing are allowed only when the user explicitly asks for it or explicitly approves it.
- If the user did not request or approve branch creation/switch, commit, or push, do not perform those actions.
- DCO is enforced: every commit must be signed off (`Signed-off-by`) with `git commit -s`.
- This is mandatory for all commits without exception.

### Branch Name Examples
- `feature/text-image-architecture-separation`
- `feature/custom-highlight-colors-settings`
- `feature/ui-tweaks-and-fonts`
- `fix/custom-scrollbar-thumb-spacing`

## Pull Request Title Convention
- PR titles must start with one of:
  - `feat: ` for features
  - `fix: ` for bug fixes

## Engineering Guidelines
- Use TypeScript consistently and follow existing code style.
- Prefer functional React components and hooks.
- Prefer Tailwind utility classes for styling.
- Use existing Zustand stores for global state.
- Write all program code content in English (identifiers, code strings, and developer-facing messages).
- Do not add comments in program code.
- Keep module boundaries strict:
  - Text module: handle only text-diff related logic/UI.
  - Image module: handle only image-diff related logic/UI.
  - Shared module: place cross-module types, utilities, and reusable primitives.
  - Avoid Text-internal dependencies in Image and Image-internal dependencies in Text.
- Build for long-term maintainability: avoid quick-fix solutions when possible.
- Prefer best-practice implementations that remain understandable and maintainable over time.
- Run quality checks before proposing changes:
  - `npm run lint`

## Notes for Copilot
- Avoid unrelated refactors in feature/fix PRs.
- Preserve repository conventions and naming patterns.
- Follow the review priority checklist in `.github/copilot-review-instructions.md`.
- Accessibility `aria-label` review comments are not required in this repository scope; treat them as non-blocking and ignore them unless explicitly requested by the user.
- Prioritize correctness, architecture boundaries, and single source of truth before style-level comments.
- Prefer reusing existing UI primitives/components instead of introducing near-duplicate implementations.
- Avoid ad-hoc styling or one-off component variants unless explicitly justified by requirements.
- For data workflows, watch for N+1 query patterns and avoid per-item loops when batch operations are possible.
- After every code modification task, always include exactly one short commit message suggestion at the end of the chat response in English.
- The suggestion must be a normal, human-readable commit message with spaces (not a branch-style slug).
- Use this exact output format: Suggested commit: `fix: your short message here`
- Valid examples:
  - Suggested commit: `fix: keep Last Activity relative in history`
  - Suggested commit: `fix: move bookmarked item above others during transition`
  - Suggested commit: `feat: add keyboard shortcut hint to history header`
