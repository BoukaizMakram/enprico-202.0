<?php
/**
 * Student API - Exercises
 * GET: List student's exercises with QCM questions
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
    $userId = $_GET['user_id'] ?? null;

    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'user_id required']);
        exit;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/exercises?student_id=eq.' . $userId . '&order=created_at.desc');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch exercises', 'data' => []]);
        exit;
    }

    $exercises = json_decode($response, true);

    // Fetch QCM questions for qcm exercises
    $exerciseIds = array_column($exercises, 'id');
    $qcmQuestions = [];

    if (!empty($exerciseIds)) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/qcm_questions?exercise_id=in.(' . implode(',', $exerciseIds) . ')&order=sort_order.asc');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey
        ]);
        $qcmResponse = curl_exec($ch);
        curl_close($ch);

        $qcmData = json_decode($qcmResponse, true);
        if (is_array($qcmData)) {
            foreach ($qcmData as $q) {
                $qcmQuestions[$q['exercise_id']][] = $q;
            }
        }
    }

    foreach ($exercises as &$exercise) {
        if ($exercise['type'] === 'qcm') {
            $exercise['questions'] = $qcmQuestions[$exercise['id']] ?? [];
        }
    }

    echo json_encode(['success' => true, 'data' => $exercises]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
