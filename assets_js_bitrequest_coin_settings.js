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
    export_keys();
    //export_keys_fallback

    // Add apikey
    trigger_apikey();
    //add_apikey;
    submit_apikey();

    reset_coinsettings();
    //reset_coinsettings_function
});

// ** Currency Settings **

// Confirmations
function edit_confirmations() {
    $(document).on("click", ".cc_settinglist li[data-id='confirmations'] .edit_trigger", function() {
        var thistrigger = $(this),
            thiscurrency = thistrigger.attr("data-currency"),
            thisli = thistrigger.closest("li"),
            confsrc = thisli.data("selected"),
            ddat = [{
                "ul": {
                    "class": "conf_options noselect",
                    "content": "<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>0</span><div class='conf_emoji'>☕</div></div></li>\
				<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>1</span><div class='conf_emoji'>🍷 🍽</div></div></li>\
				<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>2</span><div class='conf_emoji'>📱</div></div></li>\
				<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>3</span><div class='conf_emoji'>🖥</div></div></li>\
				<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>4</span><div class='conf_emoji'>🚗</div></div></li>\
				<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>5</span><div class='conf_emoji'>🏠</div></div></li>\
				<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>6</span><div class='conf_emoji'>🛥 💎</div></div></li>"
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
                                    "value": "OK",
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
                "title": "Confirmations",
                "elements": ddat
            });
        popdialog(content, "alert", "triggersubmit");
        var currentli = $("#conf_formbox ul.conf_options li").filter(function() {
            return $(this).find("span").text() == confsrc;
        });
        currentli.find(".radio").removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
    })
}

function submit_confirmations() {
    $(document).on("click", "#conf_formbox input.submit", function(e) {
        e.preventDefault();
        var thistrigger = $(this),
            thiscurrency = thistrigger.attr("data-currency"),
            thisvalue = thistrigger.prev("input").val();
        $("#" + thiscurrency + "_settings .cc_settinglist li[data-id='confirmations']").data("selected", thisvalue).find("p").html(thisvalue);
        canceldialog();
        notify("Data saved");
        save_cc_settings(thiscurrency, true);
    })
}

// Reuse addresses
function reuse_address_trigger() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Reuse address'] .switchpanel.custom", function() {
        var this_switch = $(this),
            thislist = this_switch.closest("li"),
            thisliwrap = this_switch.closest(".liwrap"),
            thiscurrency = thisliwrap.attr("data-currency"),
            warning = thislist.data("warning");
        if (this_switch.hasClass("true")) {
            var xresult = true;
            if (warning) {
                var xresult = confirm("Are you sure you want to generate new " + thiscurrency + " addresses? they may not show up in some wallets.");
            }
            if (xresult === true) {
                thislist.data("selected", false);
                this_switch.removeClass("true").addClass("false");
                save_cc_settings(thiscurrency, false);
            }
        } else {
            var result = confirm("Are you sure you want to reuse " + thiscurrency + " addresses?");
            if (result === true) {
                thislist.data("selected", true);
                this_switch.removeClass("false").addClass("true");
                save_cc_settings(thiscurrency, true);
            }
        }
    })
}

function cc_switch() {
    $(document).on("mouseup", ".cc_settinglist li .switchpanel.bool", function() {
        var thistrigger = $(this),
            thislist = thistrigger.closest("li"),
            thisliwrap = thistrigger.closest(".liwrap"),
            thiscurrency = thisliwrap.attr("data-currency"),
            thisvalue = (thistrigger.hasClass("true")) ? true : false;
        thislist.data("selected", thisvalue);
        save_cc_settings(thiscurrency, false);
    })
}

// Choose blockexplorer
function edit_blockexplorer() {
    $(document).on("click", ".cc_settinglist li[data-id='blockexplorers']", function() {
        var current_li = $(this),
            this_data = current_li.data(),
            options = this_data.options;
        if (options) {
            var thiscurrency = current_li.children(".liwrap").attr("data-currency"),
                selected = this_data.selected,
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
                                                "placeholder": "Choose Blockexplorer",
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
                                            "class": "options"
                                        }
                                    }
                                ]
                            },
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": "OK",
                                    "data-currency": thiscurrency
                                }
                            }
                        }]
                    }
                }],
                content = template_dialog({
                    "id": "be_formbox",
                    "icon": "icon-key",
                    "title": "Choose Blockexplorer",
                    "elements": ddat
                });
            popdialog(content, "alert", "triggersubmit");
            var optionlist = $("#be_formbox").find(".options");
            $.each(options, function(i, value) {
                optionlist.append("<span data-pe='none'>" + value + "</span>");
            });
        }
    })
}

function submit_blockexplorer() {
    $(document).on("click", "#be_formbox input.submit", function(e) {
        e.preventDefault();
        var thiscurrency = $(this).attr("data-currency"),
            thisvalue = $("#be_formbox").find("input:first").val();
        $("#" + thiscurrency + "_settings .cc_settinglist li[data-id='blockexplorers']").data("selected", thisvalue).find("p").html(thisvalue);
        canceldialog();
        notify("Data saved");
        save_cc_settings(thiscurrency, true);
    })
}

