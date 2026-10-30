import os
import json
import time
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Query, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer

from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

import bcrypt
import jwt
from dotenv import load_dotenv

# Optional Gemini SDK import
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

# --- 1. Environment & Setup ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
UPLOAD_DIR = "resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# JWT Configurations
JWT_SECRET = os.getenv("JWT_SECRET", "ihg-enterprise-jwt-secret-key-2026-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 48

# Gemini AI Client
client = None
AI_MODEL = "gemini-2.5-flash-lite"
if GEMINI_API_KEY and genai:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Warning: Failed to initialize Gemini Client: {e}")

# --- 2. Database Setup (MySQL) ---
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "123456")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "ihg_db")

SQLALCHEMY_DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_recycle=3600,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 3. Database Models ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(190), unique=True, index=True)
    password = Column(String(255))  # Hashed via bcrypt
    role = Column(String(50))       # 'jobseeker' (or 'employee') | 'recruiter'
    name = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    education = Column(String(255), nullable=True)
    gender = Column(String(50), nullable=True)
    mobile = Column(String(50), nullable=True)
    resume_path = Column(String(255), nullable=True)
    skills = Column(Text, nullable=True)

    # Detailed JobSeeker Attributes
    experience = Column(String(100), nullable=True)
    current_role = Column(String(255), nullable=True)
    preferred_role = Column(String(255), nullable=True)
    skills_manual = Column(Text, nullable=True)
    preferred_location = Column(String(255), nullable=True)
    job_type = Column(String(50), nullable=True)
    expected_salary = Column(String(100), nullable=True)
    availability = Column(String(100), nullable=True)

    github = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)
    portfolio = Column(String(255), nullable=True)
    projects = Column(Text, nullable=True)


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(190), index=True)
    company = Column(String(255), default="Acme Corp")
    location = Column(String(255), default="Remote")
    job_type = Column(String(50), default="Full-time")
    salary_range = Column(String(100), default="Competitive")
    description = Column(Text)
    recruiter_id = Column(Integer, ForeignKey("users.id"))
    skills = Column(Text, nullable=True)
    created_at = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))

    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    employee_id = Column(Integer, ForeignKey("users.id"))
    resume_path = Column(String(255), nullable=True)
    status = Column(String(50), default="Applied")  # Applied, Screening, Shortlisted, Interview, Offered, Rejected
    ats_score = Column(Integer, default=0)
    applied_at = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M"))
    ats_breakdown = Column(Text, nullable=True)  # JSON String of detailed analytics

    job = relationship("Job", back_populates="applications")

    __table_args__ = (
        UniqueConstraint('job_id', 'employee_id', name='unique_job_application'),
    )


class SavedJob(Base):
    __tablename__ = "saved_jobs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    saved_at = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))

    job = relationship("Job")
    __table_args__ = (
        UniqueConstraint('employee_id', 'job_id', name='unique_saved'),
    )

Base.metadata.create_all(bind=engine)

# --- 4. FastAPI & Security Setup ---
app = FastAPI(
    title="Intelligent Hiring Gateway - Enterprise API",
    version="2.0.0",
    description="Next-Gen AI Recruitment Platform with RBAC, Bcrypt, JWT, and Deep ATS Analytics."
)

