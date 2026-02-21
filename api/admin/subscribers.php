<?php
/**
 * Admin API - Newsletter Subscribers
 * GET: List all subscribers
 * DELETE: Remove a subscriber
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$supabaseUrl = SUPABASE_URL;
$supabaseKey = SUPABASE_SERVICE_KEY;

// Check if config is loaded
if (empty($supabaseUrl) || empty($supabaseKey)) {
    error_log('Admin subscribers API: Missing Supabase configuration');
    echo json_encode(['success' => false, 'message' => 'Server configuration error', 'data' => []]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch all subscribers
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/newsletter_subscribers?order=subscribed_at.desc');
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
        error_log('Admin subscribers API curl error: ' . $curlError);
        echo json_encode(['success' => false, 'message' => 'Connection error', 'data' => []]);
        exit;
    }

    if ($httpCode === 200) {
        $data = json_decode($response, true);
        echo json_encode(['success' => true, 'data' => $data ?: []]);
    } else {
        error_log('Admin subscribers API error: HTTP ' . $httpCode . ' - ' . $response);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch subscribers (table may not exist)', 'data' => []]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Subscriber ID required']);
        exit;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/newsletter_subscribers?id=eq.' . $id);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 || $httpCode === 204) {
        echo json_encode(['success' => true, 'message' => 'Subscriber deleted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete subscriber']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
