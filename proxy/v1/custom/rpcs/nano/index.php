<?php
require_once "../../../api.php";

const DEFAULT_NODE = "https://www.bitrequest.app:8020";
const MAX_HISTORY_COUNT = 25;
const MAX_PENDING_COUNT = 25;

// Main function to process Nano transactions
function main() {
    $payload = get_payload();
    if (!$payload) {
        send_jsonresponse(["error" => "Invalid payload"]);
        return;
    }
	$pl_array = json_decode($payload, true);
    $node = $pl_array["node"] ?? DEFAULT_NODE;
    $account = $pl_array["account"] ?? null;

    if (!$account) {
        send_jsonresponse(["error" => "Account not provided"]);
        return;
    }

    $headers = ["Content-Type: application/json"];

    $mergedHistory = get_account_history($node, $account, $headers);
    $transformedPendingArray = get_account_pending($node, $account, $headers);

    if (!empty($transformedPendingArray) && !empty($mergedHistory)) {
        $result = sort_array(merge_arrays($transformedPendingArray, $mergedHistory));
    } elseif (!empty($transformedPendingArray)) {
        $result = sort_array($transformedPendingArray);
    } elseif (!empty($mergedHistory)) {
        $result = sort_array($mergedHistory);
    } else {
        $result = ["message" => "No transactions found"];
    }

    send_jsonresponse($result);
}

// Retrieves and decodes the payload from GET parameters
function get_payload() {
    $rawPayload = $_GET["pl"] ?? null;
    if (!$rawPayload) {
        return null;
    }
    return json_decode(base64_decode($rawPayload), true);
}

// Sends a JSON response with appropriate headers
function send_jsonresponse($data) {
    header("Content-Type: application/json");
    echo json_encode($data, JSON_PRETTY_PRINT);
}

// Fetches account history from the Nano node
function get_account_history($node, $account, $headers) {
    $historyPayload = [
        "action" => "account_history",
        "account" => $account,
        "count" => MAX_HISTORY_COUNT,
        "raw" => true
    ];

    $historyResult = api($node, json_encode($historyPayload), $headers, null, null, null, null);
    $historyData = $historyResult["br_result"] ?? null;

    if (!$historyData || !empty($historyData["error"])) {
        return [];
    }

    $historyBlocks = $historyData["history"] ?? [];
    $historicHashes = array_reduce($historyBlocks, function($carry, $block) {
        if ($block["subtype"] == "receive" || isset($block["receivable"])) {
            $carry[] = $block["link"];
        }
        return $carry;
    }, []);

    if (empty($historicHashes)) {
        return $historyBlocks;
    }

    $historyBlockInfoPayload = [
        "action" => "blocks_info",
        "json_block" => true,
        "pending" => true,
        "source" => true,
        "hashes" => $historicHashes
    ];

    $historyBlockResult = api($node, json_encode($historyBlockInfoPayload), $headers, null, null, null, null);
    $historyInfoData = $historyBlockResult["br_result"] ?? null;

    if (!$historyInfoData || !empty($historyInfoData["error"]) || !is_array($historyInfoData)) {
        return $historyBlocks;
    }

    $transformedHistoryArray = transform_object($historyInfoData);
    return merge_timestamps($historyBlocks, $transformedHistoryArray);
}

// Fetches pending transactions for the account from the Nano node
function get_account_pending($node, $account, $headers) {
    $pendingPayload = [
        "action" => "accounts_pending",
        "accounts" => [$account],
        "include_active" => true,
        "count" => MAX_PENDING_COUNT,
    ];

    sleep(1); // set 1 second timeout for too many api calls on the nano api proxy

    $receivableResult = api($node, json_encode($pendingPayload), $headers, null, null, null, null);
    $pendingData = $receivableResult["br_result"] ?? null;

    if (!$pendingData) {
        return [];
    }

    $pendingBlocks = $pendingData["blocks"][$account] ?? [];
    if (empty($pendingBlocks)) {
        return [];
    }

    $pendingBlockInfoPayload = [
        "action" => "blocks_info",
        "json_block" => true,
        "pending" => true,
        "source" => true,
        "hashes" => array_values($pendingBlocks)
    ];

    $pendingResult = api($node, json_encode($pendingBlockInfoPayload), $headers, null, null, null, null);
    $pendingBlockInfoData = $pendingResult["br_result"] ?? null;

    return transform_object($pendingBlockInfoData);
}

// Transforms block data into a more usable format
function transform_object($obj) {
    if (!isset($obj["blocks"]) || !is_array($obj["blocks"])) {
        return [];
    }
    return array_map(function($key, $value) {
        $value["hash"] = $key;
        return $value;
    }, array_keys($obj["blocks"]), $obj["blocks"]);
}

// Merges timestamp information into the history blocks
function merge_timestamps($history, $historyBlocks) {
    $lookup = array_column($historyBlocks, "local_timestamp", "hash");
    return array_map(function($item) use ($lookup) {
        if (isset($lookup[$item["link"]])) {
            $item["local_timestamp"] = $lookup[$item["link"]];
        }
        return $item;
    }, $history);
}

// Merges two arrays
function merge_arrays($array1, $array2) {
    return array_merge($array1, $array2);
}

// Sorts an array of transactions by timestamp in descending order
function sort_array($array) {
    usort($array, function($a, $b) {
        return $b["local_timestamp"] - $a["local_timestamp"];
    });
    return $array;
}

main();