//globals
var txid,
    ping,
    pingtx,
    websocket,
    cacheperiodcrypto = 120000, //120000 = 2 minutes
    cacheperiodfiat = 600000, //600000 = 10 minutes
    zeroplaceholder = parseFloat((0.00).toLocaleString(language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })).toFixed(2),
    // Global helpers
    block_swipe,
    sa_timer,
    tx_list,
    payment,
    request;

$(document).ready(function() {
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
    //getccexchangerates
    //initexchangerate
    //get_fiat_exchangerate
    //rendercurrencypool
    //getpayment
    //main_input_focus
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
    switchaddress();
    copyaddress_dblclick();
    copyaddress();
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
});

// ** Swipe payment dialog **

function swipestart() {
    $(document).on("mousedown touchstart", "#paymentdialog", function(e) {
	    blockswipe = false;
	    var thisdialog = $(this),
	    	inputs = thisdialog.find("input");
	    if (inputs.is(":focus")) {
		    blockswipe = true;
	    }
	    var startheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
        startswipetime = $.now();
        swipe(thisdialog.height(), startheight);
    })
}

function swipe(dialogheight, startheight) {
    $(document).on("mousemove touchmove", "#payment", function(e) {
   		if (blockswipe === true) {
	   		var inputs = paymentdialogbox.find("input");
	   		inputs.blur();
	    	return false;
    	}
        var currentheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY,
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
                swipetime = $.now() - startswipetime,
                largeswipe = (percent > 90 || percent < -90),
                smallswipe = (percent > 25 || percent < -25);
            if (largeswipe === true || (smallswipe === true && swipetime < 500)) {
                thisunit.removeClass("swiping");
                paymentdialog.css({
                    "opacity": "",
                    "-webkit-transform": ""
                });
                cancelpaymentdialog();
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
        if (paymentdialogbox.hasClass("norequest") && (paymentdialogbox.attr("data-pending") == "ispending" || (offline === true))) {} else {
            var startwidth = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
            flip($(this).width(), startwidth);
        }
    })
}

function flip(dialogwidth, startwidth) {
    $(document).on("mousemove touchmove", "#payment", function(e) {
        html.addClass("flipmode");
        var currentwidth = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX,
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
                } else {
                    setTimeout(function() {
                        amountinput.focus();
                    }, 300);
                }
            } else {
                setTimeout(function() {
                    requesttitle.attr("placeholder", "eg: " + requesttitle.attr("data-ph" + getrandomnumber(1, 13)));
                    amountinput.focus();
                }, 300);
            }
        } else {
            if (request.iszero_request === true) {
                setTimeout(function() {
                    $("#amountbreak input").focus();
                }, 300);
            }
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
            } else {
                if (requesttitle.val().length < 2) {
                    setTimeout(function() {
                        requesttitle.focus();
                    }, 300);
                } else {
                    var amountinput = $("#amountbreak input");
                    if (amountinput.val().length > 0 && supportsTouch === true) {
                        setTimeout(function() {
                            amountinput.add(requesttitle).add(requestname).blur();
                        }, 300);
                    } else {
                        setTimeout(function() {
                            requesttitle.focus();
                        }, 300);
                    }
                }
            }
        } else {
            if (request.iszero_request === true) {
                setTimeout(function() {
                    $("#paymentdialog #shareamount input:visible:first").focus();
                }, 300);
            }
        }
    }
}

// ** Paymentdialog **

//loadpayment (check for crypto rates)

function loadpaymentfunction(pass) {
    symbolcache = localStorage.getItem("bitrequest_symbols");
    if (symbolcache) {
        var gets = geturlparameters(),
            contactform = (gets.contactform !== undefined);
        if (contactform === true && pass !== true) { // show contactform
            edit_contactform(true);
            return false;
        } else {
            var payment = gets.payment,
                coindata = getcoindata(payment);
            if (coindata) {
                var iserc20 = (coindata.erc20 === true);
                request = {
                        payment: payment,
                        coindata: coindata,
                        erc20: iserc20
                    }, // global request object
                    helper = {};
                helper.contactform = contactform;
                api_attempt["crypto_price_apis"] = {},
                    api_attempt["fiat_price_apis"] = {},
                    socket_attempt = {};
                if (iserc20 === true) {
                    var token_contract = coindata.contract;
                    if (token_contract) {
                        request.token_contract = token_contract;
                        get_tokeninfo(payment, token_contract);
                    } else {
                        var content = "<h2 class='icon-blocked'>Unable to get token data</h2>";
                        popdialog(content, "alert", "canceldialog");
                        closeloader();
                    }
                } else {
                    continue_paymentfunction(payment);
                }
            } else {
                var content = "<h2 class='icon-blocked'>Currency not supported</h2>";
                popdialog(content, "alert", "canceldialog");
                closeloader();
            }
        }
    } else { // need to set fixer API key first
        api_eror_msg("fixer", {
            errormessage: "Missing API key",
            errorcode: "300"
        }, true);
        return false;
    }
}

function get_tokeninfo(payment, contract) {
    var getcache = localStorage.getItem("bitrequest_decimals_" + payment);
    if (getcache) { // check for cached values
        request.decimals = getcache;
        continue_paymentfunction(payment);
    } else {
        loader();
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
            var data = br_result(e).result;
            var error = data.error;
            if (error) {
                cancelpaymentdialog();
                fail_dialogs("ethplorer", error);
                return false;
            } else {
                var decimals = data.decimals;
                request.decimals = decimals;
                continue_paymentfunction(payment);
                localStorage.setItem("bitrequest_decimals_" + payment, decimals); //cache token decimals
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            cancelpaymentdialog();
            var error_object = (errorThrown) ? errorThrown : jqXHR;
            fail_dialogs("ethplorer", error_object);
            closeloader();
        });
    }
}

