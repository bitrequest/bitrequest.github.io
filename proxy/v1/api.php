<?php	
// PROXY
const VERSION = "0.032";
const CACHE_DURATIONS = [
	"2m" => 6220800,  // 2 months in seconds
	"1w" => 604800,   // 1 week in seconds
	"tx" => 604800,   // Transaction cache (1 week)
	"1d" => 86400,    // 1 day in seconds
	"1h" => 3600      // 1 hour in seconds
];
const TOR_PROXY = "https://www.bitrequest.app";

// Main API function that handles caching and retrieval of data based on specified parameters
function api($url, $data, $headers, $ct, $cfd, $meta, $fn) {
	$cf = $cfd ?? false;
	if (!$cf) {
		return get_non_cached_result($url, $data, $headers);
	}
	if (!isset(CACHE_DURATIONS[$cf])) {
		return [
			"br_cache" => "error",
			"br_result" => ["error" => ["code" => "400", "message" => "Invalid cache folder"]]
		];
	}
	$cache_refresh = CACHE_DURATIONS[$cf];
	$cache_time = $ct ?? $cache_refresh;
	$cache_folder = "cache/" . $cf . "/";
	$filename = $fn ?? md5((is_string($data) ? $data : json_encode($data)) . $url);
	if ($fn && !safe_filename($fn)) {
		return [
			"br_cache" => "error",
			"br_result" => ["error" => ["code" => "400", "message" => "Invalid filename"]]
		];
	}
	$cache_file = $cache_folder . $filename;
	if (file_exists($cache_file) && is_cache_valid($cache_file, $cache_time)) {
		return get_cached_result($cache_file, $cache_time, $meta);
	}
	return get_and_cache_result($url, $data, $headers, $cache_folder, $cache_file, $cache_time, $meta, $cf);
}

// Retrieves non-cached result directly from the API endpoint
function get_non_cached_result($url, $data, $headers) {
	try {
		$curl_result = curl_get($url, $data, $headers);
		return [
			"br_cache" => "no caching",
			"br_result" => json_decode($curl_result),
		];
	} catch (Exception $e) {
		return [
			"br_cache" => "error",
			"br_result" => ["error" => ["code" => "500", "message" => $e->getMessage()]]
		];
	}
}

// Checks if the cached data is still valid based on time constraints
function is_cache_valid($cache_file, $cache_time) {
	$filetime = filemtime($cache_file);
	return (time() - $filetime) < $cache_time;
}

// Retrieves and formats a cached result from storage with metadata
function get_cached_result($cache_file, $cache_time, $meta) {
	try {
		$filetime = filemtime($cache_file);
		$time_in_cache = time() - $filetime;
		$cache_object = [
			"filename" => basename($cache_file),
			"title" => $time_in_cache . " of " . $cache_time . " seconds in cache",
			"created" => gmdate("Y-m-d h:i:sa", $filetime) . " (UTC)",
			"created_utc" => $filetime,
			"cache_time" => $cache_time,
			"time_in_cache" => $time_in_cache,
			"utc_timestamp" => time(),
			"version" => VERSION
		];
		$cache_contents = json_decode(file_get_contents($cache_file));
		return $meta === false ? $cache_contents : [
			"br_cache" => $cache_object,
			"br_result" => $cache_contents
		];
	} catch (Exception $e) {
		return [
			"br_cache" => "error",
			"br_result" => ["error" => ["code" => "500", "message" => "Cache read error: " . $e->getMessage()]]
		];
	}
}

