$(document).ready(function() {

    // ** Core Setup & Initialization: **
    setup_confirmation_editor();
    save_confirmation_settings();
    toggle_address_reuse();
    toggle_currency_setting();
    setup_explorer_selection();
    save_explorer_settings();

    // ** RPC & Websocket Management: **
    // assets_js_bitrequest_rpcs.js

    // ** Key & Xpub Management: **
    key_management();
    segwit_switch();
    //bip39_sc
    //display_xpub_details
    edit_xpub_trigger();
    //edit_xpub
    handle_xpub_input();
    validate_xpub_input();
    //validate_xpub
    //xpub_fail
    //reset_xpub_form
    //clear_xpub_checkboxes
    //check_xpub
    //generate_derived_addresses
    xpub_cc_switch();
    delete_xpub();
    //delete_xpub_cb
    //add_xpub_cb

    // ** API Key Management: **
    trigger_apikey();
    //add_apikey
    save_api_key();

    // ** Soundbyte Management: **
    setup_soundbyte_selection();
    select_soundbyte();
    save_soundbyte_settings();

    // ** Settings Reset: **
    reset_coinsettings_trigger();
    //reset_coinsettings
    //restore_default_settings
});

// ** Core Setup & Initialization: **

// Handles UI interactions for editing cryptocurrency confirmation settings using emoji-based visual indicators
function setup_confirmation_editor() {
    $(document).on("click", ".cc_settinglist li[data-id='confirmations'] .edit_trigger", function() {
        const edit_btn = $(this),
            currency = edit_btn.attr("data-currency"),
            settings_item = edit_btn.closest("li"),
            current_conf = settings_item.data("selected"),
            confirmation_levels = [{
                    conf: 0,
                    emoji: "☕"
                },
                {
                    conf: 1,
                    emoji: "🍷 🍽"
                },
                {
                    conf: 2,
                    emoji: "📱"
                },
                {
                    conf: 3,
                    emoji: "🖥"
                },
                {
                    conf: 4,
                    emoji: "🚗"
                },
                {
                    conf: 5,
                    emoji: "🏠"
                },
                {
                    conf: 6,
                    emoji: "🛥 💎"
                }
            ],
            conf_list_html = confirmation_levels.map(function(level) {
                return "<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>" + level.conf + "</span><div class='conf_emoji'>" + level.emoji + "</div></div></li>";
            }).join(""),
            dialog_data = [{
                "ul": {
                    "class": "conf_options noselect",
                    "content": conf_list_html
                },
                "div": {
                    "class": "popform",
                    "content": [{
                            "input": {
                                "attr": {
                                    "type": "hidden",
                                    "value": current_conf
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn"),
                                    "data-currency": currency
                                }
                            }
                        }
                    ]
                }
            }],
            dialog_html = template_dialog({
                "id": "conf_formbox",
                "icon": "icon-clock",
                "title": tl("confirmations"),
                "elements": dialog_data
            });
        popdialog(dialog_html, "triggersubmit");
        const selected_item = $("#conf_formbox ul.conf_options li").filter(function() {
            return $(this).find("span").text() == current_conf;
        });
        selected_item.find(".radio").removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
    })
}

// Processes form submission for cryptocurrency confirmation count changes with validation
function save_confirmation_settings() {
    $(document).on("click", "#conf_formbox input.submit", function(e) {
        e.preventDefault();
        const submit_btn = $(this),
            currency = submit_btn.attr("data-currency"),
            conf_value = submit_btn.prev("input").val();
        if (inj(conf_value)) return
        const settings_node = cs_node(currency, "confirmations");
        if (settings_node) {
            settings_node.data("selected", parseInt(conf_value, 10)).find("p").text(conf_value);
            canceldialog();
            notify(tl("datasaved"));
            save_cc_settings(currency, true);
        }
    })
}

