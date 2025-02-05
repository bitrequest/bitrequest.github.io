$(document).ready(function() {
    //init_socket
    //blockcypherws
    //lightning_socket
    //ln_ndef
    //ndef_apifail
    //ndef_errormg
    //ndef_controller
    //abort_ndef
    //blockcypher_websocket
    //blockchain_btc_socket
    //blockchain_bch_socket
    //mempoolspace_btc_socket
    //dashorg_poll
    //nano_socket
    //nimiq_poll
    //init_eth_sockets
    //kaspa_websocket
    //kaspa_fyi_websocket
    //handle_socket_fails
    //handle_socket_close
    //ws_recon
    //try_next_socket
    //current_socket
    //closesocket
    //socket_info
});

// Websockets / Pollfunctions

// Initializes a socket connection based on the payment type and node configuration
function init_socket(socket_node, address, retry) {
    if (glob_let.offline) {
        notify(translate("youareoffline") + ". " + translate("notmonitored"));
        return
    }
    glob_let.rpc_attempts = {};
    const payment = request.payment;
    let socket_name;
    if (socket_node) {
        socket_name = socket_node.name;
        if (socket_name === "poll_fallback") {
            address_polling_init(null, null, true);
            return
        } else {
            glob_let.socket_attempt[sha_sub(socket_node.url, 15)] = true;
        }
    }
    if (payment === "bitcoin") {
        if (address === "lnurl") {
            // lightning only
        } else {
            if (socket_name === "mempool.space websocket" || socket_node.default === false) {
                mempoolspace_btc_socket(socket_node, address);
            } else if (socket_name === "blockcypher wss") {
                blockcypher_websocket(socket_node, address);
            } else if (socket_name === "blockcypher ws") {
                blockcypherws(socket_node, address);
            } else if (socket_name === "blockchain.info websocket") {
                blockchain_btc_socket(socket_node, address);
            } else {
                blockcypher_websocket(socket_node, address);
            }
        }
        if (helper.lnd_status) {
            if (retry) {
                return;
            }
            lightning_socket(helper.lnd);
        }
        return
    }
    if (payment === "litecoin") {
        if (socket_name === "mempool.space websocket" || socket_node.default === false) {
            mempoolspace_btc_socket(socket_node, address);
            return
        }
        if (socket_name === "blockcypher wss") {
            blockcypher_websocket(socket_node, address);
            return
        }
        if (socket_name === "blockcypher ws") {
            blockcypherws(socket_node, address);
            return
        }
        blockcypher_websocket(socket_node, address);
        return
    }
    if (payment === "dogecoin") {
        if (socket_name === "mempool.space websocket" || socket_node.default === false) {
            mempoolspace_btc_socket(socket_node, address);
            return
        }
        if (socket_name === "blockcypher wss") {
            blockcypher_websocket(socket_node, address);
            return
        }
        if (socket_name === "blockcypher ws") {
            blockcypherws(socket_node, address);
            return
        }
        if (socket_name === "dogechain api") {
            dogechain_info_socket(socket_node, address);
            return
        }
        blockcypher_websocket(socket_node, address);
        return
    }
    if (payment === "dash") {
        if (socket_name === "dash.org") {
            dashorg_poll();
            return
        }
        if (socket_name === "blockcypher wss") {
            blockcypher_websocket(socket_node, address);
            return
        }
        if (socket_name === "blockcypher ws") {
            blockcypherws(socket_node, address);
            return
        }
        return
    }
    if (payment === "bitcoin-cash") {
        if (socket_name === "mempool.space websocket" || socket_node.default === false) {
            mempoolspace_btc_socket(socket_node, address);
            return
        }
        if (socket_name === "blockchain.info websocket") {
            blockchain_bch_socket(socket_node, address);
            return
        }
        blockchain_bch_socket(socket_node, address);
        return
    }
    if (payment === "nano") {
        nano_socket(socket_node, address);
        return
    }
    if (payment === "nimiq") {
        nimiq_poll();
        return
    }
    if (payment === "ethereum" || request.erc20) {
        init_eth_sockets(payment, socket_node, address, retry);
        return
    }
    if (payment === "monero") {
        const vk = request.viewkey || get_vk(address);
        if (vk) {
            const xmr_requests = get_requestli("payment", "monero"),
                xmr_pending = filter_list(xmr_requests, "pending", "scanning");
            if (xmr_pending.length) { // update pending xmr tx's to prevent tx duplication
                trigger_requeststates(true, xmr_pending);
            }
            const account = vk.account || address,
                viewkey = vk.vk;
            request.monitored = true;
            request.viewkey = vk;
            closenotify();
            init_xmr_node(9, account, viewkey);
            return
        }
        request.monitored = false;
        request.viewkey = false;
        notify(translate("notmonitored"), 500000, "yes");
        return
    }
    if (payment === "kaspa") {
        if (socket_name === glob_const.main_kas_wss) {
            kaspa_websocket(socket_node, address);
            return
        }
        if (socket_name === glob_const.sec_kas_wss) {
            kaspa_fyi_websocket(socket_node, address);
            return
        }
        kaspa_websocket(socket_node, address);
        return
    }
    notify(translate("notmonitored"), 500000, "yes")
}

