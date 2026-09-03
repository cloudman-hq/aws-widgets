# Client privacy policy

`cloudman-hq/aws-widgets` is a **public** repository (confirmed through
`gh api repos/cloudman-hq/aws-widgets -q .visibility`). Customer, tenant, and AWS
account information must not be committed.

## Prohibited public data

Do not place any of the following in source, tests, Markdown, screenshots, workflow
artifacts, PR descriptions, logs, or analytics:

- a real Confluence tenant hostname or subdomain prefix;
- a customer page title, page ID, cloud ID, space identifier, or macro local ID;
- an AWS account ID, ARN, resource ID (instance, bucket, function, table, cluster),
  region-plus-account pair, or VPC/subnet identifier belonging to a customer;
- AWS access key IDs, secret access keys, session tokens, or role ARNs;
- Atlassian Connect shared secrets, `clientKey` values, JWT payloads, OTP seeds,
  cookies, or authenticated browser state;
- a raw AWS API response, or a reversible derivative of one;
- complete Connect request context or raw exception text that may embed tenant data;
- screenshots, traces, videos, or URLs that identify a customer.

Use placeholders such as `example.atlassian.net`, `123456789012` for account IDs,
`EXAMPLE`, and synthetic UUIDs. Test fixtures under `src/**/__tests__/` must be
authored as synthetic data; do not "sanitize" a captured customer response into the
public repository unless a separately reviewed process proves that the result cannot
identify or reconstruct customer data.

## Storage location matters here

This app persists Connect installation records — including `clientKey` and the shared
secret — through `functions/` into Firebase. That store is production customer data.
Never copy a record out of it into the repository, a PR, an issue, or a log line, and
never point a test at the `prod` or `stage` Firebase project.

## Artifact routing

- Public repository: synthetic fixtures, placeholder configuration, code, and
  non-identifying aggregate evidence.
- Approved private storage: authorized customer investigations and UI evidence that
  may identify a tenant or an AWS account.
- Local ignored files: credentials, `.env`, `firebase` service-account JSON, auth
  state, and temporary browser output.

Public references to private UI evidence use an approved opaque digest, never a
tenant URL, an AWS console URL, or a screenshot path containing customer details.

## Logging and analytics

New or modified runtime code may record stable event names, outcome/error codes,
resource-type labels, duration buckets, and count buckets. It must not record the
AWS account, resource identifiers, response bodies, tenant identity, complete Connect
context, or raw error messages.

Before committing, inspect every changed and untracked public file. A clean secret
scan does not replace review for page titles, account IDs, and screenshots.

If a legacy artifact exposes tenant or account data through image metadata or another
hidden payload, remove it from the current tree without repeating the identifier in a
public issue or PR. Purging an already-published Git object requires a separately
authorized history rewrite and coordinated force-push; route that follow-up privately.
