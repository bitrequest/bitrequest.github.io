// Initialize the application when the document is ready
$(document).ready(function() {
    // ** Audio: **
    $(document).one("click touchstart", init_audio_context);

    close_startscreen();
    if (get_urlparameters().xss) return
    build_settings(); // build settings first

    if (glob_const.hostlocation !== "local") { // don't add service worker on desktop
        add_serviceworker();
    }

    //close potential websockets and pings
    force_close_socket();
    stop_monitors();

    //Set classname for iframe	
    if (glob_const.inframe === true) {
        glob_const.html.addClass("inframe");
        const gets = get_urlparameters();
        if (gets.payment) {
            glob_const.html.addClass("hide_app");
        }
    } else {
        glob_const.html.addClass("noframe");
    }

    //some api tests first
    render_settings(); //retrieve settings from localstorage (load first to retrieve apikey)
    if (glob_const.ls_support) { //check for local storage support
        const bip_verified = glob_let.io.bipv,
            php_enabled = glob_let.io.phpsupport;
        if (bip_verified && glob_let.hasbip === true) {
            glob_let.bipv = true;
        }
        if (php_enabled) {
            glob_const.phpsupport = (php_enabled === "yes");
            set_symbols();
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
    handle_select_input();
    handle_option_selection();
    canceldialog_trigger();
    console.log({
        glob_config
    });
})

function close_startscreen() {
    $(document).on("click", "#startscreen", function() {
        const loc = glob_const.w_loc,
            root = loc.origin + loc.pathname;
        loc.href = root;
    });
}

// ** Core Application Initialization: **

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
                    const api_error = api_result.error || "Unable to get API data";
                    fail_dialogs("fixer", {
                        "error": api_error
                    });
                }
            }
            glob_let.io.phpsupport = "yes";
            br_set_local("init", glob_let.io, true);
            glob_const.phpsupport = true;
            set_symbols();
            return
        }
        glob_let.io.phpsupport = "no";
        br_set_local("init", glob_let.io, true);
        glob_const.phpsupport = false;
        set_symbols();
    }).fail(function(xhr, stat, err) {
        glob_let.io.phpsupport = "no";
        br_set_local("init", glob_let.io, true);
        glob_const.phpsupport = false;
        set_symbols();
    });
}

// Retrieves and caches fiat currency symbols from fixer.io with 24h expiration
function set_symbols() {
    //set globals
    glob_let.local = (glob_const.hostlocation === "local" && glob_const.phpsupport === false),
        glob_let.localserver = (glob_const.hostlocation === "local" && glob_const.phpsupport === true);
    if (br_get_local("symbols")) {
        get_erc20tokens();
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
                get_erc20tokens();
                return
            }
            const api_error = api_data.error || "Unable to get API data";
            fail_dialogs("fixer", {
                "error": api_error
            });
        }
    }).fail(function(xhr, stat, err) {
        if (get_next_proxy()) {
            set_symbols();
            return
        }
        const error_msg = "<h2 class='icon-bin'>" + tl("apicallfailed") + "</h2><p class='doselect'>" + textStatus + "<br/>" + tl("apididnotrespond") + "<br/><br/><span id='proxy_dialog' class='ref'>" + tl("tryotherproxy") + "</span></p>";
        popdialog(error_msg, "canceldialog");
    })
}

// Fetches top 2000 ERC20 tokens from CoinMarketCap, filters Ethereum tokens, and caches results
function get_erc20tokens() {
    const cached_tokens = get_cached_tokens(true);
    if (cached_tokens) {
        set_functions();
        return
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
        store_coindata_fallback();
    }).fail(function(xhr, stat, err) {
        if (get_next_proxy()) {
            get_erc20tokens();
            return
        }
        store_coindata_fallback();
    }).always(function() {
        set_functions();
    });
}

// Splits and stores token data in localStorage with timestamp for cache management
function store_coindata(tokens_first, tokens_second) {
    if (tokens_first) {
        const converted_first = convert_coinlist(tokens_first);
        if (converted_first) {
            const cr_push = {
                "timestamp": now_utc(),
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

// Splits and stores local token data in localStorage with timestamp for cache management
function store_coindata_fallback() {
    const tokens_list = contracts("br_all");
    if (tokens_list) {
        const mid_point = Math.floor(tokens_list.length / 2),
            tokens_first = tokens_list.slice(0, mid_point);
        if (tokens_first) {
            const cr_push = {
                "timestamp": now_utc(),
                "token_arr": tokens_first
            }
            br_set_local("erc20tokens_init", cr_push, true);
        }
        const tokens_second = tokens_list.slice(mid_point);
        if (tokens_second) {
            br_set_local("erc20tokens", tokens_second, true);
        }
        return
    }
    const error_msg = "<h2 class='icon-bin'>" + tl("apicallfailed") + "</h2><p class='doselect'>" + tl("nofetchtokeninfo") + "</p>";
    popdialog(error_msg, "canceldialog");
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
        return false
    }
}

// Set up various functions for the application
function set_functions() {
    set_locales(); //set meta attribute
    set_theme();
    set_permissions();

    // ** Pincode **
    pinkeypress();
    //pinpressselect
    pinpress_trigger();
    //pinpress
    pinvalidate_trigger();
    pin_admin_reset();
    //pinvalidate
    pinback_trigger();
    pinback_validate_trigger();
    //pinback
    seed_unlock_trigger();
    phrase_login();
    //remove_cashier
    canceloptions_trigger();
    //canceloptions
    keyup();
    if (is_viewonly() === true || ishome() === true) {
        finish_functions();
        return
    }
    if (check_pin_lock() === true) {
        const content = pinpanel(" pinwall global");
        showoptions(content, "pin");
        return
    }
    finish_functions();
}

// Set up remaining functions for the application
function finish_functions() {
    // ** Navigation & Routing: **
    //loadurl
    clicklink();
    //loadpage
    //openpage
    popstate();
    //loadfunction
    //loadpageevent
    //shownav
    active_menu();
    fixednav();
    //cancel_url_dialogs
    //ios_redirections
    //ios_init

    // ** Request & Payment Handling: **
    triggertx();
    //triggertx_function
    //finishtx_function
    trigger_open_tx();
    //clear_savedurl
    payrequest();
    //close_paymentdialog
    //continue_cpd
    //post_scan_init
    //post_scan
    //cancel_post_scan
    //set_recent_requests

    // ** UI Components: **
    toggle_currency();
    toggle_address();
    //check_currency
    //currency_check
    //currency_uncheck
    toggle_switch();
    show_select_options();
    hide_select_options();
    dialog_drawer();
    //loader
    closeloader_trigger();
    //closeloader
    //set_loader_text

    // ** Scanner & QR: **  
    init_scan();
    //start_scan
    //abort_cam
    cam_trigger();
    close_cam_trigger();
    //show_cam
    //close_cam(
    //set_scan_result
    //handle_ln_connect
    //handle_address
    //handle_viewkey
    //handle_node_url
    //handle_xmrrpc
    //parse_monero_rpc_uri

    // ** Helper Functions: **
    open_url();
    //get_blockcypher_apikey
    //get_infura_apikey
    //get_alchemy_apikey
    //proxy_alert
    //fetch_symbol
    //toggle_fixed_nav
    //ishome
    //triggersubmit
    //copy_to_clipboard
    //prevent_screen_sleep
    //allow_screen_sleep
    //show_view_only_error
    //countdown
    //countdown_format
    //add_serviceworker

    // ** Core Navigation & State Management: **
    togglenav();
    //escape_and_back 
    //keyup
    //is_opendialog

    // ** Intro Flow: **
    //init_bitcoin_select_dialog
    init_bitcoin_select();
    //init_eth_select_dialog
    init_eth_select();
    //choose_currency

    // ** Dialog & Modal Management: **
    //popdialog
    //execute
    canceldialog_click();
    //canceldialog_trigger
    //canceldialog
    //render_html
    //render_attributes 
    //template_dialog
    //update_page_title

    // ** Payment Dialog Control: **
    block_cancel_paymentdialog();
    cancel_paymentdialog_trigger();
    //unfocus_inputs
    //cpd_pollcheck
    //cancel_paymentdialog
    //hide_paymentdialog
    //reset_paymentdialog
    cancel_sharedialog_trigger();
    //cancel_sharedialog

    // ** Options & UI Panel Management: **
    showoptionstrigger();
    //showoptions
    //canceloptions_trigger
    //canceloptions
    //clearoptions
    //lockscreen
    newrequest_alias();
    newrequest();
    confirm_ms_newrequest();
    showtransaction_trigger();
    showtransactions();
    addressinfo();
    show_pk();
    //show_pk_cb
    show_vk();
    //show_vk_cb
    refresh_request_states();

    // ** Notifications: **
    //notify
    closenotifytrigger();
    //closenotify
    //topnotify
    //popnotify

    // ** Form & Input Handling: **
    radio_select();
    check_pk();
    //pinpanel
    //generate_pinpad_html
    //switch_panel
    //all_pinpanel

    // ** Address & Seed Management: **
    addcurrencytrigger();
    //addcurrency
    //derive_first_check
    addaddress_trigger();
    //addaddress
    address_xpub_change();
    //active_derives
    get_wallet();
    submit_address_trigger();
    add_lightning();
    trigger_add_erc20();
    //add_erc20
    autocomplete_erc20token();
    pick_erc20_select();
    //init_addressform
    submit_erc20();
    //validate_address_vk
    //validate_address
    //check_address
    //check_vk
    send_trigger();
    showbip39_trigger();
    check_recent();

    // ** Request Management: **
    request_history();
    //recent_requests
    //recent_requests_list
    show_request_details();
    toggle_request_meta();
    showrequests();
    showrequests_inline();
    editaddress_trigger();
    remove_address();
    //remove_address_function
    rec_payments();
    edit_request();
    submit_request_description();
    receipt();
    download_receipt();
    share_receipt();
    //get_pdf_url

    // ** Archive Management: **
    archive();
    //archivefunction
    unarchive();
    //unarchive_function
    remove_request();
    //remove_request_function

    // ** Transaction History: **
    //add_historical_data
    //animate_confbar
    show_transaction_meta();
    hide_transaction_meta();
    //lnd_lookup_invoice

    // ** Seed & Security: **
    confirm_missing_seed();
    //get_address_warning
    confirm_missing_seed_toggle();
    //cmst_callback
    //add_seed_whitelist
    //seed_wl
    //add_address_whitelist
    //addr_whitelist

    // ** Address Reordering: **
    dragstart();
    //drag
    dragend();

    // ** URL & Link Handling: **
    //check_intents
    //expand_shorturl
    //expand_bitly_url
    //open_blockexplorer_url
    //blockexplorer_url
    //get_blockexplorer
    apisrc_shortcut();
    //try_next_api

    // ** App Install & Platform: **
    setTimeout(function() { // wait for ios app detection
        check_app_install_prompt();
        console.log({
            glob_const
        });
    }, 700);
    //show_app_download_prompt
    close_app_panel();
    //platform_icon
    gk();
    glob_const.html.addClass("loaded");

    // ** Recent Request Management: **
    //check_rr
    //toggle_rr

    // ** Lightning Network: **
    //ln_connect

    // ** Page Building & Rendering: **
    rendercurrencies();
    setTimeout(function() {
        loadurl(); //initiate page
    }, 100);
    //render_currencysettings
    //build_settings
    //render_settings
    render_requests();
    //archive_button
    //fetch_requests
    //initiate
    //buildpage
    //append_coinsetting
    //setting_sub_address
    //append_address
    //append_request

    // ** Storage Management: **
    //save_currencies
    //save_addresses
    //save_requests
    //save_archive
    //save_settings
    //save_cc_settings
    //update_changes
    //reset_changes
    //save_changestats
    render_changes();
    //change_alert
    //get_total_changes

    // ** Utility Functions: **
    //amountshort
    check_params();
    const ap = all_proxies(),
        all_tor_proxies = filter_object_array(ap, "tor", true);
    glob_let.tor_proxies = filter_object_array(all_tor_proxies, "tor", true);
    visibility_change();
}

// Updates HTML document language and meta tag attributes based on current language code
function set_locales() {
    glob_const.html.attr("lang", langcode);
    $("meta[property='og:locale']").attr("content", langcode);
    $("meta[property='og:url']").attr("content", glob_const.w_loc.href);
}

// Sets selected stylesheer
function set_theme() {
    const filename = $("#themesettings").data("selected");
    if (filename) {
        if (filename === "default.css") {
            return
        }
        const version = $("#ua").attr("data-version");
        $("link#theme").attr("href", d_proxy() + "/proxy/v1/themes/" + filename + "?v=" + version);
    }
}

// Sets HTML element data-role based on user permission level
function set_permissions() {
    const permission = $("#permissions").data("selected");
    glob_const.html.attr("data-role", permission);
}

// Returns true if current user has cashier (view-only) permissions
function is_viewonly() {
    const permission = $("#permissions").data("selected");
    return permission === "cashier";
}

// ** PIN & Security: **

// Validates PIN configuration and optional locktime settings from DOM data attributes
function check_pin_enabled(check_exists) {
    const pin_data = $("#pinsettings").data(),
        pin_hash = pin_data.pinhash;
    if (pin_hash) {
        const pin_str = pin_hash.toString(),
            valid_length = pin_str.length > 3;
        if (valid_length) {
            if (check_exists) {
                return true
            }
            return pin_data.locktime !== "never";
        }
    }
    return false
}

// Determines if app requires unlock based on configured timeout and last activity timestamp
function check_pin_lock() {
    const url_params = get_urlparameters(),
        lock_duration = $("#pinsettings").data("locktime"),
        last_lock = br_get_local("locktime"),
        time_since_lock = now_utc() - last_lock,
        lock_seconds = parseFloat(lock_duration);
    return url_params.payment ? false : (check_pin_enabled() === true && time_since_lock > lock_seconds);
}

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
function pinpress_trigger() {
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
            return false
        }
        pin_field.val(updated_pin);
        setTimeout(function() {
            pin_container.addClass("validatepin").removeClass("enterpin");
        }, 100);
        return false
    }
    if (updated_pin.length > 4) {
        return false
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
        hashed_pin = generate_hash(pin_input),
        timestamp = now_utc(),
        is_global = pin_container.hasClass("global");
    if (hashed_pin == stored_pin) {
        if (is_global) {
            br_set_local("locktime", timestamp);
            finish_functions();
            setTimeout(function() {
                play_audio("waterdrop");
                canceloptions(true);
            }, 500);
        } else if (pin_container.hasClass("admin")) {
            br_set_local("locktime", timestamp);
            loadpage("?p=currencies");
            $(".currenciesbttn .self").addClass("activemenu");
            play_audio("waterdrop");
            canceloptions(true);
        } else if (pin_container.hasClass("reset")) {
            br_set_local("locktime", timestamp);
            $("#pintext").text(tl("enternewpin"));
            pin_container.addClass("p_admin").removeClass("pinwall reset");
            play_audio("waterdrop");
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
            play_audio("waterdrop");
            canceloptions(true);
        }
        pin_config.attempts = 0;
        save_settings(is_global);
        remove_cashier();
    } else {
        if (!navigator.vibrate) {
            play_audio("funk");
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
        save_settings(is_global);
    }
}

// Resets PIN lockout state by clearing timeout and attempt counters
function clearpinlock() {
    const pin_config = $("#pinsettings").data();
    pin_config.timeout = null;
    pin_config.attempts = 0;
    save_settings();
}

// Initializes click handler for PIN reset functionality
function pin_admin_reset() {
    $(document).on("click", "#reset_pin", function() {
        $("#pinfloat").removeClass("p_admin");
    });
}

// Sets up click handlers for PIN confirmation pad
function pinvalidate_trigger() {
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
                pin_hash = generate_hash(updated_input),
                pin_status = "pincode activated",
                lock_duration = pin_settings.data("locktime");
            pin_settings.data({
                "pinhash": pin_hash,
                "locktime": lock_duration,
                "selected": pin_status
            }).find("p").text(pin_status);
            save_settings();
            play_audio("waterdrop");
            canceloptions(true);
            const pin_callback = pin_container.data("pincb");
            if (pin_callback) {
                pin_callback.func(pin_callback.args);
            }
            notify(tl("datasaved"));
            encrypt_seed_data(seed_decrypt(old_pin));
        } else {
            topnotify(tl("pinmatch"));
            if (navigator.vibrate) {} else {
                play_audio("funk");
            }
            shake(pin_container);
            confirm_field.val("");
        }
    }
    if (updated_input.length > 4) {
        return false
    }
    confirm_field.val(updated_input);
    pin_button.addClass("activepad");
    setTimeout(function() {
        pin_button.removeClass("activepad");
    }, 500);
    $("#pincode .pinpad").not(pin_button).removeClass("activepad");
}

// Binds click handler for PIN backspace in entry mode
function pinback_trigger() {
    $(document).on("click", "#optionspop #pinfloat.enterpin #pinback", function() {
        pinback($("#pininput"));
    });
}

// Binds click handler for PIN backspace in validation mode
function pinback_validate_trigger() {
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
                finish_functions();
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
            return
        }
        cancel_url_dialogs();
    });
}

