$(document).ready(function() {
    // ** Core L2 Management: **
    //initialize_layer2_connections
    //setup_layer2_monitoring 
    //start_layer2_scan
    //start_layer2_polling
    //execute_layer2_scan

    // ** Network Operations: **
    //route_layer2_operation
    //arbitrum_apis
    //polygon_apis
    //bnb_apis
    //base_apis

    // ** API Request Handling: **
    //route_layer2_api_request
    //scan_layer2_networks
    //poll_layer2_network

    // ** Settings Management: **
    edit_l2_init();
    //edit_l2
    //has_contracts
    pick_l2_select();
    toggle_l2_services();
    save_layer2_settings();

    // ** Configuration Helpers: **
    //compress_layer2_config
    //get_layer2_config
    //get_network_node_config
    //get_set_l2s

    // ** Fetch contracts: **
    //init_fetch_l2_contracts
    //fetch_l2_contracts
    //construct_l2_contracts
    //fetch_localstorage_contracts
    //fetch_contracts_callback

    // ** Status Management: **
    //initialize_network_status
    //update_network_status
    //create_layer2_request
    switch_l2();
    pick_l2();
});

// ** Core L2 Management: **

// Initializes Layer 2 socket connections for Ethereum and ERC20 token transactions
function initialize_layer2_connections(payment, address, ctracts, socket_node) {
    const idx_array = Object.keys(glob_const.eth_l2s),
        l2_options = get_layer2_config(payment);
    if (l2_options) {
        const l2_arr = [],
            is_request = request.isrequest,
            req_l2_arr = request.eth_l2s,
            req_l2_3 = req_l2_arr.slice(0, 3); // allow 3 l2's max
        $.each(l2_options, function(l2, l2_dat) {
            const set_select = is_request ? false : (l2_dat.selected === false) ? false : !empty_obj(l2_dat),
                index = idx_array.indexOf(l2),
                inarr = ($.inArray(index, req_l2_3) > -1),
                selected = set_select || inarr;
            if (selected) {
                l2_arr.push(index);
                const sn = socket_node || get_network_node_config(payment, l2, l2_dat, "websockets");
                setup_layer2_monitoring(l2, sn, address, ctracts);
            }
        });
        if (l2_arr.length) { // layer 2
            if (!is_request) {
                // attach eth l2's to request object
                request.eth_l2s = l2_arr;
            }
        }
    }
}

// Sets up Layer 2 blockchain scanning for given address and contract
function setup_layer2_monitoring(l2, sn, address, ctracts, retry) {
    const layer2 = l2 || q_obj(sn, "network");
    if (layer2) {
        const socket_node = sn || q_obj(get_erc20_settings(), "layer2.options." + layer2 + ".websockets.selected");
        if (socket_node) {
            const contract = ctracts ? ctracts[layer2] : false,
                node_name = socket_node.name,
                ping_id = sha_sub(socket_node.url + layer2, 15);
            socket_info(socket_node, true);
            glob_let.socket_attempt[ping_id] = true;
            //start_layer2_scan(socket_node, contract, ping_id, "init"); // initial scan
            if (ctracts && node_name === "infura") {
                web3_erc20_websocket(socket_node, address, contract, ping_id);
                return
            }
            start_layer2_scan(socket_node, contract, ping_id, retry);
        }
    }
}

// Starts Layer 2 blockchain scanning with configurable interval
function start_layer2_scan(socket_node, contract, ping_id, retry) {
    const timeout = 7000;
    if (socket_node) {
        const rdo = create_layer2_request(timeout, "scanning", contract, ping_id);
        if (!rdo) return
        if (retry) {
            stop_monitors(ping_id);
            execute_layer2_scan(rdo, socket_node);
            if (retry === "init") {
                return
            }
        }
        glob_let.pinging[ping_id] = setInterval(function() {
            try {
                execute_layer2_scan(rdo, socket_node);
            } catch (err) {
                console.error("error", err);
                stop_background_monitors(ping_id);
            }
        }, timeout);
        return
    }
    notify(tl("websocketoffline"), 500000, "yes");
}

