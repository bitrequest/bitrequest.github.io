let glob_block_scan = 0,
    l2network_cache = br_get_session("l2source", true),
    glob_l2network = (l2network_cache) ? l2network_cache : {};

$(document).ready(function() {
    updaterequeststatestrigger();
    updaterequeststatesrefresh();
    //is_scanning
    //trigger_requeststates
    //get_requeststates
    //getinputs
    //clearscan
    //check_api

    //get_api_inputs_init
    //get_api_inputs
    //select_api
    //fail_dialogs
    //scan_match
    //tx_count
    //tx_api_scan_fail
    //tx_api_fail
    //handle_api_fails
    //get_next_api
    //api_eror_msg
    //get_api_error_data
    //set_api_src
    //api_src
    //api_callback

    //get_rpc_inputs_init
    //get_rpc_inputs
    //select_rpc
    //handle_rpc_fails
    //get_next_rpc
    //scan_tx_li
    //append_tx_li
    //hs_for
    //historic_data_title

    //compareamounts
    //init_historical_fiat_data
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
        const scanning = is_scanning();
        if (scanning) {
            glob_block_scan = glob_block_scan + 1;
            playsound(glob_funk);
            return
        }
        trigger_requeststates(true);
    })
}

function updaterequeststatesrefresh() {
    const gets = geturlparameters();
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
    if (glob_block_scan > 9) {
        clearscan();
    }
    return ($("#requestlist li.rqli.scan").length) ? true : false;
}

function trigger_requeststates(trigger) {
    if (glob_offline === true) {
        return // do nothing when offline
    }
    glob_api_attempts = {}, // reset cache and index
        glob_rpc_attempts = {},
        glob_proxy_attempts = {},
        glob_tx_list = [], // reset transaction index
        glob_statuspush = [];
    const active_requests = $("#requestlist .rqli").filter(function() {
        return $(this).data("pending") != "unknown";
    });
    active_requests.addClass("open");
    get_requeststates(trigger, active_requests);
}

function get_requeststates(trigger, active_requests) {
    const d_lay = (trigger == "delay") ? true : false,
        request_data = $("#requestlist li.rqli.open").first().data();
    if (request_data) {
        if (trigger == "loop") {
            getinputs(request_data, d_lay);
            return
        }
        const statuscache = br_get_session("txstatus", true);
        if (statuscache) {
            const cachetime = now() - statuscache.timestamp,
                requeststates = statuscache.requeststates;
            if (cachetime > 30000 || $.isEmptyObject(requeststates)) { //check if cached crypto rates are expired (check every 30 seconds on page refresh or when opening request page)
                active_requests.addClass("scan");
                br_remove_session("txstatus"); // remove cached transactions
                getinputs(request_data, d_lay);
                return
            }
            if (trigger === true) {
                return
            }
            // Only update on page refresh
            // parse cached transaction data
            $.each(requeststates, function(i, value) {
                const thislist = $("#" + value.requestid),
                    thisdata = thislist.data();
                if (thisdata) {
                    const pendingstatus = thisdata.pending;
                    if (pendingstatus == "scanning" || pendingstatus == "polling") {
                        const statuspanel = thislist.find(".pmetastatus"),
                            transactionlist = thislist.find(".transactionlist");
                        statuspanel.text(value.status);
                        transactionlist.html("");
                        $.each(value.transactions, function(data, value) {
                            const tx_listitem = append_tx_li(value, false);
                            if (tx_listitem) {
                                transactionlist.append(tx_listitem.data(value));
                            }
                        });
                        thislist.addClass("pmstatloaded");
                    }
                }
            });
            return
        }
        active_requests.addClass("scan");
        getinputs(request_data, d_lay);
        return
    }
    if (!$.isEmptyObject(glob_statuspush)) {
        const statusobject = {
            "timestamp": now(),
            "requeststates": glob_statuspush
        };
        br_set_session("txstatus", statusobject, true);
        saverequests();
    }
}

