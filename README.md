# agent-project-core

Shared agent guidance and tool adapters for personal projects.

WF-02 is in planning. This bootstrap provides a pinned OpenSpec CLI; the reusable core is not implemented yet.

The agreed scope comes from [Movie Match workflow roadmap](https://github.com/Human-Beta/movie-match/blob/main/docs/workflow-roadmap.md). Stack templates, update automation, and Movie Match adoption are separate follow-up tasks.

## Development

Use Node.js 24 and pnpm 11. Run `pnpm install --frozen-lockfile`, then `pnpm exec openspec` for CLI commands and `pnpm verify` for artifact validation.

Write permanent documentation and planning artifacts in English. Keep new work on short-lived branches and publish verified batches through pull requests to `main`. Do not treat a proposal as implemented behavior.
