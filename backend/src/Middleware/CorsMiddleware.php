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
            'http://localhost:3000'
        ];
        
        if (in_array($origin, $allowedOrigins) || 
            in_array('*', $allowedOrigins) || 
            in_array($origin, $developmentOrigins) ||
            empty($origin)) {
            header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Cart-Session-ID');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
}