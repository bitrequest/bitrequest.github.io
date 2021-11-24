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
    api_attempts["polling" + api_data.name] = null;
    api_monitor(api_data, txhash, tx_data);
    paymentdialogbox.addClass("transacting");
}

function api_monitor(api_data, txhash, tx_data) {
    var direct = (tx_data !== undefined),
        payment = request.payment,
        api_name = api_data.name,
        currencysymbol = request.currencysymbol,
        set_confirmations = request.set_confirmations;
    if (api_name === false) {
        console.log("No API selected");
    } else {
        var poll_url = (api_name == "blockcypher") ? currencysymbol + "/main/txs/" + txhash :
            (api_name == "ethplorer") ? "getTxInfo/" + txhash :
            (api_name == "blockchair") ? (request.erc20 === true) ? "ethereum/dashboards/transaction/" + txhash + "?erc_20=true" : payment + "/dashboards/transaction/" + txhash :
            (api_name == "bitcoin.com") ? currencysymbol + "/v1/tx/" + txhash : "";
        if (direct === true) {
            confirmations(tx_data, true);
            var xconf = (tx_data.confirmations) ? tx_data.confirmations : 0,
                setconfirmations = tx_data.setconfirmations,
                zero_conf = (xconf === false || setconfirmations == 0 || setconfirmations == "undefined" || setconfirmations === undefined);
            if (zero_conf) {} else {
                pingtx = setInterval(function() {
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
                pingtx = setInterval(function() {
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
            if (data.error) {
                clearpingtx();
                handle_api_fails(false, data.error, api_name, payment, txhash);
                return false;
            } else {
                var currentaddress = geturlparameters().address,
                    legacy = (currencysymbol == "bch") ? bchutils.toLegacyAddress(currentaddress) : currentaddress;
                txd = (api_name == "blockcypher") ? blockcypher_poll_data(data, set_confirmations, currencysymbol, currentaddress) :
                    (api_name == "ethplorer") ? ethplorer_poll_data(data, set_confirmations, currencysymbol) :
                    (api_name == "bitcoin.com") ? bitcoincom_scan_data(data, set_confirmations, currencysymbol, legacy, currentaddress) :
                    (api_name == "blockchair") ? (request.erc20 === true) ? blockchair_erc20_poll_data(data.data[txhash], set_confirmations, currencysymbol, data.context.state) :
                    (payment == "ethereum") ? blockchair_eth_scan_data(data.data[txhash].calls[0], set_confirmations, currencysymbol, data.context.state) :
                    blockchair_scan_data(data.data[txhash], set_confirmations, currencysymbol, currentaddress, data.context.state) : false;
                confirmations(txd);
            }
        };

        function api_error(jqXHR, textStatus, errorThrown) {
            clearpingtx();
            var error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_api_fails(false, error_object, api_name, payment, txhash);
            return false;
        }
    }
    console.log("source: " + api_name);
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

function rpc_monitor(rpcdata, txhash, tx_data) {
    var direct = (tx_data !== undefined),
        payment = request.payment,
        rpcurl = rpcdata.url;
    if (payment == "bitcoin" || payment == "litecoin" || payment == "dogecoin") {
        if (direct === true) {
            confirmations(tx_data, true);
            pingtx = setInterval(function() {
                api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
                    rpc_result(br_result(e));
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    rpc_error(jqXHR, textStatus, errorThrown);
                });
            }, 25000);
        } else {
            api_proxy(rmpl(payment, rpcurl, txhash)).done(function(e) {
                rpc_result(br_result(e));
                pingtx = setInterval(function() {
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
                clearpingtx();
                handle_rpc_monitor_fails(rpcdata, data.error, txhash);
                return false;
            } else {
                if (data.result.confirmations) {
                    var currentaddress = geturlparameters().address;
                    var txd = bitcoin_rpc_data(data.result, request.set_confirmations, request.currencysymbol, currentaddress);
                    confirmations(txd);
                }
            }
        };

        function rpc_error(jqXHR, textStatus, errorThrown) {
            clearpingtx();
            var error_object = (errorThrown) ? errorThrown : jqXHR;
            handle_rpc_monitor_fails(rpcdata, error_object, txhash);
            return false;
        }
    } else if (payment == "ethereum") {
        if (direct === true) {
            confirmations(tx_data, true);
        } else {
            ping_eth_node(rpcdata, txhash);
        }
        pingtx = setInterval(function() {
            ping_eth_node(rpcdata, txhash);
        }, 25000);
    } else if (request.erc20 === true) {
        if (direct === true) {
            confirmations(tx_data, true);
        } else {
            ping_eth_node_erc20(rpcdata, txhash);
        }
        pingtx = setInterval(function() {
            ping_eth_node_erc20(rpcdata, txhash);
        }, 25000);
    } else if (payment == "nano") {
        if (direct === true) {
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
                console.log(err_1);
                clearpingtx();
                handle_rpc_monitor_fails(rpcdata, err_1, txhash);
                return false;
            } else {
                if (data_1) {
                    var current_blocknumber = data_1;
                    web3.eth.getTransaction(txhash, function(err_2, data_2) {
                        if (err_2) {
                            console.log(err_2);
                            clearpingtx();
                            handle_rpc_monitor_fails(rpcdata, err_2, txhash);
                            return false;
                        } else {
                            if (data_2) {
                                var this_blocknumber = data_2.blockNumber;
                                web3.eth.getBlock(this_blocknumber, function(err_3, data_3) {
                                    if (err_3) {
                                        console.log(err_3);
                                        clearpingtx();
                                        handle_rpc_monitor_fails(rpcdata, err_3, txhash);
                                        return false;
                                    } else {
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
                                    }
                                });
                            }
                        }
                    });
                } else {
                    clearpingtx();
                    handle_rpc_monitor_fails(rpcdata, false, txhash);
                    return false;
                }
            }
        });
    } else {
        handle_rpc_monitor_fails(txhash);
        return false;
    }
}

function ping_eth_node_erc20(rpcdata, txhash) {
    if (web3) {
        var rpcurl = rpcdata.url + get_infura_apikey(rpcdata.url);
        if (web3.currentProvider.host == rpcurl) {} else {
            web3.setProvider(rpcurl);
        }
        web3.eth.getBlockNumber(function(err_1, data_1) {
            if (err_1) {
                console.log(err_1);
                clearpingtx();
                handle_rpc_monitor_fails(rpcdata, err_1, txhash);
                return false;
            } else {
                if (data_1) {
                    var current_blocknumber = data_1;
                    web3.eth.getTransaction(txhash, function(err_2, data_2) {
                        if (err_2) {
                            console.log(err_2);
                            clearpingtx();
                            handle_rpc_monitor_fails(rpcdata, err_2, txhash);
                            return false;
                        } else {
                            if (data_2) {
                                var this_blocknumber = data_2.blockNumber;
                                web3.eth.getBlock(this_blocknumber, function(err_3, data_3) {
                                    if (err_3) {
                                        console.log(err_3);
                                        clearpingtx();
                                        handle_rpc_monitor_fails(rpcdata, err_3, txhash);
                                        return false;
                                    } else {
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
                                    }
                                });
                            }
                        }
                    });
                } else {
                    clearpingtx();
                    handle_rpc_monitor_fails(rpcdata, false, txhash);
                    return false;
                }
            }
        });
    } else {
        clearpingtx();
        handle_rpc_monitor_fails(rpcdata, false, txhash);
        return false;
    }
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

function confirmations(tx_data, direct) {
    closeloader();
    clearTimeout(request_timer);
    if (tx_data === false || tx_data.ccval === undefined) {
        return false;
    }
    var pmd = $("#paymentdialogbox"),
        brstatuspanel = pmd.find(".brstatuspanel"),
        setconfirmations = (tx_data.setconfirmations) ? parseInt(tx_data.setconfirmations) : null,
        conf_text = (setconfirmations) ? setconfirmations.toString() : "",
        confbox = brstatuspanel.find("span.confbox"),
        confboxspan = confbox.find("span"),
        currentconf = parseFloat(confboxspan.attr("data-conf")),
        xconf = (tx_data.confirmations) ? tx_data.confirmations : 0,
        txhash = tx_data.txhash,
        zero_conf = (xconf === false || setconfirmations == 0 || setconfirmations == "undefined" || setconfirmations === undefined);
    brstatuspanel.find("span#confnumber").text(conf_text);
    if (xconf > currentconf || zero_conf === true || direct === true) {
        reset_recent();
        sessionStorage.removeItem("bitrequest_txstatus"); // remove cached historical exchange rates
        confbox.removeClass("blob");
        setTimeout(function() {
            confbox.addClass("blob");
            confboxspan.text(xconf).attr("data-conf", xconf);
        }, 500);
        var ow = pmd.find("#open_wallet"),
            cc_raw = ow.attr("data-rel"),
            cc_rawf = parseFloat(cc_raw),
            brheader = brstatuspanel.find("h2"),
            receivedutc = tx_data.transactiontime,
            receivedtime = receivedutc - timezone,
            receivedcc = tx_data.ccval,
            rccf = parseFloat(receivedcc.toFixed(6)),
            payment = request.payment,
            thiscurrency = request.uoa,
            currencysymbol = request.currencysymbol,
            requesttype = request.requesttype,
            iscrypto = (thiscurrency == currencysymbol),
            fiatvalue = (iscrypto === true) ? null : (rccf / parseFloat($("#paymentdialogbox .ccpool").attr("data-xrate"))) * parseFloat($("#paymentdialog .cpool[data-currency='" + thiscurrency + "']").attr("data-xrate")), // calculate fiat value
            fiatrounded = (iscrypto === true) ? null : fiatvalue.toFixed(2),
            receivedrounded = (iscrypto === true) ? receivedcc : fiatrounded;
        // extend global request object
        $.extend(request, {
            "received": true,
            "inout": requesttype,
            "receivedamount": rccf,
            "fiatvalue": fiatvalue,
            "paymenttimestamp": receivedutc,
            "txhash": txhash,
            "confirmations": xconf
        });
        brstatuspanel.find("span.receivedfiat").text(" (" + receivedrounded + " " + thiscurrency + ")");
        brstatuspanel.find("span.paymentdate").html(fulldateformat(new Date(receivedtime), language));
        var exact = helper.exact,
            xmr_pass = (payment == "monero") ? (rccf > cc_rawf * 0.97 && rccf < cc_rawf * 1.03) : true; // error margin for xmr integrated addresses
        if (xmr_pass) {
            var pass = (exact) ? (rccf == cc_rawf) : (rccf >= cc_rawf * 0.99);
            if (pass) {
                if (xconf >= setconfirmations || zero_conf === true) {
                    clearpingtx();
                    closesocket();
                    if (payment == "dogecoin") {
                        playsound(howl);
                    } else {
                        playsound(cashier);
                    }
                    paymentdialogbox.addClass("transacting").attr("data-status", "paid");
                    brheader.text("Payment received");
                    request.status = "paid",
                        request.pending = "polling";
                    saverequest(direct);
                    $("span#ibstatus").fadeOut(500);
                } else {
                    playsound(blip);
                    paymentdialogbox.addClass("transacting").attr("data-status", "pending");
                    brheader.text("Transaction broadcasted");
                    request.status = "pending",
                        request.pending = "polling";
                    saverequest(direct);
                }
                brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
            } else {
                if (exact) {} else {
                    brheader.text("Insufficient amount");
                    paymentdialogbox.addClass("transacting").attr("data-status", "insufficient");
                    request.status = "insufficient",
                        request.pending = "scanning";
                    saverequest(direct);
                    brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                }
                playsound(funk);
            }
        }
    } else {
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