# Core repository maintenance

Read README.md, the selected OpenSpec change, and relevant accepted specs before work. This repository owns the shared agent core; project-specific stack templates, application configuration, and deployment workflows belong in their respective repositories.

Write permanent documentation, artifacts, identifiers, and commits in English. Use `pnpm exec openspec` with the pinned local CLI. Keep planning and implementation separate; proposals do not define shipped behavior before acceptance.

Use short-lived branches targeting `main`. Run `pnpm verify` and checks relevant to the changed files, commit only intended files, then push and create/update a PR. Use `[<change-name>]` for change implementation commits or `[chore]` for maintenance. Do not commit secrets, local environment files, or disposable exports.

These are repository maintenance instructions. The reusable guidance and native adapters have their own canonical sources once implemented.
