<?php
/**
 * Complete Registration After Payment
 * Called from success page - creates user if webhook didn't
 * Also handles sending welcome email
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth/create-user-admin.php';

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

$GLOBALS['supabaseUrl'] = $supabaseUrl;
$GLOBALS['supabaseServiceKey'] = $supabaseServiceKey;

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || empty($data['sessionId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing session ID']);
    exit;
}

$sessionId = $data['sessionId'];

// Plan configurations
$plans = [
    'starter' => ['price' => 160, 'hours' => 8],
    'professional' => ['price' => 288, 'hours' => 16]
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
$isNewUser = ($metadata['is_new_user'] ?? 'false') === 'true';
$planType = $metadata['plan_type'] ?? 'starter';
$registrationId = $metadata['registration_id'] ?? null;
$existingUserId = $metadata['user_id'] ?? null;

$plan = $plans[$planType] ?? $plans['starter'];

// ============================================
// 2. Handle New User Flow
// ============================================
if ($isNewUser && $registrationId) {
    // Get pending registration
    $registration = getPendingRegistration($registrationId);

    if (!$registration) {
        http_response_code(400);
        echo json_encode(['error' => 'Registration not found']);
        exit;
    }

    // Check if registration already completed (user already exists)
    if ($registration['status'] === 'completed') {
        // User was already created by webhook - send email again as backup and return success
        $existingUser = getUserByEmailFromAuth($supabaseUrl, $supabaseServiceKey, $registration['email']);
        if ($existingUser) {
            // Re-generate password and send welcome email as backup
            $generatedPassword = generateUserPassword($registration['full_name'], $plan['hours']);
            sendWelcomeEmailDirect(
                $registration['email'],
                $registration['full_name'],
                $generatedPassword,
                $planType,
                $plan['hours']
            );
            sendAdminNotificationDirect(
                $registration['email'],
                $registration['full_name'],
                $planType,
                $plan['hours'],
                $sessionId,
                'NEW USER'
            );

            echo json_encode([
                'success' => true,
                'alreadyCompleted' => true,
                'userEmail' => $registration['email'],
                'fullName' => $registration['full_name'],
                'temporaryPassword' => $generatedPassword,
                'planType' => $planType,
                'hours' => $plan['hours'],
                'message' => 'Your account is ready. Check your email for login credentials.'
            ]);
            exit;
        }
    }

    // Check if user already exists in auth
    $existingUser = getUserByEmailFromAuth($supabaseUrl, $supabaseServiceKey, $registration['email']);

    if ($existingUser) {
        // User exists - mark registration complete
        markRegistrationCompleted($registrationId, $sessionId);

        // Create subscription if not exists
        createSubscriptionIfNeeded($supabaseUrl, $supabaseServiceKey, $existingUser['id'], $planType, $plan, $sessionId, $session);

        echo json_encode([
            'success' => true,
            'existingUser' => true,
            'userId' => $existingUser['id'],
            'userEmail' => $registration['email'],
            'fullName' => $registration['full_name'],
            'planType' => $planType,
            'hours' => $plan['hours'],
            'message' => 'Hours added to your account.'
        ]);
        exit;
    }

    // Create new user
    $generatedPassword = generateUserPassword($registration['full_name'], $plan['hours']);

    $user = createSupabaseUser(
        $registration['email'],
        $generatedPassword,
        $registration['full_name']
    );

    if (!$user || !isset($user['id'])) {
        error_log('Failed to create user for registration: ' . $registrationId);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user account. Please contact support.']);
        exit;
    }

    $userId = $user['id'];
    error_log("Created new user: $userId for email: " . $registration['email']);

    // Create profile
    createUserProfile($userId, [
        'email' => $registration['email'],
        'full_name' => $registration['full_name'],
        'phone' => $registration['phone'] ?? null,
        'english_level' => $registration['english_level'] ?? null,
        'learning_goals' => $registration['learning_goals'] ?? null,
        'goals_description' => $registration['goals_description'] ?? null,
        'preferred_days' => $registration['preferred_days'] ?? null,
        'preferred_times' => $registration['preferred_times'] ?? null,
        'timezone' => $registration['timezone'] ?? null
    ]);

    // Create subscription
    createSubscriptionIfNeeded($supabaseUrl, $supabaseServiceKey, $userId, $planType, $plan, $sessionId, $session);

    // Mark registration completed
    markRegistrationCompleted($registrationId, $sessionId);

    // Send welcome email to student
    $emailSent = sendWelcomeEmailDirect(
        $registration['email'],
        $registration['full_name'],
        $generatedPassword,
        $planType,
        $plan['hours']
    );

    // Send admin notification to learn@enprico.com
    sendAdminNotificationDirect(
        $registration['email'],
        $registration['full_name'],
        $planType,
        $plan['hours'],
        $sessionId,
        'NEW USER'
    );

    echo json_encode([
        'success' => true,
        'newUser' => true,
        'userId' => $userId,
        'userEmail' => $registration['email'],
        'fullName' => $registration['full_name'],
        'temporaryPassword' => $generatedPassword,
        'planType' => $planType,
        'hours' => $plan['hours'],
        'emailSent' => $emailSent,
        'message' => 'Account created successfully!'
    ]);
    exit;
}

// ============================================
// 3. Handle Existing User Flow
// ============================================
if ($existingUserId) {
    // Just create subscription
    createSubscriptionIfNeeded($supabaseUrl, $supabaseServiceKey, $existingUserId, $planType, $plan, $sessionId, $session);

    // Get user email for notifications
    $customerEmail = $session['customer_email'] ?? $session['customer_details']['email'] ?? '';

    // Send confirmation email to student
    if ($customerEmail) {
        sendHoursAddedEmail($customerEmail, $planType, $plan['hours']);
    }

    // Send admin notification to learn@enprico.com
    sendAdminNotificationDirect(
        $customerEmail,
        'Existing User',
        $planType,
        $plan['hours'],
        $sessionId,
        'EXISTING USER'
    );

    echo json_encode([
        'success' => true,
        'existingUser' => true,
        'userId' => $existingUserId,
        'planType' => $planType,
        'hours' => $plan['hours'],
        'message' => 'Hours added to your account.'
    ]);
    exit;
}

// Fallback - something unexpected
http_response_code(400);
echo json_encode(['error' => 'Invalid session metadata']);

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
        return null;
    }

    return json_decode($response, true);
}

function getUserByEmailFromAuth($supabaseUrl, $serviceKey, $email) {
    $email = strtolower(trim($email));

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/auth/v1/admin/users");
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

    if (!isset($data['users']) || !is_array($data['users'])) {
        return null;
    }

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

function generateUserPassword($fullName, $hours) {
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

    return $namePrefix . '_' . $hours . '_enprico';
}

function createSubscriptionIfNeeded($supabaseUrl, $serviceKey, $userId, $planType, $plan, $sessionId, $session) {
    // Check if subscription already exists for this session
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/subscriptions?stripe_session_id=eq." . urlencode($sessionId) . "&limit=1");
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
            // Subscription already exists
            return true;
        }
    }

    // Create subscription
    $endDate = date('c', strtotime('+1 month'));

    $subscriptionData = [
        'user_id' => $userId,
        'plan_type' => $planType,
        'price_usd' => $plan['price'],
        'hours_per_month' => $plan['hours'],
        'status' => 'active',
        'stripe_session_id' => $sessionId,
        'stripe_subscription_id' => $session['subscription'] ?? null,
        'stripe_customer_id' => $session['customer'] ?? null,
        'end_date' => $endDate
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/subscriptions");
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

    return $httpCode === 201;
}

function sendWelcomeEmailDirect($email, $fullName, $password, $planType, $hours) {
    // SMTP Configuration - same as send-email.php
    $smtp_host = 'smtp.hostinger.com';
    $smtp_port = 465;
    $smtp_user = 'learn@enprico.com';
    $smtp_pass = 'Mboukaiz42*@';

    $nameParts = explode(' ', trim($fullName));
    $firstName = ucfirst(strtolower($nameParts[0]));

    $planName = ucfirst($planType) . ' Package';
    if ($planType === 'starter') {
        $planName = 'Starter Package (2 hours/week)';
    } elseif ($planType === 'professional') {
        $planName = 'Professional Package (4 hours/week)';
    }

    $subject = "Welcome to Enprico - Your Account Details";

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
        .button { display: inline-block; background: #0076c7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1 style='margin:0; font-size: 28px;'>Welcome to Enprico!</h1>
        </div>
        <div class='content'>
            <p>Hello $firstName,</p>

            <p>Thank you for your payment and for choosing Enprico's <strong>$planName</strong>. We truly appreciate your trust.</p>

            <p>Our team will review your request and will be in touch within 5 business days with the next steps.</p>

            <div class='credentials'>
                <p style='margin-bottom: 15px; font-weight: bold; color: #333;'>Your Account Details:</p>
                <p><strong>Email:</strong> $email</p>
                <p><strong>Temporary Password:</strong> $password</p>
                <p><strong>Login:</strong> <a href='https://enprico.com/login.html' style='color: #0076c7;'>https://enprico.com/login.html</a></p>
            </div>

            <p><strong style='color: #dc2626;'>Important:</strong> For security reasons, we strongly recommend changing your password after your first login.</p>

            <p>If you need any further information or assistance, feel free to contact us at <a href='mailto:learn@enprico.com' style='color: #0076c7;'>learn@enprico.com</a>.</p>

            <p>Best regards,<br><strong>The Enprico Team</strong></p>
        </div>
        <div class='footer'>
            &copy; " . date('Y') . " Enprico - Learn French with Expert Tutors<br>
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

    error_log("Welcome email sent to: $to");
    return true;
}

function sendAdminNotificationDirect($customerEmail, $customerName, $planType, $hours, $sessionId, $userType = 'NEW USER') {
    $smtp_host = 'smtp.hostinger.com';
    $smtp_port = 465;
    $smtp_user = 'learn@enprico.com';
    $smtp_pass = 'Mboukaiz42*@';

    $planName = ucfirst($planType) . ' Package';
    if ($planType === 'starter') {
        $planName = 'Starter Package (2 hours/week)';
    } elseif ($planType === 'professional') {
        $planName = 'Professional Package (4 hours/week)';
    }

    $subject = "New Payment Received: $planName ($userType)";

    $body = "
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .info { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info p { margin: 8px 0; }
        .info strong { color: #0076c7; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1 style='margin:0; font-size: 24px;'>New Payment Received!</h1>
        </div>
        <div class='content'>
            <p>A student has just completed a payment.</p>
            <div class='info'>
                <p><strong>User Type:</strong> $userType</p>
                <p><strong>Student Name:</strong> " . htmlspecialchars($customerName) . "</p>
                <p><strong>Student Email:</strong> " . htmlspecialchars($customerEmail) . "</p>
                <p><strong>Plan:</strong> $planName</p>
                <p><strong>Hours:</strong> $hours hours/month</p>
                <p><strong>Session ID:</strong> $sessionId</p>
                <p><strong>Date:</strong> " . date('Y-m-d H:i:s') . "</p>
            </div>
        </div>
        <div class='footer'>
            &copy; " . date('Y') . " Enprico - Admin Notification
        </div>
    </div>
</body>
</html>";

    return sendSMTPEmail($smtp_host, $smtp_port, $smtp_user, $smtp_pass, 'learn@enprico.com', $subject, $body);
}

function sendHoursAddedEmail($email, $planType, $hours) {
    $smtp_host = 'smtp.hostinger.com';
    $smtp_port = 465;
    $smtp_user = 'learn@enprico.com';
    $smtp_pass = 'Mboukaiz42*@';

    $planName = ucfirst($planType) . ' Package';
    if ($planType === 'starter') {
        $planName = 'Starter Package (2 hours/week)';
    } elseif ($planType === 'professional') {
        $planName = 'Professional Package (4 hours/week)';
    }

    $subject = "Payment Confirmed - Hours Added to Your Account";

    $body = "
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .info { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info p { margin: 8px 0; }
        .info strong { color: #0076c7; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1 style='margin:0; font-size: 28px;'>Payment Confirmed!</h1>
        </div>
        <div class='content'>
            <p>Hello,</p>
            <p>Thank you for your payment! Your hours have been added to your account.</p>
            <div class='info'>
                <p><strong>Plan:</strong> $planName</p>
                <p><strong>Hours Added:</strong> $hours hours/month</p>
                <p><strong>Login:</strong> <a href='https://enprico.com/login.html' style='color: #0076c7;'>https://enprico.com/login.html</a></p>
            </div>
            <p>Our team will be in touch within 5 business days to schedule your sessions.</p>
            <p>If you have any questions, feel free to contact us at <a href='mailto:learn@enprico.com' style='color: #0076c7;'>learn@enprico.com</a>.</p>
            <p>Best regards,<br><strong>The Enprico Team</strong></p>
        </div>
        <div class='footer'>
            &copy; " . date('Y') . " Enprico - Learn French with Expert Tutors<br>
            <a href='https://enprico.com' style='color: #0076c7;'>www.enprico.com</a>
        </div>
    </div>
</body>
</html>";

    return sendSMTPEmail($smtp_host, $smtp_port, $smtp_user, $smtp_pass, $email, $subject, $body);
}
