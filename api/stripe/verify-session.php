<?php
/**
 * Stripe Session Verification Endpoint
 * Verifies a completed checkout session
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
validateConfig(['STRIPE_SECRET_KEY']);

$stripeSecretKey = STRIPE_SECRET_KEY;

// Get request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || empty($data['sessionId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing session ID']);
    exit;
}

$sessionId = $data['sessionId'];

// Retrieve the session from Stripe
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/checkout/sessions/' . urlencode($sessionId) . '?expand[]=payment_intent');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $stripeSecretKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to connect to Stripe: ' . $curlError]);
    exit;
}

$session = json_decode($response, true);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'error' => $session['error']['message'] ?? 'Failed to retrieve session'
    ]);
    exit;
}

// Check if payment was successful
if ($session['payment_status'] !== 'paid') {
    http_response_code(400);
    echo json_encode([
        'error' => 'Payment not completed',
        'status' => $session['payment_status']
    ]);
    exit;
}

// Return session details
echo json_encode([
    'success' => true,
    'sessionId' => $session['id'],
    'paymentStatus' => $session['payment_status'],
    'amountTotal' => $session['amount_total'] / 100, // Convert from cents
    'currency' => $session['currency'],
    'customerEmail' => $session['customer_email'],
    'metadata' => $session['metadata'],
    'paymentIntentId' => $session['payment_intent']['id'] ?? $session['payment_intent']
]);
