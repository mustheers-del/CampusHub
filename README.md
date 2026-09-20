# GVMS College Portal – Campus Event Management System

**GVMS College Portal** is a modern, full-stack college portal for campus events, student activity registrations, group hackathons, and administrative analytics. Built with React.js, Express.js, and MySQL.

---

## 📌 Project Overview

**GVMS College Portal** provides a dual-portal system:
1. **Student Portal**: Allows students to create accounts, log in, browse campus events, register individually or in unlimited-member teams/groups, track registered events, and manage their student profile.
2. **Admin Portal**: Gives college administrators a command center to create/edit/delete events, track student registrations, view student directory analytics, generate official event PDF reports, and manage event capacity.

---

## 🚀 Key Features

### 🛡️ Authentication & Role-Based Control
- **Dual User Roles**: `ADMIN` and `STUDENT`.
- **Admin Configuration**: Admin credentials are read from `backend/.env` (`ADMIN_EMAIL` and `ADMIN_PASSWORD`). No hard-coded passwords in source code.
- **Student Accounts**: Students register at `/register` with hashed passwords (`bcryptjs`).
- **Route Guarding**: Frontend `ProtectedRoute` and backend middleware (`verifyToken`, `requireAdmin`, `requireAuth`) enforce strict role authorization.

### 👥 Unlimited Group & Individual Event Registrations
- **Registration Types**:
  - **Individual**: Standard single-student event sign-up.
  - **Group / Team**: Team registration for hackathons, group competitions, and cultural events.
- **Unlimited Group Members**:
  - Dynamic "Add Member" capability allowing team leaders to register teams of any size (e.g. 5, 8, 10+ members) without artificial member limits.
  - Detailed member fields (`full_name`, `email`, `phone`, `course`) stored in `registration_members`.
- **Enforced Rules**:
  - Capacity check (prevents sign-ups when event is full).
  - Duplicate registration prevention (prevents a student/email from signing up twice for the same event).

### 📄 Admin PDF Report Generation
- **Official Event PDF**: Admins can generate and download formatted PDF reports containing event information and registered student rosters using `pdfkit`.

### 👥 Admin Student Directory
- **Student Management**: Filter students by Course and Academic Year, search by Name/Email/Phone, and view student sign-up participation statistics.

---

## 🛠️ Technology Stack

| Layer | Technology | Packages / Dependencies |
| :--- | :--- | :--- |
| **Frontend** | React.js (v18), Vite, React Router v6 | `react`, `react-dom`, `react-router-dom` |
| **Backend** | Node.js, Express.js | `express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `pdfkit`, `cors`, `dotenv` |
| **Database** | MySQL | MySQL Workbench Compatible (`database.sql`) |
| **Design System** | Custom CSS3 | Indigo Accent, White Sidebar, Navy Typography |

---

## 📂 Project Structure

```
CampusHub/
├── database.sql               # Database setup SQL script for MySQL Workbench
├── README.md                  # Comprehensive documentation & Viva guide
├── backend/                   # Express.js REST API
│   ├── controllers/           # Request handlers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── eventController.js
│   │   └── registrationController.js
│   ├── middleware/            # JWT & Role authorization
│   │   └── authMiddleware.js
│   ├── routes/                # Express API routes
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── eventRoutes.js
│   │   └── registrationRoutes.js
│   ├── db.js                  # MySQL pool connection
│   ├── server.js              # Server entry point
│   ├── .env.example           # Environment template
│   └── package.json           # Backend dependencies
└── frontend/                  # React + Vite SPA
    ├── src/
    │   ├── components/        # Reusable UI components
    │   │   ├── Sidebar.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── EventCard.jsx
    │   │   ├── EventModal.jsx
    │   │   ├── RegisterModal.jsx
    │   │   └── ConfirmModal.jsx
    │   ├── context/           # Global authentication state
    │   │   └── AuthContext.jsx
    │   ├── pages/             # Portal pages
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── StudentDashboard.jsx
    │   │   ├── Events.jsx
    │   │   ├── EventDetails.jsx
    │   │   ├── Registrations.jsx
    │   │   ├── MyRegistrations.jsx
    │   │   ├── StudentManagement.jsx
    │   │   └── StudentProfile.jsx
    │   ├── services/          # Centralized API service
    │   │   └── api.js
    │   ├── App.jsx            # Router & AuthProvider
    │   ├── main.jsx           # React DOM root
    │   └── index.css          # Theme stylesheet
    ├── .env.example           # Frontend env template
    ├── package.json           # Frontend dependencies
    └── vite.config.js         # Vite configuration
```

---

## ⚡ Quick Setup Instructions

### 1. MySQL Workbench Database Setup
1. Open **MySQL Workbench**.
2. Open and execute `database.sql` located at the root of the project.
3. This safely migrates/creates `campushub` DB, `users`, `events`, `registrations`, and `registration_members` tables.

### 2. Backend Setup
1. Navigate to `backend/`:
   ```bash
   cd backend
   npm install
   ```
2. Create `.env` (copied from `.env.example`):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=campushub
   ADMIN_EMAIL=admin@gvms.edu
   ADMIN_PASSWORD=your_local_admin_password
   JWT_SECRET=gvms_college_portal_secret_key_2026
   ```
3. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend Setup
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Create `.env` (copied from `.env.example`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
4. Access the portal at `http://localhost:3000`.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Create new student account |
| `POST` | `/api/auth/login` | Public | Sign in as Admin or Student |
| `GET` | `/api/auth/me` | Authenticated | Get current logged-in user |
| `PUT` | `/api/auth/profile` | Student | Update student profile |
| `GET` | `/api/dashboard/stats` | Authenticated | Fetch portal metrics & charts |
| `GET` | `/api/events` | Public / Auth | List events (supports search, category, type) |
| `GET` | `/api/events/:id` | Public / Auth | Get event details & registered roster |
| `POST` | `/api/events` | **Admin Only** | Create a new campus event |
| `PUT` | `/api/events/:id` | **Admin Only** | Update an event |
| `DELETE` | `/api/events/:id` | **Admin Only** | Delete an event |
| `GET` | `/api/events/:id/pdf` | **Admin Only** | Generate official event PDF report |
| `POST` | `/api/events/:id/register` | Authenticated | Register student / team for event |
| `GET` | `/api/registrations` | **Admin Only** | View all student registrations |
| `GET` | `/api/registrations/my-registrations` | **Student Only** | View logged-in student's registrations |
| `DELETE` | `/api/registrations/:id` | Auth (Admin / Owner) | Delete/Cancel a registration |
| `GET` | `/api/admin/students` | **Admin Only** | Admin student directory & analytics |
