const default_error = {
    "error": "no transactions found",
    "console": true
};

$(document).ready(function() {

    // ** API **

    //lightning_fetch
    //monero_fetch
    //match_xmr_pid
    //blockchair_xmr_poll
    //blockchaininfo_fetch_init
    //blockchaininfo_fetch_blockheight
    //blockchaininfo_fetch
    //blockcypher_fetch
    //ethplorer_fetch
    //omniscan_fetch
    //blockchair_fetch
    //nimiq_fetch
    //kaspa_fetch_init
    //kaspa_fetch_blockheight
    //kaspa_fetch
    //insight_fetch_dash

    // ** RPC **

    //mempoolspace_rpc_init
    //mempoolspace_rpc_blockheight
    //mempoolspace_rpc
    //infura_txd_rpc
    //inf_result
    //inf_err
    //eth_params
    //nano_rpc

    // ** Unified TXdata **

    //sort_by_date
    //default_tx_data
    //blockchain_ws_data
    //mempoolspace_ws_data
    //mempoolspace_scan_data
    //dogechain_ws_data
    //blockcypher_scan_data
    //blockcypher_poll_data
    //blockchair_scan_data
    //blockchair_eth_scan_data
    //blockchair_erc20_scan_data
    //blockchair_erc20_poll_data
    //omniscan_scan_data
    //omniscan_scan_data_eth
    //ethplorer_scan_data
    //nano_scan_data
    //bitcoin_rpc_data
    //infura_eth_poll_data
    //infura_erc20_poll_data
    //infura_block_data
    //xmr_scan_data
    //nimiq_scan_data
    //kaspa_scan_data
    //kaspa_poll_fyi_data
    //kaspa_ws_data
    //kaspa_fyi_ws_data
    //lnd_tx_data
    //tx_data
});

// ** Fetch blockchain data from different blockexplorers **

// ** Lightning RPC **

