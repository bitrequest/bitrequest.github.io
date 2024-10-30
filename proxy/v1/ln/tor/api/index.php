<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
//header("Access-Control-Allow-Origin: *"); // uncomment for nginx

$pd = file_get_contents("php://input");
$pd_obj = json_decode($pd, true);
if (isset($pd_obj)) {
    echo curl_get_tor($pd_obj);
}

function curl_get_tor($payld) {
    $url = $payld["url"];
    $data = $payld["data"];
    $headers = $payld["headers"];
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
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, 25); //timeout in seconds
    // TOR
    curl_setopt($ch, CURLOPT_PROXY, "localhost:9050");
    curl_setopt($ch, CURLOPT_PROXYTYPE, 7);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        return err_obj("411", curl_error($ch));
    }
    curl_close($ch);
    if ($result) {
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