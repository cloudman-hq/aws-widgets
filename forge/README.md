# AWS Widgets Forge

This directory is the independently deployable Forge conversion of the AWS
Widgets Confluence app. It is currently a development-ready, unlisted Forge
app. It is not a production cutover, a Marketplace migration approval, or a
request to retire the existing Connect app.

The production release is intended to adopt the existing AWS Widgets listing.
Development must use a separately registered Forge app and developer space.
Do not point a development deployment at the production Marketplace listing or
at a production Confluence site.

## Runtime and local verification

The legacy application at the repository root is a Node 10/old Connect
toolchain. Run Forge commands from this directory with Node 24 and npm 11. Do
not run the root `yarn install`, root `npm install`, Firebase deployment, or
the old Connect install workflow as part of Forge development.

```sh
cd forge
# Activate Node 24.x and npm 11.x with the version manager used by your team.
# With Volta, the pinned versions are Node 24.20.0 and npm 11.19.0.
node --version
npm --version
npm ci

npm run lint
npm run typecheck
npm run unit
npm run build
npm run forge:lint

# Runs the complete local gate in the same order as CI.
npm run verify
```

`npm ci` uses `forge/package-lock.json`; it does not use or update the root
lockfile. If the shell is still using Node 10, stop and switch runtimes before
installing dependencies. A Volta invocation that does not change repository
files is also valid, for example:

```sh
volta run --node 24.20.0 --npm 11.19.0 npm ci
```

The frontend build emits the three static Custom UI resources consumed by the
manifest. `npm run forge:lint` calls the Forge CLI and fails closed when the
CLI reports an authentication error, including the CLI's known exit-zero
authentication case.

## Development registration and deployment

Register a new, unlisted Forge app in a dedicated developer space before the
first development deployment. Registration is separate from the production
Connect app and its Marketplace listing. Use the Forge CLI or the Atlassian
developer console according to the team's account policy. With the current CLI,
select the dedicated developer space when prompted:

```sh
npx forge login
npx forge register "AWS Widgets Forge" --accept-terms
```

Do not add `--personal`: the current platform rejects personal-app
registration in both existing and newly created developer spaces. The
development app for this repository is a normal unlisted app in the dedicated
`AWS Widgets` developer space.

The registration command may update the development app identity in
`manifest.yml`; review that change and do not replace the production identity.
Only after the owner has approved a development site and Forge environment:

```sh
npm run build
npx forge deploy --environment development --non-interactive
npx forge install \
  --environment development \
  --product Confluence \
  --site <approved-development-site>
```

For a later development upgrade, use `--upgrade` with the same approved site.
Inspect development logs only after an authorized deployment:

```sh
npx forge install \
  --environment development \
  --product Confluence \
  --site <approved-development-site> \
  --upgrade
npx forge logs --environment development --since 10m
```

These commands are intentionally development-only. This repository does not
authorize `forge deploy --environment production`, a production `forge
install`, Marketplace submission, or customer communication.

## Architecture

The three Custom UI surfaces share one resolver boundary:

```text
Confluence macro view ───────┐
Confluence macro config ─────┼─ @forge/bridge invoke ─> Forge resolver
Confluence global settings ─┘                             │
                                                          ├─ @forge/kvs secrets
                                                          └─ AWS SDK v3 ─> AWS APIs
```

The macro view and configuration resources use `view.getContext`/`view.submit`
for macro configuration. Global settings provides write-only credential
inputs. The resolver owns module authorization, strict payload validation,
secret access, AWS SDK v3 clients, response normalization, and public error
mapping. Supported resource types are EC2, S3, Lambda, ECS, and DynamoDB.

The browser never imports the AWS SDK, KVS, or resolver implementation. It
may send a credential entered during the current save operation, but it cannot
read a stored credential. AWS responses are reduced to allow-listed resource
fields before crossing the bridge. Resolver operations are:

* `macro.config.resolve` from the macro surface for server-only Connect
  configuration continuity;
* `credentials.status`, `credentials.validate`, `credentials.save`, and
  `credentials.delete` from global settings;
* `resource.list` and `resource.describe` from the macro surface.

## Credential and configuration lifecycle

Forge stores one versioned record under the installation-scoped secret key
`aws.credentials.v1`. A save first validates the newly entered values with AWS
STS `GetCallerIdentity`, then replaces the prior record. Rotation is therefore
an explicit validated overwrite. Status returns only `configured` and an
optional `updatedAt`; delete calls `deleteSecret` and is idempotent. The UI
clears credential fields after every save attempt and never persists them in
browser storage, URLs, logs, analytics, or error objects.

Installation lifecycle is deliberately simple:

* install starts with no credential;
* a failed validation leaves the existing credential unchanged;
* explicit delete makes the credential unavailable to the app;
* uninstall does not run an export or migration handler; Forge-hosted storage
  is platform-retained for the documented retention window (currently 28
  days), and reinstall uses a new installation partition; and
* a page copy or macro copy carries only non-secret macro configuration.

Existing Connect macros are resolved without author reconfiguration. Forge
uses the preserved `uuid` parameter and trusted page ID to read
`aws-widget-macro-<uuid>-body` as the app, validates and normalizes the legacy
resource selection, and never returns the raw property to the browser.

When Forge secret storage is empty, the resolver reads the legacy
`aws-credentials` app property under the unchanged Connect key. It decrypts
the CryptoJS/OpenSSL envelope only in the Forge runtime, validates it with STS,
and writes it to installation-scoped secret storage before an AWS resource
call. Failed migration writes nothing. Explicit deletion records a migration
tombstone so the old property cannot silently resurrect the credential. See
[`docs/MIGRATION.md`](docs/MIGRATION.md) for the staged production path.

