# AWS Widgets Connect → Forge migration runbook

## Status and non-goals

This runbook describes the approved staged path from the existing AWS Widgets
Atlassian Connect app to the Forge successor. The current branch is for an
independently registered, unlisted development app. It does not authorize a
production deploy, a Marketplace submission, customer communication, Connect
retirement, or an attempt to copy secrets.

The production goal is to adopt the existing AWS Widgets Marketplace listing,
not to create a second customer-facing listing. Keep the production Connect
app unchanged until the staged process and post-migration validation have
completed.

## Identity freeze

There are two deliberately different identities during development and
production:

| Environment | Registration/listing | Required identity |
| --- | --- | --- |
| Development | New, unlisted Forge registration in an approved developer space | The independent Forge app identity in the development manifest; no Connect adoption fields |
| Production adoption | Existing AWS Widgets Connect Marketplace listing | `app.connect.key: com.aws.widget.confluence-addon` and the reviewed Connect adoption remote, set before the first production deployment |

The production `app.connect.key` is immutable after the first production
deployment. Treat it as a release-blocking preflight, not a field to add later:

```yaml
app:
  connect:
    key: com.aws.widget.confluence-addon
```

The production adoption manifest must also declare the necessary Connect remote
when the retained Connect modules require it. The exact URL and remote key are
not specified by this development branch and must come from the production
release review. The shape is illustrative only:

```yaml
remotes:
  - key: connect-app-server
    baseUrl: <reviewed-legacy-connect-backend-url>
app:
  connect:
    key: com.aws.widget.confluence-addon
    remote: connect-app-server
```

Do not add this production-only identity or an invented remote to the
independent development manifest merely to make CI pass. A remote required by
Atlassian's adoption mechanism does not authorize Forge code to read Connect
app properties or transfer Connect credentials.

The Forge macro module key must remain exactly `aws-widget-macro`, matching the
legacy Connect dynamic-content macro key. A changed key would prevent existing
macro nodes from resolving to the successor module during adoption.

## What does and does not migrate

### Macro resource configuration

The legacy macro did not store its resource selection as ordinary macro
parameters. It addressed a Connect content property with a generated UUID; the
legacy key pattern is `aws-widget-macro-<uuid>-body`, and the value contains the
resource selection/body used by the Connect UI.

Forge intentionally does not read this content property, derive the legacy
encryption context, or request Confluence content-property scopes. Forge macro
configuration is a validated `MacroConfigV1` containing:

```text
schemaVersion, region, resourceType, resourceId
```

Existing Connect macro nodes therefore do not silently acquire a guessed
configuration. They enter a safe “configuration required” state. The author
must edit each affected macro and explicitly choose the region, resource type,
and resource identifier in the Forge editor. This is an intentional data
boundary, not a failed secret migration.

### Connect credentials

The legacy app stored credentials in the Connect app property for
`com.aws.widget.confluence-addon`, with browser-side encryption/decryption and
the old Connect context. Forge never reads, decrypts, exports, re-encrypts, or
accepts that value. It also never uses a Connect `clientKey` or `sharedSecret`
as a Forge credential.

An administrator must enter a new AWS access key, secret access key, and
optional session token in Forge global settings. Forge validates the new value
with STS before saving it under the installation-scoped secret key
`aws.credentials.v1`. A failed validation leaves any existing Forge credential
unchanged. No credential is included in macro configuration, page data, logs,
URLs, analytics, or migration payloads.

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
the approved Connect remote, and prepare customer/admin instructions for
credential re-entry and macro reconfiguration.

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
macro key, scopes, egress, privacy/security text, and the required Connect
remote are the reviewed versions. Do not submit the independent development
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

- [ ] Production manifest had `app.connect.key: com.aws.widget.confluence-addon`
      before its first production deployment; no later identity mutation is
      required.
- [ ] The required Connect remote has the reviewed key, URL, and module usage;
      no development placeholder was deployed.
- [ ] The Forge Marketplace listing is the existing AWS Widgets listing, not a
      duplicate customer-facing listing.
- [ ] Forge macro module key is exactly `aws-widget-macro`.
- [ ] Existing Connect macro nodes show an explicit configuration-required
      state when no Forge `MacroConfigV1` exists; they do not show a guessed or
      stale resource.
- [ ] Authors can explicitly reconfigure region, resource type, and resource
      ID and save the Forge macro configuration.
- [ ] Forge settings starts unconfigured unless an administrator explicitly
      enters a new credential; no Connect credential was copied.
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

Rollback is a release decision, not a data-copy operation. If validation fails,
hold the Forge promotion and keep the existing Connect service available while
the owner follows the platform-supported adoption/rollback procedure. Do not
delete Connect data, invent a credential bridge, or silently rewrite macro
configuration. Because this conversion deliberately does not migrate secrets,
there is no secret-transfer rollback: administrators continue using the old
Connect installation or explicitly enter a new Forge credential.

The following actions are out of scope for this runbook:

- `forge deploy --environment production` or production `forge install` before
  every approval and identity preflight is recorded;
- creating a second Marketplace listing for the same customer-facing app;
- reading or exporting the old Connect credential app property or content
  properties;
- adding Confluence content-property scopes solely to make legacy values appear
  to migrate;
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
