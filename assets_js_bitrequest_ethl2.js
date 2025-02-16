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

    // ** API Request Handling: **
    //route_layer2_api_request
    //scan_layer2_networks
    //poll_layer2_network

    // ** Settings Management: **
    edit_l2();
    toggle_network_panel();
    toggle_network_status();
    save_layer2_settings();

    // ** Configuration Helpers: **
    //compress_layer2_config
    //get_layer2_config
    //find_network_index
    //get_network_node_config

    // ** Status Management: **
    //initialize_network_status
    //update_network_status
    //create_layer2_request
});

// ** Core L2 Management: **

// Initializes Layer 2 socket connections for Ethereum and ERC20 token transactions
function initialize_layer2_connections(payment, address, ct, socket_node) {
    const l2_options = get_layer2_config(payment);
    if (l2_options) {
        const ctracts = ct || contracts(request.currencysymbol),
            l2_arr = [],
            is_request = request.isrequest,
            req_l2_arr = request.eth_l2s;
        let index = 0;
        $.each(l2_options, function(l2, l2_dat) {
            const set_select = is_request ? false : !empty_obj(l2_dat),
                inarr = $.inArray(index, req_l2_arr) !== -1,
                selected = set_select || inarr;
            if (selected) {
                l2_arr.push(index);
                const sn = socket_node || get_network_node_config(payment, l2, l2_dat, "websockets");
                setup_layer2_monitoring(sn, address, ctracts);
            }
            index++;
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
function setup_layer2_monitoring(socket_node, address, ctracts, retry) {
    const l2 = q_obj(socket_node, "network");
    if (l2) {
        const contract = ctracts ? ctracts[l2] : false;
        socket_info(socket_node, true);
        const node_name = socket_node.name,
            ping_id = sha_sub(socket_node.url + l2, 15);
        glob_let.socket_attempt[ping_id] = true;
        if (node_name === "infura") {
            web3_erc20_websocket(socket_node, address, contract, ping_id);
            return
        }
        start_layer2_scan(socket_node, contract, ping_id, retry);
        return
    }
}

// Starts Layer 2 blockchain scanning with configurable interval
function start_layer2_scan(socket_node, contract, ping_id, retry) {
    const timeout = 7000;
    if (socket_node) {
        const rdo = create_layer2_request(timeout, "scanning", contract, ping_id);
        if (!rdo) return false;
        if (retry) {
            stop_monitors(ping_id);
            execute_layer2_scan(rdo, socket_node);
        }
        glob_let.pinging[ping_id] = setInterval(function() {
            execute_layer2_scan(rdo, socket_node);
        }, timeout);
        return
    }
    notify(tl("websocketoffline"), 500000, "yes");
}

// Initiates polling-based Layer 2 blockchain monitoring
function start_layer2_polling(api_data, contract) {
    if (api_data) {
        const rdo = create_layer2_request(30000, "polling", contract);
        if (!rdo) return false;
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
            if (l2 === "arbitrum") {
                arbitrum_apis(dat);
            } else if (l2 === "polygon") {
                polygon_apis(dat);
            } else if (l2 === "bnb") {
                bnb_apis(dat);
            }
            return
        }
    }
    console.error("error", "missing api data");
}

// Manages Arbitrum network API interactions
function arbitrum_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "arbiscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract);
    } else if (api_name === "etherscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract, 42161);
    } else if (api_name === "infura") {
        infura_txd_rpc(dat.rd, dat.api_data, dat.rdo, dat.contract, 42161);
    }
}

// Manages Polygon network API interactions
function polygon_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "polygonscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract);
    } else if (api_name === "etherscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract, 137);
    } else if (api_name === "infura") {
        infura_txd_rpc(dat.rd, dat.api_data, dat.rdo, dat.contract, 137);
    }
}

// Manages BNB Chain API interactions
function bnb_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "bscscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract);
    } else if (api_name === "binplorer") {
        process_ethereum_transactions(dat.rd, dat.api_data, dat.rdo);
    } else if (api_name === "etherscan") {
        scan_layer2_transactions(dat.rd, dat.api_data, dat.rdo, dat.contract, 56);
    } else if (api_name === "infura") {
        infura_txd_rpc(dat.rd, dat.api_data, dat.rdo, dat.contract, 56);
    }
}

// ** API Request Handling: **

// Routes Layer 2 API queries based on pending status
function route_layer2_api_request(rd, rdo, api_dat, l2) {
    const network = rd.eth_layer2 || l2;
    if (rdo.pending === "polling" && network) {
        poll_layer2_network(rd, rdo, api_dat, network);
        return
    }
    scan_layer2_networks(rd, rdo, api_dat, network);
}

