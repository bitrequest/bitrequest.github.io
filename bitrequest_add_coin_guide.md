# How to Add a New Coin to Bitrequest

A step-by-step developer guide covering every file and section that needs changes.

---

## Requirements for Adding a New Coin

Before starting, the coin must meet the following prerequisites:

- **BIP39-compatible key derivation** — The coin must support deterministic address generation from a BIP39 mnemonic seed phrase (typically via BIP32/BIP44 or a coin-specific derivation scheme like SLIP-0010).
- **WebSocket endpoint for address monitoring** — A WebSocket API that pushes real-time notifications when a given address receives an incoming transaction. If unavailable, polling is supported as a fallback.
- **Public API for querying transactions by address** — A REST API (or RPC endpoint) that returns the transaction history for a given address, used for payment detection and confirmation tracking.
- **Public API for querying transaction details by TXID** — A REST API (or block explorer) that returns transaction metadata (amount, confirmations, timestamp) for a given transaction hash.

---

## Architecture Overview

Bitrequest uses a layered architecture where each coin touches multiple files. The system is built around a central config object (`glob_config.bitrequest_coin_data`) that defines everything about a coin — from address validation to API endpoints, wallet recommendations, and UI settings. Other files then reference the coin's `currency` string to route it through payment monitoring, transaction scanning, WebSocket connections, and address derivation.

The files are named with underscores replacing the original directory separators — for example, `assets_js_bitrequest_config.js` corresponds to `assets/js/bitrequest/config.js`.

---

## Step 1: Define the Coin in the Config

**File:** `assets_js_bitrequest_config.js`

This is the master file. Every coin lives as an object inside the `glob_config.bitrequest_coin_data` array (starts around line 217). Each entry has four top-level sections: `currency`, `active`, `data`, `wallets`, and `settings`.

### 1a. Add the coin data object

Insert a new object into the `bitrequest_coin_data` array. Use an existing coin like Kaspa (line ~1439) as a template:

```javascript
{
    "currency": "yourcoin",        // Lowercase identifier used everywhere
    "active": true,
    "data": {
        "currency": "yourcoin",
        "ccsymbol": "yc",          // Ticker symbol (used by price APIs)
        "cmcid": 99999,            // CoinMarketCap ID (for price lookups)
        "urlscheme": function(payment, address, amount, iszero, label, message) {
            // Return a BIP-21 style payment URI
            // For BTC-like coins, reuse: btc_urlscheme(payment, address, amount, iszero, label, message)
            // For custom schemes, build the URI string manually
            return "yourcoin:" + address + "?amount=" + amount;
        },
        "address_regex": "^(yc1)[a-z0-9]{30,60}$"  // Regex to validate addresses
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
                "seed": true   // true if wallet supports BIP39 seed phrases
            }
        ]
    },
    "settings": {
        "confirmations": {
            "icon": "clock",
            "selected": 0       // Default required confirmations (0 = zero-conf)
        },
        "Use random address": {
            "icon": "dice",
            "selected": false,
            "switch": true
        },
        "Reuse address": {
            "icon": "recycle",
            "selected": false,
            "switch": true,
            "custom_switch": true
        },
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
                "name": "wss://api.yourcoin.org",
                "url": "wss://api.yourcoin.org",
                "display": true
            },
            "apis": [{
                "name": "wss://api.yourcoin.org",
                "url": "wss://api.yourcoin.org",
                "display": true
            }],
            "poll_fallback": true  // Fall back to polling if WS fails
        },
        // Optional: Xpub/HD wallet support
        "Xpub": {
            "active": true,
            "xpub": true,
            "icon": "key",
            "switch": true,
            "custom_switch": true,
            "selected": false,
            "key": null,
            "root_path": "m/44'/COINTYPE'/0'/0/",  // BIP44 derivation path
            "prefix": {
                "pub": 0,
                "pubx": 0x0488B21E,   // xpub version bytes
                "privx": 0x0488ADE4   // xprv version bytes
            },
            "pk_vbytes": {
                "wif": 128
            }
        },
        "Key derivations": {
            "icon": "cog",
            "selected": "compatiblewallets"
        },
        soundbytes  // Reuse the shared soundbytes config variable
    }
}
```

### 1b. Register API endpoints

In the same file, find the `apikeys` array (around line 2140+) and add your coin's API:

```javascript
{
    "name": "yourcoin.org",
    "base_url": "https://api.yourcoin.org/",
    "key_param": null,
    "api_key": "no_key",     // "no_key" = public API, null = requires user-provided key
    "sign_up": null
}
```

### 1c. Register block explorers

In the `blockexplorers` array (around line 2280+), add entries:

