$(document).ready(function() {
    //init_eth_sockets
    //init_layer2
    //alchemy_eth_websocket
    //web3_eth_websocket
    //web3_erc20_websocket
    //omni_scan
    //ping_omniscan
    //omniscan_erc20
    //ping_omniscan_erc20
    //bnb_scan
    //ping_bnb
    //set_l2_status

    // ** Monirors **

    //query_ethl2_api
    //scan_ethl2_api
    //poll_ethl2_api
    //arbitrum_apis
    //polygon_apis
    //bnb_apis

    // ** L2 Coinsettings **
    edit_l2();
    l2nw_toggle();
    l2nw_switch();
    submit_l2();
});

// Init eth and erc20
function init_eth_sockets(payment, socket_node, address, request_ts, contract, retry) {
    const l2 = socket_node.network;
    // Layer 1
    if (!l2) {
        if (payment === "ethereum") {
            if (socket_node.url === glob_main_alchemy_socket) {
                alchemy_eth_websocket(socket_node, address); // L1 Alchemy
            } else {
                web3_eth_websocket(socket_node, address, glob_main_eth_node); // L1 Infura
            }
        } else {
            web3_erc20_websocket(socket_node, address, contract);
        }
    }
    // Layer 2
    if (retry) {
        init_layer2(payment, socket_node, address, request_ts);
        return
    }
    const eth_setting = cs_node(payment, "layer2", true),
        eth_options = eth_setting.options;
    if (eth_options) {
        const l2_arr = [],
            is_request = request.isrequest,
            req_l2_arr = request.eth_l2s;
        let index = 0;
        $.each(eth_options, function(key, value) {
            const set_select = is_request ? false : value.selected,
                inarr = $.inArray(index, req_l2_arr) !== -1,
                selected = set_select || inarr;
            if (selected) {
                l2_arr.push(index);
                const sn = (retry) ? socket_node : q_obj(value, "websockets.selected");
                if (sn) {
                    init_layer2(payment, sn, address, request_ts);
                }
            }
            index++;
        });
        if (is_request) {} else {
            // attach eth l2's to request object
            request.eth_l2s = l2_arr;
        }
    }
}

// Init eth and erc20 L2s
function init_layer2(payment, socket_node, address, request_ts) {
    glob_socket_attempt[sha_sub(socket_node.url + "l2", 15)] = true;
    const network = socket_node.network,
        node_name = socket_node.name;
    if (payment === "ethereum") {
        // arbitrum:
        if (network === "arbitrum") {
            if (node_name === "arbiscan") {
                omni_scan(socket_node, address, request_ts);
            } else if (node_name === "etherscan") {
                omni_scan(socket_node, address, request_ts, 42161);
            }
        }
        // polygon
        if (network === "polygon") {
            if (node_name === "polygonscan") {
                omni_scan(socket_node, address, request_ts);
            } else if (node_name === "etherscan") {
                omni_scan(socket_node, address, request_ts, 137);
            }
        }
        return
    }
    const ccsymbol = request.currencysymbol,
        ctracts = contracts(ccsymbol);
    // arbitrum
    if (network === "arbitrum") {
        const arb_contract = ctracts.arbitrum;
        if (!arb_contract) {
            // No arbitrum support
        } else {
            if (node_name === "infura") {
                web3_erc20_websocket(socket_node, address, arb_contract);
            } else if (node_name === "etherscan") {
                omniscan_erc20(socket_node, address, request_ts, arb_contract, 42161);
            } else if (node_name === "arbiscan") {
                omniscan_erc20(socket_node, address, request_ts, arb_contract);
            }
        }
    }
    // polygon
    if (network === "polygon") {
        const polygon_contract = ctracts.polygon;
        if (!polygon_contract) {
            // No Polygon support
        } else {
            if (node_name === "infura") {
                web3_erc20_websocket(socket_node, address, polygon_contract);
            } else if (node_name === "etherscan") {
                omniscan_erc20(socket_node, address, request_ts, polygon_contract, 137);
            } else if (node_name === "polygonscan") {
                omniscan_erc20(socket_node, address, request_ts, polygon_contract);
            }
        }
    }
    // binance smart chain
    if (network === "bnb") {
        const bnb_contract = ctracts.bnb;
        if (!bnb_contract) {
            // No Binance smart chain support
        } else {
            if (node_name === "infura") {
                web3_erc20_websocket(socket_node, address, bnb_contract);
            } else if (node_name === "etherscan") {
                omniscan_erc20(socket_node, address, request_ts, bnb_contract, 56);
            } else if (node_name === "bscscan") {
                omniscan_erc20(socket_node, address, request_ts, bnb_contract);
            } else if (node_name === "binplorer") {
                bnb_scan(socket_node, address, request_ts, ccsymbol);
            }
        }
    }
}

