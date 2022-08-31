$(document).ready(function() {
    updaterequeststatestrigger();
    updaterequeststatesrefresh();
    //trigger_requeststates
    //get_requeststates
    //getinputs
    //check_api
    //choose_api_inputs
    //get_api_inputs_defaults

    //get_api_inputs_init
    //get_api_inputs
    //match_xmr_pid
    //fail_dialogs
    //handle_api_fails_list
    //get_next_api
    //get_api_error_data
    //api_src
    //tx_api_fail
    //api_eror_msg
    //tx_count

    //get_rpc_inputs_init
    //get_rpc_inputs
    //eth_params
    //inf_err
    //handle_rpc_fails_list
    //get_next_rpc
    //scan_tx_li
    //append_tx_li
    //hs_for
    //historic_data_title

    //compareamounts
    //get_historical_fiat_data
    //get_historic_fiatprice_api_payload
    //form_date
    //get_historical_crypto_data
    //get_payload_historic_coingecko
    //get_payload_historic_coinpaprika
    //get_payload_historic_coincodex
    //cx_date
    //compare_historic_prices
    //get_historic_object_coingecko
    //get_historic_object_coinpaprika
});

// ** Fetch incoming transactions **

function updaterequeststatestrigger() {
    $(document).on("click", ".requestsbttn .self", function() {
        trigger_requeststates(true);
    })
}

function updaterequeststatesrefresh() {
    if (geturlparameters().p == "requests") { // only trigger on "requests page"
        setTimeout(function() {
            trigger_requeststates();
        }, 300);
    }
}

function trigger_requeststates(trigger) {
    if (offline === true || inframe === true) {
        return // do nothing when offline
    } else {
        api_attempts = {}, // reset cache and index
            rpc_attempts = {},
            tx_list = [], // reset transaction index
            statuspush = [];
        var active_requests = $("#requestlist .rqli").filter(function() {
            return $(this).data("pending") != "unknown";
        });
        active_requests.addClass("scan");
        get_requeststates(trigger);
    }
}

function get_requeststates(trigger) {
    //requestincoming
    var request_data = $("#requestlist li.rqli.scan").first().data();
    if (request_data) {
        if (trigger == "loop") {
            getinputs(request_data);
        } else {
            var statuscache = sessionStorage.getItem("bitrequest_txstatus");
            if (statuscache) {
                var parsevalue = JSON.parse(statuscache),
                    cachetime = now() - parsevalue.timestamp,
                    requeststates = parsevalue.requeststates;
                if (cachetime > 30000 || $.isEmptyObject(requeststates)) { //check if cached crypto rates are expired (check every 30 seconds on page refresh or when opening request page)
                    sessionStorage.removeItem("bitrequest_txstatus"); // remove cached transactions
                    getinputs(request_data);
                } else {
                    if (trigger === true) {} else { // only update on page refresh
                        // parse cached transaction data
                        $.each(requeststates, function(i, value) {
                            var thislist = $("#" + value.requestid),
                                thisdata = thislist.data(),
                                pendingstatus = thisdata.pending;
                            if (pendingstatus == "scanning" || pendingstatus == "polling") {
                                var statuspanel = thislist.find(".pmetastatus"),
                                    transactionlist = thislist.find(".transactionlist");
                                statuspanel.text(value.status);
                                transactionlist.html("");
                                $.each(value.transactions, function(data, value) {
                                    var tx_listitem = append_tx_li(value, false);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(value));
                                    }
                                });
                                thislist.addClass("pmstatloaded");
                            }
                        });
                    }
                }
            } else {
                getinputs(request_data);
            }
        }
    } else {
        if (!$.isEmptyObject(statuspush)) {
            var statusobject = JSON.stringify({
                "timestamp": now(),
                "requeststates": statuspush
            });
            sessionStorage.setItem("bitrequest_txstatus", statusobject);
            saverequests();
        }
    }
}

function getinputs(rd) {
    var thislist = $("#" + rd.requestid),
        iserc20 = rd.erc20,
        api_info = check_api(rd.payment, iserc20),
        selected = api_info.data;
    thislist.removeClass("pmstatloaded");
    if (api_info.api === true) {
        choose_api_inputs(rd, selected);
    } else {
        get_rpc_inputs_init(rd, selected);
    }
}

function check_api(payment, iserc20) {
    var api_data = $("#" + payment + "_settings .cc_settinglist li[data-id='apis']").data();
    if (api_data) {
        var selected = api_data.selected;
        if (selected.api === true) {
            return {
                "api": true,
                "data": selected
            }
        }
        return {
            "api": false,
            "data": selected
        }
    }
    if (iserc20) {
        return {
            "api": true,
            "data": {
                "name": "ethplorer",
                "url": "ethplorer.io",
                "api": true,
                "display": true
            }
        }
    }
    return {
        "api": false,
        "data": false
    }
}

function choose_api_inputs(rd, api_data) {
    if (api_data) {
        get_api_inputs_init(rd, api_data, api_data.name);
        return
    }
    console.log("no api data available");
}

function get_api_inputs_defaults(rd, api_data) {
    var payment = rd.payment;
    if (payment == "bitcoin" || payment == "litecoin" || payment == "dogecoin" || payment == "ethereum") {
        get_api_inputs_init(rd, api_data, "blockcypher");
    } else if (rd.erc20 === true) {
        get_api_inputs_init(rd, api_data, "ethplorer");
    } else {
        get_api_inputs_init(rd, api_data, api_data.name);
    }
}

function get_api_inputs_init(rd, api_data, api_name) {
    api_attempts[rd.requestid + api_name] = null; // reset api attempts
    get_api_inputs(rd, api_data, api_name);
}

