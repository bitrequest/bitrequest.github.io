$(document).ready(function() {
    // ** Core Setup & Initialization: **
    setup_confirmation_editor();
    save_confirmation_settings();
    toggle_address_reuse();
    toggle_currency_setting();
    setup_explorer_selection();
    save_explorer_settings();

    // ** RPC Node Management: **
    edit_rpcnode();
    //get_rpc_placeholder
    //validate_and_add_rpc_node
    //create_rpc_node_element
    handle_rpc_node_selection();
    submit_rpcnode();
    //validate_rpc_connection
    //save_rpc_settings
    delete_rpc_node();
    //build_rpc_endpoint_url

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
            currency_code = edit_btn.attr("data-currency"),
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
                                    "value": translate("okbttn"),
                                    "data-currency": currency_code
                                }
                            }
                        }
                    ]
                }
            }],
            dialog_html = template_dialog({
                "id": "conf_formbox",
                "icon": "icon-clock",
                "title": translate("confirmations"),
                "elements": dialog_data
            });
        popdialog(dialog_html, "triggersubmit");
        const selected_item = $("#conf_formbox ul.conf_options li").filter(function() {
            return $(this).find("span").text() === current_conf;
        });
        selected_item.find(".radio").removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
    })
}

// Processes form submission for cryptocurrency confirmation count changes with validation
function save_confirmation_settings() {
    $(document).on("click", "#conf_formbox input.submit", function(e) {
        e.preventDefault();
        const submit_btn = $(this),
            currency_code = submit_btn.attr("data-currency"),
            conf_value = submit_btn.prev("input").val(),
            settings_node = cs_node(currency_code, "confirmations");
        if (settings_node) {
            settings_node.data("selected", conf_value).find("p").html(conf_value);
            canceldialog();
            notify(translate("datasaved"));
            save_cc_settings(currency_code, true);
        }
    })
}

// Manages toggling of address reuse settings with user warnings for different cryptocurrencies
function toggle_address_reuse() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Reuse address'] .switchpanel.custom", function() {
        const toggle_btn = $(this),
            settings_item = toggle_btn.closest("li"),
            parent_wrap = toggle_btn.closest(".liwrap"),
            currency_code = parent_wrap.attr("data-currency"),
            warn_msg = settings_item.data("warning");
        if (toggle_btn.hasClass("true")) {
            let can_disable = true;
            if (warn_msg) {
                can_disable = confirm(translate("reusewarningalert", {
                    "thiscurrency": currency_code
                }));
            }
            if (can_disable) {
                settings_item.data("selected", false);
                toggle_btn.removeClass("true").addClass("false");
                save_cc_settings(currency_code, false);
            }
            return
        }
        const user_confirmed = confirm(translate("reusealert", {
            "thiscurrency": currency_code
        }));
        if (user_confirmed) {
            settings_item.data("selected", true);
            toggle_btn.removeClass("false").addClass("true");
            save_cc_settings(currency_code, true);
        }
    })
}

// Controls generic boolean switch toggles for cryptocurrency settings with automatic state persistence
function toggle_currency_setting() {
    $(document).on("mouseup", ".cc_settinglist li .switchpanel.bool", function() {
        const toggle_btn = $(this),
            settings_item = toggle_btn.closest("li"),
            parent_wrap = toggle_btn.closest(".liwrap"),
            currency_code = parent_wrap.attr("data-currency"),
            current_state = toggle_btn.hasClass("true");
        settings_item.data("selected", current_state);
        save_cc_settings(currency_code, false);
    })
}

