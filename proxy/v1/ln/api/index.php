<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
header("Access-Control-Allow-Origin: *");

include_once "../../filter.php";
include "../../../config.php";
include "../../api.php";

$pdat = $_POST;
if (isset($pdat["ping"])) {
	echo r_objl2("pong");
	return;
}
$gdat = $_GET;

// Server and request information
$request_uri = $_SERVER["REQUEST_URI"];
$path = strpos($request_uri, "v1/ln") !== false ? explode("v1/ln", $request_uri)[0] : $request_uri;
$server_host = $_SERVER["HTTP_HOST"];
$server_path = $server_host . $path;

// Setup and API key handling
$setup = $lightning_setup;
$api_key = $setup["apikey"];
$key_hash = substr(hash("sha256", $api_key), 0, 10);
$provided_api_key = $pdat["x-api"] ?? false;
$post_api_key = (strlen($provided_api_key) == 10) ? $provided_api_key : substr(hash("sha256", $provided_api_key), 0, 10);

// Error messages
$key_error = "API key required for " . $server_path;
$wrong_key = "Wrong API key for lightning Proxy";

// GET and POST data handling
$imp = $gdat["i"] ?? $pdat["imp"] ?? false;
$requested_amount = $gdat["a"] ?? false;
$specified_amount = $gdat["amount"] ?? false;
$title = $gdat["m"] ?? false;
$get_id = $gdat["id"] ?? false;

// ID parsing
$type = $get_id ? substr($get_id, 0, 1) : false;
$type_text = "unknown";
switch ($type) {
	case "1":
		$type_text = "local";
		break;
	case "2":
		$type_text = "outgoing";
		break;
	case "3":
		$type_text = "checkout";
		break;
}
$get_pid = $get_id ? safe_filename(substr($get_id, 1, 10)) : false;
$get_nid = ($get_id && strlen($get_id) > 15) ? substr($get_id, 11) : false;

// POST data
$post_pid = safe_filename($pdat["id"] ?? false);
$post_nid = $pdat["nid"] ?? false;
$p_expiry = $pdat["expiry"] ?? 60;

// Lightning GET request validation
$lnget = $imp && $get_pid && $requested_amount > -1 && $specified_amount;

// Configuration
$callback_url = $setup["callback_url"] ?? "";
$local_tracking = $setup["local_tracking"] === "yes" ? "yes" : "no";
$remote_tracking = $setup["remote_tracking"] === "yes" ? "yes" : "no";

// Check if API key is required and validate it
if ($api_key && !$lnget) {
	if ($provided_api_key === "false") {
		echo json_encode(r_err($key_error, 1));
		return;
	}
	if ($post_api_key !== $key_hash) {
		echo json_encode(r_err($wrong_key, 2));
		return;
	}
}

// Handle "add" operation
if (isset($pdat["add"])) {
	$result = api(null, json_encode($pdat), null, 0, "tx", null, null);
	// Add TOR support info
	$result["tor"] = has_tor();
	echo json_encode(["ping" => $result]);
	return;
}

// Handle "pingpw" operation (likely a ping/pong check)
if (isset($pdat["pingpw"])) {
	echo r_objl2("pong");
	return;
}

$fn = $pdat["fn"] ?? false;

// Handle "put" operation
if ($fn === "put") {
	$pl = $pdat["pl"] ?? false;
	$rqtype = $pdat["rqtype"] ?? false;
	$status = safe_filename($pl["status"] ?? false);
	$cred_resp = false;
	$stat_resp = false;
	$stat_content = [
		"pid" => $status,
		"rqtype" => $rqtype,
		"proxy" => $server_host,
		"status" => "waiting",
		"version" => VERSION
	];
	if ($pl) {
		// Process credentials if available
		$creds = $pl["cred"] ?? false;
		if ($creds) {
			$contents = json_decode(base64_decode($creds), true);
			if ($contents && isset($contents["file"])) {
				api(null, $creds, null, 604800, "1w", null, $contents["file"]);
				$cred_resp = true;
			}
		}
		// Process status information
		if ($status) {
			$statfile = "cache/tx/" . $status;
			if (file_exists($statfile) && $rqtype === "local") {
				// Update existing status file for local request
				$get_content = file_get_contents($statfile);
				if ($get_content) {
					$stat_obj = json_decode($get_content, true);
					$stat_obj["status"] = "waiting";
					$stat_content = $stat_obj;
					file_put_contents($statfile, json_encode($stat_content));
				}
				$stat_resp = true;
			} else {
				// Create new status entry via API
				$put_result = api(null, json_encode($stat_content), null, 0, "tx", null, $status);
				$p_result = $put_result["br_result"] ?? false;
				if ($p_result) {
					$stat_content = [
						"pid" => $status,
						"rqtype" => $rqtype,
						"proxy" => $server_host,
						"status" => "waiting",
						"version" => VERSION
					];
					$stat_resp = true;
				}
			}
		}
	}
	$response = json_encode([
		"creds" => $cred_resp,
		"stat" => $stat_resp,
		"content" => $stat_content,
		"version" => VERSION
	]);
	echo $response;
	return;
}

