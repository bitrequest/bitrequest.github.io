$(document).ready(function() {
    //init_socket
    //init_xmr_node
    //ping_xmr_node
    //blockchain_btc_socket
    //blockcypher_websocket
    //nano_socket
    //amberdata_eth_websocket
    //web3_erc20_websocket
    //handle_socket_fails
    //try_next_socket
    reconnect();
});

// Websockets / Pollfunctions

function init_socket(socket_node, address) {
	if (offline === true) {
        notify("You are currently offline, request is not monitored");
    } else {
        var payment = request.payment;
        if (socket_node) {
            var socket_name = socket_node.name;
            socket_attempt[btoa(socket_node.url)] = true;
        }
        if (payment == "bitcoin") {
            closesocket();
            if (socket_name == "blockcypher websocket") {
                blockcypher_websocket(socket_node, address);
            } else if (socket_name == "blockchain.info websocket") {
                blockchain_btc_socket(socket_node, address);
            } else {
                blockcypher_websocket(socket_node, address);
            }
        } else if (payment == "litecoin" || payment == "dogecoin") {
            closesocket();
            blockcypher_websocket(socket_node, address);
        } else if (payment == "nano") {
            closesocket();
            nano_socket(socket_node, address);
        } else if (payment == "ethereum") {
            closesocket();
            amberdata_eth_websocket(socket_node, address);
        } else if (payment == "monero") {
	        clearpingtx("close");
	        var vk = get_vk(address);
			if (vk) {
				request.monitored = true;
				request.viewkey = vk;
				var starttime = $.now();
	            closenotify();
	            init_xmr_node(9, starttime, address, vk);
            }
            else {
	            request.monitored = false;
	            request.viewkey = false;
	            notify("this address is not monitored", 500000, "yes");
            }
        } else if (request.erc20 === true) {
            clearpingtx("close");
            web3_erc20_websocket(socket_node, address);
        } else {
            notify("this currency is not monitored", 500000, "yes")
        }
    }
}

function init_xmr_node(cachetime, starttime, address, vk, txhash, start) {
	var payload = {
    	"address":address,
    	"view_key":vk,
    	"create_account":true,
    	"generated_locally":false
    };
    api_proxy({
        "api": "xmr_node",
        "search": "login",
        "cachetime": 25,
        "cachefolder": "1h",
        "params": {
            "method": "POST",
            "data": JSON.stringify(payload),
            "headers": {
                "Content-Type": "text/plain"
            }
        }
    }).done(function(e) {
        var data = br_result(e).result;
        if (data.start_height) { // success!
	        if (start === true) {
		        ping_xmr_node(cachetime, starttime, address, vk, txhash);
	        }
	        pingtx = setInterval(function() {
				ping_xmr_node(cachetime, starttime, address, vk, txhash);
			}, 10000);
        }
        else {
	        var errormessage = data.Error,
	        	error = (errormessage) ? errormessage : "Invalid Viewkey";
	        notify("error", error);
        }
        
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
        notify("error", "Error verifying Viewkey");
    });
}

function ping_xmr_node(cachetime, starttime, address, vk, txhash) {
	var starttime_utc = starttime + timezone,
		payload = {
    	"address":address,
    	"view_key":vk
    };
    api_proxy({
        "api": "xmr_node",
        "search": "get_address_txs",
        "cachetime": cachetime,
        "cachefolder": "1h",
        "params": {
            "method": "POST",
            "data": JSON.stringify(payload),
            "headers": {
                "Content-Type": "text/plain"
            }
        }
    }).done(function(e) {
        var data = br_result(e).result,
	        transactions = data.transactions;
	    if (transactions) {
			$.each(data.transactions, function(dat, value) {
                var setconf = request.set_confirmations,
                	txd = xmr_scan_data(value, setconf, "xmr", data.blockchain_height);
                if (txd) {
	                if (txd.ccval) {
		                if (txhash) {
			                if (txhash == txd.txhash) {
				                confirmations(txd);
								return false;
			            	}
			            }
			            else {
				            if (txd.transactiontime > starttime_utc && txd.ccval) {
					            clearpingtx();
					            if (setconf > 0) {
						            confirmations(txd);
						            pingtx = setInterval(function() {
										ping_xmr_node(34, starttime, address, vk, txd.txhash);	
									}, 35000);
					            }
					            confirmations(txd, true);
								return false;
							}
			            }
                    }
                }
            });
        }
   	}).fail(function(jqXHR, textStatus, errorThrown) {
        clearpingtx();
        var error_object = (errorThrown) ? errorThrown : jqXHR,
        	payment = request.payment;
        handle_api_fails(false, error_object, payment, payment, txhash);
        return false;
    });
}

// Websockets