// Manages block explorer selection UI with dynamic option population from available explorer list
function setup_explorer_selection() {
    $(document).on("click", ".cc_settinglist li[data-id='blockexplorers']", function() {
        const settings_item = $(this),
            item_data = settings_item.data(),
            explorer_list = item_data.options;
        if (explorer_list) {
            const currency_code = settings_item.children(".liwrap").attr("data-currency"),
                selected_explorer = item_data.selected,
                dialog_title = translate("chooseblockexplorer"),
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
                                    "value": translate("okbttn"),
                                    "data-currency": currency_code
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
        const currency_code = $(this).attr("data-currency"),
            selected_explorer = $("#be_formbox").find("input:first").val(),
            settings_node = cs_node(currency_code, "blockexplorers");
        if (settings_node) {
            settings_node.data("selected", selected_explorer).find("p").html(selected_explorer);
            canceldialog();
            notify(translate("datasaved"));
            save_cc_settings(currency_code, true);
        }
    })
}

// ** RPC Node Management: **

// Handles RPC/API endpoint configuration UI for both HTTP and WebSocket connections with placeholder suggestions
function edit_rpcnode() {
    $(document).on("click", ".cc_settinglist li[data-id='apis'], .cc_settinglist li[data-id='websockets']", function() {
        const settings_item = $(this),
            item_data = settings_item.data(),
            custom_nodes = item_data.options,
            predefined_nodes = item_data.apis;
        if (!exists(custom_nodes) && !exists(predefined_nodes)) {
            return
        }
        const currency_code = settings_item.children(".liwrap").attr("data-currency");
        glob_let.ap_id = settings_item.attr("data-id"),
            glob_let.test_rpc_call = item_data.rpc_test_command,
            glob_let.is_erc20t = ($("#" + currency_code + "_settings").attr("data-erc20") == "true"),
            glob_let.is_btc = is_btchain(currency_code) === true;
        const service_hint = glob_let.is_btc ? "mempool.space" : (currency_code === "ethereum" || glob_let.is_erc20t === true) ? "Infura" : "",
            dialog_title = glob_let.ap_id === "websockets" ? translate("addwebsocket", {
                "h_hint": service_hint
            }) : translate("addapi", {
                "h_hint": service_hint
            }),
            node_type = (currency_code === "ethereum" || glob_let.is_erc20t === true) ? "eth" : currency_code,
            placeholder_key = glob_let.ap_id + node_type + generate_random_number(1, 3),
            url_placeholder = get_rpc_placeholder(currency_code)[placeholder_key],
            default_placeholder = "eg: some.local-or-remote.node:port",
            input_form = custom_nodes ? "<div id='rpc_input_box' data-currency='" + currency_code + "' data-erc20='" + glob_let.is_erc20t + "'>\
                    <h3 class='icon-plus'>" + dialog_title + "</h3>\
                    <div id='rpc_input'>\
                        <input type='text' value='' placeholder='" + (url_placeholder || default_placeholder) + "' id='rpc_url_input'/>\
                        <div class='c_stat icon-wifi-off'></div>\
                        <div class='c_stat icon-connection'></div>\
                    </div>\
                    <input type='text' value='' placeholder='Username (optional)' id='rpc_username_input'/>\
                    <input type='password' value='' placeholder='Password (optional)' id='rpc_password_input'/>\
                </div>" : "",
            current_node = item_data.selected,
            node_title = current_node.name || current_node.url,
            dialog_html = "\
            <div class='formbox' id='settingsbox' data-id='" + glob_let.ap_id + "'>\
                <h2 class='icon-sphere'>" + translate("choose") + " " + currency_code + " " + glob_let.ap_id + "</h2>\
                <div class='popnotify'></div>\
                <div class='popform'>\
                    <div class='selectbox'>\
                        <input type='text' value='" + node_title + "' placeholder='Choose RPC node' readonly='readonly' id='rpc_main_input'/>\
                        <div class='selectarrows icon-menu2' data-pe='none'></div>\
                        <div class='options'>\
                        </div>\
                    </div>" +
            input_form +
            "<input type='submit' class='submit' value='" + translate("okbttn") + "' data-currency='" + currency_code + "'/>\
                </div>\
            </div>";
        popdialog(dialog_html, "triggersubmit");
        const node_list = $("#settingsbox").find(".options");
        $.each(predefined_nodes, function(node_id, node_data) {
            if (node_data.display === true) {
                let is_selected = node_data.url === node_title || node_data.name === node_title;
                if (currency_code === "nano") {
                    validate_and_add_rpc_node(currency_code, node_list, node_id, node_data, is_selected);
                } else {
                    create_rpc_node_element(node_list, true, node_id, node_data, is_selected, false);
                }
            }
        });
        $.each(custom_nodes, function(node_id, node_data) {
            let is_selected = node_data.url === node_title || node_data.name === node_title;
            validate_and_add_rpc_node(currency_code, node_list, node_id, node_data, is_selected);
        });
        $("#rpc_main_input").data(current_node);
        setTimeout(function() {
            close_socket();
        }, 5000);
    })
}

// Provides template URL examples for different cryptocurrency node configurations and API types
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

// Tests RPC endpoints for connectivity and appends validated options to the selection UI with status indicators
function validate_and_add_rpc_node(currency_code, node_list, node_id, node_data, is_selected) {
    if (glob_let.ap_id === "apis") {
        if (currency_code === "ethereum" || glob_let.is_erc20t === true) {
            const test_hash = "0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", // random tx
                rpc_payload = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_getTransactionByHash",
                    "params": [test_hash]
                };
            api_proxy({
                "api_url": node_data.url,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(rpc_payload),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(response) {
                const parsed_data = br_result(response),
                    response_hash = q_obj(parsed_data, "result.result.hash");
                create_rpc_node_element(node_list, response_hash === test_hash, node_id, node_data, is_selected, true);
            }).fail(function(error) {
                create_rpc_node_element(node_list, false, node_id, node_data, is_selected, true);
            });
            return
        }
        const node_url = build_rpc_endpoint_url({
            "url": node_data.url,
            "username": node_data.username,
            "password": node_data.password
        });
        const api_request = glob_let.is_btc ? { // mempoolspace API
            "api_url": node_data.url + "/api/v1/difficulty-adjustment",
            "proxy": false,
            "params": {
                "method": "GET"
            }
        } : {
            "api": currency_code,
            "search": "test",
            "cachetime": 25,
            "cachefolder": "1h",
            "api_url": node_url,
            "params": {
                "method": "POST",
                "data": JSON.stringify(glob_let.test_rpc_call),
                "headers": {
                    "Content-Type": "text/plain"
                }
            }
        }
        api_proxy(api_request).done(function(response) {
            const parsed_data = br_result(response),
                api_result = parsed_data.result,
                is_live = empty_obj(api_result) ? false : (currency_code === "nano" ? api_result.network === "live" : true);
            create_rpc_node_element(node_list, is_live, node_id, node_data, is_selected, true);
        }).fail(function(error) {
            create_rpc_node_element(node_list, false, node_id, node_data, is_selected, true);
        });
        return
    }
    if (glob_let.ap_id === "websockets") {
        let ws_url = node_data.url,
            ws_name = node_data.name || ws_url,
            ws_message = "heartbeat";
        if (ws_name === "blockcypher wss") {
            ws_url = node_data.url + "btc/main";
        }
        if (glob_let.is_btc) {
            ws_message = JSON.stringify({
                "action": "want",
                "data": ["stats"]
            });
        }
        if (currency_code === "nano") {
            const test_address = "nano_1hedzz9g3oq1pw49hf9u9koqgwwg8in49o73xwrnfu9j43qk533r7hhuratx"; // random xno address for testing
            ws_message = JSON.stringify({
                "action": "subscribe",
                "topic": "confirmation",
                "all_local_accounts": true,
                "options": {
                    "accounts": [test_address]
                },
                "ack": true
            });
        }
        if (currency_code === "ethereum" || glob_let.is_erc20t === true) {
            const infura_key = get_infura_apikey(ws_url);
            ws_url = ws_url + infura_key,
                ws_message = JSON.stringify({
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "eth_subscribe",
                    "params": ["logs", {
                        "address": bip39_const.expected_eth_address,
                        "topics": []
                    }]
                });
        }
        let socket = glob_let.sockets["ws_test"] = new WebSocket(ws_url);
        socket.onopen = function(event) {
            socket.send(ws_message);
            console.log("Connected: " + ws_url);
        };
        socket.onmessage = function(event) {
            create_rpc_node_element(node_list, true, node_id, node_data, is_selected, true);
            console.log("socket test success");
            socket.close();
            socket = null;
            close_socket("ws_test");
        };
        socket.onclose = function(event) {
            console.log("End socket test");
        };
        socket.onerror = function(event) {
            create_rpc_node_element(node_list, false, node_id, node_data, is_selected, true);
            console.log("socket test failed");
            socket.close();
            socket = null;
            close_socket("ws_test");
        };
    }
}

// Creates and styles a UI element for RPC node options with live status indicators and deletion controls
function create_rpc_node_element(node_list, is_live, node_id, node_data, is_selected, is_checked) {
    const status_class = is_live ? " live" : " offline",
        selected_class = is_selected ? " rpc_selected" : "",
        status_icon = is_live ? "connection" : "wifi-off",
        node_key = is_checked ? " data-key='" + node_id + "'" : "",
        default_class = node_data.default !== false ? " default" : "",
        display_name = node_data.name || node_data.url,
        node_element = $("<div class='optionwrap" + status_class + selected_class + default_class + "' style='display:none' data-pe='none'><span" + node_key + " data-value='" + node_data.url + "' data-pe='none'>" + display_name + "</span><div class='opt_icon_box' data-pe='none'><div class='opt_icon c_stat icon-" + status_icon + "' data-pe='none'></div><div class='opt_icon icon-bin' data-pe='none'></div></div>");
    node_element.data(node_data).appendTo(node_list);
    node_element.slideDown(500);
}

// Handles RPC node selection in UI with offline node detection and data persistence
function handle_rpc_node_selection() {
    $(document).on("click", "#settingsbox .selectbox .options > div", function(e) {
        const clicked_element = $(e.target);
        if (clicked_element.hasClass("icon-bin")) {
            return // prevent selection when deleting
        }
        const node_option = $(this),
            node_config = node_option.data();
        if (node_option.hasClass("offline")) {
            play_audio(glob_const.funk);
            topnotify(translate("unabletoconnect"));
            return
        }
        const dialog_box = $("#settingsbox"),
            node_input = dialog_box.find("#rpc_main_input");
        node_input.removeData().data(node_config);
        dialog_box.find(".options .optionwrap").removeClass("rpc_selected");
        node_option.addClass("rpc_selected");
    })
}

// Validates and processes RPC node submission with duplicate checking and connection testing
function submit_rpcnode() {
    $(document).on("click", "#settingsbox input.submit", function(e) {
        e.preventDefault();
        const dialog_box = $("#settingsbox"),
            currency_code = $(this).attr("data-currency"),
            node_input = dialog_box.find("#rpc_main_input"),
            selected_config = node_input.data(),
            input_section = dialog_box.find("#rpc_input_box");
        if (input_section.length) {
            const node_url = input_section.find("#rpc_url_input").val();
            if (node_url.length > 5) {
                const options_container = dialog_box.find(".options"),
                    matching_nodes = options_container.find("span[data-value='" + node_url + "']"),
                    url_exists = matching_nodes.length > 0;
                if (url_exists || node_url.indexOf("mempool.space") > -1 ||
                    node_url.indexOf("litecoinspace.org") > -1) {
                    popnotify("error", translate("nodealreadyadded"));
                    return
                }
                const node_username = input_section.find("#rpc_username_input").val(),
                    node_password = input_section.find("#rpc_password_input").val(),
                    node_config = {
                        "url": node_url,
                        "username": node_username,
                        "password": node_password,
                        "default": false
                    };
                validate_rpc_connection(input_section, node_config, currency_code);
                return
            }
        }
        save_rpc_settings(currency_code, selected_config, false)
    })
}

// Tests RPC/WebSocket connectivity for multiple cryptocurrency protocols with error handling
function validate_rpc_connection(input_section, node_config, currency_code) {
    const error_message = translate("unabletoconnect");
    if (glob_let.ap_id === "apis") {
        if (currency_code === "ethereum" || glob_let.is_erc20t === true) {
            const test_hash = "0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", // random tx
                rpc_payload = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_getTransactionByHash",
                    "params": [test_hash]
                };
            api_proxy({
                "api_url": node_config.url,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(rpc_payload),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(response) {
                const parsed_data = br_result(response),
                    response_hash = q_obj(parsed_data, "result.result.hash");
                if (response_hash === test_hash) {
                    input_section.addClass("live").removeClass("offline");
                    save_rpc_settings(currency_code, node_config, true);
                    return
                }
                input_section.addClass("offline").removeClass("live");
                popnotify("error", error_message);
            }).fail(function(error) {
                input_section.addClass("offline").removeClass("live");
                popnotify("error", error_message);
            });
            return
        }
        const node_url = build_rpc_endpoint_url(node_config),
            test_address = {
                "bitcoin": bip39_const.expected_bech32,
                "litecoin": "LZakyXotaE29Pehw21SoPuU832UhvJp4LG",
                "dogecoin": "DKvWg8UhQSycj1J8QVxeBDkRpbjDkw3DiW",
                "bitcoin-cash": bip39_const.expected_bch_cashaddr
            } [currency_code] || "",
            api_request = glob_let.is_btc ? {
                "api_url": node_url + "/api/address/" + test_address + "/txs",
                "proxy": false,
                "params": {
                    "method": "GET"
                }
            } : {
                "api": currency_code,
                "search": "test",
                "cachetime": 25,
                "cachefolder": "1h",
                "api_url": node_url,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(glob_let.test_rpc_call),
                    "headers": {
                        "Content-Type": "text/plain"
                    }
                }
            }
        api_proxy(api_request).done(function(response) {
            const parsed_data = br_result(response),
                api_result = parsed_data.result;
            const api_error = parsed_data.error || api_result.error;
            if (api_error) {
                input_section.addClass("offline").removeClass("live");
                topnotify(error_message);
                const detailed_error = api_error.error_message || api_error.message;
                if (detailed_error) {
                    popnotify("error", detailed_error);
                }
                return
            }
            if (api_result && (is_array(api_result) || api_result.rpc_version)) {
                input_section.addClass("live").removeClass("offline");
                save_rpc_settings(currency_code, node_config, true);
            }
        }).fail(function(error) {
            input_section.addClass("offline").removeClass("live");
            topnotify(error_message);
        });
        return
    }
    if (glob_let.ap_id === "websockets") {
        let ws_url = node_config.url,
            ws_message;
        if (glob_let.is_btc) {
            ws_message = JSON.stringify({
                "action": "ping"
            });
        }
        if (currency_code === "nano") {
            let test_address = "nano_1hedzz9g3oq1pw49hf9u9koqgwwg8in49o73xwrnfu9j43qk533r7hhuratx"; // random xno address for testing
            ws_message = JSON.stringify({
                "action": "subscribe",
                "topic": "confirmation",
                "all_local_accounts": true,
                "options": {
                    "accounts": [test_address]
                },
                "ack": true
            });
        }
        if (currency_code === "ethereum" || glob_let.is_erc20t === true) {
            ws_message = JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_subscribe",
                "params": ["logs", {
                    "address": bip39_const.expected_eth_address,
                    "topics": []
                }]
            });
        }
        let socket = glob_let.sockets["ws_submit"] = new WebSocket(ws_url);
        socket.onopen = function(event) {
            socket.send(ws_message);
            console.log("Connected: " + ws_url);
        };
        socket.onmessage = function(event) {
            input_section.addClass("live").removeClass("offline");
            save_rpc_settings(currency_code, node_config, true);
            console.log("socket test success");
            socket.close();
            socket = null;
            close_socket("ws_submit");
        };
        socket.onclose = function(event) {
            console.log("End socket test");
        };
        socket.onerror = function(event) {
            input_section.addClass("offline").removeClass("live");
            popnotify("error", error_message);
            console.log("socket test failed");
            socket.close();
            socket = null;
            close_socket("ws_submit");
        };
        setTimeout(function() {
            close_socket();
        }, 5000);
    }
}

