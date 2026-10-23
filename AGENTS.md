# Agent rules

- **Commit after each finished change.** Once a piece of work is done and checked, commit it with a short message.
- **Push goes with the commit.** The husky `post-commit` hook in `.husky/post-commit` runs `git push` on its own. If the hook didn't run, push by hand.
- **Prettier formats the code.** Run `pnpm format` before you commit. The husky `pre-commit` hook formats staged files on its own, and CI fails on unformatted code.
- **Run the app** with `pnpm exec next dev`. The `dev` script calls the Windows `start` command and fails on macOS.
- **Auth is off by default.** Set `NEXT_PUBLIC_AUTH_ENABLED=true` to turn on sign-in and tiers. While it's off, everyone gets the Composer tier.
- **Dependencies update on their own.** Dependabot opens PRs weekly, and the `automerge` job in `.github/workflows/ci.yml` merges them once the build passes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
