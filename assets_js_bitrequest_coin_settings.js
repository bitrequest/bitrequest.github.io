let glob_ap_id,
    glob_test_rpc_call,
    glob_is_erc20t,
    glob_is_btc;

$(document).ready(function() {

    // ** Currency Settings **

    // Confirmations
    edit_confirmations();
    submit_confirmations();

    // Reuse addresses
    reuse_address_trigger();
    cc_switch();

    // Blockexplorer
    edit_blockexplorer();
    submit_blockexplorer();

    // RPC settings
    edit_rpcnode();
    //get_rpc_placeholder
    //test_append_rpc
    //rpc_option_li
    test_rpcnode();
    submit_rpcnode();
    //test_rpc
    //pass_rpc_submit
    remove_rpcnode();
    //get_rpc_url

    // Layer 2's
    edit_l2();
    l2nw_toggle();
    l2nw_switch();
    submit_l2();

    // Xpub settings
    edit_xpub_trigger();
    delete_xpub();
    //delete_xpub_cb
    //add_xpub_cb
    xpub_cc_switch();
    //edit_xpub
    xpub_change();
    submit_xpub_trigger();
    //validate_xpub
    //xpub_fail
    //clear_xpub_inputs
    //clear_xpub_checkboxes
    //check_xpub

    // Key Management
    key_management();
    segwit_switch();
    //xpub_info_pu

    // Add apikey
    trigger_apikey();
    //add_apikey;
    submit_apikey();

    reset_coinsettings();
    //reset_coinsettings_function
});

// ** Currency Settings **

// Function to handle editing confirmations for cryptocurrency transactions
function edit_confirmations() {
    $(document).on("click", ".cc_settinglist li[data-id='confirmations'] .edit_trigger", function() {
        const thistrigger = $(this),
            thiscurrency = thistrigger.attr("data-currency"),
            thisli = thistrigger.closest("li"),
            confsrc = thisli.data("selected"),
            confirmationOptions = [{
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
            confOptionsHtml = confirmationOptions.map(function(option) {
                return "<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>" + option.conf + "</span><div class='conf_emoji'>" + option.emoji + "</div></div></li>";
            }).join(""),
            ddat = [{
                "ul": {
                    "class": "conf_options noselect",
                    "content": confOptionsHtml
                },
                "div": {
                    "class": "popform",
                    "content": [{
                            "input": {
                                "attr": {
                                    "type": "hidden",
                                    "value": confsrc
                                }
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": translate("okbttn"),
                                    "data-currency": thiscurrency
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "conf_formbox",
                "icon": "icon-clock",
                "title": translate("confirmations"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
        const currentli = $("#conf_formbox ul.conf_options li").filter(function() {
            return $(this).find("span").text() === confsrc;
        });
        currentli.find(".radio").removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
    })
}

// Function to handle submission of confirmation settings
function submit_confirmations() {
    $(document).on("click", "#conf_formbox input.submit", function(e) {
        e.preventDefault();
        const thistrigger = $(this),
            thiscurrency = thistrigger.attr("data-currency"),
            thisvalue = thistrigger.prev("input").val(),
            csnode = cs_node(thiscurrency, "confirmations");
        if (csnode) {
            csnode.data("selected", thisvalue).find("p").html(thisvalue);
            canceldialog();
            notify(translate("datasaved"));
            save_cc_settings(thiscurrency, true);
        }
    })
}

// Function to handle the reuse address toggle switch
function reuse_address_trigger() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Reuse address'] .switchpanel.custom", function() {
        const this_switch = $(this),
            thislist = this_switch.closest("li"),
            thisliwrap = this_switch.closest(".liwrap"),
            thiscurrency = thisliwrap.attr("data-currency"),
            warning = thislist.data("warning");
        if (this_switch.hasClass("true")) {
            let xresult = true;
            if (warning) {
                xresult = confirm(translate("reusewarningalert", {
                    "thiscurrency": thiscurrency
                }));
            }
            if (xresult) {
                thislist.data("selected", false);
                this_switch.removeClass("true").addClass("false");
                save_cc_settings(thiscurrency, false);
            }
            return
        }
        const result = confirm(translate("reusealert", {
            "thiscurrency": thiscurrency
        }));
        if (result) {
            thislist.data("selected", true);
            this_switch.removeClass("false").addClass("true");
            save_cc_settings(thiscurrency, true);
        }
    })
}

// Function to handle generic cryptocurrency switch toggles
function cc_switch() {
    $(document).on("mouseup", ".cc_settinglist li .switchpanel.bool", function() {
        const thistrigger = $(this),
            thislist = thistrigger.closest("li"),
            thisliwrap = thistrigger.closest(".liwrap"),
            thiscurrency = thisliwrap.attr("data-currency"),
            thisvalue = thistrigger.hasClass("true");
        thislist.data("selected", thisvalue);
        save_cc_settings(thiscurrency, false);
    })
}

// Function to handle editing block explorer settings
function edit_blockexplorer() {
    $(document).on("click", ".cc_settinglist li[data-id='blockexplorers']", function() {
        const current_li = $(this),
            this_data = current_li.data(),
            options = this_data.options;
        if (options) {
            const thiscurrency = current_li.children(".liwrap").attr("data-currency"),
                selected = this_data.selected,
                choosebe = translate("chooseblockexplorer"),
                options_li = options.map(function(value) {
                    return "<span data-pe='none'>" + value + "</span>";
                }).join(""),
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
                                                "value": selected,
                                                "placeholder": choosebe,
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
                                            "content": options_li
                                        }
                                    }
                                ]
                            },
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": translate("okbttn"),
                                    "data-currency": thiscurrency
                                }
                            }
                        }]
                    }
                }],
                content = template_dialog({
                    "id": "be_formbox",
                    "icon": "icon-eye",
                    "title": choosebe,
                    "elements": ddat
                });
            popdialog(content, "triggersubmit");
        }
    })
}

// Function to handle submission of block explorer settings
function submit_blockexplorer() {
    $(document).on("click", "#be_formbox input.submit", function(e) {
        e.preventDefault();
        const thiscurrency = $(this).attr("data-currency"),
            thisvalue = $("#be_formbox").find("input:first").val(),
            csnode = cs_node(thiscurrency, "blockexplorers");
        if (csnode) {
            csnode.data("selected", thisvalue).find("p").html(thisvalue);
            canceldialog();
            notify(translate("datasaved"));
            save_cc_settings(thiscurrency, true);
        }
    })
}