// Updates UI and persists RPC configuration after successful validation
function save_rpc_settings(currency_code, node_config, is_new_node) {
    const settings_item = cs_node(currency_code, glob_let.ap_id),
        custom_nodes = settings_item.data("options"),
        display_name = node_config.name || node_config.url;
    settings_item.data("selected", node_config).find("p").html(display_name);
    if (is_new_node === true) {
        if (empty_obj(custom_nodes)) {
            settings_item.data("options", [node_config]);
        } else {
            custom_nodes.push(node_config);
        }
    }
    canceldialog();
    notify(translate("datasaved"));
    save_cc_settings(currency_code, true);
}

// Manages removal of custom RPC nodes with safeguards for default nodes
function delete_rpc_node() {
    $(document).on("click", "#settingsbox .options .opt_icon_box .icon-bin", function(e) {
        e.preventDefault();
        const delete_btn = $(this),
            dialog_box = $("#settingsbox"),
            currency_code = dialog_box.find("#rpc_input_box").attr("data-currency"),
            settings_item = cs_node(currency_code, glob_let.ap_id),
            custom_nodes = settings_item.data("options");
        if (custom_nodes && custom_nodes.length) {
            const node_element = delete_btn.closest(".optionwrap"),
                node_config = node_element.data(),
                node_url = node_config.url,
                is_default = node_config.default !== false,
                nodes_container = dialog_box.find(".options"),
                matching_nodes = nodes_container.find("span[data-value='" + node_url + "']"),
                has_duplicates = matching_nodes.length > 1;
            if (is_default === true && !has_duplicates) {
                play_audio(glob_const.funk);
                topnotify(translate("removedefaultnode"));
                return
            }
            const node_name = node_config.name || node_url,
                user_confirmed = confirm(translate("confirmremovenode", {
                    "thisname": node_name
                }));
            if (user_confirmed) {
                const filtered_nodes = custom_nodes.filter(node => node.url !== node_url);
                node_element.slideUp(500, function() {
                    $(this).remove();
                });
                settings_item.data("options", filtered_nodes);
                notify(translate("rpcnoderemoved"));
                $("#rpc_url_input").val("");
                save_cc_settings(currency_code, true);
            }
        }
        return
    })
}

