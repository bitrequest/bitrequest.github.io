var sockets = {},
    pinging = {},
    lnd_confirm = false;

$(document).ready(function() {
    //init_socket
    //init_xmr_node
    //ping_xmr_node
    //blockcypher_websocket
    //blockchain_btc_socket
    //blockchain_bch_socket
    //amberdata_btc_websocket
    //mempoolspace_btc_socket
    //nano_socket
    //amberdata_eth_websocket
    //web3_erc20_websocket
    //handle_socket_fails
    //try_next_socket
    //current_socket
    reconnect();

    // Polling

    //init_xmr_node
    //ping_xmr_node
    //after_poll
    //ap_loader
    //bitcoincom_scan_poll
    //blockcypher_scan_poll
    //nano_scan_poll
    //erc20_scan_poll
    //xmr_scan_poll_init
    //xmr_scan_poll
});

// Websockets / Pollfunctions

function init_socket(socket_node, address, swtch, retry) {
    if (offline === true) {
        notify("You are currently offline, request is not monitored");
    } else {
        var payment = request.payment;
        if (socket_node) {
            var socket_name = socket_node.name;
            socket_attempt[btoa(socket_node.url)] = true;
        }
        if (payment == "bitcoin") {
            if (socket_name == "blockcypher websocket") {
                blockcypher_websocket(socket_node, address);
            } else if (socket_name == "blockchain.info websocket") {
                blockchain_btc_socket(socket_node, address);
            } else if (socket_name == main_ad_socket) {
                amberdata_btc_websocket(socket_node, address, "408fa195a34b533de9ad9889f076045e");
            } else if (socket_name == "mempool.space websocket") {
                mempoolspace_btc_socket(socket_node, address);
            } else {
                blockcypher_websocket(socket_node, address);
            }
            if (helper.lnd_status) {
                if (retry) {
                    return;
                }
                lightning_socket(helper.lnd);
            }
        } else if (payment == "litecoin") {
            if (socket_name == "blockcypher websocket") {
                blockcypher_websocket(socket_node, address);
            } else if (socket_name == main_ad_socket) {
                amberdata_btc_websocket(socket_node, address, "f94be61fd9f4fa684f992ddfd4e92272");
            } else {
                blockcypher_websocket(socket_node, address);
            }
        } else if (payment == "dogecoin") {
            if (socket_name == "blockcypher websocket") {
                blockcypher_websocket(socket_node, address);
            } else if (socket_name == "dogechain api") {
                dogechain_info_socket(socket_node, address);
            } else {
                blockcypher_websocket(socket_node, address);
            }
        } else if (payment == "bitcoin-cash") {
            blockchain_bch_socket(socket_node, address);
        } else if (payment == "nano") {
            nano_socket(socket_node, address);
        } else if (payment == "ethereum") {
            amberdata_eth_websocket(socket_node, address);
        } else if (payment == "monero") {
            clearpinging();
            var vk = (swtch) ? get_vk(address) : request.viewkey;
            if (vk) {
                trigger_requeststates(); // update outgoing
                var account = (vk.account) ? vk.account : address,
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
            } else {
                request.monitored = false;
                request.viewkey = false;
                notify("this address is not monitored", 500000, "yes");
            }
        } else if (request.erc20 === true) {
            clearpinging();
            web3_erc20_websocket(socket_node, address);
        } else {
            notify("this request is not monitored", 500000, "yes")
        }
    }
}

function lightning_socket(lnd) {
    lnd_confirm = false;
    var p_arr = lnurl_deform(lnd.proxy_host),
        proxy_host = p_arr.url,
        pk = (lnd.pw) ? lnd.pw : p_arr.k,
        pid = lnd.pid,
        nid = lnd.nid,
        imp = lnd.imp,
        socket = sockets[pid] = new WebSocket(ln_socket);
    socket.onopen = function(e) {
        console.log("Connected: " + ln_socket);
        var ping_event = JSON.stringify({
            "id": pid
        });
        socket.send(ping_event);
        pinging[pid] = setInterval(function() {
            socket.send(ping_event);
        }, 55000);
    };
    socket.onmessage = function(e) {
        var result = JSON.parse(e.data);
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
}

function lnd_poll_data(proxy_host, pk, pid, nid, imp) {
    var default_error = "unable to connect";
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
        var error = e.error;
        if (error) {
            var message = (error) ? (error.message) ? error.message : (typeof error == "string") ? error : default_error : default_error;
            console.log(message);
        }
        var version = e.version;
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
}

function lnd_poll_invoice(proxy_host, pk, imp, inv, pid, nid) {
    var default_error = "unable to connect";
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
        var status = e.status;
        if (status) { // leave because false must also pass
            request.address = "lnurl"; // make it a lightning request
            notify("Waiting for payment", 500000);
            helper.lnd.invoice = e;
            var txd = lnd_tx_data(e);
            confirmations(txd, true, true);
            if (status == "paid") {
                clearpinging(inv.hash);
                helper.currencylistitem.removeData("url");
                localStorage.removeItem("bitrequest_editurl");
                sessionStorage.removeItem("bitrequest_lndpid");
                closenotify();
                return
            }
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
    });
}

