<?php
/**
 * Stripe Webhook Handler
 * Handles Stripe webhook events for payment processing
 *
 * Endpoint URL: https://enprico.com/api/stripe/webhook.php
 */

require_once __DIR__ . '/../config.php';

// Include the admin user creation helpers
require_once __DIR__ . '/../auth/create-user-admin.php';

// Get config values
$stripeSecretKey = STRIPE_SECRET_KEY;
$webhookSecret = STRIPE_WEBHOOK_SECRET;
$supabaseUrl = SUPABASE_URL;
$supabaseServiceKey = SUPABASE_SERVICE_KEY;

// Set globals for admin functions
$GLOBALS['supabaseUrl'] = $supabaseUrl;
$GLOBALS['supabaseServiceKey'] = $supabaseServiceKey;

// Plan configurations
$plans = [
    'starter' => ['price' => 160, 'hours' => 8],
    'professional' => ['price' => 288, 'hours' => 16]
];

// Get the payload
$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Verify webhook signature
function verifyWebhookSignature($payload, $sigHeader, $secret) {
    $elements = explode(',', $sigHeader);
    $timestamp = null;
    $signatures = [];

    foreach ($elements as $element) {
        $parts = explode('=', $element, 2);
        if (count($parts) === 2) {
            if ($parts[0] === 't') {
                $timestamp = $parts[1];
            } elseif ($parts[0] === 'v1') {
                $signatures[] = $parts[1];
            }
        }
    }

    if (!$timestamp || empty($signatures)) {
        return false;
    }

    // Check timestamp tolerance (5 minutes)
    if (abs(time() - intval($timestamp)) > 300) {
        return false;
    }

    $signedPayload = $timestamp . '.' . $payload;
    $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);

    foreach ($signatures as $sig) {
        if (hash_equals($expectedSignature, $sig)) {
            return true;
        }
    }

    return false;
}

// Verify the webhook signature
if (!verifyWebhookSignature($payload, $sigHeader, $webhookSecret)) {
    http_response_code(400);
    error_log('Stripe webhook signature verification failed');
    exit('Invalid signature');
}

$event = json_decode($payload, true);

if (!$event) {
    http_response_code(400);
    exit('Invalid payload');
}

// Log the event type
error_log('Stripe webhook received: ' . $event['type']);

// Handle the event
switch ($event['type']) {
    case 'checkout.session.completed':
        handleCheckoutSessionCompleted($event['data']['object']);
        break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
        handleSubscriptionUpdate($event['data']['object']);
        break;

    case 'invoice.paid':
        handleInvoicePaid($event['data']['object']);
        break;

    case 'invoice.payment_failed':
        handleInvoicePaymentFailed($event['data']['object']);
        break;

    case 'customer.subscription.deleted':
        handleSubscriptionCancelled($event['data']['object']);
        break;

    default:
        error_log('Unhandled event type: ' . $event['type']);
}

http_response_code(200);
echo json_encode(['received' => true]);

/**
 * Handle successful checkout session (for subscriptions)
 */
