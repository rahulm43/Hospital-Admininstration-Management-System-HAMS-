# 🚀 Hospital Admin Management System - Setup Instructions

## Current Status
✅ Node.js v22.20.0 - Installed  
✅ npm 10.9.3 - Installed  
✅ Backend dependencies - Installed  
❌ PostgreSQL - NOT installed  
❌ Docker - NOT installed  

## What You Need to Run the Application

The Hospital Admin Management System requires:
1. **PostgreSQL Database** (Required for backend API)
2. **Node.js & npm** (✅ Already have this)
3. **Frontend HTTP Server** (Optional but recommended)

---

## Option 1: Install PostgreSQL (Recommended)

### Step 1: Download PostgreSQL
1. Go to https://www.postgresql.org/download/windows/
2. Download the Windows installer (version 15 or later)
3. Run the installer

### Step 2: During Installation
- Set password for postgres user (e.g., "postgres" or "admin123")
- Remember the port (default is 5432)
- Install pgAdmin (optional but helpful)

### Step 3: Update .env file
Edit `backend/.env` and set:
```env
DB_PASSWORD=<your-postgres-password>
DB_PORT=5432
```

### Step 4: Create Database
```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database (in psql)
CREATE DATABASE hospital_admin_db;
\q
```

### Step 5: Run Backend
```powershell
cd backend
npm run seed
npm run dev
```

**Access:** http://localhost:3000/api

---

## Option 2: Use Docker (Easiest - if installed)

```powershell
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Then:
docker compose up
```

---

## Option 3: Use SQLite Instead (Quickest Setup)

We can modify the backend to use SQLite instead of PostgreSQL. This requires:

```powershell
# Install SQLite3
npm install sqlite3

# Modify database config
# Then run:
npm run seed
npm run dev
```

---

## Frontend Setup

### Option A: Simple HTTP Server
```powershell
cd frontend
python -m http.server 8000
# Access: http://localhost:8000
```

### Option B: Node.js HTTP Server
```powershell
npm install -g http-server
cd frontend
http-server -p 8000
# Access: http://localhost:8000
```

### Option C: npm's serve
```powershell
npm install -g serve
cd frontend
serve -s . -l 3001
# Access: http://localhost:3001
```

---

## Quick Test (No Database Required)

Test the API health check:
```powershell
cd backend
npm run dev
```

Then in another terminal:
```powershell
curl http://localhost:3000/health
```

Expected response: `{"status":"ok"}`

---

## Recommended Next Steps

1. **Install PostgreSQL** (15+ recommended)
2. **Create database**: `CREATE DATABASE hospital_admin_db;`
3. **Configure .env** with correct credentials
4. **Seed data**: `npm run seed`
5. **Start backend**: `npm run dev`
6. **Start frontend**: `python -m http.server 8000`
7. **Access app**: http://localhost:8000

---

## Troubleshooting

### "psql: command not found"
- PostgreSQL not installed or not in PATH
- Install PostgreSQL from https://www.postgresql.org/download/windows/

### "npm ERR! code ETARGET"
- Already fixed! Updated package.json with compatible versions

### "ECONNREFUSED 127.0.0.1:5432"
- PostgreSQL is not running
- Start PostgreSQL service (services.msc on Windows)

### "Error: connect ENOENT /var/run/postgresql/.s.PGSQL.5432"
- PostgreSQL socket not found
- Check DB_HOST is "localhost" not "/var/run/postgresql" in .env

---

## Default Login Credentials

Once database is set up and seeded:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | Admin@123 |
| Doctor | doctor1@hospital.com | Doctor@123 |
| Nurse | nurse1@hospital.com | Nurse@123 |

---

## Environment Variables

Edit `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_admin_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

---

## File Structure
```
hospital-admin-system/
├── backend/          ← Node.js API (port 3000)
│   ├── src/
│   ├── .env         ← Database config
│   └── package.json
├── frontend/        ← HTML/CSS/JS app (port 8000)
│   └── index.html
└── docs/            ← Documentation
```

---

## What to Do Next

👉 **Recommended**: Install PostgreSQL, then follow "Recommended Next Steps" above

📧 **Questions?** Check the docs/README.md for more details

🎯 **Goal**: Get the app running and test with sample data

---

Generated: November 15, 2025
