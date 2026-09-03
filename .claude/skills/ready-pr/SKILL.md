---
name: ready-pr
description: Mark a cloudman-hq/aws-widgets Draft pull request Ready for Review without pushing, fixing CI, or merging. Use when the user asks to ready or open an existing PR for review.
---

# Ready PR

Change only the Draft state of one cloudman-hq/aws-widgets PR.

## Read-only preflight

Resolve the PR in this order:

1. The explicit PR number supplied by the user.
2. The PR for the current branch.

Do not select an unrelated recent PR.

Run:

    gh repo view --json nameWithOwner
    gh pr view PR_NUMBER --repo cloudman-hq/aws-widgets --json number,title,url,state,isDraft,headRefName,headRefOid,baseRefName
    gh pr ready --help

Require:

- The repository is `cloudman-hq/aws-widgets`.
- The PR is open and targets `prod-release`. A PR targeting `master` is misfiled —
  report it and stop rather than readying it.
- The PR is still Draft. If already Ready, report it and make no change.
- Local validation evidence for the same head exists when the head branch is checked
  out. The repository contract is `yarn validate`.

This skill does not switch branches to manufacture local evidence. If the local
checkout is not the PR head, report that local validation was not re-run; the
`Build and Unit Test` job remains the authoritative remote check.

## Mark Ready — STRUCTURAL ONLY / UNVALIDATED

Never exercised in this repository.

Proceed only when the user authorized the Draft-to-Ready transition:

    gh pr ready PR_NUMBER --repo cloudman-hq/aws-widgets

Re-read the PR and verify `isDraft` is false.

`ready_for_review` is one of the workflow's `pull_request` trigger types, so readying
starts a new `Build and Unit Test` run for the same SHA. Wait for that run rather than
trusting the pre-ready result.

The workflow runs `Build and Unit Test` for the PR. It does not prove macro UI
behavior and does not deploy the PR to stage — the stage deploy job is gated on a
`push` event to `prod-release`.

## Boundaries

- Change only Draft state.
- Do not push commits, re-run jobs manually, edit the PR, merge, push a `release-*`
  tag, or deploy stage or production.
- Always pair a PR number with its title or purpose in reports.

Report the resulting state and the new `Build and Unit Test` run as pending until
babysit-pr verifies the exact head SHA.
