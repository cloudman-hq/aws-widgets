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
process. The Forge-specific half is `DEFERRED`: the tracked tree is an Atlassian
Connect app on Firebase, and the Forge conversion lives on `codex/forge-conversion`,
16 commits stacked on the current `prod-release` tip.

**Correction, 2026-09-03.** An earlier revision of this register said those commits
"share no ancestor with the tracked history" and needed `--allow-unrelated-histories`.
That reading came from measuring against `master`, which has a different root commit.
Measured against `prod-release`, the actual base branch, `git merge-base` returns
`ef8d6d3` — the `prod-release` tip itself — and `--is-ancestor` exits 0. The branch
fast-forwards. The deferral stands on product grounds, not on git mechanics.

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
| `.github/workflows/smoke-test.yml` | `LOCAL` | Parsed with PyYAML. Its assertion script ran here against live production and exited 0: `key com.aws.widget.confluence-addon`, `baseUrl https://awswidgets.web.app`, `macros ['aws-widget-macro']`. It cannot be dispatched on GitHub yet — `workflow_dispatch` only offers workflows present on the default branch, and `master` does not have this file. |

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
| `master` branch protection | HTTP 404 `Branch not protected` | unchanged | `BLOCKED` — see the default-branch blocker below. An earlier revision called `master` "not a deployment target", which is wrong: `master`'s own `deploy-stage.yml` deploys to `awswidgets-stg` on every push and pull request into `master`. |
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
- `prevent_self_review: false` on the `production` environment, for the same reason:
  the sole reviewer is the only person who can push a `release-*` tag. The approval is
  therefore a confirmation step by the releaser, not a second person's authorization.
  Do not describe it as independent review until a second reviewer exists.
  `can_admins_bypass` was `true` when the environment was created and is now `false`,
  so the confirmation cannot be skipped.

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
| Scheduled smoke test | `LOCAL` | Both unknowns closed by measurement. Production URL is `https://awswidgets.web.app` — `/` and `/atlassian-connect.json` both returned 200 on 2026-09-03, and the served descriptor carries the expected app key, macro key and `baseUrl`. Alert routing is GitHub's own workflow-failure notification to the repository owner; no external alerting service was configured. |
| Merging `codex/forge-conversion` | `DEFERRED` | Not a history problem. `git merge-base prod-release codex/forge-conversion` returns `ef8d6d3`, the `prod-release` tip, and `--is-ancestor` exits 0: the branch is `prod-release` plus 16 commits and merges by fast-forward. It stays deferred because it lands a second toolchain (Node 24 beside the root Node 10 pin) and a Forge app identity, which is a product decision. Owner: the user. |

## Code review round — 2026-09-03

A review of PR #70 found 15 issues. Closed inside the branch, each re-verified:

| Finding | Fix | Evidence |
|---|---|---|
| `gh run list --workflow "Build, Test and Stage"` returns `could not find any workflows named…` — the workflow entity is still registered under `master`'s name | every skill now looks up by file path, `--workflow deploy-stage.yml` / `deploy-prod.yml` | `gh run list --workflow deploy-stage.yml` returns runs |
| `ready_for_review` is not a default `pull_request` activity type, so readying a Draft started no run and `ready-pr`/`land-pr` waited forever | `types: [opened, synchronize, reopened, ready_for_review]` | parsed from the file |
| `land-pr` claimed no branch protection and zero rulesets, contradicting this register | rewritten to say what the platform does and does not enforce | — |
| `submit-branch` said `STRUCTURAL ONLY` while the register said `LIVE` | marked `VALIDATED 2026-09-03` | — |
| `deploy-prod.yml` concurrency keyed on `github.ref`, unique per tag, so it serialized nothing | constant group `${{ github.workflow }}` | parsed from the file |
| `cancel-in-progress: true` could kill an in-flight `firebase deploy` on a push | `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` | parsed from the file |
| The husky pre-commit hook still ran the mutating `lint --fix` | hook runs `lint:check` | commit output shows `> aws-widgets@0.1.0 lint:check` |
| Build output was discarded and rebuilt in the deploy job, so the tested bytes were not the shipped bytes | `upload-artifact` in `build`, `download-artifact` in both deploy jobs, deploy calls `yarn firebase deploy` directly | artifact `build-84979117…`, 1238580 bytes, on run 33716904456 |
| New steps used `actions/checkout@v2` and `actions/setup-node@v1`, both on a deprecated action runtime | `@v4` for both, Node version still `10.x` | run 33716904456 green with `Run actions/checkout@v4` |
| `production` environment had `can_admins_bypass: true`, so the approval could be skipped silently | set to `false` | `gh api …/environments` returns `can_admins_bypass=false` |
| `validate-branch` and `CLAUDE.md` documented `yarn validate` without `--ci` | both corrected, with the reason | — |
| The register called `master` "not a deployment target" | corrected; `master`'s own `deploy-stage.yml` deploys to `awswidgets-stg` | see the blocker below |

