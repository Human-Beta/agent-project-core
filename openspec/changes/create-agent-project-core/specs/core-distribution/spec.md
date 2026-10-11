# Core distribution

## Purpose

Distribute one maintained source of stack-independent agent guidance through portable native tool profiles for future project templates.

## ADDED Requirements

### Requirement: Maintain one canonical source
The core SHALL maintain shared workflow, engineering guidance, role responsibilities, and reusable skill instructions in one canonical source. Native adapters SHALL contain only tool-specific integration and references or generated content, with a documented source for regeneration.

#### Scenario: Shared policy change
- **WHEN** a shared policy changes and profiles are regenerated
- **THEN** Codex and Claude receive the same revised policy without manually editing two policy copies

### Requirement: Export selected native profiles
The exporter SHALL support Codex, Claude, or both profiles. Each export SHALL include discoverable native entrypoints, skills, role definitions, referenced guidance, and a core version marker. An exported profile SHALL remain usable without access to the source checkout.

#### Scenario: Both tools in a new project
- **WHEN** both profiles are exported and the source checkout is unavailable
- **THEN** all exported guidance references resolve locally and both tools have their native entrypoints and skills

#### Scenario: Single profile
- **WHEN** only Codex is selected
- **THEN** the output includes the shared guidance and Codex adapter without requiring Claude configuration

### Requirement: Respect project configuration
Exports SHALL accept explicit project paths, verification commands, and optional native model overrides. Shared defaults SHALL contain no application-specific stack, product, deployment, or credential assumptions. Missing required configuration and unsupported profiles SHALL be rejected with actionable errors before output is written.

#### Scenario: Two different stacks
- **WHEN** a Node application and a non-Node application provide different verification commands
- **THEN** each export uses its configured command without changing the canonical workflow or imposing the other application's stack

#### Scenario: Invalid configuration
- **WHEN** a required project document path or verification command is absent
- **THEN** export fails before writing output and identifies the missing input

### Requirement: Preserve destinations and produce reproducible exports
Export SHALL write only into a new or empty output directory, reject a nonempty destination without changing it, and produce the same file content for the same source version, configuration, and selected profiles. Recorded identity SHALL distinguish the core source version from tool/model settings.

#### Scenario: Existing project
- **WHEN** the destination already contains project files
- **THEN** export fails and those files remain unchanged

#### Scenario: Repeatable assembly
- **WHEN** identical inputs are exported into two empty directories
- **THEN** their file sets and contents match without machine-specific absolute paths

### Requirement: Validate structure and demonstrate workflow separately
Repository checks SHALL validate exported paths, skill metadata, native adapter structure, and OpenSpec artifacts. Behavioral evaluation SHALL use realistic requests against isolated fixtures and record observed decisions. Structural checks alone SHALL not be reported as proof of correct routing, independent review, or QA behavior.

#### Scenario: Broken reference
- **WHEN** exported guidance refers to a missing file
- **THEN** verification fails with the referencing and missing paths

#### Scenario: Runtime not available
- **WHEN** native Claude execution is unavailable during evaluation
- **THEN** the report distinguishes structurally validated Claude files from the unexecuted native workflow and leaves that acceptance evidence incomplete
