<?php
/**
 * NWC (Nostr Wallet Connect / NIP-47) — Pure PHP fallback.
 *
 * Used when NWC_NODE_FAST_ENDPOINT (the Node.js relay) is unreachable.
 * Implements NIP-04 encryption, BIP-340 schnorr signing, secp256k1 ECDH
 * (bcmath), and a minimal WebSocket client over stream sockets.
 *
 * Public entry point: nwc_request_native($nwc_uri, $method, $params)
 *
 * Requirements: PHP 8.0+, bcmath, OpenSSL.
 *
 * Performance: ~3 secp256k1 scalar multiplications in bcmath per request
 * (~1–3s on commodity hardware) + relay round-trip. Fine for a fallback.
 */

// === Shared secp256k1 primitives (constants, helpers, EC arithmetic,
//     pubkey derivation including BIP-340 x-only) live in secp256k1.php ===
require_once __DIR__ . "/../secp256k1.php";

// ==========================================================
// BIP-340 SCHNORR
// ==========================================================

function nwc_tagged_hash($tag, $msg) {
    $th = hash("sha256", $tag, true);
    return hash("sha256", $th . $th . $msg, true);
}

/**
 * BIP-340 schnorr signature.
 *  $msg32       — 32-byte binary message (the event id raw bytes)
 *  $privkey_hex — 64-hex private key in [1, n-1]
 *  $aux_rand    — 32 bytes; null = random (recommended), 32 zero bytes = deterministic test mode
 * Returns 128-hex signature.
 */
function nwc_schnorr_sign($msg32, $privkey_hex, $aux_rand = null) {
    $n = _sn();
    $d_prime = _hex2dec($privkey_hex);
    if (bccomp($d_prime, "1") < 0 || bccomp($d_prime, bcsub($n, "1")) > 0) {
        throw new Exception("Schnorr: privkey out of range");
    }
    // P = d'·G
    list($px, $py) = secp256k1_mul(_dec2hex($d_prime), SECP256K1_GX_HEX, SECP256K1_GY_HEX);
    // If P.y is odd, use d = n - d'
    $d = (bcmod(_hex2dec($py), "2") !== "0") ? bcsub($n, $d_prime) : $d_prime;
    // aux
    if ($aux_rand === null) $aux_rand = random_bytes(32);
    if (strlen($aux_rand) !== 32) throw new Exception("Schnorr: aux_rand must be 32 bytes");
    $aux_hash = nwc_tagged_hash("BIP0340/aux", $aux_rand);
    // t = bytes(d) XOR aux_hash
    $d_bytes = hex2bin(str_pad(_dec2hex($d), 64, "0", STR_PAD_LEFT));
    $t = $d_bytes ^ $aux_hash;
    // rand = H_nonce(t || bytes(P.x) || m)
    $rand = nwc_tagged_hash("BIP0340/nonce", $t . hex2bin($px) . $msg32);
    $k_prime = _bcmod_pos(_hex2dec(bin2hex($rand)), $n);
    if (bccomp($k_prime, "0") == 0) throw new Exception("Schnorr: k' = 0");
    // R = k'·G
    list($rx, $ry) = secp256k1_mul(_dec2hex($k_prime), SECP256K1_GX_HEX, SECP256K1_GY_HEX);
    $k = (bcmod(_hex2dec($ry), "2") !== "0") ? bcsub($n, $k_prime) : $k_prime;
    // e = H_challenge(R.x || P.x || m) mod n
    $e_hash = nwc_tagged_hash("BIP0340/challenge", hex2bin($rx) . hex2bin($px) . $msg32);
    $e = _bcmod_pos(_hex2dec(bin2hex($e_hash)), $n);
    // s = (k + e·d) mod n
    $s = _bcmod_pos(bcadd($k, bcmul($e, $d)), $n);
    return $rx . str_pad(_dec2hex($s), 64, "0", STR_PAD_LEFT);
}

