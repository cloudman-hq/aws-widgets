# Pipeline port status

Register for the port of the `ZenUml/conf-app` release process into
`cloudman-hq/aws-widgets`, following the same method used for
`ZenUml/tldraw-confluence` on 2026-08-31.

Opened 2026-09-03.

## Status vocabulary

| Status | Meaning |
|---|---|
| `LIVE` | Exercised against the real remote pipeline; run URL recorded. |
| `LOCAL` | Exercised on this machine; command output recorded. |
| `STRUCTURAL ONLY` | File exists and parses; its state-changing path was never run. |
| `PENDING` | Planned, not started. |
| `BLOCKED` | Cannot proceed; the blocker and its owner are named. |
| `DEFERRED` | Deliberately out of scope for this work package, with a reason. |
| `SKIPPED` | Deliberately not ported, with a reason. |

Anything unvalidated carries its label. No item is described as working without
recorded evidence.

## Scope

This work package ports the **deploy-target-agnostic** half of the `conf-app` release
process. The Forge-specific half is `DEFERRED` — the tracked tree is an Atlassian
Connect app on Firebase, and the Forge conversion lives on `codex/forge-conversion`,
whose 249 commits share no ancestor with the tracked history
(`git merge-base master codex/forge-conversion` returns nothing).

Runtime code is unchanged. No file under `src/**`, `functions/**`, `public/**`,
`webpack/**`, `firebase.json`, or `.firebaserc` was modified.

## Ported items

| Item | Status | Evidence |
|---|---|---|
| `docs/policies/git-workflow.md` | `LOCAL` | Written; base-branch claim measured: `git rev-list --left-right --count master...prod-release` = 11 / 233. |
| `docs/policies/client-privacy.md` | `LOCAL` | Written; `gh api repos/cloudman-hq/aws-widgets -q .visibility` = `public`. |
| `CLAUDE.md` | `LOCAL` | Written; every measured figure in it is listed in this register. |
| `.claude/skills/validate-branch` | `LOCAL` | Its contract `yarn validate` ran green — see below. |
| `.claude/skills/submit-branch` | `LIVE` | Exercised once: branch pushed, PR #70 "WP1: port the conf-app release process (deploy-agnostic half)" created as Draft against `prod-release`, and its `Build and Unit Test` run passed on the exact head SHA. |
| `.claude/skills/ready-pr` | `STRUCTURAL ONLY` | Same check. No Draft transition performed. |
| `.claude/skills/babysit-pr` | `STRUCTURAL ONLY` | Same check. No run monitored. |
| `.claude/skills/land-pr` | `STRUCTURAL ONLY` | Same check. No merge performed. |
| `.claude/skills/ship-branch` | `STRUCTURAL ONLY` | Same check. Composition never executed. |
| `.claude/skills/release-app` | `STRUCTURAL ONLY` | Rewritten for this repository's tag trigger: select a `prod-release` SHA with a green staging run under 24 hours old, check ancestry against the previous `release-*` tag, classify the delta, push `release-YYYYMMDDHHMM`, then watch `Deploy to Prod` stop at the `production` environment approval. Never run — that needs a production tag push. |
| `package.json` scripts `lint:check`, `validate` | `LOCAL` | `yarn validate` exit 0. |
| `.github/workflows/deploy-stage.yml` gate | `LIVE` | Two pull-request runs on PR #70. Run [33714331769](https://github.com/cloudman-hq/aws-widgets/actions/runs/33714331769) on `9801be9`: `Build and Unit Test (10.x)` success, `Deploy legacy Connect app to stage` **skipped**. Run [33714466994](https://github.com/cloudman-hq/aws-widgets/actions/runs/33714466994) on `f842bb6`: `Build and Unit Test` success, deploy skipped. |
| `.github/workflows/deploy-prod.yml` gate | `STRUCTURAL ONLY` | Parsed with PyYAML: job `build` named `Build and Unit Test`, job `deploy-prod` with `needs: build` and `environment: production`. Running it needs a pushed `release-*` tag, which is a production action and was not taken. |

## Local validation evidence — 2026-09-03

Run from the repository root with
`export PATH="$HOME/.volta/tools/image/yarn/1.22.19/bin:$PATH"`.

| Command | Result |
|---|---|
| `yarn install --frozen-lockfile` | `Done in 19.87s.` Optional `fsevents` failed to compile through `node-gyp@3.8.0`; yarn reports it as ignorable. |
| `tslint -c tslint.json './src/**/*.ts?(x)'` | Exit 0, zero findings. |
| `jest --ci` | `Test Suites: 7 passed, 7 total` / `Tests: 12 passed, 12 total`. |
| `webpack --mode production --config ./webpack/webpack.client.js` | Exit 0. Output to `build/`, which is gitignored; the working tree stayed clean. |
| `yarn validate` | Exit 0, `Done in 25.61s.` |

Installation caveat recorded during this session: two concurrent `yarn install`
processes corrupted the shared yarn cache and produced
`ENOTEMPTY: directory not empty, rmdir '…/npm-@icons-material-0.2.4-…/node_modules/@icons/material/svg'`.
Deleting that cache directory and reinstalling succeeded.

## Defect found and fixed in this port

