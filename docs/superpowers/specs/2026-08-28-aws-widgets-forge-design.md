# AWS Widgets Forge Conversion Design

**Status:** Owner-approved for implementation

**Date:** 2026-08-28

**Branch:** `codex/forge-conversion`

**Target:** an independently deployable Forge app under `forge/`, with the production Connect app left unchanged

## 1. Purpose and success boundary

This design converts the useful AWS Widgets resource-card experience into a Confluence Forge app. Development uses an isolated, unlisted Forge registration. The production release target adopts the existing Connect Marketplace identity rather than creating a second customer-facing listing. The app lets a Confluence administrator configure one installation-wide AWS credential, then lets authors configure a macro for an AWS region, resource type, and resource identifier. All AWS operations execute in Forge backend code. Neither the macro, macro configuration UI, nor global settings UI receives a stored AWS credential or imports an AWS SDK.

### Release identity addendum

The implementation manifest stays independently deployable in development, but the production adoption manifest must be prepared before its first production deployment with `app.connect.key: com.aws.widget.confluence-addon`. Atlassian documents that this value cannot be added, removed, or changed after the first production deployment. The Forge macro key must be `aws-widget-macro`, matching the existing Connect dynamic-content macro key, so existing macro nodes resolve to the Forge module after adoption.

The Connect application stored resource configuration in a content property addressed by a generated `uuid`, not as ordinary macro parameters. This implementation does not read that property or request Confluence content-property scopes. Existing macro nodes therefore enter a safe configuration-required state until an author explicitly selects region, resource type, and resource ID in the Forge editor. Existing Connect credentials are likewise never transferred; an administrator must enter a new credential through Forge settings.

The implementation is successful when it:

- supplies one Confluence Custom UI macro, a Custom UI macro configuration resource, and a Custom UI global settings page;
- supports read-only views of EC2, S3, Lambda, ECS, and DynamoDB resources;
- stores credentials only through installation-scoped `@forge/kvs` secret operations;
- returns only schema-validated, allow-listed response models and stable redacted errors;
- can be built, linted, typechecked, unit-tested, and Forge-linted deterministically from `forge/`;
- does not change tracked legacy Connect runtime files; and
- can be registered, deployed, and installed in the development environment only after the owner's separate pre-flight approval.

This is a development-ready conversion, not a production cutover. The discovery report found an installed footprint but no trustworthy evidence of active resource-card use. That unresolved product-demand gate does not weaken any security requirement in this design and prohibits treating a successful build as approval to migrate or retire Connect.

## 2. Evidence from the current product

The legacy implementation establishes the parity baseline, not an architecture to copy:

- `functions/atlassian-connect.json` declares a block macro and an installation settings page.
- The macro stores `region`, `resourceType`, and `resourceId` through Connect macro/content-property APIs.
- `src/components/Aws/ResourceTypes.ts` lists EC2 instances, Lambda functions, ECS clusters, and DynamoDB tables; S3 identifiers are entered manually.
- The viewers describe EC2 instances, Lambda functions, S3 buckets, ECS clusters, and DynamoDB tables.
- `src/components/Settings/SettingsStore.ts`, `src/components/App/index.tsx`, and `src/components/App/shared.ts` encrypt credentials using browser-derived context, store them in a Connect app property, decrypt them in the browser, and configure AWS SDK v2 in the browser.

The last item is the decisive defect. The Forge app preserves the user-facing resource types while replacing the browser credential and browser AWS call model completely.

## 3. Chosen architecture and rejected alternatives

### 3.1 Decision

Use a focused Forge rebuild: three Custom UI surfaces invoke one Forge resolver, which owns authorization, validation, secret access, AWS SDK v3 clients, response normalization, and error redaction.

```text
Confluence macro view ───────┐
Confluence macro config ─────┼─ @forge/bridge invoke ─> Forge resolver
Confluence global settings ──┘                             │
                                                          ├─ @forge/kvs secret store
                                                          └─ AWS SDK v3 ─> AWS APIs
```

