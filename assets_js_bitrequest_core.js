// Initialize the application when the document is ready
$(document).ready(function() {
    $.ajaxSetup({
        "cache": false
    });
    buildsettings(); // build settings first

    if (glob_const.hostlocation !== "local") { // don't add service worker on desktop
        add_serviceworker();
    }

    //close potential websockets and pings
    forceclosesocket();
    clearpinging();

    //Set classname for iframe	
    if (glob_const.inframe === true) {
        glob_const.html.addClass("inframe");
        const gets = geturlparameters();
        if (gets.payment) {
            glob_const.html.addClass("hide_app");
        }
    } else {
        glob_const.html.addClass("noframe");
    }

    //some api tests first
    rendersettings(); //retrieve settings from localstorage (load first to retrieve apikey)
    if (glob_const.ls_support) { //check for local storage support
        if (!glob_const.stored_currencies) { //show startpage if no addresses are added
            glob_const.body.addClass("showstartpage");
        }
        const bip_verified = glob_let.io.bipv,
            php_enabled = glob_let.io.phpsupport;
        if (bip_verified && glob_let.hasbip === true) {
            glob_let.bipv = true;
        }
        if (php_enabled) {
            glob_const.phpsupport = (php_enabled === "yes");
            setsymbols();
        } else {
            checkphp();
        }
    } else {
        const error_msg = "<h2 class='icon-bin'>Sorry!</h2><p>No Web Storage support..</p>";
        popdialog(error_msg, "canceldialog");
    }
    $("#fixednav").html($("#relnav").html()); // copy nav
    //startscreen
    setTimeout(function() {
        const splash_screen = $("#startscreen");
        splash_screen.addClass("hidesplashscreen");
        setTimeout(function() {
            splash_screen.remove();
        }, 600);
    }, 600);
    showselect();
    selectbox();
    pickselect();
    canceldialogtrigger();
    console.log({
        glob_config
    });
})

// Validates PHP support by testing fixer API endpoint and configures global PHP support status
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
        const api_result = br_result(e);
        if (api_result.proxy === true) {
            const currency_symbols = q_obj(api_result, "result.result.symbols");
            if (currency_symbols) {
                if (currency_symbols.USD) {
                    br_set_local("symbols", currency_symbols, true);
                } else {
                    const api_error = data.error || "Unable to get API data";
                    fail_dialogs("fixer", {
                        "error": api_error
                    });
                }
            }
            glob_let.io.phpsupport = "yes";
            br_set_local("init", glob_let.io, true);
            glob_const.phpsupport = true;
            setsymbols();
            return
        }
        glob_let.io.phpsupport = "no";
        br_set_local("init", glob_let.io, true);
        glob_const.phpsupport = false;
        setsymbols();
    }).fail(function(xhr, stat, err) {
        glob_let.io.phpsupport = "no";
        br_set_local("init", glob_let.io, true);
        glob_const.phpsupport = false;
        setsymbols();
    });
}

// Retrieves and caches fiat currency symbols from fixer.io with 24h expiration
function setsymbols() {
    //set globals
    glob_let.local = (glob_const.hostlocation === "local" && glob_const.phpsupport === false),
        glob_let.localserver = (glob_const.hostlocation === "local" && glob_const.phpsupport === true);
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
        const api_data = br_result(e).result;
        if (api_data) {
            const currency_symbols = api_data.symbols;
            if (currency_symbols && currency_symbols.USD) {
                br_set_local("symbols", currency_symbols, true);
                geterc20tokens();
                return
            }
            const api_error = api_data.error || "Unable to get API data";
            fail_dialogs("fixer", {
                "error": api_error
            });
        }
    }).fail(function(xhr, stat, err) {
        if (get_next_proxy()) {
            setsymbols();
            return
        }
        const error_msg = "<h2 class='icon-bin'>" + translate("apicallfailed") + "</h2><p class='doselect'>" + textStatus + "<br/>" + translate("apididnotrespond") + "<br/><br/><span id='proxy_dialog' class='ref'>" + translate("tryotherproxy") + "</span></p>";
        popdialog(error_msg, "canceldialog");
    })
}

// Fetches top 2000 ERC20 tokens from CoinMarketCap, filters Ethereum tokens, and caches results
function geterc20tokens() {
    const cached_tokens = fetch_cached_erc20(true);
    if (cached_tokens) {
        setfunctions();
        return;
    }
    api_proxy({
        "api": "coinmarketcap",
        "search": "v1/cryptocurrency/listings/latest?cryptocurrency_type=tokens&limit=2000&aux=cmc_rank,platform",
        "cachetime": glob_const.token_cache,
        "cachefolder": "1w",
        "proxy": true,
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const api_data = br_result(e).result,
            api_status = api_data.status;
        if (api_status && api_status.error_code === 0) {
            const tokens_list = api_data.data;
            if (tokens_list) {
                // Split token_array in two and convert
                const mid_point = Math.floor(tokens_list.length / 2),
                    tokens_first = tokens_list.slice(0, mid_point),
                    tokens_second = tokens_list.slice(mid_point);
                if (tokens_first && tokens_second) {
                    store_coindata(tokens_first, tokens_second);
                    return
                }
            }
        }
        const error_msg = "<h2 class='icon-bin'>" + translate("apicallfailed") + "</h2><p class='doselect'>" + translate("nofetchtokeninfo") + "</p>";
        popdialog(error_msg, "canceldialog");
    }).fail(function(xhr, stat, err) {
        if (get_next_proxy()) {
            geterc20tokens();
            return
        }
        const error_msg = "<h2 class='icon-bin'>" + translate("apicallfailed") + "</h2><p class='doselect'>" + translate("nofetchtokeninfo") + "</p>";
        popdialog(error_msg, "canceldialog");
    }).always(function() {
        setfunctions();
    });
}

// Splits and stores token data in localStorage with timestamp for cache management
function store_coindata(tokens_first, tokens_second) {
    if (tokens_first) {
        const converted_first = convert_coinlist(tokens_first);
        if (converted_first) {
            cr_push = {
                "timestamp": now(),
                "token_arr": converted_first
            }
            br_set_local("erc20tokens_init", cr_push, true);
        }
    }
    if (tokens_second) {
        const converted_second = convert_coinlist(tokens_second);
        if (converted_second) {
            br_set_local("erc20tokens", converted_second, true);
        }
    }
}

// Filters Ethereum-based tokens (platform ID 1027) and maps to simplified token object structure
function convert_coinlist(token_list) {
    try {
        return token_list.filter(token => token.platform && token.platform.id === 1027).map(token => ({
            "name": token.slug,
            "symbol": token.symbol.toLowerCase(),
            "cmcid": token.id,
            "contract": token.platform.token_address
        }));
    } catch (err) {
        console.error(err.name, err.message);
        return false;
    }
}

// Validates PIN configuration and optional locktime settings from DOM data attributes
function haspin(check_exists) {
    const pin_data = $("#pinsettings").data(),
        pin_hash = pin_data.pinhash;
    if (pin_hash) {
        const pin_str = pin_hash.toString(),
            valid_length = pin_str.length > 3;
        if (valid_length) {
            if (check_exists) {
                return true;
            }
            return pin_data.locktime !== "never";
        }
    }
    return false;
}

// Determines if app requires unlock based on configured timeout and last activity timestamp
function islocked() {
    const url_params = geturlparameters(),
        lock_duration = $("#pinsettings").data("locktime"),
        last_lock = br_get_local("locktime"),
        time_since_lock = now() - last_lock,
        lock_seconds = parseFloat(lock_duration);
    return url_params.payment ? false : (haspin() === true && time_since_lock > lock_seconds);
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
    //set_xmr_node_access
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
        console.log({
            glob_const
        });
    }, 700);
    //getapp
    close_app_panel();
    //platform_icon
    gk();
    glob_const.html.addClass("loaded");
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
    //set_result
    //handle_ln_connect
    //handle_address
    //handle_viewkey

    //add_serviceworker
}

//checks

// Updates HTML document language and meta tag attributes based on current language code
function setlocales() {
    glob_const.html.attr("lang", langcode);
    $("meta[property='og:locale']").attr("content", langcode);
    $("meta[property='og:url']").attr("content", glob_const.w_loc.href);
}

// Sets HTML element data-role based on user permission level
function setpermissions() {
    const permission = $("#permissions").data("selected");
    glob_const.html.attr("data-role", permission);
}

// Returns true if current user has cashier (view-only) permissions
function is_viewonly() {
    const permission = $("#permissions").data("selected");
    return permission === "cashier";
}

// ** Pincode ** //

// Binds keyboard number inputs to PIN pad for numeric entry
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

// Routes PIN input to either entry or validation handling based on current mode
function pinpressselect(node) {
    if ($("#pinfloat").hasClass("enterpin")) {
        pinpress(node);
        return
    }
    pinvalidate(node)
}

// Initializes click handler for PIN pad numeric buttons
function pinpresstrigger() {
    $(document).on("click", "#optionspop .enterpin .pinpad .pincell", function() {
        pinpress($(this));
    });
}

// Processes PIN digit entry, validates length, and manages visual feedback
function pinpress(pin_button) {
    const pin_container = $("#pinfloat"),
        digit = pin_button.text(),
        pin_field = $("#pininput"),
        current_pin = pin_field.val(),
        updated_pin = current_pin + digit;
    if (updated_pin.length === 4) {
        if (pin_container.hasClass("pinwall")) {
            enterapp(updated_pin);
            pin_field.val(updated_pin);
            return false;
        }
        pin_field.val(updated_pin);
        setTimeout(function() {
            pin_container.addClass("validatepin").removeClass("enterpin");
        }, 100);
        return false;
    }
    if (updated_pin.length > 4) {
        return false;
    }
    pin_field.val(updated_pin);
    pin_button.addClass("activepad");
    setTimeout(function() {
        pin_button.removeClass("activepad");
    }, 500);
    $("#pincode .pinpad").not(pin_button).removeClass("activepad");
}