// Constructs authenticated RPC URLs with protocol and credential handling
function build_rpc_endpoint_url(node_config) {
    if (node_config === false) {
        return false;
    }
    const node_url = node_config.url,
        username = node_config.username,
        password = node_config.password,
        auth_prefix = (username && password) ? username + ":" + password + "@" : "",
        has_protocol = node_url.includes("http"),
        url_parts = has_protocol ? node_url.split("://") : node_url;
    return has_protocol ? url_parts[0] + "://" + auth_prefix + url_parts[1] : node_url;
}

// ** Key & Xpub Management: **

// Controls UI for key derivation settings and management
function key_management() {
    $(document).on("click", ".cc_settinglist li[data-id='Key derivations'] .atext", function() {
        const menu_item = $(this),
            settings_item = menu_item.closest("li"),
            item_data = settings_item.data(),
            item_wrap = settings_item.find(".liwrap"),
            currency_code = item_wrap.attr("data-currency"),
            active_xpub_key = active_xpub(currency_code);
        if (active_xpub_key) {
            display_xpub_details(currency_code, active_xpub_key.key);
            return
        }
        if (glob_let.hasbip === true) {
            if (currency_code === "monero" && is_viewonly() === false) {
                all_pinpanel({
                    "func": phrase_info_pu,
                    "args": currency_code
                }, true, true);
                return
            }
            phrase_info_pu(currency_code);
            return
        }
        if (is_viewonly() === true) {
            show_view_only_error();
            return false;
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
            currency_code = settings_item.attr("data-currency"),
            xpub_settings = cs_node(currency_code, "Xpub"),
            settings_data = xpub_settings.data(),
            current_path = settings_data.root_path,
            coin_code = current_path.split("/")[2],
            path_display = $("#d_paths .pd_" + currency_code + " .d_path_header span.ref");
        if (is_segwit === true) {
            const user_confirmed = confirm(translate("uselegacy", {
                "thiscurrency": currency_code
            }));
            if (user_confirmed === false) {
                return
            }
            const legacy_path = "m/44'/" + coin_code + "/0'/0/";
            xpub_settings.data("root_path", legacy_path);
            toggle_btn.removeClass("true").addClass("false");
            path_display.text(legacy_path);
        } else {
            const user_confirmed = confirm(translate("usesegwit", {
                "thiscurrency": currency_code
            }));
            if (user_confirmed === false) {
                return
            }
            const segwit_path = "m/84'/" + coin_code + "/0'/0/";
            xpub_settings.data("root_path", segwit_path);
            toggle_btn.addClass("true").removeClass("false");
            path_display.text(segwit_path);
        }
        const next_btn = $("#d_paths .pd_" + currency_code + " .d_path_body .td_bar .td_next");
        save_cc_settings(currency_code, true);
        derive_address_batch(next_btn, "replace");
    })
}

// Triggers BIP39 key derivation settings UI
function bip39_sc(currency_id) {
    $("#" + currency_id + "_settings .cc_settinglist li[data-id='Key derivations'] .atext").trigger("click");
}

// Displays detailed Xpub information with QR code and derived addresses
function display_xpub_details(currency_code, xpub_key) {
    const coin_data = get_coin_config(currency_code),
        bip32_config = get_bip32dat(currency_code),
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
        derived_keys = keypair_array(false, new Array(5), start_index, derivation_path, bip32_config, master_key, chain_code, currency_code, version_bytes),
        address_list = derived_keys.map((key_data, index) => {
            const path_index = start_index + index;
            return "<li class='adbox der_li' data-index='" + path_index + "'><strong>" + derivation_path + path_index + "</strong> | <span class='mspace'>" + key_data.address + "</span></li>";
        }).join(""),
        currency_symbol = coin_data.ccsymbol,
        currency_icon = getcc_icon(coin_data.cmcid, currency_symbol + "-" + currency_code, coin_data.erc20),
        dialog_content = $("<div id='ad_info_wrap'><h2>" + currency_icon + " <span>" + currency_code + " " + translate("Key derivations") + "</span></h2><ul>\
        <li id='xpub_box' class='clearfix noline'>\
            <div class='xpub_ib clearfix pd_" + currency_code + "' data-xpub='" + xpub_key + "'>\
                <div class='show_xpub'><strong>Xpub: </strong><span class='xpref ref'>" + translate("show") + "</span></div>\
                    <div class='xp_span drawer'>\
                        <div class='qrwrap flex'><div class='qrcode'></div>" + currency_icon + "</div>\
                        <p class='adbox adboxl select' data-type='Xpub'>" + xpub_key + "</p>\
                    </div>\
                </div>\
        <li>\
            <div id='d_paths'></div>\
        </li>\
    </ul>\
    </div>").data(root_config);
    popdialog(dialog_content, "triggersubmit");
    const path_config = {
            "bip32": bip32_config,
            "currency": currency_code
        },
        path_element = $("<div class='d_path pd_" + currency_code + "'>\
            <div class='d_path_header'><strong>Derivation path: </strong><span class='ref'>" + derivation_path + "</span></div>\
            <div class='d_path_body clearfix'>\
                <div class='td_bar'><div class='td_next button'>" + translate("next") + "</div><div class='td_prev button'>" + translate("prev") + "</div></div>\
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
            play_audio(glob_const.funk)
            return
        }
        const xpub_element = $(this),
            settings_item = xpub_element.closest("li"),
            xpub_data = settings_item.data();
        if (!xpub_data.selected || !xpub_data.key) {
            return
        }
        const item_wrap = settings_item.find(".liwrap"),
            currency_code = item_wrap.attr("data-currency"),
            coin_data = get_coin_config(currency_code),
            xpub_key = xpub_data.key,
            currency_icon = getcc_icon(coin_data.cmcid, coin_data.ccsymbol + "-" + currency_code, coin_data.erc20),
            dialog_html = $("<div id='ad_info_wrap'><h2>" + currency_icon + " " + translate("bip32xpub") + "</h2>\
                <div class='d_ulwrap'>\
                    <ul>\
                        <li><strong>Key: </strong><span class='adbox adboxl select'>" + xpub_key + "</span>\
                        <div id='qrcodexp' class='qrwrap flex'><div class='qrcode'></div>" + currency_icon + "</div>\
                        </li>\
                        <li><strong>" + translate("derivationpath") + ":</strong> M/0/</li>\
                    </ul>\
                </div>\
                <div id='backupactions'>\
                    <div id='delete_xpub' data-currency='" + currency_code + "' class='util_icon icon-bin'></div>\
                    <div id='backupcd'>" + cancelbttn + "</div>\
                </div>\
            </div>");
        popdialog(dialog_html, "triggersubmit", null, true);
        $("#qrcodexp .qrcode").qrcode(xpub_key);
    })
}

