<?php
/**
 * English Tutoring - Complete Registration After Payment
 * Called from english-success page - creates student record after payment verification
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
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

validateConfig(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'STRIPE_SECRET_KEY']);

$supabaseUrl = SUPABASE_URL;
$supabaseServiceKey = SUPABASE_SERVICE_KEY;
$stripeSecretKey = STRIPE_SECRET_KEY;

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || empty($data['sessionId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing session ID']);
    exit;
}

$sessionId = $data['sessionId'];

// English Plan configurations (USD)
$plans = [
    'flexible' => ['price' => 160, 'hours' => 8],
    'standard' => ['price' => 300, 'hours' => 16]
];

// ============================================
// 1. Verify Stripe Session
// ============================================
$session = getStripeSession($stripeSecretKey, $sessionId);

if (!$session || $session['payment_status'] !== 'paid') {
    http_response_code(400);
    echo json_encode(['error' => 'Payment not verified']);
    exit;
}

$metadata = $session['metadata'] ?? [];
$isNewUser = ($metadata['is_new_user'] ?? 'true') === 'true';
$planType = $metadata['plan_type'] ?? 'flexible';
$registrationId = $metadata['registration_id'] ?? null;
$serviceType = $metadata['service_type'] ?? 'english';

// Verify this is an English payment
if ($serviceType !== 'english') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid service type for this endpoint']);
    exit;
}

$plan = $plans[$planType] ?? $plans['flexible'];

// ============================================
// 2. Handle Registration
// ============================================
if (!$registrationId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing registration ID']);
    exit;
}

// Get pending registration
$registration = getEnglishPendingRegistration($supabaseUrl, $supabaseServiceKey, $registrationId);

if (!$registration) {
    http_response_code(400);
    echo json_encode(['error' => 'Registration not found']);
    exit;
}

// Check if already completed
if ($registration['status'] === 'completed') {
    // Already processed - return success
    echo json_encode([
        'success' => true,
        'alreadyCompleted' => true,
        'userEmail' => $registration['email'],
        'fullName' => $registration['full_name'],
        'planType' => $planType,
        'hours' => $plan['hours'],
        'message' => 'Your registration was already completed.'
    ]);
    exit;
}

// Check if student already exists
$existingStudent = getEnglishStudentByEmail($supabaseUrl, $supabaseServiceKey, $registration['email']);

if ($existingStudent) {
    // Student exists - update registration status and create subscription
    markEnglishRegistrationCompleted($supabaseUrl, $supabaseServiceKey, $registrationId, $sessionId);
    createEnglishSubscription($supabaseUrl, $supabaseServiceKey, $existingStudent['id'], $planType, $plan, $sessionId, $session);

    echo json_encode([
        'success' => true,
        'existingUser' => true,
        'userEmail' => $registration['email'],
        'fullName' => $registration['full_name'],
        'planType' => $planType,
        'hours' => $plan['hours'],
        'message' => 'Subscription added to your account.'
    ]);
    exit;
}

// Create new student record
$generatedPassword = generateEnglishPassword($registration['full_name'], $plan['hours']);

$studentData = [
    'email' => strtolower(trim($registration['email'])),
    'full_name' => $registration['full_name'],
    'phone' => $registration['phone'] ?? null,
    'english_level' => $registration['english_level'] ?? 'intermediate',
    'learning_goals' => $registration['learning_goals'] ?? null,
    'status' => 'active'
];

$student = createEnglishStudent($supabaseUrl, $supabaseServiceKey, $studentData);

if (!$student) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create student record. Please contact support.']);
    exit;
}

$studentId = $student['id'];
error_log("Created new English student: $studentId for email: " . $registration['email']);

// Create subscription
createEnglishSubscription($supabaseUrl, $supabaseServiceKey, $studentId, $planType, $plan, $sessionId, $session);

// Mark registration completed
markEnglishRegistrationCompleted($supabaseUrl, $supabaseServiceKey, $registrationId, $sessionId);

// Send welcome email
$emailSent = sendEnglishWelcomeEmail(
    $registration['email'],
    $registration['full_name'],
    $generatedPassword,
    $planType,
    $plan['hours']
);

echo json_encode([
    'success' => true,
    'newUser' => true,
    'studentId' => $studentId,
    'userEmail' => $registration['email'],
    'fullName' => $registration['full_name'],
    'temporaryPassword' => $generatedPassword,
    'planType' => $planType,
    'hours' => $plan['hours'],
    'emailSent' => $emailSent,
    'message' => 'Account created successfully!'
]);

// ============================================
// Helper Functions
// ============================================

function getStripeSession($secretKey, $sessionId) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/checkout/sessions/' . urlencode($sessionId));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $secretKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Stripe session fetch failed (HTTP $httpCode): $response");
        return null;
    }

    return json_decode($response, true);
}

function getEnglishPendingRegistration($supabaseUrl, $serviceKey, $registrationId) {
    $ch = curl_init();
    $url = "$supabaseUrl/rest/v1/english_registrations?id=eq." . urlencode($registrationId) . "&limit=1";
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
        error_log("Failed to fetch English registration (HTTP $httpCode): $response");
        return null;
    }

    $data = json_decode($response, true);
    return isset($data[0]) ? $data[0] : null;
}

function getEnglishStudentByEmail($supabaseUrl, $serviceKey, $email) {
    $email = strtolower(trim($email));

    $ch = curl_init();
    $url = "$supabaseUrl/rest/v1/english_students?email=eq." . urlencode($email) . "&limit=1";
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

function createEnglishStudent($supabaseUrl, $serviceKey, $data) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/english_students");
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
        error_log("Failed to create English student (HTTP $httpCode): $response");
        return null;
    }

    $result = json_decode($response, true);
    return isset($result[0]) ? $result[0] : null;
}

function createEnglishSubscription($supabaseUrl, $serviceKey, $studentId, $planType, $plan, $sessionId, $session) {
    // Check if subscription already exists for this session
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/english_subscriptions?stripe_subscription_id=eq." . urlencode($sessionId) . "&limit=1");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $serviceKey,
        'Authorization: Bearer ' . $serviceKey,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $existing = json_decode($response, true);
        if (!empty($existing)) {
            return true; // Already exists
        }
    }

    // Create subscription
    $endDate = date('c', strtotime('+1 month'));

    $subscriptionData = [
        'student_id' => $studentId,
        'plan_type' => $planType,
        'status' => 'active',
        'stripe_subscription_id' => $sessionId,
        'stripe_customer_id' => $session['customer'] ?? null,
        'current_period_start' => date('c'),
        'current_period_end' => $endDate,
        'hours_remaining' => $plan['hours'],
        'hours_total' => $plan['hours'],
        'amount_paid' => $plan['price'] * 100, // Store in cents
        'currency' => 'usd'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/english_subscriptions");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($subscriptionData));
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
        error_log("Failed to create English subscription (HTTP $httpCode): $response");
        return false;
    }

    return true;
}

function markEnglishRegistrationCompleted($supabaseUrl, $serviceKey, $registrationId, $sessionId) {
    $updateData = [
        'status' => 'completed',
        'stripe_session_id' => $sessionId,
        'updated_at' => date('c')
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/english_registrations?id=eq.$registrationId");
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

    if ($httpCode !== 200 && $httpCode !== 204) {
        error_log("Failed to mark English registration completed (HTTP $httpCode): $response");
        return false;
    }

    return true;
}

function generateEnglishPassword($fullName, $hours) {
    $fullName = trim(strtolower($fullName));
    $nameParts = preg_split('/\s+/', $fullName);

    if (count($nameParts) >= 2) {
        $firstName = $nameParts[0];
        $lastName = end($nameParts);
        $namePrefix = substr($firstName, 0, 1) . $lastName;
    } else {
        $namePrefix = $nameParts[0];
    }

    $namePrefix = preg_replace('/[^a-z]/', '', $namePrefix);

    return $namePrefix . '_' . $hours . '_english';
}

function sendEnglishWelcomeEmail($email, $fullName, $password, $planType, $hours) {
    // SMTP Configuration
    $smtp_host = 'smtp.hostinger.com';
    $smtp_port = 465;
    $smtp_user = 'learn@enprico.com';
    $smtp_pass = 'Mboukaiz42*@';

    $nameParts = explode(' ', trim($fullName));
    $firstName = ucfirst(strtolower($nameParts[0]));

    $planName = $planType === 'flexible'
        ? 'Flexible Plan (2 hours/week)'
        : 'Standard Plan (4 hours/week)';

    $subject = "Welcome to Enprico English Tutoring - Your Account Details";

    $body = "
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .credentials { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credentials p { margin: 8px 0; }
        .credentials strong { color: #0076c7; }
        .next-steps { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .next-steps h3 { color: #166534; margin-top: 0; }
        .next-steps ul { color: #166534; margin-bottom: 0; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1 style='margin:0; font-size: 28px;'>Welcome to Enprico English Tutoring!</h1>
        </div>
        <div class='content'>
            <p>Hello $firstName,</p>

            <p>Thank you for your payment and for choosing Enprico's <strong>$planName</strong> for English tutoring. We truly appreciate your trust.</p>

            <div class='credentials'>
                <p style='margin-bottom: 15px; font-weight: bold; color: #333;'>Your Account Details:</p>
                <p><strong>Email:</strong> $email</p>
                <p><strong>Temporary Password:</strong> $password</p>
            </div>

            <div class='next-steps'>
                <h3>What Happens Next?</h3>
                <ul>
                    <li>Our team will review your application within 24-48 hours</li>
                    <li>You'll receive an email with your tutor assignment</li>
                    <li>Schedule your first session at your convenience</li>
                </ul>
            </div>

            <p>If you need any assistance, feel free to contact us at <a href='mailto:learn@enprico.com' style='color: #0076c7;'>learn@enprico.com</a>.</p>

            <p>Best regards,<br><strong>The Enprico Team</strong></p>
        </div>
        <div class='footer'>
            &copy; " . date('Y') . " Enprico - Expert English Tutoring<br>
            <a href='https://enprico.com' style='color: #0076c7;'>www.enprico.com</a>
        </div>
    </div>
</body>
</html>";

    return sendSMTPEmail($smtp_host, $smtp_port, $smtp_user, $smtp_pass, $email, $subject, $body);
}

function sendSMTPEmail($host, $port, $user, $pass, $to, $subject, $body) {
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Enprico <{$user}>\r\n";
    $headers .= "Reply-To: Enprico <{$user}>\r\n";

    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client(
        "ssl://{$host}:{$port}",
        $errno,
        $errstr,
        30,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$socket) {
        error_log("SMTP connection failed: $errstr ($errno)");
        return false;
    }

    $response = fgets($socket, 515);

    fputs($socket, "EHLO enprico.com\r\n");
    while ($line = fgets($socket, 515)) {
        if (substr($line, 3, 1) == ' ') break;
    }

    fputs($socket, "AUTH LOGIN\r\n");
    fgets($socket, 515);

    fputs($socket, base64_encode($user) . "\r\n");
    fgets($socket, 515);

    fputs($socket, base64_encode($pass) . "\r\n");
    $auth_response = fgets($socket, 515);

    if (substr($auth_response, 0, 3) != '235') {
        error_log("SMTP auth failed: $auth_response");
        fclose($socket);
        return false;
    }

    fputs($socket, "MAIL FROM:<{$user}>\r\n");
    fgets($socket, 515);

    fputs($socket, "RCPT TO:<{$to}>\r\n");
    fgets($socket, 515);

    fputs($socket, "DATA\r\n");
    fgets($socket, 515);

    $msg = "To: {$to}\r\n";
    $msg .= "Subject: {$subject}\r\n";
    $msg .= $headers;
    $msg .= "\r\n";
    $msg .= $body;
    $msg .= "\r\n.\r\n";

    fputs($socket, $msg);
    fgets($socket, 515);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    error_log("English welcome email sent to: $to");
    return true;
}
