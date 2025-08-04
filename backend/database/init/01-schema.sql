-- Initialize database with schema
USE matchable_checkout;

-- Matchable Personal Training Sessions Database Schema

-- Users table for authentication and user management
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_verification_token (email_verification_token),
    INDEX idx_reset_token (reset_password_token)
);

-- User addresses for shipping and billing
CREATE TABLE user_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('billing', 'shipping') NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'US',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_user_type (user_id, type)
);

-- Product categories
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_slug (slug),
    INDEX idx_active_sort (is_active, sort_order)
);

-- Products table
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    track_inventory BOOLEAN DEFAULT TRUE,
    inventory_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    weight DECIMAL(8, 2),
    dimensions_length DECIMAL(8, 2),
    dimensions_width DECIMAL(8, 2),
    dimensions_height DECIMAL(8, 2),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category_id (category_id),
    INDEX idx_sku (sku),
    INDEX idx_slug (slug),
    INDEX idx_active_featured (is_active, is_featured),
    INDEX idx_price (price),
    FULLTEXT idx_search (name, short_description, description)
);

-- Product images
CREATE TABLE product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_primary (product_id, is_primary)
);

-- Product variants (for size, color, etc.)
CREATE TABLE product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2),
    compare_price DECIMAL(10, 2),
    inventory_quantity INT DEFAULT 0,
    weight DECIMAL(8, 2),
    attributes JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_sku (sku),
    INDEX idx_active (is_active)
);

-- Shopping cart sessions
CREATE TABLE cart_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
);

-- Shopping cart items
CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_session_id VARCHAR(255) NOT NULL,
    product_id INT NOT NULL,
    product_variant_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_session_id) REFERENCES cart_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    INDEX idx_cart_session (cart_session_id),
    INDEX idx_product (product_id),
    UNIQUE KEY unique_cart_product (cart_session_id, product_id, product_variant_id)
);

-- Orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NULL,
    guest_email VARCHAR(255),
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded') DEFAULT 'pending',
    fulfillment_status ENUM('unfulfilled', 'partial', 'fulfilled') DEFAULT 'unfulfilled',
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    billing_address JSON NOT NULL,
    shipping_address JSON NOT NULL,
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_user_id (user_id),
    INDEX idx_guest_email (guest_email),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- Order items
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_variant_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    variant_name VARCHAR(255),
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    payment_method ENUM('stripe', 'paypal', 'apple_pay', 'google_pay') NOT NULL,
    payment_type ENUM('payment', 'refund', 'partial_refund') DEFAULT 'payment',
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    gateway_transaction_id VARCHAR(255),
    gateway_response JSON,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_gateway_transaction_id (gateway_transaction_id),
    INDEX idx_status (status)
);

-- Discount coupons
CREATE TABLE coupons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('percentage', 'fixed_amount', 'free_shipping') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    minimum_amount DECIMAL(10, 2) DEFAULT 0,
    usage_limit INT DEFAULT NULL,
    usage_count INT DEFAULT 0,
    user_limit INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active_dates (is_active, starts_at, expires_at)
);

-- Coupon usage tracking
CREATE TABLE coupon_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coupon_id INT NOT NULL,
    order_id INT NOT NULL,
    user_id INT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_coupon_id (coupon_id),
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id)
);

-- Inventory tracking
CREATE TABLE inventory_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    product_variant_id INT NULL,
    type ENUM('sale', 'return', 'adjustment', 'restock') NOT NULL,
    quantity_change INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_type ENUM('order', 'manual', 'import') NOT NULL,
    reference_id INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_created_at (created_at)
);

-- User sessions for authentication
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
);

-- Email notifications log
CREATE TABLE email_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_status_type (status, type),
    INDEX idx_created_at (created_at)
);-- Matchable Personal Training Sessions Database Schema

-- Create trainers table
CREATE TABLE trainers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    specializations JSON NOT NULL COMMENT 'Array of specializations: padel, fitness, tennis',
    hourly_rate DECIMAL(10,2) NOT NULL,
    bio TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create session_types table
CREATE TABLE session_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'padel, fitness, tennis',
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    duration_options JSON NOT NULL COMMENT 'Available durations in minutes: [30, 60, 90]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table (available time slots)
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trainer_id INT NOT NULL,
    session_type_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    max_participants INT DEFAULT 1,
    current_participants INT DEFAULT 0,
    status ENUM('available', 'booked', 'cancelled') DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
    FOREIGN KEY (session_type_id) REFERENCES session_types(id) ON DELETE CASCADE,
    
    -- Ensure no overlapping sessions for the same trainer
    UNIQUE KEY unique_trainer_time (trainer_id, date, start_time, end_time)
);

