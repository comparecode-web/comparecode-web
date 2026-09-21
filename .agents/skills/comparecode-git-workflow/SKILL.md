---
name: comparecode-git-workflow
description: Handle CompareCode branch, staging, commit, push, fork, and pull-request work when the user explicitly requests one of those Git delivery actions.
---

# CompareCode Git Workflow

Deliver the user's requested Git work without exceeding their authorization.

## Authorization and Protected Branches

1. Inspect `git status`, the complete relevant diff, the current branch, recent history, and configured remotes before acting.
2. Create or switch a branch, commit, push, or open a pull request only when the user explicitly requests that action. A request to open a pull request authorizes the minimum topic-branch push required to create it, but never authorizes a merge.
3. Resolve `dev`, `develop`, and `developer` to the actual `development` branch.
4. Before creating a `feature/*` branch, fetch the canonical repository and verify the local `development` ref matches its latest fetched upstream state. Branch directly from that `development` commit, never from `main` or another topic branch, and do not inherit `development` as the topic branch's upstream.
5. Never commit directly to, merge locally into, or push changes directly to `development` or `main`. Use a `feature/<descriptive-name>` or `fix/<descriptive-name>` branch.
6. Keep the complete branch name at 60 characters or fewer. Prefer three to six short descriptive words after the prefix, separated by hyphens.
7. Follow the user's requested scope and branch organization across affected features. Exclude unrelated user changes from staging and commits.
8. Preserve user-created commits. Do not amend, squash, rebase, reset, force-push, or rewrite them unless the user explicitly requests that exact history operation.

## Topic Branch Creation

1. Fetch the canonical `development` ref and identify the canonical remote from its URL and repository ownership rather than assuming a remote name.
2. Verify the worktree state is safe for switching. Bring the local `development` branch to the fetched canonical commit only by fast-forward; if local history has diverged, stop and report it instead of resetting or rewriting history.
3. Create the topic branch from the verified local `development` ref without upstream tracking:

```powershell
git switch --no-track -c feature/descriptive-name development
```

Use the corresponding `fix/descriptive-name` prefix for a fix. Never create the topic branch with a command that makes `origin/development` or another base branch its upstream.

4. Immediately verify the new branch with `git status --short --branch`, `git branch -vv`, and the merge base against `development`. Before the first push, the topic branch must have no upstream and its merge base must equal the verified `development` commit.
5. When the user later authorizes the first push, publish the topic branch to the correct remote and set its upstream to the same-named remote topic branch. Never set a topic branch to track `development`.

## Fork and Remote Handling

1. Determine from the remotes and repository metadata whether the working repository is the canonical repository or a contributor fork. Do not infer ownership from a remote name alone.
2. In a fork workflow, push the topic branch to the contributor's fork and open the pull request against the canonical repository. Do not push a contributor branch to upstream.
3. In a shared-repository workflow, push only the topic branch to the authorized repository remote.
4. Do not change remote URLs or add, remove, or rename remotes without an explicit request or a necessary choice the user has approved.

## Commit Workflow

1. Stage only files that belong to the requested change, then inspect the staged diff.
2. Confirm the required validation from `AGENTS.md` has passed or clearly report what could not be run.
3. Use the configured human contributor identity. Never replace it with an agent identity or modify Git identity/signing settings. If the required identity is missing, stop before committing and ask the user to configure it.
4. Every commit must include the DCO sign-off created by `git commit -s`.
5. Use one English Conventional Commit subject and no description/body. The generated `Signed-off-by` trailer is the required exception to the no-footer rule.

Use this shape:

```text
<type>[optional scope]: <short imperative description>
```

Choose the type from the primary change. Common types include `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, and `chore`. Prefer a concise lower-case description without a trailing period. Aim for 50-60 characters and never exceed 72 characters for the complete subject, including its type and optional scope. Rewrite or split an overlong subject instead of abbreviating it into unclear wording.

Examples:

```text
feat: add synchronized image zoom
fix(markdown): preserve pasted list indentation
docs: migrate agent guidance to repository skills
```

Create the requested commit with a subject-only command such as:

```powershell
git commit -s -m "docs: migrate agent guidance to repository skills"
```

## Pull Requests

1. Open a pull request only when the user explicitly requests it. The default and normal base is `development`.
2. Do not open a pull request to `main` unless the user explicitly authorizes `main` as the target in the current task.
3. Use an English Conventional Commit-style title that reflects the primary change. Keep the complete title at 72 characters or fewer.
4. Write the English pull-request description with exactly these content sections:

```markdown
## Summary

One or two sentences describing the purpose and essential result.

## What changed

- Describe the material changes and their effects.
- Match the detail to the actual work without cataloguing every file.

## Outcome

State the practical consequence or achieved result.
```

5. Verify the head repository and branch, base repository and `development` branch, final title, final body, and validation state before creating the pull request.
6. Never merge, close, or otherwise finalize the pull request unless the user explicitly requests that separate action.

## References

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
- [Developer Certificate of Origin 1.1](https://developercertificate.org/)
- [GitHub Docs: Creating a pull request from a fork](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork)
