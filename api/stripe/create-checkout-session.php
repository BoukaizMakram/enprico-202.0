<?php
/**
 * Stripe Checkout Session Creation Endpoint
 * Creates a new Stripe Checkout session for payment
 *
 * Supports two flows:
 * 1. New user: registrationId + userEmail + planType
 * 2. Existing user: userId + userEmail + planType
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

// Plan configurations with Stripe Price IDs
$planPrices = [
    'starter' => [
        'priceId' => STRIPE_PRICE_STARTER,
        'amount' => 16000  // $160.00 in cents (fallback for ad-hoc pricing)
    ],
    'professional' => [
        'priceId' => STRIPE_PRICE_PROFESSIONAL,
        'amount' => 28800  // $288.00 in cents (fallback for ad-hoc pricing)
    ]
];

// Get request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body']);
    exit;
}

// Validate required fields
$planType = $data['planType'] ?? null;
$userEmail = $data['userEmail'] ?? null;
$successUrl = $data['successUrl'] ?? null;
$cancelUrl = $data['cancelUrl'] ?? null;
$isNewUser = ($data['isNewUser'] ?? false) === true;

// For new users, we need registrationId; for existing users, we need userId
$registrationId = $data['registrationId'] ?? null;
$userId = $data['userId'] ?? null;

if (!$planType || !$userEmail || !$successUrl || !$cancelUrl) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: planType, userEmail, successUrl, cancelUrl']);
    exit;
}

if ($isNewUser && !$registrationId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing registrationId for new user']);
    exit;
}

if (!$isNewUser && !$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing userId for existing user']);
    exit;
}

// Validate plan type
if (!isset($planPrices[$planType])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid plan type']);
    exit;
}

$plan = $planPrices[$planType];

// Build metadata for webhook
$metadata = [
    'plan_type' => $planType,
    'is_new_user' => $isNewUser ? 'true' : 'false'
];

if ($isNewUser) {
    $metadata['registration_id'] = $registrationId;
} else {
    $metadata['user_id'] = $userId;
}

// Build the request body for Stripe API
// Using one-time payment mode with ad-hoc pricing (price_data)
// This avoids needing to create Price objects in Stripe Dashboard
$postFields = [
    'payment_method_types[0]' => 'card',
    'mode' => 'payment',
    'customer_email' => $userEmail,
    'line_items[0][price_data][currency]' => 'usd',
    'line_items[0][price_data][product_data][name]' => ucfirst($planType) . ' Plan - Enprico French Tutoring',
    'line_items[0][price_data][product_data][description]' => $planType === 'starter'
        ? '8 hours of 1-on-1 French tutoring for TEF/TCF (2 hours/week)'
        : '16 hours of 1-on-1 French tutoring for TEF/TCF (4 hours/week)',
    'line_items[0][price_data][unit_amount]' => $plan['amount'],
    'line_items[0][quantity]' => 1,
    'success_url' => $successUrl,
    'cancel_url' => $cancelUrl
];

// Add metadata
foreach ($metadata as $key => $value) {
    $postFields["metadata[$key]"] = $value;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/checkout/sessions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $stripeSecretKey,
    'Content-Type: application/x-www-form-urlencoded'
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

$responseData = json_decode($response, true);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    error_log('Stripe error: ' . json_encode($responseData));
    echo json_encode([
        'error' => $responseData['error']['message'] ?? 'Failed to create checkout session'
    ]);
    exit;
}

// Return the session ID and URL
echo json_encode([
    'sessionId' => $responseData['id'],
    'url' => $responseData['url']
]);
