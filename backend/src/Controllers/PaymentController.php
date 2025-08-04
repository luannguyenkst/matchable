<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\PaymentService;
use App\Core\Validator;
use Exception;

class PaymentController extends BaseController
{
    private PaymentService $paymentService;

    public function __construct()
    {
        parent::__construct();
        $this->paymentService = new PaymentService();
    }

    public function createPaymentIntent(): array
    {
        try {
            $validator = new Validator($this->input);
            $validator->required(['order_id', 'payment_method'])
                     ->integer('order_id')
                     ->in('payment_method', ['stripe', 'paypal']);

            if (!$validator->isValid()) {
                return $this->error('Validation failed', 422, $validator->getErrors());
            }

            $orderId = (int) $this->input['order_id'];
            $paymentMethod = $this->input['payment_method'];

            $result = $this->paymentService->createPaymentIntent($orderId, $paymentMethod);

            return $this->success($result, 'Payment intent created');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function confirmPayment(): array
    {
        try {
            $validator = new Validator($this->input);
            $validator->required(['transaction_id', 'payment_method'])
                     ->in('payment_method', ['stripe', 'paypal']);

            if (!$validator->isValid()) {
                return $this->error('Validation failed', 422, $validator->getErrors());
            }

            $transactionId = $this->input['transaction_id'];
            $paymentMethod = $this->input['payment_method'];
            $gatewayData = $this->input['gateway_data'] ?? [];

            $result = $this->paymentService->confirmPayment($transactionId, $paymentMethod, $gatewayData);

            return $this->success($result, 'Payment confirmed');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function stripeWebhook(): void
    {
        try {
            $payload = file_get_contents('php://input');
            $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

            $this->paymentService->handleStripeWebhook($payload, $sigHeader);

            http_response_code(200);
            echo json_encode(['status' => 'success']);

        } catch (Exception $e) {
            error_log("Stripe webhook error: " . $e->getMessage());
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function paypalWebhook(): void
    {
        try {
            $payload = file_get_contents('php://input');
            $headers = getallheaders();

            $this->paymentService->handlePaypalWebhook($payload, $headers);

            http_response_code(200);
            echo json_encode(['status' => 'success']);

        } catch (Exception $e) {
            error_log("PayPal webhook error: " . $e->getMessage());
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}