// RPC node / Websockets
function edit_rpcnode() {
    $(document).on("click", ".cc_settinglist li[data-id='apis'], .cc_settinglist li[data-id='websockets']", function() {
        var current_li = $(this),
            this_data = current_li.data(),
            options = this_data.options,
            api_list = this_data.apis,
            sockets = this_data.websockets;
        s_id = current_li.attr("data-id");
        console.log(options);
        console.log(this_data);
        if (options === undefined && api_list === undefined) {
            return
        }
        test_rpc_call = this_data.rpc_test_command;
        var thiscurrency = current_li.children(".liwrap").attr("data-currency");
        is_erc20t = ($("#" + thiscurrency + "_settings").attr("data-erc20") == "true");
        var header_text = (s_id === "websockets") ? "Add websocket" : "Add RPC node",
            currencycode = (thiscurrency == "bitcoin" || thiscurrency == "litecoin" || thiscurrency == "dogecoin") ? "btc" :
            (thiscurrency == "ethereum" || is_erc20t === true) ? "eth" :
            thiscurrency,
            placeholder_id = s_id + currencycode + getrandomnumber(1, 3),
            getplaceholder = get_rpc_placeholder(thiscurrency)[placeholder_id],
            placeholder = (getplaceholder) ? getplaceholder : "eg: some.local-or-remote.node:port",
            api_form = (options) ? "<div id='rpc_input_box' data-currency='" + thiscurrency + "' data-erc20='" + is_erc20t + "'>\
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
            selected_title = (selected.name) ? selected.name : selected.url,
            content = "\
			<div class='formbox' id='settingsbox' data-id='" + s_id + "'>\
				<h2 class='icon-sphere'>Choose " + thiscurrency + " " + s_id + "</h2>\
				<div class='popnotify'></div>\
				<div class='popform'>\
					<div class='selectbox'>\
						<input type='text' value='" + selected_title + "' placeholder='Choose RPC node' readonly='readonly' id='rpc_main_input'/>\
						<div class='selectarrows icon-menu2' data-pe='none'></div>\
						<div class='options'>\
						</div>\
					</div>" +
            api_form +
            "<input type='submit' class='submit' value='OK' data-currency='" + thiscurrency + "'/>\
				</div>\
			</div>";
        popdialog(content, "alert", "triggersubmit");
        var optionlist = $("#settingsbox").find(".options");
        $.each(api_list, function(key, value) {
            if (value.display === true) {
                var selected = (value.url == selected_title || value.name == selected_title);
                if (thiscurrency == "nano") {
                    test_append_rpc(thiscurrency, optionlist, key, value, selected);
                } else {
                    rpc_option_li(optionlist, true, key, value, selected, false);
                }
            }
        });
        $.each(options, function(key, value) {
            var selected = (value.url == selected_title || value.name == selected_title);
            test_append_rpc(thiscurrency, optionlist, key, value, selected);
        });
        $("#rpc_main_input").data(selected);
    })
}

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

function test_append_rpc(thiscurrency, optionlist, key, value, selected) {
    if (s_id == "apis") {
        if (thiscurrency == "ethereum" || is_erc20t === true) {
            var txhash = "0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", // random tx
                payload = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_getTransactionByHash",
                    "params": [txhash]
                };
            api_proxy({
                "api_url": value.url,
                "proxy": true,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(payload),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(e) {
                var data = br_result(e);
                if (data) {
                    rpc_option_li(optionlist, true, key, value, selected, true);
                } else {
                    rpc_option_li(optionlist, false, key, value, selected, true);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                rpc_option_li(optionlist, false, key, value, selected, true);
            });
        } else {
            var rpc = (thiscurrency == "bitcoin" || thiscurrency == "litecoin" || thiscurrency == "dogecoin" || thiscurrency == "bitcoin-cash") ? "bitcoin" : thiscurrency,
                rpcurl = get_rpc_url({
                    "url": value.url,
                    "username": value.username,
                    "password": value.password
                });
            api_proxy({
                "api": rpc,
                "search": "test",
                "cachetime": 25,
                "cachefolder": "1h",
                "api_url": rpcurl,
                "proxy": false,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(test_rpc_call),
                    "headers": {
                        "Content-Type": "text/plain"
                    }
                }
            }).done(function(e) {
                var data = br_result(e).result,
                    rpc_result = data.result;
                if (rpc_result || e.network == "live") { // network is for nano check
                    rpc_option_li(optionlist, true, key, value, selected, true);
                } else {
                    rpc_option_li(optionlist, false, key, value, selected, true);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                rpc_option_li(optionlist, false, key, value, selected, true);
            });
        }
    } else if (s_id == "websockets") {
        var provider = value.url,
            provider_name = value.name,
            ping_event = "heartbeat";
        if (provider_name == "blockcypher websocket") {
            var provider = value.url + "btc/main";
        }
        if (thiscurrency == "bitcoin") {
            var ping_event = JSON.stringify({
                "op": "ping"
            });
        } else if (thiscurrency == "nano") {
            var ping_event = JSON.stringify({
                "action": "subscribe",
                "topic": "confirmation",
                "ack": true,
                "id": 1
            });
        } else if (is_erc20t === true) {
            var if_id = get_infura_apikey(provider),
                provider = provider + if_id;
            var ping_event = JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_subscribe",
                "params": ["logs", {
                    "address": "0x56ba2Ee7890461f463F7be02aAC3099f6d5811A8",
                    "topics": []
                }]
            });
        }
        var web_socket = new WebSocket(provider);
        web_socket.onopen = function(e) {
            web_socket.send(ping_event);
            console.log(ping_event);
            rpc_option_li(optionlist, true, key, value, selected, true);
            console.log("Connected: " + provider);
        };
        web_socket.onmessage = function(e) {
            //console.log(e);
            console.log("socket test success");
            web_socket.close();
            web_socket = null;
        };
        web_socket.onclose = function(e) {
            console.log("End socket test");
        };
        web_socket.onerror = function(e) {
            console.log(e);
            rpc_option_li(optionlist, false, key, value, selected, true);
            console.log("socket test failed");
            web_socket.close();
            web_socket = null;
        };
    }
}