The browser can send macro configuration and new credential values entered during the current save operation. It can never read a stored credential. AWS responses are reduced to the resource view model before crossing the resolver boundary.

### 3.2 Alternatives considered

| Alternative | Decision | Rationale |
| --- | --- | --- |
| Forge rebuild with installation-scoped encrypted secret and backend AWS SDK v3; isolated development identity followed by existing-listing adoption | **Chosen** | It removes browser credential exposure, needs no new vendor compute path, supports safe development, and preserves the customer-facing Connect identity at production adoption. |
| Runtime Connect bridge for credential/configuration transfer | Rejected | It would preserve legacy runtime coupling and create pressure to read or transfer Connect app properties. This conversion has no authorized secret migration or data bridge. The production manifest may retain the minimum Connect identity remote required by Atlassian's adoption mechanism, but Forge runtime requests do not use it. |
| Forge resolver calling a new vendor-managed AWS gateway | Rejected for this implementation | A gateway adds hosting, tenant mapping, lifecycle, incident-response, and data-residency obligations that are unnecessary for a narrow read-only card. No external vendor backend is needed. |
| Customer-owned role federation with short-lived credentials | Deferred, not rejected as a product direction | It gives stronger credential lifecycle properties, but needs an approved trust exchange, customer onboarding, and a non-production AWS account. The present implementation is explicitly scoped to installation-held credentials. The adapter and credential-provider boundaries must allow federation to replace static credentials later without changing UI contracts. |

## 4. Repository and module boundaries

All new runtime code lives below `forge/`. Legacy root source, Firebase functions, Connect descriptor, package manifests, lockfiles, and build configuration remain unchanged.

The implementation uses these logical boundaries; exact filenames may split further, but dependencies must follow this direction:

| Boundary | Responsibility | May depend on |
| --- | --- | --- |
| `frontend/macro-view` | Load Forge context, request a resource view, render loading/success/error states | shared browser contracts, `@forge/bridge` |
| `frontend/macro-config` | Edit region/type/id, request normalized resource options, submit macro config | shared browser contracts, `@forge/bridge` |
| `frontend/global-settings` | Save/validate/rotate/delete credentials and show configured status | shared browser contracts, `@forge/bridge` |
| `shared/contracts` | Resource/config enums, request and response schemas, UI state mapping | schema library only; no Forge, KVS, or AWS imports |
| `resolver/handler` | Define resolver operations and apply the common request pipeline | authorization, schemas, use cases |
| `resolver/authorization` | Require an authenticated principal and allow each operation only from its declared Forge module surface | Forge invocation context |
| `resolver/credentials` | Secret-store repository and credential status/save/delete use cases | `@forge/kvs`, validation adapter |
| `resolver/resources` | Dispatch list/describe requests by resource type and normalize adapter output | adapter interfaces, schemas |
| `resolver/aws` | AWS SDK v3 client factory, per-service adapters, pagination, timeouts, AWS error classification | AWS SDK v3 packages only |
| `resolver/safety` | Redaction, safe logging, request correlation, public error mapping | shared contracts |

Frontend code must not import `@forge/kvs`, `@forge/api`, AWS SDK packages, resolver implementation modules, or the backend stored-credential type. The settings form has a local write-only input type for values being entered in that browser session; it is not exported through shared contracts. AWS adapters must not know about React, bridge APIs, macro rendering, or KVS.

The manifest declares one Forge function/resolver entry. “One resolver” does not mean one large source file: the entry composes the independently testable modules above.

## 5. Manifest and platform contract

`forge/manifest.yml` defines:

- one `confluence:macro` Custom UI module with a dedicated view entry and Custom UI configuration entry;
- one `confluence:globalSettings` Custom UI module;
- one resolver function referenced by all three UI surfaces;
- Forge runtime `nodejs24.x`;
- static Custom UI resources produced by the frontend build;
- only the `storage:app` scope; the design does not call Confluence REST APIs and therefore requests no Confluence content scope;
- backend fetch egress to `*.amazonaws.com` and `*.amazonaws.com.cn`; and
- no client fetch egress, remote backend, web trigger, scheduled trigger, lifecycle trigger, analytics endpoint, or Connect module.

The China egress suffix is required because the legacy region set includes Beijing and Ningxia. Commercial AWS regions use the first suffix. AWS GovCloud is not in the supported region set. The server accepts only region values from the shared allow-list; it does not accept arbitrary endpoints, custom endpoint URLs, or a user-supplied AWS partition. This prevents the AWS SDK client factory from becoming a general server-side request primitive.

Custom UI Content Security Policy additions are limited to what the compiled local assets require. The build must not add third-party scripts, fonts, frames, images, or browser network destinations. If a dependency requires `unsafe-inline` or another content permission, it must be removed or the permission must receive a separate security review; it is not approved by this design.

## 6. Shared contracts and validation

All resolver operations use strict runtime schemas that reject unknown fields. Strings are trimmed, bounded, and checked before any KVS or AWS operation. No operation accepts an AWS endpoint, credential-store key, SDK command name, field-selection expression, or arbitrary adapter parameters from the browser.

### 6.1 Macro configuration

Forge macro configuration is the source of truth for each macro instance:

```ts
type MacroConfigV1 = {
  schemaVersion: 1;
  region: SupportedRegion;
  resourceType: 'ec2' | 's3' | 'lambda' | 'ecs' | 'dynamodb';
  resourceId: string;
};
```

The configuration is stored by Confluence through the Forge macro configuration submit API, not duplicated in KVS. This preserves normal Confluence page/version/copy behavior: copied macros copy their non-secret configuration and continue to resolve against the destination site's installation-scoped credential. A copied macro never carries a credential.

Validation is type-specific:

- region must be one of the explicitly supported region identifiers shipped in the shared contract;
- EC2 accepts an instance ID in the current AWS short or long form;
- S3 accepts a DNS-compatible bucket name or canonical `arn:aws:s3:::` / `arn:aws-cn:s3:::` bucket ARN and normalizes it to the bucket name;
- Lambda accepts a function name or Lambda function ARN for the selected region;
- ECS accepts a cluster name or cluster ARN for the selected region; and
- DynamoDB accepts a table name or table ARN for the selected region and normalizes an ARN to its table name.

Identifiers have a 512-character upper bound before type-specific validation. Account IDs and regions embedded in ARNs must be syntactically valid and the ARN region, when present, must equal the selected region. Unsupported partitions, qualifiers, aliases, wildcard characters, control characters, URL syntax, and path traversal syntax are rejected as `INVALID_INPUT`.

### 6.2 Resolver envelope

Every operation resolves to one of two envelopes and does not throw a raw error across the bridge:

```ts
type ResolverSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

type ResolverFailure = {
  ok: false;
  error: {
    code: PublicErrorCode;
    retryable: boolean;
  };
  requestId: string;
};
```

`requestId` is an application-generated opaque correlation ID. Responses never include AWS request IDs, HTTP status/headers, SDK metadata, stack traces, raw exception names/messages, raw AWS payloads, or any credential field.

The finite public error codes are:

| Code | Meaning | Retryable |
| --- | --- | --- |
| `INVALID_INPUT` | Request or macro configuration failed validation | no |
| `UNAUTHORIZED` | Principal or Forge surface is not allowed to call the operation | no |
| `NOT_CONFIGURED` | No installation credential exists | no |
| `INVALID_AUTH` | AWS rejected or could not resolve the credential | no |
| `PERMISSION_DENIED` | Credential is valid but lacks the required AWS action | no |
| `NOT_FOUND` | The selected AWS resource does not exist or is not visible | no |
| `THROTTLED` | AWS throttled the request | yes |
| `NETWORK_ERROR` | AWS could not be reached or the bounded request timed out | yes |
| `RESULT_LIMIT` | A list exceeded the safe server-side collection limit | no; manual ID entry remains available |
| `INTERNAL_ERROR` | An unclassified fail-closed error occurred | yes |