// Handle "ln-request-status" operation
if ($fn === "ln-request-status" && $post_pid) {
	$filename = "cache/tx/" . $post_pid;
	if (file_exists($filename)) {
		$get_content = file_get_contents($filename);
		if ($get_content !== false) {
			echo $get_content;
			return;
		}
	}
	echo json_encode(["status" => "not found"]);
	return;
}

// Check if the implementation is supported
if (in_array($imp, ["lnd", "lnbits", "core-lightning"])) {
	$allowed_functions = ["ln-create-invoice", "ln-list-invoices", "ln-invoice-status", "ln-invoice-decode", "ln-delete-invoice"];
	if ($lnget || in_array($fn, $allowed_functions)) {
		
		// Initialize variables for host, key, and other settings
		$host = $key = false;
		$type = "lnurl";
		$isproxy = false;
		$nid = $get_nid ? $get_nid : ($post_nid ? $post_nid : false);

		// Check for cached credentials
		if ($nid) {
			$filename = "cache/1w/" . $nid;
			if (file_exists($filename)) {
				
				// Attempt to read and decode cached credentials
				$get_content = file_get_contents($filename);
				if ($get_content && ($contents = json_decode(base64_decode($get_content), true))) {
					
					// Use cached host and key if available
					if (!empty($contents["host"])) {
						$host = $contents["host"];
						$type = "cache";
						$isproxy = false;
					}
					if (!empty($contents["key"])) {
						$key = $contents["key"];
					}
				}
			}
		}

		// Prioritize server credentials over cached ones
		$cred = $setup[$imp];
		if (!empty($cred["host"])) {
			$host = $cred["host"];
			$type = "lnurl";
			$isproxy = true;
		}
		if (!empty($cred["key"])) {
			$key = $cred["key"];
		}

		// Prioritize POST data over server and cached credentials
		$posthost = $pdat["host"] ?? false;
		$postkey = $pdat["key"] ?? false;
		if ($posthost) {
			$host = $posthost;
			$type = "post";
			$isproxy = false;
		}
		if ($postkey) {
			$key = $postkey;
			$isproxy = false;
		}

		// Check if host and key are available, return error if not
		if (!$host || !$key) {
			$cname = !$key ? "keys" : "hostname";
			$_mdef = "Please enter your " . $cname;
			$e_msg = $type === "lnurl" ? $_mdef . " in " . $server_path . "config.php" : 
					 ($type === "post" ? $_mdef : "missing " . $cname);
			
			echo json_encode($lnget ? 
				["status" => "ERROR", "reason" => $e_msg] : 
				r_err($e_msg, null)
			);
			return;
		}

		// Handle different Lightning Network functions
		$pingtest = $pdat["pingtest"] ?? false;

		if ($fn === "ln-create-invoice") {
			$amount = $pdat["amount"];
			$lnurl_id = $type === "lnurl" ? " (LNURL)" : "";
			$memo = ($pdat["memo"] ?? "") . $lnurl_id;
			$invoice = create_invoice($imp, $post_pid, $host, $key, $amount, $memo, $type, $pingtest, "test", null, null, $p_expiry);
			
			if ($invoice) {
				// Store invoice tracking data if bolt11 is requested
				if (!empty($pdat["b11"])) {
					$path = "cache/tx/" . $post_pid;
					if (file_exists($path)) {
						$s_content = [
							"pid" => $post_pid,
							"rqtype" => "outgoing",
							"proxy" => $server_host,
							"boltcard" => isset($_POST["boltcard"]),
							"status" => "pending",
							"bolt11" => $invoice["bolt11"],
							"hash" => $invoice["hash"],
							"amount" => (int)$amount,
							"amount_paid" => null,
							"timestamp" => time() * 1000,
							"txtime" => null,
							"conf" => 0
						];
						file_put_contents($path, json_encode($s_content));
					}
				}
				echo json_encode($invoice);
			}
			return;
		}

		if ($fn === "ln-list-invoices") {
			$invoices = list_invoices($imp, $host, $key, $type, $pingtest);
			echo json_encode($invoices);
			return;
		}

		if ($fn === "ln-invoice-status" || $fn === "ln-invoice-decode") {
			$hash = $pdat["hash"] ?? false;
			$itype = $pdat["type"] ?? false;
			$ttype = ($itype === "incoming") ? "outgoing" : $itype;
			
			$lndecode = invoice_lookup($imp, $post_pid, $host, $key, $hash, $ttype, $p_expiry, $fn === "ln-invoice-status");
			echo json_encode($lndecode);
			
			// Process callbacks for paid or canceled invoices
			if ($fn === "ln-invoice-status" && $callback_url && strlen($callback_url) > 10) {
				$callback = ($pdat["callback"] ?? "") === "yes" ? "yes" : "no";
				if ($callback === "yes" && $ttype) {
					$inv_status = $lndecode["status"];
					if ($inv_status === "paid" || $inv_status === "canceled") {
						handle_callback($callback_url, $lndecode, $ttype, $remote_tracking, $local_tracking);
					}
				}
			}
			return;
		}

		// Handle LNURL-pay flow
		if ($lnget) {
			// Validate amount meets minimum requirements
			if ($specified_amount < $requested_amount) {
				echo json_encode([
					"status" => "ERROR",
					"reason" => "Amount must be at least " . $requested_amount / 1000 . " satoshis, got " . $specified_amount / 1000 . "."
				]);
				return;
			}
			
			$path = "cache/tx/" . $get_pid;
			$successmessage = $setup["successAction"] ?? false;
			$routes = $cred["routes"] ?? [];
			
			if (file_exists($path)) {
				$g_content = file_get_contents($path);
				if ($g_content) {
					// Check for existing valid invoice
					$g_dec = json_decode($g_content, true);
					$timestamp = $g_dec["timestamp"] ?? false;
					if ($timestamp && (time() * 1000 - $timestamp) < 90000) {
						$saved_inv = $g_dec["bolt11"] ?? false;
						if ($saved_inv) {
							echo json_encode(["pr" => $saved_inv, "routes" => $routes]);
							return;
						}
					}
				}
				
				// Prepare invoice metadata
				$memo = $title ?? null;
				$logo = $setup["logo"];
				$meta_arr = [["text/plain", $memo]];
				if (strlen($logo) > 200) {
					$meta_arr[] = ["image/png;base64", $logo];
				}
				$desc_hash = d_hash($meta_arr);
				$meta = bin2hex(json_encode($meta_arr));
				
				// Create a new invoice
				$result = create_invoice($imp, $get_pid, $host, $key, $specified_amount, $memo, $type, null, "lnurl", $desc_hash, $meta, $p_expiry);
				
				if ($result) {
					$inv_error = $result["error"] ?? false;
					if ($inv_error) {
						echo json_encode(["status" => "ERROR", "reason" => $inv_error]);
						return;
					}
					
					$pr = $result["bolt11"];
					$hash = $result["hash"];
					
					if ($pr && $hash) {
						// Prepare response with payment request
						$inv_arr = ["pr" => $pr, "routes" => $routes];
						if ($successmessage && strlen($successmessage) > 2) {
							$inv_arr["successAction"] = ["tag" => "message", "message" => $successmessage];
						}
						echo json_encode($inv_arr);
						
						// Store invoice details for tracking
						$s_content = [
							"pid" => $get_pid,
							"rqtype" => $type_text,
							"proxy" => $server_host,
							"status" => "pending",
							"bolt11" => $pr,
							"hash" => $hash,
							"amount" => (int)$specified_amount,
							"amount_paid" => null,
							"timestamp" => time() * 1000,
							"txtime" => null,
							"conf" => 0
						];
						
						$tx_content = json_encode($s_content);
						file_put_contents($path, $tx_content);
						
						// Submit transaction to the bitrequest service
						$postheaders = ["post: " . $tx_content, "tls_wildcard" => true];
						curl_get(TOR_PROXY . ":8030/", $tx_content, $postheaders);
						
						// Trigger callback if configured
						if ($callback_url && strlen($callback_url) > 10) {
							handle_callback($callback_url, $s_content, $type_text, $remote_tracking, $local_tracking);
						}
					} else {
						echo json_encode(["status" => "ERROR", "reason" => "failed to create invoice"]);
					}
				} else {
					echo json_encode(["status" => "ERROR", "reason" => "failed to create invoice"]);
				}
			} else {
				echo json_encode(["status" => "ERROR", "reason" => "Tracking file " . ($get_pid ?: "unknown") . " not found. Please chmod proxy/v1/ln/api to 777"]);
			}
		}
		return;
	}
	echo json_encode(["status" => "ERROR", "reason" => "forbidden"]);
	return;
} else {
	$imp_error = "implementation '" . $imp . "' not supported";
	echo json_encode($lnget ? 
		["status" => "ERROR", "reason" => $imp_error] : 
		r_err($imp_error, null)
	);
	return;
}

	// Process and send callback notifications based on transaction type and tracking settings
	function handle_callback($callback_url, $content, $type, $remote_tracking, $local_tracking) {
		if ($remote_tracking === "yes" && $local_tracking === "yes") {
			curl_get($callback_url, $content, null); // track all
		} elseif ($remote_tracking === "yes" && $local_tracking !== "yes") {
			if (in_array($type, ["outgoing", "checkout"])) {
				curl_get($callback_url, $content, null); // track outgoing and checkout
			}
		} elseif ($remote_tracking !== "yes" && $local_tracking === "yes") {
			if (in_array($type, ["local", "checkout"])) {
				curl_get($callback_url, $content, null); // track local and checkout
			}
		} elseif ($type === "checkout") {
			curl_get($callback_url, $content, null); // only track checkout
		}
	}
	
	// Create a new Lightning Network invoice based on implementation type and parameters
	function create_invoice($imp, $pid, $host, $key, $amount, $memo, $type, $pingtest, $src, $desc_hash, $meta, $expiry) {
		if ($imp === "lnd") {
			// LND implementation
			$rpcurl = $host . "/v1/invoices";
			$pl = [];
			if ($memo) {
				$pl["memo"] = $memo;
			}
			if ($amount) {
				$pl["value"] = $amount / 1000;
			}
			$pl["expiry"] = $expiry;
			$data = json_encode($pl);
			$headers = [
				"tls_wildcard" => true,
				"Content-Length: " . strlen($data),
				"Grpc-Metadata-macaroon: " . $key
			];
			$inv = curl_get($rpcurl, $data, $headers);
			if ($inv) {
				return invoice_uniform($imp, $inv, $type);
			}
		}
		
		if ($imp === "core-lightning") {
			$rpcurl = $host . "/v1/invoice";
			$pl = [];
			$pl["label"] = $pid;
			if ($memo) {
				$pl["description"] = $memo;
			}
			if ($amount) {
				$pl["amount_msat"] = $amount;
			}
			$pl["expiry"] = $expiry;
			$payload = json_encode($pl);
			$headers = [
				"tls_wildcard" => true
			];
			$headers[] = "Content-Length: " . strlen($payload);
			$headers[] = "Content-Type: application/json";
			$headers[] = "Rune: " . $key;
			$inv = curl_get($rpcurl, $payload, $headers);
			if ($inv) {
				$result = invoice_uniform($imp, $inv, $type);
				return $result;
			}
		}
	
		if ($imp === "lnbits") {
			// LNbits implementation
			$rpcurl = $host . "/api/v1/payments";
			$pl = ["out" => false];
			if ($memo) {
				$pl["memo"] = $memo;
			}
			if ($amount) {
				$pl["amount"] = $amount / 1000;
			}
			$data = json_encode($pl);
			$headers = [
				"tls_wildcard" => true,
				"Content-Length: " . strlen($data),
				"Content-Type: application/json",
				"X-Api-Key: " . $key
			];
			$inv = curl_get($rpcurl, $data, $headers);
			if ($inv) {
				return invoice_uniform($imp, $inv, $type);
			}
		}
	
		return r_err("unable to create invoice", null);
	}
	
	// Standardize invoice data format across different Lightning Network implementations
	function invoice_uniform($imp, $inv, $type) {
		if (!$inv) {
			return false;
		}
	
		$proxy_host = $_SERVER["HTTP_HOST"];
		$dat = json_decode($inv, true);
		if (json_last_error() !== JSON_ERROR_NONE) {
			return false;
		}
		
		// Extract any error messages from the response
		$error = isset($dat["error"]) ? $imp . ": " . $dat["error"]["code"] . ": " . $dat["error"]["message"] : null;
	
		$result = [
			"invoice" => $dat,
			"proxy" => $proxy_host,
			"type" => $type,
			"error" => $error,
			"tor" => has_tor()
		];
	
		// Format specific fields based on implementation
		if ($imp === "lnd") {
			return array_merge($result, [
				"bolt11" => $dat["payment_request"],
				"hash" => lnd_b64_dec($dat["r_hash"])
			]);
		}
		
		if ($imp === "core-lightning") {
			return array_merge($result, [
				"bolt11" => $dat["bolt11"],
				"hash" => $dat["payment_hash"]
			]);
		}
	
		if ($imp === "lnbits") {
			$bolt11 = isset($dat["bolt11"]) ? $dat["bolt11"] : $dat["payment_request"];
			return array_merge($result, [
				"bolt11" => $bolt11,
				"hash" => $dat["payment_hash"]
			]);
		}
	
		return false;
	}
	
	// Retrieve a list of invoices from the Lightning Network node based on implementation
	function list_invoices($imp, $host, $key, $type, $pingtest) {
		$headers = [
			"tls_wildcard" => true,
			"Content-Type: application/json"
		];
	
		// Modify the list_invoices function for LND
		if ($imp === "lnd") {
			$rpcurl = $host . "/v1/invoices?reversed=true";
			$headers[] = "Grpc-Metadata-macaroon: " . $key;
			$invoices = curl_get($rpcurl, null, $headers);
			$result = json_decode($invoices, true);
			
			// Check if we got an array of invoices or a single invoice
			if (isset($result["invoices"]) && is_array($result["invoices"])) {
				$connected = !empty($result["invoices"]) && isset($result["invoices"][0]["r_hash"]);
			} else if (isset($result["r_hash"])) {
				// We received a single invoice - wrap it in the expected structure
				$result = ["invoices" => [$result]];
				$connected = true;
			} else {
				$connected = false;
			} 
			return process_invoice_result($result, $connected, $type, $pingtest);
		}
		
		if ($imp === "core-lightning") {
			$rpcurl = $host . "/v1/listinvoices";
			$headers = [
				"tls_wildcard" => true
			];
			$headers[] = "Content-Type: application/json";
			$headers[] = "Rune: " . $key;
			$invoices = curl_get($rpcurl, "{}", $headers);
			$result = json_decode($invoices, true);
			
			// Check if we got an array of invoices or a single invoice
			if (isset($result["invoices"]) && is_array($result["invoices"])) {
				$connected = !empty($result["invoices"]) && isset($result["invoices"][0]["payment_hash"]);
			} else if (isset($result["payment_hash"])) {
				// We received a single invoice - wrap it in the expected structure
				$result = ["invoices" => [$result]];
				$connected = true;
			} else {
				$connected = false;
			} 
			return process_invoice_result($result, $connected, $type, $pingtest);
		}
	
		if ($imp === "lnbits") {
			// LNbits implementation
			$rpcurl = $host . "/api/v1/wallet";
			$headers[] = "X-Api-Key: " . $key;
			$invoices = curl_get($rpcurl, null, $headers);
			$result = json_decode($invoices, true);
			$connected = ($result["balance"] > -1);
			return process_invoice_result($result, $connected, $type, $pingtest);
		}
	
		return false;
	}
	
	// Process and standardize invoice list results with connection status information
	function process_invoice_result($result, $connected, $type, $pingtest) {
		$m_dat = [
			"connected" => $connected,
			"type" => $type
		];
	
		// For ping tests, only return connection status
		if ($pingtest && $connected) {
			return ["mdat" => $m_dat];
		}
	
		// Add metadata to full result
		$result["mdat"] = $m_dat;
		return $result;
	}
	
	// Look up details of a specific invoice by hash or id based on implementation
	function invoice_lookup($imp, $pid, $host, $key, $hash, $type, $expiry, $status) {
		$headers = [
			"tls_wildcard" => true,
			"Content-Type: application/json"
		];
		if ($imp === "lnd") {
			// Handle different hash formats
			$lnd_hash = (substr($hash, -1) == "=") ? lnd_b64_dec($hash) : $hash;
			
			$rpcurl = $host . "/v1/invoice/" . $lnd_hash;
			$headers[] = "Grpc-Metadata-macaroon: " . $key;
			
			$inv = curl_get($rpcurl, null, $headers);
			$result = json_decode($inv, true);
			
			// Check for valid response with r_hash
			$is_valid = is_array($result) && isset($result["r_hash"]);
			return process_invoice_lookup($imp, $result, $is_valid, $pid, $type, $expiry, $status);
		}
		
		if ($imp === "core-lightning") {
			$rpcurl = $host . "/v1/listinvoices";
			$headers = [
				"tls_wildcard" => true
			];
			$headers[] = "Content-Type: application/json";
			$headers[] = "Rune: " . $key;
			$data = json_encode(["payment_hash" => $hash]);
			$inv = curl_get($rpcurl, $data, $headers);
			$result = json_decode($inv, true);
			
			// Check for valid response with r_hash
			$invoice = isset($result["invoices"][0]) ? $result["invoices"][0] : null;
			$is_valid = is_array($invoice) && isset($invoice["payment_hash"]);
			return process_invoice_lookup($imp, $invoice, $is_valid, $pid, $type, $expiry, $status);
		}
	
		if ($imp === "lnbits") {
			// LNbits implementation - lookup by payment hash
			$rpcurl = $host . "/api/v1/payments/" . $hash;
			$headers[] = "X-Api-Key: " . $key;
			
			// Use standard curl_get which handles Tor internally
			$inv = curl_get($rpcurl, null, $headers);
			
			$result = json_decode($inv, true);
			return process_invoice_lookup($imp, $result, isset($result["details"]), $pid, $type, $expiry, $status);
		}
		return r_err("unable to fetch invoice", null);
	}
	
	// Process the invoice lookup results and return status information if requested
	function process_invoice_lookup($imp, $inv_result, $is_valid, $pid, $type, $expiry, $status) {
		if ($is_valid) {
			// If status is requested, get detailed status info
			if ($status) {
				return invoice_status($imp, $inv_result, $pid, $type, $expiry);
			}
			return $inv_result;
		}
		return r_err("unable to fetch invoice", null);
	}
	
	// Retrieve and format the current status of an invoice based on implementation
	function invoice_status($imp, $dat, $pid, $type, $expiry) {
		if (!$dat) {
			return false;
		}
	
		$proxy_host = $_SERVER["HTTP_HOST"];
		$base_result = [
			"pid" => $pid,
			"rqtype" => $type,
			"proxy" => $proxy_host
		];
	
		// Route to the appropriate implementation-specific handler
		if ($imp === "lnd") {
			return get_lnd_status($dat, $base_result);
		}
		
		if ($imp === "core-lightning") {
			return get_c_lightning_status($dat, $base_result, $expiry);
		}
	
		if ($imp === "lnbits") {
			return get_lnbits_status($dat, $base_result, $expiry);
		}
	
		return false;
	}
	
	// Extract and normalize LND invoice status information
	function get_lnd_status($dat, $base_result) {
		$status = $dat["state"];
		$br_state = "unknown";
		if ($status === "SETTLED") $br_state = "paid";
		if ($status === "OPEN") $br_state = "pending";
		if ($status === "CANCELED") $br_state = "canceled";
		if ($status === "ACCEPTED") $br_state = "accepted";
		
		// Extract relevant fields with defaults for missing values
		$conf = ($br_state === "paid") ? 1 : 0;
		$inv_txcreated = isset($dat["creation_date"]) ? (int)$dat["creation_date"] * 1000 : 0;
		$inv_txtime = isset($dat["settle_date"]) ? (int)$dat["settle_date"] * 1000 : 0;
		$inv_amount = isset($dat["value_msat"]) ? (int)$dat["value_msat"] : 0;
		$inv_amount_paid = isset($dat["amt_paid"]) ? (int)$dat["amt_paid"] : 0;
		$inv_hash = isset($dat["r_hash"]) ? lnd_b64_dec($dat["r_hash"]) : null;
	
		return array_merge($base_result, [
			"status" => $br_state,
			"bolt11" => $dat["payment_request"],
			"hash" => $inv_hash,
			"amount" => $inv_amount,
			"amount_paid" => ($br_state === "paid") ? $inv_amount_paid : null,
			"timestamp" => $inv_txcreated,
			"txtime" => $inv_txtime,
			"conf" => $conf
		]);
	}
	
	// Extract and normalize core-lightning invoice status information
	function get_c_lightning_status($dat, $base_result, $expiry) {
		$status = $dat["status"];
		$br_state = "unknown";
		if ($status === "paid") $br_state = "paid";
		if ($status === "unpaid") $br_state = "pending";
		if ($status === "expired") $br_state = "canceled";
		
		// Extract relevant fields with defaults for missing values
		$conf = ($br_state === "paid") ? 1 : 0;
		$inv_txcreated = isset($dat["expires_at"]) ? ((int)$dat["expires_at"] - $expiry) * 1000 : 0;
		$inv_txtime = isset($dat["paid_at"]) ? (int)$dat["paid_at"] * 1000 : 0;
		$inv_amount = isset($dat["amount_msat"]) ? (int)$dat["amount_msat"] : 0;
		$inv_amount_paid = isset($dat["amount_received_msat"]) ? (int)$dat["amount_received_msat"] : 0;
		$inv_hash = isset($dat["payment_hash"]) ? $dat["payment_hash"] : null;
	
		return array_merge($base_result, [
			"status" => $br_state,
			"bolt11" => $dat["bolt11"],
			"hash" => $inv_hash,
			"amount" => $inv_amount,
			"amount_paid" => ($br_state === "paid") ? $inv_amount_paid : null,
			"timestamp" => $inv_txcreated,
			"txtime" => $inv_txtime,
			"conf" => $conf
		]);
	}
	
	// Extract and normalize LNbits invoice status information
	function get_lnbits_status($dat, $base_result, $expiry) {
		$details = $dat["details"];
		$inv_txtime = isset($details["time"]) ? get_timestamp($details["time"]) : 0;
		$expired = ((time() - $inv_txtime) > $expiry);
		$br_state = "unknown";
		if ($details["pending"] == true) $br_state = "pending";
		if ($expired == true) $br_state = "canceled";
		if ($dat["paid"] == true) $br_state = "paid";
		
		// LNbits has a simpler structure than other implementations
		$conf = ($br_state === "paid") ? 1 : 0;
		$inv_amount = isset($details["amount"]) ? (int)$details["amount"] : 0;
	
		return array_merge($base_result, [
			"status" => $br_state,
			"bolt11" => $details["bolt11"],
			"hash" => $details["payment_hash"],
			"amount" => $inv_amount,
			"amount_paid" => ($br_state === "paid") ? $inv_amount : null,
			"timestamp" => $inv_txtime * 1000,
			"txtime" => $inv_txtime * 1000,
			"conf" => $conf
		]);
	}
	
	// Generate a description hash for LNURL payment metadata
	function d_hash($arr) {
		return hash("sha256", json_encode($arr));
	}
	
	// Encode a hexadecimal value to base64 for LND compatibility
	function lnd_b64_enc($val) {
		if (!$val) return "";
		return base64_encode(hex2bin($val));
	}
	
	// Decode a base64 value to hexadecimal for LND compatibility
	function lnd_b64_dec($val) {
		if (!$val) return "";
		return bin2hex(base64_decode($val));
	}
	
	// Create a simple JSON response object
	function r_obj($dat) {
		return json_encode([
			"ping" => $dat
		], JSON_UNESCAPED_SLASHES);
	}
	
	// Create a detailed JSON response object with cache and version information
	function r_objl2($dat) {
		return json_encode([
			"ping" => [
				"br_cache" => [
					"version" => VERSION
				],
				"br_result" => $dat
			]
		], JSON_UNESCAPED_SLASHES);
	}
	
	// Create an error response object with optional error code
	function r_err($dat, $code) {
		return [
			"error" => [
				"message" => $dat,
				"code" => $code
			],
		];
	}
	
	function get_timestamp($value) {
		if (is_numeric($value)) {
			$intValue = (int)$value;
			if ((string)$intValue === (string)$value && $intValue >= 0) {
				 return $intValue;
			}
		}
		if (is_string($value)) {
			try {
				$dateTime = new DateTime($value);
				$timestamp = $dateTime->getTimestamp();
				if ($timestamp !== false) {
					return $timestamp;
				} else {
					 return false;
				}
	
			} catch (Exception $e) {
				return false;
			}
		}
		return false;
	}