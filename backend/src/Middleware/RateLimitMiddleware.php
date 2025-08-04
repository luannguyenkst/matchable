<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Config;
use Predis\Client as Redis;

class RateLimitMiddleware
{
    private Redis $redis;
    private int $maxRequests;
    private int $windowSize;

    public function __construct()
    {
        $redisConfig = Config::getRedisConfig();
        $this->redis = new Redis([
            'scheme' => 'tcp',
            'host' => $redisConfig['host'],
            'port' => $redisConfig['port'],
            'password' => $redisConfig['password']
        ]);

        $rateLimitConfig = Config::getRateLimitConfig();
        $this->maxRequests = $rateLimitConfig['requests'];
        $this->windowSize = $rateLimitConfig['window'];
    }

    public function handle(): void
    {
        $clientIp = $this->getClientIp();
        $key = "rate_limit:{$clientIp}";
        $currentTime = time();
        $windowStart = $currentTime - $this->windowSize;

        try {
            // Remove old entries
            $this->redis->zremrangebyscore($key, 0, $windowStart);

            // Count current requests
            $requestCount = $this->redis->zcard($key);

            if ($requestCount >= $this->maxRequests) {
                $this->rateLimitExceeded();
                return;
            }

            // Add current request
            $this->redis->zadd($key, $currentTime, uniqid());
            $this->redis->expire($key, $this->windowSize);

            // Add rate limit headers
            $remaining = max(0, $this->maxRequests - $requestCount - 1);
            $resetTime = $currentTime + $this->windowSize;

            header("X-RateLimit-Limit: {$this->maxRequests}");
            header("X-RateLimit-Remaining: {$remaining}");
            header("X-RateLimit-Reset: {$resetTime}");

        } catch (\Exception $e) {
            // If Redis is unavailable, log error but continue
            error_log("Rate limit middleware error: " . $e->getMessage());
        }
    }

    private function getClientIp(): string
    {
        $headers = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                return trim($ips[0]);
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    private function rateLimitExceeded(): void
    {
        http_response_code(429);
        header('Content-Type: application/json');
        header('Retry-After: ' . $this->windowSize);
        
        echo json_encode([
            'error' => 'Too Many Requests',
            'message' => 'Rate limit exceeded. Please try again later.',
            'retry_after' => $this->windowSize
        ]);
        exit;
    }
}