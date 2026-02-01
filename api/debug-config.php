<?php
/**
 * Debug endpoint to check configuration loading
 * DELETE THIS FILE in production!
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Show path information
$debug = [
    '__DIR__' => __DIR__,
    'getcwd()' => getcwd(),
    'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
    'parent_dir' => dirname(__DIR__),
    'realpath_parent' => realpath(__DIR__ . '/..'),
];

// Check if .env exists at various paths
$paths = [
    dirname($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env',  // Outside public_html (production)
    dirname(dirname(__DIR__)) . '/.env',                  // Two levels up from api/
    __DIR__ . '/../.env',                                 // Local dev
    dirname(__DIR__) . '/.env',
];

$debug['env_file_checks'] = [];
foreach ($paths as $path) {
    $debug['env_file_checks'][$path] = file_exists($path) ? 'EXISTS' : 'NOT FOUND';
}

// Try to load config and check values
require_once __DIR__ . '/config.php';

$debug['config_loaded'] = [
    'SUPABASE_URL' => defined('SUPABASE_URL') ? (SUPABASE_URL ? 'SET' : 'EMPTY') : 'NOT DEFINED',
    'SUPABASE_SERVICE_KEY' => defined('SUPABASE_SERVICE_KEY') ? (SUPABASE_SERVICE_KEY ? 'SET (' . strlen(SUPABASE_SERVICE_KEY) . ' chars)' : 'EMPTY') : 'NOT DEFINED',
    'STRIPE_SECRET_KEY' => defined('STRIPE_SECRET_KEY') ? (STRIPE_SECRET_KEY ? 'SET' : 'EMPTY') : 'NOT DEFINED',
];

echo json_encode($debug, JSON_PRETTY_PRINT);
