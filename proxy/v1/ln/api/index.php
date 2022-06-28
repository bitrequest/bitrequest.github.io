<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
//header("Access-Control-Allow-Origin: *"); // uncomment for nginx

$pdat = $_POST;
if (isset($pdat["ping"])) {
	echo r_objl2("pong");
	return;
}
$gdat = $_GET;
include "../../../config.php";
include "../../api.php";

$server = $_SERVER;
$srequest = $server["REQUEST_URI"];
$spath = strpos($srequest, "v1/ln") ? explode("v1/ln", $srequest)[0] : $srequest;
$serverhost = $server["HTTP_HOST"];
$serverpath = $serverhost . $spath;
$setup = $lightning_setup;
$apikey = $setup["apikey"];
$key_hash = substr(hash("sha256", $apikey), 0, 10);
$p_apikey = isset($pdat["x-api"]) ? $pdat["x-api"] : false;
$post_apikey = (strlen($p_apikey) == 10) ? $p_apikey : substr(hash("sha256", $p_apikey), 0, 10);
$key_error = "API key required for " . $serverpath;
$wrong_key = "Wrong API key for lightning Proxy";
$imp = isset($gdat["i"]) ? $gdat["i"] : (isset($pdat["imp"]) ? $pdat["imp"] : false);
$g_rqamount = isset($gdat["a"]) ? $gdat["a"] : false;
$g_samount = isset($gdat["amount"]) ? $gdat["amount"] : false;
$g_title = isset($gdat["m"]) ? $gdat["m"] : false;
$get_id = isset($gdat["id"]) ? $gdat["id"] : false;
$g_type = $get_id ? substr($get_id, 0, 1) : false;
$type_txt = ($g_type == 1) ? "local" : (($g_type == 2) ? "outgoing" : (($g_type == 3) ? "checkout" : "unknown"));
$g_pid = $get_id ? substr($get_id, 1, 10) : false;
$g_nid = $get_id && strlen($get_id) > 15 ? substr($get_id, 11) : false;
$p_pid = isset($pdat["id"]) ? $pdat["id"] : false;
$p_nid = isset($pdat["nid"]) ? $pdat["nid"] : false;
$p_expiry = isset($pdat["expiry"]) ? $pdat["expiry"] : 60;
$lnget = $imp && $g_pid && $g_rqamount > -1 && $g_samount ? true : false;
$callback_url = isset($setup["callback_url"]) ? $setup["callback_url"] : "";
$local_tracking = ($setup["local_tracking"] == "yes") ? "yes" : "no";
$remote_tracking = ($setup["remote_tracking"] == "yes") ? "yes" : "no";

if ($apikey && !$lnget) {
	if ($post_apikey == "false") {
		echo json_encode(r_err($key_error, 1), true);
		return;
	}
	if ($post_apikey != $key_hash) {
		echo json_encode(r_err($wrong_key, 2), true);
		return;
	}
}

if (isset($pdat["add"])) {
	$result = api(null, json_encode($pdat), null, 0, "tx", null, null);
	echo json_encode(
		["ping" => $result]
	);
	return;
}

if (isset($pdat["pingpw"])) {
	echo r_objl2("pong");
	return;
}

$fn = isset($pdat["fn"]) ? $pdat["fn"] : false;