// Initializes and manages Alchemy WebSocket for Ethereum
function alchemy_eth_websocket(socket_node, thisaddress) {
    const provider_url = socket_node.url,
        al_id = get_alchemy_apikey(),
        provider = provider_url + al_id,
        ws_id = sha_sub(provider, 10);
    if (glob_sockets[ws_id]) {
        return
    }
    const websocket = glob_sockets[ws_id] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": ["alchemy_pendingTransactions", {
                "toAddress": [thisaddress],
                "hashesOnly": false
            }]
        });
        websocket.send(ping_event);
        glob_pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
            poll_animate();
        }, 55000);
    };
    websocket.onmessage = function(e) {
        try {
            const data = JSON.parse(e.data),
                result = q_obj(data, "params.result");
            if (result && result.hash && str_match(result.to, thisaddress)) {
                const set_confirmations = request.set_confirmations || 0,
                    txd = infura_block_data(result, set_confirmations, request.currencysymbol);
                closesocket();
                pick_monitor(txd);
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, ws_id);
        return
    };
}

// Initializes and manages WebSocket for Ethereum and Ethereum-like networks
function web3_eth_websocket(socket_node, thisaddress, rpcurl) {
    const provider_url = socket_node.url,
        if_id = get_infura_apikey(provider_url),
        provider = provider_url + if_id,
        ws_id = sha_sub(provider, 10);
    if (glob_sockets[ws_id]) {
        return
    }
    const websocket = glob_sockets[ws_id] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": ["newHeads"]
        });
        websocket.send(ping_event);
        glob_pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
            poll_animate();
        }, 55000);
    };
    websocket.onmessage = function(e) {
        try {
            const data = JSON.parse(e.data),
                result = q_obj(data, "params.result");
            if (result && result.hash) {
                const api_dat = helper ? q_obj(helper, "api_info.data") : null;
                if (!api_dat) return;
                const rpc_url = api_dat.default === false ? api_dat.url : rpcurl;
                api_proxy(eth_params(rpc_url, 25, "eth_getBlockByHash", [result.hash, true])).done(function(res) {
                    const rslt = inf_result(res),
                        transactions = rslt.transactions;
                    if (transactions) {
                        const set_confirmations = request.set_confirmations || 0;
                        $.each(transactions, function(i, val) {
                            const txda = infura_block_data(val, set_confirmations, request.currencysymbol, result.timestamp);
                            if (str_match(val.to, thisaddress) === true) {
                                const txd = infura_block_data(val, set_confirmations, request.currencysymbol, result.timestamp);
                                closesocket();
                                pick_monitor(txd);
                                return
                            }
                        });
                    }
                })
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, ws_id);
        return
    };
}

