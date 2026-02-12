$(document).ready(function() {
    // ** Core Dialog Management: **
    wake_panel();
    //set_dialog_timeout
    //clear_dialog_timeout
    //show_paymentdialog
    //main_input_focus

    // ** Swipe Controls: **
    swipe_start();
    //swipe
    swipe_end();

    // ** Flip Controls: **
    flip_start();
    //flip
    flip_end();
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

    // ** Payment Flow: **
    //load_request
    //get_tokeninfo
    //get_tokeninfo_local
    //continue_request
    //get_l2_contracts
    //monero_setup
    //lightning_setup
    //lnd_put
    //test_lnd
    //proceed_pf
    //get_cc_exchangerates
    //cc_fail
    //init_exchangerate
    //get_fiat_exchangerate
    //next_fiat_api
    //no_xrate_result

    // ** UI State Management: **
    //render_currencypool
    //get_payment
    //update_exchange_rates_text
    //update_currency_pool
    //refresh_currency_pool
    //generate_payment_qr
    //set_wallet_uris
    //set_lightning_qr
    //set_lightning_uris
    scan_qr();
    show_api_stats();
    hide_api_stats();

    // ** Input Sync: **
    sync_fiat_inputs();
    sync_local_currency();
    sync_crypto_inputs();
    sync_satoshi_input();
    //update_fiat_display
    //update_local_currency
    //update_crypto_display
    //update_satoshi_display
    //sync_input_values
    //calculate_crypto_amount
    mirror_input_value();

    // ** Lightning & NFC: **
    lnd_switch_function();
    ndef_switch_function();
    //lnd_statusx
    lnd_offline();
    lnd_ni();
    //lnd_popup

    // ** Request Management: **
    switch_currency();
    //validate_request_data
    input_requestdata();
    validate_steps();
    flip_request();
    reveal_title();
    //pending_request
    view_pending_tx();
    //update_request_url
    //show_pending_status
    //update_payment_status

    // ** Address Management: **
    switch_address();
    //new_addresli
    copy_address_dblclick();
    copy_address();
    copy_inputs();
    pick_address_from_dialog();
    add_address_from_dialog();
    add_from_seed();

    // ** Sharing: **
    share_button();
    //is_ln_only
    //lightning_mode
    //share
    //shorten_url
    //bitly_shorten
    //custom_shorten
    //get_saved_shorturl
    //random_id
    //share_request
    //share_fallback
    whatsapp_share();
    mailto();
    copy_url();
    gmail_share();
    telegram_share();
    outlook_share();
    //get_share_info
    //share_callback
    //open_share_url

    // ** Transaction Viewing: **
    view_tx();
    //open_tx
    xmr_settings();

    // ** Wallet Operations: **
    open_wallet();
    open_wallet_url();
    dw_trigger();
    //download_wallet

    // ** Request Updates: **
    //save_payment_request
    //update_request
    //get_xmrpid
    //xmr_integrated
});

// ** Swipe payment dialog **

// Attaches wake-up event handlers to the payment dialog box
function wake_panel() {
    $(document).on("mousedown touchstart", "#paymentdialogbox", function() {
        set_dialog_timeout();
    })
}

// Sets a 3-minute auto-close timer for the payment request dialog
function set_dialog_timeout() {
    // close request dialog after 3 minutes
    if (!glob_const.paymentpopup.hasClass("live")) return
    clear_dialog_timeout();
    glob_let.request_timer = setTimeout(function() {
        cpd_pollcheck();
    }, 180000, function() {
        clear_dialog_timeout();
    });
    glob_const.paymentdialogbox.removeClass("timer");
    setTimeout(function() {
        glob_const.paymentdialogbox.addClass("timer");
    }, 500);
}

// Clear request dialog timer
function clear_dialog_timeout() {
    clearTimeout(glob_let.request_timer);
    glob_let.request_timer = 0;
}

// Activates payment dialog with scroll position preservation and blur effects
function show_paymentdialog() {
    glob_let.scrollposition = $(document).scrollTop(); // get scrollposition save as global
    toggle_fixed_nav(glob_let.scrollposition); // fix nav position
    glob_const.html.addClass("paymode blurmain_payment");
    $(".showmain #mainwrap").css("transform", "translate(0, -" + glob_let.scrollposition + "px)"); // fake scroll position
    glob_const.paymentpopup.addClass("showpu active");
}

// Sets focus to appropriate amount input field based on dialog state
function main_input_focus() {
    const visible_input = glob_const.paymentdialogbox.hasClass("flipped") ? $("#paymentdialog #shareamount input:visible:first") :
        $("#paymentdialog #amountbreak input:visible:first");
    // hack to move cursor to the end
    const amount_value = visible_input.val();
    visible_input.val("").val(amount_value).focus();
}

// ** Swipe Controls: **

// Initializes vertical swipe detection for the payment dialog
function swipe_start() {
    $(document).on("mousedown touchstart", "#paymentdialog", function(e) {
        glob_let.blockswipe = false;
        const current_dialog = $(this),
            input_fields = current_dialog.find("input");
        if (input_fields.is(":focus")) {
            glob_let.blockswipe = true;
        }
        const start_height = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
        startswipetime = now_utc();
        swipe(current_dialog.height(), start_height);
    })
}

// Processes real-time vertical swipe movements and animations
function swipe(dialog_height, start_height) {
    $(document).on("mousemove touchmove", "#payment", function(e) {
        if (glob_let.blockswipe === true) {
            unfocus_inputs();
            return
        }
        const current_height = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY,
            drag_distance = current_height - start_height;
        if (Math.abs(drag_distance) > 3) { // margin to activate swipe
            glob_const.html.addClass("swipemode");
            const distance_ratio = drag_distance / dialog_height,
                opacity_level = 1 - Math.abs(distance_ratio);
            glob_let.percent = distance_ratio * 100;
            $(this).addClass("swiping");
            $("#paymentdialog").css({
                "opacity": opacity_level,
                "transform": "translate(0, " + glob_let.percent + "%)"
            });
        }
    })
}

// Handles swipe gesture completion and resets dialog state
function swipe_end() {
    $(document).on("mouseup mouseleave touchend", "#payment", function() {
        $(document).off("mousemove touchmove", "#payment");
        const current_unit = $(this);
        if (current_unit.hasClass("swiping")) {
            const payment_dialog = $("#paymentdialog"),
                swipe_duration = now_utc() - startswipetime,
                is_large_swipe = Math.abs(glob_let.percent) > 90,
                is_quick_swipe = Math.abs(glob_let.percent) > 25;
            if (is_large_swipe || (is_quick_swipe && swipe_duration < 500)) {
                current_unit.removeClass("swiping");
                payment_dialog.css({
                    "opacity": "",
                    "transform": ""
                });
                cpd_pollcheck();
                glob_const.html.removeClass("swipemode");
            } else {
                current_unit.removeClass("swiping");
                payment_dialog.css({
                    "opacity": "",
                    "transform": ""
                });
                glob_const.html.removeClass("swipemode");
            }
        }
    })
}

// ** Flip Controls: **

// Initializes horizontal flip gesture detection with payment state validation
function flip_start() {
    $(document).on("mousedown touchstart", "#paymentdialog", function(e) {
        if (glob_const.paymentdialogbox.hasClass("norequest")) {
            const is_lightning = lightning_mode();
            if (glob_const.paymentdialogbox.attr("data-pending") === "ispending" && !is_lightning) {
                return
            }
            if (is_lightning && glob_const.paymentdialogbox.hasClass("accept_lnd")) {
                return
            }
        }
        const start_width = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
        flip($(this).width(), start_width);
    })
}

// Processes real-time horizontal flip movements and animations
function flip(dialog_width, start_width) {
    $(document).on("mousemove touchmove", "#payment", function(e) {
        glob_const.html.addClass("flipmode");
        const current_width = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX,
            drag_distance = current_width - start_width;
        if (Math.abs(drag_distance) > 3) { // margin to activate flip (prevent sloppy click)
            glob_const.html.addClass("swipemode");
            $(this).addClass("flipping");
            const start_angle = glob_const.paymentdialogbox.hasClass("flipped") ? 180 : 0;
            glob_const.paymentdialogbox.css("transform", "rotateY(" + start_angle + "deg)");
            const pre_angle = 180 * drag_distance / dialog_width;
            glob_let.angle = glob_const.paymentdialogbox.hasClass("flipped") ? 180 + pre_angle : pre_angle;
            glob_const.paymentdialogbox.css("transform", "rotateY(" + glob_let.angle + "deg)");
        }
    })
}

// Handles flip gesture completion and determines final rotation state
function flip_end() {
    $(document).on("mouseup mouseleave touchend", "#payment", function() {
        const current_unit = $(this);
        $(document).off("mousemove touchmove", glob_const.paymentpopup);
        if (current_unit.hasClass("flipping")) {
            if (glob_const.paymentdialogbox.hasClass("flipped")) {
                if (glob_let.angle > 250) {
                    flip_right2();
                } else if (glob_let.angle < 110) {
                    flip_left2();
                } else {
                    flip_reset1();
                }
            } else {
                if (glob_let.angle > 70) {
                    flip_right1();
                } else if (glob_let.angle < -70) {
                    flip_left1();
                } else {
                    flip_reset2();
                }
            }
            current_unit.removeClass("flipping");
            glob_const.html.removeClass("swipemode");
        }
        setTimeout(function() {
            glob_const.html.removeClass("flipmode");
        }, 270);
    })
}

// Executes clockwise flip from front to back face
function flip_right1() {
    add_flip();
    face_back();
}

// Completes full clockwise rotation back to front face
function flip_right2() {
    glob_const.paymentdialogbox.css("transform", "rotateY(360deg)").removeClass("flipped");
    face_front();
}

// Executes counterclockwise flip from front to back face
function flip_left1() {
    glob_const.paymentdialogbox.css("transform", "rotateY(-180deg)").addClass("flipped");
    face_back();
}

// Completes full counterclockwise rotation back to front face
function flip_left2() {
    remove_flip();
    face_front();
}

// Cancels flip animation when dialog is already flipped
function flip_reset1() {
    glob_const.paymentdialogbox.css("transform", "");
}

// Cancels flip animation when dialog is not flipped
function flip_reset2() {
    glob_const.paymentdialogbox.css("transform", "rotateY(0deg)");
}

// Applies 180-degree rotation and flipped state
function add_flip() {
    glob_const.paymentdialogbox.css("transform", "rotateY(180deg)").addClass("flipped");
}

// Resets rotation and removes flipped state
function remove_flip() {
    glob_const.paymentdialogbox.css("transform", "rotateY(0deg)").removeClass("flipped");
}

