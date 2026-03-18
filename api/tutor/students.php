<?php
/**
 * Tutor API - Students
 * GET: List students assigned to a tutor with hours and subscription data
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
    $tutorId = $_GET['tutor_id'] ?? null;

    if (!$tutorId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'tutor_id required']);
        exit;
    }

    // Fetch assigned students
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/profiles?assigned_tutor_id=eq.' . $tutorId . '&role=eq.student&order=full_name.asc');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch students', 'data' => []]);
        exit;
    }

    $students = json_decode($response, true);
    $currentMonth = date('Y-m');
    $result = [];

    foreach ($students as $student) {
        $sid = $student['id'];

        // Fetch active subscription
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/subscriptions?user_id=eq.' . $sid . '&status=eq.active&order=created_at.desc&limit=1');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey
        ]);
        $subResponse = curl_exec($ch);
        curl_close($ch);
        $subs = json_decode($subResponse, true);
        $sub = is_array($subs) && count($subs) > 0 ? $subs[0] : null;

        // Fetch current month hours
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/hours_tracking?user_id=eq.' . $sid . '&month_year=eq.' . $currentMonth . '&limit=1');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey
        ]);
        $hoursResponse = curl_exec($ch);
        curl_close($ch);
        $hours = json_decode($hoursResponse, true);
        $hoursData = is_array($hours) && count($hours) > 0 ? $hours[0] : null;

        $result[] = [
            'id' => $sid,
            'full_name' => $student['full_name'],
            'email' => $student['email'],
            'plan_type' => $sub ? $sub['plan_type'] : null,
            'plan_hours' => $sub ? (float)$sub['hours_per_month'] : 0,
            'remaining_hours' => $hoursData ? (float)$hoursData['remaining_hours'] : 0,
            'total_hours' => $hoursData ? (float)$hoursData['total_hours'] : 0,
            'used_hours' => $hoursData ? (float)$hoursData['used_hours'] : 0,
            'hours_tracking_id' => $hoursData ? $hoursData['id'] : null
        ];
    }

    echo json_encode(['success' => true, 'data' => $result]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
