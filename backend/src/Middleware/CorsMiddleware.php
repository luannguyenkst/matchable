<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Config;

class CorsMiddleware
{
    public function handle(): void
    {
        $allowedOrigins = Config::getCorsAllowedOrigins();
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // For development, allow common localhost origins
        $developmentOrigins = [
            'http://localhost',
            'http://localhost:80',
            'http://localhost:4200',
            'http://localhost:3000',
            'http://127.0.0.1:4200',
            'https://matchable.vercel.app'
        ];
        
        // Set CORS headers
        if (in_array('*', $allowedOrigins)) {
            header('Access-Control-Allow-Origin: *');
        } elseif (in_array($origin, $allowedOrigins) || in_array($origin, $developmentOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
        } elseif (empty($origin)) {
            header('Access-Control-Allow-Origin: *');
        } else {
            // For security, don't set CORS headers for disallowed origins
            header('Access-Control-Allow-Origin: null');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Cart-Session-ID, Accept, Origin');
        header('Access-Control-Max-Age: 86400');
        header('Vary: Origin');

        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}