// Displays form for adding new Xpub key with QR scanning support
function edit_xpub(currency_info) {
    const currency_code = currency_info.currency,
        display_id = currency_info.ccsymbol + "-" + currency_code,
        initial_address = currency_info.address || "",
        qr_scanner = (glob_let.hascam) ? "<div class='qrscanner' data-currency='" + currency_code + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        form_title = translate("addxpub", {
            "currency": currency_code
        }),
        dialog_content = $("<div class='formbox form add' id='xpubformbox'>\
            <h2>" + getcc_icon(currency_info.cmcid, display_id, currency_info.erc20) + " " + form_title + "</h2>\
            <div class='popnotify'></div>\
            <form class='addressform popform'>\
                <div class='inputwrap'><input type='text' id='xpub_input' class='address' value='" + initial_address + "' placeholder='" + form_title + "' data-currency='" + currency_code + "'>" + qr_scanner + "</div>\
                <div id='ad_info_wrap' style='display:none'>\
                    <ul class='td_box'>\
                    </ul>\
                    <div id='pk_confirm' class='noselect'>\
                        <div id='matchwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("xpubmatch", {
            "currency": currency_code
        }) + "</span><br/>\
                        <div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>" + translate("xpubkeys") + "</span>\
                    </div>\
                </div>\
                <input type='submit' class='submit' value='" + translate("okbttn") + "'></form>").data(currency_info);
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
            currency_code = input_field.attr("data-currency"),
            is_valid = check_xpub(xpub_key, xpub_prefix(currency_code), currency_code);
        if (is_valid) {
            clear_xpub_checkboxes();
            validate_xpub(input_field.closest("#xpubformbox"));
            return
        }
        xpub_fail(currency_code);
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
        currency_code = form_data.currency,
        input_field = form_container.find(".address"),
        xpub_key = input_field.val();
    if (!xpub_key) {
        xpub_fail(currency_code);
        input_field.focus();
        return
    }
    const is_valid = check_xpub(xpub_key, xpub_prefix(currency_code), currency_code),
        address_list = $("#ad_info_wrap .td_box"),
        details_panel = $("#ad_info_wrap");
    if (is_valid !== true) {
        const error_message = translate("invalidxpub", {
            "currency": currency_code
        });
        popnotify("error", error_message);
        setTimeout(function() {
            input_field.select();
        }, 10);
        return
    }
    const derived_addresses = generate_derived_addresses(currency_code, xpub_key);
    if (!derived_addresses) {
        xpub_fail(currency_code);
        return false;
    }
    address_list.html(derived_addresses);
    details_panel.slideDown("500");
    const key_confirm = form_container.find("#pk_confirmwrap"),
        key_confirmed = key_confirm.data("checked"),
        match_confirm = form_container.find("#matchwrap"),
        match_confirmed = match_confirm.data("checked");
    if (!match_confirmed) {
        popnotify("error", translate("confirmmatch"));
        return false;
    }
    if (!key_confirmed) {
        popnotify("error", translate("confirmpkownership"));
        return false;
    }
    const settings_item = cs_node(currency_code, "Xpub"),
        existing_key = settings_item.data("key");
    if (existing_key) {
        if (existing_key === xpub_key) {
            canceldialog();
            return false;
        }
        if (!confirm(translate("replacexpub"))) {
            return false;
        }
    }
    const xpub_id = hmacsha(xpub_key, "sha256").slice(0, 8);
    settings_item.data({
        "selected": true,
        "key": xpub_key,
        "key_id": xpub_id
    }).find(".switchpanel").removeClass("false").addClass("true");
    settings_item.find("p").html("true");
    const currency_item = get_currencyli(currency_code),
        home_button = get_homeli(currency_code);
    currency_item.attr("data-checked", "true").data("checked", true);
    home_button.removeClass("hide");
    save_currencies(true);
    save_cc_settings(currency_code, true);
    const key_config = key_cc_xpub(xpub_key),
        coin_data = get_coin_config(currency_code),
        bip32_config = get_bip32dat(currency_code);
    key_config.seedid = xpub_id;
    const derived_data = derive_obj("xpub", key_config, coin_data, bip32_config);
    if (derived_data) {
        derive_add_address(currency_code, derived_data);
    }
    canceldialog();
    clear_savedurl();
    if (glob_const.body.hasClass("showstartpage")) {
        const account_name = $("#eninput").val();
        $("#accountsettings").data("selected", account_name).find("p").html(account_name);
        save_settings();
        openpage("?p=home", "home", "loadpage");
        glob_const.body.removeClass("showstartpage");
        home_button.find(".rq_icon").trigger("click");
        return
    }
    notify(translate("xpubsaved"));
    add_xpub_cb(currency_code, xpub_id);
    save_addresses(currency_code, false);
    currency_check(currency_code);
}

