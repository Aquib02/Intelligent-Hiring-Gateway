# Intelligent Hiring Gateway - AI-Powered Recruitment Platform

An enterprise-grade, 3-tier full-stack AI recruitment platform built to streamline the hiring process through automated resume parsing, ATS match-scoring, intelligent candidate ranking using Google Gemini AI, and strict Role-Based Access Control (RBAC).

## Features

* **Strict Role-Based Access Control (RBAC):** Dedicated, isolated portals for Recruiters and Job Seekers. Neither role can access the other's portal.
* **Bcrypt & JWT Security:** Industry-standard password hashing with salt and JSON Web Token (JWT) Bearer authentication.
* **Automated Resume Parsing & Deep ATS Scoring:** Evaluates candidates against job descriptions across technical skills fit, experience relevance, and role alignment.
* **Interactive Hiring Stage Pipeline:** Recruiter Kanban-style status management (Applied, Screening, Shortlisted, Interview, Offered, Rejected).
* **AI Interview Prep Sheet:** Generates targeted technical, architecture, and behavioral questions tailored to candidate resumes vs job descriptions.
* **Robust Backend API:** High-performance asynchronous FastAPI server backed by MySQL.

## Tech Stack

* **Frontend:** React.js, Vite, Tailwind CSS, React Router, Lucide / React Icons
* **Backend:** Python 3.12, FastAPI, SQLAlchemy ORM, PyMySQL
* **Database:** MySQL
* **Security:** Bcrypt, PyJWT
* **AI Engine:** Google Gemini API (2.5 Flash Lite) with intelligent heuristic fallback

## Getting Started

### 1. Prerequisites
* Python (v3.10+) installed
* Node.js (v18+) and npm installed
* MySQL Server (v5.6+) running on port 3306

### 2. Quick Run (Windows)
Double-click `run_all.bat` in the root directory to start both servers.

### 3. Manual Startup
**Backend:**
```powershell
cd Backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Frontend:**
```powershell
cd Frontend
npm run dev
```

* **Frontend App:** http://localhost:5173
* **Backend API Docs:** http://localhost:8000/docs