// Manages toggling of address reuse settings with user warnings for different cryptocurrencies
function toggle_address_reuse() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Reuse address'] .switchpanel.custom", function() {
        const toggle_btn = $(this),
            settings_item = toggle_btn.closest("li"),
            parent_wrap = toggle_btn.closest(".liwrap"),
            currency = parent_wrap.attr("data-currency"),
            warn_msg = settings_item.data("warning");
        if (toggle_btn.hasClass("true")) {
            let can_disable = true;
            if (warn_msg) {
                can_disable = confirm(tl("reusewarningalert", {
                    "thiscurrency": currency
                }));
            }
            if (can_disable) {
                settings_item.data("selected", false);
                toggle_btn.removeClass("true").addClass("false");
                save_cc_settings(currency, false);
            }
            return
        }
        const user_confirmed = confirm(tl("reusealert", {
            "thiscurrency": currency
        }));
        if (user_confirmed) {
            settings_item.data("selected", true);
            toggle_btn.removeClass("false").addClass("true");
            save_cc_settings(currency, true);
        }
    })
}

// Controls generic boolean switch toggles for cryptocurrency settings with automatic state persistence
function toggle_currency_setting() {
    $(document).on("mouseup", ".cc_settinglist li .switchpanel.bool", function() {
        const toggle_btn = $(this),
            settings_item = toggle_btn.closest("li"),
            parent_wrap = toggle_btn.closest(".liwrap"),
            currency = parent_wrap.attr("data-currency"),
            current_state = toggle_btn.hasClass("true");
        settings_item.data("selected", current_state);
        save_cc_settings(currency, false);
    })
}

// Manages block explorer selection UI with dynamic option population from available explorer list
function setup_explorer_selection() {
    $(document).on("click", ".cc_settinglist li[data-id='blockexplorers']", function() {
        const settings_item = $(this),
            item_data = settings_item.data(),
            explorer_list = item_data.options;
        if (explorer_list) {
            const currency = settings_item.children(".liwrap").attr("data-currency"),
                selected_explorer = item_data.selected,
                dialog_title = tl("chooseblockexplorer"),
                explorer_options = explorer_list.map(function(explorer) {
                    return "<span data-pe='none'>" + explorer + "</span>";
                }).join(""),
                dialog_data = [{
                    "div": {
                        "class": "popform",
                        "content": [{
                            "div": {
                                "class": "selectbox",
                                "content": [{
                                        "input": {
                                            "attr": {
                                                "type": "text",
                                                "value": selected_explorer,
                                                "placeholder": dialog_title,
                                                "readonly": "readonly"
                                            },
                                            "close": true
                                        },
                                        "div": {
                                            "class": "selectarrows icon-menu2",
                                            "attr": {
                                                "data-pe": "none"
                                            }
                                        }
                                    },
                                    {
                                        "div": {
                                            "class": "options",
                                            "content": explorer_options
                                        }
                                    }
                                ]
                            },
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn"),
                                    "data-currency": currency
                                }
                            }
                        }]
                    }
                }],
                dialog_html = template_dialog({
                    "id": "be_formbox",
                    "icon": "icon-eye",
                    "title": dialog_title,
                    "elements": dialog_data
                });
            popdialog(dialog_html, "triggersubmit");
        }
    })
}

// Processes block explorer selection changes and updates UI state with validation
function save_explorer_settings() {
    $(document).on("click", "#be_formbox input.submit", function(e) {
        e.preventDefault();
        const currency = $(this).attr("data-currency"),
            selected_explorer = $("#be_formbox").find("input:first").val();
        if (inj(selected_explorer)) return
        const settings_node = cs_node(currency, "blockexplorers");
        if (settings_node) {
            settings_node.data("selected", selected_explorer).find("p").text(selected_explorer);
            canceldialog();
            notify(tl("datasaved"));
            save_cc_settings(currency, true);
        }
    })
}

// ** RPC & Websocket Management: **
// assets_js_bitrequest_rpcs.js

// ** Key & Xpub Management: **

