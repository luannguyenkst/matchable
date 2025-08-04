<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\Config;
use App\Services\OrderService;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Webhook;
use Ramsey\Uuid\Uuid;
use Exception;

class PaymentService
{
    private Database $db;
    private OrderService $orderService;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->orderService = new OrderService();
        
        // Initialize Stripe
        Stripe::setApiKey(Config::getStripeSecretKey());
    }

    public function createPaymentIntent(int $orderId, string $paymentMethod): array
    {
        // Get order details
        $order = $this->orderService->getOrderById($orderId);
        
        if (!$order) {
            throw new Exception('Order not found');
        }

        if ($order['payment_status'] !== 'pending') {
            throw new Exception('Order payment already processed');
        }

        $transactionId = Uuid::uuid4()->toString();
        $amount = $order['total_amount'];

        switch ($paymentMethod) {
            case 'stripe':
                return $this->createStripePaymentIntent($orderId, $transactionId, $amount);
            case 'paypal':
                return $this->createPaypalPaymentIntent($orderId, $transactionId, $amount);
            default:
                throw new Exception('Unsupported payment method');
        }
    }

    public function confirmPayment(string $transactionId, string $paymentMethod, array $gatewayData): array
    {
        $this->db->beginTransaction();

        try {
            // Get transaction
            $transaction = $this->db->fetch(
                'SELECT * FROM payment_transactions WHERE transaction_id = ?',
                [$transactionId]
            );

            if (!$transaction) {
                throw new Exception('Transaction not found');
            }

            if ($transaction['status'] !== 'pending') {
                throw new Exception('Transaction already processed');
            }

            switch ($paymentMethod) {
                case 'stripe':
                    $result = $this->confirmStripePayment($transaction, $gatewayData);
                    break;
                case 'paypal':
                    $result = $this->confirmPaypalPayment($transaction, $gatewayData);
                    break;
                default:
                    throw new Exception('Unsupported payment method');
            }

            // Update transaction status
            $this->db->update('payment_transactions', [
                'status' => $result['success'] ? 'completed' : 'failed',
                'gateway_transaction_id' => $result['gateway_transaction_id'] ?? null,
                'gateway_response' => json_encode($result['response'] ?? []),
                'processed_at' => date('Y-m-d H:i:s')
            ], ['id' => $transaction['id']]);

            if ($result['success']) {
                // Update order payment status
                $this->db->update('orders', [
                    'payment_status' => 'paid',
                    'status' => 'processing'
                ], ['id' => $transaction['order_id']]);
            }

            $this->db->commit();

            return [
                'success' => $result['success'],
                'transaction_id' => $transactionId,
                'message' => $result['success'] ? 'Payment completed successfully' : 'Payment failed'
            ];

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function handleStripeWebhook(string $payload, string $sigHeader): void
    {
        $endpointSecret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '';
        
        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);

            switch ($event['type']) {
                case 'payment_intent.succeeded':
                    $this->handleStripePaymentSucceeded($event['data']['object']);
                    break;
                case 'payment_intent.payment_failed':
                    $this->handleStripePaymentFailed($event['data']['object']);
                    break;
                default:
                    error_log("Unhandled Stripe webhook event type: " . $event['type']);
            }

        } catch (\UnexpectedValueException $e) {
            throw new Exception('Invalid payload');
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            throw new Exception('Invalid signature');
        }
    }

    public function handlePaypalWebhook(string $payload, array $headers): void
    {
        // PayPal webhook verification would go here
        $data = json_decode($payload, true);
        
        if (!$data) {
            throw new Exception('Invalid payload');
        }

        switch ($data['event_type']) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                $this->handlePaypalPaymentCompleted($data);
                break;
            case 'PAYMENT.CAPTURE.DENIED':
                $this->handlePaypalPaymentFailed($data);
                break;
            default:
                error_log("Unhandled PayPal webhook event type: " . $data['event_type']);
        }
    }

    private function createStripePaymentIntent(int $orderId, string $transactionId, float $amount): array
    {
        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => (int) ($amount * 100), // Convert to cents
                'currency' => 'usd',
                'metadata' => [
                    'order_id' => $orderId,
                    'transaction_id' => $transactionId
                ],
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);

            // Save transaction record
            $this->db->insert('payment_transactions', [
                'order_id' => $orderId,
                'transaction_id' => $transactionId,
                'payment_method' => 'stripe',
                'status' => 'pending',
                'amount' => $amount,
                'gateway_transaction_id' => $paymentIntent->id,
                'gateway_response' => json_encode($paymentIntent->toArray())
            ]);

            return [
                'client_secret' => $paymentIntent->client_secret,
                'transaction_id' => $transactionId,
                'publishable_key' => Config::getStripePublishableKey()
            ];

        } catch (\Stripe\Exception\ApiErrorException $e) {
            throw new Exception('Stripe error: ' . $e->getMessage());
        }
    }

    private function createPaypalPaymentIntent(int $orderId, string $transactionId, float $amount): array
    {
        // PayPal integration would go here
        // This is a simplified version
        
        $this->db->insert('payment_transactions', [
            'order_id' => $orderId,
            'transaction_id' => $transactionId,
            'payment_method' => 'paypal',
            'status' => 'pending',
            'amount' => $amount
        ]);

        return [
            'approval_url' => 'https://www.sandbox.paypal.com/checkoutnow?token=placeholder',
            'transaction_id' => $transactionId,
            'client_id' => Config::getPaypalClientId()
        ];
    }

    private function confirmStripePayment(array $transaction, array $gatewayData): array
    {
        try {
            $paymentIntentId = $gatewayData['payment_intent_id'] ?? $transaction['gateway_transaction_id'];
            
            if (!$paymentIntentId) {
                throw new Exception('Payment intent ID required');
            }

            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            return [
                'success' => $paymentIntent->status === 'succeeded',
                'gateway_transaction_id' => $paymentIntent->id,
                'response' => $paymentIntent->toArray()
            ];

        } catch (\Stripe\Exception\ApiErrorException $e) {
            return [
                'success' => false,
                'response' => ['error' => $e->getMessage()]
            ];
        }
    }

    private function confirmPaypalPayment(array $transaction, array $gatewayData): array
    {
        // PayPal payment confirmation would go here
        // This is a simplified version
        
        $paymentId = $gatewayData['payment_id'] ?? null;
        $payerId = $gatewayData['payer_id'] ?? null;

        if (!$paymentId || !$payerId) {
            return [
                'success' => false,
                'response' => ['error' => 'Payment ID and Payer ID required']
            ];
        }

        // Simulate PayPal payment confirmation
        return [
            'success' => true,
            'gateway_transaction_id' => $paymentId,
            'response' => ['payer_id' => $payerId, 'status' => 'completed']
        ];
    }

    private function handleStripePaymentSucceeded($paymentIntent): void
    {
        $transactionId = $paymentIntent['metadata']['transaction_id'] ?? null;
        
        if (!$transactionId) {
            return;
        }

        $this->updateTransactionFromWebhook($transactionId, 'completed', $paymentIntent['id'], $paymentIntent);
    }

    private function handleStripePaymentFailed($paymentIntent): void
    {
        $transactionId = $paymentIntent['metadata']['transaction_id'] ?? null;
        
        if (!$transactionId) {
            return;
        }

        $this->updateTransactionFromWebhook($transactionId, 'failed', $paymentIntent['id'], $paymentIntent);
    }

    private function handlePaypalPaymentCompleted($data): void
    {
        // Extract transaction ID from PayPal webhook data
        $transactionId = $data['resource']['custom_id'] ?? null;
        
        if (!$transactionId) {
            return;
        }

        $this->updateTransactionFromWebhook($transactionId, 'completed', $data['resource']['id'], $data);
    }

    private function handlePaypalPaymentFailed($data): void
    {
        $transactionId = $data['resource']['custom_id'] ?? null;
        
        if (!$transactionId) {
            return;
        }

        $this->updateTransactionFromWebhook($transactionId, 'failed', $data['resource']['id'], $data);
    }

    private function updateTransactionFromWebhook(string $transactionId, string $status, string $gatewayTransactionId, array $response): void
    {
        $this->db->beginTransaction();

        try {
            $transaction = $this->db->fetch(
                'SELECT * FROM payment_transactions WHERE transaction_id = ?',
                [$transactionId]
            );

            if (!$transaction) {
                throw new Exception('Transaction not found');
            }

            // Update transaction
            $this->db->update('payment_transactions', [
                'status' => $status,
                'gateway_transaction_id' => $gatewayTransactionId,
                'gateway_response' => json_encode($response),
                'processed_at' => date('Y-m-d H:i:s')
            ], ['id' => $transaction['id']]);

            // Update order if payment succeeded
            if ($status === 'completed') {
                $this->db->update('orders', [
                    'payment_status' => 'paid',
                    'status' => 'processing'
                ], ['id' => $transaction['order_id']]);
            }

            $this->db->commit();

        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Webhook transaction update failed: " . $e->getMessage());
        }
    }
}