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
        var outputs = data.out,
            outputsum;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, value) {
                if (address == value.addr || "bitcoincash:" + address == value.addr || legacy == value.addr) {
                    outputsum += value.value || 0; // sum of outputs
                }
            });
            var transactiontime = (data.time) ? data.time * 1000 : null,
                transactiontimeutc = (transactiontime) ? transactiontime + timezone : null;
            return {
                "ccval": (outputsum) ? outputsum / 100000000 : null,
                "transactiontime": transactiontimeutc,
                "txhash": data.hash,
                "confirmations": (data.confirmations) ? data.confirmations : null,
                "setconfirmations": setconfirmations,
                "ccsymbol": ccsymbol
            };
        } else {
            return false;
        }
    } else {
        return default_tx_data();
    }
}

// mempool.space

function mempoolspace_ws_data(data, setconfirmations, ccsymbol, address) { // poll mempool.space websocket data
    if (data) {
        var outputs = data.vout,
            outputsum;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, value) {
                if (address == value.scriptpubkey_address) {
                    outputsum += value.value || 0; // sum of outputs
                }
            });
            var transactiontime = (data.firstSeen) ? data.firstSeen * 1000 : null,
                transactiontimeutc = (transactiontime) ? transactiontime + timezone : null;
            return {
                "ccval": (outputsum) ? outputsum / 100000000 : null,
                "transactiontime": transactiontimeutc,
                "txhash": data.txid,
                "confirmations": (data.confirmations) ? data.confirmations : null,
                "setconfirmations": setconfirmations,
                "ccsymbol": ccsymbol
            };
        } else {
            return false;
        }
    } else {
        return default_tx_data();
    }
}

function mempoolspace_scan_data(data, setconfirmations, ccsymbol, address) { // poll mempool.space websocket data
    if (data) {
        var status = data.status,
            outputs = data.vout,
            outputsum;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, value) {
                if (address == value.scriptpubkey_address) {
                    outputsum += value.value || 0; // sum of outputs
                }
            });
            var transactiontime = (status.block_time) ? status.block_time * 1000 : now() + timezone,
                transactiontimeutc = (transactiontime) ? transactiontime + timezone : null;
            return {
                "ccval": (outputsum) ? outputsum / 100000000 : null,
                "transactiontime": transactiontimeutc,
                "txhash": data.txid,
                "confirmations": (status.confirmed === true) ? setconfirmations : null,
                "setconfirmations": setconfirmations,
                "ccsymbol": ccsymbol
            };
        } else {
            return false;
        }
    } else {
        return default_tx_data();
    }
}

// dogechain

function dogechain_ws_data(data, setconfirmations, ccsymbol, address) { // poll blockchain.info websocket data
    if (data) {
        var outputs = data.outputs,
            outputsum;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, value) {
                if (address == value.addr) {
                    outputsum += value.value || 0; // sum of outputs
                }
            });
            var transactiontime = (data.time) ? data.time * 1000 : null,
                transactiontimeutc = (transactiontime) ? transactiontime + timezone : null;
            return {
                "ccval": (outputsum) ? outputsum / 100000000 : null,
                "transactiontime": transactiontimeutc,
                "txhash": data.hash,
                "confirmations": (data.confirmations) ? data.confirmations : null,
                "setconfirmations": setconfirmations,
                "ccsymbol": ccsymbol
            };
        } else {
            return false;
        }
    } else {
        return default_tx_data();
    }
}

// blockcypher

function blockcypher_scan_data(data, setconfirmations, ccsymbol) { // scan
    if (data) {
        var is_eth = (ccsymbol == "eth"),
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
    } else {
        return default_tx_data();
    }
}

