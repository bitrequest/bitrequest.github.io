//globals
var txid,
    ping,
    pingtx,
    websocket,
    cacheperiodcrypto = 120000, //120000 = 2 minutes
    cacheperiodfiat = 600000, //600000 = 10 minutes
    zeroplaceholder = parseFloat((0.00).toLocaleString(language, {
        "minimumFractionDigits": 2,
        "maximumFractionDigits": 2
    })).toFixed(2),
    // Global helpers
    block_swipe,
    percent,
    sa_timer,
    payment,
    request,
    request_timer,
    blocktyping = false,
    lnd_ph = false;

$(document).ready(function() {
    wake_panel();
    //set_request_timer
    swipestart();
    //swipe
    swipeend();
    flipstart();
    //flip
    flipend();
    //flip_right1
    //flip_right2
    //flip_left1
    //flip_left2
    //flip_reset1
    //flip_reset2
    //add_flip
    //remove_flip
    //face_front
    //face_back

    // ** Paymentdialog **

    //loadpaymentfunction
    //get_tokeninfo
    //continue_paymentfunction
    //lightning_setup
    //test_lnd
    //proceed_pf
    //getccexchangerates
    //initexchangerate
    //get_fiat_exchangerate
    //rendercurrencypool
    //getpayment
    //cc_fail
    //show_paymentdialog
    //main_input_focus
    lnd_switch_function();
    ndef_switch_function();
    //lnd_statusx
    lnd_offline();
    lnd_ni();
    //lnd_popup
    pickcurrency();
    //rendercpooltext
    pushamount();
    pushlcamount();
    pushccamount();
    pushsatamount();
    //reflectfiatvalue
    //reflectlcvalue
    //reflectccvalue
    //reflectsatvalue
    //reflectinputs
    //cryptovalue
    reflectinput();
    //updatecpool
    //rendercpool
    //renderqr
    //set_uris
    //set_lnd_qr
    //set_lnd_uris
    switchaddress();
    copyaddress_dblclick();
    copyaddress();
    copyinputs();
    xmrsettings();
    //validaterequestdata
    inputrequestdata();
    validatesteps();
    fliprequest();
    revealtitle();
    //check_pending
    //pendingrequest
    view_pending_tx();
    pickaddressfromdialog();
    //set_edit
    addaddressfromdialog();
    add_from_seed();
    scanqr();
    showapistats();
    hideapistats();
    sharebutton();
    //share
    //sharerequest
    //sharefallback
    whatsappshare();
    mailto();
    copyurl();
    gmailshare();
    telegramshare();
    outlookshare();
    //getshareinfo
    //sharecallback
    //open_share_url
    trigger_open_tx();
    view_tx();
    //open_tx

    //saverequest
    //pendingdialog
    //adjust_paymentdialog
    openwallet();
    openwalleturl();
    dw_trigger();
    //download_wallet
    //updaterequest
    //xmr_integrated
});

// ** Swipe payment dialog **

function wake_panel() {
    $(document).on("mousedown touchstart", "#paymentdialogbox", function() {
        set_request_timer();
    })
}

function set_request_timer() {
    // close request dialog after 3 minutes
    clearTimeout(request_timer);
    request_timer = setTimeout(function() {
        cpd_pollcheck();
    }, 180000, function() {
        clearTimeout(request_timer);
    });
}

function swipestart() {
    $(document).on("mousedown touchstart", "#paymentdialog", function(e) {
        blockswipe = false;
        var thisdialog = $(this),
            inputs = thisdialog.find("input");
        if (inputs.is(":focus")) {
            blockswipe = true;
        }
        var startheight = (e.originalEvent.touches) ? e.originalEvent.touches[0].pageY : e.pageY;
        startswipetime = now();
        swipe(thisdialog.height(), startheight);
    })
}

function swipe(dialogheight, startheight) {
    $(document).on("mousemove touchmove", "#payment", function(e) {
        if (blockswipe === true) {
            unfocus_inputs();
            return
        }
        var currentheight = (e.originalEvent.touches) ? e.originalEvent.touches[0].pageY : e.pageY,
            dragdistance = currentheight - startheight;
        if (dragdistance > 3 || dragdistance < -3) { // margin to activate swipe
            html.addClass("swipemode");
            var distance = dragdistance / dialogheight,
                posdist = 1 - Math.abs(distance);
            percent = distance * 100;
            $(this).addClass("swiping");
            $("#paymentdialog").css({
                "opacity": posdist,
                "-webkit-transform": "translate(0, " + percent + "%)"
            });
        }
    })
}

function swipeend() {
    $(document).on("mouseup mouseleave touchend", "#payment", function() {
        $(document).off("mousemove touchmove", "#payment");
        var thisunit = $(this);
        if (thisunit.hasClass("swiping")) {
            var paymentdialog = $("#paymentdialog"),
                swipetime = now() - startswipetime,
                largeswipe = (percent > 90 || percent < -90),
                smallswipe = (percent > 25 || percent < -25);
            if (largeswipe === true || (smallswipe === true && swipetime < 500)) {
                thisunit.removeClass("swiping");
                paymentdialog.css({
                    "opacity": "",
                    "-webkit-transform": ""
                });
                cpd_pollcheck();
                html.removeClass("swipemode");
            } else {
                thisunit.removeClass("swiping");
                paymentdialog.css({
                    "opacity": "",
                    "-webkit-transform": ""
                });
                html.removeClass("swipemode");
            }
        }
    })
}

// ** Flip payment dialog **

function flipstart() {
    $(document).on("mousedown touchstart", "#paymentdialog", function(e) {
        if (paymentdialogbox.hasClass("norequest")) {
            if (offline === true) {
                return
            }
            var is_lnd = (paymentdialogbox.attr("data-lswitch") == "lnd_ao");
            if (paymentdialogbox.attr("data-pending") == "ispending" && !is_lnd) {
                return
            }
            if (is_lnd && paymentdialogbox.hasClass("accept_lnd")) {
                return
            }
        }
        var startwidth = (e.originalEvent.touches) ? e.originalEvent.touches[0].pageX : e.pageX;
        flip($(this).width(), startwidth);
    })
}

function flip(dialogwidth, startwidth) {
    $(document).on("mousemove touchmove", "#payment", function(e) {
        html.addClass("flipmode");
        var currentwidth = (e.originalEvent.touches) ? e.originalEvent.touches[0].pageX : e.pageX,
            dragdistance = currentwidth - startwidth;
        if (dragdistance > 3 || dragdistance < -3) { // margin to activate flip (prevent sloppy click)
            html.addClass("swipemode");
            $(this).addClass("flipping");
            var startangle = (paymentdialogbox.hasClass("flipped")) ? 180 : 0;
            paymentdialogbox.css("-webkit-transform", "rotateY(" + startangle + "deg)");
            var preangle = 180 * dragdistance / dialogwidth;
            angle = (paymentdialogbox.hasClass("flipped")) ? 180 + preangle : preangle;
            paymentdialogbox.css("-webkit-transform", "rotateY(" + angle + "deg)");
        }
    })
}

function flipend() {
    $(document).on("mouseup mouseleave touchend", "#payment", function() {
        var thisunit = $(this);
        $(document).off("mousemove touchmove", paymentpopup);
        if (thisunit.hasClass("flipping")) {
            if (paymentdialogbox.hasClass("flipped")) {
                if (angle > 250) {
                    flip_right2();
                } else if (angle < 110) {
                    flip_left2();
                } else {
                    flip_reset1();
                }
            } else {
                if (angle > 70) {
                    flip_right1();
                } else if (angle < -70) {
                    flip_left1();
                } else {
                    flip_reset2();
                }
            }
            thisunit.removeClass("flipping");
            html.removeClass("swipemode");
        }
        setTimeout(function() {
            html.removeClass("flipmode");
        }, 270);
    })
}

function flip_right1() {
    add_flip();
    face_back();
}

function flip_right2() {
    paymentdialogbox.css("-webkit-transform", "rotateY(360deg)").removeClass("flipped");
    face_front();
}

function flip_left1() {
    paymentdialogbox.css("-webkit-transform", "rotateY(-180deg)").addClass("flipped");
    face_back();
}

function flip_left2() {
    remove_flip();
    face_front();
}

function flip_reset1() {
    paymentdialogbox.css("-webkit-transform", "");
    //face_back();
}

function flip_reset2() {
    paymentdialogbox.css("-webkit-transform", "rotateY(0deg)");
    //face_front();
}

function add_flip() {
    paymentdialogbox.css("-webkit-transform", "rotateY(180deg)").addClass("flipped");
}

function remove_flip() {
    paymentdialogbox.css("-webkit-transform", "rotateY(0deg)").removeClass("flipped");
}

function face_front() {
    if (request) {
        if (request.isrequest === false) {
            var sharebutton = $("#sharebutton"),
                requesttitle = $("#requesttitle"),
                requestname = $("#requestname"),
                amountinput = $("#amountbreak input");
            if (sharebutton.hasClass("sbactive")) {
                if (amountinput.val().length > 0 && supportsTouch === true) {
                    setTimeout(function() {
                        requesttitle.add(requestname).blur();
                    }, 300);
                    return
                }
                setTimeout(function() {
                    amountinput.focus();
                }, 300);
                return
            }
            setTimeout(function() {
                requesttitle.attr("placeholder", "eg: " + requesttitle.attr("data-ph" + getrandomnumber(1, 13)));
                amountinput.focus();
            }, 300);
            return
        }
        if (request.iszero_request === true) {
            setTimeout(function() {
                $("#amountbreak input").focus();
            }, 300);
        }
    }
}

function face_back() {
    if (request) {
        if (request.isrequest === false) {
            var requesttitle = $("#requesttitle"),
                requestname = $("#requestname");
            if (requestname.val().length < 3) {
                setTimeout(function() {
                    requestname.focus();
                }, 300);
                return
            }
            if (requesttitle.val().length < 2) {
                setTimeout(function() {
                    requesttitle.focus();
                }, 300);
                return
            }
            var amountinput = $("#amountbreak input");
            if (amountinput.val().length > 0 && supportsTouch === true) {
                setTimeout(function() {
                    amountinput.add(requesttitle).add(requestname).blur();
                }, 300);
                return
            }
            setTimeout(function() {
                requesttitle.focus();
            }, 300);
            return
        }
        if (request.iszero_request === true) {
            setTimeout(function() {
                $("#paymentdialog #shareamount input:visible:first").focus();
            }, 300);
        }
    }
}

// ** Paymentdialog **

//loadpayment (check for crypto rates)

function loadpaymentfunction(pass) {
    if ($("#request_front").length > 0) { // prevent double load
        return
    }
    loader();
    symbolcache = localStorage.getItem("bitrequest_symbols");
    if (symbolcache) {
        var gets = geturlparameters(),
            contactform = exists(gets.contactform);
        if (contactform && pass !== true) { // show contactform
            edit_contactform(true);
            return
        }
        var payment = gets.payment,
            coindata = getcoindata(payment);
        if (coindata) {
            var iserc20 = (coindata.erc20 === true),
                request_start_time = now(),
                exact = (gets.exact !== undefined);
            request = {
                    "received": false,
                    "rq_init": request_start_time,
                    "rq_timer": request_start_time,
                    "payment": payment,
                    "coindata": coindata,
                    "erc20": iserc20
                }, // global request object
                helper = {
                    "exact": exact,
                    "contactform": contactform,
                    "lnd": false,
                    "lnd_status": false
                },
                api_attempt["crypto_price_apis"] = {},
                api_attempt["fiat_price_apis"] = {},
                socket_attempt = {};
            if (iserc20 === true) {
                var token_contract = coindata.contract;
                if (token_contract) {
                    request.token_contract = token_contract;
                    get_tokeninfo(payment, token_contract);
                    return
                }
                var content = "<h2 class='icon-blocked'>Unable to get token data</h2>";
                popdialog(content, "canceldialog");
                closeloader();
                return
            }
            continue_paymentfunction();
            return
        }
        var content = "<h2 class='icon-blocked'>Currency not supported</h2>";
        popdialog(content, "canceldialog");
        closeloader();
        return
    } // need to set fixer API key first
    api_eror_msg("fixer", {
        "errormessage": "Missing API key",
        "errorcode": "300"
    }, true);
}

function get_tokeninfo(payment, contract) {
    var getcache = localStorage.getItem("bitrequest_decimals_" + payment);
    if (getcache) { // check for cached values
        request.decimals = getcache;
        continue_paymentfunction();
        return
    }
    loadertext("get token info");
    api_proxy({
        "api": "ethplorer",
        "search": "getTokenInfo/" + contract,
        "cachetime": 86400,
        "cachefolder": "1d",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        var data = br_result(e).result,
            error = data.error;
        if (error) {
            cancelpaymentdialog();
            fail_dialogs("ethplorer", error);
            return
        }
        var decimals = data.decimals;
        request.decimals = decimals;
        continue_paymentfunction();
        localStorage.setItem("bitrequest_decimals_" + payment, decimals); //cache token decimals
    }).fail(function(jqXHR, textStatus, errorThrown) {
        cancelpaymentdialog();
        var error_object = (errorThrown) ? errorThrown : jqXHR;
        fail_dialogs("ethplorer", error_object);
        closeloader();
    });
}

