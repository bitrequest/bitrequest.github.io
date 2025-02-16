    //start_transaction_monitor
//route_transaction_monitor
//monitor_main_chain
//monitor_layer2_chain
//clear_polling_timeout
//start_address_monitor
//check_address_transactions
//connect_monero_node
//xmr_node_access
//start_monero_monitor
//check_monero_transactions
//validate_confirmations
//stop_monitors
//clear_recent_requests

// Initiates transaction monitoring and sets UI state for payment processing
function start_transaction_monitor(tx_data, api_data, retry) {
    reset_overflow();
    glob_let.rpc_attempts = {};
    glob_let.apikey_fails = false;
    route_transaction_monitor(tx_data, api_data, retry);
    glob_const.paymentdialogbox.addClass("transacting");
}

// Directs transaction monitoring to appropriate chain (L1/L2) based on transaction data
function route_transaction_monitor(tx_data, api_dat, retry) {
    const url_params = get_urlparameters();
    if (url_params.xss) {
        return
    }
    if (tx_data) {
        if (isopenrequest()) {
            if (request) {
                const tx_hash = tx_data.txhash;
                if (tx_hash) {
                    if (!tx_data.setconfirmations) {
                        validate_confirmations(tx_data, true);
                        return
                    }
                    const is_layer2 = tx_data.eth_layer2;
                    if (is_layer2) {
                        request.txhash = tx_hash;
                        monitor_layer2_chain(is_layer2, api_dat, retry);
                        return
                    }
                    monitor_main_chain(tx_data, api_dat, retry);
                    return
                }
            }
        }
    }
    glob_const.paymentdialogbox.removeClass("transacting");
}

// Monitors Layer 1 blockchain transactions with configurable retry intervals
function monitor_main_chain(tx_data, api_dat, retry) {
    clear_polling_timeout();
    const timeout = retry ? 10 : 30000,
        api_data = api_dat || q_obj(helper, "api_info.data"),
        rdo = { // request data object
            "requestid": request.requestid,
            "pending": "polling",
            "txdat": tx_data,
            "source": "tx_polling",
            "setconfirmations": tx_data.setconfirmations,
            "cachetime": 25
        },
        rd = { // custom request data
            "requestid": request.requestid,
            "payment": request.payment,
            "erc20": request.erc20,
            "txhash": tx_data.txhash || request.txhash,
            "currencysymbol": request.currencysymbol,
            "address": request.address,
            "decimals": request.decimals,
            "viewkey": request.viewkey
        };
    glob_let.tpto = setTimeout(function() {
        route_api_request(rd, api_data, rdo);
    }, timeout, function() {
        clear_polling_timeout();
    });
}

// Monitors Layer 2 blockchain transactions using network-specific API endpoints
function monitor_layer2_chain(eth_layer2, api_dat, retry) {
    clear_polling_timeout();
    const timeout = retry ? 10 : 30000,
        l2_config = get_layer2_config(request.payment),
        api_data = api_dat || get_network_node_config(request.payment, eth_layer2, l2_config[eth_layer2], "apis"),
        contracts_list = contracts(request.currencysymbol),
        contract = contracts_list ? contracts_list[eth_layer2] : false;
    glob_let.tpto = setTimeout(function() {
        start_layer2_polling(api_data, contract);
    }, timeout, function() {
        clear_polling_timeout();
    });
}

// Terminates the active transaction polling timeout
function clear_polling_timeout() {
    clearTimeout(glob_let.tpto);
    glob_let.tpto = 0;
}

// Sets up periodic monitoring of wallet address for incoming transactions
function start_address_monitor(time_out, api_dat, retry) {
    const addr_id = request.address,
        poll_interval = time_out || 7000,
        api_data = api_dat || q_obj(helper, "api_info.data");
    if (api_data) {
        if (retry) {
            stop_monitors(addr_id);
            check_address_transactions(poll_interval, api_data);
        }
        socket_info({
            "url": api_data.name
        }, true, true);
        glob_let.pinging[addr_id] = setInterval(function() {
            check_address_transactions(poll_interval, api_data);
        }, poll_interval);
        return
    }
    notify(tl("websocketoffline"), 500000, "yes");
}

// Executes a single polling cycle to check for new transactions at specified address
function check_address_transactions(timeout, api_data) {
    const init_time = request.rq_init,
        req_time_utc = init_time + glob_const.timezone,
        req_time = req_time_utc - 15000, // 15 second margin
        conf_required = request.set_confirmations || 0,
        cache_time = (timeout - 1000) / 1000,
        rdo = { // request data object
            "requestid": request.requestid,
            "request_timestamp": req_time,
            "setconfirmations": conf_required,
            "pending": "scanning",
            "erc20": request.erc20,
            "source": "addr_polling",
            timeout,
            "cachetime": cache_time
        };
    route_api_request(request, api_data, rdo);
    poll_animate();
    socket_info(api_data, true, true);
}

// Polling

// XMR Poll

