// pick API / RPC

//pick_monitor
//api_monitor_init
//api_monitor
//ampl
//rpc_monitor
//rmpl
//ping_eth_node
//ping_eth_node_erc20
//handle_rpc_monitor_fails
//confirmations
//reset_recent

// pick API / RPC
function pick_monitor(txhash, tx_data) {
	var api_info = helper.api_info;
    if (api_info.api === true) {
        api_monitor_init(api_info.data, txhash, tx_data);
    } else {
        rpc_monitor(api_info.data, txhash, tx_data);
    }
}

function api_monitor_init(api_data, txhash, tx_data) {
	api_attempts = {};
    api_monitor(api_data, txhash, tx_data);
    paymentdialogbox.addClass("transacting");
}

function api_monitor(api_data, txhash, tx_data) {
    var api_name = api_data.name;
    if (api_name) {
	    api_attempts["pollings" + api_name] = true;
        var payment = request.payment,
            currencysymbol = request.currencysymbol,
            set_confirmations = request.set_confirmations,
            poll_url = (api_name == "blockcypher") ? currencysymbol + "/main/txs/" + txhash :
            (api_name == "ethplorer") ? "getTxInfo/" + txhash :
            (api_name == "blockchair" || api_name == "bitcoin.com") ? (request.erc20 === true) ? "ethereum/dashboards/transaction/" + txhash + "?erc_20=true" : payment + "/dashboards/transaction/" + txhash :
            (api_name == "mempool.space") ? "tx/" + txhash :
            (api_name == "nimiq.watch") ? "transaction/" + nimiqhash(txhash) :
            (api_name == "mopsus.com") ? "tx/" + txhash : null;
        if (tx_data) {
            confirmations(tx_data, true);
            var xconf = (tx_data.confirmations) ? tx_data.confirmations : 0,
                setconfirmations = tx_data.setconfirmations,
                zero_conf = (xconf === false || setconfirmations == 0 || setconfirmations == "undefined" || setconfirmations === undefined);
            if (zero_conf) {} else {
                pinging[txhash + api_name] = setInterval(function() {
                    api_proxy(ampl(api_name, poll_url)).done(function(e) {
                        api_result(br_result(e));
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        api_error(jqXHR, textStatus, errorThrown);
                    });
                }, 25000);
            }
        } else {
            api_proxy(ampl(api_name, poll_url)).done(function(e) {
                api_result(br_result(e));
                pinging[txhash + api_name] = setInterval(function() {
                    api_proxy(ampl(api_name, poll_url)).done(function(e) {
                        api_result(br_result(e));
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        api_error(jqXHR, textStatus, errorThrown);
                    });
                }, 25000);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                api_error(jqXHR, textStatus, errorThrown);
            });
        }

        function api_result(result) {
            var data = result.result;
            if (data) {
                if (data.error) {
	                clearpinging();
                    handle_api_fails(false, data.error, api_name, payment, txhash, true);
                    return
                }
                if (api_name == "mopsus.com") {
	                mopsus_blockheight(data, set_confirmations, txhash);
	                return
                }
                var currentaddress = geturlparameters().address,
                    legacy = (currencysymbol == "bch") ? bchutils.toLegacyAddress(currentaddress) : currentaddress,
                    txd = (api_name == "blockcypher") ? blockcypher_poll_data(data, set_confirmations, currencysymbol, currentaddress) :
                    (api_name == "ethplorer") ? ethplorer_poll_data(data, set_confirmations, currencysymbol) :
                    (api_name == "mempool.space") ? mempoolspace_scan_data(data, set_confirmations, currencysymbol, currentaddress) :
                    (api_name == "nimiq.watch") ? nimiq_scan_data(data, set_confirmations) :
                    (api_name == "blockchair" || api_name == "bitcoin.com") ? (request.erc20 === true) ? blockchair_erc20_poll_data(data.data[txhash], set_confirmations, currencysymbol, data.context.state) :
                    (payment == "ethereum") ? blockchair_eth_scan_data(data.data[txhash].calls[0], set_confirmations, currencysymbol, data.context.state) :
                    blockchair_scan_data(data.data[txhash], set_confirmations, currencysymbol, currentaddress, data.context.state) : false;
                confirmations(txd);
                return
            }
            clearpinging();
            handle_api_fails(false, "error", api_name, payment, txhash, true);
        };

        function api_error(jqXHR, textStatus, errorThrown) {
	        clearpinging();
            var error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_api_fails(false, error_object, api_name, payment, txhash, true);
            return
        }
        console.log("source: " + api_name);
        return
    }
    console.log("No API selected");
}

