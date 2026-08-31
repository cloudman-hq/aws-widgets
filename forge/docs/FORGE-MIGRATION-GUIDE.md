# AWS Widgets migration to Atlassian Forge

AWS Widgets is moving from Atlassian Connect to Atlassian Forge before
Connect end of support on 31 January 2027. The Forge version will replace the
Connect version in the same Marketplace app; customers should not install a
second app.

## What customers can expect

- Existing AWS Widgets macros are intended to continue working without authors
  recreating or reconfiguring them. The Forge macro keeps the existing
  `aws-widget-macro` identity and reads the legacy macro configuration during
  migration.
- AWS access credentials are handled only by the Forge backend. Validated
  credentials are kept in Forge secret storage and are not returned to the
  browser.
- Site administrators may be asked to review and approve an app update if the
  final Marketplace release changes permissions. We will document any required
  administrator action before rollout.
- AWS Widgets remains a read-only resource viewer. The proposed IAM policy is
  limited to read and list actions for the supported AWS services.

## Progress and release gates

Status as of 31 August 2026:

1. **Implementation complete in development.** The Forge successor implements
   the macro, settings, server-side credential handling, and read-only AWS
   resource adapters.
2. **Connect-to-Forge continuity rehearsed.** On a development Confluence site,
   an existing Connect macro retained its page ID, macro key, UUID, legacy
   content property, and rendered placeholder after same-key Forge replacement.
3. **Release validation in progress.** Browser-level validation of the retained
   macro editor and settings flows, plus a successful test with an authorized
   least-privilege AWS test identity, must pass before production release.
4. **Marketplace adoption pending.** The production Forge version will be
   associated with the same AWS Widgets Marketplace listing only after the
   identity, privacy, security, permissions, and support information have been
   reviewed.

No production migration has occurred yet. The existing Connect app will remain
available while release validation is incomplete. A production date will be
published only after the release gates pass.

## Data and account continuity

The migration preserves the existing Connect app key and macro key. Legacy
macro configuration remains in its Confluence content property and is read
server-side; the migration does not delete or silently rewrite page content.

AWS Widgets does not rely on customer-managed permissions for the Connect app
account and does not need to modify app-authored pages or comments. Atlassian
documents that entity properties remain accessible after migration without
persisting the Connect app account, so app-account persistence is not planned.
This decision will be rechecked before the first production deployment.

## Support and rollback

If a migrated macro does not render as expected, do not delete or recreate it.
Keep the page unchanged and report the site, page ID, and visible error through
[AWS Widgets support](https://github.com/cloudman-hq/aws-widgets/issues). Never
include AWS access keys, secret keys, session tokens, or raw resource responses
in a support request.

If production validation fails, rollout will be held and the existing Connect
service will remain available while the supported adoption or rollback path is
followed. Connect data will not be deleted as part of that response.

## Technical release record

The detailed engineering gates and evidence are maintained in the
[migration runbook](https://github.com/cloudman-hq/aws-widgets/blob/prod-release/forge/docs/MIGRATION.md).