// Function to handle editing RPC node settings for APIs and WebSockets
function edit_rpcnode() {
    $(document).on("click", ".cc_settinglist li[data-id='apis'], .cc_settinglist li[data-id='websockets']", function() {
        const current_li = $(this),
            this_data = current_li.data(),
            options = this_data.options,
            api_list = this_data.apis;
        if (!exists(options) && !exists(api_list)) {
            return
        }
        const thiscurrency = current_li.children(".liwrap").attr("data-currency");
        glob_ap_id = current_li.attr("data-id"),
            glob_test_rpc_call = this_data.rpc_test_command,
            glob_is_erc20t = ($("#" + thiscurrency + "_settings").attr("data-erc20") == "true"),
            glob_is_btc = is_btchain(thiscurrency) === true;
        const h_hint = glob_is_btc ? "mempool.space" : (thiscurrency === "ethereum" || glob_is_erc20t === true) ? "Infura" : "",
            header_text = glob_ap_id === "websockets" ? translate("addwebsocket", {
                "h_hint": h_hint
            }) : translate("addapi", {
                "h_hint": h_hint
            }),
            currencycode = (thiscurrency === "ethereum" || glob_is_erc20t === true) ? "eth" : thiscurrency,
            placeholder_id = glob_ap_id + currencycode + getrandomnumber(1, 3),
            getplaceholder = get_rpc_placeholder(thiscurrency)[placeholder_id],
            placeholder = getplaceholder || "eg: some.local-or-remote.node:port",
            api_form = options ? "<div id='rpc_input_box' data-currency='" + thiscurrency + "' data-erc20='" + glob_is_erc20t + "'>\
                    <h3 class='icon-plus'>" + header_text + "</h3>\
                    <div id='rpc_input'>\
                        <input type='text' value='' placeholder='" + placeholder + "' id='rpc_url_input'/>\
                        <div class='c_stat icon-wifi-off'></div>\
                        <div class='c_stat icon-connection'></div>\
                    </div>\
                    <input type='text' value='' placeholder='Username (optional)' id='rpc_username_input'/>\
                    <input type='password' value='' placeholder='Password (optional)' id='rpc_password_input'/>\
                </div>" : "",
            selected = this_data.selected,
            selected_title = selected.name || selected.url,
            content = "\
            <div class='formbox' id='settingsbox' data-id='" + glob_ap_id + "'>\
                <h2 class='icon-sphere'>" + translate("choose") + " " + thiscurrency + " " + glob_ap_id + "</h2>\
                <div class='popnotify'></div>\
                <div class='popform'>\
                    <div class='selectbox'>\
                        <input type='text' value='" + selected_title + "' placeholder='Choose RPC node' readonly='readonly' id='rpc_main_input'/>\
                        <div class='selectarrows icon-menu2' data-pe='none'></div>\
                        <div class='options'>\
                        </div>\
                    </div>" +
            api_form +
            "<input type='submit' class='submit' value='" + translate("okbttn") + "' data-currency='" + thiscurrency + "'/>\
                </div>\
            </div>";
        popdialog(content, "triggersubmit");
        const optionlist = $("#settingsbox").find(".options");
        $.each(api_list, function(key, value) {
            if (value.display === true) {
                let selected = value.url === selected_title || value.name === selected_title;
                if (thiscurrency === "nano") {
                    test_append_rpc(thiscurrency, optionlist, key, value, selected);
                } else {
                    rpc_option_li(optionlist, true, key, value, selected, false);
                }
            }
        });
        $.each(options, function(key, value) {
            let selected = value.url === selected_title || value.name === selected_title;
            test_append_rpc(thiscurrency, optionlist, key, value, selected);
        });
        $("#rpc_main_input").data(selected);
        setTimeout(function() {
            closesocket();
        }, 5000);
    })
}

// Function to get RPC placeholders for different currencies and API types
function get_rpc_placeholder(currency) {
    return {
        "apisnano1": "eg: http://127.0.0.1:7076",
        "apisnano2": "eg: http://some.local-or-remote.node:7076",
        "apisnano3": "eg: http://localhost:7076",
        "websocketsnano1": "eg: ws://127.0.0.1:7078",
        "websocketsnano2": "eg: ws://some.local-or-remote.node:7078",
        "websocketsnano3": "eg: ws://localhost:7078",
        "apiseth1": "eg: http://localhost:8545",
        "apiseth2": "eg: http://some.local-or-remote.node:8546",
        "apiseth3": "eg: https://mainnet.infura.io/v3/YOUR-PROJECT-ID",
        "websocketseth1": "eg: ws://localhost:8545",
        "websocketseth2": "eg: ws://some.local-or-remote.node:8546",
        "websocketseth3": "eg: wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID"
    }
}

