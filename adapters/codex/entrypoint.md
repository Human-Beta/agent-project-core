# Project agent guidance

Generated from agent-project-core {{version}}. Regenerate with the core exporter; canonical policy lives in .agent-core/.

Read [project configuration](.agent-core/project.md) and [workflow](.agent-core/guidance/workflow.md). Load engineering and verification guidance as the selected route needs them. Use the native deliver-change, review-change, and verify-change skills.

Select {{coordinator}} for the main coordination/planning session and {{escalation}} for escalated analysis when available. Export cannot change a running session. Native custom agents core-implementer, core-reviewer, and core-qa use the requested settings recorded in [manifest](.agent-core/manifest.json). Report actual runtime models or an explicit resolution limitation; configuration is not execution evidence.

Use bounded native delegation when an independent gate is required. Respect client permissions and installed capabilities; missing independent execution stays incomplete.