// This function handles the fetching and processing of Lightning Network payment data.
// It performs various API calls to check payment status, handle invoices, and update transaction information.
function lightning_fetch(rd, api_data, rdo) {
    const api_name = api_data.name,
        thislist = rdo.thislist,
        requestid = rd.requestid,
        transactionlist = rdo.transactionlist,
        statuspanel = rdo.statuspanel,
        counter = 0,
        lnd = rd.lightning,
        ln_only = lnd && lnd.hybrid === false,
        metalist = thislist.find(".metalist"),
        status_field = metalist.find(".status"),
        p_arr = lnurl_deform(lnd.proxy_host),
        proxy_host = p_arr.url,
        pk = lnd.pw || p_arr.k,
        pid = lnd.pid,
        nid = lnd.nid,
        imp = lnd.imp,
        default_error = "unable to connect",
        transactionhash = rd.txhash,
        lnhash = transactionhash && transactionhash.slice(0, 9) === "lightning";
    if (rdo.pending === "scanning") {
        $.ajax({
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy_host + "proxy/v1/ln/api/",
            "data": {
                "fn": "ln-request-status",
                "id": pid,
                "x-api": pk
            }
        }).done(function(r) {
            const error = r.error,
                version = r.version;
            if (version < glob_proxy_version) {
                proxy_alert(version);
            }
            if (error) {
                const message = error ? (error.message || (typeof error === "string" ? error : default_error)) : default_error;
                tx_api_fail(thislist, statuspanel);
                handle_api_fails(rd, rdo, {
                    "error": message,
                    "console": true
                });
                status_field.text(" " + message);
                if (!ln_only) {
                    continue_select_api(rd, api_data, rdo);
                }
                return
            }
            const inv_status = r.status;
            status_field.text(" " + inv_status);
            if (r.pid === lnd.pid) {
                if (r.bolt11) {
                    $.ajax({
                        "method": "POST",
                        "cache": false,
                        "timeout": 5000,
                        "url": proxy_host + "proxy/v1/ln/api/",
                        "data": {
                            "fn": "ln-invoice-status",
                            "imp": imp,
                            "hash": r.hash,
                            "id": pid,
                            "nid": nid,
                            "callback": "no",
                            "type": rd.requesttype,
                            "x-api": pk
                        }
                    }).done(function(e) {
                        const inv_error = e.error;
                        if (inv_error) {
                            const err_message = inv_error.message || (typeof inv_error === "string" ? inv_error : default_error);
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails(rd, rdo, {
                                "error": err_message,
                                "console": true
                            });
                            status_field.text(" " + err_message);
                            if (!ln_only) {
                                continue_select_api(rd, api_data, rdo);
                            }
                            return
                        }
                        const status = e.status;
                        if (status) {
                            lnd.invoice = e;
                            status_field.text(" " + status);
                            rd.lightning = lnd; // push invoice
                            const txd = lnd_tx_data(e);
                            if (txd.ccval) {
                                const tx_listitem = append_tx_li(txd, rd.requesttype);
                                if (tx_listitem) {
                                    transactionlist.append(tx_listitem.data(txd));
                                    tx_count(statuspanel, txd.confirmations);
                                    if (status === "canceled") {
                                        updaterequest({
                                            "requestid": requestid,
                                            "status": "canceled",
                                            "confirmations": 0
                                        }, false);
                                        api_callback(rdo);
                                        return
                                    }
                                    compareamounts(rd, rdo);
                                    return
                                }
                            }
                        }
                        if (!ln_only) {
                            continue_select_api(rd, api_data, rdo);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        const error_object = errorThrown || jqXHR;
                        handle_api_fails(rd, rdo, error_object);
                        if (!ln_only) {
                            continue_select_api(rd, api_data, rdo);
                        }
                    });
                    return
                }
                tx_count(statuspanel, 0);
                handle_api_fails(rd, rdo, {
                    "error": "invoice not found",
                    "console": true
                });
                if (!ln_only) {
                    continue_select_api(rd, api_data, rdo);
                }
                return
            }
            if (inv_status === "not found") {
                updaterequest({
                    "requestid": requestid,
                    "status": "expired",
                    "pending": "no",
                    "confirmations": 0
                }, true);
            }
            handle_api_fails(rd, rdo, {
                "error": "payment id not found",
                "console": true
            });
            if (!ln_only) {
                continue_select_api(rd, api_data, rdo);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            tx_api_fail(thislist, statuspanel);
            const error_object = errorThrown || jqXHR;
            handle_api_fails(rd, rdo, error_object);
            if (!ln_only) {
                continue_select_api(rd, api_data, rdo);
            }
        }).always(function() {
            set_api_src(rdo, {
                "name": "proxy"
            });
        });
        return
    }
    if (rdo.pending === "polling" && lnhash) {
        const invoice = lnd.invoice;
        if (invoice) {
            if (transactionhash) {
                $.ajax({
                    "method": "POST",
                    "cache": false,
                    "timeout": 5000,
                    "url": proxy_host + "proxy/v1/ln/api/",
                    "data": {
                        "fn": "ln-invoice-status",
                        "imp": imp,
                        "hash": transactionhash.slice(9),
                        "id": pid,
                        "nid": nid,
                        "callback": "no",
                        "type": rd.requesttype,
                        "x-api": pk
                    }
                }).done(function(e) {
                    const status = e.status;
                    if (status) {
                        lnd.invoice = e;
                        status_field.text(" " + status);
                        rd.lightning = lnd; // push invoice
                        const txd = lnd_tx_data(e);
                        if (txd.ccval) {
                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                            if (tx_listitem) {
                                transactionlist.append(tx_listitem.data(txd));
                                tx_count(statuspanel, txd.confirmations);
                                if (status === "canceled") {
                                    updaterequest({
                                        "requestid": requestid,
                                        "status": "canceled",
                                        "confirmations": 0
                                    }, true);
                                    api_callback(rdo);
                                } else {
                                    compareamounts(rd, rdo);
                                }
                            }
                        }
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    tx_api_fail(thislist, statuspanel);
                    const error_object = errorThrown || jqXHR;
                    handle_api_fails(rd, rdo, error_object, false);
                }).always(function() {
                    set_api_src(rdo, {
                        "name": "proxy"
                    });
                });
            }
            return
        }
        handle_api_fails(rd, rdo, {
            "error": "invoice not found",
            "console": true
        }, false);
        return
    }
    continue_select_api(rd, api_data, rdo);
}

// ** MyMonero API **

// This function handles fetching and processing Monero transaction data.
// It uses different APIs based on the pending status and performs various checks and data manipulations.
function monero_fetch(rd, api_data, rdo) {
    if (rdo.pending === "polling") {
        blockchair_xmr_poll(rd, api_data, rdo); // use blockchair api for tx lookup
        return
    }
    const vk = rd.viewkey;
    if (!vk) return;
    const api_name = api_data.name,
        transactionlist = rdo.transactionlist,
        xmr_ia = rd.xmr_ia,
        payment_id = rd.payment_id,
        account = vk.account || rd.address,
        viewkey = vk.vk,
        source = rdo.source,
        payload = JSON.stringify({
            "address": account,
            "view_key": viewkey,
            "create_account": true,
            "generated_locally": false
        });
    api_proxy({
        "api": api_name,
        "search": "login",
        "cachetime": 25,
        "cachefolder": "1h",
        "proxy": true,
        "params": {
            "method": "POST",
            "data": payload,
            "headers": {
                "Content-Type": "application/json"
            }
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            if (data.start_height > -1) { // success!
                const pl = {
                    "address": account,
                    "view_key": viewkey
                };
                api_proxy({
                    "api": api_name,
                    "search": "get_address_txs",
                    "cachetime": 25,
                    "cachefolder": "1h",
                    "proxy": true,
                    "params": {
                        "method": "POST",
                        "data": JSON.stringify(pl),
                        "headers": {
                            "Content-Type": "application/json"
                        }
                    }
                }).done(function(e) {
                    const data = br_result(e).result,
                        transactions = data.transactions;
                    if (transactions) {
                        const sortlist = sort_by_date(xmr_scan_data, transactions);
                        let counter = 0,
                            txdat = false;
                        $.each(sortlist, function(dat, value) {
                            const txd = xmr_scan_data(value, rdo.setconfirmations, "xmr", data.blockchain_height);
                            if (txd) {
                                const xid_match = match_xmr_pid(xmr_ia, payment_id, txd.payment_id); // match xmr payment_id if set
                                if (xid_match === true) {
                                    if (rdo.pending === "polling") {
                                        if (txd.txhash === rd.txhash && txd.ccval) {
                                            txdat = txd;
                                            if (source === "list") {
                                                const tx_listitem = append_tx_li(txd, rd.requesttype);
                                                if (tx_listitem) {
                                                    transactionlist.append(tx_listitem.data(txd));
                                                    counter++;
                                                }
                                            }
                                            return false;
                                        }
                                    } else if (rdo.pending === "scanning") {
                                        if (txd.transactiontime > rdo.request_timestamp && txd.ccval) {
                                            txdat = txd;
                                            if (source === "list") {
                                                const tx_listitem = append_tx_li(txd, rd.requesttype);
                                                if (tx_listitem) {
                                                    transactionlist.append(tx_listitem.data(txd));
                                                    counter++;
                                                }
                                            }
                                            return false;
                                        }
                                    }
                                }
                            }
                        });
                        scan_match(rd, api_data, rdo, counter, txdat);
                        return
                    }
                    api_callback(rdo);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    const error_object = errorThrown || jqXHR;
                    tx_api_scan_fail(rd, api_data, rdo, error_object);
                });
                return
            }
        }
        tx_api_scan_fail(rd, api_data, rdo, default_error);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const error_object = errorThrown || jqXHR;
        tx_api_scan_fail(rd, api_data, rdo, error_object, true);
    }).always(function() {
        set_api_src(rdo, {
            "name": "mymonero api"
        });
    });
}

// This function matches Monero payment IDs.
// It checks if the provided payment IDs match based on certain conditions.
function match_xmr_pid(xmria, xmrpid, xmr_pid) {
    if (xmria) {
        return xmrpid === xmr_pid;
    }
    return !xmrpid && !xmr_pid;
}

// ** MyMonero API **

// This function polls the Blockchair API for Monero transaction data.
// It retrieves and processes transaction information based on the provided parameters.
function blockchair_xmr_poll(rd, api_data, rdo) {
    const vk = rd.viewkey;
    if (!vk) return;
    const txhash = rd.txhash,
        xmr_ia = rd.xmr_ia,
        account = vk.account || rd.address,
        viewkey = vk.vk;
    api_proxy({
        "api_url": "https://api.blockchair.com/monero/raw/outputs?txprove=0&txhash=" + txhash + "&address=" + account + "&viewkey=" + viewkey,
        "cachetime": 25,
        "cachefolder": "1h",
        "proxy": true,
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const data = br_result(e).result;
        let counter = 0,
            txdat = false;
        if (data) {
            const dat = data.data;
            if (dat) {
                const txd = blockchair_xmr_data(dat, rdo.setconfirmations);
                if (txd.txhash === txhash && txd.ccval) {
                    txdat = txd, counter = 1;
                    if (rdo.source === "list") {
                        const tx_listitem = append_tx_li(txd, rd.requesttype);
                        if (tx_listitem) {
                            const transactionlist = rdo.transactionlist;
                            transactionlist.append(tx_listitem.data(txd));
                        }
                    }
                }
                scan_match(rd, api_data, rdo, counter, txdat);
                return
            }
        }
        tx_api_scan_fail(rd, api_data, rdo, default_error);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const error_object = errorThrown || jqXHR;
        tx_api_scan_fail(rd, api_data, rdo, error_object, true);
    }).always(function() {
        set_api_src(rdo, {
            "name": "blockchair api"
        });
    });
}

// ** blockchain.info API **

// This function fetches and processes transaction data using the blockchain.info API.
// It handles both scanning for incoming transactions and polling for specific transaction details.
function blockchaininfo_fetch_init(rd, api_data, rdo) {
    if (rdo.source === "acc_polling") {
        blockchaininfo_fetch(rd, api_data, rdo, false);
        return
    }
    blockchaininfo_fetch_blockheight(rd, api_data, rdo);
}

function blockchaininfo_fetch_blockheight(rd, api_data, rdo) {
    api_proxy({ // get latest blockheight
        "api": "blockchain.info",
        "search": rd.currencysymbol + "/block/best",
        "cachetime": rdo.cachetime,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }).done(function(lb) {
        const lbdat = br_result(lb);
        if (lbdat) {
            const latestblock = q_obj(lbdat, "result.height");
            if (latestblock) {
                blockchaininfo_fetch(rd, api_data, rdo, latestblock);
                return
            }
        }
        tx_api_scan_fail(rd, api_data, rdo, default_error);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const error_object = errorThrown || jqXHR;
        tx_api_scan_fail(rd, api_data, rdo, error_object, true);
    }).always(function() {
        set_api_src(rdo, api_data);
    });
}

function blockchaininfo_fetch(rd, api_data, rdo, latestblock) {
    const transactionlist = rdo.transactionlist,
        source = rdo.source;
    let counter = 0,
        txdat = false;
    if (rdo.pending === "scanning") { // scan incoming transactions on address
        api_proxy({
            "api": "blockchain.info",
            "search": rd.currencysymbol + "/address/" + rd.address + "/transactions?limit=20&offset=0",
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                if (data.error) {
                    tx_api_scan_fail(rd, api_data, rdo, data.error);
                    return
                }
                if (br_issar(data)) {
                    const tx_string = data.map(item => item.txid).join(",");
                    api_proxy({
                        "api": "blockchain.info",
                        "search": rd.currencysymbol + "/transactions?txids=" + tx_string, // get transactions
                        "cachetime": rdo.cachetime,
                        "cachefolder": "1h",
                        "params": {
                            "method": "GET"
                        }
                    }).done(function(e) {
                        const dat = br_result(e).result;
                        if (dat) {
                            $.each(dat, function(dt, val) {
                                const txd = blockchaininfo_scan_data(val, rdo.setconfirmations, rd.currencysymbol, rd.address, latestblock);
                                if (txd.transactiontime > rdo.request_timestamp && txd.ccval) { // get all transactions after requestdate
                                    txdat = txd;
                                    if (source === "list") {
                                        const tx_listitem = append_tx_li(txd, rd.requesttype);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            counter++;
                                        }
                                    }
                                }
                            });
                            scan_match(rd, api_data, rdo, counter, txdat);
                            return
                        }
                        api_callback(rdo);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        const error_object = errorThrown || jqXHR;
                        tx_api_scan_fail(rd, api_data, rdo, error_object);
                    });
                    return
                }
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object, true);
        }).always(function() {
            set_api_src(rdo, api_data);
        });
        return
    }
    if (rdo.pending === "polling") { // poll transaction id
        if (rd.txhash) {
            api_proxy({
                "api": "blockchain.info",
                "search": rd.currencysymbol + "/transaction/" + rd.txhash,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    if (data.error) {
                        tx_api_scan_fail(rd, api_data, rdo, data.error);
                        return
                    }
                    const txd = blockchaininfo_scan_data(data, rdo.setconfirmations, rd.currencysymbol, rd.address, latestblock);
                    if (txd.ccval) {
                        txdat = txd, counter = 1;
                        if (source === "list") {
                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                            if (tx_listitem) {
                                transactionlist.append(tx_listitem.data(txd));
                            }
                        }
                    }
                    scan_match(rd, api_data, rdo, counter, txdat);
                    return
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object, true);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
        }
    }
}


// ** blockcypher API **

// This function fetches and processes transaction data using the BlockCypher API.
// It handles both scanning for incoming transactions and polling for specific transaction details.
function blockcypher_fetch(rd, api_data, rdo) {
    const transactionlist = rdo.transactionlist;
    let counter = 0,
        txdat = false;
    if (rdo.pending === "scanning") { // scan incoming transactions on address
        api_proxy({
            "api": "blockcypher",
            "search": rd.currencysymbol + "/main/addrs/" + rd.address,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                if (data.error) {
                    tx_api_scan_fail(rd, api_data, rdo, data.error);
                    return
                }
                const conf_tx = data.txrefs,
                    unconf_tx = data.unconfirmed_txrefs,
                    all_tx = (unconf_tx && conf_tx) ? unconf_tx.concat(conf_tx) : conf_tx || unconf_tx;
                if (all_tx && !$.isEmptyObject(all_tx)) {
                    const sortlist = sort_by_date(blockcypher_scan_data, all_tx);
                    $.each(sortlist, function(dat, value) {
                        if (!value.spent) { // filter outgoing transactions
                            const txd = blockcypher_scan_data(value, rdo.setconfirmations, rd.currencysymbol, rd.payment);
                            if (txd.transactiontime > rdo.request_timestamp && txd.ccval) {
                                txdat = txd;
                                if (rdo.source === "list") {
                                    const tx_listitem = append_tx_li(txd, rd.requesttype);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(txd));
                                        counter++;
                                    }
                                }
                            }
                        }
                    });
                }
                scan_match(rd, api_data, rdo, counter, txdat);
                return
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object, true);
        }).always(function() {
            set_api_src(rdo, api_data);
        });
        return
    }
    if (rdo.pending === "polling") { // poll transaction id
        if (rd.txhash) {
            api_proxy({
                "api": "blockcypher",
                "search": rd.currencysymbol + "/main/txs/" + rd.txhash,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    if (data.error) {
                        tx_api_scan_fail(rd, api_data, rdo, data.error);
                        return
                    }
                    const txd = blockcypher_poll_data(data, rdo.setconfirmations, rd.currencysymbol, rd.address);
                    if (txd.ccval) {
                        txdat = txd, counter = 1;
                        if (rdo.source === "list") {
                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                            if (tx_listitem) {
                                transactionlist.append(tx_listitem.data(txd));
                            }
                        }
                    }
                    scan_match(rd, api_data, rdo, counter, txdat);
                    return
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object, true);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
        }
    }
}

// ** ethplorer / binplorer API **

