<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
header("Access-Control-Allow-Origin: *");

include_once "../../../filter.php";

/**
 * Electrum protocol handler with Tor support
 * Allows communication with Electrum servers, including .onion addresses via Tor
 */

// Handle direct requests with Tor support
$pd = file_get_contents("php://input");
$pd_obj = json_decode($pd, true);
if (isset($pd_obj["fetch"])) {
	if (has_tor()) {
		$response = socket_fetch_tor_stream($pd_obj);
		echo json_encode($response);
		return;
	}
	echo json_encode(err_obj("411", "TOR not supported on " . $_SERVER["HTTP_HOST"]));
	return;
}

// Main socket fetch function that handles both Tor and non-Tor connections
function socket_fetch($pl) {
	$node = $pl["node"];
	if (strpos($node, ".onion") !== false) {
		if (has_tor()) { // check for TOR support
			return socket_fetch_tor_stream($pl);
		}
		$tor_proxy = $pl["tor_proxy"] ?? TOR_PROXY;
		if ((strpos($tor_proxy, $_SERVER["HTTP_HOST"]) !== false)) {
			return err_obj("411", "Failed to connect via Tor");
		}
		// Call default proxy if TOR is not installed
		$ch = curl_init();
		if ($ch === false) {  // Added curl initialization check
			return err_obj("411", "Failed to initialize CURL");
		}
		$payload = ["fetch" => "true"];
		$merged = array_merge($payload, $pl);
		$tor_url = $tor_proxy . "/proxy/v1/custom/rpcs/electrum/index.php";
		curl_setopt($ch, CURLOPT_URL, $tor_url);
		curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($merged));
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
		curl_setopt($ch, CURLOPT_TIMEOUT, 20); // timeout in seconds
		
		$response = curl_exec($ch);
		$curl_error = curl_errno($ch);
		$error_message = $curl_error ? curl_error($ch) : null;
		
		curl_close($ch);
		if ($curl_error) {
			return err_obj("411", $error_message);
		}
		if ($response) {
			return json_decode($response, true);
		} 
		return err_obj("411", "no result");
	}
	// Original function for non-Tor addresses
	return socket_fetch_ssl($pl);
}

