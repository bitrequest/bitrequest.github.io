<?php
// API
function api($url, $data, $headers, $ct, $cf, $meta) {
    $cache_refresh = ($cf == "1w") ? 604800 : ($cf == "1d") ? 86400 : ($cf == "1h") ? 3600 : 3600;
    $cache_folder = "cache/" . $cf . "/";
    $cache_file = $cache_folder . md5($data . $url);
    $cache_monitor = $cache_folder . "cachemonitor";
    $time = time();
    $cache_content = json_encode(array(
        "br_cached" => $time
    ));
    $cached_time = filemtime($cache_file);
    $time_in_cache = $time - $cached_time;
    if (file_exists($cache_file) && $time_in_cache < $ct) {
        $cache_object = array(
            "Title" => $time_in_cache . " of " . $ct . " seconds in cache",
            "Unix timestamp" => $time,
            "Unix timestamp of cached file" => $cached_time,
            "Time in cache" => $time_in_cache
        );
        $cache_contents = file_get_contents($cache_file);
        $meta_contents = array(
            "br_cache" => $cache_object,
            "br_result" => json_decode($cache_contents, true)
        );
        $cache_result = ($meta === false) ? json_decode($cache_contents, true) : $meta_contents;
        if (file_exists($cache_monitor) && $time - $cache_refresh < filemtime($cache_monitor)) { // return cached contents
            return $cache_result;
        }
        else {
            $files = glob($cache_folder . "*"); // empty cache folder
            foreach ($files as $file) {
                unlink($file);
            }
            file_put_contents($cache_monitor, json_encode(array(
                "br_cached" => $time
            )));
            return $cache_result;
        }
        exit();
    }
    else {
        $apiresult = curl_get($url, $data, $headers);
        if ($apiresult) {
            if (!is_dir($cache_folder)) {
                mkdir($cache_folder, 0777, true);
            }
            file_put_contents($cache_file, $apiresult);
            if (file_exists($cache_monitor)) {
            }
            else { // create cache monitor if not exists
                file_put_contents($cache_monitor, json_encode(array(
                    "br_cached" => $time
                )));
            }
            return json_decode($apiresult, true);
        }
        else {
            if (file_exists($cache_file)) {
                unlink($cache_file);
            }
        }
    }
}

// CURL
function curl_get($url, $data, $headers) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    if (!empty($data)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3); //timeout in seconds
    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        return error_object("411", curl_error($ch));
    }
    curl_close($ch);
    if ($result) {
        return $result;
    }
    else {
        return error_object("411", "no result");
    }
}

function error_object($code, $message) {
    return json_encode(array(
        "error" => array(
            "code" => $code,
            "message" => $message
        )
    ));
}

?>