function blockchain_btc_socket(socket_node, thisaddress) {
    var provider = socket_node.url;
    websocket = new WebSocket(provider);
    websocket.onopen = function(e) {
        setTimeout(function() {
            chainstate("Monitoring address");
        }, 3500);
        console.log("Connected: " + provider + "/" + thisaddress);
        var ping_event = JSON.stringify({
            op: "addr_sub",
            addr: thisaddress
        });
        console.log(ping_event);
        websocket.send(ping_event);
        ping = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        console.log(e);
        var json = JSON.parse(e.data).x
        txhash = json.hash;
        console.log(json);
        if (txhash) {
            if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                paymentdialogbox.removeClass("transacting");
                var reconnectbttn = (txid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + txid + "'>Reconnect</span></div></p>" : "",
                    content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + reconnectbttn;
                closesocket();
                popdialog(content, "alert", "canceldialog");
            } else {
                txid = txhash;
                closesocket();
                var txd = blockcypher_poll_data(json, request.set_confirmations, request.currencysymbol, thisaddress);
                pick_monitor(txhash, txd);
            }
        }

    };
    websocket.onclose = function(e) {
        chainstate("Connection ended");
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, "blockchain.info", thisaddress, e.data)
        return false;
    };
}

function blockcypher_websocket(socket_node, thisaddress) {
    var provider = socket_node.url + request.currencysymbol + "/main";
    websocket = new WebSocket(provider);
    websocket.onopen = function(e) {
        setTimeout(function() {
            chainstate("Monitoring address");
        }, 3500);
        console.log("Connected: " + provider + "/" + thisaddress);
        var ping_event = JSON.stringify({
            event: "tx-confirmation",
            address: thisaddress,
            token: get_blockcypher_apikey(),
            confirmations: 10
        });
        websocket.send(ping_event);
        ping = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        var data = JSON.parse(e.data);
        if (data.event == "pong") {} else {
            var txhash = data.hash;
            if (txhash) {
                if (paymentdialogbox.hasClass("transacting") && txid != txhash) {
                    paymentdialogbox.removeClass("transacting");
                    var reconnectbttn = (txid) ? "<p style='margin-top:2em'><div class='button'><span id='reconnect' class='icon-connection' data-txid='" + txid + "'>Reconnect</span></div></p>" : "",
                        content = "<h2 class='icon-blocked'>Websocket closed</h2><p>The websocket was closed due to multiple incoming transactions</p>" + reconnectbttn;
                    closesocket();
                    popdialog(content, "alert", "canceldialog");
                } else {
                    txid = txhash;
                    closesocket();
                    var txd = blockcypher_poll_data(data, request.set_confirmations, request.currencysymbol, thisaddress);
                    pick_monitor(txhash, txd);
                }
            }
        }
    };
    websocket.onclose = function(e) {
        chainstate("Connection ended");
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        handle_socket_fails(socket_node, "blockcypher", thisaddress, e.data)
        return false;
    };
}

function nano_socket(socket_node, thisaddress) {
    var address_mod = (thisaddress.match("^xrb")) ? "nano_" + thisaddress.split("_").pop() : thisaddress, // change nano address prefix xrb_ to nano untill websocket support
        provider = socket_node.url;
    websocket = new WebSocket(provider);
    websocket.onopen = function(e) {
        setTimeout(function() {
            chainstate("Monitoring address");
        }, 3500);
        console.log("Connected: " + provider);
        var ping_event = JSON.stringify({
            action: "subscribe",
            topic: "confirmation",
            all_local_accounts: true,
            options: {
                accounts: [address_mod]
            },
            ack: true
        });
        websocket.send(ping_event);
        ping = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        var now_utc = $.now() + timezone,
            json = JSON.parse(e.data),
            data = json.message;
        if (data) {
            var txd = nano_scan_data(data, undefined, request.currencysymbol),
                tx_timestamp = txd.transactiontime,
                timestamp_difference = Math.abs(tx_timestamp - now_utc);
            if (timestamp_difference < 60000) { // filter transactions longer then a minute ago
                closesocket();
                pick_monitor(data.hash, txd);
            }
        }
    };
    websocket.onclose = function(e) {
        chainstate("Connection ended", "offline");
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        var socketname = socket_node.name,
            s_name = (socketname) ? socketname : "nano Node";
        handle_socket_fails(socket_node, s_name, thisaddress, e.data);
        return false;
    };
}

