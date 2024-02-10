//globals
const ls_support = check_local(),
    language = navigator.language || navigator.userLanguage,
    userAgent = navigator.userAgent || navigator.vendor || window.opera,
    titlenode = $("title"),
    ogtitle = $("meta[property='og:title']"),
    html = $("html"),
    body = $("body"),
    main = $("main"),
    paymentpopup = $("#payment"),
    paymentdialogbox = $("#paymentdialogbox"),
    copycontent = $("#copyinput"),
    funk = $("#funk"), // funk sound effect
    cashier = $("#cashier"), // cashier sound effect
    collect = $("#collect"), // collect sound effect
    blip = $("#blip"), // blip sound effect
    waterdrop = $("#waterdrop"), // waterdrop sound effect
    howl = $("#howl"), // howl sound effect
    timezoneoffset = new Date().getTimezoneOffset(),
    timezone = timezoneoffset * 60000,
    has_ndef = ("NDEFReader" in window),
    supportsTouch = ("ontouchstart" in window || navigator.msMaxTouchPoints),
    referrer = document.referrer,
    exp_referrer = "android-app://" + androidpackagename,
    ref_match = (referrer && referrer.indexOf(exp_referrer) >= 0) ? true : false,
    android_standalone = window.matchMedia("(display-mode: standalone)").matches,
    ios_standalone = navigator.standalone,
    is_android_app = (ref_match), // android app fingerprint
    inframe = (self !== top),
    offline = (navigator.onLine === false),
    w_loc = window.location,
    c_host = w_loc.origin + w_loc.pathname,
    thishostname = w_loc.hostname,
    hostlocation = (thishostname == "" || thishostname == "localhost" || thishostname === "127.0.0.1") ? "local" :
    (thishostname == "bitrequest.github.io") ? "hosted" :
    (thishostname == localhostname) ? "selfhosted" : "unknown",
    wl = navigator.wakeLock,
    after_poll_timeout = 15000,
    xss_alert = "xss attempt detected";

let scrollposition = 0,
    is_ios_app = false, // ios app fingerprint
    phpsupportglobal,
    symbolcache,
    hascam,
    cp_timer,
    local,
    localserver,
    wakelock,
    bipv,
    bipobj = br_get_local("bpdat", true),
    hasbip = (bipobj) ? true : false,
    bipid = (hasbip) ? bipobj.id : false,
    ndef,
    blockswipe,
    ctrl,
    cashier_dat = br_get_local("cashier", true),
    is_cashier = (cashier_dat && cashier_dat.cashier) ? true : false,
    cashier_seedid = (is_cashier) ? cashier_dat.seedid : false,
    stored_currencies = br_get_local("currencies", true),
    init = br_get_local("init", true),
    io = br_dobj(init, true),
    new_address, // prevent double address entries
    proxy_attempts = {};

if (has_ndef && !inframe) {
    ndef = new NDEFReader();
}

$(document).ready(function() {
    $.ajaxSetup({
        "cache": false
    });
    buildsettings(); // build settings first

    if (hostlocation != "local") { // don't add service worker on desktop
        add_serviceworker();
    }

    //close potential websockets and pings
    forceclosesocket();
    clearpinging();

    //Set classname for ios app	
    if (is_ios_app === true) {
        body.addClass("ios");
    }

    //Set classname for iframe	
    if (inframe === true) {
        html.addClass("inframe hide_app");
    } else {
        html.addClass("noframe");
    }

    //some api tests first
    rendersettings(); //retrieve settings from localstorage (load first to retrieve apikey)
    if (ls_support) { //check for local storage support
        if (!stored_currencies) { //show startpage if no addresses are added
            body.addClass("showstartpage");
        }
        let bipverified = io.bipv,
            phpsupport = io.phpsupport;
        if (bipverified && hasbip === true) {
            bipv = true;
        }
        if (phpsupport) {
            phpsupportglobal = (phpsupport == "yes") ? true : false;
            setsymbols();
        } else {
            checkphp();
        }
    } else {
        let content = "<h2 class='icon-bin'>Sorry!</h2><p>No Web Storage support..</p>";
        popdialog(content, "canceldialog");
    }
    $("#fixednav").html($("#relnav").html()); // copy nav
    //startscreen
    setTimeout(function() {
        let startscreen = $("#startscreen");
        startscreen.addClass("hidesplashscreen");
        setTimeout(function() {
            startscreen.remove();
        }, 600);
    }, 600);
    showselect();
    selectbox();
    pickselect();
    canceldialogtrigger();
    console.log({
        "config": br_config
    });
})

function checkphp() { //check for php support by fetching fiat currencies from local api php file
    api_proxy({
        "api": "fixer",
        "search": "symbols",
        "cachetime": 86400,
        "cachefolder": "1d",
        "proxy": true,
        "localhost": true,
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        let result = br_result(e);
        if (result.proxy === true) {
            let symbols = q_obj(result, "result.result.symbols");
            if (symbols) {
                if (symbols.USD) {
                    br_set_local("symbols", symbols, true);
                } else {
                    let this_error = (data.error) ? data.error : "Unable to get API data";
                    fail_dialogs("fixer", this_error);
                }
            }
            io.phpsupport = "yes";
            br_set_local("init", io, true);
            phpsupportglobal = true;
            setsymbols();
            return
        }
        io.phpsupport = "no";
        br_set_local("init", io, true);
        phpsupportglobal = false;
        setsymbols();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        io.phpsupport = "no";
        br_set_local("init", io, true);
        phpsupportglobal = false;
        setsymbols();
    });
}

