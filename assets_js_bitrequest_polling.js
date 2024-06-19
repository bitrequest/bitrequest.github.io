// pick API / RPC

//pick_monitor
//api_monitor_init
//api_monitor
//ampl
//confirmations
//reset_recent

// pick API / RPC
function pick_monitor(txhash, tx_data, api_dat) {
    glob_api_attempts = {};
    glob_rpc_attempts = {};
    api_monitor_init(txhash, tx_data, api_dat);
}

function api_monitor_init(txhash, tx_data, api_data) {
    const api_info = (api_data) ? api_data : q_obj(helper, "api_info.data");
    if (api_info) {
        if (api_info.api) {
            api_monitor(txhash, tx_data, api_info);
        } else {
            rpc_monitor(txhash, tx_data, api_info);
        }
        glob_paymentdialogbox.addClass("transacting");
        return
    }
    console.log("missing api info");
}

function api_monitor(txhash, tx_data, api_dat) {
    const api_name = api_dat.name;
    if (api_name) {
        const gets = geturlparameters();
        if (gets.xss) {
            return
        }
        if (tx_data) {
            confirmations(tx_data, true);
            const xconf = (tx_data.confirmations) ? tx_data.confirmations : 0,
                setconfirmations = tx_data.setconfirmations,
                zero_conf = (xconf === false || setconfirmations == 0 || setconfirmations == "undefined" || setconfirmations === undefined);
            if (zero_conf) {
                return
            }
        }
        if (api_name == "arbiscan" || api_name == glob_main_eth_node || api_name == glob_main_arbitrum_node) {
            rpc_monitor(txhash, tx_data, api_dat);
            return
        }
        glob_api_attempts["pollings" + api_name] = true;
        const payment = request.payment,
            currencysymbol = request.currencysymbol,
            set_confirmations = request.set_confirmations,
            poll_url = (api_name == "blockcypher") ? currencysymbol + "/main/txs/" + txhash :
            (api_name == "ethplorer" || api_name == "binplorer") ? "getTxInfo/" + txhash :
            (api_name == "blockchair") ? (request.erc20 === true) ? "ethereum/dashboards/transaction/" + txhash + "?erc_20=true" : payment + "/dashboards/transaction/" + txhash :
            (api_name == "mempool.space") ? "tx/" + txhash :
            (api_name == "nimiq.watch") ? "transaction/" + nimiqhash(txhash) :
            (api_name == "mopsus.com") ? "tx/" + txhash :
            (api_name == "kaspa.org") ? "transactions/" + txhash :
            (api_name == "kas.fyi") ? "transactions/" + txhash : null,
            to_time = (tx_data === false) ? 100 : 25000,
            timeout = setTimeout(function() {
                api_proxy(ampl(api_dat, poll_url)).done(function(e) {
                    const apiresult = api_result(br_result(e));
                    if (apiresult) {
                        glob_pinging[txhash + api_name] = setInterval(function() {
                            if (glob_paymentpopup.hasClass("active")) { // only when request is visible
                                api_proxy(ampl(api_dat, poll_url)).done(function(e) {
                                    api_result(br_result(e));
                                }).fail(function(jqXHR, textStatus, errorThrown) {
                                    api_error(jqXHR, textStatus, errorThrown);
                                });
                                return
                            }
                            forceclosesocket();
                        }, 25000);
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    api_error(jqXHR, textStatus, errorThrown);
                });
            }, to_time, function() {
                clearTimeout(timeout);
            });

        function api_result(result) {
            const data = result.result;
            if (data) {
                const currentaddress = gets.address;
                if (data.error) {
                    clearpinging();
                    handle_api_fails(false, data.error, api_name, payment, txhash, true);
                    return false;
                }
                if (api_name == "mopsus.com") {
                    mopsus_blockheight(data, set_confirmations, txhash);
                    return true;
                }
                if (api_name == "kaspa.org") {
                    kaspa_blockheight(data, set_confirmations, currentaddress);
                    return true;
                }
                const txd = (api_name == "blockcypher") ? blockcypher_poll_data(data, set_confirmations, currencysymbol, currentaddress) :
                    (api_name == "ethplorer" || api_name == "binplorer") ? ethplorer_poll_data(data, set_confirmations, currencysymbol) :
                    (api_name == "mempool.space") ? mempoolspace_scan_data(data, set_confirmations, currencysymbol, currentaddress) :
                    (api_name == "nimiq.watch") ? nimiq_scan_data(data, set_confirmations) :
                    (api_name == "kas.fyi") ? kaspa_poll_fyi_data(data, currentaddress, set_confirmations) :
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
            const error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_api_fails(false, error_object, api_name, payment, txhash, true);
        }
        console.log("source: " + api_name);
        return
    }
    console.log("No API selected");
}

function ampl(api_dat, poll_url) { // api_monitor payload
    const api_name = api_dat.name;
    if (api_name == "mempool.space") {
        const endpoint = "https://" + api_dat.url;
        return {
            "cachetime": 10,
            "cachefolder": "1h",
            "api_url": endpoint + "/api/" + poll_url,
            "params": {
                "method": "GET",
                "cache": true
            }
        }
    }
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

function mopsus_blockheight(data, set_confirmations, txhash) { // api_monitor payload
    api_proxy({
        "api": "mopsus.com",
        "search": "quick-stats/",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const dat = br_result(e),
            bh = q_obj(dat, "result.latest_block.height");
        if (bh) {
            const txd = nimiq_scan_data(data, set_confirmations, bh, null, txhash);
            confirmations(txd);
            return
        }
        const txd = nimiq_scan_data(data, set_confirmations, null, true, txhash);
        confirmations(txd, true);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const txd = nimiq_scan_data(data, set_confirmations, null, true, txhash);
        confirmations(txd, true);
    });
}

function kaspa_blockheight(data, set_confirmations, address) { // api_monitor payload
    api_proxy({
        "api": "kaspa.org",
        "search": "info/virtual-chain-blue-score",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const res = br_result(e).result;
        if (res) {
            const current_bluescore = res.blueScore;
            if (current_bluescore) {
                const txd = kaspa_scan_data(data, address, set_confirmations, current_bluescore);
                confirmations(txd);
                return
            }
        }
        const txd = kaspa_scan_data(data, address, set_confirmations);
        confirmations(txd, true);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const txd = kaspa_scan_data(data, address, set_confirmations);
        confirmations(txd, true);
    });
}

function handle_api_fails(rd, error, api_name, thispayment, txid) {
    const nextapi = get_next_api(thispayment, api_name, "pollings");
    if (nextapi === false) {
        const error_data = get_api_error_data(error);
        api_eror_msg(api_name, error_data);
        return
    }
    api_monitor_init(txid, null, nextapi);
}

function rpc_monitor(txhash, tx_data, rpcdata) {
    const gets = geturlparameters();
    if (gets.xss) {
        return
    }
    const payment = request.payment,
        rpcurl = rpcdata.url;
    glob_rpc_attempts["pollings" + rpcurl] = true;
    if (is_btchain(payment) === true) {
        if (tx_data) {
            confirmations(tx_data, true);
            glob_pinging[txhash] = setInterval(function() {
                if (glob_paymentpopup.hasClass("active")) { // only when request is visible
                    api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
                        rpc_result(br_result(e));
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        rpc_error(jqXHR, textStatus, errorThrown);
                    });
                    return
                }
                forceclosesocket();
            }, 25000);
            return
        }
        api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
            rpc_result(br_result(e));
            glob_pinging[txhash] = setInterval(function() {
                if (glob_paymentpopup.hasClass("active")) { // only when request is visible
                    api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
                        rpc_result(br_result(e));
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        rpc_error(jqXHR, textStatus, errorThrown);
                    });
                    return
                }
                forceclosesocket();
            }, 25000);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            rpc_error(jqXHR, textStatus, errorThrown);
        });

        function rpc_result(result) {
            const data = result.result;
            if (data) {
                if (data.error) {
                    clearpinging();
                    handle_rpc_fails(rpcdata, data.error, txhash);
                    return
                }
                if (data.txid) {
                    const currentaddress = gets.address,
                        txd = mempoolspace_scan_data(data, request.set_confirmations, request.currencysymbol, currentaddress);
                    confirmations(txd);
                }
            }
        };

        function rpc_error(jqXHR, textStatus, errorThrown) {
            clearpinging();
            const error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_rpc_fails(rpcdata, error_object, txhash);
            return
        }
        return
    }
    if (payment == "ethereum") {
        if (tx_data) {
            confirmations(tx_data, true);
        } else {
            ping_eth_node(rpcdata, txhash);
        }
        glob_pinging[txhash] = setInterval(function() {
            ping_eth_node(rpcdata, txhash);
        }, 25000);
        return
    }
    if (request.erc20 === true) {
        if (tx_data) {
            confirmations(tx_data, true);
        } else {
            ping_eth_node(rpcdata, txhash, true);
        }
        glob_pinging[txhash] = setInterval(function() {
            ping_eth_node(rpcdata, txhash, true);
        }, 25000);
        return
    }
    if (payment == "nano") {
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
        "api_url": rpcurl + "/api/tx/" + txhash,
        "proxy": false,
        "params": {
            "method": "GET"
        }
    }
}

