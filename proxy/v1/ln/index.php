<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
//header("Access-Control-Allow-Origin: *"); // uncomment for nginx

$pid = isset($_GET["id"]) ? substr($_GET["id"], 1, 10) : false;
$path = "api/cache/tx/" . $pid;
if (file_exists($path)) {
	include "../../config.php";
	include "../api.php";
	$type = isset($_GET["id"]) ? substr($_GET["id"], 0, 1) : false;
	$type_txt = ($type == 1) ? "local" : (($type == 2) ? "outgoing" : "incoming");
	$sats = intval($_GET["a"]);
	$title = isset($_GET["m"]) ? $_GET["m"] : "bitrequest " . $pid;
	$tget = isset($_GET["m"]) ? "" : "&m=" . rawurlencode($title);
	$logo = $lightning_setup["logo"];
	$callback = $_SERVER["REQUEST_SCHEME"] . "://" . $_SERVER["HTTP_HOST"] . explode("/ln/", $_SERVER["REQUEST_URI"])[0] . "/ln/api/" . "?" . $_SERVER["QUERY_STRING"] . $tget;
	$meta_arr = [["text/plain", $title]];
	if (strlen($logo) > 200) {
		$meta_arr[] = ["image/png;base64", $logo];
	}
	$maxsend = $sats == 0 ? 100000000000 : $sats;
	$lnurl_obj = [
		"tag" => "payRequest",
		"callback" => $callback,
		"minSendable" => $sats,
		"maxSendable" => $maxsend,
		"metadata" => json_encode($meta_arr),
	];
	echo json_encode($lnurl_obj, JSON_UNESCAPED_SLASHES);
	$status = json_encode(
		[
			"pid" => $pid,
			"status" => "confirm",
			"rqtype" => $type_txt
		]
	);
	file_put_contents($path, $status);
	$postheaders = array(
		"post: " . $status
	);
	$postheaders["tls_wildcard"] = true;
	curl_get("https://bitrequest.app:8030/", $status, $postheaders);
} else {
	echo json_encode(
		[
			"status" => "ERROR",
			"reason" => "Tracking file " . $pid . " not found"
		]
	);
	return;
}