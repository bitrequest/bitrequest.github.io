// pick API / RPC

//pick_monitor
//api_monitor
//init_account_polling
//account_polling
//init_xmr_node
//ping_xmr_node
//omni_scan
//ping_omniscan
//omniscan_erc20
//ping_omniscan_erc20
//bnb_scan
//ping_bnb
//nimiq_poll
//confirmations
//reset_recent

// pick API / RPC
// Initializes the payment monitoring process for a transaction
function pick_monitor(tx_data, api_data) {
    const scanning = is_scanning();
    if (scanning) {
        glob_block_scan += 1;
        playsound(glob_funk);
        return
    }
    glob_api_attempts = {};
    glob_rpc_attempts = {};
    api_monitor(tx_data, api_data);
}

// Monitors the transaction status using the provided API data
function api_monitor(tx_data, api_dat) {
    const gets = geturlparameters();
    if (gets.xss) {
        return
    };
    if (tx_data) {
        confirmations(tx_data, true);
        if (!tx_data.setconfirmations) {
            return
        }
        if (!request) {
            return
        }
        const eth_layer2 = tx_data.eth_layer2,
            api_data = eth_layer2 ? api_dat : api_dat || q_obj(helper, "api_info.data"),
            retry = api_data ? true : false,
            rdo = {
                "requestid": request.requestid,
                "pending": "polling",
                "txdat": tx_data,
                "source": "poll",
                "setconfirmations": request.set_confirmations,
                "cachetime": 25
            },
            rd = {
                "requestid": request.requestid,
                "payment": request.payment,
                "erc20": request.erc20,
                "txhash": tx_data.txhash,
                "currencysymbol": request.currencysymbol,
                "address": gets.address,
                "decimals": request.decimals,
                "viewkey": request.viewkey,
                eth_layer2
            },
            to_time = tx_data.ccval ? 30000 : 10,
            timeout = setTimeout(function() {
                if (q_obj(api_data, "api") || eth_layer2) {
                    get_api_inputs(rd, rdo, api_data, retry);
                } else {
                    get_rpc_inputs(rd, rdo, api_data, retry);
                }
            }, to_time, function() {
                clearTimeout(timeout);
            });
        glob_paymentdialogbox.addClass("transacting");
    };
}

function init_account_polling(time_out, socket, cache, rpc, next_api) {
    const ping_id = request.address,
        timeout = time_out || 7000,
        api_data = next_api || q_obj(helper, "api_info.data");
    if (next_api) {
        clearpinging(ping_id);
        account_polling(timeout, socket, cache, rpc, api_data);
    }
    socket_info({
        "url": ""
    }, true);
    glob_pinging[ping_id] = setInterval(function() {
        account_polling(timeout, socket, cache, rpc, api_data);
    }, timeout);
}

function account_polling(timeout, socket, cache, rpc, api_data) {
    const rq_init = request.rq_init,
        request_ts_utc = rq_init + glob_timezone,
        request_ts = request_ts_utc - 15000, // 15 second margin
        set_confirmations = request.set_confirmations || 0,
        cachetime = cache ? (timeout - 1000) / 1000 : 0,
        rdo = {
            "requestid": request.requestid,
            "request_timestamp": request_ts,
            "setconfirmations": set_confirmations,
            "pending": "scanning",
            "erc20": request.erc20,
            "source": "acc_polling",
            socket,
            timeout,
            cachetime
        };
    if (rpc) {
        get_rpc_inputs(request, rdo, api_data);
    } else {
        get_api_inputs(request, rdo, api_data);
    }
    poll_animate();
    socket_info(api_data, true);
}

// Polling

// XMR Poll

