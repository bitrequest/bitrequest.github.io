$(document).ready(function() {
    // ** RPC Node Management: **
    edit_rpcnode();
    //fetch_electrum_nodes
    //fetch_xmr_nodes
    //get_random_node
    //get_rpc_placeholder
    //validate_and_add_rpc_node
    //create_rpc_node_element
    handle_select_change();
    handle_rpc_node_selection();
    submit_rpcnode();
    //nodes_match
    //match_url
    //validate_rpc_connection
    //pre_save_rpc_settings
    //save_rpc_settings
    //save_lws_settings
    delete_rpc_node();
    toggle_lws();
    //get_node_icon
});

// ** RPC Node Management: **

// Handles RPC/API endpoint configuration UI for both HTTP and WebSocket connections with placeholder suggestions
function edit_rpcnode() {
    $(document).on("click", ".cc_settinglist li[data-id='apis'], .cc_settinglist li[data-id='websockets']", function() {
        const settings_item = $(this),
            ap_id = settings_item.attr("data-id"),
            item_data = settings_item.data(),
            currency_name = settings_item.children(".liwrap").attr("data-currency"),
            is_xmr = (currency_name === "monero");
        if (is_xmr) {
            const address_data = get_address_data(currency_name),
                viewkey = address_data.vk;
            if (!viewkey) {
                play_audio("funk");
                return
            }
        }
        const coin_settings = get_coinsettings(currency_name),
            copy_settings = clone(coin_settings),
            predefined_nodes = q_obj(copy_settings, ap_id + ".apis"),
            custom_nodes = item_data.options;
        if (!exists(custom_nodes) && !exists(predefined_nodes)) {
            return
        }
        glob_let.ap_id = ap_id,
            glob_let.test_rpc_call = item_data.rpc_test_command,
            glob_let.is_erc20t = ($("#" + currency_name + "_settings").attr("data-erc20") == "true"),
            glob_let.is_btc = is_btchain(currency_name) === true;
        const service_hint = glob_let.is_btc ? "mempool.space / Electrum" :
            (currency_name === "ethereum") ? ((ap_id === "apis") ? "Infura" : "Alchemy") :
            (glob_let.is_erc20t === true) ? "Infura" : "",
            dialog_title = glob_let.ap_id === "websockets" ? tl("addwebsocket", {
                "h_hint": service_hint
            }) : tl("addapi", {
                "h_hint": service_hint
            }),
            node_type = (currency_name === "ethereum" || glob_let.is_erc20t === true) ? "eth" : currency_name,
            placeholder_key = glob_let.ap_id + node_type + generate_random_number(1, 3),
            url_placeholder = get_rpc_placeholder(currency_name)[placeholder_key],
            btc_chain = is_btchain(currency_name) === true,
            qr_id = is_xmr ? "xmrrpc" : "add_node",
            default_placeholder = "some.node:port",
            scan_btn = glob_let.hascam ? "<div class='qrscanner' data-currency='" + currency_name + "' data-id='" + qr_id + "' title='scan qr-code'><span class='icon-qrcode'></span></div>" : "<div class='selectarrows icon-menu2' data-pe='none'></div>",
            node_select = (is_xmr || btc_chain) ? scan_btn + "<div class='options'></div>" : "",
            input_form = custom_nodes ? "<div id='rpc_input_box' data-currency='" + currency_name + "' data-erc20='" + glob_let.is_erc20t + "'>\
                    <h3>" + dialog_title + "</h3>\
                    <div id='rpc_input'>\
                        <div class='selectbox' id='rpc_list'>\
                            <input type='text' value='' placeholder='" + (url_placeholder || default_placeholder) + "' id='rpc_url_input' data-pe='block' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                            <div class='c_stat icon-wifi-off'></div>\
                            <div class='c_stat icon-connection'></div>" + node_select + "</div><div id='lws_container'></div></div>\
                </div>" : "",
            current_node = item_data.selected,
            node_name = current_node.name,
            node_url = current_node.url || node_name,
            url_trunc = truncate_middle(node_url),
            node_title = (node_name === "electrum" || node_name === "mempool.space" || node_name === "xmr_node" || node_name === "lws" || node_name === "infura") ? url_trunc : node_name || url_trunc,
            dialog_html = "<div class='formbox' id='settingsbox' data-id='" + glob_let.ap_id + "'>\
                <h2 class='icon-sphere'>" + tl("choose") + " " + currency_name + " " + glob_let.ap_id + "</h2>\
                <div class='popnotify'></div>\
                <div class='popform'>\
                    <div class='selectbox' id='api_list'>\
                        <input type='text' value='" + node_title + "' data-set='" + node_title + "' placeholder='Choose RPC node' readonly='readonly' id='rpc_main_input'/>\
                        <div class='selectarrows icon-menu2' data-pe='none'></div>\
                        <div class='options'></div>\
                    </div>" + input_form +
            "<input type='submit' class='submit' value='" + tl("okbttn") + "' data-currency='" + currency_name + "'/>\
                </div>\
            </div>";
        popdialog(dialog_html, "triggersubmit");
        const api_list = $("#api_list").find(".options");
        $.each(predefined_nodes, function(node_id, node_config) {
            if (node_config.display) {
                const this_node_name = node_config.name,
                    this_node_url = node_config.url || this_node_name,
                    is_selected = (this_node_url === node_url);
                if (currency_name === "nano" || this_node_name === "electrum" || this_node_name === "mempool.space" || this_node_name === "infura" || this_node_name === "xmr_node" || this_node_name === "lws") {
                    validate_and_add_rpc_node(currency_name, api_list, node_id, node_config, is_selected);
                } else {
                    create_rpc_node_element(api_list, true, node_id, node_config, is_selected);
                }
            }
        });
        $.each(custom_nodes, function(node_id, node_config) {
            const is_selected = (node_config.url === node_url);
            validate_and_add_rpc_node(currency_name, api_list, node_id, node_config, is_selected);
        });
        $("#rpc_main_input").data(current_node);
        setTimeout(function() {
            close_socket();
        }, 5000);
        if (btc_chain && ap_id === "apis") {
            fetch_electrum_nodes(currency_name, node_url, predefined_nodes, custom_nodes);
            return
        }
        if (is_xmr) {
            fetch_xmr_nodes(node_url, predefined_nodes, custom_nodes);
            const current_lws = item_data.lws_selected,
                lws_name = current_lws.name,
                lws_url = current_lws.url,
                lws_trunc = truncate_middle(lws_url),
                lws_html = "<div id='lws_toggle' class='linkcolor'>Monero-lws</div>\
                <div id='lws_drawer'>\
                <h3>Monero LWS <span id='lws_repo'><a href='https://github.com/vtnerd/monero-lws' target='_blank' class='linkcolor exit'> github <span class='icon-new-tab'></span></a></span></h3>\
                <div class='selectbox' id='lws_list'>\
                    <input type='text' value='" + lws_trunc + "' data-set='" + lws_trunc + "' placeholder='Monero LWS server' readonly='readonly' id='lws_main_input'/>\
                    <div class='selectarrows icon-menu2' data-pe='none'></div>\
                    <div class='options'></div>\
                </div>\
                <input type='text' value='' placeholder='Add Monero LWS server' id='lws_url_input' data-pe='block' autocomplete='off' autocapitalize='off' spellcheck='false'/>\
                </div>";
            $("#lws_container").html(lws_html);
            const predefined_lws = q_obj(copy_settings, "apis.lws"),
                custom_lws = item_data.lws_options,
                all_lws = predefined_lws.concat(custom_lws),
                lws_list = $("#lws_list").find(".options");
            $.each(all_lws, function(node_id, node_config) {
                const is_selected = (node_config.url === lws_url);
                validate_and_add_rpc_node(currency_name, lws_list, node_id, node_config, is_selected);
            });
        }
    })
}