function handleCheckoutSessionCompleted($session) {
    global $supabaseUrl, $supabaseServiceKey, $plans;

    // Get metadata from session
    $metadata = $session['metadata'] ?? [];
    $isNewUser = ($metadata['is_new_user'] ?? 'false') === 'true';
    $planType = $metadata['plan_type'] ?? null;
    $customerEmail = $session['customer_email'] ?? '';
    $amountTotal = ($session['amount_total'] ?? 0) / 100;
    $sessionId = $session['id'] ?? '';
    $stripeSubscriptionId = $session['subscription'] ?? '';
    $stripeCustomerId = $session['customer'] ?? '';

    $plan = $plans[$planType] ?? null;
    if (!$plan) {
        error_log('Invalid plan type: ' . $planType);
        return;
    }

    // ============================================
    // NEW USER FLOW: Create account after payment
    // ============================================
    if ($isNewUser) {
        $registrationId = $metadata['registration_id'] ?? null;

        if (!$registrationId) {
            error_log('New user payment but missing registration_id');
            return;
        }

        // Fetch pending registration
        $registration = getPendingRegistration($registrationId);

        if (!$registration) {
            error_log('Pending registration not found: ' . $registrationId);
            return;
        }

        // Check if registration was already completed (idempotency)
        if ($registration['status'] === 'completed') {
            error_log('Registration already completed: ' . $registrationId);
            return;
        }

        // Generate password: first letter of first name + last name + "_" + hours + "_enprico"
        // Example: "makram boukaiz" + 4 hours = "mboukaiz_4_enprico"
        $generatedPassword = generateUserPassword($registration['full_name'], $plan['hours']);

        $user = createSupabaseUser(
            $registration['email'],
            $generatedPassword,
            $registration['full_name']
        );

        if (!$user || !isset($user['id'])) {
            error_log('Failed to create user for registration: ' . $registrationId);
            return;
        }

        $userId = $user['id'];
        error_log("Created new user: $userId for email: " . $registration['email']);

        // Create profile with all registration data
        $profileCreated = createUserProfile($userId, [
            'email' => $registration['email'],
            'full_name' => $registration['full_name'],
            'phone' => $registration['phone'],
            'french_level' => $registration['french_level'],
            'learning_goals' => $registration['learning_goals'],
            'goals_description' => $registration['goals_description'],
            'preferred_days' => $registration['preferred_days'],
            'preferred_times' => $registration['preferred_times'],
            'timezone' => $registration['timezone']
        ]);

        if (!$profileCreated) {
            error_log('Failed to create profile for user: ' . $userId);
        }

        // Mark registration as completed
        markRegistrationCompleted($registrationId, $sessionId);

        // Send welcome email with login credentials
        sendWelcomeEmail(
            $registration['email'],
            $registration['full_name'],
            $generatedPassword,
            $planType,
            $plan['hours']
        );
        // Note: This is passed via success URL parameter

        error_log("New user registration completed: $userId, email: " . $registration['email']);
    }
    // ============================================
    // EXISTING USER FLOW: Add hours to account
    // ============================================
    else {
        $userId = $metadata['user_id'] ?? null;

        if (!$userId) {
            error_log('Missing user_id in session metadata for existing user');
            return;
        }
    }

    // Calculate end date (1 month from now)
    $endDate = date('c', strtotime('+1 month'));

    // Create subscription in Supabase
    $subscriptionData = [
        'user_id' => $userId,
        'plan_type' => $planType,
        'price_usd' => $plan['price'],
        'hours_per_month' => $plan['hours'],
        'status' => 'active',
        'stripe_session_id' => $sessionId,
        'stripe_subscription_id' => $stripeSubscriptionId,
        'stripe_customer_id' => $stripeCustomerId,
        'end_date' => $endDate
    ];

    $subscriptionResult = supabaseRequest('POST', '/rest/v1/subscriptions', $subscriptionData);

    if (!$subscriptionResult || isset($subscriptionResult['error'])) {
        error_log('Failed to create subscription: ' . json_encode($subscriptionResult));
        return;
    }

    // Get the created subscription ID
    $subscriptionId = $subscriptionResult[0]['id'] ?? null;

    // Record the initial payment
    $paymentData = [
        'user_id' => $userId,
        'subscription_id' => $subscriptionId,
        'amount_usd' => $amountTotal,
        'status' => 'completed',
        'stripe_session_id' => $sessionId,
        'paid_at' => date('c')
    ];

    $paymentResult = supabaseRequest('POST', '/rest/v1/payments', $paymentData);

    if (!$paymentResult || isset($paymentResult['error'])) {
        error_log('Failed to record payment: ' . json_encode($paymentResult));
    }

    // Send admin notification email
    $userType = $isNewUser ? 'NEW USER' : 'EXISTING USER';
    sendAdminNotification($customerEmail, $planType, $amountTotal, $plan['hours'], $stripeSubscriptionId, $userType);

    error_log("Successfully processed subscription for user $userId, plan $planType (isNewUser: $isNewUser)");
}

/**
 * Handle subscription updates (renewal, plan change, etc.)
 */
function handleSubscriptionUpdate($subscription) {
    $stripeSubscriptionId = $subscription['id'] ?? '';
    $status = $subscription['status'] ?? '';

    error_log("Subscription updated: $stripeSubscriptionId, status: $status");
}

/**
 * Handle successful invoice payment (recurring payments)
 */