// Controls UI for key derivation settings and management
function key_management() {
    $(document).on("click", ".cc_settinglist li[data-id='Key derivations'] .atext", function() {
        const menu_item = $(this),
            settings_item = menu_item.closest("li"),
            item_data = settings_item.data(),
            item_wrap = settings_item.find(".liwrap"),
            currency = item_wrap.attr("data-currency"),
            active_xpub_key = active_xpub(currency);
        if (active_xpub_key) {
            display_xpub_details(currency, active_xpub_key.key);
            return
        }
        if (glob_let.hasbip === true) {
            if (currency === "monero" && is_viewonly() === false) {
                all_pinpanel({
                    "func": phrase_info_pu,
                    "args": currency
                }, true, true);
                return
            }
            phrase_info_pu(currency);
            return
        }
        if (is_viewonly() === true) {
            show_view_only_error();
            return false
        }
        manage_bip32();
    })
}

// Manages SegWit address format switching with confirmations
function segwit_switch() {
    $(document).on("mouseup", "#segw_box .toggle_segwit .switchpanel", function() {
        if (is_viewonly() === true) {
            show_view_only_error();
            return
        }
        const toggle_btn = $(this),
            is_segwit = toggle_btn.hasClass("true"),
            settings_item = toggle_btn.closest("li"),
            currency = settings_item.attr("data-currency"),
            xpub_settings = cs_node(currency, "Xpub"),
            settings_data = xpub_settings.data(),
            current_path = settings_data.root_path,
            coin_code = current_path.split("/")[2],
            path_display = $("#d_paths .pd_" + currency + " .d_path_header span.ref");
        if (is_segwit === true) {
            const user_confirmed = confirm(tl("uselegacy", {
                "thiscurrency": currency
            }));
            if (user_confirmed === false) {
                return
            }
            const legacy_path = "m/44'/" + coin_code + "/0'/0/";
            xpub_settings.data("root_path", legacy_path);
            toggle_btn.removeClass("true").addClass("false");
            path_display.text(legacy_path);
        } else {
            const user_confirmed = confirm(tl("usesegwit", {
                "thiscurrency": currency
            }));
            if (user_confirmed === false) {
                return
            }
            const segwit_path = "m/84'/" + coin_code + "/0'/0/";
            xpub_settings.data("root_path", segwit_path);
            toggle_btn.addClass("true").removeClass("false");
            path_display.text(segwit_path);
        }
        const next_btn = $("#d_paths .pd_" + currency + " .d_path_body .td_bar .td_next");
        save_cc_settings(currency, true);
        derive_address_batch(next_btn, "replace");
    })
}

// Triggers BIP39 key derivation settings UI
function bip39_sc(currency_id) {
    $("#" + currency_id + "_settings .cc_settinglist li[data-id='Key derivations'] .atext").trigger("click");
}

// Displays detailed Xpub information with QR code and derived addresses
function display_xpub_details(currency, xpub_key) {
    const coin_data = get_coin_config(currency),
        bip32_config = get_bip32dat(currency),
        derivation_path = "M/0/",
        start_index = 0,
        key_config = key_cc_xpub(xpub_key),
        master_key = key_config.key,
        chain_code = key_config.cc,
        version_bytes = key_config.version,
        root_config = {
            "key": master_key,
            "cc": chain_code,
            "xpub": true,
            "versionbytes": version_bytes
        },
        derived_keys = br_keypair_array(false, new Array(5), start_index, derivation_path, bip32_config, master_key, chain_code, currency, version_bytes),
        address_list = derived_keys.map((key_data, index) => {
            const path_index = start_index + index;
            return "<li class='adbox der_li' data-index='" + path_index + "'><strong>" + derivation_path + path_index + "</strong> | <span class='mspace'>" + key_data.address + "</span></li>";
        }).join(""),
        currency_symbol = coin_data.ccsymbol,
        currency_icon = getcc_icon(coin_data.cmcid, currency_symbol + "-" + currency, coin_data.erc20),
        xpub_box = br_is_cashier ? "" : "<li id='xpub_box' class='clearfix noline'>\
            <div class='xpub_ib clearfix pd_" + currency + "' data-xpub='" + xpub_key + "'>\
                <div class='show_xpub'><strong>Xpub: </strong><span class='xpref ref'>" + tl("show") + "</span></div>\
                    <div class='xp_span drawer'>\
                        <div class='qrwrap flex'><div class='qrcode'></div>" + currency_icon + "</div>\
                        <p class='adbox adboxl select' data-type='Xpub'>" + xpub_key + "</p>\
                    </div>\
                </div>\
        <li>",
        dialog_content = $("<div id='ad_info_wrap'><h2>" + currency_icon + " <span>" + currency + " " + tl("Key derivations") + "</span></h2><ul>" + xpub_box + "<div id='d_paths'></div>\
        </li>\
    </ul>\
    </div>").data(root_config);
    popdialog(dialog_content, "triggersubmit");
    const path_config = {
            "bip32": bip32_config,
            currency
        },
        path_element = $("<div class='d_path pd_" + currency + "'>\
            <div class='d_path_header'><strong>Derivation path: </strong><span class='ref'>" + derivation_path + "</span></div>\
            <div class='d_path_body clearfix'>\
                <div class='td_bar'><div class='td_next button'>" + tl("next") + "</div><div class='td_prev button'>" + tl("prev") + "</div></div>\
                <ul class='td_box'>" + address_list + "</ul>\
            </div>\
        </div>").data(path_config);
    $("#d_paths").append(path_element);
    setTimeout(function() {
        $("#ad_info_wrap .d_path_header").trigger("click");
    }, 550);
}

