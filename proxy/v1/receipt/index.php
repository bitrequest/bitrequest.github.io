<?php
// Function to safely get GET parameters
function get_param($key, $default = null) {
    return $_GET[$key] ?? $default;
}

// Function to escape PDF text
function escape_pdf_text($text) {
    // Escape special characters in PDF strings
    $text = str_replace(["\\", "(", ")", "\n"], ["\\\\", "\\(", "\\)", "\\n"], $text);
    return $text;
}

// Function to generate PDF content
function generate_pdf_content($data) {
    $output = "";
    $index = 0;
    foreach ($data as $key => $value) {
        $margin = 650 - ($index * 20);
        $escaped_key = escape_pdf_text($key);
        $escaped_value = escape_pdf_text($value);
        $output .= " BT /F1 12 Tf 50 $margin Td ($escaped_key: $escaped_value)Tj ET ";
        $index++;
    }
    return "%PDF-1.7
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
BT/F1 24 Tf 50 700 Td (RECEIPT)Tj ET $output BT/F1 8 Tf 505 15 Td (Powered by bitrequest.io)Tj ET endstream
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
}

// Main execution
try {
    $dataparam = get_param("data");
    if (!$dataparam) {
        throw new Exception("No data provided");
    }

    // Safely decode base64 and JSON data
    $decoded = base64_decode($dataparam);
    $data = json_decode($decoded, true);
    
    // Get request ID with fallback
    $requestId = $data["Request ID"] ?? "unknown";
    
    // Set download type
    $download = get_param("download") ? "attachment" : "inline";
    
    // Generate PDF content
    $content = generate_pdf_content($data);
    
    // Clear any previous output
    if (ob_get_length()) {
        ob_clean();
    }
    
    // Set headers
    header("Content-Type: application/pdf");
    header("Content-Length: " . strlen($content));
    header("Content-Disposition: $download; filename=bitrequest_receipt_" . rawurlencode($requestId) . ".pdf");
    header("Cache-Control: private, max-age=0, must-revalidate");
    header("Pragma: public");
    
    // Disable compression
    ini_set("zlib.output_compression", "0");
    
    // Output content
    echo $content;
    
} catch (Exception $e) {
    if (ob_get_length()) {
        ob_clean();
    }
    header("HTTP/1.1 400 Bad Request");
    header("Content-Type: text/plain");
    echo "Error: " . $e->getMessage();
}