The frontend owns user-facing copy for each code. This keeps raw third-party text out of the DOM and makes UI behavior deterministic.

## 7. Authorization and operation flows

The resolver pipeline is identical for every operation:

1. Generate a request ID.
2. Require a Forge-supplied authenticated principal.
3. Match the operation to the expected manifest module key/surface using Forge invocation context. Authorization flags from the payload are ignored and rejected as unknown fields.
4. Parse the payload with the operation schema.
5. Run the use case with a bounded timeout.
6. Normalize the success response or map the failure to a public error.
7. Emit one structured safe log event containing request ID, operation, resource type, outcome code, duration bucket, and retryability only.

Credential write, validation, status, and delete operations are accepted only from the global settings module. Resource list and describe operations are accepted only from the macro module. This is enforced in the resolver even though Confluence controls access to the global settings surface.

The resolver exposes exactly these operation names and payloads:

| Operation | Request payload | Success data |
| --- | --- | --- |
| `credentials.status` | `{}` | `CredentialStatus` |
| `credentials.validate` | `CredentialInput` | `{ valid: true }` |
| `credentials.save` | `CredentialInput` | `CredentialStatus` with `configured: true` |
| `credentials.delete` | `{}` | `{ configured: false }` |
| `resource.list` | `{ region, resourceType }` | `ResourceOptions` |
| `resource.describe` | `MacroConfigV1` | `ResourceView` |

`CredentialInput` contains only `accessKeyId`, `secretAccessKey`, and optional `sessionToken`. The access key is 16–128 printable non-whitespace characters, the secret is 32–256 printable non-whitespace characters, and the optional session token is 16–4096 printable non-whitespace characters. These are defensive transport bounds, not claims that every syntactically accepted value is an AWS credential; STS validation is authoritative. Each credentials operation reparses its own payload, so calling `credentials.validate` first never lets a later `credentials.save` bypass validation.

### 7.1 Global settings flow

The settings UI never loads an existing access key, secret key, or session token. On load it calls `credentials.status`, which returns only:

```ts
type CredentialStatus = { configured: boolean; updatedAt?: string };
```

Supported operations are:

- `credentials.validate`: accepts a newly entered access key ID, secret access key, and optional session token; calls STS `GetCallerIdentity`; returns only a successful validation state or a public error; and does not store the values.
- `credentials.save`: validates the new values first and, only after success, overwrites the single secret-store record. A failed validation leaves the existing credential intact. Overwrite is the rotation mechanism.
- `credentials.status`: reads secret metadata/status backend-side but returns no credential material or identifier fragment.
- `credentials.delete`: calls `deleteSecret`, is idempotent, and immediately returns `configured: false` after the deletion completes.

The UI clears all credential input state after validate, save, navigation, or error. It uses password inputs for the secret and session token, disables browser autocomplete where supported, never persists form state to local/session storage, and never places credential values in URLs, analytics, logs, error objects, or test snapshots.

### 7.2 Macro configuration flow

The configuration UI loads the current `MacroConfigV1` from Forge context, validates it locally for prompt feedback, and repeats validation server-side for every resolver call. Region and type are selected from shared enums.

For EC2, Lambda, ECS, and DynamoDB, the UI may call `resource.list` after region and type are selected. It presents normalized `{id, label}` options and always permits a validated manual identifier so large accounts are not blocked by list limits. S3 is manual-entry only, matching the legacy behavior and avoiding the broader `s3:ListAllMyBuckets` permission.

Submitting calls the Forge macro configuration API with `MacroConfigV1`. Credentials are not part of macro configuration. An existing unsupported or malformed legacy value is not guessed; the editor shows a validation error and requires explicit correction.

