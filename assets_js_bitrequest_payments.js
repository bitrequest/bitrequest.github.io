//globals

const glob_cacheperiodcrypto = 120000, //120000 = 2 minutes
    glob_cacheperiodfiat = 600000, //600000 = 10 minutes
    glob_zeroplaceholder = parseFloat((0.00).toLocaleString(glob_langcode, {
        "minimumFractionDigits": 2,
        "maximumFractionDigits": 2
    })).toFixed(2);

// Global helpers
let glob_blockswipe,
    glob_angle,
    glob_percent,
    glob_sa_timer,
    glob_request_timer,
    glob_blocktyping = false,
    glob_lnd_ph = false,
    glob_prevkey = false,
    request = null,
    helper = null;

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
    //poll_animate

    // ** Paymentdialog **

    //loadpaymentfunction
    //get_tokeninfo
    //continue_paymentfunction
    //lightning_setup
    //test_lnd
    //proceed_pf
    //getccexchangerates
    //cc_fail
    //initexchangerate
    //get_fiat_exchangerate
    //rendercurrencypool
    //getpayment
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
    //btc_urlscheme
    //bch_urlscheme
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
    //shorten_url
    //bitly_shorten
    //firebase_shorten
    //custom_shorten
    //randomId
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

// Initializes the panel wake functionality
function wake_panel() {
    $(document).on("mousedown touchstart", "#paymentdialogbox", function() {
        set_request_timer();
    })
}

// Sets a timer to close the request dialog after 3 minutes
function set_request_timer() {
    // close request dialog after 3 minutes
    clearTimeout(glob_request_timer);
    glob_paymentdialogbox.removeClass("timer");
    glob_request_timer = setTimeout(function() {
        cpd_pollcheck();
    }, 180000, function() {
        clearTimeout(glob_request_timer);
    });
    setTimeout(function() {
        glob_paymentdialogbox.addClass("timer");
    }, 500);
}

// Initializes the swipe start functionality for the payment dialog
function swipestart() {
    $(document).on("mousedown touchstart", "#paymentdialog", function(e) {
        glob_blockswipe = false;
        const thisdialog = $(this),
            inputs = thisdialog.find("input");
        if (inputs.is(":focus")) {
            glob_blockswipe = true;
        }
        const startheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
        startswipetime = now();
        swipe(thisdialog.height(), startheight);
    })
}

// Handles the swipe movement for the payment dialog
function swipe(dialogheight, startheight) {
    $(document).on("mousemove touchmove", "#payment", function(e) {
        if (glob_blockswipe === true) {
            unfocus_inputs();
            return
        }
        const currentheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY,
            dragdistance = currentheight - startheight;
        if (Math.abs(dragdistance) > 3) { // margin to activate swipe
            glob_html.addClass("swipemode");
            const distance = dragdistance / dialogheight,
                posdist = 1 - Math.abs(distance);
            glob_percent = distance * 100;
            $(this).addClass("swiping");
            $("#paymentdialog").css({
                "opacity": posdist,
                "transform": "translate(0, " + glob_percent + "%)"
            });
        }
    })
}

// Handles the end of a swipe action
function swipeend() {
    $(document).on("mouseup mouseleave touchend", "#payment", function() {
        $(document).off("mousemove touchmove", "#payment");
        const thisunit = $(this);
        if (thisunit.hasClass("swiping")) {
            const paymentdialog = $("#paymentdialog"),
                swipetime = now() - startswipetime,
                largeswipe = Math.abs(glob_percent) > 90,
                smallswipe = Math.abs(glob_percent) > 25;
            if (largeswipe || (smallswipe && swipetime < 500)) {
                thisunit.removeClass("swiping");
                paymentdialog.css({
                    "opacity": "",
                    "transform": ""
                });
                cpd_pollcheck();
                glob_html.removeClass("swipemode");
            } else {
                thisunit.removeClass("swiping");
                paymentdialog.css({
                    "opacity": "",
                    "transform": ""
                });
                glob_html.removeClass("swipemode");
            }
        }
    })
}

// Initializes the flip start functionality for the payment dialog
function flipstart() {
    $(document).on("mousedown touchstart", "#paymentdialog", function(e) {
        if (glob_paymentdialogbox.hasClass("norequest")) {
            if (glob_offline === true) {
                return
            }
            const is_lnd = glob_paymentdialogbox.attr("data-lswitch") === "lnd_ao";
            if (glob_paymentdialogbox.attr("data-pending") === "ispending" && !is_lnd) {
                return;
            }
            if (is_lnd && glob_paymentdialogbox.hasClass("accept_lnd")) {
                return;
            }
        }
        const startwidth = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
        flip($(this).width(), startwidth);
    })
}

// Handles the flip movement for the payment dialog
function flip(dialogwidth, startwidth) {
    $(document).on("mousemove touchmove", "#payment", function(e) {
        glob_html.addClass("flipmode");
        const currentwidth = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX,
            dragdistance = currentwidth - startwidth;
        if (Math.abs(dragdistance) > 3) { // margin to activate flip (prevent sloppy click)
            glob_html.addClass("swipemode");
            $(this).addClass("flipping");
            const startangle = glob_paymentdialogbox.hasClass("flipped") ? 180 : 0;
            glob_paymentdialogbox.css("transform", "rotateY(" + startangle + "deg)");
            const preangle = 180 * dragdistance / dialogwidth;
            glob_angle = glob_paymentdialogbox.hasClass("flipped") ? 180 + preangle : preangle;
            glob_paymentdialogbox.css("transform", "rotateY(" + glob_angle + "deg)");
        }
    })
}

// Handles the end of a flip action
function flipend() {
    $(document).on("mouseup mouseleave touchend", "#payment", function() {
        const thisunit = $(this);
        $(document).off("mousemove touchmove", glob_paymentpopup);
        if (thisunit.hasClass("flipping")) {
            if (glob_paymentdialogbox.hasClass("flipped")) {
                if (glob_angle > 250) {
                    flip_right2();
                } else if (glob_angle < 110) {
                    flip_left2();
                } else {
                    flip_reset1();
                }
            } else {
                if (glob_angle > 70) {
                    flip_right1();
                } else if (glob_angle < -70) {
                    flip_left1();
                } else {
                    flip_reset2();
                }
            }
            thisunit.removeClass("flipping");
            glob_html.removeClass("swipemode");
        }
        setTimeout(function() {
            glob_html.removeClass("flipmode");
        }, 270);
    })
}

// Flips the payment dialog to the right (front to back)
function flip_right1() {
    add_flip();
    face_back();
}

// Flips the payment dialog to the right (back to front)
function flip_right2() {
    glob_paymentdialogbox.css("transform", "rotateY(360deg)").removeClass("flipped");
    face_front();
}

// Flips the payment dialog to the left (front to back)
function flip_left1() {
    glob_paymentdialogbox.css("transform", "rotateY(-180deg)").addClass("flipped");
    face_back();
}

// Flips the payment dialog to the left (back to front)
function flip_left2() {
    remove_flip();
    face_front();
}

// Resets the flip when it's currently flipped
function flip_reset1() {
    glob_paymentdialogbox.css("transform", "");
}

// Resets the flip when it's not currently flipped
function flip_reset2() {
    glob_paymentdialogbox.css("transform", "rotateY(0deg)");
}

// Adds the flipped class and rotates the payment dialog
function add_flip() {
    glob_paymentdialogbox.css("transform", "rotateY(180deg)").addClass("flipped");
}

// Removes the flipped class and resets the rotation of the payment dialog
function remove_flip() {
    glob_paymentdialogbox.css("transform", "rotateY(0deg)").removeClass("flipped");
}