// Handles communication with Electrum servers via Tor's SOCKS proxy
function socket_fetch_tor_stream($pl) {
	// Add better error handling for missing input
	if (!isset($pl["node"]) || !isset($pl["method"])) {
		return ["error" => "Missing required parameters", "error_code" => 400];
	}
	$request = [
		"id" => $pl["id"],
		"method" => $pl["method"]
	];
	if (isset($pl["ref"])) {
		$request["params"] = [$pl["ref"]];
	};
	$jsonRequest = json_encode($request) . "\n";
	
	// Parse the node parameter to extract host and port
	$parts = explode(":", $pl["node"]);
	$host = $parts[0];
	$port = isset($parts[1]) ? intval($parts[1]) : 50001; // Default to 50001 if port not specified
	
	// Try raw socket connection through Tor's SOCKS proxy
	$context = @stream_context_create([
		"ssl" => [
			"verify_peer" => true, 
			"verify_peer_name" => true
		]
	]);
	$errno = 0;
	$errstr = "";
	
	// Connect to Tor's SOCKS proxy with "127.0.0.1"
	$proxy = @fsockopen("127.0.0.1", 9050, $errno, $errstr, 5);
	
	if (!$proxy) {
		// Connect to Tor's SOCKS proxy with "localhost"
		$proxy = @fsockopen("localhost", 9050, $errno, $errstr, 5);
	}
	
	if (!$proxy) {
		return ["error" => "Could not connect to Tor proxy: $errstr", "error_code" => $errno];
	}
	
	try {
		// SOCKS5 handshake
		// Initial handshake - no authentication
		fwrite($proxy, "\x05\x01\x00");
		$response = fread($proxy, 2);
		
		if (!$response || strlen($response) < 2 || ord($response[0]) != 5 || ord($response[1]) != 0) {
			fclose($proxy);
			return ["error" => "SOCKS5 handshake failed", "error_code" => 1];
		}
		
		// Use the host and port from the $node parameter
		// Connect command
		$socks_request = "\x05\x01\x00\x03" . chr(strlen($host)) . $host . pack("n", $port);
		fwrite($proxy, $socks_request);
		
		// Read response (at least 7 bytes: version, status, reserved, type, and at least 1 byte of addr and 2 of port)
		$response = fread($proxy, 7);
		
		if (!$response || strlen($response) < 7 || ord($response[0]) != 5 || ord($response[1]) != 0) {
			fclose($proxy);
			return ["error" => "SOCKS5 connection request failed: " . ord($response[1]), "error_code" => 2];
		}
		
		// Read the rest of the response if needed (depends on address type)
		$addrType = ord($response[3]);
		if ($addrType == 1) { // IPv4
			fread($proxy, 4 + 2 - (strlen($response) - 4)); // 4 bytes for IPv4, 2 for port, minus what we've already read
		} elseif ($addrType == 3) { // Domain name
			$domainLen = ord($response[4]);
			fread($proxy, $domainLen + 2 - (strlen($response) - 5)); // domain length + 2 for port, minus what we've already read
		} elseif ($addrType == 4) { // IPv6
			fread($proxy, 16 + 2 - (strlen($response) - 4)); // 16 bytes for IPv6, 2 for port, minus what we've already read
		}
		
		// At this point, the SOCKS connection is established
		// Now send the JSON request directly through the proxy
		fwrite($proxy, $jsonRequest);
		
		// Read response with timeout
		stream_set_timeout($proxy, 20);
		$response = fgets($proxy);
		fclose($proxy);
		
		if (isset($response)) {
			return fetch_methods($response, $pl);
		}
		
		return ["error" => "Failed to read response", "error_code" => 3];
		
	} catch (Exception $e) {
		if (isset($proxy) && is_resource($proxy)) {
			fclose($proxy);
		}
		return ["error" => $e->getMessage(), "error_code" => $e->getCode()];
	}
}

// Handles communication with Electrum servers via SSL socket connections
function socket_fetch_ssl($pl) {
	// Define error codes
	$ERROR_MISSING_PARAMS = 400;
	$ERROR_SSL_CONNECTION = 1100;
	$ERROR_NO_RESPONSE = 1103;
	$ERROR_TIMEOUT = 1104;
	
	// Input validation
	if (!isset($pl["node"])) {
		return ["error" => "Missing required node parameter", "error_code" => $ERROR_MISSING_PARAMS];
	}
	
	$request = request_data($pl);
	$jsonRequest = json_encode($request) . "\n";
	$socket = null;
	
	try {
		// Create SSL context without verification (not recommended for production)
		$context = stream_context_create([
			"ssl" => [
				"verify_peer" => false, 
				"verify_peer_name" => false
			]
		]);
		
		// Connect to the SSL server
		$socket = stream_socket_client(
			"ssl://" . $pl["node"], 
			$errno, 
			$errstr, 
			10, 
			STREAM_CLIENT_CONNECT, 
			$context
		);
		
		if (!$socket) {
			return [
				"error" => "Could not connect to SSL server: $errstr", 
				"error_code" => $ERROR_SSL_CONNECTION
			];
		}
		
		// Set timeout and send request
		stream_set_timeout($socket, 60);
		fwrite($socket, $jsonRequest);
		$response = fgets($socket);
		
		// Check for timeout
		$info = stream_get_meta_data($socket);
		if ($info["timed_out"]) {
			return ["error" => "Connection timed out", "error_code" => $ERROR_TIMEOUT];
		}
		
		if (!empty($response)) {
			return fetch_methods($response, $pl);
		}
		
		return ["error" => "Failed to read response", "error_code" => $ERROR_NO_RESPONSE];
		
	} catch (Exception $e) {
		return ["error" => $e->getMessage(), "error_code" => $e->getCode()];
	} finally {
		// Always close the socket resource if it exists
		if (isset($socket) && is_resource($socket)) {
			fclose($socket);
		}
	}
}

