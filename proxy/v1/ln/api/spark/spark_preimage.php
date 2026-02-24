<?php
/**
 * Spark Preimage Share Ceremony - Pure PHP (bcmath)
 * 
 * Handles: Shamir Secret Sharing, ECIES encryption, protobuf encoding,
 * BIP-340 tagged hashing, gRPC-web transport.
 * 
 * Requirements: PHP 8.0+, bcmath, OpenSSL 3.x with secp256k1
 */

// === secp256k1 constants (hex, converted to decimal on first use) ===
define("SECP256K1_P_HEX",  "fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
define("SECP256K1_N_HEX",  "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
define("SECP256K1_GX_HEX", "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798");
define("SECP256K1_GY_HEX", "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8");

// Lazy-init decimal versions
function _sp() {static $v; return $v ?? ($v = _hex2dec(SECP256K1_P_HEX));}
function _sn() {static $v; return $v ?? ($v = _hex2dec(SECP256K1_N_HEX));}
function _sgx() {static $v; return $v ?? ($v = _hex2dec(SECP256K1_GX_HEX));}
function _sgy() {static $v; return $v ?? ($v = _hex2dec(SECP256K1_GY_HEX));}

// === Spark operator configuration (mainnet) ===
define("SPARK_OPERATORS", [
	[
		"id" => 0,
		"identifier" => "0000000000000000000000000000000000000000000000000000000000000001",
		"address" => "https://0.spark.lightspark.com",
		"pubkey" => "03dfbdff4b6332c220f8fa2ba8ed496c698ceada563fa01b67d9983bfc5c95e763"
	],
	[
		"id" => 1,
		"identifier" => "0000000000000000000000000000000000000000000000000000000000000002",
		"address" => "https://spark-operator.breez.technology",
		"pubkey" => "03e625e9768651c9be268e287245cc33f96a68ce9141b0b4769205db027ee8ed77"
	],
	[
		"id" => 2,
		"identifier" => "0000000000000000000000000000000000000000000000000000000000000003",
		"address" => "https://2.spark.flashnet.xyz",
		"pubkey" => "022eda13465a59205413086130a65dc0ed1b8f8e51937043161f8be0c369b1a410"
	]
]);
define("SPARK_THRESHOLD", 2);
define("SPARK_COORDINATOR", "https://0.spark.lightspark.com");
define("SPARK_GRPC_PATH", "/spark.SparkService/store_preimage_share_v2");
define("SPARK_GRPC_TOKEN_CACHE_DIR", "cache/1w");

// Pre-computed decompressed operator pubkeys (saves ~1s of bcmath per ceremony)
function spark_operator_points() {
	static $pts = null;
	if ($pts !== null) return $pts;
	$pts = [
		"03dfbdff4b6332c220f8fa2ba8ed496c698ceada563fa01b67d9983bfc5c95e763" => [
			"dfbdff4b6332c220f8fa2ba8ed496c698ceada563fa01b67d9983bfc5c95e763",
			"d76be7e46b169774ad794d72cbf12030ddf28a0dd0d9f06265656e2eb77ecc0b"
		],
		"03e625e9768651c9be268e287245cc33f96a68ce9141b0b4769205db027ee8ed77" => [
			"e625e9768651c9be268e287245cc33f96a68ce9141b0b4769205db027ee8ed77",
			"9ea9a4a10b2cef719b04a65577bf2dd4454e39ffa6f300590e11e5e37e576b53"
		],
		"022eda13465a59205413086130a65dc0ed1b8f8e51937043161f8be0c369b1a410" => [
			"2eda13465a59205413086130a65dc0ed1b8f8e51937043161f8be0c369b1a410",
			"0bfd9923e71b2f8e7b7e4f6bbd5396e9c986b0d08052e82fba0ac12fdea1239a"
		]
	];
	return $pts;
}

// ==========================================================
// HEX <-> DECIMAL (for bcmath)
// ==========================================================

function _hex2dec($hex) {
	$dec = "0";
	for ($i = 0; $i < strlen($hex); $i++) {
		$dec = bcadd(bcmul($dec, "16"), (string)hexdec($hex[$i]));
	}
	return $dec;
}

function _dec2hex($dec, $pad = 64) {
	if (bccomp($dec, "0") == 0) return str_pad("0", $pad, "0", STR_PAD_LEFT);
	$hex = "";
	$tmp = $dec;
	while (bccomp($tmp, "0") > 0) {
		$hex = dechex((int)bcmod($tmp, "16")) . $hex;
		$tmp = bcdiv($tmp, "16", 0);
	}
	return str_pad($hex, $pad, "0", STR_PAD_LEFT);
}

function _bcmod_pos($a, $m) {
	$r = bcmod($a, $m);
	if (bccomp($r, "0") < 0) $r = bcadd($r, $m);
	return $r;
}

function _bcinvert($a, $m) {
	$a = _bcmod_pos($a, $m);
	$old_r = $a; $r = $m;
	$old_s = "1"; $s = "0";
	while (bccomp($r, "0") != 0) {
		$q = bcdiv($old_r, $r, 0);
		$tmp = $r; $r = bcsub($old_r, bcmul($q, $r)); $old_r = $tmp;
		$tmp = $s; $s = bcsub($old_s, bcmul($q, $s)); $old_s = $tmp;
	}
	return _bcmod_pos($old_s, $m);
}

// ==========================================================
// EC POINT ARITHMETIC (secp256k1 / bcmath)
// ==========================================================

function spark_ec_decompress($compressed_hex) {
	$p = _sp();
	$prefix = substr($compressed_hex, 0, 2);
	$x = _hex2dec(substr($compressed_hex, 2));
	$y_sq = _bcmod_pos(bcadd(bcpowmod($x, "3", $p), "7"), $p);
	$exp = bcdiv(bcadd($p, "1"), "4", 0);
	$y = bcpowmod($y_sq, $exp, $p);
	$y_is_odd = bcmod($y, "2") !== "0";
	if (($prefix === "02" && $y_is_odd) || ($prefix === "03" && !$y_is_odd)) {
		$y = bcsub($p, $y);
	}
	return [_dec2hex($x), _dec2hex($y)];
}

function spark_ec_add($px_hex, $py_hex, $qx_hex, $qy_hex) {
	$p = _sp();
	$px = _hex2dec($px_hex); $py = _hex2dec($py_hex);
	$qx = _hex2dec($qx_hex); $qy = _hex2dec($qy_hex);
	if (bccomp($px, $qx) == 0 && bccomp($py, $qy) == 0) {
		return spark_ec_double($px_hex, $py_hex);
	}
	$dx = _bcmod_pos(bcsub($qx, $px), $p);
	$dy = _bcmod_pos(bcsub($qy, $py), $p);
	$s = _bcmod_pos(bcmul($dy, _bcinvert($dx, $p)), $p);
	$rx = _bcmod_pos(bcsub(bcsub(bcpowmod($s, "2", $p), $px), $qx), $p);
	$ry = _bcmod_pos(bcsub(bcmul($s, bcsub($px, $rx)), $py), $p);
	return [_dec2hex($rx), _dec2hex($ry)];
}

function spark_ec_double($px_hex, $py_hex) {
	$p = _sp();
	$px = _hex2dec($px_hex); $py = _hex2dec($py_hex);
	$num = _bcmod_pos(bcmul("3", bcpowmod($px, "2", $p)), $p);
	$den = _bcmod_pos(bcmul("2", $py), $p);
	$s = _bcmod_pos(bcmul($num, _bcinvert($den, $p)), $p);
	$rx = _bcmod_pos(bcsub(bcpowmod($s, "2", $p), bcmul("2", $px)), $p);
	$ry = _bcmod_pos(bcsub(bcmul($s, bcsub($px, $rx)), $py), $p);
	return [_dec2hex($rx), _dec2hex($ry)];
}

function spark_ec_mul($scalar_hex, $px_hex, $py_hex) {
	$k = _hex2dec($scalar_hex);
	$rx = null; $ry = null;
	$bits = "";
	$tmp = $k;
	while (bccomp($tmp, "0") > 0) {
		$bits = bcmod($tmp, "2") . $bits;
		$tmp = bcdiv($tmp, "2", 0);
	}
	for ($i = 0; $i < strlen($bits); $i++) {
		if ($rx !== null) list($rx, $ry) = spark_ec_double($rx, $ry);
		if ($bits[$i] === "1") {
			if ($rx === null) { $rx = $px_hex; $ry = $py_hex; }
			else list($rx, $ry) = spark_ec_add($rx, $ry, $px_hex, $py_hex);
		}
	}
	return [$rx, $ry];
}

function spark_ec_pubkey($privkey_hex) {
	list($x, $y) = spark_ec_mul($privkey_hex, SECP256K1_GX_HEX, SECP256K1_GY_HEX);
	return "04" . $x . $y;
}

function spark_ec_pubkey_compressed($privkey_hex) {
	list($x, $y) = spark_ec_mul($privkey_hex, SECP256K1_GX_HEX, SECP256K1_GY_HEX);
	$y_is_odd = bcmod(_hex2dec($y), "2") !== "0";
	return ($y_is_odd ? "03" : "02") . $x;
}

// ==========================================================
// ECIES ENCRYPTION (ecies/rs compatible)
// ==========================================================

function spark_ecies_encrypt_bcmath($plaintext_bytes, $recipient_pubkey_hex) {
	// Generate ephemeral key in valid range [1, n-1]
	$n = _sn();
	$eph_dec = _bcmod_pos(_hex2dec(bin2hex(random_bytes(32))), bcsub($n, "1"));
	$eph_dec = bcadd($eph_dec, "1");
	$eph_priv_hex = _dec2hex($eph_dec);
	$eph_pub_hex = spark_ec_pubkey($eph_priv_hex);
	// ECDH: shared secret = ephemeral * recipient
	$cached = spark_operator_points();
	if (isset($cached[$recipient_pubkey_hex])) {
		list($rpx, $rpy) = $cached[$recipient_pubkey_hex];
	} else {
		list($rpx, $rpy) = spark_ec_decompress($recipient_pubkey_hex);
	}
	list($sx, $sy) = spark_ec_mul($eph_priv_hex, $rpx, $rpy);
	// Derive AES key via HKDF
	$ikm = hex2bin($eph_pub_hex) . hex2bin("04" . $sx . $sy);
	$aes_key = hash_hkdf("sha256", $ikm, 32, "", "");
	// AES-256-GCM encrypt
	$nonce = random_bytes(16);
	$tag = "";
	$ct = openssl_encrypt($plaintext_bytes, "aes-256-gcm", $aes_key, OPENSSL_RAW_DATA, $nonce, $tag, "", 16);
	if ($ct === false) return false;
	return hex2bin($eph_pub_hex) . $nonce . $tag . $ct;
}

// ==========================================================
// SHAMIR SECRET SHARING
// ==========================================================

function spark_shamir_split($secret_hex, $threshold = SPARK_THRESHOLD, $num_shares = 3) {
	$n = _sn();
	$secret_dec = _hex2dec($secret_hex);
	$coefficients = [$secret_dec];
	$proofs = [spark_ec_pubkey_compressed($secret_hex)];
	for ($i = 1; $i < $threshold; $i++) {
		$c_dec = _bcmod_pos(_hex2dec(bin2hex(random_bytes(32))), $n);
		if (bccomp($c_dec, "0") == 0) $c_dec = "1";
		$coefficients[] = $c_dec;
		$proofs[] = spark_ec_pubkey_compressed(_dec2hex($c_dec));
	}
	$shares = [];
	for ($i = 0; $i < $num_shares; $i++) {
		$x = (string)($i + 1);
		$result = "0";
		for ($j = 0; $j < $threshold; $j++) {
			$x_pow = bcpowmod($x, (string)$j, $n);
			$result = _bcmod_pos(bcadd($result, _bcmod_pos(bcmul($coefficients[$j], $x_pow), $n)), $n);
		}
		$shares[$i] = ["share" => _dec2hex($result), "proofs" => $proofs];
	}
	return $shares;
}

// ==========================================================
// PROTOBUF ENCODING / DECODING
// ==========================================================

function spark_proto_varint($n) {
	$b = "";
	while ($n > 0x7f) { $b .= chr(($n & 0x7f) | 0x80); $n >>= 7; }
	$b .= chr($n & 0x7f);
	return $b;
}

function spark_proto_field_bytes($fn, $data) {
	return spark_proto_varint(($fn << 3) | 2) . spark_proto_varint(strlen($data)) . $data;
}

function spark_proto_field_uint32($fn, $v) {
	return spark_proto_varint(($fn << 3) | 0) . spark_proto_varint($v);
}

function spark_proto_field_string($fn, $s) { return spark_proto_field_bytes($fn, $s); }

function spark_proto_secret_share($share_hex, $proofs_hex_array) {
	$p = spark_proto_field_bytes(1, hex2bin($share_hex));
	foreach ($proofs_hex_array as $proof) $p .= spark_proto_field_bytes(2, hex2bin($proof));
	return $p;
}

function spark_proto_store_preimage_v2($payment_hash, $encrypted_shares, $threshold, $invoice, $user_pubkey, $user_sig) {
	$p = spark_proto_field_bytes(1, $payment_hash);
	foreach ($encrypted_shares as $key => $value) {
		$entry = spark_proto_field_string(1, $key) . spark_proto_field_bytes(2, $value);
		$p .= spark_proto_field_bytes(2, $entry);
	}
	$p .= spark_proto_field_uint32(3, $threshold);
	$p .= spark_proto_field_string(4, $invoice);
	$p .= spark_proto_field_bytes(5, $user_pubkey);
	$p .= spark_proto_field_bytes(6, $user_sig);
	return $p;
}

function spark_proto_decode($data) {
	$fields = [];
	$pos = 0;
	$len = strlen($data);
	while ($pos < $len) {
		list($tag, $pos) = spark_proto_read_varint($data, $pos);
		$field_num = $tag >> 3;
		$wire_type = $tag & 7;
		switch ($wire_type) {
			case 0: // varint
				list($val, $pos) = spark_proto_read_varint($data, $pos);
				$fields[$field_num] = [0, $val];
				break;
			case 2: // length-delimited
				list($vlen, $pos) = spark_proto_read_varint($data, $pos);
				$fields[$field_num] = [2, substr($data, $pos, $vlen)];
				$pos += $vlen;
				break;
			default:
				return $fields;
		}
	}
	return $fields;
}

function spark_proto_read_varint($data, $pos) {
	$result = 0;
	$shift = 0;
	while ($pos < strlen($data)) {
		$byte = ord($data[$pos++]);
		$result |= ($byte & 0x7f) << $shift;
		if (($byte & 0x80) === 0) break;
		$shift += 7;
	}
	return [$result, $pos];
}

// ==========================================================
// BIP-340 TAGGED HASHER
// ==========================================================

function spark_hasher_tag($tags) {
	$s = "";
	foreach ($tags as $t) $s .= pack("J", strlen($t)) . $t;
	return hash("sha256", $s, true);
}

function spark_hasher_add(&$state, $data) { $state .= pack("J", strlen($data)) . $data; }
function spark_hasher_add_uint32(&$state, $v) { spark_hasher_add($state, pack("J", $v)); }

function spark_hasher_add_map(&$state, $map) {
	spark_hasher_add($state, pack("J", count($map)));
	ksort($map, SORT_STRING);
	foreach ($map as $k => $v) {
		spark_hasher_add($state, $k);
		spark_hasher_add($state, $v);
	}
}

/**
 * Build the signing payload for store_preimage_share.
 * Returns raw tagged data (pre-SHA256) — openssl_sign does its own SHA256.
 */
function spark_signing_payload($payment_hash, $encrypted_shares_map, $threshold, $invoice) {
	$th = spark_hasher_tag(["spark", "store_preimage_share", "signing payload"]);
	$state = $th . $th;
	spark_hasher_add($state, $payment_hash);
	spark_hasher_add_map($state, $encrypted_shares_map);
	spark_hasher_add_uint32($state, $threshold);
	spark_hasher_add($state, $invoice);
	return $state;
}

// ==========================================================
// gRPC-WEB TRANSPORT
// ==========================================================

/**
 * Unified gRPC-web call.
 * Returns ["body" => string] on success, or error string on failure.
 */
function spark_grpc_call($address, $path, $proto_bytes, $auth_token = null) {
	$frame = chr(0x00) . pack("N", strlen($proto_bytes)) . $proto_bytes;
	$headers = [
		"Content-Type: application/grpc-web+proto",
		"X-Grpc-Web: 1",
		"X-Requested-With: XMLHttpRequest"
	];
	if ($auth_token) {
		$headers[] = "Authorization: Bearer " . $auth_token;
	}
	$ch = curl_init(rtrim($address, "/") . $path);
	curl_setopt_array($ch, [
		CURLOPT_POST => true,
		CURLOPT_POSTFIELDS => $frame,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_HTTPHEADER => $headers,
		CURLOPT_TIMEOUT => 15,
		CURLOPT_HEADER => true
	]);
	$full_response = curl_exec($ch);
	$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
	$error = curl_error($ch);
	curl_close($ch);
	if ($error) return "cURL error: " . $error;
	$resp_headers = substr($full_response, 0, $header_size);
	$response = substr($full_response, $header_size);
	// Check for gRPC error in HTTP headers
	if (preg_match('/grpc-status:\s*(\d+)/i', $resp_headers, $m) && $m[1] !== "0") {
		$msg = "";
		if (preg_match('/grpc-message:\s*(.+)/i', $resp_headers, $m2)) $msg = urldecode(trim($m2[1]));
		return "gRPC error " . $m[1] . ": " . $msg;
	}
	if ($http_code !== 200) return "HTTP " . $http_code;
	// Parse gRPC-web response: data frames (0x00) + trailer frame (0x80)
	$body = "";
	$pos = 0;
	$len = strlen($response);
	$grpc_status = null;
	$grpc_message = null;
	while ($pos < $len) {
		if ($pos + 5 > $len) break;
		$flag = ord($response[$pos]);
		$frame_len = unpack("N", substr($response, $pos + 1, 4))[1];
		$pos += 5;
		if ($pos + $frame_len > $len) break;
		$frame_data = substr($response, $pos, $frame_len);
		$pos += $frame_len;

		if ($flag & 0x80) {
			foreach (explode("\r\n", $frame_data) as $line) {
				$line = trim($line);
				if (str_starts_with($line, "grpc-status:")) $grpc_status = trim(substr($line, 12));
				elseif (str_starts_with($line, "grpc-message:")) $grpc_message = urldecode(trim(substr($line, 13)));
			}
		} else {
			$body .= $frame_data;
		}
	}
	if ($grpc_status !== null && $grpc_status !== "0") {
		return "gRPC error " . $grpc_status . ": " . ($grpc_message ?? "unknown");
	}
	return ["body" => $body];
}

// ==========================================================
// gRPC AUTH (SparkAuthnService)
// ==========================================================

/**
 * Authenticate with a gRPC operator.
 * Returns session token string or error string prefixed with "error:"
 */
function spark_grpc_authenticate($address, $identity_key_hex) {
	$nid = substr(hash("sha256", $identity_key_hex), 0, 10);
	$cache_file = SPARK_GRPC_TOKEN_CACHE_DIR . "/" . $nid . "_spark_grpc_token";
	// Check cache
	if (file_exists($cache_file)) {
		$cached = json_decode(file_get_contents($cache_file), true);
		if ($cached && isset($cached[$address])) {
			$entry = $cached[$address];
			if (isset($entry["token"]) && isset($entry["expires"]) && $entry["expires"] > time() + 60) {
				return $entry["token"];
			}
		}
	}

	$pkey = spark_build_key($identity_key_hex);
	if (!$pkey) return "error:invalid identity key";
	$pubkey_hex = spark_get_pubkey($pkey);
	$pubkey_bytes = hex2bin($pubkey_hex);
	// Step 1: GetChallenge
	$req = spark_proto_field_bytes(1, $pubkey_bytes);
	$result = spark_grpc_call($address, "/spark_authn.SparkAuthnService/get_challenge", $req);
	if (!is_array($result)) return "error:get_challenge failed: " . $result;
	if (empty($result["body"])) return "error:empty challenge response";
	// Parse GetChallengeResponse → ProtectedChallenge → Challenge
	$resp_fields = spark_proto_decode($result["body"]);
	if (!isset($resp_fields[1])) return "error:no protectedChallenge in response";
	$protected_challenge_bytes = $resp_fields[1][1];
	$pc_fields = spark_proto_decode($protected_challenge_bytes);
	if (!isset($pc_fields[2])) return "error:no challenge in protectedChallenge";
	$challenge_proto_bytes = $pc_fields[2][1];
	// Step 2: Sign challenge
	openssl_sign($challenge_proto_bytes, $signature, $pkey, OPENSSL_ALGO_SHA256);
	$signature = spark_normalize_sig($signature);
	// Step 3: VerifyChallenge
	$verify_req = spark_proto_field_bytes(1, $protected_challenge_bytes)
		. spark_proto_field_bytes(2, $signature)
		. spark_proto_field_bytes(3, $pubkey_bytes);
	$verify_result = spark_grpc_call($address, "/spark_authn.SparkAuthnService/verify_challenge", $verify_req);
	if (!is_array($verify_result)) return "error:verify_challenge failed: " . $verify_result;
	// Parse VerifyChallengeResponse
	$vr_fields = spark_proto_decode($verify_result["body"]);
	if (!isset($vr_fields[1])) return "error:no sessionToken in verify response";
	$session_token = $vr_fields[1][1];
	$expires = isset($vr_fields[2]) ? $vr_fields[2][1] : time() + 600;
	// Cache token
	$cache_dir = SPARK_GRPC_TOKEN_CACHE_DIR;
	if (!is_dir($cache_dir)) mkdir($cache_dir, 0755, true);
	$existing = file_exists($cache_file) ? (json_decode(file_get_contents($cache_file), true) ?: []) : [];
	$existing[$address] = ["token" => $session_token, "expires" => $expires];
	file_put_contents($cache_file, json_encode($existing));
	return $session_token;
}

// ==========================================================
// MAIN ORCHESTRATOR
// ==========================================================

function spark_store_preimage_shares($identity_key_hex, $preimage_hex, $invoice, $payment_hash_hex) {
	$operators = SPARK_OPERATORS;
	$threshold = SPARK_THRESHOLD;
	// Split preimage into shares and encrypt for each operator
	$shares = spark_shamir_split($preimage_hex, $threshold, count($operators));
	$encrypted_shares = [];
	foreach ($operators as $op) {
		$share = $shares[$op["id"]];
		$share_proto = spark_proto_secret_share($share["share"], $share["proofs"]);
		$encrypted = spark_ecies_encrypt($share_proto, $op["pubkey"]);
		if ($encrypted === false) return "ECIES encryption failed for operator " . $op["id"];
		$encrypted_shares[$op["identifier"]] = $encrypted;
	}
	// Sign the payload
	$payment_hash = hex2bin($payment_hash_hex);
	$signing_data = spark_signing_payload($payment_hash, $encrypted_shares, $threshold, $invoice);
	$pkey = spark_build_key($identity_key_hex);
	if (!$pkey) return "Failed to build identity key";
	openssl_sign($signing_data, $signature, $pkey, OPENSSL_ALGO_SHA256);
	$signature = spark_normalize_sig($signature);
	$user_pubkey = hex2bin(spark_get_pubkey($pkey));
	// Build protobuf and send to coordinator
	$proto = spark_proto_store_preimage_v2(
		$payment_hash, $encrypted_shares, $threshold, $invoice, $user_pubkey, $signature
	);
	$token = spark_grpc_authenticate(SPARK_COORDINATOR, $identity_key_hex);
	if (str_starts_with($token, "error:")) return "gRPC auth failed: " . substr($token, 6);
	$result = spark_grpc_call(SPARK_COORDINATOR, SPARK_GRPC_PATH, $proto, $token);
	return is_array($result) ? true : $result;
}

/**
 * Flush the HTTP response to the client and continue executing.
 * Call this AFTER echo/print of the response body, BEFORE the ceremony.
 */
function spark_flush_response() {
	if (function_exists("fastcgi_finish_request")) {
		fastcgi_finish_request();
		return;
	}
	ignore_user_abort(true);
	if (ob_get_level() > 0) ob_end_flush();
	flush();
}

function spark_preimage_check() {
	if (!function_exists("bcadd")) return "bcmath extension required";
	if (!extension_loaded("openssl")) return "OpenSSL extension required";
	if (!function_exists("hash_hkdf")) return "hash_hkdf() not available (PHP 7.1.2+)";
	$tag = "";
	$test = @openssl_encrypt("test", "aes-256-gcm", str_repeat("\x00", 32), OPENSSL_RAW_DATA, str_repeat("\x00", 16), $tag, "", 16);
	if ($test === false) return "AES-256-GCM with 16-byte nonce not supported";
	try {
		$pub = spark_ec_pubkey_compressed("0000000000000000000000000000000000000000000000000000000000000001");
		if ($pub !== "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798") {
			return "EC point multiplication mismatch";
		}
	} catch (Exception $e) {
		return "EC math failed: " . $e->getMessage();
	}
	return true;
}