// fetch peers from electrum node
function fetch_electrum_nodes(currency, node_url, predefined_nodes, custom_nodes) {
    const existing_nodes = $.extend(predefined_nodes, custom_nodes),
        random_node = get_random_node(existing_nodes, "electrum"),
        custom = true;
    if (random_node) {
        const rpc_list = $("#rpc_list"),
            api_options = rpc_list.find(".options"),
            get_session_nodes = br_get_session("electrum_" + currency, true);
        if (get_session_nodes && get_session_nodes.length > 0) {
            let has_nodes = false;
            $.each(get_session_nodes, function(index, val) {
                const rpc_url = val.rpc_url2,
                    v = val.v,
                    node_config = {
                        "name": "electrum",
                        "url": rpc_url,
                        "display": true,
                        custom,
                        v
                    },
                    node_id = val.node_id,
                    is_selected = rpc_url === node_url;
                create_rpc_node_element(api_options, true, node_id, node_config, is_selected);
                has_nodes = true;
            });
            if (has_nodes) {
                rpc_list.addClass("show_select");
            }
            return
        }
        const node_list_obj = [],
            rpc_url = random_node.url;
        api_proxy({
            "api": currency,
            "cachetime": 25,
            "cachefolder": "1h",
            "custom": "electrum",
            "api_url": rpc_url,
            "proxy": true,
            "params": {
                "method": "POST",
                "cache": true,
                "data": {
                    "id": "peers",
                    "method": "server.peers.subscribe",
                    "node": rpc_url
                }
            }
        }).done(function(e) {
            const api_result = br_result(e),
                result = q_obj(api_result, "result"),
                list_length = result.length;
            let done = false,
                count = 0,
                inner_count = 0;
            if (list_length && is_array(result)) {
                // limit to maximum 50 nodes
                const short_list = (list_length > 50) ? result.slice(0, 50) : result;
                $.each(short_list, function(node_id, nd) {
                    const url = nd[1] || nd[0],
                        filter_ips = is_valid_ipv4(url);
                    if (filter_ips) {
                        // filter out electrum ip's and only add regular urls
                    } else {
                        let tport = null,
                            v = null;
                        if (url) {
                            const port_arr = nd[2];
                            if (is_array(port_arr)) {
                                v = port_arr[0];
                                tport = port_arr[1];
                            }
                        }
                        const port = tport ? ((/^\d/.test(tport)) ? ":" + port : ":" + tport.slice(1)) : "",
                            rpc_url2 = url + port,
                            node_exists = objectkey_in_array(existing_nodes, "url", rpc_url2);
                        if (!node_exists) {
                            count++;
                            const node_config = {
                                    "name": "electrum",
                                    "url": rpc_url2,
                                    "display": true,
                                    custom,
                                    v
                                },
                                test_tx = glob_const.test_tx[currency],
                                delay_time = 500 * count,
                                fetch_timeout = setTimeout(function() {
                                    api_proxy({
                                        "api": currency,
                                        "custom": "electrum",
                                        "api_url": rpc_url2,
                                        "proxy": true,
                                        "params": {
                                            "method": "POST",
                                            "data": {
                                                "id": sha_sub(rpc_url2, 6),
                                                "method": "blockchain.transaction.get",
                                                "ref": test_tx,
                                                "node": rpc_url2
                                            }
                                        }
                                    }).done(function(e) {
                                        const api_result = br_result(e),
                                            result2 = q_obj(api_result, "result.tx_hash");
                                        if (result2) {
                                            const is_selected = rpc_url2 === node_url;
                                            create_rpc_node_element(api_options, true, node_id, node_config, is_selected);
                                            node_list_obj.push({
                                                node_id,
                                                rpc_url2,
                                                custom,
                                                v
                                            });
                                        }
                                    }).always(function() {
                                        inner_count++;
                                        if (done) return
                                        if (inner_count >= count) { // done
                                            done = true;
                                            const margin_timeout = setTimeout(function() {
                                                br_set_session("electrum_" + currency, node_list_obj, true);
                                                rpc_list.addClass("show_select");
                                            }, 500, function() {
                                                clearTimeout(margin_timeout);
                                            });
                                        }
                                    });
                                }, delay_time, function() {
                                    clearTimeout(fetch_timeout);
                                });
                        }
                    }
                });
            }
        });
    }
}

