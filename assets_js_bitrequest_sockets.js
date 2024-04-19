let sockets = {},
    pinging = {},
    lnd_confirm = false,
    ndef_processing,
    ndef_timer = 0,
    ws_timer = 0;

$(document).ready(function() {
    //init_socket
    //blockcypherws
    //lightning_socket
    //ln_ndef
    //ndef_apifail
    //ndef_errormg
    //ndef_controller
    //abort_ndef
    //init_xmr_node
    //ping_xmr_node
    //blockcypher_websocket
    //blockchain_btc_socket
    //blockchain_bch_socket
    //mempoolspace_btc_socket
    //nano_socket
    //web3_eth_websocket
    //web3_erc20_websocket
    //kaspa_websocket
    //kaspa_fyi_websocket
    //handle_socket_fails
    //handle_socket_close
    //ws_recon
    //try_next_socket
    //current_socket
    reconnect();

    // Polling

    //init_xmr_node
    //ping_xmr_node
    //after_poll
    //ap_loader
    //nano_scan_poll
    //mempoolspace_scan_poll
    //blockcypher_scan_poll
    //blockchair_scan_poll
    //erc20_scan_poll
    //after_poll_fails
    //rconnect
    //get_next_scan_api
});

// Websockets / Pollfunctions

function init_socket(socket_node, address, swtch, retry) {
    if (offline === true) {
        notify("You are currently offline, request is not monitored");
        return
    }
    scan_attempts = {};
    let payment = request.payment,
        socket_name,
        rq_init = request.rq_init,
        request_ts_utc = rq_init + timezone,
        request_ts = request_ts_utc - 30000;
    if (socket_node) {
        socket_name = socket_node.name;
        socket_attempt[btoa(socket_node.url)] = true;
    }
    if (payment == "bitcoin") {
        if (address == "lnurl") {
            // lightning only
        } else {
            if (socket_name == "mempool.space websocket" || socket_node.default === false) {
                mempoolspace_btc_socket(socket_node, address);
            } else if (socket_name == "blockcypher wss") {
                blockcypher_websocket(socket_node, address);
            } else if (socket_name == "blockcypher ws") {
                blockcypherws(socket_node, address);
            } else if (socket_name == "blockchain.info websocket") {
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
    if (payment == "litecoin") {
        if (socket_name == "mempool.space websocket" || socket_node.default === false) {
            mempoolspace_btc_socket(socket_node, address);
            return
        }
        if (socket_name == "blockcypher wss") {
            blockcypher_websocket(socket_node, address);
            return
        }
        if (socket_name == "blockcypher ws") {
            blockcypherws(socket_node, address);
            return
        }
        blockcypher_websocket(socket_node, address);
        return
    }
    if (payment == "dogecoin") {
        if (socket_name == "mempool.space websocket" || socket_node.default === false) {
            mempoolspace_btc_socket(socket_node, address);
            return
        }
        if (socket_name == "blockcypher wss") {
            blockcypher_websocket(socket_node, address);
            return
        }
        if (socket_name == "blockcypher ws") {
            blockcypherws(socket_node, address);
            return
        }
        if (socket_name == "dogechain api") {
            dogechain_info_socket(socket_node, address);
            return
        }
        blockcypher_websocket(socket_node, address);
        return
    }
    if (payment == "bitcoin-cash") {
        if (socket_name == "mempool.space websocket" || socket_node.default === false) {
            mempoolspace_btc_socket(socket_node, address);
            return
        }
        if (socket_name == "blockchain.info websocket") {
            blockchain_bch_socket(socket_node, address);
            return
        }
        blockchain_bch_socket(socket_node, address);
        return
    }
    if (payment == "nano") {
        nano_socket(socket_node, address);
        return
    }
    if (payment == "ethereum") {
        if (socket_node.url == main_alchemy_socket) {
            alchemy_eth_websocket(socket_node, address); // L1 Alchemy
            arbi_scan(address, request_ts); // L2 Arbitrum
        }
        else {
            web3_eth_websocket(socket_node, address, main_eth_node); // L1 Infura
            web3_eth_websocket({
                "name": main_arbitrum_socket,
                "url": main_arbitrum_socket
            }, address, main_arbitrum_node); // L2 Infura Arbitrum
        }
        notify("networks: ETH, Arbitrum", 500000, "yes");
        return
    }
    if (payment == "monero") {
        clearpinging();
        let vk = (swtch) ? get_vk(address) : request.viewkey;
        if (vk) {
            trigger_requeststates(); // update outgoing
            let account = (vk.account) ? vk.account : address,
                viewkey = vk.vk,
                rq_init = request.rq_init,
                request_ts_utc = rq_init + timezone,
                request_ts = request_ts_utc - 30000; // 30 seconds compensation for unexpected results
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
        notify("this address is not monitored", 500000, "yes");
        return
    }
    if (payment == "nimiq") {
        clearpinging();
        nimiq_scan(address, request_ts);
        return
    }
    if (payment == "kaspa") {
        if (socket_name == main_kas_wss) {
            kaspa_websocket(socket_node, address);
            return
        }
        if (socket_name == sec_kas_wss) {
            kaspa_fyi_websocket(socket_node, address);
            return
        }
        kaspa_websocket(socket_node, address);
        return
    }
    if (request.erc20 === true) {
        clearpinging();
        web3_erc20_websocket(socket_node, address, request.token_contract);
        let ccsymbol = request.currencysymbol;
        bnb_scan(address, request_ts, ccsymbol);
        // arbitrum:
        let arb_contract = contracts(ccsymbol, "arbitrum");
        var arbtxt = "";
        if (arb_contract) {
            web3_erc20_websocket({
                "name": main_arbitrum_socket,
                "url": main_arbitrum_socket
            }, address, arb_contract);
            var arbtxt = " Arbitrum,";
        }
        notify("networks: ETH," + arbtxt + " <span class='nowrap'>BNB smart chain</span>", 500000, "yes");
        return
    }
    notify("this request is not monitored", 500000, "yes")
}

function blockcypherws(socket_node, address) {
    if (local === true) {
        blockcypher_websocket(socket_node, address);
    } else {
        handle_socket_fails(socket_node, address)
    }
}

function lightning_socket(lnd) {
    lnd_confirm = false;
    let p_arr = lnurl_deform(lnd.proxy_host),
        proxy_host = p_arr.url,
        pk = (lnd.pw) ? lnd.pw : p_arr.k,
        pid = lnd.pid,
        nid = lnd.nid,
        imp = lnd.imp,
        socket = sockets[pid] = new WebSocket(ln_socket);
    socket.onopen = function(e) {
        console.log("Connected: " + ln_socket);
        let ping_event = JSON.stringify({
            "id": pid
        });
        socket.send(ping_event);
        pinging[pid] = setInterval(function() {
            socket.send(ping_event);
        }, 55000);
    };
    socket.onmessage = function(e) {
        let result = JSON.parse(e.data);
        if (result.pid == pid) {
            if (result.status == "pending" && result.bolt11) {
                clearpinging(pid);
                closesocket(pid);
                lnd_poll_invoice(proxy_host, pk, imp, result, pid, nid);
                pinging[result.hash] = setInterval(function() {
                    lnd_poll_invoice(proxy_host, pk, imp, result, pid, nid);
                }, 5000);
            }
            if (result.status == "confirm" && !lnd_confirm) {
                lnd_confirm = true;
                paymentdialogbox.addClass("accept_lnd");
                notify("Accept the payment in your lightning app...", 500000);
                vibrate();
                playsound(blip);
            }
            set_request_timer();
            return
        }
    };
    socket.onclose = function(e) {
        console.log("Disconnected");
    };
    socket.onerror = function(e) {
        lnd_confirm = false;
        pinging[pid] = setInterval(function() {
            lnd_poll_data(proxy_host, pk, pid, nid, imp);
        }, 5000);
    };
    ln_ndef(proxy_host, pk, pid, nid, imp);
}

async function ln_ndef(proxy_host, pk, pid, nid, imp) {
    if (ndef) {
        ndef_processing = false;
        try {
            ndef_controller();
            await ndef.scan({
                "signal": ctrl.signal
            });
            ndef.onreading = event => {
                if ((now() - 6000) < ndef_timer) { // prevent too many taps
                    playsound(funk);
                    notify("Tapped too quick", 6000);
                    return;
                }
                ndef_timer = now();
                closenotify();
                let message = event.message;
                if (message) {
                    let records = message.records;
                    if (records) {
                        let first_record = records[0];
                        if (first_record) {
                            let data = first_record.data;
                            if (data) {
                                let lnurlw = utf8Decoder.decode(data);
                                if (lnurlw) {
                                    if (lnurlw.indexOf("p=") && lnurlw.indexOf("c=")) {
                                        let prefix = lnurlw.split("urlw://");
                                        if (prefix[0] == "ln") {
                                            let amount_rel = $("#open_wallet").attr("data-rel"),
                                                ccraw = (amount_rel.length) ? parseFloat(amount_rel) : 0,
                                                milli_sats = (ccraw * 100000000000).toFixed(0);
                                            if (ccraw <= 0) {
                                                playsound(funk);
                                                notify("Please enter amount", 5000);
                                                return
                                            }
                                            if (ndef_processing) {
                                                playsound(funk);
                                                console.log("already processing");
                                                console.log(ndef_processing);
                                                return
                                            }
                                            playsound(blip);
                                            notify("Processing...", 50000);
                                            paymentdialogbox.addClass("accept_lnd");
                                            set_request_timer();
                                            let lnurl_http = "https://" + prefix[1];
                                            ndef_processing = true;
                                            api_proxy({
                                                "api_url": lnurl_http,
                                                "params": {
                                                    "method": "GET",
                                                    "cache": false
                                                }
                                            }, proxy_host).done(function(e) {
                                                let result = br_result(e).result;
                                                if (result.status == "ERROR") {
                                                    playsound(funk);
                                                    let error_message = result.reason;
                                                    notify(error_message, 5000);
                                                    paymentdialogbox.removeClass("accept_lnd");
                                                    ndef_processing = false;
                                                    return
                                                }
                                                if (result.error) {
                                                    playsound(funk);
                                                    api_eror_msg(null, get_api_error_data(result.error));
                                                    paymentdialogbox.removeClass("accept_lnd");
                                                    closenotify();
                                                    ndef_processing = false;
                                                    return
                                                }
                                                if (milli_sats > result.maxWithdrawable) {
                                                    playsound(funk);
                                                    notify("Request exceeds card's maximum", 5000);
                                                    paymentdialogbox.removeClass("accept_lnd");
                                                    ndef_processing = false;
                                                    return
                                                }
                                                if (milli_sats < result.minWithdrawable) {
                                                    playsound(funk);
                                                    notify("Minimum request amount is " + result.minWithdrawable, 5000);
                                                    paymentdialogbox.removeClass("accept_lnd");
                                                    ndef_processing = false;
                                                    return
                                                }
                                                let callback = result.callback;
                                                if (callback) {
                                                    let k1 = result.k1;
                                                    if (k1) {
                                                        let descr = $("#paymentdialog input#requesttitle").val(),
                                                            final_descr = (descr && descr.length > 1) ? descr + " (Boltcard)" :
                                                            (result.defaultDescription) ? result.defaultDescription : "bitrequest " + pid + " (Boltcard)";
                                                        $.ajax({
                                                            "method": "POST",
                                                            "cache": false,
                                                            "timeout": 5000,
                                                            "url": proxy_host + "proxy/v1/ln/api/",
                                                            "data": {
                                                                "imp": imp,
                                                                "fn": "ln-create-invoice",
                                                                "amount": milli_sats,
                                                                "memo": final_descr,
                                                                "id": pid,
                                                                "nid": nid,
                                                                "expiry": 60,
                                                                "x-api": pk
                                                            }
                                                        }).done(function(inv1) {
                                                            let invoice = inv1.bolt11;
                                                            if (invoice) {
                                                                paymentdialogbox.addClass("transacting blockd").attr("data-status", "pending");
                                                                $("#paymentdialogbox .brstatuspanel #confnumber").text("1");
                                                                notify("Monitoring...", 50000);
                                                                let ampersand = (callback.indexOf("?") > 0) ? "&" : "?",
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
                                                                    let result = br_result(e).result;
                                                                    if (result.status == "ERROR") {
                                                                        ndef_errormg(result.reason);
                                                                        return
                                                                    }
                                                                    if (result.status == "OK") {
                                                                        clearpinging(pid);
                                                                        closesocket(pid);
                                                                        abort_ndef();
                                                                        lnd_poll_invoice(proxy_host, pk, imp, inv1, pid, nid);
                                                                        pinging[inv1.hash] = setInterval(function() {
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
                                                            ndef_processing = false;
                                                        });
                                                        return
                                                    }
                                                }
                                                ndef_processing = false;
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
        return
    }
}

function ndef_apifail(jqXHR, textStatus, errorThrown) {
    let error_object = (errorThrown) ? errorThrown : jqXHR;
    api_eror_msg(null, get_api_error_data(error_object));
    paymentdialogbox.removeClass("accept_lnd transacting");
    closenotify();
    ndef_processing = false;
}

function ndef_errormg(message) {
    let pmd = $("#paymentdialogbox"),
        brstatuspanel = pmd.find(".brstatuspanel"),
        brheader = brstatuspanel.find("h2");
    brheader.text(message);
    pmd.addClass("accept_lnd transacting pd_error");
    playsound(funk);
    closenotify();
    setTimeout(function() {
        pmd.removeClass("accept_lnd transacting pd_error");
        brheader.text("Waiting for payment");
    }, 5000);
}

function ndef_controller() {
    ctrl = new AbortController();
    console.log("Waiting for NDEF messages.");
    ctrl.signal.onabort = () => {
        console.log("Done waiting for NDEF messages.");
    };
}

function abort_ndef() {
    if (ndef && ctrl) {
        ctrl.abort();
        ctrl = null;
    }
}

function lnd_poll_data(proxy_host, pk, pid, nid, imp) {
    if (paymentpopup.hasClass("active")) { // only when request is visible
        let default_error = "unable to connect";
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
            let error = e.error;
            if (error) {
                let message = (error) ? (error.message) ? error.message : (typeof error == "string") ? error : default_error : default_error;
                console.log(message);
            }
            let version = e.version;
            if (version != proxy_version) {
                proxy_alert(version);
            }
            if (e.pid == pid) {
                if (e.status == "pending" && e.bolt11) {
                    clearpinging(pid);
                    set_request_timer();
                    pinging[e.hash] = setInterval(function() {
                        lnd_poll_invoice(proxy_host, pk, imp, e, pid, nid);
                    }, 5000);
                    return
                }
                if (e.status == "confirm" && !lnd_confirm) {
                    lnd_confirm = true;
                    paymentdialogbox.addClass("accept_lnd");
                    notify("Accept the payment in your lightning app...", 500000);
                    playsound(blip);
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

function lnd_poll_invoice(proxy_host, pk, imp, inv, pid, nid) {
    if (paymentpopup.hasClass("active")) { // only when request is visible
        let default_error = "unable to connect";
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
            let status = e.status;
            if (status) {
                request.address = "lnurl"; // make it a lightning request
                notify("Waiting for payment", 500000);
                helper.lnd.invoice = e;
                let txd = lnd_tx_data(e);
                confirmations(txd, true, true);
                paymentdialogbox.removeClass("blockd");
                if (status == "paid") {
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

function lnd_poll_data_fail(pid) {
    clearpinging(pid);
    notify("this request is not monitored", 500000, "yes");
}

// Websockets

function blockcypher_websocket(socket_node, thisaddress) {
    let provider = socket_node.url + request.currencysymbol + "/main",
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        let ping_event = JSON.stringify({
            "event": "tx-confirmation",
            "address": thisaddress,
            "token": get_blockcypher_apikey(),
            "confirmations": 10
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        let data = JSON.parse(e.data);
        if (data.event == "pong") {} else {
            let txhash = data.hash;
            if (txhash) {
                if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                    rconnect(txid);
                    return
                }
                txid = txhash;
                closesocket();
                let txd = blockcypher_poll_data(data, request.set_confirmations, request.currencysymbol, thisaddress);
                pick_monitor(txhash, txd);
            }
        }
    };
    websocket.onclose = function(e) {
        handle_socket_close(socket_node);
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress)
        return
    };
}

function blockchain_btc_socket(socket_node, thisaddress) {
    let provider = socket_node.url,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        let ping_event = JSON.stringify({
            "op": "addr_sub",
            "addr": thisaddress
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        let json = JSON.parse(e.data).x,
            txhash = json.hash;
        if (txhash) {
            if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                rconnect(txid);
                return
            }
            let txd = blockchain_ws_data(json, request.set_confirmations, request.currencysymbol, thisaddress);
            if (txd) {
                txid = txhash;
                closesocket();
                pick_monitor(txhash, txd);
            }
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

function blockchain_bch_socket(socket_node, thisaddress) {
    let provider = socket_node.url,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        let c_address = (thisaddress.indexOf("bitcoincash:") > -1) ? thisaddress.split("bitcoincash:").pop() : thisaddress,
            ping_event = JSON.stringify({
                "op": "addr_sub",
                "addr": "bitcoincash:" + c_address
            });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        let json = JSON.parse(e.data).x,
            txhash = json.hash;
        if (txhash) {
            if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                rconnect(txid);
                return
            }
            let legacy = bch_legacy(thisaddress),
                txd = blockchain_ws_data(json, request.set_confirmations, request.currencysymbol, thisaddress, legacy);
            if (txd) {
                txid = txhash;
                closesocket();
                pick_monitor(txhash, txd);
            }
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

function mempoolspace_btc_socket(socket_node, thisaddress) {
    let provider = socket_node.url,
        mps_websocket = sockets[thisaddress] = new WebSocket(provider);
    mps_websocket.onopen = function(e) {
        socket_info(socket_node, true);
        let ping_event = JSON.stringify({
            "track-address": thisaddress
        });
        mps_websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            mps_websocket.send(ping_event);
        }, 55000);
    };
    mps_websocket.onmessage = function(e) {
        let result = JSON.parse(e.data),
            result2 = result["address-transactions"];
        if (result2) {
            let json = result2[0];
            if (json) {
                let txhash = json.txid;
                if (txhash) {
                    if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                        rconnect(txid);
                        return
                    }
                    let txd = mempoolspace_ws_data(json, request.set_confirmations, request.currencysymbol, thisaddress);
                    if (txd) {
                        txid = txhash;
                        closesocket();
                        pick_monitor(txhash, txd);
                    }
                }
            }
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

function dogechain_info_socket(socket_node, thisaddress) {
    let provider = socket_node.url,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        let ping_event = JSON.stringify({
            "op": "addr_sub",
            "addr": thisaddress
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        let json = JSON.parse(e.data),
            data = json.x;
        if (data) {
            let txhash = data.hash;
            if (txhash) {
                if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                    rconnect(txid);
                    return
                }
                let txd = dogechain_ws_data(data, request.set_confirmations, request.currencysymbol, thisaddress);
                if (txd) {
                    txid = txhash;
                    closesocket();
                    pick_monitor(txhash, txd);
                }
            }
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

function nano_socket(socket_node, thisaddress) {
    let address_mod = (thisaddress.match("^xrb")) ? "nano_" + thisaddress.split("_").pop() : thisaddress, // change nano address prefix xrb_ to nano untill websocket support
        provider = socket_node.url,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        let ping_event = JSON.stringify({
            "action": "subscribe",
            "topic": "confirmation",
            "all_local_accounts": true,
            "options": {
                "accounts": [address_mod]
            },
            "ack": true
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        let now_utc = now() + timezone,
            json = JSON.parse(e.data),
            data = (json.message) ? json.message : (json.account) ? json : null;
        if (data) {
            if (data.account == thisaddress) {
                return // block outgoing transactions
            }
            let txd = nano_scan_data(data, undefined, request.currencysymbol),
                tx_timestamp = txd.transactiontime,
                timestamp_difference = Math.abs(tx_timestamp - now_utc);
            if (timestamp_difference < 60000) { // filter transactions longer then a minute ago
                closesocket();
                pick_monitor(data.hash, txd);
            }
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

function web3_eth_websocket(socket_node, thisaddress, rpcurl) {
    let provider_url = socket_node.url,
        if_id = get_infura_apikey(provider_url),
        provider = provider_url + if_id,
        websocket = sockets[provider_url] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        let ping_event = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": ["newHeads"]
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        let data = JSON.parse(e.data),
            result = q_obj(data, "params.result");
        if (result) {
            if (result.hash) {
                let api_dat = (helper) ? q_obj(helper, "api_info.data") : null;
                if (api_dat) {
                    let rpc_url = (api_dat.default === false) ? api_dat.url : rpcurl;
                    api_proxy(eth_params(rpc_url, 25, "eth_getBlockByHash", [result.hash, true])).done(function(res) {
                        let rslt = inf_result(res),
                            transactions = rslt.transactions;
                        if (transactions) {
                            $.each(transactions, function(i, val) {
                                if (str_match(val.to, thisaddress) === true) {
                                    let txd = infura_block_data(val, request.set_confirmations, request.currencysymbol, result.timestamp);
                                    closesocket();
                                    pick_monitor(val.hash, txd, api_dat);
                                    return
                                }
                            });
                        }
                    })
                }
            }
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

function web3_erc20_websocket(socket_node, thisaddress, contract) {
    let provider_url = socket_node.url,
        if_id = get_infura_apikey(provider_url),
        provider = provider_url + if_id,
        websocket = sockets[contract] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        let ping_event = JSON.stringify({
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
        let dat = JSON.parse(e.data),
            result = q_obj(dat, "params.result");
        if (result) {
            if (result.topics) {
                let topic_address = result.topics[2];
                if (topic_address) {
                    if (str_match(topic_address, thisaddress.slice(3)) === true) {
                        let contractdata = result.data,
                            cd_hex = contractdata.slice(2),
                            token_value = hexToNumberString(cd_hex),
                            token_decimals = request.decimals,
                            ccval = parseFloat((token_value / Math.pow(10, token_decimals)).toFixed(8));
                        if (ccval === Infinity) {} else {
                            let tx_hash = result.transactionHash,
                                txd = {
                                    "ccval": ccval,
                                    "transactiontime": now() + timezone,
                                    "txhash": tx_hash,
                                    "confirmations": 0,
                                    "setconfirmations": request.set_confirmations,
                                    "ccsymbol": request.currencysymbol
                                }
                            pick_monitor(tx_hash, txd);
                            return
                        }
                    }
                }
            }
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

function bnb_scan(address, request_ts, ccsymbol) {
    pinging[address] = setInterval(function() {
        ping_bnb(address, request_ts, ccsymbol);
    }, 7000);
}

function ping_bnb(address, request_ts, ccsymbol) {
    if (paymentpopup.hasClass("active")) { // only when request is visible
        api_proxy({
            "api": "binplorer",
            "search": "getAddressHistory/" + address + "?type=transfer",
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            let data = br_result(e).result;
            if (data) {
                let setconf = request.set_confirmations;
                $.each(data.operations, function(dat, value) {
                    let txd = ethplorer_scan_data(value, setconf, ccsymbol);
                    if (txd.transactiontime > request_ts && txd.ccval) {
                        clearpinging();
                        let requestlist = $("#requestlist > li.rqli"),
                            txid_match = filter_list(requestlist, "txhash", txd.txhash); // check if txhash already exists
                        if (txid_match.length) {
                            return
                        }
                        if (setconf > 0) {
                            pick_monitor(txd.txhash, txd);
                            return
                        }
                        confirmations(txd, true);
                    }
                });
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            clearpinging();
            let error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_api_fails(false, error_object, "binplorer", request.payment);
        });
        return
    }
    forceclosesocket();
}

function alchemy_eth_websocket(socket_node, thisaddress) {
    let provider_url = socket_node.url,
        al_id = get_alchemy_apikey(),
        provider = provider_url + al_id,
        websocket = sockets[provider_url] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        let ping_event = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": ["alchemy_pendingTransactions", {
                "toAddress": [thisaddress],
                "hashesOnly": false
            }]
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        let data = JSON.parse(e.data),
            result = q_obj(data, "params.result");
        if (result) {
            if (result.hash) {
                if (str_match(result.to, thisaddress)) {
                    let txd = infura_block_data(result, request.set_confirmations, request.currencysymbol, result.timestamp);
                    closesocket();
                    let api_dat = (helper) ? q_obj(helper, "api_info.data") : null;
                    pick_monitor(result.hash, txd, api_dat);
                    return
                }
            }
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

function arbi_scan(address, request_ts) {
    pinging[address] = setInterval(function() {
        ping_arbiscan(address, request_ts);
    }, 7000);
}

function ping_arbiscan(address, request_ts) {
    if (paymentpopup.hasClass("active")) { // only when request is visible
        let apikeytoken = get_arbiscan_apikey();
        api_proxy({
            "api": "arbiscan",
            "search": "?module=account&action=txlist&address=" + address + "&startblock=0&endblock=latest&page=1&offset=10&sort=desc&apikey=" + apikeytoken,
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            let data = br_result(e).result;
            if (data) {
                let result = data.result;
                if (result && br_issar(result)) {
                    let setconf = request.set_confirmations;
                    let match = false;
                    $.each(result, function(dat, value) {
                        let txd = arbiscan_scan_data_eth(value, setconf);
                        if (txd.transactiontime > request_ts && txd.ccval) {
                            clearpinging();
                            let requestlist = $("#requestlist > li.rqli"),
                                txid_match = filter_list(requestlist, "txhash", txd.txhash); // check if txhash already exists
                            if (txid_match.length) {
                                return
                            }
                            if (setconf > 0) {
                                pick_monitor(txd.txhash, txd);
                                return
                            }
                            confirmations(txd, true);
                        }
                    });
                }
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            clearpinging();
            let error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_api_fails(false, error_object, "arbiscan", request.payment);
        });
        return
    }
    forceclosesocket();
}

function kaspa_websocket(socket_node, thisaddress) {
    let provider = socket_node.url + "/ws/socket.io/?EIO=4&transport=websocket",
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        ws_timer = now();
        socket_info(socket_node, true);
        websocket.send("40");
    };
    websocket.onmessage = function(e) {
        let dat = e.data;
        if (dat) {
            let datid = dat.slice(0, 2);
            if (datid == "40") {
                websocket.send('42["join-room","blocks"]');
                return;
            }
            if (datid == "42") {
                let newdat = dat.slice(2),
                    data = JSON.parse(newdat),
                    contents = data[1];
                if (contents) {
                    let txs = contents.txs;
                    if (txs) {
                        $.each(txs, function(dat, value) {
                            let set_confirmations = (request.set_confirmations) ?? 0,
                                txd = kaspa_ws_data(value, thisaddress, set_confirmations);
                            if (txd.ccval) {
                                closesocket();
                                pick_monitor(txd.txhash, txd);
                            }
                        });
                    }
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
        handle_socket_fails(socket_node, thisaddress)
        return
    };
}

function kaspa_fyi_websocket(socket_node, thisaddress) {
    let provider = socket_node.url + "/ws/socket.io/?EIO=4&transport=websocket",
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        websocket.send("40");
    };
    websocket.onmessage = function(e) {
        let dat = e.data;
        if (dat) {
            let datid = dat.slice(0, 2);
            if (datid == "40") {
                websocket.send('42["join-room","blocks"]');
                return;
            }
            if (datid == "42") {
                let newdat = dat.slice(2),
                    data = JSON.parse(newdat),
                    contents = data[1];
                if (contents) {
                    let txs = contents.transactions;
                    if (txs) {
                        $.each(txs, function(dat, value) {
                            let txd = kaspa_fyi_ws_data(value, thisaddress);
                            if (txd.ccval) {
                                closesocket();
                                pick_monitor(txd.txhash, txd);
                            }
                        });
                    }
                }
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
        handle_socket_fails(socket_node, thisaddress)
        return
    };
}

function handle_socket_fails(socket_node, thisaddress) {
    if (paymentdialogbox.hasClass("transacting")) { // temp fix for bch socket
        return
    }
    if (paymentpopup.hasClass("active")) { // only when request is visible
        let next_socket = try_next_socket(socket_node);
        if (next_socket) {
            closesocket(thisaddress);
            init_socket(next_socket, thisaddress, null, true);
            return
        }
        let error_message = "unable to connect to " + socket_node.name;
        console.log(error_message);
        socket_info(socket_node, false);
        notify("websocket offline", 500000, "yes");
    }
}

function handle_socket_close(socket_node) {
    socket_info(socket_node, false);
    console.log("Disconnected from " + socket_node.url);
    txid = null,
        ws_timer = 0;
}

function ws_recon(recon) {
    if (recon) {
        let trigger = recon.trigger;
        if (trigger == 1000) { // normal socket close
            let address = recon.address;
            if (address) {
                if (paymentdialogbox.attr("data-status") == "new") {
                    let c_time = now() - ws_timer,
                        ws_block = (c_time < 10000);
                    if (ws_block) {
                        return
                    }
                    let timeout = setTimeout(function() {
                        if (paymentpopup.hasClass("active")) {
                            recon.function(recon.node, recon.address);
                        }
                    }, 2000, function() {
                        clearTimeout(timeout);
                    });
                }
            }
        }
    }
}

function try_next_socket(current_socket_data) {
    if (current_socket_data) {
        let current_socket_url = current_socket_data.url,
            sockets = helper.socket_list,
            socketlist = (sockets.options) ? $.merge(sockets.apis, sockets.options) : sockets.apis,
            socket_index;
        $.each(socketlist, function(i, val) {
            if (val.url == current_socket_url) {
                socket_index = i;
            }
        });
        if (socket_index > -1) {
            let next_scan = socketlist[socket_index + 1],
                next_socket = (next_scan) ? next_scan : socketlist[0];
            if (socket_attempt[btoa(next_socket.url)] === true) {
                return false;
            }
            if (next_socket) {
                return next_socket;
            }
        }
    }
    return false;
}

function socket_info(snode, live) {
    let islive = (live) ? " <span class='pulse'></span>" : " <span class='icon-wifi-off'></span>",
        contents = "websocket: " + snode.url + islive;
    $("#current_socket").html(contents);
    if (live) {
        console.log("Connected: " + snode.url);
    }
}

function reconnect() {
    $(document).on("click", "#reconnect", function() {
        let txhash = $(this).attr("data-txid");
        canceldialog();
        pick_monitor(txhash);
    });
}

// Polling

// XMR Poll

function init_xmr_node(cachetime, address, vk, request_ts, txhash, start) {
    let payload = {
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
        let data = br_result(e).result,
            errormessage = data.Error;
        if (errormessage) {
            let error = (errormessage) ? errormessage : "Invalid Viewkey";
            popnotify("error", error);
            return
        }
        let start_height = data.start_height;
        if (start_height > -1) { // success!
            let pingtime = (txhash) ? 35000 : 12000; // poll slower when we know txid
            if (start === true) {
                ping_xmr_node(cachetime, address, vk, request_ts, txhash);
            }
            pinging[address] = setInterval(function() {
                ping_xmr_node(cachetime, address, vk, request_ts, txhash);
            }, pingtime);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        let next_proxy = get_next_proxy();
        if (next_proxy) {
            init_xmr_node(cachetime, address, vk, request_ts, txhash, start);
            return
        }
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
        notify("Error verifying Viewkey");
    });
}

function ping_xmr_node(cachetime, address, vk, request_ts, txhash) {
    if (paymentpopup.hasClass("active")) { // only when request is visible
        let payload = {
            "address": address,
            "view_key": vk
        };
        api_proxy({
            "api": "mymonero api",
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
            let data = br_result(e).result,
                transactions = data.transactions;
            if (transactions) {
                let setconf = request.set_confirmations,
                    txflip = transactions.reverse();
                $.each(txflip, function(dat, value) {
                    let txd = xmr_scan_data(value, setconf, "xmr", data.blockchain_height);
                    if (txd) {
                        if (txd.ccval) {
                            if (txhash) {
                                if (txhash == txd.txhash) {
                                    confirmations(txd);
                                }
                                return
                            }
                            if (txd.transactiontime > request_ts) {
                                let requestlist = $("#requestlist > li.rqli"),
                                    txid_match = filter_list(requestlist, "txhash", txd.txhash); // check if txhash already exists
                                if (txid_match.length) {
                                    return
                                }
                                clearpinging();
                                if (setconf > 0) {
                                    confirmations(txd, true);
                                    pinging[address] = setInterval(function() {
                                        ping_xmr_node(34, address, vk, request_ts, txd.txhash);
                                    }, 35000);
                                    return
                                }
                                confirmations(txd, true);
                            }
                        }
                    }
                });
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            clearpinging();
            let error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_api_fails(false, error_object, "mymonero api", request.payment, txhash);
        });
        return
    }
    forceclosesocket();
}

function nimiq_scan(address, request_ts) {
    pinging[address] = setInterval(function() {
        ping_nimiq(address, request_ts);
    }, 5000);
}

function ping_nimiq(address, request_ts) {
    if (paymentpopup.hasClass("active")) { // only when request is visible
        api_proxy({
            "api": "nimiq.watch",
            "search": "account-transactions/" + address,
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            let transactions = br_result(e).result;
            if (transactions) {
                let setconf = request.set_confirmations,
                    txflip = transactions.reverse();
                $.each(txflip, function(dat, value) {
                    let txd = nimiq_scan_data(value, setconf);
                    if (txd.transactiontime > request_ts && txd.ccval) {
                        clearpinging();
                        let requestlist = $("#requestlist > li.rqli"),
                            txid_match = filter_list(requestlist, "txhash", txd.txhash); // check if txhash already exists
                        if (txid_match.length) {
                            return
                        }
                        if (setconf > 0) {
                            pick_monitor(txd.txhash, txd);
                            return
                        }
                        confirmations(txd, true);
                    }
                });
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            clearpinging();
            let error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_api_fails(false, error_object, "nimiq.watch", request.payment);
        });
        return
    }
    forceclosesocket();
}

function after_poll(rq_init, next_api) {
    let amount_input = $("#mainccinputmirror > input"),
        input_val = amount_input.val(),
        api_info = helper.api_info,
        api_data = (next_api) ? next_api : api_info.data,
        api_name = api_data.name,
        payment = request.payment,
        ccsymbol = request.currencysymbol,
        address = $("#paymentaddress").text(),
        set_confirmations = request.set_confirmations,
        request_ts_utc = rq_init + timezone,
        request_ts = request_ts_utc - 30000; // 30 seconds compensation for unexpected results
    scan_attempts[api_name] = true;
    if (input_val.length) {
        if (ccsymbol == "xmr" || ccsymbol == "nim") {
            close_paymentdialog();
            return
        }
        if (ccsymbol == "xno") {
            ap_loader();
            nano_scan_poll(api_name, api_data.url, ccsymbol, set_confirmations, address, request_ts);
            return
        }
        if (api_name == "mempool.space") {
            ap_loader();
            mempoolspace_scan_poll(payment, api_data, ccsymbol, set_confirmations, address, request_ts, false);
            return
        }
        if (api_name == "blockcypher") {
            ap_loader();
            blockcypher_scan_poll(payment, api_name, ccsymbol, set_confirmations, address, request_ts);
            return
        }
        if (api_name == "blockchair") {
            let erc = (request.erc20 === true) ? true : false;
            ap_loader();
            blockchair_scan_poll(payment, api_name, ccsymbol, set_confirmations, address, request_ts, erc);
            return
        }
        if (request.erc20 === true) {
            ap_loader();
            erc20_scan_poll(api_name, ccsymbol, set_confirmations, address, request_ts);
            return
        }
        if (payment == "kaspa") {
            ap_loader();
            kaspa_scan_poll(payment, api_name, ccsymbol, set_confirmations, address, request_ts);
            return
        }
        if (ccsymbol == "btc" || ccsymbol == "ltc" || ccsymbol == "doge" || ccsymbol == "bch") {
            if (api_data.default === false) {
                ap_loader();
                mempoolspace_scan_poll(payment, api_data, ccsymbol, set_confirmations, address, request_ts, api_data.url);
                return
            }
        }
    }
    close_paymentdialog();
}

function ap_loader() {
    loader(true);
    loadertext("Closing request / scanning for incoming transactions");
}

function nano_scan_poll(api_name, api_url, ccsymbol, set_confirmations, address, request_ts) {
    api_proxy({
        "api": "nano",
        "search": "account",
        "cachetime": 25,
        "cachefolder": "1h",
        "custom": "nano_txd",
        "api_url": api_url,
        "proxy": true,
        "params": {
            "method": "POST",
            "cache": true,
            "data": JSON.stringify({
                "action": "accounts_pending",
                "accounts": [address],
                "sorting": true,
                "include_active": true,
                "count": 100
            })
        }
    }).done(function(e) {
        let data = br_result(e).result;
        if (data) {
            let nano_data = data.data;
            if (!$.isEmptyObject(nano_data)) {
                let detect = false,
                    txdat,
                    pending_array_node = (nano_data[0]) ? nano_data[0].pending : [],
                    pending_array = $.isEmptyObject(pending_array_node) ? [] : pending_array_node,
                    history_array_node = (nano_data[1]) ? nano_data[1].history : [],
                    history_array = $.isEmptyObject(history_array_node) ? [] : history_array_node,
                    merged_array = pending_array.concat(history_array).sort(function(x, y) { // merge and sort arrays
                        return y.local_timestamp - x.local_timestamp;
                    });
                $.each(merged_array, function(data, value) {
                    let txd = nano_scan_data(value, set_confirmations, ccsymbol);
                    if ((txd.transactiontime > request_ts) && txd.ccval && (value.type === undefined || value.type == "receive")) {
                        txdat = txd;
                        detect = true;
                        return
                    }
                });
                if (txdat && detect === true) {
                    pick_monitor(txdat.txhash, txdat);
                    return
                }
            }
        }
        close_paymentdialog(true);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        close_paymentdialog(true);
    });
}

function mempoolspace_scan_poll(payment, api_data, ccsymbol, set_confirmations, address, request_ts, rpc) {
    let pload = (rpc) ? {
        "api_url": rpc + "/api/address/" + address + "/txs",
        "proxy": false,
        "params": {
            "method": "GET"
        }
    } : {
        "cachetime": 25,
        "cachefolder": "1h",
        "api_url": "https://" + api_data.url + "/api/address/" + address + "/txs",
        "params": {
            "method": "GET"
        }
    };
    api_proxy(pload).done(function(e) {
        let data = br_result(e).result;
        if (data) {
            if (!$.isEmptyObject(data)) {
                let detect = false,
                    txdat;
                $.each(data, function(dat, value) {
                    let txd = mempoolspace_scan_data(value, set_confirmations, ccsymbol, address);
                    if (txd.transactiontime > request_ts && txd.ccval) {
                        txdat = txd;
                        detect = true;
                        return
                    }
                });
                if (txdat && detect === true) {
                    pick_monitor(txdat.txhash, txdat);
                    return
                }
            }
            close_paymentdialog(true);
            return
        }
        after_poll_fails(api_data.name);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        after_poll_fails(api_data.name);
    });
}

function blockcypher_scan_poll(payment, api_name, ccsymbol, set_confirmations, address, request_ts) {
    api_proxy({
        "api": "blockcypher",
        "search": ccsymbol + "/main/addrs/" + address,
        "cachetime": 25,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        let data = br_result(e).result;
        if (data) {
            if (data.error) {} else {
                let items = data.txrefs;
                if (items) {
                    if (!$.isEmptyObject(items)) {
                        let detect = false,
                            txdat;
                        if (payment == "ethereum") {
                            $.each(items, function(dat, value) {
                                let txd = blockcypher_scan_data(value, set_confirmations, ccsymbol, payment);
                                if (txd.transactiontime > request_ts && txd.ccval) {
                                    txdat = txd;
                                    detect = true;
                                    return
                                }
                            });
                        } else {
                            $.each(items, function(dat, value) {
                                if (value.spent !== undefined) { // filter outgoing transactions
                                    let txd = blockcypher_scan_data(value, set_confirmations, ccsymbol, payment);
                                    if (txd.transactiontime > request_ts && txd.ccval) {
                                        txdat = txd;
                                        detect = true;
                                        return
                                    }
                                }
                            });
                        }
                        if (txdat && detect === true) {
                            pick_monitor(txdat.txhash, txdat);
                            return
                        }
                    }
                    close_paymentdialog(true);
                    return
                }
            }
        }
        after_poll_fails(api_name);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        after_poll_fails(api_name);
    });
}

function blockchair_scan_poll(payment, api_name, ccsymbol, set_confirmations, address, request_ts, erc) {
    let scan_url = (erc === true) ? "ethereum/erc-20/" + request.token_contract + "/dashboards/address/" + address : payment + "/dashboards/address/" + address;
    api_proxy({
        "api": api_name,
        "search": scan_url,
        "cachetime": 25,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        let data = br_result(e).result;
        if (data && !data.error) {
            let context = data.context;
            if (context && !context.error) {
                let latestblock = context.state,
                    detect = false,
                    txdat,
                    records = data.data;
                if (records) {
                    if (!$.isEmptyObject(records)) {
                        if (erc) {
                            $.each(records, function(dat, value) {
                                let transactions = value.transactions;
                                if (transactions && !$.isEmptyObject(transactions)) {
                                    $.each(transactions, function(dt, val) {
                                        let txd = blockchair_erc20_scan_data(val, set_confirmations, ccsymbol, latestblock);
                                        if ((txd.transactiontime > request_ts) && (str_match(txd.recipient, address) === true) && (str_match(txd.token_symbol, ccsymbol) === true) && txd.ccval) {
                                            txdat = txd;
                                            detect = true;
                                            return
                                        }
                                    });
                                }
                            });
                            if (txdat && detect === true) {
                                pick_monitor(txdat.txhash, txdat);
                                return
                            }
                        } else {
                            if (payment == "ethereum") {
                                $.each(records, function(dat, value) {
                                    let transactions = value.calls;
                                    if (transactions && !$.isEmptyObject(transactions)) {
                                        $.each(vtransactions, function(dt, val) {
                                            let txd = blockchair_eth_scan_data(val, set_confirmations, ccsymbol, latestblock);
                                            if ((txd.transactiontime > request_ts) && (str_match(txd.recipient, address) === true) && txd.ccval) {
                                                txdat = txd;
                                                detect = true;
                                                return
                                            }
                                        });
                                    }
                                });
                                if (txdat && detect === true) {
                                    pick_monitor(txdat.txhash, txdat);
                                    return
                                }
                            } else {
                                let addr_txs = records[address];
                                if (addr_txs) {
                                    let txarray = addr_txs.transactions; // get transactions
                                    if (txarray) {
                                        if (!$.isEmptyObject(txarray)) {
                                            api_proxy({
                                                "api": api_name,
                                                "search": payment + "/dashboards/transactions/" + txarray.slice(0, 6), // get last 5 transactions
                                                "cachetime": 25,
                                                "cachefolder": "1h",
                                                "params": {
                                                    "method": "GET"
                                                }
                                            }).done(function(e) {
                                                let dat = br_result(e).result;
                                                $.each(dat.data, function(dt, val) {
                                                    let txd = blockchair_scan_data(val, set_confirmations, ccsymbol, address, latestblock);
                                                    if (txd.transactiontime > request_ts && txd.ccval) { // get all transactions after requestdate
                                                        txdat = txd;
                                                        detect = true;
                                                        return
                                                    }
                                                });
                                                if (txdat && detect === true) {
                                                    pick_monitor(txdat.txhash, txdat);
                                                    return
                                                }
                                                close_paymentdialog(true);
                                                return
                                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                                after_poll_fails(api_name);
                                            });
                                        }
                                    }
                                }
                                after_poll_fails(api_name);
                                return
                            }
                        }
                    }
                    close_paymentdialog(true);
                    return
                }
            }
        }
        after_poll_fails(api_name);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        after_poll_fails(api_name);
    });
}

function erc20_scan_poll(api_name, ccsymbol, set_confirmations, address, request_ts) {
    api_proxy({
        "api": api_name,
        "search": "getAddressHistory/" + address + "?type=transfer",
        "cachetime": 25,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        let data = br_result(e).result;
        if (data) {
            let items = data.operations;
            if (!$.isEmptyObject(items)) {
                let detect = false,
                    txdat;
                $.each(items, function(dat, value) {
                    let txd = ethplorer_scan_data(value, set_confirmations, ccsymbol);
                    if ((txd.transactiontime > request_ts) && (str_match(value.to, address) === true) && (str_match(ccsymbol, q_obj(value, "tokenInfo.symbol"))) && txd.ccval) {
                        txdat = txd;
                        detect = true;
                        return
                    }
                });
                if (txdat && detect === true) {
                    pick_monitor(txdat.txhash, txdat);
                    return
                } else {
                    if (api_name == "binplorer") { // don't rescan on last L2 api
                    } else {
                        after_poll_fails(api_name); // scan l2's
                        return
                    }
                }
            }
            close_paymentdialog(true);
            return
        }
        after_poll_fails(api_name);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        after_poll_fails(api_name);
    });
}

function kaspa_scan_poll(payment, api_name, ccsymbol, set_confirmations, address, request_ts) {
    if (api_name == "kaspa.org") {
        api_proxy({
            "api": api_name,
            "search": "info/virtual-chain-blue-score",
            "cachetime": 25,
            "cachefolder": "1h",
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            let data = br_result(e).result;
            if (data) {
                let current_bluescore = data.blueScore;
                if (current_bluescore) {
                    api_proxy({
                        "api": api_name,
                        "search": "addresses/" + address + "/full-transactions",
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "params": {
                            "method": "GET"
                        }
                    }).done(function(e) {
                        let data = br_result(e).result;
                        if (data) {
                            if (data.error) {} else {
                                if (!$.isEmptyObject(data)) {
                                    let detect = false,
                                        txdat;
                                    $.each(data, function(dat, value) {
                                        let txd = kaspa_scan_data(value, address, set_confirmations, current_bluescore);
                                        if (txd.transactiontime > request_ts && txd.ccval) {
                                            txdat = txd;
                                            detect = true;
                                            return
                                        }
                                    });
                                    if (txdat && detect === true) {
                                        pick_monitor(txdat.txhash, txdat);
                                        return
                                    }
                                }
                                close_paymentdialog(true);
                                return
                            }
                        }
                        after_poll_fails(api_name);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        after_poll_fails(api_name);
                    });
                    return
                }
            }
            after_poll_fails(api_name);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            after_poll_fails(api_name);
        });
    }
}

function after_poll_fails(api_name) {
    let nextapi = get_next_scan_api(api_name);
    if (nextapi) {
        after_poll(request.rq_init, nextapi);
        return
    }
    close_paymentdialog(true);
}

function rconnect(tid) {
    paymentdialogbox.removeClass("transacting");
    let bttn = (tid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + tid + "'>Reconnect</span></div></p>" : "",
        content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + bttn;
    closesocket();
    popdialog(content, "canceldialog");
}

function get_next_scan_api(api_name) {
    let rpc_settings = cs_node(request.payment, "apis", true);
    if (rpc_settings) {
        let apirpc = rpc_settings.apis,
            apilist = $.grep(apirpc, function(filter) {
                return filter.api;
            })
        if (!$.isEmptyObject(apilist)) {
            let next_scan = apilist[apilist.findIndex(option => option.name == api_name) + 1],
                next_api = (next_scan) ? next_scan : apilist[0];
            if (scan_attempts[next_api.name] !== true) {
                return next_api;
            }
        }
    }
    return false;
}