```javascript
{
    "name": "explorer.yourcoin.org",
    "url": "https://explorer.yourcoin.org/",
    "prefix": null,            // null, "currency", or "currencysymbol"
    "tx_prefix": "tx/",        // Path before tx hash
    "address_prefix": "address/"  // Path before address
}
```

### 1d. Register WebSocket/global constants (if needed)

**File:** `assets_js_lib_global_queries.js`

If your coin's WebSocket URLs or node URLs need to be referenced as constants, add them to the `glob_const` object (around line 110):

```javascript
"main_yc_wss": "wss://api.yourcoin.org",
```

Then reference `glob_const.main_yc_wss` in your config websocket settings.

---

## Step 2: Add the Coin Icon

**File:** `assets_js_bitrequest_assets.js`

The `c_icons()` function contains a `icons_obj` map of base64-encoded PNG icons. The key format is `{ccsymbol}-{currency}`:

```javascript
"yc-yourcoin": "data:image/png;base64,iVBORw0KGgo..."
```

The icon should be a 200×200px PNG. Convert it to base64 and add the entry.

---

## Step 3: Implement Transaction Scanning

**File:** `assets_js_bitrequest_fetchblocks.js`

This is the core file for blockchain data retrieval. You need to add two categories of functions:

### 3a. API scan initializer and transaction scanner

These functions call your coin's API, fetch transactions for an address, and parse the results. Pattern after Kaspa's implementation (around line 1649):

```javascript
// Initialize scan — optionally fetch block height first
function initialize_yourcoin_scan(rd, api_data, rdo) {
    // Option A: If your chain needs a block height for confirmations:
    yourcoin_fetch_blockheight(rd, api_data, rdo);
    // Option B: If not needed:
    // scan_yourcoin_transactions(rd, api_data, rdo, false);
}

function yourcoin_fetch_blockheight(rd, api_data, rdo) {
    // Fetch current block height from API
    // Then call: scan_yourcoin_transactions(rd, api_data, rdo, block_height);
}

function scan_yourcoin_transactions(rd, api_data, rdo, block_height) {
    // Fetch transaction list for rd.address from the API
    // Parse each transaction using your data handler
    // Call process_scan_results(rd, api_data, rdo, tx_details) for matches
}
```

### 3b. Transaction data parsers

These normalize API responses into Bitrequest's standard transaction format. You need one per API provider, plus WebSocket variants:

```javascript
// Parse transaction from REST API polling
function yourcoin_scan_data(data, thisaddress, setconfirmations, latest_block) {
    // Return object with: txhash, amount, timestamp, confirmations, confirmed (bool)
}

// Parse transaction from WebSocket message
function yourcoin_ws_data(data, thisaddress) {
    // Return object with: txhash, amount, timestamp
}
```

The standard return shape:

```javascript
{
    txhash: "abc123...",
    amount: 1.5,              // In coin units
    timestamp: 1700000000,    // Unix timestamp
    confirmations: 3,
    confirmed: true           // Based on setconfirmations threshold
}
```

---

## Step 4: Route the Coin in the Payment Monitor

**File:** `assets_js_bitrequest_monitors.js`

### 4a. Add to `route_crypto_api()` (around line 294)

This dispatcher decides which scanning function to call based on the coin or API provider:

```javascript
if (rd.payment === "yourcoin") {
    initialize_yourcoin_scan(rd, api_data, rdo);
    return
}
```

Insert this **before** the final `finalize_request_state(rdo)` fallback.

### 4b. Add to `route_blockchain_rpc()` (if your coin uses direct RPC)

If your coin connects to nodes via RPC rather than third-party APIs, also add routing in `route_blockchain_rpc()` (around line 352).

---

## Step 5: Configure WebSocket / Polling Behavior

**File:** `assets_js_bitrequest_sockets.js`

In the main WebSocket dispatcher function (around line 180), add your coin's real-time connection strategy:

```javascript
if (payment_type === "yourcoin") {
    // Option A: Use a custom WebSocket handler
    yourcoin_socket(socket_node, wallet_address);
    return

    // Option B: Fall back to polling (simplest approach)
    start_address_monitor(5000);  // Poll every 5 seconds
    return
}
```

If you implement a custom WebSocket handler, write a `yourcoin_socket()` function that subscribes to address notifications and calls your `yourcoin_ws_data()` parser on incoming messages.

**Kaspa uses polling** (`start_address_monitor(5000)`) — this is the easiest starting point for a new coin.

---

## Step 6: Add BIP39 Address Derivation (Optional but Recommended)

This enables the "derive from seed" feature so users can generate receiving addresses directly in Bitrequest.

### 6a. Register derivation support

**File:** `assets_js_bitrequest_bip39.js`

Add your coin to the capability maps at the top:

