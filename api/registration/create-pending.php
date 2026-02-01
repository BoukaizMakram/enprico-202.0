<?php
/**
 * Create Pending Registration
 * Stores registration form data before payment
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

// Validate required fields (no password - will be auto-generated after payment)
$requiredFields = ['email', 'fullName', 'englishLevel', 'learningGoals', 'preferredDays', 'preferredTimes', 'planType'];
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

// Validate plan type
if (!in_array($data['planType'], ['starter', 'professional'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid plan type']);
    exit;
}

// Validate english level
if (!in_array($data['englishLevel'], ['beginner', 'intermediate', 'advanced', 'native'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid English level']);
    exit;
}

// Check if email already exists in Supabase Auth
$existingUser = getUserByEmail($supabaseUrl, $supabaseServiceKey, $data['email']);
if ($existingUser) {
    // User exists - check if they already have Professional plan
    $hasProfessionalPlan = checkUserHasPlan($supabaseUrl, $supabaseServiceKey, $existingUser['id'], 'professional');

    if ($hasProfessionalPlan && $data['planType'] === 'professional') {
        http_response_code(409);
        echo json_encode(['error' => 'You already have the Professional plan. Please log in to your dashboard.']);
        exit;
    }

    // User exists but can still purchase - return as existing user
    echo json_encode([
        'success' => true,
        'existingUser' => true,
        'userId' => $existingUser['id'],
        'userEmail' => $existingUser['email'],
        'message' => 'Existing user - proceed to payment'
    ]);
    exit;
}

// Prepare data for insertion (no password - will be auto-generated after payment)
$registrationData = [
    'email' => strtolower(trim($data['email'])),
    'full_name' => trim($data['fullName']),
    'phone' => isset($data['phone']) ? trim($data['phone']) : null,
    'english_level' => $data['englishLevel'],
    'learning_goals' => $data['learningGoals'],
    'goals_description' => isset($data['goalsDescription']) ? trim($data['goalsDescription']) : null,
    'preferred_days' => $data['preferredDays'],
    'preferred_times' => $data['preferredTimes'],
    'timezone' => isset($data['timezone']) ? $data['timezone'] : null,
    'plan_type' => $data['planType'],
    'status' => 'pending'
];

// Check for existing pending registration with same email
$existingRegistration = getExistingPendingRegistration($supabaseUrl, $supabaseServiceKey, $registrationData['email']);

if ($existingRegistration && $existingRegistration['status'] === 'pending') {
    // Update existing pending registration
    $result = updatePendingRegistration($supabaseUrl, $supabaseServiceKey, $existingRegistration['id'], $registrationData);
    if ($result) {
        echo json_encode([
            'success' => true,
            'registrationId' => $existingRegistration['id'],
            'message' => 'Registration updated'
        ]);
        exit;
    }
}

// Create new pending registration
$result = createPendingRegistration($supabaseUrl, $supabaseServiceKey, $registrationData);

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
    'registrationId' => $result['id'],
    'message' => 'Registration created'
]);

// ============================================
// Helper Functions
// ============================================

function getUserByEmail($supabaseUrl, $serviceKey, $email) {
    $email = strtolower(trim($email));

    // First, try the Supabase Admin API to get user by email
    $ch = curl_init();
    $url = "$supabaseUrl/auth/v1/admin/users";
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
        error_log("getUserByEmail admin API failed: HTTP $httpCode - $response");
        return null;
    }

    $data = json_decode($response, true);

    // The admin API returns { users: [...] }
    if (!isset($data['users']) || !is_array($data['users'])) {
        return null;
    }

    // Find user with matching email
    foreach ($data['users'] as $user) {
        if (isset($user['email']) && strtolower($user['email']) === $email) {
            return [
                'id' => $user['id'],
                'email' => $user['email']
            ];
        }
    }

    return null;
}

function checkUserHasPlan($supabaseUrl, $serviceKey, $userId, $planType) {
    // Check if user has an active subscription of this plan type
    $ch = curl_init();
    $url = "$supabaseUrl/rest/v1/subscriptions?user_id=eq." . urlencode($userId)
         . "&plan_type=eq." . urlencode($planType)
         . "&status=eq.active&limit=1";
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
        return false;
    }

    $data = json_decode($response, true);
    return isset($data[0]);
}

function getExistingPendingRegistration($supabaseUrl, $serviceKey, $email) {
    $ch = curl_init();
    $url = "$supabaseUrl/rest/v1/pending_registrations?email=eq." . urlencode($email) . "&status=eq.pending&order=created_at.desc&limit=1";
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

function createPendingRegistration($supabaseUrl, $serviceKey, $data) {
    // Convert arrays to PostgreSQL array format
    $data['learning_goals'] = '{' . implode(',', array_map(function($g) { return '"' . $g . '"'; }, $data['learning_goals'])) . '}';
    $data['preferred_days'] = '{' . implode(',', array_map(function($d) { return '"' . $d . '"'; }, $data['preferred_days'])) . '}';
    $data['preferred_times'] = '{' . implode(',', array_map(function($t) { return '"' . $t . '"'; }, $data['preferred_times'])) . '}';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/pending_registrations");
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
        error_log("Failed to create pending registration (HTTP $httpCode): $response");
        // Store error details for better debugging
        $GLOBALS['last_db_error'] = "HTTP $httpCode: $response";
        return null;
    }

    $result = json_decode($response, true);
    return isset($result[0]) ? $result[0] : null;
}

function updatePendingRegistration($supabaseUrl, $serviceKey, $id, $data) {
    // Convert arrays to PostgreSQL array format
    $data['learning_goals'] = '{' . implode(',', array_map(function($g) { return '"' . $g . '"'; }, $data['learning_goals'])) . '}';
    $data['preferred_days'] = '{' . implode(',', array_map(function($d) { return '"' . $d . '"'; }, $data['preferred_days'])) . '}';
    $data['preferred_times'] = '{' . implode(',', array_map(function($t) { return '"' . $t . '"'; }, $data['preferred_times'])) . '}';

    // Reset expiration
    $data['expires_at'] = date('c', strtotime('+24 hours'));

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/pending_registrations?id=eq.$id");
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
