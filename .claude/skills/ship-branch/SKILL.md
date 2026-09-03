---
name: ship-branch
description: Carry a cloudman-hq/aws-widgets branch through validation, Ready PR submission, exact-SHA CI monitoring, authorized merge, and stage verification. Use for an explicit ship request; production remains separate.
---

# Ship Branch

Compose validate-branch, submit-branch, babysit-pr, and land-pr with hard boundaries.
Shipping ends after the merged SHA is verified on the Firebase `stage` project; it
never pushes a `release-*` tag and never deploys production.

## Read-only preflight

Run:

    git status --short --branch
    git fetch --prune
    git remote -v
    gh repo view --json nameWithOwner,defaultBranchRef,visibility
    gh pr list --limit 5

Verify:

- Repository is `cloudman-hq/aws-widgets` and the base is `prod-release`. Ignore the
  reported default branch `master`; it is frozen at 2020-06-27.
- Changes are scoped and owned by this task.
- The diff and the intended PR body satisfy `docs/policies/client-privacy.md`; the
  repository is public.
- No other session's dirty work would be switched, stashed, restored, cleaned, or
  overwritten.
- All composed skill files exist.

If the current branch is `prod-release` or `master`, create or move the work through
`docs/policies/git-workflow.md` before committing. Never commit feature work directly
to `prod-release`.

## Shipping flow — STRUCTURAL ONLY / UNVALIDATED

Never exercised in this repository.

### 1. Validate

Invoke validate-branch. It runs `yarn validate`.

- On a reproducible repository-local failure, make the smallest safe correction, then
  invoke validate-branch again from the beginning. The shipping request authorizes
  these minimal fixes.
- Repeat for at most three fix-and-revalidate attempts. Do not weaken a check, hide a
  failure, raise the Volta Node pin, broaden the task, or modify credentials.
- For process-only work, UI is `SKIPPED — no runtime change`.
- For runtime/user-visible work, stop unless screenshot, snapshot, or
  network-intercept evidence exists for every required UI assertion.

### 2. Commit and submit as Ready

Commit only the scoped change on a branch that is not `prod-release` or `master`, when
the ship request authorizes committing it.

Invoke submit-branch but override its Draft default: create the PR Ready for Review
against `prod-release`. If a matching Draft PR already exists, invoke ready-pr. Draft
is not a hidden test gate; the same `Build and Unit Test` contract runs for both
states.

Submit does not merge.

### 3. Babysit the exact head

Invoke babysit-pr for the labelled PR. Require `Build and Unit Test` success for the
exact head SHA.

- The shipping request authorizes babysit-pr's bounded three-attempt loop for minimal,
  evidence-backed repository-local CI fixes. Every push must pass `yarn validate`.
- Re-diagnose each new failure and never push while the prior run is active.
- Stop on exhausted retries, merge conflicts, missing configuration, or a
  changed/unverified head.

### 4. Land

An explicit request such as ship, ship it, land, or merge supplies merge authorization
for this flow. If the request was only submit, ready, or check, ask before invoking
land-pr.

Invoke land-pr. It rechecks authorization and merge preconditions, merges, and
verifies the exact `prod-release` SHA plus the stage deploy. Merging publishes to the
Firebase `stage` project; treat the merge as a deployment.

### 5. Stop before production

Production is a pushed `release-*` tag consumed by `deploy-prod.yml`, which runs
`yarn deploy:prod` against the Firebase `prod` project. Never create or push that tag
from this flow. Report production as NOT PERFORMED.

Production promotion belongs to the `release-app` skill, which is a separate,
separately authorized flow. `pvt` and `spot-check` are not ported — both need an
approved authenticated Confluence fixture that does not exist for this app. Do not
claim any of them ran.

## Stop conditions

Each boundary must succeed before the next starts. Do not skip validation, accept CI
for an earlier SHA, infer UI success, force-push, auto-resolve conflicts,
auto-rollback, or broaden a fix beyond the branch's purpose.

## Output

Always pair the PR number with its title or purpose. Report:

    Validation: PASS or FAIL
    UI evidence: PASS with evidence | SKIPPED — no runtime change | BLOCKED
    PR: labelled number, URL, base branch, Ready state
    PR CI: Build and Unit Test result for exact head SHA
    Merge: result and merge SHA
    prod-release CI: Build and Unit Test plus stage deploy
    Production: NOT PERFORMED
