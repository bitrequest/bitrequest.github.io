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
	        exit;
	    }
	}
	
	// Main socket fetch function that handles both Tor and non-Tor connections
	function socket_fetch($pl) {
	    $node = $pl["node"];
	    if (strpos($node, ".onion") !== false) {
	        if (has_tor()) { // check for TOR support
	            $response = socket_fetch_tor_stream($pl);
	            if (isset($response)) {
	                return $response;
	            }
	            return ["error" => $pl["method"] . " not supported"];
	        }
	        // Call default proxy if TOR is not installed
	        $ch = curl_init();
	        if ($ch === false) {  // Added curl initialization check
	            return error_obj("411", "Failed to initialize CURL");
	        }
	        $payload = ["fetch" => "true"];
	        $merged = array_merge($payload, $pl);
	        curl_setopt($ch, CURLOPT_URL, "https://www.bitrequest.app/proxy/v1/custom/rpcs/electrum/");
	        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($merged));
	        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
	        curl_setopt($ch, CURLOPT_TIMEOUT, 10); // timeout in seconds
	        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
	        
	        $response = curl_exec($ch);
	        $curl_error = curl_errno($ch);
	        $error_message = $curl_error ? curl_error($ch) : null;
	        
	        curl_close($ch);
	        if ($curl_error) {
	            return error_obj("411", $error_message);
	        }
	        if ($response !== false) {
	            $decoded = json_decode($response, true);
	            return $decoded !== null ? $decoded : json_decode($response);
	        } 
	        return error_obj("411", "no result");
	    }
	    // Original function for non-Tor addresses
	    return socket_fetch_ssl($pl);
	}
	
	// Handles communication with Electrum servers via Tor's SOCKS proxy
	function socket_fetch_tor_stream($pl) {
	    try {
	        if (!isset($pl["node"]) || !isset($pl["method"])) {
	            return ["error" => "Missing required parameters", "error_code" => 400];
	        }
	        
	        $request = [
	            "id" => $pl["id"] ?? get_random_id(),
	            "method" => $pl["method"]
	        ];
	        
	        if (isset($pl["ref"])) {
	            $request["params"] = [$pl["ref"]];
	        }
	        $json_request = json_encode($request) . "\n";
	        
	        // Parse the node parameter to extract host and port
	        $parts = explode(":", $pl["node"]);
	        $host = $parts[0];
	        $port = isset($parts[1]) ? intval($parts[1]) : 50001; // Default to 50001 if port not specified
	        
	        // Try raw socket connection through Tor's SOCKS proxy
	        $context = stream_context_create([]);
	        $errno = 0;
	        $errstr = "";
	        
	        // Connect to Tor's SOCKS proxy
	        $proxy = @fsockopen("127.0.0.1", 9050, $errno, $errstr, 30);
	        
	        // Try alternate port if first fails
	        if (!$proxy) {
	            $proxy = @fsockopen("127.0.0.1", 9150, $errno, $errstr, 30);
	        }
	        
	        if (!$proxy) {
	            return ["error" => "Could not connect to Tor proxy: $errstr", "error_code" => $errno];
	        }
	        
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
	        $addr_type = ord($response[3]);
	        if ($addr_type == 1) { // IPv4
	            fread($proxy, 4 + 2 - (strlen($response) - 4)); // 4 bytes for IPv4, 2 for port, minus what we've already read
	        } elseif ($addr_type == 3) { // Domain name
	            $domain_len = ord($response[4]);
	            fread($proxy, $domain_len + 2 - (strlen($response) - 5)); // domain length + 2 for port, minus what we've already read
	        } elseif ($addr_type == 4) { // IPv6
	            fread($proxy, 16 + 2 - (strlen($response) - 4)); // 16 bytes for IPv6, 2 for port, minus what we've already read
	        }
	        
	        // At this point, the SOCKS connection is established
	        // Now send the JSON request directly through the proxy
	        fwrite($proxy, $json_request);
	        
	        // Read response with timeout
	        stream_set_timeout($proxy, 60);
	        $response = fgets($proxy);
	        fclose($proxy);
	        
	        if ($response !== false) {
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
	    try {
	        $request = request_data($pl);
	        $json_request = json_encode($request) . "\n";
	        $response = null;
	        $context = stream_context_create(["ssl" => ["verify_peer" => false, "verify_peer_name" => false]]);
	        $socket = @stream_socket_client("ssl://" . $pl["node"], $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
	        if ($socket) {
	            stream_set_timeout($socket, 60);
	            fwrite($socket, $json_request);
	            $response = fgets($socket);
	            fclose($socket);
	            if ($response !== false) {
	                return fetch_methods($response, $pl);
	            }
	        }
	        return ["error" => $errstr, "error_code" => $errno];
	    } catch (Exception $e) {
	        if (isset($socket) && is_resource($socket)) {
	            fclose($socket);
	        }
	        return ["error" => $e->getMessage(), "error_code" => $e->getCode()];
	    }
	}
	
	// Prepares request data for Electrum protocol
	function request_data($pl) {
	    $request = [
	        "id" => $pl["id"] ?? get_random_id(),
	        "method" => $pl["method"]
	    ];
	    if (isset($pl["ref"])) {
	        $request["params"] = [$pl["ref"]];
	    }
	    return $request;
	}
	
	// Processes response data based on the requested method
	function fetch_methods($response, $pl) {
	    if (empty($response)) {
	        return ["error" => "Empty response from server"];
	    }
	    
	    $rep_json = json_decode($response, true);
	    if (json_last_error() !== JSON_ERROR_NONE) {
	        return ["error" => "JSON parse error: " . json_last_error_msg()];
	    }
	    
	    $result = $rep_json["result"] ?? null;
	    $error = $rep_json["error"] ?? null;
	    
	    if ($error) {
	        return ["error" => $error];
	    }
	    
	    if ($result === null) {
	        return ["error" => "No result in response"];
	    }
	    
	    $method = $pl["method"] ?? '';
	    
	    if ($method == "blockchain.scripthash.get_history") {
	        $node = $pl["node"] ?? '';
	        
	        if (isset($pl["id"]) && $pl["id"] == "scanning") {
	            $last_four = get_last_four_reversed($result);
	            return output_tx_hashes($node, $last_four);
	        }
	        
	        if (isset($pl["tx_hash"])) {
	            $tx_hash = $pl["tx_hash"];
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
	
	// Extracts timestamp from a block header hex string
	function get_timestamp($hex) {
	    if (!is_string($hex) || strlen($hex) < 144) {
	        return ["error" => "Invalid header format"];
	    }
	    return hexdec(implode("", array_reverse(str_split(substr($hex, 136, 8), 2))));
	}
	
	// Gets the last 4 transactions and reverses their order
	function get_last_four_reversed($transactions) {
	    if (!is_array($transactions)) {
	        return [];
	    }
	    // Get the last 4 entries (or all if less than 4)
	    $count = count($transactions);
	    $limit = min(4, $count);
	    $last_entries = array_slice($transactions, -$limit);
	    
	    // Reverse the array
	    return array_reverse($last_entries);
	}
	
	// Finds a specific transaction by hash in a list of transactions
	function find_transaction($transactions, $tx_hash) {
	    if (!is_array($transactions) || empty($tx_hash)) {
	        return null;
	    }
	    
	    foreach ($transactions as $transaction) {
	        if (isset($transaction["tx_hash"]) && $transaction["tx_hash"] === $tx_hash) {
	            return $transaction;
	        }
	    } 
	    return null;
	}
	
	// Processes multiple transactions and complements them with additional data
	function output_tx_hashes($node, $transactions) {
	    if (empty($node) || !is_array($transactions)) {
	        return [];
	    }
	    
	    $result_array = [];
	    foreach ($transactions as $transaction) {
	        $complemented = complement_tx($node, $transaction);
	        if ($complemented) {
	            $result_array[] = $complemented;
	        }
	    }
	    return $result_array;
	}
	
	// Complements a transaction with additional data from the blockchain
	function complement_tx($node, $transaction) {
	    if (empty($node) || !is_array($transaction) || !isset($transaction["tx_hash"])) {
	        return null;
	    }
	    
	    $tx_hash = $transaction["tx_hash"];
	    $tx_hex = socket_fetch([
	        "id" => get_random_id(),
	        "method" => "blockchain.transaction.get",
	        "ref" => $tx_hash,
	        "node" => $node
	    ]);
	    
	    if (!$tx_hex || isset($tx_hex["error"])) {
	        return null;
	    }
	    
	    $height = $transaction["height"] ?? 0;
	    $fetch_tx = decode_bitcoin_tx($tx_hex);
	    
	    if (!$fetch_tx || isset($fetch_tx["error"])) {
	        return null;
	    }
	    
	    $fetch_block = null;
	    if ($height > 0) {
	        $fetch_block = socket_fetch([
	            "id" => get_random_id(),
	            "method" => "blockchain.block.header",
	            "ref" => $height,
	            "node" => $node
	        ]);
	    }
	    
	    $fetch_tx["tx_hash"] = $tx_hash;
	    $fetch_tx["height"] = $height;
	    
	    if ($fetch_block && !isset($fetch_block["error"])) {
	        $fetch_tx["timestamp"] = $fetch_block;
	    }
	    
	    return $fetch_tx;
	}
	
	// Generates a random ID for requests
	function get_random_id() {
	    try {
	        return substr(bin2hex(random_bytes(8)), 0, 5);
	    } catch (Exception $e) {
	        // Fallback if random_bytes fails
	        return substr(md5(uniqid(mt_rand(), true)), 0, 5);
	    }
	}
	
	// Decodes a Bitcoin transaction from hex format
	function decode_bitcoin_tx($hex_data) {
	    if (!is_string($hex_data) || empty($hex_data)) {
	        return ["error" => "Invalid transaction hex data"];
	    }
	    
	    try {
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
	        
	        $read_varint = function() use (&$read_bytes, &$read_uint16, &$read_uint32, &$read_uint64) {
	            $first = ord($read_bytes(1));
	            if ($first < 0xfd) return $first;
	            if ($first === 0xfd) return $read_uint16();
	            if ($first === 0xfe) return $read_uint32();
	            return $read_uint64();
	        };
	        
	        $read_string = function() use (&$read_varint, &$read_bytes) {
	            return bin2hex($read_bytes($read_varint()));
	        };
	        
	        $flip_endianness = function($hex) {
	            return implode("", array_reverse(str_split($hex, 2)));
	        };
	        
	        // Address encoding functions - simplified for common use cases
	        $base58_encode = function($binary) {
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
	        
	        $hash160_to_address = function($hash, $version) use (&$base58_encode) {
	            $data = $version . $hash;
	            $binary = hex2bin($data);
	            $checksum = hash("sha256", hash("sha256", $binary, true), true);
	            return $base58_encode($binary . substr($checksum, 0, 4));
	        };
	        
	        $scriptpubkey_to_address = function($script) use (&$hash160_to_address) {
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
	        $input_count = $read_varint();
	        $inputs = [];
	        for ($i = 0; $i < $input_count; $i++) {
	            $txid = $flip_endianness(bin2hex($read_bytes(32)));
	            $vout = $read_uint32();
	            $script_length = $read_varint();
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
	        $output_count = $read_varint();
	        $outputs = [];
	        for ($i = 0; $i < $output_count; $i++) {
	            $value = $read_uint64();
	            $script_length = $read_varint();
	            $script_pubkey = bin2hex($read_bytes($script_length));
	            
	            $output = [
	                "amount" => $value,
	                "scriptPubKey" => $script_pubkey,
	                "type" => $get_script_type($script_pubkey)
	            ];
	            
	            $address = $scriptpubkey_to_address($script_pubkey);
	            if ($address !== null) {
	                $output["address"] = $address;
	            }
	            
	            $outputs[] = $output;
	        }
	
	        // Read witness data
	        $witness = [];
	        if ($has_witness) {
	            for ($i = 0; $i < $input_count; $i++) {
	                $witness_count = $read_varint();
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
	    } catch (Exception $e) {
	        return ["error" => "Decoding error: " . $e->getMessage()];
	    }
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