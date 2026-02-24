<?php
// Spark Lightning Network Integration
// Handles authentication, invoice creation, and status polling
// via Lightspark's GraphQL API + preimage share ceremony

include_once "spark_preimage.php";
include_once "spark_ecies_fast.php";

const SPARK_GRAPHQL_URL = "https://api.lightspark.com/graphql/spark/2025-03-19";
const SPARK_TOKEN_BUFFER = 60; // Re-auth 60 seconds before expiry
const SPARK_TOKEN_CACHE_DIR = "cache/1w";

// === Core Helpers ===

// Build OpenSSL private key from raw 32-byte hex
function spark_build_key($identity_key_hex) {
	$privkey_bin = hex2bin($identity_key_hex);
	if (strlen($privkey_bin) !== 32) return false;

	// Minimal SEC1 DER: SEQUENCE { version 1, OCTET STRING(32) privkey, [0] OID secp256k1 }
	$der = hex2bin("302e0201010420") . $privkey_bin . hex2bin("a00706052b8104000a");
	$pem = "-----BEGIN EC PRIVATE KEY-----\n" .
		   chunk_split(base64_encode($der), 64, "\n") .
		   "-----END EC PRIVATE KEY-----";
	return openssl_pkey_get_private($pem);
}

// Get compressed public key hex from OpenSSL key resource
function spark_get_pubkey($pkey) {
	$details = openssl_pkey_get_details($pkey);
	if (!$details || !isset($details["ec"])) return false;
	$x_hex = str_pad(bin2hex($details["ec"]["x"]), 64, "0", STR_PAD_LEFT);
	$y_last = ord($details["ec"]["y"][strlen($details["ec"]["y"]) - 1]);
	return (($y_last % 2 === 0) ? "02" : "03") . $x_hex;
}

// Normalize DER signature to low-S (required by Bitcoin/secp256k1 libraries)
function spark_normalize_sig($der_sig) {
	$hex = bin2hex($der_sig);
	$pos = 4;
	$pos += 2;
	$r_len = hexdec(substr($hex, $pos, 2));
	$pos += 2;
	$r_hex = substr($hex, $pos, $r_len * 2);
	$pos += $r_len * 2;
	$pos += 2;
	$s_len = hexdec(substr($hex, $pos, 2));
	$pos += 2;
	$s_hex = substr($hex, $pos, $s_len * 2);
	$s_padded = str_pad(ltrim($s_hex, "0"), 64, "0", STR_PAD_LEFT);
	$half_n = "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0";
	if (strcmp($s_padded, $half_n) <= 0) {
		return $der_sig; // Already low-S
	}
	// new_s = N - S
	$n_hex = "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141";
	$borrow = 0;
	$new_s = "";
	for ($i = 63; $i >= 0; $i--) {
		$da = hexdec($n_hex[$i]) - $borrow;
		$db = hexdec($s_padded[$i]);
		if ($da < $db) { $da += 16; $borrow = 1; } else { $borrow = 0; }
		$new_s = dechex($da - $db) . $new_s;
	}
	$new_s = ltrim($new_s, "0");
	if (strlen($new_s) % 2 !== 0) $new_s = "0" . $new_s;
	if (hexdec($new_s[0]) >= 8) $new_s = "00" . $new_s;
	$new_s_len = strlen($new_s) / 2;
	$r_der = "02" . sprintf("%02x", $r_len) . $r_hex;
	$s_der = "02" . sprintf("%02x", $new_s_len) . $new_s;
	$total_len = strlen($r_der . $s_der) / 2;
	return hex2bin("30" . sprintf("%02x", $total_len) . $r_der . $s_der);
}

// Execute a GraphQL query against Spark API
function spark_graphql($query, $variables, $token = null) {
	$operation = null;
	if (preg_match('/(?:mutation|query)\s+(\w+)/i', $query, $m)) {
		$operation = $m[1];
	}
	$payload = json_encode([
		"query" => $query,
		"variables" => $variables,
		"operationName" => $operation
	]);
	$headers = ["Content-Type: application/json"];
	if ($token) {
		$headers[] = "Authorization: Bearer " . $token;
	}
	$ch = curl_init(SPARK_GRAPHQL_URL);
	curl_setopt_array($ch, [
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_POST => true,
		CURLOPT_POSTFIELDS => $payload,
		CURLOPT_HTTPHEADER => $headers,
		CURLOPT_TIMEOUT => 10,
		CURLOPT_CONNECTTIMEOUT => 5
	]);
	$result = curl_exec($ch);
	$error = curl_error($ch);
	$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);
	if ($error) return ["error" => $error];
	if ($http_code >= 400) return ["error" => "HTTP " . $http_code];
	$data = json_decode($result, true);
	if (isset($data["errors"])) {
		$msg = $data["errors"][0]["message"] ?? "GraphQL error";
		return ["error" => $msg];
	}
	return $data["data"] ?? ["error" => "no data"];
}