// Establishes initial connection to Monero node with view key authentication
function connect_monero_node(cachetime, address, vk) {
    if (xmr_node_access(vk)) {
        start_monero_monitor(cachetime, address, vk);
        return
    }
    const payload = {
        "address": address,
        "view_key": vk,
        "create_account": true,
        "generated_locally": false
    }
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
        const response = br_result(e).result;
        if (response) {
            const error_msg = response.Error;
            if (error_msg) {
                const error = error_msg || tl("invalidvk");
                popnotify("error", error);
                return
            }
            const start_height = response.start_height;
            if (start_height > -1) { // success!
                set_xmr_node_access(vk);
                start_monero_monitor(cachetime, address, vk);
                return
            }
        }
        notify(tl("notmonitored"), 500000, "yes");
    }).fail(function(xhr, stat, err) {
        if (get_next_proxy()) {
            connect_monero_node(cachetime, address, vk);
            return
        }
        notify(tl("errorvk"));
    });
}

// Verifies if view key has existing authenticated session with Monero node
function xmr_node_access(vk) {
    if (vk) {
        const stored_keys = br_get_session("xmrvks", true);
        if (stored_keys) {
            if (stored_keys.includes(vk)) {
                return true;
            }
        }
    }
    return false;
}

// Creates periodic polling interval for Monero address monitoring
function start_monero_monitor(cachetime, address, vk) {
    const init_time = request.rq_init,
        req_time_utc = init_time + glob_const.timezone,
        req_time = req_time_utc - 10000; // 10 second compensation
    socket_info({
        "url": "mymonero api"
    }, true, true);
    glob_let.pinging[address] = setInterval(function() {
        poll_animate();
        check_monero_transactions(cachetime, address, vk, req_time);
    }, 12000);
}

// Queries Monero node for new transactions using view key authentication
function check_monero_transactions(cachetime, address, vk, request_ts) {
    if (!isopenrequest()) { // only when request is visible
        force_close_socket();
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
        const response = br_result(e).result;
        if (response.Error) {
            socket_info({
                "url": api_name
            }, false, true);
            stop_monitors(address);
            return
        }
        const txs = response.transactions;
        if (!txs) return;
        socket_info({
            "url": api_name
        }, true, true);
        const conf_required = q_obj(request, "set_confirmations") || 0,
            txs_reversed = txs.reverse(),
            recent_txs = txs_reversed.slice(0, 25); // get last 25 transactions
        $.each(recent_txs, function(dat, value) {
            const tx_data = xmr_scan_data(value, conf_required, "xmr", response.blockchain_height);
            if (tx_data.ccval && tx_data.transactiontime > request_ts) {
                const tx_exists = get_requestli("txhash", tx_data.txhash); // scan pending xmr tx's to prevent duplicates, mempool tx's don't have correct timestamps
                if (tx_exists.length) {
                    return false;
                }
                stop_monitors(address);
                start_transaction_monitor(tx_data, {
                    "api": true,
                    "name": "blockchair_xmr",
                    "display": true
                });
                return false;
            }
        });
    }).fail(function() {
        if (get_next_proxy()) {
            check_monero_transactions(cachetime, address, vk, request_ts);
            return
        }
        stop_monitors(address);
        notify(tl("websocketoffline"), 500000, "yes");
    });
}

