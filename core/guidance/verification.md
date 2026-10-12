# Verification and acceptance

Derive QA checks independently from approved acceptance criteria and observable behavior. Map every criterion to evidence or an explicitly incomplete gate. Inspect implementation tests for omitted failure scenarios; a passing suite is insufficient if it only mirrors the implementation. Obtain evidence for omitted scenarios before claiming completion.

Run the configured project verification command and checks relevant to changed behavior. Capture exact commands, outcomes, environment/runtime boundaries, and evidence paths. Use real boundary checks where required. If a required browser, database, account, model, or delegation capability is missing, identify the unverified scenario and leave its gate incomplete.

Review receives approved requirements and raw changes, tests, and logs without implementation conclusions. QA independently derives acceptance checks; neither role accepts a claim because the implementer reported success. Record who executed each role and the requested model separately from the observed runtime model. If the runtime cannot expose resolution, state that limitation.

A delivery report includes:

- Result or local preview the owner can inspect.
- Acceptance scenarios checked and their evidence.
- Commands and outcomes, including failed or unexecuted checks.
- Independent review and QA status with execution identity.
- Requested and observed models, or an explicit resolution limitation.
- Unresolved decisions, missing gates, and the next concrete action.

Structural file validation and policy text tests do not demonstrate native routing, independent review, or acceptance-based QA. Keep those evidence categories separate. Owner acceptance follows the report; deployment follows an explicit authorizing request.

Use the native tool success/failure status and raw output when available. If a literal numeric shell exit code is not exposed, disclose that metadata limitation; do not repeatedly rerun a passing check solely to obtain it or add compound wrappers that require unrelated permissions.
