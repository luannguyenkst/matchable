<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Services\ProductService;
use Ramsey\Uuid\Uuid;
use Exception;

class CartService
{
    private Database $db;
    private ProductService $productService;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->productService = new ProductService();
    }

    public function createCartSession(): string
    {
        $sessionId = Uuid::uuid4()->toString();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

        $this->db->insert('cart_sessions', [
            'id' => $sessionId,
            'expires_at' => $expiresAt
        ]);

        return $sessionId;
    }

    public function getCart(string $sessionId): array
    {
        // Check if cart session exists and is not expired
        $session = $this->db->fetch(
            'SELECT * FROM cart_sessions WHERE id = ? AND expires_at > NOW()',
            [$sessionId]
        );

        if (!$session) {
            return [
                'cart' => null,
                'items' => [],
                'totals' => $this->getEmptyTotals()
            ];
        }

        // Get cart items with product information
        $items = $this->db->fetchAll("
            SELECT 
                ci.*,
                p.name as product_name,
                p.slug as product_slug,
                p.sku as product_sku,
                p.track_inventory,
                p.inventory_quantity as product_inventory,
                pv.name as variant_name,
                pv.sku as variant_sku,
                pv.inventory_quantity as variant_inventory,
                pv.attributes as variant_attributes,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
            FROM cart_items ci
            LEFT JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
            WHERE ci.cart_session_id = ?
            ORDER BY ci.created_at DESC
        ", [$sessionId]);

        $formattedItems = array_map([$this, 'formatCartItem'], $items);
        $totals = $this->calculateTotals($formattedItems);

        return [
            'cart' => [
                'id' => $session['id'],
                'expires_at' => $session['expires_at'],
                'created_at' => $session['created_at'],
                'updated_at' => $session['updated_at']
            ],
            'items' => $formattedItems,
            'totals' => $totals
        ];
    }

    public function addItem(string $sessionId, int $productId, int $quantity, ?int $variantId = null): array
    {
        // Validate inventory
        if (!$this->productService->checkInventory($productId, $variantId, $quantity)) {
            throw new Exception('Insufficient inventory');
        }

        // Get product price
        $price = $this->getProductPrice($productId, $variantId);
        
        if (!$price) {
            throw new Exception('Product not found or not available');
        }

        // Check if item already exists in cart
        $existingItem = $this->db->fetch("
            SELECT * FROM cart_items 
            WHERE cart_session_id = ? AND product_id = ? AND product_variant_id " . 
            ($variantId ? "= ?" : "IS NULL"),
            $variantId ? [$sessionId, $productId, $variantId] : [$sessionId, $productId]
        );

        if ($existingItem) {
            // Update existing item
            $newQuantity = $existingItem['quantity'] + $quantity;
            
            // Check inventory for new quantity
            if (!$this->productService->checkInventory($productId, $variantId, $newQuantity)) {
                throw new Exception('Insufficient inventory for requested quantity');
            }

            $this->db->update('cart_items', [
                'quantity' => $newQuantity,
                'price' => $price
            ], ['id' => $existingItem['id']]);
        } else {
            // Add new item
            $this->db->insert('cart_items', [
                'cart_session_id' => $sessionId,
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'quantity' => $quantity,
                'price' => $price
            ]);
        }

        // Update cart session timestamp
        $this->updateCartSession($sessionId);

        return $this->getCart($sessionId);
    }

    public function updateItem(string $sessionId, int $itemId, int $quantity): array
    {
        // Get cart item
        $item = $this->db->fetch(
            'SELECT * FROM cart_items WHERE id = ? AND cart_session_id = ?',
            [$itemId, $sessionId]
        );

        if (!$item) {
            throw new Exception('Cart item not found');
        }

        // Check inventory
        if (!$this->productService->checkInventory($item['product_id'], $item['product_variant_id'], $quantity)) {
            throw new Exception('Insufficient inventory');
        }

        // Update quantity
        $this->db->update('cart_items', [
            'quantity' => $quantity
        ], ['id' => $itemId]);

        // Update cart session timestamp
        $this->updateCartSession($sessionId);

        return $this->getCart($sessionId);
    }

    public function removeItem(string $sessionId, int $itemId): array
    {
        $this->db->delete('cart_items', [
            'id' => $itemId,
            'cart_session_id' => $sessionId
        ]);

        // Update cart session timestamp
        $this->updateCartSession($sessionId);

        return $this->getCart($sessionId);
    }

    public function clearCart(string $sessionId): bool
    {
        $this->db->delete('cart_items', ['cart_session_id' => $sessionId]);
        return true;
    }

    public function applyCoupon(string $sessionId, string $code): array
    {
        // Get coupon
        $coupon = $this->db->fetch("
            SELECT * FROM coupons 
            WHERE code = ? 
            AND is_active = 1 
            AND (starts_at IS NULL OR starts_at <= NOW()) 
            AND (expires_at IS NULL OR expires_at >= NOW())
        ", [$code]);

        if (!$coupon) {
            throw new Exception('Invalid or expired coupon code');
        }

        // Check usage limits
        if ($coupon['usage_limit'] && $coupon['usage_count'] >= $coupon['usage_limit']) {
            throw new Exception('Coupon usage limit exceeded');
        }

        // Get cart totals to check minimum amount
        $cart = $this->getCart($sessionId);
        
        if ($coupon['minimum_amount'] > 0 && $cart['totals']['subtotal'] < $coupon['minimum_amount']) {
            throw new Exception("Minimum order amount of $" . number_format($coupon['minimum_amount'], 2) . " required");
        }

        // Store coupon in session (you might want to use a separate table for this)
        session_start();
        $_SESSION['cart_coupon_' . $sessionId] = $coupon;

        return $this->getCart($sessionId);
    }

    public function removeCoupon(string $sessionId): array
    {
        session_start();
        unset($_SESSION['cart_coupon_' . $sessionId]);

        return $this->getCart($sessionId);
    }

    private function getProductPrice(int $productId, ?int $variantId = null): ?float
    {
        if ($variantId) {
            $result = $this->db->fetch(
                'SELECT pv.price, p.price as product_price FROM product_variants pv 
                 LEFT JOIN products p ON pv.product_id = p.id 
                 WHERE pv.id = ? AND pv.product_id = ? AND pv.is_active = 1 AND p.is_active = 1',
                [$variantId, $productId]
            );
            
            return $result ? (float) ($result['price'] ?? $result['product_price']) : null;
        } else {
            $result = $this->db->fetch(
                'SELECT price FROM products WHERE id = ? AND is_active = 1',
                [$productId]
            );
            
            return $result ? (float) $result['price'] : null;
        }
    }

    private function calculateTotals(array $items): array
    {
        $subtotal = 0;
        
        foreach ($items as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }

        // Get applied coupon if any
        session_start();
        $coupon = $_SESSION['cart_coupon_' . ($items[0]['cart_session_id'] ?? '')] ?? null;
        
        $discountAmount = 0;
        if ($coupon) {
            $discountAmount = $this->calculateDiscount($subtotal, $coupon);
        }

        // Calculate tax (simplified - 8.5% for now)
        $taxRate = 0.085;
        $taxableAmount = $subtotal - $discountAmount;
        $taxAmount = $taxableAmount * $taxRate;

        // Calculate shipping (simplified - free over $75, otherwise $10)
        $shippingAmount = ($subtotal >= 75) ? 0 : 10;
        
        // Apply free shipping coupon
        if ($coupon && $coupon['type'] === 'free_shipping') {
            $shippingAmount = 0;
        }

        $total = $subtotal + $taxAmount + $shippingAmount - $discountAmount;

        return [
            'subtotal' => round($subtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'shipping_amount' => round($shippingAmount, 2),
            'discount_amount' => round($discountAmount, 2),
            'total' => round($total, 2),
            'coupon' => $coupon ? [
                'code' => $coupon['code'],
                'type' => $coupon['type'],
                'value' => (float) $coupon['value']
            ] : null
        ];
    }

    private function calculateDiscount(float $subtotal, array $coupon): float
    {
        switch ($coupon['type']) {
            case 'percentage':
                return $subtotal * ($coupon['value'] / 100);
            case 'fixed_amount':
                return min($coupon['value'], $subtotal);
            case 'free_shipping':
                return 0; // Discount is handled in shipping calculation
            default:
                return 0;
        }
    }

    private function formatCartItem(array $item): array
    {
        return [
            'id' => (int) $item['id'],
            'cart_session_id' => $item['cart_session_id'],
            'product_id' => (int) $item['product_id'],
            'product_variant_id' => $item['product_variant_id'] ? (int) $item['product_variant_id'] : null,
            'product_name' => $item['product_name'],
            'product_slug' => $item['product_slug'],
            'product_sku' => $item['product_sku'],
            'product_image' => $item['product_image'],
            'variant_name' => $item['variant_name'],
            'variant_sku' => $item['variant_sku'],
            'variant_attributes' => $item['variant_attributes'] ? json_decode($item['variant_attributes'], true) : null,
            'quantity' => (int) $item['quantity'],
            'price' => (float) $item['price'],
            'total' => (float) $item['price'] * (int) $item['quantity'],
            'in_stock' => $this->checkItemStock($item),
            'created_at' => $item['created_at'],
            'updated_at' => $item['updated_at']
        ];
    }

    private function checkItemStock(array $item): bool
    {
        if (!$item['track_inventory']) {
            return true;
        }

        $availableQuantity = $item['product_variant_id'] 
            ? (int) $item['variant_inventory']
            : (int) $item['product_inventory'];

        return $availableQuantity >= (int) $item['quantity'];
    }

    private function updateCartSession(string $sessionId): void
    {
        $this->db->update('cart_sessions', [
            'updated_at' => date('Y-m-d H:i:s')
        ], ['id' => $sessionId]);
    }

    private function getEmptyTotals(): array
    {
        return [
            'subtotal' => 0.00,
            'tax_amount' => 0.00,
            'shipping_amount' => 0.00,
            'discount_amount' => 0.00,
            'total' => 0.00,
            'coupon' => null
        ];
    }
}