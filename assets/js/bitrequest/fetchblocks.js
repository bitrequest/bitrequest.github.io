// Orchestrates Lightning Network payment processing with status checking, invoice handling, and transaction state management via proxy API
function process_lightning_payment(rd, api_data, rdo) {
    const api_name = api_data.name,
        current_list = rdo.thislist,
        request_id = rd.requestid,
        tx_list = rdo.transactionlist,
        status_panel = rdo.statuspanel,
        counter = 0,
        lightning = rd.lightning,
        lightning_only = lightning && lightning.hybrid === false,
        meta_list = current_list.find(".metalist"),
        status_display = meta_list.find(".status"),
        proxy_parts = lnurl_deform(lightning.proxy_host),
        proxy_url = proxy_parts.url,
        proxy_key = lightning.pw || proxy_parts.k,
        payment_id = lightning.pid,
        node_id = lightning.nid,
        implementation = lightning.imp,
        error_default = tl("unabletoconnect"),
        tx_hash = rd.txhash,
        is_lightning_hash = tx_hash && tx_hash.slice(0, 9) === "lightning";
    if (rdo.pending === "scanning") {
        $.ajax({
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy_url + "/proxy/v1/ln/api/",
            "data": {
                "fn": "ln-request-status",
                "id": payment_id,
                "x-api": proxy_key
            }
        }).done(function(response) {
            const error = response.error,
                version = response.version;
            if (version < glob_const.proxy_version) {
                proxy_alert(version);
            }
            if (error) {
                handle_scan_failure({
                    "error": error
                }, rd, "ln", rdo);
                const error_msg = error.message || (typeof error === "string" ? error : error_default);
                status_display.text(" " + error_msg);
                if (!lightning_only) {
                    route_api_request(rd, api_data, rdo);
                    return
                }
                finalize_request_state(rdo);
                return
            }
            const invoice_status = response.status;
            status_display.text(" " + invoice_status);
            if (response.pid === lightning.pid) {
                if (response.bolt11) {
                    const hash = response.request_id || response.hash; // request_id for spark invoices
                    $.ajax({
                        "method": "POST",
                        "cache": false,
                        "timeout": 5000,
                        "url": proxy_url + "/proxy/v1/ln/api/",
                        "data": {
                            "fn": "ln-invoice-status",
                            "imp": implementation,
                            hash,
                            "id": payment_id,
                            "nid": node_id,
                            "callback": "no",
                            "type": rd.requesttype,
                            "x-api": proxy_key
                        }
                    }).done(function(invoice_response) {
                        const invoice_error = invoice_response.error;
                        if (invoice_error) {
                            handle_scan_failure({
                                "error": invoice_error
                            }, rd, "ln", rdo);
                            const invoice_error_msg = invoice_error.message || (typeof invoice_error === "string" ? invoice_error : error_default);
                            status_display.text(" " + invoice_error_msg);
                            if (!lightning_only) {
                                route_api_request(rd, api_data, rdo);
                                return
                            }
                            finalize_request_state(rdo);
                            return
                        }
                        const status = invoice_response.status;
                        if (status) {
                            lightning.invoice = invoice_response;
                            status_display.text(" " + status);
                            rd.lightning = lightning; // push invoice
                            const parsed_tx = lnd_tx_data(invoice_response),
                                boltcard = (response.boltcard) ? true : false;
                            if (parsed_tx.ccval) {
                                const tx_item = create_transaction_item(parsed_tx);
                                if (tx_item) {
                                    tx_list.append(tx_item.data(parsed_tx));
                                    update_transaction_count(status_panel, parsed_tx.confirmations);
                                    if (status === "canceled") {
                                        update_request({
                                            "requestid": request_id,
                                            "status": "canceled",
                                            "confirmations": 0
                                        }, false);
                                        finalize_request_state(rdo);
                                        return
                                    }
                                    update_request({
                                        "requestid": request_id,
                                        boltcard
                                    }, false);
                                    validate_payment_amounts(rd, rdo);
                                    return
                                }
                            }
                        }
                        if (!lightning_only) {
                            route_api_request(rd, api_data, rdo);
                            return
                        }
                        finalize_request_state(rdo);
                    }).fail(function(xhr, stat, err) {
                        const error_obj = xhr || stat || err;
                        handle_scan_failure({
                            "error": error_obj
                        }, rd, "ln", rdo);
                        if (!lightning_only) {
                            route_api_request(rd, api_data, rdo);
                            return
                        }
                        finalize_request_state(rdo);
                    });
                    return
                }
                if (!lightning_only) {
                    route_api_request(rd, api_data, rdo);
                    return
                }
                finalize_request_state(rdo);
                return
            }
            if (invoice_status === "not found") {
                update_request({
                    "requestid": request_id,
                    "status": "expired",
                    "pending": "no",
                    "confirmations": 0
                }, true);
            }
            handle_scan_failure({
                "error": "payment id not found"
            }, rd, "ln", rdo);
            if (!lightning_only) {
                route_api_request(rd, api_data, rdo);
                return
            }
            finalize_request_state(rdo);
        }).fail(function(xhr, stat, err) {
            const error_obj = xhr || stat || err;
            handle_scan_failure({
                "error": error_obj
            }, rd, "ln", rdo);
            if (!lightning_only) {
                route_api_request(rd, api_data, rdo);
                return
            }
            finalize_request_state(rdo);
        }).always(function() {
            update_api_source(rdo, {
                "name": "proxy"
            });
        });
        return
    }
    if (rdo.pending === "polling" && is_lightning_hash) {
        const invoice = lightning.invoice;
        if (invoice) {
            if (tx_hash) {
                const hash = invoice.request_id || tx_hash.slice(9); // request_id for spark invoices
                $.ajax({
                    "method": "POST",
                    "cache": false,
                    "timeout": 5000,
                    "url": proxy_url + "/proxy/v1/ln/api/",
                    "data": {
                        "fn": "ln-invoice-status",
                        "imp": implementation,
                        hash,
                        "id": payment_id,
                        "nid": node_id,
                        "callback": "no",
                        "type": rd.requesttype,
                        "x-api": proxy_key
                    }
                }).done(function(invoice_response) {
                    if (invoice_response?.error) {
                        handle_scan_failure({
                            "error": invoice_response.error
                        }, rd, "ln", rdo);
                        finalize_request_state(rdo);
                        return
                    }
                    const status = invoice_response.status;
                    if (status) {
                        lightning.invoice = invoice_response;
                        status_display.text(" " + status);
                        rd.lightning = lightning; // push invoice
                        const parsed_tx = lnd_tx_data(invoice_response);
                        if (parsed_tx.ccval) {
                            const tx_item = create_transaction_item(parsed_tx);
                            if (tx_item) {
                                tx_list.append(tx_item.data(parsed_tx));
                                update_transaction_count(status_panel, parsed_tx.confirmations);
                                if (status === "canceled") {
                                    update_request({
                                        "requestid": request_id,
                                        "status": "canceled",
                                        "confirmations": 0
                                    }, true);
                                    finalize_request_state(rdo);
                                } else {
                                    validate_payment_amounts(rd, rdo);
                                }
                            }
                        }
                    }
                }).fail(function(xhr, stat, err) {
                    const error_obj = xhr || stat || err;
                    handle_scan_failure({
                        "error": error_obj
                    }, rd, "ln", rdo);
                    finalize_request_state(rdo);
                }).always(function() {
                    update_api_source(rdo, {
                        "name": "proxy"
                    });
                });
            }
            return
        }
        handle_scan_failure({
            "error": tl("noinvoicesfound")
        }, rd, "ln", rdo);
        finalize_request_state(rdo);
        return
    }
    route_api_request(rd, api_data, rdo);
}

// ** ethplorer / binplorer API **
function process_ethereum_transactions(rd, api_data, rdo) {
    const api_name = api_data.name,
        network = api_data.network || false;
    if (rdo.pending === "scanning") {
        run_address_scan(rd, api_data, rdo, {
            "request": {
                "api": api_name,
                "search": "getAddressHistory/" + rd.address + "?type=transfer",
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            },
            "extract": (api_result) => api_result.operations,
            "parse": (tx, rd, rdo) => ethplorer_scan_data(tx, rdo.setconfirmations, rd.currencysymbol, network),
            "match": (parsed_tx, tx, rd, rdo) => {
                const adjusted_timestamp = (rd.requesttype === "local" && rd.status === "insufficient") ? rdo.request_timestamp - 30000 : rdo.request_timestamp;
                return str_match(tx.to, rd.address) === true &&
                    parsed_tx.transactiontime > adjusted_timestamp &&
                    str_match(rd.currencysymbol, q_obj(tx, "tokenInfo.symbol")) === true &&
                    parsed_tx.ccval;
            },
            "display_on_match": true,
            network
        });
        return
    }
    if (rdo.pending === "polling") {
        const tx_hash = rd.txhash;
        if (tx_hash) {
            run_tx_poll(rd, api_data, rdo, {
                "request": {
                    "api": api_name,
                    "search": "getTxInfo/" + tx_hash,
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "params": {
                        "method": "GET"
                    }
                },
                "parse": (api_result, rd, rdo) => ethplorer_poll_data(api_result, rdo.setconfirmations, rd.currencysymbol, network),
                "display_on_match": true,
                network
            });
        }
    }
}

// Orchestrates multi-currency transaction processing via Blockchair API with ERC20 and native token support
function blockchair_fetch(rd, api_data, rdo) {
    if (rdo.pending === "scanning") {
        if (rd.payment === "ethereum") {
            blockchair_eth_scan(rd, api_data, rdo);
            return
        }
        if (rd.erc20) {
            blockchair_erc20_scan(rd, api_data, rdo);
            return
        }
        blockchair_native_scan(rd, api_data, rdo);
        return
    }
    if (rdo.pending === "polling") {
        if (rd.txhash) {
            blockchair_tx_poll(rd, api_data, rdo);
        }
    }
}

// Blockchair Ethereum address scan. Pulls calls[] from the dashboards/address response.
function blockchair_eth_scan(rd, api_data, rdo) {
    const wallet_address = rd.address,
        address_normalized = wallet_address.toLowerCase(),
        currency_symbol = rd.currencysymbol;
    run_address_scan(rd, api_data, rdo, {
        "request": {
            "api": api_data.name,
            "search": "ethereum/dashboards/address/" + wallet_address,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        },
        "error_check": (api_result) => api_result?.error || api_result?.context?.error || false,
        "extract": (api_result) => {
            const eth_txs = q_obj(api_result, "data." + address_normalized + ".calls") ||
                q_obj(api_result, "data." + wallet_address + ".calls");
            return empty_obj(eth_txs) ? [] : eth_txs;
        },
        "parse": (tx, _rd, rdo, api_result) => blockchair_eth_scan_data(tx, rdo.setconfirmations, currency_symbol, q_obj(api_result, "context.state")),
        "match": (parsed_tx, _tx, _rd, rdo) => parsed_tx.ccval && parsed_tx.transactiontime > rdo.request_timestamp && str_match(parsed_tx.recipient, wallet_address)
    });
}