// Function to test and append RPC options for different cryptocurrencies
function test_append_rpc(thiscurrency, optionlist, key, value, selected) {
    if (glob_ap_id === "apis") {
        if (thiscurrency === "ethereum" || glob_is_erc20t === true) {
            const txhash = "0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", // random tx
                payload = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_getTransactionByHash",
                    "params": [txhash]
                };
            api_proxy({
                "api_url": value.url,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(payload),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(e) {
                const data = br_result(e),
                    rhash = q_obj(data, "result.result.hash");
                rpc_option_li(optionlist, rhash === txhash, key, value, selected, true);
            }).fail(function(e) {
                rpc_option_li(optionlist, false, key, value, selected, true);
            });
            return
        }
        const rpcurl = get_rpc_url({
            "url": value.url,
            "username": value.username,
            "password": value.password
        });
        const pload = glob_is_btc ? { // mempoolspace API
            "api_url": value.url + "/api/v1/difficulty-adjustment",
            "proxy": false,
            "params": {
                "method": "GET"
            }
        } : {
            "api": thiscurrency,
            "search": "test",
            "cachetime": 25,
            "cachefolder": "1h",
            "api_url": rpcurl,
            "params": {
                "method": "POST",
                "data": JSON.stringify(glob_test_rpc_call),
                "headers": {
                    "Content-Type": "text/plain"
                }
            }
        }
        api_proxy(pload).done(function(e) {
            const data = br_result(e),
                result = data.result,
                live = $.isEmptyObject(result) ? false : (thiscurrency === "nano" ? result.network === "live" : true);
            rpc_option_li(optionlist, live, key, value, selected, true);
        }).fail(function(e) {
            rpc_option_li(optionlist, false, key, value, selected, true);
        });
        return
    }
    if (glob_ap_id === "websockets") {
        let provider = value.url,
            provider_name = value.name || provider,
            ping_event = "heartbeat";
        if (provider_name === "blockcypher wss") {
            provider = value.url + "btc/main";
        }
        if (glob_is_btc) {
            ping_event = JSON.stringify({
                "action": "want",
                "data": ["stats"]
            });
        }
        if (thiscurrency === "nano") {
            const naddr = "nano_1hedzz9g3oq1pw49hf9u9koqgwwg8in49o73xwrnfu9j43qk533r7hhuratx"; // random xno address for testing
            ping_event = JSON.stringify({
                "action": "subscribe",
                "topic": "confirmation",
                "all_local_accounts": true,
                "options": {
                    "accounts": [naddr]
                },
                "ack": true
            });
        }
        if (thiscurrency === "ethereum" || glob_is_erc20t === true) {
            const if_id = get_infura_apikey(provider);
            provider = provider + if_id,
                ping_event = JSON.stringify({
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "eth_subscribe",
                    "params": ["logs", {
                        "address": glob_expected_eth_address,
                        "topics": []
                    }]
                });
        }
        let web_socket = glob_sockets["ws_test"] = new WebSocket(provider);
        web_socket.onopen = function(e) {
            web_socket.send(ping_event);
            console.log("Connected: " + provider);
        };
        web_socket.onmessage = function(e) {
            rpc_option_li(optionlist, true, key, value, selected, true);
            console.log("socket test success");
            web_socket.close();
            web_socket = null;
            closesocket("ws_test");
        };
        web_socket.onclose = function(e) {
            console.log("End socket test");
        };
        web_socket.onerror = function(e) {
            rpc_option_li(optionlist, false, key, value, selected, true);
            console.log("socket test failed");
            web_socket.close();
            web_socket = null;
            closesocket("ws_test");
        };
    }
}

// Function to create and append an RPC option list item
function rpc_option_li(optionlist, live, key, value, selected, checked) {
    const liveclass = live ? " live" : " offline",
        selected_class = selected ? " rpc_selected" : "",
        icon = live ? "connection" : "wifi-off",
        datakey = checked ? " data-key='" + key + "'" : "",
        default_class = value.default !== false ? " default" : "",
        node_name = value.name || value.url,
        option = $("<div class='optionwrap" + liveclass + selected_class + default_class + "' style='display:none' data-pe='none'><span" + datakey + " data-value='" + value.url + "' data-pe='none'>" + node_name + "</span><div class='opt_icon_box' data-pe='none'><div class='opt_icon c_stat icon-" + icon + "' data-pe='none'></div><div class='opt_icon icon-bin' data-pe='none'></div></div>");
    option.data(value).appendTo(optionlist);
    option.slideDown(500);
}

// Function to handle RPC node selection
function test_rpcnode() {
    $(document).on("click", "#settingsbox .selectbox .options > div", function(e) {
        const target = $(e.target);
        if (target.hasClass("icon-bin")) {
            return // prevent selection when deleting
        }
        const thisoption = $(this),
            thisdata = thisoption.data();
        if (thisoption.hasClass("offline")) {
            playsound(glob_funk);
            topnotify(translate("unabletoconnect"));
            return
        }
        const settingsbox = $("#settingsbox"),
            rpc_main_input = settingsbox.find("#rpc_main_input");
        rpc_main_input.removeData().data(thisdata);
        settingsbox.find(".options .optionwrap").removeClass("rpc_selected");
        thisoption.addClass("rpc_selected");
    })
}

// Function to handle RPC node submission
function submit_rpcnode() {
    $(document).on("click", "#settingsbox input.submit", function(e) {
        e.preventDefault();
        const settingsbox = $("#settingsbox"),
            thiscurrency = $(this).attr("data-currency"),
            rpc_main_input = settingsbox.find("#rpc_main_input"),
            setvalue = rpc_main_input.data(),
            rpc_input_box = settingsbox.find("#rpc_input_box");
        if (rpc_input_box.length) {
            const rpc_url_input_val = rpc_input_box.find("#rpc_url_input").val();
            if (rpc_url_input_val.length > 5) {
                const optionsbox = settingsbox.find(".options"),
                    duplicates = optionsbox.find("span[data-value='" + rpc_url_input_val + "']"),
                    indexed = duplicates.length > 0;
                if (indexed || rpc_url_input_val.indexOf("mempool.space") > -1 ||
                    rpc_url_input_val.indexOf("litecoinspace.org") > -1) {
                    popnotify("error", translate("nodealreadyadded"));
                    return
                }
                const rpc_username_input_val = rpc_input_box.find("#rpc_username_input").val(),
                    rpc_password_input_val = rpc_input_box.find("#rpc_password_input").val(),
                    rpc_data = {
                        "url": rpc_url_input_val,
                        "username": rpc_username_input_val,
                        "password": rpc_password_input_val,
                        "default": false
                    };
                test_rpc(rpc_input_box, rpc_data, thiscurrency);
                return
            }
        }
        pass_rpc_submit(thiscurrency, setvalue, false)
    })
}