// Prepares request data for Electrum protocol based on input parameters
function request_data($pl) {
	$request = [
		"id" => $pl["id"],
		"method" => $pl["method"]
	];
	if (isset($pl["ref"])) {
		$request["params"] = [$pl["ref"]];
	};
	return $request;
}

// Processes response data based on the requested method type and parameters
function fetch_methods($response, $pl) {
	$rep_json = json_decode($response, true);
	if (isset($rep_json["result"])) {
		$result = $rep_json["result"];
		$method = $pl["method"];
		if ($method == "blockchain.scripthash.get_history") {
			if (is_array($result)) {
				$count = count($result);
				if ($count === 0) {
					return [];
				}
				$node = $pl["node"];
				if ($pl["id"] == "scanning") {
					if ($count > 1) {
						$last_four = get_last_four_reversed($result);
						return output_tx_hashes($node, $last_four);
					}
					return complement_tx($node, $result);
				}
				$tx_hash = $pl["tx_hash"];
				if ($tx_hash) {
					$find_tx = find_transaction($result, $tx_hash);
					if ($find_tx) {
						return complement_tx($node, $find_tx);
					}
					return [];
				}
			}
			return [];
		}
		if ($method == "blockchain.block.header") {
			return ["timestamp" => get_timestamp($result)];
		}
		if (is_numeric($result)) {
			return ["value" => $result];
		}
		if ($method == "blockchain.transaction.get") {
			return decode_bitcoin_tx($result);
		}
		return $result;
	}
	return err_obj("4112", "no result");
}

// Extracts timestamp from a block header hexadecimal string
function get_timestamp($hex) {
	return (int)hexdec(implode("", array_reverse(str_split(substr($hex, 136, 8), 2))));
}

// Gets the last 4 transactions from history and reverses their order for processing
function get_last_four_reversed($transactions) {
	// Get the last 4 entries (or all if less than 4)
	$count = count($transactions);
	$limit = min(4, $count);
	$last_entries = array_slice($transactions, -$limit);
	
	// Reverse the array
	$reversed_entries = array_reverse($last_entries);  
	return $reversed_entries;
}

// Finds a specific transaction by hash in an array of transactions
function find_transaction($transactions, $tx_hash) {
	foreach ($transactions as $transaction) {
		if (isset($transaction["tx_hash"]) && $transaction["tx_hash"] === $tx_hash) {
			return $transaction;
		}
	} 
	return [];
}

// Processes multiple transactions and enriches them with additional blockchain data
function output_tx_hashes($node, $transactions) {
	$result_array = [];  
	if (empty($transactions) || !is_array($transactions)) {
		return ["error" => "No transactions to process", "error_code" => 4110];
	}	    
	foreach ($transactions as $index => $transaction) {
		$result = complement_tx($node, $transaction);
		if (isset($result) && !isset($result["error"])) {
			$result_array[] = $result;
		}
	}    
	return empty($result_array) ? ["error" => "Failed to process any transactions", "error_code" => 4111] : $result_array;
}

// Fetches additional transaction data and block details to enrich transaction information
function complement_tx($node, $transaction) {
	$tx = isset($transaction["tx_hash"]) ? $transaction : $transaction[0];
	if (!isset($tx)) {
		return ["error" => "No transaction data", "error_code" => 4119];
	}
	$tx_hash = $tx["tx_hash"];
	
	// First TOR request
	$tx_hex = socket_fetch([
		"id" => get_random_id(),
		"method" => "blockchain.transaction.get",
		"ref" => $tx_hash,
		"node" => $node
	]);
	
	if (!$tx_hex) {
		return ["error" => "Could not fetch transaction data", "error_code" => 4120];
	}
	
	// Process transaction data
	$fetch_tx = decode_bitcoin_tx($tx_hex);
	// Second TOR request
	$height = $tx["height"];
	$fetch_block = socket_fetch([
		"id" => get_random_id(),
		"method" => "blockchain.block.header",
		"ref" => $height,
		"node" => $node
	]);
	
	if (!$fetch_block || !isset($fetch_block["timestamp"])) {
		return ["error" => "Could not fetch block data", "error_code" => 4121];
	}
	
	// Complete the transaction data
	$fetch_tx["tx_hash"] = $tx_hash;
	$fetch_tx["height"] = $height;
	$fetch_tx["timestamp"] = $fetch_block["timestamp"];
	
	return $fetch_tx;
}

