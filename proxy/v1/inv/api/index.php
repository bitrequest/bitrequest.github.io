<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Cache-Control, Pragma");
//header("Access-Control-Allow-Origin: *"); // uncomment for nginx

include "../../api.php";
$pdat = $_POST;
if ($pdat) {
	$ct = "1h";
	$function = $pdat["function"];
	if ($function == "post") {
		$shorturl = $pdat["shorturl"];
		if ($shorturl) {
			$reqfile = "cache/" . $ct . "/" . $shorturl;
			if (file_exists($reqfile)) {
				$stat_cont = [
					"status" => "file exists",
					"shorturl" => $shorturl
				];
				echo r_objl2($stat_cont);
				return;
			}
			$rqdat = $pdat["longurl"];
			if ($rqdat) {
				$put_result = api(null, $rqdat, null, 604800, $ct, null, $shorturl);
				if ($put_result) {
					$status_cont = [
						"status" => "file cached",
						"shorturl" => $shorturl
					];
					echo r_objl2($status_cont);
					return;
				}
			}
		}
	}
	if ($function == "fetch") {
		$shortid = $pdat["shortid"];
		if ($shortid) {
			$reqfile = "cache/" . $ct . "/" . $shortid;
			if (file_exists($reqfile)) {
				$get_content = file_get_contents($reqfile);
				if ($get_content) {
					$contents = json_decode(base64_decode($get_content), true);
					$sharedurl = $contents["sharedurl"];
					$sharedtitle = $contents["sharedtitle"];
					$status_cont = [
						"status" => "file exists",
						"sharedurl" => $sharedurl,
						"sharedtitle" => $sharedtitle
					];
					echo r_objl2($status_cont);
					return;
				}
			}
			$status_cont = [
				"status" => "file not found",
				"longurl" => NULL
			];
			echo r_objl2($status_cont);
		}
	}
}

function r_objl2($dat) {
	return json_encode(
		[
			"ping" => [
				"br_cache" => [
					"version" => $GLOBALS["version"],
				],
				"br_result" => $dat
			],
		]
	);
}

?>