// Handles failed Xpub validation with error notification
function xpub_fail(currency_code) {
    const error_message = translate("invalidxpub", {
        "currency": currency_code
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
function check_xpub(xpub_key, default_prefix, currency_code) {
    const known_prefixes = {
            bitcoin: "zpub|xpub",
            litecoin: "zpub|Ltub"
        },
        prefix_pattern = known_prefixes[currency_code] || default_prefix,
        validation_regex = "(" + prefix_pattern + ")([a-km-zA-HJ-NP-Z1-9]{107})(\\?c=\\d*&h=bip\\d{2,3})?";
    return new RegExp(validation_regex).test(xpub_key);
}

// Generates preview of derived addresses from Xpub key
function generate_derived_addresses(currency_code, xpub_key) {
    try {
        const coin_data = get_coin_config(currency_code),
            bip32_config = get_bip32dat(currency_code),
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
            derived_keys = keypair_array(false, new Array(5), start_index, derivation_path, bip32_config, master_key, chain_code, currency_code, version_bytes),
            address_list = derived_keys.map((key_data, index) => {
                const path_index = start_index + index;
                return "<li class='adbox der_li' data-index='" + path_index + "'><strong>" + derivation_path + path_index + "</strong> | <span class='mspace'>" + key_data.address + "</span></li>";
            }).join("");
        return address_list;
    } catch (err) {
        return false;
    }
}

// Handles enabling/disabling Xpub functionality in currency settings
function xpub_cc_switch() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Xpub'] .switchpanel.custom", function() {
        if (glob_let.test_derive !== true) {
            play_audio(glob_const.funk);
            return
        }
        const toggle_btn = $(this),
            settings_item = toggle_btn.closest("li"),
            parent_wrap = toggle_btn.closest(".liwrap"),
            currency_code = parent_wrap.attr("data-currency"),
            xpub_data = settings_item.data();
        if (toggle_btn.hasClass("true")) {
            const user_confirmed = confirm(translate("disablexpub"));
            if (user_confirmed) {
                settings_item.data("selected", false).find("p").html("false");
                toggle_btn.removeClass("true").addClass("false");
                save_cc_settings(currency_code, true);
                delete_xpub_cb(currency_code, xpub_data.key_id);
            }
            return
        }
        if (xpub_data.key) {
            settings_item.data("selected", true).find("p").text("true");
            toggle_btn.removeClass("false").addClass("true");
            save_cc_settings(currency_code, true);
            add_xpub_cb(currency_code, xpub_data.key_id);
            save_addresses(currency_code, false);
            currency_check(currency_code);
            return
        }
        const coin_data = get_coin_config(currency_code),
            currency_info = {
                "currency": currency_code,
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
        const user_confirmed = confirm(translate("delete") + " " + translate("bip32xpub") + "?");
        if (user_confirmed) {
            const currency_code = $(this).attr("data-currency"),
                settings_item = cs_node(currency_code, "Xpub"),
                xpub_id = settings_item.data("key_id");
            delete_xpub_cb(currency_code, xpub_id, true);
            save_addresses(currency_code, false);
            check_currency(currency_code);
            settings_item.data({
                "selected": false,
                "key": null,
                "key_id": null
            }).find(".switchpanel").removeClass("true").addClass("false");
            settings_item.find("p").html("false");
            save_cc_settings(currency_code, true);
            canceldialog();
        }
    })
}

// Updates address list UI after Xpub key deletion
function delete_xpub_cb(currency_code, xpub_id, reset_checked) {
    const affected_addresses = filter_addressli(currency_code, "xpubid", xpub_id);
    affected_addresses.each(function() {
        const address_item = $(this);
        address_item.removeClass("xpubv").addClass("xpubu");
        if (reset_checked) {
            address_item.attr("data-checked", "false").data("checked", false);
        }
    });
}

// Updates address list UI after adding new Xpub key
function add_xpub_cb(currency_code, xpub_id) {
    const affected_addresses = filter_addressli(currency_code, "xpubid", xpub_id);
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
        signup_link = !signup_url ? "" : "<div id='api_signin'>Get your " + api_name + " API key <a href='" + signup_url + "' target='blank' class='exit'>here</a></div>",
        dialog_content = "\
        <div class='formbox' id='add_apikey'>\
            <h2 class='icon-key'>Set " + api_name + " API key</h2>\
            <div class='popnotify'></div>\
            <div class='popform' data-api='" + api_name + "'>\
                <input type='text' value='" + current_key + "' placeholder='API key' data-apikey='" + current_key + "' data-checkchange='" + current_key + "'>\
                <input type='submit' class='submit' value='" + translate("okbttn") + "'/>\
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
            popnotify("error", translate("validateapikey"));
            return;
        }
        if (new_key === existing_key) {
            canceldialog();
            return
        }
        if (key_input.attr("data-checkchange") === new_key) {
            popnotify("error", translate("validateapikey"));
            return
        }
        key_input.attr("data-checkchange", new_key);
        checkapikey(form_container.attr("data-api"), new_key, true);
    })
}