if ($fn == "put") {
	$pl = isset($pdat["pl"]) ? $pdat["pl"] : false;
	$rqtype = isset($pdat["rqtype"]) ? $pdat["rqtype"] : false;
	$status = isset($pl["status"]) ? $pl["status"] : false;
	$cred_resp = false;
	$stat_resp = false;
	$stat_content = [
		"pid" => $status,
		"status" => "waiting",
		"rqtype" => $rqtype,
		"proxy" => $serverhost,
		"version" => $version
	];
	if ($pl) {
		$creds = isset($pl["cred"]) ? $pl["cred"] : false;
		if ($creds) {
			$contents = json_decode(base64_decode($creds), true);
			if ($contents) {
				$filename = isset($contents["file"]) ? $contents["file"] : false;
				if ($filename) {
					api(null, $creds, null, 604800, "1w", null, $filename);
					$cred_resp = true;
				}
			}
		}
		if ($status) {
			$statfile = "cache/tx/" . $status;
			if (file_exists($statfile) && $rqtype == "local") {
				$get_content = file_get_contents($statfile);
				if ($get_content) {
					$stat_obj = json_decode($get_content, true);
					$stat_obj["status"] = "waiting";
					$stat_content = $stat_obj;
					file_put_contents($statfile, json_encode($stat_content));
				}
				$stat_resp = true;
			} else {
				$put_result = api(null, json_encode($stat_content), null, 0, "tx", null, $status);
				$p_result = $put_result["br_result"];
				if ($p_result) {
					$put_error = isset($p_result["error"]) ? $p_result["error"] : false;
					if ($put_error) {
						$p_err_message = isset($put_error["message"]) ? $put_error["message"] : false;
						if ($p_err_message) {
							$stat_resp = $p_err_message;
						}
					} else {
						$stat_content = [
							"pid" => $status,
							"status" => "waiting",
							"rqtype" => $rqtype,
							"proxy" => $serverhost,
							"version" => $version
						];
						$stat_resp = true;
					}
				}
			}
		}
	}
	$response = json_encode(
		[
			"creds" => $cred_resp,
			"stat" => $stat_resp,
			"content" => $stat_content,
			"version" => $version
		]
	);
	echo $response;
	return;
}

if ($fn == "ln-request-status") {
	if ($p_pid) {
		$filename = "cache/tx/" . $p_pid;
		if (file_exists($filename)) {
			$get_content = file_get_contents($filename);
			if ($get_content) {
				echo $get_content;
				return;
			}
		}
		echo json_encode(["status" => "not found"]);
		return;
	}
}

