//start_transaction_monitor
//route_transaction_monitor
//monitor_main_chain
//monitor_layer2
//monitor_l2_contracts
//clear_polling_timeout
//start_address_monitor
//check_address_transactions

// ** Monero RPC: **
//init_xmr_polling
//connect_xmr_node
//poll_xmr
//xmr_get_latest_block_hash
//xmr_process_block_range
//xmr_get_block_txs
//xmr_get_mempool_hashes
//xmr_get_transactions
//process_chunks_sequentially
//handle_chunk_error
//render_incoming_xmr
//filter_incoming_transactions
//poll_monero_rpc
//handle_xmr_rpc_fails

//validate_confirmations
//stop_monitors
//clear_recent_requests

// Initiates transaction monitoring and sets UI state for payment processing
function start_transaction_monitor(tx_data, api_data, retry) {
    reset_overflow();
    glob_let.rpc_attempts = {};
    glob_let.apikey_fails = false;
    route_transaction_monitor(tx_data, api_data, retry);
    glob_const.paymentdialogbox.addClass("transacting");
    if (!request.paymenttimestamp && tx_data.transactiontime) {
        request.paymenttimestamp = tx_data.transactiontime;
    }
}

// Directs transaction monitoring to appropriate chain (L1/L2) based on transaction data
function route_transaction_monitor(tx_data, api_dat, retry) {
    const url_params = get_urlparameters();
    if (url_params.xss) {
        return
    }
    if (tx_data) {
        if (is_openrequest()) {
            if (request) {
                const tx_hash = tx_data.txhash;
                if (tx_hash) {
                    const zero_conf = (tx_data.setconfirmations) ? false : true,
                        status = validate_confirmations(tx_data, zero_conf);
                    if (status === "paid") {
                        return
                    }
                    const is_layer2 = tx_data.eth_layer2;
                    if (is_layer2) {
                        request.txhash = tx_hash;
                        monitor_layer2(is_layer2, api_dat, retry);
                        return
                    }
                    monitor_main_chain(tx_data, api_dat, retry);
                    return
                }
            }
        }
    }
    glob_const.paymentdialogbox.removeClass("transacting");
}

// Monitors Layer 1 blockchain transactions with configurable retry intervals
function monitor_main_chain(tx_data, api_dat, retry) {
    clear_polling_timeout();
    const timeout = retry ? 10 : 30000,
        api_data = api_dat || q_obj(helper, "api_info.data"),
        rdo = { // request data object
            "requestid": request.requestid,
            "pending": "polling",
            "txdat": tx_data,
            "source": "tx_polling",
            "setconfirmations": tx_data.setconfirmations,
            "cachetime": 25
        },
        rd = { // custom request data
            "requestid": request.requestid,
            "payment": request.payment,
            "erc20": request.erc20,
            "txhash": tx_data.txhash || request.txhash,
            "currencysymbol": request.currencysymbol,
            "address": request.address,
            "decimals": request.decimals,
            "viewkey": request.viewkey
        };
    glob_let.tpto = setTimeout(function() {
        route_api_request(rd, api_data, rdo);
    }, timeout, function() {
        clear_polling_timeout();
    });
}

// Monitors Layer 2 blockchain transactions using network-specific API endpoints
function monitor_layer2(eth_layer2, api_dat, retry) {
    init_fetch_l2_contracts({ // route to fetch contracts
        "currency": request.payment,
        "name": "monitor_l2_contracts",
        "params": {
            eth_layer2,
            api_dat,
            retry
        }
    });
}

// Monitors Layer 2 blockchain transactions using network-specific API endpoints with fetched contracts
function monitor_l2_contracts(params, contracts_list) {
    clear_polling_timeout();
    const {
        eth_layer2,
        api_dat,
        retry
    } = params;
    const timeout = retry ? 10 : 30000,
        currency = request.payment,
        l2_config = get_layer2_config(currency),
        api_data = api_dat || get_network_node_config(currency, eth_layer2, l2_config[eth_layer2], "apis"),
        contract = contracts_list[eth_layer2];
    glob_let.tpto = setTimeout(function() {
        start_layer2_polling(api_data, contract);
    }, timeout, function() {
        clear_polling_timeout();
    });
}

