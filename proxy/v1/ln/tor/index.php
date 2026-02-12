<?php
   
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
header("Access-Control-Allow-Origin: *");

include_once "../../filter.php";

// Handle direct requests with Tor support
$pd = file_get_contents("php://input");
$pd_obj = json_decode($pd, true);
if (isset($pd_obj)) {
	if (has_tor()) {
		// Extract method if available
		if (isset($pd_obj["params"]) && isset($pd_obj["params"]["method"])) {
			$pd_obj["method"] = $pd_obj["params"]["method"];
		}
		echo curl_get_tor($pd_obj);
		return;
	}
	echo err_obj("411", "TOR not supported on " . $_SERVER["HTTP_HOST"]);
	return;
}

//Fetches data from a URL using Tor network or falls back to default proxy
function fetch_tor($url, $data, $headers) {
	$method = (isset($data)) ? $data["method"] ?? "POST" : "GET";
	$plo = ["url" => $url, "data" => $data, "headers" => $headers, "method" => $method];    
	if (has_tor()) {
		// Try with retries for better reliability
		$max_retries = 3;
		$retry_count = 0;
		$response = null;       
		while ($retry_count < $max_retries) {
			$response = curl_get_tor($plo);
			
			// Check if we got a valid response
			if ($response && !is_error_response($response)) {
				return $response;
			}
			
			// If we got a timeout or connection error, retry
			$retry_count++;
			
			// Wait before retrying (increasing backoff)
			if ($retry_count < $max_retries) {
				sleep(2 * $retry_count); // 2, 4, 6 seconds backoff
			}
		}  
		if ($response) {
			return $response; // Return last response even if it's an error
		} 
		return err_obj("411", "Failed to connect via Tor after " . $max_retries . " attempts");
	}
	$tor_proxy = $data["tor_proxy"] ?? TOR_PROXY;
	if ((strpos($tor_proxy, $_SERVER["HTTP_HOST"]) !== false)) {
		return err_obj("411", "Failed to connect via Tor");
	}
	
	// Call default proxy if TOR is not installed
	$ch = curl_init();
	if ($ch === false) {
		return err_obj("411", "Failed to initialize CURL");
	}  
	$tor_url = $tor_proxy . "/proxy/v1/ln/tor/index.php";
	curl_setopt($ch, CURLOPT_URL, $tor_url);
	curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($plo));
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
	curl_setopt($ch, CURLOPT_TIMEOUT, 20); // increased timeout for proxy
	curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);   
	$result = curl_exec($ch);
	$curl_error = curl_errno($ch);
	$error_message = $curl_error ? curl_error($ch) : null;   
	curl_close($ch);
	if ($curl_error) {
		return err_obj("411", $error_message);
	} 
	if ($result) {
		return $result;
	}
	return err_obj("411", "no resulta");
}

//Check if response is an error response
function is_error_response($response) {
	if (!is_string($response)) {
		return true;
	}
	
	$data = json_decode($response, true);
	if (json_last_error() !== JSON_ERROR_NONE) {
		return true;
	}
	
	return isset($data["error"]);
}

//Makes a cURL request through Tor's SOCKS5 proxy with comprehensive error handling
function curl_get_tor($pl) {
	try {
		$url = $pl["url"] ?? null;
		$data = $pl["data"] ?? null;
		$headers = $pl["headers"] ?? [];
		$method = $pl["method"] ?? "POST";
		$ch = curl_init();
		// Always set these basic cURL options first
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
		curl_setopt($ch, CURLOPT_TIMEOUT, 20);
		
		// Set up the request method and data
		if (strtoupper($method) === "POST") {
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
			
			// Handle different data formats
			if (!empty($data)) {
				if (is_array($data) || is_object($data)) {
					$json_data = json_encode($data);
					curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
				} else if (is_string($data)) {
					// Check if data is already valid JSON
					json_decode($data);
					if (json_last_error() === JSON_ERROR_NONE) {
						curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
					} else {
						$json_data = json_encode($data);
						curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
					}
				} else {
					curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
				}
			}
		} else {
			// For GET requests - use multiple methods to ensure it's really GET
			curl_setopt($ch, CURLOPT_HTTPGET, 1);
			curl_setopt($ch, CURLOPT_POST, 0);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
			
			// IMPORTANT: Clear any POSTFIELDS to ensure a clean GET request
			curl_setopt($ch, CURLOPT_POSTFIELDS, "");
			
			// Append data to URL for GET requests if needed
			if (!empty($data) && is_array($data)) {
				$query = http_build_query($data);
				if (!empty($query)) {
					$url .= (strpos($url, "?") !== false ? "&" : "?") . $query;
					curl_setopt($ch, CURLOPT_URL, $url);
				}
			}
		}
		
		// Set request headers
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		
		// TOR settings
		curl_setopt($ch, CURLOPT_PROXY, "127.0.0.1:9050");
		curl_setopt($ch, CURLOPT_PROXYTYPE, 7); // CURLPROXY_SOCKS5_HOSTNAME
		
		// Disable certificate verification - required for onion services
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
		
		// Default SSL version 
		curl_setopt($ch, CURLOPT_SSLVERSION, 0); // CURL_SSLVERSION_DEFAULT
		
		// Additional SSL options that may help
		curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
		curl_setopt($ch, CURLOPT_TCP_KEEPALIVE, 1);
		
		// Handle HTTP/2 if available
		if (defined("CURL_HTTP_VERSION_2TLS")) {
			curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_2TLS);
		} else {
			curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
		}
		
		// Execute request
		$start_time = microtime(true);
		$result = curl_exec($ch);
		$end_time = microtime(true);
		$duration = round($end_time - $start_time, 2);
		
		// Get request info
		$curl_errno = curl_errno($ch);
		$curl_error = curl_error($ch);
		$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		
		if ($curl_errno) {
			curl_close($ch);
			return err_obj("411", "cURL error (" . $curl_errno . "): " . $curl_error);
		}     
		curl_close($ch);  
		if ($http_code >= 400) {
			return err_obj((string)$http_code, "HTTP error: " . $http_code . ", Response: " . substr($result, 0, 100));
		} 
		if ($result === false) {
			return err_obj("411", "No result from Tor request");
		} 
		return $result;
	} catch (Exception $e) {
		return err_obj("500", "Exception: " . $e->getMessage());
	}
}

//Creates a JSON-encoded error object with code and message for standardized error responses
function err_obj($code, $message) {
	return json_encode([
		"error" => [
			"code" => $code,
			"message" => $message,
		],
	]);
}