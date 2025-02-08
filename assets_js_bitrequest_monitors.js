$(document).ready(function() {
    update_request_trigger();
    refresh_request_states();
    //scan_pending_requests
    //process_request_updates
    //process_transaction_data
    //route_network_request
    //route_api_request
    //route_crypto_api
    //route_blockchain_rpc
    //process_scan_results
    //tx_count
    //tx_api_scan_fail
    //mark_network_failure
    //handle_api_failure
    //switch_rpc_endpoint
    //no_results
    //fail_dialogs
    //show_api_error
    //extract_error_details
    //get_next_layer2_api
    //get_next_rpc
    //update_api_source
    //display_api_source
    //finalize_request_state

    //scan_tx_li
    //create_transaction_item
    //wrap_historic_data
    //format_transaction_details

    //validate_payment_amounts
    //init_fiat_history
    //fetch_fiat_rates
    //get_historic_fiatprice_api_payload
    //form_date
    //fetch_crypto_rates
    //get_payload_historic_coingecko
    //get_payload_historic_coinpaprika
    //get_payload_historic_coincodex
    //cx_date
    //match_price_timestamps
    //get_historic_object_coingecko
    //get_historic_object_coinpaprika

    // ** Helpers **

    //is_scanning
    //clearscan
    //check_api
    //tx_data
});

// ** Fetch incoming transactions **

// Attaches event listener to trigger request state updates when .requestsbttn.self is clicked
function update_request_trigger() {
    $(document).on("click", ".requestsbttn .self", function() {
        if (is_scanning()) return
        scan_pending_requests(true);
    })
}

// Triggers request state updates with delay if URL parameter indicates requests page
function refresh_request_states() {
    const url_params = geturlparameters();
    if (url_params.xss) {
        return
    }
    if (url_params.p === "requests") { // only trigger on "requests page"
        setTimeout(function() {
            scan_pending_requests("delay");
        }, 300);
    }
}

// Initializes request state update process by resetting global state and marking active requests
function scan_pending_requests(trigger, active_req_list) {
    if (glob_const.offline === true) {
        return // do nothing when offline
    }
    glob_let.rpc_attempts = {}, // reset cache and index
        glob_let.proxy_attempts = {},
        glob_let.tx_list = [], // reset transaction index
        glob_let.statuspush = [],
        glob_let.l2_fetched = {};
    const requests = active_req_list || $("#requestlist .rqli").filter(function() {
        return $(this).data("pending") !== "unknown";
    });
    requests.addClass("open");
    process_request_updates(trigger, requests);
}

// Manages request state cache, updates, and UI synchronization based on transaction status
function process_request_updates(trigger, active_requests) {
    glob_let.apikey_fails = false; // reset apikey fails
    const request_data = $("#requestlist li.rqli.open").first().data();
    if (request_data) {
        if (trigger === "loop") {
            process_transaction_data(request_data);
            return
        }
        const is_delayed = trigger === "delay",
            status_cache = br_get_session("txstatus", true);
        if (status_cache) {
            const cache_age = now() - status_cache.timestamp,
                request_states = status_cache.requeststates;
            if (cache_age > 30000 || empty_obj(request_states)) { //check if cached crypto rates are expired (check every 30 seconds on page refresh or when opening request page)
                active_requests.addClass("scan");
                process_transaction_data(request_data, is_delayed);
                return
            }
            if (trigger === true) {
                return
            }
            // Only update on page refresh
            // parse cached transaction data
            $.each(request_states, function(index, state) {
                const current_list = $("#" + state.requestid),
                    current_data = current_list.data();
                if (current_data) {
                    const pending_status = current_data.pending;
                    if (pending_status === "scanning" || pending_status === "polling") {
                        const status_panel = current_list.find(".pmetastatus"),
                            transaction_list = current_list.find(".transactionlist");
                        status_panel.text(state.status);
                        transaction_list.empty();
                        add_historical_data(transaction_list, state.transactions);
                        current_list.addClass("pmstatloaded");
                    }
                }
            });
            return
        }
        active_requests.addClass("scan");
        process_transaction_data(request_data, is_delayed);
        return
    }
    if (!empty_obj(glob_let.statuspush)) {
        const tx_states = br_get_session("txstatus", true);
        if (tx_states) {
            const txs = tx_states.requeststates,
                txid = sha_sub(JSON.stringify(txs), 15), // hash arrays to compare for changes
                new_tx_id = sha_sub(JSON.stringify(glob_let.statuspush), 15);
            if (txid !== new_tx_id) { // check for updates
                // Only save on status updates
                saverequests();
            }
        } else {
            saverequests();
        }
        const status_object = {
            "timestamp": now(),
            "requeststates": glob_let.statuspush
        };
        br_set_session("txstatus", status_object, true);
        clearscan();
    }
}

// Processes transaction data and initiates API calls with rate limiting protection
function process_transaction_data(rd, dl) {
    const rdo = tx_data(rd);
    if (rdo.pending === "scanning" || rdo.pending === "polling") {
        if (dl) {
            const delay = 10000,
                monitor_timer_cache = br_get_session("monitor_timer"),
                monitor_timer = monitor_timer_cache ? parseInt(monitor_timer_cache, 10) : delay,
                time_since_last = now() - monitor_timer;
            if (time_since_last < delay) { // prevent over scanning
                play_audio(glob_const.funk);
                clearscan();
                return
            }
            br_set_session("monitor_timer", now());
        }
        const api_info = check_api(rd.payment),
            api_data = api_info.data;
        rdo.thislist.removeClass("pmstatloaded");
        update_transaction_count(rdo.statuspanel, "reset");
        route_network_request(rd, api_data, rdo);
        return
    }
    const transaction_list = rdo.transactionlist;
    if (transaction_list) {
        transaction_list.find("li").each(function(index) {
            glob_let.tx_list.push($(this).data("txhash")); //index transaction id's
        });
        finalize_request_state(rdo);
    }
}

// Routes requests to appropriate handlers based on payment type and network availability
function route_network_request(rd, api_data, rdo) {
    if (api_data) {
        const src = rdo.source;
        if (src === "requests") {
            const current_list = rdo.thislist;
            if (current_list) {
                current_list.removeClass("no_network");
                const transaction_list = rdo.transactionlist;
                if (transaction_list) {
                    transaction_list.empty();
                }
            }
        }
        if (rd.eth_layer2) {
            route_layer2_api_request(rd, rdo);
            return
        }
        if (rd.lightning && rdo.source === "requests") {
            process_lightning_payment(rd, api_data, rdo);
            return
        }
        route_api_request(rd, api_data, rdo);
        return
    }
    console.error("error", "no api data available");
}