// Initializes and manages WebSocket for ERC20 tokens on Ethereum and Ethereum-like networks
function web3_erc20_websocket(socket_node, thisaddress, contract) {
    const l2network = socket_node.network,
        nwid = l2network || "",
        ws_id = contract + nwid;
    if (glob_sockets[ws_id]) {
        return
    }
    const provider_url = complete_url(socket_node.url),
        if_id = get_infura_apikey(provider_url),
        provider = provider_url + if_id;
    const websocket = glob_sockets[ws_id] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": [
                "logs",
                {
                    "address": contract,
                    "topics": []
                }
            ]
        });
        websocket.send(ping_event);
    };
    websocket.onmessage = function(e) {
        try {
            const dat = JSON.parse(e.data),
                result = q_obj(dat, "params.result");
            if (result) {
                if (result.topics) {
                    const topic_address = result.topics[2];
                    if (!topic_address || str_match(topic_address, thisaddress.slice(3)) !== true) return;
                    const contractdata = result.data,
                        cd_hex = contractdata.slice(2),
                        token_value = hexToNumberString(cd_hex),
                        token_decimals = request.decimals,
                        ccval = parseFloat((token_value / Math.pow(10, token_decimals)).toFixed(8));
                    if (ccval === Infinity) return;
                    const set_confirmations = request.set_confirmations || 0,
                        txd = {
                            "ccval": ccval,
                            "transactiontime": now_utc(),
                            "txhash": result.transactionHash,
                            "confirmations": 0,
                            "setconfirmations": set_confirmations,
                            "ccsymbol": request.currencysymbol,
                            "eth_layer2": l2network
                        }
                    if (l2network) {
                        glob_l2s = {};
                        set_l2_status(socket_node, true);
                    }
                    pick_monitor(txd);
                }
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
        handle_socket_fails(socket_node, thisaddress, ws_id, l2network);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, ws_id, l2network);
    };
}

// Initiates Eth layer2 scanning
function omni_scan(socket_node, address, request_ts, chainid) {
    socket_info(socket_node, true);
    glob_pinging[sha_sub(socket_node.name + address)] = setInterval(function() {
        ping_omniscan(socket_node, address, request_ts, chainid);
    }, 7000);
}

// Pings Eth layer2 for transaction updates
function ping_omniscan(socket_node, address, request_ts, chainid) {
    if (!isopenrequest()) { // only when request is visible
        forceclosesocket();
        return;
    }
    const socket_name = socket_node.name,
        cid = chainid ? "&chainid=" + chainid : "";
    api_proxy({
        "api": socket_name,
        "search": "?module=account&action=txlist&address=" + address + "&startblock=0&endblock=latest&page=1&offset=10&sort=desc" + cid,
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            const error = data.error;
            if (error) {
                socket_info(socket_node, false);
                handle_socket_fails(socket_node, address, sha_sub(socket_name + address), true);
                return
            }
            const result = data.result;
            if (result && br_issar(result)) {
                set_l2_status(socket_node, true);
                const set_confirmations = request.set_confirmations || 0;
                $.each(result, function(dat, value) {
                    const txd = omniscan_scan_data_eth(value, set_confirmations, socket_node.network);
                    if (txd.transactiontime > request_ts && txd.ccval) {
                        clearpinging();
                        const requestlist = $("#requestlist > li.rqli"),
                            txid_match = filter_list(requestlist, "txhash", txd.txhash); // check if txhash already exists
                        if (txid_match.length) {
                            return
                        }
                        glob_l2s = {};
                        set_l2_status(socket_node, true);
                        if (set_confirmations > 0) {
                            pick_monitor(txd);
                            return
                        }
                        confirmations(txd, true);
                    }
                });
            }
        }
    }).fail(function() {
        socket_info(socket_node, false);
        handle_socket_fails(socket_node, address, sha_sub(socket_name + address), true);
    });
}

// Initiates Erc20 layer2 scanning
function omniscan_erc20(socket_node, address, request_ts, contract, chainid) {
    socket_info(socket_node, true);
    glob_pinging[contract] = setInterval(function() {
        ping_omniscan_erc20(socket_node, address, request_ts, contract, chainid);
    }, 7000);
}