-- Create bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_number VARCHAR(20) NOT NULL UNIQUE,
    client_name VARCHAR(100) NOT NULL,
    client_email VARCHAR(100) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(100),
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create booking_sessions table (many-to-many relationship)
CREATE TABLE booking_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    session_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('booked', 'cancelled', 'completed') DEFAULT 'booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_booking_session (booking_id, session_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_sessions_date_type ON sessions(date, session_type_id);
CREATE INDEX idx_sessions_trainer_date ON sessions(trainer_id, date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_bookings_email ON bookings(client_email);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_booking_sessions_booking ON booking_sessions(booking_id);

-- Insert sample trainers
INSERT INTO trainers (name, email, specializations, hourly_rate, bio, is_active) VALUES
('Maria Rodriguez', 'maria@matchable.com', '["padel", "fitness"]', 75.00, 'Certified padel instructor with 8 years of experience. Former professional player and fitness coach.', TRUE),
('James Thompson', 'james@matchable.com', '["tennis", "fitness"]', 80.00, 'Professional tennis coach with ATP certification. Specializes in technique improvement and fitness training.', TRUE),
('Sofia Chen', 'sofia@matchable.com', '["fitness", "padel"]', 70.00, 'Personal trainer and padel enthusiast. Expert in strength training and sport-specific conditioning.', TRUE),
('Alex Johnson', 'alex@matchable.com', '["tennis"]', 85.00, 'Former junior champion turned coach. Focuses on competitive play and tournament preparation.', TRUE),
('Emma Davis', 'emma@matchable.com', '["padel", "fitness", "tennis"]', 90.00, 'Multi-sport athlete and certified trainer. 10+ years experience across all racquet sports.', TRUE);

-- Insert session types
INSERT INTO session_types (name, description, base_price, duration_options) VALUES
('padel', 'High-energy padel training sessions focusing on technique, strategy, and fitness', 60.00, '[60, 90, 120]'),
('tennis', 'Professional tennis coaching for all skill levels, from beginner to advanced', 65.00, '[60, 90, 120]'),
('fitness', 'Personal training sessions focused on strength, conditioning, and sport-specific fitness', 55.00, '[45, 60, 90]');

-- Insert sample available sessions for the next 7 days
INSERT INTO sessions (trainer_id, session_type_id, date, start_time, end_time, duration_minutes, price) VALUES
-- Maria Rodriguez (Padel & Fitness) - Today and tomorrow
(1, 1, CURDATE(), '09:00:00', '10:30:00', 90, 90.00),
(1, 1, CURDATE(), '11:00:00', '12:00:00', 60, 75.00),
(1, 2, CURDATE(), '14:00:00', '15:30:00', 90, 82.50),
(1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '10:30:00', 90, 90.00),
(1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', '12:30:00', 90, 82.50),

-- James Thompson (Tennis & Fitness) - Today and tomorrow
(2, 3, CURDATE(), '10:00:00', '11:00:00', 60, 80.00),
(2, 3, CURDATE(), '15:00:00', '16:30:00', 90, 120.00),
(2, 2, CURDATE(), '17:00:00', '18:00:00', 60, 70.00),
(2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '10:30:00', 90, 120.00),
(2, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '15:00:00', 60, 70.00),

-- Sofia Chen (Fitness & Padel) - Today and tomorrow
(3, 2, CURDATE(), '08:00:00', '08:45:00', 45, 52.50),
(3, 2, CURDATE(), '16:00:00', '17:00:00', 60, 70.00),
(3, 1, CURDATE(), '18:00:00', '19:30:00', 90, 87.50),
(3, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '09:00:00', 60, 70.00),
(3, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:00:00', '17:30:00', 90, 87.50),

-- Alex Johnson (Tennis) - Today and tomorrow
(4, 3, CURDATE(), '12:00:00', '13:30:00', 90, 127.50),
(4, 3, CURDATE(), '19:00:00', '20:00:00', 60, 85.00),
(4, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '11:30:00', 90, 127.50),
(4, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:00:00', '19:00:00', 60, 85.00),

-- Emma Davis (All sports) - Today and tomorrow
(5, 1, CURDATE(), '07:00:00', '08:30:00', 90, 135.00),
(5, 3, CURDATE(), '13:00:00', '14:00:00', 60, 90.00),
(5, 2, CURDATE(), '20:00:00', '21:00:00', 60, 81.00),
(5, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:00:00', '08:00:00', 60, 90.00),
(5, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', '13:30:00', 90, 135.00);