// Function to test RPC connection for various cryptocurrencies
function test_rpc(rpc_input_box, rpc_data, currency) {
    const cant_connect = translate("unabletoconnect");
    if (glob_ap_id === "apis") {
        if (currency === "ethereum" || glob_is_erc20t === true) {
            const txhash = "0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", // random tx
                payload = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_getTransactionByHash",
                    "params": [txhash]
                };
            api_proxy({
                "api_url": rpc_data.url,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(payload),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(e) {
                const data = br_result(e),
                    rhash = q_obj(data, "result.result.hash");
                if (rhash === txhash) {
                    rpc_input_box.addClass("live").removeClass("offline");
                    pass_rpc_submit(currency, rpc_data, true);
                    return
                }
                rpc_input_box.addClass("offline").removeClass("live");
                popnotify("error", cant_connect);
            }).fail(function(e) {
                rpc_input_box.addClass("offline").removeClass("live");
                popnotify("error", cant_connect);
            });
            return
        }
        const rpcurl = get_rpc_url(rpc_data),
            testadress = {
                "bitcoin": glob_expected_bech32,
                "litecoin": glob_expected_ltc_address,
                "dogecoin": glob_expected_doge_address,
                "bitcoin-cash": glob_expected_bch_cashaddr
            } [currency] || "",
            pload = glob_is_btc ? {
                "api_url": rpcurl + "/api/address/" + testadress + "/txs",
                "proxy": false,
                "params": {
                    "method": "GET"
                }
            } : {
                "api": currency,
                "search": "test",
                "cachetime": 25,
                "cachefolder": "1h",
                "api_url": rpcurl,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(glob_test_rpc_call),
                    "headers": {
                        "Content-Type": "text/plain"
                    }
                }
            }
        api_proxy(pload).done(function(e) {
            const data = br_result(e),
                rpc_result = data.result;
            const error = data.error || rpc_result.error;
            if (error) {
                rpc_input_box.addClass("offline").removeClass("live");
                topnotify(cant_connect);
                const error_message = error.error_message || error.message;
                if (error_message) {
                    popnotify("error", error_message);
                }
                return
            }
            if (rpc_result && (br_issar(rpc_result) || rpc_result.rpc_version)) {
                rpc_input_box.addClass("live").removeClass("offline");
                pass_rpc_submit(currency, rpc_data, true);
            }
        }).fail(function(e) {
            rpc_input_box.addClass("offline").removeClass("live");
            topnotify(cant_connect);
        });
        return
    }
    if (glob_ap_id === "websockets") {
        let provider = rpc_data.url,
            ping_event;
        if (glob_is_btc) {
            ping_event = JSON.stringify({
                "action": "ping"
            });
        }
        if (currency === "nano") {
            let naddr = "nano_1hedzz9g3oq1pw49hf9u9koqgwwg8in49o73xwrnfu9j43qk533r7hhuratx"; // random xno address for testing
            ping_event = JSON.stringify({
                "action": "subscribe",
                "topic": "confirmation",
                "all_local_accounts": true,
                "options": {
                    "accounts": [naddr]
                },
                "ack": true
            });
        }
        if (currency === "ethereum" || glob_is_erc20t === true) {
            ping_event = JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_subscribe",
                "params": ["logs", {
                    "address": glob_expected_eth_address,
                    "topics": []
                }]
            });
        }
        let w_socket = glob_sockets["ws_submit"] = new WebSocket(provider);
        w_socket.onopen = function(e) {
            w_socket.send(ping_event);
            console.log("Connected: " + provider);
        };
        w_socket.onmessage = function(e) {
            rpc_input_box.addClass("live").removeClass("offline");
            pass_rpc_submit(currency, rpc_data, true);
            console.log("socket test success");
            w_socket.close();
            w_socket = null;
            closesocket("ws_submit");
        };
        w_socket.onclose = function(e) {
            console.log("End socket test");
        };
        w_socket.onerror = function(e) {
            rpc_input_box.addClass("offline").removeClass("live");
            popnotify("error", cant_connect);
            console.log("socket test failed");
            w_socket.close();
            w_socket = null;
            closesocket("ws_submit");
        };
        setTimeout(function() {
            closesocket();
        }, 5000);
    }
}

// Function to finalize RPC submission and update settings
function pass_rpc_submit(thiscurrency, thisvalue, newnode) {
    const rpc_setting_li = cs_node(thiscurrency, glob_ap_id),
        options = rpc_setting_li.data("options"),
        node_name = thisvalue.name || thisvalue.url;
    rpc_setting_li.data("selected", thisvalue).find("p").html(node_name);
    if (newnode === true) {
        if ($.isEmptyObject(options)) {
            rpc_setting_li.data("options", [thisvalue]);
        } else {
            options.push(thisvalue);
        }
    }
    canceldialog();
    notify(translate("datasaved"));
    save_cc_settings(thiscurrency, true);
}

// Function to handle removal of RPC nodes
function remove_rpcnode() {
    $(document).on("click", "#settingsbox .options .opt_icon_box .icon-bin", function(e) {
        e.preventDefault();
        const thistrigger = $(this),
            settingsbox = $("#settingsbox"),
            thiscurrency = settingsbox.find("#rpc_input_box").attr("data-currency"),
            rpc_setting_li = cs_node(thiscurrency, glob_ap_id),
            options = rpc_setting_li.data("options");
        if (options && options.length) {
            const thisoption = thistrigger.closest(".optionwrap"),
                thisdata = thisoption.data(),
                thisurl = thisdata.url,
                default_node = thisdata.default !== false,
                optionsbox = settingsbox.find(".options"),
                duplicates = optionsbox.find("span[data-value='" + thisurl + "']"),
                is_duplicate = duplicates.length > 1;
            if (default_node === true && !is_duplicate) {
                playsound(glob_funk);
                topnotify(translate("removedefaultnode"));
                return
            }
            const thisname = thisdata.name || thisurl,
                result = confirm(translate("confirmremovenode", {
                    "thisname": thisname
                }));
            if (result) {
                const new_array = options.filter(option => option.url !== thisurl);
                thisoption.slideUp(500, function() {
                    $(this).remove();
                });
                rpc_setting_li.data("options", new_array);
                notify(translate("rpcnoderemoved"));
                $("#rpc_url_input").val("");
                save_cc_settings(thiscurrency, true);
            }
        }
        return
    })
}

// Function to construct RPC URL with optional authentication
function get_rpc_url(rpc_data) {
    if (rpc_data === false) {
        return false;
    }
    const url = rpc_data.url,
        username = rpc_data.username,
        password = rpc_data.password,
        login_param = (username && password) ? username + ":" + password + "@" : "",
        hasprefix = url.includes("http"),
        urlsplit = hasprefix ? url.split("://") : url;
    return hasprefix ? urlsplit[0] + "://" + login_param + urlsplit[1] : url;
}

// Layer 2's