// Blockchair ERC-20 address scan. Pulls transactions[] from the erc-20/<contract>/dashboards/address response.
function blockchair_erc20_scan(rd, api_data, rdo) {
    const wallet_address = rd.address,
        address_normalized = wallet_address.toLowerCase(),
        currency_symbol = rd.currencysymbol,
        token_contract = rd.token_contract;
    run_address_scan(rd, api_data, rdo, {
        "request": {
            "api": api_data.name,
            "search": "ethereum/erc-20/" + token_contract + "/dashboards/address/" + wallet_address,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        },
        "error_check": (api_result) => api_result?.error || api_result?.context?.error || false,
        "extract": (api_result) => {
            const tx_hashes = q_obj(api_result, "data." + wallet_address + ".transactions") ||
                q_obj(api_result, "data." + address_normalized + ".transactions");
            return empty_obj(tx_hashes) ? [] : tx_hashes;
        },
        "parse": (tx, _rd, rdo, api_result) => blockchair_erc20_scan_data(tx, rdo.setconfirmations, currency_symbol, q_obj(api_result, "context.state")),
        "match": (parsed_tx, _tx, _rd, rdo) =>
            parsed_tx.transactiontime > rdo.request_timestamp &&
            str_match(parsed_tx.recipient, wallet_address) === true &&
            str_match(parsed_tx.token_symbol, currency_symbol) === true &&
            parsed_tx.ccval
    });
}

// Blockchair native chain (BTC/LTC/DOGE/etc) address scan.
function blockchair_native_scan(rd, api_data, rdo) {
    const api_name = api_data.name,
        tx_list = rdo.transactionlist,
        source = rdo.source,
        wallet_address = rd.address,
        address_normalized = wallet_address.toLowerCase(),
        currency_symbol = rd.currencysymbol;
    let matched_tx = false;
    const endpoint_url = rd.payment + "/dashboards/address/" + wallet_address;
    api_proxy({
            "api": api_name,
            "search": endpoint_url,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        }).done(function(response) {
            const api_result = br_result(response)?.result;
            if (api_result) {
                if (api_result.error) {
                    handle_scan_failure({
                        "error": api_result.error
                    }, rd, api_data, rdo);
                    return
                }
                const blockchain_state = api_result.context;
                if (blockchain_state.error) {
                    handle_scan_failure({
                        "error": api_result.context
                    }, rd, api_data, rdo);
                    return
                }
                const block_height = blockchain_state.state,
                    tx_hashes = q_obj(api_result, "data." + wallet_address + ".transactions") || q_obj(api_result, "data." + address_normalized + ".transactions");
                if (tx_hashes) {
                    if (empty_obj(tx_hashes)) {
                        glob_let.tx_count = 0;
                        process_scan_results(rd, api_data, rdo, matched_tx);
                        return
                    }
                    if (source === "addr_polling") { // only fetch transactions when new one is detected
                        const glob_tx_count = glob_let.tx_count,
                            tx_count = tx_hashes.length;
                        if (tx_count > glob_let.tx_count) {
                            // new tx detected; continue
                        } else {
                            if (glob_tx_count === 1000000) {
                                glob_let.tx_count = tx_count;
                            }
                            return // intentional early-return without process_scan_results — see header comment
                        }
                    }
                    api_proxy({
                        "api": api_name,
                        "search": rd.payment + "/dashboards/transactions/" + tx_hashes.slice(0, 6),
                        "cachetime": rdo.cachetime,
                        "cachefolder": "1h",
                        "params": {
                            "method": "GET"
                        }
                    }).done(function(tx_response) {
                        const tx_result = br_result(tx_response)?.result,
                            blockchain_data = tx_result.data;
                        if (blockchain_data) {
                            $.each(blockchain_data, function(date, tx) {
                                const parsed_tx = blockchair_scan_data(tx, rdo.setconfirmations, currency_symbol, wallet_address, block_height);
                                if (parsed_tx.transactiontime > rdo.request_timestamp && parsed_tx.ccval) {
                                    matched_tx = parsed_tx;
                                    if (source === "requests") {
                                        const tx_item = create_transaction_item(parsed_tx);
                                        if (tx_item) {
                                            tx_list.append(tx_item.data(parsed_tx));
                                        }
                                    } else {
                                        return false
                                    }
                                }
                            });
                            process_scan_results(rd, api_data, rdo, matched_tx);
                            return
                        }
                        handle_scan_failure(null, rd, api_data, rdo);
                    }).fail(scan_fail(rd, api_data, rdo));
                    return
                }
            }
            handle_scan_failure(null, rd, api_data, rdo);
        }).fail(scan_fail(rd, api_data, rdo))
        .always(function() {
            update_api_source(rdo, api_data);
        });
}

// Blockchair single-tx poll. Used for all chains; dispatches parser by rd.erc20 / rd.payment.
function blockchair_tx_poll(rd, api_data, rdo) {
    const wallet_address = rd.address,
        currency_symbol = rd.currencysymbol,
        endpoint_url = rd.erc20 ?
        "ethereum/dashboards/transaction/" + rd.txhash + "?erc_20=true" :
        rd.payment + "/dashboards/transaction/" + rd.txhash;
    run_tx_poll(rd, api_data, rdo, {
        "request": {
            "api": api_data.name,
            "search": endpoint_url,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        },
        "error_check": (api_result) => {
            if (!api_result?.context) return "missing context";
            if (api_result.context.error) return api_result.context;
            return false;
        },
        "parse": (api_result, rd, rdo) => {
            const block_height = q_obj(api_result, "context.state");
            if (!block_height) return null;
            const tx_data = q_obj(api_result, "data." + rd.txhash);
            if (!tx_data) return null;
            return rd.erc20 ? blockchair_erc20_poll_data(tx_data, rdo.setconfirmations, currency_symbol, block_height) :
                (rd.payment === "ethereum") ? blockchair_eth_scan_data(tx_data.calls[0], rdo.setconfirmations, currency_symbol, block_height) :
                blockchair_scan_data(tx_data, rdo.setconfirmations, currency_symbol, wallet_address, block_height);
        }
    });
}

// ** Arbiscan / Polygonscan / Bnbscan API **
function scan_layer2_transactions(rd, api_data, rdo, contract, chainid) {
    const api_name = api_data.name,
        network = api_data.network,
        chain_param = chainid ? "&chainid=" + chainid : "",
        eth_request = {
            "api": api_name,
            "search": "?module=account&action=txlist&address=" + rd.address + "&startblock=0&endblock=latest&page=1&offset=1000&sort=desc" + chain_param,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        },
        token_request = {
            "api": api_name,
            "search": "?module=account&action=tokentx&contractaddress=" + contract + "&address=" + rd.address + "&page=1&offset=100&startblock=0&endblock=99999999&sort=desc" + chain_param,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        },
        extract_tx_array = (api_result) => is_array(api_result.result) ? api_result.result : null,
        scan_match = (parsed_tx, tx, rd, rdo) => {
            const adjusted_timestamp = (rd.requesttype === "local" && rd.status === "insufficient") ? rdo.request_timestamp - 30000 : rdo.request_timestamp;
            return str_match(tx.to, rd.address) && parsed_tx.transactiontime > adjusted_timestamp && parsed_tx.ccval;
        };
    if (rdo.pending === "scanning") {
        if (rd.payment === "ethereum") {
            run_address_scan(rd, api_data, rdo, {
                "request": eth_request,
                "extract": extract_tx_array,
                "parse": (tx, rd, rdo) => omniscan_scan_data_eth(tx, rdo.setconfirmations, network),
                "match": scan_match,
                "display_on_match": true,
                network
            });
            return
        }
        if (contract) {
            run_address_scan(rd, api_data, rdo, {
                "request": token_request,
                "extract": extract_tx_array,
                "parse": (tx, rd, rdo) => omniscan_scan_data(tx, rdo.setconfirmations, rd.currencysymbol, network),
                "match": scan_match,
                "display_on_match": true,
                network
            });
            return
        }
        finalize_request_state(rdo);
        return
    }
    if (rdo.pending === "polling") {
        const tx_hash = rd.txhash;
        if (tx_hash) {
            const poll_match = (parsed_tx, tx) => tx.hash === tx_hash && parsed_tx.ccval;
            if (rd.payment === "ethereum") {
                run_address_scan(rd, api_data, rdo, {
                    "request": eth_request,
                    "extract": extract_tx_array,
                    "parse": (tx, rd, rdo) => omniscan_scan_data_eth(tx, rdo.setconfirmations, network),
                    "match": poll_match,
                    network
                });
                return
            }
            if (contract) {
                run_address_scan(rd, api_data, rdo, {
                    "request": token_request,
                    "extract": extract_tx_array,
                    "parse": (tx, rd, rdo) => omniscan_scan_data(tx, rdo.setconfirmations, rd.currencysymbol, network),
                    "match": poll_match,
                    network
                });
                return
            }
        }
        finalize_request_state(rdo);
    }
}

// ** Alchemy.com API **

// Routes alchemy.com API requests between address polling and transaction scanning with block height verification
function initialize_alchemy_scan(rd, api_data, rdo, ctract) {
    const source = rdo.source;
    if (source === "addr_polling" || source === "l2_scanning") {
        process_alchemy_transactions(rd, api_data, rdo, ctract, false);
        return
    }
    get_alchemy_block_height(rd, api_data, rdo, ctract);
}

// Fetches and validates current blockchain height from alchemy.com for accurate transaction confirmation counting
function get_alchemy_block_height(rd, api_data, rdo, ctract) {
    const url = api_data.url,
        api = "alchemy",
        saved_key = $("#apikeys").data(api),
        key_param = saved_key ? saved_key : "",
        proxy = saved_key ? false : true,
        api_url = url + key_param;
    api_proxy({ // get latest blockheight
            api,
            api_url,
            proxy,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "POST",
                "data": {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "eth_blockNumber",
                    "params": []
                },
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        }).done(function(res) {
            const block_data = br_result(res);
            if (block_data) {
                const block_height = q_obj(block_data, "result.result");
                if (block_height) {
                    process_alchemy_transactions(rd, api_data, rdo, ctract, block_height);
                    return
                }
            }
            handle_scan_failure(null, rd, api_data, rdo);
        }).fail(scan_fail(rd, api_data, rdo))
        .always(function() {
            update_api_source(rdo, api_data);
        });
}