// Displays Xpub key information with QR code generation and deletion options
function edit_xpub_trigger() {
    $(document).on("click", ".cc_settinglist li[data-id='Xpub'] .atext", function() {
        if (!glob_let.test_derive) {
            play_audio("funk");
            return
        }
        const xpub_element = $(this),
            settings_item = xpub_element.closest("li"),
            xpub_data = settings_item.data();
        if (!xpub_data.selected || !xpub_data.key) {
            return
        }
        const item_wrap = settings_item.find(".liwrap"),
            currency = item_wrap.attr("data-currency"),
            coin_data = get_coin_config(currency),
            xpub_key = xpub_data.key,
            currency_icon = getcc_icon(coin_data.cmcid, coin_data.ccsymbol + "-" + currency, coin_data.erc20),
            dialog_html = $("<div id='ad_info_wrap'><h2>" + currency_icon + " " + tl("bip32xpub") + "</h2>\
                <div class='d_ulwrap'>\
                    <ul>\
                        <li><strong>Key: </strong><span class='adbox adboxl select'>" + xpub_key + "</span>\
                        <div id='qrcodexp' class='qrwrap flex'><div class='qrcode'></div>" + currency_icon + "</div>\
                        </li>\
                        <li><strong>" + tl("derivationpath") + ":</strong> M/0/</li>\
                    </ul>\
                </div>\
                <div id='backupactions'>\
                    <div id='delete_xpub' data-currency='" + currency + "' class='util_icon icon-bin'></div>\
                    <div id='backupcd'>" + cancelbttn + "</div>\
                </div>\
            </div>");
        popdialog(dialog_html, "triggersubmit", null, true);
        $("#qrcodexp .qrcode").qrcode(xpub_key);
    })
}

// Displays form for adding new Xpub key with QR scanning support
function edit_xpub(currency_info) {
    const currency = currency_info.currency,
        display_id = currency_info.ccsymbol + "-" + currency,
        initial_address = currency_info.address || "",
        qr_scanner = (glob_let.hascam) ? "<div class='qrscanner' data-currency='" + currency + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        form_title = tl("addxpub", {
            currency
        }),
        dialog_content = $("<div class='formbox form add' id='xpubformbox'>\
            <h2>" + getcc_icon(currency_info.cmcid, display_id, currency_info.erc20) + " " + form_title + "</h2>\
            <div class='popnotify'></div>\
            <form class='addressform popform'>\
                <div class='inputwrap'><input type='text' id='xpub_input' class='address' value='" + initial_address + "' placeholder='" + form_title + "' data-currency='" + currency + "' autocomplete='off' autocapitalize='off' spellcheck='false'>" + qr_scanner + "</div>\
                <div id='ad_info_wrap' style='display:none'>\
                    <ul class='td_box'>\
                    </ul>\
                    <div id='pk_confirm' class='noselect'>\
                        <div id='matchwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + tl("xpubmatch", {
            "currency": currency
        }) + "</span><br/>\
                        <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + tl("xpubkeys") + "</span>\
                    </div>\
                </div>\
                <input type='submit' class='submit' value='" + tl("okbttn") + "'></form>").data(currency_info);
    popdialog(dialog_content, "triggersubmit");
    if (!glob_const.supportsTouch) {
        $("#popup input.address").focus();
    }
}

