# Design

## Context

See proposal.md for motivation and the two delta specs for acceptance behavior. The new repository contains only README.md, maintenance AGENTS.md, package.json, pnpm-lock.yaml, and openspec/config.yaml. There are no accepted specs or runtime modules to reuse here.

Discovery inspected the local README.md, AGENTS.md, openspec/config.yaml, package.json, and pinned OpenSpec CLI, together with upstream integration instructions and the official native tool documentation linked below. Planning and accepted requirements are owned by this repository. The maintenance AGENTS.md is distinct from exported project guidance.

The change crosses canonical policy, skill packaging, native adapters, and export tooling, so an explicit design is necessary.

## Goals / Non-Goals

**Goals:** Keep policy ownership clear; export portable profiles with deterministic local tooling; make adapter drift and missing behavioral evidence visible.

**Non-Goals:** No hosted orchestrator, global user configuration changes, template scaffolding, application adoption, or updater for existing projects. Repository tooling may use Node.js without requiring every target application to use Node.js.

## Decisions

### Canonical content with generated native adapters

Proposed source layout:

```text
core/
  guidance/workflow.md
  guidance/engineering.md
  guidance/verification.md
  skills/deliver-change/SKILL.md
  skills/review-change/SKILL.md
  skills/verify-change/SKILL.md
  roles/implementer.md
  roles/reviewer.md
  roles/qa.md
adapters/model-profiles.json
adapters/codex/
adapters/claude/
scripts/export-core.mjs
scripts/validate-core.mjs
tests/
evaluations/
docs/usage.md
```

Guidance owns policy; role files own responsibility and handoff contracts; skills describe their entry conditions and operational workflow through links, rather than repeating policy. References load only for the selected route. The coordinator is the main session; separate implementer/reviewer/QA roles exist where native delegation supports them. Reviewers do not receive the implementer's self-assessment as a conclusion to adopt.

Exports place shared documents and a version/configuration manifest under .agent-core/, and materialize skills at native discovery locations. Copies are generated artifacts with canonical provenance; source instructions remain maintained once. Prefer real files over cross-directory symlinks so cloning and template copying remain portable.

Alternative: separately handwritten AGENTS.md/CLAUDE.md and duplicated skills. Rejected because policy changes would require coordinated manual edits. A submodule or runtime dependency on the core checkout is unnecessary for static instructions.

### Native syntax belongs to each adapter

