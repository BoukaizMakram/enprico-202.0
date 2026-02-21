<?php
/**
 * Newsletter Subscription Handler
 * Saves subscriber to database and sends welcome email with discount
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
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$email = isset($data['email']) ? trim(filter_var($data['email'], FILTER_SANITIZE_EMAIL)) : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid email address is required']);
    exit;
}

// Save to Supabase database
$supabaseUrl = SUPABASE_URL;
$supabaseKey = SUPABASE_SERVICE_KEY;

// Insert subscriber into newsletter_subscribers table
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/newsletter_subscribers');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => $email,
    'subscribed_at' => date('c'),
    'source' => 'website_popup'
]));
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

// Check for duplicate (409 conflict) - treat as success since they're already subscribed
if ($httpCode === 409) {
    echo json_encode(['success' => true, 'message' => 'You are already subscribed!']);
    exit;
}

if ($curlError || ($httpCode !== 201 && $httpCode !== 200)) {
    error_log('Supabase newsletter insert error: ' . $curlError . ' HTTP: ' . $httpCode . ' Response: ' . $response);
    // Continue anyway to send the email - we can manually add them later
}

// Send welcome email with $20 discount
$smtp_host = 'smtp.hostinger.com';
$smtp_port = 465;
$smtp_user = 'learn@enprico.com';
$smtp_pass = 'Mboukaiz42*@';

$email_subject = 'Welcome to Enprico! Here\'s Your $20 Discount';
$email_body = "
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .discount-box { background: linear-gradient(135deg, #fdbb33, #f0a500); color: #333; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .discount-box h2 { margin: 0 0 10px 0; font-size: 32px; color: #083d7a; }
        .discount-box p { margin: 0; font-size: 16px; }
        .discount-code { background: #083d7a; color: white; padding: 15px 30px; border-radius: 8px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin-top: 15px; }
        .button { display: inline-block; background: #0076c7; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #005a9e; }
        .benefits { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .benefits h3 { color: #0076c7; margin-top: 0; }
        .benefits ul { margin: 0; padding-left: 20px; }
        .benefits li { margin: 8px 0; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
        .footer a { color: #0076c7; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to Enprico!</h1>
            <p style='margin: 10px 0 0 0; opacity: 0.9;'>Your French Learning Journey Starts Here</p>
        </div>
        <div class='content'>
            <p>Hi there!</p>
            <p>Thank you for subscribing to Enprico! We're thrilled to have you join our community of French learners preparing for TEF and TCF exams.</p>

            <div class='discount-box'>
                <h2>\$20 OFF</h2>
                <p>Your exclusive discount on the Professional Plan</p>
                <div class='discount-code'>WELCOME20</div>
            </div>

            <p style='text-align: center;'>Use code <strong>WELCOME20</strong> at checkout to save \$20 on your Professional Plan subscription!</p>

            <div style='text-align: center;'>
                <a href='https://enprico.com/#pricing' class='button'>View Our Plans</a>
            </div>

            <div class='benefits'>
                <h3>What You'll Get:</h3>
                <ul>
                    <li><strong>1-on-1 Live Sessions</strong> with certified French teachers</li>
                    <li><strong>TEF & TCF Exam Prep</strong> focused curriculum</li>
                    <li><strong>Flexible Scheduling</strong> that fits your lifestyle</li>
                    <li><strong>Personalized Learning</strong> tailored to your goals</li>
                </ul>
            </div>

            <p>As a subscriber, you'll receive:</p>
            <ul>
                <li>Weekly French learning tips and tricks</li>
                <li>Exclusive discounts and offers</li>
                <li>TEF/TCF exam preparation resources</li>
                <li>Success stories from our students</li>
            </ul>

            <p>Have questions? Simply reply to this email or contact us at <a href='mailto:learn@enprico.com'>learn@enprico.com</a>.</p>

            <p>À bientôt!<br><strong>The Enprico Team</strong></p>
        </div>
        <div class='footer'>
            &copy; " . date('Y') . " Enprico - French for TEF & TCF Exams<br>
            <a href='https://enprico.com'>www.enprico.com</a><br><br>
            <small>You're receiving this email because you subscribed at enprico.com.<br>
            <a href='https://enprico.com/unsubscribe?email=" . urlencode($email) . "'>Unsubscribe</a></small>
        </div>
    </div>
</body>
</html>";

// Send via SMTP
function sendSMTP($host, $port, $user, $pass, $to, $subject, $body) {
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

    $socket = stream_socket_client(
        "ssl://{$host}:{$port}",
        $errno,
        $errstr,
        30,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$socket) {
        return false;
    }

    $response = fgets($socket, 515);

    // EHLO
    fputs($socket, "EHLO enprico.com\r\n");
    while ($line = fgets($socket, 515)) {
        if (substr($line, 3, 1) == ' ') break;
    }

    // AUTH LOGIN
    fputs($socket, "AUTH LOGIN\r\n");
    fgets($socket, 515);

    fputs($socket, base64_encode($user) . "\r\n");
    fgets($socket, 515);

    fputs($socket, base64_encode($pass) . "\r\n");
    $auth_response = fgets($socket, 515);

    if (substr($auth_response, 0, 3) != '235') {
        fclose($socket);
        return false;
    }

    // MAIL FROM
    fputs($socket, "MAIL FROM:<{$user}>\r\n");
    fgets($socket, 515);

    // RCPT TO
    fputs($socket, "RCPT TO:<{$to}>\r\n");
    fgets($socket, 515);

    // DATA
    fputs($socket, "DATA\r\n");
    fgets($socket, 515);

    // Message
    $msg = "To: {$to}\r\n";
    $msg .= "Subject: {$subject}\r\n";
    $msg .= $headers;
    $msg .= "\r\n";
    $msg .= $body;
    $msg .= "\r\n.\r\n";

    fputs($socket, $msg);
    fgets($socket, 515);

    // QUIT
    fputs($socket, "QUIT\r\n");
    fclose($socket);

    return true;
}

$emailResult = sendSMTP($smtp_host, $smtp_port, $smtp_user, $smtp_pass, $email, $email_subject, $email_body);

if ($emailResult) {
    echo json_encode(['success' => true, 'message' => 'Thank you for subscribing! Check your inbox for your $20 discount code.']);
} else {
    // Even if email fails, subscription was saved
    echo json_encode(['success' => true, 'message' => 'Thank you for subscribing! You\'ll receive updates soon.']);
}
?>