// fetch public xmr nodes from monero.fail
function fetch_xmr_nodes(node_url, predefined_nodes, custom_nodes) {
    const rpc_list = $("#rpc_list"),
        api_options = rpc_list.find(".options"),
        custom = true,
        get_session_nodes = br_get_session("monero_rpc", true);
    if (get_session_nodes && get_session_nodes.length > 0) {
        let has_nodes = false;
        $.each(get_session_nodes, function(index, val) {
            const rpc_url = val.node,
                node_config = {
                    "name": "xmr_node",
                    "url": rpc_url,
                    "display": true,
                    custom
                },
                node_id = val.node_id,
                is_selected = rpc_url === node_url;
            create_rpc_node_element(api_options, true, node_id, node_config, is_selected);
            has_nodes = true;
        });
        if (has_nodes) {
            rpc_list.addClass("show_select");
        }
        return
    }
    const node_list_obj = []
    api_proxy({
        "api_url": "https://monero.fail/nodes.json",
        "proxy": false,
        "params": {
            "method": "GET",
        }
    }).done(function(message) {
        const api_result = br_result(message),
            result = q_obj(api_result, "result");
        if (result) {
            const main_net = result.monero;
            if (main_net) {
                const web_compatible = main_net.web_compatible ? main_net.web_compatible.slice(0, 15) : [],
                    onion = main_net.onion ? main_net.onion.slice(0, 10) : [],
                    full_node_list = web_compatible.concat(onion);
                if (full_node_list.length > 0) {
                    let done = false,
                        count = 0,
                        inner_count = 0;
                    const existing_nodes = $.extend(predefined_nodes, custom_nodes);
                    $.each(full_node_list, function(node_id, node) {
                        const node_exists = objectkey_in_array(existing_nodes, "url", node);
                        if (!node_exists) {
                            count++;
                            const delay_time = 500 * count,
                                node_config = {
                                    "name": "xmr_node",
                                    "url": node,
                                    "display": true,
                                    custom
                                }
                            fetch_timeout = setTimeout(function() {
                                api_proxy({
                                    "api_url": node + "/get_transaction_pool_hashes",
                                    "proxy": node.includes(".onion"),
                                    "params": {
                                        "method": "POST",
                                        "headers": {
                                            "Content-Type": "application/json"
                                        }
                                    }
                                }).done(function(e) {
                                    const response = br_result(e).result;
                                    if (response) {
                                        const txs_hashes = response.tx_hashes;
                                        if (txs_hashes && txs_hashes.length > 0) {
                                            const is_selected = node === node_url;
                                            create_rpc_node_element(api_options, true, node_id, node_config, is_selected);
                                            node_list_obj.push({
                                                node_id,
                                                node,
                                                custom
                                            });
                                        }
                                    }
                                }).always(function() {
                                    inner_count++;
                                    if (done) return
                                    if (inner_count >= count) { // done
                                        done = true;
                                        const margin_timeout = setTimeout(function() {
                                            br_set_session("monero_rpc", node_list_obj, true);
                                            rpc_list.addClass("show_select");
                                        }, 500, function() {
                                            clearTimeout(margin_timeout);
                                        });
                                    }
                                });
                            }, delay_time, function() {
                                clearTimeout(fetch_timeout);
                            });
                        }
                    });
                }
            }
        }
    });
}

// Pick a random node
function get_random_node(predefined_nodes, node_name) {
    const custom_nodes = predefined_nodes.filter(node => node_name);
    if (custom_nodes.length) {
        const random_index = Math.floor(Math.random() * custom_nodes.length);
        return custom_nodes[random_index];
    }
    return null;
}

// Provides template URL examples for different cryptocurrency node configurations and API types
function get_rpc_placeholder(currency) {
    return {
        "apisnano1": "http://127.0.0.1:50001",
        "apisnano2": "http://some.node:50001",
        "apisnano3": "http://localhost:50001",
        "websocketsnano1": "ws://127.0.0.1:7078",
        "websocketsnano2": "ws://some.node:7078",
        "websocketsnano3": "ws://localhost:7078",
        "apiseth1": "http://localhost:8545",
        "apiseth2": "http://some.node:8546",
        "apiseth3": "https://mainnet.infura.io/v3/YOUR-PROJECT-ID",
        "websocketseth1": "ws://localhost:8545",
        "websocketseth2": "ws://some.node:8546",
        "websocketseth3": "wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID"
    }
}

