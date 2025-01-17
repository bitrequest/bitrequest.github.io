$(document).ready(function() {

    // ** Settings **

    // Account name
    editaccount();
    submitaccount();

    // Contact form
    edit_contactform_trigger();
    //edit_contactform;
    type_contactform();
    submit_contactform();

    // Standard fiat currency
    editcurrency();
    toggle_defaultcurrency();
    autocompletecurrency();
    submitcurrency();

    // Language
    editlanguage();
    submitlang();

    // CSV Export
    csvexport_trigger();
    submit_csvexport();
    //complile_csv
    //render_csv
    share_csv();
    //check_csvexport
    submit_csvdownload();

    // Bip32 passphrase
    trigger_bip32();
    hide_seed_panel_trigger();
    //hide_seed_panel

    // Pincode
    editpin();
    locktime();
    submit_locktime();

    // Back up
    backupdatabasetrigger();
    //backupdatabase
    sbu_switch();
    sharebu();
    //check_systembu
    //stripb64
    //systembu_expired
    restore_systembu();
    backupcd();
    //complilebackup
    //complilefilename
    submitbackup();

    // Restore backup

    restorefrombackup();
    //trigger_restore
    restorebackup();
    submitrestore();
    //restore
    //check_backup
    submit_GD_restore();
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
    submit_dphrase();
    //keep_current_seed
    //restore_bu_seed
    //bu_oldseed
    compare_seeds();
    //cs_callback
    //compare_seeds_callback
    //restorestorage

    // Url shortener
    urlshortener();
    togglebl();
    pick_urlshortener_select();
    submit_urlshortener_select();

    // Cryptocurrency price api
    editccapi();
    pickcmcapiselect();
    submitccapi();

    // Fiat price api
    editfiatxrapi();
    pickfiatxrapiselect();
    submitfiatxrapi();

    // API keys	
    apikeys();
    api_input_change();
    submitapi();
    //checkapikey
    //json_check_apikey
    //api_fail
    //update_api_attr
    //complement_apisettings

    // API Proxy
    trigger_proxy_dialog();
    pick_api_proxy();
    //test_append_proxy
    //proxy_option_li
    submit_proxy();
    hide_custom_proxy_field();
    //test_custom_proxy
    remove_proxy();
    //complete_url
    //c_proxy

    // PERMISSIONS
    permissions();
    submit_permissions();

    // TEAM INVITE
    team_invite_trigger()
    //team_invite
    //complile_teaminvite
    //adjust_object
    share_teaminvite()
    //check_teaminvite
    install_teaminvite_trigger()
    //install_teaminvite
    //isteaminvite
    check_useragent();
});

// ** Settings **

