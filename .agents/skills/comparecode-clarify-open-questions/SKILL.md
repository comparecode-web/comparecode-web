---
name: comparecode-clarify-open-questions
description: Collect and present material clarification questions before CompareCode implementation when unresolved choices could change behavior, UX, architecture, compatibility, scope, validation, or authorization.
---

# CompareCode Clarify Open Questions

Resolve consequential ambiguity in one focused pass before implementation.

## Decide Whether to Ask

1. Inspect relevant code, tests, documentation, and repository guidance before treating a point as unresolved.
2. Ask only when different answers would materially change the result, compatibility, destructive impact, external side effect, or authorization boundary.
3. Do not ask for information that can be discovered locally or is already decided by repository contracts.
4. Make and state a safe, reversible assumption for minor non-blocking ambiguity, then continue.
5. Collect all currently known material questions so the user can decide them together.

## Present Questions

1. Use the current surface's structured question tool when available and appropriate.
2. Ask one to three focused questions at a time. Offer two or three mutually exclusive options when meaningful and preserve a free-text alternative when the interface supports it.
3. Mark the recommended option and give a short, concrete reason. State important tradeoffs without hiding them in generic wording.
4. Write every question, option, recommendation, and explanation in the language the user is currently using. Do not hardcode a particular conversation language.
5. When plain Markdown is the available format, localize this structure into the user's language:

```text
1) Question: ...
- Option A: ...
- Option B: ...
- Option C: ...
- Recommendation: Option B, because ...
```

6. If multiple-choice clarification is unavailable, ask the smallest direct blocking question instead.

## Continue After Answers

1. Summarize the selected decisions and their consequences before editing.
2. Update the implementation approach and affected contracts.
3. Do not silently reopen a resolved choice. Ask again only when implementation reveals a materially different constraint.