### 7.3 Macro view flow

The view loads its macro configuration from Forge context. Missing or invalid configuration produces the local “configuration required” state without an AWS call. A valid configuration is sent to `resource.describe`; the backend revalidates it, reads the installation credential, calls exactly one selected adapter, and returns a normalized view.

The UI state machine is exhaustive: loading, configuration-required, not-configured, invalid-auth, permission-denied, not-found, throttled, network-error, internal-error, and success. Error states use text plus an accessible semantic status, not color alone. Retry is offered only for retryable errors. No UI branch renders exception objects or uses `dangerouslySetInnerHTML`.

## 8. Secret custody and data lifecycle

### 8.1 Storage model

The credentials repository owns one constant key, `aws.credentials.v1`, and one versioned secret value:

```ts
type StoredCredentialV1 = {
  schemaVersion: 1;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  updatedAt: string;
};
```

It writes with `kvs.setSecret`, reads with `kvs.getSecret`, and deletes with `kvs.deleteSecret`. It never uses `kvs.set`, custom entities, environment variables, macro config, content properties, or logs for credentials. Forge automatically scopes KVS keys to the app installation, so site, cloud, account, or installation identifiers are not concatenated into the key.

The credential object exists in memory only for the current resolver invocation and client construction. Repository methods return it only to backend use cases. Types and module exports prevent frontend imports. No cache survives an invocation, and there is no application-level copy or backup.

### 8.2 Lifecycle

- **Install:** Forge provisions an empty installation storage partition. Macro views return `NOT_CONFIGURED` until an administrator saves a credential.
- **Upgrade:** schema version 1 remains readable. A future storage schema change must add an explicit backend migration before changing this contract; silent coercion is forbidden.
- **Rotation:** a successfully validated save atomically replaces the installation's single logical credential under last-write-wins semantics. The prior value is never returned.
- **Explicit deletion:** settings invokes `deleteSecret`; the app treats the credential as absent once the operation completes.
- **Uninstall:** no app lifecycle handler copies or exports data. Forge-hosted storage is soft-deleted and currently retained by Atlassian for 28 days. Reinstallation creates a new installation and does not automatically restore the old partition; any supported recovery requires customer consent and a request to Atlassian within 21 days of uninstall so it can be processed before retention ends.
- **Page or macro deletion/copy:** macro configuration follows Confluence content lifecycle. It contains no secret. Secret lifetime is installation-wide and independent of any page.

The product documentation must tell administrators that deletion in the UI removes the app-visible secret immediately, while platform backup/retention handling follows Atlassian's hosted-storage policy.

### 8.3 No Connect secret migration

The Forge app does not read Connect app properties, derive the legacy browser encryption key, call the Connect lifecycle service, accept exported credential blobs, or use a Connect `clientKey`/`sharedSecret`. Existing Connect credentials are not copied, decrypted, re-encrypted, or silently reused. Administrators must enter a credential explicitly in Forge global settings. Existing Connect macros require explicit Forge macro creation/reconfiguration unless a separate future migration project is authorized.

## 9. AWS adapter contract

### 9.1 Client factory

Only resolver code imports modular AWS SDK v3 packages. The client factory accepts a validated region and an in-memory `StoredCredentialV1`, sets no custom endpoint, enables bounded SDK retry behavior, and supplies an abort signal so an individual AWS call cannot consume the entire Forge invocation. It creates service-specific clients per request; there is no global mutable AWS configuration.

Credential validation uses STS `GetCallerIdentity`. Resource adapters receive a narrow client interface so unit tests can use command mocks without network access. SDK responses never escape an adapter.

### 9.2 Normalized models

List operations return:

```ts
type ResourceOptions = {
  items: Array<{ id: string; label: string }>;
  truncated: false;
};
```

