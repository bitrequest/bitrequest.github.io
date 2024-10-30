<?php
function fetch_tor($url, $data, $headers) {
    $plo = [
        "url" => $url,
        "data" => $data,
        "headers" => $headers
    ];
    $local = false; // Set to true if TOR is installed on your server (apt install tor)
    if ($local === true) {
        include "api/index.php";
        $result = curl_get_tor($plo);
        return $result;
    }
    // Call default proxy if TOR is not installed
    $ch = curl_init();
    if ($ch === false) {  // Added curl initialization check
        return error_object("411", "Failed to initialize CURL");
    }
    
    curl_setopt($ch, CURLOPT_URL, "https://www.bitrequest.app/proxy/v1/ln/tor/api/");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($plo));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, 35); // timeout in seconds
    
    $result = curl_exec($ch);
    $curl_error = curl_errno($ch);
    $error_message = $curl_error ? curl_error($ch) : null;
    
    curl_close($ch);
    
    if ($curl_error) {
        return error_object("411", $error_message);
    }
    
    if ($result !== false) {  // Changed condition to explicit false check
        return $result;
    }
    
    return error_object("411", "no result");
}
?>