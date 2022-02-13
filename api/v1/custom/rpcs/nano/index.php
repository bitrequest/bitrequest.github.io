<?php
function nano($node, $endpoint, $payload, $headers, $cache_time, $cache_folder) {
    $fail_node = "https://www.bitrequesti.app:8020";
    $default_node = "https://www.bitrequest.app:8020";
    $node = ($node) ? $node : $default_node;
    $payloadarray = json_decode($payload, true);
    $account = reset($payloadarray["accounts"]);
    $sheaders = array(
        "Content-Type: application/json"
    );
    $apibuild = array();
    $pending_data = api($node, $payload, $sheaders, $cache_time, $cache_folder, false, null);
    if ($pending_data && empty($pending_data["error"])) {
        $blocks = $pending_data["blocks"][$account];
        $pendingobject = array();
        foreach ($blocks as $key => $value) {
            $block_info_payload = json_encode(array(
                "action" => "block_info",
                "json_block" => "true",
                "hash" => $key,
            ) , true);
            $block_info_data = api($node, $block_info_payload, $sheaders, 86400, $cache_folder, false, null);
            if ($block_info_data && empty($block_info_data["error"])) {
                $block_info_data["hash"] = $key;
                $pendingobject["pending"][] = $block_info_data;
            }
        };
		$apibuild[] = $pendingobject;
    }
    $history_payload = json_encode(array(
        "action" => "account_history",
        "account" => $account,
        "count" => 10,
    ) , true);
    $history_data = api($node, $history_payload, $sheaders, $cache_time, $cache_folder, false, null);
    if ($history_data && empty($history_data["error"])) {
        $apibuild[] = $history_data;
    }
    return array(
        "data" => $apibuild
    );
}

?>