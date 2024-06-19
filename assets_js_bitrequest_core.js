//globals
const glob_ls_support = check_local(),
    glob_language = navigator.language || navigator.userLanguage,
    glob_userAgent = navigator.userAgent || navigator.vendor || window.opera,
    glob_titlenode = $("title"),
    glob_ogtitle = $("meta[property='og:title']"),
    glob_html = $("html"),
    glob_body = $("body"),
    glob_paymentpopup = $("#payment"),
    glob_paymentdialogbox = $("#paymentdialogbox"),
    glob_copycontent = $("#copyinput"),
    glob_funk = $("#funk"), // funk sound effect
    glob_cashier = $("#cashier"), // cashier sound effect
    glob_collect = $("#collect"), // collect sound effect
    glob_blip = $("#blip"), // blip sound effect
    glob_waterdrop = $("#waterdrop"), // waterdrop sound effect
    glob_howl = $("#howl"), // howl sound effect
    glob_timezoneoffset = new Date().getTimezoneOffset(),
    glob_timezone = glob_timezoneoffset * 60000,
    glob_has_ndef = ("NDEFReader" in window),
    glob_supportsTouch = ("ontouchstart" in window || navigator.msMaxTouchPoints) ? true : false,
    glob_referrer = document.referrer,
    glob_exp_referrer = "android-app://" + glob_androidpackagename,
    glob_ref_match = (glob_referrer && glob_referrer.indexOf(glob_exp_referrer) >= 0) ? true : false,
    glob_android_standalone = window.matchMedia("(display-mode: standalone)").matches,
    glob_ios_standalone = navigator.standalone,
    glob_is_android_app = (glob_ref_match), // android app fingerprint
    glob_inframe = (self !== top),
    glob_offline = (navigator.onLine === false),
    glob_w_loc = window.location,
    glob_c_host = glob_w_loc.origin + glob_w_loc.pathname,
    glob_thishostname = glob_w_loc.hostname,
    glob_hostlocation = (glob_thishostname == "" || glob_thishostname == "localhost" || glob_thishostname === "127.0.0.1") ? "local" :
    (glob_thishostname == "bitrequest.github.io") ? "hosted" :
    (glob_thishostname == glob_localhostname) ? "selfhosted" : "unknown",
    glob_wl = navigator.wakeLock,
    glob_after_poll_timeout = 15000,
    glob_xss_alert = "xss attempt detected",
    glob_langcode = setlangcode(); // set saved or system language

let glob_scrollposition = 0,
    glob_is_ios_app = false, // ios app fingerprint
    glob_phpsupport,
    glob_symbolcache,
    glob_hascam,
    glob_cp_timer,
    glob_local,
    glob_localserver,
    glob_wakelock,
    glob_bipv,
    glob_bipobj = br_get_local("bpdat", true),
    glob_hasbip = (glob_bipobj) ? true : false,
    glob_bipid = (glob_hasbip) ? glob_bipobj.id : false,
    glob_ndef,
    glob_ctrl,
    glob_cashier_dat = br_get_local("cashier", true),
    glob_is_cashier = (glob_cashier_dat && glob_cashier_dat.cashier) ? true : false,
    glob_cashier_seedid = (glob_is_cashier) ? glob_cashier_dat.seedid : false,
    glob_stored_currencies = br_get_local("currencies", true),
    glob_init = br_get_local("init", true),
    glob_io = br_dobj(glob_init, true),
    glob_new_address, // prevent double address entries
    glob_proxy_attempts = {},
    glob_sockets = {},
    glob_pinging = {};

if (glob_has_ndef && !glob_inframe) {
    glob_ndef = new NDEFReader();
}

