<?php
/**
 * Enprico API Configuration
 * Loads configuration from .env file
 */

// Load .env file
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Remove quotes if present
            if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                $value = substr($value, 1, -1);
            }

            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
    return true;
}

// Load .env from project root
$envPath = __DIR__ . '/../.env';
loadEnv($envPath);

// Configuration values
define('SUPABASE_URL', getenv('SUPABASE_URL') ?: 'https://bzophrxgmwhobbucnvkf.supabase.co');
define('SUPABASE_SERVICE_KEY', getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '');
define('SUPABASE_ANON_KEY', getenv('VITE_SUPABASE_ANON_KEY') ?: '');

define('STRIPE_SECRET_KEY', getenv('STRIPE_SECRET_KEY') ?: '');
define('STRIPE_WEBHOOK_SECRET', getenv('STRIPE_WEBHOOK_SECRET') ?: '');
define('STRIPE_PRICE_STARTER', getenv('STRIPE_PRICE_STARTER') ?: '');
define('STRIPE_PRICE_PROFESSIONAL', getenv('STRIPE_PRICE_PROFESSIONAL') ?: '');

// Plan configurations
define('PLANS', [
    'starter' => [
        'price' => 160,
        'hours' => 8,
        'priceId' => STRIPE_PRICE_STARTER
    ],
    'professional' => [
        'price' => 288,
        'hours' => 16,
        'priceId' => STRIPE_PRICE_PROFESSIONAL
    ]
]);

// Validate required config
function validateConfig($required = []) {
    $missing = [];
    foreach ($required as $key) {
        if (!defined($key) || constant($key) === '') {
            $missing[] = $key;
        }
    }

    if (!empty($missing)) {
        http_response_code(500);
        echo json_encode(['error' => 'Server configuration error: Missing ' . implode(', ', $missing)]);
        exit;
    }
}