// Handles ETH and ERC20 transaction scanning and polling using alchemy.com API
function process_alchemy_transactions(rd, api_data, rdo, ctract, block_height) {
    const url = api_data.url,
        api = "alchemy",
        saved_key = $("#apikeys").data(api),
        key_param = saved_key ? saved_key : "",
        proxy = saved_key ? false : true,
        api_url = url + key_param,
        address = rd.address,
        contract = ctract || rd.token_contract,
        is_erc20 = (rd.erc20 && contract),
        contractAddresses = is_erc20 ? [contract] : false,
        category = is_erc20 ? ["erc20"] : contractAddresses ? ["external", "internal"] : ["external"],
        cc_symbol = rd.currencysymbol,
        network = api_data.network || false,
        eth_scan = {
            api,
            api_url,
            proxy,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "POST",
                "data": {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "alchemy_getAssetTransfers",
                    "params": [{
                        "toAddress": address,
                        contractAddresses,
                        category,
                        "withMetadata": true,
                        "maxCount": "0x32",
                        "order": "desc"
                    }]
                },
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        };
    run_address_scan(rd, api_data, rdo, {
        "request": eth_scan,
        "extract": (api_result) => q_obj(api_result, "result.transfers"),
        "parse": (tx, _rd, rdo) => alchemy_scan_data_eth(tx, rdo.setconfirmations, cc_symbol, network, block_height),
        "match": (parsed_tx, tx, rd, rdo) => {
            const adjusted_timestamp = (rd.requesttype === "local" && rd.status === "insufficient") ? rdo.request_timestamp - 30000 : rdo.request_timestamp,
                poll_match = rd.txhash ? (rd.txhash === parsed_tx.txhash) : true;
            return str_match(tx.to, rd.address) && parsed_tx.transactiontime > adjusted_timestamp && parsed_tx.ccval && poll_match;
        },
        "display_on_match": true,
        "break_on_match": (rd) => !!rd.txhash, // poll mode: only one possible match, stop after finding it
        network
    });
}

// Checks if sevret viewkey is available and sets monitor flow based on scanning / polling (only scanning requires xmr-lws)
function init_monero_scan(rd, api_data, rdo) {
    const view_key = q_obj(rd, "viewkey.vk");
    if (!view_key) {
        finalize_request_state(rdo);
        return
    }
    if (rdo.pending === "polling") { // assets/js/bitrequest/polling.js
        poll_monero_rpc(rd, api_data, rdo); // use xmr node for tx lookup
        return
    }
    monero_lws_login(rd, api_data, rdo);
}

// Scan monero transactions using monero_lws RPC
function monero_lws_login(rd, api_data, rdo) {
    const vk_object = rd.viewkey,
        view_key = vk_object.vk,
        xmr_settings = active_coinsettings("monero"),
        set_lws_host = q_obj(xmr_settings, "apis.lws_selected.url"),
        lws_host = set_lws_host || lws_proxy;
    if (monero_lws_node_access(lws_host, view_key)) {
        monero_lws_get_address_txs(rd, api_data, rdo, vk_object, lws_host);
        return
    }
    const wallet_address = vk_object.account || rd.address,
        data = {
            "address": wallet_address,
            "view_key": view_key,
            "create_account": true,
            "generated_locally": false
        },
        xmr_block_index = rd.xmr_block_index;
    if (xmr_block_index) {
        data.start_height = xmr_block_index;
    }
    api_proxy({
        "api_url": lws_host + "/login",
        "proxy": true,
        "params": {
            "method": "POST",
            data,
            "headers": {
                "Content-Type": "application/json"
            }
        }
    }).done(function(response) {
        const api_result = br_result(response)?.result;
        if (api_result) {
            const new_address = api_result.new_address;
            if (new_address === true || new_address === false) { // confirm response
                set_monero_lws_node_access(lws_host, view_key);
                monero_lws_get_address_txs(rd, api_data, rdo, vk_object, lws_host);
                return
            }
        }
        finalize_request_state(rdo);
    }).fail(scan_fail(rd, api_data, rdo));
}

// Stores Monero view key in session storage
function set_monero_lws_node_access(host, view_key) {
    const hostkey_hash = sha_sub(host + view_key, 6),
        stored_keys = br_get_session("xmrvks", true);
    if (stored_keys) {
        stored_keys.push(hostkey_hash);
        br_set_session("xmrvks", stored_keys, true);
        return
    }
    br_set_session("xmrvks", [hostkey_hash], true);
}

// Verifies if view key has existing authenticated session with Monero node
function monero_lws_node_access(host, view_key) {
    if (host && view_key) {
        const stored_keys = br_get_session("xmrvks", true);
        if (stored_keys) {
            const hostkey_hash = sha_sub(host + view_key, 6);
            if (stored_keys.includes(hostkey_hash)) {
                return true
            }
        }
    }
    return false
}