// Tracks API attempts and routes to specific API or RPC handlers based on availability
function route_api_request(rd, api_data, rdo) {
    const request_id = rd.requestid || "";
    glob_let.rpc_attempts[sha_sub(request_id + api_data.url, 15)] = true;
    if (api_data.api) {
        route_crypto_api(rd, api_data, rdo);
        return
    }
    route_blockchain_rpc(rd, api_data, rdo);
}

// Routes cryptocurrency requests to specific API endpoints based on provider capabilities
function route_crypto_api(rd, api_data, rdo) {
    const provider = api_data.name;
    if (provider === "mymonero api" || provider === "blockchair_xmr") {
        initialize_monero_scan(rd, api_data, rdo);
        return
    }
    if (provider === "mempool.space") {
        mempoolspace_rpc_init(rd, api_data, rdo, false);
        return
    }
    if (provider === "blockchain.info") {
        initialize_bitcoin_scan(rd, api_data, rdo);
        return
    }
    if (provider === "blockcypher") {
        process_blockcypher_transactions(rd, api_data, rdo);
        return
    }
    if (provider === "etherscan") {
        scan_layer2_transactions(rd, api_data, rdo, null, 1);
        return
    }
    if (provider === "ethplorer") {
        ethplorer_fetch(rd, api_data, rdo);
        return
    }
    if (provider === "blockchair") {
        blockchair_fetch(rd, api_data, rdo);
        return
    }
    if (provider === "nimiq.watch" || provider === "mopsus.com") {
        process_nimiq_transactions(rd, api_data, rdo);
        return
    }
    if (rd.payment === "kaspa") {
        initialize_kaspa_scan(rd, api_data, rdo);
        return
    }
    if (provider === "dash.org") {
        process_dash_transactions(rd, api_data, rdo);
        return
    }
    finalize_request_state(rdo);
}

// Routes requests to appropriate RPC endpoints for Bitcoin, Ethereum, and Nano networks
function route_blockchain_rpc(rd, api_data, rdo) {
    if (is_btchain(rd.payment) === true) {
        mempoolspace_rpc_init(rd, api_data, rdo, true);
        return
    }
    if (rd.payment === "ethereum" || rd.erc20 === true) {
        infura_txd_rpc(rd, api_data, rdo);
        return
    }
    if (rd.payment === "nano") {
        nano_rpc(rd, api_data, rdo);
        return
    }
    finalize_request_state(rdo);
}

// Processes transaction scan results and handles Ethereum L2, confirmations, and UI updates based on match type
function process_scan_results(rd, api_data, rdo, counter, tx_details, l2) {
    glob_let.apikey_fails = false;
    const src = rdo.source;
    if (src === "requests") {
        if (counter) {
            update_transaction_count(rdo.statuspanel, counter);
        }
        const current_list = rdo.thislist;
        if (current_list) {
            current_list.removeClass("no_network");
        }
    }
    if (tx_details) {
        const tx_hash = rd.txhash || tx_details.txhash;
        if (!tx_hash) return;
        const eth_layer2 = tx_details.eth_layer2;
        if (src === "requests") {
            if (eth_layer2) {
                const has_l2 = rd.eth_layer2;
                if (!rd.eth_layer2) {
                    // save eth l2 chain
                    rd.eth_layer2 = eth_layer2;
                    // block l2 scanning on match
                    glob_let.l2_fetched.id = rd.requestid;
                    glob_let.l2_fetched.l2 = eth_layer2;
                    return
                }
            }
            validate_payment_amounts(rd, rdo);
            return
        }
        if (eth_layer2) { // Eth layer 2
            initialize_network_status(api_data, "paid");
        }
        tx_details.txhash = tx_hash;
        if (src !== "after_scan") {
            const status = validate_confirmations(tx_details);
            if (status === "paid") {
                force_close_socket();
                return
            }
        }
        if (rdo.pending === "scanning") { // scanning
            // After scan
            if (src === "after_scan") {
                glob_const.html.addClass("blurmain_payment");
                glob_const.paymentpopup.addClass("active");
                closeloader();
            }
            force_close_socket();
            start_transaction_monitor(tx_details, api_data);
            return
        }
        if (src === "tx_polling" || src === "l2_polling") {
            if (block_overflow("polling")) return; // prevent overflow
            route_transaction_monitor(tx_details, api_data);
        }
        return
    }
    if (src === "requests") {
        if (rd.erc20 || rd.payment === "ethereum") {
            if (!l2) {
                // Init eth layer 2's
                route_layer2_api_request(rd, rdo);
                return
            }
        }
        finalize_request_state(rdo);
        return
    }
    if (src === "after_scan") {
        cancel_after_scan();
        return
    }
}

// Updates and displays the transaction count in the UI status panel with reset functionality
function update_transaction_count(status_panel, count) {
    if (count === "reset") {
        status_panel.attr("data-count", 0).text("+ " + 0);
        return
    }
    const current_count = parseInt(status_panel.attr("data-count")),
        new_count = current_count + count;
    if (!new_count) return;
    status_panel.attr("data-count", new_count).text("+ " + new_count);
    if (new_count > 1) {
        status_panel.closest(".rqli").find(".metalist .show_tx").hide();
    }
}

// API error handling

// Processes API scan failures and routes to appropriate error handlers based on network type
function handle_scan_failure(error_obj, rd, api_data, rdo, l2) {
    const src = rdo.source;
    if (src === "requests") {
        const current_list = rdo.thislist;
        if (current_list) {
            mark_network_failure(current_list, rdo.statuspanel);
        }
    }
    if (api_data === "ln") {
        extract_error_details(error_obj);
        return
    }
    if (l2 && src === "l2_scanning") {
        handle_socket_fails(api_data, rd.address, rdo.ping_id, l2);
        return
    }
    handle_api_failure(rd, rdo, error_obj, api_data, l2);
    return
}

// Updates UI elements to indicate network connectivity failure
function mark_network_failure(current_list, status_panel) {
    current_list.addClass("no_network");
    status_panel.attr("data-count", 0).text("0");
}

