<?php
function fetch_tor($url, $data, $headers) {
    $plo = [
        "url" => $url,
        "data" => $data,
        "headers" => $headers,
    ];
    $local = "false"; // Set to true if TOR is installed on your server (apt install tor)
    if ($local == "true") {
        include "api/index.php";
        $result = curl_get_tor($plo);
        return $result;
    }
    // Call default proxy if TOR is not installed
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.bitrequest.app/tor/proxy/v1/ln/tor/api/");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($plo));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, 35); //timeout in seconds
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
?>