function lnd_poll_data_fail(pid) {
    clearpinging(pid);
    notify("this request is not monitored", 500000, "yes");
}

// Websockets

function blockcypher_websocket(socket_node, thisaddress) {
    var provider = socket_node.url + request.currencysymbol + "/main",
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        var ping_event = JSON.stringify({
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
        var data = JSON.parse(e.data);
        if (data.event == "pong") {} else {
            var txhash = data.hash;
            if (txhash) {
                if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                    paymentdialogbox.removeClass("transacting");
                    var reconnectbttn = (txid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + txid + "'>Reconnect</span></div></p>" : "",
                        content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + reconnectbttn;
                    closesocket();
                    popdialog(content, "alert", "canceldialog");
                } else {
                    txid = txhash;
                    closesocket();
                    var txd = blockcypher_poll_data(data, request.set_confirmations, request.currencysymbol, thisaddress);
                    pick_monitor(txhash, txd);
                }
            }
        }
    };
    websocket.onclose = function(e) {
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, e.data)
        return
    };
}

function blockchain_btc_socket(socket_node, thisaddress) {
    var provider = socket_node.url,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        var ping_event = JSON.stringify({
            "op": "addr_sub",
            "addr": thisaddress
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        var json = JSON.parse(e.data).x,
            txhash = json.hash;
        if (txhash) {
            if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                paymentdialogbox.removeClass("transacting");
                var reconnectbttn = (txid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + txid + "'>Reconnect</span></div></p>" : "",
                    content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + reconnectbttn;
                closesocket();
                popdialog(content, "alert", "canceldialog");
            } else {
                var txd = blockchain_ws_data(json, request.set_confirmations, request.currencysymbol, thisaddress);
                if (txd) {
                    txid = txhash;
                    closesocket();
                    pick_monitor(txhash, txd);
                }
            }
        }

    };
    websocket.onclose = function(e) {
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, e.data)
        return
    };
}

function blockchain_bch_socket(socket_node, thisaddress) {
    var provider = socket_node.url,
        legacy = bchutils.toLegacyAddress(thisaddress),
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        var c_address = (thisaddress.indexOf("bitcoincash:") > -1) ? thisaddress.split("bitcoincash:").pop() : thisaddress,
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
        var json = JSON.parse(e.data).x,
            txhash = json.hash;
        if (txhash) {
            if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                paymentdialogbox.removeClass("transacting");
                var reconnectbttn = (txid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + txid + "'>Reconnect</span></div></p>" : "",
                    content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + reconnectbttn;
                closesocket();
                popdialog(content, "alert", "canceldialog");
            } else {
                var txd = blockchain_ws_data(json, request.set_confirmations, request.currencysymbol, thisaddress, legacy);
                if (txd) {
                    closesocket();
                    pick_monitor(txhash, txd);
                }
            }
        }
    };
    websocket.onclose = function(e) {
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, e.data)
        return
    };
}

function amberdata_btc_websocket(socket_node, thisaddress, blockchainid) {
    var socket_url = socket_node.url,
        ak = get_amberdata_apikey(),
        provider = socket_url + "?x-api-key=" + ak + "&x-amberdata-blockchain-id=" + blockchainid,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        var ping_event = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "subscribe",
            "params": ["address:pending_transactions", {
                "address": thisaddress
            }]
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        var data = JSON.parse(e.data),
            params = (data.params);
        if (params) {
            var result = params.result,
                txhash = result.hash,
                txd = amberdata_poll_btc_data(result, request.set_confirmations, request.currencysymbol, thisaddress);
            closesocket();
            pick_monitor(txhash, txd);
            return
        }
    };
    websocket.onclose = function(e) {
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, e.data);
        return
    };
}