// Validates Xpub input format and triggers address derivation on valid input
function handle_xpub_input() {
    $(document).on("input", "#xpub_input", function(e) {
        const input_field = $(this),
            xpub_key = input_field.val(),
            currency = input_field.attr("data-currency"),
            is_valid = check_xpub(xpub_key, xpub_prefix(currency), currency);
        if (is_valid) {
            clear_xpub_checkboxes();
            validate_xpub(input_field.closest("#xpubformbox"));
            return
        }
        xpub_fail(currency);
    })
}

// Triggers validation and saving of entered Xpub key
function validate_xpub_input() {
    $(document).on("click", "#xpubformbox input.submit", function(e) {
        e.preventDefault();
        validate_xpub($(this).closest("#xpubformbox"));
    })
}

// Performs comprehensive validation of Xpub key with address derivation and state updates
function validate_xpub(form_container) {
    const form_data = form_container.data(),
        currency = form_data.currency,
        input_field = form_container.find(".address"),
        xpub_key = input_field.val();
    if (!xpub_key) {
        xpub_fail(currency);
        input_field.focus();
        return
    }
    if (inj(xpub_key)) return
    const is_valid = check_xpub(xpub_key, xpub_prefix(currency), currency),
        address_list = $("#ad_info_wrap .td_box"),
        details_panel = $("#ad_info_wrap");
    if (is_valid !== true) {
        const error_message = tl("invalidxpub", {
            currency
        });
        popnotify("error", error_message);
        setTimeout(function() {
            input_field.select();
        }, 10);
        return
    }
    const derived_addresses = generate_derived_addresses(currency, xpub_key);
    if (!derived_addresses) {
        xpub_fail(currency);
        return false
    }
    const label_field = form_container.find(".addresslabel"),
        label_input = label_field.val();
    if (inj(label_input)) return
    label_field.slideUp("500").val("");
    address_list.html(derived_addresses);
    details_panel.slideDown("500");
    const key_confirm = form_container.find("#pk_confirmwrap"),
        key_confirmed = key_confirm.data("checked"),
        match_confirm = form_container.find("#matchwrap"),
        match_confirmed = match_confirm.data("checked");
    if (!match_confirmed) {
        popnotify("error", tl("confirmmatch"));
        return false
    }
    if (!key_confirmed) {
        popnotify("error", tl("confirmpkownership"));
        return false
    }
    const settings_item = cs_node(currency, "Xpub"),
        existing_key = settings_item.data("key");
    if (existing_key) {
        if (existing_key === xpub_key) {
            canceldialog();
            return false
        }
        if (!confirm(tl("replacexpub"))) {
            return false
        }
    }
    const xpub_id = hmacsha(xpub_key, "sha256").slice(0, 8);
    settings_item.data({
        "selected": true,
        "key": xpub_key,
        "key_id": xpub_id
    }).find(".switchpanel").removeClass("false").addClass("true");
    settings_item.find("p").text("true");
    const currency_item = get_currencyli(currency),
        home_button = get_homeli(currency);
    currency_item.attr("data-checked", "true").data("checked", true);
    home_button.removeClass("hide");
    const init_currency = set_up() ? null : currency;
    save_currencies(true, init_currency);
    save_cc_settings(currency, true);
    const key_config = key_cc_xpub(xpub_key),
        coin_data = get_coin_config(currency),
        bip32_config = get_bip32dat(currency);
    key_config.seedid = xpub_id;
    const derived_data = derive_obj("xpub", key_config, coin_data, bip32_config);
    if (derived_data) {
        derive_add_address(currency, derived_data);
    }
    canceldialog();
    clear_savedurl();
    if (init_currency) {
        canceldialog();
        save_settings();
        home_button.find(".rq_icon").trigger("click");
        return
    }
    notify(tl("xpubsaved"));
    add_xpub_cb(currency, xpub_id);
    save_addresses(currency, false);
    currency_check(currency);
}