function continue_paymentfunction(payment) {
    if ($("#request_front").length > 0) { // prevent double load
        return false;
    }
    //set globals
    var erc20 = request.erc20,
        gets = geturlparameters(),
        address = gets.address,
        currencycheck = (erc20 === true) ? "ethereum" : payment,
        valid = check_address(address, currencycheck); // validate address
    if (valid === false) {
        var error_message = (address == "undefined") ? "Undefined address, please ask for a new request" :
            "Invalid " + payment + " address",
            content = "<h2 class='icon-blocked'>" + error_message + "</h2>";
        popdialog(content, "alert", "canceldialog");
        return false;
    }
    loader();
    var coindata = request.coindata,
        saved_coinsettings = JSON.parse(localStorage.getItem("bitrequest_" + payment + "_settings")),
        coinsettings = (saved_coinsettings) ? saved_coinsettings : getcoinsettings(payment),
        uoa = gets.uoa,
        amount = Number(gets.amount),
        type = gets.type,
        data = gets.d,
        isdata = (data && data.length > 5),
        currencysymbol = coindata.ccsymbol,
        isrequest = (localStorage.getItem("bitrequest_editurl") !== window.location.search), // check if url is a request
        requesttype = (isrequest === true) ? (type) ? type : "incoming" : "local",
        iscrypto = (uoa == currencysymbol),
        localcurrency = $("#currencysettings").data("currencysymbol"), // can be changed in (settings)
        fiatcurrency = (iscrypto === true) ? localcurrency : uoa,
        statusparam = gets.status,
        status = (statusparam) ? statusparam : "new",
        paid = (status) ? (status == "paid") ? true : false : null,
        cmcid = coindata.cmcid,
        cpid = currencysymbol + "-" + payment,
        ispending = check_pending(address, cmcid),
        monitored = coindata.monitored,
        pendingparam = gets.pending,
        pending = (pendingparam) ? pendingparam : (monitored === true) ? "incoming" : "unknown",
        socket_list = (coinsettings) ? coinsettings.websockets : null,
        selected_socket = (socket_list) ? (socket_list.selected) ? socket_list.selected : null : null,
        dataobject = (isdata === true) ? JSON.parse(atob(data)) : null, // decode data param if exists
        requesttimestamp = (dataobject && dataobject.ts) ? dataobject.ts : null,
        requestname = (dataobject && dataobject.n) ? dataobject.n : null,
        requesttitle = (dataobject && dataobject.t) ? dataobject.t : null,
        current_conf = (coinsettings) ? coinsettings.confirmations : null,
        no_conf = (!current_conf || monitored === false),
        set_confirmations = (dataobject && dataobject.c) ? parseFloat(dataobject.c) : (no_conf === true) ? 0 : current_conf.selected,
        instant = (!set_confirmations),
        pagenameccparam = (iscrypto === true) ? "" : payment + " ",
        pagename = (requestname) ? requestname + " sent a " + pagenameccparam + "payment request of " + amount + " " + uoa + " for " + requesttitle : pagenameccparam + "payment request for " + amount + " " + uoa,
        requestclass = (isrequest === true) ? "request" : "norequest"; //set classnames for request
    iszero = (amount === 0 || isNaN(amount)),
        iszero_request = (isrequest === true && iszero === true),
        iszeroclass = (iszero_request === true) ? " iszero" : "",
        showclass = (iscrypto === true) ? (uoa == "btc") ? " showsat showlc showcc" : " showlc showcc" : (uoa == fiatcurrency) ? "" : " showlc",
        statusclass = (status) ? " " + status : " unknown",
        satclass = (payment == "bitcoin" && $("#bitcoin_settings .cc_settinglist li[data-id='showsatoshis']").data("selected") === true) ? true : false,
        typeclass = " " + requesttype,
        offlineclass = (offline === true) ? " br_offline" : "",
        pendingclass = (ispending === true && monitored === true && requesttype == "local") ? "ispending" : "",
        extend_data = {
            uoa: uoa,
            amount: amount,
            address: address,
            currencysymbol: currencysymbol,
            cmcid: cmcid,
            cpid: cpid,
            status: status,
            pending: pending,
            paid: paid,
            isrequest: isrequest,
            requesttype: requesttype,
            iscrypto: iscrypto,
            localcurrency: localcurrency,
            fiatcurrency: fiatcurrency,
            requestname: requestname,
            requesttitle: requesttitle,
            set_confirmations: set_confirmations,
            no_conf: no_conf,
            instant: instant,
            shared: (isrequest === true && requesttimestamp !== null), // check if request is from a shared source,
            iszero: iszero,
            iszero_request: iszero_request,
            monitored: monitored
        },
        extend_helper_data = {
            socket_list: socket_list,
            selected_socket: selected_socket,
            requestclass: requestclass,
            iszeroclass: iszeroclass,
            currencylistitem: $("#currencylist > li[data-currency='" + payment + "'] .rq_icon"),
        },
        payment_attributes = {
            "data-cmcid": cmcid,
            "data-currencysymbol": currencysymbol,
            "data-status": statusclass,
            "data-showsat": satclass,
            "data-pending": pendingclass,
            "class": requestclass + statusclass + showclass + typeclass + offlineclass + iszeroclass
        };
    settitle(pagename + " | " + apptitle);
    paymentdialogbox.append("<div id='request_back' class='share_request dialogstyle'></div><div id='request_front' class='dialogstyle'><div id='xratestats'></div></div>").attr(payment_attributes);
    // Extend global request object
    $.extend(request, extend_data);
    // Extend global helper object
    $.extend(helper, extend_helper_data);
    if (isrequest === true) {
        add_flip();
    }
    if (offline === true) { // no price conversion when app is offline
        rendercurrencypool({
            "EUR": 1,
            "USD": 1.095063
        }, 0.025661699261756998, "coinmarketcap", "fixer", 0, 0);
    } else {
        var ccapi = $("#cmcapisettings").data("selected"),
            apilist = "crypto_price_apis";
        getcache = sessionStorage.getItem("bitrequest_xrates_" + currencysymbol);
        if (getcache) { //check for cached crypto rates in localstorage
            var timestamp = $.now(),
                parsevalue = JSON.parse(getcache),
                cachedtimestamp = parsevalue.timestamp,
                thisusdrate = parsevalue.ccrate,
                apisrc = parsevalue.apisrc,
                cachetime = timestamp - cachedtimestamp;
            if (cachetime > cacheperiodcrypto) { //check if cached crypto rates are expired
                getccexchangerates(apilist, ccapi);
            } else { //fetch cache
                loadertext("reading " + currencysymbol + " rate from cache");
                initexchangerate(thisusdrate, apisrc, cachetime); //check for fiat rates and pass usd amount
            }
        } else {
            getccexchangerates(apilist, ccapi);
        }
    }

    //getccexchangerate
    //getccexchangerates
    //initexchangerate
    //get_fiat_exchangerate
    //next_fiat_api
    //rendercurrencypool
    //getpayment

    //get crypto rates
    function getccexchangerates(apilist, api) {
        api_attempt[apilist][api] = true;
        loadertext("get " + currencysymbol + " rates from " + api);
        var payload = (api == "coinmarketcap") ? "cryptocurrency/quotes/latest?id=" + cmcid :
            (api == "coinpaprika") ? currencysymbol + "-" + payment :
            (api == "coingecko") ? (erc20 === true) ? "simple/token_price/ethereum?contract_addresses=" + request.token_contract + "&vs_currencies=usd" : "simple/price?ids=" + payment + "&vs_currencies=usd" :
            false;
        if (payload === false) {
            loadertext("api error");
            closeloader();
            cancelpaymentdialog();
            fail_dialogs(api, "Crypto price API not defined");
        } else {
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
                var data = br_result(e).result,
                    status = data.status,
                    has_error = (
                        (data.statusCode == 404) ||
                        (data.error) ||
                        (status && status.error_message)
                    );
                if (has_error) {
                    var nextccapi = try_next_api(apilist, api);
                    if (nextccapi === false) {
                        var error_val = (data.error) ? data.error : "Unable to get " + payment + " Exchangerate";
                        loadertext("api error");
                        closeloader();
                        cancelpaymentdialog();
                        fail_dialogs(api, data.error);
                    } else {
                        getccexchangerates(apilist, nextccapi);
                    }
                    return false;
                } else {
                    var ccrate = (api == "coinmarketcap") ? data.data[cmcid].quote.USD.price :
                        (api == "coinpaprika") ? data.quotes.USD.price :
                        (api == "coingecko") ? data[Object.keys(data)[0]].usd :
                        null;
                    if (ccrate) {
                        loadertext("success");
                        var timestamp = $.now(),
                            ccratearray = {};
                        ccratearray.timestamp = timestamp;
                        ccratearray.ccrate = ccrate;
                        ccratearray.apisrc = api;
                        var storeccratestring = JSON.stringify(ccratearray);
                        sessionStorage.setItem("bitrequest_xrates_" + currencysymbol, storeccratestring); //cache crypto rates in sessionstorage
                        initexchangerate(ccrate, api, 0); //pass usd amount, check for fiat rates
                    } else {
                        var nextccapi = try_next_api(apilist, api);
                        if (nextccapi === false) {
                            loadertext("api error");
                            closeloader();
                            cancelpaymentdialog();
                            fail_dialogs(api, "unable to get " + payment + " rate");
                        } else {
                            getccexchangerates(apilist, nextccapi);
                        }
                        return false;
                    }
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                var nextccapi = try_next_api(apilist, api);
                if (nextccapi === false) {
                    loadertext("failed");
                    closeloader();
                    cancelpaymentdialog();
                    var error_object = (errorThrown) ? errorThrown : jqXHR;
                    fail_dialogs(api, error_object);
                } else {
                    getccexchangerates(apilist, nextccapi);
                }
                return false;
            });
        }
    }

    function initexchangerate(cc_rate, ccapi, cachetime) {
        loadertext("get fiat rates");
        var ccrate = 1 / cc_rate,
            timestamp = $.now(),
            newcurrency = (fiatcurrency != localcurrency && fiatcurrency != "eur" && fiatcurrency != "usd" && fiatcurrency != currencysymbol), //check if currency request is other then usd, eur or localcurrency
            localcurrencyparam = (localcurrency == "usd" || localcurrency == "btc") ? "usd,eur" :
            (localcurrency == "eur") ? "eur,usd" :
            localcurrency + ",usd,eur", // set correct local currency / prevent btc
            newcurrencyparam = (newcurrency === true) ? "," + fiatcurrency : "",
            currencystring = localcurrencyparam + newcurrencyparam,
            currenciesstring = currencysymbol + "," + currencystring,
            currencycache = sessionStorage.getItem("bitrequest_exchangerates"),
            fiatapi = $("#fiatapisettings").data("selected"),
            apilist = "fiat_price_apis";
        helper.currencyarray = currenciesstring.split(",");
        if (currencycache) { //check if cache exists
            var parsevalue = JSON.parse(currencycache),
                xratesnode = parsevalue.fiat_exchangerates,
                thisrate = xratesnode[fiatcurrency];
            if (thisrate) { //check if currency is in cache
                var xratetimestamp = parsevalue.timestamp,
                    timeexpired = timestamp - xratetimestamp,
                    lcrate = xratesnode[fiatcurrency];
                if (timeexpired > cacheperiodfiat || lcrate === undefined) { //check if cache is expired and if fiatcurrency is cached
                    get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime);
                } else { //fetch cached exchange rates
                    loadertext("reading fiat rates from cache");
                    rendercurrencypool(xratesnode, ccrate, ccapi, parsevalue.api, cachetime, timeexpired)
                }
            } else {
                get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime);
            }
        } else {
            get_fiat_exchangerate(apilist, fiatapi, ccrate, currencystring, ccapi, cachetime);
        }
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
            false;
        if (payload === false) {
            loadertext("error");
            closeloader();
            cancelpaymentdialog();
            fail_dialogs(fiatapi, "Fiat price API not defined");
            return false;
        } else {
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
                    null;
                if (ratesnode) {
                    loadertext("success");
                    var localupper = fiatcurrency.toUpperCase(),
                        rates = {
                            "eur": 1
                        },
                        usdval,
                        localval;
                    if (fiatapi == "fixer") {
                        var usdval = ratesnode.USD,
                            localval = ratesnode[localupper];
                    } else if (fiatapi == "coingecko") {
                        if (ratesnode[fiatcurrency]) {
                            var eurval = ratesnode.eur.value,
                                usdval = ratesnode.usd.value / eurval,
                                localval = ratesnode[fiatcurrency].value / eurval;
                        } else {
                            var error_object = fiatcurrency + " exchangerates not available from " + fiatapi;
                            next_fiat_api(apilist, fiatapi, error_object, ccrate, currencystring, ccapi, cachetime);
                            return false;
                        }
                    } else if (fiatapi == "exchangeratesapi") {
                        if (ratesnode[localupper]) {
                            var usdval = ratesnode.USD,
                                localval = (localupper == "EUR") ? 1 : ratesnode[localupper];
                        } else {
                            var error_object = localupper + " exchangerates not available from " + fiatapi;
                            next_fiat_api(apilist, fiatapi, error_object, ccrate, currencystring, ccapi, cachetime);
                            return false;
                        }
                    } else if (fiatapi == "currencylayer") {
                        if (ratesnode["USD" + localupper]) {
                            var usdval = 1 / ratesnode.USDEUR,
                                localval = ratesnode["USD" + localupper] * usdval;
                        } else {
                            var error_object = localupper + " exchangerates not available from " + fiatapi;
                            next_fiat_api(apilist, fiatapi, error_object, ccrate, currencystring, ccapi, cachetime);
                            return false;
                        }
                    } else {
                        loadertext("error");
                        closeloader();
                        cancelpaymentdialog();
                        fail_dialogs(false, fiatapi, "Fiat price API not defined");
                        return false;
                    }
                    if (localval && usdval) {
                        rates.usd = usdval;
                        if (fiatcurrency == "eur" || fiatcurrency == "usd" || fiatcurrency == "btc") {} else {
                            rates[fiatcurrency] = localval;
                        }
                        rendercurrencypool(rates, ccrate, ccapi, fiatapi, cachetime, "0"); // rendere exchangerates
                        // cache exchange rates
                        var xratesettings = {};
                        xratesettings.timestamp = $.now();
                        xratesettings.fiat_exchangerates = rates;
                        xratesettings.api = fiatapi;
                        var xratestring = JSON.stringify(xratesettings);
                        sessionStorage.setItem("bitrequest_exchangerates", xratestring);
                    } else {
                        var nextfiatapi = try_next_api(apilist, fiatapi);
                        if (nextfiatapi === false) {
                            loadertext("error");
                            closeloader();
                            cancelpaymentdialog();
                            fail_dialogs(fiatapi, "Failed to load data from " + fiatapi);
                        } else {
                            get_fiat_exchangerate(apilist, nextfiatapi, ccrate, currencystring, ccapi, cachetime);
                        }
                        return false;
                    }
                } else {
                    var nextfiatapi = try_next_api(apilist, fiatapi);
                    if (nextfiatapi === false) {
                        loadertext("error");
                        closeloader();
                        cancelpaymentdialog();
                        var errorcode = (data.error) ? data.error : "Failed to load data from " + fiatapi;
                        fail_dialogs(fiatapi, errorcode);
                    } else {
                        get_fiat_exchangerate(apilist, nextfiatapi, ccrate, currencystring, ccapi, cachetime);
                    }
                    return false;
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                var error_object = (errorThrown) ? errorThrown : jqXHR;
                next_fiat_api(apilist, fiatapi, error_object, ccrate, currencystring, ccapi, cachetime);
                return false;
            });
        }
    }

    function next_fiat_api(apilist, fiatapi, error_object, ccrate, currencystring, ccapi, cachetime) {
        var nextfiatapi = try_next_api(apilist, fiatapi);
        if (nextfiatapi === false) {
            loadertext("error");
            closeloader();
            cancelpaymentdialog();
            fail_dialogs(fiatapi, error_object);
        } else {
            get_fiat_exchangerate(apilist, nextfiatapi, ccrate, currencystring, ccapi, cachetime);
        }
    }

    function rendercurrencypool(data, ccrate, ccapi, fiatapi, cachetimecrypto, cachetimefiat) {
        xrates_array = [];
        var usdrate = data.usd, //cryptocurrency rate is in dollar, needs to be converted to euro
            ccrateeuro = ccrate * usdrate,
            currentrate = (iscrypto === true) ? ccrateeuro : data[fiatcurrency],
            fiatapiurl = (fiatapi == "fixer") ? "fixer.io" :
            (fiatapi == "coingecko") ? "coingecko.com" :
            (fiatapi == "exchangeratesapi") ? "exchangeratesapi.io" :
            (fiatapi == "currencylayer") ? "currencylayer.com" :
            null,
            xratedata1 = "<div data-currency='" + currencysymbol + "' data-value='' data-xrate='" + ccrateeuro + "' class='cpool ccpool' data-currencyname='" + payment + "'><span>" + ccapi + ": <span class='ratesspan'>" + currencysymbol + "_" + uoa + ": " + (1 / (ccrateeuro / currentrate)).toFixed(8) + "</span></span></div><div class='cachetime'> (" + (cachetimecrypto / 60000).toFixed(1) + " of " + (cacheperiodcrypto / 60000).toFixed(0) + " min. in cache)</div><br/><div class='mainrate'>" + fiatapiurl + ": </div>",
            xratedata2 = [],
            parsedsymbols = JSON.parse(symbolcache);
        xrates_array.push({
            currency: currencysymbol,
            xrate: ccrateeuro,
            currencyname: payment
        })
        $.each(data, function(thiscurrency, rate) {
            var parsedrate = (rate / currentrate).toFixed(6) / 1,
                ratesspanclass = (parsedrate === 1) ? " hide" : "",
                currencyname = parsedsymbols[thiscurrency.toUpperCase()],
                xratedatarray = "<div data-currency='" + thiscurrency + "' data-value='' data-xrate='" + rate + "' class='cpool' data-currencyname='" + currencyname + "'><span class='ratesspan" + ratesspanclass + "'>" + uoa + "_" + thiscurrency + ": " + parsedrate + "</span></div>";
            xratedata2.push(xratedatarray);
            xrates_array.push({
                currency: thiscurrency,
                xrate: rate,
                currencyname: currencyname
            });
        });
        helper.xrates = xrates_array;
        $("#xratestats").append(xratedata1 + xratedata2.join(" | ") + "<div class='cachetime'> (" + (cachetimefiat / 60000).toFixed(1) + " of " + (cacheperiodfiat / 60000).toFixed(0) + " min. in cache)</div>");
        getpayment(ccrateeuro, ccapi);
    }

    function getpayment(ccrateeuro, ccapi) {
        closeloader();
        var currencypoolnode = $("#paymentdialog .cpool[data-currency='" + uoa + "']"),
            currencyname = currencypoolnode.attr("data-currencyname"),
            fiatcurrencypoolnode = $("#paymentdialog .cpool[data-currency='" + fiatcurrency + "']"),
            fiatcurrencyname = fiatcurrencypoolnode.attr("data-currencyname");
        localcurrencypoolnode = $("#paymentdialog .cpool[data-currency='" + localcurrency + "']"),
            localcurrencyname = localcurrencypoolnode.attr("data-currencyname");
        // extend global request object
        request.currencyname = currencyname,
            request.fiatcurrencyname = fiatcurrencyname;
        request.localcurrencyname = localcurrencyname;
        // continue vars
        var currencyxrate = currencypoolnode.attr("data-xrate"),
            fiatcurrencyrate = fiatcurrencypoolnode.attr("data-xrate"),
            rn_set = (requestname && requestname.length > 1), // check if requestname is set
            rt_set = (requesttitle && requesttitle.length > 1), // check if requesttitle is set
            requesttitle_string = (rt_set === true) ? requesttitle : "",
            pobox = $("main #" + payment + " .content ul.pobox[data-currency='" + payment + "']"),
            savedaddressli = pobox.find("li[data-address='" + address + "']"),
            labelvalue = (savedaddressli.length > 0) ? "<span id='labelbttn'>" + savedaddressli.data("label") + "</span>" : "", // check if address is saved
            thiscurrencyvalueraw = ((amount / currencyxrate) * ccrateeuro),
            thiscurrencyvaluefixed = parseFloat(thiscurrencyvalueraw.toFixed(5)),
            thiscurrencyvaluefixedplaceholder = (iszero === true) ? zeroplaceholder : thiscurrencyvaluefixed,
            thiscurrencyvaluefixedvar = (iszero === true) ? "" : thiscurrencyvaluefixed,
            satamount = (thiscurrencyvalueraw * 100000000).toFixed(0),
            fiatcurrencyvalue = ((amount / currencyxrate) * fiatcurrencyrate).toFixed(2),
            fiatcurrencyvaluevar = (iszero === true) ? "" : fiatcurrencyvalue,
            cryptosteps = "0.00001",
            fiatsteps = "0.1",
            steps = (iscrypto === true) ? cryptosteps : fiatsteps,
            placeholder = (iszero === true) ? zeroplaceholder : amount,
            valueplaceholder = (iszero === true) ? "" : amount,
            satplaceholder = (iszero === true) ? "000000000" : satamount,
            satamountvar = (iszero === true) ? "" : satamount,
            currencynamestring = (currencyname == "Euro") ? "" : (iscrypto === true) ? fiatcurrencyname : currencyname,
            ccamounttext = "(" + thiscurrencyvaluefixedvar + " " + payment + ")",
            sharebuttonclass = (rn_set === true && rt_set === true) ? " sbactive" : "",
            cryptologo = getcc_icon(cmcid, cpid, erc20),
            sharebutton = "<div class='button" + sharebuttonclass + "' id='sharebutton'><span class='icon-share2'>Share request</span></div>",
            initrequestname = (rn_set === true) ? requestname : $("#accountsettings").data("selected"),
            sharetitle_exceed = (requesttitle && requesttitle.length > 65),
            exceedclass = (sharetitle_exceed === true) ? "title_exceed" : "",
            requesttitle_short = (sharetitle_exceed === true) ? requesttitle.substring(0, 44) + "<span>...</span>" : requesttitle,
            requesttitle_quotes = (requesttitle && requesttitle.length > 1) ? "'" + requesttitle_short + "'" : "",
            backbttnandtitle = (isrequest === true) ? "<div id='sharetitle' title='" + requesttitle_string + "' data-shorttitle='" + requesttitle_short + "' class='" + exceedclass + "'>" + requesttitle_quotes + "</div>" : "",
            requestinfo = "\
				<div id='requestinfo'>" +
            backbttnandtitle +
            "<div id='shareamount' class='inputbreak'>\
						<span id='sharecryptowrap'>" + cryptologo +
            "<span id='sharemainccinputmirror' class='ccmirror mirrordiv'>\
								<span>" + thiscurrencyvaluefixedplaceholder + "</span>\
								<input value='" + thiscurrencyvaluefixedvar + "' step='" + cryptosteps + "' type='number' placeholder='" + zeroplaceholder + "'/>\
							</span>\
						</span>\
						<span id='shareinputmirror' class='fmirror mirrordiv'>\
							<span>" + placeholder + "</span>\
							<input value='" + valueplaceholder + "' step='" + steps + "' type='number' placeholder='" + zeroplaceholder + "'/>\
						</span>\
						<span id='sharecurrency'>" + uoa + "</span>\
					</div>\
					<div id='currencynamebox'>\
						<span id='currencyname' data-currencyname='" + currencynamestring + "'>\
							<span class='quote'>(</span>\
							<span id='sharelcinputmirror' class='lcmirror mirrordiv'>\
							<span>" + fiatcurrencyvalue + "</span>\
							<input value='" + fiatcurrencyvaluevar + "' step='" + steps + "' type='number' placeholder='" + zeroplaceholder + "'/>\
						</span>\
						<span id='sharelcname'>" + currencynamestring + "</span>\
						<span class='quote'>)</span>\
						</span>\
					</div>\
					<div id='ccamountbox'>\
						<span id='ccamount'>(" + cryptologo +
            "<span id='shareccinputmirror' class='ccmirror mirrordiv'>\
								<span>" +
            thiscurrencyvaluefixedplaceholder +
            "</span>\
								<input value='" + thiscurrencyvaluefixedvar + "' step='" + cryptosteps + "' type='number' placeholder='" + zeroplaceholder + "'/>\
							</span> " +
            payment + ")\
						</span>\
					</div>\
				</div>",
            status_text = (paid === true) ? (requesttype == "outgoing") ? "Payment received" : "Payment sent" : "Transaction broadcasted",
            conf_section = (instant === true) ? "" : "<span id='statusbox'>Waiting for <span id='confnumber'></span> confirmations </span><span class='confbox'><span data-conf='0'>0</span> confirmations</span>",
            brstatuspanel = "\
				<div class='brstatuspanel'>\
					<img src='img/confirmed.png'/>\
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
						<span id='view_tx'>View transaction</span>\
					</p>\
				</div>",
            shareform = "\
				<div id='shareformbox'>\
					<div id='shareformib' class='inputbreak'>\
						<form id='shareform' disabled='' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='off'>\
							<label>What's your name?<input type='text' placeholder='Name' id='requestname' value='" + initrequestname + "' autocomplete='false'></label>\
							<label>What's it for?<input type='text' placeholder='eg:  lunch  🥪' id='requesttitle' value='" + requesttitle_string + "' data-ph1=' festival tickets' data-ph2=' coffee  ☕' data-ph3=' present  🎁' data-ph4=' snowboarding  🏂' data-ph5=' movie theater  📽️' data-ph6=' lunch  🥪' data-ph7=' shopping  🛒' data-ph8=' video game  🎮' data-ph9=' coke  🥤' data-ph10=' concert tickets  🎵' data-ph11=' camping  ⛺' data-ph12=' taxi  🚕' data-ph13=' zoo  🦒'></label>\
						</form>\
					</div>\
					<div id='sharebox' class='inputbreak'>" + sharebutton + "</div>\
				</div>",
            requestnamestring = (requesttype === "outgoing") ? "" : (rn_set === true) ? "To " + requestname + ":" : "",
            paymethods = "\
				<div id='paymethods'>\
					<p id='requestnamep'>" + requestnamestring + "</p>\
					<div id='scanqrib' class='inputbreak'>\
						<div class='button' id='scanqr'>\
							<span class='icon-qrcode'>Scan qr-code</span>\
						</div><br/>\
						<div class='button openwallet' id='openwallet' data-currency='" + payment + "'><span class='icon-folder-open'>Open wallet</span></div>\
					</div>\
				</div>",
            poweredby = "<div class='poweredby'>Powered by: <a href='https://www.bitrequest.io' target='_blank'>Bitrequest</a></div>",
            bottomcard = (isrequest === true) ? paymethods : shareform;
        $("#request_front").prepend("<div id='cl_wrap'>" + cryptologo + "</div>\
			<div class='actionbar clearfix'>\
				<div id='sharerequest' class='abl icon-share2 sbactive'>Share request</div><div class='openwallet abr icon-folder-open' data-currency='" + payment + "'>Open wallet</div>\
			</div>\
			<div id='qrwrap' class='flex'>\
				<div id='qrcode'>\
					<canvas width='256' height='256'></canvas>\
				</div>" + cryptologo + brstatuspanel + "\
			</div>\
			<div id='popform' data-payment='" + payment + "' data-currency='" + uoa + "' data-address='" + address + "' data-lcrate='" + fiatcurrencyrate + "'>\
				<div id='rf_wrap'>\
					<div id='amountbreak' class='inputbreak'>\
						<span id='mainccinputmirror' class='ccmirror mirrordiv'>\
							<span>" + thiscurrencyvaluefixedplaceholder + "</span>\
							<input value='" + thiscurrencyvaluefixedvar + "' data-xrate='" + ccrateeuro + "' step='" + cryptosteps + "' type='number' placeholder='" + zeroplaceholder + "'>\
						</span>\
						<span id='amountinputmirror' class='fmirror mirrordiv'>\
							<span>" + placeholder + "</span>\
							<input value='" + valueplaceholder + "' data-xrate='" + currencyxrate + "' step='" + fiatsteps + "' type='number' placeholder='" + zeroplaceholder + "'>\
						</span>\
						<span id='pickcurrency'>" + uoa + "</span>\
					</div>\
					<div id='ibsat' class='inputbreak'>\
						<span id='satinputmirror' class='mirrordiv'>\
							<span>" + satplaceholder + "</span>\
							<input class='satinput' value='" + satamountvar + "' data-xrate='" + ccrateeuro + "' max='10000000000000' type='number' placeholder='000000000'/>\
						</span> satoshis\
					</div>\
					<div id='iblc' class='inputbreak'>\
						(<span id='lcinputmirror' class='lcmirror mirrordiv'>\
							<span>" + fiatcurrencyvalue + "</span>\
							<input value='" + fiatcurrencyvaluevar + "' data-xrate='" + fiatcurrencyrate + "' step='" + fiatsteps + "' type='number' placeholder='" + zeroplaceholder + "'/>\
						</span> " + fiatcurrency + ") \
					</div>\
					<div id='txibreak' class='inputbreak'> Send <span id='ccinputmirror' class='ccmirror mirrordiv'><span>" + thiscurrencyvaluefixedplaceholder + "</span><input value='" + thiscurrencyvaluefixedvar + "' data-xrate='" + ccrateeuro + "' step='" + cryptosteps + "' type='number' placeholder='" + zeroplaceholder + "'/></span> " + currencysymbol + " to" + labelvalue + ": </div>\
				</div>\
				<div id='paymentaddress' class='copyinput' data-type='address'>" + address + "</div>\
			</div>\
			<div id='apisrc'>src: " + ccapi + "</div>" + poweredby);
        paymentdialogbox.find("#request_back").html("\
			<div class='actionbar clearfix'></div>\
			<div id='backwraptop' class='flex'>" + requestinfo + "</div>\
			<div id='backwrapbottom' class='flex'>" + bottomcard + brstatuspanel + "</div>" + poweredby);
        scrollposition = $(document).scrollTop(); // get scrollposition save as global
        fixedcheck(scrollposition); // fix nav position
        html.addClass("paymode blurmain_payment");
        $(".showmain #mainwrap").css("-webkit-transform", "translate(0, -" + scrollposition + "px)"); // fake scroll position
        paymentpopup.addClass("showpu active");
        rendercpool(amount, currencyxrate);
        renderqr(payment, address, $("#paymentdialogbox .ccpool").attr("data-value"));
        if (isrequest === true) { // check for incoming requests
            if (helper.contactform === true) { // indicates if it's a online payment so not an incoming request
            } else {
                if (iszero === true) {
                    main_input_focus();
                }
                var save_request = saverequest("init");
            }
        } else {
            main_input_focus();
        }
        if (save_request == "nosocket") {} else {
            init_socket(selected_socket, address);
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
    }
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

function pickcurrency() {
    $(document).on("click touch", "#paymentdialogbox #pickcurrency", function() {
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
            history.replaceState("home", null, href);
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
        deter = (paymentdialogbox.hasClass("showcc")) ? 5 : 2,
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
    var ccvalue = (thisamount.length === 0) ? zeroplaceholder : (fieldtype == "crypto") ? thisamount.toFixed(5) : cryptovalue(thisamount, thisrate);
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
    return parseFloat(((thisamount / thisrate) * $("#paymentdialogbox .ccpool").attr("data-xrate")).toFixed(5));
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
    });
}

function updatecpool(thisamount, thisrate, ccvalue) {
    rendercpool(thisamount, thisrate);
    var gets = geturlparameters(),
        payment = gets.payment,
        page = gets.p,
        currency = gets.uoa,
        address = gets.address,
        data = (gets.d) ? "&d=" + gets.d : "",
        starturl = (page) ? "?p=" + page + "&payment=" : "?payment=",
        href = starturl + payment + "&uoa=" + currency + "&amount=" + thisamount + "&address=" + address + data,
        pagename = payment + " request for " + thisamount + " " + currency,
        title = pagename + " | " + apptitle;
    renderqr(payment, address, ccvalue);
    if (request.iszero_request === true) {} else {
        history.replaceState(null, null, href);
        helper.currencylistitem.data("url", href);
        request.amount = thisamount;
        set_edit(href);
        settitle(title);
    }
}

function rendercpool(thisamount, thisrate) {
    $("#paymentdialog .cpool").each(function() {
        var thisnode = $(this),
            thisnodeval = parseFloat((thisamount / thisrate) * thisnode.attr("data-xrate")),
            deter = (thisnode.hasClass("ccpool")) ? thisnodeval.toFixed(6) : thisnodeval.toFixed(2);
        thisnode.attr("data-value", deter);
    });
}

function renderqr(payment, address, amount) {
    var number = Number(amount),
        this_iszero = (number === 0 || isNaN(number)),
        urlscheme;
    if (request.erc20 === true) {
        var raw_amount = amount * Math.pow(10, request.decimals);
        urlscheme = "ethereum:" + request.token_contract + "/transfer?address=" + address + "&uint256=" + raw_amount.toFixedSpecial(0);
        //urlscheme = "ethereum:" + request.token_contract + "/transfer?address=" + address + "&uint256=" + raw_amount + "&gas=43855";
    } else {
        urlscheme = request.coindata.urlscheme(payment, address, amount, this_iszero);
    }
    $("#qrcode").html("").qrcode(urlscheme);
    $(".openwallet").attr("data-rel", urlscheme);
}

function switchaddress() {
    $(document).on("click touch", "#paymentdialogbox.norequest #labelbttn", function() {
        var timelapsed = $.now() - sa_timer;
        if (timelapsed < 1500) { // prevent clicking too fast
            playsound(funk);
        } else {
            var gets = geturlparameters(),
                payment = gets.payment,
                thishasbip = (hasbip === true && (getbip32dat(payment).active === true));
            if (thishasbip === true) {
                playsound(funk);
                //return false;
            }
            var data = (gets.d && gets.d.length > 5) ? "&d=" + gets.d : "",
                currentaddress = gets.address,
                nextaddress = newaddresli(payment, currentaddress);
            if (nextaddress) {
                var newaddress = nextaddress.data("address"),
                    newaddressid = nextaddress.data("cmcid"),
                    newaddresslabel = nextaddress.data("label"),
                    page = gets.p,
                    starturl = (page) ? "?p=" + page + "&payment=" : "?payment=",
                    href = starturl + payment + "&uoa=" + gets.uoa + "&amount=" + gets.amount + "&address=" + newaddress + data,
                    ccvalue = $("#paymentdialogbox .ccpool").attr("data-value"),
                    selected_socket = helper.selected_socket;
                renderqr(payment, newaddress, ccvalue);
                history.replaceState(null, null, href);
                set_edit(href);
                init_socket(selected_socket, newaddress);
                $("#paymentaddress").text(newaddress);
                $(this).text(newaddresslabel);
                var ispending = check_pending(newaddress, newaddressid);
                if (ispending === true && request.monitored === true) {
                    paymentdialogbox.attr("data-pending", "ispending"); // prevent share because of pending transaction
                } else {
                    paymentdialogbox.attr("data-pending", "");
                }
                request.address = newaddress;
                sa_timer = $.now();
            }
        }
    });
}

function newaddresli(currency, address) {
    var add_li = filter_addressli(currency, "checked", true),
        c_adli = filter_addressli(currency, "address", address);
    nextaddressli = c_adli.next(".adli[data-checked='true']"),
        firstaddressli = add_li.not(".adli[data-address='" + address + "']").first();
    if (firstaddressli.length === 0) {
        return false;
    } else {
        return (nextaddressli.length) ? nextaddressli : firstaddressli;
    }
}

function copyaddress_dblclick() {
    $(document).on("dblclick", "#paymentaddress", function() {
        notify("<span id='copyaddress'>Copy address?</span>", 40000, "yes");
    });
}

function copyaddress() {
    $(document).on("click touch", "#copyaddress", function() {
        var copycontent = $("#paymentaddress").text();
        copytoclipboard(copycontent, "address");
    });
}

function validaterequestdata(requestname_val, requesttitle_val) {
    var valid = (requestname_val === undefined) ? false : (requestname_val.length > 2 && requesttitle_val.length > 1) ? true : false,
        sharebutton = $("#sharebutton"),
        gets = geturlparameters(),
        page = gets.p,
        payment = gets.payment,
        currency = gets.uoa,
        amount = gets.amount,
        address = gets.address,
        starturl = (page) ? "?p=" + page + "&payment=" : "?payment=",
        currenturl = starturl + payment + "&uoa=" + currency + "&amount=" + amount + "&address=" + address,
        newurl;
    if (valid === true) {
        var utc = $.now() + timezone, // UTC
            no_conf = request.no_conf,
            dataobject = {};
        dataobject.ts = utc,
            dataobject.n = requestname_val,
            dataobject.t = requesttitle_val;
        if (no_conf === false) {
            dataobject.c = request.set_confirmations;
        }
        var newurl = currenturl + "&d=" + btoa(JSON.stringify(dataobject));
        request.requestname = requestname_val,
            request.requesttitle = requesttitle_val;
        sharebutton.addClass("sbactive");
    } else {
        var newurl = currenturl;
        sharebutton.removeClass("sbactive");
    }
    history.replaceState(null, null, newurl);
    helper.currencylistitem.data("url", newurl);
    set_edit(newurl);
}

function inputrequestdata() {
    $(document).on("input", "#shareform input", function() {
        validaterequestdata($("input#requestname").val(), $("input#requesttitle").val());
    });
}

function validatesteps() {
    $(document).on("keydown", "#paymentdialogbox .mirrordiv input", function(e) {
        var thisnode = $(this),
            thisvalue = thisnode.val(),
            keycode = e.keyCode;
        if ((thisvalue.indexOf(",") > -1 || thisvalue.indexOf(".") > -1) && (keycode === 188 || keycode === 190)) { // prevent double commas and dots
            e.preventDefault();
            return false;
        } else {
            if (keycode === 8 || keycode === 188 || keycode === 190 || keycode === 39 || keycode === 37 || keycode === 91 || keycode === 17 || e.metaKey || e.ctrlKey) { //alow backspace, comma and period, arrowright, arrowleft, command, ctrl
                if (thisnode.hasClass("satinput")) {
                    if (keycode === 188 || keycode === 190) { //disallow period and comma
                        e.preventDefault();
                    }
                }
            } else {
                if (keycode > 47 && keycode < 58) { //only allow numbers
                    if (e.target.validity.valid) { //test input patern and steps attribustes
                    } else {
                        if (document.getSelection().toString().replace(",", ".") !== thisvalue.replace(",", ".")) {
                            e.preventDefault();
                        }
                    }
                } else {
                    e.preventDefault();
                }
            }
        }
    })
}

function fliprequest() {
    $(document).on("click touch", "#paymentdialogbox.norequest #sharerequest", function(e) {
        e.preventDefault();
        if (paymentdialogbox.attr("data-pending") == "ispending") {
            pendingrequest();
        } else if (offline === true) {
            return false;
        } else {
            flip_right1();
        }
    });
}

function revealtitle() {
    $(document).on("click touch", "#paymentdialogbox.request #sharetitle.title_exceed", function(e) {
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
    popdialog(content, "alert", "triggersubmit");
}

function view_pending_tx() {
    $(document).on("click touch", "#view_pending_tx", function() {
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
    $(document).on("click touch", "#addresslock #pending_pick_address", function(e) {
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
                data = (gets.d && gets.d.length > 5) ? "&d=" + gets.d : "",
                starturl = (page) ? "?p=" + page + "&payment=" : "?payment=",
                href = starturl + payment + "&uoa=" + currency + "&amount=" + amount + "&address=" + picked_address + data,
                ccvalue = $("#paymentdialogbox .ccpool").attr("data-value");
            $("#paymentaddress").text(picked_address);
            $("#labelbttn").text(picked_label);
            request.address = picked_address;
            renderqr(payment, picked_address, ccvalue);
            history.replaceState(null, null, href);
            set_edit(href);
            paymentdialogbox.attr("data-pending", "");
            init_socket(helper.selected_socket, picked_address);
            canceldialog();
        } else {
            return false;
        }
    });
}

function set_edit(url) {
    if (request.iszero_request === true) {} else {
        localStorage.setItem("bitrequest_editurl", url); // to check if request is being edited
    }
}

function addaddressfromdialog() {
    $(document).on("click touch", "#addresslock #pending_add_address, #addaddress", function(e) {
        e.preventDefault();
        var formbox = $(this).closest("#addresslock"),
            payment = request.payment,
            cmcid = request.cmcid,
            erc20 = request.erc20
        ad = {
                "currency": payment,
                "ccsymbol": request.currencysymbol,
                "cmcid": cmcid,
                "checked": true,
                "erc20": erc20
            },
            content = $("<div class='formbox form add' id='addressformbox'><h2>" + getcc_icon(cmcid, request.cpid, erc20) + " Add " + payment + " address</h2><div class='popnotify'></div><form class='addressform popform' data-checked='true'><input type='text' class='address' value='' placeholder='Enter a " + payment + " address'><input type='text' class='addresslabel' value='' placeholder='label'><div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>I own the seed / private key of this address</span></div><input type='submit' class='submit' value='OK'></form>").data(ad);
        formbox.parent("#dialogbody").html(content);
    });
}

function scanqr() {
    $(document).on("click touch", "#scanqr", function() {
        remove_flip();
        if (request.iszero_request === true) {
            $("#amountbreak input").focus();
        }
    });
}

function showapistats() {
    $(document).on("click touch", "#apisrc", function() {
        var xratestats = $("#xratestats");
        if (xratestats.hasClass("show")) {
            xratestats.removeClass("show");
        } else {
            xratestats.addClass("show");
        }
    });
}

function hideapistats() {
    $(document).on("click touch", "#xratestats", function() {
        $(this).removeClass("show");
    });
}

//share
function sharebutton() {
    $(document).on("click touch", "#sharebutton", function() {
        if (geturlparameters().d) {
            share($(this));
        } else {
            validaterequestdata($("input#requestname").val(), $("input#requesttitle").val()); // force data params if empty
            setTimeout(function() { // wait for url to change
                share($(this));
            }, 100);
        }
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
                thisrequesttitle = (thisdata === true) ? dataobject.t : "";
        } catch (e) { // data param corrupted
            var content = "<h2 class='icon-blocked'>Invalid request</h2><p>" + e + "</p>";
            popdialog(content, "alert", "canceldialog");
            return false;
        }
        var newdatastring = (thisdata === true) ? "&d=" + dataparam : "", // construct data param if exists
            sharedurl = "https://app.bitrequest.io/?p=requests&payment=" + payment + "&uoa=" + thiscurrency + "&amount=" + thisamount + "&address=" + thisaddress + newdatastring,
            thisrequestname_uppercase = thisrequestname.substr(0, 1).toUpperCase() + thisrequestname.substr(1), // capitalize requestname
            paymentupper = payment.substr(0, 1).toUpperCase() + payment.substr(1),
            sharedtitle = (thisdata === true) ? thisrequestname_uppercase + " sent a " + paymentupper + " payment request of " + thisamount + " " + thiscurrency.toUpperCase() + " for '" + thisrequesttitle + "'" : "You have a " + paymentupper + " payment request of " + thisamount + " " + thiscurrency,
            encodedurl = encodeURIComponent(sharedurl),
            firebase_dynamiclink = firebase_shortlink + "?link=" + encodedurl + "&apn=" + androidpackagename + "&afl=" + encodedurl;
        shorten_url(sharedtitle, sharedurl, "https://s2.coinmarketcap.com/static/img/coins/200x200/" + cmcid + ".png");
        setlocales();
    } else {
        var requestname = $("#requestname");
        var requesttitle = $("#requesttitle");
        var name_check = requestname.val().length;
        var title_check = requesttitle.val().length;
        var name_check_message = (name_check < 1) ? "Please enter your name" : (name_check < 3) ? "Name should have minimal 3 characters" : "Please check your form";
        var title_check_message = (title_check < 1) ? "Please enter a description" : (title_check < 2) ? "Description should have minimal 2 characters" : "Please check your form";
        var check_message = (name_check < 3) ? name_check_message : (title_check < 2) ? title_check_message : "Please fill in required fields";
        topnotify(check_message);
        if (name_check < 3) {
            requestname.focus();
        } else if (title_check < 2) {
            requesttitle.focus();
        }
    }
}

function shorten_url(sharedtitle, sharedurl, sitethumb) {
    loadertext("Generating link");
    var us_settings = $("#url_shorten_settings"),
        us_active = (us_settings.data("us_active") == "active");
    if (us_active === true) {
        var us_service = us_settings.data("selected"),
            getcache = sessionStorage.getItem("bitrequest_" + us_service + "_shorturl_" + hashcode(sharedurl));
        if (getcache) { // get existing shorturl from cache
            sharerequest(getcache, sharedtitle);
        } else {
            if (us_service == "firebase") {
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
                        "method": "POST",
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
                                "option": "SHORT"
                            }
                        })
                    }
                }).done(function(e) {
                    var data = br_result(e).result;
                    if (data.error) {
                        sharerequest(sharedurl, sharedtitle);
                    } else {
                        var shorturl = data.shortLink;
                        sharerequest(shorturl, sharedtitle);
                        sessionStorage.setItem("bitrequest_firebase_shorturl_" + hashcode(sharedurl), shorturl);
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    sharerequest(sharedurl, sharedtitle);
                });
            } else if (us_service == "bitly") {
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
                            shorturl = "https://app.bitrequest.io/" + linkid + "4bR";
                        sharerequest(shorturl, sharedtitle);
                        sessionStorage.setItem("bitrequest_bitly_shorturl_" + hashcode(sharedurl), shorturl);
                    } else {
                        sharerequest(sharedurl, sharedtitle);
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    sharerequest(sharedurl, sharedtitle);
                });
            } else {
                sharerequest(sharedurl, sharedtitle);
            }
        }
    } else {
        sharerequest(sharedurl, sharedtitle);
    }
}