function continue_paymentfunction() {
    //set globals
    var payment = request.payment,
        erc20 = request.erc20,
        gets = geturlparameters(),
        address = gets.address,
        currencycheck = (erc20 === true) ? "ethereum" : payment,
        data = gets.d,
        isdata = (data && data.length > 5),
        dataobject = (isdata === true) ? JSON.parse(atob(data)) : null, // decode data param if exists;
        ln = (dataobject && dataobject.imp) ? true : false, // check for lightning;
        lnd_only = (address == "lnurl") ? true : false,
        valid = (lnd_only && ln) ? true : check_address(address, currencycheck); // validate address   
    if (valid === false) {
        var error_message = (address == "undefined") ? "Undefined address, please ask for a new request" :
            "Invalid " + payment + " address",
            content = "<h2 class='icon-blocked'>" + error_message + "</h2>";
        popdialog(content, "canceldialog");
        closeloader();
        return
    }
    var api_info = check_api(payment, erc20),
        isrequest = (localStorage.getItem("bitrequest_editurl") !== w_loc.search), // check if url is a request
        coindata = request.coindata,
        coinsettings = activecoinsettings(payment),
        uoa = gets.uoa,
        amount = Number(gets.amount),
        type = gets.type,
        viewkey = false,
        sharevk = false,
        payment_id = (dataobject && dataobject.pid) ? dataobject.pid : false,
        lightning_id = (dataobject && dataobject.lid) ? dataobject.lid : false,
        xmr_ia = address;
    if (payment == "monero") { // check for monero viewkey
        coindata.monitored = false;
        var viewkey = (dataobject && dataobject.vk) ? {
                "account": address,
                "vk": dataobject.vk
            } : get_vk(address),
            sharevk = share_vk(),
            payment_id = (payment_id) ? payment_id : (isrequest) ? false : get_xmrpid();
        xmr_ia = xmr_integrated(address, payment_id);
    }
    var currencysymbol = coindata.ccsymbol,
        requesttype = (isrequest === true) ? (type) ? type :
        (inframe === true) ? "checkout" :
        "incoming" : "local",
        typecode = (requesttype == "local") ? 1 :
        (requesttype == "outgoing" || requesttype == "incoming") ? 2 :
        (requesttype == "checkout") ? 3 : 4,
        iscrypto = (uoa == currencysymbol),
        localcurrency = $("#currencysettings").data("currencysymbol"), // can be changed in (settings)
        fiatcurrency = (iscrypto === true) ? localcurrency : uoa,
        statusparam = gets.status,
        status = (statusparam) ? statusparam : "new",
        paid = (status) ? (status == "paid") ? true : false : null,
        cmcid = coindata.cmcid,
        cpid = currencysymbol + "-" + payment,
        ispending = check_pending(xmr_ia, cmcid),
        monitored = (viewkey) ? true : coindata.monitored,
        pendingparam = gets.pending,
        pending = (pendingparam) ? pendingparam : (monitored === true) ? "incoming" : "unknown",
        socket_list = (coinsettings) ? coinsettings.websockets : null,
        selected_socket = (socket_list) ? (socket_list.selected) ? socket_list.selected : null : null,
        requesttimestamp = (dataobject && dataobject.ts) ? dataobject.ts : null,
        requestname = (dataobject && dataobject.n) ? dataobject.n : null,
        requesttitle = (dataobject && dataobject.t) ? dataobject.t : null,
        current_conf = (coinsettings) ? coinsettings.confirmations : 0,
        no_conf = (!current_conf || monitored === false),
        set_confirmations = (dataobject && dataobject.c) ? parseFloat(dataobject.c) : (no_conf === true) ? 0 : current_conf.selected,
        instant = (!set_confirmations),
        pagenameccparam = (iscrypto === true) ? "" : payment + " ",
        pagename = (requestname) ? requestname + " sent a " + pagenameccparam + "payment request of " + amount + " " + uoa + " for " + requesttitle : pagenameccparam + "payment request for " + amount + " " + uoa,
        requestclass = (isrequest === true) ? "request" : "norequest", //set classnames for request
        iszero = (amount === 0 || isNaN(amount)),
        iszero_request = (isrequest === true && iszero === true),
        iszeroclass = (iszero_request === true) ? " iszero" : "",
        showclass = (iscrypto === true) ? (uoa == "btc") ? " showsat showlc showcc" : " showlc showcc" : (uoa == fiatcurrency) ? "" : " showlc",
        statusattr = (status) ? status : "unknown",
        statusclass = (status) ? " " + status : " unknown",
        satclass = (payment == "bitcoin" && cs_dat("bitcoin", "showsatoshis").selected === true) ? true : false,
        typeclass = " " + requesttype,
        offlineclass = (offline === true) ? " br_offline" : "",
        pendingclass = (ispending === true && monitored === true && requesttype == "local") ? "ispending" : "",
        has_xmr_ia = (xmr_ia == address) ? false : xmr_ia,
        extend_data = {
            "uoa": uoa,
            "amount": amount,
            "address": address,
            "currencysymbol": currencysymbol,
            "cmcid": cmcid,
            "cpid": cpid,
            "status": status,
            "pending": pending,
            "paid": paid,
            "isrequest": isrequest,
            "requesttype": requesttype,
            "typecode": typecode,
            "iscrypto": iscrypto,
            "localcurrency": localcurrency,
            "fiatcurrency": fiatcurrency,
            "requestname": requestname,
            "requesttitle": requesttitle,
            "set_confirmations": set_confirmations,
            "no_conf": no_conf,
            "instant": instant,
            "shared": (isrequest === true && requesttimestamp !== null), // check if request is from a shared source,
            "iszero": iszero,
            "iszero_request": iszero_request,
            "viewkey": viewkey,
            "share_vk": sharevk,
            "payment_id": payment_id,
            "lightning_id": lightning_id,
            "xmr_ia": has_xmr_ia,
            "monitored": monitored,
            "coinsettings": coinsettings,
            "dataobject": dataobject
        },
        extend_helper_data = {
            "socket_list": socket_list,
            "selected_socket": selected_socket,
            "requestclass": requestclass,
            "iszeroclass": iszeroclass,
            "currencylistitem": $("#currencylist > li[data-currency='" + payment + "'] .rq_icon"),
            "api_info": api_info,
            "lnd_only": lnd_only
        },
        payment_attributes = {
            "data-cmcid": cmcid,
            "data-currencysymbol": currencysymbol,
            "data-status": statusattr,
            "data-showsat": satclass,
            "data-pending": pendingclass,
            "class": requestclass + statusclass + showclass + typeclass + offlineclass + iszeroclass
        },
        lnd_switch = (payment == "bitcoin") ? (isrequest && !ln) ? "" : "<div id='lightning_switch' title='lightning' class='lnswitch'><span class='icon-power'></span></div>" : "",
        ndef_switch = (payment == "bitcoin" && ndef) ? "<div id='ndef_switch' title='Tap to pay' class='lnswitch'><span class='icon-connection'></span></div>" : "";
    settitle(pagename + " | " + apptitle);
    paymentdialogbox.append("<div id='request_back' class='share_request dialogstyle'></div><div id='request_front' class='dialogstyle'><div id='xratestats'><span id='rq_errlog'></span></div>" + ndef_switch + lnd_switch + "</div>").attr(payment_attributes);
    // Extend global request object
    $.extend(request, extend_data);
    // Extend global helper object
    $.extend(helper, extend_helper_data);
    if (payment == "bitcoin") {
        lightning_setup();
    } else {
        proceed_pf();
    }
}

// Check for lightning

function lightning_setup() {
    if (request.isrequest === true) {
        var dataobject = request.dataobject;
        if (dataobject) {
            var imp = dataobject.imp;
            if (imp) { //lightning request
                loadertext("check " + imp + " lightning status");
                var phd = dataobject.proxy,
                    host = dataobject.host,
                    key = dataobject.key,
                    dprox = (phd) ? phd : (host && key) ? d_proxy() : null;
                if (dprox) {
                    var parr = lnurl_deform(dprox),
                        pxk = (parr) ? parr.k : false,
                        lightning_id = dataobject.lid,
                        lnd_pid = (lightning_id) ? lightning_id :
                        (dataobject.pid) ? sha_sub(dataobject.pid, 10) : null;
                    if (lnd_pid) {
                        var proxy_host = lnurl_encode_save(dprox),
                            ph = (proxy_host) ? lnurl_deform(proxy_host).url : null,
                            nid_src = (host) ? (imp == "lnbits") ? key : host : null,
                            node_id = (nid_src) ? sha_sub(nid_src, 10) : false,
                            nid = (dataobject.nid) ? dataobject.nid : (node_id) ? node_id : null,
                            pw = (dataobject.pw) ? sha_sub(dataobject.pw, 10) : (pxk) ? pxk : null,
                            use_lnurl = (host && key) ? false : true,
                            lnurls = (nid) ? false : true,
                            shared = (lightning_id) ? true : false,
                            lnd = {
                                "request": true,
                                "shared": shared,
                                "imp": imp,
                                "proxy_host": proxy_host,
                                "nid": nid,
                                "lnurl": lnurls,
                                "selected": true,
                                "pid": lnd_pid,
                                "host": host,
                                "key": key,
                                "pw": pw
                            };
                        helper.lnd = lnd;
                        lnd_ph = ph;
                        var creds = (host && key && nid) ? true : false,
                            put = {
                                "status": lnd_pid,
                                "cred": (creds) ? btoa(JSON.stringify({
                                    "file": nid,
                                    "host": host,
                                    "key": key
                                })) : false
                            }
                        lnd_put(ph, pw, put, use_lnurl);
                        return
                    }
                    console.log("missing payment id");
                } else {
                    console.log("missing proxy");
                }
            } else {
                console.log("missing implementation");
            }
        }
        proceed_pf();
        return
    }
    var lnli = lndli(),
        ln_dat = lnli.data(),
        ss = ln_dat.selected_service;
    if (ss) {
        var imp = ss.imp;
        loadertext("check " + imp + " lightning status");
        var node_id = ss.node_id,
            proxies = ln_dat.proxies,
            proxy_id = ss.proxy_id,
            fetchproxy = fetch_proxy(proxies, proxy_id),
            proxy_url = (fetchproxy) ? fetchproxy.proxy : lnurl_encode_save(lnd_pick_proxy()),
            p_arr = lnurl_deform(proxy_url),
            ph = p_arr.url,
            pw = p_arr.k,
            local_proxy = is_local_node(proxy_url),
            proxy = ss.proxy,
            host = ss.host,
            local_lnd = is_local_node(host),
            key = ss.key,
            lnurls = (ss.lnurl) ? true : false,
            lnurls_bool = (lnurls && !host) ? true : false,
            proxy_bool = (proxy == true) ? true : false,
            saved_id = sessionStorage.getItem("bitrequest_lndpid"),
            pid = (saved_id) ? saved_id : sha_sub(now(), 10),
            use_lnurl = (lnurls_bool || proxy_bool),
            lnd = {
                "request": false,
                "shared": false,
                "imp": imp,
                "proxy_host": proxy_url,
                "pid": pid,
                "proxy_id": proxy_id,
                "nid": node_id,
                "host": host,
                "key": key,
                "lnurl": lnurls,
                "name": ss.name,
                "proxy": proxy_bool,
                "local_node": local_lnd,
                "local_proxy": local_proxy,
                "selected": ln_dat.selected
            };
        helper.lnd = lnd;
        lnd_ph = ph;
        var creds = (host && key && node_id && !lnurls) ? true : false,
            put = {
                "status": pid,
                "cred": (creds) ? btoa(JSON.stringify({
                    "file": node_id,
                    "host": host,
                    "key": key
                })) : false
            }
        lnd_put(ph, pw, put, use_lnurl);
        return
    }
    proceed_pf();
    return
}

function lnd_put(proxy, key, pl, lnurl) {
    var rqtype = (request.requesttype == "local") ? undefined : request.requesttype;
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy + "proxy/v1/ln/api/",
        "data": {
            "fn": "put",
            "pl": pl,
            "rqtype": rqtype,
            "x-api": key
        }
    }).done(function(e) {
        var stat = e.stat;
        if (stat === true) {
            test_lnd(lnurl);
            return
        }
        if (stat == "no write acces") {
            notify("LNurl proxy access denied, check folder permissions");
        }
        var data = br_result(e).result,
            error = data.error,
            default_error = "unable to connect";
        if (error) {
            var message = (error) ? (error.message) ? error.message : (typeof error == "string") ? error : default_error : default_error;
            if (request.isrequest) {
                if (helper.lnd_only) {
                    topnotify(message);
                    notify("this request is not monitored");
                }
            } else {
                notify(message);
                $("#rq_errlog").append("<span class='rq_err'>" + message + "</span>");
            }
        }
        proceed_pf();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
        proceed_pf();
    });
}

function test_lnd(lnurl) {
    var lnd = helper.lnd;
    if (!lnd.proxy_host) {
        proceed_pf();
        return
    }
    var status_cache = sessionStorage.getItem("lnd_timer_" + lnd.nid);
    if (status_cache && (now() - status_cache) < 20000) { // get cached status
        // lightning status is cached for 10 minutes
        helper.lnd_status = true;
        proceed_pf();
        return;
    }
    sessionStorage.removeItem("lnd_timer_" + lnd.nid);
    // functions in assets_js_bitrequest_lightning.js
    if (lnurl) {
        test_lnurl_status(lnd);
        return
    }
    if (lnd.imp == "lnd") {
        check_lnd_status(lnd);
        return
    }
    if (lnd.imp == "c-lightning") {
        check_c_lightning_status(lnd);
        return
    }
    if (lnd.imp == "eclair") {
        check_eclair_status(lnd);
        return
    }
    if (lnd.imp == "lnbits") {
        check_lnbits_status(lnd);
        return
    }
}

function proceed_pf(error) {
    if (helper.lnd_status === false && helper.lnd_only) {
        request.monitored = false;
        var error_message = (helper.lnd_only) ? (error) ? error.errorcode + ": " + error.errormessage : "Unable to connect with lightning node" : $("#rq_errlog > .rq_err").text(),
            content = "<h2 class='icon-blocked'>" + error_message + "</h2>";
        cancelpaymentdialog();
        popdialog(content, "canceldialog");
        closeloader();
        return
    }
    var lndstatus = (helper.lnd) ? (helper.lnd.selected) ? (helper.lnd_status) ? "lnd_ao" : "lnd_active" : "lnd_inactive" : "no_lnd";
    paymentdialogbox.attr({
        "data-lswitch": lndstatus,
        "data-lnd": lndstatus
    });
    if (request.isrequest === true) {
        add_flip();
    }
    if (offline === true) { // no price conversion when app is offline
        rendercurrencypool({
            "EUR": 1,
            "USD": 1.095063
        }, 0.025661699261756998, "coinmarketcap", "fixer", 0, 0);
        return
    }
    var ccapi = $("#cmcapisettings").data("selected"),
        apilist = "crypto_price_apis",
        getcache = sessionStorage.getItem("bitrequest_xrates_" + request.currencysymbol);
    if (getcache) { //check for cached crypto rates in localstorage
        var timestamp = now(),
            parsevalue = JSON.parse(getcache),
            cachedtimestamp = parsevalue.timestamp,
            thisusdrate = parsevalue.ccrate,
            apisrc = parsevalue.apisrc,
            cachetime = timestamp - cachedtimestamp;
        if (cachetime > cacheperiodcrypto) { //check if cached crypto rates are expired
            getccexchangerates(apilist, ccapi);
            return
        } //fetch cache
        loadertext("reading " + request.currencysymbol + " rate from cache");
        initexchangerate(thisusdrate, apisrc, cachetime); //check for fiat rates and pass usd amount
        return
    }
    getccexchangerates(apilist, ccapi);
}

