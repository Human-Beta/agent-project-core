# Delivery workflow

Read the project scope, architecture, review guidance, and verification command in [project configuration](../project.md) before work. Announce the selected route; the owner need not name a skill.

| Request | Route | Boundary |
| --- | --- | --- |
| Feature or changed business rule | Installed OpenSpec planning integration | Present artifacts and end the planning turn; apply only after a new owner request accepts the plan. |
| Small bug with known cause and established expected behavior | Direct fix | Run proportionate regression checks. |
| Text correction | Direct edit | Check the changed text and relevant links. |
| Unclear report | Investigation | Reproduce, trace callers, and establish expected behavior before choosing implementation or planning. |
| Work covered by an active change | Matching change | Read its artifacts and use its installed apply integration; do not duplicate planning or infer acceptance from a draft. |

Planning identifies existing code, tests, callers, and concrete reuse using [engineering guidance](engineering.md). Present behavior, examples, constraints, acceptance criteria, and unresolved product decisions in language the owner can assess without reading code. Use installed OpenSpec skills for proposal, apply, updates, and archive; never modify their generated instructions to bypass acceptance. If the integration is unavailable, report it and leave that gate incomplete.

The main session coordinates scope, model selection, handoffs, corrections, and evidence. For delivery requiring independent gates, delegate bounded implementation, review, and acceptance-based QA using [implementer](../roles/implementer.md), [reviewer](../roles/reviewer.md), and [QA](../roles/qa.md) contracts. Give each role approved scope, raw artifacts, relevant project context, and verification criteria. Include the workspace root, allowed write paths (including evidence/check artifacts), and whether the role is read-only. All role outputs stay inside that workspace; if no evidence-write path is authorized, return the report inline. Do not invent a global temporary destination. Review and QA must be separate executions from implementation. Keep the implementer's conclusions out of the review handoff. If the client cannot delegate, disclose the missing independent gate; self-checks cannot satisfy it. Text-only edits need proportionate checking, not manufactured independent execution.

Correct clear in-scope findings automatically. Track unsuccessful correction cycles per unresolved gate. A cycle is a correction followed by affected checks and independent re-review. After two unsuccessful cycles, escalate to a stronger available native model or report a concrete blocker; do not start an equivalent third cycle. Disputed findings or changes to approved behavior require an owner decision first.

Use [verification guidance](verification.md) for acceptance evidence. Report the result/preview, checked scenarios, commands and outcomes, independent review/QA status, actual runtime models or a resolution limitation, and unresolved gates. Present behavior for routine owner acceptance without requiring diff inspection. Deployment requires an explicit authorizing request. Do not archive or declare acceptance before required independent gates and owner acceptance pass.