// Tests RPC endpoints for connectivity and appends validated options to the selection UI with status indicators
function validate_and_add_rpc_node(currency_name, api_list, node_id, node_config, is_selected) {
    const rpc_url = node_config.url,
        rpc_name = node_config.name,
        test_address = glob_const.test_address[currency_name],
        custom = node_config.custom;
    if (glob_let.ap_id === "apis") {
        if (currency_name === "ethereum" || glob_let.is_erc20t === true) {
            const test_hash = glob_const.test_tx.ethereum, // random tx
                rpc_payload = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_getTransactionByHash",
                    "params": [test_hash]
                };
            api_proxy({
                "api_url": rpc_url + get_infura_apikey(rpc_url),
                "params": {
                    "method": "POST",
                    "data": rpc_payload,
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(response) {
                const parsed_data = br_result(response),
                    response_hash = q_obj(parsed_data, "result.result.hash"),
                    is_live = (response_hash === test_hash);
                create_rpc_node_element(api_list, is_live, node_id, node_config, is_selected);
            }).fail(function(error) {
                create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
            });
            return
        }
        if (is_btchain(currency_name)) {
            const test_tx = glob_const.test_tx[currency_name];
            if (rpc_name === "electrum") {
                api_proxy({
                    "api": currency_name,
                    "cachetime": 25,
                    "cachefolder": "1h",
                    "custom": "electrum",
                    "api_url": rpc_url,
                    "proxy": true,
                    "params": {
                        "method": "POST",
                        "cache": true,
                        "data": {
                            "id": sha_sub(rpc_url, 6),
                            "method": "blockchain.transaction.get",
                            "ref": test_tx,
                            "node": rpc_url
                        }
                    }
                }).done(function(e) {
                    const api_result = br_result(e),
                        is_live = q_obj(api_result, "result.tx_hash");
                    create_rpc_node_element(api_list, is_live, node_id, node_config, is_selected);
                }).fail(function(xhr, stat, err) {
                    create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
                });
                return
            }
            if (rpc_name === "mempool.space") {
                const api_rpc_url = node_config.api ? glob_const.mempool_space[currency_name] : rpc_url;
                api_proxy({ // mempoolspace API
                    "api_url": api_rpc_url + "/api/v1/difficulty-adjustment",
                    "proxy": api_rpc_url.includes(".onion"),
                    "params": {
                        "method": "GET"
                    }
                }).done(function(e) {
                    const ar = br_result(e).result,
                        result = ar.progressPercent || ar.difficultyChange || ar.estimatedRetargetDate;
                    is_live = (result) ? true : false;
                    create_rpc_node_element(api_list, is_live, node_id, node_config, is_selected);
                }).fail(function(xhr, stat, err) {
                    create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
                });
                return
            }
            return
        }
        if (currency_name === "nano") {
            api_proxy({
                "api": "nano",
                "search": "test",
                "cachetime": 25,
                "cachefolder": "1h",
                "api_url": rpc_url,
                "params": {
                    "method": "POST",
                    "data": glob_let.test_rpc_call,
                    "headers": {
                        "Content-Type": "text/plain"
                    }
                }
            }).done(function(e) {
                const parsed_data = br_result(e),
                    node_vendor = q_obj(parsed_data, "result.node_vendor"),
                    is_live = (node_vendor) ? true : false;
                if (is_live) {
                    node_config.vendor = node_vendor;
                    create_rpc_node_element(api_list, true, node_id, node_config, is_selected);
                    return
                }
                create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
            }).fail(function(xhr, stat, err) {
                create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
            });
            return
        }
        if (currency_name === "monero") {
            const address_data = get_address_data("monero");
            if (address_data) {
                const address = address_data.address,
                    view_key = address_data.vk;
                if (address && view_key) {
                    if (monero_lws_node_access(rpc_url, view_key)) { // xmr node connection already verified
                        create_rpc_node_element(api_list, true, node_id, node_config, is_selected);
                    } else {
                        if (rpc_name === "xmr_node") {
                            api_proxy({
                                "api_url": rpc_url + "/get_transaction_pool_hashes",
                                "proxy": rpc_url.includes(".onion"),
                                "params": {
                                    "method": "POST",
                                    "headers": {
                                        "Content-Type": "application/json"
                                    }
                                }
                            }).done(function(e) {
                                const parsed_data = br_result(e).result;
                                if (parsed_data) {
                                    const txs_hashes = parsed_data.tx_hashes;
                                    if (txs_hashes && txs_hashes.length > 0) { // confirm response
                                        set_monero_lws_node_access(rpc_url, view_key); // save xmr node connection status
                                        create_rpc_node_element(api_list, true, node_id, node_config, is_selected);
                                    } else {
                                        create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
                                    }
                                } else {
                                    create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
                                }
                            }).fail(function(xhr, stat, err) {
                                create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
                            });
                        } else if (rpc_name === "lws") {
                            api_proxy({
                                "api_url": rpc_url + "/login",
                                "proxy": false,
                                "params": {
                                    "method": "POST",
                                    "data": {
                                        "address": test_address, // use dummy XMR address, wait with creating an account until sharing a request. This way Point of Sale only request don't require LWS
                                        "view_key": glob_const.test_address.xmrvk,
                                        "create_account": true,
                                        "generated_locally": false
                                    },
                                    "headers": {
                                        "Content-Type": "application/json"
                                    }
                                }
                            }).done(function(e) {
                                const parsed_data = br_result(e).result;
                                if (parsed_data) {
                                    const new_address = parsed_data.new_address;
                                    if (new_address === true || new_address === false) { // confirm response
                                        set_monero_lws_node_access(rpc_url, view_key); // save lws node connection status
                                        create_rpc_node_element(api_list, true, node_id, node_config, is_selected);
                                    } else {
                                        create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
                                    }
                                } else {
                                    create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
                                }
                            }).fail(function(xhr, stat, err) {
                                create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
                            });
                        }
                    }
                }
            }
            return
        }
        return
    }
    if (glob_let.ap_id === "websockets") {
        let ws_url = rpc_url,
            ws_name = rpc_name || ws_url,
            ws_message = "heartbeat";
        if (ws_name === "blockcypher wss") {
            ws_url = rpc_url + "btc/main";
        } else if (currency_name === "ethereum") {
            ws_url = custom ? rpc_url : rpc_url + get_alchemy_apikey();
        } else if (glob_let.is_erc20t === true) {
            ws_url = custom ? rpc_url : rpc_url + get_infura_apikey();
        }
        if (glob_let.is_btc) {
            ws_message = JSON.stringify({
                "action": "want",
                "data": ["stats"]
            });
        } else if (currency_name === "nano") {
            ws_message = JSON.stringify({
                "action": "subscribe",
                "topic": "confirmation",
                "all_local_accounts": true,
                "options": {
                    "accounts": [test_address]
                },
                "ack": true
            });
        } else if (currency_name === "ethereum") {
            ws_message = JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_subscribe",
                "params": ["alchemy_pendingTransactions", {
                    "toAddress": [test_address],
                    "hashesOnly": false
                }]
            });
            node_config.name = "alchemy";
        } else if (glob_let.is_erc20t === true) {
            ws_message = JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_subscribe",
                "params": ["logs", {
                    "address": test_address,
                    "topics": []
                }]
            });
            node_config.name = "infura";
        }
        const socket_id = currency_name + node_id,
            test_socket = glob_let.sockets[socket_id] = new WebSocket(ws_url);
        test_socket.onopen = function(event) {
            test_socket.send(ws_message);
        };
        test_socket.onmessage = function(event) {
            create_rpc_node_element(api_list, true, node_id, node_config, is_selected);
            test_socket.close();
            glob_let.sockets[socket_id] = null;
            close_socket(socket_id);
        };
        test_socket.onerror = function(event) {
            create_rpc_node_element(api_list, false, node_id, node_config, is_selected);
            test_socket.close();
            glob_let.sockets[socket_id] = null;
            close_socket(socket_id);
        };
    }
}