//get crypto rates
function getccexchangerates(apilist, api) {
    api_attempt[apilist][api] = true;
    loadertext("get " + request.currencysymbol + " rates from " + api);
    var payment = request.payment,
        contract = request.token_contract,
        iserc = (request.erc20 === true) ? true : false,
        payload = (api == "coinmarketcap") ? "v1/cryptocurrency/quotes/latest?id=" + request.cmcid :
        (api == "coinpaprika") ? request.currencysymbol + "-" + payment :
        (api == "coingecko") ? (iserc) ? "simple/token_price/ethereum?contract_addresses=" + contract + "&vs_currencies=usd" : "simple/price?ids=" + payment + "&vs_currencies=usd" :
        false;
    if (payload === false) {
        loadertext("api error");
        closeloader();
        cancelpaymentdialog();
        fail_dialogs(api, "Crypto price API not defined");
        return
    }
    api_proxy({
        "api": api,
        "search": payload,
        "cachetime": 90,
        "cachefolder": "1h",
        "params": {
            "method": "GET",
            "cache": true
        },
    }).done(function(e) {
        var data = br_result(e).result;
        if (data) {
            if (!$.isEmptyObject(data)) {
                var status = data.status,
                    has_error = (data.statusCode == 404 ||
                        (data.error) ||
                        (status && status.error_message));
                if (has_error) {
                    var error_val = (data.error) ? data.error : "Unable to get " + payment + " Exchangerate";
                    cc_fail(apilist, api, error_val);
                    return
                }
                var pnode = (iserc) ? contract : payment,
                    ccrate = (api == "coinmarketcap") ? data.data[request.cmcid].quote.USD.price :
                    (api == "coinpaprika") ? data.quotes.USD.price :
                    (api == "coingecko") ? data[pnode].usd :
                    null;
                if (ccrate) {
                    loadertext("success");
                    var timestamp = now(),
                        ccratearray = {};
                    ccratearray.timestamp = timestamp;
                    ccratearray.ccrate = ccrate;
                    ccratearray.apisrc = api;
                    var storeccratestring = JSON.stringify(ccratearray);
                    sessionStorage.setItem("bitrequest_xrates_" + request.currencysymbol, storeccratestring); //cache crypto rates in sessionstorage
                    initexchangerate(ccrate, api, 0); //pass usd amount, check for fiat rates
                    return
                }
                cc_fail(apilist, api, "unable to get " + payment + " rate");
                return
            }
        }
        var error_val = "unable to get " + payment + " rate";
        cc_fail(apilist, api, error_val);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var error_object = (errorThrown) ? errorThrown : jqXHR;
        cc_fail(apilist, api, error_object);
    });
}

function initexchangerate(cc_rate, ccapi, cachetime) {
    loadertext("get fiat rates");
    var ccrate = 1 / cc_rate,
        timestamp = now(),
        newcurrency = (request.fiatcurrency != request.localcurrency && request.fiatcurrency != "eur" && request.fiatcurrency != "usd" && request.fiatcurrency != request.currencysymbol), //check if currency request is other then usd, eur or localcurrency
        localcurrencyparam = (request.localcurrency == "usd" || request.localcurrency == "btc") ? "usd,eur" :
        (request.localcurrency == "eur") ? "eur,usd" :
        request.localcurrency + ",usd,eur", // set correct local currency / prevent btc
        newcurrencyparam = (newcurrency === true) ? "," + request.fiatcurrency : "",
        currencystring = localcurrencyparam + newcurrencyparam,
        currenciesstring = request.currencysymbol + "," + currencystring,
        currencycache = sessionStorage.getItem("bitrequest_exchangerates"),
        fiatapi = $("#fiatapisettings").data("selected"),
        apilist = "fiat_price_apis";
    helper.currencyarray = currenciesstring.split(",");
    if (currencycache) { //check if cache exists
        var parsevalue = JSON.parse(currencycache),
            xratesnode = parsevalue.fiat_exchangerates,
            thisrate = xratesnode[request.fiatcurrency];
        if (thisrate) { //check if currency is in cache
            var xratetimestamp = parsevalue.timestamp,
                timeexpired = timestamp - xratetimestamp,
                lcrate = xratesnode[request.fiatcurrency];
            if (timeexpired > cacheperiodfiat || lcrate === undefined) { //check if cache is expired and if fiatcurrency is cached
                get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime);
                return
            } //fetch cached exchange rates
            loadertext("reading fiat rates from cache");
            rendercurrencypool(xratesnode, ccrate, ccapi, parsevalue.api, cachetime, timeexpired);
            return
        }
    }
    get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime);
}

//get fiat rates
function get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime) {
    api_attempt[apilist][fiatapi] = true;
    loadertext("fetching fiat rates from " + fiatapi);
    // set apipath
    var payload = (fiatapi == "fixer") ? "latest" :
        (fiatapi == "coingecko") ? "exchange_rates" :
        (fiatapi == "exchangeratesapi") ? "latest" :
        (fiatapi == "currencylayer") ? "live" :
        (fiatapi == "coinbase") ? "exchange-rates" :
        false;
    if (payload === false) {
        loadertext("error");
        closeloader();
        cancelpaymentdialog();
        fail_dialogs(fiatapi, "Fiat price API not defined");
        return
    }
    api_proxy({
        "api": fiatapi,
        "search": payload,
        "cachetime": 540,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        var data = br_result(e).result,
            ratesnode = (fiatapi == "fixer") ? data.rates :
            (fiatapi == "coingecko") ? data.rates :
            (fiatapi == "exchangeratesapi") ? data.rates :
            (fiatapi == "currencylayer") ? data.quotes :
            (fiatapi == "coinbase") ? data.data.rates :
            null;
        if (ratesnode) {
            loadertext("success");
            var fiatsymbol = request.fiatcurrency,
                localupper = fiatsymbol.toUpperCase(),
                rates = {
                    "eur": 1
                },
                usdval,
                localval;
            if (fiatapi == "fixer") {
                var usdval = ratesnode.USD,
                    localval = ratesnode[localupper];
            } else if (fiatapi == "coingecko") {
                if (ratesnode[fiatsymbol]) {
                    var eurval = ratesnode.eur.value,
                        usdval = ratesnode.usd.value / eurval,
                        localval = ratesnode[fiatsymbol].value / eurval;
                }
            } else if (fiatapi == "exchangeratesapi") {
                if (ratesnode[localupper]) {
                    var usdval = ratesnode.USD,
                        localval = (localupper == "EUR") ? 1 : ratesnode[localupper];
                }
            } else if (fiatapi == "currencylayer") {
                var localkey = ratesnode["USD" + localupper];
                if (localkey) {
                    var usdval = 1 / ratesnode.USDEUR,
                        localval = localkey * usdval;
                }
            } else if (fiatapi == "coinbase") {
                var localkey = ratesnode[localupper];
                if (localkey) {
                    var usdval = 1 / ratesnode.EUR,
                        localval = localkey * usdval;
                }
            } else {
                loadertext("error");
                closeloader();
                cancelpaymentdialog();
                fail_dialogs(fiatapi, "Fiat price API not defined");
                return
            }
            if (localval && usdval) {
                rates.usd = usdval;
                if (fiatsymbol == "eur" || fiatsymbol == "usd" || fiatsymbol == "btc") {} else {
                    rates[fiatsymbol] = localval;
                }
                rendercurrencypool(rates, ccrate, ccapi, fiatapi, cachetime, "0"); // render exchangerates
                // cache exchange rates
                var xratestring = JSON.stringify({
                    "timestamp": now(),
                    "fiat_exchangerates": rates,
                    "api": fiatapi
                });
                sessionStorage.setItem("bitrequest_exchangerates", xratestring);
                return
            }
        }
        var nextfiatapi = try_next_api(apilist, fiatapi);
        if (nextfiatapi === false) {
            loadertext("error");
            closeloader();
            cancelpaymentdialog();
            var errorcode = (data.error) ? data.error : "Failed to load data from " + fiatapi;
            fail_dialogs(fiatapi, errorcode);
            return
        }
        get_fiat_exchangerate(apilist, nextfiatapi, ccrate, currencystring, ccapi, cachetime);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var error_object = (errorThrown) ? errorThrown : jqXHR;
        next_fiat_api(apilist, fiatapi, error_object, ccrate, currencystring, ccapi, cachetime);
        return
    });
}

function next_fiat_api(apilist, fiatapi, error_object, ccrate, currencystring, ccapi, cachetime) {
    var nextfiatapi = try_next_api(apilist, fiatapi);
    if (nextfiatapi) {
        get_fiat_exchangerate(apilist, nextfiatapi, ccrate, currencystring, ccapi, cachetime);
        return
    }
    loadertext("error");
    closeloader();
    cancelpaymentdialog();
    fail_dialogs(fiatapi, error_object);
}

function rendercurrencypool(data, ccrate, ccapi, fiatapi, cachetimecrypto, cachetimefiat) {
    xrates_array = [];
    var usdrate = data.usd, //cryptocurrency rate is in dollar, needs to be converted to euro
        ccrateeuro = ccrate * usdrate,
        currentrate = (request.iscrypto === true) ? ccrateeuro : data[request.fiatcurrency],
        fiatapiurl = (fiatapi == "fixer") ? "fixer.io" :
        (fiatapi == "coingecko") ? "coingecko.com" :
        (fiatapi == "exchangeratesapi") ? "exchangeratesapi.io" :
        (fiatapi == "currencylayer") ? "currencylayer.com" :
        (fiatapi == "coinbase") ? "coinbase.com" :
        null,
        xratedata1 = "<div data-currency='" + request.currencysymbol + "' data-value='' data-xrate='" + ccrateeuro + "' class='cpool ccpool' data-currencyname='" + request.payment + "'><span>" + ccapi + ": <span class='ratesspan'>" + request.currencysymbol + "_" + request.uoa + ": " + (1 / (ccrateeuro / currentrate)).toFixed(8) + "</span></span></div><div class='cachetime'> (" + (cachetimecrypto / 60000).toFixed(1) + " of " + (cacheperiodcrypto / 60000).toFixed(0) + " min. in cache)</div><br/><div class='mainrate'>" + fiatapiurl + ": </div>",
        xratedata2 = [],
        parsedsymbols = JSON.parse(symbolcache);
    xrates_array.push({
        "currency": request.currencysymbol,
        "xrate": ccrateeuro,
        "currencyname": request.payment
    });
    $.each(data, function(thiscurrency, rate) {
        var parsedrate = (rate / currentrate).toFixed(6) / 1,
            ratesspanclass = (parsedrate === 1) ? " hide" : "",
            currencyname = parsedsymbols[thiscurrency.toUpperCase()],
            xratedatarray = "<div data-currency='" + thiscurrency + "' data-value='' data-xrate='" + rate + "' class='cpool' data-currencyname='" + currencyname + "'><span class='ratesspan" + ratesspanclass + "'>" + request.uoa + "_" + thiscurrency + ": " + parsedrate + "</span></div>";
        xratedata2.push(xratedatarray);
        xrates_array.push({
            "currency": thiscurrency,
            "xrate": rate,
            "currencyname": currencyname
        });
    });
    helper.xrates = xrates_array;
    var ln_info = helper.lnd,
        proxy_icon = (ln_info && ln_info.proxy) ? "<span class='icon-sphere' title='" + ln_info.proxy_host + "'></span>" : "",
        lndstatus_icon = (helper.lnd_status) ? " <span class='icon-connection'></span>" : " <span class='icon-wifi-off'></span>",
        lnd_nodeinfo = (request.isrequest === true) ? "" : ": <span id='lnd_nodeinfo_trigger'>" + ln_info.name + "</span>",
        lnd_node_info = (ln_info) ? "<br/><span id='current_lndnode'><img src='" + c_icons(ln_info.imp) + "' class='lnd_icon' title='" + ln_info.imp + "'/> Lightning node" + lnd_nodeinfo + lndstatus_icon + proxy_icon + "</span>" : "";
    $("#xratestats").prepend(xratedata1 + xratedata2.join(" | ") + "<div class='cachetime'> (" + (cachetimefiat / 60000).toFixed(1) + " of " + (cacheperiodfiat / 60000).toFixed(0) + " min. in cache)</div><br/><span id='current_socket'></span>" + lnd_node_info);
    getpayment(ccrateeuro, ccapi);
}

