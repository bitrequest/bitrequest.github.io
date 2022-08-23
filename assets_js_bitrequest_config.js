var apptitle = "Bitrequest",
    hostname = "bitrequest.github.io", // change if self hosted
    root = "/",
    localhostname = (hostname.indexOf("http") > -1) ? hostname.split("://").pop() : hostname,
    approot = "https://" + localhostname + root,
    hosted_proxy = "https://app.bitrequest.io/",
    ln_socket = "wss://bitrequest.app:8030",
    proxy_list = [
        hosted_proxy,
        "https://www.bitrequest.io/",
        "https://www.bitrequest.app/"
    ],
    proxy_version = "0.002",
    firebase_dynamic_link_domain = "bitrequest.page.link",
    firebase_shortlink = "https://" + firebase_dynamic_link_domain + "/",
    androidpackagename = "io.bitrequest.app",
    main_eth_node = "https://mainnet.infura.io/v3/",
    main_eth_socket = "wss://mainnet.infura.io/ws/v3/",
    main_ad_node = "https://web3api.io/api/v2/",
    main_ad_socket = "wss://ws.web3api.io/",
    main_nano_node = "https://www.bitrequest.app:8020",
    socket_attempt = {},
    api_attempt = {},
    api_attempts = {},
    statuspush = [],
    tx_list = [],
    rpc_attempts = {},
    changes = {},
    multi_wallets = {
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
        "trustwallet": {
            "name": "trustwallet",
            "website": "https://trustwallet.com",
            "appstore": "https://apps.apple.com/app/id1288339409",
            "playstore": "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp",
            "desktop": "https://trustwallet.com",
            "seed": true
        },
        "atomicwallet": {
            "name": "atomicwallet",
            "website": "https://atomicwallet.io",
            "appstore": "https://apps.apple.com/app/id1478257827",
            "playstore": "https://play.google.com/store/apps/details?id=io.atomicwallet",
            "desktop": "https://atomicwallet.io/#download-section-anchor",
            "seed": true
        }
    },
    br_config = {
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
                        multi_wallets.exodus,
                        multi_wallets.coinomi,
                        multi_wallets.trezor,
                        multi_wallets.ledger,
                        multi_wallets.trustwallet,
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
                        "selected": "blockchain.com",
                        "options": ["blockchain.com", "blockchair.com"]
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
                                "name": "mempool.space",
                                "url": "memppol.space",
                                "api": true,
                                "display": true
                            },
                            {
                                "name": "blockchair",
                                "url": "blockchair.com",
                                "api": true,
                                "display": true
                            }
                        ]
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "blockcypher websocket",
                            "url": "wss://socket.blockcypher.com/v1/",
                            "display": true
                        },
                        "apis": [{
                                "name": "blockchain.info websocket",
                                "url": "wss://ws.blockchain.info/inv",
                                "display": true
                            },
                            {
                                "name": main_ad_socket,
                                "url": main_ad_socket,
                                "display": true
                            },
                            {
                                "name": "blockcypher websocket",
                                "url": "wss://socket.blockcypher.com/v1/",
                                "display": true
                            },
                            {
                                "name": "mempool.space websocket",
                                "url": "wss://mempool.space/api/v1/ws",
                                "display": true
                            }
                        ]
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
                        "selected": "Compatible wallets",
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
                        multi_wallets.exodus,
                        multi_wallets.coinomi,
                        multi_wallets.trezor,
                        multi_wallets.ledger,
                        multi_wallets.keepkey,
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
                                "display": false
                            }
                        ]
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "blockcypher websocket",
                            "url": "wss://socket.blockcypher.com/v1/",
                            "display": true
                        },
                        "apis": [{
                                "name": "blockcypher websocket",
                                "url": "wss://socket.blockcypher.com/v1/",
                                "display": true
                            },
                            {
                                "name": main_ad_socket,
                                "url": main_ad_socket,
                                "display": true
                            }
                        ]
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
                        "selected": "Compatible wallets",
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
                        multi_wallets.exodus,
                        multi_wallets.coinomi,
                        multi_wallets.trezor,
                        multi_wallets.ledger,
                        multi_wallets.trustwallet,
                        multi_wallets.keepkey
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
                        ]
                    },
                    "websockets": {
                        "icon": "tab",
                        "selected": {
                            "name": "blockcypher websocket",
                            "url": "wss://socket.blockcypher.com/v1/",
                            "display": true
                        },
                        "apis": [{
                                "name": "blockcypher websocket",
                                "url": "wss://socket.blockcypher.com/v1/",
                                "display": true
                            },
                            {
                                "name": "dogechain api",
                                "url": "wss://ws.dogechain.info/inv",
                                "display": true
                            }
                        ]
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
                        "selected": "Compatible wallets",
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
                        multi_wallets.exodus,
                        multi_wallets.coinomi,
                        multi_wallets.trezor,
                        multi_wallets.ledger,
                        multi_wallets.trustwallet,
                        multi_wallets.atomicwallet,
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
                            "name": "blockchair",
                            "url": "blockchair.com",
                            "api": true,
                            "display": true
                        },
                        "apis": [{
                            "name": "blockchair",
                            "url": "blockchair.com",
                            "api": true,
                            "display": false
                        }]
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
                        }]
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
                        "selected": "Compatible wallets",
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
                        var amount = (iszero === true) ? "" : "?value=" + (parseFloat(amount) * "1000000000000000000").toFixedSpecial(0);
                        return payment + ":" + address + amount;
                    },
                    "address_regex": "^0x[a-fA-F0-9]{40}$"
                },
                "wallets": {
                    "wallet_download_page": "https://ethereum.org/en/wallets/",
                    "wallets": [
                        multi_wallets.exodus,
                        multi_wallets.trezor,
                        multi_wallets.ledger,
                        multi_wallets.trustwallet,
                        multi_wallets.keepkey,
                        {
                            "name": "myetherwallet",
                            "website": "https://www.mewwallet.com",
                            "appstore": "https://apps.apple.com/app/id1464614025",
                            "playstore": "https://play.google.com/store/apps/details?id=com.myetherwallet.mewwallet",
                            "desktop": "https://www.myetherwallet.com",
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
                        "selected": "blockchain.com",
                        "options": ["blockchain.com", "blockchair.com"]
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
                                "display": false
                            },
                            {
                                "name": main_eth_node,
                                "url": main_eth_node,
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
                            "name": main_ad_socket,
                            "url": main_ad_socket,
                            "display": true
                        },
                        "apis": [{
                            "name": main_ad_socket,
                            "url": main_ad_socket,
                            "display": true
                        }],
                        "options": []
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
                        "selected": "Compatible wallets",
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
                        var amount = (iszero === true) ? "" : "?amount=" + NanocurrencyWeb.tools.convert(amount, "NANO", "RAW");
                        return "nano:" + address + amount;
                    },
                    "address_regex": "^(xrb|nano)_([a-z1-9]{60})$"
                },
                "wallets": {
                    "wallet_download_page": "https://nanowallets.guide",
                    "wallets": [
                        multi_wallets.trustwallet,
                        {
                            "name": "nalli",
                            "website": "https://nalli.app",
                            "appstore": "https://apps.apple.com/app/id1515601975",
                            "playstore": "https://play.google.com/store/apps/details?id=fi.heimo.nalli",
                            "desktop": "https://nalli.app",
                            "seed": true
                        },
                        {
                            "name": "kaiak",
                            "website": "https://kaiak.cc",
                            "appstore": null,
                            "playstore": null,
                            "desktop": "https://kaiak.cc",
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
                        "selected": "nanocrawler.cc",
                        "options": ["nanocrawler.cc", "nanolooker.com"]
                    },
                    "apis": {
                        "icon": "sphere",
                        "selected": {
                            "name": "bitrequest.app",
                            "url": main_nano_node,
                            "username": "",
                            "password": "",
                            "display": true
                        },
                        "apis": [{
                                "name": "bitrequest.app",
                                "url": main_nano_node,
                                "username": "",
                                "password": "",
                                "display": true
                            },
                            {
                                "name": "api.nanos.cc",
                                "url": "https://proxy.nanos.cc/proxy",
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
                            },
                            {
                                "name": "proxy.powernode.cc",
                                "url": "https://proxy.powernode.cc/proxy",
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
                                "name": "nanos.cc websocket",
                                "url": "wss://socket.nanos.cc",
                                "display": true
                            },
                            {
                                "name": "rainstorm.city websocket",
                                "url": "wss://rainstorm.city/websocket",
                                "display": true
                            },
                            {
                                "name": "nanolooker.com websocket",
                                "url": "wss://www.nanolooker.com/ws",
                                "display": true
                            },
                            {
                                "name": "powernode.cc websocket",
                                "url": "wss://ws.powernode.cc",
                                "display": true
                            }
                        ],
                        "options": []
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
                        "selected": "Compatible wallets",
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
                        multi_wallets.coinomi,
                        {
                            "name": "monerujo",
                            "website": "https://www.monerujo.io",
                            "appstore": null,
                            "playstore": "https://play.google.com/store/apps/details?id=com.m2049r.xmrwallet",
                            "desktop": null,
                            "seed": true
                        },
                        {
                            "name": "cakewallet",
                            "website": "https://cakewallet.com",
                            "appstore": "https://apps.apple.com/app/id1334702542",
                            "playstore": "https://play.google.com/store/apps/details?id=com.cakewallet.cake_wallet",
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
                        "selected": "blockchair.com"
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
                        "selected": "Compatible wallets",
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
                        multi_wallets.atomicwallet,
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
                            "name": main_eth_node,
                            "url": main_eth_node,
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
                        "name": main_eth_socket,
                        "url": main_eth_socket,
                        "display": true
                    },
                    "apis": [{
                        "name": main_eth_socket,
                        "url": main_eth_socket,
                        "display": true
                    }],
                    "options": []
                }
            }
        },
        "app_settings": [{
                "id": "accountsettings",
                "heading": "Account name",
                "selected": "Bitrequest",
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
                "id": "heading",
                "heading": "Security"
            },
            {
                "id": "pinsettings",
                "heading": "Passcode Lock",
                "selected": "pincode disabled",
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
                "heading": "Advanced"
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
                "selected": hosted_proxy,
                "custom_proxies": [],
                "icon": "icon-sphere"
            },
            {
                "id": "apikeys",
                "heading": "API Keys",
                "selected": "Api Keys",
                "icon": "icon-key",
                "bitly": null,
                "firebase": null,
                "coinmarketcap": null,
                "fixer": null,
                "blockcypher": null,
                "ethplorer": null,
                "blockchair": null,
                "currencylayer": null,
                "infura": null,
                "amberdata": null
            },
            {
                "id": "contactform",
                "heading": "Contact form",
                "selected": "Contact form",
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
                "name": "ethplorer",
                "base_url": "https://api.ethplorer.io/",
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
                "name": "mempool.space",
                "base_url": "https://mempool.space/api/",
                // for now no api key needed yet
                // "key_param": "key=",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": "https://mempool.space/nl/docs/api/rest"
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
                "base_url": "https://api.exchangeratesapi.io/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
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
                "name": "nimiq.watch",
                "base_url": "https://api.nimiq.watch/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "mopsus.com",
                "base_url": "https://www.mopsus.com/api/",
                "key_param": null,
                "api_key": "no_key",
                "sign_up": null
            },
            {
                "name": "infura",
                "base_url": main_eth_node,
                "key_param": null,
                "api_key": null,
                "sign_up": "https://infura.io/register"
            },
            {
                "name": "amberdata",
                "base_url": main_ad_node,
                "key_param": null,
                "api_key": null,
                "sign_up": "https://amberdata.io/onboarding"
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
                "name": "nanocrawler.cc",
                "url": "https://nanocrawler.cc/",
                "prefix": "explorer",
                "tx_prefix": "block/",
                "address_prefix": "account/"
            },
            {
                "name": "nanolooker.com",
                "url": "https://nanolooker.com",
                "prefix": "",
                "tx_prefix": "block/",
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
            }
        ]
    };

