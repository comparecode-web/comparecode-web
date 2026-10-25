# Changelog

`CHANGELOG.md` at the repository root records user-visible changes to the application. The Git history and pull requests already record how the code changed, so the changelog answers a different question: what changed for someone using CompareCode.

## Structure

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with two project rules: releases are identified by date, and every entry names the area it affects.

```markdown
## Unreleased

### Added

- **Image compare:** Zoom and pan in every comparison mode.

## 2026-10-25

### Fixed

- **Markdown:** Pasted list indentation is preserved.
```

- `## Unreleased` is always the first section. It collects changes that are on `development` but not yet on `main`. It may be empty.
- Each release is a `## YYYY-MM-DD` section, newest first, with each date once. The date is the UTC day the release reached `main`. A second release on the same day adds its entries to that day's section.
- Categories appear in this order, each at most once per section, and only when they have entries: Added, Changed, Fixed, Removed, Security.
- Each entry is one line: `- **Area:** Description`. The areas are General, Home, Navigation, Themes, Settings, History, Text compare, Image compare, Markdown, and QR code. `scripts/changelog.mjs` owns these lists.

## Writing entries

- Add or update the entry in the same commit as the change, so the changelog and the code never disagree.
- Describe the effect for the user in sentence case and present tense, for example "Images stay sharp on high-density displays", not the implementation.
- Compare against the latest release, not against the previous commit. "Unreleased" describes what the next release changes for someone using the latest released version.
- One entry per noticeable change. When a later commit fixes, refines, renames, or removes something that is itself still unreleased, edit or delete its existing entry instead of adding a Fixed, Changed, or Removed entry. For example, a feature added and then fixed before the release appears only once under Added.
- Skip changes nobody using the app can notice: tests, refactors without behavior changes, CI, documentation, agent files, and dependency updates without a visible effect. Security fixes always get an entry.
- Follow the repository punctuation rules: no semicolons, and only straight quotes and hyphens.

## Releasing

A release is the merge of `development` into `main`. Before opening that pull request, date the unreleased entries:

```bash
npm run changelog:release
```

The command moves every "Unreleased" entry into a section dated today in UTC, merging with that day's section when one exists, and leaves "Unreleased" empty. Pass `-- --date YYYY-MM-DD` to choose another day, for example when the release is merged after midnight UTC. Commit the result through the usual topic branch and pull request into `development`, then open the release pull request to `main`.

Dating the release from a GitHub Action when `main` is updated would need write access for workflows and a bypass of the required status checks on `main` and `development`, so it is intentionally not automated.

## Validation

`npm run changelog:check` validates the file and runs in `npm run test` through `scripts/__tests__/changelog.test.ts`, so CI rejects a malformed changelog.