// ==========================================================
// NIP-04 (ECDH + AES-256-CBC)
// ==========================================================

/**
 * Shared secret: x-coordinate of (privkey × peer_xonly_pubkey).
 * Peer pubkey is x-only (32 bytes hex); we lift with even-y (NIP-04 convention).
 */
function nwc_nip04_shared($privkey_hex, $peer_xonly_hex) {
    list($qx, $qy) = secp256k1_decompress("02" . $peer_xonly_hex);
    list($sx, $sy) = secp256k1_mul($privkey_hex, $qx, $qy);
    return hex2bin(str_pad($sx, 64, "0", STR_PAD_LEFT));
}

function nwc_nip04_encrypt($plaintext, $privkey_hex, $peer_xonly_hex) {
    $secret = nwc_nip04_shared($privkey_hex, $peer_xonly_hex);
    $iv = random_bytes(16);
    $ct = openssl_encrypt($plaintext, "aes-256-cbc", $secret, OPENSSL_RAW_DATA, $iv);
    if ($ct === false) throw new Exception("NIP-04 encrypt failed");
    return base64_encode($ct) . "?iv=" . base64_encode($iv);
}

function nwc_nip04_decrypt($cipher_iv, $privkey_hex, $peer_xonly_hex) {
    $parts = explode("?iv=", $cipher_iv, 2);
    if (count($parts) !== 2) throw new Exception("NIP-04 ciphertext malformed");
    $ct = base64_decode($parts[0], true);
    $iv = base64_decode($parts[1], true);
    if ($ct === false || $iv === false) throw new Exception("NIP-04 base64 decode failed");
    $secret = nwc_nip04_shared($privkey_hex, $peer_xonly_hex);
    $pt = openssl_decrypt($ct, "aes-256-cbc", $secret, OPENSSL_RAW_DATA, $iv);
    if ($pt === false) throw new Exception("NIP-04 AES decrypt failed");
    return $pt;
}

// ==========================================================
// NOSTR EVENT (NIP-01 + NIP-47)
// ==========================================================

