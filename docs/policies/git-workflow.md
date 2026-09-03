# Git workflow policy

## Base branch is `prod-release`, not `master`

GitHub reports `master` as the default branch, but `master` last received a commit on
2020-06-27 (`4da5121 fix dynamodb bug`). `prod-release` is 233 commits ahead of it and
carries every change since, up to 2023-05-06 (`ef8d6d3 Enabled authentication.`).
`deploy-stage.yml` triggers on `prod-release` and its own comment records the reason:
"master has code that is not ready for prod".

Branch from `prod-release` and open every pull request against `prod-release` until the
default branch is changed on GitHub.

## Use feature branches

Never commit feature or operational work directly to `prod-release`. Start from an
up-to-date `prod-release` and use a focused branch whose name describes the outcome.

Before editing:

```bash
git status --short --branch
git fetch --prune
```

If the current checkout is clean, create the branch normally. If it contains changes
you did not create, do not move or destroy them. Create a separate worktree instead:

```bash
git worktree add ../aws-widgets-<feature> -b <feature-branch> prod-release
```

Replace both placeholders with narrow, explicit names. Never use a broad directory,
an unresolved variable, or an existing worktree path as the target.

## Preserve other sessions

Do not use `git reset --hard`, `git checkout --`, `git restore`, `git clean`, or
`git stash` on changes that may belong to another session. Inspect the diff and work
around it or move your own work to a new worktree.

Only the assigned owner edits a shared package manifest, lockfile, workflow, or other
exclusive file. Integrators stage and commit shared-checkout work by scoped path; a
worker must not revert another worker's edits.

## The `codex/forge-conversion` branch branches from `prod-release`

Measure ancestry against `prod-release`, never against `master`:

```bash
git merge-base prod-release codex/forge-conversion   # ef8d6d3 — the prod-release tip
git merge-base --is-ancestor prod-release codex/forge-conversion   # exit 0
git rev-list --count prod-release..codex/forge-conversion          # 16
git merge-base master codex/forge-conversion         # nothing — different root commit
```

`prod-release` is the exact merge base, so the branch is `prod-release` plus 16
commits and merges by fast-forward while `prod-release` stays at `ef8d6d3`. The empty
result against `master` reflects `master`'s separate root (`e38e548`), not the state
of the Forge work.

Merging it is still a separate authorization: it lands a second toolchain and a Forge
app identity. It is not, however, a history-repair problem, and
`--allow-unrelated-histories` is the wrong tool for it.

Once any other commit lands on `prod-release` the fast-forward disappears and the
merge becomes an ordinary three-way merge.

## Validate and submit

Run the repository contract before opening a pull request:

```bash
yarn validate
git diff --check
```

Describe actual evidence in the pull request. A process-only change reports UI
validation as `SKIPPED — no runtime change`; a unit-test pass is not a UI pass.

Merging, release publication, production deployment, and Marketplace descriptor
changes are separate authorization boundaries. Creating a pull request does not
authorize any of them.

## What the platform enforces

Configured 2026-09-03. These are real GitHub settings, not conventions:

- `prod-release` requires the `Build and Unit Test` check and a pull request. Force
  pushes and deletions are blocked; conversation resolution is required.
- The `production` environment requires a reviewer approval and accepts only
  `release-*` tags.
- The `Protect release tags` ruleset blocks deletion and non-fast-forward on
  `refs/tags/release-*`.

`enforce_admins` is `false` and the required approval count is `0`, because this
repository has one maintainer who is an administrator and cannot approve their own
pull request. The reasoning is recorded in
[the port register](../ops/pipeline-port-status.md).

The required check name must match exactly. Do not add a `strategy.matrix` to the
`build` job — a matrix renders the check as `Build and Unit Test (10.x)` and the
protection rule stops matching.

## Release tags

Production deploys fire on a pushed tag matching `release-*` (`deploy-prod.yml`),
which runs `Build and Unit Test` and then waits for the `production` environment
approval. Existing tags are `release-20200612122734`, `release-20230506`,
`release-20230506-2`. Tag creation is a production action and is never performed by
branch work.
