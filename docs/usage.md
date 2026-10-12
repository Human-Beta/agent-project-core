# Using the core

Custom skill invocations: `$deliver-change Fix the known boundary bug` in Codex or `/deliver-change Fix the known boundary bug` in Claude; `$review-change` or `/review-change` for independent review; `$verify-change` or `/verify-change` for acceptance QA. Natural requests are routed by the delivery workflow without requiring skill names.

Substantial new behavior ends in planning artifacts. Resume implementation only with a new owner request accepting the plan. Generated OpenSpec integrations own proposal/apply/update/archive operations; custom delivery skills do not bypass them.

## Export into clean staging

Use Node.js 24 and pnpm 11 in the core checkout:

```sh
pnpm install --frozen-lockfile
pnpm core:export -- --output /absolute/clean-staging --tools codex,claude --config docs/project-config.example.json
```

Select `codex`, `claude`, or `codex,claude`. Configuration requires `scope`, `architecture`, `reviewGuidance`, and `verificationCommand`; see [example](project-config.example.json). Paths are contained repository-relative file paths for documents that the consuming template/project supplies before delivery. Export validates syntax and records these paths; it does not copy project documents or run the verification command. Installation validation must check those documents and their containment in the assembled project. The command can be `make check`, `cargo test`, or a project-appropriate command.

Optional `models.codex` and `models.claude` override `coordinator`, `implementer`, `reviewer`, `qa`, or `escalation`. Unknown fields and cross-provider model IDs fail. Output must be new or empty, outside this checkout, with no symlink ancestors or traversal. A failed export removes only invocation-owned files/directories. Existing repository installation/update merging is outside this version.

The exporter emits real files: shared guidance, role contracts, project context, and manifest under `.agent-core/`; Codex `AGENTS.md`, `.agents/skills/`, and `.codex/agents/`; Claude `CLAUDE.md`, `.claude/skills/`, and `.claude/agents/`. It excludes core OpenSpec history/configuration, installed maintainer integrations, and upstream target markers. Generated files carry canonical provenance in the manifest. Regenerate rather than maintaining policy copies.

## Native models and prerequisites

[Central profiles](../adapters/model-profiles.json) own all requested defaults. Codex requests `gpt-6.1-sol` for coordination/review/escalation and `gpt-6-luna` for implementation/QA. Claude requests `opus` and `sonnet` for those corresponding roles. Entrypoint recommendations and native role metadata derive from that mapping. Select the main-session model in the client; export cannot switch a running session.

Use clients supporting project skills and custom agents. Codex agent TOML uses `name`, `description`, `model`, and `developer_instructions`; Claude agent Markdown uses native YAML metadata. See [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [Codex skills](https://learn.chatgpt.com/docs/build-skills), [Claude subagents](https://code.claude.com/docs/en/sub-agents), and [Claude skills](https://code.claude.com/docs/en/skills). Account access, project trust, provider settings, and permissions remain authoritative; generated files do not grant permissions or install clients.

Codex defaults are explicit IDs; Claude aliases resolve through the provider/client and may change even if files do not. Projects can pin full native IDs. Native override precedence and provider substitution depend on the client version; record the actual runtime model when observable, otherwise disclose resolution limits. Manifest `requestedModels` records configuration; `runtimeModels: null` deliberately makes no execution claim.

For a changed/retired default: update the central mapping, check rendered metadata and overrides, rerun affected native behavioral evaluations, and publish a new core version with evidence. Existing exports retain their recorded settings until explicitly updated; automatic update PRs are deferred.

## Pinned OpenSpec integrations

The exporter emits custom files only. In the consuming project, add the pinned CLI using its package-management conventions; for a pnpm project:

```sh
pnpm add -D -E @fission-ai/openspec@1.14.1
pnpm exec openspec init --tools codex --profile core --no-animation
# Or: --tools claude, or --tools codex,claude
```

Run init only when explicitly setting up a project. `--profile core` generates the upstream core workflow; this repository's broader maintainer skill set is not distributable core content. Generated `openspec-*` skills and `.openspec-target` stay CLI-owned. Retain upstream license metadata. Custom `deliver-change`, `review-change`, and `verify-change` have distinct names and reference canonical policy. Never hand-edit generated OpenSpec instructions or target markers.

On pinned CLI upgrades, update the pin, regenerate with `pnpm exec openspec update --force` in the prepared template, review generated diffs and retained licenses, and verify discovery plus planning/apply boundaries. Test setup fixtures with the same pinned CLI; unchanged init inputs must not patch generated skill content.

The follow-up stack-template repository owns a repeatable build script: export into clean staging, add its scaffold and project documents/configuration, initialize selected native integrations with the pinned CLI, then validate native discovery and empty project OpenSpec history before committing. A separate `init-openspec.sh` is optional. Mark the ready stack repository as a GitHub template. **Use this template** copies its prepared files into an independent repository; it does not fetch or filter this core at creation time. Template assembly and updater automation remain separate work.

## Validation

`pnpm verify` checks canonical references, parsed native metadata, actual exporter fixtures, pinned OpenSpec setup, and current/archived OpenSpec artifacts. These checks establish structure and export behavior, not autonomous agent behavior.

After staging, run `node scripts/validate-core.mjs --export /absolute/clean-staging`. After the consuming template supplies project documents, add `--project-documents` to verify they exist and do not escape through symlinks. Missing references identify both the referencing file and missing target. See [evaluation procedure](../evaluations/README.md) for the separate native execution gate.

## Demonstrated behavior and remaining acceptance

See [final native evidence](../evaluations/evidence/2026-10-13.md) for all nine cases and smoke checks on both profiles, including corrected handoff/cycle behavior and requested-versus-observed model settings. Codex resolved model IDs and automatic selection of named TOML layers are unobservable through the evaluated interface. Claude role IDs are captured from native response events. Fixture smoke review is not independent review of the implementation PR; owner acceptance and that PR review remain required before archive.
