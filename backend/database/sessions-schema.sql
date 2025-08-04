-- Matchable Personal Training Sessions Database Schema

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