// Manages API failure scenarios by attempting fallback options and proxy switching
function handle_api_failure(rd, rdo, error_obj, api_data, l2) {
    const src = rdo.source,
        error_details = extract_error_details(error_obj),
        timeout = rdo.timeout,
        cache_time = rdo.cachetime;

    function next_proxy(type) { // try next proxy
        if (type === "api_fail" && (error_details.apikey || glob_let.apikey_fails)) return false; // only try next proxy if api key is expired or missing
        if (get_next_proxy()) {
            if (src === "addr_polling") {
                start_address_monitor(timeout, api_data, true);
                return true;
            }
            if (src === "tx_polling" || src === "l2_polling") {
                if (request) {
                    start_transaction_monitor({
                        "txhash": request.txhash,
                        "setconfirmations": request.set_confirmations,
                        "eth_layer2": request.eth_layer2
                    }, api_data, true);
                    return true;
                }
            }
            if (l2) {
                route_layer2_api_request(rd, rdo, api_data, l2);
                return true;
            }
            route_api_request(rd, api_data, rdo);
            return true;
        }
        return false;
    }
    if (error_obj && error_obj.is_proxy) { // Try next proxy if proxy fails
        if (next_proxy("proxy_fail")) {
            return
        }
        no_results(rdo, src, api_data, error_details);
        return
    }
    if (!api_data) {
        show_api_error(false, error_details);
        if (src === "requests") {
            finalize_request_state(rdo);
            return
        }
        stop_monitors();
        socket_info(api_data, false);
        notify(translate("websocketoffline"), 500000, "yes");
        return
    }
    const request_id = rd.requestid,
        payment = rd.payment;
    if (l2) {
        const next_l2_api = get_next_layer2_api(payment, api_data, request_id, l2);
        if (next_l2_api) {
            // Scan eth layer 2
            if (src === "requests") {
                route_layer2_api_request(rd, rdo, next_l2_api, l2);
                return
            }
            if (src === "l2_polling") {
                monitor_layer2_chain(l2, next_l2_api, true);
                return
            }
        }
    } else {
        const next_rpc = get_next_rpc(payment, api_data, request_id);
        if (next_rpc) {
            switch_rpc_endpoint(rd, rdo, next_rpc, timeout);
            return
        }
        if (rd.erc20 || payment === "ethereum") {
            // Init eth layer 2
            route_layer2_api_request(rd, rdo);
            return
        }
    }
    if (next_proxy("api_fail")) { // Try next proxy after trying all api's
        return
    }
    no_results(rdo, src, api_data, error_details);
}

// Routes requests to next available RPC endpoint based on request source type
function switch_rpc_endpoint(rd, rdo, next_rpc, timeout) {
    const src = rdo.source;
    if (src === "addr_polling") {
        start_address_monitor(timeout, next_rpc, true);
        return
    }
    if (src === "tx_polling") {
        monitor_main_chain(rdo.txdat, next_rpc, true);
        return
    }
    if (src === "after_scan") {
        after_scan(rd, next_rpc, rdo);
        return
    }
    route_api_request(rd, next_rpc, rdo);
}

// Displays error notifications when all API and proxy attempts fail
function no_results(rdo, src, api_data, error_details) {
    const rpc_id = api_data.name || api_data.url || "unknown";
    show_api_error(rpc_id, error_details);
    if (src === "requests") {
        finalize_request_state(rdo);
        return
    }
    stop_monitors();
    socket_info(api_data, false);
    notify(translate("websocketoffline"), 500000, "yes");
}

// Triggers error dialogs for API-related failures
function fail_dialogs(api_source, error_obj) {
    const error_details = extract_error_details(error_obj);
    show_api_error(api_source, error_details);
}

// Renders API error messages with optional API key management UI
function show_api_error(api_source, error_obj) {
    if (!error_obj) return;
    const error_data = error_obj || {
        "errorcode": null,
        "errormessage": "errormessage"
    };
    if ($("#dialogbody .doselect").length) {
        return
    }
    if (api_source) {
        const key_fail = error_data.apikey === true,
            error_message = error_data.errormessage,
            error_code = error_data.errorcode !== undefined ? "Error: " + error_data.errorcode : "",
            api_button = key_fail ? "<div id='add_api' data-api='" + api_source + "' class='button'>" + translate("addapikey", {
                "apisrc": api_source
            }) + "</div>" : "",
            try_other = api_source ? "<span id='proxy_dialog' class='ref'>" + translate("tryotherproxy") + "</span>" : "",
            content = "<h2 class='icon-blocked'>" + error_code + "</h2><p class='doselect'><strong>" + translate("error") + ": " + error_message + "<br/><br/>" + try_other + "</p>" + api_button;
        popdialog(content, "canceldialog");
    }
}

// Extracts and normalizes error information from various API response formats
function extract_error_details(error_obj) {
    const error = q_obj(error_obj, "error");
    if (!error) return {
        "errorcode": 0,
        "errormessage": "unknown"
    };
    const result = error.result,
        error_code = error.code ?? error.status ?? error.error_code ?? error ?? 0,
        error_message = error.message ?? error.error_message ?? error.responseText ?? error.statusText ?? error.type ?? error.error ?? error,
        api_key_check = (typeof error === "string") ? (error.indexOf("API calls limits have been reached") > -1 || error.indexOf("Limits reached") > -1) : false, // blockcypher
        api_key_check2 = (result) ? result.indexOf("API Key") > -1 : null, // etherscan
        api_key = (
            error_code === 101 || // fixer
            error_code === 402 || // blockchair
            error_code === 403 || error_code === 1 || // ethplorer => invalid or missing API key
            error_code === 1001 || // coinmarketcap => invalid API key
            error_code === 1002 || // coinmarketcap => missing API key
            api_key_check || api_key_check2
        ),
        error_details = {
            "errorcode": error_code,
            "errormessage": error_message,
            api_key
        },
        is_proxy = (error_obj.is_proxy) ? "proxy " : "";
    console.error("API " + is_proxy + "error:", error_details);
    if (api_key) {
        glob_let.apikey_fails = true;
    }
    return error_details;
}

// Retrieves next available Layer 2 API endpoint while preventing overflow
function get_next_layer2_api(this_payment, api_data, request_id, l2) {
    if (block_overflow("l2")) return false; // prevent overflow
    const api_settings = q_obj(getcoinsettings(this_payment), "layer2.options." + l2 + ".apis");
    if (api_settings) {
        const api_list = api_settings.apis,
            list_length = api_list.length;
        if (api_list && list_length) {
            const current_index = api_list.findIndex(option => option.name === api_data.name),
                next_api = api_list[(current_index + 1) % list_length],
                rq_id = request_id || "";
            if (glob_let.rpc_attempts[sha_sub(rq_id + next_api.url + l2, 15)] !== true) {
                return next_api;
            }
        }
    }
    return false;
}

