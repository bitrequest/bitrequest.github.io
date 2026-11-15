# Seed passkey (biometric) encryption

How the secret phrase is protected at rest when the device can do better than
the PIN, and how to add a platform to the supported list. For why the PIN
encryption stays weak, see `DECISIONS.md` ("The PIN-to-seed KDF is
deliberately weak"). This layer sits on top of it and never replaces it.

## Modes

| Device | Seed encryption | Unlock |
|---|---|---|
| Android with a platform authenticator (Chrome and Brave tested; the Android app is allowed but untested) | Passkey (WebAuthn PRF) once enabled | PIN, then fingerprint or face |
| Everything else (desktop, iOS, Windows, unknown) | PIN (unchanged) | PIN |

The PIN stays the app lock on every device and gates every action that
exposes secrets. In passkey mode it is not part of the seed encryption.

Passkey mode is opt-in per wallet: offered once per session after a PIN unlock
that opens the seed and after creating a new seed, and available under
Settings > Biometrics. Declining is remembered (`bipobj.pkd`), the settings
switch ignores it.

## Stored shape

`bitrequest_bpdat` holds `{id, dat, datenc, pkd?}`.

- PIN: `datenc = {id, dat}`, key from `pin_to_encryption_key`.
- Passkey: `datenc = {id, dat, pk: {cid, s, wk}}`. `dat` is the same payload as
  the PIN blob, encrypted with a random data key (DEK). `wk` is that DEK
  wrapped (AES-GCM) with the 32 byte PRF output of the passkey `cid`
  (credential id) evaluated over the salt `s`.

The marker is the presence of `datenc.pk`, not a version number. `datenc.v` is
reserved for the planned PIN KDF versions in `DECISIONS.md`.

The DEK exists in memory only (`glob_let.pk_dek`) for `glob_const.pk_timeout`
(5 minutes) and is wiped when the app goes to the background.

## Flow

- **Enable** (`pk_upgrade`): decrypt the PIN seed, `credentials.create()` with
  `extensions.prf.eval.first = salt`, take the PRF output from the result or
  from one `credentials.get()`, generate the DEK, wrap it, re-encrypt the seed,
  and verify that the wrapped key unwraps and the blob decrypts to the same
  payload. Only then is `bpdat` written. Every other outcome leaves the PIN
  wallet untouched.
- **Unlock** (`pk_unlock`): `credentials.get()` with the stored `cid` and `s`,
  unwrap the DEK, `pk_start_session`.
- **Gates**
  - `seed_gate(callback, show_top, pin_set)`: always the PIN panel first, then
    biometrics for passkey seeds. For anything that shows secrets (secret
    phrase, key derivations, private and view keys, seed comparison,
    permissions).
  - `pk_gate(callback)`: biometrics only, no PIN. For internal needs of the
    seed (deriving an address, backups, Drive sync).
  - `pk_locked()` blocks the code paths that need the seed. `compile_backup_data`
    returns false and `sync_drive_data` queues itself while locked, so a backup
    never silently falls back to a weaker lock.
- **Lost passkey**: "Passkey lost? Use your secret phrase" opens the restore
  panel (`pkreset`). After the phrase matches, `pk_reset` re-encrypts the seed
  with the PIN.
- **Turn off**: `pk_disable` re-encrypts the unlocked seed with the PIN.
- **PIN change or reset**: does not touch a passkey seed.

The written secret phrase is the only recovery path. A deleted passkey, a
cleared browser profile or a new device cannot decrypt the stored seed.

## Code map

- `lib/crypto_utils.js`: `pk_key`, `pk_new_dek`, `pk_wrap`, `pk_unwrap`,
  `pk_seal`, `pk_decrypt`.
- `bitrequest/bip39.js`, block "Seed Passkey": `pk_supported`, `pk_upgrade`,
  `pk_unlock`, `pk_gate`, `seed_gate`, `pk_offer`, `pk_disable`, `pk_lost`,
  `pk_reset`, `pk_events`; plus `derive_blocked`, `encrypt_seed_data`.
- `bitrequest/settings.js`: `s_decode` (passkey branch), backup and restore
  gates.
- `bitrequest/core.js`: derivation gates, `showoptions`/`clearoptions` timer.
- `lib/global_queries.js`: `pk_timeout`, `pk_dek`, `pk_timer`, `pk_uvpaa`,
  `pk_offered`, `pk_sync_queued`, lock on background.

## Result codes

Shown in brackets in the failure toast of the enable flow.

| Code | Meaning |
|---|---|
| `ok:create` | Enabled, PRF output came with the creation |
| `ok:get` | Enabled, PRF output needed one extra prompt |
| `unsupported:state` | Not supported here, or the PIN seed could not be read |
| `unsupported:noprf` | The authenticator returned no PRF output (the offer is declined for good) |
| `unsupported:wrap` / `unsupported:verify` | Wrapping or the round trip check failed, nothing was stored |
| `cancel:create:<name>` | The user cancelled or the browser refused creation |
| `cancel:get` | The extra prompt was cancelled |

## Adding a platform (iOS)

iOS is excluded because it did not return PRF output. Tested on an old iPhone
and iPad (iOS version not recorded): `prf.enabled` undefined, no output from
`create()` or `get()`, result `unsupported:noprf`. Reports also mention PRF
problems on iOS 18.0 to 18.3, verify that before choosing a minimum version.
Do not enable iOS on assumption, the enable flow only proves the key once.

1. **Prove PRF on the target.** Create a passkey with `prf.eval.first` set to a
   fixed salt, then call `get()` with the same salt at least twice, also after
   closing and reopening the app and after a restart. The 32 byte output must
   be present and identical every time. Test each context separately: Safari
   tab, home screen web app, and the iOS app (`glob_const.is_ios_app`, a
   WKWebView). A fingerprint (hash) of the output is enough to compare, never
   log the output itself.
2. **Check the app context.** WebAuthn inside the iOS app depends on the
   domain being associated with the app. `apple-app-site-association` currently
   only declares `applinks`. Verify whether `webcredentials` is needed before
   enabling `apple-app`.
3. **Allow it.** In `pk_supported()` (`bip39.js`) the first condition lists the
   `detect_device_type()` values that are allowed. Add `"iPhone"` and `"iPad"`.
   iPadOS in desktop mode reports `"Macintosh"` with touch, so add that only
   when `glob_const.supportsTouch` is true (already required in the same
   function), and `"apple-app"` only if step 2 passes. If only newer versions
   work, add a check on the version in `navigator.userAgent` (`OS 18_4`) in the
   same function.
4. **Keep the rest.** `userVerification: "required"` gives Face ID or Touch ID.
   `pk_uvpaa` (from `isUserVerifyingPlatformAuthenticatorAvailable()`) must
   stay true. Nothing else in the flow is platform specific.
5. **Verify on a real device.** Enable through Settings > Biometrics and expect
   `ok:create` or `ok:get`. Then lock, unlock, background the app (the key is
   wiped), reopen and unlock again, turn it off and on again. A single
   `unsupported:noprf` or `cancel:get` that you did not cause means the
   platform is not ready.
6. **Expect leftovers.** Every enable creates a passkey the app cannot delete.
   It is named "Bitrequest biometrics" in the password manager, and on iOS it
   syncs through iCloud Keychain. Tell users to delete old ones there.

Windows Hello and desktop platforms follow the same steps. Desktop was
excluded because macOS asks for the computer account password on every use
(Safari every time, Brave after a while in testing), which
the app cannot prevent.
