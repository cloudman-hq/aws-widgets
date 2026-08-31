# AWS Widgets Connect → Forge migration runbook

## Status and non-goals

This runbook describes the approved staged path from the existing AWS Widgets
Atlassian Connect app to the Forge successor. The current branch is for an
independently registered, unlisted development app. It does not authorize a
production deploy, a Marketplace submission, customer communication, Connect
retirement, or exporting legacy secrets outside the Forge runtime.

The production goal is to adopt the existing AWS Widgets Marketplace listing,
not to create a second customer-facing listing. Keep the production Connect
app unchanged until the staged process and post-migration validation have
completed.

## Identity freeze

There are two deliberately different identities during development and
production:

| Environment | Registration/listing | Required identity |
| --- | --- | --- |
| Development | New, unlisted Forge registration in an approved developer space | Separate Forge app ID with `app.connect.key: com.aws.widget.confluence-addon` so migration is testable |
| Production adoption | Existing AWS Widgets Connect Marketplace listing | The same Connect key before the first production deployment; no Connect remote because this successor retains no Connect modules |

The production `app.connect.key` is immutable after the first production
deployment. Treat it as a release-blocking preflight, not a field to add later:

```yaml
app:
  connect:
    key: com.aws.widget.confluence-addon
```

Do not add an invented Connect remote. Atlassian requires one only while a
Forge adoption manifest retains Connect modules. This successor has no
`connectModules`, so the current manifest correctly has no `remotes` block.
The unchanged Connect key authorizes Atlassian's documented app-property
migration API.

The Forge macro module key must remain exactly `aws-widget-macro`, matching the
legacy Connect dynamic-content macro key. A changed key would prevent existing
macro nodes from resolving to the successor module during adoption.

The manifest also declares `connectToForgeMigration` with a `YES` commitment
and the public [customer migration guide](./FORGE-MIGRATION-GUIDE.md). This
replaces Atlassian's generic Connect end-of-support warning with an AWS
Widgets-specific status link. The production-branch URL must be publicly
reachable before the manifest is deployed to production.

## App-account persistence decision

App-account persistence is not required for the current AWS Widgets behavior.
The legacy descriptor exposes only a macro and configuration page, and the
legacy implementation stores app and content properties; it does not depend on
customer-managed permissions for the Connect app account or on modifying pages
or comments created by that account. Atlassian states that migrated apps retain
entity-property access without persisting the Connect app account.

Recheck this evidence before the first production deployment. If production
evidence shows customer-managed app-account permissions or app-authored content
that must later be modified, stop: Atlassian requires the persistence request
to be completed before that first deployment.

## What does and does not migrate

### Macro resource configuration

The legacy macro did not store its resource selection as ordinary macro
parameters. It addressed a Connect content property with a generated UUID; the
legacy key pattern is `aws-widget-macro-<uuid>-body`, and the value contains the
resource selection/body used by the Connect UI.

Forge reads this property as the app using only the page ID and preserved
`uuid` from trusted macro context. The raw value stays server-side and is
normalized to a validated `MacroConfigV1` containing:

```text
schemaVersion, region, resourceType, resourceId
```

Existing Connect macro nodes render without an author edit when the legacy
property is valid. Editing prepopulates the same values and saving converts
them to native Forge configuration. Missing or invalid legacy data fails
closed to the configuration-required state.

### Connect credentials

If Forge secret storage is empty, the successor reads the old
`aws-credentials` app property, derives the original site-bound
CryptoJS/OpenSSL key server-side, decrypts the value, validates it with STS,
then writes it under `aws.credentials.v1`. Nothing is returned to the browser.
A failed lookup, decrypt, or validation writes nothing. Explicit deletion
stores a non-secret `disabled` marker first so the old property cannot be
imported again. Administrators may still replace credentials explicitly.

## Staged production sequence

The sequence is deliberately gated and observable:

```text
staged migration request
        ↓
staged migration approval
        ↓
Forge successor listing approval
        ↓
Atlassian automatic migration
        ↓
site/macro/credential validation
```

### 1. Staged migration request

Before requesting migration, the owner confirms that the Forge app has passed
the development gates and that the production adoption manifest has been
reviewed. Freeze the production identity, preserve the exact macro key, record
the no-Connect-module/no-remote decision, and prepare customer/admin
instructions for automatic continuity, fallback re-entry, and rollback.

Submit the staged migration request through the Atlassian adoption process.
Do not deploy the development identity as a substitute for this request.

### 2. Staged migration approval

Wait for approval before changing the production release plan. Approval is a
platform/process gate; a green build, a successful development install, or an
existing Connect install is not approval. Record the approved scope, listing,
environments, timing, support owner, and rollback contact.

### 3. Forge listing approval

Submit the Forge successor for approval against the existing AWS Widgets
listing. Verify that Marketplace metadata, the production app identity, the
macro key, scopes, egress, privacy/security text, and migration declaration are
the reviewed versions. Do not submit the independent development
listing as a second customer-facing product.

