<?php

declare(strict_types=1);

namespace App\Controllers;

abstract class BaseController
{
    protected array $input;

    public function __construct()
    {
        $this->input = $this->getJsonInput();
    }

    protected function getJsonInput(): array
    {
        $input = file_get_contents('php://input');
        $decoded = json_decode($input, true);
        return $decoded ?? [];
    }

    protected function getBearerToken(): ?string
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }

    protected function success($data = null, string $message = 'Success', int $code = 200): array
    {
        http_response_code($code);
        
        $response = [
            'success' => true,
            'message' => $message
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return $response;
    }

    protected function error(string $message, int $code = 400, $details = null): array
    {
        http_response_code($code);
        
        $response = [
            'success' => false,
            'error' => $message
        ];

        if ($details !== null) {
            $response['details'] = $details;
        }

        return $response;
    }

    protected function paginate(array $data, int $page, int $perPage, int $total): array
    {
        return [
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => ceil($total / $perPage),
                'has_next' => $page < ceil($total / $perPage),
                'has_prev' => $page > 1
            ]
        ];
    }

    protected function validateRequired(array $fields): ?array
    {
        $missing = [];
        
        foreach ($fields as $field) {
            if (!isset($this->input[$field]) || empty($this->input[$field])) {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            return $this->error('Missing required fields: ' . implode(', ', $missing), 422);
        }
        
        return null;
    }

    protected function sanitizeString(string $value): string
    {
        return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
    }

    protected function sanitizeEmail(string $email): string
    {
        return filter_var(trim($email), FILTER_SANITIZE_EMAIL);
    }

    protected function sanitizeInt($value): int
    {
        return (int) filter_var($value, FILTER_SANITIZE_NUMBER_INT);
    }

    protected function sanitizeFloat($value): float
    {
        return (float) filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    }

    protected function getQueryParam(string $key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }

    protected function getIntQueryParam(string $key, int $default = 0): int
    {
        $value = $_GET[$key] ?? $default;
        return is_numeric($value) ? (int) $value : $default;
    }

    protected function getCartSessionId(): ?string
    {
        // Try to get from header first
        $headers = getallheaders();
        $sessionId = $headers['X-Cart-Session-ID'] ?? $headers['x-cart-session-id'] ?? null;
        
        // Fallback to session
        if (!$sessionId) {
            session_start();
            $sessionId = $_SESSION['cart_session_id'] ?? null;
        }
        
        return $sessionId;
    }

    protected function setCartSessionId(string $sessionId): void
    {
        session_start();
        $_SESSION['cart_session_id'] = $sessionId;
        header("X-Cart-Session-ID: {$sessionId}");
    }
}