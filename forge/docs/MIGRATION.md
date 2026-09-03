# AWS Widgets Connect to Forge migration

This is a deliberately small, manual migration. It retains the existing
Marketplace/Connect identity and `aws-widget-macro` key, but does not import
Connect credentials or macro configuration.

Before the Forge successor is enabled, an installation administrator must open
AWS Widgets settings and enter a replacement access key and secret access key.
Authors must edit each macro they want to retain and enter its region, resource
type, and exact resource identifier. Existing Connect configuration and
credentials remain in Connect; Forge does not read, decrypt, copy, delete, or
alter them.

The successor supports read-only views of EC2, S3, Lambda, ECS, and DynamoDB.
Credentials are stored only as an installation-scoped Forge secret. AWS calls
run only in the Forge resolver. Keep the Connect app available until this
manual setup has been checked on an approved development site and the
Marketplace adoption review has completed.

Do not deploy to production, publish a Marketplace version, or retire Connect
from this repository workflow.