// Handles failed Xpub validation with error notification
function xpub_fail(currency) {
    const error_message = tl("invalidxpub", {
        "currency": currency
    });
    popnotify("error", error_message);
    reset_xpub_form();
}

// Resets Xpub input form state
function reset_xpub_form() {
    $("#ad_info_wrap").slideUp(200, function() {
        $("#ad_info_wrap .td_box").html("");
    });
    clear_xpub_checkboxes();
}

// Resets Xpub confirmation checkboxes
function clear_xpub_checkboxes() {
    $("#pk_confirmwrap, #matchwrap").attr("data-checked", "false").data("checked", false);
}

// Validates Xpub format against currency-specific patterns
function check_xpub(xpub_key, default_prefix, currency) {
    const known_prefixes = {
            bitcoin: "zpub|xpub",
            litecoin: "zpub|Ltub"
        },
        prefix_pattern = known_prefixes[currency] || default_prefix,
        validation_regex = "(" + prefix_pattern + ")([a-km-zA-HJ-NP-Z1-9]{107})(\\?c=\\d*&h=bip\\d{2,3})?";
    return new RegExp(validation_regex).test(xpub_key);
}

// Generates preview of derived addresses from Xpub key
function generate_derived_addresses(currency, xpub_key) {
    try {
        const bip32_config = get_bip32dat(currency),
            derivation_path = "M/0/",
            start_index = 0,
            key_config = key_cc_xpub(xpub_key),
            master_key = key_config.key,
            chain_code = key_config.cc,
            version_bytes = key_config.version,
            root_config = {
                "key": master_key,
                "cc": chain_code,
                "xpub": true,
                "versionbytes": version_bytes
            },
            derived_keys = br_keypair_array(false, new Array(5), start_index, derivation_path, bip32_config, master_key, chain_code, currency, version_bytes),
            address_list = derived_keys.map((key_data, index) => {
                const path_index = start_index + index;
                return "<li class='adbox der_li' data-index='" + path_index + "'><strong>" + derivation_path + path_index + "</strong> | <span class='mspace'>" + key_data.address + "</span></li>";
            }).join("");
        return address_list;
    } catch (err) {
        return false
    }
}

// Handles enabling/disabling Xpub functionality in currency settings
function xpub_cc_switch() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Xpub'] .switchpanel.custom", function() {
        if (glob_let.test_derive !== true) {
            play_audio("funk");
            return
        }
        const toggle_btn = $(this),
            settings_item = toggle_btn.closest("li"),
            parent_wrap = toggle_btn.closest(".liwrap"),
            currency = parent_wrap.attr("data-currency"),
            xpub_data = settings_item.data();
        if (toggle_btn.hasClass("true")) {
            const user_confirmed = confirm(tl("disablexpub"));
            if (user_confirmed) {
                settings_item.data("selected", false).find("p").text("false");
                toggle_btn.removeClass("true").addClass("false");
                save_cc_settings(currency, true);
                delete_xpub_cb(currency, xpub_data.key_id);
            }
            return
        }
        if (xpub_data.key) {
            settings_item.data("selected", true).find("p").text("true");
            toggle_btn.removeClass("false").addClass("true");
            save_cc_settings(currency, true);
            add_xpub_cb(currency, xpub_data.key_id);
            save_addresses(currency, false);
            currency_check(currency);
            return
        }
        const coin_data = get_coin_config(currency),
            currency_info = {
                "currency": currency,
                "ccsymbol": coin_data.ccsymbol,
                "cmcid": coin_data.cmcid,
                "erc20": coin_data.erc20
            }
        edit_xpub(currency_info);
    })
}

