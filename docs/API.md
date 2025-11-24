# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints (except `/auth/login` and `/auth/register`) require JWT token in header:
```
Authorization: Bearer {token}
```

## Response Format
```json
{
  "status": "success|error",
  "message": "Operation message",
  "data": {},
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

## Error Responses
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error description"
}
```

## Authentication Endpoints

### Register User
**POST** `/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "role": "RECEPTIONIST",
  "department": "Front Desk"
}
```

### Login
**POST** `/auth/login`
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "RECEPTIONIST",
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token"
  }
}
```

### Refresh Token
**POST** `/auth/refresh`
```json
{
  "refreshToken": "jwt-token"
}
```

### Change Password
**POST** `/auth/change-password`
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}
```

## Patient Endpoints

### Create Patient
**POST** `/patients`
```json
{
  "name": "Jane Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "FEMALE",
  "contactNumber": "555-1234",
  "email": "jane@example.com",
  "address": "123 Main St",
  "bloodGroup": "O+",
  "allergies": "Penicillin",
  "chronicConditions": "Diabetes",
  "insuranceProvider": "Blue Cross"
}
```

### List Patients
**GET** `/patients?page=1&limit=10&search=jane`

### Get Patient
**GET** `/patients/{id}`

### Update Patient
**PUT** `/patients/{id}`
```json
{
  "name": "Jane Doe Updated",
  "contactNumber": "555-5678"
}
```

### Delete Patient
**DELETE** `/patients/{id}`

## Appointment Endpoints

### Create Appointment
**POST** `/appointments`
```json
{
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid",
  "slotStart": "2024-12-01T10:00:00Z",
  "slotEnd": "2024-12-01T11:00:00Z",
  "appointmentType": "CONSULTATION",
  "reason": "Regular checkup",
  "notes": "Patient has high blood pressure"
}
```

### List Appointments
**GET** `/appointments?page=1&limit=10&from=2024-12-01&to=2024-12-31&doctorId=uuid&status=SCHEDULED`

### Get Appointment
**GET** `/appointments/{id}`

### Update Appointment
**PUT** `/appointments/{id}`
```json
{
  "slotStart": "2024-12-02T10:00:00Z",
  "slotEnd": "2024-12-02T11:00:00Z",
  "status": "CONFIRMED"
}
```

### Cancel Appointment
**PATCH** `/appointments/{id}/cancel`

## Ward & Bed Endpoints

### Create Ward
**POST** `/wards`
```json
{
  "wardName": "General Ward A",
  "department": "General",
  "totalBeds": 20,
  "description": "General admission ward"
}
```

### List Wards
**GET** `/wards?page=1&limit=10`

### Get Ward Details
**GET** `/wards/{id}`

### Update Ward
**PUT** `/wards/{id}`
```json
{
  "wardName": "Updated Ward Name",
  "totalBeds": 25
}
```

### Create Bed
**POST** `/wards/{wardId}/beds`
```json
{
  "roomId": "room-uuid",
  "bedNumber": "A-101"
}
```

### Update Bed Status
**PATCH** `/wards/beds/{bedId}/status`
```json
{
  "status": "OCCUPIED",
  "occupantPatientId": "patient-uuid"
}
```

### Get Bed Status
**GET** `/wards/beds/status`

## Inventory Endpoints

### Create Item
**POST** `/inventory`
```json
{
  "name": "Paracetamol",
  "itemType": "MEDICINE",
  "quantity": 500,
  "reorderLevel": 100,
  "unit": "tablets",
  "location": "Store A",
  "unitCost": 0.50,
  "supplier": "Supplier Co"
}
```

### List Items
**GET** `/inventory?page=1&limit=10&search=paracetamol&itemType=MEDICINE&lowStock=true`

### Get Item
**GET** `/inventory/{id}`

### Update Item
**PUT** `/inventory/{id}`
```json
{
  "quantity": 450,
  "reorderLevel": 150
}
```

### Adjust Inventory
**PATCH** `/inventory/{id}/adjust`
```json
{
  "quantityChange": -50,
  "reason": "Used in ward"
}
```

### Low Stock Items
**GET** `/inventory/low-stock`

## Invoice Endpoints

### Create Invoice
**POST** `/invoices`
```json
{
  "patientId": "patient-uuid",
  "lineItems": [
    {
      "description": "Doctor Consultation",
      "quantity": 1,
      "unitPrice": 100.00,
      "category": "CONSULTATION"
    },
    {
      "description": "Medication",
      "quantity": 30,
      "unitPrice": 5.00,
      "category": "MEDICINE"
    }
  ],
  "taxPercent": 10,
  "discountAmount": 0
}
```

### List Invoices
**GET** `/invoices?page=1&limit=10&from=2024-12-01&to=2024-12-31&status=ISSUED&patientId=uuid`

### Get Invoice
**GET** `/invoices/{id}`

### Update Invoice Status
**PATCH** `/invoices/{id}/status`
```json
{
  "status": "PAID",
  "paymentMethod": "CARD",
  "paidDate": "2024-12-15T00:00:00Z"
}
```

## Common Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 10)

### Date Filtering
- `from`: Start date (ISO format)
- `to`: End date (ISO format)

### Search
- `search`: Search term (applies to searchable fields)

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Server Error

## Rate Limiting

API endpoints are rate limited:
- 100 requests per 15 minutes per IP
- Returns `429` when limit exceeded

## Examples

### Example: Create and Retrieve Patient
```bash
# Create patient
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE"
  }'

# Response includes patient ID, use it to get patient:
curl http://localhost:3000/api/patients/returned-id \
  -H "Authorization: Bearer token"
```

### Example: Create and Schedule Appointment
```bash
# First get patient and doctor IDs
curl http://localhost:3000/api/patients?limit=1 \
  -H "Authorization: Bearer token"

# Create appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "doctorId": "doctor-uuid",
    "slotStart": "2024-12-20T14:00:00Z",
    "slotEnd": "2024-12-20T15:00:00Z",
    "appointmentType": "CONSULTATION"
  }'
```

---
For more information, visit the main README.md
