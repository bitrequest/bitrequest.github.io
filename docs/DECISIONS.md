# Bitrequest — Design Decisions

This document exists because code shows *what* was built, not *why*. Some of
these tradeoffs look, in isolation, like they could be "improved" — a
stronger KDF, a stricter validation, a smaller dependency footprint. Before
changing any of them, read the reasoning below. Most were arrived at only
after trying the alternative.

If you're an AI reading this to extend or audit Bitrequest: treat every
entry here as a constraint discovered through years of production use, not
a placeholder waiting to be optimized away.

## Governing principle

**Security scales with what's actually at stake, not with what's
theoretically possible.**

Public-key-level operations (viewing addresses, generating payment
requests, scanning for incoming payments) favor UX and low friction.
Secret-key-level operations (the seed phrase, spend authority) inherit
their security from something the user has already secured themselves —
the seed phrase they wrote down — rather than from additional in-app
protection layered on top of it.

This isn't a security-vs-convenience compromise reluctantly accepted. It's
the deliberate position: the core product goal is accepting crypto within
one minute, and every security decision is weighed against setup
abandonment. Most people evaluating "should I add a password/passphrase/
extra step" get this backwards — they treat friction as free and only
count the security benefit. Here, friction has a measured cost: users who
bail during setup. See every entry below for a specific application of
this principle.

---

## Seed / PIN / backup handling

### The PIN-to-seed KDF is deliberately weak

`pin_to_encryption_key` maps a 4-digit PIN through a wordlist + seed_id via
a single HMAC-SHA256 — no iteration, no stretching. Effective entropy is
~13.1 bits (the wordlist mapping collapses 10,000 possible PINs to 8,592
distinct AES keys; it adds zero entropy and loses keys to collisions).

This is known and accepted, not an oversight. Since the code is open
source, an attacker with the encrypted blob brute-forces it in a trivial
script regardless of iteration count in the 4-digit-PIN search space — no
realistic amount of stretching turns a 4-digit PIN into something a
targeted attacker can't break. The PIN realistically defends only against
*incidental* discovery of a backup/localStorage blob (a phone found on the
street, a backup file that leaked without the finder knowing what it is),
not a targeted attacker. Encrypted-but-weak beats plaintext for that threat
model, and that's the actual bar being cleared.

**Planned hardening (not yet implemented):** version the `datenc` blob
(`{id, dat, v}`, absent `v` = v1). `pin_key_v1` stays untouched;
`pin_key_v2` drops the wordlist mapping and runs SJCL `pbkdf2`
(synchronous — fits the existing Deferred flow; WebCrypto was rejected
here because it's async-only and raises secure-context/`file://` issues,
which conflicts with the download-and-run constraint below). The derived
key gets cached in `glob_let` at unlock and reused per address, so the
PBKDF2 cost lands once per session, not once per address — this is what
makes the hardening free in practice. Migration v1→v2 happens silently on
successful unlock. An optional `v:3` (real-entropy passphrase, PIN staying
default) was scoped but not committed to.

**Do not** bother replacing `generate_hash` (djb2, used for the stored
PIN-hash comparison) — with a 10,000-value input space, hash quality
there is irrelevant. Fixing the KDF fixes the actual exposure; fixing djb2
fixes nothing.

### The seed phrase is never included in backups

Former behavior had an opt-in (with a risk warning) to include the seed in
an encrypted backup file. This was removed entirely — `bitrequest_bpdat`
is now unconditionally excluded at compile.

**Reasoning:** an encrypted seed-in-backup is at best equal to, and
realistically worse than, the paper seed backup the app already forces
(3-random-word verification; the app stops functioning after 12 hours or
2+ requests without it). Writing a secret down is writing a secret down —
digitizing it and encrypting it doesn't remove the requirement, it just
adds a second copy with its own attack surface (weak PIN-derived
encryption, cloud storage exposure) for no offsetting benefit. A
passphrase-encrypted variant was considered and rejected on the same
grounds — it still requires the user to remember or write down something
new, which is the exact failure mode a paper backup already solves better.

**Backup lock scheme:** seed present → backup encrypted by the seed phrase
itself (`b39` lock). No seed → PIN-encrypted (`pn` lock), with backup/share
entry points forcing PIN creation first. Recovery auto-decrypts when the
matching local pin/seed exists, otherwise prompts. Legacy `rd`-locked and
seed-containing backups remain restorable — old backups are never orphaned
by a scheme change.