// Account name
// Handles the click event for editing account settings
function editaccount() {
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
                                    "value": translate("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "accountformbox",
                "icon": "icon-user",
                "title": translate("accountsettings"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

// Handles the submission of account settings
function submitaccount() {
    $(document).on("click", "#accountformbox input.submit", function(e) {
        e.preventDefault();
        const thisinput = $(this).prev("input"),
            thisvalue = thisinput.val();
        if (thisvalue.length < 1) {
            popnotify("error", translate("nameisrequired"));
            thisinput.focus();
            return false;
        }
        set_setting("accountsettings", {
            "selected": thisvalue
        }, thisvalue);
        canceldialog();
        notify(translate("datasaved"));
        savesettings();
    })
}

// Standard fiat currency
// Handles the click event for editing currency settings
function editcurrency() {
    $(document).on("click", "#currencysettings", function() {
        const currencysettings = $("#currencysettings"),
            switchmode = currencysettings.data("default"),
            currency = currencysettings.data("selected"),
            symbolstringarray = br_get_local("symbols", true);
        let symbollist = "";
        $.each(symbolstringarray, function(key, value) {
            if (key !== "BTC") { // remove from list
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
                                                "placeholder": "Pick currency"
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
                                "content": "<h3>" + translate("setasdefault") + switchpanel(switchmode, " global") + "</h3>"
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": translate("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "currencyformbox",
                "icon": "icon-dollar",
                "title": translate("entercurrency"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

// Handles the toggle event for setting default currency
function toggle_defaultcurrency() {
    $(document).on("mouseup", "#toggle_defaultcurrency .switchpanel", function(e) {
        $(this).addClass("dc_changed");
    })
}

// Handles autocomplete functionality for currency input
function autocompletecurrency() {
    $(document).on("input", "#currencyformbox input:first", function() {
        const thisinput = $(this),
            thisform = thisinput.closest(".popform"),
            thisvalue = thisinput.val().toUpperCase(),
            options = thisform.find(".options");
        thisform.removeClass("validated");
        $("#currencyformbox .options > span").each(function() {
            const thisoption = $(this),
                thistext = thisoption.text(),
                currencysymbol = thistext.split(" | ")[0];
            thisoption.removeClass("show");
            if (currencysymbol === thisvalue) {
                thisform.addClass("validated");
                thisinput.val(thistext)[0].setSelectionRange(0, 999);
            } else if (currencysymbol.match("^" + thisvalue)) {
                thisoption.addClass("show");
            }
        });
    })
}

// Handles the submission of currency settings
function submitcurrency() {
    $(document).on("click", "#currencyformbox input.submit", function(e) {
        e.preventDefault();
        const localcurrency = get_setting("currencysettings", "currencysymbol"),
            thisform = $(this).closest(".popform"),
            thisinput = thisform.find("input:first"),
            thisinputvalue = thisinput.val();
        thisform.removeClass("validated");
        $("#currencyformbox .options > span").each(function() {
            if (thisinputvalue == $(this).text()) {
                thisform.addClass("validated");
            }
        });
        if (thisform.hasClass("validated")) {
            const defaultcurrency_switch = $("#toggle_defaultcurrency .switchpanel"),
                switchchange = defaultcurrency_switch.hasClass("dc_changed"),
                values = thisinputvalue.split(" | "),
                currencysymbol = values[0],
                currency = values[1],
                currencysymbollc = currencysymbol.toLowerCase();
            if (currencysymbollc === localcurrency && !switchchange) {
                canceldialog();
                return false;
            }
            const dc_output = defaultcurrency_switch.hasClass("true");
            set_setting("currencysettings", {
                "currencysymbol": currencysymbollc,
                "selected": thisinputvalue,
                "default": dc_output
            }, thisinputvalue);
            canceldialog();
            notify(translate("currencysaved"));
            savesettings();
            return false;
        }
        popnotify("error", translate("currencynotsupported", {
            "currency": thisinputvalue.toUpperCase()
        }));
        thisinput.focus();
        return false;
    });
}

// Language
// Handles the click event for editing language settings
function editlanguage() {
    $(document).on("click", "#langsettings", function() {
        const translation = translate("obj"),
            current_lang = q_obj(translation, langcode + ".lang"),
            current_flag = q_obj(translation, langcode + ".flag"),
            cf_string = current_flag ? current_flag + " " : "",
            current_val = cf_string + current_lang + " (" + langcode + ")";
        let langlist = "";
        $.each(translation, function(key, value) {
            const cflag = value.flag ? value.flag + " " : ""
            langlist += "<span>" + cflag + value.lang + " (" + key + ")</span>";
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
                                                "value": current_val,
                                                "placeholder": "Pick language"
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
                                    "value": translate("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "langformbox",
                "icon": "icon-dollar",
                "title": translate("chooselanguage"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

// Handles the submission of language settings
function submitlang() {
    $(document).on("click", "#langformbox input.submit", function(e) {
        e.preventDefault();
        const thisform = $(this).closest(".popform"),
            currentlang = thisform.attr("data-currentlang"),
            thisinput = thisform.find("input"),
            thisvalue = thisinput.val(),
            lc2 = thisvalue.match(/\(([^)]+)\)/)[1];
        if (lc2 === currentlang) {
            canceldialog();
            return
        }
        set_setting("langsettings", {
            "selected": lc2
        }, thisvalue);
        savesettings();
        glob_const.w_loc.href = glob_const.w_loc.pathname + "?p=settings";
        return false;
    })
}

// SECURITY //

// Pincode
// Handles the click event for editing PIN settings
function editpin() {
    $(document).on("click", "#pinsettings", function() {
        if (haspin(true) === true) {
            const content = pinpanel(" pinwall reset", null, true);
            showoptions(content, "pin");
            return
        }
        const content = pinpanel();
        showoptions(content, "pin");
    })
}

// Handles the click event for setting lock time
function locktime() {
    $(document).on("click", "#locktime, #lock_time", function() {
        const locktime = get_setting("pinsettings", "locktime"),
            locktimeOptions = [{
                    "value": "0",
                    "text": "0 " + translate("minutes")
                },
                {
                    "value": "60000",
                    "text": "1 " + translate("minute")
                },
                {
                    "value": "300000",
                    "text": "5 " + translate("minutes")
                },
                {
                    "value": "600000",
                    "text": "10 " + translate("minutes")
                },
                {
                    "value": "900000",
                    "text": "15 " + translate("minutes")
                },
                {
                    "value": "1800000",
                    "text": "30 " + translate("minutes")
                },
                {
                    "value": "never",
                    "text": translate("never")
                }
            ],
            options = locktimeOptions.map(option =>
                "<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>" + option.value + "</span> " + option.text + "</div></li>"
            ).join("");
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
                                    "value": translate("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "locktime_formbox",
                "icon": "icon-clock",
                "title": translate("locktime"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
        $("#locktime_formbox ul.conf_options li").filter(function() {
            return $(this).find("span").text() === locktime;
        }).find(".radio").removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
    })
}

// Handles the submission of lock time settings
function submit_locktime() {
    $(document).on("click", "#locktime_formbox input.submit", function(e) {
        e.preventDefault();
        const thisvalue = $(this).prev("input").val(),
            titlepin = thisvalue === "never" ? "pincodedisabled" : "pincodeactivated";
        set_setting("pinsettings", {
            "locktime": thisvalue,
            "selected": titlepin
        }, translate(titlepin));
        canceldialog();
        canceloptions();
        savesettings();
    })
}

// Bip32 passphrase
// Handles the click event for BIP32 passphrase settings
function trigger_bip32() {
    $(document).on("click", "#bip39_passphrase", function() {
        if (glob_let.hasbip === true) {
            all_pinpanel({
                "func": manage_bip32
            }, null, true);
            return
        }
        manage_bip32();
    })
}

// Handles the click event for hiding the seed panel
function hide_seed_panel_trigger() {
    $(document).on("click", "#seed_steps .seed_step .ss_header .icon-cross", function() {
        hide_seed_panel();
    })
}

// Hides the seed panel
function hide_seed_panel() {
    glob_const.body.removeClass("seed_dialog");
    $("#seed_panel").attr("class", "");
    sleep();
}

// Back up
// Handles the click event for triggering database backup
function backupdatabasetrigger() {
    $(document).on("click", "#backup, #alert", function() {
        backupdatabase();
    })
}

// Performs the database backup
function backupdatabase() {
    if ($("#popup").hasClass("showpu")) {
        return
    }
    if (is_openrequest() === true) {
        return
    }
    const jsonencode = complilebackup(),
        filename = complilefilename(),
        changespush = [];
    $.each(glob_let.changes, function(key, value) {
        if (value > 0) {
            const nrchanges = (value == 1) ? translate("changein") : translate("changesin");
            changespush.push("<li>" + value + " " + nrchanges + " '" + translate(key) + "'</li>");
        }
    });
    const gd_active = (GD_pass().pass) ? true : false,
        alert_icon = $("#alert > span"),
        nr_changes = alert_icon.text(),
        alert_title = alert_icon.attr("title"),
        alert_txt = (nr_changes === "!") ? "<span class='warning'>! " + alert_title + " </span>" : "<p>" + translate("nrchanges", {
            "nr_changes": nr_changes
        }) + "</p>",
        showhidechangelog = gd_active ? "display:none" : "display:block",
        changenotification = ((!gd_active && glob_const.body.hasClass("haschanges")) || glob_const.html.hasClass("proxyupdate")) ? alert_txt : "",
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
                                                        "content": "<span class='icon-googledrive'></span> " + translate("backupwithgd")
                                                    },
                                                    "div": {
                                                        "id": "gdtrigger",
                                                        "class": "ait",
                                                        "content": switchpanel(gd_active, " custom")
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
                                    "style": showhidechangelog
                                },
                                "content": changenotification + "<ul>" + changespush.join("") + "</ul>"
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
                                            "href": "data:text/json;charset=utf-16le;base64," + jsonencode + "' download='" + filename,
                                            "title": filename,
                                            "data-date": new Date(now()).toLocaleString(langcode).replace(/\s+/g, '_').replace(/\:/g, '_'),
                                            "data-lastbackup": filename,
                                            "download": "download"
                                        },
                                        "content": translate("downloadbu")
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
                                    "data-url": jsonencode
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
            "title": translate("backup"),
            "elements": ddat
        });
    popdialog(content, "triggersubmit", null, true);
}

// Handles the switch for including secret phrase in backup
function sbu_switch() {
    $(document).on("mouseup", "#toggle_sbu_span .switchpanel", function() {
        const thistrigger = $(this),
            thisvalue = thistrigger.hasClass("true");
        if (thisvalue === true) {
            const result = confirm(translate("includesecretphrase"));
            if (result === false) {
                thistrigger.removeClass("true").addClass("false");
                return false;
            }
        }
        set_setting("backup", {
            "sbu": thisvalue
        });
        savesettings();
    })
}

// Handles sharing of backup
function sharebu() {
    $(document).on("click", "#share_bu", function() {
        const result = confirm(translate("sharebu"));
        if (result === true) {
            loader(true);
            loadertext(translate("generatebu"));
            const accountname = $("#accountsettings").data("selected");
            api_proxy({
                "custom": "system_bu",
                "api_url": true,
                "proxy": true,
                "params": {
                    "url": $(this).attr("data-url"),
                    "account": btoa(accountname)
                }
            }).done(function(e) {
                const br_cache = e.ping.br_cache,
                    filetime = br_cache.created_utc,
                    filetimesec = filetime ? filetime * 1000 : now(),
                    filetime_format = new Date(filetimesec).toLocaleString(langcode),
                    sharedtitle = translate("systembackup") + " " + accountname + " (" + filetime_format + ")",
                    set_proxy = c_proxy(),
                    r_dat = btoa(JSON.stringify({
                        "ro": br_cache.filename,
                        "proxy": set_proxy
                    }));
                shorten_url(sharedtitle, glob_const.approot + "?p=settings&sbu=" + r_dat, fetch_aws("img_system_backup.png"), true);
            }).fail(function(xhr, stat, err) {
                console.error("API proxy error:", xhr, stat, err);
                closeloader();
            });
        }
    })
}

// Checks and processes system backup
function check_systembu(sbu) {
    const ro_dat = stripb64(sbu),
        ro_id = ro_dat.ro,
        ro_proxy = ro_dat.proxy;
    api_proxy({
        "custom": "get_system_bu",
        "api_url": true,
        "proxy": true,
        "params": ro_id
    }, ro_proxy).done(function(e) {
        const ping = e.ping;
        if (ping) {
            const br_cache = ping.br_cache,
                server_time = br_cache.utc_timestamp,
                filetime = br_cache.created_utc,
                filetimesec = filetime ? filetime * 1000 : now(),
                filetime_format = new Date(filetimesec).toLocaleString(langcode),
                br_result = ping.br_result,
                base64 = br_result.base64,
                account = atob(br_result.account),
                sharedtitle = translate("systembackup") + " " + account + " (" + filetime_format + ")",
                bu_date = filetime_format.replace(/\s+/g, "_").replace(/\:/g, "_"),
                cache_time = br_cache.cache_time,
                expires_in = (filetime + cache_time) - server_time,
                filename = "bitrequest_system_backup_" + langcode + "_" + encodeURIComponent(account) + "_" + bu_date + ".json",
                cd = countdown(expires_in * 1000),
                cd_format = countdown_format(cd),
                cf_string = cd_format ? translate("expiresin") + cd_format : translate("fileexpired"),
                ddat = [{
                    "div": {
                        "id": "dialogcontent",
                        "content": [{
                                "h1": {
                                    "content": sharedtitle
                                },
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
                                                    "content": translate("downloadbu")
                                                },
                                                "div": {
                                                    "id": "restore_bu",
                                                    "class": "button icon-share2",
                                                    "attr": {
                                                        "data-base64": base64,
                                                        "data-filename": filename
                                                    },
                                                    "content": translate("installlbu")
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
                    "title": translate("systembackup"),
                    "elements": ddat
                }) + "<div id='backupactions'><div id='backupcd'>" + cancelbttn + "</div></div>";
            popdialog(content, "triggersubmit", null, true);
        } else {
            systembu_expired();
        }
    }).fail(function(xhr, stat, err) {
        if (get_next_proxy()) {
            check_systembu(sbu);
            return
        }
        console.error("API proxy error:", xhr, stat, err);
        systembu_expired();
    });
}

// Decodes base64 string and returns JSON object
function stripb64(ab) {
    const b64 = ab.indexOf("%") > -1 ? ab.substr(0, ab.indexOf("%")) : ab;
    return JSON.parse(atob(b64));
}

// Displays message for expired system backup
function systembu_expired() {
    const content = render_html([{
            "div": {
                "id": "system_backupformbox",
                "class": "formbox",
                "content": "<h2 class='icon-download'>" + translate("fileexpired") + "</h2>"
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

// Handles the restoration of system backup
function restore_systembu() {
    $(document).on("click", "#system_backupformbox #restore_bu", function() {
        const result = confirm(translate("installsb"));
        if (result === true) {
            const this_bttn = $(this),
                bu_dat = this_bttn.attr("data-base64"),
                j_filename = this_bttn.attr("data-filename"),
                j_object = JSON.parse(atob(bu_dat));
            restore(j_object, j_filename)
        }
    })
}

// Handles cancellation of backup dialog
function backupcd() {
    $(document).on("click", "#backupcd", function() {
        canceldialog();
    })
}

// Compiles backup data from localStorage
function complilebackup() {
    const jsonfile = [],
        excludedKeys = [
            "bitrequest_symbols", "bitrequest_changes", "bitrequest_erc20tokens_init", "bitrequest_erc20tokens",
            "bitrequest_editurl", "bitrequest_recent_requests", "bitrequest_backupfile_id",
            "bitrequest_appstore_dialog", "bitrequest_init", "bitrequest_k",
            "bitrequest_awl", "bitrequest_dat", "bitrequest_tp"
        ];
    for (let key in localStorage) {
        const value = localStorage.getItem(key);
        if (value === null || excludedKeys.includes(key)) {
            continue;
        } else if (key === "bitrequest_bpdat") {
            const not_verified = (glob_let.io.bipv !== "yes");
            if (not_verified || (glob_let.test_derive === true && get_setting("backup", "sbu") === true)) {
                const val_obj = JSON.parse(value);
                val_obj.dat = null;
                jsonfile.push('"' + key + '":' + JSON.stringify(val_obj));
            }
        } else {
            jsonfile.push('"' + key + '":' + value);
        }
    }
    return btoa("{" + jsonfile.join(",") + "}");
}

// Generates a filename for the backup file
function complilefilename() {
    return "bitrequest_backup_" + langcode + "_" + new Date(now()).toLocaleString(langcode).replace(/\s+/g, "_").replace(/\:/g, "_") + ".json";
}

// Handles the submission of backup download
function submitbackup() {
    $(document).on("click", "#triggerdownload", function(e) {
        if (glob_const.body.hasClass("ios")) {
            e.preventDefault();
            notify(translate("noiosbu"));
            return
        }
        const thisnode = $(this),
            href = thisnode.attr("href"),
            title = thisnode.attr("title"),
            result = confirm(translate("downloadfile", {
                "file": title
            }));
        if (result === false) {
            e.preventDefault();
            return
        }
        const lastsaved = "last backup: " + thisnode.attr("data-date"),
            lastbackup = thisnode.attr("data-lastbackup");
        set_setting("backup", {
            "titlebackup": lastsaved,
            "lastbackup": lastbackup,
            "device": "folder-open"
        }, lastsaved);
        savesettings("noalert");
        resetchanges();
        canceldialog();
        notify(translate("downloaded", {
            "file": lastbackup
        }));
    })
}

// Restore backup
// Initiates the restore process from backup
function restorefrombackup() {
    $(document).on("click", "#restore, #rshome", function() {
        trigger_restore();
    })
}

// Triggers the restore process and displays the restore dialog
function trigger_restore() {
    glob_let.backup_active = false;
    const restorenode = $("#restore"),
        backupnode = $("#backup"),
        lastfileused = restorenode.data("fileused"),
        lastdevice = restorenode.data("device"),
        deviceused = lastdevice === "folder-open" ? "" : "google-drive",
        lastfileusedstring = lastfileused ? "<p class='icon-" + deviceused + "'>" + translate("lastrestore") + "<br/><span class='icon-" + lastdevice + "'>" + lastfileused + "</span></p>" : "",
        lastbackup = backupnode.data("lastbackup"),
        lastbudevice = backupnode.data("device"),
        lastbackupdevice = lastbudevice === "folder-open" ? "" : "google-drive",
        lastbackupstring = lastbackup ? "<p class='icon-" + lastbackupdevice + "'>" + translate("lastbackup") + "<br/><span class='icon-" + lastbudevice + "'>" + lastbackup + "</span></p>" : "",
        gd_active = GD_pass().pass,
        showhidegd = gd_active ? "display:none" : "display:block",
        ddat = [{
                "div": {
                    "id": "gd_meta",
                    "content": lastfileusedstring + lastbackupstring
                }
            },
            {
                "div": {
                    "id": "listappdata",
                    "content": "<h3 class='icon-googledrive'>" + translate("restorewithgd") + switchpanel(gd_active, " custom") + "</h3>"
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
                                "style": showhidegd
                            },
                            "content": "<h3 class='icon-folder-open'>" + translate("restorefromfile") + "</h3><input type='file' id='fileupload'/><input type='submit' class='submit' value='" + translate("okbttn") + "'/>"
                        }
                    }]
                }
            }
        ],
        content = template_dialog({
            "id": "restoreformbox",
            "icon": "icon-upload",
            "title": translate("restore"),
            "elements": ddat
        });
    popdialog(content, "triggersubmit");
    if (gd_active) {
        listappdata();
    }
}

// Handles file selection for backup restoration
function restorebackup() {
    $(document).on("change", "#fileupload", function(n) {
        const file = this.files[0],
            filesize = file.size,
            filetype = file.type;
        glob_let.backup_filename = file.name;
        if (filesize > 5242880) {
            n.preventDefault();
            popnotify("error", translate("filesize"));
            return
        }
        if (filetype === "application/json") {
            const reader = new FileReader();
            reader.onload = function(e) {
                glob_let.backup_result = e.target.result;
                glob_let.backup_active = true;
            };
            reader.readAsDataURL(file);
            return
        }
        const filetypewarningtext = translate("filetype", {
            "filetype": filetype
        });
        popnotify("error", filetypewarningtext);
    })
}

// Handles the submission of restore process
function submitrestore() {
    $(document).on("click", "#restoreformbox input.submit", function(e) {
        e.preventDefault();
        const switchpanel = $("#popup #listappdata .switchpanel");
        if (switchpanel.hasClass("true")) {
            topnotify(translate("selectbackup"));
            return
        }
        if (glob_let.backup_active === true) {
            if (glob_let.backup_result) {
                const jsonobject = JSON.parse(atob(glob_let.backup_result.substr(glob_let.backup_result.indexOf(",") + 1)));
                restore(jsonobject, glob_let.backup_filename);
                return
            }
            topnotify(translate("error"));
            return
        }
        topnotify(translate("selectbackup"));
    })
}

// Initiates the restore process
function restore(jsonobject, bu_filename) {
    if (!check_backup(jsonobject)) {
        return;
    }
    const result = confirm(translate("restorefile", {
        "file": bu_filename
    }));
    if (result) {
        if (isteaminvite(jsonobject)) {
            install_teaminvite(jsonobject, bu_filename, false);
            return;
        }
        scan_restore(jsonobject);
        const pass_dat = {
            "jasobj": jsonobject,
            "filename": bu_filename,
            "type": "file"
        };
        restore_algo(pass_dat);
    }
}

// Checks if the backup is valid
function check_backup(jsonobject) {
    const is_team_invite = isteaminvite(jsonobject);
    if (glob_let.cashier_dat && glob_let.cashier_dat.cashier && !is_team_invite) {
        notify(translate("cashiernotallowed"));
        return false;
    }
    return true;
}

// Handles the restoration process from Google Drive
function submit_GD_restore() {
    $(document).on("click", "#gd_backuplist .restorefile", function() {
        const thisfield = $(this).parent("li"),
            thisdevice = thisfield.attr("data-device"),
            result = confirm(translate("restorefromdevice", {
                "file": thisfield.text(),
                "device": thisdevice
            }));
        if (result) {
            const thisfileid = thisfield.attr("data-gdbu_id"),
                p = GD_pass();
            if (p.pass) {
                api_proxy({
                    "api_url": "https://www.googleapis.com/drive/v3/files/" + thisfileid + "?alt=media",
                    "proxy": false,
                    "params": {
                        "method": "GET",
                        "mimeType": "text/plain",
                        "headers": {
                            "Authorization": "Bearer " + p.token
                        }
                    }
                }).done(function(e) {
                    const jsonobject = JSON.parse(atob(e));
                    scan_restore(jsonobject);
                    const pass_dat = {
                        "jasobj": jsonobject,
                        "filename": thisfield.text(),
                        "thisfileid": thisfileid,
                        "thisdevice": thisdevice,
                        "thisdeviceid": thisfield.attr("data-device-id"),
                        "type": "gd"
                    };
                    restore_algo(pass_dat);
                }).fail(function(xhr, stat, err) {
                    console.error("API request failed:", stat, err);
                    if (textStatus === "error") {
                        notify(errorThrown === "Unauthorized" ? translate("unauthorized") : translate("error"));
                    }
                });
            }
        }
    })
}

// Function to scan and restore data from a JSON object
function scan_restore(jsonobject) {
    // Initialize global result object
    glob_let.resd = {
        "pcnt": 0
    }
    // Extract bitrequest backup data
    const bpdat = jsonobject.bitrequest_bpdat;
    if (bpdat) {
        // Attempt to decode the backup data
        const can_dec = bpdat.dat ? s_decode(bpdat) : bpdat.datenc ? s_decode(bpdat.datenc) : false;
        // Set flags for successful backup unit and same backup ID
        glob_let.resd.sbu = true;
        glob_let.resd.samebip = (bpdat.id === glob_let.bipid);
        // Store decoded backup data
        glob_let.resd.bpdat = can_dec;
    }
}


// Algorithm to handle restoration process based on provided data
function restore_algo(pass_dat) {
    const cbu = check_backup(pass_dat);
    if (cbu === false) {
        return false;
    }
    if (glob_let.resd.sbu) { // has seed backup
        if (glob_let.resd.samebip === true) {
            // keep existing phrase
            restore_callback(pass_dat, false);
        } else if (glob_let.hasbip === true) {
            dphrase_dialog(pass_dat);
        } else if (glob_let.resd.bpdat) {
            // import and check decode
            restore_callback(pass_dat, true);
        } else {
            pin_dialog(pass_dat, "restore_callback");
        }
    } else {
        restore_callback(pass_dat, false);
    }
}

// Callback function to handle different types of restoration
function restore_callback(pass_dat, newphrase) {
    const type = pass_dat.type;
    if (type) {
        if (type === "gd") {
            restore_callback_gd(pass_dat, newphrase);
            return
        }
        if (type === "file") {
            restore_callback_file(pass_dat, newphrase);
            return
        }
    }
    return false
}

// Function to decode encrypted data using a pin hash
function s_decode(pdat, phash) {
    const pinhash = phash || $("#pinsettings").data("pinhash");
    if (!pinhash || !pdat) {
        return false;
    }
    const keystring = ptokey(pinhash, pdat.id),
        decrypt = aes_dec(pdat.dat, keystring);
    if (!decrypt) {
        return false;
    }
    const unquote = decrypt.replace(/['"]+/g, "");
    try {
        const dec = JSON.parse(atob(unquote)),
            pid = dec.pid;
        if (pid) {
            return {
                "dat": unquote,
                "id": pid
            };
        }
    } catch (error) {
        console.error("Error parsing decoded data:", error);
    }
    return false;
}

// Function to display a PIN entry dialog
function pin_dialog(pass_dat, cb) {
    canceldialog();
    const pinsettings = $("#pinsettings").data(),
        current_timeout = pinsettings.timeout;
    if (current_timeout) {
        const timeleft = current_timeout - now();
        if (timeleft > 0) {
            lockscreen(current_timeout);
            return false
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
                                "value": translate("okbttn")
                            }
                        }
                    }
                ]
            }
        }],
        content = $(template_dialog({
            "id": "pindialog",
            "icon": "icon-lock",
            "title": translate("fourdigitpin"),
            "elements": ddat
        })).data({
            "pass_dat": pass_dat,
            "cb": cb
        });
    setTimeout(function() {
        popdialog(content, "triggersubmit");
    }, 700);
}

// Event handler for PIN dialog submission
function submit_pin_dialog() {
    $(document).on("click", "#pindialog input.submit", function(e) {
        e.preventDefault();
        const thisinput = $(this).prev("input"),
            thisvalue = thisinput.val();
        if (!thisvalue.length) {
            popnotify("error", translate("fourdigitpin"));
            return
        }
        const dialog = $("#dialog"),
            pdat = $("#pindialog").data(),
            pass_dat = pdat.pass_dat,
            jasobj = pass_dat.jasobj;
        if (!jasobj) {
            return
        }
        const pbdat = jasobj.bitrequest_bpdat,
            pbdat_eq = pbdat.dat ? pbdat : pbdat.datenc,
            can_dec = s_decode(pbdat_eq, hashcode(thisvalue));
        if (can_dec) {
            glob_let.resd.pcnt = 0;
            const callback = pdat.cb;
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
            notify(translate("success") + "!");
            return
        }
        if (glob_let.resd.pcnt > 1) {
            $("#pinsettings").data("timeout", now() + 300000); // 5 minutes
            topnotify(translate("maxattempts"));
            const result = confirm(translate("restorewithoutsecretphrase") + "?");
            if (result === true) {
                restore_callback(pass_dat, false);
            }
            glob_let.resd.pcnt = 0;
            canceldialog();
        } else {
            glob_let.resd.pcnt += 1;
        }
        savesettings();
        shake(dialog);
        thisinput.val("");
    })
}

// Initialize addresses after restoration callback
function restore_cb_init_addresses() {
    br_set_local("tp", now());
    const initdat = br_get_local("init", true),
        iodat = br_dobj(initdat, true);
    delete iodat.bipv;
    br_set_local("init", iodat, true);
}

// Callback for file-based restoration
function restore_callback_file(pass_dat, np) {
    const newphrase = glob_let.hasbip === true ? np : true;
    restorestorage(pass_dat.jasobj, newphrase);
    rendersettings(["restore", "backup", "pinsettings"]); // exclude restore and backup settings
    const lastrestore = "last restore: " + new Date(now()).toLocaleString(langcode).replace(/\s+/g, "_");
    set_setting("restore", {
        "titlerestore": lastrestore,
        "fileused": pass_dat.filename,
        "device": "folder-open"
    }, lastrestore);
    savesettings("noalert");
    if (newphrase === true) {
        restore_cb_init_addresses();
    }
    resetchanges();
    glob_const.w_loc.href = glob_const.w_loc.pathname + "?p=settings";
}

// Callback for Google Drive based restoration
function restore_callback_gd(pass_dat, np) {
    const newphrase = (glob_let.hasbip === true) ? np : true;
    restorestorage(pass_dat.jasobj, newphrase);
    rendersettings(["restore", "backup", "pinsettings"]); // exclude restore and backup settings
    const lastrestore = "last restore: " + new Date(now()).toLocaleString(langcode).replace(/\s+/g, "_");
    set_setting("restore", {
        "titlerestore": lastrestore,
        "fileused": pass_dat.filename,
        "device": pass_dat.thisdevice
    }, lastrestore);
    setTimeout(function() {
        savesettings("noalert");
        createfile(); // create new file from backup
        if (pass_dat.thisdeviceid === glob_const.deviceid) {
            const p = GD_pass();
            if (p.pass) {
                deletefile(pass_dat.thisfileid, null, p.token); // delete old backup file
            }
        }
        if (newphrase === true) {
            restore_cb_init_addresses();
        }
        resetchanges();
        setTimeout(function() {
            glob_const.w_loc.href = glob_const.w_loc.pathname + "?p=settings";
        }, 300);
    }, 300);
}

// Function to display a dialog for handling different secret phrases during restoration
function dphrase_dialog(pass_dat) {
    canceldialog();
    const sfb = translate("usesecretphrasefrombackup"),
        kcs = translate("keepcurrentsecretphrase"),
        ddat = [{
                "ul": {
                    "class": "conf_options noselect",
                    "content": "<li><div class='pick_conf'><div class='radio icon-radio-checked2'></div><span>" + sfb + "</span></div></li>\
                <li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>" + kcs + "</span></div></li>"
                },
                "div": {
                    "id": "compare_seeds",
                    "class": "ref",
                    "content": translate("comparesecretphrases")
                }
            },
            {
                "div": {
                    "id": "compare_box",
                    "content": [{
                            "div": {
                                "id": "bu_sbox",
                                "class": "swrap",
                                "content": "<strong>" + translate("secretphrasefrombackup") + "</strong><div class='sbox'></div>"
                            }
                        },
                        {
                            "div": {
                                "id": "ext_sbox",
                                "class": "swrap",
                                "content": "<strong>" + translate("currentsecretphrase") + "</strong><div class='sbox'></div>"
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
                                    "value": sfb
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": translate("okbttn")
                                }
                            }
                        }
                    ]
                }
            }
        ],
        content = $(template_dialog({
            "id": "importseedbox",
            "title": "<span class='icon-warning' style='color:#B33A3A'></span>" + translate("differentsecretphrase"),
            "elements": ddat
        })).data(pass_dat);
    setTimeout(function() {
        popdialog(content, "triggersubmit");
    }, 700);
}

// Event handler for submitting the different phrase dialog
function submit_dphrase() {
    $(document).on("click", "#importseedbox input.submit", function(e) {
        e.preventDefault();
        const thistrigger = $(this),
            thisvalue = thistrigger.prev("input").val();
        if (thisvalue === translate("usesecretphrasefrombackup")) {
            restore_bu_seed();
        } else if (thisvalue === translate("keepcurrentsecretphrase")) {
            keep_current_seed();
        }
        return false;
    })
}

// Function to keep the current seed during restoration
function keep_current_seed() {
    const result = confirm(translate("keepexistingsecretphrase"));
    if (result) {
        const is_dialog = $("#importseedbox"),
            bu_dat = is_dialog.data();
        restore_callback(bu_dat, false);
    }
}

// Function to restore using the backup seed
function restore_bu_seed() {
    const is_dialog = $("#importseedbox"),
        bu_dat = is_dialog.data();
    if (!glob_let.resd.bpdat && !is_dialog.hasClass("verified")) {
        pin_dialog(bu_dat, "bu_oldseed");
        return false;
    }
    bu_oldseed(bu_dat);
}

// Function to handle old seed backup
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

// Event handler for comparing seeds
function compare_seeds() {
    $(document).on("click", "#compare_seeds", function() {
        const comparebox = $("#compare_box");
        if (comparebox.is(":visible")) {
            comparebox.slideUp(200);
            return
        }
        const checktext = $("#ext_sbox .sbox").text();
        if (checktext.length < 20) {
            const is_dialog = $("#importseedbox"),
                bu_dat = is_dialog.data(),
                jasobj = bu_dat.jasobj;
            if (jasobj) {
                const pbdat = jasobj.bitrequest_bpdat,
                    pbdat_eq = pbdat.dat ? pbdat : pbdat.datenc;
                if (pbdat_eq && !glob_let.resd.bpdat) {
                    const enterpin = prompt(translate("fourdigitpin")),
                        can_dec = s_decode(pbdat_eq, hashcode(enterpin));
                    if (can_dec) {
                        glob_let.resd.bpdat = can_dec;
                        is_dialog.addClass("verified");
                        cs_callback(true)
                    } else {
                        popnotify("error", translate("wrongpin"));
                        shake(is_dialog);
                    }
                    return false;
                }
            }
            cs_callback();
            return
        }
        comparebox.slideDown(200);
    })
}

// Callback function for comparing seeds
function cs_callback(pass) {
    const existing_so = ls_phrase_obj(),
        backup_so = ls_phrase_obj_parsed(glob_let.resd.bpdat),
        compare = {
            "s1": existing_so.pob.slice(0, 3),
            "s2": backup_so.pob.slice(0, 3)
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

// Function to display the comparison of seeds
function compare_seeds_callback(compare) {
    $("#ext_sbox .sbox").text(compare.s1.join(" ") + " ...");
    $("#bu_sbox .sbox").text(compare.s2.join(" ") + " ...");
    $("#compare_box").slideDown(200);
}

// Function to restore storage data from JSON object
function restorestorage(jsonobject, newphrase) {
    $.each(jsonobject, function(key, value) {
        if (key === "bitrequest_bpdat") {
            if (glob_let.test_derive === true && newphrase === true && glob_let.resd.bpdat) {
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

// CSV Export
// Event handler for triggering CSV export
function csvexport_trigger() {
    $(document).on("click", "#csvexport", function() {
        const rq_arr = br_get_local("requests", true),
            archive_arr = br_get_local("archive", true),
            has_requests = rq_arr && !empty_obj(rq_arr),
            has_archive = archive_arr && !empty_obj(archive_arr);
        if (has_requests || has_archive) {
            const filename = "bitrequest_csv_export_" + new Date(now()).toLocaleString(langcode).replace(/\s+/g, "_").replace(/:/g, "_") + ".csv",
                show_archive = has_requests ? "false" : "true",
                content = "<div class='formbox' id='exportcsvbox'>\
                    <h2 class='icon-table'>" + translate("csvexport") + "</h2>\
                    <div class='popnotify'></div>\
                    <div id='ad_info_wrap'>\
                        <ul id='ecsv_options'>\
                            <li class='escv_heading'>\
                                <strong>Info</strong>\
                            </li>\
                            <li id='escv_from'>\
                                <span>" + translate("from") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_desc'>\
                                <span>" + translate("title") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_address'>\
                                <span>" + translate("receivingaddress") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li class='escv_heading'>\
                                <strong>" + translate("status") + "</strong>\
                            </li>\
                            <li id='escv_paid'>\
                                <span>" + translate("paid") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_ins'>\
                                <span>" + translate("insufficient") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_new'>\
                                <span>" + translate("new") + "</span><div class='switchpanel false global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_pending'>\
                                <span>" + translate("pending") + "</span><div class='switchpanel false global'><div class='switch'></div></div>\
                            </li>\
                            <li class='escv_heading'>\
                                <strong>" + translate("type") + "</strong>\
                            </li>\
                            <li id='escv_pos'>\
                                <span>" + translate("point of sale") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_outgoing'>\
                                <span>" + translate("outgoing") + "</span><div class='switchpanel true global'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_incoming'>\
                                <span>" + translate("incoming") + "</span><div class='switchpanel false global'><div class='switch'></div></div>\
                            </li>\
                            <li class='noline'>\
                                <strong></strong>\
                            </li>\
                            <li id='escv_archive'>\
                                <span>" + translate("includearchive") + "</span><div class='switchpanel global " + show_archive + "'><div class='switch'></div></div>\
                            </li>\
                            <li id='escv_receipt'>\
                                <span>" + translate("includereceipt") + " (PDF download)</span><div class='switchpanel false global'><div class='switch'></div></div>\
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
            return;
        }
        playsound(glob_const.funk);
        notify(translate("nocsvexports"));
    });
}

// Event handler for submitting CSV export
function submit_csvexport() {
    $(document).on("click", "#trigger_csvexport", function(e) {
        if (glob_const.body.hasClass("ios")) {
            e.preventDefault();
            notify(translate("noiosbu"));
            return false;
        }
        const thisnode = $(this),
            csv_encode = complile_csv(),
            d_url = "data:text/csv;charset=utf-16le;base64," + csv_encode;
        thisnode.attr("href", d_url);
        const title = thisnode.attr("title"),
            result = confirm(translate("downloadfile", {
                "file": title
            }));
        if (result === false) {
            e.preventDefault();
            return false;
        }
        canceldialog();
        notify(translate("downloaded", {
            "file": "CSV"
        }));
    });
}

// Compiles the CSV data from requests and archive
function complile_csv() {
    const rq_arr = br_get_local("requests", true),
        archive_arr = br_get_local("archive", true),
        has_archive = archive_arr && !empty_obj(archive_arr),
        csv_arr = [],
        options_li = $("#exportcsvbox #ecsv_options"),
        op_from = options_li.find("li#escv_from .switchpanel"),
        op_desc = options_li.find("li#escv_desc .switchpanel"),
        op_address = options_li.find("li#escv_address .switchpanel"),
        op_paid = options_li.find("li#escv_paid .switchpanel"),
        op_ins = options_li.find("li#escv_ins .switchpanel"),
        op_new = options_li.find("li#escv_new .switchpanel"),
        op_pending = options_li.find("li#escv_pending .switchpanel"),
        op_pos = options_li.find("li#escv_pos .switchpanel"),
        op_outgoing = options_li.find("li#escv_outgoing .switchpanel"),
        op_incoming = options_li.find("li#escv_incoming .switchpanel"),
        op_receipt = options_li.find("li#escv_receipt .switchpanel"),
        op_archive = options_li.find("li#escv_archive .switchpanel"),
        incl_from = op_from.hasClass("true"),
        incl_desc = op_desc.hasClass("true"),
        incl_address = op_address.hasClass("true"),
        incl_paid = op_paid.hasClass("true"),
        incl_ins = op_ins.hasClass("true"),
        incl_new = op_new.hasClass("true"),
        incl_pending = op_pending.hasClass("true"),
        incl_pos = op_pos.hasClass("true"),
        incl_outgoing = op_outgoing.hasClass("true"),
        incl_incoming = op_incoming.hasClass("true"),
        incl_receipt = op_receipt.hasClass("true"),
        incl_archive = op_archive.hasClass("true"),
        rq_obj = has_archive && incl_archive ? rq_arr.concat(archive_arr) : rq_arr;
    $.each(rq_obj, function(i, val) {
        const csv_request = {},
            payment = val.payment,
            address = val.address,
            amount = val.amount,
            uoa = val.uoa,
            status = val.status,
            txhash = val.txhash || "",
            lnhash = txhash && txhash.slice(0, 9) === "lightning",
            lightning = val.lightning,
            hybrid = lightning && lightning.hybrid === true,
            lnd_string = lnhash ? " (lightning)" : "",
            rqname = val.requestname || "",
            description = val.requesttitle || "",
            type = val.requesttype,
            timestamp = val.timestamp,
            receivedamount = val.receivedamount,
            ccsymbol = val.currencysymbol,
            fiatvalue = val.fiatvalue,
            fiatcurrency = val.fiatcurrency,
            pts = val.paymenttimestamp,
            pdf_url = get_pdf_url(val),
            received_ts = pts ? short_date(pts) : "",
            layer = val.eth_layer2,
            network = getnetwork(layer),
            nw_string = network || "";
        if (shouldIncludeRequest(status, type, incl_paid, incl_ins, incl_new, incl_pending, incl_pos, incl_outgoing, incl_incoming)) {
            if (incl_from) {
                csv_request[transclear("from")] = rqname;
            }
            if (incl_desc) {
                csv_request[transclear("title")] = description;
            }
            csv_request[transclear("currency")] = payment + lnd_string;
            csv_request[transclear("status")] = transclear(status);
            csv_request[transclear("network")] = nw_string;
            const rq_type = type === "local" ? "point of sale" : type;
            csv_request[transclear("type")] = transclear(rq_type);
            csv_request[transclear("created")] = short_date(timestamp);
            csv_request[transclear("amount")] = amount + " " + uoa;
            const ra_val = receivedamount ? receivedamount + " " + ccsymbol : "",
                paidreceived = type === "incoming" ? transclear("paid") : transclear("received"),
                pttitle = transclear("amount") + " " + transclear("received") + " / " + transclear("paid"),
                fv = fiatvalue ? fiatvalue.toFixed(2) + " " + fiatcurrency : "";
            csv_request[pttitle] = ra_val + " (" + paidreceived + ")";
            csv_request[transclear("fiatvalue")] = fv;
            csv_request[transclear("sendon")] = received_ts;
            if (incl_address) {
                csv_request[transclear("receivingaddress")] = address;
            }
            csv_request.txhash = txhash;
            if (incl_receipt) {
                csv_request["PDF download (" + transclear("receipt") + ")"] = pdf_url;
            }
            csv_arr.push(csv_request);
        }
    });
    const csv_body = render_csv(csv_arr);
    return btoa(csv_body);
}

// Helper function to determine if a request should be included in the CSV
function shouldIncludeRequest(status, type, incl_paid, incl_ins, incl_new, incl_pending, incl_pos, incl_outgoing, incl_incoming) {
    if (!incl_paid && status === "paid") return false;
    if (!incl_ins && status === "insufficient") return false;
    if (!incl_new && status === "new") return false;
    if (!incl_pending && status === "pending") return false;
    if (!incl_pos && type === "local") return false;
    if (!incl_outgoing && type === "outgoing") return false;
    if (!incl_incoming && type === "incoming") return false;
    return true;
}

// Renders the CSV data into a string format
function render_csv(arr) {
    const header_arr = [],
        inner_header_arr = [],
        body_arr = [];
    $.each(arr[0], function(key, value) {
        inner_header_arr.push(key);
    });
    header_arr.push(inner_header_arr.join(","));
    $.each(arr, function(i, val) {
        const inner_body_arr = [];
        $.each(val, function(key, value) {
            const ctd = value.replace(/,/g, ".");
            inner_body_arr.push(ctd);
        });
        body_arr.push(inner_body_arr.join(","));
    });
    const doc_arr = header_arr.concat(body_arr);
    return doc_arr.join("\n");
}

// Handles sharing of the CSV export
function share_csv() {
    $(document).on("click", "#share_csv", function() {
        const csv_encode = complile_csv(),
            result = confirm(translate("sharecsvexport"));
        if (result) {
            loader(true);
            loadertext(translate("generatebu"));
            const accountname = $("#accountsettings").data("selected");
            api_proxy({
                "custom": "system_bu",
                "api_url": true,
                "proxy": true,
                "params": {
                    "url": csv_encode,
                    "account": btoa(accountname)
                }
            }).done(function(e) {
                const br_cache = e.ping.br_cache,
                    filetime = br_cache.created_utc,
                    filetimesec = filetime ? filetime * 1000 : now(),
                    filetime_format = new Date(filetimesec).toLocaleString(langcode),
                    sharedtitle = "CSV Export " + accountname + " (" + filetime_format + ")",
                    set_proxy = c_proxy(),
                    r_dat = btoa(JSON.stringify({
                        "ro": br_cache.filename,
                        "proxy": set_proxy
                    }));
                shorten_url(sharedtitle, glob_const.approot + "?p=settings&csv=" + r_dat, fetch_aws("img_system_backup.png"), true);
            }).fail(function(xhr, stat, err) {
                closeloader();
            });
        }
    })
}

// Checks and processes the CSV export data
function check_csvexport(csv) {
    const ro_dat = stripb64(csv),
        ro_id = ro_dat.ro,
        ro_proxy = ro_dat.proxy;
    api_proxy({
        "custom": "get_system_bu",
        "api_url": true,
        "proxy": true,
        "params": ro_id
    }, ro_proxy).done(function(e) {
        const ping = e.ping;
        if (ping) {
            const br_cache = ping.br_cache,
                server_time = br_cache.utc_timestamp,
                filetime = br_cache.created_utc,
                filetimesec = filetime ? filetime * 1000 : now(),
                filetime_format = new Date(filetimesec).toLocaleString(langcode),
                br_result = ping.br_result,
                base64 = br_result.base64,
                account = atob(br_result.account),
                sharedtitle = "CSV Export " + account + " (" + filetime_format + ")",
                bu_date = filetime_format.replace(/\s+/g, "_").replace(/\:/g, "_"),
                cache_time = br_cache.cache_time,
                expires_in = (filetime + cache_time) - server_time,
                filename = "bitrequest_csv_export_" + encodeURIComponent(account) + "_" + bu_date + ".csv",
                cd = countdown(expires_in * 1000),
                cd_format = countdown_format(cd),
                cf_string = cd_format ? translate("expiresin") + " " + cd_format : translate("fileexpired"),
                ddat = [{
                    "div": {
                        "id": "dialogcontent",
                        "content": [{
                                "h1": {
                                    "content": sharedtitle
                                },
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
                                                        "data-date": bu_date,
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
                    "title": translate("csvexport"),
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

// Handles the submission of CSV download
function submit_csvdownload() {
    $(document).on("click", "#trigger_csvdownload", function(e) {
        if (glob_const.body.hasClass("ios")) {
            e.preventDefault();
            notify(translate("noiosbu"));
            return false;
        }
        const thisnode = $(this),
            href = thisnode.attr("href"),
            title = thisnode.attr("title"),
            result = confirm(translate("downloadfile", {
                "file": title
            }));
        if (result === false) {
            e.preventDefault();
            return false;
        }
        canceldialog();
        notify(translate("downloaded", {
            "file": "CSV"
        }));
    })
}

// Url shortener
// Event handler for URL shortener settings
function urlshortener() {
    $(document).on("click", "#url_shorten_settings", function() {
        const us_settings = $("#url_shorten_settings"),
            us_data = us_settings.data(),
            us_source = us_data.selected,
            us_val = us_source == "inactive" ? "firebase" : us_source,
            firebase_apikey = us_data.fbapikey || "",
            bitly_accestoken = us_data.bitly_at || "",
            us_active = us_data.us_active,
            us_is_active = us_active === "active",
            shformclass = us_is_active ? "" : " hide",
            firebase_class = us_val === "firebase" ? "" : " hide",
            bitly_class = us_val === "bitly" ? "" : " hide",
            headericon = us_val === "firebase" ? "icon-firebase" :
            us_val === "bitly" ? "icon-bitly" : "",
            ddat = [{
                    "div": {
                        "id": "toggle_urlshortener",
                        "class": "clearfix",
                        "content": "<h3 class='" + headericon + "'>" + translate("enable") + " " + translate("url_shorten_settings") + switchpanel(us_is_active, " global") + "</h3>"
                    }
                },
                {
                    "div": {
                        "class": "popform" + shformclass,
                        "attr": {
                            "data-currentapi": us_val
                        },
                        "content": [{
                                "div": {
                                    "class": "selectbox",
                                    "content": [{
                                            "input": {
                                                "attr": {
                                                    "type": "text",
                                                    "value": us_val,
                                                    "placeholder": translate("choose") + " " + translate("url_shorten_settings"),
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
                                                "content": "<span data-pe='none'>firebase</span><span data-pe='none'>bitly</span><span data-pe='none'>" + d_proxy() + "</span>"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "input": {
                                    "class": "firebase_api_input" + firebase_class,
                                    "attr": {
                                        "type": "text",
                                        "value": firebase_apikey,
                                        "placeholder": "Firebase " + translate("apikey"),
                                        "data-apikey": firebase_apikey,
                                        "data-checkchange": firebase_apikey
                                    }
                                }
                            },
                            {
                                "input": {
                                    "class": "bitly_api_input" + bitly_class,
                                    "attr": {
                                        "type": "text",
                                        "value": bitly_accestoken,
                                        "placeholder": "Bitly " + translate("apikey"),
                                        "data-apikey": bitly_accestoken,
                                        "data-checkchange": bitly_accestoken
                                    }
                                }
                            },
                            {
                                "input": {
                                    "class": "submit",
                                    "attr": {
                                        "type": "submit",
                                        "value": translate("okbttn")
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
                "title": translate("choose") + " " + translate("url_shorten_settings"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

// Toggles URL shortener on/off
function togglebl() {
    $(document).on("mouseup", "#toggle_urlshortener .switchpanel", function(e) {
        const thispanel = $(this),
            thisform = $("#usformbox .popform");
        let us_state,
            us_title;
        if (thispanel.hasClass("true")) {
            const thisinput = thisform.find("input:first"),
                thisvalue = thisinput.val();
            us_state = "active",
                us_title = thisvalue;
            thisform.slideDown(300);
        } else {
            const result = confirm(translate("disableshorturls"));
            if (result) {
                us_state = "inactive",
                    us_title = "inactive";
                thisform.slideUp(300);
            } else {
                thispanel.addClass("true").removeClass("false");
                e.preventDefault();
                return false;
            }
        }
        set_setting("url_shorten_settings", {
            "selected": us_title,
            "us_active": us_state
        }, us_title);
        savesettings();
        thispanel.addClass("us_changed");
    })
}

// Handles selection of URL shortener service
function pick_urlshortener_select() {
    $(document).on("click", "#usformbox .selectbox > .options span", function() {
        const thisselect = $(this),
            thisvalue = thisselect.text(),
            thisform = thisselect.closest(".popform"),
            firebase_api_input = thisform.find("input.firebase_api_input"),
            bitly_api_input = thisform.find("input.bitly_api_input"),
            dialogheader = $("#usformbox h3");
        if (thisvalue === "firebase") {
            firebase_api_input.removeClass("hide");
            bitly_api_input.addClass("hide");
            dialogheader.attr("class", "icon-firebase");
        } else if (thisvalue === "bitly") {
            firebase_api_input.addClass("hide");
            bitly_api_input.removeClass("hide");
            dialogheader.attr("class", "icon-bitly");
        } else {
            firebase_api_input.addClass("hide");
            bitly_api_input.addClass("hide");
            dialogheader.attr("class", "");
        }
    })
}

// Submits URL shortener settings
function submit_urlshortener_select() {
    $(document).on("click", "#usformbox input.submit", function(e) {
        e.preventDefault();
        const thisform = $(this).closest(".popform"),
            currentapi = thisform.attr("data-currentapi"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            firebase_api_input = thisform.find("input.firebase_api_input"),
            bitly_api_input = thisform.find("input.bitly_api_input"),
            firebase_apival = firebase_api_input.val(),
            bitly_apival = bitly_api_input.val(),
            firebase_checkchange = firebase_api_input.attr("data-checkchange"),
            bitly_checkchange = bitly_api_input.attr("data-checkchange"),
            toggle_urlshortener = $("#toggle_urlshortener .switchpanel");
        if (thisvalue === currentapi && firebase_checkchange === firebase_apival && bitly_checkchange === bitly_apival && !toggle_urlshortener.hasClass("us_changed")) { // check for changes
            canceldialog();
            return false;
        }
        const us_active = toggle_urlshortener.hasClass("true");
        if (thisvalue !== currentapi || toggle_urlshortener.hasClass("us_changed")) {
            const us_state = us_active ? "active" : "inactive",
                us_title = us_active ? thisvalue : "inactive";
            set_setting("url_shorten_settings", {
                "selected": us_title,
                "us_active": us_state
            }, us_title);
        }
        if (us_active) {
            const current_firebase_key = firebase_api_input.attr("data-apikey"),
                current_bitly_key = bitly_api_input.attr("data-apikey");
            if (firebase_apival !== current_firebase_key) {
                if (firebase_checkchange === firebase_apival) {
                    popnotify("error", translate("validateapikey"));
                    return false;
                }
                firebase_api_input.attr("data-checkchange", firebase_apival);
                checkapikey("firebase", firebase_apival, true)
                return
            }
            if (bitly_apival !== current_bitly_key) {
                if (bitly_checkchange === bitly_apival) {
                    popnotify("error", translate("validateapikey"));
                    return false;
                }
                bitly_api_input.attr("data-checkchange", bitly_apival);
                checkapikey("bitly", bitly_apival, true)
                return false;
            }
        }
        canceldialog();
        notify(translate("datasaved"));
        savesettings();
        return false;
    })
}

// Cryptocurrency price API settings
function editccapi() {
    $(document).on("click", "#cmcapisettings", function() {
        const cc_apisettings = $("#cmcapisettings").data(),
            ccapisrc = cc_apisettings.selected,
            cmcapikey = cc_apisettings.cmcapikey,
            cmcapikeyval = cc_apisettings.cmcapikey || "",
            cmcapikeyclass = ccapisrc === "coinmarketcap" ? "" : "hide",
            options = "<span data-pe='none'>" + glob_config.apilists.crypto_price_apis.join("</span><span data-pe='none'>") + "</span>",
            ddat = [{
                "div": {
                    "class": "popform",
                    "attr": {
                        "data-currentapi": ccapisrc
                    },
                    "content": [{
                            "div": {
                                "class": "selectbox",
                                "content": [{
                                        "input": {
                                            "attr": {
                                                "type": "text",
                                                "value": ccapisrc,
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
                                "class": cmcapikeyclass,
                                "attr": {
                                    "type": "text",
                                    "value": cmcapikeyval,
                                    "placeholder": translate("apikey"),
                                    "data-apikey": cmcapikeyval,
                                    "data-checkchange": cmcapikey
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": translate("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "ccapiformbox",
                "icon": "icon-stats-dots",
                "title": translate("cmcapisettings"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

// Handles selection of cryptocurrency price API
function pickcmcapiselect() {
    $(document).on("click", "#ccapiformbox .selectbox > .options span", function() {
        const thisselect = $(this),
            thisvalue = thisselect.text(),
            thisform = thisselect.closest(".popform"),
            api_input = thisform.find("input:nth-child(2)");
        if (thisvalue === "coinmarketcap") {
            api_input.removeClass("hide");
        } else {
            api_input.addClass("hide");
        }
    })
}

// Submits cryptocurrency price API settings
function submitccapi() {
    $(document).on("click", "#ccapiformbox input.submit", function(e) {
        e.preventDefault();
        const thisform = $(this).closest(".popform"),
            currentapi = thisform.attr("data-currentapi"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            api_input = thisform.find("input:nth-child(2)"),
            apival = api_input.val(),
            checkchange = api_input.attr("data-checkchange");
        if (thisvalue === currentapi && checkchange === apival) {
            canceldialog();
            return false;
        }
        if (thisvalue !== currentapi) {
            set_setting("cmcapisettings", {
                "selected": thisvalue
            }, thisvalue);
        }
        if (apival !== api_input.attr("data-apikey")) {
            if (checkchange === apival) {
                popnotify("error", translate("validateapikey"));
                return false;
            }
            api_input.attr("data-checkchange", apival);
            checkapikey("coinmarketcap", apival, true);
            return false;
        }
        canceldialog();
        notify(translate("datasaved"));
        savesettings();
        return false;
    })
}

// Fiat price API settings
function editfiatxrapi() {
    $(document).on("click", "#fiatapisettings", function() {
        const thisdata = $(this).data(),
            fiatxrapisrc = thisdata.selected,
            fiatxrapikey = thisdata.fxapikey || "",
            options = "<span data-pe='none'>" + glob_config.apilists.fiat_price_apis.join("</span><span data-pe='none'>") + "</span>",
            fiatxrapikeyclass = fiatxrapisrc === "fixer" ? "" : "hide",
            ddat = [{
                "div": {
                    "class": "popform",
                    "attr": {
                        "data-currentapi": fiatxrapisrc
                    },
                    "content": [{
                            "div": {
                                "class": "selectbox",
                                "content": [{
                                        "input": {
                                            "attr": {
                                                "type": "text",
                                                "value": fiatxrapisrc,
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
                                "class": fiatxrapikeyclass,
                                "attr": {
                                    "type": "text",
                                    "value": fiatxrapikey,
                                    "placeholder": translate("apikey"),
                                    "data-apikey": fiatxrapikey,
                                    "data-checkchange": fiatxrapikey
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": translate("okbttn")
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "fiatxrapiformbox",
                "icon": "icon-stats-bars",
                "title": translate("fiatapisettings"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    })
}

// Handles selection of fiat price API
function pickfiatxrapiselect() {
    $(document).on("click", "#fiatxrapiformbox .selectbox > .options span", function() {
        const thisselect = $(this),
            thisvalue = thisselect.text(),
            thisform = thisselect.closest(".popform"),
            api_input = thisform.find("input:nth-child(2)");
        if (thisvalue === "fixer") {
            api_input.removeClass("hide");
        } else {
            api_input.addClass("hide");
        }
    })
}

// Submits fiat price API settings
function submitfiatxrapi() {
    $(document).on("click", "#fiatxrapiformbox input.submit", function(e) {
        e.preventDefault();
        const thisform = $(this).closest(".popform"),
            currentapi = thisform.attr("data-currentapi"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            api_input = thisform.find("input:nth-child(2)"),
            apival = api_input.val(),
            checkchange = api_input.attr("data-checkchange");
        if (thisvalue === currentapi && checkchange === apival) {
            canceldialog();
            return false;
        }
        if (thisvalue !== currentapi) {
            set_setting("fiatapisettings", {
                "selected": thisvalue
            }, thisvalue);
        }
        if (apival !== api_input.attr("data-apikey")) {
            if (checkchange === apival) {
                popnotify("error", translate("validateapikey"));
                return false;
            }
            api_input.attr("data-checkchange", apival);
            checkapikey("fixer", apival, true);
            return false;
        }
        canceldialog();
        notify(translate("datasaved"));
        savesettings();
        return false;
    })
}

// Triggers proxy dialog
function trigger_proxy_dialog() {
    $(document).on("click", "#proxy_dialog", function() {
        canceldialog();
        setTimeout(function() {
            $("#api_proxy").trigger("click");
        }, 700);
    })
}

// API Proxy selection
function pick_api_proxy() {
    $(document).on("click", "#api_proxy", function() {
        const proxies = all_proxies(),
            current_proxy = d_proxy(),
            content = "\
            <div class='formbox' id='proxyformbox'>\
                <h2 class='icon-sphere'>API Proxy</h2>\
                <div class='popnotify'></div>\
                <div class='popform validated'>\
                    <div class='selectbox'>\
                        <input type='text' value='" + current_proxy + "' placeholder='https://...' id='proxy_select_input' readonly='readonly'/>\
                        <div class='selectarrows icon-menu2' data-pe='none'></div>\
                        <div class='options'></div>\
                    </div>\
                    <div id='rpc_input_box'>\
                        <h3 class='icon-plus'>" + translate("addapiproxy") + "</h3>\
                        <div id='proxy_info'>" + translate("controlyourkeys") + "<br/><br/>\
                            <strong>1.</strong> " + translate("proxystep1") + "<br/>\
                            <strong>2.</strong> " + translate("proxystep2") + "<br/>\
                            <strong>3.</strong> " + translate("proxystep3") + "<br/><br/>\
                        </div>\
                        <div id='rpc_input'>\
                            <input type='text' value='' placeholder='https://...' id='proxy_url_input'/>\
                            <div class='c_stat icon-wifi-off'></div>\
                            <div class='c_stat icon-connection'></div>\
                        </div>\
                    </div>\
                    <input type='submit' class='submit' value='" + translate("okbttn") + "'/>\
                </div>\
            </div>";
        popdialog(content, "triggersubmit");
        if (glob_const.phpsupport === true) {
            const protocol = glob_const.localserver ? glob_const.w_loc.protocol + "//" : "",
                port = glob_const.w_loc.port,
                pval = port.length ? ":" + port : "",
                fixed_url = complete_url(protocol + glob_const.thishostname + pval + location.pathname);
            if ($.inArray(fixed_url, proxies) === -1) {
                proxies.push(fixed_url);
            }
        }
        if ($.inArray(glob_const.hosted_proxy, proxies) === -1) { // always keep default proxy
            proxies.push(glob_const.hosted_proxy);
        }
        const optionlist = $("#proxyformbox").find(".options");
        $.each(proxies, function(key, value) {
            const selected = (value === current_proxy);
            test_append_proxy(optionlist, key, value, selected, true);
        });
    })
}

// Tests and appends a proxy to the list
function test_append_proxy(optionlist, key, value, selected, dfault) { // make test api call
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": value + "proxy/v1/ln/api/",
        "data": {
            "ping": true
        }
    }).done(function(e) {
        const api_result = br_result(e);
        if (api_result.result === "pong") {
            proxy_option_li(optionlist, true, key, value, selected, dfault);
            return
        }
        proxy_option_li(optionlist, false, key, value, selected, dfault);
    }).fail(function(xhr, stat, err) {
        proxy_option_li(optionlist, false, key, value, selected, dfault);
    });
}

// Creates a list item for a proxy option
function proxy_option_li(optionlist, live, key, value, selected, dfault) {
    const liveclass = live ? " live" : " offline",
        icon = live ? "connection" : "wifi-off",
        default_class = dfault ? " default" : "",
        option = $("<div class='optionwrap" + liveclass + default_class + "' style='display:none' data-pe='none'><span data-value='" + value + "' data-pe='none'>" + value + "</span><div class='opt_icon_box' data-pe='none'><div class='opt_icon c_stat icon-" + icon + "' data-pe='none'></div><div class='opt_icon icon-bin' data-pe='none'></div></div>");
    optionlist.append(option);
    option.slideDown(500);
}

// Submits the selected proxy
function submit_proxy() {
    $(document).on("click", "#proxyformbox input.submit", function(e) {
        e.preventDefault();
        const proxyformbox = $("#proxyformbox"),
            selectval = proxyformbox.find("#proxy_select_input").val(),
            customval = proxyformbox.find("#proxy_url_input").val();
        if (customval.length > 0) {
            test_custom_proxy(customval);
            return
        }
        const set_proxy = c_proxy();
        if (selectval === set_proxy) {
            canceldialog();
            return
        }
        set_setting("api_proxy", {
            "selected": selectval
        }, selectval);
        canceldialog();
        notify(translate("datasaved"));
        savesettings();
    })
}

// Hides the custom proxy field when selecting from options
function hide_custom_proxy_field() {
    $(document).on("click", "#proxyformbox .selectarrows", function() {
        const proxyformbox = $("#proxyformbox"),
            options = $("#proxyformbox").find(".options .optionwrap"),
            select_inputval = proxyformbox.find("#proxy_select_input").val(),
            custom_input = proxyformbox.find("#proxy_url_input");
        options.each(function() {
            const this_option = $(this),
                to_val = this_option.find("> span").attr("data-value");
            if (to_val === select_inputval) {
                this_option.hide();
            } else {
                this_option.show();
            }
        });
        custom_input.val("");
    });
}

// Tests a custom proxy
function test_custom_proxy(value) { // make test api call
    const proxy_node = $("#api_proxy"),
        proxy_node_data = proxy_node.data(),
        custom_proxies = proxy_node_data.custom_proxies,
        fixed_url = complete_url(value);
    if ($.inArray(fixed_url, custom_proxies) !== -1 || $.inArray(fixed_url, glob_const.proxy_list) !== -1) {
        popnotify("error", translate("proxyexists"));
        return false;
    }
    if (fixed_url.indexOf("http") > -1) {
        $.ajax({
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": fixed_url + "proxy/v1/",
            "data": {
                "custom": "add"
            }
        }).done(function(e) {
            const api_result = br_result(e),
                result = api_result.result;
            if (result) {
                const error = result.error;
                if (error) {
                    const message = error.message;
                    if (message && message === "no write acces") {
                        popnotify("error", translate("folderpermissions"));
                        return
                    }
                }
                if (result.custom) {
                    custom_proxies.push(fixed_url);
                    set_setting("api_proxy", {
                        "selected": fixed_url,
                        "custom_proxies": custom_proxies
                    }, fixed_url);
                    canceldialog();
                    notify(translate("datasaved"));
                    savesettings();
                    setTimeout(function() {
                        $("#apikeys").trigger("click");
                    }, 800);
                    return
                }
            }
            popnotify("error", translate("unabletopost", {
                "fixed_url": fixed_url
            }));
        }).fail(function(xhr, stat, err) {
            popnotify("error", translate("unabletoconnect"));
        });
        return
    }
    popnotify("error", translate("invalidurl"));
}

// Removes a selected proxy
function remove_proxy() {
    $(document).on("click", "#proxyformbox .options .opt_icon_box .icon-bin", function(e) {
        e.preventDefault();
        const proxy_node = "api_proxy",
            custom_proxies = get_setting(proxy_node, "custom_proxies");
        if (custom_proxies.length > 0) {
            const thisoption = $(this).closest(".optionwrap"),
                default_node = (thisoption.hasClass("default")),
                thisval = thisoption.find("> span").attr("data-value");
            if (default_node === true) {
                playsound(glob_const.funk);
                topnotify(translate("removedefaultnode"));
            } else {
                const result = confirm(translate("confirmremovenode", {
                    "thisval": thisval
                }));
                if (result) {
                    const new_array = $.grep(custom_proxies, function(value) {
                        return value !== thisval;
                    });
                    thisoption.slideUp(500, function() {
                        $(this).remove();
                    });
                    set_setting(proxy_node, {
                        "custom_proxies": new_array
                    });
                    notify(translate("proxyremoved"));
                    savesettings();
                }
            }
        }
        return false;
    })
}

// Completes a URL by adding protocol and ensuring it ends with a slash
function complete_url(url) {
    const cv1 = url.indexOf("://") > -1 ? url : "https://" + url;
    return cv1.slice(-1) === "/" ? cv1 : cv1 + "/";
}

// Retrieves the current proxy setting
function c_proxy() {
    return $("#api_proxy").data("selected");
}

// API keys management
function apikeys() {
    $(document).on("click", "#apikeys", function() {
        const ak_data = $(this).data(),
            alchemykey = ak_data.alchemy || "",
            arbiscankey = ak_data.arbiscan || "",
            bitlykey = ak_data.bitly || "",
            bscscankey = ak_data.bscscan || "",
            blockchairkey = ak_data.blockchair || "",
            blockcypherkey = ak_data.blockcypher || "",
            cmckey = ak_data.coinmarketcap || "",
            currencylayerkey = ak_data.currencylayer || "",
            etherscankey = ak_data.etherscan || "",
            ethplorerkey = ak_data.ethplorer || "",
            exchangeratesapikey = ak_data.exchangeratesapi || "",
            firebasekey = ak_data.firebase || "",
            fixerkey = ak_data.fixer || "",
            infurakey = ak_data.infura || "",
            polygonscankey = ak_data.polygonscan || "",
            apikeyph = translate("apikey"),
            content = "\
            <div class='formbox' id='apikeyformbox'>\
                <h2 class='icon-key'>" + translate("apikeys") + "</h2>\
                <div class='popnotify'></div>\
                <div class='popform'>\
                    <h3>Alchemy</h3>\
                    <input type='text' value='" + alchemykey + "' placeholder='Alchemy " + apikeyph + "' data-ref='alchemy' data-checkchange='" + alchemykey + "' class='ak_input'/>\
                    <h3>Arbiscan</h3>\
                    <input type='text' value='" + arbiscankey + "' placeholder='Arbiscan " + apikeyph + "' data-ref='arbiscan' data-checkchange='" + arbiscankey + "' class='ak_input'/>\
                    <h3>Bitly</h3>\
                    <input type='text' value='" + bitlykey + "' placeholder='Bitly access token' data-ref='bitly' data-checkchange='" + bitlykey + "' class='ak_input'/>\
                    <h3>Bscscan</h3>\
                    <input type='text' value='" + bscscankey + "' placeholder='Bscscan " + apikeyph + "' data-ref='bscscan' data-checkchange='" + bscscankey + "' class='ak_input'/>\
                    <h3>Blockchair</h3>\
                    <input type='text' value='" + blockchairkey + "' placeholder='Blockchair " + apikeyph + "' data-ref='blockchair' data-checkchange='" + blockchairkey + "' class='ak_input'/>\
                    <h3>Blockcypher</h3>\
                    <input type='text' value='" + blockcypherkey + "' placeholder='Blockcypher " + apikeyph + "' data-ref='blockcypher' data-checkchange='" + blockcypherkey + "' class='ak_input'/>\
                    <h3>Coinmarketcap</h3>\
                    <input type='text' value='" + cmckey + "' placeholder='Coinmarketcap " + apikeyph + "' data-ref='coinmarketcap' data-checkchange='" + cmckey + "' class='ak_input'/>\
                    <h3>Currencylayer</h3>\
                    <input type='text' value='" + currencylayerkey + "' placeholder='Currencylayer " + apikeyph + "' data-ref='currencylayer' data-checkchange='" + currencylayerkey + "' class='ak_input'/>\
                    <h3>Etherscan</h3>\
                    <input type='text' value='" + etherscankey + "' placeholder='Etherscan " + apikeyph + "' data-ref='etherscan' data-checkchange='" + etherscankey + "' class='ak_input'/>\
                    <h3>Ethplorer</h3>\
                    <input type='text' value='" + ethplorerkey + "' placeholder='Ethplorer " + apikeyph + "' data-ref='ethplorer' data-checkchange='" + ethplorerkey + "' class='ak_input'/>\
                    <h3>Exchangeratesapi</h3>\
                    <input type='text' value='" + exchangeratesapikey + "' placeholder='Exchangeratesapi " + apikeyph + "' data-ref='exchangeratesapi' data-checkchange='" + exchangeratesapikey + "' class='ak_input'/>\
                    <h3>Firebase</h3>\
                    <input type='text' value='" + firebasekey + "' placeholder='Firebase " + apikeyph + "' data-ref='firebase' data-checkchange='" + firebasekey + "' class='ak_input'/>\
                    <h3>Fixer</h3>\
                    <input type='text' value='" + fixerkey + "' placeholder='Fixer " + apikeyph + "' data-ref='fixer' data-checkchange='" + fixerkey + "' class='ak_input'/>\
                    <h3>Infura</h3>\
                    <input type='text' value='" + infurakey + "' placeholder='Infura Project ID' data-ref='infura' data-checkchange='" + infurakey + "' class='ak_input'/>\
                    <input type='submit' class='submit' value='" + translate("okbttn") + "' id='apisubmit'/>\
                    <h3>Polygonscan</h3>\
                    <input type='text' value='" + polygonscankey + "' placeholder='Polygonscan " + apikeyph + "' data-ref='polygonscan' data-checkchange='" + polygonscankey + "' class='ak_input'/>\
                </div>\
            </div>";
        popdialog(content, "triggersubmit");
    });
}

// Detects changes in API key input fields
function api_input_change() {
    $(document).on("input", "#apikeyformbox input.ak_input", function() {
        $(this).addClass("changed");
    });
}

// Submits API keys for validation
function submitapi() {
    $(document).on("click", "#apisubmit", function(e) {
        e.preventDefault();
        $("#apikeyformbox").addClass("pass");
        const allinputs = $("#apikeyformbox input.ak_input"),
            ak_input = allinputs.filter(function() {
                const this_input = $(this);
                return this_input.hasClass("changed") && this_input.val() !== this_input.attr("data-checkchange");
            }),
            inputcount = ak_input.length;
        if (inputcount === 0) {
            if (allinputs.hasClass("input_error")) {
                const invalidkey = translate("invalidapikey");
                popnotify("error", invalidkey);
                notify(invalidkey);
                $(".input_error").select();
                return false;
            }
            canceldialog();
            return false;
        }
        ak_input.each(function(index) {
            const thisindex = index + 1,
                thisinput = $(this),
                thisvalue = thisinput.val(),
                thisref = thisinput.attr("data-ref"),
                lastinput = inputcount === thisindex;
            checkapikey(thisref, thisvalue, lastinput);
        });
        return false;
    });
}

// Checks the validity of an API key
function checkapikey(thisref, apikeyval, lastinput) {
    const token_data = {
        "arbiscan": {
            "keylength": 6,
            "payload": "?module=block&action=getblockreward&blockno=131049&apikey="
        },
        "bitly": {
            "keylength": 6,
            "payload": "expand"
        },
        "bscscan": {
            "keylength": 6,
            "payload": "?module=block&action=getblockreward&blockno=131049&apikey="
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
        "firebase": {
            "keylength": 20,
            "payload": "shortLinks?key="
        },
        "fixer": {
            "keylength": 20,
            "payload": "symbols?access_key="
        },
        "polygonscan": {
            "keylength": 6,
            "payload": "?module=block&action=getblockreward&blockno=131049&apikey="
        }
    };
    const data = token_data[thisref] || {
        keylength: 6,
        payload: null
    };
    json_check_apikey(data.keylength, thisref, data.payload, apikeyval, lastinput);
}

// Validates an API key using JSON requests
function json_check_apikey(keylength, thisref, payload, apikeyval, lastinput) {
    if (apikeyval.length > keylength) {
        if (thisref === "infura" || thisref === "alchemy") {
            const txhash = "0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", // random tx
                base_url = thisref === "infura" ? glob_const.main_eth_node : glob_const.main_alchemy_node,
                payload = {
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "eth_getTransactionByHash",
                    "params": [txhash]
                };
            api_proxy({
                "api": thisref,
                "api_url": base_url + apikeyval,
                "proxy": false,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(payload),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(e) {
                const data = br_result(e).result;
                if (data) {
                    update_api_attr(thisref, apikeyval, lastinput);
                    return;
                }
                api_fail(thisref, apikeyval);
            }).fail(function(xhr, stat, err) {
                api_fail(thisref, apikeyval);
            });
            return
        }
        const api_data = get_api_data(thisref),
            base_url = api_data.base_url,
            method = (thisref === "firebase" || thisref === "bitly") ? "POST" : "GET",
            params = {
                "method": method,
                "cache": true
            };
        let search = payload + apikeyval;
        if (thisref === "firebase") {
            params.data = {
                "longDynamicLink": glob_const.firebase_shortlink + "?link=" + glob_const.approot + "?p=request"
            };
        }
        if (thisref === "bitly") {
            search = payload;
            params.headers = {
                "Authorization": "Bearer " + apikeyval,
                "Content-Type": "application/json"
            };
            params.data = JSON.stringify({
                "bitlink_id": "bit.ly/12a4b6c"
            });
        }
        const api_url = base_url + search,
            proxy = (thisref === "coinmarketcap") ? true : false,
            postdata = {
                "api": thisref,
                "search": search,
                "cachetime": 0,
                "cachefolder": "1h",
                "api_url": api_url,
                "proxy": proxy,
                "params": params
            };
        api_proxy(postdata).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                const apicallfailed = translate("apicallfailed");
                if ((thisref === "etherscan" || thisref === "arbiscan" || thisref === "polygonscan" || thisref === "bscscan") && data.status != 1) {
                    if (str_match(data.result, "Invalid API Key")) {
                        api_fail(thisref, apikeyval);
                    } else {
                        notify(translate("apicallerror"));
                        const content = "<h2 class='icon-blocked'>" + apicallfailed + "</h2><p class='doselect'>" + data.message + "</p>";
                        popdialog(content, "canceldialog");
                    }
                    return
                }
                if (thisref === "bitly" && data.status_code == 500) {
                    api_fail(thisref, apikeyval);
                    return
                }
                if (thisref === "blockchair") {
                    const context_code = data.context.code;
                    if (context_code == 200) {
                        update_api_attr(thisref, apikeyval, lastinput);
                    } else if (context_code == 402) {
                        api_fail(thisref, apikeyval);
                    } else {
                        notify(translate("apicallerror"));
                        const content = "<h2 class='icon-blocked'>" + apicallfailed + "</h2><p class='doselect'>" + data.error + "</p>";
                        popdialog(content, "canceldialog");
                    }
                    return
                }
                if (thisref === "blockcypher") {
                    if (data.address) {
                        update_api_attr(thisref, apikeyval, lastinput);
                    } else {
                        api_fail(thisref, apikeyval);
                    }
                    return;
                }
                if (thisref === "coinmarketcap") {
                    const cmc_key_length = apikeyval.length;
                    if (cmc_key_length !== 36) {
                        api_fail(thisref, apikeyval);
                        return
                    }
                }
                if (thisref === "currencylayer" && data.success === false) {
                    if (data.error.code == 101) {
                        api_fail(thisref, apikeyval);
                    } else {
                        notify(translate("apicallerror"));
                        const content = "<h2 class='icon-blocked'>" + apicallfailed + "</h2><p class='doselect'>" + data.error + "</p>";
                        popdialog(content, "canceldialog");
                    }
                    return
                }
                if (thisref === "ethplorer") {
                    if (data.tokens) {
                        update_api_attr(thisref, apikeyval, lastinput);
                    } else {
                        if (data.error.code == 1) {
                            api_fail(thisref, apikeyval);
                        } else {
                            notify(translate("apicallerror"));
                            const content = "<h2 class='icon-blocked'>" + apicallfailed + "</h2><p class='doselect'>" + data.error + "</p>";
                            popdialog(content, "canceldialog");
                        }
                    }
                    return
                }
                if (thisref === "exchangeratesapi" && !data.success) {
                    const ec = q_obj(data, "error.code");
                    if (ec) {
                        if (ec === "invalid_access_key") {
                            api_fail(thisref, apikeyval);
                        } else {
                            notify(translate("apicallerror"));
                            const content = "<h2 class='icon-blocked'>" + apicallfailed + "</h2><p class='doselect'>" + ec + "</p>";
                            popdialog(content, "canceldialog");
                        }
                        return
                    }
                }
                if (thisref === "fixer" && data.success === false) {
                    if (data.error.code == 101) {
                        api_fail(thisref, apikeyval);
                    } else {
                        notify(translate("apicallerror"));
                        const content = "<h2 class='icon-blocked'>" + apicallfailed + "</h2><p class='doselect'>" + data.error + "</p>";
                        popdialog(content, "canceldialog");
                    }
                    return
                }
                update_api_attr(thisref, apikeyval, lastinput);
                return
            }
            api_fail(thisref, apikeyval);
        }).fail(function(xhr, stat, err) {
            api_fail(thisref, apikeyval);
        });
        return
    }
    if (!apikeyval) {
        update_api_attr(thisref, null, lastinput);
        return
    }
    api_fail(thisref, apikeyval);
}

// Handles API key validation failure
function api_fail(thisref, thisvalue) {
    const errormsg = translate("invalidapikeyname", {
            "thisref": thisref
        }),
        apiformbox = $("#apikeyformbox");
    popnotify("error", errormsg);
    apiformbox.removeClass("pass");
    apiformbox.find("input[data-ref=" + thisref + "]").attr("data-checkchange", thisvalue).removeClass("changed").addClass("input_error").select();
    notify(errormsg);
}

// Updates API key attributes after validation
function update_api_attr(thisref, thisvalue, lastinput) {
    const apiformbox = $("#apikeyformbox"),
        changeval = thisvalue || "";
    if (apiformbox && apiformbox.hasClass("pass")) {
        complement_apisettings(thisref, thisvalue);
        apiformbox.find("input[data-ref=" + thisref + "]").attr("data-checkchange", changeval).removeClass("changed input_error");
        if (lastinput === true) {
            canceldialog();
            notify(translate("datasaved"));
            savesettings();
        }
        return;
    }
    complement_apisettings(thisref, thisvalue);
    canceldialog();
    notify(translate("datasaved"));
    savesettings();
    // update monitor
    br_remove_session(thisref + "_api_attempt");
    br_remove_session("txstatus");
    cancelpaymentdialog();
}

// Complements API settings with new key values
function complement_apisettings(thisref, thisvalue) {
    const kpairs = {};
    kpairs[thisref] = thisvalue;
    set_setting("apikeys", kpairs);
    if (thisref === "bitly") {
        set_setting("url_shorten_settings", {
            "bitly_at": thisvalue
        });
        return;
    }
    if (thisref === "firebase") {
        set_setting("url_shorten_settings", {
            "fbapikey": thisvalue
        });
        return;
    }
    if (thisref === "coinmarketcap") {
        set_setting("cmcapisettings", {
            "cmcapikey": thisvalue
        });
        return;
    }
    if (thisref === "fixer") {
        set_setting("fiatapisettings", {
            "fxapikey": thisvalue
        });
    }
}

// Contact form
function edit_contactform_trigger() {
    $(document).on("click", "#contactform", function() {
        edit_contactform();
    });
}

// Opens and populates the contact form
function edit_contactform(checkout) {
    const contactform = $("#contactform"),
        thisdata = contactform.data(),
        formheader = checkout ? translate("contactform") + " / " + translate("shipping") : translate("contactform"),
        form_subheader = checkout ? "" : "<p>" + translate("yourdetails") + "</p>",
        content = "\
    <div class='formbox' id='contactformbox'>\
        <h2 class='icon-sphere'>" + formheader + "</h2>" + form_subheader +
        "<div class='popnotify'></div>\
        <div class='popform'>\
            <div class='cf_inputwrap empty'><input type='text' value='" + thisdata.name + "' placeholder='" + translate("phname") + "' class='cf_nameinput'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + thisdata.address + "' placeholder='" + translate("phaddress") + "' class='cf_addressinput'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + thisdata.zipcode + "' placeholder='" + translate("phzipcode") + "' class='cf_zipcodeinput'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + thisdata.city + "' placeholder='" + translate("phcity") + "' class='cf_cityinput'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + thisdata.country + "' placeholder='" + translate("phcountry") + "' class='cf_countryinput'/><span class='required'>*</span></div>\
            <div class='cf_inputwrap empty'><input type='text' value='" + thisdata.email + "' placeholder='" + translate("phemail") + "' class='cf_emailinput'/><span class='required'>*</span></div>\
            <input type='submit' class='submit' value='" + translate("okbttn") + "'/>\
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

// Checks and updates the state of contact form inputs
function check_contactform() {
    $("#contactformbox .popform .cf_inputwrap").each(function() {
        const cf_inputwrap = $(this),
            thisinput = cf_inputwrap.children("input"),
            inputval = thisinput.val();
        cf_inputwrap.toggleClass("empty", inputval.length <= 2);
    });
}

// Handles typing in contact form inputs
function type_contactform() {
    $(document).on("input", "#contactformbox .cf_inputwrap input", function() {
        const thisinput = $(this),
            thisvalue = thisinput.val(),
            cf_inputwrap = thisinput.parent(".cf_inputwrap");
        cf_inputwrap.toggleClass("empty", thisvalue.length <= 2);
    });
}

// Submits the contact form data
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
            };
        const cf_data = {},
            email_regex = /^\w(?:\.?[\w%+-]+)*@\w(?:[\w-]*\.)+?[a-z]{2,}$/;

        for (const [key, input] of Object.entries(inputs)) {
            const value = input.val().trim();
            cf_data[key] = value;

            if (key === "name" && value.length < 4) {
                showError(input, "phname");
                return;
            }
            if (key === "address" && value.length < 10) {
                showError(input, "phaddress");
                return;
            }
            if (key === "zipcode" && value.length < 6) {
                showError(input, "phzipcode");
                return;
            }
            if ((key === "city" || key === "country") && value.length < 3) {
                showError(input, "ph" + key);
                return;
            }
            if (key === "email") {
                if (value.length < 1) {
                    showError(input, "phemail");
                    return;
                }
                if (!email_regex.test(value)) {
                    popnotify("error", translate("phemail") + " " + translate("invalidchars"));
                    input.focus().parent(".cf_inputwrap").addClass("empty");
                    return;
                }
            }
        }

        set_setting("contactform", cf_data);
        canceldialog(true);
        savesettings();
        if (geturlparameters().contactform !== undefined) {
            loadpaymentfunction(true);
            return;
        }
        notify(translate("datasaved"));
    });

    function showError(input, translationKey) {
        popnotify("error", translate(translationKey) + " " + translate("requiredfield"));
        input.focus().parent(".cf_inputwrap").addClass("empty");
    }
}

// Permissions
// Opens permissions dialog
function permissions() {
    $(document).on("click", "#permissions", function() {
        all_pinpanel({
            "func": permissions_callback
        }, true, true)
    })
}

// Callback for permissions dialog
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
                                "value": translate("okbttn")
                            }
                        }
                    }
                ]
            }
        }],
        content = template_dialog({
            "id": "permissions_formbox",
            "icon": "icon-user",
            "title": translate("permissions"),
            "elements": ddat
        });
    popdialog(content, "triggersubmit");
}

// Handles submission of permissions changes
function submit_permissions() {
    $(document).on("click", "#permissions_formbox input.submit", function(e) {
        e.preventDefault();
        const thisform = $(this).closest(".popform"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            currentval = thisform.attr("data-current");
        if (thisvalue === currentval) { // check for changes
            canceldialog();
            return
        }
        set_setting("permissions", {
            "selected": thisvalue
        }, thisvalue);
        glob_const.html.attr("data-role", thisvalue);
        canceldialog();
        notify(translate("datasaved"));
        savesettings();
        return false;
    })
}

// Team invite

// Team invite trigger
function team_invite_trigger() {
    $(document).on("click", "#teaminvite", function() {
        if (glob_let.hasbip && !glob_let.bipv) {
            bipv_pass();
            notify(translate("pleaseverify"));
            return;
        }
        if (haspin(true) === true) {
            team_invite();
            return;
        }
        const content = pinpanel("", {
            "func": team_invite
        });
        showoptions(content, "pin");
    });
}

// Opens team invite dialog
function team_invite() {
    const jsonencode = complile_teaminvite(),
        filename = "bitrequest_team_invite.json",
        ddat = [{
            "div": {
                "class": "popform",
                "content": "<p><strong>" + translate("inviteteammembers") + "</strong><br/>" + translate("teaminviteexplainer") + "<br/>" + translate("teaminviteaccess") + "</p>\
            <div id='send_invite' data-url='" + jsonencode + "' class='button'><span class='icon-share2'></span>" + translate("sendinvite") + "</div>"
            }
        }],
        content = template_dialog({
            "id": "team_invite",
            "icon": "icon-users",
            "title": translate("teaminvite"),
            "elements": ddat
        }) + "<div id='backupactions'><div id='backupcd'>" + cancelbttn + "</div></div>";
    popdialog(content, "triggersubmit");
}

// Compiles team invite data
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
        const value = localStorage.getItem(key);
        if (value !== null && !excludeKeys.includes(key)) {
            const pval = JSON.parse(value);
            if (key === "bitrequest_settings") {
                const mods = [{
                    "id": "permissions",
                    "change": "selected",
                    "val": "cashier"
                }];
                jsonfile[key] = adjust_objectarray(pval, mods);
            } else {
                jsonfile[key] = pval;
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

// Adjusts object for team invite
function adjust_object(object, seedobj) {
    const seedid = seedobj.pid;
    object.bitrequest_cashier = {
        "cashier": true,
        "seedid": seedid
    };
    let phrase, seed, rootkey, key, cc;
    if (seedid) {
        phrase = seedobj.pob.join(" ");
        seed = toseed(phrase);
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
                xpubdat = xpub_obj(currency, root_path, cc, key);
            xpub = xpubdat.xpub;
            xpubid = xpubdat.xpubid;
        }
        if (addresses) {
            const checked = addresses.filter(filter => filter.checked === true);
            if (bip32dat.xpub) {
                const address_object = checked.filter(filter => {
                    if (filter.seedid) return false;
                    if (filter.xpubid && filter.xpubid !== xpubid) return false;
                    return true;
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

// Handles sharing of team invite
function share_teaminvite() {
    $(document).on("click", "#send_invite", function() {
        const result = confirm(translate("sendinvite") + "?");
        if (result) {
            loader(true);
            loadertext(translate("installationpackage"));
            const accountname = $("#accountsettings").data("selected");
            api_proxy({
                "custom": "system_bu",
                "api_url": true,
                "proxy": true,
                "params": {
                    "url": $(this).attr("data-url"),
                    "account": btoa(accountname)
                }
            }).done(function(e) {
                const br_cache = e.ping.br_cache,
                    sharedtitle = translate("teaminviteharetitle", {
                        "accountname": accountname
                    }),
                    set_proxy = c_proxy(),
                    r_dat = btoa(JSON.stringify({
                        "ro": br_cache.filename,
                        "proxy": set_proxy
                    }));
                shorten_url(sharedtitle, glob_const.approot + "?p=settings&ro=" + r_dat, glob_const.approot + "/img_icons_apple-touch-icon.png", true);
            }).fail(function(xhr, stat, err) {
                closeloader();
            });
        }
    });
}

// Checks and processes team invite
function check_teaminvite(ro) {
    const ro_dat = stripb64(ro),
        ro_id = ro_dat.ro,
        ro_proxy = ro_dat.proxy;
    api_proxy({
        "custom": "get_system_bu",
        "api_url": true,
        "proxy": true,
        "params": ro_id
    }, ro_proxy).done(function(e) {
        const ping = e.ping;
        if (ping) {
            const br_cache = ping.br_cache,
                server_time = br_cache.utc_timestamp,
                filetime = br_cache.created_utc,
                filetimesec = filetime ? filetime * 1000 : now(),
                filetime_format = new Date(filetimesec).toLocaleString(glob_const.langcode),
                br_result = ping.br_result,
                base64 = br_result.base64,
                account = atob(br_result.account),
                br_dat = JSON.parse(atob(base64)),
                sharedtitle = "Team invite " + account + " (" + filetime_format + ")",
                bu_date = filetime_format.replace(/\s+/g, "_").replace(/\:/g, "_"),
                cache_time = br_cache.cache_time,
                expires_in = (filetime + cache_time) - server_time,
                filename = "bitrequest_team_invite" + encodeURIComponent(account) + "_" + bu_date + ".json",
                cd = countdown(expires_in * 1000),
                cd_format = countdown_format(cd),
                bpdat_seedid = br_dat.bitrequest_cashier ? br_dat.bitrequest_cashier.seedid || false : false,
                update = bpdat_seedid === glob_let.cashier_seedid,
                master_account = bpdat_seedid === glob_let.bipid,
                teamid = br_get_local("teamid", true),
                teamid_arr = br_dobj(teamid),
                is_installed = teamid_arr.includes(ro),
                dialog_heading = update ? translate("teamupdate") : translate("teaminvite"),
                cf_string = cd_format ? translate("invitationexpiresin") + " " + cd_format : translate("fileexpired"),
                dialogtext = is_installed ? "<p>" + translate("installcompleted") + "</p>" :
                update ? "<p>" + translate("teamupdata", {
                    "account": account
                }) + "</p>" :
                "<p>" + translate("teamup", {
                    "account": account
                }) + "<br/><br/>" + translate("clickinstall", {
                    "account": account
                }) + "</p>",
                button_text = update ? translate("update") : translate("install"),
                install_button = is_installed ? "" : "<div id='install_teaminvite' data-base64='" + base64 + "' data-filename='" + filename + "' class='button icon-download' data-update='" + update + "' data-ismaster='" + master_account + "'data-installid='" + ro + "'>" + button_text + "</div>",
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
        systembu_expired();
    }).fail(function(xhr, stat, err) {
        systembu_expired();
    });
}

// Triggers the installation of a team invite
function install_teaminvite_trigger() {
    $(document).on("click", "#install_teaminvite", function() {
        const this_bttn = $(this),
            ismaster = this_bttn.attr("data-ismaster") === "true";
        if (ismaster) {
            notify(translate("owndevice"));
            return
        }
        const update = this_bttn.attr("data-update") === "true",
            installid = this_bttn.attr("data-installid"),
            installed = (glob_let.stored_currencies) ? true : false,
            result_text = update ? translate("updatealert") : translate("installalert"),
            result = installed ? confirm(result_text) : true;
        if (result) {
            const bu_dat = this_bttn.attr("data-base64"),
                j_filename = this_bttn.attr("data-filename"),
                j_object = JSON.parse(atob(bu_dat));
            install_teaminvite(j_object, j_filename, installid);
        }
    })
}

// Installs team invite data
function install_teaminvite(jsonobject, bu_filename, iid) {
    $.each(jsonobject, function(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    });
    if (iid) {
        const stored_teamids = br_get_local("teamid", true),
            teamid_arr = br_dobj(stored_teamids);
        teamid_arr.push(iid);
        br_set_local("teamid", teamid_arr, true);
    }
    rendersettings(["restore", "backup"]); // exclude restore and backup settings
    const lastrestore = translate("lastrestore") + "<br/><span class='icon-folder-open'>" + translate("teaminvite") + " " + new Date(now()).toLocaleString(langcode).replace(/\s+/g, "_") + "</span>";
    set_setting("restore", {
        "titlerestore": lastrestore,
        "fileused": bu_filename,
        "device": "folder-open"
    }, lastrestore);
    savesettings();
    notify(translate("installcomplete"));
    canceldialog();
    glob_const.w_loc.href = glob_const.w_loc.pathname + "?p=home";
}

// Checks if the object is a team invite
function isteaminvite(jsonobject) {
    const cashier_entry = jsonobject.bitrequest_cashier;
    return (cashier_entry && cashier_entry.cashier) ? true : false;
}

// Displays user agent information
function check_useragent() {
    $(document).on("click", "#ua", function() {
        const refmatch = glob_const.ref_match ? "<span class='number'>" + glob_const.referrer + "</span>" : "<span class='number'>" + false + "</span>",
            pdat = GD_pass(),
            pass = pdat.expired,
            expiresin = pdat.expires_in,
            rtoken = rt_obj(),
            ei_str = expiresin > 0 ? "expires: <span class='number'>" + Math.floor(expiresin / 1000) + " sec </span>" : "",
            hastoken = rtoken ? "true" : "false",
            rtstring = "rt: <span class='number'> " + hastoken + "</span>",
            ddat = [{
                "div": {
                    "class": "popform",
                    "content": [{
                            "div": {
                                "class": "pre",
                                "content": syntaxHighlight(glob_const.useragent)
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