function getpayment(ccrateeuro, ccapi) {
    closeloader();
    var currencypoolnode = $("#paymentdialog .cpool[data-currency='" + request.uoa + "']"),
        currencyname = currencypoolnode.attr("data-currencyname"),
        fiatcurrencypoolnode = $("#paymentdialog .cpool[data-currency='" + request.fiatcurrency + "']"),
        fiatcurrencyname = fiatcurrencypoolnode.attr("data-currencyname"),
        localcurrencypoolnode = $("#paymentdialog .cpool[data-currency='" + request.localcurrency + "']"),
        localcurrencyname = localcurrencypoolnode.attr("data-currencyname");
    // extend global request object
    request.currencyname = currencyname;
    request.fiatcurrencyname = fiatcurrencyname;
    request.localcurrencyname = localcurrencyname;
    // continue vars
    var currencyxrate = currencypoolnode.attr("data-xrate"),
        fiatcurrencyrate = fiatcurrencypoolnode.attr("data-xrate"),
        rn_set = (request.requestname && request.requestname.length > 1), // check if requestname is set
        rt_set = (request.requesttitle && request.requesttitle.length > 1), // check if requesttitle is set
        requesttitle_string = (rt_set === true) ? request.requesttitle : "",
        savedaddressli = filter_addressli(request.payment, "address", request.address),
        has_label = (savedaddressli.length > 0 && savedaddressli.data("label").length > 0) ? true : false,
        labelvalue = (has_label) ? savedaddressli.data("label") : "",
        label_markup = (has_label) ? "<span id='labelbttn'>" + labelvalue + "</span>" : "", // check if label is set
        thiscurrencyvalueraw = ((request.amount / currencyxrate) * ccrateeuro),
        thiscurrencyvaluefixed = parseFloat(thiscurrencyvalueraw.toFixed(6)),
        thiscurrencyvaluefixedplaceholder = (request.iszero === true) ? zeroplaceholder : thiscurrencyvaluefixed,
        thiscurrencyvaluefixedvar = (request.iszero === true) ? "" : thiscurrencyvaluefixed,
        satamount = (thiscurrencyvalueraw * 100000000).toFixed(0),
        fiatcurrencyvalue = ((request.amount / currencyxrate) * fiatcurrencyrate).toFixed(2),
        fiatcurrencyvaluevar = (request.iszero === true) ? "" : fiatcurrencyvalue,
        cryptosteps = "0.00001",
        fiatsteps = "0.1",
        steps = (request.iscrypto === true) ? cryptosteps : fiatsteps,
        placeholder = (request.iszero === true) ? zeroplaceholder : request.amount,
        valueplaceholder = (request.iszero === true) ? "" : request.amount,
        satplaceholder = (request.iszero === true) ? "000000000" : satamount,
        satamountvar = (request.iszero === true) ? "" : satamount,
        currencynamestring = (currencyname == "Euro") ? "" : (request.iscrypto === true) ? fiatcurrencyname : currencyname,
        ccamounttext = "(" + thiscurrencyvaluefixedvar + " " + request.payment + ")",
        sharebuttonclass = (rn_set === true && rt_set === true) ? " sbactive" : "",
        cryptologo = getcc_icon(request.cmcid, request.cpid, request.erc20),
        lndlogo = (request.payment == "bitcoin") ? "<img src='img_logos_btc-lnd.png' class='cmc_icon icon_lnd'>" : "",
        sharebutton = "<div class='button" + sharebuttonclass + "' id='sharebutton'><span class='icon-share2'>Share request</span></div>",
        initrequestname = (rn_set === true) ? request.requestname : $("#accountsettings").data("selected"),
        sharetitle_exceed = (request.requesttitle && request.requesttitle.length > 65),
        exceedclass = (sharetitle_exceed === true) ? "title_exceed" : "",
        requesttitle_short = (sharetitle_exceed === true) ? request.requesttitle.substring(0, 44) + "<span>...</span>" : request.requesttitle,
        requesttitle_quotes = (request.requesttitle && request.requesttitle.length > 1) ? "'" + requesttitle_short + "'" : "",
        backbttnandtitle = (request.isrequest === true) ? "<div id='sharetitle' title='" + requesttitle_string + "' data-shorttitle='" + requesttitle_short + "' class='" + exceedclass + "'>" + requesttitle_quotes + "</div>" : "",
        save_request,
        address_xmr_ia = (request.xmr_ia) ? request.xmr_ia : request.address,
        ro_attr = (request.isrequest === true && !request.iszero) ? " readonly='readonly'" : "",
        requestinfo = "\
			<div id='requestinfo'>" +
        backbttnandtitle +
        "<div id='shareamount' class='inputbreak'>\
					<span id='sharecryptowrap'>" + cryptologo + lndlogo +
        "<span id='sharemainccinputmirror' class='ccmirror mirrordiv'>\
							<span>" + thiscurrencyvaluefixedplaceholder + "</span>\
							<input value='" + thiscurrencyvaluefixedvar + "' step='" + cryptosteps + "' type='number' placeholder='" + zeroplaceholder + "'" + ro_attr + "/>\
						</span>\
					</span>\
					<span id='shareinputmirror' class='fmirror mirrordiv'>\
						<span>" + placeholder + "</span>\
						<input value='" + valueplaceholder + "' step='" + steps + "' type='number' placeholder='" + zeroplaceholder + "'" + ro_attr + "/>\
					</span>\
					<span id='sharecurrency'>" + request.uoa + "</span>\
				</div>\
				<div id='currencynamebox'>\
					<span id='currencyname' data-currencyname='" + currencynamestring + "'>\
						<span class='quote'>(</span>\
						<span id='sharelcinputmirror' class='lcmirror mirrordiv'>\
						<span>" + fiatcurrencyvalue + "</span>\
						<input value='" + fiatcurrencyvaluevar + "' step='" + steps + "' type='number' placeholder='" + zeroplaceholder + "'" + ro_attr + "/>\
					</span>\
					<span id='sharelcname'>" + currencynamestring + "</span>\
					<span class='quote'>)</span>\
					</span>\
				</div>\
				<div id='ccamountbox'>\
					<span id='ccamount'>(" + cryptologo + lndlogo +
        "<span id='shareccinputmirror' class='ccmirror mirrordiv'>\
							<span>" +
        thiscurrencyvaluefixedplaceholder +
        "</span>\
							<input value='" + thiscurrencyvaluefixedvar + "' step='" + cryptosteps + "' type='number' placeholder='" + zeroplaceholder + "'" + ro_attr + "/>\
						</span> " +
        request.payment + ")\
					</span>\
				</div>\
			</div>",
        status_text = (request.paid === true) ? (request.requesttype == "incoming") ? "Payment sent" : "Payment received" : "Waiting for payment",
        conf_section = (request.instant === true) ? "" : "<span id='statusbox'>Waiting for <span id='confnumber'></span> confirmations </span><span class='confbox'><span data-conf='0'>0</span> confirmations</span>",
        brstatuspanel = "\
			<div class='brstatuspanel'>\
				<img src='" + c_icons("confirmed") + "'/>\
				<div id='mainpulse' class='pulse'></div>\
				<div class='main_wifi_off icon-wifi-off'></div>\
				<h2>" + status_text + "</h2>\
				<p>\
					<span class='paymentdate'></span><br/>\
					<span class='receivedcrypto'></span>\
					<span class='receivedfiat'></span><br/>\
					<span id='ibstatus'>\
						<span id='inlinepulse' class='pulse'></span>\
						<span class='wifi_off icon-wifi-off'></span>" +
        conf_section +
        "</span><br/>\
					<span id='view_tx'>View details</span>\
				</p>\
			</div>",
        readonly_attr = (is_viewonly() === true) ? " readonly='readonly'" : "",
        fb_labelval = (has_label) ? " (" + labelvalue + ")" : "",
        fb_markup = (request.payment == "bitcoin") ? "<div id='fallback_address'>Fallback address:<br/><span id='fb_addr'>" + request.address + fb_labelval + "</span> " + switchpanel(false, " global") + "</div>" : "",
        shareform = "\
			<div id='shareformbox'>\
				<div id='shareformib' class='inputbreak'>\
					<form id='shareform' disabled='' autocomplete='off' autocorrect='off' autocapitalize='sentences' spellcheck='off'>\
						<label>What's your name?<input type='text' placeholder='Name' id='requestname' value='" + initrequestname + "' autocomplete='false'" + readonly_attr + "></label>\
						<label>What's it for?<input type='text' placeholder='eg:  lunch  🥪' id='requesttitle' value='" + requesttitle_string + "' data-ph1=' festival tickets' data-ph2=' coffee  ☕' data-ph3=' present  🎁' data-ph4=' snowboarding  🏂' data-ph5=' movie theater  📽️' data-ph6=' lunch  🥪' data-ph7=' shopping  🛒' data-ph8=' video game  🎮' data-ph9=' drinks  🥤' data-ph10=' concert tickets  🎵' data-ph11=' camping  ⛺' data-ph12=' taxi  🚕' data-ph13=' zoo  🦒'></label>\
					</form>" + fb_markup +
        "</div>\
				<div id='sharebox' class='inputbreak'>" + sharebutton + "</div>\
			</div>",
        requestnamestring = (request.requesttype === "outgoing") ? "" : (rn_set === true) ? "To " + request.requestname + ":" : "",
        lndowbttn = (request.payment == "bitcoin") ? "<div class='button openwallet_lnd' id='openwallet_lnd' data-currency='bitcoin'><span class='icon-folder-open'>Open wallet</span></div>" : "",
        paymethods = "\
			<div id='paymethods'>\
				<p id='requestnamep'>" + requestnamestring + "</p>\
				<div id='scanqrib' class='inputbreak'>\
					<div class='button' id='scanqr'>\
						<span class='icon-qrcode'>Show qr-code</span>\
					</div><br/>\
					<div class='button openwallet' id='openwallet' data-currency='" + request.payment + "'><span class='icon-folder-open'>Open wallet</span></div>" + lndowbttn +
        "</div>\
			</div>",
        poweredby = "<div class='poweredby'>Powered by: <a href='https://www.bitrequest.io' target='_blank'>Bitrequest</a></div>",
        bottomcard = (request.isrequest === true) ? paymethods : shareform,
        ccqr = "<div id='qrcode' class='qrcode'><canvas width='256' height='256'></canvas></div>" + cryptologo,
        lndqr = (request.payment == "bitcoin") ? "<div id='qrcode_lnd' class='qrcode'><canvas width='256' height='256'></canvas></div><img src='img_logos_btc-lnd.png' class='cmc_icon' id='lnd_icon'><img src='" + c_icons("phone-icon") + "' class='cmc_icon' id='phone_icon'>" : "",
        lndow = (request.payment == "bitcoin") ? "<div class='openwallet_lnd abr icon-folder-open' data-currency='bitcoin' data-rel='0'>Open wallet</div>" : "";
    $("#request_front").prepend("<div id='cl_wrap'>" + cryptologo + "</div>\
		<div class='actionbar clearfix'>\
			<div id='sharerequest' class='abl icon-share2 sbactive'>Share request</div><div id='open_wallet' class='openwallet abr icon-folder-open' data-currency='" + request.payment + "' data-rel='0'>Open wallet</div>" + lndow +
        "</div>\
		<div class='qrwrap flex' id='main_qrwrap'>" + ccqr + lndqr + brstatuspanel +
        "</div>\
        <div id='popform' data-payment='" + request.payment + "' data-currency='" + request.uoa + "' data-address='" + request.address + "' data-lcrate='" + fiatcurrencyrate + "'>\
			<div id='rf_wrap'>\
				<div id='amountbreak' class='inputbreak'>\
					<span id='mainccinputmirror' class='ccmirror mirrordiv'>\
						<span>" + thiscurrencyvaluefixedplaceholder + "</span>\
						<input value='" + thiscurrencyvaluefixedvar + "' data-xrate='" + ccrateeuro + "' step='" + cryptosteps + "' type='number' placeholder='" + zeroplaceholder + "'" + ro_attr + ">\
					</span>\
					<span id='amountinputmirror' class='fmirror mirrordiv'>\
						<span>" + placeholder + "</span>\
						<input value='" + valueplaceholder + "' data-xrate='" + currencyxrate + "' step='" + fiatsteps + "' type='number' placeholder='" + zeroplaceholder + "'" + ro_attr + ">\
					</span>\
					<span id='pickcurrency'>" + request.uoa + "</span>\
				</div>\
				<div id='ibsat' class='inputbreak'>\
					<span id='satinputmirror' class='mirrordiv'>\
						<span>" + satplaceholder + "</span>\
						<input class='satinput' value='" + satamountvar + "' data-xrate='" + ccrateeuro + "' max='10000000000000' type='number' placeholder='000000000'" + ro_attr + "/>\
					</span> satoshis\
				</div>\
				<div id='iblc' class='inputbreak'>\
					(<span id='lcinputmirror' class='lcmirror mirrordiv'>\
						<span>" + fiatcurrencyvalue + "</span>\
						<input value='" + fiatcurrencyvaluevar + "' data-xrate='" + fiatcurrencyrate + "' step='" + fiatsteps + "' type='number' placeholder='" + zeroplaceholder + "'" + ro_attr + "/>\
					</span> " + request.fiatcurrency + ") \
				</div>\
				<div id='txibreak' class='inputbreak'> Send <span id='ccinputmirror' class='ccmirror mirrordiv'><span>" + thiscurrencyvaluefixedplaceholder + "</span><input value='" + thiscurrencyvaluefixedvar + "' data-xrate='" + ccrateeuro + "' step='" + cryptosteps + "' type='number' placeholder='" + zeroplaceholder + "'" + ro_attr + "/></span> " + request.currencysymbol + " to" + label_markup + ": </div>\
			</div>\
			<div id='paymentaddress' class='copyinput' data-type='address'>" + address_xmr_ia + "</div><div id='paymentaddress_lnd' class='copyinput' data-type='lightning invoice'></div>\
		</div>\
		<div id='apisrc'>src: " + ccapi + "</div>" + poweredby);
    paymentdialogbox.find("#request_back").html("\
		<div class='actionbar clearfix'></div>\
		<div id='backwraptop' class='flex'>" + requestinfo + "</div>\
		<div id='backwrapbottom' class='flex'>" + bottomcard + brstatuspanel + "</div>" + poweredby);
    show_paymentdialog();
    rendercpool(request.amount, currencyxrate);
    renderqr(request.payment, address_xmr_ia, thiscurrencyvaluefixedvar, request.requesttitle);
    if (request.isrequest === true) { // check for incoming requests
        if (helper.contactform === true) { // indicates if it's a online payment so not an incoming request
        } else {
            if (request.monitored === true) {
                if (request.iszero === true) {
                    main_input_focus();
                }
                var save_request = saverequest("init");
            }
        }
    } else {
        main_input_focus();
    }
    if (save_request == "nosocket") {} else {
        closesocket();
        init_socket(helper.selected_socket, request.address);
        set_request_timer();
    }
    if (request.monitored === false) {
        notify("this currency is not monitored", 500000, "yes");
    }
    // close loading screen when in iframe
    if (inframe === true) {
        parent.postMessage("close_loader", "*");
    }
    var title_node = $("#requesttitle");
    title_node.attr("placeholder", "eg: " + title_node.attr("data-ph" + getrandomnumber(1, 13)));
    console.log({
        "request_object": request
    });
    console.log({
        "helper": helper
    });
    wake();
    var ln_info = helper.lnd;
    if (ln_info) {
        if (request.lightning_id) {} else {
            var saved_id = sessionStorage.getItem("bitrequest_lndpid");
            if (saved_id && saved_id == ln_info.pid) {} else {
                sessionStorage.setItem("bitrequest_lndpid", ln_info.pid);
            }
        }
    }
}

function cc_fail(apilist, api, error_val) {
    var nextccapi = try_next_api(apilist, api);
    if (nextccapi) {
        getccexchangerates(apilist, nextccapi);
        return
    }
    loadertext("api error");
    closeloader();
    cancelpaymentdialog();
    fail_dialogs(api, error_val);
}

function show_paymentdialog() {
    var scrollposition = $(document).scrollTop(); // get scrollposition save as global
    fixedcheck(scrollposition); // fix nav position
    html.addClass("paymode blurmain_payment");
    $(".showmain #mainwrap").css("-webkit-transform", "translate(0, -" + scrollposition + "px)"); // fake scroll position
    paymentpopup.addClass("showpu active");
}

function main_input_focus() {
    var visible_input = (paymentdialogbox.hasClass("flipped")) ? $("#paymentdialog #shareamount input:visible:first") :
        $("#paymentdialog #amountbreak input:visible:first");
    // hack to move cursor to the end
    var amount_val = visible_input.val();
    visible_input.val("");
    visible_input.val(amount_val);
    visible_input.focus();
}

// ** Paymentdialog functions **

function lnd_switch_function() {
    $(document).on("click", "#paymentdialogbox #lightning_switch", function() {
        if (helper.lnd) {
            if (helper.lnd_only) {
                playsound(funk);
                return
            }
            if (helper.lnd.selected) {
                lnd_statusx();
                return
            }
            var result = confirm("Enable lightning payments?");
            if (result === true) {
                var lnli = lndli();
                lnli.data("selected", true);
                lnli.find(".switchpanel").removeClass("false").addClass("true");
                save_cc_settings("bitcoin", true);
                if (helper.lnd_status) {
                    helper.lnd.selected = true;
                    paymentdialogbox.attr("data-lswitch", "lnd_ao");
                    return
                }
                notify("<span id='lnd_offline'>Lightning node is offline</span>", 200000, "yes");
                return
            }
            playsound(funk);
            return
        }
        if (request.isrequest) {
            playsound(funk);
            return
        }
        lnd_popup();
    });
}

function ndef_switch_function() {
    $(document).on("click", "#paymentdialogbox #ndef_switch", function() {
        notify("Please tap your Boltcard to the back of this device", 10000);
    });
}

function lnd_statusx() {
    if (helper.lnd_status) {
        if (paymentdialogbox.attr("data-lswitch") == "lnd_ao") {
            paymentdialogbox.attr("data-lswitch", "");
            return
        }
        paymentdialogbox.attr("data-lswitch", "lnd_ao");
        return
    }
    if (request.isrequest) {
        playsound(funk);
        return
    }
    notify("<span id='lnd_offline'>Lightning node is offline</span>", 200000, "yes");
}

