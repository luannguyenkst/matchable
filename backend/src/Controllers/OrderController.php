<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\OrderService;
use App\Core\Validator;
use Exception;

class OrderController extends BaseController
{
    private OrderService $orderService;

    public function __construct()
    {
        parent::__construct();
        $this->orderService = new OrderService();
    }

    public function show(string $id): array
    {
        try {
            $orderId = $this->sanitizeInt($id);

            $order = $this->orderService->getOrderById($orderId);

            if (!$order) {
                return $this->error('Order not found', 404);
            }

            return $this->success(['order' => $order]);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function create(): array
    {
        try {
            $validator = new Validator($this->input);
            $validator->required(['billing_address', 'shipping_address', 'guest_email'])
                     ->array('billing_address')
                     ->array('shipping_address')
                     ->email('guest_email');

            if (isset($this->input['payment_method'])) {
                $validator->in('payment_method', ['stripe', 'paypal', 'apple_pay', 'google_pay']);
            }

            if (!$validator->isValid()) {
                return $this->error('Validation failed', 422, $validator->getErrors());
            }

            // Validate addresses
            $billingValidation = $this->validateAddress($this->input['billing_address']);
            if ($billingValidation) {
                return $billingValidation;
            }

            $shippingValidation = $this->validateAddress($this->input['shipping_address']);
            if ($shippingValidation) {
                return $shippingValidation;
            }

            $sessionId = $this->getCartSessionId();
            if (!$sessionId) {
                return $this->error('Cart session not found', 400);
            }

            $orderData = [
                'guest_email' => $this->input['guest_email'],
                'billing_address' => $this->input['billing_address'],
                'shipping_address' => $this->input['shipping_address'],
                'shipping_method' => $this->input['shipping_method'] ?? 'standard',
                'payment_method' => $this->input['payment_method'] ?? 'stripe',
                'notes' => $this->input['notes'] ?? null
            ];

            $order = $this->orderService->createOrder($sessionId, $orderData);

            return $this->success(['order' => $order], 'Order created successfully', 201);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function update(string $id): array
    {
        try {
            $orderId = $this->sanitizeInt($id);
            $validator = new Validator($this->input);

            // Allow updating specific fields
            if (isset($this->input['shipping_address'])) {
                $validator->array('shipping_address');
                $shippingValidation = $this->validateAddress($this->input['shipping_address']);
                if ($shippingValidation) {
                    return $shippingValidation;
                }
            }

            if (isset($this->input['billing_address'])) {
                $validator->array('billing_address');
                $billingValidation = $this->validateAddress($this->input['billing_address']);
                if ($billingValidation) {
                    return $billingValidation;
                }
            }

            if (isset($this->input['notes'])) {
                $validator->maxLength('notes', 1000);
            }

            if (!$validator->isValid()) {
                return $this->error('Validation failed', 422, $validator->getErrors());
            }

            $order = $this->orderService->updateOrder($orderId, $this->input);

            return $this->success(['order' => $order], 'Order updated successfully');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function cancel(string $id): array
    {
        try {
            $orderId = $this->sanitizeInt($id);
            $reason = $this->input['reason'] ?? 'Customer request';

            $order = $this->orderService->cancelOrder($orderId, $reason);

            return $this->success(['order' => $order], 'Order cancelled successfully');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    private function validateAddress(array $address): ?array
    {
        $validator = new Validator($address);
        $validator->required(['first_name', 'last_name', 'address_line_1', 'city', 'state', 'postal_code', 'country'])
                 ->maxLength('first_name', 100)
                 ->maxLength('last_name', 100)
                 ->maxLength('company', 100)
                 ->maxLength('address_line_1', 255)
                 ->maxLength('address_line_2', 255)
                 ->maxLength('city', 100)
                 ->maxLength('state', 100)
                 ->maxLength('postal_code', 20)
                 ->maxLength('country', 100);

        if (!$validator->isValid()) {
            return $this->error('Address validation failed', 422, $validator->getErrors());
        }

        return null;
    }
}