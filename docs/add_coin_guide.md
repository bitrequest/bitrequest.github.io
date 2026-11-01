# How to Add a New Coin to Bitrequest

A step-by-step developer guide covering every file and section that needs changes.

Kaspa is the reference integration throughout: `grep -rn kaspa assets/js unit_tests` lists every touchpoint of a complete coin.

---

## Requirements for Adding a New Coin

Before starting, check the coin against the following:

- **Public API for querying transactions by address** (required for payment detection) — A REST API (or RPC endpoint) that returns incoming transactions for an address, with per-output amounts and a timestamp. It must either send CORS headers or be called through the proxy (see 1b).
- **Public API for querying transaction details by TXID** (required for confirmation tracking) — Returns amount, confirmations (or block height) and timestamp for a transaction hash.
- **Price data** (required for fiat requests) — The coin should be listed on CoinMarketCap, CoinGecko and CoinPaprika. The app falls back between them, but every API that doesn't know the coin is a failed lookup; see the ID rules in 1a.
- **BIP39-compatible key derivation** (recommended) — Deterministic address generation from a BIP39 mnemonic (BIP32/BIP44, or a coin-specific scheme like SLIP-0010). Without it the coin works with manually entered addresses only.
- **WebSocket endpoint for address monitoring** (optional) — Pushes incoming transactions for an address in real time. Polling works without it; Kaspa and Nimiq poll only.

---

## Architecture Overview

Bitrequest uses a layered architecture where each coin touches multiple files. The system is built around a central config object (`glob_config.bitrequest_coin_data`) that defines everything about a coin — from address validation to API endpoints, wallet recommendations, and UI settings. Other files then reference the coin's `currency` string to route it through payment monitoring, transaction scanning, WebSocket connections, and address derivation.

### Payment lifecycle

Your scanner (Step 3) is called in three situations, all through `route_api_request()` in `monitors.js`:

| Phase | Started by | `rdo.source` | `rdo.pending` |
|---|---|---|---|
| Detect a payment | `start_address_monitor()` (polling) | `"addr_polling"` | `"scanning"` |
| Track confirmations | `start_transaction_monitor()` after detection, `rd.txhash` set | `"tx_polling"` | `"polling"` |
| Refresh the requests page | request list updates | `"requests"` | `"scanning"` or `"polling"` |

A WebSocket handler (Step 5) replaces the first phase only; confirmations are always tracked by the scanner. So every scanner needs both a `"scanning"` branch (find incoming transactions for the address) and a `"polling"` branch (look up one transaction by hash).

### Load order

`global_queries.js` and `config.js` load synchronously before everything else; the other scripts load deferred in `index.html` order (`… sockets.js, polling.js, ethl2.js, payments.js, fetchblocks.js, monitors.js`). Two consequences:

