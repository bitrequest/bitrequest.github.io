# Security Policy

Bitrequest is a non-custodial, client-side cryptocurrency payment tool. Wallet
seeds and keys are generated and held on the user's own device; Bitrequest never
operates a server that holds user funds or secrets. Because of this, the security
of a Bitrequest deployment depends both on the application code and on how and
where each user runs and backs it up.

We take security seriously and welcome reports from the community.

## Reporting a vulnerability

Please report suspected vulnerabilities **privately**. Do not open a public
GitHub issue, pull request, or forum/social post for a security matter, as that
exposes users before a fix is available.

- **Email:** security@bitrequest.io
- Please include: a description of the issue, the affected component (app,
  payment proxy, WebSocket server, or a specific coin/backend), steps to
  reproduce or a proof of concept, and the version, commit, or URL you tested.

Please give us a reasonable opportunity to investigate and release a fix before
any public disclosure. We will not pursue legal action against researchers who
act in good faith, avoid privacy violations and service disruption, and do not
access, modify, or exfiltrate data that is not their own.

## What to expect

- **Acknowledgement** of your report as soon as we are able. Bitrequest is
  maintained by a single developer, so response times vary; please allow time
  before following up.
- An assessment of the report, and where valid, a fix and a coordinated
  disclosure timeline agreed with you.
- Credit for the report if you would like it, once a fix is released.

## Scope

In scope:

- The Bitrequest web application (`bitrequest.github.io` / `bitrequest.web.app`)
  and its libraries.
- The PHP payment proxy and the Node.js WebSocket server in this repository.
- The official iOS and Android wrappers.

Examples of relevant issues: cross-site scripting or injection, flaws in address
derivation or payment detection that could misattribute or miss a payment,
weaknesses in how encrypted data is handled, request forgery or SSRF in the
proxy, and authentication or origin-validation flaws.

Out of scope:

- Third-party services the app talks to (block explorers, indexers, RPC nodes,
  Lightning backends, image CDNs). Report those to the service concerned.
- Vulnerabilities that require a device already compromised by malware, a
  physically compromised or rooted/jailbroken device, or a user's own
  compromised cloud/backup account. See "Threat model" below.
- Social engineering, phishing of users, and issues in outdated forks or
  modified builds.

## Threat model and user responsibility

Bitrequest is designed to run without a trusted server, including offline and
directly from local files. This has security implications users should
understand:

- **Seed storage.** A wallet seed created in the app is stored on the user's
  device, encrypted under a key derived from the user's PIN; a PIN must be set
  before a seed can be stored. The PIN is a convenience gate intended to deter
  casual access to a device or a stray copy of its data; it is **not** a
  substitute for full-disk encryption or a hardware wallet and should not be
  relied on to protect large balances. Bitrequest is intended for point-of-sale
  use with modest balances. For significant holdings, use a dedicated hardware
  wallet.
- **Backups.** Backup files never contain the wallet seed or private keys. The
  only backup of a seed is the written seed phrase itself, which the app
  requires the user to verify. Backup files are always encrypted: with the seed
  phrase when one exists (restoring on another device then requires entering
  that phrase), and otherwise with a key derived from the user's PIN, which the
  app requires before a backup can be created or shared. A PIN-encrypted backup
  can be brute-forced offline by anyone who obtains the file (a 4-digit PIN has
  10,000 possibilities), and backups do contain payment history, receiving
  addresses, extended public keys, and any API keys the user has configured —
  so backup files should still be kept private.
- **Shared files.** Backups, team invites, and CSV exports can optionally be
  shared through a payment proxy. Shared files are stored encrypted on the
  proxy and are deleted after one week. Shared backups use the same seed- or
  PIN-based encryption as local backup files. Team invites and CSV exports are
  encrypted with key material carried in the app and the share link: this
  protects cached files from casual inspection on the proxy, but anyone who
  holds a share link can decrypt the file it points to. Treat a share link as
  the file itself.
- **Device integrity.** Bitrequest cannot protect secrets on a device that is
  already compromised by malware or physically controlled by an attacker. Keep
  the operating system and browser current.
- **Self-hosting and forks.** Users who self-host the app or run a modified
  build are responsible for the integrity of what they deploy.

## Supported versions

Bitrequest is a rolling release; security fixes are applied to the current
version of the app and the published mobile wrappers. There is no long-term
support for older versions or forks. Always run the latest version.
