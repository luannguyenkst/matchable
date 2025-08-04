<?php

declare(strict_types=1);

namespace App\Core;

class Config
{
    private static array $config = [];

    public static function get(string $key, $default = null)
    {
        $keys = explode('.', $key);
        $value = self::$config;

        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }

        return $value;
    }

    public static function set(string $key, $value): void
    {
        $keys = explode('.', $key);
        $config = &self::$config;

        foreach ($keys as $k) {
            if (!isset($config[$k]) || !is_array($config[$k])) {
                $config[$k] = [];
            }
            $config = &$config[$k];
        }

        $config = $value;
    }

    public static function load(array $config): void
    {
        self::$config = array_merge(self::$config, $config);
    }

    public static function getJwtSecret(): string
    {
        return $_ENV['JWT_SECRET'] ?? 'default-jwt-secret-key';
    }

    public static function getJwtExpiration(): int
    {
        return (int) ($_ENV['JWT_EXPIRATION'] ?? 3600);
    }

    public static function getStripeSecretKey(): string
    {
        return $_ENV['STRIPE_SECRET_KEY'] ?? '';
    }

    public static function getStripePublishableKey(): string
    {
        return $_ENV['STRIPE_PUBLISHABLE_KEY'] ?? '';
    }

    public static function getPaypalClientId(): string
    {
        return $_ENV['PAYPAL_CLIENT_ID'] ?? '';
    }

    public static function getPaypalClientSecret(): string
    {
        return $_ENV['PAYPAL_CLIENT_SECRET'] ?? '';
    }

    public static function getPaypalMode(): string
    {
        return $_ENV['PAYPAL_MODE'] ?? 'sandbox';
    }

    public static function getSmtpConfig(): array
    {
        return [
            'host' => $_ENV['SMTP_HOST'] ?? 'localhost',
            'port' => (int) ($_ENV['SMTP_PORT'] ?? 587),
            'username' => $_ENV['SMTP_USERNAME'] ?? '',
            'password' => $_ENV['SMTP_PASSWORD'] ?? '',
            'encryption' => $_ENV['SMTP_ENCRYPTION'] ?? 'tls'
        ];
    }

    public static function getRedisConfig(): array
    {
        return [
            'host' => $_ENV['REDIS_HOST'] ?? 'localhost',
            'port' => (int) ($_ENV['REDIS_PORT'] ?? 6379),
            'password' => $_ENV['REDIS_PASSWORD'] ?? null
        ];
    }

    public static function getCorsAllowedOrigins(): array
    {
        $origins = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:4200';
        return explode(',', $origins);
    }

    public static function getUploadConfig(): array
    {
        return [
            'max_size' => (int) ($_ENV['UPLOAD_MAX_SIZE'] ?? 10485760), // 10MB
            'allowed_types' => explode(',', $_ENV['ALLOWED_FILE_TYPES'] ?? 'jpg,jpeg,png,gif,pdf')
        ];
    }

    public static function getRateLimitConfig(): array
    {
        return [
            'requests' => (int) ($_ENV['RATE_LIMIT_REQUESTS'] ?? 1000),
            'window' => (int) ($_ENV['RATE_LIMIT_WINDOW'] ?? 3600) // 1 hour
        ];
    }

    public static function getSessionLifetime(): int
    {
        return (int) ($_ENV['SESSION_LIFETIME'] ?? 7200); // 2 hours
    }

    public static function isDebugMode(): bool
    {
        return ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
    }

    public static function getAppUrl(): string
    {
        return $_ENV['APP_URL'] ?? 'http://localhost:4200';
    }

    public static function getApiUrl(): string
    {
        return $_ENV['API_URL'] ?? 'http://localhost:8080';
    }
}