// === Authentication ===

// Full auth flow: GetChallenge → sign → VerifyChallenge → session token
function spark_authenticate($identity_key_hex) {
	$pkey = spark_build_key($identity_key_hex);
	if (!$pkey) return ["error" => "invalid identity key"];
	$pubkey = spark_get_pubkey($pkey);
	if (!$pubkey) return ["error" => "failed to derive pubkey"];
	// Step 1: GetChallenge
	$challenge_resp = spark_graphql('
		mutation GetChallenge($public_key: PublicKey!) {
			get_challenge(input: { public_key: $public_key }) {
				protected_challenge
			}
		}',
		["public_key" => $pubkey]
	);
	if (isset($challenge_resp["error"])) {
		return ["error" => "GetChallenge: " . $challenge_resp["error"]];
	}
	$protected_challenge = $challenge_resp["get_challenge"]["protected_challenge"] ?? null;
	if (!$protected_challenge) {
		return ["error" => "no challenge in response"];
	}
	// Step 2: Sign SHA256(challenge_bytes) with identity key
	$challenge_bytes = base64_decode(strtr($protected_challenge, '-_', '+/'));
	openssl_sign($challenge_bytes, $signature, $pkey, OPENSSL_ALGO_SHA256);
	$signature = spark_normalize_sig($signature);
	if (!$signature) {
		return ["error" => "signing failed"];
	}
	// Step 3: VerifyChallenge
	$verify_resp = spark_graphql('
		mutation VerifyChallenge(
			$protected_challenge: String!
			$signature: String!
			$identity_public_key: PublicKey!
		) {
			verify_challenge(input: {
				protected_challenge: $protected_challenge
				signature: $signature
				identity_public_key: $identity_public_key
			}) {
				valid_until
				session_token
			}
		}',
		[
			"protected_challenge" => $protected_challenge,
			"signature" => base64_encode($signature),
			"identity_public_key" => $pubkey
		]
	);
	if (isset($verify_resp["error"])) {
		return ["error" => "VerifyChallenge: " . $verify_resp["error"]];
	}
	$output = $verify_resp["verify_challenge"] ?? null;
	if (!$output) {
		return ["error" => "no verify output"];
	}
	return [
		"token" => $output["session_token"],
		"valid_until" => strtotime($output["valid_until"])
	];
}

// Get a valid session token, re-authenticating if expired
function spark_get_token($identity_key_hex) {
	$nid = substr(hash("sha256", $identity_key_hex), 0, 10);
	$cache_file = SPARK_TOKEN_CACHE_DIR . "/" . $nid . "_spark_token";
	// Check cached token
	if (file_exists($cache_file)) {
		$cached = json_decode(file_get_contents($cache_file), true);
		if ($cached && isset($cached["token"]) && isset($cached["valid_until"])) {
			if ($cached["valid_until"] - SPARK_TOKEN_BUFFER > time()) {
				return $cached["token"];
			}
		}
	}
	// Authenticate
	$auth = spark_authenticate($identity_key_hex);
	if (isset($auth["error"])) {
		return false;
	}
	// Cache the token
	if (!is_dir(SPARK_TOKEN_CACHE_DIR)) {
		mkdir(SPARK_TOKEN_CACHE_DIR, 0755, true);
	}
	file_put_contents($cache_file, json_encode([
		"token" => $auth["token"],
		"valid_until" => $auth["valid_until"]
	]));
	return $auth["token"];
}

// === Invoice Operations ===

// Create a Lightning invoice via Spark
function spark_create_invoice($identity_key_hex, $amount_msats, $memo, $desc_hash, $expiry) {
	$token = spark_get_token($identity_key_hex);
	if (!$token) {
		return ["error" => "authentication failed"];
	}
	// Generate preimage and payment hash
	$preimage = random_bytes(32);
	$payment_hash = hash("sha256", $preimage);
	// Amount: convert msats to sats for Spark API
	$amount_sats = intval($amount_msats / 1000);
	$variables = [
		"network" => "MAINNET",
		"amount_sats" => $amount_sats,
		"payment_hash" => $payment_hash,
		"expiry_secs" => intval($expiry) ?: 86400
	];
	if ($memo && !$desc_hash) {
		$variables["memo"] = $memo;
	}
	if ($desc_hash) {
		$variables["description_hash"] = $desc_hash;
	}
	$resp = spark_graphql('
		mutation RequestLightningReceive(
			$network: BitcoinNetwork!
			$amount_sats: Long!
			$payment_hash: Hash32!
			$expiry_secs: Int
			$memo: String
			$description_hash: Hash32
		) {
			request_lightning_receive(input: {
				network: $network
				amount_sats: $amount_sats
				payment_hash: $payment_hash
				expiry_secs: $expiry_secs
				memo: $memo
				description_hash: $description_hash
			}) {
				request {
					id
					status
					invoice {
						encoded_invoice
						payment_hash
						expires_at
						memo
					}
				}
			}
		}',
		$variables,
		$token
	);
	if (isset($resp["error"])) {
		return ["error" => $resp["error"]];
	}
	$request = $resp["request_lightning_receive"]["request"] ?? null;
	if (!$request) {
		return ["error" => "no request in response"];
	}
	$invoice = $request["invoice"];
	return [
		"bolt11" => $invoice["encoded_invoice"],
		"hash" => $invoice["payment_hash"],
		"request_id" => $request["id"],
		"preimage" => bin2hex($preimage)
	];
}

