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
    let gets = geturlparameters();
    if (gets.xss) {
        return
    }
    if (gets.p == "requests") { // only trigger on "requests page"
        setTimeout(function() {
            trigger_requeststates();
        }, 300);
    }
}

function trigger_requeststates(trigger) {
    if (offline === true || inframe === true) {
        return // do nothing when offline
    }
    api_attempts = {}, // reset cache and index
        rpc_attempts = {},
        tx_list = [], // reset transaction index
        statuspush = [];
    let active_requests = $("#requestlist .rqli").filter(function() {
        return $(this).data("pending") != "unknown";
    });
    active_requests.addClass("scan");
    get_requeststates(trigger);
}

function get_requeststates(trigger) {
    //requestincoming
    let request_data = $("#requestlist li.rqli.scan").first().data();
    if (request_data) {
        if (trigger == "loop") {
            getinputs(request_data);
            return;
        }
        let statuscache = br_get_session("txstatus", true);
        if (statuscache) {
            let cachetime = now() - statuscache.timestamp,
                requeststates = statuscache.requeststates;
            if (cachetime > 30000 || $.isEmptyObject(requeststates)) { //check if cached crypto rates are expired (check every 30 seconds on page refresh or when opening request page)
                br_remove_session("txstatus"); // remove cached transactions
                getinputs(request_data);
                return
            }
            if (trigger === true) {} else { // only update on page refresh
                // parse cached transaction data
                $.each(requeststates, function(i, value) {
                    let thislist = $("#" + value.requestid),
                        thisdata = thislist.data();
                    if (thisdata) {
                        let pendingstatus = thisdata.pending;
                        if (pendingstatus == "scanning" || pendingstatus == "polling") {
                            let statuspanel = thislist.find(".pmetastatus"),
                                transactionlist = thislist.find(".transactionlist");
                            statuspanel.text(value.status);
                            transactionlist.html("");
                            $.each(value.transactions, function(data, value) {
                                let tx_listitem = append_tx_li(value, false);
                                if (tx_listitem) {
                                    transactionlist.append(tx_listitem.data(value));
                                }
                            });
                            thislist.addClass("pmstatloaded");
                        }
                    }
                });
            }
            return
        }
        getinputs(request_data);
        return
    }
    if (!$.isEmptyObject(statuspush)) {
        let statusobject = {
            "timestamp": now(),
            "requeststates": statuspush
        };
        br_set_session("txstatus", statusobject, true);
        saverequests();
    }
}

function getinputs(rd) {
    let thislist = $("#" + rd.requestid),
        iserc20 = rd.erc20,
        api_info = check_api(rd.payment, iserc20),
        selected = api_info.data;
    thislist.removeClass("pmstatloaded");
    if (api_info.api === true) {
        choose_api_inputs(rd, selected);
        return
    }
    get_rpc_inputs_init(rd, selected);
}

