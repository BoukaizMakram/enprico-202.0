<?php
/**
 * Admin API - English Students
 * GET: List all English students
 * PUT: Update an English student
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$supabaseUrl = SUPABASE_URL;
$supabaseKey = SUPABASE_SERVICE_KEY;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch all English students
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/english_students?order=created_at.desc');
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
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch English students', 'data' => []]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Student ID required']);
        exit;
    }

    // Build update data
    $updateData = [];
    if (isset($input['full_name'])) $updateData['full_name'] = $input['full_name'];
    if (isset($input['email'])) $updateData['email'] = $input['email'];
    if (isset($input['phone'])) $updateData['phone'] = $input['phone'];
    if (isset($input['english_level'])) $updateData['english_level'] = $input['english_level'];
    if (isset($input['timezone'])) $updateData['timezone'] = $input['timezone'];
    if (isset($input['learning_goals'])) $updateData['learning_goals'] = $input['learning_goals'];
    if (isset($input['status'])) $updateData['status'] = $input['status'];
    if (isset($input['notes'])) $updateData['notes'] = $input['notes'];

    if (empty($updateData)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No data to update']);
        exit;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/english_students?id=eq.' . $id);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Prefer: return=minimal'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 || $httpCode === 204) {
        echo json_encode(['success' => true, 'message' => 'English student updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update English student']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