function rpc_option_li(optionlist, live, key, value, selected, checked) {
    var liveclass = (live === true) ? " live" : " offline",
        selected_class = (selected === true) ? " rpc_selected" : "",
        icon = (live === true) ? "connection" : "wifi-off",
        datakey = (checked === true) ? " data-key='" + key + "'" : "",
        default_class = (value.default !== false) ? " default" : "",
        node_name = (value.name) ? value.name : value.url,
        option = $("<div class='optionwrap" + liveclass + selected_class + default_class + "' style='display:none' data-pe='none'><span" + datakey + " data-value='" + value.url + "' data-pe='none'>" + node_name + "</span><div class='opt_icon_box' data-pe='none'><div class='opt_icon c_stat icon-" + icon + "' data-pe='none'></div><div class='opt_icon icon-bin' data-pe='none'></div></div>");
    option.data(value).appendTo(optionlist);
    option.slideDown(500);
}

function test_rpcnode() {
    $(document).on("click", "#settingsbox .selectbox .options > div", function() {
        var thisoption = $(this),
            thisdata = thisoption.data();
        if (thisoption.hasClass("offline")) {
            playsound(funk);
            topnotify("Unable to connect");
            return
        }
        var settingsbox = $("#settingsbox"),
            rpc_main_input = settingsbox.find("#rpc_main_input");
        settingsbox.find("#rpc_main_input").removeData().data(thisdata);
        settingsbox.find(".options .optionwrap").removeClass("rpc_selected");
        thisoption.addClass("rpc_selected");
    })
}

