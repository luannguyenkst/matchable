<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\CartService;
use App\Core\Validator;
use Exception;

class CartController extends BaseController
{
    private CartService $cartService;

    public function __construct()
    {
        parent::__construct();
        $this->cartService = new CartService();
    }

    public function getCart(): array
    {
        try {
            $sessionId = $this->getCartSessionId();
            
            if (!$sessionId) {
                return $this->success(['cart' => null, 'items' => [], 'totals' => $this->getEmptyTotals()]);
            }

            $cart = $this->cartService->getCart($sessionId);
            
            return $this->success($cart);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function addItem(): array
    {
        try {
            $validator = new Validator($this->input);
            $validator->required(['product_id', 'quantity'])
                     ->integer('product_id')
                     ->integer('quantity')
                     ->min('quantity', 1);

            if (isset($this->input['product_variant_id'])) {
                $validator->integer('product_variant_id');
            }

            if (!$validator->isValid()) {
                return $this->error('Validation failed', 422, $validator->getErrors());
            }

            $sessionId = $this->getCartSessionId();
            
            if (!$sessionId) {
                $sessionId = $this->cartService->createCartSession();
                $this->setCartSessionId($sessionId);
            }

            $result = $this->cartService->addItem(
                $sessionId,
                (int) $this->input['product_id'],
                (int) $this->input['quantity'],
                isset($this->input['product_variant_id']) ? (int) $this->input['product_variant_id'] : null
            );

            return $this->success($result, 'Item added to cart');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function updateItem(string $id): array
    {
        try {
            $itemId = $this->sanitizeInt($id);
            
            $validator = new Validator($this->input);
            $validator->required(['quantity'])
                     ->integer('quantity')
                     ->min('quantity', 1);

            if (!$validator->isValid()) {
                return $this->error('Validation failed', 422, $validator->getErrors());
            }

            $sessionId = $this->getCartSessionId();
            
            if (!$sessionId) {
                return $this->error('Cart session not found', 404);
            }

            $result = $this->cartService->updateItem($sessionId, $itemId, (int) $this->input['quantity']);

            return $this->success($result, 'Cart item updated');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function removeItem(string $id): array
    {
        try {
            $itemId = $this->sanitizeInt($id);
            $sessionId = $this->getCartSessionId();
            
            if (!$sessionId) {
                return $this->error('Cart session not found', 404);
            }

            $result = $this->cartService->removeItem($sessionId, $itemId);

            return $this->success($result, 'Item removed from cart');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function clearCart(): array
    {
        try {
            $sessionId = $this->getCartSessionId();
            
            if (!$sessionId) {
                return $this->success(['message' => 'Cart is already empty']);
            }

            $this->cartService->clearCart($sessionId);

            return $this->success(null, 'Cart cleared');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function applyCoupon(): array
    {
        try {
            $validator = new Validator($this->input);
            $validator->required(['code'])
                     ->minLength('code', 1)
                     ->maxLength('code', 50);

            if (!$validator->isValid()) {
                return $this->error('Validation failed', 422, $validator->getErrors());
            }

            $sessionId = $this->getCartSessionId();
            
            if (!$sessionId) {
                return $this->error('Cart session not found', 404);
            }

            $result = $this->cartService->applyCoupon($sessionId, $this->input['code']);

            return $this->success($result, 'Coupon applied successfully');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function removeCoupon(): array
    {
        try {
            $sessionId = $this->getCartSessionId();
            
            if (!$sessionId) {
                return $this->error('Cart session not found', 404);
            }

            $result = $this->cartService->removeCoupon($sessionId);

            return $this->success($result, 'Coupon removed');

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    private function getEmptyTotals(): array
    {
        return [
            'subtotal' => 0.00,
            'tax_amount' => 0.00,
            'shipping_amount' => 0.00,
            'discount_amount' => 0.00,
            'total' => 0.00
        ];
    }
}