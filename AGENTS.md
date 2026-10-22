# Agent rules

- **Commit after each finished change.** Once a piece of work is done and checked, commit it with a short message.
- **Push goes with the commit.** The husky `post-commit` hook in `.husky/post-commit` runs `git push` on its own. If the hook didn't run, push by hand.
- **Run the app** with `pnpm exec next dev`. The `dev` script calls the Windows `start` command and fails on macOS.
- **Auth is off by default.** Set `NEXT_PUBLIC_AUTH_ENABLED=true` to turn on sign-in and tiers. While it's off, everyone gets the Composer tier.
