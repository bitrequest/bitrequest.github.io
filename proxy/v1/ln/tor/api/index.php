<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
//header("Access-Control-Allow-Origin: *"); // uncomment for nginx

$pd = file_get_contents("php://input");
if ($pd === false) {
    echo err_obj("411", "Failed to read input");
    exit;
}

$pd_obj = json_decode($pd, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo err_obj("411", "Invalid JSON input");
    exit;
}

if (!empty($pd_obj)) {
    echo curl_get_tor($pd_obj);
}

function curl_get_tor($payld) {
    if (!isset($payld["url"])) {
        return err_obj("411", "URL is required");
    }
    
    $url = $payld["url"];
    $data = $payld["data"] ?? null;
    $headers = $payld["headers"] ?? null;
    
    $ch = curl_init();
    if ($ch === false) {
        return err_obj("411", "Failed to initialize CURL");
    }
    
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
    
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, 25); // timeout in seconds
    // TOR
    curl_setopt($ch, CURLOPT_PROXY, "localhost:9050");
    curl_setopt($ch, CURLOPT_PROXYTYPE, 7);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
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

function err_obj($code, $message) {
    return json_encode([
        "error" => [
            "code" => $code,
            "message" => $message,
        ],
    ]);
}
?>