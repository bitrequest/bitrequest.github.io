var apptitle = "Bitrequest",
    hostname = "bitrequest.github.io", // change if self hosted
    root = "/",
    localhostname = (hostname.indexOf("http") > -1) ? hostname.split("://").pop() : hostname,
    approot = "https://" + localhostname + root,
    hosted_proxy = "https://app.bitrequest.io/",
    proxy_list = [
        hosted_proxy,
        "https://www.bitrequest.io/"
    ],
    firebase_dynamic_link_domain = "bitrequest.page.link",
    firebase_shortlink = "https://" + firebase_dynamic_link_domain + "/",
    androidpackagename = "io.bitrequest.app",
    web3 = new Web3(),
    main_eth_node = "https://mainnet.infura.io/v3/",
    eth_node2 = "https://ropsten.infura.io/v3/",
    main_eth_socket = "wss://mainnet.infura.io/ws/v3/",
    eth_socket2 = "wss://ropsten.infura.io/ws/v3/",
    main_ad_node = "https://web3api.io/api/v2/",
    main_ad_socket = "wss://ws.web3api.io/",
    socket_attempt = {},
    api_attempt = {},
    api_attempts = {},
    rpc_attempts = {},
    changes = {};

var multi_wallets = {
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
    bitrequest_coin_data = [{
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
                "blockexplorers": {
                    "icon": "eye",
                    "selected": "blockchain.com",
                    "options": {
                        "key1": "blockchain.com",
                        "key2": "blockchair.com",
                        "key3": "bitcoin.com"
                    }
                },
                "apis": {
                    "icon": "sphere",
                    "selected": {
                        "name": "bitcoin.com",
                        "url": "bitcoin.com",
                        "api": true,
                        "display": true
                    },
                    "apis": [{
                        "name": "bitcoin.com",
                        "url": "bitcoin.com",
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
                    }],
                    "options": [],
                    "rpc_test_command": {
                        "method": "getblockchaininfo"
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
                            "name": "blockcypher websocket",
                            "url": "wss://socket.blockcypher.com/v1/",
                            "display": true
                        },
                        {
                            "name": "blockchain.info websocket",
                            "url": "wss://ws.blockchain.info/inv",
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
                    ],
                    "options": [],
                    "rpc_test_command": {
                        "method": "getblockchaininfo"
                    }
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
                    "root_path": "m/44'/2'/0'/0/",
                    "prefix": {
                        "pub": 48,
                        "pubx": 27108450,
                        "privx": 27106558
                    },
                    "pk_vbytes": {
                        "wif": 176
                    }
                },
                "Key derivations": {
                    "icon": "cog",
                    "selected": "Compatible wallets",
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
                            "display": false
                        }
                    ],
                    "options": [],
                    "rpc_test_command": {
                        "method": "getblockchaininfo"
                    }
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
                    "options": {
                        "key1": "blockchain.com",
                        "key2": "blockchair.com",
                        "key3": "bitcoin.com"
                    }
                },
                "apis": {
                    "icon": "sphere",
                    "selected": {
                        "name": "bitcoin.com",
                            "url": "bitcoin.com",
                            "api": true,
                            "display": true
                    },
                    "apis": [{
                        "name": "bitcoin.com",
                        "url": "bitcoin.com",
                        "api": true,
                        "display": true
                    },
                    {
                        "name": "blockchair",
                        "url": "blockchair.com",
                        "api": true,
                        "display": false
                    }],
                    "options": [],
                    "rpc_test_command": {
                        "method": "getblockchaininfo"
                    }
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
                "address_regex": "web3"
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
                    "options": {
                        "blockchain": "blockchain.com",
                        "blockchair": "blockchair.com"
                    }
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
                        },
                        {
                            "name": eth_node2,
                            "url": eth_node2,
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
                "ccsymbol": "nano",
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
                        "appstore": null,
                        "playstore": null,
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
                    "options": {
                        "key1": "nanocrawler.cc",
                        "key2": "nanolooker.com"
                    }
                },
                "apis": {
                    "icon": "sphere",
                    "selected": {
                        "name": "nano node",
                        "url": "https://www.bitrequest.app:8020",
                        "api": true,
                        "username": "",
                        "password": "",
                        "display": true
                    },
                    "apis": [{
                        "name": "nano node",
                        "url": "https://www.bitrequest.app:8020",
                        "api": true,
                        "username": "",
                        "password": "",
                        "display": true
                    },
                    {
                        "name": "api.nano.cc",
                        "url": "https://proxy.nanos.cc/proxy",
                        "api": true,
                        "username": "",
                        "password": "",
                        "display": true
                    }],
                    "options": [],
                    "rpc_test_command": {
                        "action": "version"
                    }
                },
                "websockets": {
                    "icon": "tab",
                    "selected": {
                        "name": "nano.cc websocket",
                        "url": "wss://socket.nanos.cc",
                        "display": true
                    },
                    "apis": [{
                            "name": "nano.cc websocket",
                            "url": "wss://socket.nanos.cc",
                            "display": true
                        },
                        {
                            "name": "bitrequest websocket",
                            "url": "wss://bitrequest.app:8010",
                            "display": true
                        },
                        {
                            "name": "nanolooker.com websocket",
                            "url": "wss://www.nanolooker.com/ws",
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
                "blockexplorers": {
                    "icon": "eye",
                    "selected": "blockchair.com",
                    "options": {
                        "key1": "blockchair.com"
                    }
                },
                "apis": {
                    "icon": "sphere",
                    "selected": {
                        "name": "xmr node",
                        "api": true,
                        "display": true
                    },
                    "apis": [{
                        "name": "xmr node",
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
        }
    ]
    
var erc20_dat = {
	"data": {
		"monitored": true,
	    "url-scheme": "",
	    "regex": "web3",
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
	        "selected": "ethplorer.io",
	        "options": {}
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
	            },
	            {
	                "name": eth_node2,
	                "url": eth_node2,
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
	            },
	            {
	                "name": eth_socket2,
	                "url": eth_socket2,
	                "display": true
	            }
	        ],
	        "options": []
	    }
	}
}

var app_settings = [{
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
        "id": "bip39_passphrase",
        "heading": "Secret Phrase",
        "selected": "",
        "icon": "icon-eye"
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
    /*{
    	"id": "themesettings",
        "heading": "Choose theme",
       	"selected": "default.css",
       	"icon": "icon-paint-format"
    },*/
    {
        "id": "heading",
        "heading": "Advanced"
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
        "heading": "Cryptocurrency price API",
        "selected": "coinmarketcap",
        "icon": "icon-stats-dots",
        "cmcapikey": null
    },
    {
        "id": "fiatapisettings",
        "heading": "FIAT price API",
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
    /*{
        "id": "cachecontrol",
        "heading": "Cache control / updates",
        "selected": "",
        "icon": "icon-database"
    },*/
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
]

var apis = [{
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
        "name": "bitcoin.com",
        "base_url": "https://explorer.api.bitcoin.com/",
        // for now no api key needed yet
        // "key_param": "key=",
        "key_param": null,
        "api_key": null,
        "sign_up": "https://explorer.api.bitcoin.com/docs/bch/v1/"
    },
    {
        "name": "coinmarketcap",
        "base_url": "https://pro-api.coinmarketcap.com/v1/",
        "key_param": "CMC_PRO_API_KEY=",
        "api_key": null,
        "sign_up": "https://pro.coinmarketcap.com/signup/"
    },
    {
        "name": "coingecko",
        "base_url": "https://api.coingecko.com/api/v3/",
        "key_param": null,
        "api_key": null,
        "sign_up": null
    },
    {
        "name": "coinpaprika",
        "base_url": "https://api.coinpaprika.com/v1/tickers/",
        "key_param": null,
        "api_key": null,
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
        "api_key": null,
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
        "name": "bitly",
        "base_url": "https://api-ssl.bitly.com/v4/",
        "key_param": "post",
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
        "name": "xmr node",
        "base_url": "https://api.mymonero.com:8443/",
        "key_param": null,
        "api_key": null,
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
]

var apilists = {
    "crypto_price_apis": ["coinmarketcap", "coinpaprika", "coingecko"],
    "fiat_price_apis": ["fixer", "coingecko", "exchangeratesapi", "currencylayer"],
    "historic_crypto_price_apis": ["coinpaprika", "coingecko"],
    "historic_fiat_price_apis": ["fixer", "exchangeratesapi", "currencylayer"]
}

var blockexplorers = [{
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
        "name": "bitcoin.com",
        "url": "https://explorer.bitcoin.com/",
        "prefix": "currencysymbol",
        "tx_prefix": "tx/",
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
]

var abi_default = [{
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{
            "name": "",
            "type": "string"
        }],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{
            "name": "",
            "type": "uint8"
        }],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{
            "name": "_owner",
            "type": "address"
        }],
        "name": "balanceOf",
        "outputs": [{
            "name": "balance",
            "type": "uint256"
        }],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{
            "name": "",
            "type": "string"
        }],
        "payable": false,
        "type": "function"
    }
]

function btc_urlscheme(payment, address, amount, iszero) {
    return payment + ":" + address + ((iszero === true) ? "" : "?amount=" + amount);
}

function bch_urlscheme(payment, address, amount, iszero) {
    return "bitcoincash:" + address + ((iszero === true) ? "" : "?amount=" + amount);
}