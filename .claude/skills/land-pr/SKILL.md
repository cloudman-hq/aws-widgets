---
name: land-pr
description: Merge an authorized green cloudman-hq/aws-widgets PR, then verify the exact prod-release SHA and the stage deploy result without tagging a production release. Use when the user explicitly asks to land or merge a ready PR.
---

# Land PR

Merge one authorized PR into `prod-release` and verify the resulting pipeline.
Production promotion is always separate.

## Merging to `prod-release` deploys to stage

`deploy-stage.yml` deploys the tested build artifact to the Firebase project `stage`
(`awswidgets-stg`) on every push to `prod-release`. A merge is therefore a
deployment action, not only a repository action. Require explicit merge authorization
and say so in the report.

## Read-only preflight

Resolve only the explicit PR or current-branch PR. Run:

    gh repo view --json nameWithOwner,defaultBranchRef,mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed
    gh pr view PR_NUMBER --repo cloudman-hq/aws-widgets --json number,title,url,state,isDraft,headRefName,headRefOid,baseRefName,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup
    gh pr merge --help

Require:

- Repository `cloudman-hq/aws-widgets` and base `prod-release`
- Open PR and unambiguous user merge authorization
- No requested-changes review or merge conflict
- Repository merge requirements satisfied
- The `Build and Unit Test` job succeeded for the exact `headRefOid`
- `yarn validate` passed for that head
- Required runtime UI assertions have evidence; process-only work may be
  `SKIPPED — no runtime change`

`prod-release` protection now enforces part of this list: the `Build and Unit Test`
check, a pull request, no force pushes, no deletions, and resolved conversations. A
rejection naming one of those is a real missing precondition, not a transient
failure — re-read the PR rather than retrying the merge.

The platform does **not** enforce the rest: `enforce_admins` is `false` and the
required approval count is `0`, so an administrator can merge with a failing local
`yarn validate` or missing UI evidence. Those preconditions are this skill's alone.

If the PR is Draft and the user explicitly asked to land it, invoke ready-pr, then use
babysit-pr to verify the new `Build and Unit Test` run for the unchanged head SHA.
Otherwise stop.

Check whether any open PR uses this head branch as its base:

    gh pr list --repo cloudman-hq/aws-widgets --state open --base HEAD_BRANCH --json number,title,url

Do not delete the branch when a stacked child exists.

## Merge — STRUCTURAL ONLY / UNVALIDATED

Never exercised in this repository.

Proceed only after all preconditions and merge authorization are present.

1. Select an enabled merge strategy. Honor a user-specified enabled strategy.
   Otherwise inspect `mergeCommitAllowed`, `squashMergeAllowed`, and
   `rebaseMergeAllowed`: use the sole enabled strategy when only one is available;
   when several are available, prefer merge commit, then squash, then rebase. If none
   is enabled, stop.
2. Map that choice to `--merge`, `--squash`, or `--rebase` and merge the exact PR.
   Add branch deletion only when the stacked-PR check is empty.
3. Re-read the PR until state is MERGED and capture `mergeCommit.oid`. Timeout after
   5 minutes. Do not report LANDED before this succeeds; if the timeout expires,
   report the last observed state without retrying the merge command.

Do not use auto-merge to bypass a currently failing or pending precondition.

## Verify `prod-release` and stage

Find the `Build, Test and Stage` push run whose `headSha` exactly equals
`mergeCommit.oid`:

    gh run list --repo cloudman-hq/aws-widgets --workflow deploy-stage.yml --event push --branch prod-release --limit 20 --json databaseId,headSha,status,conclusion,url

Watch that run and re-read its jobs. Require:

- `Build and Unit Test`: success
- `Deploy legacy Connect app to stage`: success

The stage job needs the `FIREBASE_TOKEN` repository secret. It is the only secret this
repository holds (measured 2026-09-03). A failure naming a missing or expired token is
a configuration blocker owned by the repository administrator, not a merge defect.

Do not push a `release-*` tag, create a GitHub Release, or run `deploy:prod` from this
skill.

## Output

Always pair the PR number with its title or purpose. Report one of:

- LANDED — merge SHA, exact `prod-release` run, `Build and Unit Test`, stage deploy,
  production not performed
- MERGE BLOCKED — failed precondition
- MAIN CI FAILED — merge completed but the exact `prod-release` run or the stage
  deploy failed

Do not auto-rollback. Report the merge SHA, run URL, failed job, and evidence.
