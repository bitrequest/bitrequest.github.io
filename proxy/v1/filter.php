<?php

	function block_malicious_requests() {
	    $inputs = array_merge($_GET, $_POST);
	    foreach ($inputs as $key => $value) {
	        if (is_string($value) && is_suspicious($value)) {
	            http_response_code(403);
	            die(json_encode(["error" => ["code" => "403", "message" => "Blocked"]]));
	        }
	    }
	}
	
	function is_suspicious($value) {
	    $patterns = [
	        "/(\bOR\b|\bAND\b)\s+\d+[*+\-]\d+\s*=/i",  // SQL injection (OR 5*5=25)
	        "/assert\s*\(/i",                              // PHP code injection
	        "/base64_decode\s*\(/i",                       // encoded payloads
	        "/gethostbyname\s*\(/i",                       // DNS exfiltration
	        "/require\s*['\"]?socket/i",                   // Node.js injection
	        "/response\.write\s*\(/i",                     // Node.js injection
	        "/print\s*\(\s*md5\s*\(/i",                    // PHP probe
	        "/\.\.\//",                                    // path traversal
	    ];
	    foreach ($patterns as $pattern) {
	        if (preg_match($pattern, $value)) return true;
	    }
	    return false;
	}

	function is_safe_url($url) {
	    $parsed = parse_url($url);
	    if (!$parsed || !isset($parsed["scheme"]) || !isset($parsed["host"])) {
	        return false;
	    }
	    
	    if (!in_array($parsed["scheme"], ["http", "https"])) {
	        return false;
	    }
	    
	    $host = $parsed["host"];
	    
	    // Allow .onion addresses (handled by Tor)
	    if (str_ends_with($host, ".onion")) {
	        return true;
	    }
	    
	    // Resolve hostname to IP
	    $ip = gethostbyname($host);
	    if ($ip === $host) {
	        return false; // DNS resolution failed
	    }
	    
	    // Block private and reserved IP ranges
	    // (127.x.x.x, 10.x.x.x, 192.168.x.x, 172.16-31.x.x, 169.254.x.x, 0.x.x.x)
	    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
	        return false;
	    }
	    
	    return true;
	}
	
	// Sanitizes user input for safe use in file paths
	function safe_filename($input) {
	    if (!$input || !is_string($input)) {
	        return false;
	    }
	    $clean = basename($input); // strips directory components (../ etc)
	    if (!preg_match("/^[a-zA-Z0-9_-]+$/", $clean)) {
	        return false;
	    }
	    return $clean;
	}
	
	//Checks if Tor is available on the system by attempting to connect to the SOCKS proxy
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
	
	// Creates a JSON-encoded error object with status code and message for standardized error responses
	function error_object($code, $message) {
		return json_encode([
			"error" => [
				"code" => $code,
				"message" => $message
			]
		]);
	}

block_malicious_requests();