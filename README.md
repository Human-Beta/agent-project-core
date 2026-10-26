# agent-project-core

A reusable, stack-independent foundation for AI-assisted development across projects.

Version 0.1.0 provides shared delivery, engineering, and verification guidance; bounded implementer/reviewer/QA contracts; custom skills; native Codex/Claude adapter sources; and a deterministic exporter for clean template staging.

## Status

Structural validation, exporter tests, and all nine native workflow cases plus discovery/delegation smoke checks are complete for both profiles. Native access was repaired by selecting the newer bundled Codex client and renewing Claude's OAuth login. Explicit client/model visibility limits remain documented. The 14-task implementation checklist is complete. Independent PR review identified source-path case alias and Claude metadata validation defects; both have regression coverage and corrections awaiting reviewer confirmation. Final owner acceptance remains pending, so the change is not accepted or archived.

See [usage](docs/usage.md), [latest evidence](evaluations/evidence/2026-10-13.md), [evaluation procedure](evaluations/README.md), and the [implementation checklist](openspec/changes/create-agent-project-core/tasks.md). The [proposal](openspec/changes/create-agent-project-core/proposal.md), [design](openspec/changes/create-agent-project-core/design.md), and [acceptance scenarios](openspec/changes/create-agent-project-core/specs/) remain planning sources until acceptance.

## Export

```sh
pnpm install --frozen-lockfile
pnpm core:export -- --output /absolute/clean-staging --tools codex,claude --config docs/project-config.example.json
```

Select either tool or both. Provide project documents and a verification command through explicit configuration; override native role models when needed. Export records requested settings and never claims runtime resolution. Output must be new or empty and outside this checkout. See [usage](docs/usage.md) for assembly validation and native prerequisites.

## Distribution boundary

This repository maintains the core; it is not a project template to copy wholesale. Export allowlists canonical core assets and selected adapters. Core OpenSpec history/configuration and installed maintainer integrations stay here.

Stack-template repositories assemble the export with their scaffold and project configuration, then generate their own integrations with the pinned OpenSpec CLI. New projects receive project-appropriate configuration and empty specs/change history. Preserve upstream licenses and CLI-owned target markers. Template assembly, automatic update PRs, existing-application adoption, and real deployment are separate work.

## Development

Use Node.js 24 and pnpm 11. Run `pnpm install --frozen-lockfile`, use `pnpm exec openspec` for CLI commands, and run `pnpm verify` for canonical references, native metadata, real-file exporter tests, OpenSpec setup fixtures, and current/archived artifact validation. Native behavioral evaluations remain a separate gate.

Write permanent artifacts in English. Keep work on short-lived branches and publish verified batches through pull requests to `main`. Do not treat planning or structural checks as accepted native behavior.
