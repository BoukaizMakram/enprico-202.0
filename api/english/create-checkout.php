<?php
/**
 * English Tutoring - Stripe Checkout Session Creation
 * Creates a new Stripe Checkout session for English tutoring payment
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

// English Plan configurations with Stripe Price IDs (USD)
$planPrices = [
    'flexible' => [
        'priceId' => STRIPE_ENGLISH_FLEXIBLE,
        'amount' => 16000,  // $160.00 USD in cents
        'name' => 'Flexible Plan - 2 Hours/Week',
        'description' => '8 hours of 1-on-1 English tutoring per month (2 hours/week)'
    ],
    'standard' => [
        'priceId' => STRIPE_ENGLISH_STANDARD,
        'amount' => 30000,  // $300.00 USD in cents
        'name' => 'Standard Plan - 4 Hours/Week',
        'description' => '16 hours of 1-on-1 English tutoring per month (4 hours/week)'
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
$registrationId = $data['registrationId'] ?? null;
$isNewUser = ($data['isNewUser'] ?? true) === true;

// Set URLs
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'enprico.com');
$successUrl = $data['successUrl'] ?? $baseUrl . '/english-success.html?session_id={CHECKOUT_SESSION_ID}';
$cancelUrl = $data['cancelUrl'] ?? $baseUrl . '/english.html#pricing';

if (!$planType || !$userEmail) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: planType, userEmail']);
    exit;
}

if ($isNewUser && !$registrationId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing registrationId for new user']);
    exit;
}

// Validate plan type
if (!isset($planPrices[$planType])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid plan type. Must be "flexible" or "standard"']);
    exit;
}

$plan = $planPrices[$planType];

// Build metadata for webhook
$metadata = [
    'plan_type' => $planType,
    'service_type' => 'english',
    'is_new_user' => $isNewUser ? 'true' : 'false',
    'registration_id' => $registrationId
];

// Build the request body for Stripe API
$postFields = [
    'payment_method_types[0]' => 'card',
    'mode' => 'payment',
    'customer_email' => $userEmail,
    'line_items[0][price_data][currency]' => 'usd',
    'line_items[0][price_data][product_data][name]' => $plan['name'] . ' - Enprico English Tutoring',
    'line_items[0][price_data][product_data][description]' => $plan['description'],
    'line_items[0][price_data][unit_amount]' => $plan['amount'],
    'line_items[0][quantity]' => 1,
    'success_url' => $successUrl,
    'cancel_url' => $cancelUrl,
    'allow_promotion_codes' => 'true'
];

// Add metadata
foreach ($metadata as $key => $value) {
    if ($value !== null) {
        $postFields["metadata[$key]"] = $value;
    }
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
    error_log('Stripe error (English): ' . json_encode($responseData));
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
