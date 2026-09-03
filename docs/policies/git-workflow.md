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

## The `codex/forge-conversion` branch is not mergeable by fast-forward

`git merge-base master codex/forge-conversion` returns nothing. The two histories have
different root commits (`e38e548` on `master`, `b253e54` on the branch), so the 249
commits on `codex/forge-conversion` share no ancestor with the tracked tree. Any
integration needs `--allow-unrelated-histories` and a separate authorization. Do not
merge it as part of ordinary branch work.

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

## Release tags

Production deploys fire on a pushed tag matching `release-*` (`deploy-prod.yml`).
Existing tags are `release-20200612122734`, `release-20230506`, `release-20230506-2`.
Tag creation is a production action and is never performed by branch work.