// Retrieves next available RPC endpoint while preventing overflow
function get_next_rpc(this_payment, api_data, request_id, l2) {
    if (block_overflow("rpc")) return false; // prevent overflow
    const api_settings = cs_node(this_payment, "apis", true);
    if (api_settings) {
        const api_list = api_settings.apis,
            rpc_list = api_settings.options,
            combined_list = (rpc_list && rpc_list.length) ? $.merge(api_list, rpc_list) : api_list,
            list_length = combined_list.length;
        if (combined_list && list_length) {
            const next_index = combined_list.findIndex(option => option.url === api_data.url),
                next_rpc = combined_list[(next_index + 1) % list_length],
                rq_id = request_id || "",
                l2_prefix = l2 || "";
            if (glob_let.rpc_attempts[sha_sub(rq_id + next_rpc.url + l2_prefix, 15)] !== true) {
                return next_rpc;
            }
        }
    }
    return false;
}

// Updates request data with current API source information
function update_api_source(rdo, api_data) {
    if (rdo.source === "requests") {
        display_api_source(rdo.thislist, api_data);
    }
}

// Updates UI with API source details and connection status indicators
function display_api_source(current_list, api_data) {
    const api_url = api_data.url,
        api_url_short = api_url ? (api_url.length > 40 ? api_url.slice(0, 40) + "..." : api_url) : "",
        provider_name = api_data.name,
        api_title = provider_name === "mempool.space" ? api_url : provider_name,
        api_source = api_title || api_url_short;
    current_list.data("source", api_source).find(".api_source").html("<span class='src_txt' title='" + api_url_short + "'>" + translate("source") + ": " + api_source + "</span><span class='icon-wifi-off'></span><span class='icon-connection'></span>");
}

// Processes final state updates and transaction data after API request completion
function finalize_request_state(rdo) {
    const src = rdo.source;
    if (!src === "requests") {
        return
    }
    // src === "requests"
    const current_list = rdo.thislist;
    if (current_list && current_list.hasClass("scan")) {
        current_list.removeClass("scan open").addClass("pmstatloaded");
        const request_id = rdo.requestid,
            transaction_list = rdo.transactionlist,
            transaction_items = transaction_list.children("li");
        if (transaction_items.length) {
            const transaction_push = [];
            transaction_items.each(function() {
                const current_node = $(this),
                    current_data = current_node.data();
                if (current_data) {
                    transaction_push.push(current_data);
                    if (current_node.attr("title")) {} else {
                        const history_string = format_transaction_details(current_data);
                        if (history_string) {
                            current_node.append(wrap_historic_data(history_string)).attr("title", history_string);
                        }
                    }
                }
            });
            const status_panel = current_list.find(".pmetastatus"),
                status_box = {
                    "requestid": request_id,
                    "status": status_panel.attr("data-count"),
                    "transactions": transaction_push
                };
            glob_let.statuspush.push(status_box);
        } else {
            const status_box = {
                "requestid": request_id,
                "status": 0
            };
            glob_let.statuspush.push(status_box);
        }
        process_request_updates("loop");
    }
}

// Creates and returns a formatted transaction list item with confirmation status
function create_transaction_item(tx_details, request_type) {
    const tx_hash = tx_details.txhash;
    if (!tx_hash) return null;
    const crypto_value = tx_details.ccval,
        crypto_value_rounded = trimdecimals(crypto_value, 6),
        transaction_time = tx_details.transactiontime,
        confirmations = tx_details.confirmations,
        set_confirmations = tx_details.setconfirmations,
        crypto_symbol = tx_details.ccsymbol,
        formatted_crypto_symbol = crypto_symbol ? crypto_symbol.toUpperCase() : "",
        is_lightning = tx_hash && tx_hash.slice(0, 9) === "lightning",
        lightning_icon = is_lightning ? " <span class='icon-power'></span>" : "",
        value_string = (is_lightning && !confirmations) ? "" : crypto_value_rounded + " " + formatted_crypto_symbol + lightning_icon,
        formatted_date = transaction_time ? short_date(transaction_time) : "",
        no_confirmation_requirement = set_confirmations === false,
        instant_lock = tx_details.instant_lock,
        is_confirmed = instant_lock || no_confirmation_requirement || (confirmations && confirmations >= set_confirmations),
        confirmation_count = no_confirmation_requirement ? "" : confirmations + " / " + set_confirmations + " " + translate("confirmations"),
        instant_lock_text = instant_lock ? " (instant_lock)" : "",
        confirmation_title = instant_lock ? "instant_lock" : confirmation_count,
        unconfirmed_text = translate("unconfirmedtx"),
        checked_span = "<span class='icon-checkmark' title='" + confirmation_title + "'></span>",
        confirmation_span = is_confirmed ? checked_span : confirmations ? "<div class='txli_conf' title='" + confirmation_title + "'><div class='confbar'></div><span>" + confirmation_title + "</span></div>" :
        "<div class='txli_conf' title='" + unconfirmed_text + "'><div class='confbar'></div><span>" + unconfirmed_text + "</span></div>",
        tx_list_item = $("<li><div class='txli_content'>" + formatted_date + confirmation_span + "<div class='txli_conf txl_canceled'><span class='icon-blocked'></span>Canceled</div><span class='tx_val'> + " + value_string + " <span class='icon-eye show_tx' title='view on blockexplorer'></span></span></div></li>");
    if (glob_let.tx_list.includes(tx_hash)) { // check for indexed transaction id's
        return request_type === "outgoing" ? null : tx_list_item;
    }
    glob_let.tx_list.push(tx_hash);
    return tx_list_item;
}

// Generates HTML wrapper for historic transaction metadata
function wrap_historic_data(data) {
    return "<div class='historic_meta'>" + data.split("\n").join("<br/>") + "</div>";
}

