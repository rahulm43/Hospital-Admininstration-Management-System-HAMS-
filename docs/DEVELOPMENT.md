# Hospital Admin System - Development Guide

## Project Setup

### Backend Development

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=hospital_admin_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   NODE_ENV=development
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb hospital_admin_db
   
   # Run migrations and seed
   npm run seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:3000`

### Frontend Development

1. **Serve Frontend**
   ```bash
   cd frontend
   python -m http.server 8000
   # or
   npx http-server
   ```
   Access on `http://localhost:8000`

## Project Architecture

### Backend Architecture

```
src/
├── config/          - Configuration files (database, logger)
├── controllers/     - Request handlers
├── middleware/      - Auth, error handling, logging
├── models/          - Database models (Sequelize)
├── routes/          - API route definitions
├── services/        - Business logic layer
├── utils/           - Helper utilities (password, JWT)
├── validators/      - Input validation schemas
└── index.js         - Application entry point
```

### Frontend Architecture

```
frontend/
├── index.html       - Main HTML entry point
├── assets/
│   ├── css/         - Stylesheets
│   └── js/
│       ├── api.js   - API client wrapper
│       ├── app.js   - Main application logic
│       └── modules/ - Page-specific modules
└── pages/           - Additional page files
```

## Database Schema

### User Table
- id (UUID, PK)
- name, email, passwordHash, role
- department, status, lastLogin
- twoFactorEnabled, twoFactorSecret
- timestamps

### Patient Table
- id (UUID, PK)
- name, dateOfBirth, gender, contact, email
- address, emergencyContact, insurance
- bloodGroup, allergies, chronicConditions, currentMedications
- timestamps

### Appointment Table
- id (UUID, PK)
- patientId (FK), doctorId (FK)
- slotStart, slotEnd, status
- appointmentType, reason, notes
- timestamps

### Ward/Room/Bed Tables
- Ward: wardName, department, totalBeds, occupiedBeds
- Room: wardId (FK), roomNumber, totalBeds, roomType, status
- Bed: roomId (FK), bedNumber, status, occupantPatientId, occupancyStartDate

### Invoice Tables
- Invoice: patientId (FK), invoiceNumber, amounts, status, dates
- InvoiceLineItem: invoiceId (FK), description, quantity, prices, category

### Other Tables
- Staff, Encounter, InventoryItem, LabOrder, AuditLog

## API Development Guidelines

### Creating New Endpoints

1. **Create Model** (if not exists)
   ```javascript
   // models/NewEntity.js
   const { DataTypes } = require('sequelize');
   const sequelize = require('../config/database');
   
   const NewEntity = sequelize.define('NewEntity', {
     id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
     // ... fields
   });
   ```

2. **Create Controller**
   ```javascript
   // controllers/newEntityController.js
   exports.create = async (req, res, next) => {
     try {
       const entity = await NewEntity.create(req.body);
       await auditLog(req.user.userId, 'NewEntity', entity.id, 'CREATE', null, entity.toJSON(), req);
       res.status(201).json({ status: 'success', data: entity });
     } catch (error) {
       next(error);
     }
   };
   ```

3. **Create Routes**
   ```javascript
   // routes/newEntityRoutes.js
   const router = express.Router();
   router.post('/', authenticate, authorize('ADMIN'), controller.create);
   router.get('/', authenticate, controller.getAll);
   // ... other routes
   ```

4. **Register Routes in index.js**
   ```javascript
   app.use('/api/new-entities', newEntityRoutes);
   ```

### Error Handling

Use the AppError class for consistent error responses:
```javascript
if (!found) {
  throw new AppError('Resource not found', 404);
}
```

## Frontend Development Guidelines

### Module Structure

Create page modules in `modules/` folder:
```javascript
const MyModule = {
  async render() {
    // Render UI
    const content = document.getElementById('pageContent');
    content.innerHTML = /* HTML */;
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Load data
    await this.loadData();
  },
  
  async loadData() {
    // Fetch and display data
  },
  
  attachEventListeners() {
    // Attach click, submit handlers
  }
};
```

### API Usage in Frontend

```javascript
// Use the global api object
try {
  const response = await api.getPatients(1, 10);
  // response.data contains the data
  // response.pagination contains pagination info
} catch (error) {
  showNotification(`Error: ${error.message}`, 'error');
}
```

## Testing

### Backend Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Test Example
```javascript
describe('Patient Controller', () => {
  it('should create a patient', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Patient',
        dateOfBirth: '1990-01-15',
        gender: 'MALE'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('Test Patient');
  });
});
```

## Deployment

### Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Stop services
docker-compose down
```

### Environment Configuration for Production

Create `.env.production`:
```env
NODE_ENV=production
DB_HOST=production-db-host
DB_PASSWORD=strong-password
JWT_SECRET=strong-secret-key
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=error
```

## Common Development Tasks

### Reset Database
```bash
npm run migrate:reset
npm run seed
```

### Check Database
```bash
# Connect to PostgreSQL
psql -U postgres -d hospital_admin_db

# List tables
\dt

# Exit
\q
```

### Debug Logs
```bash
# Check application logs
tail -f logs/combined.log

# Check error logs
tail -f logs/error.log
```

## Performance Tips

1. **Database Queries**
   - Use pagination for large result sets
   - Add indexes on frequently queried columns
   - Use eager loading for relationships

2. **API Responses**
   - Return only necessary fields
   - Use pagination limits
   - Cache non-critical data

3. **Frontend**
   - Lazy load modules
   - Use pagination for tables
   - Debounce search inputs

## Security Checklist

- [ ] Change default JWT_SECRET in production
- [ ] Use strong database password
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Use environment variables for sensitive data
- [ ] Implement rate limiting
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution: Ensure PostgreSQL is running
- Windows: services.msc -> PostgreSQL
- Mac: brew services start postgresql
- Linux: sudo systemctl start postgresql
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000

Solution: Kill process using the port
- Windows: netstat -ano | findstr :3000, then taskkill /PID [pid]
- Mac/Linux: lsof -i :3000 | grep LISTEN, then kill -9 [pid]
```

### Module Not Found
```
Error: Cannot find module 'xxxx'

Solution: Install dependencies
npm install
```

---
For API documentation, see docs/API.md
For deployment guide, see docs/DEPLOYMENT.md
