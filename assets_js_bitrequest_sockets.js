let glob_lnd_confirm = false,
    glob_ndef_processing,
    glob_ndef_timer = 0,
    glob_ws_timer = 0,
    glob_l2s = {};

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
    //nano_socket
    //kaspa_websocket
    //kaspa_fyi_websocket
    //handle_socket_fails
    //handle_socket_close
    //ws_recon
    //try_next_socket
    //current_socket
    //socket_info
    //set_l2_status
});

// Websockets / Pollfunctions

// Initializes a socket connection based on the payment type and node configuration
function init_socket(socket_node, address, swtch, retry) {
    if (glob_offline) {
        notify(translate("youareoffline") + ". " + translate("notmonitored"));
        return
    }
    glob_api_attempts = {};
    const payment = request.payment,
        rq_init = request.rq_init,
        request_ts_utc = rq_init + glob_timezone,
        request_ts = request_ts_utc - 30000;
    let socket_name;
    if (socket_node) {
        socket_name = socket_node.name;
        if (socket_name === "poll_fallback") {
            init_account_polling();
            return
        } else {
            glob_socket_attempt[sha_sub(socket_node.url + "l1", 15)] = true;
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
    if (payment === "ethereum" || request.erc20) {
        init_eth_sockets(payment, socket_node, address, request_ts, request.token_contract, retry);
        return
    }
    if (payment === "monero") {
        const vk = swtch ? get_vk(address) : request.viewkey;
        if (vk) {
            trigger_requeststates(); // update outgoing
            const account = vk.account || address,
                viewkey = vk.vk;
            request.monitored = true;
            if (swtch) {
                request.viewkey = vk;
            }
            closenotify();
            init_xmr_node(9, account, viewkey, request_ts);
            return
        }
        request.monitored = false;
        request.viewkey = false;
        notify(translate("notmonitored"), 500000, "yes");
        return
    }
    if (payment === "nimiq") {
        nimiq_poll();
        return
    }
    if (payment === "kaspa") {
        if (socket_name === glob_main_kas_wss) {
            kaspa_websocket(socket_node, address);
            return
        }
        if (socket_name === glob_sec_kas_wss) {
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
    if (glob_local === true) {
        blockcypher_websocket(socket_node, address);
        return
    }
    handle_socket_fails(socket_node, address);
}

// Sets up a Lightning Network socket connection
function lightning_socket(lnd) {
    glob_lnd_confirm = false;
    const p_arr = lnurl_deform(lnd.proxy_host),
        proxy_host = p_arr.url,
        pk = (lnd.pw) ? lnd.pw : p_arr.k,
        pid = lnd.pid,
        nid = lnd.nid,
        imp = lnd.imp;
    if (glob_sockets[pid]) {
        return
    }
    const socket = glob_sockets[pid] = new WebSocket(glob_ln_socket);
    socket.onopen = function(e) {
        console.log("Connected: " + glob_ln_socket);
        glob_paymentpopup.addClass("live");
        const ping_event = JSON.stringify({
            "id": pid
        });
        socket.send(ping_event);
        glob_pinging[pid] = setInterval(function() {
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
                glob_pinging[result.hash] = setInterval(function() {
                    lnd_poll_invoice(proxy_host, pk, imp, result, pid, nid);
                }, 5000);
            }
            if (result.status === "confirm" && !glob_lnd_confirm) {
                glob_lnd_confirm = true;
                glob_paymentdialogbox.addClass("accept_lnd");
                notify(translate("acceptthepayment"), 500000);
                vibrate();
                playsound(glob_blip);
            }
            set_request_timer();
            return
        }
    };
    socket.onclose = function(e) {
        console.log("Disconnected");
    };
    socket.onerror = function(e) {
        glob_lnd_confirm = false;
        glob_paymentpopup.addClass("live");
        glob_pinging[pid] = setInterval(function() {
            lnd_poll_data(proxy_host, pk, pid, nid, imp);
        }, 5000);
    };
    ln_ndef(proxy_host, pk, pid, nid, imp);
}

// Handles NFC (Near Field Communication) functionality for Lightning Network payments
async function ln_ndef(proxy_host, pk, pid, nid, imp) {
    if (!glob_ndef) return;
    glob_ndef_processing = false;
    try {
        ndef_controller();
        await glob_ndef.scan({
            "signal": glob_ctrl.signal
        });
        glob_ndef.onreading = event => {
            if ((now() - 6000) < glob_ndef_timer) { // prevent too many taps
                playsound(glob_funk);
                notify(translate("ndeftablimit"), 6000);
                return;
            }
            glob_ndef_timer = now();
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
                                            playsound(glob_funk);
                                            notify(translate("enteramount"), 5000);
                                            return
                                        }
                                        if (glob_ndef_processing) {
                                            playsound(glob_funk);
                                            console.log("already processing");
                                            return
                                        }
                                        playsound(glob_blip);
                                        notify("Processing...", 50000);
                                        glob_paymentdialogbox.addClass("accept_lnd");
                                        set_request_timer();
                                        const lnurl_http = "https://" + prefix[1];
                                        glob_ndef_processing = true;
                                        api_proxy({
                                            "api_url": lnurl_http,
                                            "params": {
                                                "method": "GET",
                                                "cache": false
                                            }
                                        }, proxy_host).done(function(e) {
                                            const result = br_result(e).result;
                                            if (!result) { // catch lightning node connection failure
                                                playsound(glob_funk);
                                                notify(translate("unabletoconnectln"), 5000);
                                                glob_paymentdialogbox.removeClass("accept_lnd");
                                                glob_ndef_processing = false;
                                                return
                                            }
                                            if (result.status === "ERROR") {
                                                playsound(glob_funk);
                                                const error_message = result.reason;
                                                notify(error_message, 5000);
                                                glob_paymentdialogbox.removeClass("accept_lnd");
                                                glob_ndef_processing = false;
                                                return
                                            }
                                            if (result.error) {
                                                playsound(glob_funk);
                                                api_eror_msg(null, get_api_error_data(result.error));
                                                glob_paymentdialogbox.removeClass("accept_lnd");
                                                closenotify();
                                                glob_ndef_processing = false;
                                                return
                                            }
                                            if (milli_sats > result.maxWithdrawable) {
                                                playsound(glob_funk);
                                                notify(translate("cardmax"), 5000);
                                                glob_paymentdialogbox.removeClass("accept_lnd");
                                                glob_ndef_processing = false;
                                                return
                                            }
                                            if (milli_sats < result.minWithdrawable) {
                                                playsound(glob_funk);
                                                notify(translate("minamount", {
                                                    "min": result.minWithdrawable
                                                }), 5000);
                                                glob_paymentdialogbox.removeClass("accept_lnd");
                                                glob_ndef_processing = false;
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
                                                            glob_paymentdialogbox.addClass("transacting blockd").attr("data-status", "pending");
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
                                                                    glob_pinging[inv1.hash] = setInterval(function() {
                                                                        lnd_poll_invoice(proxy_host, pk, imp, inv1, pid, nid);
                                                                    }, 3000);
                                                                    return
                                                                }
                                                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                                                ndef_apifail(jqXHR, textStatus, errorThrown);
                                                            });
                                                            return
                                                        }
                                                        ndef_errormg("failed to create invoice");
                                                    }).fail(function(jqXHR, textStatus, errorThrown) {
                                                        ndef_apifail(jqXHR, textStatus, errorThrown);
                                                    }).always(function() {
                                                        glob_ndef_processing = false;
                                                    });
                                                    return
                                                }
                                            }
                                            glob_ndef_processing = false;
                                        }).fail(function(jqXHR, textStatus, errorThrown) {
                                            ndef_apifail(jqXHR, textStatus, errorThrown);
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
function ndef_apifail(jqXHR, textStatus, errorThrown) {
    const error_object = errorThrown || jqXHR;
    api_eror_msg(null, get_api_error_data(error_object));
    glob_paymentdialogbox.removeClass("accept_lnd transacting");
    closenotify();
    glob_ndef_processing = false;
}

// Displays error messages for NFC operations
function ndef_errormg(message) {
    const pmd = $("#paymentdialogbox"),
        brstatuspanel = pmd.find(".brstatuspanel"),
        brheader = brstatuspanel.find("h2");
    brheader.text(message);
    pmd.addClass("accept_lnd transacting pd_error");
    playsound(glob_funk);
    closenotify();
    setTimeout(function() {
        pmd.removeClass("accept_lnd transacting pd_error");
        brheader.text(translate("waitingforpayment"));
    }, 5000);
}

// Sets up the NFC controller for scanning
function ndef_controller() {
    glob_ctrl = new AbortController();
    console.log("Waiting for NDEF messages.");
    glob_ctrl.signal.onabort = () => {
        console.log("Done waiting for NDEF messages.");
    };
}

// Aborts the NFC operation
function abort_ndef() {
    if (glob_ndef && glob_ctrl) {
        glob_ctrl.abort();
        glob_ctrl = null;
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
                const message = error?.message ?? (typeof e.error === "string" ? error : default_error);
            }
            const version = e.version;
            if (version < glob_proxy_version) {
                proxy_alert(version);
            }
            if (e.pid == pid) {
                if (e.status == "pending" && e.bolt11) {
                    clearpinging(pid);
                    set_request_timer();
                    glob_pinging[e.hash] = setInterval(function() {
                        lnd_poll_invoice(proxy_host, pk, imp, e, pid, nid);
                    }, 5000);
                    return
                }
                if (e.status == "confirm" && !glob_lnd_confirm) {
                    glob_lnd_confirm = true;
                    glob_paymentdialogbox.addClass("accept_lnd");
                    notify(translate("acceptthepayment"), 500000);
                    playsound(glob_blip);
                }
                return
            }
            lnd_poll_data_fail(pid);
        }).fail(function(jqXHR, textStatus, errorThrown) {
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
                glob_paymentdialogbox.removeClass("blockd");
                if (status === "paid") {
                    clearpinging(inv.hash);
                    helper.currencylistitem.removeData("url");
                    br_remove_local("editurl");
                    br_remove_session("lndpid");
                    closenotify();
                    return
                }
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
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
    if (glob_sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url + request.currencysymbol + "/main",
        websocket = glob_sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "event": "tx-confirmation",
            "address": thisaddress,
            "token": get_blockcypher_apikey()
        });
        websocket.send(ping_event);
        glob_pinging[thisaddress] = setInterval(function() {
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
        pick_monitor(txd);
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
    if (glob_sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url,
        websocket = glob_sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "op": "addr_sub",
            "addr": thisaddress
        });
        websocket.send(ping_event);
        glob_pinging[thisaddress] = setInterval(function() {
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
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initializes and manages Blockchain.info WebSocket for Bitcoin Cash
function blockchain_bch_socket(socket_node, thisaddress) {
    if (glob_sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url,
        websocket = glob_sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const c_address = (thisaddress.indexOf("bitcoincash:") > -1) ? thisaddress.split("bitcoincash:").pop() : thisaddress,
            ping_event = JSON.stringify({
                "op": "addr_sub",
                "addr": "bitcoincash:" + c_address
            });
        websocket.send(ping_event);
        glob_pinging[thisaddress] = setInterval(function() {
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
        handle_socket_fails(socket_node, thisaddress);
        return
    };
}

// Initializes and manages mempool.space WebSocket for Bitcoin
function mempoolspace_btc_socket(socket_node, thisaddress) {
    if (glob_sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url,
        mps_websocket = glob_sockets[thisaddress] = new WebSocket(provider);
    mps_websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "track-address": thisaddress
        });
        mps_websocket.send(ping_event);
        glob_pinging[thisaddress] = setInterval(function() {
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
                        pick_monitor(txd);
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

// Initializes and manages dogechain.info WebSocket for Dogecoin
function dogechain_info_socket(socket_node, thisaddress) {
    if (glob_sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url,
        websocket = glob_sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        const ping_event = JSON.stringify({
            "op": "addr_sub",
            "addr": thisaddress
        });
        websocket.send(ping_event);
        glob_pinging[thisaddress] = setInterval(function() {
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
                    pick_monitor(txd);
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
    if (glob_sockets[thisaddress]) {
        return
    }
    const address_mod = (thisaddress.match("^xrb")) ? "nano_" + thisaddress.split("_").pop() : thisaddress, // change nano address prefix xrb_ to nano untill websocket support
        provider = socket_node.url,
        websocket = glob_sockets[thisaddress] = new WebSocket(provider);
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
        glob_pinging[thisaddress] = setInterval(function() {
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
                    pick_monitor(txd);
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

// Initializes and manages Kaspa WebSocket
function kaspa_websocket(socket_node, thisaddress) {
    if (glob_sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url + "/ws/socket.io/?EIO=4&transport=websocket&sid=" + now(),
        websocket = glob_sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        glob_ws_timer = now();
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
                            pick_monitor(txd);
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
    if (glob_sockets[thisaddress]) {
        return
    }
    const provider = socket_node.url + "/ws/socket.io/?EIO=4&transport=websocket",
        websocket = glob_sockets[thisaddress] = new WebSocket(provider);
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
                                pick_monitor(txd);
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

// Handles WebSocket connection failures
function handle_socket_fails(socket_node, thisaddress, socketid, l2) {
    if (glob_paymentdialogbox.hasClass("transacting")) { // temp fix for bch socket
        return
    }
    if (isopenrequest()) { // only when request is visible
        const next_socket = try_next_socket(socket_node, l2),
            wsid = (socketid) ? socketid : thisaddress;
        forceclosesocket(wsid);
        if (next_socket) {
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
        const error_message = "unable to connect to " + socket_node.name;
        socket_info(socket_node, false);
    }
}

// Handles WebSocket connection closure
function handle_socket_close(socket_node) {
    socket_info(socket_node, false);
    console.log("Disconnected from " + socket_node.url);
    glob_ws_timer = 0;
}

// Manages Kaspa WebSocket reconnection
function ws_recon(recon) {
    if (!recon) return;
    const trigger = recon.trigger,
        address = recon.address;
    if (trigger !== 1000 || !address || glob_paymentdialogbox.attr("data-status") !== "new") return;
    const c_time = now() - glob_ws_timer;
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
    const current_socket_url = current_socket_data.url,
        sockets = l2 ? q_obj(getcoinsettings(request.payment), "layer2.options." + current_socket_data.network + ".websockets") : helper.socket_list,
        socketlist = sockets.options ? $.merge(sockets.apis, sockets.options) : sockets.apis;
    let socket_index;
    $.each(socketlist, function(i, val) {
        if (val.url == current_socket_url) {
            socket_index = i;
        }
    });
    if (socket_index > -1) {
        const next_scan = socketlist[socket_index + 1],
            next_socket = next_scan || socketlist[0],
            l2_prefix = l2 ? "l2" : "l1";
        if (glob_socket_attempt[sha_sub(next_socket.url + l2_prefix, 15)] === true) {
            return false;
        }
        if (next_socket) {
            return next_socket;
        }
    }
}

// Updates the UI with socket connection information
function socket_info(snode, live, polling) {
    const l2 = snode.network;
    if (l2) {
        set_l2_status(snode, live);
    } else {
        const islive = live ? " <span class='pulse'></span>" : " <span class='icon-wifi-off'></span>",
            method = polling ? "polling" : "websocket",
            contents = method + ": " + snode.url + islive,
            paymentaddress = $("#paymentaddress");
        $("#current_socket").html(contents);
        if (live) {
            paymentaddress.addClass("live");
        } else {
            paymentaddress.removeClass("live");
        }
    }
    if (live) {
        console.log("Connected: " + snode.url);
        glob_paymentpopup.addClass("live");
        closenotify();
    } else {
        setTimeout(function() {
            if (is_openrequest() !== true) {
                return
            }
            if (glob_paymentdialogbox.hasClass("transacting")) {
                return
            }
            if ($("#paymentaddress").hasClass("live")) {
                return
            }
            const l2nws = glob_paymentpopup.find("li.nwl2.online");
            if (!l2nws.length) {
                glob_paymentpopup.removeClass("live");
                notify(translate("websocketoffline"), 500000, "yes");
            }
        }, 1000);
    }
}