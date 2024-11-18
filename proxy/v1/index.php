<?php
    // Set headers
    header("Content-Type: application/json");
    header("Access-Control-Allow-Headers: Cache-Control, Pragma");
    //header("Access-Control-Allow-Origin: *"); // uncomment for nginx

    // Include necessary files
    include "../config.php";
    include "api.php";

    // Function to get a value from POST data or return a default
    function get_postvalue($key, $default = false) {
        return $_POST[$key] ?? $default;
    }

    // Extract POST data
    $postdata = $_POST;
    $params = get_postvalue("params", []);
    $method = $params["method"] ?? false;
    $proxyheaders = $params["headers"] ?? false;
    $payload = $params["data"] ?? false;
    $rpc = get_postvalue("rpc");
    $custom = get_postvalue("custom");
    $apiname = get_postvalue("api");
    $apiurl = get_postvalue("api_url");
    $apikey = get_postvalue("api_key");
    $keyparam = get_postvalue("key_param");
    $ampersand = get_postvalue("ampersand");
    $search = get_postvalue("search");
    $nokey = get_postvalue("nokey");
    $auth_header = get_postvalue("auth_header");
    $bearer = get_postvalue("bearer");
    $cache_time = get_postvalue("cachetime");
    $cache_folder = get_postvalue("cachefolder");

    // Define data
    $data_var = $payload ?: null;

    // Define key
    $accesstoken = $keys[$apiname] ?? false;
    $auth_token = $apikey ?: $accesstoken;

    // Construct headers
    $postheaders = [];
    if ($proxyheaders || $method == "POST" || $bearer) {
        $postheaders[] = "Content-Type: application/json";
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
            $postheaders[] = "Authorization: Bearer " . $auth_token;
        }
        if ($bearer == "tls_wildcard") {
            $postheaders["tls_wildcard"] = true;
        }
    }

    // Construct URL
    $key_param1 = $keyparam ?: "";
    $ampersand1 = $ampersand ?: "";
    $key_param_var = ($auth_token && $keyparam != "bearer") ? $ampersand1 . $key_param1 . $auth_token : "";
    $key_param2 = ($apikey && $nokey == "true") ? "" : $key_param_var;
    $new_url = $apiurl . $key_param2;

    // Handle custom requests
    if ($custom) {
        $result = handle_custom_request($custom, $postdata, $params, $data_var, $postheaders, $cache_time, $cache_folder, $keys);
        echo json_encode(["ping" => $result]);
        exit;
    }

    // Handle regular API request
    $result = api($new_url, $data_var, $postheaders, $cache_time, $cache_folder, null, null);
    echo json_encode(["ping" => $result]);

    // Handle custom requests
    function handle_custom_request($custom, $postdata, $params, $data_var, $postheaders, $cache_time, $cache_folder, $keys) {
        switch ($custom) {
            case "gk":
                return handle_gk_request($keys);
            case "add":
                return api(null, json_encode($postdata), null, 0, "1d", null, null);
            case "nano_txd":
                return handle_nano_txd_request($data_var, $postheaders, $cache_time, $cache_folder);
            case "system_bu":
                return handle_systembu_request($params, $postheaders);
            case "get_system_bu":
                return api(null, null, null, 604800, "1w", null, $params);
            case "fetch_creds":
                return handle_fetchcreds_request($postdata, $keys);
            default:
                return null;
        }
    }

    // Handle key request
    function handle_gk_request($keys) {
        $key_data = [
            "if_id" => $keys["infura"] ?? "",
            "ga_id" => $keys["googleauth"] ?? "",
            "bc_id" => $keys["blockcypher"] ?? "",
            "al_id" => $keys["alchemy"] ?? ""
        ];
        return ["k" => base64_encode(json_encode($key_data))];
    }

    // Handle Nano TXD request
    function handle_nano_txd_request($data_var, $postheaders, $cache_time, $cache_folder) {
        $nano_url = "https://" . $_SERVER["HTTP_HOST"] . $_SERVER["BASE"] . "custom/rpcs/nano/?pl=" . base64_encode(json_encode($data_var));
        return api($nano_url, $data_var, $postheaders, $cache_time, $cache_folder, null, null);
    }

    // Handle System BU request
    function handle_systembu_request($params, $postheaders) {
        $bu_data = json_encode([
            "base64" => $params["url"] ?? "",
            "account" => $params["account"] ?? ""
        ]);
        return api(null, $bu_data, $postheaders, 604800, "1w", null, null);
    }

    // Handle Fetch Creds request
    function handle_fetchcreds_request($postdata, $keys) {
        $postdata["MIME-type"] = "application/x-www-form-urlencoded; charset=UTF-8";
        $postdata["client_id"] = $keys["googleauth"] ?? "";
        $postdata["client_secret"] = $keys["google_secret"] ?? "";
        return api("https://oauth2.googleapis.com/token", $postdata, null, 0, "1d", null, null);
    }