function setsymbols() { //fetch fiat currencies from fixer.io api
    //set globals
    local = (hostlocation == "local" && phpsupportglobal === false),
        localserver = (hostlocation == "local" && phpsupportglobal === true);
    if (br_get_local("symbols")) {
        geterc20tokens();
        return
    }
    api_proxy({
        "api": "fixer",
        "search": "symbols",
        "cachetime": 86400,
        "cachefolder": "1d",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        let data = br_result(e).result;
        if (data) {
            let symbols = data.symbols;
            if (symbols && symbols.USD) {
                br_set_local("symbols", symbols, true);
                geterc20tokens();
                return
            }
            let this_error = (data.error) ? data.error : "Unable to get API data";
            fail_dialogs("fixer", this_error);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        let next_proxy = get_next_proxy();
        if (next_proxy) {
            setsymbols();
            return
        }
        let content = "<h2 class='icon-bin'>Api call failed</h2><p class='doselect'>" + textStatus + "<br/>api did not respond<br/><br/><span id='proxy_dialog' class='ref'>Try other proxy</span></p>";
        popdialog(content, "canceldialog");
    })
}

//* get top 600 erc20 tokens from coinmarketcap
function geterc20tokens() {
    if (br_get_local("erc20tokens")) {
        setfunctions();
        return;
    }
    api_proxy({
        "api": "coinmarketcap",
        "search": "v1/cryptocurrency/listings/latest?cryptocurrency_type=tokens&limit=600&aux=cmc_rank,platform",
        "cachetime": 604800,
        "cachefolder": "1w",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        let data = br_result(e).result,
            status = data.status;
        if (status && status.error_code === 0) {
            storecoindata(data);
            return
        }
        geterc20tokens_local(); // get locally stored coindata
    }).fail(function(jqXHR, textStatus, errorThrown) {
        geterc20tokens_local();
    }).always(function() {
        setfunctions();
    });
}

function geterc20tokens_local() {
    let apiurl = approot + "assets_data_erc20.json";
    $.getJSON(apiurl, function(data) {
        if (data) {
            storecoindata(data);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        let content = "<h2 class='icon-bin'>Api call failed</h2><p class='doselect'>Unable to fetch tokeninfo</p>";
        popdialog(content, "canceldialog");
    });
}

function storecoindata(data) {
    if (data) {
        let erc20push = [];
        $.each(data.data, function(key, value) {
            let platform = value.platform;
            if (platform) {
                if (platform.id === 1027) { // only get erc20 tokens
                    let erc20box = {
                        "name": value.slug,
                        "symbol": value.symbol.toLowerCase(),
                        "cmcid": value.id,
                        "contract": value.platform.token_address
                    };
                    erc20push.push(erc20box);
                }
            }
        });
        br_set_local("erc20tokens", erc20push, true);
    }
}

function haspin() {
    let pinsettings = $("#pinsettings").data(),
        pinhash = pinsettings.pinhash;
    if (pinhash) {
        let pinstring = pinhash.toString();
        return (pinstring.length > 3 && pinsettings.locktime != "never");
    }
    return false;
}

function islocked() {
    let gets = geturlparameters(),
        locktime = $("#pinsettings").data("locktime"),
        lastlock = br_get_local("locktime"),
        tsll = now() - lastlock,
        pflt = parseFloat(locktime);
    return (gets.payment) ? false : (haspin() === true && tsll > pflt) ? true : false;
}

function setfunctions() {
    setlocales(); //set meta attribute
    setpermissions();

    // ** Pincode **

    pinkeypress();
    //pinpressselect
    pinpresstrigger();
    //pinpress
    pinvalidatetrigger();
    pin_admin_reset();
    //pinvalidate
    pinbacktrigger();
    pinbackvalidatetrigger();
    //pinback
    canceloptionstrigger();
    //canceloptions
    seed_unlock_trigger();
    phrase_login();
    //remove_rqo
    keyup();
    if (is_viewonly() === true || ishome() === true) {
        finishfunctions();
        return
    }
    if (islocked() === true) {
        let content = pinpanel(" pinwall global");
        showoptions(content, "pin");
        return
    }
    finishfunctions();
}

function finishfunctions() {

    // ** IOS functions **

    //ios_init
    //ios_redirections

    // ** Intropage **

    starttrigger();
    startnexttrigger();
    //startnext
    //startprev
    lettercountkeydown();
    lettercountinput();
    choosecurrency();

    // ** Navigation **

    togglenav();
    //loadurl
    clicklink();
    //loadpage
    //openpage
    popstate();
    //loadfunction
    //cancel_url_dialogs
    //loadpageevent
    //shownav
    activemenu();
    fixednav();

    // ** Triggerrequest **

    triggertx();
    //triggertxfunction
    confirm_missing_seed();
    //clear_savedurl
    payrequest();

    // ** UX **

    togglecurrency();
    toggleaddress();
    confirm_missing_seed_toggle();
    //cmst_callback
    //add_seed_whitelist
    //seed_wl
    //add_address_whitelist
    //addr_whitelist
    check_pk();
    //check_currency
    //currency_check
    //currency_uncheck
    toggleswitch();
    closeselectbox();
    radio_select();
    dialog_drawer();
    dragstart(); // reorder addresses
    //drag
    dragend();
    //escapeandback
    //close_paymentdialog
    //continue_cpd
    //payment_lookup
    check_recent();
    dismiss_payment_lookup();
    //block_payment_lookup
    request_history();
    //recent_requests
    //recent_requests_list
    //notifications
    //notify
    closenotifytrigger();
    //closenotify
    //topnotify
    //popnotify
    //dialogs
    //popdialog
    //execute
    addcurrencytrigger();
    //addcurrency
    //derive_first_check
    addaddresstrigger();
    //addaddress
    address_xpub_change();
    //active_derives
    get_wallet();
    submitaddresstrigger();
    add_lightning();
    add_erc20();
    autocomplete_erc20token();
    pickerc20select();
    //initaddressform
    submit_erc20();
    //validateaddress_vk
    //validateaddress
    //check_address
    //check_vk
    send_trigger();
    showbip39_trigger();
    canceldialog_click();
    //canceldialog
    blockcancelpaymentdialog();
    cancelpaymentdialogtrigger();
    //unfocus_inputs
    //cpd_pollcheck
    //cancelpaymentdialog
    //closesocket
    //forceclosesocket
    //clearpinging
    cancelsharedialogtrigger();
    //cancelsharedialog
    showoptionstrigger();
    //showoptions
    //lockscreen
    newrequest_alias();
    newrequest();
    confirm_ms_newrequest();
    showrequests();
    showrequests_inlne();
    editaddresstrigger();
    removeaddress();
    //removeaddressfunction
    rec_payments();
    showtransaction_trigger();
    showtransactions();
    addressinfo();
    show_pk();
    show_vk();
    //open_blockexplorer_url
    //blockexplorer_url
    //get_blockexplorer
    apisrc_shortcut();

    // ** Requestlist functions **

    showrequestdetails();
    toggle_request_meta();
    //animate_confbar
    show_transaction_meta();
    hide_transaction_meta();
    archive();
    //archivefunction
    unarchive();
    //unarchivefunction
    removerequest();
    //removerequestfunction
    //amountshort
    editrequest();
    submit_request_description();

    // ** Services **

    receipt();
    download_receipt();
    share_receipt();
    //lnd_lookup_invoice
    //get_pdf_url

    // ** Page rendering **

    rendercurrencies();
    setTimeout(function() {
        loadurl(); //initiate page
    }, 100);
    //render_currencysettings
    //rendersettings
    renderrequests();
    //archive_button
    //fetchrequests
    //initiate
    //buildpage
    //append_coinsetting
    //appendaddress
    //appendrequest

    // ** Store data in localstorage **

    //savecurrencies
    //saveaddresses
    //saverequests
    //savearchive
    //savesettings
    //save_cc_settings
    //updatechanges
    //resetchanges
    //savechangesstats
    renderchanges();
    //change_alert
    //get_total_changes

    // ** HTML rendering **

    //render_html
    //render_attributes

    // ** HTML templates **

    //template_dialog

    // ** Helpers **

    open_url();
    //get_blockcypher_apikey
    //get_infura_apikey
    //proxy_alert
    //fetchsymbol
    //fixedcheck
    //ishome
    //triggersubmit
    //copytoclipboard
    //loader
    closeloader_trigger();
    //closeloader
    //loadertext
    //settitle
    //pinpanel
    //switchpanel
    //try_next_api
    //wake
    //sleep
    //vu_block
    //countdown
    //countdown_format

    // ** Recent requests **

    check_rr();
    //toggle_rr

    // ** Get_app **

    setTimeout(function() { // wait for ios app detection
        detectapp();
    }, 700);
    //getapp
    close_app_panel();
    //platform_icon

    // ** Query helpers **//

    //get_setting
    //set_setting
    //get_requestli
    //ch_pending
    //get_addresslist
    //filter_addressli
    //filter_all_addressli
    //filter_list
    //get_currencyli
    //get_homeli
    //cs_node
    //getcoindata
    //activecoinsettings
    //getcoinsettings
    //getcoinconfig
    gk();
    html.addClass("loaded");
    //is_opendialog
    //is_openrequest

    // ** Check params **//

    check_params();
    //check_intents;
    //expand_shoturl
    //expand_bitly
    //ln_connect
    //click_pop
    //add_serviceworker
}

//checks

function setlocales() {
    html.attr("lang", language);
    $("meta[property='og:locale']").attr("content", language);
    $("meta[property='og:url']").attr("content", w_loc.href);
}

function setpermissions() {
    let permission = $("#permissions").data("selected");
    html.attr("data-role", permission);
}

function is_viewonly() {
    let permission = $("#permissions").data("selected");
    return (permission == "cashier");
}

// ** Pincode **

function pinkeypress() {
    $(document).keydown(function(e) {
        let pinfloat = $("#pinfloat");
        if (pinfloat.length) {
            let keycode = e.keyCode;
            if (keycode === 49 || keycode === 97) {
                pinpressselect($("#pin1 > span"));
            } else if (keycode === 50 || keycode === 98) {
                pinpressselect($("#pin2 > span"));
            } else if (keycode === 51 || keycode === 99) {
                pinpressselect($("#pin3 > span"));
            } else if (keycode === 52 || keycode === 100) {
                pinpressselect($("#pin4 > span"));
            } else if (keycode === 53 || keycode === 101) {
                pinpressselect($("#pin5 > span"));
            } else if (keycode === 54 || keycode === 102) {
                pinpressselect($("#pin6 > span"));
            } else if (keycode === 55 || keycode === 103) {
                pinpressselect($("#pin7 > span"));
            } else if (keycode === 56 || keycode === 104) {
                pinpressselect($("#pin8 > span"));
            } else if (keycode === 57 || keycode === 105) {
                pinpressselect($("#pin9 > span"));
            } else if (keycode === 48 || keycode === 96) {
                pinpressselect($("#pin0 > span"));
            } else if (keycode === 8) {
                if (pinfloat.hasClass("enterpin")) {
                    pinback($("#pininput"));
                } else {
                    pinback($("#validatepin"));
                }
            }
        }
    });
}

function pinpressselect(node) {
    if ($("#pinfloat").hasClass("enterpin")) {
        pinpress(node);
        return
    }
    pinvalidate(node)
}

function pinpresstrigger() {
    $(document).on("click", "#optionspop .enterpin .pinpad .pincell", function() {
        pinpress($(this));
    });
}

function pinpress(thispad) {
    let pinfloat = $("#pinfloat"),
        thisval = thispad.text(),
        pininput = $("#pininput"),
        pinval = pininput.val(),
        newval = pinval + thisval;
    if (newval.length === 4) {
        if (pinfloat.hasClass("pinwall")) {
            enterapp(newval);
            pininput.val(newval);
            return false;
        }
        pininput.val(newval);
        setTimeout(function() {
            pinfloat.addClass("validatepin").removeClass("enterpin");
        }, 100);
        return false;
    }
    if (newval.length > 4) {
        return false;
    }
    pininput.val(newval);
    thispad.addClass("activepad");
    setTimeout(function() {
        thispad.removeClass("activepad");
    }, 500);
    $("#pincode .pinpad").not(thispad).removeClass("activepad");
}

function enterapp(pinval) {
    let pinfloat = $("#pinfloat"),
        pinsettings = $("#pinsettings").data(),
        savedpin = pinsettings.pinhash,
        attempts = pinsettings.attempts,
        hashpin = hashcode(pinval),
        _now = now(),
        timeout,
        global = (pinfloat.hasClass("global")) ? true : false;
    if (hashpin == savedpin) {
        if (global) {
            let nit = true;
            br_set_local("locktime", _now);
            finishfunctions();
            setTimeout(function() {
                playsound(waterdrop);
                canceloptions(true);
            }, 500);
        } else if (pinfloat.hasClass("admin")) {
            br_set_local("locktime", _now);
            loadpage("?p=currencies");
            $(".currenciesbttn .self").addClass("activemenu");
            playsound(waterdrop);
            canceloptions(true);
        } else if (pinfloat.hasClass("reset")) {
            br_set_local("locktime", _now);
            $("#pintext").text("Enter new pin");
            pinfloat.addClass("p_admin").removeClass("pinwall reset");
            playsound(waterdrop);
            setTimeout(function() {
                $("#pininput").val("");
            }, 200);
        } else {
            let callback = pinfloat.data("pincb");
            if (callback) {
                callback.func(callback.args);
            } else {
                br_set_local("locktime", _now);
            }
            playsound(waterdrop);
            canceloptions(true);
        }
        pinsettings.attempts = 0;
        savesettings(global);
        remove_cashier();
    } else {
        if (navigator.vibrate) {} else {
            playsound(funk);
        }
        shake(pinfloat);
        setTimeout(function() {
            $("#pininput").val("");
        }, 10);
        if (attempts > 2) {
            if (attempts === 3) {
                let timeout = _now + 300000; // 5 minutes
                pinsettings.timeout = timeout;
                lockscreen(timeout);
            } else if (attempts === 6) {
                let timeout = _now + 1800000; // 30 minutes
                pinsettings.timeout = timeout;
                lockscreen(timeout);
            } else if (attempts === 9) {
                let timeout = _now + 86400000; // 24 hours
                pinsettings.timeout = timeout;
                lockscreen(timeout);
            } else if (attempts > 9) {
                attempts = 1;
            }
        }
        pinsettings.attempts = attempts + 1;
        savesettings(global);
    }
}

function clearpinlock() {
    let pinsettings = $("#pinsettings").data();
    pinsettings.timeout = null;
    pinsettings.attempts = 0;
    savesettings();
}

function pin_admin_reset() {
    $(document).on("click", "#reset_pin", function() {
        $("#pinfloat").removeClass("p_admin");
    });
}

function pinvalidatetrigger() {
    $(document).on("click", "#optionspop .validatepin .pinpad .pincell", function() {
        pinvalidate($(this))
    });
}

function pinvalidate(thispad) {
    let pinfloat = $("#pinfloat"),
        thisval = thispad.text(),
        pininput = $("#validatepin"),
        pinval = pininput.val(),
        newval = pinval + thisval;
    if (newval.length > 3) {
        if (newval == $("#pininput").val()) {
            let current_pin = get_setting("pinsettings", "pinhash"),
                pinsettings = $("#pinsettings"),
                pinhash = hashcode(newval),
                titlepin = "pincode activated",
                locktime = pinsettings.data("locktime");
            pinsettings.data({
                "pinhash": pinhash,
                "locktime": locktime,
                "selected": titlepin
            }).find("p").text(titlepin);
            savesettings();
            playsound(waterdrop);
            canceloptions(true);
            let callback = pinfloat.data("pincb");
            if (callback) {
                callback.func(callback.args);
            }
            notify("Data saved");
            enc_s(seed_decrypt(current_pin));
        } else {
            let pinfloat = $("#pinfloat");
            topnotify("pincode does not match");
            if (navigator.vibrate) {} else {
                playsound(funk);
            }
            shake(pinfloat);
            pininput.val("");
        }
    }
    if (newval.length > 4) {
        return false;
    }
    pininput.val(newval);
    thispad.addClass("activepad");
    setTimeout(function() {
        thispad.removeClass("activepad");
    }, 500);
    $("#pincode .pinpad").not(thispad).removeClass("activepad");
}

function pinbacktrigger() {
    $(document).on("click", "#optionspop #pinfloat.enterpin #pinback", function() {
        pinback($("#pininput"));
    });
}

function pinbackvalidatetrigger() {
    $(document).on("click", "#optionspop #pinfloat.validatepin #pinback", function() {
        pinback($("#validatepin"));
    });
}

function pinback(pininput) {
    let pinval = pininput.val(),
        inputlength = pinval.length,
        prevval = pinval.substring(0, inputlength - 1);
    pininput.val(prevval);
}

// ** IOS Redirects **

// (Can only be envoked from the IOS app) 

//Set classname for ios app

function ios_init() {
    is_ios_app = true;
    body.addClass("ios"); // ios app fingerprint
}

function ios_redirections(url) {
    if (url) {
        let search = get_search(url),
            gets = renderparameters(search);
        if (gets.xss) {
            return
        }
        let currenturlvar = w_loc.href,
            currenturl = currenturlvar.toUpperCase(),
            newpage = url.toUpperCase();
        if (currenturl == newpage) {
            return
        }
        if (br_get_local("editurl") == w_loc.search) {
            return
        }
        let isrequest = (newpage.indexOf("PAYMENT=") >= 0),
            isopenrequest = (paymentpopup.hasClass("active"));
        if (isrequest) {
            if (isopenrequest) {
                cancelpaymentdialog();
                setTimeout(function() {
                    openpage(url, "", "payment");
                }, 1000);
                return
            }
            openpage(url, "", "payment");
            updaterequeststatesrefresh();
            return
        }
        if (gets.i) {
            // expand shorturl don't open page
        } else {
            let pagename = (gets.p) ? gets.p : "prompt";
            openpage(url, pagename, "page");
        }
        if (is_opendialog() === true) {
            canceldialog();
            setTimeout(function() {
                check_params(gets);
            }, 1000);
            return
        }
        check_params(gets);
    }
}

// ** Intropage **

function starttrigger() {
    $(document).on("click touchend", "#intro .panelwrap, #intro .proceeed", function() {
        startnext($("#intro"));
    });
}

function startnexttrigger() {
    $(document).on("click touchend", "#entername .panelwrap", function(e) {
        if (e.target == this) {
            startnext($("#entername"));
        }
    });
}

function startnext(thisnode) {
    let thisnext = thisnode.attr("data-next");
    if (thisnext === undefined) {
        return
    }
    if (thisnode.hasClass("validstep")) {
        $("#startpage").attr("class", "sp_" + thisnext);
        thisnode.removeClass("panelactive").next(".startpanel").addClass("panelactive");
        $("#eninput").blur();
        return
    }
    topnotify("Please enter your name");
}

function startprev(thisnode) {
    let thisprev = thisnode.attr("data-prev");
    if (thisprev === undefined) {
        return
    }
    $("#startpage").attr("class", "sp_" + thisprev);
    thisnode.removeClass("panelactive").prev(".startpanel").addClass("panelactive");
    $("#eninput").blur();
}

function lettercountkeydown() { // Character limit on input field
    $(document).on("keydown", "#eninput", function(e) {
        let keycode = e.keyCode,
            thisinput = $(this),
            thisvallength = thisinput.val().length,
            lettersleft = thisinput.attr("data-max") - thisvallength;
        if (keycode === 13) {
            startnext($("#entername"));
        }
        if (keycode === 8 || keycode === 39 || keycode === 37 || keycode === 91 || keycode === 17 || e.metaKey || e.ctrlKey) { //alow backspace, arrowright, arrowleft, command, ctrl
            return
        }
        if (lettersleft === 0) {
            playsound(funk);
            e.preventDefault();
        }
    });
}

function lettercountinput() { // Character count plus validation
    $(document).on("input", "#eninput", function() {
        let thisinput = $(this),
            mininput = thisinput.attr("data-min"),
            thispanel = $("#entername"),
            thisvallength = thisinput.val().length,
            lettersleft = thisinput.attr("data-max") - thisvallength,
            lettercount = $("#lettercount");
        lettercount.text(lettersleft);
        if (thisvallength >= mininput) {
            thispanel.addClass("validstep");
        } else {
            thispanel.removeClass("validstep");
        }
        if (thisvallength < 1) {
            lettercount.removeClass("activlc");
        } else {
            lettercount.addClass("activlc");
        }
    });
}

function choosecurrency() {
    $(document).on("click touch", "#allcurrencies li.choose_currency", function() {
        let currency = $(this).attr("data-currency"),
            cd = getcoindata(currency);
        addaddress({
            "currency": currency,
            "ccsymbol": cd.ccsymbol,
            "cmcid": cd.cmcid,
            "erc20": false,
            "checked": true
        }, false);
    })
}

// ** Navigation **

function togglenav() {
    $(document).on("click", "#header", function() {
        if (html.hasClass("showmain")) {
            loadpage("?p=home");
            $(".navstyle li .self").removeClass("activemenu");
            return
        }
        if (islocked() === true) {
            if (is_viewonly() === true) {
                loadpage("?p=currencies");
                $(".currenciesbttn .self").addClass("activemenu");
                return
            }
            let content = pinpanel(" pinwall admin");
            showoptions(content, "pin");
            return
        }
        loadpage("?p=currencies");
        $(".currenciesbttn .self").addClass("activemenu");
    });
}

function loadurl() {
    let gets = geturlparameters();
    if (gets.xss) {
        loadpageevent("home");
        return
    }
    let page = gets.p,
        payment = gets.payment,
        url = w_loc.search,
        event = (payment) ? "both" : "loadpage";
    if (url) {
        openpage(url, page, event);
    } else {
        loadpageevent("home");
    }
    shownav(page);
    let bip39info = gets.bip39;
    if (bip39info) {
        bip39_sc(bip39info);
    }
}

function clicklink() {
    $(document).on("click", ".self", function(e) {
        e.preventDefault();
        loadpage($(this).attr("data-rel"));
        return
    })
}

//push history and set current page
function loadpage(href) {
    let pagename = href.split("&")[0].split("=").pop();
    openpage(href, pagename, "loadpage");
}

function openpage(href, pagename, event) {
    history.pushState({
        "pagename": pagename,
        "event": event
    }, "", href);
    loadfunction(pagename, event);
}

function popstate() {
    window.onpopstate = function(e) {
        let statemeta = e.state;
        if (statemeta && statemeta.pagename) { //check for history
            loadfunction(statemeta.pagename, statemeta.event);
            return
        }
        cancel_url_dialogs();
    }
}

//activate page
function loadfunction(pagename, thisevent) {
    if (thisevent == "payment") { //load paymentpopup if payment is set
        loadpaymentfunction();
        return
    }
    if (thisevent == "both") { //load paymentpopup if payment is set and load page
        loadpageevent(pagename);
        setTimeout(function() {
            loadpaymentfunction("delay");
        }, 1000);
        return
    }
    loadpageevent(pagename);
    let title = pagename + " | " + apptitle;
    settitle(title);
    cancel_url_dialogs();
}

function cancel_url_dialogs() {
    if (paymentpopup.hasClass("active")) {
        cancelpaymentdialog();
    }
    if (body.hasClass("showcam")) {
        $("#closecam").trigger("click");
    }
}

function loadpageevent(pagename) {
    $("html, body").animate({
        "scrollTop": 0
    }, 400);
    let currentpage = $("#" + pagename);
    currentpage.addClass("currentpage");
    $(".page").not(currentpage).removeClass("currentpage");
    $(".highlightbar").attr("data-class", pagename);
    shownav(pagename);
    let requestfilter = geturlparameters().filteraddress; // filter requests if filter parameter exists
    if (requestfilter && pagename == "requests") {
        $("#requestlist > li").not(get_requestli("address", requestfilter)).hide();
    } else {
        $("#requestlist > li").show();
    }
}

function shownav(pagename) { // show / hide navigation
    if (ishome(pagename) === true) {
        html.removeClass("showmain").addClass("hidemain");
        $("#relnav .nav").slideUp(300);
        return
    }
    html.addClass("showmain").removeClass("hidemain")
    $("#relnav .nav").slideDown(300);
}

function activemenu() {
    $(document).on("click", ".nav li .self", function() {
        let thisitem = $(this);
        thisitem.addClass("activemenu");
        $(".nav li .self").not(thisitem).removeClass("activemenu");
        return
    })
}

function fixednav() {
    $(document).scroll(function(e) {
        if (html.hasClass("paymode")) {
            e.preventDefault();
            return
        }
        fixedcheck($(document).scrollTop());
    });
}

// ** Triggerrequest **

function triggertx() {
    $(document).on("click", ".currencylist li > .rq_icon", function() {
        triggertxfunction($(this));
        canceloptions();
    });
}

function triggertxfunction(thislink) {
    let currency = thislink.data("currency"),
        can_derive = derive_first_check(currency);
    if (can_derive === true) {
        triggertxfunction(thislink);
        return
    }
    let pick_random = cs_node(currency, "Use random address", true).selected,
        derives = check_derivations(currency),
        addresslist = filter_addressli(currency, "checked", true),
        firstlist = addresslist.first(),
        manualist = addresslist.not(".seed"),
        addresscount = manualist.length,
        randomlist = (addresscount > 1) ? manualist : firstlist,
        random = getrandomnumber(1, addresscount) - 1,
        pick_address = (pick_random === true) ? (firstlist.hasClass("seed")) ? firstlist : manualist.eq(random) : firstlist,
        a_data = pick_address.data(),
        thisaddress = a_data.address,
        title = thislink.attr("title"),
        savedurl = thislink.data("url"),
        seedid = a_data.seedid;
    if (seedid) {
        if (seedid != bipid) {
            if (addr_whitelist(thisaddress) === true) {} else {
                let pass_dat = {
                        "currency": currency,
                        "address": thisaddress,
                        "url": savedurl,
                        "title": title,
                        "seedid": seedid
                    },
                    content = get_address_warning("addresswarning", thisaddress, pass_dat);
                popdialog(content, "triggersubmit");
                return false;
            }
        } else {
            if (bipv_pass() === false) {
                return false;
            }
        }
    }
    finishtxfunction(currency, thisaddress, savedurl, title)
}

function confirm_missing_seed() {
    $(document).on("click", "#addresswarning .submit", function(e) {
        e.preventDefault();
        let thisdialog = $("#addresswarning"),
            d_dat = thisdialog.data(),
            pk_checkbox = thisdialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked"),
            ds_checkbox = thisdialog.find("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (pk_checked == true) {} else {
            popnotify("error", "Confirm privatekey ownership");
            return false
        }
        if (ds_checked == true) { // whitlist seed id
            add_address_whitelist(d_dat.address);
        }
        canceldialog();
        finishtxfunction(d_dat.currency, d_dat.address, d_dat.url, d_dat.title);
        return false;
    })
}

function get_address_warning(id, address, pass_dat) {
    let seedstr = (pass_dat.xpubid) ? "Xpub" : "Seed",
        rest_str = (seedstr == "Seed") ? (hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + pass_dat.seedid + "'>Restore seed</div>" : "";
    return $("<div class='formbox addwarning' id='" + id + "'>\
        <h2 class='icon-warning'>Warning!</h2>\
        <div class='popnotify'></div>\
        <p><strong>" + seedstr + " for '<span class='adspan'>" + address + "</span>' is missing.<br/>Are you sure you want to use this address?</strong></p>\
        <form class='addressform popform'>\
            <div class='inputwrap'>\
                <div class='pk_wrap noselect'>\
                    <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div>\
                    <span>I own the seed / private key of this address</span>\
                </div>\
                <div class='pk_wrap noselect'>\
                    <div id='dontshowwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div>\
                    <span>Don't show again</span>\
                </div>" + rest_str +
        "</div>\
            <input type='submit' class='submit' value='OK'>\
        </form>\
    </div>").data(pass_dat);
}

function finishtxfunction(currency, thisaddress, savedurl, title) {
    prevkey = false;
    let gets = geturlparameters();
    if (gets.xss) {
        return
    }
    let cd = getcoindata(currency),
        currencysettings = $("#currencysettings").data(),
        c_default = currencysettings.default,
        currencysymbol = (c_default === true && offline === false) ? currencysettings.currencysymbol : cd.ccsymbol,
        currentpage = gets.p,
        currentpage_correct = (currentpage) ? "?p=" + currentpage + "&payment=" : "?payment=",
        prefix = currentpage_correct + currency + "&uoa=",
        newlink = prefix + currencysymbol + "&amount=0" + "&address=" + thisaddress,
        href = (!savedurl || offline !== false) ? newlink : savedurl, //load saved url if exists
        thistitle = (title) ? title : "bitrequest";
    br_set_local("editurl", href); // to check if request is being edited
    remove_flip(); // reset request card facing front
    openpage(href, thistitle, "payment");
}

function clear_savedurl() {
    $("#currencylist li > .rq_icon").removeData("url");
}

function payrequest() {
    $(document).on("click", "#requestlist .req_actions .icon-qrcode, #requestlist .payrequest", function(e) {
        e.preventDefault();
        let thisnode = $(this);
        if (offline === true && thisnode.hasClass("isfiat")) {
            // do not trigger fiat request when offline because of unknown exchange rate
            notify("Unable to get exchange rate");
            return
        }
        let thisrequestlist = thisnode.closest("li.rqli"),
            rldata = thisrequestlist.data(),
            rl_payment = rldata.payment,
            rl_uoa = rldata.uoa,
            rl_status = rldata.status,
            rl_requesttype = rldata.requesttype,
            rl_amount = rldata.amount,
            rl_receivedamount = rldata.receivedamount,
            rl_fiatvalue = rldata.fiatvalue,
            rl_iscrypto = rldata.iscrypto,
            insufficient = (rl_status == "insufficient"),
            midstring = thisnode.attr("data-rel"),
            endstring = "&status=" + rl_status + "&type=" + rl_requesttype,
            amount_short_rounded = amountshort(rl_amount, rl_receivedamount, rl_fiatvalue, rl_iscrypto),
            paymenturl_amount = (insufficient === true) ? amount_short_rounded : rl_amount,
            lightning = rldata.lightning,
            d = (lightning && lightning.invoice) ? "&d=" + btoa(JSON.stringify({
                "imp": lightning.imp,
                "proxy": lightning.proxy_host,
                "nid": lightning.nid,
                "lid": lightning.pid
            })) : "",
            paymenturl = "?p=requests&payment=" + rl_payment + "&uoa=" + rl_uoa + "&amount=" + paymenturl_amount + midstring + endstring + d;
        openpage(paymenturl, "", "payment");
        return
    });
}

// ** UX **

function togglecurrency() {
    $(document).on("click", ".togglecurrency", function() {
        let parentlistitem = $(this).closest("li"),
            coindata = parentlistitem.data(),
            currency = coindata.currency,
            checked = coindata.checked,
            currencylistitem = get_homeli(currency);
        if (checked === true) {
            parentlistitem.attr("data-checked", "false").data("checked", false);
            currencylistitem.addClass("hide");
        } else {
            let lscurrency = br_get_local("cc_" + currency);
            if (lscurrency) {
                let addresslist = get_addresslist(currency),
                    addresscount = addresslist.find("li[data-checked='true']").length;
                if (addresscount == 0) {
                    addresslist.find("li[data-checked='false']").first().find(".toggleaddress").trigger("click");
                } else {
                    parentlistitem.attr("data-checked", "true").data("checked", true);
                    currencylistitem.removeClass("hide");
                }
            } else {
                addcurrency(coindata);
            }
        }
        savecurrencies(false);
    });
}

function toggleaddress() {
    $(document).on("click", ".toggleaddress", function() {
        let parentlistitem = $(this).closest("li"),
            checked = parentlistitem.data("checked"),
            parentlist = parentlistitem.closest("ul.pobox"),
            addresscount = parentlist.find("li[data-checked='true']").length,
            currency = parentlist.attr("data-currency");
        if (checked === true || checked == "true") {
            parentlistitem.attr("data-checked", "false").data("checked", false);
        } else {
            let a_dat = parentlistitem.data();
            if (parentlistitem.hasClass("seedu")) {
                let address = a_dat.address,
                    seedid = a_dat.seedid;
                if (addr_whitelist(address) === true) {} else {
                    let pass_dat = {
                            "address": address,
                            "pli": parentlistitem,
                            "seedid": seedid
                        },
                        content = get_address_warning("addresswarningcheck", address, pass_dat);
                    popdialog(content, "triggersubmit");
                    return
                }
            } else if (parentlistitem.hasClass("xpubu")) {
                let address = a_dat.address;
                if (addr_whitelist(address) === true) {} else {
                    let haspub = has_xpub(currency),
                        xpubid = a_dat.xpubid;
                    if (haspub === false || (haspub && haspub.key_id != xpubid)) {
                        let pass_dat = {
                                "address": address,
                                "pli": parentlistitem,
                                "xpubid": xpubid
                            },
                            content = get_address_warning("addresswarningcheck", address, pass_dat);
                        popdialog(content, "triggersubmit");
                        return
                    }
                }
            }
            parentlistitem.attr("data-checked", "true").data("checked", true);
        }
        saveaddresses(currency, false);
        check_currency(currency);
        clear_savedurl();
    });
}

function confirm_missing_seed_toggle() {
    $(document).on("click", "#addresswarningcheck .submit", function(e) {
        e.preventDefault();
        let thisdialog = $("#addresswarningcheck"),
            d_dat = thisdialog.data(),
            pk_checkbox = thisdialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked"),
            ds_checkbox = thisdialog.find("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (pk_checked == true) {} else {
            popnotify("error", "Confirm privatekey ownership");
            return
        }
        if (ds_checked == true) { // whitlist seed id
            add_address_whitelist(d_dat.address);
        }
        canceldialog();
        cmst_callback(d_dat.pli);
        return
    })
}

function cmst_callback(parentlistitem) {
    let parentlist = parentlistitem.closest("ul.pobox"),
        currency = parentlist.attr("data-currency");
    parentlistitem.attr("data-checked", "true").data("checked", true);
    check_currency(currency);
    saveaddresses(currency, false);
    clear_savedurl();
}

function add_seed_whitelist(seedid) {
    let stored_whitelist = br_get_local("swl", true),
        seed_whitelist = br_dobj(stored_whitelist);
    if ($.inArray(seedid, seed_whitelist) === -1) {
        seed_whitelist.push(seedid);
    }
    br_set_local("swl", seed_whitelist, true);
}

function seed_wl(seedid) {
    let stored_whitelist = br_get_local("swl", true),
        seed_whitelist = br_dobj(stored_whitelist);
    return ($.inArray(seedid, seed_whitelist) === -1) ? false : true;
}

function add_address_whitelist(address) {
    let stored_whitelist = br_get_local("awl", true),
        address_whitelist = br_dobj(stored_whitelist);
    if ($.inArray(address, address_whitelist) === -1) {
        address_whitelist.push(address);
    }
    br_set_local("awl", address_whitelist, true);
}

function addr_whitelist(address) {
    let stored_whitelist = br_get_local("awl", true),
        address_whitelist = br_dobj(stored_whitelist);
    return ($.inArray(address, address_whitelist) === -1) ? false : true;
}

function check_pk() {
    $(document).on("click", "#popup .cb_wrap", function() {
        let thisnode = $(this),
            checked = thisnode.data("checked");
        if (checked == true) {
            thisnode.attr("data-checked", "false").data("checked", false);
        } else {
            thisnode.attr("data-checked", "true").data("checked", true);
        }
    });
}

function check_currency(currency) {
    let addresscount = filter_addressli(currency, "checked", true).length;
    if (addresscount > 0) {
        currency_check(currency);
        return
    }
    currency_uncheck(currency);
}

function currency_check(currency) {
    let currencylistitem = get_homeli(currency),
        parentcheckbox = get_currencyli(currency);
    currencylistitem.removeClass("hide");
    parentcheckbox.attr("data-checked", "true").data("checked", true);
    savecurrencies(false);
}

function currency_uncheck(currency) {
    let currencylistitem = get_homeli(currency),
        parentcheckbox = get_currencyli(currency);
    currencylistitem.addClass("hide");
    parentcheckbox.attr("data-checked", "false").data("checked", false);
    savecurrencies(false);
}

function toggleswitch() {
    $(document).on("mousedown", ".switchpanel.global", function() {
        let thistoggle = $(this);
        if (thistoggle.hasClass("true")) {
            thistoggle.removeClass("true").addClass("false");
        } else {
            thistoggle.removeClass("false").addClass("true");
        }
    })
}

// ** Selectbox **

function showselect() {
    $(document).on("click", ".selectarrows", function() {
        let options = $(this).next(".options");
        if (options.hasClass("showoptions")) {
            options.removeClass("showoptions");
        } else {
            options.addClass("showoptions");
        }
    });
}

function selectbox() {
    $(document).on("click", ".selectbox > input:not([readonly])", function() {
        let thisselect = $(this),
            thisvalue = thisselect.val(),
            options = thisselect.parent(".selectbox").find(".options span");
        if (options.hasClass("show")) {
            options.removeClass("show");
        } else {
            options.filter(function() {
                return $(this).text() != thisvalue;
            }).addClass("show");
        }
    })
}

function pickselect() {
    $(document).on("click", ".selectbox > .options span", function() {
        let thisselect = $(this),
            thisvalue = thisselect.text(),
            thisdata = thisselect.data(),
            selectbox = thisselect.closest(".selectbox"),
            thisinput = selectbox.children("input");
        thisinput.val(thisvalue).data(thisdata);
        selectbox.find(".options").removeClass("showoptions").children("span").removeClass("show");
    })
}

function closeselectbox() {
    $("#popup .selectbox .options").removeClass("showoptions");
}

function radio_select() {
    $(document).on("click", ".formbox .pick_conf", function() {
        let thistrigger = $(this),
            thisradio = thistrigger.find(".radio");
        if (thisradio.hasClass("icon-radio-unchecked")) {
            $(".formbox .conf_options .radio").not(thisradio).removeClass("icon-radio-checked2").addClass("icon-radio-unchecked")
            thisradio.removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
        } else {
            thisradio.removeClass("icon-radio-checked2").addClass("icon-radio-unchecked");
        }
        let thisvalue = thistrigger.children("span").text(),
            thisinput = $(".formbox input:first");
        thisinput.val(thisvalue);
    })
}

function dialog_drawer() {
    $(document).on("click", "#ad_info_wrap .d_trigger", function() {
        let thistrigger = $(this),
            drawer = thistrigger.next(".drawer2");
        if (drawer.is(":visible")) {
            drawer.slideUp(200);
        } else {
            drawer.slideDown(200);
            $(".drawer2").not(drawer).slideUp(200);
        }
    })
}

// ** Reorder Adresses **

function dragstart() {
    $(document).on("mousedown touchstart", ".currentpage .applist li .popoptions", function(e) {
        e.preventDefault();
        let this_drag = $(this),
            addresses = this_drag.closest(".applist").find("li");
        if (addresses.length < 2) {
            return
        }
        let thisli = this_drag.closest("li"),
            dialogheight = thisli.height(),
            startheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
        drag(thisli, dialogheight, startheight, thisli.index());
    })
}

function drag(thisli, dialogheight, startheight, thisindex) {
    $(document).on("mousemove touchmove", ".currentpage .applist li", function(e) {
        e.preventDefault();
        thisli.addClass("dragging");
        html.addClass("dragmode");
        let currentheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY,
            dragdistance = currentheight - startheight;
        thisli.addClass("dragging").css({
            "-webkit-transform": "translate(0, " + dragdistance + "px)"
        });
        $(".currentpage .applist li").not(thisli).each(function(i) {
            let this_li = $(this),
                thisoffset = this_li.offset().top,
                thisheight = this_li.height(),
                hoverpoint = thisoffset + (thisheight / 2),
                dragup = (i + 1 > thisindex) ? true : false;
            if (dragup === true) {
                if (currentheight > hoverpoint) {
                    this_li.css({
                        "-webkit-transform": "translate(0, -" + dialogheight + "px)"
                    }).addClass("hovered")
                    thisli.addClass("after").removeClass("before");
                } else {
                    this_li.css({
                        "-webkit-transform": "translate(0, 0)"
                    }).removeClass("hovered")
                }
            } else {
                if (currentheight < hoverpoint) {
                    this_li.css({
                        "-webkit-transform": "translate(0, " + dialogheight + "px)"
                    }).addClass("hovered")
                    thisli.addClass("before").removeClass("after");
                } else {
                    this_li.css({
                        "-webkit-transform": "translate(0, 0)"
                    }).removeClass("hovered")
                }
            }
        });
    })
}

function dragend() {
    $(document).on("mouseup mouseleave touchend", ".currentpage .applist li", function() {
        $(document).off("mousemove touchmove", ".currentpage .applist li");
        let thisunit = $(this).closest("li");
        if (thisunit.hasClass("dragging")) {
            if (thisunit.hasClass("before")) {
                thisunit.insertBefore(".hovered:first");
                saveaddresses(geturlparameters().p, false);
            } else if (thisunit.hasClass("after")) {
                thisunit.insertAfter(".hovered:last");
                saveaddresses(geturlparameters().p, false);
            }
            thisunit.removeClass("before after dragging").attr("style", "");
            $(".currentpage .applist li").removeClass("hovered").attr("style", "");
            html.removeClass("dragmode");
            clear_savedurl();
        }
    })
}

function keyup() {
    $(document).keyup(function(e) {
        if (e.keyCode == 39) { // ArrowRight
            if (body.hasClass("showstartpage")) {
                e.preventDefault();
                startnext($(".panelactive"));
                return
            }
            if (paymentdialogbox.find("input").is(":focus")) {
                playsound(funk);
                return
            }
            let timelapsed = now() - sa_timer;
            if (timelapsed < 500) { // prevent clicking too fast
                playsound(funk);
                return
            }
            paymentpopup.removeClass("flipping");
            if (paymentdialogbox.hasClass("flipped")) {
                flip_right2();
                setTimeout(function() {
                    paymentpopup.addClass("flipping");
                    paymentdialogbox.css("-webkit-transform", "");
                }, 400);
                return
            }
            if (paymentdialogbox.hasClass("norequest") && (paymentdialogbox.attr("data-pending") == "ispending" || (offline === true))) {
                playsound(funk);
                return
            }
            flip_right1();
            sa_timer = now();
            return
        }
        if (e.keyCode == 37) { // ArrowLeft
            if (body.hasClass("showstartpage")) {
                e.preventDefault();
                startprev($(".panelactive"));
                return
            }
            if (paymentdialogbox.find("input").is(":focus")) {
                playsound(funk);
                return
            }
            let timelapsed = now() - sa_timer;
            if (timelapsed < 500) { // prevent clicking too fast
                playsound(funk);
                return
            }
            paymentpopup.removeClass("flipping");
            if (paymentdialogbox.hasClass("flipped")) {
                flip_left2();
                return
            }
            if (paymentdialogbox.hasClass("norequest") && (paymentdialogbox.attr("data-pending") == "ispending" || (offline === true))) {
                playsound(funk);
                return
            }
            flip_left1();
            setTimeout(function() {
                paymentpopup.addClass("flipping");
                paymentdialogbox.css("-webkit-transform", "rotateY(180deg)");
            }, 400);
            sa_timer = now();
            return
        }
        if (e.keyCode == 27) { // Escape
            escapeandback();
            return
        }
        if (e.keyCode == 13) { // Enter
            if ($("#popup").hasClass("active")) {
                $("#popup #execute").trigger("click");
            }
            return
        }
    });
}

function escapeandback() {
    if (body.hasClass("showcam")) {
        window.history.back();
        return
    }
    if ($("#loader").hasClass("active")) {
        closeloader();
        return
    }
    if ($("#notify").hasClass("popup")) {
        closenotify();
        return
    }
    if ($("#popup .selectbox .options").hasClass("showoptions")) {
        closeselectbox();
        return
    }
    if ($("#popup").hasClass("active")) {
        canceldialog();
        return
    }
    if ($("#sharepopup").hasClass("active")) {
        cancelsharedialog();
        return
    }
    if ($("#optionspop").hasClass("active")) {
        canceloptions();
        return
    }
    if (body.hasClass("seed_dialog")) {
        hide_seed_panel();
        return
    }
    if (body.hasClass("showstartpage")) {
        startprev($(".panelactive"));
    }
    if (paymentpopup.hasClass("active")) {
        if (paymentdialogbox.hasClass("flipped") && paymentdialogbox.hasClass("norequest")) {
            remove_flip();
        } else {
            if (request) {
                if (request.received === true) {
                    close_paymentdialog();
                } else {
                    cpd_pollcheck();
                }
            } else {
                close_paymentdialog();
            }
        }
        return
    } else {
        window.history.back();
    }
}

function close_paymentdialog(empty) {
    if (request) {
        if (empty === true && inframe === false && request.requesttype == "local") {
            let currency = request.payment,
                address = request.address,
                ls_recentrequests = br_get_local("recent_requests", true),
                lsrr_arr = br_dobj(ls_recentrequests, true),
                request_dat = {
                    "currency": currency,
                    "cmcid": request.cmcid,
                    "ccsymbol": request.currencysymbol,
                    "address": address,
                    "erc20": request.erc20,
                    "rqtime": request.rq_init
                };
            lsrr_arr[currency] = request_dat;
            br_set_local("recent_requests", lsrr_arr, true);
            closeloader();
            toggle_rr(true);
            let rr_whitelist = br_get_session("rrwl", true);
            if (rr_whitelist) {
                if (rr_whitelist && rr_whitelist[currency] == address) {
                    continue_cpd();
                    return
                }
            }
            payment_lookup(request_dat);
            return
        }
    }
    continue_cpd();
}

function continue_cpd() {
    if (html.hasClass("firstload")) {
        let gets = geturlparameters(),
            pagename = gets.p,
            set_pagename = (pagename) ? pagename : "home";
        openpage("?p=" + set_pagename, set_pagename, "loadpage");
        return
    }
    window.history.back();
}

function payment_lookup(request_dat) {
    if ($("#dismiss").length) {
        return false;
    }
    let currency = request.payment,
        blockexplorer = get_blockexplorer(currency),
        bu_url = blockexplorer_url(currency, false, request_dat.erc20) + request_dat.addres,
        content = "<div class='formbox'>\
            <h2 class='icon-warning'><span class='icon-qrcode'/>No payment detected</h2>\
            <div id='ad_info_wrap'>\
                <p><strong><a href='" + bu_url + "' target='_blank' class='ref check_recent'>Look for recent incoming " + currency + " payments on " + blockexplorer + " <span class='icon-new-tab'></a></strong></p>\
                <div class='pk_wrap noselect'>\
                    <div id='dontshowwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div>\
                    <span>Don't show again</span>\
                </div>\
            </div>\
            <div id='backupactions'>\
                <div id='dismiss' class='customtrigger'>DISMISS</div>\
            </div>\
            </div>";
    popdialog(content, "triggersubmit");
}

function check_recent() {
    $(document).on("click", ".check_recent", function(e) {
        e.preventDefault();
        let thisnode = $(this),
            thisurl = thisnode.attr("href"),
            result = confirm("Open " + thisurl + "?");
        if (result === true) {
            open_share_url("location", thisurl);
        }
        return
    })
}

function dismiss_payment_lookup() {
    $(document).on("click", "#dismiss", function() {
        let ds_checkbox = $("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (ds_checked == true) {
            block_payment_lookup();
        }
        canceldialog();
        if (paymentpopup.hasClass("active")) {
            close_paymentdialog();
        }
    })
}

function block_payment_lookup() {
    if (request) {
        let rr_whitelist = br_get_session("rrwl", true),
            rrwl_arr = br_dobj(rr_whitelist, true);
        rrwl_arr[request.payment] = request.address;
        br_set_session("rrwl", rrwl_arr, true);
    }
}

function request_history() {
    $(document).on("click", "#request_history", function() {
        let ls_recentrequests = br_get_local("recent_requests", true);
        if (ls_recentrequests) {
            recent_requests(ls_recentrequests);
        }
    })
}

function recent_requests(recent_payments) {
    let addresslist = recent_requests_list(recent_payments);
    if (addresslist.length) {
        let content = "<div class='formbox'>\
            <h2 class='icon-history'>Recent requests:</h2>\
            <div id='ad_info_wrap'>\
            <ul>" + addresslist + "</ul>\
            </div>\
            <div id='backupactions'>\
                <div id='dismiss' class='customtrigger'>CANCEL</div>\
            </div>\
            </div>";
        popdialog(content, "triggersubmit");
    }
}

function recent_requests_list(recent_payments) {
    let addresslist = "",
        rp_array = [];
    $.each(recent_payments, function(key, val) {
        if (val) {
            rp_array.push(val);
        }
    });
    let sorted_array = rp_array.sort(function(x, y) {
        return y.rqtime - x.rqtime;
    });
    $.each(sorted_array, function(i, val) {
        if (val) {
            let currency = val.currency,
                ccsymbol = val.ccsymbol,
                address = val.address,
                cmcid = val.cmcid,
                erc20 = val.erc20,
                rq_time = val.rqtime,
                blockchainurl = blockexplorer_url(currency, false, erc20) + address;
            addresslist += "<li class='rp_li'>" + getcc_icon(cmcid, ccsymbol + "-" + currency, erc20) + "<strong style='opacity:0.5'>" + short_date(rq_time + timezone) + "</strong><br/>\
            <a href='" + blockchainurl + "' target='_blank' class='ref check_recent'>\
            <span class='select'>" + address + "</span> <span class='icon-new-tab'></a></li>";
        }
    });
    return addresslist;
}

//notifications
function notify(message, time, showbutton) {
    let settime = (time) ? time : 4000,
        setbutton = (showbutton) ? showbutton : "no",
        notify = $("#notify");
    $("#notifysign").html(message + "<span class='icon-cross'></div>").attr("class", "button" + setbutton);
    notify.addClass("popupn");
    let timeout = setTimeout(function() {
        closenotify();
    }, settime, function() {
        clearTimeout(timeout);
    });
}

function closenotifytrigger() {
    $(document).on("click", "#notify .icon-cross", function() {
        closenotify()
    });
}

function closenotify() {
    $("#notify").removeClass("popupn");
}

function topnotify(message) {
    let topnotify = $("#topnotify");
    topnotify.text(message).addClass("slidedown");
    let timeout = setTimeout(function() {
        topnotify.removeClass("slidedown");
    }, 7000, function() {
        clearTimeout(timeout);
    });
}

function popnotify(result, message) { // notifications in dialogs
    let notify = $(".popnotify");
    if (result == "error") {
        notify.removeClass("success warning").addClass("error");
    } else if (result == "warning") {
        notify.removeClass("success error").addClass("warning");
    } else {
        notify.addClass("success").removeClass("error warning");
    }
    notify.slideDown(200).html(message);
    let timeout = setTimeout(function() {
        notify.slideUp(200);
    }, 6000, function() {
        clearTimeout(timeout);
    });
}

//dialogs
function popdialog(content, functionname, trigger, custom, replace) {
    if (custom) {
        $("#popup #actions").addClass("custom");
    }
    if (replace) {
        $("#dialogbody").html(content);
    } else {
        $("#dialogbody").append(content);
    }
    body.addClass("blurmain");
    $("#popup").addClass("active showpu");
    let thistrigger = (trigger) ? trigger : $("#popup #execute");
    if (functionname) {
        execute(thistrigger, functionname);
    }
    if (supportsTouch === true) {} else {
        $("#dialogbody input:first").focus();
    }
}

function execute(trigger, functionname) {
    $(document).on("click", "#execute", function(e) {
        e.preventDefault();
        eval(functionname + "(trigger)");
        return
    })
}

function addcurrencytrigger() {
    $(document).on("click", ".addcurrency", function() {
        addcurrency($(this).closest("li").data());
    })
}

function addcurrency(cd) {
    let currency = cd.currency;
    if (get_addresslist(currency).children("li").length) {
        derive_first_check(currency);
        loadpage("?p=" + currency);
        return
    }
    let can_derive = derive_first_check(currency);
    if (can_derive === true) {
        loadpage("?p=" + currency);
        return
    }
    if (is_viewonly() === true) {
        vu_block();
        return
    }
    addaddress(cd, false);
}

function derive_first_check(currency) {
    if (hasbip32(currency) === true) {
        let derives = check_derivations(currency);
        if (derives) {
            let has_derives = active_derives(currency, derives);
            if (has_derives === false) {
                derive_addone(currency);
                return true;
            }
        }
    }
    return false;
}

function addaddresstrigger() {
    $(document).on("click", ".addaddress", function() {
        addaddress($("#" + $(this).attr("data-currency")).data(), false);
    })
}

function addaddress(ad, edit) {
    let currency = ad.currency,
        cpid = ad.ccsymbol + "-" + currency,
        address = (ad.address) ? ad.address : "",
        label = (ad.label) ? ad.label : "",
        derived = (ad.seedid || ad.xpubid),
        readonly = (edit === true) ? " readonly" : "",
        nopub = (test_derive === false) ? true : (is_xpub(currency) === false || has_xpub(currency) !== false),
        choose_wallet_str = "<span id='get_wallet' class='address_option' data-currency='" + currency + "'>I don't have a " + currency + " address yet</span>",
        derive_seed_str = "<span id='option_makeseed' class='address_option' data-currency='" + currency + "'>Generate address from secret phrase</span>",
        options = (hasbip === true) ? choose_wallet_str : (test_derive === true && c_derive[currency]) ? (hasbip32(currency) === true) ? derive_seed_str : choose_wallet_str : choose_wallet_str,
        pnotify = (body.hasClass("showstartpage")) ? "<div class='popnotify' style='display:block'>" + options + "</div>" : "<div class='popnotify'></div>",
        scanqr = (hascam === true && edit === false) ? "<div class='qrscanner' data-currency='" + currency + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        title = (edit === true) ? "<h2 class='icon-pencil'>Edit label</h2>" : "<h2>" + getcc_icon(ad.cmcid, cpid, ad.erc20) + " Add " + currency + " address</h2>",
        pk_checkbox = (edit === true) ? "" : "<div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>I own the seed / private key of this address</span></div>",
        addeditclass = (edit === true) ? "edit" : "add",
        xpubclass = (nopub) ? " hasxpub" : " noxpub",
        xpubph = (nopub) ? "Enter a " + currency + " address" : "Address / Xpub",
        vk_val = (ad.vk) ? ad.vk : "",
        has_vk = (vk_val != ""),
        scanvk = (hascam === true) ? "<div class='qrscanner' data-currency='" + currency + "' data-id='viewkey' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        vk_box = (currency == "monero") ? (has_vk) ? "" : "<div class='inputwrap'><input type='text' class='vk_input' value='" + vk_val + "' placeholder='View key'>" + scanvk + "</div>" : "",
        content = $("<div class='formbox form" + addeditclass + xpubclass + "' id='addressformbox'>" + title + pnotify + "<form id='addressform' class='popform'><div class='inputwrap'><input type='text' id='address_xpub_input' class='address' value='" + address + "' data-currency='" + currency + "' placeholder='" + xpubph + "'" + readonly + ">" + scanqr + "</div>" + vk_box + "<input type='text' class='addresslabel' value='" + label + "' placeholder='label'>\
        <div id='ad_info_wrap' style='display:none'>\
            <ul class='td_box'>\
            </ul>\
            <div id='pk_confirm' class='noselect'>\
                <div id='matchwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>The above addresses match those in my " + currency + " wallet</span>\
            </div>\
        </div>" + pk_checkbox +
            "<input type='submit' class='submit' value='OK'></form>").data(ad);
    popdialog(content, "triggersubmit");
    if (supportsTouch === true) {
        return
    }
    if (edit === true) {
        $("#popup input.addresslabel").focus().select();
        return
    }
    $("#popup input.address").focus();
}

function address_xpub_change() {
    $(document).on("input", "#addressformbox.noxpub #address_xpub_input", function(e) {
        let thisnode = $(this),
            addressinputval = thisnode.val();
        if (addressinputval.length > 103) {
            let currency = thisnode.attr("data-currency"),
                valid = check_xpub(addressinputval, xpub_prefix(currency), currency);
            if (valid === true) {
                clear_xpub_checkboxes();
                validate_xpub(thisnode.closest("#addressformbox"));
                return
            }
            xpub_fail(currency);
            return
        }
        clear_xpub_inputs();
    })
}

function active_derives(currency, derive) {
    let addresslist = get_addresslist(currency).children("li");
    if (addresslist.length < 1) {
        return false;
    }
    let coinsettings = activecoinsettings(currency);
    if (coinsettings) {
        let reuse = coinsettings["Reuse address"];
        if (reuse) {
            if (reuse.selected === true) {
                return true;
            }
        } else {
            return true;
        }
    }
    if (derive == "seed") {
        let active_sder = filter_list(addresslist, "seedid", bipid).not(".used");
        if (active_sder.length) {
            let check_p = ch_pending(active_sder.first().data());
            if (check_p === true) {
                return false;
            }
        } else {
            return false;
        }
    }
    if (derive == "xpub") {
        let activepub = active_xpub(currency),
            xpubid = activepub.key_id,
            active_xder = filter_list(addresslist, "xpubid", xpubid).not(".used");
        if (active_xder.length) {
            let check_p = ch_pending(active_xder.first().data());
            if (check_p === true) {
                return false;
            }
        } else {
            return false;
        }
    }
    return true
}

function get_wallet() {
    $(document).on("click", "#get_wallet", function() {
        let this_currency = $(this).attr("data-currency");
        canceldialog();
        setTimeout(function() {
            download_wallet(this_currency);
        }, 800);
    })
}

function submitaddresstrigger() {
    $(document).on("click", "#addressformbox input.submit", function(e) {
        e.preventDefault();
        let thisform = $(this).closest("#addressformbox");
        if (thisform.hasClass("hasxpub")) {
            validateaddress_vk(thisform.data());
            return
        }
        let addressinput = thisform.find(".address"),
            ad_val = addressinput.val();
        if (ad_val.length > 103) {
            validate_xpub(thisform);
            return
        }
        validateaddress_vk(thisform.data());
        return
    })
}

// Connect lightning node
function add_lightning() {
    $(document).on("click", "#connectln", function() {
        lm_function();
        return
    })
}

//Add erc20 token
function add_erc20() {
    $(document).on("click", "#add_erc20, #choose_erc20", function() {
        let tokenobject = br_get_local("erc20tokens", true),
            tokenlist = "";
        $.each(tokenobject, function(key, value) {
            tokenlist += "<span data-id='" + value.cmcid + "' data-currency='" + value.name + "' data-ccsymbol='" + value.symbol.toLowerCase() + "' data-contract='" + value.contract + "' data-pe='none'>" + value.symbol + " | " + value.name + "</span>";
        });
        let nodedata = {
                "erc20": true,
                "monitored": true,
                "checked": true
            },
            scanqr = (hascam === true) ? "<div class='qrscanner' data-currency='ethereum' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
            content = $("\
            <div class='formbox' id='erc20formbox'>\
                <h2 class='icon-coin-dollar'>Add erc20 token</h2>\
                <div class='popnotify'></div>\
                <form id='addressform' class='popform'>\
                    <div class='selectbox'>\
                        <input type='text' value='' placeholder='Pick erc20 token' id='ac_input'/>\
                        <div class='selectarrows icon-menu2' data-pe='none'></div>\
                        <div id='ac_options' class='options'>" + tokenlist + "</div>\
                    </div>\
                    <div id='erc20_inputs'>\
                    <div class='inputwrap'><input type='text' class='address' value='' placeholder='Enter a address'/>" + scanqr + "</div>\
                    <input type='text' class='addresslabel' value='' placeholder='label'/>\
                    <div id='pk_confirm' class='noselect'>\
                        <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'>\
                            <span class='checkbox'></span>\
                        </div>\
                        <span>I own the seed / private key of this address</span>\
                    </div></div>\
                    <input type='submit' class='submit' value='OK'/>\
                </form></div>").data(nodedata);
        popdialog(content, "triggersubmit");
    })
}

function autocomplete_erc20token() {
    $(document).on("input", "#ac_input", function() {
        let thisinput = $(this),
            thisform = thisinput.closest("form");
        thisform.removeClass("validated");
        let thisvalue = thisinput.val().toLowerCase(),
            options = thisform.find(".options");
        $("#ac_options > span").each(function(i) {
            let thisoption = $(this);
            thisoption.removeClass("show");
            let thistext = thisoption.text(),
                currency = thisoption.attr("data-currency"),
                currencysymbol = thisoption.attr("data-ccsymbol"),
                contract = thisoption.attr("data-contract"),
                thisid = thisoption.attr("data-id");
            if (thisvalue.length > 2 && currencysymbol === thisvalue || currency === thisvalue) {
                thisform.addClass("validated");
                let coin_data = {
                    "cmcid": thisid,
                    "currency": currency,
                    "ccsymbol": currencysymbol,
                    "contract": contract
                }
                thisinput.val(thistext)[0].setSelectionRange(0, 999);
                initaddressform(coin_data);
            } else if (currencysymbol.match("^" + thisvalue) || currency.match("^" + thisvalue)) {
                thisoption.addClass("show");
            }
        });
    })
}

function pickerc20select() {
    $(document).on("click", "#erc20formbox .selectbox > #ac_options span", function() {
        let thisselect = $(this),
            coin_data = {
                "cmcid": thisselect.attr("data-id"),
                "currency": thisselect.attr("data-currency"),
                "ccsymbol": thisselect.attr("data-ccsymbol"),
                "contract": thisselect.attr("data-contract")
            };
        initaddressform(coin_data);
    })
}

function initaddressform(coin_data) {
    let erc20formbox = $("#erc20formbox"),
        erc20_inputs = erc20formbox.find("#erc20_inputs"),
        addressfield = erc20formbox.find("input.address"),
        labelfield = erc20formbox.find("input.addresslabel");
    addressfield.add(labelfield).val("");
    erc20formbox.data(coin_data);
    addressfield.attr("placeholder", "Enter a " + coin_data.currency + " address");
    if (erc20_inputs.is(":visible")) {} else {
        erc20_inputs.slideDown(300);
        addressfield.focus();
    }
}

function submit_erc20() {
    $(document).on("click", "#erc20formbox input.submit", function(e) {
        e.preventDefault();
        validateaddress_vk($("#erc20formbox").data());
    });
}

function validateaddress_vk(ad) {
    let currency = ad.currency,
        addressfield = $("#addressform .address"),
        addressinputval = addressfield.val();
    if (addressinputval) {} else {
        let errormessage = "Enter a " + currency + " address";
        popnotify("error", errormessage);
        addressfield.focus();
        return
    }
    if (currency) {
        let vkfield = $("#addressform .vk_input"),
            vkinputval = (currency == "monero") ? (vkfield.length) ? vkfield.val() : 0 : 0,
            vklength = vkinputval.length;
        if (vklength) {
            if (vklength !== 64) {
                popnotify("error", "Invalid Viewkey");
                return
            }
            if (check_vk(vkinputval)) {} else {
                popnotify("error", "Invalid Viewkey");
                return
            }
            let valid = check_address(addressinputval, currency);
            if (valid === true) {} else {
                let errormessage = addressinputval + " is NOT a valid " + currency + " address";
                popnotify("error", errormessage);
                return
            }
            let payload = {
                "address": addressinputval,
                "view_key": vkinputval,
                "create_account": true,
                "generated_locally": false
            };
            api_proxy({
                "api": "mymonero api",
                "search": "login",
                "cachetime": 25,
                "cachefolder": "1h",
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(payload),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(e) {
                let data = br_result(e).result,
                    errormessage = data.Error;
                if (errormessage) {
                    let error = (errormessage) ? errormessage : "Invalid Viewkey";
                    popnotify("error", error);
                    return
                }
                let start_height = data.start_height;
                if (start_height > -1) { // success!
                    validateaddress(ad, vkinputval);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                popnotify("error", "Error verifying Viewkey");
            });
            return
        }
        validateaddress(ad, false);
        return
    }
    popnotify("error", "Pick a currency");
}

function validateaddress(ad, vk) {
    let currency = ad.currency,
        iserc20 = (ad.erc20 === true),
        currencycheck = (iserc20 === true) ? "ethereum" : currency,
        ccsymbol = ad.ccsymbol,
        addressfield = $("#addressform .address"),
        addressinputvalue = addressfield.val(),
        addressinputval = (currency == "nimiq") ? addressinputvalue.replace(/\s/g, "") : addressinputvalue,
        currentaddresslist = get_addresslist(currency),
        getindex = currentaddresslist.children("li").length + 1,
        index = (getindex > 1) ? getindex : 1,
        labelfield = $("#addressform .addresslabel"),
        labelinput = labelfield.val(),
        labelinputval = (labelinput) ? labelinput : "";
    if (addressinputval) {
        let addinputval = (currency == "bitcoin-cash" && addressinputval.indexOf(":") > -1) ? addressinputval.split(":").pop() : addressinputval,
            addressduplicate = (filter_addressli(currency, "address", addinputval).length > 0),
            address = ad.address,
            label = ad.label;
        if (addressduplicate === true && address !== addinputval) {
            popnotify("error", "address already exists");
            addressfield.select();
            return
        }
        if (addinputval == new_address) { // prevent double address entries
            console.log("already added");
            return
        }
        let valid = check_address(addinputval, currencycheck);
        if (valid === true) {
            let validlabel = check_address(labelinputval, currencycheck);
            if (validlabel === true) {
                popnotify("error", "invalid label");
                labelfield.val(label).select();
                return
            }
            if ($("#addressformbox").hasClass("formedit")) {
                let currentlistitem = currentaddresslist.children("li[data-address='" + address + "']"),
                    ed = {};
                ed.label = labelinputval;
                if (vk) {
                    ed.vk = vk;
                }
                currentlistitem.data(ed).attr("data-address", addinputval);
                currentlistitem.find(".atext h2 > span").text(labelinputval);
                currentlistitem.find(".atext p.address").text(addinputval);
                saveaddresses(currency, true);
                canceldialog();
                canceloptions();
                return
            }
            let pk_checkbox = $("#pk_confirmwrap"),
                pk_checked = pk_checkbox.data("checked");
            if (pk_checked == true) {
                if (index === 1) {
                    if (iserc20 === true) {
                        buildpage(ad, true);
                        append_coinsetting(currency, br_config.erc20_dat.settings, false);
                    }
                    if (body.hasClass("showstartpage")) {
                        let acountname = $("#eninput").val();
                        $("#accountsettings").data("selected", acountname).find("p").text(acountname);
                        savesettings();
                        let href = "?p=home&payment=" + currency + "&uoa=" + ccsymbol + "&amount=0" + "&address=" + addinputval;
                        br_set_local("editurl", href); // to check if request is being edited
                        openpage(href, "create " + currency + " request", "payment");
                        body.removeClass("showstartpage");
                    } else {
                        loadpage("?p=" + currency);
                    }
                }
                new_address = addinputval + currency;
                ad.address = addinputval,
                    ad.label = labelinputval,
                    ad.a_id = ccsymbol + index,
                    ad.vk = vk,
                    ad.checked = true;
                appendaddress(currency, ad);
                saveaddresses(currency, true);
                currency_check(currency);
                canceldialog();
                canceloptions();
                clear_savedurl();
                return
            }
            popnotify("error", "Confirm privatekey ownership");
            return
        }
        popnotify("error", addressinputval + " is NOT a valid " + currency + " address");
        setTimeout(function() {
            addressfield.select();
        }, 10);
        return
    }
    popnotify("error", "Enter a " + currency + " address");
    addressfield.focus();
}

function check_address(address, currency) {
    let regex = getcoindata(currency).regex;
    return (regex) ? new RegExp(regex).test(address) : false;
}

function check_vk(vk) {
    return new RegExp("^[a-fA-F0-9]+$").test(vk);
}

function send_trigger() {
    $(document).on("click", ".send", function() {
        if (hasbip === true) {
            compatible_wallets($(this).attr("data-currency"));
            return
        }
        playsound(funk);
    })
}

function showbip39_trigger() {
    $(document).on("click", ".show_bip39", function() {
        all_pinpanel({
            "func": manage_bip32
        });
        canceldialog();
    })
}

function canceldialog_click() {
    $(document).on("click", ".cancel_dialog", function() {
        canceldialog();
    })
}

function canceldialogtrigger() {
    $(document).on("click", "#popup", function(e) {
        let target = e.target,
            jtarget = $(target),
            target_id = jtarget.attr("id"),
            options = $("#dialog").find(".options");
        if (options.length > 0 && options.hasClass("showoptions")) {
            let pointerevent = jtarget.attr("data-pe");
            if (pointerevent == "none") {} else {
                options.removeClass("showoptions");
            }
            return
        }
        if (target == this || target_id == "canceldialog") {
            canceldialog();
        }
    });
}

function canceldialog(pass) {
    if (inframe === true) {
        if (pass === true) {} else {
            if ($("#contactformbox").length > 0) {
                return false;
            }
        }
    }
    let popup = $("#popup");
    body.removeClass("blurmain themepu");
    popup.removeClass("active");
    let timeout = setTimeout(function() {
        popup.removeClass("showpu");
        $("#dialogbody").html("");
        $("#actions").removeClass("custom");
        $(document).off("click", "#execute");
        // reset Globals
        s_id = null;
    }, 600, function() {
        clearTimeout(timeout);
    });
    if (request) { // reset after_poll
        request.rq_timer = now();
    }
}

function blockcancelpaymentdialog() {
    $(document).on("mousedown", "#payment", function(e) {
        blockswipe = false;
        if (e.target == this) {
            let inputs = paymentdialogbox.find("input");
            if (inputs.is(":focus")) {
                blockswipe = true;
            }
        }
    })
}

function cancelpaymentdialogtrigger() {
    $(document).on("mouseup", "#payment", function(e) {
        if (blockswipe === true) {
            unfocus_inputs();
            return
        }
        if (html.hasClass("flipmode")) { // prevent closing request when flipping
            return
        }
        let timelapsed = now() - cp_timer;
        if (timelapsed < 1500) { // prevent clicking too fast
            playsound(funk);
            console.log("clicking too fast");
            return
        }
        if (e.target == this) {
            escapeandback();
            cp_timer = now();
        }
    });
}

function unfocus_inputs() {
    let inputs = paymentdialogbox.find("input");
    inputs.blur();
}

function cpd_pollcheck() {
    if (paymentdialogbox.attr("data-lswitch") == "lnd_ao") {
        close_paymentdialog();
        return
    }
    if (request) {
        if (request.received !== true) {
            let rq_init = request.rq_init,
                rq_timer = request.rq_timer,
                rq_time = now() - rq_timer;
            if (rq_time > after_poll_timeout) {
                after_poll(rq_init);
                return
            }
        }
    }
    close_paymentdialog();
}

function cancelpaymentdialog() {
    if (html.hasClass("hide_app")) {
        closeloader();
        parent.postMessage("close_request", "*");
        return
    }
    paymentpopup.removeClass("active");
    html.removeClass("blurmain_payment");
    let timeout = setTimeout(function() {
        paymentpopup.removeClass("showpu outgoing");
        html.removeClass("paymode firstload");
        $(".showmain #mainwrap").css("-webkit-transform", "translate(0, 0)"); // restore fake scroll position
        $(".showmain").closest(document).scrollTop(scrollposition); // restore real scroll position
        remove_flip(); // reset request facing front
        paymentdialogbox.html(""); // remove html
        clearTimeout(timeout);
    }, 600);
    closeloader();
    clearTimeout(request_timer);
    clearpinging();
    closenotify();
    sleep();
    abort_ndef();
    lnd_ph = false,
        request = null,
        helper = null;
    let wstimeout = setTimeout(function() {
        closesocket();
    }, 2500, function() {
        clearTimeout(wstimeout);
    });
}

function closesocket(s_id) {
    if (s_id) { // close this socket
        if (sockets[s_id]) {
            sockets[s_id].close();
            delete sockets[s_id];
        }
    } else { // close all sockets
        $.each(sockets, function(key, value) {
            value.close();
        });
        sockets = {};
    }
    txid = null;
}

function forceclosesocket() {
    console.log("force close");
    clearpinging();
    closesocket();
}

function clearpinging(s_id) {
    if (s_id) { // close this interval
        if (pinging[s_id]) {
            clearInterval(pinging[s_id]);
            delete pinging[s_id]
        }
        return
    }
    if ($.isEmptyObject(pinging)) {} else {
        $.each(pinging, function(key, value) {
            clearInterval(value);
        });
        pinging = {};
    }
}

function cancelsharedialogtrigger() {
    $(document).on("click", "#sharepopup", function(e) {
        if (e.target == this) {
            cancelsharedialog();
        }
    });
}

function cancelsharedialog() {
    let sharepopup = $("#sharepopup");
    sharepopup.removeClass("active");
    body.removeClass("sharemode");
    let timeout = setTimeout(function() {
        sharepopup.removeClass("showpu");
    }, 500, function() {
        clearTimeout(timeout);
    });
}

function showoptionstrigger() {
    $(document).on("click", ".popoptions", function(e) {
        let ad = $(this).closest("li").data(),
            address = ad.address;
        if (address == "lnurl") {
            playsound(funk);
            return
        }
        let savedrequest = $("#requestlist li[data-address='" + address + "']"),
            showrequests = (savedrequest.length > 0) ? "<li><div class='showrequests'><span class='icon-qrcode'></span> Show requests</div></li>" : "",
            newrequest = (ad.checked === true) ? "<li>\
                <div data-rel='' class='newrequest' title='create request'>\
                    <span class='icon-plus'></span> New request</div>\
            </li>" : "",
            content = $("\
                <ul id='optionslist''>" + newrequest + showrequests +
                "<li><div class='address_info'><span class='icon-info'></span> Address info</div></li>\
                    <li><div class='editaddress'> <span class='icon-pencil'></span> Edit label</div></li>\
                    <li><div class='removeaddress'><span class='icon-bin'></span> Remove address</div></li>\
                    <li><div id='rpayments'><span class='icon-history'></span> Recent payments</div></li>\
                </ul>").data(ad);
        showoptions(content);
        return
    });
}

function showoptions(content, addclass, callback) {
    if (addclass) {
        if (addclass.indexOf("pin") > -1) {
            let pinsettings = $("#pinsettings").data(),
                timeout = pinsettings.timeout;
            if (timeout) {
                if (now() > timeout) {
                    pinsettings.timeout = null;
                    savesettings();
                } else {
                    lockscreen(timeout);
                    return false;
                }
            }
        }
    }
    let plusclass = (addclass) ? " " + addclass : "";
    $("#optionspop").addClass("showpu active" + plusclass);
    $("#optionsbox").html(content);
    body.addClass("blurmain_options");
}

function lockscreen(timer) {
    let timeleft = timer - now(),
        cd = countdown(timeleft),
        dstr = (cd.days) ? cd.days + " days<br/>" : "",
        hstr = (cd.hours) ? cd.hours + " hours<br/>" : "",
        mstr = (cd.minutes) ? cd.minutes + " minutes<br/>" : "",
        sstr = (cd.seconds) ? cd.seconds + " seconds" : "",
        cdown_str = dstr + hstr + mstr + sstr,
        attempts = $("#pinsettings").data("attempts"),
        has_seedid = (hasbip || cashier_seedid) ? true : false,
        us_string = (has_seedid === true && attempts > 5) ? "<p id='seed_unlock'>Unlock with seed</p>" : "",
        content = "<h1 id='lock_heading'>Bitrequest</h1><div id='lockscreen'><h2><span class='icon-lock'></span></h2><p class='tmua'>Too many unlock attempts</p>\
        <p><br/>Please try again in:<br/>" + cdown_str + "</p>" + us_string +
        "<div id='phrasewrap'>\
            <p><br/>Enter your 12 word<br/>secret phrase:</p>\
                <div id='bip39phrase' contenteditable='contenteditable' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' lang='en' class='noselect'></div>\
                <div id='phrase_login' class='button'>Unlock</div>\
            </div>\
        </div>";
    $("#optionspop").addClass("showpu active pin ontop");
    $("#optionsbox").html(content);
    body.addClass("blurmain_options");
}

function seed_unlock_trigger() {
    $(document).on("click", "#lockscreen #seed_unlock", function() {
        $("#lockscreen #phrasewrap").addClass("showph");
    });
}

function phrase_login() {
    $(document).on("click", "#phrase_login", function() {
        let bip39phrase = $("#lockscreen #bip39phrase"),
            b39txt = bip39phrase.text(),
            seedobject = ls_phrase_obj(),
            savedid = seedobject.pid,
            phraseid = get_seedid(b39txt.split(" "));
        if (phraseid == savedid || phraseid == cashier_seedid) {
            clearpinlock();
            if (html.hasClass("loaded")) {} else {
                finishfunctions();
            }
            let content = pinpanel(" reset");
            showoptions(content, "pin");
            $("#pinfloat").removeClass("p_admin");
            remove_cashier();
        } else {
            shake(bip39phrase);
        }
    });
}

function remove_cashier() {
    if (is_cashier) {
        br_remove_local("cashier");
        cashier_dat = false,
            is_cashier = false,
            cashier_seedid = false;
    }
}

function newrequest_alias() {
    $(document).on("click", "#newrequest_alias", function() {
        let currencylist = $("#currencylist"),
            active_currencies = currencylist.find("li").not(".hide"),
            active_currency_count = active_currencies.length;
        if (active_currency_count === 0) {
            notify("no active currencies");
            return
        }
        if (active_currency_count > 1) {
            content = "<ul id='alias_currencylist' class='currencylist'>" + currencylist.html() + "</ul>"
            showoptions(content);
            return
        }
        let active_currency_trigger = active_currencies.find(".rq_icon").first();
        triggertxfunction(active_currency_trigger);
    });
}

function newrequest() {
    $(document).on("click", ".newrequest", function() {
        let thislink = $(this),
            ad = thislink.closest("#optionslist").data(),
            currency = ad.currency,
            address = ad.address,
            ccsymbol = ad.ccsymbol,
            title = thislink.attr("title"),
            seedid = ad.seedid;
        if (seedid) {
            if (seedid != bipid) {
                if (addr_whitelist(address) === true) {} else {
                    let pass_dat = {
                            "currency": currency,
                            "address": address,
                            "ccsymbol": ccsymbol,
                            "title": title,
                            "seedid": seedid
                        },
                        content = get_address_warning("address_newrequest", address, pass_dat);
                    popdialog(content, "triggersubmit");
                    return
                }
            } else {
                if (bipv_pass() === false) {
                    canceloptions();
                    return
                }
            }
        }
        canceloptions();
        finishtxfunction(currency, address, null, title);
    });
}

function confirm_ms_newrequest() {
    $(document).on("click", "#address_newrequest .submit", function(e) {
        e.preventDefault();
        let thisdialog = $("#address_newrequest"),
            d_dat = thisdialog.data(),
            pk_checkbox = thisdialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked"),
            ds_checkbox = thisdialog.find("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (pk_checked == true) {} else {
            popnotify("error", "Confirm privatekey ownership");
            return
        }
        if (ds_checked == true) { // whitlist seed id
            add_address_whitelist(d_dat.address);
        }
        canceloptions();
        canceldialog();
        finishtxfunction(d_dat.currency, d_dat.address, null, d_dat.title);
        return
    })
}

function showrequests() {
    $(document).on("click", ".showrequests", function(e) {
        e.preventDefault();
        loadpage("?p=requests&filteraddress=" + $(this).closest("ul").data("address"));
        canceloptions();
    });
}

function showrequests_inlne() {
    $(document).on("click", ".applist.pobox li .usedicon", function() {
        let address = $(this).prev("span").text(),
            result = confirm("Show requests for " + address + "?");
        if (result === true) {
            loadpage("?p=requests&filteraddress=" + address);
        }
    });
}

function editaddresstrigger() {
    $(document).on("click", ".editaddress", function(e) {
        e.preventDefault();
        addaddress($(this).closest("ul").data(), true);
    })
}

function removeaddress() {
    $(document).on("click", ".removeaddress", function(e) {
        e.preventDefault();
        popdialog("<h2 class='icon-bin'>Remove address?</h2>", "removeaddressfunction", $(this));
    })
}

function removeaddressfunction(trigger) {
    let result = confirm("Are you sure?");
    if (result === true) {
        let optionslist = trigger.closest("ul#optionslist"),
            ad = optionslist.data(),
            currency = ad.currency,
            address = ad.address,
            erc20 = ad.erc20,
            current_entry = filter_addressli(currency, "address", address);
        current_entry.remove();
        let currentaddresslist = get_addresslist(currency).children("li");
        if (currentaddresslist.length) {} else {
            loadpage("?p=currencies");
            let currencyli = get_currencyli(currency),
                homeli = get_homeli(currency);
            if (erc20 === true) {
                $("#" + currency + ".page").remove();
                currencyli.remove();
                homeli.remove();
            } else {
                currencyli.data("checked", false).attr("data-checked", "false");
                homeli.addClass("hide");
            }
            savecurrencies(true);
        }
        new_address = null; // prevent double entries
        canceldialog();
        canceloptions();
        notify("Address deleted 🗑");
        saveaddresses(currency, true);
    }
}

function rec_payments() {
    $(document).on("click", "#rpayments", function() {
        let ad = $(this).closest("ul").data(),
            blockchainurl = blockexplorer_url(ad.currency, false, ad.erc20);
        if (blockchainurl === undefined) {} else {
            open_blockexplorer_url(blockchainurl + ad.address);
        }
    })
}

function showtransaction_trigger() {
    $(document).on("click", ".metalist .show_tx, .transactionlist .tx_val", function() {
        let thisnode = $(this),
            thislist = thisnode.closest("li"),
            rqli = thisnode.closest("li.rqli"),
            rqldat = rqli.data(),
            txhash = (thisnode.hasClass("tx_val")) ? thislist.data("txhash") : rqldat.txhash;
        if (txhash) {
            let lnhash = (txhash.slice(0, 9) == "lightning") ? true : false;
            if (lnhash) {
                let lightning = rqldat.lightning,
                    imp = lightning.imp,
                    invoice = lightning.invoice;
                if (invoice) {
                    let hash = invoice.hash;
                    if (hash) {
                        let result = confirm("Open invoice: " + hash + "?");
                        if (result === true) {
                            let proxy = lightning.proxy_host,
                                nid = lightning.nid,
                                pid = lightning.pid,
                                pw = lightning.pw;
                            lnd_lookup_invoice(proxy, imp, hash, nid, pid, pw);
                            return;
                        }
                    }
                }
                playsound(funk);
                return
            }
            let currency = rqli.data("payment"),
                erc20 = rqli.data("erc20"),
                blockchainurl = blockexplorer_url(currency, true, erc20);
            if (blockchainurl) {
                open_blockexplorer_url(blockchainurl + txhash);
            }
        }
    })
}

function showtransactions() {
    $(document).on("click", ".showtransactions", function(e) {
        e.preventDefault();
        let ad = $("#ad_info_wrap").data(),
            blockchainurl = blockexplorer_url(ad.currency, false, ad.erc20);
        if (blockchainurl) {
            open_blockexplorer_url(blockchainurl + ad.address);
        }
    })
}

function addressinfo() {
    $(document).on("click", ".address_info", function() {
        let dialogwrap = $(this).closest("ul"),
            dd = dialogwrap.data(),
            label = (dd.label) ? dd.label : (dd.a_id) ? dd.a_id : "",
            currency = dd.currency,
            isbip = hasbip32(currency),
            bip32dat = (isbip) ? getbip32dat(currency) : null,
            seedid = dd.seedid,
            xpubid = dd.xpubid,
            vk = dd.vk,
            source = (seedid) ? "seed" : (xpubid) ? "xpub" : false,
            isseed = (source == "seed"),
            isxpub = (source == "xpub"),
            activepub = active_xpub(currency),
            active_src = (isseed) ? (seedid == bipid) :
            (isxpub) ? (activepub && xpubid == activepub.key_id) : false,
            address = dd.address,
            a_wl = addr_whitelist(address),
            restore = (isseed) ? (hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + seedid + "'>Restore</div>" : "",
            srcval = (source) ? (active_src) ? source + " <span class='icon-checkmark'>" :
            source + " (Unavailable)" + restore : "external",
            d_index = dd.derive_index,
            dpath = (bip32dat) ? bip32dat.root_path + d_index : "",
            purpose = dd.purpose;
        if (purpose) {
            let dsplit = dpath.split("/");
            dsplit[1] = purpose;
            dpath = dsplit.join("/");
        }
        dd.dpath = dpath,
            dd.bip32dat = bip32dat,
            dd.address = address;
        let cc_icon = getcc_icon(dd.cmcid, dd.ccsymbol + "-" + currency, dd.erc20),
            dpath_str = (isseed) ? "<li><strong>Derivation path:</strong> " + dpath + "</li>" : "",
            pk_verified = "Unknown <span class='icon-checkmark'></span>",
            vkobj = (dd.vk) ? vk_obj(dd.vk) : false,
            vkdat = (vkobj) ? (isseed && active_src) ? "derive" : vkobj.vk : false,
            pk_str = (vkdat) ? "<span id='show_vk' class='ref' data-vk='" + vkdat + "'>Show</span>" : (isseed) ? (active_src) ? "<span id='show_pk' class='ref'>Show</span>" : (a_wl === true) ? pk_verified : "Unknown" : pk_verified,
            content = $("<div id='ad_info_wrap'><h2>" + cc_icon + " <span>" + label + "</span></h2><ul>\
                <li><strong>Address: </strong><span class='adbox adboxl select'>" + address + "</span>\
                <div id='qrcodea' class='qrwrap flex'><div class='qrcode'></div>" + cc_icon + "</div>\
                </li>\
                <li><strong>Source: </strong>" + srcval + "</li>" +
                dpath_str +
                "<li><strong>Private key: </strong>" + pk_str +
                "<div id='pk_span'>\
                    <div class='qrwrap flex'>\
                        <div id='qrcode' class='qrcode'></div>" + cc_icon + "</div>\
                        <p id='pkspan' class='adbox adboxl select' data-type='private key'></p>\
                </div>\
                </li>\
                <li><div class='showtransactions ref'><span class='icon-eye'></span> Show transactions</div></li>\
                </ul>\
            </div>").data(dd);
        popdialog(content, "canceldialog");
        $("#qrcodea .qrcode").qrcode(address);
        return false;
    })
}

function show_pk() {
    $(document).on("click", "#show_pk", function() {
        if (is_viewonly() === true) {
            vu_block();
            return
        }
        let thisbttn = $(this),
            pkspan = $("#pk_span");
        if (pkspan.is(":visible")) {
            pkspan.slideUp(200);
            thisbttn.text("show");
            return
        }
        if (pkspan.hasClass("shwpk")) {
            pkspan.slideDown(200);
            thisbttn.text("hide");
            return
        }
        $("#optionsbox").html("");
        let addat = $("#ad_info_wrap").data(),
            currency = addat.currency,
            keycc = key_cc(),
            dx_dat = {
                "dpath": addat.dpath,
                "key": keycc.key,
                "cc": keycc.cc
            },
            x_keys_dat = derive_x(dx_dat),
            key_object = format_keys(keycc.seed, x_keys_dat, addat.bip32dat, addat.derive_index, currency),
            privkey = key_object.privkey;
        all_pinpanel({
            "func": show_pk_cb,
            "args": privkey
        }, true)
    })
}

function show_pk_cb(pk) {
    $("#show_pk").text("hide");
    $("#pkspan").text(pk);
    $("#qrcode").qrcode(pk);
    $("#pk_span").addClass("shwpk").slideDown(200);
    $("#qrcodea").slideUp(200);
}

function show_vk() {
    $(document).on("click", "#show_vk", function() {
        if (is_viewonly() === true) {
            vu_block();
            return
        }
        let thisbttn = $(this),
            vk = thisbttn.attr("data-vk"),
            pkspan = $("#pk_span");
        if (pkspan.is(":visible")) {
            pkspan.slideUp(200);
            thisbttn.text("show");
            return
        }
        if (pkspan.hasClass("shwpk")) {
            pkspan.slideDown(200);
            thisbttn.text("hide");
            return
        }
        $("#optionsbox").html("");
        let x_ko = {};
        if (vk == "derive") {
            let addat = $("#ad_info_wrap").data(),
                keycc = key_cc(),
                dx_dat = {
                    "dpath": addat.dpath,
                    "key": keycc.key,
                    "cc": keycc.cc
                },
                x_keys_dat = derive_x(dx_dat),
                rootkey = x_keys_dat.key,
                ssk = sc_reduce32(fasthash(rootkey)),
                x_ko = xmr_getpubs(ssk, addat.derive_index);
        } else {
            x_ko = {
                "stat": true,
                "svk": vk
            }
        }
        all_pinpanel({
            "func": show_vk_cb,
            "args": x_ko
        }, true)
    })
}

function show_vk_cb(kd) {
    let stat = kd.stat,
        ststr = (stat) ? "" : "<br/><strong style='color:#8d8d8d'>Spendkey</strong> <span class='adbox adboxl select' data-type='Spendkey'>" + kd.ssk + "</span><br/>";
    $("#show_vk").text("hide");
    $("#pk_span").html(ststr + "<br/><strong style='color:#8d8d8d'>Viewkey</strong> <span class='adbox adboxl select' data-type='Viewkey'>" + kd.svk + "</span>").addClass("shwpk").slideDown(200);
}

function open_blockexplorer_url(be_link) {
    let result = confirm("Open " + be_link + "?");
    if (result === true) {
        w_loc.href = be_link;
    }
}

function blockexplorer_url(currency, tx, erc20) {
    if (erc20 == "true" || erc20 === true) {
        let tx_prefix = (tx === true) ? "tx/" : "address/";
        return "https://ethplorer.io/" + tx_prefix;
    }
    let blockexplorer = get_blockexplorer(currency);
    if (blockexplorer) {
        let blockdata = $.grep(br_config.blockexplorers, function(filter) { //filter pending requests	
                return filter.name == blockexplorer;
            })[0],
            be_prefix = blockdata.prefix,
            coindata = getcoindata(currency),
            pfix = (be_prefix == "currencysymbol") ? coindata.ccsymbol : (be_prefix == "currency") ? currency : be_prefix,
            prefix = (pfix) ? pfix + "/" : "",
            prefix_type = (tx === true) ? blockdata.tx_prefix : blockdata.address_prefix;
        return blockdata.url + prefix + prefix_type;
    }
    return false;
}

function get_blockexplorer(currency) {
    return cs_node(currency, "blockexplorers", true).selected;
}

function apisrc_shortcut() {
    $(document).on("click", ".api_source", function() {
        let rpc_settings_li = cs_node($(this).closest("li.rqli").data("payment"), "apis");
        if (rpc_settings_li) {
            rpc_settings_li.trigger("click");
        }
    })
}

function canceloptionstrigger() {
    $(document).on("click", "#optionspop, #closeoptions", function(e) {
        if (e.target == this) {
            canceloptions();
        }
    });
}

function canceloptions(pass) {
    if (pass === true) {
        clearoptions();
        return
    }
    let optionspop = $("#optionspop"),
        thishaspin = (optionspop.hasClass("pin"));
    if (thishaspin) {
        let phrasewrap = $("#lockscreen #phrasewrap");
        if (phrasewrap.hasClass("showph")) {
            phrasewrap.removeClass("showph");
            return
        }
        if (ishome() === true) {} else {
            if (html.hasClass("loaded")) {} else {
                shake(optionspop);
                return
            }
        }
    }
    clearoptions();
}

function clearoptions() {
    let optionspop = $("#optionspop");
    optionspop.addClass("fadebg");
    optionspop.removeClass("active");
    body.removeClass("blurmain_options");
    let timeout = setTimeout(function() {
        optionspop.removeClass("showpu pin fadebg ontop");
        $("#optionsbox").html("");
    }, 600, function() {
        clearTimeout(timeout);
    });
}

// ** Requestlist functions **

function showrequestdetails() {
    $(document).on("click", ".requestlist .liwrap", function() {
        let thisnode = $(this),
            thislist = thisnode.closest("li"),
            infopanel = thisnode.next(".moreinfo"),
            metalist = infopanel.find(".metalist");
        if (infopanel.is(":visible")) {
            infopanel.add(metalist).slideUp(200);
            thislist.removeClass("visible_request");
        } else {
            let fixednavheight = $("#fixednav").height();
            $(".requestlist > li").not(thislist).removeClass("visible_request");
            $(".moreinfo").add(".metalist").not(infopanel).slideUp(200);
            setTimeout(function() {
                $("html, body").animate({
                    "scrollTop": thislist.offset().top - fixednavheight
                }, 200);
                infopanel.slideDown(200);
                thislist.addClass("visible_request");
                let confbar = thislist.find(".transactionlist .confbar");
                if (confbar.length > 0) {
                    confbar.each(function(i) {
                        animate_confbar($(this), i);
                    });
                }
            }, 220);
        }
        thislist.find(".transactionlist .historic_meta").slideUp(200);
    });
}

function toggle_request_meta() {
    $(document).on("click", ".requestlist li .req_actions .icon-info", function() {
        let metalist = $(this).closest(".moreinfo").find(".metalist");
        if (metalist.is(":visible")) {
            metalist.slideUp(300);
            return
        }
        let confbar = metalist.find(".confbar");
        metalist.slideDown(300);
        if (confbar.length > 0) {
            confbar.each(function(i) {
                animate_confbar($(this), i);
            });
        }
    })
}

function animate_confbar(confbox, index) {
    confbox.css("transform", "translate(-100%)");
    let txdata = confbox.closest("li").data(),
        percentage = (txdata.confirmations / txdata.setconfirmations) * 100,
        percent_output = (percentage > 100) ? 100 : percentage,
        percent_final = (percent_output - 100).toFixed(2);
    setTimeout(function() {
        confbox.css("transform", "translate(" + percent_final + "%)");
    }, index * 500);
}

function show_transaction_meta() {
    $(document).on("dblclick", ".requestlist li .transactionlist li", function() {
        let thisli = $(this),
            txmeta = thisli.children(".historic_meta");
        if (txmeta.is(":visible")) {
            return
        }
        let txlist = thisli.closest(".transactionlist"),
            alltxmeta = txlist.find(".historic_meta");
        alltxmeta.not(txmeta).slideUp(300);
        txmeta.slideDown(300);
    })
}

function hide_transaction_meta() {
    $(document).on("click", ".requestlist li .transactionlist li", function() {
        let thisli = $(this),
            tx_meta = thisli.children(".historic_meta");
        if (tx_meta.is(":visible")) {
            tx_meta.slideUp(300);
        }
    })
}

function archive() {
    $(document).on("click", "#requestlist .req_actions .icon-folder-open", function() {
        popdialog("<h2 class='icon-folder-open'>Archive request?</h2>", "archivefunction", $(this));
    })
}

function archivefunction() {
    let thisreguest = $("#requestlist > li.visible_request"),
        requestdata = thisreguest.data(),
        requestcopy = thisreguest.clone();
    if (thisreguest.data("status") == "insufficient") {
        updaterequest({
            "requestid": requestdata.requestid,
            "status": "archive_pending"
        });
    }
    thisreguest.slideUp(300);
    requestcopy.data(requestdata).prependTo($("#archivelist"));
    setTimeout(function() {
        thisreguest.remove();
        savearchive();
        saverequests();
    }, 350);
    archive_button();
    canceldialog();
    notify("Moved to archive");
}

function unarchive() {
    $(document).on("click", "#archivelist .req_actions .icon-undo2", function() {
        popdialog("<h2 class='icon-undo2'>Unarchive request?</h2>", "unarchivefunction", $(this));
    })
}

function unarchivefunction() {
    let thisreguest = $("#archivelist li.visible_request"),
        requestdata = thisreguest.data(),
        requestcopy = thisreguest.clone();
    thisreguest.slideUp(300);
    requestcopy.data(requestdata).prependTo($("#requestlist"));
    setTimeout(function() {
        thisreguest.remove();
        savearchive();
        saverequests();
        archive_button();
    }, 350);
    canceldialog();
    notify("Request restored");
}

function removerequest() {
    $(document).on("click", ".req_actions .icon-bin", function() {
        popdialog("<h2 class='icon-bin'>Delete request?</h2>", "removerequestfunction", $(this));
    })
}

function removerequestfunction() {
    let result = confirm("Are you sure?");
    if (result === true) {
        let visiblerequest = $(".requestlist > li.visible_request");
        visiblerequest.slideUp(300);
        setTimeout(function() {
            visiblerequest.remove();
            saverequests();
            savearchive();
        }, 350);
        canceldialog();
        notify("Request deleted 🗑");
    }
}

function amountshort(amount, receivedamount, fiatvalue, iscrypto) {
    let amount_recieved = (iscrypto === true) ? receivedamount : fiatvalue,
        amount_short = amount - amount_recieved;
    return (iscrypto === true) ? trimdecimals(amount_short, 5) : trimdecimals(amount_short, 2);
}

function editrequest() {
    $(document).on("click", ".editrequest", function() {
        let thisnode = $(this),
            thisrequestid = thisnode.attr("data-requestid"),
            requestlist = $("#" + thisrequestid),
            requesttitle = requestlist.data("requesttitle"),
            requesttitle_input = (requesttitle) ? requesttitle : "",
            formheader = (requesttitle) ? "Edit" : "Enter",
            content = "\
            <div class='formbox' id='edit_request_formbox'>\
                <h2 class='icon-pencil'>" + formheader + " description</h2>\
                <div class='popnotify'></div>\
                <div class='popform'>\
                    <input type='text' value='" + requesttitle_input + "' placeholder='description'/>\
                    <input type='submit' class='submit' value='OK' data-requestid='" + thisrequestid + "'/>\
                </div>\
            </div>";
        popdialog(content, "triggersubmit");
    })
}

function submit_request_description() {
    $(document).on("click", "#edit_request_formbox input.submit", function(e) {
        let thisnode = $(this),
            this_requestid = thisnode.attr("data-requestid"),
            this_requesttitle = thisnode.prev("input").val(),
            requesttitle_val = (this_requesttitle) ? this_requesttitle : "empty";
        if (this_requesttitle) {
            updaterequest({
                "requestid": this_requestid,
                "requesttitle": requesttitle_val
            }, true);
            canceldialog();
            notify("Request saved");
            return
        }
        popnotify("error", "Description is a required field");
    })
}

// ** Services **

function receipt() {
    $(document).on("click", ".receipt > p", function() {
        let thisnode = $(this),
            requestli = thisnode.closest(".rqli"),
            rqdat = requestli.data(),
            requestid = rqdat.requestid,
            receipt_url = get_pdf_url(rqdat),
            receipt_title = "bitrequest_receipt_" + requestid + ".pdf",
            ddat = [{
                "div": {
                    "class": "popform"
                },
                "div": {
                    "id": "backupactions",
                    "content": [{
                            "div": {
                                "id": "share_receipt",
                                "class": "util_icon icon-share2",
                                "attr": {
                                    "data-receiptdat": receipt_url,
                                    "data-requestid": requestid
                                }
                            }
                        },
                        {
                            "a": {
                                "id": "dl_receipt",
                                "class": "util_icon icon-download",
                                "attr": {
                                    "href": receipt_url,
                                    "target": "_blank",
                                    "title": "Download " + receipt_title,
                                    "download": receipt_title
                                }
                            }
                        },
                        {
                            "a": {
                                "id": "receipt_link",
                                "class": "customtrigger",
                                "attr": {
                                    "href": receipt_url,
                                    "target": "_blank",
                                    "download": receipt_title
                                },
                                "content": "OK"
                            }
                        },
                        {
                            "div": {
                                "id": "canceldialog",
                                "class": "customtrigger",
                                "content": "CANCEL"
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "invoiceformbox",
                "icon": "icon-file-pdf",
                "title": "bitrequest_receipt_" + requestid + ".pdf",
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

function download_receipt() {
    $(document).on("click", "#dl_receipt", function(e) {
        let thisbttn = $(this),
            href = thisbttn.attr("href"),
            title = thisbttn.attr("title"),
            result = confirm(title + "?");
        if (result === false) {
            e.preventDefault();
            return false;
        }
    })
}

function share_receipt() {
    $(document).on("click", "#share_receipt", function() {
        let thisbttn = $(this),
            href = thisbttn.attr("data-receiptdat"),
            requestid = thisbttn.attr("data-requestid"),
            filename = "bitrequest_receipt_" + requestid + ".pdf",
            result = confirm("Share " + filename + "?");
        if (result === true) {
            loader(true);
            loadertext("generate receipt");
            let accountname = $("#accountsettings").data("selected"),
                sharedtitle = "bitrequest_receipt_" + requestid + ".pdf";
            shorten_url(sharedtitle, href, fetch_aws("img_receipt_icon.png"), true);
            closeloader();
        }
    })
}

function lnd_lookup_invoice(proxy, imp, hash, nid, pid, pw) {
    let p_arr = lnurl_deform(proxy),
        proxy_host = p_arr.url,
        pk = (pw) ? pw : p_arr.k,
        proxy_url = proxy_host + "proxy/v1/ln/api/",
        postdata = {
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy_url,
            "data": {
                "fn": "ln-invoice-decode",
                "imp": imp,
                "hash": hash,
                "nid": nid,
                "callback": "no",
                "id": pid,
                "x-api": pk
            }
        };
    loader(true);
    loadertext("connecting to " + lnurl_encode("lnurl", proxy_host));
    $.ajax(postdata).done(function(e) {
        if (e) {
            let error = e.error;
            if (error) {
                popdialog("<h2 class='icon-blocked'>" + error.message + "</h2>", "canceldialog");
                closeloader();
                return;
            }
            let ddat = [{
                    "div": {
                        "class": "popform",
                        "content": [{
                                "div": {
                                    "class": "invoice_body",
                                    "content": "<pre>" + syntaxHighlight(e) + "</pre><div class='inv_pb'><img src='" + c_icons(imp) + "' class='lnd_icon' title='" + imp + "'/> Powered by " + imp + "</div>"
                                }
                            },
                            {
                                "input": {
                                    "class": "submit",
                                    "attr": {
                                        "type": "submit",
                                        "value": "OK"
                                    }
                                }
                            }
                        ]
                    }
                }],
                content = template_dialog({
                    "id": "invoiceformbox",
                    "icon": "icon-power",
                    "title": "Invoice",
                    "elements": ddat
                });
            popdialog(content, "canceldialog");
            closeloader();
            return
        }
        notify("Unable to fetch invoice");
        closeloader();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        notify("Unable to fetch invoice");
        closeloader();
    });
}

function get_pdf_url(rqdat) {
    let requestid = rqdat.requestid,
        currencyname = rqdat.currencyname,
        requestname = rqdat.requestname,
        requesttitle = rqdat.requesttitle,
        ismonitored = rqdat.monitored,
        status = rqdat.status,
        statustext = (status == "new") ? "Waiting for payment" : status,
        txhash = rqdat.txhash,
        lnhash = (txhash && txhash.slice(0, 9) == "lightning") ? true : false,
        lightning = rqdat.lightning,
        hybrid = (lightning && lightning.hybrid === true),
        paymenttimestamp = rqdat.paymenttimestamp,
        ptsformatted = fulldateformat(new Date(paymenttimestamp - timezone), "en-us"),
        amount = rqdat.amount,
        fiatvalue = rqdat.fiatvalue,
        receivedamount = rqdat.receivedamount,
        receivedamount_rounded = trimdecimals(receivedamount, 6),
        fiatvalue_rounded = trimdecimals(fiatvalue, 2),
        requesttype = rqdat.requesttype,
        incoming = (requesttype == "incoming"),
        outgoing = (requesttype == "outgoing"),
        local = (requesttype == "local"),
        checkout = (requesttype == "checkout"),
        typetext = (incoming === true) ? (checkout) ? "online purchase" : "incoming" : (local === true) ? "point of sale" : "outgoing",
        iscrypto = rqdat.iscrypto,
        deter = (iscrypto === true) ? 6 : 2,
        amount_rounded = trimdecimals(amount, deter),
        uoa = rqdat.uoa,
        uoa_upper = uoa.toUpperCase(),
        requestdate = rqdat.requestdate,
        timestamp = rqdat.timestamp,
        utc = timestamp - timezone,
        localtime = (requestdate) ? requestdate - timezone : utc,
        localtimeobject = new Date(localtime),
        requestdateformatted = fulldateformat(localtimeobject, "en-us"),
        created = (requestdate) ? requestdateformatted : "unknown",
        utc_format = fulldateformat(new Date(utc)),
        invd = {},
        lnd_string = (lnhash) ? " (lightning)" : "";
    invd["Request ID"] = requestid;
    invd.Currency = rqdat.payment + lnd_string;
    if (exists(requestname)) {
        invd.From = requestname;
    }
    if (exists(requesttitle)) {
        invd.Title = "'" + requesttitle + "'";
    }
    invd.Amount = amount_rounded + " " + uoa_upper,
        invd.Status = statustext,
        invd.Type = typetext;
    if (incoming === true) {
        invd["Created"] = created;
        invd["First viewed"] = utc_format;
    }
    invd.Address = rqdat.address;
    if (status === "paid") {
        invd["Paid on"] = ptsformatted,
            invd["Amount received"] = receivedamount_rounded + " " + rqdat.payment;
        if (iscrypto === true) {} else {
            invd["Fiat value on " + ptsformatted] = fiatvalue_rounded + " " + currencyname;
        }
    }
    if (exists(txhash)) {
        invd["TxID"] = txhash;
    }
    let set_proxy = d_proxy();
    return set_proxy + "proxy/v1/receipt/?data=" + btoa(JSON.stringify(invd));
}

// Countdown format

function countdown(timestamp) {
    let uts = timestamp / 1000,
        days = Math.floor(uts / 86400);
    uts -= days * 86400;
    let hours = Math.floor(uts / 3600) % 24;
    uts -= hours * 3600;
    let minutes = Math.floor(uts / 60) % 60;
    uts -= minutes * 60;
    let seconds = uts % 60,
        cd_object = {
            "days": days,
            "hours": hours,
            "minutes": minutes,
            "seconds": Math.round(seconds)
        }
    return cd_object;
}

function countdown_format(cd) {
    let days = cd.days,
        hours = cd.hours,
        minutes = cd.minutes,
        seconds = cd.seconds,
        daynode = (days) ? (days < 2) ? days + " day" : days + " days" : "",
        hs = (days) ? ", " : "",
        hournode = (hours) ? (hours < 2) ? hs + hours + " hour" : hs + hours + " hours" : "",
        ms = (hours) ? ", " : "",
        minutenode = (minutes) ? (minutes < 2) ? ms + minutes + " minute" : ms + minutes + " minutes" : "",
        ss = (minutes) ? " and " : "",
        secondnode = (seconds) ? ss + seconds + " seconds" : "",
        result = (cd) ? daynode + hournode + minutenode + secondnode : false;
    return result;
}

// ** Page rendering **

//render page from cache
function rendercurrencies() {
    initiate();
    if (stored_currencies) {
        $.each(stored_currencies, function(index, data) {
            let thiscurrency = data.currency,
                thiscmcid = data.cmcid;
            buildpage(data, false);
            render_currencysettings(thiscurrency);
            let addresses = br_get_local("cc_" + thiscurrency, true);
            if (addresses) {
                $.each(addresses.reverse(), function(index, address_data) {
                    appendaddress(thiscurrency, address_data);
                });
            }
        });
    }
    $("ul#allcurrencies").append("<li id='choose_erc20' data-currency='erc20 token' class='start_cli'><div class='liwrap'><h2><img src='" + c_icons("ph") + "'/>erc20 token</h2></div></li>\
    <li id='rshome' class='restore start_cli' data-currency='erc20 token'><div class='liwrap'><h2><span class='icon-upload'> Restore from backup</h2></div></li><li id='start_cli_margin' class='start_cli'><div class='liwrap'><h2></h2></div></li>").prepend("<li id='connectln' data-currency='bitcoin' class='start_cli'><div class='liwrap'><h2><img src='img_logos_btc-lnd.png'/>Lightning</h2></div></li>");
}

// render currency settings
function render_currencysettings(thiscurrency) {
    let settingcache = br_get_local(thiscurrency + "_settings", true);
    if (settingcache) {
        append_coinsetting(thiscurrency, settingcache, false);
    }
}

// build settings
function buildsettings() {
    let appsettingslist = $("#appsettings");
    $.each(br_config.app_settings, function(i, value) {
        let setting_id = value.id,
            setting_li = (setting_id == "heading") ? $("<li class='set_heading'>\
              <h2>" + value.heading + "</h2>\
        </li>") :
            $("<li class='render' id='" + setting_id + "'>\
              <div class='liwrap iconright'>\
                 <span class='" + value.icon + "'></span>\
                 <div class='atext'>\
                    <h2>" + value.heading + "</h2>\
                    <p>" + value.selected + "</p>\
                 </div>\
                 <div class='iconbox'>\
                     <span class='icon-pencil'></span>\
                </div>\
              </div>\
        </li>");
        setting_li.data(value).appendTo(appsettingslist);
    });
}

// render settings
function rendersettings(excludes) {
    let settingcache = br_get_local("settings", true);
    if (settingcache) {
        $.each(settingcache, function(i, value) {
            if ($.inArray(value.id, excludes) === -1) { // exclude excludes
                $("#" + value.id).data(value).find("p").text(value.selected);
            }
        });
    }
}

function renderrequests() {
    fetchrequests("requests", false);
    fetchrequests("archive", true);
    archive_button();
}

function archive_button() {
    let viewarchive = $("#viewarchive"),
        archivecount = $("#archivelist > li").length;
    if (archivecount > 0) {
        va_title = viewarchive.attr("data-title");
        viewarchive.slideDown(300).text(va_title + " (" + archivecount + ")");
        return
    }
    viewarchive.slideUp(300);
}

function fetchrequests(cachename, archive) {
    let requestcache = br_get_local(cachename, true);
    if (requestcache) {
        let showarchive = (archive === false && requestcache.length > 11); // only show archive button when there are more then 11 requests
        $.each(requestcache.reverse(), function(i, value) {
            value.archive = archive;
            value.showarchive = showarchive;
            appendrequest(value);
        });
    }
}

//initiate page when there's no cache
function initiate() {
    $.each(br_config.bitrequest_coin_data, function(dat, val) {
        if (val.active === true) {
            let settings = val.settings,
                has_settings = (settings) ? true : false,
                is_monitored = (has_settings) ? (settings.apis) ? true : false : false,
                cd = val.data,
                coindata = {
                    "currency": cd.currency,
                    "ccsymbol": cd.ccsymbol,
                    "checked": false,
                    "cmcid": cd.cmcid,
                    "erc20": false,
                    "monitored": is_monitored,
                    "settings": has_settings,
                    "urlscheme": cd.urlscheme
                };
            buildpage(coindata, true);
            append_coinsetting(val.currency, settings, true);
        }
    });
}

function buildpage(cd, ini) {
    let currency = cd.currency,
        ccsymbol = cd.ccsymbol,
        checked = cd.checked,
        cmcid = cd.cmcid,
        cpid = ccsymbol + "-" + currency,
        erc20 = cd.erc20,
        // append currencies
        currencylist = $("ul#usedcurrencies"),
        cc_li = currencylist.children("li[data-currency='" + currency + "']"),
        home_currencylist = $("ul#currencylist"),
        home_cc_li = home_currencylist.children("li[data-currency='" + currency + "']"),
        visibility = (checked === true) ? "" : "hide",
        has_settings = (cd.settings === true || erc20 === true);
    init = (cc_li.length === 0 && ini === true);
    if (init === true || erc20 === true) {
        let new_li = $("<li class='iconright' data-currency='" + currency + "' data-checked='" + checked + "'>\
            <div data-rel='?p=" + currency + "' class='liwrap addcurrency'>\
                <h2>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + "\</h2>\
            </div>\
            <div class='iconbox togglecurrency'>\
                <span class='checkbox'></span>\
            </div>\
        </li>");
        new_li.data(cd).appendTo(currencylist);
        // append currencies homepage
        let new_homeli = $("<li class='" + visibility + "' data-currency='" + currency + "'>\
            <div class='rq_icon' data-rel='?p=home&payment=" + currency + "&uoa=' data-title='create " + currency + " request' data-currency='" + currency + "'>" +
            getcc_icon(cmcid, cpid, erc20) + "\
            </div>\
        </li>");
        new_homeli.data(cd).appendTo(home_currencylist);
        let settingspage = (has_settings === true) ? "\
        <div class='page' id='" + currency + "_settings' data-erc20='" + erc20 + "'>\
            <div class='content'>\
                <h2 class='heading'>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + " settings</h2>\
                <ul class='cc_settinglist settinglist applist listyle2'></ul>\
                <div class='reset_cc_settings button' data-currency='" + currency + "'>\
                    <span>Reset</span>\
                </div>\
            </div>\
        </div>" : "";
        let settingsbutton = (has_settings === true) ? "<div data-rel='?p=" + currency + "_settings' class='self icon-cog'></div>" : "",
            sendbttn = (hasbip === true) ? "<div class='button send' data-currency='" + currency + "'><span class='icon-telegram'>Send</span></div>" : "",
            currency_page = $("<div class='page' id='" + currency + "'>\
            <div class='content'>\
                <h2 class='heading'>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + settingsbutton + "</h2>\
                <ul class='applist listyle2 pobox' data-currency='" + currency + "'>\
                    <div class='endli'><div class='button addaddress' data-currency='" + currency + "'><span class='icon-plus'>Add address</span></div>" + sendbttn + "</div>\
                    <div class='addone' data-currency='" + currency + "'>Add one</div>\
                </ul>\
            </div>\
        </div>" + settingspage);
        currency_page.data(cd).appendTo("main");
        if (erc20 === true) {
            let coin_settings_cache = br_get_local(currency + "_settings");
            if (!coin_settings_cache) {
                br_set_local(currency + "_settings", br_config.erc20_dat.settings, true);
            }
        }
    } else {
        cc_li.data(cd).attr("data-checked", checked);
        home_cc_li.data(cd).removeClass("hide").addClass(visibility);
    }
    $("ul#allcurrencies").append("<li class='start_cli choose_currency' data-currency='" + currency + "' data-checked='" + checked + "'>\
        <div data-rel='?p=" + currency + "' class='liwrap'>\
            <h2>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + "\</h2>\
        </div>\
    </li>");
}

function append_coinsetting(currency, settings, init) {
    let coinsettings_list = $("#" + currency + "_settings ul.cc_settinglist");
    $.each(settings, function(dat, val) {
        if (val.xpub === false) {} else {
            let selected = val.selected,
                selected_val = (selected.name) ? selected.name : (selected.url) ? selected.url : selected;
            if (selected_val !== undefined) {
                let selected_string = selected_val.toString(),
                    ss_filter = (selected_string == "true" || selected_string == "false") ? "" : selected_string,
                    check_setting_li = coinsettings_list.children("li[data-id='" + dat + "']");
                if (check_setting_li.length === 0) {
                    let switchclass = (val.custom_switch) ? " custom" : " global bool",
                        trigger = (val.switch === true) ? switchpanel(selected_string, switchclass) : "<span class='icon-pencil'></span>",
                        coinsettings_li = $("<li data-id='" + dat + "'>\
                            <div class='liwrap edit_trigger iconright' data-currency='" + currency + "'>\
                                <span class='icon-" + val.icon + "'></span>\
                                <div class='atext'>\
                                    <h2>" + dat + "</h2>\
                                    <p>" + ss_filter + "</p>\
                                </div>\
                                <div class='iconbox'>" + trigger + "</div>\
                                </div>\
                        </li>");
                    coinsettings_li.data(val).appendTo(coinsettings_list);
                } else {
                    check_setting_li.data(val).find("p").text(ss_filter);
                    if (val.switch === true) {
                        check_setting_li.find(".switchpanel").removeClass("true false").addClass(selected_string);
                    }
                }
            }
        }
    });
}

function appendaddress(currency, ad) {
    let address = ad.address,
        pobox = get_addresslist(currency),
        index = pobox.children("li").length + 1,
        seedid = ad.seedid,
        addressid = ad.a_id,
        xpubid = ad.xpubid,
        source = (seedid) ? "seed" : (xpubid) ? "xpub" : "",
        used = ad.used,
        ad_id_str = (addressid) ? "address_ID: " + addressid + "\n" : "",
        ad_icon = (source) ? (source == "seed") ? "<span title='" + ad_id_str + "seed_ID: " + seedid + "' class='srcicon' data-seedid='" + seedid + "'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 888 899' class='srcseed'><path d='M852.9 26.3c.5-3.5-28.7 14.8-28.2 14.1-.9 1.1-25.3 23.4-195.1 46-71.4 9.5-120.3 37.2-145.3 82.4-40.3 72.6-1.1 161 .6 164.7l1.6 3.5c-7.8 16.8-14.1 34.2-19.3 51.9-11.6-27.1-26.5-50.9-44.8-71.4 4.8-20.2 5-45.5-3.8-77.1-21.1-76.1-73.8-104.4-114.2-114.7-42.3-10.8-79.6-4.1-81.2-3.9l-.7.1c-1.8.4-44.8 10-90.8 38.1C69.2 198.3 31 252.7 21.3 317.2L16 353.5l35-11.1c2.7-.8 66.4-20.2 150.4 29.6 32.6 19.3 68.6 29 102 29 30.8 0 59.4-8.2 81.1-24.8 5.4-4.1 11.5-9.6 17.3-16.8 24.5 33 40.5 75.2 47.9 126.3-.8 9.5-1.3 19-1.7 28.4-70.6 10.5-187.2 47.6-280.8 173 0 0 59.9 179.7 264.3 183.3 204.4 3.5 194.6 0 194.6 0s137.6-7 126.6-183.3-241.3-176.6-241.3-176.6-5.9-.5-16.3-.4c-.2-2.7-.4-5.4-.7-8.1 3.2-52.1 13.1-97.9 29.5-136.7 38.8 24.8 75.7 37.3 110.6 37.3 18.5 0 36.4-3.5 53.7-10.5C824 336.9 862.7 78.4 866.5 50.6c.3-1.6-6.6 14.4.5-4.9s-14.1-19.4-14.1-19.4zM356.8 339.8C326.5 363 271 360 224.9 332.6c-54.8-32.5-103.6-40.3-137.8-40.3-4.4 0-8.6.1-12.5.4 34.8-95.2 149.9-124.1 157.2-125.8 8.8-1.5 114.1-16.6 142.6 85.9 2.3 8.3 4.2 17.5 4.9 26.9-93-63.9-206.9-45.3-210.2-45-31.7 13.8-17.6 42 7.1 41.7 24.4-.4 113.8-18 193.8 49.1-3.4 5.3-7.7 10.1-13.2 14.3zm314.2 9.9c-36 14.6-78.2 6.2-125.6-25 8.2-12.9 17.4-24.7 27.6-35.3 40.2-41.9 84-53.8 96.3-56.4.9-.1 2-.2 3.3-.6h.2c17-5.6 25.1-43.8-6-45.4-.6-2-66.2 9.2-124.4 68.3-9.2 9.4-17.6 19.3-25.2 29.6-6.1-25.6-9.9-63 7.3-94 17.7-31.7 55.1-51.6 111.2-59 79.7-10.6 138.5-23.2 176.8-37.9-18.8 88.1-63.2 223.8-141.5 255.7z' fill='#B33A3A'/></svg></span>" : "<span class='srcicon icon-key' title='" + ad_id_str + "derived from Xpub: #" + xpubid + "'></span>" : (currency == "monero") ? (ad.vk) ? "<span class='srcicon icon-eye' title='Monitored address'></span>" : "<span class='srcicon icon-eye-blocked' title='Unmonitored address'></span>" : "",
        activepub = active_xpub(currency),
        clasv = (source) ? (source == "seed") ? (seedid == bipid) ? " seed seedv" : " seed seedu" :
        (source == "xpub") ? (activepub && xpubid == activepub.key_id) ? " xpub xpubv" : " xpub xpubu" : "" : "",
        usedcl = (used) ? " used" : "",
        address_li = $("<li class='adli" + clasv + usedcl + "' data-index='" + index + "' data-address='" + address + "' data-checked='" + ad.checked + "'>\
            <div class='addressinfo liwrap iconright2'>\
                <div class='atext'>\
                    <h2><span>" + ad.label + "</span></h2>\
                    <p class='address'>" + ad_icon + "<span class='select'>" + address + "</span><span class='usedicon icon-arrow-up-right2' title='Used'></span></p>\
                </div>\
                <div class='iconbox'>\
                    <span class='checkbox toggleaddress'></span>\
                    <span class='popoptions icon-menu2'></span>\
                </div>\
            </div>\
        </li>");
    address_li.data(ad).prependTo(pobox);
}

function appendrequest(rd) {
    let payment = rd.payment,
        erc20 = rd.erc20,
        uoa = rd.uoa,
        amount = rd.amount,
        address = rd.address,
        payment_id = rd.payment_id,
        xmr_ia = rd.xmr_ia,
        currencysymbol = rd.currencysymbol,
        cmcid = rd.cmcid,
        cpid = rd.cpid,
        requesttype = rd.requesttype,
        iscrypto = rd.iscrypto,
        requestname = rd.requestname,
        requesttitle = rd.requesttitle,
        set_confirmations = rd.set_confirmations,
        currencyname = rd.currencyname,
        receivedamount = rd.receivedamount,
        fiatvalue = rd.fiatvalue,
        txhash = rd.txhash,
        lnhash = (txhash && txhash.slice(0, 9) == "lightning") ? true : false,
        lightning = rd.lightning,
        hybrid = (lightning && lightning.hybrid === true),
        conf = (rd.confirmations) ? rd.confirmations : 0,
        status = rd.status,
        pending = rd.pending,
        requestid = rd.requestid,
        archive = rd.archive,
        showarchive = rd.showarchive,
        timestamp = rd.timestamp,
        requestdate = rd.requestdate,
        rqdata = rd.rqdata,
        rqmeta = rd.rqmeta,
        ismonitored = rd.monitored,
        source = rd.source,
        txhistory = rd.txhistory,
        uoa_upper = uoa.toUpperCase(),
        deter = (iscrypto === true) ? 6 : 2,
        insufficient = (status == "insufficient"),
        requesttitle_short = (requesttitle && requesttitle.length > 85) ? "<span title='" + requesttitle + "'>" + requesttitle.substring(0, 64) + "...</span>" : requesttitle,
        // Fix decimal rounding:
        amount_rounded = trimdecimals(amount, deter),
        receivedamount_rounded = trimdecimals(receivedamount, 6),
        fiatvalue_rounded = trimdecimals(fiatvalue, 2),
        requestlist = (archive === true) ? $("#archivelist") : $("#requestlist"),
        utc = timestamp - timezone,
        localtime = (requestdate) ? requestdate - timezone : utc, // timezone correction
        paymenttimestamp = (rd.paymenttimestamp) ? rd.paymenttimestamp : requestdate,
        incoming = (requesttype == "incoming"),
        local = (requesttype == "local"),
        checkout = (requesttype == "checkout"),
        outgoing = (requesttype == "outgoing"),
        direction = (incoming === true) ? "sent" : "received",
        typetext = (checkout) ? "online purchase" : (local) ? "point of sale" : requesttype,
        requesticon = (checkout) ? " typeicon icon-cart" : (local) ? " icon-qrcode" : (incoming === true) ? " typeicon icon-arrow-down-right2" : " typeicon icon-arrow-up-right2",
        typeicon = "<span class='inout" + requesticon + "'></span> ",
        statusicon = "<span class='icon-checkmark' title='Confirmed transaction'></span>\
            <span class='icon-clock' title='pending transaction'></span>\
            <span class='icon-eye-blocked' title='unmonitored transaction'></span>\
            <span class='icon-wifi-off' title='No network'></span>",
        requesttitlestring = (rqdata || requesttitle) ? (incoming === true) ? requestname : requesttitle_short : "<b>" + amount_rounded + "</b> " + currencyname + statusicon,
        requestnamestring = (rqdata || requesttitle) ? (incoming === true) ? "<strong>'" + requesttitle_short + "'</strong> (" + amount_rounded + " " + currencyname + ")" + statusicon : amount_rounded + " " + currencyname + statusicon : "",
        rqdataparam = (rqdata) ? "&d=" + rqdata : "",
        rqmetaparam = (rqmeta) ? "&m=" + rqmeta : "",
        requesttypeclass = "request" + requesttype,
        lnclass = (lightning) ? " lightning" : "",
        lnd_expire = (lightning && hybrid === false || lnhash) ? true : false,
        expirytime = (lnd_expire) ? 604800000 : (iscrypto === true) ? 25920000000 : 6048000000, // expirydate crypto: 300 days / fiat: 70 days / lightning: 7 days
        isexpired = (status == "expired" || (now() - localtime) >= expirytime && (lnd_expire || status == "new" || insufficient === true)),
        expiredclass = (isexpired === true) ? " expired" : "",
        localtimeobject = new Date(localtime),
        requestdateformatted = fulldateformat(localtimeobject, "en-us"),
        timeformat = "<span class='rq_month'>" + localtimeobject.toLocaleString("en-us", {
            "month": "short"
        }) + "</span> <span class='rq_day'>" + localtimeobject.getDate() + "</span>",
        ptsformatted = fulldateformat(new Date(paymenttimestamp - timezone), "en-us", true),
        amount_short_rounded = amountshort(amount, receivedamount, fiatvalue, iscrypto),
        amount_short_span = (insufficient === true) ? " (" + amount_short_rounded + " " + uoa_upper + " short)" : "",
        amount_short_cc_span = (iscrypto === true) ? amount_short_span : "",
        created = (requestdate) ? requestdateformatted : "<strong>unknown</strong>",
        fiatvaluebox = (iscrypto === true || !fiatvalue) ? "" : "<li class='payday pd_fiat'><strong>Fiat value on<span class='pd_fiat'> " + ptsformatted + "</span> :</strong><span class='fiatvalue'> " + fiatvalue_rounded + "</span> " + currencyname + "<div class='show_as amountshort'>" + amount_short_span + "</div></li>",
        paymentdetails = "<li class='payday pd_paydate'><strong>Paid on:</strong><span class='paydate'> " + ptsformatted + "</span></li><li class='receivedamount'><strong>Amount received:</strong><span> " + receivedamount_rounded + "</span> " + payment + "<div class='show_as amountshort'>" + amount_short_cc_span + "</div></li>" + fiatvaluebox,
        requestnamebox = (incoming === true) ? (rqdata) ? "<li><strong>From:</strong> " + requestname + "</li>" : "<li><strong>From: unknown</strong></li>" : "",
        requesttitlebox = (requesttitle) ? "<li><strong>Title:</strong> '<span class='requesttitlebox'>" + requesttitle + "</span>'</li>" : "",
        ismonitoredspan = (ismonitored === false) ? " (unmonitored transaction)" : "",
        timestampbox = (incoming === true) ? "<li><strong>Created:</strong> " + created + "</li><li><strong>First viewed:</strong> " + fulldateformat(new Date(utc), "en-us") + "</li>" :
        (outgoing === true) ? "<li><strong>Request send on:</strong> " + requestdateformatted + "</li>" :
        (local === true) ? "<li><strong>Created:</strong> " + requestdateformatted + "</li>" : "",
        paymenturl = "&address=" + address + rqdataparam + rqmetaparam + "&requestid=" + requestid,
        islabel = $("main #" + payment + " li[data-address='" + address + "']").data("label"),
        requestlabel = (islabel) ? " <span class='requestlabel'>(" + islabel + ")</span>" : "",
        conf_box = (ismonitored === false) ? "<div class='txli_conf' data-conf='0'><span>Unmonitored transaction</span></div>" :
        (conf > 0) ? "<div class='txli_conf'><div class='confbar'></div><span>" + conf + " / " + set_confirmations + " confirmations</span></div>" :
        (conf === 0) ? "<div class='txli_conf' data-conf='0'><div class='confbar'></div><span>Unconfirmed transaction<span></div>" : "",
        view_tx_markup = (lnhash) ? "<li><strong class='show_tx'><span class='icon-power'></span><span class='ref'>View invoice</span></strong></li>" : (txhash) ? "<li><strong class='show_tx'><span class='icon-eye'></span>View on blockchain</strong></li>" : "",
        statustext = (ismonitored === false) ? "" : (status == "new") ? "Waiting for payment" : status,
        src_html = (source) ? "<span class='src_txt'>source: " + source + "</span><span class='icon-wifi-off'></span><span class='icon-connection'></span>" : "",
        iscryptoclass = (iscrypto === true) ? "" : " isfiat",
        archivebutton = (showarchive === true) ? "<div class='icon-folder-open' title='archive request'></div>" : "",
        render_archive = (txhistory && (pending == "no" || archive === true)),
        tl_text = (render_archive === true) ? "Transactions:" : "",
        edit_request = (local === true) ? "<div class='editrequest icon-pencil' title='edit request' data-requestid='" + requestid + "'></div>" : "",
        pid_li = (payment_id) ? "<li><strong>Payment ID:</strong> <span class='select' data-type='payment ID'>" + payment_id + "</span></li>" : "",
        ia_li = (xmr_ia) ? "<li><p class='address'><strong>Integrated Address:</strong> <span class='requestaddress select'>" + xmr_ia + "</span></p></li>" : "",
        ln_emoji = (lnhash) ? " <span class='icon-power'></span>" : "",
        ln_logo = "<img src='img_logos_btc-lnd.png' class='cmc_icon'><img src='img_logos_btc-lnd.png' class='cmc_icon'>",
        cclogo = getcc_icon(cmcid, cpid, erc20) + getcc_icon(cmcid, cpid, erc20),
        cc_logo = (lightning) ? (txhash && !lnhash) ? cclogo : ln_logo : cclogo,
        rc_address_title = (hybrid) ? "Fallback address" : "Receiving Address",
        address_markup = (lightning && (lnhash || hybrid === false)) ? "" : "<li><p class='address'><strong>" + rc_address_title + ":</strong> <span class='requestaddress select'>" + address + "</span>" + requestlabel + "</p></li>",
        new_requestli = $("<li class='rqli " + requesttypeclass + expiredclass + lnclass + "' id='" + requestid + "' data-cmcid='" + cmcid + "' data-status='" + status + "' data-address='" + address + "' data-pending='" + pending + "' data-iscrypto='" + iscrypto + "'>\
            <div class='liwrap iconright'>" + cc_logo +
            "<div class='atext'>\
                    <h2>" + requesttitlestring + "</h2>\
                    <p class='rq_subject'>" + typeicon + requestnamestring + "</p>\
                </div>\
                <p class='rq_date' title='" + requestdateformatted + "'>" + timeformat + "</p><br/>\
                <div class='pmetastatus' data-count='0'>+ 0</div>\
                <div data-rel='" + paymenturl + "' class='payrequest button" + iscryptoclass + "'>\
                    <span class='icon-qrcode'>Pay</span>\
                </div>\
            </div>\
            <div class='moreinfo'>\
                <div class='req_actions'>\
                    <div data-rel='" + paymenturl + "' class='icon-qrcode" + iscryptoclass + "'></div>\
                    <div class='icon-bin' title='delete'></div>" +
            archivebutton +
            "<div class='icon-undo2' title='unarchive request'></div>\
                    <div class='icon-info' title='show info'></div>" + edit_request + "</div>\
                <ul class='metalist'>\
                    <li class='cnamemeta'><strong>Currency:</strong> " + payment + ln_emoji + "</li>" +
            requestnamebox +
            requesttitlebox +
            "<li><strong>Amount:</strong> " + amount_rounded + " " + uoa_upper + "</li>\
                    <li class='meta_status' data-conf='" + conf + "'><strong>Status:</strong><span class='status'> " + statustext + "</span> " + conf_box + "</li>\
                    <li><strong>Type:</strong> " + typetext + ismonitoredspan + "</li>" +
            timestampbox +
            paymentdetails +
            address_markup +
            pid_li +
            ia_li +
            "<li class='receipt'><p><span class='icon-file-pdf' title='View receipt'/>Receipt</p></li>" + view_tx_markup +
            "</ul>\
                <ul class='transactionlist'>\
                    <h2>" + tl_text + "</h2>\
                </ul>\
                <div class='api_source'>" + src_html + "</div>\
            </div>\
            <div class='brstatuspanel flex'>\
                <img src='" + c_icons("confirmed") + "'>\
                <h2>Payment " + direction + "</h2>\
            </div>\
            <div class='brmarker'></div>\
            <div class='expired_panel'><h2>Expired</h2></div>\
        </li>");
    new_requestli.data(rd).prependTo(requestlist);
    if (render_archive === true) {
        let transactionlist = requestlist.find("#" + requestid).find(".transactionlist");
        $.each(txhistory, function(dat, val) {
            let txh = val.txhash,
                lnh = (txh && txh.slice(0, 9) == "lightning") ? true : false,
                tx_listitem = append_tx_li(val, false, lnh);
            if (tx_listitem.length > 0) {
                transactionlist.append(tx_listitem.data(val));
            }
        });
    }
}

// ** Store data in localstorage **

//update used cryptocurrencies
function savecurrencies(add) {
    let currenciespush = [];
    $("#usedcurrencies li").each(function(i) {
        currenciespush.push($(this).data());
    });
    br_set_local("currencies", currenciespush, true);
    updatechanges("currencies", add);
}

//update addresses in localstorage
function saveaddresses(currency, add) {
    let pobox = get_addresslist(currency),
        addresses = pobox.find("li");
    if (addresses.length) {
        let addressboxpush = [];
        addresses.each(function(i) {
            addressboxpush.push($(this).data());
        });
        br_set_local("cc_" + currency, addressboxpush, true)
    } else {
        br_remove_local("cc_" + currency);
        br_remove_local(currency + "_settings");
    }
    updatechanges("addresses", add);
}

//update requests
function saverequests() {
    let requestpush = [];
    $("ul#requestlist > li").each(function() {
        requestpush.push($(this).data());
    });
    br_set_local("requests", requestpush, true);
    updatechanges("requests", true);
}

//update archive
function savearchive() {
    let requestpush = [];
    $("ul#archivelist > li").each(function() {
        requestpush.push($(this).data());
    });
    br_set_local("archive", requestpush, true);
}

//update settings
function savesettings(nit) {
    let settingsspush = [];
    $("ul#appsettings > li.render").each(function() {
        settingsspush.push($(this).data());
    });;
    br_set_local("settings", settingsspush, true);
    updatechanges("settings", true, nit);
}

function save_cc_settings(currency, add) {
    let settingbox = {};
    $("#" + currency + "_settings ul.cc_settinglist > li").each(function() {
        let thisnode = $(this);
        settingbox[thisnode.attr("data-id")] = thisnode.data();
    });
    br_set_local(currency + "_settings", settingbox, true);
    updatechanges("currencysettings", add);
}

function updatechanges(key, add, nit) {
    let p = GD_pass();
    if (p.active === false) {} else {
        if (p.pass) {
            updateappdata(p);
            return
        }
        if (p.expired) {
            t_expired(p.expired, "uad");
            return
        }
    }
    if (add === true) {
        let cc = changes[key],
            cc_correct = (cc) ? cc : 0;
        changes[key] = cc_correct + 1;
        savechangesstats();
        if (nit == "noalert") {
            return
        }
        change_alert();
    }
}

function resetchanges() {
    changes = {};
    savechangesstats();
    body.removeClass("haschanges");
    $("#alert > span").text("0").attr("title", "You have 0 changes in your app");
}

function savechangesstats() {
    br_set_local("changes", changes, true);
}

// render changes
function renderchanges() {
    let changescache = br_get_local("changes", true);
    if (changescache) {
        changes = changescache;
        return
    }
    changes = {};
}

function change_alert() {
    if (is_ios_app === true) {
        return
    }
    let total_changes = get_total_changes();
    if (total_changes > 0) {
        $("#alert > span").text(total_changes).attr("title", "You have " + total_changes + " changes in your app");
        setTimeout(function() {
            body.addClass("haschanges");
        }, 2500);
        if (total_changes == 20 || total_changes == 50 || total_changes == 150 || total_changes == 200 || total_changes == 250) {
            canceldialog();
            let timeout = setTimeout(function() {
                backupdatabase();
            }, 3000, function() {
                clearTimeout(timeout);
            });
        }
    }
}

function get_total_changes() {
    let totalchanges = 0;
    $.each(changes, function(key, value) {
        let thisval = (value) ? value : 0;
        totalchanges += parseInt(thisval);
    });
    return totalchanges;
}

// HTML rendering

function render_html(dat) {
    let result = "";
    $.each(dat, function(i, value) {
        $.each(value, function(key, val) {
            let id = (val.id) ? " id='" + val.id + "'" : "",
                clas = (val.class) ? " class='" + val.class + "'" : "",
                attr = (val.attr) ? render_attributes(val.attr) : "",
                cval = val.content,
                content = (cval) ? (typeof cval == "object") ? render_html(cval) : cval : "",
                close = (val.close) ? "/>" : ">" + content + "</" + key + ">";
            result += "<" + key + id + clas + attr + close;
        });
    });
    return result;
}

function render_attributes(attr) {
    let attributes = "";
    $.each(attr, function(key, value) {
        attributes += " " + key + "='" + value + "'";
    });
    return attributes;
}

// HTML templates

function template_dialog(ddat) {
    let validated_class = (ddat.validated) ? " validated" : "",
        dialog_object = [{
            "div": {
                "id": ddat.id,
                "class": "formbox",
                "content": [{
                        "h2": {
                            "class": ddat.icon,
                            "content": ddat.title
                        }
                    },
                    {
                        "div": {
                            "class": "popnotify"
                        }
                    },
                    {
                        "div": {
                            "class": "pfwrap",
                            "content": render_html(ddat.elements)
                        }
                    }
                ]
            }
        }]
    return render_html(dialog_object);
}

// ** Helpers **

function open_url() {
    $(document).on("click", "a.exit", function(e) {
        e.preventDefault();
        let this_href = $(this),
            target = this_href.attr("target"),
            url = this_href.attr("href");
        loader(true);
        loadertext("Loading " + url);
        if (is_ios_app === true) {
            cancelpaymentdialog();
        }
        setTimeout(function() {
            closeloader();
            if (target == "_blank") {
                window.open(url);
            } else {
                w_loc.href = url;
            }
        }, 500);
    })
}

function get_blockcypher_apikey() {
    let savedkey = $("#apikeys").data("blockcypher");
    return (savedkey) ? savedkey : to.bc_id;
}

function get_infura_apikey(rpcurl) {
    let savedkey = $("#apikeys").data("infura");
    return (/^[A-Za-z0-9]+$/.test(rpcurl.slice(rpcurl.length - 15))) ? "" : // check if rpcurl already contains apikey
        (savedkey) ? savedkey : to.if_id;
}

function proxy_alert(version) {
    if (version) {
        body.addClass("haschanges");
        $("#alert > span").text("!").attr("title", "Please update your proxy server " + version + " > " + proxy_version);
    }
}

function fetchsymbol(currencyname) {
    let ccsymbol = {};
    $.each(br_get_local("erc20tokens", true), function(key, value) {
        if (value.name == currencyname) {
            ccsymbol.symbol = value.symbol;
            ccsymbol.id = value.cmcid;
            return
        }
    });
    return ccsymbol;
}

function fixedcheck(livetop) {
    let headerheight = $(".showmain #header").outerHeight();
    if (livetop > headerheight) {
        $(".showmain").addClass("fixednav");
        return
    }
    $(".showmain").removeClass("fixednav");
}

function ishome(pagename) {
    let page = (pagename) ? pagename : geturlparameters().p;
    return (!page || page == "home");
}

function triggersubmit(trigger) {
    trigger.parent("#actions").prev("#dialogbody").find("input.submit").trigger("click");
}

function copytoclipboard(content, type) {
    let copy_api = navigator.clipboard;
    if (copy_api) {
        navigator.clipboard.writeText(content);
        notify(type + " copied to clipboard", 2500, "no");
        return
    }
    copycontent.val(content);
    copycontent[0].setSelectionRange(0, 999);
    try {
        let success = document.execCommand("copy");
        if (success) {
            notify(type + " copied to clipboard", 2500, "no");
        } else {
            notify("Unable to copy " + type, 2500, "no");
        }
    } catch (err) {
        notify("Unable to copy " + type, 2500, "no");
    }
    copycontent.val("").data({
        "type": false
    }).blur();
}

function loader(top) {
    let loader = $("#loader"),
        class_string = (top === true) ? "showpu active toploader" : "showpu active";
    $("#loader").addClass(class_string);
}

function closeloader_trigger() {
    $(document).on("click", "#loader", function() {
        closeloader();
    })
}

function closeloader() {
    $("#loader").removeClass("showpu active toploader");
    loadertext("loading");
}

function loadertext(text) {
    $("#loader #loadtext > span").text(text);
}

function settitle(title) {
    titlenode.text(title);
    ogtitle.attr("content", title);
}

function all_pinpanel(cb, top) {
    let topclass = (top) ? " ontop" : "";
    if (haspin() === true) {
        let lastlock = br_get_local("locktime"),
            tsll = now() - lastlock,
            pass = (tsll < 10000);
        if (cb && pass) { // keep unlocked in 10 second time window
            cb.func(cb.args);
            return
        }
        let content = pinpanel(" pinwall", cb);
        showoptions(content, "pin" + topclass);
        return
    }
    let content = pinpanel("", cb);
    showoptions(content, "pin" + topclass);
}

function pinpanel(pinclass, pincb) {
    let makeclass = (pinclass === undefined) ? "" : pinclass,
        headertext = (haspin() === true) ? "Please enter your pin" : "Create a 4-digit pin";
    return $("<div id='pinfloat' class='enterpin" + makeclass + "'>\
        <p id='pintext'>" + headertext + "</p>\
        <p id='confirmpin'>Confirm your pin</p>\
        <input id='pininput' type='password' readonly='readonly'/>\
        <input id='validatepin' type='password' readonly='readonly'/>\
        <div id='pinkeypad'>\
            <div id='pin1' class='pinpad flex'>\
                <span class='pincell'>1</span>\
            </div>\
            <div id='pin2' class='pinpad'>\
                <span class='pincell'>2</span>\
            </div>\
            <div id='pin3' class='pinpad'>\
                <span class='pincell'>3</span>\
            </div><br>\
            <div id='pin4' class='pinpad'>\
                <span class='pincell'>4</span>\
            </div>\
            <div id='pin5' class='pinpad'>\
                <span class='pincell'>5</span>\
            </div>\
            <div id='pin6' class='pinpad'>\
                <span class='pincell'>6</span>\
            </div><br>\
            <div id='pin7' class='pinpad'>\
                <span class='pincell'>7</span>\
            </div>\
            <div id='pin8' class='pinpad'>\
                <span class='pincell'>8</span>\
            </div>\
            <div id='pin9' class='pinpad'>\
                <span class='pincell'>9</span>\
            </div><br>\
            <div id='locktime' class='pinpad'>\
                <span class='icomoon'></span>\
            </div>\
            <div id='pin0' class='pinpad'>\
                <span class='pincell'>0</span>\
            </div>\
            <div id='pinback' class='pinpad'>\
                <span class='icomoon'></span>\
            </div>\
        </div>\
        <div id='pin_admin' class='flex'>\
            <div id='pin_admin_float'>\
                <div id='lock_time'><span class='icomoon'></span> Lock time</div>\
                <div id='reset_pin'>Reset pin</div>\
            </div>\
        </div>\
    </div>").data("pincb", pincb);
}

function switchpanel(switchmode, mode) {
    return "<div class='switchpanel " + switchmode + mode + "'><div class='switch'></div></div>"
}

function try_next_api(apilistitem, current_apiname) {
    let apilist = br_config.apilists[apilistitem],
        next_scan = apilist[$.inArray(current_apiname, apilist) + 1],
        next_api = (next_scan) ? next_scan : apilist[0];
    if (api_attempt[apilistitem][next_api] === true) {
        return false;
    }
    return next_api;
}

function wake() {
    if (wl) {
        const requestwakelock = async () => {
            try {
                wakelock = await wl.request("screen");
                wakelock.addEventListener("release", (e) => {
                    //console.log(e);
                });
            } catch (e) {
                //console.error(e.name, e.message);
            }
        };
        requestwakelock();
    }
}

function sleep() {
    if (wl) {
        if (wakelock) {
            wakelock.release();
        }
        wakelock = null;
    }
}

function vu_block() {
    notify("Not allowed in cashier mode");
    playsound(funk);
}

// Recent requests

function check_rr() {
    let ls_recentrequests = br_get_local("recent_requests", true);
    if (ls_recentrequests) {
        if ($.isEmptyObject(ls_recentrequests)) {
            toggle_rr(false);
            return
        }
        toggle_rr(true);
        return
    }
    toggle_rr(false);
}

function toggle_rr(bool) {
    if (bool) {
        html.addClass("show_rr");
        let hist_bttn = $("#request_history");
        hist_bttn.addClass("load");
        setTimeout(function() {
            hist_bttn.removeClass("load");
        }, 500);
        return
    }
    html.removeClass("show_rr");
}

// ** Get_app **

function detectapp() {
    if (inframe === true || is_android_app === true || is_ios_app === true) {
        return
    }
    if (android_standalone === true || ios_standalone === true) {
        return
    }
    let local_appstore_dialog = br_get_local("appstore_dialog");
    if (local_appstore_dialog) {
        let localdelay = 300000,
            cachetime = now() - local_appstore_dialog;
        if (cachetime < localdelay) {
            return
        }
        if (supportsTouch === true) {
            let device = getdevicetype();
            if (device == "Android") {
                if (/SamsungBrowser/.test(userAgent)) {
                    return // skip samsungbrowser
                }
            }
            if (device == "iPhone" || device == "iPad" || device == "Macintosh") {
                getapp("apple");
            } else {
                getapp("android");
            }
        }
    } else {
        br_set_local("appstore_dialog", now());
    }
}

function getapp(type) {
    let app_panel = $("#app_panel");
    app_panel.html("");
    let android = (type == "android"),
        button = (android === true) ? fetch_aws("img_button-playstore.png") : fetch_aws("img_button-appstore.png"),
        url = (android === true) ? "https://play.google.com/store/apps/details?id=" + androidpackagename + "&pcampaignid=fdl_long&url=" + approot + encodeURIComponent(w_loc.search) : "https://apps.apple.com/app/id1484815377?mt=8",
        panelcontent = "<h2>Download the app</h2>\
            <a href='" + url + "' class='exit store_bttn'><img src='" + button + "'></a><br/>\
            <div id='not_now'>Not now</div>";
    app_panel.html(panelcontent);
    setTimeout(function() {
        body.addClass("getapp");
    }, 1500);
    br_set_local("appstore_dialog", now());
}

function close_app_panel() {
    $(document).on("click", "#not_now", function() {
        body.removeClass("getapp");
        setTimeout(function() {
            $("#app_panel").html("");
        }, 800);
    });
}

function platform_icon(platform) {
    return (platform == "playstore") ? fetch_aws("img_button-playstore.png") :
        (platform == "appstore") ? fetch_aws("img_button-appstore.png") :
        fetch_aws("img_button-desktop_app.png");
}

// ** Query helpers **//

function get_setting(setting, dat) {
    return $("#" + setting).data(dat);
}

function set_setting(setting, keypairs, title) {
    let set_node = $("#" + setting);
    set_node.data(keypairs);
    if (title) {
        set_node.find("p").text(title);
    }
}

function get_requestli(datakey, dataval) {
    return $("#requestlist li.rqli").filter(function() {
        return $(this).data(datakey) == dataval;
    })
}

function ch_pending(dat) {
    return ($("#requestlist li.rqli[data-address='" + dat.address + "'][data-pending='scanning'][data-cmcid='" + dat.cmcid + "']").length > 0) ? true : false;
}

function get_addresslist(currency) {
    return $("main #" + currency + " .content ul.pobox[data-currency='" + currency + "']");
}

function filter_addressli(currency, datakey, dataval) {
    let addressli = get_addresslist(currency).children("li");
    return filter_list(addressli, datakey, dataval);
}

function filter_all_addressli(datakey, dataval) {
    return filter_list($(".adli"), datakey, dataval);
}

function filter_list(list, datakey, dataval) {
    return list.filter(function() {
        return $(this).data(datakey) == dataval;
    })
}

function get_currencyli(currency) {
    return $("#usedcurrencies > li[data-currency='" + currency + "']");
}

function get_homeli(currency) {
    return $("#currencylist > li[data-currency='" + currency + "']");
}

function cs_node(currency, id, data) {
    let coinnode = $("#" + currency + "_settings .cc_settinglist li[data-id='" + id + "']");
    if (coinnode.length) {
        if (data) {
            let coindat = coinnode.data();
            if (coindat) {
                return coindat;
            }
        }
        return coinnode;
    }
    return false
}

function getcoindata(currency) {
    let coindata_object = getcoinconfig(currency);
    if (coindata_object) {
        let coindata = coindata_object.data,
            settings = coindata_object.settings,
            has_settings = (settings) ? true : false,
            is_monitored = (settings) ? (settings.apis) ? true : false : false,
            cd_object = {
                "currency": coindata.currency,
                "ccsymbol": coindata.ccsymbol,
                "cmcid": coindata.cmcid,
                "monitored": is_monitored,
                "urlscheme": coindata.urlscheme,
                "settings": has_settings,
                "regex": coindata.address_regex,
                "erc20": false
            };
        return cd_object;
    } // if not it's probably erc20 token
    let currencyref = get_currencyli(currency); // check if erc20 token is added
    if (currencyref.length > 0) {
        return $.extend(currencyref.data(), br_config.erc20_dat.data);
    } // else lookup erc20 data
    let tokenobject = br_get_local("erc20tokens", true);
    if (tokenobject) {
        let erc20data = $.grep(tokenobject, function(filter) {
            return filter.name == currency;
        })[0];
        if (erc20data) {
            let fetched_data = {
                "currency": erc20data.name,
                "ccsymbol": erc20data.symbol,
                "cmcid": erc20data.cmcid.toString(),
                "contract": erc20data.contract
            }
            return $.extend(fetched_data, br_config.erc20_dat.data);
        }
    }
    return false;
}

function activecoinsettings(currency) {
    let saved_coinsettings = br_get_local(currency + "_settings", true);
    return (saved_coinsettings) ? saved_coinsettings : getcoinsettings(currency);
}

function getcoinsettings(currency) {
    let coindata = getcoinconfig(currency);
    if (coindata) {
        return coindata.settings;
    } // return erc20 settings
    return br_config.erc20_dat.settings;
}

function getcoinconfig(currency) {
    return $.grep(br_config.bitrequest_coin_data, function(filter) {
        return filter.currency == currency;
    })[0];
}

function is_opendialog() {
    return ($("#dialogbody > div.formbox").length) ? true : false;
}

function is_openrequest() {
    return ($("#request_front").length) ? true : false;
}

// ** Check params **//

function check_params(gets) {
    let lgets = (gets) ? gets : geturlparameters();
    if (lgets.xss) {
        return
    }
    if (lgets.i) {
        expand_shoturl(lgets.i);
        return
    }
    if (lgets.cl) {
        click_pop(lgets.cl);
    }
    let page = lgets.p;
    if (page == "settings") {
        if (lgets.ro) {
            check_teaminvite(lgets.ro);
        } else if (lgets.sbu) {
            check_systembu(lgets.sbu);
        } else if (lgets.csv) {
            check_csvexport(lgets.csv);
        } else if (lgets.code) {
            init_access(lgets.code);
        }
        return
    }
    if (lgets.scheme) {
        check_intents(lgets.scheme);
        return
    }
    if (lgets.lnconnect) {
        lm_function();
        ln_connect();
    }
}

function check_intents(scheme) {
    if (scheme == "false") {
        return
    }
    let scheme_url = atob(scheme),
        proto = scheme_url.split(":")[0];
    if (proto == "eclair" || proto == "acinq" || proto == "lnbits") {
        let content = "<h2 class='icon-warning'>" + proto + ": connect not available at the moment</h2>";
        popdialog(content, "canceldialog");
        return
    }
    if (proto == "lndconnect" || proto == "c-lightning-rest") {
        let imp = (proto == "lndconnect") ? "lnd" : (proto == "c-lightning-rest") ? "c-lightning" : proto,
            scheme_obj = renderlnconnect(scheme_url);
        if (scheme_obj) {
            let resturl = scheme_obj.resturl,
                macaroon = scheme_obj.macaroon;
            if (resturl && macaroon) {
                lm_function();
                ln_connect({
                    "lnconnect": btoa(resturl),
                    "macaroon": macaroon,
                    "imp": imp
                });
                return
            }
            popnotify("error", "unable to decode qr");
        }
        return
    }
    if (proto.length < 1) {
        let content = "<h2 class='icon-warning'>Invalid URL scheme</h2>";
        popdialog(content, "canceldialog");
        return
    }
    if (proto && proto.length > 0) {
        let content = "<h2 class='icon-warning'>URL scheme '" + proto + ":' is not supported</h2>";
        popdialog(content, "canceldialog");
        return
    }
}

function expand_shoturl(i_param) {
    if (i_param.startsWith("4bR")) { // handle bitly shortlink
        expand_bitly(i_param);
        return
    }
    let getcache = br_get_session("longurl_" + i_param);
    if (getcache) { // check for cached values
        ios_redirections(getcache);
        return
    }
    if (i_param) {
        let p_index = i_param.slice(0, 1),
            shortid = i_param.slice(1),
            proxy = proxy_list[p_index],
            is_url = (proxy.indexOf("https://") >= 0);
        if (is_url) {
            let payload = {
                "function": "fetch",
                "shortid": shortid
            };
            $.ajax({
                "method": "POST",
                "cache": false,
                "timeout": 5000,
                "url": proxy + "proxy/v1/inv/api/",
                "data": payload
            }).done(function(e) {
                let data = br_result(e).result;
                if (data) {
                    let status = data.status;
                    if (status) {
                        if (status == "file not found") {
                            let content = "<h2 class='icon-warning'>Request not found or expired</h2>";
                            popdialog(content, "canceldialog");
                            closeloader();
                            return
                        }
                        if (status == "file exists") {
                            let longurl = data.sharedurl;
                            if (longurl) {
                                let to_localurl = makelocal(longurl);
                                ios_redirections(to_localurl);
                                br_set_session("longurl_" + i_param, to_localurl);
                                return
                            }
                        }
                    }
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                let content = "<h2 class='icon-warning'>Failed to fetch request</h2>";
                popdialog(content, "canceldialog");
                closeloader();
                return
            });
        }
    }
}

function expand_bitly(i_param) {
    if (hostlocation == "local") {
        return
    }
    let bitly_id = i_param.slice(3),
        getcache = br_get_session("longurl_" + bitly_id);
    if (getcache) { // check for cached values
        ios_redirections(getcache);
        return
    }
    api_proxy({
        "api": "bitly",
        "search": "expand",
        "cachetime": 84600,
        "cachefolder": "1d",
        "bearer": true,
        "params": {
            "method": "POST",
            "contentType": "application/json",
            "data": JSON.stringify({
                "bitlink_id": "bit.ly/" + bitly_id
            })
        }
    }).done(function(e) {
        let data = br_result(e).result;
        if (data.error) {
            w_loc.href = "http://bit.ly/" + bitly_id;
            return
        }
        if (data) {
            let longurl = data.long_url;
            if (longurl) {
                ios_redirections(longurl);
                br_set_session("longurl_" + bitly_id, longurl);
                return
            }
            w_loc.href = "http://bit.ly/" + bitly_id;
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        w_loc.href = "http://bit.ly/" + bitly_id;
    });
}

function ln_connect(gets) {
    let lgets = (gets) ? gets : geturlparameters(),
        lnconnect = lgets.lnconnect,
        macaroon = lgets.macaroon,
        imp = lgets.imp;
    if (macaroon && imp) {
        let macval = b64urldecode(macaroon);
        if (macval) {
            let resturl = atob(lnconnect),
                set_vals = set_ln_fields(imp, resturl, macval);
            if (set_vals === true) {
                $("#adln_drawer").show();
                let cs_boxes = $("#lnd_credentials .lndcd"),
                    cd_box_select = $("#lnd_credentials .cs_" + imp);
                $("#lnd_select_input").data("value", imp).val(imp);
                cs_boxes.not(cd_box_select).hide();
                cd_box_select.show();
                trigger_ln();
                openpage("?p=bitcoin_settings", "bitcoin_settings", "loadpage");
                return
            }
            console.log("Unable to set data");
            return
        }
        notify("Invalid macaroon format");
        return
    }
    notify("Invalid format");
}

function click_pop(fn) {
    let timeout = setTimeout(function() {
        $("#" + fn).trigger("click");
    }, 1200, function() {
        clearTimeout(timeout);
    });
}

// add serviceworker
function add_serviceworker() {
    if ("serviceWorker" in navigator) {
        if (!navigator.serviceWorker.controller) {
            navigator.serviceWorker.register(approot + "serviceworker.js", {
                    "scope": "./"
                })
                .then(function(reg) {
                    // console.log("Service worker has been registered for scope: " + reg.scope);
                });
        }
    }
}