// Manages front-face view state and input focus
function face_front() {
    if (request) {
        if (request.isrequest === false) {
            const share_button = $("#sharebutton"),
                request_title = $("#requesttitle"),
                request_name = $("#requestname"),
                amount_input = $("#amountbreak input");
            if (share_button.hasClass("sbactive")) {
                if (amount_input.val().length > 0 && glob_const.supportsTouch) {
                    setTimeout(function() {
                        request_title.add(request_name).blur();
                    }, 300);
                    return
                }
                setTimeout(function() {
                    amount_input.focus();
                }, 300);
                return
            }
            setTimeout(function() {
                request_title.attr("placeholder", tl("forexample") + ":" + request_title.attr("data-ph" + generate_random_number(1, 13)));
                amount_input.focus();
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

// Manages back-face view state and input validation
function face_back() {
    if (request) {
        if (request.isrequest === false) {
            const request_title = $("#requesttitle"),
                request_name = $("#requestname");
            if (request_name.val().length < 3) {
                setTimeout(function() {
                    request_name.focus();
                }, 300);
                return
            }
            if (request_title.val().length < 2) {
                setTimeout(function() {
                    request_title.focus();
                }, 300);
                return
            }
            const amount_input = $("#amountbreak input");
            if (amount_input.val().length > 0 && glob_const.supportsTouch) {
                setTimeout(function() {
                    amount_input.add(request_title).add(request_name).blur();
                }, 300);
                return
            }
            setTimeout(function() {
                request_title.focus();
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

// Triggers visual feedback animation for polling state
function poll_animate() {
    glob_const.paymentdialogbox.removeClass("poll");
    setTimeout(function() {
        glob_const.paymentdialogbox.addClass("poll");
    }, 100);
}

// ** Payment Flow: **

// Initializes the payment process and validates request parameters
function load_request(pass) {
    const url_params = get_urlparameters(),
        payment = url_params.payment;
    if (!payment) {
        return
    }
    if (glob_let.post_scan) { // wait till post_scan is finished
        play_audio("funk");
        return
    }
    reset_overflow();
    glob_let.apikey_fails = false;
    if (is_openrequest() === true) { // prevent double load
        return
    }
    if (!empty_obj(glob_let.sockets)) {
        play_audio("funk");
        notify(tl("closingsockets"));
        return
    }
    glob_let.l2s = {};
    loader();
    glob_let.symbolcache = br_get_local("symbols", true);
    if (glob_let.symbolcache) {
        if (url_params.xss) { //xss detection
            const content = "<h2 class='icon-warning'>" + glob_const.xss_alert + "</h2>";
            popdialog(content, "canceldialog");
            closeloader();
            return
        }
        const contact_form = exists(url_params.contactform);
        if (contact_form && pass !== true) { // show contactform
            edit_contactform(true);
            return
        }
        const coin_data = get_coin_config(payment);
        if (coin_data) {
            const is_erc20 = coin_data.erc20 === true,
                request_start_time = now_utc(),
                is_exact = exists(url_params.exact);
            // Start building request object
            request = {
                    "received": false,
                    "rq_init": request_start_time,
                    "rq_timer": request_start_time,
                    payment,
                    "coindata": coin_data,
                    "erc20": is_erc20,
                    "eth_l2s": [],
                    "boltcard": false
                }, // global request object
                helper = {
                    "exact": is_exact,
                    "contactform": contact_form,
                    "lnd": false,
                    "lnd_status": false,
                    "l1_status": false,
                    "l2_status": false
                }, // global helper object
                glob_let.api_attempt["crypto_price_apis"] = {},
                glob_let.api_attempt["fiat_price_apis"] = {},
                glob_let.proxy_attempts = {},
                glob_let.socket_attempt = {};
            if (is_erc20 === true) {
                const token_contract = coin_data.contract;
                if (token_contract) {
                    request.token_contract = token_contract;
                    get_tokeninfo(payment, token_contract);
                    return
                }
                const content = "<h2 class='icon-blocked'>" + tl("nofetchtokeninfo") + "</h2>";
                popdialog(content, "canceldialog");
                closeloader();
                return
            }
            if (payment === "ethereum") {
                get_l2_contracts("ethereum");
                return
            }
            continue_request();
            return
        }
        const content = "<h2 class='icon-blocked'>" + tl("currencynotsupported", {
            "currency": payment
        }) + "</h2>";
        popdialog(content, "canceldialog");
        closeloader();
        return
    } // need to set fixer API key first
    show_api_error("fixer", {
        "errorcode": "300",
        "errormessage": "Missing API key"
    }, true);
}

// Fetches and caches ERC20 token decimal information
function get_tokeninfo(payment_currency, contract) {
    const cached_decimals = br_get_local("decimals_" + payment_currency);
    if (cached_decimals) { // check for cached values
        request.decimals = cached_decimals;
        get_l2_contracts(payment_currency);
        return
    }
    set_loader_text(tl("gettokeninfo"));
    api_proxy({
        "api": "ethplorer",
        "search": "getTokenInfo/" + contract,
        "cachetime": 86400,
        "cachefolder": "1d",
        "params": {
            "method": "GET"
        }
    }).done(function(response) {
        const data = br_result(response).result,
            token_error = data.error;
        if (token_error) {
            const fallback_decimals = get_tokeninfo_local();
            if (fallback_decimals) {
                request.decimals = fallback_decimals;
                get_l2_contracts(payment_currency);
                br_set_local("decimals_" + payment_currency, fallback_decimals); //cache token decimals
                return
            }
            cancel_paymentdialog();
            fail_dialogs("ethplorer", {
                "error": token_error
            });
            return
        }
        const token_decimals = data.decimals;
        request.decimals = token_decimals;
        get_l2_contracts(payment_currency);
        br_set_local("decimals_" + payment_currency, token_decimals); //cache token decimals
    }).fail(function(xhr, status, error) {
        const fallback_decimals = get_tokeninfo_local();
        if (fallback_decimals) {
            request.decimals = fallback_decimals;
            get_l2_contracts(payment_currency);
            br_set_local("decimals_" + payment_currency, fallback_decimals); //cache token decimals
            return
        }
        if (get_next_proxy()) {
            get_tokeninfo(payment_currency, contract);
            return
        }
        cancel_paymentdialog();
        const error_object = xhr || status || error;
        fail_dialogs("ethplorer", {
            "error": error_object
        });
        closeloader();
    });
}

// Retrieves fallback token decimal information from local contract data
function get_tokeninfo_local() {
    const coin_symbol = q_obj(request, "coindata.ccsymbol");
    if (!coin_symbol) {
        return false
    }
    const token_contracts = contracts(coin_symbol);
    if (!token_contracts) {
        return false
    }
    const token_decimals = token_contracts.dec;
    return token_decimals || false;
}

// Fetch layer2 contracts if not already in cache
function get_l2_contracts(currency) {
    init_fetch_l2_contracts({ // route to fetch contracts
        currency,
        "name": "set_l2_contract"
    });
}

// Sets up payment dialog UI and initializes payment monitoring
function continue_request(contracts) {
    //set globals
    const url_params = get_urlparameters();
    if (url_params.xss) { //xss detection
        const content = "<h2 class='icon-warning'>" + glob_const.xss_alert + "</h2>";
        popdialog(content, "canceldialog");
        closeloader();
        return
    }
    const payment_currency = request.payment,
        is_erc20 = request.erc20,
        recipient_address = url_params.address,
        currency_check = is_erc20 ? "ethereum" : payment_currency,
        encoded_data = url_params.d,
        has_data = encoded_data && encoded_data.length > 5,
        decoded_data = has_data ? JSON.parse(atob(encoded_data)) : null, // decode data param if exists;
        is_lightning = decoded_data && decoded_data.imp, // check for lightning;
        is_lnd_only = recipient_address === "lnurl",
        is_valid_address = is_lnd_only ? true : check_address(recipient_address, currency_check); // validate address 
    if (is_valid_address === false) {
        const error_message = !recipient_address ? tl("undefinedaddress") : tl("invalidaddress", {
                "payment": payment_currency
            }),
            content = "<h2 class='icon-blocked'>" + error_message + "</h2>";
        popdialog(content, "canceldialog");
        closeloader();
        return
    }
    const api_details = check_api(payment_currency, is_erc20),
        is_request = br_get_local("editurl") !== glob_const.w_loc.search, // check if url is a request
        coin_data = request.coindata,
        coin_settings = active_coinsettings(payment_currency),
        unit_of_account = url_params.uoa,
        payment_amount = Number(url_params.amount),
        request_type = url_params.type,
        lightning_id = (decoded_data && decoded_data.lid) ? decoded_data.lid : false;
    let view_key = false,
        share_view_key = false,
        payment_id = (decoded_data && decoded_data.pid) ? decoded_data.pid : false,
        xmr_integrated_address = recipient_address;
    if (payment_currency === "monero") { // check for monero viewkey
        coin_data.monitored = false;
        view_key = (decoded_data && decoded_data.vk) ? {
                "account": recipient_address,
                "vk": decoded_data.vk
            } : get_vk(recipient_address),
            share_view_key = share_vk(),
            payment_id = payment_id ? payment_id : is_request ? false : get_xmrpid(),
            xmr_integrated_address = xmr_integrated(recipient_address, payment_id);
    }
    const coin_symbol = coin_data.ccsymbol,
        request_type_category = is_request ? (request_type) ? request_type :
        glob_const.inframe ? "checkout" : "incoming" : "local",
        type_code = request_type_category === "local" ? 1 :
        request_type_category === "outgoing" || request_type_category === "incoming" ? 2 :
        request_type_category === "checkout" ? 3 : 4,
        is_crypto_account = unit_of_account === coin_symbol,
        local_currency = $("#currencysettings").data("currencysymbol"), // can be changed in (settings)
        fiat_currency = is_crypto_account ? local_currency : unit_of_account,
        status_param = url_params.status,
        status = status_param || "new",
        is_paid = status ? status === "paid" : null,
        coin_market_id = coin_data.cmcid,
        coin_price_id = coin_symbol + "-" + payment_currency,
        is_pending = ch_pending({
            "address": xmr_integrated_address,
            "cmcid": coin_market_id
        }),
        is_monitored = view_key ? true : coin_data.monitored,
        pending_param = url_params.pending,
        pending_status = pending_param || is_monitored ? "incoming" : "unknown",
        socket_list = coin_settings.websockets || null,
        selected_socket = socket_list ? socket_list.selected || null : null,
        request_timestamp = decoded_data && decoded_data.ts ? decoded_data.ts : null,
        request_name = decoded_data && decoded_data.n ? decoded_data.n : null,
        request_title = decoded_data && decoded_data.t ? decoded_data.t : null,
        l2_object = q_obj(coin_settings, "layer2.options"),
        l2_array = is_request ? [] : l2_object ? get_set_l2s(l2_object, payment_currency) : [],
        eth_layer2_networks = decoded_data && decoded_data.l2 ? decoded_data.l2 : l2_array,
        l2_index = eth_layer2_networks[0];
    if (l2_index > -1 && contracts) {
        const l2_global = glob_const.eth_l2s,
            l2_name = Object.keys(l2_global)[l2_index];
        if (l2_name) {
            const l2_contract = contracts[l2_name];
            if (l2_contract) {
                const chainid = l2_global[l2_name];
                if (chainid) {
                    request.token_l2_contracts = contracts,
                        request.token_l2_contract = l2_contract,
                        request.chainid = chainid
                }
            }
        }
    }
    const current_confirmations = q_obj(coin_settings, "confirmations.selected"),
        data_obj_confirmations = q_obj(decoded_data, "c"),
        set_confirmations = parseFloat(data_obj_confirmations) || current_confirmations,
        is_instant = !set_confirmations,
        page_name_currency_param = is_crypto_account ? "" : payment_currency + " ",
        page_name = request_name ? tl("sharetitlename", {
            "requestname": request_name,
            "pagenameccparam": page_name_currency_param,
            "amount": payment_amount,
            "uoa": unit_of_account,
            "requesttitle": request_title
        }) : tl("sharetitle", {
            "pagenameccparam": page_name_currency_param,
            "amount": payment_amount,
            "uoa": unit_of_account
        }),
        request_class = is_request ? "request" : "norequest", //set classnames for request
        is_zero_amount = payment_amount === 0 || isNaN(payment_amount),
        is_zero_request = is_request && is_zero_amount,
        zero_class = is_zero_request ? " iszero" : "",
        display_class = is_crypto_account ? (unit_of_account === "btc" ? " showsat showlc showcc" : " showlc showcc") : (unit_of_account === fiat_currency ? "" : " showlc"),
        status_attribute = status || "unknown",
        status_class = status ? " " + status : " unknown",
        show_satoshis = payment_currency === "bitcoin" && cs_node("bitcoin", "showsatoshis", true).selected,
        type_class = " " + request_type_category,
        offline_class = glob_const.offline ? " br_offline" : "",
        pending_class = is_pending && is_monitored && request_type_category === "local" ? "ispending" : "",
        has_integrated_address = xmr_integrated_address === recipient_address ? false : xmr_integrated_address,
        show_qr = "showqr" in url_params,
        saved_name = $("#accountsettings").data("selected"),
        extended_request_data = {
            "uoa": unit_of_account,
            "amount": payment_amount,
            "address": recipient_address,
            "currencysymbol": coin_symbol,
            "cmcid": coin_market_id,
            "cpid": coin_price_id,
            status,
            saved_name,
            "pending": pending_status,
            "paid": is_paid,
            "isrequest": is_request,
            "requesttype": request_type_category,
            "typecode": type_code,
            "iscrypto": is_crypto_account,
            "localcurrency": local_currency,
            "fiatcurrency": fiat_currency,
            "requestname": request_name,
            "requesttitle": request_title,
            "eth_l2s": eth_layer2_networks,
            set_confirmations,
            "no_conf": !is_monitored,
            "instant": is_instant,
            "shared": is_request && request_timestamp !== null, // check if request is from a shared source,
            "iszero": is_zero_amount,
            "iszero_request": is_zero_request,
            "viewkey": view_key,
            "share_vk": share_view_key,
            payment_id,
            lightning_id,
            "xmr_ia": has_integrated_address,
            "monitored": is_monitored,
            "coinsettings": coin_settings,
            "dataobject": decoded_data,
            "showqr": show_qr
        },
        extended_helper_data = {
            socket_list,
            selected_socket,
            "requestclass": request_class,
            "iszeroclass": zero_class,
            "currencylistitem": $("#currencylist > li[data-currency='" + payment_currency + "'] .rq_icon"),
            "api_info": api_details,
            "lnd_only": is_lnd_only
        },
        payment_attributes = {
            "data-cmcid": coin_market_id,
            "data-currencysymbol": coin_symbol,
            "data-status": status_attribute,
            "data-showsat": show_satoshis,
            "data-pending": pending_class,
            "class": request_class + status_class + display_class + type_class + offline_class + zero_class
        },
        lightning_switch = payment_currency === "bitcoin" ? (is_request && !is_lightning ? "" : "<div id='lightning_switch' title='lightning' class='lnswitch'><span class='icon-power'></span></div>") : "",
        ndef_switch = payment_currency === "bitcoin" && glob_const.ndef ? "<div id='ndef_switch' title='Tap to pay' class='lnswitch'><span class='icon-connection'></span></div>" : "";
    update_page_title(page_name);
    glob_const.paymentdialogbox.append("<div id='request_back' class='share_request dialogstyle'></div><div id='request_front' class='dialogstyle'><div id='xratestats'><span id='rq_errlog'></span></div>" + ndef_switch + lightning_switch + "<div class='networks'></div></div>").attr(payment_attributes);
    // Extend global request object
    $.extend(request, extended_request_data);
    // Extend global helper object
    $.extend(helper, extended_helper_data);
    if (payment_currency === "monero" && view_key) {
        monero_setup(api_details.data);
        return
    }
    if (payment_currency === "bitcoin") {
        lightning_setup();
        return
    }
    proceed_pf();
}

// Checks monero node connection by fetching latest block used for starting index
function monero_setup(api_data) {
    if (api_data) {
        const node = api_data.url,
            proxy = node.includes(".onion") || glob_const.inframe;
        glob_let.rpc_attempts[sha_sub(node, 15)] = true;
        set_loader_text("connecting to " + truncate_middle(node));
        api_proxy({
            "api_url": node + "/json_rpc",
            proxy,
            "params": {
                "method": "POST",
                "contentType": "application/json",
                "data": {
                    "jsonrpc": "2.0",
                    "id": "0",
                    "method": "get_last_block_header"
                },
            }
        }).done(function(e) {
            const response = br_result(e).result;
            if (response) {
                const latest_block = q_obj(response, "result.block_header.height");
                if (latest_block) {
                    // set block index
                    request.xmr_block_index = latest_block;
                    if (api_data !== q_obj(helper, "api_info.data")) {
                        // reset api data
                        helper.api_info.data = api_data;
                    }
                    proceed_pf();
                    return
                }
            }
            monero_setup_fail(api_data);
        }).fail(function(e) {
            monero_setup_fail(api_data);
        });
    }
}

function monero_setup_fail(api_data) {
    const next_rpc = get_next_rpc("monero", api_data);
    if (next_rpc) {
        monero_setup(next_rpc);
        return
    }
    cancel_paymentdialog();
    // show monero RPC dialog
    $("#monero_settings .cc_settinglist li[data-id='apis']").trigger("click");
    // Redirect to monero settings page
    openpage("?p=monero_settings", "monero_settings", "loadpage");
    closeloader();
}

// Configures Lightning Network payment settings and validates node credentials for incoming or local requests
function lightning_setup() {
    if (request.isrequest === true) {
        const decoded_data = request.dataobject;
        if (decoded_data) {
            const implementation = decoded_data.imp;
            if (implementation) { //lightning request
                set_loader_text(tl("checklightningstatus", {
                    "imp": implementation
                }));
                const proxy_host_data = decoded_data.proxy,
                    node_host = decoded_data.host,
                    node_key = decoded_data.key,
                    direct_proxy = proxy_host_data ? proxy_host_data : (node_host && node_key) ? d_proxy() : null;
                if (direct_proxy) {
                    const proxy_details = lnurl_deform(direct_proxy),
                        proxy_key = proxy_details ? proxy_details.k : false,
                        lightning_id = decoded_data.lid,
                        lnd_payment_id = lightning_id ? lightning_id : (decoded_data.pid) ? sha_sub(decoded_data.pid, 10) : null;
                    if (lnd_payment_id) {
                        const encoded_proxy_host = lnurl_encode_save(direct_proxy),
                            proxy_host = encoded_proxy_host ? lnurl_deform(encoded_proxy_host).url : null,
                            node_id_source = node_host ? (implementation === "lnbits" ? node_key : node_host) : null,
                            derived_node_id = node_id_source ? sha_sub(node_id_source, 10) : false,
                            node_id = decoded_data.nid ? decoded_data.nid : (derived_node_id ? derived_node_id : null),
                            node_password = decoded_data.pw ? sha_sub(decoded_data.pw, 10) : (proxy_key ? proxy_key : null),
                            use_lnurl = !(node_host && node_key),
                            is_lnurl_only = !node_id,
                            is_shared = !!lightning_id,
                            lnd_config = {
                                "request": true,
                                "shared": is_shared,
                                "imp": implementation,
                                "proxy_host": encoded_proxy_host,
                                "nid": node_id,
                                "lnurl": is_lnurl_only,
                                "selected": true,
                                "pid": lnd_payment_id,
                                "host": node_host,
                                "key": node_key,
                                "pw": node_password
                            };
                        helper.lnd = lnd_config;
                        glob_let.lnd_ph = proxy_host;
                        const has_credentials = !!(node_host && node_key && node_id),
                            lnd_payload = {
                                "status": lnd_payment_id,
                                "cred": has_credentials ? btoa(JSON.stringify({
                                    "file": node_id,
                                    "host": node_host,
                                    "key": node_key
                                })) : false
                            }
                        lnd_put(proxy_host, node_password, lnd_payload, use_lnurl);
                        return
                    }
                    console.error("error", "missing payment id");
                } else {
                    console.error("error", "missing proxy");
                }
            } else {
                console.error("error", "missing implementation");
            }
        }
        proceed_pf();
        return
    }
    const lightning_list = get_lightning_settings(),
        lightning_data = lightning_list.data(),
        selected_service = lightning_data.selected_service;
    if (selected_service) {
        const implementation = selected_service.imp;
        set_loader_text(tl("checklightningstatus", {
            "imp": implementation
        }));
        const node_id = selected_service.node_id,
            available_proxies = lightning_data.proxies,
            proxy_id = selected_service.proxy_id,
            fetched_proxy = fetch_proxy(available_proxies, proxy_id),
            proxy_url = fetched_proxy ? fetched_proxy.proxy : lnurl_encode_save(lnd_pick_proxy()),
            proxy_details = lnurl_deform(proxy_url),
            proxy_host = proxy_details.url,
            proxy_key = proxy_details.k,
            is_local_proxy = is_local_node(proxy_url),
            proxy_enabled = selected_service.proxy,
            node_host = selected_service.host,
            is_local_node_host = is_local_node(node_host),
            node_key = selected_service.key,
            is_lnurl = !!selected_service.lnurl,
            is_lnurl_only = is_lnurl && !node_host,
            is_proxy_enabled = (proxy_enabled == true) ? true : false,
            saved_payment_id = br_get_session("lndpid"),
            payment_id = saved_payment_id ? saved_payment_id : sha_sub(now_utc(), 10),
            use_lnurl = is_lnurl_only || is_proxy_enabled,
            lnd_config = {
                "request": false,
                "shared": false,
                "imp": implementation,
                "proxy_host": proxy_url,
                "pid": payment_id,
                "proxy_id": proxy_id,
                "nid": node_id,
                "host": node_host,
                "key": node_key,
                "lnurl": is_lnurl,
                "name": selected_service.name,
                "proxy": is_proxy_enabled,
                "local_node": is_local_node_host,
                "local_proxy": is_local_proxy,
                "selected": lightning_data.selected
            };
        helper.lnd = lnd_config;
        glob_let.lnd_ph = proxy_host;
        const has_credentials = !!(node_host && node_key && node_id && !is_lnurl),
            lnd_payload = {
                "status": payment_id,
                "cred": has_credentials ? btoa(JSON.stringify({
                    "file": node_id,
                    "host": node_host,
                    "key": node_key
                })) : false
            }
        lnd_put(proxy_host, proxy_key, lnd_payload, use_lnurl);
        return
    }
    proceed_pf();
}

// Initializes communication with Lightning Network proxy server and handles authentication
function lnd_put(proxy_url, proxy_key, payload, is_lnurl) {
    const request_type = request.requesttype === "local" ? undefined : request.requesttype;
    glob_let.proxy_attempts[proxy_url] = true;
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy_url + "/proxy/v1/ln/api/",
        "data": {
            "fn": "put",
            "pl": payload,
            "rqtype": request_type,
            "x-api": proxy_key
        }
    }).done(function(response) {
        const is_successful = response.stat;
        if (is_successful === true) {
            test_lnd(is_lnurl);
            return
        }
        if (is_successful === "no write acces") {
            notify(tl("nowriteaccess"));
        }
        const data = br_result(response).result,
            response_error = data.error,
            default_error_message = tl("unabletoconnect");
        if (response_error) {
            const error_message = response_error.message || (typeof response_error === "string" ? response_error : default_error_message);
            if (request.isrequest) {
                if (helper.lnd_only) {
                    topnotify(error_message);
                    br_offline(true);
                }
            } else {
                notify(error_message);
                $("#rq_errlog").append("<span class='rq_err'>" + error_message + "</span>");
            }
        }
        proceed_pf();
    }).fail(function(xhr, status, error) {
        const is_proxy = q_obj(helper, "lnd.lnurl");
        if (is_proxy === false) {
            const saved_proxy = s_lnd_proxy();
            if (saved_proxy === false) {
                if (get_next_proxy()) {
                    lightning_setup();
                    return
                }
            }
        }
        proceed_pf();
    });
}

// Validates Lightning Network connection and implementation-specific status checks with caching
function test_lnd(is_lnurl) {
    const lnd_config = helper.lnd;
    if (!lnd_config.proxy_host) {
        proceed_pf();
        return
    }
    const status_cache_key = "lnd_timer_" + lnd_config.nid,
        cached_status_time = sessionStorage.getItem(status_cache_key);
    if (cached_status_time && (now_utc() - cached_status_time) < 20000) { // get cached status
        // lightning status is cached for 10 minutes
        helper.lnd_status = true;
        proceed_pf();
        return
    }
    sessionStorage.removeItem(status_cache_key);
    // functions in assets_js_bitrequest_lightning.js
    const node_host = lnd_config.host,
        is_onion_host = node_host && node_host.indexOf(".onion") > 0;
    if (is_lnurl || is_onion_host) {
        validate_lnurl_connection(lnd_config);
        return
    }
    if (lnd_config.imp === "lnd") {
        check_lnd_status(lnd_config);
        return
    }
    if (lnd_config.imp === "core-lightning") {
        check_c_lightning_status(lnd_config);
        return
    }
    if (lnd_config.imp === "lnbits") {
        check_lnbits_status(lnd_config);
        return
    }
}

// Finalizes payment setup after Lightning Network validation and handles offline scenarios
function proceed_pf(error_obj) {
    if (helper.lnd_status === false && helper.lnd_only) {
        request.monitored = false;
        const error_message = (error_obj) ? extract_error_details(error_obj, true) : tl("unabletoconnectln"),
            content = "<h2 class='icon-blocked'>" + error_message + "</h2>";
        cancel_paymentdialog();
        popdialog(content, "canceldialog");
        closeloader();
        return
    }
    const lightning_status = helper.lnd ? (helper.lnd.selected ? (helper.lnd_status ? "lnd_ao" : "lnd_active") : "lnd_inactive") : "no_lnd";
    glob_const.paymentdialogbox.attr({
        "data-lswitch": lightning_status,
        "data-lnd": lightning_status
    });
    if (request.isrequest === true && !request.showqr) {
        add_flip();
    }
    if (glob_const.offline) { // no price conversion when app is offline
        render_currencypool({
            "EUR": 1,
            "USD": 1.19
        }, 0, 000018, "coinmarketcap", "fixer", 0, 0);
        return
    }
    const selected_crypto_api = $("#cmcapisettings").data("selected"),
        crypto_api_list = "crypto_price_apis",
        cached_exchange_rates = br_get_session("xrates_" + request.currencysymbol, true);
    if (cached_exchange_rates) { //check for cached crypto rates in localstorage
        const current_timestamp = now_utc(),
            cached_timestamp = cached_exchange_rates.timestamp,
            usd_exchange_rate = cached_exchange_rates.ccrate,
            api_source = cached_exchange_rates.apisrc,
            cache_age = current_timestamp - cached_timestamp;
        if (cache_age > glob_const.cacheperiodcrypto) { //check if cached crypto rates are expired
            get_cc_exchangerates(crypto_api_list, selected_crypto_api);
            return
        } //fetch cache
        init_exchangerate(usd_exchange_rate, api_source, cache_age); //check for fiat rates and pass usd amount
        return
    }
    get_cc_exchangerates(crypto_api_list, selected_crypto_api);
}

// Fetches cryptocurrency rates from multiple APIs (CoinMarketCap, CoinGecko, CoinPaprika) with ERC20 token support
function get_cc_exchangerates(api_list, selected_api) {
    glob_let.api_attempt[api_list][selected_api] = true;
    set_loader_text(tl("getccrates", {
        "ccsymbol": request.currencysymbol,
        "api": selected_api
    }));
    const payment_currency = request.payment,
        token_contract = request.token_contract,
        is_erc20 = request.erc20 === true,
        coinmarketcap = selected_api === "coinmarketcap",
        coinpaprika = selected_api === "coinpaprika",
        coingecko = selected_api === "coingecko",
        api_search_path = coinmarketcap ? "v2/cryptocurrency/quotes/latest?id=" + request.cmcid :
        coinpaprika ? request.currencysymbol + "-" + payment_currency :
        coingecko ? (is_erc20 ? "simple/token_price/ethereum?contract_addresses=" + token_contract + "&vs_currencies=usd" : "simple/price?ids=" + payment_currency + "&vs_currencies=usd") :
        false,
        proxy = coinpaprika || coinmarketcap ? true : false;
    if (api_search_path === false) {
        closeloader();
        cancel_paymentdialog();
        fail_dialogs(selected_api, {
            "error": "Crypto price API not defined"
        });
        return
    }
    const api_request_payload = {
        "api": selected_api,
        "search": api_search_path,
        "cachetime": 90,
        "cachefolder": "1h",
        proxy,
        "params": {
            "method": "GET"
        },
    };
    api_proxy(api_request_payload).done(function(response) {
        const api_response_data = br_result(response).result,
            default_error_message = "unable to get " + payment_currency + " rate";
        if (api_response_data) {
            if (!empty_obj(api_response_data)) {
                const has_api_error = api_response_data.error || q_obj(api_response_data, "status.error_code");
                if (has_api_error) {
                    cc_fail(api_list, selected_api, has_api_error);
                    return
                }
                const price_node = is_erc20 ? token_contract : payment_currency,
                    crypto_exchange_rate = selected_api === "coinmarketcap" ? q_obj(api_response_data, "data." + request.cmcid + ".quote.USD.price") :
                    selected_api === "coinpaprika" ? q_obj(api_response_data, "quotes.USD.price") :
                    selected_api === "coingecko" ? q_obj(api_response_data, price_node + ".usd") :
                    null;
                if (crypto_exchange_rate) {
                    set_loader_text(tl("success"));
                    const current_timestamp = now_utc(),
                        cached_rate_data = {
                            "timestamp": current_timestamp,
                            "ccrate": crypto_exchange_rate,
                            "apisrc": selected_api
                        };
                    br_set_session("xrates_" + request.currencysymbol, cached_rate_data, true); //cache crypto rates in sessionstorage
                    init_exchangerate(crypto_exchange_rate, selected_api, 0); //pass usd amount, check for fiat rates
                    return
                }
                cc_fail(api_list, selected_api, default_error_message);
                return
            }
        }
        cc_fail(api_list, selected_api, default_error_message);
    }).fail(function(xhr, status, error) {
        const is_proxy_failure = is_proxy_fail(this.url),
            error_object = xhr || status || error;
        cc_fail(api_list, selected_api, error_object, is_proxy_failure);
    });
}

// Implements fallback logic for failed cryptocurrency rate fetches using alternative APIs and proxies
function cc_fail(api_list, selected_api, error_object, is_proxy_failure) {
    function next_proxy() { // try next proxy
        if (get_next_proxy()) {
            glob_let.api_attempt[api_list] = {};
            get_cc_exchangerates(api_list, selected_api);
            return true
        }
        return false
    }
    if (is_proxy_failure && next_proxy()) { // Try next proxy if proxy fails
        return
    }
    const next_crypto_api = try_next_api(api_list, selected_api);
    if (next_crypto_api) {
        get_cc_exchangerates(api_list, next_crypto_api);
        return
    }
    if (next_proxy()) { // Try next proxy after trying all api's
        return
    }
    no_xrate_result(selected_api, error_object);
}

// Orchestrates fiat currency rate fetching with cache validation and currency parameter preparation
function init_exchangerate(crypto_rate, crypto_api, cache_age) {
    set_loader_text(tl("getfiatrates"));
    const inverse_crypto_rate = 1 / crypto_rate,
        current_timestamp = now_utc(),
        is_new_currency = request.fiatcurrency !== request.localcurrency &&
        request.fiatcurrency !== "eur" &&
        request.fiatcurrency !== "usd" &&
        request.fiatcurrency !== request.currencysymbol, //check if currency request is other then usd, eur or localcurrency
        local_currency_param = request.localcurrency === "usd" || request.localcurrency === "btc" ? "usd,eur" :
        request.localcurrency === "eur" ? "eur,usd" :
        request.localcurrency + ",usd,eur", // set correct local currency / prevent btc
        new_currency_param = is_new_currency ? "," + request.fiatcurrency : "",
        currency_list = local_currency_param + new_currency_param,
        full_currency_string = request.currencysymbol + "," + currency_list,
        currency_cache = br_get_session("exchangerates", true),
        fiat_api = $("#fiatapisettings").data("selected"),
        fiat_api_list = "fiat_price_apis";
    helper.currencyarray = full_currency_string.split(",");
    if (currency_cache) { //check if cache exists
        const exchange_rates = currency_cache.fiat_exchangerates,
            target_currency_rate = exchange_rates[request.fiatcurrency];
        if (target_currency_rate) { //check if currency is in cache
            const exchange_rate_timestamp = currency_cache.timestamp,
                cache_expiration = current_timestamp - exchange_rate_timestamp,
                local_currency_rate = exchange_rates[request.fiatcurrency];
            if (cache_expiration > glob_const.cacheperiodfiat || local_currency_rate === undefined) { //check if cache is expired and if fiatcurrency is cached
                get_fiat_exchangerate(fiat_api_list, fiat_api, inverse_crypto_rate, currency_list, crypto_api, cache_age);
                return
            } //fetch cached exchange rates
            render_currencypool(exchange_rates, inverse_crypto_rate, crypto_api, currency_cache.api, cache_age, cache_expiration);
            return
        }
    }
    get_fiat_exchangerate(fiat_api_list, fiat_api, inverse_crypto_rate, currency_list, crypto_api, cache_age);
}

// Retrieves fiat exchange rates from multiple providers (Fixer, CoinGecko, ExchangeRatesAPI) with EUR base conversion
function get_fiat_exchangerate(api_list, selected_fiat_api, crypto_rate, currency_list, crypto_api, cache_age) {
    glob_let.api_attempt[api_list][selected_fiat_api] = true;
    set_loader_text(tl("fetchingfiatrates", {
        "fiatapi": selected_fiat_api
    }));
    // set apipath
    const api_search_path = selected_fiat_api === "fixer" ? "latest" :
        selected_fiat_api === "coingecko" ? "exchange_rates" :
        selected_fiat_api === "exchangeratesapi" ? "latest" :
        selected_fiat_api === "currencylayer" ? "live" :
        selected_fiat_api === "coinbase" ? "exchange-rates" :
        false;
    if (!api_search_path) {
        closeloader();
        cancel_paymentdialog();
        fail_dialogs(selected_fiat_api, {
            "error": "Fiat price API not defined"
        });
        return
    }
    api_proxy({
        "api": selected_fiat_api,
        "search": api_search_path,
        "cachetime": 540,
        "cachefolder": "1h",
        "params": {
            "method": "GET"
        }
    }).done(function(response) {
        const api_response_data = br_result(response).result,
            exchange_rates = selected_fiat_api === "fixer" ? api_response_data.rates :
            selected_fiat_api === "coingecko" ? api_response_data.rates :
            selected_fiat_api === "exchangeratesapi" ? api_response_data.rates :
            selected_fiat_api === "currencylayer" ? api_response_data.quotes :
            selected_fiat_api === "coinbase" ? api_response_data.data.rates :
            null;
        if (exchange_rates) {
            set_loader_text(tl("success"));
            const target_currency = request.fiatcurrency,
                target_currency_upper = target_currency.toUpperCase(),
                rates = {
                    "eur": 1
                };
            let usd_rate,
                local_rate;
            if (selected_fiat_api === "fixer") {
                usd_rate = exchange_rates.USD,
                    local_rate = exchange_rates[target_currency_upper];
            } else if (selected_fiat_api === "coingecko") {
                if (exchange_rates[target_currency]) {
                    const eur_rate = exchange_rates.eur.value;
                    usd_rate = exchange_rates.usd.value / eur_rate,
                        local_rate = exchange_rates[target_currency].value / eur_rate;
                }
            } else if (selected_fiat_api === "exchangeratesapi") {
                if (exchange_rates[target_currency_upper]) {
                    usd_rate = exchange_rates.USD,
                        local_rate = target_currency_upper === "EUR" ? 1 : exchange_rates[target_currency_upper];
                }
            } else if (selected_fiat_api === "currencylayer") {
                const local_key = exchange_rates["USD" + target_currency_upper];
                if (local_key) {
                    usd_rate = 1 / exchange_rates.USDEUR,
                        local_rate = local_key * usd_rate;
                }
            } else if (selected_fiat_api === "coinbase") {
                const local_key = exchange_rates[target_currency_upper];
                if (local_key) {
                    usd_rate = 1 / exchange_rates.EUR,
                        local_rate = local_key * usd_rate;
                }
            } else {
                closeloader();
                cancel_paymentdialog();
                fail_dialogs(selected_fiat_api, {
                    "error": "Fiat price API not defined"
                });
                return
            }
            if (local_rate && usd_rate) {
                rates.usd = usd_rate;
                if (target_currency !== "eur" && target_currency !== "usd" && target_currency !== "btc") {
                    rates[target_currency] = local_rate;
                }
                render_currencypool(rates, crypto_rate, crypto_api, selected_fiat_api, cache_age, "0"); // render exchangerates
                // cache exchange rates
                const exchange_rate_cache = {
                    "timestamp": now_utc(),
                    "fiat_exchangerates": rates,
                    "api": selected_fiat_api
                };
                br_set_session("exchangerates", exchange_rate_cache, true);
                return
            }
        }
        const next_fiat_api = try_next_api(api_list, selected_fiat_api);
        if (next_fiat_api) {
            get_fiat_exchangerate(api_list, next_fiat_api, crypto_rate, currency_list, crypto_api, cache_age);
            return
        }
        closeloader();
        cancel_paymentdialog();
        const error_code = api_response_data.error || "Failed to load data from " + selected_fiat_api;
        fail_dialogs(selected_fiat_api, {
            "error": error_code
        });
    }).fail(function(xhr, status, error) {
        const is_proxy_failure = is_proxy_fail(this.url),
            error_object = xhr || status || error;
        next_fiat_api(api_list, selected_fiat_api, error_object, crypto_rate, currency_list, crypto_api, cache_age, is_proxy_failure);
        return
    });
}

// Manages fallback logic for failed fiat rate fetches through alternative APIs and proxies
function next_fiat_api(api_list, selected_fiat_api, error_object, crypto_rate, currency_list, crypto_api, cache_age, is_proxy_failure) {
    function next_proxy() { // try next proxy
        if (get_next_proxy()) {
            glob_let.api_attempt[api_list] = {};
            get_fiat_exchangerate(api_list, selected_fiat_api, crypto_rate, currency_list, crypto_api, cache_age);
            return true
        }
        return false
    }
    if (is_proxy_failure && next_proxy()) { // Try next proxy if proxy fails
        return
    }
    const next_fiat_api = try_next_api(api_list, selected_fiat_api);
    if (next_fiat_api) {
        get_fiat_exchangerate(api_list, next_fiat_api, crypto_rate, currency_list, crypto_api, cache_age);
        return
    }
    if (next_proxy()) { // Try next proxy after trying all api's
        return
    }
    no_xrate_result(selected_fiat_api, error_object);
}

// Handles final error state when all exchange rate APIs and proxies fail
function no_xrate_result(api, error_obj) {
    closeloader();
    cancel_paymentdialog();
    fail_dialogs(api, {
        "error": error_obj
    });
}

// ** UI State Management: **

// Processes and displays multi-currency exchange rates with Lightning Network status information
function render_currencypool(data, crypto_rate, crypto_api, fiat_api, cache_age_crypto, cache_age_fiat) {
    const exchange_rates_list = [],
        usd_rate = data.usd, //cryptocurrency rate is in dollar, needs to be converted to euro
        crypto_rate_euro = crypto_rate * usd_rate,
        current_rate = request.iscrypto === true ? crypto_rate_euro : data[request.fiatcurrency],
        fiat_api_url = fiat_api === "fixer" ? "fixer.io" :
        fiat_api === "coingecko" ? "coingecko.com" :
        fiat_api === "exchangeratesapi" ? "exchangeratesapi.io" :
        fiat_api === "currencylayer" ? "currencylayer.com" :
        fiat_api === "coinbase" ? "coinbase.com" :
        null,
        crypto_rate_html = "<div data-currency='" + request.currencysymbol + "' data-value='' data-xrate='" + crypto_rate_euro + "' class='cpool ccpool' data-currencyname='" + request.payment + "'><span>" + crypto_api + ": <span class='ratesspan'>" + request.currencysymbol + "_" + request.uoa + ": " + (1 / (crypto_rate_euro / current_rate)).toFixed(2) + "</span></span></div><div class='cachetime'> (" + (cache_age_crypto / 60000).toFixed(1) + " of " + (glob_const.cacheperiodcrypto / 60000).toFixed(0) + " min. in cache)</div><br/><div class='mainrate'>" + fiat_api_url + ": </div>",
        rate_html_list = [];
    exchange_rates_list.push({
        "currency": request.currencysymbol,
        "xrate": crypto_rate_euro,
        "currencyname": request.payment
    });
    $.each(data, function(current_currency, rate) {
        const parsed_rate = (rate / current_rate) / 1,
            rate_span_class = parsed_rate === 1 ? " hide" : "",
            currency_name = glob_let.symbolcache[current_currency.toUpperCase()],
            rate_html = "<div data-currency='" + current_currency + "' data-value='' data-xrate='" + rate + "' class='cpool' data-currencyname='" + currency_name + "'><span class='ratesspan" + rate_span_class + "'>" + request.uoa + "_" + current_currency + ": " + parsed_rate.toFixed(2) + "</span></div>";
        rate_html_list.push(rate_html);
        exchange_rates_list.push({
            "currency": current_currency,
            "xrate": rate,
            "currencyname": currency_name
        });
    });
    helper.xrates = exchange_rates_list;
    const lightning_info = helper.lnd,
        proxy_icon = lightning_info && lightning_info.proxy ? "<span class='icon-sphere' title='" + lightning_info.proxy_host + "'></span>" : "",
        lightning_status_icon = helper.lnd_status ? " <span class='icon-connection'></span>" : " <span class='icon-wifi-off'></span>",
        node_name = lightning_info.name,
        lightning_node_name = request.isrequest === true ? "" : ": <span id='lnd_nodeinfo_trigger' title='" + node_name + "'>" + truncate_middle(node_name) + "</span>",
        lightning_node_info = lightning_info ? "<br/><span id='current_lndnode'><img src='" + c_icons(lightning_info.imp) + "' class='lnd_icon' title='" + lightning_info.imp + "'/> Lightning node" + lightning_node_name + lightning_status_icon + proxy_icon + "</span>" : "";
    $("#xratestats").prepend(crypto_rate_html + rate_html_list.join(" | ") + "<div class='cachetime'> (" + (cache_age_fiat / 60000).toFixed(1) + " of " + (glob_const.cacheperiodfiat / 60000).toFixed(0) + " min. in cache)</div><br/><span id='current_socket'></span>" + lightning_node_info);
    get_payment(crypto_rate_euro, crypto_api);
}

// Renders comprehensive payment dialog UI with currency conversions, QR codes, and dynamic form elements
function get_payment(ccrateeuro, ccapi) {
    closeloader();
    const currency_pool = $("#paymentdialog .cpool[data-currency='" + request.uoa + "']"),
        currency_name = currency_pool.attr("data-currencyname"),
        fiat_pool = $("#paymentdialog .cpool[data-currency='" + request.fiatcurrency + "']"),
        fiat_name = fiat_pool.attr("data-currencyname"),
        local_pool = $("#paymentdialog .cpool[data-currency='" + request.localcurrency + "']"),
        local_name = local_pool.attr("data-currencyname");
    // extend global request object
    request.currencyname = currency_name;
    request.fiatcurrencyname = fiat_name;
    request.localcurrencyname = local_name;
    // continue vars
    const exchange_rate = currency_pool.attr("data-xrate"),
        fiat_rate = fiat_pool.attr("data-xrate"),
        has_name = request.requestname && request.requestname.length > 1, // check if requestname is set
        has_title = request.requesttitle && request.requesttitle.length > 1, // check if requesttitle is set
        title_str = has_title ? request.requesttitle : "",
        saved_address = filter_addressli(request.payment, "address", request.address),
        has_label = saved_address.length > 0 && saved_address.data("label").length > 0,
        label_text = has_label ? saved_address.data("label") : "",
        label_html = has_label ? "<span id='labelbttn' class='linkcolor'>" + label_text + "</span>" : "", // check if label is set
        crypto_amount_raw = (request.amount / exchange_rate) * ccrateeuro,
        crypto_amount = parseFloat(crypto_amount_raw.toFixed(6)),
        zero_text = glob_const.zeroplaceholder,
        crypto_placeholder = request.iszero ? zero_text : crypto_amount,
        crypto_value = request.iszero ? "" : crypto_amount,
        sats = (crypto_amount_raw * 100000000).toFixed(0),
        fiat_amount = ((request.amount / exchange_rate) * fiat_rate).toFixed(2),
        fiat_value = request.iszero ? "" : fiat_amount,
        crypto_step = "0.00001",
        fiat_step = "0.1",
        step = request.iscrypto ? crypto_step : fiat_step,
        amount_placeholder = request.iszero ? zero_text : request.amount,
        amount_value = request.iszero ? "" : request.amount,
        sats_placeholder = request.iszero ? "000000000" : sats,
        sats_value = request.iszero ? "" : sats,
        display_currency = currency_name === "Euro" ? "" : request.iscrypto ? fiat_name : currency_name,
        crypto_text = "(" + crypto_value + " " + request.payment + ")",
        share_active = has_name && has_title ? " sbactive" : "",
        crypto_icon = getcc_icon(request.cmcid, request.cpid, request.erc20),
        lightning_icon = request.payment === "bitcoin" ? "<img src='img_logos_btc-lnd.png' class='cmc_icon icon_lnd'>" : "",
        share_btn = "<div class='button" + share_active + "' id='sharebutton'><span class='icon-share2'>" + tl("sharerequestbutton") + "</span></div>",
        saved_name = request.saved_name,
        set_saved_name = (saved_name === glob_const.apptitle) ? "" : saved_name,
        init_name = has_name ? request.requestname : set_saved_name,
        title_long = request.requesttitle && request.requesttitle.length > 65,
        exceed_class = title_long ? "title_exceed" : "",
        title_short = title_long ? request.requesttitle.substring(0, 44) + " ... " : request.requesttitle,
        title_quoted = (request.requesttitle && request.requesttitle.length > 1) ? "'" + title_short + "'" : "",
        header_html = request.isrequest ? "<div id='sharetitle' title='" + title_str + "' data-shorttitle='" + title_short + "' class='" + exceed_class + "'>" + title_quoted + "</div>" : "",
        wallet_addr = request.xmr_ia || request.address,
        readonly = (request.isrequest && !request.iszero) ? " readonly='readonly'" : "",
        request_info = "\
            <div id='requestinfo'>" +
        header_html +
        "<div id='shareamount' class='inputbreak'>\
                    <span id='sharecryptowrap'>" + crypto_icon + lightning_icon +
        "<span id='sharemainccinputmirror' class='ccmirror mirrordiv'>\
                            <span>" + crypto_placeholder + "</span>\
                            <input value='" + crypto_value + "' step='" + crypto_step + "' type='number' placeholder='" + zero_text + "'" + readonly + "/>\
                        </span>\
                    </span>\
                    <span id='shareinputmirror' class='fmirror mirrordiv'>\
                        <span>" + amount_placeholder + "</span>\
                        <input value='" + amount_value + "' step='" + step + "' type='number' placeholder='" + zero_text + "'" + readonly + "/>\
                    </span>\
                    <span id='sharecurrency'>" + request.uoa + "</span>\
                </div>\
                <div id='currencynamebox'>\
                    <span id='currencyname' data-currencyname='" + display_currency + "'>\
                        <span class='quote'>(</span>\
                        <span id='sharelcinputmirror' class='lcmirror mirrordiv'>\
                        <span>" + fiat_amount + "</span>\
                        <input value='" + fiat_value + "' step='" + fiat_step + "' type='number' placeholder='" + zero_text + "'" + readonly + "/>\
                    </span>\
                    <span id='sharelcname'>" + display_currency + "</span>\
                    <span class='quote'>)</span>\
                    </span>\
                </div>\
                <div id='ccamountbox'>\
                    <span id='ccamount'>(" + crypto_icon + lightning_icon +
        "<span id='shareccinputmirror' class='ccmirror mirrordiv'>\
                            <span>" +
        crypto_placeholder +
        "</span>\
                            <input value='" + crypto_value + "' step='" + crypto_step + "' type='number' placeholder='" + zero_text + "'" + readonly + "/>\
                        </span> " +
        request.payment + ")\
                    </span>\
                </div>\
            </div>",
        status_msg = request.paid ? (request.requesttype === "incoming" ? tl("paymentsent") : tl("paymentreceived")) : tl("waitingforpayment"),
        conf_txt = tl("confirmations"),
        conf_html = request.instant ? "" : "<span id='statusbox'>" + tl("waitingfor") + " <span id='confnumber'></span> " + conf_txt + " </span><span class='confbox'><span data-conf='0'>0</span> " + conf_txt + "</span>",
        status_panel = "\
            <div class='brstatuspanel'>\
                <img src='" + c_icons("confirmed") + "'/>\
                <div id='mainpulse' class='pulse'></div>\
                <div class='main_wifi_off icon-wifi-off'></div>\
                <h2>" + status_msg + "</h2>\
                <p>\
                    <span class='paymentdate'></span><br/>\
                    <span class='receivedcrypto'></span>\
                    <span class='receivedfiat'></span><br/>\
                    <span id='ibstatus'>\
                        <span id='inlinepulse' class='pulse'></span>\
                        <span class='wifi_off icon-wifi-off'></span>" +
        conf_html +
        "</span><br/>\
                    <span id='view_tx' class='linkcolor'>" + tl("viewdetails") + "</span>\
                </p>\
            </div>",
        readonly_attr = is_viewonly() ? " readonly='readonly'" : "",
        fallback_label = has_label ? " (" + label_text + ")" : "",
        fallback_html = (request.payment === "bitcoin" && !helper.lnd_only) ? "<div id='fallback_address'>Fallback address:<br/><span id='fb_addr'>" + request.address + fallback_label + "</span> " + switch_panel(false, " global") + "</div>" : "",
        share_form = "\
            <div id='shareformbox'>\
                <div id='shareformib' class='inputbreak'>\
                    <form id='shareform' disabled='' autocorrect='off' autocapitalize='sentences' spellcheck='off'>\
                        <label>" + tl("whatsyourname") + "<input type='text' placeholder='Name' id='requestname' class='linkcolor' value='" + init_name + "'" + readonly_attr + "></label>\
                        <label>" + tl("whatsitfor") + "<input type='text' placeholder='" + tl("forexample") + ": " + tl("lunch") + " 🥪' id='requesttitle' value='" + title_str + "' data-ph1=' " + tl("festivaltickets") + "' data-ph2=' " + tl("coffee") + " ☕' data-ph3=' " + tl("present") + " 🎁' data-ph4=' " + tl("snowboarding") + " 🏂' data-ph5=' " + tl("movietheater") + " 📽️' data-ph6=' " + tl("lunch") + " 🥪' data-ph7=' " + tl("shopping") + " 🛒' data-ph8=' " + tl("videogame") + " 🎮' data-ph9=' " + tl("drinks") + " 🥤' data-ph10=' " + tl("concerttickets") + " 🎵' data-ph11=' " + tl("camping") + " ⛺' data-ph12=' " + tl("taxi") + " 🚕' data-ph13=' " + tl("zoo") + " 🦒'></label>\
                    </form>" + fallback_html +
        "</div>\
                <div id='sharebox' class='inputbreak'>" + share_btn + "</div>\
            </div>",
        name_display = (request.requesttype === "outgoing") ? "" : (has_name ? tl("to") + " " + request.requestname + ":" : ""),
        wallet_text = tl("openwallet"),
        lightning_btn = (request.payment === "bitcoin") ? "<div class='button openwallet_lnd' id='openwallet_lnd' data-currency='bitcoin'><span class='icon-folder-open'>" + wallet_text + "</span></div>" : "",
        payment_methods = "\
            <div id='paymethods'>\
                <p id='requestnamep'>" + name_display + "</p>\
                <div id='scanqrib' class='inputbreak'>\
                    <div class='button' id='scanqr'>\
                        <span class='icon-qrcode'>" + tl("showqr") + "</span>\
                    </div><br/>\
                    <div class='button openwallet' id='openwallet' data-currency='" + request.payment + "'><span class='icon-folder-open'>" + wallet_text + "</span></div>" + lightning_btn +
        "</div>\
            </div>",
        powered_by = "<div class='poweredby'>Powered by: <a href='https://www.bitrequest.io' target='_blank'>Bitrequest</a></div>",
        bottom_content = request.isrequest ? payment_methods : share_form,
        qr_html = "<div id='qrcode' class='qrcode'><canvas width='256' height='256'></canvas></div>" + crypto_icon,
        lightning_qr = (request.payment === "bitcoin") ? "<div id='qrcode_lnd' class='qrcode'><canvas width='256' height='256'></canvas></div><img src='img_logos_btc-lnd.png' class='cmc_icon' id='lnd_icon'><img src='" + c_icons("phone-icon") + "' class='cmc_icon' id='phone_icon'>" : "",
        lightning_wallet = (request.payment === "bitcoin") ? "<div class='openwallet_lnd abr icon-folder-open linkcolor' data-currency='bitcoin' data-rel='0'>" + wallet_text + "</div>" : "";

    $("#request_front").prepend("<div class='time_panel'><div class='time_bar'></div></div><div id='cl_wrap'>" + crypto_icon + "</div>\
        <div class='actionbar clearfix'>\
            <div id='sharerequest' class='abl icon-share2 sbactive linkcolor'>" + tl("sharerequest") + "</div><div id='open_wallet' class='openwallet abr icon-folder-open linkcolor' data-currency='" + request.payment + "' data-rel='0'>" + tl("openwallet") + "</div>" + lightning_wallet +
        "</div>\
        <div class='qrwrap flex' id='main_qrwrap'>" + qr_html + lightning_qr + status_panel +
        "</div>\
        <div id='popform' data-payment='" + request.payment + "' data-currency='" + request.uoa + "' data-address='" + request.address + "' data-lcrate='" + fiat_rate + "'>\
            <div id='rf_wrap'>\
                <div id='amountbreak' class='inputbreak'>\
                    <span id='mainccinputmirror' class='ccmirror mirrordiv'>\
                        <span>" + crypto_placeholder + "</span>\
                        <input value='" + crypto_value + "' data-xrate='" + ccrateeuro + "' step='" + crypto_step + "' type='number' placeholder='" + zero_text + "'" + readonly + ">\
                    </span>\
                    <span id='amountinputmirror' class='fmirror mirrordiv'>\
                        <span>" + amount_placeholder + "</span>\
                        <input value='" + amount_value + "' data-xrate='" + exchange_rate + "' step='" + fiat_step + "' type='number' placeholder='" + zero_text + "'" + readonly + ">\
                    </span>\
                    <span id='pickcurrency' class='linkcolor'>" + request.uoa + "</span>\
                </div>\
                <div id='ibsat' class='inputbreak'>\
                    <span id='satinputmirror' class='mirrordiv'>\
                        <span>" + sats_placeholder + "</span>\
                        <input class='satinput' value='" + sats_value + "' data-xrate='" + ccrateeuro + "' max='10000000000000' type='number' placeholder='000000000'" + readonly + "/>\
                    </span> satoshis\
                </div>\
                <div id='iblc' class='inputbreak'>\
                    (<span id='lcinputmirror' class='lcmirror mirrordiv'>\
                        <span>" + fiat_amount + "</span>\
                        <input value='" + fiat_value + "' data-xrate='" + fiat_rate + "' step='" + fiat_step + "' type='number' placeholder='" + zero_text + "'" + readonly + "/>\
                    </span> " + request.fiatcurrency + ") \
                </div>\
                <div id='txibreak' class='inputbreak'> " + tl("send") + " <span id='ccinputmirror' class='ccmirror mirrordiv'><span>" + crypto_placeholder + "</span><input value='" + crypto_value + "' data-xrate='" + ccrateeuro + "' step='" + crypto_step + "' type='number' placeholder='" + zero_text + "'" + readonly + "/></span> " + request.currencysymbol + " " + tl("to") + label_html + ": </div>\
            </div>\
            <div id='paymentaddress' class='copyinput'>" + wallet_addr + "</div><div id='paymentaddress_lnd' class='copyinput' data-type='lightning invoice'></div>\
        </div>\
        <div id='apisrc'>" + tl("source") + ": " + ccapi + "</div>" + powered_by);
    glob_const.paymentdialogbox.find("#request_back").html("\
        <div class='time_panel'><div class='time_bar'></div></div>\
        <div class='actionbar clearfix'></div>\
        <div id='backwraptop' class='flex'>" + request_info + "</div>\
        <div id='backwrapbottom' class='flex'>" + bottom_content + status_panel + "</div><div class='networks'></div>" + powered_by);
    let save_request;
    show_paymentdialog();
    refresh_currency_pool(request.amount, exchange_rate);
    generate_payment_qr(request.payment, wallet_addr, crypto_value, request.requestname, request.requesttitle);
    if (request.isrequest) { // check for incoming requests
        if (!helper.contactform) { // indicates if it's a online payment so not an incoming request
            if (request.monitored) {
                if (request.iszero) {
                    main_input_focus();
                }
                save_request = save_payment_request("init");
            }
        }
    } else {
        main_input_focus();
    }
    if (save_request !== "nosocket") {
        close_socket().then(() => {
            init_socket(helper.selected_socket, request.address);
            set_dialog_timeout();
        });
    }
    // close loading screen when in iframe
    if (glob_const.inframe) {
        parent.postMessage("close_loader", "*");
    }
    const title_input = $("#requesttitle");
    title_input.attr("placeholder", tl("forexample") + ":" + title_input.attr("data-ph" + generate_random_number(1, 13)));
    console.log({
        "request_object": request
    });
    console.log({
        "helper": helper
    });
    const lightning_info = helper.lnd;
    if (lightning_info) {
        if (!request.lightning_id) {
            const saved_pid = br_get_session("lndpid");
            if (saved_pid && saved_pid == lightning_info.pid) {} else {
                br_set_session("lndpid", lightning_info.pid);
            }
        }
    }
}

// Updates exchange rate display text for all currencies in the pool
function update_exchange_rates_text(nextcurrency, newccrate) {
    $("#paymentdialog .cpool").each(function() {
        const current_node = $(this),
            current_node_rate = current_node.attr("data-xrate"),
            current_currency = current_node.attr("data-currency"),
            new_rate = current_node_rate / newccrate,
            is_cc_pool = current_node.hasClass("ccpool"),
            parsed_text = is_cc_pool ? current_currency + "_" + nextcurrency : nextcurrency + "_" + current_currency,
            parsed_rate = is_cc_pool ? 1 / new_rate : new_rate,
            current_node_text = parsed_text + ": " + (parsed_rate / 1).toFixed(2),
            rates_span = current_node.find(".ratesspan");
        rates_span.toggleClass("hide", parsed_rate == 1).text(current_node_text);
    });
}

// Updates currency pool values and related UI elements
function update_currency_pool(current_amount, current_rate, cc_value) {
    refresh_currency_pool(current_amount, current_rate);
    const url_params = get_urlparameters(),
        payment = url_params.payment,
        address = url_params.address,
        address_xmr_ia = request.xmr_ia || address;
    generate_payment_qr(payment, address_xmr_ia, cc_value);
    const page = url_params.p,
        currency = url_params.uoa,
        data_param = url_params.d ? "&d=" + url_params.d : "",
        start_url = page ? "?p=" + page + "&payment=" : "?payment=",
        href = start_url + payment + "&uoa=" + currency + "&amount=" + current_amount + "&address=" + address + data_param,
        page_name = tl("sharetitlechange", {
            "payment": payment,
            "newccvalue": current_amount,
            "newccsymbol": currency
        });
    helper.currencylistitem.data("url", href);
    request.amount = current_amount;
    update_request_url(href);
    update_page_title(page_name);
    glob_let.blocktyping = false;
}

// Refreshes currency pool display with current values
function refresh_currency_pool(current_amount, current_rate) {
    $("#paymentdialog .cpool").each(function() {
        const current_node = $(this),
            current_node_value = parseFloat((current_amount / current_rate) * current_node.attr("data-xrate")),
            display_value = current_node.hasClass("ccpool") ? current_node_value.toFixed(6) : current_node_value.toFixed(2);
        current_node.attr("data-value", display_value);
    });
}

// Generates and displays payment QR codes with amount information
function generate_payment_qr(payment, address, amount, lbl, msg) {
    const number = Number(amount),
        label = lbl || $("#paymentdialog input#requestname").val(),
        message = msg || $("#paymentdialog input#requesttitle").val(),
        is_zero = number === 0 || isNaN(number),
        url_scheme = request.coindata.urlscheme(payment, address, amount, is_zero, label, message);
    $("#qrcode").empty().qrcode(url_scheme);
    set_wallet_uris(url_scheme, amount);
    if (helper.lnd) { // lightning
        set_lightning_qr(amount, message);
    }
}

// Sets wallet URI schemes for payment initiation
function set_wallet_uris(url_scheme, amount) {
    $("#paymentdialogbox .openwallet").attr({
        "data-rel": amount,
        "title": url_scheme
    });
}

// Configures Lightning Network QR code display
function set_lightning_qr(a, message) {
    const ln = helper.lnd,
        m = message && message.length > 1 ? "&m=" + encodeURIComponent(message) : "",
        nid = ln.lnurl === false ? ln.nid : "",
        url = glob_let.lnd_ph + "/proxy/v1/ln/?i=" + ln.imp + "&id=" + request.typecode + ln.pid + nid + "&a=" + (a * 100000000000).toFixed(0) + m,
        lnurl = lnurl_encode("lnurl", url).toUpperCase();
    $("#qrcode_lnd").html("").qrcode(lnurl);
    set_lightning_uris(lnurl, a);
}

// Sets Lightning Network wallet URIs and address display
function set_lightning_uris(url_scheme, amount) {
    $("#paymentdialogbox .openwallet_lnd").attr({
        "data-rel": amount,
        "title": "lightning:" + url_scheme
    });
    $("#paymentaddress_lnd").text(url_scheme);
}

// Handles QR code scanner activation with form state management
function scan_qr() {
    $(document).on("click", "#scanqr", function() {
        remove_flip();
        if (request.iszero_request) {
            $("#amountbreak input").focus();
        }
    });
}

// Toggles visibility of API statistics panel
function show_api_stats() {
    $(document).on("click", "#apisrc", function() {
        $("#xratestats").toggleClass("show");
    });
}

// Collapses API statistics panel
function hide_api_stats() {
    $(document).on("click", "#xratestats", function() {
        $(this).removeClass("show");
    });
}

// ** Input Sync: **

// Synchronizes fiat amount inputs across the payment dialog
function sync_fiat_inputs() {
    $(document).on("input", "#paymentdialogbox .fmirror > input", function() {
        glob_let.blocktyping = true;
        const current_node = $(this),
            current_amount = current_node.val(),
            is_zero = current_amount.length === 0,
            placeholder = is_zero ? glob_const.zeroplaceholder : current_amount,
            current_rate = $("#amountinputmirror > input").attr("data-xrate"),
            amount_input_value = is_zero ? glob_const.zeroplaceholder : current_amount;
        $("#paymentdialogbox .fmirror > input").not(current_node).val(current_amount).prev("span").text(placeholder);
        update_local_currency(current_amount, current_rate);
        update_crypto_display(current_amount, current_rate);
        update_satoshi_display(current_amount, current_rate);
        update_currency_pool(amount_input_value, current_rate, calculate_crypto_amount(current_amount, current_rate));
    });
}

// Synchronizes local currency inputs and updates related values
function sync_local_currency() {
    $(document).on("input", "#paymentdialogbox .lcmirror > input", function() {
        glob_let.blocktyping = true;
        const current_node = $(this),
            current_amount = current_node.val(),
            current_rate = $("#lcinputmirror > input").attr("data-xrate");
        $("#paymentdialogbox .lcmirror > input").not(current_node).val(current_amount).prev("span").text(current_amount);
        update_fiat_display(current_amount, current_rate, "fiat");
        update_crypto_display(current_amount, current_rate, "fiat");
        update_satoshi_display(current_amount, current_rate);
    });
}

// Synchronizes cryptocurrency amount inputs across the interface
function sync_crypto_inputs() {
    $(document).on("input", "#paymentdialogbox .ccmirror > input", function() {
        glob_let.blocktyping = true;
        const current_node = $(this),
            current_amount = current_node.val(),
            placeholder = current_amount.length === 0 ? glob_const.zeroplaceholder : current_amount,
            current_rate = $("#mainccinputmirror > input").attr("data-xrate");
        $("#paymentdialogbox .ccmirror > input").not(current_node).val(current_amount).prev("span").text(placeholder);
        update_fiat_display(current_amount, current_rate, "crypto");
        update_local_currency(current_amount, current_rate);
        update_satoshi_display(current_amount, current_rate);
    });
}

// Manages satoshi value input and corresponding conversions
function sync_satoshi_input() {
    $(document).on("input", "#satinputmirror > input", function() {
        glob_let.blocktyping = true;
        const current_node = $(this),
            current_amount_pre = current_node.val(),
            current_amount = current_amount_pre.length === 0 ? current_amount_pre : current_amount_pre / 100000000,
            current_rate = $("#mainccinputmirror > input").attr("data-xrate");
        update_fiat_display(current_amount, current_rate, "crypto");
        update_local_currency(current_amount, current_rate);
        update_crypto_display(current_amount, current_rate, "crypto");
    });
}

// Updates fiat currency values based on input changes
function update_fiat_display(current_amount, current_rate, field_type) { // reflect fiat values
    const amount_input_rate = $("#amountinputmirror > input").attr("data-xrate"), //get fiat rate
        is_zero = current_amount.length === 0,
        decimal_places = glob_const.paymentdialogbox.hasClass("showcc") ? 6 : 2,
        current_amount_value = parseFloat(((current_amount / current_rate) * amount_input_rate).toFixed(decimal_places)),
        current_amount_placeholder = is_zero ? glob_const.zeroplaceholder : current_amount_value,
        cc_value = is_zero ? glob_const.zeroplaceholder : (field_type == "crypto" ? current_amount : calculate_crypto_amount(current_amount, current_rate));
    sync_input_values($("#paymentdialogbox .fmirror > input"), current_amount_value, current_amount_placeholder); // reflect fiat values on sharedialog
    update_currency_pool(current_amount_value, amount_input_rate, cc_value);
}

// Updates local currency display based on current rates
function update_local_currency(current_amount, current_rate) { // reflect local currency value
    const lc_rate = $("#popform").attr("data-lcrate"),
        lc_value = ((current_amount / current_rate) * lc_rate).toFixed(2),
        lc_placeholder = current_amount.length === 0 ? glob_const.zeroplaceholder : lc_value;
    sync_input_values($("#paymentdialogbox .lcmirror > input"), lc_value, lc_placeholder);
}

// Updates cryptocurrency value displays across the interface
function update_crypto_display(current_amount, current_rate, field_type) { // reflect crypto input
    const cc_value = current_amount.length === 0 ? glob_const.zeroplaceholder : (field_type == "crypto" ? current_amount.toFixed(6) : calculate_crypto_amount(current_amount, current_rate));
    sync_input_values($("#paymentdialogbox .ccmirror > input"), cc_value, cc_value);
}

// Updates satoshi value display based on current amount
function update_satoshi_display(current_amount, current_rate, field_type) { // reflect sat input
    const is_zero = current_amount.length === 0,
        cc_value = is_zero ? glob_const.zeroplaceholder : (field_type == "crypto" ? current_amount : calculate_crypto_amount(current_amount, current_rate)),
        sat_value = (cc_value * 100000000).toFixed(0),
        sat_placeholder = is_zero ? "000000000" : sat_value;
    sync_input_values($("#satinputmirror > input"), sat_value, sat_placeholder);
}

// Synchronizes input field values and their visual placeholders
function sync_input_values(input_node, value, placeholder) {
    const val_correct = (value == 0 || value == "0.00") ? "" : value;
    input_node.val(val_correct).prev("span").text(placeholder);
}

// Calculates cryptocurrency value based on input amount and exchange rate
function calculate_crypto_amount(current_amount, current_rate) { // get ccrate
    return parseFloat(((current_amount / current_rate) * $("#paymentdialogbox .ccpool").attr("data-xrate")).toFixed(6));
}

// Handles real-time input mirroring across payment dialog
function mirror_input_value() {
    $(document).on("input change", ".mirrordiv > input", function() {
        const current_input = $(this),
            current_value = current_input.val(),
            mirror_div = current_input.prev("span"),
            placeholder = current_input.hasClass("satinput") ? "000000000" : current_input.attr("placeholder");
        mirror_div.text(current_value.length === 0 ? placeholder : current_value);
        set_dialog_timeout();
    });
}

// ** Lightning & NFC: **

// Handles Lightning Network toggle with status validation and user confirmation
function lnd_switch_function() {
    $(document).on("click", "#paymentdialogbox #lightning_switch", function() {
        if (helper.lnd) {
            if (helper.lnd_only) {
                play_audio("funk");
                return
            }
            if (helper.lnd.selected) {
                lnd_statusx();
                return
            }
            const confirm_result = confirm(tl("enablelightning"));
            if (confirm_result === true) {
                const lnd_list_item = get_lightning_settings();
                lnd_list_item.data("selected", true).find(".switchpanel").removeClass("false").addClass("true");
                save_cc_settings("bitcoin", true);
                if (helper.lnd_status) {
                    helper.lnd.selected = true;
                    glob_const.paymentdialogbox.attr("data-lswitch", "lnd_ao");
                    return
                }
                notify("<span id='lnd_offline'>" + tl("lnoffline") + "</span>", 200000, "yes");
                return
            }
            play_audio("funk");
            return
        }
        if (request.isrequest) {
            play_audio("funk");
            return
        }
        lnd_popup();
    });
}

// Manages NFC payment functionality for compatible devices
function ndef_switch_function() {
    $(document).on("click", "#paymentdialogbox #ndef_switch", function() {
        notify(tl("tabyourboldcard"), 10000);
    });
}

// Toggles Lightning Network payment mode with status validation
function lnd_statusx() {
    if (helper.lnd_status) {
        if (lightning_mode()) {
            glob_const.paymentdialogbox.attr("data-lswitch", "");
            return
        }
        glob_const.paymentdialogbox.attr("data-lswitch", "lnd_ao");
        return
    }
    if (request.isrequest) {
        play_audio("funk");
        return
    }
    notify("<span id='lnd_offline'>" + tl("lnoffline") + "</span>", 200000, "yes");
}

// Binds click handler for Lightning Network offline status notification
function lnd_offline() {
    $(document).on("click", "#lnd_offline", lnd_popup);
}

// Attaches click handler for Lightning Network node information display
function lnd_ni() {
    $(document).on("click", "#paymentdialogbox #current_lndnode #lnd_nodeinfo_trigger", function(e) {
        e.stopPropagation();
        lnd_popup();
        topnotify(tl("addlightningnode"));
    });
}

// Triggers Lightning Network configuration interface
function lnd_popup() {
    render_lightning_interface();
}

// ** Request Management: **

// Manages currency switching with dynamic UI updates and URL state management
function switch_currency() {
    $(document).on("click", "#paymentdialogbox #pickcurrency", function() {
        const current_node = $(this),
            currencyarray = helper.currencyarray,
            payment = request.payment,
            next_currency_scan = currencyarray[$.inArray(request.uoa, currencyarray) + 1],
            next_currency = next_currency_scan || currencyarray[0],
            newccnode = $("#paymentdialog .cpool[data-currency='" + next_currency + "']"),
            newccsymbol = newccnode.attr("data-currency"),
            newccname = newccnode.attr("data-currencyname"),
            newccvalue = newccnode.attr("data-value"),
            nccvalstrip = newccvalue.replace(/\.00$/, ""),
            newccrate = newccnode.attr("data-xrate"),
            sharelcname = newccname === "Euro" ? "" : (newccnode.hasClass("ccpool") ? request.fiatcurrencyname : newccname),
            mirrordiv = current_node.prev("#amountinputmirror"),
            amountinput = mirrordiv.children("input"),
            amount_input_value = amountinput.val(),
            number = Number(amount_input_value),
            this_iszero = number === 0 || isNaN(number),
            newccvaluevar = this_iszero ? "" : nccvalstrip,
            newccvalueplaceholder = this_iszero ? glob_const.zeroplaceholder : nccvalstrip,
            iscrypto = newccsymbol == request.currencysymbol,
            dialogclass = iscrypto ? (newccsymbol === "btc" ? " showsat showlc showcc" : " showlc showcc") : (newccsymbol === request.fiatcurrency ? "" : " showlc"), // set classnames for hiding / showing inputs
            gets = get_urlparameters(),
            page = gets.p,
            address = gets.address,
            data = gets.d && gets.d.length > 5 ? "&d=" + gets.d : "",
            starturl = page ? "?p=" + page + "&payment=" : "?payment=",
            href = starturl + payment + "&uoa=" + newccsymbol + "&amount=" + nccvalstrip + "&address=" + address + data,
            pagename = tl("sharetitlechange", {
                "payment": payment,
                "newccvalue": nccvalstrip,
                "newccsymbol": newccsymbol
            });
        request.uoa = next_currency,
            request.amount = nccvalstrip,
            request.iscrypto = iscrypto;
        current_node.add("#sharecurrency").text(newccsymbol);
        $("#sharelcname").text(sharelcname);
        amountinput.val(newccvaluevar).attr("data-xrate", newccrate).prev("span").text(newccvalueplaceholder);
        $("#shareinputmirror > input").val(newccvaluevar).prev("span").text(newccvalueplaceholder);
        glob_const.paymentdialogbox.attr("class", helper.requestclass + dialogclass + helper.iszeroclass);
        main_input_focus();
        update_request_url(href);
        update_page_title(pagename);
        update_exchange_rates_text(newccsymbol, newccrate);
    });
}

// Validates and encodes request metadata including Lightning Network and Monero-specific data
function validate_request_data(lnurl) {
    const url_params = get_urlparameters(),
        request_name = $("input#requestname").val(),
        request_title = $("input#requesttitle").val(),
        is_valid = request_name.length > 2 && request_title.length > 1,
        share_button = $("#sharebutton"),
        page = url_params.p,
        payment = url_params.payment,
        currency = url_params.uoa,
        amount = url_params.amount,
        address = lnurl ? "lnurl" : url_params.address,
        start_url = page ? "?p=" + page + "&payment=" : "?payment=",
        current_url = start_url + payment + "&uoa=" + currency + "&amount=" + amount + "&address=" + address,
        lightning_info = helper.lnd;
    let new_url;
    if (is_valid) {
        const current_utc = now_utc(), // UTC
            data_object = {
                "ts": current_utc,
                "n": request_name,
                "t": request_title
            };
        if (!request.no_conf) {
            data_object.c = request.set_confirmations;
        }
        if (payment === "monero") {
            if (request.viewkey || request.xmr_ia) {
                if (request.viewkey && request.share_vk) {
                    data_object.vk = request.viewkey.vk;
                }
                if (request.xmr_ia) {
                    data_object.pid = request.payment_id;
                }
            }
        }
        if (lightning_info && lightning_mode()) { // lightning data
            data_object.imp = lightning_info.imp;
            data_object.lid = lightning_info.pid;
            data_object.proxy = lightning_info.proxy_host;
            if (!lightning_info.lnurl) {
                data_object.nid = lightning_info.nid;
            }
            set_lightning_qr($("#ccinputmirror > input").val(), request_title);
        }
        // Include eth l2 chain data
        if (request.eth_l2s.length) {
            data_object.l2 = request.eth_l2s;
        }
        new_url = current_url + "&d=" + btoa(JSON.stringify(data_object));
        request.requestname = request_name,
            request.requesttitle = request_title;
        share_button.addClass("sbactive");
    } else {
        new_url = current_url;
        share_button.removeClass("sbactive");
    }
    helper.currencylistitem.data("url", new_url);
    update_request_url(new_url);
    const cc_value = $("#paymentdialogbox .ccpool").attr("data-value");
    generate_payment_qr(payment, address, cc_value, request_name, request_title);
}

// Triggers request data validation on form input changes
function input_requestdata() {
    $(document).on("input", "#shareform input", function() {
        validate_request_data();
        set_dialog_timeout();
    });
}

// Enforces numeric input constraints and step validation for payment amounts
function validate_steps() {
    function basic_normalize(value) {
        let match = value.match(/([.,])(?=\d*$)/),
            decimal_pos = match ? match.index : -1,
            normalized = "";
        for (let i = 0; i < value.length; i++) {
            let char = value[i];
            if (/\d/.test(char)) {
                normalized += char;
            } else if (i === decimal_pos) {
                normalized += ".";
            }
        }
        return normalized;
    }

    function full_normalize(value, remove_trailing_dot = false) {
        let normalized = basic_normalize(value),
            ends_with_dot = normalized.endsWith(".");
        if (remove_trailing_dot && ends_with_dot) {
            normalized = normalized.slice(0, -1);
            ends_with_dot = false;
        }
        if (normalized.replace(/\./g, "") === "") {
            return "";
        }
        const parts = normalized.split(".");
        let int_part = parts[0] || "",
            dec_part = parts[1] || "";
        const original_int_part_length = int_part.length;
        int_part = int_part.replace(/^0+/, "");
        if (int_part === "") {
            if (original_int_part_length > 0 || dec_part !== "" || ends_with_dot) {
                int_part = "0";
            }
        }
        let result = int_part + (dec_part ? "." + dec_part : (ends_with_dot ? "." : ""));
        return result;
    }

    $(document).on("keydown", "#paymentdialogbox .mirrordiv input", function(e) {
        if (glob_let.blocktyping === true) {
            play_audio("funk");
            glob_let.blocktyping = false;
            e.preventDefault();
            return
        }
        const current_input = $(this),
            current_value = current_input.val(),
            key_code = e.keyCode,
            restricted_key_codes = [188, 190, 108, 110, 229];
        if (restricted_key_codes.includes(key_code)) { // prevent double commas and dots
            const value_length = current_value.length;
            if (value_length) {
                if (glob_let.prevkey || current_value.includes(".") || current_value.includes(",") || !e.target.validity.valid || current_input.hasClass("satinput")) {
                    e.preventDefault();
                    return
                }
                // For comma keys, insert dot instead
                if (key_code === 188 || key_code === 110) {
                    e.preventDefault();
                    const input_element = this;
                    input_element.type = "text";
                    const start = input_element.selectionStart,
                        end = input_element.selectionEnd;
                    input_element.value = current_value.slice(0, start) + "." + current_value.slice(end);
                    input_element.selectionStart = input_element.selectionEnd = start + 1;
                    // Trigger 'input' event to apply normalization immediately
                    input_element.dispatchEvent(new Event("input", {
                        "bubbles": true
                    }));
                    // Do not restore type here; handle in 'input' and 'blur'
                    glob_let.prevkey = true;
                    return
                }
                glob_let.prevkey = true;
                return
            }
            e.preventDefault();
            return
        }
        if (key_code === 8) { // allow backspace
            glob_let.prevkey = false;
            return
        }
        const is_command_key = (key_code === 91 || key_code === 17 || e.metaKey || e.ctrlKey);
        if (is_command_key) {
            if (key_code === 65) { // unblock comma on select all
                glob_let.prevkey = false;
            }
            return
        }
        if (key_code === 37 || key_code === 39) { // arrowleft, arrowright
            return
        }
        if ((key_code >= 48 && key_code <= 57) || (key_code >= 96 && key_code <= 105)) { //only allow numbers
            if (!e.target.validity.valid) { //test input pattern and steps attributes
                const selected_text = document.getSelection().toString();
                if (selected_text.replace(",", ".") !== current_value.replace(",", ".")) {
                    e.preventDefault();
                }
            }
            return
        }
        e.preventDefault();
    });

    // Handle paste event to normalize pasted content
    $(document).on("paste", "#paymentdialogbox .mirrordiv input", function(e) {
        e.preventDefault();
        const input_element = this,
            pasted = (e.originalEvent || e).clipboardData.getData("text"),
            normalized = basic_normalize(pasted);
        // Temporarily switch to text for insertion
        input_element.type = "text";
        const start = input_element.selectionStart,
            end = input_element.selectionEnd,
            current_value = input_element.value;
        input_element.value = current_value.slice(0, start) + normalized + current_value.slice(end);
        input_element.selectionStart = input_element.selectionEnd = start + normalized.length;
        // Trigger 'input' event to apply normalization immediately
        input_element.dispatchEvent(new Event("input", {
            "bubbles": true
        }));
        // Do not switch back; let 'input' handle
    });

    // Additional handler to normalize the input value and ensure only one decimal
    $(document).on("input", "#paymentdialogbox .mirrordiv input", function() {
        const input_element = this;
        let value = input_element.value,
            normalized = full_normalize(value);
        if (normalized !== value) {
            input_element.value = normalized;
            value = normalized;
        }
        // If type is 'text' and value is empty or now a valid number (no trailing dot), switch back to 'number'
        if (input_element.type === "text" && (normalized === "" || (!normalized.endsWith(".") && !isNaN(parseFloat(normalized)) && isFinite(normalized)))) {
            input_element.type = "number";
        }
    });

    // On blur, clean up trailing dot and switch back to 'number'
    $(document).on("blur", "#paymentdialogbox .mirrordiv input", function() {
        const input_element = this;
        if (input_element.type === "text") {
            let value = input_element.value,
                normalized = full_normalize(value, true);
            input_element.value = normalized;
            input_element.type = "number";
        }
        glob_let.prevkey = false;
    });
}

// Toggles payment request form display with pending payment validation
function flip_request() {
    $(document).on("click", "#paymentdialogbox.norequest #sharerequest", function(e) {
        e.preventDefault();
        const is_lightning_mode = lightning_mode();
        if (glob_const.paymentdialogbox.attr("data-pending") === "ispending" && !is_lightning_mode) {
            if (request.payment === "monero") {
                notify(tl("addressinuse") + ". <span id='xmrsettings' class='linkcolor'>" + tl("activateintegrated") + "?</span>", 40000, "yes");
                return
            }
            pending_request();
            return
        }
        if (is_lightning_mode && glob_const.paymentdialogbox.hasClass("accept_lnd")) {
            return
        }
        flip_right1();
    });
}

// Toggles between shortened and full title display for long request titles
function reveal_title() {
    $(document).on("click", "#paymentdialogbox.request #sharetitle.title_exceed", function(e) {
        const current_node = $(this),
            long_text = current_node.attr("title"),
            short_text = current_node.attr("data-shorttitle"),
            new_text = current_node.hasClass("longtext") ? short_text : long_text;
        current_node.text("'" + new_text + "'").toggleClass("longtext");
    });
}

// Manages pending request handling and alternative address selection
function pending_request() {
    const current_address = request.address,
        payment = request.payment,
        currency_id = request.cmcid,
        currency_symbol = request.currencysymbol,
        pending_transaction = $("#requestlist li[data-address='" + current_address + "'][data-pending='scanning'][data-cmcid='" + currency_id + "']").first(),
        pending_request_id = pending_transaction.data("requestid"),
        non_pending_addresses = filter_addressli(payment, "checked", true).filter(function() {
            let current_node = $(this);
            return !ch_pending({
                "address": current_node.data("address"),
                "cmcid": current_node.data("cmcid")
            });
        }),
        has_available_addresses = non_pending_addresses.length > 0;
    let dialog_content,
        address_list = "";
    if (has_available_addresses) {
        address_list = non_pending_addresses.map(function() {
            const address_data = $(this).data();
            return "<span data-address='" + address_data.address + "' data-pe='none'>" + address_data.label + " | " + address_data.address + "</span>";
        }).get().join("");
        const first_address = non_pending_addresses.first(),
            first_address_data = first_address.data();
        dialog_content = "<h3>" + tl("pickanotheraddress") + "</h3><div class='selectbox'>\
            <input type='text' value='" + first_address_data.label + " | " + first_address_data.address + "' placeholder='Pick currency' readonly id='selec_address'/>\
            <div class='selectarrows icon-menu2' data-pe='none'></div>\
            <div class='options'>" + address_list + "</div>\
        </div>\
        <input type='submit' class='submit' value='" + tl("okbttn") + "' id='pending_pick_address'/>";
    } else {
        dialog_content = "<div id='addaddress' class='button'><span class='icon-plus'>" + tl("addcoinaddress", {
            "currency": currency_symbol
        }) + "</span></div><input type='submit' class='submit' value='" + tl("okbttn") + "' id='pending_add_address'/>";
    }
    const content = "<div class='formbox' id='addresslock' data-currency='" + payment + "' data-currencysymbol='" + currency_symbol + "' data-cmcid='" + currency_id + "'><h2 class='icon-lock'>" + tl("sharelocktitle") + "</h2><p>" + tl("sharelockttext", {
        "pending_requestid": pending_request_id
    }) + "<br/>" + tl("waitforconfirm") + "</p>\
    <div class='popnotify'></div>\
    <div class='popform validated'>" + dialog_content + "</div>";
    popdialog(content, "triggersubmit");
}

// Navigates to pending transaction details upon user confirmation
function view_pending_tx() {
    $(document).on("click", "#view_pending_tx", function() {
        const confirm_result = confirm(tl("viewpendingrequest"));
        if (confirm_result) {
            openpage("?p=requests", "requests", "loadpage");
            open_tx($("#" + $(this).attr("data-requestid")));
            canceldialog();
            cancel_paymentdialog();
        }
    });
}

// Updates browser history and local storage with current payment URL
function update_request_url(url) {
    history.replaceState(null, null, url);
    br_set_local("editurl", url);
}

// Displays pending transaction status with appropriate UI updates
function show_pending_status(payment_request) { // show pending dialog if tx is pending
    request.received = true;
    const req_data = payment_request.data(),
        request_id = req_data.requestid,
        layer2_network = req_data.eth_layer2;
    request.requestid = request_id;
    request.eth_layer2 = layer2_network;
    const status = req_data.status,
        tx_hash = req_data.txhash,
        list_tx_hash = payment_request.find(".transactionlist li:first").data("txhash"),
        primary_tx_hash = tx_hash || list_tx_hash,
        request_type = req_data.requesttype,
        payment_direction = request_type === "incoming" ? "sent" : "received",
        status_panel = glob_const.paymentdialogbox.find(".brstatuspanel"),
        tx_view = status_panel.find("#view_tx"),
        is_pending = req_data.pending,
        current_payment = req_data.payment,
        lightning_data = req_data.lightning;
    tx_view.attr("data-txhash", primary_tx_hash);
    if (payment_request.hasClass("expired")) {
        if (status === "new" || status === "insufficient") {
            update_payment_status("expired", "no", tl("txexpired"));
            glob_const.paymentdialogbox.find("span#view_tx").hide();
        }
        return
    }
    if (lightning_data) {
        const invoice = lightning_data.invoice;
        if (invoice) {
            if (invoice.status === "paid") {
                const tx_status = payment_direction === "sent" ? tl("paymentsent") : tl("paymentreceived");
                update_payment_status("paid", "no", tx_status);
                return
            }
            if (invoice.status === "pending") {
                update_payment_status("pending", "polling", tl("waitingforpayment"));
                return
            }
            return
        }
    }
    if (current_payment === "nano") { // 0 confirmation so payment must be sent
        if (status === "insufficient") {
            update_payment_status("insufficient", "scanning", tl("insufficientamount"));
            return
        }
        const tx_status = payment_direction === "sent" ? tl("paymentsent") : tl("paymentreceived");
        update_payment_status("paid", "no", tx_status);
        return
    }
    if (primary_tx_hash) {
        add_flip();
        if (is_pending === "scanning") {
            if (status === "insufficient") {
                update_payment_status("insufficient", "scanning", tl("insufficientamount"));
                return
            }
            update_payment_status("pending", "scanning", tl("pendingrequest"));
            return
        }
        update_payment_status("pending", "polling", tl("txbroadcasted"));
        const confirm_threshold = request.set_confirmations || req_data.set_confirmations || 0;
        request.set_confirmations = confirm_threshold,
            request.txhash = primary_tx_hash;
        start_transaction_monitor({
            "txhash": primary_tx_hash,
            "setconfirmations": confirm_threshold,
            layer2_network
        }, null, true);
    }
}

// Updates payment dialog UI elements based on transaction status
function update_payment_status(status, pending, status_text) {
    const sound_effect = status === "insufficient" ? "funk" : "blip",
        status_panel = glob_const.paymentdialogbox.find(".brstatuspanel");
    play_audio(sound_effect);
    add_flip();
    glob_const.paymentdialogbox.addClass("transacting").attr({
        "data-status": status,
        "data-pending": pending
    });
    status_panel.find("h2").text(status_text);
}

// ** Address Management: **

// Manages address switching functionality with socket handling
function switch_address() {
    $(document).on("click", "#paymentdialogbox.norequest #labelbttn", function() {
        const time_elapsed = now_utc() - glob_let.sa_timer;
        if (time_elapsed < 1500) { // prevent clicking too fast
            play_audio("funk");
            return
        }
        const url_params = get_urlparameters(),
            payment = url_params.payment;
        if (payment === "monero") {
            //disable address switching for Monero
            play_audio("funk");
            return
        }
        if (payment === "ethereum" && request.eth_l2s.length) {
            //disable address switching for ethereum layer 2's
            play_audio("funk");
            return
        }
        if (request.erc20) {
            //disable address switching for erc20 tokens
            play_audio("funk");
            return
        }
        if (q_obj(request, "coinsettings.Lightning network.selected")) {
            //disable address switching on lightning payments
            play_audio("funk");
            return
        }
        const current_address = url_params.address,
            next_address_item = new_addresli(payment, current_address);
        if (next_address_item) {
            glob_const.paymentdialogbox.addClass("switching");
            const new_address = next_address_item.data("address"),
                selected_socket = helper.selected_socket,
                data_param = url_params.d,
                has_data = data_param && data_param.length > 5,
                new_data_param = has_data ? "&d=" + data_param : "",
                cc_value = $("#paymentdialogbox .ccpool").attr("data-value"),
                new_address_id = next_address_item.data("cmcid"),
                new_address_label = next_address_item.data("label"),
                page = url_params.p,
                start_url = page ? "?p=" + page + "&payment=" : "?payment=",
                href = start_url + payment + "&uoa=" + url_params.uoa + "&amount=" + url_params.amount + "&address=" + new_address + new_data_param;
            generate_payment_qr(payment, new_address, cc_value);
            update_request_url(href);
            $("#paymentaddress").text(new_address);
            $(this).text(new_address_label);
            const is_pending = ch_pending({
                "address": new_address,
                "cmcid": new_address_id
            });
            glob_const.paymentdialogbox.attr("data-pending", is_pending && request.monitored ? "ispending" : "");
            request.address = new_address;
            glob_let.sa_timer = now_utc();
            force_close_socket().then(() => {
                init_socket(selected_socket, new_address);
            });
        }
    });
}

// Locates next valid address for currency payments
function new_addresli(currency, address) {
    const valid_addresses = filter_addressli(currency, "checked", true);
    if (valid_addresses) {
        const labeled_addresses = valid_addresses.filter(function() { // only pick addresses with label
            return $(this).data("label").length > 0;
        });
        if (labeled_addresses && labeled_addresses.length > 1) {
            const address_array = dom_to_array(labeled_addresses, "address");
            if (address_array) {
                const get_next_address = get_next(address_array, address),
                    next_address = get_next_address || address_array[0];
                if (next_address) {
                    return filter_addressli(currency, "address", next_address);
                }
            }
        }
    }
    return false
}

// Handles double-click events for copying address data
function copy_address_dblclick() {
    $(document).on("dblclick", "#paymentaddress, #paymentaddress_lnd, .select", function() {
        const current_node = $(this),
            address_type = current_node.attr("data-type") || tl("address");
        glob_const.copycontent.val(current_node.text()).data("type", address_type);
        notify("<span id='copyaddress'>" + tl("copy") + " " + address_type + "?</span>", 40000, "yes");
    });
}

// Processes address copy requests
function copy_address() {
    $(document).on("click", "#copyaddress", function() {
        const address_value = glob_const.copycontent.val(),
            address_type = glob_const.copycontent.data("type");
        copy_to_clipboard(address_value, address_type);
    });
}

// Manages double-click copying of payment amounts
function copy_inputs() {
    $(document).on("dblclick", "#paymentdialogbox.request .mirrordiv input", function() {
        const input_value = $(this).val(),
            value_type = tl("amount");
        glob_const.copycontent.val(input_value).data("type", value_type);
        notify("<span id='copyaddress'>" + tl("copy") + " " + value_type + "?</span>", 40000, "yes");
    });
}

// Processes address selection from pending request dialog
function pick_address_from_dialog() {
    $(document).on("click", "#addresslock #pending_pick_address", function(e) {
        e.preventDefault();
        const address_input = $("#selec_address"),
            address_input_value = address_input.val(),
            confirm_result = confirm(tl("useinstead", {
                "thisinputvalue": address_input_value
            }));
        if (confirm_result) {
            const url_params = get_urlparameters();
            if (url_params.xss) {
                return
            }
            const picked_value = address_input_value.split(" | "),
                picked_label = picked_value[0],
                picked_address = picked_value[1],
                page = url_params.p,
                payment = url_params.payment,
                currency = url_params.uoa,
                amount = url_params.amount,
                current_address = url_params.address;
            close_socket(current_address).then(() => {
                init_socket(helper.selected_socket, picked_address);
                const data_param = url_params.d,
                    has_data = data_param && data_param.length > 5,
                    new_data_param = has_data ? "&d=" + data_param : "",
                    start_url = page ? "?p=" + page + "&payment=" : "?payment=",
                    href = start_url + payment + "&uoa=" + currency + "&amount=" + amount + "&address=" + picked_address + new_data_param,
                    cc_value = $("#paymentdialogbox .ccpool").attr("data-value");
                $("#paymentaddress").text(picked_address);
                $("#labelbttn").text(picked_label);
                request.address = picked_address;
                generate_payment_qr(payment, picked_address, cc_value);
                update_request_url(href);
                glob_const.paymentdialogbox.attr("data-pending", "");
                canceldialog();
            });

        }
    });
}

// Initializes new address creation dialog with currency-specific fields
function add_address_from_dialog() {
    $(document).on("click", "#addresslock #pending_add_address, #addaddress", function(e) {
        e.preventDefault();
        const form_box = $(this).closest("#addresslock"),
            payment = request.payment,
            currency_id = request.cmcid,
            is_erc20 = request.erc20,
            derived_data = derive_data(payment, true),
            address_data = {
                "currency": payment,
                "ccsymbol": request.currencysymbol,
                "cmcid": currency_id,
                "checked": true,
                "erc20": is_erc20,
                "dd": derived_data
            },
            qr_scanner = glob_let.hascam ? "<div class='qrscanner' data-currency='" + payment + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
            viewkey_scanner = glob_let.hascam ? "<div class='qrscanner' data-currency='" + payment + "' data-id='viewkey' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
            viewkey_box = payment === "monero" ? "<div class='inputwrap'><input type='text' class='vk_input' value='' placeholder='View key'>" + viewkey_scanner + "</div>" : "",
            derivation_source = derived_data ? (derived_data.xpubid ? " from Xpub" : " from seed") : "",
            seed_message = derived_data ? "<div class='popnotify' style='display:block'><span id='addfromseed' class='address_option linkcolor'>Generate address" + derivation_source + "</span></div>" : "<div class='popnotify'></div>",
            content = $("<div class='formbox form add' id='addressformbox'><h2>" + getcc_icon(currency_id, request.cpid, is_erc20) + " " + tl("addcoinaddress", {
                "currency": payment
            }) + "</h2>" + seed_message + "<form id='addressform' class='popform'><div class='inputwrap'><input type='text' class='address' value='' placeholder='" + tl("nopub") + "'>" + qr_scanner + "</div>" + viewkey_box + "<input type='text' class='addresslabel' value='' placeholder='label'><div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + tl("pkownership") + "</span></div><input type='submit' class='submit' value='" + tl("okbttn") + "'></form></div>").data(address_data);
        form_box.parent("#dialogbody").html(content);
    });
}

// Generates new cryptocurrency address from stored seed data
function add_from_seed() {
    $(document).on("click", "#addfromseed", function() {
        const address_data = $("#addressformbox").data(),
            currency = address_data.currency,
            derived_data = address_data.dd;
        if (currency && derived_data && derived_data.address) {
            const confirm_result = confirm(tl("generatenewaddress", {
                "currency": currency
            }));
            if (confirm_result) {
                derive_add_address(currency, derived_data);
                canceldialog();
            }
        }
    });
}

// ** Sharing: **

// Processes share button clicks with Lightning Network validation
function share_button() {
    $(document).on("click", "#sharebutton", function() {
        if (glob_const.offline) {
            play_audio("funk");
            br_offline(true);
            return
        }
        const current_button = $(this);
        if (request.payment === "bitcoin" && helper.lnd_status) {
            const is_lightning_only = is_ln_only();
            validate_request_data(is_lightning_only);
            setTimeout(function() { // wait for url to change
                share(current_button);
            }, 100);
            return
        }
        if (!get_urlparameters().d) {
            validate_request_data();
            setTimeout(function() { // wait for url to change
                share(current_button);
            }, 100);
            return
        }
        share(current_button);
    });
}

// Determines if request is Lightning Network-only or hybrid
function is_ln_only() {
    return lightning_mode() ? $("#fallback_address").is(":visible") ? !$("#fallback_address .switchpanel").hasClass("true") : true : false;
}

// Determines if request is Lightning or onchain
function lightning_mode() {
    return glob_const.paymentdialogbox.attr("data-lswitch") === "lnd_ao";
}

// Processes and validates payment request sharing
function share(current_button) {
    if (current_button.hasClass("sbactive")) {
        const url_params = get_urlparameters();
        if (url_params.xss) {
            current_button.removeClass("sbactive")
            return
        }
        loader(true);
        const payment = url_params.payment,
            current_currency = url_params.uoa,
            current_amount = url_params.amount,
            current_address = url_params.address,
            data_param = url_params.d,
            currency_id = request.cmcid,
            currency_symbol = request.currencysymbol,
            has_data = data_param && data_param.length > 5,
            data_object = has_data ? JSON.parse(atob(data_param)) : null, // decode data param if exists
            request_name = has_data ? data_object.n : request.saved_name,
            request_title = has_data ? data_object.t : "",
            is_lightning = has_data ? !!data_object.imp : false,
            new_data_string = has_data ? "&d=" + data_param : "", // construct data param if exists
            is_ipfs = glob_const.thishostname.includes("ipfs") || glob_const.thishostname.includes("bitrequest.crypto"),
            shared_host = is_ipfs ? glob_const.c_host : "https://bitrequest.github.io", // check for IFPS
            url_id = shared_host + "/?payment=" + payment + "&uoa=" + current_currency + "&amount=" + current_amount + "&address=" + current_address,
            shared_url = url_id + new_data_string,
            request_name_uppercase = capitalize(request_name), // capitalize requestname
            payment_uppercase = capitalize(payment),
            payment_name = is_lightning ? "Lightning" : payment_uppercase,
            shared_title = has_data ? tl("sharetitlename", {
                "requestname": request_name_uppercase,
                "pagenameccparam": payment_name,
                "amount": current_amount,
                "uoa": current_currency.toUpperCase(),
                "requesttitle": request_title
            }) : tl("sharetitle", {
                "pagenameccparam": payment_name,
                "amount": current_amount,
                "uoa": current_currency
            }),
            share_icon = is_lightning ? glob_const.approot + "img_logos_btc-lnd.png" : glob_const.cmc_icon_loc + currency_id + ".png";
        if (is_ipfs) {
            share_request(shared_url, shared_title);
            set_locales();
            return
        }
        const url_hash = sha_sub(url_id + shared_title, 10);
        shorten_url(shared_title, shared_url, share_icon, null, url_hash);
        set_locales();
        return
    }
    const request_name_input = $("#requestname"),
        request_title_input = $("#requesttitle"),
        name_length = request_name_input.val().length,
        title_length = request_title_input.val().length,
        name_check_message = name_length < 1 ? tl("enteryourname") : name_length < 3 ? tl("minimal3") : tl("checkyourform"),
        title_check_message = title_length < 1 ? tl("entertitle") : title_length < 2 ? tl("minimal2") : tl("checkyourform"),
        check_message = name_length < 3 ? name_check_message : title_length < 2 ? title_check_message : tl("requiredfields");
    topnotify(check_message);
    if (name_length < 3) {
        request_name_input.focus();
    } else if (title_length < 2) {
        request_title_input.focus();
    }
}

// Manages URL shortening with multiple service fallbacks
function shorten_url(shared_title, shared_url, site_thumb, unguessable, url_hash) {
    set_loader_text(tl("generatelink"));
    const url_shorten_settings = $("#url_shorten_settings"),
        is_url_shorten_active = url_shorten_settings.data("us_active") === "active";
    if (is_url_shorten_active) {
        const url_service = url_shorten_settings.data("selected"),
            is_custom_service = url_service.indexOf("https://") >= 0;
        if (url_hash) {
            const cache_prefix = is_custom_service ? "custom" : url_service,
                cached_short_url = br_get_session(cache_prefix + "_shorturl_" + url_hash);
            if (cached_short_url) {
                share_request(cached_short_url, shared_title);
                return
            }
        }
        if (url_service === "bitly") {
            bitly_shorten(shared_url, shared_title, url_hash);
            return
        }
        if (is_custom_service) {
            custom_shorten(url_service, shared_url, shared_title, site_thumb, url_hash);
            return
        }
    }
    share_request(shared_url, shared_title);
}

// Processes Bitly API URL shortening
function bitly_shorten(shared_url, shared_title, url_hash) {
    api_proxy({
        "api": "bitly",
        "search": "bitlinks",
        "cachetime": 84600,
        "cachefolder": "1d",
        "bearer": true,
        "params": {
            "method": "POST",
            "contentType": "application/json",
            "data": {
                "long_url": shared_url
            }
        }
    }).done(function(response) {
        const data = br_result(response).result;
        if (data.id) {
            const link_id = data.id.split("/").pop(),
                short_url = glob_const.approot + "?i=4bR" + link_id;
            share_request(short_url, shared_title);
            if (url_hash) {
                br_set_session("bitly_shorturl_" + url_hash, short_url);
            }
            return
        }
        share_request(shared_url, shared_title);
    }).fail(function() {
        share_request(shared_url, shared_title);
    });
}

// Manages custom proxy server URL shortening
function custom_shorten(service, shared_url, shared_title, site_thumb, url_hash) {
    const server = service || d_proxy(),
        request_data = btoa(JSON.stringify({
            "sharedurl": shared_url,
            "sitethumb": site_thumb
        })),
        short_url_id = random_id(),
        payload = {
            "function": "post",
            "longurl": request_data,
            "shorturl": short_url_id
        };
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": server + "/proxy/v1/inv/api/",
        "data": payload
    }).done(function(response) {
        const data = br_result(response).result;
        if (data) {
            if (data.error) {
                notify(server + ": " + data.error, 500000, "yes");
                bitly_shorten(shared_url, shared_title, url_hash);
                return
            }
            const request_id = data.shorturl;
            if (request_id) {
                const server_index = find_object_index(glob_const.proxy_list, "proxy", server),
                    is_default_server = objectkey_in_array(glob_const.proxy_list, "proxy", server),
                    short_url = is_default_server ?
                    glob_const.approot + "?i=" + server_index.toString() + request_id :
                    server + "/proxy/v1/inv/4bR" + request_id;
                share_request(short_url, shared_title);
                if (url_hash) {
                    br_set_session("custom_shorturl_" + url_hash, short_url);
                }
                return
            }
        }
        bitly_shorten(shared_url, shared_title, url_hash);
    }).fail(function() {
        bitly_shorten(shared_url, shared_title, url_hash);
    });
}

// Get short url from local storage
function get_saved_shorturl(hash) {
    try {
        const url_service = $("#url_shorten_settings").data("selected"),
            is_custom_service = url_service.indexOf("https://") >= 0,
            cache_prefix = is_custom_service ? "custom" : url_service;
        return br_get_session(cache_prefix + "_shorturl_" + hash);
    } catch (e) {
        return false
    }
}

// Generates cryptographically secure random ID for URL shortening
function random_id() {
    const random_value = crypto.getRandomValues(new Uint32Array(1))[0];
    return random_value.toString(16);
}

// Initiates request sharing with platform-specific handlers
function share_request(shared_url, shared_title) {
    closeloader();
    if (shared_title === "qr") {
        toggle_ti_qr(shared_url);
        return
    }
    if (glob_const.is_ios_app) {
        share_fallback(shared_url, shared_title);
        return
    }
    if (glob_const.supportsTouch && navigator.canShare) {
        navigator.share({
            "title": shared_title + " | " + glob_const.apptitle,
            "text": shared_title + ": \n",
            "url": shared_url
        }).then(share_callback).catch(function(error) {
            console.error("Sharing failed:", error);
        });
        return
    }
    share_fallback(shared_url, shared_title);
}

// Provides alternative sharing UI when native sharing is unavailable
function share_fallback(shared_url, shared_title) {
    const mobile_class = glob_const.supportsTouch ? " showtouch" : "";
    $("#sharepopup").addClass("showpu active" + mobile_class).data({
        "sharetitle": shared_title,
        "shareurl": shared_url
    });
    glob_const.body.addClass("sharemode");
}

// Handles WhatsApp sharing integration
function whatsapp_share() {
    $(document).on("click", "#whatsappshare", function() {
        share_callback();
        const share_info = get_share_info(),
            encoded_share_text = encodeURIComponent(share_info.body),
            share_url = "whatsapp://send?text=" + encoded_share_text;
        open_share_url("location", share_url);
    });
}

// Handles email sharing via default mail client
function mailto() {
    $(document).on("click", "#mailto", function() {
        share_callback();
        const share_info = get_share_info(),
            share_url = "mailto:?subject=" + encodeURIComponent(share_info.title) + "&body=" + encodeURIComponent(share_info.body);
        open_share_url("location", share_url);
    });
}

// Manages URL copying to clipboard
function copy_url() {
    $(document).on("click", "#copyurl", function() {
        copy_to_clipboard(get_share_info().url, "Request url");
        share_callback();
    });
}

// Handles Gmail sharing integration
function gmail_share() {
    $(document).on("click", "#gmailshare", function() {
        share_callback();
        const share_info = get_share_info(),
            share_url = "https://mail.google.com/mail/?view=cm&fs=1&su=" + encodeURIComponent(share_info.title) + "&body=" + encodeURIComponent(share_info.body);
        open_share_url("open", share_url);
    });
}

// Handles Telegram sharing integration
function telegram_share() {
    $(document).on("click", "#telegramshare", function() {
        share_callback();
        const share_info = get_share_info(),
            share_url = "https://telegram.me/share/url?url=" + share_info.url + "&text=" + encodeURIComponent(share_info.body);
        open_share_url("open", share_url);
    });
}

// Handles Outlook sharing integration
function outlook_share() {
    $(document).on("click", "#outlookshare", function() {
        share_callback();
        const share_info = get_share_info(),
            share_url = "ms-outlook://compose?subject=" + encodeURIComponent(share_info.title) + "&body=" + encodeURIComponent(share_info.body);
        open_share_url("location", share_url);
    });
}

// Retrieves formatted sharing metadata from UI
function get_share_info() {
    const share_popup = $("#sharepopup"),
        share_title = share_popup.data("sharetitle"),
        share_url = share_popup.data("shareurl");
    return {
        "title": share_title,
        "url": share_url,
        "body": share_title + ": \n " + share_url
    }
}

// Processes post-sharing actions and UI updates
function share_callback() {
    if (request) {
        request.received = true,
            request.requesttype = "outgoing",
            request.status = "new",
            request.pending = (request.monitored === false) ? "unknown" : "scanning";
        save_payment_request();
        loadpage("?p=requests");
        cancel_paymentdialog();
    } else {
        canceldialog();
    }
    cancel_sharedialog();
    notify(tl("successshare") + " 🎉");
}

// Handles share URL opening with timing controls
function open_share_url(type, url) {
    loader(true);
    setTimeout(function() {
        closeloader();
        if (type === "open") {
            window.open(url);
            return
        }
        if (type === "location") {
            glob_const.w_loc.href = url;
        }
    }, 500);
}

// ** Transaction Viewing: **

// Opens transaction details based on URL hash parameter
function trigger_open_tx() {
    const url_params = get_urlparameters();
    if (url_params.xss) {
        return
    }
    const transaction_hash = url_params.txhash;
    if (transaction_hash) {
        const transaction_node = get_requestli("txhash", transaction_hash);
        open_tx(transaction_node);
    }
}

// Handles transaction view event and navigation
function view_tx() {
    $(document).on("click", "#view_tx", function() {
        if (glob_const.inframe) {
            glob_const.html.removeClass("hide_app");
            return
        }
        openpage("?p=requests", "requests", "loadpage");
        const transaction_hash = $(this).attr("data-txhash"),
            transaction_node = get_requestli("txhash", transaction_hash);
        open_tx(transaction_node);
    });
}

// Expands transaction details with animation and scrolling
function open_tx(transaction_node) {
    if (!transaction_node.length) {
        play_audio("funk");
        return
    }
    const info_panel = transaction_node.find(".moreinfo"),
        meta_list = info_panel.find(".metalist");
    $(".moreinfo").not(info_panel).slideUp(500);
    $(".metalist").not(meta_list).slideUp(500);
    $(".historic_meta").slideUp(200);
    info_panel.add(meta_list).slideDown(500);
    transaction_node.addClass("visible_request");
    const confirmation_bar = transaction_node.find(".transactionlist .confbar");
    if (confirmation_bar.length > 0) {
        confirmation_bar.each(function(index) {
            animate_confbar($(this), index);
        });
    }
    setTimeout(function() { // wait for url to change
        $("html, body").animate({
            "scrollTop": transaction_node.offset().top - $("#fixednav").height()
        }, 500);
    }, 1000);
}

// Navigates to Monero settings page after user confirmation
function xmr_settings() {
    $(document).on("click", "#xmrsettings", function() {
        let confirm_result = confirm(tl("opencoinsettings", {
            "currency": "Monero"
        }));
        if (confirm_result) {
            let page_title = "monero_settings";
            openpage("?p=" + page_title, page_title, "loadpage");
            cancel_paymentdialog();
        }
    });
}

// ** Wallet Operations: **

// Initializes wallet opening dialog based on currency type
function open_wallet() {
    $(document).on("click", ".openwallet, .openwallet_lnd", function() {
        const clicked_node = $(this),
            currency = clicked_node.attr("data-currency"),
            wallet_url = clicked_node.attr("title"),
            is_lightning_url = wallet_url && wallet_url.slice(0, 9) === "lightning",
            wallet_ref = is_lightning_url ? "lightning" : currency,
            dialog_content = "<div class='formbox' id='backupformbox'><h2 class='icon-folder-open'>" + tl("havewallet", {
                "lnd_ref": wallet_ref
            }) + "</h2><div class='popnotify'></div><div id='backupactions'><a href='" + wallet_url + "' class='customtrigger' id='openwalleturl'>" + tl("yes") + "</a><div id='dw_trigger' class='customtrigger' data-currency='" + wallet_ref + "'>" + tl("no") + "</div></div>";
        popdialog(dialog_content, "triggersubmit");
    });
}

// Processes wallet URL opening event
function open_wallet_url() {
    $(document).on("click", "#openwalleturl", function() {
        canceldialog();
    });
}

// Initiates wallet download workflow
function dw_trigger() {
    $(document).on("click", "#dw_trigger", function() {
        const target_currency = $(this).attr("data-currency");
        canceldialog();
        setTimeout(function() {
            download_wallet(target_currency);
        }, 800);
    })
}

// Renders wallet download options based on device and platform
function download_wallet(currency) {
    const is_lightning = currency === "lightning",
        base_currency = is_lightning ? "bitcoin" : currency,
        coin_details = get_coin_metadata(base_currency),
        wallet_options = is_lightning ? coin_details.lightning_wallets : coin_details.wallets,
        download_page = wallet_options.wallet_download_page,
        wallet_list = wallet_options.wallets;
    if (download_page || wallet_list) {
        const wallet_ul = wallet_list ? "<ul id='formbox_ul'></ul>" : "",
            more_wallets_link = download_page ? "<a href='" + download_page + "' target='_blank' class='exit formbox_href linkcolor'>" + tl("findmorewallets") + "</a>" : "",
            content = "\
            <div class='formbox' id='wdl_formbox'>\
                <h2 class='icon-download'>" + tl("downloadwallet", {
                "currency": currency
            }) + "</h2>\
                <div class='popnotify'></div>\
                <div id='dialogcontent'>" + wallet_ul + more_wallets_link + "</div>\
                <div id='backupactions'>\
                    <div class='cancel_dialog customtrigger'>" + cancelbttn + "</div>\
                </div>\
            </div>";
        popdialog(content, "canceldialog");
        if (wallet_list) {
            const wallet_container = $("#formbox_ul"),
                device_type = detect_device_type(),
                platform = get_platform(device_type),
                store_icon = platform_icon(platform),
                store_tag = store_icon ? "<img src='" + store_icon + "'/>" : "<span class='icon-download'></span> ";
            $.each(wallet_list, function(key, wallet_info) {
                const platform_url = wallet_info[platform];
                if (platform_url) {
                    const wallet_name = wallet_info.name,
                        wallet_website = wallet_info.website,
                        wallet_icon = is_lightning ? "<img src='img_logos_btc-lnd.png' class='wallet_icon'/>" : get_aws_icon_url(wallet_name),
                        wallet_item = "<li><a href='" + wallet_website + "' target='_blank' class='exit app_dll'>" + wallet_icon + wallet_name + "</a><a href='" + platform_url + "' target='_blank' class='exit store_tag'>" + store_tag + "</a></li>";
                    wallet_container.append(wallet_item);
                }
            });
        }
    }
}

// ** Request Updates: **

// Processes and stores payment request data with multi-currency and Lightning Network support
function save_payment_request(direct, lightning_url) {
    const url_params = get_urlparameters();
    if (url_params.xss) {
        return
    }
    const current_payment = url_params.payment,
        current_currency = url_params.uoa,
        current_amount = url_params.amount,
        currency_symbol = request.currencysymbol,
        current_request_type = request.requesttype,
        payment_timestamp = request.paymenttimestamp,
        set_confirmations = request.set_confirmations,
        is_lightning_mode = lightning_mode(),
        lightning_info = is_lightning_mode ? helper.lnd : false,
        lightning_id = lightning_info ? lightning_info.pid : "",
        confirmation_string = lightning_info ? "1" : (set_confirmations ? set_confirmations.toString() : "0"),
        amount_string = current_amount ? current_amount.toString() : "0",
        current_address = lightning_url ? "lnurl" : url_params.address,
        current_data = url_params.d,
        current_meta = url_params.m,
        current_timestamp = now_utc(), // UTC
        request_data_hash = current_data && current_data.length > 5 ? current_data : null, // check if data param exists
        request_meta_hash = current_meta && current_meta.length > 5 ? current_meta : null, // check if meta param exists
        data_object = request_data_hash ? JSON.parse(atob(request_data_hash)) : null, // decode data param if exists
        request_name = request.requestname,
        request_timestamp = payment_timestamp || (data_object && data_object.ts) || (current_request_type === "incoming" ? null : current_timestamp), // null is unknown timestamp
        unhashed_request_data = current_payment + current_currency + amount_string + current_address + request_name + request.requesttitle + confirmation_string + lightning_id,
        saved_transaction_hash = request.txhash,
        is_local = current_request_type === "local",
        request_id = is_local && saved_transaction_hash ? sha_sub(saved_transaction_hash, 10) : sha_sub(unhashed_request_data, 10),
        request_cache = br_get_local("requests", true),
        request_id_param = url_params.requestid,
        is_checkout = direct !== "init" && current_request_type === "checkout",
        is_crypto_currency = current_currency === currency_symbol,
        is_lightning = data_object && data_object.imp,
        ethereum_layer2 = request.eth_layer2,
        ethereum_l2s = request.eth_l2s;
    let request_in_cache,
        is_lightning_only = false,
        lightning_invoice = false,
        lightning_object = false;
    if (lightning_info) {
        if (current_address === "lnurl") {
            is_lightning_only = true;
        }
        lightning_invoice = lightning_info.invoice,
            lightning_object = current_request_type === "outgoing" && !is_lightning ? false : {
                "imp": lightning_info.imp,
                "host": lightning_info.host,
                "key": lightning_info.key,
                "pid": lightning_info.pid,
                "nid": lightning_info.nid,
                "pw": lightning_info.pw,
                "invoice": lightning_invoice,
                "proxy_host": lightning_info.proxy_host,
                "hybrid": !is_lightning_only
            };
    }
    if (request_cache) {
        request_in_cache = $.grep(request_cache, function(filter) { //filter pending requests
            return filter.requestid === request_id;
        });
    }
    if ((request_in_cache && request_in_cache.length) || request_id_param) { // do not save if request already exists
        const smart_id = request_id_param || request_id,
            request_list_item = $("#" + smart_id),
            request_item_data = request_list_item.data(),
            pending_state = request_item_data.pending;
        if (saved_transaction_hash) { // check if request is opened or updated
            request.received = true;
            if (pending_state !== "paid") {
                const update_data = {
                    "requestid": smart_id,
                    "status": request.status,
                    "receivedamount": request.receivedamount,
                    "fiatvalue": request.fiatvalue,
                    "txhash": saved_transaction_hash,
                    "confirmations": request.confirmations,
                    "pending": request.pending,
                    "lightning": lightning_object,
                    ethereum_layer2,
                    ethereum_l2s
                };
                br_remove_session("historic_" + smart_id); // remove historic price cache
                update_request(update_data, true);
            }
        } else {
            const request_status = request_item_data.status;
            if (pending_state === "scanning" || request_status === "canceled") { // do nothing
                return false
            } else {
                if (pending_state === "polling" || request_list_item.hasClass("expired")) {
                    show_pending_status(request_list_item);
                    if (lightning_object) {
                        return false
                    }
                    return "nosocket";
                }
                if (pending_state === "no") {
                    request.received = true;
                    const transaction_hash_state = request_item_data.txhash,
                        type_state = request_item_data.requesttype,
                        send_receive = type_state === "incoming" ? "sent" : "received",
                        transaction_status = send_receive === "sent" ? tl("paymentsent") : tl("paymentreceived");
                    update_payment_status("paid", "no", transaction_status);
                    glob_const.paymentdialogbox.find("span#view_tx").attr("data-txhash", transaction_hash_state);
                    return "nosocket";
                }
            }
        }
    } else {
        //overwrite global request object
        request.address = current_address,
            request.requestid = request_id,
            request.iscrypto = is_crypto_currency,
            request.fiatcurrency = is_crypto_currency ? request.localcurrency : current_currency,
            request.currencyname = $("#xratestats .cpool[data-currency='" + current_currency + "']").attr("data-currencyname"),
            request.cc_amount = parseFloat($("#open_wallet").attr("data-rel"));
        const number_amount = Number(current_amount),
            is_zero_amount = number_amount === 0 || isNaN(number_amount);
        if (direct === "init" && request.shared === false) { // when first opened only save shared requests
            // Do nothing
        } else if (is_zero_amount === true) { // don't save requests with zero value
            // Do nothing
        } else {
            const coin_settings = request.coinsettings,
                append_object = $.extend(request, {
                    "archive": false,
                    "showarchive": false,
                    "timestamp": current_timestamp,
                    "requestdate": request_timestamp,
                    "rqdata": request_data_hash,
                    "rqmeta": request_meta_hash,
                    "lightning": lightning_object
                });
            delete append_object.coinsettings; // don't save coinsettings in request

            // update username
            const default_name = glob_const.apptitle;
            if (request_name) {
                if (request_name !== default_name && (current_request_type === "local" || current_request_type === "outgoing")) {
                    const saved_name = request.saved_name;
                    if (saved_name === default_name) {
                        set_setting("accountsettings", {
                            "selected": request_name
                        }, request_name);
                        save_settings();
                    }
                }
            }
            append_request(append_object);
            setTimeout(function() {
                save_requests();
            }, 500);
            if (!request_id_param && direct === true) { // Add request_params (make it a request)
                const request_params = "&requestid=" + request_id + "&status=" + request.status + "&type=" + current_request_type;
                history.replaceState(null, null, glob_const.w_loc.href + request_params);
            }
            if (coin_settings) {
                const reuse = coin_settings["Reuse address"];
                if (reuse) {
                    if (reuse.selected === false) {
                        // Derive new address
                        if (!is_lightning_only) {
                            const address_list_item = filter_addressli(current_payment, "address", current_address);
                            address_list_item.addClass("used").data("used", true);
                            save_addresses(current_payment, false);
                            derive_new_address(current_payment);
                        }
                    }
                }
            }
        }
    }
    // post to parent
    if (is_checkout) {
        const contact_param = url_params.contactform,
            meta_data_object = request_meta_hash ? JSON.parse(atob(request_meta_hash)) : null, // decode meta param if exists
            fiat_value_rounded = trimdecimals(request.fiatvalue, 2),
            received_in_currency = is_crypto_currency ? request.receivedamount : fiat_value_rounded,
            paymentimestamp = payment_timestamp || current_timestamp,
            transaction_data = {
                "currencyname": request.currencyname,
                "requestid": request_id,
                "cmcid": request.cmcid,
                "payment": current_payment,
                "ccsymbol": currency_symbol,
                "iscrypto": is_crypto_currency,
                "amount": current_amount,
                "receivedamount": received_in_currency,
                "receivedcc": request.receivedamount,
                "fiatvalue": fiat_value_rounded,
                "status": request.status,
                "txhash": saved_transaction_hash,
                "receiver": current_address,
                "confirmations": request.confirmations,
                set_confirmations,
                "transactiontime": paymentimestamp,
                "pending": request.pending,
                "lightning": lightning_object,
                "erc20": request.erc20,
                ethereum_layer2,
                ethereum_l2s
            };
        let contact_data;
        if (contact_param) {
            const contact_form_data = $("#contactform").data(),
                contact_form_address = contact_form_data.address;
            if (contact_form_address) {
                contact_data = {
                    "name": contact_form_data.name,
                    "address": contact_form_address,
                    "zipcode": contact_form_data.zipcode,
                    "city": contact_form_data.city,
                    "country": contact_form_data.country,
                    "email": contact_form_data.email
                }
            }
        }
        const post_data = {
            "txdata": transaction_data,
            "data": data_object,
            "meta": meta_data_object,
            "contact": contact_data
        };
        parent.postMessage({
            "id": "result",
            "data": post_data
        }, "*");
    }
    if (current_request_type !== "incoming") {
        helper.currencylistitem.removeData("url"); // remove saved url / reset lightning id
        br_remove_local("editurl");
        br_remove_session("lndpid");
    }
}

// Updates request UI elements and metadata with transaction status
function update_request(update_args, should_save) {
    const request_element = $("#" + update_args.requestid);
    if (request_element.length) {
        const request_data = request_element.data(),
            meta_list = request_element.find(".metalist");
        if (update_args.receivedamount) {
            meta_list.find(".receivedamount span").text(" " + trimdecimals(update_args.receivedamount, 6));
        }
        if (update_args.fiatvalue) {
            meta_list.find(".payday.pd_fiat .fiatvalue").text(" " + trimdecimals(update_args.fiatvalue, 2));
        }
        if (update_args.paymenttimestamp) {
            const formatted_date = fulldateformat(new Date(update_args.paymenttimestamp), langcode, true);
            meta_list.find(".payday.pd_paydate span.paydate").html(" " + formatted_date);
            meta_list.find(".payday.pd_fiat strong span.pd_fiat").html(" " + formatted_date);
        }
        if (update_args.confirmations !== undefined) {
            const meta_status = meta_list.find("li.meta_status"),
                set_confirmations = request_data.set_confirmations || 1,
                conf_text = (update_args.confirmations == 0) ? tl("unconfirmedtx") : update_args.confirmations + " / " + set_confirmations + " " + tl("confirmations");
            meta_status.attr("data-conf", update_args.confirmations).find(".txli_conf > span").text(tl(conf_text));
            const conf_bar = meta_status.find(".txli_conf > .confbar");
            if (conf_bar.length) {
                conf_bar.each(function(i) {
                    animate_confbar($(this), 0);
                });
            }
        }
        if (update_args.pending) {
            request_element.attr("data-pending", update_args.pending)
        }
        const current_status = update_args.status;
        if (current_status) {
            if (current_status !== "archive_pending") { // don't update if status is archive_pending
                request_element.attr("data-status", current_status);
                meta_list.find(".status").text(" " + tl(current_status));
            }
            if (current_status === "paid" || current_status === "archive_pending") {
                if (current_status === "paid") {
                    if (glob_const.inframe === false) {
                        play_audio("blip");
                    }
                    request_element.addClass("shownotification");
                }
                const transaction_list = request_element.find(".transactionlist"),
                    valid_transactions = transaction_list.find("li");
                if (valid_transactions.length > 0) {
                    const transaction_data = [];
                    valid_transactions.each(function() {
                        transaction_data.push($(this).data());
                    });
                    update_args.txhistory = transaction_data;
                }
                setTimeout(function() {
                    request_element.removeClass("shownotification");
                }, 3000);
            }
            // adjust insufficient amount
            const amount_short_span = meta_list.find(".amountshort");
            if (current_status === "insufficient") {
                const request_amount = request_data.amount,
                    is_crypto = request_data.iscrypto,
                    unit_of_account = request_data.uoa,
                    amount_short_rounded = amountshort(request_amount, update_args.receivedamount, update_args.fiatvalue, is_crypto),
                    amount_short_text = " (" + amount_short_rounded + " " + unit_of_account.toUpperCase() + " " + tl("amountshort") + ")";
                amount_short_span.text(amount_short_text).addClass("show_as");
            } else {
                amount_short_span.removeClass("show_as");
            }
        }
        if (update_args.requesttitle) {
            const request_title = update_args.requesttitle;
            if (request_title === "empty") {
                return
            }
            const title_input = (request_data.requesttitle) ? request_element.find(".atext h2") :
                request_element.find(".rq_subject");
            title_input.add(meta_list.find(".requesttitlebox")).text(request_title);
        }
        request_element.data(update_args);
        if (should_save === true) {
            setTimeout(function() {
                save_requests();
            }, 1000);
        }
        return
    }
    console.error("error", "Request not found");
}

// Retrieves Monero payment ID based on integration settings
function get_xmrpid() {
    const use_integrated = cs_node("monero", "Integrated addresses", true).selected;
    return use_integrated ? xmr_pid() : false;
}

// Generates integrated Monero address with payment ID validation
function xmr_integrated(xmr_address, payment_id) {
    const is_valid = check_pid(payment_id);
    if (is_valid) {
        const parsed_base_58 = cn_base_58.decode(xmr_address),
            public_spend_key = parsed_base_58.slice(2, 66),
            public_view_key = parsed_base_58.slice(66, 130),
            integrated_bytes = "13" + public_spend_key + public_view_key + payment_id,
            checksum = integrated_bytes + fasthash(integrated_bytes).slice(0, 8);
        return base58_encode(hex_to_bytes(checksum));
    }
    return xmr_address;
}