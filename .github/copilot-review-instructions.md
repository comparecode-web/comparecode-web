# GitHub Review Instructions for CompareCode

These instructions define review priorities for pull requests in this repository.
Apply them in order: block on higher-priority issues before discussing lower-priority items.

## Review Priority Order

### P0 - Correctness and User Impact (Must Fix)
- Confirm behavior matches the stated requirement and product intent.
- Validate edge cases and failure paths, not just happy paths.
- For UI changes, verify visible behavior with a quick manual walkthrough.
- Reject changes that hide bugs behind fallback logic without a clear reason.

### P1 - Architecture and Maintainability (Must Fix)
- Prefer existing module boundaries:
  - Text module changes stay in Text.
  - Image module changes stay in Image.
  - Shared code goes to Shared only when truly reused.
- Enforce single source of truth:
  - Do not duplicate business rules across store, component, and service layers.
  - Move shared logic to one reusable place.
- Reuse existing components and primitives before creating new ones.
- New one-off components/styles require explicit justification in PR notes.

### P2 - Performance and Scalability (Must Fix if material)
- Avoid N+1 patterns in data access and repeated expensive operations.
- Prefer batch operations over per-item loops when the operation can be grouped.
- Minimize unnecessary rerenders and repeated calculations in render paths.
- For large lists and heavy UI, prefer virtualization and memo-safe patterns.

### P3 - Security and Safety (Must Fix)
- No secrets, tokens, keys, or credentials in code, logs, or tests.
- Validate untrusted input boundaries and output handling.
- Avoid unsafe HTML/script handling unless there is a reviewed reason.

### P4 - Testability and Verification (Should Fix)
- Request tests for meaningful logic changes.
- If tests are not added, require a clear manual test plan in the PR.
- Ensure existing checks pass (lint/build/tests relevant to scope).

### P5 - Consistency and Style (Should Fix)
- Follow repository conventions and naming.
- Avoid unrelated refactors in feature/fix PRs.
- Keep diffs focused and easy to review.

## Frontend-Specific Guidance
- Reuse shared UI building blocks (for example button/input/switch primitives) instead of creating near-duplicate variants.
- Prefer token/theme variables over ad-hoc inline styles.
- Only use explicit local overrides when there is a clear UX reason.
- Keep keyboard interactions and accessibility behavior consistent (focus, escape, ARIA roles, key conflicts).

## Data and Workflow Guidance
- Keep operations idempotent where practical.
- For mass updates/deletes/inserts, prefer one grouped operation over many per-row operations.
- Document expected complexity when a change can affect large datasets.

## PR Author Checklist (before requesting review)
- Problem statement and scope are clear in PR description.
- Why this approach was chosen is documented briefly.
- Risk and rollback notes are included for risky changes.
- Screenshots or short demo notes for user-facing UI changes are attached.
- Validation evidence is provided (lint/tests/manual checks).

## Reviewer Response Style
- Start with blockers first (P0-P3), then non-blocking improvements.
- Be specific and actionable; include file/function references.
- Prefer guidance that improves code health, not personal style preferences.
- Acknowledge good decisions when present.

## Notes on Sources
These priorities align with common code review guidance from:
- Google Engineering Practices: design, functionality, complexity, tests, documentation, and context-aware review.
- GitHub Pull Request guidance: small focused PRs, clear context, security checks, and reviewer guidance.