// Generates detailed transaction information string for tooltip display
function format_transaction_details(data) {
    const historic = data.historic;
    let historic_details = "";
    if (historic && historic.price) {
        const timestamp = historic.timestamp,
            price = historic.price,
            fiat_source = historic.fiatapisrc,
            crypto_source = historic.apisrc,
            local_symbol = historic.lcsymbol,
            local_eur_rate = historic.lcrate,
            usd_eur_rate = historic.usdrate,
            local_usd_rate = 1 / (local_eur_rate / usd_eur_rate),
            local_crypto_rate = price / local_usd_rate,
            local_value = data.ccval * local_crypto_rate,
            crypto_symbol_upper = data.ccsymbol ? data.ccsymbol.toUpperCase() : data.ccsymbol,
            local_symbol_upper = local_symbol ? local_symbol.toUpperCase() : local_symbol,
            local_rate_info = local_symbol_upper === "USD" ? "" : crypto_symbol_upper + "-" + local_symbol_upper + ": " + local_crypto_rate.toFixed(6) + "\n" + local_symbol_upper + "-USD: " + local_usd_rate.toFixed(2);
        // set historic data
        historic_details = "Historic data (" + fulldateformat(new Date(timestamp - glob_const.timezone), langcode) + "):\n" +
            "Fiatvalue: " + local_value.toFixed(2) + " " + local_symbol_upper + "\n" +
            crypto_symbol_upper + "-USD: " + price.toFixed(6) + "\n" +
            local_rate_info + "\n" +
            "Source: " + fiat_source + "/" + crypto_source + "\n";
    }
    const confirmation_details = data.confirmations ? data.confirmations + "/" + data.setconfirmations : translate("unconfirmedtx"),
        confirmation_var = data.instant_lock ? "(instant_lock)" : confirmation_details,
        confirmation_info = data.setconfirmations === false ? "" : "Confirmations: " + confirmation_var,
        layer2_source = data.l2 ? "\nLayer: " + data.l2 : "",
        title_string = historic_details + confirmation_info + layer2_source;
    return title_string.length ? title_string : false;
}

// Validates received cryptocurrency or fiat amounts against requested amounts and updates transaction status
function validate_payment_amounts(rd, rdo) {
    const request_id = rd.requestid,
        current_list = rdo.thislist,
        transaction_items = current_list.find(".transactionlist li"),
        transaction_count = transaction_items.length;
    if (transaction_count) {
        const last_transaction = transaction_items.last(),
            first_transaction_time = last_transaction.data("transactiontime");
        if (first_transaction_time) {
            const is_crypto = rd.iscrypto,
                pending_status = rd.pending,
                required_confirmations = rd.set_confirmations,
                confirmation_interval = required_confirmations === false ? 0 : (required_confirmations ? parseInt(required_confirmations) : 1),
                minimum_confirmations = rd.lightning ? 1 : confirmation_interval, // set minimum confirmations to 1
                first_transaction = transaction_items.first(),
                first_confirmations = first_transaction.data("confirmations"),
                latest_transaction_time = first_transaction.data("transactiontime"),
                time_offset = Math.abs(now() - (first_transaction_time - glob_const.timezone)),
                single_transaction = transaction_count === 1,
                is_recent = time_offset < 300000 && single_transaction,
                crypto_amount = parseFloat(rd.cc_amount),
                amount_margin = 0.95;
            let recent_data = false,
                transaction_counter = 0,
                crypto_status = "pending",
                crypto_pending = pending_status,
                is_crypto_confirmed = false,
                crypto_confirmations = 0,
                crypto_payment_timestamp,
                crypto_transaction_hash,
                total_crypto_amount = 0,
                fiat_value = rd.fiatvalue;
            if (is_crypto || is_recent) {
                const transaction_reverse = transaction_count > 1 ? transaction_items.get().reverse() : transaction_items;
                $(transaction_reverse).each(function(index) {
                    transaction_counter++;
                    const current_transaction = $(this),
                        transaction_data = current_transaction.data(),
                        correction_confirmations = transaction_data.instant_lock ? 0 : minimum_confirmations; // correction if dash instant_lock
                    crypto_confirmations = transaction_data.confirmations,
                        crypto_payment_timestamp = transaction_data.transactiontime,
                        crypto_transaction_hash = transaction_data.txhash,
                        total_crypto_amount += parseFloat(transaction_data.ccval) || 0; // sum of outputs
                    if (crypto_confirmations >= correction_confirmations || rd.no_conf || transaction_data.setconfirmations === false) { // check all confirmations + whitelist for currencies unable to fetch confirmations
                        is_crypto_confirmed = true;
                        if (total_crypto_amount >= crypto_amount * amount_margin) { // compensation for small fluctuations in rounding amount
                            current_transaction.addClass("exceed").nextAll().addClass("exceed");
                            return
                        }
                    } else {
                        is_crypto_confirmed = false;
                    }
                    const confirmation_bar = current_transaction.find(".confbar");
                    if (confirmation_bar.length > 0) {
                        confirmation_bar.each(function(bar_index) {
                            animate_confbar($(this), bar_index);
                        });
                    };
                });
                if (total_crypto_amount >= crypto_amount * amount_margin) { // compensation for small fluctuations in rounding amount
                    if (is_crypto_confirmed === false) { // check confirmations outside the loop
                        crypto_status = "pending",
                            crypto_pending = single_transaction && crypto_transaction_hash ? "polling" : pending_status; // switch to tx polling if there's only one transaction and txhash is known
                    } else {
                        crypto_status = "paid",
                            crypto_pending = "no";
                    }
                } else {
                    crypto_status = "insufficient",
                        crypto_pending = "scanning";
                }
            }
            if (is_recent && !is_crypto) { // get local fiat rates when request is less then 15 minutes old
                const crypto_symbol = rd.currencysymbol,
                    exchange_rates = br_get_session("exchangerates", true),
                    crypto_exchange_rates = br_get_session("xrates_" + crypto_symbol, true);
                if (exchange_rates && crypto_exchange_rates) {
                    const fiat_exchange_rates = exchange_rates.fiat_exchangerates,
                        local_exchange_rate = fiat_exchange_rates ? fiat_exchange_rates[rd.fiatcurrency] : null,
                        usd_eur_exchange_rate = fiat_exchange_rates ? fiat_exchange_rates.usd : null;
                    if (local_exchange_rate && usd_eur_exchange_rate) {
                        const usd_rate = crypto_exchange_rates ? crypto_exchange_rates.ccrate : null;
                        if (usd_rate) {
                            const usd_value = total_crypto_amount * usd_rate,
                                eur_value = usd_value / usd_eur_exchange_rate;
                            fiat_value = eur_value * local_exchange_rate,
                                recent_data = true;
                        }
                    }
                } else {
                    init_fiat_history(rd, rdo, first_confirmations, latest_transaction_time, first_transaction_time);
                    return
                }
            }
            if (is_crypto || recent_data) {
                updaterequest({
                    "requestid": rd.requestid,
                    "status": crypto_status,
                    "receivedamount": total_crypto_amount,
                    "fiatvalue": fiat_value,
                    "paymenttimestamp": crypto_payment_timestamp,
                    "txhash": crypto_transaction_hash,
                    "confirmations": crypto_confirmations,
                    "pending": crypto_pending,
                    "lightning": rd.lightning
                }, false);
                finalize_request_state(rdo);
                return
            }
            init_fiat_history(rd, rdo, first_confirmations, latest_transaction_time, first_transaction_time);
            return
        }
    }
    finalize_request_state(rdo);
}

