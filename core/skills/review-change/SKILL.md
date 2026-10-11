---
name: review-change
description: Independently review approved requirements against raw changed files and tests; use when implementation is ready for correctness and regression review.
---

# review-change

Read [reviewer contract](../../roles/reviewer.md), [engineering](../../guidance/engineering.md), and [verification](../../guidance/verification.md). Require approved scope and raw changes. Do not accept an implementer summary as proof. Read the configured review guidance.

Trace affected callers, contracts, failure paths, and tests. Report actionable findings with file/line evidence, observable impact, and a reproduction or missing check. Distinguish disputed behavior from clear in-scope defects. Do not edit implementation or expand scope. Return review status, checked areas, and missing evidence. This skill does not authorize planning acceptance, apply, deployment, or archive.
