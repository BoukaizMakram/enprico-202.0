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

// Load .env from outside public_html (secure location)
// Structure: /home/user/.env and /home/user/public_html/api/config.php
$possiblePaths = [
    // Production: .env is OUTSIDE public_html (one level above document root)
    dirname($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env',

    // Alternative: two levels up from api/ folder
    dirname(dirname(__DIR__)) . '/.env',

    // Local development: .env in project root
    __DIR__ . '/../.env',
    dirname(__DIR__) . '/.env',
];

$envLoaded = false;
$loadedFrom = '';
foreach ($possiblePaths as $envPath) {
    if ($envPath && loadEnv($envPath)) {
        $envLoaded = true;
        $loadedFrom = $envPath;
        break;
    }
}

// Debug: if no .env found, log the attempted paths
if (!$envLoaded) {
    error_log('Enprico API: Could not find .env file. __DIR__=' . __DIR__ . ', CWD=' . getcwd());
}

// Helper to get env value from multiple sources
function env($key, $default = '') {
    // Try getenv first
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }
    // Try $_ENV
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    // Try $_SERVER
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }
    return $default;
}

// Configuration values
define('SUPABASE_URL', env('SUPABASE_URL', 'https://bzophrxgmwhobbucnvkf.supabase.co'));
define('SUPABASE_SERVICE_KEY', env('SUPABASE_SERVICE_ROLE_KEY'));
define('SUPABASE_ANON_KEY', env('VITE_SUPABASE_ANON_KEY'));

define('STRIPE_SECRET_KEY', env('STRIPE_SECRET_KEY'));
define('STRIPE_WEBHOOK_SECRET', env('STRIPE_WEBHOOK_SECRET'));
define('STRIPE_PRICE_STARTER', env('STRIPE_PRICE_STARTER'));
define('STRIPE_PRICE_PROFESSIONAL', env('STRIPE_PRICE_PROFESSIONAL'));

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
