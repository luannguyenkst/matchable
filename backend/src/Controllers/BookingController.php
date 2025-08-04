<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Validator;

class BookingController extends BaseController
{
    private $db;

    public function __construct()
    {
        parent::__construct();
        $this->db = Database::getInstance();
    }

    protected function getRequestData(): array
    {
        return $this->input;
    }

    /**
     * POST /bookings - Create a new booking
     */
    public function createBooking()
    {
        try {
            $data = $this->getRequestData();

            // Validate required fields
            $validator = new Validator($data);
            $validator->required(['client_name', 'client_email', 'client_phone', 'sessions', 'terms_accepted'])
                     ->email('client_email')
                     ->minLength('client_name', 2)
                     ->minLength('client_phone', 10)
                     ->boolean('terms_accepted');

            if (!$validator->isValid()) {
                echo json_encode($this->error('Validation failed', 400, $validator->getErrors()));
                return;
            }

            // Validate terms acceptance
            if (!$data['terms_accepted']) {
                echo json_encode($this->error('Terms and conditions must be accepted', 400));
                return;
            }

            // Validate sessions array
            if (!is_array($data['sessions']) || empty($data['sessions'])) {
                echo json_encode($this->error('At least one session must be selected', 400));
                return;
            }

            // Start transaction
            $this->db->getConnection()->beginTransaction();

            try {
                // Validate session availability and calculate total
                $totalAmount = 0;
                $sessionDetails = [];

                foreach ($data['sessions'] as $sessionId) {
                    if (!is_numeric($sessionId)) {
                        throw new \Exception("Invalid session ID: $sessionId");
                    }

                    // Check session availability
                    $sessionQuery = "
                        SELECT 
                            s.id, s.price, s.status, s.max_participants, s.current_participants,
                            s.date, s.start_time, s.end_time, s.duration_minutes,
                            st.name as session_type,
                            t.name as trainer_name
                        FROM sessions s
                        JOIN session_types st ON s.session_type_id = st.id
                        JOIN trainers t ON s.trainer_id = t.id
                        WHERE s.id = ? AND s.status = 'available'
                    ";

                    $stmt = $this->db->getConnection()->prepare($sessionQuery);
                    $stmt->execute([$sessionId]);
                    $session = $stmt->fetch(\PDO::FETCH_ASSOC);

                    if (!$session) {
                        throw new \Exception("Session $sessionId is not available");
                    }

                    if ($session['current_participants'] >= $session['max_participants']) {
                        throw new \Exception("Session $sessionId is already full");
                    }

                    $totalAmount += $session['price'];
                    $sessionDetails[] = $session;
                }

                // Generate unique booking number
                $bookingNumber = 'MTB-' . date('Y') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

                // Check if booking number already exists
                $checkBookingQuery = "SELECT id FROM bookings WHERE booking_number = ?";
                $stmt = $this->db->getConnection()->prepare($checkBookingQuery);
                $stmt->execute([$bookingNumber]);
                
                if ($stmt->fetch()) {
                    // Generate a new one if exists
                    $bookingNumber = 'MTB-' . date('Ymd') . '-' . uniqid();
                }

                // Create booking record
                $bookingQuery = "
                    INSERT INTO bookings (
                        booking_number, client_name, client_email, client_phone,
                        total_amount, terms_accepted, special_requests,
                        booking_status, payment_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
                ";

                $stmt = $this->db->getConnection()->prepare($bookingQuery);
                $stmt->execute([
                    $bookingNumber,
                    $data['client_name'],
                    $data['client_email'],
                    $data['client_phone'],
                    $totalAmount,
                    $data['terms_accepted'] ? 1 : 0,
                    $data['special_requests'] ?? null
                ]);

                $bookingId = $this->db->getConnection()->lastInsertId();

                // Create booking_sessions records and update session participants
                foreach ($data['sessions'] as $index => $sessionId) {
                    $session = $sessionDetails[$index];

                    // Insert booking_session record
                    $bookingSessionQuery = "
                        INSERT INTO booking_sessions (booking_id, session_id, price)
                        VALUES (?, ?, ?)
                    ";
                    $stmt = $this->db->getConnection()->prepare($bookingSessionQuery);
                    $stmt->execute([$bookingId, $sessionId, $session['price']]);

                    // Update session participant count
                    $updateSessionQuery = "
                        UPDATE sessions 
                        SET current_participants = current_participants + 1,
                            status = CASE 
                                WHEN current_participants + 1 >= max_participants THEN 'booked'
                                ELSE 'available'
                            END
                        WHERE id = ?
                    ";
                    $stmt = $this->db->getConnection()->prepare($updateSessionQuery);
                    $stmt->execute([$sessionId]);
                }

                // Commit transaction
                $this->db->getConnection()->commit();

                // Get the complete booking details
                $booking = $this->getBookingDetails($bookingId);

                echo json_encode($this->success([
                    'message' => 'Booking created successfully',
                    'booking' => $booking
                ], 'Booking created successfully', 201));

            } catch (\Exception $e) {
                $this->db->getConnection()->rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            echo json_encode($this->error('Failed to create booking: ' . $e->getMessage(), 500));
        }
    }

    /**
     * GET /bookings/:booking_number - Get booking details
     */
    public function getBooking($bookingNumber)
    {
        try {
            if (!$bookingNumber) {
                echo json_encode($this->error('Booking number is required', 400));
                return;
            }

            $booking = $this->getBookingDetailsByNumber($bookingNumber);

            if (!$booking) {
                echo json_encode($this->error('Booking not found', 404));
                return;
            }

            echo json_encode($this->success($booking));

        } catch (\Exception $e) {
            echo json_encode($this->error('Failed to retrieve booking: ' . $e->getMessage(), 500));
        }
    }

    /**
     * PUT /bookings/:booking_number/cancel - Cancel a booking
     */
    public function cancelBooking($bookingNumber)
    {
        try {
            if (!$bookingNumber) {
                echo json_encode($this->error('Booking number is required', 400));
                return;
            }

            $this->db->getConnection()->beginTransaction();

            try {
                // Get booking details
                $bookingQuery = "SELECT id FROM bookings WHERE booking_number = ? AND booking_status != 'cancelled'";
                $stmt = $this->db->getConnection()->prepare($bookingQuery);
                $stmt->execute([$bookingNumber]);
                $booking = $stmt->fetch(\PDO::FETCH_ASSOC);

                if (!$booking) {
                    echo json_encode($this->error('Booking not found or already cancelled', 404));
                    return;
                }

                $bookingId = $booking['id'];

                // Get booked sessions
                $sessionsQuery = "
                    SELECT session_id FROM booking_sessions 
                    WHERE booking_id = ? AND status = 'booked'
                ";
                $stmt = $this->db->getConnection()->prepare($sessionsQuery);
                $stmt->execute([$bookingId]);
                $sessionIds = $stmt->fetchAll(\PDO::FETCH_COLUMN);

                // Update booking status
                $updateBookingQuery = "
                    UPDATE bookings 
                    SET booking_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ";
                $stmt = $this->db->getConnection()->prepare($updateBookingQuery);
                $stmt->execute([$bookingId]);

                // Update booking_sessions status
                $updateBookingSessionsQuery = "
                    UPDATE booking_sessions 
                    SET status = 'cancelled'
                    WHERE booking_id = ?
                ";
                $stmt = $this->db->getConnection()->prepare($updateBookingSessionsQuery);
                $stmt->execute([$bookingId]);

                // Release session spots
                foreach ($sessionIds as $sessionId) {
                    $updateSessionQuery = "
                        UPDATE sessions 
                        SET current_participants = GREATEST(0, current_participants - 1),
                            status = CASE 
                                WHEN current_participants - 1 < max_participants THEN 'available'
                                ELSE status
                            END
                        WHERE id = ?
                    ";
                    $stmt = $this->db->getConnection()->prepare($updateSessionQuery);
                    $stmt->execute([$sessionId]);
                }

                $this->db->getConnection()->commit();

                echo json_encode($this->success([
                    'message' => 'Booking cancelled successfully',
                    'booking_number' => $bookingNumber
                ]));

            } catch (\Exception $e) {
                $this->db->getConnection()->rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            echo json_encode($this->error('Failed to cancel booking: ' . $e->getMessage(), 500));
        }
    }

    /**
     * Helper method to get booking details by ID
     */
    private function getBookingDetails($bookingId)
    {
        $query = "
            SELECT 
                b.id,
                b.booking_number,
                b.client_name,
                b.client_email,
                b.client_phone,
                b.total_amount,
                b.booking_status,
                b.payment_status,
                b.payment_method,
                b.special_requests,
                b.created_at,
                b.updated_at
            FROM bookings b
            WHERE b.id = ?
        ";

        $stmt = $this->db->getConnection()->prepare($query);
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$booking) {
            return null;
        }

        // Get booked sessions
        $sessionsQuery = "
            SELECT 
                bs.price as booked_price,
                bs.status as booking_status,
                s.id as session_id,
                s.date,
                s.start_time,
                s.end_time,
                s.duration_minutes,
                st.name as session_type,
                t.name as trainer_name
            FROM booking_sessions bs
            JOIN sessions s ON bs.session_id = s.id
            JOIN session_types st ON s.session_type_id = st.id
            JOIN trainers t ON s.trainer_id = t.id
            WHERE bs.booking_id = ?
            ORDER BY s.date ASC, s.start_time ASC
        ";

        $stmt = $this->db->getConnection()->prepare($sessionsQuery);
        $stmt->execute([$bookingId]);
        $sessions = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return [
            'id' => (int)$booking['id'],
            'booking_number' => $booking['booking_number'],
            'client' => [
                'name' => $booking['client_name'],
                'email' => $booking['client_email'],
                'phone' => $booking['client_phone']
            ],
            'total_amount' => (float)$booking['total_amount'],
            'booking_status' => $booking['booking_status'],
            'payment_status' => $booking['payment_status'],
            'payment_method' => $booking['payment_method'],
            'special_requests' => $booking['special_requests'],
            'sessions' => array_map(function($session) {
                return [
                    'session_id' => (int)$session['session_id'],
                    'date' => $session['date'],
                    'start_time' => $session['start_time'],
                    'end_time' => $session['end_time'],
                    'duration_minutes' => (int)$session['duration_minutes'],
                    'session_type' => $session['session_type'],
                    'trainer_name' => $session['trainer_name'],
                    'price' => (float)$session['booked_price'],
                    'status' => $session['booking_status']
                ];
            }, $sessions),
            'created_at' => $booking['created_at'],
            'updated_at' => $booking['updated_at']
        ];
    }

    /**
     * Helper method to get booking details by booking number
     */
    private function getBookingDetailsByNumber($bookingNumber)
    {
        $query = "SELECT id FROM bookings WHERE booking_number = ?";
        $stmt = $this->db->getConnection()->prepare($query);
        $stmt->execute([$bookingNumber]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$result) {
            return null;
        }

        return $this->getBookingDetails($result['id']);
    }
}