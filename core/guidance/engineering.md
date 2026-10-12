# Engineering and reuse

Before selecting abstractions, inspect relevant existing code, tests, callers, and dependencies. Name the concrete helper/component and its location. Reuse it when it fits; explain a replacement using a specific missing capability or incompatible contract. Avoid speculative frameworks and unnecessary application architecture changes.

Keep changes within approved behavior. Separate pure business rules from runtime boundaries where the existing design allows it. Prefer classical/Detroit unit tests: exercise observable rules using real in-process collaborators, with minimal doubles only at external boundaries. Do not mock every collaborator or assert implementation call sequences as a substitute for behavior.

For an eligibility rule plus a database uniqueness constraint, test the rule without a database, then verify uniqueness against the real database in a targeted integration check. Browser and integration checks cover behavior that needs those boundaries. They do not replace useful unit tests. Text-only and reversible low-impact edits need proportionate checks rather than tests that mirror the edit.

Discover project conventions from configured documents. The core does not choose an application stack, package manager, deployment workflow, credentials, or product policy. Stop and report when implementation requires a material scope decision.
