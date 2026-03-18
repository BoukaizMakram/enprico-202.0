<?php
/**
 * Tutor API - Exams
 * GET: List tutor's exams
 * POST: Create a new exam
 * PUT: Grade an exam
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
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/tutor_exams?tutor_id=eq.' . $tutorId . '&order=created_at.desc');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch exams', 'data' => []]);
        exit;
    }

    $exams = json_decode($response, true);

    // Fetch student names
    $studentIds = array_unique(array_column($exams, 'student_id'));
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

    foreach ($exams as &$exam) {
        $exam['student_name'] = $studentNames[$exam['student_id']] ?? 'Unknown';
    }

    echo json_encode(['success' => true, 'data' => $exams]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $tutorId = $input['tutor_id'] ?? null;
    $studentId = $input['student_id'] ?? null;
    $title = $input['title'] ?? null;
    $notes = $input['notes'] ?? '';
    $fileUrl = $input['file_url'] ?? null;

    if (!$tutorId || !$studentId || !$title) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'tutor_id, student_id, and title required']);
        exit;
    }

    $examData = [
        'tutor_id' => $tutorId,
        'student_id' => $studentId,
        'title' => $title,
        'notes' => $notes,
        'file_url' => $fileUrl,
        'status' => 'sent'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/tutor_exams');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($examData));
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
        echo json_encode(['success' => true, 'message' => 'Exam sent successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create exam']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;
    $score = $input['score'] ?? null;

    if (!$id || $score === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Exam ID and score required']);
        exit;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/tutor_exams?id=eq.' . $id);
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
        echo json_encode(['success' => true, 'message' => 'Exam graded successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to grade exam']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
