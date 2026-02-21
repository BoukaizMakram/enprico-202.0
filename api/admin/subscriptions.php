<?php
/**
 * Admin API - Subscriptions
 * GET: List all subscriptions with user info
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
    // Fetch all subscriptions with user info
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/subscriptions?select=*,profiles(full_name,email)&order=created_at.desc');
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

        // Flatten the profiles data
        $result = array_map(function($sub) {
            if (isset($sub['profiles'])) {
                $sub['user_name'] = $sub['profiles']['full_name'] ?? null;
                $sub['user_email'] = $sub['profiles']['email'] ?? null;
                unset($sub['profiles']);
            }
            return $sub;
        }, $data);

        echo json_encode(['success' => true, 'data' => $result]);
    } else {
        // If the join fails, try without join
        $ch2 = curl_init();
        curl_setopt($ch2, CURLOPT_URL, $supabaseUrl . '/rest/v1/subscriptions?order=created_at.desc');
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch2, CURLOPT_HTTPHEADER, [
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey
        ]);

        $response2 = curl_exec($ch2);
        $httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        curl_close($ch2);

        if ($httpCode2 === 200) {
            $data = json_decode($response2, true);
            echo json_encode(['success' => true, 'data' => $data]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to fetch subscriptions', 'data' => []]);
        }
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
