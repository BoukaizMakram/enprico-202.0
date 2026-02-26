<?php
/**
 * English Tutoring - Registration Endpoint
 * Stores English tutoring registration data before payment
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Validate required config
validateConfig(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']);

$supabaseUrl = SUPABASE_URL;
$supabaseServiceKey = SUPABASE_SERVICE_KEY;

// Get request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body']);
    exit;
}

// Validate required fields
$requiredFields = ['email', 'full_name', 'phone', 'plan'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

// Validate email format
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

// Validate plan type for English
if (!in_array($data['plan'], ['flexible', 'standard'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid plan type']);
    exit;
}

// Prepare data for insertion
$registrationData = [
    'email' => strtolower(trim($data['email'])),
    'full_name' => trim($data['full_name']),
    'phone' => trim($data['phone']),
    'english_level' => isset($data['level']) ? $data['level'] : 'intermediate',
    'learning_goals' => isset($data['goals']) ? trim($data['goals']) : null,
    'plan_type' => $data['plan'],
    'service_type' => 'english',
    'status' => 'pending',
    'created_at' => date('c')
];

// Check for existing pending registration with same email
$existingRegistration = getExistingPendingRegistration($supabaseUrl, $supabaseServiceKey, $registrationData['email']);

if ($existingRegistration && $existingRegistration['status'] === 'pending') {
    // Update existing pending registration
    $result = updatePendingRegistration($supabaseUrl, $supabaseServiceKey, $existingRegistration['id'], $registrationData);
    if ($result) {
        echo json_encode([
            'success' => true,
            'id' => $existingRegistration['id'],
            'message' => 'Registration updated'
        ]);
        exit;
    }
}

// Create new pending registration
$result = createEnglishRegistration($supabaseUrl, $supabaseServiceKey, $registrationData);

if (!$result) {
    http_response_code(500);
    $errorMsg = 'Failed to create registration';
    if (isset($GLOBALS['last_db_error'])) {
        $errorMsg .= ': ' . $GLOBALS['last_db_error'];
    }
    echo json_encode(['error' => $errorMsg]);
    exit;
}

echo json_encode([
    'success' => true,
    'id' => $result['id'],
    'message' => 'Registration created'
]);

// ============================================
// Helper Functions
// ============================================

function getExistingPendingRegistration($supabaseUrl, $serviceKey, $email) {
    $ch = curl_init();
    $url = "$supabaseUrl/rest/v1/english_registrations?email=eq." . urlencode($email) . "&status=eq.pending&order=created_at.desc&limit=1";
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $serviceKey,
        'Authorization: Bearer ' . $serviceKey,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return null;
    }

    $data = json_decode($response, true);
    return isset($data[0]) ? $data[0] : null;
}

function createEnglishRegistration($supabaseUrl, $serviceKey, $data) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/english_registrations");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $serviceKey,
        'Authorization: Bearer ' . $serviceKey,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 201) {
        error_log("Failed to create English registration (HTTP $httpCode): $response");
        $GLOBALS['last_db_error'] = "HTTP $httpCode: $response";
        return null;
    }

    $result = json_decode($response, true);
    return isset($result[0]) ? $result[0] : null;
}

function updatePendingRegistration($supabaseUrl, $serviceKey, $id, $data) {
    unset($data['created_at']); // Don't update created_at
    $data['updated_at'] = date('c');

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/english_registrations?id=eq.$id");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $serviceKey,
        'Authorization: Bearer ' . $serviceKey,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode === 200;
}