- `config.js` can only reference `glob_const` and functions from `global_queries.js` directly. Wrap anything else in a function (like Kaspa's `urlscheme`).
- The dispatch tables in `monitors.js` and `sockets.js` are built at load time. A table entry that names a function from a file loaded *later* throws a `ReferenceError`; wrap those in an arrow function, as `SOCKET_HANDLERS` does with `() => start_address_monitor(5000)`.

---

## Step 1: Define the Coin in the Config

**File:** `assets/js/bitrequest/config.js`

This is the master file. Every coin lives as an object inside the `glob_config.bitrequest_coin_data` array. Each entry has five top-level keys: `currency`, `active`, `data`, `wallets`, and `settings`. Existing users get a new coin's default settings automatically; no migration is needed.

### 1a. Add the coin data object

Insert a new object into the `bitrequest_coin_data` array. Use Kaspa as a template:

```javascript
{
    "currency": "yourcoin",
    "active": true,
    "data": {
        "currency": "yourcoin",
        "ccsymbol": "yc",
        "cmcid": 99999,
        "urlscheme": btc_urlscheme,
        "address_regex": "^(yc1)[a-z0-9]{58}$"
    },
    "wallets": {
        "wallet_download_page": "https://yourcoin.org",
        "wallets": [
            {
                "name": "yourcoinwallet",
                "website": "https://yourcoinwallet.org",
                "appstore": "https://apps.apple.com/app/id...",
                "playstore": "https://play.google.com/store/apps/details?id=...",
                "desktop": "https://yourcoinwallet.org/desktop",
                "seed": true
            },
            glob_multi_wallets.exodus
        ]
    },
    "settings": {
        "confirmations": setting_confirmations(),
        "Use random address": setting_random_address(),
        "Reuse address": setting_reuse_address(),
        "blockexplorers": {
            "icon": "eye",
            "selected": "explorer.yourcoin.org",
            "options": ["explorer.yourcoin.org"]
        },
        "apis": {
            "icon": "sphere",
            "selected": {
                "name": "yourcoin.org",
                "api": true,
                "display": true
            },
            "apis": [{
                "name": "yourcoin.org",
                "api": true,
                "display": true
            }]
        },
        "websockets": {
            "icon": "tab",
            "selected": {
                "name": glob_const.main_yc_wss,
                "url": glob_const.main_yc_wss,
                "display": true
            },
            "apis": [{
                "name": glob_const.main_yc_wss,
                "url": glob_const.main_yc_wss,
                "display": true
            }],
            "poll_fallback": true
        },
        "Xpub": {
            "active": true,
            "xpub": true,
            "icon": "key",
            "switch": true,
            "custom_switch": true,
            "selected": false,
            "key": null,
            "root_path": "m/44'/COINTYPE'/0'/0/",
            "prefix": {
                "pub": 0,
                "pubx": 0x0488B21E,
                "privx": 0x0488ADE4
            },
            "pk_vbytes": {
                "wif": 128
            }
        },
        "Key derivations": {
            "icon": "cog",
            "selected": "compatiblewallets"
        },
        soundbytes
    }
}
```

**`data` fields:**

- **`currency`** — Lowercase identifier used everywhere, including request URLs (`?payment=yourcoin`). It is also the coin's **CoinGecko ID** (live and historic prices) and the Blockchair chain path, so it must match CoinGecko's ID for the coin.
- **`ccsymbol`** — Lowercase ticker. Used in the icon key (Step 2), the **CoinPaprika ID** (`{ccsymbol}-{currency}`, e.g. `kas-kaspa`), the CoinCodex and CoinDesk historic price lookups, and the Blockcypher network path.
- **`cmcid`** — CoinMarketCap ID, for CoinMarketCap prices. It also selects the 200×200 PNG used as the share-preview thumbnail (`glob_const.cmc_icon_loc + cmcid + ".png"`).
- **`urlscheme`** — `function(payment, address, amount, iszero, label, message)`, returns the payment URI for the QR code. For BIP-21 coins use `btc_urlscheme` directly: it omits the query string for zero-amount requests and URL-encodes label and message (`global_queries.js` also has `bch_urlscheme`, `nano_urlscheme` and `xmr_urlscheme`). If the address itself carries the scheme prefix, strip it first, as Kaspa does: `btc_urlscheme(payment, address.split(":").pop(), amount, iszero, label, message)`.
- **`address_regex`** — A string, compiled with `new RegExp(regex)` without flags, so it is case-sensitive and backslashes must be escaped (`"\\d"`). It is the only address check (there is no checksum validation), so make it exact (see note below).

> [!NOTE]
> If a price API uses a different ID than `currency` / `ccsymbol`, add a mapping in its payload function in `monitors.js`, like the existing `xno` → `nano` exception for CoinCodex and CoinDesk. Otherwise fiat conversion fails for that API.

**`settings` blocks:**

- **`confirmations` / `Use random address` / `Reuse address`** — Use the `setting_confirmations()`, `setting_random_address()` and `setting_reuse_address()` helpers at the top of `config.js` (they return a fresh object each time). Copy a block only when the coin needs different defaults (Nano reuses addresses by default). `soundbytes` is a shared constant.
- **`wallets`** — Multi-coin wallets are shared entries: reference them as `glob_multi_wallets.<name>` (exodus, coinomi, trezor, ledger, …) instead of copying them. `"seed": true` means the wallet can import a BIP39 seed phrase.
- **`apis`** — Each entry's `name` must match an entry in `glob_config.apis` (1b). `"api": true` routes the coin through the third-party API dispatch (`route_crypto_api`); an entry with a `url` and no `api` key is an RPC node and goes through `route_blockchain_rpc` instead (Step 4b). `"display": false` hides the option. A coin without an `apis` block is not monitored: requests work, but payment status stays unknown.
- **`websockets`** — Optional. Without it the app polls the address every 7 seconds (Nimiq has no `websockets` block). With it, `poll_fallback: true` falls back to polling when every listed socket fails.
- **`Xpub`** — Required whenever the coin derives addresses from the seed, not just for xpub support. `"active": true` makes the app read `root_path`, `prefix` and `pk_vbytes` from this block for seed derivation; `"xpub"` says whether extended public keys are supported. Nano, Monero and Nimiq use `"active": true, "xpub": false`. Leave the block out only if the coin has no derivation at all.

**Anchored `address_regex` must match the real address length.** Test it against real addresses of every address type the coin has. Kaspa uses 61 characters after `kaspa:` for Schnorr/P2SH addresses and 63 for ECDSA, so its regex is `^(kaspa):([a-z0-9]{61}|[a-z0-9]{63})$`. Anchoring with a guessed length silently rejects valid addresses.

### 1b. Register API endpoints

In the same file, add your coin's API to the `glob_config.apis` array:

```javascript
{
    "name": "yourcoin.org",
    "base_url": "https://api.yourcoin.org/",
    "key_param": null,
    "api_key": "no_key",
    "sign_up": null
}
```

`base_url` must end with `/`: requests append their `search` path to it.

`api_key` decides how requests are sent (`api_proxy()` in `global_queries.js`):

- **`"no_key"`** — Public API, called straight from the browser. The API must send CORS headers; if it doesn't, set `"proxy": true` on the request so it goes through the proxy (Kaspa's address scan does this).
- **`null`** — A key is required. A key the user saved under API keys is appended with `key_param`. Without one, the request goes through the proxy, which attaches its own server key only if `api_host_allowed()` accepts the host.

