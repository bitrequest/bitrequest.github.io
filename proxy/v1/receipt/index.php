<?php
include_once "../filter.php";

// Compressed helper functions
function get_param($key, $default = null) { return $_GET[$key] ?? $default; }

// Converts UTF-8 to WinAnsi (Windows-1252) bytes for the Helvetica fonts; anything outside it becomes "?"
function utf8_to_winansi($text) {
    static $cp1252 = [
        0x20AC => 0x80, 0x201A => 0x82, 0x0192 => 0x83, 0x201E => 0x84, 0x2026 => 0x85, 0x2020 => 0x86,
        0x2021 => 0x87, 0x02C6 => 0x88, 0x2030 => 0x89, 0x0160 => 0x8A, 0x2039 => 0x8B, 0x0152 => 0x8C,
        0x017D => 0x8E, 0x2018 => 0x91, 0x2019 => 0x92, 0x201C => 0x93, 0x201D => 0x94, 0x2022 => 0x95,
        0x2013 => 0x96, 0x2014 => 0x97, 0x02DC => 0x98, 0x2122 => 0x99, 0x0161 => 0x9A, 0x203A => 0x9B,
        0x0153 => 0x9C, 0x017E => 0x9E, 0x0178 => 0x9F
    ];
    $chars = preg_split("//u", (string)$text, -1, PREG_SPLIT_NO_EMPTY);
    if ($chars === false) {
        return preg_replace("/[^\x20-\x7E]/", "?", (string)$text); // not valid UTF-8
    }
    $out = "";
    foreach ($chars as $char) {
        $cp = ord($char[0]);
        $len = strlen($char);
        if ($len > 1) {
            $cp &= 0x7F >> $len;
            for ($i = 1; $i < $len; $i++) {
                $cp = ($cp << 6) | (ord($char[$i]) & 0x3F);
            }
        }
        if ($cp < 0x80 || ($cp >= 0xA0 && $cp <= 0xFF)) {
            $out .= chr($cp);
        } elseif (isset($cp1252[$cp])) {
            $out .= chr($cp1252[$cp]);
        } else {
            $out .= "?";
        }
    }
    return $out;
}

// Escapes text for a PDF string literal
function escape_pdf_text($text) {
    return str_replace(["\\", "(", ")", "\r", "\n"], ["\\\\", "\\(", "\\)", "", " "], utf8_to_winansi($text));
}

// Function to generate PDF content
function generate_pdf_content($data) {
    $output = "";
    $index = 0;
    $count = count($data);

    // Add horizontal line under title
    $output .= "q 0.8 w 50 690 m 562 690 l S Q ";

    foreach ($data as $key => $value) {
        $margin = 650 - ($index * 30);
        $output .= "BT /F2 12 Tf 50 $margin Td (" . escape_pdf_text($key) . ": )Tj /F1 12 Tf (" . escape_pdf_text($value) . ")Tj ET ";
        if ($index < $count - 1) {
            $line_y = $margin - 10;
            $output .= "q 0.3 w 0.8 0.8 0.8 RG 50 $line_y m 562 $line_y l S Q ";
        }
        $index++;
    }

    $stream = "BT /F1 24 Tf 50 700 Td (RECEIPT)Tj ET " . $output . "BT /F1 8 Tf 505 15 Td (Powered by bitrequest.io)Tj ET";
    $objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
        "<< /Length " . strlen($stream) . " >>\nstream\n" . $stream . "\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
    ];

    // Assemble with real byte offsets for the xref table
    $pdf = "%PDF-1.4\n";
    $offsets = [];
    foreach ($objects as $i => $object) {
        $offsets[] = strlen($pdf);
        $pdf .= ($i + 1) . " 0 obj\n" . $object . "\nendobj\n";
    }
    $xref_offset = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
    foreach ($offsets as $offset) {
        $pdf .= sprintf("%010d 00000 n \n", $offset);
    }
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n" . $xref_offset . "\n%%EOF\n";
    return $pdf;
}

// Main execution - with robust error handling for Nginx
try {
    // First stop any output buffering
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Check for required data
    if (!($dataparam = get_param("data"))) {
        throw new Exception("No data provided");
    }
    
    // Optimized decoding process
    $decoded = base64_decode($dataparam);
    if ($decoded === false) {
        throw new Exception("Invalid base64 data");
    }
    
    // Try to handle encoding without mb_* functions
    $data = null;
    
    // First try direct JSON decode (if already UTF-8)
    $data = json_decode($decoded, true);
    
    // If that fails, try Latin1 conversion
    if (!$data) {
        $latin1_decoded = mb_convert_encoding($decoded, "ISO-8859-1", "UTF-8");
        $data = json_decode($latin1_decoded, true);
        
        if (!$data) {
            $utf8_encoded = mb_convert_encoding($decoded, "UTF-8", "ISO-8859-1");
            $data = json_decode($utf8_encoded, true);
        }
    }
    
    // Final check for valid data
    if (!$data) {
        throw new Exception("Invalid data format: " . json_last_error_msg());
    }
    
    // Prepare PDF output
    $requestId = $data["Request ID"] ?? "unknown";
    $download = get_param("download") ? "attachment" : "inline";
    $content = generate_pdf_content($data);
    
    // Discard any output so far
    if (ob_get_length()) {
        ob_end_clean();
    }
    
    // Disable all PHP output compression/buffering
    ini_set("zlib.output_compression", "0");
    ini_set("output_buffering", "0");
    
    // Ensure proper encoding
    header("Content-Type: application/pdf; charset=binary");
    header("Content-Length: " . strlen($content));
    
    // Fix for Nginx buffering issues
    header("X-Accel-Buffering: no");
    
    // CORS headers
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    
    // Content delivery headers
    header("Content-Disposition: $download; filename=bitrequest_receipt_" . rawurlencode($requestId) . ".pdf");
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Pragma: no-cache");
    header("Expires: 0");
    
    // Send data in chunks to bypass buffering issues
    $chunkSize = 8192; // 8KB chunks
    $contentLength = strlen($content);
    
    for ($i = 0; $i < $contentLength; $i += $chunkSize) {
        echo substr($content, $i, $chunkSize);
        flush();
    }
    
    // Ensure script terminates properly
    exit;
    
} catch (Exception $e) {
    // Clear any previous output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Log the error for server-side debugging
    error_log("PDF Generation Error: " . $e->getMessage());
    
    // Send comprehensive error headers
    header("HTTP/1.1 400 Bad Request");
    header("Content-Type: text/plain; charset=UTF-8");
    header("Access-Control-Allow-Origin: *");
    
    // Return detailed error for debugging
    echo "Error: " . $e->getMessage();
    exit;
}