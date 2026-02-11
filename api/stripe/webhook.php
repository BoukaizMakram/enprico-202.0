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
            'english_level' => $registration['english_level'],
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
    $adminEmail = 'learn@enprico.com';
    $subject = "New Stripe Payment: $planType plan ($userType)";

    $message = "A payment was received via Stripe!\n\n";
    $message .= "User Type: $userType\n";
    $message .= "Customer Email: $customerEmail\n";
    $message .= "Plan: " . ucfirst($planType) . "\n";
    $message .= "Amount: \$$amount\n";
    $message .= "Hours: $hours\n";
    $message .= "Transaction ID: $transactionId\n";
    $message .= "Time: " . date('Y-m-d H:i:s') . "\n";

    // Try to send via the existing send-email.php mechanism
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://enprico.com/send-email.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'name' => 'Enprico System',
        'email' => 'noreply@enprico.com',
        'subject' => $subject,
        'message' => $message
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    curl_exec($ch);
    curl_close($ch);
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
    // Get first name for greeting
    $nameParts = explode(' ', trim($fullName));
    $firstName = ucfirst(strtolower($nameParts[0]));

    // Plan name
    $planName = ucfirst($planType) . ' Package';
    if ($planType === 'starter') {
        $planName = 'Starter Package (2 hours/week)';
    } elseif ($planType === 'professional') {
        $planName = 'Professional Package (4 hours/week)';
    }

    $subject = "Welcome to Enprico - Your Account Details";

    $message = "Hello $firstName,\n\n";
    $message .= "Thank you for your payment and for choosing Enprico's $planName for French tutoring and TEF/TCF exam preparation. We truly appreciate your trust.\n\n";
    $message .= "Our team will review your request and will be in touch within 5 business days with the next steps to start your French learning journey.\n\n";
    $message .= "Your account details:\n\n";
    $message .= "Email: $email\n";
    $message .= "Temporary password: $password\n";
    $message .= "Login: https://enprico.com/login.html\n\n";
    $message .= "For security reasons, we strongly recommend changing your password after your first login.\n\n";
    $message .= "If you need any further information or assistance, feel free to contact us at learn@enprico.com.\n\n";
    $message .= "Best regards,\n";
    $message .= "The Enprico Team";

    // Send email to user
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://enprico.com/send-email.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'name' => 'Enprico',
        'email' => 'learn@enprico.com',
        'to' => $email,
        'subject' => $subject,
        'message' => $message
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    $success = curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
    curl_close($ch);

    if ($success) {
        error_log("Welcome email sent to: $email");
    } else {
        error_log("Failed to send welcome email to: $email - Response: $response");
    }

    return $success;
}
