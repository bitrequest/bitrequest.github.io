// pick API / RPC

//tx_polling_init
//tx_polling
//clear_tpto
//address_polling_init
//address_polling
//init_xmr_node
//ping_xmr_node
//confirmations
//clearpinging
//reset_recent

// pick API / RPC
// Initializes the payment monitoring process for a transaction
function tx_polling_init(tx_data, api_data) {
    glob_let.rpc_attempts = {};
    tx_polling(tx_data, api_data);
    glob_const.paymentdialogbox.addClass("transacting");
}

// Monitors the transaction status using the provided API data
function tx_polling(tx_data, api_dat) {
    const gets = geturlparameters();
    if (gets.xss) {
        return
    };
    if (tx_data) {
        if (!request) return;
        const txhash = tx_data.txhash;
        if (!txhash) return;
        if (!tx_data.setconfirmations) {
            confirmations(tx_data, true);
            return
        }
        const eth_layer2 = tx_data.eth_layer2;
        if (eth_layer2) {
            request.txhash = txhash;
            tx_polling_l2(eth_layer2, api_dat);
            return
        }
        tx_polling_l1(tx_data, api_dat);
    };
}

function tx_polling_l2(eth_layer2, api_dat) {
    clear_tpto();
    const to_time = api_dat ? 30000 : 10,
        l2_options = fertch_l2s(request.payment),
        api_data = api_dat || q_obj(l2_options, eth_layer2 + ".apis.selected"),
        ctracts = contracts(request.currencysymbol),
        contract = ctracts ? ctracts[eth_layer2] : false;
    glob_let.tpto = setTimeout(function() {
        omni_poll(api_data, contract);
    }, to_time, function() {
        clear_tpto();
    });
}

function tx_polling_l1(tx_data, api_dat) {
    clear_tpto();
    const to_time = api_dat ? 30000 : 10,
        api_data = api_dat || q_obj(helper, "api_info.data"),
        rdo = {
            "requestid": request.requestid,
            "pending": "polling",
            "txdat": tx_data,
            "source": "tx_polling",
            "setconfirmations": tx_data.set_confirmations,
            "cachetime": 25
        },
        rd = {
            "requestid": request.requestid,
            "payment": request.payment,
            "erc20": request.erc20,
            "txhash": request.txhash,
            "currencysymbol": request.currencysymbol,
            "address": request.address,
            "decimals": request.decimals,
            "viewkey": request.viewkey
        };
    glob_let.tpto = setTimeout(function() {
        continue_select(rd, api_data, rdo);
    }, to_time, function() {
        clear_tpto();
    });
}

// clear tx_polling timer
function clear_tpto() {
    clearTimeout(glob_let.tpto);
    glob_let.tpto = 0;
}

// poll address for incoming transactions
function address_polling_init(time_out, api_dat, retry) {
    const ping_id = request.address,
        timeout = time_out || 7000,
        api_data = api_dat || q_obj(helper, "api_info.data");
    if (api_data) {
        if (retry) {
            clearpinging(ping_id);
            address_polling(timeout, api_data);
        }
        socket_info({
            "url": api_data.name
        }, true);
        glob_let.pinging[ping_id] = setInterval(function() {
            address_polling(timeout, api_data);
        }, timeout);
        return
    }
    notify(translate("websocketoffline"), 500000, "yes");
}

function address_polling(timeout, api_data) {
    const rq_init = request.rq_init,
        request_ts_utc = rq_init + glob_const.timezone,
        request_ts = request_ts_utc - 15000, // 15 second margin
        set_confirmations = request.set_confirmations || 0,
        cachetime = (timeout - 1000) / 1000,
        rdo = {
            "requestid": request.requestid,
            "request_timestamp": request_ts,
            "setconfirmations": set_confirmations,
            "pending": "scanning",
            "erc20": request.erc20,
            "source": "addr_polling",
            timeout,
            cachetime
        };
    select_rpc(request, api_data, rdo);
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
                glob_let.pinging[address] = setInterval(function() {
                    poll_animate();
                    ping_xmr_node(cachetime, address, vk, request_ts);
                }, 12000);
                return
            }
        }
        notify(translate("notmonitored"), 500000, "yes");
    }).fail(function(xhr, stat, err) {
        if (get_next_proxy()) {
            init_xmr_node(cachetime, address, vk, request_ts);
            return
        }
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
        const data = br_result(e).result,
            transactions = data.transactions;
        if (!transactions) return;
        socket_info({
            "url": api_name
        }, true);
        const set_confirmations = q_obj(request, "set_confirmations") || 0,
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
                                tx_polling_init(txd, {
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
        if (get_next_proxy()) {
            ping_xmr_node(cachetime, address, vk, request_ts, txhash);
            return
        }
        clearpinging(address);
        notify(translate("websocketoffline"), 500000, "yes");
    });
}

// Handles transaction confirmations and updates the UI accordingly
function confirmations(tx_data, direct, ln) {
    const ccsymbol = tx_data.ccsymbol;
    if (ccsymbol) {
        let new_status = "pending";
        closeloader();
        clearTimeout(glob_let.request_timer);
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
                    receivedtime = receivedutc - glob_const.timezone,
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

                brstatuspanel.find("span.paymentdate").html(fulldateformat(new Date(receivedtime), langcode));
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
                            playsound(ccsymbol === "doge" ? glob_const.howl : glob_const.cashier);
                            const status_text = requesttype === "incoming" ? translate("paymentsent") : translate("paymentreceived");
                            pmd.addClass("transacting").attr("data-status", "paid");
                            brheader.text(status_text);
                            request.status = "paid",
                                request.pending = "polling";
                            saverequest(direct, ln);
                            $("span#ibstatus").fadeOut(500);
                            closenotify();
                            new_status = "paid";
                        } else {
                            if (!ln) {
                                playsound(glob_const.blip);
                            }
                            pmd.addClass("transacting").attr("data-status", "pending");
                            const bctext = ln ? translate("waitingforpayment") : translate("txbroadcasted");
                            brheader.text(bctext);
                            request.status = "pending",
                                request.pending = "polling";
                            saverequest(direct, ln);
                        }
                        brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                        return new_status;
                    }
                    if (!exact) {
                        brheader.text(translate("insufficientamount"));
                        pmd.addClass("transacting").attr("data-status", "insufficient");
                        request.status = "insufficient",
                            request.pending = "scanning";
                        saverequest(direct, ln);
                        brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                        new_status = "insufficient";
                    }
                    playsound(glob_const.funk);
                }
            }
        }
        return new_status;
    }
    return false;
}

// Clears pinging intervals
function clearpinging(s_id) {
    if (s_id) { // close this interval
        if (glob_let.pinging[s_id]) {
            clearInterval(glob_let.pinging[s_id]);
            delete glob_let.pinging[s_id]
        }
        return
    }
    if (!empty_obj(glob_let.pinging)) {
        $.each(glob_let.pinging, function(key, value) {
            clearInterval(value);
        });
        glob_let.pinging = {};
    }
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
                    if (empty_obj(lsrr_arr)) {
                        toggle_rr(false);
                    }
                }
            } catch (error) {
                console.error("Error parsing recent requests:", error);
            }
        }
    }
}