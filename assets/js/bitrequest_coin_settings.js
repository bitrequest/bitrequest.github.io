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
    submit_xpub_strigger();
    //validate_xpub
    //check_xpub

    // Key Management
    key_management();
    //xpub_info_pu
    export_keys();
    //export_keys_fallback

    // Add apikey
    trigger_apikey();
    //add_apikey;
    submit_apikey();
});

// ** Currency Settings **

// Confirmations
function edit_confirmations() {
    $(document).on("click", ".cc_settinglist li[data-id='confirmations'] .edit_trigger", function() {
        var thistrigger = $(this),
            thiscurrency = thistrigger.attr("data-currency"),
            thisli = thistrigger.closest("li"),
            confsrc = thisli.data("selected"),
            content = "<div class='formbox' id='conf_formbox'>\
			<h2 class='icon-clock'>Confirmations</h2>\
			<div class='popnotify'></div>\
			<ul class='conf_options noselect'>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>0</span>\
						<div class='conf_emoji'>☕</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>1</span>\
						<div class='conf_emoji'>🍷 🍽</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>2</span>\
						<div class='conf_emoji'>📱</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>3</span>\
						<div class='conf_emoji'>🖥</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>4</span>\
						<div class='conf_emoji'>🚗</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>5</span>\
						<div class='conf_emoji'>🏠</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>6</span>\
						<div class='conf_emoji'>🛥 💎</div>\
					</div>\
				</li>\
			</ul>\
			<div class='popform'>\
				<input type='hidden' value='" + confsrc + "'/>\
				<input type='submit' class='submit' value='OK' data-currency='" + thiscurrency + "'/>\
			</div>\
		</div>";
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
            thiscurrency = thisliwrap.attr("data-currency");
        if (this_switch.hasClass("true")) {
	         thislist.data("selected", false).find("p").html("false");
	         this_switch.removeClass("true").addClass("false");
	         save_cc_settings(thiscurrency, false);
        } else {
            var result = confirm("Are you sure you want to reuse " + thiscurrency + " addresses?");
            if (result === true) {
                thislist.data("selected", true).find("p").html("true");
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
        thislist.data("selected", thisvalue).find("p").html(thisvalue.toString());
        save_cc_settings(thiscurrency, false);
    })
}

// Choose blockexplorer
function edit_blockexplorer() {
    $(document).on("click", ".cc_settinglist li[data-id='blockexplorers']", function() {
        var current_li = $(this),
            this_data = current_li.data(),
            options = this_data.options;
        if (options === undefined) {
            return false;
        } else {
            var thiscurrency = current_li.children(".liwrap").attr("data-currency"),
                selected = this_data.selected,
                content = "\
				<div class='formbox' id='be_formbox'>\
					<h2 class='icon-key'>Choose Blockexplorer</h2>\
					<div class='popnotify'></div>\
					<div class='popform'>\
						<div class='selectbox'>\
							<input type='text' value='" + selected + "' placeholder='Choose Blockexplorer' readonly='readonly'/>\
							<div class='selectarrows icon-menu2' data-pe='none'></div>\
							<div class='options'>\
							</div>\
						</div>\
						<input type='submit' class='submit' value='OK' data-currency='" + thiscurrency + "'/>\
					</div>\
				</div>";
            popdialog(content, "alert", "triggersubmit");
            var optionlist = $("#be_formbox").find(".options");
            $.each(options, function(key, value) {
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
        if (options === undefined && api_list === undefined) {
            return false;
        } else {
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
                    rpc_option_li(optionlist, true, key, value, selected, false);
                }
            });
            $.each(options, function(key, value) {
                var selected = (value.url == selected_title || value.name == selected_title);
                test_append_rpc(thiscurrency, optionlist, key, value, selected);
            });
            $("#rpc_main_input").data(selected);
        }
    })
}

function get_rpc_placeholder(currency) {
    var btc_port = (currency == "bitcoin") ? "8332" :
        (currency == "litecoin") ? "9332" :
        (currency == "dogecoin") ? "22555" : "port";
    return {
        apisnano1: "eg: http://127.0.0.1:7076",
        apisnano2: "eg: http://some.local-or-remote.node:7076",
        apisnano3: "eg: http://localhost:7076",
        websocketsnano1: "eg: ws://127.0.0.1:7078",
        websocketsnano2: "eg: ws://some.local-or-remote.node:7078",
        websocketsnano3: "eg: ws://localhost:7078",
        apisbtc1: "eg: http://127.0.0.1:" + btc_port,
        apisbtc2: "eg: http://some.local-or-remote.node:" + btc_port,
        apisbtc3: "eg: http://localhost:" + btc_port,
        apiseth1: "eg: http://localhost:8545",
        apiseth2: "eg: http://some.local-or-remote.node:8546",
        apiseth3: "eg: https://mainnet.infura.io/v3/YOUR-PROJECT-ID",
        websocketseth1: "eg: ws://localhost:8545",
        websocketseth2: "eg: ws://some.local-or-remote.node:8546",
        websocketseth3: "eg: wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID",
    }
}

function test_append_rpc(thiscurrency, optionlist, key, value, selected) {
    if (s_id == "apis") {
        if (thiscurrency == "ethereum") {
            if (web3) {
                web3.setProvider(value.url);
                web3.eth.getTransaction("0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", function(err_1, data_1) { // random tx
                    if (err_1) {
                        console.log(err_1);
                        rpc_option_li(optionlist, false, key, value, selected, true);
                    } else {
                        if (data_1) {
                            rpc_option_li(optionlist, true, key, value, selected, true);
                        }
                    }
                });
            } else {
                rpc_option_li(optionlist, false, key, value, selected, true);
            }
        } else {
            var rpc = (thiscurrency == "bitcoin" || thiscurrency == "litecoin" || thiscurrency == "dogecoin") ? "bitcoin" : thiscurrency,
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
                if (rpc_result) {
                    rpc_option_li(optionlist, true, key, value, selected, true);
                } else {
                    rpc_option_li(optionlist, false, key, value, selected, true);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                rpc_option_li(optionlist, false, key, value, selected, true);
            });
        }
    } else if (s_id == "websockets") {
        var provider = value.url,
            ping_event;
        if (thiscurrency == "bitcoin") {
            var ping_event = JSON.stringify({
                op: "ping"
            });
        } else if (thiscurrency == "nano") {
            var ping_event = JSON.stringify({
                action: "subscribe",
                topic: "confirmation",
                ack: true,
                id: 1
            });
        } else if (is_erc20t === true) {
            var ping_event = JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_subscribe",
                params: ["logs", {
                    address: "0x56ba2Ee7890461f463F7be02aAC3099f6d5811A8",
                    topics: []
                }]
            });
        }
        var web_socket = new WebSocket(provider);
        web_socket.onopen = function(e) {
            web_socket.send(ping_event);
            console.log(ping_event);
            console.log("Connected: " + provider);
        };
        web_socket.onmessage = function(e) {
            console.log(e);
            rpc_option_li(optionlist, true, key, value, selected, true);
            console.log("socket test success");
            web_socket.close();
            web_socket = undefined;
        };
        web_socket.onclose = function(e) {
            console.log("End socket test");
        };
        web_socket.onerror = function(e) {
            console.log(e);
            rpc_option_li(optionlist, false, key, value, selected, true);
            console.log("socket test failed");
            web_socket.close();
            web_socket = undefined;
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
        } else {
            var settingsbox = $("#settingsbox"),
                rpc_main_input = settingsbox.find("#rpc_main_input");
            settingsbox.find("#rpc_main_input").removeData().data(thisdata);
            settingsbox.find(".options .optionwrap").removeClass("rpc_selected");
            thisoption.addClass("rpc_selected");
        }
        return false;
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
        if (rpc_input_box.length > 0) {
            var rpc_url_input_val = rpc_input_box.find("#rpc_url_input").val();
            if (rpc_url_input_val.length > 5) {
                var optionsbox = settingsbox.find(".options"),
                    duplicates = optionsbox.find("span[data-value='" + rpc_url_input_val + "']"),
                    indexed = (duplicates.length > 0);
                if (indexed === true) {
                    popnotify("error", "Node already added");
                    return false;
                } else {
                    var rpc_username_input_val = rpc_input_box.find("#rpc_username_input").val(),
                        rpc_password_input_val = rpc_input_box.find("#rpc_password_input").val(),
                        rpc_data = {
                            "url": rpc_url_input_val,
                            "username": rpc_username_input_val,
                            "password": rpc_password_input_val,
                            "default": false
                        };
                    test_rpc(rpc_input_box, rpc_data, thiscurrency);
                }
            } else {
                pass_rpc_submit(thiscurrency, setvalue, false)
            }
        } else {
            pass_rpc_submit(thiscurrency, setvalue, false)
        }
    })
}