$(document).ready(function() {
    $.ajaxSetup({
        "cache": false
    });
    buildsettings(); // build settings first

    if (glob_hostlocation != "local") { // don't add service worker on desktop
        add_serviceworker();
    }

    //close potential websockets and pings
    forceclosesocket();
    clearpinging();

    //Set classname for ios app	
    if (glob_is_ios_app === true) {
        glob_body.addClass("ios");
    }

    //Set classname for iframe	
    if (glob_inframe === true) {
        glob_html.addClass("inframe hide_app");
    } else {
        glob_html.addClass("noframe");
    }

    //some api tests first
    rendersettings(); //retrieve settings from localstorage (load first to retrieve apikey)
    if (glob_ls_support) { //check for local storage support
        if (!glob_stored_currencies) { //show startpage if no addresses are added
            glob_body.addClass("showstartpage");
        }
        const bipverified = glob_io.bipv,
            phpsupport = glob_io.phpsupport;
        if (bipverified && glob_hasbip === true) {
            glob_bipv = true;
        }
        if (phpsupport) {
            glob_phpsupport = (phpsupport == "yes") ? true : false;
            setsymbols();
        } else {
            checkphp();
        }
    } else {
        const content = "<h2 class='icon-bin'>Sorry!</h2><p>No Web Storage support..</p>";
        popdialog(content, "canceldialog");
    }
    $("#fixednav").html($("#relnav").html()); // copy nav
    //startscreen
    setTimeout(function() {
        const startscreen = $("#startscreen");
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
        "config": glob_br_config
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
        const result = br_result(e);
        if (result.proxy === true) {
            const symbols = q_obj(result, "result.result.symbols");
            if (symbols) {
                if (symbols.USD) {
                    br_set_local("symbols", symbols, true);
                } else {
                    const this_error = (data.error) ? data.error : "Unable to get API data";
                    fail_dialogs("fixer", this_error);
                }
            }
            glob_io.phpsupport = "yes";
            br_set_local("init", glob_io, true);
            glob_phpsupport = true;
            setsymbols();
            return
        }
        glob_io.phpsupport = "no";
        br_set_local("init", glob_io, true);
        glob_phpsupport = false;
        setsymbols();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        glob_io.phpsupport = "no";
        br_set_local("init", glob_io, true);
        glob_phpsupport = false;
        setsymbols();
    });
}

function setsymbols() { //fetch fiat currencies from fixer.io api
    //set globals
    glob_local = (glob_hostlocation == "local" && glob_phpsupport === false),
        glob_localserver = (glob_hostlocation == "local" && glob_phpsupport === true);
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
        const data = br_result(e).result;
        if (data) {
            const symbols = data.symbols;
            if (symbols && symbols.USD) {
                br_set_local("symbols", symbols, true);
                geterc20tokens();
                return
            }
            const this_error = (data.error) ? data.error : "Unable to get API data";
            fail_dialogs("fixer", this_error);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const next_proxy = get_next_proxy();
        if (next_proxy) {
            setsymbols();
            return
        }
        const content = "<h2 class='icon-bin'>" + translate("apicallfailed") + "</h2><p class='doselect'>" + textStatus + "<br/>" + translate("apididnotrespond") + "<br/><br/><span id='proxy_dialog' class='ref'>" + translate("tryotherproxy") + "</span></p>";
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
        const data = br_result(e).result,
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
    const apiurl = glob_approot + "assets_data_erc20.json";
    $.getJSON(apiurl, function(data) {
        if (data) {
            storecoindata(data);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const content = "<h2 class='icon-bin'>" + translate("apicallfailed") + "</h2><p class='doselect'>" + translate("nofetchtokeninfo") + "</p>";
        popdialog(content, "canceldialog");
    });
}

function storecoindata(data) {
    if (data) {
        const erc20push = [];
        $.each(data.data, function(key, value) {
            const platform = value.platform;
            if (platform) {
                if (platform.id === 1027) { // only get erc20 tokens
                    const erc20box = {
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

function haspin(set) {
    const pinsettings = $("#pinsettings").data(),
        pinhash = pinsettings.pinhash;
    if (pinhash) {
        const pinstring = pinhash.toString(),
            plength = (pinstring.length > 3) ? true : false;
        if (plength) {
            if (set) {
                return true;
            }
            if (pinsettings.locktime == "never") {
                return false;
            }
            return true;
        }
    }
    return false;
}

function islocked() {
    const gets = geturlparameters(),
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
        const content = pinpanel(" pinwall global");
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
    //getnetwork

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
    //get_arbiscan_apikey
    //get_alchemy_apikey
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
    glob_html.addClass("loaded");
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
    glob_html.attr("lang", glob_langcode);
    $("meta[property='og:locale']").attr("content", glob_langcode);
    $("meta[property='og:url']").attr("content", glob_w_loc.href);
}

function setpermissions() {
    const permission = $("#permissions").data("selected");
    glob_html.attr("data-role", permission);
}

function is_viewonly() {
    const permission = $("#permissions").data("selected");
    return (permission == "cashier");
}

// ** Pincode **

function pinkeypress() {
    $(document).keydown(function(e) {
        const pinfloat = $("#pinfloat");
        if (pinfloat.length) {
            const keycode = e.keyCode;
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
    const pinfloat = $("#pinfloat"),
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
    const pinfloat = $("#pinfloat"),
        pinsettings = $("#pinsettings").data(),
        savedpin = pinsettings.pinhash,
        attempts = pinsettings.attempts,
        hashpin = hashcode(pinval),
        _now = now(),
        global = (pinfloat.hasClass("global")) ? true : false;
    if (hashpin == savedpin) {
        if (global) {
            br_set_local("locktime", _now);
            finishfunctions();
            setTimeout(function() {
                playsound(glob_waterdrop);
                canceloptions(true);
            }, 500);
        } else if (pinfloat.hasClass("admin")) {
            br_set_local("locktime", _now);
            loadpage("?p=currencies");
            $(".currenciesbttn .self").addClass("activemenu");
            playsound(glob_waterdrop);
            canceloptions(true);
        } else if (pinfloat.hasClass("reset")) {
            br_set_local("locktime", _now);
            $("#pintext").text(translate("enternewpin"));
            pinfloat.addClass("p_admin").removeClass("pinwall reset");
            playsound(glob_waterdrop);
            setTimeout(function() {
                $("#pininput").val("");
            }, 200);
        } else {
            const callback = pinfloat.data("pincb");
            if (callback) {
                callback.func(callback.args);
            } else {
                br_set_local("locktime", _now);
            }
            playsound(glob_waterdrop);
            canceloptions(true);
        }
        pinsettings.attempts = 0;
        savesettings(global);
        remove_cashier();
    } else {
        if (navigator.vibrate) {} else {
            playsound(glob_funk);
        }
        shake(pinfloat);
        setTimeout(function() {
            $("#pininput").val("");
        }, 10);
        if (attempts > 2) {
            if (attempts === 3) {
                const timeout = _now + 300000; // 5 minutes
                pinsettings.timeout = timeout;
                lockscreen(timeout);
            } else if (attempts === 6) {
                const timeout = _now + 1800000; // 30 minutes
                pinsettings.timeout = timeout;
                lockscreen(timeout);
            } else if (attempts === 9) {
                const timeout = _now + 86400000; // 24 hours
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
    const pinsettings = $("#pinsettings").data();
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
    const pinfloat = $("#pinfloat"),
        thisval = thispad.text(),
        pininput = $("#validatepin"),
        pinval = pininput.val(),
        newval = pinval + thisval;
    if (newval.length > 3) {
        if (newval == $("#pininput").val()) {
            const current_pin = get_setting("pinsettings", "pinhash"),
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
            playsound(glob_waterdrop);
            canceloptions(true);
            const callback = pinfloat.data("pincb");
            if (callback) {
                callback.func(callback.args);
            }
            notify(translate("datasaved"));
            enc_s(seed_decrypt(current_pin));
        } else {
            const pinfloat = $("#pinfloat");
            topnotify(translate("pinmatch"));
            if (navigator.vibrate) {} else {
                playsound(glob_funk);
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
    const pinval = pininput.val(),
        inputlength = pinval.length,
        prevval = pinval.substring(0, inputlength - 1);
    pininput.val(prevval);
}

// ** IOS Redirects **

// (Can only be envoked from the IOS app) 

//Set classname for ios app

function ios_init() {
    glob_is_ios_app = true;
    glob_body.addClass("ios"); // ios app fingerprint
}

function ios_redirections(url) {
    if (url) {
        const search = get_search(url),
            gets = renderparameters(search);
        if (gets.xss) {
            return
        }
        const currenturlvar = glob_w_loc.href,
            currenturl = currenturlvar.toUpperCase(),
            newpage = url.toUpperCase();
        if (currenturl == newpage) {
            return
        }
        if (br_get_local("editurl") == glob_w_loc.search) {
            return
        }
        const isrequest = (newpage.indexOf("PAYMENT=") >= 0),
            isopenrequest = (glob_paymentpopup.hasClass("active"));
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
            const pagename = (gets.p) ? gets.p : "prompt";
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
    const thisnext = thisnode.attr("data-next");
    if (thisnext === undefined) {
        return
    }
    if (thisnode.hasClass("validstep")) {
        $("#startpage").attr("class", "sp_" + thisnext);
        thisnode.removeClass("panelactive").next(".startpanel").addClass("panelactive");
        $("#eninput").blur();
        return
    }
    topnotify(translate("enteryourname"));
}

function startprev(thisnode) {
    const thisprev = thisnode.attr("data-prev");
    if (thisprev === undefined) {
        return
    }
    $("#startpage").attr("class", "sp_" + thisprev);
    thisnode.removeClass("panelactive").prev(".startpanel").addClass("panelactive");
    $("#eninput").blur();
}

function lettercountkeydown() { // Character limit on input field
    $(document).on("keydown", "#eninput", function(e) {
        const keycode = e.keyCode,
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
            playsound(glob_funk);
            e.preventDefault();
        }
    });
}

function lettercountinput() { // Character count plus validation
    $(document).on("input", "#eninput", function() {
        const thisinput = $(this),
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
        const currency = $(this).attr("data-currency"),
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
        if (glob_html.hasClass("showmain")) {
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
            const content = pinpanel(" pinwall admin");
            showoptions(content, "pin");
            return
        }
        loadpage("?p=currencies");
        $(".currenciesbttn .self").addClass("activemenu");
    });
}

function loadurl() {
    const gets = geturlparameters();
    if (gets.xss) {
        loadpageevent("home");
        return
    }
    const page = gets.p,
        payment = gets.payment,
        url = glob_w_loc.search,
        event = (payment) ? "both" : "loadpage";
    if (url) {
        openpage(url, page, event);
    } else {
        loadpageevent("home");
    }
    shownav(page);
    const bip39info = gets.bip39;
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
    const pagename = href.split("&")[0].split("=").pop();
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
        const statemeta = e.state;
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
    const page_tl = translate(pagename),
        page_title = (page_tl) ? page_tl : pagename;
    settitle(page_title);
    cancel_url_dialogs();
}

function cancel_url_dialogs() {
    if (glob_paymentpopup.hasClass("active")) {
        cancelpaymentdialog();
    }
    if (glob_body.hasClass("showcam")) {
        $("#closecam").trigger("click");
    }
}

function loadpageevent(pagename) {
    $("html, body").animate({
        "scrollTop": 0
    }, 400);
    const currentpage = $("#" + pagename);
    currentpage.addClass("currentpage");
    $(".page").not(currentpage).removeClass("currentpage");
    $(".highlightbar").attr("data-class", pagename);
    shownav(pagename);
    const requestfilter = geturlparameters().filteraddress; // filter requests if filter parameter exists
    if (requestfilter && pagename == "requests") {
        $("#requestlist > li").not(get_requestli("address", requestfilter)).hide();
    } else {
        $("#requestlist > li").show();
    }
}

function shownav(pagename) { // show / hide navigation
    if (ishome(pagename) === true) {
        glob_html.removeClass("showmain").addClass("hidemain");
        $("#relnav .nav").slideUp(300);
        return
    }
    glob_html.addClass("showmain").removeClass("hidemain")
    $("#relnav .nav").slideDown(300);
}

function activemenu() {
    $(document).on("click", ".nav li .self", function() {
        const thisitem = $(this);
        thisitem.addClass("activemenu");
        $(".nav li .self").not(thisitem).removeClass("activemenu");
        return
    })
}

function fixednav() {
    $(document).scroll(function(e) {
        if (glob_html.hasClass("paymode")) {
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
    const currency = thislink.data("currency"),
        can_derive = derive_first_check(currency);
    if (can_derive === true) {
        triggertxfunction(thislink);
        return
    }
    const pick_random = cs_node(currency, "Use random address", true).selected,
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
        if (seedid != glob_bipid) {
            if (addr_whitelist(thisaddress) === true) {} else {
                const pass_dat = {
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
        const thisdialog = $("#addresswarning"),
            d_dat = thisdialog.data(),
            pk_checkbox = thisdialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked"),
            ds_checkbox = thisdialog.find("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (pk_checked == true) {} else {
            popnotify("error", translate("confirmpkownership"));
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
    const seedstr = (pass_dat.xpubid) ? "Xpub" : "Seed",
        rest_str = (seedstr == "Seed") ? (glob_hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + pass_dat.seedid + "'>" + translate("resoresecretphrase") + "</div>" : "",
        seedstrtitle = (seedstr == "Seed") ? translate("bip39_passphrase") : seedstr;
    return $("<div class='formbox addwarning' id='" + id + "'>\
        <h2 class='icon-warning'>" + translate("warning") + "</h2>\
        <div class='popnotify'></div>\
        <p><strong>" + translate("missingkeywarning", {
            "seedstrtitle": seedstrtitle,
            "address": address
        }) + "</strong></p>\
        <form class='addressform popform'>\
            <div class='inputwrap'>\
                <div class='pk_wrap noselect'>\
                    <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div>\
                    <span>" + translate("pkownership") + "</span>\
                </div>\
                <div class='pk_wrap noselect'>\
                    <div id='dontshowwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div>\
                    <span>" + translate("dontshowagain") + "</span>\
                </div>" + rest_str +
        "</div>\
            <input type='submit' class='submit' value='" + translate("okbttn") + "'>\
        </form>\
    </div>").data(pass_dat);
}

function finishtxfunction(currency, thisaddress, savedurl, title) {
    glob_prevkey = false;
    const gets = geturlparameters();
    if (gets.xss) {
        return
    }
    const cd = getcoindata(currency),
        currencysettings = $("#currencysettings").data(),
        c_default = currencysettings.default,
        currencysymbol = (c_default === true && glob_offline === false) ? currencysettings.currencysymbol : cd.ccsymbol,
        currentpage = gets.p,
        currentpage_correct = (currentpage) ? "?p=" + currentpage + "&payment=" : "?payment=",
        prefix = currentpage_correct + currency + "&uoa=",
        newlink = prefix + currencysymbol + "&amount=0" + "&address=" + thisaddress,
        href = (!savedurl || glob_offline !== false) ? newlink : savedurl, //load saved url if exists
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
        const thisnode = $(this);
        if (glob_offline === true && thisnode.hasClass("isfiat")) {
            // do not trigger fiat request when offline because of unknown exchange rate
            notify(translate("xratesx"));
            return
        }
        const thisrequestlist = thisnode.closest("li.rqli"),
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
            paymenturl_amount = (amount_short_rounded && insufficient === true) ? amount_short_rounded : rl_amount,
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
        const parentlistitem = $(this).closest("li"),
            coindata = parentlistitem.data(),
            currency = coindata.currency,
            checked = coindata.checked,
            currencylistitem = get_homeli(currency);
        if (checked === true) {
            parentlistitem.attr("data-checked", "false").data("checked", false);
            currencylistitem.addClass("hide");
        } else {
            const lscurrency = br_get_local("cc_" + currency);
            if (lscurrency) {
                const addresslist = get_addresslist(currency),
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
        const parentlistitem = $(this).closest("li"),
            checked = parentlistitem.data("checked"),
            parentlist = parentlistitem.closest("ul.pobox"),
            addresscount = parentlist.find("li[data-checked='true']").length,
            currency = parentlist.attr("data-currency");
        if (checked === true || checked == "true") {
            parentlistitem.attr("data-checked", "false").data("checked", false);
        } else {
            const a_dat = parentlistitem.data();
            if (parentlistitem.hasClass("seedu")) {
                const address = a_dat.address,
                    seedid = a_dat.seedid;
                if (addr_whitelist(address) === true) {} else {
                    const pass_dat = {
                            "address": address,
                            "pli": parentlistitem,
                            "seedid": seedid
                        },
                        content = get_address_warning("addresswarningcheck", address, pass_dat);
                    popdialog(content, "triggersubmit");
                    return
                }
            } else if (parentlistitem.hasClass("xpubu")) {
                const address = a_dat.address;
                if (addr_whitelist(address) === true) {} else {
                    const haspub = has_xpub(currency),
                        xpubid = a_dat.xpubid;
                    if (haspub === false || (haspub && haspub.key_id != xpubid)) {
                        const pass_dat = {
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
        const thisdialog = $("#addresswarningcheck"),
            d_dat = thisdialog.data(),
            pk_checkbox = thisdialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked"),
            ds_checkbox = thisdialog.find("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (pk_checked == true) {} else {
            popnotify("error", translate("confirmpkownership"));
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
    const parentlist = parentlistitem.closest("ul.pobox"),
        currency = parentlist.attr("data-currency");
    parentlistitem.attr("data-checked", "true").data("checked", true);
    check_currency(currency);
    saveaddresses(currency, false);
    clear_savedurl();
}

function add_seed_whitelist(seedid) {
    const stored_whitelist = br_get_local("swl", true),
        seed_whitelist = br_dobj(stored_whitelist);
    if ($.inArray(seedid, seed_whitelist) === -1) {
        seed_whitelist.push(seedid);
    }
    br_set_local("swl", seed_whitelist, true);
}

function seed_wl(seedid) {
    const stored_whitelist = br_get_local("swl", true),
        seed_whitelist = br_dobj(stored_whitelist);
    return ($.inArray(seedid, seed_whitelist) === -1) ? false : true;
}

function add_address_whitelist(address) {
    const stored_whitelist = br_get_local("awl", true),
        address_whitelist = br_dobj(stored_whitelist);
    if ($.inArray(address, address_whitelist) === -1) {
        address_whitelist.push(address);
    }
    br_set_local("awl", address_whitelist, true);
}

function addr_whitelist(address) {
    const stored_whitelist = br_get_local("awl", true),
        address_whitelist = br_dobj(stored_whitelist);
    return ($.inArray(address, address_whitelist) === -1) ? false : true;
}

function check_pk() {
    $(document).on("click", "#popup .cb_wrap", function() {
        const thisnode = $(this),
            checked = thisnode.data("checked");
        if (checked == true) {
            thisnode.attr("data-checked", "false").data("checked", false);
        } else {
            thisnode.attr("data-checked", "true").data("checked", true);
        }
    });
}

function check_currency(currency) {
    const addresscount = filter_addressli(currency, "checked", true).length;
    if (addresscount > 0) {
        currency_check(currency);
        return
    }
    currency_uncheck(currency);
}

function currency_check(currency) {
    const currencylistitem = get_homeli(currency),
        parentcheckbox = get_currencyli(currency);
    currencylistitem.removeClass("hide");
    parentcheckbox.attr("data-checked", "true").data("checked", true);
    savecurrencies(false);
}

function currency_uncheck(currency) {
    const currencylistitem = get_homeli(currency),
        parentcheckbox = get_currencyli(currency);
    currencylistitem.addClass("hide");
    parentcheckbox.attr("data-checked", "false").data("checked", false);
    savecurrencies(false);
}

function toggleswitch() {
    $(document).on("mousedown", ".switchpanel.global", function() {
        const thistoggle = $(this);
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
        const options = $(this).next(".options");
        if (options.hasClass("showoptions")) {
            options.removeClass("showoptions");
        } else {
            options.addClass("showoptions");
        }
    });
}

function selectbox() {
    $(document).on("click", ".selectbox > input:not([readonly])", function() {
        const thisselect = $(this),
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
        const thisselect = $(this),
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
        const thistrigger = $(this),
            thisradio = thistrigger.find(".radio");
        if (thisradio.hasClass("icon-radio-unchecked")) {
            $(".formbox .conf_options .radio").not(thisradio).removeClass("icon-radio-checked2").addClass("icon-radio-unchecked")
            thisradio.removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
        } else {
            thisradio.removeClass("icon-radio-checked2").addClass("icon-radio-unchecked");
        }
        const thisvalue = thistrigger.children("span").text(),
            thisinput = $(".formbox input:first");
        thisinput.val(thisvalue);
    })
}

function dialog_drawer() {
    $(document).on("click", "#ad_info_wrap .d_trigger", function() {
        const thistrigger = $(this),
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
        const this_drag = $(this),
            addresses = this_drag.closest(".applist").find("li");
        if (addresses.length < 2) {
            return
        }
        const thisli = this_drag.closest("li"),
            dialogheight = thisli.height(),
            startheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
        drag(thisli, dialogheight, startheight, thisli.index());
    })
}

function drag(thisli, dialogheight, startheight, thisindex) {
    $(document).on("mousemove touchmove", ".currentpage .applist li", function(e) {
        e.preventDefault();
        thisli.addClass("dragging");
        glob_html.addClass("dragmode");
        const currentheight = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY,
            dragdistance = currentheight - startheight;
        thisli.addClass("dragging").css({
            "-webkit-transform": "translate(0, " + dragdistance + "px)"
        });
        $(".currentpage .applist li").not(thisli).each(function(i) {
            const this_li = $(this),
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
        const thisunit = $(this).closest("li");
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
            glob_html.removeClass("dragmode");
            clear_savedurl();
        }
    })
}

function keyup() {
    $(document).keyup(function(e) {
        if (e.keyCode == 39) { // ArrowRight
            if (glob_body.hasClass("showstartpage")) {
                e.preventDefault();
                startnext($(".panelactive"));
                return
            }
            if (glob_paymentdialogbox.find("input").is(":focus")) {
                playsound(glob_funk);
                return
            }
            const timelapsed = now() - glob_sa_timer;
            if (timelapsed < 500) { // prevent clicking too fast
                playsound(glob_funk);
                return
            }
            glob_paymentpopup.removeClass("flipping");
            if (glob_paymentdialogbox.hasClass("flipped")) {
                flip_right2();
                setTimeout(function() {
                    glob_paymentpopup.addClass("flipping");
                    glob_paymentdialogbox.css("-webkit-transform", "");
                }, 400);
                return
            }
            if (glob_paymentdialogbox.hasClass("norequest") && (glob_paymentdialogbox.attr("data-pending") == "ispending" || (glob_offline === true))) {
                playsound(glob_funk);
                return
            }
            flip_right1();
            glob_sa_timer = now();
            return
        }
        if (e.keyCode == 37) { // ArrowLeft
            if (glob_body.hasClass("showstartpage")) {
                e.preventDefault();
                startprev($(".panelactive"));
                return
            }
            if (glob_paymentdialogbox.find("input").is(":focus")) {
                playsound(glob_funk);
                return
            }
            const timelapsed = now() - glob_sa_timer;
            if (timelapsed < 500) { // prevent clicking too fast
                playsound(glob_funk);
                return
            }
            glob_paymentpopup.removeClass("flipping");
            if (glob_paymentdialogbox.hasClass("flipped")) {
                flip_left2();
                return
            }
            if (glob_paymentdialogbox.hasClass("norequest") && (glob_paymentdialogbox.attr("data-pending") == "ispending" || (glob_offline === true))) {
                playsound(glob_funk);
                return
            }
            flip_left1();
            setTimeout(function() {
                glob_paymentpopup.addClass("flipping");
                glob_paymentdialogbox.css("-webkit-transform", "rotateY(180deg)");
            }, 400);
            glob_sa_timer = now();
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
    if (glob_body.hasClass("showcam")) {
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
    if (glob_body.hasClass("seed_dialog")) {
        hide_seed_panel();
        return
    }
    if (glob_body.hasClass("showstartpage")) {
        startprev($(".panelactive"));
    }
    if (glob_paymentpopup.hasClass("active")) {
        if (glob_paymentdialogbox.hasClass("flipped") && glob_paymentdialogbox.hasClass("norequest")) {
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
        if (empty === true && glob_inframe === false && request.requesttype == "local") {
            const currency = request.payment,
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
            const rr_whitelist = br_get_session("rrwl", true);
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
    if (glob_html.hasClass("firstload")) {
        const gets = geturlparameters(),
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
    const currency = request.payment,
        blockexplorer = get_blockexplorer(currency),
        bu_url = blockexplorer_url(currency, false, request_dat.erc20) + request_dat.address,
        content = "<div class='formbox'>\
            <h2 class='icon-warning'><span class='icon-qrcode'/>" + translate("nodetection") + "</h2>\
            <div id='ad_info_wrap'>\
                <p><strong><a href='" + bu_url + "' target='_blank' class='ref check_recent'>" + translate("lookuppayment", {
                    "currency": currency,
                    "blockexplorer": blockexplorer
                }) + " <span class='icon-new-tab'></span></a></strong></p>\
                <div class='pk_wrap noselect'>\
                    <div id='dontshowwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div>\
                    <span>" + translate("dontshowagain") + "</span>\
                </div>\
            </div>\
            <div id='backupactions'>\
                <div id='dismiss' class='customtrigger'>" + translate("dismiss") + "</div>\
            </div>\
            </div>";
    popdialog(content, "triggersubmit");
}

function check_recent() {
    $(document).on("click", ".check_recent", function(e) {
        e.preventDefault();
        const thisnode = $(this),
            thisurl = thisnode.attr("href"),
            result = confirm(translate("openurl", {
                "url": thisurl
            }));
        if (result === true) {
            open_share_url("location", thisurl);
        }
        return
    })
}

function dismiss_payment_lookup() {
    $(document).on("click", "#dismiss", function() {
        const ds_checkbox = $("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (ds_checked == true) {
            block_payment_lookup();
        }
        canceldialog();
        if (glob_paymentpopup.hasClass("active")) {
            close_paymentdialog();
        }
    })
}

function block_payment_lookup() {
    if (request) {
        const rr_whitelist = br_get_session("rrwl", true),
            rrwl_arr = br_dobj(rr_whitelist, true);
        rrwl_arr[request.payment] = request.address;
        br_set_session("rrwl", rrwl_arr, true);
    }
}

function request_history() {
    $(document).on("click", "#request_history", function() {
        const ls_recentrequests = br_get_local("recent_requests", true);
        if (ls_recentrequests) {
            recent_requests(ls_recentrequests);
        }
    })
}

function recent_requests(recent_payments) {
    const addresslist = recent_requests_list(recent_payments);
    if (addresslist.length) {
        const content = "<div class='formbox'>\
            <h2 class='icon-history'>" + translate("recentrequests") + ":</h2>\
            <div id='ad_info_wrap'>\
            <ul>" + addresslist + "</ul>\
            </div>\
            <div id='backupactions'>\
                <div id='dismiss' class='customtrigger'>" + cancelbttn + "</div>\
            </div>\
            </div>";
        popdialog(content, "triggersubmit");
    }
}

function recent_requests_list(recent_payments) {
    let addresslist = "";
    const rp_array = [];
    $.each(recent_payments, function(key, val) {
        if (val) {
            rp_array.push(val);
        }
    });
    const sorted_array = rp_array.sort(function(x, y) {
        return y.rqtime - x.rqtime;
    });
    $.each(sorted_array, function(i, val) {
        if (val) {
            const currency = val.currency,
                ccsymbol = val.ccsymbol,
                address = val.address,
                cmcid = val.cmcid,
                erc20 = val.erc20,
                rq_time = val.rqtime,
                source = val.source,
                blockchainurl = blockexplorer_url(currency, false, erc20, source) + address;
            addresslist += "<li class='rp_li'>" + getcc_icon(cmcid, ccsymbol + "-" + currency, erc20) + "<strong style='opacity:0.5'>" + short_date(rq_time + glob_timezone) + "</strong><br/>\
            <a href='" + blockchainurl + "' target='_blank' class='ref check_recent'>\
            <span class='select'>" + address + "</span> <span class='icon-new-tab'></a></li>";
        }
    });
    return addresslist;
}

//notifications
function notify(message, time, showbutton) {
    const settime = (time) ? time : 4000,
        setbutton = (showbutton) ? showbutton : "no",
        notify = $("#notify");
    $("#notifysign").html(message + "<span class='icon-cross'></div>").attr("class", "button" + setbutton);
    notify.addClass("popupn");
    const timeout = setTimeout(function() {
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
    const topnotify = $("#topnotify");
    topnotify.text(message).addClass("slidedown");
    const timeout = setTimeout(function() {
        topnotify.removeClass("slidedown");
    }, 7000, function() {
        clearTimeout(timeout);
    });
}

function popnotify(result, message) { // notifications in dialogs
    const notify = $(".popnotify");
    if (result == "error") {
        notify.removeClass("success warning").addClass("error");
    } else if (result == "warning") {
        notify.removeClass("success error").addClass("warning");
    } else {
        notify.addClass("success").removeClass("error warning");
    }
    notify.slideDown(200).html(message);
    const timeout = setTimeout(function() {
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
    glob_body.addClass("blurmain");
    $("#popup").addClass("active showpu");
    const thistrigger = (trigger) ? trigger : $("#popup #execute");
    if (functionname) {
        execute(thistrigger, functionname);
    }
    if (glob_supportsTouch) {} else {
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
    const currency = cd.currency;
    if (get_addresslist(currency).children("li").length) {
        derive_first_check(currency);
        loadpage("?p=" + currency);
        return
    }
    const can_derive = derive_first_check(currency);
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
        const derives = check_derivations(currency);
        if (derives) {
            const has_derives = active_derives(currency, derives);
            if (has_derives === false) {
                return derive_addone(currency);
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
    const currency = ad.currency,
        cpid = ad.ccsymbol + "-" + currency,
        address = (ad.address) ? ad.address : "",
        label = (ad.label) ? ad.label : "",
        derived = (ad.seedid || ad.xpubid),
        readonly = (edit === true) ? " readonly" : "",
        nopub = (glob_test_derive === false) ? true : (is_xpub(currency) === false || has_xpub(currency) !== false),
        choose_wallet_str = "<span id='get_wallet' class='address_option' data-currency='" + currency + "'>" + translate("noaddressyet", {
            "currency": currency
        }) + "</span>",
        derive_seed_str = "<span id='option_makeseed' class='address_option' data-currency='" + currency + "'>" + translate("generatewallet") + "</span>",
        options = (glob_hasbip === true) ? choose_wallet_str : (glob_test_derive === true && glob_c_derive[currency]) ? (hasbip32(currency) === true) ? derive_seed_str : choose_wallet_str : choose_wallet_str,
        pnotify = (glob_body.hasClass("showstartpage")) ? "<div class='popnotify' style='display:block'>" + options + "</div>" : "<div class='popnotify'></div>",
        scanqr = (glob_hascam === true && edit === false) ? "<div class='qrscanner' data-currency='" + currency + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        title = (edit === true) ? "<h2 class='icon-pencil'>" + translate("editlabel") + "</h2>" : "<h2>" + getcc_icon(ad.cmcid, cpid, ad.erc20) + " " + translate("addcoinaddress", {
            "currency": currency
        }) + "</h2>",
        pk_checkbox = (edit === true) ? "" : "<div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("pkownership") + "</span></div>",
        addeditclass = (edit === true) ? "edit" : "add",
        xpubclass = (nopub) ? " hasxpub" : " noxpub",
        xpubph = (nopub) ? translate("entercoinaddress", {
            "currency": currency
        }) : translate("nopub"),
        vk_val = (ad.vk) ? ad.vk : "",
        has_vk = (vk_val != ""),
        scanvk = (glob_hascam === true) ? "<div class='qrscanner' data-currency='" + currency + "' data-id='viewkey' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        vk_box = (currency == "monero") ? (has_vk) ? "" : "<div class='inputwrap'><input type='text' class='vk_input' value='" + vk_val + "' placeholder='" + translate("secretviewkey") + "'>" + scanvk + "</div>" : "",
        content = $("<div class='formbox form" + addeditclass + xpubclass + "' id='addressformbox'>" + title + pnotify + "<form id='addressform' class='popform'><div class='inputwrap'><input type='text' id='address_xpub_input' class='address' value='" + address + "' data-currency='" + currency + "' placeholder='" + xpubph + "'" + readonly + ">" + scanqr + "</div>" + vk_box + "<input type='text' class='addresslabel' value='" + label + "' placeholder='label'>\
        <div id='ad_info_wrap' style='display:none'>\
            <ul class='td_box'>\
            </ul>\
            <div id='pk_confirm' class='noselect'>\
                <div id='matchwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("xpubmatch", {
                "currency": currency
            }) + "</span>\
            </div>\
        </div>" + pk_checkbox +
            "<input type='submit' class='submit' value='" + translate("okbttn") + "'></form>").data(ad);
    popdialog(content, "triggersubmit");
    if (glob_supportsTouch) {
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
        const thisnode = $(this),
            addressinputval = thisnode.val();
        if (addressinputval.length > 103) {
            const currency = thisnode.attr("data-currency"),
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
    const addresslist = get_addresslist(currency).children("li");
    if (addresslist.length < 1) {
        return false;
    }
    const coinsettings = activecoinsettings(currency);
    if (coinsettings) {
        const reuse = coinsettings["Reuse address"];
        if (reuse) {
            if (reuse.selected === true) {
                return true;
            }
        } else {
            return true;
        }
    }
    if (derive == "seed") {
        const active_sder = filter_list(addresslist, "seedid", glob_bipid).not(".used");
        if (active_sder.length) {
            const check_p = ch_pending(active_sder.first().data());
            if (check_p === true) {
                return false;
            }
        } else {
            return false;
        }
    }
    if (derive == "xpub") {
        const activepub = active_xpub(currency),
            xpubid = activepub.key_id,
            active_xder = filter_list(addresslist, "xpubid", xpubid).not(".used");
        if (active_xder.length) {
            const check_p = ch_pending(active_xder.first().data());
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
        const this_currency = $(this).attr("data-currency");
        canceldialog();
        setTimeout(function() {
            download_wallet(this_currency);
        }, 800);
    })
}

function submitaddresstrigger() {
    $(document).on("click", "#addressformbox input.submit", function(e) {
        e.preventDefault();
        const thisform = $(this).closest("#addressformbox");
        if (thisform.hasClass("hasxpub")) {
            validateaddress_vk(thisform.data());
            return
        }
        const addressinput = thisform.find(".address"),
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
        const tokenobject = br_get_local("erc20tokens", true);
        let tokenlist = "";
        $.each(tokenobject, function(key, value) {
            tokenlist += "<span data-id='" + value.cmcid + "' data-currency='" + value.name + "' data-ccsymbol='" + value.symbol.toLowerCase() + "' data-contract='" + value.contract + "' data-pe='none'>" + value.symbol + " | " + value.name + "</span>";
        });
        const nodedata = {
                "erc20": true,
                "monitored": true,
                "checked": true
            },
            scanqr = (glob_hascam === true) ? "<div class='qrscanner' data-currency='ethereum' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
            content = $("\
            <div class='formbox' id='erc20formbox'>\
                <h2 class='icon-coin-dollar'>" + translate("adderc20token") + "</h2>\
                <div class='popnotify'></div>\
                <form id='addressform' class='popform'>\
                    <div class='selectbox'>\
                        <input type='text' value='' placeholder='" + translate("erc20placeholder") + "' id='ac_input'/>\
                        <div class='selectarrows icon-menu2' data-pe='none'></div>\
                        <div id='ac_options' class='options'>" + tokenlist + "</div>\
                    </div>\
                    <div id='erc20_inputs'>\
                    <div class='inputwrap'><input type='text' class='address' value='' placeholder='" + translate("enteraddress") + "'/>" + scanqr + "</div>\
                    <input type='text' class='addresslabel' value='' placeholder='label'/>\
                    <div id='pk_confirm' class='noselect'>\
                        <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'>\
                            <span class='checkbox'></span>\
                        </div>\
                        <span>" + translate("pkownership") + "</span>\
                    </div></div>\
                    <input type='submit' class='submit' value='" + translate("okbttn") + "'/>\
                </form></div>").data(nodedata);
        popdialog(content, "triggersubmit");
    })
}

function autocomplete_erc20token() {
    $(document).on("input", "#ac_input", function() {
        const thisinput = $(this),
            thisform = thisinput.closest("form"),
            thisvalue = thisinput.val().toLowerCase(),
            options = thisform.find(".options");
        thisform.removeClass("validated");
        $("#ac_options > span").each(function(i) {
            const thisoption = $(this),
                thistext = thisoption.text(),
                currency = thisoption.attr("data-currency"),
                currencysymbol = thisoption.attr("data-ccsymbol"),
                contract = thisoption.attr("data-contract"),
                thisid = thisoption.attr("data-id");
            thisoption.removeClass("show");
            if (thisvalue.length > 2 && currencysymbol === thisvalue || currency === thisvalue) {
                thisform.addClass("validated");
                const coin_data = {
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
        const thisselect = $(this),
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
    const erc20formbox = $("#erc20formbox"),
        erc20_inputs = erc20formbox.find("#erc20_inputs"),
        addressfield = erc20formbox.find("input.address"),
        labelfield = erc20formbox.find("input.addresslabel");
    addressfield.add(labelfield).val("");
    erc20formbox.data(coin_data);
    addressfield.attr("placeholder", translate("entercoinaddress", {
        "currency": coin_data.currency
    }));
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
    const currency = ad.currency,
        addressfield = $("#addressform .address"),
        addressinputval = addressfield.val();
    if (addressinputval) {} else {
        const errormessage = translate("entercoinaddress", {
            "currency": currency
        });
        popnotify("error", errormessage);
        addressfield.focus();
        return
    }
    if (currency) {
        const vkfield = $("#addressform .vk_input"),
            vkinputval = (currency == "monero") ? (vkfield.length) ? vkfield.val() : 0 : 0,
            vklength = vkinputval.length;
        if (vklength) {
            if (vklength !== 64) {
                popnotify("error", translate("invalidvk"));
                return
            }
            if (check_vk(vkinputval)) {} else {
                popnotify("error", translate("invalidvk"));
                return
            }
            const valid = check_address(addressinputval, currency);
            if (valid === true) {} else {
                const errormessage = addressinputval + " " + translate("novalidaddress", {
                    "currency": currency
                });
                popnotify("error", errormessage);
                return
            }
            const payload = {
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
                const data = br_result(e).result,
                    errormessage = data.Error;
                if (errormessage) {
                    const error = (errormessage) ? errormessage : translate("invalidvk");
                    popnotify("error", error);
                    return
                }
                const start_height = data.start_height;
                if (start_height > -1) { // success!
                    validateaddress(ad, vkinputval);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                popnotify("error", translate("errorvk"));
            });
            return
        }
        validateaddress(ad, false);
        return
    }
    popnotify("error", translate("pickacurrency"));
}

function validateaddress(ad, vk) {
    const currency = ad.currency,
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
        const addinputval = (currency == "bitcoin-cash" && addressinputval.indexOf(":") > -1) ? addressinputval.split(":").pop() : addressinputval,
            addressduplicate = (filter_addressli(currency, "address", addinputval).length > 0),
            address = ad.address,
            label = ad.label;
        if (addressduplicate === true && address !== addinputval) {
            popnotify("error", translate("alreadyexists"));
            addressfield.select();
            return
        }
        if (addinputval == glob_new_address) { // prevent double address entries
            console.log("already added");
            return
        }
        const valid = check_address(addinputval, currencycheck);
        if (valid === true) {
            const validlabel = check_address(labelinputval, currencycheck);
            if (validlabel === true) {
                popnotify("error", translate("invalidlabel"));
                labelfield.val(label).select();
                return
            }
            if ($("#addressformbox").hasClass("formedit")) {
                const currentlistitem = currentaddresslist.children("li[data-address='" + address + "']"),
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
            const pk_checkbox = $("#pk_confirmwrap"),
                pk_checked = pk_checkbox.data("checked");
            if (pk_checked == true) {
                if (index === 1) {
                    if (iserc20 === true) {
                        buildpage(ad, true);
                        append_coinsetting(currency, glob_br_config.erc20_dat.settings);
                    }
                    if (glob_body.hasClass("showstartpage")) {
                        const acountname = $("#eninput").val();
                        $("#accountsettings").data("selected", acountname).find("p").text(acountname);
                        savesettings();
                        const href = "?p=home&payment=" + currency + "&uoa=" + ccsymbol + "&amount=0" + "&address=" + addinputval;
                        br_set_local("editurl", href); // to check if request is being edited
                        openpage(href, "create " + currency + " request", "payment");
                        glob_body.removeClass("showstartpage");
                    } else {
                        loadpage("?p=" + currency);
                    }
                }
                glob_new_address = addinputval + currency;
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
            popnotify("error", translate("confirmpkownership"));
            return
        }
        popnotify("error", addressinputval + " " + translate("novalidaddress", {
            "currency": currency
        }));
        setTimeout(function() {
            addressfield.select();
        }, 10);
        return
    }
    popnotify("error", translate("entercoinaddress", {
        "currency": currency
    }));
    addressfield.focus();
}

function check_address(address, currency) {
    const regex = getcoindata(currency).regex;
    return (regex) ? new RegExp(regex).test(address) : false;
}

function check_vk(vk) {
    return new RegExp("^[a-fA-F0-9]+$").test(vk);
}

function send_trigger() {
    $(document).on("click", ".send", function() {
        if (glob_hasbip === true) {
            compatible_wallets($(this).attr("data-currency"));
            return
        }
        playsound(glob_funk);
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
        const target = e.target,
            jtarget = $(target),
            target_id = jtarget.attr("id"),
            options = $("#dialog").find(".options");
        if (options.length > 0 && options.hasClass("showoptions")) {
            const pointerevent = jtarget.attr("data-pe");
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
    if (glob_inframe === true) {
        if (pass === true) {} else {
            if ($("#contactformbox").length > 0) {
                return false;
            }
        }
    }
    const popup = $("#popup");
    glob_body.removeClass("blurmain themepu");
    popup.removeClass("active");
    const timeout = setTimeout(function() {
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
        glob_blockswipe = false;
        if (e.target == this) {
            const inputs = glob_paymentdialogbox.find("input");
            if (inputs.is(":focus")) {
                glob_blockswipe = true;
            }
        }
    })
}

function cancelpaymentdialogtrigger() {
    $(document).on("mouseup", "#payment", function(e) {
        if (glob_blockswipe === true) {
            unfocus_inputs();
            return
        }
        if (glob_html.hasClass("flipmode")) { // prevent closing request when flipping
            return
        }
        const timelapsed = now() - glob_cp_timer;
        if (timelapsed < 1500) { // prevent clicking too fast
            playsound(glob_funk);
            console.log("clicking too fast");
            return
        }
        if (e.target == this) {
            escapeandback();
            glob_cp_timer = now();
        }
    });
}

function unfocus_inputs() {
    const inputs = glob_paymentdialogbox.find("input");
    inputs.blur();
}

function cpd_pollcheck() {
    if (glob_paymentdialogbox.attr("data-lswitch") == "lnd_ao") {
        close_paymentdialog();
        return
    }
    if (request) {
        if (request.received !== true) {
            const rq_init = request.rq_init,
                rq_timer = request.rq_timer,
                rq_time = now() - rq_timer;
            if (rq_time > glob_after_poll_timeout) {
                after_poll(rq_init);
                return
            }
        }
    }
    close_paymentdialog();
}

function cancelpaymentdialog() {
    if (glob_html.hasClass("hide_app")) {
        closeloader();
        parent.postMessage("close_request", "*");
        return
    }
    glob_paymentpopup.removeClass("active");
    glob_html.removeClass("blurmain_payment");
    const timeout = setTimeout(function() {
        glob_paymentpopup.removeClass("showpu outgoing");
        glob_html.removeClass("paymode firstload");
        $(".showmain #mainwrap").css("-webkit-transform", "translate(0, 0)"); // restore fake scroll position
        $(".showmain").closest(document).scrollTop(glob_scrollposition); // restore real scroll position
        remove_flip(); // reset request facing front
        glob_paymentdialogbox.html(""); // remove html
        clearTimeout(timeout);
    }, 600);
    closeloader();
    clearTimeout(glob_request_timer);
    clearpinging();
    closenotify();
    sleep();
    abort_ndef();
    glob_lnd_ph = false,
        request = null,
        helper = null;
    const wstimeout = setTimeout(function() {
        closesocket();
    }, 2500, function() {
        clearTimeout(wstimeout);
    });
}

function closesocket(s_id) {
    if (s_id) { // close this socket
        if (glob_sockets[s_id]) {
            glob_sockets[s_id].close();
            delete glob_sockets[s_id];
        }
    } else { // close all sockets
        $.each(glob_sockets, function(key, value) {
            value.close();
        });
        glob_sockets = {};
    }
    glob_txid = null;
}

function forceclosesocket() {
    console.log("force close");
    clearpinging();
    closesocket();
}

function clearpinging(s_id) {
    if (s_id) { // close this interval
        if (glob_pinging[s_id]) {
            clearInterval(glob_pinging[s_id]);
            delete glob_pinging[s_id]
        }
        return
    }
    if ($.isEmptyObject(glob_pinging)) {} else {
        $.each(glob_pinging, function(key, value) {
            clearInterval(value);
        });
        glob_pinging = {};
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
    const sharepopup = $("#sharepopup");
    sharepopup.removeClass("active");
    glob_body.removeClass("sharemode");
    const timeout = setTimeout(function() {
        sharepopup.removeClass("showpu");
    }, 500, function() {
        clearTimeout(timeout);
    });
}

function showoptionstrigger() {
    $(document).on("click", ".popoptions", function(e) {
        const ad = $(this).closest("li").data(),
            address = ad.address;
        if (address == "lnurl") {
            playsound(glob_funk);
            return
        }
        const savedrequest = $("#requestlist li[data-address='" + address + "']"),
            showrequests = (savedrequest.length > 0) ? "<li><div class='showrequests'><span class='icon-qrcode'></span> " + translate("showrequests") + "</div></li>" : "",
            newrequest = (ad.checked === true) ? "<li>\
                <div data-rel='' class='newrequest' title='create request'>\
                    <span class='icon-plus'></span>" + translate("newrequest") + "</div>\
            </li>" : "",
            content = $("\
                <ul id='optionslist''>" + newrequest + showrequests +
                "<li><div class='address_info'><span class='icon-info'></span> " + translate("addressinfo") + "</div></li>\
                    <li><div class='editaddress'> <span class='icon-pencil'></span> " + translate("editlabel") + "</div></li>\
                    <li><div class='removeaddress'><span class='icon-bin'></span> " + translate("removeaddress") + "</div></li>\
                    <li><div id='rpayments'><span class='icon-history'></span> " + translate("recentpayments") + "</div></li>\
                </ul>").data(ad);
        showoptions(content);
        return
    });
}

function showoptions(content, addclass, callback) {
    if (addclass) {
        if (addclass.indexOf("pin") > -1) {
            const pinsettings = $("#pinsettings").data(),
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
    const plusclass = (addclass) ? " " + addclass : "";
    $("#optionspop").addClass("showpu active" + plusclass);
    $("#optionsbox").html(content);
    glob_body.addClass("blurmain_options");
}

function lockscreen(timer) {
    const timeleft = timer - now(),
        cd = countdown(timeleft),
        dstr = (cd.days) ? cd.days + " " + translate("days") + "<br/>" : "",
        hstr = (cd.hours) ? cd.hours + " " + translate("hours") + "<br/>" : "",
        mstr = (cd.minutes) ? cd.minutes + " " + translate("minutes") + "<br/>" : "",
        sstr = (cd.seconds) ? cd.seconds + " " + translate("seconds") : "",
        cdown_str = dstr + hstr + mstr + sstr,
        attempts = $("#pinsettings").data("attempts"),
        has_seedid = (glob_hasbip || glob_cashier_seedid) ? true : false,
        us_string = (has_seedid === true && attempts > 5) ? "<p id='seed_unlock'>" + translate("unlockwithsecretphrase") + "</p>" : "",
        content = "<h1 id='lock_heading'>Bitrequest</h1><div id='lockscreen'><h2><span class='icon-lock'></span></h2><p class='tmua'>" + translate("tomanyunlocks") + "</p>\
        <p><br/>" + translate("tryagainin") + "<br/>" + cdown_str + "</p>" + us_string +
        "<div id='phrasewrap'>\
            <p><br/>" + translate("enter12words") + "</p>\
                <div id='bip39phrase' contenteditable='contenteditable' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' lang='en' class='noselect'></div>\
                <div id='phrase_login' class='button'>Unlock</div>\
            </div>\
        </div>";
    $("#optionspop").addClass("showpu active pin ontop");
    $("#optionsbox").html(content);
    glob_body.addClass("blurmain_options");
}

function seed_unlock_trigger() {
    $(document).on("click", "#lockscreen #seed_unlock", function() {
        $("#lockscreen #phrasewrap").addClass("showph");
    });
}

function phrase_login() {
    $(document).on("click", "#phrase_login", function() {
        const bip39phrase = $("#lockscreen #bip39phrase"),
            b39txt = bip39phrase.text(),
            seedobject = ls_phrase_obj(),
            savedid = seedobject.pid,
            phraseid = get_seedid(b39txt.split(" "));
        if (phraseid == savedid || phraseid == glob_cashier_seedid) {
            clearpinlock();
            if (glob_html.hasClass("loaded")) {} else {
                finishfunctions();
            }
            const content = pinpanel(" reset");
            showoptions(content, "pin");
            $("#pinfloat").removeClass("p_admin");
            remove_cashier();
        } else {
            shake(bip39phrase);
        }
    });
}

function remove_cashier() {
    if (glob_is_cashier) {
        br_remove_local("cashier");
        glob_cashier_dat = false,
            glob_is_cashier = false,
            glob_cashier_seedid = false;
    }
}

function newrequest_alias() {
    $(document).on("click", "#newrequest_alias", function() {
        const currencylist = $("#currencylist"),
            active_currencies = currencylist.find("li").not(".hide"),
            active_currency_count = active_currencies.length;
        if (active_currency_count === 0) {
            notify(translate("noactivecurrencies"));
            return
        }
        if (active_currency_count > 1) {
            const content = "<ul id='alias_currencylist' class='currencylist'>" + currencylist.html() + "</ul>";
            showoptions(content);
            return
        }
        const active_currency_trigger = active_currencies.find(".rq_icon").first();
        triggertxfunction(active_currency_trigger);
    });
}

function newrequest() {
    $(document).on("click", ".newrequest", function() {
        const thislink = $(this),
            ad = thislink.closest("#optionslist").data(),
            currency = ad.currency,
            address = ad.address,
            ccsymbol = ad.ccsymbol,
            title = thislink.attr("title"),
            seedid = ad.seedid;
        if (seedid) {
            if (seedid != glob_bipid) {
                if (addr_whitelist(address) === true) {} else {
                    const pass_dat = {
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
        const thisdialog = $("#address_newrequest"),
            d_dat = thisdialog.data(),
            pk_checkbox = thisdialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked"),
            ds_checkbox = thisdialog.find("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (pk_checked == true) {} else {
            popnotify("error", translate("confirmpkownership"));
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
        const address = $(this).prev("span").text(),
            result = confirm(translate("showrequestsfor", {
                "address": address
            }));
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
        popdialog("<h2 class='icon-bin'>" + translate("removeaddress") + "</h2>", "removeaddressfunction", $(this));
    })
}

function removeaddressfunction(trigger) {
    const result = confirm(translate("areyousure"));
    if (result === true) {
        const optionslist = trigger.closest("ul#optionslist"),
            ad = optionslist.data(),
            currency = ad.currency,
            address = ad.address,
            erc20 = ad.erc20,
            current_entry = filter_addressli(currency, "address", address),
            currentaddresslist = get_addresslist(currency).children("li");
        current_entry.remove();
        if (currentaddresslist.length) {} else {
            loadpage("?p=currencies");
            const currencyli = get_currencyli(currency),
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
        glob_new_address = null; // prevent double entries
        canceldialog();
        canceloptions();
        notify(translate("addressremoved") + " 🗑");
        saveaddresses(currency, true);
    }
}

function rec_payments() {
    $(document).on("click", "#rpayments", function() {
        const ad = $(this).closest("ul").data(),
            blockchainurl = blockexplorer_url(ad.currency, false, ad.erc20, ad.source);
        if (blockchainurl === undefined) {} else {
            open_blockexplorer_url(blockchainurl + ad.address);
        }
    })
}

function showtransaction_trigger() {
    $(document).on("click", ".metalist .show_tx, .transactionlist .tx_val", function() {
        const thisnode = $(this),
            thislist = thisnode.closest("li"),
            rqli = thisnode.closest("li.rqli"),
            rqldat = rqli.data(),
            txhash = (thisnode.hasClass("tx_val")) ? thislist.data("txhash") : rqldat.txhash;
        if (txhash) {
            const lnhash = (txhash.slice(0, 9) == "lightning") ? true : false;
            if (lnhash) {
                const lightning = rqldat.lightning,
                    imp = lightning.imp,
                    invoice = lightning.invoice;
                if (invoice) {
                    const hash = invoice.hash;
                    if (hash) {
                        const result = confirm(translate("openinvoice", {
                            "hash": hash
                        }));
                        if (result === true) {
                            const proxy = lightning.proxy_host,
                                nid = lightning.nid,
                                pid = lightning.pid,
                                pw = lightning.pw;
                            lnd_lookup_invoice(proxy, imp, hash, nid, pid, pw);
                            return;
                        }
                    }
                }
                playsound(glob_funk);
                return
            }
            const currency = rqli.data("payment"),
                erc20 = rqli.data("erc20"),
                source = rqli.data("source"),
                blockchainurl = blockexplorer_url(currency, true, erc20, source);
            if (blockchainurl) {
                open_blockexplorer_url(blockchainurl + txhash);
            }
        }
    })
}

function showtransactions() {
    $(document).on("click", ".showtransactions", function(e) {
        e.preventDefault();
        const ad = $("#ad_info_wrap").data(),
            blockchainurl = blockexplorer_url(ad.currency, false, ad.erc20, ad.source);
        if (blockchainurl) {
            open_blockexplorer_url(blockchainurl + ad.address);
        }
    })
}

function addressinfo() {
    $(document).on("click", ".address_info", function() {
        const dialogwrap = $(this).closest("ul"),
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
            active_src = (isseed) ? (seedid == glob_bipid) :
            (isxpub) ? (activepub && xpubid == activepub.key_id) : false,
            address = dd.address,
            a_wl = addr_whitelist(address),
            restore = (isseed) ? (glob_hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + seedid + "'>" + translate("resoresecretphrase") + "</div>" : "",
            srcval = (source) ? (active_src) ? source + " <span class='icon-checkmark'>" :
            source + " (Unavailable)" + restore : "external",
            d_index = dd.derive_index,
            purpose = dd.purpose;
        let dpath = (bip32dat) ? bip32dat.root_path + d_index : "";
        if (purpose) {
            const dsplit = dpath.split("/");
            dsplit[1] = purpose;
            dpath = dsplit.join("/");
        }
        dd.dpath = dpath,
            dd.bip32dat = bip32dat,
            dd.address = address;
        const cc_icon = getcc_icon(dd.cmcid, dd.ccsymbol + "-" + currency, dd.erc20),
            dpath_str = (isseed) ? "<li><strong>" + translate("derivationpath") + ":</strong> " + dpath + "</li>" : "",
            pk_verified = "Unknown <span class='icon-checkmark'></span>",
            vkobj = (dd.vk) ? vk_obj(dd.vk) : false,
            vkdat = (vkobj) ? (isseed && active_src) ? "derive" : vkobj.vk : false,
            showtl = translate("show"),
            pk_str = (vkdat) ? "<span id='show_vk' class='ref' data-vk='" + vkdat + "'>" + showtl + "</span>" : (isseed) ? (active_src) ? "<span id='show_pk' class='ref'>" + showtl + "</span>" : (a_wl === true) ? pk_verified : "Unknown" : pk_verified,
            tlpk = translate("privatekey"),
            content = $("<div id='ad_info_wrap'><h2>" + cc_icon + " <span>" + label + "</span></h2><ul>\
                <li><strong>" + translate("address") + ": </strong><span class='adbox adboxl select'>" + address + "</span>\
                <div id='qrcodea' class='qrwrap flex'><div class='qrcode'></div>" + cc_icon + "</div>\
                </li>\
                <li><strong>" + translate("source") + ": </strong>" + srcval + "</li>" +
                dpath_str +
                "<li><strong>" + tlpk + ": </strong>" + pk_str +
                "<div id='pk_span'>\
                    <div class='qrwrap flex'>\
                        <div id='qrcode' class='qrcode'></div>" + cc_icon + "</div>\
                        <p id='pkspan' class='adbox adboxl select' data-type='" + tlpk + "'></p>\
                </div>\
                </li>\
                <li><div class='showtransactions ref'><span class='icon-eye'></span>" + translate("showtransactions") + "</div></li>\
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
        const thisbttn = $(this),
            pkspan = $("#pk_span");
        if (pkspan.is(":visible")) {
            pkspan.slideUp(200);
            thisbttn.text(translate("show"));
            return
        }
        if (pkspan.hasClass("shwpk")) {
            pkspan.slideDown(200);
            thisbttn.text(translate("hide"));
            return
        }
        $("#optionsbox").html("");
        const addat = $("#ad_info_wrap").data(),
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
        }, true, true)
    })
}

function show_pk_cb(pk) {
    $("#show_pk").text(translate("hide"));
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
        const thisbttn = $(this),
            vk = thisbttn.attr("data-vk"),
            pkspan = $("#pk_span");
        if (pkspan.is(":visible")) {
            pkspan.slideUp(200);
            thisbttn.text(translate("show"));
            return
        }
        if (pkspan.hasClass("shwpk")) {
            pkspan.slideDown(200);
            thisbttn.text(translate("hide"));
            return
        }
        $("#optionsbox").html("");
        let x_ko = {};
        if (vk == "derive") {
            const addat = $("#ad_info_wrap").data(),
                keycc = key_cc(),
                dx_dat = {
                    "dpath": addat.dpath,
                    "key": keycc.key,
                    "cc": keycc.cc
                },
                x_keys_dat = derive_x(dx_dat),
                rootkey = x_keys_dat.key,
                ssk = sc_reduce32(fasthash(rootkey));
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
        }, true, true)
    })
}

function show_vk_cb(kd) {
    const stat = kd.stat,
        ststr = (stat) ? "" : "<br/><strong style='color:#8d8d8d'>" + translate("secretviewkey") + "</strong> <span class='adbox adboxl select' data-type='Viewkey'>" + kd.svk + "</span><br/>";
    $("#show_vk").text(translate("hide"));
    $("#pk_span").html(ststr + "<br/><strong style='color:#8d8d8d'>" + translate("secretspendkey") + "</strong> <span class='adbox adboxl select' data-type='Spendkey'>" + kd.ssk + "</span>").addClass("shwpk").slideDown(200);
}

function open_blockexplorer_url(be_link) {
    const result = confirm(translate("openurl", {
        "url": be_link
    }));
    if (result === true) {
        glob_w_loc.href = be_link;
    }
}

function blockexplorer_url(currency, tx, erc20, source) {
    const tx_prefix = (tx === true) ? "tx/" : "address/";
    if (source == "binplorer") {
        return "https://binplorer.com/" + tx_prefix;
    }
    if (source == "arbiscan") {
        return "https://arbiscan.io/" + tx_prefix;
    }
    if (erc20 == "true" || erc20 === true) {
        return "https://ethplorer.io/" + tx_prefix;
    }
    const blockexplorer = get_blockexplorer(currency);
    if (blockexplorer) {
        const blockdata = $.grep(glob_br_config.blockexplorers, function(filter) { //filter pending requests	
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
        const rpc_settings_li = cs_node($(this).closest("li.rqli").data("payment"), "apis");
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
    const optionspop = $("#optionspop"),
        thishaspin = (optionspop.hasClass("pin"));
    if (thishaspin) {
        const phrasewrap = $("#lockscreen #phrasewrap");
        if (phrasewrap.hasClass("showph")) {
            phrasewrap.removeClass("showph");
            return
        }
        if (ishome() === true) {} else {
            if (glob_html.hasClass("loaded")) {} else {
                shake(optionspop);
                return
            }
        }
    }
    clearoptions();
}

function clearoptions() {
    const optionspop = $("#optionspop");
    optionspop.addClass("fadebg");
    optionspop.removeClass("active");
    glob_body.removeClass("blurmain_options");
    const timeout = setTimeout(function() {
        optionspop.removeClass("showpu pin fadebg ontop");
        $("#optionsbox").html("");
    }, 600, function() {
        clearTimeout(timeout);
    });
}

// ** Requestlist functions **

function showrequestdetails() {
    $(document).on("click", ".requestlist .liwrap", function() {
        const thisnode = $(this),
            thislist = thisnode.closest("li"),
            infopanel = thisnode.next(".moreinfo"),
            metalist = infopanel.find(".metalist");
        if (infopanel.is(":visible")) {
            infopanel.add(metalist).slideUp(200);
            thislist.removeClass("visible_request");
        } else {
            const fixednavheight = $("#fixednav").height();
            $(".requestlist > li").not(thislist).removeClass("visible_request");
            $(".moreinfo").add(".metalist").not(infopanel).slideUp(200);
            setTimeout(function() {
                $("html, body").animate({
                    "scrollTop": thislist.offset().top - fixednavheight
                }, 200);
                infopanel.slideDown(200);
                thislist.addClass("visible_request");
                const confbar = thislist.find(".transactionlist .confbar");
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
        const metalist = $(this).closest(".moreinfo").find(".metalist");
        if (metalist.is(":visible")) {
            metalist.slideUp(300);
            return
        }
        const confbar = metalist.find(".confbar");
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
    const txdata = confbox.closest("li").data(),
        percentage = (txdata.confirmations / txdata.setconfirmations) * 100,
        percent_output = (percentage > 100) ? 100 : percentage,
        percent_final = (percent_output - 100).toFixed(2);
    setTimeout(function() {
        confbox.css("transform", "translate(" + percent_final + "%)");
    }, index * 500);
}

function show_transaction_meta() {
    $(document).on("dblclick", ".requestlist li .transactionlist li", function() {
        const thisli = $(this),
            txmeta = thisli.children(".historic_meta");
        if (txmeta.is(":visible")) {
            return
        }
        const txlist = thisli.closest(".transactionlist"),
            alltxmeta = txlist.find(".historic_meta");
        alltxmeta.not(txmeta).slideUp(300);
        txmeta.slideDown(300);
    })
}

function hide_transaction_meta() {
    $(document).on("click", ".requestlist li .transactionlist li", function() {
        const thisli = $(this),
            tx_meta = thisli.children(".historic_meta");
        if (tx_meta.is(":visible")) {
            tx_meta.slideUp(300);
        }
    })
}

function archive() {
    $(document).on("click", "#requestlist .req_actions .icon-folder-open", function() {
        popdialog("<h2 class='icon-folder-open'>" + translate("archiverequest") + "</h2>", "archivefunction", $(this));
    })
}

function archivefunction() {
    const thisreguest = $("#requestlist > li.visible_request"),
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
    notify(translate("movedtoarchive"));
}

function unarchive() {
    $(document).on("click", "#archivelist .req_actions .icon-undo2", function() {
        popdialog("<h2 class='icon-undo2'>" + translate("unarchiverequest") + "</h2>", "unarchivefunction", $(this));
    })
}

function unarchivefunction() {
    const thisreguest = $("#archivelist li.visible_request"),
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
    notify(translate("requestrestored"));
}

function removerequest() {
    $(document).on("click", ".req_actions .icon-bin", function() {
        popdialog("<h2 class='icon-bin'>" + translate("deleterequest") + "?</h2>", "removerequestfunction", $(this));
    })
}

function removerequestfunction() {
    const result = confirm(translate("areyousure"));
    if (result === true) {
        const visiblerequest = $(".requestlist > li.visible_request");
        visiblerequest.slideUp(300);
        setTimeout(function() {
            visiblerequest.remove();
            saverequests();
            savearchive();
        }, 350);
        canceldialog();
        notify(translate("requestdeleted") + " 🗑");
    }
}

function amountshort(amount, receivedamount, fiatvalue, iscrypto) {
    const amount_recieved = (iscrypto === true) ? receivedamount : fiatvalue,
        amount_short = amount - amount_recieved,
        numberamount = (iscrypto === true) ? trimdecimals(amount_short, 5) : trimdecimals(amount_short, 2);
    return (isNaN(numberamount)) ? null : numberamount;
}

function editrequest() {
    $(document).on("click", ".editrequest", function() {
        const thisnode = $(this),
            thisrequestid = thisnode.attr("data-requestid"),
            requestlist = $("#" + thisrequestid),
            requesttitle = requestlist.data("requesttitle"),
            requesttitle_input = (requesttitle) ? requesttitle : "",
            formheader = (requesttitle) ? translate("edit") : translate("enter"),
            content = "\
            <div class='formbox' id='edit_request_formbox'>\
                <h2 class='icon-pencil'>" + formheader + " " + translate("title") + "</h2>\
                <div class='popnotify'></div>\
                <div class='popform'>\
                    <input type='text' value='" + requesttitle_input + "' placeholder='" + translate("title") + "'/>\
                    <input type='submit' class='submit' value='" + translate("okbttn") + "' data-requestid='" + thisrequestid + "'/>\
                </div>\
            </div>";
        popdialog(content, "triggersubmit");
    })
}

function submit_request_description() {
    $(document).on("click", "#edit_request_formbox input.submit", function(e) {
        const thisnode = $(this),
            this_requestid = thisnode.attr("data-requestid"),
            this_requesttitle = thisnode.prev("input").val(),
            requesttitle_val = (this_requesttitle) ? this_requesttitle : "empty";
        if (this_requesttitle) {
            updaterequest({
                "requestid": this_requestid,
                "requesttitle": requesttitle_val
            }, true);
            canceldialog();
            notify(translate("requestsaved"));
            return
        }
        popnotify("error", translate("title") + " " + translate("requiredfield"));
    })
}

// ** Services **

function receipt() {
    $(document).on("click", ".receipt > p", function() {
        const thisnode = $(this),
            requestli = thisnode.closest(".rqli"),
            rqdat = requestli.data(),
            requestid = rqdat.requestid,
            receipt_url = get_pdf_url(rqdat),
            receipt_title = "bitrequest_" + translate("receipt") + "_" + requestid + ".pdf",
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
                                "content": cancelbttn
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "invoiceformbox",
                "icon": "icon-file-pdf",
                "title": receipt_title,
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

function download_receipt() {
    $(document).on("click", "#dl_receipt", function(e) {
        const thisbttn = $(this),
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
        const thisbttn = $(this),
            href = thisbttn.attr("data-receiptdat"),
            requestid = thisbttn.attr("data-requestid"),
            filename = "bitrequest_receipt_" + requestid + ".pdf",
            result = confirm(translate("sharefile", {
                "filename": filename
            }));
        if (result === true) {
            loader(true);
            loadertext(translate("generatereceipt"));
            const accountname = $("#accountsettings").data("selected"),
                sharedtitle = "bitrequest_receipt_" + requestid + ".pdf";
            shorten_url(sharedtitle, href, fetch_aws("img_receipt_icon.png"), true);
            closeloader();
        }
    })
}

function lnd_lookup_invoice(proxy, imp, hash, nid, pid, pw) {
    const p_arr = lnurl_deform(proxy),
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
    loadertext(translate("connecttolnur", {
        "url": lnurl_encode("lnurl", proxy_host)
    }));
    $.ajax(postdata).done(function(e) {
        if (e) {
            const error = e.error;
            if (error) {
                popdialog("<h2 class='icon-blocked'>" + error.message + "</h2>", "canceldialog");
                closeloader();
                return;
            }
            const ddat = [{
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
        notify(translate("nofetchincoice"));
        closeloader();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        notify(translate("nofetchincoice"));
        closeloader();
    });
}

function get_pdf_url(rqdat) {
    const requestid = rqdat.requestid,
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
        ptsformatted = fulldateformat(new Date(paymenttimestamp - glob_timezone), glob_langcode),
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
        source = rqdat.source,
        uoa_upper = uoa.toUpperCase(),
        requestdate = rqdat.requestdate,
        timestamp = rqdat.timestamp,
        utc = timestamp - glob_timezone,
        localtime = (requestdate) ? requestdate - glob_timezone : utc,
        localtimeobject = new Date(localtime),
        requestdateformatted = fulldateformat(localtimeobject, glob_langcode),
        created = (requestdate) ? requestdateformatted : "unknown",
        utc_format = fulldateformat(new Date(utc)),
        invd = {},
        lnd_string = (lnhash) ? " (lightning)" : "";
    invd["Request ID"] = requestid;
    invd[transclear("currency")] = clear_accents(rqdat.payment + lnd_string);
    if (exists(requestname)) {
        invd[transclear("from")] = clear_accents(requestname);
    }
    if (exists(requesttitle)) {
        invd[transclear("title")] = "'" + clear_accents(requesttitle) + "'";
    }
    invd[transclear("amount")] = amount_rounded + " " + uoa_upper,
        invd[transclear("status")] = transclear(statustext),
        invd[transclear("type")] = transclear(typetext);
    if (incoming === true) {
        invd[transclear("created")] = created;
        invd[transclear("firstviewed")] = utc_format;
    }
    invd[transclear("receivingaddress")] = rqdat.address;
    if (status === "paid") {
        invd[transclear("paidon")] = ptsformatted,
            invd[transclear("amountreceived")] = receivedamount_rounded + " " + rqdat.payment;
        if (iscrypto === true) {} else {
            invd[transclear("fiatvalueon") + " " + ptsformatted] = fiatvalue_rounded + " " + currencyname;
        }
    }
    if (exists(txhash)) {
        invd["TxID"] = txhash;
    }
    const network = getnetwork(source);
    if (network) {
        invd[transclear("network")] = network;
    }
    const set_proxy = d_proxy();
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
    const days = cd.days,
        hours = cd.hours,
        minutes = cd.minutes,
        seconds = cd.seconds,
        daynode = (days) ? (days < 2) ? days + " " + translate("day") : days + " " + translate("days") : "",
        hs = (days) ? ", " : "",
        hournode = (hours) ? (hours < 2) ? hs + hours + " " + translate("hour") : hs + hours + " " + translate("hours") : "",
        ms = (hours) ? ", " : "",
        minutenode = (minutes) ? (minutes < 2) ? ms + minutes + " " + translate("minute") : ms + minutes + " " + translate("minutes") : "",
        ss = (minutes) ? " " + translate("and") + " " : "",
        secondnode = (seconds) ? ss + seconds + " " + translate("seconds") : "",
        result = (cd) ? daynode + hournode + minutenode + secondnode : false;
    return result;
}

// ** Page rendering **

//render page from cache
function rendercurrencies() {
    initiate();
    if (glob_stored_currencies) {
        $.each(glob_stored_currencies, function(index, data) {
            const thiscurrency = data.currency,
                thiscmcid = data.cmcid;
            buildpage(data, false);
            render_currencysettings(thiscurrency);
            const addresses = br_get_local("cc_" + thiscurrency, true);
            if (addresses) {
                $.each(addresses.reverse(), function(index, address_data) {
                    appendaddress(thiscurrency, address_data);
                });
            }
        });
    }
    $("ul#allcurrencies").append("<li id='choose_erc20' data-currency='erc20 token' class='start_cli'><div class='liwrap'><h2><img src='" + c_icons("ph") + "'/>" + translate("more") + "...</h2></div></li>\
    <li id='rshome' class='restore start_cli' data-currency='erc20 token'><div class='liwrap'><h2><span class='icon-upload'> " + translate("restorefrombackup") + "</h2></div></li><li id='start_cli_margin' class='start_cli'><div class='liwrap'><h2></h2></div></li>").prepend("<li id='connectln' data-currency='bitcoin' class='start_cli'><div class='liwrap'><h2><img src='img_logos_btc-lnd.png'/>Lightning</h2></div></li>");
}

// render currency settings
function render_currencysettings(thiscurrency) {
    const settingcache = br_get_local(thiscurrency + "_settings", true);
    if (settingcache) {
        append_coinsetting(thiscurrency, settingcache);
    }
}

// build settings
function buildsettings() {
    const appsettingslist = $("#appsettings");
    $.each(glob_br_config.app_settings, function(i, value) {
        const setting_id = value.id,
            selected = value.selected,
            value_tl = translate(selected),
            setval = (value_tl) ? value_tl : selected,
            setting_li = (setting_id == "heading") ? $("<li class='set_heading'>\
              <h2>" + translate(value.heading) + "</h2>\
        </li>") :
            $("<li class='render' id='" + setting_id + "'>\
              <div class='liwrap iconright'>\
                 <span class='" + value.icon + "'></span>\
                 <div class='atext'>\
                    <h2>" + translate(setting_id) + "</h2>\
                    <p>" + setval + "</p>\
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
    const settingcache = br_get_local("settings", true);
    if (settingcache) {
        $.each(settingcache, function(i, value) {
            const settings_id = value.id;
            if ($.inArray(settings_id, excludes) === -1) { // exclude excludes
                const selected = value.selected,
                    value_tl = translate(selected),
                    setval = (settings_id == "accountsettings") ? selected : (value_tl) ? value_tl : selected; // Exclude translations
                $("#" + value.id).data(value).find("p").text(setval);
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
    const viewarchive = $("#viewarchive"),
        archivecount = $("#archivelist > li").length;
    if (archivecount > 0) {
        const va_title = viewarchive.attr("data-title");
        viewarchive.slideDown(300).text(va_title + " (" + archivecount + ")");
        return
    }
    viewarchive.slideUp(300);
}

function fetchrequests(cachename, archive) {
    const requestcache = br_get_local(cachename, true);
    if (requestcache) {
        const showarchive = (archive === false && requestcache.length > 11); // only show archive button when there are more then 11 requests
        $.each(requestcache.reverse(), function(i, value) {
            value.archive = archive;
            value.showarchive = showarchive;
            appendrequest(value);
        });
    }
}

//initiate page when there's no cache
function initiate() {
    $.each(glob_br_config.bitrequest_coin_data, function(dat, val) {
        if (val.active === true) {
            const settings = val.settings,
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
            append_coinsetting(val.currency, settings);
        }
    });
}

function buildpage(cd, ini) {
    const currency = cd.currency,
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
    glob_init = (cc_li.length === 0 && ini === true);
    if (glob_init === true || erc20 === true) {
        const new_li = $("<li class='iconright' data-currency='" + currency + "' data-checked='" + checked + "'>\
            <div data-rel='?p=" + currency + "' class='liwrap addcurrency'>\
                <h2>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + "\</h2>\
            </div>\
            <div class='iconbox togglecurrency'>\
                <span class='checkbox'></span>\
            </div>\
        </li>");
        new_li.data(cd).appendTo(currencylist);
        // append currencies homepage
        const new_homeli = $("<li class='" + visibility + "' data-currency='" + currency + "'>\
            <div class='rq_icon' data-rel='?p=home&payment=" + currency + "&uoa=' data-title='create " + currency + " request' data-currency='" + currency + "'>" +
            getcc_icon(cmcid, cpid, erc20) + "\
            </div>\
        </li>");
        new_homeli.data(cd).appendTo(home_currencylist);
        const settingspage = (has_settings === true) ? "\
        <div class='page' id='" + currency + "_settings' data-erc20='" + erc20 + "'>\
            <div class='content'>\
                <h2 class='heading'>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + " " + translate("settings") + "</h2>\
                <ul class='cc_settinglist settinglist applist listyle2'></ul>\
                <div class='reset_cc_settings button' data-currency='" + currency + "'>\
                    <span>" + translate("resetbutton") + "</span>\
                </div>\
            </div>\
        </div>" : "";
        const settingsbutton = (has_settings === true) ? "<div data-rel='?p=" + currency + "_settings' class='self icon-cog'></div>" : "",
            sendbttn = (glob_hasbip === true) ? "<div class='button send' data-currency='" + currency + "'><span class='icon-telegram'>" + translate("send") + "</span></div>" : "",
            currency_page = $("<div class='page' id='" + currency + "'>\
            <div class='content'>\
                <h2 class='heading'>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + settingsbutton + "</h2>\
                <ul class='applist listyle2 pobox' data-currency='" + currency + "'>\
                    <div class='endli'><div class='button addaddress' data-currency='" + currency + "'><span class='icon-plus'>" + translate("addaddress") + "</span></div>" + sendbttn + "</div>\
                    <div class='addone' data-currency='" + currency + "'>Add one</div>\
                </ul>\
            </div>\
        </div>" + settingspage);
        currency_page.data(cd).appendTo("main");
        if (erc20 === true) {
            const coin_settings_cache = br_get_local(currency + "_settings");
            if (!coin_settings_cache) {
                br_set_local(currency + "_settings", glob_br_config.erc20_dat.settings, true);
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

function append_coinsetting(currency, settings) {
    const coinsettings_list = $("#" + currency + "_settings ul.cc_settinglist");
    $.each(settings, function(dat, val) {
        if (val.xpub === false) {} else {
            const selected = val.selected,
                selected_val = (selected.name) ? selected.name : (selected.url) ? selected.url : selected;
            if (selected_val !== undefined) {
                const selected_string = selected_val.toString(),
                    ss_filter = (selected_string == "true" || selected_string == "false") ? "" : selected_string,
                    ss_tl = translate(ss_filter),
                    ss_translate = (ss_tl) ? ss_tl : ss_filter,
                    check_setting_li = coinsettings_list.children("li[data-id='" + dat + "']");
                if (check_setting_li.length === 0) {
                    const switchclass = (val.custom_switch) ? " custom" : " global bool",
                        trigger = (val.switch === true) ? switchpanel(selected_string, switchclass) : "<span class='icon-pencil'></span>",
                        coinsettings_li = $("<li data-id='" + dat + "'>\
                            <div class='liwrap edit_trigger iconright' data-currency='" + currency + "'>\
                                <span class='icon-" + val.icon + "'></span>\
                                <div class='atext'>\
                                    <h2>" + translate(dat) + "</h2>\
                                    <p>" + ss_translate + "</p>\
                                </div>\
                                <div class='iconbox'>" + trigger + "</div>\
                                </div>\
                        </li>");
                    coinsettings_li.data(val).appendTo(coinsettings_list);
                } else {
                    check_setting_li.data(val).find("p").text(ss_translate);
                    if (val.switch === true) {
                        check_setting_li.find(".switchpanel").removeClass("true false").addClass(selected_string);
                    }
                }
            }
        }
    });
}

function appendaddress(currency, ad) {
    const address = ad.address,
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
        clasv = (source) ? (source == "seed") ? (seedid == glob_bipid) ? " seed seedv" : " seed seedu" :
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
    const payment = rd.payment,
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
        utc = timestamp - glob_timezone,
        localtime = (requestdate) ? requestdate - glob_timezone : utc, // timezone correction
        paymenttimestamp = (rd.paymenttimestamp) ? rd.paymenttimestamp : requestdate,
        incoming = (requesttype == "incoming"),
        local = (requesttype == "local"),
        checkout = (requesttype == "checkout"),
        outgoing = (requesttype == "outgoing"),
        direction = (incoming === true) ? "sent" : "received",
        typetext = (checkout) ? "online purchase" : (local) ? "point of sale" : requesttype,
        typetext_translate = translate(typetext),
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
        requestdateformatted = fulldateformat(localtimeobject, glob_langcode),
        timeformat = "<span class='rq_month'>" + localtimeobject.toLocaleString(glob_langcode, {
            "month": "short"
        }) + "</span> <span class='rq_day'>" + localtimeobject.getDate() + "</span>",
        ptsformatted = fulldateformat(new Date(paymenttimestamp - glob_timezone), glob_langcode, true),
        amount_short_rounded = amountshort(amount, receivedamount, fiatvalue, iscrypto),
        amount_short_span = (insufficient === true) ? " (" + amount_short_rounded + " " + uoa_upper + " " + translate("amountshort") + ")" : "",
        amount_short_cc_span = (iscrypto === true) ? amount_short_span : "",
        created = (requestdate) ? requestdateformatted : "<strong>unknown</strong>",
        fiatvaluebox = (iscrypto === true || !fiatvalue) ? "" : "<li class='payday pd_fiat'><strong>" + translate("fiatvalueon") + "<span class='pd_fiat'> " + ptsformatted + "</span> :</strong><span class='fiatvalue'> " + fiatvalue_rounded + "</span> " + currencyname + "<div class='show_as amountshort'>" + amount_short_span + "</div></li>",
        paymentdetails = "<li class='payday pd_paydate'><strong>" + translate("paidon") + ":</strong><span class='paydate'> " + ptsformatted + "</span></li><li class='receivedamount'><strong>" + translate("amountreceived") + ":</strong><span> " + receivedamount_rounded + "</span> " + payment + "<div class='show_as amountshort'>" + amount_short_cc_span + "</div></li>" + fiatvaluebox,
        requestnamebox = (incoming === true) ? (rqdata) ? "<li><strong>" + translate("from") + ":</strong> " + requestname + "</li>" : "<li><strong>From: unknown</strong></li>" : "",
        requesttitlebox = (requesttitle) ? "<li><strong>" + translate("title") + ":</strong> '<span class='requesttitlebox'>" + requesttitle + "</span>'</li>" : "",
        ismonitoredspan = (ismonitored === false) ? " (unmonitored transaction)" : "",
        timestampbox = (incoming === true) ? "<li><strong>" + translate("created") + ":</strong> " + created + "</li><li><strong>" + translate("firstviewed") + ":</strong> " + fulldateformat(new Date(utc), glob_langcode) + "</li>" :
        (outgoing === true) ? "<li><strong>" + translate("sendon") + ":</strong> " + requestdateformatted + "</li>" :
        (local === true) ? "<li><strong>" + translate("created") + ":</strong> " + requestdateformatted + "</li>" : "",
        paymenturl = "&address=" + address + rqdataparam + rqmetaparam + "&requestid=" + requestid,
        islabel = $("main #" + payment + " li[data-address='" + address + "']").data("label"),
        requestlabel = (islabel) ? " <span class='requestlabel'>(" + islabel + ")</span>" : "",
        conf_box = (ismonitored === false) ? "<div class='txli_conf' data-conf='0'><span>Unmonitored transaction</span></div>" :
        (conf > 0) ? "<div class='txli_conf'><div class='confbar'></div><span>" + conf + " / " + set_confirmations + " " + translate("confirmations") + "</span></div>" :
        (conf === 0) ? "<div class='txli_conf' data-conf='0'><div class='confbar'></div><span>Unconfirmed transaction<span></div>" : "",
        view_tx_markup = (lnhash) ? "<li><strong class='show_tx'><span class='icon-power'></span><span class='ref'>" + translate("viewinvoice") + "</span></strong></li>" : (txhash) ? "<li><strong class='show_tx'><span class='icon-eye'></span>" + translate("viewon") + " blockchain</strong></li>" : "",
        statustext = (ismonitored === false) ? "" : (status == "new") ? "Waiting for payment" : status,
        src_html = (source) ? "<span class='src_txt'>" + translate("source") + ": " + source + "</span><span class='icon-wifi-off'></span><span class='icon-connection'></span>" : "",
        iscryptoclass = (iscrypto === true) ? "" : " isfiat",
        archivebutton = (showarchive === true || isexpired === true) ? "<div class='icon-folder-open' title='archive request'></div>" : "",
        render_archive = (txhistory && (pending == "no" || archive === true)),
        tl_text = (render_archive === true) ? translate("transactions") : "",
        edit_request = (local === true) ? "<div class='editrequest icon-pencil' title='edit request' data-requestid='" + requestid + "'></div>" : "",
        pid_li = (payment_id) ? "<li><strong>" + translate("paymentid") + ":</strong> <span class='select' data-type='payment ID'>" + payment_id + "</span></li>" : "",
        ia_li = (xmr_ia) ? "<li><p class='address'><strong>" + translate("integratedaddress") + ":</strong> <span class='requestaddress select'>" + xmr_ia + "</span></p></li>" : "",
        ln_emoji = (lnhash) ? " <span class='icon-power'></span>" : "",
        ln_logo = "<img src='img_logos_btc-lnd.png' class='cmc_icon'><img src='img_logos_btc-lnd.png' class='cmc_icon'>",
        cclogo = getcc_icon(cmcid, cpid, erc20) + getcc_icon(cmcid, cpid, erc20),
        cc_logo = (lightning) ? (txhash && !lnhash) ? cclogo : ln_logo : cclogo,
        rc_address_title = (hybrid) ? translate("fallbackaddress") : translate("receivingaddress"),
        address_markup = (lightning && (lnhash || hybrid === false)) ? "" : "<li><p class='address'><strong>" + rc_address_title + ":</strong> <span class='requestaddress select'>" + address + "</span>" + requestlabel + "</p></li>",
        network = getnetwork(source),
        source_markup = (network) ? "<li><p><strong>" + translate("network") + ":</strong> " + network + "</p></li>" : "",
        tlstat = (direction == "sent") ? translate("paymentsent") : translate("paymentreceived");
    new_requestli = $("<li class='rqli " + requesttypeclass + expiredclass + lnclass + "' id='" + requestid + "' data-cmcid='" + cmcid + "' data-status='" + status + "' data-address='" + address + "' data-pending='" + pending + "' data-iscrypto='" + iscrypto + "'>\
            <div class='liwrap iconright'>" + cc_logo +
        "<div class='atext'>\
                    <h2>" + requesttitlestring + "</h2>\
                    <p class='rq_subject'>" + typeicon + requestnamestring + "</p>\
                </div>\
                <p class='rq_date' title='" + requestdateformatted + "'>" + timeformat + "</p><br/>\
                <div class='pmetastatus' data-count='0'>+ 0</div>\
                <div data-rel='" + paymenturl + "' class='payrequest button" + iscryptoclass + "'>\
                    <span class='icon-qrcode'>" + translate("pay") + "</span>\
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
                    <li class='cnamemeta'><strong>" + translate("currency") + ":</strong> " + payment + ln_emoji + "</li>" +
        requestnamebox +
        requesttitlebox +
        "<li><strong>" + translate("amount") + ":</strong> " + amount_rounded + " " + uoa_upper + "</li>\
                    <li class='meta_status' data-conf='" + conf + "'><strong>" + translate("status") + ":</strong><span class='status'> " + translate(statustext) + "</span> " + conf_box + "</li>\
                    <li><strong>" + translate("type") + ":</strong> " + typetext_translate + ismonitoredspan + "</li>" +
        timestampbox +
        paymentdetails +
        address_markup +
        source_markup +
        pid_li +
        ia_li +
        "<li class='receipt'><p><span class='icon-file-pdf' title='View receipt'/>" + translate("receipt") + "</p></li>" + view_tx_markup +
        "</ul>\
                <ul class='transactionlist'>\
                    <h2>" + tl_text + "</h2>\
                </ul>\
                <div class='api_source'>" + src_html + "</div>\
            </div>\
            <div class='brstatuspanel flex'>\
                <img src='" + c_icons("confirmed") + "'>\
                <h2>" + tlstat + "</h2>\
            </div>\
            <div class='brmarker'></div>\
            <div class='expired_panel'><h2>" + translate("expired") + "</h2></div>\
        </li>");
    new_requestli.data(rd).prependTo(requestlist);
    if (render_archive === true) {
        const transactionlist = requestlist.find("#" + requestid).find(".transactionlist");
        $.each(txhistory, function(dat, val) {
            const txh = val.txhash,
                lnh = (txh && txh.slice(0, 9) == "lightning") ? true : false,
                tx_listitem = append_tx_li(val, false, lnh);
            if (tx_listitem.length > 0) {
                transactionlist.append(tx_listitem.data(val));
            }
        });
    }
}

function getnetwork(source) {
    return (source == "binplorer") ? "BNB smart chain" :
        (source == glob_main_arbitrum_node || source == "arbiscan") ? "Arbitrum" : false;
}

// ** Store data in localstorage **

//update used cryptocurrencies
function savecurrencies(add) {
    const currenciespush = [];
    $("#usedcurrencies li").each(function(i) {
        currenciespush.push($(this).data());
    });
    br_set_local("currencies", currenciespush, true);
    updatechanges(translate("currencies"), add);
}

//update addresses in localstorage
function saveaddresses(currency, add) {
    const pobox = get_addresslist(currency),
        addresses = pobox.find("li");
    if (addresses.length) {
        const addressboxpush = [];
        addresses.each(function(i) {
            addressboxpush.push($(this).data());
        });
        br_set_local("cc_" + currency, addressboxpush, true)
    } else {
        br_remove_local("cc_" + currency);
        br_remove_local(currency + "_settings");
    }
    updatechanges(translate("addresses"), add);
}

//update requests
function saverequests() {
    const requestpush = [];
    $("ul#requestlist > li").each(function() {
        requestpush.push($(this).data());
    });
    br_set_local("requests", requestpush, true);
    updatechanges(translate("requests"), true);
}

//update archive
function savearchive() {
    const requestpush = [];
    $("ul#archivelist > li").each(function() {
        requestpush.push($(this).data());
    });
    br_set_local("archive", requestpush, true);
}

//update settings
function savesettings(nit) {
    const settingsspush = [];
    $("ul#appsettings > li.render").each(function() {
        settingsspush.push($(this).data());
    });;
    br_set_local("settings", settingsspush, true);
    updatechanges(translate("settings"), true, nit);
}

function save_cc_settings(currency, add) {
    const settingbox = {};
    $("#" + currency + "_settings ul.cc_settinglist > li").each(function() {
        const thisnode = $(this);
        settingbox[thisnode.attr("data-id")] = thisnode.data();
    });
    br_set_local(currency + "_settings", settingbox, true);
    updatechanges(translate("coinsettings"), add);
}

function updatechanges(key, add, nit) {
    const p = GD_pass();
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
        const cc = glob_changes[key],
            cc_correct = (cc) ? cc : 0;
        glob_changes[key] = cc_correct + 1;
        savechangesstats();
        if (nit == "noalert") {
            return
        }
        change_alert();
    }
}

function resetchanges() {
    glob_changes = {};
    savechangesstats();
    glob_body.removeClass("haschanges");
    $("#alert > span").text("0").attr("title", translate("nochanges"));
}

function savechangesstats() {
    br_set_local("changes", glob_changes, true);
}

// render changes
function renderchanges() {
    const changescache = br_get_local("changes", true);
    if (changescache) {
        glob_changes = changescache;
        return
    }
    glob_changes = {};
}

function change_alert() {
    if (glob_is_ios_app === true) {
        return
    }
    const total_changes = get_total_changes();
    if (total_changes > 0) {
        $("#alert > span").text(total_changes).attr("title", translate("totalchanges", {
            "total_changes": total_changes
        }));
        setTimeout(function() {
            glob_body.addClass("haschanges");
        }, 2500);
        if (total_changes == 20 || total_changes == 50 || total_changes == 150 || total_changes == 200 || total_changes == 250) {
            canceldialog();
            const timeout = setTimeout(function() {
                backupdatabase();
            }, 3000, function() {
                clearTimeout(timeout);
            });
        }
    }
}

function get_total_changes() {
    let totalchanges = 0;
    $.each(glob_changes, function(key, value) {
        const thisval = (value) ? value : 0;
        totalchanges += parseInt(thisval);
    });
    return totalchanges;
}

// HTML rendering

function render_html(dat) {
    let result = "";
    $.each(dat, function(i, value) {
        $.each(value, function(key, val) {
            const id = (val.id) ? " id='" + val.id + "'" : "",
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
    const validated_class = (ddat.validated) ? " validated" : "",
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
        const this_href = $(this),
            target = this_href.attr("target"),
            url = this_href.attr("href");
        loader(true);
        loadertext(translate("loadurl", {
            "url": url
        }));
        if (glob_is_ios_app === true) {
            cancelpaymentdialog();
        }
        setTimeout(function() {
            closeloader();
            if (target == "_blank") {
                window.open(url);
            } else {
                glob_w_loc.href = url;
            }
        }, 500);
    })
}

function get_blockcypher_apikey() {
    const savedkey = $("#apikeys").data("blockcypher");
    return (savedkey) ? savedkey : to.bc_id;
}

function get_infura_apikey(rpcurl) {
    const savedkey = $("#apikeys").data("infura");
    return (/^[A-Za-z0-9]+$/.test(rpcurl.slice(rpcurl.length - 15))) ? "" : // check if rpcurl already contains apikey
        (savedkey) ? savedkey : to.if_id;
}

function get_arbiscan_apikey() {
    const savedkey = $("#apikeys").data("arbiscan");
    return (savedkey) ? savedkey : to.as_id;
}

function get_alchemy_apikey() {
    const savedkey = $("#apikeys").data("alchemy");
    return (savedkey) ? savedkey : to.al_id;
}

function proxy_alert(version) {
    if (version) {
        glob_body.addClass("haschanges");
        $("#alert > span").text("!").attr("title", translate("updateproxy", {
            "version": version,
            "proxy_version": glob_proxy_version
        }));
    }
}

function fetchsymbol(currencyname) {
    const ccsymbol = {};
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
    const headerheight = $(".showmain #header").outerHeight();
    if (livetop > headerheight) {
        $(".showmain").addClass("fixednav");
        return
    }
    $(".showmain").removeClass("fixednav");
}

function ishome(pagename) {
    const page = (pagename) ? pagename : geturlparameters().p;
    return (!page || page == "home");
}

function triggersubmit(trigger) {
    trigger.parent("#actions").prev("#dialogbody").find("input.submit").trigger("click");
}

function copytoclipboard(content, type) {
    const copy_api = navigator.clipboard;
    if (copy_api) {
        navigator.clipboard.writeText(content);
        notify(type + " " + translate("copied"), 2500, "no");
        return
    }
    glob_copycontent.val(content);
    copycontent[0].setSelectionRange(0, 999);
    try {
        const success = document.execCommand("copy");
        if (success) {
            notify(type + " " + translate("copied"), 2500, "no");
        } else {
            notify(translate("xcopy") + " " + type, 2500, "no");
        }
    } catch (err) {
        notify(translate("xcopy") + " " + type, 2500, "no");
    }
    glob_copycontent.val("").data({
        "type": false
    }).blur();
}

function loader(top) {
    const loader = $("#loader"),
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
    loadertext(translate("loading"));
}

function loadertext(text) {
    $("#loader #loadtext > span").text(text);
}

function settitle(title) {
    const page_title = title + " | " + glob_apptitle;
    glob_titlenode.text(page_title);
    glob_ogtitle.attr("content", page_title);
}

function all_pinpanel(cb, top, set) {
    const topclass = (top) ? " ontop" : "";
    if (haspin(set) === true) {
        const lastlock = br_get_local("locktime"),
            tsll = now() - lastlock,
            pass = (tsll < 10000);
        if (cb && pass) { // keep unlocked in 10 second time window
            cb.func(cb.args);
            return
        }
        const content = pinpanel(" pinwall", cb, set);
        showoptions(content, "pin" + topclass);
        return
    }
    const content = pinpanel("", cb);
    showoptions(content, "pin" + topclass);
}

function pinpanel(pinclass, pincb, set) {
    const makeclass = (pinclass === undefined) ? "" : pinclass,
        headertext = (haspin(set) === true) ? translate("pleaseenter") : translate("createpin");
    return $("<div id='pinfloat' class='enterpin" + makeclass + "'>\
        <p id='pintext'>" + headertext + "</p>\
        <p id='confirmpin'>" + translate("confirmyourpin") + "</p>\
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
                <div id='lock_time'><span class='icomoon'></span> " + translate("locktime") + "</div>\
                <div id='reset_pin'> " + translate("resetpin") + "</div>\
            </div>\
        </div>\
    </div>").data("pincb", pincb);
}

function switchpanel(switchmode, mode) {
    return "<div class='switchpanel " + switchmode + mode + "'><div class='switch'></div></div>"
}

function try_next_api(apilistitem, current_apiname) {
    const apilist = glob_br_config.apilists[apilistitem],
        next_scan = apilist[$.inArray(current_apiname, apilist) + 1],
        next_api = (next_scan) ? next_scan : apilist[0];
    if (glob_api_attempt[apilistitem][next_api] === true) {
        return false;
    }
    return next_api;
}

function wake() {
    if (glob_wl) {
        const requestwakelock = async () => {
            try {
                glob_wakelock = await glob_wl.request("screen");
                glob_wakelock.addEventListener("release", (e) => {
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
    if (glob_wl) {
        if (glob_wakelock) {
            glob_wakelock.release();
        }
        glob_wakelock = null;
    }
}

function vu_block() {
    notify(translate("cashiernotallowed"));
    playsound(glob_funk);
}

// Recent requests

function check_rr() {
    const ls_recentrequests = br_get_local("recent_requests", true);
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
        glob_html.addClass("show_rr");
        const hist_bttn = $("#request_history");
        hist_bttn.addClass("load");
        setTimeout(function() {
            hist_bttn.removeClass("load");
        }, 500);
        return
    }
    glob_html.removeClass("show_rr");
}

// ** Get_app **

function detectapp() {
    if (glob_inframe === true || glob_is_android_app === true || glob_is_ios_app === true) {
        return
    }
    if (glob_android_standalone === true || glob_ios_standalone === true) {
        return
    }
    const local_appstore_dialog = br_get_local("appstore_dialog");
    if (local_appstore_dialog) {
        const localdelay = 300000,
            cachetime = now() - local_appstore_dialog;
        if (cachetime < localdelay) {
            return
        }
        if (glob_supportsTouch) {
            const device = getdevicetype();
            if (device == "Android") {
                if (/SamsungBrowser/.test(glob_userAgent)) {
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
    const app_panel = $("#app_panel");
    app_panel.html("");
    const android = (type == "android"),
        button = (android === true) ? fetch_aws("img_button-playstore.png") : fetch_aws("img_button-appstore.png"),
        url = (android === true) ? "https://play.google.com/store/apps/details?id=" + glob_androidpackagename + "&pcampaignid=fdl_long&url=" + glob_approot + encodeURIComponent(glob_w_loc.search) : "https://apps.apple.com/app/id1484815377?mt=8",
        panelcontent = "<h2>Download the app</h2>\
            <a href='" + url + "' class='exit store_bttn'><img src='" + button + "'></a><br/>\
            <div id='not_now'>Not now</div>";
    app_panel.html(panelcontent);
    setTimeout(function() {
        glob_body.addClass("getapp");
    }, 1500);
    br_set_local("appstore_dialog", now());
}

function close_app_panel() {
    $(document).on("click", "#not_now", function() {
        glob_body.removeClass("getapp");
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
    const set_node = $("#" + setting);
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
    const addressli = get_addresslist(currency).children("li");
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
    const coinnode = $("#" + currency + "_settings .cc_settinglist li[data-id='" + id + "']");
    if (coinnode.length) {
        if (data) {
            const coindat = coinnode.data();
            if (coindat) {
                return coindat;
            }
        }
        return coinnode;
    }
    const coindata = getcoinsettings(currency);
    if (coindata) {
        const apis = coindata.apis;
        if (apis) {
            return apis;
        }
    }
    return false
}

function getcoindata(currency) {
    const coindata_object = getcoinconfig(currency);
    if (coindata_object) {
        const coindata = coindata_object.data,
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
    const currencyref = get_currencyli(currency); // check if erc20 token is added
    if (currencyref.length > 0) {
        return $.extend(currencyref.data(), glob_br_config.erc20_dat.data);
    } // else lookup erc20 data
    const tokenobject = br_get_local("erc20tokens", true);
    if (tokenobject) {
        const erc20data = $.grep(tokenobject, function(filter) {
            return filter.name == currency;
        })[0];
        if (erc20data) {
            const fetched_data = {
                "currency": erc20data.name,
                "ccsymbol": erc20data.symbol,
                "cmcid": erc20data.cmcid.toString(),
                "contract": erc20data.contract
            }
            return $.extend(fetched_data, glob_br_config.erc20_dat.data);
        }
    }
    return false;
}

function activecoinsettings(currency) {
    const saved_coinsettings = br_get_local(currency + "_settings", true);
    return (saved_coinsettings) ? saved_coinsettings : getcoinsettings(currency);
}

function getcoinsettings(currency) {
    const coindata = getcoinconfig(currency);
    if (coindata) {
        return coindata.settings;
    } // return erc20 settings
    return glob_br_config.erc20_dat.settings;
}

function getcoinconfig(currency) {
    return $.grep(glob_br_config.bitrequest_coin_data, function(filter) {
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
    const lgets = (gets) ? gets : geturlparameters();
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
    const page = lgets.p;
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
    const scheme_url = atob(scheme),
        proto = scheme_url.split(":")[0];
    if (proto == "eclair" || proto == "acinq" || proto == "lnbits") {
        const content = "<h2 class='icon-warning'>" + translate("proto", {
            "proto": proto
        }) + "</h2>";
        popdialog(content, "canceldialog");
        return
    }
    if (proto == "lndconnect" || proto == "c-lightning-rest") {
        const imp = (proto == "lndconnect") ? "lnd" : (proto == "c-lightning-rest") ? "c-lightning" : proto,
            scheme_obj = renderlnconnect(scheme_url);
        if (scheme_obj) {
            const resturl = scheme_obj.resturl,
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
            popnotify("error", translate("decodeqr"));
        }
        return
    }
    if (proto.length < 1) {
        const content = "<h2 class='icon-warning'>" + translate("invalidurlscheme") + "</h2>";
        popdialog(content, "canceldialog");
        return
    }
    if (proto && proto.length > 0) {
        const content = "<h2 class='icon-warning'>" + translate("usnotsupported") + "</h2>";
        popdialog(content, "canceldialog");
        return
    }
}

function expand_shoturl(i_param) {
    if (i_param.startsWith("4bR")) { // handle bitly shortlink
        expand_bitly(i_param);
        return
    }
    const getcache = br_get_session("longurl_" + i_param);
    if (getcache) { // check for cached values
        ios_redirections(getcache);
        return
    }
    if (i_param) {
        const p_index = i_param.slice(0, 1),
            shortid = i_param.slice(1),
            proxy = glob_proxy_list[p_index],
            is_url = (proxy.indexOf("https://") >= 0);
        if (is_url) {
            const payload = {
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
                const data = br_result(e).result;
                if (data) {
                    const status = data.status;
                    if (status) {
                        if (status == "file not found") {
                            const content = "<h2 class='icon-warning'>" + translate("shorturlnotfound") + "</h2>";
                            popdialog(content, "canceldialog");
                            closeloader();
                            return
                        }
                        if (status == "file exists") {
                            const longurl = data.sharedurl;
                            if (longurl) {
                                const to_localurl = makelocal(longurl);
                                ios_redirections(to_localurl);
                                br_set_session("longurl_" + i_param, to_localurl);
                                return
                            }
                        }
                    }
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                const content = "<h2 class='icon-warning'>" + translate("failedtofetchrequest") + "</h2>";
                popdialog(content, "canceldialog");
                closeloader();
                return
            });
        }
    }
}

function expand_bitly(i_param) {
    if (glob_hostlocation == "local") {
        return
    }
    const bitly_id = i_param.slice(3),
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
        const data = br_result(e).result;
        if (data.error) {
            glob_w_loc.href = "http://bit.ly/" + bitly_id;
            return
        }
        if (data) {
            const longurl = data.long_url;
            if (longurl) {
                ios_redirections(longurl);
                br_set_session("longurl_" + bitly_id, longurl);
                return
            }
            glob_w_loc.href = "http://bit.ly/" + bitly_id;
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        glob_w_loc.href = "http://bit.ly/" + bitly_id;
    });
}

function ln_connect(gets) {
    const lgets = (gets) ? gets : geturlparameters(),
        lnconnect = lgets.lnconnect,
        macaroon = lgets.macaroon,
        imp = lgets.imp;
    if (macaroon && imp) {
        const macval = b64urldecode(macaroon);
        if (macval) {
            const resturl = atob(lnconnect),
                set_vals = set_ln_fields(imp, resturl, macval);
            if (set_vals === true) {
                $("#adln_drawer").show();
                const cs_boxes = $("#lnd_credentials .lndcd"),
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
        notify(translate("invalidmacaroon"));
        return
    }
    notify(translate("invalidformat"));
}

function click_pop(fn) {
    const timeout = setTimeout(function() {
        $("#" + fn).trigger("click");
    }, 1200, function() {
        clearTimeout(timeout);
    });
}

// add serviceworker
function add_serviceworker() {
    if ("serviceWorker" in navigator) {
        if (!navigator.serviceWorker.controller) {
            navigator.serviceWorker.register(glob_approot + "serviceworker.js", {
                    "scope": "./"
                })
                .then(function(reg) {
                    // console.log("Service worker has been registered for scope: " + reg.scope);
                });
        }
    }
}