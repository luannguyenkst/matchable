<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Validator;
use DateTime;

class SessionController extends BaseController
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
     * GET /sessions - Retrieve available sessions
     * Query parameters:
     * - date: Filter by specific date (YYYY-MM-DD)
     * - type: Filter by session type (padel, fitness, tennis)
     * - trainer_id: Filter by trainer ID
     * - duration: Filter by duration in minutes
     */
    public function getSessions()
    {
        try {
            $date = $_GET['date'] ?? null;
            $type = $_GET['type'] ?? null;
            $trainerId = $_GET['trainer_id'] ?? null;
            $duration = $_GET['duration'] ?? null;

            // Build the query
            $query = "
                SELECT 
                    s.id,
                    s.date,
                    s.start_time,
                    s.end_time,
                    s.duration_minutes,
                    s.price,
                    s.status,
                    s.max_participants,
                    s.current_participants,
                    s.notes,
                    st.name as session_type,
                    st.description as session_description,
                    t.name as trainer_name,
                    t.bio as trainer_bio,
                    t.specializations as trainer_specializations,
                    t.image_url as trainer_image
                FROM sessions s
                JOIN session_types st ON s.session_type_id = st.id
                JOIN trainers t ON s.trainer_id = t.id
                WHERE s.status = 'available' 
                AND s.date >= CURDATE()
                AND t.is_active = 1
                AND st.is_active = 1
            ";

            $params = [];

            // Add filters
            if ($date) {
                $query .= " AND s.date = ?";
                $params[] = $date;
            }

            if ($type) {
                $query .= " AND st.name = ?";
                $params[] = $type;
            }

            if ($trainerId) {
                $query .= " AND s.trainer_id = ?";
                $params[] = $trainerId;
            }

            if ($duration) {
                $query .= " AND s.duration_minutes = ?";
                $params[] = $duration;
            }

            $query .= " ORDER BY s.date ASC, s.start_time ASC";

            $stmt = $this->db->getConnection()->prepare($query);
            $stmt->execute($params);

            $sessions = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // Format the response
            $formattedSessions = array_map(function($session) {
                return [
                    'id' => (int)$session['id'],
                    'date' => $session['date'],
                    'start_time' => $session['start_time'],
                    'end_time' => $session['end_time'],
                    'duration_minutes' => (int)$session['duration_minutes'],
                    'price' => (float)$session['price'],
                    'status' => $session['status'],
                    'max_participants' => (int)$session['max_participants'],
                    'current_participants' => (int)$session['current_participants'],
                    'available_spots' => (int)$session['max_participants'] - (int)$session['current_participants'],
                    'notes' => $session['notes'],
                    'session_type' => [
                        'name' => $session['session_type'],
                        'description' => $session['session_description']
                    ],
                    'trainer' => [
                        'name' => $session['trainer_name'],
                        'bio' => $session['trainer_bio'],
                        'specializations' => json_decode($session['trainer_specializations'], true),
                        'image_url' => $this->getTrainerAvatarUrl($session['trainer_image'], $session['trainer_name'])
                    ]
                ];
            }, $sessions);

            echo json_encode($this->success([
                'sessions' => $formattedSessions,
                'total' => count($formattedSessions),
                'filters_applied' => [
                    'date' => $date,
                    'type' => $type,
                    'trainer_id' => $trainerId,
                    'duration' => $duration
                ]
            ]));

        } catch (\Exception $e) {
            echo json_encode($this->error('Failed to retrieve sessions: ' . $e->getMessage(), 500));
        }
    }

    /**
     * GET /sessions/types - Get available session types
     */
    public function getSessionTypes()
    {
        try {
            $query = "
                SELECT 
                    id,
                    name,
                    description,
                    base_price,
                    duration_options
                FROM session_types 
                WHERE is_active = 1
                ORDER BY name ASC
            ";

            $stmt = $this->db->getConnection()->prepare($query);
            $stmt->execute();

            $types = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $formattedTypes = array_map(function($type) {
                return [
                    'id' => (int)$type['id'],
                    'name' => $type['name'],
                    'description' => $type['description'],
                    'base_price' => (float)$type['base_price'],
                    'duration_options' => json_decode($type['duration_options'], true)
                ];
            }, $types);

            echo json_encode($this->success([
                'session_types' => $formattedTypes
            ]));

        } catch (\Exception $e) {
            echo json_encode($this->error('Failed to retrieve session types: ' . $e->getMessage(), 500));
        }
    }

    /**
     * GET /sessions/trainers - Get available trainers
     */
    public function getTrainers()
    {
        try {
            $specialization = $_GET['specialization'] ?? null;

            $query = "
                SELECT 
                    id,
                    name,
                    email,
                    specializations,
                    hourly_rate,
                    bio,
                    image_url
                FROM trainers 
                WHERE is_active = 1
            ";

            $params = [];

            if ($specialization) {
                $query .= " AND JSON_CONTAINS(specializations, ?)";
                $params[] = json_encode($specialization);
            }

            $query .= " ORDER BY name ASC";

            $stmt = $this->db->getConnection()->prepare($query);
            $stmt->execute($params);

            $trainers = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $formattedTrainers = array_map(function($trainer) {
                return [
                    'id' => (int)$trainer['id'],
                    'name' => $trainer['name'],
                    'specializations' => json_decode($trainer['specializations'], true),
                    'hourly_rate' => (float)$trainer['hourly_rate'],
                    'bio' => $trainer['bio'],
                    'image_url' => $this->getTrainerAvatarUrl($trainer['image_url'], $trainer['name'])
                ];
            }, $trainers);

            echo json_encode($this->success([
                'trainers' => $formattedTrainers
            ]));

        } catch (\Exception $e) {
            echo json_encode($this->error('Failed to retrieve trainers: ' . $e->getMessage(), 500));
        }
    }

    /**
     * GET /sessions/:id - Get specific session details
     */
    public function getSession($id)
    {
        try {
            if (!$id || !is_numeric($id)) {
                echo json_encode($this->error('Invalid session ID', 400));
                return;
            }

            $query = "
                SELECT 
                    s.id,
                    s.date,
                    s.start_time,
                    s.end_time,
                    s.duration_minutes,
                    s.price,
                    s.status,
                    s.max_participants,
                    s.current_participants,
                    s.notes,
                    st.name as session_type,
                    st.description as session_description,
                    st.base_price,
                    t.name as trainer_name,
                    t.email as trainer_email,
                    t.bio as trainer_bio,
                    t.specializations as trainer_specializations,
                    t.hourly_rate as trainer_rate,
                    t.image_url as trainer_image
                FROM sessions s
                JOIN session_types st ON s.session_type_id = st.id
                JOIN trainers t ON s.trainer_id = t.id
                WHERE s.id = ? AND s.status = 'available'
            ";

            $stmt = $this->db->getConnection()->prepare($query);
            $stmt->execute([$id]);

            $session = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$session) {
                echo json_encode($this->error('Session not found or not available', 404));
                return;
            }

            $formattedSession = [
                'id' => (int)$session['id'],
                'date' => $session['date'],
                'start_time' => $session['start_time'],
                'end_time' => $session['end_time'],
                'duration_minutes' => (int)$session['duration_minutes'],
                'price' => (float)$session['price'],
                'status' => $session['status'],
                'max_participants' => (int)$session['max_participants'],
                'current_participants' => (int)$session['current_participants'],
                'available_spots' => (int)$session['max_participants'] - (int)$session['current_participants'],
                'notes' => $session['notes'],
                'session_type' => [
                    'name' => $session['session_type'],
                    'description' => $session['session_description'],
                    'base_price' => (float)$session['base_price']
                ],
                'trainer' => [
                    'name' => $session['trainer_name'],
                    'email' => $session['trainer_email'],
                    'bio' => $session['trainer_bio'],
                    'specializations' => json_decode($session['trainer_specializations'], true),
                    'hourly_rate' => (float)$session['trainer_rate'],
                    'image_url' => $this->getTrainerAvatarUrl($session['trainer_image'], $session['trainer_name'])
                ]
            ];

            echo json_encode($this->success($formattedSession));

        } catch (\Exception $e) {
            echo json_encode($this->error('Failed to retrieve session: ' . $e->getMessage(), 500));
        }
    }

    /**
     * GET /sessions/:id/availability - Get session availability details
     */
    public function getAvailability($id)
    {
        try {
            if (!$id || !is_numeric($id)) {
                echo json_encode($this->error('Invalid session ID', 400));
                return;
            }

            $query = "
                SELECT 
                    s.id,
                    s.max_participants,
                    s.current_participants,
                    s.status,
                    s.date,
                    s.start_time,
                    s.end_time
                FROM sessions s
                WHERE s.id = ?
            ";

            $stmt = $this->db->getConnection()->prepare($query);
            $stmt->execute([$id]);

            $session = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$session) {
                echo json_encode($this->error('Session not found', 404));
                return;
            }

            $availableSpots = (int)$session['max_participants'] - (int)$session['current_participants'];
            $isAvailable = $session['status'] === 'available' && $availableSpots > 0;

            $availability = [
                'session_id' => (int)$session['id'],
                'max_participants' => (int)$session['max_participants'],
                'current_participants' => (int)$session['current_participants'],
                'available_spots' => $availableSpots,
                'status' => $session['status'],
                'is_available' => $isAvailable,
                'date' => $session['date'],
                'start_time' => $session['start_time'],
                'end_time' => $session['end_time']
            ];

            echo json_encode($this->success($availability));

        } catch (\Exception $e) {
            echo json_encode($this->error('Failed to retrieve session availability: ' . $e->getMessage(), 500));
        }
    }

    /**
     * Generate trainer avatar URL with fallback to default avatar services
     */
    private function getTrainerAvatarUrl($imageUrl, $trainerName)
    {
        // If trainer has a custom image URL and it's not empty, return it
        if (!empty($imageUrl)) {
            return $imageUrl;
        }

        // Generate a default avatar using UI Avatars service
        // This creates a nice colored avatar with the trainer's initials
        $initials = $this->getInitials($trainerName);
        $background = $this->getColorForName($trainerName);
        
        return "https://ui-avatars.com/api/?name=" . urlencode($trainerName) . 
               "&size=128&background=" . $background . 
               "&color=ffffff&format=png&rounded=true&bold=true";
    }

    /**
     * Extract initials from trainer name
     */
    private function getInitials($name)
    {
        $words = explode(' ', trim($name));
        $initials = '';
        
        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper($word[0]);
            }
        }
        
        return substr($initials, 0, 2); // Limit to 2 characters
    }

    /**
     * Generate a consistent color for a name
     */
    private function getColorForName($name)
    {
        // Define a set of professional colors
        $colors = [
            '6366f1', // Indigo
            '8b5cf6', // Violet  
            '06b6d4', // Cyan
            '10b981', // Emerald
            'f59e0b', // Amber
            'ef4444', // Red
            'ec4899', // Pink
            '84cc16', // Lime
            '6b7280', // Gray
            '3b82f6'  // Blue
        ];
        
        // Use a simple hash to consistently pick a color for each name
        $hash = crc32($name);
        $index = abs($hash) % count($colors);
        
        return $colors[$index];
    }
}