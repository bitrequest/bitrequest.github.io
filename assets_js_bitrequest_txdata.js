// Unify transactiondata
function default_tx_data() {
    return {
        "ccval": null,
        "transactiontime": null,
        "txhash": null,
        "confirmations": null,
        "setconfirmations": null,
        "ccsymbol": null
    };
}

// Collect transactiondata and return unified object

// blockchain.info

function blockchain_ws_data(data, setconfirmations, ccsymbol, address, legacy) { // poll blockchain.info websocket data
    if (data) {
        let outputs = data.out,
            outputsum;
        if (outputs) {
            outputsum = 0;
            $.each(outputs, function(dat, value) {
                if (address == value.addr || "bitcoincash:" + address == value.addr || legacy == value.addr) {
                    outputsum += value.value || 0; // sum of outputs
                }
            });
        }
        let transactiontime = (data.time) ? data.time * 1000 : null,
            transactiontimeutc = (transactiontime) ? transactiontime + timezone : null;
        return {
            "ccval": (outputsum) ? outputsum / 100000000 : null,
            "transactiontime": transactiontimeutc,
            "txhash": data.hash,
            "confirmations": (data.confirmations) ? data.confirmations : null,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

// mempool.space

function mempoolspace_ws_data(data, setconfirmations, ccsymbol, address) { // poll mempool.space websocket data
    if (data) {
        let outputs = data.vout,
            outputsum;
        if (outputs) {
            outputsum = 0;
            $.each(outputs, function(dat, value) {
                if (address == value.scriptpubkey_address) {
                    outputsum += value.value || 0; // sum of outputs
                }
            });
        }
        let transactiontime = (data.firstSeen) ? data.firstSeen * 1000 : null,
            transactiontimeutc = (transactiontime) ? transactiontime + timezone : null;
        return {
            "ccval": (outputsum) ? outputsum / 100000000 : null,
            "transactiontime": transactiontimeutc,
            "txhash": data.txid,
            "confirmations": (data.confirmations) ? data.confirmations : null,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function blockchair_scan_data(data, setconfirmations, ccsymbol, address, latestblock) { // scan/poll
    if (data) {
        let thisaddress = (ccsymbol == "bch") ? (address.indexOf(":") > -1) ? address.split(":")[1] : address : address,
            transaction = data.transaction,
            transactiontime = (transaction) ? returntimestamp(transaction.time).getTime() : null,
            conf = (transaction.block_id && transaction.block_id > 10 && latestblock) ? (latestblock - transaction.block_id) + 1 : null,
            outputs = data.outputs;
        if (outputs) {
            outputsum = 0;
            $.each(outputs, function(dat, val) {
                let satval = val.value,
                    output = (val.recipient == thisaddress) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        let ccval = (outputs) ? outputsum / 100000000 : null,
            txhash = (transaction) ? transaction.hash : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function mempoolspace_scan_data(data, setconfirmations, ccsymbol, address, latestblock) { // scan/poll mempool.space api data
    if (data) {
        let status = data.status,
            outputs = data.vout,
            outputsum;
        if (outputs) {
            outputsum = 0;
            $.each(outputs, function(dat, value) {
                if (value.scriptpubkey_address.indexOf(address) > -1) {
                    outputsum += value.value || 0; // sum of outputs
                }
            });
        }
        let transactiontime = (status.block_time) ? (status.block_time * 1000)  + timezone : now() + timezone,
            transactiontimeutc = (transactiontime) ? transactiontime : null,
            block_height = status.block_height,
            confs = (status.confirmed) ? setconfirmations : null,
            conf = (block_height && block_height > 10 && latestblock) ? (latestblock - block_height) + 1 : confs;
        return {
            "ccval": (outputsum) ? outputsum / 100000000 : null,
            "transactiontime": transactiontimeutc,
            "txhash": data.txid,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

// dogechain

function dogechain_ws_data(data, setconfirmations, ccsymbol, address) { // poll blockchain.info websocket data
    if (data) {
        let outputs = data.outputs,
            outputsum;
        if (outputs) {
            outputsum = 0;
            $.each(outputs, function(dat, value) {
                if (address == value.addr) {
                    outputsum += value.value || 0; // sum of outputs
                }
            });
        }
        let transactiontime = (data.time) ? data.time * 1000 : null,
            transactiontimeutc = (transactiontime) ? transactiontime + timezone : null;
        return {
            "ccval": (outputsum) ? outputsum / 100000000 : null,
            "transactiontime": transactiontimeutc,
            "txhash": data.hash,
            "confirmations": (data.confirmations) ? data.confirmations : null,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

// blockcypher

function blockcypher_scan_data(data, setconfirmations, ccsymbol) { // scan
    if (data) {
        let is_eth = (ccsymbol == "eth"),
            datekey = (data.confirmed) ? data.confirmed : (data.received) ? data.received : false,
            transactiontime = to_ts(datekey),
            ccval = (data.value) ? (is_eth === true) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : data.value / 100000000 : null,
            txhash = data.tx_hash,
            txhash_mod = (txhash) ? (is_eth === true) ? (txhash.match("^0x")) ? txhash : "0x" + txhash : txhash : null,
            conf = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash_mod,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function blockcypher_poll_data(data, setconfirmations, ccsymbol, address) { // poll
    if (data) {
        let is_eth = (ccsymbol == "eth"),
            transactiontime = to_ts(data.received),
            outputs = data.outputs;
        if (outputs) {
            outputsum = 0;
            $.each(outputs, function(dat, value) {
                let satval = value.value;
                output = (str_match(address, value.addresses[0].slice(3)) === true) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        let ccval = (outputs) ? (is_eth === true) ? parseFloat((outputsum / Math.pow(10, 18)).toFixed(8)) : outputsum / 100000000 : null,
            txhash = data.hash,
            txhash_mod = (txhash) ? (is_eth === true) ? (txhash.match("^0x")) ? txhash : "0x" + txhash : txhash : null,
            conf = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash_mod,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

// blockchair

function blockchair_scan_data(data, setconfirmations, ccsymbol, address, latestblock) { // scan/poll
    if (data) {
        let thisaddress = (ccsymbol == "bch") ? (address.indexOf(":") > -1) ? address.split(":")[1] : address : address,
            transaction = data.transaction,
            transactiontime = (transaction) ? returntimestamp(transaction.time).getTime() : null,
            conf = (transaction.block_id && transaction.block_id > 10 && latestblock) ? (latestblock - transaction.block_id) + 1 : null,
            outputs = data.outputs;
        if (outputs) {
            outputsum = 0;
            $.each(outputs, function(dat, val) {
                let satval = val.value,
                    output = (val.recipient == thisaddress) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        let ccval = (outputs) ? outputsum / 100000000 : null,
            txhash = (transaction) ? transaction.hash : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function blockchair_eth_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan/poll
    if (data) {
        let transactiontime = (data.time) ? returntimestamp(data.time).getTime() : null,
            ethvalue = (data.value) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : null,
            txhash = (data.transaction_hash) ? data.transaction_hash : null,
            conf = (data.block_id && latestblock) ? latestblock - data.block_id : null,
            recipient = (data.recipient) ? data.recipient : null;
        return {
            "ccval": ethvalue,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol,
            "recipient": recipient
        };
    }
    return default_tx_data();
}

function blockchair_erc20_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan
    if (data) {
        let transactiontime = (data.time) ? returntimestamp(data.time).getTime() : null,
            erc20value = (data.value) ? parseFloat((data.value / Math.pow(10, data.token_decimals)).toFixed(8)) : null,
            txhash = (data.transaction_hash) ? data.transaction_hash : null,
            conf = (data.block_id && latestblock) ? latestblock - data.block_id : null,
            recipient = (data.recipient) ? data.recipient : null,
            token_symbol = (data.token_symbol) ? data.token_symbol : null;
        return {
            "ccval": erc20value,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol,
            "recipient": recipient,
            "token_symbol": token_symbol
        };
    }
    return default_tx_data();
}

function blockchair_erc20_poll_data(data, setconfirmations, ccsymbol, latestblock) { // poll
    if (data) {
        let transaction = data.transaction,
            tokendata = data.layer_2.erc_20[0];
        if (transaction && tokendata) {
            let transactiontime = (transaction.time) ? returntimestamp(transaction.time).getTime() : null,
                erc20value = (tokendata.value) ? parseFloat((tokendata.value / Math.pow(10, tokendata.token_decimals)).toFixed(8)) : null,
                txhash = (transaction.hash) ? transaction.hash : null,
                conf = (transaction.block_id && latestblock) ? latestblock - transaction.block_id : null;
            return {
                "ccval": erc20value,
                "transactiontime": transactiontime,
                "txhash": txhash,
                "confirmations": conf,
                "setconfirmations": setconfirmations,
                "ccsymbol": ccsymbol
            };
        }
    }
    return default_tx_data();
}

// ethplorer

function ethplorer_scan_data(data, setconfirmations, ccsymbol) { // scan
    if (data) {
        let transactiontime = (data.timestamp) ? data.timestamp * 1000 : null,
            transactiontimeutc = (transactiontime) ? transactiontime + timezone : null,
            erc20value = (data.value) ? parseFloat((data.value / Math.pow(10, data.tokenInfo.decimals)).toFixed(8)) : null,
            txhash = (data.transactionHash) ? data.transactionHash : null;
        return {
            "ccval": erc20value,
            "transactiontime": transactiontimeutc,
            "txhash": txhash,
            "confirmations": false,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function ethplorer_poll_data(data, setconfirmations, ccsymbol) { // poll
    if (data) {
        let transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : null,
            txhash = (data.hash) ? data.hash : (data.transactionHash) ? data.transactionHash : null,
            conf = (data.confirmations) ? data.confirmations : null,
            operations = (data.operations) ? data.operations[0] : null,
            tokenValue = (operations) ? operations.value : null,
            tokenInfo = (operations) ? operations.tokenInfo : null,
            decimals = (operations) ? tokenInfo.decimals : null,
            ccval = (decimals) ? parseFloat((tokenValue / Math.pow(10, decimals)).toFixed(8)) : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

// RPC templates

function nano_scan_data(data, setconfirmations, ccsymbol, txhash) { // scan/poll
    if (data) {
        let ccval = (data.amount) ? parseFloat((data.amount / Math.pow(10, 30)).toFixed(8)) : null, // convert Mnano to nano
            transactiontime = (data.local_timestamp) ? (data.local_timestamp * 1000) + timezone : null,
            transactiontime_utc = (transactiontime) ? transactiontime : now() + timezone,
            tx_hash = (data.hash) ? data.hash : (txhash) ? txhash : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime_utc,
            "txhash": tx_hash,
            "confirmations": false,
            "setconfirmations": null,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function bitcoin_rpc_data(data, setconfirmations, ccsymbol, address) { // poll
    if (data) {
        let transactiontime = (data.time) ? (data.time * 1000) + timezone : null,
            outputs = data.vout;
        if (outputs) {
            outputsum = 0;
            $.each(outputs, function(dat, value) {
                let satval = value.value * 100000000,
                    output = (value.scriptPubKey.addresses[0] == address) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        let ccval = (outputs) ? outputsum / 100000000 : null,
            txhash = (data.txid) ? data.txid : null,
            conf = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function infura_eth_poll_data(data, setconfirmations, ccsymbol) { // poll
    if (data) {
        let transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : null,
            ethvalue = (data.value) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : null,
            txhash = (data.hash) ? data.hash : null,
            conf = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ethvalue,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function infura_erc20_poll_data(data, setconfirmations, ccsymbol) { // poll
    if (data) {
        let tokenValue = (data.value) ? data.value : null,
            decimals = (data.decimals) ? data.decimals : null,
            ccval = (decimals) ? parseFloat((tokenValue / Math.pow(10, decimals)).toFixed(8)) : null,
            transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : null,
            txhash = (data.hash) ? data.hash : null,
            conf = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function infura_block_data(data, setconfirmations, ccsymbol, ts) {
    if (data) {
        let ccval = (data.value) ? parseFloat((Number(data.value) / Math.pow(10, 18)).toFixed(8)) : null,
            transactiontime = (ts) ? (Number(ts) * 1000) + timezone : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": data.hash,
            "confirmations": null,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    }
    return default_tx_data();
}

function xmr_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan
    if (data) {
        let recieved = data.total_received,
            transactiontime = to_ts(data.timestamp),
            height = (data.height) ? data.height : latestblock,
            blocks = latestblock - height,
            conf = (blocks < 0) ? 0 : blocks,
            payment_id = (data.payment_id) ? data.payment_id : false;
        return {
            "ccval": recieved / 1000000000000,
            "transactiontime": transactiontime,
            "txhash": data.hash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol,
            "payment_id": payment_id
        };
    }
    return default_tx_data();
}

function nimiq_scan_data(data, setconfirmations, latestblock, confirmed, txhash) { // scan
    if (data) {
        let transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : now() + timezone,
            confval = (confirmed) ? false :
            (data.confirmations) ? data.confirmations :
            (latestblock && data.height) ? latestblock - data.height : 0,
            conf = (confval < 0) ? 0 : confval,
            thash = (txhash) ? txhash : data.hash,
            setconf = (confirmed) ? null : setconfirmations;
        return {
            "ccval": data.value / 100000,
            "transactiontime": transactiontime,
            "txhash": thash,
            "confirmations": conf,
            "setconfirmations": setconf,
            "ccsymbol": "nim"
        };
    }
    return default_tx_data();
}

// lightning

function lnd_tx_data(data) { // poll
    let txtime = (data.txtime) ? data.txtime : data.timestamp,
        amount = parseFloat(data.amount / 100000000000);
    return {
        "ccval": Math.abs(amount),
        "transactiontime": txtime + timezone,
        "txhash": "lightning" + data.hash,
        "confirmations": data.conf,
        "setconfirmations": 1,
        "ccsymbol": "btc",
        "status": data.status
    }
}