// Function to handle editing of eth Layer 2 settings
function edit_l2() {
    $(document).on("click", ".cc_settinglist li[data-id='layer2']", function() {
        const thiscurrency = $(this).children(".liwrap").attr("data-currency"),
            csnode = cs_node(thiscurrency, "layer2", true),
            options = csnode.options;
        if (options) {
            const ccsymbol = fetchsymbol(thiscurrency),
                symbol = ccsymbol.symbol,
                ctracts = contracts(symbol),
                arb_contract = ctracts.arbitrum,
                polygon_contract = ctracts.polygon,
                bnb_contract = ctracts.bnb,
                networks = [];
            $.each(options, function(key, value) {
                if (key === "arbitrum" && !arb_contract && thiscurrency !== "ethereum") {} else if (key === "polygon" && !polygon_contract && thiscurrency !== "ethereum") {} else if (key === "bnb" && !bnb_contract && thiscurrency !== "ethereum") {} else {
                    const nw_name = key === "bnb" ? "bnb smart chain" : key,
                        nw_selected = value.selected,
                        s_boxes = []
                    $.each(value, function(k, v) {
                        if (k === "selected") {

                        } else {
                            const selected = v.selected,
                                apis = v.apis,
                                api_push = [];
                            $.each(apis, function(i, v2) {
                                api_push.push({
                                    "span": {
                                        "data-pe": "none",
                                        "attr": add_prefix_to_keys(v2),
                                        "content": v2.name
                                    }
                                });
                            });
                            s_boxes.push({
                                "div": {
                                    "class": "l2_apis",
                                    "attr": {
                                        "data-type": k
                                    },
                                    "content": [{
                                        "h3": {
                                            "content": k
                                        },
                                        "div": {
                                            "class": "selectbox",
                                            "content": [{
                                                    "input": {
                                                        "attr": {
                                                            "type": "text",
                                                            "value": selected.name,
                                                            "placeholder": translate("layer2"),
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
                                                        "class": "options single",
                                                        "content": api_push
                                                    }
                                                }
                                            ]
                                        }
                                    }]
                                }
                            });
                        }
                    });
                    networks.push({
                        "div": {
                            "class": "nw2box",
                            "attr": {
                                "data-network": key
                            },
                            "content": [{
                                "h2": {
                                    "class": "nwheading",
                                    "content": nw_name + switchpanel(nw_selected, " custom")
                                },
                                "div": {
                                    "class": "sboxwrap hide",
                                    "content": s_boxes
                                }
                            }]
                        }
                    });
                }
            });
            networks.push({
                "input": {
                    "class": "submit",
                    "attr": {
                        "type": "submit",
                        "value": translate("okbttn"),
                        "data-currency": thiscurrency
                    }
                }
            });
            const sb_render = render_html(networks),
                ddat = [{
                    "div": {
                        "class": "popform",
                        "content": sb_render
                    }
                }],
                content = template_dialog({
                    "id": "l2_formbox",
                    "icon": "icon-new-tab",
                    "title": translate("layer2"),
                    "elements": ddat
                });
            popdialog(content, "triggersubmit");
        }
    })
}

function l2nw_toggle() {
    $(document).on("mouseup", "#l2_formbox h2.nwheading", function(e) {
        const target = $(e.target);
        if (target.hasClass("switchpanel")) {
            return // prevent selection when deleting
        }
        const all_bws = $("#l2_formbox").find(".sboxwrap"),
            this_boxwrap = $(this).next(".sboxwrap");
        if (this_boxwrap.is(":visible")) {
            all_bws.slideUp(200);
            return
        }
        all_bws.not(this_boxwrap).slideUp(200);
        this_boxwrap.slideDown(200);
    })
}

function l2nw_switch() {
    $(document).on("mouseup", "#l2_formbox h2.nwheading .switchpanel", function() {
        const this_switch = $(this),
            sboxwrap = this_switch.parent("h2.nwheading").next(".sboxwrap");
        if (this_switch.hasClass("true")) {
            this_switch.removeClass("true").addClass("false");
            sboxwrap.slideUp(300);
            return
        }
        this_switch.removeClass("false").addClass("true");
    })
}

// Function to handle submission of Layer 2 settings
function submit_l2() {
    $(document).on("click", "#l2_formbox input.submit", function(e) {
        e.preventDefault();
        const payment = $(this).attr("data-currency"),
            csnode = cs_node(payment, "layer2");
        if (csnode) {
            const cs_node_dat = csnode.data("options"),
                nw2box = $("#l2_formbox").find(".popform > .nw2box");
            nw2box.each(function() {
                const this_box = $(this),
                    this_network = this_box.data("network"),
                    this_switch = this_box.find(".switchpanel"),
                    selected = this_switch.hasClass("true"),
                    l2_apis = this_box.find(".l2_apis");
                cs_node_dat[this_network].selected = selected;
                l2_apis.each(function() {
                    const this_nw = $(this),
                        input = this_nw.find(".selectbox > input"),
                        input_data = input.data();
                    if (!$.isEmptyObject(input_data)) {
                        const this_type = this_nw.data("type"),
                            new_selected = q_obj(cs_node_dat, this_network + "." + this_type);
                        if (new_selected) {
                            new_selected.selected = input_data;
                        }
                    }
                });
            });
            csnode.data("options", cs_node_dat).find("p").html("");
            canceldialog();
            notify(translate("datasaved"));
            save_cc_settings(payment, true);
        }
    })
}

// Function to handle editing of Xpub settings
function edit_xpub_trigger() {
    $(document).on("click", ".cc_settinglist li[data-id='Xpub'] .atext", function() {
        if (!glob_test_derive) {
            playsound(glob_funk)
            return
        }
        const thisnode = $(this),
            thislist = thisnode.closest("li"),
            thisdat = thislist.data();
        if (!thisdat.selected || !thisdat.key) {
            return
        }
        const thisliwrap = thislist.find(".liwrap"),
            thiscurrency = thisliwrap.attr("data-currency"),
            coindat = getcoindata(thiscurrency),
            xpub = thisdat.key,
            cc_icon = getcc_icon(coindat.cmcid, coindat.ccsymbol + "-" + thiscurrency, coindat.erc20),
            content = $("<div id='ad_info_wrap'><h2>" + cc_icon + " " + translate("bip32xpub") + "</h2>\
                <div class='d_ulwrap'>\
                    <ul>\
                        <li><strong>Key: </strong><span class='adbox adboxl select'>" + xpub + "</span>\
                        <div id='qrcodexp' class='qrwrap flex'><div class='qrcode'></div>" + cc_icon + "</div>\
                        </li>\
                        <li><strong>" + translate("derivationpath") + ":</strong> M/0/</li>\
                    </ul>\
                </div>\
                <div id='backupactions'>\
                    <div id='delete_xpub' data-currency='" + thiscurrency + "' class='util_icon icon-bin'></div>\
                    <div id='backupcd'>" + cancelbttn + "</div>\
                </div>\
            </div>");
        popdialog(content, "triggersubmit", null, true);
        $("#qrcodexp .qrcode").qrcode(xpub);
    })
}

// Function to handle deletion of Xpub
function delete_xpub() {
    $(document).on("click", "#delete_xpub", function() {
        const result = confirm(translate("delete") + " " + translate("bip32xpub") + "?");
        if (result) {
            const currency = $(this).attr("data-currency"),
                xpubli = cs_node(currency, "Xpub"),
                x_pubid = xpubli.data("key_id");
            delete_xpub_cb(currency, x_pubid, true);
            saveaddresses(currency, false);
            check_currency(currency);
            xpubli.data({
                "selected": false,
                "key": null,
                "key_id": null
            }).find(".switchpanel").removeClass("true").addClass("false");
            xpubli.find("p").html("false");
            save_cc_settings(currency, true);
            canceldialog();
        }
    })
}

// Function to handle callback after Xpub deletion
function delete_xpub_cb(currency, x_pubid, uncheck) {
    const xpublist = filter_addressli(currency, "xpubid", x_pubid);
    xpublist.each(function() {
        const thisli = $(this);
        thisli.removeClass("xpubv").addClass("xpubu");
        if (uncheck) {
            thisli.attr("data-checked", "false").data("checked", false);
        }
    });
}

// Function to handle callback after adding Xpub
function add_xpub_cb(currency, x_pubid) {
    const xpublist = filter_addressli(currency, "xpubid", x_pubid);
    xpublist.each(function() {
        $(this).addClass("xpubv").removeClass("xpubu").attr("data-checked", "true").data("checked", true);
    });
}

// Function to handle Xpub switch in currency settings
function xpub_cc_switch() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Xpub'] .switchpanel.custom", function() {
        if (glob_test_derive !== true) {
            playsound(glob_funk);
            return
        }
        const this_switch = $(this),
            thislist = this_switch.closest("li"),
            thisliwrap = this_switch.closest(".liwrap"),
            thiscurrency = thisliwrap.attr("data-currency"),
            thisdat = thislist.data();
        if (this_switch.hasClass("true")) {
            const result = confirm(translate("disablexpub"));
            if (result) {
                thislist.data("selected", false).find("p").html("false");
                this_switch.removeClass("true").addClass("false");
                save_cc_settings(thiscurrency, true);
                delete_xpub_cb(thiscurrency, thisdat.key_id);
            }
            return
        }
        if (thisdat.key) {
            thislist.data("selected", true).find("p").text("true");
            this_switch.removeClass("false").addClass("true");
            save_cc_settings(thiscurrency, true);
            add_xpub_cb(thiscurrency, thisdat.key_id);
            saveaddresses(thiscurrency, false);
            currency_check(thiscurrency);
            return
        }
        const cd = getcoindata(thiscurrency),
            ad = {
                "currency": thiscurrency,
                "ccsymbol": cd.ccsymbol,
                "cmcid": cd.cmcid,
                "erc20": cd.erc20
            }
        edit_xpub(ad);
    })
}

