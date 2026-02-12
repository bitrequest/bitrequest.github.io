<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
header("Access-Control-Allow-Origin: *");

include_once "../filter.php";
include "../../config.php";
include "../api.php";

// Extract payment ID from GET parameters with validation
$pid = isset($_GET["id"]) && is_string($_GET["id"]) ? safe_filename(substr($_GET["id"], 1, 10)) : false;
$path = $pid ? "api/cache/tx/" . $pid : false;

// Check if the payment file exists and process the payment
if ($pid && file_exists($path)) {
    
    // Determine payment type based on ID prefix
    $type = isset($_GET["id"]) && is_string($_GET["id"]) ? substr($_GET["id"], 0, 1) : false;
    switch($type) {
        case "1":
            $type_txt = "local";
            break;
        case "2":
            $type_txt = "outgoing";
            break;
        default:
            $type_txt = "incoming";
    }
    $sats = isset($_GET["a"]) ? intval($_GET["a"]) : 0;
    
    // Set up payment title and callback URL parameters
    $title = isset($_GET["m"]) ? $_GET["m"] : "bitrequest " . $pid;
    $tget = isset($_GET["m"]) ? "" : "&m=" . rawurlencode($title);
    $logo = isset($lightning_setup["logo"]) ? $lightning_setup["logo"] : "";
    
    // Build callback URL securely from server environment variables
    $scheme = isset($_SERVER["REQUEST_SCHEME"]) ? $_SERVER["REQUEST_SCHEME"] : "https";
    $host = isset($_SERVER["HTTP_HOST"]) ? $_SERVER["HTTP_HOST"] : "";
    $uri_parts = isset($_SERVER["REQUEST_URI"]) ? explode("/ln/", $_SERVER["REQUEST_URI"]) : [""];
    $base_path = isset($uri_parts[0]) ? $uri_parts[0] : "";
    $query = isset($_SERVER["QUERY_STRING"]) ? $_SERVER["QUERY_STRING"] : "";
    
    $callback = $scheme . "://" . $host . $base_path . "/ln/api/?" . $query . $tget;
    try {
        // Prepare metadata array for LNURL
        $meta_arr = [["text/plain", $title]];
        if (strlen($logo) > 200) {
            $meta_arr[] = ["image/png;base64", $logo];
        }
        
        // Set up LNURL object with payment parameters
        $maxsend = $sats == 0 ? 100000000000 : $sats;
        $lnurl_obj = [
            "tag" => "payRequest",
            "callback" => $callback,
            "minSendable" => $sats,
            "maxSendable" => $maxsend,
            "metadata" => json_encode($meta_arr)
        ];
        
        // Output LNURL object as JSON with unescaped slashes
        echo json_encode($lnurl_obj, JSON_UNESCAPED_SLASHES);
        
        // Update payment status in the tracking file
        $status = json_encode([
            "pid" => $pid,
            "status" => "confirm",
            "rqtype" => $type_txt
        ]);
        if (file_put_contents($path, $status) !== false) {
            // Notify payment server about the confirmed payment
            $postheaders = [
                "post: " . $status,
                "tls_wildcard" => true
            ];
            curl_get(TOR_PROXY . ":8030/", $status, $postheaders);
        }
    } catch (Exception $e) {
        echo json_encode([
            "status" => "ERROR",
            "reason" => "Failed to process payment data"
        ]);
        return;
    }
} else {
    // Handle case where payment tracking file is not found
    echo json_encode([
        "status" => "ERROR",
        "reason" => "Tracking file " . ($pid ?: "unknown") . " not found. Please check directory permissions."
    ]);
    return;
}