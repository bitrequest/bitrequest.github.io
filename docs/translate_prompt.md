# Bitrequest Translation Prompt

Use this prompt with an AI assistant (Claude, ChatGPT, etc.) to generate a translation file for Bitrequest.

## Instructions

1. Copy the prompt below.
2. Replace `[YOUR LANGUAGE]`, `[COUNTRYCODE]`, and `[FLAG]` with your language, ISO 639-1 code, and country flag emoji (e.g. `German` / `de` / `🇩🇪`, `Japanese` / `ja` / `🇯🇵`, `Portuguese` / `pt` / `🇵🇹`).
3. Paste the prompt into an AI assistant along with the English source file (`assets/js/bitrequest/lang/en.js`). Optionally include existing translations (e.g. `lang/nl.js`, `lang/fr.js`, `lang/es.js`) for additional context.
4. Review the output carefully — AI translations need human verification, especially for crypto terminology.
5. Test the file in Bitrequest before submitting a pull request.

---

## The Prompt

```
You are translating a JavaScript language file for Bitrequest, an open-source, non-custodial cryptocurrency point-of-sale app. Translate the attached English file into [YOUR LANGUAGE] (country code: [COUNTRYCODE]).

## Critical rules

1. **Do NOT translate variables.** Variables like `data.currency`, `data.amount`, `data.url`, `data.address`, etc. must remain exactly as they are. You may rearrange their position to fit natural sentence structure in [YOUR LANGUAGE].

2. **Do NOT translate object keys.** Only translate the string values (right side of the colon).

3. **Do NOT translate HTML tags or attributes.** Preserve all `<span>`, `<a>`, `<br/>` tags and their attributes (`id`, `class`, `data-*`, `href`, `target`) exactly as they are.

4. **Rename the function** from `lang_en` to `lang_[COUNTRYCODE]`. If the code contains a hyphen, replace it with an underscore in the function name (e.g. `zh-cn` → `lang_zh_cn`).

5. **Keep string lengths similar** to the English original where possible (UI space is limited).

6. **Leave blank** any string you're uncertain about — blanks will default to English.

7. **Preserve the ternary operator** in `sharetitlename` exactly as structured, only translating the string portions.

## Cryptocurrency terminology guidelines

This is a cryptocurrency app. Many technical terms should NOT be literally translated but kept in English or use the established term in the [YOUR LANGUAGE]-speaking crypto community. Research how each term is actually used by [YOUR LANGUAGE]-speaking crypto users, developers, and media.

### Terms that are typically kept in English across most languages:
- blockchain (do NOT literally translate to "chain of blocks" equivalent)
- Lightning Network / Lightning
- SegWit / Legacy
- Xpub / Xpriv / BIP32 / BIP39
- token / ERC20
- viewkey
- macaroon
- satoshis / sats
- proxy / API / RPC / REST
- websocket
- blockexplorer
- QR / QR code
- CSV
- PIN
- NFC

### Terms that are usually translated (verify for your language):
- wallet → find the established crypto term (e.g. Spanish: "monedero", French: "portefeuille", Dutch: "wallet")
- private key / public key → usually translated
- secret phrase / seed phrase → usually translated
- node → check if translated or kept as "node"
- transaction → usually translated
- address → usually translated
- invoice → depends on language and context (Lightning invoices may stay as "invoice")
- Layer 2 → check if translated (e.g. Spanish: "Capa 2", French: "Couche 2")
- fiat → usually kept as "fiat"
- derivation path → technical, check community usage
- confirmations → usually translated
- point of sale → usually translated

### How to decide:
- Search crypto news sites, exchanges (Binance, Coinbase), and community forums in [YOUR LANGUAGE]
- Check if Bitcoin/Monero/Ethereum documentation has official translations
- Check the Monero Localization Workgroup on GitHub for terminology guides
- When in doubt, keep the English term — the crypto community is used to English jargon

## Context about the app

- Bitrequest is a point-of-sale payment request app (not a wallet that sends funds)
- "request" in this app means a payment request / payment solicitation
- It supports Bitcoin (on-chain + Lightning Network), Monero, and ERC-20 tokens
- It has a "cashier mode" for team members with restricted access
- "secret phrase" refers to a BIP39 12-word mnemonic seed
- "proxy" refers to a self-hosted PHP server that relays API calls and Lightning node connections
- The app runs as a PWA (Progressive Web App) and has iOS/Android apps

## Output format

Return the complete translated JavaScript file, ready to use. Keep all comments in English (they are developer-facing). Make sure the file is syntactically valid JavaScript.
```

---

## After generating the translation

1. Save the output as `assets/js/bitrequest/lang/[countrycode].js` (lowercase; replace any hyphen in the code with an underscore — e.g. code `zh-cn` → file `lang/zh_cn.js`)
2. Register your language in `assets/js/bitrequest/lang_meta.js` by adding an entry to the `LANG_META` object:
```js
"[COUNTRYCODE]": {"lang": "[YOUR LANGUAGE]", "flag": "[FLAG]", "fn": "lang_[COUNTRYCODE]"}
```
   The `LANG_META` key keeps the original code as-is (hyphens included, e.g. `zh-cn`), but the `fn` value and the filename use underscores (`lang_zh_cn` / `lang/zh_cn.js`). Bitrequest loads only the active language at runtime — there's no longer a `<script>` tag to add to `index.html`. The dynamic loader looks up the `fn` field to resolve which function the file defines.
3. **Test everything** — verify variables render correctly, strings fit in the UI, and crypto terminology is natural. Pick your language in settings; the loader will fetch your file on demand.
4. Submit a pull request to the [Bitrequest repository](https://github.com/bitrequest/bitrequest.github.io)