function check_api(payment, iserc20) {
    let api_data = $("#" + payment + "_settings .cc_settinglist li[data-id='apis']").data();
    if (api_data) {
        let selected = api_data.selected;
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
    if (rd.erc20 === true) {
        get_api_inputs_init(rd, api_data, "ethplorer");
        return
    }
    let payment = rd.payment;
    if (payment == "bitcoin" || payment == "litecoin" || payment == "dogecoin" || payment == "ethereum") {
        get_api_inputs_init(rd, api_data, "blockcypher");
        return
    }
    get_api_inputs_init(rd, api_data, api_data.name);
}

function get_api_inputs_init(rd, api_data, api_name) {
    api_attempts[rd.requestid + api_name] = null; // reset api attempts
    get_api_inputs(rd, api_data, api_name);
}

function get_api_inputs(rd, api_data, api_name) {
    let requestid = rd.requestid,
        thislist = $("#" + requestid);
    if (thislist.hasClass("scan")) {
        api_attempts[requestid + api_name] = true;
        let payment = rd.payment,
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
            canceled = (rq_status == "canceled") ? true : false,
            rqtype = rd.requesttype;
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
                let metalist = thislist.find(".metalist"),
                    status_field = metalist.find(".status"),
                    p_arr = lnurl_deform(lnd.proxy_host),
                    proxy_host = p_arr.url,
                    pk = (lnd.pw) ? lnd.pw : p_arr.k,
                    pid = lnd.pid,
                    nid = lnd.nid,
                    imp = lnd.imp,
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
                        let error = r.error;
                        if (error) {
                            let message = (error) ? (error.message) ? error.message : (typeof error == "string") ? error : default_error : default_error;
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, {
                                "error": message,
                                "console": true
                            }, false, payment);
                            status_field.text(" " + message);
                        } else {
                            let inv_status = r.status;
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
                                        let inv_error = e.error;
                                        if (inv_error) {
                                            let err_message = (inv_error.message) ? inv_error.message : (typeof inv_error == "string") ? inv_error : default_error;
                                            tx_api_fail(thislist, statuspanel);
                                            handle_api_fails_list(rd, {
                                                "error": err_message,
                                                "console": true
                                            }, false, payment);
                                            status_field.text(" " + err_message);
                                        } else {
                                            let status = e.status;
                                            if (status) {
                                                lnd.invoice = e;
                                                status_field.text(" " + status);
                                                rd.lightning = lnd; // push invoice
                                                let txd = lnd_tx_data(e);
                                                if (txd.ccval) {
                                                    let tx_listitem = append_tx_li(txd, rqtype, true);
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
                                                        compareamounts(rd, true);
                                                    }
                                                }
                                            }
                                        }
                                    }).fail(function(jqXHR, textStatus, errorThrown) {
                                        tx_api_fail(thislist, statuspanel);
                                        let error_object = (errorThrown) ? errorThrown : jqXHR;
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
                        let version = r.version;
                        if (version != proxy_version) {
                            proxy_alert(version);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        let error_object = (errorThrown) ? errorThrown : jqXHR;
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
                    let invoice = lnd.invoice;
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
                                let status = e.status;
                                if (status) {
                                    lnd.invoice = e;
                                    status_field.text(" " + status);
                                    rd.lightning = lnd; // push invoice
                                    let txd = lnd_tx_data(e);
                                    if (txd.ccval) {
                                        let tx_listitem = append_tx_li(txd, rqtype, true);
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
                                            compareamounts(rd, true);
                                        }
                                    }
                                }
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                tx_api_fail(thislist, statuspanel);
                                let error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_api_fails_list(rd, error_object, false, payment);
                            }).always(function() {
                                api_src(thislist, {
                                    "name": "proxy"
                                });
                            });
                            return
                        }
                    }
                    handle_api_fails_list(rd, {
                        "error": "invoice not found",
                        "console": true
                    }, false, payment);
                    return
                }
            }
            if (payment == "monero") {
                let vk = rd.viewkey;
                if (vk) {
                    let account = (vk.account) ? vk.account : address,
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
                        "proxy": true,
                        "params": {
                            "method": "POST",
                            "data": payload,
                            "headers": {
                                "Content-Type": "application/json"
                            }
                        }
                    }).done(function(e) {
                        let data = br_result(e).result;
                        if (data.start_height > -1) { // success!
                            let pl = {
                                "address": account,
                                "view_key": viewkey
                            };
                            api_proxy({
                                "api": api_name,
                                "search": "get_address_txs",
                                "cachetime": 25,
                                "cachefolder": "1h",
                                "proxy": true,
                                "params": {
                                    "method": "POST",
                                    "data": JSON.stringify(pl),
                                    "headers": {
                                        "Content-Type": "application/json"
                                    }
                                }
                            }).done(function(e) {
                                let data = br_result(e).result,
                                    transactions = data.transactions;
                                if (transactions) {
                                    let txflip = transactions.reverse();
                                    $.each(txflip, function(dat, value) {
                                        let txd = xmr_scan_data(value, setconfirmations, "xmr", data.blockchain_height);
                                        if (txd) {
                                            let xid_match = match_xmr_pid(rd.xmr_ia, rd.payment_id, txd.payment_id); // match xmr payment_id if set
                                            if (xid_match === true) {
                                                if (pending == "polling") {
                                                    if (txd.txhash == transactionhash && txd.ccval) {
                                                        let tx_listitem = append_tx_li(txd, rqtype);
                                                        if (tx_listitem) {
                                                            transactionlist.append(tx_listitem.data(txd));
                                                            counter++;
                                                        }
                                                        return
                                                    }
                                                }
                                                if (pending == "scanning") {
                                                    if (txd.transactiontime > request_timestamp && txd.ccval) {
                                                        let tx_listitem = append_tx_li(txd, rqtype);
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
                                let error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_api_fails_list(rd, error_object, api_data, payment);
                            });
                            return
                        }
                        tx_api_fail(thislist, statuspanel);
                        let errormessage = data.Error,
                            error_object = (errormessage) ? errormessage : {
                                "error": "Unable to connect to mymonero api",
                                "console": true
                            };
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        let error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, {
                            "name": "mymonero api"
                        });
                    });
                }
                return
            }
            if (api_name == "mempool.space") {
                let endpoint = "https://" + api_data.url;
                api_proxy({ // get latest blockheight
                    "cachetime": 25,
                    "cachefolder": "1h",
                    "api_url": endpoint + "/api/blocks/tip/height",
                    "params": {
                        "method": "GET"
                    }
                }).done(function(lb) {
                    let latestblock = br_result(lb).result;
                    if (latestblock) {
                        setTimeout(function() {
                            if (pending == "scanning") { // scan incoming transactions on address
                                api_proxy({
                                    "cachetime": 25,
                                    "cachefolder": "1h",
                                    "api_url": endpoint + "/api/address/" + address + "/txs",
                                    "params": {
                                        "method": "GET"
                                    }
                                }).done(function(e) {
                                    let data = br_result(e).result;
                                    if (data) {
                                        if (br_issar(data)) {
                                            $.each(data, function(dat, value) {
                                                if (value.txid) { // filter outgoing transactions
                                                    let txd = mempoolspace_scan_data(value, setconfirmations, ccsymbol, address, latestblock);
                                                    if (txd.transactiontime > request_timestamp && txd.ccval) {
                                                        let tx_listitem = append_tx_li(txd, rqtype);
                                                        if (tx_listitem) {
                                                            transactionlist.append(tx_listitem.data(txd));
                                                            counter++;
                                                        }
                                                    }
                                                }
                                            });
                                            tx_count(statuspanel, counter);
                                            compareamounts(rd);
                                            return
                                        }
                                    }
                                    tx_api_fail(thislist, statuspanel);
                                    handle_api_fails_list(rd, "unknown error", api_data, payment);
                                }).fail(function(jqXHR, textStatus, errorThrown) {
                                    tx_api_fail(thislist, statuspanel);
                                    let error_object = (errorThrown) ? errorThrown : jqXHR;
                                    handle_api_fails_list(rd, error_object, api_data, payment);
                                });
                                return
                            }
                            if (pending == "polling") { // poll mempool.space transaction id
                                if (transactionhash) {
                                    api_proxy({
                                        "cachetime": 25,
                                        "cachefolder": "1h",
                                        "api_url": endpoint + "/api/tx/" + transactionhash,
                                        "params": {
                                            "method": "GET"
                                        }
                                    }).done(function(e) {
                                        let data = br_result(e).result;
                                        if (data) {
                                            let txd = mempoolspace_scan_data(data, setconfirmations, ccsymbol, address, latestblock);
                                            if (txd) {
                                                if (txd.ccval) {
                                                    let tx_listitem = append_tx_li(txd, rqtype);
                                                    if (tx_listitem) {
                                                        transactionlist.append(tx_listitem.data(txd));
                                                        tx_count(statuspanel, 1);
                                                        compareamounts(rd);
                                                    }
                                                }
                                            }
                                            return
                                        }
                                        tx_api_fail(thislist, statuspanel);
                                        handle_api_fails_list(rd, "unknown error", api_data, payment);
                                    }).fail(function(jqXHR, textStatus, errorThrown) {
                                        tx_api_fail(thislist, statuspanel);
                                        let error_object = (errorThrown) ? errorThrown : jqXHR;
                                        handle_api_fails_list(rd, error_object, api_data, payment);
                                    });
                                }
                            }
                        }, 500);
                        return
                    }
                    tx_api_fail(thislist, statuspanel);
                    handle_api_fails_list(rd, "unknown error", api_data, payment);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    tx_api_fail(thislist, statuspanel);
                    let error_object = (errorThrown) ? errorThrown : jqXHR;
                    handle_api_fails_list(rd, error_object, api_data, payment);
                }).always(function() {
                    api_src(thislist, api_data);
                });
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
                        let data = br_result(e).result;
                        if (data) {
                            if (data.error) {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, data.error, api_data, payment);
                            } else {
                                if (payment == "ethereum") {
                                    $.each(data.txrefs, function(dat, value) {
                                        let txd = blockcypher_scan_data(value, setconfirmations, ccsymbol, payment);
                                        if (txd.transactiontime > request_timestamp && txd.ccval) {
                                            let tx_listitem = append_tx_li(txd, rqtype);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                                counter++;
                                            }
                                        }
                                    });
                                } else {
                                    let conf_tx = data.txrefs,
                                        unconf_tx = data.unconfirmed_txrefs,
                                        all_tx = (unconf_tx && conf_tx) ? unconf_tx.concat(conf_tx) : conf_tx;
                                    if (all_tx) {
                                        $.each(all_tx, function(dat, value) {
                                            if (value.spent !== undefined) { // filter outgoing transactions
                                                let txd = blockcypher_scan_data(value, setconfirmations, ccsymbol, payment);
                                                if (txd.transactiontime > request_timestamp && txd.ccval) {
                                                    let tx_listitem = append_tx_li(txd, rqtype);
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
                            return
                        }
                        tx_api_fail(thislist, statuspanel);
                        handle_api_fails_list(rd, "unknown error", api_data, payment);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        let error_object = (errorThrown) ? errorThrown : jqXHR;
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
                            let data = br_result(e).result;
                            if (data) {
                                if (data.error) {
                                    tx_api_fail(thislist, statuspanel);
                                    handle_api_fails_list(rd, data.error, api_data, payment);
                                } else {
                                    let txd = blockcypher_poll_data(data, setconfirmations, ccsymbol, address);
                                    if (txd.ccval) {
                                        let tx_listitem = append_tx_li(txd, rqtype);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            tx_count(statuspanel, 1);
                                            compareamounts(rd);
                                        }
                                    }
                                }
                                return
                            }
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            let error_object = (errorThrown) ? errorThrown : jqXHR;
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
                        let data = br_result(e).result;
                        if (data) {
                            if (data.error) {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, data.error, api_data, payment);
                            } else {
                                $.each(data.operations, function(dat, value) {
                                    let txd = ethplorer_scan_data(value, setconfirmations, ccsymbol),
                                        rt_compensate = (rd.inout == "local" && rd.status == "insufficient") ? request_timestamp - 30000 : request_timestamp; // substract extra 30 seconds (extra compensation)
                                    if ((str_match(value.to, address) === true) && (txd.transactiontime > rt_compensate) && txd.ccval) {
                                        let tx_listitem = append_tx_li(txd, rqtype);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            counter++;
                                        }
                                    }
                                });
                                tx_count(statuspanel, counter);
                                compareamounts(rd);
                            }
                            return
                        }
                        tx_api_fail(thislist, statuspanel);
                        handle_api_fails_list(rd, "unknown error", api_data, payment);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        let error_object = (errorThrown) ? errorThrown : jqXHR;
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
                            let data = br_result(e).result;
                            if (data) {
                                if (data.error) {
                                    tx_api_fail(thislist, statuspanel);
                                    handle_api_fails_list(rd, data.error, api_data, payment);
                                } else {
                                    let input = data.input,
                                        amount_hex = input.slice(74, input.length),
                                        tokenValue = hexToNumberString(amount_hex),
                                        conf_correct = (data.confirmations < 0) ? 0 : data.confirmations,
                                        txdata = {
                                            "timestamp": data.timestamp,
                                            "hash": transactionhash,
                                            "confirmations": conf_correct,
                                            "value": tokenValue,
                                            "decimals": rd.decimals
                                        },
                                        txd = infura_erc20_poll_data(txdata, setconfirmations, ccsymbol);
                                    if (txd.ccval) {
                                        let tx_listitem = append_tx_li(txd, rqtype);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            tx_count(statuspanel, 1);
                                            compareamounts(rd);
                                        }
                                    }
                                }
                                return
                            }
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            let error_object = (errorThrown) ? errorThrown : jqXHR;
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
                    let scan_url = (erc20 === true) ? "ethereum/erc-20/" + rd.token_contract + "/dashboards/address/" + address : payment + "/dashboards/address/" + address;
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
                        if (data) {
                            if (data.error) {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, data.error, api_data, payment);
                            } else {
                                let context = data.context;
                                if (context.error) {
                                    tx_api_fail(thislist, statuspanel);
                                    handle_api_fails_list(rd, context.error, api_data, payment);
                                } else {
                                    let latestblock = context.state;
                                    if (erc20 === true) {
                                        $.each(data.data, function(dat, value) {
                                            $.each(value.transactions, function(dt, val) {
                                                let txd = blockchair_erc20_scan_data(val, setconfirmations, ccsymbol, latestblock);
                                                if ((txd.transactiontime > request_timestamp) && (str_match(txd.recipient, address) === true) && (str_match(txd.token_symbol, ccsymbol) === true) && txd.ccval) {
                                                    let tx_listitem = append_tx_li(txd, rqtype);
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
                                                    let txd = blockchair_eth_scan_data(val, setconfirmations, ccsymbol, latestblock);
                                                    if ((txd.transactiontime > request_timestamp) && (str_match(txd.recipient, address) === true) && txd.ccval) {
                                                        let tx_listitem = append_tx_li(txd, rqtype);
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
                                            let txarray = data.data[address].transactions; // get transactions
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
                                                    let dat = br_result(e).result;
                                                    $.each(dat.data, function(dt, val) {
                                                        let txd = blockchair_scan_data(val, setconfirmations, ccsymbol, address, latestblock);
                                                        if (txd.transactiontime > request_timestamp && txd.ccval) { // get all transactions after requestdate
                                                            let tx_listitem = append_tx_li(txd, rqtype);
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
                                                    let error_object = (errorThrown) ? errorThrown : jqXHR;
                                                    handle_api_fails_list(rd, error_object, api_data, payment);
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                            return
                        }
                        tx_api_fail(thislist, statuspanel);
                        handle_api_fails_list(rd, "unknown error", api_data, payment);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        let error_object = (errorThrown) ? errorThrown : jqXHR;
                        handle_api_fails_list(rd, error_object, api_data, payment);
                    }).always(function() {
                        api_src(thislist, api_data);
                    });
                }
                if (pending == "polling") { // poll transaction id
                    if (transactionhash) {
                        let poll_url = (erc20 === true) ? "ethereum/dashboards/transaction/" + transactionhash + "?erc_20=true" : payment + "/dashboards/transaction/" + transactionhash;
                        api_proxy({
                            "api": api_name,
                            "search": poll_url,
                            "cachetime": 25,
                            "cachefolder": "1h",
                            "params": {
                                "method": "GET"
                            }
                        }).done(function(e) {
                            let data = br_result(e).result;
                            if (data) {
                                let context = data.context;
                                if (context) {
                                    if (context.error) {
                                        tx_api_fail(thislist, statuspanel);
                                        handle_api_fails_list(rd, context.error, api_data, payment);
                                        return
                                    } else {
                                        let latestblock = context.state;
                                        if (latestblock) {
                                            let trxs = q_obj(data, "data." + transactionhash);
                                            if (trxs) {
                                                let txd = (erc20 === true) ? blockchair_erc20_poll_data(trxs, setconfirmations, ccsymbol, latestblock) :
                                                    (payment == "ethereum") ? blockchair_eth_scan_data(trxs.calls[0], setconfirmations, ccsymbol, latestblock) :
                                                    blockchair_scan_data(trxs, setconfirmations, ccsymbol, address, latestblock);
                                                if (txd.ccval) {
                                                    let tx_listitem = append_tx_li(txd, rqtype);
                                                    if (tx_listitem) {
                                                        transactionlist.append(tx_listitem.data(txd));
                                                        tx_count(statuspanel, 1);
                                                        compareamounts(rd);
                                                        return
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            let error_object = (errorThrown) ? errorThrown : jqXHR;
                            handle_api_fails_list(rd, error_object, api_data, payment);
                        }).always(function() {
                            api_src(thislist, api_data);
                        });
                    }
                }
                return
            }
            if (api_name == "nimiq.watch" || api_name == "mopsus.com") {
                if (pending == "scanning") { // scan incoming transactions on address
                    api_proxy({
                        "api": "nimiq.watch",
                        "search": "account-transactions/" + address,
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "params": {
                            "method": "GET"
                        }
                    }).done(function(e) {
                        let data = br_result(e).result;
                        if (data) {
                            if ($.isEmptyObject(data)) {
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            } else {
                                $.each(data, function(dat, value) {
                                    let r_address = value.receiver_address.replace(/\s/g, "");
                                    if (r_address == address) { // filter outgoing transactions
                                        let txd = nimiq_scan_data(value, setconfirmations);
                                        if (txd.transactiontime > request_timestamp && txd.ccval) {
                                            let tx_listitem = append_tx_li(txd, rqtype);
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
                            return
                        }
                        tx_api_fail(thislist, statuspanel);
                        handle_api_fails_list(rd, "unknown error", api_data, payment);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        let error_object = (errorThrown) ? errorThrown : jqXHR;
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
                                let data = br_result(e).result;
                                if (data) {
                                    if (data.error) {
                                        tx_api_fail(thislist, statuspanel);
                                        handle_api_fails_list(rd, data.error, api_data, payment);
                                    } else {
                                        let txd = nimiq_scan_data(data, setconfirmations);
                                        if (txd) {
                                            if (txd.ccval) {
                                                let tx_listitem = append_tx_li(txd, rqtype);
                                                if (tx_listitem) {
                                                    transactionlist.append(tx_listitem.data(txd));
                                                    tx_count(statuspanel, 1);
                                                    compareamounts(rd);
                                                }
                                            }
                                        }
                                    }
                                    return
                                }
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                tx_api_fail(thislist, statuspanel);
                                let error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_api_fails_list(rd, error_object, api_data, payment);
                            }).always(function() {
                                api_src(thislist, api_data);
                            });
                            return
                        }
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
                                let data = br_result(e).result;
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
                                            let e = br_result(res),
                                                bh = q_obj(e, "result.latest_block.height");
                                            if (bh) {
                                                let txd = nimiq_scan_data(data, setconfirmations, bh, null, transactionhash);
                                                if (txd) {
                                                    if (txd.ccval) {
                                                        let tx_listitem = append_tx_li(txd, rqtype);
                                                        if (tx_listitem) {
                                                            transactionlist.append(tx_listitem.data(txd));
                                                            tx_count(statuspanel, 1);
                                                            compareamounts(rd);
                                                        }
                                                    }
                                                }
                                            }
                                        }).fail(function(jqXHR, textStatus, errorThrown) {
                                            tx_api_fail(thislist, statuspanel);
                                            let error_object = (errorThrown) ? errorThrown : jqXHR;
                                            handle_api_fails_list(rd, error_object, api_data, payment);
                                        });
                                    }
                                    return
                                }
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                tx_api_fail(thislist, statuspanel);
                                let error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_api_fails_list(rd, error_object, api_data, payment);
                            }).always(function() {
                                api_src(thislist, api_data);
                            });
                        }
                    }
                }
            }
            if (payment == "kaspa") {
                if (pending == "scanning") { // scan incoming transactions on address
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
                                            if ($.isEmptyObject(data)) {
                                                tx_api_fail(thislist, statuspanel);
                                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                                            } else {
                                                $.each(data, function(dat, value) {
                                                    let txd = kaspa_scan_data(value, address, setconfirmations, current_bluescore);
                                                    if (txd.transactiontime > request_timestamp && txd.ccval) {
                                                        let tx_listitem = append_tx_li(txd, rqtype);
                                                        if (tx_listitem) {
                                                            transactionlist.append(tx_listitem.data(txd));
                                                            counter++;
                                                        }
                                                    }
                                                });
                                                tx_count(statuspanel, counter);
                                                compareamounts(rd);
                                            }
                                            return
                                        }
                                        tx_api_fail(thislist, statuspanel);
                                        handle_api_fails_list(rd, "unknown error", api_data, payment);
                                    }).fail(function(jqXHR, textStatus, errorThrown) {
                                        tx_api_fail(thislist, statuspanel);
                                        let error_object = (errorThrown) ? errorThrown : jqXHR;
                                        handle_api_fails_list(rd, error_object, api_data, payment);
                                    }).always(function() {
                                        api_src(thislist, api_data);
                                    });
                                    return
                                }
                            }
                            tx_api_fail(thislist, statuspanel);
                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            tx_api_fail(thislist, statuspanel);
                            let error_object = (errorThrown) ? errorThrown : jqXHR;
                            handle_api_fails_list(rd, error_object, api_data, payment);
                        }).always(function() {
                            api_src(thislist, api_data);
                        });
                    }
                    return
                }
                if (pending == "polling") {
                    if (transactionhash) {
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
                                            "search": "transactions/" + transactionhash,
                                            "cachetime": 25,
                                            "cachefolder": "1h",
                                            "params": {
                                                "method": "GET"
                                            }
                                        }).done(function(e) {
                                            let data = br_result(e).result;
                                            if (data) {
                                                if (data.error) {
                                                    tx_api_fail(thislist, statuspanel);
                                                    handle_api_fails_list(rd, data.error, api_data, payment);
                                                } else {
                                                    let txd = kaspa_scan_data(data, address, setconfirmations, current_bluescore);
                                                    if (txd) {
                                                        if (txd.ccval) {
                                                            let tx_listitem = append_tx_li(txd, rqtype);
                                                            if (tx_listitem) {
                                                                transactionlist.append(tx_listitem.data(txd));
                                                                tx_count(statuspanel, 1);
                                                                compareamounts(rd);
                                                            }
                                                        }
                                                    }
                                                }
                                                return
                                            }
                                            tx_api_fail(thislist, statuspanel);
                                            handle_api_fails_list(rd, "unknown error", api_data, payment);
                                        }).fail(function(jqXHR, textStatus, errorThrown) {
                                            tx_api_fail(thislist, statuspanel);
                                            let error_object = (errorThrown) ? errorThrown : jqXHR;
                                            handle_api_fails_list(rd, error_object, api_data, payment);
                                        }).always(function() {
                                            api_src(thislist, api_data);
                                        });
                                        return
                                    }
                                }
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                tx_api_fail(thislist, statuspanel);
                                let error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_api_fails_list(rd, error_object, api_data, payment);
                            }).always(function() {
                                api_src(thislist, api_data);
                            });
                            return
                        }
                        if (api_name == "kas.fyi") {
                            api_proxy({
                                "api": api_name,
                                "search": "transactions/" + transactionhash,
                                "cachetime": 25,
                                "cachefolder": "1h",
                                "params": {
                                    "method": "GET"
                                }
                            }).done(function(e) {
                                let data = br_result(e).result;
                                if (data) {
                                    if (data.error) {
                                        tx_api_fail(thislist, statuspanel);
                                        handle_api_fails_list(rd, data.error, api_data, payment);
                                    } else {
                                        let txd = kaspa_poll_fyi_data(data, address, setconfirmations);
                                        if (txd) {
                                            if (txd.ccval) {
                                                let tx_listitem = append_tx_li(txd, rqtype);
                                                if (tx_listitem) {
                                                    transactionlist.append(tx_listitem.data(txd));
                                                    tx_count(statuspanel, 1);
                                                    compareamounts(rd);
                                                }
                                            }
                                        }
                                    }
                                    return
                                }
                                tx_api_fail(thislist, statuspanel);
                                handle_api_fails_list(rd, "unknown error", api_data, payment);
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                tx_api_fail(thislist, statuspanel);
                                let error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_api_fails_list(rd, error_object, api_data, payment);
                            }).always(function() {
                                api_src(thislist, api_data);
                            });
                            return
                        }
                    }
                    return
                }
            }
        }
    }
}