function mempoolspace_btc_socket(socket_node, thisaddress) {
    var provider = socket_node.url,
        mps_websocket = sockets[thisaddress] = new WebSocket(provider);
    mps_websocket.onopen = function(e) {
        socket_info(socket_node, true);
        var ping_event = JSON.stringify({
            "track-address": thisaddress
        });
        mps_websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            mps_websocket.send(ping_event);
        }, 55000);
    };
    mps_websocket.onmessage = function(e) {
        var result = JSON.parse(e.data),
            result2 = result["address-transactions"];
        if (result2) {
            var json = result2[0];
            if (json) {
                var txhash = json.txid;
                if (txhash) {
                    if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                        paymentdialogbox.removeClass("transacting");
                        var reconnectbttn = (txid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + txid + "'>Reconnect</span></div></p>" : "",
                            content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + reconnectbttn;
                        closesocket();
                        popdialog(content, "alert", "canceldialog");
                    } else {
                        var txd = mempoolspace_ws_data(json, request.set_confirmations, request.currencysymbol, thisaddress);
                        if (txd) {
                            txid = txhash;
                            closesocket();
                            pick_monitor(txhash, txd);
                        }
                    }
                }
            }
        }
    };
    mps_websocket.onclose = function(e) {
        console.log("Disconnected");
        txid = null;
    };
    mps_websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, e.data)
        return
    };
}

function dogechain_info_socket(socket_node, thisaddress) {
    var provider = socket_node.url,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        var ping_event = JSON.stringify({
            "op": "addr_sub",
            "addr": thisaddress
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        var json = JSON.parse(e.data),
            data = json.x;
        if (data) {
            var txhash = data.hash;
            if (txhash) {
                if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                    paymentdialogbox.removeClass("transacting");
                    var reconnectbttn = (txid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + txid + "'>Reconnect</span></div></p>" : "",
                        content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + reconnectbttn;
                    closesocket();
                    popdialog(content, "alert", "canceldialog");
                } else {
                    var txd = dogechain_ws_data(data, request.set_confirmations, request.currencysymbol, thisaddress);
                    if (txd) {
                        txid = txhash;
                        closesocket();
                        pick_monitor(txhash, txd);
                    }
                }
            }
        }
    };
    websocket.onclose = function(e) {
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, e.data)
        return
    };
}

function nano_socket(socket_node, thisaddress) {
    var address_mod = (thisaddress.match("^xrb")) ? "nano_" + thisaddress.split("_").pop() : thisaddress, // change nano address prefix xrb_ to nano untill websocket support
        provider = socket_node.url,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        var ping_event = JSON.stringify({
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
        var now_utc = $.now() + timezone,
            json = JSON.parse(e.data),
            data = json.message;
        if (data) {
            if (data.account == thisaddress) {
                return // block outgoing transactions
            }
            var txd = nano_scan_data(data, undefined, request.currencysymbol),
                tx_timestamp = txd.transactiontime,
                timestamp_difference = Math.abs(tx_timestamp - now_utc);
            if (timestamp_difference < 60000) { // filter transactions longer then a minute ago
                closesocket();
                pick_monitor(data.hash, txd);
            }
        }
    };
    websocket.onclose = function(e) {
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, e.data);
        return
    };
}

function amberdata_eth_websocket(socket_node, thisaddress) {
    var socket_url = socket_node.url,
        ak = get_amberdata_apikey(),
        provider = socket_url + "?x-api-key=" + ak,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        var ping_event = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "subscribe",
            "params": ["address:pending_transactions", {
                "address": thisaddress
            }]
        });
        websocket.send(ping_event);
        pinging[thisaddress] = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        var data = JSON.parse(e.data),
            params = (data.params);
        if (params) {
            if (params.result.to == thisaddress.toLowerCase()) {
                var result = params.result,
                    txhash = result.hash,
                    txd = amberdata_poll_data(result, request.set_confirmations, request.currencysymbol);
                closesocket();
                pick_monitor(txhash, txd);
                return
            }
        }
    };
    websocket.onclose = function(e) {
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, e.data);
        return
    };
}