// Look up incoming transactions using monero_lws RPC
function monero_lws_get_address_txs(rd, api_data, rdo, vk_object, lws_host) {
    const local_lws = (lws_host === lws_proxy),
        url_base = local_lws ? br_proxy : lws_host,
        api_url = local_lws ? url_base + "/monero-lws/" : url_base + "/get_address_txs",
        wallet_address = vk_object.account || rd.address,
        request_payload = {
            "address": wallet_address,
            "view_key": vk_object.vk,
            "limit": 10
        };
    api_proxy({
            api_url,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "proxy": true,
            "params": {
                "method": "POST",
                "data": request_payload,
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        }).done(function(response) {
            const api_result = br_result(response)?.result,
                transactions = api_result.transactions;
            if (transactions) {
                let matched_tx = false;
                if (has_tx(transactions)) {
                    const sorted_txs = sort_transactions_by_date(monero_lws_tx_data, transactions);
                    $.each(sorted_txs, function(date, tx) {
                        const parsed_tx = monero_lws_tx_data(tx, rdo.setconfirmations, api_result.blockchain_height);
                        if (parsed_tx) {
                            const pid_matches = validate_monero_payment_id(rd, parsed_tx); // match xmr payment_id if set
                            if (pid_matches) {
                                if (parsed_tx.ccval && parsed_tx.transactiontime > rdo.request_timestamp) {
                                    matched_tx = parsed_tx;
                                    if (rdo.source === "requests") {
                                        const tx_item = create_transaction_item(parsed_tx);
                                        if (tx_item) {
                                            rdo.transactionlist.append(tx_item.data(parsed_tx));
                                        }
                                    } else {
                                        return false
                                    }
                                }
                            }
                        }
                    });
                }
                process_scan_results(rd, api_data, rdo, matched_tx);
                return
            }
            finalize_request_state(rdo);
        }).fail(scan_fail(rd, api_data, rdo))
        .always(function() {
            update_api_source(rdo, {
                "name": url_base
            });
        });
}

// Performs Monero payment ID validation with integrated address support
function validate_monero_payment_id(rd, tx_data) {
    if (rd.xmr_ia) {
        const xmr_pid = tx_data.payment_id;
        if (xmr_pid == "0000000000000000") { // sometimes monero-lws does not return payment id
            const ccval = tx_data.ccval,
                cc_amount = rd.cc_amount;
            return (ccval > (cc_amount * 0.97) && ccval < (cc_amount * 1.03)); // error margin for xmr integrated addresses
        }
        return rd.payment_id === xmr_pid;
    }
    return true;
}

// Routes blockchain.info API requests between address polling and transaction scanning with block height verification
function initialize_bitcoin_scan(rd, api_data, rdo) {
    if (rdo.source === "addr_polling") {
        scan_bitcoin_transactions(rd, api_data, rdo, false);
        return
    }
    get_bitcoin_block_height(rd, api_data, rdo);
}

// Fetches and validates current blockchain height for accurate transaction confirmation counting
function get_bitcoin_block_height(rd, api_data, rdo) {
    api_proxy({ // get latest blockheight
            "api": "blockchain.info",
            "search": rd.currencysymbol + "/block/best",
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        }).done(function(block_response) {
            const block_data = br_result(block_response);
            if (block_data) {
                const block_height = q_obj(block_data, "result.height");
                if (block_height) {
                    scan_bitcoin_transactions(rd, api_data, rdo, block_height);
                    return
                }
            }
            handle_scan_failure(null, rd, api_data, rdo);
        }).fail(scan_fail(rd, api_data, rdo))
        .always(function() {
            update_api_source(rdo, api_data);
        });
}

// Executes address-based transaction scanning or single transaction polling with UI state management
function scan_bitcoin_transactions(rd, api_data, rdo, block_height) {
    if (rdo.pending === "scanning") {
        run_address_scan_chained(rd, api_data, rdo, {
            "first_request": {
                "api": "blockchain.info",
                "search": rd.currencysymbol + "/address/" + rd.address + "/transactions?limit=40&offset=0",
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            },
            "first_extract": (address_data) => is_array(address_data) ? address_data.map(item => item.txid).join(",") : null,
            "second_request_builder": (tx_ids, rd, rdo) => ({
                "api": "blockchain.info",
                "search": rd.currencysymbol + "/transactions?txids=" + tx_ids,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            }),
            "second_extract": (tx_data) => tx_data,
            "parse": (tx, rd, rdo) => blockchaininfo_scan_data(tx, rdo.setconfirmations, rd.currencysymbol, rd.address, block_height),
            "match": (parsed_tx, _tx, _rd, rdo) => parsed_tx.transactiontime > rdo.request_timestamp && parsed_tx.ccval
        });
        return
    }
    if (rdo.pending === "polling") {
        if (rd.txhash) {
            run_tx_poll(rd, api_data, rdo, {
                "request": {
                    "api": "blockchain.info",
                    "search": rd.currencysymbol + "/transaction/" + rd.txhash,
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "params": {
                        "method": "GET"
                    }
                },
                "parse": (api_result, rd, rdo) => blockchaininfo_scan_data(api_result, rdo.setconfirmations, rd.currencysymbol, rd.address, block_height)
            });
        }
    }
}

// Processes BlockCypher API transactions with support for confirmed and unconfirmed transaction scanning and polling
function process_blockcypher_transactions(rd, api_data, rdo) {
    if (rdo.pending === "scanning") {
        run_address_scan(rd, api_data, rdo, {
            "request": {
                "api": "blockcypher",
                "search": rd.currencysymbol + "/main/addrs/" + rd.address,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            },
            "extract": (api_result) => {
                const confirmed_txs = api_result.txrefs,
                    unconfirmed_txs = api_result.unconfirmed_txrefs;
                return (unconfirmed_txs && confirmed_txs) ? unconfirmed_txs.concat(confirmed_txs) : confirmed_txs || unconfirmed_txs;
            },
            "parse": (tx, rd, rdo) => blockcypher_scan_data(tx, rdo.setconfirmations, rd.currencysymbol, rd.payment),
            "tx_filter": (tx) => !tx.spent, // filter outgoing transactions
            "match": (parsed_tx, _tx, _rd, rdo) => parsed_tx.ccval && parsed_tx.transactiontime > rdo.request_timestamp
        });
        return
    }
    if (rdo.pending === "polling") { // poll transaction id
        if (rd.txhash) {
            run_tx_poll(rd, api_data, rdo, {
                "request": {
                    "api": "blockcypher",
                    "search": rd.currencysymbol + "/main/txs/" + rd.txhash,
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "params": {
                        "method": "GET"
                    }
                },
                "parse": (api_result, rd, rdo) => blockcypher_poll_data(api_result, rdo.setconfirmations, rd.currencysymbol, rd.address)
            });
        }
    }
}

// Processes Nimiq transactions through nimiq.watch and nimiqscan.com APIs with transaction filtering and confirmation tracking
function process_nimiq_transactions(rd, api_data, rdo) {
    const api_name = api_data.name;
    if (rdo.pending === "scanning") {
        if (api_name === "nimiq.watch") {
            run_address_scan(rd, api_data, rdo, {
                "request": {
                    "api": "nimiq.watch",
                    "search": "account-transactions/" + rd.address,
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "params": {
                        "method": "GET"
                    }
                },
                "extract": (api_result) => api_result, // top-level array
                // nimiq.watch returns SEND-side and RECEIVE-side txs in one list; filter to incoming
                "tx_filter": (tx, rd) => tx.receiver_address.replace(/\s/g, "") === rd.address,
                "parse": (tx, _rd, rdo) => nimiq_scan_data(tx, rdo.setconfirmations),
                "match": (parsed_tx, _tx, _rd, rdo) => parsed_tx.transactiontime > rdo.request_timestamp && parsed_tx.ccval
            });
            return
        }
        handle_scan_failure(null, rd, api_data, rdo);
        return
    }
    if (rdo.pending === "polling") {
        const nimiq_hash = rd.txhash;
        if (nimiq_hash) {
            if (api_name === "nimiqscan.com") {
                run_tx_poll(rd, api_data, rdo, {
                    "request": {
                        "api": "nimiqscan.com",
                        "cachetime": rdo.cachetime,
                        "cachefolder": "1h",
                        "params": {
                            "method": "POST",
                            "data": {
                                "jsonrpc": "2.0",
                                "id": 1,
                                "method": "getTransactionByHashEnriched",
                                "params": [nimiq_hash]
                            }
                        }
                    },
                    // Treat a missing hash (or missing deep result) as a failure,
                    // so the fallback API cascade gets triggered (preserves original behavior).
                    "error_check": (api_result) => api_result?.result?.data?.hash ? false : "transaction not found",
                    "parse": (api_result, _rd, rdo) => nimiqscan_scan_data(api_result.result.data, rdo.setconfirmations)
                });
                return
            }
            if (api_name === "nimiq.watch") {
                run_tx_poll(rd, api_data, rdo, {
                    "request": {
                        "api": api_name,
                        "search": "transaction/" + nimiq_hash,
                        "cachetime": rdo.cachetime,
                        "cachefolder": "1h",
                        "params": {
                            "method": "GET"
                        }
                    },
                    "parse": (api_result, _rd, rdo) => nimiq_scan_data(api_result, rdo.setconfirmations)
                });
                return
            }
        }
    }
}

// Routes Kaspa API requests between address polling and transaction scanning with bluescore verification
function initialize_kaspa_scan(rd, api_data, rdo) {
    if (rdo.source === "addr_polling") {
        scan_kaspa_transactions(rd, api_data, rdo, false);
        return
    }
    kaspa_fetch_blockheight(rd, api_data, rdo);
}

// Fetches current Kaspa network bluescore for transaction confirmation calculation
function kaspa_fetch_blockheight(rd, api_data, rdo) {
    api_proxy({
            "api": "kaspa.org",
            "search": "info/virtual-chain-blue-score",
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        }).done(function(block_response) {
            const block_data = br_result(block_response);
            if (block_data) {
                const blue_score = q_obj(block_data, "result.blueScore");
                if (blue_score) {
                    scan_kaspa_transactions(rd, api_data, rdo, blue_score);
                    return
                }
            }
            handle_scan_failure(null, rd, api_data, rdo);
        }).fail(scan_fail(rd, api_data, rdo))
        .always(function() {
            update_api_source(rdo, api_data);
        });
}

// Processes Kaspa transactions through kaspa.org and kas.fyi APIs with address validation and bluescore confirmation
function scan_kaspa_transactions(rd, api_data, rdo, blue_score) {
    const api_name = api_data.name;
    if (rdo.pending === "scanning") {
        run_address_scan(rd, api_data, rdo, {
            "request": {
                "api": "kaspa.org",
                "search": "addresses/" + rd.address + "/full-transactions",
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "proxy": true,
                "params": {
                    "method": "GET"
                }
            },
            "extract": (api_result) => api_result, // kaspa returns the tx array directly at top level
            "parse": (tx, rd, rdo) => kaspa_scan_data(tx, rd.address, rdo.setconfirmations, blue_score),
            "match": (parsed_tx, _tx, _rd, rdo) => parsed_tx.transactiontime > rdo.request_timestamp && parsed_tx.ccval
        });
        return
    }
    if (rdo.pending === "polling") {
        if (rd.txhash) {
            run_tx_poll(rd, api_data, rdo, {
                "request": {
                    "api": api_name,
                    "search": "transactions/" + rd.txhash,
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "params": {
                        "method": "GET"
                    }
                },
                "parse": (api_result, rd, rdo) => (api_name === "kaspa.org") ?
                    kaspa_scan_data(api_result, rd.address, rdo.setconfirmations, blue_score) : kaspa_poll_fyi_data(api_result, rd.address, rdo.setconfirmations)
            });
        }
    }
}

// Manages Dash transaction processing via Insight API with incoming payment scanning and confirmation tracking
function process_dash_transactions(rd, api_data, rdo) {
    if (rdo.pending === "scanning") {
        run_address_scan(rd, api_data, rdo, {
            "request": {
                "api": "dash.org",
                "search": "txs?address=" + rd.address,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            },
            "extract": (api_result) => api_result.txs,
            "parse": (tx, rd, rdo) => insight_scan_data(tx, rdo.setconfirmations, rd.address),
            "match": (parsed_tx, _tx, _rd, rdo) => parsed_tx.transactiontime > rdo.request_timestamp && parsed_tx.ccval
        });
        return
    }
    if (rdo.pending === "polling") {
        if (rd.txhash) {
            run_tx_poll(rd, api_data, rdo, {
                "request": {
                    "api": "dash.org",
                    "search": "tx/" + rd.txhash,
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "params": {
                        "method": "GET"
                    }
                },
                "parse": (api_result, rd, rdo) => insight_scan_data(api_result, rdo.setconfirmations, rd.address)
            });
        }
    }
}

// ** RPC Interactions: **

// Get the current block height
function current_block_height(rd, api_data, rdo) {
    const api_name = api_data.name;
    if (api_name === "electrum") {
        electrum_rpc_init(rd, api_data, rdo);
        return
    }
    if (api_name === "blockchain.info") {
        initialize_bitcoin_scan(rd, api_data, rdo);
        return
    }
    mempoolspace_rpc_init(rd, api_data, rdo, true);
}

// Routes Electrum server API requests between address polling and block height verification for Bitcoin transactions
function electrum_rpc_init(rd, api_data, rdo) {
    const source = rdo.source;
    if (source === "addr_polling" || source === "post_scan") {
        electrum_rpc(rd, api_data, rdo);
        return
    }
    electrum_rpc_blockheight(rd, api_data, rdo);
}

// Fetches current Bitcoin block height from Electrum servers for confirmation calculations
function electrum_rpc_blockheight(rd, api_data, rdo) {
    const rpc_url = api_data.url;
    api_proxy({ // get latest blockheight
        "api": rd.payment,
        "cachetime": rdo.cachetime,
        "cachefolder": "1h",
        "custom": "electrum",
        "api_url": rpc_url,
        "proxy": true,
        "params": {
            "method": "POST",
            "data": {
                "id": "blockheight",
                "method": "blockchain.headers.subscribe",
                "node": rpc_url
            }
        }
    }).done(function(response) {
        const api_result = br_result(response)?.result;
        let latest_block = null;
        if (api_result) {
            latest_block = api_result.height;
            if (latest_block) {
                electrum_rpc(rd, api_data, rdo, latest_block);
                return
            }
        }
        mempoolspace_rpc_blockheight(rd, api_data, rdo);
    }).fail(function(xhr, stat, err) {
        mempoolspace_rpc_blockheight(rd, api_data, rdo);
    }).always(function() {
        update_api_source(rdo, api_data);
    });
}

// Processes Electrum transactions via RPC with support for account scanning and block verification
function electrum_rpc(rd, api_data, rdo, latest_block) {
    const script_pub = address_to_scripthash(rd.address, rd.payment),
        script_hash = script_pub.hash,
        script_pub_key = script_pub.script_pub_key;
    if (rdo.pending === "scanning") {
        if (rdo.source === "addr_polling" || rdo.source === "post_scan") {
            electrum_addr_poll_scan(rd, api_data, rdo, latest_block, script_hash, script_pub_key);
            return
        }
        electrum_history_scan(rd, api_data, rdo, latest_block, script_hash, script_pub_key);
        return
    }
    if (rdo.pending === "polling") {
        electrum_tx_poll(rd, api_data, rdo, latest_block, script_hash, script_pub_key);
    }
}

// Electrum history scan (foreground request scan). Single fetch, iterate, match.
function electrum_history_scan(rd, api_data, rdo, latest_block, script_hash, script_pub_key) {
    const rpc_url = api_data.url;
    run_address_scan(rd, api_data, rdo, {
        "request": {
            "api": rd.payment,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "custom": "electrum",
            "api_url": rpc_url,
            "proxy": true,
            "params": {
                "method": "POST",
                "data": {
                    "id": "scanning",
                    "method": "blockchain.scripthash.get_history",
                    "ref": script_hash,
                    "node": rpc_url
                }
            }
        },
        // Original normalised single-tx responses to a one-element array.
        "extract": (api_result) => api_result.tx_hash ? [api_result] : api_result,
        "parse": (tx, rd, rdo) => electrum_scan_data(tx, rdo.setconfirmations, rd.currencysymbol, script_pub_key, latest_block),
        "match": (parsed_tx, _tx, _rd, rdo) => parsed_tx.transactiontime > rdo.request_timestamp && parsed_tx.ccval
    });
}

// Electrum addr_polling scan.
function electrum_addr_poll_scan(rd, api_data, rdo, latest_block, script_hash, script_pub_key) {
    const currency = rd.payment,
        rpc_url = api_data.url,
        cachetime = rdo.cachetime;
    let matched_tx = false;
    api_proxy({
            "api": currency,
            cachetime,
            "cachefolder": "1h",
            "custom": "electrum",
            "api_url": rpc_url,
            "proxy": true,
            "params": {
                "method": "POST",
                "data": {
                    "id": "scanning",
                    "method": "blockchain.scripthash.get_mempool",
                    "ref": script_hash,
                    "node": rpc_url
                }
            }
        }).done(function(response) {
            const api_result = br_result(response)?.result;
            if (api_result) {
                if (api_result.error) {
                    handle_scan_failure({
                        "error": api_result.error
                    }, rd, api_data, rdo);
                    return
                }
                if (empty_obj(api_result)) {
                    glob_let.tx_count = 0;
                    process_scan_results(rd, api_data, rdo, matched_tx);
                    return
                }
                const glob_tx_count = glob_let.tx_count,
                    tx_count = api_result.length;
                if (tx_count > glob_let.tx_count) { // new tx detected
                    const latest_tx = api_result[0].tx_hash;
                    api_proxy({
                            "api": currency,
                            cachetime,
                            "cachefolder": "1h",
                            "custom": "electrum",
                            "api_url": rpc_url,
                            "proxy": true,
                            "params": {
                                "method": "POST",
                                "data": {
                                    "id": "scanning",
                                    "method": "blockchain.transaction.get",
                                    "ref": latest_tx,
                                    "node": rpc_url
                                }
                            }
                        }).done(function(e) {
                            const tx_result = br_result(e),
                                res = q_obj(tx_result, "result");
                            if (res) {
                                const parsed_tx = electrum_scan_data(res, rdo.setconfirmations, rd.currencysymbol, script_pub_key, latest_block, latest_tx);
                                if (parsed_tx.ccval) {
                                    matched_tx = parsed_tx;
                                }
                                process_scan_results(rd, api_data, rdo, matched_tx);
                                return
                            }
                            handle_scan_failure(null, rd, api_data, rdo);
                        }).fail(scan_fail(rd, api_data, rdo))
                        .always(function() {
                            update_api_source(rdo, api_data);
                        });
                    return
                }
                if (glob_tx_count === 1000000) {
                    glob_let.tx_count = tx_count;
                }
                return // intentional early-return without process_scan_results — see header comment
            }
            handle_scan_failure(null, rd, api_data, rdo);
        }).fail(scan_fail(rd, api_data, rdo))
        .always(function() {
            update_api_source(rdo, api_data);
        });
}

// Electrum single-tx poll.
function electrum_tx_poll(rd, api_data, rdo, latest_block, script_hash, script_pub_key) {
    const rpc_url = api_data.url;
    run_tx_poll(rd, api_data, rdo, {
        "request": {
            "api": rd.payment,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "custom": "electrum",
            "api_url": rpc_url,
            "proxy": true,
            "params": {
                "method": "POST",
                "data": {
                    "id": "polling",
                    "tx_hash": rd.txhash,
                    "method": "blockchain.scripthash.get_history",
                    "ref": script_hash,
                    "node": rpc_url
                }
            }
        },
        "parse": (api_result, rd, rdo) => electrum_scan_data(api_result, rdo.setconfirmations, rd.currencysymbol, script_pub_key, latest_block, rd.txhash)
    });
}

// Routes mempool.space API requests between address polling and block height verification for Bitcoin transactions
function mempoolspace_rpc_init(rd, api_data, rdo, rpc) {
    if (rdo.source === "addr_polling") {
        mempoolspace_rpc(rd, api_data, rdo, rpc, false);
        return
    }
    mempoolspace_rpc_blockheight(rd, api_data, rdo, rpc);
}

// Fetches current Bitcoin block height from mempool.space API for confirmation calculations
function mempoolspace_rpc_blockheight(rd, api_data, rdo, rpc) {
    const currency = rd.payment,
        btc_base = glob_const.mempool_space[currency];
    if (!btc_base) {
        mempoolspace_blockheight_fails(rd, api_data, rdo, rpc);
        return
    }
    const api_url = api_data.url,
        base_url = rpc ? api_url : btc_base,
        api_name = api_data.name;
    let block_height = null;
    api_proxy({ // get latest blockheight
        "api_url": base_url + "/api/blocks/tip/height",
        "proxy": base_url.includes(".onion"),
        "params": {
            "method": "GET"
        }
    }).done(function(response) {
        const api_result = br_result(response)?.result;
        if (api_result) {
            if (!api_result.error) {
                block_height = api_result;
            }
        }
        if (api_name === "electrum") {
            electrum_rpc(rd, api_data, rdo, block_height);
            return
        }
        mempoolspace_rpc(rd, api_data, rdo, rpc, block_height);
    }).fail(function(xhr, stat, err) {
        mempoolspace_blockheight_fails(rd, api_data, rdo, rpc);
    }).always(function() {
        update_api_source(rdo, api_data);
    });
}

function mempoolspace_blockheight_fails(rd, api_data, rdo, rpc) {
    if (api_data.name === "electrum") {
        electrum_rpc(rd, api_data, rdo);
        return
    }
    mempoolspace_rpc(rd, api_data, rdo, rpc);
}

// Processes Bitcoin transactions through mempool.space API with transaction filtering and block height validation
function mempoolspace_rpc(rd, api_data, rdo, rpc, latest_block) {
    const api_url = api_data.url,
        base_url = rpc ? api_url : "https://" + api_url,
        is_onion = base_url.includes(".onion");
    setTimeout(function() {
        if (rdo.pending === "scanning") {
            run_address_scan(rd, api_data, rdo, {
                "request": {
                    "api_url": base_url + "/api/address/" + rd.address + "/txs",
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "proxy": is_onion,
                    "params": {
                        "method": "GET"
                    }
                },
                "extract": (api_result) => api_result, // top-level array
                "tx_filter": (tx) => !!tx.txid, // filter outgoing transactions (original: if (tx.txid))
                "parse": (tx, rd, rdo) => mempoolspace_scan_data(tx, rdo.setconfirmations, rd.currencysymbol, rd.address, latest_block),
                "match": (parsed_tx, _tx, _rd, rdo) => parsed_tx.transactiontime > rdo.request_timestamp && parsed_tx.ccval
            });
            return
        }
        run_tx_poll(rd, api_data, rdo, {
            "request": {
                "api_url": base_url + "/api/tx/" + rd.txhash,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "proxy": is_onion,
                "params": {
                    "method": "GET"
                }
            },
            "parse": (api_result, rd, rdo) => mempoolspace_scan_data(api_result, rdo.setconfirmations, rd.currencysymbol, rd.address, latest_block)
        });
    }, 500);
}

// Manages Ethereum and ERC20 transaction processing via RPC with multi-chain support and confirmation tracking
function infura_txd_rpc(rd, api_data, rdo, contract, chainid) {
    const network_type = api_data.network;
    if (rdo.pending === "scanning") {
        const coin_config = get_coinsettings(rd.payment);
        if (network_type) { // switch to default (alchemy) txdata
            const selected_api = q_obj(coin_config, "layer2.options." + network_type + ".apis.selected");
            if (selected_api) {
                const network_name = selected_api.name;
                if (network_name === "alchemy") {
                    initialize_alchemy_scan(rd, selected_api, rdo, contract);
                    return
                }
                scan_layer2_transactions(rd, selected_api, rdo, contract, chainid || 1);
                return
            }
            handle_scan_failure(null, rd, api_data, rdo, network_type);
            return
        }
        const selected_api = q_obj(coin_config, "apis.selected");
        if (selected_api) {
            if (rd.erc20) {
                process_ethereum_transactions(rd, selected_api, rdo);
                return
            }
            scan_layer2_transactions(rd, selected_api, rdo, null, 1);
            return
        }
        handle_scan_failure(null, rd, api_data, rdo, network_type);
        return
    }
    const current_list = rdo.thislist,
        tx_list = rdo.transactionlist,
        status_panel = rdo.statuspanel,
        rpc_url = build_rpc_endpoint_url(api_data),
        node_url = network_type ? api_data.url : rpc_url || glob_const.main_eth_node,
        tx_hash = rd.txhash;
    if (!node_url) { // L2 node not resolved yet (cold load) — fail over instead of building a dead request
        handle_scan_failure(null, rd, api_data, rdo, network_type);
        return
    }
    let matched_tx = false;
    api_proxy(eth_params(node_url, 25, "eth_blockNumber", [])).done(function(block_response) {
            const latest_block = inf_result(block_response);
            api_proxy(eth_params(node_url, 25, "eth_getTransactionByHash", [tx_hash])).done(function(tx_response) {
                const tx_data = inf_result(tx_response);
                if (tx_data) {
                    const block_number = tx_data.blockNumber;
                    api_proxy(eth_params(node_url, 25, "eth_getBlockByNumber", [block_number, false])).done(function(block_info_response) {
                        const block_info = inf_result(block_info_response);
                        if (block_info) {
                            const tx_block_num = Number(block_number),
                                current_block_num = latest_block ? Number(latest_block) : false,
                                confirmations = current_block_num ? current_block_num - tx_block_num : -1,
                                confirmation_count = confirmations < 0 ? 0 : confirmations;
                            let parsed_tx = null;
                            if (rd.erc20 === true) {
                                const tx_input = tx_data.input;
                                if (str_match(tx_input, rd.address.slice(3)) === true) {
                                    const method_signature = tx_input.slice(2, 10),
                                        recipient_hex = tx_input.slice(10, 74),
                                        amount_hex = tx_input.slice(74),
                                        token_value = hex_to_number_string(amount_hex),
                                        token_data = {
                                            "timestamp": block_info.timestamp,
                                            "hash": tx_hash,
                                            "confirmations": confirmation_count,
                                            "value": token_value,
                                            "decimals": rd.decimals
                                        };
                                    parsed_tx = infura_erc20_poll_data(token_data, rdo.setconfirmations, rd.currencysymbol, network_type);
                                } else {
                                    handle_scan_failure(null, rd, api_data, rdo, network_type);
                                    return
                                }
                            } else {
                                const eth_data = {
                                    "timestamp": Number(block_info.timestamp),
                                    "hash": tx_hash,
                                    "confirmations": confirmation_count,
                                    "value": Number(tx_data.value)
                                };
                                parsed_tx = infura_eth_poll_data(eth_data, rdo.setconfirmations, rd.currencysymbol, network_type);
                            }
                            if (parsed_tx.ccval) {
                                matched_tx = parsed_tx;
                                if (rdo.source === "requests") {
                                    const tx_item = create_transaction_item(parsed_tx);
                                    if (tx_item) {
                                        tx_list.append(tx_item.data(parsed_tx));
                                    }
                                }
                            }
                            process_scan_results(rd, api_data, rdo, matched_tx);
                            return
                        }
                        handle_scan_failure(null, rd, api_data, rdo, network_type);
                    }).fail(scan_fail(rd, api_data, rdo, network_type));
                    return
                }
                handle_scan_failure(null, rd, api_data, rdo, network_type);
            }).fail(scan_fail(rd, api_data, rdo, network_type));
        }).fail(scan_fail(rd, api_data, rdo, network_type))
        .always(function() {
            update_api_source(rdo, api_data);
        });
}

// Function to construct RPC URL with optional authentication
function build_rpc_endpoint_url(rpc_data) {
    if (rpc_data === false) {
        return false;
    }
    const url = rpc_data.url,
        username = rpc_data.username,
        password = rpc_data.password,
        login_param = (username && password) ? username + ":" + password + "@" : "",
        hasprefix = url.includes("http"),
        urlsplit = hasprefix ? url.split("://") : url;
    return hasprefix ? urlsplit[0] + "://" + login_param + urlsplit[1] : url;
}

// Constructs RPC request parameters with support for multiple Ethereum node providers
function eth_params(node_url, cache_time, method, params) {
    const request_payload = {
        "cachetime": cache_time,
        "cachefolder": "1h",
        "params": {
            "method": "POST",
            "data": {
                "jsonrpc": "2.0",
                "id": 1,
                "method": method,
                "params": params
            },
            "headers": {
                "Content-Type": "application/json"
            }
        }
    }
    if (node_url === glob_const.main_eth_node) {
        $.extend(request_payload, {
            "api": "infura"
        });
    } else if (node_url === glob_const.main_arbitrum_node) {
        $.extend(request_payload, {
            "api": "arbitrum one"
        });
    } else if (node_url === glob_const.main_polygon_node) {
        $.extend(request_payload, {
            "api": "polygon pos"
        });
    } else if (node_url === glob_const.main_bnb_node) {
        $.extend(request_payload, {
            "api": "binance smart chain"
        });
    } else {
        $.extend(request_payload, {
            "api_url": node_url,
            "proxy": false
        });
    }
    return request_payload;
}

// Extracts nested result data from Ethereum RPC JSON responses
function inf_result(response) {
    const rpc_result = br_result(response)?.result;
    if (rpc_result) {
        return rpc_result.result;
    }
    return false
}

// ** Nano RPC **

// Processes Nano transactions via RPC with support for account scanning and block verification
function nano_rpc(rd, api_data, rdo) {
    if (rdo.pending === "scanning") {
        run_address_scan(rd, api_data, rdo, {
            "request": {
                "api": "nano",
                "search": "account",
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "custom": "nano_txd",
                "api_url": api_data.url,
                "proxy": true,
                "params": {
                    "method": "POST",
                    "data": {
                        "account": rd.address,
                        "node": api_data.url
                    }
                }
            },
            "extract": (api_result) => api_result, // top-level array
            "parse": (tx) => nano_scan_data(tx),
            "match": (parsed_tx, tx, _rd, rdo) =>
                parsed_tx.transactiontime > (rdo.request_timestamp - 10000) &&
                parsed_tx.ccval &&
                (tx.subtype === "receive" || tx.receivable)
        });
        return
    }
    if (rdo.pending === "polling") {
        run_tx_poll(rd, api_data, rdo, {
            "request": {
                "api": "nano",
                "search": "block",
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "api_url": api_data.url,
                "params": {
                    "method": "POST",
                    "data": {
                        "action": "block_info",
                        "json_block": true,
                        "hash": rd.txhash
                    }
                }
            },
            "parse": (api_result, rd, _rdo) => nano_scan_data(api_result, rd.txhash)
        });
    }
}

// Standard .fail callback for scanner api_proxy chains.
function scan_fail(rd, api_data, rdo, network) {
    return function(xhr, stat, err) {
        const is_proxy_error = is_proxy_fail(this.url),
            error_data = xhr || stat || err;
        handle_scan_failure({
            "error": error_data,
            "is_proxy": is_proxy_error
        }, rd, api_data, rdo, network);
    };
}

// Generic scanner runner.
function run_address_scan(rd, api_data, rdo, opts) {
    const tx_list = rdo.transactionlist,
        source = rdo.source,
        network = opts.network || false,
        current_list = rdo.thislist;
    let matched_tx = false;
    api_proxy(opts.request).done(function(response) {
            const api_result = br_result(response)?.result;
            if (api_result) {
                const err = opts.error_check ? opts.error_check(api_result) : api_result.error;
                if (err) {
                    handle_scan_failure({
                        "error": err
                    }, rd, api_data, rdo, network);
                    return
                }
                const transactions = opts.extract(api_result);
                if (transactions) {
                    if (has_tx(transactions)) {
                        // Filter raw txs first (cheaper than parsing then discarding).
                        const filtered = opts.tx_filter ? transactions.filter(tx => opts.tx_filter(tx, rd, rdo)) : transactions,
                            entries = filtered.map(tx => ({
                                tx,
                                "parsed": opts.parse(tx, rd, rdo, api_result)
                            }));
                        entries.sort((a, b) => (b.parsed?.transactiontime || 0) - (a.parsed?.transactiontime || 0));
                        const should_break = opts.break_on_match ? opts.break_on_match(rd, rdo) : false;
                        $.each(entries, function(i, entry) {
                            const parsed_tx = entry.parsed;
                            if (parsed_tx && opts.match(parsed_tx, entry.tx, rd, rdo)) {
                                matched_tx = parsed_tx;
                                if (source === "requests") {
                                    if (opts.display_on_match) {
                                        display_api_source(current_list, api_data); // !!overwrite
                                    }
                                    const tx_item = create_transaction_item(parsed_tx);
                                    if (tx_item) tx_list.append(tx_item.data(parsed_tx));
                                    if (should_break) return false;
                                } else {
                                    return false;
                                }
                            }
                        });
                    }
                    process_scan_results(rd, api_data, rdo, matched_tx, network);
                    return
                }
            }
            handle_scan_failure(null, rd, api_data, rdo, network);
        }).fail(scan_fail(rd, api_data, rdo, network))
        .always(function() {
            update_api_source(rdo, api_data);
        });
}

// Like run_address_scan but does two sequential fetches:
//   1. first_request → first_extract returns a list of identifiers (e.g. tx_ids)
//   2. second_request_builder(ids, rd, rdo) → second_extract returns the actual tx array
// Used by bitcoin (blockchain.info) scanner. Parse-then-sort like run_address_scan.
function run_address_scan_chained(rd, api_data, rdo, opts) {
    const tx_list = rdo.transactionlist,
        source = rdo.source,
        network = opts.network || false,
        current_list = rdo.thislist;
    let matched_tx = false;
    api_proxy(opts.first_request).done(function(first_response) {
            const first_result = br_result(first_response)?.result;
            if (first_result) {
                const err = opts.first_error_check ? opts.first_error_check(first_result) : first_result.error;
                if (err) {
                    handle_scan_failure({
                        "error": err
                    }, rd, api_data, rdo, network);
                    return
                }
                const ids = opts.first_extract(first_result);
                if (!ids) {
                    handle_scan_failure(null, rd, api_data, rdo, network);
                    return
                }
                api_proxy(opts.second_request_builder(ids, rd, rdo)).done(function(second_response) {
                    const second_result = br_result(second_response)?.result;
                    if (second_result) {
                        const transactions = opts.second_extract(second_result);
                        if (transactions) {
                            if (has_tx(transactions)) {
                                const filtered = opts.tx_filter ? transactions.filter(tx => opts.tx_filter(tx, rd, rdo)) : transactions,
                                    entries = filtered.map(tx => ({
                                        tx,
                                        "parsed": opts.parse(tx, rd, rdo, second_result)
                                    }));
                                entries.sort((a, b) => (b.parsed?.transactiontime || 0) - (a.parsed?.transactiontime || 0));
                                $.each(entries, function(i, entry) {
                                    const parsed_tx = entry.parsed;
                                    if (parsed_tx && opts.match(parsed_tx, entry.tx, rd, rdo)) {
                                        matched_tx = parsed_tx;
                                        if (source === "requests") {
                                            if (opts.display_on_match) {
                                                display_api_source(current_list, api_data); // !!overwrite
                                            }
                                            const tx_item = create_transaction_item(parsed_tx);
                                            if (tx_item) tx_list.append(tx_item.data(parsed_tx));
                                        } else {
                                            return false;
                                        }
                                    }
                                });
                            }
                            process_scan_results(rd, api_data, rdo, matched_tx, network);
                            return
                        }
                    }
                    handle_scan_failure(null, rd, api_data, rdo, network);
                }).fail(scan_fail(rd, api_data, rdo, network));
            } else {
                handle_scan_failure(null, rd, api_data, rdo, network);
            }
        }).fail(scan_fail(rd, api_data, rdo, network))
        .always(function() {
            update_api_source(rdo, api_data);
        });
}

// Runs a single-tx poll: fetches one transaction by hash, normalizes it,
function run_tx_poll(rd, api_data, rdo, opts) {
    const tx_list = rdo.transactionlist,
        source = rdo.source,
        network = opts.network || false,
        current_list = rdo.thislist;
    let matched_tx = false;
    api_proxy(opts.request).done(function(response) {
            const api_result = br_result(response)?.result;
            if (api_result) {
                const err = opts.error_check ? opts.error_check(api_result) : api_result.error;
                if (err) {
                    handle_scan_failure({
                        "error": err
                    }, rd, api_data, rdo, network);
                    return
                }
                const parsed_tx = opts.parse(api_result, rd, rdo);
                if (parsed_tx && parsed_tx.ccval) {
                    matched_tx = parsed_tx;
                    if (source === "requests") {
                        if (opts.display_on_match) {
                            display_api_source(current_list, api_data); // !!overwrite
                        }
                        const tx_item = create_transaction_item(parsed_tx);
                        if (tx_item) tx_list.append(tx_item.data(parsed_tx));
                    }
                }
                process_scan_results(rd, api_data, rdo, matched_tx, network);
                return
            }
            handle_scan_failure(null, rd, api_data, rdo, network);
        }).fail(scan_fail(rd, api_data, rdo, network))
        .always(function() {
            update_api_source(rdo, api_data);
        });
}

// ** Transaction Data Processing: **

// Sorts transaction list by date in descending order using custom processing function
function sort_transactions_by_date(process_func, tx_list) {
    return $(tx_list).sort(function(tx_a, tx_b) {
        const time_a = process_func(tx_a, "sort"),
            time_b = process_func(tx_b, "sort");
        return time_b - time_a; // descending order
    });
}

// Calculates total output value for transactions by processing multiple outputs with custom value handler
function calculate_total_outputs(outputs, address, value_processor) {
    if (!outputs) return null;
    let total_output = 0;
    $.each(outputs, function(index, output) {
        const output_value = value_processor(output, address);
        total_output += parseFloat(output_value) || 0;
    });
    return total_output;
}

// Converts and normalizes transaction timestamps with optional UTC conversion
function normalize_timestamp(ts) {
    if (ts) {
        const ts_int = to_integer(ts);
        if (ts_int) {
            return timestamp_ms(ts_int) - 3000; // 3 second margin for mempool / current timestamps
        }
    }
    return now_utc() - 3000;
}

// Converts timestamp to millisecondss
function timestamp_ms(ts) {
    return (is_milliseconds(ts)) ? ts : ts * 1000;
}

// Computes blockchain confirmation count with validation against latest block height
function get_block_confirmations(tx_block, current_height) {
    // Return 0 if either parameter is missing or invalid
    if (!tx_block || !current_height || tx_block < 0 || current_height < 0) {
        return 0;
    }
    // Ensure tx_block isn't ahead of current_height
    if (tx_block > current_height) {
        return 0;
    }
    // Calculate confirmations
    return current_height - tx_block + 1;
}

// Provides standardized transaction data structure with null values and default flags
function default_tx_data() {
    return {
        "ccval": null,
        "transactiontime": null,
        "txhash": null,
        "confirmations": 0,
        "setconfirmations": false,
        "double_spend": false,
        "instant_lock": false,
        "ccsymbol": null
    };
}

// ** Blockchain-Specific Data Handlers: **

// Processes blockchain.info websocket transaction data with legacy address support
function blockchain_ws_data(data, setconfirmations, ccsymbol, address, legacy) {
    function process_value(output, target_addr) {
        const output_addr = output.addr;
        return str_match(output_addr, target_addr) ||
            str_match(output_addr, "bitcoincash:" + target_addr) ||
            str_match(output_addr, legacy) ?
            output.value || 0 : 0;
    }
    const total_output = calculate_total_outputs(data.out, address, process_value),
        transactiontime = normalize_timestamp(data.time);
    return {
        "ccval": total_output ? total_output / 1e8 : null,
        transactiontime,
        "txhash": data.hash,
        "confirmations": data.confirmations || 0,
        setconfirmations,
        ccsymbol
    };
}

// Processes mempool.space websocket transaction data with scriptpubkey address validation
function mempoolspace_ws_data(data, setconfirmations, ccsymbol, address) {
    function process_value(output, target_addr) {
        return str_match(output.scriptpubkey_address, target_addr) ? output.value || 0 : 0;
    }
    const total_output = calculate_total_outputs(data.vout, address, process_value),
        transactiontime = normalize_timestamp(data.firstSeen);
    return {
        "ccval": total_output ? total_output / 1e8 : null,
        transactiontime,
        "txhash": data.txid,
        "confirmations": data.confirmations || 0,
        setconfirmations,
        ccsymbol
    };
}

// Processes mempool.space transaction data with block height confirmation calculation
function mempoolspace_scan_data(data, setconfirmations, ccsymbol, address, latest_block) {
    const status = data.status,
        transactiontime = normalize_timestamp(status.block_time);

    function process_value(output, target_addr) {
        return str_match(output.scriptpubkey_address, target_addr) ? output.value || 0 : 0;
    }
    const total_output = calculate_total_outputs(data.vout, address, process_value),
        height = status.block_height,
        min_confs = status.confirmed ? 1 : 0,
        confirmations = (height && latest_block) ? get_block_confirmations(status.block_height, latest_block) : min_confs || height || 0;
    return {
        "ccval": total_output ? total_output / 1e8 : null,
        transactiontime,
        "txhash": data.txid,
        confirmations,
        setconfirmations,
        ccsymbol
    };
}

// Processes Electrum transaction data
function electrum_scan_data(data, setconfirmations, ccsymbol, script_pub, latest_block, tx_hash) {
    const outputs = data.outputs,
        height = data.height || 0,
        timestamp = data.timestamp,
        now = now_utc(),
        now_correction = parseInt(now / 1000) - 8640,
        time_correction = timestamp < now_correction ? now : timestamp, // correct weird timestamp in mempool with current timestamp
        transactiontime = normalize_timestamp(time_correction) - 3000,
        confirmations = latest_block ? get_block_confirmations(height, latest_block) : height;
    let outputsum = 0;
    if (outputs) {
        $.each(outputs, function(dat, value) {
            if (value.scriptPubKey === script_pub) {
                outputsum += value.amount || 0; // sum of outputs
            }
        });
    }
    return {
        "ccval": (outputsum) ? outputsum / 100000000 : null,
        transactiontime,
        "txhash": tx_hash || data.tx_hash,
        confirmations,
        setconfirmations,
        ccsymbol
    };
}

// Processes BlockCypher transaction data with ETH/non-ETH value scaling and hash formatting
function blockcypher_scan_data(data, setconfirmations, ccsymbol) {
    const date_key = data.confirmed || data.received || false,
        tx_timestamp = to_ts(date_key),
        transactiontime = tx_timestamp,
        is_eth = ccsymbol === "eth",
        ccval = data.value ? (is_eth ? parseFloat((data.value / 1e18).toFixed(8)) : data.value / 1e8) : null,
        tx_hash = data.tx_hash,
        formatted_hash = tx_hash && is_eth ? (tx_hash.startsWith("0x") ? tx_hash : "0x" + tx_hash) : tx_hash;
    return {
        ccval,
        transactiontime,
        "txhash": formatted_hash,
        "confirmations": data.confirmations || 0,
        setconfirmations,
        "double_spend": !!data.double_spend,
        ccsymbol
    };
}

// Processes Insight API transaction data with script pubkey validation and DASH-specific features
function insight_scan_data(data, setconfirmations, address) {
    const transactiontime = normalize_timestamp(data.time || data.blocktime),
        decoded = b58check_decode(address),
        pubkey_hash = decoded.slice(2),
        script_hex = "76a914" + pubkey_hash + "88ac";

    function process_value(output) {
        const output_script = q_obj(output, "scriptPubKey.hex");
        return str_match(script_hex, output_script) ? parseFloat(output.value) || 0 : 0;
    }
    const ccval = calculate_total_outputs(data.vout, null, process_value);
    return {
        ccval,
        transactiontime,
        "txhash": data.txid || null,
        "confirmations": data.confirmations || 0,
        setconfirmations,
        "instant_lock": !!data.txlock,
        "ccsymbol": "dash"
    };
}

// Handles BlockCypher polling data with Ethereum-specific address and value formatting
function blockcypher_poll_data(data, setconfirmations, ccsymbol, address) {
    const is_eth = ccsymbol === "eth",
        date_key = data.confirmed || data.received || false,
        tx_timestamp = to_ts(date_key),
        transactiontime = tx_timestamp;

    function process_output_value(output, target_addr) {
        const output_value = output.value;
        return (str_match(target_addr, output.addresses[0].slice(3)) === true) ? Math.abs(output_value) : 0;
    }
    const total_output = calculate_total_outputs(data.outputs, address, process_output_value),
        ccval = total_output ? (is_eth ? parseFloat((total_output / 1e18).toFixed(8)) : total_output / 1e8) : null,
        tx_hash = data.hash,
        formatted_hash = tx_hash && is_eth ? (tx_hash.startsWith("0x") ? tx_hash : "0x" + tx_hash) : tx_hash;
    return {
        ccval,
        transactiontime,
        "txhash": formatted_hash,
        "confirmations": data.confirmations || 0,
        setconfirmations,
        "double_spend": !!data.double_spend,
        ccsymbol
    };
}

// Processes blockchain.info transaction data with mempool status and confirmation calculation
function blockchaininfo_scan_data(data, setconfirmations, ccsymbol, address, latest_block) {
    const transactiontime = normalize_timestamp(data.time);

    function process_output_value(output, target_addr) {
        return str_match(output.address, target_addr) ? Math.abs(output.value) : 0;
    }
    const block_height = q_obj(data, "block.height"),
        block_confs = get_block_confirmations(block_height, latest_block),
        confirmations = q_obj(data, "block.mempool") ? 0 : block_confs,
        total_output = calculate_total_outputs(data.outputs, address, process_output_value);
    return {
        "ccval": total_output ? total_output / 1e8 : null,
        transactiontime,
        "txhash": data.txid || null,
        confirmations,
        setconfirmations,
        ccsymbol
    };
}

// Processes Blockchair transaction data with recipient validation and instant lock detection
function blockchair_scan_data(data, setconfirmations, ccsymbol, address, latest_block) {
    const tx_data = data.transaction;
    if (!tx_data) return default_tx_data();
    const tx_timestamp = parse_datetime_string(tx_data.time).getTime(),
        transactiontime = tx_timestamp;

    function process_value(output, target_addr) {
        const output_value = output.value;
        return str_match(output.recipient, target_addr) ? Math.abs(output_value) || 0 : 0;
    }
    const confirmations = get_block_confirmations(tx_data.block_id, latest_block),
        total_output = calculate_total_outputs(data.outputs, address, process_value);
    return {
        "ccval": total_output ? total_output / 1e8 : null,
        transactiontime,
        "txhash": tx_data.hash || null,
        confirmations,
        setconfirmations,
        "double_spend": false,
        "instant_lock": !!tx_data.is_instant_lock,
        ccsymbol
    };
}

// Handles Blockchair Ethereum transaction data with precise ETH value conversion
function blockchair_eth_scan_data(data, setconfirmations, ccsymbol, latest_block) {
    const tx_timestamp = parse_datetime_string(data.time).getTime(),
        transactiontime = tx_timestamp,
        ccval = data.value ? parseFloat((data.value / 1e18).toFixed(8)) : null,
        confirmations = get_block_confirmations(data.block_id, latest_block);
    return {
        ccval,
        transactiontime,
        "txhash": data.transaction_hash || null,
        confirmations,
        setconfirmations,
        "recipient": data.recipient || null,
        ccsymbol
    };
}

// Processes Blockchair ERC20 token data with dynamic decimal precision handling
function blockchair_erc20_scan_data(data, setconfirmations, ccsymbol, latest_block) {
    const tx_timestamp = parse_datetime_string(data.time).getTime(),
        transactiontime = tx_timestamp,
        ccval = data.value ? parseFloat((data.value / (10 ** data.token_decimals)).toFixed(8)) : null,
        confirmations = get_block_confirmations(data.block_id, latest_block);
    return {
        ccval,
        transactiontime,
        "txhash": data.transaction_hash || null,
        confirmations,
        setconfirmations,
        ccsymbol,
        "recipient": data.recipient || null,
        "token_symbol": data.token_symbol || null
    };
}

// Processes Blockchair ERC20 polling data with multi-layer token transaction validation
function blockchair_erc20_poll_data(data, setconfirmations, ccsymbol, latest_block) {
    const tx_data = data.transaction,
        token_data = data.layer_2.erc_20[0];
    if (!tx_data || !token_data) {
        return default_tx_data();
    }
    const tx_timestamp = parse_datetime_string(tx_data.time).getTime(),
        transactiontime = tx_timestamp,
        ccval = token_data.value ? parseFloat((token_data.value / (10 ** token_data.token_decimals)).toFixed(8)) : null,
        confirmations = get_block_confirmations(tx_data.block_id, latest_block);
    return {
        ccval,
        transactiontime,
        "txhash": tx_data.hash || null,
        confirmations,
        setconfirmations,
        "recipient": token_data.recipient || null,
        ccsymbol
    };
}

// Handles Etherscan/Polygonscan API data with Layer2 network support
function omniscan_scan_data(data, setconfirmations, ccsymbol, eth_layer2) {
    const transactiontime = normalize_timestamp(data.timeStamp),
        ccval = data.value ? parseFloat((data.value / (10 ** data.tokenDecimal)).toFixed(8)) : null;
    return {
        ccval,
        transactiontime,
        "txhash": data.hash || null,
        "confirmations": data.confirmations,
        setconfirmations,
        ccsymbol,
        eth_layer2
    };
}

// Processes Layer2 Ethereum transactions with native ETH value conversion
function omniscan_scan_data_eth(data, setconfirmations, eth_layer2) {
    const transactiontime = normalize_timestamp(data.timeStamp),
        ccval = data.value ? parseFloat((data.value / 1e18).toFixed(8)) : null;
    return {
        ccval,
        transactiontime,
        "txhash": data.hash || null,
        "confirmations": data.confirmations || 0,
        setconfirmations,
        "ccsymbol": "eth",
        eth_layer2
    };
}

// Processes Ethereum transactions from the alchemy API with native ETH value conversion
function alchemy_scan_data_eth(data, setconfirmations, ccsymbol, eth_layer2, lb) {
    const tx_timestamp = to_ts(q_obj(data, "metadata.blockTimestamp")),
        transactiontime = tx_timestamp,
        ccval = data.value || null;
    let confirmations = 0;
    if (lb) {
        const block_height = parseInt(data.blockNum, 16) || null,
            latest_block = parseInt(lb, 16) || null;
        confirmations = get_block_confirmations(block_height, latest_block);
    }
    return {
        ccval,
        transactiontime,
        "txhash": data.hash || null,
        confirmations,
        setconfirmations,
        ccsymbol,
        eth_layer2
    };
}

// Handles Ethplorer transaction data with token info and Layer2 support
function ethplorer_scan_data(data, setconfirmations, ccsymbol, eth_layer2) {
    const transactiontime = normalize_timestamp(data.timestamp),
        ccval = data.value ? parseFloat((data.value / (10 ** data.tokenInfo.decimals)).toFixed(8)) : null;
    return {
        ccval,
        transactiontime,
        "txhash": data.transactionHash || null,
        setconfirmations,
        ccsymbol,
        eth_layer2
    };
}

// Poll twin of ethplorer_scan_data for ethplorer/binplorer getTxInfo responses
// (same provider, same structure). Token amount + decimals come from operations[0];
// hash, confirmations and timestamp from the top level.
function ethplorer_poll_data(data, setconfirmations, ccsymbol, eth_layer2) {
    const op = q_obj(data, "operations.0") || {},
        raw_value = op.value,
        token_decimals = q_obj(op, "tokenInfo.decimals"),
        ccval = (token_decimals && raw_value != null) ? parseFloat((raw_value / 10 ** token_decimals).toFixed(8)) : null,
        confirmations = data.confirmations < 0 ? 0 : (data.confirmations || 0),
        transactiontime = normalize_timestamp(data.timestamp);
    return {
        ccval,
        transactiontime,
        "txhash": data.hash || null,
        confirmations,
        setconfirmations,
        ccsymbol,
        eth_layer2
    };
}

// Processes Nano transaction data with raw-to-NANO conversion and local timestamp handling
function nano_scan_data(data, tx_hash) {
    const ccval = data.amount ? parseFloat((data.amount / 1e30).toFixed(8)) : null,
        transactiontime = normalize_timestamp(data.local_timestamp),
        txhash = tx_hash || data.hash || null;
    return {
        ccval,
        transactiontime,
        txhash,
        "confirmations": false,
        "setconfirmations": false,
        "ccsymbol": "xno"
    };
}

// Handles Infura ERC20 data with dynamic token decimal precision
function infura_erc20_poll_data(data, setconfirmations, ccsymbol, eth_layer2) {
    const raw_value = data.value || null,
        token_decimals = data.decimals || null,
        ccval = (token_decimals && raw_value != null) ? parseFloat((raw_value / 10 ** token_decimals).toFixed(8)) : null,
        transactiontime = normalize_timestamp(data.timestamp);
    return {
        ccval,
        transactiontime,
        "txhash": data.hash || null,
        "confirmations": data.confirmations || 0,
        setconfirmations,
        ccsymbol,
        eth_layer2
    };
}

// Processes Infura block data with ETH value conversion and timestamp normalization
function infura_block_data(data, setconfirmations, ccsymbol, ts) {
    const ccval = data.value ? parseFloat((Number(data.value) / 1e18).toFixed(8)) : null,
        transactiontime = normalize_timestamp(ts);
    return {
        ccval,
        transactiontime,
        "txhash": data.hash,
        setconfirmations,
        ccsymbol
    };
}

// Processes monero_lws transaction data
function monero_lws_tx_data(data, setconfirmations, latest_block) {
    const tx_timestamp = to_ts(data.timestamp),
        transactiontime = tx_timestamp;
    if (setconfirmations === "sort") {
        return transactiontime;
    }
    const confirmations = get_block_confirmations(data.height, latest_block);
    return {
        "ccval": data.total_received / 1e12,
        transactiontime,
        "txhash": data.hash,
        confirmations,
        setconfirmations,
        "ccsymbol": "xmr",
        "payment_id": data.payment_id || false
    };
}

// Processes Monero node RPC transaction data
function xmr_tx_data(data, setconfirmations) {
    function process_output_value(output) {
        return output.amount || 0;
    }
    const total_output = calculate_total_outputs(data.outputs, null, process_output_value),
        confirmations = data.confirmations || 0,
        timestamp = data.block_timestamp,
        transactiontime = timestamp ? timestamp * 1000 : now_utc(),
        payment_id = data.payment_id,
        double_spend = data.double_spend_seen;
    return {
        "ccval": total_output / 1e12,
        transactiontime,
        "txhash": data.tx_hash,
        confirmations,
        setconfirmations,
        "ccsymbol": "xmr",
        payment_id,
        double_spend
    };
}

// Processes Nimiq transaction data with confirmation calculation and value scaling
function nimiq_scan_data(data, setconfirmations, latest_block, tx_hash) {
    const transactiontime = normalize_timestamp(data.timestamp),
        raw_confs = data.confirmations || get_block_confirmations(data.height, latest_block),
        confirmations = (raw_confs < 0) ? 0 : raw_confs,
        txhash = tx_hash || data.hash || null,
        final_confs = (data.confirmed) ? null : setconfirmations;
    return {
        "ccval": data.value / 1e5,
        transactiontime,
        txhash,
        confirmations,
        "setconfirmations": final_confs,
        "ccsymbol": "nim"
    };
}

// Processes nimiqscan.com transaction data
function nimiqscan_scan_data(data, setconfirmations) {
    const transactiontime = normalize_timestamp(data.timestamp),
        confirmations = data.confirmations,
        txhash = data.hash,
        ccval = data.value / 1e5;
    return {
        ccval,
        transactiontime,
        txhash,
        confirmations,
        setconfirmations,
        "ccsymbol": "nim"
    };
}

// Handles Kaspa transaction data with blue score confirmation calculation
function kaspa_scan_data(data, thisaddress, setconfirmations, latest_block) {
    const transactiontime = normalize_timestamp(data.block_time);

    function process_output_value(output, target_addr) {
        const output_amount = output.amount;
        return output.script_public_key_address === target_addr ? Math.abs(output_amount) : 0;
    }
    const total_output = calculate_total_outputs(data.outputs, thisaddress, process_output_value),
        confirmations = data.is_accepted ? get_block_confirmations(data.accepting_block_blue_score, latest_block) : 0;
    return {
        "ccval": total_output ? total_output / 1e8 : null,
        transactiontime,
        "txhash": data.transaction_id,
        confirmations,
        setconfirmations,
        "ccsymbol": "kas"
    };
}

// Processes Kaspa FYI API data with output address validation
function kaspa_poll_fyi_data(data, thisaddress, setconfirmations) {
    function process_output_value(output, target_addr) {
        const output_amount = output.amount;
        return output.scriptPublicKeyAddress === target_addr ? Math.abs(output_amount) : 0;
    }
    const total_output = calculate_total_outputs(data.outputs, thisaddress, process_output_value);
    return {
        "ccval": total_output ? total_output / 1e8 : null,
        "transactiontime": normalize_timestamp(data.blockTime),
        "txhash": data.transactionId,
        "confirmations": data.isAccepted || data.confirmations || 0,
        setconfirmations,
        "ccsymbol": "kas"
    };
}

// Handles Lightning Network transaction data with satoshi-to-BTC conversion
function lnd_tx_data(data) {
    const tx_timestamp = data.txtime || data.timestamp,
        transactiontime = normalize_timestamp(tx_timestamp),
        btc_amount = parseFloat(data.amount / 100000000000);
    return {
        "ccval": Math.abs(btc_amount),
        transactiontime,
        "txhash": "lightning" + data.hash,
        "confirmations": data.conf,
        "setconfirmations": 1,
        "ccsymbol": "btc",
        "status": data.status,
        "request_id": data.request_id,
        "transfer_id": data.transfer_id
    };
}

// Processes Infura Ethereum polling data with Layer2 network support
function infura_eth_poll_data(data, setconfirmations, ccsymbol, eth_layer2) {
    const ccval = data.value ? parseFloat((data.value / 1e18).toFixed(8)) : null,
        transactiontime = normalize_timestamp(data.timestamp);
    return {
        ccval,
        transactiontime,
        "txhash": data.hash || null,
        "confirmations": data.confirmations || 0,
        setconfirmations,
        ccsymbol,
        eth_layer2
    };
}

// Check if address has transactions
function has_tx(tx_list) {
    return (is_array(tx_list) && tx_list.length) ? true : false;
}