if ($imp == "lnd" || $imp == "eclair" || $imp == "c-lightning" || $imp == "lnbits") {
	if ($lnget || $fn == "ln-create-invoice" || $fn == "ln-list-invoices" || $fn == "ln-invoice-status" || $fn == "ln-invoice-decode" || $fn == "ln-delete-invoice") {
		$host = false;
		$key = false;
		$type = "lnurl";
		$isproxy = false;
		$nid = $g_nid ? $g_nid : ($p_nid ? $p_nid : false);
		if ($nid) {
			$filename = "cache/1w/" . $nid;
			if (file_exists($filename)) {
				$get_content = file_get_contents($filename);
				if ($get_content) {
					$b64_dec = base64_decode($get_content);
					if ($b64_dec) {
						$contents = json_decode($b64_dec, true);
						if ($contents) {
							if ($contents["host"]) {
                                // use cached host
								$host = $contents["host"];
								$type = "cache";
								$isproxy = false;
							}
							if ($contents["key"]) {
                                // use cached key
								$key = $contents["key"];
							}
						}
					}
				}
			}
		}
		$cred = $setup[$imp];
		if ($cred["host"]) {
            // prioritize server host
			$host = $cred["host"];
			$type = "lnurl";
			$isproxy = true;
		}
		if ($cred["key"]) {
            // prioritize server key
			$key = $cred["key"];
		}
		$posthost = isset($pdat["host"]) ? $pdat["host"] : false;
		$postkey = isset($pdat["key"]) ? $pdat["key"] : false;
		if ($posthost) {
            // prioritize post host
			$host = $posthost;
			$type = "post";
			$isproxy = false;
		}
		if ($postkey) {
            // prioritize post key
			$key = $postkey;
			$isproxy = false;
		}
		if (!$host || !$key) {
			$cname = "";
			if (!$key) {
				$cname = "keys";
			}
			if (!$host) {
				$cname = "hostname";
			}
			$_mdef = "Please enter your " . $cname;
			if ($type == "lnurl") {
				$e_msg = $_mdef . " in " . $serverpath . "config.php";
			} elseif ($type == "post") {
				$e_msg = $_mdef;
			} elseif ($type == "cache") {
				$e_msg = "missing " . $cname;
			}
			if ($lnget) {
				echo json_encode(
					[
						"status" => "ERROR",
						"reason" => $e_msg
					]
				);
			} else {
				echo json_encode(r_err($e_msg, null), true);
			}
			return;
		}
		$pingtest = isset($pdat["pingtest"]) ? $pdat["pingtest"] : false;
		if ($fn == "ln-create-invoice") {
			$amount = $pdat["amount"];
			$lnurl_id = $type == "lnurl" ? " (LNURL)" : "";
			$memo = $pdat["memo"] ? $pdat["memo"] . $lnurl_id : null;
			$invoice = create_invoice($imp, $p_pid, $host, $key, $amount, $memo, $type, $pingtest, "test", null, $p_expiry);
			echo json_encode($invoice);
			return;
		}
		if ($fn == "ln-list-invoices") {
			$invoices = list_invoices($imp, $host, $key, $type, $pingtest);
			echo json_encode($invoices);
			return;
		}
		if ($fn == "ln-invoice-status" || $fn == "ln-invoice-decode") {
			$hash = isset($pdat["hash"]) ? $pdat["hash"] : false;
			$itype = isset($pdat["type"]) ? $pdat["type"] : false;
			$ttype = ($itype == "incoming") ? "outgoing" : $itype;
			if ($fn == "ln-invoice-decode") {
				$lndecode = invoice_lookup($imp, $p_pid, $host, $key, $hash, $ttype, $p_expiry, false);
				echo json_encode($lndecode);
				return;
			}
			if ($fn == "ln-invoice-status") {
				$lndecode = invoice_lookup($imp, $p_pid, $host, $key, $hash, $ttype, $p_expiry, true);
				echo json_encode($lndecode);
				if ($callback_url && strlen($callback_url) > 10) {
					$callback = (isset($pdat["callback"]) && $pdat["callback"] == "yes") ? "yes" : "no";
					if ($callback == "yes") {
						if ($ttype) {
							$inv_status = $lndecode["status"];
							if ($inv_status == "paid" || $inv_status == "canceled") {
								if ($remote_tracking == "yes" && $local_tracking == "yes") {
									curl_get($callback_url, $lndecode, null); // track all
									return;
								}
								if ($remote_tracking == "yes" && $local_tracking != "yes") {
									if ($ttype == "outgoing" || $ttype == "checkout") {
										curl_get($callback_url, $lndecode, null); // track outgoing and checkout
										return;
									}
								}
								if ($remote_tracking != "yes" && $local_tracking == "yes") {
									if ($ttype == "local" || $ttype == "checkout") {
										curl_get($callback_url, $lndecode, null); // track local and checkout
										return;
									}
								}
								if ($remote_tracking != "yes" && $local_tracking != "yes") {
									if ($ttype == "checkout") {
										curl_get($callback_url, $lndecode, null); // only track checkout
									}
								}
							}
						}
					}
				}
			}
			return;
		}
		if ($lnget) {
			if ($g_samount < $g_rqamount) {
				echo json_encode(
					[
						"status" => "ERROR",
						"reason" => "Amount must be at least " . $g_rqamount / 1000 . " satoshis, got " . $g_samount / 1000 . "."
					]
				);
				return;
			}
			$path = "cache/tx/" . $g_pid;
			$successmessage = isset($setup["successAction"]) ? $setup["successAction"] : false;
			$routes = isset($cred["routes"]) ? $cred["routes"] : [];
			if (file_exists($path)) {
				$g_content = file_get_contents($path); // cache invoice
				if ($g_content) {
					$g_dec = json_decode($g_content, true);
					$timestamp = isset($g_dec["timestamp"]) ? $g_dec["timestamp"] : false;
					if ($timestamp) {
						$now = time() * 1000;
						if (($now - $timestamp) < 90000) {
							$saved_inv = isset($g_dec["bolt11"]) ? $g_dec["bolt11"] : false;
							if ($saved_inv) {
								echo json_encode(
									[
										"pr" => $saved_inv,
										"routes" => $routes
									]
								);
								return;
							}
						}
					}
				}
				$memo = $g_title ? $g_title : null;
				$logo = $setup["logo"];
				$meta_arr = [["text/plain", $memo]];
				if (strlen($logo) > 200) {
					$meta_arr[] = ["image/png;base64", $logo];
				}
				$desc_hash = d_hash($meta_arr);
				$result = create_invoice($imp, $g_pid, $host, $key, $g_samount, $memo, $type, null, "lnurl", $desc_hash, $p_expiry);
				if ($result) {
					$inv_error = isset($result["error"]) ? $result["error"] : false;
					if ($inv_error) {
						$inv_error_message = isset($inv_error["message"]) ? $inv_error["message"] : $result["message"];
						echo json_encode(
							[
								"status" => "ERROR",
								"reason" => $inv_error_message
							]
						);
						return;
					}
					$pr = $result["bolt11"];
					$hash = $result["hash"];
					$s_content = [];
					if ($pr && $hash) {
						$inv_arr = [
							"pr" => $pr,
							"routes" => $routes
						];
						if ($successmessage && strlen($successmessage) > 2) {
							$succsessobject = [
								"tag" => "message",
								"message" => $successmessage
							];
							$inv_arr["successAction"] = $succsessobject;
						}
						echo json_encode($inv_arr);
						$s_content = [
							"pid" => $g_pid,
							"status" => "pending",
							"bolt11" => $pr,
							"hash" => $hash,
							"amount" => (int)$g_samount,
							"amount_paid" => null,
							"timestamp" => time() * 1000,
							"txtime" => null,
							"conf" => 0,
							"rqtype" => $type_txt,
							"proxy" => $serverhost
						];
					} else {
						echo json_encode(
							[
								"status" => "ERROR",
								"reason" => "failed to create invoice"
							]
						);
						$s_content = [
							"pid" => $g_pid,
							"status" => "error",
							"amount" => (int)$g_samount,
							"amount_paid" => null,
							"rqtype" => $type_txt,
							"proxy" => $serverhost
						];
					}
					$tx_content = json_encode($s_content);
					file_put_contents($path, $tx_content);
					$postheaders = array(
						"post: " . $tx_content
					);
					$postheaders["tls_wildcard"] = true;
					curl_get("https://bitrequest.app:8030/", $tx_content, $postheaders);
					if ($callback_url && strlen($callback_url) > 10) {
						if ($type_txt) {
							if ($remote_tracking == "yes" && $local_tracking == "yes") {
								echo curl_get($callback_url, $s_content, null); // track all
								return;
							}
							if ($remote_tracking == "yes" && $local_tracking != "yes") {
								if ($type_txt == "outgoing" || $type_txt == "checkout") {
									curl_get($callback_url, $s_content, null); // track outgoing and checkout
									return;
								}
							}
							if ($remote_tracking != "yes" && $local_tracking == "yes") {
								if ($type_txt == "local" || $type_txt == "checkout") {
									curl_get($callback_url, $s_content, null); // track local and checkout
									return;
								}
							}
							if ($remote_tracking != "yes" && $local_tracking != "yes") {
								if ($type_txt == "checkout") {
									curl_get($callback_url, $s_content, null); // only track checkout
								}
							}
						}
					}
				} else {
					echo json_encode(
						[
							"status" => "ERROR",
							"reason" => "failed to create invoice"
						]
					);
					return;
				}
			} else {
				echo json_encode(
					[
						"status" => "ERROR",
						"reason" => "Tracking file not found"
					]
				);
				return;
			}
		}
		return;
	}
	echo json_encode(
		[
			"status" => "ERROR",
			"reason" => "forbidden"
		]
	);
	return;
} else {
	$imp_error = "implementation '" . $imp . "' not supported";
	if ($lnget) {
		echo json_encode(
			[
				"status" => "ERROR",
				"reason" => $imp_error
			]
		);
	} else {
		echo json_encode(r_err($imp_error, null), true);
	}
	return;
}