// Validates PIN entry and manages app access, lockouts, and security timeouts
function enterapp(pin_input) {
    const pin_container = $("#pinfloat"),
        pin_config = $("#pinsettings").data(),
        stored_pin = pin_config.pinhash,
        attempt_count = pin_config.attempts,
        hashed_pin = hashcode(pin_input),
        timestamp = now(),
        is_global = pin_container.hasClass("global");
    if (hashed_pin == stored_pin) {
        if (is_global) {
            br_set_local("locktime", timestamp);
            finishfunctions();
            setTimeout(function() {
                playsound(glob_const.waterdrop);
                canceloptions(true);
            }, 500);
        } else if (pin_container.hasClass("admin")) {
            br_set_local("locktime", timestamp);
            loadpage("?p=currencies");
            $(".currenciesbttn .self").addClass("activemenu");
            playsound(glob_const.waterdrop);
            canceloptions(true);
        } else if (pin_container.hasClass("reset")) {
            br_set_local("locktime", timestamp);
            $("#pintext").text(translate("enternewpin"));
            pin_container.addClass("p_admin").removeClass("pinwall reset");
            playsound(glob_const.waterdrop);
            setTimeout(function() {
                $("#pininput").val("");
            }, 200);
        } else {
            const pin_callback = pin_container.data("pincb");
            if (pin_callback) {
                pin_callback.func(pin_callback.args);
            } else {
                br_set_local("locktime", timestamp);
            }
            playsound(glob_const.waterdrop);
            canceloptions(true);
        }
        pin_config.attempts = 0;
        savesettings(is_global);
        remove_cashier();
    } else {
        if (!navigator.vibrate) {
            playsound(glob_const.funk);
        }
        shake(pin_container);
        setTimeout(function() {
            $("#pininput").val("");
        }, 10);
        if (attempt_count > 2) {
            const timeout_rules = [{
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
            const current_rule = timeout_rules.find(rule => attempt_count === rule.threshold);
            if (current_rule) {
                const lock_until = timestamp + current_rule.duration;
                pin_config.timeout = lock_until;
                lockscreen(lock_until);
            } else if (attempt_count > 9) {
                attempt_count = 1;
            }
        }
        pin_config.attempts = attempt_count + 1;
        savesettings(is_global);
    }
}

// Resets PIN lockout state by clearing timeout and attempt counters
function clearpinlock() {
    const pin_config = $("#pinsettings").data();
    pin_config.timeout = null;
    pin_config.attempts = 0;
    savesettings();
}

// Initializes click handler for PIN reset functionality
function pin_admin_reset() {
    $(document).on("click", "#reset_pin", function() {
        $("#pinfloat").removeClass("p_admin");
    });
}

// Sets up click handlers for PIN confirmation pad
function pinvalidatetrigger() {
    $(document).on("click", "#optionspop .validatepin .pinpad .pincell", function() {
        pinvalidate($(this))
    });
}

// Handles PIN confirmation entry and validates match with initial entry
function pinvalidate(pin_button) {
    const pin_container = $("#pinfloat"),
        digit = pin_button.text(),
        confirm_field = $("#validatepin"),
        current_input = confirm_field.val(),
        updated_input = current_input + digit;
    if (updated_input.length > 3) {
        if (updated_input == $("#pininput").val()) {
            const old_pin = get_setting("pinsettings", "pinhash"),
                pin_settings = $("#pinsettings"),
                pin_hash = hashcode(updated_input),
                pin_status = "pincode activated",
                lock_duration = pin_settings.data("locktime");
            pin_settings.data({
                "pinhash": pin_hash,
                "locktime": lock_duration,
                "selected": pin_status
            }).find("p").text(pin_status);
            savesettings();
            playsound(glob_const.waterdrop);
            canceloptions(true);
            const pin_callback = pin_container.data("pincb");
            if (pin_callback) {
                pin_callback.func(pin_callback.args);
            }
            notify(translate("datasaved"));
            enc_s(seed_decrypt(old_pin));
        } else {
            topnotify(translate("pinmatch"));
            if (navigator.vibrate) {} else {
                playsound(glob_const.funk);
            }
            shake(pin_container);
            confirm_field.val("");
        }
    }
    if (updated_input.length > 4) {
        return false;
    }
    confirm_field.val(updated_input);
    pin_button.addClass("activepad");
    setTimeout(function() {
        pin_button.removeClass("activepad");
    }, 500);
    $("#pincode .pinpad").not(pin_button).removeClass("activepad");
}

// Binds click handler for PIN backspace in entry mode
function pinbacktrigger() {
    $(document).on("click", "#optionspop #pinfloat.enterpin #pinback", function() {
        pinback($("#pininput"));
    });
}

// Binds click handler for PIN backspace in validation mode
function pinbackvalidatetrigger() {
    $(document).on("click", "#optionspop #pinfloat.validatepin #pinback", function() {
        pinback($("#validatepin"));
    });
}

// Removes last entered PIN digit and updates input display
function pinback(pin_field) {
    const current_val = pin_field.val(),
        trimmed_val = current_val.slice(0, -1);
    pin_field.val(trimmed_val);
}

// ** IOS Redirects **
// (Can only be envoked from the IOS app) 
// Configures app for iOS-specific behaviors and adds iOS identifier
function ios_init() {
    glob_const.is_ios_app = true;
    glob_const.body.addClass("ios"); // ios app fingerprint
}

// Manages URL routing and page transitions for iOS app integration
function ios_redirections(url) {
    if (!url) return;
    const query_string = get_search(url),
        url_params = renderparameters(query_string);
    if (url_params.xss) return;
    const current_url = glob_const.w_loc.href.toUpperCase(),
        new_url = url.toUpperCase();
    if (current_url === new_url) return;
    if (br_get_local("editurl") === glob_const.w_loc.search) return;
    const is_payment = new_url.includes("PAYMENT=");
    if (is_payment) {
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
    if (url_params.i) {
        // expand shorturl don't open page
    } else if (url_params.data) {
        glob_const.w_loc.href = url;
    } else {
        const page_name = url_params.p || "prompt";
        openpage(url, page_name, "page");
    }
    if (is_opendialog() === true) {
        canceldialog();
        setTimeout(function() {
            check_params(url_params);
        }, 1000);
        return
    }
    check_params(url_params);
}

// ** Intropage **
// Initializes intro process click handler on intro panel and proceed button
function starttrigger() {
    $(document).on("click touchend", "#intro .panelwrap, #intro .proceeed", function() {
        startnext($("#intro"));
    });
}

// Sets up click handler for name entry panel in intro flow
function startnexttrigger() {
    $(document).on("click touchend", "#entername .panelwrap", function(event) {
        if (event.target === this) {
            startnext($("#entername"));
        }
    });
}

// Progresses to next intro panel if current step is valid
function startnext(panel_node) {
    const next_panel = panel_node.attr("data-next");
    if (!next_panel) return;
    if (panel_node.hasClass("validstep")) {
        $("#startpage").attr("class", "sp_" + next_panel);
        panel_node.removeClass("panelactive").next(".startpanel").addClass("panelactive");
        $("#eninput").blur();
        return
    }
    topnotify(translate("enteryourname"));
}

// Returns to previous intro panel
function startprev(panel_node) {
    const prev_panel = panel_node.attr("data-prev");
    if (!prev_panel) return;
    $("#startpage").attr("class", "sp_" + prev_panel);
    panel_node.removeClass("panelactive").prev(".startpanel").addClass("panelactive");
    $("#eninput").blur();
}

// Manages keydown events and character limits for name input field
function lettercountkeydown() {
    $(document).on("keydown", "#eninput", function(event) {
        const key_code = event.which || event.keyCode,
            name_input = $(this),
            input_length = name_input.val().length,
            chars_remaining = parseInt(name_input.attr("data-max"), 10) - input_length;
        if (key_code === 13) {
            startnext($("#entername"));
        }
        if (key_code === 8 || key_code === 39 || key_code === 37 || key_code === 91 || key_code === 17 || event.metaKey || event.ctrlKey) { //alow backspace, arrowright, arrowleft, command, ctrl
            return
        }
        if (chars_remaining === 0) {
            playsound(glob_const.funk);
            event.preventDefault();
        }
    });
}

// Updates character count and validation state for name input
function lettercountinput() {
    $(document).on("input", "#eninput", function() {
        const name_input = $(this),
            min_chars = parseInt(name_input.attr("data-min"), 10),
            name_panel = $("#entername"),
            input_length = name_input.val().length,
            chars_remaining = parseInt(name_input.attr("data-max"), 10) - input_length,
            char_counter = $("#lettercount");
        char_counter.text(chars_remaining);
        name_panel.toggleClass("validstep", input_length >= min_chars);
        char_counter.toggleClass("activlc", input_length > 0);
    });
}

// Handles currency selection and adds associated address
function choosecurrency() {
    $(document).on("click touch", "#allcurrencies li.choose_currency", function() {
        const currency_code = $(this).attr("data-currency"),
            currency_data = getcoindata(currency_code);
        addaddress({
            "currency": currency_code,
            "ccsymbol": currency_data.ccsymbol,
            "cmcid": currency_data.cmcid,
            "erc20": false,
            "checked": true
        }, false);
    })
}

// ** Navigation **
// Controls navigation toggle based on header clicks and app state
function togglenav() {
    $(document).on("click", "#header", function() {
        if (glob_const.html.hasClass("showmain")) {
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
            const pin_content = pinpanel(" pinwall admin");
            showoptions(pin_content, "pin");
            return
        }
        loadpage("?p=currencies");
        $(".currenciesbttn .self").addClass("activemenu");
    });
}

// Routes to appropriate page based on URL parameters
function loadurl() {
    const url_params = geturlparameters();
    if (url_params.xss) {
        loadpageevent("home");
        return
    }
    const page_name = url_params.p,
        has_payment = url_params.payment,
        current_url = glob_const.w_loc.search,
        load_type = has_payment ? "both" : "loadpage";
    if (current_url) {
        openpage(current_url, page_name, load_type);
    } else {
        loadpageevent("home");
    }
    shownav(page_name);
    const bip_params = url_params.bip39;
    if (bip_params) {
        bip39_sc(bip_params);
    }
}

// Handles navigation link clicks
function clicklink() {
    $(document).on("click", ".self", function(event) {
        event.preventDefault();
        loadpage($(this).attr("data-rel"));
        return
    })
}

// Updates URL and triggers page load
function loadpage(target_url) {
    const page_name = target_url.split("&")[0].split("=").pop();
    openpage(target_url, page_name, "loadpage");
}

// Updates browser history and loads specified page function
function openpage(target_url, page_name, load_type) {
    history.pushState({
        "pagename": page_name,
        "event": load_type
    }, "", target_url);
    loadfunction(page_name, load_type);
}

// Manages browser back/forward navigation state
function popstate() {
    window.addEventListener("popstate", function(event) {
        const state_data = event.state;
        if (state_data && state_data.pagename) {
            loadfunction(state_data.pagename, state_data.event);
            return;
        }
        cancel_url_dialogs();
    });
}

// Routes to appropriate function based on page type and event
function loadfunction(page_name, event_type) {
    if (event_type === "payment") { //load paymentpopup if payment is set
        loadpaymentfunction();
        return
    }
    if (event_type === "both") { //load paymentpopup if payment is set and load page
        loadpageevent(page_name);
        setTimeout(function() {
            loadpaymentfunction("delay");
        }, 1000);
        return
    }
    loadpageevent(page_name);
    const page_translation = translate(page_name),
        display_title = page_translation || page_name;
    settitle(display_title);
    cancel_url_dialogs();
}

// Closes active dialogs when URL changes
function cancel_url_dialogs() {
    if (isopenrequest()) {
        cancelpaymentdialog();
    }
    if (glob_const.body.hasClass("showcam")) {
        $("#closecam").trigger("click");
    }
}

// Updates UI elements when loading new page
function loadpageevent(page_name) {
    $("html, body").animate({
        "scrollTop": 0
    }, 400);
    const target_page = $("#" + page_name);
    target_page.addClass("currentpage");
    $(".page").not(target_page).removeClass("currentpage");
    $(".highlightbar").attr("data-class", page_name);
    shownav(page_name);
    const request_filter = geturlparameters().filteraddress; // filter requests if filter parameter exists
    if (request_filter && page_name === "requests") {
        $("#requestlist > li").not(get_requestli("address", request_filter)).hide();
    } else {
        $("#requestlist > li").show();
    }
}

// Toggles navigation visibility based on current page
function shownav(page_name) {
    if (ishome(page_name) === true) {
        glob_const.html.removeClass("showmain").addClass("hidemain");
        $("#relnav .nav").slideUp(300);
        return
    }
    glob_const.html.addClass("showmain").removeClass("hidemain")
    $("#relnav .nav").slideDown(300);
}

// Manages active state of menu items
function activemenu() {
    $(document).on("click", ".nav li .self", function() {
        const menu_item = $(this);
        $(".nav li .self").removeClass("activemenu");
        menu_item.addClass("activemenu");
    })
}

// Controls fixed navigation on page scroll
function fixednav() {
    $(document).scroll(function() {
        if (glob_const.html.hasClass("paymode")) {
            return
        }
        fixedcheck($(document).scrollTop());
    });
}

// ** Triggerrequest **

// Initializes transaction trigger click handlers
function triggertx() {
    $(document).on("click", ".currencylist li > .rq_icon", function() {
        triggertxfunction($(this));
        canceloptions();
    });
}

// Processes transaction initiation and validation
function triggertxfunction(trigger_elem) {
    const currency_code = trigger_elem.data("currency"),
        can_derive = derive_first_check(currency_code);
    if (can_derive === true) {
        triggertxfunction(trigger_elem);
        return
    }
    const use_random = cs_node(currency_code, "Use random address", true).selected,
        derives = check_derivations(currency_code),
        address_list = filter_addressli(currency_code, "checked", true),
        first_address = address_list.first(),
        manual_addresses = address_list.not(".seed"),
        address_count = manual_addresses.length,
        random_pool = (address_count > 1) ? manual_addresses : first_address,
        random_index = getrandomnumber(1, address_count) - 1,
        selected_address = (use_random === true) ? (first_address.hasClass("seed")) ? first_address : manual_addresses.eq(random_index) : first_address,
        address_data = selected_address.data(),
        wallet_address = address_data.address,
        request_title = trigger_elem.attr("title"),
        saved_url = trigger_elem.data("url"),
        seed_id = address_data.seedid;
    if (seed_id) {
        if (seed_id != glob_let.bipid) {
            if (addr_whitelist(wallet_address) === true) {} else {
                const dialog_data = {
                        "currency": currency_code,
                        "address": wallet_address,
                        "url": saved_url,
                        "title": request_title,
                        "seedid": seed_id
                    },
                    warning_content = get_address_warning("addresswarning", wallet_address, dialog_data);
                popdialog(warning_content, "triggersubmit");
                return false;
            }
        } else {
            if (bipv_pass() === false) {
                return false;
            }
        }
    }
    finishtxfunction(currency_code, wallet_address, saved_url, request_title)
}

// Handles seed confirmation dialog interactions
function confirm_missing_seed() {
    $(document).on("click", "#addresswarning .submit", function(event) {
        event.preventDefault();
        const warning_dialog = $("#addresswarning"),
            dialog_data = warning_dialog.data(),
            key_checkbox = warning_dialog.find("#pk_confirmwrap"),
            key_confirmed = key_checkbox.data("checked"),
            save_checkbox = warning_dialog.find("#dontshowwrap"),
            save_preference = save_checkbox.data("checked");
        if (key_confirmed !== true) {
            popnotify("error", translate("confirmpkownership"));
            return false
        }
        if (save_preference === true) { // whitlist seed id
            add_address_whitelist(dialog_data.address);
        }
        canceldialog();
        finishtxfunction(dialog_data.currency, dialog_data.address, dialog_data.url, dialog_data.title);
    })
}

// Generates seed warning dialog HTML with confirmation options
function get_address_warning(dialog_id, wallet_address, dialog_data) {
    const key_type = dialog_data.xpubid ? "Xpub" : "Seed",
        restore_link = (key_type === "Seed") ? (glob_let.hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + dialog_data.seedid + "'>" + translate("resoresecretphrase") + "</div>" : "",
        key_title = (key_type === "Seed") ? translate("bip39_passphrase") : key_type;
    return $("<div class='formbox addwarning' id='" + dialog_id + "'>\
        <h2 class='icon-warning'>" + translate("warning") + "</h2>\
        <div class='popnotify'></div>\
        <p><strong>" + translate("missingkeywarning", {
            "seedstrtitle": key_title,
            "address": wallet_address
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
                </div>" + restore_link +
        "</div>\
            <input type='submit' class='submit' value='" + translate("okbttn") + "'>\
        </form>\
    </div>").data(dialog_data);
}

// Completes transaction processing and URL generation
function finishtxfunction(currency_code, wallet_address, saved_url, display_title) {
    glob_let.prevkey = false;
    const url_params = geturlparameters();
    if (url_params.xss) {
        return
    }
    const coin_data = getcoindata(currency_code),
        settings = $("#currencysettings").data(),
        use_default = settings.default,
        currency_symbol = (use_default === true && glob_const.offline === false) ? settings.currencysymbol : coin_data.ccsymbol,
        current_page = url_params.p,
        page_prefix = current_page ? "?p=" + current_page + "&payment=" : "?payment=",
        url_base = page_prefix + currency_code + "&uoa=",
        new_url = url_base + currency_symbol + "&amount=0" + "&address=" + wallet_address,
        target_url = (!saved_url || glob_const.offline !== false) ? new_url : saved_url, //load saved url if exists
        title = display_title || "bitrequest";
    br_set_local("editurl", target_url); // to check if request is being edited
    remove_flip(); // reset request card facing front
    openpage(target_url, title, "payment");
}

// Removes saved URLs from currency list entries
function clear_savedurl() {
    $("#currencylist li > .rq_icon").removeData("url");
}

// Handles payment request initiation
function payrequest() {
    $(document).on("click", "#requestlist .req_actions .icon-qrcode, #requestlist .payrequest", function(event) {
        event.preventDefault();
        if (is_scanning()) return
        const request_btn = $(this);
        if (glob_const.offline === true && request_btn.hasClass("isfiat")) {
            // do not trigger fiat request when offline because of unknown exchange rate
            notify(translate("xratesx"));
            return
        }
        const request_item = request_btn.closest("li.rqli"),
            request_data = request_item.data(),
            layer2_network = request_data.eth_layer2; // detected l2
        let layer2_index = false;
        if (layer2_network) {
            layer2_index = get_network_index(layer2_network);
        }
        const payment_type = request_data.payment,
            unit = request_data.uoa,
            status = request_data.status,
            request_type = request_data.requesttype,
            total_amount = request_data.amount,
            received_amount = request_data.receivedamount,
            fiat_value = request_data.fiatvalue,
            is_crypto = request_data.iscrypto,
            is_insufficient = (status == "insufficient"),
            url_middle = request_btn.attr("data-rel"),
            url_suffix = "&status=" + status + "&type=" + request_type,
            amount_remaining = amountshort(total_amount, received_amount, fiat_value, is_crypto),
            payment_amount = (amount_remaining && is_insufficient === true) ? amount_remaining : total_amount,
            lightning_data = request_data.lightning,
            lightning_params = (lightning_data && lightning_data.invoice) ? "&d=" + btoa(JSON.stringify({
                "imp": lightning_data.imp,
                "proxy": lightning_data.proxy_host,
                "nid": lightning_data.nid,
                "lid": lightning_data.pid
            })) : (layer2_index !== false) ? "&d=" + btoa(JSON.stringify({
                "l2": [layer2_index]
            })) : "",
            payment_url = "?p=requests&payment=" + payment_type + "&uoa=" + unit + "&amount=" + payment_amount + url_middle + url_suffix + lightning_params;
        openpage(payment_url, "", "payment");
        return
    });
}

// ** UX **
// Toggles currency visibility and handles state updates
function togglecurrency() {
    $(document).on("click", ".togglecurrency", function() {
        const currency_item = $(this).closest("li"),
            currency_data = currency_item.data(),
            currency_code = currency_data.currency,
            is_enabled = currency_data.checked,
            home_item = get_homeli(currency_code);
        if (is_enabled === true) {
            currency_item.attr("data-checked", "false").data("checked", false);
            home_item.addClass("hide");
        } else {
            const stored_currency = br_get_local("cc_" + currency_code);
            if (stored_currency) {
                const address_list = get_addresslist(currency_code),
                    active_addresses = address_list.find("li[data-checked='true']").length;
                if (active_addresses === 0) {
                    address_list.find("li[data-checked='false']").first().find(".toggleaddress").trigger("click");
                } else {
                    currency_item.attr("data-checked", "true").data("checked", true);
                    home_item.removeClass("hide");
                }
            } else {
                addcurrency(currency_data);
            }
        }
        savecurrencies(false);
    });
}

// Controls address visibility and validation state
function toggleaddress() {
    $(document).on("click", ".toggleaddress", function() {
        const address_item = $(this).closest("li"),
            is_active = address_item.data("checked"),
            address_list = address_item.closest("ul.pobox"),
            active_count = address_list.find("li[data-checked='true']").length,
            currency_code = address_list.attr("data-currency");
        if (is_active === true || is_active === "true") {
            address_item.attr("data-checked", "false").data("checked", false);
        } else {
            const address_data = address_item.data();
            if (address_item.hasClass("seedu")) {
                const wallet_address = address_data.address,
                    seed_id = address_data.seedid;
                if (addr_whitelist(wallet_address) !== true) {
                    const dialog_data = {
                            "address": wallet_address,
                            "pli": address_item,
                            "seedid": seed_id
                        },
                        warning_content = get_address_warning("addresswarningcheck", wallet_address, dialog_data);
                    popdialog(warning_content, "triggersubmit");
                    return
                }
            } else if (address_item.hasClass("xpubu")) {
                const wallet_address = address_data.address;
                if (addr_whitelist(wallet_address) !== true) {
                    const has_pub_key = has_xpub(currency_code),
                        pub_key_id = address_data.xpubid;
                    if (has_pub_key === false || (has_pub_key && has_pub_key.key_id != pub_key_id)) {
                        const dialog_data = {
                                "address": wallet_address,
                                "pli": address_item,
                                "xpubid": pub_key_id
                            },
                            warning_content = get_address_warning("addresswarningcheck", wallet_address, dialog_data);
                        popdialog(warning_content, "triggersubmit");
                        return
                    }
                }
            }
            address_item.attr("data-checked", "true").data("checked", true);
        }
        saveaddresses(currency_code, false);
        check_currency(currency_code);
        clear_savedurl();
    });
}

// Handles seed confirmation dialog for address toggle actions
function confirm_missing_seed_toggle() {
    $(document).on("click", "#addresswarningcheck .submit", function(event) {
        event.preventDefault();
        const warning_dialog = $("#addresswarningcheck"),
            dialog_data = warning_dialog.data(),
            key_checkbox = warning_dialog.find("#pk_confirmwrap"),
            key_confirmed = key_checkbox.data("checked"),
            save_checkbox = warning_dialog.find("#dontshowwrap"),
            save_preference = save_checkbox.data("checked");
        if (key_confirmed !== true) {
            popnotify("error", translate("confirmpkownership"));
            return
        }
        if (save_preference === true) { // whitlist seed id
            add_address_whitelist(dialog_data.address);
        }
        canceldialog();
        cmst_callback(dialog_data.pli);
        return
    })
}

// Updates address state and UI after seed confirmation
function cmst_callback(address_item) {
    const address_list = address_item.closest("ul.pobox"),
        currency_code = address_list.attr("data-currency");
    address_item.attr("data-checked", "true").data("checked", true);
    check_currency(currency_code);
    saveaddresses(currency_code, false);
    clear_savedurl();
}

// Adds a new seed ID to localStorage whitelist
function add_seed_whitelist(seed_id) {
    const stored_whitelist = br_get_local("swl", true),
        seed_list = br_dobj(stored_whitelist);
    if (!seed_list.includes(seed_id)) {
        seed_list.push(seed_id);
    }
    br_set_local("swl", seed_list, true);
}

// Verifies if seed ID exists in whitelist
function seed_wl(seed_id) {
    const stored_whitelist = br_get_local("swl", true),
        seed_list = br_dobj(stored_whitelist);
    return seed_list.includes(seed_id);
}

// Adds new address to localStorage whitelist
function add_address_whitelist(wallet_address) {
    const stored_whitelist = br_get_local("awl", true),
        address_list = br_dobj(stored_whitelist);
    if (!address_list.includes(wallet_address)) {
        address_list.push(wallet_address);
    }
    br_set_local("awl", address_list, true);
}

// Verifies if address exists in whitelist
function addr_whitelist(wallet_address) {
    const stored_whitelist = br_get_local("awl", true),
        address_list = br_dobj(stored_whitelist);
    return address_list.includes(wallet_address);
}

// Manages checkbox state toggling in popup dialogs
function check_pk() {
    $(document).on("click", "#popup .cb_wrap", function() {
        const checkbox = $(this),
            is_checked = checkbox.data("checked");
        if (is_checked == true) {
            checkbox.attr("data-checked", "false").data("checked", false);
        } else {
            checkbox.attr("data-checked", "true").data("checked", true);
        }
    });
}

// Updates currency status based on active address count
function check_currency(currency_code) {
    const active_addresses = filter_addressli(currency_code, "checked", true).length;
    if (active_addresses > 0) {
        currency_check(currency_code);
        return
    }
    currency_uncheck(currency_code);
}

// Activates currency and updates associated UI elements
function currency_check(currency_code) {
    const home_item = get_homeli(currency_code),
        currency_item = get_currencyli(currency_code);
    home_item.removeClass("hide");
    currency_item.attr("data-checked", "true").data("checked", true);
    savecurrencies(false);
}

// Deactivates currency and updates associated UI elements  
function currency_uncheck(currency_code) {
    const home_item = get_homeli(currency_code),
        currency_item = get_currencyli(currency_code);
    home_item.addClass("hide");
    currency_item.attr("data-checked", "false").data("checked", false);
    savecurrencies(false);
}

// Manages global switch toggle states
function toggleswitch() {
    $(document).on("mousedown", ".switchpanel.global", function() {
        const toggle_switch = $(this);
        if (toggle_switch.hasClass("true")) {
            toggle_switch.removeClass("true").addClass("false");
        } else {
            toggle_switch.removeClass("false").addClass("true");
        }
    })
}

// ** Selectbox **
// Displays selectbox options dropdown
function showselect() {
    $(document).on("click", ".selectarrows", function() {
        const all_option_lists = $(".options"),
            option_list = $(this).next(".options");
        if (option_list.hasClass("single")) {
            const option_count = option_list.children("*").length;
            if (option_count < 2) {
                return
            }
        }
        if (option_list.hasClass("showoptions")) {
            all_option_lists.removeClass("showoptions");
        } else {
            all_option_lists.not(option_list).removeClass("showoptions");
            option_list.addClass("showoptions");
        }
    });
}

// Handles input interaction for selectbox elements
function selectbox() {
    $(document).on("click", ".selectbox > input:not([readonly])", function() {
        const select_input = $(this),
            current_value = select_input.val(),
            option_items = select_input.parent(".selectbox").find(".options span");
        if (option_items.hasClass("show")) {
            option_items.removeClass("show");
        } else {
            option_items.filter(function() {
                return $(this).text() !== current_value;
            }).addClass("show");
        }
    })
}

// Processes option selection in selectbox dropdown
function pickselect() {
    $(document).on("click", ".selectbox > .options span", function() {
        const selected_option = $(this),
            option_text = selected_option.text(),
            option_data = selected_option.data(),
            parent_box = selected_option.closest(".selectbox"),
            target_input = parent_box.children("input");
        target_input.val(option_text).data(option_data);
        parent_box.find(".options").removeClass("showoptions").children("span").removeClass("show");
    })
}

// Hides all open selectboxes in popup
function closeselectbox() {
    $("#popup .selectbox .options").removeClass("showoptions");
}

// Manages radio button selection behavior
function radio_select() {
    $(document).on("click", ".formbox .pick_conf", function() {
        const radio_elem = $(this),
            radio_btn = radio_elem.find(".radio");
        if (radio_btn.hasClass("icon-radio-unchecked")) {
            $(".formbox .conf_options .radio").not(radio_btn).removeClass("icon-radio-checked2").addClass("icon-radio-unchecked")
            radio_btn.removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
        } else {
            radio_btn.removeClass("icon-radio-checked2").addClass("icon-radio-unchecked");
        }
        const selected_text = radio_elem.children("span").text(),
            form_input = $(".formbox input:first").val(selected_text);
    })
}

// Controls expandable dialog drawer sections
function dialog_drawer() {
    $(document).on("click", "#ad_info_wrap .d_trigger", function() {
        const drawer_btn = $(this),
            drawer = drawer_btn.next(".drawer2");
        if (drawer.is(":visible")) {
            drawer.slideUp(200);
        } else {
            drawer.slideDown(200);
            $(".drawer2").not(drawer).slideUp(200);
        }
    })
}

// ** Reorder Adresses **

// Initializes drag functionality for address reordering
function dragstart() {
    $(document).on("mousedown touchstart", ".currentpage .applist li .popoptions", function(e) {
        e.preventDefault();
        const drag_handle = $(this),
            addr_list = drag_handle.closest(".applist").find("li");
        if (addr_list.length < 2) {
            return
        }
        const dragged_item = drag_handle.closest("li"),
            item_height = dragged_item.height(),
            start_y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
        drag(dragged_item, item_height, start_y, dragged_item.index());
    })
}

// Handles ongoing drag movement and position calculation
function drag(dragged_item, item_height, start_y, item_index) {
    $(document).on("mousemove touchmove", ".currentpage .applist li", function(e) {
        e.preventDefault();
        dragged_item.addClass("dragging");
        glob_const.html.addClass("dragmode");
        const current_y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY,
            offset_y = current_y - start_y;
        dragged_item.addClass("dragging").css({
            "-webkit-transform": "translate(0, " + offset_y + "px)"
        });
        $(".currentpage .applist li").not(dragged_item).each(function(i) {
            const list_item = $(this),
                item_top = list_item.offset().top,
                curr_height = list_item.height(),
                drop_point = item_top + (curr_height / 2),
                moving_up = i + 1 > item_index;
            if (moving_up === true) {
                if (current_y > drop_point) {
                    list_item.css({
                        "-webkit-transform": "translate(0, -" + item_height + "px)"
                    }).addClass("hovered")
                    dragged_item.addClass("after").removeClass("before");
                } else {
                    list_item.css({
                        "-webkit-transform": "translate(0, 0)"
                    }).removeClass("hovered")
                }
            } else {
                if (current_y < drop_point) {
                    list_item.css({
                        "-webkit-transform": "translate(0, " + item_height + "px)"
                    }).addClass("hovered")
                    dragged_item.addClass("before").removeClass("after");
                } else {
                    list_item.css({
                        "-webkit-transform": "translate(0, 0)"
                    }).removeClass("hovered")
                }
            }
        });
    })
}

// Finalizes drag and drop reordering of addresses
function dragend() {
    $(document).on("mouseup mouseleave touchend", ".currentpage .applist li", function() {
        $(document).off("mousemove touchmove", ".currentpage .applist li");
        const list_item = $(this).closest("li");
        if (list_item.hasClass("dragging")) {
            if (list_item.hasClass("before")) {
                list_item.insertBefore(".hovered:first");
                saveaddresses(geturlparameters().p, false);
            } else if (list_item.hasClass("after")) {
                list_item.insertAfter(".hovered:last");
                saveaddresses(geturlparameters().p, false);
            }
            list_item.removeClass("before after dragging").attr("style", "");
            $(".currentpage .applist li").removeClass("hovered").attr("style", "");
            glob_const.html.removeClass("dragmode");
            clear_savedurl();
        }
    })
}

// Manages keyboard input actions across app
function keyup() {
    $(document).keyup(function(e) {
        if (e.keyCode == 39) { // ArrowRight
            if (glob_const.body.hasClass("showstartpage")) {
                e.preventDefault();
                startnext($(".panelactive"));
                return
            }
            if (glob_const.paymentdialogbox.find("input").is(":focus")) {
                playsound(glob_const.funk);
                return
            }
            const time_passed = now() - glob_let.sa_timer;
            if (time_passed < 500) { // prevent clicking too fast
                playsound(glob_const.funk);
                return
            }
            glob_const.paymentpopup.removeClass("flipping");
            if (glob_const.paymentdialogbox.hasClass("flipped")) {
                flip_right2();
                setTimeout(function() {
                    glob_const.paymentpopup.addClass("flipping");
                    glob_const.paymentdialogbox.css("-webkit-transform", "");
                }, 400);
                return
            }
            if (glob_const.paymentdialogbox.hasClass("norequest") && (glob_const.paymentdialogbox.attr("data-pending") == "ispending" || (glob_const.offline === true))) {
                playsound(glob_const.funk);
                return
            }
            flip_right1();
            glob_let.sa_timer = now();
            return
        }
        if (e.keyCode == 37) { // ArrowLeft
            if (glob_const.body.hasClass("showstartpage")) {
                e.preventDefault();
                startprev($(".panelactive"));
                return
            }
            if (glob_const.paymentdialogbox.find("input").is(":focus")) {
                playsound(glob_const.funk);
                return
            }
            const time_passed = now() - glob_let.sa_timer;
            if (time_passed < 500) { // prevent clicking too fast
                playsound(glob_const.funk);
                return
            }
            glob_const.paymentpopup.removeClass("flipping");
            if (glob_const.paymentdialogbox.hasClass("flipped")) {
                flip_left2();
                return
            }
            if (glob_const.paymentdialogbox.hasClass("norequest") && (glob_const.paymentdialogbox.attr("data-pending") == "ispending" || (glob_const.offline === true))) {
                playsound(glob_const.funk);
                return
            }
            flip_left1();
            setTimeout(function() {
                glob_const.paymentpopup.addClass("flipping");
                glob_const.paymentdialogbox.css("-webkit-transform", "rotateY(180deg)");
            }, 400);
            glob_let.sa_timer = now();
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

// Handles escape key and back navigation actions
function escapeandback() {
    if (glob_const.inframe) {
        const url_params = geturlparameters();
        if (url_params.payment) {
            cpd_pollcheck();
            return
        }
        parent.postMessage("close_request", "*");
        return
    }
    if (glob_const.body.hasClass("showcam")) {
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
    if (glob_const.body.hasClass("seed_dialog")) {
        hide_seed_panel();
        return
    }
    if (glob_const.body.hasClass("showstartpage")) {
        startprev($(".panelactive"));
    }
    if (isopenrequest()) {
        if (glob_const.paymentdialogbox.hasClass("flipped") && glob_const.paymentdialogbox.hasClass("norequest")) {
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

// Closes payment dialog with optional post-scan actions
function close_paymentdialog(afterscan) {
    if (afterscan) {
        const api_settings = q_obj(request, "coinsettings.apis.selected");
        if (api_settings) {
            after_scan_init(api_settings);
            return
        }
    }
    if (glob_const.inframe) {
        parent.postMessage("close_request_confirm", "*");
        return
    }
    cancelpaymentdialog();
    continue_cpd();
}

// Handles post-payment dialog closing states
function continue_cpd() {
    if (glob_const.html.hasClass("firstload")) {
        const url_params = geturlparameters(),
            page_name = url_params.p,
            target_page = page_name || "home";
        openpage("?p=" + target_page, target_page, "loadpage");
        return
    }
    window.history.back();
}

// Initializes post-scan transaction verification
function after_scan_init(api_settings) {
    if (is_scanning()) return;
    glob_let.rpc_attempts = {};
    const request_init_time = request.rq_init,
        request_timestamp = request_init_time + glob_const.timezone,
        required_confirms = request.set_confirmations || 0,
        scan_params = { // request data object
            "request_timestamp": request_timestamp,
            "setconfirmations": required_confirms,
            "pending": "scanning",
            "erc20": request.erc20,
            "cachetime": 20,
            "source": "after_scan"
        };
    after_scan(request, api_settings, scan_params);
}

// Performs final transaction scan verification
function after_scan(request_data, api_settings, scan_params) {
    if (glob_const.inframe) {
        loader(true);
        loadertext(translate("lookuppayment", {
            "currency": request_data.payment,
            "blockexplorer": api_settings.name
        }));
    } else {
        hide_paymentdialog();
    }
    continue_select(request_data, api_settings, scan_params);
    socket_info(api_settings, true);
}

// Handles failed post-scan verification
function cancel_after_scan() {
    closeloader();
    if (glob_const.inframe) {
        parent.postMessage("close_request_confirm", "*");
        return
    }
    set_recent_requests();
    reset_paymentdialog();
    continue_cpd();
}

// Updates localStorage with recent payment request data
function set_recent_requests() {
    if (request) {
        const currency = request.payment,
            wallet_address = request.address,
            stored_requests = br_get_local("recent_requests", true),
            requests_array = br_dobj(stored_requests, true),
            payment_data = {
                "currency": currency,
                "cmcid": request.cmcid,
                "ccsymbol": request.currencysymbol,
                "address": wallet_address,
                "erc20": request.erc20,
                "rqtime": request.rq_init
            };
        requests_array[currency] = payment_data;
        br_set_local("recent_requests", requests_array, true);
    }
}

// Handles blockchain explorer URL click events with user confirmation
function check_recent() {
    $(document).on("click", ".check_recent", function(e) {
        e.preventDefault();
        const link_elem = $(this),
            explorer_url = link_elem.attr("href"),
            user_confirm = confirm(translate("openurl", {
                "url": explorer_url
            }));
        if (user_confirm) {
            canceldialog();
            close_paymentdialog();
            open_share_url("location", explorer_url);
        }
        return
    })
}

// Opens request history dialog when clicking history button
function request_history() {
    $(document).on("click", "#request_history", function() {
        const stored_requests = br_get_local("recent_requests", true);
        if (stored_requests) {
            recent_requests(stored_requests);
        }
    })
}

// Displays dialog with formatted list of recent payment requests
function recent_requests(recent_payments) {
    const history_list = recent_requests_list(recent_payments);
    if (history_list.length) {
        const dialog_content = "<div class='formbox'><h2 class='icon-history'>" + translate("recentrequests") + ":</h2><div id='ad_info_wrap'><ul>" + history_list + "</ul></div></div>";
        popdialog(dialog_content, "canceldialog");
    }
}

// Generates HTML list of recent payment requests with transaction info
function recent_requests_list(recent_payments) {
    let request_html = "";
    const payments_array = [];
    $.each(recent_payments, function(key, val) {
        if (val) {
            payments_array.push(val);
        }
    });
    const sorted_payments = payments_array.sort(function(x, y) {
        return y.rqtime - x.rqtime;
    });
    $.each(sorted_payments, function(i, payment) {
        if (payment) {
            const currency = payment.currency,
                coin_symbol = payment.ccsymbol,
                wallet_addr = payment.address,
                coin_id = payment.cmcid,
                is_erc20 = payment.erc20,
                request_time = payment.rqtime,
                tx_source = payment.source,
                eth_layer = payment.eth_layer2,
                explorer_url = blockexplorer_url(currency, false, is_erc20, tx_source, eth_layer) + wallet_addr;
            request_html += "<li class='rp_li'>" + getcc_icon(coin_id, coin_symbol + "-" + currency, is_erc20) + "<strong style='opacity:0.5'>" + short_date(request_time + glob_const.timezone) + "</strong><br/>\
            <a href='" + explorer_url + "' target='_blank' class='ref check_recent'>\
            <span class='select'>" + wallet_addr + "</span> <span class='icon-new-tab'></a></li>";
        }
    });
    return request_html;
}

// Shows notification popup with optional duration and button style
function notify(message, display_time = 4000, button_style = "no") {
    const notify_elem = $("#notify");
    $("#notifysign").html(message + "<span class='icon-cross'></div>").attr("class", "button" + button_style);
    notify_elem.addClass("popupn");
    const timeout = setTimeout(function() {
        closenotify();
    }, display_time, function() {
        clearTimeout(timeout);
    });
}

// Closes notification when clicking X icon
function closenotifytrigger() {
    $(document).on("click", "#notify .icon-cross", function() {
        closenotify()
    });
}

// Hides active notification
function closenotify() {
    $("#notify").removeClass("popupn");
}

// Shows temporary notification at top of screen
function topnotify(message) {
    const top_notify = $("#topnotify");
    top_notify.text(message).addClass("slidedown");
    const timeout = setTimeout(function() {
        top_notify.removeClass("slidedown");
    }, 7000, function() {
        clearTimeout(timeout);
    });
}

// Displays styled notification in dialog boxes
function popnotify(result, message) { // notifications in dialogs
    const notify_box = $(".popnotify");
    if (result == "error") {
        notify_box.removeClass("success warning").addClass("error");
    } else if (result == "warning") {
        notify_box.removeClass("success error").addClass("warning");
    } else {
        notify_box.addClass("success").removeClass("error warning");
    }
    notify_box.slideDown(200).html(message);
    const timeout = setTimeout(function() {
        notify_box.slideUp(200);
    }, 6000, function() {
        clearTimeout(timeout);
    });
}

// Creates modal dialog with custom content and actions
function popdialog(content, callback_name, trigger_elem, is_custom, should_replace) {
    if (is_custom) {
        $("#popup #actions").addClass("custom");
    }
    if (should_replace) {
        $("#dialogbody").html(content);
    } else {
        $("#dialogbody").append(content);
    }
    glob_const.body.addClass("blurmain");
    $("#popup").addClass("active showpu");
    const dialog_trigger = trigger_elem || $("#popup #execute");
    if (callback_name) {
        execute(dialog_trigger, callback_name);
    }
    if (!glob_const.supportsTouch) {
        $("#dialogbody input:first").focus();
    }
}

// Binds function to dialog execution button
function execute(trigger_elem, callback_name) {
    $(document).on("click", "#execute", function(e) {
        e.preventDefault();
        window[callback_name](trigger_elem);
    })
}

// Initializes currency addition click handler
function addcurrencytrigger() {
    $(document).on("click", ".addcurrency", function() {
        addcurrency($(this).closest("li").data());
    })
}

// Handles adding currency or deriving address
function addcurrency(coin_data) {
    const currency = coin_data.currency;
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
    addaddress(coin_data, false);
}

// Checks for possible address derivation and executes if valid
function derive_first_check(currency) {
    if (hasbip32(currency) === true) {
        const derivation_types = check_derivations(currency);
        if (derivation_types) {
            const has_active_derives = active_derives(currency, derivation_types);
            if (has_active_derives === false) {
                return derive_addone(currency);
            }
        }
    }
    return false;
}

// Initializes address addition click handler
function addaddresstrigger() {
    $(document).on("click", ".addaddress", function() {
        addaddress($("#" + $(this).attr("data-currency")).data(), false);
    })
}

// Manages address addition/editing workflow
function addaddress(addr_data, is_edit) {
    const currency = addr_data.currency,
        currency_pair_id = addr_data.ccsymbol + "-" + currency,
        wallet_address = addr_data.address || "",
        addr_label = addr_data.label || "",
        input_readonly = (is_edit === true) ? " readonly" : "",
        no_pubkey = glob_let.test_derive === false || (is_xpub(currency) === false || has_xpub(currency) !== false),
        wallet_prompt = "<span id='get_wallet' class='address_option' data-currency='" + currency + "'>" + translate("noaddressyet", {
            "currency": currency
        }) + "</span>",
        seed_prompt = "<span id='option_makeseed' class='address_option' data-currency='" + currency + "'>" + translate("generatewallet") + "</span>",
        addr_options = glob_let.hasbip ? wallet_prompt : (glob_let.test_derive && bip39_const.c_derive[currency]) ? (hasbip32(currency) === true ? seed_prompt : wallet_prompt) : wallet_prompt,
        notify_html = glob_const.body.hasClass("showstartpage") ? "<div class='popnotify' style='display:block'>" + addr_options + "</div>" : "<div class='popnotify'></div>",
        scan_btn = glob_let.hascam && !is_edit ? "<div class='qrscanner' data-currency='" + currency + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        dialog_title = is_edit ? "<h2 class='icon-pencil'>" + translate("editlabel") + "</h2>" : "<h2>" + getcc_icon(addr_data.cmcid, currency_pair_id, addr_data.erc20) + " " + translate("addcoinaddress", {
            "currency": currency
        }) + "</h2>",
        privkey_confirm = is_edit ? "" : "<div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("pkownership") + "</span></div>",
        form_mode_class = is_edit ? "edit" : "add",
        pubkey_class = no_pubkey ? " hasxpub" : " noxpub",
        addr_placeholder = no_pubkey ? translate("entercoinaddress", {
            "currency": currency
        }) : translate("nopub"),
        viewkey_val = addr_data.vk || "",
        has_viewkey = (viewkey_val !== ""),
        viewkey_scan = glob_let.hascam ? "<div class='qrscanner' data-currency='" + currency + "' data-id='viewkey' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        viewkey_input = (currency == "monero") ? has_viewkey ? "" : "<div class='inputwrap'><input type='text' class='vk_input' value='" + viewkey_val + "' placeholder='" + translate("secretviewkey") + "'>" + viewkey_scan + "</div>" : "",
        form_content = $("<div class='formbox form" + form_mode_class + pubkey_class + "' id='addressformbox'>" + dialog_title + notify_html + "<form id='addressform' class='popform'><div class='inputwrap'><input type='text' id='address_xpub_input' class='address' value='" + wallet_address + "' data-currency='" + currency + "' placeholder='" + addr_placeholder + "'" + input_readonly + ">" + scan_btn + "</div>" + viewkey_input + "<input type='text' class='addresslabel' value='" + addr_label + "' placeholder='" + translate("label") + "'>\
        <div id='ad_info_wrap' style='display:none'>\
            <ul class='td_box'>\
            </ul>\
            <div id='pk_confirm' class='noselect'>\
                <div id='matchwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("xpubmatch", {
                "currency": currency
            }) + "</span>\
            </div>\
        </div>" + privkey_confirm +
            "<input type='submit' class='submit' value='" + translate("okbttn") + "'></form>").data(addr_data);
    popdialog(form_content, "triggersubmit");
    if (glob_const.supportsTouch) {
        return
    }
    if (is_edit) {
        $("#popup input.addresslabel").focus().select();
        return
    }
    $("#popup input.address").focus();
}

// Validates input for xpub addresses
function address_xpub_change() {
    $(document).on("input", "#addressformbox.noxpub #address_xpub_input", function(e) {
        const input_field = $(this),
            xpub_value = input_field.val();
        if (xpub_value.length > 103) {
            const currency = input_field.attr("data-currency"),
                is_valid = check_xpub(xpub_value, xpub_prefix(currency), currency);
            if (is_valid === true) {
                clear_xpub_checkboxes();
                validate_xpub(input_field.closest("#addressformbox"));
                return
            }
            xpub_fail(currency);
            return
        }
        clear_xpub_inputs();
    })
}

// Checks for active derived addresses
function active_derives(currency, derive_type) {
    const addr_items = get_addresslist(currency).children("li");
    if (addr_items.length < 1) {
        return false;
    }
    const coin_settings = activecoinsettings(currency);
    if (coin_settings) {
        const reuse_setting = coin_settings["Reuse address"];
        if (reuse_setting) {
            if (reuse_setting.selected === true) {
                return true;
            }
        } else {
            return true;
        }
    }
    if (derive_type === "seed") {
        const active_seed_addrs = filter_list(addr_items, "seedid", glob_let.bipid).not(".used");
        if (active_seed_addrs.length) {
            const has_pending = ch_pending(active_seed_addrs.first().data());
            if (has_pending === true) {
                return false;
            }
        } else {
            return false;
        }
    }
    if (derive_type === "xpub") {
        const active_pubkey = active_xpub(currency),
            xpub_id = active_pubkey.key_id,
            active_xpub_addrs = filter_list(addr_items, "xpubid", xpub_id).not(".used");
        if (active_xpub_addrs.length) {
            const has_pending = ch_pending(active_xpub_addrs.first().data());
            if (has_pending === true) {
                return false;
            }
        } else {
            return false;
        }
    }
    return true
}

// Opens wallet download dialog
function get_wallet() {
    $(document).on("click", "#get_wallet", function() {
        const currency_code = $(this).attr("data-currency");
        canceldialog();
        setTimeout(function() {
            download_wallet(currency_code);
        }, 800);
    })
}

// Handles address form submission
function submitaddresstrigger() {
    $(document).on("click", "#addressformbox input.submit", function(e) {
        e.preventDefault();
        const form_elem = $(this).closest("#addressformbox");
        if (form_elem.hasClass("hasxpub")) {
            validateaddress_vk(form_elem.data());
            return
        }
        const addr_input = form_elem.find(".address"),
            addr_value = addr_input.val();
        if (addr_value.length > 103) {
            validate_xpub(form_elem);
            return
        }
        validateaddress_vk(form_elem.data());
        return
    })
}

// Opens Lightning node connection dialog
function add_lightning() {
    $(document).on("click", "#connectln", function() {
        lm_function();
        return
    })
}

// Opens ERC20 token addition dialog
function add_erc20() {
    $(document).on("click", "#add_erc20, #choose_erc20", function() {
        const token_registry = fetch_cached_erc20();
        let token_options = "";
        $.each(token_registry, function(key, token) {
            token_options += "<span data-id='" + token.cmcid + "' data-currency='" + token.name + "' data-ccsymbol='" + token.symbol.toLowerCase() + "' data-contract='" + token.contract + "' data-pe='none'>" + token.symbol + " | " + token.name + "</span>";
        });
        const form_data = {
                "erc20": true,
                "monitored": true,
                "checked": true
            },
            checked_eth_addresses = filter_addressli("ethereum", "checked", true),
            first_eth_address = checked_eth_addresses[0],
            eth_addr_data = first_eth_address ? $(first_eth_address).data() : false,
            eth_addr_value = eth_addr_data ? eth_addr_data.address : "",
            eth_label_value = eth_addr_data ? eth_addr_data.label : "",
            scan_button = glob_let.hascam ? "<div class='qrscanner' data-currency='ethereum' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
            dialog_content = $("\
            <div class='formbox' id='erc20formbox'>\
                <h2 class='icon-coin-dollar'>" + translate("adderc20token") + "</h2>\
                <div class='popnotify'></div>\
                <form id='addressform' class='popform'>\
                    <div class='selectbox'>\
                        <input type='text' value='' placeholder='" + translate("erc20placeholder") + "' id='ac_input'/>\
                        <div class='selectarrows icon-menu2' data-pe='none'></div>\
                        <div id='ac_options' class='options'>" + token_options + "</div>\
                    </div>\
                    <div id='erc20_inputs'>\
                    <div class='inputwrap'><input type='text' class='address' value='" + eth_addr_value + "' placeholder='" + translate("enteraddress") + "'/>" + scan_button + "</div>\
                    <input type='text' class='addresslabel' value='" + eth_label_value + "' placeholder='" + translate("label") + "'/>\
                    <div id='pk_confirm' class='noselect'>\
                        <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'>\
                            <span class='checkbox'></span>\
                        </div>\
                        <span>" + translate("pkownership") + "</span>\
                    </div></div>\
                    <input type='submit' class='submit' value='" + translate("okbttn") + "'/>\
                </form></div>").data(form_data);
        popdialog(dialog_content, "triggersubmit");
    })
}

// Handles ERC20 token search autocomplete
function autocomplete_erc20token() {
    $(document).on("input", "#ac_input", function() {
        const search_input = $(this),
            token_form = search_input.closest("form"),
            search_term = search_input.val().toLowerCase(),
            token_options = token_form.find(".options");
        token_form.removeClass("validated");
        $("#ac_options > span").each(function() {
            const token_option = $(this),
                option_text = token_option.text(),
                token_name = token_option.attr("data-currency"),
                token_symbol = token_option.attr("data-ccsymbol"),
                contract_addr = token_option.attr("data-contract"),
                token_id = token_option.attr("data-id");
            token_option.removeClass("show");
            if (search_term.length > 2 && (token_symbol === search_term || token_name === search_term)) {
                token_form.addClass("validated");
                const token_data = {
                    "cmcid": token_id,
                    "currency": token_name,
                    "ccsymbol": token_symbol,
                    "contract": contract_addr
                }
                search_input.val(option_text)[0].setSelectionRange(0, 999);
                initaddressform(token_data);
            } else if (token_symbol.match("^" + search_term) || token_name.match("^" + search_term)) {
                token_option.addClass("show");
            }
        });
    })
}

// Handles the selection of an ERC20 token from the dropdown
function pickerc20select() {
    $(document).on("click", "#erc20formbox .selectbox > #ac_options span", function() {
        const selected_token = $(this),
            token_data = {
                "cmcid": selected_token.attr("data-id"),
                "currency": selected_token.attr("data-currency"),
                "ccsymbol": selected_token.attr("data-ccsymbol"),
                "contract": selected_token.attr("data-contract")
            };
        initaddressform(token_data);
    })
}

// Sets up address form for selected ERC20 token
function initaddressform(token_data) {
    const form_container = $("#erc20formbox"),
        input_section = form_container.find("#erc20_inputs"),
        addr_field = form_container.find("input.address"),
        label_field = form_container.find("input.addresslabel");
    addr_field.add(label_field);
    form_container.data(token_data);
    addr_field.attr("placeholder", translate("entercoinaddress", {
        "currency": token_data.currency
    }));
    if (!input_section.is(":visible")) {
        input_section.slideDown(300);
        addr_field.focus();
    }
}

// Processes ERC20 token form submission
function submit_erc20() {
    $(document).on("click", "#erc20formbox input.submit", function(e) {
        e.preventDefault();
        validateaddress_vk($("#erc20formbox").data());
    });
}

// Validates the address and view key (if applicable) for the selected currency
function validateaddress_vk(addr_data) {
    const currency = addr_data.currency,
        addr_field = $("#addressform .address"),
        addr_value = addr_field.val();
    if (!addr_value) {
        const error_msg = translate("entercoinaddress", {
            "currency": currency
        });
        popnotify("error", error_msg);
        addr_field.focus();
        return
    }
    if (currency) {
        const viewkey_field = $("#addressform .vk_input"),
            viewkey_value = (currency === "monero" && viewkey_field.length) ? viewkey_field.val() : 0,
            viewkey_length = viewkey_value.length;
        if (viewkey_length) {
            if (viewkey_length !== 64) {
                popnotify("error", translate("invalidvk"));
                return
            }
            if (!check_vk(viewkey_value)) {
                popnotify("error", translate("invalidvk"));
                return
            }
            const is_valid = check_address(addr_value, currency);
            if (!is_valid === true) {
                const error_msg = addr_value + " " + translate("novalidaddress", {
                    "currency": currency
                });
                popnotify("error", error_msg);
                return
            }
            const api_payload = {
                "address": addr_value,
                "view_key": viewkey_value,
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
                    "data": JSON.stringify(api_payload),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(response) {
                const api_data = br_result(response).result,
                    api_error = api_data.Error;
                if (api_error) {
                    const error_msg = api_error || translate("invalidvk");
                    popnotify("error", error_msg);
                    return
                }
                const sync_height = api_data.start_height;
                if (sync_height > -1) { // success!
                    set_xmr_node_access(viewkey_value);
                    validateaddress(addr_data, viewkey_value);
                }
            }).fail(function(xhr, stat, err) {
                popnotify("error", translate("errorvk"));
            });
            return
        }
        validateaddress(addr_data, false);
        return
    }
    popnotify("error", translate("pickacurrency"));
}

// Stores Monero view key in session storage
function set_xmr_node_access(view_key) {
    const stored_keys = br_get_session("xmrvks", true);
    if (stored_keys) {
        stored_keys.push(view_key);
        br_set_session("xmrvks", stored_keys, true);
        return
    }
    br_set_session("xmrvks", [view_key], true);
}

// Validates the address for the selected currency and handles the addition or editing of the address
function validateaddress(addr_data, view_key) {
    const currency = addr_data.currency,
        is_erc20 = addr_data.erc20 === true,
        currency_type = is_erc20 ? "ethereum" : currency,
        token_symbol = addr_data.ccsymbol,
        addr_field = $("#addressform .address"),
        addr_input = addr_field.val(),
        clean_addr = currency === "nimiq" ? addr_input.replace(/\s/g, "") : addr_input,
        addr_list = get_addresslist(currency),
        next_index = addr_list.children("li").length + 1,
        index = next_index > 1 ? next_index : 1,
        label_field = $("#addressform .addresslabel"),
        label_input = label_field.val(),
        clean_label = label_input || "";
    if (!clean_addr) {
        popnotify("error", translate("entercoinaddress", {
            "currency": currency
        }));
        addr_field.focus();
        return
    }
    const parsed_addr = currency === "bitcoin-cash" && clean_addr.includes(":") ? clean_addr.split(":").pop() : clean_addr,
        is_duplicate = filter_addressli(currency, "address", parsed_addr).length > 0,
        curr_addr = addr_data.address,
        curr_label = addr_data.label;
    if (is_duplicate && curr_addr !== parsed_addr) {
        popnotify("error", translate("alreadyexists"));
        addr_field.select();
        return
    }
    if (parsed_addr == glob_let.new_address) { // prevent double address entries
        console.log("already added");
        return
    }
    const is_valid = check_address(parsed_addr, currency_type);
    if (!is_valid) {
        popnotify("error", parsed_addr + " " + translate("novalidaddress", {
            "currency": currency
        }));
        setTimeout(function() {
            addr_field.select();
        }, 10);
        return
    }
    const is_label_addr = check_address(clean_label, currency_type);
    if (is_label_addr === true) {
        popnotify("error", translate("invalidlabel"));
        label_field.val(curr_label).select();
        return
    }
    if ($("#addressformbox").hasClass("formedit")) {
        const curr_item = addr_list.children("li[data-address='" + curr_addr + "']"),
            edit_data = {
                "label": clean_label
            };
        if (view_key) {
            edit_data.vk = view_key;
        }
        curr_item.data(edit_data).attr("data-address", parsed_addr);
        curr_item.find(".atext h2 > span").text(clean_label);
        curr_item.find(".atext p.address").text(parsed_addr);
        saveaddresses(currency, true);
        canceldialog();
        canceloptions();
        return
    }
    const key_checkbox = $("#pk_confirmwrap"),
        key_confirmed = key_checkbox.data("checked");
    if (!key_confirmed) {
        popnotify("error", translate("confirmpkownership"));
        return
    }
    if (index === 1) {
        if (is_erc20 === true) {
            buildpage(addr_data, true);
            append_coinsetting(currency, compress_l2obj2(currency, token_symbol));
            save_cc_settings(currency);
        }
        if (glob_const.body.hasClass("showstartpage")) {
            const account_name = $("#eninput").val();
            $("#accountsettings").data("selected", account_name).find("p").text(account_name);
            savesettings();
            const page_url = "?p=home&payment=" + currency + "&uoa=" + token_symbol + "&amount=0" + "&address=" + parsed_addr;
            br_set_local("editurl", page_url); // to check if request is being edited
            openpage(page_url, "create " + currency + " request", "payment");
            glob_const.body.removeClass("showstartpage");
        } else {
            loadpage("?p=" + currency);
        }
    }
    glob_let.new_address = parsed_addr + currency;
    addr_data.address = parsed_addr,
        addr_data.label = clean_label,
        addr_data.a_id = token_symbol + index,
        addr_data.vk = view_key,
        addr_data.checked = true;
    appendaddress(currency, addr_data);
    saveaddresses(currency, true);
    currency_check(currency);
    canceldialog();
    canceloptions();
    clear_savedurl();
}

// Validates address format against currency regex
function check_address(address, currency) {
    const regex = getcoindata(currency).regex;
    return regex ? new RegExp(regex).test(address) : false;
}

// Validates view key format
function check_vk(view_key) {
    return new RegExp("^[a-fA-F0-9]+$").test(view_key);
}

// Handles send button clicks and BIP39 compatibility checks
function send_trigger() {
    $(document).on("click", ".send", function() {
        if (glob_let.hasbip === true) {
            compatible_wallets($(this).attr("data-currency"));
            return
        }
        playsound(glob_const.funk);
    })
}

// Opens BIP39 information panel
function showbip39_trigger() {
    $(document).on("click", ".show_bip39", function() {
        all_pinpanel({
            "func": manage_bip32
        });
        canceldialog();
    })
}

// Initializes click handler for dialog cancellation
function canceldialog_click() {
    $(document).on("click", ".cancel_dialog", canceldialog);
}

// Sets up dialog closing event listeners  
function canceldialogtrigger() {
    $(document).on("click", "#popup", function(event) {
        const target = event.target,
            jtarget = $(target),
            target_id = jtarget.attr("id"),
            options = $("#dialog").find(".options");
        if (options.length > 0 && options.hasClass("showoptions")) {
            const pointer_event = jtarget.attr("data-pe");
            if (pointer_event !== "none") {
                options.removeClass("showoptions");
            }
            return
        }
        if (target == this || target_id === "canceldialog") {
            canceldialog();
        }
    });
}

// Closes active dialog and resets state
function canceldialog(bypass) {
    if (glob_const.inframe) {
        if (bypass !== true) {
            if ($("#contactformbox").length > 0) {
                return
            }
        }
    }
    const popup = $("#popup");
    glob_const.body.removeClass("blurmain themepu");
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
}

// Prevents dialog close when inputs are focused
function blockcancelpaymentdialog() {
    $(document).on("mousedown", "#payment", function(event) {
        glob_let.blockswipe = false;
        if (event.target === this) {
            const focused_inputs = glob_const.paymentdialogbox.find("input");
            if (focused_inputs.is(":focus")) {
                glob_let.blockswipe = true;
            }
        }
    })
}

// Handles payment dialog cancellation
function cancelpaymentdialogtrigger() {
    $(document).on("mouseup", "#payment", function(event) {
        if (glob_let.blockswipe === true) {
            unfocus_inputs();
            return
        }
        if (glob_const.html.hasClass("flipmode")) { // prevent closing request when flipping
            return
        }
        const time_elapsed = now() - glob_let.cp_timer;
        if (time_elapsed < 1500) { // prevent clicking too fast
            playsound(glob_const.funk);
            console.log("clicking too fast");
            return
        }
        if (event.target === this) {
            escapeandback();
            glob_let.cp_timer = now();
        }
    });
}

// Removes focus from all input fields
function unfocus_inputs() {
    glob_const.paymentdialogbox.find("input").blur();
}

// Validates polling conditions before closing payment dialog
function cpd_pollcheck() {
    if (q_obj(request, "received") !== true) {
        const request_timer = request.rq_timer,
            request_time = now() - request_timer;
        if (request_time > glob_const.after_scan_timeout) {
            if (empty_obj(glob_let.sockets)) { // No afterscan when polling
                close_paymentdialog();
                return
            }
            close_paymentdialog(true);
            return
        }
    }
    close_paymentdialog();
}

// Cancels payment dialog and resets states
function cancelpaymentdialog() {
    if (glob_const.html.hasClass("hide_app")) {
        closeloader();
        parent.postMessage("close_request", "*");
        return
    }
    hide_paymentdialog();
    reset_paymentdialog();
}

// Hides payment dialog UI
function hide_paymentdialog() {
    glob_const.paymentpopup.removeClass("active live");
    glob_const.html.removeClass("blurmain_payment");
}

// Resets payment dialog state and cleans up resources
function reset_paymentdialog() {
    const dialog_timeout = setTimeout(function() {
        glob_const.paymentpopup.removeClass("showpu outgoing");
        glob_const.html.removeClass("paymode firstload");
        $(".showmain #mainwrap").css("-webkit-transform", "translate(0, 0)"); // restore fake scroll position
        $(".showmain").closest(document).scrollTop(glob_let.scrollposition); // restore real scroll position
        remove_flip(); // reset request facing front
        glob_const.paymentdialogbox.html(""); // remove html
        clearTimeout(dialog_timeout);
    }, 600);
    closeloader();
    clearTimeout(glob_let.request_timer);
    clearpinging();
    closenotify();
    sleep();
    abort_ndef();
    clear_tpto();
    glob_let.lnd_ph = false,
        request = null,
        helper = null,
        glob_let.l2s = {},
        glob_let.apikey_fails = false;
    reset_overflow(); // reset overflow limits
    const socket_timeout = setTimeout(function() {
        closesocket();
    }, 500, function() {
        clearTimeout(socket_timeout);
    });
}

// Forces WebSocket connection closure
function forceclosesocket(socket_id) {
    console.log("force close");
    clearpinging(socket_id);
    closesocket(socket_id);
}

// Initializes share dialog cancellation handler
function cancelsharedialogtrigger() {
    $(document).on("click", "#sharepopup", function(event) {
        if (event.target === this) {
            cancelsharedialog();
        }
    });
}

// Closes share dialog and resets UI
function cancelsharedialog() {
    const share_popup = $("#sharepopup");
    share_popup.removeClass("active");
    glob_const.body.removeClass("sharemode");
    const dialog_timeout = setTimeout(function() {
        share_popup.removeClass("showpu");
    }, 500, function() {
        clearTimeout(dialog_timeout);
    });
}

// Sets up event listener for showing options
function showoptionstrigger() {
    $(document).on("click", ".popoptions", function(event) {
        const addr_data = $(this).closest("li").data(),
            address = addr_data.address;
        if (address === "lnurl") {
            playsound(glob_const.funk);
            return
        }
        const saved_request = $("#requestlist li[data-address='" + address + "']"),
            show_requests = (saved_request.length > 0) ? "<li><div class='showrequests'><span class='icon-qrcode'></span> " + translate("showrequests") + "</div></li>" : "",
            new_request = (addr_data.checked === true) ? "<li>\
                <div data-rel='' class='newrequest' title='create request'>\
                    <span class='icon-plus'></span>" + translate("newrequest") + "</div>\
            </li>" : "",
            options_content = $("\
                <ul id='optionslist''>" + new_request + show_requests +
                "<li><div class='address_info'><span class='icon-info'></span> " + translate("addressinfo") + "</div></li>\
                    <li><div class='editaddress'> <span class='icon-pencil'></span> " + translate("editlabel") + "</div></li>\
                    <li><div class='removeaddress'><span class='icon-bin'></span> " + translate("removeaddress") + "</div></li>\
                    <li><div id='rpayments'><span class='icon-history'></span> " + translate("recentpayments") + "</div></li>\
                </ul>").data(addr_data);
        showoptions(options_content);
        return
    });
}

// Shows options panel with optional class
function showoptions(content, add_class) {
    if (add_class && add_class.includes("pin")) {
        const pin_settings = $("#pinsettings").data(),
            pin_timeout = pin_settings.timeout;
        if (pin_timeout) {
            if (now() > pin_timeout) {
                pin_settings.timeout = null;
                savesettings();
            } else {
                lockscreen(pin_timeout);
                return false;
            }
        }
    }
    const extra_class = add_class ? " " + add_class : "";
    $("#optionspop").addClass("showpu active" + extra_class);
    $("#optionsbox").html(content);
    glob_const.body.addClass("blurmain_options");
}

// Displays lock screen with countdown
function lockscreen(timeout) {
    const time_left = timeout - now(),
        countdown_data = countdown(time_left),
        days_str = (countdown_data.days) ? countdown_data.days + " " + translate("days") + "<br/>" : "",
        hours_str = (countdown_data.hours) ? countdown_data.hours + " " + translate("hours") + "<br/>" : "",
        mins_str = (countdown_data.minutes) ? countdown_data.minutes + " " + translate("minutes") + "<br/>" : "",
        secs_str = (countdown_data.seconds) ? countdown_data.seconds + " " + translate("seconds") : "",
        countdown_text = days_str + hours_str + mins_str + secs_str,
        unlock_attempts = $("#pinsettings").data("attempts"),
        has_seed = (glob_let.hasbip || glob_let.cashier_seedid) ? true : false,
        unlock_seed_btn = (has_seed === true && unlock_attempts > 5) ? "<p id='seed_unlock'>" + translate("unlockwithsecretphrase") + "</p>" : "",
        lock_content = "<h1 id='lock_heading'>Bitrequest</h1><div id='lockscreen'><h2><span class='icon-lock'></span></h2><p class='tmua'>" + translate("tomanyunlocks") + "</p>\
        <p><br/>" + translate("tryagainin") + "<br/>" + countdown_text + "</p>" + unlock_seed_btn +
        "<div id='phrasewrap'>\
            <p><br/>" + translate("enter12words") + "</p>\
                <div id='bip39phrase' contenteditable='contenteditable' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' lang='en' class='noselect'></div>\
                <div id='phrase_login' class='button'>Unlock</div>\
            </div>\
        </div>";
    $("#optionspop").addClass("showpu active pin ontop");
    $("#optionsbox").html(lock_content);
    glob_const.body.addClass("blurmain_options");
}

// Handles seed unlock button click
function seed_unlock_trigger() {
    $(document).on("click", "#lockscreen #seed_unlock", function() {
        $("#lockscreen #phrasewrap").addClass("showph");
    });
}

// Validates recovery phrase login
function phrase_login() {
    $(document).on("click", "#phrase_login", function() {
        const phrase_input = $("#lockscreen #bip39phrase"),
            phrase_text = phrase_input.text(),
            seed_data = ls_phrase_obj(),
            saved_seed = seed_data.pid,
            current_seed = get_seedid(phrase_text.split(" "));
        if (current_seed === saved_seed || current_seed === glob_let.cashier_seedid) {
            clearpinlock();
            if (!glob_const.html.hasClass("loaded")) {
                finishfunctions();
            }
            const pin_content = pinpanel(" reset");
            showoptions(pin_content, "pin");
            $("#pinfloat").removeClass("p_admin");
            remove_cashier();
        } else {
            shake(phrase_input);
        }
    });
}

// Removes cashier role data and flags
function remove_cashier() {
    if (glob_let.is_cashier) {
        br_remove_local("cashier");
        glob_let.cashier_dat = false,
            glob_let.is_cashier = false,
            glob_let.cashier_seedid = false;
    }
}

// Creates new request using alias
function newrequest_alias() {
    $(document).on("click", "#newrequest_alias", function() {
        if (is_scanning()) return
        const currency_list = $("#currencylist"),
            active_coins = currency_list.find("li").not(".hide"),
            active_count = active_coins.length;
        if (active_count === 0) {
            notify(translate("noactivecurrencies"));
            return
        }
        if (active_count > 1) {
            const list_content = "<ul id='alias_currencylist' class='currencylist'>" + currency_list.html() + "</ul>";
            showoptions(list_content);
            return
        }
        const coin_trigger = active_coins.find(".rq_icon").first();
        triggertxfunction(coin_trigger);
    });
}

// Handles new request creation
function newrequest() {
    $(document).on("click", ".newrequest", function() {
        const request_btn = $(this),
            addr_data = request_btn.closest("#optionslist").data(),
            currency = addr_data.currency,
            address = addr_data.address,
            token_symbol = addr_data.ccsymbol,
            btn_title = request_btn.attr("title"),
            seed_id = addr_data.seedid;
        if (seed_id) {
            if (seed_id !== glob_let.bipid) {
                if (addr_whitelist(address) !== true) {
                    const warning_data = {
                            "currency": currency,
                            "address": address,
                            "ccsymbol": token_symbol,
                            "title": btn_title,
                            "seedid": seed_id
                        },
                        warning_content = get_address_warning("address_newrequest", address, warning_data);
                    popdialog(warning_content, "triggersubmit");
                    return
                }
            } else if (bipv_pass() === false) {
                canceloptions();
                return
            }
        }
        canceloptions();
        finishtxfunction(currency, address, null, btn_title);
    });
}

// Confirms new request with seed validation
function confirm_ms_newrequest() {
    $(document).on("click", "#address_newrequest .submit", function(event) {
        event.preventDefault();
        const dialog_el = $("#address_newrequest"),
            dialog_data = dialog_el.data(),
            key_checkbox = dialog_el.find("#pk_confirmwrap"),
            key_confirmed = key_checkbox.data("checked"),
            save_checkbox = dialog_el.find("#dontshowwrap"),
            save_confirmed = save_checkbox.data("checked");
        if (!key_confirmed == true) {
            popnotify("error", translate("confirmpkownership"));
            return
        }
        if (save_confirmed == true) { // whitlist seed id
            add_address_whitelist(dialog_data.address);
        }
        canceloptions();
        canceldialog();
        finishtxfunction(dialog_data.currency, dialog_data.address, null, dialog_data.title);
        return
    })
}

// Shows requests for specific address
function showrequests() {
    $(document).on("click", ".showrequests", function(event) {
        event.preventDefault();
        loadpage("?p=requests&filteraddress=" + $(this).closest("ul").data("address"));
        canceloptions();
    });
}

// Displays inline address requests
function showrequests_inlne() {
    $(document).on("click", ".applist.pobox li .usedicon", function() {
        const wallet_addr = $(this).prev("span").text(),
            user_confirm = confirm(translate("showrequestsfor", {
                "address": wallet_addr
            }));
        if (user_confirm === true) {
            loadpage("?p=requests&filteraddress=" + wallet_addr);
        }
    });
}

// Triggers address edit dialog
function editaddresstrigger() {
    $(document).on("click", ".editaddress", function(event) {
        event.preventDefault();
        addaddress($(this).closest("ul").data(), true);
    })
}

// Initiates address removal
function removeaddress() {
    $(document).on("click", ".removeaddress", function(event) {
        event.preventDefault();
        popdialog("<h2 class='icon-bin'>" + translate("removeaddress") + "</h2>", "removeaddressfunction", $(this));
    })
}

// Executes address removal
function removeaddressfunction(trigger) {
    const user_confirm = confirm(translate("areyousure"));
    if (user_confirm === true) {
        const options_list = trigger.closest("ul#optionslist"),
            addr_data = options_list.data(),
            currency = addr_data.currency,
            address = addr_data.address,
            is_erc20 = addr_data.erc20,
            current_entry = filter_addressli(currency, "address", address);
        current_entry.remove();
        const remaining_addrs = get_addresslist(currency).children("li"); // check length after removing address
        if (remaining_addrs.length) {} else {
            loadpage("?p=currencies");
            const currency_item = get_currencyli(currency),
                home_item = get_homeli(currency);
            if (is_erc20 === true) {
                $("#" + currency + ".page").remove();
                currency_item.remove();
                home_item.remove();
            } else {
                currency_item.data("checked", false).attr("data-checked", "false");
                home_item.addClass("hide");
            }
            savecurrencies(true);
        }
        glob_let.new_address = null; // prevent double entries
        canceldialog();
        canceloptions();
        notify(translate("addressremoved") + " 🗑");
        saveaddresses(currency, true);
    }
}

// Shows recent payments for address
function rec_payments() {
    $(document).on("click", "#rpayments", function() {
        const addr_data = $(this).closest("ul").data(),
            explorer_url = blockexplorer_url(addr_data.currency, false, addr_data.erc20, addr_data.source, addr_data.eth_layer2);
        if (explorer_url !== undefined) {
            open_blockexplorer_url(explorer_url + addr_data.address);
        }
    })
}

// Handles transaction detail display
function showtransaction_trigger() {
    $(document).on("click", ".metalist .show_tx, .transactionlist .tx_val", function() {
        const tx_element = $(this),
            parent_item = tx_element.closest("li"),
            request_item = tx_element.closest("li.rqli"),
            tx_data = parent_item.data(),
            request_data = request_item.data(),
            tx_hash = tx_data.txhash || request_data.txhash;
        if (tx_hash) {
            const is_lightning = tx_hash.startsWith("lightning");
            if (is_lightning) {
                const lightning_data = request_data.lightning,
                    impl = lightning_data.imp,
                    invoice_data = lightning_data.invoice;
                if (invoice_data) {
                    const invoice_hash = invoice_data.hash;
                    if (invoice_hash) {
                        const user_confirm = confirm(translate("openinvoice", {
                            "hash": invoice_hash
                        }));
                        if (user_confirm) {
                            const proxy_host = lightning_data.proxy_host,
                                node_id = lightning_data.nid,
                                peer_id = lightning_data.pid,
                                password = lightning_data.pw;
                            lnd_lookup_invoice(proxy_host, impl, invoice_hash, node_id, peer_id, password);
                            return
                        }
                    }
                }
                playsound(glob_const.funk);
                return
            }
            const currency = request_data.payment,
                is_erc20 = request_data.erc20,
                source = request_data.source,
                layer = tx_data.eth_layer2 || request_data.eth_layer2,
                explorer_url = blockexplorer_url(currency, true, is_erc20, source, layer);
            if (explorer_url) {
                open_blockexplorer_url(explorer_url + tx_hash);
            }
        }
    })
}

// Shows all transactions for address
function showtransactions() {
    $(document).on("click", ".showtransactions", function(event) {
        event.preventDefault();
        const addr_data = $("#ad_info_wrap").data(),
            explorer_url = blockexplorer_url(addr_data.currency, false, addr_data.erc20, addr_data.source, addr_data.eth_layer2);
        if (explorer_url) {
            open_blockexplorer_url(explorer_url + addr_data.address);
        }
    })
}

// Displays comprehensive address information
function addressinfo() {
    $(document).on("click", ".address_info", function() {
        const dialog_wrap = $(this).closest("ul"),
            dialog_data = dialog_wrap.data(),
            label = dialog_data.label || dialog_data.a_id || "",
            currency = dialog_data.currency,
            has_bip32 = hasbip32(currency),
            bip32_data = (has_bip32) ? getbip32dat(currency) : null,
            seed_id = dialog_data.seedid,
            xpub_id = dialog_data.xpubid,
            view_key = dialog_data.vk,
            source_type = seed_id ? "seed" : xpub_id ? "xpub" : false,
            is_seed = source_type === "seed",
            is_xpub = source_type === "xpub",
            active_xpub_data = active_xpub(currency),
            is_active_source = is_seed ? (seed_id === glob_let.bipid) : (is_xpub ? (active_xpub_data && xpub_id === active_xpub_data.key_id) : false),
            address = dialog_data.address,
            addr_whitelist_status = addr_whitelist(address),
            restore_btn = is_seed ? (glob_let.hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + seed_id + "'>" + translate("resoresecretphrase") + "</div>" : "",
            source_label = source_type ? (is_active_source) ? source_type + " <span class='icon-checkmark'>" : source_type + " (Unavailable)" + restore_btn : "external",
            derive_index = dialog_data.derive_index,
            purpose = dialog_data.purpose;
        let deriv_path = bip32_data ? bip32_data.root_path + derive_index : "";
        if (purpose) {
            const path_parts = deriv_path.split("/");
            path_parts[1] = purpose;
            deriv_path = path_parts.join("/");
        }
        dialog_data.dpath = deriv_path,
            dialog_data.bip32dat = bip32_data,
            dialog_data.address = address;
        const currency_icon = getcc_icon(dialog_data.cmcid, dialog_data.ccsymbol + "-" + currency, dialog_data.erc20),
            path_info = is_seed ? "<li><strong>" + translate("derivationpath") + ":</strong> " + deriv_path + "</li>" : "",
            pk_verified = "Unknown <span class='icon-checkmark'></span>",
            view_key_obj = view_key ? vk_obj(view_key) : false,
            view_key_data = view_key_obj ? (is_seed && is_active_source ? "derive" : view_key_obj.vk) : false,
            show_label = translate("show"),
            pk_display = view_key_data ? "<span id='show_vk' class='ref' data-vk='" + view_key_data + "'>" + show_label + "</span>" :
            (is_seed ? (is_active_source ? "<span id='show_pk' class='ref'>" + show_label + "</span>" :
                (addr_whitelist_status === true ? pk_verified : "Unknown")) : pk_verified);
        privatekey_label = translate("privatekey"),
            info_content = $("<div id='ad_info_wrap'><h2>" + currency_icon + " <span>" + label + "</span></h2><ul>\
               <li><strong>" + translate("address") + ": </strong><span class='adbox adboxl select'>" + address + "</span>\
               <div id='qrcodea' class='qrwrap flex'><div class='qrcode'></div>" + currency_icon + "</div>\
               </li>\
               <li><strong>" + translate("source") + ": </strong>" + source_label + "</li>" +
                path_info +
                "<li><strong>" + privatekey_label + ": </strong>" + pk_display +
                "<div id='pk_span'>\
                   <div class='qrwrap flex'>\
                       <div id='qrcode' class='qrcode'></div>" + currency_icon + "</div>\
                       <p id='pkspan' class='adbox adboxl select' data-type='" + privatekey_label + "'></p>\
               </div>\
               </li>\
               <li><div class='showtransactions ref'><span class='icon-eye'></span>" + translate("showtransactions") + "</div></li>\
               </ul>\
           </div>").data(dialog_data);
        popdialog(info_content, "canceldialog");
        $("#qrcodea .qrcode").qrcode(address);
        return false;
    })
}

// Shows/hides private key after validating view-only status and handling pin panel
function show_pk() {
    $(document).on("click", "#show_pk", function() {
        if (is_viewonly() === true) {
            vu_block();
            return
        }
        const show_btn = $(this),
            key_panel = $("#pk_span");
        if (key_panel.is(":visible")) {
            key_panel.slideUp(200);
            show_btn.text(translate("show"));
            return
        }
        if (key_panel.hasClass("shwpk")) {
            key_panel.slideDown(200);
            show_btn.text(translate("hide"));
            return
        }
        $("#optionsbox").html("");
        const addr_data = $("#ad_info_wrap").data(),
            currency = addr_data.currency,
            key_data = key_cc(),
            derive_data = {
                "dpath": addr_data.dpath,
                "key": key_data.key,
                "cc": key_data.cc
            },
            derived_keys = derive_x(derive_data),
            key_object = format_keys(key_data.seed, derived_keys, addr_data.bip32dat, addr_data.derive_index, currency),
            private_key = key_object.privkey;
        all_pinpanel({
            "func": show_pk_cb,
            "args": private_key
        }, true, true)
    })
}

// Callback that displays private key in UI and updates QR code
function show_pk_cb(private_key) {
    $("#show_pk").text(translate("hide"));
    $("#pkspan").text(private_key);
    $("#qrcode").qrcode(private_key);
    $("#pk_span").addClass("shwpk").slideDown(200);
    $("#qrcodea").slideUp(200);
}

// Shows/hides view key after validating view-only status and handling pin panel
function show_vk() {
    $(document).on("click", "#show_vk", function() {
        if (is_viewonly() === true) {
            vu_block();
            return
        }
        const show_btn = $(this),
            view_key = show_btn.attr("data-vk"),
            key_panel = $("#pk_span");
        if (key_panel.is(":visible")) {
            key_panel.slideUp(200);
            show_btn.text(translate("show"));
            return
        }
        if (key_panel.hasClass("shwpk")) {
            key_panel.slideDown(200);
            show_btn.text(translate("hide"));
            return
        }
        $("#optionsbox").html("");
        let xmr_keys = {};
        if (view_key === "derive") {
            const addr_data = $("#ad_info_wrap").data(),
                key_data = key_cc(),
                derive_data = {
                    "dpath": addr_data.dpath,
                    "key": key_data.key,
                    "cc": key_data.cc
                },
                derived_keys = derive_x(derive_data),
                root_key = derived_keys.key,
                secret_key = sc_reduce32(fasthash(root_key));
            xmr_keys = xmr_getpubs(secret_key, addr_data.derive_index);
        } else {
            xmr_keys = {
                "stat": true,
                "svk": view_key
            }
        }
        all_pinpanel({
            "func": show_vk_cb,
            "args": xmr_keys
        }, true, true)
    })
}

// Callback that displays view key details in UI with proper formatting
function show_vk_cb(key_data) {
    const view_key_text = key_data.svk ? "<br/><strong style='color:#8d8d8d'>" + translate("secretviewkey") + "</strong> <span class='adbox adboxl select' data-type='Viewkey'>" + key_data.svk + "</span><br/>" : "",
        spend_key_text = key_data.ssk ? "<br/><strong style='color:#8d8d8d'>" + translate("secretspendkey") + "</strong> <span class='adbox adboxl select' data-type='Spendkey'>" + key_data.ssk + "</span>" : ""
    $("#show_vk").text(translate("hide"));
    $("#pk_span").html(view_key_text + spend_key_text).addClass("shwpk").slideDown(200);
}

// Opens a block explorer URL
function open_blockexplorer_url(explorer_url) {
    const user_confirm = confirm(translate("openurl", {
        "url": explorer_url
    }));
    if (user_confirm === true) {
        glob_const.w_loc.href = explorer_url;
    }
}

// Generates block explorer URL based on currency, transaction type and network parameters
function blockexplorer_url(currency, is_tx, is_erc20, source, network_layer) {
    const path_prefix = is_tx ? "tx/" : "address/";
    if (network_layer === "bnb") {
        return "https://bscscan.com/" + path_prefix;
    }
    if (network_layer === "arbitrum") {
        return "https://arbiscan.io/" + path_prefix;
    }
    if (network_layer === "polygon") {
        return "https://polygonscan.com/" + path_prefix;
    }
    if (is_erc20) {
        return "https://ethplorer.io/" + path_prefix;
    }
    const explorer_name = get_blockexplorer(currency);
    if (explorer_name) {
        const explorer_data = glob_config.blockexplorers.find(filter => filter.name === explorer_name);
        if (!explorer_data) return false;
        const base_prefix = explorer_data.prefix,
            coin_data = getcoindata(currency),
            url_prefix = base_prefix === "currencysymbol" ? coin_data.ccsymbol :
            base_prefix === "currency" ? currency : base_prefix,
            path_segment = url_prefix ? url_prefix + "/" : "",
            path_type = is_tx === true ? explorer_data.tx_prefix : explorer_data.address_prefix;
        return explorer_data.url + path_segment + path_type;
    }
    return false;
}

// Retrieves the block explorer for a given currency
function get_blockexplorer(currency) {
    return cs_node(currency, "blockexplorers", true).selected;
}

// Sets up click handler for opening API source settings
function apisrc_shortcut() {
    $(document).on("click", ".api_source", function() {
        const api_settings = cs_node($(this).closest("li.rqli").data("payment"), "apis");
        if (api_settings) {
            api_settings.trigger("click");
        }
    })
}

// Initializes event listeners for canceling option dialogs
function canceloptionstrigger() {
    $(document).on("click", "#optionspop, #closeoptions", function(event) {
        if (glob_const.inframe) {
            parent.postMessage("close_request", "*");
            return
        }
        if (event.target === this) {
            canceloptions();
        }
    });
}

// Handles cleanup and state management when canceling options dialog
function canceloptions(bypass) {
    if (bypass === true) {
        clearoptions();
        return
    }
    const options_popup = $("#optionspop"),
        has_pin = (options_popup.hasClass("pin"));
    if (has_pin) {
        const phrase_panel = $("#lockscreen #phrasewrap");
        if (phrase_panel.hasClass("showph")) {
            phrase_panel.removeClass("showph");
            return
        }
        if (!ishome() && !glob_const.html.hasClass("loaded")) {
            shake(options_popup);
            return;
        }
    }
    clearoptions();
}

// Removes options dialog from UI with fade animation
function clearoptions() {
    const options_popup = $("#optionspop");
    options_popup.addClass("fadebg");
    options_popup.removeClass("active");
    glob_const.body.removeClass("blurmain_options");
    const fade_timeout = setTimeout(function() {
        options_popup.removeClass("showpu pin fadebg ontop");
        $("#optionsbox").html("");
    }, 600, function() {
        clearTimeout(fade_timeout);
    });
}

// Expands request details and animates scroll to visible position
function showrequestdetails() {
    $(document).on("click", ".requestlist .liwrap", function() {
        const request_item = $(this),
            parent_item = request_item.closest("li"),
            info_panel = request_item.next(".moreinfo"),
            meta_list = info_panel.find(".metalist");
        if (info_panel.is(":visible")) {
            info_panel.add(meta_list).slideUp(200);
            parent_item.removeClass("visible_request");
        } else {
            const nav_height = $("#fixednav").height();
            $(".requestlist > li").not(parent_item).removeClass("visible_request");
            $(".moreinfo").add(".metalist").not(info_panel).slideUp(200);
            setTimeout(function() {
                $("html, body").animate({
                    "scrollTop": parent_item.offset().top - nav_height
                }, 200);
                info_panel.slideDown(200);
                parent_item.addClass("visible_request");
                const conf_bars = parent_item.find(".transactionlist .confbar");
                if (conf_bars.length > 0) {
                    conf_bars.each(function(index) {
                        animate_confbar($(this), index);
                    });
                }
            }, 220);
        }
        parent_item.find(".transactionlist .historic_meta").slideUp(200);
    });
}

// Toggles visibility of request metadata panel
function toggle_request_meta() {
    $(document).on("click", ".requestlist li .req_actions .icon-info", function() {
        const meta_list = $(this).closest(".moreinfo").find(".metalist");
        if (meta_list.is(":visible")) {
            meta_list.slideUp(300);
            return
        }
        const conf_bars = meta_list.find(".confbar");
        meta_list.slideDown(300);
        if (conf_bars.length > 0) {
            conf_bars.each(function(index) {
                animate_confbar($(this), index);
            });
        }
    })
}

// Animates confirmation progress bar based on transaction data
function animate_confbar(conf_bar, delay_index) {
    conf_bar.css("transform", "translate(-100%)");
    const tx_data = conf_bar.closest("li").data(),
        confirm_ratio = (tx_data.confirmations / tx_data.setconfirmations) * 100,
        capped_percent = (confirm_ratio > 100) ? 100 : confirm_ratio,
        final_position = (capped_percent - 100).toFixed(2);
    setTimeout(function() {
        conf_bar.css("transform", "translate(" + final_position + "%)");
    }, delay_index * 500);
}

// Shows transaction metadata on double click for touch devices
function show_transaction_meta() {
    $(document).on("dblclick", ".requestlist li .transactionlist li", function() {
        if (!glob_const.supportsTouch) return;
        const tx_item = $(this),
            tx_meta = tx_item.children(".historic_meta");
        if (tx_meta.is(":visible")) {
            return
        }
        const tx_list = tx_item.closest(".transactionlist"),
            all_meta = tx_list.find(".historic_meta");
        all_meta.not(tx_meta).slideUp(300);
        tx_meta.slideDown(300);
    })
}

// Hides transaction metadata when clicking transaction list item
function hide_transaction_meta() {
    $(document).on("click", ".requestlist li .transactionlist li", function() {
        const tx_item = $(this),
            tx_meta = tx_item.children(".historic_meta");
        if (tx_meta.is(":visible")) {
            tx_meta.slideUp(300);
        }
    })
}

// Sets up click handler for archiving requests
function archive() {
    $(document).on("click", "#requestlist .req_actions .icon-folder-open", function() {
        popdialog("<h2 class='icon-folder-open'>" + translate("archiverequest") + "</h2>", "archivefunction", $(this));
    })
}

// Moves request from active list to archive and updates UI/storage
function archivefunction() {
    const active_request = $("#requestlist > li.visible_request"),
        request_data = active_request.data(),
        archived_copy = active_request.clone();
    if (active_request.data("status") === "insufficient") {
        updaterequest({
            "requestid": request_data.requestid,
            "status": "archive_pending"
        });
    }
    active_request.slideUp(300);
    archived_copy.data(request_data).prependTo($("#archivelist"));
    setTimeout(function() {
        active_request.remove();
        savearchive();
        saverequests();
    }, 350);
    archive_button();
    canceldialog();
    notify(translate("movedtoarchive"));
}

// Sets up click handler for unarchiving requests
function unarchive() {
    $(document).on("click", "#archivelist .req_actions .icon-undo2", function() {
        popdialog("<h2 class='icon-undo2'>" + translate("unarchiverequest") + "</h2>", "unarchivefunction", $(this));
    })
}

// Moves request from archive back to active list and updates UI/storage
function unarchivefunction() {
    const archived_request = $("#archivelist li.visible_request"),
        request_data = archived_request.data(),
        active_copy = archived_request.clone();
    archived_request.slideUp(300);
    active_copy.data(request_data).prependTo($("#requestlist"));
    setTimeout(function() {
        archived_request.remove();
        savearchive();
        saverequests();
        archive_button();
    }, 350);
    canceldialog();
    notify(translate("requestrestored"));
}

// Sets up click handler for removing requests
function removerequest() {
    $(document).on("click", ".req_actions .icon-bin", function() {
        popdialog("<h2 class='icon-bin'>" + translate("deleterequest") + "?</h2>", "removerequestfunction", $(this));
    })
}

// Deletes request after confirmation and updates UI/storage
function removerequestfunction() {
    const user_confirm = confirm(translate("areyousure"));
    if (user_confirm === true) {
        const target_request = $(".requestlist > li.visible_request");
        target_request.slideUp(300);
        setTimeout(function() {
            target_request.remove();
            saverequests();
            savearchive();
        }, 350);
        canceldialog();
        notify(translate("requestdeleted") + " 🗑");
    }
}

// Calculates difference between expected and received payment amounts
function amountshort(total, received, fiat_value, is_crypto) {
    const received_amount = is_crypto === true ? received : fiat_value,
        amount_diff = total - received_amount,
        formatted_diff = is_crypto === true ? trimdecimals(amount_diff, 5) : trimdecimals(amount_diff, 2);
    return (isNaN(formatted_diff)) ? null : formatted_diff;
}

// Sets up click handler for editing request titles
function editrequest() {
    $(document).on("click", ".editrequest", function() {
        const edit_btn = $(this),
            request_id = edit_btn.attr("data-requestid"),
            request_elem = $("#" + request_id),
            current_title = request_elem.data("requesttitle"),
            title_input = current_title || "",
            form_header = current_title ? translate("edit") : translate("enter"),
            dialog_content = "\
            <div class='formbox' id='edit_request_formbox'>\
                <h2 class='icon-pencil'>" + form_header + " " + translate("title") + "</h2>\
                <div class='popnotify'></div>\
                <div class='popform'>\
                    <input type='text' value='" + title_input + "' placeholder='" + translate("title") + "'/>\
                    <input type='submit' class='submit' value='" + translate("okbttn") + "' data-requestid='" + request_id + "'/>\
                </div>\
            </div>";
        popdialog(dialog_content, "triggersubmit");
    })
}

// Validates and saves updated request title to storage
function submit_request_description() {
    $(document).on("click", "#edit_request_formbox input.submit", function(event) {
        const submit_btn = $(this),
            request_id = submit_btn.attr("data-requestid"),
            title_input = submit_btn.prev("input").val(),
            final_title = title_input || "empty";
        if (title_input) {
            updaterequest({
                "requestid": request_id,
                "requesttitle": final_title
            }, true);
            canceldialog();
            notify(translate("requestsaved"));
            return
        }
        popnotify("error", translate("title") + " " + translate("requiredfield"));
    })
}

// Sets up click handler for viewing receipt information
function receipt() {
    $(document).on("click", ".receipt > p", function() {
        const receipt_btn = $(this),
            request_item = receipt_btn.closest(".rqli"),
            request_data = request_item.data(),
            request_id = request_data.requestid,
            pdf_url = get_pdf_url(request_data),
            pdf_name = "bitrequest_" + translate("receipt") + "_" + request_id + ".pdf",
            dialog_elems = [{
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
                                    "data-receiptdat": pdf_url,
                                    "data-requestid": request_id
                                }
                            }
                        },
                        {
                            "a": {
                                "id": "dl_receipt",
                                "class": "util_icon icon-download",
                                "attr": {
                                    "href": pdf_url,
                                    "target": "_blank",
                                    "title": "Download " + pdf_name,
                                    "download": pdf_name
                                }
                            }
                        },
                        {
                            "a": {
                                "id": "receipt_link",
                                "class": "customtrigger",
                                "attr": {
                                    "href": pdf_url,
                                    "target": "_blank",
                                    "download": pdf_name
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
            dialog_content = template_dialog({
                "id": "invoiceformbox",
                "icon": "icon-file-pdf",
                "title": pdf_name,
                "elements": dialog_elems
            });
        popdialog(dialog_content, "triggersubmit");
    })
}

// Handles download of receipt PDF with user confirmation
function download_receipt() {
    $(document).on("click", "#dl_receipt", function(event) {
        const download_btn = $(this),
            file_url = download_btn.attr("href"),
            button_title = download_btn.attr("title"),
            user_confirm = confirm(button_title + "?");
        if (user_confirm === false) {
            event.preventDefault();
            return false;
        }
    })
}

// Handles sharing receipt via file sharing APIs
function share_receipt() {
    $(document).on("click", "#share_receipt", function() {
        const share_btn = $(this),
            pdf_url = share_btn.attr("data-receiptdat"),
            request_id = share_btn.attr("data-requestid"),
            file_name = "bitrequest_receipt_" + request_id + ".pdf",
            user_confirm = confirm(translate("sharefile", {
                "filename": file_name
            }));
        if (user_confirm === true) {
            loader(true);
            loadertext(translate("generatereceipt"));
            const account_name = $("#accountsettings").data("selected"),
                shared_title = "bitrequest_receipt_" + request_id + ".pdf",
                url_hash = hashcode(request_id + shared_title);
            shorten_url(shared_title, pdf_url, fetch_aws("img_receipt_icon.png"), true, url_hash);
            closeloader();
        }
    })
}

// Fetches and decodes Lightning Network invoice details from proxy
function lnd_lookup_invoice(proxy, impl, hash, node_id, peer_id, password) {
    const proxy_data = lnurl_deform(proxy),
        proxy_host = proxy_data.url,
        proxy_key = password || proxy_data.k,
        api_url = proxy_host + "proxy/v1/ln/api/",
        request_data = {
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": api_url,
            "data": {
                "fn": "ln-invoice-decode",
                "imp": impl,
                "hash": hash,
                "nid": node_id,
                "callback": "no",
                "id": peer_id,
                "x-api": proxy_key
            }
        };
    loader(true);
    loadertext(translate("connecttolnur", {
        "url": lnurl_encode("lnurl", proxy_host)
    }));
    $.ajax(request_data).done(function(response) {
        if (!response) {
            notify(translate("nofetchincoice"));
            closeloader();
            return
        }
        const error = response.error;
        if (error) {
            popdialog("<h2 class='icon-blocked'>" + error.message + "</h2>", "canceldialog");
            closeloader();
            return;
        }
        const dialog_elems = [{
                "div": {
                    "class": "popform",
                    "content": [{
                            "div": {
                                "class": "invoice_body",
                                "content": "<pre>" + syntax_highlight(response) + "</pre><div class='inv_pb'><img src='" + c_icons(impl) + "' class='lnd_icon' title='" + impl + "'/> Powered by " + impl + "</div>"
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
            dialog_content = template_dialog({
                "id": "invoiceformbox",
                "icon": "icon-power",
                "title": "Invoice",
                "elements": dialog_elems
            });
        popdialog(dialog_content, "canceldialog");
        closeloader();
    }).fail(function(xhr, status, error) {
        notify(translate("nofetchincoice"));
        closeloader();
    });
}

// Generates PDF receipt URL with formatted transaction details
function get_pdf_url(request_data) {
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
    } = request_data,
    status_text = status === "new" ? "Waiting for payment" : status,
        is_lightning = txhash && txhash.slice(0, 9) === "lightning",
        is_hybrid = lightning && lightning.hybrid === true,
        payment_date = fulldateformat(new Date(paymenttimestamp - glob_const.timezone), langcode),
        received_amount = trimdecimals(receivedamount, 6),
        fiat_amount = trimdecimals(fiatvalue, 2),
        is_incoming = requesttype === "incoming",
        is_outgoing = requesttype === "outgoing",
        is_local = requesttype === "local",
        is_checkout = requesttype === "checkout",
        request_type = is_incoming ? (is_checkout ? "online purchase" : "incoming") : (is_local ? "point of sale" : "outgoing"),
        decimals = iscrypto ? 6 : 2,
        formatted_amount = trimdecimals(amount, decimals),
        currency_symbol = uoa.toUpperCase(),
        utc_time = timestamp - glob_const.timezone,
        local_time = requestdate ? requestdate - glob_const.timezone : utc_time,
        date_obj = new Date(local_time),
        request_date = requestdate ? fulldateformat(date_obj, langcode) : "unknown",
        utc_date = fulldateformat(new Date(utc_time)),
        ln_suffix = is_lightning ? " (lightning)" : "",
        invoice_data = {
            "Request ID": requestid,
            [transclear("currency")]: clear_accents(payment + ln_suffix),
            [transclear("amount")]: formatted_amount + " " + currency_symbol,
            [transclear("status")]: transclear(status_text),
            [transclear("type")]: transclear(request_type),
            [transclear("receivingaddress")]: address
        };
    if (exists(requestname)) {
        invoice_data[transclear("from")] = clear_accents(requestname);
    }
    if (exists(requesttitle)) {
        invoice_data[transclear("title")] = "'" + clear_accents(requesttitle) + "'";
    }
    if (is_incoming) {
        invoice_data[transclear("created")] = request_date;
        invoice_data[transclear("firstviewed")] = utc_date;
    }
    if (status === "paid") {
        const amount_label = is_incoming ? transclear("amountpaid") : transclear("amountreceived");
        invoice_data[transclear("paidon")] = payment_date;
        invoice_data[amount_label] = received_amount + " " + payment;
        if (!iscrypto) {
            invoice_data[transclear("fiatvalueon") + " " + payment_date] = fiat_amount + " " + currencyname;
        }
    }
    if (exists(txhash)) {
        invoice_data["TxID"] = txhash;
    }
    const network = getnetwork(eth_layer2);
    if (network) {
        invoice_data[transclear("network")] = network;
    }
    const proxy_url = d_proxy();
    return proxy_url + "proxy/v1/receipt/?data=" + btoa(JSON.stringify(invoice_data));
}

// Countdown format

// Converts timestamp to days/hours/minutes/seconds object
function countdown(timestamp) {
    let time_secs = timestamp / 1000,
        days = Math.floor(time_secs / 86400);
    time_secs -= days * 86400;
    let hours = Math.floor(time_secs / 3600) % 24;
    time_secs -= hours * 3600;
    let minutes = Math.floor(time_secs / 60) % 60;
    time_secs -= minutes * 60;
    let seconds = time_secs % 60,
        time_parts = {
            "days": days,
            "hours": hours,
            "minutes": minutes,
            "seconds": Math.round(seconds)
        }
    return time_parts;
}

// Formats countdown object into human readable string
function countdown_format(cd) {
    const days = cd.days,
        hours = cd.hours,
        minutes = cd.minutes,
        seconds = cd.seconds,
        day_text = days ? (days < 2) ? days + " " + translate("day") : days + " " + translate("days") : "",
        hour_sep = days ? ", " : "",
        hour_text = hours ? (hours < 2) ? hour_sep + hours + " " + translate("hour") : hour_sep + hours + " " + translate("hours") : "",
        min_sep = hours ? ", " : "",
        min_text = minutes ? (minutes < 2) ? min_sep + minutes + " " + translate("minute") : min_sep + minutes + " " + translate("minutes") : "",
        sec_sep = minutes ? " " + translate("and") + " " : "",
        sec_text = seconds ? sec_sep + seconds + " " + translate("seconds") : "",
        formatted_time = cd ? day_text + hour_text + min_text + sec_text : false;
    return formatted_time;
}

// ** Page rendering **

// Renders the currencies from cached data
function rendercurrencies() {
    initiate();
    if (glob_const.stored_currencies) {
        $.each(glob_const.stored_currencies, function(index, data) {
            const curr_code = data.currency,
                coin_id = data.cmcid;
            buildpage(data, false);
            render_currencysettings(curr_code);
            const wallet_addrs = br_get_local("cc_" + curr_code, true);
            if (wallet_addrs) {
                $.each(wallet_addrs.reverse(), function(index, addr_data) {
                    appendaddress(curr_code, addr_data);
                });
            }
        });
    }
    $("ul#allcurrencies").append("<li id='choose_erc20' data-currency='erc20 token' class='start_cli'><div class='liwrap'><h2><img src='" + c_icons("ph") + "'/>" + translate("more") + "...</h2></div></li>\
    <li id='rshome' class='restore start_cli' data-currency='erc20 token'><div class='liwrap'><h2><span class='icon-upload'> " + translate("restorefrombackup") + "</h2></div></li><li id='start_cli_margin' class='start_cli'><div class='liwrap'><h2></h2></div></li>").prepend("<li id='connectln' data-currency='bitcoin' class='start_cli'><div class='liwrap'><h2><img src='img_logos_btc-lnd.png'/>Lightning</h2></div></li>");
}

// Renders currency settings from cache
function render_currencysettings(curr_code) {
    const cached_settings = br_get_local(curr_code + "_settings", true);
    if (cached_settings) {
        append_coinsetting(curr_code, cached_settings);
    }
}

// Builds the settings UI from configuration data
function buildsettings() {
    const settings_list = $("#appsettings");
    glob_config.app_settings.forEach(function(setting) {
        const setting_id = setting.id,
            selected_val = setting.selected,
            trans_val = translate(selected_val),
            display_val = trans_val || selected_val,
            settings_item = (setting_id === "heading") ? $("<li class='set_heading'>\
              <h2>" + translate(setting.heading) + "</h2>\
        </li>") :
            $("<li class='render' id='" + setting_id + "'>\
              <div class='liwrap iconright'>\
                 <span class='" + setting.icon + "'></span>\
                 <div class='atext'>\
                    <h2>" + translate(setting_id) + "</h2>\
                    <p>" + display_val + "</p>\
                 </div>\
                 <div class='iconbox'>\
                     <span class='icon-pencil'></span>\
                </div>\
              </div>\
        </li>");
        settings_item.data(setting).appendTo(settings_list);
    });
}

// Updates UI with cached settings excluding specified options
function rendersettings(excludes) {
    const cached_settings = br_get_local("settings", true);
    if (cached_settings) {
        cached_settings.forEach(function(setting) {
            const setting_id = setting.id;
            if ($.inArray(setting_id, excludes) === -1) { // exclude excludes
                const selected_val = setting.selected,
                    trans_val = translate(selected_val),
                    display_val = setting_id === "accountsettings" ? selected_val : (trans_val || selected_val); // Exclude translations
                $("#" + setting.id).data(setting).find("p").text(display_val);
            }
        });
    }
}

// Loads and displays cached requests
function renderrequests() {
    fetchrequests("requests", false);
    fetchrequests("archive", true);
    archive_button();
}

// Updates archive button visibility based on archived request count
function archive_button() {
    const archive_btn = $("#viewarchive"),
        num_archived = $("#archivelist > li").length;
    if (num_archived > 0) {
        const btn_title = archive_btn.attr("data-title");
        archive_btn.slideDown(300).text(btn_title + " (" + num_archived + ")");
        return
    }
    archive_btn.slideUp(300);
}

// Retrieves and renders cached requests with optional archive filtering
function fetchrequests(cache_name, is_archive) {
    const cached_reqs = br_get_local(cache_name, true);
    if (cached_reqs) {
        const show_archive = !is_archive && cached_reqs.length > 11; // only show archive button when there are more then 11 requests
        cached_reqs.reverse().forEach(function(req) {
            req.archive = is_archive;
            req.showarchive = show_archive;
            appendrequest(req);
        });
    }
}

// Sets up initial cryptocurrency UI when no cache exists
function initiate() {
    $.each(glob_config.bitrequest_coin_data, function(dat, coin) {
        if (coin.active === true) {
            const {
                settings,
                "data": coin_data
            } = coin,
            has_settings = !!settings,
                is_monitored = has_settings && !!settings.apis,
                coin_config = {
                    "currency": coin_data.currency,
                    "ccsymbol": coin_data.ccsymbol,
                    "checked": false,
                    "cmcid": coin_data.cmcid,
                    "erc20": false,
                    "monitored": is_monitored,
                    "settings": has_settings,
                    "urlscheme": coin_data.urlscheme
                };
            buildpage(coin_config, true);
            append_coinsetting(coin.currency, settings);
        }
    });
}

// Creates and manages the currency page UI with icons, settings, and address management options
function buildpage(cd, ini) {
    const {
        currency,
        ccsymbol,
        checked,
        cmcid,
        erc20,
        settings
    } = cd,
    coin_page_id = ccsymbol + "-" + currency,
        main_list = $("ul#usedcurrencies"),
        existing_item = main_list.children("li[data-currency='" + currency + "']"),
        home_list = $("ul#currencylist"),
        home_item = home_list.children("li[data-currency='" + currency + "']"),
        display_state = checked ? "" : "hide",
        has_settings = settings === true || erc20 === true;
    glob_let.init = existing_item.length === 0 && ini === true;
    if (glob_let.init === true || erc20 === true) {
        const list_item = $("<li class='iconright' data-currency='" + currency + "' data-checked='" + checked + "'>\
            <div data-rel='?p=" + currency + "' class='liwrap addcurrency'>\
                <h2>" + getcc_icon(cmcid, coin_page_id, erc20) + " " + currency + "\</h2>\
            </div>\
            <div class='iconbox togglecurrency'>\
                <span class='checkbox'></span>\
            </div>\
        </li>");
        list_item.data(cd).appendTo(main_list);
        // append currencies homepage
        const home_list_item = $("<li class='" + display_state + "' data-currency='" + currency + "'>\
            <div class='rq_icon' data-rel='?p=home&payment=" + currency + "&uoa=' data-title='create " + currency + " request' data-currency='" + currency + "'>" +
            getcc_icon(cmcid, coin_page_id, erc20) + "\
            </div>\
        </li>");
        home_list_item.data(cd).appendTo(home_list);
        const settings_panel = has_settings ? "\
        <div class='page' id='" + currency + "_settings' data-erc20='" + erc20 + "'>\
            <div class='content'>\
                <h2 class='heading'>" + getcc_icon(cmcid, coin_page_id, erc20) + " " + currency + " " + translate("settings") + "</h2>\
                <ul class='cc_settinglist settinglist applist listyle2'></ul>\
                <div class='reset_cc_settings button' data-currency='" + currency + "'>\
                    <span>" + translate("resetbutton") + "</span>\
                </div>\
            </div>\
        </div>" : "";
        const settings_btn = has_settings ? "<div data-rel='?p=" + currency + "_settings' class='self icon-cog'></div>" : "",
            send_btn = glob_let.hasbip ? "<div class='button send' data-currency='" + currency + "'><span class='icon-telegram'>" + translate("send") + "</span></div>" : "",
            coin_page = $("<div class='page' id='" + currency + "'>\
            <div class='content'>\
                <h2 class='heading'>" + getcc_icon(cmcid, coin_page_id, erc20) + " " + currency + settings_btn + "</h2>\
                <ul class='applist listyle2 pobox' data-currency='" + currency + "'>\
                    <div class='endli'><div class='button addaddress' data-currency='" + currency + "'><span class='icon-plus'>" + translate("addaddress") + "</span></div>" + send_btn + "</div>\
                    <div class='addone' data-currency='" + currency + "'>Add one</div>\
                </ul>\
            </div>\
        </div>" + settings_panel);
        coin_page.data(cd).appendTo("main");
        if (erc20 === true) {
            const token_settings = br_get_local(currency + "_settings");
            if (!token_settings) {
                br_set_local(currency + "_settings", get_erc20_settings(), true);
            }
        }
    } else {
        existing_item.data(cd).attr("data-checked", checked);
        home_item.data(cd).removeClass("hide").addClass(display_state);
    }
    $("ul#allcurrencies").append("<li class='start_cli choose_currency' data-currency='" + currency + "' data-checked='" + checked + "'>\
        <div data-rel='?p=" + currency + "' class='liwrap'>\
            <h2>" + getcc_icon(cmcid, coin_page_id, erc20) + " " + currency + "\</h2>\
        </div>\
    </li>");
}

// Renders coin-specific settings with switch panels and translated labels
function append_coinsetting(currency, settings) {
    const settings_list = $("#" + currency + "_settings ul.cc_settinglist");
    $.each(settings, function(key, setting) {
        if (setting.xpub === false) {
            return
        }
        const selected = setting.selected,
            display_val = selected.name || selected.url || selected;
        if (display_val !== undefined) {
            const val_str = display_val.toString(),
                filtered_val = val_str === "true" || val_str === "false" ? "" : val_str,
                trans_val = translate(filtered_val),
                display_text = trans_val || filtered_val,
                existing_item = settings_list.children("li[data-id='" + key + "']");
            if (existing_item.length === 0) {
                const switch_type = setting.custom_switch ? " custom" : " global bool",
                    control = setting.switch ? switchpanel(val_str, switch_type) : "<span class='icon-pencil'></span>",
                    settings_item = $("<li data-id='" + key + "'>\
                        <div class='liwrap edit_trigger iconright' data-currency='" + currency + "'>\
                            <span class='icon-" + setting.icon + "'></span>\
                            <div class='atext'>\
                                <h2>" + translate(key) + "</h2>\
                                <p>" + display_text + "</p>\
                            </div>\
                            <div class='iconbox'>" + control + "</div>\
                            </div>\
                    </li>");
                settings_item.data(setting).appendTo(settings_list);
                return
            }
            existing_item.data(setting).find("p").text(display_text);
            if (setting.switch === true) {
                existing_item.find(".switchpanel").removeClass("true false").addClass(val_str);
            }
        }
    });
}

// Creates address list item with source icons, monitoring status, and action buttons
function appendaddress(currency, addr_data) {
    const addr_text = addr_data.address,
        addr_list = get_addresslist(currency),
        list_pos = addr_list.children("li").length + 1,
        seed_id = addr_data.seedid,
        addr_id = addr_data.a_id,
        xpub_id = addr_data.xpubid,
        source_type = seed_id ? "seed" : (xpub_id ? "xpub" : ""),
        is_used = addr_data.used,
        addr_info = addr_id ? "address_ID: " + addr_id + "\n" : "",
        source_icon = source_type ? source_type === "seed" ?
        "<span title='" + addr_info + "seed_ID: " + seed_id + "' class='srcicon' data-seedid='" + seed_id + "'>" + svg_obj.seed + "</span>" :
        "<span class='srcicon icon-key' title='" + addr_info + "derived from Xpub: #" + xpub_id + "'></span>" :
        currency === "monero" ? addr_data.vk ?
        "<span class='srcicon icon-eye' title='Monitored address'></span>" :
        "<span class='srcicon icon-eye-blocked' title='Unmonitored address'></span>" : "",
        active_pub = active_xpub(currency),
        source_class = source_type ? source_type === "seed" ?
        seed_id === glob_let.bipid ? " seed seedv" : " seed seedu" :
        source_type === "xpub" ?
        (active_pub && xpub_id == active_pub.key_id) ? " xpub xpubv" : " xpub xpubu" :
        "" : "",
        used_class = is_used ? " used" : "",
        addr_item = $("<li class='adli" + source_class + used_class + "' data-index='" + list_pos + "' data-address='" + addr_text + "' data-checked='" + addr_data.checked + "'>\
            <div class='addressinfo liwrap iconright2'>\
                <div class='atext'>\
                    <h2><span>" + addr_data.label + "</span></h2>\
                    <p class='address'>" + source_icon + "<span class='select'>" + addr_text + "</span><span class='usedicon icon-arrow-up-right2' title='Used'></span></p>\
                </div>\
                <div class='iconbox'>\
                    <span class='checkbox toggleaddress'></span>\
                    <span class='popoptions icon-menu2'></span>\
                </div>\
            </div>\
        </li>");
    addr_item.data(addr_data).prependTo(addr_list);
}

// Generates complete payment request UI with transaction details, metadata, and status indicators
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
    unit = uoa.toUpperCase(),
        decimal_places = iscrypto === true ? 6 : 2,
        is_insufficient = status === "insufficient",
        is_lightning_tx = txhash && txhash.slice(0, 9) === "lightning",
        is_hybrid = lightning && lightning.hybrid === true,
        confirm_count = confirmations || 0,
        title_truncated = requesttitle && requesttitle.length > 85 ?
        "<span title='" + requesttitle + "'>" + requesttitle.substring(0, 64) + "...</span>" :
        requesttitle,
        amount_formatted = trimdecimals(amount, Math.min(decimal_places, 8)),
        received_formatted = trimdecimals(receivedamount, 6),
        fiat_formatted = trimdecimals(fiatvalue, 2),
        request_container = archive ? $("#archivelist") : $("#requestlist"),
        time_utc = timestamp - glob_const.timezone,
        time_local = requestdate ? requestdate - glob_const.timezone : time_utc,
        is_incoming = requesttype === "incoming",
        is_local = requesttype === "local",
        is_checkout = requesttype === "checkout",
        is_outgoing = requesttype === "outgoing",
        tx_direction = is_incoming ? "sent" : "received",
        type_label = is_checkout ? "online purchase" : is_local ? "point of sale" : requesttype,
        type_text = translate(type_label),
        type_icon_class = is_checkout ? " typeicon icon-cart" :
        is_local ? " icon-qrcode" :
        is_incoming ? " typeicon icon-arrow-down-right2" :
        " typeicon icon-arrow-up-right2",
        type_icon = "<span class='inout" + type_icon_class + "'></span> ",
        status_icons = "<span class='icon-checkmark' title='Confirmed transaction'></span>\
            <span class='icon-clock' title='pending transaction'></span>\
            <span class='icon-eye-blocked' title='unmonitored transaction'></span>\
            <span class='icon-wifi-off' title='No network'></span>",
        title_display = (rqdata || requesttitle) ?
        (is_incoming ? requestname : title_truncated) :
        "<b>" + amount_formatted + "</b> " + currencyname + status_icons,
        name_display = (rqdata || requesttitle) ?
        (is_incoming ? "<strong>" + title_truncated + "</strong> (" + amount_formatted + " " + currencyname + ")" + status_icons :
            amount_formatted + " " + currencyname + status_icons) : "",
        data_param = rqdata ? "&d=" + rqdata : "",
        meta_param = rqmeta ? "&m=" + rqmeta : "",
        type_class = "request" + requesttype,
        lightning_class = lightning ? " lightning" : "",
        is_ln_expire = (lightning && !is_hybrid) || is_lightning_tx,
        expire_time = is_ln_expire ? 604800000 :
        (iscrypto === true) ? 25920000000 :
        6048000000, // expirydate crypto: 300 days / fiat: 70 days / lightning: 7 days
        is_expired = (status == "expired" || (now() - time_local) >= expire_time &&
            (is_ln_expire || status == "new" || is_insufficient === true)),
        expired_class = is_expired ? " expired" : "",
        time_obj = new Date(time_local),
        date_full = fulldateformat(time_obj, langcode),
        time_display = "<span class='rq_month'>" + time_obj.toLocaleString(langcode, {
            "month": "short"
        }) + "</span> <span class='rq_day'>" + time_obj.getDate() + "</span>",
        payment_time = fulldateformat(new Date(paymenttimestamp - glob_const.timezone), langcode, true),
        amount_short = amountshort(amount, receivedamount, fiatvalue, iscrypto),
        short_suffix = is_insufficient ? " (" + amount_short + " " + unit + " " + translate("amountshort") + ")" : "",
        short_crypto = iscrypto ? short_suffix : "",
        date_created = requestdate ? date_full : "<strong>unknown</strong>",
        amount_label = is_incoming ? translate("amountpaid") : translate("amountreceived"),
        fiat_box = iscrypto || !fiatvalue ? "" :
        "<li class='payday pd_fiat'><strong>" + translate("fiatvalueon") +
        "<span class='pd_fiat'> " + payment_time + "</span> :</strong>" +
        "<span class='fiatvalue'> " + fiat_formatted + "</span> " + currencyname +
        "<div class='show_as amountshort'>" + short_suffix + "</div></li>",
        payment_info = "<li class='payday pd_paydate'><strong>" + translate("paidon") +
        ":</strong><span class='paydate'> " + payment_time + "</span></li>" +
        "<li class='receivedamount'><strong>" + amount_label + ":</strong><span> " +
        received_formatted + "</span> " + payment +
        "<div class='show_as amountshort'>" + short_crypto + "</div></li>" + fiat_box,
        name_box = is_incoming ? rqdata ?
        "<li><strong>" + translate("from") + ":</strong> " + requestname + "</li>" :
        "<li><strong>From: unknown</strong></li>" : "",
        title_box = requesttitle ?
        "<li><strong>" + translate("title") + ":</strong> '<span class='requesttitlebox'>" +
        requesttitle + "</span>'</li>" : "",
        monitor_status = !monitored ? " (unmonitored transaction)" : "",
        time_box = is_incoming ?
        "<li><strong>" + translate("created") + ":</strong> " + date_created + "</li>" +
        "<li><strong>" + translate("firstviewed") + ":</strong> " +
        fulldateformat(new Date(time_utc), langcode) + "</li>" :
        is_outgoing ?
        "<li><strong>" + translate("sendon") + ":</strong> " + date_full + "</li>" :
        is_local ?
        "<li><strong>" + translate("created") + ":</strong> " + date_full + "</li>" : "",
        payment_url = "&address=" + address + data_param + meta_param + "&requestid=" + requestid,
        addr_label = $("main #" + payment + " li[data-address='" + address + "']").data("label"),
        label_display = addr_label ? " <span class='requestlabel'>(" + addr_label + ")</span>" : "",
        confirm_display = !monitored ?
        "<div class='txli_conf' data-conf='0'><span>Unmonitored transaction</span></div>" :
        confirm_count > 0 ?
        "<div class='txli_conf'><div class='confbar'></div><span>" +
        confirm_count + " / " + set_confirmations + " " +
        translate("confirmations") + "</span></div>" :
        confirm_count === 0 ?
        "<div class='txli_conf' data-conf='0'><div class='confbar'></div>" +
        "<span>Unconfirmed transaction<span></div>" : "",
        tx_count = txhistory ? txhistory.length : 0,
        tx_view = (tx_count > 1) ? "" :
        is_lightning_tx ?
        "<li><strong class='show_tx'><span class='icon-power'></span>" +
        "<span class='ref'>" + translate("viewinvoice") + "</span></strong></li>" :
        (txhash) ?
        "<li><strong class='show_tx'><span class='icon-eye'></span>" +
        translate("viewon") + " blockchain</strong></li>" : "",
        status_text = !monitored ? "" :
        (status == "new") ? "Waiting for payment" : status,
        source_html = source ?
        "<span class='src_txt'>" + translate("source") + ": " + source + "</span>" +
        "<span class='icon-wifi-off'></span><span class='icon-connection'></span>" : "",
        crypto_class = iscrypto ? "" : " isfiat",
        archive_btn = showarchive || is_expired ?
        "<div class='icon-folder-open' title='archive request'></div>" : "",
        show_history = txhistory && (pending === "no" || archive),
        history_text = show_history ? translate("transactions") : "",
        edit_btn = is_local ?
        "<div class='editrequest icon-pencil' title='edit request' data-requestid='" +
        requestid + "'></div>" : "",
        payment_id_box = payment_id ?
        "<li><strong>" + translate("paymentid") + ":</strong> " +
        "<span class='select' data-type='payment ID'>" + payment_id + "</span></li>" : "",
        int_addr_box = xmr_ia ?
        "<li><p class='address'><strong>" + translate("integratedaddress") +
        ":</strong> <span class='requestaddress select'>" + xmr_ia + "</span></p></li>" : "",
        ln_icon = is_lightning_tx ? " <span class='icon-power'></span>" : "",
        ln_logo = "<img src='img_logos_btc-lnd.png' class='cmc_icon'>" +
        "<img src='img_logos_btc-lnd.png' class='cmc_icon'>",
        coin_logo = getcc_icon(cmcid, cpid, erc20) + getcc_icon(cmcid, cpid, erc20),
        logo_display = lightning ?
        (txhash && !is_lightning_tx) ? coin_logo : ln_logo :
        coin_logo,
        addr_title = is_hybrid ? translate("fallbackaddress") : translate("receivingaddress"),
        addr_box = lightning && (is_lightning_tx || is_hybrid === false) ? "" :
        "<li><p class='address'><strong>" + addr_title + ":</strong> " +
        "<span class='requestaddress select'>" + address + "</span>" + label_display + "</p></li>",
        network_name = getnetwork(eth_layer2),
        network_box = network_name ?
        "<li><p><strong>" + translate("network") + ":</strong> " + network_name + "</p></li>" : "",
        status_final = tx_direction === "sent" ?
        translate("paymentsent") : translate("paymentreceived"),
        request_item = $("<li class='rqli " + type_class + expired_class + lightning_class +
            "' id='" + requestid + "' data-cmcid='" + cmcid + "' data-status='" + status +
            "' data-address='" + address + "' data-pending='" + pending +
            "' data-iscrypto='" + iscrypto + "'>\
            <div class='liwrap iconright'>" + logo_display +
            "<div class='atext'>\
                    <h2>" + title_display + "</h2>\
                    <p class='rq_subject'>" + type_icon + name_display + "</p>\
                </div>\
                <p class='rq_date' title='" + date_full + "'>" + time_display + "</p><br/>\
                <div class='pmetastatus' data-count='0'>+ 0</div>\
                <div data-rel='" + payment_url + "' class='payrequest button" + crypto_class + "'>\
                    <span class='icon-qrcode'>" + translate("pay") + "</span>\
                </div>\
            </div>\
            <div class='moreinfo'>\
                <div class='req_actions'>\
                    <div data-rel='" + payment_url + "' class='icon-qrcode" + crypto_class + "'></div>\
                    <div class='icon-bin' title='delete'></div>" +
            archive_btn +
            "<div class='icon-undo2' title='unarchive request'></div>\
                    <div class='icon-info' title='show info'></div>" + edit_btn + "</div>\
                <ul class='metalist'>\
                    <li class='cnamemeta'><strong>" + translate("currency") + ":</strong> " +
            payment + ln_icon + "</li>" +
            name_box +
            title_box +
            "<li><strong>" + translate("amount") + ":</strong> " + amount_formatted + " " +
            unit + "</li>\
                    <li class='meta_status' data-conf='" + confirm_count +
            "'><strong>" + translate("status") + ":</strong><span class='status'> " +
            translate(status_text) + "</span> " + confirm_display + "</li>\
                    <li><strong>" + translate("type") + ":</strong> " + type_text +
            monitor_status + "</li>" +
            time_box +
            payment_info +
            addr_box +
            network_box +
            payment_id_box +
            int_addr_box +
            "<li class='receipt'><p><span class='icon-file-pdf' title='View receipt'/>" +
            translate("receipt") + "</p></li>" + tx_view +
            "</ul>\
                <ul class='transactionlist'>\
                    <h2>" + history_text + "</h2>\
                </ul>\
                <div class='api_source'>" + source_html + "</div>\
            </div>\
            <div class='brstatuspanel flex'>\
                <img src='" + c_icons("confirmed") + "'>\
                <h2>" + status_final + "</h2>\
            </div>\
            <div class='brmarker'></div>\
            <div class='expired_panel'><h2>" + translate("expired") + "</h2></div>\
        </li>");
    rd.coindata = null, // no need to save coindata
        request_item.data(rd).prependTo(request_container);
    if (show_history) {
        const tx_list = request_container.find("#" + requestid).find(".transactionlist");
        add_historical_data(tx_list, txhistory);
    }
}

// Renders transaction history list items with associated metadata
function add_historical_data(transaction_list, tx_history) {
    let history_item = false;
    $.each(tx_history, function(data, tx_data) {
        history_item = append_tx_li(tx_data);
        if (history_item) {
            const history_title = data_title(tx_data);
            if (history_title) {
                if (history_item.attr("title") === history_title) {} else {
                    history_item.append(hs_for(history_title)).attr("title", history_title);
                }
            }
            transaction_list.append(history_item.data(tx_data));
        }
    });
}

// Returns network name based on blockchain layer
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

// Persists cryptocurrency list to localStorage and updates change counter
function savecurrencies(trigger_update) {
    const currency_list = $("#usedcurrencies li").map(function() {
        return $(this).data();
    }).get();
    br_set_local("currencies", currency_list, true);
    updatechanges("currencies", trigger_update);
}

// Stores address list for specific currency and handles ERC20 token settings cleanup
function saveaddresses(currency, trigger_update) {
    const addr_list = get_addresslist(currency),
        addr_items = addr_list.find("li");
    if (addr_items.length) {
        const addr_data = addr_items.map(function() {
            return $(this).data();
        }).get();
        br_set_local("cc_" + currency, addr_data, true);
        updatechanges("addresses", trigger_update);
        return
    }
    br_remove_local("cc_" + currency);
    const coin_data = getcoindata(currency);
    if (coin_data) {
        if (coin_data.erc20) {
            br_remove_local(currency + "_settings");
            updatechanges("addresses", trigger_update);
            return
        }
    }
    reset_coinsettings_function(currency);
}

// Saves active requests to localStorage and triggers change notification
function saverequests() {
    const request_data = $("ul#requestlist > li").map(function() {
        return $(this).data();
    }).get();
    br_set_local("requests", request_data, true);
    updatechanges("requests", true);
}

// Saves the archive list to local storage
function savearchive() {
    const archive_data = $("ul#archivelist > li").map(function() {
        return $(this).data();
    }).get();
    br_set_local("archive", archive_data, true);
}

// Stores application settings and triggers change notification with alert control
function savesettings(suppress_alert) {
    const settings_data = $("ul#appsettings > li.render").map(function() {
        return $(this).data();
    }).get();
    br_set_local("settings", settings_data, true);
    updatechanges("settings", true, suppress_alert);
}

// Saves cryptocurrency-specific settings and updates change counter
function save_cc_settings(currency, trigger_update) {
    const coin_settings = {};
    $("#" + currency + "_settings ul.cc_settinglist > li").each(function() {
        const setting_item = $(this);
        coin_settings[setting_item.attr("data-id")] = setting_item.data();
    });
    br_set_local(currency + "_settings", coin_settings, true);
    updatechanges("coinsettings", trigger_update);
}

// Manages change counter and triggers backup notifications based on thresholds
function updatechanges(key, trigger_update, suppress_alert) {
    const pass_state = gd_pass();
    if (pass_state.active === false) {} else {
        if (pass_state.pass) {
            update_appdata(pass_state);
            return
        }
        if (pass_state.expired) {
            t_expired(pass_state.expired, "uad");
            return
        }
    }
    if (trigger_update === true) {
        const change_count = glob_let.changes[key] || 0;
        glob_let.changes[key] = change_count + 1;
        savechangesstats();
        if (suppress_alert == "noalert") {
            return
        }
        change_alert();
    }
}

// Resets change counter and clears UI change indicators
function resetchanges() {
    glob_let.changes = {};
    savechangesstats();
    glob_const.body.removeClass("haschanges");
    if (!glob_const.html.hasClass("proxyupdate")) {
        $("#alert > span").text("0").attr("title", translate("nochanges"));
    }
}

// Saves change statistics to localStorage for persistence
function savechangesstats() {
    br_set_local("changes", glob_let.changes, true);
}

// Loads or initializes change tracking from localStorage
function renderchanges() {
    glob_let.changes = br_get_local("changes", true) || {};
}

// Shows change count alert and triggers backup at specific thresholds
function change_alert() {
    if (glob_const.is_ios_app === true) {
        return
    }
    const change_count = get_total_changes();
    if (change_count > 24) {
        $("#alert > span").text(change_count).attr("title", translate("totalchanges", {
            "total_changes": change_count
        }));
        setTimeout(function() {
            glob_const.body.addClass("haschanges");
        }, 2500);
        if ([25, 50, 150, 200, 250].includes(change_count)) {
            canceldialog();
            const backup_timer = setTimeout(function() {
                backupdatabase();
            }, 3000, function() {
                clearTimeout(backup_timer);
            });
        }
    }
}

// Calculates total number of tracked changes across all categories
function get_total_changes() {
    return Object.values(glob_let.changes).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
}

// Recursively converts data object into HTML with attributes and nested content
function render_html(element_data) {
    return element_data.map(function(component) {
        return Object.entries(component).map(function([tag_name, props]) {
            const elem_id = props.id ? " id='" + props.id + "'" : "",
                elem_class = props.class ? " class='" + props.class + "'" : "",
                elem_attrs = props.attr ? render_attributes(props.attr) : "",
                elem_content = props.content ?
                (typeof props.content === 'object' ?
                    render_html(props.content) :
                    props.content) : "",
                tag_close = props.close ?
                "/>" :
                ">" + elem_content + "</" + tag_name + ">";
            return "<" + tag_name + elem_id + elem_class + elem_attrs + tag_close;
        }).join("");
    }).join("");
}

// Renders HTML attributes from an object
function render_attributes(attr_data) {
    return Object.entries(attr_data).map(function([attr_name, attr_value]) {
        return " " + attr_name + "='" + attr_value + "'";
    }).join("");
}

// HTML rendering
// Generates HTML dialog box with customizable icon, title and content sections
function template_dialog(dialog_data) {
    const validation_class = dialog_data.validated ? " validated" : "",
        dialog_structure = [{
            "div": {
                "id": dialog_data.id,
                "class": "formbox",
                "content": [{
                        "h2": {
                            "class": dialog_data.icon,
                            "content": dialog_data.title
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
                            "content": render_html(dialog_data.elements)
                        }
                    }
                ]
            }
        }]
    return render_html(dialog_structure);
}

// ** Helpers **

// Handles external URL opening with loader and browser targeting
function open_url() {
    $(document).on("click", "a.exit", function(e) {
        e.preventDefault();
        const link_elem = $(this),
            target_type = link_elem.attr("target"),
            dest_url = link_elem.attr("href");
        loader(true);
        loadertext(translate("loadurl", {
            "url": dest_url
        }));
        if (glob_const.is_ios_app === true) {
            cancelpaymentdialog();
        }
        setTimeout(function() {
            closeloader();
            if (target_type === "_blank") {
                window.open(dest_url);
            } else {
                glob_const.w_loc.href = dest_url;
            }
        }, 500);
    })
}

// Returns BlockCypher API key from UI data or default
function get_blockcypher_apikey() {
    return $("#apikeys").data("blockcypher") || to.bc_id;
}

// Returns Infura API key if URL doesn't contain one already
function get_infura_apikey(rpc_url) {
    const saved_key = $("#apikeys").data("infura");
    return (/^[A-Za-z0-9]+$/.test(rpc_url.slice(-15))) ? "" : saved_key || to.if_id; // check if rpcurl already contains apikey
}

// Returns Alchemy API key from UI data or default
function get_alchemy_apikey() {
    return $("#apikeys").data("alchemy") || to.al_id;
}

// Shows proxy update notification with version comparison
function proxy_alert(version) {
    if (version) {
        glob_const.html.addClass("proxyupdate");
        $("#alert > span").text("!").attr("title", translate("updateproxy", {
            "version": version,
            "proxy_version": glob_const.proxy_version
        }) + " " + d_proxy());
    }
}

// Finds ERC20 token metadata by currency name from cache
function fetchsymbol(currency_name) {
    const token_list = fetch_cached_erc20();
    return token_list.find(function(token) {
        return token.name === currency_name;
    }) || {};
}

// Toggles fixed navigation based on scroll position
function fixedcheck(scroll_pos) {
    const header_height = $(".showmain #header").outerHeight();
    if (scroll_pos > header_height) {
        $(".showmain").addClass("fixednav");
        return
    }
    $(".showmain").removeClass("fixednav");
}

// Checks if current URL parameter matches homepage
function ishome(page_name) {
    const current_page = page_name || geturlparameters().p;
    return !current_page || current_page === "home";
}

// Programmatically triggers submit button click in dialog
function triggersubmit(trigger_elem) {
    trigger_elem.parent("#actions").prev("#dialogbody").find("input.submit").trigger("click");
}

// Copies text to clipboard using modern API or fallback
function copytoclipboard(content, content_type) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(content)
            .then(function() {
                notify(content_type + " " + translate("copied"), 2500, "no");
            })
            .catch(function() {
                notify(translate("xcopy") + " " + content_type, 2500, "no");
            });
        return;
    }
    glob_let.copycontent.val(content).select();
    try {
        if (document.execCommand("copy")) {
            notify(content_type + " " + translate("copied"), 2500, "no");
        } else {
            notify(translate("xcopy") + " " + content_type, 2500, "no");
        }
    } catch (err) {
        notify(translate("xcopy") + " " + content_type, 2500, "no");
    }
    glob_let.copycontent.val("").removeData("type").blur();
}

// Activates loading overlay with optional top positioning
function loader(show_top) {
    $("#loader").addClass(show_top ? "showpu active toploader" : "showpu active");
}

// Sets up click handler to dismiss loading overlay
function closeloader_trigger() {
    $(document).on("click", "#loader", closeloader);
}

// Removes loading overlay and resets text
function closeloader() {
    $("#loader").removeClass("showpu active toploader");
    loadertext(translate("loading"));
}

// Updates loading overlay text content
function loadertext(loader_text) {
    $("#loader #loadtext > span").text(loader_text);
}

// Updates document title and meta tags
function settitle(page_title) {
    const full_title = page_title + " | " + glob_const.apptitle;
    glob_const.titlenode.text(full_title);
    glob_const.ogtitle.attr("content", full_title);
}

// Manages PIN entry dialog with timeout and callback handling
function all_pinpanel(callback, show_top, pin_set) {
    const top_class = (show_top) ? " ontop" : "";
    if (haspin(pin_set) === true) {
        const last_lock_time = br_get_local("locktime"),
            time_since_lock = now() - last_lock_time,
            is_recent = (time_since_lock < 10000);
        if (callback && is_recent) { // keep unlocked in 10 second time window
            callback.func(callback.args);
            return
        }
        const pin_content = pinpanel(" pinwall", callback, pin_set);
        showoptions(pin_content, "pin" + top_class);
        return
    }
    const pin_content = pinpanel("", callback);
    showoptions(pin_content, "pin" + top_class);
}

// Creates PIN entry UI with keypad and admin controls
function pinpanel(panel_class, pin_callback, is_set) {
    const css_class = (panel_class === undefined) ? "" : panel_class,
        header_text = haspin(is_set) === true ? translate("pleaseenter") : translate("createpin");
    return $("<div id='pinfloat' class='enterpin" + css_class + "'>\
        <p id='pintext'>" + header_text + "</p>\
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
    </div>").data("pincb", pin_callback);
}

// Builds HTML for numeric PIN entry keypad
function generatePinpadHTML() {
    let keypad_html = "";
    for (let digit = 1; digit <= 9; digit++) {
        keypad_html += "<div id='pin" + digit + "' class='pinpad" + (digit === 1 ? " flex" : "") + "'>" +
            "<span class='pincell'>" + digit + "</span>" +
            "</div>" + (digit % 3 === 0 ? "<br>" : "");
    }
    keypad_html += "<div id='locktime' class='pinpad'><span class='icomoon'></span></div>" +
        "<div id='pin0' class='pinpad'><span class='pincell'>0</span></div>" +
        "<div id='pinback' class='pinpad'><span class='icomoon'></span></div>";
    return keypad_html;
}

// Creates toggle switch UI element with mode classes
function switchpanel(switch_state, mode_class) {
    return "<div class='switchpanel " + switch_state + mode_class + "'><div class='switch'></div></div>"
}

// Rotates to next available API endpoint in configuration
function try_next_api(api_group, current_api) {
    const api_list = glob_config.apilists[api_group],
        current_index = api_list.indexOf(current_api),
        next_api = api_list[(current_index + 1) % api_list.length];
    return glob_let.api_attempt[api_group][next_api] !== true ? next_api : false;
}

// Acquires screen wake lock to prevent display sleep
function wake() {
    if (glob_const.wl) {
        const request_wakelock = async () => {
            try {
                glob_let.wakelock = await glob_const.wl.request("screen");
                glob_let.wakelock.addEventListener("release", (e) => {
                    //console.log(e);
                });
            } catch (e) {
                //console.error(e.name, e.message);
            }
        };
        request_wakelock();
    }
}

// Releases screen wake lock to allow display sleep
function sleep() {
    if (glob_const.wl) {
        if (glob_let.wakelock) {
            glob_let.wakelock.release();
        }
        glob_let.wakelock = null;
    }
}

// Shows notification and plays sound for view-only restrictions
function vu_block() {
    notify(translate("cashiernotallowed"));
    playsound(glob_const.funk);
}

// Updates recent requests visibility based on localStorage
function check_rr() {
    const recent_requests = br_get_local("recent_requests", true);
    toggle_rr(recent_requests && !empty_obj(recent_requests));
}

// Controls display of recent requests UI elements
function toggle_rr(show_requests) {
    if (show_requests) {
        glob_const.html.addClass("show_rr");
        const history_button = $("#request_history");
        history_button.addClass("load");
        setTimeout(function() {
            history_button.removeClass("load");
        }, 500);
        return
    }
    glob_const.html.removeClass("show_rr");
}

// ** Get_app **
// Determines if app promotion should be shown based on device/platform
function detectapp() {
    const device_type = getdevicetype();
    glob_const.deviceid = device_type;
    if (glob_const.inframe === true || glob_const.is_android_app === true || glob_const.is_ios_app === true) {
        return
    }
    if (glob_const.android_standalone === true || glob_const.ios_standalone === true) {
        return
    }
    const dialog_timestamp = br_get_local("appstore_dialog");
    if (dialog_timestamp) {
        const min_delay = 300000,
            time_elapsed = now() - dialog_timestamp;
        if (time_elapsed < min_delay) {
            return
        }
        if (glob_const.supportsTouch) {
            if (device_type == "Android") {
                if (/SamsungBrowser/.test(glob_const.useragent)) {
                    return // skip samsungbrowser
                }
            }
            if (device_type == "iPhone" || device_type == "iPad" || device_type == "Macintosh") {
                getapp("apple");
            } else {
                getapp("android");
            }
        }
    } else {
        br_set_local("appstore_dialog", now());
    }
}

// Shows platform-specific app store download panel
function getapp(platform_type) {
    const app_panel = $("#app_panel");
    app_panel.html("");
    const is_android = platform_type === "android",
        store_button = fetch_aws(is_android ? "img_button-playstore.png" : "img_button-appstore.png"),
        store_url = is_android ?
        "https://play.google.com/store/apps/details?id=" +
        glob_const.androidpackagename +
        "&pcampaignid=fdl_long&url=" +
        glob_const.approot +
        encodeURIComponent(glob_const.w_loc.search) :
        "https://apps.apple.com/app/id1484815377?mt=8",
        panel_content = "<h2>Download the app</h2>\
            <a href='" + store_url + "' class='exit store_bttn'><img src='" + store_button + "'></a><br/>\
            <div id='not_now'>Not now</div>";
    app_panel.html(panel_content);
    setTimeout(function() {
        glob_const.body.addClass("getapp");
    }, 1500);
    br_set_local("appstore_dialog", now());
}

// Handles dismissal of app download promotion
function close_app_panel() {
    $(document).on("click", "#not_now", function() {
        glob_const.body.removeClass("getapp");
        setTimeout(function() {
            $("#app_panel").html("");
        }, 800);
    });
}

// Returns platform-appropriate app store button image
function platform_icon(store_type) {
    switch (store_type) {
        case "playstore":
            return fetch_aws("img_button-playstore.png");
        case "appstore":
            return fetch_aws("img_button-appstore.png");
        default:
            return fetch_aws("img_button-desktop_app.png");
    }
}

// Checks if modal dialog is currently displayed
function is_opendialog() {
    return $("#dialogbody > div.formbox").length > 0;
}

// Verifies if payment request form is open
function is_openrequest() {
    return $("#request_front").length > 0;
}

// Processes and validates custom URL scheme handlers
function check_intents(encoded_scheme) {
    if (encoded_scheme == "false") {
        return
    }
    const decoded_url = atob(encoded_scheme),
        protocol = decoded_url.split(":")[0];

    if (protocol == "eclair" || protocol == "acinq" || protocol == "lnbits") {
        const warning_content = "<h2 class='icon-warning'>" + translate("proto", {
            "proto": protocol
        }) + "</h2>";
        popdialog(warning_content, "canceldialog");
        return
    }

    if (protocol == "lndconnect" || protocol == "c-lightning-rest") {
        const implementation = protocol === "lndconnect" ? "lnd" :
            protocol === "c-lightning-rest" ? "c-lightning" :
            protocol,
            connection_data = renderlnconnect(decoded_url);

        if (connection_data) {
            const rest_url = connection_data.resturl,
                macaroon_data = connection_data.macaroon;

            if (rest_url && macaroon_data) {
                lm_function();
                ln_connect({
                    "lnconnect": btoa(rest_url),
                    "macaroon": macaroon_data,
                    "imp": implementation
                });
                return
            }
            popnotify("error", translate("decodeqr"));
        }
        return
    }

    if (protocol.length < 1) {
        const error_content = "<h2 class='icon-warning'>" + translate("invalidurlscheme") + "</h2>";
        popdialog(error_content, "canceldialog");
        return
    }

    if (protocol && protocol.length > 0) {
        const unsupported_content = "<h2 class='icon-warning'>" + translate("usnotsupported") + "</h2>";
        popdialog(unsupported_content, "canceldialog");
        return
    }
}

// Expands shortened URLs with caching and platform handling
function expand_shoturl(input_param) {
    if (input_param.startsWith("4bR")) { // handle bitly shortlink
        expand_bitly(input_param);
        return
    }
    const cached_url = br_get_session("longurl_" + input_param);
    if (cached_url) { // check for cached values
        ios_redirections(cached_url);
        return
    }
    if (input_param) {
        const proxy_index = input_param.slice(0, 1),
            short_id = input_param.slice(1),
            proxy_url = glob_const.proxy_list[proxy_index],
            is_secure_url = (proxy_url.indexOf("https://") >= 0);
        if (is_secure_url) {
            const request_payload = {
                "function": "fetch",
                "shortid": short_id
            };
            $.ajax({
                "method": "POST",
                "cache": false,
                "timeout": 5000,
                "url": proxy_url + "proxy/v1/inv/api/",
                "data": request_payload
            }).done(function(response) {
                const parsed_data = br_result(response).result;
                if (parsed_data) {
                    const status = parsed_data.status;
                    if (status) {
                        if (status == "file not found") {
                            const error_content = "<h2 class='icon-warning'>" + translate("shorturlnotfound") + "</h2>";
                            popdialog(error_content, "canceldialog");
                            closeloader();
                            return
                        }
                        if (status == "file exists") {
                            const long_url = parsed_data.sharedurl;
                            if (long_url) {
                                const local_url = makelocal(long_url);
                                ios_redirections(local_url);
                                br_set_session("longurl_" + input_param, local_url);
                                return
                            }
                        }
                    }
                }
            }).fail(function(xhr, status, error) {
                const error_content = "<h2 class='icon-warning'>" + translate("failedtofetchrequest") + "</h2>";
                popdialog(error_content, "canceldialog");
                closeloader();
                return
            });
        }
    }
}

// Handles Bitly URL expansion with API fallback
function expand_bitly(input_param) {
    if (glob_const.hostlocation === "local") {
        return
    }
    const bitly_id = input_param.slice(3),
        cached_url = br_get_session("longurl_" + bitly_id);
    if (cached_url) { // check for cached values
        ios_redirections(cached_url);
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
    }).done(function(response) {
        const parsed_data = br_result(response).result;
        if (parsed_data.error) {
            glob_const.w_loc.href = "http://bit.ly/" + bitly_id;
            return
        }
        if (parsed_data) {
            const long_url = parsed_data.long_url;
            if (long_url) {
                ios_redirections(long_url);
                br_set_session("longurl_" + bitly_id, long_url);
                return
            }
            glob_const.w_loc.href = "http://bit.ly/" + bitly_id;
        }
    }).fail(function(xhr, status, error) {
        if (get_next_proxy()) {
            expand_bitly(input_param);
            return
        }
        glob_const.w_loc.href = "http://bit.ly/" + bitly_id;
    });
}

// Sets up Lightning Network connection with credentials
function ln_connect(params) {
    const url_params = params || geturlparameters(),
        ln_connect_url = url_params.lnconnect,
        macaroon_token = url_params.macaroon,
        imp_value = url_params.imp;
    if (macaroon_token && imp_value) {
        const decoded_mac = b64urldecode(macaroon_token);
        if (decoded_mac) {
            const rest_url = atob(ln_connect_url),
                set_success = set_ln_fields(imp_value, rest_url, decoded_mac);
            if (set_success === true) {
                $("#adln_drawer").show();
                const credential_boxes = $("#lnd_credentials .lndcd"),
                    selected_box = $("#lnd_credentials .cs_" + imp_value);
                $("#lnd_select_input").data("value", imp_value).val(imp_value);
                credential_boxes.not(selected_box).hide();
                selected_box.show();
                trigger_ln();
                openpage("?p=bitcoin_settings", "bitcoin_settings", "loadpage");
                return
            }
            console.error("error", "Unable to set data");
            return
        }
        notify(translate("invalidmacaroon"));
        return
    }
    notify(translate("invalidformat"));
}

// ** Scanner UI Integration **//

// Configures QR scanner based on environment capabilities
function init_scan() {
    if (glob_const.inframe || glob_let.local) {
        glob_let.hascam = false;
        return
    }
    QrScanner.hasCamera().then(has_camera => detect_cam(has_camera));
}

// Updates global camera availability state
function detect_cam(result) {
    glob_let.hascam = result;
}

// Initializes QR scanner for specific cryptocurrency
function start_scan(currency, type) {
    glob_const.scanner.start().then(() => {
        currencyscan = currency,
            scantype = type;
        const current_page = geturlparameters().p,
            page_scan_url = current_page ? "?p=" + current_page + "&scan=" : "?scan=",
            full_url = page_scan_url + currency,
            scan_title = "scanning " + currency + " " + type;
        openpage(full_url, scan_title, "scan");
        show_cam();
        closeloader();
    }).catch((error_reason) => abort_cam(error_reason));
}

// Handles QR scanner initialization failures
function abort_cam(error_reason) {
    console.error("error", error_reason);
    closeloader();
}

// Sets up QR scanner activation handlers
function cam_trigger() {
    $(document).on("click", ".qrscanner", function() {
        loader(true);
        loadertext(translate("loadingcamera"));
        const qr_element = $(this),
            currency = qr_element.attr("data-currency"),
            scan_type = qr_element.attr("data-id");
        start_scan(currency, scan_type);
    });
}

// Manages QR scanner close button behavior
function close_cam_trigger() {
    $(document).on("click", "#closecam", function(e) {
        if (e.originalEvent) {
            window.history.back();
            return;
        }
        close_cam();
    });
}

// Activates camera preview interface
function show_cam() {
    glob_const.body.addClass("showcam");
}

// Deactivates camera and cleans up scanner state
function close_cam() {
    glob_const.body.removeClass("showcam");
    glob_const.scanner.stop();
    currencyscan = null;
}

// Routes QR scan results to appropriate handlers
function set_result(result) {
    glob_const.scanner.stop();
    const payment_type = currencyscan,
        scan_subtype = scantype;
    if (scan_subtype === "lnconnect") {
        handle_ln_connect(result, payment_type);
    } else if (scan_subtype === "address") {
        handle_address(result, payment_type);
    } else if (scan_subtype === "viewkey") {
        handle_viewkey(result, payment_type);
    }
    window.history.back();
    return false;
}

// Processes Lightning Network connection QR codes
function handle_ln_connect(result, payment) {
    const params_url = renderlnconnect(result);
    if (params_url) {
        const rest_url = params_url.resturl,
            macaroon = params_url.macaroon;
        if (rest_url && macaroon) {
            const decoded_mac = b64urldecode(macaroon);
            if (decoded_mac) {
                const set_success = set_ln_fields(payment, rest_url, decoded_mac);
                if (set_success) {
                    trigger_ln();
                }
            }
            return
        }
        popnotify("error", "unable to decode qr");
    }
}

// Validates and processes cryptocurrency address QR codes
function handle_address(result, payment) {
    const prefix = payment + ":",
        mid_result = (result.indexOf(prefix) >= 0 && payment !== "kaspa") ? result.split(prefix).pop() : result,
        end_result = (result.indexOf("?") >= 0) ? mid_result.split("?")[0] : mid_result,
        is_extended_pub = (end_result.length > 103),
        cleaned_result = (payment === "nimiq") ? end_result.replace(/\s/g, "") : end_result,
        is_valid = is_extended_pub ? check_xpub(end_result, xpub_prefix(payment), payment) : check_address(cleaned_result, payment);
    clear_xpub_inputs();
    if (is_valid === true) {
        $("#popup .formbox input.address").val(cleaned_result);
        if (!glob_const.supportsTouch) {
            $("#popup .formbox input.addresslabel").focus();
        }
        if (is_extended_pub) {
            if (cxpub(payment)) {
                clear_xpub_checkboxes();
                validate_xpub($(".formbox"));
            } else {
                popnotify("error", "invalid " + payment + " address");
            }
            return
        }
        return
    } else {
        if (is_extended_pub) {
            xpub_fail(payment);
            return
        }
        popnotify("error", "invalid " + payment + " address");
    }
}

// Validates and processes view key QR codes
function handle_viewkey(result, payment) {
    const is_valid = (result.length === 64) ? check_vk(result) : false;
    if (is_valid === true) {
        $("#popup .formbox input.vk_input").val(result);
        if (!glob_const.supportsTouch) {
            $("#popup .formbox input.addresslabel").focus();
        }
        return
    }
    popnotify("error", "invalid " + payment + " viewkey");
}

// Registers service worker for offline functionality
function add_serviceworker() {
    if ("serviceWorker" in navigator && !navigator.serviceWorker.controller) {
        navigator.serviceWorker.register("serviceworker.js", {
                "scope": "./"
            })
            .then(function(registration) {
                console.log("Service worker has been registered for scope: " + registration.scope);
            }).catch(function(error) {
                // Registration failed
                console.error("error", error);
            });
    }
}