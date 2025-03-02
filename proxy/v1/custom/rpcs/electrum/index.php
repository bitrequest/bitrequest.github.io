<?php
	
	header("Content-Type: application/json");
	header("Access-Control-Allow-Headers: Cache-Control, Pragma");
	//header("Access-Control-Allow-Origin: *"); // uncomment for nginx
	
	/**
	 * Electrum protocol handler with Tor support
	 * Allows communication with Electrum servers, including .onion addresses via Tor
	 */
	
	// Handle direct requests with Tor support
	if (has_tor()) {
	    $pd = file_get_contents("php://input");
	    $pd_obj = json_decode($pd, true);
	    if (isset($pd_obj["fetch"])) {
	        $response = socket_fetch_tor_stream($pd_obj);
	        echo json_encode($response);
	    }
	}
	
	// Main socket fetch function that handles both Tor and non-Tor connections
	function socket_fetch($pl) {
	    $node = $pl["node"];
	    if (strpos($node, ".onion") !== false) {
	        if (has_tor()) { // check for TOR support
	            return socket_fetch_tor_stream($pl);
	        }
	        // Call default proxy if TOR is not installed
	        $ch = curl_init();
	        if ($ch === false) {  // Added curl initialization check
	            return error_obj("411", "Failed to initialize CURL");
	        }
	        $payload = ["fetch" => "true"];
	        $merged = array_merge($payload, $pl);
	        curl_setopt($ch, CURLOPT_URL, "https://www.bitrequest.app/proxy/v1/custom/rpcs/electrum/index.php");
	        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($merged));
	        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
	        curl_setopt($ch, CURLOPT_TIMEOUT, 35); // timeout in seconds
	        
	        $response = curl_exec($ch);
	        $curl_error = curl_errno($ch);
	        $error_message = $curl_error ? curl_error($ch) : null;
	        
	        curl_close($ch);
	        if ($curl_error) {
	            return error_obj("411", $error_message);
	        }
	        if ($response) {
	            return json_decode($response, true);
	        } 
	        return error_obj("411", "no result");
	    }
	    // Original function for non-Tor addresses
	    return socket_fetch_ssl($pl);
	}
	
	// Handles communication with Electrum servers via Tor's SOCKS proxy
	function socket_fetch_tor_stream($pl) {
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
	    $context = @stream_context_create([]);
	    $errno = 0;
	    $errstr = "";
	    
	    // Connect to Tor's SOCKS proxy - fixed typo from 'locslhost' to 'localhost'
	    $proxy = @fsockopen("127.0.0.1", 9050, $errno, $errstr, 30);
	    
	    // You can also try using IP address directly if hostname doesn't resolve
	    if (!$proxy) {
	        $proxy = @fsockopen("127.0.0.1", 9150, $errno, $errstr, 30);
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
	        stream_set_timeout($proxy, 60);
	        $response = fgets($proxy);
	        fclose($proxy);
	        
	        if ($response) {
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
	
	// Handles communication with Electrum servers via SSL    
	function socket_fetch_ssl($pl) {
	    $request = request_data($pl);
	    $jsonRequest = json_encode($request) . "\n";
	    $response = null;
	    $context = @stream_context_create(["ssl" => ["verify_peer" => false, "verify_peer_name" => false]]);
	    $socket = @stream_socket_client("ssl://" . $pl["node"], $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
	    if ($socket) {
	        stream_set_timeout($socket, 60);
	        fwrite($socket, $jsonRequest);
	        $response = fgets($socket);
	        fclose($socket);
	        if (isset($response)) {
	            return fetch_methods($response, $pl);
	        }
	    }
	    return ["error" => $errstr];
	}
	
	// Prepares request data for Electrum protocol
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
	
	// Processes response data based on the requested method
	function fetch_methods($response, $pl) {
	    $rep_json = json_decode($response, true);
	    $result = $rep_json["result"] ?? null;
	    if ($result) {
	        $method = $pl["method"];
	        if ($method == "blockchain.scripthash.get_history") {
		        $node = $pl["node"];
	            if ($pl["id"] == "scanning") {
	                $last_four = get_last_four_reversed($result);
	                return output_tx_hashes($node, $last_four);
	            }
	            $tx_hash = $pl["tx_hash"];
	            if ($tx_hash) {
	                $find_tx = find_transaction($result, $tx_hash);
	                if ($find_tx) {
	                    return complement_tx($node, $find_tx);
	                }
	            }
	        }
	        if ($method == "blockchain.block.header") {
	            return get_timestamp($result);
	        }
	        return $result;
	    }
	}
	
	// Extracts timestamp from a block header hex string
	function get_timestamp($hex) {
	    return hexdec(implode("", array_reverse(str_split(substr($hex, 136, 8), 2))));
	}
	
	// Gets the last 4 transactions and reverses their order
	function get_last_four_reversed($transactions) {
	    // Get the last 4 entries (or all if less than 4)
	    $count = count($transactions);
	    $limit = min(4, $count);
	    $last_entries = array_slice($transactions, -$limit);
	    
	    // Reverse the array
	    $reversed_entries = array_reverse($last_entries);  
	    return $reversed_entries;
	}
	
	// Finds a specific transaction by hash in a list of transactions
	function find_transaction($transactions, $tx_hash) {
	    foreach ($transactions as $transaction) {
	        if (isset($transaction["tx_hash"]) && $transaction["tx_hash"] === $tx_hash) {
	            return $transaction;
	        }
	    } 
	    return null;
	}
	
	// Processes multiple transactions and complements them with additional data
	function output_tx_hashes($node, $transactions) {
	    $result_array = [];
	    $index = 0;
	    foreach ($transactions as $transaction) {
	        $result_array[] = complement_tx($node, $transaction);
	        $index++;
	    }
	    // Return the populated array
	    return $result_array;
	}
	
	// Complements a transaction with additional data from the blockchain
	function complement_tx($node, $transaction) {
	    $tx_hash = $transaction["tx_hash"];
	    $tx_hex = socket_fetch([
	        "id" => get_random_id(),
	        "method" => "blockchain.transaction.get",
	        "ref" => $tx_hash,
	        "node" => $node
	    ]);
	    if ($tx_hex) {
	        $height = $transaction["height"];
	        $fetch_tx = decode_bitcoin_tx($tx_hex);
	        $fetch_block = socket_fetch([
	            "id" => get_random_id(),
	            "method" => "blockchain.block.header",
	            "ref" => $height,
	            "node" => $node
	        ]);
	        $fetch_tx["tx_hash"] = $tx_hash;
	        $fetch_tx["height"] = $height;
	        $fetch_tx["timestamp"] = $fetch_block;
	        return $fetch_tx;
	    }
	    return null;
	}
	
	// Generates a random ID for requests
	function get_random_id() {
	    return substr(bin2hex(random_bytes(8)), 0, 5);
	}
	
	// Decodes a Bitcoin transaction from hex format
	function decode_bitcoin_tx($hexData) {
	    // Initialize position and convert hex to binary
	    $position = 0;
	    $data = hex2bin($hexData);
	    
	    // Helper functions for reading data
	    $readBytes = function($length) use (&$data, &$position) {
	        $result = substr($data, $position, $length);
	        $position += $length;
	        return $result;
	    };
	    
	    $readUInt16 = function() use (&$readBytes) {
	        return unpack("v", $readBytes(2))[1];
	    };
	    
	    $readUInt32 = function() use (&$readBytes) {
	        return unpack("V", $readBytes(4))[1];
	    };
	    
	    $readUInt64 = function() use (&$readBytes) {
	        $values = unpack("V2", $readBytes(8));
	        return $values[1] + ($values[2] * 4294967296);
	    };
	    
	    $readVarInt = function() use (&$readBytes, &$readUInt16, &$readUInt32, &$readUInt64) {
	        $first = ord($readBytes(1));
	        if ($first < 0xfd) return $first;
	        if ($first === 0xfd) return $readUInt16();
	        if ($first === 0xfe) return $readUInt32();
	        return $readUInt64();
	    };
	    
	    $readString = function() use (&$readVarInt, &$readBytes) {
	        return bin2hex($readBytes($readVarInt()));
	    };
	    
	    $flipEndianness = function($hex) {
	        return implode("", array_reverse(str_split($hex, 2)));
	    };
	    
	    // Address encoding functions - simplified for common use cases
	    $base58Encode = function($binary) {
	        if (!extension_loaded('bcmath')) return 'BCMath required';
	        
	        $alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
	        $base = strlen($alphabet);
	        
	        $decimal = '0';
	        $length = strlen($binary);
	        for ($i = 0; $i < $length; $i++) {
	            $decimal = bcadd($decimal, bcmul(bcpow('256', (string)($length - 1 - $i)), (string)ord($binary[$i])));
	        }
	        
	        $output = "";
	        while (bccomp($decimal, '0') > 0) {
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
	    
	    $hash160ToAddress = function($hash, $version) use (&$base58Encode) {
	        $data = $version . $hash;
	        $binary = hex2bin($data);
	        $checksum = hash("sha256", hash("sha256", $binary, true), true);
	        return $base58Encode($binary . substr($checksum, 0, 4));
	    };
	    
	    $scriptPubKeyToAddress = function($script) use (&$hash160ToAddress) {
	        $type = substr($script, 0, 2);
	        
	        if ($type === "76" && substr($script, 0, 6) === "76a914") {
	            return $hash160ToAddress(substr($script, 6, 40), "00");
	        }
	        if ($type === "a9" && substr($script, 0, 4) === "a914") {
	            return $hash160ToAddress(substr($script, 4, 40), "05");
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
	    $getScriptType = function($script) {
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
	    $version = $readUInt32();
	    
	    // Check for segwit marker and flag
	    $hasWitness = false;
	    $marker = ord($readBytes(1));
	    if ($marker === 0) {
	        $flag = ord($readBytes(1));
	        if ($flag === 1) {
	            $hasWitness = true;
	        } else {
	            $position -= 2;
	        }
	    } else {
	        $position -= 1;
	    }
	
	    // Read inputs
	    $inputCount = $readVarInt();
	    $inputs = [];
	    for ($i = 0; $i < $inputCount; $i++) {
	        $txid = $flipEndianness(bin2hex($readBytes(32)));
	        $vout = $readUInt32();
	        $scriptLength = $readVarInt();
	        $scriptSig = bin2hex($readBytes($scriptLength));
	        $sequence = $readUInt32();
	        
	        $inputs[] = [
	            "txid" => $txid,
	            "vout" => $vout,
	            "scriptSig" => $scriptSig,
	            "sequence" => $sequence
	        ];
	    }
	
	    // Read outputs
	    $outputCount = $readVarInt();
	    $outputs = [];
	    for ($i = 0; $i < $outputCount; $i++) {
	        $value = $readUInt64();
	        $scriptLength = $readVarInt();
	        $scriptPubKey = bin2hex($readBytes($scriptLength));
	        
	        $output = [
	            "amount" => $value,
	            "scriptPubKey" => $scriptPubKey,
	            "type" => $getScriptType($scriptPubKey)
	        ];
	        
	        $address = $scriptPubKeyToAddress($scriptPubKey);
	        if ($address !== null) {
	            $output["address"] = $address;
	        }
	        
	        $outputs[] = $output;
	    }
	
	    // Read witness data
	    $witness = [];
	    if ($hasWitness) {
	        for ($i = 0; $i < $inputCount; $i++) {
	            $witnessCount = $readVarInt();
	            $witnessData = [];
	            for ($j = 0; $j < $witnessCount; $j++) {
	                $witnessData[] = $readString();
	            }
	            $witness[] = $witnessData;
	        }
	    }
	
	    // Read locktime
	    $locktime = $readUInt32();
	
	    // Calculate sizes
	    $txSize = strlen($hexData) / 2;
	    $txWeight = $hasWitness ? ($position - strlen($data)) + ($txSize - ($position - strlen($data))) * 4 : $txSize * 4;
	    $vsize = (int)ceil($txWeight / 4);
	
	    // Create hash for the transaction
	    $txHash = hash("sha256", hash("sha256", hex2bin($hexData), true));
	    $txHash = $flipEndianness($txHash);
	
	    return [
	        "version" => $version,
	        "inputs" => $inputs,
	        "outputs" => $outputs,
	        "witness" => $hasWitness ? $witness : [],
	        "locktime" => $locktime,
	        "size" => $txSize,
	        "vsize" => $vsize,
	        "weight" => $txWeight,
	        "hasWitness" => $hasWitness,
	        "tx_hash" => $txHash
	    ];
	}
	
	// Creates a JSON-encoded error object with code and message
	function error_obj($code, $message) {
	    return [
	        "error" => [
	            "code" => $code,
	            "message" => $message
	        ]
	    ];
	}
	
	// Checks if Tor is available on the system
	function has_tor() {
	    // Try the main Tor port
	    $socket = @fsockopen("127.0.0.1", 9050, $errno, $errstr, 1);
	    if ($socket) {
	        fclose($socket);
	        return true;
	    }
	    
	    // Try the Tor Browser port
	    $socket = @fsockopen("127.0.0.1", 9150, $errno, $errstr, 1);
	    if ($socket) {
	        fclose($socket);
	        return true;
	    }
	    
	    return false;
	}

?>