<?php
/**
 * Fast drop-in replacement for spark_ecies_encrypt() using Node.js.
 * Falls back to bcmath version if Node.js endpoint is unavailable.
 */

define("SPARK_ECIES_ENDPOINT", TOR_PROXY . ":8030/spark-ecies");
define("SPARK_ECIES_TIMEOUT", 6);

function spark_ecies_encrypt(string $plaintext_bytes, string $recipient_pubkey_hex): string|false {
    $payload = json_encode([
        "plaintext_hex"        => bin2hex($plaintext_bytes),
        "recipient_pubkey_hex" => $recipient_pubkey_hex
    ]);
    $ch = curl_init(SPARK_ECIES_ENDPOINT);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => SPARK_ECIES_TIMEOUT,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json"]
    ]);
    $response  = curl_exec($ch);
    $curl_err  = curl_errno($ch);
    curl_close($ch);
    // If Node.js is available and returned a valid result, use it
    if (!$curl_err && $response) {
        $result = json_decode($response, true);
        if ($result["ok"] ?? false) {
            return hex2bin($result["ciphertext_hex"]);
        }
    }
    // Fallback to local bcmath implementation
    return spark_ecies_encrypt_bcmath($plaintext_bytes, $recipient_pubkey_hex);
}
