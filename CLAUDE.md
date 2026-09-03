# AWS Widgets agent guidance

## Project orientation

`cloudman-hq/aws-widgets` is the **AWS Widgets** Atlassian **Connect** app for
Confluence Cloud. The Connect descriptor `functions/atlassian-connect.json` declares
app key `com.aws.widget.confluence-addon`, the `aws-widget-macro` dynamic content
macro, a configure page, and `READ`/`WRITE` scopes. The macro renders AWS resource
cards (EC2, S3, Lambda, ECS, DynamoDB) inside a Confluence iframe.

Hosting is Firebase, not Forge:

| Firebase project alias | Project ID |
|---|---|
| `prod` (also `default`) | `awswidgets` |
| `stage` | `awswidgets-stg` |
| `yanhui` | `aws-widget` |

This repository is **public**. Read [client privacy](docs/policies/client-privacy.md)
before committing anything.

## Hard rules

### Base branch is `prod-release`

GitHub reports `master` as the default branch. `master` is frozen at 2020-06-27 and is
233 commits behind `prod-release`, which carries every change through 2023-05-06.
Branch from `prod-release` and target every pull request at `prod-release`. See
[the git workflow](docs/policies/git-workflow.md).

Never commit feature work directly to `prod-release`: a push to that branch deploys to
the Firebase `stage` project.

### Do not raise the Node pin

`package.json` pins `volta.node` to `10.16.3`. `node-sass@4.13.1` publishes no
prebuilt binary above Node 13; above it, the build falls back to source compilation
through `node-gyp@3.8.0`, which uses Python 2 syntax, and macOS ships no Python 2.
`src/styles/main.scss` and the `sass-loader` entry in `webpack/` still require it.
Raising the pin does not upgrade the toolchain — it replaces webpack 4, node-sass 4,
Storybook 5, and TypeScript 3.8 together.

### Client privacy

Never place a real tenant hostname or prefix, customer page title or ID, cloud ID, AWS
account ID, resource ARN, Connect `clientKey`, shared secret, credential, or
identifying screenshot in a public file. Use placeholders and synthetic fixtures.
`functions/` persists Connect installation records including shared secrets; that
store is production customer data and never reaches the repository.

### UI evidence is mandatory for UI claims

A visible macro assertion passes only after observing the UI through a
screenshot/snapshot or a relevant network intercept. Unit tests and a successful build
are not UI evidence. The macro runs in a cross-origin Confluence iframe. If an
approved fixture or browser path is unavailable, report `SKIPPED` or `BLOCKED` with
the reason. Do not invent a saved browser profile, tenant, page, or selector.

### Protect other sessions

If the current checkout has changes you did not make, do not checkout, reset, restore,
clean, or stash them. Create a separate worktree from `prod-release`.

`forge/` and `zenuml-paywall-controlled-unlock-experiment.md` are known untracked
paths. `yarn-error.log` is tracked and is rewritten by any failed install.

## Toolchain and commands

Node `10.16.3` (Volta), yarn 1.x, webpack 4, TypeScript, tslint, jest 25.

The `yarn` on PATH is the Homebrew Corepack shim. It is ESM and fails under Node 10
with `SyntaxError: Unexpected token ?`. Volta cannot shadow it here — `/opt/homebrew/bin`
precedes `~/.volta/bin` on PATH and no Volta yarn shim exists. Use the image directly:

```bash
export PATH="$HOME/.volta/tools/image/yarn/1.22.19/bin:$PATH"
yarn install --frozen-lockfile
yarn validate
```

`yarn validate` is the secretless/offline local and PR contract. It expands to:

```bash
yarn lint:check    # tslint, no --fix
yarn test --ci     # jest
yarn build         # webpack production, output to build/ (gitignored)
```

Use `lint:check`, not `lint`. The `lint` script passes `--fix` and rewrites source; it
is what the husky v4 pre-commit hook runs, and it must not be the validation gate.

`yarn install` compiles `node-sass` and `fsevents` through `node-gyp@3.8.0`. The
`fsevents` `gyp ERR!` block is optional-dependency noise and does not fail the install.
A yarn cache entry corrupted by two concurrent installs surfaces as
`ENOTEMPTY: directory not empty` — delete the named cache directory and reinstall.