Codex uses AGENTS.md, .agents/skills/, and native custom-agent files under .codex/agents/. Its documented model controls support scoped agents; initial explicit defaults are gpt-6.1-sol for planning/review and gpt-6-luna for implementation/QA. The main session is selected by the user; an export cannot switch an already-running session. Overrides are configuration, not edits to canonical roles. See [Codex skills](https://learn.chatgpt.com/docs/build-skills) and [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents).

Claude uses CLAUDE.md, .claude/skills/, and .claude/agents/. Use supported local references/imports for shared guidance. Claude has an equally explicit starting profile: opus for planning/review and sonnet for implementation/QA, with native per-project overrides. OpenAI model IDs are never emitted into Claude settings. See [Claude skills](https://code.claude.com/docs/en/skills) and [Claude subagents](https://code.claude.com/docs/en/sub-agents).

Native runtime constraints, permissions, and installed-tool availability remain authoritative. No adapter grants global permissions, disables approvals, configures secrets, or claims unavailable independent execution succeeded.

### Central native model profiles and maintenance

Maintain initial role mappings in adapters/model-profiles.json, read by both adapter renderers. Canonical workflow and role instructions describe responsibilities and escalation without embedding model IDs. Guidance for choosing the main-session model and delegated model files are derived from the same mapping; export does not change an active session.

| Role | Codex default | Claude default |
| --- | --- | --- |
| Coordination/planning | gpt-6.1-sol | opus |
| Implementation/unit tests | gpt-6-luna | sonnet |
| Independent review | gpt-6.1-sol | opus |
| Acceptance-based QA | gpt-6-luna | sonnet |
| Escalated analysis | gpt-6.1-sol | opus |

These are starting policies to evaluate on completed work, not claims of equivalent capability across providers. Sonnet is the initial coding/QA choice; a project may explicitly choose haiku for simpler work or another available native model. See [Claude model configuration](https://code.claude.com/docs/en/model-config) for supported aliases and full IDs. Aliases resolve through the client/provider and can change with runtime versions or provider settings; full native IDs allow version pinning. Codex defaults use explicit IDs and change through maintained profile updates.

When a model is renamed, retired, or a new default is selected, update the central mapping and usage documentation, verify native configuration and overrides, run the affected behavioral evaluations, and publish a new core version. New exports use that version. Existing exported files do not update themselves; merging updates into templates or existing projects remains separate work. A provider-resolved alias can change its actual model even while exported files remain unchanged, so document this trade-off and let projects pin IDs when needed.

The manifest records the requested IDs/aliases and source version, not an invented resolved model. Evaluation and delivery reports record actual runtime models when observable; otherwise disclose that resolution could not be verified. Native clients may substitute an unavailable requested model according to their own rules, so do not report an exact role/model pairing as executed without evidence. No automatic model substitution logic or model catalog service is introduced by the core.

### Reuse OpenSpec-generated integrations without maintaining a fork

The delivery skill routes requests, then uses the installed OpenSpec integration for planning/apply/update/archive where appropriate. Keep generated openspec-* files separate from custom skills; never patch them to bypass their planning boundary. A substantial change ends its planning turn with reviewable artifacts and resumes apply only after a new owner request accepts the plan. Small understood fixes do not require OpenSpec.

The exporter emits custom core files only. Usage instructions show how to install the pinned CLI and initialize the selected native OpenSpec profiles in the target project; export does not execute package installation or OpenSpec initialization in another repository. Test target fixtures with the supported generated profiles and assert there are no custom skill-name collisions. Retain upstream licenses in generated material. This keeps OpenSpec upgrade ownership with its CLI rather than a vendored fork.

### Keep maintainer history out of downstream projects

The repository's openspec/specs, openspec/changes (including archive), openspec/config.yaml, and installed root-level maintainer integrations belong to developing this core. Export uses an explicit allowlist of canonical core assets and selected adapter output; it never copies the repository root or its OpenSpec history. The .openspec-target file in a maintainer integration records the upstream renderer for that skills root; it does not define the supported tool profiles of the reusable core. Leave upstream-generated markers under CLI ownership.

Stack templates assemble the core export with their scaffold, a project-appropriate OpenSpec config, and empty specs/changes/archive directories. They generate and commit the supported native OpenSpec integrations with the pinned local CLI so fresh projects can invoke them without manual init. Preserve upstream licenses and keep generated OpenSpec files separate from custom core skills. On CLI upgrades, regenerate those integrations, review the diff, and verify discovery and relevant workflow behavior. Template assembly and update automation remain separate work; this exporter does not initialize downstream repositories.

### A bounded exporter prepares new templates

Use `pnpm core:export -- --output <empty-directory> --tools codex,claude --config <project-config.json>` as the public command. Source version comes from the core package; the exported manifest records it and normalized project configuration. No timestamps or machine-specific paths affect output.

Project configuration supplies repository-relative paths for scope/architecture documents and review guidance, the verification command, and optional per-tool model overrides. Validate paths as relative and contained, reject unknown profiles and incomplete inputs before writes, and render guidance references consistently. The configured project verification command is written as guidance, never executed by export. Support commands appropriate to another stack instead of assuming pnpm verify in every application.

Validate everything in memory before creating output. Reject a nonempty destination; reject an output nested inside canonical sources; prevent path traversal/symlink escapes. If output writing fails, remove only files created by this invocation and leave preexisting directories intact. Existing repository installation and update merging are outside the initial core change.

Alternative: a general project generator or updater. Rejected because the initial core only needs to deliver its own reusable files to future stack templates.

### Verification separates structure from agent behavior

Use Node's test runner for exporter behavior with temporary directories and real files. Cover profile selection, identical output, valid overrides, invalid configuration, destination preservation, traversal, and missing references. Validate skill frontmatter and native TOML/Markdown metadata with suitable parsers; parser dependencies are development-only and justified by actual adapter formats. Wire OpenSpec validation and structural checks into pnpm verify and a GitHub Verify workflow.

Add evaluation fixtures for a feature, local bug, text correction, unclear report, active change, unused existing helper, omitted failure scenario, two failed correction cycles, and unavailable delegation. An isolated native session gets the request and raw fixture, not the expected conclusion. Record actual routes, artifacts, checks, and gates in an evidence report. Unit tests checking policy wording cannot substitute for those sessions.

Native Codex and Claude smoke runs demonstrate discovery and delegation with a harmless fixture. If either tool/account is unavailable, retain the gate as incomplete with exact instructions for running it later. Do not mark the core change complete on structural checks alone. No evaluation deploys, messages another chat, or modifies a live app.

## Risks / Trade-offs

- Instructions influence agents without guaranteeing behavior → evaluate decisions and report missing evidence; improve narrowly after observed failures.
- Native configuration changes over time → link official documentation, validate syntax, and record the client versions used for smoke runs.
- Generated copies can drift if edited downstream → record source version and provenance; automated refresh is separate follow-up work.
- Model access and alias resolution depend on the native account/provider/client → support overrides and pinned IDs, and record actual runtime models or an explicit verification limitation.
- Independent review adds overhead → keep bounded handoffs, targeted context, and at most two unsuccessful correction cycles.

## Migration Plan

Implement the core on the selected short-lived branch, verify exports in disposable fixtures, publish the implementation PR, and present behavioral evidence for acceptance. Only after those gates pass should the change be archived and accepted requirements synchronized. Keep this repository's README and change artifacts accurate; application adoption is tracked by each consuming project.

No existing project is migrated. Rollback is reverting the core PR or discarding a disposable export. Future templates choose a recorded core version in their own tasks.
