<?php
/**
 * Tutor API - Payment Requests
 * GET: List tutor's payment requests
 * POST: Submit a payment request
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$supabaseUrl = SUPABASE_URL;
$supabaseKey = SUPABASE_SERVICE_KEY;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $tutorId = $_GET['tutor_id'] ?? null;

    if (!$tutorId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'tutor_id required']);
        exit;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/payment_requests?tutor_id=eq.' . $tutorId . '&order=created_at.desc');
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
        echo json_encode(['success' => false, 'message' => 'Failed to fetch payment requests', 'data' => []]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $tutorId = $input['tutor_id'] ?? null;
    $monthYear = $input['month_year'] ?? null;
    $totalHours = $input['total_hours'] ?? null;
    $hourlyRate = $input['hourly_rate'] ?? null;
    $totalAmount = $input['total_amount'] ?? null;

    if (!$tutorId || !$monthYear || $totalHours === null || $hourlyRate === null || $totalAmount === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields required']);
        exit;
    }

    $requestData = [
        'tutor_id' => $tutorId,
        'month_year' => $monthYear,
        'total_hours' => (float)$totalHours,
        'hourly_rate' => (float)$hourlyRate,
        'total_amount' => (float)$totalAmount,
        'status' => 'pending'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/payment_requests');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Prefer: return=minimal'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 || $httpCode === 201) {
        echo json_encode(['success' => true, 'message' => 'Payment request submitted']);
    } else {
        $errorData = json_decode($response, true);
        $msg = 'Failed to submit payment request';
        if (isset($errorData['message']) && strpos($errorData['message'], 'duplicate') !== false) {
            $msg = 'A payment request for this month already exists';
        }
        echo json_encode(['success' => false, 'message' => $msg]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