Adapters consume AWS pagination server-side, deduplicate by ID, sort deterministically, and stop before returning more than 500 items or consuming more than 50 AWS pages. Crossing either limit returns `RESULT_LIMIT` rather than a partial list marked complete. AWS pagination tokens are never sent to the browser. Manual identifier entry remains available.

Describe operations return:

```ts
type ResourceView = {
  schemaVersion: 1;
  resourceType: MacroConfigV1['resourceType'];
  resourceId: string;
  region: SupportedRegion;
  title: string;
  fields: Array<{
    key: string;
    label: string;
    value: string | string[];
  }>;
  observedAt: string;
};
```

Field order is defined per adapter. Undefined values are omitted, not converted to the strings `undefined` or `null`. Arrays contain only bounded strings. Tags are formatted as sorted `key: value` strings with per-item and total count limits. No adapter can add an arbitrary field at runtime.

### 9.3 Service behavior and allow-listed fields

| Adapter | List commands | Describe commands | Allowed view fields |
| --- | --- | --- | --- |
| EC2 | paginated `DescribeInstances` | `DescribeInstances` for one instance ID | name/ID, state, instance type, root device type, availability zone, key name, IAM instance-profile ARN, security-group names, private IP, public DNS, tags |
| S3 | none | `GetBucketPolicyStatus`, `GetBucketEncryption`, `GetBucketLifecycleConfiguration`, `GetBucketTagging` | bucket name, public-policy status, default encryption algorithm, lifecycle rule IDs, tags |
| Lambda | paginated `ListFunctions` | `GetFunction`, `ListTags` | function name, runtime, execution-role ARN, last update status, tags |
| ECS | paginated `ListClusters` | `DescribeClusters` for one cluster | cluster name, status |
| DynamoDB | paginated `ListTables` | `DescribeTable` for one table | table name, table status, item count |

The S3 adapter deliberately omits the raw bucket policy even though a legacy component displayed it. Policy JSON is an arbitrary security document and conflicts with the allow-listed display model. Public-policy status preserves the useful exposure signal with less data. S3 auxiliary calls may independently return “unavailable” for fields the principal cannot read; however, invalid authentication, inability to establish that the bucket exists, or total adapter failure returns a top-level error. Partial field omission is deterministic and never includes raw sub-call errors.

Missing resources are detected from both AWS error classification and service-specific empty success responses. For example, an empty EC2 reservation or ECS `failures` entry maps to `NOT_FOUND` rather than indexing into an empty collection or rendering an empty success card.

### 9.4 Least-privilege customer IAM policy