function create_invoice($imp, $pid, $host, $key, $amount, $memo, $type, $pingtest, $src, $desc_hash, $expiry) {
	if ($imp == "lnd") {
		$rpcurl = $host . "/v1/invoices";
		$pl = [];
		if ($memo) {
			$pl["memo"] = $memo;
			if ($src == "lnurl" && $desc_hash) {
				$pl["description_hash"] = lnd_b64_enc($desc_hash);
			}
		}
		if ($amount) {
			$pl["value"] = $amount / 1000;
		}
		$pl["expiry"] = $expiry;
		$payload = json_encode($pl);
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Length: " . strlen($payload);
		$headers[] = "Grpc-Metadata-macaroon: " . $key;
		$inv = curl_get($rpcurl, $payload, $headers);
		if ($inv) {
			$result = invoice_uniform($imp, $inv, $type);
			return $result;
		}
	}
	if ($imp == "c-lightning") {
		$rpcurl = $host . "/v1/invoice/genInvoice";
		$pl = [];
		$pl["label"] = $pid;
		if ($memo) {
			$pl["description"] = $memo;
			if ($src == "lnurl" && $desc_hash) {
				$pl["description_hash"] = $desc_hash;
			}
		}
		if ($amount) {
			$pl["amount"] = $amount;
		}
		$pl["expiry"] = $expiry;
		$payload = json_encode($pl);
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Length: " . strlen($payload);
		$headers[] = "Content-Type: application/json";
		$headers[] = "macaroon: " . $key;
		$headers[] = "encodingtype: hex";
		$inv = curl_get($rpcurl, $payload, $headers);
		if ($inv) {
			$result = invoice_uniform($imp, $inv, $type);
			return $result;
		}
	}
	if ($imp == "eclair") {
		$rpcurl = $host . "/createinvoice";
		$pl = [];
		if ($memo) {
			$pl["description"] = $memo;
			if ($src == "lnurl" && $desc_hash) {
				$pl["description_hash"] = $desc_hash;
			}
		}
		if ($amount) {
			$pl["amountMsat"] = $amount;
		}
		$pl["expireIn"] = 60;
		$payload = http_build_query($pl);
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Length: " . strlen($payload);
		$headers[] = "Content-Type: application/x-www-form-urlencoded";
		$headers[] = "Authorization: Basic " . base64_encode(":" . $key);
		$inv = curl_get($rpcurl, $payload, $headers);
		if ($inv) {
			$result = invoice_uniform($imp, $inv, $type);
			return $result;
		}
	}
	if ($imp == "lnbits") {
		$rpcurl = $host . "/api/v1/payments";
		$pl = [];
		$pl["out"] = false;
		if ($memo) {
			$pl["memo"] = $memo;
			$pl["description"] = $memo;
			if ($src == "lnurl" && $desc_hash) {
				$pl["description_hash"] = $desc_hash;
			}
		}
		$pl["expiry"] = $expiry;
		if ($amount) {
			$pl["amount"] = $amount / 1000;
		}
		$pl["lnurl_callback"] = null;
		$payload = json_encode($pl);
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Length: " . strlen($payload);
		$headers[] = "Content-Type: application/json";
		$headers[] = "X-Api-Key: " . $key;
		$inv = curl_get($rpcurl, $payload, $headers);
		if ($inv) {
			$result = invoice_uniform($imp, $inv, $type);
			return $result;
		}
	}
	return r_err("unable to create invoice", null);
}

