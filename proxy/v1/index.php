<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
//header("Access-Control-Allow-Origin: *"); // uncomment for nginx

include "../config.php";
include "api.php";

$postdata = $_POST;
$params = isset($postdata["params"]) ? $postdata["params"] : false;
$method = isset($params["method"]) ? $params["method"] : false;
$proxyheaders = isset($params["headers"]) ? $params["headers"] : false;
$payload = isset($params["data"]) ? $params["data"] : false;
$rpc = isset($postdata["rpc"]) ? $postdata["rpc"] : false;
$custom = isset($postdata["custom"]) ? $postdata["custom"] : false;
$apiname = isset($postdata["api"]) ? $postdata["api"] : false;
$apiurl = isset($postdata["api_url"]) ? $postdata["api_url"] : false;
$apikey = isset($postdata["api_key"]) ? $postdata["api_key"] : false;
$keyparam = isset($postdata["key_param"]) ? $postdata["key_param"] : false;
$ampersand = isset($postdata["ampersand"]) ? $postdata["ampersand"] : false;
$search = isset($postdata["search"]) ? $postdata["search"] : false;
$nokey = isset($postdata["nokey"]) ? $postdata["nokey"] : false;
$auth_header = isset($postdata["auth_header"]) ? $postdata["auth_header"] : false;
$bearer = isset($postdata["bearer"]) ? $postdata["bearer"] : false;
$cache_time = isset($postdata["cachetime"]) ? $postdata["cachetime"] : false;
$cache_folder = isset($postdata["cachefolder"]) ? $postdata["cachefolder"] : false;

// Define data
$data_var = $payload ? $payload : null;

// Define key
$accestoken = isset($keys[$apiname]) ? $keys[$apiname] : false;
$auth_token = $apikey ? $apikey : $accestoken;

// Construct headers
if (isset($proxyheaders) || $method == "POST" || $bearer) {
	$postheaders = array(
        "Content-Type: application/json"
    );
    if (isset($payload)) {
        $postheaders[] = "Content-Length: " . strlen($payload);
    }
    if ($proxyheaders) {
        foreach ($proxyheaders as $key => $value) {
            $postheaders[] = $key . ": " . $value;
        }
    }
}

// Add Authorization header if needed
if ($bearer) {
    if ($auth_token) {
	    if ($bearer == "amberdata") {
        	$postheaders[] = "x-api-key: " . $auth_token;
    	}
    	else {
	    	$postheaders[] = "Authorization: Bearer " . $auth_token;
    	}
    }
    if ($bearer == "tls_wildcard") {
        $postheaders["tls_wildcard"] = true;
    }
}

// Construct url
$key_param_var = ($auth_token && $keyparam) ? $ampersand . $keyparam . $auth_token : "";
$key_param = ($apikey && $nokey == "true") ? "" : $key_param_var;
$new_url = $apiurl . $key_param;
if ($custom) {
    if ($custom == "gk") {
        $key_array = base64_encode(
            json_encode([
                "ad_id" => $keys["amberdata"],
                "if_id" => $keys["infura"],
                "ga_id" => $keys["googleauth"],
                "bc_id" => $keys["blockcypher"]
            ])
        );
        echo json_encode([
            "k" => $key_array
        ]);
        return;
    }
    if ($custom == "add") {
	    $result = api(null, json_encode($postdata), null, 0, "1d", null, null);
        echo json_encode([
            "ping" => $result
        ]);
        return;
    }
    if ($custom == "nano_txd") {
        include "custom/rpcs/nano/index.php";
        $result = nano($apiurl, $search, $data_var, $postheaders, $cache_time, $cache_folder, null, null);
        echo json_encode([
            "ping" => $result
        ]);
        return;
    }
    if ($custom == "system_bu") {
        $bu_data = json_encode(["base64" => $params["url"], "account" => $params["account"]], true);
        $result = api(null, $bu_data, $postheaders, 604800, "1w", null, null);
        echo json_encode([
            "ping" => $result
        ]);
        return;
    }
    if ($custom == "get_system_bu") {
        $result = api(null, null, null, 604800, "1w", null, $params);
        echo json_encode([
            "ping" => $result
        ]);
        return;
    }
    return;
}
$result = api($new_url, $data_var, $postheaders, $cache_time, $cache_folder, null, null);
echo json_encode([
    "ping" => $result
]);
?>