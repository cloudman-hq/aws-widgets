# AWS Widgets migration to Atlassian Forge

AWS Widgets is moving to Forge while keeping the existing Marketplace app and
macro identity. This is a manual setup migration: old credentials and macro
settings are not transferred to Forge.

After the Forge version is available, a site administrator enters a dedicated
read-only AWS access key and secret access key in AWS Widgets settings. An
author then edits each retained macro and supplies its AWS region, resource
type, and exact resource identifier. The macro supports read-only EC2, S3,
Lambda, ECS, and DynamoDB views.

Credentials stay in Forge secret storage and are never returned to a browser.
The app calls AWS only from its backend. If a macro has not been manually
configured, it shows a configuration prompt rather than attempting to recover
old Connect data.

The Connect app remains available during review and rollout. No production
migration has occurred yet.

For the seven-day migration usage check, the Forge version can record only
privacy-safe product outcomes: macro view attempts, configuration opens and
saves, and AWS describe success or public failure category. It uses an opaque
installation-scoped identifier and does not send credentials, AWS resource or
account details, page content, or user identity.