// This function fetches and processes transaction data using the Ethplorer or Binplorer API.
// It handles both scanning for incoming transactions and polling for specific transaction details for Ethereum and Binance Smart Chain.
function ethplorer_fetch(rd, rdo, api_data) {
    const api_name = api_data.name,
        thislist = rdo.thislist,
        transactionlist = rdo.transactionlist,
        source = rdo.source,
        txhash = rd.txhash,
        l2 = api_name === "binplorer" ? "bnb" : false;
    let counter = 0,
        txdat = false;
    if (rdo.pending === "scanning") { // scan incoming transactions on address
        api_proxy({
            "api": api_name,
            "search": "getAddressHistory/" + rd.address + "?type=transfer",
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                const error = data.error;
                if (error) {
                    tx_api_scan_fail(rd, api_data, rdo, data.error, null, l2);
                    return
                }
                const operations = data.operations;
                if (operations) {
                    const sortlist = sort_by_date(ethplorer_scan_data, operations);
                    $.each(sortlist, function(dat, value) {
                        const txd = ethplorer_scan_data(value, rdo.setconfirmations, rd.currencysymbol, l2),
                            rt_compensate = (rd.inout === "local" && rd.status === "insufficient") ? rdo.request_timestamp - 30000 : rdo.request_timestamp; // substract extra 30 seconds (extra compensation)
                        if (str_match(value.to, rd.address) === true && txd.transactiontime > rt_compensate && str_match(rd.currencysymbol, q_obj(value, "tokenInfo.symbol")) === true && txd.ccval) {
                            txdat = txd;
                            if (source === "list") {
                                api_src(thislist, api_data); // !!overwrite
                                const tx_listitem = append_tx_li(txd, rd.requesttype);
                                if (tx_listitem) {
                                    transactionlist.append(tx_listitem.data(txd));
                                    counter++;
                                }
                            }
                        }
                    });
                    scan_match(rd, api_data, rdo, counter, txdat, l2);
                    return
                }
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error, null, l2);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object, true, l2);
        }).always(function() {
            set_api_src(rdo, api_data);
        });
    }
    if (rdo.pending === "polling") { // poll transaction id
        if (txhash) {
            api_proxy({
                "api": api_name,
                "search": "getTxInfo/" + txhash,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    const error = data.error;
                    if (error) {
                        tx_api_scan_fail(rd, api_data, rdo, error, null, l2);
                        return
                    }
                    const input = data.input,
                        amount_hex = input.slice(74),
                        tokenValue = hexToNumberString(amount_hex),
                        conf_correct = data.confirmations < 0 ? 0 : data.confirmations,
                        txdata = {
                            "timestamp": data.timestamp,
                            "hash": txhash,
                            "confirmations": conf_correct,
                            "value": tokenValue,
                            "decimals": rd.decimals
                        },
                        txd = infura_erc20_poll_data(txdata, rdo.setconfirmations, rd.currencysymbol, l2);
                    if (txd.ccval) {
                        txdat = txd, counter = 1;
                        if (source === "list") {
                            api_src(thislist, api_data); // !!overwrite
                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                            if (tx_listitem) {
                                transactionlist.append(tx_listitem.data(txd));
                            }
                        }
                    }
                    scan_match(rd, api_data, rdo, counter, txdat, l2);
                    return
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error, null, l2);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object, true, l2);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
        }
    }
}

// ** arbiscan / Polygonscan API **

// This function fetches and processes transaction data from different ETH layer2 networks.
// It handles both scanning for incoming transactions and polling for specific transaction details.
function omniscan_fetch(rd, api_data, rdo, contract, chainid) {
    const requestid = rd.requestid,
        api_name = api_data.name,
        network = api_data.network,
        thislist = rdo.thislist,
        transactionlist = rdo.transactionlist,
        txhash = rd.txhash,
        cid = chainid ? "&chainid=" + chainid : "",
        eth_payload = {
            "api": api_name,
            "search": "?module=account&action=txlist&address=" + rd.address + "&startblock=0&endblock=latest&page=1&offset=1000&sort=desc" + cid,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        },
        erc20_payload = {
            "api": api_name,
            "search": "?module=account&action=tokentx&contractaddress=" + contract + "&address=" + rd.address + "&page=1&offset=100&startblock=0&endblock=99999999&sort=desc" + cid,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        },
        source = rdo.source;
    let counter = 0,
        txdat = false;
    if (rdo.pending === "scanning") { // scan incoming transactions on address
        if (rd.payment === "ethereum") {
            api_proxy(eth_payload).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    const error = data.error;
                    if (error) {
                        const error_object = {
                            "error": error.message,
                            "console": true
                        };
                        tx_api_scan_fail(rd, api_data, rdo, error_object, null, true);
                        return
                    }
                    const result = data.result;
                    if (result && br_issar(result)) {
                        const sortlist = sort_by_date(omniscan_scan_data_eth, result);
                        $.each(sortlist, function(dat, value) {
                            const txd = omniscan_scan_data_eth(value, rdo.setconfirmations, network),
                                rt_compensate = (rd.inout === "local" && rd.status === "insufficient") ? rdo.request_timestamp - 30000 : rdo.request_timestamp; // substract extra 30 seconds (extra compensation)
                            if (str_match(value.to, rd.address) && (txd.transactiontime > rt_compensate) && txd.ccval) {
                                txdat = txd;
                                if (source === "list") {
                                    api_src(thislist, api_data); // !!overwrite
                                    const tx_listitem = append_tx_li(txd, rd.requesttype);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(txd));
                                        counter++;
                                    }
                                }
                            }
                        });
                        scan_match(rd, api_data, rdo, counter, txdat, network);
                        return
                    }
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error, null, network);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object, true, network);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
            return
        }
        if (contract) {
            api_proxy(erc20_payload).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    const error = data.error;
                    if (error) {
                        const error_object = {
                            "error": error.message,
                            "console": true
                        };
                        tx_api_scan_fail(rd, api_data, rdo, error_object, null, network);
                        return
                    }
                    const result = data.result;
                    if (result && br_issar(result)) {
                        const sortlist = sort_by_date(omniscan_scan_data, result);
                        $.each(sortlist, function(dat, value) {
                            const txd = omniscan_scan_data(value, rdo.setconfirmations, rd.currencysymbol, network),
                                rt_compensate = (rd.inout === "local" && rd.status === "insufficient") ? rdo.request_timestamp - 30000 : rdo.request_timestamp; // substract extra 30 seconds (extra compensation)
                            if (str_match(value.to, rd.address) && (txd.transactiontime > rt_compensate) && (str_match(rd.currencysymbol, value.tokenSymbol)) && txd.ccval) {
                                txdat = txd;
                                if (source === "list") {
                                    api_src(thislist, api_data); // !!overwrite
                                    const tx_listitem = append_tx_li(txd, rd.requesttype);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(txd));
                                        counter++;
                                    }
                                }
                            }
                        });
                    }
                    scan_match(rd, api_data, rdo, counter, txdat, network);
                    return
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error, null, network);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object, true, network);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
            return
        }
        api_callback(rdo);
        return
    }
    if (rdo.pending === "polling") { // poll transaction id
        if (txhash) {
            if (rd.payment === "ethereum") {
                api_proxy(eth_payload).done(function(e) {
                    const data = br_result(e).result;
                    if (data) {
                        const error = data.error;
                        if (error) {
                            const error_object = {
                                "error": error.message,
                                "console": true
                            };
                            tx_api_scan_fail(rd, api_data, rdo, error_object, null, network);
                            return
                        }
                        const result = data.result;
                        if (result && br_issar(result)) {
                            const sortlist = sort_by_date(omniscan_scan_data_eth, result);
                            $.each(sortlist, function(dat, value) {
                                if (value.hash === txhash) {
                                    const txd = omniscan_scan_data_eth(value, rdo.setconfirmations, network);
                                    if (txd.ccval) {
                                        txdat = txd, counter = 1;
                                        if (source === "list") {
                                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                            }
                                        }
                                        return
                                    }
                                }
                            });
                            scan_match(rd, api_data, rdo, counter, txdat, network);
                            return
                        }
                    }
                    tx_api_scan_fail(rd, api_data, rdo, default_error, null, network);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    const error_object = errorThrown || jqXHR;
                    tx_api_scan_fail(rd, api_data, rdo, error_object, true, network);
                }).always(function() {
                    set_api_src(rdo, api_data);
                });
                return
            }
            if (contract) {
                api_proxy(erc20_payload).done(function(e) {
                    const data = br_result(e).result;
                    if (data) {
                        const error = data.error;
                        if (error) {
                            const error_object = {
                                "error": error.message,
                                "console": true
                            };
                            tx_api_scan_fail(rd, api_data, rdo, error_object, null, network);
                            return
                        }
                        const result = data.result;
                        if (result && br_issar(result)) {
                            const sortlist = sort_by_date(omniscan_scan_data, result);
                            $.each(sortlist, function(dat, value) {
                                if (value.hash === txhash) {
                                    const txd = omniscan_scan_data(value, rdo.setconfirmations, rd.currencysymbol, network);
                                    if (txd.ccval) {
                                        txdat = txd, counter = 1;
                                        if (source === "list") {
                                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                            }
                                        }
                                        return
                                    }
                                }
                            });
                            scan_match(rd, api_data, rdo, counter, txdat, network);
                            return
                        }
                    }
                    tx_api_scan_fail(rd, api_data, rdo, default_error, null, network);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    const error_object = errorThrown || jqXHR;
                    tx_api_scan_fail(rd, api_data, rdo, error_object, true, network);
                }).always(function() {
                    set_api_src(rdo, api_data);
                });
                return
            }
            api_callback(rdo);
        }
    }
}

// ** blockchair API **