function invoice_uniform($imp, $inv, $type) {
	$proxy_host = $_SERVER["HTTP_HOST"];
	if ($inv) {
		$dat = json_decode($inv, true);
		if ($imp == "lnd") {
			return [
				"bolt11" => $dat["payment_request"],
				"hash" => lnd_b64_dec($dat["r_hash"]),
				"invoice" => $dat,
				"proxy" => $proxy_host,
				"type" => $type
			];
		}
		if ($imp == "c-lightning") {
			return [
				"bolt11" => $dat["bolt11"],
				"hash" => $dat["payment_hash"],
				"invoice" => $dat,
				"proxy" => $proxy_host,
				"type" => $type
			];
		}
		if ($imp == "eclair") {
			return [
				"bolt11" => $dat["serialized"],
				"hash" => $dat["paymentHash"],
				"invoice" => $dat,
				"proxy" => $proxy_host,
				"type" => $type
			];
		}
		if ($imp == "lnbits") {
			return [
				"bolt11" => $dat["payment_request"],
				"hash" => $dat["payment_hash"],
				"invoice" => $dat,
				"proxy" => $proxy_host,
				"type" => $type
			];
		}
	}
	return false;
}

function list_invoices($imp, $host, $key, $type, $pingtest) {
	if ($imp == "lnd") {
		$rpcurl = $host . "/v1/invoices";
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Grpc-Metadata-macaroon: " . $key;
		$invoices = curl_get($rpcurl, null, $headers);
		$result = json_decode($invoices, true);
		$connected = $result["invoices"][0]["r_hash"] ? true : false;
		$m_dat = [
			"connected" => $connected,
			"type" => $type
		];
		if ($pingtest && $connected) {
			return [
				"mdat" => $m_dat
			];
		}
		$result["mdat"] = $m_dat;
		return $result;
	}
	if ($imp == "c-lightning") {
		$rpcurl = $host . "/v1/invoice/listInvoices";
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Type: application/json";
		$headers[] = "macaroon: " . $key;
		$headers[] = "encodingtype: hex";
		$invoices = curl_get($rpcurl, null, $headers);
		$result = json_decode($invoices, true);
		$connected = $result["invoices"][0]["payment_hash"] ? true : false;
		$m_dat = [
			"connected" => $connected,
			"type" => $type
		];
		if ($pingtest && $connected) {
			return [
				"mdat" => $m_dat
			];
		}
		$result["mdat"] = $m_dat;
		return $result;
	}
	if ($imp == "eclair") {
		$rpcurl = $host . "/listinvoices";
		$pl = [];
		$pl["x"] = "x";
		$payload = http_build_query($pl);
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Length: " . strlen($payload);
		$headers[] = "Content-Type: application/x-www-form-urlencoded";
		$headers[] = "Authorization: Basic " . base64_encode(":" . $key);
		$invoices = curl_get($rpcurl, $payload, $headers);
		$result = json_decode($invoices, true);
		$connected = $result[0]["paymentHash"] ? true : false;
		$result_object = [];
		$m_dat = [
			"connected" => $connected,
			"type" => $type
		];
		if ($pingtest && $connected) {
			return [
				"mdat" => $m_dat
			];
		}
		$result_object["invoices"] = $result;
		$result_object["mdat"] = $m_dat;
		return $result_object;
	}
	if ($imp == "lnbits") {
		$rpcurl = $host . "/api/v1/wallet";
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Type: application/json";
		$headers[] = "X-Api-Key: " . $key;
		$invoices = curl_get($rpcurl, null, $headers);
		$result = json_decode($invoices, true);
		$connected = $result["balance"] ? true : false;
		$m_dat = [
			"connected" => $connected,
			"type" => $type
		];
		if ($pingtest && $connected) {
			return [
				"mdat" => $m_dat
			];
		}
		$result["mdat"] = $m_dat;
		return $result;
	}
}

