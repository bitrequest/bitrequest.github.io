<?php

// Pure-PHP fallback used when the Node.js relay is offline.
include_once "nwc_native.php";

// ─── Config ───────────────────────────────────────────────────────────────────
// Override if your Node.js server runs on a different host/port
define("NWC_NODE_FAST_ENDPOINT", TOR_PROXY . ":8030/nwc");
define("NWC_TIMEOUT", 35); // seconds

// ─── Core request ─────────────────────────────────────────────────────────────
function nwc_request(string $nwc_uri, string $method, array $params): array {
    $payload = json_encode([
        "uri" => $nwc_uri,
        "method" => $method,
        "params" => $params
    ]);
    $ch = curl_init(NWC_NODE_FAST_ENDPOINT);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => NWC_TIMEOUT,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => ["Content-Type: application/json"]
    ]);

    $response = curl_exec($ch);
    $curl_err = curl_errno($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // If Node.js returned a well-formed NWC envelope, use its result —
    // including its semantic errors (wallet-side failures that PHP would
    // also hit). Anything malformed (404 HTML, 502 from a reverse proxy,
    // empty body, non-JSON, missing "ok" key) is treated as Node being
    // unreachable and falls through to the pure-PHP implementation.
    if (!$curl_err && is_string($response) && $response !== "") {
        $result = json_decode($response, true);
        if (is_array($result) && array_key_exists("ok", $result)) {
            if ($result["ok"]) {
                return $result["result"] ?? [];
            }
            throw new Exception("NWC error: " . ($result["error"] ?? "unknown"));
        }
    }

    // Node.js endpoint unreachable or misconfigured — fall back.
    return nwc_request_native($nwc_uri, $method, $params);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a Lightning invoice.
 * Returns array with keys: invoice, payment_hash, expires_at
 */
function nwc_create_invoice(string $nwc_uri, int $amount_sats, string $description, int $expiry = 60): array {
    return nwc_request($nwc_uri, "make_invoice", [
        "amount" => $amount_sats,
        "description" => $description,
        "expiry" => $expiry
    ]);
}

/**
 * Look up invoice status by payment hash.
 * Returns array with keys: settled_at (null if unpaid), amount, description, etc.
 */
function nwc_lookup_invoice(string $nwc_uri, string $payment_hash): array {
    return nwc_request($nwc_uri, "lookup_invoice", [
        "payment_hash" => $payment_hash
    ]);
}

/**
 * Check if nostr relay is reachable.
 * returns wallet info.
 */
function nwc_get_info(string $nwc_uri): array {
    return nwc_request($nwc_uri, "get_info", []);
}

/**
 * Look up all incoming transactions (invoices.
 */
function nwc_list_transactions(string $nwc_uri, int $limit = 50): array {
    $result = nwc_request($nwc_uri, "list_transactions", [
        "limit" => $limit,
        "type" => "incoming"
    ]);
    $transactions = array_reverse($result["transactions"] ?? []);
    return ["invoices" => $transactions];
}