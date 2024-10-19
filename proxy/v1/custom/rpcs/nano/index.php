<?php
include "../../../api.php";
$getdata = $_GET;
$default_node = "https://www.bitrequest.app:8020";
$payload = isset($getdata["pl"]) ? json_decode(base64_decode($getdata["pl"]), true) : false;
$transformed_pending_array = array();
$merged_history = array();

if ($payload) {
    $pl_array = json_decode($payload, true);
    $node = isset($pl_array["node"]) ? $pl_array["node"] : $default_node;
    $account = isset($pl_array["account"]) ? $pl_array["account"] : false;
    $headers = ["Content-Type: application/json"];
    $history_payload = json_encode(
        [
            "action" => "account_history",
            "account" => $account,
            "count" => 25,
            "raw" => true
        ],
        true
    );
    $history_result = api($node, $history_payload, $headers, null, null, null, null);
    $history_data = $history_result["br_result"];
    $historic_hashes = array();
    if ($history_data && empty($history_data["error"])) {
        $history_blocks = isset($history_data["history"]) ? $history_data["history"] : false;
        if ($history_blocks) {
            foreach ($history_blocks as $key => $value) {
                $receivable = isset($value["receivable"]);
                if ($value["subtype"] == "receive" || $receivable) {
                    $historic_hashes[] = $value["link"];
                }
            }
        }
    }
    if (!empty($historic_hashes)) {
        $historyblock_info_payload = json_encode(
            [
                "action" => "blocks_info",
                "json_block" => true,
                "pending" => true,
                "source" => true,
                "hashes" => $historic_hashes
            ],
            true
        );
        $history_block_result = api($node, $historyblock_info_payload, $headers, null, null, null, null);
        $history_info_data = $history_block_result["br_result"];
        if ($history_info_data && empty($history_info_data["error"]) && is_array($history_info_data)) {
            $transformed_history_array = transform_object($history_info_data);
            $merged_history = merge_timestamps($history_blocks, $transformed_history_array);
        } else {
            $merged_history = $history_blocks;
        }
    }
    $pending_payload = json_encode(
        [
            "action" => "accounts_receivable",
            "accounts" => [$account],
            "include_active" => true,
            "count" => 50,
        ],
        true
    );
    sleep(1); // set 1 second timeout for too many api calls on the nano api proxy
    $receivable_result = api($node, $pending_payload, $headers, null, null, null, null);
    if ($receivable_result) {
        $pending_data = $receivable_result["br_result"];
        if ($pending_data) {
            $pending_blocks = isset($pending_data["blocks"][$account]) ? $pending_data["blocks"][$account] : false;
            if ($pending_blocks) {
                $limit_blocks = array_slice($pending_blocks, 0, 30);
                $pendingblock_info_payload = json_encode(
                    [
                        "action" => "blocks_info",
                        "json_block" => true,
                        "pending" => true,
                        "source" => true,
                        "hashes" => array_values($limit_blocks)
                    ],
                    true
                );
                $pending_result = api($node, $pendingblock_info_payload, $headers, null, null, null, null);
                $pendingblock_info_data = $pending_result["br_result"];
                $transformed_pending_array = transform_object($pendingblock_info_data);
            }
        }
        if (!empty($transformed_pending_array) && !empty($merged_history)) {
            //echo("pending and history");
            $merge_and_sort = sort_array(merge_arrays($transformed_pending_array, $merged_history));
            echo json_encode($merge_and_sort, true);
            return;
        }
        if (!empty($transformed_pending_array)) {
            //echo("pending");
            $sort_pending = sort_array($transformed_pending_array);
            echo json_encode($sort_pending, true);
            return;
        }
        if (!empty($merged_history)) {
            //echo("history");
            $sort_history = sort_array($merged_history);
            echo json_encode($sort_history, true);
            return;
        }
    }
}

// Function to transform the object
function transform_object($obj) {
    $result = [];
    foreach ($obj["blocks"] as $key => $value) {
        $value["hash"] = $key;
        $result[] = $value;
    }
    return $result;
}

function merge_timestamps($history, $history_blocks) {
    // Create a lookup array for historyblocks
    $lookup = array();
    foreach ($history_blocks as $block) {
        $lookup[$block["hash"]] = $block["local_timestamp"];
    }
    // Merge timestamps into history
    foreach ($history as &$item) {
        if (isset($lookup[$item["link"]])) {
            $item["local_timestamp"] = $lookup[$item["link"]];
        }
    }
    return $history;
}

function merge_arrays($array1, $array2) {
    return array_merge($array1, $array2);
}

function sort_array($array) {
    // Define a comparison function for usort
    $compare_function = function($a, $b) {
        return $b["local_timestamp"] - $a["local_timestamp"];
    };
    // Sort the merged array using the comparison function
    usort($array, $compare_function);
    return $array;
}
?>