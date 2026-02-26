<?php
/**
 * Admin API - English Subscriptions
 * GET: List all English subscriptions
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch all English subscriptions with student info
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/english_subscriptions?select=*,english_students(full_name,email)&order=created_at.desc');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $data = json_decode($response, true);
        // Flatten student info for easier display
        foreach ($data as &$sub) {
            if (isset($sub['english_students'])) {
                $sub['student_name'] = $sub['english_students']['full_name'] ?? null;
                $sub['student_email'] = $sub['english_students']['email'] ?? null;
                unset($sub['english_students']);
            }
        }
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch English subscriptions', 'data' => []]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
