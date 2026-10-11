# Core repository maintenance

Read README.md and the selected OpenSpec change before work. The WF-02 scope comes from the linked Movie Match roadmap; other WF tasks remain separate.

Write permanent documentation, artifacts, identifiers, and commits in English. Use `pnpm exec openspec` with the pinned local CLI. Keep planning and implementation separate; proposals do not define shipped behavior before acceptance.

Use short-lived branches targeting `main`. Run `pnpm verify` and checks relevant to the changed files, commit only intended files, then push and create/update a PR. Use `[WF-02]` for task commits or `[chore]` for bootstrap maintenance. Do not commit secrets, local environment files, or disposable exports.

These are repository maintenance instructions, not the reusable guidance proposed by WF-02.
