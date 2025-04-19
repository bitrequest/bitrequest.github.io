const glob_multi_wallets = {
        "exodus": {
            "name": "exodus",
            "website": "https://www.exodus.io",
            "appstore": "https://apps.apple.com/app/id1414384820",
            "playstore": "https://play.google.com/store/apps/details?id=exodusmovement.exodus",
            "desktop": "https://www.exodus.io/desktop",
            "seed": true
        },
        "coinomi": {
            "name": "coinomi",
            "website": "https://www.coinomi.com",
            "appstore": "https://itunes.apple.com/app/id1333588809",
            "playstore": "https://play.google.com/store/apps/details?id=com.coinomi.wallet",
            "desktop": "https://www.coinomi.com/en/downloads/",
            "seed": true
        },
        "trezor": {
            "name": "trezor",
            "website": "https://trezor.io",
            "appstore": "https://trezor.io",
            "playstore": "https://trezor.io",
            "desktop": "https://trezor.io",
            "seed": true
        },
        "ledger": {
            "name": "ledger",
            "website": "https://www.ledger.com",
            "appstore": "https://itunes.apple.com/app/id1361671700",
            "playstore": "https://play.google.com/store/apps/details?id=com.ledger.live",
            "desktop": "https://www.ledger.com/ledger-live/download",
            "seed": true
        },
        "keepkey": {
            "name": "keepkey",
            "website": "https://shapeshift.com/keepkey",
            "appstore": "https://beta.shapeshift.com",
            "playstore": "https://beta.shapeshift.com",
            "desktop": "https://beta.shapeshift.com",
            "seed": true
        },
        "atomicwallet": {
            "name": "atomicwallet",
            "website": "https://atomicwallet.io",
            "appstore": "https://apps.apple.com/app/id1478257827",
            "playstore": "https://play.google.com/store/apps/details?id=io.atomicwallet",
            "desktop": "https://atomicwallet.io/#download-section-anchor",
            "seed": true
        },
        "cakewallet": {
            "name": "cakewallet",
            "website": "https://cakewallet.com",
            "appstore": "https://apps.apple.com/app/id1334702542",
            "playstore": "https://play.google.com/store/apps/details?id=com.cakewallet.cake_wallet",
            "desktop": "https://cakewallet.com",
            "seed": true
        },
        "stackwallet": {
            "name": "stackwallet",
            "website": "https://stackwallet.com",
            "appstore": "https://apps.apple.com/app/id1634811534",
            "playstore": "https://play.google.com/store/apps/details?id=com.cypherstack.stackwallet",
            "desktop": "https://stackwallet.com",
            "seed": true
        }
    },
    glob_config = {
        "bitrequest_coin_data": [{
                "currency": "bitcoin",
                "active": true,
                "data": {
                    "currency": "bitcoin",
                    "ccsymbol": "btc",
                    "cmcid": 1,
                    "urlscheme": function(payment, address, amount, iszero) {
                        return btc_urlscheme(payment, address, amount, iszero);
                    },
                    "address_regex": "^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-zAC-HJ-NP-Z02-9]{11,71})$"
                },
                "wallets": {
                    "wallet_download_page": "https://bitcoin.org/en/choose-your-wallet",
                    "wallets": [
                        glob_multi_wallets.cakewallet,
                        glob_multi_wallets.exodus,
                        glob_multi_wallets.coinomi,
                        glob_multi_wallets.trezor,
                        glob_multi_wallets.ledger,
                        glob_multi_wallets.stackwallet,
                        {
                            "name": "electrum",
                            "website": "https://electrum.org",
                            "appstore": null,
                            "playstore": "https://play.google.com/store/apps/details?id=org.electrum.electrum",
                            "desktop": "https://electrum.org",
                            "seed": true
                        },
                        {
                            "name": "mycelium",
                            "website": "https://wallet.mycelium.com",
                            "appstore": null,
                            "playstore": "https://play.google.com/store/apps/details?id=com.mycelium.wallet",
                            "desktop": null,
                            "seed": true
                        },
                        {
                            "name": "blw",
                            "website": "https://lightning-wallet.com",
                            "appstore": null,
                            "playstore": "https://play.google.com/store/apps/details?id=com.lightning.walletapp",
                            "desktop": null,
                            "seed": true
                        },
                        {
                            "name": "bluewallet",
                            "website": "https://bluewallet.io",
                            "appstore": "https://apps.apple.com/app/id1376878040",
                            "playstore": "https://play.google.com/store/apps/details?id=io.bluewallet.bluewallet",
                            "desktop": "https://bluewallet.io/desktop-bitcoin-wallet/",
                            "seed": true
                        }
                    ]
                },
                "lightning_wallets": {
                    "wallet_download_page": "https://bitcoin.org/en/choose-your-wallet",
                    "wallets": [{
                            "name": "lnbits",
                            "website": "https://lnbits.com/",
                            "appstore": null,
                            "playstore": null,
                            "desktop": "https://legend.lnbits.com/",
                            "seed": false
                        },
                        {
                            "name": "breeze",
                            "website": "https://breez.technology",
                            "appstore": "https://testflight.apple.com/join/wPju2Du7",
                            "playstore": "https://play.google.com/apps/testing/com.breez.client",
                            "desktop": null,
                            "seed": false
                        },
                        {
                            "name": "phoenix",
                            "website": "https://phoenix.acinq.co",
                            "appstore": "https://apps.apple.com/app/id1544097028",
                            "playstore": "https://play.google.com/store/apps/details?id=fr.acinq.phoenix.mainnet",
                            "desktop": null,
                            "seed": true
                        },
                        {
                            "name": "walletofsatoshi",
                            "website": "https://www.walletofsatoshi.com",
                            "appstore": "https://apps.apple.com/app/id1438599608",
                            "playstore": "https://play.google.com/store/apps/details?id=com.livingroomofsatoshi.wallet",
                            "desktop": null,
                            "seed": false
                        },
                        {
                            "name": "zap",
                            "website": "https://www.walletofsatoshi.com",
                            "appstore": "https://apps.apple.com/app/id1406311960",
                            "playstore": "https://play.google.com/store/apps/details?id=zapsolutions.zap",
                            "desktop": "https://zaphq.io/download",
                            "seed": false
                        },
                        {
                            "name": "zeus",
                            "website": "https://zeusln.app",
                            "appstore": "https://apps.apple.com/app/id1456038895",
                            "playstore": "https://play.google.com/store/apps/details?id=app.zeusln.zeus",
                            "desktop": null,
                            "seed": false
                        }
                    ]
                },
                "settings": {
                    "confirmations": {
                        "icon": "clock",
                        "selected": 0
                    },
                    "showsatoshis": {
                        "icon": "eye",
                        "selected": false,
                        "switch": true,
                    },
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "Reuse address": {
                        "icon": "recycle",
                        "selected": false,
                        "switch": true,
                        "custom_switch": true
                    },
                    "Lightning network": {
                        "icon": "power",
                        "selected": false,
                        "switch": true,
                        "custom_switch": true,
                        "selected_proxy": false,
                        "proxies": [],
                        "selected_service": false,
                        "services": []
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "mempool.space",
                        "options": ["mempool.space", "blockchain.com", "blockchair.com"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "mempool.space",
                            "url": "mempool.space",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                                "name": "mempool.space",
                                "url": "mempool.space",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "electrum",
                                "url": "electrum.emzy.de:50002",
                                "display": true
                            },
                            {
                                "name": "electrum",
                                "url": "electrum.blockstream.info:50002",
                                "display": true
                            },
                            {
                                "name": "electrum",
                                "url": "electrum.bitaroo.net:50002",
                                "display": true
                            },
                            {
                                "name": "blockcypher",
                                "url": "blockcypher.com",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "blockchain.info",
                                "url": "blockchain.info",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "blockchair",
                                "url": "blockchair.com",
                                "api": true,
                                "display": false
                            }
                        ],
                        "options": []
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "mempool.space websocket",
                            "url": "wss://mempool.space/api/v1/ws",
                            "display": true
                        },
                        "apis": [{
                                "name": "mempool.space websocket",
                                "url": "wss://mempool.space/api/v1/ws",
                                "display": true
                            },
                            {
                                "name": "blockchain.info websocket",
                                "url": "wss://ws.blockchain.info/inv",
                                "display": true
                            },
                            {
                                "name": "blockcypher wss",
                                "url": glob_const.main_bc_wss,
                                "display": true
                            },
                            {
                                "name": "blockcypher ws",
                                "url": glob_const.main_bc_ws,
                                "display": false
                            },
                            {
                                "name": "sochain api",
                                "url": "wss://ws.chain.so/",
                                "display": true
                            }
                        ],
                        "options": [],
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
                        "root_path": "m/84'/0'/0'/0/",
                        "prefix": {
                            "pub": 0,
                            "pubx": 76067358,
                            "privx": 76066276,
                            "pubz": 78792518,
                            "privz": 78791436
                        },
                        "pk_vbytes": {
                            "wif": 128
                        }
                    },
                    "Key derivations": {
                        "icon": "cog",
                        "selected": "compatiblewallets",
                        "segwit": true
                    }
                }
            },
            {
                "currency": "litecoin",
                "active": true,
                "data": {
                    "currency": "litecoin",
                    "ccsymbol": "ltc",
                    "cmcid": 2,
                    "urlscheme": function(payment, address, amount, iszero) {
                        return btc_urlscheme(payment, address, amount, iszero);
                    },
                    "address_regex": "^([LM][a-km-zA-HJ-NP-Z1-9]{26,33}|ltc1[a-zA-HJ-NP-Z0-9]{26,39})$"
                },
                "wallets": {
                    "wallet_download_page": "https://litecoin.org",
                    "wallets": [
                        glob_multi_wallets.cakewallet,
                        glob_multi_wallets.exodus,
                        glob_multi_wallets.coinomi,
                        glob_multi_wallets.trezor,
                        glob_multi_wallets.ledger,
                        glob_multi_wallets.keepkey,
                        glob_multi_wallets.stackwallet,
                        {
                            "name": "electrum",
                            "website": "https://electrum-ltc.org",
                            "appstore": null,
                            "playstore": null,
                            "desktop": "https://electrum-ltc.org",
                            "seed": true
                        }
                    ]
                },
                "settings": {
                    "confirmations": {
                        "icon": "clock",
                        "selected": 0
                    },
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "Reuse address": {
                        "icon": "recycle",
                        "selected": false,
                        "switch": true,
                        "custom_switch": true
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "litecoinspace.org",
                        "options": ["litecoinspace.org", "blockchair.com"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "mempool.space",
                            "url": "litecoinspace.org",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                                "name": "mempool.space",
                                "url": "litecoinspace.org",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "electrum",
                                "url": "ltc.aftrek.org:50002",
                                "display": true
                            },
                            {
                                "name": "electrum",
                                "url": "electrum-ltc.bysh.me:50002",
                                "display": true
                            },
                            {
                                "name": "electrum",
                                "url": "electrum.ltc.xurious.com:50002",
                                "display": true
                            },
                            {
                                "name": "blockcypher",
                                "url": "blockcypher.com",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "blockchair",
                                "url": "blockchair.com",
                                "api": true,
                                "display": false
                            }
                        ],
                        "options": []
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "blockcypher wss",
                            "url": glob_const.main_bc_wss,
                            "display": true
                        },
                        "apis": [{
                                "name": "blockcypher wss",
                                "url": glob_const.main_bc_wss,
                                "display": true
                            },
                            {
                                "name": "blockcypher ws",
                                "url": glob_const.main_bc_ws,
                                "display": false
                            },
                            {
                                "name": "mempool.space websocket",
                                "url": "wss://litecoinspace.org/api/v1/ws",
                                "display": true
                            },
                            {
                                "name": "sochain api",
                                "url": "wss://ws.chain.so/",
                                "display": true
                            }
                        ],
                        "options": [],
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
                        "root_path": "m/84'/2'/0'/0/",
                        "prefix": {
                            "pub": 48,
                            "pubx": 27108450,
                            "privx": 27106558,
                            "pubz": 78792518,
                            "privz": 78791436
                        },
                        "pk_vbytes": {
                            "wif": 176
                        }
                    },
                    "Key derivations": {
                        "icon": "cog",
                        "selected": "compatiblewallets",
                        "segwit": true
                    }
                }
            },
            {
                "currency": "dogecoin",
                "active": true,
                "data": {
                    "currency": "dogecoin",
                    "ccsymbol": "doge",
                    "cmcid": 74,
                    "urlscheme": function(payment, address, amount, iszero) {
                        return btc_urlscheme(payment, address, amount, iszero);
                    },
                    "address_regex": "^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$"
                },
                "wallets": {
                    "wallet_download_page": "https://dogecoin.com/getting-started/",
                    "wallets": [
                        glob_multi_wallets.exodus,
                        glob_multi_wallets.coinomi,
                        glob_multi_wallets.trezor,
                        glob_multi_wallets.ledger,
                        glob_multi_wallets.keepkey,
                        glob_multi_wallets.stackwallet,
                    ]
                },
                "settings": {
                    "confirmations": {
                        "icon": "clock",
                        "selected": 0
                    },
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "Reuse address": {
                        "icon": "recycle",
                        "selected": false,
                        "switch": true,
                        "custom_switch": true
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "blockchair.com"
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "blockcypher",
                            "url": "blockcypher.com",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                                "name": "blockcypher",
                                "url": "blockcypher.com",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "blockchair",
                                "url": "blockchair.com",
                                "api": true,
                                "display": true
                            }
                        ],
                        "options": []
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "blockcypher wss",
                            "url": glob_const.main_bc_wss,
                            "display": true
                        },
                        "apis": [{
                                "name": "blockcypher wss",
                                "url": glob_const.main_bc_wss,
                                "display": true
                            },
                            {
                                "name": "blockcypher ws",
                                "url": glob_const.main_bc_ws,
                                "display": false
                            },
                            {
                                "name": "sochain api",
                                "url": "wss://ws.chain.so/",
                                "display": true
                            }
                        ],
                        "options": [],
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
                        "root_path": "m/44'/3'/0'/0/",
                        "prefix": {
                            "pub": 30,
                            "pubx": 49990397,
                            "privx": 49988504
                        },
                        "pk_vbytes": {
                            "wif": 158
                        }
                    },
                    "Key derivations": {
                        "icon": "cog",
                        "selected": "compatiblewallets",
                    }
                }
            },
            {
                "currency": "dash",
                "active": true,
                "data": {
                    "currency": "dash",
                    "ccsymbol": "dash",
                    "cmcid": 131,
                    "urlscheme": function(payment, address, amount, iszero) {
                        return btc_urlscheme(payment, address, amount, iszero);
                    },
                    "address_regex": "^X[1-9A-HJ-NP-Za-km-z]{33}"
                },
                "wallets": {
                    "wallet_download_page": "https://www.dash.org/downloads/",
                    "wallets": [
                        glob_multi_wallets.exodus,
                        glob_multi_wallets.coinomi,
                        glob_multi_wallets.trezor,
                        glob_multi_wallets.ledger,
                        glob_multi_wallets.stackwallet,
                        {
                            "name": "Dash-Wallet",
                            "website": "https://www.dash.org",
                            "appstore": "https://itunes.apple.com/app/id1206647026",
                            "playstore": "https://play.google.com/store/apps/details?id=hashengineering.darkcoin.wallet",
                            "desktop": "https://www.dash.org",
                            "seed": true
                        }
                    ]
                },
                "settings": {
                    "confirmations": {
                        "icon": "clock",
                        "selected": 0
                    },
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "Reuse address": {
                        "icon": "recycle",
                        "selected": false,
                        "switch": true,
                        "custom_switch": true
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "blockchair.com",
                        "options": ["blockchair.com", "dash.org", "cryptoid.info"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "dash.org",
                            "url": "insight.dash.org",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                                "name": "dash.org",
                                "url": "insight.dash.org",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "blockcypher",
                                "url": "blockcypher.com",
                                "api": true,
                                "display": false
                            },
                            {
                                "name": "blockchair",
                                "url": "blockchair.com",
                                "api": true,
                                "display": false
                            }
                        ]
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "dash.org",
                            "url": "insight.dash.org",
                            "display": true
                        },
                        "apis": [{
                                "name": "dash.org",
                                "url": "insight.dash.org",
                                "display": true
                            },
                            {
                                "name": "blockcypher wss",
                                "url": glob_const.main_bc_wss,
                                "display": false
                            },
                            {
                                "name": "blockcypher ws",
                                "url": glob_const.main_bc_ws,
                                "display": false
                            }
                        ],
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
                        "root_path": "m/44'/5'/0'/0/",
                        "prefix": {
                            "pub": 76,
                            "pubx": 76067358,
                            "privx": 76066276
                        },
                        "pk_vbytes": {
                            "wif": 204
                        }
                    },
                    "Key derivations": {
                        "icon": "cog",
                        "selected": "compatiblewallets",
                    }
                }
            },
            {
                "currency": "bitcoin-cash",
                "active": true,
                "data": {
                    "currency": "bitcoin-cash",
                    "ccsymbol": "bch",
                    "cmcid": 1831,
                    "urlscheme": function(payment, address, amount, iszero) {
                        return bch_urlscheme(payment, address, amount, iszero);
                    },
                    "address_regex": "(q|p)[a-z0-9]{41}"
                },
                "wallets": {
                    "wallet_download_page": "https://bch.info/en/wallets",
                    "wallets": [
                        glob_multi_wallets.cakewallet,
                        glob_multi_wallets.exodus,
                        glob_multi_wallets.coinomi,
                        glob_multi_wallets.trezor,
                        glob_multi_wallets.ledger,
                        glob_multi_wallets.atomicwallet,
                        glob_multi_wallets.stackwallet,
                        {
                            "name": "electron-cash",
                            "website": "https://electroncash.org",
                            "appstore": "https://itunes.apple.com/app/id1359700089",
                            "playstore": "https://play.google.com/store/apps/details?id=org.electroncash.wallet",
                            "desktop": "https://electroncash.org",
                            "seed": true
                        }
                    ]
                },
                "settings": {
                    "confirmations": {
                        "icon": "clock",
                        "selected": 0
                    },
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "Reuse address": {
                        "icon": "recycle",
                        "selected": false,
                        "switch": true,
                        "custom_switch": true
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "blockchain.com",
                        "options": ["blockchain.com", "blockchair.com"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "blockchain.info",
                            "url": "blockchain.info",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                                "name": "blockchain.info",
                                "url": "blockchain.info",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "electrum",
                                "url": "electroncash.de:50002",
                                "display": true
                            },
                            {
                                "name": "electrum",
                                "url": "bch.imaginary.cash:50002",
                                "display": true
                            },
                            {
                                "name": "blockchair",
                                "url": "blockchair.com",
                                "api": true,
                                "display": true
                            }
                        ],
                        "options": []
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "blockchain.info websocket",
                            "url": "wss://ws.blockchain.info/bch/inv",
                            "display": true
                        },
                        "apis": [{
                            "name": "blockchain.info websocket",
                            "url": "wss://ws.blockchain.info/bch/inv",
                            "display": true
                        }],
                        "options": [],
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
                        "root_path": "m/44'/145'/0'/0/",
                        "prefix": {
                            "pub": 0,
                            "pubx": 76067358,
                            "privx": 76066276
                        },
                        "pk_vbytes": {
                            "wif": 128
                        }
                    },
                    "Key derivations": {
                        "icon": "cog",
                        "selected": "compatiblewallets",
                    }
                }
            },
            {
                "currency": "ethereum",
                "active": true,
                "data": {
                    "currency": "ethereum",
                    "ccsymbol": "eth",
                    "cmcid": 1027,
                    "urlscheme": function(payment, address, amount, iszero) {
                        const amnt = (iszero === true) ? "" : "?value=" + tofixedspecial((parseFloat(amount) * 1000000000000000000).toString(), 0);
                        return payment + ":" + address + amnt;
                    },
                    "address_regex": "^0x[a-fA-F0-9]{40}$"
                },
                "wallets": {
                    "wallet_download_page": "https://ethereum.org/en/wallets/",
                    "wallets": [
                        glob_multi_wallets.cakewallet,
                        glob_multi_wallets.exodus,
                        glob_multi_wallets.trezor,
                        glob_multi_wallets.ledger,
                        glob_multi_wallets.keepkey,
                        glob_multi_wallets.stackwallet,
                        {
                            "name": "myetherwallet",
                            "website": "https://www.mewwallet.com",
                            "appstore": "https://apps.apple.com/app/id1464614025",
                            "playstore": "https://play.google.com/store/apps/details?id=com.myetherwallet.mewwallet",
                            "desktop": "https://www.myetherwallet.com",
                            "seed": true
                        },
                        {
                            "name": "metamask",
                            "website": "https://metamask.io",
                            "desktop": "https://metamask.io/download",
                            "seed": true
                        }
                    ]
                },
                "settings": {
                    "confirmations": {
                        "icon": "clock",
                        "selected": 0
                    },
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "Reuse address": {
                        "icon": "recycle",
                        "selected": true,
                        "switch": true,
                        "custom_switch": true,
                        "warning": true
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "etherscan.io",
                        "options": ["etherscan.io", "blockchain.com", "blockchair.com"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "etherscan",
                            "url": "etherscan.io",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                                "name": "etherscan",
                                "url": "etherscan.io",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "blockcypher",
                                "url": "blockcypher.com",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "blockchair",
                                "url": "blockchair.com",
                                "api": true,
                                "display": false
                            },
                            {
                                "name": "infura",
                                "url": glob_const.main_eth_node,
                                "display": true
                            }
                        ],
                        "options": [],
                        "rpc_test_command": {
                            "method": null
                        }
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "alchemy",
                            "url": glob_const.main_alchemy_socket,
                            "display": true
                        },
                        "apis": [{
                            "name": "alchemy",
                            "url": glob_const.main_alchemy_socket,
                            "display": true
                        }],
                        "options": []
                    },
                    "layer2": {
                        "icon": "new-tab",
                        "selected": false,
                        "options": {
                            "arbitrum": {
                                "selected": false,
                                "apis": {
                                    "icon": "sphere",
                                    "selected": {
                                        "network": "arbitrum",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    "apis": [{
                                            "network": "arbitrum",
                                            "name": "etherscan",
                                            "url": "etherscan.io",
                                            "api": true,
                                            "display": true
                                        },
                                        {
                                            "network": "arbitrum",
                                            "name": "arbiscan",
                                            "url": "arbiscan.io",
                                            "api": true,
                                            "display": true
                                        }
                                    ]
                                },
                                "websockets": {
                                    "icon": "tab",
                                    "selected": {
                                        "network": "arbitrum",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    "apis": [{
                                            "network": "arbitrum",
                                            "name": "etherscan",
                                            "url": "etherscan.io",
                                            "api": true,
                                            "display": true
                                        },
                                        {
                                            "network": "arbitrum",
                                            "name": "arbiscan",
                                            "url": "arbiscan.io",
                                            "api": true,
                                            "display": true
                                        }
                                    ]
                                }
                            },
                            "polygon": {
                                "selected": false,
                                "apis": {
                                    "icon": "sphere",
                                    "selected": {
                                        "network": "polygon",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    "apis": [{
                                            "network": "polygon",
                                            "name": "etherscan",
                                            "url": "etherscan.io",
                                            "api": true,
                                            "display": true
                                        },
                                        {
                                            "network": "polygon",
                                            "name": "polygonscan",
                                            "url": "polygonscan.com",
                                            "api": true,
                                            "display": true
                                        }
                                    ]
                                },
                                "websockets": {
                                    "icon": "tab",
                                    "selected": {
                                        "network": "polygon",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    "apis": [{
                                            "network": "polygon",
                                            "name": "etherscan",
                                            "url": "etherscan.io",
                                            "api": true,
                                            "display": true
                                        },
                                        {
                                            "network": "polygon",
                                            "name": "polygonscan",
                                            "url": "polygonscan.com",
                                            "api": true,
                                            "display": true
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    "Xpub": {
                        "active": true,
                        "xpub": true,
                        "icon": "key",
                        "switch": true,
                        "custom_switch": true,
                        "selected": false,
                        "key": null,
                        "root_path": "m/44'/60'/0'/0/",
                        "prefix": {
                            "pub": 0,
                            "pubx": 76067358,
                            "privx": 76066276
                        },
                        "pk_vbytes": {
                            "wif": 128
                        }
                    },
                    "Key derivations": {
                        "icon": "cog",
                        "selected": "compatiblewallets",
                    }
                }
            },
            {
                "currency": "nano",
                "active": true,
                "data": {
                    "currency": "nano",
                    "ccsymbol": "xno",
                    "cmcid": 1567,
                    "urlscheme": function(payment, address, amount, iszero) {
                        const amnt = (iszero === true) ? "" : "?amount=" + (NanocurrencyWeb.tools.convert(amount, "NANO", "RAW"))
                        return "nano:" + address + amnt;
                    },
                    "address_regex": "^(xrb|nano)_([a-z1-9]{60})$"
                },
                "wallets": {
                    "wallet_download_page": "https://nanowallets.guide",
                    "wallets": [
                        glob_multi_wallets.cakewallet,
                        {
                            "name": "nautilus",
                            "website": "https://nautilus.io",
                            "appstore": "https://apps.apple.com/app/id1615775960",
                            "playstore": "https://play.google.com/store/apps/details?id=co.perish.nautiluswallet",
                            "seed": true
                        },
                        {
                            "name": "nault",
                            "website": "https://nault.cc",
                            "appstore": "https://nault.cc",
                            "playstore": "https://nault.cc",
                            "desktop": "https://nault.cc",
                            "seed": true
                        },
                        {
                            "name": "natrium",
                            "website": "https://natrium.io",
                            "appstore": "https://itunes.apple.com/app/id1451425707",
                            "playstore": "https://play.google.com/store/apps/details?id=co.banano.natriumwallet",
                            "desktop": null
                        }
                    ]
                },
                "settings": {
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "Reuse address": {
                        "icon": "recycle",
                        "selected": true,
                        "switch": true,
                        "custom_switch": true,
                        "warning": true
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "nanexplorer.com",
                        "options": ["nanexplorer.com", "blocklattice.io", "spynano.org"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "bitrequest.app",
                            "url": "https://www.bitrequest.app:8020",
                            "username": "",
                            "password": "",
                            "display": true
                        },
                        "apis": [{
                                "name": "bitrequest.app",
                                "url": "https://www.bitrequest.app:8020",
                                "username": "",
                                "password": "",
                                "display": true
                            },
                            {
                                "name": "app.natrium.io",
                                "url": "https://app.natrium.io/api",
                                "username": "",
                                "password": "",
                                "display": true
                            },
                            {
                                "name": "node.somenano.com",
                                "url": "https://node.somenano.com/proxy",
                                "username": "",
                                "password": "",
                                "display": true
                            },
                            {
                                "name": "nanoslo.0x.no",
                                "url": "https://nanoslo.0x.no/proxy",
                                "username": "",
                                "password": "",
                                "display": true
                            },
                            {
                                "name": "rainstorm.city",
                                "url": "https://rainstorm.city/api",
                                "username": "",
                                "password": "",
                                "display": true
                            }

                        ],
                        "options": [],
                        "rpc_test_command": {
                            "action": "version"
                        }
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "bitrequest.app",
                            "url": "wss://bitrequest.app:8010",
                            "display": true
                        },
                        "apis": [{
                                "name": "bitrequest.app",
                                "url": "wss://bitrequest.app:8010",
                                "display": true
                            },
                            {
                                "name": "node.somenano.com",
                                "url": "wss://node.somenano.com/websocket",
                                "display": true
                            },
                            {
                                "name": "NanOslo websocket",
                                "url": "wss://nanoslo.0x.no/websocket",
                                "display": true
                            },
                            {
                                "name": "rainstorm.city websocket",
                                "url": "wss://rainstorm.city/websocket",
                                "display": true
                            }
                        ],
                        "options": [],
                        "poll_fallback": true
                    },
                    "Xpub": {
                        "active": true,
                        "xpub": false,
                        "icon": "key",
                        "switch": true,
                        "custom_switch": true,
                        "selected": false,
                        "key": null,
                        "root_path": "m/44'/165'/0'/0/",
                        "prefix": {
                            "pub": 0,
                            "pubx": "00000000",
                            "privx": "00000000"
                        },
                        "pk_vbytes": {
                            "wif": 0
                        }
                    },
                    "Key derivations": {
                        "icon": "cog",
                        "selected": "compatiblewallets",
                    }
                }
            },
            {
                "currency": "monero",
                "active": true,
                "data": {
                    "currency": "monero",
                    "ccsymbol": "xmr",
                    "cmcid": "328",
                    "urlscheme": function(payment, address, amount, iszero) {
                        return payment + ":" + address + ((iszero === true) ? "" : "?tx_amount=" + amount);
                    },
                    "address_regex": "^[48](?:[0-9AB]|[1-9A-HJ-NP-Za-km-z]{12}(?:[1-9A-HJ-NP-Za-km-z]{30})?)[1-9A-HJ-NP-Za-km-z]{93}$"
                },
                "wallets": {
                    "wallet_download_page": "https://www.getmonero.org/downloads/",
                    "wallets": [
                        glob_multi_wallets.coinomi,
                        glob_multi_wallets.cakewallet,
                        glob_multi_wallets.stackwallet,
                        {
                            "name": "monerujo",
                            "website": "https://www.monerujo.io",
                            "appstore": null,
                            "playstore": "https://play.google.com/store/apps/details?id=com.m2049r.xmrwallet",
                            "desktop": null,
                            "seed": true
                        },
                        {
                            "name": "mymonero",
                            "website": "https://mymonero.com",
                            "appstore": "https://apps.apple.com/app/id1372508199",
                            "playstore": null,
                            "desktop": "https://github.com/mymonero/mymonero-app-js/releases",
                            "seed": true
                        },
                        {
                            "name": "guiwallet",
                            "website": "https://www.getmonero.org",
                            "appstore": null,
                            "playstore": null,
                            "desktop": "https://www.getmonero.org/downloads/#gui",
                            "seed": true
                        }
                    ]
                },
                "settings": {
                    "confirmations": {
                        "icon": "clock",
                        "selected": 0
                    },
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "Share viewkey": {
                        "icon": "eye",
                        "selected": "Let the receiver monitor your request",
                        "switch": true,
                    },
                    "Integrated addresses": {
                        "icon": "cog",
                        "selected": false,
                        "switch": true,
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "blockchair.com",
                        "options": ["blockchair.com", "monero.com"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "mymonero api",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                            "name": "mymonero api",
                            "api": true,
                            "display": true
                        }]
                    },
                    "Xpub": {
                        "active": true,
                        "xpub": false,
                        "icon": "key",
                        "switch": true,
                        "custom_switch": true,
                        "selected": false,
                        "key": null,
                        "root_path": "m/44'/128'/0'/0/",
                        "prefix": {
                            "pub": 0,
                            "pubx": "00000000",
                            "privx": "00000000"
                        },
                        "pk_vbytes": {
                            "wif": 0
                        }
                    },
                    "Key derivations": {
                        "icon": "cog",
                        "selected": "compatiblewallets",
                    }
                }
            },
            {
                "currency": "kaspa",
                "active": true,
                "data": {
                    "currency": "kaspa",
                    "ccsymbol": "kas",
                    "cmcid": 20396,
                    "urlscheme": function(payment, address, amount, iszero) {
                        return btc_urlscheme(payment, address.split(":").pop(), amount, iszero);
                    },
                    "address_regex": "^(kaspa):([a-z0-9]{50})"
                },
                "wallets": {
                    "wallet_download_page": "https://www.kaspa.org",
                    "wallets": [{
                        "name": "wallet.kaspanet.io",
                        "website": "https://wallet.kaspanet.io",
                        "appstore": null,
                        "playstore": null,
                        "desktop": "https://wallet.kaspanet.io",
                        "seed": false
                    }]
                },
                "settings": {
                    "confirmations": {
                        "icon": "clock",
                        "selected": 0
                    },
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "explorer.kaspa.org",
                        "options": ["explorer.kaspa.org", "kas.fyi"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "kaspa.org",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                                "name": "kaspa.org",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "kas.fyi",
                                "api": true,
                                "display": true
                            }
                        ]
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": glob_const.main_kas_wss,
                            "url": glob_const.main_kas_wss,
                            "display": true
                        },
                        "apis": [{
                                "name": glob_const.main_kas_wss,
                                "url": glob_const.main_kas_wss,
                                "display": true
                            },
                            {
                                "name": glob_const.sec_kas_wss,
                                "url": glob_const.sec_kas_wss,
                                "display": true
                            }
                        ],
                        "poll_fallback": true
                    },
                    "Xpub": {
                        "active": false,
                        "xpub": false,
                        "icon": "key",
                        "switch": true,
                        "custom_switch": true,
                        "selected": false,
                        "key": null,
                        "root_path": "m/44'/972'/0'/0/",
                        "prefix": {
                            "pub": 0,
                            "pubx": 76067358,
                            "privx": 76066276
                        },
                        "pk_vbytes": {
                            "wif": 128
                        }
                    }
                }
            },
            {
                "currency": "nimiq",
                "active": true,
                "data": {
                    "currency": "nimiq",
                    "ccsymbol": "nim",
                    "cmcid": 2916,
                    "urlscheme": function(payment, address, amount, iszero) {
                        return btc_urlscheme(payment, address, amount, iszero);
                    },
                    "address_regex": "^(NQ)[a-zA-Z0-9]{34}"
                },
                "wallets": {
                    "wallet_download_page": "https://www.nimiq.com",
                    "wallets": [
                        glob_multi_wallets.atomicwallet,
                        {
                            "name": "wallet.nimiq.com",
                            "website": "https://wallet.nimiq.com",
                            "appstore": null,
                            "playstore": null,
                            "desktop": "https://wallet.nimiq.com",
                            "seed": false
                        }
                    ]
                },
                "settings": {
                    "confirmations": {
                        "icon": "clock",
                        "selected": 0
                    },
                    "Use random address": {
                        "icon": "dice",
                        "selected": false,
                        "switch": true,
                    },
                    "blockexplorers": {
                        "icon": "eye",
                        "selected": "nimiq.watch",
                        "options": ["nimiq.watch", "mopsus.com"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "nimiq.watch",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                                "name": "nimiq.watch",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "mopsus.com",
                                "api": true,
                                "display": true
                            }
                        ]
                    },
                    "Xpub": {
                        "active": false,
                        "xpub": false,
                        "icon": "key",
                        "switch": true,
                        "custom_switch": true,
                        "selected": false,
                        "key": null,
                        "root_path": "m/44'/242'/0'/0/",
                        "prefix": {
                            "pub": 0,
                            "pubx": "00000000",
                            "privx": "00000000"
                        },
                        "pk_vbytes": {
                            "wif": 0
                        }
                    }
                }
            }
        ],
        "erc20_dat": {
            "data": {
                "monitored": true,
                "url-scheme": "",
                "address_regex": "^0x[a-fA-F0-9]{40}$",
                "erc20": true
            },
            "wallets": {
                "wallet_download_page": "https://ethereum.org/en/wallets/",
                "wallets": [{
                        "name": "myetherwallet",
                        "website": "https://www.mewwallet.com",
                        "appstore": "https://apps.apple.com/app/id1464614025",
                        "playstore": "https://play.google.com/store/apps/details?id=com.myetherwallet.mewwallet",
                        "desktop": "https://www.myetherwallet.com"
                    },
                    {
                        "name": "metamask",
                        "website": "https://metamask.io",
                        "desktop": "https://metamask.io/download",
                        "seed": true
                    },
                    {
                        "name": "enjin",
                        "website": "https://enjin.io/software/wallet",
                        "appstore": "https://apps.apple.com/app/id1349078375",
                        "playstore": "http://enj.in/google-play",
                        "desktop": null
                    }
                ]
            },
            "settings": {
                "confirmations": {
                    "icon": "clock",
                    "selected": 0
                },
                "Use random address": {
                    "icon": "dice",
                    "selected": false,
                    "switch": true,
                },
                "blockexplorers": {
                    "icon": "eye",
                    "selected": "ethplorer.io"
                },
                "apis": {
                    "icon": "sphere",
                    "selected": {
                        "name": "ethplorer",
                        "url": "ethplorer.io",
                        "api": true,
                        "display": true
                    },
                    "apis": [{
                            "name": "ethplorer",
                            "url": "ethplorer.io",
                            "api": true,
                            "display": true
                        },
                        {
                            "name": "blockchair",
                            "url": "blockchair.com",
                            "api": true,
                            "display": true
                        },
                        {
                            "name": "infura",
                            "url": glob_const.main_eth_node,
                            "display": true
                        }
                    ],
                    "options": [],
                    "rpc_test_command": {
                        "method": null
                    }
                },
                "websockets": {
                    "icon": "tab",
                    "selected": {
                        "name": "infura_main_ws",
                        "url": glob_const.main_eth_socket,
                        "display": true
                    },
                    "apis": [{
                        "name": "infura_main_ws",
                        "url": glob_const.main_eth_socket,
                        "display": true
                    }],
                    "options": [],
                    "poll_fallback": true
                },
                "layer2": {
                    "icon": "new-tab",
                    "selected": false,
                    "options": {
                        "arbitrum": {
                            "selected": false,
                            "apis": {
                                "icon": "sphere",
                                "selected": {
                                    "network": "arbitrum",
                                    "name": "etherscan",
                                    "url": "etherscan.io",
                                    "api": true,
                                    "display": true
                                },
                                "apis": [{
                                        "network": "arbitrum",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "arbitrum",
                                        "name": "arbiscan",
                                        "url": "arbiscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "arbitrum",
                                        "name": "infura",
                                        "url": glob_const.main_arbitrum_node,
                                        "api": true,
                                        "display": true
                                    }
                                ]
                            },
                            "websockets": {
                                "icon": "tab",
                                "selected": {
                                    "network": "arbitrum",
                                    "name": "infura",
                                    "url": glob_const.main_arbitrum_socket,
                                    "api": true,
                                    "display": true
                                },
                                "apis": [{
                                        "network": "arbitrum",
                                        "name": "infura",
                                        "url": glob_const.main_arbitrum_socket,
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "arbitrum",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "arbitrum",
                                        "name": "arbiscan",
                                        "url": "arbiscan.io",
                                        "api": true,
                                        "display": true
                                    }
                                ]
                            }
                        },
                        "polygon": {
                            "selected": false,
                            "apis": {
                                "icon": "sphere",
                                "selected": {
                                    "network": "polygon",
                                    "name": "etherscan",
                                    "url": "etherscan.io",
                                    "api": true,
                                    "display": true
                                },
                                "apis": [{
                                        "network": "polygon",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "polygon",
                                        "name": "polygonscan",
                                        "url": "polygonscan.com",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "polygon",
                                        "name": "infura",
                                        "url": glob_const.main_polygon_node,
                                        "api": true,
                                        "display": true
                                    }
                                ]
                            },
                            "websockets": {
                                "icon": "tab",
                                "selected": {
                                    "network": "polygon",
                                    "name": "infura",
                                    "url": glob_const.main_polygon_socket,
                                    "api": true,
                                    "display": true
                                },
                                "apis": [{
                                        "network": "polygon",
                                        "name": "infura",
                                        "url": glob_const.main_polygon_socket,
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "polygon",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "polygon",
                                        "name": "polygonscan",
                                        "url": "polygonscan.com",
                                        "api": true,
                                        "display": true
                                    }
                                ]
                            }
                        },
                        "bnb": {
                            "selected": false,
                            "apis": {
                                "icon": "sphere",
                                "selected": {
                                    "network": "bnb",
                                    "name": "etherscan",
                                    "url": "etherscan.io",
                                    "api": true,
                                    "display": true
                                },
                                "apis": [{
                                        "network": "bnb",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "bnb",
                                        "name": "bscscan",
                                        "url": "bscscan.com",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "bnb",
                                        "name": "binplorer",
                                        "url": "binplorer.com",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "bnb",
                                        "name": "infura",
                                        "url": glob_const.main_bnb_node,
                                        "api": true,
                                        "display": true
                                    }
                                ]
                            },
                            "websockets": {
                                "icon": "tab",
                                "selected": {
                                    "network": "bnb",
                                    "name": "infura",
                                    "url": glob_const.main_bnb_socket,
                                    "api": true,
                                    "display": true
                                },
                                "apis": [{
                                        "network": "bnb",
                                        "name": "infura",
                                        "url": glob_const.main_bnb_socket,
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "bnb",
                                        "name": "etherscan",
                                        "url": "etherscan.io",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "bnb",
                                        "name": "bscscan",
                                        "url": "bscscan.com",
                                        "api": true,
                                        "display": true
                                    },
                                    {
                                        "network": "bnb",
                                        "name": "binplorer",
                                        "url": "binplorer.com",
                                        "api": true,
                                        "display": true
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        },
        "app_settings": [{
                "id": "accountsettings",
                "heading": "Account name",
                "selected": glob_const.apptitle,
                "icon": "icon-user"
            },
            {
                "id": "currencysettings",
                "heading": "Local Fiat Currency",
                "selected": "EUR | Euro",
                "icon": "icon-coin-dollar",
                "currencysymbol": "eur",
                "default": false
            },
            {
                "id": "langsettings",
                "heading": "Language",
                "selected": "",
                "icon": "icon-bubble2"
            },
            {
                "id": "heading",
                "heading": "security"
            },
            {
                "id": "pinsettings",
                "heading": "Passcode Lock",
                "selected": "pincodedisabled",
                "icon": "icon-lock",
                "locktime": 0,
                "pinhash": null,
                "attempts": 0,
                "timeout": null
            },
            {
                "id": "bip39_passphrase",
                "heading": "Secret Phrase",
                "selected": "",
                "icon": "icon-eye"
            },
            {
                "id": "backup",
                "heading": "Backup App data",
                "selected": "",
                "icon": "icon-download",
                "sbu": false,
                "lastbackup": null
            },
            {
                "id": "restore",
                "heading": "Restore App data",
                "selected": "",
                "icon": "icon-upload",
                "fileused": null,
                "device": null
            },
            {
                "id": "heading",
                "heading": "advanced"
            },
            {
                "id": "csvexport",
                "heading": "Export CSV",
                "selected": "",
                "icon": "icon-table"
            },
            {
                "id": "url_shorten_settings",
                "heading": "Url shortener",
                "selected": "firebase",
                "icon": "icon-link",
                "us_active": "active",
                "bitly_at": null,
                "fbapikey": null
            },
            {
                "id": "cmcapisettings",
                "heading": "Cryptocurrency price data",
                "selected": "coinmarketcap",
                "icon": "icon-stats-dots",
                "cmcapikey": null
            },
            {
                "id": "fiatapisettings",
                "heading": "FIAT price data",
                "selected": "fixer",
                "icon": "icon-stats-bars",
                "fxapikey": null
            },
            {
                "id": "api_proxy",
                "heading": "API Proxy",
                "selected": glob_const.hosted_proxy.proxy,
                "custom_proxies": [],
                "icon": "icon-sphere"
            },
            {
                "id": "apikeys",
                "heading": "API Keys",
                "selected": "",
                "icon": "icon-key",
                "alchemy": null,
                "arbiscan": null,
                "bitly": null,
                "bscscan": null,
                "blockchair": null,
                "blockcypher": null,
                "coinmarketcap": null,
                "currencylayer": null,
                "etherscan": null,
                "ethplorer": null,
                "exchangeratesapi": null,
                "firebase": null,
                "fixer": null,
                "infura": null,
                "polygonscan": null
            },
            {
                "id": "contactform",
                "heading": "Contact form",
                "selected": "",
                "icon": "icon-file-text",
                "name": "",
                "address": "",
                "zipcode": "",
                "city": "",
                "country": "",
                "email": ""
            },
            {
                "id": "permissions",
                "heading": "Permissions",
                "selected": "admin",
                "icon": "icon-user"
            },
            {
                "id": "teaminvite",
                "heading": "Team invite",
                "selected": "",
                "icon": "icon-users"
            }
        ],
        "apis": [{
                "name": "blockcypher",
                "base_url": "https://api.blockcypher.com/v1/",
                "key_param": "token=",
                "api_key": null,
                "sign_up": "https://accounts.blockcypher.com/"
            },
            {
                "name": "blockchain.info",
                "base_url": "https://api.blockchain.info/haskoin-store/",
                "key_param": null,
                "api_key": null,
                "sign_up": null
            },
            {
                "name": "ethplorer",
                "base_url": "https://api.ethplorer.io/",
                "key_param": "apiKey=",
                "api_key": null,
                "sign_up": "https://ethplorer.io/wallet/#"
            },
            {
                "name": "etherscan",
                "base_url": "https://api.etherscan.io/v2/api",
                "key_param": "apikey=",
                "api_key": null,
                "sign_up": "https://etherscan.io/register/"
            },
            {
                "name": "arbiscan",
                "base_url": "https://api.arbiscan.io/api",
                "key_param": "apikey=",
                "api_key": null,
                "sign_up": "https://arbiscan.io/register/"
            },
            {
                "name": "polygonscan",
                "base_url": "https://api.polygonscan.com/api",
                "key_param": "apikey=",
                "api_key": null,
                "sign_up": "https://polygonscan.com/register/"
            },
            {
                "name": "bscscan",
                "base_url": "https://api.bscscan.com/api",
                "key_param": "apikey=",
                "api_key": null,
                "sign_up": "https://bscscan.com/register/"
            },
            {
                "name": "alchemy",
                "base_url": glob_const.main_alchemy_node,
                "key_param": null,
                "api_key": null,
                "sign_up": "https://auth.alchemy.com/signup/"
            },
            {
                "name": "binplorer",
                "base_url": "https://api.binplorer.com/",
                "key_param": "apiKey=",
                "api_key": null,
                "sign_up": "https://ethplorer.io/wallet/#"
            },
            {
                "name": "blockchair",
                "base_url": "https://api.blockchair.com/",
                // for now no api key needed yet
                // "key_param": "key=",
                "key_param": null,
                "api_key": null,
                "sign_up": "https://blockchair.com/api"
            },
            {
                "name": "dash.org",
                "base_url": "https://insight.dash.org/insight-api/",
                // for now no api key needed yet
                // "key_param": "key=",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "mempool.space",
                "base_url": "https://mempool.space/api/",
                // for now no api key needed yet
                // "key_param": "key=",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": "https://mempool.space/docs/api/rest"
            },
            {
                "name": "coinmarketcap",
                "base_url": "https://pro-api.coinmarketcap.com/",
                "key_param": "CMC_PRO_API_KEY=",
                "api_key": null,
                "sign_up": "https://pro.coinmarketcap.com/signup/"
            },
            {
                "name": "coingecko",
                "base_url": "https://api.coingecko.com/api/v3/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "coincodex",
                "base_url": "https://coincodex.com/api/coincodex/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "coinpaprika",
                "base_url": "https://api.coinpaprika.com/v1/tickers/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "fixer",
                "base_url": "http://data.fixer.io/api/",
                "key_param": "access_key=",
                "api_key": null,
                "sign_up": "https://fixer.io/signup/free/"
            },
            {
                "name": "exchangeratesapi",
                "base_url": "http://api.exchangeratesapi.io/",
                "key_param": "access_key=",
                "api_key": null,
                "sign_up": "https://exchangeratesapi.io"
            },
            {
                "name": "currencylayer",
                "base_url": "http://api.currencylayer.com/",
                "key_param": "access_key=",
                "api_key": null,
                "sign_up": "https://currencylayer.com/product"
            },
            {
                "name": "coinbase",
                "base_url": "https://api.coinbase.com/v2/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "bitly",
                "base_url": "https://api-ssl.bitly.com/v4/",
                "key_param": null,
                "api_key": null,
                "sign_up": "https://bitly.com/a/sign_up/"
            },
            {
                "name": "firebase",
                "base_url": "https://firebasedynamiclinks.googleapis.com/v1/",
                "key_param": "key=",
                "api_key": null,
                "sign_up": "https://firebase.google.com/"
            },
            {
                "name": "mymonero api",
                "base_url": "https://api.mymonero.com:8443/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "kaspa.org",
                "base_url": "https://api.kaspa.org/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "kas.fyi",
                "base_url": "https://api-v2-do.kas.fyi/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "nimiq.watch",
                "base_url": "https://api.nimiq.watch/api/v1/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "mopsus.com",
                "base_url": "https://nimiq.mopsus.com/api/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "infura",
                "base_url": glob_const.main_eth_node,
                "key_param": null,
                "api_key": null,
                "sign_up": "https://infura.io/register"
            },
            {
                "name": "arbitrum",
                "base_url": glob_const.main_arbitrum_node,
                "key_param": null,
                "api_key": null,
                "sign_up": "https://infura.io/register"
            },
            {
                "name": "polygon",
                "base_url": glob_const.main_polygon_node,
                "key_param": null,
                "api_key": null,
                "sign_up": "https://infura.io/register"
            },
            {
                "name": "google_auth",
                "base_url": null,
                "key_param": null,
                "api_key": null,
                "sign_up": "https://developers.google.com/"
            }
        ],
        "apilists": {
            "crypto_price_apis": ["coinmarketcap", "coinpaprika", "coingecko"],
            "fiat_price_apis": ["fixer", "coingecko", "exchangeratesapi", "currencylayer", "coinbase"],
            "historic_crypto_price_apis": ["coinpaprika", "coingecko", "coincodex"],
            "historic_fiat_price_apis": ["fixer", "exchangeratesapi", "currencylayer"]
        },
        "blockexplorers": [{
                "name": "blockchain.com",
                "url": "https://www.blockchain.com/",
                "prefix": "currencysymbol",
                "tx_prefix": "tx/",
                "address_prefix": "address/"
            },
            {
                "name": "blockchair.com",
                "url": "https://www.blockchair.com/",
                "prefix": "currency",
                "tx_prefix": "transaction/",
                "address_prefix": "address/"
            },
            {
                "name": "mempool.space",
                "url": "https://mempool.space/",
                "prefix": "",
                "tx_prefix": "tx/",
                "address_prefix": "address/"
            },
            {
                "name": "litecoinspace.org",
                "url": "https://litecoinspace.org/",
                "prefix": "",
                "tx_prefix": "tx/",
                "address_prefix": "address/"
            },
            {
                "name": "nanexplorer.com",
                "url": "https://nanexplorer.com/",
                "prefix": "nano",
                "tx_prefix": "block/",
                "address_prefix": "account/"
            },
            {
                "name": "blocklattice.io",
                "url": "https://blocklattice.io/",
                "prefix": "",
                "tx_prefix": "block/",
                "address_prefix": "account/"
            },
            {
                "name": "spynano.org",
                "url": "https://spynano.org/",
                "prefix": "",
                "tx_prefix": "hash/",
                "address_prefix": "account/"
            },
            {
                "name": "ethplorer.io",
                "url": "https://ethplorer.io/",
                "prefix": null,
                "tx_prefix": "tx/",
                "address_prefix": "address/"
            },
            {
                "name": "etherscan.io",
                "url": "https://etherscan.io/",
                "prefix": null,
                "tx_prefix": "tx/",
                "address_prefix": "address/"
            },
            {
                "name": "binplorer.com",
                "url": "https://binplorer.com/",
                "prefix": null,
                "tx_prefix": "tx/",
                "address_prefix": "address/"
            },
            {
                "name": "arbiscan.io",
                "url": "https://arbiscan.io/",
                "prefix": null,
                "tx_prefix": "tx/",
                "address_prefix": "address/"
            },
            {
                "name": "polygonscan.com",
                "url": "https://polygonscan.com/",
                "prefix": null,
                "tx_prefix": "tx/",
                "address_prefix": "address/"
            },
            {
                "name": "bscscan.com",
                "url": "https://bscscan.com/",
                "prefix": null,
                "tx_prefix": "tx/",
                "address_prefix": "address/"
            },
            {
                "name": "explorer.kaspa.org",
                "url": "https://explorer.kaspa.org/",
                "prefix": null,
                "tx_prefix": "txs/",
                "address_prefix": "addresses/"
            },
            {
                "name": "kas.fyi",
                "url": "https://kas.fyi/",
                "prefix": null,
                "tx_prefix": "transaction/",
                "address_prefix": "address/"
            },
            {
                "name": "nimiq.watch",
                "url": "https://nimiq.watch/",
                "prefix": null,
                "tx_prefix": "#",
                "address_prefix": "#"
            },
            {
                "name": "mopsus.com",
                "url": "https://nimiq.mopsus.com/",
                "prefix": null,
                "tx_prefix": "tx/",
                "address_prefix": "addr/"
            },
            {
                "name": "dash.org",
                "url": "https://insight.dash.org/",
                "prefix": null,
                "tx_prefix": "insight/tx/",
                "address_prefix": "insight/address/"
            },
            {
                "name": "cryptoid.info",
                "url": "https://chainz.cryptoid.info/",
                "prefix": "currency",
                "tx_prefix": "tx.dws?",
                "address_prefix": "address.dws?"
            },
            {
                "name": "monero.com",
                "url": "https://monero.com/",
                "prefix": null,
                "tx_prefix": "tx/",
                "address_prefix": null
            }
        ]
    };

// Generates the URL scheme for Bitcoin payments
function btc_urlscheme(payment, address, amount, is_zero) {
    return payment + ":" + address + (is_zero ? "" : "?amount=" + amount);
}

// Generates Bitcoin Cash payment URI scheme
function bch_urlscheme(payment, address, amount, is_zero) {
    const cleaned_address = address.indexOf("bitcoincash:") > -1 ? address.split("bitcoincash:").pop() : address;
    return "bitcoincash:" + cleaned_address + (is_zero ? "" : "?amount=" + amount);
}