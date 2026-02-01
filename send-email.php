<?php
/**
 * Contact Form Email Handler for Enprico
 * Uses Hostinger SMTP
 */

header('Access-Control-Allow-Origin: https://enprico.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$name = isset($data['name']) ? trim(strip_tags($data['name'])) : '';
$email = isset($data['email']) ? trim(filter_var($data['email'], FILTER_SANITIZE_EMAIL)) : '';
$subject = isset($data['subject']) ? trim(strip_tags($data['subject'])) : '';
$message = isset($data['message']) ? trim(strip_tags($data['message'])) : '';

if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit();
}

// SMTP Configuration
$smtp_host = 'smtp.hostinger.com';
$smtp_port = 465;
$smtp_user = 'learn@enprico.com';
$smtp_pass = 'Mboukaiz42*@';

// Allow custom recipient for system emails (like welcome emails)
// If 'to' is provided and valid, send to that address; otherwise send to admin
$to_email = 'learn@enprico.com';
if (isset($data['to']) && filter_var($data['to'], FILTER_VALIDATE_EMAIL)) {
    $to_email = $data['to'];
}

// Check if this is a system email (to a user) or a contact form (to admin)
$isSystemEmail = isset($data['to']) && filter_var($data['to'], FILTER_VALIDATE_EMAIL);

if ($isSystemEmail) {
    // System email (welcome email, notifications to users)
    $email_subject = $subject;
    $email_body = "
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
            " . nl2br(htmlspecialchars($message)) . "
        </div>
        <div class='footer'>
            &copy; " . date('Y') . " Enprico - Learn English with Expert Tutors<br>
            <a href='https://enprico.com' style='color: #0076c7;'>www.enprico.com</a>
        </div>
    </div>
</body>
</html>";
} else {
    // Contact form email (to admin)
    $email_subject = "[Enprico Contact] " . $subject;
    $email_body = "
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #0076c7; }
        .footer { background: #333; color: #999; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2 style='margin:0;'>New Contact Form Submission</h2>
        </div>
        <div class='content'>
            <div class='field'>
                <span class='label'>Name:</span><br>
                {$name}
            </div>
            <div class='field'>
                <span class='label'>Email:</span><br>
                <a href='mailto:{$email}'>{$email}</a>
            </div>
            <div class='field'>
                <span class='label'>Subject:</span><br>
                {$subject}
            </div>
            <div class='field'>
                <span class='label'>Message:</span><br>
                " . nl2br(htmlspecialchars($message)) . "
            </div>
        </div>
        <div class='footer'>
            This email was sent from the Enprico website contact form.<br>
            &copy; " . date('Y') . " Enprico
        </div>
    </div>
</body>
</html>";
}

// Send via SMTP
function sendSMTP($host, $port, $user, $pass, $to, $subject, $body, $from_name, $reply_to, $reply_name) {
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Enprico Contact <{$user}>\r\n";
    $headers .= "Reply-To: {$reply_name} <{$reply_to}>\r\n";

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

$result = sendSMTP($smtp_host, $smtp_port, $smtp_user, $smtp_pass, $to_email, $email_subject, $email_body, $name, $email, $name);

if ($result) {
    echo json_encode(['success' => true, 'message' => 'Message sent successfully!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send message. Please try again later.']);
}
?>
