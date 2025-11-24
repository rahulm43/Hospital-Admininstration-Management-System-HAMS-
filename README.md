# Hospital Admin Management System

A comprehensive full-stack Hospital Administration Management System built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Features

- **Authentication & Authorization**: Role-based access control (SUPER_ADMIN, ADMIN, DOCTOR, NURSE, RECEPTIONIST, ACCOUNTANT, LAB_TECHNICIAN)
- **Patient Management**: Complete patient profiles with medical history and documents
- **Appointment Scheduling**: Doctor calendar with conflict detection
- **Ward & Bed Management**: Visual bed occupancy tracking
- **Inventory Management**: Medicine and supply tracking with low-stock alerts
- **Billing System**: Invoice generation and payment tracking
- **Interactive Dashboards**: Real-time charts and analytics
- **Audit Logging**: Complete audit trail for sensitive operations
- **Secure**: JWT authentication, password hashing, input validation

## Tech Stack

- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Chart.js
- **Deployment**: Docker & Docker Compose
- **Testing**: Jest, Supertest

## Project Structure

```
hospital-admin-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and logger config
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, error handling
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Helper functions
│   │   └── index.js          # Server entry point
│   ├── tests/                # Test files
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── assets/
│   │   ├── css/styles.css
│   │   └── js/
│   │       ├── api.js        # API client
│   │       ├── app.js        # Main app logic
│   │       └── modules/      # Page modules
│   └── pages/
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## Installation

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:
```bash
cd hospital-admin-system
```

2. Start services:
```bash
docker-compose up -d
```

3. Initialize database (first time):
```bash
docker-compose exec backend npm run seed
```

4. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:3000/api
- Health check: http://localhost:3000/health

### Local Development Setup

1. Install PostgreSQL and create database:
```bash
psql -U postgres
CREATE DATABASE hospital_admin_db;
```

2. Backend setup:
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run migrate
npm run seed
npm run dev
```

3. Frontend setup:
```bash
cd frontend
# Open index.html in your browser or use a local server
python -m http.server 8000
# Then visit http://localhost:8000
```

## Database Models

### Core Entities
- **User**: Staff accounts with roles and permissions
- **Patient**: Patient information and medical history
- **Staff**: Employee details and scheduling
- **Appointment**: Scheduling and calendar management
- **Ward/Room/Bed**: Facility hierarchy and occupancy
- **Encounter**: Patient visit records
- **InventoryItem**: Medicine and supply tracking
- **Invoice**: Billing and payment records
- **LabOrder**: Laboratory test orders
- **AuditLog**: Action tracking and compliance

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Patients
- `POST /api/patients` - Create patient
- `GET /api/patients` - List patients (paginated, searchable)
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - List appointments (filterable by date, doctor, patient, status)
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update appointment
- `PATCH /api/appointments/:id/cancel` - Cancel appointment

### Wards & Beds
- `POST /api/wards` - Create ward
- `GET /api/wards` - List wards
- `GET /api/wards/:id` - Get ward with rooms and beds
- `PUT /api/wards/:id` - Update ward
- `POST /api/wards/:wardId/beds` - Create bed
- `PATCH /api/wards/beds/:id/status` - Update bed status
- `GET /api/wards/beds/status` - Get bed occupancy status

### Inventory
- `POST /api/inventory` - Create inventory item
- `GET /api/inventory` - List items (filterable, searchable)
- `GET /api/inventory/:id` - Get item details
- `PUT /api/inventory/:id` - Update item
- `PATCH /api/inventory/:id/adjust` - Adjust quantity
- `GET /api/inventory/low-stock` - Get low-stock items

### Billing
- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - List invoices (filterable by date, status, patient)
- `GET /api/invoices/:id` - Get invoice details
- `PATCH /api/invoices/:id/status` - Update invoice status

## Authentication & Authorization

### Role Hierarchy
1. **SUPER_ADMIN** - Full system access
2. **ADMIN** - All features except super admin functions
3. **DOCTOR** - Patient management, appointments, prescriptions
4. **NURSE** - Ward management, patient care
5. **RECEPTIONIST** - Patient registration, appointments
6. **ACCOUNTANT** - Billing, invoices, inventory
7. **LAB_TECHNICIAN** - Lab order management

### JWT Token Structure
```json
{
  "userId": "uuid",
  "role": "DOCTOR",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## Usage Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor1@hospital.com",
    "password": "Doctor@123"
  }'
```

### Create Patient
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "John Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "email": "john@example.com",
    "contactNumber": "555-1234"
  }'
```

### Get Dashboard Data
```bash
curl -X GET http://localhost:3000/api/appointments?from=2024-01-01&to=2024-01-31 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

### Run Tests
```bash
cd backend
npm test
npm run test:watch  # Watch mode
```

### Test Coverage
```bash
npm test -- --coverage
```

## Deployment

### Production Docker Build
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Variables
Copy `.env.example` to `.env` and configure:
```env
NODE_ENV=production
DB_HOST=your-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-secret-key
```

## Performance Optimization

- Connection pooling enabled
- Paginated API responses
- Database indexes on frequently queried fields
- Request rate limiting
- Gzip compression enabled

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication
- CORS protection
- Helmet security headers
- Input validation & sanitization
- SQL injection prevention via Sequelize ORM
- Audit logging for sensitive operations
- HTTPS recommended for production

## Monitoring & Logging

- Winston logger with file rotation
- Request logging middleware
- Error tracking
- Audit trail for all data modifications

## Future Enhancements

- WebSocket support for real-time updates
- Email notifications for appointments
- SMS alerts for emergencies
- HL7/FHIR compatibility
- Advanced analytics and reporting
- Mobile app (React Native)
- Payment gateway integration
- AI-based appointment scheduling

## Contributing

Guidelines for contributing to this project:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -am 'Add feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues or questions:
- Create an issue in the repository
- Email support@hospital-admin.com
- Check documentation in `/docs`

## Changelog

### Version 1.0.0
- Initial release
- Core features: Patient, Appointment, Ward, Inventory, Billing management
- Authentication & Authorization
- Dashboard with analytics
- Docker deployment

---

**Last Updated**: November 2024
