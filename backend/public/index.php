<?php

declare(strict_types=1);

require_once '../vendor/autoload.php';

use App\Core\Application;
use App\Core\Database;
use App\Core\Config;
use App\Middleware\CorsMiddleware;
use App\Middleware\AuthMiddleware;
use App\Middleware\RateLimitMiddleware;
use App\Controllers\CartController;
use App\Controllers\SessionController;
use App\Controllers\BookingController;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Initialize application
$app = new Application();

// Add global middleware
$app->addMiddleware(new CorsMiddleware());
$app->addMiddleware(new RateLimitMiddleware());

// Initialize database connection
$database = Database::getInstance();

// Cart routes
$app->get('/api/cart', [CartController::class, 'getCart']);
$app->post('/api/cart/items', [CartController::class, 'addItem']);
$app->put('/api/cart/items/{id}', [CartController::class, 'updateItem']);
$app->delete('/api/cart/items/{id}', [CartController::class, 'removeItem']);
$app->delete('/api/cart', [CartController::class, 'clearCart']);
$app->post('/api/cart/apply-coupon', [CartController::class, 'applyCoupon']);
$app->delete('/api/cart/remove-coupon', [CartController::class, 'removeCoupon']);

// Session routes
$app->get('/api/sessions', [SessionController::class, 'getSessions']);
$app->get('/api/sessions/types', [SessionController::class, 'getSessionTypes']);
$app->get('/api/sessions/trainers', [SessionController::class, 'getTrainers']);
$app->get('/api/sessions/{id}', [SessionController::class, 'getSession']);
$app->get('/api/sessions/{id}/availability', [SessionController::class, 'getAvailability']);

// Booking routes
$app->post('/api/bookings', [BookingController::class, 'createBooking']);
$app->get('/api/bookings/{id}', [BookingController::class, 'getBooking']);
$app->put('/api/bookings/{id}', [BookingController::class, 'updateBooking']);
$app->delete('/api/bookings/{id}', [BookingController::class, 'cancelBooking']);

// Handle 404
$app->addNotFoundHandler(function() {
    http_response_code(404);
    return ['error' => 'Endpoint not found'];
});

// Start the application
$app->run();