// Scans Layer 2 networks for transaction data
function scan_layer2_networks(rd, rdo, api_dat, network) {
    glob_let.l2_fetched = {};
    const req_l2_arr = rd.eth_l2s;
    if (empty_obj(req_l2_arr)) { // No l2's
        finalize_request_state(rdo);
        return
    }
    const currency = rd.payment,
        l2_options = get_layer2_config(currency);
    if (l2_options) {
        const ctracts = contracts(rd.currencysymbol);
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
        // scan all supported l2 networks
        const requestid = rd.requestid,
            l2_length = Object.keys(l2_options).length,
            add_delay = 2000;
        let index = 0,
            delay = 0;
        $.each(l2_options, function(l2, l2_dat) {
            setTimeout(function() {
                if (glob_let.l2_fetched.id === requestid) { // Stop scanning for other networks if tx is found
                } else {
                    const inarr = $.inArray(index, req_l2_arr) !== -1;
                    if (inarr) {
                        const api_data = api_dat || get_network_node_config(currency, l2, l2_dat, "apis");
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
                }
                index++;
                if (index === l2_length) {
                    // Detect when scanning is finished
                    const timeout = setTimeout(function() {
                        if (glob_let.l2_fetched.id === requestid) { // Process tx if found
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
}

// Polls specific Layer 2 network API for updates
function poll_layer2_network(rd, rdo, api_dat, l2) {
    const l2_options = get_layer2_config(rd.payment),
        api_data = api_dat || get_network_node_config(rd.payment, l2, l2_options[l2], "apis"),
        api_name = api_data.name,
        network = api_data.network;
    if (api_name && network) {
        const ccsymbol = rd.currencysymbol,
            ctracts = contracts(ccsymbol),
            contract = ctracts[network],
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

// Handles Layer 2 settings UI interaction
function edit_l2() {
    $(document).on("click", ".cc_settinglist li[data-id='layer2']", function() {
        const thiscurrency = $(this).children(".liwrap").attr("data-currency");
        let l2_options = get_layer2_config(thiscurrency);
        const old_format = q_obj(l2_options, "arbitrum.selected") !== undefined; // look for uncompressed l2 format
        if (old_format) {
            l2_options = q_obj(compress_layer2_config(thiscurrency), "layer2.options"); // convert to compressed l2 format
            const csnode = cs_node(thiscurrency, "layer2"); // update l2 settings li data
            csnode.data("options", l2_options);
        }
        const eth_settings = get_coinsettings(thiscurrency),
            eth_l2_settings = q_obj(eth_settings, "layer2.options");
        if (l2_options) {
            const ccsymbol = fetch_symbol(thiscurrency),
                symbol = ccsymbol.symbol,
                ctracts = contracts(symbol),
                arb_contract = ctracts.arbitrum,
                polygon_contract = ctracts.polygon,
                bnb_contract = ctracts.bnb,
                networks = [];
            $.each(eth_l2_settings, function(l2, l2_dat) {
                if (l2_options.hasOwnProperty(l2)) {
                    const nw_name = l2 === "bnb" ? "bnb smart chain" : l2,
                        select = l2_options[l2],
                        nw_selected = !empty_obj(select),
                        s_boxes = [];

                    $.each(l2_dat, function(k, v) {
                        const selected = v.selected
                        if (k === "selected") return;
                        const apis = v.apis,
                            select_name = k === "apis" ? select.apis : select.websockets,
                            select_val = select_name || selected.name,
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
                                                    "class": "options single",
                                                    "content": api_push
                                                }
                                            }
                                        ]
                                    }
                                }]
                            }
                        });
                    });
                    networks.push({
                        "div": {
                            "class": "nw2box",
                            "attr": {
                                "data-network": l2
                            },
                            "content": [{
                                "h2": {
                                    "class": "nwheading",
                                    "content": nw_name + switch_panel(nw_selected, " custom")
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
                        "value": tl("okbttn"),
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
                    "title": tl("layer2"),
                    "elements": ddat
                });
            popdialog(content, "triggersubmit");
        }
    })
}

// Controls Layer 2 network panel visibility
function toggle_network_panel() {
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

// Manages Layer 2 network enable/disable switching
function toggle_network_status() {
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

// Processes Layer 2 settings form submission
function save_layer2_settings() {
    $(document).on("click", "#l2_formbox input.submit", function(e) {
        e.preventDefault();
        const payment = $(this).attr("data-currency"),
            csnode = cs_node(payment, "layer2");
        if (csnode) {
            const options = csnode.data("options"),
                nw2box = $("#l2_formbox").find(".popform > .nw2box");
            nw2box.each(function() {
                const l2_type_obj = {},
                    this_box = $(this),
                    this_network = this_box.data("network"),
                    this_switch = this_box.find(".switchpanel"),
                    l2_apis = this_box.find(".l2_apis"),
                    select = this_switch.hasClass("true");
                l2_apis.each(function() {
                    const this_nw = $(this),
                        input = this_nw.find(".selectbox > input"),
                        input_data = input.val();
                    if (input_data) {
                        const this_type = this_nw.data("type");
                        l2_type_obj[this_type] = input_data;
                    }
                });
                options[this_network] = select ? l2_type_obj : {};
            });
            csnode.data("options", options).find("p").html("");
            canceldialog();
            notify(tl("datasaved"));
            save_cc_settings(payment, true);
        }
    })
}

// ** Configuration Helpers: **

// Compresses Layer 2 configuration object
function compress_layer2_config(currency, ccsymbol) {
    // Initialize the result object with the base structure
    const eth_settings = JSON.parse(JSON.stringify(get_coinsettings(currency))), // make a deep clone to prevent duplicates
        cc_symbol = ccsymbol || q_obj(fetch_symbol(currency), "symbol"),
        symbol = cc_symbol || "eth",
        l2_settings = eth_settings.layer2,
        ctracts = contracts(symbol),
        result = {
            "icon": "new-tab",
            "selected": false,
            "options": {}
        };
    // Get all networks from options
    const networks = Object.entries(l2_settings.options);

    // Filter and process only networks that have selected: true
    networks.forEach(([network_name, network_data]) => {
        if (ctracts[network_name] || currency === "ethereum") {
            // Initialize this network in result if it's selected
            result.options[network_name] = {};
        }
    });
    eth_settings.layer2 = result;
    return eth_settings;
}

// Retrieves Layer 2 configuration for currency
function get_layer2_config(currency) {
    const l2_setting = cs_node(currency, "layer2", true);
    return q_obj(l2_setting, "options");
}

// Finds index of Layer 2 network in settings
function find_network_index(l2_network) {
    const l2s = q_obj(get_erc20_settings(), "layer2.options"),
        networks = Object.keys(l2s);
    return networks.indexOf(l2_network) === -1 ? false : networks.indexOf(l2_network);
}

// Retrieves node configuration for specified network
function get_network_node_config(payment, network, l2_dat, type) {
    const selected = q_obj(l2_dat, type);
    if (selected) {
        const eth_settings = get_coinsettings(payment),
            eth_l2_settings = q_obj(eth_settings, "layer2.options." + network + "." + type + ".apis");
        if (eth_l2_settings) {
            return object_from_array(eth_l2_settings, "name", selected);
        }
    }
    return false;
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
    const network = sn.network,
        l2_object = glob_let.l2s,
        status = stat ? "online" : "offline",
        title1 = "#" + sn.url,
        val = status + title1,
        networks = $("#paymentdialogbox .networks"),
        l2_length = Object.keys(l2_object).length,
        l2_pref = (l2_length > 1) ? "L2's:" : "L2:";
    l2_object[network] = val;
    let nw_li = "<li>" + l2_pref + "</i>",
        empty = true,
        offline_count = 0;
    $.each(glob_let.l2s, function(l2, l2_dat) {
        empty = false;
        const nw_select = l2_dat.split("#"),
            st = nw_select[0],
            stt = " " + st,
            anim = (stat === "paid") ? " blob" : "",
            title = nw_select[1],
            nw_name = l2 === "bnb" ? "bnb smart chain" : l2;
        nw_li += "<li class='nwl2" + stt + anim + "' title='" + title + "'>" + nw_name + "</li>";
        if (st === "offline") {
            offline_count++
        }
    });
    if (!empty) {
        networks.html("<ul>" + nw_li + "</ul>");
        if (glob_const.paymentdialogbox.hasClass("transacting")) return;
        if (helper) {
            const l2_status = offline_count < l2_length;
            helper.l2_status = l2_status;
            if (l2_status === false && helper.l1_status === false) {
                glob_const.paymentpopup.removeClass("live");
                notify(tl("websocketoffline"), 500000, "yes");
            }
        }
    }
}

// Creates Layer 2 request data object
function create_layer2_request(timeout, pending, contract, ping_id) {
    if (!request) return false;
    const rq_init = request.rq_init,
        request_ts_utc = rq_init + glob_const.timezone,
        request_ts = request_ts_utc - 15000, // 15 second margin
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