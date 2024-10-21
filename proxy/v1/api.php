<?php
// PROXY

const VERSION = "0.012";
const CACHE_DURATIONS = [
    "2m" => 6220800,
    "1w" => 604800,
    "tx" => 604800,
    "1d" => 86400,
    "1h" => 3600
];

// Main API function that handles caching and retrieval of data
function api($url, $data, $headers, $ct, $cfd, $meta, $fn) {
    $cf = $cfd ?? false;
    if (!$cf) {
        return get_non_cached_result($url, $data, $headers);
    }

    $cache_refresh = CACHE_DURATIONS[$cf] ?? 3600;
    $cache_time = $ct ?? $cache_refresh;
    $cache_folder = "cache/" . $cf . "/";
    $filename = $fn ?? md5($data . $url);
    $cache_file = $cache_folder . $filename;

    if (file_exists($cache_file) && is_cache_valid($cache_file, $cache_time)) {
        return get_cached_result($cache_file, $cache_time, $meta);
    }

    return get_and_cache_result($url, $data, $headers, $cache_folder, $cache_file, $cache_time, $meta);
}

// Retrieves non-cached result from the API
function get_non_cached_result($url, $data, $headers) {
    $curlResult = curl_get($url, $data, $headers);
    return [
        "br_cache" => "no caching",
        "br_result" => json_decode($curlResult, true),
    ];
}

// Checks if the cached data is still valid
function is_cache_valid($cache_file, $cache_time) {
    $filetime = filemtime($cache_file);
    return (time() - $filetime) < $cache_time;
}

// Retrieves and formats cached result
function get_cached_result($cache_file, $cache_time, $meta) {
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
    $cache_contents = json_decode(file_get_contents($cache_file), true);
    return $meta === false ? $cache_contents : [
        "br_cache" => $cache_object,
        "br_result" => $cache_contents
    ];
}

// Fetches new data from API and caches it
function get_and_cache_result($url, $data, $headers, $cache_folder, $cache_file, $cache_time, $meta) {
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

    if (!is_dir($cache_folder) && !mkdir($cache_folder, 0777, true)) {
        return [
            "br_cache" => "no caching",
            "br_result" => ["error" => ["message" => "No write access"]]
        ];
    }

    file_put_contents($cache_file, $api_result);
    update_cache_monitor($cache_folder);

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
    $api_contents = json_decode($api_result, true);
    return $meta === false ? $api_contents : [
        "br_cache" => $cache_object,
        "br_result" => $api_contents
    ];
}

// Updates the cache monitor file
function update_cache_monitor($cache_folder) {
    $cacheMonitor = $cache_folder . "cachemonitor";
    $time = time();
    $cacheContent = json_encode([
        "created" => gmdate("Y-m-d h:i:sa", $time) . " (UTC)",
        "created_utc" => $time
    ]);

    if (!file_exists($cacheMonitor) || ($time - filemtime($cacheMonitor) > 3600)) {
        cleanup_old_cache($cache_folder);
        file_put_contents($cacheMonitor, $cacheContent);
    }
}

// Removes old cache files
function cleanup_old_cache(string $cache_folder) {
    $files = glob($cache_folder . "*");
    $cache_refresh = max(CACHE_DURATIONS);
    $time = time();
    foreach ($files as $file) {
        if ($time - filemtime($file) > $cache_refresh) {
            unlink($file);
        }
    }
}

// Performs a cURL request to fetch data from a URL
function curl_get($url, $data, $headers) {
    if (strpos($url, ".onion") !== false) {
        require_once "ln/tor/index.php";
        return fetch_tor($url, $data, $headers);
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 0,
        CURLOPT_TIMEOUT => 5
    ]);

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        if (isset($headers["tls_wildcard"])) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        }
    }

    if (!empty($data)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    }

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        return error_object("411", curl_error($ch));
    }
    curl_close($ch);

    return $result ?: error_object("411", "no result");
}

// Creates a JSON-encoded error object
function error_object($code, $message) {
    return json_encode([
        "error" => [
            "code" => $code,
            "message" => $message
        ]
    ]);
}