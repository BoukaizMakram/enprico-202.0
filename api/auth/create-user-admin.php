<?php
/**
 * Create User Admin
 * Creates a user account via Supabase Admin API (called from webhook after payment)
 * This file contains helper functions, not an endpoint
 */

// Only load config if not already loaded (this file is included by webhook.php which loads config)
if (!defined('SUPABASE_URL')) {
    require_once __DIR__ . '/../config.php';
}

// Set globals from config (can be overridden by including file)
if (!isset($GLOBALS['supabaseUrl'])) {
    $GLOBALS['supabaseUrl'] = SUPABASE_URL;
}
if (!isset($GLOBALS['supabaseServiceKey'])) {
    $GLOBALS['supabaseServiceKey'] = SUPABASE_SERVICE_KEY;
}

/**
 * Create a new user in Supabase Auth
 * @param string $email User's email
 * @param string $password Plain text password (will be hashed by Supabase)
 * @param string $fullName User's full name
 * @return array|null User data or null on failure
 */
function createSupabaseUser($email, $password, $fullName) {
    $supabaseUrl = $GLOBALS['supabaseUrl'];
    $serviceKey = $GLOBALS['supabaseServiceKey'];

    $userData = [
        'email' => $email,
        'password' => $password,
        'email_confirm' => true,  // Auto-confirm email since they paid
        'user_metadata' => [
            'full_name' => $fullName
        ]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/auth/v1/admin/users");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($userData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $serviceKey,
        'Authorization: Bearer ' . $serviceKey,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        error_log("CURL error creating user: $curlError");
        return null;
    }

    if ($httpCode !== 200 && $httpCode !== 201) {
        error_log("Failed to create user (HTTP $httpCode): $response");
        return null;
    }

    return json_decode($response, true);
}

/**
 * Create user profile with all registration data
 * @param string $userId Supabase user ID
 * @param array $profileData Profile data from registration
 * @return bool Success status
 */
function createUserProfile($userId, $profileData) {
    $supabaseUrl = $GLOBALS['supabaseUrl'];
    $serviceKey = $GLOBALS['supabaseServiceKey'];

    // Prepare profile data
    $profile = [
        'id' => $userId,
        'email' => $profileData['email'],
        'full_name' => $profileData['full_name'],
        'phone' => $profileData['phone'] ?? null,
        'english_level' => $profileData['english_level'] ?? null,
        'learning_goals' => isset($profileData['learning_goals']) ? formatArrayForPostgres($profileData['learning_goals']) : null,
        'goals_description' => $profileData['goals_description'] ?? null,
        'preferred_days' => isset($profileData['preferred_days']) ? formatArrayForPostgres($profileData['preferred_days']) : null,
        'preferred_times' => isset($profileData['preferred_times']) ? formatArrayForPostgres($profileData['preferred_times']) : null,
        'timezone' => $profileData['timezone'] ?? null,
        'registration_source' => 'checkout_2025'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/profiles");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($profile));
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
        error_log("Failed to create profile (HTTP $httpCode): $response");
        return false;
    }

    return true;
}

/**
 * Get pending registration by ID
 * @param string $registrationId Registration UUID
 * @return array|null Registration data or null
 */
function getPendingRegistration($registrationId) {
    $supabaseUrl = $GLOBALS['supabaseUrl'];
    $serviceKey = $GLOBALS['supabaseServiceKey'];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/pending_registrations?id=eq.$registrationId");
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
        error_log("Failed to get pending registration: $response");
        return null;
    }

    $data = json_decode($response, true);
    return isset($data[0]) ? $data[0] : null;
}

/**
 * Mark pending registration as completed
 * @param string $registrationId Registration UUID
 * @param string $stripeSessionId Stripe session ID
 * @return bool Success status
 */
function markRegistrationCompleted($registrationId, $stripeSessionId = null) {
    $supabaseUrl = $GLOBALS['supabaseUrl'];
    $serviceKey = $GLOBALS['supabaseServiceKey'];

    $updateData = [
        'status' => 'completed',
        'completed_at' => date('c')
    ];

    if ($stripeSessionId) {
        $updateData['stripe_session_id'] = $stripeSessionId;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/pending_registrations?id=eq.$registrationId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $serviceKey,
        'Authorization: Bearer ' . $serviceKey,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode === 200 || $httpCode === 204;
}

/**
 * Generate a magic link for auto-login
 * @param string $email User's email
 * @return string|null Magic link URL or null on failure
 */
function generateMagicLink($email) {
    $supabaseUrl = $GLOBALS['supabaseUrl'];
    $serviceKey = $GLOBALS['supabaseServiceKey'];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/auth/v1/admin/generate_link");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'type' => 'magiclink',
        'email' => $email,
        'options' => [
            'redirect_to' => 'https://enprico.com/dashboard.html'
        ]
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $serviceKey,
        'Authorization: Bearer ' . $serviceKey,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Failed to generate magic link: $response");
        return null;
    }

    $data = json_decode($response, true);
    return $data['action_link'] ?? null;
}

/**
 * Format PHP array to PostgreSQL array string
 * @param array|string $arr Array or already formatted string
 * @return string PostgreSQL array format
 */
function formatArrayForPostgres($arr) {
    if (is_string($arr)) {
        // Already formatted or from database
        return $arr;
    }
    if (!is_array($arr)) {
        return '{}';
    }
    return '{' . implode(',', array_map(function($item) {
        return '"' . str_replace('"', '\\"', $item) . '"';
    }, $arr)) . '}';
}

/**
 * Parse PostgreSQL array to PHP array
 * @param string $pgArray PostgreSQL array string
 * @return array PHP array
 */
function parsePostgresArray($pgArray) {
    if (empty($pgArray) || $pgArray === '{}') {
        return [];
    }
    // Remove curly braces and split
    $inner = trim($pgArray, '{}');
    if (empty($inner)) {
        return [];
    }
    // Handle quoted strings
    preg_match_all('/"([^"]+)"|([^,]+)/', $inner, $matches);
    $result = [];
    foreach ($matches[0] as $match) {
        $result[] = trim($match, '"');
    }
    return $result;
}