```javascript
const bip39_const = {
    "c_derive": {
        // ... existing coins ...
        "yourcoin": true       // Can derive addresses from seed
    },
    "can_xpub": {
        // ... existing coins ...
        "yourcoin": true       // Supports xpub (set false for non-UTXO coins)
    }
}
```

Add your coin to the `failed_coins` array in `test_bip39()` (line ~149) so it gets disabled if core crypto fails:

```javascript
const failed_coins = ["bitcoin", "litecoin", ..., "yourcoin"];
```

Add a coin-specific test to the `coin_checks` array (line ~170):

```javascript
{
    "check": CryptoUtils.test_yourcoin,  // or your test function
    "coins": ["yourcoin"]
}
```

### 6b. Implement key-to-address conversion

**File:** `assets_js_lib_bip39_utils.js`

In the key formatting function (around line 430), add a branch for your coin:

```javascript
} else if (coin === "yourcoin") {
    formatted_keys.address = pub_to_yourcoin_address(pubkey);
}
```

### 6c. Implement the address encoding

**File:** `assets_js_lib_crypto_utils.js`

Add the cryptographic functions needed to convert a public key to your coin's address format. This typically involves:

- Hash functions specific to your coin (e.g., Blake2b, Keccak, etc.)
- Address encoding (Base58Check, Bech32, custom encoding, etc.)
- Checksum calculation
- A test function and test vectors

```javascript
// Test vectors
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

Export the new functions in the `CryptoUtils` module at the bottom of the file.

---

## Step 7: Handle Address Parsing Edge Cases (If Needed)

**File:** `assets_js_bitrequest_core.js`

If your coin's address format includes a prefix with a colon (like `kaspa:qp...`), you may need to handle it in the address parsing logic. See line ~1638 where Kaspa has a special case:

```javascript
mid_result = (result.indexOf(prefix) >= 0 && payment !== "kaspa") 
    ? result.split(prefix).pop() : result,
```

If your coin uses a similar `prefix:address` format, add analogous logic here.

---

## Step 8: Add to Category Helper Functions (If Applicable)

**File:** `assets_js_lib_global_queries.js`

If your coin belongs to the Bitcoin family (UTXO-based, similar transaction model), add it to `is_btchain()` (line ~712):

```javascript
function is_btchain(currency) {
    const btc_chains = ["bitcoin", "litecoin", "dogecoin", "bitcoin-cash"];
    return btc_chains.includes(currency);
}
```

Most new coins will **not** belong here — this is only for coins that share Bitcoin's transaction scanning and RPC infrastructure.

---

## File Change Summary

| # | File | What to Add |
|---|------|-------------|
| 1 | `assets_js_bitrequest_config.js` | Coin data object, API endpoint, block explorer |
| 2 | `assets_js_lib_global_queries.js` | WebSocket/node URL constants (if needed) |
| 3 | `assets_js_bitrequest_assets.js` | Base64 coin icon |
| 4 | `assets_js_bitrequest_fetchblocks.js` | Transaction scanning + data parsing functions |
| 5 | `assets_js_bitrequest_monitors.js` | Route coin to your scanner in `route_crypto_api()` |
| 6 | `assets_js_bitrequest_sockets.js` | WebSocket or polling strategy |
| 7 | `assets_js_bitrequest_bip39.js` | Derivation capability flags + test registration |
| 8 | `assets_js_lib_bip39_utils.js` | Key-to-address formatting branch |
| 9 | `assets_js_lib_crypto_utils.js` | Address encoding, test vectors, test function |
| 10 | `assets_js_bitrequest_core.js` | Address prefix handling (only if prefix:address format) |
| 11 | `assets_js_lib_global_queries.js` | `is_btchain()` addition (only for BTC-family coins) |

---

## Complexity Tiers

Not every coin requires all steps. Here's a quick guide:

**Minimal integration (polling-only, no derivation):**
Steps 1, 2, 3, 4, 5 (using `start_address_monitor` polling)

**Standard integration (polling + WebSocket):**
Steps 1–5 with a custom WebSocket handler

**Full integration (with BIP39 derivation):**
All steps 1–9

**BTC-family coin (fork of Bitcoin):**
Steps 1, 2, 5, and potentially reuse existing `is_btchain()` scanning infrastructure — many BTC-family functions are already shared via mempool.space, blockcypher, and blockchair APIs.

---

## Testing Checklist

After implementing, verify:

1. Coin appears in the currency list and can be selected
2. Address validation accepts valid addresses and rejects invalid ones
3. Payment URI (QR code) generates correctly
4. Block explorer links open the correct pages
5. Transaction monitoring detects incoming payments
6. Confirmation counting works correctly
7. WebSocket or polling reconnects after disconnection
8. BIP39 derivation produces correct addresses (if implemented)
9. Xpub derivation generates sequential addresses (if implemented)
10. Settings (confirmations, explorer choice, API choice) persist correctly
