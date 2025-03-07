<?php
	
	header("Content-Type: application/json");
	header("Access-Control-Allow-Headers: Cache-Control, Pragma");
	//header("Access-Control-Allow-Origin: *"); // uncomment for nginx
	
	// Handle direct requests with Tor support
	if (has_tor()) {
	    $pd = file_get_contents("php://input");
	    $pd_obj = json_decode($pd, true);
	    if (isset($pd_obj)) {
	        echo curl_get_tor($pd_obj);
	        return;
	    }
	}
	
	// Fetches data from a URL using Tor network or falls back to default proxy
	function fetch_tor($url, $data, $headers) {
	    $plo = [
	        "url" => $url,
	        "data" => $data,
	        "headers" => $headers
	    ];
	    
	    if (has_tor()) { // check for TOR support
	        $response = curl_get_tor($plo);
	        if ($response) {
	            return $response;
	        }
	        return err_obj("411", "Failed to connect via Tor");
	    }
	    
	    // Call default proxy if TOR is not installed
	    $ch = curl_init();
	    if ($ch === false) {
	        return err_obj("411", "Failed to initialize CURL");
	    }
	    
	    curl_setopt($ch, CURLOPT_URL, "https://www.bitrequest.app/proxy/v1/ln/tor/");
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
	
	// Makes a cURL request through Tor proxy
	function curl_get_tor($payld) {
	    try {
	        $url = $payld["url"] ?? null;
	        $data = $payld["data"] ?? null;
	        $headers = $payld["headers"] ?? null;
	        
	        if (empty($url)) {
	            return err_obj("400", "URL is required");
	        }
	        
	        $ch = curl_init();
	        if ($ch === false) {
	            return err_obj("411", "Failed to initialize CURL");
	        }
	        
	        curl_setopt($ch, CURLOPT_URL, $url);
	        
	        // Add headers if provided
	        if (!empty($headers)) {
	            // Convert associative array to indexed array for curl
	            if (is_array($headers) && !isset($headers[0])) {
	                $header_array = [];
	                foreach ($headers as $key => $value) {
	                    $header_array[] = "$key: $value";
	                }
	                $headers = $header_array;
	            }
	            
	            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
	            
	            // Check for TLS wildcard setting
	            if (isset($payld["headers"]["tls_wildcard"])) {
	                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
	            }
	        }
	        
	        // Add data if provided
	        if (!empty($data)) {
	            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	            // Set the appropriate request method
	            curl_setopt($ch, CURLOPT_POST, 1);
	        }
	        
	        // Set Tor proxy settings
	        curl_setopt($ch, CURLOPT_PROXY, "127.0.0.1:9050");
	        curl_setopt($ch, CURLOPT_PROXYTYPE, 7); // CURLPROXY_SOCKS5_HOSTNAME
	        
	        // Set additional options
	        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
	        curl_setopt($ch, CURLOPT_TIMEOUT, 25); // timeout in seconds
	        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	        curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
	        
	        $result = curl_exec($ch);
	        $curl_errno = curl_errno($ch);
	        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	        
	        curl_close($ch);
	        
	        if ($curl_errno) {
	            return err_obj("411", "cURL error (" . $curl_errno . "): " . curl_error($ch));
	        }
	        
	        if ($http_code >= 400) {
	            return err_obj((string)$http_code, "HTTP error: " . $http_code);
	        }
	        
	        if ($result === false) {
	            return err_obj("411", "No result from Tor request");
	        }
	        
	        return $result;
	    } catch (Exception $e) {
	        return err_obj("500", "Exception: " . $e->getMessage());
	    }
	}
	
	// Creates a JSON-encoded error object
	function err_obj($code, $message) {
	    return json_encode([
	        "error" => [
	            "code" => $code,
	            "message" => $message,
	        ],
	    ]);
	}
	
	// Checks if Tor is available on the system
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
	
?>