function lnd_offline() {
    $(document).on("click", "#lnd_offline", function() {
        lnd_popup();
    });
}

function lnd_ni() {
    $(document).on("click", "#paymentdialogbox #current_lndnode #lnd_nodeinfo_trigger", function(e) {
        e.stopPropagation();
        lnd_popup();
        topnotify("Add Lightning node");
    });
}

function lnd_popup() {
    lndli().find(".atext").trigger("click");
}

function pickcurrency() {
    $(document).on("click", "#paymentdialogbox #pickcurrency", function() {
        var thisnode = $(this),
            currencyarray = helper.currencyarray,
            payment = request.payment,
            nextcurrency_scan = currencyarray[$.inArray(request.uoa, currencyarray) + 1],
            nextcurrency = (nextcurrency_scan) ? nextcurrency_scan : currencyarray[0],
            newccnode = $("#paymentdialog .cpool[data-currency='" + nextcurrency + "']"),
            newccsymbol = newccnode.attr("data-currency"),
            newccname = newccnode.attr("data-currencyname"),
            newccvalue = newccnode.attr("data-value"),
            newccrate = newccnode.attr("data-xrate"),
            sharelcname = (newccname == "Euro") ? "" : (newccnode.hasClass("ccpool")) ? request.fiatcurrencyname : newccname,
            mirrordiv = thisnode.prev("#amountinputmirror"),
            amountinput = mirrordiv.children("input"),
            amountinputvalue = amountinput.val(),
            number = Number(amountinputvalue),
            this_iszero = (number === 0 || isNaN(number)),
            newccvaluevar = (this_iszero === true) ? "" : newccvalue,
            newccvalueplaceholder = (this_iszero === true) ? zeroplaceholder : newccvalue,
            iscrypto = (newccsymbol == request.currencysymbol),
            dialogclass = (iscrypto === true) ? (newccsymbol == "btc") ? " showsat showlc showcc" : " showlc showcc" : (newccsymbol == request.fiatcurrency) ? "" : " showlc", // set classnames for hiding / showing inputs
            gets = geturlparameters(),
            page = gets.p,
            address = gets.address,
            data = (gets.d && gets.d.length > 5) ? "&d=" + gets.d : "",
            starturl = (page) ? "?p=" + page + "&payment=" : "?payment=",
            href = starturl + payment + "&uoa=" + newccsymbol + "&amount=" + newccvalue + "&address=" + address + data,
            pagename = payment + " request for " + newccvalue + " " + newccsymbol,
            title = pagename + " | " + apptitle;
        request.uoa = nextcurrency,
            request.amount = newccvalue,
            request.iscrypto = iscrypto;
        thisnode.add("#sharecurrency").text(newccsymbol);
        $("#sharelcname").text(sharelcname);
        amountinput.val(newccvaluevar).attr("data-xrate", newccrate).prev("span").text(newccvalueplaceholder);
        $("#shareinputmirror > input").val(newccvaluevar).prev("span").text(newccvalueplaceholder);
        paymentdialogbox.attr("class", helper.requestclass + dialogclass + helper.iszeroclass);
        main_input_focus();
        if (request.iszero_request === true) {} else {
            set_edit(href);
            settitle(title);
        }
        rendercpooltext(newccsymbol, newccrate);
    });
}

function rendercpooltext(nextcurrency, newccrate) {
    $("#paymentdialog .cpool").each(function() {
        var thisnode = $(this),
            thisnoderate = thisnode.attr("data-xrate"),
            thiscurrency = thisnode.attr("data-currency"),
            newrate = thisnoderate / newccrate,
            ccpool = (thisnode.hasClass("ccpool")),
            parsedtext = (ccpool === true) ? thiscurrency + "_" + nextcurrency : nextcurrency + "_" + thiscurrency,
            parsedrate = (ccpool === true) ? (1 / newrate).toFixed(8) : newrate.toFixed(6),
            thisnodetext = parsedtext + ": " + parsedrate / 1,
            ratesspan = thisnode.find(".ratesspan");
        if (parsedrate == 1) {
            ratesspan.addClass("hide");
        } else {
            ratesspan.removeClass("hide");
        }
        ratesspan.text(thisnodetext);
    });
}

function pushamount() {
    $(document).on("input", "#paymentdialogbox .fmirror > input", function() {
        blocktyping = true;
        var thisnode = $(this),
            thisamount = thisnode.val(),
            placeholder = (thisamount.length === 0) ? zeroplaceholder : thisamount,
            thisrate = $("#amountinputmirror > input").attr("data-xrate"),
            amountinputvalue = (thisamount.length === 0) ? zeroplaceholder : thisamount;
        $("#paymentdialogbox .fmirror > input").not(thisnode).val(thisamount).prev("span").text(placeholder);
        reflectlcvalue(thisamount, thisrate);
        reflectccvalue(thisamount, thisrate);
        reflectsatvalue(thisamount, thisrate);
        updatecpool(amountinputvalue, thisrate, cryptovalue(thisamount, thisrate));
    });
}

function pushlcamount() {
    $(document).on("input", "#paymentdialogbox .lcmirror > input", function() {
        blocktyping = true;
        var thisnode = $(this),
            thisamount = thisnode.val(),
            thisrate = $("#lcinputmirror > input").attr("data-xrate");
        $("#paymentdialogbox .lcmirror > input").not(thisnode).val(thisamount).prev("span").text(thisamount);
        reflectfiatvalue(thisamount, thisrate, "fiat");
        reflectccvalue(thisamount, thisrate, "fiat");
        reflectsatvalue(thisamount, thisrate);
    });
}

function pushccamount() {
    $(document).on("input", "#paymentdialogbox .ccmirror > input", function() {
        blocktyping = true;
        var thisnode = $(this),
            thisamount = thisnode.val(),
            placeholder = (thisamount.length === 0) ? zeroplaceholder : thisamount,
            thisrate = $("#mainccinputmirror > input").attr("data-xrate");
        $("#paymentdialogbox .ccmirror > input").not(thisnode).val(thisamount).prev("span").text(placeholder);
        reflectfiatvalue(thisamount, thisrate, "crypto");
        reflectlcvalue(thisamount, thisrate);
        reflectsatvalue(thisamount, thisrate);
    });
}

function pushsatamount() {
    $(document).on("input", "#satinputmirror > input", function() {
        blocktyping = true;
        var thisnode = $(this),
            thisamountpre = thisnode.val(),
            thisamount = (thisamountpre.length === 0) ? thisamountpre : thisamountpre / 100000000,
            thisrate = $("#mainccinputmirror > input").attr("data-xrate");
        reflectfiatvalue(thisamount, thisrate, "crypto");
        reflectlcvalue(thisamount, thisrate);
        reflectccvalue(thisamount, thisrate, "crypto");
    });
}

function reflectfiatvalue(thisamount, thisrate, fieldtype) { // reflect fiat values
    var amountinputrate = $("#amountinputmirror > input").attr("data-xrate"), //get fiat rate
        deter = (paymentdialogbox.hasClass("showcc")) ? 6 : 2,
        thisamountvalue = parseFloat(((thisamount / thisrate) * amountinputrate).toFixed(deter)),
        thisamountplaceholder = (thisamount.length === 0) ? zeroplaceholder : thisamountvalue,
        ccvalue = (thisamount.length === 0) ? zeroplaceholder : (fieldtype == "crypto") ? thisamount : cryptovalue(thisamount, thisrate);
    reflectinputs($("#paymentdialogbox .fmirror > input"), thisamountvalue, thisamountplaceholder); // reflect fiat values on sharedialog
    updatecpool(thisamountvalue, amountinputrate, ccvalue);
}

function reflectlcvalue(thisamount, thisrate) { // reflect local currency value
    var lcrate = $("#popform").attr("data-lcrate"),
        lcvalue = ((thisamount / thisrate) * lcrate).toFixed(2),
        lcplaceholder = (thisamount.length === 0) ? zeroplaceholder : lcvalue;
    reflectinputs($("#paymentdialogbox .lcmirror > input"), lcvalue, lcplaceholder);
}

function reflectccvalue(thisamount, thisrate, fieldtype) { // reflect crypto input
    var ccvalue = (thisamount.length === 0) ? zeroplaceholder : (fieldtype == "crypto") ? thisamount.toFixed(6) : cryptovalue(thisamount, thisrate);
    reflectinputs($("#paymentdialogbox .ccmirror > input"), ccvalue, ccvalue);
}

function reflectsatvalue(thisamount, thisrate, fieldtype) { // reflect sat input
    var ccvalue = (thisamount.length === 0) ? zeroplaceholder : (fieldtype == "crypto") ? thisamount : cryptovalue(thisamount, thisrate),
        satvalue = (ccvalue * 100000000).toFixed(0),
        satplaceholder = (thisamount.length === 0) ? "000000000" : satvalue;
    reflectinputs($("#satinputmirror > input"), satvalue, satplaceholder);
}

function reflectinputs(node, value, placeholder) {
    var val_correct = (value == 0 || value == "0.00") ? "" : value;
    node.val(val_correct).prev("span").text(placeholder);
}

function cryptovalue(thisamount, thisrate) { // get ccrate
    return parseFloat(((thisamount / thisrate) * $("#paymentdialogbox .ccpool").attr("data-xrate")).toFixed(6));
}

function reflectinput() {
    $(document).on("input change", ".mirrordiv > input", function() {
        var thisinput = $(this),
            thisvalue = thisinput.val(),
            mirrordiv = thisinput.prev("span"),
            placeholder = (thisinput.hasClass("satinput")) ? "000000000" : thisinput.attr("placeholder");
        if (thisvalue.length === 0) {
            mirrordiv.text(placeholder);
        } else {
            mirrordiv.text(thisvalue);
        }
        set_request_timer();
    });
}

function updatecpool(thisamount, thisrate, ccvalue) {
    rendercpool(thisamount, thisrate);
    var gets = geturlparameters(),
        payment = gets.payment,
        address = gets.address,
        address_xmr_ia = (request.xmr_ia) ? request.xmr_ia : address;
    renderqr(payment, address_xmr_ia, ccvalue);
    if (request.iszero_request === true) {} else {
        var page = gets.p,
            currency = gets.uoa,
            data = (gets.d) ? "&d=" + gets.d : "",
            starturl = (page) ? "?p=" + page + "&payment=" : "?payment=",
            href = starturl + payment + "&uoa=" + currency + "&amount=" + thisamount + "&address=" + address + data,
            pagename = payment + " request for " + thisamount + " " + currency,
            title = pagename + " | " + apptitle;
        helper.currencylistitem.data("url", href);
        request.amount = thisamount;
        set_edit(href);
        settitle(title);
    }
    blocktyping = false;
}

function rendercpool(thisamount, thisrate) {
    $("#paymentdialog .cpool").each(function() {
        var thisnode = $(this),
            thisnodeval = parseFloat((thisamount / thisrate) * thisnode.attr("data-xrate")),
            deter = (thisnode.hasClass("ccpool")) ? thisnodeval.toFixed(6) : thisnodeval.toFixed(2);
        thisnode.attr("data-value", deter);
    });
}

function renderqr(payment, address, amount, title) {
    var number = Number(amount),
        this_iszero = (number === 0 || isNaN(number)),
        urlscheme = (request.erc20 === true) ? "ethereum:" + address :
        request.coindata.urlscheme(payment, address, amount, this_iszero);
    $("#qrcode").html("").qrcode(urlscheme);
    set_uris(urlscheme, amount);
    if (helper.lnd) { // lightning
        set_lnd_qr(amount, title);
    }
}

function set_uris(urlscheme, amount) {
    $("#paymentdialogbox .openwallet").attr({
        "data-rel": amount,
        "title": urlscheme
    });
}

function set_lnd_qr(a, title) {
    var ln = helper.lnd,
        rt = (title) ? title : $("#paymentdialog input#requesttitle").val(),
        m = (rt && rt.length > 1) ? "&m=" + encodeURIComponent(rt) : "",
        nid = (ln.lnurl === false) ? ln.nid : "",
        url = lnd_ph + "proxy/v1/ln/?i=" + ln.imp + "&id=" + request.typecode + ln.pid + nid + "&a=" + (a * 100000000000).toFixed(0) + m,
        lnurl = lnurl_encode("lnurl", url).toUpperCase();
    $("#qrcode_lnd").html("").qrcode(lnurl);
    set_lnd_uris(lnurl, a);
}

function set_lnd_uris(urlscheme, amount) {
    $("#paymentdialogbox .openwallet_lnd").attr({
        "data-rel": amount,
        "title": "lightning:" + urlscheme
    });
    $("#paymentaddress_lnd").text(urlscheme);
}

function switchaddress() {
    $(document).on("click", "#paymentdialogbox.norequest #labelbttn", function() {
        var timelapsed = now() - sa_timer;
        if (timelapsed < 1500) { // prevent clicking too fast
            playsound(funk);
            return
        }
        var gets = geturlparameters(),
            payment = gets.payment;
        if (payment == "monero") {
            return
        }
        var currentaddress = gets.address,
            nextaddress = newaddresli(payment, currentaddress);
        if (nextaddress) {
            var newaddress = nextaddress.data("address"),
                selected_socket = helper.selected_socket;
            closesocket(currentaddress);
            init_socket(selected_socket, newaddress, true);
            var dp = gets.d,
                has_dat = (dp && dp.length > 5),
                new_dp = (has_dat) ? "&d=" + dp : "",
                ccvalue = $("#paymentdialogbox .ccpool").attr("data-value"),
                newaddressid = nextaddress.data("cmcid"),
                newaddresslabel = nextaddress.data("label"),
                page = gets.p,
                starturl = (page) ? "?p=" + page + "&payment=" : "?payment=",
                href = starturl + payment + "&uoa=" + gets.uoa + "&amount=" + gets.amount + "&address=" + newaddress + new_dp;
            renderqr(payment, newaddress, ccvalue);
            set_edit(href);
            $("#paymentaddress").text(newaddress);
            $(this).text(newaddresslabel);
            var ispending = check_pending(newaddress, newaddressid);
            if (ispending === true && request.monitored === true) {
                paymentdialogbox.attr("data-pending", "ispending"); // prevent share because of pending transaction
            } else {
                paymentdialogbox.attr("data-pending", "");
            }
            request.address = newaddress;
            sa_timer = now();
        }
    });
}

function newaddresli(currency, address) {
    var add_li = filter_addressli(currency, "checked", true),
        label_li = add_li.filter(function() { // only pick addresses with label
            return $(this).data("label").length > 0;
        }),
        c_adli = filter_addressli(currency, "address", address),
        nextaddressli = c_adli.next(".adli[data-checked='true']"),
        firstaddressli = label_li.not(".adli[data-address='" + address + "']").first();
    if (firstaddressli.length === 0) {
        return false;
    }
    return (nextaddressli.length) ? nextaddressli : firstaddressli;
}