function ping_eth_node(rpcdata, txhash, erc20) {
    if (glob_paymentpopup.hasClass("active")) { // only when request is visible
        const rpcurl = get_rpc_url(rpcdata),
            set_url = (rpcdata.name == "arbiscan") ? glob_main_arbitrum_node : (rpcurl) ? rpcurl : glob_main_eth_node;
        api_proxy(eth_params(set_url, 10, "eth_blockNumber", [])).done(function(a) {
            const r_1 = inf_result(a);
            if (r_1) {
                api_proxy(eth_params(set_url, 10, "eth_getTransactionByHash", [txhash])).done(function(b) {
                    const r_2 = inf_result(b);
                    if (r_2) {
                        const this_bn = r_2.blockNumber;
                        api_proxy(eth_params(set_url, 10, "eth_getBlockByNumber", [this_bn, false])).done(function(c) {
                            const r_3 = inf_result(c);
                            if (r_3) {
                                const tbn = Number(this_bn),
                                    cbn = Number(r_1),
                                    conf = cbn - tbn,
                                    conf_correct = (conf < 0) ? 0 : conf;
                                let txd = {};
                                if (erc20 === true) {
                                    const input = r_2.input;
                                    if (str_match(input, request.address.slice(3)) === true) {
                                        const signature_hex = input.slice(2, 10),
                                            amount_hex = input.slice(74),
                                            tokenValue = hexToNumberString(amount_hex),
                                            txdata = {
                                                "timestamp": r_3.timestamp,
                                                "hash": txhash,
                                                "confirmations": conf_correct,
                                                "value": tokenValue,
                                                "decimals": request.decimals
                                            };
                                        txd = infura_erc20_poll_data(txdata, request.set_confirmations, request.currencysymbol);
                                    } else {
                                        clearpinging();
                                        handle_rpc_fails(rpcdata, inf_err(set_url), txhash);
                                        return
                                    }
                                } else {
                                    const txdata = {
                                        "timestamp": Number(r_3.timestamp),
                                        "hash": txhash,
                                        "confirmations": conf_correct,
                                        "value": Number(r_2.value)
                                    };
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
        return
    }
    forceclosesocket();
}

function handle_rpc_fails(rpcdata, error, txhash) {
    const rpcurl = rpcdata.url,
        nextrpc = get_next_rpc(request.payment, rpcurl, "pollings");
    if (nextrpc === false) { // retry with api source
        const error_data = get_api_error_data("unable to fetch data from " + rpcurl);
        api_eror_msg(rpcurl, error_data);
        return
    }
    api_monitor_init(txhash, null, nextrpc);
}

function confirmations(tx_data, direct, ln) {
    closeloader();
    clearTimeout(glob_request_timer);
    if (tx_data && tx_data.ccval) {
        const pmd = $("#paymentdialogbox"),
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
            notify(translate("invoicecanceled"), 500000);
            forceclosesocket();
            return
        }
        const setconfirmations = (tx_data.setconfirmations) ? parseInt(tx_data.setconfirmations) : 0,
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
            br_remove_session("txstatus"); // remove cached historical exchange rates
            confbox.removeClass("blob");
            setTimeout(function() {
                confbox.addClass("blob");
                confboxspan.text(xconf).attr("data-conf", xconf);
            }, 500);
            const amount_rel = $("#open_wallet").attr("data-rel"),
                cc_raw = (amount_rel && amount_rel.length) ? parseFloat(amount_rel) : 0,
                receivedutc = tx_data.transactiontime,
                receivedtime = receivedutc - glob_timezone,
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
            brstatuspanel.find("span.paymentdate").html(fulldateformat(new Date(receivedtime), glob_langcode));
            if (iscrypto) {} else {
                brstatuspanel.find("span.receivedcrypto").text(rccf + " " + currencysymbol);
            }
            brstatuspanel.find("span.receivedfiat").text(" (" + receivedrounded + " " + thiscurrency + ")");
            const exact = helper.exact,
                xmr_pass = (payment == "monero") ? (rccf > cc_raw * 0.97 && rccf < cc_raw * 1.03) : true; // error margin for xmr integrated addresses
            if (xmr_pass) {
                const pass = (exact) ? (rccf == cc_raw) ? true : false : (rccf >= cc_raw * 0.97) ? true : false;
                if (pass) {
                    if (xconf >= setconfirmations || zero_conf === true) {
                        forceclosesocket();
                        if (payment == "dogecoin") {
                            playsound(glob_howl);
                        } else {
                            playsound(glob_cashier);
                        }
                        const status_text = (requesttype == "incoming") ? translate("paymentsent") : translate("paymentreceived");
                        pmd.addClass("transacting").attr("data-status", "paid");
                        brheader.text(status_text);
                        request.status = "paid",
                            request.pending = "polling";
                        saverequest(direct);
                        $("span#ibstatus").fadeOut(500);
                        closenotify();
                    } else {
                        if (ln) {} else {
                            playsound(glob_blip);
                        }
                        pmd.addClass("transacting").attr("data-status", "pending");
                        const bctext = (ln) ? translate("waitingforpayment") : translate("txbroadcasted");
                        brheader.text(bctext);
                        request.status = "pending",
                            request.pending = "polling";
                        saverequest(direct);
                    }
                    brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                    return
                }
                if (exact) {} else {
                    brheader.text(translate("insufficientamount"));
                    pmd.addClass("transacting").attr("data-status", "insufficient");
                    request.status = "insufficient",
                        request.pending = "scanning";
                    saverequest(direct);
                    brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                }
                playsound(glob_funk);
            }
            return
        }
    }
}

function reset_recent() {
    if (request) {
        const ls_recentrequests = br_get_local("recent_requests");
        if (ls_recentrequests) {
            const lsrr_arr = JSON.parse(ls_recentrequests);
            delete lsrr_arr[request.payment];
            br_set_local("recent_requests", lsrr_arr, true);
            if ($.isEmptyObject(lsrr_arr)) {
                toggle_rr(false);
            }
        }
    }
    canceldialog();
}