function submit_rpcnode() {
    $(document).on("click", "#settingsbox input.submit", function(e) {
        e.preventDefault();
        var settingsbox = $("#settingsbox"),
            thiscurrency = $(this).attr("data-currency"),
            rpc_main_input = settingsbox.find("#rpc_main_input"),
            setvalue = rpc_main_input.data(),
            rpc_input_box = settingsbox.find("#rpc_input_box");
        if (rpc_input_box.length) {
            var rpc_url_input_val = rpc_input_box.find("#rpc_url_input").val();
            if (rpc_url_input_val.length > 5) {
                var optionsbox = settingsbox.find(".options"),
                    duplicates = optionsbox.find("span[data-value='" + rpc_url_input_val + "']"),
                    indexed = (duplicates.length) ? true : false;
                if (indexed) {
                    popnotify("error", "Node already added");
                    return
                }
                var rpc_username_input_val = rpc_input_box.find("#rpc_username_input").val(),
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
            pass_rpc_submit(thiscurrency, setvalue, false);
            return
        }
        pass_rpc_submit(thiscurrency, setvalue, false)
    })
}

function test_rpc(rpc_input_box, rpc_data, currency) {
    if (s_id == "apis") {
        if (currency == "ethereum" || is_erc20t === true) {
            var txhash = "0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", // random tx
                payload = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_getTransactionByHash",
                    "params": [txhash]
                };
            api_proxy({
                "api_url": rpc_data.url,
                "proxy": true,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(payload),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(e) {
                var data = br_result(e);
                if (data) {
                    rpc_input_box.addClass("live").removeClass("offline");
                    pass_rpc_submit(currency, rpc_data, true);
                } else {
                    rpc_input_box.addClass("offline").removeClass("live");
                    popnotify("error", "unable to connect");
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                rpc_input_box.addClass("offline").removeClass("live");
                popnotify("error", "unable to connect");
            });
        } else {
            var rpc = (currency == "bitcoin" || currency == "litecoin" || currency == "dogecoin" || currency == "bitcoin-cash") ? "bitcoin" : currency,
                rpcurl = get_rpc_url(rpc_data);
            api_proxy({
                "api": rpc,
                "search": "test",
                "cachetime": 25,
                "cachefolder": "1h",
                "api_url": rpcurl,
                "proxy": false,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(test_rpc_call),
                    "headers": {
                        "Content-Type": "text/plain"
                    }
                }
            }).done(function(e) {
                var data = br_result(e),
                    rpc_result = data.result;
                if (rpc_result) {
                    rpc_input_box.addClass("live").removeClass("offline");
                    pass_rpc_submit(currency, rpc_data, true);
                } else {
                    var error = data.error || rpc_result.error;
                    if (error) {
                        rpc_input_box.addClass("offline").removeClass("live");
                        topnotify("Unable to connect");
                        var error_message = error.error_message;
                        if (error_message) {
                            popnotify("error", error_message);
                        }
                    }
                }
            }).fail(function(data) {
                rpc_input_box.addClass("offline").removeClass("live");
                topnotify("Unable to connect");
                if (data.status === 0) {
                    popnotify("error", "Try disabeling Cross Origin Limitations in your browser");
                }
            });
        }
    } else if (s_id == "websockets") {
        var provider = rpc_data.url,
            ping_event;
        if (currency == "bitcoin") {
            var ping_event = JSON.stringify({
                "op": "ping"
            });
        } else if (currency == "nano") {
            var ping_event = JSON.stringify({
                "action": "subscribe",
                "topic": "confirmation",
                "ack": true,
                "id": 1
            });
        } else if (currency == "ethereum" || is_erc20t === true) {
            var ping_event = JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_subscribe",
                "params": ["logs", {
                    "address": "",
                    "topics": []
                }]
            });
        }
        var web_socket = new WebSocket(provider);
        web_socket.onopen = function(e) {
            web_socket.send(ping_event);
            console.log("Connected: " + provider);
        };
        web_socket.onmessage = function(e) {
            rpc_input_box.addClass("live").removeClass("offline");
            pass_rpc_submit(currency, rpc_data, true);
            console.log("socket test success");
            web_socket.close();
            web_socket = null;
        };
        web_socket.onclose = function(e) {
            console.log("End socket test");
        };
        web_socket.onerror = function(e) {
            console.log(e);
            rpc_input_box.addClass("offline").removeClass("live");
            popnotify("error", "Unable to connect");
            console.log("socket test failed");
            web_socket.close();
            web_socket = null;
        };
    }
}

function pass_rpc_submit(thiscurrency, thisvalue, newnode) {
    var rpc_setting_li = $("#" + thiscurrency + "_settings .cc_settinglist li[data-id='" + s_id + "']"),
        options = rpc_setting_li.data("options"),
        node_name = (thisvalue.name) ? thisvalue.name : thisvalue.url;
    rpc_setting_li.data("selected", thisvalue).find("p").html(node_name);
    if (options === undefined) {
        if (newnode === true) {
            rpc_setting_li.data("options", thisvalue);
        }
    } else {
        if (newnode === true) {
            options.push(thisvalue);
        }
    }
    canceldialog();
    notify("Data saved");
    save_cc_settings(thiscurrency, true);
}

function remove_rpcnode() {
    $(document).on("click", "#settingsbox .options .opt_icon_box .icon-bin", function(e) {
        e.preventDefault();
        var thistrigger = $(this),
            settingsbox = $("#settingsbox"),
            thiscurrency = settingsbox.find("#rpc_input_box").attr("data-currency"),
            rpc_setting_li = $("#" + thiscurrency + "_settings .cc_settinglist li[data-id='" + s_id + "']"),
            options = rpc_setting_li.data("options");
        if (options.length) {
            var thisoption = thistrigger.closest(".optionwrap"),
                thisdata = thisoption.data(),
                thisurl = thisdata.url,
                default_node = (thisdata.default !== false),
                optionsbox = settingsbox.find(".options"),
                duplicates = optionsbox.find("span[data-value='" + thisurl + "']"),
                is_duplicate = (duplicates.length > 1);
            if (default_node === true && is_duplicate === false) {
                playsound(funk);
                topnotify("Cannot delete default node");
                return
            }
            var thisname = (thisdata.name) ? thisdata.name : thisurl,
                result = confirm("Are you sure you want to delete '" + thisname + "'");
            if (result === true) {
                var new_array = $.grep(options, function(option) {
                    return option.url != thisurl;
                });
                thisoption.slideUp(500, function() {
                    $(this).remove();
                });
                rpc_setting_li.data("options", new_array);
                notify("RPC node removed");
                save_cc_settings(thiscurrency, true);
            }
        }
        return
    })
}