function copyaddress_dblclick() {
    $(document).on("dblclick", "#paymentaddress, #paymentaddress_lnd, .select", function() {
        var thisnode = $(this),
            type = thisnode.attr("data-type"),
            typeval = (type) ? type : "address";
        copycontent.val(thisnode.text()).data({
            "type": typeval
        });
        notify("<span id='copyaddress'>Copy " + typeval + "?</span>", 40000, "yes");
    });
}

function copyaddress() {
    $(document).on("click", "#copyaddress", function() {
        var val = copycontent.val(),
            type = copycontent.data("type");
        copytoclipboard(val, type);
    });
}

function copyinputs() {
    $(document).on("dblclick", "#paymentdialogbox.request .mirrordiv input", function() {
        var thisval = $(this).val(),
            typeval = "amount";
        copycontent.val(thisval).data({
            "type": typeval
        });
        notify("<span id='copyaddress'>Copy " + typeval + "?</span>", 40000, "yes");
    });
}

function xmrsettings() {
    $(document).on("click", "#xmrsettings", function() {
        var result = confirm("Open XMR settings?");
        if (result === true) {
            var page_title = "monero_settings";
            openpage("?p=" + page_title, page_title, "loadpage");
            cancelpaymentdialog();
        }
    });
}

function validaterequestdata(lnurl) {
    var requestname_val = $("input#requestname").val(),
        requesttitle_val = $("input#requesttitle").val(),
        valid = (requestname_val === undefined) ? false : (requestname_val.length > 2 && requesttitle_val.length > 1) ? true : false,
        sharebutton = $("#sharebutton"),
        gets = geturlparameters(),
        page = gets.p,
        payment = gets.payment,
        currency = gets.uoa,
        amount = gets.amount,
        address = (lnurl) ? "lnurl" : gets.address,
        starturl = (page) ? "?p=" + page + "&payment=" : "?payment=",
        currenturl = starturl + payment + "&uoa=" + currency + "&amount=" + amount + "&address=" + address,
        newurl,
        ln_info = helper.lnd;
    if (valid === true) {
        var utc = now() + timezone, // UTC
            no_conf = request.no_conf,
            dataobject = {
                "ts": utc,
                "n": requestname_val,
                "t": requesttitle_val
            };
        if (no_conf === false) {
            dataobject.c = request.set_confirmations;
        }
        if (payment == "monero") {
            if (request.viewkey || request.xmr_ia) {
                if (request.viewkey && request.share_vk) {
                    dataobject.vk = request.viewkey.vk;
                }
                if (request.xmr_ia) {
                    dataobject.pid = request.payment_id;
                }
            }
        }
        if (ln_info && paymentdialogbox.attr("data-lswitch") == "lnd_ao") { // lightning data
            dataobject.imp = ln_info.imp;
            dataobject.lid = ln_info.pid;
            dataobject.proxy = ln_info.proxy_host;
            if (!ln_info.lnurl) {
                dataobject.nid = ln_info.nid;
            }
            set_lnd_qr($("#ccinputmirror > input").val(), requesttitle_val);
        }
        var newurl = currenturl + "&d=" + btoa(JSON.stringify(dataobject));
        request.requestname = requestname_val,
            request.requesttitle = requesttitle_val;
        sharebutton.addClass("sbactive");
    } else {
        var newurl = currenturl;
        sharebutton.removeClass("sbactive");
    }
    helper.currencylistitem.data("url", newurl);
    set_edit(newurl);
}

function inputrequestdata() {
    $(document).on("input", "#shareform input", function() {
        validaterequestdata();
        set_request_timer();
    });
}

function validatestepsq() {
    $(document).on("keydown", "#paymentdialogbox .mirrordiv input", function(e) {
        if (blocktyping === true) {
            playsound(funk);
            blocktyping = false;
            return
        }
        var thisnode = $(this),
            thisvalue = thisnode.val(),
            keycode = e.keyCode;
        if (keycode === 188 || keycode === 190 || keycode === 110) { // prevent double commas and dots
            if (e.target.validity.valid === false) { //test input patern and steps attribustes
                e.preventDefault();
            }
            if (thisvalue.indexOf(",") > -1 || thisvalue.indexOf(".") > -1) {
                e.preventDefault();
            }
            if (thisnode.hasClass("satinput") && (keycode === 188 || keycode === 190 || keycode === 110)) {
                e.preventDefault();
            }
            return
        }
        if (keycode === 8 || keycode === 39 || keycode === 37 || keycode === 91 || keycode === 17 || e.metaKey || e.ctrlKey) { //alow backspace, arrowright, arrowleft, command, ctrl
            return
        }
        if ((keycode > 47 && keycode < 58) || (keycode >= 96 && keycode < 106)) { //only allow numbers
            return
        }
        e.preventDefault();
        return
    })
}

function validatesteps() {
    $(document).on("keydown", "#paymentdialogbox .mirrordiv input", function(e) {
        if (blocktyping === true) {
            playsound(funk);
            blocktyping = false;
            e.preventDefault();
            return false;
        }
        var thisnode = $(this),
            thisvalue = thisnode.val(),
            keycode = e.keyCode;
        if (keycode === 188 || keycode === 190 || keycode === 110) { // prevent double commas and dots
            if (e.target.validity.valid === false || thisnode.hasClass("satinput")) { //test input patern and steps attributes
                e.preventDefault();
                return false;
            }
        } else {
            if (keycode === 8 || keycode === 39 || keycode === 37 || keycode === 91 || keycode === 17 || e.metaKey || e.ctrlKey) { //alow backspace, comma and period, arrowright, arrowleft, command, ctrl
            } else {
                if ((keycode > 47 && keycode < 58) || (keycode >= 96 && keycode < 106)) { //only allow numbers
                    if (e.target.validity.valid === false) { //test input patern and steps attributes
                        if (document.getSelection().toString().replace(",", ".") !== thisvalue.replace(",", ".")) {
                            e.preventDefault();
                            return false;
                        }
                    }
                } else {
                    e.preventDefault();
                    return false;
                }
            }
        }
    })
}

function fliprequest() {
    $(document).on("click", "#paymentdialogbox.norequest #sharerequest", function(e) {
        e.preventDefault();
        if (offline === true) {
            return
        }
        var is_lnd = (paymentdialogbox.attr("data-lswitch") == "lnd_ao");
        if (paymentdialogbox.attr("data-pending") == "ispending" && !is_lnd) {
            if (request.payment == "monero") {
                notify("Address in use. <span id='xmrsettings'>Activate integrated addresses?</span>", 40000, "yes");
                return
            }
            pendingrequest();
            return
        }
        if (is_lnd && paymentdialogbox.hasClass("accept_lnd")) {
            return
        }
        flip_right1();
    });
}

function revealtitle() {
    $(document).on("click", "#paymentdialogbox.request #sharetitle.title_exceed", function(e) {
        var thisnode = $(this),
            longtext = thisnode.attr("title"),
            shorttext = thisnode.attr("data-shorttitle");
        if (thisnode.hasClass("longtext")) {
            thisnode.html("'" + shorttext + "'").removeClass("longtext");
        } else {
            thisnode.html("'" + longtext + "'").addClass("longtext");
        }
    });
}

function check_pending(cp_address, cp_cmcid) {
    return $("#requestlist li[data-address='" + cp_address + "'][data-pending='scanning'][data-cmcid='" + cp_cmcid + "']").length > 0;
}

function pendingrequest() {
    var thisaddress = request.address,
        payment = request.payment,
        cmcid = request.cmcid,
        currencysymbol = request.currencysymbol,
        pending_tx = $("#requestlist li[data-address='" + thisaddress + "'][data-pending='scanning'][data-cmcid='" + cmcid + "']").first(),
        pending_requestid = pending_tx.data("requestid"),
        nonpending_addresslist = filter_addressli(payment, "checked", true).filter(function() {
            var thisnode = $(this);
            return $("#requestlist li[data-address='" + thisnode.data("address") + "'][data-pending='scanning'][data-cmcid='" + thisnode.data("cmcid") + "']").length === 0;
        }),
        has_addresses = nonpending_addresslist.length > 0,
        dialogcontent;
    if (has_addresses === true) {
        var addresslist = "";
        nonpending_addresslist.each(function() {
            var data = $(this).data();
            addresslist += "<span data-address='" + data.address + "' data-pe='none'>" + data.label + " | " + data.address + "</span>";
        });
        var first_address = nonpending_addresslist.first(),
            fa_data = first_address.data();
        dialogcontent = "<h3>Pick another address</h3><div class='selectbox'>\
			<input type='text' value='" + fa_data.label + " | " + fa_data.address + "' placeholder='Pick currency' readonly id='selec_address'/>\
			<div class='selectarrows icon-menu2' data-pe='none'></div>\
			<div class='options'>" + addresslist + "</div>\
		</div>\
		<input type='submit' class='submit' value='OK' id='pending_pick_address'/>";
    } else {
        dialogcontent = "<div id='addaddress' class='button'><span class='icon-plus'>Add new " + currencysymbol + " address</span></div><input type='submit' class='submit' value='OK' id='pending_add_address'/>";
    }
    var content = "<div class='formbox' id='addresslock' data-currency='" + payment + "' data-currencysymbol='" + currencysymbol + "' data-cmcid='" + cmcid + "'><h2 class='icon-lock'>Temporarily unable to share request</h2><p>This address has a <span id='view_pending_tx' data-requestid='" + pending_requestid + "'>pending shared request</span>.<br/>Please wait for the transaction to confirm before re-using the address.</p>\
	<div class='popnotify'></div>\
	<div class='popform validated'>" + dialogcontent + "</div>";
    popdialog(content, "triggersubmit");
}

function view_pending_tx() {
    $(document).on("click", "#view_pending_tx", function() {
        var result = confirm("View pending request?");
        if (result === true) {
            openpage("?p=requests", "requests", "loadpage");
            open_tx($("#" + $(this).attr("data-requestid")));
            canceldialog();
            cancelpaymentdialog();
        } else {
            return false;
        }
    });
}

function pickaddressfromdialog() {
    $(document).on("click", "#addresslock #pending_pick_address", function(e) {
        e.preventDefault();
        var thisinput = $("#selec_address"),
            thisinputvalue = thisinput.val();
        var result = confirm("Use '" + thisinputvalue + "' instead?");
        if (result === true) {
            var gets = geturlparameters(),
                picked_value = thisinputvalue.split(" | "),
                picked_label = picked_value[0],
                picked_address = picked_value[1],
                page = gets.p,
                payment = gets.payment,
                currency = gets.uoa,
                amount = gets.amount,
                currentaddress = gets.address;
            closesocket(currentaddress);
            init_socket(helper.selected_socket, picked_address, true);
            var dp = gets.d,
                has_dat = (dp && dp.length > 5),
                new_dp = (has_dat) ? "&d=" + dp : "",
                starturl = (page) ? "?p=" + page + "&payment=" : "?payment=",
                href = starturl + payment + "&uoa=" + currency + "&amount=" + amount + "&address=" + picked_address + new_dp,
                ccvalue = $("#paymentdialogbox .ccpool").attr("data-value");
            $("#paymentaddress").text(picked_address);
            $("#labelbttn").text(picked_label);
            request.address = picked_address;
            renderqr(payment, picked_address, ccvalue);
            set_edit(href);
            paymentdialogbox.attr("data-pending", "");
            canceldialog();
        } else {
            return false;
        }
    });
}

function set_edit(url) {
    if (request.iszero_request === true) {
        return
    }
    history.replaceState(null, null, url);
    localStorage.setItem("bitrequest_editurl", url);
}

function addaddressfromdialog() {
    $(document).on("click", "#addresslock #pending_add_address, #addaddress", function(e) {
        e.preventDefault();
        var formbox = $(this).closest("#addresslock"),
            payment = request.payment,
            cmcid = request.cmcid,
            erc20 = request.erc20,
            dd = derive_data(payment, true),
            ad = {
                "currency": payment,
                "ccsymbol": request.currencysymbol,
                "cmcid": cmcid,
                "checked": true,
                "erc20": erc20,
                "dd": dd
            },
            scanqr = (hascam === true) ? "<div class='qrscanner' data-currency='" + payment + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
            scanvk = (hascam === true) ? "<div class='qrscanner' data-currency='" + payment + "' data-id='viewkey' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
            vk_box = (payment == "monero") ? "<div class='inputwrap'><input type='text' class='vk_input' value='' placeholder='View key'>" + scanvk + "</div>" : "",
            der_src = (dd) ? (dd.xpubid) ? " from Xpub" : " from seed" : "",
            seedstr = (dd) ? "<div class='popnotify' style='display:block'><span id='addfromseed' class='address_option'>Generate address" + der_src + "</span></div>" : "<div class='popnotify'></div>",
            content = $("<div class='formbox form add' id='addressformbox'><h2>" + getcc_icon(cmcid, request.cpid, erc20) + " Add " + payment + " address</h2>" + seedstr + "<form id='addressform' class='popform'><div class='inputwrap'><input type='text' class='address' value='' placeholder='Enter a " + payment + " address'>" + scanqr + "</div>" + vk_box + "<input type='text' class='addresslabel' value='' placeholder='label'><div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>I own the seed / private key of this address</span></div><input type='submit' class='submit' value='OK'></form></div>").data(ad);
        formbox.parent("#dialogbody").html(content);
    });
}

function add_from_seed() {
    $(document).on("click", "#addfromseed", function() {
        var ad = $("#addressformbox").data(),
            currency = ad.currency,
            dd = ad.dd;
        if (currency && dd) {
            if (dd.address) {
                var result = confirm("Are you sure you want to generate a new " + currency + " address? It may not show up in some wallets");
                if (result === true) {
                    derive_add_address(currency, dd);
                    canceldialog();
                }
            }
        }
    });
}

function scanqr() {
    $(document).on("click", "#scanqr", function() {
        remove_flip();
        if (request.iszero_request === true) {
            $("#amountbreak input").focus();
        }
    });
}

function showapistats() {
    $(document).on("click", "#apisrc", function() {
        var xratestats = $("#xratestats");
        if (xratestats.hasClass("show")) {
            xratestats.removeClass("show");
        } else {
            xratestats.addClass("show");
        }
    });
}

function hideapistats() {
    $(document).on("click", "#xratestats", function() {
        $(this).removeClass("show");
    });
}

//share
function sharebutton() {
    $(document).on("click", "#sharebutton", function() {
        var thisbttn = $(this);
        if (request.payment == "bitcoin" && helper.lnd_status) {
            var lnd_only = (paymentdialogbox.attr("data-lswitch") == "lnd_ao") ? ($("#fallback_address").is(":visible")) ? ($("#fallback_address .switchpanel").hasClass("true")) ? false : true : true : false;
            validaterequestdata(lnd_only);
            setTimeout(function() { // wait for url to change
                share(thisbttn);
            }, 100);
            return
        }
        if (!geturlparameters().d) {
            validaterequestdata();
            setTimeout(function() { // wait for url to change
                share(thisbttn);
            }, 100);
            return
        }
        share(thisbttn);
    });
}