function handleInvoicePaid($invoice) {
    global $supabaseUrl, $supabaseServiceKey, $plans;

    $stripeSubscriptionId = $invoice['subscription'] ?? '';
    $amountPaid = ($invoice['amount_paid'] ?? 0) / 100;
    $customerEmail = $invoice['customer_email'] ?? '';
    $invoiceId = $invoice['id'] ?? '';

    // Skip if this is the first invoice (handled by checkout.session.completed)
    if ($invoice['billing_reason'] === 'subscription_create') {
        error_log("Skipping initial invoice - handled by checkout session");
        return;
    }

    error_log("Invoice paid: $invoiceId, amount: $amountPaid, subscription: $stripeSubscriptionId");

    // For recurring payments, we need to find the user by their Stripe subscription ID
    // and add more hours to their account

    // TODO: Implement recurring payment handling
    // 1. Look up user by stripe_subscription_id
    // 2. Add hours to their account
    // 3. Record the payment
}

/**
 * Handle failed invoice payment
 */
function handleInvoicePaymentFailed($invoice) {
    $customerEmail = $invoice['customer_email'] ?? '';
    $stripeSubscriptionId = $invoice['subscription'] ?? '';

    error_log("Invoice payment failed for $customerEmail, subscription: $stripeSubscriptionId");

    // TODO: Send email notification to user about failed payment
}

/**
 * Handle subscription cancellation
 */
function handleSubscriptionCancelled($subscription) {
    global $supabaseUrl, $supabaseServiceKey;

    $stripeSubscriptionId = $subscription['id'] ?? '';

    error_log("Subscription cancelled: $stripeSubscriptionId");

    // Update subscription status in Supabase
    // Note: This requires a PATCH request to update by stripe_subscription_id
}

/**
 * Make a request to Supabase
 */
function supabaseRequest($method, $endpoint, $data = null) {
    global $supabaseUrl, $supabaseServiceKey;

    $ch = curl_init();
    $url = $supabaseUrl . $endpoint;

    $headers = [
        'apikey: ' . $supabaseServiceKey,
        'Authorization: Bearer ' . $supabaseServiceKey,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ];

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        return json_decode($response, true);
    }

    error_log("Supabase request failed ($httpCode): $response");
    return ['error' => $response];
}

/**
 * Send admin notification email
 */
function sendAdminNotification($customerEmail, $planType, $amount, $hours, $transactionId, $userType = 'EXISTING USER') {
    $smtp_host = 'smtp.hostinger.com';
    $smtp_port = 465;
    $smtp_user = 'learn@enprico.com';
    $smtp_pass = 'Mboukaiz42*@';

    $planName = ucfirst($planType) . ' Package';
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
                <p><strong>Student Email:</strong> " . htmlspecialchars($customerEmail) . "</p>
                <p><strong>Plan:</strong> $planName</p>
                <p><strong>Amount:</strong> \$$amount</p>
                <p><strong>Hours:</strong> $hours hours/month</p>
                <p><strong>Transaction ID:</strong> $transactionId</p>
                <p><strong>Date:</strong> " . date('Y-m-d H:i:s') . "</p>
            </div>
        </div>
        <div class='footer'>
            &copy; " . date('Y') . " Enprico - Admin Notification
        </div>
    </div>
</body>
</html>";

    return sendDirectSMTP($smtp_host, $smtp_port, $smtp_user, $smtp_pass, 'learn@enprico.com', $subject, $body);
}

/**
 * Generate user password from name and plan hours
 * Formula: first letter of first name + last name + "_" + hours + "_enprico"
 * Example: "makram boukaiz" + 4 hours = "mboukaiz_4_enprico"
 */
function generateUserPassword($fullName, $hours) {
    // Clean and split the name
    $fullName = trim(strtolower($fullName));
    $nameParts = preg_split('/\s+/', $fullName);

    if (count($nameParts) >= 2) {
        // First letter of first name + last name
        $firstName = $nameParts[0];
        $lastName = end($nameParts);
        $namePrefix = substr($firstName, 0, 1) . $lastName;
    } else {
        // Just use the full name if single word
        $namePrefix = $nameParts[0];
    }

    // Remove any special characters from name prefix
    $namePrefix = preg_replace('/[^a-z]/', '', $namePrefix);

    // Build password: namePrefix_hours_enprico
    $password = $namePrefix . '_' . $hours . '_enprico';

    return $password;
}

/**
 * Send welcome email with login credentials
 */
function sendWelcomeEmail($email, $fullName, $password, $planType, $hours) {
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

    return sendDirectSMTP($smtp_host, $smtp_port, $smtp_user, $smtp_pass, $email, $subject, $body);
}

function sendDirectSMTP($host, $port, $user, $pass, $to, $subject, $body) {
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
