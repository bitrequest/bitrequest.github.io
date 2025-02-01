$(document).ready(function() {

    // ** Sockets / Polling **

    //init_l2_sockets
    //init_layer2
    //omni_scan
    //omni_poll
    //scan_ethl2_socket

    // ** Monirors **

    //query_ethl2_api
    //scan_ethl2_api
    //poll_ethl2_api

    // ** L2 Networks **

    //ethl2_networks
    //arbitrum_apis
    //polygon_apis
    //bnb_apis

    // ** L2 Coinsettings **

    edit_l2();
    l2nw_toggle();
    l2nw_switch();
    submit_l2();

    // ** L2 Helpers **

    //compress_l2obj2
    //set_l2_status_init
    //set_l2_status
    //fertch_l2s
    //get_l2_node
    //omni_rdo

});

// ** Sockets / Polling **

// Init l2 eth and erc20
function init_l2_sockets(payment, address, ct, socket_node) {
    const l2_options = fertch_l2s(payment);
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
                const sn = socket_node || get_l2_node(payment, l2, l2_dat, "websockets");
                init_layer2(sn, address, ctracts);
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

// Init eth and erc20 L2 address scanning
function init_layer2(socket_node, address, ctracts, retry) {
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
        omni_scan(socket_node, contract, ping_id, retry);
        return
    }
    console.error("error", "missing api data");
}

// Initiates Eth layer2 scanning
function omni_scan(socket_node, contract, ping_id, retry) {
    const timeout = 7000;
    if (socket_node) {
        const rdo = omni_rdo(timeout, "scanning", contract, ping_id);
        if (!rdo) return false;
        if (retry) {
            clearpinging(ping_id);
            scan_ethl2_socket(rdo, socket_node);
        }
        glob_let.pinging[ping_id] = setInterval(function() {
            scan_ethl2_socket(rdo, socket_node);
        }, timeout);
        return
    }
    notify(translate("websocketoffline"), 500000, "yes");
}

// Initiates Eth layer2 polling
function omni_poll(api_data, contract) {
    if (api_data) {
        const rdo = omni_rdo(30000, "polling", contract);
        if (!rdo) return false;
        scan_ethl2_socket(rdo, api_data);
        return
    }
    notify(translate("websocketoffline"), 500000, "yes");
}

function scan_ethl2_socket(rdo, api_data) {
    if (api_data) {
        const contract = rdo.contract,
            dat = {
                "rd": request,
                contract,
                api_data,
                rdo
            };
        ethl2_networks(dat);
    }
}

// ** Monitors **

function query_ethl2_api(rd, rdo, api_dat, l2) {
    const network = rd.eth_layer2 || l2;
    if (rdo.pending === "polling" && network) {
        poll_ethl2_api(rd, rdo, api_dat, network);
        return
    }
    scan_ethl2_api(rd, rdo, api_dat, network);
}

