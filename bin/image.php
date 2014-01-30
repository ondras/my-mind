<?php
	if ($_SERVER["REQUEST_METHOD"] != "POST" || !array_key_exists("data", $_POST)) { die(); }
	$data = $_POST["data"];

	/* pick the base my-mind url */
	preg_match("/^[^\\?]+/", $_SERVER["HTTP_REFERER"], $r);
	$url = $r[0];

	/* pick the file name */
	$filename = md5($data) . ".png";
	
	/* render if necessary */
	if (!file_exists($filename)) {
		$command = "./phantomjs phantomjs-my-mind.js " . escapeshellarg($url) . " " . $filename . " -";
		$descriptors = array(
			array("pipe", "r"),
			array("pipe", "w")
		);
		$process = proc_open($command, $descriptors, $pipes);
		fwrite($pipes[0], $data);
		fclose($pipes[0]);
		$result = proc_close($process);

		if ($result) {
			echo "Error calling PhantomJS, return code ".$result;
			die();
		}
	}
	
	$name = $_POST["name"] . ".png";
	header("Content-type: image/png");
	header("Content-Disposition: attachment; filename=\"$name\"");
	readfile($filename);
?>