// This function fetches and processes transaction data from the Blockchair API.
// It handles both scanning for incoming transactions and polling for specific transaction details.
// The function supports various cryptocurrencies, including Ethereum and ERC20 tokens,
// and adapts its behavior based on the type of transaction and the API being used.
function blockchair_fetch(rd, api_data, rdo) {
    const api_name = api_data.name,
        transactionlist = rdo.transactionlist,
        requestid = rd.requestid,
        source = rdo.source;
    let counter = 0,
        txdat = false;
    if (rdo.pending === "scanning") { // scan incoming transactions on address
        const contract = q_obj(rd, "coindata.contract"),
            scan_url = (rd.erc20 == true && contract) ? "ethereum/erc-20/" + contract + "/dashboards/address/" + rd.address : rd.payment + "/dashboards/address/" + rd.address;
        api_proxy({
            "api": api_name,
            "search": scan_url,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                if (data.error) {
                    tx_api_scan_fail(rd, api_data, rdo, data.error);
                    return
                }
                const context = data.context;
                if (context.error) {
                    tx_api_scan_fail(rd, api_data, rdo, data.context);
                    return
                }
                const latestblock = context.state;
                if (rd.erc20 == true) {
                    const erc20dat = data.data;
                    if (erc20dat) {
                        $.each(erc20dat, function(dat, value) {
                            const transactions = value.transactions;
                            if (transactions) {
                                const sortlist = sort_by_date(blockchair_erc20_scan_data, transactions);
                                $.each(sortlist, function(dt, val) {
                                    const txd = blockchair_erc20_scan_data(val, rdo.setconfirmations, rd.currencysymbol, latestblock);
                                    if ((txd.transactiontime > rdo.request_timestamp) && (str_match(txd.recipient, rd.address) === true) && (str_match(txd.token_symbol, rd.currencysymbol) === true) && txd.ccval) {
                                        txdat = txd;
                                        if (source === "list") {
                                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                                counter++;
                                            }
                                        }
                                    }
                                });
                            }
                        });
                        scan_match(rd, api_data, rdo, counter, txdat);
                        return
                    }
                    api_callback(rdo);
                    return
                }
                if (rd.payment === "ethereum") {
                    const ethdat = data.data;
                    if (ethdat) {
                        $.each(ethdat, function(dat, value) {
                            const calls = value.calls;
                            if (calls) {
                                const sortlist = sort_by_date(blockchair_eth_scan_data, calls);
                                $.each(sortlist, function(dt, val) {
                                    const txd = blockchair_eth_scan_data(val, rdo.setconfirmations, rd.currencysymbol, latestblock);
                                    if (txd.transactiontime > rdo.request_timestamp && str_match(txd.recipient, rd.address) === true && txd.ccval) {
                                        txdat = txd;
                                        if (source === "list") {
                                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                                counter++;
                                            }
                                        }
                                    }
                                });
                            }
                        });
                        scan_match(rd, api_data, rdo, counter, txdat);
                        return
                    }
                    api_callback(rdo);
                    return
                }
                const txarray = q_obj(data, "data." + rd.address + ".transactions");
                if ($.isEmptyObject(txarray)) {
                    api_callback(rdo);
                    return
                }
                api_proxy({
                    "api": api_name,
                    "search": rd.payment + "/dashboards/transactions/" + txarray.slice(0, 6), // get last 5 transactions
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "params": {
                        "method": "GET"
                    }
                }).done(function(e) {
                    const dat = br_result(e).result,
                        bcdat = dat.data;
                    if (bcdat) {
                        $.each(bcdat, function(dt, val) {
                            const txd = blockchair_scan_data(val, rdo.setconfirmations, rd.currencysymbol, rd.address, latestblock);
                            if (txd.transactiontime > rdo.request_timestamp && txd.ccval) { // get all transactions after requestdate
                                txdat = txd;
                                if (source === "list") {
                                    const tx_listitem = append_tx_li(txd, rd.requesttype);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(txd));
                                        counter++;
                                    }
                                }
                            }
                        });
                        scan_match(rd, api_data, rdo, counter, txdat);
                        return
                    }
                    api_callback(rdo);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    const error_object = errorThrown || jqXHR;
                    tx_api_scan_fail(rd, api_data, rdo, error_object);
                });
                return
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object, true);
        }).always(function() {
            set_api_src(rdo, api_data);
        });
    }
    if (rdo.pending === "polling") { // poll transaction id
        if (rd.txhash) {
            const poll_url = (rd.erc20 == true) ? "ethereum/dashboards/transaction/" + rd.txhash + "?erc_20=true" : rd.payment + "/dashboards/transaction/" + rd.txhash;
            api_proxy({
                "api": api_name,
                "search": poll_url,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    const context = data.context;
                    if (context) {
                        if (context.error) {
                            tx_api_scan_fail(rd, api_data, rdo, context.error);
                            return
                        }
                        const latestblock = context.state;
                        if (latestblock) {
                            const trxs = q_obj(data, "data." + rd.txhash);
                            if (trxs) {
                                const txd = (rd.erc20 == true) ? blockchair_erc20_poll_data(trxs, rdo.setconfirmations, rd.currencysymbol, latestblock) :
                                    (rd.payment === "ethereum") ? blockchair_eth_scan_data(trxs.calls[0], rdo.setconfirmations, rd.currencysymbol, latestblock) :
                                    blockchair_scan_data(trxs, rdo.setconfirmations, rd.currencysymbol, rd.address, latestblock);
                                if (txd.ccval) {
                                    txdat = txd, counter = 1;
                                    if (source === "list") {
                                        const tx_listitem = append_tx_li(txd, rd.requesttype);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                        }
                                    }
                                }
                            }
                        }
                        scan_match(rd, api_data, rdo, counter, txdat);
                        return
                    }
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object, true);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
        }
    }
}

// ** nimiq / mopsus API **

// This function fetches and processes transaction data for Nimiq cryptocurrency.
// It handles both scanning for incoming transactions and polling for specific transaction details.
// The function supports multiple APIs (nimiq.watch and mopsus.com) and adapts its behavior based on the API being used.
function nimiq_fetch(rd, api_data, rdo) {
    const api_name = api_data.name,
        transactionlist = rdo.transactionlist,
        requestid = rd.requestid,
        source = rdo.source;
    let counter = 0,
        txdat = false;
    if (rdo.pending === "scanning") { // scan incoming transactions on address
        if (api_name === "nimiq.watch") {
            api_proxy({
                "api": "nimiq.watch",
                "search": "account-transactions/" + rd.address,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    if ($.isEmptyObject(data)) {
                        api_callback(rdo);
                        return
                    }
                    const sortlist = sort_by_date(nimiq_scan_data, data);
                    $.each(sortlist, function(dat, value) {
                        const r_address = value.receiver_address.replace(/\s/g, "");
                        if (r_address === rd.address) { // filter outgoing transactions
                            const txd = nimiq_scan_data(value, rdo.setconfirmations);
                            if (txd.transactiontime > rdo.request_timestamp && txd.ccval) {
                                txdat = txd;
                                if (source === "list") {
                                    const tx_listitem = append_tx_li(txd, rd.requesttype);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(txd));
                                        counter++;
                                    }
                                }
                            }
                        }
                    });
                    scan_match(rd, api_data, rdo, counter, txdat);
                    return
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object, true);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
            return
        }
        tx_api_scan_fail(rd, api_data, rdo, default_error);
        return
    }
    if (rdo.pending === "polling") {
        if (rd.txhash) {
            if (api_name === "nimiq.watch") { // poll nimiq.watch transaction id
                api_proxy({
                    "api": api_name,
                    "search": "transaction/" + nimiqhash(rd.txhash),
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "params": {
                        "method": "GET"
                    }
                }).done(function(e) {
                    const data = br_result(e).result;
                    if (data) {
                        if (data.error) {
                            tx_api_scan_fail(rd, api_data, rdo, data.error);
                            return
                        }
                        const txd = nimiq_scan_data(data, rdo.setconfirmations);
                        if (txd) {
                            if (txd.ccval) {
                                txdat = txd, counter = 1;
                                if (source === "list") {
                                    const tx_listitem = append_tx_li(txd, rd.requesttype);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(txd));
                                    }
                                }
                            }
                        }
                        scan_match(rd, api_data, rdo, counter, txdat);
                        return
                    }
                    tx_api_scan_fail(rd, api_data, rdo, default_error);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    const error_object = errorThrown || jqXHR;
                    tx_api_scan_fail(rd, api_data, rdo, error_object, true);
                }).always(function() {
                    set_api_src(rdo, api_data);
                });
                return
            }
            if (api_name === "mopsus.com") { // poll mopsus.com transaction id
                api_proxy({
                    "api": api_name,
                    "search": "tx/" + rd.txhash,
                    "cachetime": rdo.cachetime,
                    "cachefolder": "1h",
                    "params": {
                        "method": "GET"
                    }
                }).done(function(e) {
                    const data = br_result(e).result;
                    if (data) {
                        if (data.error) {
                            tx_api_scan_fail(rd, api_data, rdo, data.error);
                            return
                        }
                        api_proxy({
                            "api": api_name,
                            "search": "quick-stats/",
                            "cachetime": rdo.cachetime,
                            "cachefolder": "1h",
                            "params": {
                                "method": "GET"
                            }
                        }).done(function(res) {
                            const e = br_result(res),
                                bh = q_obj(e, "result.latest_block.height");
                            const txd = nimiq_scan_data(data, rdo.setconfirmations, bh, null, rd.txhash);
                            if (txd) {
                                if (txd.ccval) {
                                    txdat = txd, counter = 1;
                                    if (source === "list") {
                                        const tx_listitem = append_tx_li(txd, rd.requesttype);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                        }
                                    }
                                }
                            }
                            scan_match(rd, api_data, rdo, counter, txdat);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            const error_object = errorThrown || jqXHR;
                            tx_api_scan_fail(rd, api_data, rdo, error_object);
                        });
                        return
                    }
                    tx_api_scan_fail(rd, api_data, rdo, default_error);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    const error_object = errorThrown || jqXHR;
                    tx_api_scan_fail(rd, api_data, rdo, error_object, true);
                }).always(function() {
                    set_api_src(rdo, api_data);
                });
            }
        }
    }
}

// ** kaspa API **

// This function fetches and processes transaction data for the Kaspa cryptocurrency.
// It handles both scanning for incoming transactions and polling for specific transaction details.
// The function supports multiple APIs (kaspa.org and kas.fyi) and adapts its behavior based on the API being used.
// It also manages the retrieval of the current bluescore for transaction confirmation calculations.
function kaspa_fetch_init(rd, api_data, rdo) {
    if (rdo.source === "acc_polling") {
        kaspa_fetch(rd, api_data, rdo, false);
        return
    }
    kaspa_fetch_blockheight(rd, api_data, rdo);
}

function kaspa_fetch_blockheight(rd, api_data, rdo) {
    api_proxy({
        "api": "kaspa.org",
        "search": "info/virtual-chain-blue-score",
        "cachetime": rdo.cachetime,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }).done(function(lb) {
        const lbdat = br_result(lb);
        if (lbdat) {
            const latestblock = q_obj(lbdat, "result.blueScore");
            if (latestblock) {
                kaspa_fetch(rd, api_data, rdo, latestblock);
                return
            }
        }
        tx_api_scan_fail(rd, api_data, rdo, default_error);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const error_object = errorThrown || jqXHR;
        tx_api_scan_fail(rd, api_data, rdo, error_object, true);
    }).always(function() {
        set_api_src(rdo, api_data);
    });
}

