<?php

	function block_malicious_requests() {
		$inputs = array_merge($_GET, $_POST);
		foreach ($inputs as $key => $value) {
			if (is_string($value) && is_suspicious($value)) {
				http_response_code(403);
				die(json_encode(["error" => ["code" => "403", "message" => "Blocked"]]));
			}
		}
	}

	function is_suspicious($value) {
		static $patterns = [
			"/(\bOR\b|\bAND\b)\s+\d+[*+\-]\d+\s*=/i",  // SQL injection (OR 5*5=25)
			"/assert\s*\(/i",                              // PHP code injection
			"/base64_decode\s*\(/i",                       // encoded payloads
			"/gethostbyname\s*\(/i",                       // DNS exfiltration
			"/require\s*['\"]?socket/i",                   // Node.js injection
			"/response\.write\s*\(/i",                     // Node.js injection
			"/print\s*\(\s*md5\s*\(/i",                    // PHP probe
			"/\.\.\//",                                    // path traversal
		];
		foreach ($patterns as $pattern) {
			if (preg_match($pattern, $value)) return true;
		}
		return false;
	}

	// Resolves a URL safely against SSRF, returning the data needed to pin curl's DNS lookup so the resolver can't be raced (DNS rebinding).
	function resolve_safe_url($url) {
		$parsed = parse_url($url);
		if (!$parsed || !isset($parsed["scheme"], $parsed["host"])) {
			return false;
		}
		$scheme = strtolower($parsed["scheme"]);
		if (!in_array($scheme, ["http", "https"], true)) {
			return false;
		}
		$host = $parsed["host"];
		$port = $parsed["port"] ?? ($scheme === "https" ? 443 : 80);

		// parse_url leaves the [...] brackets around literal IPv6 hosts;
		// strip them for validation and DNS-pin keys, but keep them on the
		// url-bound $host since curl needs the bracketed form to dial v6.
		$host_bare = (strlen($host) > 1 && $host[0] === "[" && substr($host, -1) === "]")
			? substr($host, 1, -1)
			: $host;

		// .onion goes through the Tor handler before reaching this function;
		// reject defensively so a misrouted .onion can't fall through to curl.
		if (str_ends_with(strtolower($host_bare), ".onion")) {
			return false;
		}

		// Literal IP in the URL — validate directly, no DNS needed.
		if (filter_var($host_bare, FILTER_VALIDATE_IP)) {
			return is_public_ip($host_bare)
				? ["host" => $host, "port" => $port, "ip" => $host_bare, "scheme" => $scheme]
				: false;
		}

		// Enumerate ALL A and AAAA records for this hostname.
		$records = @dns_get_record($host, DNS_A + DNS_AAAA);
		if (!$records) {
			return false;
		}

		$ips = [];
		foreach ($records as $record) {
			if (isset($record["ip"])) {
				$ips[] = $record["ip"];        // A record (IPv4)
			} elseif (isset($record["ipv6"])) {
				$ips[] = $record["ipv6"];      // AAAA record (IPv6)
			}
		}
		if (!$ips) {
			return false;
		}

		// Every IP must be in a public range. If ANY is private/reserved we reject
		// the whole hostname — otherwise an attacker controlling the record set
		// could rotate which IP each query returns and slip a private one past us.
		foreach ($ips as $ip) {
			if (!is_public_ip($ip)) {
				return false;
			}
		}
		return [
			"host" => $host,
			"port" => $port,
			"ip" => $ips[0],   // arbitrary choice; all of them were validated
			"scheme" => $scheme,
		];
	}

	// Backwards-compatible boolean form for any caller that only needs the check.
	function is_safe_url($url) {
		return resolve_safe_url($url) !== false;
	}

	// True if $ip is a routable, non-private, non-reserved IPv4 or IPv6 address.
	// Handles IPv4-mapped IPv6 (::ffff:x.x.x.x) explicitly because the embedded
	// IPv4 portion can otherwise bypass FILTER_FLAG_NO_PRIV_RANGE for IPv4.
	function is_public_ip($ip) {
		if (stripos($ip, "::ffff:") === 0) {
			$v4 = substr($ip, 7);
			if (filter_var($v4, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
				return filter_var(
					$v4,
					FILTER_VALIDATE_IP,
					FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
				) !== false;
			}
		}
		return filter_var(
			$ip,
			FILTER_VALIDATE_IP,
			FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
		) !== false;
	}

	// Per-API allowlist of destination host suffixes. A server-held key is only
	// attached when the request host matches one of these for that API name —
	// otherwise the key could be exfiltrated by pointing api_url at an attacker host.
	function api_host_allowed($api_name, $url) {
		static $allow = [
			"coinmarketcap"    => ["pro-api.coinmarketcap.com"],
			"fixer"            => ["data.fixer.io"],
			"etherscan"        => ["api.etherscan.io"],
			"ethplorer"        => ["api.ethplorer.io", "api.binplorer.com"], // binplorer normalizes to the ethplorer key
			"blockcypher"      => ["api.blockcypher.com"],
			"bitly"            => ["api-ssl.bitly.com"],
			"blockchair"       => ["api.blockchair.com"],
			"currencylayer"    => ["api.currencylayer.com"],
			"exchangeratesapi" => ["api.exchangeratesapi.io"],
			"infura"           => ["infura.io"],     // matches mainnet/arbitrum-mainnet/polygon-mainnet/bsc-mainnet.infura.io
			"alchemy"          => ["g.alchemy.com"], // matches eth-/arb-/polygon-/base-mainnet.g.alchemy.com
		];
		if (!isset($allow[$api_name])) {
			return false; // no entry -> never attach a server key
		}
		$host = parse_url($url, PHP_URL_HOST);
		if (!$host) {
			return false;
		}
		$host = strtolower($host);
		foreach ($allow[$api_name] as $suffix) {
			$suffix = strtolower($suffix);
			// Leading-dot suffix match: "infura.io" matches infura.io and
			// *.infura.io, but not evilinfura.io or infura.io.attacker.com.
			if ($host === $suffix || str_ends_with($host, "." . $suffix)) {
				return true;
			}
		}
		return false;
	}

	// Sanitizes user input for safe use in file paths
	function safe_filename($input) {
		if (!$input || !is_string($input)) {
			return false;
		}
		$clean = basename($input); // strips directory components (../ etc)
		if (!preg_match("/^[a-zA-Z0-9_-]+$/", $clean)) {
			return false;
		}
		return $clean;
	}

	//Checks if Tor is available on the system by attempting to connect to the SOCKS proxy
	function has_tor() {
		foreach (["127.0.0.1", "localhost"] as $host) {
			$socket = @fsockopen($host, 9050, $errno, $errstr, 1);
			if ($socket) {
				fclose($socket);
				return true;
			}
		}
		return false;
	}

	// Creates a JSON-encoded error object with status code and message for standardized error responses
	function error_object($code, $message) {
		return json_encode([
			"error" => [
				"code" => $code,
				"message" => $message
			]
		]);
	}
block_malicious_requests();