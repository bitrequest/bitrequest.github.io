$(document).ready(function() {
    // ** CORE SETTINGS: **

    // ** Account name: **
    edit_account_name();
    save_account_name();

    // ** Local fiat currency: **
    select_default_currency();
    toggle_defaultcurrency();
    filter_currency_input();
    save_currency_settings();

    // ** Language: **
    select_language();
    save_language_settings();

    // ** Choose theme **
    edit_theme();
    select_theme();
    cancel_theme();
    submit_theme();
    //theme_not_found

    // ** SECURITY: **

    // ** Passcode lock: **
    configure_pin_settings();
    select_lock_timeout();
    save_lock_timeout();

    // ** Secret phrase: **
    manage_bip32_passphrase();
    hide_seed_panel_trigger();
    //hide_seed_panel

    // ** Backup app data: **
    start_backup_process();
    //backup_database
    toggle_secret_phrase();
    share_backup_file();
    //check_systembu
    //stripb64
    //systembu_expired
    restore_systembu();
    cancel_backup_dialog();
    //generate_backup_data
    //generate_backup_filename
    submit_backup();

    // ** Restore app data: **
    restore_from_backup();
    //trigger_restore
    restore_backup();
    submit_restore();
    //restore
    //check_backup
    submit_gd_restore();
    //scan_restore
    //restore_algo
    //restore_callback
    //s_decode
    //pin_dialog
    submit_pin_dialog();
    //restore_cb_init_addresses
    //restore_callback_file
    //restore_callback_gd
    //dphrase_dialog
    submit_dphrase()
    //keep_current_seed
    //restore_bu_seed
    //bu_oldseed
    compare_seeds();
    //cs_callback
    //compare_seeds_callback
    //restore_storage

    // ** ADVANCED: **

    // ** Export CSV: **
    csvexport_trigger();
    submit_csvexport();
    //complile_csv
    //should_include_request
    //render_csv
    share_csv();
    //check_csvexport
    submit_csvdownload();

    // ** URL Shortener: **
    urlshortener();
    toggle_url_shortener();
    pick_urlshortener_select();
    submit_urlshortener_select();

    // ** Cryptocurrency price data: **
    configure_crypto_api();
    select_crypto_api();
    save_crypto_api_settings();

    // ** FIAT price data: **
    configure_fiat_api();
    select_fiat_api();
    save_fiat_api_settings();

    // ** API Proxy: **
    trigger_proxy_dialog();
    pick_api_proxy();
    //test_append_proxy
    //proxy_option_li
    submit_proxy();
    hide_custom_proxy_field();
    //test_custom_proxy
    remove_proxy();

    // ** API Keys: **
    apikeys();
    api_input_change();
    submit_api();
    //validate_api_key
    //json_check_apikey
    //api_fail
    //update_api_attr
    //complement_apisettings

    // ** Contact Form: **
    edit_contactform_trigger();
    //edit_contactform
    //check_contactform
    type_contactform();
    submit_contactform();

    // ** Permissions: **
    permissions();
    //permissions_callback
    submit_permissions();

    // ** Team invite: **
    team_invite_trigger();
    //team_invite
    //complile_teaminvite
    //adjust_object
    share_teaminvite();
    share_teaminvite_qr();
    //toggle_ti_qr
    //check_teaminvite
    install_teaminvite_trigger();
    //install_teaminvite
    //is_team_invite

    // ** Utility Functions: **
    check_useragent();
});

// ** CORE SETTINGS: **

// ** Account name: **