// ** Settings Reset: **

// Triggers confirmation dialog for resetting coin settings
function reset_coinsettings_trigger() {
    $(document).on("click", ".reset_cc_settings", function() {
        const reset_btn = $(this),
            currency_code = reset_btn.attr("data-currency");
        popdialog("<h2 class='icon-bin'>" + translate("resetdialog", {
            "currency": currency_code
        }) + "</h2>", "reset_coinsettings", reset_btn);
    })
}

// Initiates coin settings reset after user confirmation
function reset_coinsettings(trigger_element) {
    const currency_code = trigger_element.attr("data-currency"),
        user_confirmed = confirm(translate("resetconfirm", {
            "currency": currency_code
        }));
    if (user_confirmed !== true) {
        return
    }
    restore_default_settings(currency_code);
}

// Performs coin settings reset while preserving critical configurations
function restore_default_settings(currency_code) {
    const stored_settings = br_get_local(currency_code + "_settings", true);
    if (stored_settings) {
        const lightning_config = currency_code === "bitcoin" ? stored_settings["Lightning network"] : false,
            xpub_config = stored_settings.Xpub || false,
            layer2_enabled = stored_settings.layer2,
            default_settings = get_coinsettings(currency_code);
        if (lightning_config) {
            default_settings["Lightning network"] = lightning_config; // don't reset lightning settings
        }
        if (xpub_config) {
            default_settings.Xpub = xpub_config; // don't reset xpub settings
        }
        if (layer2_enabled) {
            const compressed_settings = compress_layer2_config(currency_code);
            br_set_local(currency_code + "_settings", compressed_settings, true);
            append_coinsetting(currency_code, compressed_settings);
        } else {
            br_set_local(currency_code + "_settings", default_settings, true);
            append_coinsetting(currency_code, default_settings);
        }
    }
    canceldialog();
    notify(translate("resetnotify", {
        "currency": currency_code
    }));
}