### Custom password for seed encryption — rejected as a general mechanism

Considered and explicitly rejected, not just left undone. It works against
the app's simplicity focus, adds a real risk (users forgetting a password
they set once and rarely re-enter), and would require re-entry every time
the phrase is viewed or a new address is derived — reintroducing exactly
the friction the PIN-based flow was designed to avoid. If you're tempted
to add this back, the tradeoff hasn't changed; re-read the governing
principle above first.

### Leaving PIN-encrypted-seed-in-localStorage as the overall design

Removing the local seed entirely in favor of xpub-only/derived-key
operation is more secure in the abstract, but it trades a contained risk
(weak local encryption) for a worse one (users who never write down their
recovery phrase because the app never surfaces it to them, then lose
funds on device loss with no recovery path at all). Today, the phrase is
always retrievable from the app, like most self-custody wallets. Anyone
who wants the more locked-down posture already has it: team invites are
xpub-only and seedless by design.

### Nano, Monero, Nimiq require the local seed — no xpub support

These three coins don't support extended public keys, so their address
derivation (`derive_nano_account(seed, index)`,
`derive_nimiq_account(seed, index)`) requires the seed to be present
locally. This is a protocol constraint, not a Bitrequest choice — team
invites for these coins currently accept address reuse rather than a
derived pool, deferred until a user actually asks for a pool (traffic is
low enough that this hasn't mattered yet).

---

## Architecture constraints

### No build tools, no bundler, no Node.js dependency for the app itself

"Download `index.html` and run" is a hard constraint, not a preference.
The PWA runs straight out of the box on GitHub Pages — no install step, no
build pipeline, no server. This is treated as the single greatest selling
point of the app: it works when infrastructure someone might normally
depend on (an app store, a company's servers, a domain that can be seized)
is exactly what's under pressure. Any dependency or tooling choice that
would break "clone and open in a browser" needs a very strong justification
to be accepted.

### jQuery stays

With the volume of DOM manipulation in this codebase, jQuery shrinks the
code rather than bloating it. This isn't nostalgia — it was evaluated
against removal and kept on the actual merits for this specific app's
shape, not as a default.

### sjcl.js — kept in full, not trimmed or replaced

Explored replacing the deprecated `sjcl.js` with hand-rolled pure-JS hash
primitives, and separately with `@noble/hashes`. Both rejected:
- **WebCrypto**: async-only (breaks the synchronous Deferred-chain flow
  used throughout), and no RIPEMD160 support (needed for Bitcoin-family
  address derivation).
- **`@noble/hashes`**: ESM-only, which breaks `file://` loading — directly
  conflicts with the download-and-run constraint above — and nearly
  doubles the payload.

Full `sjcl.js` (hashes, HMAC, PBKDF2, AES-GCM) is the accepted dependency.
The "trim it down" and "hand-roll it" paths were both built far enough to
evaluate, then explicitly dropped — this isn't an unexplored option.

### Crypto libraries extracted as standalone, dependency-free packages

`crypto-utils-js`, `xmr-utils-js`, `bip39-utils-js` are published
separately, each zero-dependency vanilla JS. They target drop-in
`<script>` tag usage for front-end projects specifically — not NPM/Node
consumption, since Node-oriented crypto libraries are already
well-served. This extraction serves both reusability and, incidentally,
succession: someone rebuilding or auditing Bitrequest's crypto core can
verify these libraries in isolation via their own public test suites,
without needing the whole app.

### Ed25519 primitives consolidated, not duplicated

Ed25519 curve/point operations live once in `crypto_utils.js` and are
reused by `xmr_utils.js`, rather than each library carrying its own copy.
Applies the same logic to any future coin sharing a curve — Zano's
integration already reuses these primitives; a future Pallas/Vesta module
for Orchard-based coins (Zcash, Dash Evolution shielded) would follow the
same pattern rather than reinventing curve arithmetic per coin.

---

## Per-coin scanning strategy

### Monero: local scanning via viewkey

Transaction scanning is fully client-side: view tag optimization, output
key verification, RCT amount decryption (`sc_reduce32` for scalar
reduction), encrypted payment ID decryption. No remote service sees the
viewkey or the scan results. This is the model considered to have worked
well and is the template for future privacy-coin integrations.

### FCMP++/Carrot: reactive fix, not preemptive rebuild

When Monero's FCMP++ hard fork lands, the client-side scan path breaks
(address derivation for legacy-hierarchy wallets is unaffected, but the
enote scan path is fully replaced). The decision is to fix this *after*
the fork activates, accepting a short window of undetected payments,
rather than building speculatively against a pre-fork spec that could
still change.

**Reasoning:** Bitrequest is a payment *observer*, not a processor — it
never custodies funds or executes anything, it detects whether a payment
arrived. A few days of a scanner silently missing new-format transactions
is a degraded UX, not a loss event. This risk tolerance is specific to
Bitrequest's role; it would not be an acceptable tradeoff for something
holding or moving funds.

### Zano: remote scanning (working dummy fork, not yet local)

Unlike Monero, the current Zano integration scans remotely rather than
locally. This is a known gap relative to the Monero model, not the
intended end state — noted here so a future contributor doesn't mistake
it for a considered privacy tradeoff. It's a stepping-stone
implementation.

### Privacy coin roadmap sequencing: wait for maturity, don't build ahead

Order of operations: (1) confirm FCMP++ compatibility once it's actually
live, (2) let Zcash-shielded, Dash-Evolution-shielded (Zcash Orchard
technology, live since Aug 2026), and full local Zano scanning mature
before implementing, rather than building against specs that are still
settling. This mirrors the FCMP++ reactive-fix reasoning above — building
early against a moving target costs more than it saves when the project
has no deadline pressure.

Dash-shielded and Zcash-shielded share the same Orchard cryptographic
core (Halo 2, Pallas/Vesta curves), so implementing one is expected to
substantially de-risk the other.

---

## Historical fiat rate matching (volatility compensation)

When a request is denominated in fiat, time passes between creation and
payment, and crypto price moves in that window. `monitors.js` records the
rate at creation, fetches the historical rate at payment time, and decides
paid/insufficient against the *historical* fiat value — so a merchant
quoting in EUR doesn't eat volatility. This is considered one of the app's
most important and distinctive features, and the matching logic is the
highest-stakes path in the file: it decides whether someone is marked as
paid. Treat changes here with the same care as crypto-core changes.

### Two-stage rate resolution with multi-provider fallback

Fiat→USD (fixer / currencylayer / exchangeratesapi) then USD→crypto
(coingecko → coinpaprika → coincodex → coindesk → coinmarketcap). Each
provider has its own response shape, parsed into a common
`{timestamp, price}` by a per-provider `parse` function in
`HISTORIC_CRYPTO_API`. CoinGecko is deliberately excluded as the *fiat*
provider (`init_fiat_history`) but used first as the *crypto* provider.

**Timestamp unit invariant:** every provider parser and the transaction
timestamp (`transactiontime`) must be in **milliseconds**.
`normalize_timestamp` and `to_ts` (in `core.js`) both return ms; the inline
`+60000` nudges in the coincodex/coingecko parsers are ms. `match_price_timestamps`
compares provider timestamps against the transaction time with a bare `>`,
so if any one parser ever returns seconds, that provider silently always- or
never-matches while the other four mask it. Verified consistent as of the
Sep 2026 audit — re-check this invariant when adding a provider.

### The `fetched` flag gates confirmation, not accumulation

`match_price_timestamps` returns the first price point *after* the
transaction timestamp (`fetched: true`). If none exists — the data ends
before the transaction, which happens for very fresh payments against
coarse candle intervals — it falls back to the last available price and
sets `fetched: false`.

For years this flag was computed three ways and **read nowhere** — a
fallback price confirmed a payment identically to a real match. This was
an unfinished safety check, not dead code (an old backup shows the same
non-gate written more verbosely). The Sep 2026 fix wires it: a
`fetched: false` price still *accumulates toward the amount* (so the UI
shows a provisional value), but can no longer *confirm* the payment — the
confirmation check in `fetch_crypto_rates` requires `historic_object.fetched`.
A stale-priced request stays `pending` and re-resolves on a later scan
(on a new confirmation, or via the 10-minute refresh window in
`init_fiat_history`). Rationale: the fallback fires exactly when the
historical price is missing, which is exactly when mispricing is most
likely — so it must never be the basis for "paid." Do not "simplify" by
deleting the flag; that silently restores fallback-as-match.

### Underpayment margin: absolute + proportional, no upper bound

Legitimate shortfalls come from two independent sources, so the tolerance
combines two floors and accepts the more lenient (`Math.min`):

- **Rounding** — payer wallets round fiat→crypto. Roughly *absolute* (a few
  cents), dominates tiny amounts. Covered by a **10¢** absolute slack.
- **Volatility** — price drifts between request and payment. Roughly
  *proportional*, dominates large amounts. Covered by a **3%** margin.

The old code used a single size-keyed percentage (`< $2 ? 40% : 3%`) whose
comment wrongly claimed "5%". The 40% small-amount branch was really
compensating for rounding with a proportional tool — structurally wrong,
and a $1.50 request was accepted at $0.90. The absolute+proportional split
is both tighter (a $2 request now needs $1.90, not $1.20) and honest about
what each number compensates for.

**3% is coupled to candle interval:** `get_historical_interval` can select
buckets up to 2h, so the matched "historic price" can be up to that far
from the real payment moment. Don't tighten below 3% without accounting for
that coupling — you'd start rejecting valid payments priced against coarse
candles.

**No upper bound by design.** Bitrequest autofills the amount into the
payment URI, so most wallets pay the exact requested amount. Overpayment is
the payer's concern, not the merchant tool's — `>=` is intentional, there
is no "you overpaid" rejection. (The wiki's mention of over/underpayment
*display* refers to the passive historic-value readout, not an active
status branch — reconcile the wiki wording if it reads as more than that.)

### Two separate match loops — intentional, not accidental duplication

`validate_payment_amounts` (crypto-denominated requests, flat 3% margin)
and `fetch_crypto_rates` (fiat-denominated requests, absolute+proportional
margin) run near-identical accumulate-reverse-compare-trim loops. They look
like copy-paste but serve different denomination models and carry different
margins on purpose. If these are ever unified into one pure, testable
`match_transactions(...)` (a modularization goal — this is the file's best
extraction candidate), the two margin behaviors must be preserved as
parameters, not collapsed into one.

---

## Validation approach for new cryptographic code

Every crypto library ships an interactive, public unit-test page validated
against known test vectors, run on every page load (see the NIP-44
module's 193/193 pass against official test vectors, cross-validated
byte-identical between the Node and PHP implementations). This is the
required validation bar for new cryptographic primitives going forward.

**Known limitation, stated explicitly:** test vectors catch
*implementation* bugs (wrong byte order, off-by-one, broken edge cases).
They do not, and cannot, catch *soundness* bugs in something like a
zk-SNARK verifier — a broken verification equation can still accept every
valid test vector while also wrongly accepting some invalid proofs. For
any future Orchard-based (Zcash/Dash-shielded) work, binding to an
existing, audited verifier implementation is preferred over hand-rolling
proof verification, precisely because test-vector validation alone isn't
sufficient evidence of soundness. Key derivation, scanning, and note
decryption — the parts analogous to what's already done for Monero — are
different: those *are* well-suited to the test-vector approach.

---

## Contribution model

After 6 years as sole maintainer, the project is open to outside
contributors. In practice, only one external PR has been received in that
time, and it wasn't usable. The standing policy: a relevant contribution
that isn't quite right gets rewritten rather than merged as-is — quality
bar stays high regardless of contributor.

Crypto-core changes (the three standalone libraries, any future
Orchard/Pallas work) warrant a stricter review bar than UI/app-layer
changes, given what's at stake if something subtly wrong ships in key
derivation or scanning logic.

---

## Open / deferred items

- PIN-KDF v2 hardening: scoped and agreed, not yet implemented (see above).
- Nano/Nimiq address-pool support for team invites: deferred until
  actually requested.
- Trezor hardware wallet support: wishlist, not started.
- Zano local (viewkey-based) scanning to replace the current remote dummy
  fork: not yet done.
- Historic-rate fallback frequency (`fetched: false`) is unmeasured in real
  traffic — if fresh payments stall in `pending` noticeably, widen the
  upstream range padding in `get_payload_historic_*` rather than loosening
  the gate.
- `validate_payment_amounts` variable names `first_transaction_time` /
  `latest_transaction_time` read from `.last()` / `.first()` respectively —
  names look inverted against DOM order. Behavior believed correct; names
  are a trap for a future edit. Not verified.
- Potential extraction: unify the two match loops into one pure, unit-tested
  `match_transactions(...)` (see Historical fiat rate matching above).