// Creates and styles a UI element for RPC node options with live status indicators and deletion controls
function create_rpc_node_element(api_list, is_live, node_id, node_config, is_selected) {
    const status_class = is_live ? " live" : " offline",
        selected_class = is_selected ? " rpc_selected" : "",
        node_name = node_config.name,
        custom = node_config.custom,
        node_url = node_config.url || node_name,
        stripped_url = custom && (node_name === "alchemy" || node_name === "infura") ? strip_key_from_url(node_url) : node_url,
        vendor = node_config.vendor,
        vendor_string = (vendor) ? "<span class='v'> (" + vendor.slice(5) + ")</span>" : "",
        version = node_config.v,
        version_string = (version) ? "<span class='v'> (" + version + ")</span>" : "",
        display_name = setting_sub_address(node_name, stripped_url, node_config.custom) + vendor_string + version_string,
        node_icon_url = get_node_icon(node_name),
        default_class = custom ? "" : " default",
        node_icon = (node_icon_url) ? "<img src='" + fetch_aws(node_icon_url) + ".png' class='icon'/>" : "",
        node_element = $("<div class='optionwrap" + status_class + selected_class + default_class + "' style='display:none' data-pe='none' title='" + stripped_url + "'><span data-value='" + node_url + "' data-pe='none'>" + node_icon + "<span class='cstat'>•</span> " + display_name + "</span><div class='opt_icon_box' data-pe='none'><div class='opt_icon icon-bin' data-pe='none'></div></div>");
    node_element.data(node_config).appendTo(api_list);
    node_element.slideDown(500);
}

// Handles input change for selectbox elements
function handle_select_change() {
    $(document).on("input", "#rpc_list.selectbox > input:not([readonly])", function() {
        const select_input = $(this),
            current_value = select_input.val(),
            options = $(this).parent(".selectbox").find(".options");
        if (current_value) {
            options.removeClass("show_options");
            return
        }
        options.addClass("show_options");
    })
}

// Handles RPC node selection in UI with offline node detection and data persistence
function handle_rpc_node_selection() {
    $(document).on("mousedown", "#settingsbox .selectbox .options > div", function(e) {
        const clicked_element = $(e.target);
        if (clicked_element.hasClass("icon-bin")) {
            return // prevent selection when deleting
        }
        const node_option = $(this),
            node_config = node_option.data();
        if (node_option.hasClass("offline")) {
            play_audio("funk");
            topnotify(tl("unabletoconnect"));
            return
        }
        const dialog_box = $("#settingsbox"),
            node_select_input = dialog_box.find("#rpc_main_input");
        node_select_input.removeData().data(node_config);
        dialog_box.find(".options .optionwrap").removeClass("rpc_selected");
        node_option.addClass("rpc_selected");
        if (node_config.custom) return
        dialog_box.find("#rpc_url_input").val("");
    })
}