// Function to handle editing of Xpub
function edit_xpub(ad) {
    const currency = ad.currency,
        cpid = ad.ccsymbol + "-" + currency,
        address = ad.address || "",
        scanqr = (glob_hascam === true) ? "<div class='qrscanner' data-currency='" + currency + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        addxpub = translate("addxpub", {
            "currency": currency
        }),
        content = $("<div class='formbox form add' id='xpubformbox'>\
            <h2>" + getcc_icon(ad.cmcid, cpid, ad.erc20) + " " + addxpub + "</h2>\
            <div class='popnotify'></div>\
            <form class='addressform popform'>\
                <div class='inputwrap'><input type='text' id='xpub_input' class='address' value='" + address + "' placeholder='" + addxpub + "' data-currency='" + currency + "'>" + scanqr + "</div>\
                <div id='ad_info_wrap' style='display:none'>\
                    <ul class='td_box'>\
                    </ul>\
                    <div id='pk_confirm' class='noselect'>\
                        <div id='matchwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("xpubmatch", {
            "currency": currency
        }) + "</span><br/>\
                        <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("xpubkeys") + "</span>\
                    </div>\
                </div>\
                <input type='submit' class='submit' value='" + translate("okbttn") + "'></form>").data(ad);
    popdialog(content, "triggersubmit");
    if (!glob_supportsTouch) {
        $("#popup input.address").focus();
    }
}

// Function to handle Xpub input changes
function xpub_change() {
    $(document).on("input", "#xpub_input", function(e) {
        const thisnode = $(this),
            addressinputval = thisnode.val(),
            currency = thisnode.attr("data-currency"),
            valid = check_xpub(addressinputval, xpub_prefix(currency), currency);
        if (valid) {
            clear_xpub_checkboxes();
            validate_xpub(thisnode.closest("#xpubformbox"));
            return
        }
        xpub_fail(currency);
    })
}

// Function to trigger Xpub submission
function submit_xpub_trigger() {
    $(document).on("click", "#xpubformbox input.submit", function(e) {
        e.preventDefault();
        validate_xpub($(this).closest("#xpubformbox"));
    })
}