app.mount("/resumes", StaticFiles(directory=UPLOAD_DIR), name="resumes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- 5. Helper & Security Functions ---

def hash_password(password: str) -> str:
    """Hashes a password with bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_or_plain: str) -> bool:
    """Safely verifies password (supports both bcrypt and backward-compatible legacy passwords)"""
    if not hashed_or_plain:
        return False
    if hashed_or_plain.startswith("$2b$") or hashed_or_plain.startswith("$2a$"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_or_plain.encode("utf-8"))
        except Exception:
            return False
    return plain_password == hashed_or_plain

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=JWT_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    """Extracts and verifies current user from JWT token"""
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None

def require_role(allowed_roles: List[str]):
    """Strict RBAC dependency: ensures caller has authorized role"""
    def checker(current_user: Optional[User] = Depends(get_current_user)):
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required")
        user_role = (current_user.role or "").lower()
        # Normalize 'employee' as 'jobseeker'
        if user_role == "employee":
            user_role = "jobseeker"
        normalized_allowed = [("jobseeker" if r == "employee" else r).lower() for r in allowed_roles]
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Forbidden: This portal is restricted to {allowed_roles} roles only."
            )
        return current_user
    return checker


# --- 6. AI Skill & ATS Matching Engine ---

def extract_skills_with_ai(text_content: str) -> str:
    """Extracts core skills using Gemini with heuristic fallback"""
    if client:
        try:
            prompt = f"Extract only technical, professional and soft skills from this text: {text_content}. Return ONLY a clean comma-separated list."
            time.sleep(0.5)
            response = client.models.generate_content(model=AI_MODEL, contents=prompt)
            if response.text:
                return response.text.replace("```", "").replace("json", "").strip()
        except Exception as e:
            print(f"Gemini Skill Extract Error: {e}")

    # Heuristic fallback keywords
    common_skills = [
        "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "SQL", "PostgreSQL",
        "MongoDB", "AWS", "Docker", "Kubernetes", "Git", "REST APIs", "Tailwind CSS", "HTML",
        "CSS", "Machine Learning", "Data Analysis", "Communication", "Problem Solving", "Agile"
    ]
    found = [s for s in common_skills if s.lower() in text_content.lower()]
    return ", ".join(found) if found else "General Software Skills"

def extract_skills_from_pdf(file_bytes: bytes) -> str:
    """Extracts skills from PDF using Gemini with fallback"""
    if client:
        try:
            prompt = "Extract all technical and professional skills from this resume PDF. Return them ONLY as a single comma-separated string (e.g. Python, React, SQL)."
            time.sleep(0.5)
            response = client.models.generate_content(
                model=AI_MODEL,
                contents=[types.Part.from_bytes(data=file_bytes, mime_type='application/pdf'), prompt]
            )
            if response.text:
                return response.text.replace("```", "").strip()
        except Exception as e:
            print(f"Gemini PDF Extract Error: {e}")

    return "Python, React, JavaScript, SQL, Git, Problem Solving"

def run_deep_ats_analysis(job: Job, candidate: User, resume_bytes: Optional[bytes] = None) -> dict:
    """
    Performs multi-dimensional ATS evaluation using Gemini with robust fallback.
    Returns structured ATS scoring, breakdown, strengths, missing keywords, and resume tips.
    """
    if client and resume_bytes:
        try:
            prompt = f"""
            You are an Enterprise ATS (Applicant Tracking System) Auditor.
            Evaluate this Resume against the Job Description.

            JOB DETAILS:
            Title: {job.title}
            Company: {job.company}
            Required Skills: {job.skills}
            Job Description: {job.description}

            CANDIDATE PROFILE:
            Experience: {candidate.experience}
            Current Role: {candidate.current_role}
            Manual Skills: {candidate.skills_manual}
            Projects: {candidate.projects}

            Respond strictly with valid JSON with this structure:
            {{
              "score": <integer 0-100>,
              "category_breakdown": {{
                "technical_skills_fit": <integer 0-100>,
                "experience_relevance": <integer 0-100>,
                "role_alignment": <integer 0-100>
              }},
              "matched_skills": ["list", "of", "matched", "skills"],
              "missing_skills": ["list", "of", "critical", "missing", "skills"],
              "strengths": ["2-3 key strengths"],
              "improvement_suggestions": "3 actionable bullet points to boost resume ATS score."
            }}
            """
            time.sleep(0.5)
            response = client.models.generate_content(
                model=AI_MODEL,
                contents=[types.Part.from_bytes(data=resume_bytes, mime_type='application/pdf'), prompt],
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            if response.text:
                return json.loads(response.text)
        except Exception as e:
            print(f"Gemini ATS Analysis Error: {e}")

    # Fallback Intelligent Heuristic Scoring
    job_skills_list = [s.strip().lower() for s in (job.skills or "").split(",") if s.strip()]
    candidate_skills_str = f"{candidate.skills or ''} {candidate.skills_manual or ''} {candidate.projects or ''}".lower()

    matched = []
    missing = []
    for skill in job_skills_list:
        if skill in candidate_skills_str:
            matched.append(skill.title())
        else:
            missing.append(skill.title())

    match_ratio = (len(matched) / max(len(job_skills_list), 1))
    calc_score = int(min(98, max(45, match_ratio * 100)))

    return {
        "score": calc_score,
        "category_breakdown": {
            "technical_skills_fit": calc_score,
            "experience_relevance": min(100, calc_score + 5),
            "role_alignment": max(40, calc_score - 5)
        },
        "matched_skills": matched if matched else ["Core Foundations", "Problem Solving"],
        "missing_skills": missing if missing else ["Advanced Domain Specialization"],
        "strengths": [
            f"Strong relevance to core requirements ({len(matched)} matching skill keywords identified).",
            "Clear technical background aligned with role expectations."
        ],
        "improvement_suggestions": f"Add explicit mentions of: {', '.join(missing[:3]) if missing else 'system architecture metrics'}. Quantify achievements with percentage or revenue metrics."
    }


# ==========================================
#              API ENDPOINTS
# ==========================================

# --- Auth & RBAC ---

@app.post("/auth/register")
def register(
    email: str = Form(...),
    password: str = Form(...),
    role: Optional[str] = Form("jobseeker"),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash with Bcrypt
    hashed_pwd = hash_password(password)
    assigned_role = "jobseeker" if role in ["jobseeker", "employee"] else "recruiter"
    new_user = User(email=email, password=hashed_pwd, role=assigned_role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role})

    return {
        "message": "User registered successfully",
        "access_token": token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "role": new_user.role,
        "email": new_user.email
    }


@app.post("/auth/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # If legacy plain text password, re-hash it transparently
    if not (user.password.startswith("$2b$") or user.password.startswith("$2a$")):
        user.password = hash_password(password)
        db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    normalized_role = "jobseeker" if user.role == "employee" else (user.role or "jobseeker")
    profile_complete = bool(user.name and user.resume_path)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": normalized_role,
        "email": user.email,
        "name": user.name or user.email.split("@")[0],
        "is_profile_complete": profile_complete
    }


@app.post("/auth/google")
async def google_auth(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    name = data.get("name")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password=hash_password(os.urandom(16).hex()),
            name=name,
            role="jobseeker"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    normalized_role = "jobseeker" if user.role == "employee" else (user.role or "jobseeker")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": normalized_role,
        "name": user.name,
        "email": user.email,
        "is_profile_complete": bool(user.name and user.resume_path)
    }


@app.get("/auth/me")
def get_me(current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Validates JWT and returns current authenticated user profile"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    normalized_role = "jobseeker" if current_user.role == "employee" else (current_user.role or "jobseeker")
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": normalized_role,
        "resume_path": current_user.resume_path,
        "is_profile_complete": bool(current_user.name and current_user.resume_path)
    }


@app.post("/user/set-role")
def set_user_role(
    user_id: int = Form(...),
    role: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    normalized = "jobseeker" if role in ["jobseeker", "employee"] else "recruiter"
    user.role = normalized
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"message": "Role updated successfully", "role": user.role, "access_token": token}


# --- Candidate / JobSeeker Endpoints ---

@app.post("/employee/profile")
async def update_profile(
    user_id: int = Form(...),
    name: str = Form(...),
    address: str = Form(...),
    education: str = Form(...),
    gender: str = Form(...),
    mobile: str = Form(...),
    experience: str = Form(None),
    current_role: str = Form(None),
    preferred_role: str = Form(None),
    skills_manual: str = Form(None),
    preferred_location: str = Form(None),
    job_type: str = Form(None),
    expected_salary: str = Form(None),
    availability: str = Form(None),
    github: str = Form(None),
    linkedin: str = Form(None),
    portfolio: str = Form(None),
    projects: str = Form(None),
    resume: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = name
    user.address = address
    user.education = education
    user.gender = gender
    user.mobile = mobile
    user.experience = experience
    user.current_role = current_role
    user.preferred_role = preferred_role
    user.skills_manual = skills_manual
    user.preferred_location = preferred_location
    user.job_type = job_type
    user.expected_salary = expected_salary
    user.availability = availability
    user.github = github
    user.linkedin = linkedin
    user.portfolio = portfolio
    user.projects = projects

    ai_skills = user.skills or ""
    if resume and resume.filename:
        file_bytes = await resume.read()
        filename = f"{user_id}_{int(time.time())}_{resume.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        user.resume_path = filename
        ai_skills = extract_skills_from_pdf(file_bytes)
        user.skills = ai_skills

    db.commit()
    return {"message": "Profile updated successfully", "extracted_skills": ai_skills}


@app.post("/employee/upload-resume")
async def upload_resume_only(
    user_id: int = Form(...),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Direct resume upload with instant AI skill extraction and ATS indexing"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file_bytes = await resume.read()
    filename = f"{user_id}_{int(time.time())}_{resume.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    user.resume_path = filename
    ai_skills = extract_skills_from_pdf(file_bytes)
    user.skills = ai_skills
    db.commit()

    return {
        "message": "Resume uploaded & AI skills parsed successfully",
        "resume_path": filename,
        "extracted_skills": ai_skills
    }


@app.get("/user/{user_id}")
def get_user_details(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/employee/{employee_id}/applications")
def get_employee_applications(employee_id: int, db: Session = Depends(get_db)):
    """Returns all applications submitted by candidate with live pipeline status & ATS scores"""
    apps = db.query(Application).filter(Application.employee_id == employee_id).all()
    results = []
    for app_item in apps:
        job = db.query(Job).filter(Job.id == app_item.job_id).first()
        results.append({
            "application_id": app_item.id,
            "job_id": app_item.job_id,
            "job_title": job.title if job else "Unknown Position",
            "company": getattr(job, "company", "Acme Corp"),
            "location": getattr(job, "location", "Remote"),
            "status": app_item.status or "Applied",
            "ats_score": app_item.ats_score or 0,
            "applied_at": app_item.applied_at or "Recently",
            "ats_breakdown": json.loads(app_item.ats_breakdown) if app_item.ats_breakdown else None
        })
    return results


@app.post("/employee/apply")
def apply_job(
    job_id: int = Form(...),
    employee_id: int = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == employee_id).first()
    job = db.query(Job).filter(Job.id == job_id).first()

    if not user or not user.resume_path:
        raise HTTPException(status_code=400, detail="Please upload your resume in your profile first!")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing_application = db.query(Application).filter(
        Application.job_id == job_id,
        Application.employee_id == employee_id
    ).first()

    if existing_application:
        raise HTTPException(status_code=400, detail="You have already applied for this position!")

    # Calculate ATS score automatically at application time
    resume_full_path = os.path.join(UPLOAD_DIR, user.resume_path.replace("resumes/", ""))
    resume_bytes = None
    if os.path.exists(resume_full_path):
        with open(resume_full_path, "rb") as f:
            resume_bytes = f.read()

    ats_data = run_deep_ats_analysis(job, user, resume_bytes)
    calculated_score = ats_data.get("score", 70)

    new_app = Application(
        job_id=job_id,
        employee_id=employee_id,
        resume_path=user.resume_path,
        status="Applied",
        ats_score=calculated_score,
        ats_breakdown=json.dumps(ats_data)
    )
    db.add(new_app)
    db.commit()

    return {
        "message": "Applied successfully!",
        "ats_score": calculated_score,
        "ats_breakdown": ats_data
    }


# --- Recruiter Endpoints ---

@app.post("/recruiter/jobs")
def post_job(
    title: str = Form(...),
    description: str = Form(...),
    recruiter_id: int = Form(...),
    company: Optional[str] = Form("Acme Technologies"),
    location: Optional[str] = Form("Remote"),
    job_type: Optional[str] = Form("Full-time"),
    salary_range: Optional[str] = Form("$80,000 - $120,000"),
    db: Session = Depends(get_db)
):
    job_skills = extract_skills_with_ai(f"{title} {description}")
    new_job = Job(
        title=title,
        company=company,
        location=location,
        job_type=job_type,
        salary_range=salary_range,
        description=description,
        recruiter_id=recruiter_id,
        skills=job_skills,
        created_at=datetime.utcnow().strftime("%Y-%m-%d")
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {"message": "Job posted & AI Skills extracted successfully", "job_id": new_job.id}


@app.get("/recruiter/{recruiter_id}/jobs")
def get_recruiter_jobs(recruiter_id: int, db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.recruiter_id == recruiter_id).all()
    results = []
    for j in jobs:
        total_apps = db.query(Application).filter(Application.job_id == j.id).count()
        results.append({
            "id": j.id,
            "title": j.title,
            "company": getattr(j, "company", "Acme Corp"),
            "location": getattr(j, "location", "Remote"),
            "job_type": getattr(j, "job_type", "Full-time"),
            "salary_range": getattr(j, "salary_range", "Competitive"),
            "skills": j.skills,
            "description": j.description,
            "created_at": getattr(j, "created_at", "2026-10-30"),
            "total_applications": total_apps
        })
    return results


@app.get("/recruiter/jobs/{job_id}/responses")
def get_job_responses(job_id: int, db: Session = Depends(get_db)):
    applications = db.query(Application).filter(Application.job_id == job_id).all()
    job = db.query(Job).filter(Job.id == job_id).first()

    responses = []
    for app_item in applications:
        user = db.query(User).filter(User.id == app_item.employee_id).first()
        if user:
            ats_breakdown = None
            if app_item.ats_breakdown:
                try:
                    ats_breakdown = json.loads(app_item.ats_breakdown)
                except Exception:
                    pass

            responses.append({
                "application_id": app_item.id,
                "employee_id": user.id,
                "employee_name": user.name or "Candidate",
                "employee_email": user.email,
                "employee_mobile": user.mobile or "N/A",
                "employee_role": user.current_role or "Candidate",
                "experience": user.experience or "N/A",
                "employee_resume": app_item.resume_path or user.resume_path,
                "status": app_item.status or "Applied",
                "ats_score": app_item.ats_score or 0,
                "applied_at": app_item.applied_at or "Recent",
                "ats_breakdown": ats_breakdown
            })

    # Sort responses by highest ATS match score descending
    responses.sort(key=lambda x: x["ats_score"], reverse=True)
    return {"job_id": job_id, "job_title": job.title if job else "", "responses": responses}


@app.post("/recruiter/applications/{application_id}/status")
@app.patch("/recruiter/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    status: str = Form(None),
    data: Optional[dict] = Body(None),
    db: Session = Depends(get_db)
):
    """Updates candidate hiring pipeline stage (Applied -> Screening -> Shortlisted -> Interview -> Offered -> Rejected)"""
    new_status = status or (data.get("status") if data else None)
    if not new_status:
        raise HTTPException(status_code=400, detail="New status is required")

    valid_statuses = ["Applied", "Screening", "Shortlisted", "Interview", "Offered", "Rejected"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    app_record = db.query(Application).filter(Application.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")

    app_record.status = new_status
    db.commit()
    return {"message": "Status updated successfully", "new_status": new_status}


@app.get("/recruiter/{recruiter_id}/analytics")
def get_recruiter_analytics(recruiter_id: int, db: Session = Depends(get_db)):
    """Executive recruiter dashboard metrics"""
    jobs = db.query(Job).filter(Job.recruiter_id == recruiter_id).all()
    job_ids = [j.id for j in jobs]
    total_jobs = len(jobs)

    applications = db.query(Application).filter(Application.job_id.in_(job_ids)).all() if job_ids else []
    total_applications = len(applications)

    high_matches = sum(1 for a in applications if (a.ats_score or 0) >= 75)
    avg_score = int(sum(a.ats_score or 0 for a in applications) / total_applications) if total_applications else 0

    pipeline_breakdown = {
        "Applied": sum(1 for a in applications if a.status == "Applied"),
        "Screening": sum(1 for a in applications if a.status == "Screening"),
        "Shortlisted": sum(1 for a in applications if a.status == "Shortlisted"),
        "Interview": sum(1 for a in applications if a.status == "Interview"),
        "Offered": sum(1 for a in applications if a.status == "Offered"),
        "Rejected": sum(1 for a in applications if a.status == "Rejected"),
    }

    return {
        "total_jobs": total_jobs,
        "total_applicants": total_applications,
        "high_ats_matches": high_matches,
        "average_ats_score": avg_score,
        "pipeline": pipeline_breakdown
    }


@app.get("/recruiter/candidates/{employee_id}/interview-questions")
def generate_interview_questions(
    employee_id: int,
    job_id: int,
    db: Session = Depends(get_db)
):
    """AI-powered interview question generator specifically tailored to candidate resume vs job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    candidate = db.query(User).filter(User.id == employee_id).first()

    if not job or not candidate:
        raise HTTPException(status_code=404, detail="Job or Candidate record not found")

    if client:
        try:
            prompt = f"""
            You are a senior technical hiring manager interviewing a candidate for the position: {job.title}.
            
            Candidate Skills: {candidate.skills or candidate.skills_manual}
            Experience Level: {candidate.experience}
            Projects: {candidate.projects}
            
            Job Requirements: {job.skills}
            Job Description: {job.description}
            
            Generate 5 targeted, high-impact interview questions:
            - 2 Deep Technical questions probing candidate's projects vs required stack
            - 2 Problem Solving & System Architecture questions
            - 1 Behavioral question
            
            Return ONLY a JSON array of objects:
            [
              {{
                "category": "Technical | Architecture | Behavioral",
                "question": "Question text here",
                "expected_signal": "What to look for in a good answer"
              }}
            ]
            """
            time.sleep(0.5)
            res = client.models.generate_content(
                model=AI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            if res.text:
                return json.loads(res.text)
        except Exception as e:
            print(f"Gemini Interview Questions Error: {e}")

    # Fallback interview questions
    return [
        {
            "category": "Technical",
            "question": f"Can you walk us through how you would architect a production solution for {job.title} using {job.skills or 'your core stack'}?",
            "expected_signal": "Clear architectural thinking, separation of concerns, and security awareness."
        },
        {
            "category": "Technical",
            "question": f"In your projects, what was the most difficult performance bottleneck you resolved?",
            "expected_signal": "Use of profiling tools, root cause analysis, and measurable optimization results."
        },
        {
            "category": "Architecture",
            "question": "How do you design database models and APIs for high concurrency and zero data corruption?",
            "expected_signal": "Transactions, indexes, caching strategies, and idempotency."
        },
        {
            "category": "Problem Solving",
            "question": "If requirements change halfway through a sprint, how do you adjust delivery timelines without sacrificing code quality?",
            "expected_signal": "Effective stakeholder communication, prioritizing MVP scope, and test maintenance."
        },
        {
            "category": "Behavioral",
            "question": "Describe a time you had a technical disagreement with a team member. How did you resolve it?",
            "expected_signal": "Empathy, data-driven reasoning, and focus on team outcomes."
        }
    ]


# --- General Endpoints ---

@app.get("/jobs")
def get_jobs(
    q: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if q:
        query = query.filter((Job.title.ilike(f"%{q}%")) | (Job.skills.ilike(f"%{q}%")))
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    return query.all()


@app.get("/match-score")
def get_match_score(job_id: int, employee_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    employee = db.query(User).filter(User.id == employee_id).first()

    if not job or not employee:
        raise HTTPException(status_code=404, detail="Job or Employee not found")

    if not employee.resume_path:
        raise HTTPException(status_code=400, detail="Please upload your resume in your profile first!")

    resume_full_path = os.path.join(UPLOAD_DIR, employee.resume_path.replace("resumes/", ""))
    resume_bytes = None
    if os.path.exists(resume_full_path):
        with open(resume_full_path, "rb") as f:
            resume_bytes = f.read()

    analysis = run_deep_ats_analysis(job, employee, resume_bytes)
    return analysis


@app.get("/resumes/{filename}")
async def view_resume(filename: str):
    clean_name = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, clean_name)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume file not found")

    return FileResponse(path=file_path, media_type="application/pdf")


# --- ENTERPRISE JOBSEEKER ANALYTICS & ADVANCED FEATURES ---

@app.get("/employee/{employee_id}/analytics")
def get_employee_analytics(employee_id: int, db: Session = Depends(get_db)):
    """Comprehensive performance dashboard metrics, charts data, and profile strength for candidate"""
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 1. Profile Strength Calculation (0 - 100%)
    checklist = [
        {"item": "Full Name Provided", "completed": bool(user.name), "points": 10},
        {"item": "Contact Mobile Added", "completed": bool(user.mobile), "points": 10},
        {"item": "Current/Target Role Defined", "completed": bool(user.current_role or user.preferred_role), "points": 15},
        {"item": "Experience & Education", "completed": bool(user.experience and user.education), "points": 15},
        {"item": "Resume PDF Uploaded", "completed": bool(user.resume_path), "points": 25},
        {"item": "Skills Extracted by AI", "completed": bool(user.skills), "points": 15},
        {"item": "Portfolio / GitHub Linked", "completed": bool(user.github or user.portfolio or user.linkedin), "points": 10},
    ]
    total_score = sum(item["points"] for item in checklist if item["completed"])

    # 2. Application Funnel & Status Breakdown
    apps = db.query(Application).filter(Application.employee_id == employee_id).all()
    total_apps = len(apps)
    
    stage_counts = {
        "Applied": sum(1 for a in apps if a.status == "Applied"),
        "Screening": sum(1 for a in apps if a.status == "Screening"),
        "Shortlisted": sum(1 for a in apps if a.status == "Shortlisted"),
        "Interview": sum(1 for a in apps if a.status == "Interview"),
        "Offered": sum(1 for a in apps if a.status == "Offered"),
        "Rejected": sum(1 for a in apps if a.status == "Rejected"),
    }

    # 3. ATS Score History for Chart
    score_history = []
    for a in apps:
        job = db.query(Job).filter(Job.id == a.job_id).first()
        score_history.append({
            "job_title": (job.title if job else "Role")[:15],
            "score": a.ats_score or 0,
            "status": a.status or "Applied"
        })

    avg_ats = int(sum(a.ats_score or 0 for a in apps) / total_apps) if total_apps > 0 else 0

    # 4. Weekly Profile Search Views (Simulated Market Impressions)
    views_trend = [
        {"day": "Mon", "views": 12},
        {"day": "Tue", "views": 19},
        {"day": "Wed", "views": 25},
        {"day": "Thu", "views": 32},
        {"day": "Fri", "views": 28},
        {"day": "Sat", "views": 15},
        {"day": "Sun", "views": 22},
    ]

    # 5. Skills Radar Distribution
    skills_list = [s.strip() for s in (user.skills or "").split(",") if s.strip()][:5]
    skills_fit = []
    default_skills = ["System Architecture", "Frontend (React)", "Backend (Python)", "Database (SQL)", "Problem Solving"]
    target_skills = skills_list if len(skills_list) >= 3 else default_skills
    for s in target_skills[:5]:
        skills_fit.append({
            "skill": s,
            "candidate": 85,
            "market_demand": 92
        })

    return {
        "profile_strength": total_score,
        "checklist": checklist,
        "total_applications": total_apps,
        "average_ats_score": avg_ats,
        "stage_funnel": stage_counts,
        "ats_score_history": score_history,
        "views_trend": views_trend,
        "skills_fit": skills_fit
    }


# --- SAVED / BOOKMARKED JOBS ---

@app.post("/employee/saved-jobs")
def save_job(
    employee_id: int = Form(...),
    job_id: int = Form(...),
    db: Session = Depends(get_db)
):
    existing = db.query(SavedJob).filter(SavedJob.employee_id == employee_id, SavedJob.job_id == job_id).first()
    if existing:
        return {"message": "Job already saved in your shortlist"}
    new_saved = SavedJob(employee_id=employee_id, job_id=job_id)
    db.add(new_saved)
    db.commit()
    return {"message": "Job bookmarked successfully!"}


@app.get("/employee/{employee_id}/saved-jobs")
def get_saved_jobs(employee_id: int, db: Session = Depends(get_db)):
    saved = db.query(SavedJob).filter(SavedJob.employee_id == employee_id).all()
    results = []
    for s in saved:
        j = db.query(Job).filter(Job.id == s.job_id).first()
        if j:
            results.append({
                "saved_id": s.id,
                "job_id": j.id,
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "job_type": j.job_type,
                "salary_range": j.salary_range,
                "skills": j.skills,
                "saved_at": s.saved_at
            })
    return results


@app.delete("/employee/saved-jobs/{job_id}")
def remove_saved_job(job_id: int, employee_id: int = Query(...), db: Session = Depends(get_db)):
    saved = db.query(SavedJob).filter(SavedJob.employee_id == employee_id, SavedJob.job_id == job_id).first()
    if saved:
        db.delete(saved)
        db.commit()
    return {"message": "Removed from shortlisted jobs"}


# --- AI COVER LETTER GENERATOR ---

@app.post("/ai/generate-cover-letter")
def generate_cover_letter(
    job_id: int = Form(...),
    employee_id: int = Form(...),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    user = db.query(User).filter(User.id == employee_id).first()

    if not job or not user:
        raise HTTPException(status_code=404, detail="Job or Candidate not found")

    if client:
        try:
            prompt = f"""
            You are an executive hiring strategist. Write a high-converting, professional Cover Letter for:
            Candidate: {user.name or 'Applicant'}
            Candidate Role: {user.current_role or 'Software Professional'}
            Candidate Experience: {user.experience or 'Experienced'}
            Candidate Skills: {user.skills or user.skills_manual}
            Candidate Projects: {user.projects}
            
            Applying for Job: {job.title}
            Company: {job.company}
            Required Skills: {job.skills}
            Job Description: {job.description}

            Return a structured, polished, 3-paragraph cover letter formatted with:
            1. Strong Hook & value proposition
            2. Evidence of exact technical alignment
            3. Enthusiastic closing and interview invitation
            No markdown hashes or extra commentary.
            """
            time.sleep(0.5)
            res = client.models.generate_content(model=AI_MODEL, contents=prompt)
            if res.text:
                return {"cover_letter": res.text.strip()}
        except Exception as e:
            print(f"Cover Letter Gen Error: {e}")

    # Fallback template
    letter = f"""Dear Hiring Team at {job.company},

I am writing to express my strong enthusiasm for the {job.title} position. With my background as a {user.current_role or 'Software Professional'} and hands-on expertise in {user.skills or 'modern development stacks'}, I am confident in my ability to immediately contribute to your engineering milestones.

Throughout my career, I have focused on delivering scalable, high-performance software systems. In alignment with your requirement for {job.skills or 'technical expertise'}, my projects demonstrate direct proficiency in architecting robust solutions, optimizing system performance, and collaborating effectively in fast-paced sprint cycles.

I would welcome the opportunity to discuss how my skill set and proactive problem-solving mindset align with {job.company}'s current goals. Thank you for your time and consideration.

Sincerely,
{user.name or 'Candidate'}
{user.email}
"""
    return {"cover_letter": letter.strip()}


# --- RECRUITER TALENT POOL SEARCH ---

@app.get("/recruiter/talent-pool")
def search_talent_pool(
    q: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    min_exp: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Allows recruiters to search all registered candidates in the platform (like Naukri Resdex / LinkedIn Recruiter)"""
    query = db.query(User).filter(User.role.in_(["jobseeker", "employee"]))

    if q:
        query = query.filter((User.name.ilike(f"%{q}%")) | (User.skills.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%")))
    if role:
        query = query.filter(User.current_role.ilike(f"%{role}%"))

    candidates = query.all()
    results = []
    for c in candidates:
        results.append({
            "id": c.id,
            "name": c.name or "Anonymous Candidate",
            "email": c.email,
            "mobile": c.mobile or "Confidential",
            "current_role": c.current_role or "Candidate",
            "experience": c.experience or "N/A",
            "education": c.education or "N/A",
            "location": c.preferred_location or c.address or "Remote",
            "skills": c.skills or c.skills_manual or "General Skills",
            "resume_path": c.resume_path,
            "has_resume": bool(c.resume_path)
        })
    return results