function amberdata_eth_websocket(socket_node, thisaddress) {
    var socket_url = socket_node.url,
        ak = get_amberdata_apikey();
    var provider = socket_url + "?x-api-key=" + ak;
    websocket = new WebSocket(provider);
    websocket.onopen = function(e) {
        setTimeout(function() {
            chainstate("Monitoring address");
        }, 3500);
        console.log("Connected: " + socket_url);
        var ping_event = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "subscribe",
            params: [
                "address:pending_transactions",
                {
                    "address": thisaddress
                }
            ]
        });
        websocket.send(ping_event);
        ping = setInterval(function() {
            websocket.send(ping_event);
        }, 55000);
    };
    websocket.onmessage = function(e) {
        var data = JSON.parse(e.data),
            params = (data.params);
        if (params) {
            if (params.result.to == thisaddress.toLowerCase()) {
                var result = params.result,
                    txhash = result.hash,
                    txd = amberdata_poll_data(result, request.set_confirmations, request.currencysymbol);
                closesocket();
                pick_monitor(txhash, txd);
                return false;
            }
        }
    };
    websocket.onclose = function(e) {
        chainstate("Connection ended");
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        var socketname = socket_node.name,
            s_name = (socketname) ? socketname : "Amberdata";
        handle_socket_fails(socket_node, s_name, thisaddress, e.data);
        return false;
    };
}

function web3_erc20_websocket(socket_node, thisaddress) {
    var provider_url = socket_node.url,
        if_id = get_infura_apikey(provider_url),
        provider = provider_url + if_id;
    websocket = new WebSocket(provider);
    websocket.onopen = function(e) {
        setTimeout(function() {
            chainstate("Monitoring address");
        }, 3500);
        console.log("Connected: " + provider_url);
        var ping_event = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_subscribe",
            params: [
                "logs",
                {
                    "address": request.token_contract,
                    "topics": []
                }
            ]
        });
        websocket.send(ping_event);
    };
    websocket.onmessage = function(e) {
        var dat = JSON.parse(e.data),
            params = (dat.params);
        if (params) {
            var result = params.result,
                contractdata = result.data,
                cd_hex = contractdata.slice(2),
                token_value = web3.utils.hexToNumberString(cd_hex),
                token_decimals = request.decimals,
                ccval = parseFloat((token_value / Math.pow(10, token_decimals)).toFixed(8));
            if (ccval === Infinity) {} else {
                var cryptoval = $("#shareccinputmirror > span").text(),
                    urlamount = parseFloat(cryptoval).toFixed(8),
                    amountnumber = parseFloat(urlamount),
                    percent = (ccval / amountnumber) * 100;
                if (percent > 70 && percent < 130) { // only scan amounts with a margin less then 20%
                    var txhash = result.transactionHash;
                    web3.eth.getTransaction(txhash, function(err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(data);
                            if (data) {
                                var input = data.input,
                                    address_upper = thisaddress.slice(3).toUpperCase(),
                                    input_upper = input.toUpperCase();
                                if (input_upper.indexOf(address_upper) >= 0) {
                                    closesocket();
                                    var amount_hex = input.slice(74, input.length),
                                        txd = infura_erc20_poll_data({
                                            "timestamp": parseFloat(($.now() / 1000).toFixed(0)),
                                            "hash": txhash,
                                            "confirmations": 0,
                                            "value": web3.utils.hexToNumberString(amount_hex),
                                            "decimals": token_decimals
                                        }, request.set_confirmations, request.currencysymbol);
                                    pick_monitor(txhash, txd);
                                    return false;
                                }
                            }
                        }
                    });
                }
            }
        }
    };
    websocket.onclose = function(e) {
        chainstate("Connection ended");
        console.log("Disconnected");
        txid = null;
    };
    websocket.onerror = function(e) {
        var socketname = socket_node.name,
            s_name = (socketname) ? socketname : "infura.io";
        handle_socket_fails(socket_node, s_name, thisaddress, e);
        return false;
    };
}

function handle_socket_fails(socket_node, socketname, thisaddress, error) {
    var next_socket = try_next_socket(socket_node);
    if (next_socket === false) {
        console.log(error);
        fail_dialogs(socketname, "unable to connect to " + socketname);
        notify("this currency is not monitored", 500000, "yes");
    } else {
        closesocket();
        init_socket(next_socket, thisaddress);
    }
}

function try_next_socket(current_socket_data) {
    if (current_socket_data) {
        var current_socket_url = current_socket_data.url,
            sockets = helper.socket_list,
            socketlist = (sockets.options) ? $.merge(sockets.apis, sockets.options) : sockets.apis,
            socket_index;
        $.each(socketlist, function(i, val) {
            if (val.url == current_socket_url) {
                socket_index = i;
            }
        });
        if (socket_index !== undefined) {
            var next_scan = socketlist[socket_index + 1],
                next_socket = (next_scan) ? next_scan : socketlist[0];
            if (socket_attempt[btoa(next_socket.url)] === true) {
                return false;
            } else {
                return next_socket;
            }
        }
    } else {
        return false;
    }
}

function reconnect() {
    $(document).on("click touch", "#reconnect", function() {
        var txhash = $(this).attr("data-txid");
        canceldialog();
        pick_monitor(txhash);
    });
}