function ampl(api_name, poll_url) { // api_monitor payload
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
        "proxy": false,
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
	    if (e) {
		    var lb = e.latest_block;
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

function rpc_monitor(rpcdata, txhash, tx_data) {
    var payment = request.payment,
        rpcurl = rpcdata.url;
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
                handle_rpc_monitor_fails(rpcdata, data.error, txhash);
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
            handle_rpc_monitor_fails(rpcdata, error_object, txhash);
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
            ping_eth_node_erc20(rpcdata, txhash);
        }
        pinging[txhash] = setInterval(function() {
            ping_eth_node_erc20(rpcdata, txhash);
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

function ping_eth_node(rpcdata, txhash) {
    if (web3) {
        var rpcurl = rpcdata.url + get_infura_apikey(rpcdata.url);
        if (web3.currentProvider.host == rpcurl) {} else {
            web3.setProvider(rpcurl);
        }
        web3.eth.getBlockNumber(function(err_1, data_1) {
            if (err_1) {
                clearpinging();
                handle_rpc_monitor_fails(rpcdata, err_1, txhash);
                return
            }
            if (data_1) {
                var current_blocknumber = data_1;
                web3.eth.getTransaction(txhash, function(err_2, data_2) {
                    if (err_2) {
                        clearpinging();
                        handle_rpc_monitor_fails(rpcdata, err_2, txhash);
                        return
                    }
                    if (data_2) {
                        var this_blocknumber = data_2.blockNumber;
                        web3.eth.getBlock(this_blocknumber, function(err_3, data_3) {
                            if (err_3) {
                                clearpinging();
                                handle_rpc_monitor_fails(rpcdata, err_3, txhash);
                                return
                            }
                            var conf = current_blocknumber - this_blocknumber,
                                conf_correct = (conf < 0) ? 0 : conf,
                                txdata = {
                                    "timestamp": data_3.timestamp,
                                    "hash": txhash,
                                    "confirmations": conf_correct,
                                    "value": data_2.value,
                                    "decimals": 18
                                },
                                txd = infura_eth_poll_data(txdata, request.set_confirmations, request.currencysymbol);
                            confirmations(txd);
                        });
                    }
                });
                return
            }
        });
    }
    clearpinging();
    handle_rpc_monitor_fails(rpcdata, false, txhash);
}

function ping_eth_node_erc20(rpcdata, txhash) {
    if (web3) {
        var rpcurl = rpcdata.url + get_infura_apikey(rpcdata.url);
        if (web3.currentProvider.host == rpcurl) {} else {
            web3.setProvider(rpcurl);
        }
        web3.eth.getBlockNumber(function(err_1, data_1) {
            if (err_1) {
                clearpinging();
                handle_rpc_monitor_fails(rpcdata, err_1, txhash);
                return
            }
            if (data_1) {
                var current_blocknumber = data_1;
                web3.eth.getTransaction(txhash, function(err_2, data_2) {
                    if (err_2) {
                        clearpinging();
                        handle_rpc_monitor_fails(rpcdata, err_2, txhash);
                        return
                    }
                    if (data_2) {
                        var this_blocknumber = data_2.blockNumber;
                        web3.eth.getBlock(this_blocknumber, function(err_3, data_3) {
                            if (err_3) {
                                clearpinging();
                                handle_rpc_monitor_fails(rpcdata, err_3, txhash);
                                return
                            }
                            if (data_3) {
                                var input = data_2.input,
                                    amount_hex = input.slice(74, input.length),
                                    tokenValue = web3.utils.hexToNumberString(amount_hex),
                                    conf = current_blocknumber - this_blocknumber,
                                    conf_correct = (conf < 0) ? 0 : conf,
                                    txdata = {
                                        "timestamp": data_3.timestamp,
                                        "hash": txhash,
                                        "confirmations": conf_correct,
                                        "value": tokenValue,
                                        "decimals": request.decimals
                                    },
                                    txd = infura_erc20_poll_data(txdata, request.set_confirmations, request.currencysymbol);
                                confirmations(txd);
                            }
                        });
                    }
                });
                return
            }
        });
    }
    clearpinging();
    handle_rpc_monitor_fails(rpcdata, false, txhash);
}

function handle_rpc_monitor_fails(rpcdata, error, txhash) {
    var this_coinsettings = getcoinsettings(payment),
        api_data = this_coinsettings.apis.selected, // get api source
        apiurl = api_data.url;
    if (apiurl == rpcdata.url) {
        var error_object = (error === false) ? false : get_rpc_error_data(error);
        rpc_eror_msg(rpcdata.name, error_object, true);
    } else {
        api_monitor_init(api_data, txhash); // retry with api source
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
        var setconfirmations = (ln) ? 1 : (tx_data.setconfirmations) ? parseInt(tx_data.setconfirmations) : 0,
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