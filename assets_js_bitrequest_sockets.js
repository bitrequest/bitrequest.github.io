// ** Core WebSocket Initialization & Management: **
//foreground_reconnect
//init_socket
//force_poll
//socket_info
//close_socket 
//handle_socket_fails
//handle_socket_close
//reconnect_websocket
//try_next_socket

// ** Lightning Network & NFC Handling: **
//lightning_socket
//poll_lightning_status
//process_nfc_payment
//handle_nfc_api_error
//show_nfc_error
//setup_nfc_controller
//stop_nfc_scan
//lnd_poll_data
//lnd_poll_invoice
//lnd_poll_data_fail
//update_boltcard

// ** Bitcoin & Bitcoin-like Cryptocurrencies: **
//blockcypherws
//blockcypher_websocket
//blockchain_btc_socket
//blockchain_bch_socket
//mempoolspace_btc_socket
//sochain_socket

// ** Ethereum & Layer-2 Networks: **
//init_eth_sockets
//alchemy_eth_websocket
//web3_eth_websocket
//web3_erc20_websocket

// ** Other Cryptocurrencies: **
//nano_socket
//poll_nimiq_network

// ** Core WebSocket Initialization & Management: **

// Reconnects if websocket got lost in background
function foreground_reconnect(saved_bg_time) {
    if (!request) return
    const bg_time = now_utc() - saved_bg_time;
    if (bg_time > 3000) {
        const api_data = q_obj(helper, "api_info.data");
        if (api_data) {
            const wallet_address = request.address;
            if (wallet_address) {
                set_dialog_timeout();
                force_close_socket().then(() => {
                    init_socket(api_data, wallet_address, true, true);
                    setTimeout(() => { // wait 1s to re-open connections
                        glob_let.in_background = false;
                    }, 1000);
                });
                return
            }
        }
        socket_info();
        force_close_socket();
        return
    }
    clearTimeout(glob_let.background_timeout);
    glob_let.background_timeout = 0;
}

// Establishes WebSocket connections for cryptocurrency payment monitoring based on payment type and node configuration
function init_socket(socket_node, wallet_address, retry, foreground) {
    if (glob_const.offline) {
        br_offline();
        return
    }
    if (!wallet_address) {
        br_offline(true);
        return
    }
    glob_let.rpc_attempts = {};
    prevent_screen_sleep();
    const payment_type = request.payment;
    if (!socket_node || foreground) {
        force_poll(payment_type, foreground);
        return
    }
    const node_name = socket_node.name;
    if (node_name === "poll_fallback") {
        start_address_monitor(null, null, true);
        return
    } else {
        const socket_id = socket_node.url || node_name;
        glob_let.socket_attempt[sha_sub(socket_id, 15)] = true;
    }
    if (payment_type === "monero") {
        init_xmr_polling(null, retry);
        return
    }
    if (payment_type === "ethereum" || request.erc20) {
        init_fetch_l2_contracts({ // route to fetch contracts
            "currency": payment_type,
            "name": "init_eth_sockets",
            "params": {
                payment_type,
                socket_node,
                wallet_address,
                retry
            }
        });
        return
    }
    if (payment_type === "bitcoin") {
        if (wallet_address === "lnurl") {
            // lightning only
        } else {
            if (node_name === "mempool.space websocket" || socket_node.default === false) {
                mempoolspace_btc_socket(socket_node, wallet_address);
            } else if (node_name === "blockcypher wss") {
                blockcypher_websocket(socket_node, wallet_address);
            } else if (node_name === "blockcypher ws") {
                blockcypherws(socket_node, wallet_address);
            } else if (node_name === "blockchain.info websocket") {
                blockchain_btc_socket(socket_node, wallet_address);
            } else {
                sochain_socket(socket_node, wallet_address, "BTC");
            }
        }
        if (helper.lnd_status) {
            if (retry) {
                return
            }
            lightning_socket(helper.lnd);
        }
        return
    }
    if (payment_type === "litecoin") {
        if (node_name === "mempool.space websocket" || socket_node.default === false) {
            mempoolspace_btc_socket(socket_node, wallet_address);
            return
        }
        if (node_name === "blockcypher wss") {
            blockcypher_websocket(socket_node, wallet_address);
            return
        }
        if (node_name === "blockcypher ws") {
            blockcypherws(socket_node, wallet_address);
            return
        }
        if (node_name === "sochain api") {
            sochain_socket(socket_node, wallet_address, "LTC");
            return
        }
        blockcypher_websocket(socket_node, wallet_address);
        return
    }
    if (payment_type === "dogecoin") {
        if (node_name === "mempool.space websocket" || socket_node.default === false) {
            mempoolspace_btc_socket(socket_node, wallet_address);
            return
        }
        if (node_name === "blockcypher wss") {
            blockcypher_websocket(socket_node, wallet_address);
            return
        }
        if (node_name === "blockcypher ws") {
            blockcypherws(socket_node, wallet_address);
            return
        }
        if (node_name === "sochain api") {
            sochain_socket(socket_node, wallet_address, "DOGE");
            return
        }
        blockcypher_websocket(socket_node, wallet_address);
        return
    }
    if (payment_type === "dash") {
        if (node_name === "dash.org") {
            start_address_monitor(5000);
            return
        }
        if (node_name === "blockcypher wss") {
            blockcypher_websocket(socket_node, wallet_address);
            return
        }
        if (node_name === "blockcypher ws") {
            blockcypherws(socket_node, wallet_address);
            return
        }
        return
    }
    if (payment_type === "bitcoin-cash") {
        if (node_name === "mempool.space websocket" || socket_node.default === false) {
            mempoolspace_btc_socket(socket_node, wallet_address);
            return
        }
        if (node_name === "blockchain.info websocket") {
            blockchain_bch_socket(socket_node, wallet_address);
            return
        }
        blockchain_bch_socket(socket_node, wallet_address);
        return
    }
    if (payment_type === "nano") {
        nano_socket(socket_node, wallet_address);
        return
    }
    if (payment_type === "nimiq") {
        start_address_monitor(5000);
        return
    }
    if (payment_type === "kaspa") {
        start_address_monitor(5000);
        return
    }
}