// Validates and processes RPC node submission with duplicate checking and connection testing
function submit_rpcnode() {
    $(document).on("click", "#settingsbox input.submit", function(e) {
        e.preventDefault();
        const dialog_box = $("#settingsbox"),
            currency_name = $(this).attr("data-currency");
        let lws_changes = false;
        if (currency_name === "monero") {
            const lws_main_input = dialog_box.find("#lws_main_input"),
                lmi_set_val = lws_main_input.attr("data-set"),
                lmi_val = lws_main_input.val();
            if (inj(lmi_val)) return
            if (lmi_set_val !== lmi_val) { // no changes
                lws_changes = true;
            }
            const lws_select_input = dialog_box.find("#lws_url_input"),
                lws_val = lws_select_input.val(),
                lws_url_length = lws_val.length;
            if (lws_url_length) {
                if (inj(lws_val)) return
                const is_valid_lws_url = is_valid_url_or_ip(lws_val);
                if (lws_url_length < 6 || !is_valid_lws_url) {
                    popnotify("error", tl("invalidurl"));
                    play_audio("funk");
                    return
                }
                const lws_options = dialog_box.find("#lws_list .options .optionwrap"),
                    lws_url_exists = nodes_match(lws_options, lws_val);
                if (lws_url_exists) {
                    popnotify("error", tl("nodealreadyadded"));
                    return
                }
                loader(true);
                set_loader_text(tl("connecttolnur", {
                    "url": truncate_middle(lws_val)
                }));
                const lws_node_config = {
                    "name": "lws",
                    "url": lws_val,
                    "default": false
                };
                const input_section = dialog_box.find("#rpc_input_box");
                validate_rpc_connection(input_section, lws_node_config, currency_name);
                return
            }
        }
        const node_select_input = dialog_box.find("#rpc_main_input"),
            nsi_val = node_select_input.val();
        if (inj(nsi_val)) return
        const input_section = dialog_box.find("#rpc_input_box");
        if (input_section.length) {
            const node_url = input_section.find("#rpc_url_input").val(),
                url_length = node_url.length;
            if (url_length) {
                if (inj(node_url)) return
                const is_valid_entry = (glob_let.ap_id === "apis") ? is_valid_url_or_ip(node_url) : is_websocket_url(node_url);
                if (url_length < 6 || !is_valid_entry) {
                    popnotify("error", tl("invalidurl"));
                    play_audio("funk");
                    return
                }
                const options = dialog_box.find("#api_list .options .optionwrap"),
                    url_exists = nodes_match(options, node_url);
                if (url_exists) {
                    popnotify("error", tl("nodealreadyadded"));
                    return
                }
                loader(true);
                set_loader_text(tl("connecttolnur", {
                    "url": truncate_middle(node_url)
                }));
                const node_config = {
                    "url": node_url,
                    "default": false
                };
                validate_rpc_connection(input_section, node_config, currency_name);
                return
            }
        }
        const nsi_set_val = node_select_input.attr("data-set");
        if (nsi_set_val === nsi_val && lws_changes === false) { // no changes
            canceldialog();
            return
        }
        const selected_config = node_select_input.data();
        pre_save_rpc_settings(currency_name, selected_config, false);
    });
}

// Check if node already exists
function nodes_match(nodes, node_url) {
    let match = false;
    if (nodes.length) {
        $.each(nodes, function(index, node) {
            const this_node = $(node),
                input = this_node.children("span").first();
            if (input.length) {
                const input_val = input.data("value");
                if (str_includes(input_val, match_url(node_url))) {
                    match = true;
                    return false
                }
            }
        });
    }
    return match;
}

// Normalizes URL format with protocol and trailing slash
function match_url(url) {
    const www_index = url.indexOf("://www."),
        slash_index = url.indexOf("://");
    return (www_index > -1) ? url.substring(www_index + 7) : (slash_index > -1) ? url.substring(slash_index + 3) : url;
}