function kaspa_fetch(rd, api_data, rdo, blockheight) {
    const api_name = api_data.name,
        transactionlist = rdo.transactionlist,
        source = rdo.source;
    let counter = 0,
        txdat = false;
    if (rdo.pending === "scanning") { // scan incoming transactions on address
        api_proxy({
            "api": "kaspa.org",
            "search": "addresses/" + rd.address + "/full-transactions",
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "proxy": true,
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                if ($.isEmptyObject(data)) {
                    tx_api_scan_fail(rd, api_data, rdo, default_error);
                    return
                }
                const sortlist = sort_by_date(kaspa_scan_data, data);
                $.each(sortlist, function(dat, value) {
                    const txd = kaspa_scan_data(value, rd.address, rdo.setconfirmations, blockheight);
                    if (txd.transactiontime > rdo.request_timestamp && txd.ccval) {
                        txdat = txd;
                        if (source === "list") {
                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                            if (tx_listitem) {
                                transactionlist.append(tx_listitem.data(txd));
                                counter++;
                            }
                        }
                    }
                });
                scan_match(rd, api_data, rdo, counter, txdat);
                return
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object);
        }).always(function() {
            set_api_src(rdo, api_data);
        });
        return
    }
    if (rdo.pending === "polling") {
        if (rd.txhash) {
            api_proxy({
                "api": api_name,
                "search": "transactions/" + rd.txhash,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    if (data.error) {
                        tx_api_scan_fail(rd, api_data, rdo, data.error);
                        return
                    }
                    const txd = (api_name === "kaspa.org") ? kaspa_scan_data(data, rd.address, rdo.setconfirmations, blockheight) :
                        kaspa_poll_fyi_data(data, rd.address, rdo.setconfirmations); // kas.fyi
                    if (txd) {
                        if (txd.ccval) {
                            txdat = txd, counter = 1;
                            if (source === "list") {
                                const tx_listitem = append_tx_li(txd, rd.requesttype);
                                if (tx_listitem) {
                                    transactionlist.append(tx_listitem.data(txd));
                                }
                            }
                        }
                    }
                    scan_match(rd, api_data, rdo, counter, txdat);
                    return
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
        }
    }
}

// ** insight.dash.org **

// This function fetches and processes transaction data for Dash cryptocurrency using the Insight API.
// It handles both scanning for incoming transactions and polling for specific transaction details.
function insight_fetch_dash(rd, api_data, rdo) {
    const transactionlist = rdo.transactionlist;
    let counter = 0,
        txdat = false;
    if (rdo.pending === "scanning") { // scan incoming transactions on address
        api_proxy({
            "api": "dash.org",
            "search": "txs?address=" + rd.address,
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                if (data.error) {
                    tx_api_scan_fail(rd, api_data, rdo, data.error);
                    return
                }
                const all_tx = data.txs;
                if (all_tx && all_tx.length > 0) {
                    const sortlist = sort_by_date(insight_scan_data, all_tx);
                    $.each(sortlist, function(dat, value) {
                        const txd = insight_scan_data(value, rdo.setconfirmations, rd.address);
                        if (txd.transactiontime > rdo.request_timestamp && txd.ccval) {
                            txdat = txd;
                            if (rdo.source === "list") {
                                const tx_listitem = append_tx_li(txd, rd.requesttype);
                                if (tx_listitem) {
                                    transactionlist.append(tx_listitem.data(txd));
                                    counter++;
                                }
                            }
                        }
                    });
                }
                scan_match(rd, api_data, rdo, counter, txdat);
                return
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object, true);
        }).always(function() {
            set_api_src(rdo, api_data);
        });
    }
    if (rdo.pending === "polling") { // poll transaction id
        if (rd.txhash) {
            api_proxy({
                "api": "dash.org",
                "search": "tx/" + rd.txhash,
                "cachetime": rdo.cachetime,
                "cachefolder": "1h",
                "params": {
                    "method": "GET"
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    if (data.error) {
                        tx_api_scan_fail(rd, api_data, rdo, data.error);
                        return
                    }
                    const txd = insight_scan_data(data, rdo.setconfirmations, rd.address);
                    if (txd.ccval) {
                        txdat = txd, counter = 1;
                        if (rdo.source === "list") {
                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                            if (tx_listitem) {
                                transactionlist.append(tx_listitem.data(txd));
                            }
                        }
                    }
                    scan_match(rd, api_data, rdo, counter, txdat);
                    return
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object, true);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
        }
    }
}

// ** Node RPC's **

// ** mempool.space RPC **

// This function interacts with the mempool.space API to fetch and process Bitcoin transaction data.
// It handles both scanning for incoming transactions and polling for specific transaction details.
// The function also retrieves the latest block height for confirmation calculations.
function mempoolspace_rpc_init(rd, api_data, rdo, rpc) {
    if (rdo.source === "acc_polling") {
        mempoolspace_rpc(rd, api_data, rdo, rpc, false);
        return
    }
    mempoolspace_rpc_blockheight(rd, api_data, rdo, rpc);
}

function mempoolspace_rpc_blockheight(rd, api_data, rdo, rpc) {
    const url = api_data.url,
        endpoint = (rpc) ? url : "https://" + url;
    api_proxy({ // get latest blockheight
        "api_url": endpoint + "/api/blocks/tip/height",
        "proxy": false,
        "params": {
            "method": "GET"
        }
    }).done(function(lb) {
        const lbdat = br_result(lb);
        if (lbdat) {
            const latestblock = lbdat.result;
            if (latestblock) {
                mempoolspace_rpc(rd, api_data, rdo, rpc, latestblock);
                return
            }
        }
        tx_api_scan_fail(rd, api_data, rdo, default_error);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const error_object = errorThrown || jqXHR;
        tx_api_scan_fail(rd, api_data, rdo, error_object, true);
    }).always(function() {
        set_api_src(rdo, api_data);
    });
}

function mempoolspace_rpc(rd, api_data, rdo, rpc, latestblock) {
    const transactionlist = rdo.transactionlist,
        url = api_data.url,
        endpoint = (rpc) ? url : "https://" + url,
        requestid = rd.requestid,
        source = rdo.source;
    let counter = 0,
        txdat = false;
    setTimeout(function() {
        if (rdo.pending === "scanning") { // scan incoming transactions on address
            api_proxy({
                "api_url": endpoint + "/api/address/" + rd.address + "/txs",
                "proxy": false,
                "params": {
                    "method": "GET"
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    if ($.isEmptyObject(data)) {
                        api_callback(rdo);
                        return
                    }
                    const sortlist = sort_by_date(mempoolspace_scan_data, data);
                    $.each(sortlist, function(dat, value) {
                        if (value.txid) { // filter outgoing transactions
                            const txd = mempoolspace_scan_data(value, rdo.setconfirmations, rd.currencysymbol, rd.address, latestblock);
                            if (txd.transactiontime > rdo.request_timestamp && txd.ccval) {
                                txdat = txd;
                                if (source === "list") {
                                    const tx_listitem = append_tx_li(txd, rd.requesttype);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(txd));
                                        counter++;
                                    }
                                }
                            }
                        }
                    });
                    scan_match(rd, api_data, rdo, counter, txdat);
                    return
                }
                tx_api_scan_fail(rd, api_data, rdo, default_error);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const error_object = errorThrown || jqXHR;
                tx_api_scan_fail(rd, api_data, rdo, error_object);
            }).always(function() {
                set_api_src(rdo, api_data);
            });
            return
        }
        api_proxy({ // poll mempool.space transaction id
            "api_url": endpoint + "/api/tx/" + rd.txhash,
            "proxy": false,
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                const txd = mempoolspace_scan_data(data, rdo.setconfirmations, rd.currencysymbol, rd.address, latestblock);
                if (txd) {
                    if (txd.ccval) {
                        txdat = txd, counter = 1;
                        if (source === "list") {
                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                            if (tx_listitem) {
                                transactionlist.append(tx_listitem.data(txd));
                            }
                        }
                    }
                }
                scan_match(rd, api_data, rdo, counter, txdat);
                return
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object);
        });
    }, 500);
}

// ** infura RPC **

// This function interacts with Infura or similar Ethereum RPC providers to fetch and process transaction data.
// It handles both ERC20 and regular Ethereum transactions, retrieving block information and calculating confirmations.
function infura_txd_rpc(rd, api_data, rdo) {
    const thislist = rdo.thislist,
        transactionlist = rdo.transactionlist,
        statuspanel = rdo.statuspanel,
        rpcurl = get_rpc_url(api_data),
        layer2 = api_data.network,
        set_url = layer2 ? api_data.url : rpcurl || glob_main_eth_node,
        txhash = rd.txhash;
    let counter = 0,
        txdat = false;
    api_proxy(eth_params(set_url, 25, "eth_blockNumber", [])).done(function(a) {
        const r_1 = inf_result(a);
        api_proxy(eth_params(set_url, 25, "eth_getTransactionByHash", [txhash])).done(function(b) {
            const r_2 = inf_result(b);
            if (r_2) {
                const this_bn = r_2.blockNumber;
                api_proxy(eth_params(set_url, 25, "eth_getBlockByNumber", [this_bn, false])).done(function(c) {
                    const r_3 = inf_result(c);
                    if (r_3) {
                        const tbn = Number(this_bn),
                            cbn = r_1 ? Number(r_1) : false,
                            conf = cbn ? cbn - tbn : -1,
                            conf_correct = conf < 0 ? 0 : conf;
                        let txd = null;
                        if (rd.erc20 === true) {
                            const input = r_2.input;
                            if (str_match(input, rd.address.slice(3)) === true) {
                                const signature_hex = input.slice(2, 10),
                                    address_hex = input.slice(10, 74),
                                    amount_hex = input.slice(74),
                                    tokenValue = hexToNumberString(amount_hex),
                                    txdata = {
                                        "timestamp": r_3.timestamp,
                                        "hash": txhash,
                                        "confirmations": conf_correct,
                                        "value": tokenValue,
                                        "decimals": rd.decimals
                                    };
                                txd = infura_erc20_poll_data(txdata, rdo.setconfirmations, rd.currencysymbol, layer2);
                            } else {
                                tx_api_scan_fail(rd, api_data, rdo, default_error); // scan l2's
                                return
                            }
                        } else {
                            const txdata = {
                                "timestamp": Number(r_3.timestamp),
                                "hash": txhash,
                                "confirmations": conf_correct,
                                "value": Number(r_2.value)
                            };
                            txd = infura_eth_poll_data(txdata, rdo.setconfirmations, rd.currencysymbol, layer2);
                        }
                        if (txd.ccval) {
                            txdat = txd, counter = 1;
                            if (rdo.source === "list") {
                                const tx_listitem = append_tx_li(txd, rd.requesttype);
                                if (tx_listitem) {
                                    transactionlist.append(tx_listitem.data(txd));
                                }
                            }
                        }
                        scan_match(rd, api_data, rdo, counter, txdat);
                        return
                    }
                    tx_api_scan_fail(rd, api_data, rdo, default_error); // scan l2's
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    const error_object = errorThrown || jqXHR;
                    tx_api_scan_fail(rd, api_data, rdo, error_object);
                });
                return
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error); // scan l2's
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object);
        });
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const error_object = errorThrown || jqXHR;
        tx_api_scan_fail(rd, api_data, rdo, error_object, true);
    }).always(function() {
        set_api_src(rdo, api_data);
    });
}

