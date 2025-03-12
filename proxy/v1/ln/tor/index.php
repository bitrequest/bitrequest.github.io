<?php
	header("Content-Type: application/json");
	header("Access-Control-Allow-Headers: Cache-Control, Pragma");
	//header("Access-Control-Allow-Origin: *"); // uncomment for nginx
	
	// Handle direct requests with Tor support
	if (has_tor()) {
	    $pd = file_get_contents("php://input");
	    $pd_obj = json_decode($pd, true);
	    if (isset($pd_obj)) {
	        // Extract method if available
	        if (isset($pd_obj["params"]) && isset($pd_obj["params"]["method"])) {
	            $pd_obj["method"] = $pd_obj["params"]["method"];
	        }
	        echo curl_get_tor($pd_obj);
	        return;
	    }
	}
	
	// Fetches data from a URL using Tor network or falls back to default proxy
	function fetch_tor($url, $data, $headers) {
	    $plo = [
	        "url" => $url,
	        "data" => $data,
	        "headers" => $headers,
	        "method" => $params["method"] ?? "GET" // Get the method from params
	    ];
	    
	    if (has_tor()) {
	        $response = curl_get_tor($plo);
	        if ($response) {
	            return $response;
	        }
	        return err_obj("411", "Failed to connect via Tor");
	    }
	    $tor_proxy = $data["tor_proxy"] ?? TOR_PROXY ?? "false";
		if ($tor_proxy == "false" || (strpos($tor_proxy, $_SERVER["HTTP_HOST"]) !== false)) {
			return err_obj("411", "Failed to connect via Tor");
		}
		
		// Call default proxy if TOR is not installed
		$ch = curl_init();
		if ($ch === false) {
			return err_obj("411", "Failed to initialize CURL");
		}
		$tor_url = $tor_proxy . "proxy/v1/ln/tor/index.php";
		curl_setopt($ch, CURLOPT_URL, $tor_url);
		curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($plo));
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
		curl_setopt($ch, CURLOPT_TIMEOUT, 35); // timeout in seconds
		curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
		
		$result = curl_exec($ch);
		$curl_error = curl_errno($ch);
		$error_message = $curl_error ? curl_error($ch) : null;
		
		curl_close($ch);
		
		if ($curl_error) {
			return err_obj("411", $error_message);
		}
		
		if ($result !== false) {
			return $result;
		}
		
		return err_obj("411", "no result");
	}
	
	// Makes a cURL request through Tor's SOCKS5 proxy with comprehensive error handling
	function curl_get_tor($pl) {
	    try {
	        $url = $pl["url"] ?? null;
	        $data = $pl["data"] ?? null;
	        $headers = $pl["headers"] ?? null;
	        $method = $pl["method"] ?? "GET"; // Default to GET if not specified
	        
	        // Make sure URL has http:// prefix
	        if (!preg_match("~^(?:f|ht)tps?://~i", $url)) {
	            $url = "http://" . $url;
	        }
	        
	        if (empty($url)) {
	            return err_obj("400", "URL is required");
	        }
	        
	        $ch = curl_init();
	        curl_setopt($ch, CURLOPT_URL, $url);
	        
	        // Set the request method
	        if ($method == "POST") {
	            curl_setopt($ch, CURLOPT_POST, 1);
	            if (!empty($data)) {
	                curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	            }
	        } else {
	            // For GET requests, don't use POSTFIELDS even if data is provided
	            curl_setopt($ch, CURLOPT_HTTPGET, 1);
	            
	            // If data is provided for a GET, append it to the URL as query parameters
	            if (!empty($data) && is_array($data)) {
	                $query = http_build_query($data);
	                if (!empty($query)) {
	                    $url .= (strpos($url, "?") !== false ? "&" : "?") . $query;
	                    curl_setopt($ch, CURLOPT_URL, $url);
	                }
	            }
	        }
	        
	        // Default headers if none provided
	        if (empty($headers)) {
	            $headers = [
	                "User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0",
	                "Accept: application/json"
	            ];
	        }
	        
	        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
	        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
	        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
	        
	        // TOR settings
	        curl_setopt($ch, CURLOPT_PROXY, "127.0.0.1:9050");
	        curl_setopt($ch, CURLOPT_PROXYTYPE, 7); // CURLPROXY_SOCKS5_HOSTNAME
	        
	        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	        
	        $result = curl_exec($ch);
	        $curl_errno = curl_errno($ch);
	        $curl_error = curl_error($ch);
	        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	        
	        curl_close($ch);
	        
	        if ($curl_errno) {
	            error_log("cURL error: (" . $curl_errno . ") " . $curl_error);
	            return err_obj("411", "cURL error (" . $curl_errno . "): " . $curl_error);
	        }
	        
	        if ($http_code >= 400) {
	            error_log("HTTP error: " . $http_code);
	            error_log("Response: " . substr($result, 0, 200));
	            return err_obj((string)$http_code, "HTTP error: " . $http_code);
	        }
	        
	        if ($result === false) {
	            error_log("No result from Tor request");
	            return err_obj("411", "No result from Tor request");
	        }
	        
	        return $result;
	    } catch (Exception $e) {
	        error_log("Exception in TOR request: " . $e->getMessage());
	        return err_obj("500", "Exception: " . $e->getMessage());
	    }
	}
	
	// Creates a JSON-encoded error object with code and message for standardized error responses
	function err_obj($code, $message) {
		return json_encode([
			"error" => [
				"code" => $code,
				"message" => $message,
			],
		]);
	}
	
	// Checks if Tor is available on the system by attempting to connect to the SOCKS proxy
	function has_tor() {
		// Connect to Tor's SOCKS proxy with "127.0.0.1"
		$socket = @fsockopen("127.0.0.1", 9050, $errno, $errstr, 1);
		if ($socket) {
			fclose($socket);
			return true;
		}		
		// Connect to Tor's SOCKS proxy with "localhost"
		$socket = @fsockopen("localhost", 9050, $errno, $errstr, 1);
		if ($socket) {
			fclose($socket);
			return true;
		} 
		return false;
	}