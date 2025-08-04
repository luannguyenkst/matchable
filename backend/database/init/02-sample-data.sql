-- Sample data for development and testing
USE matchable_checkout;

-- Insert sample categories
INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', TRUE, 1),
('Clothing', 'clothing', 'Fashion and apparel', TRUE, 2),
('Books', 'books', 'Books and publications', TRUE, 3),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies', TRUE, 4),
('Sports', 'sports', 'Sports equipment and apparel', TRUE, 5);

-- Insert subcategories
INSERT INTO categories (parent_id, name, slug, description, is_active, sort_order) VALUES
(1, 'Smartphones', 'smartphones', 'Mobile phones and accessories', TRUE, 1),
(1, 'Laptops', 'laptops', 'Laptop computers and accessories', TRUE, 2),
(1, 'Headphones', 'headphones', 'Audio devices and headphones', TRUE, 3),
(2, 'Men''s Clothing', 'mens-clothing', 'Clothing for men', TRUE, 1),
(2, 'Women''s Clothing', 'womens-clothing', 'Clothing for women', TRUE, 2),
(2, 'Shoes', 'shoes', 'Footwear for all', TRUE, 3);

-- Insert sample products
INSERT INTO products (category_id, sku, name, slug, short_description, description, price, compare_price, cost_price, track_inventory, inventory_quantity, weight, is_active, is_featured, meta_title, meta_description, tags) VALUES
(6, 'IPHONE15-128', 'iPhone 15 128GB', 'iphone-15-128gb', 'Latest iPhone with advanced features', 'The iPhone 15 features a stunning Super Retina XDR display, powerful A17 Pro chip, and an advanced camera system. Experience incredible performance and all-day battery life.', 799.00, 899.00, 650.00, TRUE, 50, 0.17, TRUE, TRUE, 'iPhone 15 128GB - Buy Now', 'Get the latest iPhone 15 with 128GB storage. Free shipping and warranty included.', '["smartphone", "apple", "iphone", "mobile"]'),
(7, 'MBP-M3-14', 'MacBook Pro 14" M3', 'macbook-pro-14-m3', 'Professional laptop with M3 chip', 'MacBook Pro 14-inch with M3 chip delivers exceptional performance for professionals. Features Liquid Retina XDR display, advanced camera, and all-day battery life.', 1999.00, 2199.00, 1600.00, TRUE, 25, 1.61, TRUE, TRUE, 'MacBook Pro 14" M3 - Professional Laptop', 'Buy MacBook Pro 14" with M3 chip. Perfect for professionals and creatives.', '["laptop", "apple", "macbook", "professional"]'),
(8, 'AIRPODS-PRO-2', 'AirPods Pro 2nd Gen', 'airpods-pro-2nd-gen', 'Premium wireless earbuds', 'AirPods Pro 2nd generation with Active Noise Cancellation, Transparency mode, and Spatial Audio. Up to 6 hours of listening time with ANC on.', 249.00, 279.00, 180.00, TRUE, 100, 0.05, TRUE, TRUE, 'AirPods Pro 2nd Gen - Premium Audio', 'Experience premium audio with AirPods Pro 2nd generation. Free shipping available.', '["headphones", "apple", "airpods", "wireless"]'),
(9, 'POLO-SHIRT-M', 'Classic Polo Shirt', 'classic-polo-shirt', 'Comfortable cotton polo shirt', 'Premium quality polo shirt made from 100% cotton. Perfect for casual and semi-formal occasions. Available in multiple colors and sizes.', 49.99, 69.99, 25.00, TRUE, 200, 0.20, TRUE, FALSE, 'Classic Polo Shirt - Comfortable Cotton', 'Shop our classic polo shirt collection. High quality cotton, multiple colors available.', '["clothing", "mens", "polo", "cotton"]'),
(10, 'JEANS-SLIM-W32', 'Slim Fit Jeans', 'slim-fit-jeans', 'Modern slim fit denim jeans', 'Stylish slim fit jeans crafted from premium denim. Comfortable stretch fabric with modern cut. Perfect for everyday wear.', 79.99, 99.99, 40.00, TRUE, 150, 0.60, TRUE, FALSE, 'Slim Fit Jeans - Premium Denim', 'Shop premium slim fit jeans. Comfortable stretch denim in various sizes.', '["clothing", "womens", "jeans", "denim"]'),
(11, 'SNEAKERS-WHITE-9', 'White Canvas Sneakers', 'white-canvas-sneakers', 'Classic white canvas sneakers', 'Timeless white canvas sneakers with rubber sole. Comfortable and versatile for any casual outfit. Durable construction for everyday wear.', 59.99, 79.99, 30.00, TRUE, 80, 0.80, TRUE, FALSE, 'White Canvas Sneakers - Classic Style', 'Shop classic white canvas sneakers. Comfortable and versatile for any occasion.', '["shoes", "sneakers", "canvas", "white"]');