// Pings Eth Erc20 for transaction updates
function ping_omniscan_erc20(socket_node, address, request_ts, contract, chainid) {
    if (!isopenrequest()) { // only when request is visible
        forceclosesocket();
        return;
    }
    const cid = chainid ? "&chainid=" + chainid : "";
    api_proxy({
        "api": socket_node.name,
        "search": "?module=account&action=tokentx&contractaddress=" + contract + "&address=" + address + "&page=1&offset=100&startblock=0&endblock=99999999&sort=desc" + cid,
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            const error = data.error,
                message = data.message;
            if (error || message === "NOTOK") {
                socket_info(socket_node, false);
                handle_socket_fails(socket_node, address, contract, true);
                return
            }
            const result = data.result;
            if (result && br_issar(result)) {
                set_l2_status(socket_node, true);
                const set_confirmations = request.set_confirmations || 0;
                $.each(result, function(dat, value) {
                    const txd = omniscan_scan_data(value, set_confirmations, request.currencysymbol, socket_node.network);
                    if (txd.transactiontime > request_ts && txd.ccval) {
                        clearpinging();
                        const requestlist = $("#requestlist > li.rqli"),
                            txid_match = filter_list(requestlist, "txhash", txd.txhash); // check if txhash already exists
                        if (txid_match.length) {
                            return
                        }
                        glob_l2s = {};
                        set_l2_status(socket_node, true);
                        if (set_confirmations > 0) {
                            pick_monitor(txd);
                            return
                        }
                        confirmations(txd, true);
                    }
                });
            }
        }
    }).fail(function() {
        socket_info(socket_node, false);
        handle_socket_fails(socket_node, address, contract, true);
    });
}

// Initiates BNB Smart Chain scanning
function bnb_scan(socket_node, address, request_ts, ccsymbol) {
    socket_info(socket_node, true);
    glob_pinging["bnb" + address] = setInterval(function() {
        ping_bnb(socket_node, address, request_ts, ccsymbol);
    }, 7000);
}

// Pings BNB Smart Chain for transaction updates
function ping_bnb(socket_node, address, request_ts, ccsymbol) {
    if (!isopenrequest()) { // only when request is visible
        forceclosesocket();
        return;
    }
    api_proxy({
        "api": "binplorer",
        "search": "getAddressHistory/" + address + "?type=transfer",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (!data) return;
        const set_confirmations = request.set_confirmations || 0;
        set_l2_status(socket_node, true);
        $.each(data.operations, function(dat, value) {
            const symbol = q_obj(value, "tokenInfo.symbol"),
                smatch = str_match(symbol, ccsymbol);
            if (smatch) {
                const txd = ethplorer_scan_data(value, set_confirmations, ccsymbol, "bnb");
                if (txd.transactiontime > request_ts && txd.ccval) {
                    clearpinging();
                    const requestlist = $("#requestlist > li.rqli"),
                        txid_match = filter_list(requestlist, "txhash", txd.txhash); // check if txhash already exists
                    if (txid_match.length) {
                        return
                    }
                    glob_l2s = {};
                    set_l2_status(socket_node, true);
                    if (set_confirmations > 0) {
                        pick_monitor(txd);
                        return
                    }
                    confirmations(txd, true);
                }
            }
        });
    }).fail(function() {
        socket_info(socket_node, false);
        handle_socket_fails(socket_node, address, "bnb" + address, true);
    });
}

// Set and dislay l2 status
function set_l2_status(sn, stat) {
    if (!sn) {
        return
    }
    const network = sn.network,
        status = stat ? "online" : "offline",
        title1 = "#" + sn.url,
        val = status + title1;
    glob_l2s[network] = val;
    const networks = $("#paymentdialogbox .networks");
    let nw_li = "<li>L2's: </i>",
        empty = true;
    $.each(glob_l2s, function(key, value) {
        empty = false;
        const nw_select = value.split("#"),
            stat = " " + nw_select[0],
            title = nw_select[1],
            nw_name = key === "bnb" ? "bnb smart chain" : key;
        nw_li += "<li class='nwl2" + stat + "' title='" + title + "'>" + nw_name + "</li>";
    });
    if (!empty) {
        networks.html("<ul>" + nw_li + "</ul>");
    }
}

// ** Monirors **

function query_ethl2_api(rd, rdo, api_dat) {
    const l2 = rd.eth_layer2;
    if (rdo.pending === "polling" && l2) {
        poll_ethl2_api(rd, rdo, api_dat, l2);
        return
    }
    scan_ethl2_api(rd, rdo, api_dat);
}