// Use polling only, no websockets
function force_poll(payment_type, foreground) {
    if (payment_type === "monero") {
        init_xmr_polling(null, foreground);
        return
    }
    start_address_monitor(null, null, foreground);
    if (helper.lnd_status) {
        lightning_socket(helper.lnd, true);
    }
}

// Updates UI elements to reflect WebSocket connection status and handles L1/L2 state transitions
function socket_info(socket_node, is_connected, is_polling) {
    if (!is_openrequest()) return
    const payment_address = $("#paymentaddress");
    if (!socket_node) {
        payment_address.removeClass("live");
        glob_const.paymentpopup.removeClass("live");
        notify(tl("websocketoffline"), 500000, "yes");
        return
    }
    if (socket_node.network) {
        initialize_network_status(socket_node, is_connected);
        return
    }
    let node_url = socket_node.url;
    const node_name = socket_node.name,
        custom = socket_node.custom;
    if (custom && (node_name == "alchemy" || node_name == "infura")) {
        node_url = strip_key_from_url(node_url);
    }
    const node_identifier = node_url || node_name,
        status_icon = is_connected ? " <span class='pulse'></span>" : " <span class='icon-wifi-off'></span>",
        connection_type = is_polling ? "polling" : "websocket",
        status_text = connection_type + ": " + node_identifier + status_icon;
    $("#current_socket").html(status_text);
    if (is_connected) {
        console.log("Connected: " + node_identifier);
        if (helper) {
            helper.l1_status = true;
        }
        payment_address.addClass("live");
        glob_const.paymentpopup.addClass("live");
        glob_const.paymentdialogbox.removeClass("switching");
        closenotify();
        return
    }
    if (glob_const.paymentdialogbox.hasClass("switching")) return // prevents offline modus when switching addresses
    if (glob_const.paymentdialogbox.hasClass("transacting")) return
    payment_address.removeClass("live");
    if (helper) {
        helper.l1_status = false;
        if (helper.l2_status === false) {
            br_offline();
            notify(tl("websocketoffline"), 500000, "yes");
        }
    }
}

// Terminates specific or all active WebSocket connections and cleans up socket registry
function close_socket(socket_id) {
    const close_promises = [];
    if (socket_id) { // close this socket
        if (glob_let.sockets[socket_id]) {
            const promise = new Promise((resolve) => {
                const socket = glob_let.sockets[socket_id];
                // If already closed or closing, resolve immediately
                if (socket.readyState === WebSocket.CLOSED ||
                    socket.readyState === WebSocket.CLOSING) {
                    resolve();
                } else {
                    socket.onclose = () => resolve();
                    socket.close();
                }
            });

            close_promises.push(promise);
            delete glob_let.sockets[socket_id];
        }
    } else { // close all sockets
        $.each(glob_let.sockets, function(key, socket) {
            if (socket) {
                const promise = new Promise((resolve) => {
                    if (socket.readyState === WebSocket.CLOSED ||
                        socket.readyState === WebSocket.CLOSING) {
                        resolve();
                    } else {
                        socket.onclose = () => resolve();
                        socket.close();
                    }
                });
                close_promises.push(promise);
            }
        });
        glob_let.sockets = {};
    }
    if (glob_let.pinging[socket_id]) { // remove pinging globals
        delete glob_let.pinging[socket_id];
    }
    return Promise.all(close_promises);
}

// Forces WebSocket connection closure
function force_close_socket(socket_id) {
    stop_monitors(socket_id);
    return close_socket(socket_id); // Return the promise
}

// Manages WebSocket failures by attempting reconnection through fallback nodes with L1/L2 network handling
function handle_socket_fails(socket_node, wallet_address, socket_id, is_layer2) {
    if (is_openrequest()) { // only when request is visible
        if (request) {
            const ccsymbol = request.currencysymbol;
            if (ccsymbol) {
                if (ccsymbol === "bch" && glob_const.paymentdialogbox.hasClass("transacting")) { // temp fix for bch socket
                    return
                }
            }
        }
        const ws_id = socket_id || wallet_address;
        force_close_socket(ws_id).then(() => {
            const fallback_node = try_next_socket(socket_node, is_layer2);
            if (fallback_node) {
                if (is_layer2) {
                    const token_contracts = fetch_localstorage_contracts(request.payment);
                    if (token_contracts && socket_id) {
                        stop_monitors(socket_id);
                        setup_layer2_monitoring(is_layer2, fallback_node, wallet_address, token_contracts.contracts, true);
                    }
                    return
                }
                init_socket(fallback_node, wallet_address, true);
                return
            }
            if (is_layer2) {
                // No poll fallback for L2
            } else {
                const coin_config = get_coinsettings(request.payment),
                    has_poll_fallback = q_obj(coin_config, "websockets.poll_fallback");
                if (has_poll_fallback) {
                    init_socket({
                        "name": "poll_fallback",
                        "display": false
                    }, wallet_address, true);
                    return
                }
            }
            socket_info(socket_node, false);
            console.error("Socket error:", "unable to connect to " + socket_node.name);
        });
    }
}