// Terminates the active transaction polling timeout
function clear_polling_timeout() {
    clearTimeout(glob_let.tpto);
    glob_let.tpto = 0;
}

// Sets up periodic monitoring of wallet address for incoming transactions
function start_address_monitor(time_out, api_dat, retry) {
    const addr_id = request.address,
        poll_interval = time_out || 7000,
        setconfirmations = request.set_confirmations || 0,
        cache_time = (poll_interval - 1000) / 1000,
        rdo = { // request data object
            "requestid": request.requestid,
            "request_timestamp": request.rq_init,
            setconfirmations,
            "pending": "scanning",
            "erc20": request.erc20,
            "source": "addr_polling",
            "timeout": poll_interval,
            "cachetime": cache_time
        };
    api_data = api_dat || q_obj(helper, "api_info.data");
    glob_let.tx_count = 1000000; // reset tx count
    if (api_data) {
        if (retry) {
            stop_monitors(addr_id);
            check_address_transactions(rdo, api_data);
        }
        socket_info({
            "url": api_data.name
        }, true, true);
        glob_let.pinging[addr_id] = setInterval(function() {
            try {
                check_address_transactions(rdo, api_data);
            } catch (err) {
                console.error("error", err);
                stop_monitors(addr_id);
            }
        }, poll_interval);
        return
    }
    notify(tl("websocketoffline"), 500000, "yes");
}

// Executes a single polling cycle to check for new transactions at specified address
function check_address_transactions(rdo, api_data) {
    route_api_request(request, api_data, rdo);
    poll_animate();
    socket_info(api_data, true, true);
}

// Custom Polling

// Monero RPC

// Establishes initial connection to Monero node with view key authentication
function init_xmr_polling(api_dat, retry) {
    glob_let.xmr_indexed.mempool = [];
    glob_let.xmr_indexed.blocks = [];
    const wallet_address = request.address,
        viewkey = request.viewkey || get_vk(wallet_address);
    if (viewkey) {
        const address = viewkey.account || wallet_address,
            xmr_key = viewkey.vk,
            api_data = api_dat || q_obj(helper, "api_info.data"),
            node_name = api_data.name;
        request.monitored = true;
        closenotify();
        if (node_name === "xmr_node") {
            connect_xmr_node(api_data, address, xmr_key, retry);
            return
        }
    }
    request.monitored = false;
    br_offline();
    return
}

// Establishes initial connection to Monero node with view key authentication
function connect_xmr_node(api_data, address, vk, retry) {
    const timeout = retry ? 0 : 10000;
    socket_info({
        "url": api_data.url
    }, true, true);
    if (timeout) {
        glob_let.tpto = setTimeout(function() {
            poll_xmr(api_data, address, vk);
        }, timeout, function() {
            clear_polling_timeout();
        });
        return
    }
    poll_xmr(api_data, address, vk, retry);
}

// Periodically checks the Monero mempool for incoming transactions.
function poll_xmr(api_data, address, vk, retry) {
    const spk = get_spend_pubkey_from_address(address);
    if (retry) {
        poll_animate();
        xmr_get_latest_block_hash(api_data, vk, spk);
        if (retry === "post_scan") { // poll once on postscan
            return
        }
    }
    glob_let.pinging[address] = setInterval(function() {
        try {
            poll_animate();
            xmr_get_latest_block_hash(api_data, vk, spk);
        } catch (err) {
            console.error("error", err);
            stop_monitors(address);
        }
    }, 12000); // poll every 12 seconds, be gentle on the host
}

