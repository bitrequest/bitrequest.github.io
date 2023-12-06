<?php
// PROXY
$GLOBALS["version"] = "0.008";
function api($url, $data, $headers, $ct, $cfd, $meta, $fn) {
    $version = "0.008";
    $cf = isset($cfd) ? $cfd : false;
    if (!$cf) {
        $curl_result = curl_get($url, $data, $headers);
        $m_contents = [
            "br_cache" => "no caching",
            "br_result" => json_decode($curl_result, true),
        ];
        return $m_contents;
    }
    $cache_refresh = ($cf == "1w" || $cf == "tx") ? 604800 : ($cf == "1d" ? 86400 : ($cf == "1h" ? 3600 : 3600));
    $ctime = $ct ? $ct : ($ct == 0 ? 0 : $cache_refresh);
    $cache_folder = "cache/" . $cf . "/";
    $filename = $fn ? $fn : md5($data . $url);
    $cache_file = $cache_folder . $filename;
    $cache_monitor = $cache_folder . "cachemonitor";
    $time = time();
    $timeformat = gmdate("Y-m-d h:i:sa", $time) . " (UTC)";
    $cache_content = json_encode([
        "created" => $timeformat,
        "created_utc" => $time
    ]);
    if (file_exists($cache_file)) {
        $file_time = filemtime($cache_file);
        $time_in_cache = $time - $file_time;
        if ($time_in_cache < $ctime) {
            $created = gmdate("Y-m-d h:i:sa", $file_time) . " (UTC)";
            $cache_object = [
                "filename" => $filename,
                "title" => $time_in_cache . " of " . $ctime . " seconds in cache",
                "created" => $created,
                "created_utc" => $file_time,
                "cache_time" => $ctime,
                "time_in_cache" => $time_in_cache,
                "utc_timestamp" => $time,
                "version" => $version
            ];
            $cache_contents = json_decode(file_get_contents($cache_file), true);
            $meta_contents = [
                "br_cache" => $cache_object,
                "br_result" => $cache_contents
            ];
            $cache_result = $meta === false ? $cache_contents : $meta_contents;
            return $cache_result;
        }
    }
    $apiresult = $url ? curl_get($url, $data, $headers) : $data;
    if ($apiresult) {
        if (!is_dir($cache_folder)) {
            mkdir($cache_folder, 0777, true);
        }
        if (!is_dir($cache_folder)) {
            return [
                "br_cache" => "no caching",
                "br_result" => [
                    "error" => [
                        "message" => "no write acces"
                    ]
                ]
            ];
        }
        file_put_contents($cache_file, $apiresult);
        if (file_exists($cache_monitor)) {
            if ($time - filemtime($cache_monitor) > 3600) {
                $files = glob($cache_folder . "*");
                foreach ($files as $file) {
                    if ($time - filemtime($file) > $cache_refresh) {
                        unlink($file);
                    }
                }
                file_put_contents($cache_monitor, $cache_content);
            }
        } else {
            file_put_contents($cache_monitor, $cache_content);
        }
        $cache_object = [
            "filename" => $filename,
            "title" => "0 of " . $ctime . " seconds in cache",
            "created" => $timeformat,
            "created_utc" => $time,
            "cache_time" => $ctime,
            "time_in_cache" => 0,
            "utc_timestamp" => $time,
            "version" => $version
        ];
        $api_contents = json_decode($apiresult, true);
        $meta_contents = [
            "br_cache" => $cache_object,
            "br_result" => $api_contents
        ];
        $result = $meta === false ? $api_contents : $meta_contents;
        return $result;
    } else {
        if (file_exists($cache_file)) {
            unlink($cache_file);
        }
    }
}

// CURL
function curl_get($url, $data, $headers) {
	if (strpos($url, ".onion")) { // use TOR
		include "ln/tor/index.php";
		$result = fetch_tor($url, $data, $headers);
		return $result;
	}
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        if (isset($headers["tls_wildcard"])) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        }
    }
    if (!empty($data)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); //timeout in seconds
    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        return error_object("411", curl_error($ch));
    }
    curl_close($ch);
    if ($result) {
        return $result;
    }
    return error_object("411", "no result");
}

function error_object($code, $message) {
    return json_encode([
        "error" => [
            "code" => $code,
            "message" => $message
        ]
    ]);
}
?>