// This function extracts the result from a nested JSON response typically returned by Infura or similar services.
function inf_result(r) {
    const ir1 = br_result(r);
    if (ir1) {
        const ir2 = ir1.result;
        if (ir2) {
            return ir2.result;
        }
    }
    return false;
}

// This function generates an error message for failed Ethereum RPC requests.
function inf_err(set_url) {
    return "error fetching data from " + set_url;
}

// This function prepares the parameters for Ethereum RPC requests, supporting different node types (Infura, Arbitrum, custom).
function eth_params(set_url, cachetime, method, params) {
    const payload = {
        "cachetime": cachetime,
        "cachefolder": "1h",
        "params": {
            "method": "POST",
            "data": JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": method,
                "params": params
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }
    }
    if (set_url === glob_main_eth_node) {
        $.extend(payload, {
            "api": "infura"
        });
    } else if (set_url === glob_main_arbitrum_node) {
        $.extend(payload, {
            "api": "arbitrum"
        });
    } else if (set_url === glob_main_polygon_node) {
        $.extend(payload, {
            "api": "polygon"
        });
    } else {
        $.extend(payload, {
            "api_url": set_url,
            "proxy": false
        });
    }
    return payload;
}

// ** Nano RPC **

// This function interacts with a Nano RPC node to fetch and process transaction data.
// It handles both scanning for incoming transactions and polling for specific transaction details.
function nano_rpc(rd, api_data, rdo) {
    const transactionlist = rdo.transactionlist,
        source = rdo.source;
    let counter = 0,
        txdat = false;
    if (rdo.pending === "scanning") { // scan incoming transactions on address
        api_proxy({
            "api": "nano",
            "search": "account",
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "custom": "nano_txd",
            "api_url": api_data.url,
            "proxy": true,
            "params": {
                "method": "POST",
                "cache": true,
                "data": JSON.stringify({
                    "account": rd.address,
                    "node": api_data.url
                })
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data && !$.isEmptyObject(data)) {
                if (data.error) {
                    tx_api_scan_fail(rd, api_data, rdo, data.error);
                    return
                }
                $.each(data, function(data, value) {
                    const txd = nano_scan_data(value, rdo.setconfirmations, rd.currencysymbol);
                    if ((txd.transactiontime > rdo.request_timestamp) && txd.ccval && (value.subtype === "receive" || value.receivable)) {
                        txdat = txd;
                        if (source === "list") {
                            const tx_listitem = append_tx_li(txd, rd.requesttype);
                            if (tx_listitem) {
                                transactionlist.append(tx_listitem.data(txd));
                                counter++;
                            }
                        }
                    }
                });
                scan_match(rd, api_data, rdo, counter, txdat);
                return
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object, true);
        }).always(function() {
            set_api_src(rdo, api_data);
        });
        return
    }
    if (rdo.pending === "polling") {
        api_proxy({
            "api": "nano",
            "search": "block",
            "cachetime": rdo.cachetime,
            "cachefolder": "1h",
            "api_url": api_data.url,
            "params": {
                "method": "POST",
                "cache": true,
                "data": JSON.stringify({
                    "action": "block_info",
                    "json_block": true,
                    "hash": rd.txhash
                })
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                if (data.error) {
                    tx_api_scan_fail(rd, api_data, rdo, data.error);
                    return
                }
                const txd = nano_scan_data(data, rdo.setconfirmations, rd.currencysymbol, rd.txhash);
                if (txd.ccval) {
                    txdat = txd, counter = 1;
                    if (source === "list") {
                        const tx_listitem = append_tx_li(txd, rd.requesttype);
                        if (tx_listitem) {
                            transactionlist.append(tx_listitem.data(txd));
                        }
                    }
                }
                scan_match(rd, api_data, rdo, counter, txdat);
                return
            }
            tx_api_scan_fail(rd, api_data, rdo, default_error);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const error_object = errorThrown || jqXHR;
            tx_api_scan_fail(rd, api_data, rdo, error_object, true);
        }).always(function() {
            set_api_src(rdo, api_data);
        });
    }
}

// ** sort transactions by date **

// This function sorts a list of transactions by date in descending order.
function sort_by_date(func, list, rdo, rd) {
    return $(list).sort(function(a, b) {
        const txd1 = func(a, "sort"),
            txd2 = func(b, "sort");
        return txd2 - txd1; // descending order
    });
}

// This function returns a default transaction data object with null or default values.
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

// ** Unifications

