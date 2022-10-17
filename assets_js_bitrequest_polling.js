// pick API / RPC

//pick_monitor
//api_monitor_init
//api_monitor
//ampl
//confirmations
//reset_recent

// pick API / RPC
function pick_monitor(txhash, tx_data, api_dat) {
    api_attempts = {};
    rpc_attempts = {};
    api_monitor_init(txhash, tx_data, api_dat);
}

function api_monitor_init(txhash, tx_data, api_data) {
    var api_info = (api_data) ? api_data : (helper.api_info) ? helper.api_info.data : false;
    if (api_info) {
        if (api_info.api) {
            api_monitor(txhash, tx_data, api_info);
        } else {
            rpc_monitor(txhash, tx_data, api_info);
        }
        paymentdialogbox.addClass("transacting");
    } else {
        console.log("missing api info");
    }
}

function api_monitor(txhash, tx_data, api_dat) {
    var api_name = api_dat.name;
    if (api_name) {
        api_attempts["pollings" + api_name] = true;
        var payment = request.payment,
            currencysymbol = request.currencysymbol,
            set_confirmations = request.set_confirmations,
            poll_url = (api_name == "blockcypher") ? currencysymbol + "/main/txs/" + txhash :
            (api_name == "ethplorer") ? "getTxInfo/" + txhash :
            (api_name == "blockchair") ? (request.erc20 === true) ? "ethereum/dashboards/transaction/" + txhash + "?erc_20=true" : payment + "/dashboards/transaction/" + txhash :
            (api_name == "amberdata") ? "transactions/" + txhash + "?includeFunctions=false&includeLogs=false&decodeTransactions=false&includeTokenTransfers=true" :
            (api_name == "mempool.space") ? "tx/" + txhash :
            (api_name == "nimiq.watch") ? "transaction/" + nimiqhash(txhash) :
            (api_name == "mopsus.com") ? "tx/" + txhash : null;
        if (tx_data) {
            confirmations(tx_data, true);
            var xconf = (tx_data.confirmations) ? tx_data.confirmations : 0,
                setconfirmations = tx_data.setconfirmations,
                zero_conf = (xconf === false || setconfirmations == 0 || setconfirmations == "undefined" || setconfirmations === undefined);
            if (zero_conf) {
                return
            }
        }
        api_proxy(ampl(api_name, poll_url)).done(function(e) {
            var apiresult = api_result(br_result(e));
            if (apiresult) {
                pinging[txhash + api_name] = setInterval(function() {
                    api_proxy(ampl(api_name, poll_url)).done(function(e) {
                        api_result(br_result(e));
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        api_error(jqXHR, textStatus, errorThrown);
                    });
                }, 25000);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            api_error(jqXHR, textStatus, errorThrown);
        });

        function api_result(result) {
            var data = result.result;
            if (data) {
                if (data.error) {
                    clearpinging();
                    handle_api_fails(false, data.error, api_name, payment, txhash, true);
                    return false;
                }
                if (api_name == "mopsus.com") {
                    mopsus_blockheight(data, set_confirmations, txhash);
                    return true;
                }
                var currentaddress = geturlparameters().address,
                    legacy = (currencysymbol == "bch") ? bchutils.toLegacyAddress(currentaddress) : currentaddress,
                    txd = (api_name == "blockcypher") ? blockcypher_poll_data(data, set_confirmations, currencysymbol, currentaddress) :
                    (api_name == "ethplorer") ? ethplorer_poll_data(data, set_confirmations, currencysymbol) :
                    (api_name == "mempool.space") ? mempoolspace_scan_data(data, set_confirmations, currencysymbol, currentaddress) :
                    (api_name == "nimiq.watch") ? nimiq_scan_data(data, set_confirmations) :
                    (api_name == "amberdata") ? (request.erc20 === true) ? (data.payload.tokenTransfers) ? amberdata_poll_token_data(data.payload.tokenTransfers[0], set_confirmations, currencysymbol, txhash, data.payload.confirmations) : null : amberdata_scan_data(data.payload, set_confirmations, currencysymbol, currentaddress) :
                    (api_name == "blockchair") ? (request.erc20 === true) ? blockchair_erc20_poll_data(data.data[txhash], set_confirmations, currencysymbol, data.context.state) :
                    (payment == "ethereum") ? blockchair_eth_scan_data(data.data[txhash].calls[0], set_confirmations, currencysymbol, data.context.state) :
                    blockchair_scan_data(data.data[txhash], set_confirmations, currencysymbol, currentaddress, data.context.state) : false;
                confirmations(txd);
                return true;
            }
            clearpinging();
            handle_api_fails(false, "error", api_name, payment, txhash, true);
            return false;
        };

        function api_error(jqXHR, textStatus, errorThrown) {
            clearpinging();
            var error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_api_fails(false, error_object, api_name, payment, txhash, true);
        }
        console.log("source: " + api_name);
        return
    }
    console.log("No API selected");
}

function ampl(api_name, poll_url) { // api_monitor payload
    if (api_name == "amberdata") {
        var ccsymbol = request.currencysymbol,
            network = (ccsymbol == "btc") ? "bitcoin-mainnet" :
            (ccsymbol == "ltc") ? "litecoin-mainnet" :
            (ccsymbol == "bch") ? "bitcoin-abc-mainnet" :
            (ccsymbol == "eth" || request.erc20 === true) ? "ethereum-mainnet" : null;
        return {
            "api": api_name,
            "search": poll_url,
            "cachetime": 10,
            "cachefolder": "1h",
            "bearer": api_name,
            "params": {
                "method": "GET",
                "cache": true,
                "headers": {
                    "accept": "application/json",
                    "x-amberdata-blockchain-id": network
                }
            }
        }
    } else {
        return {
            "api": api_name,
            "search": poll_url,
            "cachetime": 10,
            "cachefolder": "1h",
            "params": {
                "method": "GET",
                "cache": true
            }
        }
    }
}

function mopsus_blockheight(data, set_confirmations, txhash) { // api_monitor payload
    api_proxy({
        "api": "mopsus.com",
        "search": "quick-stats/",
        "proxy": false,
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        var result = br_result(e).result;
        if (result) {
            var lb = result.latest_block;
            if (lb) {
                var bh = lb.height,
                    txd = nimiq_scan_data(data, set_confirmations, bh, null, txhash);
                confirmations(txd);
                return
            }
        }
        var txd = nimiq_scan_data(data, set_confirmations, null, true, txhash);
        confirmations(txd, true);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var txd = nimiq_scan_data(data, set_confirmations, null, true, txhash);
        confirmations(txd, true);
    });
}

function handle_api_fails(rd, error, api_name, thispayment, txid) {
    var nextapi = get_next_api(thispayment, api_name, "pollings");
    if (nextapi === false) {
        var error_data = get_api_error_data(error);
        api_eror_msg(api_name, error_data);
        return
    }
    api_monitor_init(txid, null, nextapi);
}

function rpc_monitor(txhash, tx_data, rpcdata) {
    var payment = request.payment,
        rpcurl = rpcdata.url;
    rpc_attempts["pollings" + rpcurl] = true;
    if (payment == "bitcoin" || payment == "litecoin" || payment == "dogecoin") {
        if (tx_data) {
            confirmations(tx_data, true);
            pinging[txhash] = setInterval(function() {
                api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
                    rpc_result(br_result(e));
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    rpc_error(jqXHR, textStatus, errorThrown);
                });
            }, 25000);
        } else {
            api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
                rpc_result(br_result(e));
                pinging[txhash] = setInterval(function() {
                    api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
                        rpc_result(br_result(e));
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        rpc_error(jqXHR, textStatus, errorThrown);
                    });
                }, 25000);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                rpc_error(jqXHR, textStatus, errorThrown);
            });
        }

        function rpc_result(result) {
            var data = result.result;
            if (data.error) {
                clearpinging();
                handle_rpc_fails(rpcdata, data.error, txhash);
                return
            }
            if (data.result.confirmations) {
                var currentaddress = geturlparameters().address,
                    txd = bitcoin_rpc_data(data.result, request.set_confirmations, request.currencysymbol, currentaddress);
                confirmations(txd);
            }
        };

        function rpc_error(jqXHR, textStatus, errorThrown) {
            clearpinging();
            var error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_rpc_fails(rpcdata, error_object, txhash);
            return
        }
    } else if (payment == "ethereum") {
        if (tx_data) {
            confirmations(tx_data, true);
        } else {
            ping_eth_node(rpcdata, txhash);
        }
        pinging[txhash] = setInterval(function() {
            ping_eth_node(rpcdata, txhash);
        }, 25000);
    } else if (request.erc20 === true) {
        if (tx_data) {
            confirmations(tx_data, true);
        } else {
            ping_eth_node(rpcdata, txhash, true);
        }
        pinging[txhash] = setInterval(function() {
            ping_eth_node(rpcdata, txhash, true);
        }, 25000);
    } else if (payment == "nano") {
        if (tx_data) {
            confirmations(tx_data, true);
        } else {
            // nano payment with confirmations
        }
    }
    console.log("source: " + rpcurl);
}

