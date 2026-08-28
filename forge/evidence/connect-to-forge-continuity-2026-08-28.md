# Connect-to-Forge continuity rehearsal — 2026-08-28

Scope: the dedicated `lite-dev.atlassian.net` development site only. No
production deployment, Marketplace version, customer site, or real AWS
credential was changed.

## Baseline

- Marketplace Connect version: `1.1.11-AC` (`1001011`)
- Connect app key: `com.aws.widget.confluence-addon`
- Connect macro key: `aws-widget-macro`
- Public descriptor SHA-256:
  `fb404af8e198722a8343ded1873629af8ec538b310d43d02bc4dbc1c058f6a51`
- Test page: `74383361`, title
  `AWS Widgets Connect-to-Forge continuity 2026-08-28`, in the `OVNT3` test
  space
- Legacy macro UUID: `codex-forge-continuity-20260828`
- Legacy content-property key:
  `aws-widget-macro-codex-forge-continuity-20260828-body`
- Fixture resource: deliberately invalid EC2 identifier; no real AWS
  credential or AWS call was used

The Forge development installation was first removed. The public Marketplace
Connect descriptor was then installed through the Cloud UPM API. UPM reported
the exact app key, version `1.1.11-AC`, and `enabled=true`.

Before adoption, read-only checks proved:

- the page storage body contained `aws-widget-macro` and the legacy `uuid`;
- the legacy content property was readable with its expected region, resource
  type, and resource ID;
- CQL `macro="aws-widget-macro"` returned exactly the fixture page; and
- Confluence's rendered body contained an app reference.

## Adoption result

Running `forge install` for the development environment with the same Connect
key completed successfully. Atlassian replaced the Connect installation with
Forge, which is the documented Connect-adoption path.

After adoption:

- the Forge development installation is `Up-to-date` at app version 3;
- Atlassian's `connect-to-forge adoption-status` reports the manifest as
  `fully adopted on Forge`, with no Connect modules or scopes remaining;
- UPM no longer lists a standalone Connect installation with the old key;
- the original page ID, storage macro key, legacy `uuid`, content-property key,
  property value, and property version are unchanged;
- CQL still returns the original fixture page; and
- Confluence `body.view` renders `AWS Widgets Resource` and no longer references
  `awswidgets.zenuml.com`.

This is real-site evidence that Atlassian maps the existing same-key Connect
macro to the Forge macro while preserving its legacy content data. It does not
prove browser Custom UI execution, editor interaction, legacy credential
import, or a successful AWS resource result. Those gates require a
project-scoped authenticated Playwright profile and, for the success path, an
owner-approved least-privilege AWS test identity. The project profile was
absent, so browser automation failed closed without borrowing another
project's session.