function share(thisbutton) {
    if (thisbutton.hasClass("sbactive")) {
        loader(true);
        var gets = geturlparameters(),
            payment = gets.payment,
            thiscurrency = gets.uoa,
            thisamount = gets.amount,
            thisaddress = gets.address,
            dataparam = gets.d,
            cmcid = request.cmcid,
            currencysymbol = request.currencysymbol,
            thisdata = (dataparam && dataparam.length > 5);
        try {
            var dataobject = (thisdata === true) ? JSON.parse(atob(dataparam)) : null, // decode data param if exists
                thisrequestname = (thisdata === true) ? dataobject.n : $("#accountsettings").data("selected"),
                thisrequesttitle = (thisdata === true) ? dataobject.t : "",
                lightning = (thisdata === true) ? (dataobject.imp) ? true : false : false,
                hybrid = (lightning && thisaddress != "lnurl");
        } catch (e) { // data param corrupted
            var content = "<h2 class='icon-blocked'>Invalid request</h2><p>" + e + "</p>";
            popdialog(content, "canceldialog");
            return false;
        }
        var newdatastring = (thisdata === true) ? "&d=" + dataparam : "", // construct data param if exists
            shared_host = (thishostname.indexOf("ipfs") > -1 || thishostname.indexOf("bitrequest.crypto") > -1) ? thishostname : "https://bitrequest.github.io", // check for IFPS
            sharedurl = shared_host + "/?p=requests&payment=" + payment + "&uoa=" + thiscurrency + "&amount=" + thisamount + "&address=" + thisaddress + newdatastring,
            thisrequestname_uppercase = thisrequestname.substr(0, 1).toUpperCase() + thisrequestname.substr(1), // capitalize requestname
            paymentupper = payment.substr(0, 1).toUpperCase() + payment.substr(1),
            payment_name = (lightning) ? "Lightning" : paymentupper,
            sharedtitle = (thisdata === true) ? thisrequestname_uppercase + " sent a " + payment_name + " payment request of " + thisamount + " " + thiscurrency.toUpperCase() + " for '" + thisrequesttitle + "'" : "You have a " + payment_name + " payment request of " + thisamount + " " + thiscurrency,
            encodedurl = encodeURIComponent(sharedurl),
            firebase_dynamiclink = firebase_shortlink + "?link=" + encodedurl + "&apn=" + androidpackagename + "&afl=" + encodedurl,
            share_icon = (lightning) ? "https://bitrequest.github.io/img_logos_btc-lnd.png" : cmc_icon_loc + cmcid + ".png";
        shorten_url(sharedtitle, sharedurl, share_icon);
        setlocales();
    } else {
        var requestname = $("#requestname"),
            requesttitle = $("#requesttitle"),
            name_check = requestname.val().length,
            title_check = requesttitle.val().length,
            name_check_message = (name_check < 1) ? "Please enter your name" : (name_check < 3) ? "Name should have minimal 3 characters" : "Please check your form",
            title_check_message = (title_check < 1) ? "Please enter a description" : (title_check < 2) ? "Description should have minimal 2 characters" : "Please check your form",
            check_message = (name_check < 3) ? name_check_message : (title_check < 2) ? title_check_message : "Please fill in required fields";
        topnotify(check_message);
        if (name_check < 3) {
            requestname.focus();
        } else if (title_check < 2) {
            requesttitle.focus();
        }
    }
}

function shorten_url(sharedtitle, sharedurl, sitethumb, unguessable) {
    loadertext("Generating link");
    var us_settings = $("#url_shorten_settings"),
        us_active = (us_settings.data("us_active") == "active");
    if (us_active === true) {
        var us_service = us_settings.data("selected"),
            getcache = sessionStorage.getItem("bitrequest_" + us_service + "_shorturl_" + hashcode(sharedurl));
        if (getcache) { // get existing shorturl from cache
            sharerequest(getcache, sharedtitle);
            return
        }
        if (us_service == "firebase") {
            var security = (unguessable === true) ? "UNGUESSABLE" : "SHORT";
            api_proxy({
                "api": "firebase",
                "search": "shortLinks",
                "cachetime": 84600,
                "cachefolder": "1d",
                "params": {
                    "method": "POST",
                    "cache": false,
                    "dataType": "json",
                    "contentType": "application/json",
                    "data": JSON.stringify({
                        "dynamicLinkInfo": {
                            "domainUriPrefix": firebase_dynamic_link_domain,
                            "link": sharedurl,
                            "androidInfo": {
                                "androidPackageName": androidpackagename
                            },
                            "iosInfo": {
                                "iosBundleId": androidpackagename,
                                "iosAppStoreId": "1484815377"
                            },
                            "navigationInfo": {
                                "enableForcedRedirect": "1"
                            },
                            "socialMetaTagInfo": {
                                "socialTitle": "Bitrequest",
                                "socialDescription": "Accept crypto anywhere",
                                "socialImageLink": sitethumb
                            }
                        },
                        "suffix": {
                            "option": security
                        }
                    })
                }
            }).done(function(e) {
                var data = br_result(e).result;
                if (data.error) {
                    sharerequest(sharedurl, sharedtitle);
                    return
                }
                var shorturl = data.shortLink;
                sharerequest(shorturl, sharedtitle);
                sessionStorage.setItem("bitrequest_firebase_shorturl_" + hashcode(sharedurl), shorturl);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                sharerequest(sharedurl, sharedtitle);
            });
            return
        }
        if (us_service == "bitly") {
            api_proxy({
                "api": "bitly",
                "search": "bitlinks",
                "cachetime": 84600,
                "cachefolder": "1d",
                "bearer": true,
                "params": {
                    "method": "POST",
                    "contentType": "application/json",
                    "data": JSON.stringify({
                        "long_url": sharedurl
                    })
                }
            }).done(function(e) {
                var data = br_result(e).result;
                if (data.id) {
                    var linkid = data.id.split("/").pop(),
                        shorturl = data.link;
                    sharerequest(shorturl, sharedtitle);
                    sessionStorage.setItem("bitrequest_bitly_shorturl_" + hashcode(sharedurl), shorturl);
                    return
                }
                sharerequest(sharedurl, sharedtitle);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                sharerequest(sharedurl, sharedtitle);
            });
            return
        }
    }
    sharerequest(sharedurl, sharedtitle);
}

function sharerequest(sharedurl, sharedtitle) {
    closeloader();
    if (is_ios_app === true) {
        sharefallback(sharedurl, sharedtitle);
        return
    }
    if (supportsTouch === true && navigator.canShare) {
        navigator.share({
            "title": sharedtitle + " | " + apptitle,
            "text": sharedtitle + ": \n",
            "url": sharedurl
        }).then(() => sharecallback()).catch(err => console.log(err));
        return
    }
    sharefallback(sharedurl, sharedtitle);
}

function sharefallback(sharedurl, sharedtitle) {
    var mobileclass = (supportsTouch === true) ? " showtouch" : "";
    $("#sharepopup").addClass("showpu active" + mobileclass).data({
        "sharetitle": sharedtitle,
        "shareurl": sharedurl
    });
    body.addClass("sharemode");
}

function whatsappshare() {
    $(document).on("click", "#whatsappshare", function() {
        sharecallback();
        var shareinfo = getshareinfo(),
            sharetext = encodeURIComponent(shareinfo.body),
            share_url = "whatsapp://send?text=" + sharetext;
        open_share_url("location", share_url);
    });
}

function mailto() {
    $(document).on("click", "#mailto", function() {
        sharecallback();
        var shareinfo = getshareinfo(),
            share_url = "mailto:?subject=" + encodeURIComponent(shareinfo.title) + "&body=" + encodeURIComponent(shareinfo.body);
        open_share_url("location", share_url);
    });
}

function copyurl() {
    $(document).on("click", "#copyurl", function() {
        copytoclipboard(getshareinfo().url, "Request url");
        sharecallback();
    });
}

function gmailshare() {
    $(document).on("click", "#gmailshare", function() {
        sharecallback();
        var shareinfo = getshareinfo(),
            share_url = "https://mail.google.com/mail/?view=cm&fs=1&su=" + encodeURIComponent(shareinfo.title) + "&body=" + encodeURIComponent(shareinfo.body);
        open_share_url("open", share_url);
    });
}

function telegramshare() {
    $(document).on("click", "#telegramshare", function() {
        sharecallback();
        var shareinfo = getshareinfo(),
            share_url = "https://telegram.me/share/url?url=" + shareinfo.url + "&text=" + encodeURIComponent(shareinfo.body);
        open_share_url("open", share_url);
    });
}

function outlookshare() {
    $(document).on("click", "#outlookshare", function() {
        sharecallback();
        var shareinfo = getshareinfo(),
            share_url = "ms-outlook://compose?subject=" + encodeURIComponent(shareinfo.title) + "&body=" + encodeURIComponent(shareinfo.body);
        open_share_url("location", share_url);
    });
}

function getshareinfo() {
    var sharepopup = $("#sharepopup"),
        sharetitle = sharepopup.data("sharetitle"),
        shareurl = sharepopup.data("shareurl");
    return {
        "title": sharetitle,
        "url": shareurl,
        "body": sharetitle + ": \n " + shareurl
    }
}

function sharecallback() {
    if (request) {
        request.received = true,
            request.requesttype = "outgoing",
            request.status = "new",
            request.pending = (request.monitored === false) ? "unknown" : "scanning";
        saverequest();
        loadpage("?p=requests");
        cancelpaymentdialog();
    } else {
        canceldialog();
    }
    cancelsharedialog();
    notify("Successful share! 🎉");
}

function open_share_url(type, url) {
    loader(true);
    setTimeout(function() {
        closeloader();
        if (type == "open") {
            window.open(url);
            return
        }
        if (type == "location") {
            w_loc.href = url;
        }
    }, 500);
}

function trigger_open_tx() {
    var tx_param = geturlparameters().txhash;
    if (tx_param) {
        tx_node = get_requestli("txhash", tx_param);
        open_tx(tx_node);
    }
}

function view_tx() {
    $(document).on("click", "#view_tx", function() {
        if (inframe === true) {
            html.removeClass("hide_app");
        }
        openpage("?p=requests", "requests", "loadpage");
        var tx_hash = $(this).attr("data-txhash"),
            tx_node = get_requestli("txhash", tx_hash);
        open_tx(tx_node);
    });
}

function open_tx(tx_node) {
    var selected_request = (tx_node.length > 0) ? tx_node : $("#requestlist .rqli").first(),
        infopanel = selected_request.find(".moreinfo"),
        metalist = infopanel.find(".metalist");
    $(".moreinfo").not(infopanel).slideUp(500);
    $(".metalist").not(metalist).slideUp(500);
    $(".historic_meta").slideUp(200);
    infopanel.add(metalist).slideDown(500);
    selected_request.addClass("visible_request");
    var confbar = selected_request.find(".transactionlist .confbar");
    if (confbar.length > 0) {
        confbar.each(function(i) {
            animate_confbar($(this), i);
        });
    };
    setTimeout(function() { // wait for url to change
        $("html, body").animate({
            "scrollTop": selected_request.offset().top - $("#fixednav").height()
        }, 500);
    }, 1000);
}

// ** Save and update request **

