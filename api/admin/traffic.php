<?php
/**
 * Admin API - Traffic Data
 * GET: List all traffic/visitor data
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$supabaseUrl = SUPABASE_URL;
$supabaseKey = SUPABASE_SERVICE_KEY;

if (empty($supabaseUrl) || empty($supabaseKey)) {
    echo json_encode(['success' => false, 'message' => 'Server configuration error', 'data' => []]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch all traffic data
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/traffic?order=visited_at.desc&limit=500');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        error_log('Admin traffic API curl error: ' . $curlError);
        echo json_encode(['success' => false, 'message' => 'Connection error', 'data' => []]);
        exit;
    }

    if ($httpCode === 200) {
        $data = json_decode($response, true);
        echo json_encode(['success' => true, 'data' => $data ?: []]);
    } else {
        error_log('Admin traffic API error: HTTP ' . $httpCode . ' - ' . $response);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch traffic data', 'data' => []]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