// Initializes Monero node connection
function init_xmr_node(cachetime, address, vk, request_ts) {
    const payload = {
        "address": address,
        "view_key": vk,
        "create_account": true,
        "generated_locally": false
    };
    api_proxy({
        "api": "mymonero api",
        "search": "login",
        "cachetime": 25,
        "cachefolder": "1h",
        "proxy": true,
        "params": {
            "method": "POST",
            "data": JSON.stringify(payload),
            "headers": {
                "Content-Type": "application/json"
            }
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            const errormessage = data.Error;
            if (errormessage) {
                const error = errormessage || translate("invalidvk");
                popnotify("error", error);
                return
            }
            const start_height = data.start_height;
            if (start_height > -1) { // success!
                socket_info({
                    "url": "mymonero api"
                }, true);
                glob_pinging[address] = setInterval(function() {
                    ping_xmr_node(cachetime, address, vk, request_ts);
                }, 12000);
                return
            }
        }
        notify(translate("notmonitored"), 500000, "yes");
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const next_proxy = get_next_proxy();
        if (next_proxy) {
            init_xmr_node(cachetime, address, vk, request_ts);
            return
        }
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
        notify(translate("errorvk"));
    });
}

// Pings Monero node for transaction updates
function ping_xmr_node(cachetime, address, vk, request_ts, txhash) {
    if (!isopenrequest()) { // only when request is visible
        forceclosesocket();
        return;
    }
    const api_name = "mymonero api",
        payload = {
            "address": address,
            "view_key": vk
        };
    api_proxy({
        "api": api_name,
        "search": "get_address_txs",
        "cachetime": cachetime,
        "cachefolder": "1h",
        "proxy": true,
        "params": {
            "method": "POST",
            "data": JSON.stringify(payload),
            "headers": {
                "Content-Type": "application/json"
            }
        }
    }).done(function(e) {
        poll_animate();
        const data = br_result(e).result,
            transactions = data.transactions;
        if (!transactions) return;
        socket_info({
            "url": api_name
        }, true);
        const set_confirmations = request.set_confirmations || 0,
            txflip = transactions.reverse();
        $.each(txflip, function(dat, value) {
            const txd = xmr_scan_data(value, set_confirmations, "xmr", data.blockchain_height);
            if (txd) {
                if (txd.ccval) {
                    const tx_hash = txd.txhash;
                    if (tx_hash) {
                        if (txhash) {
                            if (txhash === tx_hash) {
                                confirmations(txd);
                            }
                            return
                        }
                        if (txd.transactiontime > request_ts) {
                            const requestlist = $("#requestlist > li.rqli"),
                                txid_match = filter_list(requestlist, "txhash", tx_hash); // check if txhash already exists
                            if (txid_match.length) {
                                return
                            }
                            confirmations(txd, true);
                            if (set_confirmations > 0) {
                                clearpinging(address);
                                pick_monitor(txd, {
                                    "api": true,
                                    "name": "blockchair_xmr",
                                    "display": true
                                });
                            }
                        }
                    }
                }
            }
        });
    }).fail(function() {
        clearpinging(address);
        notify(translate("websocketoffline"), 500000, "yes");
    });
}

// ETH Layer2's

// Initiates Arbitrum scanning
// Initiates Polygon scanning
function omni_scan(socket_node, address, request_ts) {
    set_l2_status(socket_node, true);
    glob_pinging[sha_sub(socket_node.name + address)] = setInterval(function() {
        poll_animate();
        ping_omniscan(socket_node, address, request_ts);
    }, 7000);
}