function blockcypher_poll_data(data, setconfirmations, ccsymbol, address) { // poll
    if (data) {
        var is_eth = (ccsymbol == "eth"),
            transactiontime = to_ts(data.received),
            outputs = data.outputs;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, value) {
                var satval = value.value,
                    output_address = value.addresses[0].slice(3),
                    output_address_upper = output_address.toUpperCase(),
                    adress_upper = address.toUpperCase(),
                    output = (adress_upper.indexOf(output_address_upper) >= 0) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        var ccval = (outputs) ? (is_eth === true) ? parseFloat((outputsum / Math.pow(10, 18)).toFixed(8)) : outputsum / 100000000 : null,
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
    } else {
        return default_tx_data();
    }
}

// blockchair

function blockchair_scan_data(data, setconfirmations, ccsymbol, address, latestblock) { // scan/poll
    if (data) {
        var thisaddress = (ccsymbol == "bch") ? (address.indexOf(":") > -1) ? address.split(":")[1] : address : address,
            transaction = data.transaction,
            transactiontime = (transaction) ? returntimestamp(transaction.time).getTime() : null,
            conf = (transaction.block_id && transaction.block_id > 10 && latestblock) ? (latestblock - transaction.block_id) + 1 : null,
            outputs = data.outputs;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, val) {
                var satval = val.value,
                    output = (val.recipient == thisaddress) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        var ccval = (outputs) ? outputsum / 100000000 : null,
            txhash = (transaction) ? transaction.hash : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    } else {
        return default_tx_data();
    }
}

function blockchair_eth_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan/poll
    if (data) {
        var transactiontime = (data.time) ? returntimestamp(data.time).getTime() : null,
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
    } else {
        return default_tx_data();
    }
}

function blockchair_erc20_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan
    if (data) {
        var transactiontime = (data.time) ? returntimestamp(data.time).getTime() : null,
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
    } else {
        return default_tx_data();
    }
}

function blockchair_erc20_poll_data(data, setconfirmations, ccsymbol, latestblock) { // poll
    if (data) {
        var transaction = data.transaction,
            tokendata = data.layer_2.erc_20[0];
        if (transaction && tokendata) {
            var transactiontime = (transaction.time) ? returntimestamp(transaction.time).getTime() : null,
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
        } else {
            return default_tx_data();
        }
    } else {
        return default_tx_data();
    }
}

// amberdata

function amberdata_scan_data(data, setconfirmations, ccsymbol, address) {
    if (data) {
        var transactiontime = (data.timestamp) ? to_ts(data.timestamp) : null,
            outputs = data.outputs;
        if (outputs) {
            var thisaddress = (ccsymbol == "bch") ? (address.indexOf(":") > -1) ? address : "bitcoincash:" + address : address,
                outputsum = 0;
            $.each(outputs, function(dat, val) {
                var satval = val.value,
                    output = (val.addresses[0] == thisaddress) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        var ccval = (outputs) ? outputsum / 100000000 :
            (ccsymbol == "eth") ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : null,
            txhash = data.hash;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": data.confirmations,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    } else {
        return default_tx_data();
    }
}

function amberdata_scan_token_data(data, setconfirmations, ccsymbol) {
    if (data) {
        var transactiontime = (data.timestamp) ? data.timestamp + timezone : null,
            erc20value = (data.amount) ? parseFloat((data.amount / Math.pow(10, data.decimals)).toFixed(8)) : null,
            symbol = data.symbol,
            conf = 1; // no confirmation data available
        return {
            "ccval": erc20value,
            "transactiontime": transactiontime,
            "txhash": data.transactionHash,
            "confirmations": conf,
            "setconfirmations": conf,
            "ccsymbol": ccsymbol,
            "tokensymbol": symbol.toLowerCase()
        };
    } else {
        return default_tx_data();
    }
}

function amberdata_poll_token_data(data, setconfirmations, ccsymbol, txhash, conf) {
    if (data) {
        var transactiontime = (data.timestamp) ? to_ts(data.timestamp) : null,
            erc20value = (data.amount) ? parseFloat((data.amount / Math.pow(10, data.decimals)).toFixed(8)) : null,
            symbol = data.symbol;
        return {
            "ccval": erc20value,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": conf,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol,
            "tokensymbol": symbol.toLowerCase()
        };
    } else {
        return default_tx_data();
    }
}

function amberdata_ws_data(data, setconfirmations, ccsymbol) { // poll (websocket)
    if (data) {
        var transactiontime = (data.timestamp) ? (data.timestamp) + timezone : null,
            txhash = (data.hash) ? data.hash : null,
            ccval = (data.value) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": null,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    } else {
        return default_tx_data();
    }
}

function amberdata_ws_btc_data(data, setconfirmations, ccsymbol, address) { // poll (websocket)
    if (data) {
        var transactiontime = (data.timestamp) ? data.timestamp + timezone : null,
            txhash = (data.hash) ? data.hash : null,
            outputs = data.outputs,
            outputsum;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, value) {
                var addrstr = value.addresses.toString(),
                    output = (addrstr.indexOf(address) > -1) ? value.value : 0;
                outputsum += output || 0; // sum of outputs
            });
        }
        var ccval = (outputsum) ? outputsum / 100000000 : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": null,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    } else {
        return default_tx_data();
    }
}