// Updates connection state and resets WebSocket timer on connection closure
function handle_socket_close(socket_node, socket_id) {
    close_socket(socket_id).then(() => {
        socket_info(socket_node, false);
        console.log("Disconnected from " + socket_node.url);
        glob_let.ws_timer = 0;
    });
}

// Implements delayed reconnection logic for Kaspa WebSocket with rate limiting and state validation
function reconnect_websocket(recon_data) {
    if (!recon_data) return
    const close_code = recon_data.trigger,
        wallet_address = recon_data.address;
    if (close_code !== 1000 || !wallet_address || glob_const.paymentdialogbox.attr("data-status") !== "new") return
    const elapsed_time = now_utc() - glob_let.ws_timer;
    if (elapsed_time < 10000) return
    const retry_timeout = setTimeout(function() {
        if (is_openrequest()) {
            recon_data.function(recon_data.node, wallet_address);
        }
    }, 2000, function() {
        clearTimeout(retry_timeout);
    });
}

// Selects next available WebSocket endpoint from configuration with overflow protection and duplicate attempt prevention
function try_next_socket(current_node, is_layer2) {
    if (!current_node) return false
    if (block_overflow("socket")) return false // prevent overflow
    const current_url = current_node.url,
        socket_config = is_layer2 ? q_obj(get_coinsettings(request.payment), "layer2.options." + current_node.network + ".websockets") : helper.socket_list,
        available_nodes = socket_config.options ? $.merge(socket_config.apis, socket_config.options) : socket_config.apis;
    if (!available_nodes.length) return false
    let current_index;
    $.each(available_nodes, function(i, node) {
        if (node.url == current_url) {
            current_index = i;
        }
    });
    if (current_index > -1) {
        const next_node = available_nodes[current_index + 1],
            fallback_node = next_node || available_nodes[0],
            socket_id = fallback_node.url || fallback_node.name,
            network_prefix = is_layer2 || "";
        if (glob_let.socket_attempt[sha_sub(socket_id + network_prefix, 15)] === true) {
            return false
        }
        if (fallback_node) {
            return fallback_node;
        }
    }
}

// ** Lightning Network & NFC Handling: **

// Establishes WebSocket connection to Lightning Network node for real-time payment monitoring
function lightning_socket(lnd, foreground) {
    glob_let.lnd_confirm = false;
    const proxy_data = lnurl_deform(lnd.proxy_host),
        proxy_url = proxy_data.url,
        proxy_key = lnd.pw || proxy_data.k,
        payment_id = lnd.pid,
        node_id = lnd.nid,
        invoice_mode = lnd.imp;
    if (glob_let.sockets[payment_id]) {
        return
    }
    if (foreground) { // use polling instead of websocket
        poll_lightning_status(proxy_url, proxy_key, payment_id, node_id, invoice_mode)
        return
    }
    const socket = glob_let.sockets[payment_id] = new WebSocket(glob_const.ln_socket);
    socket.onopen = function(e) {
        console.log("Connected: " + glob_const.ln_socket);
        glob_const.paymentpopup.addClass("live");
        const ping_msg = JSON.stringify({
            "id": payment_id
        });
        socket.send(ping_msg);
        glob_let.pinging[payment_id] = setInterval(function() {
            socket.send(ping_msg);
            poll_animate();
        }, 55000);
    };
    socket.onmessage = function(e) {
        const socket_data = JSON.parse(e.data);
        if (socket_data.pid == payment_id) {
            if (socket_data.status === "pending" && socket_data.bolt11) {
                stop_monitors(payment_id);
                close_socket(payment_id);
                update_boltcard(false);
                lnd_poll_invoice(proxy_url, proxy_key, invoice_mode, socket_data, payment_id, node_id);
                glob_let.pinging[socket_data.hash] = setInterval(function() {
                    lnd_poll_invoice(proxy_url, proxy_key, invoice_mode, socket_data, payment_id, node_id);
                }, 5000);
            }
            if (socket_data.status === "confirm" && !glob_let.lnd_confirm) {
                glob_let.lnd_confirm = true;
                glob_const.paymentdialogbox.addClass("accept_lnd");
                notify(tl("acceptthepayment"), 500000);
                vibrate();
                play_audio("blip");
            }
            set_dialog_timeout();
            return
        }
    };
    socket.onclose = function(e) {
        console.log("Disconnected");
        close_socket(payment_id);
    };
    socket.onerror = function(e) {
        poll_lightning_status(proxy_url, proxy_key, payment_id, node_id, invoice_mode);
    };
    process_nfc_payment(proxy_url, proxy_key, payment_id, node_id, invoice_mode);
}

// Poll lightning status instead of using websocket
function poll_lightning_status(proxy_url, proxy_key, payment_id, node_id, invoice_mode) {
    glob_let.lnd_confirm = false;
    glob_const.paymentpopup.addClass("live");
    update_boltcard(false);
    lnd_poll_data(proxy_url, proxy_key, payment_id, node_id, invoice_mode);
    glob_let.pinging[payment_id] = setInterval(function() {
        lnd_poll_data(proxy_url, proxy_key, payment_id, node_id, invoice_mode);
    }, 5000);
}