function match_xmr_pid(xmria, xmrpid, xmr_pid) {
    if (xmria) {
        if (xmrpid == xmr_pid) {
            return true;
        }
        return false;
    }
    if (xmrpid || xmr_pid) {
        return false;
    }
    return true;
}

// API error handling

function fail_dialogs(apisrc, error) {
    let error_data = get_api_error_data(error);
    api_eror_msg(apisrc, error_data)
}

function handle_api_fails_list(rd, error, api_data, thispayment) {
    let error_data = get_api_error_data(error),
        requestid = rd.requestid;
    if (!api_data) {
        api_eror_msg(false, error_data);
        api_callback(requestid, true);
        return
    }
    let api_name = api_data.name,
        nextapi = get_next_api(thispayment, api_name, requestid);
    if (nextapi === false) {
        let api_url = api_data.url,
            nextrpc = get_next_rpc(thispayment, api_url, requestid);
        if (nextrpc === false) { // try next api
            let rpc_id = (api_name) ? api_name : (api_url) ? api_url : "unknown";
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
    let rpc_settings_li = $("#" + this_payment + "_settings .cc_settinglist li[data-id='apis']");
    if (rpc_settings_li) {
        let rpc_settings = rpc_settings_li.data(),
            apirpc = rpc_settings.apis,
            apilist = $.grep(apirpc, function(filter) {
                return filter.api;
            })
        if (!$.isEmptyObject(apilist)) {
            let next_scan = apilist[apilist.findIndex(option => option.name == api_name) + 1],
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
    let error_type = typeof error,
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
        let skcheck = ((error.indexOf("API calls limits have been reached") >= 0)); // blockcypher
    }
    let apikey = ((errorcode === 101) || // fixer
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
    let api_url = api_data.url,
        api_url_short = (api_url) ? (api_url.length > 40) ? api_url.slice(0, 40) + "..." : api_url : "",
        aoi_name = (api_data.name),
        api_title = (aoi_name == "mempool.space") ? api_url : aoi_name,
        api_source = (api_title) ? api_title : api_url_short;
    thislist.data("source", api_source).find(".api_source").html("<span class='src_txt' title='" + api_url_short + "'>source: " + api_source + "</span><span class='icon-wifi-off'></span><span class='icon-connection'></span>");
}

function api_callback(requestid, nocache) {
    let thislist = $("#" + requestid);
    if (thislist.hasClass("scan")) {
        thislist.removeClass("scan").addClass("pmstatloaded");
        if (nocache === true) {} else {
            let transactionlist = thislist.find(".transactionlist"),
                transactionli = transactionlist.find("li");
            if (transactionli.length) {
                transactionpush = [];
                transactionli.each(function() {
                    let thisnode = $(this),
                        thisdata = thisnode.data(),
                        historic = thisdata.historic,
                        conf = thisdata.confirmations,
                        setconfirmations = thisdata.setconfirmations;
                    transactionpush.push(thisdata);
                    if (!historic || $.isEmptyObject(historic)) {} else {
                        let h_string = historic_data_title(thisdata.ccsymbol, thisdata.ccval, historic, setconfirmations, conf, false);
                        thisnode.append(hs_for(h_string)).attr("title", h_string);
                    }
                });
                let statuspanel = thislist.find(".pmetastatus"),
                    statusbox = {
                        "requestid": requestid,
                        "status": statuspanel.attr("data-count"),
                        "transactions": transactionpush
                    };
                statuspush.push(statusbox);
            } else {
                let statusbox = {
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
    let error_dat = (error) ? error : {
            "errormessage": "errormessage",
            "errorcode": null
        },
        errormessage = error_dat.errormessage,
        errorcode = (error_dat.errorcode) ? "Error: " + error_dat.errorcode : "";
    if (error.console) {
        console.log(errorcode + errormessage);
        return false;
    }
    if ($("#dialogbody .doselect").length) {
        return
    }
    if (apisrc) {
        let keyfail = (error.apikey === true),
            api_bttn = (keyfail === true) ? "<div id='add_api' data-api='" + apisrc + "' class='button'>Add " + apisrc + " Api key</div>" : "",
            t_op = (apisrc) ? "<span id='proxy_dialog' class='ref'>Try other proxy</span>" : "",
            content = "<h2 class='icon-blocked'>" + errorcode + "</h2><p class='doselect'><strong>Error: " + errormessage + "<br/><br/>" + t_op + "</p>" + api_bttn;
        popdialog(content, "canceldialog");
    }
}

function tx_count(statuspanel, count) {
    statuspanel.attr("data-count", count).text("+ " + count);
}

function get_rpc_inputs_init(rd, api_data) {
    rpc_attempts[rd.requestid + api_data.url] = null; // reset api attempts
    get_rpc_inputs(rd, api_data);
}

function get_rpc_inputs(rd, api_data) {
    let requestid = rd.requestid,
        thislist = $("#" + requestid);
    if (thislist.hasClass("scan")) {
        rpc_attempts[requestid + api_data.url] = true;
        let payment = rd.payment,
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
            rpcurl = get_rpc_url(api_data), // (bitrequest_coin_settings.js)
            erc20 = (rd.erc20 === true),
            rqtype = rd.requesttype;
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
                api_proxy({ // get latest blockheight
                    "api_url": url + "/api/blocks/tip/height",
                    "proxy": false,
                    "params": {
                        "method": "GET"
                    }
                }).done(function(lb) {
                    let latestblock = br_result(lb).result;
                    if (latestblock) {
                        setTimeout(function() {
                            if (pending == "scanning") { // scan incoming transactions on address
                                api_proxy({
                                    "api_url": url + "/api/address/" + address + "/txs",
                                    "proxy": false,
                                    "params": {
                                        "method": "GET"
                                    }
                                }).done(function(e) {
                                    let data = br_result(e).result;
                                    if (data) {
                                        if ($.isEmptyObject(data)) {} else {
                                            $.each(data, function(dat, value) {
                                                if (value.txid) { // filter outgoing transactions
                                                    let txd = mempoolspace_scan_data(value, setconfirmations, ccsymbol, address, latestblock);
                                                    if (txd.transactiontime > request_timestamp && txd.ccval) {
                                                        let tx_listitem = append_tx_li(txd, rqtype);
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
                                        return
                                    }
                                    tx_api_fail(thislist, statuspanel);
                                    handle_rpc_fails_list(rd, {
                                        "error": "No results found",
                                        "console": true
                                    }, api_data, payment);
                                }).fail(function(jqXHR, textStatus, errorThrown) {
                                    tx_api_fail(thislist, statuspanel);
                                    let error_object = (errorThrown) ? errorThrown : jqXHR;
                                    handle_rpc_fails_list(rd, error_object, api_data, payment);
                                });
                                return
                            }
                            api_proxy({ // poll mempool.space transaction id
                                "api_url": url + "/api/tx/" + transactionhash,
                                "proxy": false,
                                "params": {
                                    "method": "GET"
                                }
                            }).done(function(e) {
                                let data = br_result(e).result;
                                if (data) {
                                    let txd = mempoolspace_scan_data(data, setconfirmations, ccsymbol, address, latestblock);
                                    if (txd) {
                                        if (txd.ccval) {
                                            let tx_listitem = append_tx_li(txd, rqtype);
                                            if (tx_listitem) {
                                                transactionlist.append(tx_listitem.data(txd));
                                                tx_count(statuspanel, 1);
                                                compareamounts(rd);
                                            }
                                        }
                                    }
                                    return
                                }
                                tx_api_fail(thislist, statuspanel);
                                handle_rpc_fails_list(rd, "unknown error", api_data, payment);
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                tx_api_fail(thislist, statuspanel);
                                let error_object = (errorThrown) ? errorThrown : jqXHR;
                                handle_rpc_fails_list(rd, error_object, api_data, payment);
                            });
                        }, 500);
                        return
                    }
                    tx_api_fail(thislist, statuspanel);
                    handle_rpc_fails_list(rd, "unknown error", api_data, payment);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    tx_api_fail(thislist, statuspanel);
                    let error_object = (errorThrown) ? errorThrown : jqXHR;
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
                let set_url = (rpcurl) ? rpcurl : main_eth_node;
                api_proxy(eth_params(set_url, 25, "eth_blockNumber", [])).done(function(a) {
                    let r_1 = inf_result(a);
                    if (r_1) {
                        api_proxy(eth_params(set_url, 25, "eth_getTransactionByHash", [transactionhash])).done(function(b) {
                            let r_2 = inf_result(b);
                            if (r_2) {
                                let this_bn = r_2.blockNumber;
                                api_proxy(eth_params(set_url, 25, "eth_getBlockByNumber", [this_bn, false])).done(function(c) {
                                    let r_3 = inf_result(c);
                                    if (r_3) {
                                        let tbn = Number(this_bn),
                                            cbn = Number(r_1),
                                            conf = cbn - tbn,
                                            conf_correct = (conf < 0) ? 0 : conf,
                                            txd;
                                        if (erc20 === true) {
                                            let input = r_2.input;
                                            if (str_match(input, address.slice(3)) === true) {
                                                let signature_hex = input.slice(2, 10),
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
                                            let txdata = {
                                                    "timestamp": Number(r_3.timestamp),
                                                    "hash": transactionhash,
                                                    "confirmations": conf_correct,
                                                    "value": Number(r_2.value)
                                                },
                                                txd = infura_eth_poll_data(txdata, setconfirmations, ccsymbol);
                                        }
                                        if (txd.ccval) {
                                            let tx_listitem = append_tx_li(txd, rqtype);
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
                        let data = br_result(e).result;
                        if (data) {
                            let nano_data = data.data;
                            if ($.isEmptyObject(nano_data)) {
                                tx_api_fail(thislist, statuspanel);
                                handle_rpc_fails_list(rd, {
                                    "error": "nano node offline",
                                    "console": true
                                }, api_data, payment);
                            } else {
                                let pending_array_node = (nano_data[0]) ? nano_data[0].pending : [],
                                    pending_array = $.isEmptyObject(pending_array_node) ? [] : pending_array_node,
                                    history_array_node = (nano_data[1]) ? nano_data[1].history : [],
                                    history_array = $.isEmptyObject(history_array_node) ? [] : history_array_node,
                                    merged_array = pending_array.concat(history_array).sort(function(x, y) { // merge and sort arrays
                                        return y.local_timestamp - x.local_timestamp;
                                    });
                                $.each(merged_array, function(data, value) {
                                    let txd = nano_scan_data(value, setconfirmations, ccsymbol);
                                    if ((txd.transactiontime > request_timestamp) && txd.ccval && (value.type === undefined || value.type == "receive")) {
                                        let tx_listitem = append_tx_li(txd, rqtype);
                                        if (tx_listitem) {
                                            transactionlist.append(tx_listitem.data(txd));
                                            counter++;
                                        }
                                    }
                                });
                                tx_count(statuspanel, counter);
                                compareamounts(rd);
                            }
                            return
                        }
                        tx_api_fail(thislist, statuspanel);
                        handle_rpc_fails_list(rd, {
                            "error": "No results found",
                            "console": true
                        }, api_data, payment);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        let error_object = (errorThrown) ? errorThrown : jqXHR;
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
                        let data = br_result(e).result;
                        if (data) {
                            if (data.error) {
                                tx_api_fail(thislist, statuspanel);
                                handle_rpc_fails_list(rd, data.error, api_data, payment);
                            } else {
                                let txd = nano_scan_data(data, setconfirmations, ccsymbol, transactionhash);
                                if (txd.ccval) {
                                    let tx_listitem = append_tx_li(txd, rqtype);
                                    if (tx_listitem) {
                                        transactionlist.append(tx_listitem.data(txd));
                                    }
                                    tx_count(statuspanel, 1);
                                    compareamounts(rd);
                                }
                            }
                            return
                        }
                        tx_api_fail(thislist, statuspanel);
                        handle_rpc_fails_list(rd, {
                            "error": "No results found",
                            "console": true
                        }, api_data, payment);
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        tx_api_fail(thislist, statuspanel);
                        let error_object = (errorThrown) ? errorThrown : jqXHR;
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
    let ir1 = br_result(r);
    if (ir1) {
        let ir2 = ir1.result;
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
    let payload = {
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
            "api_url": set_url,
            "proxy": false
        });
    }
    return payload;
}

// RPC error handling

function handle_rpc_fails_list(rd, error, rpc_data, thispayment) {
    let api_url = rpc_data.url,
        requestid = rd.requestid,
        nextrpc = get_next_rpc(thispayment, api_url, requestid);
    if (nextrpc === false) {
        let api_name = rpc_data.name;
        nextapi = get_next_api(thispayment, api_name, requestid);
        if (nextapi === false) { // try next api
            let rpc_id = (api_name) ? api_name : (api_url) ? api_url : "unknown",
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
    let rpc_settings_li = $("#" + this_payment + "_settings .cc_settinglist li[data-id='apis']");
    if (rpc_settings_li) {
        let rpc_settings = rpc_settings_li.data(),
            apilist = rpc_settings.apis,
            rpclist = rpc_settings.options,
            apirpc = $.grep(apilist, function(filter) {
                return !filter.api;
            }),
            restlist = (apirpc && rpclist) ? $.merge(apirpc, rpclist) : apirpc;
        if (!$.isEmptyObject(restlist)) {
            let next_scan = restlist[restlist.findIndex(option => option.url == api_url) + 1],
                next_rpc = (next_scan) ? next_scan : restlist[0],
                rqid = (requestid) ? requestid : "";
            if (rpc_attempts[rqid + next_rpc.url] !== true) {
                return next_rpc;
            }
        }
    }
    return false;
}

function append_tx_li(txd, rqtype, ln) {
    let txhash = txd.txhash;
    if (txhash) {
        let ccval = txd.ccval,
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
            let h_string = historic_data_title(ccsymbol, ccval, historic, setconfirmations, conf, true);
            tx_listitem.append(hs_for(h_string)).attr("title", h_string);
        }
        if (rqtype === false) {
            return tx_listitem;
        }
        if ($.inArray(txhash, tx_list) !== -1) { // check for indexed transaction id's
            if (rqtype == "outgoing") {
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
    let timestamp = historic.timestamp,
        price = historic.price;
    if (timestamp && price) {
        let fiatsrc = historic.fiatapisrc,
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
    }
    let resp = "Failed to get historical " + ccsymbol + " price data";
    notify(resp);
    return resp;
}

function compareamounts(rd, ln) {
    let thisrequestid = rd.requestid,
        requestli = $("#" + thisrequestid),
        lastlist = requestli.find(".transactionlist li:last"),
        firstinput = lastlist.data("transactiontime");
    if (firstinput) {
        let requestdate = rd.requestdate,
            iscrypto = rd.iscrypto,
            thispayment = rd.payment,
            ccsymbol = rd.currencysymbol,
            pendingstatus = rd.pending,
            getconfirmations = rd.set_confirmations,
            getconfint = (getconfirmations) ? parseInt(getconfirmations) : 1,
            setconfirmations = (ln == true) ? 1 : (getconfint) ? getconfint : 1, // set minimum confirmations to 1
            firstlist = requestli.find(".transactionlist li:first"),
            latestinput = firstlist.data("transactiontime"),
            offset = Math.abs(now() - (firstinput - timezone)),
            recent = (offset < 900000); // Only lookup hystorical data after 15 minutes
        if (iscrypto || recent) {
            let thissum_cc = 0,
                txhash_cc,
                paymenttimestamp_cc,
                confirmations_cc = 0,
                status_cc = "pending",
                pending_cc = pendingstatus,
                confirmed_cc = false,
                tx_counter = 0,
                cc_amount = parseFloat(rd.cc_amount),
                fiatvalue = rd.fiatvalue,
                margin = 0.95;
            $(requestli.find(".transactionlist li").get().reverse()).each(function(i) {
                tx_counter++;
                let thisnode = $(this),
                    tn_dat = thisnode.data();
                confirmations_cc = tn_dat.confirmations,
                    paymenttimestamp_cc = tn_dat.transactiontime,
                    txhash_cc = tn_dat.txhash,
                    thissum_cc += parseFloat(tn_dat.ccval) || 0; // sum of outputs
                if (confirmations_cc >= setconfirmations || rd.no_conf === true || confirmations_cc === false) { // check all confirmations + whitelist for currencies unable to fetch confirmation
                    confirmed_cc = true;
                    if (thissum_cc >= cc_amount * margin) { // compensation for small fluctuations in rounding amount
                        status_cc = "paid",
                            pending_cc = "no";
                        thisnode.addClass("exceed").nextAll().addClass("exceed");
                        return
                    }
                } else {
                    confirmed_cc = false;
                }
                let confbar = thisnode.find(".confbar");
                if (confbar.length > 0) {
                    confbar.each(function(i) {
                        animate_confbar($(this), i);
                    });
                };
            });
            if (thissum_cc >= cc_amount * margin) { // compensation for small fluctuations in rounding amount
                if (confirmed_cc === false) { // check confirmations outside the loop
                    status_cc = "pending",
                        pending_cc = (tx_counter === 1) ? "polling" : pendingstatus; // switch to tx polling if there's only one transaction
                }
            } else {
                status_cc = "insufficient",
                    pending_cc = "scanning";
            }
            if (recent && !iscrypto) { // get local fiat rates when request is less then 15 minutes old
                let exchangerates = br_get_session("exchangerates", true),
                    cc_xrates = br_get_session("xrates_" + ccsymbol, true);
                if (exchangerates && cc_xrates) {
                    let local_xrate = (exchangerates.fiat_exchangerates) ? exchangerates.fiat_exchangerates[rd.fiatcurrency] : null,
                        usd_eur_xrate = (exchangerates.fiat_exchangerates) ? exchangerates.fiat_exchangerates.usd : null;
                    if (local_xrate && usd_eur_xrate) {
                        let usd_rate = (cc_xrates) ? cc_xrates.ccrate : null;
                        if (usd_rate) {
                            let usdval = thissum_cc * usd_rate,
                                eurval = usdval / usd_eur_xrate,
                                fiatvalue = eurval * local_xrate;
                        }
                    }
                }
            }
            updaterequest({
                "requestid": thisrequestid,
                "status": status_cc,
                "receivedamount": thissum_cc,
                "fiatvalue": fiatvalue,
                "paymenttimestamp": paymenttimestamp_cc,
                "txhash": txhash_cc,
                "confirmations": confirmations_cc,
                "pending": pending_cc,
                "lightning": rd.lightning
            }, false);
            api_callback(thisrequestid);
            return
        }
        let latestconf = (rd.no_conf === true) ? 0 : firstlist.data("confirmations"), // only update on change
            hc_prefix = "historic_" + thisrequestid,
            historiccache = br_get_session(hc_prefix),
            cacheval = latestinput + latestconf;
        if (cacheval != historiccache) { //new input detected; call historic api
            br_remove_session(hc_prefix); // remove historic price cache
            let historic_payload = $.extend(rd, {
                "latestinput": latestinput,
                "latestconf": latestconf,
                "firstinput": firstinput
            });
            let apilist = "historic_fiat_price_apis",
                fiatapi = $("#fiatapisettings").data("selected"),
                fiatapi_default = (fiatapi == "coingecko" || fiatapi == "coinbase") ? "fixer" : fiatapi; // exclude coingecko api"
            api_attempt[apilist] = {}; // reset global historic fiat price api attempt
            get_historical_fiat_data(historic_payload, apilist, fiatapi_default, ln);
            return
        }
    }
    api_callback(thisrequestid);
}

// get historic crypto rates

function get_historical_fiat_data(rd, apilist, fiatapi, ln) {
    api_attempt[apilist][fiatapi] = true;
    let thisrequestid = rd.requestid,
        fiatcurrency = rd.fiatcurrency;
    if (fiatcurrency) {
        let lcsymbol = fiatcurrency.toUpperCase(),
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
            let data = br_result(e).result;
            if (data) {
                if (data.error) {
                    let next_historic = try_next_api(apilist, fiatapi);
                    if (next_historic) {
                        get_historical_fiat_data(rd, apilist, next_historic);
                        return
                    }
                    fail_dialogs(fiatapi, data.error);
                    api_callback(thisrequestid);
                    return
                }
                let usdeur = false,
                    usdloc = false,
                    usdrate = false,
                    get_lcrate = false;
                if (fiatapi == "currencylayer") {
                    usdeur = q_obj(data, "quotes.USDEUR"),
                        usdloc = q_obj(data, "quotes.USD" + lcsymbol);
                    if (usdeur && usdloc) {
                        usdrate = 1 / usdeur,
                            get_lcrate = usdloc * usdrate;
                    }
                } else {
                    usdrate = q_obj(data, "rates.USD"),
                        get_lcrate = q_obj(data, "rates." + lcsymbol);
                }
                if (usdrate && get_lcrate) {
                    let lcrate = (lcsymbol == "EUR") ? 1 : get_lcrate;
                    let historic_api = $("#cmcapisettings").data("selected"),
                        picked_historic_api = (historic_api == "coinmarketcap") ? "coingecko" : historic_api, // default to "coingecko api"
                        init_apilist = "historic_crypto_price_apis";
                    api_attempt[init_apilist] = {};
                    get_historical_crypto_data(rd, fiatapi, init_apilist, picked_historic_api, lcrate, usdrate, lcsymbol, ln);
                    return
                }
                let next_historic = try_next_api(apilist, fiatapi);
                if (next_historic) {
                    get_historical_fiat_data(rd, apilist, next_historic);
                    return
                }
            }
            fail_dialogs(fiatapi, "unable to fetch " + lcsymbol + " exchange rate");
            api_callback(thisrequestid);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            let next_historic = try_next_api(apilist, fiatapi);
            if (next_historic) {
                get_historical_fiat_data(rd, apilist, next_historic);
                return
            }
            let error_object = (errorThrown) ? errorThrown : jqXHR;
            fail_dialogs(fiatapi, error_object);
            api_callback(thisrequestid);
        });
        return
    }
    api_callback(thisrequestid);
}

function get_historic_fiatprice_api_payload(fiatapi, lcsymbol, latestinput) {
    let dateformat = form_date(latestinput),
        payload = (fiatapi == "fixer") ? dateformat + "?symbols=" + lcsymbol + ",USD" :
        (fiatapi == "currencylayer") ? "historical?date=" + dateformat :
        dateformat + "?base=EUR"; // <- exchangeratesapi
    return payload;
}

function form_date(latestinput) {
    let dateobject = new Date(parseFloat(latestinput)),
        getmonth = dateobject.getUTCMonth() + 1,
        getday = dateobject.getUTCDate(),
        year = dateobject.getUTCFullYear(),
        month = (getmonth < 10) ? "0" + getmonth : getmonth,
        day = (getday < 10) ? "0" + getday : getday;
    return year + "-" + month + "-" + day;
}

function get_historical_crypto_data(rd, fiatapi, apilist, api, lcrate, usdrate, lcsymbol, ln) {
    api_attempt[apilist][api] = true;
    let thisrequestid = rd.requestid,
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
        let api_result = br_result(e).result,
            data = (api == "coingecko") ? (api_result) ? api_result.prices : null :
            (api == "coincodex") ? (api_result) ? api_result[ccsymbol.toUpperCase()] : null : api_result;
        if (data && !data.error) {
            let latestconf = rd.latestconf,
                thisamount = rd.amount,
                getconfirmations = rd.set_confirmations,
                getconfint = (getconfirmations) ? parseInt(getconfirmations) : 1,
                setconfirmations = (ln === true) ? 1 : (getconfint) ? getconfint : 1, // set minimum confirmations to 1
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
                let thisnode = $(this),
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
                let thisusdsum = receivedusd += parseFloat(historic_price * thisvalue) || 0;
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
                let confbar = thisnode.find(".confbar");
                if (confbar.length > 0) {
                    confbar.each(function(i) {
                        animate_confbar($(this), i);
                    });
                };
            });
            if (receivedusd) {
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
                let cacheval = latestinput + latestconf;
                if (pending == "no") {} else {
                    br_set_session("historic_" + thisrequestid, cacheval); // 'cache' historic data
                }
                api_callback(thisrequestid);
                return;
            }
        }
        let next_historic = try_next_api(apilist, api);
        if (next_historic) {
            get_historical_crypto_data(rd, fiatapi, apilist, next_historic, lcrate, usdrate, lcsymbol, ln);
            return
        }
        fail_dialogs(api, "error retrieving historical price data");
        api_callback(thisrequestid);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        let next_historic = try_next_api(apilist, api);
        if (next_historic) {
            get_historical_crypto_data(rd, fiatapi, apilist, next_historic, lcrate, usdrate, lcsymbol, ln);
            return
        }
        let error_object = (errorThrown) ? errorThrown : jqXHR;
        fail_dialogs(api, error_object);
        api_callback(thisrequestid);
    })
}

function get_payload_historic_coingecko(coin_id, starttime, endtime, erc20_contract) {
    let time_range = Math.abs(endtime - starttime),
        start_time = (time_range < 3600) ? 5200 : 3600; // compensation for minimum range
    if (erc20_contract) {
        return "coins/ethereum/contract/" + erc20_contract + "/market_chart/range?vs_currency=usd&from=" + (starttime - start_time) + "&to=" + (endtime + 3600); // expand range with one hour for error margin
    }
    return "coins/" + coin_id + "/market_chart/range?vs_currency=usd&from=" + (starttime - start_time) + "&to=" + (endtime + 3600); // expand range with one hour for error margin
}

function get_payload_historic_coinpaprika(coin_id, starttime, endtime) {
    let ts_start = starttime - 36000,
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
    let st_format = cx_date(starttime),
        et_format = cx_date(endtime),
        tquery = (starttime == endtime) ? st_format + "/" + st_format : st_format + "/" + et_format;
    return "get_coin_history/" + coin_id + "/" + tquery + "/" + 1000;
}

function cx_date(ts) {
    return new Date(ts * 1000).toISOString().split("T")[0];
}

function compare_historic_prices(api, values, price_array, thistimestamp) {
    $.each(price_array, function(i, value) {
        let historic_object = (api == "coincodex") ? get_historic_object_coincodex(value) :
            (api == "coingecko") ? get_historic_object_coingecko(value) :
            get_historic_object_coinpaprika(value);
        if (historic_object) {
            let historic_timestamp = historic_object.timestamp,
                historic_price = historic_object.price;
            if (historic_timestamp > thistimestamp) {
                values["timestamp"] = historic_timestamp,
                    values["price"] = historic_price,
                    values["fetched"] = true;
            }
        }
    });
    let fetched = values.fetched;
    if (fetched && fetched === true) {
        // check if historical prices are fetched succesfully, if true do nothing
    } else { // if no matching timestamp get latest
        let lastitem = price_array[price_array.length - 1],
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
    if (value) {
        return {
            "timestamp": ((value[0] * 1000) + timezone) + 60000, // add 1 minute for compensation margin
            "price": value[1]
        }
    }
    return false;
}

function get_historic_object_coingecko(value) {
    if (value) {
        return {
            "timestamp": (value[0] + timezone) + 60000, // add 1 minute for compensation margin
            "price": value[1]
        }
    }
    return false;
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