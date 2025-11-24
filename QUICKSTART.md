# Hospital Admin System - Quick Start Guide

## System Status
✅ All modules fully implemented and operational

---

## Starting the System

### Step 1: Start Backend Server
```bash
cd hospital-admin-system/backend
npm start
```
Expected output: `Server is running on port 3000`

### Step 2: Start Frontend Server
```bash
cd hospital-admin-system/frontend
python -m http.server 8000
```
Expected output: `Serving HTTP on port 8000`

### Step 3: Open Application
Open your browser and navigate to:
```
http://localhost:8000
```

---

## Login Credentials

### Option A: Demo Login (Quickest)
1. Page automatically redirects to `login.html`
2. Click the **"Demo Login"** button
3. Auto-fills: `admin@hospital.com` / `Admin@123`
4. Click **Sign In**

### Option B: Manual Login
| Email | Password | Role |
|-------|----------|------|
| admin@hospital.com | Admin@123 | Admin |
| doctor1@hospital.com | Doctor@123 | Doctor |
| receptionist@hospital.com | Receptionist@123 | Receptionist |
| nurse@hospital.com | Nurse@123 | Nurse |
| accountant@hospital.com | Accountant@123 | Accountant |

---

## Module Features

### 1️⃣ Dashboard
- Shows welcome message
- System overview
- Quick navigation buttons

### 2️⃣ Patients
- **View**: Browse all patients with pagination
- **Search**: Find patients by name
- **Add**: Create new patient record
- **Edit**: Update patient information
- **Delete**: Remove patient (with confirmation)

### 3️⃣ Appointments
- **Schedule**: Book appointment (select patient, doctor, date, time)
- **View**: See all scheduled appointments
- **Reschedule**: Change appointment date/time
- **Cancel**: Cancel appointment (with confirmation)

### 4️⃣ Staff
- **View**: Browse all staff members
- **Search**: Find staff by name/email
- **Add**: Register new staff member
- **Edit**: Update staff information
- **Status**: Active, Inactive, Suspended

### 5️⃣ Wards & Beds
- **View**: See all wards and their capacity
- **Beds**: Manage bed status (Available, Occupied, Cleaning, Maintenance)
- **Occupancy**: Check real-time occupancy rates

### 6️⃣ Inventory
- **View**: Browse all medical items
- **Search**: Find items by name
- **Add**: Add new inventory item
- **Edit**: Update item details
- **Adjust**: Increase/decrease quantity
- **Alerts**: Automatic low-stock detection

### 7️⃣ Billing
- **Create**: Generate new invoice with line items
- **View**: See all invoices
- **Update**: Change invoice status (Draft, Issued, Paid, Overdue, Cancelled)
- **Calculations**: Auto-calculate subtotal, tax, discount, total

### 8️⃣ Reports
Generate analytics for:
- Patient statistics (demographics, blood groups)
- Appointment trends (status breakdown, doctor workload)
- Ward occupancy rates
- Inventory status (low stock alerts)
- Financial reports (revenue, payments)
- Staff distribution

### 9️⃣ Settings
- Change password
- View account information
- Manage notification preferences
- System information
- Logout

---

## Common Tasks

### Create a New Patient
1. Click **Patients** in sidebar
2. Click **Add Patient** button
3. Fill in form:
   - Name
   - Date of Birth
   - Gender
   - Email
   - Contact Number
   - Blood Group
   - Insurance ID (optional)
   - Allergies (optional)
   - Chronic Conditions (optional)
   - Current Medications (optional)
4. Click **Save Patient**
5. See success notification
6. Patient appears in table

### Schedule an Appointment
1. Click **Appointments** in sidebar
2. Click **Schedule Appointment** button
3. Select:
   - Patient (dropdown)
   - Doctor (dropdown)
   - Date
   - Time
   - Type (Checkup, Follow-up, Consultation, etc.)
   - Reason (optional)
4. Click **Schedule**
5. Appointment appears in list

### Generate a Report
1. Click **Reports** in sidebar
2. Choose report type:
   - Patient Statistics
   - Appointment Analytics
   - Ward Occupancy
   - Inventory Status
   - Financial Report
   - Staff Report
3. Click **Generate Report** button
4. Report displays with detailed data

---

## Troubleshooting

### 🔴 "Connection refused" or 404 Error
- ✅ Check backend is running: `npm start` in backend folder
- ✅ Check port 3000 is not blocked
- ✅ Check frontend is running: `python -m http.server 8000`

### 🔴 Login Not Working
- ✅ Verify email and password are correct
- ✅ Check browser console for errors (F12)
- ✅ Verify backend is responding: open `http://localhost:3000/api/health` in browser

### 🔴 Data Not Saving
- ✅ Check if you're logged in (look for username in top-right)
- ✅ Check browser console (F12) for error messages
- ✅ Verify database is connected on backend

### 🔴 Modal Not Closing
- ✅ Click the ✕ button in top-right of modal
- ✅ Click outside the modal area
- ✅ F5 to refresh page

### 🔴 Missing Dropdown Options
- ✅ Module might still be loading
- ✅ Wait 1-2 seconds and try again
- ✅ Refresh page (F5)

---

## Keyboard Shortcuts

- **F12** - Open developer console
- **Ctrl+Shift+I** - Open inspector
- **Escape** - Close modal (sometimes)

---

## Test Data Available

The system comes pre-loaded with:
- **6 Users** with different roles
- **20 Patients** with complete medical histories
- **20 Appointments** already scheduled
- **4 Wards** (General, Cardiology, ICU, Pediatrics)
- **5 Inventory Items** (medicines and supplies)

You can freely add/edit/delete these to test functionality.

---

## Browser Compatibility

✅ Chrome/Chromium (Recommended)
✅ Firefox
✅ Safari
✅ Edge

Minimum requirement: JavaScript enabled, localStorage enabled

---

## Performance Notes

- Pagination set to 10 items per page (configurable)
- Large datasets load with pagination
- Search functionality is instant
- Reports may take 1-2 seconds to generate

---

## Security Notes

- 🔐 Password stored securely on backend
- 🔐 Authentication token in localStorage
- 🔐 Token expires after inactivity (backend configurable)
- 🔐 All API calls require valid Bearer token
- 🔐 Role-based access control on backend

---

## Support Resources

📖 **Documentation**: See `IMPLEMENTATION_SUMMARY.md`

🐛 **Debug Issues**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for API responses

💾 **Database Issues**:
1. Check PostgreSQL is running
2. Verify connection string in backend
3. Run `npm run seed` to reset database

🚀 **Backend Issues**:
1. Check `backend/` folder has node_modules
2. Run `npm install` if needed
3. Check port 3000 is available

---

## Next Steps

1. ✅ Login to system
2. ✅ Test creating/editing data
3. ✅ Generate reports
4. ✅ Test all modules
5. ✅ Verify data persistence
6. ✅ Check notifications work
7. ✅ Test logout/login again

---

**System Ready**: The Hospital Admin System is fully operational and ready for use! 🎉