The published policy is read-only and contains only these actions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AwsWidgetsReadOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "s3:GetBucketPolicyStatus",
        "s3:GetEncryptionConfiguration",
        "s3:GetLifecycleConfiguration",
        "s3:GetBucketTagging",
        "lambda:ListFunctions",
        "lambda:GetFunction",
        "lambda:ListTags",
        "ecs:ListClusters",
        "ecs:DescribeClusters",
        "dynamodb:ListTables",
        "dynamodb:DescribeTable"
      ],
      "Resource": "*"
    }
  ]
}
```

The documentation explains that customers may split statements and narrow resources where AWS supports resource-level authorization. The app does not require create, update, delete, invoke, object read, bucket list, CloudWatch, Organizations, or IAM mutation permissions. STS `GetCallerIdentity` is used for validation; AWS documents that it returns identity information even when explicitly denied, so it is not added as a purportedly restrictive policy grant.

## 10. Error classification, redaction, and logging

AWS errors are classified inside `resolver/aws`, using SDK error metadata and service-specific codes only. The public mapper has a deny-by-default rule: an unrecognized error becomes `INTERNAL_ERROR`.

- missing/expired/unrecognized credential and signature failures → `INVALID_AUTH`;
- access denied and unauthorized operation failures after credential resolution → `PERMISSION_DENIED`;
- service-specific absent resource or empty describe result → `NOT_FOUND`;
- throttling and request-limit failures → `THROTTLED`;
- abort, timeout, DNS, TLS, and transport failures → `NETWORK_ERROR`;
- malformed requests caught before AWS → `INVALID_INPUT`.

The logger accepts an explicit `SafeLogEvent` type, not arbitrary objects or exceptions. It must never serialize request payloads, KVS values, AWS command inputs/outputs, SDK errors, HTTP bodies/headers, macro resource identifiers, tags, account IDs, access key IDs, secret access keys, or session tokens. Development logs follow the same rule. A redaction utility acts as defense in depth for credential-shaped strings, but allow-listed structured logging is the primary control.

No raw error is assigned to React state, returned from a resolver, interpolated into HTML, included in screenshots, or saved under `evidence/`.

## 11. Frontend behavior and accessibility

The three frontends share presentational components and state-to-copy mappings but have separate entry points and application state. They do not share mutable credential form state.

- Every form control has a visible label and programmatic association.
- Validation and resolver errors are associated with the relevant field or announced in an `aria-live` status region.
- Keyboard order follows visual order; initial error focus moves to the status heading after submission.
- Loading controls expose busy state and cannot be double-submitted.
- Status meaning uses text/icon semantics in addition to color.
- Credential forms show configured/not-configured and last-updated time only. They never show a masked access key because even a fragment is unnecessary disclosure.
- The success card uses semantic definition-list or table markup, treats every value as text, and renders arrays without HTML injection.

## 12. Testing and verification

### 12.1 Unit and component tests

Tests must be deterministic and make no real Atlassian or AWS calls.

- Schema tests cover every supported region/type/identifier form, normalization, length bounds, unknown fields, partition/region mismatch, and malformed inputs.
- Authorization tests cover missing principal, wrong module surface, and each allowed operation/surface pair.
- Credential repository tests prove only `setSecret`, `getSecret`, and `deleteSecret` are used; save validates before overwrite; failed validation preserves the prior secret; status and delete return no secret; and delete is idempotent.
- AWS client-factory tests prove validated region use, no custom endpoint, in-memory credentials, bounded retries, and abort handling.
- Each adapter uses AWS SDK v3 client mocks and covers success, empty result, multi-page result, result limit, permission denial, invalid authentication, throttling, timeout/network failure, missing resource, and malformed/partial AWS data.
- Contract tests recursively inspect every resolver success/failure and log record to prove it cannot contain the access key, secret key, session token, raw AWS error message, AWS request ID, stack, or unapproved AWS field.
- UI component tests cover every state-machine branch, form accessibility, keyboard flow, error association, focus movement, retry visibility, configuration submit shape, and the absence of secret values from rendered output.

Tests use unmistakably fake credentials and synthetic AWS/account/resource data. Snapshot tests containing whole resolver payloads or credential forms are prohibited.

### 12.2 Static gates

The Forge package exposes deterministic scripts for install, lint, typecheck, unit test, frontend build, and aggregate verification. Verification includes:

- `npm ci` from the committed lockfile;
- source lint and TypeScript typecheck;
- unit/component tests;
- production frontend build;
- `forge lint`;
- a repository scan for credential patterns and real secrets;
- a dependency/import scan proving frontend bundles do not import AWS SDK, `@forge/kvs`, or backend modules;
- a manifest assertion for Node 24, `storage:app`, backend-only AWS egress, and absence of remotes/client egress; and
- a Git diff assertion that no tracked legacy file outside `forge/` changed, apart from separately reviewed root documentation/workflow changes if the implementation plan explicitly calls for them.

Clean verification runs twice after a fresh dependency installation/build. Dependency audit must have no unresolved high or critical production vulnerability; any unavoidable exception requires a separately approved containment record.

### 12.3 Local browser and live development verification

A local browser harness renders all three compiled Custom UI entry points with a mocked bridge. It exercises loading, success, every public error, settings status/save/delete, config selection/manual input, and keyboard navigation. Screenshots and console output are saved under `evidence/`; the console must contain no errors or credentials.

Forge registration, deployment, installation, upgrade, browser interaction on `lite-dev.atlassian.net`, and log retrieval are external state changes and require the owner's exact pre-flight GO. If approved, the implementation registers once, commits that app ID, deploys only to `development`, installs/upgrades only Confluence on `lite-dev.atlassian.net`, and verifies:

- global settings opens and reports not configured;
- dummy credentials can be saved, report only configured status, and be deleted;
- a macro can be inserted and configured for every resource type;
- a dummy credential produces a redacted `INVALID_AUTH` state without breaking the page;
- DOM/network captures contain no stored credential; and
- `forge logs --environment development` contains no secret or raw AWS error.

No successful real-AWS call is required or authorized. AWS success behavior is proven with mocks; the live test exercises only the safe invalid-auth path.

## 13. Delivery sequence

Implementation follows these dependency stages so each boundary can be reviewed independently:

1. Create the isolated Forge package, manifest, build/test scripts, shared contracts, and no-op UI/resolver wiring.
2. Implement authorization, schemas, safe envelopes/logging, and secret repository with red/green boundary tests.
3. Implement the AWS client factory and five adapters with mock-based tests and the IAM policy document.
4. Implement global settings, macro config, and macro view state machines against mocked resolver contracts.
5. Add static safety gates, documentation, local browser evidence, CI, and two clean verification runs.
6. Stop at a reviewable branch/draft PR unless the owner separately authorizes development registration and live verification.

No stage may temporarily route credentials through the browser or commit a weaker “interim” secret store.

## 14. Explicit non-goals

- Production deployment, production installation, merge, Marketplace submission, listing migration, pricing/licensing change, or Connect retirement.
- Modifying, removing, or redirecting the existing Connect app, Firebase lifecycle handlers, legacy frontend, descriptor, or root dependency graph.
- Reading, decrypting, exporting, copying, or bridging existing Connect AWS credentials.
- Automatic conversion or inventory of existing Connect macro instances or tenant content.
- Customer communication, customer-content access, demand inference, or new analytics/telemetry.
- A vendor remote/gateway, database, cache, webhook, scheduler, background job, or long-lived application log.
- Customer-owned AWS federation, IAM role creation, cross-account onboarding, or temporary credential broker in this implementation.
- AWS write actions, Lambda invocation, S3 object/policy contents, CloudWatch metrics/logs, multi-account credentials, per-user credentials, or per-space credentials.
- Resource types beyond EC2, S3, Lambda, ECS, and DynamoDB; GovCloud; custom AWS endpoints; or arbitrary AWS API exploration.
- Exact visual reproduction of the legacy Atlaskit UI or preservation of unsafe legacy behaviors such as raw S3 policy rendering and HTML error insertion.
- Guaranteed availability for accounts whose list results exceed the bounded collection limit; those users enter a resource identifier manually.

## 15. Source basis

This design is grounded in:

- `/Users/pengxiao/.overnight-runs/aws-widgets/2026-08-28-1843/NIGHT-PLAN.md`;
- `forge/AWS_WIDGETS_FORGE_MIGRATION_DISCOVERY.html` in the clean legacy worktree;
- the legacy Connect descriptor and source files cited in section 2;
- Atlassian Forge documentation for [KVS secret storage](https://developer.atlassian.com/platform/forge/storage-reference/kvs-api-secret/), [permissions and egress](https://developer.atlassian.com/platform/forge/manifest-reference/permissions/), [Node.js runtime](https://developer.atlassian.com/platform/forge/function-reference/nodejs-runtime/), [resources](https://developer.atlassian.com/platform/forge/manifest-reference/resources/), and [hosted storage lifecycle](https://developer.atlassian.com/platform/forge/storage-reference/); and
- AWS documentation for [SDK v3 region configuration](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-region.html) and service API/IAM action references.