// Initiates polling-based Layer 2 blockchain monitoring
function start_layer2_polling(api_data, contract) {
    if (api_data) {
        const rdo = create_layer2_request(30000, "polling", contract);
        if (!rdo) return
        execute_layer2_scan(rdo, api_data);
        return
    }
    notify(tl("websocketoffline"), 500000, "yes");
}

// Executes Layer 2 scanning operation with provided config
function execute_layer2_scan(rdo, api_data) {
    if (api_data) {
        const contract = rdo.contract,
            dat = {
                "rd": request,
                contract,
                api_data,
                rdo
            };
        route_layer2_operation(dat);
    }
}

// ** Network Operations: **

// Routes operations to specific Layer 2 network handlers
function route_layer2_operation(dat, network) {
    if (dat) {
        const url = q_obj(dat, "api_data.url");
        if (url) {
            const rq_id = q_obj(dat, "rd.requestid") || "",
                l2 = network || q_obj(dat, "api_data.network");
            glob_let.rpc_attempts[sha_sub(rq_id + url + l2, 15)] = true;
            if (l2 === "arbitrum one") {
                arbitrum_apis(dat);
            } else if (l2 === "polygon pos") {
                polygon_apis(dat);
            } else if (l2 === "binance smart chain") {
                bnb_apis(dat);
            } else if (l2 === "base") {
                base_apis(dat);
            }
            const source = q_obj(dat, "rdo.source");
            if (source === "addr_polling") {
                initialize_network_status(dat.api_data, true);
            }
            return
        }
    }
    console.error("error", "missing api data");
}

// Manages Arbitrum network API interactions
function arbitrum_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "etherscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract, 42161);
    } else if (api_name === "infura") {
        infura_txd_rpc(dat.rd, dat.api_data, dat.rdo, dat.contract, 42161);
    } else { // alchemy
        initialize_alchemy_scan(dat.rd, dat.api_data, dat.rdo, dat.contract);
    }
}

// Manages Polygon network API interactions
function polygon_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "etherscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract, 137);
    } else if (api_name === "infura") {
        infura_txd_rpc(dat.rd, dat.api_data, dat.rdo, dat.contract, 137);
    } else { // alchemy
        initialize_alchemy_scan(dat.rd, dat.api_data, dat.rdo, dat.contract);
    }
}

// Manages BNB Chain API interactions
function bnb_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "binplorer") {
        process_ethereum_transactions(dat.rd, dat.api_data, dat.rdo);
    } else if (api_name === "etherscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract, 56);
    } else if (api_name === "infura") {
        infura_txd_rpc(dat.rd, dat.api_data, dat.rdo, dat.contract, 56);
    }
}

// Manages Base network API interactions
function base_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "etherscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract, 8453);
    } else { // alchemy
        initialize_alchemy_scan(dat.rd, dat.api_data, dat.rdo, dat.contract);
    }
}

// ** API Request Handling: **

// Routes Layer 2 API queries based on pending status
function route_layer2_api_request(rd, rdo, api_dat) {
    const source = rdo.source,
        overflow_limit = (source === "addr_polling") ? 150 : 10;
    if (block_overflow("l2", overflow_limit)) return false // prevent overflow
    const network = rd.eth_layer2;
    init_fetch_l2_contracts({ // route to fetch contracts
        "currency": rd.payment,
        "name": "route_layer2_api_request_contracts",
        "params": {
            rd,
            rdo,
            api_dat,
            network
        }
    });
}

// route_layer2_api_request with contracts
function route_layer2_api_request_contracts(params, token_contracts) {
    const {
        rd,
        rdo,
        api_dat,
        network
    } = params;
    if (rdo.pending === "polling" && network) {
        poll_layer2_network(rd, rdo, api_dat, network, token_contracts);
        return
    }
    scan_layer2_networks(rd, rdo, api_dat, network, token_contracts);
}