// Generates a random ID string for request identification
function get_random_id() {
	return substr(bin2hex(random_bytes(8)), 0, 5);
}

// Decodes a Bitcoin transaction from hex format into structured data
function decode_bitcoin_tx($hex_data) {
	if (is_array($hex_data)) {
		return $hex_data;
	}
	// Initialize position and convert hex to binary
	$position = 0;
	$data = hex2bin($hex_data);
	
	// Helper functions for reading data
	$read_bytes = function($length) use (&$data, &$position) {
		$result = substr($data, $position, $length);
		$position += $length;
		return $result;
	};
	
	$read_uint16 = function() use (&$read_bytes) {
		return unpack("v", $read_bytes(2))[1];
	};
	
	$read_uint32 = function() use (&$read_bytes) {
		return unpack("V", $read_bytes(4))[1];
	};
	
	$read_uint64 = function() use (&$read_bytes) {
		$values = unpack("V2", $read_bytes(8));
		return $values[1] + ($values[2] * 4294967296);
	};
	
	$read_var_int = function() use (&$read_bytes, &$read_uint16, &$read_uint32, &$read_uint64) {
		$first = ord($read_bytes(1));
		if ($first < 0xfd) return $first;
		if ($first === 0xfd) return $read_uint16();
		if ($first === 0xfe) return $read_uint32();
		return $read_uint64();
	};
	
	$read_string = function() use (&$read_var_int, &$read_bytes) {
		return bin2hex($read_bytes($read_var_int()));
	};
	
	$flip_endianness = function($hex) {
		return implode("", array_reverse(str_split($hex, 2)));
	};
	
	// Address encoding functions - simplified for common use cases
	$base58_encode = function($binary) {
		if (!extension_loaded("bcmath")) return "BCMath required";
		
		$alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
		$base = strlen($alphabet);
		
		$decimal = "0";
		$length = strlen($binary);
		for ($i = 0; $i < $length; $i++) {
			$decimal = bcadd($decimal, bcmul(bcpow("256", (string)($length - 1 - $i)), (string)ord($binary[$i])));
		}
		
		$output = "";
		while (bccomp($decimal, "0") > 0) {
			$div = bcdiv($decimal, (string)$base, 0);
			$mod = bcmod($decimal, (string)$base);
			$output = $alphabet[(int)$mod] . $output;
			$decimal = $div;
		}
		
		for ($i = 0; $i < $length && ord($binary[$i]) === 0; $i++) {
			$output = "1" . $output;
		}
		return $output;
	};
	
	$hash160_to_address = function($hash, $version) use (&$base58_encode) {
		$data = $version . $hash;
		$binary = hex2bin($data);
		$checksum = hash("sha256", hash("sha256", $binary, true), true);
		return $base58_encode($binary . substr($checksum, 0, 4));
	};
	
	$script_pubkey_to_address = function($script) use (&$hash160_to_address) {
		$type = substr($script, 0, 2);
		
		if ($type === "76" && substr($script, 0, 6) === "76a914") {
			return $hash160_to_address(substr($script, 6, 40), "00");
		}
		if ($type === "a9" && substr($script, 0, 4) === "a914") {
			return $hash160_to_address(substr($script, 4, 40), "05");
		}
		if ($type === "00" && substr($script, 0, 4) === "0014") {
			return "P2WPKH: " . substr($script, 4, 40);
		}
		if ($type === "51" && substr($script, 0, 4) === "5120") {
			return "P2TR: " . substr($script, 4, 64);
		}
		return null;
	};
	
	// Determine script type
	$get_script_type = function($script) {
		if (empty($script)) return "unknown";
		
		$len = strlen($script);
		if ($len >= 50 && substr($script, 0, 6) === "76a914" && substr($script, -4) === "88ac") return "p2pkh";
		if ($len >= 46 && substr($script, 0, 4) === "a914" && substr($script, -2) === "87") return "p2sh";
		if ($len >= 4 && (substr($script, 0, 2) === "41" || substr($script, 0, 2) === "21") && 
			substr($script, -2) === "ac") return "p2pk";
		if ($len >= 4 && substr($script, 0, 4) === "0014") return "p2wpkh";
		if ($len >= 4 && substr($script, 0, 4) === "0020") return "p2wsh";
		if ($len >= 4 && substr($script, 0, 4) === "5120") return "p2tr";
		if ($len >= 2 && substr($script, 0, 2) === "6a") return "nulldata";
		return "unknown";
	};
	
	// Start decoding the transaction
	$version = $read_uint32();
	
	// Check for segwit marker and flag
	$has_witness = false;
	$marker = ord($read_bytes(1));
	if ($marker === 0) {
		$flag = ord($read_bytes(1));
		if ($flag === 1) {
			$has_witness = true;
		} else {
			$position -= 2;
		}
	} else {
		$position -= 1;
	}

	// Read inputs
	$input_count = $read_var_int();
	$inputs = [];
	for ($i = 0; $i < $input_count; $i++) {
		$txid = $flip_endianness(bin2hex($read_bytes(32)));
		$vout = $read_uint32();
		$script_length = $read_var_int();
		$script_sig = bin2hex($read_bytes($script_length));
		$sequence = $read_uint32();
		
		$inputs[] = [
			"txid" => $txid,
			"vout" => $vout,
			"scriptSig" => $script_sig,
			"sequence" => $sequence
		];
	}

	// Read outputs
	$output_count = $read_var_int();
	$outputs = [];
	for ($i = 0; $i < $output_count; $i++) {
		$value = $read_uint64();
		$script_length = $read_var_int();
		$script_pubkey = bin2hex($read_bytes($script_length));
		
		$output = [
			"amount" => $value,
			"scriptPubKey" => $script_pubkey,
			"type" => $get_script_type($script_pubkey)
		];
		
		$address = $script_pubkey_to_address($script_pubkey);
		if ($address !== null) {
			$output["address"] = $address;
		}
		
		$outputs[] = $output;
	}

	// Read witness data
	$witness = [];
	if ($has_witness) {
		for ($i = 0; $i < $input_count; $i++) {
			$witness_count = $read_var_int();
			$witness_data = [];
			for ($j = 0; $j < $witness_count; $j++) {
				$witness_data[] = $read_string();
			}
			$witness[] = $witness_data;
		}
	}

	// Read locktime
	$locktime = $read_uint32();

	// Calculate sizes
	$tx_size = strlen($hex_data) / 2;
	$tx_weight = $has_witness ? ($position - strlen($data)) + ($tx_size - ($position - strlen($data))) * 4 : $tx_size * 4;
	$vsize = (int)ceil($tx_weight / 4);

	// Create hash for the transaction
	$tx_hash = hash("sha256", hash("sha256", hex2bin($hex_data), true));
	$tx_hash = $flip_endianness($tx_hash);

	return [
		"version" => $version,
		"inputs" => $inputs,
		"outputs" => $outputs,
		"witness" => $has_witness ? $witness : [],
		"locktime" => $locktime,
		"size" => $tx_size,
		"vsize" => $vsize,
		"weight" => $tx_weight,
		"hasWitness" => $has_witness,
		"tx_hash" => $tx_hash
	];
}

// Creates a standardized JSON-encoded error object with code and message
function err_obj($code, $message) {
	return [
		"error" => [
			"code" => $code,
			"message" => $message
		]
	];
}