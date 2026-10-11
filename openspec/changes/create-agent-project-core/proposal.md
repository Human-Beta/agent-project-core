# Proposal

## Why

Starting another personal project currently means recreating agent instructions and verification habits. A shared core should let the owner approve behavior and inspect the running result while agents handle implementation, independent review, and verification with explicit evidence.

## What Changes

- Maintain stack-independent workflow and engineering guidance once, with thin Codex and Claude entrypoints.
- Provide reusable delivery, review, and QA skills, plus native role adapters. Codex starts with Sol for planning/review and Luna for bounded implementation/QA; Claude model selection remains separately configurable.
- Route substantial behavior changes through OpenSpec planning and human acceptance; handle understood local fixes directly with proportionate checks.
- Prioritize classical/Detroit unit tests with real collaborators, concrete reuse discovery, independent acceptance-based QA, and at most two unsuccessful correction cycles before escalation or a blocker report.
- Export a selected tool profile into an empty directory with a recorded core version and explicit project configuration. Generated adapters must not require a live checkout of this repository.
- Add structural checks and realistic workflow evaluation cases; distinguish validated files from demonstrated agent behavior.

Acceptance means both tool profiles can consume the same canonical guidance, exports are portable, and evaluations demonstrate the routing and acceptance boundaries. Installing files alone does not establish reliable autonomous execution.

Out of scope: application scaffolds; Vue/Next.js defaults; update PR automation; updating existing applications; real deployment; production credentials; changing review gates in existing applications. Application adoption and stack-specific templates are separate work.

## Capabilities

### New Capabilities

- `agent-delivery`: Request routing, planning acceptance, bounded delegated delivery, independent review/QA, and evidence-based result reporting.
- `core-distribution`: Canonical content, native tool exports, project configuration, version identity, and non-destructive portability.

### Modified Capabilities

None. This repository has no accepted capability specs or reusable core implementation yet.

## Impact

Add canonical content, tool-specific adapter sources, a small local exporter, evaluation fixtures, and repository validation/CI. Reuse the pinned OpenSpec CLI (1.14.1) from the bootstrap; use Node.js for local tooling and avoid a new orchestration service or backend. No consuming application database, runtime, or files change in this implementation.