function btc_urlscheme(payment, address, amount, iszero) {
    return payment + ":" + address + ((iszero === true) ? "" : "?amount=" + amount);
}

function bch_urlscheme(payment, address, amount, iszero) {
    var c_address = (address.indexOf("bitcoincash:") > -1) ? address.split("bitcoincash:").pop() : address;
    return "bitcoincash:" + c_address + ((iszero === true) ? "" : "?amount=" + amount);
}

function c_icons(cpid) {
    var icons_obj = {
        "btc-bitcoin": "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",
        "ltc-litecoin": "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",
        "doge-dogecoin": "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",
        "bch-bitcoin-cash": "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",
        "xno-nano": "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAclBMVEUAAAAgneognekgnOogneggn+MgnekgnOognOogneognekgnOkgnOggnOkgnOognesgnOkgnOggm+ggnOggnOn////j8vyBx/I8qezx+f7H5vnj8/xzwfFVtO8uouqr2ver2fad1PXV7PuQzfRmu/A8qOvTT++lAAAAFHRSTlMAX9+fIBA977+Pf9+/z29Pr69wbzBETUMAAAT3SURBVHja7Z3ZcuIwEEXbYUkgyWSWawIZILP+/y9OFTWFakYOWrqvIqk4T3kIoo+7sWzZkuRKkOEG//OwlIZYIsxCKucO8TxIpSAHqYwFTrTughOtu+BE6y4L2DGXaCpNRmJa6teIUmlDI6jSjsZFlbY0AMykCDfgcy8+raVjur5a1WCrzHGBhkwQoBGViHQ0YTJDHLWfiRFL5UlBNFWb4F1Zd+IBoBcPoBcPoBcPoBcPoBcPoBcPoBcPoBcPoBcPoBcPoBcPoBcPDJ14AEMvIjD3GM9AT0pb1vn4YSiS1pRinIGbEtfSBjHMFOM+VJNDajsSB0qLpDej8dCb6AvLYVRYfgxfkU/O0bDuQV4MUpLXhMKDVFxfM1swFvl1DuOAPDI9oPCgpCT/44rngwSTff6nF8bXis/nULZIR3MU1B76lPif/Y0MjEVcNDt4UH9gyR60cHQeuFWJ6E38z31DHgoPhYm+K/SxFtllhaT3gMJDnxJ9YTnurUWO56h+IpJfzl2B2kNfXCYeeFSIKIqLcHdp/oLGS64IdCw0CVEfYr2Hw1zExfaCICNNBHo2CcHZeeBBKxJ/mKkegL1I2MQf/zHAwkMrAhNsRXyT8H89wwTDTsSP8Qd8fFsbjBKSHKS1Bz4RRMImfmHpIYiEx1T8uyk9BI9wSggeWDFEpsdUKF2IgyLy8xzrEQ5SYZFEwsXF8HAid7AiYOLdplvBSMi0iDdibQxD5IIJyYMlMm3CKCyHm39uy+6yCMwhJWQqJVQPPLFEjt4VledmC0vED/vA9OCJeCbesylTeCLegB23sIgi/4W+53owRf41IXucRAaQ2LjoR7rIwJxDPPqAxb0IaPgmz6BBFXkplhCyCIp56EVGOxDJVeQvV5GryBtcRf7SuYgjoMnt2Mkiu0569m25i0auyNiJyFjwfqSUiPv7O0iUudMtkBKRO1AYy46iPIg8gYAX+Xfv3SFblsVGGsc2Rxpfz2HvcaLVsd+JqMczR1hDEpn0oKaEJbIdJ56me1PkDFGLVHMZf9uLyCJ6hdjKReKf6l5FriIpPEa/i1K5COHtoEBchG6RLbLBNO5RwxZmlHw3k5ASoshrOEj/XUE9SzEzCR9tZkpKvlFOMOGJuIvePTwmTQ6w4FPJWRfMlJScB0MwoYlsQ8HRzlyEuWIBEU5KSs7eI5jwRRDFwezMNZSc4cpMiShEUsOimlju7ZI1TWdjIzJ/93n5RikRrUjSRa8ijQEGMTMJ300xUyIKkdSAmCaDGJpss8PRP1oUhUhqYVFTUssaSFoTSRPRFxbpzLUWQ5NRKcJZYGsFD6qHroEZZQk6ZPKc30L8GnTchGibkIvAwfXQdyZiaBLyYB4NiRHRh0BvZi12Jq82Hilr3Dgoy/1CychZ8Nfs64km92JnsqUsUn5EFBJH2nfvoWfHWaZ8xi0sn8T3VGYSC7uwfI7EFfBJd1P6DEsKtMLSdyaSxBq10sv+I1962Umll71tetltqJf9n3rZkauXPdJ62bWul30Ee9nZsZe9NnvZ/VRs+Iz3ZRArBqRQaTrevbw62UX79ro/e1VJkRPNm7iyaltFxNGwyUr+pVUV8WlRZSFTNGeykmLcgMdaLtJMViRMA1n5IDFUr+I0ijNv70z1Jo+tJ0McDf7A3+QjcvkotbFCOkupFURzI9WzRIDbubTE4Hczd0/C4g9xmoqScUMvNwAAAABJRU5ErkJggg==",
        "xmr-monero": "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",
        "eth-ethereum": "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",
        "nim-nimiq": "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAABnlBMVEUAAADprxPqoRnosRLqnhvqqBXprRPsmxz49NfppRbzy3PqqxTuszXy26bpsBPtsBLtuT/wwVPqriDqpRnosSTqsyrvuT/tsjzxtxzxrxTtqh/qsSvu2aDuqxTwrx3snRzprx7srSvvwmH5v0vrrCHttyHrtSrtuzvssjDqrSvstDLzqiHzsRzxsh7vrxzxsCPrsxzqqx/ssiTqsR7qrCXrtSPrrx7zvkDuulPxnxntsxLsmxruthrvoiDttB/xoSPwtx7spyTqpSHuqzLppCvqtTLrqjDrsS3rpi7suzjwvDjvsUPwv1f70YbwnBrwphj0oh/rshfttx7woyvssB/roiTqpCfpsyXqqybruTTtuDvusRfwph71oyTsrRrspSDosR/poyTroSzxthf5ry7qqRXxtRPzthX0qRnyuBL3oBzzpBr3uRP7vRbrpRf4tRb8uhb1oxv7pBv1rxX4vBT9rhz0phv1qxj4sRf9tBr2vBj4rxfroxfwqhb0shT1sxz5qRn6sxf9uR39qBz5shr+wRfroBjxsxbpsRLsqR7N/13AAAAAZXRSTlMA2NjY2P7+2AT8Dv4/CP39MhzB2JCGNyP+/edhC/332J+AIgrTzsVoU0oo/Pz57uDazbm0rJd2GBP+/v317eri4Mizk41+cmhcWEMvKRb+/v3t29fWz7ukmHBL+Pb039yuqJ31gyUInZ4AAAaaSURBVHja7dtnVxNBFAbg10LcVJNIT0R6ExSli9iQXgUUwV4uJQQCgRB6F/BfG0hAIIXsZssMJ4/nEOHbnLv35c7sgKSkpKSkpKSk66K+s6548NapG7fOu5GIquK6EhtUYu6qfr76ZyqyicvGx0OfQRNnX89+Evpu4uQ/UzOrz4tKnFCBqWjGfWQxkkKMuqOp1cFOKK52dcqiI0UZdeOrtQYoqrd68YiUZ9S5X+VDQULRjIVUoZtQciVC7qKF1JGim7FDMaN/LKQanTsVCil4NU7qSbFkpkMZI4sWUpPbDkWUPzsidblLoQChaEpH6pqoMkN+nTM6UttcGmRnrhon1d3NqYfcUmdIA+5cyMz2/BlpIdMEeRW7SRMemSO4a5U04hmFnIqmSCOHLwyQT/siaUTeCHa+eEaaMVb2QC61ixbSjvs7ZGLNtJCWDuWK4O+LOtLS5rAAOYxN6Uhbcw7IwDw4RRrL+mrgPHpDjHOpcgxZd0lzdz9lJB69M6Q942ZxwtH7i1hg9JRxOvVetlloRiJKV4kRc61IgHNwnBhx91EDpMtjodODjJ4RSGZ4x0D0hqQYK9IhVS4jnR4qiV1y9DLT6SeMW6WQxGyfIKZkPZYWwSV/iDGeOkjxlZnoPXW/MgPipWk/9Ybx5EK0jEx2ove/ChPEGmGwIMcjF0QyZRKTlh0Q5wlj0XsqS+TBo4PJB+vYThpEsAWOFlmVky8metmZesMsVyNuPZ9YjN5TW/FH8FOWpt4wWcPOeKOX0cQ6tduGuDirmBuyLsrKLkA8Rhnu9CDPR8Shl6H9bRTGinJmX6iLs2kXcJVyxhskaLeT8+g9lVWIK3Ry8GAd229l8OqMJDk2xNLKSUGIlmNGcD0Lb3XiFPPgsZaLTg9asCOqLm4erGNbZYhCYO1oMbaNbAMiK+GqIEQrddHuJ7O7v40sJz/K0aKF+LJTw+LVGSk2rAj33a0j3iw8ESLsb/lbB9GKI6zTi3gZsi4Ij2AHZ9Ebot/PwwW2V1wWhCjl0hRcy9xrtjjpl3NxTgYbV2ek0O+O4YzAx/42soUnOFPGZ6eH7LcjxDDMaacH3X90GsGtvHZ6kH4tNRS97B8txqbfSufmaDGmlIUPAgAro+9vRUjZNx0XhPi39gaof0f8m/1bjhKuDhyi0C/kYYTjX+rnFvIG1Zpf4ZfB7OxfZPK4MQxfyCx0/B05XPOFXJNHax18HjpcMrv+l61LylLp/XaMXotfiP48lF+HZl9/2A2hmvjnf+0E0q/Bs7VSys8VgdgFMSPAWsn5Vpf86TiRNkdcW/uBIMMLrkuy/rAHISVcl8SXh1NmVu9dx6M/uxdnxnaJW2tlzP5ZmCj+1zjPxmsEr/dbEcJ3BPs+4qKCqkPi0PrnfFzimEsh/vgcuEx46jESbya/CQhjPeRwISZEkDrH20q23yCShkecRfBBYF8YUR1nEex7i8jMw5vEkf5mA6Io8xBHfG2IqpijlUy+RnTWT8QNnwkxpHLT74HojcX26D5xYf1zPWLq4KQkgei9QiEXEdz/zYkrdG0RB3wduFINBxE8+d6MK/VUsv8O62E64pDGfEm2fyAeBdlZxLSDwNFiXEoYP+XazkN8zE8WiGHT2QWIUzrTXbJUihC+I3j7A+LXwPDIdVX08nLwuP0WYhgeMxrBjc0NEKWU0Qjea4M4gp3JKXg+MGSJ1F1JDFoqg2i5O8ScQPSKl5/DXAQffC6HBG3MlWSvBVKYWYvgxm8GSDK2wNa7H187JKpeZmkl0+8FSJS+xdJClqyQLHVHT6zwvoF0Bnam4MbmeiTAsUyM2HuLhLCy621sNiAhXYz0u7cDCaphIoK9r5GojBxiwIAVCWtZ0T6CvT+ROOfXDdJY35d8yMCxonWXePMgB6FQ4+FxfgjysG5ouxBXB2RSo+nI5f0BuTRkazhy9Q10QzZ1K6SZQPTKx5CtWQQ3NhdARmULpJG9NsjKvkaacL0XICtrhTYR7DJBZh+XSQPeD5CbTZODxy/dkF2rBl0S2N8qoNBPKut72QsFlO6TyrwdUETNGqnKNSRAEeUVelJR04AJCmlZU3MlgSFLMcXLpBpXoNMVk/HYr1ZNXC8zoJzASnb0KaS8JmXXEZD/dGVD8aI0NXmHMqC09mzfxrqCVTlo6vN+aRGgvIa8x5Mrk37/ZFRLwa/TJ/+WpoMCnyHz0/MnXC5X8OOCvYGXLTaow2n6XXjvzM2r3A73IOROmKHfJgOSkpKSkpKSkq6Hf0CMsR87iqheAAAAAElFTkSuQmCC",
        "confirmed": "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",
        "phone-icon": "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAABU1BMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAA/Pz+/v7//xT6urq5eXl4PDw/9/fz/xkD6+vp/f38mJibS0tLx8fGEhIRISEguLi4eHh7Nzc1OTk7CwsJxcXG1tbXq6upRUVH/vSKYmJj29vY2Njbt7e2Pj48LCwv/uhnHx8elpaViYmIXFxfb29v/35Tm5ubh4eGgoKCSkpKJiYl8fHy5ubl2dnb/xDn/wjNXV1f/wS7/vB//vyicnJwwMDD//PT/7sf/671oaGj/z2D/89j/46T/4Zv/13v/02z/yk+Ojo7/24f/x0X/+e3/9uH/5qz/3Y7/tAUCjtHKAAAAJnRSTlMA+QeTDuHWqXtaH/Pw7OfSyMC0moJ3Tkg7LiUbF9rMuZ2KdGw+Krc8euYAAAy6SURBVHja1NhZT+JQFAfwArKJDoi7wmzqv0yAprUt0LIY1gASEJdkHpyHeZzv/wUmsfdeCoxwoaU4v3djDuf8zz0gbMblWTQSCH/5HNzb8wGAb28v+PlLOBCJnl0K/4fdk0g45MMCvlA4crIrfGD+s+PkPjjtJ4/P/MIHdH584MOKfAfH58JH4j89DGJNwcPTj9KY06/7cGT/66mwdRffPsEFn75dCFvkjx7gfdqgW31o/1GUlxdF+dN+qHYHGt53EN3WiO1EPr1TQbleMYt58R/yRbNSL2vvtCWyI3hvNxDDvEZZN0viUiVTLzcwLxbw+n3ZPfRhlvzjpSmuoPnyQ8Ys36GXpaQCc2XU6nd5cWX5u3ptrpRASvCG/2i2jNZrQZzXuc2Y/YqiPLbbj4pS6ZuZ2444r/Dami3lyJPYR4OYIj3fiTOKuces0cI/tIzsY64ozrh7ljAlGBU27TyBKUN9Otu3uboqYwlZredup9OvDzElwXG7uDhVal+0uc/1auBW6+XuRZu+6t18XadhVy7YW/FkYGXGk70xhTLs0tfCZvgDsOvayig9qViT+lSyldKFXWAjTbmJw0Y1RebnswQHpOefImOqsInfCK67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",
        "ph": "iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQAQMAAAC6caSPAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAACpJREFUeNrtwYEAAAAAw6D7Ux9gCtUAAAAAAAAAAAAAAAAAAAAAAAAAgDhPsAABa0Zz3QAAAABJRU5ErkJggg=="
    }
    return "data:image/png;base64," + icons_obj[cpid];
}