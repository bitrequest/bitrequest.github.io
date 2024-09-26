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
// Initializes the payment monitoring process for a transaction
function pick_monitor(txhash, tx_data, api_data) {
    glob_api_attempts = {};
    glob_rpc_attempts = {};
    api_monitor_init(txhash, tx_data, api_data);
}

// Initializes the API monitoring process with transaction and API data
function api_monitor_init(txhash, tx_data, api_dat) {
    const requestid = request.requestid,
        rq_id = requestid || "",
        glob_l2 = glob_l2network[rq_id], // get cached l2 network
        api_data = glob_l2 || api_dat,
        api_info = api_data || api_dat || q_obj(helper, "api_info.data");
    if (api_info) {
        api_monitor(txhash, tx_data, api_info);
        glob_paymentdialogbox.addClass("transacting");
        return
    }
    console.log("missing api info");
}

// Monitors the transaction status using the provided API data
function api_monitor(txhash, tx_data, api_dat) {
    const api_url = api_dat.url || api_dat.name;
    if (api_url) {
        const gets = geturlparameters();
        if (gets.xss) {
            return
        }
        const rdo = {
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
                "decimals": request.decimals,
                "requestid": request.requestid,
                "viewkey": request.viewkey
            };
        if (tx_data) {
            confirmations(tx_data, true);
            if (tx_data.setconfirmations === false) {
                return
            }
        };
        const to_time = tx_data ? 25000 : 100,
            timeout = setTimeout(function() {
                if (api_dat.api) {
                    select_api(rd, rdo, api_dat);
                } else {
                    select_rpc(rd, rdo, api_dat);
                }
            }, to_time, function() {
                clearTimeout(timeout);
            });
        return
    }
    console.log("No API selected");
}

