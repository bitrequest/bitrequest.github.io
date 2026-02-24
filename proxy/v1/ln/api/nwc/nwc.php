<?php

// ─── Config ───────────────────────────────────────────────────────────────────
// Override if your Node.js server runs on a different host/port
define("NWC_NODE_ENDPOINT", TOR_PROXY . ":8030/nwc");
define("NWC_TIMEOUT", 35); // seconds

// ─── Core request ─────────────────────────────────────────────────────────────
function nwc_request(string $nwc_uri, string $method, array $params): array {
    $payload = json_encode([
        "uri"    => $nwc_uri,
        "method" => $method,
        "params" => $params
    ]);
    $ch = curl_init(NWC_NODE_ENDPOINT);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => NWC_TIMEOUT,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json"]
    ]);

    $response  = curl_exec($ch);
    $curl_err  = curl_errno($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($curl_err) {
        throw new Exception("NWC node unreachable — is the Node.js server running? (curl error: $curl_err)");
    }
    $result = json_decode($response, true);
    if (!is_array($result)) {
        throw new Exception("NWC node returned invalid response");
    }
    if (!($result["ok"] ?? false)) {
        throw new Exception("NWC error: " . ($result["error"] ?? "unknown"));
    }
    return $result["result"];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a Lightning invoice.
 * Returns array with keys: invoice, payment_hash, expires_at
 */
function nwc_create_invoice(string $nwc_uri, int $amount_sats, string $description = "", int $expiry): array {
    return nwc_request($nwc_uri, "make_invoice", [
        "amount"      => $amount_sats,
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
        "type"  => "incoming"
    ]);
    $transactions = array_reverse($result["transactions"] ?? []);
    return ["invoices" => $transactions];
}