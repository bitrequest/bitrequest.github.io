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

function blockchain_poll_data(data, setconfirmations, ccsymbol, address) { // poll blockchain.info websocket data
    if (data) {
        var outputs = data.out,
        	confirmations = (data.confirmations) ? data.confirmations : null;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, value) {
                var output_address = value.addr,
                    output_address_upper = output_address.toUpperCase(),
                    output = (output_address_upper == address.toUpperCase()) ? Math.abs(value.value) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        return {
            "ccval": (outputs) ? outputsum / 100000000 : null,
            "transactiontime": data.time * 1000,
            "txhash": data.hash,
            "confirmations": confirmations,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    } else {
        return default_tx_data();
    }
}

function blockcypher_scan_data(data, setconfirmations, ccsymbol) { // scan
    if (data) {
        var is_eth = (ccsymbol == "eth"),
			datetimeparts = (data.confirmed) ? data.confirmed.split("T") : null,
			transactiontime = (datetimeparts) ? returntimestamp(makedatestring(datetimeparts)).getTime() : null,
			ccval = (data.value) ? (is_eth === true) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : data.value / 100000000 : null,
			txhash = data.tx_hash,
			txhash_mod = (txhash) ? (is_eth === true) ? (txhash.match("^0x")) ? txhash : "0x" + txhash : txhash : null,
			confirmations = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash_mod,
            "confirmations": confirmations,
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
        	datetimeparts = (data.received) ? data.received.split("T") : null,
			transactiontime = (datetimeparts) ? returntimestamp(makedatestring(datetimeparts)).getTime() : null,
			outputs = data.outputs;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, value) {
                var satval = value.value;
                var output_address = value.addresses[0].slice(3);
                var output_address_upper = output_address.toUpperCase();
                var adress_upper = address.toUpperCase();
                var output = (adress_upper.indexOf(output_address_upper) >= 0) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        var ccval = (outputs) ? (is_eth === true) ? parseFloat((outputsum / Math.pow(10, 18)).toFixed(8)) : outputsum / 100000000 : null,
        	txhash = data.hash,
			txhash_mod = (txhash) ? (is_eth === true) ? (txhash.match("^0x")) ? txhash : "0x" + txhash : txhash : null,
			confirmations = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash_mod,
            "confirmations": confirmations,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    } else {
        return default_tx_data();
    }
}

function blockchair_scan_data(data, setconfirmations, ccsymbol, address, latestblock) { // scan/poll
    if (data) {
        var transaction = data.transaction,
        	transactiontime = (transaction) ? returntimestamp(transaction.time).getTime() : null,
			confirmations = (transaction.block_id && latestblock) ? latestblock - transaction.block_id : null,
			outputs = data.outputs;
        if (outputs) {
            var outputsum = 0;
            $.each(outputs, function(dat, val) {
                var satval = val.value,
                	output = (val.recipient == address) ? Math.abs(satval) : 0;
                outputsum += parseFloat(output) || 0; // sum of outputs
            });
        }
        var ccval = (outputs) ? outputsum / 100000000 : null,
        	txhash = (transaction) ? transaction.hash : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": confirmations,
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
        	ethvalue = (transactiontime) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : null,
			txhash = (data.transaction_hash) ? data.transaction_hash : null,
			confirmations = (data.block_id && latestblock) ? latestblock - data.block_id : null,
			recipient = (data.recipient) ? data.recipient : null;
        return {
            "ccval": ethvalue,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": confirmations,
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
			confirmations = (data.block_id && latestblock) ? latestblock - data.block_id : null,
			recipient = (data.recipient) ? data.recipient : null,
			token_symbol = (data.token_symbol) ? data.token_symbol : null;
        return {
            "ccval": erc20value,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": confirmations,
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
				confirmations = (transaction.block_id && latestblock) ? latestblock - transaction.block_id : null;
            return {
                "ccval": erc20value,
                "transactiontime": transactiontime,
                "txhash": txhash,
                "confirmations": confirmations,
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

function ethplorer_scan_data(data, setconfirmations, ccsymbol) { // scan
	if (data) {
        var transactiontime = (data.timestamp) ? data.timestamp * 1000 : null,
        	transactiontimeutc = (transactiontime) ? transactiontime + timezone : null,
			erc20value = (data.value) ? parseFloat((data.value / Math.pow(10, data.tokenInfo.decimals)).toFixed(8)) : null;
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
			confirmations = (data.confirmations) ? data.confirmations : null,
			operations = (data.operations) ? data.operations[0] : null,
			tokenValue = (operations) ? operations.value : null,
			tokenInfo = (operations) ? operations.tokenInfo : null,
			decimals = (operations) ? tokenInfo.decimals : null,
			ccval = (decimals) ? parseFloat((tokenValue / Math.pow(10, decimals)).toFixed(8)) : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": confirmations,
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
			transactiontime_utc = (transactiontime) ? transactiontime : $.now() + timezone,
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
			confirmations = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": confirmations,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    } else {
        return default_tx_data();
    }
}

function amberdata_poll_data(data, setconfirmations, ccsymbol) { // poll (websocket)
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

function infura_eth_poll_data(data, setconfirmations, ccsymbol) { // poll
    if (data) {
        var transactiontime = (data.timestamp) ? (data.timestamp * 1000) + timezone : null,
        	ethvalue = (data.value) ? parseFloat((data.value / Math.pow(10, 18)).toFixed(8)) : null,
			txhash = (data.hash) ? data.hash : null,
			confirmations = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ethvalue,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": confirmations,
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
			confirmations = (data.confirmations) ? data.confirmations : null;
        return {
            "ccval": ccval,
            "transactiontime": transactiontime,
            "txhash": txhash,
            "confirmations": confirmations,
            "setconfirmations": setconfirmations,
            "ccsymbol": ccsymbol
        };
    } else {
        return default_tx_data();
    }
}