function invoice_lookup($imp, $pid, $host, $key, $hash, $type, $expiry, $status) {
	if ($imp == "lnd") {
		$lnd_hash = (substr($hash, -1)) == "=" ? lnd_b64_dec($hash) : $hash;
		$rpcurl = $host . "/v1/invoice/" . $lnd_hash;
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Type: application/json";
		$headers[] = "Grpc-Metadata-macaroon: " . $key;
		$inv = curl_get($rpcurl, null, $headers);
		$result = json_decode($inv, true);
		$inv_result = isset($result["r_hash"]) ? $result : false;
		if ($inv_result) {
			if ($status) {
				return invoice_status($imp, $inv_result, $pid, $type, $expiry);
			}
			return $inv_result;
		}
	}
	if ($imp == "c-lightning") {
		$rpcurl = $host . "/v1/invoice/listInvoices/?label=" . $pid;
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Type: application/json";
		$headers[] = "macaroon: " . $key;
		$headers[] = "encodingtype: hex";
		$inv = curl_get($rpcurl, null, $headers);
		$result = json_decode($inv, true);
		$inv_result = isset($result["invoices"][0]) ? $result["invoices"][0] : false;
		if ($inv_result) {
			if ($status) {
				return invoice_status($imp, $inv_result, $pid, $type, $expiry);
			}
			return $inv_result;
		}
	}
	if ($imp == "eclair") {
		$rpcurl = $host . "/getreceivedinfo";
		$pl = [];
		$pl["paymentHash"] = $hash;
		$payload = http_build_query($pl);
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Length: " . strlen($payload);
		$headers[] = "Content-Type: application/x-www-form-urlencoded";
		$headers[] = "Authorization: Basic " . base64_encode(":" . $key);
		$inv = curl_get($rpcurl, $payload, $headers);
		$result = json_decode($inv, true);
		$inv_result = isset($result["paymentRequest"]) ? $result : false;
		if ($inv_result) {
			if ($status) {
				return invoice_status($imp, $inv_result, $pid, $type, $expiry);
			}
			return $inv_result;
		}
	}
	if ($imp == "lnbits") {
		$rpcurl = $host . "/api/v1/payments/" . $hash;
		$headers = [
			"tls_wildcard" => true
		];
		$headers[] = "Content-Type: application/json";
		$headers[] = "X-Api-Key: " . $key;
		$inv = curl_get($rpcurl, null, $headers);
		$result = json_decode($inv, true);
		$inv_result = isset($result["details"]) ? $result : false;
		if ($inv_result) {
			if ($status) {
				return invoice_status($imp, $inv_result, $pid, $type, $expiry);
			}
			return $inv_result;
		}
	}
	return r_err("unable to fetch invoice", null);
}