There is no E2E suite in this repository.

## Git, CI, and release operation

- Use a feature branch and pull request for every change.
- Run `yarn validate` before submission.
- The authoritative PR check is `Build and Unit Test`, in the workflow
  `Build, Test and Stage` (`.github/workflows/deploy-stage.yml`).
- Every push to `prod-release` and every pull request into it runs that check. The
  concurrency key includes the event, so a push run and a pull request run for the
  same branch never cancel each other.
- `Deploy legacy Connect app to stage` needs `Build and Unit Test` and runs only on a
  `push` event. It is the only job that reads `secrets.FIREBASE_TOKEN`; pull-request
  jobs receive no secret.
- Production is a pushed tag matching `release-*`, consumed by `deploy-prod.yml`,
  which runs `Build and Unit Test` and then deploys to the Firebase `prod` project
  through the `production` environment. That environment requires a reviewer approval
  and accepts only `release-*` tags, so a tag push waits for a human before it
  deploys. Existing tags: `release-20200612122734`, `release-20230506`,
  `release-20230506-2`. Tag creation is a production action and is never performed by
  branch work.
- Repository controls configured 2026-09-03: `prod-release` requires the
  `Build and Unit Test` check and a pull request, blocks force pushes and deletions,
  and requires conversation resolution; the `production` environment exists with a
  required reviewer; the `Protect release tags` ruleset blocks deletion and
  non-fast-forward on `refs/tags/release-*`. `enforce_admins` is `false` and
  `required_approving_review_count` is `0` on purpose — one maintainer, who cannot
  approve their own pull request. Reasoning is in
  [the port register](docs/ops/pipeline-port-status.md).
- Branch protection matches the check name exactly. Do not add a `strategy.matrix` to
  the `build` job: a matrix appends its value to the check name
  (`Build and Unit Test (10.x)`) and the protection rule stops matching.
- Lifecycle skills follow `conf-app` order:
  `validate-branch` → `submit-branch` → `ready-pr` → `babysit-pr` → `land-pr` →
  `ship-branch` → `release-app`. `release-app` is adapted to this repository's tag
  trigger rather than a GitHub Release object. `pvt`, `spot-check`, and
  `forge-tunnel` are **not ported**: the first two need an approved authenticated
  Confluence fixture for the `aws-widget-macro`, which does not exist, and the third
  is Forge-only. Do not claim they ran, and never present a green deploy as
  user-verified.
- Always label a PR reference with its purpose, never only a bare number.

Project skills live under `.claude/skills/`. Treat a skill as available only after its
first locally scoped, non-deploying preflight has been recorded; otherwise label it
structural or deferred. Current status is recorded in
[the pipeline port register](docs/ops/pipeline-port-status.md).

## Forge migration is out of scope here

A Forge conversion exists on the branch `codex/forge-conversion`: `forge/manifest.yml`
with app ID `bd4e3a18-d223-45bf-a301-b2b4eab5beed`, runtime `nodejs24.x`, and its own
`forge-check.yml`.

Measure its ancestry against `prod-release`, not `master`. `prod-release` is the exact
merge base and an ancestor, so the branch is `prod-release` plus 16 commits and would
fast-forward. `git merge-base master codex/forge-conversion` returns nothing only
because `master` has a different root commit. Merging remains a separate
authorization — it lands a second toolchain and a Forge app identity — but it is not a
history-repair problem.

Do not describe Forge resolvers, Forge KVS, or `@forge/bridge` as current
implementation of this repository. The tracked tree is Connect on Firebase.

## Architecture and layout

- `functions/atlassian-connect.json` — Connect descriptor: app key, macro, scopes.
- `functions/index.js` — `installed`/`uninstalled` lifecycle webhooks and Firebase
  Cloud Functions.
- `src/index.tsx`, `src/RootStore.ts` — frontend entry and MobX-style store root.
- `src/components/` — macro, editor, settings, region selector, and the `Viewer/`
  resource cards.
- `src/**/__tests__/` — jest suites; 7 suites, 12 tests as of 2026-09-03.
- `webpack/` — webpack 4 configuration; production output goes to `build/`.
- `.storybook/` — Storybook 5.
- `docs/policies/` — stable safety rules. `docs/ops/` — operational registers.
