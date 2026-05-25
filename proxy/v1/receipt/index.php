<?php
	include_once "../filter.php";
	
    // Compressed helper functions
    function get_param($key, $default = null) { return $_GET[$key] ?? $default; }
    
    // Simple function to check if string is UTF-8 (replacement for mb_detect_encoding)
    function is_utf8($string) {
        return preg_match("%^(?:
            [\x09\x0A\x0D\x20-\x7E]            # ASCII
            | [\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte
            |  \xE0[\xA0-\xBF][\x80-\xBF]        # excluding overlongs
            | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}  # straight 3-byte
            |  \xED[\x80-\x9F][\x80-\xBF]        # excluding surrogates
            |  \xF0[\x90-\xBF][\x80-\xBF]{2}     # planes 1-3
            | [\xF1-\xF3][\x80-\xBF]{3}          # planes 4-15
            |  \xF4[\x80-\x8F][\x80-\xBF]{2}     # plane 16
        )*$%xs", $string);
    }
    
    // Optimized PDF text escaping function
    function escape_pdf_text($text) {
        // Basic special character escaping (compressed)
        $text = str_replace(["\\", "(", ")", "\n"], ["\\\\", "\\(", "\\)", "\\n"], $text);
        
        // Compressed accented character mapping
        $accented_map = [
            "é"=>"\351","è"=>"\350","ê"=>"\352","ë"=>"\353","à"=>"\340","â"=>"\342",
            "ä"=>"\344","î"=>"\356","ï"=>"\357","ô"=>"\364","ö"=>"\366","ù"=>"\371",
            "û"=>"\373","ü"=>"\374","ç"=>"\347","Ç"=>"\307","É"=>"\311","È"=>"\310",
            "Ê"=>"\312","Ë"=>"\313","À"=>"\300","Â"=>"\302","Ä"=>"\304","Î"=>"\316",
            "Ï"=>"\317","Ô"=>"\324","Ö"=>"\326","Ù"=>"\331","Û"=>"\333","Ü"=>"\334"
        ];
        
        // Replace accented characters
        foreach ($accented_map as $char => $replacement) {
            $text = str_replace($char, $replacement, $text);
        }
        
        return $text;
    }
    
    // Function to generate PDF content
    function generate_pdf_content($data) {
        $output = "";
        $index = 0;
        
        // Add horizontal line under title
        $output .= "q 0.8 w 50 690 m 562 690 l S Q ";
        
        // Compressed data processing loop
        foreach ($data as $key => $value) {
            $margin = 650 - ($index * 30);
            $output .= "BT /F2 12 Tf 50 $margin Td (".escape_pdf_text($key).": )Tj /F1 12 Tf (".escape_pdf_text($value).")Tj ET ";
            
            // Separator line (compressed)
            if ($index < count($data) - 1) {
                $line_y = $margin - 10;
                $output .= "q 0.3 w 0.8 0.8 0.8 RG 50 $line_y m 562 $line_y l S Q ";
            }
            
            $index++;
        }
        
        // PDF structure (minimally compressed)
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
    << /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /ProcSet 6 0 R /Font << /F1 7 0 R /F2 8 0 R >> >>
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