-- Insert product images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(1, '/images/products/iphone15-1.jpg', 'iPhone 15 front view', TRUE, 0),
(1, '/images/products/iphone15-2.jpg', 'iPhone 15 back view', FALSE, 1),
(1, '/images/products/iphone15-3.jpg', 'iPhone 15 side view', FALSE, 2),
(2, '/images/products/macbook-1.jpg', 'MacBook Pro 14 inch open', TRUE, 0),
(2, '/images/products/macbook-2.jpg', 'MacBook Pro 14 inch closed', FALSE, 1),
(3, '/images/products/airpods-1.jpg', 'AirPods Pro 2nd gen in case', TRUE, 0),
(3, '/images/products/airpods-2.jpg', 'AirPods Pro 2nd gen out of case', FALSE, 1),
(4, '/images/products/polo-1.jpg', 'Classic polo shirt front', TRUE, 0),
(4, '/images/products/polo-2.jpg', 'Classic polo shirt back', FALSE, 1),
(5, '/images/products/jeans-1.jpg', 'Slim fit jeans front view', TRUE, 0),
(6, '/images/products/sneakers-1.jpg', 'White canvas sneakers', TRUE, 0);

-- Insert product variants
INSERT INTO product_variants (product_id, sku, name, price, inventory_quantity, attributes, is_active) VALUES
(1, 'IPHONE15-128-BLK', 'iPhone 15 128GB Black', 799.00, 25, '{"color": "Black", "storage": "128GB"}', TRUE),
(1, 'IPHONE15-128-WHT', 'iPhone 15 128GB White', 799.00, 25, '{"color": "White", "storage": "128GB"}', TRUE),
(4, 'POLO-SHIRT-S-RED', 'Classic Polo Shirt Small Red', 49.99, 50, '{"size": "S", "color": "Red"}', TRUE),
(4, 'POLO-SHIRT-M-RED', 'Classic Polo Shirt Medium Red', 49.99, 50, '{"size": "M", "color": "Red"}', TRUE),
(4, 'POLO-SHIRT-L-RED', 'Classic Polo Shirt Large Red', 49.99, 50, '{"size": "L", "color": "Red"}', TRUE),
(4, 'POLO-SHIRT-S-BLU', 'Classic Polo Shirt Small Blue', 49.99, 50, '{"size": "S", "color": "Blue"}', TRUE),
(5, 'JEANS-SLIM-W30', 'Slim Fit Jeans W30', 79.99, 30, '{"waist": "30", "inseam": "32"}', TRUE),
(5, 'JEANS-SLIM-W32', 'Slim Fit Jeans W32', 79.99, 40, '{"waist": "32", "inseam": "32"}', TRUE),
(5, 'JEANS-SLIM-W34', 'Slim Fit Jeans W34', 79.99, 35, '{"waist": "34", "inseam": "32"}', TRUE),
(6, 'SNEAKERS-WHT-8', 'White Canvas Sneakers Size 8', 59.99, 20, '{"size": "8", "color": "White"}', TRUE),
(6, 'SNEAKERS-WHT-9', 'White Canvas Sneakers Size 9', 59.99, 25, '{"size": "9", "color": "White"}', TRUE),
(6, 'SNEAKERS-WHT-10', 'White Canvas Sneakers Size 10', 59.99, 20, '{"size": "10", "color": "White"}', TRUE);

-- Insert sample coupons
INSERT INTO coupons (code, type, value, minimum_amount, usage_limit, user_limit, is_active, starts_at, expires_at) VALUES
('WELCOME10', 'percentage', 10.00, 50.00, 1000, 1, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY)),
('SAVE20', 'fixed_amount', 20.00, 100.00, 500, 1, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY)),
('FREESHIP', 'free_shipping', 0.00, 75.00, 2000, 2, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY)),
('SUMMER25', 'percentage', 25.00, 200.00, 100, 1, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 45 DAY));