function get_api_inputs(rd, api_data, api_name) {
    var requestid = rd.requestid,
        thislist = $("#" + requestid);
    if (thislist.hasClass("scan")) {
        api_attempts[requestid + api_name] = true;
        var payment = rd.payment,
            pending = rd.pending,
            address = rd.address,
            requestdate = (rd.inout == "incoming") ? rd.timestamp : rd.requestdate,
            request_timestamp = requestdate - 30000, // 30 seconds compensation for unexpected results
            ccsymbol = rd.currencysymbol,
            getconfirmations = rd.set_confirmations,
            getconfint = (getconfirmations) ? parseInt(getconfirmations) : 1,
            setconfirmations = (getconfint) ? getconfint : 1, // set minimum confirmations to 1
            rq_status = rd.status,
            statuspanel = thislist.find(".pmetastatus"),
            transactionlist = thislist.find("ul.transactionlist"),
            transactionhash = rd.txhash,
            lnhash = (transactionhash && transactionhash.slice(0, 9) == "lightning") ? true : false,
            erc20 = (rd.erc20 === true),
            counter = 0,
            lnd = rd.lightning,
            ln_only = (lnd && lnd.hybrid === false) ? true : false,
            canceled = (rq_status == "canceled") ? true : false;
        thislist.removeClass("no_network");
        if (pending == "no" || pending == "incoming" || thislist.hasClass("expired")) {
            transactionlist.find("li").each(function(i) {
                tx_list.push($(this).data("txhash"));
            });
            api_callback(requestid, true);
            return
        }
        if (pending == "scanning" || pending == "polling" || canceled) {
            transactionlist.html("");
            if (lnd) {
                var metalist = thislist.find(".metalist"),
                    status_field = metalist.find(".status"),
                    p_arr = lnurl_deform(lnd.proxy_host),
                    proxy_host = p_arr.url,
                    pk = (lnd.pw) ? lnd.pw : p_arr.k,
                    pid = lnd.pid,
                    nid = lnd.nid,
                    imp = lnd.imp,
                    rqtype = rd.requesttype,
                    default_error = "unable to connect";
                if (pending == "scanning" || canceled) {
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
                    }).done(function(r) {
                        var error = r.error;
                        if (error) {
                            var message = (error) ? (error.message) ? error.message : (typeof error == "string") ? error : default_error : default_error;
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, {
                                "error": message,
                                "console": true
                            }, false, payment);
                            status_field.text(" " + message);
                        } else {
                            var inv_status = r.status;
                            status_field.text(" " + inv_status);
                            if (r.pid == lnd.pid) {
                                if (r.bolt11) {
                                    $.ajax({
                                        "method": "POST",
                                        "cache": false,
                                        "timeout": 5000,
                                        "url": proxy_host + "proxy/v1/ln/api/",
                                        "data": {
                                            "fn": "ln-invoice-status",
                                            "imp": imp,
                                            "hash": r.hash,
                                            "id": pid,
                                            "nid": nid,
                                            "callback": "no",
                                            "type": rqtype,
                                            "x-api": pk
                                        }
                                    }).done(function(e) {
                                        var inv_error = e.error;
                                        if (inv_error) {
                                            var err_message = (inv_error.message) ? inv_error.message : (typeof inv_error == "string") ? inv_error : default_error;
                                            tx_api_fail(thislist, statuspanel);
                                            handle_api_fails_list(rd, {
                                                "error": err_message,
                                                "console": true
                                            }, false, payment);
                                            status_field.text(" " + err_message);
                                        } else {
                                            var status = e.status;
                                            if (status) {
                                                lnd.invoice = e;
                                                status_field.text(" " + status);
                                                rd.lightning = lnd; // push invoice
                                                var txd = lnd_tx_data(e);
                                                if (txd.ccval) {
                                                    var tx_listitem = append_tx_li(txd, thislist, true);
                                                    if (tx_listitem) {
                                                        transactionlist.append(tx_listitem.data(txd));
                                                        tx_count(statuspanel, txd.confirmations);
                                                        if (status == "canceled") {
                                                            updaterequest({
                                                                "requestid": requestid,
                                                                "status": "canceled",
                                                                "confirmations": 0
                                                            }, false);
                                                        }
                                                        compareamounts(rd);
                                                    }
                                                }
                                            }
                                        }
                                    }).fail(function(jqXHR, textStatus, errorThrown) {
                                        tx_api_fail(thislist, statuspanel);
                                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                                        handle_api_fails_list(rd, error_object, false, payment);
                                    });
                                } else {
                                    tx_count(statuspanel, 0);
                                    handle_api_fails_list(rd, {
                                        "error": "invoice not found",
                                        "console": true
                                    }, false, payment);
                                }
                            } else {
                                if (inv_status == "not found") {
                                    updaterequest({
                                        "requestid": requestid,
                                        "status": "expired",
                                        "pending": "no",
                                        "confirmations": 0
                                    }, true);
                                }
                                handle_api_fails_list(rd, {
                                    "error": "payment id not found",
                                    "console": true
                                }, false, payment);
                            }
                        }
                        var version = r.version;
                        if (version != proxy_version) {
                            proxy_alert(version);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, false, payment);
                    }).always(function() {
                        api_src(thislist, {
                            "name": "proxy"
                        });
                    });
                    if (ln_only) {
                        return
                    }
                }
                if (pending == "polling" && lnhash) {
                    var invoice = lnd.invoice;
                    if (invoice) {
                        if (transactionhash) {
                            $.ajax({
                                "method": "POST",
                                "cache": false,
                                "timeout": 5000,
                                "url": proxy_host + "proxy/v1/ln/api/",
                                "data": {
                                    "fn": "ln-invoice-status",
                                    "imp": imp,
                                    "hash": transactionhash.slice(9),
                                    "id": pid,
                                    "nid": nid,
                                    "callback": "no",
                                    "type": rqtype,
                                    "x-api": pk
                                }
                            }).done(function(e) {
                                var status = e.status;
                                if (status) {
                                    lnd.invoice = e;
                                    status_field.text(" " + status);
                                    rd.lightning = lnd; // push invoice
                                    var txd = lnd_tx_data(e);
                                    if (txd.ccval) {
                                        var tx_listitem = append_tx_li(txd, thislist, true);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            tx_count(statuspanel, txd.confirmations);
                                            if (status == "canceled") {
                                                updaterequest({
                                                    "requestid": requestid,
                                                    "status": "canceled",
                                                    "confirmations": 0
                                                }, true);
                                            }
                                            compareamounts(rd);
                                        }
                                    }
                                }
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                tx_api_fail(thislist, statuspanel);
                                var error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_api_fails_list(rd, error_object, false, payment);
                            }).always(function() {
                                api_src(thislist, {
                                    "name": "proxy"
                                });
                            });
                        } else {
                            handle_api_fails_list(rd, {
                                "error": "Transaction not found",
                                "console": true
                            }, false, payment);
                        }
                    } else {
                        handle_api_fails_list(rd, {
                            "error": "invoice not found",
                            "console": true
                        }, false, payment);
                    }
                    return
                }
            }
            if (payment == "monero") {
                var vk = rd.viewkey;
                if (vk) {
                    var account = (vk.account) ? vk.account : address,
                        viewkey = vk.vk,
                        payload = JSON.stringify({
                            "address": account,
                            "view_key": viewkey,
                            "create_account": true,
                            "generated_locally": false
                        });
                    api_proxy({
                        "api": api_name,
                        "search": "login",
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "params": {
                            "method": "POST",
                            "data": payload,
                            "headers": {
                                "Content-Type": "text/plain"
                            }
                        }
                    }).done(function(e) {
                        var data = br_result(e).result;
                        if (data.start_height > -1) { // success!
                            var pl = {
                                "address": account,
                                "view_key": viewkey
                            };
                            api_proxy({
                                "api": api_name,
                                "search": "get_address_txs",
                                "cachetime": 25,
                                "cachefolder": "1h",
                                "params": {
                                    "method": "POST",
                                    "data": JSON.stringify(pl),
                                    "headers": {
                                        "Content-Type": "text/plain"
                                    }
                                }
                            }).done(function(e) {
                                var data = br_result(e).result,
                                    transactions = data.transactions;
                                if (transactions) {
                                    var txflip = transactions.reverse();
                                    $.each(txflip, function(dat, value) {
                                        var txd = xmr_scan_data(value, setconfirmations, "xmr", data.blockchain_height);
                                        if (txd) {
                                            if (pending == "polling") {
                                                if (txd.txhash == transactionhash && txd.ccval) {
                                                    var tx_listitem = append_tx_li(txd, thislist);
                                                    if (tx_listitem) {
                                                        transactionlist.append(tx_listitem.data(txd));
                                                        counter++;
                                                    }
                                                    return
                                                }
                                            }
                                            if (txd.transactiontime > request_timestamp && txd.ccval) {
                                                if (pending == "scanning") {
                                                    var xid_match = match_xmr_pid(rd.xmr_ia, rd.payment_id, txd.payment_id); // match xmr payment_id if set
                                                    if (xid_match === true) {
                                                        var tx_listitem = append_tx_li(txd, thislist);
                                                        if (tx_listitem) {
                                                            transactionlist.append(tx_listitem.data(txd));
                                                            counter++;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    tx_count(statuspanel, counter);
                                    compareamounts(rd);
                                }
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                tx_api_fail(thislist, statuspanel);
                                var error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_api_fails_list(rd, error_object, api_data, payment);
                            });
                        } else {
                            tx_api_fail(thislist, statuspanel);
                            var errormessage = data.Error,
                                error_object = (errormessage) ? errormessage : "Invalid Viewkey";
                            handle_api_fails_list(rd, error_object, api_data, payment);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, {
                            "name": "mymonero api"
                        });
                    });
                }
                return
            }
            if (api_name == "bitcoin.com") {
                var legacy = (ccsymbol == "bch") ? bchutils.toLegacyAddress(address) : address;
                if (pending == "scanning") { // scan incoming transactions on address
                    api_proxy({
                        "api": api_name,
                        "search": ccsymbol + "/v1/addrs/txs",
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "proxy": true,
                        "params": {
                            "method": "POST",
                            "data": JSON.stringify({
                                "addrs": address
                            })
                        }
                    }).done(function(e) {
                        var data = br_result(e).result;
                        if (data) {
                            if (data.error) {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, data.error, api_data, payment);
                            } else {
                                var items = data.items;
                                if ($.isEmptyObject(items)) {} else {
                                    $.each(items, function(dat, value) {
                                        if (value.txid) { // filter outgoing transactions
                                            var txd = bitcoincom_scan_data(value, setconfirmations, ccsymbol, legacy, address);
                                            if (txd.transactiontime > request_timestamp && txd.ccval) {
                                                var tx_listitem = append_tx_li(txd, thislist);
                                                if (tx_listitem) {
                                                    transactionlist.append(tx_listitem.data(txd));
                                                    counter++;
                                                }
                                            }
                                        }
                                    });
                                    tx_count(statuspanel, counter);
                                    compareamounts(rd);
                                }
                            }
                        } else {
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, api_data);
                    });
                }
                if (pending == "polling") { // poll bitcoin.com transaction id
                    if (transactionhash) {
                        api_proxy({
                            "api": api_name,
                            "search": ccsymbol + "/v1/tx/" + transactionhash,
                            "cachetime": 25,
                            "cachefolder": "1h",
                            "params": {
                                "method": "GET"
                            }
                        }).done(function(e) {
                            var data = br_result(e).result;
                            if (data) {
                                var txd = bitcoincom_scan_data(data, setconfirmations, ccsymbol, legacy, address);
                                if (txd) {
                                    if (txd.ccval) {
                                        var tx_listitem = append_tx_li(txd, thislist);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            tx_count(statuspanel, 1);
                                            compareamounts(rd);
                                        }
                                    }
                                }
                            } else {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            }
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            var error_object = (errorThrown) ? errorThrown : jqXHR;
                            handle_api_fails_list(rd, error_object, api_data, payment);
                        }).always(function() {
                            api_src(thislist, api_data);
                        });
                    }
                }
                return
            }
            if (api_name == "mempool.space") {
                if (pending == "scanning") { // scan incoming transactions on address
                    api_proxy({
                        "api": api_name,
                        "search": "address/" + address + "/txs",
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "proxy": true,
                        "params": {
                            "method": "GET"
                        }
                    }).done(function(e) {
                        var data = br_result(e).result;
                        if (data) {
                            if ($.isEmptyObject(data)) {} else {
                                $.each(data, function(dat, value) {
                                    if (value.txid) { // filter outgoing transactions
                                        var txd = mempoolspace_scan_data(value, setconfirmations, ccsymbol, address);
                                        if (txd.transactiontime > request_timestamp && txd.ccval) {
                                            var tx_listitem = append_tx_li(txd, thislist);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                                counter++;
                                            }
                                        }
                                    }
                                });
                                tx_count(statuspanel, counter);
                                compareamounts(rd);
                            }
                        } else {
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, api_data);
                    });
                }
                if (pending == "polling") { // poll mempool.space transaction id
                    if (transactionhash) {
                        api_proxy({
                            "api": api_name,
                            "search": "tx/" + transactionhash,
                            "cachetime": 25,
                            "cachefolder": "1h",
                            "params": {
                                "method": "GET"
                            }
                        }).done(function(e) {
                            var data = br_result(e).result;
                            if (data) {
                                var txd = mempoolspace_scan_data(data, setconfirmations, ccsymbol, address);
                                if (txd) {
                                    if (txd.ccval) {
                                        var tx_listitem = append_tx_li(txd, thislist);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            tx_count(statuspanel, 1);
                                            compareamounts(rd);
                                        }
                                    }
                                }
                            } else {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            }
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            var error_object = (errorThrown) ? errorThrown : jqXHR;
                            handle_api_fails_list(rd, error_object, api_data, payment);
                        }).always(function() {
                            api_src(thislist, api_data);
                        });
                    }
                }
                return
            }
            if (api_name == "blockcypher") {
                if (pending == "scanning") { // scan incoming transactions on address
                    api_proxy({
                        "api": api_name,
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
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, data.error, api_data, payment);
                            } else {
                                if (payment == "ethereum") {
                                    $.each(data.txrefs, function(dat, value) {
                                        var txd = blockcypher_scan_data(value, setconfirmations, ccsymbol, payment);
                                        if (txd.transactiontime > request_timestamp && txd.ccval) {
                                            var tx_listitem = append_tx_li(txd, thislist);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                                counter++;
                                            }
                                        }
                                    });
                                } else {
                                    var conf_tx = data.txrefs,
                                        unconf_tx = data.unconfirmed_txrefs,
                                        all_tx = (conf_tx) ? (conf_tx) : (unconf_tx) ? unconf_tx : null;
                                    if (all_tx) {
                                        $.each(all_tx, function(dat, value) {
                                            if (value.spent !== undefined) { // filter outgoing transactions
                                                var txd = blockcypher_scan_data(value, setconfirmations, ccsymbol, payment);
                                                if (txd.transactiontime > request_timestamp && txd.ccval) {
                                                    var tx_listitem = append_tx_li(txd, thislist);
                                                    if (tx_listitem) {
                                                        transactionlist.append(tx_listitem.data(txd));
                                                        counter++;
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }
                                tx_count(statuspanel, counter);
                                compareamounts(rd);
                            }
                        } else {
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, api_data);
                    });
                }
                if (pending == "polling") { // poll transaction id
                    if (transactionhash) {
                        api_proxy({
                            "api": api_name,
                            "search": ccsymbol + "/main/txs/" + transactionhash,
                            "cachetime": 25,
                            "cachefolder": "1h",
                            "params": {
                                "method": "GET"
                            }
                        }).done(function(e) {
                            var data = br_result(e).result;
                            if (data) {
                                if (data.error) {
                                    tx_api_fail(thislist, statuspanel);
                                    handle_api_fails_list(rd, data.error, api_data, payment);
                                } else {
                                    var txd = blockcypher_poll_data(data, setconfirmations, ccsymbol, address);
                                    if (txd.ccval) {
                                        var tx_listitem = append_tx_li(txd, thislist);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            tx_count(statuspanel, 1);
                                            compareamounts(rd);
                                        }
                                    }
                                }
                            } else {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            }
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            var error_object = (errorThrown) ? errorThrown : jqXHR;
                            handle_api_fails_list(rd, error_object, api_data, payment);
                        }).always(function() {
                            api_src(thislist, api_data);
                        });
                    }
                }
                return
            }
            if (api_name == "ethplorer") {
                if (pending == "scanning") { // scan incoming transactions on address
                    api_proxy({
                        "api": api_name,
                        "search": "getAddressHistory/" + address + "?token=" + rd.token_contract + "&type=transfer",
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "params": {
                            "method": "GET"
                        }
                    }).done(function(e) {
                        var data = br_result(e).result;
                        if (data) {
                            if (data.error) {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, data.error, api_data, payment);
                            } else {
                                $.each(data.operations, function(dat, value) {
                                    var txd = ethplorer_scan_data(value, setconfirmations, ccsymbol),
                                        rt_compensate = (rd.inout == "local" && rd.status == "insufficient") ? request_timestamp - 30000 : request_timestamp; // substract extra 30 seconds (extra compensation)
                                    if ((value.to.toUpperCase() == address.toUpperCase()) && (txd.transactiontime > rt_compensate) && txd.ccval) {
                                        var tx_listitem = append_tx_li(txd, thislist);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            counter++;
                                        }
                                    }
                                });
                                tx_count(statuspanel, counter);
                                compareamounts(rd);
                            }
                        } else {
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, api_data);
                    });
                }
                if (pending == "polling") { // poll transaction id
                    if (transactionhash) {
                        api_proxy({
                            "api": api_name,
                            "search": "getTxInfo/" + transactionhash,
                            "cachetime": 25,
                            "cachefolder": "1h",
                            "params": {
                                "method": "GET"
                            }
                        }).done(function(e) {
                            var data = br_result(e).result;
                            if (data) {
                                if (data.error) {
                                    tx_api_fail(thislist, statuspanel);
                                    handle_api_fails_list(rd, data.error, api_data, payment);
                                } else {
                                    var txd = ethplorer_poll_data(data, setconfirmations, ccsymbol);
                                    if (txd.ccval) {
                                        var tx_listitem = append_tx_li(txd, thislist);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            tx_count(statuspanel, 1);
                                            compareamounts(rd);
                                        }
                                    }
                                }
                            } else {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            }
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            var error_object = (errorThrown) ? errorThrown : jqXHR;
                            handle_api_fails_list(rd, error_object, api_data, payment);
                        }).always(function() {
                            api_src(thislist, api_data);
                        });
                    }
                }
                return
            }
            if (api_name == "blockchair") {
                if (pending == "scanning") { // scan incoming transactions on address
                    var scan_url = (erc20 === true) ? "ethereum/erc-20/" + rd.token_contract + "/dashboards/address/" + address : payment + "/dashboards/address/" + address;
                    api_proxy({
                        "api": api_name,
                        "search": scan_url,
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "params": {
                            "method": "GET"
                        }
                    }).done(function(e) {
                        var data = br_result(e).result;
                        if (data) {
                            if (data.error) {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, data.error, api_data, payment);
                            } else {
                                var context = data.context;
                                if (context.error) {
                                    tx_api_fail(thislist, statuspanel);
                                    handle_api_fails_list(rd, context.error, api_data, payment);
                                } else {
                                    var latestblock = context.state;
                                    if (erc20 === true) {
                                        $.each(data.data, function(dat, value) {
                                            $.each(value.transactions, function(dt, val) {
                                                var txd = blockchair_erc20_scan_data(val, setconfirmations, ccsymbol, latestblock);
                                                if ((txd.transactiontime > request_timestamp) && (txd.recipient.toUpperCase() == address.toUpperCase()) && (txd.token_symbol.toUpperCase() == ccsymbol.toUpperCase()) && txd.ccval) {
                                                    var tx_listitem = append_tx_li(txd, thislist);
                                                    if (tx_listitem) {
                                                        transactionlist.append(tx_listitem.data(txd));
                                                        counter++;
                                                    }
                                                }
                                            });
                                        });
                                        tx_count(statuspanel, counter);
                                        compareamounts(rd);
                                    } else {
                                        if (payment == "ethereum") {
                                            $.each(data.data, function(dat, value) {
                                                $.each(value.calls, function(dt, val) {
                                                    var txd = blockchair_eth_scan_data(val, setconfirmations, ccsymbol, latestblock);
                                                    if (txd.transactiontime > request_timestamp && txd.recipient.toUpperCase() == address.toUpperCase() && txd.ccval) {
                                                        var tx_listitem = append_tx_li(txd, thislist);
                                                        if (tx_listitem) {
                                                            transactionlist.append(tx_listitem.data(txd));
                                                            counter++;
                                                        }
                                                    }
                                                });
                                            });
                                            tx_count(statuspanel, counter);
                                            compareamounts(rd);
                                        } else {
                                            var txarray = data.data[address].transactions; // get transactions
                                            if ($.isEmptyObject(txarray)) {} else {
                                                api_proxy({
                                                    "api": api_name,
                                                    "search": payment + "/dashboards/transactions/" + txarray.slice(0, 6), // get last 5 transactions
                                                    "cachetime": 25,
                                                    "cachefolder": "1h",
                                                    "params": {
                                                        "method": "GET"
                                                    }
                                                }).done(function(e) {
                                                    var dat = br_result(e).result;
                                                    $.each(dat.data, function(dt, val) {
                                                        var txd = blockchair_scan_data(val, setconfirmations, ccsymbol, address, latestblock);
                                                        if (txd.transactiontime > request_timestamp && txd.ccval) { // get all transactions after requestdate
                                                            var tx_listitem = append_tx_li(txd, thislist);
                                                            if (tx_listitem) {
                                                                transactionlist.append(tx_listitem.data(txd));
                                                                counter++;
                                                            }
                                                        }
                                                    });
                                                    tx_count(statuspanel, counter);
                                                    compareamounts(rd);
                                                }).fail(function(jqXHR, textStatus, errorThrown) {
                                                    tx_api_fail(thislist, statuspanel);
                                                    var error_object = (errorThrown) ? errorThrown : jqXHR;
                                                    handle_api_fails_list(rd, error_object, api_data, payment);
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, api_data);
                    });
                }
                if (pending == "polling") { // poll transaction id
                    if (transactionhash) {
                        var poll_url = (erc20 === true) ? "ethereum/dashboards/transaction/" + transactionhash + "?erc_20=true" : payment + "/dashboards/transaction/" + transactionhash;
                        api_proxy({
                            "api": api_name,
                            "search": poll_url,
                            "cachetime": 25,
                            "cachefolder": "1h",
                            "params": {
                                "method": "GET"
                            }
                        }).done(function(e) {
                            var data = br_result(e).result;
                            if (data) {
                                var context = data.context;
                                if (context) {
                                    if (context.error) {
                                        tx_api_fail(thislist, statuspanel);
                                        handle_api_fails_list(rd, context.error, api_data, payment);
                                    } else {
                                        var latestblock = context.state,
                                            txd = (erc20 === true) ? blockchair_erc20_poll_data(data.data[transactionhash], setconfirmations, ccsymbol, latestblock) :
                                            (payment == "ethereum") ? blockchair_eth_scan_data(data.data[transactionhash].calls[0], setconfirmations, ccsymbol, latestblock) :
                                            blockchair_scan_data(data.data[transactionhash], setconfirmations, ccsymbol, address, latestblock);
                                        if (txd.ccval) {
                                            var tx_listitem = append_tx_li(txd, thislist);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                                tx_count(statuspanel, 1);
                                                compareamounts(rd);
                                            }
                                        }
                                    }
                                }
                            } else {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            }
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            var error_object = (errorThrown) ? errorThrown : jqXHR;
                            handle_api_fails_list(rd, error_object, api_data, payment);
                        }).always(function() {
                            api_src(thislist, api_data);
                        });
                    }
                }
            }
            if (api_name == "nimiq.watch" || api_name == "mopsus.com") {
                if (pending == "scanning") { // scan incoming transactions on address
                    api_proxy({
                        "api": api_name,
                        "search": "account-transactions/" + address,
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "proxy": true,
                        "params": {
                            "method": "GET"
                        }
                    }).done(function(e) {
                        var data = br_result(e).result;
                        if (data) {
                            if ($.isEmptyObject(data)) {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            } else {
                                $.each(data, function(dat, value) {
                                    var r_address = value.receiver_address.replace(/\s/g, "");
                                    if (r_address == address) { // filter outgoing transactions
                                        var txd = nimiq_scan_data(value, setconfirmations);
                                        if (txd.transactiontime > request_timestamp && txd.ccval) {
                                            var tx_listitem = append_tx_li(txd, thislist);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                                counter++;
                                            }
                                        }
                                    }
                                });
                                tx_count(statuspanel, counter);
                                compareamounts(rd);
                            }
                        } else {
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, api_data);
                    });
                }
                if (pending == "polling") {
                    if (transactionhash) {
                        if (api_name == "nimiq.watch") { // poll nimiq.watch transaction id
                            api_proxy({
                                "api": api_name,
                                "search": "transaction/" + nimiqhash(transactionhash),
                                "cachetime": 25,
                                "cachefolder": "1h",
                                "params": {
                                    "method": "GET"
                                }
                            }).done(function(e) {
                                var data = br_result(e).result;
                                if (data) {
                                    if (data.error) {
                                        tx_api_fail(thislist, statuspanel);
                                        handle_api_fails_list(rd, data.error, api_data, payment);
                                    } else {
                                        var txd = nimiq_scan_data(data, setconfirmations);
                                        if (txd) {
                                            if (txd.ccval) {
                                                var tx_listitem = append_tx_li(txd, thislist);
                                                if (tx_listitem) {
                                                    transactionlist.append(tx_listitem.data(txd));
                                                    tx_count(statuspanel, 1);
                                                    compareamounts(rd);
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    tx_api_fail(thislist, statuspanel);
                                    handle_api_fails_list(rd, "unknown error", api_data, payment);
                                }
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                tx_api_fail(thislist, statuspanel);
                                var error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_api_fails_list(rd, error_object, api_data, payment);
                            }).always(function() {
                                api_src(thislist, api_data);
                            });
                        } else {
                            if (api_name == "mopsus.com") { // poll mopsus.com transaction id
                                api_proxy({
                                    "api": api_name,
                                    "search": "tx/" + transactionhash,
                                    "cachetime": 25,
                                    "cachefolder": "1h",
                                    "params": {
                                        "method": "GET"
                                    }
                                }).done(function(e) {
                                    var data = br_result(e).result;
                                    if (data) {
                                        if (data.error) {
                                            tx_api_fail(thislist, statuspanel);
                                            handle_api_fails_list(rd, data.error, api_data, payment);
                                        } else {
                                            api_proxy({
                                                "api": api_name,
                                                "search": "quick-stats/",
                                                "cachetime": 25,
                                                "cachefolder": "1h",
                                                "params": {
                                                    "method": "GET"
                                                }
                                            }).done(function(res) {
                                                var e = br_result(res).result;
                                                if (e) {
                                                    var lb = e.latest_block;
                                                    if (lb) {
                                                        var bh = lb.height,
                                                            txd = nimiq_scan_data(data, setconfirmations, bh, null, transactionhash);
                                                        if (txd) {
                                                            if (txd.ccval) {
                                                                var tx_listitem = append_tx_li(txd, thislist);
                                                                if (tx_listitem) {
                                                                    transactionlist.append(tx_listitem.data(txd));
                                                                    tx_count(statuspanel, 1);
                                                                    compareamounts(rd);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                                tx_api_fail(thislist, statuspanel);
                                                var error_object = (errorThrown) ? errorThrown : jqXHR;
                                                handle_api_fails_list(rd, error_object, api_data, payment);
                                            });
                                        }
                                    } else {
                                        tx_api_fail(thislist, statuspanel);
                                        handle_api_fails_list(rd, "unknown error", api_data, payment);
                                    }
                                }).fail(function(jqXHR, textStatus, errorThrown) {
                                    tx_api_fail(thislist, statuspanel);
                                    var error_object = (errorThrown) ? errorThrown : jqXHR;
                                    handle_api_fails_list(rd, error_object, api_data, payment);
                                }).always(function() {
                                    api_src(thislist, api_data);
                                });
                            }
                        }
                    }
                }
                return
            }
        }
    }
}

function match_xmr_pid(xmria, xmrpid, xmr_pid) {
    if (xmria) {
        if (xmrpid) {
            if (xmr_pid) {
                if (xmrpid == xmr_pid) {
                    return true;
                }
            }
            return false;
        }
    }
    return true;
}

// API error handling

function fail_dialogs(apisrc, error) {
    var error_data = get_api_error_data(error);
    api_eror_msg(apisrc, error_data)
}

function handle_api_fails_list(rd, error, api_data, thispayment) {
    var api_name = api_data.name,
        requestid = rd.requestid,
        nextapi = get_next_api(thispayment, api_name, requestid);
    if (nextapi === false) {
        var api_url = api_data.url,
            nextrpc = get_next_rpc(thispayment, api_url, requestid);
        if (nextrpc === false) { // try next api
            var rpc_id = (api_name) ? api_name : (api_url) ? api_url : "unknown",
                error_data = get_api_error_data(error);
            api_eror_msg(rpc_id, error_data);
            api_callback(requestid, true);
            return
        }
    }
    if (nextapi) {
        get_api_inputs(rd, nextapi, nextapi.name);
    } else if (nextrpc) {
        get_rpc_inputs(rd, nextrpc);
    }
}

function get_next_api(this_payment, api_name, requestid) {
    var rpc_settings_li = $("#" + this_payment + "_settings .cc_settinglist li[data-id='apis']");
    if (rpc_settings_li) {
        var rpc_settings = rpc_settings_li.data(),
            apirpc = rpc_settings.apis,
            apilist = $.grep(apirpc, function(filter) {
                return filter.api;
            })
        if (!$.isEmptyObject(apilist)) {
            var next_scan = apilist[apilist.findIndex(option => option.name == api_name) + 1],
                next_api = (next_scan) ? next_scan : apilist[0],
                rqid = (requestid) ? requestid : "";
            if (api_attempts[rqid + next_api.name] !== true) {
                return next_api;
            }
        }
    }
    return false;
}

function get_api_error_data(error) {
    var error_type = typeof error,
        errorcode = (error.code) ? error.code :
        (error.status) ? error.status :
        (error.error_code) ? error.error_code : "",
        errormessage = (error.error) ? error.error :
        (error.message) ? error.message :
        (error.type) ? error.type :
        (error.error_message) ? error.error_message :
        (error.statusText) ? error.statusText : error,
        stringcheck = (error_type == "string"),
        skcheck, // string key check
        cons = error.console;
    if (stringcheck === true) {
        var skcheck = ((error.indexOf("API calls limits have been reached") >= 0)); // blockcypher
    }
    var apikey = ((errorcode === 101) || // fixer
            (errorcode === 402) || // blockchair
            (errorcode === 403 || errorcode === 1) || // ethplorer => invalid or missing API key
            (errorcode === 1001) || // coinmarketcap => invalid API key
            (errorcode === 1002) || // coinmarketcap => missing API key
            (skcheck === true)),
        error_object = {
            "errorcode": errorcode,
            "errormessage": errormessage,
            "apikey": apikey,
            "console": cons
        };
    return error_object;
}

function api_src(thislist, api_data) {
    var api_url = api_data.url,
        api_name = (api_data.name) ? api_data.name : api_data.url;
    thislist.data("source", api_name).find(".api_source").html("<span class='src_txt' title='" + api_url + "'>source: " + api_name + "</span><span class='icon-wifi-off'></span><span class='icon-connection'></span>");
}

function api_callback(requestid, nocache) {
    var thislist = $("#" + requestid);
    if (thislist.hasClass("scan")) {
        thislist.removeClass("scan").addClass("pmstatloaded");
        if (nocache === true) {} else {
            var transactionlist = thislist.find(".transactionlist"),
                transactionli = transactionlist.find("li");
            if (transactionli.length) {
                transactionpush = [];
                transactionli.each(function() {
                    var thisnode = $(this),
                        thisdata = thisnode.data(),
                        historic = thisdata.historic,
                        conf = thisdata.confirmations,
                        setconfirmations = thisdata.setconfirmations;
                    transactionpush.push(thisdata);
                    if (!historic || $.isEmptyObject(historic)) {} else {
                        var h_string = historic_data_title(thisdata.ccsymbol, thisdata.ccval, historic, setconfirmations, conf, false);
                        thisnode.append(hs_for(h_string)).attr("title", h_string);
                    }
                });
                var statuspanel = thislist.find(".pmetastatus"),
                    statusbox = {
                        "requestid": requestid,
                        "status": statuspanel.attr("data-count"),
                        "transactions": transactionpush
                    };
                statuspush.push(statusbox);
            }
            else {
	            var statusbox = {
                        "requestid": requestid,
                        "status": 0,
                        "transactions": []
                    };
                statuspush.push(statusbox);
            }
        }
        get_requeststates("loop");
    }
}

function tx_api_fail(thislist, statuspanel) {
    thislist.addClass("no_network");
    statuspanel.attr("data-count", 0).text("?");
}

function api_eror_msg(apisrc, error) {
    if (error.console) {
        console.log(error);
        return false;
    }
    if ($("#dialogbody .doselect").length) {
        return
    }
    var error_dat = (error) ? error : {
            "errormessage": "errormessage",
            "errorcode": "errorcode"
        },
        errormessage = error_dat.errormessage,
        errorcode = error_dat.errorcode,
        keyfail = (error.apikey === true);
    var api_bttn = (keyfail === true) ? "<div id='add_api' data-api='" + apisrc + "' class='button'>Add " + apisrc + " Api key</div>" : "",
        content = "<h2 class='icon-blocked'>Error " + errorcode + "</h2><p class='doselect'><strong>Error: " + errorcode + " " + errormessage + "<br/><br/><span id='proxy_dialog' class='ref'>Try other proxy</span></p>" + api_bttn;
    popdialog(content, "alert", "canceldialog");
}

function tx_count(statuspanel, count) {
    statuspanel.attr("data-count", count).text("+ " + count);
}

function get_rpc_inputs_init(rd, api_data) {
    rpc_attempts[rd.requestid + api_data.url] = null; // reset api attempts
    get_rpc_inputs(rd, api_data);
}

function get_rpc_inputs(rd, api_data) {
    var requestid = rd.requestid,
        thislist = $("#" + requestid);
    if (thislist.hasClass("scan")) {
        rpc_attempts[requestid + api_data.url] = true;
        var payment = rd.payment,
            pending = rd.pending,
            address = rd.address,
            requestdate = (rd.inout == "incoming") ? rd.timestamp : rd.requestdate,
            request_timestamp = requestdate - 30000, // 30 seconds compensation for unexpected results
            ccsymbol = rd.currencysymbol,
            getconfirmations = rd.set_confirmations,
            getconfint = (getconfirmations) ? parseInt(getconfirmations) : 1,
            setconfirmations = (getconfint) ? getconfint : 1, // set minimum confirmations to 1
            statuspanel = thislist.find(".pmetastatus"),
            transactionlist = thislist.find("ul.transactionlist"),
            transactionhash = rd.txhash,
            counter = 0,
            url = api_data.url,
            rpcurl = get_rpc_url(api_data), // (bitrequest_settings.js)
            erc20 = (rd.erc20 === true);
        thislist.removeClass("no_network");
        if (pending == "no" || pending == "incoming" || thislist.hasClass("expired")) {
            transactionlist.find("li").each(function() {
                tx_list.push($(this).data("txhash"));
            });
            api_callback(requestid, true);
            return
        }
        if (pending == "scanning" || pending == "polling") {
            transactionlist.html("");
            if (payment == "bitcoin" || payment == "litecoin" || payment == "dogecoin" || payment == "bitcoin-cash") {
                if (pending == "scanning") { // scan incoming transactions on address
                    handle_rpc_fails_list(rd, false, api_data, payment); // use api because rpc does not scan external addresses unfortunately
                    return
                }
                api_proxy({
                    "api": "bitcoin_rpc",
                    "search": null,
                    "cachetime": 25,
                    "cachefolder": "1h",
                    "api_url": rpcurl,
                    "params": {
                        "method": "POST",
                        "data": JSON.stringify({
                            "method": "getrawtransaction",
                            "params": [transactionhash, true]
                        }),
                        "headers": {
                            "Content-Type": "text/plain"
                        }
                    }
                }).done(function(e) {
                    var data = br_result(e).result;
                    if (data.error) {
                        tx_api_fail(thislist, statuspanel);
                        handle_rpc_fails_list(rd, data.error, api_data, payment);
                    } else {
                        if (data.result) {
                            var txd = bitcoin_rpc_data(data.result, setconfirmations, ccsymbol, address);
                            if (txd.ccval) {
                                var tx_listitem = append_tx_li(txd, thislist);
                                if (tx_listitem) {
                                    transactionlist.append(tx_listitem.data(txd));
                                }
                                tx_count(statuspanel, 1);
                                compareamounts(rd);
                            }
                        }
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    tx_api_fail(thislist, statuspanel);
                    var error_object = (errorThrown) ? errorThrown : jqXHR;
                    handle_rpc_fails_list(rd, error_object, api_data, payment);
                }).always(function() {
                    api_src(thislist, api_data);
                });
                return
            }
            if (payment == "ethereum" || erc20 === true) {
                if (pending == "scanning") { // scan incoming transactions on address
                    handle_rpc_fails_list(rd, false, api_data, payment); // use api instead
                    return
                }
                var set_url = (rpcurl) ? rpcurl : main_eth_node;
                api_proxy(eth_params(set_url, 25, "eth_blockNumber", [])).done(function(a) {
                    var r_1 = inf_result(a);
                    if (r_1) {
                        api_proxy(eth_params(set_url, 25, "eth_getTransactionByHash", [transactionhash])).done(function(b) {
                            var r_2 = inf_result(b);
                            if (r_2) {
                                var this_bn = r_2.blockNumber;
                                api_proxy(eth_params(set_url, 25, "eth_getBlockByNumber", [this_bn, false])).done(function(c) {
                                    var r_3 = inf_result(c);
                                    if (r_3) {
                                        var tbn = Number(this_bn),
                                            cbn = Number(r_1),
                                            conf = cbn - tbn,
                                            conf_correct = (conf < 0) ? 0 : conf,
                                            txd;
                                        if (erc20 === true) {
                                            var input = r_2.input,
                                                address_upper = address.slice(3).toUpperCase(),
                                                input_upper = input.toUpperCase();
                                            if (input_upper.indexOf(address_upper) >= 0) {
                                                var signature_hex = input.slice(2, 10),
                                                    address_hex = input.slice(10, 74),
                                                    amount_hex = input.slice(74, input.length),
                                                    tokenValue = hexToNumberString(amount_hex),
                                                    txdata = {
                                                        "timestamp": r_3.timestamp,
                                                        "hash": transactionhash,
                                                        "confirmations": conf_correct,
                                                        "value": tokenValue,
                                                        "decimals": rd.decimals
                                                    },
                                                    txd = infura_erc20_poll_data(txdata, setconfirmations, ccsymbol);
                                            } else {
                                                tx_api_fail(thislist, statuspanel);
                                                handle_rpc_fails_list(rd, inf_err(set_url), api_data, payment);
                                                return
                                            }
                                        } else {
                                            var txdata = {
                                                    "timestamp": Number(r_3.timestamp),
                                                    "hash": transactionhash,
                                                    "confirmations": conf_correct,
                                                    "value": Number(r_2.value)
                                                },
                                                txd = infura_eth_poll_data(txdata, setconfirmations, ccsymbol);
                                        }
                                        if (txd.ccval) {
                                            var tx_listitem = append_tx_li(txd, thislist);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                            }
                                            tx_count(statuspanel, 1);
                                            compareamounts(rd);
                                            return
                                        }
                                    }
                                    tx_api_fail(thislist, statuspanel);
                                    handle_rpc_fails_list(rd, inf_err(set_url), api_data, payment);
                                }).fail(function(jqXHR, textStatus, errorThrown) {
                                    tx_api_fail(thislist, statuspanel);
                                    handle_rpc_fails_list(rd, errorThrown, api_data, payment);
                                });
                                return
                            }
                            tx_api_fail(thislist, statuspanel);
                            handle_rpc_fails_list(rd, inf_err(set_url), api_data, payment);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            handle_rpc_fails_list(rd, errorThrown, api_data, payment);
                        });
                        return
                    }
                    tx_api_fail(thislist, statuspanel);
                    handle_rpc_fails_list(rd, inf_err(set_url), api_data, payment);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    tx_api_fail(thislist, statuspanel);
                    handle_rpc_fails_list(rd, errorThrown, api_data, payment);
                }).always(function() {
                    api_src(thislist, api_data);
                });
                return
            }
            if (payment == "nano") {
                if (pending == "scanning") { // scan incoming transactions on address
                    api_proxy({
                        "api": "nano",
                        "search": "account",
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "custom": "nano_txd",
                        "api_url": api_data.url,
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
                            if ($.isEmptyObject(nano_data)) {
                                tx_api_fail(thislist, statuspanel);
                                handle_rpc_fails_list(rd, {
                                    "error": "nano node offline",
                                    "console": true
                                }, api_data, payment);
                            } else {
                                var pending_array_node = (nano_data[0]) ? nano_data[0].pending : [],
                                    pending_array = $.isEmptyObject(pending_array_node) ? [] : pending_array_node,
                                    history_array_node = (nano_data[1]) ? nano_data[1].history : [],
                                    history_array = $.isEmptyObject(history_array_node) ? [] : history_array_node,
                                    merged_array = pending_array.concat(history_array).sort(function(x, y) { // merge and sort arrays
                                        return y.local_timestamp - x.local_timestamp;
                                    });
                                $.each(merged_array, function(data, value) {
                                    var txd = nano_scan_data(value, setconfirmations, ccsymbol);
                                    if ((txd.transactiontime > request_timestamp) && txd.ccval && (value.type === undefined || value.type == "receive")) {
                                        var tx_listitem = append_tx_li(txd, thislist);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            counter++;
                                        }
                                    }
                                });
                                tx_count(statuspanel, counter);
                                compareamounts(rd);
                            }
                        } else {
                            tx_api_fail(thislist, statuspanel);
                            handle_rpc_fails_list(rd, {
                                "error": "No results found",
                                "console": true
                            }, api_data, payment);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_rpc_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, api_data);
                    });
                    return
                }
                if (pending == "polling") {
                    api_proxy({
                        "api": "nano",
                        "search": "block",
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "api_url": api_data.url,
                        "params": {
                            "method": "POST",
                            "cache": true,
                            "data": JSON.stringify({
                                "action": "block_info",
                                "json_block": true,
                                "hash": transactionhash
                            })
                        }
                    }).done(function(e) {
                        var data = br_result(e).result;
                        if (data) {
                            if (data.error) {
                                tx_api_fail(thislist, statuspanel);
                                handle_rpc_fails_list(rd, data.error, api_data, payment);
                            } else {
                                var txd = nano_scan_data(data, setconfirmations, ccsymbol, transactionhash);
                                if (txd.ccval) {
                                    var tx_listitem = append_tx_li(txd, thislist);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(txd));
                                    }
                                    tx_count(statuspanel, 1);
                                    compareamounts(rd);
                                }
                            }
                        } else {
                            tx_api_fail(thislist, statuspanel);
                            handle_rpc_fails_list(rd, {
                                "error": "No results found",
                                "console": true
                            }, api_data, payment);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        var error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_rpc_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, api_data);
                    });
                }
                return
            }
            get_api_inputs_defaults(rd, rpc_data);
        }
    }
}

function inf_result(r) {
    var ir1 = br_result(r);
    if (ir1) {
        var ir2 = ir1.result;
        if (ir2) {
            return ir2.result;
        }
    }
    return false;
}

function inf_err(set_url) {
    return "error fetching data from " + set_url;
}

function eth_params(set_url, cachetime, method, params) {
    var payload = {
        "cachetime": cachetime,
        "cachefolder": "1h",
        "params": {
            "method": "POST",
            "data": JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": method,
                "params": params
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        }
    }
    if (set_url == main_eth_node) {
        $.extend(payload, {
            "api": "infura"
        });
    } else {
        $.extend(payload, {
            "api_url": set_url
        });
    }
    return payload;
}

// RPC error handling

function handle_rpc_fails_list(rd, error, rpc_data, thispayment) {
    var api_url = rpc_data.url,
        requestid = rd.requestid,
        nextrpc = get_next_rpc(thispayment, api_url, requestid);
    if (nextrpc === false) {
        var api_name = rpc_data.name,
            nextapi = get_next_api(thispayment, api_name, requestid);
        if (nextapi === false) { // try next api
            var rpc_id = (api_name) ? api_name : (api_url) ? api_url : "unknown",
                error_data = (error === false) ? false : get_api_error_data(error);
            api_eror_msg(rpc_id, error_data);
            api_callback(requestid, true);
            return
        }
    }
    if (nextrpc) {
        get_rpc_inputs(rd, nextrpc);
    } else if (nextapi) {
        get_api_inputs(rd, nextapi, nextapi.name);
    }
}

function get_next_rpc(this_payment, api_url, requestid) {
    var rpc_settings_li = $("#" + this_payment + "_settings .cc_settinglist li[data-id='apis']");
    if (rpc_settings_li) {
        var rpc_settings = rpc_settings_li.data(),
            apilist = rpc_settings.apis,
            rpclist = rpc_settings.options,
            apirpc = $.grep(apilist, function(filter) {
                return !filter.api;
            }),
            restlist = (apirpc && rpclist) ? $.merge(apirpc, rpclist) : apirpc;
        if (!$.isEmptyObject(restlist)) {
            var next_scan = restlist[restlist.findIndex(option => option.url == api_url) + 1],
                next_rpc = (next_scan) ? next_scan : restlist[0],
                rqid = (requestid) ? requestid : "";
            if (rpc_attempts[rqid + next_rpc.url] !== true) {
                return next_rpc;
            }
        }
    }
    return false;
}

function append_tx_li(txd, this_request, ln) {
    var txhash = txd.txhash;
    if (txhash) {
        var ccval = txd.ccval,
            ccval_rounded = trimdecimals(ccval, 6),
            transactiontime = txd.transactiontime,
            conf = txd.confirmations,
            setconfirmations = txd.setconfirmations,
            ccsymbol = txd.ccsymbol,
            set_ccsymbol = (ccsymbol) ? ccsymbol.toUpperCase() : "",
            lnstr = (ln) ? " <span class='icon-power'></span>" : "",
            valstr = (ln && !conf) ? "" : ccval_rounded + " " + set_ccsymbol + lnstr,
            date_format = (transactiontime) ? short_date(transactiontime) : "",
            confirmed = (conf && conf >= setconfirmations),
            conftitle = (conf === false) ? "Confirmed transaction" : conf + " / " + setconfirmations + " confirmations",
            checked_span = "<span class='icon-checkmark' title='" + conftitle + "'></span>",
            confspan = (conf) ? (confirmed) ? checked_span :
            "<div class='txli_conf' title='" + conftitle + "'><div class='confbar'></div><span>" + conftitle + "</span></div>" :
            (conf === false) ? checked_span :
            "<div class='txli_conf' title='Unconfirmed transaction'><div class='confbar'></div><span>Unconfirmed</span></div>",
            tx_listitem = $("<li><div class='txli_content'>" + date_format + confspan + "<div class='txli_conf txl_canceled'><span class='icon-blocked'></span>Canceled</div><span class='tx_val'> + " + valstr + " <span class='icon-eye show_tx' title='view on blockexplorer'></span></span></div></li>"),
            historic = txd.historic;
        if (historic) {
            var h_string = historic_data_title(ccsymbol, ccval, historic, setconfirmations, conf, true);
            tx_listitem.append(hs_for(h_string)).attr("title", h_string);
        }
        if (this_request === false) {
            return tx_listitem;
        }
        var tx_dat = this_request.data();
        if (tx_dat.xmr_ia) { // xmr integrated adddresses are unique
            return tx_listitem;
        }
        if ($.inArray(txhash, tx_list) !== -1) { // check for indexed transaction id's
            if (tx_dat.requesttype == "outgoing") {
                return null;
            }
            return tx_listitem;
        }
        tx_list.push(txhash);
        return tx_listitem;
    }
    return null;
}

function hs_for(dat) {
    return "<div class='historic_meta'>" + dat.split("\n").join("<br/>") + "</div>";
}

function historic_data_title(ccsymbol, ccval, historic, setconfirmations, conf, fromcache) {
    var timestamp = historic.timestamp,
        price = historic.price;
    if (timestamp && price) {
        var fiatsrc = historic.fiatapisrc,
            src = historic.apisrc,
            lcsymbol = historic.lcsymbol,
            lc_eur_rate = historic.lcrate,
            usd_eur_rate = historic.usdrate,
            fetched = historic.fetched,
            lc_usd_rate = 1 / (lc_eur_rate / usd_eur_rate),
            lc_ccrate = price / lc_usd_rate,
            lc_val = ccval * lc_ccrate,
            cc_upper = (ccsymbol) ? ccsymbol.toUpperCase() : ccsymbol,
            lc_upper = (lcsymbol) ? lcsymbol.toUpperCase() : lcsymbol,
            localrate = (lc_upper == "USD") ? "" : cc_upper + "-" + lc_upper + ": " + lc_ccrate.toFixed(6) + "\n" + lc_upper + "-USD: " + lc_usd_rate.toFixed(2),
            conf_var = (conf === false) ? "Confirmed" : (conf && setconfirmations) ? conf + "/" + setconfirmations : "",
            cf_info = "\nConfirmations: " + conf_var;
        return "Historic data (" + fulldateformat(new Date((timestamp - timezone)), "en-us") + "):\nFiatvalue: " + lc_val.toFixed(2) + " " + lc_upper + "\n" + cc_upper + "-USD: " + price.toFixed(6) + "\n" + localrate + "\nSource: " + fiatsrc + "/" + src + cf_info;
    } else {
        var resp = "Failed to get historical " + ccsymbol + " price data";
        notify(resp);
        return resp;
    }
}

function compareamounts(rd) {
    var thisrequestid = rd.requestid,
        thisamount = parseFloat(rd.amount),
        requestdate = rd.requestdate,
        iscrypto = rd.iscrypto,
        thispayment = rd.payment,
        ccsymbol = rd.currencysymbol,
        pendingstatus = rd.pending,
        getconfirmations = rd.set_confirmations,
        getconfint = (getconfirmations) ? parseInt(getconfirmations) : 1,
        setconfirmations = (getconfint) ? getconfint : 1, // set minimum confirmations to 1
        requestli = $("#" + thisrequestid),
        firstlist = requestli.find(".transactionlist li:first"),
        lastlist = requestli.find(".transactionlist li:last"),
        latestinput = firstlist.data("transactiontime"),
        firstinput = lastlist.data("transactiontime");
    if (latestinput) {
        if (iscrypto) {
            var thissum_cc = 0,
                txhash_cc,
                paymenttimestamp_cc,
                confirmations_cc = 0,
                status_cc = "pending",
                pending_cc = pendingstatus,
                confirmed_cc = false,
                tx_counter = 0,
                margin = 0.95;
            $(requestli.find(".transactionlist li").get().reverse()).each(function(i) {
                tx_counter++;
                var thisnode = $(this),
                    tn_dat = thisnode.data();
                confirmations_cc = tn_dat.confirmations,
                    paymenttimestamp_cc = tn_dat.transactiontime,
                    txhash_cc = tn_dat.txhash,
                    thissum_cc += parseFloat(tn_dat.ccval) || 0; // sum of outputs
                if (confirmations_cc >= setconfirmations || rd.no_conf === true || confirmations_cc === false) { // check all confirmations + whitelist for currencies unable to fetch confirmation
                    confirmed_cc = true;
                    if (thissum_cc >= thisamount * margin) { // compensation for small fluctuations in rounding amount
                        status_cc = "paid",
                            pending_cc = "no";
                        thisnode.addClass("exceed").nextAll().addClass("exceed");
                        return
                    }
                } else {
                    confirmed_cc = false;
                }
                var confbar = thisnode.find(".confbar");
                if (confbar.length > 0) {
                    confbar.each(function(i) {
                        animate_confbar($(this), i);
                    });
                };
            });
            if (thissum_cc >= thisamount * margin) { // compensation for small fluctuations in rounding amount
                if (confirmed_cc === false) { // check confirmations outside the loop
                    status_cc = "pending",
                        pending_cc = (tx_counter === 1) ? "polling" : pendingstatus; // switch to tx polling if there's only one transaction
                }
            } else {
                status_cc = "insufficient",
                    pending_cc = "scanning";
            }
            updaterequest({
                "requestid": thisrequestid,
                "status": status_cc,
                "receivedamount": thissum_cc,
                "paymenttimestamp": paymenttimestamp_cc,
                "txhash": txhash_cc,
                "confirmations": confirmations_cc,
                "pending": pending_cc,
                "lightning": rd.lightning
            }, false);
            api_callback(thisrequestid);
            return
        }
        var latestconf = (rd.no_conf === true) ? 0 : firstlist.data("confirmations"), // only update on change
            hc_prefix = "bitrequest_historic_" + thisrequestid,
            historiccache = sessionStorage.getItem(hc_prefix),
            cacheval = latestinput + latestconf;
        if (cacheval != historiccache) { //new input detected; call historic api
            sessionStorage.removeItem(hc_prefix); // remove historic price cache
            var historic_payload = $.extend(rd, {
                "latestinput": latestinput,
                "latestconf": latestconf,
                "firstinput": firstinput
            });
            var apilist = "historic_fiat_price_apis",
                fiatapi = $("#fiatapisettings").data("selected"),
                fiatapi_default = (fiatapi == "coingecko" || fiatapi == "coinbase") ? "fixer" : fiatapi; // exclude coingecko api"
            api_attempt[apilist] = {}; // reset global historic fiat price api attempt
            get_historical_fiat_data(historic_payload, apilist, fiatapi_default);
            return
        }
    }
    api_callback(thisrequestid);
}

// get historic crypto rates

function get_historical_fiat_data(rd, apilist, fiatapi) {
    api_attempt[apilist][fiatapi] = true;
    var thisrequestid = rd.requestid,
        fiatcurrency = rd.fiatcurrency;
    if (fiatcurrency) {
        var lcsymbol = fiatcurrency.toUpperCase(),
            payload = get_historic_fiatprice_api_payload(fiatapi, lcsymbol, rd.latestinput);
        api_proxy({
            "api": fiatapi,
            "search": payload,
            "cachetime": 86400,
            "cachefolder": "1d",
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            var data = br_result(e).result;
            if (data) {
                if (data.error) {
                    var next_historic = try_next_api(apilist, fiatapi);
                    if (next_historic) {
                        get_historical_fiat_data(rd, apilist, next_historic);
                        return
                    }
                    fail_dialogs(fiatapi, data.error);
                    api_callback(thisrequestid);
                    return
                }
                var usdrate,
                    lcrate,
                    get_lcrate;
                if (fiatapi == "currencylayer") {
                    var rates = data.quotes,
                        usdrate = 1 / rates["USDEUR"],
                        get_lcrate = rates["USD" + lcsymbol] * usdrate;
                } else {
                    var rates = data.rates,
                        usdrate = rates["USD"],
                        get_lcrate = rates[lcsymbol];
                }
                var lcrate = (lcsymbol == "EUR") ? 1 : get_lcrate;
                if (lcrate === undefined || usdrate === undefined) {
                    var next_historic = try_next_api(apilist, fiatapi);
                    if (next_historic) {
                        get_historical_fiat_data(rd, apilist, next_historic);
                        return
                    }
                    fail_dialogs(fiatapi, "unable to fetch " + lcsymbol + " exchange rate");
                    api_callback(thisrequestid);
                    return
                }
                var historic_api = $("#cmcapisettings").data("selected"),
                    picked_historic_api = (historic_api == "coinmarketcap") ? "coingecko" : historic_api, // default to "coingecko api"
                    init_apilist = "historic_crypto_price_apis";
                api_attempt[init_apilist] = {};
                get_historical_crypto_data(rd, fiatapi, init_apilist, picked_historic_api, lcrate, usdrate, lcsymbol);
                return
            }
            fail_dialogs(fiatapi, "unable to fetch " + lcsymbol + " exchange rate");
            api_callback(thisrequestid);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var next_historic = try_next_api(apilist, fiatapi);
            if (next_historic) {
                get_historical_fiat_data(rd, apilist, next_historic);
                return
            }
            var error_object = (errorThrown) ? errorThrown : jqXHR;
            fail_dialogs(fiatapi, error_object);
            api_callback(thisrequestid);
        });
        return
    }
    api_callback(thisrequestid);
}

function get_historic_fiatprice_api_payload(fiatapi, lcsymbol, latestinput) {
    var dateformat = form_date(latestinput),
        payload = (fiatapi == "fixer") ? dateformat + "?symbols=" + lcsymbol + ",USD" :
        (fiatapi == "currencylayer") ? "historical?date=" + dateformat :
        dateformat + "?base=EUR"; // <- exchangeratesapi
    return payload;
}

function form_date(latestinput) {
    var dateobject = new Date(parseFloat(latestinput)),
        getmonth = dateobject.getUTCMonth() + 1,
        getday = dateobject.getUTCDate(),
        year = dateobject.getUTCFullYear(),
        month = (getmonth < 10) ? "0" + getmonth : getmonth,
        day = (getday < 10) ? "0" + getday : getday;
    return year + "-" + month + "-" + day;
}

function get_historical_crypto_data(rd, fiatapi, apilist, api, lcrate, usdrate, lcsymbol) {
    api_attempt[apilist][api] = true;
    var thisrequestid = rd.requestid,
        thispayment = rd.payment,
        ccsymbol = rd.currencysymbol,
        latestinput = rd.latestinput,
        firstinput = rd.firstinput,
        coin_id = (api == "coincodex") ? ccsymbol : // coincodex id
        (api == "coingecko") ? thispayment : // coingecko id
        ccsymbol + "-" + thispayment, // coinpaprika id
        starttimesec = (firstinput - timezone) / 1000,
        endtimesec = (latestinput - timezone) / 1000,
        erc20_contract = rd.token_contract,
        history_api = api,
        search = (history_api == "coincodex") ? get_payload_historic_coincodex(coin_id, starttimesec, endtimesec) :
        (history_api == "coinmarketcap" || history_api == "coingecko") ? get_payload_historic_coingecko(coin_id, starttimesec, endtimesec, erc20_contract) :
        get_payload_historic_coinpaprika(coin_id, starttimesec, endtimesec);
    api_proxy({
        "api": api,
        "search": search,
        "cachetime": 86400,
        "cachefolder": "1d",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        var api_result = br_result(e).result,
            data = (api == "coingecko") ? (api_result) ? api_result.prices : null :
            (api == "coincodex") ? (api_result) ? api_result[ccsymbol.toUpperCase()] : null : api_result;
        if (data && !data.error) {
            var latestconf = rd.latestconf,
                thisamount = rd.amount,
                getconfirmations = rd.set_confirmations,
                getconfint = (getconfirmations) ? parseInt(getconfirmations) : 1,
                setconfirmations = (getconfint) ? getconfint : 1, // set minimum confirmations to 1
                pending = rd.pending,
                iserc20 = rd.erc20,
                requestli = $("#" + thisrequestid),
                receivedusd = 0,
                receivedcc = 0,
                txhash,
                lnd = rd.lightning,
                paymenttimestamp,
                conf = 0,
                status = "pending",
                confirmed = false,
                historicusdvalue = (thisamount / lcrate) * usdrate,
                tx_counter = 0,
                margin = (historicusdvalue < 2) ? 0.60 : 0.95; // be flexible with small amounts
            $(requestli.find(".transactionlist li").get().reverse()).each(function(i) {
                tx_counter++;
                var thisnode = $(this),
                    tn_dat = thisnode.data(),
                    thistimestamp = tn_dat.transactiontime,
                    thisvalue = tn_dat.ccval,
                    values = {
                        "fiatapisrc": fiatapi,
                        "apisrc": api,
                        "lcrate": lcrate,
                        "usdrate": usdrate,
                        "lcsymbol": lcsymbol
                    },
                    historic_object = compare_historic_prices(api, values, data, thistimestamp),
                    historic_price = historic_object.price;
                thisnode.data("historic", historic_object);
                conf = tn_dat.confirmations, // check confirmations
                    paymenttimestamp = tn_dat.transactiontime,
                    txhash = tn_dat.txhash,
                    receivedcc += parseFloat(thisvalue) || 0; // sum of outputs CC
                var thisusdsum = receivedusd += parseFloat(historic_price * thisvalue) || 0;
                if (historic_price && (conf >= setconfirmations || rd.no_conf === true || conf === false)) { // check all confirmations + whitelist for currencies unable to fetch confirmations
                    confirmed = true;
                    if (thisusdsum >= historicusdvalue * margin) { //minus 5% dollar for volatility compensation
                        status = "paid",
                            pending = "no";
                        thisnode.addClass("exceed").nextAll().addClass("exceed");
                        return
                    }
                } else {
                    confirmed = false;
                }
                var confbar = thisnode.find(".confbar");
                if (confbar.length > 0) {
                    confbar.each(function(i) {
                        animate_confbar($(this), i);
                    });
                };
            });
            if (receivedusd >= historicusdvalue * margin) { // check total incoming amount // minus 5% dollar for volatility compensation
                if (confirmed === false) { // check confirmations outside the loop
                    status = "pending",
                        pending = (tx_counter === 1) ? "polling" : pending; // switch to tx polling if there's only one transaction
                }
            } else {
                if (receivedusd === 0) {
                    // usdval was probably not fetched
                } else {
                    status = "insufficient";
                }
                pending = "scanning";
            }
            updaterequest({
                "requestid": thisrequestid,
                "status": status,
                "receivedamount": receivedcc,
                "fiatvalue": (receivedusd / usdrate) * lcrate,
                "paymenttimestamp": paymenttimestamp,
                "txhash": txhash,
                "confirmations": conf,
                "pending": pending,
                "lightning": lnd
            }, false);
            var cacheval = latestinput + latestconf;
            if (pending == "no") {} else {
                sessionStorage.setItem("bitrequest_historic_" + thisrequestid, cacheval); // 'cache' historic data
            }
            api_callback(thisrequestid);
            return;
        }
        var next_historic = try_next_api(apilist, api);
        if (next_historic) {
            get_historical_crypto_data(rd, fiatapi, apilist, next_historic, lcrate, usdrate, lcsymbol);
            return
        }
        fail_dialogs(api, "error retrieving historical price data");
        api_callback(thisrequestid);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var next_historic = try_next_api(apilist, api);
        if (next_historic) {
            get_historical_crypto_data(rd, fiatapi, apilist, next_historic, lcrate, usdrate, lcsymbol);
            return
        }
        var error_object = (errorThrown) ? errorThrown : jqXHR;
        fail_dialogs(api, error_object);
        api_callback(thisrequestid);
    })
}

function get_payload_historic_coingecko(coin_id, starttime, endtime, erc20_contract) {
    if (erc20_contract) {
        return "coins/ethereum/contract/" + erc20_contract + "/market_chart/range?vs_currency=usd&from=" + (starttime - 3600) + "&to=" + (endtime + 3600); // expand range with one hour for error margin
    }
    return "coins/" + coin_id + "/market_chart/range?vs_currency=usd&from=" + (starttime - 3600) + "&to=" + (endtime + 3600); // expand range with one hour for error margin
}

function get_payload_historic_coinpaprika(coin_id, starttime, endtime) {
    var ts_start = starttime - 36000,
        ts_end = endtime + 36000, // add ten hours flex both ways otherwise api can return empty result
        timespan = (ts_end - ts_start),
        // api limit = 1000 rows (default)
        // 3day = 259200 = max 864 rows (5 min interval)
        // 6day = 518400 = max 864 rows (10 min interval)
        // 9day = 777600 = max 864 rows (15 min interval)
        // 18day = 1555200 = max 864 rows (30 min interval)
        // 27day = 2332800 = max 864 rows (45 min interval)
        // 35day = 3024000 = max 864 rows (1 hour interval)
        // 72day = 6220800 = max 864 rows (2 hour interval) (max 2 months)
        interval = (timespan < 259200) ? "5m" : (timespan < 518400) ? "10m" : (timespan < 777600) ? "15m" : (timespan < 1555200) ? "30m" : (timespan < 2332800) ? "45m" : (timespan < 3024000) ? "1h" : "2h",
        cp_querystring = (starttime == endtime) ? starttime - 300 + "&limit=1" : ts_start + "&end=" + endtime + "&interval=" + interval; // query for one or multiple dates (-300 seconds for instant update)
    return coin_id + "/historical?start=" + cp_querystring;
}

function get_payload_historic_coincodex(coin_id, starttime, endtime) {
    var st_format = cx_date(starttime),
        et_format = cx_date(endtime),
        tquery = (starttime == endtime) ? st_format + "/" + st_format : st_format + "/" + et_format;
    return "get_coin_history/" + coin_id + "/" + tquery + "/" + 1000;
}

function cx_date(ts) {
    return new Date(ts * 1000).toISOString().split("T")[0];
}

function compare_historic_prices(api, values, price_array, thistimestamp) {
    $.each(price_array, function(i, value) {
        var historic_object = (api == "coincodex") ? get_historic_object_coincodex(value) :
            (api == "coingecko") ? get_historic_object_coingecko(value) :
            get_historic_object_coinpaprika(value);
        if (historic_object) {
            var historic_timestamp = historic_object.timestamp,
                historic_price = historic_object.price;
            if (historic_timestamp > thistimestamp) {
                values["timestamp"] = historic_timestamp,
                    values["price"] = historic_price,
                    values["fetched"] = true;
            }
        }
    });
    var fetched = values.fetched;
    if (fetched && fetched === true) {
        // check if historical prices are fetched succesfully, if true do nothing
    } else { // if no matching timestamp get latest
        var lastitem = price_array[price_array.length - 1],
            last_historic_object = (api == "coincodex") ? get_historic_object_coincodex(lastitem) :
            (api == "coingecko") ? get_historic_object_coingecko(lastitem) :
            get_historic_object_coinpaprika(lastitem);
        values.timestamp = last_historic_object.timestamp,
            values.price = last_historic_object.price,
            values.fetched = false;
    }
    return values;
}

function get_historic_object_coincodex(value) {
    return {
        "timestamp": ((value[0] * 1000) + timezone) + 60000, // add 1 minute for compensation margin
        "price": value[1]
    }
}

function get_historic_object_coingecko(value) {
    return {
        "timestamp": (value[0] + timezone) + 60000, // add 1 minute for compensation margin
        "price": value[1]
    }
}

function get_historic_object_coinpaprika(value) {
    if (value && value.timestamp) {
        return {
            "timestamp": to_ts(value.timestamp),
            "price": value.price
        }
    }
    return false;
}