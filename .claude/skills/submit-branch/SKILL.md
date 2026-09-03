---
name: submit-branch
description: Push a cloudman-hq/aws-widgets feature branch and create or reuse its pull request without merging. Use when the user asks to submit, push, or open a PR for this repository.
---

# Submit Branch

Publish a scoped branch to cloudman-hq/aws-widgets. This skill never merges a PR and
never deploys stage or production.

## Read-only preflight

Run:

    git status --short --branch
    git remote -v
    gh repo view --json nameWithOwner,defaultBranchRef,url,visibility
    gh pr list --limit 5
    gh pr create --help

Require `nameWithOwner` to be `cloudman-hq/aws-widgets`.

The base branch is **`prod-release`**, not `master`. GitHub reports `master` as the
default branch, but it is frozen at 2020-06-27 and is 233 commits behind
`prod-release`. Pass `--base prod-release` explicitly on every `gh pr create`; do not
accept the repository default.

`visibility` is `public`. Apply `docs/policies/client-privacy.md` to the diff and to
the PR body before pushing: no tenant hostname, AWS account ID, resource ARN, Connect
`clientKey`, or shared secret.

Then verify:

- The current branch is not `prod-release` or `master`.
- The branch has passed validate-branch, whose authoritative command is `yarn validate`.
- Any required runtime UI check has evidence; process-only work may say
  `SKIPPED — no runtime change`.

Classify the worktree before submission:

- **Clean worktree** — nothing remains to commit; continue to push.
- **Scoped changes** — every changed file belongs to the requested branch work. Review
  the diff, stage only those files, commit with a descriptive message, rerun the
  applicable validation, then continue.
- **Mixed or unrelated changes** — stop and ask which files belong to this submission.
  Never guess, stage everything, or move another session's work.

`forge/` and `zenuml-paywall-controlled-unlock-experiment.md` are known untracked
paths. `yarn-error.log` is tracked and is rewritten by any failed install. None of
them belong to a process-only submission unless the request names them.

If another session owns changes in the checkout, do not stash, restore, clean, switch,
or overwrite them. Stop or use an isolated worktree that already contains only the
intended branch.

Find an existing PR for the exact head branch:

    gh pr list --head HEAD_BRANCH --state open --json number,title,url,isDraft,headRefName,baseRefName

Reuse it only when `headRefName` and `baseRefName` match the intended branch and
`prod-release`.

## Submit — STRUCTURAL ONLY / UNVALIDATED

Never exercised in this repository. The last pull-request-based change predates the
current history; recent commits went straight onto `prod-release`. Mark this skill
VALIDATED only after a real PR run.

Proceed only when the user asked to submit or create a PR.

1. Push normally; never force-push:

    git push -u origin HEAD_BRANCH

2. Reuse the matching open PR, or create one against `prod-release`.
3. Default a newly created PR to Draft for collaboration. If the user explicitly asks
   for Ready, omit the draft flag.
4. Include the `yarn validate` result, UI-evidence classification, and any deploy
   impact in the PR body. This repository has no PR template.
5. After creation, invoke babysit-pr in monitoring mode for the exact PR and head SHA.
   The authoritative PR workflow is `Build, Test and Stage` and its required job is
   `Build and Unit Test`.
6. Do not fix CI unless the request also authorizes fixes. Do not mark Ready, merge,
   push a `release-*` tag, or deploy stage or production.

## Output

Always pair the PR number with its title or purpose. Report:

- SUBMITTED or FAILED
- PR number plus label and URL
- Branch, base branch, and Draft/Ready state
- `yarn validate` result
- `Build and Unit Test` status for the submitted head SHA
- UI evidence classification
- Explicitly: Merge not performed; stage and production not deployed