// Function to validate Xpub
function validate_xpub(thisnode) {
    const this_data = thisnode.data(),
        currency = this_data.currency,
        addressfield = thisnode.find(".address"),
        addressinputval = addressfield.val();
    if (!addressinputval) {
        xpub_fail(currency);
        addressfield.focus();
        return
    }
    const valid = check_xpub(addressinputval, xpub_prefix(currency), currency),
        tdbox = $("#ad_info_wrap .td_box"),
        dp_body = $("#ad_info_wrap");
    if (valid !== true) {
        const errormessage = translate("invalidxpub", {
            "currency": currency
        });
        popnotify("error", errormessage);
        setTimeout(function() {
            addressfield.select();
        }, 10);
        return
    }
    const derive_list = xpub_derivelists(currency, addressinputval);
    if (!derive_list) {
        xpub_fail(currency);
        return false;
    }
    tdbox.html(derive_list);
    dp_body.slideDown("500");
    const pk_checkbox = thisnode.find("#pk_confirmwrap"),
        pk_checked = pk_checkbox.data("checked"),
        matchwrap = thisnode.find("#matchwrap"),
        mw_checked = matchwrap.data("checked");
    if (!mw_checked) {
        popnotify("error", translate("confirmmatch"));
        return false;
    }
    if (!pk_checked) {
        popnotify("error", translate("confirmpkownership"));
        return false;
    }
    const xpubli = cs_node(currency, "Xpub"),
        haskey = xpubli.data("key");
    if (haskey) {
        if (haskey === addressinputval) {
            canceldialog();
            return false;
        }
        if (!confirm(translate("replacexpub"))) {
            return false;
        }
    }
    const xpub_id = hmacsha(addressinputval, "sha256").slice(0, 8);
    xpubli.data({
        "selected": true,
        "key": addressinputval,
        "key_id": xpub_id
    }).find(".switchpanel").removeClass("false").addClass("true");
    xpubli.find("p").html("true");
    const currencyli = get_currencyli(currency),
        home_icon = get_homeli(currency);
    currencyli.attr("data-checked", "true").data("checked", true);
    home_icon.removeClass("hide");
    savecurrencies(true);
    save_cc_settings(currency, true);
    const keycc = key_cc_xpub(addressinputval),
        coindat = getcoindata(currency),
        bip32 = getbip32dat(currency);
    keycc.seedid = xpub_id;
    const ad = derive_obj("xpub", keycc, coindat, bip32);
    if (ad) {
        derive_add_address(currency, ad);
    }
    canceldialog();
    clear_savedurl();
    if (glob_body.hasClass("showstartpage")) {
        const acountname = $("#eninput").val();
        $("#accountsettings").data("selected", acountname).find("p").html(acountname);
        savesettings();
        openpage("?p=home", "home", "loadpage");
        glob_body.removeClass("showstartpage");
        home_icon.find(".rq_icon").trigger("click");
        return
    }
    notify(translate("xpubsaved"));
    add_xpub_cb(currency, xpub_id);
    saveaddresses(currency, false);
    currency_check(currency);
}

// Function to handle Xpub validation failure
function xpub_fail(currency) {
    const errormessage = translate("invalidxpub", {
        "currency": currency
    });
    popnotify("error", errormessage);
    clear_xpub_inputs();
}

// Function to clear Xpub input fields
function clear_xpub_inputs() {
    $("#ad_info_wrap").slideUp(200, function() {
        $("#ad_info_wrap .td_box").html("");
    });
    clear_xpub_checkboxes();
}

// Function to clear Xpub checkboxes
function clear_xpub_checkboxes() {
    $("#pk_confirmwrap, #matchwrap").attr("data-checked", "false").data("checked", false);
}

// Function to generate Xpub derivation list
function xpub_derivelists(currency, xpub) {
    try {
        const coindat = getcoindata(currency),
            bip32dat = getbip32dat(currency),
            root_path = "M/0/",
            startindex = 0,
            keycc = key_cc_xpub(xpub),
            key = keycc.key,
            chaincode = keycc.cc,
            versionbytes = keycc.version,
            root_dat = {
                "key": key,
                "cc": chaincode,
                "xpub": true,
                "versionbytes": versionbytes
            },
            derive_array = keypair_array(false, new Array(5), startindex, root_path, bip32dat, key, chaincode, currency, versionbytes),
            derivelist = derive_array.map((val, i) => {
                const index = startindex + i;
                return "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> | <span class='mspace'>" + val.address + "</span></li>";
            }).join("");
        return derivelist;
    } catch (err) {
        return false;
    }
}

// Function to check if Xpub is valid
function check_xpub(address, prefix, currency) {
    const prefixes = {
            bitcoin: "zpub|xpub",
            litecoin: "zpub|Ltub"
        },
        this_prefix = prefixes[currency] || prefix,
        regex = "(" + this_prefix + ")([a-km-zA-HJ-NP-Z1-9]{107})(\\?c=\\d*&h=bip\\d{2,3})?";
    return new RegExp(regex).test(address);
}

// Function to handle key management
function key_management() {
    $(document).on("click", ".cc_settinglist li[data-id='Key derivations'] .atext", function() {
        const thisnode = $(this),
            thislist = thisnode.closest("li"),
            thisdat = thislist.data(),
            thisliwrap = thislist.find(".liwrap"),
            thiscurrency = thisliwrap.attr("data-currency"),
            activepub = active_xpub(thiscurrency);
        if (activepub) {
            xpub_info_pu(thiscurrency, activepub.key);
            return
        }
        if (glob_hasbip === true) {
            if (thiscurrency === "monero" && is_viewonly() === false) {
                all_pinpanel({
                    "func": phrase_info_pu,
                    "args": thiscurrency
                }, true, true);
                return
            }
            phrase_info_pu(thiscurrency);
            return
        }
        if (is_viewonly() === true) {
            vu_block();
            return false;
        }
        manage_bip32();
    })
}

// Function to handle SegWit switch
function segwit_switch() {
    $(document).on("mouseup", "#segw_box .toggle_segwit .switchpanel", function() {
        if (is_viewonly() === true) {
            vu_block();
            return
        }
        const this_switch = $(this),
            thisvalue = this_switch.hasClass("true"),
            current_li = this_switch.closest("li"),
            thiscurrency = current_li.attr("data-currency"),
            kdli = cs_node(thiscurrency, "Xpub"),
            kdli_dat = kdli.data(),
            rootpath = kdli_dat.root_path,
            coincode = rootpath.split("/")[2],
            dpath_header = $("#d_paths .pd_" + thiscurrency + " .d_path_header span.ref");
        if (thisvalue === true) {
            const result = confirm(translate("uselegacy", {
                "thiscurrency": thiscurrency
            }));
            if (result === false) {
                return
            }
            const dp = "m/44'/" + coincode + "/0'/0/";
            kdli.data("root_path", dp);
            this_switch.removeClass("true").addClass("false");
            dpath_header.text(dp);
        } else {
            const result = confirm(translate("usesegwit", {
                "thiscurrency": thiscurrency
            }));
            if (result === false) {
                return
            }
            const dp = "m/84'/" + coincode + "/0'/0/";
            kdli.data("root_path", dp);
            this_switch.addClass("true").removeClass("false");
            dpath_header.text(dp);
        }
        const dpath_next = $("#d_paths .pd_" + thiscurrency + " .d_path_body .td_bar .td_next");
        save_cc_settings(thiscurrency, true);
        test_derive_function(dpath_next, "replace");
    })
}