// Processes NFC tap events for Lightning Network card payments with LNURL-withdraw protocol
async function process_nfc_payment(proxy_host, proxy_key, payment_id, node_id, invoice_mode) {
    if (!glob_const.ndef) return
    glob_let.ndef_processing = false;
    try {
        setup_nfc_controller();
        await glob_const.ndef.scan({
            "signal": glob_let.ctrl.signal
        });
        glob_const.ndef.onreading = event => {
            if ((now_utc() - 6000) < glob_let.ndef_timer) { // prevent too many taps
                play_audio("funk");
                notify(tl("ndeftablimit"), 6000);
                return
            }
            glob_let.ndef_timer = now_utc();
            closenotify();
            const nfc_message = event.message;
            if (nfc_message) {
                const nfc_records = nfc_message.records;
                if (nfc_records) {
                    const first_record = nfc_records[0];
                    if (first_record) {
                        const card_data = first_record.data;
                        if (card_data) {
                            const lnurl_withdraw = utf8_decoder.decode(card_data);
                            if (lnurl_withdraw) {
                                if (lnurl_withdraw.indexOf("p=") && lnurl_withdraw.indexOf("c=")) {
                                    const url_parts = lnurl_withdraw.split("urlw://");
                                    if (url_parts[0] == "ln") {
                                        const amount_rel = $("#open_wallet").attr("data-rel"),
                                            crypto_amount = amount_rel.length ? parseFloat(amount_rel) : 0,
                                            milli_sats = (crypto_amount * 100000000000).toFixed(0);
                                        if (crypto_amount <= 0) {
                                            play_audio("funk");
                                            notify(tl("enteramount"), 5000);
                                            return
                                        }
                                        if (glob_let.ndef_processing) {
                                            play_audio("funk");
                                            console.error("error", "already processing");
                                            return
                                        }
                                        play_audio("blip");
                                        notify("Processing...", 50000);
                                        glob_const.paymentdialogbox.addClass("accept_lnd");
                                        set_dialog_timeout();
                                        const lnurl_endpoint = "https://" + url_parts[1];
                                        glob_let.ndef_processing = true;
                                        api_proxy({
                                            "api_url": lnurl_endpoint,
                                            "params": {
                                                "method": "GET",
                                                "cache": false
                                            }
                                        }, proxy_host).done(function(e) {
                                            const api_response = br_result(e).result;
                                            if (!api_response) { // catch lightning node connection failure
                                                play_audio("funk");
                                                notify(tl("unabletoconnectln"), 5000);
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            if (api_response.status === "ERROR") {
                                                play_audio("funk");
                                                const error_message = api_response.reason;
                                                notify(error_message, 5000);
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            if (api_response.error) {
                                                play_audio("funk");
                                                fail_dialogs(null, {
                                                    "error": api_response.error
                                                });
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                closenotify();
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            if (milli_sats > api_response.maxWithdrawable) {
                                                play_audio("funk");
                                                notify(tl("cardmax"), 5000);
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            if (milli_sats < api_response.minWithdrawable) {
                                                play_audio("funk");
                                                notify(tl("minamount", {
                                                    "min": api_response.minWithdrawable
                                                }), 5000);
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            const callback_url = api_response.callback;
                                            if (callback_url) {
                                                const auth_key = api_response.k1;
                                                if (auth_key) {
                                                    const memo_text = $("#paymentdialog input#requesttitle").val(),
                                                        final_memo = (memo_text && memo_text.length > 1) ? memo_text + " (Boltcard)" :
                                                        (api_response.defaultDescription) ? api_response.defaultDescription : "bitrequest " + payment_id + " (Boltcard)",
                                                        request_type = request.requesttype,
                                                        invoice_data = {
                                                            "imp": invoice_mode,
                                                            "fn": "ln-create-invoice",
                                                            "amount": milli_sats,
                                                            "memo": final_memo,
                                                            "id": payment_id,
                                                            "nid": node_id,
                                                            "expiry": 60,
                                                            "boltcard": true,
                                                            "x-api": proxy_key
                                                        };
                                                    if (request_type === "incoming") {
                                                        invoice_data.b11 = true;
                                                    }
                                                    $.ajax({
                                                        "method": "POST",
                                                        "cache": false,
                                                        "timeout": 5000,
                                                        "url": proxy_host + "/proxy/v1/ln/api/",
                                                        "data": invoice_data
                                                    }).done(function(invoice_result) {
                                                        const bolt11 = invoice_result.bolt11;
                                                        if (bolt11) {
                                                            glob_const.paymentdialogbox.addClass("transacting blockd").attr("data-status", "pending");
                                                            $("#paymentdialogbox .brstatuspanel #confnumber").text("1");
                                                            notify("Monitoring...", 50000);
                                                            const url_separator = callback_url.includes("?") ? "&" : "?",
                                                                final_url = callback_url + url_separator + "k1=" + auth_key + "&pr=" + bolt11;
                                                            api_proxy({
                                                                "proxy": false,
                                                                "api_url": final_url,
                                                                "params": {
                                                                    "method": "GET",
                                                                    "cache": false,
                                                                    "timeout": 15000
                                                                }
                                                            }, proxy_host).done(function(e) {
                                                                const callback_response = br_result(e).result;
                                                                if (callback_response.status === "ERROR") {
                                                                    show_nfc_error(callback_response.reason);
                                                                    return
                                                                }
                                                                if (callback_response.status === "OK") {
                                                                    stop_monitors(payment_id);
                                                                    force_close_socket(payment_id).then(() => {
                                                                        stop_nfc_scan();
                                                                        update_boltcard(true);
                                                                        lnd_poll_invoice(proxy_host, proxy_key, invoice_mode, invoice_result, payment_id, node_id, true);
                                                                        glob_let.pinging[invoice_result.hash] = setInterval(function() {
                                                                            lnd_poll_invoice(proxy_host, proxy_key, invoice_mode, invoice_result, payment_id, node_id);
                                                                        }, 3000);
                                                                    });
                                                                    return
                                                                }
                                                            }).fail(function(xhr, stat, err) {
                                                                handle_nfc_api_error(xhr, stat, err);
                                                            });
                                                            return
                                                        }
                                                        show_nfc_error("failed to create invoice");
                                                    }).fail(function(xhr, stat, err) {
                                                        handle_nfc_api_error(xhr, stat, err);
                                                    }).always(function() {
                                                        glob_let.ndef_processing = false;
                                                    });
                                                    return
                                                }
                                            }
                                            glob_let.ndef_processing = false;
                                        }).fail(function(xhr, stat, err) {
                                            handle_nfc_api_error(xhr, stat, err);
                                        });
                                        return
                                    }
                                }
                                notify("invalid lnurlw", 5000);
                                return
                            }
                        }
                    }
                }
            }
            notify("lnurlw not found", 5000);
        }
    } catch (error) {
        notify(error, 5000);
    }
}

// Handles API request failures during NFC card payment processing
function handle_nfc_api_error(xhr, status, error) {
    const error_data = xhr || status || error;
    fail_dialogs(null, {
        "error": error_data
    });
    glob_const.paymentdialogbox.removeClass("accept_lnd transacting");
    closenotify();
    glob_let.ndef_processing = false;
}

// Displays temporary error messages in payment dialog during NFC operations
function show_nfc_error(error_text) {
    const payment_dialog = $("#paymentdialogbox"),
        status_panel = payment_dialog.find(".brstatuspanel"),
        status_header = status_panel.find("h2");
    status_header.text(error_text);
    payment_dialog.addClass("accept_lnd transacting pd_error");
    play_audio("funk");
    closenotify();
    setTimeout(function() {
        payment_dialog.removeClass("accept_lnd transacting pd_error");
        status_header.text(tl("waitingforpayment"));
    }, 5000);
}

// Initializes NFC controller with abort signal for scan operations
function setup_nfc_controller() {
    glob_let.ctrl = new AbortController();
    console.log("Waiting for NDEF messages.");
    glob_let.ctrl.signal.onabort = () => {
        console.log("Done waiting for NDEF messages.");
    };
}

// Terminates active NFC scanning operation and cleans up controller
function stop_nfc_scan() {
    if (glob_const.ndef && glob_let.ctrl) {
        glob_let.ctrl.abort();
        glob_let.ctrl = null;
    }
}

// Polls Lightning Network node for payment request status with automatic retry
function lnd_poll_data(proxy_host, proxy_key, payment_id, node_id, invoice_mode) {
    if (is_openrequest()) { // only when request is visible
        const default_error = tl("unabletoconnect");
        $.ajax({
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy_host + "/proxy/v1/ln/api/",
            "data": {
                "fn": "ln-request-status",
                "id": payment_id,
                "x-api": proxy_key
            }
        }).done(function(response) {
            poll_animate();
            const error = response.error;
            if (error) {
                const error_message = error.message || (typeof error === "string" ? error : default_error);
            }
            const proxy_version = response.version;
            if (proxy_version < glob_const.proxy_version) {
                proxy_alert(proxy_version);
            }
            if (response.pid == payment_id) {
                if (response.status == "pending" && response.bolt11) {
                    stop_monitors(payment_id);
                    set_dialog_timeout();
                    lnd_poll_invoice(proxy_host, proxy_key, invoice_mode, response, payment_id, node_id);
                    glob_let.pinging[response.hash] = setInterval(function() {
                        lnd_poll_invoice(proxy_host, proxy_key, invoice_mode, response, payment_id, node_id);
                    }, 5000);
                    return
                }
                if (response.status == "confirm" && !glob_let.lnd_confirm) {
                    glob_let.lnd_confirm = true;
                    glob_const.paymentdialogbox.addClass("accept_lnd");
                    notify(tl("acceptthepayment"), 500000);
                    play_audio("blip");
                }
                return
            }
            lnd_poll_data_fail(payment_id);
        }).fail(function(xhr, status, error) {
            lnd_poll_data_fail(payment_id);
        });
        return
    }
    force_close_socket();
}

// Monitors Lightning Network invoice payment status with callback handling
function lnd_poll_invoice(proxy_host, proxy_key, invoice_mode, invoice_data, payment_id, node_id) {
    if (is_openrequest()) { // only when request is visible
        const default_error = "unable to connect";
        $.ajax({
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy_host + "/proxy/v1/ln/api/",
            "data": {
                "fn": "ln-invoice-status",
                "imp": invoice_mode,
                "hash": invoice_data.hash,
                "id": payment_id,
                "nid": node_id,
                "callback": "yes",
                "type": request.requesttype,
                "x-api": proxy_key
            }
        }).done(function(response) {
            poll_animate();
            const payment_status = response.status;
            if (payment_status) {
                request.address = "lnurl"; // make it a lightning request
                notify(tl("waitingforpayment"), 500000);
                helper.lnd.invoice = response;
                const tx_data = lnd_tx_data(response);
                validate_confirmations(tx_data, true, true);
                glob_const.paymentdialogbox.removeClass("blockd");
                if (payment_status === "paid") {
                    stop_monitors(invoice_data.hash);
                    helper.currencylistitem.removeData("url");
                    br_remove_local("editurl");
                    br_remove_session("lndpid");
                    closenotify();
                    return
                }
            }
        });
        return
    }
    force_close_socket();
}

// Handles connection failures during Lightning Network payment status polling
function lnd_poll_data_fail(payment_id) {
    stop_monitors(payment_id);
    br_offline(true);
}

// Update boltcard status
function update_boltcard(status) {
    const fetch_id = get_request_id();
    if (fetch_id) {
        update_request({
            "requestid": fetch_id,
            "boltcard": status
        }, false);
    }
    request.boltcard = status;
}

// ** Bitcoin & Bitcoin-like Cryptocurrencies: **

// Attempts WebSocket connection to BlockCypher API with fallback to local WebSocket if running locally
function blockcypherws(socket_node, wallet_address) {
    if (glob_let.local === true) {
        blockcypher_websocket(socket_node, wallet_address);
        return
    }
    handle_socket_fails(socket_node, wallet_address);
}

// Establishes WebSocket connection to BlockCypher API for transaction confirmation monitoring with automatic ping maintenance
function blockcypher_websocket(socket_node, wallet_address) {
    if (glob_let.sockets[wallet_address]) {
        return
    }
    const ws_endpoint = socket_node.url + request.currencysymbol + "/main",
        socket = glob_let.sockets[wallet_address] = new WebSocket(ws_endpoint);
    socket.onopen = function(e) {
        socket_info(socket_node, true);
        socket.send(JSON.stringify({
            "event": "tx-confirmation",
            "address": wallet_address,
            "token": get_blockcypher_apikey()
        }));
        glob_let.pinging[wallet_address] = setInterval(function() {
            socket.send(JSON.stringify({
                "event": "ping"
            }));
            poll_animate();
        }, 55000);
    };
    socket.onmessage = function(e) {
        const tx_data = JSON.parse(e.data);
        if (tx_data.event === "pong") return
        const tx_hash = tx_data.hash;
        if (!tx_hash) return
        close_socket().then(() => {
            const setconfirmations = request.set_confirmations || 0,
                tx_details = blockcypher_poll_data(tx_data, setconfirmations, request.currencysymbol, wallet_address);
            if (tx_details.double_spend) {
                const alert_content = "<h2 class='icon-warning'>Double spend detected</h2>";
                popdialog(alert_content, "canceldialog");
                return
            }
            start_transaction_monitor(tx_details);
        });
    };
    socket.onclose = function(e) {
        handle_socket_close(socket_node, wallet_address);
    };
    socket.onerror = function(e) {
        handle_socket_fails(socket_node, wallet_address);
        return
    };
}

// Establishes WebSocket connection to Blockchain.info for Bitcoin address monitoring with transaction validation
function blockchain_btc_socket(socket_node, wallet_address) {
    if (glob_let.sockets[wallet_address]) {
        return
    }
    const ws_endpoint = socket_node.url,
        socket = glob_let.sockets[wallet_address] = new WebSocket(ws_endpoint);
    socket.onopen = function(e) {
        socket_info(socket_node, true);
        socket.send(JSON.stringify({
            "op": "addr_sub",
            "addr": wallet_address
        }));
        glob_let.pinging[wallet_address] = setInterval(function() {
            socket.send(JSON.stringify({
                "op": "ping"
            }));
            poll_animate();
        }, 55000);
    };
    socket.onmessage = function(e) {
        try {
            const tx_data = JSON.parse(e.data).x,
                tx_hash = tx_data.hash;
            if (!tx_hash) return
            const setconfirmations = request.set_confirmations || 0,
                tx_details = blockchain_ws_data(tx_data, setconfirmations, request.currencysymbol, wallet_address);
            if (tx_details) {
                close_socket().then(() => {
                    start_transaction_monitor(tx_details);
                });
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    socket.onclose = function(e) {
        handle_socket_close(socket_node, wallet_address);
    };
    socket.onerror = function(e) {
        handle_socket_fails(socket_node, wallet_address);
        return
    };
}

// Establishes WebSocket connection to Blockchain.info for BCH address monitoring with CashAddr format handling
function blockchain_bch_socket(socket_node, wallet_address) {
    if (glob_let.sockets[wallet_address]) {
        return
    }
    const ws_endpoint = socket_node.url,
        socket = glob_let.sockets[wallet_address] = new WebSocket(ws_endpoint);
    socket.onopen = function(e) {
        socket_info(socket_node, true);
        const clean_address = (wallet_address.indexOf("bitcoincash:") > -1) ? wallet_address.split("bitcoincash:").pop() : wallet_address;
        socket.send(JSON.stringify({
            "op": "addr_sub",
            "addr": "bitcoincash:" + clean_address
        }));
        glob_let.pinging[wallet_address] = setInterval(function() {
            socket.send(JSON.stringify({
                "op": "ping"
            }));
            poll_animate();
        }, 55000);
    };
    socket.onmessage = function(e) {
        try {
            const tx_data = JSON.parse(e.data).x,
                tx_hash = tx_data.hash;
            if (!tx_hash) return
            const legacy_format = bch_legacy(wallet_address),
                setconfirmations = request.set_confirmations || 0,
                tx_details = blockchain_ws_data(tx_data, setconfirmations, request.currencysymbol, wallet_address, legacy_format);
            if (tx_details) {
                close_socket().then(() => {
                    start_transaction_monitor(tx_details);
                });
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    socket.onclose = function(e) {
        handle_socket_close(socket_node, wallet_address);
    };
    socket.onerror = function(e) {
        handle_socket_fails(socket_node, wallet_address);
        return
    };
}

// Establishes WebSocket connection to mempool.space for real-time Bitcoin transaction monitoring with address tracking
function mempoolspace_btc_socket(socket_node, wallet_address) {
    if (glob_let.sockets[wallet_address]) {
        return
    }
    const ws_endpoint = socket_node.url,
        mempool_socket = glob_let.sockets[wallet_address] = new WebSocket(ws_endpoint);
    mempool_socket.onopen = function(e) {
        socket_info(socket_node, true);
        mempool_socket.send(JSON.stringify({
            "track-address": wallet_address
        }));
        glob_let.pinging[wallet_address] = setInterval(function() {
            mempool_socket.send(JSON.stringify({
                "action": "ping"
            }));
            poll_animate();
        }, 55000);
    };
    mempool_socket.onmessage = function(e) {
        try {
            const ws_data = JSON.parse(e.data),
                tx_batch = ws_data["address-transactions"];
            if (tx_batch) {
                const tx_data = tx_batch[0];
                if (tx_data) {
                    const tx_hash = tx_data.txid;
                    if (!tx_hash) return
                    const setconfirmations = request.set_confirmations || 0,
                        tx_details = mempoolspace_ws_data(tx_data, setconfirmations, request.currencysymbol, wallet_address);
                    if (tx_details) {
                        close_socket().then(() => {
                            start_transaction_monitor(tx_details);
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    mempool_socket.onclose = function(e) {
        handle_socket_close(socket_node, wallet_address);
    };
    mempool_socket.onerror = function(e) {
        handle_socket_fails(socket_node, wallet_address);
        return
    };
}

// Establishes WebSocket connection to chain.so for Bitcoin, Litecoin, Dogecoin address monitoring with transaction validation  
function sochain_socket(socket_node, wallet_address, network) {
    if (glob_let.sockets[wallet_address]) {
        return
    }
    const ws_endpoint = socket_node.url,
        socket = glob_let.sockets[wallet_address] = new WebSocket(ws_endpoint);
    socket.onopen = function(e) {
        socket_info(socket_node, true);
        socket.send(JSON.stringify({
            "type": "address",
            network,
            "data": wallet_address
        }));
        glob_let.pinging[wallet_address] = setInterval(function() {
            socket.send(JSON.stringify({
                "type": "keepalive"
            }));
            poll_animate();
        }, 20000);
    };
    socket.onmessage = function(e) {
        try {
            const msg_data = JSON.parse(e.data),
                tx_data = msg_data.data;
            if (tx_data.update_available) {
                start_address_monitor(null, null, true);
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    socket.onclose = function(e) {
        handle_socket_close(socket_node, wallet_address);
    };
    socket.onerror = function(e) {
        handle_socket_fails(socket_node, wallet_address);
        return
    };
}

// ** Ethereum & Layer-2 Networks: **

// Configures WebSocket connections for Ethereum L1/L2 networks and ERC20 tokens with provider-specific routing
function init_eth_sockets(params, token_contracts) {
    const {
        payment_type,
        socket_node,
        wallet_address,
        retry
    } = params;
    // Always scan for layer 1
    if (payment_type === "ethereum") {
        if (socket_node.name === "alchemy") {
            alchemy_eth_websocket(socket_node, wallet_address); // L1 Alchemy
        } else {
            web3_eth_websocket(socket_node, wallet_address); // L1 Infura
        }
    } else {
        web3_erc20_websocket(socket_node, wallet_address, token_contracts.main);
    }
    if (retry) return
    // Check for layer 2
    initialize_layer2_connections(payment_type, wallet_address, token_contracts);
}

// Establishes WebSocket connection to Alchemy API for monitoring pending Ethereum transactions with address filtering
function alchemy_eth_websocket(socket_node, wallet_address) {
    if (glob_let.sockets[wallet_address]) {
        return
    }
    const base_url = socket_node.url,
        main_alchemy_socket = glob_const.main_alchemy_socket,
        base_url_length = base_url.length,
        main_socket_length = main_alchemy_socket.length,
        has_apikey = str_includes(base_url, main_alchemy_socket) && ((base_url_length - main_socket_length) > 25),
        ws_endpoint = has_apikey ? complete_url(base_url) : base_url + get_alchemy_apikey(),
        socket = glob_let.sockets[wallet_address] = new WebSocket(ws_endpoint);
    socket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_payload = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": ["alchemy_pendingTransactions", {
                "toAddress": [wallet_address],
                "hashesOnly": false
            }]
        });
        socket.send(ping_payload);
        glob_let.pinging[wallet_address] = setInterval(function() {
            socket.send(ping_payload);
            poll_animate();
        }, 55000);
    };
    socket.onmessage = function(e) {
        try {
            const msg_data = JSON.parse(e.data),
                tx_data = q_obj(msg_data, "params.result");
            if (tx_data && tx_data.hash && str_match(tx_data.to, wallet_address)) {
                const setconfirmations = request.set_confirmations || 0,
                    tx_details = infura_block_data(tx_data, setconfirmations, request.currencysymbol);
                close_socket().then(() => {
                    start_transaction_monitor(tx_details);
                });
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    socket.onclose = function(e) {
        handle_socket_close(socket_node, wallet_address);
    };
    socket.onerror = function(e) {
        handle_socket_fails(socket_node, wallet_address);
        return
    };
}

// Establishes WebSocket connection to Ethereum node for monitoring new blocks with RPC-based transaction filtering
function web3_eth_websocket(socket_node, wallet_address) {
    const network_type = socket_node.network,
        base_url = socket_node.url,
        infura_key = get_infura_apikey(base_url),
        ws_endpoint = base_url + infura_key,
        socket_id = sha_sub(ws_endpoint, 10);
    if (glob_let.sockets[socket_id]) {
        return
    }
    const socket = glob_let.sockets[socket_id] = new WebSocket(ws_endpoint);
    socket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_payload = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": ["newHeads"]
        });
        socket.send(ping_payload);
        glob_let.pinging[wallet_address] = setInterval(function() {
            socket.send(ping_payload);
            poll_animate();
        }, 55000);
    };
    socket.onmessage = function(e) {
        try {
            const msg_data = JSON.parse(e.data),
                block_data = q_obj(msg_data, "params.result");
            if (block_data && block_data.hash) {
                const api_data = helper ? q_obj(helper, "api_info.data") : null;
                if (!api_data) return
                const node_url = api_data.default === false ? api_data.url : glob_const.main_eth_node;
                api_proxy(eth_params(node_url, 25, "eth_getBlockByHash", [block_data.hash, true])).done(function(response) {
                    const result_data = inf_result(response),
                        transactions = result_data.transactions;
                    if (transactions) {
                        const setconfirmations = request.set_confirmations || 0;
                        $.each(transactions, function(i, tx) {
                            if (str_match(tx.to, wallet_address) === true) {
                                const tx_details = infura_block_data(tx, setconfirmations, request.currencysymbol, block_data.timestamp);
                                close_socket().then(() => {
                                    start_transaction_monitor(tx_details);
                                    if (network_type) {
                                        initialize_network_status(socket_node, "paid");
                                    }
                                });
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
    socket.onclose = function(e) {
        handle_socket_close(socket_node, socket_id);
    };
    socket.onerror = function(e) {
        handle_socket_fails(socket_node, wallet_address, socket_id);
        return
    };
}

// Establishes WebSocket connection for monitoring ERC20 token transfers using contract event logs
function web3_erc20_websocket(socket_node, wallet_address, contract_address, socket_id) {
    if (glob_let.sockets[socket_id]) {
        return
    }
    const network_type = socket_node.network,
        base_url = complete_url(socket_node.url),
        infura_key = get_infura_apikey(base_url),
        ws_endpoint = base_url + infura_key,
        socket = glob_let.sockets[socket_id] = new WebSocket(ws_endpoint);
    socket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_payload = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": [
                "logs",
                {
                    "address": contract_address,
                    "topics": []
                }
            ]
        });
        socket.send(ping_payload);
    };
    socket.onmessage = function(e) {
        try {
            const msg_data = JSON.parse(e.data),
                log_data = q_obj(msg_data, "params.result");
            if (log_data && log_data.topics) {
                const target_address = log_data.topics[2];
                if (!target_address || str_match(target_address, wallet_address.slice(3)) !== true) return
                const contract_data = log_data.data.slice(2),
                    raw_value = hex_to_number_string(contract_data),
                    token_decimals = request.decimals,
                    token_amount = parseFloat((raw_value / Math.pow(10, token_decimals)).toFixed(8));
                if (token_amount === Infinity) return
                const setconfirmations = request.set_confirmations || 0,
                    tx_details = {
                        "ccval": token_amount,
                        "transactiontime": now_utc(),
                        "txhash": log_data.transactionHash,
                        "confirmations": 0,
                        setconfirmations,
                        "ccsymbol": request.currencysymbol,
                        "eth_layer2": network_type
                    };
                close_socket().then(() => {
                    start_transaction_monitor(tx_details);
                    if (network_type) {
                        initialize_network_status(socket_node, "paid");
                    }
                });
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    socket.onclose = function(e) {
        if (e.code === 1008) { // closed because of API limit, switch to polling
            console.error("Disconnected from " + socket_node.url);
            glob_let.ws_timer = 0;
            handle_socket_fails(socket_node, wallet_address, socket_id, network_type);
            return
        }
        handle_socket_close(socket_node, socket_id);
    };
    socket.onerror = function(e) {
        handle_socket_fails(socket_node, wallet_address, socket_id, network_type);
    };
}

// ** Other Cryptocurrencies: **

// Establishes WebSocket connection for Nano network with confirmation subscription and XRB/NANO prefix handling
function nano_socket(socket_node, wallet_address) {
    if (glob_let.sockets[wallet_address]) {
        return
    }
    const normalized_address = (wallet_address.match("^xrb")) ? "nano_" + wallet_address.split("_").pop() : wallet_address, // change nano address prefix xrb_ to nano untill websocket support
        ws_endpoint = socket_node.url,
        socket = glob_let.sockets[wallet_address] = new WebSocket(ws_endpoint);
    socket.onopen = function(e) {
        socket_info(socket_node, true);
        socket.send(JSON.stringify({
            "action": "subscribe",
            "topic": "confirmation",
            "all_local_accounts": true,
            "options": {
                "accounts": [normalized_address]
            },
            "ack": true
        }));
        glob_let.pinging[wallet_address] = setInterval(function() {
            socket.send(JSON.stringify({
                "action": "ping"
            }));
            poll_animate();
        }, 55000);
    };
    socket.onmessage = function(e) {
        try {
            const msg_data = JSON.parse(e.data),
                tx_data = (msg_data.message) ? msg_data.message : (msg_data.account) ? msg_data : null;
            if (tx_data) {
                if (tx_data.account === wallet_address) return // block outgoing transactions
                if (!tx_data.hash) return
                const reciever = tx_data?.block?.link_as_account;
                if (reciever && str_includes(reciever, wallet_address === false)) return; // block non matching transactions
                const tx_details = nano_scan_data(tx_data),
                    tx_time = tx_details.transactiontime,
                    time_delta = Math.abs(tx_time - now_utc());
                if (time_delta < 60000) { // filter transactions longer then a minute ago
                    close_socket().then(() => {
                        start_transaction_monitor(tx_details);
                    });
                }
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    socket.onclose = function(e) {
        handle_socket_close(socket_node, wallet_address);
    };
    socket.onerror = function(e) {
        handle_socket_fails(socket_node, wallet_address);
        return
    };
}