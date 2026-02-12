<?php
	header("Content-Type: application/json");
	header("Access-Control-Allow-Headers: Cache-Control, Pragma");
	header("Access-Control-Allow-Origin: *");
	
	include_once "../../filter.php";
	include "../../api.php";
	
	const CACHE_TIME = "2m";
	const CACHE_DIR = "cache/" . CACHE_TIME . "/";
	
	// Main function to handle incoming requests and route to appropriate handlers
	function main() {
		$post_data = $_POST;
		if (empty($post_data)) {
			send_response(["error" => "No data provided"]);
			return;
		}
		$function = $post_data["function"] ?? "";
		switch ($function) {
			case "post":
				handle_post($post_data);
				break;
			case "fetch":
				handle_fetch($post_data);
				break;
			default:
				send_response(["error" => "Invalid function"]);
		}
	}
	
	// Handles the creation and caching of short URLs with error validation
	function handle_post($data) {
		$short_url = safe_filename($data["shorturl"] ?? "");
		$long_url = $data["longurl"] ?? "";
		if (empty($short_url) || empty($long_url)) {
			send_response(["error" => "Missing shorturl or longurl"]);
			return;
		}
	
		$cache_file = CACHE_DIR . $short_url;
		if (file_exists($cache_file)) {
			send_response([
				"status" => "file exists",
				"shorturl" => $short_url
			]);
			return;
		}
	
		$result = api(null, $long_url, null, 6220800, CACHE_TIME, null, $short_url);
		if (!$result) {
			send_response(["error" => "Failed to create short URL"]);
			return;
		}
	
		$apiResult = $result["br_result"] ?? [];
		if (!empty($apiResult["error"])) {
			send_response(["error" => $apiResult["error"]["message"] ?? "Unknown error"]);
			return;
		}
	
		if (!empty($result["br_cache"])) {
			send_response([
				"status" => "file cached",
				"shorturl" => $short_url
			]);
		} else {
			send_response(["error" => "Unexpected error occurred"]);
		}
	}
	
	// Handles the retrieval and decoding of long URLs from short IDs with validation
	function handle_fetch($data) {
		$short_id = safe_filename($data["shortid"] ?? "");
		if (empty($short_id)) {
			send_response(["error" => "Missing shortid"]);
			return;
		}
	
		$cache_file = CACHE_DIR . $short_id;
		if (!file_exists($cache_file)) {
			send_response([
				"status" => "file not found",
				"longurl" => null
			]);
			return;
		}
	
		$content = file_get_contents($cache_file);
		if ($content === false) {
			send_response(["error" => "Failed to read cache file"]);
			return;
		}
	
		$decoded = json_decode(base64_decode($content), true);
		if ($decoded === null) {
			send_response(["error" => "Invalid cache data"]);
			return;
		}
	
		send_response([
			"status" => "file exists",
			"sharedurl" => $decoded["sharedurl"] ?? null
		]);
	}
	
	// Sends a JSON-encoded response with error handling and consistent format
	function send_response($data) {
		try {
			echo json_encode([
				"ping" => [
					"br_cache" => [
						"version" => VERSION,
					],
					"br_result" => $data
				]
			], JSON_PRETTY_PRINT);
		} catch (JsonException $e) {
			echo json_encode([
				"ping" => [
					"br_cache" => [
						"version" => VERSION,
					],
					"br_result" => ["error" => "Response encoding failed"]
				]
			]);
		}
	}
	main();