function get_rpc_url(rpc_data) {
    if (rpc_data === false) {
        return false;
    } else {
        var url = rpc_data.url,
            username = rpc_data.username,
            password = rpc_data.password,
            login_param = (username && password) ? username + ":" + password + "@" : "",
            hasprefix = (url.indexOf("http") > -1),
            urlsplit = (hasprefix === true) ? url.split("://") : url;
        return (hasprefix === true) ? urlsplit[0] + "://" + login_param + urlsplit[1] : url;
    }
}

// Xpub settings
function edit_xpub_trigger() {
    $(document).on("click", ".cc_settinglist li[data-id='Xpub'] .atext", function() {
        if (test_derive === true) {
            var thisnode = $(this),
                thislist = thisnode.closest("li"),
                thisdat = thislist.data();
            if (thisdat.selected === true && thisdat.key) {
                var thisliwrap = thislist.find(".liwrap"),
                    thiscurrency = thisliwrap.attr("data-currency"),
                    coindat = getcoindata(thiscurrency),
                    xpub = thisdat.key,
                    content = $("<div id='ad_info_wrap'><h2>" + getcc_icon(coindat.cmcid, coindat.ccsymbol + "-" + thiscurrency, coindat.erc20) + " BIP32 Extended public key</h2>\
						<div class='d_ulwrap'>\
							<ul>\
					    		<li><strong>Key: </strong><span class='adbox adboxl select'>" + xpub + "</span></li>\
					    		<li><strong>Derivation path:</strong> M/0/</li>\
				    		</ul>\
				    	</div>\
						<div id='backupactions'>\
							<div id='delete_xpub' data-currency='" + thiscurrency + "' class='util_icon icon-bin'></div>\
							<div id='backupcd'>CANCEL</div>\
						</div>\
			    	</div>");
                popdialog(content, "alert", "triggersubmit", null, true);
                return
            }
        }
        playsound(funk)
    })
}