// Routes to appropriate function based on page type and event
function loadfunction(page_name, event_type) {
    if (event_type === "payment") { //load paymentpopup if payment is set
        load_request();
        return
    }
    if (event_type === "both") { //load paymentpopup if payment is set and load page
        loadpageevent(page_name);
        setTimeout(function() {
            load_request("delay");
        }, 1000);
        return
    }
    loadpageevent(page_name);
    const page_translation = tl(page_name),
        display_title = page_translation || page_name;
    update_page_title(display_title);
    cancel_url_dialogs();
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
    const request_filter = get_urlparameters().filteraddress; // filter requests if filter parameter exists
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
function active_menu() {
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
        toggle_fixed_nav($(document).scrollTop());
    });
}

// Closes active dialogs when URL changes
function cancel_url_dialogs() {
    if (is_openrequest()) {
        cancel_paymentdialog();
    }
    if (glob_const.body.hasClass("showcam")) {
        $("#closecam").trigger("click");
    }
}

// Manages URL routing and page transitions for iOS app integration
function ios_redirections(url) {
    if (!url) return
    const query_string = get_search(url),
        url_params = parse_url_params(query_string);
    if (url_params.xss) return
    const current_url = glob_const.w_loc.href.toUpperCase(),
        new_url = url.toUpperCase();
    if (current_url === new_url) return
    if (br_get_local("editurl") === glob_const.w_loc.search) return
    const is_payment = new_url.includes("PAYMENT=");
    if (is_payment) {
        if (is_openrequest()) {
            cancel_paymentdialog();
            setTimeout(function() {
                openpage(url, "", "payment");
            }, 1000);
            return
        }
        openpage(url, "", "payment");
        refresh_request_states();
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
    if (is_opendialog()) {
        canceldialog();
        setTimeout(function() {
            check_params(url_params);
        }, 1000);
        return
    }
    check_params(url_params);
}

// (Can only be envoked from the IOS app), Configures app for iOS-specific behaviors and adds iOS identifier
function ios_init() {
    glob_const.is_ios_app = true;
    glob_const.body.addClass("ios"); // ios app fingerprint
}

// ** Request & Payment Handling: **

// Initializes transaction trigger click handlers
function triggertx() {
    $(document).on("click", ".currencylist li > .rq_icon", function() {
        triggertx_function($(this));
        canceloptions();
    });
}

// Processes transaction initiation and validation
function triggertx_function(trigger_elem) {
    const currency = trigger_elem.data("currency");
    if (!set_up()) {
        if (currency === "bitcoin") {
            init_bitcoin_select_dialog();
            return
        }
        if (currency === "ethereum") {
            init_eth_select_dialog();
            return
        }
        choose_currency(currency);
        return
    }
    const can_derive = derive_first_check(currency);
    if (can_derive === true) {
        triggertx_function(trigger_elem);
        return
    }
    const address_data = get_address_data(currency);
    if (address_data) {
        const wallet_address = address_data.address,
            request_title = trigger_elem.attr("title"),
            saved_url = trigger_elem.data("url"),
            seed_id = address_data.seedid;
        if (seed_id) {
            if (seed_id !== glob_let.bipid) {
                if (!addr_whitelist(wallet_address)) {
                    const dialog_data = {
                            "currency": currency,
                            "address": wallet_address,
                            "url": saved_url,
                            "title": request_title,
                            "seedid": seed_id
                        },
                        warning_content = get_address_warning("addresswarning", wallet_address, dialog_data);
                    popdialog(warning_content, "triggersubmit");
                    return false
                }
            } else {
                if (validate_trial_status() === false) {
                    return false
                }
            }
        }
        finishtx_function(currency, wallet_address, saved_url, request_title);
        return
    }
    choose_currency(currency);
}

// Completes transaction processing and URL generation
function finishtx_function(currency, wallet_address, saved_url, display_title) {
    glob_let.prevkey = false;
    const url_params = get_urlparameters();
    if (url_params.xss) {
        return
    }
    const coin_data = get_coin_config(currency),
        settings = $("#currencysettings").data(),
        use_default = settings.default,
        currency_symbol = (use_default === true && glob_const.offline === false) ? settings.currencysymbol : coin_data.ccsymbol,
        current_page = url_params.p,
        page_prefix = current_page ? "?p=" + current_page + "&payment=" : "?payment=",
        url_base = page_prefix + currency + "&uoa=",
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
        if (glob_const.offline && request_btn.hasClass("isfiat")) {
            // do not trigger fiat request when offline because of unknown exchange rate
            notify(tl("xratesx"));
            return
        }
        const request_item = request_btn.closest("li.rqli"),
            request_data = request_item.data(),
            layer2_network = request_data.eth_layer2, // detected l2
            payment_type = request_data.payment,
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
            })) : "",
            payment_url = "?p=requests&payment=" + payment_type + "&uoa=" + unit + "&amount=" + payment_amount + url_middle + url_suffix + lightning_params;
        openpage(payment_url, "", "payment");
        return
    });
}

// Closes payment dialog with optional post-scan actions
function close_paymentdialog(post_scan) {
    if (post_scan) {
        const api_data = q_obj(helper, "api_info.data");
        if (api_data) {
            post_scan_init(api_data);
            return
        }
    }
    if (glob_const.inframe) {
        parent.postMessage("close_request_confirm", "*");
        return
    }
    cancel_paymentdialog();
    continue_cpd();
}

// Handles post-payment dialog closing states
function continue_cpd() {
    if (glob_const.html.hasClass("firstload")) {
        const url_params = get_urlparameters(),
            page_name = url_params.p,
            target_page = page_name || "home";
        openpage("?p=" + target_page, target_page, "loadpage");
        return
    }
    window.history.back();
}

// Initializes post-scan transaction verification
function post_scan_init(api_data) {
    if (is_scanning()) return
    glob_let.rpc_attempts = {};
    glob_let.post_scan = true;
    const setconfirmations = request.set_confirmations || 0,
        scan_params = { // request data object
            "request_timestamp": request.rq_init,
            setconfirmations,
            "pending": "scanning",
            "erc20": request.erc20,
            "cachetime": 20,
            "source": "post_scan"
        };
    post_scan(request, api_data, scan_params);
}

// Performs final transaction scan verification
function post_scan(request_data, api_data, scan_params) {
    if (glob_const.inframe) {
        loader(true);
        set_loader_text(tl("lookuppayment", {
            "currency": request_data.payment,
            "blockexplorer": api_data.name
        }));
    } else {
        hide_paymentdialog();
    }
    route_api_request(request_data, api_data, scan_params);
    socket_info(api_data, true);
}

// Handles failed post-scan verification
function cancel_post_scan() {
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
            stored_requests = br_get_local("recent_requests", true),
            requests_array = get_default_object(stored_requests, true),
            payment_data = {
                currency,
                "cmcid": request.cmcid,
                "ccsymbol": request.currencysymbol,
                "address": request.address,
                "erc20": request.erc20,
                "rqtime": request.rq_init
            };
        requests_array[currency] = payment_data;
        br_set_local("recent_requests", requests_array, true);
    }
}

// ** UI Components: **

// Toggles currency visibility and handles state updates
function toggle_currency() {
    $(document).on("click", ".togglecurrency", function() {
        const currency_item = $(this).closest("li"),
            currency_data = currency_item.data(),
            currency = currency_data.currency,
            is_enabled = currency_data.checked,
            home_item = get_homeli(currency);
        if (is_enabled === true) {
            currency_item.attr("data-checked", "false").data("checked", false);
            home_item.addClass("hide");
            save_currencies(false);
        } else {
            const stored_currency = br_get_local("cc_" + currency);
            if (stored_currency) {
                const address_list = get_addresslist(currency),
                    active_addresses = address_list.find("li[data-checked='true']").length;
                if (active_addresses === 0) {
                    address_list.find("li[data-checked='false']").first().find(".toggleaddress").trigger("click");
                } else {
                    currency_item.attr("data-checked", "true").data("checked", true);
                    home_item.removeClass("hide");
                }
                save_currencies(false);
            } else {
                addcurrency(currency_data);
            }
        }
    });
}