If the API needs a key, it also needs:

| File | What to add |
|---|---|
| `assets/js/bitrequest/config.js` | The API name in the `"apikeys"` entry of `app_settings` |
| `assets/js/bitrequest/settings.js` | An input in the `apikeys()` form and an entry in the key-test map |
| `proxy/config.php` | A `$keys` entry (server key, optional) |
| `proxy/v1/filter.php` | The API's host in the `api_host_allowed()` allowlist |

### 1c. Register block explorers

In the `glob_config.blockexplorers` array, add entries:

```javascript
{
    "name": "explorer.yourcoin.org",
    "url": "https://explorer.yourcoin.org/",
    "prefix": null,
    "tx_prefix": "tx/",
    "address_prefix": "address/"
}
```

Links are built as `url + prefix + "/" + tx_prefix|address_prefix + hash|address`:

- **`prefix`** — `null` or `""` adds nothing; `"currency"` inserts the currency name; `"currencysymbol"` inserts `ccsymbol`. Any other string is inserted as written.
- **`url`** — Must end with `/`.
- **`name`** — Must match the names in the coin's `blockexplorers.options`.

### 1d. Register WebSocket/global constants (if needed)

**File:** `assets/js/lib/global_queries.js`

If `config.js` references a WebSocket or node URL as a constant, add it to the `glob_const` object. `config.js` reads these at load time, so they must live here:

```javascript
"main_yc_wss": "wss://api.yourcoin.org",
```

Kaspa uses `main_kas_wss` and `sec_kas_wss`.

---

## Step 2: Add the Coin Icon

**File:** `assets/js/bitrequest/assets.js`

The `c_icons()` function contains an `icons_obj` map of base64-encoded SVG icons. The key format is `{ccsymbol}-{currency}`:

```javascript
"yc-yourcoin": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0i..."
```

Use an SVG with a square `viewBox`. A missing or misspelled key doesn't fail: it silently shows the "not found" placeholder.

---

## Step 3: Implement Transaction Scanning

**File:** `assets/js/bitrequest/fetchblocks.js`

This is the core file for blockchain data retrieval. Scanners are built on shared runners that handle the request, error fallback, request-list rendering and result processing; you supply the request and a parser.

### 3a. Scan initializer and scanner

Pattern after `initialize_kaspa_scan()` / `scan_kaspa_transactions()`:

```javascript
function initialize_yourcoin_scan(rd, api_data, rdo) {
    if (rdo.source === "addr_polling") { // detection only, confirmations are tracked later by tx_polling
        scan_yourcoin_transactions(rd, api_data, rdo, false);
        return;
    }
    fetch_block_height(rd, api_data, rdo, {
        "api": "yourcoin.org",
        "search": "info/blockheight",
        "cachetime": rdo.cachetime,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }, "result.height", function(block_height) {
        scan_yourcoin_transactions(rd, api_data, rdo, block_height);
    });
}

function scan_yourcoin_transactions(rd, api_data, rdo, block_height) {
    if (rdo.pending === "scanning") {
        run_address_scan(rd, api_data, rdo, {
            "request": {
                "api": "yourcoin.org",
                "search": "addresses/" + rd.address + "/transactions",
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            },
            "extract": (api_result) => api_result.transactions,
            "parse": (tx, rd, rdo) => yourcoin_scan_data(tx, rd.address, rdo.setconfirmations, block_height),
            "match": (parsed_tx, _tx, _rd, rdo) => parsed_tx.transactiontime > rdo.request_timestamp && parsed_tx.ccval
        });
        return;
    }
    if (rdo.pending === "polling" && rd.txhash) {
        run_tx_poll(rd, api_data, rdo, {
            "request": {
                "api": "yourcoin.org",
                "search": "transactions/" + rd.txhash,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            },
            "parse": (api_result, rd, rdo) => yourcoin_scan_data(api_result, rd.address, rdo.setconfirmations, block_height)
        });
    }
}
```

Skip `fetch_block_height()` entirely if the API returns confirmations directly.

**Runner options:**

- **`run_address_scan`** — Required options: `request`, `extract` (returns the transaction array), `parse` and `match`. The `match` shown above only accepts transactions newer than the request, so an older payment to a reused address isn't counted. Optional: `tx_filter(tx)` drops raw transactions before parsing, `error_check(api_result)` detects errors the API reports with HTTP 200 (default: `api_result.error`), `break_on_match`, `display_on_match`.
- **`run_tx_poll`** — Takes `request` and `parse`.
- **`run_address_scan_chained`** — For APIs that need two requests (a list of IDs first, then the details). Bitcoin via blockchain.info uses it.

**Rules:**

- **Pass `rdo.cachetime` as `cachetime`.** Proxied responses are cached per URL; the poll interval sets `rdo.cachetime`, and a fixed value serves stale results while polling.
- **`cachefolder` must be a key of `CACHE_DURATIONS` in `proxy/v1/api.php`** (`"1h"`, `"1d"`, `"1w"`, `"2m"`, `"tx"`). The proxy rejects anything else with "Invalid cache folder".
- **Errors must surface.** If the API signals an error in a 200 response, write an `error_check` so the failure is reported and the app moves on to the next proxy or API, instead of looking like "no payment yet".
- **Parser exceptions are swallowed.** `try_parse()` turns a throwing parser into `null`, which looks like "no transaction". Test parsers against real API responses.

### 3b. Transaction data parser

The parser normalizes one transaction into Bitrequest's transaction object. Pattern after `kaspa_scan_data()`:

```javascript
function yourcoin_scan_data(data, thisaddress, setconfirmations, latest_block) {
    const total_output = calculate_total_outputs(data.outputs, thisaddress, (output, address) => output.address === address ? output.amount : 0);
    return {
        "ccval": total_output ? total_output / 1e8 : null,
        "transactiontime": normalize_timestamp(data.block_time),
        "txhash": data.txid,
        "confirmations": get_block_confirmations(data.block_height, latest_block),
        setconfirmations,
        "ccsymbol": "yc"
    };
}
```

The standard shape:

```javascript
{
    "ccval": 1.5,                   // amount received by the address in coin units, null if none
    "transactiontime": 1700000000000, // milliseconds; normalize_timestamp() accepts s or ms
    "txhash": "abc123...",
    "confirmations": 3,
    "setconfirmations": 1,          // passed through from rdo
    "ccsymbol": "yc"
}
```

- **Count only value received by the requested address.** Sum the outputs paying `thisaddress` with `calculate_total_outputs()`. Never count the address's own spends or change outputs: Blockcypher's address endpoint lists the address's inputs as well, and counted them as payments until `tx_filter: (tx) => tx.tx_input_n < 0` was added.
- **Divide by the coin's exact base unit** (1e8 for Kaspa).
- **Report confirmations only.** Whether a request counts as paid is decided by `validate_confirmations()` in `polling.js`, which compares `confirmations` with `setconfirmations`.
- **Timestamps:** `normalize_timestamp()` subtracts 3 seconds of margin and uses the current time when the API gives none (mempool transactions).