Before this change, `.github/workflows/deploy-stage.yml` had one job that ran
`yarn deploy:stage --token ${{ secrets.FIREBASE_TOKEN }}` on **both** `push` and
`pull_request` events into `prod-release`. A same-repository pull request receives
repository secrets, so opening a PR deployed to the Firebase `stage` project, and no
lint or test ran before any deploy.

The workflow now runs `Build and Unit Test` on both events and gates the deploy job
behind `needs: build` and `if: github.event_name == 'push'`. The deploy job is the only
place `secrets.FIREBASE_TOKEN` appears.

`STRUCTURAL ONLY`: this reasoning comes from reading the workflow file. No PR run was
observed either before or after the change.

## Repository controls

Measured before this work package, then configured and re-read on 2026-09-03.

| Control | Before | After | Status |
|---|---|---|---|
| `prod-release` branch protection | not configured | requires the `Build and Unit Test` check and a pull request; force pushes and deletions blocked; conversation resolution required | `LIVE` |
| Environments | 0 | `production`, required reviewer `MrCoder`, deployment branch policy `tag release-*` | `LIVE` |
| Rulesets | 0 | `Protect release tags` (id 22166010), target `tag`, active, rules `deletion` and `non_fast_forward` on `refs/tags/release-*` | `LIVE` |
| `master` branch protection | HTTP 404 `Branch not protected` | unchanged | `SKIPPED` — `master` is frozen at 2020-06-27 and is not a deployment target |
| Actions variables | 0 | 0 | `SKIPPED` — nothing in these workflows reads one |
| Secrets | `FIREBASE_TOKEN` only | unchanged | — |
| Visibility | `public` | unchanged | — |

Each value above was re-read from the API after the write; the responses are in
`~/.unattended-runs/aws-widgets/20260903-141328-wp1-pr/evidence/`.

Two deliberate settings, both recorded so a later reader does not read them as
oversights:

- `enforce_admins: false`. This repository has one maintainer, who is an
  administrator. Enforcing protection against administrators would leave no path to
  an emergency fix.
- `required_approving_review_count: 0`. A pull request is required before merging,
  but GitHub does not let an author approve their own pull request, so requiring one
  approval would deadlock a single-maintainer repository. Raise it when a second
  reviewer exists.

## Production promotion is now gated

`deploy-prod.yml` previously ran `yarn deploy:prod` on a pushed `release-*` tag with
no lint, no test, and no approval. It now runs `Build and Unit Test` first, and the
deploy job targets the `production` environment, which requires a reviewer approval
and accepts only `release-*` tags.

The next `release-*` tag will therefore **wait for a human approval** in the Actions
UI before it deploys to the Firebase `prod` project. This is a deliberate behavior
change.

## Deferred and skipped

| Item | Status | Reason |
|---|---|---|
| `.claude/skills/pvt` | `DEFERRED` | Production validation needs an authenticated Confluence fixture for the `aws-widget-macro`; none is approved for this app. `release-app` therefore reports post-deploy validation as `BLOCKED` rather than passing. |
| `.claude/skills/spot-check` | `DEFERRED` | Depends on the same fixture. |
| `.claude/skills/forge-tunnel` | `DEFERRED` | Forge-only. |
| `docs/policies/forge-only.md` | `SKIPPED` | The tracked tree is a Connect app. Copying a policy that forbids Connect runtime code would contradict the shipped product. |
| `docs/policies/persistence-safety.md` | `SKIPPED` | `conf-app` and `tldraw-confluence` versions govern Forge KVS document bodies. This app stores Connect installation records in Firebase; that surface needs its own policy, not an adapted copy. |
| `prepare-draft-release.yml` | `DEFERRED` | Exact-SHA draft releases presuppose the GitHub Release production path, which this repository does not use. |
| Reusable `staging-deploy.yml` (`workflow_call`) | `DEFERRED` | One deploy target and one caller; a reusable workflow adds no separation yet. |
| E2E workflow | `SKIPPED` | No E2E suite exists in this repository. |
| Scheduled smoke test | `PENDING` | Useful, but it needs a production URL check and a decision on alert routing. |
| Merging `codex/forge-conversion` | `BLOCKED` | Unrelated histories; needs `--allow-unrelated-histories` and separate authorization. Owner: the user. |

## Check-name correction

The first run reported the check as `Build and Unit Test (10.x)`: a `strategy.matrix`
appends its value to the check name, and branch protection matches the name exactly.
The matrix held one Node version and was removed in `f842bb6`, after which the check
reported as `Build and Unit Test`. Branch protection requires that exact string.

## Next actions

1. Review and merge PR #70. Merging is a deployment — a push to `prod-release` runs
   `Deploy legacy Connect app to stage` against the Firebase `awswidgets-stg` project.
2. Decide the Forge integration path before porting `release-app`, `pvt`, and
   `spot-check`.
3. Consider a scheduled production smoke test — still `PENDING`; it needs a production
   URL to probe and a decision on where an alert goes.
4. 378 Dependabot alerts stand on the default branch (25 critical, 175 high, 127
   moderate, 51 low), reported by the remote on push. Raising the Node pin is not a
   fix path; see `CLAUDE.md`.