// Tests RPC/WebSocket connectivity for multiple cryptocurrency protocols with error handling
function validate_rpc_connection(input_section, node_config, currency_name) {
    node_config.custom = true;
    const error_message = tl("unabletoconnect"),
        rpc_url = node_config.url,
        test_address = glob_const.test_address[currency_name];
    if (glob_let.ap_id === "apis") {
        if (currency_name === "ethereum" || glob_let.is_erc20t === true) {
            const test_hash = glob_const.test_tx.ethereum, // random tx
                rpc_payload = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_getTransactionByHash",
                    "params": [test_hash]
                };
            api_proxy({
                "api_url": rpc_url,
                "params": {
                    "method": "POST",
                    "data": rpc_payload,
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }).done(function(response) {
                const parsed_data = br_result(response),
                    response_hash = q_obj(parsed_data, "result.result.hash");
                if (response_hash === test_hash) {
                    input_section.addClass("live").removeClass("offline");
                    node_config.name = "infura";
                    pre_save_rpc_settings(currency_name, node_config, true);
                    return
                }
                input_section.addClass("offline").removeClass("live");
                popnotify("error", error_message);
            }).fail(function(error) {
                input_section.addClass("offline").removeClass("live");
                popnotify("error", error_message);
            }).always(function() {
                closeloader();
            });
            return
        }
        if (is_btchain(currency_name)) {
            const test_tx = glob_const.test_tx[currency_name];
            api_proxy({
                "api": currency_name,
                "cachetime": 25,
                "cachefolder": "1h",
                "custom": "electrum",
                "api_url": rpc_url,
                "proxy": true,
                "params": {
                    "method": "POST",
                    "cache": true,
                    "data": {
                        "id": sha_sub(rpc_url, 6),
                        "method": "blockchain.transaction.get",
                        "ref": test_tx,
                        "node": rpc_url
                    }
                }
            }).done(function(e) {
                const parsed_data = br_result(e),
                    api_result = q_obj(parsed_data, "result.tx_hash");
                if (api_result) {
                    const script_pub = address_to_scripthash(test_address, currency_name),
                        script_hash = script_pub.hash,
                        script_pub_key = script_pub.script_pub_key;
                    api_proxy({
                        "api": currency_name,
                        "cachetime": 25,
                        "cachefolder": "1h",
                        "custom": "electrum",
                        "api_url": rpc_url,
                        "proxy": true,
                        "params": {
                            "method": "POST",
                            "cache": true,
                            "data": {
                                "id": "scanning",
                                "method": "blockchain.scripthash.get_history",
                                "ref": script_hash,
                                "node": rpc_url
                            }
                        }
                    }).done(function(response) {
                        const parsed_data2 = br_result(response),
                            api_result2 = q_obj(parsed_data2, "result");
                        if (api_result2) {
                            const first_tx = api_result2[0];
                            if (first_tx) {
                                if (first_tx.version) {
                                    input_section.addClass("live").removeClass("offline");
                                    node_config.name = "electrum";
                                    pre_save_rpc_settings(currency_name, node_config, true);
                                    closeloader();
                                    return
                                }
                            }
                        }
                        test_mempoolspace(input_section, node_config, currency_name);
                    }).fail(function(xhr, stat, err) {
                        test_mempoolspace(input_section, node_config, currency_name);
                    });
                    return
                }
                test_mempoolspace(input_section, node_config, currency_name);
            }).fail(function(xhr, stat, err) {
                test_mempoolspace(input_section, node_config, currency_name);
            });
            return
        }
        if (currency_name === "nano") {
            api_proxy({
                "api": "nano",
                "search": "test",
                "cachetime": 25,
                "cachefolder": "1h",
                "api_url": rpc_url,
                "params": {
                    "method": "POST",
                    "data": glob_let.test_rpc_call,
                    "headers": {
                        "Content-Type": "text/plain"
                    }
                }
            }).done(function(response) {
                const parsed_data = br_result(response);
                if (q_obj(parsed_data, "result.rpc_version")) {
                    input_section.addClass("live").removeClass("offline");
                    node_config.name = "nano";
                    pre_save_rpc_settings(currency_name, node_config, true);
                    return
                }
                input_section.addClass("offline").removeClass("live");
                popnotify("error", error_message);
            }).fail(function(xhr, stat, err) {
                input_section.addClass("offline").removeClass("live");
                popnotify("error", error_message);
            }).always(function() {
                closeloader();
            });
            return
        }
        if (currency_name === "monero") {
            const address_data = get_address_data("monero");
            if (address_data) {
                const address = address_data.address,
                    view_key = address_data.vk;
                if (address && view_key) {
                    if (monero_lws_node_access(rpc_url, view_key)) { // lws node connection already verified
                        pre_save_rpc_settings(currency_name, node_config, true);
                        return
                    }
                    const node_name = node_config.name;
                    if (node_name && node_name === "lws") {
                        api_proxy({
                            "api_url": rpc_url + "/login",
                            "proxy": false,
                            "params": {
                                "method": "POST",
                                "data": {
                                    address,
                                    view_key,
                                    "create_account": true,
                                    "generated_locally": false
                                },
                                "headers": {
                                    "Content-Type": "application/json"
                                }
                            }
                        }).done(function(e) {
                            const parsed_data = br_result(e).result;
                            if (parsed_data) {
                                const new_address = parsed_data.new_address;
                                if (new_address === true || new_address === false) { // confirm response
                                    set_monero_lws_node_access(rpc_url, view_key); // save lws connection status
                                    input_section.addClass("live").removeClass("offline");
                                    pre_save_rpc_settings(currency_name, node_config, true);
                                    return
                                }
                            }
                            input_section.addClass("offline").removeClass("live");
                            popnotify("error", error_message);
                        }).fail(function(xhr, stat, err) {
                            input_section.addClass("offline").removeClass("live");
                            popnotify("error", error_message);
                        }).always(function() {
                            closeloader();
                        });
                        return
                    }
                    api_proxy({
                        "api_url": rpc_url + "/get_transaction_pool_hashes",
                        "proxy": rpc_url.includes(".onion"),
                        "params": {
                            "method": "POST",
                            "headers": {
                                "Content-Type": "application/json"
                            }
                        }
                    }).done(function(e) {
                        const parsed_data = br_result(e).result;
                        if (parsed_data) {
                            const txs_hashes = parsed_data.tx_hashes;
                            if (txs_hashes && txs_hashes.length > 0) {
                                set_monero_lws_node_access(rpc_url, view_key); // save xmr node connection status
                                input_section.addClass("live").removeClass("offline");
                                node_config.name = "xmr_node";
                                pre_save_rpc_settings(currency_name, node_config, true);
                                return
                            }
                        }
                        input_section.addClass("offline").removeClass("live");
                        popnotify("error", error_message);
                    }).fail(function(xhr, stat, err) {
                        input_section.addClass("offline").removeClass("live");
                        popnotify("error", error_message);
                    }).always(function() {
                        closeloader();
                    });
                }
            }
            return
        }
        return
    }
    if (glob_let.ap_id === "websockets") {
        let ws_url = rpc_url,
            ws_message;
        if (glob_let.is_btc) {
            ws_message = JSON.stringify({
                "action": "want",
                "data": ["mempool-blocks", "stats"]
            });
            node_config.name = "mempool.space";
        } else if (currency_name === "nano") {
            ws_message = JSON.stringify({
                "action": "subscribe",
                "topic": "confirmation",
                "all_local_accounts": true,
                "options": {
                    "accounts": [test_address]
                },
                "ack": true
            });
            node_config.name = "nano";
        } else if (currency_name === "ethereum") {
            ws_message = JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_subscribe",
                "params": ["alchemy_pendingTransactions", {
                    "toAddress": [test_address],
                    "hashesOnly": false
                }]
            });
            node_config.name = "alchemy";
        } else if (glob_let.is_erc20t === true) {
            ws_message = JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_subscribe",
                "params": ["logs", {
                    "address": test_address,
                    "topics": []
                }]
            });
            node_config.name = "infura";
        }
        const test_socket = glob_let.sockets["ws_submit"] = new WebSocket(ws_url);
        test_socket.onopen = function(event) {
            test_socket.send(ws_message);
        };
        test_socket.onmessage = function(e) {
            let pass = false;
            if (e.data) {
                const resp = JSON.parse(e.data);
                if (resp) {
                    if (resp.error) {} else if (glob_let.is_btc && (resp.mempoolInfo || resp["mempool-blocks"])) {
                        pass = true;
                    } else if (currency_name === "ethereum" && resp.result && resp.jsonrpc) {
                        pass = true;
                    } else if (glob_let.is_erc20t === true) {
                        pass = false;
                    } else if (currency_name === "nano" && resp.ack) {
                        pass = true;
                    }
                }
            }
            if (pass) {
                test_socket.close();
                close_socket("ws_submit").then(() => {
                    glob_let.sockets["ws_submit"] = null;
                    input_section.addClass("live").removeClass("offline");
                    pre_save_rpc_settings(currency_name, node_config, true);
                });
                return
            }
            popnotify("error", error_message);
            closeloader();
        };
        test_socket.onclose = function(event) {
            closeloader();
        };
        test_socket.onerror = function(event) {
            close_socket("ws_submit").then(() => {
                input_section.addClass("offline").removeClass("live");
                popnotify("error", error_message);
                test_socket.close();
            });
        };
        setTimeout(function() {
            close_socket();
        }, 5000);
    }
}

