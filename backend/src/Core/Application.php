<?php

declare(strict_types=1);

namespace App\Core;

use Exception;

class Application
{
    private array $routes = [];
    private array $middleware = [];
    private $notFoundHandler = null;

    public function get(string $path, $handler, array $middleware = []): void
    {
        $this->addRoute('GET', $path, $handler, $middleware);
    }

    public function post(string $path, $handler, array $middleware = []): void
    {
        $this->addRoute('POST', $path, $handler, $middleware);
    }

    public function put(string $path, $handler, array $middleware = []): void
    {
        $this->addRoute('PUT', $path, $handler, $middleware);
    }

    public function delete(string $path, $handler, array $middleware = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $middleware);
    }

    public function patch(string $path, $handler, array $middleware = []): void
    {
        $this->addRoute('PATCH', $path, $handler, $middleware);
    }

    public function options(string $path, $handler, array $middleware = []): void
    {
        $this->addRoute('OPTIONS', $path, $handler, $middleware);
    }

    private function addRoute(string $method, string $path, $handler, array $middleware = []): void
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler,
            'middleware' => $middleware
        ];
    }

    public function addMiddleware($middleware): void
    {
        $this->middleware[] = $middleware;
    }

    public function addNotFoundHandler($handler): void
    {
        $this->notFoundHandler = $handler;
    }

    public function run(): void
    {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

            // Execute global middleware first (including CORS)
            foreach ($this->middleware as $middleware) {
                if (is_string($middleware)) {
                    $middleware = new $middleware();
                }
                $middleware->handle();
            }

            // Find matching route
            $matchedRoute = null;
            $params = [];

            foreach ($this->routes as $route) {
                if ($route['method'] !== $method) {
                    continue;
                }

                $pattern = $this->convertRouteToRegex($route['path']);
                if (preg_match($pattern, $uri, $matches)) {
                    $matchedRoute = $route;
                    $params = array_slice($matches, 1);
                    break;
                }
            }

            if (!$matchedRoute) {
                $this->handleNotFound();
                return;
            }

            // Execute route-specific middleware
            foreach ($matchedRoute['middleware'] as $middleware) {
                if (is_string($middleware)) {
                    $middleware = new $middleware();
                }
                $middleware->handle();
            }

            // Execute handler
            $handler = $matchedRoute['handler'];
            $result = null;

            if (is_array($handler)) {
                [$controllerClass, $method] = $handler;
                $controller = new $controllerClass();
                $result = call_user_func_array([$controller, $method], $params);
            } elseif (is_callable($handler)) {
                $result = call_user_func_array($handler, $params);
            }

            // Send response
            $this->sendResponse($result);

        } catch (Exception $e) {
            $this->handleError($e);
        }
    }

    private function convertRouteToRegex(string $route): string
    {
        $pattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $route);
        return '#^' . $pattern . '$#';
    }

    private function handleNotFound(): void
    {
        if ($this->notFoundHandler) {
            $result = call_user_func($this->notFoundHandler);
            $this->sendResponse($result);
        } else {
            http_response_code(404);
            $this->sendResponse(['error' => 'Not Found']);
        }
    }

    private function handleError(Exception $e): void
    {
        error_log($e->getMessage());
        
        http_response_code(500);
        
        if ($_ENV['APP_DEBUG'] === 'true') {
            $this->sendResponse([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        } else {
            $this->sendResponse(['error' => 'Internal Server Error']);
        }
    }

    private function sendResponse($data): void
    {
        if ($data === null) {
            return;
        }

        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
}