// Fetches new data from API, saves it to cache, and returns formatted result
function get_and_cache_result($url, $data, $headers, $cache_folder, $cache_file, $cache_time, $meta, $cf) {
	try {
		$api_result = $url ? curl_get($url, $data, $headers) : $data;
		if (!$api_result) {
			if (file_exists($cache_file)) {
				unlink($cache_file);
			}
			return [
				"br_cache" => "no caching",
				"br_result" => ["error" => ["message" => "No API result"]]
			];
		}

		if (!is_dir($cache_folder) && !mkdir($cache_folder, 0755, true)) {
			return [
				"br_cache" => "no caching",
				"br_result" => ["error" => ["message" => "No write access"]]
			];
		}

		file_put_contents($cache_file, $api_result);
		update_cache_monitor($cache_folder, $cf);

		$cache_object = [
			"filename" => basename($cache_file),
			"title" =>  "0 of " . $cache_time . " seconds in cache",
			"created" => gmdate("Y-m-d h:i:sa", time()) . " (UTC)",
			"created_utc" => time(),
			"cache_time" => $cache_time,
			"time_in_cache" => 0,
			"utc_timestamp" => time(),
			"version" => VERSION
		];
		$api_contents = json_decode($api_result);
		return $meta === false ? $api_contents : [
			"br_cache" => $cache_object,
			"br_result" => $api_contents
		];
	} catch (Exception $e) {
		return [
			"br_cache" => "error",
			"br_result" => ["error" => ["message" => "Cache write error: " . $e->getMessage()]]
		];
	}
}

// Updates the cache monitor file and triggers cleanup when needed based on time intervals
function update_cache_monitor($cache_folder, $cf) {
	try {
		$cache_monitor = $cache_folder . "cachemonitor";
		$time = time();
		$cache_content = json_encode([
			"created" => gmdate("Y-m-d h:i:sa", $time) . " (UTC)",
			"created_utc" => $time
		]);

		if (!file_exists($cache_monitor) || ($time - filemtime($cache_monitor) > 3600)) {
			cleanup_old_cache($cache_folder, $cf);
			file_put_contents($cache_monitor, $cache_content);
		}
	} catch (Exception $e) {
		error_log("Cache monitor update error: " . $e->getMessage());
	}
}

// Removes old cache files based on their expiration time to maintain cache efficiency
function cleanup_old_cache($cache_folder, $cf) {
	try {
		$files = glob($cache_folder . "*");
		$cache_refresh = $cf ? (CACHE_DURATIONS[$cf] ?? 3600) : 3600;
		$time = time();
		foreach ($files as $file) {
			if (is_file($file) && ($time - filemtime($file) > $cache_refresh)) {
				unlink($file);
			}
		}
	} catch (Exception $e) {
		error_log("Cache cleanup error: " . $e->getMessage());
	}
}

// Performs a cURL request to fetch data from URLs with special handlers for electrum, nano and onion sites
function curl_get($url, $data, $headers) {
	try {
		// Handle electrum requests
		if ($url === "electrum") {
			$file_path = "custom/rpcs/electrum/index.php";
			if (file_exists($file_path)) {
				include_once $file_path;
				$ssl_fetch = socket_fetch(json_decode($data, true));
				return json_encode($ssl_fetch);
			}
			return error_object("404", "Electrum file not found: " . $file_path);
		}
		// Handle nano requests
		if ($url === "nano") {
			$file_path = "custom/rpcs/nano/index.php";
			if (file_exists($file_path)) {
				include_once $file_path;
				$nano_fetch = main_nano(json_decode($data, true));
				return json_encode($nano_fetch);
			}
			return error_object("404", "Nano file not found: " . $file_path);
		}
		// Handle .onion URL requests via Tor
		if (strpos($url, ".onion") !== false) {
			$tor_path = __DIR__ . "/ln/tor/index.php";
			if (file_exists($tor_path)) {
				require_once($tor_path);
				return fetch_tor($url, $data, $headers);
			}
			return error_object("404", "Tor file not found");
		}
		// Handle standard HTTP requests
		if (!is_safe_url($url)) {
			return error_object("403", "URL not allowed");
		}
		$ch = curl_init();
		curl_setopt_array($ch, [
			CURLOPT_URL => $url,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_CONNECTTIMEOUT => 0,
			CURLOPT_TIMEOUT => 5,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_MAXREDIRS => 3
		]);

		if (!empty($headers)) {
			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
			if (isset($headers["tls_wildcard"])) {
				curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
				curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
			}
		}

		if (!empty($data)) {
			curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
		}

		$result = curl_exec($ch);
		if (curl_errno($ch)) {
			$error = curl_error($ch);
			curl_close($ch);
			return error_object("411", $error);
		}
		
		$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
		
		if ($http_code >= 400) {
			return error_object($http_code, "HTTP error");
		}

		return $result ?: error_object("411", "no result");
	} catch (Exception $e) {
		return error_object("500", "cURL error: " . $e->getMessage());
	}
}