function getinputs(rd, dl) {
    if (dl) {
        const delay = 10000,
            mtlc = br_get_session("monitor_timer"),
            monitor_timer = (mtlc) ? parseInt(mtlc) : delay,
            timelapsed = now() - monitor_timer;
        if (timelapsed < delay) { // prevent over scanning
            playsound(glob_funk);
            clearscan();
            return
        }
        br_set_session("monitor_timer", now());
    }
    const thislist = $("#" + rd.requestid),
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

function clearscan() {
    $("#requestlist .rqli").removeClass("scan"); // prevent triggerblock
    glob_block_scan = 0;
}

function check_api(payment, iserc20) {
    const api_data = cs_node(payment, "apis", true);
    if (api_data) {
        const selected = api_data.selected;
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
        const requestid = rd.requestid,
            rq_id = (requestid) ? requestid : "";
        glob_api_attempts[rq_id + api_data.name] = null; // reset api attempts
        get_api_inputs(rd, false, api_data);
        return
    }
    console.log("no api data available");
}

function get_api_inputs(rd, rdod, api_data) {
    const rdo = (rdod) ? rdod : tx_data(rd), // fetchblocks.js
        source = rdo.source;
    if (source == "poll") {
        select_api(rd, rdo, api_data);
        return
    }
    const thislist = rdo.thislist;
    if (thislist && thislist.hasClass("scan")) {
        const transactionlist = rdo.transactionlist;
        thislist.removeClass("no_network");
        if (rdo.pending == "no" || rdo.pending == "incoming" || thislist.hasClass("expired")) {
            transactionlist.find("li").each(function(i) {
                glob_tx_list.push($(this).data("txhash"));
            });
            api_callback(rd.requestid, true);
            return
        }
        if (rdo.pending == "scanning" || rdo.pending == "polling") {
            transactionlist.html("");
            select_api(rd, rdo, api_data);
        }
    }
}

function select_api(rd, rdo, api_dat) {
    const txhash = rd.txhash,
        requestid = rd.requestid,
        rq_id = (requestid) ? requestid : "",
        glob_l2 = glob_l2network[rq_id], // get cached l2 network
        api_data = (glob_l2) ? glob_l2 : api_dat,
        api_name = api_data.name;
    glob_api_attempts[rq_id + api_name] = true;
    if (rd.lightning) {
        const l_fetch = lightning_fetch(rd, api_data, rdo);
        if (l_fetch == "exit") {
            return
        }
    }
    if (api_name == "mymonero api") {
        monero_fetch(rd, api_data, rdo);
        return
    }
    if (api_name == "blockchair_xmr") {
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
    if (api_name == "dash.org") {
        insight_fetch_dash(rd, api_data, rdo);
        return
    }
}

// API error handling

function fail_dialogs(apisrc, error) {
    const error_data = get_api_error_data(error);
    api_eror_msg(apisrc, error_data)
}

function scan_match(rd, api_data, rdo, counter, txdat, match, l2) {
    const src = rdo.source,
        is_api = (api_data.api) ? true : false;
    if (src == "list") {
        tx_count(rdo.statuspanel, counter);
    }
    if (match) {
        const txhash = rd.txhash;
        if (src == "poll") {
            const status = confirmations(txdat);
            if (status == "paid") {
                return
            }
            if (glob_pinging[txhash]) {
                return
            }
            glob_pinging[txhash] = setInterval(function() {
                if (glob_paymentpopup.hasClass("active")) { // only when request is visible
                    if (is_api) {
                        select_api(rd, rdo, api_data);
                    } else {
                        select_rpc(rd, rdo, api_data);
                    }
                    return
                }
                forceclosesocket();
            }, 30000);
            return
        }
        if (src == "list") {
            const layer = txdat.l2;
            if (layer) { // update l2 source
                rd.layer = layer;
            }
            compareamounts(rd);
        }
        if (src == "afterscan") { // afterscan
            pick_monitor(txdat.txhash, txdat);
        }
        if (l2) { // Save L2 Network to session storage
            const requestid = rd.requestid,
                rq_id = (requestid) ? requestid : "";
            if (rq_id.length) {
                if (glob_l2network[rq_id] != api_data) {
                    glob_l2network[rq_id] = api_data;
                    br_set_session("l2source", glob_l2network, true);
                }
            }
        }
        return
    }
    if (l2) { // scan l2's
        const console_l2 = {
            "error": "Scanning next l2 rpc",
            "console": true
        };
        if (is_api) {
            handle_api_fails(rd, rdo, console_l2, api_data);
            return
        }
        handle_rpc_fails(rd, rdo, console_l2, api_data);
        return
    }
    if (src == "list") {
        api_callback(rd.requestid);
        return
    }
    close_paymentdialog(true);
}

function tx_count(statuspanel, count) {
    statuspanel.attr("data-count", count).text("+ " + count);
}

function tx_api_scan_fail(rd, rdo, api_data, error_data, all_proxys) {
    const src = rdo.source;
    if (src == "afterscan") {
        after_scan_fails(api_data.name);
        return
    }
    if (src == "list") {
        const thislist = rdo.thislist;
        if (thislist) {
            tx_api_fail(thislist, rdo.statuspanel);
        }
    }
    if (api_data.api) {
        handle_api_fails(rd, rdo, error_data, api_data, all_proxys);
        return
    }
    handle_rpc_fails(rd, rdo, error_data, api_data, all_proxys);
    return
}

function tx_api_fail(thislist, statuspanel) {
    thislist.addClass("no_network");
    statuspanel.attr("data-count", 0).text("?");
}

function handle_api_fails(rd, rdo, error, api_data, all_proxys) {
    const error_data = get_api_error_data(error),
        requestid = rd.requestid;
    if (!api_data) {
        api_eror_msg(false, error_data);
        api_callback(requestid);
        return
    }
    const api_name = api_data.name,
        nextapi = get_next_api(rd.payment, api_name, requestid);
    let nextrpc;
    if (nextapi === false) {
        const api_url = api_data.url;
        nextrpc = get_next_rpc(rd.payment, api_url, requestid);
        if (nextrpc === false) { // try next proxy
            if (all_proxys === true) { // try next proxy
                const next_proxy = get_next_proxy();
                if (next_proxy) {
                    get_api_inputs(rd, rdo, api_data);
                    return;
                }
            }
            const rpc_id = (api_name) ? api_name : (api_url) ? api_url : "unknown";
            api_eror_msg(rpc_id, error_data);
            return
        }
    }
    if (nextapi) {
        get_api_inputs(rd, rdo, nextapi);
    } else if (nextrpc) {
        get_rpc_inputs(rd, rdo, nextrpc);
    }
}

function get_next_api(this_payment, api_name, requestid) {
    const rpc_settings = cs_node(this_payment, "apis", true);
    if (rpc_settings) {
        const apirpc = rpc_settings.apis,
            apilist = $.grep(apirpc, function(filter) {
                return filter.api;
            })
        if (!$.isEmptyObject(apilist)) {
            const next_scan = apilist[apilist.findIndex(option => option.name == api_name) + 1],
                next_api = (next_scan) ? next_scan : apilist[0],
                rq_id = (requestid) ? requestid : "";
            if (glob_api_attempts[rq_id + next_api.name] !== true) {
                return next_api;
            }
        }
    }
    return false;
}

function api_eror_msg(apisrc, error) {
    if (error == false) {
        console.log("no error data");
        return
    }
    const error_dat = (error) ? error : {
            "errormessage": "errormessage",
            "errorcode": null
        },
        errormessage = error_dat.errormessage,
        errorcode = (error_dat.errorcode) ? "Error: " + error_dat.errorcode : "";
    if (error.console) {
        console.log(errorcode + errormessage);
        return
    }
    if ($("#dialogbody .doselect").length) {
        return
    }
    if (apisrc) {
        const keyfail = (error.apikey === true),
            api_bttn = (keyfail === true) ? "<div id='add_api' data-api='" + apisrc + "' class='button'>" + translate("addapikey", {
                "apisrc": apisrc
            }) + "</div>" : "",
            t_op = (apisrc) ? "<span id='proxy_dialog' class='ref'>" + translate("tryotherproxy") + "</span>" : "",
            content = "<h2 class='icon-blocked'>" + errorcode + "</h2><p class='doselect'><strong>" + translate("error") + ": " + errormessage + "<br/><br/>" + t_op + "</p>" + api_bttn;
        popdialog(content, "canceldialog");
    }
}

function get_api_error_data(error) {
    if (error == false) {
        return false;
    }
    const error_type = typeof error,
        errorcode = (error.code) ? error.code :
        (error.status) ? error.status :
        (error.error_code) ? error.error_code : "",
        errormessage = (error.error) ? error.error :
        (error.message) ? error.message :
        (error.type) ? error.type :
        (error.error_message) ? error.error_message :
        (error.statusText) ? error.statusText : error,
        stringcheck = (error_type == "string"),
        cons = error.console;
    let skcheck; // string key check
    if (stringcheck === true) {
        skcheck = ((error.indexOf("API calls limits have been reached") >= 0)); // blockcypher
    }
    const apikey = ((errorcode === 101) || // fixer
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

function set_api_src(rdo, api_data) {
    const src = rdo.source;
    if (src == "list") {
        api_src(rdo.thislist, api_data);
    }
}

function api_src(thislist, api_data) {
    const api_url = api_data.url,
        api_url_short = (api_url) ? (api_url.length > 40) ? api_url.slice(0, 40) + "..." : api_url : "",
        aoi_name = (api_data.name),
        api_title = (aoi_name == "mempool.space") ? api_url : aoi_name,
        api_source = (api_title) ? api_title : api_url_short;
    thislist.data("source", api_source).find(".api_source").html("<span class='src_txt' title='" + api_url_short + "'>" + translate("source") + ": " + api_source + "</span><span class='icon-wifi-off'></span><span class='icon-connection'></span>");
}

function api_callback(requestid, nocache) {
    if (nocache == "afterscan") {
        close_paymentdialog(true);
        return
    }
    const thislist = $("#" + requestid);
    if (thislist.hasClass("scan")) {
        thislist.removeClass("scan open").addClass("pmstatloaded");
        if (nocache === true) {} else {
            const transactionlist = thislist.find(".transactionlist"),
                transactionli = transactionlist.find("li");
            if (transactionli.length) {
                const transactionpush = [];
                transactionli.each(function() {
                    const thisnode = $(this),
                        thisdata = thisnode.data(),
                        historic = thisdata.historic,
                        conf = thisdata.confirmations,
                        setconfirmations = thisdata.setconfirmations;
                    transactionpush.push(thisdata);
                    if (!historic || $.isEmptyObject(historic)) {} else {
                        const h_string = historic_data_title(thisdata.ccsymbol, thisdata.ccval, historic, setconfirmations, conf, false, thisdata.l2);
                        thisnode.append(hs_for(h_string)).attr("title", h_string);
                    }
                });
                const statuspanel = thislist.find(".pmetastatus"),
                    statusbox = {
                        "requestid": requestid,
                        "status": statuspanel.attr("data-count"),
                        "transactions": transactionpush
                    };
                glob_statuspush.push(statusbox);
            } else {
                const statusbox = {
                    "requestid": requestid,
                    "status": 0,
                    "transactions": []
                };
                glob_statuspush.push(statusbox);
            }
        }
        get_requeststates("loop");
    }
}

function get_rpc_inputs_init(rd, api_data) {
    const requestid = rd.requestid,
        rq_id = (requestid) ? requestid : "";
    glob_rpc_attempts[rq_id + api_data.url] = null; // reset api attempts
    get_rpc_inputs(rd, false, api_data);
}

function get_rpc_inputs(rd, rdod, api_data) {
    const rdo = (rdod) ? rdod : tx_data(rd),
        source = rdo.source;
    if (source == "poll") {
        select_rpc(rd, rdo, api_data);
        return
    }
    const thislist = rdo.thislist;
    if (thislist.hasClass("scan")) {
        const transactionlist = rdo.transactionlist;
        thislist.removeClass("no_network");
        if (rdo.pending == "no" || rdo.pending == "incoming" || thislist.hasClass("expired")) {
            transactionlist.find("li").each(function() {
                glob_tx_list.push($(this).data("txhash"));
            });
            api_callback(rd.requestid, true);
            return
        }
        if (rdo.pending == "scanning" || rdo.pending == "polling") {
            transactionlist.html("");
            select_rpc(rd, rdo, api_data);
        }
    }
}

function select_rpc(rd, rdo, api_dat) {
    const txhash = rd.txhash,
        requestid = rd.requestid,
        rq_id = (requestid) ? requestid : "",
        glob_l2 = glob_l2network[rq_id], // get cached l2 network
        api_data = (glob_l2) ? glob_l2 : api_dat;
    glob_rpc_attempts[rq_id + api_data.url] = true;
    if (is_btchain(rd.payment) === true) {
        mempoolspace_rpc(rd, api_data, rdo, true);
        return
    }
    if (rd.payment == "ethereum" || rd.erc20 === true) {
        if (rdo.pending == "scanning") { // scan incoming transactions on address
            handle_rpc_fails(rd, rdo, false, api_data, "scanl2"); // use api instead
            return
        }
        infura_txd_rpc(rd, api_data, rdo);
        return
    }
    if (rd.payment == "nano") {
        nano_rpc(rd, api_data, rdo);
        return
    }
    get_api_inputs_init(rd, api_data);
}

// RPC error handling

function handle_rpc_fails(rd, rdo, error, api_data, all_proxys) {
    const error_data = get_api_error_data(error),
        requestid = rd.requestid;
    if (!api_data) {
        api_eror_msg(false, error_data);
        api_callback(requestid);
        return
    }
    const api_url = api_data.url,
        nextrpc = get_next_rpc(rd.payment, api_url, requestid);
    let nextapi;
    if (nextrpc === false) {
        const api_name = api_data.name;
        nextapi = get_next_api(rd.payment, api_name, requestid);
        if (nextapi === false) { // try next proxy
            if (all_proxys === true) { // try next proxy
                const next_proxy = get_next_proxy();
                if (next_proxy) {
                    get_api_inputs(rd, rdo, api_data);
                    return;
                }
            }
            if (all_proxys === "scanl2") { // goo to next request when scanning for L2's
                api_callback(rd.requestid);
                return
            }
            const rpc_id = (api_name) ? api_name : (api_url) ? api_url : "unknown";
            api_eror_msg(rpc_id, error_data);
            return
        }
    }
    if (nextrpc) {
        get_rpc_inputs(rd, rdo, nextrpc);
    } else if (nextapi) {
        get_api_inputs(rd, rdo, nextapi);
    }
}

function get_next_rpc(this_payment, api_url, requestid) {
    const rpc_settings = cs_node(this_payment, "apis", true);
    if (rpc_settings) {
        const apilist = rpc_settings.apis,
            rpclist = rpc_settings.options,
            apirpc = $.grep(apilist, function(filter) {
                return !filter.api;
            }),
            restlist = (apirpc && rpclist) ? $.merge(apirpc, rpclist) : apirpc;
        if (!$.isEmptyObject(restlist)) {
            const next_scan = restlist[restlist.findIndex(option => option.url == api_url) + 1],
                next_rpc = (next_scan) ? next_scan : restlist[0],
                rq_id = (requestid) ? requestid : "";
            if (glob_rpc_attempts[rq_id + next_rpc.url] !== true) {
                return next_rpc;
            }
        }
    }
    return false;
}

function append_tx_li(txd, rqtype, ln) {
    const txhash = txd.txhash;
    if (txhash) {
        const ccval = txd.ccval,
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
            instant_lock = txd.instant_lock,
            conftitle = (instant_lock) ? "instant_lock" : conf + " / " + setconfirmations + " " + translate("confirmations"),
            checked_span = "<span class='icon-checkmark' title='" + conftitle + "'></span>",
            confspan = (conf) ? (confirmed) ? checked_span :
            "<div class='txli_conf' title='" + conftitle + "'><div class='confbar'></div><span>" + conftitle + "</span></div>" :
            "<div class='txli_conf' title='" + translate("unconfirmedtx") + "'><div class='confbar'></div><span>" + translate("unconfirmedtx") + "</span></div>",
            tx_listitem = $("<li><div class='txli_content'>" + date_format + confspan + "<div class='txli_conf txl_canceled'><span class='icon-blocked'></span>Canceled</div><span class='tx_val'> + " + valstr + " <span class='icon-eye show_tx' title='view on blockexplorer'></span></span></div></li>"),
            historic = txd.historic;
        if (historic) {
            const h_string = historic_data_title(ccsymbol, ccval, historic, setconfirmations, conf, true, txd.l2, instant_lock);
            tx_listitem.append(hs_for(h_string)).attr("title", h_string);
        }
        if (rqtype === false) {
            return tx_listitem;
        }
        if ($.inArray(txhash, glob_tx_list) !== -1) { // check for indexed transaction id's
            if (rqtype == "outgoing") {
                return null;
            }
            return tx_listitem;
        }
        glob_tx_list.push(txhash);
        return tx_listitem;
        clearscan();
    }
    return null;
}

function hs_for(dat) {
    return "<div class='historic_meta'>" + dat.split("\n").join("<br/>") + "</div>";
}

function historic_data_title(ccsymbol, ccval, historic, setconfirmations, conf, fromcache, l2, instant_lock) {
    const timestamp = historic.timestamp,
        price = historic.price;
    if (timestamp && price) {
        const fiatsrc = historic.fiatapisrc,
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
            conf_var = (instant_lock) ? "instant_lock" : (conf) ? conf + "/" + setconfirmations : "",
            cf_info = "\nConfirmations: " + conf_var,
            l2source = (l2) ? "\nLayer: " + l2 : "";
        return "Historic data (" + fulldateformat(new Date((timestamp - glob_timezone)), glob_langcode) + "):\nFiatvalue: " + lc_val.toFixed(2) + " " + lc_upper + "\n" + cc_upper + "-USD: " + price.toFixed(6) + "\n" + localrate + "\nSource: " + fiatsrc + "/" + src + cf_info + l2source;
    }
    const resp = translate("failedhistoric", {
        "ccsymbol": ccsymbol
    });
    notify(resp);
    return resp;
}

function compareamounts(rd) {
    const thisrequestid = rd.requestid,
        requestli = $("#" + thisrequestid),
        txlist = requestli.find(".transactionlist li"),
        txlist_length = txlist.length;
    if (txlist_length) {
        const lastlist = txlist.last(),
            firstinput = lastlist.data("transactiontime");
        if (firstinput) {
            const iscrypto = rd.iscrypto,
                pendingstatus = rd.pending,
                getconfirmations = rd.set_confirmations,
                getconfint = (getconfirmations) ? parseInt(getconfirmations) : 1,
                setconfirmations = (rd.lightning) ? 1 : getconfint, // set minimum confirmations to 1
                firstlist = txlist.first(),
                conf = firstlist.data("confirmations"),
                latestinput = firstlist.data("transactiontime"),
                offset = Math.abs(now() - (firstinput - glob_timezone)),
                one_tx = (txlist_length === 1) ? true : false,
                recent = (offset < 300000 && one_tx),
                cc_amount = parseFloat(rd.cc_amount),
                margin = 0.95;
            let recent_dat = false,
                tx_counter = 0,
                status_cc = "pending",
                pending_cc = pendingstatus,
                confirmed_cc = false,
                confirmations_cc = 0,
                paymenttimestamp_cc,
                txhash_cc,
                thissum_cc = 0,
                fiatvalue = rd.fiatvalue;
            if (iscrypto || recent) {
                const txreverse = (txlist_length > 1) ? txlist.get().reverse() : txlist;
                $(txreverse).each(function(i) {
                    tx_counter++;
                    const thisnode = $(this),
                        tn_dat = thisnode.data();
                    confirmations_cc = tn_dat.confirmations,
                        paymenttimestamp_cc = tn_dat.transactiontime,
                        txhash_cc = tn_dat.txhash,
                        thissum_cc += parseFloat(tn_dat.ccval) || 0; // sum of outputs
                    if (confirmations_cc >= setconfirmations || rd.no_conf === true) { // check all confirmations + whitelist for currencies unable to fetch confirmations
                        confirmed_cc = true;
                        if (thissum_cc >= cc_amount * margin) { // compensation for small fluctuations in rounding amount
                            thisnode.addClass("exceed").nextAll().addClass("exceed");
                            return
                        }
                    } else {
                        confirmed_cc = false;
                    }
                    const confbar = thisnode.find(".confbar");
                    if (confbar.length > 0) {
                        confbar.each(function(i) {
                            animate_confbar($(this), i);
                        });
                    };
                });
                if (thissum_cc >= cc_amount * margin) { // compensation for small fluctuations in rounding amount
                    if (confirmed_cc === false) { // check confirmations outside the loop
                        status_cc = "pending",
                            pending_cc = (one_tx && txhash_cc) ? "polling" : pendingstatus; // switch to tx polling if there's only one transaction and txhash is known
                    } else {
                        status_cc = "paid",
                            pending_cc = "no";
                    }
                } else {
                    status_cc = "insufficient",
                        pending_cc = "scanning";
                }
            }
            if (recent && !iscrypto) { // get local fiat rates when request is less then 15 minutes old
                const ccsymbol = rd.currencysymbol,
                    exchangerates = br_get_session("exchangerates", true),
                    cc_xrates = br_get_session("xrates_" + ccsymbol, true);
                if (exchangerates && cc_xrates) {
                    const fiat_exchangerates = exchangerates.fiat_exchangerates,
                        local_xrate = (fiat_exchangerates) ? fiat_exchangerates[rd.fiatcurrency] : null,
                        usd_eur_xrate = (fiat_exchangerates) ? fiat_exchangerates.usd : null;
                    if (local_xrate && usd_eur_xrate) {
                        const usd_rate = (cc_xrates) ? cc_xrates.ccrate : null;
                        if (usd_rate) {
                            const usdval = thissum_cc * usd_rate,
                                eurval = usdval / usd_eur_xrate;
                            fiatvalue = eurval * local_xrate,
                                recent_dat = true;
                        }
                    }
                } else {
                    init_historical_fiat_data(rd, conf, latestinput, firstinput);
                    return
                }
            }
            if (iscrypto || recent_dat) {
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
            init_historical_fiat_data(rd, conf, latestinput, firstinput);
            return
        }
    }
    api_callback(thisrequestid);
}

// get historic crypto rates

function init_historical_fiat_data(rd, conf, latestinput, firstinput) {
    const thisrequestid = rd.requestid,
        confcor = (conf) ? conf : 0,
        latestconf = (rd.no_conf === true) ? 0 : confcor, // only update on change
        hc_prefix = "historic_" + thisrequestid,
        historiccache = br_get_session(hc_prefix),
        cacheval = latestinput + latestconf;
    if ((cacheval - historiccache) > 1) { //new input detected; call historic api
        br_remove_session(hc_prefix); // remove historic price cache
        const historic_payload = $.extend(rd, {
            "latestinput": latestinput,
            "latestconf": latestconf,
            "firstinput": firstinput
        });
        const apilist = "historic_fiat_price_apis",
            fiatapi = $("#fiatapisettings").data("selected"),
            fiatapi_default = (fiatapi == "coingecko" || fiatapi == "coinbase") ? "fixer" : fiatapi; // exclude coingecko api"
        glob_api_attempt[apilist] = {}; // reset global historic fiat price api attempt
        get_historical_fiat_data(historic_payload, apilist, fiatapi_default);
        return
    }
    api_callback(thisrequestid);
}

function get_historical_fiat_data(rd, apilist, fiatapi) {
    glob_api_attempt[apilist][fiatapi] = true;
    const thisrequestid = rd.requestid,
        fiatcurrency = rd.fiatcurrency;
    if (fiatcurrency) {
        const lcsymbol = fiatcurrency.toUpperCase(),
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
            const data = br_result(e).result;
            if (data) {
                if (data.error) {
                    const next_historic = try_next_api(apilist, fiatapi);
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
                    const lcrate = (lcsymbol == "EUR") ? 1 : get_lcrate,
                        historic_api = $("#cmcapisettings").data("selected"),
                        picked_historic_api = (historic_api == "coinmarketcap") ? "coingecko" : historic_api, // default to "coingecko api"
                        init_apilist = "historic_crypto_price_apis";
                    glob_api_attempt[init_apilist] = {};
                    get_historical_crypto_data(rd, fiatapi, init_apilist, picked_historic_api, lcrate, usdrate, lcsymbol);
                    return
                }
                const next_historic = try_next_api(apilist, fiatapi);
                if (next_historic) {
                    get_historical_fiat_data(rd, apilist, next_historic);
                    return
                }
            }
            fail_dialogs(fiatapi, "unable to fetch " + lcsymbol + " exchange rate");
            api_callback(thisrequestid);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            const next_historic = try_next_api(apilist, fiatapi);
            if (next_historic) {
                get_historical_fiat_data(rd, apilist, next_historic);
                return
            }
            const error_object = (errorThrown) ? errorThrown : jqXHR;
            fail_dialogs(fiatapi, error_object);
            api_callback(thisrequestid);
        });
        return
    }
    api_callback(thisrequestid);
}

function get_historic_fiatprice_api_payload(fiatapi, lcsymbol, latestinput) {
    const dateformat = form_date(latestinput),
        payload = (fiatapi == "fixer") ? dateformat + "?symbols=" + lcsymbol + ",USD" :
        (fiatapi == "currencylayer") ? "historical?date=" + dateformat :
        dateformat + "?base=EUR"; // <- exchangeratesapi
    return payload;
}

function form_date(latestinput) {
    const dateobject = new Date(parseFloat(latestinput)),
        getmonth = dateobject.getUTCMonth() + 1,
        getday = dateobject.getUTCDate(),
        year = dateobject.getUTCFullYear(),
        month = (getmonth < 10) ? "0" + getmonth : getmonth,
        day = (getday < 10) ? "0" + getday : getday;
    return year + "-" + month + "-" + day;
}

function get_historical_crypto_data(rd, fiatapi, apilist, api, lcrate, usdrate, lcsymbol) {
    glob_api_attempt[apilist][api] = true;
    const thisrequestid = rd.requestid,
        thispayment = rd.payment,
        ccsymbol = rd.currencysymbol,
        latestinput = rd.latestinput,
        firstinput = rd.firstinput,
        coin_id = (api == "coincodex") ? ccsymbol : // coincodex id
        (api == "coingecko") ? thispayment : // coingecko id
        ccsymbol + "-" + thispayment, // coinpaprika id
        starttimesec = (firstinput - glob_timezone) / 1000,
        endtimesec = (latestinput - glob_timezone) / 1000,
        erc20_contract = rd.token_contract,
        history_api = api,
        search = (history_api == "coincodex") ? get_payload_historic_coincodex(coin_id, starttimesec, endtimesec) :
        (history_api == "coinmarketcap" || history_api == "coingecko") ? get_payload_historic_coingecko(coin_id, starttimesec, endtimesec, erc20_contract) :
        get_payload_historic_coinpaprika(coin_id, starttimesec, endtimesec);
    api_proxy({
        "api": api,
        "search": search,
        "proxy": true,
        "cachetime": 86400,
        "cachefolder": "1d",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const api_result = br_result(e).result,
            data = (api == "coingecko") ? (api_result) ? api_result.prices : null :
            (api == "coincodex") ? (api_result) ? api_result[ccsymbol.toUpperCase()] : null : api_result;
        if (data && !data.error) {
            const requestli = $("#" + thisrequestid),
                txlist = requestli.find(".transactionlist li"),
                txlist_length = txlist.length,
                txreverse = (txlist_length > 1) ? txlist.get().reverse() : txlist,
                latestconf = rd.latestconf,
                thisamount = rd.amount,
                getconfirmations = rd.set_confirmations,
                getconfint = (getconfirmations) ? parseInt(getconfirmations) : 1,
                lnd = rd.lightning,
                setconfirmations = (lnd) ? 1 : getconfint, // set minimum confirmations to 1
                iserc20 = rd.erc20,
                historicusdvalue = (thisamount / lcrate) * usdrate,
                margin = (historicusdvalue < 2) ? 0.60 : 0.95; // be flexible with small amounts
            let tx_counter = 0,
                conf = 0,
                paymenttimestamp,
                txhash,
                receivedcc = 0,
                receivedusd = 0,
                confirmed = false,
                status = "pending",
                pending = rd.pending;
            $(txreverse).each(function(i) {
                tx_counter++;
                const thisnode = $(this),
                    tn_dat = thisnode.data(),
                    thistimestamp = tn_dat.transactiontime,
                    thisvalue = tn_dat.ccval,
                    values = {
                        "fiatapisrc": fiatapi,
                        "apisrc": api,
                        "lcrate": lcrate,
                        "usdrate": usdrate,
                        "lcsymbol": lcsymbol,
                        "fetched": false
                    },
                    historic_object = compare_historic_prices(api, values, data, thistimestamp),
                    historic_price = historic_object.price;
                thisnode.data("historic", historic_object);
                conf = tn_dat.confirmations, // check confirmations
                    paymenttimestamp = thistimestamp,
                    txhash = tn_dat.txhash,
                    receivedcc += parseFloat(thisvalue) || 0; // sum of outputs CC
                if ((historic_price && (conf >= setconfirmations)) || rd.no_conf === true) { // check all confirmations + whitelist for currencies unable to fetch confirmations
                    confirmed = true;
                } else {
                    confirmed = false;
                }
                let thisusdsum = receivedusd += parseFloat(historic_price * thisvalue) || 0;
                if (thisusdsum >= historicusdvalue * margin) { //minus 5% dollar for volatility compensation
                    thisnode.addClass("exceed").nextAll().addClass("exceed");
                }
                const confbar = thisnode.find(".confbar");
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
                            pending = (tx_counter === 1 && txhash) ? "polling" : pending; // switch to tx polling if there's only one transaction and txhash is known
                    } else {
                        status = "paid",
                            pending = "no";
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
                const cacheval = latestinput + latestconf;
                if (pending == "no") {} else {
                    br_set_session("historic_" + thisrequestid, cacheval); // 'cache' historic data
                }
                api_callback(thisrequestid);
                return
            }
        }
        const next_historic = try_next_api(apilist, api);
        if (next_historic) {
            get_historical_crypto_data(rd, fiatapi, apilist, next_historic, lcrate, usdrate, lcsymbol);
            return
        }
        fail_dialogs(api, "error retrieving historical price data");
        api_callback(thisrequestid);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const next_historic = try_next_api(apilist, api);
        if (next_historic) {
            get_historical_crypto_data(rd, fiatapi, apilist, next_historic, lcrate, usdrate, lcsymbol);
            return
        }
        const error_object = (errorThrown) ? errorThrown : jqXHR;
        fail_dialogs(api, error_object);
        api_callback(thisrequestid);
    })
}

function get_payload_historic_coingecko(coin_id, starttime, endtime, erc20_contract) {
    const time_range = Math.abs(endtime - starttime),
        start_time = (time_range < 3600) ? 5200 : 3600; // compensation for minimum range
    if (erc20_contract) {
        return "coins/ethereum/contract/" + erc20_contract + "/market_chart/range?vs_currency=usd&from=" + (starttime - start_time) + "&to=" + (endtime + 3600); // expand range with one hour for error margin
    }
    return "coins/" + coin_id + "/market_chart/range?vs_currency=usd&from=" + (starttime - start_time) + "&to=" + (endtime + 3600); // expand range with one hour for error margin
}

function get_payload_historic_coinpaprika(coin_id, starttime, endtime) {
    const ts_start = starttime - 36000,
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
    const st_format = cx_date(starttime),
        et_format = cx_date(endtime),
        tquery = (starttime == endtime) ? st_format + "/" + st_format : st_format + "/" + et_format;
    return "get_coin_history/" + coin_id + "/" + tquery + "/" + 1000;
}

function cx_date(ts) {
    return new Date(ts * 1000).toISOString().split("T")[0];
}

function compare_historic_prices(api, values, price_array, thistimestamp) {
    $.each(price_array, function(i, value) {
        const historic_object = (api == "coincodex") ? get_historic_object_coincodex(value) :
            (api == "coingecko") ? get_historic_object_coingecko(value) :
            get_historic_object_coinpaprika(value);
        if (historic_object) {
            const historic_timestamp = historic_object.timestamp,
                historic_price = historic_object.price;
            if (historic_timestamp > thistimestamp) {
                values.timestamp = historic_timestamp,
                    values.price = historic_price,
                    values.fetched = true;
                return false;
            }
        }
    });
    if (values.fetched) {
        // check if historical prices are fetched succesfully, if true do nothing
    } else { // if no matching timestamp get latest
        const lastitem = price_array[price_array.length - 1],
            last_historic_object = (api == "coincodex") ? get_historic_object_coincodex(lastitem) :
            (api == "coingecko") ? get_historic_object_coingecko(lastitem) :
            get_historic_object_coinpaprika(lastitem);
        if (last_historic_object) {
            values.timestamp = last_historic_object.timestamp,
                values.price = last_historic_object.price,
                values.fetched = false;
        }
    }
    return values;
}

function get_historic_object_coincodex(value) {
    if (value) {
        return {
            "timestamp": ((value[0] * 1000) + glob_timezone) + 60000, // add 1 minute for compensation margin
            "price": value[1]
        }
    }
    return false;
}

function get_historic_object_coingecko(value) {
    if (value) {
        return {
            "timestamp": (value[0] + glob_timezone) + 60000, // add 1 minute for compensation margin
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