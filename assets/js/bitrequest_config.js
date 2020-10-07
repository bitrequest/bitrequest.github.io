var apptitle = "Bitrequest",
    hostname = "app.bitrequest.io", // change if self hosted
    root = "/",
    localhostname = (hostname.indexOf("http") > -1) ? hostname.split("://").pop() : hostname,
    approot = "https://" + localhostname + root,
    proxy_list = [
        approot,
        "https://www.bitrequest.io/"
    ],
    firebase_dynamic_link_domain = "bitrequest.page.link",
    firebase_shortlink = "https://" + firebase_dynamic_link_domain + "/",
    androidpackagename = "io.bitrequest.app",
    web3,
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

var bitrequest_coin_data = [{
        "currency": "bitcoin",
        "data": {
            "currency": "bitcoin",
            "ccsymbol": "btc",
            "cmcid": 1,
            "urlscheme": function(payment, address, amount, iszero) {
		    	return btc_urlscheme(payment, address, amount, iszero);
		    },
            "address_regex": "^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-zAC-HJ-NP-Z02-9]{11,71})$"
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
                "icon": "point-up",
                "selected": false,
                "switch": true,
            },
            "blockexplorers": {
                "icon": "eye",
                "selected": "blockchain.com",
                "options": {
                    "key1": "blockchain.com",
                    "key2": "blockchair.com"
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
                        "name": "blockchain.info websocket",
                        "url": "wss://ws.blockchain.info/inv/",
                        "display": false
                    }
                ]
            }
        }
    },
    {
        "currency": "monero",
        "data": {
            "currency": "monero",
            "ccsymbol": "xmr",
            "cmcid": "328",
            "urlscheme": function(payment, address, amount, iszero) {
		    	return payment + ":" + address + ((iszero === true) ? "" : "?tx_amount=" + amount);
		    },
            "address_regex": "^[48](?:[0-9AB]|[1-9A-HJ-NP-Za-km-z]{12}(?:[1-9A-HJ-NP-Za-km-z]{30})?)[1-9A-HJ-NP-Za-km-z]{93}$"
        },
        "settings": {
            "Use random address": {
                "icon": "point-up",
                "selected": false,
                "switch": true,
            }
        }
    },
    {
        "currency": "litecoin",
        "data": {
            "currency": "litecoin",
            "ccsymbol": "ltc",
            "cmcid": 2,
            "urlscheme": function(payment, address, amount, iszero) {
		    	return btc_urlscheme(payment, address, amount, iszero);
		    },
            "address_regex": "^([LM][a-km-zA-HJ-NP-Z1-9]{26,33}|ltc1[a-zA-HJ-NP-Z0-9]{26,39})$"
        },
        "settings": {
            "confirmations": {
                "icon": "clock",
                "selected": 0
            },
            "Use random address": {
                "icon": "point-up",
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
                }
            }
        }
    },
    {
        "currency": "dogecoin",
        "data": {
            "currency": "dogecoin",
            "ccsymbol": "doge",
            "cmcid": 74,
            "urlscheme": function(payment, address, amount, iszero) {
		    	return btc_urlscheme(payment, address, amount, iszero);
		    },
            "address_regex": "^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$"
        },
        "settings": {
            "confirmations": {
                "icon": "clock",
                "selected": 0
            },
            "Use random address": {
                "icon": "point-up",
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
                }
            }
        }
    },
    {
        "currency": "nano",
        "data": {
            "currency": "nano",
            "ccsymbol": "nano",
            "cmcid": 1567,
            "urlscheme": function(payment, address, amount, iszero) {
	            return "nano:" + address + ((iszero === true) ? "" : "?amount=" + (parseFloat(amount) * "1000000000000000000000000000000").toFixedSpecial(0));
		    },
            "address_regex": "^(xrb|nano)_([a-z1-9]{60})$"
        },
        "settings": {
	        "Use random address": {
                "icon": "point-up",
                "selected": false,
                "switch": true,
            },
            "blockexplorers": {
                "icon": "eye",
                "selected": "nanocrawler.cc"
            },
            "apis": {
                "icon": "sphere",
                "selected": {
                    "name": "nano node",
                    "url": "https://www.bitrequest.app:8020",
                    "username": "",
                    "password": "",
                    "display": true
                },
                "apis": [{
                    "name": "nano node",
                    "url": "https://www.bitrequest.app:8020",
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
                    "name": "nano socket",
                    "url": "wss://bitrequest.app:8010",
                    "display": true
                },
                "apis": [{
                        "name": "nano socket",
                        "url": "wss://bitrequest.app:8010",
                        "display": true
                    },
                    {
                        "name": "nano.cc websocket",
                        "url": "wss://socket.nanos.cc",
                        "display": true
                    }
                ],
                "options": []
            }
        }
    },
    {
        "currency": "ethereum",
        "data": {
            "currency": "ethereum",
            "ccsymbol": "eth",
            "cmcid": 1027,
            "urlscheme": function(payment, address, amount, iszero) {
	            return payment + ":" + address + ((iszero === true) ? "" : "?value=" + (parseFloat(amount) * "1000000000000000000").toFixedSpecial(0));
		    },
            "address_regex": "web3"
        },
        "settings": {
            "confirmations": {
                "icon": "clock",
                "selected": 0
            },
            "Use random address": {
                "icon": "point-up",
                "selected": false,
                "switch": true,
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
            }
        }
    }
]

var erc20_settings = {
    "confirmations": {
        "icon": "clock",
        "selected": 0
    },
    "Use random address": {
        "icon": "point-up",
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

var app_settings = [{
        "id": "heading",
        "heading": "Account"
    },
    {
        "id": "accountsettings",
        "heading": "Account name",
        "selected": "Bitrequest",
        "icon": "icon-user"
    },
    {
        "id": "contactform",
        "heading": "Contact form",
        "selected": "Contact form",
        "icon": "icon-user",
        "name": "",
        "address": "",
        "zipcode": "",
        "city": "",
        "country": "",
        "email": ""
    },
    {
        "id": "heading",
        "heading": "Currency Settings"
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
        "id": "url_shorten_settings",
        "heading": "Url shortener",
        "selected": "firebase",
        "icon": "icon-link",
        "us_active": "active",
        "bitly_at": null,
        "fbapikey": null
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
        "pinhash": null
    },
    {
        "id": "backup",
        "heading": "Backup",
        "selected": null,
        "icon": "icon-download",
        "lastbackup": null
    },
    {
        "id": "restore",
        "heading": "Restore from backup",
        "selected": null,
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
        "id": "api_proxy",
        "heading": "API Proxy",
        "selected": approot,
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
        "id": "cachecontrol",
        "heading": "Cache control / updates",
        "selected": "",
        "icon": "icon-database"
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
        "name": "nanocrawler.cc",
        "url": "https://nanocrawler.cc/",
        "prefix": "explorer",
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