// Handles Xpub deletion with user confirmation and state cleanup
function delete_xpub() {
    $(document).on("click", "#delete_xpub", function() {
        const user_confirmed = confirm(tl("delete") + " " + tl("bip32xpub") + "?");
        if (user_confirmed) {
            const currency = $(this).attr("data-currency"),
                settings_item = cs_node(currency, "Xpub"),
                xpub_id = settings_item.data("key_id");
            delete_xpub_cb(currency, xpub_id, true);
            save_addresses(currency, false);
            check_currency(currency);
            settings_item.data({
                "selected": false,
                "key": null,
                "key_id": null
            }).find(".switchpanel").removeClass("true").addClass("false");
            settings_item.find("p").text("false");
            save_cc_settings(currency, true);
            canceldialog();
        }
    })
}

// Updates address list UI after Xpub key deletion
function delete_xpub_cb(currency, xpub_id, reset_checked) {
    const affected_addresses = filter_addressli(currency, "xpubid", xpub_id);
    affected_addresses.each(function() {
        const address_item = $(this);
        address_item.removeClass("xpubv").addClass("xpubu");
        if (reset_checked) {
            address_item.attr("data-checked", "false").data("checked", false);
        }
    });
}

// Updates address list UI after adding new Xpub key
function add_xpub_cb(currency, xpub_id) {
    const affected_addresses = filter_addressli(currency, "xpubid", xpub_id);
    affected_addresses.each(function() {
        $(this).addClass("xpubv").removeClass("xpubu").attr("data-checked", "true").data("checked", true);
    });
}

// ** API Key Management: **

// Triggers API key input dialog
function trigger_apikey() {
    $(document).on("click", "#add_api", function() {
        add_apikey($(this).attr("data-api"));
    })
}

// Displays form for adding new API key
function add_apikey(api_name) {
    const stored_key = $("#apikeys").data(api_name),
        current_key = stored_key || "",
        api_config = get_api_data(api_name),
        signup_url = api_config.sign_up,
        signup_link = !signup_url ? "" : "<div id='api_signin'>Get your " + api_name + " API key <a href='" + signup_url + "' target='blank' class='exit linkcolor'>here</a></div>",
        dialog_content = "\
        <div class='formbox' id='add_apikey'>\
            <h2 class='icon-key'>Set " + api_name + " API key</h2>\
            <div class='popnotify'></div>\
            <div class='popform' data-api='" + api_name + "'>\
                <input type='text' value='" + current_key + "' placeholder='API key' data-apikey='" + current_key + "' data-checkchange='" + current_key + "'>\
                <input type='submit' class='submit' value='" + tl("okbttn") + "'/>\
            </div>" + signup_link +
        "</div>";
    canceldialog();
    setTimeout(function() {
        popdialog(dialog_content, "triggersubmit");
    }, 800);
}

// Validates and saves entered API key
function save_api_key() {
    $(document).on("click", "#add_apikey input.submit", function(e) {
        e.preventDefault();
        const form_container = $(this).closest(".popform"),
            key_input = form_container.find("input:first"),
            new_key = key_input.val(),
            existing_key = key_input.attr("data-apikey");
        if (!new_key) {
            popnotify("error", tl("validateapikey"));
            return
        }
        if (new_key === existing_key) {
            canceldialog();
            return
        }
        if (key_input.attr("data-checkchange") === new_key) {
            popnotify("error", tl("validateapikey"));
            return
        }
        key_input.attr("data-checkchange", new_key);
        checkapikey(form_container.attr("data-api"), new_key, true);
    })
}

// ** API Soundbyte Management: **

