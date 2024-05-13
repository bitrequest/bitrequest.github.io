$(document).ready(function() {
    updaterequeststatestrigger();
    updaterequeststatesrefresh();
    //is_scanning
    //trigger_requeststates
    //get_requeststates
    //getinputs
    //check_api

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
        let scanning = is_scanning();
        if (scanning) {
            playsound(funk);
            return
        }
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
            trigger_requeststates("delay");
        }, 300);
    }
}

function is_scanning() {
    return ($("#requestlist li.rqli.scan").length) ? true : false;
}

function trigger_requeststates(trigger) {
    if (offline === true || inframe === true) {
        return // do nothing when offline
    }
    api_attempts = {}, // reset cache and index
        rpc_attempts = {},
        proxy_attempts = {},
        tx_list = [], // reset transaction index
        statuspush = [];
    let active_requests = $("#requestlist .rqli").filter(function() {
        return $(this).data("pending") != "unknown";
    });
    active_requests.addClass("open");
    get_requeststates(trigger, active_requests);
}

function get_requeststates(trigger, active_requests) {
    let d_lay = (trigger == "delay") ? true : false;
    let request_data = $("#requestlist li.rqli.open").first().data();
    if (request_data) {
        if (trigger == "loop") {
            getinputs(request_data, d_lay);
            return
        }
        let statuscache = br_get_session("txstatus", true);
        if (statuscache) {
            let cachetime = now() - statuscache.timestamp,
                requeststates = statuscache.requeststates;
            if (cachetime > 30000 || $.isEmptyObject(requeststates)) { //check if cached crypto rates are expired (check every 30 seconds on page refresh or when opening request page)
                active_requests.addClass("scan");
                br_remove_session("txstatus"); // remove cached transactions
                getinputs(request_data, d_lay);
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
        active_requests.addClass("scan");
        getinputs(request_data, d_lay);
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

function getinputs(rd, dl) {
    if (dl) {
        let delay = 10000,
            mtlc = br_get_session("monitor_timer"),
            monitor_timer = (mtlc) ? parseInt(mtlc) : delay,
            timelapsed = now() - monitor_timer;
        if (timelapsed < delay) { // prevent over scanning
            playsound(funk);
            $("#requestlist .rqli").removeClass("scan"); // prevent triggerblock
            return
        }
        br_set_session("monitor_timer", now());
    }
    let thislist = $("#" + rd.requestid),
        iserc20 = rd.erc20,
        api_info = check_api(rd.payment, iserc20),
        selected = api_info.data;
    thislist.removeClass("pmstatloaded");
    if (api_info.api === true) {
        get_api_inputs_init(rd, selected);
        return
    }
    get_rpc_inputs_init(rd, selected);
}

function check_api(payment, iserc20) {
    let api_data = cs_node(payment, "apis", true);
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

function get_api_inputs_init(rd, api_data) {
    if (api_data) {
        api_attempts[rd.requestid + api_data.name] = null; // reset api attempts
        get_api_inputs(rd, api_data);
        return
    }
    console.log("no api data available");
}

function get_api_inputs(rd, api_data) {
    let rdo = tx_data(rd), // fetchblocks.js
        thislist = rdo.thislist;
    if (thislist.hasClass("scan")) {
        let transactionlist = rdo.transactionlist;
        api_attempts[rd.requestid + api_data.name] = true;
        thislist.removeClass("no_network");
        if (rdo.pending == "no" || rdo.pending == "incoming" || thislist.hasClass("expired")) {
            transactionlist.find("li").each(function(i) {
                tx_list.push($(this).data("txhash"));
            });
            api_callback(rd.requestid, true);
            return
        }
        if (rdo.pending == "scanning" || rdo.pending == "polling") {
            transactionlist.html("");
            let api_name = api_data.name;
            if (rd.lightning) {
                const l_fetch = lightning_fetch(rd, api_data, rdo);
                if (l_fetch == "exit") {
                    return
                }
            }
            if (rd.payment == "monero") {
                monero_fetch(rd, api_data, rdo);
                return
            }
            if (api_name == "mempool.space") {
                mempoolspace_rpc(rd, api_data, rdo, false)
                return
            }
            if (api_name == "blockcypher") {
                blockcypher_fetch(rd, api_data, rdo);
                return
            }
            if (api_name == "ethplorer" || api_name == "binplorer") {
                ethplorer_fetch(rd, api_data, rdo);
                return
            }
            if (api_name == "arbiscan") {
                arbiscan_fetch(rd, api_data, rdo);
                return
            }
            if (api_name == "blockchair") {
                blockchair_fetch(rd, api_data, rdo);
                return
            }
            if (api_name == "nimiq.watch" || api_name == "mopsus.com") {
                nimiq_fetch(rd, api_data, rdo);
                return
            }
            if (rd.payment == "kaspa") {
                kaspa_fetch(rd, api_data, rdo);
                return
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

function handle_api_fails_list(rd, error, api_data) {
    let error_data = get_api_error_data(error),
        requestid = rd.requestid;
    if (!api_data) {
        api_eror_msg(false, error_data);
        api_callback(requestid);
        return
    }
    let api_name = api_data.name,
        nextapi = get_next_api(rd.payment, api_name, requestid),
        nextrpc;
    if (nextapi === false) {
        let api_url = api_data.url,
            nextrpc = get_next_rpc(rd.payment, api_url, requestid);
        if (nextrpc === false) { // try next proxy
            if (error == "scan") {} else {
                let next_proxy = get_next_proxy();
                if (next_proxy) {
                    get_api_inputs(rd, api_data);
                    return;
                }
                let rpc_id = (api_name) ? api_name : (api_url) ? api_url : "unknown";
                api_eror_msg(rpc_id, error_data);
            }
        }
        api_callback(requestid);
        return
    }
    if (nextapi) {
        get_api_inputs(rd, nextapi);
    } else if (nextrpc) {
        get_rpc_inputs(rd, nextrpc);
    }
}

function get_next_api(this_payment, api_name, requestid) {
    let rpc_settings = cs_node(this_payment, "apis", true);
    if (rpc_settings) {
        let apirpc = rpc_settings.apis,
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
        thislist.removeClass("scan open").addClass("pmstatloaded");
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
    let rdo = tx_data(rd),
        thislist = rdo.thislist,
        transactionlist = rdo.transactionlist;
    if (thislist.hasClass("scan")) {
        rpc_attempts[rd.requestid + api_data.url] = true;
        thislist.removeClass("no_network");
        if (rdo.pending == "no" || rdo.pending == "incoming" || thislist.hasClass("expired")) {
            transactionlist.find("li").each(function() {
                tx_list.push($(this).data("txhash"));
            });
            api_callback(rd.requestid, true);
            return
        }
        if (rdo.pending == "scanning" || rdo.pending == "polling") {
            transactionlist.html("");
            if (is_btchain(rd.payment) === true) {
                mempoolspace_rpc(rd, api_data, rdo, true);
                return
            }
            if (rd.payment == "ethereum" || rd.erc20 === true) {
                if (rdo.pending == "scanning") { // scan incoming transactions on address
                    handle_rpc_fails_list(rd, false, api_data, rd.payment); // use api instead
                    return
                }
                infura_txd_rpc(rd, api_data, rdo);
                return
            }
            if (rd.payment == "nano") {
                nano_rpc(rd, api_data, rdo);
                return
            }
            get_api_inputs_init(rd, rpc_data);
        }
    }
}

// RPC error handling

function handle_rpc_fails_list(rd, error, rpc_data) {
    let api_url = rpc_data.url,
        requestid = rd.requestid,
        nextrpc = get_next_rpc(rd.payment, api_url, requestid),
        api_name = rpc_data.name,
        nextapi = get_next_api(rd.payment, api_name, requestid);
    if (nextrpc === false) {
        if (nextapi === false) { // try next proxy
            if (error == "scan") {} else {
                let next_proxy = get_next_proxy();
                if (next_proxy) {
                    get_rpc_inputs(rd, rpc_data);
                    return
                }
                let rpc_id = (api_name) ? api_name : (api_url) ? api_url : "unknown",
                    error_data = get_api_error_data(error);
                api_eror_msg(rpc_id, error_data);
            }
        }
        api_callback(requestid);
        return
    }
    if (nextrpc) {
        get_rpc_inputs(rd, nextrpc);
    } else if (nextapi) {
        get_api_inputs(rd, nextapi);
    }
}

function get_next_rpc(this_payment, api_url, requestid) {
    let rpc_settings = cs_node(this_payment, "apis", true);
    if (rpc_settings) {
        let apilist = rpc_settings.apis,
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
            recent = (offset < 300000); // Only lookup hystorical data after 5 minutes
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
        let conf = firstlist.data("confirmations"),
            confcor = (conf) ? conf : 0,
            latestconf = (rd.no_conf === true) ? 0 : confcor, // only update on change
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
                    paymenttimestamp = thistimestamp,
                    txhash = tn_dat.txhash,
                    receivedcc += parseFloat(thisvalue) || 0; // sum of outputs CC
                let thisusdsum = receivedusd += parseFloat(historic_price * thisvalue) || 0;
                if (historic_price && (conf >= setconfirmations || rd.no_conf === true || conf === false)) { // check all confirmations + whitelist for currencies unable to fetch confirmations
                    confirmed = true;
                    if (thisusdsum >= historicusdvalue * margin) { //minus 5% dollar for volatility compensation
                        status = "paid",
                            pending = "no";
                        thisnode.addClass("exceed").nextAll().addClass("exceed");
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
                return
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