// get historic crypto rates

// Triggers historical fiat data retrieval for transactions based on confirmation status
function init_fiat_history(rd, rdo, conf, latestinput, firstinput) {
    const confirm_level = conf || 0,
        no_confirm = rd.no_conf || conf === false,
        latest_confirm = no_confirm ? 0 : confirm_level, // only update on change
        cache_prefix = "historic_" + rd.requestid,
        historic_cache = br_get_session(cache_prefix),
        cache_value = parseInt(latestinput) + parseInt(latest_confirm);
    if ((latest_confirm || no_confirm) && cache_value > historic_cache) { //new input detected; call historic api
        br_remove_session(cache_prefix); // remove historic price cache
        const historic_payload = $.extend(rd, {
                "latestinput": latestinput,
                "latestconf": latest_confirm,
                "firstinput": firstinput
            }),
            api_list = "historic_fiat_price_apis",
            fiat_api = $("#fiatapisettings").data("selected"),
            fiat_api_default = (fiat_api === "coingecko" || fiat_api === "coinbase") ? "fixer" : fiat_api; // exclude coingecko api"
        glob_let.api_attempt[api_list] = {}; // reset global historic fiat price api attempt
        fetch_fiat_rates(historic_payload, rdo, api_list, fiat_api_default);
        return
    }
    finalize_request_state(rdo);
}

// Retrieves historical fiat exchange rates from specified API with fallback options
function fetch_fiat_rates(rd, rdo, api_list, fiat_api) {
    glob_let.api_attempt[api_list][fiat_api] = true;
    const fiat_currency = rd.fiatcurrency;
    if (fiat_currency) {
        const currency_symbol = fiat_currency.toUpperCase(),
            payload = get_historic_fiatprice_api_payload(fiat_api, currency_symbol, rd.latestinput);
        api_proxy({
            "api": fiat_api,
            "search": payload,
            "cachetime": 86400,
            "cachefolder": "1d",
            "params": {
                "method": "GET"
            }
        }).done(function(e) {
            const data = br_result(e).result;
            if (data) {
                if (data.error) {
                    const next_historic = try_next_api(api_list, fiat_api);
                    if (next_historic) {
                        fetch_fiat_rates(rd, rdo, api_list, next_historic);
                        return
                    }
                    fail_dialogs(fiat_api, {
                        "error": data.error
                    });
                    finalize_request_state(rdo);
                    return
                }
                let usd_eur = false,
                    usd_local = false,
                    usd_rate = false,
                    local_rate = false;
                if (fiat_api === "currencylayer") {
                    usd_eur = q_obj(data, "quotes.USDEUR"),
                        usd_local = q_obj(data, "quotes.USD" + currency_symbol);
                    if (usd_eur && usd_local) {
                        usd_rate = 1 / usd_eur,
                            local_rate = usd_local * usd_rate;
                    }
                } else {
                    usd_rate = q_obj(data, "rates.USD"),
                        local_rate = q_obj(data, "rates." + currency_symbol);
                }
                if (usd_rate && local_rate) {
                    const currency_rate = currency_symbol === "EUR" ? 1 : local_rate,
                        historic_api = $("#cmcapisettings").data("selected"),
                        picked_historic_api = historic_api === "coinmarketcap" ? "coingecko" : historic_api, // default to "coingecko api"
                        init_api_list = "historic_crypto_price_apis";
                    glob_let.api_attempt[init_api_list] = {};
                    fetch_crypto_rates(rd, rdo, fiat_api, init_api_list, picked_historic_api, currency_rate, usd_rate, currency_symbol);
                    return
                }
                const next_historic = try_next_api(api_list, fiat_api);
                if (next_historic) {
                    fetch_fiat_rates(rd, rdo, api_list, next_historic);
                    return
                }
            }
            fail_dialogs(fiat_api, {
                "error": "unable to fetch " + currency_symbol + " exchange rate"
            });
            finalize_request_state(rdo);
        }).fail(function(xhr, stat, err) {
            function next_proxy() { // try next proxy
                if (get_next_proxy()) {
                    fetch_fiat_rates(rd, rdo, api_list, fiat_api);
                    return true
                }
                return false
            }
            if (is_proxy_fail(this.url) && next_proxy()) { // Try next proxy if proxy fails
                return
            }
            const next_historic = try_next_api(api_list, fiat_api);
            if (next_historic) {
                fetch_fiat_rates(rd, rdo, api_list, next_historic);
                return
            }
            if (next_proxy()) { // Try next proxy after trying all api's
                return
            }
            const error_details = xhr || stat || err;
            fail_dialogs(fiat_api, {
                "error": error_details
            });
            finalize_request_state(rdo);
        });
        return
    }
    finalize_request_state(rdo);
}

// Constructs API-specific URL parameters for historical fiat price requests
function get_historic_fiatprice_api_payload(fiat_api, currency_symbol, latestinput) {
    const formatted_date = form_date(latestinput),
        payload = (fiat_api === "fixer") ? formatted_date + "?symbols=" + currency_symbol + ",USD" :
        (fiat_api === "currencylayer") ? "historical?date=" + formatted_date :
        formatted_date + "?base=EUR"; // <- exchangeratesapi
    return payload;
}

// Converts timestamp to YYYY-MM-DD format for API requests
function form_date(latestinput) {
    const date_object = new Date(parseFloat(latestinput)),
        month_raw = date_object.getUTCMonth() + 1,
        day_raw = date_object.getUTCDate(),
        year = date_object.getUTCFullYear(),
        month = month_raw < 10 ? "0" + month_raw : month_raw,
        day = day_raw < 10 ? "0" + day_raw : day_raw;
    return year + "-" + month + "-" + day;
}