If the coin has a second API with a different response format, add a second parser (Kaspa: `kaspa_poll_fyi_data()` for kas.fyi) and pick it by `api_data.name`.

---

## Step 4: Route the Coin in the Payment Monitor

**File:** `assets/js/bitrequest/monitors.js`

### 4a. Register your scanner in the dispatch table

`route_crypto_api` is a two-table lookup, not a branch list. Add your coin to the `CRYPTO_API_DISPATCH_BY_PAYMENT` table (keyed by `rd.payment`):

```javascript
const CRYPTO_API_DISPATCH_BY_PAYMENT = {
    // ... existing coins ...
    "yourcoin": initialize_yourcoin_scan
};
```

If your coin is instead reached by a third-party *provider* name (`api_data.name`) rather than by payment type, add it to `CRYPTO_API_DISPATCH_BY_PROVIDER`. The two keyspaces must stay disjoint — see the comment header above `route_crypto_api`; update the coin list in that comment, and in `docs/architecture.md`, when you add a payment-routed coin.

A coin missing from both tables is not an error: `finalize_request_state()` runs and nothing is ever detected.

### 4b. Direct-RPC coins (if your coin uses node RPC)

If your coin connects to nodes via RPC rather than third-party APIs, add it to the `BLOCKCHAIN_RPC_DISPATCH` table (keyed by `rd.payment`) — that's what `route_blockchain_rpc()` looks up. BTC-family coins are handled separately via the `is_btchain()` check in that function.

RPC node entries in the coin's `apis` setting have the shape `{name, url, username, password, display}`, with `"options": []` and an `rpc_test_command` next to the list (see Nano). For user-added nodes, `rpcs.js` has per-coin branches for testing and displaying nodes (follow `nano`), and a proxy-side handler lives in `proxy/v1/custom/rpcs/<name>/` when the node protocol needs one (`electrum`, `nano`).

RPC calls that go through the proxy by API name need two more entries, or `api_proxy()` rejects the call with "unknown api": an entry in `glob_config.apis` whose `name` matches the `api` name used in the call, and, if the proxy should use another API's server key, a mapping in `c_apiname()` (`global_queries.js`) to that key name (for example `"binance smart chain"` maps to `"infura"`). The proxy only attaches its server key if `api_host_allowed()` accepts the target host.

---

## Step 5: Configure WebSocket / Polling Behavior

**File:** `assets/js/bitrequest/sockets.js`

Add your coin to the `SOCKET_HANDLERS` table (keyed by payment type). Handlers receive `(socket_node, wallet_address, retry)`:

```javascript
const SOCKET_HANDLERS = {
    // ... existing coins ...
    "yourcoin": (sn, addr) => yourcoin_socket(sn, addr)   // custom WebSocket
    // or: "yourcoin": () => start_address_monitor(5000)  // polling every 5 seconds
};
```

A missing entry means no monitoring at all: `init_socket()` looks the coin up and silently does nothing. Wrap functions from other files in an arrow function (see Load order).

**Kaspa and Nimiq use polling** (`start_address_monitor(5000)`) — this is the easiest starting point for a new coin. Polling ignores the `websockets` setting.

For a custom WebSocket, use `build_socket()`, which handles connecting, subscribing, pings, reconnects and fallback (pattern after `nano_socket()`):

```javascript
function yourcoin_socket(socket_node, wallet_address) {
    build_socket(socket_node, wallet_address, {
        "endpoint": socket_node.url,
        "subscribe": { /* subscription message for wallet_address */ },
        "ping": { /* optional keep-alive message, defaults to the subscribe message */ },
        "on_message": function(msg_data) {
            // return a transaction object (Step 3b shape) or null
        }
    });
}
```

`on_message` receives the parsed JSON. A returned object with `ccval > 0` closes the socket and starts the transaction monitor. Return `null` for anything that isn't a new incoming payment to `wallet_address`: outgoing transactions, payments to other addresses, and stale transactions. Nano drops anything older than 60 seconds; without that check, a socket that replays history marks the request paid with an old transaction. `ping_interval` defaults to 55000 ms.

---

## Step 6: Add BIP39 Address Derivation (Optional but Recommended)

This enables the "derive from seed" feature so users can generate receiving addresses directly in Bitrequest.

### 6a. Register derivation support

**File:** `assets/js/bitrequest/bip39.js`

Add your coin to the capability maps at the top:

```javascript
const bip39_const = {
    "c_derive": {
        // ... existing coins ...
        "yourcoin": true
    },
    "can_xpub": {
        // ... existing coins ...
        "yourcoin": true
    }
}
```

`can_xpub` is true only for BIP32 secp256k1 coins with non-hardened public derivation (the Bitcoin family, Ethereum, Kaspa). ed25519 coins (Nano, Nimiq) and Monero can't derive addresses from an extended public key. This also decides team invites: xpub coins share a seedless derived address pool, other coins fall back to address reuse (see `docs/DECISIONS.md`).

In `test_bip39()`, register the coin in three places so it gets disabled if a self-test fails:

```javascript
// Test 1: core BIP39 failure
const failed_coins = ["bitcoin", "litecoin", ..., "yourcoin"];

// Test 3: coin-specific address test
{
    "check": CryptoUtils.test_yourcoin,
    "coins": ["yourcoin"]
}

// Test 4: xpub failure (only if can_xpub is true)
const xpub_failed = ["bitcoin", "litecoin", ..., "yourcoin"];
```

Coins that don't use BIP32 (ed25519 / SLIP-0010, Monero) also need a branch in `br_format_keys()` in this file, which sends them to their own derivation function (`derive_nano_account()`, `derive_nimiq_account()`) before `format_keys()` is reached.

### 6b. Implement key-to-address conversion

**File:** `assets/js/lib/bip39_utils.js`

Add the coin to `bip32_configs` with the same `root_path`, `prefix` and `pk_vbytes` as its `Xpub` block in `config.js`. The app reads the config block; `bip32_configs` is the standalone library's copy, used by `Bip39Utils` and the unit tests. Keep both identical.

In `format_keys()` add a branch for your coin, unless its address is plain Base58Check P2PKH: the final `else` already handles that with `prefix.pub` as the version byte (Dogecoin, Dash).

```javascript
} else if (coin === "yourcoin") {
    formatted_keys.address = pub_to_yourcoin_address(pubkey);
}
```

### 6c. Implement the address encoding

**File:** `assets/js/lib/crypto_utils.js`

Add the cryptographic functions needed to convert a public key to your coin's address format. This typically involves:

- Hash functions specific to your coin (e.g., Blake2b, Keccak, etc.)
- Address encoding (Base58Check, Bech32, custom encoding, etc.)
- Checksum calculation
- A test function and test vectors

```javascript
// Test vectors (add at the end of crypto_utils_const)
"test_pubkey_yourcoin": "03...",
"test_address_yourcoin": "yc1...",

// Address derivation
function pub_to_yourcoin_address(pubkey) {
    // Implement your coin's pubkey → address algorithm
}

// Test function
function test_yourcoin() {
    const generated = pub_to_yourcoin_address(crypto_utils_const.test_pubkey_yourcoin);
    return generated === crypto_utils_const.test_address_yourcoin;
}
```

