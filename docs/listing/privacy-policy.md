# Privacy Policy — AWS Widgets for Confluence

**Vendor:** P&D VISION  
**App:** AWS Widgets for Confluence (app key `com.aws.widget.confluence-addon`)  
**Contact:** support@zenuml.com  
**Effective date:** 9 September 2026

This policy explains what data AWS Widgets for Confluence processes, where it is
processed or stored, and how it can be deleted. It applies to versions of the app
distributed through the Atlassian Marketplace. Because the app is migrating from
Atlassian Connect to Forge, version-specific differences are described below.

## What the app does

AWS Widgets for Confluence displays selected, read-only information about AWS
resources on a Confluence page. An administrator configures AWS credentials, and a
page author selects an AWS region, resource type, and exact resource identifier.

## Data processed by the Forge version

- **AWS credentials.** The app stores the access key ID and secret access key in
  Atlassian Forge KVS secret storage, scoped to the app installation. Stored
  credentials are used only by the Forge backend to sign requests to AWS APIs. The
  secret access key is never returned to browser code, included in macro
  configuration, analytics, or logs.
- **Macro configuration.** Confluence stores the selected AWS region, resource
  type, and exact resource identifier as macro configuration. No AWS credential is
  stored with a page or macro.
- **AWS resource data.** The Forge backend requests the selected resource from AWS
  and returns a bounded, normalized read-only view for display. The app does not
  persist AWS API responses or resource metadata in its own storage.
- **Operational analytics.** If analytics is enabled for the deployment, the app
  sends a small set of product events to Mixpanel using a random,
  installation-scoped identifier. Events do not include AWS credentials, AWS
  account or resource identifiers, Atlassian user identifiers, page content, or raw
  errors. Analytics is disabled when the deployment has no Mixpanel token.

## External processing

- **Amazon Web Services.** Resource requests are sent from Atlassian Forge to the
  AWS regional endpoint selected by the customer. Signed requests include the
  access key ID and selected resource identifier; the secret access key itself is
  not transmitted to AWS. AWS processes these requests under the customer's AWS
  account and AWS agreements.
- **Mixpanel.** When operational analytics is enabled, Mixpanel processes the
  limited events described above. P&D VISION uses them to understand app adoption
  and reliability.

P&D VISION does not operate a separate database containing Forge credentials,
macro configuration, or AWS resource responses.

## Legacy Connect version

The legacy Connect version has a different architecture:

- AWS credentials are stored as an encrypted Atlassian app property and are loaded
  into the app's browser frame to make read-only AWS requests directly from the
  browser.
- Macro configuration includes the AWS region, resource type, and resource
  identifier.
- Installation and uninstallation events send the Confluence site URL, event type,
  and timestamp to a vendor-operated third-party record used for installation
  tracking.

Customers moving to Forge must enter replacement credentials. Legacy credentials
are not imported into Forge.

## Personal data

The app does not intentionally collect or store Atlassian user names, email
addresses, profile pictures, locations, job titles, or user-generated Confluence
content. The Forge version uses only a random installation identifier for optional
analytics.

AWS resource metadata may contain customer-authored names or tags. The Forge app
displays an approved subset transiently and does not persist it. Customers should
avoid placing personal or sensitive information in AWS resource names, identifiers,
or tags selected for display.

## Retention and deletion

- A Confluence administrator can replace or delete the Forge credential from the
  app's global settings. Deletion makes the credential unavailable to the app
  immediately; Atlassian controls any platform backup and uninstall-retention
  lifecycle for Forge-hosted storage.
- Macro configuration follows the lifecycle of the Confluence page and macro.
- Uninstalling the Forge app does not export or copy its secret storage to P&D
  VISION.
- Requests concerning legacy installation records, operational analytics, or data
  subject rights can be sent to support@zenuml.com.

## Access controls and security

The Forge version inherits Confluence permissions for page access. Credential
management is restricted to the app's global settings surface and enforced again
by the backend. Data is transmitted over HTTPS. Application logs are designed not
to contain credentials, raw AWS responses, resource identifiers, tenant identity,
or user identity.

Customers are responsible for granting the configured AWS principal only the
read-only permissions required for the resources they choose to display, rotating
credentials, and removing credentials that are no longer needed.

## Changes to this policy

Material changes will be reflected in this document's Git history in the public
[`cloudman-hq/aws-widgets`](https://github.com/cloudman-hq/aws-widgets) repository.

