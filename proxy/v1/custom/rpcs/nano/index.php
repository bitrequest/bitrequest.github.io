<?php
	include_once "../../../filter.php";
	
    const MAX_HISTORY_COUNT = 15;
    const MAX_PENDING_COUNT = 85;
    
    // Main function to process Nano transactions and combine history with pending transactions
    function main_nano($pl) {
        if (!$pl) {
            return ["error" => "Invalid payload"];
        }
        $node = $pl["node"];
        if (!$node) {
            return ["error" => "Node not provided"];
        }
        
        $account = $pl["account"];
        if (!$account) {
            return ["error" => "Account not provided"];
        }
        $headers = ["Content-Type: application/json"];
        $merged_history = get_account_history($node, $account, $headers);
        if (isset($merged_history["error"])) {
            return $merged_history;
        }
        
        $transformed_pending_array = get_account_pending($node, $account, $headers);
        if (isset($transformed_pending_array["error"])) {
            return $transformed_pending_array;
        }
        if (!empty($transformed_pending_array) && !empty($merged_history)) {
            $result = sort_array(merge_arrays($transformed_pending_array, $merged_history));
        } elseif (!empty($transformed_pending_array)) {
            $result = sort_array($transformed_pending_array);
        } elseif (!empty($merged_history)) {
            $result = sort_array($merged_history);
        } else {
            $result = ["message" => "No transactions found"];
        }
        return $result;
    }
    
    // Retrieves payload data from GET parameters, base64 decoded
    function get_payload() {
        return isset($_GET["pl"]) ? json_decode(base64_decode($_GET["pl"])) : null;
    }
    
    // Outputs JSON response with appropriate headers
    function send_jsonresponse($data) {
        header("Content-Type: application/json");
        echo json_encode($data, JSON_PRETTY_PRINT);
    }
    
    // Fetches transaction history for a Nano account and merges with related block info
    function get_account_history($node, $account, $headers) {
        $history_payload = [
            "action" => "account_history",
            "account" => $account,
            "count" => MAX_HISTORY_COUNT,
            "raw" => true
        ];
        $history_result = api($node, json_encode($history_payload), $headers, null, null, null, null);
        $history_data = json_decode(json_encode($history_result), true); // Consistent conversion
        $history_data = isset($history_data["br_result"]) ? $history_data["br_result"] : null;
        if (isset($history_data["error"])) {
            return $history_data;
        }
        
        if (!$history_data || !empty($history_data["error"])) {
            return [];
        }
        $history_blocks = isset($history_data["history"]) ? $history_data["history"] : [];
        if (!is_array($history_blocks)) {
            return [];
        }
        $historic_hashes = array_reduce($history_blocks, function($carry, $block) {
            if ((isset($block["subtype"]) && $block["subtype"] === "receive") || isset($block["receivable"])) {
                $carry[] = isset($block["link"]) ? $block["link"] : null;
            }
            return $carry;
        }, []);
        if (empty($historic_hashes)) {
            return $history_blocks;
        }
        $history_blockInfo_payload = [
            "action" => "blocks_info",
            "json_block" => true,
            "pending" => true,
            "source" => true,
            "hashes" => array_filter($historic_hashes)
        ];
        $history_block_result = api($node, json_encode($history_blockInfo_payload), $headers, null, null, null, null);
        $historyInfo_data = json_decode(json_encode($history_block_result), true);
        $historyInfo_data = isset($historyInfo_data["br_result"]) ? $historyInfo_data["br_result"] : null;
        if (!$historyInfo_data || !empty($historyInfo_data["error"]) || !is_array($historyInfo_data)) {
            return $history_blocks;
        }
        $transformed_historyarray = transform_object($historyInfo_data);
        return merge_timestamps($history_blocks, $transformed_historyarray);
    }
    
    // Retrieves pending (receivable) transactions for a Nano account
    function get_account_pending($node, $account, $headers) {
        $pending_payload = [
            "action" => "accounts_pending",
            "accounts" => [$account],
            "include_active" => true,
            "count" => MAX_PENDING_COUNT,
        ];
        sleep(1); // wait one second before next call to not exceed api proxy limits
        $receivable_result = api($node, json_encode($pending_payload), $headers, null, null, null, null);
        $pending_data = json_decode(json_encode($receivable_result), true);
        $pending_data = isset($pending_data["br_result"]) ? $pending_data["br_result"] : null;
        if (isset($pending_data["error"])) {
            return $pending_data;
        }
        
        if (!$pending_data) {
            return [];
        }
        $pending_blocks = isset($pending_data["blocks"][$account]) ? $pending_data["blocks"][$account] : [];
        if (empty($pending_blocks)) {
            return [];
        }
        $pendingblockinfo_payload = [
            "action" => "blocks_info",
            "json_block" => true,
            "pending" => true,
            "source" => true,
            "hashes" => array_values($pending_blocks)
        ];
        $pending_result = api($node, json_encode($pendingblockinfo_payload), $headers, null, null, null, null);
        $pending_blockinfo_data = json_decode(json_encode($pending_result), true);
        $pending_blockinfo_data = isset($pending_blockinfo_data["br_result"]) ? $pending_blockinfo_data["br_result"] : null;
        return transform_object($pending_blockinfo_data);
    }
    
    // Transforms a blocks object into an array format, adding the hash as a property to each block
    function transform_object($obj) {
        if (!isset($obj["blocks"]) || !is_array($obj["blocks"])) {
            return [];
        }
        return array_map(function($key, $value) {
            $value["hash"] = $key;
            return $value;
        }, array_keys($obj["blocks"]), $obj["blocks"]);
    }
    
    // Merges timestamp information from history blocks into the main history array
    function merge_timestamps($history, $history_blocks) {
        if (empty($history_blocks)) {
            return $history;
        }
        $lookup = array_column($history_blocks, "local_timestamp", "hash");
        return array_map(function($item) use ($lookup) {
            if (isset($item["link"]) && isset($lookup[$item["link"]])) {
                $item["local_timestamp"] = $lookup[$item["link"]];
            }
            return $item;
        }, $history);
    }
    
    // Merges two arrays safely, handling null values or empty arrays
    function merge_arrays($array1, $array2) {
        return array_merge($array1 ?? [], $array2 ?? []);
    }
    
    // Sorts an array of transactions by timestamp in descending order (newest first)
    function sort_array($array) {
        if (!is_array($array)) {
            return [];
        }
        usort($array, function($a, $b) {
            $a_timestamp = isset($a["local_timestamp"]) ? $a["local_timestamp"] : 0;
            $b_timestamp = isset($b["local_timestamp"]) ? $b["local_timestamp"] : 0;
            return $b_timestamp - $a_timestamp;
        });
        return $array;
    }