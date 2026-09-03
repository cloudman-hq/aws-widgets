---
name: release-app
description: Release the cloudman-hq/aws-widgets Connect app to production by tagging a verified prod-release commit and watching the gated Deploy to Prod workflow. Use only for an explicit production release request.
---

# Release AWS Widgets

Promote one staged `prod-release` commit to the Firebase `prod` project
(`awswidgets`). This repository has one app, one deploy target, and no product
matrix.

Production here is **a pushed tag**, not a GitHub Release object. `deploy-prod.yml`
triggers on `refs/tags/release-*`, runs `Build and Unit Test`, then deploys through
the `production` environment.

## Authorization and current gate

Pushing a `release-*` tag is the first production authorization boundary. Never infer
that authority from a merge, a stage deploy, a PR approval, or a request to inspect
release readiness. Ask for explicit confirmation immediately before pushing the tag.

The required reviewer on the `production` environment is a second, independent
authorization. Pushing the tag never authorizes this agent to approve, bypass,
weaken, or impersonate that review. Do not call the deployment-approval API.

Verify read-only before doing anything:

    gh repo view --repo cloudman-hq/aws-widgets --json nameWithOwner,defaultBranchRef,url
    gh api repos/cloudman-hq/aws-widgets/environments/production
    gh api repos/cloudman-hq/aws-widgets/environments/production/deployment-branch-policies
    gh api repos/cloudman-hq/aws-widgets/rulesets
    gh api repos/cloudman-hq/aws-widgets/branches/prod-release/protection/required_status_checks

Require:

- the `production` environment exists and lists a required reviewer;
- its deployment branch policy includes `tag release-*`;
- the ruleset `Protect release tags` is `active`;
- `prod-release` protection requires the check `Build and Unit Test`.

If any is missing, report `BLOCKED — production gate not configured` and stop. Never
create, weaken, or remove a gate from this skill.

## PVT and spot-check are not available

`conf-app` and `tldraw-confluence` end a release with PVT and a delta-driven spot
check. Neither is ported here: both need an approved authenticated Confluence fixture
for the `aws-widget-macro`, and none exists. Report post-deploy validation as:

    Post-deploy validation: BLOCKED — no approved production fixture

Never substitute the build, the unit tests, or a green deploy job for that validation,
and never describe the release as user-verified.

## 1. Select the exact commit

The release commit is the tip of `prod-release`, or an explicit SHA the user names on
that branch.

    git fetch --prune
    git rev-parse origin/prod-release
    gh run list --repo cloudman-hq/aws-widgets --workflow deploy-stage.yml \
      --event push --branch prod-release --limit 20 \
      --json databaseId,headSha,status,conclusion,url,createdAt

Require, for that exact SHA:

- a `Build, Test and Stage` push run whose `headSha` equals it;
- `Build and Unit Test` and `Deploy legacy Connect app to stage` both `success`;
- that run completed within the last 24 hours.

A green run on an earlier commit, a cancelled run, or a rerun of a different SHA does
not qualify. If nothing qualifies, report
`BLOCKED — no verified staged commit on prod-release` and stop. Do not push a commit,
re-run a workflow, or dispatch a deploy to manufacture one.

## 2. Check release lineage

Resolve the most recent existing `release-*` tag and require it to be an ancestor of
the selected SHA:

    git tag --list 'release-*' --sort=-creatordate
    git merge-base --is-ancestor PREVIOUS_TAG SELECTED_SHA

This path is forward-only. A divergent or older commit is a rollback, which needs its
own designed and authorized path; never publish one through this skill by treating it
as a normal release.

## 3. Establish the release delta and notes

Compute the commit delta from the previous release tag to the selected SHA. Read
unclear diffs. Classify every commit as:

- `behavioral` — reachable user behavior in the macro or the configure page;
- `instrumentation` — analytics or diagnostics only;
- `infra/test/docs` — no shipped behavior.

Write privacy-safe notes from that classification. This repository is public: no
tenant hostname, page title, AWS account ID, resource ARN, Connect `clientKey`, or
shared secret in a tag message. If the delta has no behavioral change, say
`Maintenance release; no user-facing changes.` rather than leaving the notes empty.

## 4. Confirm and tag

Show the user the selected SHA, the previous tag, the staging run URL, the delta
classification, the notes, and the gate state. Ask for explicit confirmation to push
this exact tag.

Tag names use `release-YYYYMMDDHHMM` in UTC. Existing tags are
`release-20200612122734`, `release-20230506`, `release-20230506-2`; the timestamp form
is compatible with all of them and keeps tags unique without a `-N` suffix.

After confirmation:

    git tag -a release-YYYYMMDDHHMM SELECTED_SHA -m "NOTES"
    git push origin release-YYYYMMDDHHMM

Push a new tag only. Never move, delete, or force-push a tag — the
`Protect release tags` ruleset blocks both, and a failure there means the tag name is
already taken, not that the ruleset is wrong.

## 5. Watch the gated production deploy

Find the run caused by that tag:

    gh run list --repo cloudman-hq/aws-widgets --workflow deploy-prod.yml \
      --event push --limit 20 \
      --json databaseId,event,headBranch,headSha,createdAt,status,conclusion,url

Require `headBranch` to equal the exact tag and `headSha` to equal the selected SHA.
Do not select by SHA alone.

The run stops at `Deploy legacy Connect app to production` and waits for the
`production` environment reviewer. Report that state as:

    WAITING — production environment approval required

and stop watching for approval in a loop. After a human approves, re-read the run and
its jobs; never trust only a watch command's exit code.

When the deploy job succeeds, report the release as deployed and its post-deploy
validation as `BLOCKED` per the section above. If it fails, capture the failed logs,
report the category and run URL, and stop. The tag is already public: never delete
it, roll back, or redeploy automatically.

## Report

Always report:

- tag and exact SHA;
- previous tag and the ancestor check result;
- staging run URL and its age at selection;
- release delta classification and notes;
- production run URL and deploy-job state, including any approval wait;
- post-deploy validation: `BLOCKED — no approved production fixture`;
- any blocker or mutation performed;
- rollback: not performed.