// This function processes blockchain.info websocket data and returns a unified transaction object.
function blockchain_ws_data(data, setconfirmations, ccsymbol, address, legacy) { // poll blockchain.info websocket data
    if (data) {
        try {
            const outputs = data.out;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, value) {
                    if (address === value.addr || "bitcoincash:" + address === value.addr || legacy === value.addr) {
                        outputsum += value.value || 0; // sum of outputs
                    }
                });
            }
            const transactiontime = data.time ? data.time * 1000 : null,
                transactiontime_utc = transactiontime ? transactiontime + glob_timezone : null;
            return {
                "ccval": outputsum ? outputsum / 1e8 : null,
                "transactiontime": transactiontime_utc,
                "txhash": data.hash,
                "confirmations": data.confirmations || 0,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing blockchain.info websocket data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes mempool.space websocket data and returns a unified transaction object.
function mempoolspace_ws_data(data, setconfirmations, ccsymbol, address) { // poll mempool.space websocket data
    if (data) {
        try {
            const outputs = data.vout;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, value) {
                    if (address === value.scriptpubkey_address) {
                        outputsum += value.value || 0; // sum of outputs
                    }
                });
            }
            const transactiontime = data.firstSeen ? data.firstSeen * 1000 : null,
                transactiontime_utc = transactiontime ? transactiontime + glob_timezone : null;
            return {
                "ccval": outputsum ? outputsum / 1e8 : null,
                "transactiontime": transactiontime_utc,
                "txhash": data.txid,
                "confirmations": data.confirmations || 0,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing mempool.space websocket data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes mempool.space API data for scanning or polling and returns a unified transaction object.
function mempoolspace_scan_data(data, setconfirmations, ccsymbol, address, latestblock) { // scan/poll mempool.space api data
    if (data) {
        try {
            const status = data.status,
                transactiontime = status.block_time ? status.block_time * 1000 : now(),
                transactiontime_utc = transactiontime ? transactiontime + glob_timezone : null;
            if (setconfirmations === "sort") {
                return transactiontime_utc;
            }
            const outputs = data.vout;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, value) {
                    if (value.scriptpubkey_address.indexOf(address) > -1) {
                        outputsum += value.value || 0; // sum of outputs
                    }
                });
            }
            const block_height = status.block_height,
                confs = status.confirmed ? setconfirmations : 0,
                conf = (block_height && block_height > 10 && latestblock) ? (latestblock - block_height) + 1 : confs;
            return {
                "ccval": outputsum ? outputsum / 1e8 : null,
                "transactiontime": transactiontime_utc,
                "txhash": data.txid,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing mempool.space data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes dogechain websocket data and returns a unified transaction object.
function dogechain_ws_data(data, setconfirmations, ccsymbol, address) { // poll blockchain.info websocket data
    if (data) {
        try {
            const outputs = data.outputs;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, value) {
                    if (address === value.addr) {
                        outputsum += value.value || 0; // sum of outputs
                    }
                });
            }
            const transactiontime = data.time ? data.time * 1000 : now(),
                transactiontime_utc = transactiontime ? transactiontime + glob_timezone : null;
            return {
                "ccval": outputsum ? outputsum / 1e8 : null,
                "transactiontime": transactiontime_utc,
                "txhash": data.hash || null,
                "confirmations": data.confirmations || 0,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing dogechain data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes blockcypher API data for scanning and returns a unified transaction object.
function blockcypher_scan_data(data, setconfirmations, ccsymbol) { // scan
    if (data) {
        try {
            const datekey = (data.confirmed) ? data.confirmed : (data.received) ? data.received : false,
                transactiontime = to_ts(datekey);
            if (setconfirmations === "sort") {
                return transactiontime;
            }
            let double_spend = false;
            const is_eth = ccsymbol === "eth",
                ccval = data.value ? (is_eth ? parseFloat((data.value / 1e18).toFixed(8)) : data.value / 1e8) : null,
                txhash = data.tx_hash,
                txhash_mod = txhash && is_eth ? (txhash.startsWith("0x") ? txhash : "0x" + txhash) : txhash,
                conf = data.confirmations || 0;
            double_spend = !!data.double_spend; // double spend proof
            return {
                "ccval": ccval,
                "transactiontime": transactiontime,
                "txhash": txhash_mod,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": double_spend,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing blockcypher data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Insight API data for scanning and returns a unified transaction object for Dash cryptocurrency.
function insight_scan_data(data, setconfirmations, address) { // scan
    if (data) {
        try {
            const transactiontime = (data.time) ? data.time : (data.blocktime) ? data.blocktime : false,
                txtime = transactiontime ? transactiontime * 1000 : now(),
                transactiontime_utc = txtime ? txtime + glob_timezone : null;
            if (setconfirmations === "sort") {
                return transactiontime_utc;
            }
            const outputs = data.vout;
            let outputsum = null;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, value) {
                    const addrlist = q_obj(value, "scriptPubKey.addresses");
                    if (addrlist) {
                        if (addrlist.indexOf(address) > -1) {
                            outputsum += parseFloat(value.value) || 0; // sum of outputs
                        }
                    }
                });
            }
            const txhash = data.txid || null,
                conf = data.confirmations || 0,
                instant_lock = !!data.txlock; // instant transactions
            return {
                "ccval": outputsum,
                "transactiontime": transactiontime_utc,
                "txhash": txhash,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": instant_lock,
                "ccsymbol": "dash"
            };
        } catch (err) {
            console.error("Error processing Blockchair Insight API data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes BlockCypher API data for polling and returns a unified transaction object.
function blockcypher_poll_data(data, setconfirmations, ccsymbol, address) { // poll
    if (data) {
        try {
            const is_eth = ccsymbol === "eth",
                transactiontime = to_ts(data.received),
                outputs = data.outputs;
            let outputsum,
                double_spend = false;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, value) {
                    const satval = value.value;
                    output = (str_match(address, value.addresses[0].slice(3)) === true) ? Math.abs(satval) : 0;
                    outputsum += parseFloat(output) || 0; // sum of outputs
                });
            }
            const ccval = outputs ? (is_eth ? parseFloat((outputsum / 1e18).toFixed(8)) : outputsum / 1e8) : null,
                txhash = data.hash,
                txhash_mod = txhash && is_eth ? (txhash.startsWith("0x") ? txhash : "0x" + txhash) : txhash,
                conf = data.confirmations || 0;
            double_spend = !!data.double_spend;
            return {
                "ccval": ccval,
                "transactiontime": transactiontime,
                "txhash": txhash_mod,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": double_spend,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing Blockcypher ERC20 data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes blockchain.info API data for scanning/polling and returns a unified transaction object.
function blockchaininfo_scan_data(data, setconfirmations, ccsymbol, address, latestblock) { // scan/poll
    if (data) {
        try {
            const transactiontime = data.time ? data.time * 1000 : null,
                transactiontime_utc = transactiontime ? transactiontime + glob_timezone : now();
            if (setconfirmations === "sort") {
                return transactiontime;
            }
            const block_id = q_obj(data, "block.height"),
                conf_calc = (block_id && block_id > 10 && latestblock) ? (latestblock - block_id) + 1 : 0,
                conf = latestblock ? conf_calc : 0,
                confirmations = q_obj(data, "block.mempool") ? 0 : conf,
                outputs = data.outputs;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, val) {
                    const output = str_match(val.address, address) ? Math.abs(val.value) : 0;
                    outputsum += parseFloat(output) || 0; // sum of outputs
                });
            }
            const ccval = outputs ? outputsum / 1e8 : null,
                txhash = data.txid || null;
            return {
                "ccval": ccval,
                "transactiontime": transactiontime_utc,
                "txhash": txhash,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing blockchain.info data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Blockchair API data for scanning/polling and returns a unified transaction object.
function blockchair_scan_data(data, setconfirmations, ccsymbol, address, latestblock) { // scan/poll
    if (data) {
        try {
            const transaction = data.transaction;
            if (transaction) {
                const transactiontime = transaction.time ? returntimestamp(transaction.time).getTime() : null;
                if (setconfirmations === "sort") {
                    return transactiontime;
                }
                const block_id = transaction.block_id,
                    conf = (block_id && block_id > 10 && latestblock) ? (latestblock - block_id) + 1 : 0,
                    outputs = data.outputs;
                let outputsum;
                if (outputs) {
                    outputsum = 0;
                    $.each(outputs, function(dat, val) {
                        const satval = val.value,
                            output = (val.recipient === address) ? Math.abs(satval) : 0;
                        outputsum += parseFloat(output) || 0; // sum of outputs
                    });
                }
                const ccval = outputs ? outputsum / 1e8 : null,
                    txhash = transaction.hash || null,
                    instant_lock = !!transaction.is_instant_lock; // instant transactions
                return {
                    "ccval": ccval,
                    "transactiontime": transactiontime,
                    "txhash": txhash,
                    "confirmations": conf,
                    "setconfirmations": setconfirmations,
                    "double_spend": false,
                    "instant_lock": instant_lock,
                    "ccsymbol": ccsymbol
                };
            }
        } catch (err) {
            console.error("Error processing Blockchair data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Blockchair API data for Ethereum transactions and returns a unified transaction object.
function blockchair_eth_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan/poll
    if (data) {
        try {
            const transactiontime = (data.time) ? returntimestamp(data.time).getTime() : null;
            if (setconfirmations === "sort") {
                return transactiontime;
            }
            const ethvalue = data.value ? parseFloat((data.value / 1e18).toFixed(8)) : null;
            txhash = data.transaction_hash || null,
                conf = (data.block_id && latestblock) ? latestblock - data.block_id : 0,
                recipient = data.recipient || null;
            return {
                "ccval": ethvalue,
                "transactiontime": transactiontime,
                "txhash": txhash,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol,
                "recipient": recipient
            };
        } catch (err) {
            console.error("Error processing Blockchair Eth data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Blockchair API data for ERC20 token transactions and returns a unified transaction object.
function blockchair_erc20_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan
    if (data) {
        try {
            const transactiontime = (data.time) ? returntimestamp(data.time).getTime() : null;
            if (setconfirmations === "sort") {
                return transactiontime;
            }
            const erc20value = data.value ? parseFloat((data.value / (10 ** data.token_decimals)).toFixed(8)) : null,
                txhash = data.transaction_hash || null,
                conf = (data.block_id && latestblock) ? latestblock - data.block_id : 0,
                recipient = data.recipient || null,
                token_symbol = data.token_symbol || null;
            return {
                "ccval": erc20value,
                "transactiontime": transactiontime,
                "txhash": txhash,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "ccsymbol": ccsymbol,
                "double_spend": false,
                "instant_lock": false,
                "recipient": recipient,
                "token_symbol": token_symbol
            };
        } catch (err) {
            console.error("Error processing Blockchair ERC20 data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Blockchair API data for polling ERC20 token transactions and returns a unified transaction object.
function blockchair_erc20_poll_data(data, setconfirmations, ccsymbol, latestblock) { // poll
    if (data) {
        try {
            const transaction = data.transaction,
                tokendata = data.layer_2.erc_20[0];
            if (transaction && tokendata) {
                const transactiontime = transaction.time ? returntimestamp(transaction.time).getTime() : null,
                    erc20value = tokendata.value ? parseFloat((tokendata.value / (10 ** tokendata.token_decimals)).toFixed(8)) : null,
                    txhash = transaction.hash || null,
                    conf = (transaction.block_id && latestblock) ? latestblock - transaction.block_id : 0;
                return {
                    "ccval": erc20value,
                    "transactiontime": transactiontime,
                    "txhash": txhash,
                    "confirmations": conf,
                    "setconfirmations": setconfirmations,
                    "double_spend": false,
                    "instant_lock": false,
                    "ccsymbol": ccsymbol
                };
            }
        } catch (err) {
            console.error("Error processing Blockchair ERC20 data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// arbiscan

// This function processes Arbiscan API data for ERC20 token transactions on Arbitrum and returns a unified transaction object.
function omniscan_scan_data(data, setconfirmations, ccsymbol, eth_layer2) { // scan
    if (data) {
        try {
            const transactiontime = data.timeStamp ? data.timeStamp * 1000 : null,
                transactiontime_utc = transactiontime ? transactiontime + glob_timezone : null;
            if (setconfirmations === "sort") {
                return transactiontime_utc;
            }
            const erc20value = data.value ? parseFloat((data.value / (10 ** data.tokenDecimal)).toFixed(8)) : null,
                txhash = data.hash || null;
            return {
                "ccval": erc20value,
                "transactiontime": transactiontime_utc,
                "txhash": txhash,
                "confirmations": data.confirmations,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol,
                eth_layer2
            };
        } catch (err) {
            console.error("Error processing Arbiscan ERC20 data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Arbiscan API data for Ethereum transactions on Arbitrum and returns a unified transaction object.
function omniscan_scan_data_eth(data, setconfirmations, eth_layer2) { // scan
    if (data) {
        try {
            const transactiontime = data.timeStamp ? data.timeStamp * 1000 : null,
                transactiontime_utc = transactiontime ? transactiontime + glob_timezone : null;
            if (setconfirmations === "sort") {
                return transactiontime_utc;
            }
            const ethvalue = data.value ? parseFloat((data.value / 1e18).toFixed(8)) : null,
                txhash = data.hash || null;
            return {
                "ccval": ethvalue,
                "transactiontime": transactiontime_utc,
                "txhash": txhash,
                "confirmations": data.confirmations,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": "eth",
                eth_layer2
            };
        } catch (err) {
            console.error("Error processing Arbiscan Eth data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Ethplorer API data for ERC20 token transactions and returns a unified transaction object.
function ethplorer_scan_data(data, setconfirmations, ccsymbol, eth_layer2) { // scan
    if (data) {
        try {
            const transactiontime = data.timestamp ? data.timestamp * 1000 : null,
                transactiontime_utc = transactiontime ? transactiontime + glob_timezone : null;
            if (setconfirmations === "sort") {
                return transactiontime_utc;
            }
            const erc20value = data.value ? parseFloat((data.value / (10 ** data.tokenInfo.decimals)).toFixed(8)) : null
            txhash = data.transactionHash || null;
            return {
                "ccval": erc20value,
                "transactiontime": transactiontime_utc,
                "txhash": txhash,
                "confirmations": 0,
                "setconfirmations": false,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol,
                eth_layer2
            };
        } catch (err) {
            console.error("Error processing Ethplorer ERC20 data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Nano RPC data for scanning or polling and returns a unified transaction object.
function nano_scan_data(data, setconfirmations, ccsymbol, txhash) { // scan/poll
    if (data) {
        try {
            const transactiontime = (data.local_timestamp) ? (data.local_timestamp * 1000) + glob_timezone : null,
                transactiontime_utc = (transactiontime) ? transactiontime : now_utc();
            if (setconfirmations === "sort") {
                return transactiontime_utc;
            }
            const ccval = data.amount ? parseFloat((data.amount / 1e30).toFixed(8)) : null, // convert Mnano to nano
                tx_hash = data.hash ? data.hash : txhash || null;
            return {
                "ccval": ccval,
                "transactiontime": transactiontime_utc,
                "txhash": tx_hash,
                "confirmations": 0,
                "setconfirmations": false,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing Nano RPC data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Bitcoin RPC data for polling and returns a unified transaction object.
function bitcoin_rpc_data(data, setconfirmations, ccsymbol, address) { // poll
    if (data) {
        try {
            const transactiontime = (data.time) ? (data.time * 1000) + glob_timezone : null,
                outputs = data.vout;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, value) {
                    const satval = value.value * 1e8,
                        output = (value.scriptPubKey.addresses[0] === address) ? Math.abs(satval) : 0;
                    outputsum += parseFloat(output) || 0; // sum of outputs
                });
            }
            const ccval = outputs ? outputsum / 1e8 : null,
                txhash = data.txid || null,
                conf = data.confirmations || 0;
            return {
                "ccval": ccval,
                "transactiontime": transactiontime,
                "txhash": txhash,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing Bitcoin RPC data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Infura API data for Ethereum transactions and returns a unified transaction object.
function infura_eth_poll_data(data, setconfirmations, ccsymbol, eth_layer2) { // poll
    if (data) {
        try {
            const transactiontime = data.timestamp ? (data.timestamp * 1000) + glob_timezone : null,
                ethvalue = data.value ? parseFloat((data.value / 1e18).toFixed(8)) : null,
                txhash = data.hash || null,
                conf = data.confirmations || 0;
            return {
                "ccval": ethvalue,
                "transactiontime": transactiontime,
                "txhash": txhash,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol,
                eth_layer2
            };
        } catch (err) {
            console.error("Error processing Infura Eth data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Infura API data for ERC20 token transactions and returns a unified transaction object.
function infura_erc20_poll_data(data, setconfirmations, ccsymbol, eth_layer2) { // poll
    if (data) {
        try {
            const tokenValue = data.value || null,
                decimals = data.decimals || null,
                ccval = decimals ? parseFloat((tokenValue / 10 ** decimals).toFixed(8)) : null,
                transactiontime = data.timestamp ? (data.timestamp * 1000) + glob_timezone : null,
                txhash = data.hash || null,
                conf = data.confirmations || 0;
            return {
                "ccval": ccval,
                "transactiontime": transactiontime,
                "txhash": txhash,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol,
                eth_layer2
            };
        } catch (err) {
            console.error("Error processing Infura ERC20 data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Infura block data for Ethereum transactions and returns a unified transaction object.
function infura_block_data(data, setconfirmations, ccsymbol, ts) {
    if (data) {
        try {
            const ccval = data.value ? parseFloat((Number(data.value) / 1e18).toFixed(8)) : null,
                transactiontime = ts ? (Number(ts) * 1000) + glob_timezone : now(),
                transactiontime_utc = transactiontime ? transactiontime + glob_timezone : null;
            return {
                "ccval": ccval,
                "transactiontime": transactiontime_utc,
                "txhash": data.hash,
                "confirmations": 0,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol
            };
        } catch (err) {
            console.error("Error processing Infura eth block data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Monero (XMR) transaction data and returns a unified transaction object.
function xmr_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan
    if (data) {
        try {
            const transactiontime = to_ts(data.timestamp);
            if (setconfirmations === "sort") {
                return transactiontime;
            }
            const recieved = data.total_received,
                height = data.height || latestblock,
                blocks = latestblock - height,
                conf = (blocks < 0) ? 0 : blocks,
                payment_id = data.payment_id || false;
            return {
                "ccval": recieved / 1e12,
                "transactiontime": transactiontime,
                "txhash": data.hash,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": ccsymbol,
                "payment_id": payment_id
            };
        } catch (err) {
            console.error("Error processing XMR data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Monero (XMR) transaction data from Blockchair API and returns a unified transaction object.
function blockchair_xmr_data(data, setconfirmations) {
    if (data) {
        try {
            const transactiontime = (data.tx_timestamp) ? (data.tx_timestamp * 1000) + glob_timezone : null,
                outputs = data.outputs;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, value) {
                    if (value.match) {
                        outputsum += value.amount; // sum of outputs
                    }
                });
            }
            const payment_id = data.payment_id || false;
            return {
                "ccval": outputsum / 1e12,
                "transactiontime": transactiontime,
                "txhash": data.tx_hash,
                "confirmations": data.tx_confirmations,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": "xmr",
                "payment_id": payment_id
            };
        } catch (err) {
            console.error("Error processing Blockchair XMR data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Nimiq transaction data and returns a unified transaction object.
function nimiq_scan_data(data, setconfirmations, latestblock, confirmed, txhash) { // scan
    if (data) {
        try {
            const transactiontime = data.timestamp ? (data.timestamp * 1000) + glob_timezone : now_utc();
            if (setconfirmations === "sort") {
                return transactiontime;
            }

            const confval = confirmed ? 0 : data.confirmations || (latestblock && data.height ? Math.max(0, latestblock - data.height) : 0),
                conf = (confval < 0) ? 0 : confval,
                thash = txhash || data.hash || null,
                setconf = (confirmed) ? null : setconfirmations;
            return {
                "ccval": data.value / 1e5,
                "transactiontime": transactiontime,
                "txhash": thash,
                "confirmations": conf,
                "setconfirmations": setconf,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": "nim"
            };
        } catch (err) {
            console.error("Error processing Nimiq data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Kaspa transaction data and returns a unified transaction object.
function kaspa_scan_data(data, thisaddress, setconfirmations, latestblock) { // scan
    if (data) {
        try {
            const transactiontime = data.block_time + glob_timezone;
            if (setconfirmations === "sort") {
                return transactiontime;
            }
            const outputs = data.outputs,
                block_bluescore = data.accepting_block_blue_score,
                confblocks = (latestblock) ? latestblock - block_bluescore : null;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, val) {
                    const amount = val.amount,
                        output = (val.script_public_key_address === thisaddress) ? Math.abs(amount) : 0;
                    outputsum += parseFloat(output) || 0; // sum of outputs
                });
            }
            const ccval = (outputs) ? outputsum / 1e8 : null,
                conf_calc = data.is_accepted ? Math.max(0, confblocks || 0) : 0,
                conf = latestblock ? conf_calc : 0;
            return {
                "ccval": ccval,
                "transactiontime": transactiontime,
                "txhash": data.transaction_id,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": "kas"
            };
        } catch (err) {
            console.error("Error processing Kaspa data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Kaspa transaction data from kas.fyi API and returns a unified transaction object.
function kaspa_poll_fyi_data(data, thisaddress, setconfirmations) { // scan
    if (data) {
        try {
            const outputs = data.outputs;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, val) {
                    const amount = val.amount,
                        output = (val.scriptPublicKeyAddress === thisaddress) ? Math.abs(amount) : 0;
                    outputsum += parseFloat(output) || 0; // sum of outputs
                });
            }
            const ccval = outputs ? outputsum / 1e8 : null,
                conf = data.isAccepted || data.confirmations || 0;
            return {
                "ccval": ccval,
                "transactiontime": parseFloat(data.blockTime) + glob_timezone,
                "txhash": data.transactionId,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": "kas"
            };
        } catch (err) {
            console.error("Error processing Kaspa FYI data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Kaspa websocket transaction data and returns a unified transaction object.
function kaspa_ws_data(data, thisaddress) { // scan
    if (data) {
        try {
            const outputs = data.outputs;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, val) {
                    const amount = val[1],
                        output = (val[0] === thisaddress) ? Math.abs(amount) : 0;
                    outputsum += parseFloat(output) || 0; // sum of outputs
                });
            }
            const ccval = outputs ? outputsum / 1e8 : null,
                txhash = q_obj(data, "verboseData.transactionId");
            return {
                "ccval": ccval,
                "transactiontime": now_utc(),
                "txhash": data.txId,
                "confirmations": 0,
                "setconfirmations": false,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": "kas"
            };
        } catch (err) {
            console.error("Error processing Kaspa websocket data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Kaspa websocket data from kas.fyi and returns a unified transaction object.
function kaspa_fyi_ws_data(data, thisaddress) { // scan
    if (data) {
        try {
            const outputs = data.outputs;
            let outputsum;
            if (outputs) {
                outputsum = 0;
                $.each(outputs, function(dat, val) {
                    const amount = val.value,
                        output = (q_obj(val, "verboseData.scriptPublicKeyAddress") === thisaddress) ? Math.abs(amount) : 0;
                    outputsum += parseFloat(output) || 0; // sum of outputs
                });
            }
            const ccval = outputs ? outputsum / 1e8 : null,
                txhash = q_obj(data, "verboseData.transactionId");
            return {
                "ccval": ccval,
                "transactiontime": now_utc(),
                "txhash": txhash,
                "confirmations": 0,
                "setconfirmations": false,
                "double_spend": false,
                "instant_lock": false,
                "ccsymbol": "kas"
            };
        } catch (err) {
            console.error("Error processing Kaspa FYI websocket data:", err);
            return default_tx_data();
        }
    }
    return default_tx_data();
}

// This function processes Lightning Network transaction data and returns a unified transaction object.
function lnd_tx_data(data) { // poll
    const txtime = data.txtime || data.timestamp,
        amount = parseFloat(data.amount / 100000000000);
    return {
        "ccval": Math.abs(amount),
        "transactiontime": txtime + glob_timezone,
        "txhash": "lightning" + data.hash,
        "confirmations": data.conf,
        "setconfirmations": 1,
        "double_spend": false,
        "instant_lock": false,
        "ccsymbol": "btc",
        "status": data.status
    }
}

// This function formats request data and returns an object with various properties related to the transaction request.
function tx_data(rd) {
    const requestid = rd.requestid,
        thislist = $("#" + requestid),
        requestdate = rd.inout === "incoming" ? rd.timestamp : rd.requestdate,
        request_timestamp = requestdate - 30000, // 30 seconds compensation for unexpected results
        getconfirmations = rd.set_confirmations,
        setconfirmations = getconfirmations ? parseInt(getconfirmations) : 1,
        canceled = rd.status === "canceled",
        pending = canceled ? "scanning" : rd.pending,
        statuspanel = thislist.find(".pmetastatus"),
        transactionlist = thislist.find("ul.transactionlist");
    return {
        requestid,
        "thislist": thislist,
        "request_timestamp": request_timestamp,
        "setconfirmations": setconfirmations,
        "canceled": canceled,
        "pending": pending,
        "statuspanel": statuspanel,
        "transactionlist": transactionlist,
        "source": "list",
        "cachetime": 25
    }
}