function web3_erc20_websocket(socket_node, thisaddress) {
    var provider_url = socket_node.url,
        if_id = get_infura_apikey(provider_url),
        provider = provider_url + if_id,
        websocket = sockets[thisaddress] = new WebSocket(provider);
    websocket.onopen = function(e) {
        socket_info(socket_node, true);
        var ping_event = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": [
                "logs",
                {
                    "address": request.token_contract,
                    "topics": []
                }
            ]
        });
        websocket.send(ping_event);
    };
    websocket.onmessage = function(e) {
        var dat = JSON.parse(e.data),
            params = (dat.params);
        if (params) {
            var result = params.result,
                contractdata = result.data,
                cd_hex = contractdata.slice(2),
                token_value = web3.utils.hexToNumberString(cd_hex),
                token_decimals = request.decimals,
                ccval = parseFloat((token_value / Math.pow(10, token_decimals)).toFixed(8));
            if (ccval === Infinity) {} else {
                var cryptoval = $("#shareccinputmirror > span").text(),
                    urlamount = parseFloat(cryptoval).toFixed(8),
                    amountnumber = parseFloat(urlamount),
                    percent = (ccval / amountnumber) * 100;
                if (percent > 70 && percent < 130) { // only scan amounts with a margin less then 20%
                    var txhash = result.transactionHash;
                    web3.eth.getTransaction(txhash, function(err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            if (data) {
                                var input = data.input,
                                    address_upper = thisaddress.slice(3).toUpperCase(),
                                    input_upper = input.toUpperCase();
                                if (input_upper.indexOf(address_upper) >= 0) {
                                    closesocket();
                                    var amount_hex = input.slice(74, input.length),
                                        txd = infura_erc20_poll_data({
                                            "timestamp": parseFloat(($.now() / 1000).toFixed(0)),
                                            "hash": txhash,
                                            "confirmations": 0,
                                            "value": web3.utils.hexToNumberString(amount_hex),
                                            "decimals": token_decimals
                                        }, request.set_confirmations, request.currencysymbol);
                                    pick_monitor(txhash, txd);
                                    return
                                }
                            }
                        }
                    });
                }
            }
        }
    };
    websocket.onclose = function(e) {
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, thisaddress, e);
        return
    };
}

function handle_socket_fails(socket_node, thisaddress, error) {
    if (paymentdialogbox.hasClass("transacting")) { // temp fix for bch socket
        return false;
    }
    if (paymentpopup.hasClass("active")) { // only when request is visible
        var next_socket = try_next_socket(socket_node);
        if (next_socket === false) {
            var error_message = "unable to connect to " + socket_node.name;
            //fail_dialogs(socketname, error_message);
            console.log(error_message);
            socket_info(socket_node, false);
            notify("websocket offline", 500000, "yes");
        } else {
            closesocket(thisaddress);
            init_socket(next_socket, thisaddress, null, true);
        }
    }
}