function scan_ethl2_api(rd, rdo, api_dat, network) {
    glob_let.l2_fetched = {};
    const req_l2_arr = rd.eth_l2s;
    if (empty_obj(req_l2_arr)) { // No l2's
        api_callback(rdo);
        return
    }
    const currency = rd.payment,
        l2_options = fertch_l2s(currency);
    if (l2_options) {
        const ctracts = contracts(rd.currencysymbol);
        if (network) { // l2 network is known so only scan this network
            const api_data = api_dat || get_l2_node(currency, network, l2_options[network], "apis");
            if (api_data) {
                const contract = ctracts[network],
                    dat = {
                        contract,
                        rd,
                        api_data,
                        rdo
                    };
                ethl2_networks(dat, network);
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
                        const api_data = api_dat || get_l2_node(currency, l2, l2_dat, "apis");
                        if (api_data) {
                            const contract = ctracts[l2],
                                dat = {
                                    contract,
                                    rd,
                                    api_data,
                                    rdo
                                };
                            ethl2_networks(dat, l2);
                        }
                    }
                }
                index++;
                if (index === l2_length) {
                    // Detect when scanning is finished
                    const timeout = setTimeout(function() {
                        if (glob_let.l2_fetched.id === requestid) { // Process tx if found
                            rd.eth_layer2 = glob_let.l2_fetched.l2;
                            compareamounts(rd, rdo);
                            glob_let.l2_fetched = {};
                        } else { // Move to next request
                            api_callback(rdo);
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

function poll_ethl2_api(rd, rdo, api_dat, l2) {
    const l2_options = fertch_l2s(rd.payment),
        api_data = api_dat || get_l2_node(rd.payment, l2, l2_options[l2], "apis"),
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
        ethl2_networks(dat, network);
    }
}

// ** L2 Networks **

function ethl2_networks(dat, network) {
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

// Handles Arbitrum APIS
function arbitrum_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "arbiscan") {
        omniscan_fetch(dat.rd, dat.api_data, dat.rdo, dat.contract);
    } else if (api_name === "etherscan") {
        omniscan_fetch(dat.rd, dat.api_data, dat.rdo, dat.contract, 42161);
    } else if (api_name === "infura") {
        infura_txd_rpc(dat.rd, dat.api_data, dat.rdo, dat.contract, 42161);
    }
}

// Handles Polygon APIS
function polygon_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "polygonscan") {
        omniscan_fetch(dat.rd, dat.api_data, dat.rdo, dat.contract);
    } else if (api_name === "etherscan") {
        omniscan_fetch(dat.rd, dat.api_data, dat.rdo, dat.contract, 137);
    } else if (api_name === "infura") {
        infura_txd_rpc(dat.rd, dat.api_data, dat.rdo, dat.contract, 137);
    }
}

// Handles Binance smart chain APIS
function bnb_apis(dat) {
    const api_name = q_obj(dat, "api_data.name");
    if (api_name === "bscscan") {
        omniscan_fetch(dat.rd, dat.api_data, dat.rdo, dat.contract);
    } else if (api_name === "binplorer") {
        ethplorer_fetch(dat.rd, dat.api_data, dat.rdo);
    } else if (api_name === "etherscan") {
        omniscan_fetch(dat.rd, dat.api_data, dat.rdo, dat.contract, 56);
    } else if (api_name === "infura") {
        infura_txd_rpc(dat.rd, dat.api_data, dat.rdo, dat.contract, 56);
    }
}

// ** L2 Coinsettings **

// Function to handle editing of eth Layer 2 settings
function edit_l2() {
    $(document).on("click", ".cc_settinglist li[data-id='layer2']", function() {
        const thiscurrency = $(this).children(".liwrap").attr("data-currency");
        let l2_options = fertch_l2s(thiscurrency);
        const old_format = q_obj(l2_options, "arbitrum.selected") !== undefined; // look for uncompressed l2 format
        if (old_format) {
            l2_options = q_obj(compress_l2obj2(thiscurrency), "layer2.options"); // convert to compressed l2 format
            const csnode = cs_node(thiscurrency, "layer2"); // update l2 settings li data
            csnode.data("options", l2_options);
        }
        const eth_settings = getcoinsettings(thiscurrency),
            eth_l2_settings = q_obj(eth_settings, "layer2.options");
        if (l2_options) {
            const ccsymbol = fetchsymbol(thiscurrency),
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
            notify(translate("datasaved"));
            save_cc_settings(payment, true);
        }
    })
}

// ** L2 Helpers **

function compress_l2obj2(currency, ccsymbol) {
    // Initialize the result object with the base structure
    const eth_settings = JSON.parse(JSON.stringify(getcoinsettings(currency))), // make a deep clone to prevent duplicates
        cc_symbol = ccsymbol || q_obj(fetchsymbol(currency), "symbol"),
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

// Init l2 status
function set_l2_status_init(sn, stat) {
    if (!sn) {
        return
    }
    if (stat === "paid") {
        const timeout = setTimeout(function() {
            glob_let.l2s = {};
            set_l2_status(sn, stat);
        }, 1000, function() {
            clearTimeout(timeout);
        });
        return
    }
    set_l2_status(sn, stat);
}

// Set and dislay l2 status
function set_l2_status(sn, stat) {
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
                notify(translate("websocketoffline"), 500000, "yes");
            }
        }
    }
}

// get l2 api data
function fertch_l2s(currency) {
    const l2_setting = cs_node(currency, "layer2", true);
    return q_obj(l2_setting, "options");
}

// get node data based on api name
function get_l2_node(payment, network, l2_dat, type) {
    const selected = q_obj(l2_dat, type);
    if (selected) {
        const eth_settings = getcoinsettings(payment),
            eth_l2_settings = q_obj(eth_settings, "layer2.options." + network + "." + type + ".apis");
        if (eth_l2_settings) {
            return object_from_array(eth_l2_settings, "name", selected);
        }
    }
    return false;
}

// get l2 request data object
function omni_rdo(timeout, pending, contract, ping_id) {
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