// Handles BlockCypher WebSocket connection, falling back to WebSocket if local
function blockcypherws(socket_node, address) {
    if (glob_let.local === true) {
        blockcypher_websocket(socket_node, address);
        return
    }
    handle_socket_fails(socket_node, address);
}

// Sets up a Lightning Network socket connection
function lightning_socket(lnd) {
    glob_let.lnd_confirm = false;
    const p_arr = lnurl_deform(lnd.proxy_host),
        proxy_host = p_arr.url,
        pk = (lnd.pw) ? lnd.pw : p_arr.k,
        pid = lnd.pid,
        nid = lnd.nid,
        imp = lnd.imp;
    if (glob_let.sockets[pid]) {
        return
    }
    const socket = glob_let.sockets[pid] = new WebSocket(glob_const.ln_socket);
    socket.onopen = function(e) {
        console.log("Connected: " + glob_const.ln_socket);
        glob_const.paymentpopup.addClass("live");
        const ping_event = JSON.stringify({
            "id": pid
        });
        socket.send(ping_event);
        glob_let.pinging[pid] = setInterval(function() {
            socket.send(ping_event);
            poll_animate();
        }, 55000);
    };
    socket.onmessage = function(e) {
        const result = JSON.parse(e.data);
        if (result.pid == pid) {
            if (result.status === "pending" && result.bolt11) {
                clearpinging(pid);
                closesocket(pid);
                lnd_poll_invoice(proxy_host, pk, imp, result, pid, nid);
                glob_let.pinging[result.hash] = setInterval(function() {
                    lnd_poll_invoice(proxy_host, pk, imp, result, pid, nid);
                }, 5000);
            }
            if (result.status === "confirm" && !glob_let.lnd_confirm) {
                glob_let.lnd_confirm = true;
                glob_const.paymentdialogbox.addClass("accept_lnd");
                notify(translate("acceptthepayment"), 500000);
                vibrate();
                playsound(glob_const.blip);
            }
            set_request_timer();
            return
        }
    };
    socket.onclose = function(e) {
        console.log("Disconnected");
    };
    socket.onerror = function(e) {
        glob_let.lnd_confirm = false;
        glob_const.paymentpopup.addClass("live");
        glob_let.pinging[pid] = setInterval(function() {
            lnd_poll_data(proxy_host, pk, pid, nid, imp);
        }, 5000);
    };
    ln_ndef(proxy_host, pk, pid, nid, imp);
}