function try_next_socket(current_socket_data) {
    if (current_socket_data) {
        var current_socket_url = current_socket_data.url,
            sockets = helper.socket_list,
            socketlist = (sockets.options) ? $.merge(sockets.apis, sockets.options) : sockets.apis,
            socket_index;
        $.each(socketlist, function(i, val) {
            if (val.url == current_socket_url) {
                socket_index = i;
            }
        });
        if (socket_index) {
            var next_scan = socketlist[socket_index + 1],
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
    var islive = (live) ? " <span class='pulse'></span>" : " <span class='icon-wifi-off'></span>",
        contents = "websocket: " + snode.url + islive;
    $("#current_socket").html(contents);
    if (live) {
        console.log("Connected: " + snode.url);
    }
}

function reconnect() {
    $(document).on("click", "#reconnect", function() {
        var txhash = $(this).attr("data-txid");
        canceldialog();
        pick_monitor(txhash);
    });
}

// Polling

// XMR Poll

function init_xmr_node(cachetime, address, vk, request_ts, txhash, start) {
    var payload = {
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
        "params": {
            "method": "POST",
            "data": JSON.stringify(payload),
            "headers": {
                "Content-Type": "text/plain"
            }
        }
    }).done(function(e) {
        var data = br_result(e).result,
            errormessage = data.Error;
        if (errormessage) {
            var error = (errormessage) ? errormessage : "Invalid Viewkey";
            popnotify("error", error);
        } else {
            var start_height = data.start_height;
            if (start_height > -1) { // success!
                var pingtime = (txhash) ? 35000 : 12000; // poll slower when we know txid
                if (start === true) {
                    ping_xmr_node(cachetime, address, vk, request_ts, txhash);
                }
                pinging[address] = setInterval(function() {
                    ping_xmr_node(cachetime, address, vk, request_ts, txhash);
                }, pingtime);
            }
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
        notify("Error verifying Viewkey");
    });
}

function ping_xmr_node(cachetime, address, vk, request_ts, txhash) {
    var payload = {
        "address": address,
        "view_key": vk
    };
    api_proxy({
        "api": "mymonero api",
        "search": "get_address_txs",
        "cachetime": cachetime,
        "cachefolder": "1h",
        "params": {
            "method": "POST",
            "data": JSON.stringify(payload),
            "headers": {
                "Content-Type": "text/plain"
            }
        }
    }).done(function(e) {
        var data = br_result(e).result,
            transactions = data.transactions;
        if (transactions) {
            var setconf = request.set_confirmations,
                txflip = transactions.reverse();
            $.each(txflip, function(dat, value) {
                var txd = xmr_scan_data(value, setconf, "xmr", data.blockchain_height);
                if (txd) {
                    if (txd.ccval) {
                        if (txhash) {
                            if (txhash == txd.txhash) {
                                confirmations(txd);
                            }
                            return
                        }
                        if (txd.transactiontime > request_ts && txd.ccval) {
                            var requestlist = $("#requestlist > li.rqli"),
                                txid_match = filter_list(requestlist, "txhash", txd.txhash); // check if txhash already exists
                            if (txid_match.length) {} else {
                                clearpinging();
                                if (setconf > 0) {
                                    confirmations(txd);
                                    pinging[address] = setInterval(function() {
                                        ping_xmr_node(34, address, vk, request_ts, txd.txhash);
                                    }, 35000);
                                }
                                confirmations(txd, true);
                            }
                        }
                    }
                }
            });
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        clearpinging();
        var error_object = (errorThrown) ? errorThrown : jqXHR,
            payment = request.payment;
        handle_api_fails(false, error_object, payment, payment, txhash);
    });
}

function after_poll(rq_init) {
    var amount_input = $("#mainccinputmirror > input"),
        input_val = amount_input.val(),
        api_info = helper.api_info,
        api_data = api_info.data,
        api_name = api_data.name,
        payment = request.payment,
        ccsymbol = request.currencysymbol,
        address = $("#paymentaddress").text(),
        set_confirmations = request.set_confirmations,
        request_ts_utc = rq_init + timezone,
        request_ts = request_ts_utc - 30000; // 30 seconds compensation for unexpected results
    if (input_val > 0) {
        if (ccsymbol == "btc" || ccsymbol == "bch") {
            ap_loader();
            bitcoincom_scan_poll(api_name, ccsymbol, set_confirmations, address, request_ts);
            return
        }
        if (ccsymbol == "ltc" || ccsymbol == "doge" || ccsymbol == "eth") {
            ap_loader();
            blockcypher_scan_poll(payment, api_name, ccsymbol, set_confirmations, address, request_ts);
            return
        }
        if (ccsymbol == "nano") {
            ap_loader();
            nano_scan_poll(api_name, api_data.url, ccsymbol, set_confirmations, address, request_ts);
            return
        }
        if (ccsymbol == "xmr") {
            var vk = get_vk(address);
            if (vk) {
                var account = (vk.account) ? vk.account : address,
                    viewkey = vk.vk;
                if (viewkey) {
                    request.monitored = true;
                    request.viewkey = viewkey;
                    ap_loader();
                    xmr_scan_poll_init(account, viewkey, set_confirmations, request_ts);
                    return
                }
            }
        }
        if (request.erc20 === true) {
            var token_contract = request.token_contract;
            if (token_contract) {
                ap_loader();
                erc20_scan_poll(api_name, ccsymbol, set_confirmations, address, request_ts, token_contract);
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

function bitcoincom_scan_poll(api_name, ccsymbol, set_confirmations, address, request_ts) {
    api_proxy({
        "api": "bitcoin.com",
        "search": ccsymbol + "/v1/addrs/txs",
        "cachetime": 25,
        "cachefolder": "1h",
        "proxy": true,
        "params": {
            "method": "POST",
            "data": JSON.stringify({
                "addrs": address
            }),
        }
    }).done(function(e) {
        var data = br_result(e).result;
        if (data) {
            var items = data.items;
            if (!$.isEmptyObject(items)) {
                var legacy = (ccsymbol == "bch") ? bchutils.toLegacyAddress(address) : address,
                    detect = false,
                    txdat;
                $.each(items, function(dat, value) {
                    if (value.txid) { // filter outgoing transactions
                        var txd = bitcoincom_scan_data(value, set_confirmations, ccsymbol, legacy, address);
                        if (txd.transactiontime > request_ts && txd.ccval) {
                            txdat = txd;
                            detect = true;
                            return
                        }
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
        var data = br_result(e).result;
        if (data) {
            if (data.error) {
                close_paymentdialog(true);
            } else {
                var items = data.txrefs;
                if (!$.isEmptyObject(items)) {
                    var detect = false,
                        txdat;
                    if (payment == "ethereum") {
                        $.each(items, function(dat, value) {
                            var txd = blockcypher_scan_data(value, set_confirmations, ccsymbol, payment);
                            if (txd.transactiontime > request_ts && txd.ccval) {
                                txdat = txd;
                                detect = true;
                                return
                            }
                        });
                    } else {
                        $.each(items, function(dat, value) {
                            if (value.spent !== undefined) { // filter outgoing transactions
                                var txd = blockcypher_scan_data(value, set_confirmations, ccsymbol, payment);
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
            }
        }
        close_paymentdialog(true);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        close_paymentdialog(true);
    });
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
        var data = br_result(e).result;
        if (data) {
            var nano_data = data.data;
            if (!$.isEmptyObject(nano_data)) {
                var detect = false,
                    txdat,
                    pending_array_node = nano_data[0].pending,
                    pending_array = $.isEmptyObject(pending_array_node) ? [] : pending_array_node,
                    history_array_node = nano_data[1].history,
                    history_array = $.isEmptyObject(history_array_node) ? [] : history_array_node,
                    merged_array = pending_array.concat(history_array).sort(function(x, y) { // merge and sort arrays
                        return y.local_timestamp - x.local_timestamp;
                    });
                $.each(merged_array, function(data, value) {
                    var txd = nano_scan_data(value, set_confirmations, ccsymbol);
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

function erc20_scan_poll(api_name, ccsymbol, set_confirmations, address, request_ts, token_contract) {
    api_proxy({
        "api": api_name,
        "search": "getAddressHistory/" + address + "?token=" + token_contract + "&type=transfer",
        "cachetime": 25,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        var data = br_result(e).result;
        if (data) {
            var items = data.operations;
            if (!$.isEmptyObject(items)) {
                var detect = false,
                    txdat;
                $.each(items, function(dat, value) {
                    var txd = ethplorer_scan_data(value, set_confirmations, ccsymbol);
                    if ((value.to.toUpperCase() == address.toUpperCase()) && (txd.transactiontime > request_ts) && txd.ccval) {
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

function xmr_scan_poll_init(address, vk, set_confirmations, request_ts) {
    var payload = {
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
        "params": {
            "method": "POST",
            "data": JSON.stringify(payload),
            "headers": {
                "Content-Type": "text/plain"
            }
        }
    }).done(function(e) {
        var data = br_result(e).result;
        if (!data.Error) {
            if (data.start_height > -1) { // success!
                xmr_scan_poll(address, vk, set_confirmations, request_ts);
                return
            }
        }
        close_paymentdialog(true);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        close_paymentdialog(true);
    });
}

function xmr_scan_poll(address, vk, set_confirmations, request_ts) {
    var payload = {
        "address": address,
        "view_key": vk
    };
    api_proxy({
        "api": "mymonero api",
        "search": "get_address_txs",
        "cachetime": 25,
        "cachefolder": "1h",
        "params": {
            "method": "POST",
            "data": JSON.stringify(payload),
            "headers": {
                "Content-Type": "text/plain"
            }
        }
    }).done(function(e) {
        var data = br_result(e).result;
        if (data) {
            var items = data.transactions;
            if (!$.isEmptyObject(items)) {
                var detect = false,
                    txdat,
                    txflip = items.reverse();
                $.each(txflip, function(dat, value) {
                    var txd = xmr_scan_data(value, set_confirmations, "xmr", data.blockchain_height);
                    if (txd) {
                        if (txd.transactiontime > request_ts && txd.ccval) {
                            var requestlist = $("#requestlist > li.rqli"),
                                txid_match = filter_list(requestlist, "txhash", txd.txhash); // check if txhash already exists
                            if (txid_match.length) {} else {
                                txdat = txd;
                                detect = true;
                                return
                            }
                        }
                    }
                });
                if (txdat && detect === true) {
                    confirmations(txdat, true);
                    return
                }
            }
        }
        close_paymentdialog(true);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        close_paymentdialog(true);
    });
}