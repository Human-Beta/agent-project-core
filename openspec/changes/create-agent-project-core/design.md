# Design

## Context

See proposal.md for motivation and the two delta specs for acceptance behavior. The new repository contains only README.md, maintenance AGENTS.md, package.json, pnpm-lock.yaml, and openspec/config.yaml. There are no accepted specs or runtime modules to reuse here.

Discovery used Movie Match's docs/workflow-roadmap.md, docs/openspec.md, openspec/config.yaml, package.json, and generated .agents/skills/openspec-* instructions. Reuse its pinned CLI and artifact ownership pattern, not its application architecture or human-diff gate. The maintenance AGENTS.md in this repository is distinct from exported project guidance.

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

Codex uses AGENTS.md, .agents/skills/, and native custom-agent files under .codex/agents/. Its documented model controls support scoped agents; initial explicit defaults are gpt-6.1-sol for review and gpt-6-luna for implementation/QA. The main session is selected by the user; an export cannot switch an already-running session. Overrides are configuration, not edits to canonical roles. See [Codex skills](https://learn.chatgpt.com/docs/build-skills) and [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents).

Claude uses CLAUDE.md, .claude/skills/, and .claude/agents/. Use supported local references/imports for shared guidance. Claude model settings are independent: default to inherit until the owner provides native overrides; OpenAI model IDs are never emitted into Claude settings. See [Claude skills](https://code.claude.com/docs/en/skills) and [Claude subagents](https://code.claude.com/docs/en/sub-agents).

Native runtime constraints, permissions, and installed-tool availability remain authoritative. No adapter grants global permissions, disables approvals, configures secrets, or claims unavailable independent execution succeeded.

### Reuse OpenSpec-generated integrations without maintaining a fork

The delivery skill routes requests, then uses the installed OpenSpec integration for planning/apply/update/archive where appropriate. Keep generated openspec-* files separate from custom skills; never patch them to bypass their planning boundary. A substantial change ends its planning turn with reviewable artifacts and resumes apply only after a new owner request accepts the plan. Small understood fixes do not require OpenSpec.

The exporter emits custom core files only. Usage instructions show how to install the pinned CLI and initialize the selected native OpenSpec profiles in the target project; export does not execute package installation or OpenSpec initialization in another repository. Test target fixtures with the supported generated profiles and assert there are no custom skill-name collisions. Retain upstream licenses in generated material. This keeps OpenSpec upgrade ownership with its CLI rather than a vendored fork.

### A bounded exporter prepares new templates

Use `pnpm core:export -- --output <empty-directory> --tools codex,claude --config <project-config.json>` as the public command. Source version comes from the core package; the exported manifest records it and normalized project configuration. No timestamps or machine-specific paths affect output.

Project configuration supplies repository-relative paths for scope/architecture documents and review guidance, the verification command, and optional per-tool model overrides. Validate paths as relative and contained, reject unknown profiles and incomplete inputs before writes, and render guidance references consistently. The configured project verification command is written as guidance, never executed by export. Support commands appropriate to another stack instead of assuming pnpm verify in every application.

Validate everything in memory before creating output. Reject a nonempty destination; reject an output nested inside canonical sources; prevent path traversal/symlink escapes. If output writing fails, remove only files created by this invocation and leave preexisting directories intact. Existing repository installation and update merging are deferred to WF-05.

Alternative: a general project generator or updater. Rejected because WF-02 only needs to deliver its own reusable files to future stack templates.

### Verification separates structure from agent behavior

Use Node's test runner for exporter behavior with temporary directories and real files. Cover profile selection, identical output, valid overrides, invalid configuration, destination preservation, traversal, and missing references. Validate skill frontmatter and native TOML/Markdown metadata with suitable parsers; parser dependencies are development-only and justified by actual adapter formats. Wire OpenSpec validation and structural checks into pnpm verify and a GitHub Verify workflow.

Add evaluation fixtures for a feature, local bug, text correction, unclear report, active change, unused existing helper, omitted failure scenario, two failed correction cycles, and unavailable delegation. An isolated native session gets the request and raw fixture, not the expected conclusion. Record actual routes, artifacts, checks, and gates in an evidence report. Unit tests checking policy wording cannot substitute for those sessions.

Native Codex and Claude smoke runs demonstrate discovery and delegation with a harmless fixture. If either tool/account is unavailable, retain the gate as incomplete with exact instructions for running it later. Do not mark WF-02 complete on structural checks alone. No evaluation deploys, messages another chat, or modifies a live app.

## Risks / Trade-offs

- Instructions influence agents without guaranteeing behavior → evaluate decisions and report missing evidence; improve narrowly after observed failures.
- Native configuration changes over time → link official documentation, validate syntax, and record the client versions used for smoke runs.
- Generated copies can drift if edited downstream → record source version and provenance; automated refresh remains WF-05.
- Default Claude inheritance may cost more than a bounded model → document native overrides without guessing the owner's work account availability.
- Independent review adds overhead → keep bounded handoffs, targeted context, and at most two unsuccessful correction cycles.

## Migration Plan

Implement the core on the selected short-lived branch, verify exports in disposable fixtures, publish the implementation PR, and present behavioral evidence for acceptance. Only after those gates pass should the change be archived and accepted requirements synchronized. Update the Movie Match roadmap with the owning artifact/PR link; do not change Movie Match's operative agent workflow here.

No existing project is migrated. Rollback is reverting the core PR or discarding a disposable export. Future templates choose a recorded core version in their own tasks.