// Fetches and processes historical cryptocurrency prices with multi-API fallback support
function fetch_crypto_rates(rd, rdo, fiat_api, api_list, api, currency_rate, usd_rate, currency_symbol) {
    glob_let.api_attempt[api_list][api] = true;
    const payment_method = rd.payment,
        crypto_symbol = rd.currencysymbol,
        latest_input = rd.latestinput,
        first_input = rd.firstinput,
        coin_id = api === "coincodex" ? crypto_symbol : // coincodex id
        api === "coingecko" ? payment_method : // coingecko id
        crypto_symbol + "-" + payment_method, // coinpaprika id
        start_time_sec = (first_input - glob_const.timezone) / 1000,
        end_time_sec = (latest_input - glob_const.timezone) / 1000,
        erc20_contract = rd.token_contract,
        history_api = api,
        search = history_api === "coincodex" ? get_payload_historic_coincodex(coin_id, start_time_sec, end_time_sec) :
        history_api === "coinmarketcap" || history_api === "coingecko" ? get_payload_historic_coingecko(coin_id, start_time_sec, end_time_sec, erc20_contract) :
        get_payload_historic_coinpaprika(coin_id, start_time_sec, end_time_sec);
    api_proxy({
        "api": api,
        "search": search,
        "proxy": true,
        "cachetime": 86400,
        "cachefolder": "1d",
        "params": {
            "method": "GET"
        }
    }).done(function(e) {
        const api_result = br_result(e).result,
            data = api === "coingecko" ? (api_result ? api_result.prices : null) :
            api === "coincodex" ? (api_result ? api_result[crypto_symbol.toUpperCase()] : null) :
            api_result;
        if (data && !data.error) {
            const request_list = rdo.thislist,
                tx_list = request_list.find(".transactionlist li"),
                tx_list_length = tx_list.length,
                tx_reverse = tx_list_length > 1 ? tx_list.get().reverse() : tx_list,
                latest_confirm = rd.latestconf,
                total_amount = rd.amount,
                get_confirmations = rd.set_confirmations,
                confirm_interval = get_confirmations === false ? 0 : (get_confirmations ? parseInt(get_confirmations) : 1),
                is_lightning = rd.lightning,
                set_confirmations = is_lightning ? 1 : confirm_interval, // set minimum confirmations to 1
                is_erc20 = rd.erc20,
                historic_usd_value = (total_amount / currency_rate) * usd_rate,
                margin = historic_usd_value < 2 ? 0.60 : 0.95; // be flexible with small amounts
            let tx_counter = 0,
                confirmations = 0,
                payment_timestamp,
                tx_hash,
                received_crypto = 0,
                received_usd = 0,
                confirmed = false,
                status = "pending",
                pending = rd.pending;
            $(tx_reverse).each(function(i) {
                tx_counter++;
                const current_node = $(this),
                    node_data = current_node.data(),
                    transaction_timestamp = node_data.transactiontime,
                    transaction_value = node_data.ccval,
                    values = {
                        "fiatapisrc": fiat_api,
                        "apisrc": api,
                        "lcrate": currency_rate,
                        "usdrate": usd_rate,
                        "lcsymbol": currency_symbol,
                        "fetched": false
                    },
                    historic_object = match_price_timestamps(api, values, data, transaction_timestamp),
                    historic_price = historic_object.price,
                    conf_correct = node_data.instant_lock ? 0 : set_confirmations; // correction if dash instant_lock
                current_node.data("historic", historic_object);
                confirmations = node_data.confirmations, // check confirmations
                    payment_timestamp = transaction_timestamp,
                    tx_hash = node_data.txhash,
                    received_crypto += parseFloat(transaction_value) || 0; // sum of outputs CC
                if ((historic_price && confirmations >= conf_correct) || rd.no_conf === true || node_data.setconfirmations === false) { // check all confirmations + whitelist for currencies unable to fetch confirmations
                    confirmed = true;
                } else {
                    confirmed = false;
                }
                let current_usd_sum = received_usd += parseFloat(historic_price * transaction_value) || 0;
                if (current_usd_sum >= historic_usd_value * margin) { //minus 5% dollar for volatility compensation
                    current_node.addClass("exceed").nextAll().addClass("exceed");
                }
                const conf_bar = current_node.find(".confbar");
                if (conf_bar.length > 0) {
                    conf_bar.each(function(i) {
                        animate_confbar($(this), i);
                    });
                };
            });
            if (received_usd) {
                if (received_usd >= historic_usd_value * margin) { // check total incoming amount // minus 5% dollar for volatility compensation
                    if (confirmed === false) { // check confirmations outside the loop
                        status = "pending",
                            pending = tx_counter === 1 && tx_hash ? "polling" : pending; // switch to tx polling if there's only one transaction and txhash is known
                    } else {
                        status = "paid",
                            pending = "no";
                    }
                } else {
                    status = received_usd === 0 ? status : "insufficient",
                        pending = "scanning";
                }
                updaterequest({
                    "requestid": rd.requestid,
                    "status": status,
                    "receivedamount": received_crypto,
                    "fiatvalue": (received_usd / usd_rate) * currency_rate,
                    "paymenttimestamp": payment_timestamp,
                    "txhash": tx_hash,
                    "confirmations": confirmations,
                    "pending": pending,
                    "lightning": is_lightning
                }, false);
                if (pending !== "no") {
                    const cache_value = parseInt(latest_input) + parseInt(latest_confirm);
                    br_set_session("historic_" + rd.requestid, cache_value); // 'cache' historic data
                }
                finalize_request_state(rdo);
                return
            }
        }
        const next_historic = try_next_api(api_list, api);
        if (next_historic) {
            fetch_crypto_rates(rd, rdo, fiat_api, api_list, next_historic, currency_rate, usd_rate, currency_symbol);
            return
        }
        fail_dialogs(api, {
            "error": "error retrieving historical price data"
        });
        finalize_request_state(rdo);
    }).fail(function(xhr, stat, err) {
        function next_proxy() { // try next proxy
            if (get_next_proxy()) {
                fetch_crypto_rates(rd, rdo, fiat_api, api_list, api, currency_rate, usd_rate, currency_symbol);
                return true
            }
            return false
        }
        if (is_proxy_fail(this.url) && next_proxy()) { // Try next proxy if proxy fails
            return
        }
        const next_historic = try_next_api(api_list, api);
        if (next_historic) {
            fetch_crypto_rates(rd, rdo, fiat_api, api_list, next_historic, currency_rate, usd_rate, currency_symbol);
            return
        }
        if (next_proxy()) { // Try next proxy after trying all api's
            return
        }
        const error_details = xhr || stat || err;
        fail_dialogs(api, {
            "error": error_details
        });
        finalize_request_state(rdo);
    })
}

