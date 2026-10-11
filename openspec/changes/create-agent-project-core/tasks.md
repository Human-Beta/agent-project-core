# Tasks

## 1. Canonical guidance and reusable skills

- [ ] 1.1 Add focused workflow, engineering, and verification guidance covering routing, reuse discovery, classical unit tests, independence, bounded fixes, and acceptance reports; verify each agent-delivery requirement has an identified owner and no application-specific stack policy is imported.
- [ ] 1.2 Add deliver-change, review-change, and verify-change skills with narrow descriptions, discoverable policy references, and explicit planning/apply boundaries; validate frontmatter and references, and document invocation examples beside the usage instructions.
- [ ] 1.3 Add canonical implementer, reviewer, and QA role contracts with bounded handoffs and missing-capability reporting; inspect realistic handoff fixtures to verify reviewers receive requirements and raw artifacts without the implementer's conclusions.

## 2. Native tool adapters

- [ ] 2.1 Add Codex entrypoint, skill materialization, and native role templates with configured Sol/Luna defaults and model overrides; parse generated configuration, check local references, and document main-session selection plus client prerequisites.
- [ ] 2.2 Add equivalent Claude entrypoint, skills, and native agents with independent model overrides and default inheritance; validate generated native metadata and verify no OpenAI model IDs leak into Claude configuration.
- [ ] 2.3 Document pinned OpenSpec setup for both target profiles and generated/custom file ownership; run those setup commands in isolated fixtures and verify discoverable skills have no naming collisions and generated files remain unmodified.

## 3. Export and structural verification

- [ ] 3.1 Implement validated project configuration and the bounded exporter with usage examples; test actual files for Codex-only, Claude-only, combined output, project-specific commands, overrides, and independence from the source checkout.
- [ ] 3.2 Add rejection and reproducibility coverage alongside the exporter: test missing/invalid input, unsupported profiles, path traversal/symlink escapes, nonempty destination preservation, failure cleanup, and byte-identical output for identical inputs.
- [ ] 3.3 Set the initial core source version to 0.1.0, record source/configuration identity in exported manifests, and add structural validation plus CI to pnpm verify; verify missing references fail with actionable paths and a frozen-lockfile checkout passes the documented commands.

## 4. Behavioral evidence and cross-tool acceptance

- [ ] 4.1 Add isolated request/fixture cases for all routing paths, concrete reuse, an omitted failure scenario, failed correction cycles, and unavailable delegation; document the evaluation procedure and check fixtures do not reveal expected conclusions to the evaluating session.
- [ ] 4.2 Run native Codex evaluation and harmless discovery/delegation smoke checks; record client version, observed routes, artifacts, checks, review/QA independence, and acceptance boundaries, correcting guidance only for demonstrated failures.
- [ ] 4.3 Run equivalent native Claude evaluation and smoke checks and record its actual model settings; verify both profiles follow the shared behavior, leaving this task incomplete if native access is unavailable rather than substituting structural validation.
- [ ] 4.4 Run pnpm verify and review the complete export/evaluation evidence against both capability specs; confirm README/usage accurately describe demonstrated behavior, incomplete gates, and deferred work.

## Workflow follow-up

- Publish verified implementation changes through a PR to main and complete independent review and owner acceptance using the delivered evidence.
- Keep this repository's documentation and change status accurate; consuming projects track their own adoption.
- Archive only after implementation, required checks, independent gates, and acceptance pass; synchronize the accepted capability specs and validate archived completion.
