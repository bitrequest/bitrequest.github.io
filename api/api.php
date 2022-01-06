<?php
// API
function api($url, $data, $headers, $ct, $cf, $meta, $fn) {
    $cache_refresh = ($cf == "1w") ? 604800 : ($cf == "1d") ? 86400 : ($cf == "1h") ? 3600 : 3600;
    $cache_folder = "cache/" . $cf . "/";
    $filename = ($fn) ? $fn : md5($data . $url);
    $cache_file = $cache_folder . $filename;
    $cache_monitor = $cache_folder . "cachemonitor";
    $time = time();
    $timeformat = gmdate("Y-m-d h:i:sa", $time);
    $cache_content = json_encode(array(
	    "created" => $timeformat,
	    "created_utc" => $time,
    ));
    $file_time = filemtime($cache_file);
    $created_utc = ($file_time) ? $file_time : $time;
    $created = gmdate("Y-m-d h:i:sa", $created_utc);
    $time_in_cache = $time - $created_utc;
    if (file_exists($cache_file) && $time_in_cache < $ct) {
	    $cache_object = array(
	        "filename" => $filename,
	        "title" => $time_in_cache . " of " . $ct . " seconds in cache",
	        "created" => $created,
	        "created_utc" => $created_utc,
	        "cache_time" => $ct,
	        "time_in_cache" => $time_in_cache,
	        "utc_timestamp" => $time
	    );
        $cache_contents = json_decode(file_get_contents($cache_file), true);
        $meta_contents = array(
            "br_cache" => $cache_object,
            "br_result" => $cache_contents
        );
        $cache_result = ($meta === false) ? $cache_contents : $meta_contents;
        $cm_time = filemtime($cache_monitor);
        $folder_time = ($cm_time) ? $cm_time : $time;
        if (($time - $cache_refresh) > $folder_time) {
	        $files = glob($cache_folder . "*");
	         // clear all expired cache
            foreach ($files as $file) {
	            if (($time - filemtime($file)) > $cache_refresh) {
		            unlink($file);
	            }
            }
            if (!file_exists($cache_monitor)) {
	            file_put_contents($cache_monitor, $cache_content);
            }
        }
        return $cache_result;
        exit();
    }
    else {
        $apiresult = ($url) ? curl_get($url, $data, $headers) : $data;
        if ($apiresult) {
            if (!is_dir($cache_folder)) {
                mkdir($cache_folder, 0777, true);
            }
            file_put_contents($cache_file, $apiresult);
            if (!file_exists($cache_monitor)) { // create cache monitor if not exists
	            file_put_contents($cache_monitor, $cache_content);
            }
            $cache_object = array(
		        "filename" => $filename,
		        "title" => "0 of " . $ct . " seconds in cache",
		        "created" => $timeformat,
		        "created_utc" => $time,
		        "cache_time" => $ct,
		        "time_in_cache" => "0",
		        "utc_timestamp" => $time
		    );
            $api_contents = json_decode($apiresult, true);
            $meta_contents = array(
	            "br_cache" => $cache_object,
	            "br_result" => $api_contents
	        );
			$result = ($meta === false) ? $api_contents : $meta_contents;
            return $result;
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
        if ($headers["tls_wildcard"]) {
	        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    	}
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