Derive the test pubkey from the shared test phrase (`"army van defense carry jealous true garbage claim echo media make crunch"`, index 0 of the coin's `root_path`), and take the expected address from an independent implementation, such as the coin's reference wallet or library. An expected address produced by your own encoder only proves the code agrees with itself.

Export the new functions in the `CryptoUtils` object at the bottom of the file.

---

## Step 7: Handle Address Parsing Edge Cases (If Needed)

**File:** `assets/js/bitrequest/core.js`

`handle_address()` parses scanned QR codes. It strips a `payment:` URI prefix and any `?…` query, removes whitespace for Nimiq, and treats anything longer than 103 characters as an extended public key.

If your coin's address format includes the prefix with a colon (like `kaspa:qp...`), the prefix is part of the address and must not be stripped. See the Kaspa special case:

```javascript
mid_result = (result.indexOf(prefix) >= 0 && payment !== "kaspa") 
    ? result.split(prefix).pop() : result,
```

If your coin uses a similar `prefix:address` format, add analogous logic here. Coins with addresses longer than 103 characters need the extended-key check adjusted too.

---

## Step 8: Add to Category Helper Functions (If Applicable)

**File:** `assets/js/lib/global_queries.js`

If your coin belongs to the Bitcoin family (UTXO-based, similar transaction model), add it to `is_btchain()`:

```javascript
function is_btchain(currency) {
    const btc_chains = ["bitcoin", "litecoin", "dogecoin", "bitcoin-cash"];
    return btc_chains.includes(currency);
}
```

Most new coins will **not** belong here — this is only for coins that share Bitcoin's transaction scanning and RPC infrastructure (Electrum / mempool.space nodes, also in `rpcs.js`). Dash, a Bitcoin fork, is not in the list.

---

## Step 9: Tests and Docs

| File | What to add |
|---|---|
| `unit_tests/crypto_utils.html` | Address encoding tests (see the Kaspa tests) |
| `unit_tests/bip39_utils.html` | Derivation tests and the coin in the coin/path selectors (if derivation is implemented) |
| `README.md` | The coin under "Supported Cryptocurrencies" |
| `docs/architecture.md` | The coin in the payment-routed coin list (if added to `CRYPTO_API_DISPATCH_BY_PAYMENT`) |

---

## File Change Summary

| # | File | What to Add |
|---|------|-------------|
| 1 | `assets/js/bitrequest/config.js` | Coin data object, API endpoint, block explorer |
| 2 | `assets/js/lib/global_queries.js` | WebSocket/node URL constants (if needed) |
| 3 | `assets/js/bitrequest/assets.js` | Base64 SVG coin icon |
| 4 | `assets/js/bitrequest/fetchblocks.js` | Scan initializer, scanner and parser |
| 5 | `assets/js/bitrequest/monitors.js` | Register coin in the `CRYPTO_API_DISPATCH_*` / `BLOCKCHAIN_RPC_DISPATCH` table |
| 6 | `assets/js/bitrequest/sockets.js` | `SOCKET_HANDLERS` entry (polling or custom WebSocket) |
| 7 | `assets/js/bitrequest/bip39.js` | Derivation capability flags, self-test registration, `br_format_keys()` branch (non-BIP32 coins) |
| 8 | `assets/js/lib/bip39_utils.js` | `bip32_configs` entry, `format_keys()` branch |
| 9 | `assets/js/lib/crypto_utils.js` | Address encoding, test vectors, test function |
| 10 | `assets/js/bitrequest/core.js` | Address prefix handling (only if prefix:address format) |
| 11 | `assets/js/lib/global_queries.js` | `is_btchain()` addition (only for BTC-family coins) |
| 12 | `unit_tests/*.html`, `README.md`, `docs/architecture.md` | Tests and docs |
| — | `settings.js`, `proxy/config.php`, `proxy/v1/filter.php` | Only if the API needs a key (1b) |
| — | `monitors.js` | Price ID mapping, only if a price API uses another ID (1a) |

---

## Complexity Tiers

Not every coin requires all steps. Here's a quick guide:

**Unmonitored (addresses and QR codes only):**
Steps 1 (without the `apis` block) and 2. Requests work, payment status stays unknown.

**Minimal integration (polling-only, no derivation):**
Steps 1–5, with `start_address_monitor` polling in Step 5.

**Standard integration (polling + WebSocket):**
Steps 1–5 with a custom WebSocket handler.

**Full integration (with BIP39 derivation):**
All steps 1–9.

**BTC-family coin (fork of Bitcoin):**
Steps 1, 2, 5 and 8 (plus 6 for derivation), reusing the existing `is_btchain()` scanning infrastructure. The shared providers only work if they support the coin under the IDs Bitrequest sends: Blockcypher uses `ccsymbol` as the network path, Blockchair uses `currency`, and mempool.space needs an instance for the coin.

---

## Testing Checklist

After implementing, verify:

1. Coin appears in the currency list with its icon (not the placeholder) and can be selected
2. Address validation accepts valid addresses of every type and rejects invalid ones
3. Payment URI (QR code) generates correctly, with and without an amount
4. Scanning the coin's QR codes fills in the address
5. Block explorer links open the correct pages
6. Transaction monitoring detects incoming payments
7. A payment made before the request was created is not matched
8. An outgoing transaction from the address is not counted as a payment
9. Confirmation counting works correctly until the request is marked paid
10. The requests page updates status and confirmations of an existing request
11. Fiat-denominated requests convert correctly with each price API (live and historic)
12. WebSocket or polling reconnects after disconnection
13. BIP39 derivation produces correct addresses (if implemented)
14. Xpub derivation generates sequential addresses (if implemented)
15. Settings (confirmations, explorer choice, API choice) persist correctly
16. `unit_tests/crypto_utils.html` and `unit_tests/bip39_utils.html` pass