function xmr_get_latest_block_hash(api_data, vk, spk) {
    const node = api_data.url,
        proxy = node.includes(".onion") || glob_const.inframe;
    api_proxy({
        "api_url": node + "/json_rpc",
        proxy,
        "params": {
            "method": "POST",
            "contentType": "application/json",
            "data": {
                "jsonrpc": "2.0",
                "id": "0",
                "method": "get_last_block_header"
            },
        }
    }).done(function(e) {
        const response = br_result(e).result;
        if (response) {
            const latest_block_height = q_obj(response, "result.block_header.height"),
                pre_start_index = request.xmr_block_index; // last block before start request
            if (latest_block_height && pre_start_index) {
                const start_index = pre_start_index + 1; // first potential block
                if (latest_block_height >= start_index) {
                    const range = create_range_array(start_index, latest_block_height),
                        indexed_blocks = glob_let.xmr_indexed.blocks;
                    filtered_range = (indexed_blocks.length > 0) ? remove_array_items(range, indexed_blocks) : range;
                    if (filtered_range.length) {
                        xmr_process_block_range(api_data, filtered_range, vk, spk);
                        return
                    }
                }
            }
        }
        // only scan mempool
        xmr_get_mempool_hashes(api_data, [], vk, spk);
    }).fail(function(error) {
        handle_xmr_rpc_fails(api_data);
    });
}

// This is the new "controller" function that manages the recursive loop.
function xmr_process_block_range(api_data, range, vk, spk) {
    const range_length = range.length;

    function process_next_block(index, total_hashes) {
        if (index >= range_length) {
            console.log("Finished processing all blocks in range. Total hashes found in blocks: ", total_hashes.length);
            xmr_get_mempool_hashes(api_data, total_hashes, vk, spk);
            return
        }
        const height = range[index];
        console.log("Processing block height: " + height);
        xmr_get_block_txs(api_data, height, (found_hashes) => {
            const newtotal_hashes = total_hashes.concat(found_hashes);
            setTimeout(() => {
                process_next_block(index + 1, newtotal_hashes);
            }, 500); // 500ms delay
        });
    }
    process_next_block(0, []);
}

// XMR get block by height
function xmr_get_block_txs(api_data, height, callback) {
    const node = api_data.url,
        proxy = node.includes(".onion") || glob_const.inframe;
    api_proxy({
        "api_url": node + "/json_rpc",
        proxy,
        "params": {
            "method": "POST",
            "contentType": "application/json",
            "data": {
                "jsonrpc": "2.0",
                "id": "0",
                "method": "get_block",
                "params": {
                    height
                }
            },
        }
    }).done(function(e) {
        const response = br_result(e).result;
        if (response) {
            const txs_hashes = q_obj(response, "result.tx_hashes");
            if (txs_hashes && txs_hashes.length > 0) {
                const existing_set = glob_let.xmr_indexed.blocks,
                    updated_set = add_unique_items(existing_set, [height]);
                glob_let.xmr_indexed.blocks = updated_set;
                callback(txs_hashes);
                return
            }
        }
        callback([]);
    }).fail(function(error) {
        console.error("Failed to fetch block " + height + ":", error);
        callback([]);
    });
}