// Function to trigger BIP39 settings
function bip39_sc(coinsc) {
    $("#" + coinsc + "_settings .cc_settinglist li[data-id='Key derivations'] .atext").trigger("click");
}

// Function to display Xpub info popup
function xpub_info_pu(currency, xpub) {
    const coindat = getcoindata(currency),
        bip32dat = getbip32dat(currency),
        root_path = "M/0/",
        startindex = 0,
        keycc = key_cc_xpub(xpub),
        key = keycc.key,
        chaincode = keycc.cc,
        versionbytes = keycc.version,
        root_dat = {
            "key": key,
            "cc": chaincode,
            "xpub": true,
            "versionbytes": versionbytes
        },
        derive_array = keypair_array(false, new Array(5), startindex, root_path, bip32dat, key, chaincode, currency, versionbytes),
        derivelist = derive_array.map((val, i) => {
            const index = startindex + i;
            return "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> | <span class='mspace'>" + val.address + "</span></li>";
        }).join(""),
        ccsymbol = coindat.ccsymbol,
        cc_icon = getcc_icon(coindat.cmcid, ccsymbol + "-" + currency, coindat.erc20),
        content = $("<div id='ad_info_wrap'><h2>" + cc_icon + " <span>" + currency + " " + translate("Key derivations") + "</span></h2><ul>\
        <li id='xpub_box' class='clearfix noline'>\
            <div class='xpub_ib clearfix pd_" + currency + "' data-xpub='" + xpub + "'>\
                <div class='show_xpub'><strong>Xpub: </strong><span class='xpref ref'>" + translate("show") + "</span></div>\
                    <div class='xp_span drawer'>\
                        <div class='qrwrap flex'><div class='qrcode'></div>" + cc_icon + "</div>\
                        <p class='adbox adboxl select' data-type='Xpub'>" + xpub + "</p>\
                    </div>\
                </div>\
        <li>\
            <div id='d_paths'></div>\
        </li>\
    </ul>\
    </div>").data(root_dat);
    popdialog(content, "triggersubmit");
    const dp_node_dat = {
            "bip32": bip32dat,
            "currency": currency
        },
        dp_node = $("<div class='d_path pd_" + currency + "'>\
            <div class='d_path_header'><strong>Derivation path: </strong><span class='ref'>" + root_path + "</span></div>\
            <div class='d_path_body clearfix'>\
                <div class='td_bar'><div class='td_next button'>" + translate("next") + "</div><div class='td_prev button'>" + translate("prev") + "</div></div>\
                <ul class='td_box'>" + derivelist + "</ul>\
            </div>\
        </div>").data(dp_node_dat);
    $("#d_paths").append(dp_node);
    setTimeout(function() {
        $("#ad_info_wrap .d_path_header").trigger("click");
    }, 550);
}

// Function to trigger API key addition
function trigger_apikey() {
    $(document).on("click", "#add_api", function() {
        add_apikey($(this).attr("data-api"));
    })
}

// Function to add API key
function add_apikey(api) {
    const get_key = $("#apikeys").data(api),
        api_key = get_key || "",
        apidata = get_api_data(api),
        sign_up = apidata.sign_up,
        get_apikey_url = !sign_up ? "" : "<div id='api_signin'>Get your " + api + " API key <a href='" + sign_up + "' target='blank' class='exit'>here</a></div>",
        content = "\
        <div class='formbox' id='add_apikey'>\
            <h2 class='icon-key'>Set " + api + " API key</h2>\
            <div class='popnotify'></div>\
            <div class='popform' data-api='" + api + "'>\
                <input type='text' value='" + api_key + "' placeholder='API key' data-apikey='" + api_key + "' data-checkchange='" + api_key + "'>\
                <input type='submit' class='submit' value='" + translate("okbttn") + "'/>\
            </div>" + get_apikey_url +
        "</div>";
    canceldialog();
    setTimeout(function() {
        popdialog(content, "triggersubmit");
    }, 800);
}

// Function to submit API key
function submit_apikey() {
    $(document).on("click", "#add_apikey input.submit", function(e) {
        e.preventDefault();
        const thisform = $(this).closest(".popform"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            currentkey = thisinput.attr("data-apikey");
        if (!thisvalue) {
            popnotify("error", translate("validateapikey"));
            return;
        }
        if (thisvalue === currentkey) {
            canceldialog();
            return
        }
        if (thisinput.attr("data-checkchange") === thisvalue) {
            popnotify("error", translate("validateapikey"));
            return
        }
        thisinput.attr("data-checkchange", thisvalue);
        checkapikey(thisform.attr("data-api"), thisvalue, true);
    })
}

// Function to reset coin settings
function reset_coinsettings() {
    $(document).on("click", ".reset_cc_settings", function() {
        const thistrigger = $(this),
            currency = thistrigger.attr("data-currency");
        popdialog("<h2 class='icon-bin'>" + translate("resetdialog", {
            "currency": currency
        }) + "</h2>", "reset_coinsettings_function", thistrigger);
    })
}

// Function to perform coin settings reset
function reset_coinsettings_function(trigger) {
    const currency = trigger.attr("data-currency"),
        result = confirm(translate("resetconfirm", {
            "currency": currency
        }));
    if (result !== true) {
        return
    }
    const current_settings = br_get_local(currency + "_settings", true);
    if (current_settings) {
        const ln_settings = currency === "bitcoin" ? current_settings["Lightning network"] : false,
            xpub_settings = current_settings.Xpub || false,
            coinsettings = getcoinsettings(currency);
        if (ln_settings) {
            coinsettings["Lightning network"] = ln_settings; // don't reset lightning settings
        }
        if (xpub_settings) {
            coinsettings.Xpub = xpub_settings; // don't reset xpub settings
        }
        br_set_local(currency + "_settings", coinsettings, true);
        append_coinsetting(currency, coinsettings, false);
    }
    canceldialog();
    notify(translate("resetnotify", {
        "currency": currency
    }));
}