<?php
	$data = "";
	$output = "";

	if (isset($_GET["data"])) {
		$dataparam = $_GET["data"];
		$data = json_decode(base64_decode($dataparam));
	}
	else {
		return false;
	}
	$index = 0; 
	foreach ($data as $key => $value) {
		$margin = 650 - ($index * 20);
        $output .= " BT /F1 12 Tf 50 " . $margin . " Td (" . $key . ": " . $value . ")Tj ET ";
		$index++;
    };
	$content = "%PDF-1.7
1 0 obj
<< /Type /Catalog /Outlines 2 0 R /Pages 3 0 R >>
endobj

2 0 obj
<< /Type /Outlines /Count 0 >>
endobj

3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj

4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /ProcSet 6 0 R /Font << /F1 7 0 R >> >> >>
endobj

5 0 obj
<< /Length 48 >>
stream
BT/F1 24 Tf 50 700 Td (INVOICE)Tj ET " . $output . " BT/F1 8 Tf 505 15 Td (Powered by bitrequest.io)Tj ET endstream
endobj

6 0 obj
[/PDF /Text]
endobj

7 0 obj
<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Arial /Encoding /MacRomanEncoding >>
endobj

xref
0 8
0000000000 65535 f
0000000012 00000 n
0000000089 00000 n
0000000145 00000 n
0000000214 00000 n
0000000381 00000 n
0000000485 00000 n
0000000518 00000 n
trailer
<< /Size 8 /Root 1 0 R >>
startxref
642
%%EOF";
	header("Content-Type: application/pdf");
    header("Content-Length: " . strlen($content));
    header("Content-Disposition: inline; filename='bitrequest_invoice_" . $ordernr . "'");
    header("Cache-Control: private, max-age=0, must-revalidate");
    header("Pragma: public");
    ini_set("zlib.output_compression","0");
    die($content);
?>