// Look up invoice status by request_id (returns LND-like format)
function spark_invoice_lookup($identity_key_hex, $request_id) {
	$token = spark_get_token($identity_key_hex);
	if (!$token) {
		return ["error" => "authentication failed"];
	}
	$resp = spark_graphql('
		query UserRequest($request_id: ID!) {
			user_request(request_id: $request_id) {
				... on LightningReceiveRequest {
					id
					created_at
					updated_at
					status
					invoice {
						encoded_invoice
						payment_hash
						amount {
							original_value
							original_unit
						}
						expires_at
						memo
					}
					transfer {
						spark_id
						total_amount {
							original_value
							original_unit
						}
					}
					payment_preimage
				}
			}
		}',
		["request_id" => $request_id],
		$token
	);
	if (isset($resp["error"])) {
		return ["error" => $resp["error"]];
	}
	$req = $resp["user_request"] ?? null;
	if (!$req) {
		return ["error" => "request not found"];
	}
	// Convert to LND-like format
	$invoice = $req["invoice"] ?? [];
	$transfer = $req["transfer"] ?? null;
	$spark_status = $req["status"] ?? "";
	// Map Spark status to LND state
	$state = "OPEN";
	$settled = false;
	switch ($spark_status) {
		case "TRANSFER_COMPLETED":
			$state = "SETTLED";
			$settled = true;
			break;
		case "TRANSFER_FAILED":
		case "TRANSFER_CREATION_FAILED":
		case "REFUND_SIGNING_FAILED":
		case "REFUND_SIGNING_COMMITMENTS_QUERYING_FAILED":
		case "PAYMENT_PREIMAGE_RECOVERING_FAILED":
		case "PAYMENT_PREIMAGE_QUERYING_FAILED":
			$state = "CANCELED";
			break;
	}
	// Parse amounts
	$amt_val = $invoice["amount"]["original_value"] ?? 0;
	$amt_unit = $invoice["amount"]["original_unit"] ?? "";
	$value_msat = ($amt_unit === "SATOSHI") ? intval($amt_val) * 1000 : intval($amt_val);
	$value = intval($value_msat / 1000);
	// Parse paid amounts from transfer
	$amt_paid_msat = "0";
	$amt_paid_sat = "0";
	if ($settled && $transfer) {
		$tval = $transfer["total_amount"]["original_value"] ?? 0;
		$tunit = $transfer["total_amount"]["original_unit"] ?? "";
		$paid_msat = ($tunit === "SATOSHI") ? intval($tval) * 1000 : intval($tval);
		$amt_paid_msat = strval($paid_msat);
		$amt_paid_sat = strval(intval($paid_msat / 1000));
	}
	// Parse timestamps
	$created = isset($req["created_at"]) ? strval(strtotime($req["created_at"])) : "0";
	$updated = isset($req["updated_at"]) ? strval(strtotime($req["updated_at"])) : "0";
	$settle_date = $settled ? $updated : "0";
	// Parse expiry
	$expires_at = isset($invoice["expires_at"]) ? strtotime($invoice["expires_at"]) : 0;
	$expiry_secs = ($expires_at && $created !== "0") ? strval($expires_at - intval($created)) : "60";
	// Preimage and hash as base64 (LND style)
	$hash_hex = $invoice["payment_hash"] ?? "";
	$preimage_hex = $req["payment_preimage"] ?? "";
	$r_hash = $hash_hex ? base64_encode(hex2bin($hash_hex)) : "";
	$r_preimage = $preimage_hex ? base64_encode(hex2bin($preimage_hex)) : "";
	return [
		"memo" => $invoice["memo"] ?? "",
		"r_preimage" => $r_preimage,
		"r_hash" => $r_hash,
		"value" => strval($value),
		"value_msat" => strval($value_msat),
		"settled" => $settled,
		"creation_date" => $created,
		"settle_date" => $settle_date,
		"payment_request" => $invoice["encoded_invoice"] ?? "",
		"expiry" => $expiry_secs,
		"state" => $state,
		"amt_paid" => $settled ? $amt_paid_msat : "0",
		"amt_paid_sat" => $settled ? $amt_paid_sat : "0",
		"amt_paid_msat" => $settled ? $amt_paid_msat : "0",
		"spark_status" => $spark_status,
		"spark_request_id" => $req["id"] ?? $request_id,
		"spark_transfer_id" => $transfer["spark_id"] ?? null
	];
}