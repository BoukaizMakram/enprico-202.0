<?php
/**
 * Tutor API - Exercises
 * GET: List tutor's exercises
 * POST: Create exercise (video, pdf, text, qcm)
 * PUT: Grade exercise
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/exercises?tutor_id=eq.' . $tutorId . '&order=created_at.desc');
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

    // Fetch student names
    $studentIds = array_unique(array_column($exercises, 'student_id'));
    $studentNames = [];

    if (!empty($studentIds)) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/profiles?id=in.(' . implode(',', $studentIds) . ')&select=id,full_name');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey
        ]);
        $studentsResponse = curl_exec($ch);
        curl_close($ch);

        $studentsData = json_decode($studentsResponse, true);
        if (is_array($studentsData)) {
            foreach ($studentsData as $s) {
                $studentNames[$s['id']] = $s['full_name'];
            }
        }
    }

    // Fetch QCM questions for each qcm exercise
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
        $exercise['student_name'] = $studentNames[$exercise['student_id']] ?? 'Unknown';
        if ($exercise['type'] === 'qcm') {
            $exercise['questions'] = $qcmQuestions[$exercise['id']] ?? [];
        }
    }

    echo json_encode(['success' => true, 'data' => $exercises]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $tutorId = $input['tutor_id'] ?? null;
    $studentId = $input['student_id'] ?? null;
    $title = $input['title'] ?? null;
    $type = $input['type'] ?? null;
    $instructions = $input['instructions'] ?? '';
    $fileUrl = $input['file_url'] ?? null;
    $videoUrl = $input['video_url'] ?? null;
    $questions = $input['questions'] ?? [];

    if (!$tutorId || !$studentId || !$title || !$type) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'tutor_id, student_id, title, and type required']);
        exit;
    }

    if (!in_array($type, ['video', 'pdf', 'text', 'qcm'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid type. Must be video, pdf, text, or qcm']);
        exit;
    }

    $exerciseData = [
        'tutor_id' => $tutorId,
        'student_id' => $studentId,
        'title' => $title,
        'type' => $type,
        'instructions' => $instructions,
        'file_url' => $fileUrl,
        'video_url' => $videoUrl,
        'status' => 'sent'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/exercises');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($exerciseData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Prefer: return=representation'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 && $httpCode !== 201) {
        echo json_encode(['success' => false, 'message' => 'Failed to create exercise']);
        exit;
    }

    $created = json_decode($response, true);
    $exerciseId = is_array($created) && isset($created[0]) ? $created[0]['id'] : null;

    // If QCM, create questions
    if ($type === 'qcm' && !empty($questions) && $exerciseId) {
        foreach ($questions as $i => $q) {
            $qData = [
                'exercise_id' => $exerciseId,
                'question' => $q['question'],
                'options' => json_encode($q['options']),
                'correct_answer' => (int)$q['correct_answer'],
                'sort_order' => $i
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/qcm_questions');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($qData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'apikey: ' . $supabaseKey,
                'Authorization: Bearer ' . $supabaseKey,
                'Prefer: return=minimal'
            ]);
            curl_exec($ch);
            curl_close($ch);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Exercise created successfully']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;
    $score = $input['score'] ?? null;

    if (!$id || $score === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Exercise ID and score required']);
        exit;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/exercises?id=eq.' . $id);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'score' => (float)$score,
        'status' => 'graded'
    ]));
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
        echo json_encode(['success' => true, 'message' => 'Exercise graded successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to grade exercise']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
