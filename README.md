# agent-project-core

A reusable, stack-independent foundation for AI-assisted development across projects.

The core will provide shared agent rules, a change delivery workflow, reusable skills, and native adapters for Codex and Claude. Stack-specific project templates can include a versioned copy of the core and supply their own architecture, verification, and deployment settings.

## Status

The initial core is in planning. The repository currently provides a pinned OpenSpec CLI; the reusable guidance, adapters, and exporter are not implemented yet.

See the [proposal](openspec/changes/create-agent-project-core/proposal.md), [design](openspec/changes/create-agent-project-core/design.md), [acceptance scenarios](openspec/changes/create-agent-project-core/specs/), and [implementation checklist](openspec/changes/create-agent-project-core/tasks.md).

## Distribution boundary

This repository maintains the core; it is not a project template to copy wholesale. Its OpenSpec specs, changes, and archives describe development of the core itself. The installed OpenSpec skills and target markers are maintainer tool integrations.

Future templates include an explicit core export and generate their own OpenSpec integrations with the pinned CLI for each supported tool. New projects start with project-appropriate OpenSpec configuration and empty specs/change history. Upstream-generated skills are regenerated and verified on upgrades, rather than edited manually.

## Development

Use Node.js 24 and pnpm 11. Run `pnpm install --frozen-lockfile`, then `pnpm exec openspec` for CLI commands and `pnpm verify` for artifact validation.

Write permanent documentation and planning artifacts in English. Keep new work on short-lived branches and publish verified batches through pull requests to `main`. Do not treat a proposal as implemented behavior.
