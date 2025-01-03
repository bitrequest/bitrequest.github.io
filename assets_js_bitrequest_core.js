//globals
const glob_ls_support = check_local(),
    glob_language = navigator.language || navigator.userLanguage,
    glob_userAgent = navigator.userAgent || navigator.vendor || window.opera,
    glob_lower_userAgent = glob_userAgent.toLowerCase(),
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
    glob_is_safari = (glob_lower_userAgent.indexOf("safari/") > -1 && glob_lower_userAgent.indexOf("android") == -1),
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
    glob_after_scan_timeout = 30000, // Preform extra tx lookup when closing paymentdialog after 30 seconds
    glob_xss_alert = "xss attempt detected",
    glob_langcode = setlangcode(), // set saved or system language
    glob_token_cache = 604800,
    video = $("#qr-video")[0],
    scanner = new QrScanner(video, result => setResult(result), error => {
        console.log(error);
    });

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
    glob_pinging = {},
    currencyscan = null,
    scantype = null;

if (glob_has_ndef && !glob_inframe) {
    glob_ndef = new NDEFReader();
}

// Initialize the application when the document is ready
$(document).ready(function() {
    $.ajaxSetup({
        "cache": false
    });
    buildsettings(); // build settings first

    if (glob_hostlocation !== "local") { // don't add service worker on desktop
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
        glob_html.addClass("inframe");
        const gets = geturlparameters();
        if (gets.payment) {
            glob_html.addClass("hide_app");
        }
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
            glob_phpsupport = phpsupport === "yes";
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

// Check for PHP support by fetching fiat currencies from local API PHP file
function checkphp() {
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
                    const this_error = data.error || "Unable to get API data";
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

// Fetch fiat currencies from fixer.io API
function setsymbols() {
    //set globals
    glob_local = (glob_hostlocation === "local" && glob_phpsupport === false),
        glob_localserver = (glob_hostlocation === "local" && glob_phpsupport === true);
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
            const this_error = data.error || "Unable to get API data";
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

// Get top 600 ERC20 tokens from CoinMarketCap
function geterc20tokens() {
    const in_cache = fetch_cached_erc20(true);
    if (in_cache) {
        setfunctions();
        return;
    }
    api_proxy({
        "api": "coinmarketcap",
        "search": "v1/cryptocurrency/listings/latest?cryptocurrency_type=tokens&limit=2000&aux=cmc_rank,platform",
        "cachetime": glob_token_cache,
        "cachefolder": "1w",
        "proxy": true,
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const data = br_result(e).result,
            status = data.status;
        if (status && status.error_code === 0) {
            const token_arr = data.data;
            if (token_arr) {
                // Split token_array in two and convert
                const middle = Math.floor(token_arr.length / 2),
                    first_half = token_arr.slice(0, middle),
                    second_half = token_arr.slice(middle);
                if (first_half && second_half) {
                    store_coindata(first_half, second_half);
                    return
                }
            }
        }
        const content = "<h2 class='icon-bin'>" + translate("apicallfailed") + "</h2><p class='doselect'>" + translate("nofetchtokeninfo") + "</p>";
        popdialog(content, "canceldialog");
    }).fail(function(jqXHR, textStatus, errorThrown) {
        const content = "<h2 class='icon-bin'>" + translate("apicallfailed") + "</h2><p class='doselect'>" + translate("nofetchtokeninfo") + "</p>";
        popdialog(content, "canceldialog");
    }).always(function() {
        setfunctions();
    });
}

// Store coin data in local storage
function store_coindata(first_half, second_half) {
    if (first_half) {
        const c_arr1 = convert_coinlist(first_half);
        if (c_arr1) {
            cr_push = {
                "timestamp": now(),
                "token_arr": c_arr1
            }
            br_set_local("erc20tokens_init", cr_push, true);
        }
    }
    if (second_half) {
        const c_arr2 = convert_coinlist(second_half);
        if (c_arr2) {
            br_set_local("erc20tokens", c_arr2, true);
        }
    }
}

function convert_coinlist(og_list) {
    try {
        return og_list.filter(value => value.platform && value.platform.id === 1027).map(value => ({
            "name": value.slug,
            "symbol": value.symbol.toLowerCase(),
            "cmcid": value.id,
            "contract": value.platform.token_address
        }));
    } catch (e) {
        console.error(e.name, e.message);
        return false;
    }
}

// Check if PIN is set and valid
function haspin(set) {
    const pinsettings = $("#pinsettings").data(),
        pinhash = pinsettings.pinhash;
    if (pinhash) {
        const pinstring = pinhash.toString(),
            plength = pinstring.length > 3;
        if (plength) {
            if (set) {
                return true;
            }
            return pinsettings.locktime !== "never";
        }
    }
    return false;
}

// Check if the application is locked
function islocked() {
    const gets = geturlparameters(),
        locktime = $("#pinsettings").data("locktime"),
        lastlock = br_get_local("locktime"),
        tsll = now() - lastlock,
        pflt = parseFloat(locktime);
    return gets.payment ? false : (haspin() === true && tsll > pflt);
}

// Set up various functions for the application
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

// Set up remaining functions for the application
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
    //after_scan_init
    //after_scan
    //cancel_after_scan
    //set_recent_requests
    check_recent();
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
    //hide_paymentdialog
    //reset_paymentdialog
    //forceclosesocket
    //closesocket
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
    //generatePinpadHTML
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
    gk();
    glob_html.addClass("loaded");
    //is_opendialog
    //is_openrequest

    check_params();
    //check_intents;
    //expand_shoturl
    //expand_bitly
    //ln_connect

    // ** Qr scanner **

    init_scan();
    //detect_cam
    //start_scan
    //abort_cam
    cam_trigger();
    close_cam_trigger();
    //show_cam
    //close_cam(
    //setResult
    //handleLnconnect
    //handleAddress
    //handleViewkey

    //add_serviceworker
}

//checks

// Sets the language attributes for the HTML document and meta tags
function setlocales() {
    glob_html.attr("lang", glob_langcode);
    $("meta[property='og:locale']").attr("content", glob_langcode);
    $("meta[property='og:url']").attr("content", glob_w_loc.href);
}

// Sets the data-role attribute on the HTML element based on selected permissions
function setpermissions() {
    const permission = $("#permissions").data("selected");
    glob_html.attr("data-role", permission);
}

// Checks if the current user has view-only (cashier) permissions
function is_viewonly() {
    const permission = $("#permissions").data("selected");
    return permission === "cashier";
}

// ** Pincode ** //

// Handles keypress events for PIN entry
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

// Selects the appropriate PIN press function based on the current mode
function pinpressselect(node) {
    if ($("#pinfloat").hasClass("enterpin")) {
        pinpress(node);
        return
    }
    pinvalidate(node)
}

// Sets up click event listener for PIN pad buttons
function pinpresstrigger() {
    $(document).on("click", "#optionspop .enterpin .pinpad .pincell", function() {
        pinpress($(this));
    });
}

// Handles PIN button press events
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

// Processes the entered PIN and performs corresponding actions
function enterapp(pinval) {
    const pinfloat = $("#pinfloat"),
        pinsettings = $("#pinsettings").data(),
        savedpin = pinsettings.pinhash,
        attempts = pinsettings.attempts,
        hashpin = hashcode(pinval),
        _now = now(),
        isGlobal = pinfloat.hasClass("global");
    if (hashpin == savedpin) {
        if (isGlobal) {
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
        savesettings(isGlobal);
        remove_cashier();
    } else {
        if (!navigator.vibrate) {
            playsound(glob_funk);
        }
        shake(pinfloat);
        setTimeout(function() {
            $("#pininput").val("");
        }, 10);
        if (attempts > 2) {
            const timeoutDurations = [{
                    "threshold": 3,
                    "duration": 300000
                }, // 5 minutes
                {
                    "threshold": 6,
                    "duration": 1800000
                }, // 30 minutes
                {
                    "threshold": 9,
                    "duration": 86400000
                } // 24 hours
            ];

            const timeoutSetting = timeoutDurations.find(setting => attempts === setting.threshold);
            if (timeoutSetting) {
                const timeout = _now + timeoutSetting.duration;
                pinsettings.timeout = timeout;
                lockscreen(timeout);
            } else if (attempts > 9) {
                attempts = 1;
            }
        }
        pinsettings.attempts = attempts + 1;
        savesettings(isGlobal);
    }
}

// Clears the PIN lock by resetting timeout and attempts
function clearpinlock() {
    const pinsettings = $("#pinsettings").data();
    pinsettings.timeout = null;
    pinsettings.attempts = 0;
    savesettings();
}

// Sets up event listener for PIN reset button
function pin_admin_reset() {
    $(document).on("click", "#reset_pin", function() {
        $("#pinfloat").removeClass("p_admin");
    });
}

// Sets up click event listener for PIN validation buttons
function pinvalidatetrigger() {
    $(document).on("click", "#optionspop .validatepin .pinpad .pincell", function() {
        pinvalidate($(this))
    });
}

// Handles PIN validation process
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

// Sets up event listener for PIN backspace in enter mode
function pinbacktrigger() {
    $(document).on("click", "#optionspop #pinfloat.enterpin #pinback", function() {
        pinback($("#pininput"));
    });
}

// Sets up event listener for PIN backspace in validate mode
function pinbackvalidatetrigger() {
    $(document).on("click", "#optionspop #pinfloat.validatepin #pinback", function() {
        pinback($("#validatepin"));
    });
}

// Handles PIN backspace functionality
function pinback(pininput) {
    const pinval = pininput.val(),
        prevval = pinval.slice(0, -1);
    pininput.val(prevval);
}

// ** IOS Redirects **
// (Can only be envoked from the IOS app) 
// Initializes iOS-specific functionality
function ios_init() {
    glob_is_ios_app = true;
    glob_body.addClass("ios"); // ios app fingerprint
}

// Handles iOS-specific page redirections
function ios_redirections(url) {
    if (!url) return;
    const search = get_search(url),
        gets = renderparameters(search);
    if (gets.xss) return;
    const currenturl = glob_w_loc.href.toUpperCase(),
        newpage = url.toUpperCase();
    if (currenturl === newpage) return;
    if (br_get_local("editurl") === glob_w_loc.search) return;
    const isrequest = newpage.includes("PAYMENT=");
    if (isrequest) {
        if (isopenrequest()) {
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
    } else if (gets.data) {
        glob_w_loc.href = url;
    } else {
        const pagename = gets.p || "prompt";
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

// ** Intropage **

// Sets up event listener for starting the intro process
function starttrigger() {
    $(document).on("click touchend", "#intro .panelwrap, #intro .proceeed", function() {
        startnext($("#intro"));
    });
}

// Sets up event listener for progressing to the next step in the intro process
function startnexttrigger() {
    $(document).on("click touchend", "#entername .panelwrap", function(e) {
        if (e.target === this) {
            startnext($("#entername"));
        }
    });
}

// Handles progression to the next step in the intro process
function startnext(thisnode) {
    const thisnext = thisnode.attr("data-next");
    if (!thisnext) return;
    if (thisnode.hasClass("validstep")) {
        $("#startpage").attr("class", "sp_" + thisnext);
        thisnode.removeClass("panelactive").next(".startpanel").addClass("panelactive");
        $("#eninput").blur();
        return
    }
    topnotify(translate("enteryourname"));
}

// Handles going back to the previous step in the intro process
function startprev(thisnode) {
    const thisprev = thisnode.attr("data-prev");
    if (!thisprev) return;
    $("#startpage").attr("class", "sp_" + thisprev);
    thisnode.removeClass("panelactive").prev(".startpanel").addClass("panelactive");
    $("#eninput").blur();
}

// Handles keydown events for character limit on input field
function lettercountkeydown() {
    $(document).on("keydown", "#eninput", function(e) {
        const keycode = e.which || e.keyCode,
            thisinput = $(this),
            thisvallength = thisinput.val().length,
            lettersleft = parseInt(thisinput.attr("data-max"), 10) - thisvallength;
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

// Handles input events for character count and validation
function lettercountinput() {
    $(document).on("input", "#eninput", function() {
        const thisinput = $(this),
            mininput = parseInt(thisinput.attr("data-min"), 10),
            thispanel = $("#entername"),
            thisvallength = thisinput.val().length,
            lettersleft = parseInt(thisinput.attr("data-max"), 10) - thisvallength,
            lettercount = $("#lettercount");
        lettercount.text(lettersleft);
        thispanel.toggleClass("validstep", thisvallength >= mininput);
        lettercount.toggleClass("activlc", thisvallength > 0);
    });
}

// Handles currency selection from a list
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

// Toggles navigation based on header click
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

// Loads the appropriate page based on URL parameters
function loadurl() {
    const gets = geturlparameters();
    if (gets.xss) {
        loadpageevent("home");
        return
    }
    const page = gets.p,
        payment = gets.payment,
        url = glob_w_loc.search,
        event = payment ? "both" : "loadpage";
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

// Handles clicks on link elements
function clicklink() {
    $(document).on("click", ".self", function(e) {
        e.preventDefault();
        loadpage($(this).attr("data-rel"));
        return
    })
}

// Loads a page and updates the URL
function loadpage(href) {
    const pagename = href.split("&")[0].split("=").pop();
    openpage(href, pagename, "loadpage");
}

// Opens a page, updates history, and loads the appropriate function
function openpage(href, pagename, event) {
    history.pushState({
        "pagename": pagename,
        "event": event
    }, "", href);
    loadfunction(pagename, event);
}

// Handles browser's back/forward navigation
function popstate() {
    // CHANGE: Use addEventListener instead of onpopstate
    window.addEventListener("popstate", function(e) {
        const statemeta = e.state;
        if (statemeta && statemeta.pagename) {
            loadfunction(statemeta.pagename, statemeta.event);
            return;
        }
        cancel_url_dialogs();
    });
}

// Loads the appropriate function based on the page and event
function loadfunction(pagename, thisevent) {
    if (thisevent === "payment") { //load paymentpopup if payment is set
        loadpaymentfunction();
        return
    }
    if (thisevent === "both") { //load paymentpopup if payment is set and load page
        loadpageevent(pagename);
        setTimeout(function() {
            loadpaymentfunction("delay");
        }, 1000);
        return
    }
    loadpageevent(pagename);
    const page_tl = translate(pagename),
        page_title = page_tl || pagename;
    settitle(page_title);
    cancel_url_dialogs();
}

// Cancels any active dialogs related to URL changes
function cancel_url_dialogs() {
    if (isopenrequest()) {
        cancelpaymentdialog();
    }
    if (glob_body.hasClass("showcam")) {
        $("#closecam").trigger("click");
    }
}

// Loads a page event, updates UI elements
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
    if (requestfilter && pagename === "requests") {
        $("#requestlist > li").not(get_requestli("address", requestfilter)).hide();
    } else {
        $("#requestlist > li").show();
    }
}

// Shows or hides navigation based on the current page
function shownav(pagename) {
    if (ishome(pagename) === true) {
        glob_html.removeClass("showmain").addClass("hidemain");
        $("#relnav .nav").slideUp(300);
        return
    }
    glob_html.addClass("showmain").removeClass("hidemain")
    $("#relnav .nav").slideDown(300);
}

// Handles active menu item selection
function activemenu() {
    $(document).on("click", ".nav li .self", function() {
        const thisitem = $(this);
        $(".nav li .self").removeClass("activemenu");
        thisitem.addClass("activemenu");
    })
}

// Handles fixed navigation on scroll
function fixednav() {
    $(document).scroll(function() {
        if (glob_html.hasClass("paymode")) {
            return
        }
        fixedcheck($(document).scrollTop());
    });
}

// ** Triggerrequest **

// Handles triggering of transactions
function triggertx() {
    $(document).on("click", ".currencylist li > .rq_icon", function() {
        triggertxfunction($(this));
        canceloptions();
    });
}

// Processes transaction triggering
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

// Handles confirmation of missing seed
function confirm_missing_seed() {
    $(document).on("click", "#addresswarning .submit", function(e) {
        e.preventDefault();
        const thisdialog = $("#addresswarning"),
            d_dat = thisdialog.data(),
            pk_checkbox = thisdialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked"),
            ds_checkbox = thisdialog.find("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (pk_checked !== true) {
            popnotify("error", translate("confirmpkownership"));
            return false
        }
        if (ds_checked === true) { // whitlist seed id
            add_address_whitelist(d_dat.address);
        }
        canceldialog();
        finishtxfunction(d_dat.currency, d_dat.address, d_dat.url, d_dat.title);
    })
}

// Generates HTML for address warning dialog
function get_address_warning(id, address, pass_dat) {
    const seedstr = pass_dat.xpubid ? "Xpub" : "Seed",
        rest_str = (seedstr === "Seed") ? (glob_hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + pass_dat.seedid + "'>" + translate("resoresecretphrase") + "</div>" : "",
        seedstrtitle = (seedstr === "Seed") ? translate("bip39_passphrase") : seedstr;
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

// Completes the transaction function
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
        currentpage_correct = currentpage ? "?p=" + currentpage + "&payment=" : "?payment=",
        prefix = currentpage_correct + currency + "&uoa=",
        newlink = prefix + currencysymbol + "&amount=0" + "&address=" + thisaddress,
        href = (!savedurl || glob_offline !== false) ? newlink : savedurl, //load saved url if exists
        thistitle = title || "bitrequest";
    br_set_local("editurl", href); // to check if request is being edited
    remove_flip(); // reset request card facing front
    openpage(href, thistitle, "payment");
}

// Clears saved URLs from currency list items
function clear_savedurl() {
    $("#currencylist li > .rq_icon").removeData("url");
}

// Handles payment request actions
function payrequest() {
    $(document).on("click", "#requestlist .req_actions .icon-qrcode, #requestlist .payrequest", function(e) {
        e.preventDefault();
        if (is_scanning()) return
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

// Toggles currency visibility
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
                if (addresscount === 0) {
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

// Toggles address visibility and handles address validation
function toggleaddress() {
    $(document).on("click", ".toggleaddress", function() {
        const parentlistitem = $(this).closest("li"),
            checked = parentlistitem.data("checked"),
            parentlist = parentlistitem.closest("ul.pobox"),
            addresscount = parentlist.find("li[data-checked='true']").length,
            currency = parentlist.attr("data-currency");
        if (checked === true || checked === "true") {
            parentlistitem.attr("data-checked", "false").data("checked", false);
        } else {
            const a_dat = parentlistitem.data();
            if (parentlistitem.hasClass("seedu")) {
                const address = a_dat.address,
                    seedid = a_dat.seedid;
                if (addr_whitelist(address) !== true) {
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
                if (addr_whitelist(address) !== true) {
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

// Handles confirmation of missing seed for address toggling
function confirm_missing_seed_toggle() {
    $(document).on("click", "#addresswarningcheck .submit", function(e) {
        e.preventDefault();
        const thisdialog = $("#addresswarningcheck"),
            d_dat = thisdialog.data(),
            pk_checkbox = thisdialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked"),
            ds_checkbox = thisdialog.find("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (pk_checked !== true) {
            popnotify("error", translate("confirmpkownership"));
            return
        }
        if (ds_checked === true) { // whitlist seed id
            add_address_whitelist(d_dat.address);
        }
        canceldialog();
        cmst_callback(d_dat.pli);
        return
    })
}

// Callback function for confirming missing seed toggle
function cmst_callback(parentlistitem) {
    const parentlist = parentlistitem.closest("ul.pobox"),
        currency = parentlist.attr("data-currency");
    parentlistitem.attr("data-checked", "true").data("checked", true);
    check_currency(currency);
    saveaddresses(currency, false);
    clear_savedurl();
}

// Adds a seed to the whitelist
function add_seed_whitelist(seedid) {
    const stored_whitelist = br_get_local("swl", true),
        seed_whitelist = br_dobj(stored_whitelist);
    if (!seed_whitelist.includes(seedid)) {
        seed_whitelist.push(seedid);
    }
    br_set_local("swl", seed_whitelist, true);
}

// Checks if a seed is in the whitelist
function seed_wl(seedid) {
    const stored_whitelist = br_get_local("swl", true),
        seed_whitelist = br_dobj(stored_whitelist);
    return seed_whitelist.includes(seedid);
}

// Adds an address to the whitelist
function add_address_whitelist(address) {
    const stored_whitelist = br_get_local("awl", true),
        address_whitelist = br_dobj(stored_whitelist);
    if (!address_whitelist.includes(address)) {
        address_whitelist.push(address);
    }
    br_set_local("awl", address_whitelist, true);
}

// Checks if an address is in the whitelist
function addr_whitelist(address) {
    const stored_whitelist = br_get_local("awl", true),
        address_whitelist = br_dobj(stored_whitelist);
    return address_whitelist.includes(address);
}

// Handles checkbox toggling in popup
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

// Checks and updates currency status based on address count
function check_currency(currency) {
    const addresscount = filter_addressli(currency, "checked", true).length;
    if (addresscount > 0) {
        currency_check(currency);
        return
    }
    currency_uncheck(currency);
}

// Marks a currency as checked and updates UI
function currency_check(currency) {
    const currencylistitem = get_homeli(currency),
        parentcheckbox = get_currencyli(currency);
    currencylistitem.removeClass("hide");
    parentcheckbox.attr("data-checked", "true").data("checked", true);
    savecurrencies(false);
}

// Marks a currency as unchecked and updates UI
function currency_uncheck(currency) {
    const currencylistitem = get_homeli(currency),
        parentcheckbox = get_currencyli(currency);
    currencylistitem.addClass("hide");
    parentcheckbox.attr("data-checked", "false").data("checked", false);
    savecurrencies(false);
}

// Handles toggling of global switches
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

// Shows select options
function showselect() {
    $(document).on("click", ".selectarrows", function() {
        const all_options = $(".options"),
            options = $(this).next(".options");
        if (options.hasClass("single")) {
            const option_length = options.children("*").length;
            if (option_length < 2) {
                return
            }
        }
        if (options.hasClass("showoptions")) {
            all_options.removeClass("showoptions");
        } else {
            all_options.not(options).removeClass("showoptions");
            options.addClass("showoptions");
        }
    });
}

// Handles selectbox input click
function selectbox() {
    $(document).on("click", ".selectbox > input:not([readonly])", function() {
        const thisselect = $(this),
            thisvalue = thisselect.val(),
            options = thisselect.parent(".selectbox").find(".options span");
        if (options.hasClass("show")) {
            options.removeClass("show");
        } else {
            options.filter(function() {
                return $(this).text() !== thisvalue;
            }).addClass("show");
        }
    })
}

// Handles selection from selectbox options
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

// Closes all open selectboxes in popup
function closeselectbox() {
    $("#popup .selectbox .options").removeClass("showoptions");
}

// Handles radio button selection
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
            thisinput = $(".formbox input:first").val(thisvalue);
    })
}

// Handles dialog drawer toggling
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

// Reorder addresses
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

// Handle dragging of addresses
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
                dragup = i + 1 > thisindex;
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

// Handle end of address dragging
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

// Handle key presses
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

// Handle escape and back functionality
function escapeandback() {
    if (glob_inframe) {
        const gets = geturlparameters();
        if (gets.payment) {
            cpd_pollcheck();
            return
        }
        parent.postMessage("close_request", "*");
        return
    }
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
    if (isopenrequest()) {
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

// Close payment dialog
function close_paymentdialog(afterscan) {
    if (afterscan) {
        const api_data = q_obj(request, "coinsettings.apis.selected");
        if (api_data) {
            after_scan_init(api_data);
        }
        return
    }
    if (glob_inframe) {
        parent.postMessage("close_request_confirm", "*");
        return
    }
    cancelpaymentdialog();
    continue_cpd();
}

// Continue closing payment dialog
function continue_cpd() {
    if (glob_html.hasClass("firstload")) {
        const gets = geturlparameters(),
            pagename = gets.p,
            set_pagename = pagename || "home";
        openpage("?p=" + set_pagename, set_pagename, "loadpage");
        return
    }
    window.history.back();
}

// After scan initialization
function after_scan_init(api_data) {
    if (is_scanning()) return
    glob_api_attempts = {};
    glob_rpc_attempts = {};
    after_scan(api_data);
}

// Scan address one last time
function after_scan(api_data) {
    if (glob_inframe) {
        loader(true);
        loadertext(translate("lookuppayment", {
            "currency": request.payment,
            "blockexplorer": api_data.name
        }));
    }
    if (!glob_inframe) {
        hide_paymentdialog();
    }
    const rpc = api_data.api !== true,
        rq_init = request.rq_init,
        request_ts = rq_init + glob_timezone,
        set_confirmations = request.set_confirmations || 0,
        rdo = {
            "request_timestamp": request_ts,
            "setconfirmations": set_confirmations,
            "pending": "scanning",
            "erc20": request.erc20,
            "cachetime": 20,
            "source": "after_scan"
        };
    if (rpc) {
        get_rpc_inputs(request, api_data, rdo);
    } else {
        get_api_inputs(request, api_data, rdo);
    }
    socket_info(api_data, true);
}

// No results found for afterscan
function cancel_after_scan() {
    closeloader();
    if (glob_inframe) {
        parent.postMessage("close_request_confirm", "*");
        return
    }
    set_recent_requests();
    reset_paymentdialog();
    continue_cpd();
}

function set_recent_requests() {
    if (request) {
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
    }
}

// Handle recent payment check
function check_recent() {
    $(document).on("click", ".check_recent", function(e) {
        e.preventDefault();
        const thisnode = $(this),
            thisurl = thisnode.attr("href"),
            result = confirm(translate("openurl", {
                "url": thisurl
            }));
        if (result) {
            canceldialog();
            close_paymentdialog();
            open_share_url("location", thisurl);
        }
        return
    })
}

// Show request history
function request_history() {
    $(document).on("click", "#request_history", function() {
        const ls_recentrequests = br_get_local("recent_requests", true);
        if (ls_recentrequests) {
            recent_requests(ls_recentrequests);
        }
    })
}

// Display recent requests
function recent_requests(recent_payments) {
    const addresslist = recent_requests_list(recent_payments);
    if (addresslist.length) {
        const content = "<div class='formbox'><h2 class='icon-history'>" + translate("recentrequests") + ":</h2><div id='ad_info_wrap'><ul>" + addresslist + "</ul></div></div>";
        popdialog(content, "canceldialog");
    }
}

// Generate list of recent requests
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
                layer = val.eth_layer2,
                blockchainurl = blockexplorer_url(currency, false, erc20, source, layer) + address;
            addresslist += "<li class='rp_li'>" + getcc_icon(cmcid, ccsymbol + "-" + currency, erc20) + "<strong style='opacity:0.5'>" + short_date(rq_time + glob_timezone) + "</strong><br/>\
            <a href='" + blockchainurl + "' target='_blank' class='ref check_recent'>\
            <span class='select'>" + address + "</span> <span class='icon-new-tab'></a></li>";
        }
    });
    return addresslist;
}

// Display notification
function notify(message, settime = 4000, setbutton = "no") {
    const notify = $("#notify");
    $("#notifysign").html(message + "<span class='icon-cross'></div>").attr("class", "button" + setbutton);
    notify.addClass("popupn");
    const timeout = setTimeout(function() {
        closenotify();
    }, settime, function() {
        clearTimeout(timeout);
    });
}

// Attaches a click event listener to close the notification
function closenotifytrigger() {
    $(document).on("click", "#notify .icon-cross", function() {
        closenotify()
    });
}

// Removes the "popupn" class from the notification element
function closenotify() {
    $("#notify").removeClass("popupn");
}

// Displays a top notification with a message and auto-hides it after 7 seconds
function topnotify(message) {
    const topnotify = $("#topnotify");
    topnotify.text(message).addClass("slidedown");
    const timeout = setTimeout(function() {
        topnotify.removeClass("slidedown");
    }, 7000, function() {
        clearTimeout(timeout);
    });
}

// Displays a notification in dialogs with different styles based on the result type
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

// Creates and displays a popup dialog with custom content and functionality
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
    const thistrigger = trigger || $("#popup #execute");
    if (functionname) {
        execute(thistrigger, functionname);
    }
    if (!glob_supportsTouch) {
        $("#dialogbody input:first").focus();
    }
}

// Attaches a click event to execute a specified function
function execute(trigger, functionname) {
    $(document).on("click", "#execute", function(e) {
        e.preventDefault();
        window[functionname](trigger);
    })
}

// Attaches a click event to add a currency
function addcurrencytrigger() {
    $(document).on("click", ".addcurrency", function() {
        addcurrency($(this).closest("li").data());
    })
}

// Adds a currency to the user's portfolio or derives an address if possible
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

// Checks if a currency can be derived and performs the derivation if possible
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

// Attaches a click event to add an address
function addaddresstrigger() {
    $(document).on("click", ".addaddress", function() {
        addaddress($("#" + $(this).attr("data-currency")).data(), false);
    })
}

// Adds an address to the user's portfolio or opens the address edit dialog
function addaddress(ad, edit) {
    const currency = ad.currency,
        cpid = ad.ccsymbol + "-" + currency,
        address = ad.address || "",
        label = ad.label || "",
        readonly = (edit === true) ? " readonly" : "",
        nopub = glob_test_derive === false || (is_xpub(currency) === false || has_xpub(currency) !== false),
        choose_wallet_str = "<span id='get_wallet' class='address_option' data-currency='" + currency + "'>" + translate("noaddressyet", {
            "currency": currency
        }) + "</span>",
        derive_seed_str = "<span id='option_makeseed' class='address_option' data-currency='" + currency + "'>" + translate("generatewallet") + "</span>",
        options = glob_hasbip ? choose_wallet_str : (glob_test_derive && glob_c_derive[currency]) ? (hasbip32(currency) === true ? derive_seed_str : choose_wallet_str) : choose_wallet_str,
        pnotify = glob_body.hasClass("showstartpage") ? "<div class='popnotify' style='display:block'>" + options + "</div>" : "<div class='popnotify'></div>",
        scanqr = glob_hascam && !edit ? "<div class='qrscanner' data-currency='" + currency + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        title = edit ? "<h2 class='icon-pencil'>" + translate("editlabel") + "</h2>" : "<h2>" + getcc_icon(ad.cmcid, cpid, ad.erc20) + " " + translate("addcoinaddress", {
            "currency": currency
        }) + "</h2>",
        pk_checkbox = edit ? "" : "<div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("pkownership") + "</span></div>",
        addeditclass = edit ? "edit" : "add",
        xpubclass = nopub ? " hasxpub" : " noxpub",
        xpubph = nopub ? translate("entercoinaddress", {
            "currency": currency
        }) : translate("nopub"),
        vk_val = ad.vk || "",
        has_vk = (vk_val !== ""),
        scanvk = glob_hascam ? "<div class='qrscanner' data-currency='" + currency + "' data-id='viewkey' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        vk_box = (currency == "monero") ? has_vk ? "" : "<div class='inputwrap'><input type='text' class='vk_input' value='" + vk_val + "' placeholder='" + translate("secretviewkey") + "'>" + scanvk + "</div>" : "",
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
    if (edit) {
        $("#popup input.addresslabel").focus().select();
        return
    }
    $("#popup input.address").focus();
}

// Handles changes in the address/xpub input field
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

// Checks if there are active derivations for a given currency
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
    if (derive === "seed") {
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
    if (derive === "xpub") {
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

// Handles the "Get Wallet" button click
function get_wallet() {
    $(document).on("click", "#get_wallet", function() {
        const this_currency = $(this).attr("data-currency");
        canceldialog();
        setTimeout(function() {
            download_wallet(this_currency);
        }, 800);
    })
}

// Handles the submission of the address form
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

// Handles the "Connect Lightning Node" button click
function add_lightning() {
    $(document).on("click", "#connectln", function() {
        lm_function();
        return
    })
}

// Handles the "Add ERC20 Token" button click
function add_erc20() {
    $(document).on("click", "#add_erc20, #choose_erc20", function() {
        const tokenobject = fetch_cached_erc20();
        let tokenlist = "";
        $.each(tokenobject, function(key, value) {
            tokenlist += "<span data-id='" + value.cmcid + "' data-currency='" + value.name + "' data-ccsymbol='" + value.symbol.toLowerCase() + "' data-contract='" + value.contract + "' data-pe='none'>" + value.symbol + " | " + value.name + "</span>";
        });
        const nodedata = {
                "erc20": true,
                "monitored": true,
                "checked": true
            },
            checked_eth_addresses = filter_addressli("ethereum", "checked", true),
            first_checked_eth_address = checked_eth_addresses[0],
            eth_address_data = first_checked_eth_address ? $(first_checked_eth_address).data() : false,
            eth_address_prefill = eth_address_data ? eth_address_data.address : "",
            eth_label_prefill = eth_address_data ? eth_address_data.label : "",
            scanqr = glob_hascam ? "<div class='qrscanner' data-currency='ethereum' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
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
                    <div class='inputwrap'><input type='text' class='address' value='" + eth_address_prefill + "' placeholder='" + translate("enteraddress") + "'/>" + scanqr + "</div>\
                    <input type='text' class='addresslabel' value='" + eth_label_prefill + "' placeholder='label'/>\
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

// Handles autocomplete functionality for ERC20 token input
function autocomplete_erc20token() {
    $(document).on("input", "#ac_input", function() {
        const thisinput = $(this),
            thisform = thisinput.closest("form"),
            thisvalue = thisinput.val().toLowerCase(),
            options = thisform.find(".options");
        thisform.removeClass("validated");
        $("#ac_options > span").each(function() {
            const thisoption = $(this),
                thistext = thisoption.text(),
                currency = thisoption.attr("data-currency"),
                currencysymbol = thisoption.attr("data-ccsymbol"),
                contract = thisoption.attr("data-contract"),
                thisid = thisoption.attr("data-id");
            thisoption.removeClass("show");
            if (thisvalue.length > 2 && (currencysymbol === thisvalue || currency === thisvalue)) {
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

// Handles the selection of an ERC20 token from the dropdown
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

// Initializes the address form for the selected ERC20 token
function initaddressform(coin_data) {
    const erc20formbox = $("#erc20formbox"),
        erc20_inputs = erc20formbox.find("#erc20_inputs"),
        addressfield = erc20formbox.find("input.address"),
        labelfield = erc20formbox.find("input.addresslabel");
    addressfield.add(labelfield);
    erc20formbox.data(coin_data);
    addressfield.attr("placeholder", translate("entercoinaddress", {
        "currency": coin_data.currency
    }));
    if (!erc20_inputs.is(":visible")) {
        erc20_inputs.slideDown(300);
        addressfield.focus();
    }
}

// Handles the submission of the ERC20 token form
function submit_erc20() {
    $(document).on("click", "#erc20formbox input.submit", function(e) {
        e.preventDefault();
        validateaddress_vk($("#erc20formbox").data());
    });
}

// Validates the address and view key (if applicable) for the selected currency
function validateaddress_vk(ad) {
    const currency = ad.currency,
        addressfield = $("#addressform .address"),
        addressinputval = addressfield.val();
    if (!addressinputval) {
        const errormessage = translate("entercoinaddress", {
            "currency": currency
        });
        popnotify("error", errormessage);
        addressfield.focus();
        return
    }
    if (currency) {
        const vkfield = $("#addressform .vk_input"),
            vkinputval = (currency === "monero" && vkfield.length) ? vkfield.val() : 0,
            vklength = vkinputval.length;
        if (vklength) {
            if (vklength !== 64) {
                popnotify("error", translate("invalidvk"));
                return
            }
            if (!check_vk(vkinputval)) {
                popnotify("error", translate("invalidvk"));
                return
            }
            const valid = check_address(addressinputval, currency);
            if (!valid === true) {
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
                    const error = errormessage || translate("invalidvk");
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

// Validates the address for the selected currency and handles the addition or editing of the address
function validateaddress(ad, vk) {
    const currency = ad.currency,
        iserc20 = ad.erc20 === true,
        currencycheck = iserc20 ? "ethereum" : currency,
        ccsymbol = ad.ccsymbol,
        addressfield = $("#addressform .address"),
        addressinputvalue = addressfield.val(),
        addressinputval = currency === "nimiq" ? addressinputvalue.replace(/\s/g, "") : addressinputvalue,
        currentaddresslist = get_addresslist(currency),
        getindex = currentaddresslist.children("li").length + 1,
        index = getindex > 1 ? getindex : 1,
        labelfield = $("#addressform .addresslabel"),
        labelinput = labelfield.val(),
        labelinputval = labelinput || "";
    if (!addressinputval) {
        popnotify("error", translate("entercoinaddress", {
            "currency": currency
        }));
        addressfield.focus();
        return
    }
    const addinputval = currency === "bitcoin-cash" && addressinputval.includes(":") ? addressinputval.split(":").pop() : addressinputval,
        addressduplicate = filter_addressli(currency, "address", addinputval).length > 0,
        address = ad.address,
        label = ad.label;
    if (addressduplicate && address !== addinputval) {
        popnotify("error", translate("alreadyexists"));
        addressfield.select();
        return
    }
    if (addinputval == glob_new_address) { // prevent double address entries
        console.log("already added");
        return
    }
    const valid = check_address(addinputval, currencycheck);
    if (!valid) {
        popnotify("error", addressinputval + " " + translate("novalidaddress", {
            "currency": currency
        }));
        setTimeout(function() {
            addressfield.select();
        }, 10);
        return
    }
    const validlabel = check_address(labelinputval, currencycheck);
    if (validlabel === true) {
        popnotify("error", translate("invalidlabel"));
        labelfield.val(label).select();
        return
    }
    if ($("#addressformbox").hasClass("formedit")) {
        const currentlistitem = currentaddresslist.children("li[data-address='" + address + "']"),
            ed = {
                "label": labelinputval
            };
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
    if (!pk_checked) {
        popnotify("error", translate("confirmpkownership"));
        return
    }
    if (index === 1) {
        if (iserc20 === true) {
            buildpage(ad, true);
            append_coinsetting(currency, get_erc20_settings());
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
}

// Validates an address for a given currency using a regex pattern
function check_address(address, currency) {
    const regex = getcoindata(currency).regex;
    return regex ? new RegExp(regex).test(address) : false;
}

// Validates a view key using a regex pattern
function check_vk(vk) {
    return new RegExp("^[a-fA-F0-9]+$").test(vk);
}

// Handles the click event for the send button
function send_trigger() {
    $(document).on("click", ".send", function() {
        if (glob_hasbip === true) {
            compatible_wallets($(this).attr("data-currency"));
            return
        }
        playsound(glob_funk);
    })
}

// Handles the click event for showing BIP39 information
function showbip39_trigger() {
    $(document).on("click", ".show_bip39", function() {
        all_pinpanel({
            "func": manage_bip32
        });
        canceldialog();
    })
}

// Handles the click event for canceling a dialog
function canceldialog_click() {
    $(document).on("click", ".cancel_dialog", canceldialog);
}

// Sets up event listeners for closing dialogs
function canceldialogtrigger() {
    $(document).on("click", "#popup", function(e) {
        const target = e.target,
            jtarget = $(target),
            target_id = jtarget.attr("id"),
            options = $("#dialog").find(".options");
        if (options.length > 0 && options.hasClass("showoptions")) {
            const pointerevent = jtarget.attr("data-pe");
            if (pointerevent !== "none") {
                options.removeClass("showoptions");
            }
            return
        }
        if (target == this || target_id === "canceldialog") {
            canceldialog();
        }
    });
}

// Closes the current dialog
function canceldialog(pass) {
    if (glob_inframe === true) {
        if (pass !== true) {
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
    if (isopenrequest()) {
        if (request) { // reset after_scan
            request.rq_timer = now();
            // re initialize websocket
            const address = request.address
            if (glob_sockets[address]) {
                return
            }
            if (glob_pinging[address]) {
                return
            }
            init_socket(helper.selected_socket, address);
            set_request_timer();
        }
    }
}

// Blocks canceling of payment dialog when inputs are focused
function blockcancelpaymentdialog() {
    $(document).on("mousedown", "#payment", function(e) {
        glob_blockswipe = false;
        if (e.target === this) {
            const inputs = glob_paymentdialogbox.find("input");
            if (inputs.is(":focus")) {
                glob_blockswipe = true;
            }
        }
    })
}

// Handles the cancellation of the payment dialog
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
        if (e.target === this) {
            escapeandback();
            glob_cp_timer = now();
        }
    });
}

// Removes focus from input fields
function unfocus_inputs() {
    glob_paymentdialogbox.find("input").blur();
}

// Checks polling conditions and closes payment dialog if necessary
function cpd_pollcheck() {
    if (q_obj(request, "received") !== true) {
        const rq_timer = request.rq_timer,
            rq_time = now() - rq_timer;
        if (rq_time > glob_after_scan_timeout) {
            if (empty_obj(glob_sockets)) { // No afterscan when polling
                close_paymentdialog();
                return
            }
            close_paymentdialog(true);
            return
        }
    }
    close_paymentdialog();
}

// Cancels the payment dialog and resets related states
function cancelpaymentdialog() {
    if (glob_html.hasClass("hide_app")) {
        closeloader();
        parent.postMessage("close_request", "*");
        return
    }
    hide_paymentdialog();
    reset_paymentdialog();

}

// Hides the paymentdialog
function hide_paymentdialog() {
    glob_paymentpopup.removeClass("active live");
    glob_html.removeClass("blurmain_payment");
}

// Resets the paymentdialog states
function reset_paymentdialog() {
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
        helper = null,
        glob_l2s = {};
    const wstimeout = setTimeout(function() {
        closesocket();
    }, 500, function() {
        clearTimeout(wstimeout);
    });
}

// Forces closure of WebSocket connections
function forceclosesocket(s_id) {
    console.log("force close");
    clearpinging(s_id);
    closesocket(s_id);
}

// Closes WebSocket connections
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
}

// Clears pinging intervals
function clearpinging(s_id) {
    if (s_id) { // close this interval
        if (glob_pinging[s_id]) {
            clearInterval(glob_pinging[s_id]);
            delete glob_pinging[s_id]
        }
        return
    }
    if (!empty_obj(glob_pinging)) {
        $.each(glob_pinging, function(key, value) {
            clearInterval(value);
        });
        glob_pinging = {};
    }
}

// Sets up event listener for canceling the share dialog
function cancelsharedialogtrigger() {
    $(document).on("click", "#sharepopup", function(e) {
        if (e.target === this) {
            cancelsharedialog();
        }
    });
}

// Cancels the share dialog
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

// Sets up event listener for showing options
function showoptionstrigger() {
    $(document).on("click", ".popoptions", function(e) {
        const ad = $(this).closest("li").data(),
            address = ad.address;
        if (address === "lnurl") {
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

// Shows options dialog
function showoptions(content, addclass) {
    if (addclass && addclass.includes("pin")) {
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
    const plusclass = addclass ? " " + addclass : "";
    $("#optionspop").addClass("showpu active" + plusclass);
    $("#optionsbox").html(content);
    glob_body.addClass("blurmain_options");
}

// Displays the lock screen
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

// Sets up event listener for seed unlock
function seed_unlock_trigger() {
    $(document).on("click", "#lockscreen #seed_unlock", function() {
        $("#lockscreen #phrasewrap").addClass("showph");
    });
}

// Handles login with recovery phrase
function phrase_login() {
    $(document).on("click", "#phrase_login", function() {
        const bip39phrase = $("#lockscreen #bip39phrase"),
            b39txt = bip39phrase.text(),
            seedobject = ls_phrase_obj(),
            savedid = seedobject.pid,
            phraseid = get_seedid(b39txt.split(" "));
        if (phraseid === savedid || phraseid === glob_cashier_seedid) {
            clearpinlock();
            if (!glob_html.hasClass("loaded")) {
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

// Removes cashier-related data and flags
function remove_cashier() {
    if (glob_is_cashier) {
        br_remove_local("cashier");
        glob_cashier_dat = false,
            glob_is_cashier = false,
            glob_cashier_seedid = false;
    }
}

// Handles the creation of a new request using an alias
function newrequest_alias() {
    $(document).on("click", "#newrequest_alias", function() {
        if (is_scanning()) return
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

// Handles the creation of a new request
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
            if (seedid !== glob_bipid) {
                if (addr_whitelist(address) !== true) {
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
            } else if (bipv_pass() === false) {
                canceloptions();
                return
            }
        }
        canceloptions();
        finishtxfunction(currency, address, null, title);
    });
}

// Handles confirmation of a new request creation
function confirm_ms_newrequest() {
    $(document).on("click", "#address_newrequest .submit", function(e) {
        e.preventDefault();
        const thisdialog = $("#address_newrequest"),
            d_dat = thisdialog.data(),
            pk_checkbox = thisdialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked"),
            ds_checkbox = thisdialog.find("#dontshowwrap"),
            ds_checked = ds_checkbox.data("checked");
        if (!pk_checked == true) {
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

// Handles showing requests for a specific address
function showrequests() {
    $(document).on("click", ".showrequests", function(e) {
        e.preventDefault();
        loadpage("?p=requests&filteraddress=" + $(this).closest("ul").data("address"));
        canceloptions();
    });
}

// Handles showing requests for an inline address
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

// Triggers the edit address function
function editaddresstrigger() {
    $(document).on("click", ".editaddress", function(e) {
        e.preventDefault();
        addaddress($(this).closest("ul").data(), true);
    })
}

// Handles the removal of an address
function removeaddress() {
    $(document).on("click", ".removeaddress", function(e) {
        e.preventDefault();
        popdialog("<h2 class='icon-bin'>" + translate("removeaddress") + "</h2>", "removeaddressfunction", $(this));
    })
}

// Performs the address removal operation
function removeaddressfunction(trigger) {
    const result = confirm(translate("areyousure"));
    if (result === true) {
        const optionslist = trigger.closest("ul#optionslist"),
            ad = optionslist.data(),
            currency = ad.currency,
            address = ad.address,
            erc20 = ad.erc20,
            current_entry = filter_addressli(currency, "address", address);
        current_entry.remove();
        const currentaddresslist = get_addresslist(currency).children("li"); // check lenghth after removing address
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

// Handles showing recent payments for an address
function rec_payments() {
    $(document).on("click", "#rpayments", function() {
        const ad = $(this).closest("ul").data(),
            blockchainurl = blockexplorer_url(ad.currency, false, ad.erc20, ad.source, ad.eth_layer2);
        if (blockchainurl !== undefined) {
            open_blockexplorer_url(blockchainurl + ad.address);
        }
    })
}

// Handles showing transaction details
function showtransaction_trigger() {
    $(document).on("click", ".metalist .show_tx, .transactionlist .tx_val", function() {
        alert("jaap");
        const thisnode = $(this),
            thislist = thisnode.closest("li"),
            rqli = thisnode.closest("li.rqli"),
            rqldat = rqli.data(),
            txhash = (thisnode.hasClass("tx_val")) ? thislist.data("txhash") : rqldat.txhash;
        if (txhash) {
            const lnhash = txhash.startsWith("lightning");
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
                            return
                        }
                    }
                }
                playsound(glob_funk);
                return
            }
            const rql_dat = rqli.data(),
                currency = rql_dat.payment,
                erc20 = rql_dat.erc20,
                source = rql_dat.source,
                layer = rql_dat.eth_layer2,
                blockchainurl = blockexplorer_url(currency, true, erc20, source, layer);
            if (blockchainurl) {
                open_blockexplorer_url(blockchainurl + txhash);
            }
        }
    })
}

// Handles showing all transactions for an address
function showtransactions() {
    $(document).on("click", ".showtransactions", function(e) {
        e.preventDefault();
        const ad = $("#ad_info_wrap").data(),
            blockchainurl = blockexplorer_url(ad.currency, false, ad.erc20, ad.source, ad.eth_layer2);
        if (blockchainurl) {
            open_blockexplorer_url(blockchainurl + ad.address);
        }
    })
}

// Displays address information
function addressinfo() {
    $(document).on("click", ".address_info", function() {
        const dialogwrap = $(this).closest("ul"),
            dd = dialogwrap.data(),
            label = dd.label || dd.a_id || "",
            currency = dd.currency,
            isbip = hasbip32(currency),
            bip32dat = (isbip) ? getbip32dat(currency) : null,
            seedid = dd.seedid,
            xpubid = dd.xpubid,
            vk = dd.vk,
            source = seedid ? "seed" : xpubid ? "xpub" : false,
            isseed = source === "seed",
            isxpub = source === "xpub",
            activepub = active_xpub(currency),
            active_src = isseed ? (seedid === glob_bipid) : (isxpub ? (activepub && xpubid === activepub.key_id) : false),
            address = dd.address,
            a_wl = addr_whitelist(address),
            restore = isseed ? (glob_hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + seedid + "'>" + translate("resoresecretphrase") + "</div>" : "",
            srcval = source ? (active_src) ? source + " <span class='icon-checkmark'>" : source + " (Unavailable)" + restore : "external",
            d_index = dd.derive_index,
            purpose = dd.purpose;
        let dpath = bip32dat ? bip32dat.root_path + d_index : "";
        if (purpose) {
            const dsplit = dpath.split("/");
            dsplit[1] = purpose;
            dpath = dsplit.join("/");
        }
        dd.dpath = dpath,
            dd.bip32dat = bip32dat,
            dd.address = address;
        const cc_icon = getcc_icon(dd.cmcid, dd.ccsymbol + "-" + currency, dd.erc20),
            dpath_str = isseed ? "<li><strong>" + translate("derivationpath") + ":</strong> " + dpath + "</li>" : "",
            pk_verified = "Unknown <span class='icon-checkmark'></span>",
            vkobj = vk ? vk_obj(vk) : false,
            vkdat = vkobj ? (isseed && active_src ? "derive" : vkobj.vk) : false,
            showtl = translate("show"),
            pk_str = vkdat ? "<span id='show_vk' class='ref' data-vk='" + vkdat + "'>" + showtl + "</span>" :
            (isseed ? (active_src ? "<span id='show_pk' class='ref'>" + showtl + "</span>" :
                (a_wl === true ? pk_verified : "Unknown")) : pk_verified);
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

// Handles showing private key
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

// Callback function for showing private key
function show_pk_cb(pk) {
    $("#show_pk").text(translate("hide"));
    $("#pkspan").text(pk);
    $("#qrcode").qrcode(pk);
    $("#pk_span").addClass("shwpk").slideDown(200);
    $("#qrcodea").slideUp(200);
}

// Handles showing view key
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
        if (vk === "derive") {
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

// Callback function for showing view key
function show_vk_cb(kd) {
    const stat = kd.stat,
        ststr = (stat) ? "" : "<br/><strong style='color:#8d8d8d'>" + translate("secretviewkey") + "</strong> <span class='adbox adboxl select' data-type='Viewkey'>" + kd.svk + "</span><br/>";
    $("#show_vk").text(translate("hide"));
    $("#pk_span").html(ststr + "<br/><strong style='color:#8d8d8d'>" + translate("secretspendkey") + "</strong> <span class='adbox adboxl select' data-type='Spendkey'>" + kd.ssk + "</span>").addClass("shwpk").slideDown(200);
}

// Opens a block explorer URL
function open_blockexplorer_url(be_link) {
    const result = confirm(translate("openurl", {
        "url": be_link
    }));
    if (result === true) {
        glob_w_loc.href = be_link;
    }
}

// Generates a block explorer URL based on currency and transaction type
function blockexplorer_url(currency, tx, erc20, source, layer) {
    const tx_prefix = tx ? "tx/" : "address/";
    if (layer === "bnb") {
        return "https://bscscan.com/" + tx_prefix;
    }
    if (layer === "arbitrum") {
        return "https://arbiscan.io/" + tx_prefix;
    }
    if (layer === "polygon") {
        return "https://polygonscan.com/" + tx_prefix;
    }
    if (erc20) {
        return "https://ethplorer.io/" + tx_prefix;
    }
    const blockexplorer = get_blockexplorer(currency);
    if (blockexplorer) {
        const blockdata = glob_br_config.blockexplorers.find(filter => filter.name === blockexplorer);
        if (!blockdata) return false;
        const be_prefix = blockdata.prefix,
            coindata = getcoindata(currency),
            pfix = be_prefix === "currencysymbol" ? coindata.ccsymbol :
            be_prefix === "currency" ? currency : be_prefix,
            prefix = pfix ? pfix + "/" : "",
            prefix_type = tx === true ? blockdata.tx_prefix : blockdata.address_prefix;
        return blockdata.url + prefix + prefix_type;
    }
    return false;
}

// Retrieves the block explorer for a given currency
function get_blockexplorer(currency) {
    return cs_node(currency, "blockexplorers", true).selected;
}

// Handles clicking on API source shortcut
function apisrc_shortcut() {
    $(document).on("click", ".api_source", function() {
        const rpc_settings_li = cs_node($(this).closest("li.rqli").data("payment"), "apis");
        if (rpc_settings_li) {
            rpc_settings_li.trigger("click");
        }
    })
}

// Sets up event listener for canceling options
function canceloptionstrigger() {
    $(document).on("click", "#optionspop, #closeoptions", function(e) {
        if (glob_inframe) {
            parent.postMessage("close_request", "*");
            return
        }
        if (e.target === this) {
            canceloptions();
        }
    });
}

// Handles canceling options
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
        if (!ishome() && !glob_html.hasClass("loaded")) {
            shake(optionspop);
            return;
        }
    }
    clearoptions();
}

// Clears options from the UI
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

// Handles showing request details
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

// Toggles request metadata visibility
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

// Animates the confirmation bar
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

// Shows transaction metadata on double click
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

// Hides transaction metadata on click
function hide_transaction_meta() {
    $(document).on("click", ".requestlist li .transactionlist li", function() {
        const thisli = $(this),
            tx_meta = thisli.children(".historic_meta");
        if (tx_meta.is(":visible")) {
            tx_meta.slideUp(300);
        }
    })
}

// Handles archiving a request
function archive() {
    $(document).on("click", "#requestlist .req_actions .icon-folder-open", function() {
        popdialog("<h2 class='icon-folder-open'>" + translate("archiverequest") + "</h2>", "archivefunction", $(this));
    })
}

// Performs the archive function
function archivefunction() {
    const thisreguest = $("#requestlist > li.visible_request"),
        requestdata = thisreguest.data(),
        requestcopy = thisreguest.clone();
    if (thisreguest.data("status") === "insufficient") {
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

// Handles unarchiving a request
function unarchive() {
    $(document).on("click", "#archivelist .req_actions .icon-undo2", function() {
        popdialog("<h2 class='icon-undo2'>" + translate("unarchiverequest") + "</h2>", "unarchivefunction", $(this));
    })
}

// Performs the unarchive function
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

// Handles removing a request
function removerequest() {
    $(document).on("click", ".req_actions .icon-bin", function() {
        popdialog("<h2 class='icon-bin'>" + translate("deleterequest") + "?</h2>", "removerequestfunction", $(this));
    })
}

// Performs the remove request function
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

// Calculates the amount short for a payment
function amountshort(amount, receivedamount, fiatvalue, iscrypto) {
    const amount_recieved = iscrypto === true ? receivedamount : fiatvalue,
        amount_short = amount - amount_recieved,
        numberamount = iscrypto === true ? trimdecimals(amount_short, 5) : trimdecimals(amount_short, 2);
    return (isNaN(numberamount)) ? null : numberamount;
}

// Handles editing a request
function editrequest() {
    $(document).on("click", ".editrequest", function() {
        const thisnode = $(this),
            thisrequestid = thisnode.attr("data-requestid"),
            requestlist = $("#" + thisrequestid),
            requesttitle = requestlist.data("requesttitle"),
            requesttitle_input = requesttitle || "",
            formheader = requesttitle ? translate("edit") : translate("enter"),
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

// Handles submitting a request description
function submit_request_description() {
    $(document).on("click", "#edit_request_formbox input.submit", function(e) {
        const thisnode = $(this),
            this_requestid = thisnode.attr("data-requestid"),
            this_requesttitle = thisnode.prev("input").val(),
            requesttitle_val = this_requesttitle || "empty";
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

// Handles displaying receipt information
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

// Handles downloading a receipt
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

// Handles sharing a receipt
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
                sharedtitle = "bitrequest_receipt_" + requestid + ".pdf",
                url_hash = hashcode(requestid + sharedtitle);
            shorten_url(sharedtitle, href, fetch_aws("img_receipt_icon.png"), true, url_hash);
            closeloader();
        }
    })
}

// Looks up a Lightning Network invoice
function lnd_lookup_invoice(proxy, imp, hash, nid, pid, pw) {
    const p_arr = lnurl_deform(proxy),
        proxy_host = p_arr.url,
        pk = pw || p_arr.k,
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
        if (!e) {
            notify(translate("nofetchincoice"));
            closeloader();
            return
        }
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
    }).fail(function(jqXHR, textStatus, errorThrown) {
        notify(translate("nofetchincoice"));
        closeloader();
    });
}

// Generates a PDF URL for a receipt
function get_pdf_url(rqdat) {
    const {
        requestid,
        currencyname,
        requestname,
        requesttitle,
        status,
        txhash,
        lightning,
        paymenttimestamp,
        amount,
        fiatvalue,
        receivedamount,
        requesttype,
        iscrypto,
        uoa,
        eth_layer2,
        requestdate,
        timestamp,
        payment,
        address
    } = rqdat,
    statustext = status === "new" ? "Waiting for payment" : status,
        lnhash = txhash && txhash.slice(0, 9) === "lightning",
        hybrid = lightning && lightning.hybrid === true,
        ptsformatted = fulldateformat(new Date(paymenttimestamp - glob_timezone), glob_langcode),
        receivedamount_rounded = trimdecimals(receivedamount, 6),
        fiatvalue_rounded = trimdecimals(fiatvalue, 2),
        incoming = requesttype === "incoming",
        outgoing = requesttype === "outgoing",
        local = requesttype === "local",
        checkout = requesttype === "checkout",
        typetext = incoming ? (checkout ? "online purchase" : "incoming") : (local ? "point of sale" : "outgoing"),
        deter = iscrypto ? 6 : 2,
        amount_rounded = trimdecimals(amount, deter),
        uoa_upper = uoa.toUpperCase(),
        utc = timestamp - glob_timezone,
        localtime = requestdate ? requestdate - glob_timezone : utc,
        localtimeobject = new Date(localtime),
        requestdateformatted = fulldateformat(localtimeobject, glob_langcode),
        created = requestdate ? requestdateformatted : "unknown",
        utc_format = fulldateformat(new Date(utc)),
        lnd_string = lnhash ? " (lightning)" : "",
        invd = {
            "Request ID": requestid,
            [transclear("currency")]: clear_accents(payment + lnd_string),
            [transclear("amount")]: amount_rounded + " " + uoa_upper,
            [transclear("status")]: transclear(statustext),
            [transclear("type")]: transclear(typetext),
            [transclear("receivingaddress")]: address
        };
    if (exists(requestname)) {
        invd[transclear("from")] = clear_accents(requestname);
    }
    if (exists(requesttitle)) {
        invd[transclear("title")] = "'" + clear_accents(requesttitle) + "'";
    }
    if (incoming) {
        invd[transclear("created")] = created;
        invd[transclear("firstviewed")] = utc_format;
    }
    if (status === "paid") {
        const amountpaidreceived = incoming ? transclear("amountpaid") : transclear("amountreceived");
        invd[transclear("paidon")] = ptsformatted;
        invd[amountpaidreceived] = receivedamount_rounded + " " + payment;
        if (!iscrypto) {
            invd[transclear("fiatvalueon") + " " + ptsformatted] = fiatvalue_rounded + " " + currencyname;
        }
    }
    if (exists(txhash)) {
        invd["TxID"] = txhash;
    }
    const network = getnetwork(eth_layer2);
    if (network) {
        invd[transclear("network")] = network;
    }
    const set_proxy = d_proxy();
    return set_proxy + "proxy/v1/receipt/?data=" + btoa(JSON.stringify(invd));
}

// Countdown format

// Calculates the remaining time from a given timestamp
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

// Formats the countdown object into a human-readable string
function countdown_format(cd) {
    const days = cd.days,
        hours = cd.hours,
        minutes = cd.minutes,
        seconds = cd.seconds,
        daynode = days ? (days < 2) ? days + " " + translate("day") : days + " " + translate("days") : "",
        hs = days ? ", " : "",
        hournode = hours ? (hours < 2) ? hs + hours + " " + translate("hour") : hs + hours + " " + translate("hours") : "",
        ms = hours ? ", " : "",
        minutenode = minutes ? (minutes < 2) ? ms + minutes + " " + translate("minute") : ms + minutes + " " + translate("minutes") : "",
        ss = minutes ? " " + translate("and") + " " : "",
        secondnode = seconds ? ss + seconds + " " + translate("seconds") : "",
        result = cd ? daynode + hournode + minutenode + secondnode : false;
    return result;
}

// ** Page rendering **

// Renders the currencies from cached data
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

// Renders currency settings from cache
function render_currencysettings(thiscurrency) {
    const settingcache = br_get_local(thiscurrency + "_settings", true);
    if (settingcache) {
        append_coinsetting(thiscurrency, settingcache);
    }
}

// Builds the settings UI
function buildsettings() {
    const appsettingslist = $("#appsettings");
    glob_br_config.app_settings.forEach(function(value) {
        const setting_id = value.id,
            selected = value.selected,
            value_tl = translate(selected),
            setval = value_tl || selected,
            setting_li = (setting_id === "heading") ? $("<li class='set_heading'>\
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

// Renders settings from cache, excluding specified settings
function rendersettings(excludes) {
    const settingcache = br_get_local("settings", true);
    if (settingcache) {
        settingcache.forEach(function(value) {
            const settings_id = value.id;
            if ($.inArray(settings_id, excludes) === -1) { // exclude excludes
                const selected = value.selected,
                    value_tl = translate(selected),
                    setval = settings_id === "accountsettings" ? selected : (value_tl || selected); // Exclude translations
                $("#" + value.id).data(value).find("p").text(setval);
            }
        });
    }
}

// Renders requests from cache
function renderrequests() {
    fetchrequests("requests", false);
    fetchrequests("archive", true);
    archive_button();
}

// Manages the visibility of the archive button
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

// Fetches and renders requests from cache
function fetchrequests(cachename, archive) {
    const requestcache = br_get_local(cachename, true);
    if (requestcache) {
        const showarchive = !archive && requestcache.length > 11; // only show archive button when there are more then 11 requests
        requestcache.reverse().forEach(function(value) {
            value.archive = archive;
            value.showarchive = showarchive;
            appendrequest(value);
        });
    }
}

// Initializes the page when there's no cache
function initiate() {
    $.each(glob_br_config.bitrequest_coin_data, function(dat, val) {
        if (val.active === true) {
            const {
                settings,
                "data": cd
            } = val,
            has_settings = !!settings,
                is_monitored = has_settings && !!settings.apis,
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

// Builds the page for a specific currency
function buildpage(cd, ini) {
    const {
        currency,
        ccsymbol,
        checked,
        cmcid,
        erc20,
        settings
    } = cd,
    cpid = ccsymbol + "-" + currency,
        // append currencies
        currencylist = $("ul#usedcurrencies"),
        cc_li = currencylist.children("li[data-currency='" + currency + "']"),
        home_currencylist = $("ul#currencylist"),
        home_cc_li = home_currencylist.children("li[data-currency='" + currency + "']"),
        visibility = checked ? "" : "hide",
        has_settings = settings === true || erc20 === true;
    glob_init = cc_li.length === 0 && ini === true;
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
        const settingspage = has_settings ? "\
        <div class='page' id='" + currency + "_settings' data-erc20='" + erc20 + "'>\
            <div class='content'>\
                <h2 class='heading'>" + getcc_icon(cmcid, cpid, erc20) + " " + currency + " " + translate("settings") + "</h2>\
                <ul class='cc_settinglist settinglist applist listyle2'></ul>\
                <div class='reset_cc_settings button' data-currency='" + currency + "'>\
                    <span>" + translate("resetbutton") + "</span>\
                </div>\
            </div>\
        </div>" : "";
        const settingsbutton = has_settings ? "<div data-rel='?p=" + currency + "_settings' class='self icon-cog'></div>" : "",
            sendbttn = glob_hasbip ? "<div class='button send' data-currency='" + currency + "'><span class='icon-telegram'>" + translate("send") + "</span></div>" : "",
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
                br_set_local(currency + "_settings", get_erc20_settings(), true);
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

// Appends coin settings to the UI
function append_coinsetting(currency, settings) {
    const coinsettings_list = $("#" + currency + "_settings ul.cc_settinglist");
    $.each(settings, function(dat, val) {
        if (val.xpub === false) {
            return
        }
        const selected = val.selected,
            selected_val = selected.name || selected.url || selected;
        if (selected_val !== undefined) {
            const selected_string = selected_val.toString(),
                ss_filter = selected_string === "true" || selected_string === "false" ? "" : selected_string,
                ss_tl = translate(ss_filter),
                ss_translate = ss_tl || ss_filter,
                check_setting_li = coinsettings_list.children("li[data-id='" + dat + "']");
            if (check_setting_li.length === 0) {
                const switchclass = val.custom_switch ? " custom" : " global bool",
                    trigger = val.switch ? switchpanel(selected_string, switchclass) : "<span class='icon-pencil'></span>",
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
    });
}

// Appends an address to the UI
function appendaddress(currency, ad) {
    const address = ad.address,
        pobox = get_addresslist(currency),
        index = pobox.children("li").length + 1,
        seedid = ad.seedid,
        addressid = ad.a_id,
        xpubid = ad.xpubid,
        source = seedid ? "seed" : (xpubid ? "xpub" : ""),
        used = ad.used,
        ad_id_str = addressid ? "address_ID: " + addressid + "\n" : "",
        ad_icon = source ? source === "seed" ? "<span title='" + ad_id_str + "seed_ID: " + seedid + "' class='srcicon' data-seedid='" + seedid + "'>" + svg_obj.seed + "</span>" : "<span class='srcicon icon-key' title='" + ad_id_str + "derived from Xpub: #" + xpubid + "'></span>" : currency === "monero" ? ad.vk ? "<span class='srcicon icon-eye' title='Monitored address'></span>" : "<span class='srcicon icon-eye-blocked' title='Unmonitored address'></span>" : "",
        activepub = active_xpub(currency),
        clasv = source ? source === "seed" ? seedid === glob_bipid ? " seed seedv" : " seed seedu" :
        source === "xpub" ? (activepub && xpubid == activepub.key_id) ? " xpub xpubv" : " xpub xpubu" : "" : "",
        usedcl = used ? " used" : "",
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

// Appends a new request to the UI
function appendrequest(rd) {
    const {
        payment,
        erc20,
        uoa,
        amount,
        address,
        payment_id,
        xmr_ia,
        currencysymbol,
        cmcid,
        cpid,
        requesttype,
        iscrypto,
        requestname,
        requesttitle,
        set_confirmations,
        currencyname,
        receivedamount,
        fiatvalue,
        txhash,
        lightning,
        confirmations,
        status,
        pending,
        requestid,
        archive,
        showarchive,
        timestamp,
        requestdate,
        rqdata,
        rqmeta,
        monitored,
        source,
        eth_layer2,
        txhistory,
        paymenttimestamp
    } = rd,
    uoa_upper = uoa.toUpperCase(),
        deter = iscrypto === true ? 6 : 2,
        insufficient = status === "insufficient",
        lnhash = txhash && txhash.slice(0, 9) === "lightning",
        hybrid = lightning && lightning.hybrid === true,
        conf = confirmations || 0,
        requesttitle_short = requesttitle && requesttitle.length > 85 ?
        "<span title='" + requesttitle + "'>" + requesttitle.substring(0, 64) + "...</span>" :
        requesttitle,
        amount_rounded = trimdecimals(amount, Math.min(deter, 8)),
        receivedamount_rounded = trimdecimals(receivedamount, 6),
        fiatvalue_rounded = trimdecimals(fiatvalue, 2),
        requestlist = archive === true ? $("#archivelist") : $("#requestlist"),
        utc = timestamp - glob_timezone,
        localtime = requestdate ? requestdate - glob_timezone : utc,
        incoming = requesttype === "incoming",
        local = requesttype === "local",
        checkout = requesttype === "checkout",
        outgoing = requesttype === "outgoing",
        direction = incoming ? "sent" : "received",
        typetext = checkout ? "online purchase" : local ? "point of sale" : requesttype,
        typetext_translate = translate(typetext),
        requesticon = checkout ? " typeicon icon-cart" : local ? " icon-qrcode" : incoming ? " typeicon icon-arrow-down-right2" : " typeicon icon-arrow-up-right2",
        typeicon = "<span class='inout" + requesticon + "'></span> ",
        statusicon = "<span class='icon-checkmark' title='Confirmed transaction'></span>\
            <span class='icon-clock' title='pending transaction'></span>\
            <span class='icon-eye-blocked' title='unmonitored transaction'></span>\
            <span class='icon-wifi-off' title='No network'></span>",
        requesttitlestring = (rqdata || requesttitle) ? (incoming ? requestname : requesttitle_short) : "<b>" + amount_rounded + "</b> " + currencyname + statusicon,
        requestnamestring = (rqdata || requesttitle) ? (incoming ? "<strong>" + requesttitle_short + "</strong> (" + amount_rounded + " " + currencyname + ")" + statusicon : amount_rounded + " " + currencyname + statusicon) : "",
        rqdataparam = rqdata ? "&d=" + rqdata : "",
        rqmetaparam = rqmeta ? "&m=" + rqmeta : "",
        requesttypeclass = "request" + requesttype,
        lnclass = lightning ? " lightning" : "",
        lnd_expire = (lightning && !hybrid) || lnhash,
        expirytime = lnd_expire ? 604800000 : (iscrypto === true) ? 25920000000 : 6048000000, // expirydate crypto: 300 days / fiat: 70 days / lightning: 7 days
        isexpired = (status == "expired" || (now() - localtime) >= expirytime && (lnd_expire || status == "new" || insufficient === true)),
        expiredclass = isexpired ? " expired" : "",
        localtimeobject = new Date(localtime),
        requestdateformatted = fulldateformat(localtimeobject, glob_langcode),
        timeformat = "<span class='rq_month'>" + localtimeobject.toLocaleString(glob_langcode, {
            "month": "short"
        }) + "</span> <span class='rq_day'>" + localtimeobject.getDate() + "</span>",
        ptsformatted = fulldateformat(new Date(paymenttimestamp - glob_timezone), glob_langcode, true),
        amount_short_rounded = amountshort(amount, receivedamount, fiatvalue, iscrypto),
        amount_short_span = insufficient ? " (" + amount_short_rounded + " " + uoa_upper + " " + translate("amountshort") + ")" : "",
        amount_short_cc_span = iscrypto ? amount_short_span : "",
        created = requestdate ? requestdateformatted : "<strong>unknown</strong>",
        amountpaidreceived = incoming ? translate("amountpaid") : translate("amountreceived"),
        fiatvaluebox = iscrypto || !fiatvalue ? "" : "<li class='payday pd_fiat'><strong>" + translate("fiatvalueon") + "<span class='pd_fiat'> " + ptsformatted + "</span> :</strong><span class='fiatvalue'> " + fiatvalue_rounded + "</span> " + currencyname + "<div class='show_as amountshort'>" + amount_short_span + "</div></li>",
        paymentdetails = "<li class='payday pd_paydate'><strong>" + translate("paidon") + ":</strong><span class='paydate'> " + ptsformatted + "</span></li><li class='receivedamount'><strong>" + amountpaidreceived + ":</strong><span> " + receivedamount_rounded + "</span> " + payment + "<div class='show_as amountshort'>" + amount_short_cc_span + "</div></li>" + fiatvaluebox,
        requestnamebox = incoming ? rqdata ? "<li><strong>" + translate("from") + ":</strong> " + requestname + "</li>" : "<li><strong>From: unknown</strong></li>" : "",
        requesttitlebox = requesttitle ? "<li><strong>" + translate("title") + ":</strong> '<span class='requesttitlebox'>" + requesttitle + "</span>'</li>" : "",
        ismonitoredspan = !monitored ? " (unmonitored transaction)" : "",
        timestampbox = incoming ? "<li><strong>" + translate("created") + ":</strong> " + created + "</li><li><strong>" + translate("firstviewed") + ":</strong> " + fulldateformat(new Date(utc), glob_langcode) + "</li>" :
        outgoing ? "<li><strong>" + translate("sendon") + ":</strong> " + requestdateformatted + "</li>" :
        local ? "<li><strong>" + translate("created") + ":</strong> " + requestdateformatted + "</li>" : "",
        paymenturl = "&address=" + address + rqdataparam + rqmetaparam + "&requestid=" + requestid,
        islabel = $("main #" + payment + " li[data-address='" + address + "']").data("label"),
        requestlabel = islabel ? " <span class='requestlabel'>(" + islabel + ")</span>" : "",
        conf_box = !monitored ? "<div class='txli_conf' data-conf='0'><span>Unmonitored transaction</span></div>" :
        conf > 0 ? "<div class='txli_conf'><div class='confbar'></div><span>" + conf + " / " + set_confirmations + " " + translate("confirmations") + "</span></div>" :
        conf === 0 ? "<div class='txli_conf' data-conf='0'><div class='confbar'></div><span>Unconfirmed transaction<span></div>" : "",
        view_tx_markup = lnhash ? "<li><strong class='show_tx'><span class='icon-power'></span><span class='ref'>" + translate("viewinvoice") + "</span></strong></li>" : (txhash) ? "<li><strong class='show_tx'><span class='icon-eye'></span>" + translate("viewon") + " blockchain</strong></li>" : "",
        statustext = !monitored ? "" : (status == "new") ? "Waiting for payment" : status,
        src_html = source ? "<span class='src_txt'>" + translate("source") + ": " + source + "</span><span class='icon-wifi-off'></span><span class='icon-connection'></span>" : "",
        iscryptoclass = iscrypto ? "" : " isfiat",
        archivebutton = showarchive || isexpired ? "<div class='icon-folder-open' title='archive request'></div>" : "",
        render_archive = txhistory && (pending == "no" || archive === true),
        tl_text = render_archive ? translate("transactions") : "",
        edit_request = local ? "<div class='editrequest icon-pencil' title='edit request' data-requestid='" + requestid + "'></div>" : "",
        pid_li = payment_id ? "<li><strong>" + translate("paymentid") + ":</strong> <span class='select' data-type='payment ID'>" + payment_id + "</span></li>" : "",
        ia_li = xmr_ia ? "<li><p class='address'><strong>" + translate("integratedaddress") + ":</strong> <span class='requestaddress select'>" + xmr_ia + "</span></p></li>" : "",
        ln_emoji = lnhash ? " <span class='icon-power'></span>" : "",
        ln_logo = "<img src='img_logos_btc-lnd.png' class='cmc_icon'><img src='img_logos_btc-lnd.png' class='cmc_icon'>",
        cclogo = getcc_icon(cmcid, cpid, erc20) + getcc_icon(cmcid, cpid, erc20),
        cc_logo = lightning ? (txhash && !lnhash) ? cclogo : ln_logo : cclogo,
        rc_address_title = hybrid ? translate("fallbackaddress") : translate("receivingaddress"),
        address_markup = lightning && (lnhash || hybrid === false) ? "" : "<li><p class='address'><strong>" + rc_address_title + ":</strong> <span class='requestaddress select'>" + address + "</span>" + requestlabel + "</p></li>",
        network = getnetwork(eth_layer2),
        network_markup = network ? "<li><p><strong>" + translate("network") + ":</strong> " + network + "</p></li>" : "",
        tlstat = direction === "sent" ? translate("paymentsent") : translate("paymentreceived"),
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
            network_markup +
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
        add_historical_data(transactionlist, txhistory);
    }
}

// Add historical data
function add_historical_data(transactionlist, txhistory) {
    let tx_listitem = false;
    $.each(txhistory, function(data, value) {
        tx_listitem = append_tx_li(value, false);
        if (tx_listitem) {
            const h_string = data_title(value);
            if (h_string) {
                if (tx_listitem.attr("title") === h_string) {} else {
                    tx_listitem.append(hs_for(h_string)).attr("title", h_string);
                }
            }
            transactionlist.append(tx_listitem);
        }
    });
}

// Determines the network based on the layer
function getnetwork(layer) {
    if (!layer) return false;
    switch (layer) {
        case "bnb":
            return "BNB smart chain";
        default:
            return layer;
    }
}

// ** Store data in localstorage **

// Saves the list of used cryptocurrencies to local storage
function savecurrencies(add) {
    const currenciespush = $("#usedcurrencies li").map(function() {
        return $(this).data();
    }).get();
    br_set_local("currencies", currenciespush, true);
    updatechanges("currencies", add);
}

// Saves addresses for a specific currency to local storage
function saveaddresses(currency, add) {
    const pobox = get_addresslist(currency),
        addresses = pobox.find("li");
    if (addresses.length) {
        const addressboxpush = addresses.map(function() {
            return $(this).data();
        }).get();
        br_set_local("cc_" + currency, addressboxpush, true);
        updatechanges("addresses", add);
        return
    }
    br_remove_local("cc_" + currency);
    const coindata = getcoindata(currency);
    if (coindata) {
        if (coindata.erc20) {
            br_remove_local(currency + "_settings");
            updatechanges("addresses", add);
            return
        }
    }
    reset_coinsettings_function(currency);
}

// Saves the list of requests to local storage
function saverequests() {
    const requestpush = $("ul#requestlist > li").map(function() {
        return $(this).data();
    }).get();
    br_set_local("requests", requestpush, true);
    updatechanges("requests", true);
}

// Saves the archive list to local storage
function savearchive() {
    const requestpush = $("ul#archivelist > li").map(function() {
        return $(this).data();
    }).get();
    br_set_local("archive", requestpush, true);
}

// Saves the app settings to local storage
function savesettings(nit) {
    const settingsspush = $("ul#appsettings > li.render").map(function() {
        return $(this).data();
    }).get();
    br_set_local("settings", settingsspush, true);
    updatechanges("settings", true, nit);
}

// Saves the settings for a specific cryptocurrency to local storage
function save_cc_settings(currency, add) {
    const settingbox = {};
    $("#" + currency + "_settings ul.cc_settinglist > li").each(function() {
        const thisnode = $(this);
        settingbox[thisnode.attr("data-id")] = thisnode.data();
    });
    br_set_local(currency + "_settings", settingbox, true);
    updatechanges("coinsettings", add);
}

// Updates the changes counter and triggers related actions
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
        const cc = glob_changes[key] || 0;
        glob_changes[key] = cc + 1;
        savechangesstats();
        if (nit == "noalert") {
            return
        }
        change_alert();
    }
}

// Resets the changes counter
function resetchanges() {
    glob_changes = {};
    savechangesstats();
    glob_body.removeClass("haschanges");
    if (!glob_html.hasClass("proxyupdate")) {
        $("#alert > span").text("0").attr("title", translate("nochanges"));
    }
}

// Saves the changes statistics to local storage
function savechangesstats() {
    br_set_local("changes", glob_changes, true);
}

// Renders the changes from local storage or initializes an empty object
function renderchanges() {
    glob_changes = br_get_local("changes", true) || {};
}

// Displays an alert for changes and triggers backup if necessary
function change_alert() {
    if (glob_is_ios_app === true) {
        return
    }
    const total_changes = get_total_changes();
    if (total_changes > 24) {
        $("#alert > span").text(total_changes).attr("title", translate("totalchanges", {
            "total_changes": total_changes
        }));
        setTimeout(function() {
            glob_body.addClass("haschanges");
        }, 2500);
        if ([25, 50, 150, 200, 250].includes(total_changes)) {
            canceldialog();
            const timeout = setTimeout(function() {
                backupdatabase();
            }, 3000, function() {
                clearTimeout(timeout);
            });
        }
    }
}

// Calculates the total number of changes
function get_total_changes() {
    return Object.values(glob_changes).reduce((total, value) => total + (parseInt(value) || 0), 0);
}

// Renders HTML from a data object
function render_html(dat) {
    return dat.map(function(value) {
        return Object.entries(value).map(function([key, val]) {
            const id = val.id ? " id='" + val.id + "'" : "",
                clas = val.class ? " class='" + val.class + "'" : "",
                attr = val.attr ? render_attributes(val.attr) : "",
                content = val.content ? (typeof val.content === 'object' ? render_html(val.content) : val.content) : "",
                close = val.close ? "/>" : ">" + content + "</" + key + ">";
            return "<" + key + id + clas + attr + close;
        }).join("");
    }).join("");
}

// Renders HTML attributes from an object
function render_attributes(attr) {
    return Object.entries(attr).map(function([key, value]) {
        return " " + key + "='" + value + "'";
    }).join("");
}

// HTML rendering

// Creates a dialog template
function template_dialog(ddat) {
    const validated_class = ddat.validated ? " validated" : "",
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

// Handles opening URLs from the application
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
            if (target === "_blank") {
                window.open(url);
            } else {
                glob_w_loc.href = url;
            }
        }, 500);
    })
}

// Retrieves the BlockCypher API key
function get_blockcypher_apikey() {
    return $("#apikeys").data("blockcypher") || to.bc_id;
}

// Retrieves the Infura API key
function get_infura_apikey(rpcurl) {
    const savedkey = $("#apikeys").data("infura");
    return (/^[A-Za-z0-9]+$/.test(rpcurl.slice(-15))) ? "" : savedkey || to.if_id; // check if rpcurl already contains apikey
}

// Retrieves the Alchemy API key
function get_alchemy_apikey() {
    return $("#apikeys").data("alchemy") || to.al_id;
}

// Displays an alert for proxy updates
function proxy_alert(version) {
    if (version) {
        glob_html.addClass("proxyupdate");
        $("#alert > span").text("!").attr("title", translate("updateproxy", {
            "version": version,
            "proxy_version": glob_proxy_version
        }) + " " + d_proxy());
    }
}

// Fetches the symbol and ID for a given currency name
function fetchsymbol(currencyname) {
    const erc20tokens = fetch_cached_erc20();
    return erc20tokens.find(function(token) {
        return token.name === currencyname;
    }) || {};
}

// Checks if the fixed navigation should be applied
function fixedcheck(livetop) {
    const headerheight = $(".showmain #header").outerHeight();
    if (livetop > headerheight) {
        $(".showmain").addClass("fixednav");
        return
    }
    $(".showmain").removeClass("fixednav");
}

// Checks if the current page is the home page
function ishome(pagename) {
    const page = pagename || geturlparameters().p;
    return !page || page === "home";
}

// Triggers the submit action on a dialog
function triggersubmit(trigger) {
    trigger.parent("#actions").prev("#dialogbody").find("input.submit").trigger("click");
}

// Copies content to the clipboard
function copytoclipboard(content, type) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(content)
            .then(function() {
                notify(type + " " + translate("copied"), 2500, "no");
            })
            .catch(function() {
                notify(translate("xcopy") + " " + type, 2500, "no");
            });
        return;
    }

    glob_copycontent.val(content).select();
    try {
        if (document.execCommand("copy")) {
            notify(type + " " + translate("copied"), 2500, "no");
        } else {
            notify(translate("xcopy") + " " + type, 2500, "no");
        }
    } catch (err) {
        notify(translate("xcopy") + " " + type, 2500, "no");
    }
    glob_copycontent.val("").removeData("type").blur();
}

// Displays the loader
function loader(top) {
    $("#loader").addClass(top ? "showpu active toploader" : "showpu active");
}

// Sets up the event listener for closing the loader
function closeloader_trigger() {
    $(document).on("click", "#loader", closeloader);
}

// Closes the loader
function closeloader() {
    $("#loader").removeClass("showpu active toploader");
    loadertext(translate("loading"));
}

// Sets the text for the loader
function loadertext(text) {
    $("#loader #loadtext > span").text(text);
}

// Sets the title of the page
function settitle(title) {
    const page_title = title + " | " + glob_apptitle;
    glob_titlenode.text(page_title);
    glob_ogtitle.attr("content", page_title);
}

// Displays the PIN panel
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

// Generates the HTML for the PIN panel
function pinpanel(pinclass, pincb, set) {
    const makeclass = (pinclass === undefined) ? "" : pinclass,
        headertext = haspin(set) === true ? translate("pleaseenter") : translate("createpin");
    return $("<div id='pinfloat' class='enterpin" + makeclass + "'>\
        <p id='pintext'>" + headertext + "</p>\
        <p id='confirmpin'>" + translate("confirmyourpin") + "</p>\
        <input id='pininput' type='password' readonly='readonly'/>\
        <input id='validatepin' type='password' readonly='readonly'/>\
        <div id='pinkeypad'>" + generatePinpadHTML() + "</div>\
        <div id='pin_admin' class='flex'>\
            <div id='pin_admin_float'>\
                <div id='lock_time'><span class='icomoon'></span> " + translate("locktime") + "</div>\
                <div id='reset_pin'> " + translate("resetpin") + "</div>\
            </div>\
        </div>\
    </div>").data("pincb", pincb);
}

// Helper function to generate pinpad HTML
function generatePinpadHTML() {
    let html = "";
    for (let i = 1; i <= 9; i++) {
        html += "<div id='pin" + i + "' class='pinpad" + (i === 1 ? " flex" : "") + "'>" +
            "<span class='pincell'>" + i + "</span>" +
            "</div>" + (i % 3 === 0 ? "<br>" : "");
    }
    html += "<div id='locktime' class='pinpad'><span class='icomoon'></span></div>" +
        "<div id='pin0' class='pinpad'><span class='pincell'>0</span></div>" +
        "<div id='pinback' class='pinpad'><span class='icomoon'></span></div>";
    return html;
}

// Generates HTML for a switch panel
function switchpanel(switchmode, mode) {
    return "<div class='switchpanel " + switchmode + mode + "'><div class='switch'></div></div>"
}

// Attempts to find the next available API in the list
function try_next_api(apilistitem, current_apiname) {
    const apilist = glob_br_config.apilists[apilistitem],
        currentIndex = apilist.indexOf(current_apiname),
        next_api = apilist[(currentIndex + 1) % apilist.length];
    return glob_api_attempt[apilistitem][next_api] !== true ? next_api : false;
}

// Requests a wake lock to keep the screen active
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

// Releases the wake lock, allowing the screen to sleep
function sleep() {
    if (glob_wl) {
        if (glob_wakelock) {
            glob_wakelock.release();
        }
        glob_wakelock = null;
    }
}

// Blocks certain actions for view-only users
function vu_block() {
    notify(translate("cashiernotallowed"));
    playsound(glob_funk);
}

// Checks for recent requests and toggles UI accordingly
function check_rr() {
    const ls_recentrequests = br_get_local("recent_requests", true);
    toggle_rr(ls_recentrequests && !empty_obj(ls_recentrequests));
}

// Toggles the visibility of recent requests in the UI
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

// Detects if the app should be promoted to the user
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

// Displays the app download panel
function getapp(type) {
    const app_panel = $("#app_panel");
    app_panel.html("");
    const isAndroid = type === "android",
        button = fetch_aws(isAndroid ? "img_button-playstore.png" : "img_button-appstore.png"),
        url = isAndroid ? "https://play.google.com/store/apps/details?id=" + glob_androidpackagename + "&pcampaignid=fdl_long&url=" + glob_approot + encodeURIComponent(glob_w_loc.search) : "https://apps.apple.com/app/id1484815377?mt=8",
        panelcontent = "<h2>Download the app</h2>\
            <a href='" + url + "' class='exit store_bttn'><img src='" + button + "'></a><br/>\
            <div id='not_now'>Not now</div>";
    app_panel.html(panelcontent);
    setTimeout(function() {
        glob_body.addClass("getapp");
    }, 1500);
    br_set_local("appstore_dialog", now());
}

// Handles closing the app download panel
function close_app_panel() {
    $(document).on("click", "#not_now", function() {
        glob_body.removeClass("getapp");
        setTimeout(function() {
            $("#app_panel").html("");
        }, 800);
    });
}

// Returns the appropriate icon for the given platform
function platform_icon(platform) {
    switch (platform) {
        case "playstore":
            return fetch_aws("img_button-playstore.png");
        case "appstore":
            return fetch_aws("img_button-appstore.png");
        default:
            return fetch_aws("img_button-desktop_app.png");
    }
}

// Checks if a dialog is currently open
function is_opendialog() {
    return $("#dialogbody > div.formbox").length > 0;
}

// Checks if a request is currently open
function is_openrequest() {
    return $("#request_front").length > 0;
}

// Checks and processes URL scheme intents
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
        const imp = proto === "lndconnect" ? "lnd" : proto === "c-lightning-rest" ? "c-lightning" : proto,
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

// Expands a short URL
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

// Expands a Bitly short URL
function expand_bitly(i_param) {
    if (glob_hostlocation === "local") {
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

// Handles Lightning Network connection
function ln_connect(gets) {
    const lgets = gets || geturlparameters(),
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

// ** Scanner UI Integration **//

// Initializes the QR scanner, checking if it's in an iframe and if a camera is available
function init_scan() {
    if (glob_inframe || glob_local) {
        glob_hascam = false;
        return
    }
    QrScanner.hasCamera().then(hasCamera => detect_cam(hasCamera));
}

// Sets the global camera availability flag
function detect_cam(result) {
    glob_hascam = result;
}

// Starts the QR scanner for a specific currency and type
function start_scan(currency, type) {
    scanner.start().then(() => {
        currencyscan = currency,
            scantype = type;
        const currentpage = geturlparameters().p,
            currentpage_correct = currentpage ? "?p=" + currentpage + "&scan=" : "?scan=",
            url = currentpage_correct + currency,
            title = "scanning " + currency + " " + type;
        openpage(url, title, "scan");
        show_cam();
        closeloader();
    }).catch((reason) => abort_cam(reason));
}

// Handles camera initialization errors
function abort_cam(reason) {
    console.log(reason);
    closeloader();
}

// Sets up click event listener for QR scanner elements
function cam_trigger() {
    $(document).on("click", ".qrscanner", function() {
        loader(true);
        loadertext(translate("loadingcamera"));
        const thisqr = $(this),
            currency = thisqr.attr("data-currency"),
            type = thisqr.attr("data-id");
        start_scan(currency, type);
    });
}

// Sets up click event listener for closing the camera
function close_cam_trigger() {
    $(document).on("click", "#closecam", function(e) {
        if (e.originalEvent) {
            window.history.back();
            return;
        }
        close_cam();
    });
}

// Shows the camera interface
function show_cam() {
    glob_body.addClass("showcam");
}

// Closes the camera interface and stops the scanner
function close_cam() {
    glob_body.removeClass("showcam");
    scanner.stop();
    currencyscan = null;
}

// Processes the QR scan result based on the scan type
function setResult(result) {
    scanner.stop();
    const payment = currencyscan,
        thistype = scantype;
    if (thistype === "lnconnect") {
        handleLnconnect(result, payment);
    } else if (thistype === "address") {
        handleAddress(result, payment);
    } else if (thistype === "viewkey") {
        handleViewkey(result, payment);
    }
    window.history.back();
    return false;
}

function handleLnconnect(result, payment) {
    const params_url = renderlnconnect(result);
    if (params_url) {
        const resturl = params_url.resturl,
            macaroon = params_url.macaroon;
        if (resturl && macaroon) {
            const macval = b64urldecode(macaroon);
            if (macval) {
                const set_vals = set_ln_fields(payment, resturl, macval);
                if (set_vals) {
                    trigger_ln();
                }
            }
            return
        }
        popnotify("error", "unable to decode qr");
    }
}

function handleAddress(result, payment) {
    const prefix = payment + ":",
        mid_result = (result.indexOf(prefix) >= 0 && payment !== "kaspa") ? result.split(prefix).pop() : result,
        end_result = (result.indexOf("?") >= 0) ? mid_result.split("?")[0] : mid_result,
        isxpub = (end_result.length > 103),
        er_val = (payment === "nimiq") ? end_result.replace(/\s/g, "") : end_result,
        validate = isxpub ? check_xpub(end_result, xpub_prefix(payment), payment) : check_address(er_val, payment);

    clear_xpub_inputs();
    if (validate === true) {
        $("#popup .formbox input.address").val(er_val);
        if (!glob_supportsTouch) {
            $("#popup .formbox input.addresslabel").focus();
        }
        if (isxpub) {
            if (cxpub(payment)) {
                clear_xpub_checkboxes();
                validate_xpub($(".formbox"));
            } else {
                popnotify("error", "invalid " + payment + " address");
            }
        }
        return
    } else {
        if (isxpub) {
            xpub_fail(payment);
            return
        }
        popnotify("error", "invalid " + payment + " address");
    }
}

function handleViewkey(result, payment) {
    const validate = (result.length === 64) ? check_vk(result) : false;
    if (validate === true) {
        $("#popup .formbox input.vk_input").val(result);
        if (!glob_supportsTouch) {
            $("#popup .formbox input.addresslabel").focus();
        }
        return
    }
    popnotify("error", "invalid " + payment + " viewkey");
}

// Adds a service worker to the application
function add_serviceworker() {
    if ("serviceWorker" in navigator && !navigator.serviceWorker.controller) {
        navigator.serviceWorker.register(glob_approot + "serviceworker.js", {
                "scope": "./"
            })
            .then(function(reg) {
                console.log("Service worker has been registered for scope: " + reg.scope);
            }).catch(function(e) {
                // Registration failed
                console.log(e);
            });
    }
}