function invoice_status($imp, $dat, $pid, $type, $expiry) {
	$proxy_host = $_SERVER["HTTP_HOST"];
	if ($dat) {
		if ($imp == "lnd") {
			$status = $dat["state"];
			$br_state = "unknown";
			if ($status == "SETTLED") {
				$br_state = "paid";
			}
			if ($status == "OPEN") {
				$br_state = "pending";
			}
			if ($status == "CANCELED") {
				$br_state = "canceled";
			}
			if ($status == "ACCEPTED") {
				$br_state = "accepted";
			}
			$conf = ($br_state == "paid") ? 1 : 0;
			$inv_txcreated = isset($dat["creation_date"]) ? (int)$dat["creation_date"] * 1000 : 0;
			$inv_txtime = isset($dat["settle_date"]) ? (int)$dat["settle_date"] * 1000 : 0;
			$inv_amount = isset($dat["value_msat"]) ? (int)$dat["value_msat"] : 0;
			$inv_amount_paid = isset($dat["amt_paid"]) ? (int)$dat["amt_paid"] : 0;
			$inv_hash = isset($dat["r_hash"]) ? lnd_b64_dec($dat["r_hash"]) : null;
			return [
				"pid" => $pid,
				"status" => $br_state,
				"bolt11" => $dat["payment_request"],
				"hash" => $inv_hash,
				"amount" => $inv_amount,
				"amount_paid" => ($br_state == "paid") ? $inv_amount_paid : null,
				"timestamp" => $inv_txcreated,
				"txtime" => $inv_txtime,
				"conf" => $conf,
				"rqtype" => $type,
				"proxy" => $proxy_host
			];
		}
		if ($imp == "c-lightning") {
			$status = $dat["status"];
			$br_state = "unknown";
			if ($status == "paid") {
				$br_state = "paid";
			}
			if ($status == "unpaid") {
				$br_state = "pending";
			}
			if ($status == "expired") {
				$br_state = "canceled";
			}
			$conf = ($br_state == "paid") ? 1 : 0;
			$inv_txcreated = isset($dat["expires_at"]) ? ((int)$dat["expires_at"] - $expiry) * 1000 : 0;
			$inv_txtime = isset($dat["paid_at"]) ? (int)$dat["paid_at"] * 1000 : 0;
			$inv_amount = isset($dat["msatoshi"]) ? (int)$dat["msatoshi"] : 0;
			$inv_amount_paid = isset($dat["msatoshi_received"]) ? (int)$dat["msatoshi_received"] : 0;
			$inv_hash = isset($dat["payment_hash"]) ? $dat["payment_hash"] : null;
			return [
				"pid" => $pid,
				"status" => $br_state,
				"bolt11" => $dat["bolt11"],
				"hash" => $inv_hash,
				"amount" => $inv_amount,
				"amount_paid" => ($br_state == "paid") ? $inv_amount_paid : null,
				"timestamp" => $inv_txcreated,
				"txtime" => $inv_txtime,
				"conf" => $conf,
				"rqtype" => $type,
				"proxy" => $proxy_host
			];
		}
		if ($imp == "eclair") {
			$status = $dat["status"];
			$type = $status["type"];
			$br_state = "unknown";
			if ($type == "received") {
				$br_state = "paid";
			}
			if ($type == "pending") {
				$br_state = "pending";
			}
			if ($type == "expired") {
				$br_state = "canceled";
			}
			$request = $dat["paymentRequest"];
			$conf = ($br_state == "paid") ? 1 : 0;
			$inv_txcreated = isset($request["timestamp"]) ? (int)$request["timestamp"] * 1000 : 0;
			$inv_txtime = isset($status["receivedAt"]) ? (int)$status["receivedAt"] : 0;
			$inv_amount = isset($request["amount"]) ? (int)$request["amount"] : 0;
			$inv_amount_paid = isset($status["amount"]) ? (int)$status["amount"] : 0;
			$inv_hash = isset($request["paymentHash"]) ? $request["paymentHash"] : null;
			return [
				"pid" => $pid,
				"status" => $br_state,
				"bolt11" => $request["serialized"],
				"hash" => $inv_hash,
				"amount" => $inv_amount,
				"amount_paid" => ($br_state == "paid") ? $inv_amount_paid : null,
				"timestamp" => $inv_txcreated,
				"txtime" => $inv_txtime,
				"conf" => $conf,
				"rqtype" => $type,
				"proxy" => $proxy_host
			];
		}
		if ($imp == "lnbits") {
			$details = $dat["details"];
			$inv_txtime = isset($details["time"]) ? (int)$details["time"] : 0;
			$expired = ((time() - $inv_txtime) > $expiry) ? true : false;
			$br_state = "unknown";
			if ($details["pending"] == true) {
				$br_state = "pending";
			}
			if ($expired == true) {
				$br_state = "canceled";
			}
			if ($dat["paid"] == true) {
				$br_state = "paid";
			}
			$conf = ($br_state == "paid") ? 1 : 0;
			$inv_amount = isset($details["amount"]) ? (int)$details["amount"] : 0;
			return [
				"pid" => $pid,
				"status" => $br_state,
				"bolt11" => $details["bolt11"],
				"hash" => $details["payment_hash"],
				"amount" => $inv_amount,
				"amount_paid" => ($br_state == "paid") ? $inv_amount : null,
				"timestamp" => $inv_txtime * 1000,
				"txtime" => $inv_txtime * 1000,
				"conf" => $conf,
				"rqtype" => $type,
				"proxy" => $proxy_host
			];
		}
	}
	return false;
}

function d_hash($arr) {
	return hash("sha256", utf8_encode(json_encode($arr)));
}

function lnd_b64_enc($val) {
	return base64_encode(hex2bin($val));
}

function lnd_b64_dec($val) {
	return bin2hex(base64_decode($val));
}

function r_obj($dat) {
	return json_encode(
		[
			"ping" => $dat
		]
	);
}

function r_objl2($dat) {
	return json_encode(
		[
			"ping" => [
				"br_cache" => [
					"version" => "0.001",
				],
				"br_result" => $dat
			],
		]
	);
}

function r_err($dat, $code) {
	return [
		"error" => [
			"message" => $dat,
			"code" => $code
		],
	];
}