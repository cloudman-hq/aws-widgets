---
name: validate-branch
description: Validate a cloudman-hq/aws-widgets branch locally before push or PR submission. Use for branch checks, preflight, tests, builds, or readiness questions in this repository.
---

# Validate Branch

Run the repository's authoritative local validation contract and report UI evidence separately.

## Scope

- Work from the cloudman-hq/aws-widgets repository root.
- The authoritative command is:

    yarn validate

- It expands to `yarn lint:check && yarn test --ci && yarn build`. It is the
  secretless/offline contract used by pull-request CI. It must not require Firebase,
  Atlassian, or AWS credentials.
- Use `lint:check`, not `lint`. The `lint` script passes `--fix` and rewrites source
  files; a validation command must not mutate the tree. The husky pre-commit hook runs
  `lint:check` for the same reason.
- Keep `--ci` when running jest by hand. Without it jest writes new snapshots instead
  of failing on missing ones, which reports PASS where CI reports FAIL.
- Do not replace the contract with a hand-picked subset of checks.
- Do not weaken tests, lint rules, or validation scripts to manufacture a pass.
- There is no E2E suite in this repository. Do not report one.

## Toolchain

This repository is pinned to Node 10.16.3 through Volta, because `node-sass@4.13.1`
publishes no prebuilt binary above Node 13 and its `node-gyp@3.8.0` fallback needs
Python 2. Do not raise the pin to make a command run.

The `yarn` on PATH is the Corepack shim, which is itself ESM and fails under Node 10
with `SyntaxError: Unexpected token ?`. Use the Volta yarn 1 image directly:

```bash
export PATH="$HOME/.volta/tools/image/yarn/1.22.19/bin:$PATH"
yarn install --frozen-lockfile
```

CI does not hit this: `actions/setup-node` with `node-version: 10.x` ships yarn 1.x.

## Preflight

Confirm the checkout and inspect changes without modifying them:

    git rev-parse --show-toplevel
    git status --short --branch
    git diff --name-only
    git diff --cached --name-only

If the working tree contains unrelated changes, preserve them. Do not restore, stash,
clean, or switch over another session's work. `forge/` and
`zenuml-paywall-controlled-unlock-experiment.md` are known untracked paths; leave them.

## Run validation

Run:

    yarn validate

Stop on failure. Identify the first failing stage from the command output and report
the relevant error. A later successful subcommand does not erase an earlier failure.

Do not add credentials to make this command pass. Firebase deployment credentials
belong only to the protected deploy job, never to a pull-request job.

## Classify UI validation

After local validation, classify user-visible evidence independently:

1. Determine the branch base and inspect both committed and uncommitted paths.
2. For process-only changes, confirm that no guarded runtime path changed:
   - `src/**`
   - `functions/**`
   - `public/**`
   - `webpack/**`
   - `firebase.json`, `.firebaserc`
3. If the change has no runtime or user-visible effect, report exactly:

    UI validation: SKIPPED — no runtime change

4. If runtime or user-visible behavior changed, capture screenshot, accessibility
   snapshot, or network-intercept evidence for every UI assertion. The macro renders
   inside a Confluence Connect iframe; do not invent a saved browser profile, tenant,
   page, or selector.
5. If no approved authenticated fixture exists, report UI validation as SKIPPED or
   BLOCKED with the reason. Never infer a UI PASS from `yarn validate`, unit tests, or
   a successful build.

## Result

Report:

    Local validation: PASS | FAIL
    Lint: PASS | FAIL
    Unit tests: PASS | FAIL (with jest suite/test counts)
    Build: PASS | FAIL
    UI validation: PASS with evidence | SKIPPED — no runtime change | BLOCKED with reason
    Branch readiness: READY | BLOCKED

A branch with a required but blocked UI check is not ready to ship.