function sharerequest(sharedurl, sharedtitle) {
    closeloader();
    if (is_ios_app === true) {
        sharefallback(sharedurl, sharedtitle);
    } else {
	    if (supportsTouch === true && navigator.canShare) {
            navigator.share({
                title: sharedtitle + " | " + apptitle,
                text: sharedtitle + ": \n",
                url: sharedurl
            }).then(() => sharecallback()).catch(err => sharefallback(sharedurl, sharedtitle));
        } else {
            sharefallback(sharedurl, sharedtitle);
        }
    }
}

function sharefallback(sharedurl, sharedtitle) {
    var mobileclass = (supportsTouch === true) ? " showtouch" : "";
    $("#sharepopup").addClass("showpu active" + mobileclass).data({
        sharetitle: sharedtitle,
        shareurl: sharedurl
    });
    body.addClass("sharemode");
}

function whatsappshare() {
    $(document).on("click touch", "#whatsappshare", function() {
        sharecallback();
        var shareinfo = getshareinfo(),
        	sharetext = encodeURIComponent(shareinfo.body),
        	share_url = (supportsTouch === true) ? "https://wa.me/?text=" + sharetext : "whatsapp://send?text=" + sharetext;
        open_share_url("location", share_url);
    });
}

function mailto() {
    $(document).on("click touch", "#mailto", function() {
        sharecallback();
        var shareinfo = getshareinfo(),
            share_url = "mailto:?subject=" + encodeURIComponent(shareinfo.title) + "&body=" + encodeURIComponent(shareinfo.body);
        open_share_url("location", share_url);
    });
}

