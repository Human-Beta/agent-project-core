# Agent delivery

## Purpose

Let a project owner approve expected behavior and accept a verified result while agents perform bounded implementation, independent review, and QA.

## ADDED Requirements

### Requirement: Route requests by behavior and uncertainty
The workflow SHALL route substantial behavior changes to OpenSpec planning, understood local fixes to direct work, unclear reports to investigation, and work covered by an active change to that change. It SHALL announce the route without requiring the owner to name a skill.

#### Scenario: New behavior
- **WHEN** a request introduces a feature or changes business rules
- **THEN** the agent prepares planning artifacts and waits for the owner's acceptance before implementation

#### Scenario: Understood local fix
- **WHEN** a small bug has an established expected behavior and an understood cause
- **THEN** the agent fixes it directly and runs proportionate regression checks

#### Scenario: Unclear or already planned work
- **WHEN** the report lacks an understood cause or matches an active change
- **THEN** the agent investigates the unclear cause or continues the matching change without creating a duplicate plan

### Requirement: Ground planning in the existing project
Planning SHALL identify affected existing code, tests, callers, and concrete reuse before choosing abstractions. It SHALL present behavior, examples, constraints, acceptance criteria, and material unresolved decisions in language the owner can review without reading code.

#### Scenario: Existing reusable behavior
- **WHEN** the project already contains a relevant helper or component
- **THEN** the plan identifies its location and explains reuse or the concrete reason for a replacement

### Requirement: Delegate bounded work with truthful role reporting
Delivery SHALL separate coordination/planning, implementation, independent review, and acceptance-based QA. Delegated work SHALL receive the approved scope, relevant context, and verification criteria. If independent execution is unavailable, the agent SHALL disclose the missing gate rather than report self-review as independent review.

#### Scenario: Independent reviewer
- **WHEN** implementation is ready for review
- **THEN** a separate reviewer receives requirements and the changed work without the implementer's conclusions being presented as evidence

#### Scenario: Delegation unavailable
- **WHEN** the client cannot execute a required independent role
- **THEN** the agent reports that limitation and leaves the independent gate unfulfilled

### Requirement: Prefer classical unit tests and acceptance-based QA
The workflow SHALL prioritize business-rule tests using real collaborators and minimal boundary doubles. QA SHALL derive checks from acceptance criteria and observable behavior. Integration or browser checks SHALL cover behavior requiring those runtime boundaries rather than replace unit tests unnecessarily.

#### Scenario: Business rule and persistence boundary
- **WHEN** a change includes a pure eligibility rule and a database uniqueness constraint
- **THEN** verification tests the rule without a database and separately verifies the real database constraint

#### Scenario: Insufficient implementation tests
- **WHEN** existing tests mirror the implementation but omit a required failure scenario
- **THEN** QA identifies that uncovered acceptance scenario and obtains evidence before claiming completion

### Requirement: Bound automatic correction
The workflow SHALL automatically correct clear in-scope findings and repeat affected checks and review. After two unsuccessful correction cycles, it SHALL escalate to a stronger available model or report a concrete blocker. Material scope changes and disputed findings SHALL return to the owner for a decision.

#### Scenario: Repeated failure
- **WHEN** the same delivery gate remains unresolved after two correction cycles
- **THEN** the coordinator escalates or reports the blocker without silently starting another equivalent cycle

#### Scenario: Product decision
- **WHEN** resolving a finding would change approved behavior
- **THEN** the agent presents the decision to the owner before making that change

### Requirement: Report evidence for product acceptance
The final delivery report SHALL identify the result or preview, checked acceptance scenarios, commands and outcomes, review/QA status, and unresolved limitations. Routine owner acceptance SHALL not require code diff inspection. Missing checks SHALL remain explicitly incomplete; deployment SHALL require a request authorizing that action.

#### Scenario: Checks not run
- **WHEN** a required browser scenario cannot be executed
- **THEN** the report identifies that scenario as unverified and does not claim all acceptance criteria passed

#### Scenario: Ready result without release request
- **WHEN** implementation and review pass but the owner has not requested deployment
- **THEN** the agent presents the result for acceptance without initiating a production release
