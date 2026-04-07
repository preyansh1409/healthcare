# Smart Healthcare Management System

A full-stack hospital management system built with **React.js**, **Node.js/Express**, and **MySQL (XAMPP)**.

## 🏥 Features

| Module | Features |
|--------|----------|
| **Admin** | Dashboard analytics, manage doctors/users, bed management, reports |
| **Doctor** | Personal appointments, patient details, prescriptions, diagnosis |
| **Receptionist** | Register patients, book appointments, shift management |
| **AI Integration** | Symptom-based diagnosis suggestions |
| **IoT Integration** | Real-time patient vitals (simulated wearable) |
| **Real-time** | Socket.IO notifications |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- XAMPP (MySQL running on port 3306)
- phpMyAdmin accessible

### 1. Database Setup
1. Open **phpMyAdmin** → Create DB named `healthcare_db`
2. Import `server/database.sql` (the full schema + sample beds)
3. Run the seed script to create demo users:
   ```bash
   node server/scripts/seedUsers.js
   ```

### 2. Start Backend
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

### 3. Start Frontend
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | Admin@123 |
| Doctor | doctor@hospital.com | Doctor@123 |
| Receptionist | nurse@hospital.com | Nurse@123 |

## 📁 Project Structure

```
project/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Sidebar, Navbar, AppointmentCard, PatientForm
│       ├── context/         # AuthContext (JWT)
│       ├── layouts/         # AppLayout
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Admin/       # Dashboard, ManageDoctors, BedManagement
│       │   ├── Doctor/      # DoctorDashboard, PatientDetails
│       │   └── Receptionist/# ReceptionistDashboard, BookAppointment, PatientRegistration
│       └── services/        # api.js (Axios)
│
└── server/                  # Express backend
    ├── config/              # db.js (MySQL pool)
    ├── controllers/         # auth, appointments, doctors, patients, admin
    ├── middleware/          # authMiddleware (JWT + role)
    ├── models/              # (schema reference)
    ├── routes/              # API routes
    ├── scripts/             # seedUsers.js
    ├── database.sql         # Full MySQL schema
    └── app.js               # Express + Socket.IO
```

## 🔌 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/register | Public | Register |
| GET | /api/auth/me | JWT | Get current user |
| GET | /api/appointments | JWT | List appointments (role-filtered) |
| POST | /api/appointments | Receptionist/Admin | Book appointment |
| PUT | /api/appointments/:id | Doctor/Admin | Update status |
| GET | /api/patients | JWT | List patients |
| POST | /api/patients | Receptionist/Admin | Register patient |
| POST | /api/patients/:id/prescriptions | Doctor | Add prescription |
| GET | /api/doctors | JWT | List doctors |
| GET | /api/admin/stats | JWT | Dashboard stats |
| GET | /api/admin/analytics | Admin | Analytics charts |
| GET | /api/admin/beds | JWT | Bed status |
| POST | /api/ai/diagnose | JWT | AI diagnosis |
| POST | /api/iot/vitals | JWT | IoT vitals |

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, React Router v6, Recharts, Lucide React, React Hot Toast, Tailwind CSS

**Backend:** Node.js, Express 4, MySQL2, bcryptjs, jsonwebtoken, Socket.IO, dotenv

**Database:** MySQL via XAMPP (phpMyAdmin)