### 4. Automatic migration

After the staged and listing approvals, allow Atlassian's automatic migration
to run. The plan assumes the documented migration window can be as long as 14
days; monitor the platform status and do not force an install or manually copy
tenant data during that window.

Keep the Connect service and its existing listing available while migration is
in progress. No Forge code path should attempt to “help” by calling the old
credential/content-property APIs.

### 5. Validation

Validate representative migrated sites and the agreed customer cohort before
any Connect retirement decision. Record evidence for each item below and keep
the old Connect path available until the owner signs off.

## Validation checklist

Development rehearsal evidence from 28 August 2026 is recorded in
[`../evidence/connect-to-forge-continuity-2026-08-28.md`](../evidence/connect-to-forge-continuity-2026-08-28.md).
It exercises the official same-key replacement path against the public Connect
version on `lite-dev.atlassian.net`; it is not a production approval.

- [ ] Production manifest had `app.connect.key: com.aws.widget.confluence-addon`
      before its first production deployment; no later identity mutation is
      required.
- [x] No Connect remote is declared: the successor retains no `connectModules`,
      and the contract test prevents an accidental `remotes` block.
- [ ] The Forge Marketplace listing is the existing AWS Widgets listing, not a
      duplicate customer-facing listing.
- [x] Forge macro module key is exactly `aws-widget-macro`.
- [x] The manifest declares `connectToForgeMigration`, links the public guide,
      and records `willMigrateToForgeBeforeEOS: YES`.
- [x] App-account persistence is recorded as not required based on current code
      and descriptor evidence; recheck before first production deployment.
- [ ] The production-branch migration-guide URL is publicly reachable before
      the migration declaration is deployed to production.
- [x] A development-site Connect macro node retained its page ID, macro key,
      UUID, content-property value/version, CQL identity, and rendered macro
      placeholder after same-key Forge replacement.
- [ ] Browser Custom UI loads that retained resource selection without an
      author edit; missing/invalid data fails closed.
- [ ] Editing an existing macro prepopulates the migrated region, resource type,
      and resource ID and saves native Forge configuration.
- [ ] A valid legacy credential is decrypted only in Forge, STS-validated, and
      stored as a Forge secret; no credential crosses the bridge or enters logs.
- [ ] Credential save validates first, stores only the installation-scoped
      Forge secret, clears the form, and exposes only status metadata.
- [ ] Resource views use only the approved read-only IAM actions and return
      normalized fields with redacted errors.
- [ ] No credential, raw AWS response, SDK error, content-property value, or
      pagination token appears in the DOM, bridge response, URL, log, or
      analytics event.
- [ ] Missing credential, invalid credential, denied action, missing resource,
      throttling, timeout, and invalid configuration each produce the expected
      safe state; retry is offered only for retryable failures.
- [ ] The observed site/macro cohort, customer support instructions, and
      rollback owner are recorded before Connect retirement is considered.

## Rollback and prohibited actions

Rollback is a release decision. If validation fails,
hold the Forge promotion and keep the existing Connect service available while
the owner follows the platform-supported adoption/rollback procedure. Do not
delete Connect data or silently rewrite page content. Migration reads legacy
values but leaves the original properties intact for platform-supported
rollback.

The following actions are out of scope for this runbook:

- `forge deploy --environment production` or production `forge install` before
  every approval and identity preflight is recorded;
- creating a second Marketplace listing for the same customer-facing app;
- exporting any old credential or content-property value outside the Forge
  runtime;
- changing `aws-widget-macro` to a new Forge macro key;
- running the root Node 10/legacy Connect install or Firebase deployment while
  working on `forge/`; and
- running `npm audit fix --force` without an explicit dependency upgrade plan
  and review.

## Current security and dependency risks

The current audit snapshot is not zero-vulnerability:

- `npm audit --omit=dev` reports 5 moderate findings, 0 high, and 0 critical;
  they are in the `@forge/bridge` dependency chain, including the reported
  `uuid` advisory.
- The full dependency tree reports 12 high and 2 critical findings in the
  development toolchain. The critical `shell-quote` and `websocket-driver`
  findings enter through `@forge/cli 13.4.0` → `@forge/tunnel` →
  `webpack-dev-server`.

CI thresholds the production audit at high severity, but the moderate runtime
findings still need tracking. Keep development tunnel access restricted to the
approved environment, and do not apply a breaking forced audit fix
unattended. Re-run the audit after dependency changes and update this risk
statement with evidence.

## References

- [Atlassian: adopt Forge from Connect](https://developer.atlassian.com/platform/adopting-forge-from-connect/how-to-adopt/)
- [Atlassian: Forge development loop](https://developer.atlassian.com/platform/adopting-forge-from-connect/devloop/)
- [Atlassian: list an adopted app on Marketplace](https://developer.atlassian.com/platform/adopting-forge-from-connect/listing-your-app-on-marketplace/)
- [`forge/README.md`](../README.md) for local commands, architecture, scopes,
  egress, and the IAM policy.