function rmpl(payment, rpcurl, txhash) { // rpc_monitor payload
    return {
        "api": payment,
        "search": "txid",
        "cachetime": 10,
        "cachefolder": "1h",
        "api_url": rpcurl,
        "params": {
            "method": "POST",
            "data": JSON.stringify({
                "method": "getrawtransaction",
                "params": [txhash, true]
            }),
            "headers": {
                "Content-Type": "text/plain"
            }
        }
    }
}

function ping_eth_node(rpcdata, txhash, erc20) {
    var url = rpcdata.url,
        set_url = (url) ? url : main_eth_node;
    api_proxy(eth_params(set_url, 10, "eth_blockNumber", [])).done(function(a) {
        var r_1 = inf_result(a);
        if (r_1) {
            api_proxy(eth_params(set_url, 10, "eth_getTransactionByHash", [txhash])).done(function(b) {
                var r_2 = inf_result(b);
                if (r_2) {
                    var this_bn = r_2.blockNumber;
                    api_proxy(eth_params(set_url, 10, "eth_getBlockByNumber", [this_bn, false])).done(function(c) {
                        var r_3 = inf_result(c);
                        if (r_3) {
                            var tbn = Number(this_bn),
                                cbn = Number(r_1),
                                conf = cbn - tbn,
                                conf_correct = (conf < 0) ? 0 : conf,
                                txd;
                            if (erc20 === true) {
                                var input = r_2.input,
                                    address_upper = request.address.slice(3).toUpperCase(),
                                    input_upper = input.toUpperCase();
                                if (input_upper.indexOf(address_upper) >= 0) {
                                    var signature_hex = input.slice(2, 10),
                                        address_hex = input.slice(10, 74),
                                        amount_hex = input.slice(74, input.length),
                                        tokenValue = hexToNumberString(amount_hex),
                                        txdata = {
                                            "timestamp": r_3.timestamp,
                                            "hash": txhash,
                                            "confirmations": conf_correct,
                                            "value": tokenValue,
                                            "decimals": request.decimals
                                        },
                                        txd = infura_erc20_poll_data(txdata, request.set_confirmations, request.currencysymbol);
                                } else {
                                    clearpinging();
                                    handle_rpc_fails(rpcdata, inf_err(set_url), txhash);
                                    return
                                }
                            } else {
                                var txdata = {
                                        "timestamp": Number(r_3.timestamp),
                                        "hash": txhash,
                                        "confirmations": conf_correct,
                                        "value": Number(r_2.value)
                                    },
                                    txd = infura_eth_poll_data(txdata, request.set_confirmations, request.currencysymbol);
                            }
                            if (txd.ccval) {
                                confirmations(txd);
                            } else {
                                clearpinging();
                                handle_rpc_fails(rpcdata, inf_err(set_url), txhash);
                            }
                            return
                        }
                        clearpinging();
                        handle_rpc_fails(rpcdata, inf_err(set_url), txhash);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        clearpinging();
                        handle_rpc_fails(rpcdata, errorThrown, txhash);
                    });
                    return
                }
                clearpinging();
                handle_rpc_fails(rpcdata, inf_err(set_url), txhash);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                clearpinging();
                handle_rpc_fails(rpcdata, errorThrown, txhash);
            });
            return
        }
        clearpinging();
        handle_rpc_fails(rpcdata, inf_err(set_url), txhash);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        clearpinging();
        handle_rpc_fails(rpcdata, errorThrown, txhash);
    });
}

