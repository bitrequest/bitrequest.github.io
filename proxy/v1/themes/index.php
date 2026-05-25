<?php
	header("Access-Control-Allow-Origin: *");
	$css_files = preg_grep("/^[^.].*\\.css$/", scandir("."));
	sort($css_files);
	echo json_encode($css_files);
?>