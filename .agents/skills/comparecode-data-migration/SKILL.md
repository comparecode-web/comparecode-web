---
name: comparecode-data-migration
description: Change CompareCode IndexedDB, local-storage, session-storage, saved settings, history schemas, keys, or serialized formats without losing released browser data.
---

# CompareCode Data Migration

Preserve released browser data through deterministic migration and compatibility behavior.

## Source of Truth

Read `docs/PERSISTENCE_MIGRATIONS.md` before changing a persisted schema, key, default, serialized value, compatibility reader, or storage owner. Update that contract in the same task when ownership, compatibility policy, or validation requirements change.

## Workflow

1. Classify the affected data as Dexie/IndexedDB history, durable local-storage settings or Markdown state, session-scoped Markdown history, or a future portable import/export format.
2. Inspect the storage owner, current reader and writer, released keys and shapes, defaults, existing upgrade logic, all consumers, and relevant tests before editing.
3. Define deterministic behavior for missing, malformed, legacy, current, and unknown future values before changing the writer.
4. Add the migration or compatibility reader at the persistence boundary before new code writes the changed representation. Do not scatter legacy handling through stores or UI components.
5. Preserve durable user data. Never recreate the database, clear a table, delete a durable key, silently reinterpret a value, or fall back to destructive reset as a migration strategy unless the user explicitly authorizes that exact data loss.
6. For an IndexedDB schema change, increment `DB_CONFIG.VERSION`, retain released Dexie version declarations, define the new schema, and perform deterministic data conversion in the version upgrade transaction.
7. For a durable local-storage key or shape change, read the released representation, validate and convert it, write the new representation only after successful conversion, and retain bounded fallback reading while released data can still exist.
8. Treat session-storage undo history as disposable session state but handle invalid values deterministically and never let its failure remove durable Markdown content or settings.
9. Remove obsolete internal aliases after their compatibility boundary, while keeping readers required for released data. Do not keep two active sources of truth.
10. Avoid adding a migration library or test dependency when existing code and tooling can verify the change. Any new dependency still requires the root license and authorization checks.

## Validation

- Add representative tests for the oldest supported released shape, the immediately previous shape, current data, missing fields, malformed input, and unknown future values when applicable.
- Verify both successful upgrade and safe failure behavior. Confirm a failed conversion does not partially overwrite or delete durable data.
- For IndexedDB changes, test the actual version transition and affected reads/writes when the existing environment supports it; otherwise report the exact integration gap.
- Use `$comparecode-browser-testing` with an isolated profile for meaningful end-to-end upgrade checks, seeding only task-owned browser storage.
- Complete the validation required by the root `AGENTS.md` and report every compatibility path that could not be exercised.