// Handles NFC (Near Field Communication) functionality for Lightning Network payments
async function ln_ndef(proxy_host, pk, pid, nid, imp) {
    if (!glob_const.ndef) return;
    glob_let.ndef_processing = false;
    try {
        ndef_controller();
        await glob_const.ndef.scan({
            "signal": glob_let.ctrl.signal
        });
        glob_const.ndef.onreading = event => {
            if ((now() - 6000) < glob_let.ndef_timer) { // prevent too many taps
                playsound(glob_const.funk);
                notify(translate("ndeftablimit"), 6000);
                return;
            }
            glob_let.ndef_timer = now();
            closenotify();
            const message = event.message;
            if (message) {
                const records = message.records;
                if (records) {
                    const first_record = records[0];
                    if (first_record) {
                        const data = first_record.data;
                        if (data) {
                            const lnurlw = utf8Decoder.decode(data);
                            if (lnurlw) {
                                if (lnurlw.indexOf("p=") && lnurlw.indexOf("c=")) {
                                    const prefix = lnurlw.split("urlw://");
                                    if (prefix[0] == "ln") {
                                        const amount_rel = $("#open_wallet").attr("data-rel"),
                                            ccraw = amount_rel.length ? parseFloat(amount_rel) : 0,
                                            milli_sats = (ccraw * 100000000000).toFixed(0);
                                        if (ccraw <= 0) {
                                            playsound(glob_const.funk);
                                            notify(translate("enteramount"), 5000);
                                            return
                                        }
                                        if (glob_let.ndef_processing) {
                                            playsound(glob_const.funk);
                                            console.error("error", "already processing");
                                            return
                                        }
                                        playsound(glob_const.blip);
                                        notify("Processing...", 50000);
                                        glob_const.paymentdialogbox.addClass("accept_lnd");
                                        set_request_timer();
                                        const lnurl_http = "https://" + prefix[1];
                                        glob_let.ndef_processing = true;
                                        api_proxy({
                                            "api_url": lnurl_http,
                                            "params": {
                                                "method": "GET",
                                                "cache": false
                                            }
                                        }, proxy_host).done(function(e) {
                                            const result = br_result(e).result;
                                            if (!result) { // catch lightning node connection failure
                                                playsound(glob_const.funk);
                                                notify(translate("unabletoconnectln"), 5000);
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            if (result.status === "ERROR") {
                                                playsound(glob_const.funk);
                                                const error_message = result.reason;
                                                notify(error_message, 5000);
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            if (result.error) {
                                                playsound(glob_const.funk);
                                                fail_dialogs(null, {
                                                    "error": result.error
                                                });
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                closenotify();
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            if (milli_sats > result.maxWithdrawable) {
                                                playsound(glob_const.funk);
                                                notify(translate("cardmax"), 5000);
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            if (milli_sats < result.minWithdrawable) {
                                                playsound(glob_const.funk);
                                                notify(translate("minamount", {
                                                    "min": result.minWithdrawable
                                                }), 5000);
                                                glob_const.paymentdialogbox.removeClass("accept_lnd");
                                                glob_let.ndef_processing = false;
                                                return
                                            }
                                            const callback = result.callback;
                                            if (callback) {
                                                const k1 = result.k1;
                                                if (k1) {
                                                    const descr = $("#paymentdialog input#requesttitle").val(),
                                                        final_descr = (descr && descr.length > 1) ? descr + " (Boltcard)" :
                                                        (result.defaultDescription) ? result.defaultDescription : "bitrequest " + pid + " (Boltcard)",
                                                        rqtype = request.requesttype,
                                                        postdata = {
                                                            "imp": imp,
                                                            "fn": "ln-create-invoice",
                                                            "amount": milli_sats,
                                                            "memo": final_descr,
                                                            "id": pid,
                                                            "nid": nid,
                                                            "expiry": 60,
                                                            "x-api": pk
                                                        };
                                                    if (rqtype === "incoming") {
                                                        postdata.b11 = true;
                                                    }
                                                    $.ajax({
                                                        "method": "POST",
                                                        "cache": false,
                                                        "timeout": 5000,
                                                        "url": proxy_host + "proxy/v1/ln/api/",
                                                        "data": postdata
                                                    }).done(function(inv1) {
                                                        const invoice = inv1.bolt11;
                                                        if (invoice) {
                                                            glob_const.paymentdialogbox.addClass("transacting blockd").attr("data-status", "pending");
                                                            $("#paymentdialogbox .brstatuspanel #confnumber").text("1");
                                                            notify("Monitoring...", 50000);
                                                            const ampersand = callback.includes("?") ? "&" : "?",
                                                                cb_url = callback + ampersand + "k1=" + k1 + "&pr=" + invoice;
                                                            api_proxy({
                                                                "proxy": false,
                                                                "api_url": cb_url,
                                                                "params": {
                                                                    "method": "GET",
                                                                    "cache": false,
                                                                    "timeout": 15000
                                                                }
                                                            }, proxy_host).done(function(e) {
                                                                const result = br_result(e).result;
                                                                if (result.status === "ERROR") {
                                                                    ndef_errormg(result.reason);
                                                                    return
                                                                }
                                                                if (result.status === "OK") {
                                                                    clearpinging(pid);
                                                                    closesocket(pid);
                                                                    abort_ndef();
                                                                    lnd_poll_invoice(proxy_host, pk, imp, inv1, pid, nid);
                                                                    glob_let.pinging[inv1.hash] = setInterval(function() {
                                                                        lnd_poll_invoice(proxy_host, pk, imp, inv1, pid, nid);
                                                                    }, 3000);
                                                                    return
                                                                }
                                                            }).fail(function(xhr, stat, err) {
                                                                ndef_apifail(xhr, stat, err);
                                                            });
                                                            return
                                                        }
                                                        ndef_errormg("failed to create invoice");
                                                    }).fail(function(xhr, stat, err) {
                                                        ndef_apifail(xhr, stat, err);
                                                    }).always(function() {
                                                        glob_let.ndef_processing = false;
                                                    });
                                                    return
                                                }
                                            }
                                            glob_let.ndef_processing = false;
                                        }).fail(function(xhr, stat, err) {
                                            ndef_apifail(xhr, stat, err);
                                        });
                                        return;
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

// Handles API failure for NFC operations
function ndef_apifail(xhr, stat, err) {
    const error_object = xhr || stat || err;
    fail_dialogs(null, {
        "error": error_object
    });
    glob_const.paymentdialogbox.removeClass("accept_lnd transacting");
    closenotify();
    glob_let.ndef_processing = false;
}

// Displays error messages for NFC operations
function ndef_errormg(message) {
    const pmd = $("#paymentdialogbox"),
        brstatuspanel = pmd.find(".brstatuspanel"),
        brheader = brstatuspanel.find("h2");
    brheader.text(message);
    pmd.addClass("accept_lnd transacting pd_error");
    playsound(glob_const.funk);
    closenotify();
    setTimeout(function() {
        pmd.removeClass("accept_lnd transacting pd_error");
        brheader.text(translate("waitingforpayment"));
    }, 5000);
}

// Sets up the NFC controller for scanning
function ndef_controller() {
    glob_let.ctrl = new AbortController();
    console.log("Waiting for NDEF messages.");
    glob_let.ctrl.signal.onabort = () => {
        console.log("Done waiting for NDEF messages.");
    };
}

// Aborts the NFC operation
function abort_ndef() {
    if (glob_const.ndef && glob_let.ctrl) {
        glob_let.ctrl.abort();
        glob_let.ctrl = null;
    }
}

// Polls Lightning Network data for payment status
function lnd_poll_data(proxy_host, pk, pid, nid, imp) {
    if (isopenrequest()) { // only when request is visible
        const default_error = translate("unabletoconnect");
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
        }).done(function(e) {
            poll_animate();
            const error = e.error;
            if (error) {
                const message = error.message || (typeof error === "string") ? error : default_error;
            }
            const version = e.version;
            if (version < glob_const.proxy_version) {
                proxy_alert(version);
            }
            if (e.pid == pid) {
                if (e.status == "pending" && e.bolt11) {
                    clearpinging(pid);
                    set_request_timer();
                    glob_let.pinging[e.hash] = setInterval(function() {
                        lnd_poll_invoice(proxy_host, pk, imp, e, pid, nid);
                    }, 5000);
                    return
                }
                if (e.status == "confirm" && !glob_let.lnd_confirm) {
                    glob_let.lnd_confirm = true;
                    glob_const.paymentdialogbox.addClass("accept_lnd");
                    notify(translate("acceptthepayment"), 500000);
                    playsound(glob_const.blip);
                }
                return
            }
            lnd_poll_data_fail(pid);
        }).fail(function(xhr, stat, err) {
            lnd_poll_data_fail(pid);
        });
        return
    }
    forceclosesocket();
}

// Polls Lightning Network invoice status
function lnd_poll_invoice(proxy_host, pk, imp, inv, pid, nid) {
    if (isopenrequest()) { // only when request is visible
        const default_error = "unable to connect";
        $.ajax({
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy_host + "proxy/v1/ln/api/",
            "data": {
                "fn": "ln-invoice-status",
                "imp": imp,
                "hash": inv.hash,
                "id": pid,
                "nid": nid,
                "callback": "yes",
                "type": request.requesttype,
                "x-api": pk
            }
        }).done(function(e) {
            poll_animate();
            const status = e.status;
            if (status) {
                request.address = "lnurl"; // make it a lightning request
                notify(translate("waitingforpayment"), 500000);
                helper.lnd.invoice = e;
                const txd = lnd_tx_data(e);
                confirmations(txd, true, true);
                glob_const.paymentdialogbox.removeClass("blockd");
                if (status === "paid") {
                    clearpinging(inv.hash);
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
    forceclosesocket();
}

// Handles failure in polling Lightning Network data
function lnd_poll_data_fail(pid) {
    clearpinging(pid);
    notify(translate("notmonitored"), 500000, "yes");
}

// Websockets

// Initializes and manages BlockCypher WebSocket connection
function blockcypher_websocket(socket_node, thisaddress) {
    if (glob_let.sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url + request.currencysymbol + "/main",
        websocket = glob_let.sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "event": "tx-confirmation",
            "address": thisaddress,
            "token": get_blockcypher_apikey()
        });
        websocket.send(ping_event);
        glob_let.pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
            poll_animate();
        }, 55000);
    };
    websocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        if (data.event === "pong") return;
        const txhash = data.hash;
        if (!txhash) return;
        closesocket();
        const set_confirmations = request.set_confirmations || 0,
            txd = blockcypher_poll_data(data, set_confirmations, request.currencysymbol, thisaddress);
        if (txd.double_spend) {
            const content = "<h2 class='icon-warning'>Double spend detected</h2>";
            popdialog(content, "canceldialog");
            return
        }
        closesocket();
        tx_polling_init(txd);
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initializes and manages Blockchain.info WebSocket for Bitcoin
function blockchain_btc_socket(socket_node, thisaddress) {
    if (glob_let.sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url,
        websocket = glob_let.sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "op": "addr_sub",
            "addr": thisaddress
        });
        websocket.send(ping_event);
        glob_let.pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
            poll_animate();
        }, 55000);
    };
    websocket.onmessage = function(e) {
        try {
            const json = JSON.parse(e.data).x,
                txhash = json.hash;
            if (!txhash) return;
            const set_confirmations = request.set_confirmations || 0,
                txd = blockchain_ws_data(json, set_confirmations, request.currencysymbol, thisaddress);
            if (txd) {
                closesocket();
                tx_polling_init(txd);
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initializes and manages Blockchain.info WebSocket for Bitcoin Cash
function blockchain_bch_socket(socket_node, thisaddress) {
    if (glob_let.sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url,
        websocket = glob_let.sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const c_address = (thisaddress.indexOf("bitcoincash:") > -1) ? thisaddress.split("bitcoincash:").pop() : thisaddress,
            ping_event = JSON.stringify({
                "op": "addr_sub",
                "addr": "bitcoincash:" + c_address
            });
        websocket.send(ping_event);
        glob_let.pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
            poll_animate();
        }, 55000);
    };
    websocket.onmessage = function(e) {
        try {
            const json = JSON.parse(e.data).x,
                txhash = json.hash;
            if (!txhash) return;
            const legacy = bch_legacy(thisaddress),
                set_confirmations = request.set_confirmations || 0,
                txd = blockchain_ws_data(json, set_confirmations, request.currencysymbol, thisaddress, legacy);
            if (txd) {
                closesocket();
                tx_polling_init(txd);
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initializes and manages mempool.space WebSocket for Bitcoin
function mempoolspace_btc_socket(socket_node, thisaddress) {
    if (glob_let.sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url,
        mps_websocket = glob_let.sockets[thisaddress] = new WebSocket(provider);
    mps_websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "track-address": thisaddress
        });
        mps_websocket.send(ping_event);
        glob_let.pinging[thisaddress] = setInterval(function() {
            mps_websocket.send(ping_event);
            poll_animate();
        }, 55000);
    };
    mps_websocket.onmessage = function(e) {
        try {
            const result = JSON.parse(e.data),
                result2 = result["address-transactions"];
            if (result2) {
                const json = result2[0];
                if (json) {
                    const txhash = json.txid;
                    if (!txhash) return;
                    const set_confirmations = request.set_confirmations || 0,
                        txd = mempoolspace_ws_data(json, set_confirmations, request.currencysymbol, thisaddress);
                    if (txd) {
                        closesocket();
                        tx_polling_init(txd);
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    mps_websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    mps_websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initiates Dash.org polling
function dashorg_poll() {
    address_polling_init(5000);
}

// Initializes and manages dogechain.info WebSocket for Dogecoin
function dogechain_info_socket(socket_node, thisaddress) {
    if (glob_let.sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url,
        websocket = glob_let.sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "op": "addr_sub",
            "addr": thisaddress
        });
        websocket.send(ping_event);
        glob_let.pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
            poll_animate();
        }, 55000);
    };
    websocket.onmessage = function(e) {
        try {
            const json = JSON.parse(e.data),
                data = json.x;
            if (data) {
                const txhash = data.hash;
                if (!txhash) return;
                const set_confirmations = request.set_confirmations || 0,
                    txd = dogechain_ws_data(data, set_confirmations, request.currencysymbol, thisaddress);
                if (txd) {
                    closesocket();
                    tx_polling_init(txd);
                }
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initializes and manages WebSocket for Nano cryptocurrency
function nano_socket(socket_node, thisaddress) {
    if (glob_let.sockets[thisaddress]) {
        return
    }
    const address_mod = (thisaddress.match("^xrb")) ? "nano_" + thisaddress.split("_").pop() : thisaddress, // change nano address prefix xrb_ to nano untill websocket support
        provider = socket_node.url,
        websocket = glob_let.sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "action": "subscribe",
            "topic": "confirmation",
            "all_local_accounts": true,
            "options": {
                "accounts": [address_mod]
            },
            "ack": true
        });
        websocket.send(ping_event);
        glob_let.pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
            poll_animate();
        }, 55000);
    };
    websocket.onmessage = function(e) {
        try {
            const utc = now_utc(),
                json = JSON.parse(e.data),
                data = (json.message) ? json.message : (json.account) ? json : null;
            if (data) {
                if (data.account === thisaddress) {
                    return // block outgoing transactions
                }
                if (!data.hash) return;
                const txd = nano_scan_data(data, undefined, request.currencysymbol),
                    tx_timestamp = txd.transactiontime,
                    timestamp_difference = Math.abs(tx_timestamp - utc);
                if (timestamp_difference < 60000) { // filter transactions longer then a minute ago
                    closesocket();
                    tx_polling_init(txd);
                }
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initiates Nimiq polling
function nimiq_poll() {
    address_polling_init(5000);
}

// Init eth and erc20
function init_eth_sockets(payment, socket_node, address, retry) {
    const ctracts = contracts(request.currencysymbol);
    // Always scan for layer 1
    if (payment === "ethereum") {
        if (socket_node.url === glob_const.main_alchemy_socket) {
            alchemy_eth_websocket(socket_node, address); // L1 Alchemy
        } else {
            web3_eth_websocket(socket_node, address, glob_const.main_eth_node); // L1 Infura
        }
    } else {
        web3_erc20_websocket(socket_node, address, ctracts.main);
    }
    if (retry) return
    // Check for layer 2
    init_l2_sockets(payment, address, ctracts);
}

// Initializes and manages Kaspa WebSocket
function kaspa_websocket(socket_node, thisaddress) {
    if (glob_let.sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url + "/ws/socket.io/?EIO=4&transport=websocket&sid=" + now(),
        websocket = glob_let.sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        glob_let.ws_timer = now();
        socket_info(socket_node, true);
        websocket.send("2probe");
    };
    websocket.onmessage = function(e) {
        const dat = e.data;
        if (!dat) return;
        const datid = dat.slice(0, 2);
        if (dat === "3probe") {
            websocket.send('42["join-room","blocks"]');
            return;
        }
        if (datid === "42") {
            const newdat = dat.slice(2),
                data = JSON.parse(newdat),
                contents = data[1];
            if (contents) {
                const txs = contents.txs;
                if (txs) {
                    $.each(txs, function(dat, value) {
                        const txd = kaspa_ws_data(value, thisaddress);
                        if (txd.ccval) {
                            closesocket();
                            tx_polling_init(txd);
                            return
                        }
                    });
                }
            }
        }
    };
    websocket.onclose = function(e) {
        ws_recon({ // reconnect if ws closes
            "function": kaspa_websocket,
            "node": socket_node,
            "address": thisaddress,
            "trigger": e.code
        });
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initializes and manages Kaspa FYI WebSocket
function kaspa_fyi_websocket(socket_node, thisaddress) {
    if (glob_let.sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url + "/ws/socket.io/?EIO=4&transport=websocket",
        websocket = glob_let.sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        websocket.send("40");
    };
    websocket.onmessage = function(e) {
        const dat = e.data;
        if (!dat) return;
        const datid = dat.slice(0, 2);
        if (datid == "40") {
            websocket.send('42["join-room","blocks"]');
            return;
        }
        if (datid == "42") {
            try {
                const newdat = dat.slice(2),
                    data = JSON.parse(newdat),
                    contents = data[1];
                if (contents) {
                    const txs = contents.transactions;
                    if (txs) {
                        $.each(txs, function(dat, value) {
                            const txd = kaspa_fyi_ws_data(value, thisaddress);
                            if (txd.ccval) {
                                closesocket();
                                tx_polling_init(txd);
                                return
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Error processing Kaspa FYI message:", error);
            }
        }
    };
    websocket.onclose = function(e) {
        ws_recon({ // reconnect if ws closes
            "function": kaspa_fyi_websocket,
            "node": socket_node,
            "address": thisaddress,
            "trigger": e.code
        });
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initializes and manages Alchemy WebSocket for Ethereum
function alchemy_eth_websocket(socket_node, thisaddress) {
    if (glob_let.sockets[thisaddress]) {
        return
    }
    const provider_url = socket_node.url,
        al_id = get_alchemy_apikey(),
        provider = provider_url + al_id,
        websocket = glob_let.sockets[thisaddress] = new WebSocket(provider);
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
        glob_let.pinging[thisaddress] = setInterval(function() {
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
                tx_polling_init(txd);
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initializes and manages WebSocket for Ethereum and Ethereum-like networks
function web3_eth_websocket(socket_node, thisaddress, rpcurl) {
    const l2network = socket_node.network,
        provider_url = socket_node.url,
        if_id = get_infura_apikey(provider_url),
        provider = provider_url + if_id,
        ws_id = sha_sub(provider, 10);
    if (glob_let.sockets[ws_id]) {
        return
    }
    const websocket = glob_let.sockets[ws_id] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": ["newHeads"]
        });
        websocket.send(ping_event);
        glob_let.pinging[thisaddress] = setInterval(function() {
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
                                tx_polling_init(txd);
                                if (l2network) {
                                    set_l2_status_init(socket_node, "paid");
                                }
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
function web3_erc20_websocket(socket_node, thisaddress, contract, ws_id) {
    if (glob_let.sockets[ws_id]) {
        return
    }
    const l2network = socket_node.network,
        provider_url = complete_url(socket_node.url),
        if_id = get_infura_apikey(provider_url),
        provider = provider_url + if_id,
        websocket = glob_let.sockets[ws_id] = new WebSocket(provider);
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
                        };
                    closesocket();
                    tx_polling_init(txd);
                    if (l2network) {
                        set_l2_status_init(socket_node, "paid");
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };
    websocket.onclose = function(e) {
        if (e.code === 1008) { // closed because of API limit, switch to polling
            console.error("Disconnected from " + socket_node.url);
            glob_let.ws_timer = 0;
            handle_socket_fails(socket_node, thisaddress, ws_id, l2network);
            return
        }
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, ws_id, l2network);
    };
}

// Handles WebSocket connection failures
function handle_socket_fails(socket_node, thisaddress, socketid, l2) {
    if (isopenrequest()) { // only when request is visible
        if (request.currencysymbol === "bch" && glob_const.paymentdialogbox.hasClass("transacting")) { // temp fix for bch socket
            return
        }
        const wsid = socketid || thisaddress;
        forceclosesocket(wsid);
        const next_socket = try_next_socket(socket_node, l2);
        if (next_socket) {
            if (l2) {
                const ctracts = contracts(request.currencysymbol);
                if (ctracts && socketid) {
                    clearpinging(socketid);
                    init_layer2(next_socket, thisaddress, ctracts, true);
                }
                return
            }
            init_socket(next_socket, thisaddress, null, true);
            return
        }
        if (l2) {
            // No poll fallback for L2
        } else {
            const coin_settings = getcoinsettings(request.payment),
                poll_fallback = q_obj(coin_settings, "websockets.poll_fallback");
            if (poll_fallback) {
                init_socket({
                    "name": "poll_fallback",
                    "display": false
                }, thisaddress, null, true);
                return
            }
        }
        socket_info(socket_node, false);
        console.error("Socket error:", "unable to connect to " + socket_node.name);
    }
}

// Handles WebSocket connection closure
function handle_socket_close(socket_node) {
    socket_info(socket_node, false);
    console.log("Disconnected from " + socket_node.url);
    glob_let.ws_timer = 0;
}

// Manages Kaspa WebSocket reconnection
function ws_recon(recon) {
    if (!recon) return;
    const trigger = recon.trigger,
        address = recon.address;
    if (trigger !== 1000 || !address || glob_const.paymentdialogbox.attr("data-status") !== "new") return;
    const c_time = now() - glob_let.ws_timer;
    if (c_time < 10000) return;
    const timeout = setTimeout(function() {
        if (isopenrequest()) {
            recon.function(recon.node, address);
        }
    }, 2000, function() {
        clearTimeout(timeout);
    });
}

// Attempts to find the next available WebSocket
function try_next_socket(current_socket_data, l2) {
    if (!current_socket_data) return false;
    if (block_overflow("socket")) return false; // prevent overflow
    const current_socket_url = current_socket_data.url,
        sockets = l2 ? q_obj(getcoinsettings(request.payment), "layer2.options." + current_socket_data.network + ".websockets") : helper.socket_list,
        socketlist = sockets.options ? $.merge(sockets.apis, sockets.options) : sockets.apis;
    if (!socketlist.length) return false;
    let socket_index;
    $.each(socketlist, function(i, val) {
        if (val.url == current_socket_url) {
            socket_index = i;
        }
    });
    if (socket_index > -1) {
        const next_scan = socketlist[socket_index + 1],
            next_socket = next_scan || socketlist[0],
            l2_prefix = l2 || "";
        if (glob_let.socket_attempt[sha_sub(next_socket.url + l2_prefix, 15)] === true) {
            return false;
        }
        if (next_socket) {
            return next_socket;
        }
    }
}

// Closes WebSocket connections
function closesocket(s_id) {
    if (s_id) { // close this socket
        if (glob_let.sockets[s_id]) {
            glob_let.sockets[s_id].close();
            delete glob_let.sockets[s_id];
        }
    } else { // close all sockets
        $.each(glob_let.sockets, function(key, value) {
            value.close();
        });
        glob_let.sockets = {};
    }
}

// Updates the UI with socket connection information
function socket_info(snode, live, polling) {
    if (!is_openrequest()) {
        return
    }
    if (snode.network) {
        set_l2_status_init(snode, live);
        return
    }
    const node_name = snode.url || snode.name,
        islive = live ? " <span class='pulse'></span>" : " <span class='icon-wifi-off'></span>",
        method = polling ? "polling" : "websocket",
        contents = method + ": " + node_name + islive,
        paymentaddress = $("#paymentaddress");
    $("#current_socket").html(contents);
    if (live) {
        console.log("Connected: " + node_name);
        helper.l1_status = true;
        paymentaddress.addClass("live");
        glob_const.paymentpopup.addClass("live");
        closenotify();
        return
    }
    setTimeout(function() {
        if (glob_const.paymentdialogbox.hasClass("transacting")) return;
        if (!is_openrequest()) return;
        paymentaddress.removeClass("live");
        helper.l1_status = false;
        if (helper.l2_status === false) {
            glob_const.paymentpopup.removeClass("live");
            notify(translate("websocketoffline"), 500000, "yes");
        }
    }, 1000);
}