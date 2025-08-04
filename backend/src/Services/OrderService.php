<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Services\CartService;
use App\Services\ProductService;
use App\Services\EmailService;
use Exception;

class OrderService
{
    private Database $db;
    private CartService $cartService;
    private ProductService $productService;
    private EmailService $emailService;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->cartService = new CartService();
        $this->productService = new ProductService();
        $this->emailService = new EmailService();
    }

    public function createOrder(string $cartSessionId, array $orderData): array
    {
        $this->db->beginTransaction();

        try {
            // Get cart data
            $cart = $this->cartService->getCart($cartSessionId);
            
            if (empty($cart['items'])) {
                throw new Exception('Cart is empty');
            }

            // Validate inventory again
            foreach ($cart['items'] as $item) {
                if (!$this->productService->checkInventory(
                    $item['product_id'], 
                    $item['product_variant_id'], 
                    $item['quantity']
                )) {
                    throw new Exception("Insufficient inventory for {$item['product_name']}");
                }
            }

            // Generate order number
            $orderNumber = $this->generateOrderNumber();

            // Create order
            $orderId = $this->db->insert('orders', [
                'order_number' => $orderNumber,
                'guest_email' => $orderData['guest_email'],
                'status' => 'pending',
                'payment_status' => 'pending',
                'currency' => 'USD',
                'subtotal' => $cart['totals']['subtotal'],
                'tax_amount' => $cart['totals']['tax_amount'],
                'shipping_amount' => $cart['totals']['shipping_amount'],
                'discount_amount' => $cart['totals']['discount_amount'],
                'total_amount' => $cart['totals']['total'],
                'billing_address' => json_encode($orderData['billing_address']),
                'shipping_address' => json_encode($orderData['shipping_address']),
                'shipping_method' => $orderData['shipping_method'],
                'notes' => $orderData['notes']
            ]);

            // Create order items and update inventory
            foreach ($cart['items'] as $item) {
                $this->db->insert('order_items', [
                    'order_id' => $orderId,
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'],
                    'product_name' => $item['product_name'],
                    'product_sku' => $item['variant_sku'] ?? $item['product_sku'],
                    'variant_name' => $item['variant_name'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'total' => $item['total']
                ]);

                // Update inventory
                $this->productService->updateInventory(
                    $item['product_id'],
                    $item['product_variant_id'],
                    -$item['quantity'], // Negative to decrease inventory
                    'sale',
                    $orderId
                );
            }

            // Record coupon usage if applicable
            if (!empty($cart['totals']['coupon'])) {
                $this->recordCouponUsage($cart['totals']['coupon']['code'], $orderId, $cart['totals']['discount_amount']);
            }

            // Clear cart
            $this->cartService->clearCart($cartSessionId);

            $this->db->commit();

            // Get the created order
            $order = $this->getOrderById($orderId);

            // Send confirmation email
            try {
                $email = $orderData['guest_email'];
                if ($email) {
                    $this->emailService->sendOrderConfirmation($email, $order);
                }
            } catch (Exception $e) {
                error_log("Failed to send order confirmation email: " . $e->getMessage());
            }

            return $order;

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    public function getOrderById(int $orderId): ?array
    {
        $sql = "SELECT * FROM orders WHERE id = ?";
        $order = $this->db->fetch($sql, [$orderId]);

        if (!$order) {
            return null;
        }

        // Get order items
        $items = $this->db->fetchAll(
            'SELECT * FROM order_items WHERE order_id = ? ORDER BY id',
            [$orderId]
        );

        // Get payment transactions
        $transactions = $this->db->fetchAll(
            'SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC',
            [$orderId]
        );

        return $this->formatOrder($order, $items, $transactions);
    }

    public function updateOrder(int $orderId, array $updateData): array
    {
        $allowedFields = ['billing_address', 'shipping_address', 'notes'];
        $updateFields = [];

        foreach ($allowedFields as $field) {
            if (isset($updateData[$field])) {
                if (in_array($field, ['billing_address', 'shipping_address'])) {
                    $updateFields[$field] = json_encode($updateData[$field]);
                } else {
                    $updateFields[$field] = $updateData[$field];
                }
            }
        }

        if (empty($updateFields)) {
            throw new Exception('No valid fields to update');
        }

        $updated = $this->db->update('orders', $updateFields, ['id' => $orderId]);

        if (!$updated) {
            throw new Exception('Order not found');
        }

        return $this->getOrderById($orderId);
    }

    public function updateOrderStatus(int $orderId, string $status, ?string $trackingNumber = null): array
    {
        $allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        
        if (!in_array($status, $allowedStatuses)) {
            throw new Exception('Invalid order status');
        }

        $updateData = ['status' => $status];
        
        if ($trackingNumber) {
            $updateData['tracking_number'] = $trackingNumber;
        }

        if ($status === 'shipped') {
            $updateData['fulfillment_status'] = 'fulfilled';
        }

        $updated = $this->db->update('orders', $updateData, ['id' => $orderId]);

        if (!$updated) {
            throw new Exception('Order not found');
        }

        $order = $this->getOrderById($orderId);

        // Send status update email
        try {
            $email = $order['guest_email'];
            if ($email) {
                $this->emailService->sendOrderStatusUpdate($email, $order);
            }
        } catch (Exception $e) {
            error_log("Failed to send order status update email: " . $e->getMessage());
        }

        return $order;
    }

    public function cancelOrder(int $orderId, string $reason = 'Customer request'): array
    {
        $this->db->beginTransaction();

        try {
            // Get order
            $order = $this->db->fetch(
                'SELECT * FROM orders WHERE id = ? AND status IN ("pending", "processing")',
                [$orderId]
            );

            if (!$order) {
                throw new Exception('Order not found or cannot be cancelled');
            }

            // Update order status
            $this->db->update('orders', [
                'status' => 'cancelled',
                'notes' => ($order['notes'] ? $order['notes'] . "\n" : '') . "Cancelled: {$reason}"
            ], ['id' => $orderId]);

            // Restore inventory
            $orderItems = $this->db->fetchAll(
                'SELECT * FROM order_items WHERE order_id = ?',
                [$orderId]
            );

            foreach ($orderItems as $item) {
                $this->productService->updateInventory(
                    $item['product_id'],
                    $item['product_variant_id'],
                    $item['quantity'], // Positive to increase inventory
                    'return',
                    $orderId
                );
            }

            $this->db->commit();

            return $this->getOrderById($orderId);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function generateOrderNumber(): string
    {
        $prefix = 'ORD';
        $timestamp = date('Ymd');
        $random = str_pad((string) mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        return "{$prefix}{$timestamp}{$random}";
    }

    private function recordCouponUsage(string $couponCode, int $orderId, float $discountAmount): void
    {
        $coupon = $this->db->fetch('SELECT id FROM coupons WHERE code = ?', [$couponCode]);
        
        if ($coupon) {
            $this->db->insert('coupon_usage', [
                'coupon_id' => $coupon['id'],
                'order_id' => $orderId,
                'discount_amount' => $discountAmount
            ]);

            // Update coupon usage count
            $this->db->query(
                'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
                [$coupon['id']]
            );
        }
    }

    private function formatOrder(array $order, array $items, array $transactions): array
    {
        return [
            'id' => (int) $order['id'],
            'order_number' => $order['order_number'],
            'guest_email' => $order['guest_email'],
            'status' => $order['status'],
            'payment_status' => $order['payment_status'],
            'fulfillment_status' => $order['fulfillment_status'],
            'currency' => $order['currency'],
            'subtotal' => (float) $order['subtotal'],
            'tax_amount' => (float) $order['tax_amount'],
            'shipping_amount' => (float) $order['shipping_amount'],
            'discount_amount' => (float) $order['discount_amount'],
            'total_amount' => (float) $order['total_amount'],
            'billing_address' => json_decode($order['billing_address'], true),
            'shipping_address' => json_decode($order['shipping_address'], true),
            'shipping_method' => $order['shipping_method'],
            'tracking_number' => $order['tracking_number'],
            'notes' => $order['notes'],
            'items' => array_map([$this, 'formatOrderItem'], $items),
            'transactions' => array_map([$this, 'formatTransaction'], $transactions),
            'created_at' => $order['created_at'],
            'updated_at' => $order['updated_at']
        ];
    }

    private function formatOrderItem(array $item): array
    {
        return [
            'id' => (int) $item['id'],
            'product_id' => (int) $item['product_id'],
            'product_variant_id' => $item['product_variant_id'] ? (int) $item['product_variant_id'] : null,
            'product_name' => $item['product_name'],
            'product_sku' => $item['product_sku'],
            'variant_name' => $item['variant_name'],
            'quantity' => (int) $item['quantity'],
            'price' => (float) $item['price'],
            'total' => (float) $item['total']
        ];
    }

    private function formatTransaction(array $transaction): array
    {
        return [
            'id' => (int) $transaction['id'],
            'transaction_id' => $transaction['transaction_id'],
            'payment_method' => $transaction['payment_method'],
            'payment_type' => $transaction['payment_type'],
            'status' => $transaction['status'],
            'amount' => (float) $transaction['amount'],
            'currency' => $transaction['currency'],
            'gateway_transaction_id' => $transaction['gateway_transaction_id'],
            'processed_at' => $transaction['processed_at'],
            'created_at' => $transaction['created_at']
        ];
    }
}