// Updates UI and payment status based on transaction confirmation count
function validate_confirmations(tx_data, direct, ln) {
    const crypto_symbol = tx_data.ccsymbol;
    if (crypto_symbol) {
        let new_status = "pending";
        closeloader();
        clearTimeout(glob_let.request_timer);
        if (tx_data && tx_data.ccval) {
            const payment_dialog = $("#paymentdialogbox"),
                status_panel = payment_dialog.find(".brstatuspanel"),
                status_header = status_panel.find("h2"),
                tx_status = tx_data.status;
            if (tx_status && tx_status === "canceled") { // Lightning
                status_header.html("<span class='icon-blocked'></span>Invoice canceled");
                payment_dialog.attr("data-status", "canceled");
                update_request({
                    "requestid": request.requestid,
                    "status": "canceled",
                    "confirmations": 0
                }, true);
                notify(tl("invoicecanceled"), 500000);
                force_close_socket();
                return "canceled";
            }
            const required_confirms = tx_data.setconfirmations ? parseInt(tx_data.setconfirmations, 10) : 0,
                confirm_text = required_confirms ? required_confirms.toString() : "",
                confirm_box = status_panel.find("span.confbox"),
                confirm_span = confirm_box.find("span"),
                stored_confirms = parseFloat(confirm_span.attr("data-conf")),
                current_confirms = Number.isNaN(stored_confirms) ? 0 : stored_confirms,
                tx_confirms = tx_data.confirmations || 0,
                is_instant = required_confirms === false || tx_data.instant_lock; // Dashpay instant_lock

            status_panel.find("span#confnumber").text(confirm_text);
            new_status = tx_confirms;
            if (tx_confirms > current_confirms || is_instant === true || direct === true) {
                clear_recent_requests();
                br_remove_session("txstatus"); // remove cached historical exchange rates
                confirm_box.removeClass("blob");
                setTimeout(function() {
                    confirm_box.addClass("blob");
                    confirm_span.text(tx_confirms).attr("data-conf", tx_confirms);
                }, 500);

                const tx_hash = tx_data.txhash,
                    layer2_tx = tx_data.eth_layer2,
                    amount_rel = $("#open_wallet").attr("data-rel"),
                    crypto_amount = amount_rel && amount_rel.length ? parseFloat(amount_rel) : 0,
                    received_utc = tx_data.transactiontime,
                    received_local = received_utc - glob_const.timezone,
                    received_crypto = tx_data.ccval,
                    received_formatted = parseFloat(received_crypto.toFixed(6)),
                    current_currency = request.uoa,
                    request_type = request.requesttype,
                    is_crypto = current_currency === crypto_symbol,
                    fiat_value = is_crypto ? null : (received_formatted / parseFloat($("#paymentdialogbox .ccpool").attr("data-xrate"))) * parseFloat($("#paymentdialog .cpool[data-currency='" + current_currency + "']").attr("data-xrate")), // calculate fiat value
                    fiat_rounded = is_crypto ? null : fiat_value.toFixed(2),
                    received_amount = is_crypto ? received_crypto : fiat_rounded;

                // extend global request object
                $.extend(request, {
                    "received": true,
                    "inout": request_type,
                    "receivedamount": received_formatted,
                    "fiatvalue": fiat_value,
                    "paymenttimestamp": received_utc,
                    "txhash": tx_hash,
                    "confirmations": tx_confirms,
                    "set_confirmations": required_confirms,
                    eth_layer2: layer2_tx
                });

                status_panel.find("span.paymentdate").html(fulldateformat(new Date(received_local), langcode));
                if (!is_crypto) {
                    status_panel.find("span.receivedcrypto").text(received_formatted + " " + crypto_symbol);
                }
                status_panel.find("span.receivedfiat").text(" (" + received_amount + " " + current_currency + ")");

                const exact_match = helper.exact,
                    monero_valid = crypto_symbol === "xmr" ? (received_formatted > (crypto_amount * 0.97) && received_formatted < (crypto_amount * 1.03)) : true; // error margin for xmr integrated addresses

                if (monero_valid) {
                    const amount_valid = exact_match ? received_formatted === crypto_amount : received_formatted >= (crypto_amount * 0.97);
                    if (amount_valid) {
                        if (tx_confirms >= required_confirms || is_instant === true) {
                            force_close_socket();
                            play_audio(crypto_symbol === "doge" ? glob_const.howl : glob_const.cashier);
                            const status_msg = request_type === "incoming" ? tl("paymentsent") : tl("paymentreceived"),
                                is_insufficient = payment_dialog.hasClass("insufficient"), // keep scanning when amount was insufficient
                                insufficient_status = is_insufficient ? "pending" : "paid",
                                insufficient_pending = is_insufficient ? "scanning" : "polling";
                            payment_dialog.addClass("transacting").attr("data-status", "paid");
                            status_header.text(status_msg);
                            request.status = insufficient_status,
                                request.pending = insufficient_pending;
                            save_payment_request(direct, ln);
                            $("span#ibstatus").fadeOut(500);
                            closenotify();
                            new_status = insufficient_status;
                        } else {
                            if (!ln) {
                                play_audio(glob_const.blip);
                            }
                            payment_dialog.addClass("transacting").attr("data-status", "pending");
                            const broadcast_msg = ln ? tl("waitingforpayment") : tl("txbroadcasted");
                            status_header.text(broadcast_msg);
                            request.status = "pending",
                                request.pending = "polling";
                            save_payment_request(direct, ln);
                        }
                        status_panel.find("#view_tx").attr("data-txhash", tx_hash);
                        return new_status;
                    }
                    if (!exact_match) {
                        status_header.text(tl("insufficientamount"));
                        payment_dialog.addClass("transacting").attr("data-status", "insufficient");
                        request.status = "insufficient",
                            request.pending = "scanning";
                        save_payment_request(direct, ln);
                        status_panel.find("#view_tx").attr("data-txhash", tx_hash);
                        new_status = "insufficient";
                    }
                    play_audio(glob_const.funk);
                }
            }
        }
        return new_status;
    }
    return false;
}

// Terminates all active polling intervals or a specific polling instance
function stop_monitors(socket_id) {
    if (socket_id) { // close this interval
        if (glob_let.pinging[socket_id]) {
            clearInterval(glob_let.pinging[socket_id]);
            delete glob_let.pinging[socket_id]
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

// Removes completed payment request from local storage and updates UI state
function clear_recent_requests() {
    if (request) {
        const stored_requests = br_get_local("recent_requests");
        if (stored_requests) {
            try {
                const request_list = JSON.parse(stored_requests);
                if (request_list[request.payment]) {
                    delete request_list[request.payment];
                    br_set_local("recent_requests", request_list, true);
                    if (empty_obj(request_list)) {
                        toggle_rr(false);
                    }
                }
            } catch (error) {
                console.error("Error parsing recent requests:", error);
            }
        }
    }
}