// Pings Arbiscan for transaction updates
// Pings polygonscan for transaction updates
function ping_omniscan(socket_node, address, request_ts) {
    if (!isopenrequest()) { // only when request is visible
        forceclosesocket();
        return;
    }
    const socket_name = socket_node.name;
    api_proxy({
        "api": socket_name,
        "search": "?module=account&action=txlist&address=" + address + "&startblock=0&endblock=latest&page=1&offset=10&sort=desc",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            const error = data.error;
            if (error) {
                set_l2_status(socket_node, false);
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
        set_l2_status(socket_node, false);
        handle_socket_fails(socket_node, address, sha_sub(socket_name + address), true);
    });
}

// Initiates Arbitrum scanning for erc20 tokens on arbiscan.io
// Initiates Polygon scanning for erc20 tokens on polygonscan.com
function omniscan_erc20(socket_node, address, request_ts, contract) {
    set_l2_status(socket_node, true);
    glob_pinging[contract] = setInterval(function() {
        poll_animate();
        ping_omniscan_erc20(socket_node, address, request_ts, contract);
    }, 7000);
}

// Pings Arbiscan for erc20 transaction updates
// Pings Polygonscan for erc20 transaction updates
// Pings Bscscan for erc20 transaction updates
function ping_omniscan_erc20(socket_node, address, request_ts, contract) {
    if (!isopenrequest()) { // only when request is visible
        forceclosesocket();
        return;
    }
    api_proxy({
        "api": socket_node.name,
        "search": "?module=account&action=tokentx&contractaddress=" + contract + "&address=" + address + "&page=1&offset=100&startblock=0&endblock=99999999&sort=asc",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            const error = data.error,
                message = data.message;
            if (error || message === "NOTOK") {
                set_l2_status(socket_node, false);
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
        set_l2_status(socket_node, false);
        handle_socket_fails(socket_node, address, contract, true);
    });
}

// Initiates BNB Smart Chain scanning
function bnb_scan(socket_node, address, request_ts, ccsymbol) {
    set_l2_status(socket_node, true);
    glob_pinging["bnb" + address] = setInterval(function() {
        poll_animate();
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
        set_l2_status(socket_node, false);
        handle_socket_fails(socket_node, address, "bnb" + address, true);
    });
}

// Initiates Nimiq polling
function nimiq_poll() {
    init_account_polling(5000, true);
}

// Initiates Dash.org polling
function dashorg_poll() {
    init_account_polling(5000, true);
}

// Handles transaction confirmations and updates the UI accordingly
function confirmations(tx_data, direct, ln) {
    const ccsymbol = tx_data.ccsymbol;
    if (ccsymbol) {
        let new_status = "pending";
        closeloader();
        clearTimeout(glob_request_timer);
        if (tx_data && tx_data.ccval) {
            const pmd = $("#paymentdialogbox"),
                brstatuspanel = pmd.find(".brstatuspanel"),
                brheader = brstatuspanel.find("h2"),
                status = tx_data.status;
            if (status && status === "canceled") {
                brheader.html("<span class='icon-blocked'></span>Invoice canceled");
                pmd.attr("data-status", "canceled");
                updaterequest({
                    "requestid": request.requestid,
                    "status": "canceled",
                    "confirmations": 0
                }, true);
                notify(translate("invoicecanceled"), 500000);
                forceclosesocket();
                return "canceled";
            }
            const setconfirmations = tx_data.setconfirmations ? parseInt(tx_data.setconfirmations, 10) : 0,
                conf_text = setconfirmations ? setconfirmations.toString() : "",
                confbox = brstatuspanel.find("span.confbox"),
                confboxspan = confbox.find("span"),
                currentconf = parseFloat(confboxspan.attr("data-conf")),
                xconf = tx_data.confirmations || 0,
                txhash = tx_data.txhash,
                eth_layer2 = tx_data.eth_layer2,
                zero_conf = setconfirmations === false || tx_data.instant_lock; // Dashpay instant_lock

            brstatuspanel.find("span#confnumber").text(conf_text);
            new_status = xconf;

            if (xconf > currentconf || zero_conf === true || direct === true) {
                reset_recent();
                br_remove_session("txstatus"); // remove cached historical exchange rates
                confbox.removeClass("blob");
                setTimeout(function() {
                    confbox.addClass("blob");
                    confboxspan.text(xconf).attr("data-conf", xconf);
                }, 500);

                const amount_rel = $("#open_wallet").attr("data-rel"),
                    cc_raw = amount_rel && amount_rel.length ? parseFloat(amount_rel) : 0,
                    receivedutc = tx_data.transactiontime,
                    receivedtime = receivedutc - glob_timezone,
                    receivedcc = tx_data.ccval,
                    rccf = parseFloat(receivedcc.toFixed(6)),
                    thiscurrency = request.uoa,
                    requesttype = request.requesttype,
                    iscrypto = thiscurrency === ccsymbol,
                    fiatvalue = iscrypto ? null : (rccf / parseFloat($("#paymentdialogbox .ccpool").attr("data-xrate"))) * parseFloat($("#paymentdialog .cpool[data-currency='" + thiscurrency + "']").attr("data-xrate")), // calculate fiat value
                    fiatrounded = iscrypto ? null : fiatvalue.toFixed(2),
                    receivedrounded = iscrypto ? receivedcc : fiatrounded;

                // extend global request object
                $.extend(request, {
                    "received": true,
                    "inout": requesttype,
                    "receivedamount": rccf,
                    "fiatvalue": fiatvalue,
                    "paymenttimestamp": receivedutc,
                    "txhash": txhash,
                    "confirmations": xconf,
                    "set_confirmations": setconfirmations,
                    eth_layer2
                });

                brstatuspanel.find("span.paymentdate").html(fulldateformat(new Date(receivedtime), glob_langcode));
                if (!iscrypto) {
                    brstatuspanel.find("span.receivedcrypto").text(rccf + " " + ccsymbol);
                }
                brstatuspanel.find("span.receivedfiat").text(" (" + receivedrounded + " " + thiscurrency + ")");

                const exact = helper.exact,
                    xmr_pass = ccsymbol === "xmr" ? (rccf > (cc_raw * 0.97) && rccf < (cc_raw * 1.03)) : true; // error margin for xmr integrated addresses

                if (xmr_pass) {
                    const pass = exact && (rccf == cc_raw) ? true : (rccf >= (cc_raw * 0.97));
                    if (pass) {
                        if (xconf >= setconfirmations || zero_conf === true) {
                            forceclosesocket();
                            playsound(ccsymbol === "doge" ? glob_howl : glob_cashier);
                            const status_text = requesttype === "incoming" ? translate("paymentsent") : translate("paymentreceived");
                            pmd.addClass("transacting").attr("data-status", "paid");
                            brheader.text(status_text);
                            request.status = "paid",
                                request.pending = "polling";
                            saverequest(direct);
                            $("span#ibstatus").fadeOut(500);
                            closenotify();
                            new_status = "paid";
                        } else {
                            if (!ln) {
                                playsound(glob_blip);
                            }
                            pmd.addClass("transacting").attr("data-status", "pending");
                            const bctext = ln ? translate("waitingforpayment") : translate("txbroadcasted");
                            brheader.text(bctext);
                            request.status = "pending",
                                request.pending = "polling";
                            saverequest(direct);
                        }
                        brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                        return new_status;
                    }
                    if (!exact) {
                        brheader.text(translate("insufficientamount"));
                        pmd.addClass("transacting").attr("data-status", "insufficient");
                        request.status = "insufficient",
                            request.pending = "scanning";
                        saverequest(direct);
                        brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                        new_status = "insufficient";
                    }
                    playsound(glob_funk);
                }
            }
        }
        return new_status;
    }
    return false;
}

// Resets recent requests and cancels the current dialog
function reset_recent() {
    if (request) {
        const ls_recentrequests = br_get_local("recent_requests");
        if (ls_recentrequests) {
            try {
                const lsrr_arr = JSON.parse(ls_recentrequests);
                if (lsrr_arr[request.payment]) {
                    delete lsrr_arr[request.payment];
                    br_set_local("recent_requests", lsrr_arr, true);
                    if ($.isEmptyObject(lsrr_arr)) {
                        toggle_rr(false);
                    }
                }
            } catch (error) {
                console.error("Error parsing recent requests:", error);
            }
        }
    }
}