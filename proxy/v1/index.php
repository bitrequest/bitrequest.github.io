<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
header("Access-Control-Allow-Origin: *");

// Include necessary files
try {
    include_once "filter.php";
    include_once "../config.php";
    include_once "api.php";
} catch (Exception $e) {
    die(json_encode([
        "error" => [
            "code" => "500",
            "message" => "Failed to include required files"
        ]
    ]));
}

// Retrieves a value from POST data with optional fallback to default value
function get_postvalue($key, $default = false) {
    return $_POST[$key] ?? $default;
}

// Handles API key request, formats and encodes key data into a base64 string
function handle_gk_request($keys) {
    $key_data = [
        "if_id" => $keys["infura"] ?? "",
        "ga_id" => $keys["googleauth"] ?? "",
        "bc_id" => $keys["blockcypher"] ?? "",
        "al_id" => $keys["alchemy"] ?? ""
    ];
    return ["k" => base64_encode(json_encode($key_data))];
}

// Handles System BU request for account data with base64 URL encoding
function handle_systembu_request($params, $postheaders) {
    $bu_data = json_encode([
        "base64" => $params["url"] ?? "",
        "account" => $params["account"] ?? ""
    ]);
    return api(null, $bu_data, $postheaders, 604800, "1w", null, null);
}

// Handles OAuth credential fetch requests to Google's token endpoint
function handle_fetchcreds_request($postdata, $keys) {
    $postdata["MIME-type"] = "application/x-www-form-urlencoded; charset=UTF-8";
    $postdata["client_id"] = $keys["googleauth"] ?? "";
    $postdata["client_secret"] = $keys["google_secret"] ?? "";
    return api("https://oauth2.googleapis.com/token", $postdata, null, 0, "1d", null, null);
}

// Routes custom request types to their appropriate handler functions
function handle_custom_request($custom, $postdata, $params, $data_var, $postheaders, $cache_time, $cache_folder, $keys) {
    switch ($custom) {
        case "gk":
            return handle_gk_request($keys);
        case "add":
            $result = api(null, json_encode($postdata), null, 0, "1d", null, null);
            // Add TOR support info
            $result["tor"] = has_tor();
            return $result;
        case "nano_txd":
            return api("nano", $data_var, $postheaders, $cache_time, $cache_folder, null, null);
        case "electrum":
            return api("electrum", $data_var, $postheaders, $cache_time, $cache_folder, null, null);
        case "system_bu":
            return handle_systembu_request($params, $postheaders);
        case "get_system_bu":
            return api(null, null, null, 604800, "1w", null, $params);
        case "fetch_creds":
            return handle_fetchcreds_request($postdata, $keys);
        default:
            return ["error" => ["message" => "Unknown custom request type"]];
    }
}

// Creates a standardized error response with code and message
function create_error_response($code, $message) {
    return [
        "error" => [
            "code" => $code,
            "message" => $message
        ]
    ];
}

// Main execution begins here
try {
    // Extract POST data
    $postdata = $_POST;
    $params = get_postvalue("params", []);
    $method = $params["method"] ?? false;
    $proxyheaders = $params["headers"] ?? false;
    $payload = $params["data"] ?? false;
    $custom = get_postvalue("custom");
    $apiname = get_postvalue("api");
    $apiurl = get_postvalue("api_url");
    $apikey = get_postvalue("api_key");
    $keyparam = get_postvalue("key_param");
    $ampersand = get_postvalue("ampersand");
    $nokey = get_postvalue("nokey");
    $bearer = get_postvalue("bearer");
    $cache_time = get_postvalue("cachetime");
    $cache_folder = get_postvalue("cachefolder");

    // Validate API URL for non-custom requests
    if (!$custom && !$apiurl) {
        echo json_encode(["ping" => create_error_response("400", "Missing API URL")]);
        exit;
    }

    // Define data
    $data_var = $payload ?: null;

    // Define key
    $accesstoken = isset($keys) && isset($apiname) && isset($keys[$apiname]) ? $keys[$apiname] : false;
    $auth_token = $apikey ?: $accesstoken;

    // Construct headers
    $postheaders = [];
    if ($proxyheaders || $method == "POST" || $bearer) {
        $postheaders[] = "Content-Type: application/json";
        if (isset($payload) && is_string($payload)) {
            $postheaders[] = "Content-Length: " . strlen($payload);
        }
        $allowed_headers = [
            "Content-Type",
            "contentType",
            "Grpc-Metadata-macaroon",
            "Rune",
            "X-Api-Key",
            "Authorization"
        ];
        
        if ($proxyheaders && is_array($proxyheaders)) {
            foreach ($proxyheaders as $key => $value) {
                if (is_string($key) && is_string($value)
                    && in_array($key, $allowed_headers)
                    && !preg_match("/[\r\n]/", $value)) {
                    $postheaders[] = $key . ": " . $value;
                }
            }
        }
    }

    // Add Authorization header if needed
    if ($bearer) {
        if ($auth_token) {
            $postheaders[] = "Authorization: Bearer " . $auth_token;
        }
    }

    // Construct URL
    $key_param1 = $keyparam ?: "";
    $ampersand1 = $ampersand ?: "";
    $key_param_var = ($auth_token && $keyparam != "bearer") ? $ampersand1 . $key_param1 . $auth_token : "";
    $key_param2 = ($apikey && $nokey == "true") ? "" : $key_param_var;
    $new_url = $apiurl . $key_param2;

    // Handle custom or standard API requests
    if ($custom) {
        $result = handle_custom_request($custom, $postdata, $params, $data_var, $postheaders, $cache_time, $cache_folder, $keys ?? []);
    } else {
        $result = api($new_url, $data_var, $postheaders, $cache_time, $cache_folder, null, null);
    }

    // Output the result
    echo json_encode(["ping" => $result]);
} catch (Exception $e) {
    echo json_encode([
        "ping" => create_error_response("500", "Unexpected error: " . $e->getMessage())
    ]);
}