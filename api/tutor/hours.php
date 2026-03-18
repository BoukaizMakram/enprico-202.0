<?php
/**
 * Tutor API - Hours
 * PUT: Update student remaining hours (with validation)
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$supabaseUrl = SUPABASE_URL;
$supabaseKey = SUPABASE_SERVICE_KEY;

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $studentId = $input['student_id'] ?? null;
    $tutorId = $input['tutor_id'] ?? null;
    $remainingHours = $input['remaining_hours'] ?? null;

    if (!$studentId || !$tutorId || $remainingHours === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'student_id, tutor_id, and remaining_hours required']);
        exit;
    }

    $remainingHours = (float)$remainingHours;

    if ($remainingHours < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Hours cannot be negative']);
        exit;
    }

    // Verify tutor owns this student
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/profiles?id=eq.' . $studentId . '&assigned_tutor_id=eq.' . $tutorId . '&select=id');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    $students = json_decode($response, true);

    if (!is_array($students) || count($students) === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Student not assigned to this tutor']);
        exit;
    }

    // Get active subscription to check plan max
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/subscriptions?user_id=eq.' . $studentId . '&status=eq.active&order=created_at.desc&limit=1');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    $subs = json_decode($response, true);

    if (!is_array($subs) || count($subs) === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Student has no active subscription']);
        exit;
    }

    $maxHours = (float)$subs[0]['hours_per_month'];

    if ($remainingHours > $maxHours) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Hours cannot exceed plan maximum of $maxHours"]);
        exit;
    }

    $usedHours = $maxHours - $remainingHours;
    $currentMonth = date('Y-m');

    // Update hours_tracking for current month
    $hoursData = [
        'remaining_hours' => $remainingHours,
        'used_hours' => $usedHours,
        'total_hours' => $maxHours
    ];

    // Try to update existing record first
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/hours_tracking?user_id=eq.' . $studentId . '&month_year=eq.' . $currentMonth);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($hoursData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Prefer: return=representation'
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);

    // If no rows updated, insert new record
    if (is_array($result) && count($result) === 0) {
        $insertData = array_merge($hoursData, [
            'user_id' => $studentId,
            'month_year' => $currentMonth,
            'period_start' => date('Y-m-01'),
            'period_end' => date('Y-m-t')
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/hours_tracking');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($insertData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey,
            'Prefer: return=minimal'
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    }

    if ($httpCode === 200 || $httpCode === 201 || $httpCode === 204) {
        echo json_encode(['success' => true, 'message' => 'Hours updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update hours']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