// Scans Layer 2 networks for transaction data
function scan_layer2_networks(rd, rdo, api_dat, network, ctracts) {
    glob_let.l2_fetched = {};
    const req_l2_arr = rd.eth_l2s,
        req_l2_3 = req_l2_arr.slice(0, 3); // allow 3 l2's max
    if (empty_obj(req_l2_3)) { // No l2's
        finalize_request_state(rdo);
        return
    }
    const currency = rd.payment,
        set_l2_options = get_layer2_config(currency),
        static_l2_options = q_obj(get_erc20_settings(), "layer2.options"),
        l2_options = set_l2_options || static_l2_options;
    if (network) { // l2 network is known so only scan this network
        const api_data = api_dat || get_network_node_config(currency, network, l2_options[network], "apis");
        if (api_data) {
            const contract = ctracts[network],
                dat = {
                    contract,
                    rd,
                    api_data,
                    rdo
                };
            route_layer2_operation(dat, network);
        }
        return
    }
    if (api_dat) { // apidata is known so it's a second api attempt
        const nw = api_dat.network,
            contract = ctracts[nw],
            api_data = api_dat,
            dat = {
                contract,
                rd,
                api_data,
                rdo
            };
        route_layer2_operation(dat, nw);
        return
    }
    const requestid = rd.requestid,
        static_array = Object.keys(static_l2_options),
        set_array = Object.keys(set_l2_options),
        l2_length = set_array.length,
        add_delay = 2000,
        fetch_match = (requestid && glob_let.l2_fetched.id === requestid);
    let index = 0,
        delay = 0;
    req_l2_3.forEach(function(i) {
        setTimeout(function() {
            if (fetch_match) { // Stop scanning for other networks if tx is found
            } else {
                const l2 = static_array[i],
                    ss_val = static_l2_options[l2],
                    ss_select = q_obj(ss_val, "apis.selected"),
                    sa_key = set_array[i],
                    l2_dat = set_l2_options[sa_key],
                    appdt = get_network_node_config(currency, l2, l2_dat, "apis"),
                    api_data = api_dat || appdt || ss_select;
                if (api_data) {
                    const contract = ctracts[l2],
                        dat = {
                            contract,
                            rd,
                            api_data,
                            rdo
                        };
                    route_layer2_operation(dat, l2);
                }
            }
            index++;
            if (index === l2_length) {
                // Detect when scanning is finished
                const timeout = setTimeout(function() {
                    if (fetch_match) { // Process tx if found
                        rd.eth_layer2 = glob_let.l2_fetched.l2;
                        validate_payment_amounts(rd, rdo);
                        glob_let.l2_fetched = {};
                    } else { // Move to next request
                        finalize_request_state(rdo);
                    }
                }, add_delay, function() {
                    clearTimeout(timeout);
                });
            }
        }, delay * add_delay);
        delay++;
    });
}

// Polls specific Layer 2 network API for updates
function poll_layer2_network(rd, rdo, api_dat, l2, ctracts) {
    const currency = rd.payment,
        set_l2_options = get_layer2_config(currency),
        static_l2_options = q_obj(get_erc20_settings(), "layer2.options"),
        l2_options = set_l2_options || static_l2_options,
        api_data = api_dat || get_network_node_config(currency, l2, l2_options[l2], "apis"),
        api_name = api_data.name,
        network = api_data.network;
    if (api_name && network) {
        const contract = ctracts[network],
            dat = {
                contract,
                rd,
                api_data,
                rdo
            };
        route_layer2_operation(dat, network);
    }
}

// ** Settings Management: **

// Initiates Layer 2 settings UI interaction
function edit_l2_init() {
    $(document).on("click", ".cc_settinglist li[data-id='layer2']", function() {
        const currency = $(this).children(".liwrap").attr("data-currency");
        init_fetch_l2_contracts({ // route to fetch contracts
            currency,
            "name": "edit_l2"
        });
    })
}