// Triggers Soundbyte key input dialog
function setup_soundbyte_selection() {
    $(document).on("click", ".cc_settinglist li[data-id='soundbytes']", function() {
        const settings_item = $(this),
            item_data = settings_item.data(),
            sb_list = item_data.options;
        if (sb_list) {
            const currency = settings_item.children(".liwrap").attr("data-currency"),
                selected_sb = item_data.selected,
                selected_tl = selected_sb === "none" ? tl("none") : selected_sb,
                dialog_title = tl("choosesoundbytes"),
                sb_options = sb_list.map(function(sb) {
                    const thistext = sb === "none" ? tl("none") : sb,
                        icon = sb === "none" ? "icon-volume-mute2" : "icon-volume-medium";
                    return "<span class='" + icon + "' data-pe='none' data-val='" + sb + "'>" + thistext + "</span>";
                }).join(""),
                dialog_data = [{
                    "div": {
                        "class": "popform",
                        "content": [{
                            "div": {
                                "class": "selectbox",
                                "content": [{
                                        "input": {
                                            "attr": {
                                                "type": "text",
                                                "value": selected_tl,
                                                "placeholder": dialog_title,
                                                "readonly": "readonly"
                                            },
                                            "close": true
                                        },
                                        "div": {
                                            "class": "selectarrows icon-menu2",
                                            "attr": {
                                                "data-pe": "none"
                                            }
                                        }
                                    },
                                    {
                                        "div": {
                                            "class": "options",
                                            "content": sb_options
                                        }
                                    }
                                ]
                            },
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn"),
                                    "data-currency": currency
                                }
                            }
                        }]
                    }
                }],
                dialog_html = template_dialog({
                    "id": "sb_formbox",
                    "icon": "icon-volume-medium",
                    "title": dialog_title,
                    "elements": dialog_data
                });
            popdialog(dialog_html, "triggersubmit");
        }
    })
}

function select_soundbyte() {
    $(document).on("mousedown", "#sb_formbox .selectbox > .options span", function() {
        const this_sb = $(this),
            this_val = this_sb.data("val");
        $("#sb_formbox").data("val", this_val);
        play_audio(this_val);
    })
}

// Save soundbyte settings
function save_soundbyte_settings() {
    $(document).on("click", "#sb_formbox input.submit", function(e) {
        e.preventDefault();
        const currency = $(this).attr("data-currency"),
            val = $("#sb_formbox").data("val");
        if (inj(val)) return
        const settings_node = cs_node(currency, "soundbytes");
        if (settings_node) {
            settings_node.data("selected", val).find("p").text(val);
            canceldialog();
            notify(tl("datasaved"));
            save_cc_settings(currency, true);
        }
    })
}

// ** Settings Reset: **

// Triggers confirmation dialog for resetting coin settings
function reset_coinsettings_trigger() {
    $(document).on("click", ".reset_cc_settings", function() {
        const reset_btn = $(this),
            currency = reset_btn.attr("data-currency");
        popdialog("<h2 class='icon-bin'>" + tl("resetdialog", {
            currency
        }) + "</h2>", "reset_coinsettings", reset_btn);
    })
}

// Initiates coin settings reset after user confirmation
function reset_coinsettings(trigger_element) {
    const currency = trigger_element.attr("data-currency"),
        user_confirmed = confirm(tl("resetconfirm", {
            currency
        }));
    if (user_confirmed !== true) {
        return
    }
    restore_default_settings(currency);
}

// Performs coin settings reset while preserving critical configurations
function restore_default_settings(currency) {
    const stored_settings = br_get_local(currency + "_settings", true);
    if (stored_settings) {
        const lightning_config = currency === "bitcoin" ? stored_settings["Lightning network"] : false,
            xpub_config = stored_settings.Xpub || false,
            layer2_enabled = stored_settings.layer2,
            default_settings = get_coinsettings(currency);
        if (lightning_config) {
            default_settings["Lightning network"] = lightning_config; // don't reset lightning settings
        }
        if (xpub_config) {
            default_settings.Xpub = xpub_config; // don't reset xpub settings
        }
        if (layer2_enabled) {
            const compressed_settings = compress_layer2_config(currency);
            br_set_local(currency + "_settings", compressed_settings, true);
            append_coinsetting(currency, compressed_settings);
        } else {
            br_set_local(currency + "_settings", default_settings, true);
            append_coinsetting(currency, default_settings);
        }
    }
    canceldialog();
    notify(tl("resetnotify", {
        currency
    }));
}