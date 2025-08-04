<?php

declare(strict_types=1);

namespace App\Core;

class Validator
{
    private array $data;
    private array $errors = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function required(array $fields): self
    {
        foreach ($fields as $field) {
            if (!isset($this->data[$field]) || $this->isEmpty($this->data[$field])) {
                $this->errors[$field][] = "The {$field} field is required.";
            }
        }
        return $this;
    }

    public function email(string $field): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field][] = "The {$field} must be a valid email address.";
            }
        }
        return $this;
    }

    public function minLength(string $field, int $min): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (strlen($this->data[$field]) < $min) {
                $this->errors[$field][] = "The {$field} must be at least {$min} characters.";
            }
        }
        return $this;
    }

    public function maxLength(string $field, int $max): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (strlen($this->data[$field]) > $max) {
                $this->errors[$field][] = "The {$field} must not exceed {$max} characters.";
            }
        }
        return $this;
    }

    public function numeric(string $field): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!is_numeric($this->data[$field])) {
                $this->errors[$field][] = "The {$field} must be a number.";
            }
        }
        return $this;
    }

    public function integer(string $field): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_INT)) {
                $this->errors[$field][] = "The {$field} must be an integer.";
            }
        }
        return $this;
    }

    public function min(string $field, $min): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (is_numeric($this->data[$field]) && $this->data[$field] < $min) {
                $this->errors[$field][] = "The {$field} must be at least {$min}.";
            }
        }
        return $this;
    }

    public function max(string $field, $max): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (is_numeric($this->data[$field]) && $this->data[$field] > $max) {
                $this->errors[$field][] = "The {$field} must not exceed {$max}.";
            }
        }
        return $this;
    }

    public function in(string $field, array $values): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!in_array($this->data[$field], $values)) {
                $allowed = implode(', ', $values);
                $this->errors[$field][] = "The {$field} must be one of: {$allowed}.";
            }
        }
        return $this;
    }

    public function url(string $field): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_URL)) {
                $this->errors[$field][] = "The {$field} must be a valid URL.";
            }
        }
        return $this;
    }

    public function regex(string $field, string $pattern, string $message = null): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!preg_match($pattern, $this->data[$field])) {
                $defaultMessage = "The {$field} format is invalid.";
                $this->errors[$field][] = $message ?? $defaultMessage;
            }
        }
        return $this;
    }

    public function date(string $field): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!strtotime($this->data[$field])) {
                $this->errors[$field][] = "The {$field} must be a valid date.";
            }
        }
        return $this;
    }

    public function boolean(string $field): self
    {
        if (isset($this->data[$field])) {
            if (!is_bool($this->data[$field]) && !in_array($this->data[$field], [0, 1, '0', '1', 'true', 'false'], true)) {
                $this->errors[$field][] = "The {$field} must be a boolean value.";
            }
        }
        return $this;
    }

    public function array(string $field): self
    {
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!is_array($this->data[$field])) {
                $this->errors[$field][] = "The {$field} must be an array.";
            }
        }
        return $this;
    }

    public function custom(string $field, callable $callback, string $message): self
    {
        if (isset($this->data[$field])) {
            if (!$callback($this->data[$field])) {
                $this->errors[$field][] = $message;
            }
        }
        return $this;
    }

    public function isValid(): bool
    {
        return empty($this->errors);
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getFirstError(string $field): ?string
    {
        return $this->errors[$field][0] ?? null;
    }

    public function getAllErrors(): array
    {
        $allErrors = [];
        foreach ($this->errors as $field => $fieldErrors) {
            $allErrors = array_merge($allErrors, $fieldErrors);
        }
        return $allErrors;
    }

    private function isEmpty($value): bool
    {
        if (is_null($value)) {
            return true;
        }
        
        if (is_string($value)) {
            return trim($value) === '';
        }
        
        if (is_array($value)) {
            return empty($value);
        }
        
        return false;
    }
}