function handle_rpc_fails(rpcdata, error, txhash) {
    var rpcurl = rpcdata.url,
        nextrpc = get_next_rpc(request.payment, rpcurl, "pollings");
    if (nextrpc === false) { // retry with api source
	    var error_data = get_api_error_data("unabel to fetch data from " + rpcurl);
        api_eror_msg(rpcurl, error_data);
    } else {
        api_monitor_init(txhash, null, nextrpc);
    }
}

function confirmations(tx_data, direct, ln) {
    closeloader();
    clearTimeout(request_timer);
    if (tx_data && tx_data.ccval) {
        var pmd = $("#paymentdialogbox"),
            brstatuspanel = pmd.find(".brstatuspanel"),
            brheader = brstatuspanel.find("h2"),
            status = tx_data.status;
        if (status && status == "canceled") {
            brheader.html("<span class='icon-blocked'></span>Invoice canceled");
            pmd.attr("data-status", "canceled");
            updaterequest({
                "requestid": request.requestid,
                "status": "canceled",
                "confirmations": 0
            }, true);
            notify("Invoice canceled", 500000);
            forceclosesocket();
            return
        }
        var setconfirmations = (tx_data.setconfirmations) ? parseInt(tx_data.setconfirmations) : 0,
            conf_text = (setconfirmations) ? setconfirmations.toString() : "",
            confbox = brstatuspanel.find("span.confbox"),
            confboxspan = confbox.find("span"),
            currentconf = parseFloat(confboxspan.attr("data-conf")),
            xconf = (tx_data.confirmations) ? tx_data.confirmations : 0,
            txhash = tx_data.txhash,
            zero_conf = (xconf === false || !setconfirmations);
        brstatuspanel.find("span#confnumber").text(conf_text);
        if (xconf > currentconf || zero_conf === true || direct === true) {
            reset_recent();
            sessionStorage.removeItem("bitrequest_txstatus"); // remove cached historical exchange rates
            confbox.removeClass("blob");
            setTimeout(function() {
                confbox.addClass("blob");
                confboxspan.text(xconf).attr("data-conf", xconf);
            }, 500);
            var cc_raw = parseFloat($("#open_wallet").attr("data-rel")),
                receivedutc = tx_data.transactiontime,
                receivedtime = receivedutc - timezone,
                receivedcc = tx_data.ccval,
                rccf = parseFloat(receivedcc.toFixed(6)),
                payment = request.payment,
                thiscurrency = request.uoa,
                currencysymbol = request.currencysymbol,
                requesttype = request.requesttype,
                iscrypto = (thiscurrency == currencysymbol) ? true : false,
                fiatvalue = (iscrypto) ? null : (rccf / parseFloat($("#paymentdialogbox .ccpool").attr("data-xrate"))) * parseFloat($("#paymentdialog .cpool[data-currency='" + thiscurrency + "']").attr("data-xrate")), // calculate fiat value
                fiatrounded = (iscrypto) ? null : fiatvalue.toFixed(2),
                receivedrounded = (iscrypto) ? receivedcc : fiatrounded;
            // extend global request object
            $.extend(request, {
                "received": true,
                "inout": requesttype,
                "receivedamount": rccf,
                "fiatvalue": fiatvalue,
                "paymenttimestamp": receivedutc,
                "txhash": txhash,
                "confirmations": xconf,
                "set_confirmations": setconfirmations
            });
            brstatuspanel.find("span.paymentdate").html(fulldateformat(new Date(receivedtime), "en-us"));
            if (iscrypto) {} else {
                brstatuspanel.find("span.receivedcrypto").text(rccf + " " + currencysymbol);
            }
            brstatuspanel.find("span.receivedfiat").text(" (" + receivedrounded + " " + thiscurrency + ")");
            var exact = helper.exact,
                xmr_pass = (payment == "monero") ? (rccf > cc_raw * 0.97 && rccf < cc_raw * 1.03) : true; // error margin for xmr integrated addresses
            if (xmr_pass) {
                var pass = (exact) ? (rccf == cc_raw) : (rccf >= cc_raw * 0.97);
                if (pass) {
                    if (xconf >= setconfirmations || zero_conf === true) {
                        forceclosesocket();
                        if (payment == "dogecoin") {
                            playsound(howl);
                        } else {
                            playsound(cashier);
                        }
                        pmd.addClass("transacting").attr("data-status", "paid");
                        brheader.text("Payment received");
                        request.status = "paid",
                            request.pending = "polling";
                        saverequest(direct);
                        $("span#ibstatus").fadeOut(500);
                        closenotify();
                    } else {
                        if (ln) {} else {
                            playsound(blip);
                        }
                        pmd.addClass("transacting").attr("data-status", "pending");
                        var bctext = (ln) ? "Waiting for payment" : "Transaction broadcasted";
                        brheader.text(bctext);
                        request.status = "pending",
                            request.pending = "polling";
                        saverequest(direct);
                    }
                    brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                    return
                }
                if (exact) {} else {
                    brheader.text("Insufficient amount");
                    pmd.addClass("transacting").attr("data-status", "insufficient");
                    request.status = "insufficient",
                        request.pending = "scanning";
                    saverequest(direct);
                    brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                }
                playsound(funk);
            }
            return
        }
        playsound(blip);
    }
}

function reset_recent() {
    if (request) {
        var ls_recentrequests = localStorage.getItem("bitrequest_recent_requests");
        if (ls_recentrequests) {
            var lsrr_arr = JSON.parse(ls_recentrequests);
            delete lsrr_arr[request.payment];
            localStorage.setItem("bitrequest_recent_requests", JSON.stringify(lsrr_arr));
            if ($.isEmptyObject(lsrr_arr)) {
                toggle_rr(false);
            }
        }
    }
    canceldialog();
}