function scan_ethl2_api(rd, rdo, api_dat) {
    const requestid = rd.requestid,
        req_l2_arr = rd.eth_l2s,
        source = rdo.source;
    if ($.isEmptyObject(req_l2_arr)) { // No l2's
        api_callback(rdo);
        return
    }
    const thiscurrency = rd.payment,
        l2_setting = cs_node(thiscurrency, "layer2", true),
        l2_options = l2_setting.options;
    if (l2_options) {
        const ccsymbol = rd.currencysymbol,
            ctracts = contracts(ccsymbol),
            rq_id = requestid || "";
        let index = 0,
            scanned = false;
        $.each(l2_options, function(key, value) {
            const inarr = $.inArray(index, req_l2_arr) !== -1;
            if (inarr) {
                const delay = (index + 1) * 1000;
                scanned = true;
                setTimeout(function() {
                    if (glob_l2_fetched) {
                        // Block scanning when l2 tx is detected
                        return
                    }
                    const api_data = api_dat || q_obj(value, "apis.selected"),
                        api_name = api_data.name;
                    if (api_name) {
                        glob_api_attempts[sha_sub(rq_id + api_data.url, 15)] = true;
                        // arbitrum:
                        if (key === "arbitrum") {
                            const arb_contract = ctracts.arbitrum,
                                dat = {
                                    arb_contract,
                                    rd,
                                    api_data,
                                    rdo
                                }
                            arbitrum_apis(dat);
                            return
                        }
                        // polygon:
                        if (key === "polygon") {
                            const polygon_contract = ctracts.polygon,
                                dat = {
                                    polygon_contract,
                                    rd,
                                    api_data,
                                    rdo
                                }
                            polygon_apis(dat);
                            return
                        }
                        // bnb_smart_chain:
                        if (key === "bnb") {
                            const bnb_contract = ctracts.bnb,
                                dat = {
                                    bnb_contract,
                                    rd,
                                    api_data,
                                    rdo
                                }
                            bnb_apis(dat);
                            return
                        }
                    }
                }, delay);
            }
            index++;
        });
        if (!scanned) {
            api_callback(rdo);
        }
    }
}

function poll_ethl2_api(rd, rdo, api_dat, l2) {
    const requestid = rd.requestid,
        rq_id = requestid || "",
        l2_setting = cs_node(rd.thiscurrency, "layer2", true),
        l2_options = l2_setting.options,
        api_data = api_dat || q_obj(l2_options, l2 + ".apis.selected");
    api_name = api_data.name,
        network = api_data.network;
    if (api_name && network) {
        glob_api_attempts[sha_sub(rq_id + api_data.url, 15)] = true;
        const ccsymbol = rd.currencysymbol,
            ctracts = contracts(ccsymbol);
        // arbitrum:
        if (network === "arbitrum") {
            const arb_contract = ctracts.arbitrum,
                dat = {
                    arb_contract,
                    rd,
                    api_data,
                    rdo
                }
            arbitrum_apis(dat);
            return
        }
        // polygon:
        if (network === "polygon") {
            const polygon_contract = ctracts.polygon,
                dat = {
                    polygon_contract,
                    rd,
                    api_data,
                    rdo
                }
            polygon_apis(dat);
            return
        }
        // bnb_smart_chain:
        if (network === "bnb") {
            const bnb_contract = ctracts.bnb,
                dat = {
                    bnb_contract,
                    rd,
                    api_data,
                    rdo
                }
            bnb_apis(dat);
            return
        }
    }
}

// Handles Arbitrum APIS
function arbitrum_apis(dat) {
    const arb_contract = dat.arb_contract,
        thiscurrency = q_obj(dat, "rd.payment");
    if (!arb_contract && thiscurrency !== "ethereum") {
        // No arbitrum contract
    } else {
        const api_name = q_obj(dat, "api_data.name");
        if (api_name === "arbiscan") {
            omniscan_fetch(dat.rd, dat.api_data, dat.rdo, arb_contract);
        } else if (api_name === "etherscan") {
            omniscan_fetch(dat.rd, dat.api_data, dat.rdo, arb_contract, 42161);
        } else if (api_name === "infura") {
            if (q_obj(dat, "rdo.pending") === "polling") {
                infura_txd_rpc(dat.rd, dat.api_data, dat.rdo);
            } else {
                // Use arbiscan
                handle_api_fails(dat.rd, dat.rdo, null, dat.api_data, null, "arbitrum");
            }
        }
    }
}

