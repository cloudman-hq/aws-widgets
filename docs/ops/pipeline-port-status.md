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
| `.claude/skills/submit-branch` | `STRUCTURAL ONLY` | Frontmatter parses, `name` matches directory, description names the target repository. No PR was created. |
| `.claude/skills/ready-pr` | `STRUCTURAL ONLY` | Same check. No Draft transition performed. |
| `.claude/skills/babysit-pr` | `STRUCTURAL ONLY` | Same check. No run monitored. |
| `.claude/skills/land-pr` | `STRUCTURAL ONLY` | Same check. No merge performed. |
| `.claude/skills/ship-branch` | `STRUCTURAL ONLY` | Same check. Composition never executed. |
| `package.json` scripts `lint:check`, `validate` | `LOCAL` | `yarn validate` exit 0. |
| `.github/workflows/deploy-stage.yml` gate | `STRUCTURAL ONLY` | Parsed with PyYAML: workflow `Build, Test and Stage`; job `build` named `Build and Unit Test`; job `deploy-stage` named `Deploy legacy Connect app to stage` with `needs: build` and `if: github.event_name == 'push'`. Never run on GitHub. |

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

## Repository controls — measured 2026-09-03

| Control | Value | Owner |
|---|---|---|
| Environments | 0 | repository administrator |
| Actions variables | 0 | repository administrator |
| Rulesets | 0 | repository administrator |
| `master` branch protection | HTTP 404 `Branch not protected` | repository administrator |
| `prod-release` branch protection | not configured | repository administrator |
| Secrets | `FIREBASE_TOKEN` only | repository administrator |
| Visibility | `public` | repository administrator |

`BLOCKED` — no platform control enforces the merge, review, or deploy preconditions
that the ported skills describe. Until environments, a ruleset, and protection on
`prod-release` exist, the skills are the only gate, and any user with write access can
bypass them. Creating them requires repository administrator rights.

## Deferred and skipped

| Item | Status | Reason |
|---|---|---|
| `.claude/skills/release-app` | `DEFERRED` | `conf-app`'s version drives a GitHub Release and `forge deploy -e production`. Production here is a pushed `release-*` tag into Firebase. Port it with the Forge migration or rewrite it for tags in a separate work package. |
| `.claude/skills/pvt` | `DEFERRED` | Production validation needs an authenticated Confluence fixture; none is approved for this app. |
| `.claude/skills/spot-check` | `DEFERRED` | Depends on the same fixture. |
| `.claude/skills/forge-tunnel` | `DEFERRED` | Forge-only. |
| `docs/policies/forge-only.md` | `SKIPPED` | The tracked tree is a Connect app. Copying a policy that forbids Connect runtime code would contradict the shipped product. |
| `docs/policies/persistence-safety.md` | `SKIPPED` | `conf-app` and `tldraw-confluence` versions govern Forge KVS document bodies. This app stores Connect installation records in Firebase; that surface needs its own policy, not an adapted copy. |
| `prepare-draft-release.yml` | `DEFERRED` | Exact-SHA draft releases presuppose the GitHub Release production path, which this repository does not use. |
| Reusable `staging-deploy.yml` (`workflow_call`) | `DEFERRED` | One deploy target and one caller; a reusable workflow adds no separation yet. |
| E2E workflow | `SKIPPED` | No E2E suite exists in this repository. |
| Scheduled smoke test | `PENDING` | Useful, but it needs a production URL check and a decision on alert routing. |
| Merging `codex/forge-conversion` | `BLOCKED` | Unrelated histories; needs `--allow-unrelated-histories` and separate authorization. Owner: the user. |

## Next actions

1. Open a pull request from `chore/wp1-operational-convergence` into `prod-release`
   and record the first real `Build and Unit Test` run. That promotes the workflow gate
   and `submit-branch` from `STRUCTURAL ONLY`.
2. Repository administrator: create branch protection on `prod-release` and a
   `production` environment, so the ported preconditions have platform backing.
3. Decide the Forge integration path before porting `release-app`, `pvt`, and
   `spot-check`.
