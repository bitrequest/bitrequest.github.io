<?php
	include_once "../filter.php";
	
	// Constants for application settings
	const CACHE_TIME = "2m";
	const CACHE_DIR = "api/cache/" . CACHE_TIME . "/";
	const DEFAULT_TITLE = "Bitrequest";
	const DEFAULT_MESSAGE = "⚠️ Request not found or expired";
	
	// Retrieves GET parameter safely with optional fallback value
	function get_param($key, $default = null) {
		return $_GET[$key] ?? $default;
	}
	
	// Outputs string safely by escaping HTML special characters to prevent XSS
	function safe_echo($str) {
		echo htmlspecialchars($str, ENT_QUOTES, "UTF-8");
	}
	
	// Main execution
	$inv = get_param("invoice");
	$inv = ($inv && preg_match("/^[a-zA-Z0-9_-]+$/", $inv)) ? $inv : false;
	$path = $inv ? CACHE_DIR . $inv : false;
	$message = null;
	$longurl = null;
	$thumb = null;
	$sharedtitle = DEFAULT_TITLE;
	
	if (file_exists($path)) {
		$get_content = file_get_contents($path);
		if ($get_content !== false) {
			$decoded = base64_decode($get_content);
			if ($decoded !== null) {
				$content = json_decode($decoded, true);
				if ($content) {
					$longurl = $content["sharedurl"] ?? null;
					$thumb = $content["sitethumb"] ?? null;
				}
			}
		}
	} else {
		$sharedtitle = DEFAULT_MESSAGE;
		$message = DEFAULT_MESSAGE;
	}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<meta property="og:title" content="Bitrequest"/>
	<meta name="description" content="Accept crypto anywhere"/>
	<meta property="og:description" content="Accept crypto anywhere"/>
	<?php if ($thumb): ?>
		<meta property="og:image" content="<?php safe_echo($thumb); ?>"/>
	<?php endif; ?>
	<?php if ($longurl): ?>
		<meta http-equiv="refresh" content="0;URL=<?php safe_echo($longurl); ?>" />
	<?php endif; ?>
	<title><?php safe_echo($sharedtitle); ?></title>
	<link rel="stylesheet" media="screen" href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700"/>
	<style>
		* {
			box-sizing: border-box;
			-moz-osx-font-smoothing: grayscale;
			-webkit-tap-highlight-color: rgba(255, 255, 255, 0);
		}
		html {
			height: 100%;
			margin: 0;
		}
		body {
			position: relative;
			background-color: #4e5358;
			color: #cfcfcf;
			width: 100%;
			height: 100%;
			margin: 0;
			padding: 1em;
			font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
			text-rendering: optimizeLegibility;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			font-kerning: auto;
			font-weight: 400;
			color: #ccc8c8;
		}
		#panels {
			display: flex;
			width: 100%;
			height: 100%;
			margin: auto;
			max-width: 500px;
			justify-content: center;
			align-items: center;
			border: 1px solid #bcbcbc;
			padding: 2em;
		}
		#panel {
			height: 100%;
			padding: 0;
			margin: 0;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		#inner {
			position: relative;
			width: auto;
			text-align: center;
		}
		#sub {
			padding: 0.5em 1em;
			border: 1px solid #bcbcbc;
		}
		#inner h1 {
			font-weight: 300;
			font-size: 4em;
		}
		h1#bitrequest {
			font-size: 14vw;
		}
		#inner h2 {
			font-weight: 400;
		}
		a {
			text-decoration: none;
			color: #4684a6;
			font-weight: 400;
			font-size: 1.2em;
		}
		@media only screen and (min-width: 500px) {
			h1#bitrequest {
				font-size: 4em;
			}
		}
	</style>
</head>
<body>
	<?php if ($message): ?>
		<div id="panel">
			<div id="inner">
				<h1 id="bitrequest">Bitrequest</h1>
				<div id="sub">
					<h2><?php safe_echo($message); ?></h2>
				</div>
				<p><a href="https://bitrequest.github.io">Continue to https://bitrequest.github.io</a></p>
			</div>
		</div>
	<?php endif; ?>
</body>
</html>