// Handles Layer 2 settings UI interaction
function edit_l2(callback, l2_contacts) {
    if (!(has_contracts(l2_contacts))) {
        play_audio("funk");
        return
    }
    const thiscurrency = callback.currency,
        l2_options = get_layer2_config(thiscurrency),
        eth_settings = get_coinsettings(thiscurrency),
        eth_l2_settings = q_obj(eth_settings, "layer2.options"),
        sw = callback.switch,
        sw_class = sw ? "hide_l2ab" : "show_l2ab";
    if (l2_options) {
        const networks = sw ? [] : [{
            "span": {
                "class": "optionwrap",
                "data-pe": "none",
                "content": "<img src='" + fetch_aws("ethereum") + ".png' class='icon'/>ethereum"
            }
        }];
        const apibox = [];
        let selected_network = "ethereum";
        $.each(eth_l2_settings, function(l2, l2_dat) {
            if (l2_contacts.hasOwnProperty(l2)) {
                const select = l2_options[l2];
                if (select) {
                    const nw_selected = !empty_obj(select) && (select.selected !== false),
                        l2_class = l2.replace(/ /g, "-"),
                        s_boxes = [{
                            "h2": {
                                "class": "linkcolor l2_services " + l2_class,
                                "content": tl("choose") + " " + l2 + " " + tl("layer2") + " API"
                            }
                        }];
                    if (nw_selected) {
                        selected_network = l2;
                    }
                    $.each(l2_dat, function(k, v) {
                        if (k === "selected") return
                        const selected = v.selected,
                            apis = v.apis,
                            select_name = k === "apis" ? select.apis : select.websockets,
                            select_val = q_obj(select_name, "selected.name") || select_name || selected.name,
                            api_push = [];
                        $.each(apis, function(i, v2) {
                            const node_name = v2.name,
                                node_icon_url = get_node_icon(node_name),
                                node_icon = (node_icon_url) ? "<img src='" + fetch_aws(node_icon_url) + ".png' class='icon'/>" : "";
                            api_push.push({
                                "span": {
                                    "class": "optionwrap",
                                    "data-pe": "none",
                                    "attr": add_prefix_to_keys(v2),
                                    "content": node_icon + node_name
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
                                                        "value": select_val,
                                                        "placeholder": tl("layer2"),
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
                                                    "content": api_push
                                                }
                                            }
                                        ]
                                    }
                                }]
                            }
                        });
                    });
                    const l2_contents = "<img src='" + fetch_aws(l2_class) + ".png' class='icon'/>" + l2,
                        toggle = nw_selected ? "show_abi " : "";
                    networks.push({
                        "span": {
                            "class": "optionwrap",
                            "data-pe": "none",
                            "content": l2_contents
                        }
                    });
                    apibox.push({
                        "div": {
                            "class": "apibox_item " + toggle + l2_class,
                            "content": s_boxes
                        }
                    });
                }
            }
        });
        const ddat = [{
                "div": {
                    "class": "popform",
                    "content": [{
                            "div": {
                                "id": "l2select",
                                "class": "selectbox",
                                "content": [{
                                        "input": {
                                            "attr": {
                                                "type": "text",
                                                "value": selected_network,
                                                "placeholder": tl("choose") + " " + tl("layer2"),
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
                                            "content": networks
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "div": {
                                "id": "l2_apibox",
                                "attr": {
                                    "data-val": selected_network
                                },
                                "class": sw_class,
                                "content": apibox
                            }
                        },
                        {
                            "input": {
                                "class": "submit",
                                "attr": {
                                    "type": "submit",
                                    "value": tl("okbttn"),
                                    "data-currency": thiscurrency
                                }
                            }
                        }
                    ]
                }
            }],
            content = template_dialog({
                "id": "l2_formbox",
                "icon": "icon-new-tab",
                "title": thiscurrency + " " + tl("layer2"),
                "elements": ddat
            });
        popdialog(content, "triggersubmit");
    }
}

function has_contracts(obj) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        return false;
    }
    const keys = Object.keys(obj);
    return keys.length >= 2;
}

// Updates UI elements based on selected l2 network
function pick_l2_select() {
    $(document).on("mousedown", "#l2select > .options span", function() {
        const select = $(this),
            val = select.text(),
            form = select.closest("#l2_formbox"),
            l2_apibox = form.find("#l2_apibox");
        if (val === "ethereum") {
            l2_apibox.hide(); // Or slideUp(150) for a consistent animation feel.
            return
        }
        const val_class = val.replace(/ /g, "-"),
            item_to_show = l2_apibox.find("." + val_class);
        item_to_show.show().siblings(".apibox_item").hide();
        l2_apibox.show();
    });
}

// Toggles l2 network services
function toggle_l2_services() {
    $(document).on("click", "#l2_apibox > .apibox_item .l2_services", function() {
        const this_node = $(this),
            apibox_item = this_node.closest(".apibox_item"),
            l2_apis = apibox_item.find(".l2_apis");
        if (l2_apis.is(":visible")) {
            l2_apis.hide();
            return
        }
        l2_apis.show();
    });
}

// Processes Layer 2 settings form submission
function save_layer2_settings() {
    $(document).on("click", "#l2_formbox input.submit", function(e) {
        e.preventDefault();
        const this_network = $("#l2select > input").val(),
            eth_l2s = glob_const.eth_l2s,
            l2_reset = clone(eth_l2s), // make a deep clone to prevent duplicates
            payment = $(this).attr("data-currency"),
            csnode = cs_node(payment, "layer2"),
            options = l2_reset;
        if (this_network === "ethereum" || !csnode) { // keep reset
        } else {
            const l2_class = this_network.replace(/ /g, "-"),
                apibox_item = $("#l2_apibox .apibox_item." + l2_class);
            if (apibox_item.length) {
                const l2_apis = apibox_item.find(".l2_apis");
                if (l2_apis.length) {
                    l2_type_obj = {};
                    l2_apis.each(function() {
                        const this_nw = $(this),
                            input = this_nw.find(".selectbox > input"),
                            input_data = input.val();
                        if (input_data) {
                            const this_type = this_nw.data("type");
                            l2_type_obj[this_type] = input_data;
                        }
                    });
                    options[this_network] = l2_type_obj;
                }
            }
        }
        const open_request = (is_openrequest() === true && request),
            nochanges = (open_request && ($("#l2_apibox").data("val") === this_network));
        if (nochanges) {
            canceldialog();
            return
        }
        csnode.data({
            "options": options,
            "selected": {
                "name": this_network
            }
        }).find("p").text(this_network);
        canceldialog();
        notify(tl("datasaved"));
        save_cc_settings(payment, true);
        if (open_request) {
            cancel_paymentdialog();
        }
    })
}

// ** Configuration Helpers: **

// Compresses Layer 2 configuration object
function compress_layer2_config(currency) {
    // Initialize the result object with the base structure
    const eth_settings = clone(get_coinsettings(currency)), // make a deep clone to prevent duplicates
        result = {
            "icon": "new-tab",
            "selected": false,
            "options": glob_const.eth_l2s
        };
    eth_settings.layer2 = result;
    return eth_settings;
}

// Retrieves Layer 2 configuration for currency
function get_layer2_config(currency) {
    const l2_setting = cs_node(currency, "layer2", true);
    return q_obj(l2_setting, "options");
}

// Retrieves node configuration for specified network
function get_network_node_config(payment, network, l2_dat, type) {
    const selected = q_obj(l2_dat, type);
    if (selected) {
        const eth_settings = get_coinsettings(payment),
            eth_l2_settings = q_obj(eth_settings, "layer2.options." + network + "." + type + ".apis");
        if (eth_l2_settings) {
            return objectkey_from_array(eth_l2_settings, "name", selected);
        }
    }
    return false
}

// Get indexes of non empty objects
function get_set_l2s(obj, currency) {
    const has_settings = br_get_local(currency + "_settings", true);
    if (!has_settings) return [];
    const object_values = Object.values(obj),
        non_empty_indexes = [];
    object_values.forEach((value, index) => {
        // Check if the current value is an object and if it has more than 0 keys
        if (typeof value === "object" && value !== null && Object.keys(value).length > 0) {
            non_empty_indexes.push(index);
        }
    });
    return non_empty_indexes;
}

// ** Fetch contracts: **

// Initiates Layer 2 settings UI interaction
function init_fetch_l2_contracts(callback) {
    const currency = callback.currency,
        l2_contacts = br_get_local("eth_l2_contracts", true);
    if (l2_contacts) {
        const currency_contracts = objectkey_from_array(l2_contacts, "currency", currency);
        if (currency_contracts) {
            const timestamp = currency_contracts.timestamp, // check if it is expired
                cache_age = now_utc() - timestamp,
                expired = cache_age > 604800000; // cache one week
            if (expired) { // refresh contract
                fetch_l2_contracts(currency, l2_contacts, callback);
                return
            }
            const contracts = currency_contracts.contracts;
            if (!empty_obj(contracts)) {
                fetch_contracts_callback(callback, contracts);
                return
            }
        }
        fetch_l2_contracts(currency, l2_contacts, callback);
        return
    }
    fetch_l2_contracts(currency, null, callback);
}

// Fetch l2 contracts from coingecko
function fetch_l2_contracts(currency, l2_contacts, callback) {
    loader();
    set_loader_text("fetching l2 contracts");
    const coin_conf = get_coin_config(currency);
    if (coin_conf) {
        const cmcid = coin_conf.cmcid;
        if (cmcid) {
            const contracts = {};
            api_proxy({
                "api": "coinmarketcap",
                "search": "v2/cryptocurrency/info?id=" + cmcid,
                "cachetime": 604000,
                "cachefolder": "1w",
                "proxy": true,
                "params": {
                    "method": "GET"
                }
            }).done(function(resp) {
                const data = br_result(resp).result,
                    platforms = q_obj(data, "data." + cmcid + ".contract_address");
                if (platforms) {
                    $.each(platforms, function(k, v) {
                        const platform_name = v?.platform?.name;
                        if (platform_name) {
                            const contract = v.contract_address;
                            if (contract) {
                                if (platform_name === "Ethereum") {
                                    contracts["main"] = contract;
                                }
                                if (platform_name === "Arbitrum") {
                                    contracts["arbitrum one"] = contract;
                                }
                                if (platform_name === "Polygon") {
                                    contracts["polygon pos"] = contract;
                                }
                                if (platform_name === "BNB Smart Chain (BEP20)") {
                                    contracts["binance smart chain"] = contract;
                                }
                                if (platform_name === "Base") {
                                    contracts["base"] = contract;
                                }
                            }
                        }
                    });
                }
            }).always(function() {
                construct_l2_contracts(currency, l2_contacts, contracts, callback);
                closeloader();
            });
            return
        }
    }
    play_audio("funk");
}

// Construct l2 contracts
function construct_l2_contracts(currency, l2_contacts, contracts, callback) {
    const timestamp = now_utc(),
        contract_array = (l2_contacts && l2_contacts.length > 25) ? [] : l2_contacts || [], // Restrict contract data size
        contract_item = {
            currency,
            timestamp,
            contracts
        },
        new_contract_array = merge_by_key(contract_array, contract_item, "currency");
    br_set_local("eth_l2_contracts", new_contract_array, true);
    if (!empty_obj(contracts)) {
        fetch_contracts_callback(callback, contracts);
        return
    }
    notify("no l2 contracts found");
    play_audio("funk");
}

// Fetch l2 contracts from localstorage
function fetch_localstorage_contracts(currency) {
    const l2_contacts = br_get_local("eth_l2_contracts", true);
    if (l2_contacts && currency) {
        return objectkey_from_array(l2_contacts, "currency", currency);
    }
    return false;
}

// Callback functions after fetching L2 contracts
function fetch_contracts_callback(callback, contracts) {
    const cb_name = callback.name;
    if (cb_name === "set_l2_contract") {
        continue_request(contracts);
        return
    }
    if (cb_name === "edit_l2") {
        edit_l2(callback, contracts);
        return
    }
    if (cb_name === "init_eth_sockets") {
        init_eth_sockets(callback.params, contracts);
        return
    }
    if (cb_name === "route_layer2_api_request_contracts") {
        route_layer2_api_request_contracts(callback.params, contracts);
        return
    }
    if (cb_name === "monitor_l2_contracts") {
        monitor_l2_contracts(callback.params, contracts);
        return
    }
}

// ** Status Management: **

// Initializes Layer 2 network status display
function initialize_network_status(sn, stat) {
    if (!sn) {
        return
    }
    if (stat === "paid") {
        const timeout = setTimeout(function() {
            glob_let.l2s = {};
            update_network_status(sn, stat);
        }, 1000, function() {
            clearTimeout(timeout);
        });
        return
    }
    update_network_status(sn, stat);
}

// Updates Layer 2 network status display
function update_network_status(sn, stat) {
    const networks = $("#paymentdialogbox .networks"),
        nw_chain = request.chainid,
        dim_class = nw_chain ? "" : " dim",
        network = sn.network,
        l2_object = glob_let.l2s,
        status = stat ? "online" : "offline",
        title1 = "#" + sn.url,
        val = status + title1,
        l2_length = Object.keys(l2_object).length,
        l2_pref = (l2_length > 1) ? "L2's:" : "L2:";
    l2_object[network] = val;
    let nw_li = "<li>" + l2_pref + "</i>",
        empty = true,
        offline_count = 0,
        all_l2s = glob_const.eth_l2s,
        all_contracts = request?.token_l2_contracts;
    $.each(glob_let.l2s, function(l2, l2_dat) {
        empty = false;
        const nw_select = l2_dat.split("#"),
            st = nw_select[0],
            stt = " " + st,
            anim = (stat === "paid") ? " blob" : "",
            title = nw_select[1],
            nw_name = l2,
            chainid = all_l2s[l2],
            l2_contract = all_contracts ? all_contracts[l2] : false,
            l2c_str = l2_contract || "nocontract",
            select_class = (nw_chain === chainid) ? " nw_select" : "";
        nw_li += "<li class='nwl2" + stt + anim + select_class + dim_class + "' title='" + title + "' data-chainid='" + chainid + "' data-contract='" + l2_contract + "'>" + nw_name + "</li>";
        if (st === "offline") {
            offline_count++
        }
    });
    if (!empty) {
        networks.html("<ul>" + nw_li + "</ul>");
        if (glob_const.paymentdialogbox.hasClass("transacting")) return
        if (helper) {
            const l2_status = offline_count < l2_length;
            helper.l2_status = l2_status;
            if (l2_status === false && helper.l1_status === false) {
                glob_const.paymentpopup.removeClass("live");
            }
        }
    }
}

// Creates Layer 2 request data object
function create_layer2_request(timeout, pending, contract, ping_id) {
    if (!request) return false
    const rq_init = request.rq_init,
        request_ts = rq_init - 15000, // 15 second margin
        set_confirmations = request.set_confirmations || 0,
        cachetime = (timeout - 1000) / 1000,
        source = "l2_" + pending;
    return {
        "requestid": request.requestid,
        "request_timestamp": request_ts,
        "setconfirmations": set_confirmations,
        "erc20": request.erc20,
        source,
        pending,
        contract,
        cachetime,
        ping_id
    };
}

// Switch l2
function switch_l2() {
    $(document).on("click", ".nwl2", function() {
        const this_node = $(this);
        if (this_node.hasClass("offline")) {
            play_audio("funk");
            return
        }
        const chain_contract = this_node.data("contract");
        if (chain_contract === "nocontract") {
            play_audio("funk");
            return
        }
        const chain_id = this_node.data("chainid"),
            all_l2s = $(".nwl2"),
            all_this = $(".nwl2[data-chainid='" + chain_id + "']"),
            cc_value = $("#paymentdialogbox .ccpool").attr("data-value");
        all_l2s.removeClass("nw_select dim");
        all_this.addClass("nw_select");
        if ((chain_contract === request.token_l2_contract) && (chain_id === request.chainid)) {
            all_this.addClass("dim");
            request.token_l2_contract = false;
            request.chainid = false;
        } else {
            all_this.removeClass("dim");
            request.token_l2_contract = chain_contract;
            request.chainid = chain_id;
        }
        generate_payment_qr(request.payment, request.address, cc_value);
    });
}

// Pick l2
function pick_l2() {
    $(document).on("dblclick contextmenu", ".nwl2", function(e) {
        e.preventDefault();
        if (request.isrequest) return
        const currency = request.payment;
        init_fetch_l2_contracts({ // route to fetch contracts
            currency,
            "name": "edit_l2",
            "switch": true
        });
    });
}