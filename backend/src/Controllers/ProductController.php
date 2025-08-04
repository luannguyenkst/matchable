<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\ProductService;
use App\Core\Validator;
use Exception;

class ProductController extends BaseController
{
    private ProductService $productService;

    public function __construct()
    {
        parent::__construct();
        $this->productService = new ProductService();
    }

    public function index(): array
    {
        try {
            $page = $this->getIntQueryParam('page', 1);
            $perPage = $this->getIntQueryParam('per_page', 20);
            $categoryId = $this->getIntQueryParam('category_id');
            $search = $this->getQueryParam('search');
            $sort = $this->getQueryParam('sort', 'name');
            $direction = $this->getQueryParam('direction', 'asc');
            $minPrice = $this->getQueryParam('min_price');
            $maxPrice = $this->getQueryParam('max_price');
            $featured = $this->getQueryParam('featured');

            $filters = [
                'category_id' => $categoryId,
                'search' => $search,
                'min_price' => $minPrice ? (float) $minPrice : null,
                'max_price' => $maxPrice ? (float) $maxPrice : null,
                'featured' => $featured === 'true' ? true : null
            ];

            $result = $this->productService->getProducts($page, $perPage, $filters, $sort, $direction);

            return $this->success($result);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function show(string $id): array
    {
        try {
            $productId = $this->sanitizeInt($id);
            $product = $this->productService->getProductById($productId);

            if (!$product) {
                return $this->error('Product not found', 404);
            }

            return $this->success(['product' => $product]);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function featured(): array
    {
        try {
            $limit = $this->getIntQueryParam('limit', 8);
            $products = $this->productService->getFeaturedProducts($limit);

            return $this->success(['products' => $products]);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function search(): array
    {
        try {
            $query = $this->getQueryParam('q');
            $page = $this->getIntQueryParam('page', 1);
            $perPage = $this->getIntQueryParam('per_page', 20);

            if (empty($query)) {
                return $this->error('Search query is required', 400);
            }

            if (strlen($query) < 2) {
                return $this->error('Search query must be at least 2 characters', 400);
            }

            $result = $this->productService->searchProducts($query, $page, $perPage);

            return $this->success($result);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function getVariants(string $id): array
    {
        try {
            $productId = $this->sanitizeInt($id);
            $variants = $this->productService->getProductVariants($productId);

            return $this->success(['variants' => $variants]);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function getCategories(): array
    {
        try {
            $parentId = $this->getIntQueryParam('parent_id');
            $includeProducts = $this->getQueryParam('include_products') === 'true';
            
            $categories = $this->productService->getCategories($parentId, $includeProducts);

            return $this->success(['categories' => $categories]);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function getProductsByCategory(string $id): array
    {
        try {
            $categoryId = $this->sanitizeInt($id);
            $page = $this->getIntQueryParam('page', 1);
            $perPage = $this->getIntQueryParam('per_page', 20);
            $sort = $this->getQueryParam('sort', 'name');
            $direction = $this->getQueryParam('direction', 'asc');

            $result = $this->productService->getProductsByCategory($categoryId, $page, $perPage, $sort, $direction);

            return $this->success($result);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}