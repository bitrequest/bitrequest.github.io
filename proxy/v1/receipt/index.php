<?php
// Function to safely get GET parameters
function get_param($key, $default = null) {
    return $_GET[$key] ?? $default;
}

// Function to escape PDF text with better UTF-8 support
function escape_pdf_text($text) {
    // Basic special character escaping
    $text = str_replace(['\\', '(', ')', "\n"], ['\\\\', '\\(', '\\)', '\\n'], $text);
    
    // Handle French accented characters explicitly
    $accented_chars = [
        'é' => '\351', 'è' => '\350', 'ê' => '\352', 'ë' => '\353',
        'à' => '\340', 'â' => '\342', 'ä' => '\344',
        'î' => '\356', 'ï' => '\357',
        'ô' => '\364', 'ö' => '\366',
        'ù' => '\371', 'û' => '\373', 'ü' => '\374',
        'ç' => '\347', 'Ç' => '\307',
        'É' => '\311', 'È' => '\310', 'Ê' => '\312', 'Ë' => '\313',
        'À' => '\300', 'Â' => '\302', 'Ä' => '\304',
        'Î' => '\316', 'Ï' => '\317',
        'Ô' => '\324', 'Ö' => '\326',
        'Ù' => '\331', 'Û' => '\333', 'Ü' => '\334'
    ];
    
    // Replace each accented character with its PDF octal code
    foreach ($accented_chars as $char => $replacement) {
        $text = str_replace($char, $replacement, $text);
    }
    
    return $text;
}

// Function to generate PDF content
function generate_pdf_content($data) {
    $output = "";
    $index = 0;
    
    // Add horizontal line under title
    $output .= "
    q
    0.8 w
    50 690 m
    562 690 l
    S
    Q
    ";
    
    foreach ($data as $key => $value) {
        // Increase line spacing (about 1cm = ~28.35 points)
        $margin = 650 - ($index * 30);
        $escaped_key = escape_pdf_text($key);
        $escaped_value = escape_pdf_text($value);
        
        // Make keys bold using /F2 (Helvetica-Bold) and values regular font
        $output .= "BT /F2 12 Tf 50 $margin Td ($escaped_key: )Tj /F1 12 Tf ($escaped_value)Tj ET ";
        
        // Add light gray separator line between entries (except after the last one)
        if ($index < count($data) - 1) {
            $line_y = $margin - 10; // Position line below text
            $output .= "
            q
            0.3 w
            0.8 0.8 0.8 RG
            50 $line_y m
            562 $line_y l
            S
            Q
            ";
        }
        
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
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R 
   /Resources << 
      /ProcSet 6 0 R 
      /Font << /F1 7 0 R /F2 8 0 R >> 
   >>
>>
endobj
5 0 obj
<< /Length 3000 >>
stream
BT/F1 24 Tf 50 700 Td (RECEIPT)Tj ET $output BT/F1 8 Tf 505 15 Td (Powered by bitrequest.io)Tj ET 
endstream
endobj
6 0 obj
[/PDF /Text /ImageB /ImageC /ImageI]
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>
endobj
8 0 obj
<< /Type /Font /Subtype /Type1 /Name /F2 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>
endobj
xref
0 9
0000000000 65535 f
0000000012 00000 n
0000000089 00000 n
0000000145 00000 n
0000000214 00000 n
0000000399 00000 n
0000001459 00000 n
0000001514 00000 n
0000001622 00000 n
trailer
<< /Size 9 /Root 1 0 R >>
startxref
1733
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
    
    // Fix the encoding issues by detecting the encoding and converting properly
    $encoding = mb_detect_encoding($decoded, ['UTF-8', 'ISO-8859-1'], true);
    if ($encoding !== 'UTF-8') {
        $decoded = mb_convert_encoding($decoded, 'UTF-8', $encoding);
    }
    
    // Try decoding as JSON
    $data = json_decode($decoded, true);
    
    // If that fails, try alternative encodings
    if (!$data) {
        // Try Latin1 (ISO-8859-1) encoding
        $decoded = utf8_decode($decoded);
        $data = json_decode($decoded, true);
    }
    
    if (!$data) {
        throw new Exception("Invalid data format");
    }
    
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