# Matchable - Personal Training Session Booking System

A complete full-stack application for booking personal training sessions in padel, tennis, and fitness. Built with Angular, PHP, MySQL, and Docker with modern responsive design and smooth animations.

## Features

### Core Functionality
- **Session Booking**: Browse and book personal training sessions for padel 🏓, tennis 🎾, and fitness 💪
- **Professional Trainers**: Certified trainers with specialized expertise and detailed profiles
- **Real-time Availability**: Live session availability and automatic booking management
- **Shopping Cart**: Add multiple sessions with quantity management and real-time pricing
- **Smart Filtering**: Filter sessions by date, type, trainer, and duration
- **Booking Confirmation**: Complete booking flow with detailed confirmation pages
- **Responsive Design**: Mobile-first design with smooth animations and modern UI

### Technical Features
- **Full-Stack Architecture**: Angular frontend with PHP backend and MySQL database
- **Docker Containerization**: Complete containerization with docker-compose
- **API-First Design**: RESTful API with proper error handling and validation
- **Real-time Updates**: Live availability checking and booking management
- **Transaction Safety**: Database transactions ensuring booking integrity
- **Modern UI**: Smooth animations, loading states, and responsive design

## Technology Stack

### Frontend
- **Angular 17**: Modern TypeScript framework
- **TailwindCSS**: Utility-first CSS framework
- **RxJS**: Reactive programming for state management
- **Standalone Components**: Latest Angular architecture

### Backend
- **PHP 8.2**: Modern PHP with strong typing
- **MySQL 8.0**: Relational database with JSON support
- **Redis**: Caching and session storage
- **Composer**: Dependency management

### Infrastructure
- **Docker**: Containerized development and deployment
- **Nginx**: Reverse proxy and static file serving
- **Apache**: PHP application server

## Project Structure

```
matchable/
├── frontend/                 # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── pages/        # Route components
│   │   │   ├── services/     # Business logic services
│   │   │   ├── models/       # TypeScript interfaces
│   │   │   ├── guards/       # Route guards
│   │   │   └── interceptors/ # HTTP interceptors
│   │   ├── assets/           # Static assets
│   │   └── environments/     # Environment configs
│   ├── package.json
│   ├── angular.json
│   └── tailwind.config.js
├── backend/                  # PHP API
│   ├── src/
│   │   ├── Controllers/      # API controllers
│   │   ├── Services/         # Business logic
│   │   ├── Core/             # Framework core
│   │   └── Middleware/       # HTTP middleware
│   ├── public/               # Web root
│   ├── database/             # Schema and migrations
│   ├── composer.json
│   └── Dockerfile
├── docker-compose.yml        # Multi-container setup
├── .env.example             # Environment template
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- PHP 8.1+ (for development)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd matchable
```

### 2. Start with Docker (Recommended)
```bash
# Build and start all services
docker-compose up -d

# Check container status
docker-compose ps
```

### 3. Access the Application
- **Frontend**: http://localhost (Nginx)
- **Backend API**: http://localhost:8080/api
- **Database**: localhost:3306 (MySQL)
- **Redis**: localhost:6379

### 4. Test the Application
Visit http://localhost to start booking training sessions!

### 5. Development Mode (Optional)
For frontend development with hot reload:
```bash
cd frontend
npm install
npm run serve  # Opens http://localhost:4200
```

### Manual Setup (without Docker)

1. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE matchable_checkout;
   
   # Import schema
   mysql -u root -p matchable_checkout < backend/database/schema.sql
   mysql -u root -p matchable_checkout < backend/database/init/02-sample-data.sql
   ```

2. **Backend Setup**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   # Configure database credentials in .env
   php -S localhost:8080 -t public
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ng serve
   ```

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_NAME=matchable_checkout
DB_USER=your_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

#### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  stripePublishableKey: 'pk_test_...',
  paypalClientId: 'your_paypal_client_id'
};
```

## 🎯 API Endpoints

### Sessions
- `GET /api/sessions` - Get available training sessions
- `GET /api/sessions/types` - Get session types (padel, tennis, fitness)
- `GET /api/sessions/trainers` - Get all trainers
- `GET /api/sessions/{id}` - Get specific session details

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/{booking_number}` - Get booking details
- `PUT /api/bookings/{booking_number}/cancel` - Cancel booking

### Example API Usage

#### Get Available Sessions
```bash
curl http://localhost:8080/api/sessions
```

#### Create a Booking
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "client_phone": "+1-555-123-4567",
    "sessions": [1, 2],
    "terms_accepted": true,
    "special_requests": "Please provide equipment"
  }'
```

## 🗄 Database Schema

### Main Tables
- **trainers**: Professional trainers with specializations and bio
- **session_types**: Padel, Tennis, Fitness session types with pricing
- **sessions**: Available training sessions with scheduling and pricing
- **bookings**: Client bookings with contact information
- **booking_sessions**: Many-to-many relationship for booked sessions

### Sample Data
The database comes pre-populated with:
- 5 professional trainers with different specializations
- 3 session types (padel, tennis, fitness) with realistic pricing
- 18+ available sessions for the next 2 days
- Professional trainer profiles and session descriptions

See `backend/database/init/` for complete schema and sample data.

## Security Features

- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Prepared statements
- **XSS Protection**: Output escaping and CSP headers
- **CSRF Protection**: Token-based validation
- **Rate Limiting**: Request throttling
- **Secure Headers**: Security-focused HTTP headers

## Testing

### Frontend Tests
```bash
cd frontend
npm test                 # Unit tests
npm run test:coverage   # Coverage report
npm run e2e             # End-to-end tests
```

### Backend Tests
```bash
cd backend
composer test           # PHPUnit tests
composer test-coverage  # Coverage report
```

## Deployment

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
1. Build frontend: `ng build --prod`
2. Configure web server (Nginx/Apache)
3. Set up SSL certificates
4. Configure production database
5. Set production environment variables

## Performance Optimization

- **Frontend**: Lazy loading, OnPush change detection, service workers
- **Backend**: Query optimization, Redis caching, connection pooling
- **Database**: Proper indexing, query optimization
- **Assets**: Image optimization, CDN integration

## Monitoring and Logging

- **Application Logs**: Structured logging with context
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Response time monitoring
- **Database Monitoring**: Query performance tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@matchable.store or create an issue in the repository.