function test_mempoolspace(input_section, node_config, currency_name) {
    const test_address = glob_const.test_address[currency_name],
        error_message = tl("unabletoconnect"),
        rpc_url = node_config.url;
    api_proxy({
        "api_url": rpc_url + "/api/address/" + test_address + "/txs",
        "proxy": rpc_url.includes(".onion"),
        "params": {
            "method": "GET"
        }
    }).done(function(response) {
        const parsed_data = br_result(response),
            api_result = parsed_data.result;
        if (api_result) {
            if (api_result.error) {
                const errormessage = extract_error_details(api_result.error, true);
                popnotify("error", errormessage);
                return
            }
            const first_tx = api_result[0];
            if (first_tx) {
                if (first_tx.version) {
                    input_section.addClass("live").removeClass("offline");
                    node_config.name = "mempool.space";
                    pre_save_rpc_settings(currency_name, node_config, true);
                    closeloader();
                    return
                }
            }
        }
        input_section.addClass("offline").removeClass("live");
        popnotify("error", error_message);
    }).fail(function(error) {
        input_section.addClass("offline").removeClass("live");
        popnotify("error", error_message);
    }).always(function() {
        closeloader();
    });
}

// Pick monero-lws or global node settings
function pre_save_rpc_settings(currency_name, node_config, is_new_node) {
    const node_name = node_config.name;
    if (currency_name === "monero" && node_name === "lws") {
        save_lws_settings(currency_name, node_config, is_new_node);
        return
    }
    save_rpc_settings(currency_name, node_config, is_new_node);
}

// Updates UI and persists RPC configuration after successful validation
function save_rpc_settings(currency_name, node_config, is_new_node) {
    const node_name = node_config.name,
        settings_item = cs_node(currency_name, glob_let.ap_id),
        custom_nodes = settings_item.data("options"),
        node_url = node_config.url,
        display_name = setting_sub_address(node_name, node_url, node_config.custom);
    settings_item.data("selected", node_config).find("p").html(display_name);
    if (is_new_node === true) {
        if (empty_obj(custom_nodes)) {
            settings_item.data("options", [node_config]);
        } else {
            custom_nodes.push(node_config);
        }
    }
    canceldialog();
    notify(tl("datasaved"));
    save_cc_settings(currency_name, true);
}

// Save monero-lws settings 
function save_lws_settings(currency_name, node_config, is_new_node) {
    const node_name = node_config.name,
        settings_item = cs_node(currency_name, "apis"),
        custom_nodes = settings_item.data("lws_options"),
        node_url = node_config.url;
    settings_item.data("lws_selected", node_config);
    if (is_new_node === true) {
        if (empty_obj(custom_nodes)) {
            settings_item.data("lws_options", [node_config]);
        } else {
            custom_nodes.push(node_config);
        }
    }
    canceldialog();
    notify(tl("datasaved"));
    save_cc_settings(currency_name, true);
}

// Manages removal of custom RPC nodes with safeguards for default nodes
function delete_rpc_node() {
    $(document).on("click", "#settingsbox .options .opt_icon_box .icon-bin", function(e) {
        e.preventDefault();
        const delete_btn = $(this),
            dialog_box = $("#settingsbox"),
            currency_name = dialog_box.find("#rpc_input_box").attr("data-currency"),
            settings_item = cs_node(currency_name, glob_let.ap_id),
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
                play_audio("funk");
                topnotify(tl("removedefaultnode"));
                return
            }
            const node_name = node_url || node_config.name,
                user_confirmed = confirm(tl("confirmremovenode", {
                    "thisval": node_name
                }));
            if (user_confirmed) {
                const filtered_nodes = custom_nodes.filter(node => node.url !== node_url);
                node_element.slideUp(500, function() {
                    $(this).remove();
                });
                settings_item.data("options", filtered_nodes);
                notify(tl("rpcnoderemoved"));
                $("#rpc_url_input").val("");
                save_cc_settings(currency_name, true);
            }
        }
        return
    })
}

// Toggles Monero-lws inputs
function toggle_lws() {
    $(document).on("click", "#lws_toggle", function() {
        const lws_drawer = $("#lws_drawer");
        if (lws_drawer.is(":visible")) {
            lws_drawer.slideUp(200);
            return
        }
        lws_drawer.slideDown(200);
    })
}

function get_node_icon(node_name) {
    if (!node_name) return "node";
    const node_array = ["blockchair", "etherscan", "binplorer", "alchemy"],
        in_array = node_array.includes(node_name);
    return in_array ? node_name : (node_name === "electrum") ? "electrum_node" :
        (node_name === "xmr_node" || node_name === "lws") ? "monero" :
        (node_name.includes("mempool.space")) ? "mempool_node" :
        (node_name.includes("blockchain.info")) ? "blockchain_info" :
        (node_name.includes("infura")) ? "infura" :
        (node_name.includes("blockcypher")) ? "blockcypher" :
        (node_name === "nano") ? "nano" : "node";
}