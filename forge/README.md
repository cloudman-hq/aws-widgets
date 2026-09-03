# AWS Widgets Forge

This directory contains a minimal Forge successor for AWS Widgets. It is not a
production cutover or Marketplace submission. Develop it only with a separate,
unlisted Forge app and an approved development Confluence site.

## Product scope

The app keeps the existing Connect key and `aws-widget-macro` key for
Marketplace adoption. It provides one installation-wide access-key/secret-key
setting, manual macro configuration (`region`, `resource type`, and exact
`resource ID`), and read-only EC2, S3, Lambda, ECS, and DynamoDB views.

It intentionally does not import legacy credentials or macro settings, list
AWS resources, paginate results, accept session tokens, or offer multi-account
or per-user credentials. Administrators re-enter credentials and authors
reconfigure retained macros manually.

## Security boundary

Credentials are stored only with Forge KVS secret storage. AWS SDK calls run
only in the resolver; browser code never receives a stored credential or raw
AWS response. The resolver authorizes its module, validates fixed regions,
resource types, and identifiers, uses bounded calls, emits safe error envelopes
and logs no secrets or resource payloads. The manifest requests only
`storage:app` plus backend AWS and Mixpanel egress.

## Usage measurement

If the deployment environment has the separately configured `MIXPANEL_TOKEN`,
the resolver sends four narrow events: macro view attempt, macro configuration
opened, macro configuration saved, and AWS describe success or failure. Events
use a random installation-scoped identifier held as a Forge secret. They never
include credentials, AWS account or resource identifiers, page contents, user
identifiers, or raw errors; a failed describe carries only its public error
category. Without the environment token, tracking is disabled.

## Verification

From this directory, with Node 24 and npm 11:

```sh
npm ci
npm run lint
npm run typecheck
npm run unit
npm run build
npm run forge:lint
```

Do not deploy production, publish the Marketplace listing, or retire Connect
as part of local development.
