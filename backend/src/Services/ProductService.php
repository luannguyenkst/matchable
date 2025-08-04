<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use Exception;

class ProductService
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getProducts(int $page = 1, int $perPage = 20, array $filters = [], string $sort = 'name', string $direction = 'asc'): array
    {
        $offset = ($page - 1) * $perPage;
        $allowedSorts = ['name', 'price', 'created_at', 'featured'];
        $allowedDirections = ['asc', 'desc'];

        $sort = in_array($sort, $allowedSorts) ? $sort : 'name';
        $direction = in_array($direction, $allowedDirections) ? $direction : 'asc';

        // Build WHERE clause
        $whereClause = ['p.is_active = 1'];
        $params = [];

        if (!empty($filters['category_id'])) {
            $whereClause[] = 'p.category_id = ?';
            $params[] = $filters['category_id'];
        }

        if (!empty($filters['search'])) {
            $whereClause[] = 'MATCH(p.name, p.short_description, p.description) AGAINST(? IN BOOLEAN MODE)';
            $params[] = $filters['search'];
        }

        if ($filters['min_price'] !== null) {
            $whereClause[] = 'p.price >= ?';
            $params[] = $filters['min_price'];
        }

        if ($filters['max_price'] !== null) {
            $whereClause[] = 'p.price <= ?';
            $params[] = $filters['max_price'];
        }

        if ($filters['featured'] === true) {
            $whereClause[] = 'p.is_featured = 1';
        }

        $whereSQL = implode(' AND ', $whereClause);

        // Get total count
        $countSQL = "
            SELECT COUNT(*) as total
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE {$whereSQL}
        ";
        $totalResult = $this->db->fetch($countSQL, $params);
        $total = (int) $totalResult['total'];

        // Get products
        $sql = "
            SELECT 
                p.*,
                c.name as category_name,
                c.slug as category_slug,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
                (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as image_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE {$whereSQL}
            ORDER BY p.{$sort} {$direction}
            LIMIT ? OFFSET ?
        ";

        $params[] = $perPage;
        $params[] = $offset;

        $products = $this->db->fetchAll($sql, $params);

        // Format products
        $formattedProducts = array_map([$this, 'formatProduct'], $products);

        return [
            'products' => $formattedProducts,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => ceil($total / $perPage),
                'has_next' => $page < ceil($total / $perPage),
                'has_prev' => $page > 1
            ]
        ];
    }

    public function getProductById(int $id): ?array
    {
        $sql = "
            SELECT 
                p.*,
                c.name as category_name,
                c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.is_active = 1
        ";

        $product = $this->db->fetch($sql, [$id]);

        if (!$product) {
            return null;
        }

        // Get product images
        $images = $this->db->fetchAll(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
            [$id]
        );

        // Get product variants
        $variants = $this->db->fetchAll(
            'SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY id',
            [$id]
        );

        $product = $this->formatProduct($product);
        $product['images'] = $images;
        $product['variants'] = array_map([$this, 'formatVariant'], $variants);

        return $product;
    }

    public function getFeaturedProducts(int $limit = 8): array
    {
        $sql = "
            SELECT 
                p.*,
                c.name as category_name,
                c.slug as category_slug,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1 AND p.is_featured = 1
            ORDER BY p.created_at DESC
            LIMIT ?
        ";

        $products = $this->db->fetchAll($sql, [$limit]);
        return array_map([$this, 'formatProduct'], $products);
    }

    public function searchProducts(string $query, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;

        // Get total count
        $countSQL = "
            SELECT COUNT(*) as total
            FROM products p
            WHERE p.is_active = 1 
            AND MATCH(p.name, p.short_description, p.description) AGAINST(? IN BOOLEAN MODE)
        ";
        $totalResult = $this->db->fetch($countSQL, [$query]);
        $total = (int) $totalResult['total'];

        // Get products with relevance score
        $sql = "
            SELECT 
                p.*,
                c.name as category_name,
                c.slug as category_slug,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
                MATCH(p.name, p.short_description, p.description) AGAINST(? IN BOOLEAN MODE) as relevance
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1 
            AND MATCH(p.name, p.short_description, p.description) AGAINST(? IN BOOLEAN MODE)
            ORDER BY relevance DESC, p.name ASC
            LIMIT ? OFFSET ?
        ";

        $products = $this->db->fetchAll($sql, [$query, $query, $perPage, $offset]);

        return [
            'products' => array_map([$this, 'formatProduct'], $products),
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => ceil($total / $perPage),
                'has_next' => $page < ceil($total / $perPage),
                'has_prev' => $page > 1
            ]
        ];
    }

    public function getProductVariants(int $productId): array
    {
        $variants = $this->db->fetchAll(
            'SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY id',
            [$productId]
        );

        return array_map([$this, 'formatVariant'], $variants);
    }

    public function getCategories(?int $parentId = null, bool $includeProducts = false): array
    {
        $sql = "
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as child_count
            FROM categories c
            WHERE c.is_active = 1
        ";

        $params = [];

        if ($parentId !== null) {
            $sql .= " AND c.parent_id = ?";
            $params[] = $parentId;
        } else {
            $sql .= " AND c.parent_id IS NULL";
        }

        $sql .= " ORDER BY c.sort_order, c.name";

        $categories = $this->db->fetchAll($sql, $params);

        if ($includeProducts) {
            foreach ($categories as &$category) {
                $productCount = $this->db->fetch(
                    'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1',
                    [$category['id']]
                );
                $category['product_count'] = (int) $productCount['count'];
            }
        }

        return $categories;
    }

    public function getProductsByCategory(int $categoryId, int $page = 1, int $perPage = 20, string $sort = 'name', string $direction = 'asc'): array
    {
        $filters = ['category_id' => $categoryId];
        return $this->getProducts($page, $perPage, $filters, $sort, $direction);
    }

    public function checkInventory(int $productId, ?int $variantId = null, int $quantity = 1): bool
    {
        if ($variantId) {
            $sql = "
                SELECT inventory_quantity 
                FROM product_variants 
                WHERE id = ? AND product_id = ? AND is_active = 1
            ";
            $result = $this->db->fetch($sql, [$variantId, $productId]);
        } else {
            $sql = "
                SELECT inventory_quantity, track_inventory 
                FROM products 
                WHERE id = ? AND is_active = 1
            ";
            $result = $this->db->fetch($sql, [$productId]);
            
            if ($result && !$result['track_inventory']) {
                return true; // If not tracking inventory, always available
            }
        }

        if (!$result) {
            return false;
        }

        return (int) $result['inventory_quantity'] >= $quantity;
    }

    public function updateInventory(int $productId, ?int $variantId = null, int $quantityChange = 0, string $type = 'sale', ?int $referenceId = null): bool
    {
        $this->db->beginTransaction();

        try {
            if ($variantId) {
                $currentInventory = $this->db->fetch(
                    'SELECT inventory_quantity FROM product_variants WHERE id = ? AND product_id = ?',
                    [$variantId, $productId]
                );
                
                $newQuantity = $currentInventory['inventory_quantity'] + $quantityChange;
                
                $this->db->update('product_variants', [
                    'inventory_quantity' => $newQuantity
                ], ['id' => $variantId]);
            } else {
                $currentInventory = $this->db->fetch(
                    'SELECT inventory_quantity FROM products WHERE id = ?',
                    [$productId]
                );
                
                $newQuantity = $currentInventory['inventory_quantity'] + $quantityChange;
                
                $this->db->update('products', [
                    'inventory_quantity' => $newQuantity
                ], ['id' => $productId]);
            }

            // Log inventory movement
            $this->db->insert('inventory_movements', [
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'type' => $type,
                'quantity_change' => $quantityChange,
                'quantity_after' => $newQuantity,
                'reference_type' => $referenceId ? 'order' : 'manual',
                'reference_id' => $referenceId
            ]);

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    private function formatProduct(array $product): array
    {
        return [
            'id' => (int) $product['id'],
            'category_id' => $product['category_id'] ? (int) $product['category_id'] : null,
            'category_name' => $product['category_name'] ?? null,
            'category_slug' => $product['category_slug'] ?? null,
            'sku' => $product['sku'],
            'name' => $product['name'],
            'slug' => $product['slug'],
            'short_description' => $product['short_description'],
            'description' => $product['description'],
            'price' => (float) $product['price'],
            'compare_price' => $product['compare_price'] ? (float) $product['compare_price'] : null,
            'inventory_quantity' => (int) $product['inventory_quantity'],
            'track_inventory' => (bool) $product['track_inventory'],
            'low_stock_threshold' => (int) $product['low_stock_threshold'],
            'weight' => $product['weight'] ? (float) $product['weight'] : null,
            'is_active' => (bool) $product['is_active'],
            'is_featured' => (bool) $product['is_featured'],
            'primary_image' => $product['primary_image'] ?? null,
            'image_count' => isset($product['image_count']) ? (int) $product['image_count'] : 0,
            'tags' => $product['tags'] ? json_decode($product['tags'], true) : [],
            'meta_title' => $product['meta_title'],
            'meta_description' => $product['meta_description'],
            'created_at' => $product['created_at'],
            'updated_at' => $product['updated_at']
        ];
    }

    private function formatVariant(array $variant): array
    {
        return [
            'id' => (int) $variant['id'],
            'product_id' => (int) $variant['product_id'],
            'sku' => $variant['sku'],
            'name' => $variant['name'],
            'price' => $variant['price'] ? (float) $variant['price'] : null,
            'compare_price' => $variant['compare_price'] ? (float) $variant['compare_price'] : null,
            'inventory_quantity' => (int) $variant['inventory_quantity'],
            'weight' => $variant['weight'] ? (float) $variant['weight'] : null,
            'attributes' => $variant['attributes'] ? json_decode($variant['attributes'], true) : [],
            'is_active' => (bool) $variant['is_active'],
            'created_at' => $variant['created_at'],
            'updated_at' => $variant['updated_at']
        ];
    }
}