function delete_xpub() {
    $(document).on("click", "#delete_xpub", function() {
        var result = confirm("Delete BIP32 Extended public key?");
        if (result === true) {
            var currency = $(this).attr("data-currency"),
                xpubli = $("#" + currency + "_settings .cc_settinglist li[data-id='Xpub']"),
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

function delete_xpub_cb(currency, x_pubid, uncheck) {
    var xpublist = filter_addressli(currency, "xpubid", x_pubid);
    xpublist.each(function() {
        var thisli = $(this);
        thisli.removeClass("xpubv").addClass("xpubu");
        if (uncheck === true) {
            thisli.attr("data-checked", "false").data("checked", false);
        }
    });
}

function add_xpub_cb(currency, x_pubid) {
    var xpublist = filter_addressli(currency, "xpubid", x_pubid);
    xpublist.each(function() {
        $(this).addClass("xpubv").removeClass("xpubu").attr("data-checked", "true").data("checked", true);
    });
}

function xpub_cc_switch() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Xpub'] .switchpanel.custom", function() {
        if (test_derive === true) {
            var this_switch = $(this),
                thislist = this_switch.closest("li"),
                thisliwrap = this_switch.closest(".liwrap"),
                thiscurrency = thisliwrap.attr("data-currency"),
                thisdat = thislist.data();
            if (this_switch.hasClass("true")) {
                var result = confirm("Disable Xpub address derivation?");
                if (result === true) {
                    thislist.data("selected", false).find("p").html("false");
                    this_switch.removeClass("true").addClass("false");
                    save_cc_settings(thiscurrency, true);
                    delete_xpub_cb(thiscurrency, thisdat.key_id);
                }
            } else {
                if (thisdat.key) {
                    thislist.data("selected", true).find("p").html("true");
                    this_switch.removeClass("false").addClass("true");
                    save_cc_settings(thiscurrency, true);
                    add_xpub_cb(thiscurrency, thisdat.key_id);
                    saveaddresses(thiscurrency, false);
                    currency_check(thiscurrency);
                } else {
                    var cd = getcoindata(thiscurrency),
                        ad = {
                            "currency": thiscurrency,
                            "ccsymbol": cd.ccsymbol,
                            "cmcid": cd.cmcid,
                            "erc20": cd.erc20
                        }
                    edit_xpub(ad, false, true);
                }
            }
        } else {
            playsound(funk);
        }
    })
}

function edit_xpub(ad) {
    var currency = ad.currency,
        cpid = ad.ccsymbol + "-" + currency,
        address = (ad.address) ? ad.address : "",
        scanqr = (hascam === true) ? "<div class='qrscanner' data-currency='" + currency + "' data-id='address' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "",
        content = $("<div class='formbox form add' id='xpubformbox'>\
        	<h2>" + getcc_icon(ad.cmcid, cpid, ad.erc20) + " Add " + currency + " Xpub key</h2>\
        	<div class='popnotify'></div>\
        	<form class='addressform popform'>\
        		<div class='inputwrap'><input type='text' id='xpub_input' class='address' value='" + address + "' placeholder='Enter a " + currency + " Xpub key' data-currency='" + currency + "'>" + scanqr + "</div>\
        		<div id='ad_info_wrap' style='display:none'>\
        			<ul class='td_box'>\
					</ul>\
					<div id='pk_confirm' class='noselect'>\
						<div id='matchwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>The above addresses match those in my " + currency + " wallet</span><br/>\
						<div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>I own the seed / Xpriv key</span>\
					</div>\
				</div>\
        		<input type='submit' class='submit' value='OK'></form>").data(ad);
    popdialog(content, "alert", "triggersubmit");
    if (supportsTouch === true) {} else {
        $("#popup input.address").focus();
    }
}

function xpub_change() {
    $(document).on("input", "#xpub_input", function(e) {
        var thisnode = $(this),
            addressinputval = thisnode.val(),
            currency = thisnode.attr("data-currency"),
            valid = check_xpub(addressinputval, xpub_prefix(currency), currency);
        if (valid === true) {
            clear_xpub_checkboxes();
            validate_xpub(thisnode.closest("#xpubformbox"));
        } else {
            xpub_fail(currency);
        }
    })
}

function submit_xpub_trigger() {
    $(document).on("click", "#xpubformbox input.submit", function(e) {
        e.preventDefault();
        validate_xpub($(this).closest("#xpubformbox"));
    })
}

function validate_xpub(thisnode) {
    var this_data = thisnode.data(),
        currency = this_data.currency,
        ccsymbol = this_data.ccsymbol,
        addressfield = thisnode.find(".address"),
        addressinputval = addressfield.val();
    if (addressinputval) {
        var valid = check_xpub(addressinputval, xpub_prefix(currency), currency),
            tdbox = $("#ad_info_wrap .td_box"),
            dp_body = $("#ad_info_wrap");
        if (valid === true) {
            var derive_list = xpub_derivelists(currency, addressinputval);
            if (derive_list) {
                tdbox.html(xpub_derivelists(currency, addressinputval));
                dp_body.slideDown("500");
            } else {
                xpub_fail(currency);
                return false;
            }
            var pk_checkbox = thisnode.find("#pk_confirmwrap"),
                pk_checked = pk_checkbox.data("checked"),
                matchwrap = thisnode.find("#matchwrap"),
                mw_checked = matchwrap.data("checked");
            if (mw_checked == false) {
                popnotify("error", "Confirm addresses are matching");
                return false;
            }
            if (pk_checked == false) {
                popnotify("error", "Confirm privatekey ownership");
                return false;
            }
            if (pk_checked == true && mw_checked == true) {
                var xpubli = $("#" + currency + "_settings .cc_settinglist li[data-id='Xpub']"),
                    haskey = xpubli.data("key");
                if (haskey) {
                    if (haskey == addressinputval) {
                        canceldialog();
                        return false;
                    } else {
                        var result = confirm("Replace Xpub?");
                        if (result === true) {} else {
                            return false;
                        }
                    }
                }
                var xpub_id = hmacsha(addressinputval, "sha256").slice(0, 8);
                xpubli.data({
                    "selected": true,
                    "key": addressinputval,
                    "key_id": xpub_id
                }).find(".switchpanel").removeClass("false").addClass("true");
                xpubli.find("p").html("true");
                $("#usedcurrencies > li[data-currency='" + currency + "']").attr("data-checked", "true").data("checked", true);
                savecurrencies(true);
                var home_icon = $("#currencylist > li[data-currency='" + currency + "']");
                home_icon.removeClass("hide");
                save_cc_settings(currency, true);
                var keycc = key_cc_xpub(addressinputval),
                    coindat = getcoindata(currency),
                    bip32 = getbip32dat(currency);
                keycc.seedid = xpub_id;
                var ad = derive_obj("xpub", keycc, coindat, bip32);
                if (ad) {
                    derive_add_address(currency, ad);
                }
                canceldialog();
                clear_savedurl();
                if (body.hasClass("showstartpage")) {
                    var acountname = $("#eninput").val();
                    $("#accountsettings").data("selected", acountname).find("p").html(acountname);
                    savesettings();
                    openpage("?p=home", "home", "loadpage");
                    body.removeClass("showstartpage");
                    home_icon.find(".rq_icon").trigger("click");
                } else {
                    notify("Xpub saved");
                    add_xpub_cb(currency, xpub_id);
                    saveaddresses(currency, false);
                    currency_check(currency);
                }
            } else {
                popnotify("error", "Confirm privatekey ownership");
            }
        } else {
            var errormessage = "NOT a valid / supported " + currency + " Xpub key";
            popnotify("error", errormessage);
            setTimeout(function() {
                addressfield.select();
            }, 10);
        }
    } else {
        xpub_fail(currency);
        addressfield.focus();
    }
}

function xpub_fail(currency) {
    var errormessage = "NOT a valid / supported " + currency + " Xpub key";
    popnotify("error", errormessage);
    clear_xpub_inputs();
}

function clear_xpub_inputs() {
    $("#ad_info_wrap").slideUp(200, function() {
        $("#ad_info_wrap .td_box").html("");
    });
    clear_xpub_checkboxes();
}

function clear_xpub_checkboxes() {
    $("#pk_confirmwrap").attr("data-checked", "false").data("checked", false);
    $("#matchwrap").attr("data-checked", "false").data("checked", false);
}

function xpub_derivelists(currency, xpub) {
    try {
        var coindat = getcoindata(currency),
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
            derivelist = "",
            derive_array = keypair_array(false, new Array(5), startindex, root_path, bip32dat, key, chaincode, currency, versionbytes);
        $.each(derive_array, function(i, val) {
            var index = startindex + i;
            derivelist += "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> | <span class='mspace'>" + val.address + "</span></li>";
        });
        return derivelist;
    } catch (err) {
        return false;
    }
}

function check_xpub(address, prefix, currency) {
    var this_prefix = (currency == "bitcoin") ? "zpub|xpub" : (currency == "litecoin") ? "zpub|Ltub" : prefix,
        regex = "(" + this_prefix + ")([a-km-zA-HJ-NP-Z1-9]{107})(\\?c=\\d*&h=bip\\d{2,3})?";
    return new RegExp(regex).test(address);
}

// Key Management

function key_management() {
    $(document).on("click", ".cc_settinglist li[data-id='Key derivations'] .atext", function() {
        var thisnode = $(this),
            thislist = thisnode.closest("li"),
            thisdat = thislist.data(),
            thisliwrap = thislist.find(".liwrap"),
            thiscurrency = thisliwrap.attr("data-currency"),
            activepub = active_xpub(thiscurrency);
        if (activepub) {
            xpub_info_pu(thiscurrency, activepub.key);
        } else {
            if (hasbip === true) {
                if (thiscurrency == "monero") {
                    all_pinpanel({
                        "func": phrase_info_pu,
                        "args": thiscurrency
                    }, true)
                } else {
                    phrase_info_pu(thiscurrency);
                }
            } else {
                if (is_viewonly() === true) {
                    vu_block();
                    return false;
                }
                manage_bip32();
            }
        }
    })
}

function segwit_switch() {
    $(document).on("mouseup", "#segw_box .toggle_segwit .switchpanel", function() {
        var this_switch = $(this),
            thisvalue = (this_switch.hasClass("true")) ? true : false,
            current_li = this_switch.closest("li"),
            thiscurrency = current_li.attr("data-currency"),
            kdli = $("#" + thiscurrency + "_settings .cc_settinglist li[data-id='Xpub']"),
            kdli_dat = kdli.data(),
            rootpath = kdli_dat.root_path,
            coincode = rootpath.split("/")[2],
            dpath_header = $("#d_paths .pd_" + thiscurrency + " .d_path_header span.ref");
        if (thisvalue === true) {
            var result = confirm("Use " + thiscurrency + " Legacy addresses?");
            if (result === false) {
                return
            }
            var dp = "m/44'/" + coincode + "/0'/0/";
            kdli.data("root_path", dp);
            this_switch.removeClass("true").addClass("false");
            dpath_header.text(dp);
        } else {
            var result = confirm("Use " + thiscurrency + " SegWit addresses?");
            if (result === false) {
                return
            }
            var dp = "m/84'/" + coincode + "/0'/0/";
            kdli.data("root_path", dp);
            this_switch.addClass("true").removeClass("false");
            dpath_header.text(dp);
        }
        var dpath_next = $("#d_paths .pd_" + thiscurrency + " .d_path_body .td_bar .td_next");
        save_cc_settings(thiscurrency, true);
        test_derive_function(dpath_next, "replace");
    })
}

function bip39_sc(coinsc) {
    $("#" + coinsc + "_settings .cc_settinglist li[data-id='Key derivations'] .atext").trigger("click");
}

function xpub_info_pu(currency, xpub) {
    var coindat = getcoindata(currency),
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
        derivelist = "",
        derive_array = keypair_array(false, new Array(5), startindex, root_path, bip32dat, key, chaincode, currency, versionbytes);
    $.each(derive_array, function(i, val) {
        var index = startindex + i;
        derivelist += "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> | <span class='mspace'>" + val.address + "</span></li>";
    });
    var ccsymbol = coindat.ccsymbol,
    	cc_icon = getcc_icon(coindat.cmcid, ccsymbol + "-" + currency, coindat.erc20),
        content = $("<div id='ad_info_wrap'><h2>" + cc_icon + " <span>" + currency + " Key Derivation</span></h2><ul>\
	    <li id='xpub_box' class='clearfix noline'>\
	    	<div class='xpub_ib clearfix pd_" + currency + "' data-xpub='" + xpub + "'>\
    			<div class='show_xpub'><strong>Xpub: </strong><span class='xpref ref'>show</span></div>\
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
    popdialog(content, "alert", "triggersubmit");
    var dp_node_dat = {
            "bip32": bip32dat,
            "currency": currency
        },
        dp_node = $("<div class='d_path pd_" + currency + "'>\
			<div class='d_path_header'><strong>Derivation path: </strong><span class='ref'>" + root_path + "</span></div>\
			<div class='d_path_body clearfix'>\
				<div class='td_bar'><div class='td_next button'>Next</div><div class='td_prev button'>Prev</div></div>\
				<ul class='td_box'>" + derivelist + "</ul>\
			</div>\
		</div>").data(dp_node_dat);
    $("#d_paths").append(dp_node);
    setTimeout(function() {
        $("#ad_info_wrap .d_path_header").trigger("click");
    }, 550);
}

function export_keys() {
    $(document).on("click", "#export_keys", function() {
        var pks_box = $("#pks_box");
        if (pks_box.is(":visible")) {
            pks_box.slideUp(200);
        } else {
            var pkspan = pks_box.find("span");
            if (pkspan.length) {
                pks_box.slideDown(200);
            } else {
                all_pinpanel({
                    "func": export_keys_fallback,
                    "args": $(this).attr("data-currency")
                }, true);
            }
        }
        $("#test_derive_wrap").slideUp(200);
    })
}

function export_keys_fallback(currency) {
    var pks_box = $("#pks_box"),
        keydat = key_cc(currency),
        seedid = keydat.seedid,
        bip32dat = getbip32dat(currency),
        d_path = bip32dat.root_path,
        derives = filter_addressli(currency, "seedid", seedid),
        latest = get_latest_index(derives),
        new_array = new Array(latest + 1),
        derive_array = keypair_array(keydat.seed, new_array, 0, d_path, bip32dat, keydat.key, keydat.cc, currency),
        pk_array = [];
    pks_box.html("");
    $.each(derive_array, function(i, val) {
        pk_array.push(val.privkey);
    });
    pks_box.html("<span class='adbox select'>" + pk_array.join(", ") + "</span>").slideDown(200);
}

// Add api key

function trigger_apikey() {
    $(document).on("click", "#add_api", function() {
        add_apikey($(this).attr("data-api"));
    })
}

function add_apikey(api) {
    var get_key = $("#apikeys").data(api),
        api_key = (get_key) ? get_key : "",
        apidata = get_api_data(api),
        sign_up = apidata.sign_up,
        get_apikey_url = (!sign_up) ? "" : "<div id='api_signin'>Get your " + api + " API key <a href='" + sign_up + "' target='blank' class='exit'>here</a></div>",
        content = "\
		<div class='formbox' id='add_apikey'>\
			<h2 class='icon-key'>Set " + api + " API key</h2>\
			<div class='popnotify'></div>\
			<div class='popform' data-api='" + api + "'>\
				<input type='text' value='" + api_key + "' placeholder='API key' data-apikey='" + api_key + "' data-checkchange='" + api_key + "'>\
				<input type='submit' class='submit' value='OK'/>\
			</div>" + get_apikey_url +
        "</div>";
    canceldialog();
    setTimeout(function() {
        popdialog(content, "alert", "triggersubmit");
    }, 800);
}

function submit_apikey() {
    $(document).on("click", "#add_apikey input.submit", function(e) {
        e.preventDefault();
        var thisform = $(this).closest(".popform"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            currentkey = thisinput.attr("data-apikey");
        if (thisvalue) {
            if (thisvalue === currentkey) {
                canceldialog();
            } else {
                if (thisinput.attr("data-checkchange") == thisvalue) {
                    popnotify("error", "Enter a valid API key");
                } else {
                    thisinput.attr("data-checkchange", thisvalue);
                    checkapikey(thisform.attr("data-api"), thisvalue, true);
                }
            }
        } else {
            popnotify("error", "Enter a valid API key");
        }
    })
}

function reset_coinsettings() {
    $(document).on("click", ".reset_cc_settings", function() {
        var thistrigger = $(this),
            currency = thistrigger.attr("data-currency");
        popdialog("<h2 class='icon-bin'>Reset " + currency + " settings?</h2>", "alert", "reset_coinsettings_function", thistrigger);
    })
}

function reset_coinsettings_function(trigger) {
    var currency = trigger.attr("data-currency"),
        result = confirm("Are you sure you want to reset " + currency + " settings?");
    if (result === true) {
        var current_settings = localStorage.getItem("bitrequest_" + currency + "_settings"),
            cs_object = JSON.parse(current_settings),
            ln_settings = (currency == "bitcoin") ? cs_object["Lightning network"] : false,
            coinsettings = getcoinsettings(currency);
        if (ln_settings) {
            coinsettings["Lightning network"] = ln_settings; // don't reset lightning settings
        }
        localStorage.setItem("bitrequest_" + currency + "_settings", JSON.stringify(coinsettings));
        append_coinsetting(currency, coinsettings, false);
        canceldialog();
        notify(currency + " settings reset to default");
    }
}