// Controls address visibility and validation state
function toggle_address() {
    $(document).on("click", ".toggleaddress", function() {
        const address_item = $(this).closest("li"),
            is_active = address_item.data("checked"),
            address_list = address_item.closest("ul.pobox"),
            active_count = address_list.find("li[data-checked='true']").length,
            currency = address_list.attr("data-currency");
        if (is_active === true || is_active === "true") {
            address_item.attr("data-checked", "false").data("checked", false);
        } else {
            const address_data = address_item.data();
            if (address_item.hasClass("seedu")) {
                const wallet_address = address_data.address,
                    seed_id = address_data.seedid;
                if (!addr_whitelist(wallet_address)) {
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
                if (!addr_whitelist(wallet_address)) {
                    const has_pub_key = has_xpub(currency),
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
        save_addresses(currency, false);
        check_currency(currency);
        clear_savedurl();
    });
}

// Updates currency status based on active address count
function check_currency(currency) {
    const active_addresses = filter_addressli(currency, "checked", true).length;
    if (active_addresses > 0) {
        currency_check(currency);
        return
    }
    currency_uncheck(currency);
}

// Activates currency and updates associated UI elements
function currency_check(currency) {
    const home_item = get_homeli(currency),
        currency_item = get_currencyli(currency);
    home_item.removeClass("hide");
    currency_item.attr("data-checked", "true").data("checked", true);
    // On app initiation
    const init_currency = set_up() ? null : currency;
    save_currencies(false, init_currency);
}

// Deactivates currency and updates associated UI elements  
function currency_uncheck(currency) {
    const home_item = get_homeli(currency),
        currency_item = get_currencyli(currency);
    home_item.addClass("hide");
    currency_item.attr("data-checked", "false").data("checked", false);
    save_currencies(false);
}

// Manages global switch toggle states
function toggle_switch() {
    $(document).on("mousedown", ".switchpanel.global", function() {
        const ts = $(this);
        if (ts.hasClass("true")) {
            ts.removeClass("true").addClass("false");
        } else {
            ts.removeClass("false").addClass("true");
        }
    })
}

// ** Selectbox **
// Displays selectbox options dropdown
function show_select_options() {
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

// Hides all open selectboxes in popup
function hide_select_options() {
    $("#popup .selectbox .options").removeClass("showoptions");
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
    set_loader_text(tl("loading"));
}

// Updates loading overlay text content
function set_loader_text(loader_text) {
    $("#loader #loadtext > span").text(loader_text);
}

// ** Scanner & QR: **

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
        glob_let.currencyscan = currency;
        glob_let.scantype = type;
        const current_page = get_urlparameters().p,
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
        set_loader_text(tl("loadingcamera"));
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
            return
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
    glob_let.currencyscan = null;
}

// Routes QR scan results to appropriate handlers
function set_scan_result(result) {
    if (result) {
        glob_const.scanner.stop();
        const payment_type = glob_let.currencyscan,
            scan_subtype = glob_let.scantype;
        if (scan_subtype === "lnconnect") {
            handle_ln_connect(result, payment_type);
        } else if (scan_subtype === "address") {
            handle_address(result, payment_type);
        } else if (scan_subtype === "viewkey") {
            handle_viewkey(result, payment_type);
        } else if (scan_subtype === "add_node") {
            handle_node_url(result);
        } else if (scan_subtype === "xmrrpc") {
            handle_xmrrpc(result);
        }
        window.history.back();
        return false
    }
}

// Processes Lightning Network connection QR codes
function handle_ln_connect(result, payment) {
    const params_url = renderlnconnect(result);
    if (params_url) {
        const rest_url = params_url.resturl,
            macaroon = params_url.macaroon || params_url.rune;
        if (rest_url && macaroon) {
            const decoded_mac = (payment === "core-lightning") ? macaroon : b64urldecode(macaroon);
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
    reset_xpub_form();
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

// Validates URL / IP QR codes
function handle_node_url(result) {
    const is_valid_entry = is_valid_url_or_ip(result);
    if (!is_valid_entry) {
        popnotify("error", tl("invalidurl"));
        return
    }
    $("#popup .formbox input#rpc_url_input").val(result);
}

// Validates Monero RPC URI
function handle_xmrrpc(uri) {
    const rpc_uri_obj = parse_monero_rpc_uri(uri);
    if (rpc_uri_obj) {
        const base_url = rpc_uri_obj.base_url;
        if (base_url) {
            const is_valid_entry = is_valid_url_or_ip(base_url);
            if (is_valid_entry) {
                $("#popup .formbox input#rpc_url_input").val(base_url);
                return
            }
        }
    }
    popnotify("error", tl("invalidurl"));
}

// Get XMR RPC url
function parse_monero_rpc_uri(uri) {
    try {
        // Replace custom protocol with http for parsing
        const parsable_uri = uri.replace(/^xmrrpc:\/\//, "http://"),
            url = new URL(parsable_uri),
            username = url.username || "",
            password = url.password || "",
            host = url.hostname,
            port = url.port || false,
            port_string = port ? ":" + port : "",
            base_url = "http://" + host + port_string,
            label = url.searchParams.get("label") || "";
        return {
            base_url,
            username,
            password,
            "label": decodeURIComponent(label),
            "has_credentials": username !== "" && password !== ""
        };
    } catch (error) {
        console.error("Failed to parse Monero RPC URI:", error);
        return null;
    }
}

// ** Helper Functions: **

// Handles external URL opening with loader and browser targeting
function open_url() {
    $(document).on("click", "a.exit", function(e) {
        e.preventDefault();
        const link_elem = $(this),
            target_type = link_elem.attr("target"),
            dest_url = link_elem.attr("href");
        loader(true);
        set_loader_text(tl("loadurl", {
            "url": dest_url
        }));
        if (glob_const.is_ios_app === true) {
            cancel_paymentdialog();
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
    if (rpc_url.indexOf("infura.io") === -1) return "";
    const saved_key = $("#apikeys").data("infura") || to.if_id;
    if (rpc_url) {
        return (/^[A-Za-z0-9]+$/.test(rpc_url.slice(-15))) ? "" : saved_key; // check if rpcurl already contains apikey
    }
    return saved_key;
}

// Returns Alchemy API key from UI data or default
function get_alchemy_apikey() {
    return $("#apikeys").data("alchemy") || to.al_id;
}

// Shows proxy update notification with version comparison
function proxy_alert(version) {
    if (version) {
        glob_const.html.addClass("proxyupdate");
        $("#alert > span").text("!").attr("title", tl("updateproxy", {
            "version": version,
            "proxy_version": glob_const.proxy_version
        }) + " " + d_proxy());
    }
}

// Finds ERC20 token metadata by currency name from cache
function fetch_symbol(currency_name) {
    const token_list = get_cached_tokens();
    return token_list.find(function(token) {
        return token.name === currency_name;
    }) || {};
}

// Toggles fixed navigation based on scroll position
function toggle_fixed_nav(scroll_pos) {
    const header_height = $(".showmain #header").outerHeight();
    if (scroll_pos > header_height) {
        $(".showmain").addClass("fixednav");
        return
    }
    $(".showmain").removeClass("fixednav");
}

// Checks if current URL parameter matches homepage
function ishome(page_name) {
    const current_page = page_name || get_urlparameters().p;
    return !current_page || current_page === "home";
}

// Programmatically triggers submit button click in dialog
function triggersubmit(trigger_elem) {
    trigger_elem.parent("#actions").prev("#dialogbody").find("input.submit").trigger("click");
}

// Copies text to clipboard using modern API or fallback
function copy_to_clipboard(content, content_type) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(content)
            .then(function() {
                notify(content_type + " " + tl("copied"), 2500, "no");
            })
            .catch(function() {
                notify(tl("xcopy") + " " + content_type, 2500, "no");
            });
        return
    }
    glob_let.copycontent.val(content).select();
    try {
        if (document.execCommand("copy")) {
            notify(content_type + " " + tl("copied"), 2500, "no");
        } else {
            notify(tl("xcopy") + " " + content_type, 2500, "no");
        }
    } catch (err) {
        notify(tl("xcopy") + " " + content_type, 2500, "no");
    }
    glob_let.copycontent.val("").removeData("type").blur();
}

// Acquires screen wake lock to prevent display sleep
function prevent_screen_sleep() {
    if (glob_const.wl) {
        const request_wakelock = async () => {
            try {
                glob_let.wakelock = await glob_const.wl.request("screen");
                glob_let.wakelock.addEventListener("release", (e) => {});
            } catch (e) {}
        };
        request_wakelock();
    }
}

// Releases screen wake lock to allow display sleep
function allow_screen_sleep() {
    if (glob_const.wl) {
        if (glob_let.wakelock) {
            glob_let.wakelock.release();
        }
        glob_let.wakelock = null;
    }
}

// Shows notification and plays sound for view-only restrictions
function show_view_only_error() {
    notify(tl("cashiernotallowed"));
    play_audio("funk");
}

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
        day_text = days ? (days < 2) ? days + " " + tl("day") : days + " " + tl("days") : "",
        hour_sep = days ? ", " : "",
        hour_text = hours ? (hours < 2) ? hour_sep + hours + " " + tl("hour") : hour_sep + hours + " " + tl("hours") : "",
        min_sep = hours ? ", " : "",
        min_text = minutes ? (minutes < 2) ? min_sep + minutes + " " + tl("minute") : min_sep + minutes + " " + tl("minutes") : "",
        sec_sep = minutes ? " " + tl("and") + " " : "",
        sec_text = seconds ? sec_sep + seconds + " " + tl("seconds") : "",
        formatted_time = cd ? day_text + hour_text + min_text + sec_text : false;
    return formatted_time;
}

// Registers service worker for offline functionality
function add_serviceworker() {
    if ("serviceWorker" in navigator && !navigator.serviceWorker.controller) {
        navigator.serviceWorker.register("serviceworker.js", {
                "scope": "./"
            })
            .then(function(registration) {}).catch(function(error) {
                // Registration failed
                console.error("error", error);
            });
    }
}

// ** Core Navigation & State Management: **

// Controls navigation toggle based on header clicks and app state
function togglenav() {
    $(document).on("click", "#header", function() {
        if (glob_const.html.hasClass("showmain")) {
            loadpage("?p=home");
            $(".navstyle li .self").removeClass("activemenu");
            return
        }
        if (check_pin_lock() === true) {
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

// Handles escape key and back navigation actions
function escape_and_back() {
    if (glob_const.inframe) {
        const url_params = get_urlparameters();
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
        hide_select_options();
        return
    }
    if ($("#popup").hasClass("active")) {
        canceldialog();
        return
    }
    if ($("#sharepopup").hasClass("active")) {
        cancel_sharedialog();
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
    if (is_openrequest()) {
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

// Manages keyboard input actions across app
function keyup() {
    $(document).keyup(function(e) {
        if (e.keyCode === 39) { // ArrowRight
            if (glob_const.paymentdialogbox.find("input").is(":focus")) {
                play_audio("funk");
                return
            }
            const time_passed = now_utc() - glob_let.sa_timer;
            if (time_passed < 500) { // prevent clicking too fast
                play_audio("funk");
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
            if (glob_const.paymentdialogbox.hasClass("norequest") && (glob_const.paymentdialogbox.attr("data-pending") === "ispending")) {
                play_audio("funk");
                return
            }
            flip_right1();
            glob_let.sa_timer = now_utc();
            return
        }
        if (e.keyCode === 37) { // ArrowLeft
            if (glob_const.paymentdialogbox.find("input").is(":focus")) {
                play_audio("funk");
                return
            }
            const time_passed = now_utc() - glob_let.sa_timer;
            if (time_passed < 500) { // prevent clicking too fast
                play_audio("funk");
                return
            }
            glob_const.paymentpopup.removeClass("flipping");
            if (glob_const.paymentdialogbox.hasClass("flipped")) {
                flip_left2();
                return
            }
            if (glob_const.paymentdialogbox.hasClass("norequest") && (glob_const.paymentdialogbox.attr("data-pending") === "ispending")) {
                play_audio("funk");
                return
            }
            flip_left1();
            setTimeout(function() {
                glob_const.paymentpopup.addClass("flipping");
                glob_const.paymentdialogbox.css("-webkit-transform", "rotateY(180deg)");
            }, 400);
            glob_let.sa_timer = now_utc();
            return
        }
        if (e.keyCode === 27) { // Escape
            escape_and_back();
            return
        }
        if (e.keyCode === 13) { // Enter
            if ($("#popup").hasClass("active")) {
                $("#popup #execute").trigger("click");
            }
            return
        }
    });
}

// Checks if modal dialog is currently displayed
function is_opendialog() {
    return $("#dialogbody > div.formbox").length > 0;
}

// ** Intro Flow: **

// Select on chain or lightning dialog
function init_bitcoin_select_dialog() {
    const ddat = [{
        "ul": {
            "id": "click_list",
            "class": "cl_btc",
            "content": [{
                    "li": {
                        "id": "init_btc",
                        "content": "<img src='" + c_icons("btc-bitcoin") + "'/> On chain <span class='icon-link'/>"
                    }
                },
                {
                    "li": {
                        "id": "init_lnd",
                        "content": "<img src='img_logos_btc-lnd.png'/> Lightning <span class='icon-power'/>"
                    }
                }
            ]
        }
    }];
    const content = template_dialog({
        "id": "btc_formbox",
        "elements": ddat
    });
    popdialog(content, "canceldialog");
}

// Select on chain or lightning
function init_bitcoin_select() {
    $(document).on("click", "#click_list.cl_btc li", function() {
        canceldialog();
        const this_id = $(this).attr("id"),
            timeout = setTimeout(function() {
                if (this_id === "init_btc") {
                    choose_currency("bitcoin");
                    return
                }
                if (this_id === "init_lnd") {
                    render_lightning_interface();
                    return
                }
            }, 600, function() {
                clearTimeout(timeout);
            });
    });
}

// Select ethereum or erc20 dialog
function init_eth_select_dialog() {
    const ddat = [{
        "ul": {
            "id": "click_list",
            "class": "cl_eth",
            "content": [{
                    "li": {
                        "id": "init_eth",
                        "content": "<img src='" + c_icons("eth-ethereum") + "'/> Ethereum"
                    }
                },
                {
                    "li": {
                        "id": "init_erc20",
                        "content": "<img src='" + fetch_aws("etherscan") + ".png'/> Erc20 token"
                    }
                }
            ]
        }
    }];
    const content = template_dialog({
        "id": "btc_formbox",
        "elements": ddat
    });
    popdialog(content, "canceldialog");
}

// Select ethereum or erc20
function init_eth_select() {
    $(document).on("click", "#click_list.cl_eth li", function() {
        canceldialog();
        const this_id = $(this).attr("id"),
            timeout = setTimeout(function() {
                if (this_id === "init_eth") {
                    choose_currency("ethereum");
                    return
                }
                if (this_id === "init_erc20") {
                    add_erc20();
                    return
                }
                choose_currency("ethereum");
            }, 600, function() {
                clearTimeout(timeout);
            });
    });
}

// Handles currency selection and adds associated address
function choose_currency(currency) {
    const currency_data = get_coin_config(currency);
    addaddress({
        "currency": currency,
        "ccsymbol": currency_data.ccsymbol,
        "cmcid": currency_data.cmcid,
        "erc20": false,
        "checked": true
    }, false);
}

// ** Dialog & Modal Management: **

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

// Initializes click handler for dialog cancellation
function canceldialog_click() {
    $(document).on("click", ".cancel_dialog", canceldialog);
}

// Sets up dialog closing event listeners  
function canceldialog_trigger() {
    $(document).on("mousedown", "#popup", function(event) {
        const target = event.target,
            jtarget = $(target),
            target_id = jtarget.attr("id"),
            options = $("#dialog").find(".options");
        if (options.length > 0 && (options.hasClass("showoptions") || options.hasClass("show_options"))) {
            const pointer_event = jtarget.attr("data-pe");
            if (pointer_event !== "none") {
                options.removeClass("showoptions");
            }
            if (pointer_event !== "block") {
                options.removeClass("show_options");
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

// Recursively converts data object into HTML with attributes and nested content
function render_html(element_data) {
    return element_data.map(function(component) {
        return Object.entries(component).map(function([tag_name, props]) {
            const elem_id = props.id ? " id='" + props.id + "'" : "",
                elem_class = props.class ? " class='" + props.class + "'" : "",
                elem_attrs = props.attr ? render_attributes(props.attr) : "",
                elem_content = props.content ?
                (typeof props.content === "object" ?
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

// Updates document title and meta tags
function update_page_title(page_title) {
    const full_title = page_title + " | " + glob_const.apptitle;
    glob_const.titlenode.text(full_title);
    glob_const.ogtitle.attr("content", full_title);
}

// ** Payment Dialog Control: **

// Prevents dialog close when inputs are focused
function block_cancel_paymentdialog() {
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
function cancel_paymentdialog_trigger() {
    $(document).on("mouseup", "#payment", function(event) {
        if (glob_let.blockswipe === true) {
            unfocus_inputs();
            return
        }
        if (glob_const.html.hasClass("flipmode")) { // prevent closing request when flipping
            return
        }
        const time_elapsed = now_utc() - glob_let.cp_timer;
        if (time_elapsed < 1500) { // prevent clicking too fast
            play_audio("funk");
            console.log("clicking too fast");
            return
        }
        if (event.target === this) {
            escape_and_back();
            glob_let.cp_timer = now_utc();
        }
    });
}

// Removes focus from all input fields
function unfocus_inputs() {
    glob_const.paymentdialogbox.find("input").blur();
}

// Validates polling conditions before closing payment dialog
function cpd_pollcheck() {
    if (request) {
        if (q_obj(request, "received") !== true) {
            const request_timer = request.rq_timer,
                request_time = now_utc() - request_timer;
            if (request_time > glob_const.post_scan_timeout) {
                if (empty_obj(glob_let.sockets)) { // No post_scan when polling
                    close_paymentdialog();
                    return
                }
                const post_scan = (request.address === "lnurl") ? false : true;
                close_paymentdialog(post_scan);
                return
            }
        }
    }
    close_paymentdialog();
}

// Cancels payment dialog and resets states
function cancel_paymentdialog() {
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
    clear_dialog_timeout();
    stop_monitors();
    closenotify();
    allow_screen_sleep();
    stop_nfc_scan();
    clear_polling_timeout();
    glob_let.lnd_ph = false,
        request = null,
        helper = null,
        glob_let.l2s = {},
        glob_let.apikey_fails = false,
        glob_let.post_scan = false;
    reset_overflow(); // reset overflow limits
    const socket_timeout = setTimeout(function() {
        close_socket();
    }, 500, function() {
        clearTimeout(socket_timeout);
    });
}

// Initializes share dialog cancellation handler
function cancel_sharedialog_trigger() {
    $(document).on("click", "#sharepopup", function(event) {
        if (event.target === this) {
            cancel_sharedialog();
        }
    });
}

// Closes share dialog and resets UI
function cancel_sharedialog() {
    const share_popup = $("#sharepopup");
    share_popup.removeClass("active");
    glob_const.body.removeClass("sharemode");
    const dialog_timeout = setTimeout(function() {
        share_popup.removeClass("showpu");
    }, 500, function() {
        clearTimeout(dialog_timeout);
    });
}

// ** Options & UI Panel Management: **

// Sets up event listener for showing options
function showoptionstrigger() {
    $(document).on("click", ".popoptions", function(event) {
        const addr_data = $(this).closest("li").data(),
            address = addr_data.address;
        if (address === "lnurl") {
            play_audio("funk");
            return
        }
        const saved_request = $("#requestlist li[data-address='" + address + "']"),
            show_requests = (saved_request.length > 0) ? "<li><div class='showrequests'><span class='icon-qrcode'></span> " + tl("showrequests") + "</div></li>" : "",
            new_request = (addr_data.checked === true) ? "<li>\
                <div data-rel='' class='newrequest' title='create request'>\
                    <span class='icon-plus'></span>" + tl("newrequest") + "</div>\
            </li>" : "",
            options_content = $("\
                <ul id='optionslist''>" + new_request + show_requests +
                "<li><div class='address_info'><span class='icon-info'></span> " + tl("addressinfo") + "</div></li>\
                    <li><div class='editaddress'> <span class='icon-pencil'></span> " + tl("editlabel") + "</div></li>\
                    <li><div class='removeaddress'><span class='icon-bin'></span> " + tl("removeaddress") + "</div></li>\
                    <li><div id='rpayments'><span class='icon-history'></span> " + tl("recentpayments") + "</div></li>\
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
            if (now_utc() > pin_timeout) {
                pin_settings.timeout = null;
                save_settings();
            } else {
                lockscreen(pin_timeout);
                return false
            }
        }
    }
    const extra_class = add_class ? " " + add_class : "";
    $("#optionspop").addClass("showpu active" + extra_class);
    $("#optionsbox").html(content);
    glob_const.body.addClass("blurmain_options");
}

// Initializes event listeners for canceling option dialogs
function canceloptions_trigger() {
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
            return
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

// Displays lock screen with countdown
function lockscreen(timeout) {
    const time_left = timeout - now_utc(),
        countdown_data = countdown(time_left),
        days_str = (countdown_data.days) ? countdown_data.days + " " + tl("days") + "<br/>" : "",
        hours_str = (countdown_data.hours) ? countdown_data.hours + " " + tl("hours") + "<br/>" : "",
        mins_str = (countdown_data.minutes) ? countdown_data.minutes + " " + tl("minutes") + "<br/>" : "",
        secs_str = (countdown_data.seconds) ? countdown_data.seconds + " " + tl("seconds") : "",
        countdown_text = days_str + hours_str + mins_str + secs_str,
        unlock_attempts = $("#pinsettings").data("attempts"),
        has_seed = (glob_let.hasbip || glob_let.cashier_seedid) ? true : false,
        unlock_seed_btn = (has_seed === true && unlock_attempts > 5) ? "<p id='seed_unlock' class='linkcolor'>" + tl("unlockwithsecretphrase") + "</p>" : "",
        lock_content = "<h1 id='lock_heading'>" + glob_const.apptitle + "</h1><div id='lockscreen'><h2><span class='icon-lock'></span></h2><p class='tmua'>" + tl("tomanyunlocks") + "</p>\
        <p><br/>" + tl("tryagainin") + "<br/>" + countdown_text + "</p>" + unlock_seed_btn +
        "<div id='phrasewrap'>\
            <p><br/>" + tl("enter12words") + "</p>\
                <div id='bip39phrase' contenteditable='contenteditable' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' lang='en' class='noselect'></div>\
                <div id='phrase_login' class='button'>Unlock</div>\
            </div>\
        </div>";
    $("#optionspop").addClass("showpu active pin ontop");
    $("#optionsbox").html(lock_content);
    glob_const.body.addClass("blurmain_options");
}

// Creates new request using alias
function newrequest_alias() {
    $(document).on("click", "#newrequest_alias", function() {
        const currency_list = $("#currencylist"),
            active_coins = currency_list.find("li").not(".hide"),
            active_count = active_coins.length;
        if (active_count === 0) {
            notify(tl("noactivecurrencies"));
            return
        }
        if (active_count > 1) {
            const list_content = "<ul id='alias_currencylist' class='currencylist'>" + currency_list.html() + "</ul>";
            showoptions(list_content);
            return
        }
        const coin_trigger = active_coins.find(".rq_icon").first();
        triggertx_function(coin_trigger);
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
                if (!addr_whitelist(address)) {
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
            } else if (validate_trial_status() === false) {
                canceloptions();
                return
            }
        }
        canceloptions();
        finishtx_function(currency, address, null, btn_title);
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
        if (!key_confirmed) {
            popnotify("error", tl("confirmpkownership"));
            return
        }
        if (save_confirmed == true) { // whitlist seed id
            add_address_whitelist(dialog_data.address);
        }
        canceloptions();
        canceldialog();
        finishtx_function(dialog_data.currency, dialog_data.address, null, dialog_data.title);
        return
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
                        const user_confirm = confirm(tl("openinvoice", {
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
                play_audio("funk");
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
            currency = dialog_data.currency,
            derive_index = dialog_data.derive_index,
            purpose = dialog_data.purpose,
            address = dialog_data.address,
            hasbip32 = has_bip32(currency),
            bip32_data = hasbip32 ? get_bip32dat(currency) : null;
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
            xpub_id = dialog_data.xpubid,
            seed_id = dialog_data.seedid,
            source_type = seed_id ? "seed" : xpub_id ? "xpub" : false,
            pk_verified = "Unknown <span class='icon-checkmark'></span>",
            show_label = tl("show"),
            addr_whitelist_status = addr_whitelist(address),
            active_xpub_data = active_xpub(currency),
            xpub = source_type === "xpub",
            is_seed = source_type === "seed",
            is_active_source = is_seed ? (seed_id === glob_let.bipid) : (xpub ? (active_xpub_data && xpub_id === active_xpub_data.key_id) : false),
            view_key = dialog_data.vk,
            view_key_obj = view_key ? vk_obj(view_key) : false,
            view_key_data = view_key_obj ? (is_seed && is_active_source ? "derive" : view_key_obj.vk) : false,
            pk_display = view_key_data ? "<span id='show_vk' class='ref' data-vk='" + view_key_data + "'>" + show_label + "</span>" :
            is_seed ? is_active_source ? "<span id='show_pk' class='ref'>" + show_label + "</span>" :
            addr_whitelist_status ? pk_verified : "Unknown" : pk_verified,
            privatekey_label = tl("privatekey"),
            label = dialog_data.label || dialog_data.a_id || "",
            restore_btn = is_seed ? (glob_let.hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + seed_id + "'>" + tl("resoresecretphrase") + "</div>" : "",
            source_label = source_type ? (is_active_source) ? source_type + " <span class='icon-checkmark'>" : source_type + " (Unavailable)" + restore_btn : "external",
            path_info = is_seed ? "<li><strong>" + tl("derivationpath") + ":</strong> " + deriv_path + "</li>" : "",
            info_content = $("<div id='ad_info_wrap'><h2>" + currency_icon + " <span>" + label + "</span></h2><ul>\
               <li><strong>" + tl("address") + ": </strong><span class='adbox adboxl select'>" + address + "</span>\
               <div id='qrcodea' class='qrwrap flex'><div class='qrcode'></div>" + currency_icon + "</div>\
               </li>\
               <li><strong>" + tl("source") + ": </strong>" + source_label + "</li>" +
                path_info +
                "<li><strong>" + privatekey_label + ": </strong>" + pk_display +
                "<div id='pk_span'>\
                   <div class='qrwrap flex'>\
                       <div id='qrcode' class='qrcode'></div>" + currency_icon + "</div>\
                       <p id='pkspan' class='adbox adboxl select' data-type='" + privatekey_label + "'></p>\
               </div>\
               </li>\
               <li><div class='showtransactions ref'><span class='icon-eye'></span>" + tl("showtransactions") + "</div></li>\
               </ul>\
           </div>").data(dialog_data);
        popdialog(info_content, "canceldialog");
        $("#qrcodea .qrcode").qrcode(address);
        return false
    })
}

// Shows/hides private key after validating view-only status and handling pin panel
function show_pk() {
    $(document).on("click", "#show_pk", function() {
        if (is_viewonly() === true) {
            show_view_only_error();
            return
        }
        const show_btn = $(this),
            key_panel = $("#pk_span");
        if (key_panel.is(":visible")) {
            key_panel.slideUp(200);
            show_btn.text(tl("show"));
            return
        }
        if (key_panel.hasClass("shwpk")) {
            key_panel.slideDown(200);
            show_btn.text(tl("hide"));
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
            key_object = br_format_keys(key_data.seed, derived_keys, addr_data.bip32dat, addr_data.derive_index, currency),
            private_key = key_object.privkey;
        all_pinpanel({
            "func": show_pk_cb,
            "args": private_key
        }, true, true)
    })
}

// Callback that displays private key in UI and updates QR code
function show_pk_cb(private_key) {
    $("#show_pk").text(tl("hide"));
    $("#pkspan").text(private_key);
    $("#qrcode").qrcode(private_key);
    $("#pk_span").addClass("shwpk").slideDown(200);
    $("#qrcodea").slideUp(200);
}

// Shows/hides view key after validating view-only status and handling pin panel
function show_vk() {
    $(document).on("click", "#show_vk", function() {
        if (is_viewonly() === true) {
            show_view_only_error();
            return
        }
        const show_btn = $(this),
            view_key = show_btn.attr("data-vk"),
            key_panel = $("#pk_span");
        if (key_panel.is(":visible")) {
            key_panel.slideUp(200);
            show_btn.text(tl("show"));
            return
        }
        if (key_panel.hasClass("shwpk")) {
            key_panel.slideDown(200);
            show_btn.text(tl("hide"));
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
    const view_key_text = key_data.svk ? "<br/><strong style='color:#8d8d8d'>" + tl("secretviewkey") + "</strong> <span class='adbox adboxl select' data-type='Viewkey'>" + key_data.svk + "</span><br/>" : "",
        spend_key_text = key_data.ssk ? "<br/><strong style='color:#8d8d8d'>" + tl("secretspendkey") + "</strong> <span class='adbox adboxl select' data-type='Spendkey'>" + key_data.ssk + "</span>" : ""
    $("#show_vk").text(tl("hide"));
    $("#pk_span").html(view_key_text + spend_key_text).addClass("shwpk").slideDown(200);
}

// ** Notifications: **

// Shows notification popup with optional duration and button style
function notify(message, display_time = 4000, button_style = "no") {
    if (inj(message)) return // xss filter
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
    if (inj(message)) return
    const notify_box = $(".popnotify");
    if (result === "error") {
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

// ** Form & Input Handling: **

// Handles input interaction for selectbox elements
function handle_select_input() {
    $(document).on("click", ".selectbox > input:not([readonly])", function() {
        const select_input = $(this),
            current_value = select_input.val(),
            options = select_input.parent(".selectbox").find(".options"),
            option_items = options.find("span");
        if (options.hasClass("show_options")) {
            options.removeClass("show_options");
            option_items.removeClass("show");
            return
        }
        options.addClass("show_options");
        option_items.filter(function() {
            return $(this).text() !== current_value;
        }).addClass("show");
    })
}

// Processes option selection in selectbox dropdown
function handle_option_selection() {
    $(document).on("mousedown", ".selectbox > .options span", function() {
        const selected_option = $(this),
            option_data = selected_option.data(),
            option_text = option_data.value || selected_option.text(),
            parent_box = selected_option.closest(".selectbox"),
            target_input = parent_box.children("input");
        target_input.val(option_text).data(option_data);
        parent_box.find(".options").removeClass("showoptions").children("span").removeClass("show");
    })
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

// Creates PIN entry UI with keypad and admin controls
function pinpanel(panel_class, pin_callback, is_set) {
    const css_class = (panel_class === undefined) ? "" : panel_class,
        header_text = check_pin_enabled(is_set) === true ? tl("pleaseenter") : tl("createpin");
    return $("<div id='pinfloat' class='enterpin" + css_class + "'>\
        <p id='pintext'>" + header_text + "</p>\
        <p id='confirmpin'>" + tl("confirmyourpin") + "</p>\
        <input id='pininput' type='password' readonly='readonly'/>\
        <input id='validatepin' type='password' readonly='readonly'/>\
        <div id='pinkeypad'>" + generate_pinpad_html() + "</div>\
        <div id='pin_admin' class='flex'>\
            <div id='pin_admin_float'>\
                <div id='lock_time'><span class='icomoon'></span> " + tl("locktime") + "</div>\
                <div id='reset_pin'> " + tl("resetpin") + "</div>\
            </div>\
        </div>\
    </div>").data("pincb", pin_callback);
}

// Builds HTML for numeric PIN entry keypad
function generate_pinpad_html() {
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
function switch_panel(switch_state, mode_class) {
    return "<div class='switchpanel " + switch_state + mode_class + "'><div class='switch'></div></div>"
}

// Manages PIN entry dialog with timeout and callback handling
function all_pinpanel(callback, show_top, pin_set) {
    const top_class = (show_top) ? " ontop" : "";
    if (check_pin_enabled(pin_set) === true) {
        const last_lock_time = br_get_local("locktime"),
            time_since_lock = now_utc() - last_lock_time,
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

// ** Address & Seed Management: **

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
        show_view_only_error();
        return
    }
    addaddress(coin_data, false);
}

// Checks for possible address derivation and executes if valid
function derive_first_check(currency) {
    if (has_bip32(currency) === true) {
        const derivation_types = check_derivations(currency);
        if (derivation_types) {
            const has_active_derives = active_derives(currency, derivation_types);
            if (has_active_derives === false) {
                return derive_new_address(currency);
            }
        }
    }
    return false
}

// Initializes address addition click handler
function addaddress_trigger() {
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
        wallet_prompt = "<span id='get_wallet' class='address_option linkcolor' data-currency='" + currency + "'>" + tl("noaddressyet", {
            "currency": currency
        }) + "</span>",
        seed_prompt = "<span id='option_makeseed' class='address_option linkcolor' data-currency='" + currency + "'>" + tl("generatewallet") + "</span>",
        addr_options = glob_let.hasbip ? wallet_prompt : (glob_let.test_derive && bip39_const.c_derive[currency]) ? (has_bip32(currency) === true ? seed_prompt : wallet_prompt) : wallet_prompt,
        notify_html = !set_up() ? "<div class='popnotify' style='display:block'>" + addr_options + "</div>" : "<div class='popnotify'></div>",
        scan_btn = glob_let.hascam && !is_edit ? "<div class='qrscanner' data-currency='" + currency + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        dialog_title = is_edit ? "<h2 class='icon-pencil'>" + tl("editlabel") + "</h2>" : "<h2>" + getcc_icon(addr_data.cmcid, currency_pair_id, addr_data.erc20) + " " + tl("addcoinaddress", {
            "currency": currency
        }) + "</h2>",
        privkey_confirm = is_edit ? "" : "<div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + tl("pkownership") + "</span></div>",
        form_mode_class = is_edit ? "edit" : "add",
        pubkey_class = no_pubkey ? " noxpub" : " hasxpub",
        addr_placeholder = no_pubkey ? tl("entercoinaddress", {
            "currency": currency
        }) : tl("nopub"),
        viewkey_val = addr_data.vk || "",
        has_viewkey = (viewkey_val !== ""),
        viewkey_scan = glob_let.hascam ? "<div class='qrscanner' data-currency='" + currency + "' data-id='viewkey' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        viewkey_input = (currency == "monero") ? has_viewkey ? "" : "<div class='inputwrap'><input type='text' class='vk_input' value='" + viewkey_val + "' placeholder='" + tl("secretviewkey") + "'>" + viewkey_scan + "</div>" : "",
        form_content = $("<div class='formbox form" + form_mode_class + pubkey_class + "' id='addressformbox'>" + dialog_title + notify_html + "<form id='addressform' class='popform'><div class='inputwrap'><input type='text' id='address_xpub_input' class='address' value='" + wallet_address + "' data-currency='" + currency + "' placeholder='" + addr_placeholder + "'" + input_readonly + " autocomplete='off' autocapitalize='off' spellcheck='false'>" + scan_btn + "</div>" + viewkey_input + "<input type='text' class='addresslabel' value='" + addr_label + "' placeholder='" + tl("label") + "' autocomplete='off' autocapitalize='off' spellcheck='false'>\
        <div id='ad_info_wrap' style='display:none'>\
            <ul class='td_box'>\
            </ul>\
            <div id='pk_confirm' class='noselect'>\
                <div id='matchwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + tl("xpubmatch", {
                "currency": currency
            }) + "</span>\
            </div>\
        </div>" + privkey_confirm +
            "<input type='submit' class='submit' value='" + tl("okbttn") + "'></form>").data(addr_data);
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
    $(document).on("input", "#addressformbox.hasxpub #address_xpub_input", function(e) {
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
        reset_xpub_form();
    })
}

// Checks for active derived addresses
function active_derives(currency, derive_type) {
    const addr_items = get_addresslist(currency).children("li");
    if (addr_items.length < 1) {
        return false
    }
    const coin_settings = active_coinsettings(currency);
    if (coin_settings) {
        const reuse_setting = coin_settings["Reuse address"];
        if (reuse_setting) {
            if (reuse_setting.selected === true) {
                return true
            }
        } else {
            return true
        }
    }
    if (derive_type === "seed") {
        const active_seed_addrs = filter_list(addr_items, "seedid", glob_let.bipid).not(".used");
        if (active_seed_addrs.length) {
            const has_pending = ch_pending(active_seed_addrs.first().data());
            if (has_pending === true) {
                return false
            }
        } else {
            return false
        }
    }
    if (derive_type === "xpub") {
        const active_pubkey = active_xpub(currency),
            xpub_id = active_pubkey.key_id,
            active_xpub_addrs = filter_list(addr_items, "xpubid", xpub_id).not(".used");
        if (active_xpub_addrs.length) {
            const has_pending = ch_pending(active_xpub_addrs.first().data());
            if (has_pending === true) {
                return false
            }
        } else {
            return false
        }
    }
    return true
}

// Opens wallet download dialog
function get_wallet() {
    $(document).on("click", "#get_wallet", function() {
        const currency = $(this).attr("data-currency");
        canceldialog();
        setTimeout(function() {
            download_wallet(currency);
        }, 800);
    })
}

// Handles address form submission
function submit_address_trigger() {
    $(document).on("click", "#addressformbox input.submit", function(e) {
        e.preventDefault();
        const form_elem = $(this).closest("#addressformbox");
        if (form_elem.hasClass("noxpub")) {
            validate_address_vk(form_elem.data());
            return
        }
        const addr_input = form_elem.find(".address"),
            addr_value = addr_input.val();
        if (addr_value.length > 103) {
            validate_xpub(form_elem);
            return
        }
        validate_address_vk(form_elem.data());
        return
    })
}

// Opens Lightning node connection dialog
function add_lightning() {
    $(document).on("click", "#connectln", function() {
        render_lightning_interface();
        return
    })
}

// Triggers ERC20 token dialog
function trigger_add_erc20() {
    $(document).on("click", "#add_erc20", function() {
        add_erc20()
        return
    })
}

// Opens ERC20 token addition dialog
function add_erc20() {
    const render_icon = (glob_const.is_safari || glob_let.local),
        token_registry = get_cached_tokens();
    let token_options = "";
    $.each(token_registry, function(key, token) {
        const cmcid = token.cmcid,
            icon_string = render_icon ? "" : "<img src='https://s2.coinmarketcap.com/static/img/coins/64x64/" + cmcid + ".png' class='icon' loading='lazy'/>";
        token_options += "<span data-id='" + cmcid + "' data-currency='" + token.name + "' data-ccsymbol='" + token.symbol.toLowerCase() + "' data-contract='" + token.contract + "' data-pe='none' class='optionwrap'>" + icon_string + token.symbol + " | " + token.name + "</span>";
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
            <h2 class='icon-coin-dollar'>" + tl("adderc20token") + "</h2>\
            <div class='popnotify'></div>\
            <form id='addressform' class='popform'>\
                <div class='selectbox'>\
                    <input type='text' value='' placeholder='" + tl("erc20placeholder") + "' id='ac_input' autocomplete='off' autocapitalize='off' spellcheck='false' pattern='[a-z0-9]*'/>\
                    <div class='selectarrows icon-menu2' data-pe='none'></div>\
                    <div id='ac_options' class='options show_options'>" + token_options + "</div>\
                </div>\
                <div id='erc20_inputs'>\
                <div class='inputwrap'><input type='text' class='address' value='" + eth_addr_value + "' placeholder='" + tl("enteraddress") + "'/>" + scan_button + "</div>\
                <input type='text' class='addresslabel' value='" + eth_label_value + "' placeholder='" + tl("label") + "'/>\
                <div id='pk_confirm' class='noselect'>\
                    <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'>\
                        <span class='checkbox'></span>\
                    </div>\
                    <span>" + tl("pkownership") + "</span>\
                </div></div>\
                <input type='submit' class='submit' value='" + tl("okbttn") + "'/>\
            </form></div>").data(form_data);
    popdialog(dialog_content, "triggersubmit");
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
                init_addressform(token_data);
            } else if (token_symbol.match("^" + search_term) || token_name.match("^" + search_term)) {
                token_option.addClass("show");
            }
        });
    })
}

// Handles the selection of an ERC20 token from the dropdown
function pick_erc20_select() {
    $(document).on("mousedown", "#erc20formbox .selectbox > #ac_options span", function() {
        const selected_token = $(this),
            token_data = {
                "cmcid": selected_token.attr("data-id"),
                "currency": selected_token.attr("data-currency"),
                "ccsymbol": selected_token.attr("data-ccsymbol"),
                "contract": selected_token.attr("data-contract")
            };
        init_addressform(token_data);
    })
}

// Sets up address form for selected ERC20 token
function init_addressform(token_data) {
    const form_container = $("#erc20formbox"),
        input_section = form_container.find("#erc20_inputs"),
        addr_input = form_container.find("input.address"),
        token = token_data.currency;
    form_container.data(token_data);
    addr_input.attr("placeholder", tl("entercoinaddress", {
        "currency": token
    }));
    if (!input_section.is(":visible")) {
        input_section.slideDown(300);
        addr_input.focus();
    }
}

// Processes ERC20 token form submission
function submit_erc20() {
    $(document).on("click", "#erc20formbox input.submit", function(e) {
        e.preventDefault();
        validate_address_vk($("#erc20formbox").data());
    });
}

// Validates the address and view key (if applicable) for the selected currency
function validate_address_vk(addr_data) {
    const label_field = $("#addressform .addresslabel"),
        label_input = label_field.val();
    if (inj(label_input)) return
    const addr_field = $("#addressform .address"),
        addr_value = addr_field.val();
    if (inj(addr_value)) return
    const currency = addr_data.currency;
    if (!addr_value) {
        const error_msg = tl("entercoinaddress", {
            "currency": currency
        });
        popnotify("error", error_msg);
        addr_field.focus();
        return
    }
    if (currency) {
        const viewkey_field = $("#addressform .vk_input"),
            vk_val = viewkey_field.val();
        if (inj(vk_val)) return
        const is_xmr = currency === "monero",
            viewkey_value = (is_xmr && viewkey_field.length) ? vk_val : 0,
            viewkey_length = viewkey_value.length;
        if (viewkey_length) {
            const verify_vk = verify_viewkey(addr_value, viewkey_value);
            if (!verify_vk) {
                popnotify("error", tl("invalidvk"));
                return
            }
            const is_valid = check_address(addr_value, currency);
            if (!is_valid === true) {
                const error_msg = addr_value + " " + tl("novalidaddress", {
                    "currency": currency
                });
                popnotify("error", error_msg);
                return
            }
            validate_address(addr_data, viewkey_value);
            return
        }
        if (is_xmr) {
            const vk_confirm = confirm(tl("continuevk"));
            if (vk_confirm) {
                validate_address(addr_data, false);
            }
            return
        }
        validate_address(addr_data, false);
        return
    }
    popnotify("error", tl("pickacurrency"));
}

function verify_viewkey(address, viewkey) {
    const regex = /^[0-9a-f]{64}$/i;
    if (!regex.test(viewkey)) {
        return false
    }
    try {
        const decoded = cn_base_58.decode(address),
            public_viewkey_from_address = decoded.slice(66, 130),
            computed_public_viewkey = xmr_get_publickey(viewkey);
        if (computed_public_viewkey === public_viewkey_from_address) {
            return true
        }
        return false
    } catch (e) {
        return false
    }
}

// Validates the address for the selected currency and handles the addition or editing of the address
function validate_address(addr_data, view_key) {
    const label_field = $("#addressform .addresslabel"),
        label_input = label_field.val();
    if (inj(label_input)) return
    const addr_field = $("#addressform .address"),
        addr_input = addr_field.val();
    if (inj(addr_input)) return
    const currency = addr_data.currency,
        is_erc20 = addr_data.erc20 === true,
        currency_type = is_erc20 ? "ethereum" : currency,
        token_symbol = addr_data.ccsymbol,
        clean_addr = currency === "nimiq" ? addr_input.replace(/\s/g, "") : addr_input,
        addr_list = get_addresslist(currency),
        next_index = addr_list.children("li").length + 1,
        index = next_index > 1 ? next_index : 1,
        clean_label = label_input || "";
    if (!clean_addr) {
        popnotify("error", tl("entercoinaddress", {
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
        popnotify("error", tl("alreadyexists"));
        addr_field.select();
        return
    }
    if (parsed_addr == glob_let.new_address) { // prevent double address entries
        console.log("already added");
        return
    }
    const is_valid = check_address(parsed_addr, currency_type);
    if (!is_valid) {
        popnotify("error", parsed_addr + " " + tl("novalidaddress", {
            "currency": currency
        }));
        setTimeout(function() {
            addr_field.select();
        }, 10);
        return
    }
    const is_label_addr = check_address(clean_label, currency_type);
    if (is_label_addr === true) {
        popnotify("error", tl("invalidlabel"));
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
        save_addresses(currency, true);
        canceldialog();
        canceloptions();
        return
    }
    const key_checkbox = $("#pk_confirmwrap"),
        key_confirmed = key_checkbox.data("checked");
    if (!key_confirmed) {
        popnotify("error", tl("confirmpkownership"));
        return
    }
    const first_index = index === 1;
    if (first_index && is_erc20) {
        buildpage(addr_data, true);
        append_coinsetting(currency, compress_layer2_config(currency));
        save_cc_settings(currency);
    }
    glob_let.new_address = parsed_addr + currency;
    addr_data.address = parsed_addr,
        addr_data.label = clean_label,
        addr_data.a_id = token_symbol + index,
        addr_data.vk = view_key,
        addr_data.checked = true;
    append_address(currency, addr_data);
    save_addresses(currency, true);
    if (first_index) {
        if (!set_up()) {
            save_settings();
            const page_url = "?p=home&payment=" + currency + "&uoa=" + token_symbol + "&amount=0" + "&address=" + parsed_addr;
            br_set_local("editurl", page_url); // to check if request is being edited
            openpage(page_url, "create " + currency + " request", "payment");
        } else {
            loadpage("?p=" + currency);
        }
    }
    currency_check(currency);
    canceldialog();
    canceloptions();
    clear_savedurl();
}

// Validates address format against currency regex
function check_address(address, currency) {
    const regex = get_coin_config(currency).regex;
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
            list_compatible_wallets($(this).attr("data-currency"));
            return
        }
        play_audio("funk");
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

// Handles blockchain explorer URL click events with user confirmation
function check_recent() {
    $(document).on("click", ".check_recent", function(e) {
        e.preventDefault();
        const link_elem = $(this),
            explorer_url = link_elem.attr("href"),
            user_confirm = confirm(tl("openurl", {
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

// ** Request Management: **

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
        const dialog_content = "<div class='formbox'><h2 class='icon-history'>" + tl("recentrequests") + ":</h2><div id='ad_info_wrap'><ul>" + history_list + "</ul></div></div>";
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
            request_html += "<li class='rp_li'>" + getcc_icon(coin_id, coin_symbol + "-" + currency, is_erc20) + "<strong style='opacity:0.5'>" + short_date(request_time) + "</strong><br/>\
            <a href='" + explorer_url + "' target='_blank' class='ref check_recent'>\
            <span class='select'>" + wallet_addr + "</span> <span class='icon-new-tab'></span></a></li>";
        }
    });
    return request_html;
}

// Expands request details and animates scroll to visible position
function show_request_details() {
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

// Shows requests for specific address
function showrequests() {
    $(document).on("click", ".showrequests", function(event) {
        event.preventDefault();
        loadpage("?p=requests&filteraddress=" + $(this).closest("ul").data("address"));
        canceloptions();
    });
}

// Displays inline address requests
function showrequests_inline() {
    $(document).on("click", ".applist.pobox li .usedicon", function() {
        const wallet_addr = $(this).prev("span").text(),
            user_confirm = confirm(tl("showrequestsfor", {
                "address": wallet_addr
            }));
        if (user_confirm === true) {
            loadpage("?p=requests&filteraddress=" + wallet_addr);
        }
    });
}

// Triggers address edit dialog
function editaddress_trigger() {
    $(document).on("click", ".editaddress", function(event) {
        event.preventDefault();
        addaddress($(this).closest("ul").data(), true);
    })
}

// Initiates address removal
function remove_address() {
    $(document).on("click", ".removeaddress", function(event) {
        event.preventDefault();
        popdialog("<h2 class='icon-bin'>" + tl("removeaddress") + "</h2>", "remove_address_function", $(this));
    })
}

// Executes address removal
function remove_address_function(trigger) {
    const user_confirm = confirm(tl("areyousure"));
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
            save_currencies(true);
        }
        glob_let.new_address = null; // prevent double entries
        canceldialog();
        canceloptions();
        notify(tl("addressremoved") + " 🗑");
        save_addresses(currency, true);
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

// Sets up click handler for editing request titles
function edit_request() {
    $(document).on("click", ".editrequest", function() {
        const edit_btn = $(this),
            request_id = edit_btn.attr("data-requestid"),
            request_elem = $("#" + request_id),
            current_title = request_elem.data("requesttitle"),
            title_input = current_title || "",
            form_header = current_title ? tl("edit") : tl("enter"),
            dialog_content = "\
            <div class='formbox' id='edit_request_formbox'>\
                <h2 class='icon-pencil'>" + form_header + " " + tl("title") + "</h2>\
                <div class='popnotify'></div>\
                <div class='popform'>\
                    <input type='text' value='" + title_input + "' placeholder='" + tl("title") + "' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                    <input type='submit' class='submit' value='" + tl("okbttn") + "' data-requestid='" + request_id + "'/>\
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
            update_request({
                "requestid": request_id,
                "requesttitle": final_title
            }, true);
            canceldialog();
            notify(tl("requestsaved"));
            return
        }
        popnotify("error", tl("title") + " " + tl("requiredfield"));
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
            pdf_name = "bitrequest_" + tl("receipt") + "_" + request_id + ".pdf",
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
            return false
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
            user_confirm = confirm(tl("sharefile", {
                "filename": file_name
            }));
        if (user_confirm === true) {
            loader(true);
            set_loader_text(tl("generatereceipt"));
            const account_name = $("#accountsettings").data("selected"),
                shared_title = "bitrequest_receipt_" + request_id + ".pdf",
                url_hash = sha_sub(request_id + shared_title, 10);
            shorten_url(shared_title, pdf_url, fetch_aws("img_receipt_icon.png"), true, url_hash);
            closeloader();
        }
    })
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
        payment_date = fulldateformat(new Date(paymenttimestamp || timestamp), langcode),
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
        created_time = requestdate || timestamp,
        first_viewed_time = timestamp || requestdate,
        created_date_obj = new Date(created_time),
        fw_date_obj = new Date(first_viewed_time),
        request_date = fulldateformat(created_date_obj, langcode),
        fw_date = fulldateformat(fw_date_obj, langcode),
        ln_network = is_lightning ? "lightning" : "",
        invoice_data = {
            "Request ID": requestid,
            [transclear("currency")]: remove_diacritics(payment),
            [transclear("amount")]: formatted_amount + " " + currency_symbol,
            [transclear("status")]: transclear(status_text),
            [transclear("type")]: transclear(request_type),
            [transclear("receivingaddress")]: address
        };
    if (exists(requestname)) {
        invoice_data[transclear("from")] = remove_diacritics(requestname);
    }
    if (exists(requesttitle)) {
        invoice_data[transclear("title")] = "'" + remove_diacritics(requesttitle) + "'";
    }
    if (is_incoming) {
        invoice_data[transclear("created")] = request_date;
        invoice_data[transclear("firstviewed")] = fw_date;
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
    const network = eth_layer2 || ln_network;
    if (network) {
        invoice_data[transclear("network")] = network;
    }
    const proxy_url = d_proxy();
    return proxy_url + "/proxy/v1/receipt/?data=" + btoa(JSON.stringify(invoice_data));
}

// ** Archive Management: **

// Sets up click handler for archiving requests
function archive() {
    $(document).on("click", "#requestlist .req_actions .icon-folder-open", function() {
        popdialog("<h2 class='icon-folder-open'>" + tl("archiverequest") + "</h2>", "archivefunction", $(this));
    })
}

// Moves request from active list to archive and updates UI/storage
function archivefunction() {
    const active_request = $("#requestlist > li.visible_request"),
        request_data = active_request.data(),
        archived_copy = active_request.clone();
    if (active_request.data("status") === "insufficient") {
        update_request({
            "requestid": request_data.requestid,
            "status": "archive_pending"
        });
    }
    active_request.slideUp(300);
    archived_copy.data(request_data).prependTo($("#archivelist"));
    setTimeout(function() {
        active_request.remove();
        save_archive();
        save_requests();
    }, 350);
    archive_button();
    canceldialog();
    notify(tl("movedtoarchive"));
}

// Sets up click handler for unarchiving requests
function unarchive() {
    $(document).on("click", "#archivelist .req_actions .icon-undo2", function() {
        popdialog("<h2 class='icon-undo2'>" + tl("unarchiverequest") + "</h2>", "unarchive_function", $(this));
    })
}

// Moves request from archive back to active list and updates UI/storage
function unarchive_function() {
    const archived_request = $("#archivelist li.visible_request"),
        request_data = archived_request.data(),
        active_copy = archived_request.clone();
    archived_request.slideUp(300);
    active_copy.data(request_data).prependTo($("#requestlist"));
    setTimeout(function() {
        archived_request.remove();
        save_archive();
        save_requests();
        archive_button();
    }, 350);
    canceldialog();
    notify(tl("requestrestored"));
}

// Sets up click handler for removing requests
function remove_request() {
    $(document).on("click", ".req_actions .icon-bin", function() {
        popdialog("<h2 class='icon-bin'>" + tl("deleterequest") + "?</h2>", "remove_request_function", $(this));
    })
}

// Deletes request after confirmation and updates UI/storage
function remove_request_function() {
    const user_confirm = confirm(tl("areyousure"));
    if (user_confirm === true) {
        const target_request = $(".requestlist > li.visible_request");
        target_request.slideUp(300);
        setTimeout(function() {
            target_request.remove();
            save_requests();
            save_archive();
        }, 350);
        canceldialog();
        notify(tl("requestdeleted") + " 🗑");
    }
}

// ** Transaction History: **

// Renders transaction history list items with associated metadata
function add_historical_data(transaction_list, tx_history) {
    let history_item = false;
    $.each(tx_history, function(data, tx_data) {
        history_item = create_transaction_item(tx_data);
        if (history_item) {
            const history_title = format_transaction_details(tx_data);
            if (history_title) {
                if (history_item.attr("title") === history_title) {} else {
                    history_item.append(wrap_historic_data(history_title)).attr("title", history_title);
                }
            }
            transaction_list.append(history_item.data(tx_data));
        }
    });
}

// Animates confirmation progress bar based on transaction data
function animate_confbar(conf_bar, delay_index) {
    conf_bar.css("transform", "translate(-100%)");
    const tx_data = conf_bar.closest("li").data(),
        confirmations = tx_data.confirmations;
    if (!confirmations) return
    const confirm_ratio = (confirmations / tx_data.setconfirmations) * 100,
        capped_percent = (confirm_ratio > 100) ? 100 : confirm_ratio,
        final_position = (capped_percent - 100).toFixed(2);
    setTimeout(function() {
        conf_bar.css("transform", "translate(" + final_position + "%)");
    }, delay_index * 250);
}

// Shows transaction metadata on double click for touch devices
function show_transaction_meta() {
    $(document).on("dblclick contextmenu", ".requestlist li .transactionlist li", function(e) {
        e.preventDefault();
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

// Fetches and decodes Lightning Network invoice details from proxy
function lnd_lookup_invoice(proxy, impl, hash, node_id, peer_id, password) {
    const proxy_data = lnurl_deform(proxy),
        proxy_host = proxy_data.url,
        proxy_key = password || proxy_data.k,
        api_url = proxy_host + "/proxy/v1/ln/api/",
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
    set_loader_text(tl("connecttolnur", {
        "url": lnurl_encode("lnurl", proxy_host)
    }));
    $.ajax(request_data).done(function(response) {
        if (!response) {
            notify(tl("nofetchincoice"));
            closeloader();
            return
        }
        const error = response.error;
        if (error) {
            popdialog("<h2 class='icon-blocked'>" + error.message + "</h2>", "canceldialog");
            closeloader();
            return
        }
        const dialog_elems = [{
                "div": {
                    "class": "popform",
                    "content": [{
                            "div": {
                                "class": "invoice_body",
                                "content": "<pre>" + highlight_json_syntax(response) + "</pre><div class='inv_pb'><img src='" + c_icons(impl) + "' class='lnd_icon' title='" + impl + "'/> Powered by " + impl + "</div>"
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
        notify(tl("nofetchincoice"));
        closeloader();
    });
}

// ** Seed & Security: **

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
            popnotify("error", tl("confirmpkownership"));
            return false
        }
        if (save_preference === true) { // whitlist seed id
            add_address_whitelist(dialog_data.address);
        }
        canceldialog();
        finishtx_function(dialog_data.currency, dialog_data.address, dialog_data.url, dialog_data.title);
    })
}

// Generates seed warning dialog HTML with confirmation options
function get_address_warning(dialog_id, wallet_address, dialog_data) {
    const key_type = dialog_data.xpubid ? "Xpub" : "Seed",
        restore_link = (key_type === "Seed") ? (glob_let.hasbip === true) ? "" : "<div id='rest_seed' class='ref' data-seedid='" + dialog_data.seedid + "'>" + tl("resoresecretphrase") + "</div>" : "",
        key_title = (key_type === "Seed") ? tl("bip39_passphrase") : key_type;
    return $("<div class='formbox addwarning' id='" + dialog_id + "'>\
        <h2 class='icon-warning'>" + tl("warning") + "</h2>\
        <div class='popnotify'></div>\
        <p><strong>" + tl("missingkeywarning", {
            "seedstrtitle": key_title,
            "address": wallet_address
        }) + "</strong></p>\
        <form class='addressform popform'>\
            <div class='inputwrap'>\
                <div class='pk_wrap noselect'>\
                    <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div>\
                    <span>" + tl("pkownership") + "</span>\
                </div>\
                <div class='pk_wrap noselect'>\
                    <div id='dontshowwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div>\
                    <span>" + tl("dontshowagain") + "</span>\
                </div>" + restore_link +
        "</div>\
            <input type='submit' class='submit' value='" + tl("okbttn") + "'>\
        </form>\
    </div>").data(dialog_data);
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
            popnotify("error", tl("confirmpkownership"));
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
        currency = address_list.attr("data-currency");
    address_item.attr("data-checked", "true").data("checked", true);
    check_currency(currency);
    save_addresses(currency, false);
    clear_savedurl();
}

// Adds a new seed ID to localStorage whitelist
function add_seed_whitelist(seed_id) {
    const stored_whitelist = br_get_local("swl", true),
        seed_list = get_default_object(stored_whitelist);
    if (!seed_list.includes(seed_id)) {
        seed_list.push(seed_id);
    }
    br_set_local("swl", seed_list, true);
}

// Verifies if seed ID exists in whitelist
function seed_wl(seed_id) {
    const stored_whitelist = br_get_local("swl", true),
        seed_list = get_default_object(stored_whitelist);
    return seed_list.includes(seed_id);
}

// Adds new address to localStorage whitelist
function add_address_whitelist(wallet_address) {
    const stored_whitelist = br_get_local("awl", true),
        address_list = get_default_object(stored_whitelist);
    if (!address_list.includes(wallet_address)) {
        address_list.push(wallet_address);
    }
    br_set_local("awl", address_list, true);
}

// Verifies if address exists in whitelist
function addr_whitelist(wallet_address) {
    const stored_whitelist = br_get_local("awl", true),
        address_list = get_default_object(stored_whitelist);
    return address_list.includes(wallet_address);
}

// ** Address Reordering: **

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
                save_addresses(get_urlparameters().p, false);
            } else if (list_item.hasClass("after")) {
                list_item.insertAfter(".hovered:last");
                save_addresses(get_urlparameters().p, false);
            }
            list_item.removeClass("before after dragging").attr("style", "");
            $(".currentpage .applist li").removeClass("hovered").attr("style", "");
            glob_const.html.removeClass("dragmode");
            clear_savedurl();
        }
    })
}

// ** URL & Link Handling: **

// Processes and validates custom URL scheme handlers
function check_intents(encoded_scheme) {
    if (encoded_scheme == "false") {
        return
    }
    const decoded_url = atob(encoded_scheme),
        protocol = decoded_url.split(":")[0];
    if (protocol == "eclair" || protocol == "acinq" || protocol == "lnbits") {
        const warning_content = "<h2 class='icon-warning'>" + tl("proto", {
            "proto": protocol
        }) + "</h2>";
        popdialog(warning_content, "canceldialog");
        return
    }

    if (protocol == "lndconnect" || proto == "clnrest") {
        const implementation = (protocol === "lndconnect") ? "lnd" :
            (protocol === "clnrest") ? "core-lightning" : protocol,
            connection_data = renderlnconnect(decoded_url);
        if (connection_data) {
            const rest_url = connection_data.resturl,
                macaroon_data = connection_data.macaroon || scheme_obj.rune;
            // wait for settings to be rendered
            if (rest_url && macaroon_data) {
                setTimeout(function() {
                    render_lightning_interface();
                    ln_connect({
                        "lnconnect": btoa(rest_url),
                        "macaroon": macaroon_data,
                        "imp": implementation
                    });
                }, 1500);
                return
            }
            popnotify("error", tl("decodeqr"));
        }
        return
    }
    if (protocol.length < 1) {
        const error_content = "<h2 class='icon-warning'>" + tl("invalidurlscheme") + "</h2>";
        popdialog(error_content, "canceldialog");
        return
    }
    if (protocol && protocol.length > 0) {
        const unsupported_content = "<h2 class='icon-warning'>" + tl("usnotsupported") + "</h2>";
        popdialog(unsupported_content, "canceldialog");
        return
    }
}

// Expands shortened URLs with caching and platform handling
function expand_shorturl(input_param) {
    if (input_param.startsWith("4bR")) { // handle bitly shortlink
        expand_bitly_url(input_param);
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
            proxy_url = glob_const.proxy_list[proxy_index].proxy,
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
                "url": proxy_url + "/proxy/v1/inv/api/",
                "data": request_payload
            }).done(function(response) {
                const parsed_data = br_result(response).result;
                if (parsed_data) {
                    const status = parsed_data.status;
                    if (status) {
                        if (status == "file not found") {
                            const error_content = "<h2 class='icon-warning'>" + tl("shorturlnotfound") + "</h2>";
                            popdialog(error_content, "canceldialog");
                            closeloader();
                            return
                        }
                        if (status == "file exists") {
                            const long_url = parsed_data.sharedurl;
                            if (long_url) {
                                const local_url = make_local(long_url);
                                ios_redirections(local_url);
                                br_set_session("longurl_" + input_param, local_url);
                                return
                            }
                        }
                    }
                }
            }).fail(function(xhr, status, error) {
                const error_content = "<h2 class='icon-warning'>" + tl("failedtofetchrequest") + "</h2>";
                popdialog(error_content, "canceldialog");
                closeloader();
                return
            });
        }
    }
}

// Handles Bitly URL expansion with API fallback
function expand_bitly_url(input_param) {
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
            "data": {
                "bitlink_id": "bit.ly/" + bitly_id
            }
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
            expand_bitly_url(input_param);
            return
        }
        glob_const.w_loc.href = "http://bit.ly/" + bitly_id;
    });
}

// Opens a block explorer URL
function open_blockexplorer_url(explorer_url) {
    const user_confirm = confirm(tl("openurl", {
        "url": explorer_url
    }));
    if (user_confirm === true) {
        glob_const.w_loc.href = explorer_url;
    }
}

// Generates block explorer URL based on currency, transaction type and network parameters
function blockexplorer_url(currency, is_tx, is_erc20, source, network_layer) {
    const path_prefix = is_tx ? "tx/" : "address/";
    if (network_layer === "binance smart chain") {
        return "https://bscscan.com/" + path_prefix;
    }
    if (network_layer === "arbitrum one") {
        return "https://arbiscan.io/" + path_prefix;
    }
    if (network_layer === "polygon pos") {
        return "https://polygonscan.com/" + path_prefix;
    }
    if (network_layer === "base") {
        return "https://basescan.org/" + path_prefix;
    }
    if (is_erc20) {
        return "https://ethplorer.io/" + path_prefix;
    }
    const explorer_name = get_blockexplorer(currency);
    if (explorer_name) {
        const explorer_data = glob_config.blockexplorers.find(filter => filter.name === explorer_name);
        if (!explorer_data) return false
        const base_prefix = explorer_data.prefix,
            coin_data = get_coin_config(currency),
            url_prefix = base_prefix === "currencysymbol" ? coin_data.ccsymbol :
            base_prefix === "currency" ? currency : base_prefix,
            path_segment = url_prefix ? url_prefix + "/" : "",
            path_type = is_tx === true ? explorer_data.tx_prefix : explorer_data.address_prefix;
        return explorer_data.url + path_segment + path_type;
    }
    return false
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

// Rotates to next available API endpoint in configuration
function try_next_api(api_group, current_api) {
    const api_list = glob_config.apilists[api_group],
        current_index = api_list.indexOf(current_api),
        next_api = api_list[(current_index + 1) % api_list.length];
    return glob_let.api_attempt[api_group][next_api] !== true ? next_api : false;
}

// ** App Install & Platform: **

// Determines if app promotion should be shown based on device/platform
function check_app_install_prompt() {
    const device_type = detect_device_type();
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
            time_elapsed = now_utc() - dialog_timestamp;
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
                show_app_download_prompt("apple");
            } else {
                show_app_download_prompt("android");
            }
        }
    } else {
        br_set_local("appstore_dialog", now_utc());
    }
}

// Shows platform-specific app store download panel
function show_app_download_prompt(platform_type) {
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
    if (inj(panel_content)) return // xss filter
    app_panel.html(panel_content);
    setTimeout(function() {
        glob_const.body.addClass("getapp");
    }, 1500);
    br_set_local("appstore_dialog", now_utc());
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

// ** Recent Request Management: **

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

// ** Lightning Network: **

// Sets up Lightning Network connection with credentials
function ln_connect(params) {
    const url_params = params || get_urlparameters(),
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
        notify(tl("invalidmacaroon"));
        return
    }
    notify(tl("invalidformat"));
}

// ** Page Building & Rendering: **

// Renders the currencies from cached data
function rendercurrencies() {
    const init = !set_up();
    initiate(init);
    $.each(glob_const.stored_currencies, function(index, data) {
        const curr_code = data.currency,
            coin_id = data.cmcid;
        buildpage(data, false, init);
        render_currencysettings(curr_code);
        const wallet_addrs = br_get_local("cc_" + curr_code, true);
        if (wallet_addrs) {
            $.each(wallet_addrs.reverse(), function(index, addr_data) {
                append_address(curr_code, addr_data);
            });
        }
    });
}

// Routes to appropriate page based on URL parameters
function loadurl() {
    const url_params = get_urlparameters();
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

// Renders currency settings from cache
function render_currencysettings(curr_code) {
    const cached_settings = br_get_local(curr_code + "_settings", true);
    if (cached_settings) {
        append_coinsetting(curr_code, cached_settings);
    }
}

// Builds the settings UI from configuration data
function build_settings() {
    const settings_list = $("#appsettings");
    glob_config.app_settings.forEach(function(setting) {
        const setting_id = setting.id,
            selected_val = setting.selected,
            trans_val = tl(selected_val),
            display_val = trans_val || selected_val,
            settings_item = (setting_id === "heading") ? $("<li class='set_heading'>\
              <h2>" + tl(setting.heading) + "</h2>\
        </li>") :
            $("<li class='render' id='" + setting_id + "'>\
              <div class='liwrap iconright'>\
                 <span class='" + setting.icon + "'></span>\
                 <div class='atext'>\
                    <h2>" + tl(setting_id) + "</h2>\
                    <p>" + truncate_middle(display_val) + "</p>\
                 </div>\
                 <div class='iconbox linkcolor'>\
                     <span class='icon-pencil'></span>\
                </div>\
              </div>\
        </li>");
        settings_item.data(setting).appendTo(settings_list);
    });
}

// Updates UI with cached settings excluding specified options
function render_settings(excludes) {
    const cached_settings = br_get_local("settings", true);
    if (cached_settings) {
        cached_settings.forEach(function(setting) {
            const setting_id = setting.id;
            if ($.inArray(setting_id, excludes) === -1) { // exclude excludes
                const selected_val = setting.selected,
                    trans_val = tl(selected_val),
                    display_val = setting_id === "accountsettings" ? selected_val : (trans_val || selected_val); // Exclude translations
                $("#" + setting.id).data(setting).find("p").text(truncate_middle(display_val));
            }
        });
    }
}

// Loads and displays cached requests
function render_requests() {
    fetch_requests("requests", false);
    fetch_requests("archive", true);
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
function fetch_requests(cache_name, is_archive) {
    const cached_reqs = br_get_local(cache_name, true);
    if (cached_reqs) {
        const show_archive = !is_archive && cached_reqs.length > 11; // only show archive button when there are more then 11 requests
        cached_reqs.reverse().forEach(function(req) {
            req.archive = is_archive;
            req.showarchive = show_archive;
            append_request(req);
        });
    }
}

// Sets up initial cryptocurrency UI when no cache exists
function initiate(init) {
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
            buildpage(coin_config, true, init);
            append_coinsetting(coin.currency, settings);
        }
    });
}

// Creates and manages the currency page UI with icons, settings, and address management options
function buildpage(cd, ini, init) {
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
        display_state = checked || init ? "" : "hide",
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
                <h2 class='heading'>" + getcc_icon(cmcid, coin_page_id, erc20) + " " + currency + " " + tl("settings") + "</h2>\
                <ul class='cc_settinglist settinglist applist listyle2'></ul>\
                <div class='reset_cc_settings button' data-currency='" + currency + "'>\
                    <span>" + tl("resetbutton") + "</span>\
                </div>\
            </div>\
        </div>" : "";
        const settings_btn = has_settings ? "<div data-rel='?p=" + currency + "_settings' class='self icon-cog'></div>" : "",
            send_btn = glob_let.hasbip ? "<div class='button send' data-currency='" + currency + "'><span class='icon-telegram'>" + tl("send") + "</span></div>" : "",
            coin_page = $("<div class='page' id='" + currency + "'>\
            <div class='content'>\
                <h2 class='heading'>" + getcc_icon(cmcid, coin_page_id, erc20) + " " + currency + settings_btn + "</h2>\
                <ul class='applist listyle2 pobox' data-currency='" + currency + "'>\
                    <div class='endli'><div class='button addaddress' data-currency='" + currency + "'><span class='icon-plus'>" + tl("addaddress") + "</span></div>" + send_btn + "</div>\
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
}

// Renders coin-specific settings with switch panels and translated labels
function append_coinsetting(currency, settings) {
    const settings_list = $("#" + currency + "_settings ul.cc_settinglist");
    $.each(settings, function(key, setting) {
        if (setting.xpub === false) {
            return
        }
        const selected = setting.selected;
        if (selected !== undefined) {
            const url = selected.url,
                name = selected.name,
                custom = selected.custom,
                api = selected.api || null,
                display_val = name || url || selected,
                val_str = String(display_val),
                filtered_val = val_str === "true" || val_str === "false" ? "" : val_str,
                trans_val = tl(filtered_val),
                display_text = trans_val || filtered_val,
                display_trunc = setting_sub_address(display_text, url, custom),
                existing_item = settings_list.children("li[data-id='" + key + "']");
            if (existing_item.length === 0) {
                const switch_type = setting.custom_switch ? " custom" : " global bool",
                    control = setting.switch ? switch_panel(val_str, switch_type) : "<span class='icon-pencil'></span>",
                    settings_item = $("<li data-id='" + key + "'>\
                        <div class='liwrap edit_trigger iconright' data-currency='" + currency + "'>\
                            <span class='icon-" + setting.icon + "'></span>\
                            <div class='atext'>\
                                <h2>" + tl(key) + "</h2>\
                                <p>" + display_trunc + "</p>\
                            </div>\
                            <div class='iconbox linkcolor'>" + control + "</div>\
                            </div>\
                    </li>");
                settings_item.data(setting).appendTo(settings_list);
                return
            }
            existing_item.data(setting).find("p").text(display_trunc);
            if (setting.switch === true) {
                existing_item.find(".switchpanel").removeClass("true false").addClass(val_str);
            }
        }
    });
}

// Subtitle for settings
function setting_sub_address(name, url, custom) {
    const sub_title = (custom === true || name === "electrum" || name === "xmr_node" || name === "lws") ? url || name : name || url;
    return exists(sub_title) ? truncate_middle(sub_title) : "";
}

// Creates address list item with source icons, monitoring status, and action buttons
function append_address(currency, addr_data) {
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
                    <span class='popoptions icon-menu2 linkcolor'></span>\
                </div>\
            </div>\
        </li>");
    addr_item.data(addr_data).prependTo(addr_list);
}

// Generates complete payment request UI with transaction details, metadata, and status indicators
function append_request(rd) {
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
        paymenttimestamp,
        boltcard
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
        time_local = requestdate || timestamp,
        is_incoming = requesttype === "incoming",
        is_local = requesttype === "local",
        is_checkout = requesttype === "checkout",
        is_outgoing = requesttype === "outgoing",
        tx_direction = is_incoming ? "sent" : "received",
        type_label = is_checkout ? "online purchase" : is_local ? "point of sale" : requesttype,
        type_text = tl(type_label),
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
        is_expired = (status == "expired" || (now_utc() - time_local) >= expire_time &&
            (is_ln_expire || status == "new" || is_insufficient === true)),
        expired_class = is_expired ? " expired" : "",
        time_obj = new Date(time_local),
        date_full = fulldateformat(time_obj, langcode),
        time_display = "<span class='rq_month'>" + time_obj.toLocaleString(langcode, {
            "month": "short"
        }) + "</span> <span class='rq_day'>" + time_obj.getDate() + "</span>",
        payment_time = fulldateformat(new Date(paymenttimestamp || timestamp), langcode, true),
        amount_short = amountshort(amount, receivedamount, fiatvalue, iscrypto),
        short_suffix = is_insufficient ? " (" + amount_short + " " + unit + " " + tl("amountshort") + ")" : "",
        short_crypto = iscrypto ? short_suffix : "",
        date_created = requestdate ? date_full : "<strong>unknown</strong>",
        amount_label = is_incoming ? tl("amountpaid") : tl("amountreceived"),
        fiat_box = iscrypto || !fiatvalue ? "" :
        "<li class='payday pd_fiat'><strong>" + tl("fiatvalueon") +
        "<span class='pd_fiat'> " + payment_time + "</span> :</strong>" +
        "<span class='fiatvalue'> " + fiat_formatted + "</span> " + currencyname +
        "<div class='show_as amountshort'>" + short_suffix + "</div></li>",
        payment_info = "<li class='payday pd_paydate'><strong>" + tl("paidon") +
        ":</strong><span class='paydate'> " + payment_time + "</span></li>" +
        "<li class='receivedamount'><strong>" + amount_label + ":</strong><span> " +
        received_formatted + "</span> " + payment +
        "<div class='show_as amountshort'>" + short_crypto + "</div></li>" + fiat_box,
        name_box = is_incoming ? rqdata ?
        "<li><strong>" + tl("from") + ":</strong> " + requestname + "</li>" :
        "<li><strong>From: unknown</strong></li>" : "",
        title_box = requesttitle ?
        "<li><strong>" + tl("title") + ":</strong> '<span class='requesttitlebox'>" +
        requesttitle + "</span>'</li>" : "",
        monitor_status = !monitored ? " (unmonitored transaction)" : "",
        time_box = is_incoming ?
        "<li><strong>" + tl("created") + ":</strong> " + date_created + "</li>" +
        "<li><strong>" + tl("firstviewed") + ":</strong> " + fulldateformat(new Date(timestamp), langcode) + "</li>" :
        is_outgoing ?
        "<li><strong>" + tl("sendon") + ":</strong> " + date_full + "</li>" :
        is_local ?
        "<li><strong>" + tl("created") + ":</strong> " + date_full + "</li>" : "",
        payment_url = "&address=" + address + data_param + meta_param + "&requestid=" + requestid,
        addr_label = $("main #" + payment + " li[data-address='" + address + "']").data("label"),
        label_display = addr_label ? " <span class='requestlabel'>(" + addr_label + ")</span>" : "",
        confirm_display = !monitored ?
        "<div class='txli_conf' data-conf='0'><span>Unmonitored transaction</span></div>" :
        confirm_count > 0 ?
        "<div class='txli_conf'><div class='confbar'></div><span>" +
        confirm_count + " / " + set_confirmations + " " +
        tl("confirmations") + "</span></div>" :
        confirm_count === 0 ?
        "<div class='txli_conf' data-conf='0'><div class='confbar'></div>" +
        "<span>Unconfirmed transaction<span></div>" : "",
        tx_count = txhistory ? txhistory.length : 0,
        tx_view = (tx_count > 1) ? "" :
        is_lightning_tx ?
        "<li><strong class='show_tx'><span class='icon-power'></span>" +
        "<span class='ref'>" + tl("viewinvoice") + "</span></strong></li>" :
        (txhash) ?
        "<li><strong class='show_tx'><span class='icon-eye linkcolor'></span>" +
        tl("viewon") + " blockchain</strong></li>" : "",
        status_text = !monitored ? "" :
        (status == "new") ? "Waiting for payment" : status,
        source_html = source ?
        "<span class='src_txt'>" + tl("source") + ": " + source + "</span>" +
        "<span class='icon-wifi-off'></span><span class='icon-connection'></span>" : "",
        crypto_class = iscrypto ? "" : " isfiat",
        archive_btn = showarchive || is_expired ?
        "<div class='icon-folder-open' title='archive request'></div>" : "",
        show_history = txhistory && (pending === "no" || archive),
        history_text = show_history ? tl("transactions") : "",
        edit_btn = is_local ?
        "<div class='editrequest icon-pencil' title='edit request' data-requestid='" +
        requestid + "'></div>" : "",
        payment_id_box = payment_id ?
        "<li><strong>" + tl("paymentid") + ":</strong> " +
        "<span class='select' data-type='payment ID'>" + payment_id + "</span></li>" : "",
        int_addr_box = xmr_ia ?
        "<li><p class='address'><strong>" + tl("integratedaddress") +
        ":</strong> <span class='requestaddress select'>" + xmr_ia + "</span></p></li>" : "",
        ln_icon = is_lightning_tx ? " <span class='icon-power'></span>" : "",
        ln_logo = "<img src='img_logos_btc-lnd.png' class='cmc_icon'>" +
        "<img src='img_logos_btc-lnd.png' class='cmc_icon'>",
        coin_logo = getcc_icon(cmcid, cpid, erc20) + getcc_icon(cmcid, cpid, erc20),
        logo_display = lightning ?
        (txhash && !is_lightning_tx) ? coin_logo : ln_logo :
        coin_logo,
        addr_title = is_hybrid ? tl("fallbackaddress") : tl("receivingaddress"),
        addr_box = lightning && (is_lightning_tx || is_hybrid === false) ? "" :
        "<li><p class='address'><strong>" + addr_title + ":</strong> " +
        "<span class='requestaddress select'>" + address + "</span>" + label_display + "</p></li>",
        network_name = eth_layer2,
        bolt_card = boltcard ? "<img src='boltcard.png' class='boltcard' title='paid with the boltcard'>" : "",
        network_box = network_name ?
        "<li><p><strong>" + tl("network") + ":</strong> " + network_name + "</p></li>" : "",
        status_final = tx_direction === "sent" ?
        tl("paymentsent") : tl("paymentreceived"),
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
                <div class='tx_loader'>" + loading_dots("scanning transactions") + "</div>\
                <div data-rel='" + payment_url + "' class='payrequest button" + crypto_class + "'>\
                    <span class='icon-qrcode'>" + tl("pay") + "</span>\
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
                    <li class='cnamemeta'><strong>" + tl("currency") + ":</strong> " +
            payment + ln_icon + "</li>" +
            name_box +
            title_box +
            "<li><strong>" + tl("amount") + ":</strong> " + amount_formatted + " " +
            unit + "</li>\
                    <li class='meta_status' data-conf='" + confirm_count +
            "'><strong>" + tl("status") + ":</strong><span class='status'> " +
            tl(status_text) + "</span> " + confirm_display + bolt_card + "</li>\
                    <li><strong>" + tl("type") + ":</strong> " + type_text +
            monitor_status + "</li>" +
            time_box +
            payment_info +
            addr_box +
            network_box +
            payment_id_box +
            int_addr_box +
            "<li class='receipt'><p class='linkcolor'><span class='icon-file-pdf' title='View receipt'/>" +
            tl("receipt") + "</p></li>" + tx_view +
            "</ul>\
                <ul class='transactionlist'>\
                    <h2>" + history_text + "</h2>\
                </ul>\
                <div class='api_source'>" + truncate_middle(source_html, 15, 18, 41) + "</div>\
            </div>\
            <div class='brstatuspanel flex'>\
                <img src='" + c_icons("confirmed") + "'>\
                <h2>" + status_final + "</h2>\
            </div>\
            <div class='brmarker'></div>\
            <div class='expired_panel'><h2>" + tl("expired") + "</h2></div>\
        </li>");
    rd.coindata = null, // no need to save coindata
        request_item.data(rd).prependTo(request_container);
    if (show_history) {
        const tx_list = request_container.find("#" + requestid).find(".transactionlist");
        add_historical_data(tx_list, txhistory);
    }
}

// ** Storage Management: **

// Persists cryptocurrency list to localStorage and updates change counter
function save_currencies(trigger_update, init_currency) {
    const currency_list = $("#usedcurrencies li").map(function() {
        return $(this).data();
    }).get();
    br_set_local("currencies", currency_list, true);
    update_changes("currencies", trigger_update);
    // On app initiation
    if (init_currency) {
        glob_const.stored_currencies = currency_list;
        if (init_currency === true) {
            return
        }
        $("#currencylist > li").not("[data-currency='" + init_currency + "']").addClass("hide");
    }
}

// Stores address list for specific currency and handles ERC20 token settings cleanup
function save_addresses(currency, trigger_update) {
    const addr_list = get_addresslist(currency),
        addr_items = addr_list.find("li");
    if (addr_items.length) {
        const addr_data = addr_items.map(function() {
            return $(this).data();
        }).get();
        br_set_local("cc_" + currency, addr_data, true);
        update_changes("addresses", trigger_update);
        return
    }
    br_remove_local("cc_" + currency);
    const coin_data = get_coin_config(currency);
    if (coin_data) {
        if (coin_data.erc20) {
            br_remove_local(currency + "_settings");
            update_changes("addresses", trigger_update);
            return
        }
    }
    restore_default_settings(currency);
}

// Saves active requests to localStorage and triggers change notification
function save_requests() {
    const request_data = $("ul#requestlist > li").map(function() {
        return $(this).data();
    }).get();
    br_set_local("requests", request_data, true);
    update_changes("requests", true);
}

// Saves the archive list to local storage
function save_archive() {
    const archive_data = $("ul#archivelist > li").map(function() {
        return $(this).data();
    }).get();
    br_set_local("archive", archive_data, true);
}

// Stores application settings and triggers change notification with alert control
function save_settings(suppress_alert) {
    const settings_data = $("ul#appsettings > li.render").map(function() {
        return $(this).data();
    }).get();
    br_set_local("settings", settings_data, true);
    update_changes("settings", true, suppress_alert);
}

// Saves cryptocurrency-specific settings and updates change counter
function save_cc_settings(currency, trigger_update) {
    const coin_settings = {};
    $("#" + currency + "_settings ul.cc_settinglist > li").each(function() {
        const setting_item = $(this);
        coin_settings[setting_item.attr("data-id")] = setting_item.data();
    });
    br_set_local(currency + "_settings", coin_settings, true);
    update_changes("coinsettings", trigger_update);
}

// Manages change counter and triggers backup notifications based on thresholds
function update_changes(key, trigger_update, suppress_alert) {
    const pass_state = get_auth_status();
    if (pass_state.active === false) {} else {
        if (pass_state.pass) {
            sync_drive_data(pass_state);
            return
        }
        if (pass_state.expired) {
            handle_token_expiration(pass_state.expired, "uad");
            return
        }
    }
    if (trigger_update === true) {
        const change_count = glob_let.changes[key] || 0;
        glob_let.changes[key] = change_count + 1;
        save_changestats();
        if (suppress_alert == "noalert") {
            return
        }
        change_alert();
    }
}

// Resets change counter and clears UI change indicators
function reset_changes() {
    glob_let.changes = {};
    save_changestats();
    glob_const.body.removeClass("haschanges");
    if (!glob_const.html.hasClass("proxyupdate")) {
        $("#alert > span").text("0").attr("title", tl("nochanges"));
    }
}

// Saves change statistics to localStorage for persistence
function save_changestats() {
    br_set_local("changes", glob_let.changes, true);
}

// Loads or initializes change tracking from localStorage
function render_changes() {
    glob_let.changes = br_get_local("changes", true) || {};
}

// Shows change count alert and triggers backup at specific thresholds
function change_alert() {
    if (glob_const.is_ios_app === true) {
        return
    }
    const change_count = get_total_changes();
    if (change_count > 24) {
        $("#alert > span").text(change_count).attr("title", tl("totalchanges", {
            "total_changes": change_count
        }));
        setTimeout(function() {
            glob_const.body.addClass("haschanges");
        }, 2500);
        if ([25, 50, 150, 200, 250].includes(change_count)) {
            canceldialog();
            const backup_timer = setTimeout(function() {
                backup_database();
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

// ** Utility Functions: **

// Calculates difference between expected and received payment amounts
function amountshort(total, received, fiat_value, is_crypto) {
    const received_amount = is_crypto === true ? received : fiat_value,
        amount_diff = total - received_amount,
        formatted_diff = is_crypto === true ? trimdecimals(amount_diff, 5) : trimdecimals(amount_diff, 2);
    return (isNaN(formatted_diff)) ? null : formatted_diff;
}