function copyurl() {
    $(document).on("click touch", "#copyurl", function() {
        copytoclipboard(getshareinfo().url, "Request url");
        sharecallback();
    });
}

function gmailshare() {
    $(document).on("click touch", "#gmailshare", function() {
        sharecallback();
        var shareinfo = getshareinfo(),
            share_url = "https://mail.google.com/mail/?view=cm&fs=1&su=" + encodeURIComponent(shareinfo.title) + "&body=" + encodeURIComponent(shareinfo.body);
        open_share_url("open", share_url);
    });
}

function telegramshare() {
    $(document).on("click touch", "#telegramshare", function() {
        sharecallback();
        var shareinfo = getshareinfo(),
            share_url = "https://telegram.me/share/url?url=" + shareinfo.url + "&text=" + encodeURIComponent(shareinfo.body);
        open_share_url("open", share_url);
    });
}

function outlookshare() {
    $(document).on("click touch", "#outlookshare", function() {
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
        title: sharetitle,
        url: shareurl,
        body: sharetitle + ": \n " + shareurl
    }
}

function sharecallback() {
    if (request) {
        request.requesttype = "outgoing",
            request.status = "new",
            request.pending = (request.monitored === false) ? "unknown" : "scanning";
        saverequest();
        loadpage("?p=requests");
        helper.currencylistitem.removeData("url"); // remove saved url
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
        } else if (type == "location") {
            window.location.href = url;
        } else {

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
    $(document).on("click touch", "#view_tx", function() {
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
            scrollTop: selected_request.offset().top - $("#fixednav").height()
        }, 500);
    }, 1000);
}