Two findings are recorded rather than fixed:

- **The single reviewer is the tag pusher.** `prevent_self_review` stays `false`
  because raising it would deadlock a one-maintainer repository. Documented above.
- **Nine commits on this branch carry prose bodies**, against the one-line subject
  rule. Later commits use one-line subjects; the earlier nine are already pushed, and
  rewriting pushed history costs more than it saves. A squash merge collapses them.

**Not verified:** the deploy half of both workflows. A pull request never runs it, so
`download-artifact` followed by `yarn firebase deploy` has not executed on a runner.
Local checks only: `yarn firebase --version` returns `8.4.2` from
`node_modules/.bin`, and `firebase.json` points hosting at `build`, which is where the
artifact restores. The first merge to `prod-release` is the real test of that path.

## The Firebase credential is dead — releases are blocked on it

Found by merging PR #70 on 2026-09-03. The first push-event deploy since the merge
failed:

    Error: Failed to get Firebase project awswidgets-stg.
    Please make sure the project exists and your account has permission to access it.

Run [33718219036](https://github.com/cloudman-hq/aws-widgets/actions/runs/33718219036)
on `cda31e2`: `Build and Unit Test` success, `Deploy legacy Connect app to stage`
failure.

**Not caused by this work package.** The identical error appears in run
[33168223802](https://github.com/cloudman-hq/aws-widgets/actions/runs/33168223802) on
2026-08-28, under the old workflow running `yarn deploy:stage --token ***`. Commit
`1bafdf5` on `codex/forge-conversion` then made pull-request runs build-only, which
stopped the error appearing without fixing it.

**The project is fine; the credential is not.** `awswidgets-stg` serves 200 at
`https://awswidgets-stg.web.app/` with the correct descriptor, and a local
`firebase projects:list` lists both `awswidgets` and `awswidgets-stg`. The repository
secret `FIREBASE_TOKEN` was last updated 2023-05-06 and no longer authenticates. The
window in which it stopped working is unknown: nothing deployed between 2023-05-06 and
2026-08-28, and workflow logs older than the retention window are gone.

**No damage.** `firebase deploy` failed at project resolution, before uploading. The
stage site is unchanged.

Replacing it is the only thing between this repository and a release. Because the
value has to be entered again anyway, entering it as an **environment** secret rather
than a repository secret costs one extra paste and closes the two ungated-deploy
blockers below: a job that declares no `environment:` cannot read an environment
secret, so every historical commit's deploy job fails closed.

Prepared for that: the `stage` environment exists with no reviewers, and
`deploy-stage.yml` declares `environment: stage`. An environment job still falls back
to a repository secret, so this change is inert until the repository secret is removed.

## First release through the ported pipeline — 2026-09-03

Tag `release-202609030645` on `4d97313`, previous tag `release-20230506-2` confirmed
an ancestor.

| Stage | Result |
|---|---|
| Staging run 33724224171 on `4d97313` | success; stage hosting released 2026-09-03 16:41:39 AEST, replacing 2023-05-06 21:04:17 |
| Production run [33724755120](https://github.com/cloudman-hq/aws-widgets/actions/runs/33724755120) | `Build and Unit Test` success; `Deploy legacy Connect app to production` waited at the `production` environment, then success after approval |
| Production hosting | released 2026-09-03 16:52:02 AEST, replacing 2023-05-06 21:42:35 |
| Served bundle | `app.dfc02017ade68d94138f.4d97313.js`, replacing `…ef8d6d3.js` |
| Descriptor | `https://awswidgets.web.app/atlassian-connect.json` returns 200, key `com.aws.widget.confluence-addon`, macro `aws-widget-macro` |

Delta from `release-20230506-2`: 16 commits, 15 files, all `infra/test/docs`. No file
under `src/`, `functions/`, `public/`, `webpack/`, `firebase.json` or `.firebaserc`
changed. The webpack content hash `dfc02017ade68d94138f` is identical on both sides,
so the bundle is byte-identical and republished under a new git-revision filename.
**No user-visible change shipped.** The release exercised the pipeline while the
payload was inert.

Post-deploy validation: `BLOCKED — no approved production fixture`. A green deploy is
not evidence that a user rendered a macro.

Status promotions from this release:

| Item | Was | Now |
|---|---|---|
| `.github/workflows/deploy-stage.yml` deploy job | `STRUCTURAL ONLY` | `LIVE` |
| `.github/workflows/deploy-prod.yml` | `STRUCTURAL ONLY` | `LIVE` |
| `production` environment approval | `LIVE` (configured) | `LIVE` (exercised; the run waited, then proceeded only after approval) |
| `.claude/skills/release-app` | `STRUCTURAL ONLY` | `LIVE` |
| `.claude/skills/land-pr` | `STRUCTURAL ONLY` | `LIVE` — exercised on PR #70, #71 and #72 |
| `.claude/skills/ready-pr` | `STRUCTURAL ONLY` | `LIVE` — readying PR #70 started run 33718091855 on the unchanged SHA, confirming the `ready_for_review` trigger type |

## Credential now lives on the environments

The repository secret `FIREBASE_TOKEN` was deleted on 2026-09-03 after both
environment secrets were verified present and a deploy succeeded through them. Every
job that reads the secret declares an environment: `deploy-stage` uses `stage`,
`deploy-prod` uses `production`. This closes blockers 1 and 2 of the default-branch
section below — a workflow on any historical commit declares no environment, so it
cannot read the secret and its deploy fails. Blocker 3, the smoke test never firing,
still stands.

## Cloud Functions cannot be deployed — nodejs10 runtime decommissioned

Found on 2026-09-03, after the credential was replaced. Run
[33720488945](https://github.com/cloudman-hq/aws-widgets/actions/runs/33720488945) on
`e08ae79` authenticated, resolved the project, and reached
`hosting[awswidgets-stg]: file upload complete`, then failed:

    HTTP Error: 400, runtime: Runtime validation errors:
    [error_code: DEPLOYS_NOT_ALLOWED
     message: "Runtime nodejs10 is decommissioned and no longer allowed.
               Please use the latest Node.js runtime for Cloud Functions."]

for `descriptor`, `installedEndpoint` and `uninstalledEndpoint`.

`functions/package.json` declares `engines.node: "10"`. `firebase.json` has no
`functions` block — the CLI auto-detects the `functions/` directory and includes it.

**Nothing shipped.** `firebase hosting:channel:list --project stage` reported the live
release as `2023-05-06 21:04:17`, and the served page still referenced
`aws-sdk.…ef8d6d3.js` while the built bundle was `aws-sdk.…e2f7a7c.js`. The deploy
aborted before finalising the hosting release, so the failure was closed, not partial.

Both deploy jobs now pass `--only hosting`. The three functions stay on their existing
deployment and keep serving: `https://awswidgets-stg.web.app/atlassian-connect.json`
returns 200 through the `descriptor` function.

`DEFERRED` — migrating the functions to a supported runtime. It needs
`engines.node` raised plus upgrades from `firebase-functions@3.6.1` and
`firebase-admin@8.10.0`, and the Connect install and uninstall webhooks retested. No
change under `functions/` can deploy until that happens.

## Default-branch blocker — this work package does not close the gap it describes

Found by code review of PR #70 on 2026-09-03 and confirmed by measurement. The
repository default branch is `master`. GitHub resolves several things from the default
branch, not from `prod-release`, so four defects survive this branch:

1. **A `release-*` tag on any pre-merge commit still deploys ungated to production.**
   GitHub runs the `deploy-prod.yml` found at the tagged ref.
   `git show origin/master:.github/workflows/deploy-prod.yml` still has no
   `environment:`, no test job, and runs `yarn deploy:prod` directly. Tagging any
   commit that predates this branch bypasses every gate added here. The
   `Protect release tags` ruleset blocks `deletion` and `non_fast_forward`, not tag
   creation on an arbitrary commit.
2. **A pull request into `master` still deploys to stage with the token.**
   `git show origin/master:.github/workflows/deploy-stage.yml` triggers on `push` and
   `pull_request` for `master` and runs `yarn deploy:stage` with `FIREBASE_TOKEN`, no
   lint and no test. `master` is the default branch, so it is the natural target for a
   drive-by pull request, and 37 Dependabot branches are open.
3. **`smoke-test.yml` cannot fire.** `schedule` and `workflow_dispatch` run only from
   the default branch. Merging this branch into `prod-release` leaves the file off
   `master`, so the cron never runs and `gh workflow run` errors.
4. **Workflow lookup by display name fails.** The workflow entity is still registered
   as `Deploy to Stage`, taken from `master`.
   `gh run list --workflow "Build, Test and Stage"` returns
   `could not find any workflows named Build, Test and Stage`. The skills now look
   workflows up by file path (`--workflow deploy-stage.yml`), which is stable across
   renames, so this one is closed inside the branch.

Items 1 to 3 cannot be fixed from a branch that merges into `prod-release`. Two paths,
both owned by the repository administrator:

- **Change the default branch to `prod-release`.** Closes 1, 2 and 3 at once. It also
  retargets what Dependabot opens against and what a fresh clone checks out, and the
  37 open pull requests currently targeting `master` need retargeting or closing.
- **Push the fixed workflows to `master` directly.** Narrower, but a pull request into
  `master` is itself unsafe until the fix lands there, which is defect 2.

Until one of them happens, the claim that production and stage are gated holds only
for commits that carry the new workflow files.

## Merge ordering against the Forge branch

Landing this work package first costs the Forge branch its fast-forward. Exactly one
file is touched by both branches:

```bash
comm -12 <(git diff --name-only prod-release chore/wp1-operational-convergence | sort) \
         <(git diff --name-only prod-release codex/forge-conversion | sort)
# .github/workflows/deploy-stage.yml
```

`git merge-tree prod-release chore/wp1-operational-convergence codex/forge-conversion`
reports that file as `changed in both`; every other Forge path is `added in remote`.
The Forge branch's `1bafdf5 ci: separate legacy PR build from stage deploy` splits the
PR build from the deploy step, which this work package supersedes with the
`Build and Unit Test` job and the event-aware concurrency key. Resolve that one
conflict by keeping this branch's version.

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
3. After merging, run `Production Smoke Test` once by hand
   (`gh workflow run "Production Smoke Test" --repo cloudman-hq/aws-widgets`) to move
   it from `LOCAL` to `LIVE`. It cannot be dispatched before the file reaches the
   default branch.
4. 378 Dependabot alerts stand on the default branch (25 critical, 175 high, 127
   moderate, 51 low), reported by the remote on push. Raising the Node pin is not a
   fix path; see `CLAUDE.md`.
