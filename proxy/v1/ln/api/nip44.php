<?php
/**
 * NIP-44 v2 encryption in pure PHP (secp256k1 ECDH → HKDF → ChaCha20 + HMAC-SHA256).
 *
 * ChaCha20 comes from OpenSSL (aes-less stream cipher, IV = 4-byte LE counter=0
 * || 12-byte nonce, verified against RFC 8439). HKDF/HMAC/SHA-256 are PHP core.
 * The ECDH reuses the shared secp256k1 primitives.
 *
 * Byte-for-byte compatible with the Node nip44.js in lightningws; both are
 * validated against the official nip44.vectors.json (see nip44_test.php).
 *
 * Spec: https://github.com/nostr-protocol/nips/blob/master/44.md
 */

require_once __DIR__ . "/secp256k1.php";

const NIP44_SALT = "nip44-v2";

// conversation_key = HKDF-extract(salt="nip44-v2", ikm = ECDH shared x-coord).
// Peer pubkey is x-only; lift with even-y ("02") as NIP-44 requires.
function nip44_conversation_key($privkey_hex, $peer_xonly_hex) {
    list($qx, $qy) = secp256k1_decompress("02" . $peer_xonly_hex);
    list($sx, $sy) = secp256k1_mul($privkey_hex, $qx, $qy);
    $shared_x = hex2bin(str_pad($sx, 64, "0", STR_PAD_LEFT));
    // HKDF-extract = HMAC(key=salt, msg=ikm)
    return hash_hmac("sha256", $shared_x, NIP44_SALT, true);
}

// HKDF-expand(prk, info, L) — SHA-256. PHP's hash_hkdf() does extract+expand
// together, so expand-only is implemented by hand.
function nip44_hkdf_expand($prk, $info, $length) {
    $okm = "";
    $t = "";
    $i = 1;
    while (strlen($okm) < $length) {
        $t = hash_hmac("sha256", $t . $info . chr($i), $prk, true);
        $okm .= $t;
        $i++;
    }
    return substr($okm, 0, $length);
}

// (chacha_key[32], chacha_nonce[12], hmac_key[32]) = HKDF-expand(conv_key, nonce, 76)
function nip44_message_keys($conv_key, $nonce) {
    $k = nip44_hkdf_expand($conv_key, $nonce, 76);
    return [substr($k, 0, 32), substr($k, 32, 12), substr($k, 44, 32)];
}

// Smallest power of two whose bit-length exceeds ($len-1), computed with an
// integer bit count — avoids float log2 rounding on exact powers of two.
function nip44_calc_padded_len($len) {
    if ($len <= 32) return 32;
    $v = $len - 1;
    $bits = 0;
    while ($v > 0) { $v >>= 1; $bits++; }
    $next_power = 1 << $bits;
    $chunk = $next_power <= 256 ? 32 : intdiv($next_power, 8);
    return $chunk * (intdiv($len - 1, $chunk) + 1);
}

function nip44_pad($plaintext) {
    $len = strlen($plaintext);
    if ($len < 1 || $len > 65535) {
        throw new Exception("nip44: plaintext must be 1..65535 bytes");
    }
    $padded_len = nip44_calc_padded_len($len);
    return pack("n", $len) . $plaintext . str_repeat("\x00", $padded_len - $len);
}

function nip44_unpad($padded) {
    if (strlen($padded) < 2) throw new Exception("nip44: invalid padding");
    $len = unpack("n", substr($padded, 0, 2))[1];
    $unpadded = substr($padded, 2, $len);
    if ($len < 1 || strlen($unpadded) !== $len || strlen($padded) !== 2 + nip44_calc_padded_len($len)) {
        throw new Exception("nip44: invalid padding");
    }
    return $unpadded;
}

// ChaCha20 is a stream cipher, so the same call decrypts. IV = counter(0) || nonce.
function nip44_chacha20($key, $nonce12, $data) {
    $iv = "\x00\x00\x00\x00" . $nonce12;
    return openssl_encrypt($data, "chacha20", $key, OPENSSL_RAW_DATA, $iv);
}

function nip44_encrypt($plaintext, $privkey_hex, $peer_xonly_hex, $nonce = null) {
    $conv_key = nip44_conversation_key($privkey_hex, $peer_xonly_hex);
    if ($nonce === null) $nonce = random_bytes(32);
    if (strlen($nonce) !== 32) throw new Exception("nip44: nonce must be 32 bytes");
    list($chacha_key, $chacha_nonce, $hmac_key) = nip44_message_keys($conv_key, $nonce);
    $ciphertext = nip44_chacha20($chacha_key, $chacha_nonce, nip44_pad($plaintext));
    if ($ciphertext === false) throw new Exception("nip44: chacha20 failed");
    $mac = hash_hmac("sha256", $nonce . $ciphertext, $hmac_key, true);
    return base64_encode("\x02" . $nonce . $ciphertext . $mac);
}

function nip44_decrypt($payload_b64, $privkey_hex, $peer_xonly_hex) {
    if (!is_string($payload_b64) || $payload_b64 === "" || $payload_b64[0] === "#") {
        throw new Exception("nip44: unsupported payload");
    }
    $data = base64_decode($payload_b64, true);
    if ($data === false || strlen($data) < 99 || ord($data[0]) !== 2) {
        throw new Exception("nip44: bad version/length");
    }
    $nonce = substr($data, 1, 32);
    $mac = substr($data, -32);
    $ciphertext = substr($data, 33, strlen($data) - 33 - 32);
    $conv_key = nip44_conversation_key($privkey_hex, $peer_xonly_hex);
    list($chacha_key, $chacha_nonce, $hmac_key) = nip44_message_keys($conv_key, $nonce);
    $calc_mac = hash_hmac("sha256", $nonce . $ciphertext, $hmac_key, true);
    if (!hash_equals($calc_mac, $mac)) {
        throw new Exception("nip44: invalid MAC");
    }
    $padded = nip44_chacha20($chacha_key, $chacha_nonce, $ciphertext);
    if ($padded === false) throw new Exception("nip44: chacha20 failed");
    return nip44_unpad($padded);
}