function nwc_build_event($method, $params, $privkey_hex, $wallet_pubkey_hex) {
    // Cast params to stdClass so empty params encode as `{}`, not `[]`.
    $content_plain = json_encode([
        "method" => $method,
        "params" => (object)$params
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $content = nwc_nip04_encrypt($content_plain, $privkey_hex, $wallet_pubkey_hex);
    $pubkey = secp256k1_xonly_pubkey($privkey_hex);
    $created_at = time();
    $kind = 23194;
    $tags = [["p", $wallet_pubkey_hex]];
    // NIP-01 event id: sha256 of [0, pubkey, created_at, kind, tags, content]
    $serialized = json_encode(
        [0, $pubkey, $created_at, $kind, $tags, $content],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    $id_bin = hash("sha256", $serialized, true);
    $id = bin2hex($id_bin);
    $sig = nwc_schnorr_sign($id_bin, $privkey_hex);
    return [
        "id" => $id,
        "pubkey" => $pubkey,
        "created_at" => $created_at,
        "kind" => $kind,
        "tags" => $tags,
        "content" => $content,
        "sig" => $sig
    ];
}

// ==========================================================
// MINIMAL WEBSOCKET CLIENT
// ==========================================================

function _nwc_ws_read_exact($sock, $n, $deadline) {
    $buf = "";
    while (strlen($buf) < $n) {
        $remaining = $deadline - microtime(true);
        if ($remaining <= 0) return null;
        $r = [$sock]; $w = null; $e = null;
        $sec  = (int)$remaining;
        $usec = (int)(($remaining - $sec) * 1_000_000);
        $ready = @stream_select($r, $w, $e, $sec, $usec);
        if ($ready === false || $ready === 0) return null;
        $chunk = fread($sock, $n - strlen($buf));
        if ($chunk === false || $chunk === "") {
            $meta = stream_get_meta_data($sock);
            if ($meta["eof"] || $meta["timed_out"]) return null;
            continue;
        }
        $buf .= $chunk;
    }
    return $buf;
}

function nwc_ws_connect($url, $timeout = 10) {
    $parts = parse_url($url);
    if (!$parts || empty($parts["host"])) throw new Exception("Bad relay URL: $url");
    $scheme = $parts["scheme"] ?? "wss";
    $host = $parts["host"];
    $port = $parts["port"] ?? ($scheme === "wss" ? 443 : 80);
    $path = ($parts["path"] ?? "/") . (isset($parts["query"]) ? "?" . $parts["query"] : "");
    $transport = ($scheme === "wss") ? "ssl://" : "tcp://";
    $ctx = stream_context_create([
        "ssl" => [
            "verify_peer" => true,
            "verify_peer_name" => true,
            "SNI_enabled" => true,
            "peer_name" => $host
        ]
    ]);
    $errno = 0; $errstr = "";
    $sock = @stream_socket_client(
        $transport . $host . ":" . $port,
        $errno, $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT,
        $ctx
    );
    if (!$sock) throw new Exception("WS connect failed ($errno): $errstr");
    stream_set_timeout($sock, $timeout);
    // Handshake
    $key = base64_encode(random_bytes(16));
    $req = "GET $path HTTP/1.1\r\n"
         . "Host: $host" . ($port != 443 && $port != 80 ? ":$port" : "") . "\r\n"
         . "Upgrade: websocket\r\n"
         . "Connection: Upgrade\r\n"
         . "Sec-WebSocket-Key: $key\r\n"
         . "Sec-WebSocket-Version: 13\r\n"
         . "User-Agent: bitrequest-nwc-fallback/1.0\r\n"
         . "\r\n";
    if (fwrite($sock, $req) === false) {
        fclose($sock);
        throw new Exception("WS handshake write failed");
    }
    // Read status line + headers
    $resp = "";
    $start = microtime(true);
    while (microtime(true) - $start < $timeout) {
        $line = fgets($sock, 4096);
        if ($line === false) {
            $meta = stream_get_meta_data($sock);
            if ($meta["timed_out"] || $meta["eof"]) break;
            continue;
        }
        $resp .= $line;
        if ($line === "\r\n") break;
    }
    if (!preg_match("#^HTTP/1\\.1 101#i", $resp)) {
        fclose($sock);
        throw new Exception("WS handshake rejected: " . trim(strtok($resp, "\r\n")));
    }
    return $sock;
}

function nwc_ws_send($sock, $payload) {
    $len = strlen($payload);
    $frame = chr(0x81); // FIN=1, opcode=0x1 (text)
    if ($len < 126) {
        $frame .= chr(0x80 | $len);
    } elseif ($len < 65536) {
        $frame .= chr(0x80 | 126) . pack("n", $len);
    } else {
        // pack("J", ...) is 64-bit big-endian — needed for the WS extended payload length.
        $frame .= chr(0x80 | 127) . pack("J", $len);
    }
    $mask = random_bytes(4);
    $frame .= $mask;
    // XOR-mask in 4-byte chunks for speed
    $masked = "";
    for ($i = 0; $i < $len; $i += 4) {
        $chunk = substr($payload, $i, 4);
        $masked .= $chunk ^ substr($mask, 0, strlen($chunk));
    }
    $frame .= $masked;
    if (fwrite($sock, $frame) === false) throw new Exception("WS send failed");
}

function nwc_ws_send_close($sock) {
    // Code 1000 (normal closure), masked, no reason
    $payload = pack("n", 1000);
    $mask = random_bytes(4);
    $masked = "";
    for ($i = 0; $i < strlen($payload); $i++) $masked .= $payload[$i] ^ $mask[$i % 4];
    @fwrite($sock, chr(0x88) . chr(0x80 | strlen($payload)) . $mask . $masked);
}

/**
 * Receive one full message (reassembling fragmented frames per RFC 6455).
 * Returns ["opcode" => int, "payload" => string] or null on timeout/close.
 *
 * Many relays (incl. relay.getalby.com) split large NWC responses into a
 * first frame with FIN=0 and continuation frames (opcode=0) with FIN=1 on
 * the last one. This loop buffers the payload across fragments and returns
 * once FIN=1 arrives. Control frames (ping/pong/close) are handled inline
 * without disturbing the in-flight message.
 */
function nwc_ws_recv($sock, $deadline) {
    $message_payload = "";
    $message_opcode  = null;
    while (true) {
        $hdr = _nwc_ws_read_exact($sock, 2, $deadline);
        if ($hdr === null) return null;
        $b1 = ord($hdr[0]);
        $b2 = ord($hdr[1]);
        $fin = ($b1 & 0x80) !== 0;
        $opcode = $b1 & 0x0f;
        $masked = ($b2 & 0x80) !== 0;
        $len = $b2 & 0x7f;
        if ($len === 126) {
            $ext = _nwc_ws_read_exact($sock, 2, $deadline);
            if ($ext === null) return null;
            $len = unpack("n", $ext)[1];
        } elseif ($len === 127) {
            $ext = _nwc_ws_read_exact($sock, 8, $deadline);
            if ($ext === null) return null;
            $len = unpack("J", $ext)[1];
        }
        $mask_key = "";
        if ($masked) {
            $mask_key = _nwc_ws_read_exact($sock, 4, $deadline);
            if ($mask_key === null) return null;
        }
        $payload = $len > 0 ? _nwc_ws_read_exact($sock, $len, $deadline) : "";
        if ($payload === null) return null;
        if ($masked && $len > 0) {
            $u = "";
            for ($i = 0; $i < $len; $i++) $u .= $payload[$i] ^ $mask_key[$i % 4];
            $payload = $u;
        }
        // Control frames (ping/pong/close) are independent of any data
        // message currently being assembled — handle inline.
        if ($opcode === 0x8) return null; // close
        if ($opcode === 0x9) { // ping → pong
            $pong = chr(0x8A) . chr(0x80 | strlen($payload)) . random_bytes(4);
            // (lazy — empty pong payload; most relays don't care)
            @fwrite($sock, $pong);
            continue;
        }
        if ($opcode === 0xA) continue; // pong, ignore
        // Data frames: opcode 0x0 = continuation, 0x1 = text, 0x2 = binary.
        if ($opcode === 0x0) {
            if ($message_opcode === null) return null; // protocol violation
            $message_payload .= $payload;
        } else {
            $message_payload = $payload;
            $message_opcode  = $opcode;
        }
        if ($fin) {
            return ["opcode" => $message_opcode, "payload" => $message_payload];
        }
        // else: FIN=0, keep reading continuation frames until FIN=1
    }
}

// ==========================================================
// MAIN ENTRY POINT
// ==========================================================

/**
 * Pure-PHP NWC request. Mirrors the Node.js nwcRequest() in nwc.js.
 *
 *   $nwc_uri  nostr+walletconnect://<wallet_pubkey>?relay=<wss-url>&secret=<hex>
 *   $method   "make_invoice" | "lookup_invoice" | "get_info" | "list_transactions"
 *   $params   associative array of method-specific params
 *
 * Returns the wallet's result array, or throws on error/timeout.
 */
function nwc_request_native($nwc_uri, $method, array $params) {
    if (!preg_match('#^nostr\+walletconnect://([0-9a-fA-F]{64})\?(.+)$#', $nwc_uri, $m)) {
        throw new Exception("Invalid NWC URI");
    }
    $wallet_pubkey = strtolower($m[1]);
    parse_str($m[2], $qs);
    $relay = $qs["relay"]  ?? null;
    $secret = $qs["secret"] ?? null;
    if (!$relay || !$secret) throw new Exception("Missing relay or secret in NWC URI");
    if (!preg_match('/^[0-9a-fA-F]{64}$/', $secret)) throw new Exception("Bad NWC secret");

    $event = nwc_build_event($method, $params, strtolower($secret), $wallet_pubkey);
    $my_pubkey = $event["pubkey"];

    $sock = nwc_ws_connect($relay, 10);
    try {
        $sub_id = bin2hex(random_bytes(8));
        $req_sub = json_encode(["REQ", $sub_id, [
            "kinds" => [23195],
            "since" => time() - 10,
            "#p" => [$my_pubkey]
        ]], JSON_UNESCAPED_SLASHES);
        nwc_ws_send($sock, $req_sub);
        nwc_ws_send($sock, json_encode(["EVENT", $event], JSON_UNESCAPED_SLASHES));

        $deadline = microtime(true) + 30;
        while (microtime(true) < $deadline) {
            $frame = nwc_ws_recv($sock, $deadline);
            if ($frame === null) break;
            if ($frame["opcode"] !== 0x1) continue; // not text
            $msg = json_decode($frame["payload"], true);
            if (!is_array($msg) || empty($msg[0])) continue;

            // Relay confirmation of our published event
            if ($msg[0] === "OK" && ($msg[1] ?? "") === $event["id"]) {
                if (!($msg[2] ?? false)) {
                    throw new Exception("Relay rejected event: " . ($msg[3] ?? ""));
                }
                continue; // accepted, keep waiting for the wallet's response
            }
            // Wallet response
            if ($msg[0] === "EVENT" && isset($msg[2]) && ($msg[2]["kind"] ?? 0) === 23195) {
                $plain = nwc_nip04_decrypt($msg[2]["content"], strtolower($secret), $wallet_pubkey);
                $result = json_decode($plain, true);
                if (!is_array($result)) throw new Exception("NWC: invalid response JSON");
                if (isset($result["error"])) {
                    $err = is_array($result["error"])
                        ? ($result["error"]["message"] ?? "unknown")
                        : $result["error"];
                    throw new Exception("NWC error: " . $err);
                }
                return $result["result"] ?? [];
            }
            // CLOSED, NOTICE, EOSE, etc — ignore
        }
        throw new Exception("NWC timeout — no response from wallet");
    } finally {
        nwc_ws_send_close($sock);
        @fclose($sock);
    }
}

// ==========================================================
// SELF-CHECK (validates schnorr against BIP-340 test vector)
// ==========================================================

/**
 * Runtime check. Returns true on success or an error string.
 * Validates bcmath, openssl, and BIP-340 schnorr math against a known vector.
 */
function nwc_native_check() {
    if (!function_exists("bcadd")) return "bcmath extension required";
    if (!extension_loaded("openssl")) return "OpenSSL extension required";
    if (!function_exists("random_bytes")) return "random_bytes() unavailable";
    // BIP-340 test vector 0
    $priv = "0000000000000000000000000000000000000000000000000000000000000003";
    $msg = str_repeat("\x00", 32);
    $aux = str_repeat("\x00", 32);
    $expected = "E907831F80848D1069A5371B402410364BDF1C5F8307B0084C55F1CE2DCA821525F66A4A85EA8B71E482A74F382D2CE5EBEEE8FDB2172F477DF4900D310536C0";
    try {
        $sig = nwc_schnorr_sign($msg, $priv, $aux);
    } catch (Exception $e) {
        return "schnorr sign threw: " . $e->getMessage();
    }
    if (strtolower($sig) !== strtolower($expected)) {
        return "BIP-340 test vector failed: got $sig";
    }
    // Pubkey check
    $pub = secp256k1_xonly_pubkey($priv);
    if (strtolower($pub) !== "f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9") {
        return "x-only pubkey derivation failed";
    }
    return true;
}