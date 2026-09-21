---
name: comparecode-agent-files
description: Add, change, audit, move, or remove CompareCode AGENTS.md guidance, repository skills, and skill routing while keeping one global entry point and no parallel instruction system.
---

# CompareCode Agent Files

Keep repository AI guidance concise, current, discoverable, and free of duplicated instruction systems.

## Choose the Correct Owner

- Put durable rules that must apply to every task in the root `AGENTS.md`.
- Put repeatable task-specific workflows in `.agents/skills/<skill-name>/SKILL.md`.
- Keep the root `README.md` as the only repository README. Put detailed feature architecture in `docs/architecture/<topic>.md` and other durable contracts under `docs`.
- Keep product facts, architecture, behavior, schemas, and detailed policies in their authoritative project documentation rather than duplicating them in skills.
- Enforce deterministic requirements with tests, lint, build tooling, or CI instead of prose alone.
- Keep one-off instructions in the current user request.
- Do not create nested `AGENTS.md`, `AGENTS.override.md`, personal/local instruction files, or tool-specific parallel instruction files. This repository intentionally uses one root `AGENTS.md` plus root repository skills.

## Maintain Instructions and Skills

1. Inventory the root `AGENTS.md`, `.agents/skills`, root `README.md`, relevant `docs`, validation commands, and routing references before editing.
2. Check current official OpenAI documentation before encoding claims about Codex instruction discovery, repository skill discovery, metadata, or supported configuration.
3. Use `$skill-creator` for new or structurally changed skills. Keep names lower-case and hyphenated, descriptions trigger-focused, and instructions concise and imperative.
4. Keep repository skills instruction-only by default: add only `SKILL.md`. Add scripts, references, assets, or `agents/openai.yaml` only when the workflow has a demonstrated need.
5. Store each rule under one authoritative owner. Summarize non-negotiable authorization and safety constraints in `AGENTS.md`; keep procedural detail in the relevant skill.
6. Update root skill routing whenever a skill is added, renamed, repurposed, or removed. Remove stale identifiers, paths, aliases, and contradictory instructions in the same task.
7. Keep all agent files and technical documentation in English, while preserving the root rule that conversation follows the user's language.

## Validation

1. Run the validator supplied by `$skill-creator` for every added or changed skill.
2. Verify every referenced repository path exists. Search for stale skill names, missing routes, TODO placeholders, duplicate rules, non-root README files, nested agent files, and references to removed instruction systems.
3. Run `git diff --check`, inspect the full diff, and verify changed instruction files are UTF-8 without BOM or trailing whitespace.
4. For guidance-only changes, do not run the application build. Run build or tests only when the documentation is a runtime/build input or the same task also changes application behavior.
5. Report what moved, which source now owns it, what was removed, and any intentional policy refinement.

## Official References

- [OpenAI: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [OpenAI: Build skills](https://developers.openai.com/codex/skills)