// Handles the front-facing view of the payment dialog
function face_front() {
    if (request) {
        if (request.isrequest === false) {
            const sharebutton = $("#sharebutton"),
                requesttitle = $("#requesttitle"),
                requestname = $("#requestname"),
                amountinput = $("#amountbreak input");
            if (sharebutton.hasClass("sbactive")) {
                if (amountinput.val().length > 0 && glob_supportsTouch) {
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
                requesttitle.attr("placeholder", translate("forexample") + ":" + requesttitle.attr("data-ph" + getrandomnumber(1, 13)));
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

// Handles the back-facing view of the payment dialog
function face_back() {
    if (request) {
        if (request.isrequest === false) {
            const requesttitle = $("#requesttitle"),
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
            const amountinput = $("#amountbreak input");
            if (amountinput.val().length > 0 && glob_supportsTouch) {
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

function poll_animate() {
    glob_paymentdialogbox.removeClass("poll");
    setTimeout(function() {
        glob_paymentdialogbox.addClass("poll");
    }, 100);
}

// ** Paymentdialog **

//loadpayment (check for crypto rates)

// Initializes the payment function and handles various scenarios
function loadpaymentfunction(pass) {
    if (is_openrequest() === true) { // prevent double load
        return
    }
    if (!$.isEmptyObject(glob_sockets)) {
        playsound(glob_funk);
        notify(translate("closingsockets"));
        return
    }
    loader();
    glob_symbolcache = br_get_local("symbols", true);
    if (glob_symbolcache) {
        const gets = geturlparameters();
        if (gets.xss) { //xss detection
            const content = "<h2 class='icon-warning'>" + glob_xss_alert + "</h2>";
            popdialog(content, "canceldialog");
            closeloader();
            return
        }
        const contactform = exists(gets.contactform);
        if (contactform && pass !== true) { // show contactform
            edit_contactform(true);
            return
        }
        const payment = gets.payment,
            coindata = getcoindata(payment);
        if (coindata) {
            const iserc20 = coindata.erc20 === true,
                request_start_time = now(),
                exact = exists(gets.exact);
            request = {
                    "received": false,
                    "rq_init": request_start_time,
                    "rq_timer": request_start_time,
                    "payment": payment,
                    "coindata": coindata,
                    "erc20": iserc20,
                    "layer": "main"
                }, // global request object
                helper = {
                    "exact": exact,
                    "contactform": contactform,
                    "lnd": false,
                    "lnd_status": false
                }, // global helper object
                glob_api_attempt["crypto_price_apis"] = {},
                glob_api_attempt["fiat_price_apis"] = {},
                glob_proxy_attempts = {},
                glob_socket_attempt = {};
            if (iserc20 === true) {
                const token_contract = coindata.contract;
                if (token_contract) {
                    request.token_contract = token_contract;
                    get_tokeninfo(payment, token_contract);
                    return
                }
                const content = "<h2 class='icon-blocked'>" + translate("nofetchtokeninfo") + "</h2>";
                popdialog(content, "canceldialog");
                closeloader();
                return
            }
            continue_paymentfunction();
            return
        }
        const content = "<h2 class='icon-blocked'>" + translate("currencynotsupported", {
            "currency": payment
        }) + "</h2>";
        popdialog(content, "canceldialog");
        closeloader();
        return
    } // need to set fixer API key first
    api_eror_msg("fixer", {
        "errormessage": "Missing API key",
        "errorcode": "300"
    }, true);
}

// Retrieves token information for ERC20 tokens
function get_tokeninfo(payment, contract) {
    const getcache = br_get_local("decimals_" + payment);
    if (getcache) { // check for cached values
        request.decimals = getcache;
        continue_paymentfunction();
        return
    }
    loadertext(translate("gettokeninfo"));
    api_proxy({
        "api": "ethplorer",
        "search": "getTokenInfo/" + contract,
        "cachetime": 86400,
        "cachefolder": "1d",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const data = br_result(e).result,
            error = data.error;
        if (error) {
            cancelpaymentdialog();
            fail_dialogs("ethplorer", error);
            return
        }
        const decimals = data.decimals;
        request.decimals = decimals;
        continue_paymentfunction();
        br_set_local("decimals_" + payment, decimals); //cache token decimals
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const next_proxy = get_next_proxy();
        if (next_proxy) {
            get_tokeninfo(payment, contract);
            return
        }
        cancelpaymentdialog();
        const error_object = errorThrown || jqXHR;
        fail_dialogs("ethplorer", error_object);
        closeloader();
    });
}

// Continues the payment function setup after initial checks
function continue_paymentfunction() {
    //set globals
    const gets = geturlparameters();
    if (gets.xss) { //xss detection
        const content = "<h2 class='icon-warning'>" + glob_xss_alert + "</h2>";
        popdialog(content, "canceldialog");
        closeloader();
        return
    }
    const payment = request.payment,
        erc20 = request.erc20,
        address = gets.address,
        currencycheck = erc20 ? "ethereum" : payment,
        data = gets.d,
        isdata = data && data.length > 5,
        dataobject = isdata ? JSON.parse(atob(data)) : null, // decode data param if exists;
        ln = dataobject && dataobject.imp, // check for lightning;
        lnd_only = address === "lnurl",
        valid = lnd_only ? true : check_address(address, currencycheck); // validate address 
    if (valid === false) {
        const error_message = !address ? translate("undefinedaddress") : translate("invalidaddress", {
                "payment": payment
            }),
            content = "<h2 class='icon-blocked'>" + error_message + "</h2>";
        popdialog(content, "canceldialog");
        closeloader();
        return
    }
    const api_info = check_api(payment, erc20),
        isrequest = br_get_local("editurl") !== glob_w_loc.search, // check if url is a request
        coindata = request.coindata,
        coinsettings = activecoinsettings(payment),
        uoa = gets.uoa,
        amount = Number(gets.amount),
        type = gets.type,
        lightning_id = (dataobject && dataobject.lid) ? dataobject.lid : false;
    let viewkey = false,
        sharevk = false,
        payment_id = (dataobject && dataobject.pid) ? dataobject.pid : false,
        xmr_ia = address;
    if (payment === "monero") { // check for monero viewkey
        coindata.monitored = false;
        viewkey = (dataobject && dataobject.vk) ? {
                "account": address,
                "vk": dataobject.vk
            } : get_vk(address),
            sharevk = share_vk(),
            payment_id = payment_id || isrequest ? false : get_xmrpid(),
            xmr_ia = xmr_integrated(address, payment_id);
    }
    const currencysymbol = coindata.ccsymbol,
        requesttype = isrequest ? (type) ? type :
        glob_inframe ? "checkout" : "incoming" : "local",
        typecode = requesttype === "local" ? 1 :
        requesttype === "outgoing" || requesttype === "incoming" ? 2 :
        requesttype === "checkout" ? 3 : 4,
        iscrypto = uoa === currencysymbol,
        localcurrency = $("#currencysettings").data("currencysymbol"), // can be changed in (settings)
        fiatcurrency = iscrypto ? localcurrency : uoa,
        statusparam = gets.status,
        status = statusparam || "new",
        paid = status ? status === "paid" : null,
        cmcid = coindata.cmcid,
        cpid = currencysymbol + "-" + payment,
        ispending = ch_pending({
            "address": xmr_ia,
            "cmcid": cmcid
        }),
        monitored = viewkey ? true : coindata.monitored,
        pendingparam = gets.pending,
        pending = pendingparam || monitored ? "incoming" : "unknown",
        socket_list = coinsettings.websockets || null,
        selected_socket = socket_list ? socket_list.selected || null : null,
        requesttimestamp = dataobject && dataobject.ts ? dataobject.ts : null,
        requestname = dataobject && dataobject.n ? dataobject.n : null,
        requesttitle = dataobject && dataobject.t ? dataobject.t : null,
        current_conf = coinsettings ? coinsettings.confirmations || 0 : 0,
        no_conf = !current_conf || !monitored,
        set_confirmations = dataobject && dataobject.c ? parseFloat(dataobject.c) : no_conf ? 0 : current_conf.selected,
        instant = !set_confirmations,
        pagenameccparam = iscrypto ? "" : payment + " ",
        pagename = requestname ? translate("sharetitlename", {
            requestname,
            pagenameccparam,
            amount,
            uoa,
            requesttitle
        }) : translate("sharetitle", {
            pagenameccparam,
            amount,
            uoa
        }),
        requestclass = isrequest ? "request" : "norequest", //set classnames for request
        iszero = amount === 0 || isNaN(amount),
        iszero_request = isrequest && iszero,
        iszeroclass = iszero_request ? " iszero" : "",
        showclass = iscrypto ? (uoa === "btc" ? " showsat showlc showcc" : " showlc showcc") : (uoa === fiatcurrency ? "" : " showlc"),
        statusattr = status || "unknown",
        statusclass = status ? " " + status : " unknown",
        satclass = payment === "bitcoin" && cs_node("bitcoin", "showsatoshis", true).selected,
        typeclass = " " + requesttype,
        offlineclass = glob_offline ? " br_offline" : "",
        pendingclass = ispending && monitored && requesttype === "local" ? "ispending" : "",
        has_xmr_ia = xmr_ia === address ? false : xmr_ia,
        showqr = "showqr" in gets,
        extend_data = {
            uoa,
            amount,
            address,
            currencysymbol,
            cmcid,
            cpid,
            status,
            pending,
            paid,
            isrequest,
            requesttype,
            typecode,
            iscrypto,
            localcurrency,
            fiatcurrency,
            requestname,
            requesttitle,
            set_confirmations,
            no_conf,
            instant,
            shared: isrequest && requesttimestamp !== null, // check if request is from a shared source,
            iszero,
            iszero_request,
            viewkey,
            share_vk: sharevk,
            payment_id,
            lightning_id,
            xmr_ia: has_xmr_ia,
            monitored,
            coinsettings,
            dataobject,
            showqr
        },
        extend_helper_data = {
            socket_list,
            selected_socket,
            requestclass,
            iszeroclass,
            currencylistitem: $("#currencylist > li[data-currency='" + payment + "'] .rq_icon"),
            api_info,
            lnd_only
        },
        payment_attributes = {
            "data-cmcid": cmcid,
            "data-currencysymbol": currencysymbol,
            "data-status": statusattr,
            "data-showsat": satclass,
            "data-pending": pendingclass,
            "class": requestclass + statusclass + showclass + typeclass + offlineclass + iszeroclass
        },
        lnd_switch = payment === "bitcoin" ? (isrequest && !ln ? "" : "<div id='lightning_switch' title='lightning' class='lnswitch'><span class='icon-power'></span></div>") : "",
        ndef_switch = payment === "bitcoin" && glob_ndef ? "<div id='ndef_switch' title='Tap to pay' class='lnswitch'><span class='icon-connection'></span></div>" : "";
    settitle(pagename);
    glob_paymentdialogbox.append("<div id='request_back' class='share_request dialogstyle'></div><div id='request_front' class='dialogstyle'><div id='xratestats'><span id='rq_errlog'></span></div>" + ndef_switch + lnd_switch + "<div class='networks'></div></div>").attr(payment_attributes);
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

// Sets up the Lightning Network payment functionality
function lightning_setup() {
    if (request.isrequest === true) {
        const dataobject = request.dataobject;
        if (dataobject) {
            const imp = dataobject.imp;
            if (imp) { //lightning request
                loadertext(translate("checklightningstatus", {
                    "imp": imp
                }));
                const phd = dataobject.proxy,
                    host = dataobject.host,
                    key = dataobject.key,
                    dprox = phd ? phd : (host && key) ? d_proxy() : null;
                if (dprox) {
                    const parr = lnurl_deform(dprox),
                        pxk = parr ? parr.k : false,
                        lightning_id = dataobject.lid,
                        lnd_pid = lightning_id ? lightning_id : (dataobject.pid) ? sha_sub(dataobject.pid, 10) : null;
                    if (lnd_pid) {
                        const proxy_host = lnurl_encode_save(dprox),
                            ph = proxy_host ? lnurl_deform(proxy_host).url : null,
                            nid_src = host ? (imp === "lnbits" ? key : host) : null,
                            node_id = nid_src ? sha_sub(nid_src, 10) : false,
                            nid = dataobject.nid ? dataobject.nid : (node_id ? node_id : null)
                        pw = dataobject.pw ? sha_sub(dataobject.pw, 10) : (pxk ? pxk : null),
                            use_lnurl = !(host && key),
                            lnurls = !nid,
                            shared = !!lightning_id,
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
                        glob_lnd_ph = ph;
                        const creds = !!(host && key && nid),
                            put = {
                                "status": lnd_pid,
                                "cred": creds ? btoa(JSON.stringify({
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
    const lnli = lndli(),
        ln_dat = lnli.data(),
        ss = ln_dat.selected_service;
    if (ss) {
        const imp = ss.imp;
        loadertext(translate("checklightningstatus", {
            "imp": imp
        }));
        const node_id = ss.node_id,
            proxies = ln_dat.proxies,
            proxy_id = ss.proxy_id,
            fetchproxy = fetch_proxy(proxies, proxy_id),
            proxy_url = fetchproxy ? fetchproxy.proxy : lnurl_encode_save(lnd_pick_proxy()),
            p_arr = lnurl_deform(proxy_url),
            ph = p_arr.url,
            pw = p_arr.k,
            local_proxy = is_local_node(proxy_url),
            proxy = ss.proxy,
            host = ss.host,
            local_lnd = is_local_node(host),
            key = ss.key,
            lnurls = !!ss.lnurl,
            lnurls_bool = lnurls && !host,
            proxy_bool = (proxy == true) ? true : false,
            saved_id = br_get_session("lndpid"),
            pid = saved_id ? saved_id : sha_sub(now(), 10),
            use_lnurl = lnurls_bool || proxy_bool,
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
        glob_lnd_ph = ph;
        const creds = !!(host && key && node_id && !lnurls),
            put = {
                "status": pid,
                "cred": creds ? btoa(JSON.stringify({
                    "file": node_id,
                    "host": host,
                    "key": key
                })) : false
            }
        lnd_put(ph, pw, put, use_lnurl);
        return
    }
    proceed_pf();
}

// Sends a PUT request to the Lightning Network proxy
function lnd_put(proxy, key, pl, lnurl) {
    const rqtype = request.requesttype === "local" ? undefined : request.requesttype;
    glob_proxy_attempts[proxy] = true;
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
        const stat = e.stat;
        if (stat === true) {
            test_lnd(lnurl);
            return
        }
        if (stat === "no write acces") {
            notify(translate("nowriteaccess"));
        }
        const data = br_result(e).result,
            error = data.error,
            default_error = translate("unabletoconnect");
        if (error) {
            const message = error ? (error.message ? error.message : (typeof error === "string" ? error : default_error)) : default_error;
            if (request.isrequest) {
                if (helper.lnd_only) {
                    topnotify(message);
                    notify(translate("notmonitored"));
                }
            } else {
                notify(message);
                $("#rq_errlog").append("<span class='rq_err'>" + message + "</span>");
            }
        }
        proceed_pf();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const is_proxy = q_obj(helper, "lnd.lnurl");
        if (is_proxy === false) {
            const saved_proxy = s_lnd_proxy();
            if (saved_proxy === false) {
                const next_proxy = get_next_proxy();
                if (next_proxy) {
                    lightning_setup();
                    return
                }
            }
        }
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
        proceed_pf();
    });
}

// Tests the Lightning Network connection status
function test_lnd(lnurl) {
    const lnd = helper.lnd;
    if (!lnd.proxy_host) {
        proceed_pf();
        return
    }
    const status_cache = sessionStorage.getItem("lnd_timer_" + lnd.nid);
    if (status_cache && (now() - status_cache) < 20000) { // get cached status
        // lightning status is cached for 10 minutes
        helper.lnd_status = true;
        proceed_pf();
        return;
    }
    sessionStorage.removeItem("lnd_timer_" + lnd.nid);
    // functions in assets_js_bitrequest_lightning.js
    const host = lnd.host,
        is_onion = host && host.indexOf(".onion") > 0;
    if (lnurl || is_onion) {
        test_lnurl_status(lnd);
        return
    }
    if (lnd.imp === "lnd") {
        check_lnd_status(lnd);
        return
    }
    if (lnd.imp === "c-lightning") {
        check_c_lightning_status(lnd);
        return
    }
    if (lnd.imp === "eclair") {
        check_eclair_status(lnd);
        return
    }
    if (lnd.imp === "lnbits") {
        check_lnbits_status(lnd);
        return
    }
}

// Proceeds with the payment function after initial setup
function proceed_pf(error) {
    if (helper.lnd_status === false && helper.lnd_only) {
        request.monitored = false;
        const error_message = helper.lnd_only ? (error ? error.errorcode + ": " + error.errormessage : translate("unabletoconnectln")) : $("#rq_errlog > .rq_err").text(),
            content = "<h2 class='icon-blocked'>" + error_message + "</h2>";
        cancelpaymentdialog();
        popdialog(content, "canceldialog");
        closeloader();
        return
    }
    const lndstatus = helper.lnd ? (helper.lnd.selected ? (helper.lnd_status ? "lnd_ao" : "lnd_active") : "lnd_inactive") : "no_lnd";
    glob_paymentdialogbox.attr({
        "data-lswitch": lndstatus,
        "data-lnd": lndstatus
    });
    if (request.isrequest === true && !request.showqr) {
        add_flip();
    }
    if (glob_offline === true) { // no price conversion when app is offline
        rendercurrencypool({
            "EUR": 1,
            "USD": 1.11
        }, 0, 000018, "coinmarketcap", "fixer", 0, 0);
        return
    }
    const ccapi = $("#cmcapisettings").data("selected"),
        apilist = "crypto_price_apis",
        getcache = br_get_session("xrates_" + request.currencysymbol, true);
    if (getcache) { //check for cached crypto rates in localstorage
        const timestamp = now(),
            cachedtimestamp = getcache.timestamp,
            thisusdrate = getcache.ccrate,
            apisrc = getcache.apisrc,
            cachetime = timestamp - cachedtimestamp;
        if (cachetime > glob_cacheperiodcrypto) { //check if cached crypto rates are expired
            getccexchangerates(apilist, ccapi);
            return
        } //fetch cache
        loadertext(translate("readingfromcache", {
            "ccsymbol": request.currencysymbol
        }));
        initexchangerate(thisusdrate, apisrc, cachetime); //check for fiat rates and pass usd amount
        return
    }
    getccexchangerates(apilist, ccapi);
}

// Fetches cryptocurrency exchange rates from various APIs
function getccexchangerates(apilist, api) {
    glob_api_attempt[apilist][api] = true;
    loadertext(translate("getccrates", {
        "ccsymbol": request.currencysymbol,
        "api": api
    }));
    const payment = request.payment,
        contract = request.token_contract,
        iserc = request.erc20 === true,
        search = api === "coinmarketcap" ? "v1/cryptocurrency/quotes/latest?id=" + request.cmcid :
        api === "coinpaprika" ? request.currencysymbol + "-" + payment :
        api === "coingecko" ? (iserc ? "simple/token_price/ethereum?contract_addresses=" + contract + "&vs_currencies=usd" : "simple/price?ids=" + payment + "&vs_currencies=usd") :
        false;
    if (search === false) {
        loadertext(translate("apierror"));
        closeloader();
        cancelpaymentdialog();
        fail_dialogs(api, "Crypto price API not defined");
        return
    }
    const payload = {
        "api": api,
        "search": search,
        "cachetime": 90,
        "cachefolder": "1h",
        "params": {
            "method": "GET",
            "cache": true
        },
    };
    if (api === "coinmarketcap") {
        payload.proxy = true;
    }
    api_proxy(payload).done(function(e) {
        const data = br_result(e).result,
            error_val = "unable to get " + payment + " rate";
        if (data) {
            if (!$.isEmptyObject(data)) {
                const status = data.status,
                    has_error = data.statusCode === 404 || data.error || (status && status.error_message);
                if (has_error) {
                    const error_val = data.error || "Unable to get " + payment + " Exchangerate";
                    cc_fail(apilist, api, error_val);
                    return
                }
                const pnode = iserc ? contract : payment,
                    ccrate = api === "coinmarketcap" ? q_obj(data, "data." + request.cmcid + ".quote.USD.price") :
                    api === "coinpaprika" ? q_obj(data, "quotes.USD.price") :
                    api === "coingecko" ? q_obj(data, pnode + ".usd") :
                    null;
                if (ccrate) {
                    loadertext(translate("success"));
                    const timestamp = now(),
                        ccratearray = {
                            "timestamp": timestamp,
                            "ccrate": ccrate,
                            "apisrc": api
                        };
                    br_set_session("xrates_" + request.currencysymbol, ccratearray, true); //cache crypto rates in sessionstorage
                    initexchangerate(ccrate, api, 0); //pass usd amount, check for fiat rates
                    return
                }
                cc_fail(apilist, api, error_val);
                return
            }
        }
        cc_fail(apilist, api, error_val);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const error_object = errorThrown || jqXHR;
        cc_fail(apilist, api, error_object);
    });
}

// Handles failure scenarios when fetching cryptocurrency rates
function cc_fail(apilist, api, error_val) {
    const nextccapi = try_next_api(apilist, api);
    if (nextccapi) {
        getccexchangerates(apilist, nextccapi);
        return
    }
    const next_proxy = get_next_proxy();
    if (next_proxy) {
        glob_api_attempt[apilist] = {};
        getccexchangerates(apilist, api);
        return
    }
    loadertext(translate("apierror"));
    closeloader();
    cancelpaymentdialog();
    fail_dialogs(api, error_val);
}

// Initializes the exchange rate process
function initexchangerate(cc_rate, ccapi, cachetime) {
    loadertext(translate("getfiatrates"));
    const ccrate = 1 / cc_rate,
        timestamp = now(),
        newcurrency = request.fiatcurrency !== request.localcurrency && request.fiatcurrency !== "eur" && request.fiatcurrency !== "usd" && request.fiatcurrency !== request.currencysymbol, //check if currency request is other then usd, eur or localcurrency
        localcurrencyparam = request.localcurrency === "usd" || request.localcurrency === "btc" ? "usd,eur" : request.localcurrency === "eur" ? "eur,usd" : request.localcurrency + ",usd,eur", // set correct local currency / prevent btc
        newcurrencyparam = newcurrency ? "," + request.fiatcurrency : "",
        currencystring = localcurrencyparam + newcurrencyparam,
        currenciesstring = request.currencysymbol + "," + currencystring,
        currencycache = br_get_session("exchangerates", true),
        fiatapi = $("#fiatapisettings").data("selected"),
        apilist = "fiat_price_apis";
    helper.currencyarray = currenciesstring.split(",");
    if (currencycache) { //check if cache exists
        const xratesnode = currencycache.fiat_exchangerates,
            thisrate = xratesnode[request.fiatcurrency];
        if (thisrate) { //check if currency is in cache
            const xratetimestamp = currencycache.timestamp,
                timeexpired = timestamp - xratetimestamp,
                lcrate = xratesnode[request.fiatcurrency];
            if (timeexpired > glob_cacheperiodfiat || lcrate === undefined) { //check if cache is expired and if fiatcurrency is cached
                get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime);
                return
            } //fetch cached exchange rates
            loadertext(translate("readingfiatratesfromcache"));
            rendercurrencypool(xratesnode, ccrate, ccapi, currencycache.api, cachetime, timeexpired);
            return
        }
    }
    get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime);
}

// Fetches fiat exchange rates from various APIs
function get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime) {
    glob_api_attempt[apilist][fiatapi] = true;
    loadertext(translate("fetchingfiatrates", {
        "fiatapi": fiatapi
    }));
    // set apipath
    const search = fiatapi === "fixer" ? "latest" :
        fiatapi === "coingecko" ? "exchange_rates" :
        fiatapi === "exchangeratesapi" ? "latest" :
        fiatapi === "currencylayer" ? "live" :
        fiatapi === "coinbase" ? "exchange-rates" :
        false;
    if (search === false) {
        loadertext(translate("error"));
        closeloader();
        cancelpaymentdialog();
        fail_dialogs(fiatapi, "Fiat price API not defined");
        return
    }
    api_proxy({
        "api": fiatapi,
        "search": search,
        "cachetime": 540,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const data = br_result(e).result,
            ratesnode = fiatapi === "fixer" ? data.rates :
            fiatapi === "coingecko" ? data.rates :
            fiatapi === "exchangeratesapi" ? data.rates :
            fiatapi === "currencylayer" ? data.quotes :
            fiatapi === "coinbase" ? data.data.rates :
            null;
        if (ratesnode) {
            loadertext(translate("success"));
            const fiatsymbol = request.fiatcurrency,
                localupper = fiatsymbol.toUpperCase(),
                rates = {
                    "eur": 1
                };
            let usdval,
                localval;
            if (fiatapi === "fixer") {
                usdval = ratesnode.USD,
                    localval = ratesnode[localupper];
            } else if (fiatapi === "coingecko") {
                if (ratesnode[fiatsymbol]) {
                    const eurval = ratesnode.eur.value;
                    usdval = ratesnode.usd.value / eurval,
                        localval = ratesnode[fiatsymbol].value / eurval;
                }
            } else if (fiatapi === "exchangeratesapi") {
                if (ratesnode[localupper]) {
                    usdval = ratesnode.USD,
                        localval = localupper === "EUR" ? 1 : ratesnode[localupper];
                }
            } else if (fiatapi === "currencylayer") {
                const localkey = ratesnode["USD" + localupper];
                if (localkey) {
                    usdval = 1 / ratesnode.USDEUR,
                        localval = localkey * usdval;
                }
            } else if (fiatapi === "coinbase") {
                const localkey = ratesnode[localupper];
                if (localkey) {
                    usdval = 1 / ratesnode.EUR,
                        localval = localkey * usdval;
                }
            } else {
                loadertext(translate("error"));
                closeloader();
                cancelpaymentdialog();
                fail_dialogs(fiatapi, "Fiat price API not defined");
                return
            }
            if (localval && usdval) {
                rates.usd = usdval;
                if (fiatsymbol !== "eur" && fiatsymbol !== "usd" && fiatsymbol !== "btc") {
                    rates[fiatsymbol] = localval;
                }
                rendercurrencypool(rates, ccrate, ccapi, fiatapi, cachetime, "0"); // render exchangerates
                // cache exchange rates
                const xratestring = {
                    "timestamp": now(),
                    "fiat_exchangerates": rates,
                    "api": fiatapi
                };
                br_set_session("exchangerates", xratestring, true);
                return
            }
        }
        const nextfiatapi = try_next_api(apilist, fiatapi);
        if (nextfiatapi === false) {
            loadertext(translate("error"));
            closeloader();
            cancelpaymentdialog();
            const errorcode = data.error || "Failed to load data from " + fiatapi;
            fail_dialogs(fiatapi, errorcode);
            return
        }
        get_fiat_exchangerate(apilist, nextfiatapi, ccrate, currencystring, ccapi, cachetime);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const error_object = errorThrown || jqXHR;
        next_fiat_api(apilist, fiatapi, error_object, ccrate, currencystring, ccapi, cachetime);
        return
    });
}

// Handles switching to the next fiat API when the current one fails
function next_fiat_api(apilist, fiatapi, error_object, ccrate, currencystring, ccapi, cachetime) {
    const nextfiatapi = try_next_api(apilist, fiatapi);
    if (nextfiatapi) {
        get_fiat_exchangerate(apilist, nextfiatapi, ccrate, currencystring, ccapi, cachetime);
        return
    }
    const next_proxy = get_next_proxy();
    if (next_proxy) {
        glob_api_attempt[apilist] = {};
        get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime);
        return
    }
    loadertext(translate("error"));
    closeloader();
    cancelpaymentdialog();
    fail_dialogs(fiatapi, error_object);
}

// Renders the currency pool with exchange rates and payment details
function rendercurrencypool(data, ccrate, ccapi, fiatapi, cachetimecrypto, cachetimefiat) {
    const xrates_array = [],
        usdrate = data.usd, //cryptocurrency rate is in dollar, needs to be converted to euro
        ccrateeuro = ccrate * usdrate,
        currentrate = request.iscrypto === true ? ccrateeuro : data[request.fiatcurrency],
        fiatapiurl = fiatapi === "fixer" ? "fixer.io" :
        fiatapi === "coingecko" ? "coingecko.com" :
        fiatapi === "exchangeratesapi" ? "exchangeratesapi.io" :
        fiatapi === "currencylayer" ? "currencylayer.com" :
        fiatapi === "coinbase" ? "coinbase.com" :
        null,
        xratedata1 = "<div data-currency='" + request.currencysymbol + "' data-value='' data-xrate='" + ccrateeuro + "' class='cpool ccpool' data-currencyname='" + request.payment + "'><span>" + ccapi + ": <span class='ratesspan'>" + request.currencysymbol + "_" + request.uoa + ": " + (1 / (ccrateeuro / currentrate)).toFixed(2) + "</span></span></div><div class='cachetime'> (" + (cachetimecrypto / 60000).toFixed(1) + " of " + (glob_cacheperiodcrypto / 60000).toFixed(0) + " min. in cache)</div><br/><div class='mainrate'>" + fiatapiurl + ": </div>",
        xratedata2 = [];
    xrates_array.push({
        "currency": request.currencysymbol,
        "xrate": ccrateeuro,
        "currencyname": request.payment
    });
    $.each(data, function(thiscurrency, rate) {
        const parsedrate = (rate / currentrate) / 1,
            ratesspanclass = parsedrate === 1 ? " hide" : "",
            currencyname = glob_symbolcache[thiscurrency.toUpperCase()],
            xratedatarray = "<div data-currency='" + thiscurrency + "' data-value='' data-xrate='" + rate + "' class='cpool' data-currencyname='" + currencyname + "'><span class='ratesspan" + ratesspanclass + "'>" + request.uoa + "_" + thiscurrency + ": " + parsedrate.toFixed(2) + "</span></div>";
        xratedata2.push(xratedatarray);
        xrates_array.push({
            "currency": thiscurrency,
            "xrate": rate,
            "currencyname": currencyname
        });
    });
    helper.xrates = xrates_array;
    const ln_info = helper.lnd,
        proxy_icon = ln_info && ln_info.proxy ? "<span class='icon-sphere' title='" + ln_info.proxy_host + "'></span>" : "",
        lndstatus_icon = helper.lnd_status ? " <span class='icon-connection'></span>" : " <span class='icon-wifi-off'></span>",
        lnd_nodeinfo = request.isrequest === true ? "" : ": <span id='lnd_nodeinfo_trigger'>" + ln_info.name + "</span>",
        lnd_node_info = ln_info ? "<br/><span id='current_lndnode'><img src='" + c_icons(ln_info.imp) + "' class='lnd_icon' title='" + ln_info.imp + "'/> Lightning node" + lnd_nodeinfo + lndstatus_icon + proxy_icon + "</span>" : "";
    $("#xratestats").prepend(xratedata1 + xratedata2.join(" | ") + "<div class='cachetime'> (" + (cachetimefiat / 60000).toFixed(1) + " of " + (glob_cacheperiodfiat / 60000).toFixed(0) + " min. in cache)</div><br/><span id='current_socket'></span>" + lnd_node_info);
    getpayment(ccrateeuro, ccapi);
}

// Processes and displays payment information, including currency conversions, UI elements, and request details
function getpayment(ccrateeuro, ccapi) {
    closeloader();
    const currencypoolnode = $("#paymentdialog .cpool[data-currency='" + request.uoa + "']"),
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
    const currencyxrate = currencypoolnode.attr("data-xrate"),
        fiatcurrencyrate = fiatcurrencypoolnode.attr("data-xrate"),
        rn_set = request.requestname && request.requestname.length > 1, // check if requestname is set
        rt_set = request.requesttitle && request.requesttitle.length > 1, // check if requesttitle is set
        requesttitle_string = rt_set ? request.requesttitle : "",
        savedaddressli = filter_addressli(request.payment, "address", request.address),
        has_label = savedaddressli.length > 0 && savedaddressli.data("label").length > 0,
        labelvalue = has_label ? savedaddressli.data("label") : "",
        label_markup = has_label ? "<span id='labelbttn'>" + labelvalue + "</span>" : "", // check if label is set
        thiscurrencyvalueraw = (request.amount / currencyxrate) * ccrateeuro,
        thiscurrencyvaluefixed = parseFloat(thiscurrencyvalueraw.toFixed(6)),
        thiscurrencyvaluefixedplaceholder = request.iszero ? glob_zeroplaceholder : thiscurrencyvaluefixed,
        thiscurrencyvaluefixedvar = request.iszero ? "" : thiscurrencyvaluefixed,
        satamount = (thiscurrencyvalueraw * 100000000).toFixed(0),
        fiatcurrencyvalue = ((request.amount / currencyxrate) * fiatcurrencyrate).toFixed(2),
        fiatcurrencyvaluelet = request.iszero ? "" : fiatcurrencyvalue,
        cryptosteps = "0.00001",
        fiatsteps = "0.1",
        steps = request.iscrypto ? cryptosteps : fiatsteps,
        placeholder = request.iszero ? glob_zeroplaceholder : request.amount,
        valueplaceholder = request.iszero ? "" : request.amount,
        satplaceholder = request.iszero ? "000000000" : satamount,
        satamountlet = request.iszero ? "" : satamount,
        currencynamestring = currencyname === "Euro" ? "" : request.iscrypto ? fiatcurrencyname : currencyname,
        ccamounttext = "(" + thiscurrencyvaluefixedvar + " " + request.payment + ")",
        sharebuttonclass = rn_set && rt_set ? " sbactive" : "",
        cryptologo = getcc_icon(request.cmcid, request.cpid, request.erc20),
        lndlogo = request.payment === "bitcoin" ? "<img src='img_logos_btc-lnd.png' class='cmc_icon icon_lnd'>" : "",
        sharebutton = "<div class='button" + sharebuttonclass + "' id='sharebutton'><span class='icon-share2'>" + translate("sharerequestbutton") + "</span></div>",
        initrequestname = rn_set ? request.requestname : $("#accountsettings").data("selected"),
        sharetitle_exceed = request.requesttitle && request.requesttitle.length > 65,
        exceedclass = sharetitle_exceed ? "title_exceed" : "",
        requesttitle_short = sharetitle_exceed ? request.requesttitle.substring(0, 44) + " ... " : request.requesttitle,
        requesttitle_quotes = (request.requesttitle && request.requesttitle.length > 1) ? "'" + requesttitle_short + "'" : "",
        backbttnandtitle = request.isrequest ? "<div id='sharetitle' title='" + requesttitle_string + "' data-shorttitle='" + requesttitle_short + "' class='" + exceedclass + "'>" + requesttitle_quotes + "</div>" : "",
        address_xmr_ia = request.xmr_ia || request.address,
        ro_attr = (request.isrequest && !request.iszero) ? " readonly='readonly'" : "",
        requestinfo = "\
            <div id='requestinfo'>" +
        backbttnandtitle +
        "<div id='shareamount' class='inputbreak'>\
                    <span id='sharecryptowrap'>" + cryptologo + lndlogo +
        "<span id='sharemainccinputmirror' class='ccmirror mirrordiv'>\
                            <span>" + thiscurrencyvaluefixedplaceholder + "</span>\
                            <input value='" + thiscurrencyvaluefixedvar + "' step='" + cryptosteps + "' type='number' placeholder='" + glob_zeroplaceholder + "'" + ro_attr + "/>\
                        </span>\
                    </span>\
                    <span id='shareinputmirror' class='fmirror mirrordiv'>\
                        <span>" + placeholder + "</span>\
                        <input value='" + valueplaceholder + "' step='" + steps + "' type='number' placeholder='" + glob_zeroplaceholder + "'" + ro_attr + "/>\
                    </span>\
                    <span id='sharecurrency'>" + request.uoa + "</span>\
                </div>\
                <div id='currencynamebox'>\
                    <span id='currencyname' data-currencyname='" + currencynamestring + "'>\
                        <span class='quote'>(</span>\
                        <span id='sharelcinputmirror' class='lcmirror mirrordiv'>\
                        <span>" + fiatcurrencyvalue + "</span>\
                        <input value='" + fiatcurrencyvaluelet + "' step='" + fiatsteps + "' type='number' placeholder='" + glob_zeroplaceholder + "'" + ro_attr + "/>\
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
                            <input value='" + thiscurrencyvaluefixedvar + "' step='" + cryptosteps + "' type='number' placeholder='" + glob_zeroplaceholder + "'" + ro_attr + "/>\
                        </span> " +
        request.payment + ")\
                    </span>\
                </div>\
            </div>",
        status_text = request.paid ? (request.requesttype === "incoming" ? translate("paymentsent") : translate("paymentreceived")) : translate("waitingforpayment"),
        conftl = translate("confirmations"),
        conf_section = request.instant ? "" : "<span id='statusbox'>" + translate("waitingfor") + " <span id='confnumber'></span> " + conftl + " </span><span class='confbox'><span data-conf='0'>0</span> " + conftl + "</span>",
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
                    <span id='view_tx'>" + translate("viewdetails") + "</span>\
                </p>\
            </div>",
        readonly_attr = is_viewonly() ? " readonly='readonly'" : "",
        fb_labelval = has_label ? " (" + labelvalue + ")" : "",
        fb_markup = (request.payment === "bitcoin" && !helper.lnd_only) ? "<div id='fallback_address'>Fallback address:<br/><span id='fb_addr'>" + request.address + fb_labelval + "</span> " + switchpanel(false, " global") + "</div>" : "",
        shareform = "\
            <div id='shareformbox'>\
                <div id='shareformib' class='inputbreak'>\
                    <form id='shareform' disabled='' autocomplete='off' autocorrect='off' autocapitalize='sentences' spellcheck='off'>\
                        <label>" + translate("whatsyourname") + "<input type='text' placeholder='Name' id='requestname' value='" + initrequestname + "' autocomplete='false'" + readonly_attr + "></label>\
                        <label>" + translate("whatsitfor") + "<input type='text' placeholder='" + translate("forexample") + ": " + translate("lunch") + " 🥪' id='requesttitle' value='" + requesttitle_string + "' data-ph1=' " + translate("festivaltickets") + "' data-ph2=' " + translate("coffee") + " ☕' data-ph3=' " + translate("present") + " 🎁' data-ph4=' " + translate("snowboarding") + " 🏂' data-ph5=' " + translate("movietheater") + " 📽️' data-ph6=' " + translate("lunch") + " 🥪' data-ph7=' " + translate("shopping") + " 🛒' data-ph8=' " + translate("videogame") + " 🎮' data-ph9=' " + translate("drinks") + " 🥤' data-ph10=' " + translate("concerttickets") + " 🎵' data-ph11=' " + translate("camping") + " ⛺' data-ph12=' " + translate("taxi") + " 🚕' data-ph13=' " + translate("zoo") + " 🦒'></label>\
                    </form>" + fb_markup +
        "</div>\
                <div id='sharebox' class='inputbreak'>" + sharebutton + "</div>\
            </div>",
        requestnamestring = (request.requesttype === "outgoing") ? "" : (rn_set ? translate("to") + " " + request.requestname + ":" : ""),
        openwtl = translate("openwallet"),
        lndowbttn = (request.payment === "bitcoin") ? "<div class='button openwallet_lnd' id='openwallet_lnd' data-currency='bitcoin'><span class='icon-folder-open'>" + openwtl + "</span></div>" : "",
        paymethods = "\
            <div id='paymethods'>\
                <p id='requestnamep'>" + requestnamestring + "</p>\
                <div id='scanqrib' class='inputbreak'>\
                    <div class='button' id='scanqr'>\
                        <span class='icon-qrcode'>" + translate("showqr") + "</span>\
                    </div><br/>\
                    <div class='button openwallet' id='openwallet' data-currency='" + request.payment + "'><span class='icon-folder-open'>" + openwtl + "</span></div>" + lndowbttn +
        "</div>\
            </div>",
        poweredby = "<div class='poweredby'>Powered by: <a href='https://www.bitrequest.io' target='_blank'>Bitrequest</a></div>",
        bottomcard = request.isrequest ? paymethods : shareform,
        ccqr = "<div id='qrcode' class='qrcode'><canvas width='256' height='256'></canvas></div>" + cryptologo,
        lndqr = (request.payment === "bitcoin") ? "<div id='qrcode_lnd' class='qrcode'><canvas width='256' height='256'></canvas></div><img src='img_logos_btc-lnd.png' class='cmc_icon' id='lnd_icon'><img src='" + c_icons("phone-icon") + "' class='cmc_icon' id='phone_icon'>" : "",
        lndow = (request.payment === "bitcoin") ? "<div class='openwallet_lnd abr icon-folder-open' data-currency='bitcoin' data-rel='0'>" + openwtl + "</div>" : "";
    $("#request_front").prepend("<div class='time_panel'><div class='time_bar'></div></div><div id='cl_wrap'>" + cryptologo + "</div>\
        <div class='actionbar clearfix'>\
            <div id='sharerequest' class='abl icon-share2 sbactive'>" + translate("sharerequest") + "</div><div id='open_wallet' class='openwallet abr icon-folder-open' data-currency='" + request.payment + "' data-rel='0'>" + translate("openwallet") + "</div>" + lndow +
        "</div>\
        <div class='qrwrap flex' id='main_qrwrap'>" + ccqr + lndqr + brstatuspanel +
        "</div>\
        <div id='popform' data-payment='" + request.payment + "' data-currency='" + request.uoa + "' data-address='" + request.address + "' data-lcrate='" + fiatcurrencyrate + "'>\
            <div id='rf_wrap'>\
                <div id='amountbreak' class='inputbreak'>\
                    <span id='mainccinputmirror' class='ccmirror mirrordiv'>\
                        <span>" + thiscurrencyvaluefixedplaceholder + "</span>\
                        <input value='" + thiscurrencyvaluefixedvar + "' data-xrate='" + ccrateeuro + "' step='" + cryptosteps + "' type='number' placeholder='" + glob_zeroplaceholder + "'" + ro_attr + ">\
                    </span>\
                    <span id='amountinputmirror' class='fmirror mirrordiv'>\
                        <span>" + placeholder + "</span>\
                        <input value='" + valueplaceholder + "' data-xrate='" + currencyxrate + "' step='" + fiatsteps + "' type='number' placeholder='" + glob_zeroplaceholder + "'" + ro_attr + ">\
                    </span>\
                    <span id='pickcurrency'>" + request.uoa + "</span>\
                </div>\
                <div id='ibsat' class='inputbreak'>\
                    <span id='satinputmirror' class='mirrordiv'>\
                        <span>" + satplaceholder + "</span>\
                        <input class='satinput' value='" + satamountlet + "' data-xrate='" + ccrateeuro + "' max='10000000000000' type='number' placeholder='000000000'" + ro_attr + "/>\
                    </span> satoshis\
                </div>\
                <div id='iblc' class='inputbreak'>\
                    (<span id='lcinputmirror' class='lcmirror mirrordiv'>\
                        <span>" + fiatcurrencyvalue + "</span>\
                        <input value='" + fiatcurrencyvaluelet + "' data-xrate='" + fiatcurrencyrate + "' step='" + fiatsteps + "' type='number' placeholder='" + glob_zeroplaceholder + "'" + ro_attr + "/>\
                    </span> " + request.fiatcurrency + ") \
                </div>\
                <div id='txibreak' class='inputbreak'> " + translate("send") + " <span id='ccinputmirror' class='ccmirror mirrordiv'><span>" + thiscurrencyvaluefixedplaceholder + "</span><input value='" + thiscurrencyvaluefixedvar + "' data-xrate='" + ccrateeuro + "' step='" + cryptosteps + "' type='number' placeholder='" + glob_zeroplaceholder + "'" + ro_attr + "/></span> " + request.currencysymbol + " " + translate("to") + label_markup + ": </div>\
            </div>\
            <div id='paymentaddress' class='copyinput'>" + address_xmr_ia + "</div><div id='paymentaddress_lnd' class='copyinput' data-type='lightning invoice'></div>\
        </div>\
        <div id='apisrc'>" + translate("source") + ": " + ccapi + "</div>" + poweredby);
    glob_paymentdialogbox.find("#request_back").html("\
        <div class='time_panel'><div class='time_bar'></div></div>\
        <div class='actionbar clearfix'></div>\
        <div id='backwraptop' class='flex'>" + requestinfo + "</div>\
        <div id='backwrapbottom' class='flex'>" + bottomcard + brstatuspanel + "</div><div class='networks'></div>" + poweredby);
    let save_request;
    show_paymentdialog();
    rendercpool(request.amount, currencyxrate);
    renderqr(request.payment, address_xmr_ia, thiscurrencyvaluefixedvar, request.requesttitle);
    if (request.isrequest) { // check for incoming requests
        if (!helper.contactform) { // indicates if it's a online payment so not an incoming request
            if (request.monitored) {
                if (request.iszero) {
                    main_input_focus();
                }
                save_request = saverequest("init");
            }
        }
    } else {
        main_input_focus();
    }
    if (save_request !== "nosocket") {
        closesocket();
        init_socket(helper.selected_socket, request.address);
        set_request_timer();
    }
    if (!request.monitored) {
        notify(translate("notmonitored"), 500000, "yes");
    }
    // close loading screen when in iframe
    if (glob_inframe) {
        parent.postMessage("close_loader", "*");
    }
    const title_node = $("#requesttitle");
    title_node.attr("placeholder", translate("forexample") + ":" + title_node.attr("data-ph" + getrandomnumber(1, 13)));
    console.log({
        "request_object": request
    });
    console.log({
        "helper": helper
    });
    wake();
    const ln_info = helper.lnd;
    if (ln_info) {
        if (!request.lightning_id) {
            const saved_id = br_get_session("lndpid");
            if (saved_id && saved_id == ln_info.pid) {} else {
                br_set_session("lndpid", ln_info.pid);
            }
        }
    }
}

// Displays the payment dialog and adjusts the UI accordingly
function show_paymentdialog() {
    glob_scrollposition = $(document).scrollTop(); // get scrollposition save as global
    fixedcheck(glob_scrollposition); // fix nav position
    glob_html.addClass("paymode blurmain_payment");
    $(".showmain #mainwrap").css("transform", "translate(0, -" + glob_scrollposition + "px)"); // fake scroll position
    glob_paymentpopup.addClass("showpu active");
}

// Focuses on the main input field in the payment dialog
function main_input_focus() {
    const visible_input = glob_paymentdialogbox.hasClass("flipped") ? $("#paymentdialog #shareamount input:visible:first") :
        $("#paymentdialog #amountbreak input:visible:first");
    // hack to move cursor to the end
    const amount_val = visible_input.val();
    visible_input.val("").val(amount_val).focus();
}

// ** Paymentdialog functions **

// Handles the Lightning Network switch functionality
function lnd_switch_function() {
    $(document).on("click", "#paymentdialogbox #lightning_switch", function() {
        if (helper.lnd) {
            if (helper.lnd_only) {
                playsound(glob_funk);
                return
            }
            if (helper.lnd.selected) {
                lnd_statusx();
                return
            }
            const result = confirm(translate("enablelightning"));
            if (result === true) {
                const lnli = lndli();
                lnli.data("selected", true).find(".switchpanel").removeClass("false").addClass("true");
                save_cc_settings("bitcoin", true);
                if (helper.lnd_status) {
                    helper.lnd.selected = true;
                    glob_paymentdialogbox.attr("data-lswitch", "lnd_ao");
                    return
                }
                notify("<span id='lnd_offline'>" + translate("lnoffline") + "</span>", 200000, "yes");
                return
            }
            playsound(glob_funk);
            return
        }
        if (request.isrequest) {
            playsound(glob_funk);
            return
        }
        lnd_popup();
    });
}

// Handles the NFC switch functionality
function ndef_switch_function() {
    $(document).on("click", "#paymentdialogbox #ndef_switch", function() {
        notify(translate("tabyourboldcard"), 10000);
    });
}

// Updates the Lightning Network status
function lnd_statusx() {
    if (helper.lnd_status) {
        if (glob_paymentdialogbox.attr("data-lswitch") === "lnd_ao") {
            glob_paymentdialogbox.attr("data-lswitch", "");
            return
        }
        glob_paymentdialogbox.attr("data-lswitch", "lnd_ao");
        return
    }
    if (request.isrequest) {
        playsound(glob_funk);
        return
    }
    notify("<span id='lnd_offline'>" + translate("lnoffline") + "</span>", 200000, "yes");
}

// Handles the Lightning Network offline status click event
function lnd_offline() {
    $(document).on("click", "#lnd_offline", lnd_popup);
}

// Handles the Lightning Network node info click event
function lnd_ni() {
    $(document).on("click", "#paymentdialogbox #current_lndnode #lnd_nodeinfo_trigger", function(e) {
        e.stopPropagation();
        lnd_popup();
        topnotify(translate("addlightningnode"));
    });
}

// Opens the Lightning Network popup
function lnd_popup() {
    lndli().find(".atext").trigger("click");
}

// Handles currency selection in the payment dialog
function pickcurrency() {
    $(document).on("click", "#paymentdialogbox #pickcurrency", function() {
        const thisnode = $(this),
            currencyarray = helper.currencyarray,
            payment = request.payment,
            nextcurrency_scan = currencyarray[$.inArray(request.uoa, currencyarray) + 1],
            nextcurrency = nextcurrency_scan || currencyarray[0],
            newccnode = $("#paymentdialog .cpool[data-currency='" + nextcurrency + "']"),
            newccsymbol = newccnode.attr("data-currency"),
            newccname = newccnode.attr("data-currencyname"),
            newccvalue = newccnode.attr("data-value"),
            nccvalstrip = newccvalue.replace(/\.00$/, ""),
            newccrate = newccnode.attr("data-xrate"),
            sharelcname = newccname === "Euro" ? "" : (newccnode.hasClass("ccpool") ? request.fiatcurrencyname : newccname),
            mirrordiv = thisnode.prev("#amountinputmirror"),
            amountinput = mirrordiv.children("input"),
            amountinputvalue = amountinput.val(),
            number = Number(amountinputvalue),
            this_iszero = number === 0 || isNaN(number),
            newccvaluevar = this_iszero ? "" : nccvalstrip,
            newccvalueplaceholder = this_iszero ? glob_zeroplaceholder : nccvalstrip,
            iscrypto = newccsymbol == request.currencysymbol,
            dialogclass = iscrypto ? (newccsymbol === "btc" ? " showsat showlc showcc" : " showlc showcc") : (newccsymbol === request.fiatcurrency ? "" : " showlc"), // set classnames for hiding / showing inputs
            gets = geturlparameters(),
            page = gets.p,
            address = gets.address,
            data = gets.d && gets.d.length > 5 ? "&d=" + gets.d : "",
            starturl = page ? "?p=" + page + "&payment=" : "?payment=",
            href = starturl + payment + "&uoa=" + newccsymbol + "&amount=" + nccvalstrip + "&address=" + address + data,
            pagename = translate("sharetitlechange", {
                "payment": payment,
                "newccvalue": nccvalstrip,
                "newccsymbol": newccsymbol
            });
        request.uoa = nextcurrency,
            request.amount = nccvalstrip,
            request.iscrypto = iscrypto;
        thisnode.add("#sharecurrency").text(newccsymbol);
        $("#sharelcname").text(sharelcname);
        amountinput.val(newccvaluevar).attr("data-xrate", newccrate).prev("span").text(newccvalueplaceholder);
        $("#shareinputmirror > input").val(newccvaluevar).prev("span").text(newccvalueplaceholder);
        glob_paymentdialogbox.attr("class", helper.requestclass + dialogclass + helper.iszeroclass);
        main_input_focus();
        set_edit(href);
        settitle(pagename);
        rendercpooltext(newccsymbol, newccrate);
    });
}

// Renders the currency pool text in the payment dialog
function rendercpooltext(nextcurrency, newccrate) {
    $("#paymentdialog .cpool").each(function() {
        const thisnode = $(this),
            thisnoderate = thisnode.attr("data-xrate"),
            thiscurrency = thisnode.attr("data-currency"),
            newrate = thisnoderate / newccrate,
            ccpool = thisnode.hasClass("ccpool"),
            parsedtext = ccpool ? thiscurrency + "_" + nextcurrency : nextcurrency + "_" + thiscurrency,
            parsedrate = ccpool ? 1 / newrate : newrate,
            thisnodetext = parsedtext + ": " + (parsedrate / 1).toFixed(2),
            ratesspan = thisnode.find(".ratesspan");
        ratesspan.toggleClass("hide", parsedrate == 1).text(thisnodetext);
    });
}

// Handles input changes for the fiat amount in the payment dialog
function pushamount() {
    $(document).on("input", "#paymentdialogbox .fmirror > input", function() {
        glob_blocktyping = true;
        const thisnode = $(this),
            thisamount = thisnode.val(),
            iszero = thisamount.length === 0,
            placeholder = iszero ? glob_zeroplaceholder : thisamount,
            thisrate = $("#amountinputmirror > input").attr("data-xrate"),
            amountinputvalue = iszero ? glob_zeroplaceholder : thisamount;
        $("#paymentdialogbox .fmirror > input").not(thisnode).val(thisamount).prev("span").text(placeholder);
        reflectlcvalue(thisamount, thisrate);
        reflectccvalue(thisamount, thisrate);
        reflectsatvalue(thisamount, thisrate);
        updatecpool(amountinputvalue, thisrate, cryptovalue(thisamount, thisrate));
    });
}

// Handles input changes for the local currency amount in the payment dialog
function pushlcamount() {
    $(document).on("input", "#paymentdialogbox .lcmirror > input", function() {
        glob_blocktyping = true;
        const thisnode = $(this),
            thisamount = thisnode.val(),
            thisrate = $("#lcinputmirror > input").attr("data-xrate");
        $("#paymentdialogbox .lcmirror > input").not(thisnode).val(thisamount).prev("span").text(thisamount);
        reflectfiatvalue(thisamount, thisrate, "fiat");
        reflectccvalue(thisamount, thisrate, "fiat");
        reflectsatvalue(thisamount, thisrate);
    });
}

// Handles input changes for the cryptocurrency amount in the payment dialog
function pushccamount() {
    $(document).on("input", "#paymentdialogbox .ccmirror > input", function() {
        glob_blocktyping = true;
        const thisnode = $(this),
            thisamount = thisnode.val(),
            placeholder = thisamount.length === 0 ? glob_zeroplaceholder : thisamount,
            thisrate = $("#mainccinputmirror > input").attr("data-xrate");
        $("#paymentdialogbox .ccmirror > input").not(thisnode).val(thisamount).prev("span").text(placeholder);
        reflectfiatvalue(thisamount, thisrate, "crypto");
        reflectlcvalue(thisamount, thisrate);
        reflectsatvalue(thisamount, thisrate);
    });
}

// Handles input changes for the satoshi amount in the payment dialog
function pushsatamount() {
    $(document).on("input", "#satinputmirror > input", function() {
        glob_blocktyping = true;
        const thisnode = $(this),
            thisamountpre = thisnode.val(),
            thisamount = thisamountpre.length === 0 ? thisamountpre : thisamountpre / 100000000,
            thisrate = $("#mainccinputmirror > input").attr("data-xrate");
        reflectfiatvalue(thisamount, thisrate, "crypto");
        reflectlcvalue(thisamount, thisrate);
        reflectccvalue(thisamount, thisrate, "crypto");
    });
}

// Reflects fiat values in the payment dialog
function reflectfiatvalue(thisamount, thisrate, fieldtype) { // reflect fiat values
    const amountinputrate = $("#amountinputmirror > input").attr("data-xrate"), //get fiat rate
        iszero = thisamount.length === 0,
        deter = glob_paymentdialogbox.hasClass("showcc") ? 6 : 2,
        thisamountvalue = parseFloat(((thisamount / thisrate) * amountinputrate).toFixed(deter)),
        thisamountplaceholder = iszero ? glob_zeroplaceholder : thisamountvalue,
        ccvalue = iszero ? glob_zeroplaceholder : (fieldtype == "crypto" ? thisamount : cryptovalue(thisamount, thisrate));
    reflectinputs($("#paymentdialogbox .fmirror > input"), thisamountvalue, thisamountplaceholder); // reflect fiat values on sharedialog
    updatecpool(thisamountvalue, amountinputrate, ccvalue);
}

// Reflects local currency value in the payment dialog
function reflectlcvalue(thisamount, thisrate) { // reflect local currency value
    const lcrate = $("#popform").attr("data-lcrate"),
        lcvalue = ((thisamount / thisrate) * lcrate).toFixed(2),
        lcplaceholder = thisamount.length === 0 ? glob_zeroplaceholder : lcvalue;
    reflectinputs($("#paymentdialogbox .lcmirror > input"), lcvalue, lcplaceholder);
}

// Reflects cryptocurrency value in the payment dialog
function reflectccvalue(thisamount, thisrate, fieldtype) { // reflect crypto input
    const ccvalue = thisamount.length === 0 ? glob_zeroplaceholder : (fieldtype == "crypto" ? thisamount.toFixed(6) : cryptovalue(thisamount, thisrate));
    reflectinputs($("#paymentdialogbox .ccmirror > input"), ccvalue, ccvalue);
}

// Reflects satoshi value in the payment dialog
function reflectsatvalue(thisamount, thisrate, fieldtype) { // reflect sat input
    const iszero = thisamount.length === 0,
        ccvalue = iszero ? glob_zeroplaceholder : (fieldtype == "crypto" ? thisamount : cryptovalue(thisamount, thisrate)),
        satvalue = (ccvalue * 100000000).toFixed(0),
        satplaceholder = iszero ? "000000000" : satvalue;
    reflectinputs($("#satinputmirror > input"), satvalue, satplaceholder);
}

// Updates input fields and their placeholders
function reflectinputs(node, value, placeholder) {
    const val_correct = (value == 0 || value == "0.00") ? "" : value;
    node.val(val_correct).prev("span").text(placeholder);
}

// Calculates the cryptocurrency value based on the amount and rate
function cryptovalue(thisamount, thisrate) { // get ccrate
    return parseFloat(((thisamount / thisrate) * $("#paymentdialogbox .ccpool").attr("data-xrate")).toFixed(6));
}

// Reflects input changes in the payment dialog
function reflectinput() {
    $(document).on("input change", ".mirrordiv > input", function() {
        const thisinput = $(this),
            thisvalue = thisinput.val(),
            mirrordiv = thisinput.prev("span"),
            placeholder = thisinput.hasClass("satinput") ? "000000000" : thisinput.attr("placeholder");
        mirrordiv.text(thisvalue.length === 0 ? placeholder : thisvalue);
        set_request_timer();
    });
}

// Updates the currency pool and related UI elements
function updatecpool(thisamount, thisrate, ccvalue) {
    rendercpool(thisamount, thisrate);
    const gets = geturlparameters(),
        payment = gets.payment,
        address = gets.address,
        address_xmr_ia = request.xmr_ia || address;
    renderqr(payment, address_xmr_ia, ccvalue);
    const page = gets.p,
        currency = gets.uoa,
        data = gets.d ? "&d=" + gets.d : "",
        starturl = page ? "?p=" + page + "&payment=" : "?payment=",
        href = starturl + payment + "&uoa=" + currency + "&amount=" + thisamount + "&address=" + address + data,
        pagename = translate("sharetitlechange", {
            "payment": payment,
            "newccvalue": thisamount,
            "newccsymbol": currency
        });
    helper.currencylistitem.data("url", href);
    request.amount = thisamount;
    set_edit(href);
    settitle(pagename);
    glob_blocktyping = false;
}

// Renders the currency pool in the payment dialog
function rendercpool(thisamount, thisrate) {
    $("#paymentdialog .cpool").each(function() {
        const thisnode = $(this),
            thisnodeval = parseFloat((thisamount / thisrate) * thisnode.attr("data-xrate")),
            deter = thisnode.hasClass("ccpool") ? thisnodeval.toFixed(6) : thisnodeval.toFixed(2);
        thisnode.attr("data-value", deter);
    });
}

// Renders the QR code for the payment
function renderqr(payment, address, amount, title) {
    const number = Number(amount),
        this_iszero = number === 0 || isNaN(number),
        urlscheme = request.erc20 ? "ethereum:" + address :
        request.coindata.urlscheme(payment, address, amount, this_iszero);
    $("#qrcode").empty().qrcode(urlscheme);
    set_uris(urlscheme, amount);
    if (helper.lnd) { // lightning
        set_lnd_qr(amount, title);
    }
}

// Sets the URIs for wallet opening
function set_uris(urlscheme, amount) {
    $("#paymentdialogbox .openwallet").attr({
        "data-rel": amount,
        "title": urlscheme
    });
}

// Sets the QR code for Lightning Network payments
function set_lnd_qr(a, title) {
    const ln = helper.lnd,
        srt = title || $("#paymentdialog input#requesttitle").val(),
        rt = srt || request.requesttitle,
        m = rt && rt.length > 1 ? "&m=" + encodeURIComponent(rt) : "",
        nid = ln.lnurl === false ? ln.nid : "",
        url = glob_lnd_ph + "proxy/v1/ln/?i=" + ln.imp + "&id=" + request.typecode + ln.pid + nid + "&a=" + (a * 100000000000).toFixed(0) + m,
        lnurl = lnurl_encode("lnurl", url).toUpperCase();
    $("#qrcode_lnd").html("").qrcode(lnurl);
    set_lnd_uris(lnurl, a);
}

// Sets the URIs for Lightning Network wallet opening
function set_lnd_uris(urlscheme, amount) {
    $("#paymentdialogbox .openwallet_lnd").attr({
        "data-rel": amount,
        "title": "lightning:" + urlscheme
    });
    $("#paymentaddress_lnd").text(urlscheme);
}

// Generates the URL scheme for Bitcoin payments
function btc_urlscheme(payment, address, amount, iszero) {
    return payment + ":" + address + (iszero ? "" : "?amount=" + amount);
}

// Generates the URL scheme for Bitcoin Cash payments
function bch_urlscheme(payment, address, amount, iszero) {
    const c_address = address.indexOf("bitcoincash:") > -1 ? address.split("bitcoincash:").pop() : address;
    return "bitcoincash:" + c_address + (iszero ? "" : "?amount=" + amount);
}

// Handles switching between different addresses for the same currency
function switchaddress() {
    $(document).on("click", "#paymentdialogbox.norequest #labelbttn", function() {
        const timelapsed = now() - glob_sa_timer;
        if (timelapsed < 1500) { // prevent clicking too fast
            playsound(glob_funk);
            return
        }
        const gets = geturlparameters(),
            payment = gets.payment;
        if (payment === "monero") {
            return
        }
        const currentaddress = gets.address,
            nextaddress = newaddresli(payment, currentaddress);
        if (nextaddress) {
            const newaddress = nextaddress.data("address"),
                selected_socket = helper.selected_socket;
            closesocket(currentaddress);
            init_socket(selected_socket, newaddress, true);
            const dp = gets.d,
                has_dat = dp && dp.length > 5,
                new_dp = has_dat ? "&d=" + dp : "",
                ccvalue = $("#paymentdialogbox .ccpool").attr("data-value"),
                newaddressid = nextaddress.data("cmcid"),
                newaddresslabel = nextaddress.data("label"),
                page = gets.p,
                starturl = page ? "?p=" + page + "&payment=" : "?payment=",
                href = starturl + payment + "&uoa=" + gets.uoa + "&amount=" + gets.amount + "&address=" + newaddress + new_dp;
            renderqr(payment, newaddress, ccvalue);
            set_edit(href);
            $("#paymentaddress").text(newaddress);
            $(this).text(newaddresslabel);
            const ispending = ch_pending({
                "address": newaddress,
                "cmcid": newaddressid
            });
            glob_paymentdialogbox.attr("data-pending", ispending && request.monitored ? "ispending" : "");
            request.address = newaddress;
            glob_sa_timer = now();
        }
    });
}

// Finds the next valid address for a given currency
function newaddresli(currency, address) {
    const add_li = filter_addressli(currency, "checked", true),
        label_li = add_li.filter(function() { // only pick addresses with label
            return $(this).data("label").length > 0;
        }),
        c_adli = filter_addressli(currency, "address", address),
        nextaddressli = c_adli.next(".adli[data-checked='true']"),
        firstaddressli = label_li.not(".adli[data-address='" + address + "']").first();
    return firstaddressli.length === 0 ? false : (nextaddressli.length ? nextaddressli : firstaddressli);
}

// Handles double-click events for copying addresses
function copyaddress_dblclick() {
    $(document).on("dblclick", "#paymentaddress, #paymentaddress_lnd, .select", function() {
        const thisnode = $(this),
            type = thisnode.attr("data-type") || translate("address");
        glob_copycontent.val(thisnode.text()).data("type", type);
        notify("<span id='copyaddress'>" + translate("copy") + " " + type + "?</span>", 40000, "yes");
    });
}

// Handles the click event for copying addresses
function copyaddress() {
    $(document).on("click", "#copyaddress", function() {
        const val = glob_copycontent.val(),
            type = glob_copycontent.data("type");
        copytoclipboard(val, type);
    });
}

// Handles double-click events for copying input values
function copyinputs() {
    $(document).on("dblclick", "#paymentdialogbox.request .mirrordiv input", function() {
        const thisval = $(this).val(),
            typeval = translate("amount");
        glob_copycontent.val(thisval).data("type", typeval);
        notify("<span id='copyaddress'>" + translate("copy") + " " + typeval + "?</span>", 40000, "yes");
    });
}

// Handles the click event for opening Monero settings
function xmrsettings() {
    $(document).on("click", "#xmrsettings", function() {
        let result = confirm(translate("opencoinsettings", {
            "currency": "Monero"
        }));
        if (result) {
            let page_title = "monero_settings";
            openpage("?p=" + page_title, page_title, "loadpage");
            cancelpaymentdialog();
        }
    });
}

// Validates request data and updates the URL
function validaterequestdata(lnurl) {
    const gets = geturlparameters(),
        requestname_val = $("input#requestname").val(),
        requesttitle_val = $("input#requesttitle").val(),
        valid = requestname_val.length > 2 && requesttitle_val.length > 1,
        sharebutton = $("#sharebutton"),
        page = gets.p,
        payment = gets.payment,
        currency = gets.uoa,
        amount = gets.amount,
        address = lnurl ? "lnurl" : gets.address,
        starturl = page ? "?p=" + page + "&payment=" : "?payment=",
        currenturl = starturl + payment + "&uoa=" + currency + "&amount=" + amount + "&address=" + address,
        ln_info = helper.lnd;
    let newurl;
    if (valid) {
        const utc = now_utc(), // UTC
            no_conf = request.no_conf,
            dataobject = {
                "ts": utc,
                "n": requestname_val,
                "t": requesttitle_val
            };
        if (!no_conf) {
            dataobject.c = request.set_confirmations;
        }
        if (payment === "monero") {
            if (request.viewkey || request.xmr_ia) {
                if (request.viewkey && request.share_vk) {
                    dataobject.vk = request.viewkey.vk;
                }
                if (request.xmr_ia) {
                    dataobject.pid = request.payment_id;
                }
            }
        }
        if (ln_info && glob_paymentdialogbox.attr("data-lswitch") === "lnd_ao") { // lightning data
            dataobject.imp = ln_info.imp;
            dataobject.lid = ln_info.pid;
            dataobject.proxy = ln_info.proxy_host;
            if (!ln_info.lnurl) {
                dataobject.nid = ln_info.nid;
            }
            set_lnd_qr($("#ccinputmirror > input").val(), requesttitle_val);
        }
        newurl = currenturl + "&d=" + btoa(JSON.stringify(dataobject));
        request.requestname = requestname_val,
            request.requesttitle = requesttitle_val;
        sharebutton.addClass("sbactive");
    } else {
        newurl = currenturl;
        sharebutton.removeClass("sbactive");
    }
    helper.currencylistitem.data("url", newurl);
    set_edit(newurl);
}

// Handles input events for request data
function inputrequestdata() {
    $(document).on("input", "#shareform input", function() {
        validaterequestdata();
        set_request_timer();
    });
}

// Validates input steps and prevents invalid inputs
function validatesteps() {
    $(document).on("keydown", "#paymentdialogbox .mirrordiv input", function(e) {
        if (glob_blocktyping === true) {
            playsound(glob_funk);
            glob_blocktyping = false;
            e.preventDefault();
            return
        }
        const thisnode = $(this),
            thisvalue = thisnode.val(),
            keycode = e.keyCode;
        restrictedKeyCodes = [188, 190, 108, 110, 229];
        if (restrictedKeyCodes.includes(keycode)) { // prevent double commas and dots
            const v_length = thisvalue.length;
            if (v_length) {
                if (keycode === 188) {
                    if ((glob_supportsTouch && glob_is_safari) || glob_is_ios_app) { // prevent commas for mobile safari and ios app
                        e.preventDefault();
                        return
                    }
                }
                if (glob_prevkey || thisvalue.includes(".") || thisvalue.includes(",") || !e.target.validity.valid || thisnode.hasClass("satinput")) {
                    e.preventDefault();
                }
                glob_prevkey = true;
                return
            }
            e.preventDefault();
            return
        }
        if (keycode === 8) { // alow backspace
            glob_prevkey = false;
            return
        }
        const command = (keycode === 91 || keycode === 17 || e.metaKey || e.ctrlKey);
        if (command) {
            if (keycode === 65) { // unblock comma on select all
                glob_prevkey = false;
            }
            return
        }
        if (keycode === 37 || keycode === 39) { // arrowleft, arrowright
            return
        }
        if ((keycode >= 48 && keycode <= 57) || (keycode >= 96 && keycode <= 105)) { //only allow numbers
            if (!e.target.validity.valid) { //test input patern and steps attributes
                const stostr = document.getSelection().toString();
                if (stostr.replace(",", ".") !== thisvalue.replace(",", ".")) {
                    e.preventDefault();
                }
            }
            return
        }
        e.preventDefault();
    })
}

// Handles flipping the request dialog
function fliprequest() {
    $(document).on("click", "#paymentdialogbox.norequest #sharerequest", function(e) {
        e.preventDefault();
        if (glob_offline === true) {
            return
        }
        const is_lnd = glob_paymentdialogbox.attr("data-lswitch") === "lnd_ao";
        if (glob_paymentdialogbox.attr("data-pending") === "ispending" && !is_lnd) {
            if (request.payment === "monero") {
                notify(translate("addressinuse") + ". <span id='xmrsettings'>" + translate("activateintegrated") + "?</span>", 40000, "yes");
                return
            }
            pendingrequest();
            return
        }
        if (is_lnd && glob_paymentdialogbox.hasClass("accept_lnd")) {
            return
        }
        flip_right1();
    });
}

// Handles revealing the full title when it's too long
function revealtitle() {
    $(document).on("click", "#paymentdialogbox.request #sharetitle.title_exceed", function(e) {
        const thisnode = $(this),
            longtext = thisnode.attr("title"),
            shorttext = thisnode.attr("data-shorttitle"),
            newtext = thisnode.hasClass("longtext") ? shorttext : longtext;
        thisnode.text("'" + newtext + "'").toggleClass("longtext");
    });
}

// Handles pending requests and address selection
function pendingrequest() {
    const thisaddress = request.address,
        payment = request.payment,
        cmcid = request.cmcid,
        currencysymbol = request.currencysymbol,
        pending_tx = $("#requestlist li[data-address='" + thisaddress + "'][data-pending='scanning'][data-cmcid='" + cmcid + "']").first(),
        pending_requestid = pending_tx.data("requestid"),
        nonpending_addresslist = filter_addressli(payment, "checked", true).filter(function() {
            let thisnode = $(this);
            return !ch_pending({
                "address": thisnode.data("address"),
                "cmcid": thisnode.data("cmcid")
            });
        }),
        has_addresses = nonpending_addresslist.length > 0;
    let dialogcontent,
        addresslist = "";
    if (has_addresses) {
        addresslist = nonpending_addresslist.map(function() {
            const data = $(this).data();
            return "<span data-address='" + data.address + "' data-pe='none'>" + data.label + " | " + data.address + "</span>";
        }).get().join("");
        const first_address = nonpending_addresslist.first(),
            fa_data = first_address.data();
        dialogcontent = "<h3>" + translate("pickanotheraddress") + "</h3><div class='selectbox'>\
            <input type='text' value='" + fa_data.label + " | " + fa_data.address + "' placeholder='Pick currency' readonly id='selec_address'/>\
            <div class='selectarrows icon-menu2' data-pe='none'></div>\
            <div class='options'>" + addresslist + "</div>\
        </div>\
        <input type='submit' class='submit' value='" + translate("okbttn") + "' id='pending_pick_address'/>";
    } else {
        dialogcontent = "<div id='addaddress' class='button'><span class='icon-plus'>" + translate("addcoinaddress", {
            "currency": currencysymbol
        }) + "</span></div><input type='submit' class='submit' value='" + translate("okbttn") + "' id='pending_add_address'/>";
    }
    const content = "<div class='formbox' id='addresslock' data-currency='" + payment + "' data-currencysymbol='" + currencysymbol + "' data-cmcid='" + cmcid + "'><h2 class='icon-lock'>" + translate("sharelocktitle") + "</h2><p>" + translate("sharelockttext", {
        "pending_requestid": pending_requestid
    }) + "<br/>" + translate("waitforconfirm") + "</p>\
    <div class='popnotify'></div>\
    <div class='popform validated'>" + dialogcontent + "</div>";
    popdialog(content, "triggersubmit");
}

// Handles viewing pending transactions
function view_pending_tx() {
    $(document).on("click", "#view_pending_tx", function() {
        const result = confirm(translate("viewpendingrequest"));
        if (result) {
            openpage("?p=requests", "requests", "loadpage");
            open_tx($("#" + $(this).attr("data-requestid")));
            canceldialog();
            cancelpaymentdialog();
        }
    });
}

// Handles picking an address from the dialog
function pickaddressfromdialog() {
    $(document).on("click", "#addresslock #pending_pick_address", function(e) {
        e.preventDefault();
        const thisinput = $("#selec_address"),
            thisinputvalue = thisinput.val(),
            result = confirm(translate("useinstead", {
                "thisinputvalue": thisinputvalue
            }));
        if (result) {
            const gets = geturlparameters();
            if (gets.xss) {
                return
            }
            const picked_value = thisinputvalue.split(" | "),
                picked_label = picked_value[0],
                picked_address = picked_value[1],
                page = gets.p,
                payment = gets.payment,
                currency = gets.uoa,
                amount = gets.amount,
                currentaddress = gets.address;
            closesocket(currentaddress);
            init_socket(helper.selected_socket, picked_address, true);
            const dp = gets.d,
                has_dat = dp && dp.length > 5,
                new_dp = has_dat ? "&d=" + dp : "",
                starturl = page ? "?p=" + page + "&payment=" : "?payment=",
                href = starturl + payment + "&uoa=" + currency + "&amount=" + amount + "&address=" + picked_address + new_dp,
                ccvalue = $("#paymentdialogbox .ccpool").attr("data-value");
            $("#paymentaddress").text(picked_address);
            $("#labelbttn").text(picked_label);
            request.address = picked_address;
            renderqr(payment, picked_address, ccvalue);
            set_edit(href);
            glob_paymentdialogbox.attr("data-pending", "");
            canceldialog();
        }
    });
}

// Sets the edit URL and updates browser history
function set_edit(url) {
    history.replaceState(null, null, url);
    br_set_local("editurl", url);
}

// Handles adding a new address from the dialog
function addaddressfromdialog() {
    $(document).on("click", "#addresslock #pending_add_address, #addaddress", function(e) {
        e.preventDefault();
        const formbox = $(this).closest("#addresslock"),
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
            scanqr = glob_hascam ? "<div class='qrscanner' data-currency='" + payment + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
            scanvk = glob_hascam ? "<div class='qrscanner' data-currency='" + payment + "' data-id='viewkey' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
            vk_box = payment === "monero" ? "<div class='inputwrap'><input type='text' class='vk_input' value='' placeholder='View key'>" + scanvk + "</div>" : "",
            der_src = dd ? (dd.xpubid ? " from Xpub" : " from seed") : "",
            seedstr = dd ? "<div class='popnotify' style='display:block'><span id='addfromseed' class='address_option'>Generate address" + der_src + "</span></div>" : "<div class='popnotify'></div>",
            content = $("<div class='formbox form add' id='addressformbox'><h2>" + getcc_icon(cmcid, request.cpid, erc20) + " " + translate("addcoinaddress", {
                "currency": payment
            }) + "</h2>" + seedstr + "<form id='addressform' class='popform'><div class='inputwrap'><input type='text' class='address' value='' placeholder='" + translate("nopub") + "'>" + scanqr + "</div>" + vk_box + "<input type='text' class='addresslabel' value='' placeholder='label'><div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("pkownership") + "</span></div><input type='submit' class='submit' value='" + translate("okbttn") + "'></form></div>").data(ad);
        formbox.parent("#dialogbody").html(content);
    });
}

// Handles adding an address from seed
function add_from_seed() {
    $(document).on("click", "#addfromseed", function() {
        const ad = $("#addressformbox").data(),
            currency = ad.currency,
            dd = ad.dd;
        if (currency && dd && dd.address) {
            const result = confirm(translate("generatenewaddress", {
                "currency": currency
            }));
            if (result) {
                derive_add_address(currency, dd);
                canceldialog();
            }
        }
    });
}

// Handles scanning QR code
function scanqr() {
    $(document).on("click", "#scanqr", function() {
        remove_flip();
        if (request.iszero_request) {
            $("#amountbreak input").focus();
        }
    });
}

// Shows API stats
function showapistats() {
    $(document).on("click", "#apisrc", function() {
        $("#xratestats").toggleClass("show");
    });
}

// Hides API stats
function hideapistats() {
    $(document).on("click", "#xratestats", function() {
        $(this).removeClass("show");
    });
}

// ** Share **

// Handles share button click
function sharebutton() {
    $(document).on("click", "#sharebutton", function() {
        const thisbttn = $(this);
        if (request.payment === "bitcoin" && helper.lnd_status) {
            const lnd_only = glob_paymentdialogbox.attr("data-lswitch") === "lnd_ao" ? $("#fallback_address").is(":visible") ? !$("#fallback_address .switchpanel").hasClass("true") : true : false;
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

// Handles sharing the payment request
function share(thisbutton) {
    if (thisbutton.hasClass("sbactive")) {
        const gets = geturlparameters();
        if (gets.xss) {
            thisbutton.removeClass("sbactive")
            return
        }
        loader(true);
        const payment = gets.payment,
            thiscurrency = gets.uoa,
            thisamount = gets.amount,
            thisaddress = gets.address,
            dataparam = gets.d,
            cmcid = request.cmcid,
            currencysymbol = request.currencysymbol,
            thisdata = dataparam && dataparam.length > 5,
            dataobject = thisdata ? JSON.parse(atob(dataparam)) : null, // decode data param if exists
            thisrequestname = thisdata ? dataobject.n : $("#accountsettings").data("selected"),
            thisrequesttitle = thisdata ? dataobject.t : "",
            lightning = thisdata ? !!dataobject.imp : false,
            hybrid = lightning && thisaddress !== "lnurl",
            newdatastring = thisdata ? "&d=" + dataparam : "", // construct data param if exists
            isipfs = glob_thishostname.includes("ipfs") || glob_thishostname.includes("bitrequest.crypto"),
            shared_host = isipfs ? glob_c_host : "https://bitrequest.github.io", // check for IFPS
            url_id = shared_host + "/?p=requests&payment=" + payment + "&uoa=" + thiscurrency + "&amount=" + thisamount + "&address=" + thisaddress,
            sharedurl = url_id + newdatastring,
            thisrequestname_uppercase = capitalize(thisrequestname), // capitalize requestname
            paymentupper = capitalize(payment),
            payment_name = lightning ? "Lightning" : paymentupper,
            sharedtitle = thisdata ? translate("sharetitlename", {
                "requestname": thisrequestname_uppercase,
                "pagenameccparam": payment_name,
                "amount": thisamount,
                "uoa": thiscurrency.toUpperCase(),
                "requesttitle": thisrequesttitle
            }) : translate("sharetitle", {
                "pagenameccparam": payment_name,
                "amount": thisamount,
                "uoa": thiscurrency
            }),
            share_icon = lightning ? glob_approot + "img_logos_btc-lnd.png" : glob_cmc_icon_loc + cmcid + ".png";
        if (isipfs) {
            sharerequest(sharedurl, sharedtitle);
            setlocales();
            return
        }
        const url_hash = hashcode(url_id + sharedtitle);
        shorten_url(sharedtitle, sharedurl, share_icon, null, url_hash);
        setlocales();
        return

    }
    const requestname = $("#requestname"),
        requesttitle = $("#requesttitle"),
        name_check = requestname.val().length,
        title_check = requesttitle.val().length,
        name_check_message = name_check < 1 ? translate("enteryourname") : name_check < 3 ? translate("minimal3") : translate("checkyourform"),
        title_check_message = title_check < 1 ? translate("entertitle") : title_check < 2 ? translate("minimal2") : translate("checkyourform"),
        check_message = name_check < 3 ? name_check_message : title_check < 2 ? title_check_message : translate("requiredfields");
    topnotify(check_message);
    if (name_check < 3) {
        requestname.focus();
    } else if (title_check < 2) {
        requesttitle.focus();
    }
}

// Handles URL shortening and sharing process
function shorten_url(sharedtitle, sharedurl, sitethumb, unguessable, url_hash) {
    loadertext(translate("generatelink"));
    const us_settings = $("#url_shorten_settings"),
        us_active = us_settings.data("us_active") === "active";
    if (us_active) {
        const us_service = us_settings.data("selected"),
            is_custom = us_service.indexOf("https://") >= 0;
        if (url_hash) {
            const cache_prefix = is_custom ? "custom" : us_service,
                getcache = br_get_session(cache_prefix + "_shorturl_" + url_hash);
            if (getcache) {
                sharerequest(getcache, sharedtitle);
                return;
            }
        }
        if (us_service === "firebase") {
            firebase_shorten(sharedurl, sharedtitle, sitethumb, unguessable, url_hash);
            return;
        }
        if (us_service === "bitly") {
            bitly_shorten(sharedurl, sharedtitle, url_hash);
            return;
        }
        if (is_custom) {
            custom_shorten(us_service, sharedurl, sharedtitle, sitethumb, url_hash);
            return;
        }
    }
    sharerequest(sharedurl, sharedtitle);
}

// Handles Firebase URL shortening
function firebase_shorten(sharedurl, sharedtitle, sitethumb, unguessable, url_hash) {
    const security = unguessable ? "UNGUESSABLE" : "SHORT";
    api_proxy({
        "api": "firebase",
        "search": "shortLinks",
        "params": {
            "method": "POST",
            "cache": false,
            "data": JSON.stringify({
                "dynamicLinkInfo": {
                    "domainUriPrefix": glob_firebase_dynamic_link_domain,
                    "link": sharedurl,
                    "androidInfo": {
                        "androidPackageName": glob_androidpackagename
                    },
                    "iosInfo": {
                        "iosBundleId": glob_androidpackagename,
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
        const data = br_result(e).result;
        if (data) {
            if (data.error) {
                custom_shorten(false, sharedurl, sharedtitle, sitethumb, url_hash);
                return
            }
            const shorturl = data.shortLink;
            if (shorturl) {
                sharerequest(shorturl, sharedtitle);
                if (url_hash) {
                    br_set_session("firebase_shorturl_" + url_hash, shorturl);
                }
                return
            }
        }
        custom_shorten(false, sharedurl, sharedtitle, sitethumb, url_hash);
    }).fail(function() {
        custom_shorten(false, sharedurl, sharedtitle, sitethumb, url_hash);
    });
}

// Handles Bitly URL shortening
function bitly_shorten(sharedurl, sharedtitle, url_hash) {
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
        const data = br_result(e).result;
        if (data.id) {
            const linkid = data.id.split("/").pop(),
                shurl = glob_approot + "?i=4bR" + linkid;
            sharerequest(shurl, sharedtitle);
            if (url_hash) {
                br_set_session("bitly_shorturl_" + url_hash, shurl);
            }
            return
        }
        sharerequest(sharedurl, sharedtitle);
    }).fail(function() {
        sharerequest(sharedurl, sharedtitle);
    });
}

// Handles Custom URL shortening
function custom_shorten(service, sharedurl, sharedtitle, sitethumb, url_hash) {
    const serv = service || d_proxy(),
        rqdat = btoa(JSON.stringify({
            "sharedurl": sharedurl,
            "sitethumb": sitethumb
        })),
        shorturl = randomId(),
        payload = {
            "function": "post",
            "longurl": rqdat,
            "shorturl": shorturl
        };
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": serv + "proxy/v1/inv/api/",
        "data": payload
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            if (data.error) {
                notify(serv + ": " + data.error, 500000, "yes");
                bitly_shorten(sharedurl, sharedtitle, url_hash);
                return
            }
            const rqid = data.shorturl;
            if (rqid) {
                const index = glob_proxy_list.indexOf(serv),
                    isdefault = index > -1;
                shurl = isdefault ? glob_approot + "?i=" + index.toString() + rqid : serv + "proxy/v1/inv/4bR" + rqid;
                sharerequest(shurl, sharedtitle);
                if (url_hash) {
                    br_set_session("custom_shorturl_" + url_hash, shurl);
                }
                return
            }
        }
        bitly_shorten(sharedurl, sharedtitle, url_hash);
    }).fail(function() {
        bitly_shorten(sharedurl, sharedtitle, url_hash);
    });
}

// Generates a random ID for custom short URLs
function randomId() {
    const uint32 = crypto.getRandomValues(new Uint32Array(1))[0];
    return uint32.toString(16);
}

// Handles the sharing of requests
function sharerequest(sharedurl, sharedtitle) {
    closeloader();
    if (glob_is_ios_app) {
        sharefallback(sharedurl, sharedtitle);
        return
    }
    if (glob_supportsTouch && navigator.canShare) {
        navigator.share({
            "title": sharedtitle + " | " + glob_apptitle,
            "text": sharedtitle + ": \n",
            "url": sharedurl
        }).then(sharecallback).catch(function(err) {
            console.error("Sharing failed:", err);
        });
        return
    }
    sharefallback(sharedurl, sharedtitle);
}

// Fallback function for sharing when native sharing is not available
function sharefallback(sharedurl, sharedtitle) {
    const mobileclass = glob_supportsTouch ? " showtouch" : "";
    $("#sharepopup").addClass("showpu active" + mobileclass).data({
        "sharetitle": sharedtitle,
        "shareurl": sharedurl
    });
    glob_body.addClass("sharemode");
}

// Handles sharing via WhatsApp
function whatsappshare() {
    $(document).on("click", "#whatsappshare", function() {
        sharecallback();
        const shareinfo = getshareinfo(),
            sharetext = encodeURIComponent(shareinfo.body),
            share_url = "whatsapp://send?text=" + sharetext;
        open_share_url("location", share_url);
    });
}

// Handles sharing via email
function mailto() {
    $(document).on("click", "#mailto", function() {
        sharecallback();
        const shareinfo = getshareinfo(),
            share_url = "mailto:?subject=" + encodeURIComponent(shareinfo.title) + "&body=" + encodeURIComponent(shareinfo.body);
        open_share_url("location", share_url);
    });
}

// Handles copying the share URL to clipboard
function copyurl() {
    $(document).on("click", "#copyurl", function() {
        copytoclipboard(getshareinfo().url, "Request url");
        sharecallback();
    });
}

// Handles sharing via Gmail
function gmailshare() {
    $(document).on("click", "#gmailshare", function() {
        sharecallback();
        const shareinfo = getshareinfo(),
            share_url = "https://mail.google.com/mail/?view=cm&fs=1&su=" + encodeURIComponent(shareinfo.title) + "&body=" + encodeURIComponent(shareinfo.body);
        open_share_url("open", share_url);
    });
}

// Handles sharing via Telegram
function telegramshare() {
    $(document).on("click", "#telegramshare", function() {
        sharecallback();
        const shareinfo = getshareinfo(),
            share_url = "https://telegram.me/share/url?url=" + shareinfo.url + "&text=" + encodeURIComponent(shareinfo.body);
        open_share_url("open", share_url);
    });
}

// Handles sharing via Outlook
function outlookshare() {
    $(document).on("click", "#outlookshare", function() {
        sharecallback();
        const shareinfo = getshareinfo(),
            share_url = "ms-outlook://compose?subject=" + encodeURIComponent(shareinfo.title) + "&body=" + encodeURIComponent(shareinfo.body);
        open_share_url("location", share_url);
    });
}

// Retrieves share information from the share popup
function getshareinfo() {
    const sharepopup = $("#sharepopup"),
        sharetitle = sharepopup.data("sharetitle"),
        shareurl = sharepopup.data("shareurl");
    return {
        "title": sharetitle,
        "url": shareurl,
        "body": sharetitle + ": \n " + shareurl
    }
}

// Handles actions after successful sharing
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
    notify(translate("successshare") + " 🎉");
}

// Opens the share URL
function open_share_url(type, url) {
    loader(true);
    setTimeout(function() {
        closeloader();
        if (type === "open") {
            window.open(url);
            return
        }
        if (type === "location") {
            glob_w_loc.href = url;
        }
    }, 500);
}

// Triggers opening of a transaction based on URL parameters
function trigger_open_tx() {
    const gets = geturlparameters();
    if (gets.xss) {
        return
    }
    const tx_param = gets.txhash;
    if (tx_param) {
        const tx_node = get_requestli("txhash", tx_param);
        open_tx(tx_node);
    }
}

// Handles viewing transaction details
function view_tx() {
    $(document).on("click", "#view_tx", function() {
        if (glob_inframe) {
            glob_html.removeClass("hide_app");
        } else if (glob_body.hasClass("showstartpages")) {
            cancelpaymentdialog();
            startnext($("#intro"));
            return;
        }
        openpage("?p=requests", "requests", "loadpage");
        const tx_hash = $(this).attr("data-txhash"),
            tx_node = get_requestli("txhash", tx_hash);
        open_tx(tx_node);
    });
}

// Opens and displays transaction details
function open_tx(tx_node) {
    const selected_request = tx_node.length > 0 ? tx_node : $("#requestlist .rqli").first(),
        infopanel = selected_request.find(".moreinfo"),
        metalist = infopanel.find(".metalist");
    $(".moreinfo").not(infopanel).slideUp(500);
    $(".metalist").not(metalist).slideUp(500);
    $(".historic_meta").slideUp(200);
    infopanel.add(metalist).slideDown(500);
    selected_request.addClass("visible_request");
    const confbar = selected_request.find(".transactionlist .confbar");
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

// Saves or updates a payment request, handling various scenarios including local, incoming, and outgoing requests
function saverequest(direct) {
    const gets = geturlparameters();
    if (gets.xss) {
        return
    }
    const thispayment = gets.payment,
        thiscurrency = gets.uoa,
        thisamount = gets.amount,
        currencysymbol = request.currencysymbol,
        thisrequesttype = request.requesttype,
        thispaymenttimestamp = request.paymenttimestamp,
        set_confirmations = request.set_confirmations,
        ln_info = helper.lnd,
        ln_id = ln_info ? ln_info.pid : "",
        sc_string = ln_info ? "1" : (set_confirmations ? set_confirmations.toString() : "0"),
        amount_string = thisamount ? thisamount.toString() : "0",
        thisaddress = gets.address,
        thisdata = gets.d,
        thismeta = gets.m,
        timestamp = now_utc(), // UTC
        rqdatahash = thisdata && thisdata.length > 5 ? thisdata : null, // check if data param exists
        rqmetahash = thismeta && thismeta.length > 5 ? thismeta : null, // check if meta param exists
        dataobject = rqdatahash ? JSON.parse(atob(rqdatahash)) : null, // decode data param if exists
        requesttimestamp = thispaymenttimestamp || (dataobject && dataobject.ts) || (thisrequesttype === "incoming" ? null : timestamp), // null is unknown timestamp
        unhashed = thispayment + thiscurrency + amount_string + thisaddress + request.requestname + request.requesttitle + sc_string + ln_id,
        savedtxhash = request.txhash,
        requestid = thisrequesttype === "local" && savedtxhash ? hashcode(savedtxhash) : hashcode(unhashed),
        requestcache = br_get_local("requests", true),
        requestid_param = gets.requestid,
        checkout = direct !== "init" && thisrequesttype === "checkout",
        this_iscrypto = thiscurrency === currencysymbol,
        ln = dataobject && dataobject.imp;
    let this_requestid,
        hybrid = true,
        invoice = false,
        lightning = false;
    if (ln_info) {
        if (thisaddress === "lnurl") {
            hybrid = false;
        }
        invoice = ln_info.invoice,
            lightning = thisrequesttype === "outgoing" && !ln ? false : {
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
        this_requestid = $.grep(requestcache, function(filter) { //filter pending requests
            return filter.requestid === requestid;
        });
    }
    const incache = this_requestid && this_requestid.length > 0;
    if (incache || requestid_param) { // do not save if request already exists
        const smart_id = requestid_param || requestid,
            requestli = $("#" + smart_id),
            rldata = requestli.data(),
            pendingstate = rldata.pending;
        if (savedtxhash) { // check if request is opened or updated
            request.received = true;
            if (pendingstate !== "paid") {
                const update_dat = {
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
                br_remove_session("historic_" + smart_id); // remove historic price cache
                updaterequest(update_dat, true);
            }
        } else {
            const rqstatus = rldata.status;
            if (pendingstate === "scanning" || rqstatus === "canceled") { // do nothing
                return false;
            } else {
                if (pendingstate === "polling" || requestli.hasClass("expired")) {
                    pendingdialog(requestli);
                    if (lightning) {
                        return false;
                    }
                    return "nosocket";
                }
                if (pendingstate === "no") {
                    request.received = true;
                    const txhash_state = rldata.txhash,
                        typestate = rldata.requesttype,
                        send_receive = typestate === "incoming" ? "sent" : "received",
                        tlstat = send_receive === "sent" ? translate("paymentsent") : translate("paymentreceived");
                    adjust_paymentdialog("paid", "no", tlstat);
                    glob_paymentdialogbox.find("span#view_tx").attr("data-txhash", txhash_state);
                    return "nosocket";
                }
            }
        }
    } else {
        //overwrite global request object
        request.requestid = requestid,
            request.iscrypto = this_iscrypto,
            request.fiatcurrency = this_iscrypto ? request.localcurrency : thiscurrency,
            request.currencyname = $("#xratestats .cpool[data-currency='" + thiscurrency + "']").attr("data-currencyname"),
            request.cc_amount = parseFloat($("#open_wallet").attr("data-rel"));
        const numberamount = Number(thisamount),
            this_iszero = numberamount === 0 || isNaN(numberamount);
        if (direct === "init" && request.shared === false) { // when first opened only save shared requests
            // Do nothing
        } else if (this_iszero === true) { // don't save requests with zero value
            // Do nothing
        } else {
            const coinsettings = request.coinsettings,
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
                const request_params = "&requestid=" + requestid + "&status=" + request.status + "&type=" + thisrequesttype;
                history.replaceState(null, null, glob_w_loc.href + request_params);
            }
            if (coinsettings) {
                const reuse = coinsettings["Reuse address"];
                if (reuse) {
                    const addressli = filter_addressli(thispayment, "address", thisaddress);
                    addressli.addClass("used").data("used", true);
                    if (reuse.selected === false) {
                        // Derive new address
                        if (hybrid === false) {
                            // Do nothing
                        } else {
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
        const contact_param = gets.contactform,
            meta_data_object = rqmetahash ? JSON.parse(atob(rqmetahash)) : null, // decode meta param if exists
            fiatvalue_rounded = trimdecimals(request.fiatvalue, 2),
            received_in_currency = this_iscrypto ? request.receivedamount : fiatvalue_rounded,
            tpts = thispaymenttimestamp || timestamp,
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
                "lightning": lightning,
                "erc20": request.erc20,
                "layer": request.layer
            };
        let contactdata;
        if (contact_param) {
            const cfdata = $("#contactform").data(),
                cf_address = cfdata.address;
            if (cf_address) {
                contactdata = {
                    "name": cfdata.name,
                    "address": cf_address,
                    "zipcode": cfdata.zipcode,
                    "city": cfdata.city,
                    "country": cfdata.country,
                    "email": cfdata.email
                }
            }
        };
        const post_data = {
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
    if (thisrequesttype !== "incoming") {
        helper.currencylistitem.removeData("url"); // remove saved url / reset lightning id
        br_remove_local("editurl");
        br_remove_session("lndpid");
    }
}

// Handles the display of pending transaction dialog
function pendingdialog(pr) { // show pending dialog if tx is pending
    request.received = true;
    const prdata = pr.data(),
        requestid = prdata.requestid;
    request.requestid = requestid;
    const status = prdata.status,
        txhash = prdata.txhash,
        tl_txhash = pr.find(".transactionlist li:first").data("txhash"),
        smart_txhash = txhash || tl_txhash,
        typestate = prdata.requesttype,
        send_receive = typestate === "incoming" ? "sent" : "received",
        brstatuspanel = glob_paymentdialogbox.find(".brstatuspanel"),
        viewtx = brstatuspanel.find("#view_tx"),
        pending = prdata.pending,
        thispayment = prdata.payment,
        lightning = prdata.lightning;
    viewtx.attr("data-txhash", smart_txhash);
    if (pr.hasClass("expired")) {
        if (status === "new" || status === "insufficient") {
            adjust_paymentdialog("expired", "no", translate("txexpired"));
            glob_paymentdialogbox.find("span#view_tx").hide();
        }
        return
    }
    if (lightning) {
        const invoice = lightning.invoice;
        if (invoice) {
            if (invoice.status === "paid") {
                const tlstat = send_receive === "sent" ? translate("paymentsent") : translate("paymentreceived");
                adjust_paymentdialog("paid", "no", tlstat);
                return
            }
            if (invoice.status === "pending") {
                adjust_paymentdialog("pending", "polling", translate("waitingforpayment"));
                return
            }
            return
        }
    }
    if (thispayment === "nano") { // 0 confirmation so payment must be sent
        if (status === "insufficient") {
            adjust_paymentdialog("insufficient", "scanning", translate("insufficientamount"));
            return
        }
        const tlstat = send_receive === "sent" ? translate("paymentsent") : translate("paymentreceived");
        adjust_paymentdialog("paid", "no", tlstat);
        return
    }
    if (smart_txhash) {
        add_flip();
        if (pending === "scanning") {
            if (status === "insufficient") {
                adjust_paymentdialog("insufficient", "scanning", translate("insufficientamount"));
                return
            }
            adjust_paymentdialog("pending", "scanning", translate("pendingrequest"));
            return
        }
        adjust_paymentdialog("pending", "polling", translate("txbroadcasted"));
        pick_monitor(smart_txhash, false);
    }
}

// Adjusts the payment dialog based on the current status
function adjust_paymentdialog(status, pending, status_text) {
    const play_sound = status === "insufficient" ? glob_funk : glob_blip,
        brstatuspanel = glob_paymentdialogbox.find(".brstatuspanel");
    playsound(play_sound);
    add_flip();
    glob_paymentdialogbox.addClass("transacting").attr({
        "data-status": status,
        "data-pending": pending
    });
    brstatuspanel.find("h2").text(status_text);
}

// Handles the open wallet functionality
function openwallet() {
    $(document).on("click", ".openwallet, .openwallet_lnd", function() {
        const thisnode = $(this),
            thiscurrency = thisnode.attr("data-currency"),
            this_url = thisnode.attr("title"),
            lndurl = this_url && this_url.slice(0, 9) === "lightning",
            lnd_ref = lndurl ? "lightning" : thiscurrency,
            content = "<div class='formbox' id='backupformbox'><h2 class='icon-folder-open'>" + translate("havewallet", {
                "lnd_ref": lnd_ref
            }) + "</h2><div class='popnotify'></div><div id='backupactions'><a href='" + this_url + "' class='customtrigger' id='openwalleturl'>" + translate("yes") + "</a><div id='dw_trigger' class='customtrigger' data-currency='" + lnd_ref + "'>" + translate("no") + "</div></div>";
        popdialog(content, "triggersubmit");
    });
}

// Handles the click event for opening wallet URL
function openwalleturl() {
    $(document).on("click", "#openwalleturl", function() {
        canceldialog();
    });
}

// Triggers the download wallet functionality
function dw_trigger() {
    $(document).on("click", "#dw_trigger", function() {
        const this_currency = $(this).attr("data-currency");
        canceldialog();
        setTimeout(function() {
            download_wallet(this_currency);
        }, 800);
    })
}

// Handles the wallet download process
function download_wallet(currency) {
    const ln = currency === "lightning",
        thiscurrency = ln ? "bitcoin" : currency,
        coindata = getcoinconfig(thiscurrency),
        wallets = ln ? coindata.lightning_wallets : coindata.wallets,
        wdp = wallets.wallet_download_page,
        wallets_arr = wallets.wallets;
    if (wdp || wallets_arr) {
        const wallet_ul = wallets_arr ? "<ul id='formbox_ul'></ul>" : "",
            fmw = wdp ? "<a href='" + wdp + "' target='_blank' class='exit formbox_href'>" + translate("findmorewallets") + "</a>" : "",
            content = "\
            <div class='formbox' id='wdl_formbox'>\
                <h2 class='icon-download'>" + translate("downloadwallet", {
                "currency": currency
            }) + "</h2>\
                <div class='popnotify'></div>\
                <div id='dialogcontent'>" + wallet_ul + fmw + "</div>\
                <div id='backupactions'>\
                    <div class='cancel_dialog customtrigger'>" + cancelbttn + "</div>\
                </div>\
            </div>";
        popdialog(content, "canceldialog");
        if (wallets_arr) {
            const walletlist = $("#formbox_ul"),
                device = getdevicetype(),
                platform = getplatform(device),
                store_icon = platform_icon(platform),
                store_tag = store_icon ? "<img src='" + store_icon + "'/>" : "<span class='icon-download'></span> ";
            $.each(wallets_arr, function(key, value) {
                const device_url = value[platform];
                if (device_url) {
                    const walletname = value.name,
                        website = value.website,
                        wallet_icon = ln ? "<img src='img_logos_btc-lnd.png' class='wallet_icon'/>" : "<img src='" + w_icon(walletname) + "' class='wallet_icon'/>",
                        listitem = "<li><a href='" + website + "' target='_blank' class='exit app_dll'>" + wallet_icon + walletname + "</a><a href='" + device_url + "' target='_blank' class='exit store_tag'>" + store_tag + "</a></li>";
                    walletlist.append(listitem);
                }
            });
        }
    }
}

// Updates the request details in the UI
function updaterequest(ua, save) {
    const requestlist = $("#" + ua.requestid),
        rldata = requestlist.data(),
        metalist = requestlist.find(".metalist");
    if (ua.receivedamount) {
        metalist.find(".receivedamount span").text(" " + trimdecimals(ua.receivedamount, 6));
    }
    if (ua.fiatvalue) {
        metalist.find(".payday.pd_fiat .fiatvalue").text(" " + trimdecimals(ua.fiatvalue, 2));
    }
    if (ua.paymenttimestamp) {
        const fdf = fulldateformat(new Date(ua.paymenttimestamp - glob_timezone), glob_langcode, true);
        metalist.find(".payday.pd_paydate span.paydate").html(" " + fdf);
        metalist.find(".payday.pd_fiat strong span.pd_fiat").html(" " + fdf);
    }
    if (ua.confirmations !== undefined) {
        const meta_status = metalist.find("li.meta_status"),
            set_confirmations = (rldata && rldata.set_confirmations) ? rldata.set_confirmations : 1,
            conftext = (ua.confirmations == 0) ? translate("unconfirmedtx") : ua.confirmations + " / " + set_confirmations + " " + translate("confirmations");
        meta_status.attr("data-conf", ua.confirmations).find(".txli_conf > span").text(conftext);
        const confbar = meta_status.find(".txli_conf > .confbar");
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
        const this_status = ua.status;
        if (this_status !== "archive_pending") { // don't update if status is archive_pending
            requestlist.attr("data-status", this_status);
            metalist.find(".status").text(" " + translate(this_status));
        }
        if (this_status === "paid" || this_status === "archive_pending") {
            if (this_status === "paid") {
                if (glob_inframe === false) {
                    playsound(glob_blip);
                }
                requestlist.addClass("shownotification");
            }
            const transactionlist = requestlist.find(".transactionlist"),
                validtxs = this_status === "archive_pending" ? transactionlist.find("li") : transactionlist.find("li.exceed"); // save all when archiving
            if (validtxs.length > 0) {
                const transactionpush = [];
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
        const amount_short_span = metalist.find(".amountshort");
        if (this_status === "insufficient") {
            const rl_amount = rldata.amount,
                rl_iscrypto = rldata.iscrypto,
                rl_uoa = rldata.uoa,
                amount_short_rounded = amountshort(rl_amount, ua.receivedamount, ua.fiatvalue, rl_iscrypto),
                amount_short_span_text = " (" + amount_short_rounded + " " + rl_uoa.toUpperCase() + " " + translate("amountshort") + ")";
            amount_short_span.text(amount_short_span_text).addClass("show_as");
        } else {
            amount_short_span.removeClass("show_as");
        }
    }
    if (ua.requesttitle) {
        const thisrequesttitle = ua.requesttitle;
        if (thisrequesttitle === "empty") {
            return
        }
        const textinput = (rldata.requesttitle) ? requestlist.find(".atext h2") :
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

// Gets the Monero payment ID
function get_xmrpid() {
    const use_integrated = cs_node("monero", "Integrated addresses", true).selected;
    return use_integrated ? xmr_pid() : false;
}

// Generates an integrated Monero address
function xmr_integrated(xmr_address, pmid) {
    const is_valid = check_pid(pmid);
    if (is_valid) {
        const pahx = cnBase58.decode(xmr_address),
            psk = pahx.slice(2, 66),
            pvk = pahx.slice(66, 130),
            bytes = "13" + psk + pvk + pmid,
            checksum = bytes + fasthash(bytes).slice(0, 8);
        return base58_encode(hextobin(checksum));
    }
    console.log("invalid xmr payment id");
    return xmr_address;
}