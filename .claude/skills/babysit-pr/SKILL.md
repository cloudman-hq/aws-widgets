---
name: babysit-pr
description: Monitor and, when explicitly authorized, fix cloudman-hq/aws-widgets PR CI for the exact head SHA. Use to watch a PR, diagnose Build and Unit Test failures, or carry a submitted PR to green.
---

# Babysit PR

Monitor the authoritative PR run and optionally make bounded repository-local fixes.
This skill never merges and never deploys stage or production.

## Resolve the exact PR and SHA

Use the explicit PR number, otherwise the PR for the current branch. Do not fall back
to an unrelated recent failure.

Run:

    gh repo view --json nameWithOwner
    gh pr view PR_NUMBER --repo cloudman-hq/aws-widgets --json number,title,url,state,isDraft,headRefName,headRefOid,baseRefName,mergeable,mergeStateStatus,statusCheckRollup

Require `cloudman-hq/aws-widgets`, an open PR targeting `prod-release`, and record
`headRefOid`. Always label the PR number with its title or purpose.

## Find the authoritative run

The PR workflow is `Build, Test and Stage`. The required PR job is exactly
`Build and Unit Test`.

List both event types for the exact branch and inspect only the recorded head SHA:

    gh run list --repo cloudman-hq/aws-widgets --workflow deploy-stage.yml \
      --branch HEAD_BRANCH --limit 40 \
      --json databaseId,event,headSha,status,conclusion,url,createdAt

From exact-SHA runs, select the newest exact-SHA `pull_request` run by `createdAt`,
using `databaseId` as the tie-breaker, and treat only that run as authoritative. This
matters when `ready_for_review` or `reopened` creates another PR run without changing
the SHA. Wait if the newest run is active. Never reuse an older PR run from the same
SHA. The concurrency key includes the event, so push and pull-request runs for one
branch do not cancel each other. If the newest PR run is cancelled, report `BLOCKED`;
do not accept a push run or an older PR run as its substitute. Rerun the workflow only
when explicitly authorized and only after confirming that no matching run is active.

For both Draft and Ready PRs:

- `Build and Unit Test` must succeed.
- `Deploy legacy Connect app to stage` is expected not to run on a PR — it is gated on
  a `push` event to `prod-release`.
- There is no E2E job in this repository. Do not wait for one.

If the run is pending, watch it, then re-read its status and conclusion:

    gh run watch RUN_ID --repo cloudman-hq/aws-widgets
    gh run view RUN_ID --repo cloudman-hq/aws-widgets --json status,conclusion,headSha,jobs,url

Use the re-read result as authoritative rather than relying only on the watch
command's exit status.

## Diagnose a failure

Read failed logs:

    gh run view RUN_ID --repo cloudman-hq/aws-widgets --log-failed

Classify the failure before acting:

- Repository code or contract failure reproducible with `yarn validate`
- Workflow/configuration failure
- Dependency installation failure — this repository installs a 2020 dependency graph
  on Node 10; `node-sass@4.13.1` and `fsevents` compile through `node-gyp@3.8.0`.
  `fsevents` is optional and its `gyp ERR!` output does not fail the install.
- Runner/network failure
- Missing repository/environment configuration
- Merge conflict or stale head SHA

Run `yarn validate` locally only in a checkout of the same head, and only through the
Volta yarn 1 image (`export PATH="$HOME/.volta/tools/image/yarn/1.22.19/bin:$PATH"`) —
the Corepack `yarn` shim is ESM and fails under the repository's Node 10.16.3 pin. Do
not switch over a dirty shared checkout. If safe local reproduction is unavailable,
report the blocker instead of claiming a diagnosis.

## Fix and retry — STRUCTURAL ONLY / UNVALIDATED

Never exercised in this repository.

- Monitoring/status requests are read-only. They do not authorize edits, commits,
  pushes, or reruns.
- When the user explicitly asks to fix CI, make only the smallest repository-local
  correction supported by the logs and local reproduction.
- Run `yarn validate` before every push.
- Commit only scoped files and use a regular push; never force-push.
- Count each fix-and-push or manual rerun as one attempt. Stop after at most three
  attempts.
- After every failed attempt, read the new run's logs and re-diagnose from the new
  logs; do not assume the failure category stayed the same.
- Re-read the PR head SHA after every push and monitor only its matching run.
- A manual rerun is appropriate only for evidence-backed transient infrastructure
  failure and only when no run is active.
- Do not push or rerun while a prior run is active. Wait for it to finish and re-read
  its authoritative status before spending another attempt.
- Never raise the Volta Node pin to make a job pass, auto-resolve merge conflicts,
  modify secrets, weaken validation, merge the PR, push a `release-*` tag, or deploy.

## Report

Report:

- PR number plus label and URL
- Exact head SHA and run URL
- `Build and Unit Test`: PASS, FAIL, PENDING, or BLOCKED
- Failure category and evidence
- Local `yarn validate` result, if run
- Fixes/reruns and attempt count
- UI evidence: separate from CI
- Merge, stage, and production: not performed
