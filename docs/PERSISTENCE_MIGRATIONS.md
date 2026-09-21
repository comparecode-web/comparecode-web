# Persistence and Migration Contract

## Purpose

CompareCode stores user work entirely in the browser. Released durable data must remain readable after application updates, and storage changes must have deterministic compatibility behavior.

This document owns persistence boundaries and migration policy. Implementation files remain authoritative for current schema versions, exact types, and defaults.

## Storage Ownership

| Storage | Data | Owner | Durability |
| --- | --- | --- | --- |
| Dexie/IndexedDB `CompareCodeDatabase` | Comparison history, snapshots, bookmarks, and history steps | `services/db.ts` and `services/historyService.ts` | Durable across sessions and releases |
| `localStorage` settings | Application settings under the key owned by `STORAGE_KEYS.SETTINGS` | `services/settingsService.ts` | Durable across sessions and releases |
| `localStorage` Markdown state | Markdown content and UI preferences under the keys owned by `features/markdown/services/markdownStorage.ts` | `features/markdown/services/markdownStorage.ts` | Durable across sessions and releases |
| `sessionStorage` Markdown history | Current-session undo and redo history | `features/markdown/services/markdownStorage.ts` | Session-scoped and disposable after the session |

Future import, export, backup, or interchange files become durable external contracts once released and must define their own explicit format version and compatibility rules.

## Compatibility Invariants

- Keep persistence ownership at the established service or storage boundary. UI components and feature stores consume normalized current values.
- Preserve durable history, settings, Markdown content, and UI preferences through compatible readers or explicit migrations.
- Do not use database recreation, table clearing, key deletion, or silent reset as a normal upgrade path.
- Do not reinterpret a released value as a different meaning without an explicit conversion.
- Apply defaults only to missing or invalid fields. Do not replace unrelated valid fields when one field needs normalization.
- Complete conversion before the new writer emits a representation that older compatibility code cannot understand.
- Keep migrations deterministic and safe to retry where the storage API permits retries.
- Treat unknown future versions conservatively: do not silently coerce or overwrite them as if they were current data.

## Required Value Handling

Every persisted reader or migration defines these cases when they apply:

- Missing data: return the documented default or empty state without creating unrelated records.
- Malformed data: fail safely, preserve unrelated durable data, and avoid partial writes.
- Legacy data: convert known released values to the current in-memory representation at the persistence boundary.
- Current data: read without mutation unless a repair is explicitly required.
- Future or unknown data: avoid destructive fallback and surface or retain enough information for a safe decision.

## IndexedDB Changes

- `DB_CONFIG.VERSION` in `config/constants.ts` is the current database version source of truth.
- Retain every released Dexie version declaration needed to upgrade an existing browser database.
- Add the next version with the complete schema for that version and an upgrade callback when stored records need conversion.
- Perform multi-table changes inside the Dexie version upgrade transaction and keep related records consistent.
- Populate newly required fields deterministically from released data or an explicit default.
- Preserve identifiers and relationships between history sessions and their history steps.
- Test upgrades from representative released versions instead of testing only a newly created database.

## Local and Session Storage Changes

- Keep storage keys centralized in their current owner. Do not duplicate string keys in stores or components.
- Prefer a compatibility reader when a shape can evolve safely under the same durable key.
- When a durable key must change, read and validate the old value first, write the new value only after successful conversion, and remove the old value only when rollback and released compatibility no longer require it.
- Keep legacy value maps narrowly scoped to the persistence boundary and remove aliases only after their supported compatibility window.
- Session-scoped history may fall back to an empty history when malformed or incompatible, but that fallback must not alter durable Markdown content or preferences.

## Validation Matrix

A persistence change should cover the applicable cases below:

| Case | Expected evidence |
| --- | --- |
| Fresh install | Current schema and defaults initialize correctly |
| Oldest supported release | Data upgrades without loss |
| Immediately previous release | Normal upgrade path succeeds |
| Missing optional fields | Explicit defaults are applied |
| Malformed values | Safe fallback occurs without unrelated mutation |
| Interrupted or failed conversion | No partial durable-data loss |
| Current representation | Read and write behavior remains stable |
| Unknown future representation | No silent destructive downgrade |

Use focused unit or integration tests where storage can be controlled deterministically. Use an isolated browser profile for an end-to-end migration walkthrough when browser storage behavior or a real Dexie upgrade is material.

## Documentation Updates

Update this contract in the same change when storage ownership, durability, schema strategy, key lifecycle, compatibility policy, or required validation changes. Do not update it for an implementation refactor that leaves the persistence contract unchanged.