function saverequest(direct) {
    var gets = geturlparameters(),
        thispayment = gets.payment,
        thiscurrency = gets.uoa,
        thisamount = gets.amount,
        currencysymbol = request.currencysymbol,
        thisrequesttype = request.requesttype,
        thispaymenttimestamp = request.paymenttimestamp,
        set_confirmations = request.set_confirmations,
        ln_info = helper.lnd,
        ln_id = (ln_info) ? ln_info.pid : "",
        sc_string = (ln_info) ? "1" : (set_confirmations) ? set_confirmations.toString() : "0",
        amount_string = (thisamount) ? thisamount.toString() : "0",
        thisaddress = (request.address == "lnurl") ? "lnurl" : gets.address, // if lightning payment, overwrite address 
        thisdata = gets.d,
        thismeta = gets.m,
        timestamp = now() + timezone, // UTC
        rqdatahash = (thisdata && thisdata.length > 5) ? thisdata : null, // check if data param exists
        rqmetahash = (thismeta && thismeta.length > 5) ? thismeta : null, // check if meta param exists
        dataobject = (rqdatahash) ? JSON.parse(atob(rqdatahash)) : null, // decode data param if exists
        requesttimestamp = (thispaymenttimestamp) ? thispaymenttimestamp : (dataobject && dataobject.ts) ? dataobject.ts : (thisrequesttype == "incoming") ? null : timestamp, // null is unknown timestamp
        unhashed = thispayment + thiscurrency + amount_string + thisaddress + request.requestname + request.requesttitle + sc_string + ln_id,
        savedtxhash = request.txhash,
        requestid = (thisrequesttype == "local" && savedtxhash) ? hashcode(savedtxhash) : hashcode(unhashed),
        this_requestid,
        requestcache = localStorage.getItem("bitrequest_requests"),
        requestid_param = gets.requestid,
        checkout = (direct != "init" && thisrequesttype == "checkout"),
        this_iscrypto = (thiscurrency == currencysymbol),
        ln = (dataobject && dataobject.imp) ? true : false,
        hybrid = true,
        invoice = false,
        lightning = false;
    if (ln_info) {
        if (thisaddress == "lnurl") {
            request.address = thisaddress;
            var hybrid = false;
        }
        var invoice = ln_info.invoice,
            lightning = (thisrequesttype == "outgoing" && ln == false) ? false : {
                "imp": ln_info.imp,
                "host": ln_info.host,
                "key": ln_info.key,
                "pid": ln_info.pid,
                "nid": ln_info.nid,
                "pw": ln_info.pw,
                "invoice": invoice,
                "proxy_host": ln_info.proxy_host,
                "hybrid": hybrid
            };
    }
    if (requestcache) {
        var requestnode = JSON.parse(requestcache),
            this_requestid = $.grep(requestnode, function(filter) { //filter pending requests
                return filter.requestid == requestid;
            });
    }
    var incache = (this_requestid && this_requestid.length > 0);
    if (incache === true || requestid_param) { // do not save if request already exists
        var smart_id = (requestid_param) ? requestid_param : requestid,
            requestli = $("#" + smart_id),
            rldata = requestli.data(),
            pendingstate = rldata.pending;
        if (savedtxhash) { // check if request is opened or updated
            request.received = true;
            if (pendingstate == "paid") {} else {
                var update_dat = {
                    "requestid": smart_id,
                    "status": request.status,
                    "receivedamount": request.receivedamount,
                    "fiatvalue": request.fiatvalue,
                    "paymenttimestamp": thispaymenttimestamp,
                    "txhash": savedtxhash,
                    "confirmations": request.confirmations,
                    "pending": request.pending,
                    "lightning": lightning
                };
                sessionStorage.removeItem("bitrequest_historic_" + smart_id); // remove historic price cache
                updaterequest(update_dat, true);
            }
        } else {
            var rqstatus = rldata.status;
            if (pendingstate == "scanning" || rqstatus == "canceled") { // do nothing
                return false;
            } else {
                if (pendingstate == "polling" || requestli.hasClass("expired")) {
                    pendingdialog(requestli);
                    if (lightning) {
                        return false;
                    }
                    return "nosocket";
                }
                if (pendingstate == "no") {
                    request.received = true;
                    var txhash_state = rldata.txhash,
                        typestate = rldata.requesttype,
                        send_receive = (typestate == "incoming") ? "sent" : "received";
                    adjust_paymentdialog("paid", "no", "Payment " + send_receive);
                    paymentdialogbox.find("span#view_tx").attr("data-txhash", txhash_state);
                    return "nosocket";
                }
            }
        }
    } else {
        //overwrite global request object
        request.requestid = requestid,
            request.iscrypto = this_iscrypto,
            request.fiatcurrency = (this_iscrypto === true) ? request.localcurrency : thiscurrency,
            request.currencyname = $("#xratestats .cpool[data-currency='" + thiscurrency + "']").attr("data-currencyname"),
            request.cc_amount = parseFloat($("#open_wallet").attr("data-rel"));
        var numberamount = Number(thisamount),
            this_iszero = (numberamount === 0 || isNaN(numberamount));
        if (direct == "init" && request.shared === false) { // when first opened only save shared requests
        } else if (this_iszero === true) { // don't save requests with zero value
        } else {
            var coinsettings = request.coinsettings,
                append_object = $.extend(request, {
                    "archive": false,
                    "showarchive": false,
                    "timestamp": timestamp,
                    "requestdate": requesttimestamp,
                    "rqdata": rqdatahash,
                    "rqmeta": rqmetahash,
                    "lightning": lightning
                });
            delete append_object.coinsettings; // don't save coinsettings in request
            appendrequest(append_object);
            setTimeout(function() {
                saverequests();
            }, 500);
            if (!requestid_param && direct === true) { // Add request_params (make it a request)
                var request_params = "&requestid=" + requestid + "&status=" + request.status + "&type=" + thisrequesttype;
                history.replaceState(null, null, w_loc.href + request_params);
            }
            if (coinsettings) {
                var reuse = coinsettings["Reuse address"];
                if (reuse) {
                    var addressli = filter_addressli(thispayment, "address", thisaddress);
                    addressli.addClass("used").data("used", true);
                    if (reuse.selected === false) {
                        // Derive new address
                        if (hybrid === false) {} else {
                            saveaddresses(thispayment, false);
                            derive_addone(thispayment);
                        }
                    }
                }
            }
        }
    }
    // post to parent
    if (checkout) {
        var contact_param = gets.contactform,
            meta_data_object = (rqmetahash) ? JSON.parse(atob(rqmetahash)) : null, // decode meta param if exists
            fiatvalue_rounded = trimdecimals(request.fiatvalue, 2),
            received_in_currency = (this_iscrypto === true) ? request.receivedamount : fiatvalue_rounded,
            tpts = (thispaymenttimestamp) ? thispaymenttimestamp : timestamp,
            tx_data = {
                "currencyname": request.currencyname,
                "requestid": requestid,
                "cmcid": request.cmcid,
                "payment": thispayment,
                "ccsymbol": currencysymbol,
                "iscrypto": this_iscrypto,
                "amount": thisamount,
                "receivedamount": received_in_currency,
                "receivedcc": request.receivedamount,
                "fiatvalue": fiatvalue_rounded,
                "status": request.status,
                "txhash": savedtxhash,
                "receiver": thisaddress,
                "confirmations": request.confirmations,
                "set_confirmations": set_confirmations,
                "transactiontime": tpts,
                "pending": request.pending,
                "lightning": lightning
            },
            contactdata;
        if (contact_param) {
            var cfdata = $("#contactform").data(),
                cf_address = cfdata.address;
            if (cf_address) {
                var contactdata = {
                    "name": cfdata.name,
                    "address": cf_address,
                    "zipcode": cfdata.zipcode,
                    "city": cfdata.city,
                    "country": cfdata.country,
                    "email": cfdata.email
                }
            }
        };
        var post_data = {
            "txdata": tx_data,
            "data": dataobject,
            "meta": meta_data_object,
            "contact": contactdata
        };
        parent.postMessage({
            "id": "result",
            "data": post_data
        }, "*");
    }
    if (thisrequesttype == "incoming") {} else {
        helper.currencylistitem.removeData("url"); // remove saved url / reset lightning id
        localStorage.removeItem("bitrequest_editurl");
        sessionStorage.removeItem("bitrequest_lndpid");
    }
    if (body.hasClass("ios")) {} else {
        var rq_storage = localStorage.getItem("bitrequest_requests");
        if (!rq_storage || rq_storage == "[]") {
            gd_init = true;
        }
    }
}

function pendingdialog(pendingrequest) { // show pending dialog if tx is pending
    request.received = true;
    var prdata = pendingrequest.data(),
        status = prdata.status,
        txhash = prdata.txhash,
        tl_txhash = pendingrequest.find(".transactionlist li:first").data("txhash"),
        smart_txhash = (txhash) ? txhash : tl_txhash,
        typestate = prdata.requesttype,
        send_receive = (typestate == "incoming") ? "sent" : "received",
        brstatuspanel = paymentdialogbox.find(".brstatuspanel"),
        viewtx = brstatuspanel.find("#view_tx"),
        pending = prdata.pending,
        thispayment = prdata.payment,
        lightning = prdata.lightning;
    viewtx.attr("data-txhash", smart_txhash);
    if (pendingrequest.hasClass("expired")) {
        if (status == "new" || status == "insufficient") {
            adjust_paymentdialog("expired", "no", "<span class='icon-clock'></span>Request expired");
            paymentdialogbox.find("span#view_tx").hide();
        }
        return
    }
    if (lightning) {
        var invoice = lightning.invoice;
        if (invoice) {
            if (invoice.status == "paid") {
                adjust_paymentdialog("paid", "no", "Payment " + send_receive);
                return
            }
            if (invoice.status == "pending") {
                adjust_paymentdialog("pending", "polling", "Waiting for payment");
                return
            }
            return
        }
    }
    if (thispayment == "nano") { // 0 confirmation so payment must be sent
        if (status == "insufficient") {
            adjust_paymentdialog("insufficient", "scanning", "Insufficient amount");
            return
        }
        adjust_paymentdialog("paid", "no", "Payment " + send_receive);
        return
    }
    if (smart_txhash) {
        add_flip();
        if (pending == "scanning") {
            if (status == "insufficient") {
                adjust_paymentdialog("insufficient", "scanning", "Insufficient amount");
                return
            }
            adjust_paymentdialog("pending", "scanning", "Pending request");
            return
        }
        adjust_paymentdialog("pending", "polling", "Transaction broadcasted");
        if (thispayment == "monero") {
            var address = prdata.address,
                vk = request.viewkey;
            if (vk) {
                var account = (vk.account) ? vk.account : address,
                    viewkey = vk.vk,
                    starttime = now();
                closenotify();
                init_xmr_node(34, account, viewkey, starttime, smart_txhash, true);
                return
            }
            notify("this currency is not monitored", 500000, "yes");
            return
        }
        pick_monitor(smart_txhash);
    }
}

function adjust_paymentdialog(status, pending, status_text) {
    var play_sound = (status == "insufficient") ? funk : blip,
        brstatuspanel = paymentdialogbox.find(".brstatuspanel");
    playsound(play_sound);
    add_flip();
    paymentdialogbox.addClass("transacting").attr({
        "data-status": status,
        "data-pending": pending
    });
    brstatuspanel.find("h2").html(status_text);
}

//open wallet
function openwallet() {
    $(document).on("click", ".openwallet, .openwallet_lnd", function() {
        var thisnode = $(this),
            thiscurrency = thisnode.attr("data-currency"),
            this_url = thisnode.attr("title"),
            lndurl = (this_url && this_url.slice(0, 9) == "lightning"),
            lnd_ref = (lndurl) ? "lightning" : thiscurrency,
            content = "<div class='formbox' id='backupformbox'><h2 class='icon-folder-open'>Do you have a " + lnd_ref + " wallet on this device?</h2><div class='popnotify'></div><div id='backupactions'><a href='" + this_url + "' class='customtrigger' id='openwalleturl'>Yes</a><div id='dw_trigger' class='customtrigger' data-currency='" + lnd_ref + "'>No</div></div>";
        popdialog(content, "triggersubmit");
    });
}

function openwalleturl() {
    $(document).on("click", "#openwalleturl", function() {
        canceldialog();
    });
}

function dw_trigger() {
    $(document).on("click", "#dw_trigger", function() {
        var this_currency = $(this).attr("data-currency");
        canceldialog();
        setTimeout(function() {
            download_wallet(this_currency);
        }, 800);
    })
}

function download_wallet(currency) {
    var ln = (currency == "lightning") ? true : false,
        thiscurrency = (ln) ? "bitcoin" : currency,
        coindata = getcoinconfig(thiscurrency),
        wallets = (ln) ? coindata.lightning_wallets : coindata.wallets,
        wdp = wallets.wallet_download_page,
        wallets_arr = wallets.wallets;
    if (wdp || wallets_arr) {
        var wallet_ul = (wallets_arr) ? "<ul id='formbox_ul'></ul>" : "",
            fmw = (wdp) ? "<a href='" + wdp + "' target='_blank' class='exit formbox_href'>Find more wallets</a>" : "",
            content = "\
			<div class='formbox' id='wdl_formbox'>\
				<h2 class='icon-download'>Download " + currency + " wallet</h2>\
				<div class='popnotify'></div>\
				<div id='dialogcontent'>" + wallet_ul + fmw + "</div>\
				<div id='backupactions'>\
					<div class='cancel_dialog customtrigger'>CANCEL</div>\
				</div>\
			</div>";
        popdialog(content, "canceldialog");
        if (wallets_arr) {
            var walletlist = $("#formbox_ul"),
                device = getdevicetype(),
                platform = getplatform(device),
                store_icon = platform_icon(platform),
                store_tag = (store_icon) ? "<img src='" + store_icon + "'/>" : "<span class='icon-download'></span> ";
            $.each(wallets_arr, function(key, value) {
                var device_url = value[platform];
                if (device_url) {
                    var walletname = value.name,
                        website = value.website,
                        wallet_icon = (ln) ? "<img src='img_logos_btc-lnd.png' class='wallet_icon'/>" : "<img src='" + w_icon(walletname) + "' class='wallet_icon'/>";
                    walletlist.append("<li><a href='" + website + "' target='_blank' class='exit app_dll'>" + wallet_icon + walletname + "</a><a href='" + device_url + "' target='_blank' class='exit store_tag'>" + store_tag + "</a></li>");
                }
            });
        }
    }
}

function updaterequest(ua, save) {
    var requestlist = $("#" + ua.requestid),
        rldata = requestlist.data(),
        metalist = requestlist.find(".metalist");
    if (ua.receivedamount) {
        metalist.find(".receivedamount span").text(" " + trimdecimals(ua.receivedamount, 6));
    }
    if (ua.fiatvalue) {
        metalist.find(".payday.pd_fiat .fiatvalue").text(" " + trimdecimals(ua.fiatvalue, 2));
    }
    if (ua.paymenttimestamp) {
        var fulldateformat = fulldateformatmarkup(new Date(ua.paymenttimestamp - timezone), "en-us");
        metalist.find(".payday.pd_paydate span.paydate").html(" " + fulldateformat);
        metalist.find(".payday.pd_fiat strong span.pd_fiat").html(" " + fulldateformat);
    }
    if (ua.confirmations) {
        var meta_status = metalist.find("li.meta_status"),
            set_confirmations = (rldata && rldata.set_confirmations) ? rldata.set_confirmations : 1,
            conftext = (ua.confirmations == 0) ? "Unconfirmed transaction" : ua.confirmations + " / " + set_confirmations + " confirmations";
        meta_status.attr("data-conf", ua.confirmations).find(".txli_conf > span").text(conftext);
        var confbar = meta_status.find(".txli_conf > .confbar");
        if (confbar.length > 0) {
            confbar.each(function(i) {
                animate_confbar($(this), 0);
            });
        }
    }
    if (ua.pending) {
        requestlist.attr("data-pending", ua.pending)
    }
    if (ua.status) {
        var this_status = ua.status;
        if (this_status != "archive_pending") { // don't update if status is archive_pending
            requestlist.attr("data-status", this_status);
            metalist.find(".status").text(" " + this_status);
        }
        if (this_status == "paid" || this_status == "archive_pending") {
            if (this_status == "paid") {
                if (inframe === false) {
                    playsound(blip);
                }
                requestlist.addClass("shownotification");
            }
            var transactionlist = requestlist.find(".transactionlist"),
                validtxs = (this_status == "archive_pending") ? transactionlist.find("li") : transactionlist.find("li.exceed"); // save all when archiving
            if (validtxs.length > 0) {
                var transactionpush = [];
                validtxs.each(function() {
                    transactionpush.push($(this).data());
                });
                ua.txhistory = transactionpush;
            }
            transactionlist.find("li").not(validtxs).slideUp(300);
            setTimeout(function() {
                requestlist.removeClass("shownotification");
            }, 3000);
        }
        // adjust insufficient amount
        var amount_short_span = metalist.find(".amountshort");
        if (this_status == "insufficient") {
            var rl_amount = rldata.amount,
                rl_iscrypto = rldata.iscrypto,
                rl_uoa = rldata.uoa,
                amount_short_rounded = amountshort(rl_amount, ua.receivedamount, ua.fiatvalue, rl_iscrypto),
                amount_short_span_text = " (" + amount_short_rounded + " " + rl_uoa.toUpperCase() + " short)";
            amount_short_span.text(amount_short_span_text).addClass("show_as");
        } else {
            amount_short_span.removeClass("show_as");
        }
    }
    if (ua.requesttitle) {
        var thisrequesttitle = ua.requesttitle;
        if (thisrequesttitle == "empty") {
            return
        }
        var textinput = (rldata.requesttitle) ? requestlist.find(".atext h2") :
            requestlist.find(".rq_subject");
        textinput.add(metalist.find(".requesttitlebox")).text(thisrequesttitle);
    }
    requestlist.data(ua);
    if (save === true) {
        setTimeout(function() {
            saverequests();
        }, 1000);
    }
}

function get_xmrpid() {
    var use_integrated = cs_dat("monero", "Integrated addresses").selected;
    if (use_integrated) {
        return xmr_pid();
    }
    return false;
}

function xmr_integrated(xmr_address, pmid) {
    var is_valid = check_pid(pmid);
    if (is_valid) {
        var pahx = cnBase58.decode(xmr_address),
            psk = pahx.slice(2, 66),
            pvk = pahx.slice(66, 130),
            bytes = "13" + psk + pvk + pmid,
            checksum = bytes + fasthash(bytes).slice(0, 8);
        return base58_encode(hextobin(checksum));
    }
    console.log("invalid xmr payment id");
    return xmr_address;
}