// Handles popup dialog for editing user account display name
function edit_account_name() {
    $(document).on("click", "#accountsettings", function() {
        const ddat = [{
                "div": {
                    "class": "popform",
                    "content": [{
                            "input": {
                                "attr": {
                                    "type": "text",
                                    "value": $(this).data("selected")
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "accountformbox",
                "icon": "icon-user",
                "title": tl("accountsettings"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    });
}

// Validates and saves new account display name, triggering UI notifications
function save_account_name() {
    $(document).on("click", "#accountformbox input.submit", function(e) {
        e.preventDefault();
        const input = $(this).prev("input"),
            value = input.val();
        if (value.length < 1) {
            popnotify("error", tl("nameisrequired"));
            input.focus();
            return false
        }
        if (inj(value)) return
        set_setting("accountsettings", {
            "selected": value
        }, value);
        canceldialog();
        notify(tl("datasaved"));
        save_settings();
    });
}

// ** Local fiat currency: **

// Opens currency selection dialog with supported fiat currencies excluding BTC
function select_default_currency() {
    $(document).on("click", "#currencysettings", function() {
        const curr_settings = $("#currencysettings"),
            switchmode = curr_settings.data("default"),
            currency = curr_settings.data("selected"),
            symbols = br_get_local("symbols", true);
        let symbollist = "";
        $.each(symbols, function(key, value) {
            if (key !== "BTC") {
                symbollist += "<span data-id='1' data-pe='none'>" + key + " | " + value + "</span>";
            }
        });
        const ddat = [{
                "div": {
                    "class": "popform validated",
                    "content": [{
                            "div": {
                                "class": "selectbox",
                                "content": [{
                                        "input": {
                                            "attr": {
                                                "type": "text",
                                                "value": currency,
                                                "autocomplete": "off",
                                                "autocapitalize": "off",
                                                "spellcheck": "false",
                                                "data-pe": "none"
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
                                            "class": "options show_options",
                                            "content": symbollist
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "div": {
                                "id": "toggle_defaultcurrency",
                                "class": "clearfix",
                                "content": "<h3>" + tl("setasdefault") + switch_panel(switchmode, " global") + "</h3>"
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "currencyformbox",
                "icon": "icon-dollar",
                "title": tl("entercurrency"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    });
}

// Tracks state changes of the default currency toggle switch
function toggle_defaultcurrency() {
    $(document).on("mouseup", "#toggle_defaultcurrency .switchpanel", function(e) {
        $(this).addClass("dc_changed");
    });
}

// Filters and validates currency input against supported currency list in real-time
function filter_currency_input() {
    $(document).on("input", "#currencyformbox input:first", function() {
        const input = $(this),
            form = input.closest(".popform"),
            value = input.val().toUpperCase(),
            options = form.find(".options");
        form.removeClass("validated");
        $("#currencyformbox .options > span").each(function() {
            const option = $(this),
                text = option.text(),
                symbol = text.split(" | ")[0];
            option.removeClass("show");
            if (symbol === value) {
                form.addClass("validated");
                input.val(text)[0].setSelectionRange(0, 999);
            } else if (symbol.match("^" + value)) {
                option.addClass("show");
            }
        });
    });
}

// Validates and saves currency preferences including symbol and default status
function save_currency_settings() {
    $(document).on("click", "#currencyformbox input.submit", function(e) {
        e.preventDefault();
        const local_curr = get_setting("currencysettings", "currencysymbol"),
            form = $(this).closest(".popform"),
            input = form.find("input:first"),
            input_val = input.val();
        if (inj(input_val)) return
        form.removeClass("validated");
        $("#currencyformbox .options > span").each(function() {
            if (input_val == $(this).text()) {
                form.addClass("validated");
            }
        });
        if (form.hasClass("validated")) {
            const dc_switch = $("#toggle_defaultcurrency .switchpanel"),
                switch_changed = dc_switch.hasClass("dc_changed"),
                values = input_val.split(" | "),
                curr_symbol = values[0],
                currency = values[1],
                symbol_lc = curr_symbol.toLowerCase();
            if (symbol_lc === local_curr && !switch_changed) {
                canceldialog();
                return
            }
            const dc_output = dc_switch.hasClass("true");
            set_setting("currencysettings", {
                "currencysymbol": symbol_lc,
                "selected": input_val,
                "default": dc_output
            }, input_val);
            canceldialog();
            notify(tl("currencysaved"));
            save_settings();
            return
        }
        popnotify("error", tl("currencynotsupported", {
            "currency": input_val.toUpperCase()
        }));
        input.focus();
    });
}

// ** Language: **

// Displays language selection dialog with current locale and available translations
function select_language() {
    $(document).on("click", "#langsettings", function() {
        const translation = tl("obj"),
            curr_lang = q_obj(translation, langcode + ".lang"),
            curr_flag = q_obj(translation, langcode + ".flag"),
            flag_str = curr_flag ? curr_flag + " " : "",
            curr_val = flag_str + curr_lang + " (" + langcode + ")";
        let langlist = "";
        $.each(translation, function(key, value) {
            const flag = value.flag ? value.flag + " " : "";
            langlist += "<span>" + flag + value.lang + " (" + key + ")</span>";
        });
        const ddat = [{
                "div": {
                    "class": "popform validated",
                    "attr": {
                        "data-currentlang": langcode
                    },
                    "content": [{
                            "div": {
                                "class": "selectbox",
                                "content": [{
                                        "input": {
                                            "attr": {
                                                "type": "text",
                                                "value": curr_val,
                                                "placeholder": "Pick language",
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
                                            "content": langlist
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "langformbox",
                "icon": "icon-dollar",
                "title": tl("chooselanguage"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    });
}

// Updates application language setting and reloads settings page with new locale 
function save_language_settings() {
    $(document).on("click", "#langformbox input.submit", function(e) {
        e.preventDefault();
        const form = $(this).closest(".popform"),
            current = form.attr("data-currentlang"),
            input = form.find("input"),
            value = input.val();
        if (inj(value)) return
        const lang = value.match(/\(([^)]+)\)/)[1];
        if (lang === current) {
            canceldialog();
            return
        }
        set_setting("langsettings", {
            "selected": lang
        }, value);
        save_settings();
        glob_const.w_loc.href = glob_const.w_loc.pathname + "?p=settings";
    });
}

// Choose theme

// Displays language selection dialog with current locale and available translations
function edit_theme() {
    $(document).on("click", "#themesettings", function() {
        const theme = $("#themesettings").data("selected"),
            default_theme = "<span>default.css</span>",
            ddat = [{
                    "div": {
                        "class": "popform",
                        "content": [{
                                "div": {
                                    "class": "selectbox",
                                    "content": [{
                                            "input": {
                                                "attr": {
                                                    "type": "text",
                                                    "value": theme,
                                                    "placeholder": "Pick a theme",
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
                                                "content": default_theme
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "input": {
                                    "class": "submit",
                                    "attr": {
                                        "type": "submit",
                                        "value": tl("okbttn")
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    "div": {
                        "id": "backupactions",
                        "content": [{
                                "div": {
                                    "id": "submittheme",
                                    "class": "customtrigger",
                                    "content": tl("okbttn")
                                }
                            },
                            {
                                "div": {
                                    "id": "canceltheme",
                                    "class": "customtrigger",
                                    "content": tl("cancelbttn")
                                }
                            }
                        ]
                    }
                }
            ],
            content = template_dialog({
                "id": "themeformbox",
                "icon": "icon-paint-format",
                "title": tl("choosetheme"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
        let options = $("#themeformbox").find(".options"),
            get_session_themes = br_get_session("themes", true);
        if (get_session_themes) {
            $.each(get_session_themes, function(key, value) {
                options.append("<span data-pe='none'>" + value + "</span>");
            });
            return
        }
        api_proxy({
            "api_url": d_proxy() + "/proxy/v1/themes/"
        }).done(function(data) {
            const api_result = br_result(data);
            if (api_result) {
                const data = api_result.result;
                if (data) {
                    if (data.error) {
                        theme_not_found();
                        return
                    }
                    $.each(data, function(key, value) {
                        options.append("<span data-pe='none'>" + value + "</span>");
                    });
                    br_set_session("themes", data, true);
                    return
                }
            }
            theme_not_found();
        }).fail(function(error) {
            console.error("Error fetching themes:", error);
            theme_not_found();
        });
    });
}

function select_theme() {
    $(document).on("mousedown", "#themeformbox .selectbox > .options span", function() {
        const filename = $(this).text();
        if (filename === "default.css") {
            theme_not_found();
            return
        }
        const version = $("#ua").attr("data-version");
        $("link#theme").attr("href", d_proxy() + "/proxy/v1/themes/" + filename + "?v=" + version);
    })
}

function cancel_theme() {
    $(document).on("click", "#canceltheme", function() {
        const filename = $("#themesettings").data("selected");
        if (filename) {
            if (filename === "default.css") {
                theme_not_found();
                canceldialog();
                return
            }
            $("link#theme").attr("href", d_proxy() + "/proxy/v1/themes/" + filename + "?v=" + version);
            canceldialog();
            return
        }
        theme_not_found();
        canceldialog();
    })
}

function submit_theme() {
    $(document).on("click touch", "#submittheme", function() {
        const thisvalue = $("#themeformbox").find("input:first").val();
        $("#themesettings").data("selected", thisvalue).find("p").text(thisvalue);
        canceldialog();
        notify("Data saved");
        save_settings();
    })
}

function theme_not_found() {
    const version = $("#ua").attr("data-version");
    $("link#theme").attr("href", "assets_styles_themes_default.css?v=" + version);
}

// ** SECURITY: **

// ** Passcode lock: **

// Displays PIN configuration dialog with reset option for existing PINs
function configure_pin_settings() {
    $(document).on("click", "#pinsettings", function() {
        if (check_pin_enabled(true) === true) {
            const content = pinpanel(" pinwall reset", null, true);
            showoptions(content, "pin");
            return
        }
        const content = pinpanel();
        showoptions(content, "pin");
    });
}

// Opens dialog for configuring automatic lock timeout duration
function select_lock_timeout() {
    $(document).on("click", "#locktime, #lock_time", function() {
        const locktime = get_setting("pinsettings", "locktime"),
            locktime_opts = [{
                    "value": "0",
                    "text": "0 " + tl("minutes")
                },
                {
                    "value": "60000",
                    "text": "1 " + tl("minute")
                },
                {
                    "value": "300000",
                    "text": "5 " + tl("minutes")
                },
                {
                    "value": "600000",
                    "text": "10 " + tl("minutes")
                },
                {
                    "value": "900000",
                    "text": "15 " + tl("minutes")
                },
                {
                    "value": "1800000",
                    "text": "30 " + tl("minutes")
                },
                {
                    "value": "never",
                    "text": tl("never")
                }
            ],
            options = locktime_opts.map(option =>
                "<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>" + option.value + "</span> " + option.text + "</div></li>"
            ).join(""),
            ddat = [{
                "div": {
                    "class": "popform",
                    "content": [{
                            "ul": {
                                "class": "conf_options noselect",
                                "content": options
                            },
                            "input": {
                                "attr": {
                                    "value": locktime,
                                    "type": "hidden"
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "locktime_formbox",
                "icon": "icon-clock",
                "title": tl("locktime"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
        $("#locktime_formbox ul.conf_options li").filter(function() {
            return $(this).find("span").text() === locktime;
        }).find(".radio").removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
    });
}

// Saves lock timeout preference and updates PIN status notification
function save_lock_timeout() {
    $(document).on("click", "#locktime_formbox input.submit", function(e) {
        e.preventDefault();
        const value = $(this).prev("input").val();
        if (inj(value)) return
        const title = value === "never" ? "pincodedisabled" : "pincodeactivated";
        set_setting("pinsettings", {
            "locktime": value,
            "selected": title
        }, tl(title));
        canceldialog();
        canceloptions();
        save_settings();
    });
}

// ** Secret phrase: **

// Initiates BIP32 passphrase management with PIN verification for existing passphrases
function manage_bip32_passphrase() {
    $(document).on("click", "#bip39_passphrase", function() {
        if (glob_let.hasbip === true) {
            all_pinpanel({
                "func": manage_bip32
            }, null, true);
            return
        }
        manage_bip32();
    });
}

// Attaches event listener to seed panel close button
function hide_seed_panel_trigger() {
    $(document).on("click", "#seed_steps .seed_step .ss_header .icon-cross", function() {
        hide_seed_panel();
    });
}

// Removes seed dialog CSS class and resets panel state
function hide_seed_panel() {
    glob_const.body.removeClass("seed_dialog");
    $("#sd_panel").attr("class", "");
    allow_screen_sleep();
}

// ** Backup app data: **

// Initiates database backup process via UI button or alert notification
function start_backup_process() {
    $(document).on("click", "#backup, #alert", function() {
        backup_database();
    });
}

// Creates and displays backup dialog with Google Drive integration and change tracking
function backup_database() {
    if ($("#popup").hasClass("showpu") || is_opendialog() || is_openrequest()) {
        return
    }
    const json = generate_backup_data(),
        filename = generate_backup_filename(),
        changes = [];
    $.each(glob_let.changes, function(key, value) {
        if (value > 0) {
            const num_changes = (value == 1) ? tl("changein") : tl("changesin");
            changes.push("<li>" + value + " " + num_changes + " '" + tl(key) + "'</li>");
        }
    });
    const gd_on = (get_auth_status().pass) ? true : false,
        alert_icon = $("#alert > span"),
        num_changes = alert_icon.text(),
        alert_title = alert_icon.attr("title"),
        alert_text = (num_changes === "!") ?
        "<span class='warning'>! " + alert_title + " </span>" :
        "<p>" + tl("nrchanges", {
            "nr_changes": num_changes
        }) + "</p>",
        show_changelog = gd_on ? "display:none" : "display:block",
        change_notice = ((!gd_on && glob_const.body.hasClass("haschanges")) || glob_const.html.hasClass("proxyupdate")) ? alert_text : "",
        ddat = [{
                "div": {
                    "id": "dialogcontent",
                    "content": [{
                            "div": {
                                "id": "ad_info_wrap",
                                "content": [{
                                    "ul": {
                                        "content": [{
                                            "li": {
                                                "class": "clearfix pad",
                                                "content": [{
                                                    "strong": {
                                                        "content": "<span class='icon-googledrive'></span> " +
                                                            tl("backupwithgd")
                                                    },
                                                    "div": {
                                                        "id": "gdtrigger",
                                                        "class": "ait",
                                                        "content": switch_panel(gd_on, " custom")
                                                    }
                                                }]
                                            }
                                        }]
                                    }
                                }]
                            }
                        },
                        {
                            "div": {
                                "id": "changelog",
                                "attr": {
                                    "style": show_changelog
                                },
                                "content": change_notice + "<ul>" + changes.join("") + "</ul>"
                            }
                        },
                        {
                            "div": {
                                "id": "custom_actions",
                                "content": [{
                                    "br": {
                                        "close": true
                                    },
                                    "a": {
                                        "id": "triggerdownload",
                                        "class": "button icon-download",
                                        "attr": {
                                            "href": "data:text/json;charset=utf-16le;base64," + json +
                                                "' download='" + filename,
                                            "title": filename,
                                            "data-date": new Date(now_utc()).toLocaleString(langcode)
                                                .replace(/\s+/g, "_").replace(/\:/g, "_"),
                                            "data-lastbackup": filename,
                                            "download": "download"
                                        },
                                        "content": tl("downloadbu")
                                    }
                                }]
                            }
                        }
                    ]
                }
            },
            {
                "div": {
                    "id": "backupactions",
                    "content": [{
                            "div": {
                                "id": "share_bu",
                                "class": "util_icon icon-share2",
                                "attr": {
                                    "data-url": json
                                }
                            }
                        },
                        {
                            "div": {
                                "id": "backupcd",
                                "content": "OK"
                            }
                        },
                        {
                            "div": {
                                "id": "backupcd",
                                "content": cancelbttn
                            }
                        }
                    ]
                }
            }
        ],
        content = template_dialog({
            "id": "backupformbox",
            "icon": "icon-download",
            "title": tl("backup"),
            "elements": ddat
        });
    popdialog(content, "triggersubmit", null, true);
}

// Controls secret phrase inclusion toggle with confirmation dialog
function toggle_secret_phrase() {
    $(document).on("mouseup", "#toggle_sbu_span .switchpanel", function() {
        const trigger = $(this),
            value = trigger.hasClass("true");
        if (value) {
            const result = confirm(tl("includesecretphrase"));
            if (result === false) {
                trigger.removeClass("true").addClass("false");
                return
            }
        }
        set_setting("backup", {
            "sbu": value
        });
        save_settings();
    });
}

// Initiates system backup sharing with server-side caching
function share_backup_file() {
    $(document).on("click", "#share_bu", function() {
        const result = confirm(tl("sharebu"));
        if (result) {
            loader(true);
            set_loader_text(tl("generatebu"));
            const account = btoa($("#accountsettings").data("selected")),
                url = $(this).attr("data-url"),
                url_hash = sha_sub(url, 10),
                time_format = new Date(now_utc()).toLocaleString(langcode),
                title = tl("systembackup") + " " + account + " (" + time_format + ")",
                cached_short_url = get_saved_shorturl(url_hash);
            if (cached_short_url) {
                share_request(cached_short_url, title);
                return
            }
            api_proxy({
                "custom": "system_bu",
                "api_url": "x", // dummy value, don't remove
                "proxy": true,
                "params": {
                    account,
                    url
                }
            }).done(function(e) {
                const ro = q_obj(e, "ping.br_cache.filename");
                if (ro) {
                    const proxy = c_proxy(),
                        data = btoa(JSON.stringify({
                            ro,
                            proxy
                        })),
                        app_root = glob_const.approot;
                    shorten_url(title, app_root + "?sbu=" + data, app_root + "img_icons_apple-touch-icon.png", true, url_hash);
                }
            }).fail(function(xhr, stat, err) {
                console.error("API proxy error:", xhr, stat, err);
                closeloader();
            });
        }
    });
}

// Retrieves and displays cached system backup with expiration countdown
function check_systembu(sbu) {
    const ro_dat = stripb64(sbu),
        ro_id = ro_dat.ro,
        ro_proxy = ro_dat.proxy;
    api_proxy({
        "custom": "get_system_bu",
        "api_url": "x", // dummy value, don't remove
        "proxy": true,
        "params": ro_id
    }, ro_proxy).done(function(e) {
        const ping = e.ping;
        if (ping) {
            const cache = ping.br_cache,
                server_time = cache.utc_timestamp,
                file_time = cache.created_utc,
                time_ms = file_time ? file_time * 1000 : now_utc(),
                time_format = new Date(time_ms).toLocaleString(langcode),
                result = ping.br_result,
                base64 = result.base64,
                account = atob(result.account),
                title = tl("systembackup") + " " + account + " (" + time_format + ")",
                bu_date = time_format.replace(/\s+/g, "_").replace(/\:/g, "_"),
                cache_time = cache.cache_time,
                expires = (file_time + cache_time) - server_time,
                filename = "bitrequest_system_backup_" + langcode + "_" + encodeURIComponent(account) + "_" + bu_date + ".json",
                cd = countdown(expires * 1000),
                cd_format = countdown_format(cd),
                exp_text = cd_format ? tl("expiresin") + cd_format : tl("fileexpired"),
                ddat = [{
                    "div": {
                        "id": "dialogcontent",
                        "content": [{
                                "h1": {
                                    "content": title
                                },
                                "div": {
                                    "class": "error",
                                    "attr": {
                                        "style": "margin-top:1em;padding:0.3em 1em"
                                    },
                                    "content": exp_text
                                }
                            },
                            {
                                "div": {
                                    "id": "changelog",
                                    "content": [{
                                        "div": {
                                            "id": "custom_actions",
                                            "content": [{
                                                "br": {
                                                    "close": true
                                                },
                                                "a": {
                                                    "id": "triggerdownload",
                                                    "class": "button icon-download",
                                                    "attr": {
                                                        "href": "data:text/json;charset=utf-16le;base64," + base64,
                                                        "download": filename,
                                                        "title": filename,
                                                        "data-date": bu_date,
                                                        "data-lastbackup": filename
                                                    },
                                                    "content": tl("downloadbu")
                                                },
                                                "div": {
                                                    "id": "restore_bu",
                                                    "class": "button icon-share2",
                                                    "attr": {
                                                        "data-base64": base64,
                                                        "data-filename": filename
                                                    },
                                                    "content": tl("installlbu")
                                                }
                                            }]
                                        }
                                    }]
                                }
                            }
                        ]
                    }
                }],
                content = template_dialog({
                    "id": "system_backupformbox",
                    "icon": "icon-download",
                    "title": tl("systembackup"),
                    "elements": ddat
                }) + "<div id='backupactions'><div id='backupcd'>" + cancelbttn + "</div></div>";
            popdialog(content, "triggersubmit", null, true);
        } else {
            systembu_expired();
        }
    }).fail(function(xhr, stat, err) {
        console.error("API proxy error:", xhr, stat, err);
        systembu_expired();
    });
}

// Parses base64-encoded JSON data for system backup
function stripb64(ab) {
    const b64 = ab.indexOf("%") > -1 ? ab.substr(0, ab.indexOf("%")) : ab;
    return JSON.parse(atob(b64));
}

// Displays error dialog when system backup file has expired
function systembu_expired() {
    const content = render_html([{
            "div": {
                "id": "system_backupformbox",
                "class": "formbox",
                "content": "<h2 class='icon-download'>" + tl("fileexpired") + "</h2>"
            }
        },
        {
            "div": {
                "id": "backupactions",
                "content": "<div id='backupcd'>" + cancelbttn + "</div>"
            }
        }
    ]);
    popdialog(content, "triggersubmit", null, true);
}

// Validates and processes system backup restoration from base64 encoded data
function restore_systembu() {
    $(document).on("click", "#system_backupformbox #restore_bu", function() {
        const result = confirm(tl("installsb"));
        if (result) {
            const btn = $(this),
                backup_data = btn.attr("data-base64"),
                cb64 = strip_quotes(backup_data),
                filename = btn.attr("data-filename");
            restore(atob(cb64), filename);
        }
    });
}

// Closes backup dialog when cancel button is clicked
function cancel_backup_dialog() {
    $(document).on("click", "#backupcd", function() {
        canceldialog();
    });
}

// Serializes localStorage data into base64 encoded backup excluding specific keys
function generate_backup_data() {
    const json = [],
        skip_keys = [
            "bitrequest_symbols", "bitrequest_changes", "bitrequest_erc20tokens_init",
            "bitrequest_erc20tokens", "bitrequest_editurl", "bitrequest_recent_requests",
            "bitrequest_backupfile_id", "bitrequest_appstore_dialog", "bitrequest_init",
            "bitrequest_eth_l2_contracts", "bitrequest_k", "bitrequest_awl", "bitrequest_dat", "bitrequest_tp"
        ];
    for (let key in localStorage) {
        const value = localStorage.getItem(key);
        if (value === null || skip_keys.includes(key)) {
            continue;
        } else if (key === "bitrequest_bpdat") {
            const not_verified = (glob_let.io.bipv !== "yes");
            if (not_verified || (glob_let.test_derive && get_setting("backup", "sbu") === true)) {
                const val_obj = JSON.parse(value);
                val_obj.dat = null;
                json.push('"' + key + '":' + JSON.stringify(val_obj));
            }
        } else {
            json.push('"' + key + '":' + value);
        }
    }
    return btoa("{" + json.join(",") + "}");
}

// Generates timestamped JSON backup filename with current locale
function generate_backup_filename() {
    return "bitrequest_backup_" + langcode + "_" +
        new Date(now_utc()).toLocaleString(langcode).replace(/\s+/g, "_").replace(/\:/g, "_") + ".json";
}

// Processes backup file download with iOS detection and confirmation dialog 
function submit_backup() {
    $(document).on("click", "#triggerdownload", function(e) {
        const node = $(this),
            href = node.attr("href"),
            title = node.attr("title"),
            result = confirm(tl("downloadfile", {
                "file": title
            }));
        if (result === false) {
            e.preventDefault();
            return
        }
        const last_saved = "last backup: " + node.attr("data-date"),
            last_backup = node.attr("data-lastbackup");
        set_setting("backup", {
            "titlebackup": last_saved,
            "lastbackup": last_backup,
            "device": "folder-open"
        }, last_saved);
        save_settings("noalert");
        reset_changes();
        canceldialog();
        notify(tl("downloaded", {
            "file": last_backup
        }));
    });
}

// ** Restore app data: **

// Initializes backup restoration interface from UI triggers
function restore_from_backup() {
    $(document).on("click", "#restore, #rshome", function() {
        trigger_restore();
    });
}

// Displays restore dialog with Google Drive integration and file upload options
function trigger_restore() {
    glob_let.backup_active = false;
    const restore_node = $("#restore"),
        backup_node = $("#backup"),
        file_used = restore_node.data("fileused"),
        last_device = restore_node.data("device"),
        device = last_device === "folder-open" ? "" : "google-drive",
        file_str = file_used ? "<p class='icon-" + device + "'>" + tl("lastrestore") +
        "<br/><span class='icon-" + last_device + "'>" + file_used + "</span></p>" : "",
        last_backup = backup_node.data("lastbackup"),
        bu_device = backup_node.data("device"),
        backup_device = bu_device === "folder-open" ? "" : "google-drive",
        backup_str = last_backup ? "<p class='icon-" + backup_device + "'>" + tl("lastbackup") +
        "<br/><span class='icon-" + bu_device + "'>" + last_backup + "</span></p>" : "",
        gd_on = get_auth_status().pass,
        show_gd = gd_on ? "display:none" : "display:block",
        ddat = [{
                "div": {
                    "id": "gd_meta",
                    "content": file_str + backup_str
                }
            },
            {
                "div": {
                    "id": "listappdata",
                    "content": "<h3 class='icon-googledrive'>" + tl("restorewithgd") +
                        switch_panel(gd_on, " custom") + "</h3>"
                }
            },
            {
                "div": {
                    "id": "backupswrap",
                    "content": [{
                        "ul": {
                            "id": "gd_backuplist"
                        },
                        "div": {
                            "id": "importjson",
                            "attr": {
                                "style": show_gd
                            },
                            "content": "<h3 class='icon-folder-open'>" + tl("restorefromfile") +
                                "</h3><input type='file' id='fileupload'/><input type='submit' class='submit' value='" +
                                tl("okbttn") + "'/>"
                        }
                    }]
                }
            }
        ],
        content = template_dialog({
            "id": "restoreformbox",
            "icon": "icon-upload",
            "title": tl("restore"),
            "elements": ddat
        });
    popdialog(content, "triggersubmit");
    if (gd_on) {
        fetch_drive_files();
    }
}

// Validates uploaded backup file size and type before processing
function restore_backup() {
    $(document).on("change", "#fileupload", function(n) {
        const file = this.files[0],
            size = file.size,
            type = file.type;
        glob_let.backup_filename = file.name;
        if (size > 5242880) {
            n.preventDefault();
            popnotify("error", tl("filesize"));
            return
        }
        if (type === "application/json") {
            const reader = new FileReader();
            reader.onload = function(e) {
                glob_let.backup_result = e.target.result;
                glob_let.backup_active = true;
            };
            reader.readAsDataURL(file);
            return
        }
        popnotify("error", tl("filetype", {
            "filetype": type
        }));
    });
}

// Processes backup restoration based on selected restore method
function submit_restore() {
    $(document).on("click", "#restoreformbox input.submit", function(e) {
        e.preventDefault();
        const panel = $("#popup #listappdata .switchpanel");
        if (panel.hasClass("true")) {
            topnotify(tl("selectbackup"));
            return
        }
        if (glob_let.backup_active === true) {
            if (glob_let.backup_result) {
                const backup_data = glob_let.backup_result.substr(glob_let.backup_result.indexOf(",") + 1),
                    cb64 = strip_quotes(backup_data);
                restore(atob(cb64), glob_let.backup_filename);
                return
            }
            topnotify(tl("error"));
            return
        }
        topnotify(tl("selectbackup"));
    });
}

// Validates and executes backup restoration with team invite handling
function restore(cb64, filename) {
    if (inj(filename)) return
    if (inj(cb64)) return
    const json = JSON.parse(cb64);
    if (!check_backup(json)) {
        return
    }
    const result = confirm(tl("restorefile", {
        "file": filename
    }));
    if (result) {
        if (is_team_invite(json)) {
            install_teaminvite(json, filename, false);
            return
        }
        scan_restore(json);
        const data = {
            "jasobj": json,
            filename,
            "type": "file"
        };
        restore_algo(data);
    }
}

// Validates backup compatibility with current system state
function check_backup(json) {
    const is_team = is_team_invite(json);
    if (glob_let.cashier_dat && glob_let.cashier_dat.cashier && !is_team) {
        notify(tl("cashiernotallowed"));
        return false
    }
    return true
}

// Handles Google Drive backup file restoration with authentication
function submit_gd_restore() {
    $(document).on("click", "#gd_backuplist .restorefile", function() {
        const field = $(this).parent("li"),
            file = field.text(),
            device = field.attr("data-device");
        if (inj(file)) return
        if (inj(device)) return
        const result = confirm(tl("restorefromdevice", {
            file,
            device
        }));
        if (result) {
            const p = get_auth_status();
            if (p.pass) {
                const file_id = field.attr("data-gdbu_id");
                if (inj(file_id)) return
                const device_id = field.attr("data-device-id");
                if (inj(device_id)) return
                api_proxy({
                    "api_url": "https://www.googleapis.com/drive/v3/files/" + file_id + "?alt=media",
                    "proxy": false,
                    "params": {
                        "method": "GET",
                        "mimeType": "text/plain",
                        "headers": {
                            "Authorization": "Bearer " + p.token
                        }
                    }
                }).done(function(e) {
                    const cb64 = strip_quotes(e),
                        b64 = atob(cb64);
                    if (inj(b64)) return
                    const json = JSON.parse(b64);
                    scan_restore(json);
                    const data = {
                        "jasobj": json,
                        "filename": file,
                        "thisfileid": file_id,
                        "thisdevice": device,
                        "thisdeviceid": device_id,
                        "type": "gd"
                    };
                    restore_algo(data);
                }).fail(function(xhr, stat, err) {
                    console.error("API request failed:", stat, err);
                    if (textStatus === "error") {
                        notify(errorThrown === "Unauthorized" ?
                            tl("unauthorized") : tl("error"));
                    }
                });
            }
        }
    });
}

// Extracts and decodes seed backup data from JSON object
function scan_restore(json) {
    glob_let.resd = {
        "pcnt": 0
    };
    const bpdat = json.bitrequest_bpdat;
    if (bpdat) {
        const can_dec = bpdat.dat ? s_decode(bpdat) :
            bpdat.datenc ? s_decode(bpdat.datenc) : false;
        glob_let.resd.sbu = true;
        glob_let.resd.samebip = (bpdat.id === glob_let.bipid);
        glob_let.resd.bpdat = can_dec;
    }
}

// Determines restoration flow based on seed backup presence and state
function restore_algo(data) {
    const cbu = check_backup(data);
    if (cbu === false) {
        return
    }
    if (glob_let.resd.sbu) {
        if (glob_let.resd.samebip === true) {
            restore_callback(data, false);
        } else if (glob_let.hasbip === true) {
            dphrase_dialog(data);
        } else if (glob_let.resd.bpdat) {
            restore_callback(data, true);
        } else {
            pin_dialog(data, "restore_callback");
        }
    } else {
        restore_callback(data, false);
    }
}

// Routes restoration process to appropriate handler based on backup source
function restore_callback(data, newphrase) {
    const type = data.type;
    if (type) {
        if (type === "gd") {
            restore_callback_gd(data, newphrase);
            return
        }
        if (type === "file") {
            restore_callback_file(data, newphrase);
            return
        }
    }
}

// Decrypts AES-encoded data using PIN hash and validates JSON structure 
function s_decode(pdat, phash) {
    const pin_hash = phash || $("#pinsettings").data("pinhash");
    if (!pin_hash || !pdat) {
        return false
    }
    const key = pin_to_encryption_key(pin_hash, pdat.id),
        decrypt = aes_dec(pdat.dat, key);
    if (!decrypt) {
        return false
    }
    try {
        const cb64 = strip_quotes(decrypt),
            dec = JSON.parse(atob(cb64)),
            pid = dec.pid;
        if (pid) {
            return {
                "dat": cb64,
                "id": pid
            };
        }
    } catch (error) {
        console.error("Error parsing decoded data:", error);
        return false
    }
    return false
}

// Creates PIN entry dialog with timeout handling and callback storage
function pin_dialog(data, cb) {
    canceldialog();
    const settings = $("#pinsettings").data(),
        timeout = settings.timeout;
    if (timeout) {
        const left = timeout - now_utc();
        if (left > 0) {
            lockscreen(timeout);
            return
        }
    }
    const ddat = [{
            "div": {
                "class": "popform",
                "content": [{
                        "input": {
                            "attr": {
                                "type": "password",
                                "value": ""
                            }
                        }
                    },
                    {
                        "input": {
                            "class": "submit",
                            "attr": {
                                "type": "submit",
                                "value": tl("okbttn")
                            }
                        }
                    }
                ]
            }
        }],
        content = $(template_dialog({
            "id": "pindialog",
            "icon": "icon-lock",
            "title": tl("fourdigitpin"),
            "elements": ddat
        })).data({
            "pass_dat": data,
            "cb": cb
        });
    setTimeout(function() {
        popdialog(content, "triggersubmit");
    }, 700);
}

// Validates PIN input and executes appropriate callback based on decryption result
function submit_pin_dialog() {
    $(document).on("click", "#pindialog input.submit", function(e) {
        e.preventDefault();
        const input = $(this).prev("input"),
            value = input.val();
        if (!value.length) {
            popnotify("error", tl("fourdigitpin"));
            return
        }
        const dialog = $("#dialog"),
            pin_data = $("#pindialog").data(),
            pass_dat = pin_data.pass_dat,
            json = pass_dat.jasobj;
        if (!json) {
            return
        }
        const pbdat = json.bitrequest_bpdat,
            pbdat_eq = pbdat.dat ? pbdat : pbdat.datenc,
            can_dec = s_decode(pbdat_eq, generate_hash(value));
        if (can_dec) {
            glob_let.resd.pcnt = 0;
            const callback = pin_data.cb;
            clearpinlock();
            if (callback) {
                glob_let.resd.bpdat = can_dec;
                if (callback === "restore_callback") {
                    restore_callback(pass_dat, true);
                } else if (callback === "bu_oldseed") {
                    bu_oldseed(pass_dat);
                } else if (callback === "cs_callback") {
                    cs_callback(pass_dat);
                }
            }
            notify(tl("success") + "!");
            return
        }
        if (glob_let.resd.pcnt > 1) {
            $("#pinsettings").data("timeout", now_utc() + 300000);
            topnotify(tl("maxattempts"));
            const result = confirm(tl("restorewithoutsecretphrase") + "?");
            if (result === true) {
                restore_callback(pass_dat, false);
            }
            glob_let.resd.pcnt = 0;
            canceldialog();
        } else {
            glob_let.resd.pcnt += 1;
        }
        save_settings();
        shake(dialog);
        input.val("");
    });
}

// Resets address initialization state after successful backup restoration
function restore_cb_init_addresses() {
    br_set_local("tp", now_utc());
    const init = br_get_local("init", true),
        io = get_default_object(init, true);
    delete io.bipv;
    br_set_local("init", io, true);
}

// Executes file-based backup restoration and updates restoration history
function restore_callback_file(data, np) {
    const newphrase = glob_let.hasbip === true ? np : true;
    restore_storage(data.jasobj, newphrase);
    render_settings(["restore", "backup", "pinsettings"]);
    const restore_time = "last restore: " + new Date(now_utc()).toLocaleString(langcode).replace(/\s+/g, "_");
    set_setting("restore", {
        "titlerestore": restore_time,
        "fileused": data.filename,
        "device": "folder-open"
    }, restore_time);
    save_settings("noalert");
    if (newphrase === true) {
        restore_cb_init_addresses();
    }
    reset_changes();
    glob_const.w_loc.href = glob_const.w_loc.pathname + "?p=settings";
}

// Processes Google Drive backup restoration with file cleanup and sync
function restore_callback_gd(data, np) {
    const newphrase = (glob_let.hasbip === true) ? np : true;
    restore_storage(data.jasobj, newphrase);
    render_settings(["restore", "backup", "pinsettings"]);
    const restore_time = "last restore: " + new Date(now_utc()).toLocaleString(langcode).replace(/\s+/g, "_");
    set_setting("restore", {
        "titlerestore": restore_time,
        "fileused": data.filename,
        "device": data.thisdevice
    }, restore_time);
    setTimeout(function() {
        save_settings("noalert");
        create_drive_file();
        if (data.thisdeviceid === glob_const.deviceid) {
            const p = get_auth_status();
            if (p.pass) {
                delete_drive_file(data.thisfileid, null, p.token);
            }
        }
        if (newphrase === true) {
            restore_cb_init_addresses();
        }
        reset_changes();
        setTimeout(function() {
            glob_const.w_loc.href = glob_const.w_loc.pathname + "?p=settings";
        }, 300);
    }, 300);
}

// Displays decision dialog for handling conflicting secret phrases during restore
function dphrase_dialog(data) {
    canceldialog();
    const phrase_backup = tl("usesecretphrasefrombackup"),
        phrase_current = tl("keepcurrentsecretphrase"),
        ddat = [{
                "ul": {
                    "class": "conf_options noselect",
                    "content": "<li><div class='pick_conf'><div class='radio icon-radio-checked2'></div><span>" +
                        phrase_backup + "</span></div></li>\
                   <li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>" +
                        phrase_current + "</span></div></li>"
                },
                "div": {
                    "id": "compare_seeds",
                    "class": "ref",
                    "content": tl("comparesecretphrases")
                }
            },
            {
                "div": {
                    "id": "compare_box",
                    "content": [{
                            "div": {
                                "id": "bu_sbox",
                                "class": "swrap",
                                "content": "<strong>" + tl("secretphrasefrombackup") +
                                    "</strong><div class='sbox'></div>"
                            }
                        },
                        {
                            "div": {
                                "id": "ext_sbox",
                                "class": "swrap",
                                "content": "<strong>" + tl("currentsecretphrase") +
                                    "</strong><div class='sbox'></div>"
                            }
                        }
                    ]
                }
            },
            {
                "div": {
                    "class": "popform",
                    "content": [{
                            "input": {
                                "attr": {
                                    "type": "hidden",
                                    "value": phrase_backup
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn")
                                }
                            }
                        }
                    ]
                }
            }
        ],
        content = $(template_dialog({
            "id": "importseedbox",
            "title": "<span class='icon-warning' style='color:#B33A3A'></span>" +
                tl("differentsecretphrase"),
            "elements": ddat
        })).data(data);
    setTimeout(function() {
        popdialog(content, "triggersubmit");
    }, 700);
}

// Processes user choice between backup and current secret phrases
function submit_dphrase() {
    $(document).on("click", "#importseedbox input.submit", function(e) {
        e.preventDefault();
        const input = $(this).prev("input"),
            value = input.val();
        if (value === tl("usesecretphrasefrombackup")) {
            restore_bu_seed();
        } else if (value === tl("keepcurrentsecretphrase")) {
            keep_current_seed();
        }
    });
}

// Confirms and executes retention of current seed during restore process
function keep_current_seed() {
    const result = confirm(tl("keepexistingsecretphrase"));
    if (result) {
        const dialog = $("#importseedbox"),
            data = dialog.data();
        restore_callback(data, false);
    }
}

// Initiates backup seed restoration with PIN verification
function restore_bu_seed() {
    const dialog = $("#importseedbox"),
        budat = dialog.data();
    if (!glob_let.resd.bpdat && !dialog.hasClass("verified")) {
        pin_dialog(budat, "bu_oldseed");
        return
    }
    bu_oldseed(budat);
}

// Manages seed replacement workflow with phrase verification
function bu_oldseed(bu_dat) {
    canceldialog();
    manage_bip32({
        "type": "restore",
        "dat": bu_dat
    });
    const phrase = ls_phrase_obj(),
        words = phrase.pob;
    verify_phrase(words, 4);
    $("#seed_steps").removeClass("checked");
    $("#seed_step3").addClass("replace");
    seed_nav(3);
}

// Toggles seed comparison view with PIN verification for backup seed
function compare_seeds() {
    $(document).on("click", "#compare_seeds", function() {
        const box = $("#compare_box");
        if (box.is(":visible")) {
            box.slideUp(200);
            return
        }
        const seedtext = $("#ext_sbox .sbox").text();
        if (seedtext.length < 20) {
            const dialog = $("#importseedbox"),
                budat = dialog.data(),
                jas = budat.jasobj;
            if (jas) {
                const pbdat = jas.bitrequest_bpdat,
                    pbeq = pbdat.dat ? pbdat : pbdat.datenc;
                if (pbeq && !glob_let.resd.bpdat) {
                    const pin = prompt(tl("fourdigitpin")),
                        decoded = s_decode(pbeq, generate_hash(pin));
                    if (decoded) {
                        glob_let.resd.bpdat = decoded;
                        dialog.addClass("verified");
                        cs_callback(true)
                    } else {
                        popnotify("error", tl("wrongpin"));
                        shake(dialog);
                    }
                    return
                }
            }
            cs_callback();
            return
        }
        box.slideDown(200);
    })
}

// Prepares seed data for comparison display with PIN verification
function cs_callback(pass) {
    const current = ls_phrase_obj(),
        backup = ls_phrase_obj_parsed(glob_let.resd.bpdat),
        compare = {
            "s1": current.pob.slice(0, 3),
            "s2": backup.pob.slice(0, 3)
        };
    if (pass === true) {
        compare_seeds_callback(compare);
        return
    }
    all_pinpanel({
        "func": compare_seeds_callback,
        "args": compare
    }, true)
}

// Renders truncated seed phrases comparison in UI
function compare_seeds_callback(compare) {
    $("#ext_sbox .sbox").text(compare.s1.join(" ") + " ...");
    $("#bu_sbox .sbox").text(compare.s2.join(" ") + " ...");
    $("#compare_box").slideDown(200);
}

// Transfers data from JSON backup to localStorage with optional seed phrase handling
function restore_storage(jsonobject, newphrase) {
    $.each(jsonobject, function(key, value) {
        if (key === "bitrequest_bpdat") {
            if (glob_let.test_derive && newphrase === true && glob_let.resd.bpdat) {
                localStorage.setItem(key, JSON.stringify(glob_let.resd.bpdat));
            }
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    });
    localStorage.removeItem("bitrequest_cashier");
    localStorage.removeItem("bitrequest_teamid");
    glob_let.resd = {};
}

// ** ADVANCED: **

// ** Export CSV: **

// Opens CSV export configuration dialog with customizable data filters
function csvexport_trigger() {
    $(document).on("click", "#csvexport", function() {
        const requests = br_get_local("requests", true),
            archive = br_get_local("archive", true),
            has_requests = requests && !empty_obj(requests),
            has_archive = archive && !empty_obj(archive);
        if (has_requests || has_archive) {
            const filename = "bitrequest_csv_export_" + new Date(now_utc()).toLocaleString(langcode).replace(/\s+/g, "_").replace(/:/g, "_") + ".csv",
                show_archive = has_requests ? "false" : "true",
                content = "<div class='formbox' id='exportcsvbox'>\
                    <h2 class='icon-table'>" + tl("csvexport") + "</h2>\
                    <div class='popnotify'></div>\
                    <div id='ad_info_wrap'>\
                        <ul id='ecsv_options'>\
                            <li class='escv_heading'>\
                                <strong>Info</strong>\
                            </li>\
                            <li id='escv_from'>\
                                <span>" + tl("from") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_desc'>\
                                <span>" + tl("title") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_address'>\
                                <span>" + tl("receivingaddress") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li class='escv_heading'>\
                                <strong>" + tl("status") + "</strong>\
                            </li>\
                            <li id='escv_paid'>\
                                <span>" + tl("paid") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_ins'>\
                                <span>" + tl("insufficient") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_new'>\
                                <span>" + tl("new") + "</span><div class='switchpanel false global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_pending'>\
                                <span>" + tl("pending") + "</span><div class='switchpanel false global'><div class='switch'></div></div>\
                            </li>\
                            <li class='escv_heading'>\
                                <strong>" + tl("type") + "</strong>\
                            </li>\
                            <li id='escv_pos'>\
                                <span>" + tl("point of sale") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_outgoing'>\
                                <span>" + tl("outgoing") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_incoming'>\
                                <span>" + tl("incoming") + "</span><div class='switchpanel false global'><div class='switch'></div></div>\
                            </li>\
                            <li class='noline'>\
                                <strong></strong>\
                            </li>\
                            <li id='escv_archive'>\
                                <span>" + tl("includearchive") + "</span><div class='switchpanel global " + show_archive + "'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_receipt'>\
                                <span>" + tl("includereceipt") + " (PDF download)</span><div class='switchpanel false global'><div class='switch'></div></div>\
                            </li>\
                        </ul>\
                    </div>\
                    <div id='dialogcontent'>\
                        <div id='custom_actions'>\
                            <br/>\
                            <a href='' download='" + filename + "' title='" + filename + "' id='trigger_csvexport' class='button icon-download' download>DOWNLOAD</a>\
                        </div>\
                    </div>\
                </div>\
                <div id='backupactions'>\
                    <div id='share_csv' data-url='' class='util_icon icon-share2'></div>\
                    <div id='backupcd'>" + cancelbttn + "</div>\
                </div>";
            popdialog(content, "triggersubmit", null, true);
            return
        }
        play_audio("funk");
        notify(tl("nocsvexports"));
    });
}

// Processes CSV file download with iOS compatibility check and user confirmation
function submit_csvexport() {
    $(document).on("click", "#trigger_csvexport", function(e) {
        const btn = $(this),
            csv = complile_csv(),
            dataurl = "data:text/csv;charset=utf-16le;base64," + csv;
        btn.attr("href", dataurl);
        const title = btn.attr("title"),
            result = confirm(tl("downloadfile", {
                "file": title
            }));
        if (result === false) {
            e.preventDefault();
            return
        }
        canceldialog();
        notify(tl("downloaded", {
            "file": "CSV"
        }));
    });
}

// Generates base64 encoded CSV data based on selected export filters
function complile_csv() {
    const requests = br_get_local("requests", true),
        archive = br_get_local("archive", true),
        has_archive = archive && !empty_obj(archive),
        csv_arr = [],
        options = $("#exportcsvbox #ecsv_options"),
        opt = {
            "from": options.find("li#escv_from .switchpanel"),
            "desc": options.find("li#escv_desc .switchpanel"),
            "address": options.find("li#escv_address .switchpanel"),
            "paid": options.find("li#escv_paid .switchpanel"),
            "ins": options.find("li#escv_ins .switchpanel"),
            "new": options.find("li#escv_new .switchpanel"),
            "pending": options.find("li#escv_pending .switchpanel"),
            "pos": options.find("li#escv_pos .switchpanel"),
            "outgoing": options.find("li#escv_outgoing .switchpanel"),
            "incoming": options.find("li#escv_incoming .switchpanel"),
            "receipt": options.find("li#escv_receipt .switchpanel"),
            "archive": options.find("li#escv_archive .switchpanel")
        },
        include = {
            "from": opt.from.hasClass("true"),
            "desc": opt.desc.hasClass("true"),
            "address": opt.address.hasClass("true"),
            "paid": opt.paid.hasClass("true"),
            "ins": opt.ins.hasClass("true"),
            "new": opt.new.hasClass("true"),
            "pending": opt.pending.hasClass("true"),
            "pos": opt.pos.hasClass("true"),
            "outgoing": opt.outgoing.hasClass("true"),
            "incoming": opt.incoming.hasClass("true"),
            "receipt": opt.receipt.hasClass("true"),
            "archive": opt.archive.hasClass("true")
        },
        reqobj = has_archive && include.archive ? requests.concat(archive) : requests;
    $.each(reqobj, function(i, val) {
        const csv = {},
            payment = val.payment,
            address = val.address,
            amount = val.amount,
            uoa = val.uoa,
            status = val.status,
            txhash = val.txhash || "",
            lnhash = txhash && txhash.slice(0, 9) === "lightning",
            lightning = val.lightning,
            hybrid = lightning && lightning.hybrid === true,
            lnstr = lnhash ? "lightning⚡️" : "",
            rqname = val.requestname || "",
            desc = val.requesttitle || "",
            type = val.requesttype,
            requestdate = val.requestdate,
            timestamp = val.timestamp,
            created_time = requestdate || timestamp,
            received = val.receivedamount,
            ccsymbol = val.currencysymbol,
            fiatval = val.fiatvalue,
            fiatcur = val.fiatcurrency,
            pts = val.paymenttimestamp || timestamp,
            pdfurl = get_pdf_url(val),
            paid_time = pts ? short_date(pts) : "",
            layer = val.eth_layer2,
            network = layer || lnstr,
            netstr = network || "";
        if (should_include_request(status, type, include.paid, include.ins, include.new, include.pending, include.pos, include.outgoing, include.incoming)) {
            if (include.from) {
                csv[transclear("from")] = rqname;
            }
            if (include.desc) {
                csv[transclear("title")] = desc;
            }
            csv[transclear("currency")] = payment;
            csv[transclear("status")] = transclear(status);
            csv[transclear("network")] = netstr;
            const rqtype = type === "local" ? "point of sale" : type;
            csv[transclear("type")] = transclear(rqtype);
            csv[transclear("created")] = short_date(created_time);
            csv[transclear("amount")] = amount + " " + uoa;
            const rval = received ? received + " " + ccsymbol : "",
                paidrecv = type === "incoming" ? transclear("paid") : transclear("received"),
                pttitle = transclear("amount") + " " + transclear("received") + " / " + transclear("paid"),
                fiatstr = fiatval ? fiatval.toFixed(2) + " " + fiatcur : "";
            csv[pttitle] = rval + " (" + paidrecv + ")";
            csv[transclear("fiatvalue")] = fiatstr;
            csv[transclear("paidon")] = paid_time;
            if (include.address) {
                csv[transclear("receivingaddress")] = address;
            }
            csv.txhash = txhash;
            if (include.receipt) {
                csv["PDF download (" + transclear("receipt") + ")"] = pdfurl;
            }
            csv_arr.push(csv);
        }
    });
    const csv_body = render_csv(csv_arr);
    return btoa(unescape(encodeURIComponent(csv_body)));
}

// Filters requests based on status and type according to user preferences
function should_include_request(status, type, incl_paid, incl_ins, incl_new, incl_pending, incl_pos, incl_outgoing, incl_incoming) {
    if (!incl_paid && status === "paid") return false
    if (!incl_ins && status === "insufficient") return false
    if (!incl_new && status === "new") return false
    if (!incl_pending && status === "pending") return false
    if (!incl_pos && type === "local") return false
    if (!incl_outgoing && type === "outgoing") return false
    if (!incl_incoming && type === "incoming") return false
    return true
}

// Converts array of objects into CSV formatted string with headers
function render_csv(arr) {
    const headers = [],
        inner_headers = [],
        body = [];
    $.each(arr[0], function(key, value) {
        inner_headers.push(key);
    });
    headers.push(inner_headers.join(","));
    $.each(arr, function(i, val) {
        const inner_body = [];
        $.each(val, function(key, value) {
            const cell = value.replace(/,/g, ".");
            inner_body.push(cell);
        });
        body.push(inner_body.join(","));
    });
    const doc = headers.concat(body);
    return doc.join("\n");
}

// Uploads CSV data to server for sharing with cloud storage integration
function share_csv() {
    $(document).on("click", "#share_csv", function() {
        const csv = complile_csv(),
            result = confirm(tl("sharecsvexport"));
        if (result) {
            loader(true);
            set_loader_text(tl("generatebu"));
            const account = btoa($("#accountsettings").data("selected")),
                csv_hash = sha_sub(csv, 10),
                time_format = new Date(now_utc()).toLocaleString(langcode),
                title = "CSV Export " + account + " (" + time_format + ")",
                cached_short_url = get_saved_shorturl(csv_hash);
            if (cached_short_url) {
                share_request(cached_short_url, title);
                return
            }
            api_proxy({
                "custom": "system_bu",
                "api_url": "x", // dummy value, don't remove
                "proxy": true,
                "params": {
                    "url": csv,
                    account
                }
            }).done(function(e) {
                const ro = q_obj(e, "ping.br_cache.filename");
                if (ro) {
                    const proxy = c_proxy(),
                        data = btoa(JSON.stringify({
                            ro,
                            proxy
                        })),
                        app_root = glob_const.approot;
                    shorten_url(title, app_root + "?csv=" + data, fetch_aws("img_system_backup.png"), true, csv_hash);
                }
            }).fail(function(xhr, stat, err) {
                closeloader();
            });
        }
    });
}

// Validates and processes shared CSV export with expiration handling  
function check_csvexport(csv) {
    const rdata = stripb64(csv),
        roid = rdata.ro,
        rproxy = rdata.proxy;
    api_proxy({
        "custom": "get_system_bu",
        "api_url": "x", // dummy value, don't remove
        "proxy": true,
        "params": roid
    }, rproxy).done(function(e) {
        const ping = e.ping;
        if (ping) {
            const cache = ping.br_cache,
                servertime = cache.utc_timestamp,
                filetime = cache.created_utc,
                timestamp = filetime ? filetime * 1000 : now_utc(),
                timestr = new Date(timestamp).toLocaleString(langcode),
                result = ping.br_result,
                base64 = result.base64,
                account = atob(result.account),
                title = "CSV Export " + account + " (" + timestr + ")",
                budate = timestr.replace(/\s+/g, "_").replace(/\:/g, "_"),
                cachetime = cache.cache_time,
                expires = (filetime + cachetime) - servertime,
                filename = "bitrequest_csv_export_" + encodeURIComponent(account) + "_" + budate + ".csv",
                cd = countdown(expires * 1000),
                cdstr = countdown_format(cd),
                expstr = cdstr ? tl("expiresin") + " " + cdstr : tl("fileexpired"),
                ddat = [{
                    "div": {
                        "id": "dialogcontent",
                        "content": [{
                                "h1": {
                                    "content": title
                                },
                                "div": {
                                    "class": "error",
                                    "attr": {
                                        "style": "margin-top:1em;padding:0.3em 1em"
                                    },
                                    "content": expstr
                                }
                            },
                            {
                                "div": {
                                    "id": "changelog",
                                    "content": [{
                                        "div": {
                                            "id": "custom_actions",
                                            "content": [{
                                                "br": {
                                                    "close": true
                                                },
                                                "a": {
                                                    "id": "trigger_csvdownload",
                                                    "class": "button icon-download",
                                                    "attr": {
                                                        "href": "data:text/json;charset=utf-16le;base64," + base64,
                                                        "download": filename,
                                                        "title": filename,
                                                        "data-date": budate,
                                                        "data-lastbackup": filename
                                                    },
                                                    "content": "DOWNLOAD CSV"
                                                }
                                            }]
                                        }
                                    }]
                                }
                            }
                        ]
                    }
                }],
                content = template_dialog({
                    "id": "system_backupformbox",
                    "icon": "icon-download",
                    "title": tl("csvexport"),
                    "elements": ddat
                }) + "<div id='backupactions'><div id='backupcd'>" + cancelbttn + "</div></div>";
            popdialog(content, "triggersubmit", null, true);
            return
        }
        systembu_expired();
    }).fail(function(xhr, stat, err) {
        systembu_expired();
    });
}

// Handles CSV download with platform checks and user notifications
function submit_csvdownload() {
    $(document).on("click", "#trigger_csvdownload", function(e) {
        const btn = $(this),
            href = btn.attr("href"),
            title = btn.attr("title"),
            result = confirm(tl("downloadfile", {
                "file": title
            }));
        if (result === false) {
            e.preventDefault();
            return false
        }
        canceldialog();
        notify(tl("downloaded", {
            "file": "CSV"
        }));
    })
}

// ** URL Shortener: **

// Displays URL shortener configuration dialog with Bitly and Custom options
function urlshortener() {
    $(document).on("click", "#url_shorten_settings", function() {
        const settings = $("#url_shorten_settings"),
            data = settings.data(),
            source = data.selected,
            val = source == "inactive" ? "bitly" : source,
            fb_key = data.fbapikey || "",
            bitly_token = data.bitly_at || "",
            active = data.us_active,
            is_active = active === "active",
            form_class = is_active ? "" : " hide",
            bitly_class = val === "bitly" ? "" : " hide",
            header_icon = val === "bitly" ? "icon-bitly" : "",
            ddat = [{
                    "div": {
                        "id": "toggle_urlshortener",
                        "class": "clearfix",
                        "content": "<h3 class='" + header_icon + "'>" + tl("enable") + " " + tl("url_shorten_settings") + switch_panel(is_active, " global") + "</h3>"
                    }
                },
                {
                    "div": {
                        "class": "popform" + form_class,
                        "attr": {
                            "data-currentapi": val
                        },
                        "content": [{
                                "div": {
                                    "class": "selectbox",
                                    "content": [{
                                            "input": {
                                                "attr": {
                                                    "type": "text",
                                                    "value": val,
                                                    "placeholder": tl("choose") + " " + tl("url_shorten_settings"),
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
                                                "content": "<span data-pe='none'>bitly</span><span data-pe='none'>" + d_proxy() + "</span>"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "input": {
                                    "class": "bitly_api_input" + bitly_class,
                                    "attr": {
                                        "type": "text",
                                        "value": bitly_token,
                                        "placeholder": "Bitly " + tl("apikey"),
                                        "data-apikey": bitly_token,
                                        "data-checkchange": bitly_token
                                    }
                                }
                            },
                            {
                                "input": {
                                    "class": "submit",
                                    "attr": {
                                        "type": "submit",
                                        "value": tl("okbttn")
                                    }
                                }
                            }
                        ]
                    }
                }
            ],
            content = template_dialog({
                "id": "usformbox",
                "icon": "icon-link",
                "title": tl("choose") + " " + tl("url_shorten_settings"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

// Manages URL shortener state transitions and form visibility
function toggle_url_shortener() {
    $(document).on("mouseup", "#toggle_urlshortener .switchpanel", function(e) {
        const panel = $(this),
            form = $("#usformbox .popform");
        let state,
            title;
        if (panel.hasClass("true")) {
            const input = form.find("input:first"),
                value = input.val();
            if (inj(value)) return
            state = "active";
            title = value;
            form.slideDown(300);
        } else {
            const result = confirm(tl("disableshorturls"));
            if (result) {
                state = "inactive";
                title = "inactive";
                form.slideUp(300);
            } else {
                panel.addClass("true").removeClass("false");
                e.preventDefault();
                return
            }
        }
        set_setting("url_shorten_settings", {
            "selected": title,
            "us_active": state
        }, title);
        save_settings();
        panel.addClass("us_changed");
    })
}

// Updates UI elements based on selected URL shortening service
function pick_urlshortener_select() {
    $(document).on("mousedown", "#usformbox .selectbox > .options span", function() {
        const select = $(this),
            val = select.text(),
            form = select.closest(".popform"),
            bitly_input = form.find("input.bitly_api_input"),
            header = $("#usformbox h3");
        if (val === "bitly") {
            bitly_input.removeClass("hide");
            header.attr("class", "icon-bitly");
        } else {
            bitly_input.addClass("hide");
            header.attr("class", "");
        }
    })
}

// Validates and saves URL shortener configuration with API key verification
function submit_urlshortener_select() {
    $(document).on("click", "#usformbox input.submit", function(e) {
        e.preventDefault();
        const form = $(this).closest(".popform"),
            curapi = form.attr("data-currentapi"),
            input = form.find("input:first"),
            val = input.val();
        if (inj(val)) return
        const bitly_input = form.find("input.bitly_api_input"),
            bitly_val = bitly_input.val();
        if (inj(bitly_val)) return
        const bitly_check = bitly_input.attr("data-checkchange"),
            toggle = $("#toggle_urlshortener .switchpanel");
        if (val === curapi && bitly_check === bitly_val && !toggle.hasClass("us_changed")) {
            canceldialog();
            return
        }
        const is_active = toggle.hasClass("true");
        if (val !== curapi || toggle.hasClass("us_changed")) {
            const state = is_active ? "active" : "inactive",
                title = is_active ? val : "inactive";
            set_setting("url_shorten_settings", {
                "selected": title,
                "us_active": state
            }, title);
        }
        if (is_active) {
            const cur_bitly = bitly_input.attr("data-apikey");
            if (bitly_val !== cur_bitly) {
                if (bitly_check === bitly_val) {
                    popnotify("error", tl("validateapikey"));
                    return
                }
                bitly_input.attr("data-checkchange", bitly_val);
                validate_api_key("bitly", bitly_val, true)
                return
            }
        }
        canceldialog();
        notify(tl("datasaved"));
        save_settings();
    })
}

// ** Cryptocurrency price data: **

// Opens cryptocurrency price API configuration dialog with provider selection
function configure_crypto_api() {
    $(document).on("click", "#cmcapisettings", function() {
        const settings = $("#cmcapisettings").data(),
            apisrc = settings.selected,
            apikey = settings.cmcapikey,
            keyval = settings.cmcapikey || "",
            keyclass = apisrc === "coinmarketcap" ? "" : "hide",
            options = "<span data-pe='none'>" + glob_config.apilists.crypto_price_apis.join("</span><span data-pe='none'>") + "</span>",
            ddat = [{
                "div": {
                    "class": "popform",
                    "attr": {
                        "data-currentapi": apisrc
                    },
                    "content": [{
                            "div": {
                                "class": "selectbox",
                                "content": [{
                                        "input": {
                                            "attr": {
                                                "type": "text",
                                                "value": apisrc,
                                                "placeholder": "Choose API",
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
                                            "content": options
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "input": {
                                "class": keyclass,
                                "attr": {
                                    "type": "text",
                                    "value": keyval,
                                    "placeholder": tl("apikey"),
                                    "data-apikey": keyval,
                                    "data-checkchange": apikey
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "ccapiformbox",
                "icon": "icon-stats-dots",
                "title": tl("cmcapisettings"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

// Toggles CoinMarketCap API key input field visibility based on provider selection
function select_crypto_api() {
    $(document).on("mousedown", "#ccapiformbox .selectbox > .options span", function() {
        const select = $(this),
            val = select.text(),
            form = select.closest(".popform"),
            input = form.find("input:nth-child(2)");
        if (val === "coinmarketcap") {
            input.removeClass("hide");
        } else {
            input.addClass("hide");
        }
    })
}

// Processes cryptocurrency API settings with key validation and persistence
function save_crypto_api_settings() {
    $(document).on("click", "#ccapiformbox input.submit", function(e) {
        e.preventDefault();
        const form = $(this).closest(".popform"),
            curapi = form.attr("data-currentapi"),
            input = form.find("input:first"),
            val = input.val();
        if (inj(val)) return
        const api_input = form.find("input:nth-child(2)"),
            apival = api_input.val();
        if (inj(apival)) return
        const check = api_input.attr("data-checkchange");
        if (val === curapi && check === apival) {
            canceldialog();
            return
        }
        if (val !== curapi) {
            set_setting("cmcapisettings", {
                "selected": val
            }, val);
        }
        if (apival !== api_input.attr("data-apikey")) {
            if (check === apival) {
                popnotify("error", tl("validateapikey"));
                return
            }
            api_input.attr("data-checkchange", apival);
            validate_api_key("coinmarketcap", apival, true);
            return
        }
        canceldialog();
        notify(tl("datasaved"));
        save_settings();
    })
}

// ** FIAT price data: **

// Renders fiat exchange rate API configuration dialog with Fixer integration
function configure_fiat_api() {
    $(document).on("click", "#fiatapisettings", function() {
        const data = $(this).data(),
            apisrc = data.selected,
            apikey = data.fxapikey || "",
            options = "<span data-pe='none'>" + glob_config.apilists.fiat_price_apis.join("</span><span data-pe='none'>") + "</span>",
            keyclass = apisrc === "fixer" ? "" : "hide",
            ddat = [{
                "div": {
                    "class": "popform",
                    "attr": {
                        "data-currentapi": apisrc
                    },
                    "content": [{
                            "div": {
                                "class": "selectbox",
                                "content": [{
                                        "input": {
                                            "attr": {
                                                "type": "text",
                                                "value": apisrc,
                                                "placeholder": "Choose API",
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
                                            "content": options
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "input": {
                                "class": keyclass,
                                "attr": {
                                    "type": "text",
                                    "value": apikey,
                                    "placeholder": tl("apikey"),
                                    "data-apikey": apikey,
                                    "data-checkchange": apikey
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "fiatxrapiformbox",
                "icon": "icon-stats-bars",
                "title": tl("fiatapisettings"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

// Toggles Fixer API key input visibility based on provider selection
function select_fiat_api() {
    $(document).on("mousedown", "#fiatxrapiformbox .selectbox > .options span", function() {
        const select = $(this),
            val = select.text(),
            form = select.closest(".popform"),
            input = form.find("input:nth-child(2)");
        if (val === "fixer") {
            input.removeClass("hide");
        } else {
            input.addClass("hide");
        }
    })
}

// Validates and persists fiat exchange rate API settings with key verification
function save_fiat_api_settings() {
    $(document).on("click", "#fiatxrapiformbox input.submit", function(e) {
        e.preventDefault();
        const form = $(this).closest(".popform"),
            curapi = form.attr("data-currentapi"),
            input = form.find("input:first"),
            val = input.val();
        if (inj(val)) return
        const api_input = form.find("input:nth-child(2)"),
            apival = api_input.val();
        if (inj(apival)) return
        const check = api_input.attr("data-checkchange");
        if (val === curapi && check === apival) {
            canceldialog();
            return
        }
        if (val !== curapi) {
            set_setting("fiatapisettings", {
                "selected": val
            }, val);
        }
        if (apival !== api_input.attr("data-apikey")) {
            if (check === apival) {
                popnotify("error", tl("validateapikey"));
                return false
            }
            api_input.attr("data-checkchange", apival);
            validate_api_key("fixer", apival, true);
            return
        }
        canceldialog();
        notify(tl("datasaved"));
        save_settings();
    })
}

// ** API Proxy: **

// Redirects to API proxy configuration dialog
function trigger_proxy_dialog() {
    $(document).on("click", "#proxy_dialog", function() {
        canceldialog();
        setTimeout(function() {
            $("#api_proxy").trigger("click");
        }, 700);
    })
}

// Displays proxy configuration dialog with available servers and custom proxy input
function pick_api_proxy() {
    $(document).on("click", "#api_proxy", function() {
        const proxies = all_proxies("display"),
            proxy = d_proxy(),
            content = "\
           <div class='formbox' id='proxyformbox'>\
               <h2 class='icon-sphere'>API Proxy</h2>\
               <div class='popnotify'></div>\
               <div class='popform validated'>\
                   <div class='selectbox'>\
                       <input type='text' value='" + proxy + "' placeholder='https://...' id='proxy_select_input' readonly='readonly'/>\
                       <div class='selectarrows icon-menu2' data-pe='none'></div>\
                       <div class='options'></div>\
                   </div>\
                   <div id='rpc_input_box'>\
                       <h3 class='icon-plus'>" + tl("addapiproxy") + "</h3>\
                       <div id='proxy_info'>" + tl("controlyourkeys") + "<br/><br/>\
                           <strong>1.</strong> " + tl("proxystep1") + "<br/>\
                           <strong>2.</strong> " + tl("proxystep2") + "<br/>\
                           <strong>3.</strong> " + tl("proxystep3") + "<br/><br/>\
                       </div>\
                       <div id='rpc_input'>\
                           <input type='text' value='' placeholder='https://...' id='proxy_url_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                           <div class='c_stat icon-wifi-off'></div>\
                           <div class='c_stat icon-connection'></div>\
                       </div>\
                   </div>\
                   <input type='submit' class='submit' value='" + tl("okbttn") + "'/>\
               </div>\
           </div>";
        popdialog(content, "triggersubmit");
        if (glob_const.phpsupport === true) {
            const protocol = glob_let.localserver ? glob_const.w_loc.protocol + "//" : "",
                port = glob_const.w_loc.port,
                portstr = port.length ? ":" + port : "",
                url = complete_url(protocol + glob_const.thishostname + portstr + location.pathname),
                proxy_object = {
                    "proxy": url,
                    "display": true,
                    "tor": false
                }
            if ($.inArray(proxy_object, proxies) === -1) {
                proxies.push(proxy_object);
            }
        }
        if ($.inArray(glob_const.hosted_proxy, proxies) === -1) {
            proxies.push(glob_const.hosted_proxy);
        }
        const options = $("#proxyformbox").find(".options");
        $.each(proxies, function(key, value) {
            const selected = (value === proxy),
                dfault = objectkey_in_array(glob_const.proxy_list, "proxy", value.proxy);
            test_append_proxy(options, key, value, selected, dfault);
        });
    })
}

// Validates proxy endpoint availability via API ping test
function test_append_proxy(options, key, value, selected, dfault) {
    const proxy = value.proxy;
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy + "/proxy/v1/ln/api/",
        "data": {
            "ping": true
        }
    }).done(function(e) {
        const result = br_result(e);
        if (result.result === "pong") {
            proxy_option_li(options, true, key, value, selected, dfault);
            return
        }
        proxy_option_li(options, false, key, value, selected, dfault);
    }).fail(function(xhr, stat, err) {
        proxy_option_li(options, false, key, value, selected, dfault);
    });
}

// Renders proxy option with online status indicator and delete button  
function proxy_option_li(options, live, key, value, selected, dfault) {
    const proxy = value.proxy,
        status = live ? " live" : " offline",
        tor = value.tor ? "<div class='opt_icon c_stat icon-tor' title='TOR support' data-pe='none'></div>" : "",
        def = dfault ? " default" : "",
        option = $("<div class='optionwrap" + status + def + "' style='display:none' data-pe='none'><span data-value='" + proxy + "' data-pe='none'><span class='cstat'>•</span> " + proxy + "</span><div class='opt_icon_box' data-pe='none'>" + tor + "<div class='opt_icon icon-bin' data-pe='none'></div></div>");
    options.append(option);
    option.slideDown(500);
}

// Validates and saves proxy configuration changes
function submit_proxy() {
    $(document).on("click", "#proxyformbox input.submit", function(e) {
        e.preventDefault();
        const form = $("#proxyformbox"),
            selectval = form.find("#proxy_select_input").val(),
            customval = form.find("#proxy_url_input").val();
        if (inj(selectval)) return
        if (inj(customval)) return
        if (customval.length) {
            test_custom_proxy(customval);
            return
        }
        const proxy = c_proxy();
        if (selectval === proxy) {
            canceldialog();
            return
        }
        set_setting("api_proxy", {
            "selected": selectval
        }, selectval);
        canceldialog();
        notify(tl("datasaved"));
        save_settings();
    })
}

// Clears custom proxy input when selecting from predefined options
function hide_custom_proxy_field() {
    $(document).on("click", "#proxyformbox .selectarrows", function() {
        const form = $("#proxyformbox"),
            options = form.find(".options .optionwrap"),
            selectval = form.find("#proxy_select_input").val(),
            input = form.find("#proxy_url_input");
        options.each(function() {
            const opt = $(this),
                val = opt.find("> span").attr("data-value");
            if (val === selectval) {
                opt.hide();
            } else {
                opt.show();
            }
        });
        input.val("");
    });
}

// Validates custom proxy URL with server capability check
function test_custom_proxy(value) {
    const node = $("#api_proxy"),
        data = node.data(),
        proxies = data.custom_proxies,
        proxy = complete_url(value);
    if (objectkey_in_array(glob_const.proxy_list, "proxy", proxy) || objectkey_in_array(proxies, "proxy", proxy)) {
        popnotify("error", tl("proxyexists"));
        return
    }
    if (proxy.indexOf("http") > -1) {
        $.ajax({
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy + "/proxy/v1/",
            "data": {
                "custom": "add",
                "api_url": "x" // dummy value, don't remove
            }
        }).done(function(e) {
            const result = br_result(e),
                resp = result.result;
            if (resp) {
                const error = resp.error;
                if (error) {
                    const msg = error.message;
                    if (msg && msg === "no write acces") {
                        popnotify("error", tl("folderpermissions"));
                        return
                    }
                }
                if (resp.custom === "add") {
                    const tor = q_obj(e, "ping.tor"),
                        display = true,
                        proxy_object = {
                            proxy,
                            display,
                            tor
                        }
                    proxies.push(proxy_object);
                    set_setting("api_proxy", {
                        "selected": proxy_object.proxy,
                        "custom_proxies": proxies
                    }, proxy);
                    canceldialog();
                    notify(tl("datasaved"));
                    save_settings();
                    setTimeout(function() {
                        $("#apikeys").trigger("click");
                    }, 800);
                    return
                }
            }
            popnotify("error", tl("unabletopost", {
                "fixed_url": proxy
            }));
        }).fail(function(xhr, stat, err) {
            popnotify("error", tl("unabletoconnect"));
        });
        return
    }
    popnotify("error", tl("invalidurl"));
}

// Deletes custom proxy with confirmation and default proxy protection
function remove_proxy() {
    $(document).on("click", "#proxyformbox .options .opt_icon_box .icon-bin", function(e) {
        e.preventDefault();
        const node = "api_proxy",
            proxies = get_setting(node, "custom_proxies");
        if (proxies.length > 0) {
            const opt = $(this).closest(".optionwrap");
            if (opt.hasClass("default")) {
                play_audio("funk");
                topnotify(tl("removedefaultnode"));
                return
            }
            const val = opt.find("> span").attr("data-value"),
                result = confirm(tl("confirmremovenode", {
                    "thisval": val
                }));
            if (result) {
                const filtered = $.grep(proxies, function(value) {
                    return value.proxy !== val;
                });
                opt.slideUp(500, function() {
                    $(this).remove();
                });
                set_setting(node, {
                    "custom_proxies": filtered
                });
                notify(tl("proxyremoved"));
                save_settings();
            }
        }
    })
}

// ** API Keys: **

// Opens API key management interface with current key values 
function apikeys() {
    $(document).on("click", "#apikeys", function() {
        const data = $(this).data(),
            keys = {
                "alchemy": data.alchemy || "",
                "bitly": data.bitly || "",
                "blockchair": data.blockchair || "",
                "blockcypher": data.blockcypher || "",
                "cmc": data.coinmarketcap || "",
                "currencylayer": data.currencylayer || "",
                "etherscan": data.etherscan || "",
                "ethplorer": data.ethplorer || "",
                "exchangerates": data.exchangeratesapi || "",
                "fixer": data.fixer || "",
                "infura": data.infura || ""
            },
            keyph = tl("apikey"),
            content = "\
           <div class='formbox' id='apikeyformbox'>\
               <h2 class='icon-key'>" + tl("apikeys") + "</h2>\
               <div class='popnotify'></div>\
               <div class='popform'>\
                   <h3>Alchemy</h3>\
                   <input type='text' value='" + keys.alchemy + "' placeholder='Alchemy " + keyph + "' data-ref='alchemy' data-checkchange='" + keys.alchemy + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Bitly</h3>\
                   <input type='text' value='" + keys.bitly + "' placeholder='Bitly access token' data-ref='bitly' data-checkchange='" + keys.bitly + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Blockchair</h3>\
                   <input type='text' value='" + keys.blockchair + "' placeholder='Blockchair " + keyph + "' data-ref='blockchair' data-checkchange='" + keys.blockchair + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Blockcypher</h3>\
                   <input type='text' value='" + keys.blockcypher + "' placeholder='Blockcypher " + keyph + "' data-ref='blockcypher' data-checkchange='" + keys.blockcypher + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Coinmarketcap</h3>\
                   <input type='text' value='" + keys.cmc + "' placeholder='Coinmarketcap " + keyph + "' data-ref='coinmarketcap' data-checkchange='" + keys.cmc + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Currencylayer</h3>\
                   <input type='text' value='" + keys.currencylayer + "' placeholder='Currencylayer " + keyph + "' data-ref='currencylayer' data-checkchange='" + keys.currencylayer + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Etherscan</h3>\
                   <input type='text' value='" + keys.etherscan + "' placeholder='Etherscan " + keyph + "' data-ref='etherscan' data-checkchange='" + keys.etherscan + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Ethplorer</h3>\
                   <input type='text' value='" + keys.ethplorer + "' placeholder='Ethplorer " + keyph + "' data-ref='ethplorer' data-checkchange='" + keys.ethplorer + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Exchangeratesapi</h3>\
                   <input type='text' value='" + keys.exchangerates + "' placeholder='Exchangeratesapi " + keyph + "' data-ref='exchangeratesapi' data-checkchange='" + keys.exchangerates + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Fixer</h3>\
                   <input type='text' value='" + keys.fixer + "' placeholder='Fixer " + keyph + "' data-ref='fixer' data-checkchange='" + keys.fixer + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <h3>Infura</h3>\
                   <input type='text' value='" + keys.infura + "' placeholder='Infura Project ID' data-ref='infura' data-checkchange='" + keys.infura + "' class='ak_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                   <input type='submit' class='submit' value='" + tl("okbttn") + "' id='apisubmit'/>\
               </div>\
           </div>";
        popdialog(content, "triggersubmit");
    });
}

// Marks API key fields as modified when values change
function api_input_change() {
    $(document).on("input", "#apikeyformbox input.ak_input", function() {
        $(this).addClass("changed");
    });
}

// Processes and validates modified API keys
function submit_api() {
    $(document).on("click", "#apisubmit", function(e) {
        e.preventDefault();
        $("#apikeyformbox").addClass("pass");
        const inputs = $("#apikeyformbox input.ak_input"),
            changed = inputs.filter(function() {
                const input = $(this);
                return input.hasClass("changed") && input.val() !== input.attr("data-checkchange");
            }),
            count = changed.length;
        if (count === 0) {
            if (inputs.hasClass("input_error")) {
                const msg = tl("invalidapikey");
                popnotify("error", msg);
                notify(msg);
                $(".input_error").select();
                return
            }
            canceldialog();
            return
        }
        changed.each(function(index) {
            const idx = index + 1,
                input = $(this),
                val = input.val();
            if (inj(val)) return false
            const ref = input.attr("data-ref"),
                is_last = count === idx;
            validate_api_key(ref, val, is_last);
        });
        return
    });
}

// Initiates API-specific key validation process
function validate_api_key(ref, keyval, last_input) {
    const tokens = {
        "bitly": {
            "keylength": 6,
            "payload": "expand"
        },
        "blockchair": {
            "keylength": 6,
            "payload": "stats?key="
        },
        "blockcypher": {
            "keylength": 6,
            "payload": "btc/main/addrs/1rundZJCMJhUiWQNFS5uT3BvisBuLxkAp/balance?token="
        },
        "coinmarketcap": {
            "keylength": 20,
            "payload": "v1/cryptocurrency/quotes/latest?id=1&CMC_PRO_API_KEY="
        },
        "currencylayer": {
            "keylength": 6,
            "payload": "live?access_key="
        },
        "etherscan": {
            "keylength": 6,
            "payload": "?module=block&action=getblockreward&blockno=131049&chainid=1&apikey="
        },
        "ethplorer": {
            "keylength": 6,
            "payload": "getTop?apiKey="
        },
        "exchangeratesapi": {
            "keylength": 6,
            "payload": "v1/latest?access_key="
        },
        "fixer": {
            "keylength": 20,
            "payload": "symbols?access_key="
        }
    };
    const data = tokens[ref] || {
        "keylength": 6,
        "payload": null
    };
    json_check_apikey(data.keylength, ref, data.payload, keyval, last_input);
}

// Performs HTTP request to verify API key validity
function json_check_apikey(keylength, ref, payload, keyval, last_input) {
    if (keyval.length > keylength) {
        if (ref === "infura" || ref === "alchemy") {
            const txhash = "0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1",
                base_url = ref === "infura" ? glob_const.main_eth_node : glob_const.main_alchemy_node,
                json = {
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "eth_getTransactionByHash",
                    "params": [txhash]
                };
            api_proxy({
                "api": ref,
                "api_url": base_url + keyval,
                "proxy": false,
                "params": {
                    "method": "POST",
                    "data": json,
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    update_api_attr(ref, keyval, last_input);
                    return
                }
                api_fail(ref, keyval);
            }).fail(function(xhr, stat, err) {
                api_fail(ref, keyval);
            });
            return
        }
        const api_data = get_api_data(ref),
            base_url = api_data.base_url,
            method = (ref === "bitly") ? "POST" : "GET",
            params = {
                method
            };
        let search = payload + keyval;
        if (ref === "bitly") {
            search = payload;
            params.headers = {
                "Authorization": "Bearer " + keyval,
                "Content-Type": "application/json"
            };
            params.data = {
                "bitlink_id": "bit.ly/12a4b6c"
            };
        }
        const api_url = base_url + search,
            proxy = (ref === "coinmarketcap"),
            req_data = {
                "api": ref,
                search,
                "cachetime": 0,
                "cachefolder": "1h",
                api_url,
                proxy,
                params
            };
        api_proxy(req_data).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                const fail_msg = tl("apicallfailed");
                if (ref === "etherscan" && data.status != 1) {
                    if (str_match(data.result, "Invalid API Key")) {
                        api_fail(ref, keyval);
                    } else {
                        notify(tl("apicallerror"));
                        const content = "<h2 class='icon-blocked'>" + fail_msg + "</h2><p class='doselect'>" + data.message + "</p>";
                        popdialog(content, "canceldialog");
                    }
                    return
                }
                if (ref === "bitly" && data.status_code == 500) {
                    api_fail(ref, keyval);
                    return
                }
                if (ref === "blockchair") {
                    const code = data.context.code;
                    if (code == 200) {
                        update_api_attr(ref, keyval, last_input);
                    } else if (code == 402) {
                        api_fail(ref, keyval);
                    } else {
                        notify(tl("apicallerror"));
                        const content = "<h2 class='icon-blocked'>" + fail_msg + "</h2><p class='doselect'>" + data.error + "</p>";
                        popdialog(content, "canceldialog");
                    }
                    return
                }
                if (ref === "blockcypher") {
                    if (data.address) {
                        update_api_attr(ref, keyval, last_input);
                    } else {
                        api_fail(ref, keyval);
                    }
                    return
                }
                if (ref === "coinmarketcap") {
                    if (keyval.length !== 36) {
                        api_fail(ref, keyval);
                        return
                    }
                }
                if (ref === "currencylayer" && data.success === false) {
                    if (data.error.code == 101) {
                        api_fail(ref, keyval);
                    } else {
                        notify(tl("apicallerror"));
                        const content = "<h2 class='icon-blocked'>" + fail_msg + "</h2><p class='doselect'>" + data.error + "</p>";
                        popdialog(content, "canceldialog");
                    }
                    return
                }
                if (ref === "ethplorer") {
                    if (data.tokens) {
                        update_api_attr(ref, keyval, last_input);
                    } else {
                        if (data.error.code == 1) {
                            api_fail(ref, keyval);
                        } else {
                            notify(tl("apicallerror"));
                            const content = "<h2 class='icon-blocked'>" + fail_msg + "</h2><p class='doselect'>" + data.error + "</p>";
                            popdialog(content, "canceldialog");
                        }
                    }
                    return
                }
                if (ref === "exchangeratesapi" && !data.success) {
                    const ec = q_obj(data, "error.code");
                    if (ec) {
                        if (ec === "invalid_access_key") {
                            api_fail(ref, keyval);
                        } else {
                            notify(tl("apicallerror"));
                            const content = "<h2 class='icon-blocked'>" + fail_msg + "</h2><p class='doselect'>" + ec + "</p>";
                            popdialog(content, "canceldialog");
                        }
                        return
                    }
                }
                if (ref === "fixer" && data.success === false) {
                    if (data.error.code == 101) {
                        api_fail(ref, keyval);
                    } else {
                        notify(tl("apicallerror"));
                        const content = "<h2 class='icon-blocked'>" + fail_msg + "</h2><p class='doselect'>" + data.error + "</p>";
                        popdialog(content, "canceldialog");
                    }
                    return
                }
                update_api_attr(ref, keyval, last_input);
                return
            }
            api_fail(ref, keyval);
        }).fail(function(xhr, stat, err) {
            api_fail(ref, keyval);
        });
        return
    }
    if (!keyval) {
        update_api_attr(ref, null, last_input);
        return
    }
    api_fail(ref, keyval);
}

// Handles API key validation errors with user feedback
function api_fail(ref, val) {
    const msg = tl("invalidapikeyname", {
            "thisref": ref
        }),
        form = $("#apikeyformbox");
    popnotify("error", msg);
    form.removeClass("pass");
    form.find("input[data-ref=" + ref + "]").attr("data-checkchange", val).removeClass("changed").addClass("input_error").select();
    notify(msg);
}

// Updates API configuration after successful key validation
function update_api_attr(thisref, thisvalue, last_input) {
    const form = $("#apikeyformbox"),
        val = thisvalue || "";
    if (form && form.hasClass("pass")) {
        complement_apisettings(thisref, val);
        form.find("input[data-ref=" + thisref + "]").attr("data-checkchange", val).removeClass("changed input_error");
        if (last_input) {
            canceldialog();
            notify(tl("datasaved"));
            save_settings();
        }
        return
    }
    complement_apisettings(thisref, val);
    canceldialog();
    notify(tl("datasaved"));
    save_settings();
    br_remove_session(thisref + "_api_attempt");
    br_remove_session("txstatus");
    cancel_paymentdialog();
}

// Updates settings store with validated API credentials
function complement_apisettings(thisref, thisvalue) {
    const keys = {};
    keys[thisref] = thisvalue;
    set_setting("apikeys", keys);
    const settings = {
        "bitly": {
            "url_shorten_settings": {
                "bitly_at": thisvalue
            }
        },
        "coinmarketcap": {
            "cmcapisettings": {
                "cmcapikey": thisvalue
            }
        },
        "fixer": {
            "fiatapisettings": {
                "fxapikey": thisvalue
            }
        }
    };
    if (settings[thisref]) {
        set_setting(Object.keys(settings[thisref])[0], Object.values(settings[thisref])[0]);
    }
}

// ** Contact Form: **

// Initializes contact form dialog event handler
function edit_contactform_trigger() {
    $(document).on("click", "#contactform", () => edit_contactform());
}

// Renders contact/shipping form with prefilled user data
function edit_contactform(checkout) {
    const form = $("#contactform"),
        data = form.data(),
        title = checkout ? tl("contactform") + " / " + tl("shipping") : tl("contactform"),
        subtitle = checkout ? "" : "<p>" + tl("yourdetails") + "</p>",
        content = "\
    <div class='formbox' id='contactformbox'>\
        <h2 class='icon-sphere'>" + title + "</h2>" + subtitle +
        "<div class='popnotify'></div>\
        <div class='popform'>\
            <div class='cf_inputwrap empty'><input type='text' value='" + data.name + "' placeholder='" + tl("phname") + "' class='cf_nameinput' autocomplete='off' autocapitalize='off' spellcheck='false'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + data.address + "' placeholder='" + tl("phaddress") + "' class='cf_addressinput' autocomplete='off' autocapitalize='off' spellcheck='false'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + data.zipcode + "' placeholder='" + tl("phzipcode") + "' class='cf_zipcodeinput' autocomplete='off' autocapitalize='off' spellcheck='false'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + data.city + "' placeholder='" + tl("phcity") + "' class='cf_cityinput' autocomplete='off' autocapitalize='off' spellcheck='false'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + data.country + "' placeholder='" + tl("phcountry") + "' class='cf_countryinput' autocomplete='off' autocapitalize='off' spellcheck='false'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + data.email + "' placeholder='" + tl("phemail") + "' class='cf_emailinput' autocomplete='off' autocapitalize='off' spellcheck='false'/><span class='required'>*</span></div>\
            <input type='submit' class='submit' value='" + tl("okbttn") + "'/>\
        </div>\
    </div>";
    popdialog(content, "triggersubmit");
    check_contactform();
    if (checkout) {
        $("#popup #execute").text("CONTINUE");
        $("#popup #canceldialog").hide();
        if (glob_const.inframe) {
            parent.postMessage("close_loader", "*");
        }
    }
}

// Validates contact form input field completeness
function check_contactform() {
    $("#contactformbox .popform .cf_inputwrap").each(function() {
        const wrap = $(this);
        const input = wrap.children("input");
        wrap.toggleClass("empty", input.val().length <= 2);
    });
}

// Updates form field validation state during user input
function type_contactform() {
    $(document).on("input", "#contactformbox .cf_inputwrap input", function() {
        const input = $(this);
        $(input).parent(".cf_inputwrap").toggleClass("empty", input.val().length <= 2);
    });
}

// Validates and saves contact form data with email format checking
function submit_contactform() {
    $(document).on("click", "#contactformbox input.submit", function(e) {
        e.preventDefault();
        const cfb = $("#contactformbox"),
            inputs = {
                "name": cfb.find(".cf_nameinput"),
                "address": cfb.find(".cf_addressinput"),
                "zipcode": cfb.find(".cf_zipcodeinput"),
                "city": cfb.find(".cf_cityinput"),
                "country": cfb.find(".cf_countryinput"),
                "email": cfb.find(".cf_emailinput")
            },
            cf_data = {},
            email_regex = /^\w(?:\.?[\w%+-]+)*@\w(?:[\w-]*\.)+?[a-z]{2,}$/;
        for (const [key, input] of Object.entries(inputs)) {
            const val = input.val().trim();
            if (inj(val)) return false
            cf_data[key] = val;
            if (key === "name" && val.length < 4) {
                show_error(input, "phname");
                return
            }
            if (key === "address" && val.length < 10) {
                show_error(input, "phaddress");
                return
            }
            if (key === "zipcode" && val.length < 6) {
                show_error(input, "phzipcode");
                return
            }
            if ((key === "city" || key === "country") && val.length < 3) {
                show_error(input, "ph" + key);
                return
            }
            if (key === "email") {
                if (val.length < 1) {
                    show_error(input, "phemail");
                    return
                }
                if (!email_regex.test(val)) {
                    popnotify("error", tl("phemail") + " " + tl("invalidchars"));
                    input.focus().parent(".cf_inputwrap").addClass("empty");
                    return
                }
            }
        }
        set_setting("contactform", cf_data);
        canceldialog(true);
        save_settings();
        if (get_urlparameters().contactform !== undefined) {
            load_request(true);
            return
        }
        notify(tl("datasaved"));
    });

    function show_error(input, translationKey) {
        popnotify("error", tl(translationKey) + " " + tl("requiredfield"));
        input.focus().parent(".cf_inputwrap").addClass("empty");
    }
}

// ** Permissions: **

// Launches PIN-protected permissions configuration dialog
function permissions() {
    $(document).on("click", "#permissions", function() {
        all_pinpanel({
            "func": permissions_callback
        }, true, true)
    })
}

// Displays role selection dialog for user permissions
function permissions_callback() {
    const thisnode = $("#permissions"),
        thisdata = thisnode.data(),
        selected = thisdata.selected,
        ddat = [{
            "div": {
                "class": "popform",
                "attr": {
                    "data-current": selected
                },
                "content": [{
                        "div": {
                            "class": "selectbox",
                            "content": [{
                                    "input": {
                                        "attr": {
                                            "type": "text",
                                            "value": selected,
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
                                        "content": "<span data-pe='none'>admin</span><span data-pe='none'>cashier</span>"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "input": {
                            "class": "submit",
                            "attr": {
                                "type": "submit",
                                "value": tl("okbttn")
                            }
                        }
                    }
                ]
            }
        }],
        content = template_dialog({
            "id": "permissions_formbox",
            "icon": "icon-user",
            "title": tl("permissions"),
            "elements": ddat
        });
    popdialog(content, "triggersubmit");
}

// Processes and persists user role changes
function submit_permissions() {
    $(document).on("click", "#permissions_formbox input.submit", function(e) {
        e.preventDefault();
        const form = $(this).closest(".popform"),
            input = form.find("input:first"),
            val = input.val();
        if (inj(val)) return
        const current = form.attr("data-current");
        if (val === current) { // check for changes
            canceldialog();
            return
        }
        set_setting("permissions", {
            "selected": val
        }, val);
        glob_const.html.attr("data-role", val);
        canceldialog();
        notify(tl("datasaved"));
        save_settings();
        return false
    })
}

// ** Team invite: **

// Initiates team invite process with PIN verification
function team_invite_trigger() {
    $(document).on("click", "#teaminvite", function() {
        if (glob_let.hasbip && !glob_let.bipv) {
            validate_trial_status();
            notify(tl("pleaseverify"));
            return
        }
        if (check_pin_enabled(true) === true) {
            team_invite();
            return
        }
        const content = pinpanel("", {
            "func": team_invite
        });
        showoptions(content, "pin");
    });
}

// Creates team invite dialog with sharing options
function team_invite() {
    const jsonencode = complile_teaminvite(),
        filename = "bitrequest_team_invite.json",
        ddat = [{
            "div": {
                "class": "popform",
                "content": "<div id='ti_intro'><p><strong>" + tl("inviteteammembers") + "</strong><br/>" + tl("teaminviteexplainer") + "<br/>" + tl("teaminviteaccess") + "</p></div>\
            <div id='ti_qr_container' data-url='" + jsonencode + "' >\
                <div class='qrwrap flex'>\
                   <div id='qrcode' class='qrcode'></div>\
                </div>\
            </div>\
           <div id='ti_buttons'>\
                <div id='send_invite' class='button'><span class='icon-share2'></span>" + tl("sendinvite") + "</div><div id='qr_invite' class='button' title='" + tl("showqr") + "'><span class='icon-qrcode'></span></div>\
            </div>"
            }
        }],
        content = template_dialog({
            "id": "team_invite",
            "icon": "icon-users",
            "title": tl("teaminvite"),
            "elements": ddat
        }) + "<div id='backupactions'><div id='backupcd'>" + cancelbttn + "</div></div>";
    popdialog(content, "triggersubmit");
}

// Generates secure team configuration data package
function complile_teaminvite() {
    const jsonfile = {},
        excludeKeys = [
            "bitrequest_symbols", "bitrequest_changes", "bitrequest_erc20tokens_init", "bitrequest_erc20tokens",
            "bitrequest_editurl", "bitrequest_recent_requests", "bitrequest_backupfile_id",
            "bitrequest_appstore_dialog", "bitrequest_init", "bitrequest_k",
            "bitrequest_awl", "bitrequest_tp", "bitrequest_requests",
            "bitrequest_archive", "bitrequest_dat", "bitrequest_rt",
            "bitrequest_bpdat"
        ];
    for (let key in localStorage) {
        const val = localStorage.getItem(key);
        if (val !== null && !excludeKeys.includes(key)) {
            const parsed = JSON.parse(val);
            if (key === "bitrequest_settings") {
                const mods = [{
                    "id": "permissions",
                    "change": "selected",
                    "val": "cashier"
                }];
                jsonfile[key] = adjust_objectarray(parsed, mods);
            } else {
                jsonfile[key] = parsed;
            }
        }
    }
    const seedobj = glob_let.hasbip ? ls_phrase_obj() : {
        "pid": false,
        "pob": false
    };
    const adjusted = adjust_object(jsonfile, seedobj);
    return btoa(JSON.stringify(adjusted));
}

// Modifies configuration data for team member access
function adjust_object(object, seedobj) {
    const seedid = seedobj.pid;
    object.bitrequest_cashier = {
        "cashier": true,
        "seedid": seedid
    };
    let phrase, seed, rootkey, key, cc;
    if (seedid) {
        phrase = seedobj.pob.join(" ");
        seed = mnemonic_to_seed(phrase);
        rootkey = get_rootkey(seed);
        key = rootkey.slice(0, 64);
        cc = rootkey.slice(64);
    }
    $.each(glob_config.bitrequest_coin_data, function(i, coinconfig) {
        const currency = coinconfig.currency,
            default_coinsettings = coinconfig.settings,
            bip32dat = default_coinsettings.Xpub,
            keyval = "bitrequest_cc_" + currency,
            addresses = object[keyval];
        let xpub, xpubid;
        if (seedid && bip32dat.active) {
            const root_path = bip32dat.root_path,
                xpubdat = br_xpub_obj(currency, root_path, cc, key);
            xpub = xpubdat.xpub;
            xpubid = xpubdat.xpubid;
        }
        if (addresses) {
            const checked = addresses.filter(filter => filter.checked === true);
            if (bip32dat.xpub) {
                const address_object = checked.filter(filter => {
                    if (filter.seedid) return false
                    if (filter.xpubid && filter.xpubid !== xpubid) return false
                    return true
                });
                const settings_key = "bitrequest_" + currency + "_settings",
                    saved_coinsettings = object[settings_key],
                    coinsettings = saved_coinsettings || default_coinsettings;
                if (coinsettings) {
                    const xpsettings = coinsettings.Xpub;
                    if (!(xpsettings.key && xpsettings.selected === true) && seedid) {
                        const new_xpsettings = {
                            ...xpsettings
                        };
                        new_xpsettings.key = xpub;
                        new_xpsettings.key_id = xpubid;
                        new_xpsettings.selected = true;
                        coinsettings.Xpub = new_xpsettings;
                    }
                }
                object[keyval] = address_object;
                object[settings_key] = coinsettings;
            } else {
                checked.forEach(val => {
                    val.used = false;
                    delete val.seedid;
                });
                object[keyval] = checked;
            }
        }
    });
    return object;
}

// Processes team invite sharing with server upload
function share_teaminvite() {
    $(document).on("click", "#send_invite", function() {
        const result = confirm(tl("sendinvite") + "?");
        if (result) {
            loader(true);
            set_loader_text(tl("installationpackage"));
            const account = $("#accountsettings").data("selected"),
                acc_b64 = btoa(account),
                url = $("#ti_qr_container").attr("data-url"),
                url_hash = sha_sub(url, 10),
                title = tl("teaminviteharetitle", {
                    "accountname": account
                }),
                cached_short_url = get_saved_shorturl(url_hash);
            if (cached_short_url) {
                share_request(cached_short_url, title);
                return
            }
            api_proxy({
                "custom": "system_bu",
                "api_url": "x", // dummy value, don't remove
                "proxy": true,
                "params": {
                    "account": acc_b64,
                    url
                }
            }).done(function(e) {
                const ro = q_obj(e, "ping.br_cache.filename");
                if (ro) {
                    const proxy = c_proxy(),
                        data = btoa(JSON.stringify({
                            ro,
                            proxy
                        })),
                        app_root = glob_const.approot;
                    shorten_url(title, app_root + "?ro=" + data, app_root + "img_icons_apple-touch-icon.png", true, url_hash);
                }
            }).fail(function(xhr, stat, err) {
                closeloader();
            });
        }
    });
}

// Processes team invite qr_code with server upload
function share_teaminvite_qr() {
    $(document).on("click", "#qr_invite", function() {
        const qr_container = $("#ti_qr_container"),
            qr_loaded = qr_container.hasClass("ti_qr");
        const result = qr_loaded || confirm(tl("showqr") + "?");
        if (result) {
            const account = btoa($("#accountsettings").data("selected")),
                url = $("#ti_qr_container").attr("data-url"),
                url_hash = sha_sub(url, 10),
                cached_short_url = get_saved_shorturl(url_hash);
            if (cached_short_url) {
                toggle_ti_qr(cached_short_url);
                return
            }
            loader(true);
            set_loader_text(tl("installationpackage"));
            api_proxy({
                "custom": "system_bu",
                "api_url": "x", // dummy value, don't remove
                "proxy": true,
                "params": {
                    account,
                    url
                }
            }).done(function(e) {
                const ro = q_obj(e, "ping.br_cache.filename");
                if (ro) {
                    const proxy = c_proxy(),
                        data = btoa(JSON.stringify({
                            ro,
                            proxy
                        })),
                        app_root = glob_const.approot;
                    shorten_url("qr", app_root + "?ro=" + data, app_root + "img_icons_apple-touch-icon.png", true, url_hash);
                }
            }).fail(function(xhr, stat, err) {
                closeloader();
            });
        }
    });
}

// Toggle team invite qr_code
function toggle_ti_qr(url) {
    const qr_container = $("#ti_qr_container"),
        ti_intro = $("#ti_intro");
    if (qr_container.hasClass("ti_qr")) {} else {
        $("#qrcode").qrcode(url);
        qr_container.addClass("ti_qr");
    }
    if (qr_container.is(":visible")) {
        qr_container.slideUp(200);
        ti_intro.slideDown(200);
        return
    }
    qr_container.slideDown(200);
    ti_intro.slideUp(200);
}

// Validates and displays team invite installation dialog 
function check_teaminvite(ro) {
    const ro_dat = stripb64(ro),
        ro_id = ro_dat.ro,
        ro_proxy = ro_dat.proxy;
    api_proxy({
        "custom": "get_system_bu",
        "api_url": "x", // dummy value, don't remove
        "proxy": true,
        "params": ro_id
    }, ro_proxy).done(function(e) {
        const ping = e.ping;
        if (ping) {
            const br_result = ping.br_result;
            if (br_result) {
                if (br_result.error) {
                    systembu_expired();
                    return
                }
                const cache = ping.br_cache,
                    server_time = cache.utc_timestamp,
                    filetime = cache.created_utc,
                    filetimesec = filetime ? filetime * 1000 : now_utc(),
                    filetime_format = new Date(filetimesec).toLocaleString(langcode),
                    base64 = br_result.base64,
                    cb64 = strip_quotes(base64),
                    br_dat = JSON.parse(atob(cb64)),
                    account = atob(br_result.account),
                    sharedtitle = "Team invite " + account + " (" + filetime_format + ")",
                    bu_date = filetime_format.replace(/\s+/g, "_").replace(/\:/g, "_"),
                    cache_time = cache.cache_time,
                    expires_in = (filetime + cache_time) - server_time,
                    filename = "bitrequest_team_invite" + encodeURIComponent(account) + "_" + bu_date + ".json",
                    cd = countdown(expires_in * 1000),
                    cd_format = countdown_format(cd),
                    bpdat_seedid = q_obj(br_dat, "bitrequest_cashier.seedid"),
                    update = (bpdat_seedid == glob_let.cashier_seedid) && (bpdat_seedid !== false),
                    master_account = (bpdat_seedid === glob_let.bipid) && (bpdat_seedid !== false),
                    teamid = br_get_local("teamid", true),
                    teamid_arr = get_default_object(teamid),
                    is_installed = teamid_arr.includes(ro),
                    dialog_heading = update ? tl("teamupdate") : tl("teaminvite"),
                    cf_string = cd_format ? tl("invitationexpiresin") + " " + cd_format : tl("fileexpired"),
                    dialogtext = is_installed ? "<p>" + tl("installcompleted") + "</p>" :
                    update ? "<p>" + tl("teamupdata", {
                        "account": account
                    }) + "</p>" :
                    "<p>" + tl("teamup", {
                        "account": account
                    }) + "<br/><br/>" + tl("clickinstall", {
                        "account": account
                    }) + "</p>",
                    button_text = update ? tl("update") : tl("install"),
                    install_button = is_installed ? "" : "<div id='install_teaminvite' data-base64='" + cb64 + "' data-filename='" + filename + "' class='button icon-download' data-update='" + update + "' data-ismaster='" + master_account + "' data-installid='" + ro + "'>" + button_text + "</div>",
                    ddat = [{
                        "div": {
                            "id": "dialogcontent",
                            "content": [{
                                    "div": {
                                        "class": "error",
                                        "attr": {
                                            "style": "margin-top:1em;padding:0.3em 1em"
                                        },
                                        "content": cf_string
                                    }
                                },
                                {
                                    "div": {
                                        "id": "changelog",
                                        "content": dialogtext + "<div id='custom_actions'>" + install_button + "</div>"
                                    }
                                }
                            ]
                        }
                    }],
                    content = template_dialog({
                        "id": "system_backupformbox",
                        "icon": "icon-users",
                        "title": dialog_heading,
                        "elements": ddat
                    }) + "<div id='backupactions'><div id='backupcd'>" + cancelbttn + "</div></div>";
                popdialog(content, "triggersubmit", null, true);
                return
            }
        }
        systembu_expired();
    }).fail(function(xhr, stat, err) {
        systembu_expired();
    });
}

// Handles team invite installation confirmation
function install_teaminvite_trigger() {
    $(document).on("click", "#install_teaminvite", function() {
        const btn = $(this),
            ismaster = btn.attr("data-ismaster") === "true";
        if (ismaster) {
            notify(tl("owndevice"));
            return
        }
        const update = btn.attr("data-update") === "true",
            installid = btn.attr("data-installid"),
            result_text = update ? tl("updatealert") : tl("installalert"),
            result = set_up() ? confirm(result_text) : true;
        if (result) {
            const bu_dat = btn.attr("data-base64"),
                cb64 = strip_quotes(bu_dat),
                b64 = atob(cb64);
            if (inj(b64)) return
            const j_object = JSON.parse(b64),
                j_filename = btn.attr("data-filename");
            if (inj(j_filename)) return
            if (inj(installid)) return
            install_teaminvite(j_object, j_filename, installid);
        }
    })
}

// Applies team configuration data and updates settings
function install_teaminvite(jsonobject, bu_filename, iid) {
    $.each(jsonobject, function(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    });
    if (iid) {
        const stored_teamids = br_get_local("teamid", true),
            teamid_arr = get_default_object(stored_teamids);
        teamid_arr.push(iid);
        br_set_local("teamid", teamid_arr, true);
    }
    render_settings(["restore", "backup"]); // exclude restore and backup settings
    const lastrestore = tl("lastrestore") + "<br/><span class='icon-folder-open'>" + tl("teaminvite") + " " + new Date(now_utc()).toLocaleString(langcode).replace(/\s+/g, "_") + "</span>";
    set_setting("restore", {
        "titlerestore": lastrestore,
        "fileused": bu_filename,
        "device": "folder-open"
    }, lastrestore);
    save_settings();
    notify(tl("installcomplete"));
    canceldialog();
    glob_const.w_loc.href = glob_const.w_loc.pathname + "?p=home";
}

// Detects if backup object contains team configuration
function is_team_invite(jsonobject) {
    const cashier_entry = jsonobject.bitrequest_cashier;
    return (cashier_entry && cashier_entry.cashier) ? true : false;
}

// ** Utility Functions: **

// Displays detailed browser and environment information
function check_useragent() {
    $(document).on("click", "#ua", function() {
        const refmatch = glob_const.ref_match ? "<span class='number'>" + glob_const.referrer + "</span>" : "<span class='number'>" + false + "</span>",
            pdat = get_auth_status(),
            pass = pdat.expired,
            expiresin = pdat.expires_in,
            rtoken = get_refresh_token(),
            ei_str = expiresin > 0 ? "expires: <span class='number'>" + Math.floor(expiresin / 1000) + " sec </span>" : "",
            hastoken = rtoken ? "true" : "false",
            rtstring = "rt: <span class='number'> " + hastoken + "</span>",
            ddat = [{
                "div": {
                    "class": "popform",
                    "content": [{
                            "div": {
                                "class": "pre",
                                "content": highlight_json_syntax(glob_const.useragent)
                            }
                        },
                        {
                            "div": {
                                "class": "pre",
                                "content": [
                                    "android_standalone : <span class='number'>" + glob_const.android_standalone + "</span>",
                                    "ios_standalone : <span class='number'>" + glob_const.ios_standalone + "</span>",
                                    "referrer : " + refmatch,
                                    "is_android_app: <span class='number'>" + glob_const.is_android_app + "</span>",
                                    "is_ios_app: <span class='number'>" + glob_const.is_ios_app + "</span>",
                                    ei_str,
                                    rtstring
                                ].join(" || ")
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "uabox",
                "icon": "icon-user",
                "title": "User Agent",
                "elements": ddat
            });
        popdialog(content, "canceldialog");
    })
}