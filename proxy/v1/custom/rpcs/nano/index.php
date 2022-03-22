<?php
function nano($node, $endpoint, $payload, $headers, $cache_time, $cache_folder) {
    $default_node = "https://www.bitrequest.app:8020";
    $node = $node ? $node : $default_node;
    $payloadarray = json_decode($payload, true);
    $account = reset($payloadarray["accounts"]);
    $sheaders = ["Content-Type: application/json"];
    $apibuild = [];
    $pending_data = api($node, $payload, $sheaders, $cache_time, $cache_folder, null, null);
    if ($pending_data && empty($pending_data["error"])) {
        $blocks = $pending_data["blocks"][$account];
        $limit_blocks = array_slice($blocks, 0, 50);
        $pendingobject = [];
        foreach ($limit_blocks as $key => $value) {
            $block_info_payload = json_encode(
                [
                    "action" => "block_info",
                    "json_block" => "true",
                    "hash" => $key
                ],
                true
            );
            $block_info_data = api($node, $block_info_payload, $sheaders, 86400, $cache_folder, null, null);
            if ($block_info_data && empty($block_info_data["error"])) {
                $block_info_data["hash"] = $key;
                $pendingobject["pending"][] = $block_info_data;
            }
        }
        $apibuild[] = $pendingobject;
    }
    $history_payload = json_encode(
        [
            "action" => "account_history",
            "account" => $account,
            "count" => 10
        ],
        true
    );
    $history_data = api($node, $history_payload, $sheaders, $cache_time, $cache_folder, null, null);
    if ($history_data && empty($history_data["error"])) {
        $apibuild[] = $history_data;
    }
    return [
        "data" => $apibuild
    ];
}

?>