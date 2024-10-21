<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
//header("Access-Control-Allow-Origin: *"); // uncomment for nginx

require_once "../../api.php";

const CACHE_TIME = "2m";
const CACHE_DIR = "cache/" . CACHE_TIME . "/";

// Main function to handle incoming requests
function main() {
    $postData = $_POST;
    if (empty($postData)) {
        send_response(["error" => "No data provided"]);
        return;
    }

    $function = $postData["function"] ?? "";
    switch ($function) {
        case "post":
            handle_post($postData);
            break;
        case "fetch":
            handle_fetch($postData);
            break;
        default:
            send_response(["error" => "Invalid function"]);
    }
}

// Handles the creation of short URLs
function handle_post($data) {
    $shortUrl = $data["shorturl"] ?? "";
    $longUrl = $data["longurl"] ?? "";

    if (empty($shortUrl) || empty($longUrl)) {
        send_response(["error" => "Missing shorturl or longurl"]);
        return;
    }

    $cacheFile = CACHE_DIR . $shortUrl;
    if (file_exists($cacheFile)) {
        send_response([
            "status" => "file exists",
            "shorturl" => $shortUrl
        ]);
        return;
    }

    $result = api(null, $longUrl, null, 6220800, CACHE_TIME, null, $shortUrl);
    if (!$result) {
        send_response(["error" => "Failed to create short URL"]);
        return;
    }

    $apiResult = $result["br_result"] ?? [];
    if (!empty($apiResult["error"])) {
        send_response(["error" => $apiResult["error"]["message"]]);
        return;
    }

    if (!empty($result["br_cache"])) {
        send_response([
            "status" => "file cached",
            "shorturl" => $shortUrl
        ]);
    } else {
        send_response(["error" => "Unexpected error occurred"]);
    }
}

// Handles the retrieval of long URLs from short IDs
function handle_fetch($data) {
    $shortId = $data["shortid"] ?? "";

    if (empty($shortId)) {
        send_response(["error" => "Missing shortid"]);
        return;
    }

    $cacheFile = CACHE_DIR . $shortId;
    if (!file_exists($cacheFile)) {
        send_response([
            "status" => "file not found",
            "longurl" => null
        ]);
        return;
    }

    $content = file_get_contents($cacheFile);
    if ($content === false) {
        send_response(["error" => "Failed to read cache file"]);
        return;
    }

    $decoded = json_decode(base64_decode($content), true);
    if ($decoded === null) {
        send_response(["error" => "Invalid cache data"]);
        return;
    }

    send_response([
        "status" => "file exists",
        "sharedurl" => $decoded["sharedurl"] ?? null
    ]);
}

// Sends a JSON-encoded response
function send_response($data) {
    echo json_encode([
        "ping" => [
            "br_cache" => [
                "version" => VERSION,
            ],
            "br_result" => $data
        ]
    ], JSON_PRETTY_PRINT);
}

main();