// Handles Polygon APIS
function polygon_apis(dat) {
    const polygon_contract = dat.polygon_contract,
        thiscurrency = q_obj(dat, "rd.payment");
    if (!polygon_contract && thiscurrency !== "ethereum") {
        // No polygon contract
    } else {
        const api_name = q_obj(dat, "api_data.name");
        if (api_name === "polygonscan") {
            omniscan_fetch(dat.rd, dat.api_data, dat.rdo, polygon_contract);
        } else if (api_name === "etherscan") {
            omniscan_fetch(dat.rd, dat.api_data, dat.rdo, polygon_contract, 137);
        } else if (api_name === "infura") {
            if (q_obj(dat, "rdo.pending") === "polling") {
                infura_txd_rpc(dat.rd, dat.api_data, dat.rdo);
            } else {
                // Use polygonscan
                handle_api_fails(dat.rd, dat.rdo, null, dat.api_data, null, "polygon");
            }
        }
    }
}

// Handles Binance smart chain APIS
function bnb_apis(dat) {
    const bnb_contract = dat.bnb_contract,
        thiscurrency = q_obj(dat, "rd.payment");
    if (!bnb_contract && thiscurrency !== "ethereum") {
        // No bnb contract
    } else {
        const api_name = q_obj(dat, "api_data.name");
        if (api_name === "bscscan") {
            omniscan_fetch(dat.rd, dat.api_data, dat.rdo, bnb_contract);
        } else if (api_name === "binplorer") {
            ethplorer_fetch(dat.rd, dat.rdo, dat.api_data);
        } else if (api_name === "etherscan") {
            omniscan_fetch(dat.rd, dat.api_data, dat.rdo, bnb_contract, 56);
        } else if (api_name === "infura") {
            if (q_obj(dat, "rdo.pending") === "polling") {
                infura_txd_rpc(dat.rd, dat.api_data, dat.rdo);
            } else {
                // Use bscscan
                handle_api_fails(dat.rd, dat.rdo, null, dat.api_data, null, "bnb");
            }
        }
    }
}

// ** L2 Coinsettings **

