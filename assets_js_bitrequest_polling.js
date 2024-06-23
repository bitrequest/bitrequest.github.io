// pick API / RPC

//pick_monitor
//api_monitor_init
//api_monitor
//confirmations
//reset_recent

//after_scan
//ap_loader
//after_scan_fails
//get_next_scan_api

// pick API / RPC
function pick_monitor(txhash, tx_data, api_data) {
    glob_api_attempts = {};
    glob_rpc_attempts = {};
    api_monitor_init(txhash, tx_data, api_data);
}

function api_monitor_init(txhash, tx_data, api_dat) {
    const requestid = request.requestid,
        fetchid = (txhash) ? txhash : (requestid) ? requestid : "",
        glob_l2 = glob_l2network[fetchid], // get cached l2 network
        api_data = (glob_l2) ? glob_l2 : api_dat,
        api_info = (api_data) ? api_data : q_obj(helper, "api_info.data");
    if (api_info) {
        api_monitor(txhash, tx_data, api_info);
        glob_paymentdialogbox.addClass("transacting");
        return
    }
    console.log("missing api info");
}

function api_monitor(txhash, tx_data, api_dat) {
    const api_name = api_dat.name;
    if (api_name) {
        const gets = geturlparameters(),
            rdo = {
                "pending": "polling",
                "txdat": tx_data,
                "source": "poll",
                "setconfirmations": request.set_confirmations
            },
            rd = {
                "payment": request.payment,
                "txhash": txhash,
                "currencysymbol": request.currencysymbol,
                "address": gets.address,
                "decimals": request.decimals
            };
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
        };
        const to_time = (tx_data) ? 25000 : 100,
            timeout = setTimeout(function() {
                if (api_dat.api === true) {
                    select_api(rd, rdo, api_dat);
                } else {
                    select_rpc(rd, rdo, api_dat);
                }
            }, to_time, function() {
                clearTimeout(timeout);
            });
    }
    console.log("No API selected");
}

function confirmations(tx_data, direct, ln) {
    let new_status = "pending";
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
            new_status = "canceled";
            return new_status;
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
        new_status = xconf;
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
                        new_status = "paid";
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
                    return new_status
                }
                if (exact) {} else {
                    brheader.text(translate("insufficientamount"));
                    pmd.addClass("transacting").attr("data-status", "insufficient");
                    request.status = "insufficient",
                        request.pending = "scanning";
                    saverequest(direct);
                    brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                    new_status = "insufficient";
                }
                playsound(glob_funk);
            }
        }
    }
    return new_status;
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

function after_scan(rq_init, next_api) {
    const amount_input = $("#mainccinputmirror > input"),
        input_val = amount_input.val(),
        api_info = helper.api_info,
        api_data = (next_api) ? next_api : api_info.data,
        ccsymbol = request.currencysymbol,
        api_name = api_data.name,
        request_ts_utc = rq_init + glob_timezone,
        request_ts = request_ts_utc - 30000, // 30 seconds compensation for unexpected results
        thislist = $("#" + request.requestid),
        statuspanel = thislist.find(".pmetastatus"),
        set_confirmations = request.set_confirmations ?? 0,
        set_cc = (set_confirmations) ? set_confirmations : 0,
        rdo = {
            "thislist": thislist,
            "statuspanel": statuspanel,
            "request_timestamp": request_ts,
            "setconfirmations": set_cc,
            "pending": "scanning",
            "erc20": request.erc20,
            "source": "afterscan"
        };
    glob_scan_attempts[api_name] = true;
    if (input_val.length) {
        if (ccsymbol == "xmr" || ccsymbol == "nim" || request.erc20 === true) {
            close_paymentdialog();
            return
        }
        if (ccsymbol == "xno") {
            ap_loader();
            nano_rpc(request, api_data, rdo);
            return
        }
        if (api_name == "mempool.space") {
            ap_loader();
            mempoolspace_rpc(request, api_data, rdo, false);
            return
        }
        if (api_name == "blockcypher") {
            ap_loader();
            blockcypher_fetch(request, api_data, rdo);
            return
        }
        if (api_name == "blockchair") {
            ap_loader();
            blockchair_fetch(request, api_data, rdo);
            return
        }
        if (payment == "kaspa") {
            ap_loader();
            kaspa_fetch(request, api_data, rdo);
            return
        }
        if (ccsymbol == "btc" || ccsymbol == "ltc" || ccsymbol == "doge" || ccsymbol == "bch") {
            if (api_data.default === false) {
                ap_loader();
                mempoolspace_rpc(request, api_data, rdo, true);
                return
            }
        }
    }
    close_paymentdialog();
}

function ap_loader() {
    loader(true);
    loadertext(translate("closingrequest") + " / " + translate("scanningforincoming"));
}

function after_scan_fails(api_name) {
    const nextapi = get_next_scan_api(api_name);
    if (nextapi) {
        after_scan(request.rq_init, nextapi);
        return
    }
    close_paymentdialog(true);
}

function get_next_scan_api(api_name) {
    const rpc_settings = cs_node(request.payment, "apis", true);
    if (rpc_settings) {
        const apirpc = rpc_settings.apis,
            apilist = $.grep(apirpc, function(filter) {
                return filter.api;
            })
        if (!$.isEmptyObject(apilist)) {
            const next_scan = apilist[apilist.findIndex(option => option.name == api_name) + 1],
                next_api = (next_scan) ? next_scan : apilist[0];
            if (glob_scan_attempts[next_api.name] !== true) {
                return next_api;
            }
        }
    }
    return false;
}