// Handles transaction confirmations and updates the UI accordingly
function confirmations(tx_data, direct, ln) {
    const ccsymbol = tx_data.ccsymbol;
    if (ccsymbol) {
        let new_status = "pending";
        closeloader();
        clearTimeout(glob_request_timer);
        if (tx_data && tx_data.ccval) {
            const pmd = $("#paymentdialogbox"),
                brstatuspanel = pmd.find(".brstatuspanel"),
                brheader = brstatuspanel.find("h2"),
                status = tx_data.status;
            if (status && status === "canceled") {
                brheader.html("<span class='icon-blocked'></span>Invoice canceled");
                pmd.attr("data-status", "canceled");
                updaterequest({
                    "requestid": request.requestid,
                    "status": "canceled",
                    "confirmations": 0
                }, true);
                notify(translate("invoicecanceled"), 500000);
                forceclosesocket();
                return "canceled";
            }
            const setconfirmations = tx_data.setconfirmations ? parseInt(tx_data.setconfirmations, 10) : 0,
                conf_text = setconfirmations ? setconfirmations.toString() : "",
                confbox = brstatuspanel.find("span.confbox"),
                confboxspan = confbox.find("span"),
                currentconf = parseFloat(confboxspan.attr("data-conf")),
                xconf = tx_data.confirmations || 0,
                txhash = tx_data.txhash,
                layer = tx_data.l2 || "main",
                zero_conf = setconfirmations === false || tx_data.instant_lock; // Dashpay instant_lock

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
                    cc_raw = amount_rel && amount_rel.length ? parseFloat(amount_rel) : 0,
                    receivedutc = tx_data.transactiontime,
                    receivedtime = receivedutc - glob_timezone,
                    receivedcc = tx_data.ccval,
                    rccf = parseFloat(receivedcc.toFixed(6)),
                    thiscurrency = request.uoa,
                    requesttype = request.requesttype,
                    iscrypto = thiscurrency === ccsymbol,
                    fiatvalue = iscrypto ? null : (rccf / parseFloat($("#paymentdialogbox .ccpool").attr("data-xrate"))) * parseFloat($("#paymentdialog .cpool[data-currency='" + thiscurrency + "']").attr("data-xrate")), // calculate fiat value
                    fiatrounded = iscrypto ? null : fiatvalue.toFixed(2),
                    receivedrounded = iscrypto ? receivedcc : fiatrounded;

                // extend global request object
                $.extend(request, {
                    "received": true,
                    "inout": requesttype,
                    "receivedamount": rccf,
                    "fiatvalue": fiatvalue,
                    "paymenttimestamp": receivedutc,
                    "txhash": txhash,
                    "confirmations": xconf,
                    "set_confirmations": setconfirmations,
                    "layer": layer
                });

                brstatuspanel.find("span.paymentdate").html(fulldateformat(new Date(receivedtime), glob_langcode));
                if (!iscrypto) {
                    brstatuspanel.find("span.receivedcrypto").text(rccf + " " + ccsymbol);
                }
                brstatuspanel.find("span.receivedfiat").text(" (" + receivedrounded + " " + thiscurrency + ")");

                const exact = helper.exact,
                    xmr_pass = ccsymbol === "xmr" ? (rccf > (cc_raw * 0.97) && rccf < (cc_raw * 1.03)) : true; // error margin for xmr integrated addresses

                if (xmr_pass) {
                    const pass = exact && (rccf == cc_raw) ? true : (rccf >= (cc_raw * 0.97));
                    if (pass) {
                        if (xconf >= setconfirmations || zero_conf === true) {
                            forceclosesocket();
                            playsound(ccsymbol === "doge" ? glob_howl : glob_cashier);
                            const status_text = requesttype === "incoming" ? translate("paymentsent") : translate("paymentreceived");
                            pmd.addClass("transacting").attr("data-status", "paid");
                            brheader.text(status_text);
                            request.status = "paid",
                                request.pending = "polling";
                            saverequest(direct);
                            $("span#ibstatus").fadeOut(500);
                            closenotify();
                            new_status = "paid";
                        } else {
                            if (!ln) {
                                playsound(glob_blip);
                            }
                            pmd.addClass("transacting").attr("data-status", "pending");
                            const bctext = ln ? translate("waitingforpayment") : translate("txbroadcasted");
                            brheader.text(bctext);
                            request.status = "pending",
                                request.pending = "polling";
                            saverequest(direct);
                        }
                        brstatuspanel.find("#view_tx").attr("data-txhash", txhash);
                        return new_status
                    }
                    if (!exact) {
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
    return false;
}

// Resets recent requests and cancels the current dialog
function reset_recent() {
    if (request) {
        const ls_recentrequests = br_get_local("recent_requests");
        if (ls_recentrequests) {
            try {
                const lsrr_arr = JSON.parse(ls_recentrequests);
                if (lsrr_arr[request.payment]) {
                    delete lsrr_arr[request.payment];
                    br_set_local("recent_requests", lsrr_arr, true);
                    if ($.isEmptyObject(lsrr_arr)) {
                        toggle_rr(false);
                    }
                }
            } catch (error) {
                console.error("Error parsing recent requests:", error);
            }
        }
    }
    canceldialog();
}

// Handles post-scan operations for various cryptocurrencies and APIs
function after_scan(rq_init, next_api) {
    const amount_input = $("#mainccinputmirror > input"),
        input_val = amount_input.val(),
        api_info = helper.api_info,
        api_data = next_api || api_info.data,
        ccsymbol = request.currencysymbol,
        api_name = api_data.name,
        request_ts_utc = rq_init + glob_timezone,
        request_ts = request_ts_utc - 30000, // 30 seconds compensation for unexpected results
        thislist = $("#" + request.requestid),
        statuspanel = thislist.find(".pmetastatus"),
        set_confirmations = request.set_confirmations || 0,
        rdo = {
            "thislist": thislist,
            "statuspanel": statuspanel,
            "request_timestamp": request_ts,
            "setconfirmations": set_confirmations,
            "pending": "scanning",
            "erc20": request.erc20,
            "source": "afterscan"
        };
    glob_scan_attempts[api_name] = true;
    if (input_val.length) {
        if (ccsymbol === "xmr" || ccsymbol === "nim" || request.erc20) {
            close_paymentdialog();
            return
        }
        ap_loader();
        if (ccsymbol === "xno") {
            nano_rpc(request, api_data, rdo);
            return
        }
        if (api_name === "mempool.space") {
            mempoolspace_rpc(request, api_data, rdo, false);
            return
        }
        if (api_name === "blockcypher") {
            blockcypher_fetch(request, api_data, rdo);
            return
        }
        if (api_name === "dash.org") {
            insight_fetch_dash(request, api_data, rdo);
            return
        }
        if (api_name === "blockchair") {
            blockchair_fetch(request, api_data, rdo);
            return
        }
        if (payment === "kaspa") {
            kaspa_fetch(request, api_data, rdo);
            return
        }
        if (ccsymbol === "btc" || ccsymbol === "ltc" || ccsymbol === "doge" || ccsymbol === "bch") {
            if (api_data.default === false) {
                mempoolspace_rpc(request, api_data, rdo, true);
                return
            }
        }
    }
    close_paymentdialog();
}

// Displays a loader with a custom message during the scanning process
function ap_loader() {
    loader(true);
    loadertext(translate("closingrequest") + " / " + translate("scanningforincoming"));
}

// Handles the case when a scan fails and attempts to use the next available API
function after_scan_fails(api_name) {
    const nextapi = get_next_scan_api(api_name);
    if (nextapi) {
        after_scan(request.rq_init, nextapi);
        return
    }
    close_paymentdialog(true);
}

// Retrieves the next available API for scanning based on the current API name
function get_next_scan_api(api_name) {
    const rpc_settings = cs_node(request.payment, "apis", true);
    if (rpc_settings) {
        const apirpc = rpc_settings.apis,
            apilist = apirpc.filter(filter => filter.api);

        if (apilist.length) {
            const currentIndex = apilist.findIndex(option => option.name === api_name),
                next_api = apilist[(currentIndex + 1) % apilist.length];
            if (!glob_scan_attempts[next_api.name]) {
                return next_api;
            }
        }
    }
    return false;
}