// ** Save and update request **

function saverequest(direct) {
    var gets = geturlparameters(),
        thispayment = gets.payment,
        thiscurrency = gets.uoa,
        thisamount = request.amount,
        thisaddress = request.address,
        currencysymbol = request.currencysymbol,
        thisrequesttype = request.requesttype,
        thispaymenttimestamp = request.paymenttimestamp,
        thisdata = gets.d,
        thismeta = gets.m,
        timestamp = $.now() + timezone, // UTC
        rqdatahash = (thisdata && thisdata.length > 5) ? thisdata : null, // check if data param exists
        rqmetahash = (thismeta && thismeta.length > 5) ? thismeta : null, // check if meta param exists
        dataobject = (rqdatahash) ? JSON.parse(atob(rqdatahash)) : null, // decode data param if exists
        requesttimestamp = (thispaymenttimestamp) ? thispaymenttimestamp : (dataobject && dataobject.ts) ? dataobject.ts : (thisrequesttype == "incoming") ? null : timestamp, // null is unknown timestamp
        unhashed = thispayment + thiscurrency + thisamount + thisaddress + request.requestname + request.requesttitle + request.set_confirmations,
        savedtxhash = request.txhash,
        requestid = (thisrequesttype == "local") ? hashcode(savedtxhash) : hashcode(unhashed),
        this_requestid,
        requestcache = localStorage.getItem("bitrequest_requests"),
        requestid_param = gets.requestid,
        online_purchase = (direct != "init" && inframe === true),
        this_iscrypto = (thiscurrency == currencysymbol);
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
            pendingstate = requestli.data("pending");
        if (savedtxhash) { // check if request is opened or updated
            if (pendingstate == "paid") {} else {
                updaterequest({
                    "requestid": requestid,
                    "status": request.status,
                    "receivedamount": request.receivedamount,
                    "fiatvalue": request.fiatvalue,
                    "paymenttimestamp": thispaymenttimestamp,
                    "txhash": savedtxhash,
                    "confirmations": request.confirmations,
                    "pending": request.pending
                }, true);
            }
        } else {
            if (pendingstate == "scanning") { // do nothing
                return false;
            } else if (pendingstate == "polling" || requestli.hasClass("expired")) {
                pendingdialog(requestli);
                return "nosocket";
            } else if (pendingstate == "no") {
                var txhash_state = requestli.data("txhash"),
                    typestate = requestli.data("requesttype"),
                    send_receive = (typestate == "incoming") ? "sent" : "received";
                adjust_paymentdialog("paid", "no", "Payment " + send_receive);
                paymentdialogbox.find("span#view_tx").attr("data-txhash", txhash_state);
                return "nosocket";
            }
        }
    } else {
        //overwrite global request object
        request.requestid = requestid,
            request.iscrypto = this_iscrypto,
            request.fiatcurrency = (this_iscrypto === true) ? request.localcurrency : thiscurrency,
            request.currencyname = $("#xratestats .cpool[data-currency='" + thiscurrency + "']").attr("data-currencyname");
        var numberamount = Number(thisamount),
            this_iszero = (numberamount === 0 || isNaN(numberamount));
        if (direct == "init" && request.shared === false) { // when first opened only save shared requests
        } else if (this_iszero === true) { // don't save requests with zero value
        } else {
            var append_object = $.extend(request, {
                archive: false,
                showarchive: false,
                tx_index: [],
                timestamp: timestamp,
                requestdate: requesttimestamp,
                rqdata: rqdatahash,
                rqmeta: rqmetahash,
                online_purchase: online_purchase
            });
            appendrequest(append_object);
            setTimeout(function() {
                saverequests();
            }, 500);
            if (!requestid_param && direct === true) { // Add request_params (make it a request)
                var request_params = "&requestid=" + requestid + "&status=" + request.status + "&type=" + thisrequesttype,
                    window_location = window.location.href;
                history.replaceState(null, null, window_location + request_params);
            }
            helper.currencylistitem.removeData("url"); // remove saved url
            // Derive new address
            var addressli = filter_addressli(thispayment, "address", thisaddress);
            addressli.addClass("used").data("used", true);
            saveaddresses(thispayment, false);
            derive_addone(thispayment);
        }
    }
    // post to parent
    if (online_purchase === true) {
        var contact_param = geturlparameters().contactform,
            meta_data_object = (rqmetahash) ? JSON.parse(atob(rqmetahash)) : undefined, // decode meta param if exists
            fiatvalue_rounded = trimdecimals(request.fiatvalue, 2),
            received_in_currency = (this_iscrypto === true) ? request.receivedamount : fiatvalue_rounded,
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
                "transactiontime": thispaymenttimestamp,
                "pending": request.pending
            },
            contactdata;
        if (contact_param !== undefined) {
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
            id: "result",
            data: post_data
        }, "*");
    }
}

