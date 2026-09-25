<?php

	function block_malicious_requests() {
		$inputs = array_merge($_GET, $_POST);
		array_walk_recursive($inputs, function ($value) {
			if (is_string($value) && is_suspicious($value)) {
				http_response_code(403);
				die(json_encode(["error" => ["code" => "403", "message" => "Blocked"]]));
			}
		});
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
		if (isset($parsed["user"]) || isset($parsed["pass"])) {
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

		// Numeric IPv4 shorthands (2130706433, 0x7f.1, 127.1) aren't valid IPs to
		// filter_var but curl dials them as IPv4 — never treat them as hostnames.
		if (!filter_var($host_bare, FILTER_VALIDATE_IP) && preg_match("/^(0x[0-9a-f]*|\\d+)(\\.(0x[0-9a-f]*|\\d+)){0,3}\\.?$/i", $host_bare)) {
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
	// The address is normalized to binary first, so alternate spellings of the same
	// address (e.g. ::ffff:7f00:1 vs ::ffff:127.0.0.1) can't slip past the checks.
	// IPv6 forms that embed an IPv4 address (mapped, compatible, SIIT, NAT64, 6to4)
	// are judged by the embedded IPv4.
	function is_public_ip($ip) {
		$bin = @inet_pton($ip);
		if ($bin === false) {
			return false;
		}
		if (strlen($bin) === 16) {
			$v4 = embedded_ipv4($bin);
			if ($v4 !== null) {
				return is_public_ip($v4);
			}
		}
		foreach (blocked_ranges() as $cidr) {
			if (ip_in_cidr($bin, $cidr)) {
				return false;
			}
		}
		$flags = defined("FILTER_FLAG_GLOBAL_RANGE")
			? FILTER_FLAG_GLOBAL_RANGE
			: FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE;
		return filter_var(inet_ntop($bin), FILTER_VALIDATE_IP, $flags) !== false;
	}

	// Returns the IPv4 address embedded in a 16-byte IPv6 address, or null if none.
	function embedded_ipv4($bin) {
		$zero8 = str_repeat("\0", 8);
		$prefix12 = substr($bin, 0, 12);
		if ($prefix12 === $zero8 . "\0\0\xff\xff" // ::ffff:0:0/96 IPv4-mapped
			|| $prefix12 === $zero8 . "\0\0\0\0" // ::/96 IPv4-compatible (also ::, ::1)
			|| $prefix12 === $zero8 . "\xff\xff\0\0" // ::ffff:0:0:0/96 SIIT
			|| $prefix12 === "\x00\x64\xff\x9b" . $zero8) { // 64:ff9b::/96 NAT64
			return inet_ntop(substr($bin, 12, 4));
		}
		if (substr($bin, 0, 2) === "\x20\x02") { // 2002::/16 6to4
			return inet_ntop(substr($bin, 2, 4));
		}
		return null;
	}

	// Ranges that are never valid proxy destinations, checked independently of the
	// PHP version's filter flags (FILTER_FLAG_GLOBAL_RANGE only exists in PHP >= 8.2
	// and still accepts multicast).
	function blocked_ranges() {
		return [
			// IPv4
			"0.0.0.0/8", // "this" network
			"10.0.0.0/8", // private
			"100.64.0.0/10", // CGNAT / Tailscale
			"127.0.0.0/8", // loopback
			"169.254.0.0/16", // link-local, cloud metadata
			"172.16.0.0/12", // private
			"192.0.0.0/24", // IETF protocol assignments
			"192.0.2.0/24", // documentation
			"192.88.99.0/24", // 6to4 relay anycast
			"192.168.0.0/16", // private
			"198.18.0.0/15", // benchmarking
			"198.51.100.0/24", // documentation
			"203.0.113.0/24", // documentation
			"224.0.0.0/4", // multicast
			"240.0.0.0/4", // reserved + broadcast
			// IPv6
			"64:ff9b:1::/48", // local-use NAT64
			"100::/64", // discard-only
			"2001::/23", // IETF protocol assignments, incl. Teredo
			"2001:db8::/32", // documentation
			"3fff::/20", // documentation
			"fc00::/7", // unique local
			"fe80::/10", // link-local
			"fec0::/10", // site-local (deprecated)
			"ff00::/8", // multicast
		];
	}

	// True if binary address $bin (from inet_pton) falls inside $cidr.
	function ip_in_cidr($bin, $cidr) {
		[$net, $len] = explode("/", $cidr);
		$net_bin = inet_pton($net);
		if ($net_bin === false || strlen($net_bin) !== strlen($bin)) {
			return false;
		}
		$len = (int)$len;
		$bytes = intdiv($len, 8);
		if (substr($bin, 0, $bytes) !== substr($net_bin, 0, $bytes)) {
			return false;
		}
		$bits = $len % 8;
		if ($bits === 0) {
			return true;
		}
		$mask = (0xff << (8 - $bits)) & 0xff;
		return (ord($bin[$bytes]) & $mask) === (ord($net_bin[$bytes]) & $mask);
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

	// True if $host is a .onion hostname (case-insensitive, trailing dot allowed).
	function is_onion_host($host) {
		if (!is_string($host) || $host === "") {
			return false;
		}
		return (bool) preg_match("/^([a-z0-9-]+\\.)+onion$/", rtrim(strtolower($host), "."));
	}

	// True if the HOST of $url is a .onion address. Substring checks on the whole URL
	// are not enough: https://example.com/?x=.onion must not be routed through Tor.
	function is_onion_url($url) {
		if (!is_string($url)) {
			return false;
		}
		$scheme = strtolower(parse_url($url, PHP_URL_SCHEME) ?? "");
		if (!in_array($scheme, ["http", "https"], true)) {
			return false;
		}
		return is_onion_host(parse_url($url, PHP_URL_HOST) ?? "");
	}

	// Validates a client-supplied Tor proxy base URL ("https://host[:port]").
	// Returns the base URL plus a CURLOPT_RESOLVE pin, or false. Only https, no
	// userinfo, no path/query/fragment (a trailing "?" or "#" would otherwise swallow
	// the endpoint path we append), and the host must resolve to public IPs only.
	function safe_tor_proxy($candidate) {
		if (!is_string($candidate) || $candidate === "") {
			return false;
		}
		$parsed = parse_url($candidate);
		if (!$parsed || strtolower($parsed["scheme"] ?? "") !== "https" || empty($parsed["host"])) {
			return false;
		}
		if (isset($parsed["user"]) || isset($parsed["pass"]) || isset($parsed["query"]) || isset($parsed["fragment"])) {
			return false;
		}
		if (isset($parsed["path"]) && $parsed["path"] !== "" && $parsed["path"] !== "/") {
			return false;
		}
		$base = "https://" . $parsed["host"] . (isset($parsed["port"]) ? ":" . (int) $parsed["port"] : "");
		$resolved = resolve_safe_url($base);
		if (!$resolved) {
			return false;
		}
		$pin_ip = (strpos($resolved["ip"], ":") !== false) ? "[" . $resolved["ip"] . "]" : $resolved["ip"];
		return [
			"base" => $base,
			"pin" => $resolved["host"] . ":" . $resolved["port"] . ":" . $pin_ip,
		];
	}

	// Sanitizes user input for safe use in file paths
	function safe_filename($input) {
		if (!$input || !is_string($input)) {
			return false;
		}
		if (basename($input) !== $input) {
			return false;
		}
		if (!preg_match("/^[a-zA-Z0-9_-]+$/", $input)) {
			return false;
		}
		return $input;
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