// ethplorer

function ethplorer_scan_data(data, setconfirmations, ccsymbol) { // scan
    if (data) {
        var transactiontime = (data.timestamp) ? data.timestamp * 1000 : null,
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
    } else {
        return default_tx_data();
    }
}

function ethplorer_poll_data(data, setconfirmations, ccsymbol) { // poll
    if (data) {
        var transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : null,
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
    } else {
        return default_tx_data();
    }
}

// RPC templates

function nano_scan_data(data, setconfirmations, ccsymbol, txhash) { // scan/poll
    if (data) {
        var ccval = (data.amount) ? parseFloat((data.amount / Math.pow(10, 30)).toFixed(8)) : null, // convert Mnano to nano
            transactiontime = (data.local_timestamp) ? (data.local_timestamp * 1000) + timezone : null,
            transactiontime_utc = (transactiontime) ? transactiontime : now() + timezone,
            txhash = (data.hash) ? data.hash : (txhash) ? txhash : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime_utc,
            "txhash": txhash,
            "confirmations": false,
            "setconfirmations": null,
            "ccsymbol": ccsymbol
        };
    } else {
        return default_tx_data();
    }
}

function bitcoin_rpc_data(data, setconfirmations, ccsymbol, address) { // poll
    if (data) {
        var transactiontime = (data.time) ? (data.time * 1000) + timezone : null,
            outputs = data.vout;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, value) {
                var satval = value.value * 100000000,
                    output = (value.scriptPubKey.addresses[0] == address) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        var ccval = (outputs) ? outputsum / 100000000 : null,
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
    } else {
        return default_tx_data();
    }
}

function infura_eth_poll_data(data, setconfirmations, ccsymbol) { // poll
    if (data) {
        var transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : null,
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
    } else {
        return default_tx_data();
    }
}

function infura_erc20_poll_data(data, setconfirmations, ccsymbol) { // poll
    if (data) {
        var tokenValue = (data.value) ? data.value : null,
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
    } else {
        return default_tx_data();
    }
}

function xmr_scan_data(data, setconfirmations, ccsymbol, latestblock) { // scan
    if (data) {
        var recieved = data.total_received,
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
    } else {
        return default_tx_data();
    }
}

function nimiq_scan_data(data, setconfirmations, latestblock, confirmed, txhash) { // scan
    if (data) {
        var transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : now() + timezone,
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
    } else {
        return default_tx_data();
    }
}

// lightning

function lnd_tx_data(data) { // poll
    var txtime = (data.txtime) ? data.txtime : data.timestamp;
    return {
        "ccval": parseFloat(data.amount / 100000000000),
        "transactiontime": txtime + timezone,
        "txhash": "lightning" + data.hash,
        "confirmations": data.conf,
        "setconfirmations": 1,
        "ccsymbol": "btc",
        "status": data.status
    }
}