## Identity and production adoption guard

The Forge macro key is intentionally `aws-widget-macro`, exactly matching the
legacy Connect dynamic-content macro key. Do not rename it.

The registration remains unlisted during development, but the manifest
declares the existing Connect key so migration behavior can be exercised on
the approved development tenant and the production identity is frozen before
its first deployment:

```yaml
app:
  connect:
    key: com.aws.widget.confluence-addon
```

Atlassian treats this value as a one-time production identity decision: it must
be correct before the first production deployment and cannot subsequently be
added, removed, or changed. The production adoption manifest must also contain
the necessary reviewed Connect remote when the retained Connect modules require
one. The exact remote key, URL, and retained modules are production release
inputs and must not be invented in the development manifest. An illustrative
shape is:

```yaml
remotes:
  - key: connect-app-server
    baseUrl: <reviewed-legacy-connect-backend-url>
app:
  connect:
    key: com.aws.widget.confluence-addon
    remote: connect-app-server
```

The example is not deployable until the owner has reviewed the URL, remote
usage, and adoption manifest. A Connect remote required for Marketplace
identity/adoption is not permission to export Connect credentials outside the
Forge runtime.

## Scopes and network egress

The current development manifest requests:

* `storage:app` for installation-scoped Forge secrets;
* `read:confluence-content.all` to recover existing macro resource selections;
* `read:app-data:confluence` for one-time server-side credential migration;
* backend fetch egress to `*.amazonaws.com` and `*.amazonaws.com.cn`, because
  the supported region list includes commercial AWS regions plus Beijing and
  Ningxia; and
* no client fetch egress.

The development manifest has no custom remote, web trigger, scheduled trigger,
lifecycle trigger, analytics endpoint, or Connect module. The server accepts only the explicit region and resource
allow-lists. It does not accept a caller-provided AWS endpoint, partition,
command name, or arbitrary URL. AWS GovCloud and custom endpoints are outside
this conversion's supported region set.

Production adoption is a separately reviewed manifest change. Its immutable
Connect identity and any necessary Connect remote must be reviewed before the
first production deploy; those production-only fields are not a reason to
weaken the independent development boundary.

## AWS IAM policy

[`docs/aws-read-only-policy.json`](docs/aws-read-only-policy.json) is the
reference least-privilege resource policy. It grants only:

| Service | Actions |
| --- | --- |
| EC2 | `DescribeInstances` |
| S3 | `GetBucketPolicyStatus`, `GetEncryptionConfiguration`, `GetLifecycleConfiguration`, `GetBucketTagging` |
| Lambda | `ListFunctions`, `GetFunction`, `ListTags` |
| ECS | `ListClusters`, `DescribeClusters` |
| DynamoDB | `ListTables`, `DescribeTable` |

The policy has `Resource: "*"` because the read APIs and selected resource
shapes do not all support a narrower resource constraint in the same way;
customers should narrow it where their AWS account and service support that
without breaking the intended read-only view. The app does not create, update,
delete, invoke, or fetch S3 objects. STS `GetCallerIdentity` is used to
validate a newly entered credential; it is not a resource-view permission and
does not expand the policy file.

## Security limits

The resolver rejects unknown fields and validates bounded identifiers before
KVS or AWS access. It uses service-specific AWS SDK v3 clients, no custom
endpoints, an eight-second request timeout, and at most two SDK attempts. List
operations stop at 500 normalized items or 50 AWS pages and return a limit
error rather than an incomplete list marked complete. AWS pagination tokens do
not reach the browser.

Only normalized, allow-listed fields cross the resolver boundary. Public errors
contain stable codes and retryability, never raw AWS messages, stack traces,
HTTP metadata, SDK objects, or credentials. Logs contain an opaque request ID,
operation, outcome code, and retryability only. Frontend rendering uses text
nodes and has no arbitrary HTML injection or third-party network dependency.

## CI and known risks

[`../.github/workflows/forge-check.yml`](../.github/workflows/forge-check.yml)
checks only the `forge/` subtree with Node 24/npm 11. It installs the Forge
lockfile, runs lint/typecheck/unit/build and the production-dependency audit,
and never registers, deploys, installs, or changes a Forge environment.
Authenticated `forge lint` remains a controlled local/release gate: Forge CLI
13 performs a remote pre-deployment check for the registered app, so running it
in pull-request CI would require storing Forge account credentials there.

The current audit snapshot must be read accurately:

* `npm audit --omit=dev`: 5 moderate findings, 0 high, and 0 critical; the
  findings are in the `@forge/bridge` dependency chain (including the reported
  `uuid` advisory).
* Full-tree audit: 12 high and 2 critical findings, all in the development
  toolchain. The critical `shell-quote`/`websocket-driver` findings are pulled
  through `@forge/cli 13.4.0` → `@forge/tunnel` → `webpack-dev-server`.

This is not a zero-vulnerability result. Do not run `npm audit fix --force`
unattended: it can make breaking dependency changes. Track the production
moderate findings and contain or upgrade the development tunnel/toolchain
findings before exposing development tooling beyond the approved environment.

The development-site Connect-to-Forge rehearsal is recorded in
[`evidence/connect-to-forge-continuity-2026-08-28.md`](evidence/connect-to-forge-continuity-2026-08-28.md).
It proves that Atlassian replaced the public same-key Connect app with Forge
while retaining the fixture macro node, UUID, content property, CQL identity,
and rendered macro placeholder. It does not prove browser Custom UI execution,
legacy credential import, a successful AWS call, or production migration.
Production listing approval, customer credential continuity validation,
fallback re-entry, and Connect retirement remain separate gates.
