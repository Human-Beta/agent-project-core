# agent-project-core

A reusable, stack-independent foundation for AI-assisted development across projects.

Version 0.1.0 provides shared delivery, engineering, and verification guidance; bounded implementer/reviewer/QA contracts; custom skills; native Codex/Claude adapter sources; and a deterministic exporter for clean template staging.

## Status

The initial 0.1.0 change was accepted and archived on 2026-10-28 following the owner's archive request. All 14 implementation tasks are complete; independent PR review confirmed both reported defects were corrected, and verification passes 23 tests on macOS. Both native profiles completed all nine workflow cases plus discovery/delegation smoke checks. Explicit client/model visibility limits remain documented.

See [usage](docs/usage.md), [native evidence](evaluations/evidence/2026-10-13.md), [evaluation procedure](evaluations/README.md), and [follow-up PR review](https://github.com/Human-Beta/agent-project-core/pull/3#pullrequestreview-5660487632). Accepted behavior is maintained in the [agent-delivery specification](openspec/specs/agent-delivery/spec.md) and [core-distribution specification](openspec/specs/core-distribution/spec.md). The [implementation checklist](openspec/changes/archive/2026-10-28-create-agent-project-core/tasks.md), [proposal](openspec/changes/archive/2026-10-28-create-agent-project-core/proposal.md), and [design](openspec/changes/archive/2026-10-28-create-agent-project-core/design.md) are preserved as historical change artifacts.

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
