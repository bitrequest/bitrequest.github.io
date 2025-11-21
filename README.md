[<img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" height="50">](https://apps.apple.com/app/id1484815377)
[<img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" height="50">](https://play.google.com/store/apps/details?id=io.bitrequest.app)

* [About](https://github.com/bitrequest/bitrequest.github.io/wiki)
* [Privacy / Disclaimer](https://github.com/bitrequest/bitrequest.github.io/wiki/Privacy)
* [Terms and conditions](https://github.com/bitrequest/bitrequest.github.io/wiki/Terms-and-conditions)

## Bitrequest

Create and share payment requests for cryptocurrencies. Non-custodial, client-side PWA with real-time monitoring.

## Use cases

* Point of Sale (POS) with instant feedback.
* Send cryptocurrency payment requests to friends via URL sharing.
* Integrate in your webshop for e-commerce checkouts.

## Features

#### Requests
* __Create__ payment requests by entering amount in crypto or fiat (170 currencies).
* __Share__ pegged to fiat to reduce volatility; auto-shortens URLs (Firebase/Bitly/Native).
* Get __instant payment feedback__ via WebSocket/polling on public explorers/nodes.
* Supports __multiple cryptocurrencies__ (Bitcoin, Lightning, Nano, Litecoin, Dogecoin, Dash, Ethereum + ERC20/L2, Bitcoin-cash, Monero, Nimiq, Kaspa).
* __Manage requests__ (Monitor status, view details/tx history, archive/unarchive, receipts, CSV export).

#### Addresses
* __BIP44/Xpub__ key derivations from BIP39 seeds.
* __Manage multiple addresses__ (Arrange via drag-drop, view details/PK/VK, random selection).
* Set preferred number of __confirmations__ (zero-conf/instant-lock support).

#### Settings
* __Real-time exchange rates for 170 fiat currencies__, updated every 10 minutes.
* __Real-time/historical crypto rates__ (CoinMarketCap/CoinPaprika/CoinGecko) for volatility checks.
* __BIP39__ mnemonic seed with whitelists for security.
* Set __PIN code__ for admin access (cashier/view-only mode).
* Export CSV.
* __Backup/Restore__ (JSON download or Google Drive sync).
* Use/Manage __personal API keys/proxies__ (TOR support, multi-fallbacks).
* Connect to __personal (remote) nodes__ (Electrum/Infura/LND/LNbits).
* __Permissions:__ Admin or Cashier mode.  
* __Team invite:__ Invite members for restricted (cashier) access to shared addresses.  
* __Lightning:__ LND/LNbits nodes, LNURL/Boltcard/NFC integration.  
* __Ethereum L2:__ Base, Arbitrum one, Polygon pos, Binance Smart Chain support.  
* __QR Scanner:__ For addresses, viewkeys, nodes, LN connects.