// get transaction pool hashes
function xmr_get_mempool_hashes(api_data, txs_hashes, vk, spk) {
    setTimeout(() => {
        const node = api_data.url,
            proxy = node.includes(".onion") || glob_const.inframe;
        api_proxy({
            "api_url": node + "/get_transaction_pool_hashes",
            proxy,
            "params": {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        }).done(function(e) {
            const response = br_result(e).result;
            if (response) {
                const pool_hashes = response.tx_hashes;
                if (pool_hashes && pool_hashes.length > 0) {
                    const all_hashes = pool_hashes.concat(txs_hashes);
                    xmr_get_transactions(api_data, all_hashes, vk, spk);
                    return
                }
            }
            xmr_get_transactions(api_data, txs_hashes, vk, spk);
        }).fail(function(error) {
            xmr_get_transactions(api_data, txs_hashes, vk, spk);
        });
    }, 500); // 500ms delay
}

// Fetches and processes transaction details for a given list of hashes in chunks.
function xmr_get_transactions(api_data, hashes, vk, spk) {
    const config = {
            "chunk_size": 50,
            "delay_ms": 250, // Delay between chunks
            "max_retries": 3, // Maximum retry attempts per chunk
            "retry_delay_ms": 1000
        },
        xmr_pool = glob_let.xmr_indexed.mempool,
        filtered_hashes = (xmr_pool.length > 0) ? remove_array_items(hashes, xmr_pool) : hashes,
        chunks = [],
        fhl = filtered_hashes.length;
    for (let i = 0; i < fhl; i += config.chunk_size) {
        chunks.push(filtered_hashes.slice(i, i + config.chunk_size));
    }
    console.log("Total hashes: " + hashes.length);
    console.log("Total filtered_hashes: " + fhl);
    console.log("Number of chunks: " + chunks.length);
    // Start processing
    process_chunks_sequentially(api_data, chunks, vk, spk, config, 0, []);
}

// Sequentially processes chunks of transaction hashes with delays and retry logic.
function process_chunks_sequentially(api_data, chunks, vk, spk, config, index, all_incoming, retry_count = 0) {
    // Check if all chunks have been processed
    if (index >= chunks.length) {
        const total_length = all_incoming.length;
        console.log("✓ All chunks processed!");
        console.log("Total incoming transactions found: " + total_length);
        if (total_length > 0) {
            // Process all found transactions or just the first one
            render_incoming_xmr(all_incoming, api_data, vk);
            return
        }
        console.log("No incoming transactions found in mempool");
        if (glob_let.post_scan) { // close dialog if post scan
            cancel_post_scan();
        }
        return
    }
    // Add delay before each request (except the first one and retries)
    const wait_time = (index === 0 || retry_count > 0) ? 0 : config.delay_ms;
    setTimeout(() => {
        const current_chunk = chunks[index],
            attempt_info = retry_count > 0 ? " (Retry " + (retry_count / config.max_retries) + ")" : "",
            api_rpc_url = api_data.url,
            proxy = api_rpc_url.includes(".onion") || glob_const.inframe;
        console.log("Processing chunk " + (index + 1) + "/" + chunks.length + " (" + current_chunk.length + " hashes) " + attempt_info);
        api_proxy({
            "api_url": api_data.url + "/get_transactions",
            proxy,
            "params": {
                "method": "POST",
                "data": {
                    "txs_hashes": current_chunk
                },
                "headers": {
                    "Content-Type": "application/json"
                }
            }
        }).done(function(e) {
            const response = br_result(e).result;
            if (response && response.txs) {
                const incoming = filter_incoming_transactions(response, vk, spk);
                if (incoming.length > 0) {
                    console.log("✓ Chunk " + (index + 1) + " Found " + incoming.length + " incoming transaction(s)");
                    all_incoming.push(...incoming);
                    const ail = all_incoming.length;
                    if (ail > 0) {
                        console.log("Total incoming transactions found: " + ail);
                        // Process the found transaction(s)
                        render_incoming_xmr(all_incoming, api_data, vk);
                        return
                    }
                } else {
                    const existing_set = glob_let.xmr_indexed.mempool,
                        updated_set = add_unique_items(existing_set, current_chunk);
                    glob_let.xmr_indexed.mempool = updated_set;
                    console.log("- Chunk " + (index + 1) + " : No incoming transactions");
                }
                // Success - move to next chunk
                process_chunks_sequentially(api_data, chunks, vk, spk, config, index + 1, all_incoming, 0);
            } else {
                // Invalid response - treat as error
                console.warn("⚠ Chunk " + (index + 1) + ": Invalid response format");
                handle_chunk_error(api_data, chunks, vk, spk, config, index, all_incoming, retry_count, {
                    "error": "Invalid response format"
                });
            }

        }).fail(function(xhr, stat, err) {
            console.error("✗ Chunk " + (index + 1) + " failed:", stat, err);
            handle_chunk_error(api_data, chunks, vk, spk, config, index, all_incoming, retry_count, {
                xhr,
                stat,
                err
            });
        });
    }, wait_time);
}

// Manages errors during chunk processing, including retries and skipping.
function handle_chunk_error(api_data, chunks, vk, spk, config, index, all_incoming, retry_count, error_info) {
    // Check if we should retry
    if (retry_count < config.max_retries) {
        console.log("↻ Retrying chunk " + (index + 1) + " in " + config.retry_delay_ms + " ms...");
        setTimeout(() => {
            process_chunks_sequentially(api_data, chunks, vk, spk, config, index, all_incoming, retry_count + 1);
        }, config.retry_delay_ms);

    } else {
        // Max retries reached - skip this chunk and continue
        console.error("✗ Chunk " + (index + 1) + " failed after " + config.max_retries + " retries. Skipping...");
        console.error("Error details:", error_info);
        // Continue with next chunk
        process_chunks_sequentially(api_data, chunks, vk, spk, config, index + 1, all_incoming, 0);
    }
}

// Renders and handles verified incoming Monero transactions.
function render_incoming_xmr(all_incoming, api_data, vk) {
    const conf = q_obj(request, "set_confirmations") || 0,
        incoming_count = all_incoming.length,
        request_ts = request.rq_init - 10000; // 10 second compensation
    let match = false,
        tx_data = false;
    all_incoming.forEach((tx, i) => {
        console.log("Processing incoming transaction " + ((i + 1) / incoming_count));
        const txdat = xmr_tx_data(tx, conf);
        if (txdat.ccval && txdat.transactiontime > request_ts) {
            match = true,
                tx_data = txdat;
            return false;
        }
    });
    if (match) {
        const tx_exists = get_requestli("txhash", tx_data.txhash); // scan pending xmr tx's to prevent duplicates
        if (tx_exists.length) {
            if (glob_let.post_scan) { // close dialog if post scan
                cancel_post_scan();
            }
            return
        }
        const pid_matches = validate_monero_payment_id(request, tx_data); // match xmr payment_id if set
        if (pid_matches) {
            if (glob_let.post_scan) { // reopen dialog if post scan
                glob_const.html.addClass("blurmain_payment");
                glob_const.paymentpopup.addClass("active");
                closeloader();
            }
            stop_monitors(request.address);
            setTimeout(() => {
                start_transaction_monitor(tx_data, api_data);
            }, 1000);
        }
    }
}

// Scans through transactions to find and verify outputs belonging to the user's view and spend keys.
function filter_incoming_transactions(rpc_data, view_key, spend_pubkey) {
    const incoming_txs = [];
    rpc_data.txs.forEach((tx_data, idx) => {
        const tx_hex = tx_data.as_hex || tx_data.pruned_as_hex;
        if (tx_hex) {
            try {
                const tx_json = parse_xmr_tx_hex(tx_hex),
                    rct = tx_json.rct_signatures;
                if (rct) {
                    if (!tx_json.extra || tx_json.extra.length < 33 || tx_json.extra[0] !== 1) {
                        return
                    }
                    const tx_pub_key = bytes_to_hex(tx_json.extra.slice(1, 33)),
                        r_point = EdPoint.fromHex(tx_pub_key),
                        a_scalar = ed_bytes_to_number_le(hex_to_bytes(view_key)),
                        shared_secret_point = r_point.multiply(a_scalar).multiply(8n),
                        shared_secret_hex = point_to_monero_hex(shared_secret_point),
                        b_point = EdPoint.fromHex(spend_pubkey); // Spend public key point
                    let outputs = [];
                    tx_json.vout.forEach((output, output_index) => {
                        const view_tag = output.target?.tagged_key?.view_tag;
                        if (!view_tag) return
                        // STEP 1: Check view tag (fast pre-check)
                        const prefix_bytes_tag = str_to_bin("view_tag"),
                            hash_input_for_tag = bytes_to_hex(concat_bytes(prefix_bytes_tag, hex_to_bytes(shared_secret_hex), encode_varint(output_index))),
                            computed_tag = fasthash(hash_input_for_tag).slice(0, 2);
                        if (computed_tag !== view_tag) return // View tag doesn't match
                        // STEP 2: View tag matched - now verify the output public key
                        const output_pubkey = output.target?.tagged_key?.key;
                        if (!output_pubkey) return
                        // Derive expected output key: P = hs(aR,i)G + B
                        // Create derivation data: shared_secret + output_index
                        const derivation_data = bytes_to_hex(concat_bytes(
                                hex_to_bytes(shared_secret_hex),
                                encode_varint(output_index)
                            )),
                            hash_result = fasthash(derivation_data),
                            hs_bytes = sc_reduce32(hash_result),
                            hs = ed_bytes_to_number_le(hs_bytes),
                            hs_g = EdPoint.BASE.multiply(hs),
                            expected_output_point = hs_g.add(b_point),
                            expected_output_key = expected_output_point.toHex();
                        // Compare with actual output key
                        if (expected_output_key !== output_pubkey) {
                            console.log("⚠ Output " + output_index + ": View tag matched but output key doesn't belong to us (false positive)");
                            return // This output is not ours - it's a view tag collision
                        }
                        // Output is confirmed to be ours - now decode amount
                        const parse_amount = decode_rct_amount(rct, output_index, shared_secret_hex);
                        if (!parse_amount) {
                            console.log("⚠ Output " + output_index + ": Could not decode amount");
                            return
                        }
                        // Additional sanity check on amount
                        if (parse_amount <= 0n || parse_amount > 18446744073709551615n) {
                            console.log("⚠ Output " + output_index + ": Invalid amount " + parse_amount);
                            return
                        }
                        const amount = parse_amount.toString();
                        outputs.push({
                            output_index,
                            amount
                        });
                    });
                    if (outputs.length > 0) {
                        const fee = rct?.txnFee || 0,
                            tx_result = {
                                fee,
                                ...tx_data,
                                outputs
                            };
                        // Extract payment ID if present
                        const payment_id_data = extract_xmr_payment_id(tx_json.extra, tx_pub_key, view_key);
                        if (payment_id_data) {
                            tx_result.payment_id = payment_id_data.payment_id;
                            tx_result.payment_id_type = payment_id_data.type;
                        }
                        incoming_txs.push(tx_result);
                    }
                }
            } catch (error) {
                console.error("✗ Error parsing transaction:", error.message);
            }
        }
    });
    return incoming_txs;
}

// Polls the Monero RPC for a specific transaction hash to confirm its details.
function poll_monero_rpc(rd, api_data, rdo) {
    const vk_object = rd.viewkey,
        tx_hash = rd.txhash,
        vk = vk_object.vk,
        spk = get_spend_pubkey_from_address(rd.address),
        api_rpc_url = api_data.url,
        proxy = api_rpc_url.includes(".onion") || glob_const.inframe;
    api_proxy({
        "api_url": api_rpc_url + "/get_transactions",
        proxy,
        "params": {
            "method": "POST",
            "data": {
                "txs_hashes": [tx_hash]
            },
            "headers": {
                "Content-Type": "application/json"
            }
        }
    }).done(function(response) {
        const rpc_result = br_result(response).result;
        let matched_tx = false;
        if (rpc_result && rpc_result.txs) {
            const incoming = filter_incoming_transactions(rpc_result, vk, spk),
                parsed_tx = xmr_tx_data(incoming[0], rdo.setconfirmations);
            if (parsed_tx.txhash === tx_hash && parsed_tx.ccval) {
                matched_tx = parsed_tx;
                if (rdo.source === "requests") {
                    const tx_item = create_transaction_item(parsed_tx);
                    if (tx_item) {
                        const tx_list = rdo.transactionlist;
                        tx_list.append(tx_item.data(parsed_tx));
                    }
                }
            }
            process_scan_results(rd, api_data, rdo, matched_tx);
            return
        }
        handle_scan_failure(null, rd, api_data, rdo);
    }).fail(function(xhr, stat, err) {
        const is_proxy_error = is_proxy_fail(this.url),
            error_data = xhr || stat || err;
        handle_scan_failure({
            "error": error_data,
            "is_proxy": is_proxy_error
        }, rd, api_data, rdo);
    }).always(function() {
        update_api_source(rdo, api_data);
    });
}

// Manages XMR mempool polling failures by attempting reconnection through fallback nodes
function handle_xmr_rpc_fails(api_data) {
    stop_monitors();
    const next_rpc = get_next_rpc("monero", api_data);
    if (next_rpc) {
        init_xmr_polling(next_rpc, true);
        return
    }
    socket_info(api_data, false);
    request.monitored = false;
    br_offline(true);
    console.error("Socket error:", "unable to connect to " + api_data.url);
}

// Updates UI and payment status based on transaction confirmation count
function validate_confirmations(tx_data, direct, ln) {
    const crypto_symbol = tx_data.ccsymbol;
    if (crypto_symbol) {
        let new_status = "pending";
        closeloader();
        clear_dialog_timeout();
        if (tx_data && tx_data.ccval) {
            const payment = request.payment,
                payment_dialog = $("#paymentdialogbox"),
                status_panel = payment_dialog.find(".brstatuspanel"),
                status_header = status_panel.find("h2"),
                tx_status = tx_data.status;
            if (tx_status && tx_status === "canceled") { // Lightning
                status_header.html("<span class='icon-blocked'></span>Invoice canceled");
                payment_dialog.attr("data-status", "canceled");
                update_request({
                    "requestid": request.requestid,
                    "status": "canceled",
                    "confirmations": 0
                }, true);
                notify(tl("invoicecanceled"), 500000);
                force_close_socket();
                return "canceled";
            }
            const set_confirmations = tx_data.setconfirmations ? parseInt(tx_data.setconfirmations, 10) : 0,
                confirm_text = set_confirmations ? set_confirmations.toString() : "",
                confirm_box = status_panel.find("span.confbox"),
                confirm_span = confirm_box.find("span"),
                stored_confirms = parseFloat(confirm_span.attr("data-conf")),
                current_confirms = Number.isNaN(stored_confirms) ? 0 : stored_confirms,
                confirmations = tx_data.confirmations || 0,
                is_instant = set_confirmations === false || tx_data.instant_lock; // Dashpay instant_lock
            status_panel.find("span#confnumber").text(confirm_text);
            if (confirmations >= current_confirms || is_instant || direct) {
                clear_recent_requests();
                br_remove_session("txstatus"); // remove cached historical exchange rates
                confirm_box.removeClass("blob");
                setTimeout(function() {
                    confirm_box.addClass("blob");
                    confirm_span.text(confirmations).attr("data-conf", confirmations);
                }, 500);
                const tx_hash = tx_data.txhash,
                    eth_layer2 = tx_data.eth_layer2,
                    amount_rel = $("#open_wallet").attr("data-rel"),
                    crypto_amount = amount_rel && amount_rel.length ? parseFloat(amount_rel) : 0,
                    received_utc = request.paymenttimestamp || tx_data.transactiontime,
                    received_crypto = tx_data.ccval,
                    received_formatted = parseFloat(received_crypto.toFixed(6)),
                    current_currency = request.uoa,
                    request_type = request.requesttype,
                    is_crypto = current_currency === crypto_symbol,
                    fiat_value = is_crypto ? null : (received_formatted / parseFloat($("#paymentdialogbox .ccpool").attr("data-xrate"))) * parseFloat($("#paymentdialog .cpool[data-currency='" + current_currency + "']").attr("data-xrate")), // calculate fiat value
                    fiat_rounded = is_crypto ? null : fiat_value.toFixed(2),
                    received_amount = is_crypto ? received_crypto : fiat_rounded;
                // extend global request object
                $.extend(request, {
                    "received": true,
                    "inout": request_type,
                    "receivedamount": received_formatted,
                    "fiatvalue": fiat_value,
                    "txhash": tx_hash,
                    confirmations,
                    set_confirmations,
                    eth_layer2
                });
                // don't update time of payment
                if (!request.paymenttimestamp) {
                    request.paymenttimestamp = received_utc;
                }
                status_panel.find("span.paymentdate").html(fulldateformat(new Date(received_utc), langcode));
                if (!is_crypto) {
                    status_panel.find("span.receivedcrypto").text(received_formatted + " " + crypto_symbol);
                }
                status_panel.find("span.receivedfiat").text(" (" + received_amount + " " + current_currency + ")");
                const exact_match = helper.exact,
                    amount_valid = exact_match ? received_formatted === crypto_amount : received_formatted >= (crypto_amount * 0.97);
                if (amount_valid) {
                    if (confirmations >= set_confirmations || is_instant === true) {
                        force_close_socket();
                        play_audio("collect", payment);
                        const status_msg = request_type === "incoming" ? tl("paymentsent") : tl("paymentreceived"),
                            is_insufficient = payment_dialog.hasClass("insufficient"), // keep scanning when amount was insufficient
                            insufficient_status = is_insufficient ? "pending" : "paid",
                            insufficient_pending = is_insufficient ? "scanning" : "polling";
                        payment_dialog.addClass("transacting").attr("data-status", "paid");
                        status_header.text(status_msg);
                        request.status = insufficient_status,
                            request.pending = insufficient_pending;
                        save_payment_request(direct, ln);
                        $("span#ibstatus").fadeOut(500);
                        closenotify();
                        new_status = insufficient_status;
                    } else {
                        if (ln && request.status === "pending") {} else {
                            payment_dialog.addClass("transacting").attr("data-status", "pending");
                            const broadcast_msg = ln ? tl("waitingforpayment") : tl("txbroadcasted");
                            status_header.text(broadcast_msg);
                            request.status = "pending",
                                request.pending = "polling";
                            save_payment_request(direct, ln);
                        }
                    }
                    status_panel.find("#view_tx").attr("data-txhash", tx_hash);
                    return new_status;
                }
                if (!exact_match) {
                    status_header.text(tl("insufficientamount"));
                    payment_dialog.addClass("transacting").attr("data-status", "insufficient");
                    request.status = "insufficient",
                        request.pending = "scanning";
                    save_payment_request(direct, ln);
                    status_panel.find("#view_tx").attr("data-txhash", tx_hash);
                    new_status = "insufficient";
                }
                play_audio("funk");
            }
        }
        return new_status;
    }
    return false
}

// Terminates all active polling intervals or a specific polling instance
function stop_monitors(ping_id) {
    if (ping_id) { // close this interval
        if (glob_let.pinging[ping_id]) {
            clearInterval(glob_let.pinging[ping_id]);
            delete glob_let.pinging[ping_id]
        }
        return
    }
    if (!empty_obj(glob_let.pinging)) {
        $.each(glob_let.pinging, function(key, value) {
            clearInterval(value);
        });
        glob_let.pinging = {};
    }
}

// Removes completed payment request from local storage and updates UI state
function clear_recent_requests() {
    if (request) {
        const stored_requests = br_get_local("recent_requests");
        if (stored_requests) {
            try {
                const request_list = JSON.parse(stored_requests);
                if (request_list[request.payment]) {
                    delete request_list[request.payment];
                    br_set_local("recent_requests", request_list, true);
                    if (empty_obj(request_list)) {
                        toggle_rr(false);
                    }
                }
            } catch (error) {
                console.error("Error parsing recent requests:", error);
            }
        }
    }
}