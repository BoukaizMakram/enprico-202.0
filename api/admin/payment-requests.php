<?php
/**
 * Admin API - Payment Requests
 * GET: List all payment requests
 * PUT: Update payment request status
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
    // Fetch all payment requests
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/payment_requests?order=created_at.desc&select=*');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $requests = json_decode($response, true);

        // Fetch tutor names for each request
        $tutorIds = array_unique(array_column($requests, 'tutor_id'));
        $tutorNames = [];

        if (!empty($tutorIds)) {
            $idFilter = implode(',', array_map(function($id) { return '"' . $id . '"'; }, $tutorIds));
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/profiles?id=in.(' . implode(',', $tutorIds) . ')&select=id,full_name,email');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'apikey: ' . $supabaseKey,
                'Authorization: Bearer ' . $supabaseKey
            ]);
            $tutorResponse = curl_exec($ch);
            curl_close($ch);

            $tutors = json_decode($tutorResponse, true);
            if (is_array($tutors)) {
                foreach ($tutors as $t) {
                    $tutorNames[$t['id']] = $t['full_name'];
                }
            }
        }

        // Attach tutor names
        foreach ($requests as &$r) {
            $r['tutor_name'] = $tutorNames[$r['tutor_id']] ?? 'Unknown';
        }

        echo json_encode(['success' => true, 'data' => $requests]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch payment requests', 'data' => []]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;
    $status = $input['status'] ?? null;

    if (!$id || !$status) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID and status required']);
        exit;
    }

    $updateData = ['status' => $status];
    if (isset($input['admin_notes'])) {
        $updateData['admin_notes'] = $input['admin_notes'];
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/payment_requests?id=eq.' . $id);
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
        echo json_encode(['success' => true, 'message' => 'Payment request updated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update payment request']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
