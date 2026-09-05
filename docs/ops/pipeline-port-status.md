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

## First deploy on nodejs22 partly succeeded, then a new blocker

Run [33727207957](https://github.com/cloudman-hq/aws-widgets/actions/runs/33727207957)
on `2a5c057`, the merge of the runtime migration:

    functions[installedEndpoint]    Successful update operation
    functions[uninstalledEndpoint]  Successful update operation
    functions[descriptor]           Successful update operation
    hosting[awswidgets-stg]         file upload complete
    Error: Functions successfully deployed but could not set up cleanup policy
    in location us-central1. Pass the --force option to automatically set up a
    cleanup policy or run 'firebase functions:artifacts:setpolicy' to manually
    set up a cleanup policy.

All three functions deployed on `Node.js 22 (1st Gen)`, confirmed live:
`https://us-central1-awswidgets-stg.cloudfunctions.net/descriptor` returns key
`com.aws.widget.confluence-addon`. Hosting did not release —
`firebase hosting:channel:list --project stage` still reported the release time from
the previous deploy, unchanged.

Not the runtime migration's defect: this is a new Artifact Registry cleanup-policy
requirement in firebase-tools 15, orthogonal to the `nodejs10` → `nodejs22` change.

Fix: `--force` on both deploy commands, per the CLI's own suggested remedy. `--force`
also skips confirming a Cloud Function deletion when source is missing a function
present in the deployed project; `functions/index.js` still exports all three
deployed functions, so nothing is deleted by this change.

## Cloud Functions migrated off nodejs10 — 2026-09-03

Closes the blocker recorded in the next section. `--only hosting` is removed from both
deploy jobs; hosting and functions deploy together again.

| Change | Detail |
|---|---|
| `functions/package.json` | `engines.node` `"10"` to `"22"`; `firebase-functions` `^3.6.1` to `^7.3.2`; dropped `firebase-admin@^8.10.0` and `firebase-functions-test@^0.2.0`, neither of which is imported anywhere under `functions/` |
| `functions/index.js` | `require('firebase-functions')` to `require('firebase-functions/v1')`. v7 exports the 2nd-gen API at the root; these three are 1st-gen HTTP functions whose URLs are referenced by `firebase.json` rewrites and by the Connect descriptor, so the v1 API is imported explicitly and the functions stay 1st-gen |
| `functions/package-lock.json` | regenerated, lockfile version 3, 290 packages |
| `functions/yarn.lock` | removed — two lockfiles for one directory left the server-side install ambiguous |
| `firebase.json` | explicit `functions` block with `source: functions` |
| Both deploy jobs | now run Node 22 rather than the repository's pinned 10.x, install `functions/` with `npm ci`, and deploy through `npx firebase-tools@15.29.0` |

The deploy job never needed Node 10: it uploads a prebuilt artifact and runs the
Firebase CLI. Only the build job needs the legacy toolchain. firebase-tools 8.4.2
recognises `nodejs6`, `nodejs8` and `nodejs10` only, which is why it could not deploy
this runtime; 15.29.0 recognises `nodejs20`, `nodejs22` and `nodejs24`. It still
accepts `--token`, with a deprecation warning, so the existing environment secret
continues to work.

Verified locally before pushing, on Node 24.18.0:

- `npm ci` in `functions/` succeeds.
- `node --check index.js` passes.
- Loading `index.js` exports `installedEndpoint`, `uninstalledEndpoint` and
  `descriptor`, each carrying an HTTPS trigger.
- Invoking the `descriptor` handler with a mock request returns key
  `com.aws.widget.confluence-addon`, `baseUrl https://awswidgets-stg.web.app`,
  `links.self /atlassian-connect.json`, macro `aws-widget-macro`, scopes `READ,WRITE` —
  identical to what production serves.

`STRUCTURAL ONLY` for the deploy itself: no Cloud Function has been deployed on the new
runtime yet. The first push to `prod-release` is that test.

## Cloud Functions cannot be deployed — nodejs10 runtime decommissioned (RESOLVED, see above)

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

## Forge macro does not render — real UI verification, 2026-09-04

Found by actually opening the macro in a browser, on the real `lite-dev.atlassian.net`
development install (installation `a8345426-bea2-42e8-9ade-3b3dc888ce85`), after the
simplified branch was merged and deployed.

**Steps taken, all `forge` CLI, account `eagle.xiao@gmail.com`:**

1. `npm approve-scripts @forge/cli` — the CLI binary was missing because `npm ci`
   blocks postinstall scripts by default; approving `@forge/cli`'s own postinstall is
   what creates `node_modules/.bin/forge`.
2. `npm run build` in `forge/` — required; `forge lint` reported three
   `valid-resource-required` errors for missing `dist/macro-view`,
   `dist/macro-config`, `dist/global-settings` before this.
3. `forge lint --fix` — fixed one deprecation warning (egress permission format).
4. `forge deploy -e development --approve MAJOR_VERSION_RULE` — succeeded, app
   version 4.0.0. The approval flag was needed because the new `api.mixpanel.com`
   egress domain triggers Atlassian's major-version-upgrade gate. Deploying to
   `development` has no customer impact; this account's rights on this specific app
   were unverified before this — confirmed now.
5. `forge install --upgrade -e development -s lite-dev.atlassian.net -p confluence` —
   succeeded, upgraded the existing install from app version 3 to 4.

**Verification, in the real browser (Chrome, the user's authenticated session):**

- Opened the known fixture page (`74383361`, `OVNT3` space, documented in
  `forge/evidence/connect-to-forge-continuity-2026-08-28.md` as rendering
  `AWS Widgets Resource` at app version 3). After the upgrade to version 4, the page
  shows only its static text; no macro card, no error placeholder, nothing.
  Screenshot: `forge-fixture-page-blank.jpg`.
- Confirmed via `GET /wiki/rest/api/content/74383361?expand=body.storage`: the macro
  placeholder is still present in the page (`<ac:structured-macro ac:name="aws-widget-macro" ... ><ac:parameter ac:name="uuid">codex-forge-continuity-20260828</ac:parameter></ac:structured-macro>`),
  and `"macroRenderedOutput":{}` is empty.
- Inserted a **fresh** instance of the macro (no legacy `uuid` parameter) on a new,
  unpublished draft page in the same space, to isolate whether the failure is
  specific to legacy-adopted instances. The macro-config Custom UI opened as a modal
  and rendered completely blank — no form, no error, no content.
  Screenshot: `forge-macro-config-blank-modal.jpg`.
- `read_network_requests` during that modal load showed 12 POSTs to
  `web-security-reports.services.atlassian.com/csp-report/confluence-frontend` and no
  request to any Forge invocation or resource domain — the browser attempted to load
  something the page's Content Security Policy rejected, and whatever that was never
  reached the app.

**Conclusion: the Forge app does not render in the browser at all**, for a
legacy-adopted macro instance or a freshly inserted one. This is not the
"admin must reconfigure" tradeoff the simplification intentionally accepted — it is a
render failure with no observable path to a working state, discovered only by real
UI verification. It is `FAILED`, not `BLOCKED`: the deploy path itself works; what
Confluence renders does not.

**Not yet root-caused.** Two candidate directions, neither confirmed:

- A CSP violation for a Custom UI resource — possibly related to the manifest change
  in the same commit that added `api.mixpanel.com` to `permissions.external.fetch`,
  since Custom UI content-security-policy directives in Forge are partly derived from
  declared external domains.
- Something specific to this account/site pairing — untested against a second site or
  a clean install with no prior Connect-adoption history.

No further deploy to any environment should happen until this is understood. This
finding supersedes the earlier "no PVT fixture" gap: the fixture existed and was used;
the app failed it.

### Correction, 2026-09-04 — the CSP lead was a capture-window artifact; re-verified with four targeted checks

The original write-up above overstates two pieces of evidence and understates one. The
render-fails conclusion and the deploy freeze both stand; the **candidate direction
naming CSP is retracted** and replaced below.

**What was wrong:**

- `macroRenderedOutput: {}` is not evidence for anything here — that field belongs to
  the Connect/server-macro rendering path and is not populated for Forge Custom UI
  macros. It should not have been cited as supporting evidence.
- The "12 CSP violations, zero app requests" reading came from calling
  `read_network_requests` several seconds *after* clicking insert — the tool's own
  output states tracking starts only when first called for a tab. **Redone with
  tracking started before the click**: zero CSP violation reports, in either the
  legacy-fixture-page load or the fresh-insert flow. That lead does not reproduce.

**Four checks run, each read directly rather than assumed:**

1. `forge install list` — installation `a8345426-bea2-42e8-9ade-3b3dc888ce85` reports
   **app version 4, Up-to-date**. Rules out "looking at code that isn't actually
   live."
2. `forge logs -e development --since 2d -n 500` — **zero log lines**, i.e. the
   `resolver` function (`manifest.yml`: `macro.resolver.function: resolver`) has not
   been invoked once in the last two days, across every attempt including the ones
   below. This is Atlassian's own invocation telemetry, not a client-side
   observation.
3. `GET /wiki/rest/api/content/74383361?expand=body.view` (the apples-to-apples
   comparison the original write-up skipped, having compared `body.storage`
   instead): `body.view` is 103 bytes —
   `<p>Disposable migration continuity fixture. No real AWS credentials.</p><div>AWS Widgets Resource</div>`.
   "AWS Widgets Resource" is the macro's `title:` from `manifest.yml` — Confluence's
   content API is emitting the macro's configured title as a fallback, meaning the
   macro instance is recognized server-side. The live rendered page does **not** show
   that div at all; only the static paragraph appears. The API-level fallback and the
   client-side render disagree, which itself is a data point (client hydration never
   reaches even that fallback).
4. Real-browser reproduction redone with `read_network_requests` tracking started
   *before* the triggering action, on both flows:
   - Legacy fixture page (`74383361`) load: 65 requests captured, standard Confluence
     bootstrap only. **Zero requests to any Forge resource domain, zero CSP reports.**
   - Fresh macro insertion (draft page `78151681`, `OVNT3`): inserted via the editor's
     `/` macro picker (confirms Confluence's editor sees the macro as installed and
     selectable — matches check 1). On insert, the macro-config dialog opens and
     stays blank, matching the earlier screenshot. Network capture during that window:
     **3 requests total** — one Chrome-extension asset (unrelated noise from the
     browser profile), one Atlassian telemetry beacon, one `as.atlassian.com` batch
     call. **No Forge resource request, no CSP report.**
   - `read_page` on the open dialog shows Confluence *did* mount a host container for
     the app — `dialog > generic "Embedded app content for
     bd4e3a18-d223-45bf-a301-b2b4eab5beed"`, matching `manifest.yml`'s `app.id`
     exactly — but nothing renders inside it and no iframe ever requests a resource.

**Sharper conclusion.** The failure is not a blocked resource request (no such
request is ever made, so a CSP explanation requires a request that never happens).
The consistent pattern across the legacy instance, a fresh instance, and the resolver
telemetry is: **Confluence recognizes and mounts the app's host container, but never
populates it with a working iframe**, and correspondingly never calls the backend.
This points at the Custom UI iframe-host bootstrap for this specific app/macro
registration, not at network-level blocking. Still not root-caused — the next
diagnostic step is comparing against a Forge Custom UI macro in the same space that
*is* known to render (`My API Documents`, app `8ad26115-211f-4216-971b-0540f606303d`,
also visible as an "Embedded app content for …" container in the same page's
accessibility tree) to see whether that one actually populates its iframe, which
would isolate the defect to this app's manifest/resource declaration rather than
something wrong with Forge Custom UI macros on this site generally.

The deploy freeze from the original finding stands unchanged.

### Correction, 2026-09-05 — `forge tunnel` rules out the deployed bundle

Ran `forge tunnel -e development` (local port 49936, confirmed alive throughout via
`TaskOutput`) and redid the fresh-insert flow on a new draft page (`79200257`; the
earlier draft, `78151681`, had gone edit-restricted for this browser identity — an
access-scope issue, not a Forge issue). Network capture again started before the
insert action.

Result: the macro-config modal opens blank, exactly as under the normal deploy.
Console: zero errors. Network: **2 requests total, both Atlassian telemetry — zero
requests, to any destination, including `localhost:49936`.**

This is the discriminating result `forge tunnel` exists to produce: if the deployed
CDN-hosted Custom UI bundle were the problem, tunnel mode redirects that same request
to the local dev server, and it would show up hitting port 49936. It does not. The
iframe host never attempts to load *anything*, under either serving path. That rules
out a broken deployed resource as the cause, on top of already ruling out CSP
blocking (check 4 above) and a stale install (check 1 above).

**Conclusion, updated:** the defect is upstream of resource serving entirely. Something
in how this app's `macro-config` Custom UI is registered or resolved by Confluence
never results in an iframe element being given a `src` to request — independent of
what would be served at that URL. The next comparison (the `My API Documents` Forge
app in the same space, app id `8ad26115-211f-4216-971b-0540f606303d`) is what would
show whether this is specific to this app's manifest/resource declaration or a
site-wide condition affecting Forge Custom UI macros generally on this install.

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