// Builds CoinGecko API request URL for historical price data
function get_payload_historic_coingecko(coin_id, start_time, end_time, erc20_contract) {
    const time_range = Math.abs(end_time - start_time),
        adjusted_start_time = time_range < 3600 ? 5200 : 3600; // compensation for minimum range
    if (erc20_contract) {
        return "coins/ethereum/contract/" + erc20_contract + "/market_chart/range?vs_currency=usd&from=" + (start_time - adjusted_start_time) + "&to=" + (end_time + 3600); // expand range with one hour for error margin
    }
    return "coins/" + coin_id + "/market_chart/range?vs_currency=usd&from=" + (start_time - adjusted_start_time) + "&to=" + (end_time + 3600); // expand range with one hour for error margin
}

// Builds CoinPaprika API request URL with dynamic time intervals
function get_payload_historic_coinpaprika(coin_id, start_time, end_time) {
    const timestamp_start = start_time - 36000,
        timestamp_end = end_time + 36000, // add ten hours flex both ways otherwise api can return empty result
        time_span = timestamp_end - timestamp_start,
        // api limit = 1000 rows (default)
        // 3day = 259200 = max 864 rows (5 min interval)
        // 6day = 518400 = max 864 rows (10 min interval)
        // 9day = 777600 = max 864 rows (15 min interval)
        // 18day = 1555200 = max 864 rows (30 min interval)
        // 27day = 2332800 = max 864 rows (45 min interval)
        // 35day = 3024000 = max 864 rows (1 hour interval)
        // 72day = 6220800 = max 864 rows (2 hour interval) (max 2 months)
        interval = time_span < 259200 ? "5m" :
        time_span < 518400 ? "10m" :
        time_span < 777600 ? "15m" :
        time_span < 1555200 ? "30m" :
        time_span < 2332800 ? "45m" :
        time_span < 3024000 ? "1h" : "2h",
        coinpaprika_query_string = start_time === end_time ?
        start_time - 300 + "&limit=1" :
        timestamp_start + "&end=" + end_time + "&interval=" + interval; // query for one or multiple dates (-300 seconds for instant update)
    return coin_id + "/historical?start=" + coinpaprika_query_string;
}

// Builds CoinCodex API request URL for historical price data
function get_payload_historic_coincodex(coin_id, start_time, end_time) {
    const start_date = cx_date(start_time),
        end_date = cx_date(end_time),
        time_query = start_time == end_time ? start_date + "/" + start_date : start_date + "/" + end_date;
    return "get_coin_history/" + coin_id + "/" + time_query + "/" + 1000;
}

// Formats Unix timestamp to YYYY-MM-DD for CoinCodex API
function cx_date(timestamp) {
    return new Date(timestamp * 1000).toISOString().split("T")[0];
}

// Matches transaction timestamps with closest historical price data point
function match_price_timestamps(api, values, price_array, transaction_timestamp) {
    for (let i = 0; i < price_array.length; i++) {
        const historic_object = api === "coincodex" ? get_historic_object_coincodex(price_array[i]) :
            api === "coingecko" ? get_historic_object_coingecko(price_array[i]) :
            get_historic_object_coinpaprika(price_array[i]);
        if (historic_object && historic_object.timestamp > transaction_timestamp) {
            values.timestamp = historic_object.timestamp;
            values.price = historic_object.price;
            values.fetched = true;
            return values;
        }
    }
    // If no matching timestamp get latest
    const last_item = price_array[price_array.length - 1],
        last_historic_object = api === "coincodex" ? get_historic_object_coincodex(last_item) :
        api === "coingecko" ? get_historic_object_coingecko(last_item) :
        get_historic_object_coinpaprika(last_item);
    if (last_historic_object) {
        values.timestamp = last_historic_object.timestamp;
        values.price = last_historic_object.price;
        values.fetched = false;
    }
    return values;
}

// Extracts timestamp and price from CoinCodex API response format
function get_historic_object_coincodex(value) {
    if (value) {
        return {
            "timestamp": value[0] * 1000 + glob_const.timezone + 60000, // add 1 minute for compensation margin
            "price": value[1]
        };
    }
    return false;
}

// Extracts timestamp and price from CoinGecko API response format
function get_historic_object_coingecko(value) {
    if (value) {
        return {
            "timestamp": value[0] + glob_const.timezone + 60000, // add 1 minute for compensation margin
            "price": value[1]
        };
    }
    return false;
}

// Extracts timestamp and price from CoinPaprika API response format
function get_historic_object_coinpaprika(value) {
    if (value && value.timestamp) {
        return {
            "timestamp": to_ts(value.timestamp),
            "price": value.price
        };
    }
    return false;
}

// ** Helpers **
// Checks if any requests are currently being scanned and prevents concurrent scans
function is_scanning() {
    const scanning = $("#requestlist li.rqli.scan").length > 0;
    if (scanning) {
        if (glob_let.block_scan > 9) {
            clearscan();
        }
        glob_let.block_scan += 1;
        play_audio(glob_const.funk);
    }
    return scanning;
}

// Removes scanning status from all request elements and resets scan counter
function clearscan() {
    $("#requestlist .rqli").removeClass("scan"); // prevent triggerblock
    glob_let.block_scan = 0;
}

// Retrieves API configuration for specified payment method
function check_api(payment) {
    const api_data = cs_node(payment, "apis", true);
    if (api_data) {
        const is_api = q_obj(api_data, "selected.api") === true;
        return {
            "api": is_api,
            "data": api_data.selected
        }
    }
    return {
        "api": false,
        "data": false
    }
}

// Formats and normalizes request data for transaction processing
function tx_data(rd) {
    const request_id = rd.requestid,
        request_list = $("#" + request_id),
        request_date = rd.inout === "incoming" ? rd.timestamp : rd.requestdate,
        request_timestamp = request_date - 30000, // 30 seconds compensation for unexpected results
        get_confirmations = rd.set_confirmations,
        set_confirmations = get_confirmations ? parseInt(get_confirmations) : 1,
        is_canceled = rd.status === "canceled",
        pending_status = is_canceled ? "scanning" : rd.pending,
        status_panel = request_list.find(".pmetastatus"),
        transaction_list = request_list.find("ul.transactionlist");
    return {
        "requestid": request_id,
        "thislist": request_list,
        "request_timestamp": request_timestamp,
        "setconfirmations": set_confirmations,
        "canceled": is_canceled,
        "pending": pending_status,
        "statuspanel": status_panel,
        "transactionlist": transaction_list,
        "source": "requests",
        "cachetime": 25
    }
}