// Function to handle editing of eth Layer 2 settings
function edit_l2() {
    $(document).on("click", ".cc_settinglist li[data-id='layer2']", function() {
        const thiscurrency = $(this).children(".liwrap").attr("data-currency"),
            csnode = cs_node(thiscurrency, "layer2", true),
            options = csnode.options;
        if (options) {
            const ccsymbol = fetchsymbol(thiscurrency),
                symbol = ccsymbol.symbol,
                ctracts = contracts(symbol),
                arb_contract = ctracts.arbitrum,
                polygon_contract = ctracts.polygon,
                bnb_contract = ctracts.bnb,
                networks = [];
            $.each(options, function(key, value) {
                if (key === "arbitrum" && !arb_contract && thiscurrency !== "ethereum") {} else if (key === "polygon" && !polygon_contract && thiscurrency !== "ethereum") {} else if (key === "bnb" && !bnb_contract && thiscurrency !== "ethereum") {} else {
                    const nw_name = key === "bnb" ? "bnb smart chain" : key,
                        nw_selected = value.selected,
                        s_boxes = []
                    $.each(value, function(k, v) {
                        if (k === "selected") {} else {
                            const selected = v.selected,
                                apis = v.apis,
                                api_push = [];
                            $.each(apis, function(i, v2) {
                                api_push.push({
                                    "span": {
                                        "data-pe": "none",
                                        "attr": add_prefix_to_keys(v2),
                                        "content": v2.name
                                    }
                                });
                            });
                            s_boxes.push({
                                "div": {
                                    "class": "l2_apis",
                                    "attr": {
                                        "data-type": k
                                    },
                                    "content": [{
                                        "h3": {
                                            "content": k
                                        },
                                        "div": {
                                            "class": "selectbox",
                                            "content": [{
                                                    "input": {
                                                        "attr": {
                                                            "type": "text",
                                                            "value": selected.name,
                                                            "placeholder": translate("layer2"),
                                                            "readonly": "readonly"
                                                        },
                                                        "close": true
                                                    },
                                                    "div": {
                                                        "class": "selectarrows icon-menu2",
                                                        "attr": {
                                                            "data-pe": "none"
                                                        }
                                                    }
                                                },
                                                {
                                                    "div": {
                                                        "class": "options single",
                                                        "content": api_push
                                                    }
                                                }
                                            ]
                                        }
                                    }]
                                }
                            });
                        }
                    });
                    networks.push({
                        "div": {
                            "class": "nw2box",
                            "attr": {
                                "data-network": key
                            },
                            "content": [{
                                "h2": {
                                    "class": "nwheading",
                                    "content": nw_name + switchpanel(nw_selected, " custom")
                                },
                                "div": {
                                    "class": "sboxwrap hide",
                                    "content": s_boxes
                                }
                            }]
                        }
                    });
                }
            });
            networks.push({
                "input": {
                    "class": "submit",
                    "attr": {
                        "type": "submit",
                        "value": translate("okbttn"),
                        "data-currency": thiscurrency
                    }
                }
            });
            const sb_render = render_html(networks),
                ddat = [{
                    "div": {
                        "class": "popform",
                        "content": sb_render
                    }
                }],
                content = template_dialog({
                    "id": "l2_formbox",
                    "icon": "icon-new-tab",
                    "title": translate("layer2"),
                    "elements": ddat
                });
            popdialog(content, "triggersubmit");
        }
    })
}

function l2nw_toggle() {
    $(document).on("mouseup", "#l2_formbox h2.nwheading", function(e) {
        const target = $(e.target);
        if (target.hasClass("switchpanel")) {
            return // prevent selection when deleting
        }
        const all_bws = $("#l2_formbox").find(".sboxwrap"),
            this_boxwrap = $(this).next(".sboxwrap");
        if (this_boxwrap.is(":visible")) {
            all_bws.slideUp(200);
            return
        }
        all_bws.not(this_boxwrap).slideUp(200);
        this_boxwrap.slideDown(200);
    })
}

function l2nw_switch() {
    $(document).on("mouseup", "#l2_formbox h2.nwheading .switchpanel", function() {
        const this_switch = $(this),
            sboxwrap = this_switch.parent("h2.nwheading").next(".sboxwrap");
        if (this_switch.hasClass("true")) {
            this_switch.removeClass("true").addClass("false");
            sboxwrap.slideUp(300);
            return
        }
        this_switch.removeClass("false").addClass("true");
    })
}

// Function to handle submission of Layer 2 settings
function submit_l2() {
    $(document).on("click", "#l2_formbox input.submit", function(e) {
        e.preventDefault();
        const payment = $(this).attr("data-currency"),
            csnode = cs_node(payment, "layer2");
        if (csnode) {
            const cs_node_dat = csnode.data("options"),
                nw2box = $("#l2_formbox").find(".popform > .nw2box");
            nw2box.each(function() {
                const this_box = $(this),
                    this_network = this_box.data("network"),
                    this_switch = this_box.find(".switchpanel"),
                    selected = this_switch.hasClass("true"),
                    l2_apis = this_box.find(".l2_apis");
                cs_node_dat[this_network].selected = selected;
                l2_apis.each(function() {
                    const this_nw = $(this),
                        input = this_nw.find(".selectbox > input"),
                        input_data = input.data();
                    if (!$.isEmptyObject(input_data)) {
                        const this_type = this_nw.data("type"),
                            new_selected = q_obj(cs_node_dat, this_network + "." + this_type);
                        if (new_selected) {
                            new_selected.selected = input_data;
                        }
                    }
                });
            });
            csnode.data("options", cs_node_dat).find("p").html("");
            canceldialog();
            notify(translate("datasaved"));
            save_cc_settings(payment, true);
        }
    })
}