function test_rpc(rpc_input_box, rpc_data, currency) {
    if (s_id == "apis") {
        if (currency == "ethereum") {
            if (web3) {
                if (web3.currentProvider.host == rpc_data.url) {} else {
                    web3.setProvider(rpc_data.url);
                }
                web3.eth.getTransaction("0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", function(err_1, data_1) { // random tx
                    if (err_1) {
                        rpc_input_box.addClass("offline").removeClass("live");
                        popnotify("error", err_1);
                    } else {
                        if (data_1) {
                            rpc_input_box.addClass("live").removeClass("offline");
                            pass_rpc_submit(currency, rpc_data, true);
                        } else {
                            rpc_input_box.addClass("offline").removeClass("live");
                            popnotify("error", "unable to connect");
                        }
                    }
                });
            } else {
                rpc_input_box.addClass("offline").removeClass("live");
                popnotify("error", "Unable to connect");
            }
        } else {
            var rpc = (currency == "bitcoin" || currency == "litecoin" || currency == "dogecoin") ? "bitcoin" : currency,
                rpcurl = get_rpc_url(rpc_data);
            api_proxy({
                "api": rpc,
                "search": "test",
                "cachetime": 25,
                "cachefolder": "1h",
                //"custom": "btc_rpc_test",
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
                op: "ping"
            });
        } else if (currency == "nano") {
            var ping_event = JSON.stringify({
                action: "subscribe",
                topic: "confirmation",
                ack: true,
                id: 1
            });
        } else if (currency == "ethereum" || is_erc20t === true) {
            var ping_event = JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_subscribe",
                params: ["logs", {
                    address: "",
                    topics: []
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
            web_socket = undefined;
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
            web_socket = undefined;
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
        if (options.length > 0) {
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
            } else {
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
        }
        return false;
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
					    		<li><strong>Derivation path:</strong> M/</li>\
				    		</ul>\
				    	</div>\
						<div id='backupactions'>\
							<div id='delete_xpub' data-currency='" + thiscurrency + "' class='icon-bin'></div>\
							<div id='backupcd'>CANCEL</div>\
						</div>\
			    	</div>");
                popdialog(content, "alert", "triggersubmit", null, true);
            } else {
                playsound(funk);
            }
        } else {
            playsound(funk);
        }
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
        		<div class='inputwrap'><input type='text' class='address' value='" + address + "' placeholder='Enter a " + currency + " Xpub key'>" + scanqr + "</div>\
        		<div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>I own the seed / Xpriv key</span></div>\
        		<input type='submit' class='submit' value='OK'></form>").data(ad);
    popdialog(content, "alert", "triggersubmit");
    if (supportsTouch === true) {} else {
        $("#popup input.address").focus();
    }
}

function submit_xpub_strigger() {
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
        var valid = check_xpub(addressinputval, xpub_prefix(currency));
        if (valid === true) {
            var pk_checkbox = thisnode.find("#pk_confirmwrap"),
                pk_checked = pk_checkbox.data("checked");
            if (pk_checked == true) {
                var xpubli = $("#" + currency + "_settings .cc_settinglist li[data-id='Xpub']"),
                    haskey = xpubli.data("key");
                if (haskey) {
                    if (haskey == addressinputval) {
                        canceldialog();
                        return false;
                    } else {
                        var result = confirm("Replace Xpub?");
                        if (result === true) {} else {
                            return false
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
                    bip32 = getbip32dat(currency),
                    ad = derive_obj("xpub", false, keycc.key, keycc.cc, coindat, bip32, xpub_id);
                derive_add_address(currency, ad);
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
            var errormessage = "NOT a valid " + currency + " Xpub key";
            popnotify("error", errormessage);
            setTimeout(function() {
                addressfield.select();
            }, 10);
        }
    } else {
        var errormessage = "Enter a " + currency + " Xpub key";
        popnotify("error", errormessage);
        addressfield.focus();
    }
}

function check_xpub(address, prefix) {
    var regex = "(" + prefix + "[a-km-zA-HJ-NP-Z1-9]{100,108})(\\?c=\\d*&h=bip\\d{2,3})?";
    return new RegExp(regex).test(address);
}

// Key Management

function key_management() {
    $(document).on("click", ".cc_settinglist li[data-id='Key derivations'] .atext", function() {
        var thisnode = $(this),
            thislist = thisnode.closest("li"),
            thisdat = thislist.data();
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
	        }
	        else {
		        manage_bip32();
	        }
        }
    })
}

function xmrphrase_sc() {
    $("#monero_settings .cc_settinglist li[data-id='Key derivations'] .atext").trigger("click");
}

function xpub_info_pu(currency, xpub) {
    var coindat = getcoindata(currency),
        bip32dat = getbip32dat(currency),
        root_path = "M/",
        startindex = 0,
        keycc = key_cc_xpub(xpub),
        key = keycc.key,
        chaincode = keycc.cc
    root_dat = {
            "key": key,
            "cc": chaincode,
            "xpub": true,
        },
        derivelist = "",
        derive_array = keypair_array(false, new Array(5), startindex, root_path, bip32dat, key, chaincode, currency);
    $.each(derive_array, function(i, val) {
        var index = startindex + i;
        derivelist += "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> | " + val.address + "</li>";
    });
    var content = $("<div id='ad_info_wrap'><h2>" + getcc_icon(coindat.cmcid, coindat.ccsymbol + "-" + thiscurrency, coindat.erc20) + " <span>" + thiscurrency + " Key Derivation</span></h2><ul>\
	    <li><strong>Source: </strong>Xpub</li>\
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