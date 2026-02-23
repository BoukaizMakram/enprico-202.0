<?php
/**
 * Traffic Tracking API
 * Saves UTM visitor data to Supabase
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$supabaseUrl = SUPABASE_URL;
$supabaseKey = SUPABASE_SERVICE_KEY;

// Parse user agent for device/browser/os info
$userAgent = $data['user_agent'] ?? '';
$deviceType = 'desktop';
$browser = 'Unknown';
$os = 'Unknown';

// Detect device type
if (preg_match('/Mobile|Android|iPhone|iPad|iPod/i', $userAgent)) {
    if (preg_match('/iPad|Tablet/i', $userAgent)) {
        $deviceType = 'tablet';
    } else {
        $deviceType = 'mobile';
    }
}

// Detect browser
if (preg_match('/Chrome\/[\d.]+/i', $userAgent) && !preg_match('/Edg/i', $userAgent)) {
    $browser = 'Chrome';
} elseif (preg_match('/Firefox\/[\d.]+/i', $userAgent)) {
    $browser = 'Firefox';
} elseif (preg_match('/Safari\/[\d.]+/i', $userAgent) && !preg_match('/Chrome/i', $userAgent)) {
    $browser = 'Safari';
} elseif (preg_match('/Edg\/[\d.]+/i', $userAgent)) {
    $browser = 'Edge';
} elseif (preg_match('/MSIE|Trident/i', $userAgent)) {
    $browser = 'Internet Explorer';
}

// Detect OS
if (preg_match('/Windows NT/i', $userAgent)) {
    $os = 'Windows';
} elseif (preg_match('/Macintosh|Mac OS X/i', $userAgent)) {
    $os = 'macOS';
} elseif (preg_match('/Linux/i', $userAgent) && !preg_match('/Android/i', $userAgent)) {
    $os = 'Linux';
} elseif (preg_match('/Android/i', $userAgent)) {
    $os = 'Android';
} elseif (preg_match('/iPhone|iPad|iPod/i', $userAgent)) {
    $os = 'iOS';
}

// Build traffic record
$trafficData = [
    'utm_source' => $data['utm_source'] ?? null,
    'utm_medium' => $data['utm_medium'] ?? null,
    'utm_campaign' => $data['utm_campaign'] ?? null,
    'utm_term' => $data['utm_term'] ?? null,
    'utm_content' => $data['utm_content'] ?? null,
    'referrer' => $data['referrer'] ?? null,
    'landing_page' => $data['landing_page'] ?? null,
    'user_agent' => $userAgent,
    'screen_resolution' => $data['screen_resolution'] ?? null,
    'language' => $data['language'] ?? null,
    'timezone' => $data['timezone'] ?? null,
    'session_id' => $data['session_id'] ?? null,
    'device_type' => $deviceType,
    'browser' => $browser,
    'os' => $os,
    'visited_at' => date('c')
];

// Remove null values
$trafficData = array_filter($trafficData, function($value) {
    return $value !== null;
});

// Save to Supabase
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/traffic');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($trafficData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'apikey: ' . $supabaseKey,
    'Authorization: Bearer ' . $supabaseKey,
    'Prefer: return=minimal'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    error_log('Traffic tracking curl error: ' . $curlError);
    echo json_encode(['success' => false, 'message' => 'Connection error']);
    exit;
}

if ($httpCode === 201 || $httpCode === 200) {
    echo json_encode(['success' => true]);
} else {
    error_log('Traffic tracking error: HTTP ' . $httpCode . ' - ' . $response);
    echo json_encode(['success' => false, 'message' => 'Failed to save']);
}
?>