function pendingdialog(pendingrequest) { // show pending dialog if tx is pending
    var prdata = pendingrequest.data(),
        txhash = prdata.txhash,
        tl_txhash = pendingrequest.find(".transactionlist li:first").data("txhash"),
        smart_txhash = (txhash) ? txhash : tl_txhash,
        status = prdata.status,
        typestate = prdata.requesttype,
        send_receive = (typestate == "incoming") ? "sent" : "received",
        brstatuspanel = paymentdialogbox.find(".brstatuspanel"),
        viewtx = brstatuspanel.find("#view_tx"),
        pending = prdata.pending;
    viewtx.attr("data-txhash", smart_txhash);
    if (pendingrequest.hasClass("expired")) {
        if (status == "new" || status == "insufficient") {
            adjust_paymentdialog("expired", "no", "<span class='icon-clock'></span>Request expired");
            paymentdialogbox.find("span#view_tx").hide();
        }
    } else {
        if (prdata.payment == "nano") { // 0 confirmation so payment must be sent
            if (status == "insufficient") {
                adjust_paymentdialog("insufficient", "scanning", "Insufficient amount");
            } else {
                adjust_paymentdialog("paid", "no", "Payment " + send_receive);
            }
        } else {
            if (smart_txhash) {
                add_flip();
                if (pending == "scanning") {
                    if (status == "insufficient") {
                        adjust_paymentdialog("insufficient", "scanning", "Insufficient amount");
                    } else {
                        adjust_paymentdialog("pending", "scanning", "Pending request");
                    }
                } else {
                    adjust_paymentdialog("pending", "polling", "Transaction broadcasted");
                    pick_monitor(smart_txhash);
                }
            }
        }
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
    $(document).on("click touch", ".openwallet", function(e) {
        e.preventDefault();
        var thisnode = $(this),
            thiscurrency = thisnode.attr("data-currency"),
            content = "<div class='formbox' id='backupformbox'><h2 class='icon-folder-open'>Do you have a " + thiscurrency + " wallet on this device?</h2><div class='popnotify'></div><div id='backupactions'><div data-rel='" + thisnode.attr("data-rel") + "' class='customtrigger' id='openwalleturl'>Yes</div><div id='dw_trigger' class='customtrigger' data-currency='" + thiscurrency + "'>No</div></div>";
        popdialog(content, "alert", "triggersubmit");
    });
}

function openwalleturl() {
    $(document).on("click touch", "#openwalleturl", function(e) {
        e.preventDefault();
        canceldialog();
        window.location.href = $(this).attr("data-rel");
    });
}

function dw_trigger() {
    $(document).on("click touch", "#dw_trigger", function() {
        var this_currency = $(this).attr("data-currency");
        canceldialog();
        setTimeout(function() {
            download_wallet(request.coindata);
        }, 800);
    })
}

function download_wallet(coindata) {
    var currency = coindata.currency;
    var wdp = coindata.wallet_download_page,
        wallets = coindata.wallets;
    if (wdp || wallets) {
        var wallet_ul = (wallets) ? "<ul id='formbox_ul'></ul>" : "",
            fmw = (wdp) ? "<a href='" + wdp + "' target='_blank' class='exit formbox_href'>Find more wallets</a>" : "",
            content = "\
			<div class='formbox' id='wdl_formbox'>\
				<h2 class='icon-download'>Download " + currency + " wallet</h2>\
				<div class='popnotify'></div>\
				<div id='dialogcontent'>" + wallet_ul + fmw + "</div>\
			</div>";
        popdialog(content, "alert", "canceldialog");
        if (wallets) {
            var walletlist = $("#formbox_ul");
            device = getdevicetype(),
                platform = getplatform(device),
                store_icon = (platform == "playstore") ? "button-playstore-v2.svg" :
                (platform == "appstore") ? "button-appstore.svg" : "button-desktop_app.svg",
                store_tag = (store_icon) ? "<img src='img/" + store_icon + "'/>" : "<span class='icon-download'></span> ";
            $.each(wallets, function(key, value) {
                var device_url = value[platform];
                if (device_url) {
                    var walletname = value.name,
                        website = value.website,
                        wallet_icon = "<img src='img/icons/wallet-icons/" + walletname + ".png' class='wallet_icon'/>";
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
        receivedamount_rounded = trimdecimals(ua.receivedamount, 5),
            metalist.find(".receivedamount span").text(" " + trimdecimals(ua.receivedamount, 5));
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
            conftext = (confirmations == 0) ? "Unconfirmed transaction" : ua.confirmations + " / " + rldata.set_confirmations + " confirmations";
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
            return false;
        } else {
            var textinput = (rldata.requesttitle) ? requestlist.find(".atext h2") :
                requestlist.find(".rq_subject");
            textinput.add(metalist.find(".requesttitlebox")).text(thisrequesttitle);
        }
    }
    requestlist.data(ua);
    if (save === true) {
        setTimeout(function() {
            saverequests();
        }, 1000);
    }
}