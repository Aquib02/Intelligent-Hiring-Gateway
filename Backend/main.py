from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import shutil
import time # Added for rate-limit handling
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import sessionmaker, Session, relationship
from google import genai
from google.genai import types
import json
import os
from dotenv import load_dotenv

# --- 1. Environment & AI Setup ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
UPLOAD_DIR = "resumes"

if not GEMINI_API_KEY:
    raise ValueError("Error: .env file mein GEMINI_API_KEY nahi mili!")

client = genai.Client(api_key=GEMINI_API_KEY)
AI_MODEL= "gemini-2.5-flash-lite"
# --- 2. Database Setup ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./jobportal.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 3. Database Models ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String) 
    role = Column(String) 
    name = Column(String, nullable=True)
    address = Column(String, nullable=True)
    education = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    resume_path = Column(String, nullable=True)
    skills = Column(Text, nullable=True)


# NEW FIELDS 👇
    experience = Column(String)
    current_role = Column(String)
    preferred_role = Column(String)

    skills_manual = Column(Text)

    preferred_location = Column(String)
    job_type = Column(String)
    expected_salary = Column(String)
    availability = Column(String)

    github = Column(String)
    linkedin = Column(String)
    portfolio = Column(String)

    projects = Column(Text)





class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    recruiter_id = Column(Integer, ForeignKey("users.id"))
    skills = Column(Text, nullable=True) 
    applications = relationship("Application", back_populates="job")

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    employee_id = Column(Integer, ForeignKey("users.id"))
    job = relationship("Job", back_populates="applications")
    resume_path = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint('job_id', 'employee_id', name='unique_job_application'),
    )

Base.metadata.create_all(bind=engine)

# --- 4. FastAPI Setup ---
app = FastAPI(title="Job Portal API with AI")
app.mount("/resumes", StaticFiles(directory="resumes"), name="resumes")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
os.makedirs(UPLOAD_DIR, exist_ok=True) 
app.mount(f"/{UPLOAD_DIR}", StaticFiles(directory=UPLOAD_DIR), name="resumes")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- HELPER FUNCTIONS (REFINED) ---

def extract_skills_with_ai(text_content):
    """General helper for text-based skill extraction"""
    prompt = f"Extract only professional technical skills from this text: {text_content}. Return ONLY a comma-separated list. No markdown, no bold, no intro."
    try:
        time.sleep(1) # Gap to avoid 429
        response = client.models.generate_content(
            model=AI_MODEL, 
            contents=prompt
        )
        return response.text.replace("```", "").replace("json", "").strip()
    except Exception as e:
        print(f"AI Skill Error: {e}")
        return "Not available"

def extract_skills_from_pdf(file_bytes):
    """Extracts skills directly from PDF bytes"""
    prompt = "Extract all technical and professional skills from this resume PDF. Return them ONLY as a single comma-separated string (e.g. Python, React, SQL). No other text."
    try:
        time.sleep(1) # Gap to avoid 429
        response = client.models.generate_content(
            model=AI_MODEL,
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type='application/pdf'), 
                prompt
            ]
        )
        return response.text.replace("```", "").strip()
    except Exception as e:
        print(f"PDF Extraction Error: {e}")
        return "Not available"

# ==========================================
#                 API ENDPOINTS
# ==========================================

@app.post("/auth/register")
def register(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user: raise HTTPException(status_code=400, detail="Email already registered")
    db.add(User(email=email, password=password, role=None))
    db.commit()
    return {"message": "User registered successfully"}


@app.post("/auth/google") # Frontend ke URL se exact match hona chahiye
async def google_auth(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    name = data.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    # 1. Check karein ki user pehle se hai ya nahi
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # 2. Agar user nahi hai, toh naya user banayein (Default role 'candidate' rakh sakte hain)
        user = User(
            email=email, 
            full_name=name, 
            role="candidate",  # Ya jo bhi aapka logic ho
            is_profile_complete=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 3. Response bhejein jo aapka frontend expect kar raha hai
    return {
        "user_id": user.id,
        "role": user.role,
        "is_profile_complete": getattr(user, 'is_profile_complete', False)
    }






@app.post("/auth/login")
def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or user.password != password:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    profile_complete = True if (user.role == "employee" and user.name and user.resume_path) else False
    return {"user_id": user.id, "role": user.role, "is_profile_complete": profile_complete}

from fastapi import File, UploadFile, Form # Ensure ye imports hain

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


    resume: UploadFile = File(...), # Is line ko check karein
    db: Session = Depends(get_db)
):
    # Baki code same rahega...uvicorn 
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    # Read bytes once to save and to send to Gemini
    file_bytes = await resume.read()
    file_path = os.path.join(UPLOAD_DIR, resume.filename)
    
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Logic: Extract skills directly from the binary PDF
    ai_skills = extract_skills_from_pdf(file_bytes)

    user.name, user.address, user.education = name, address, education
    user.gender, user.mobile, user.resume_path = gender, mobile, resume.filename
    user.skills = ai_skills

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



    
    db.commit()
    return {"message": "Profile updated", "extracted_skills": ai_skills}

@app.post("/recruiter/jobs")
def post_job(title: str = Form(...), description: str = Form(...), recruiter_id: int = Form(...), db: Session = Depends(get_db)):
    # AI Extract skills from the description
    job_skills = extract_skills_with_ai(f"{title} {description}")
    new_job = Job(title=title, description=description, recruiter_id=recruiter_id, skills=job_skills)
    db.add(new_job)
    db.commit()
    return {"message": "Job posted & Skills extracted"}

# 1. Recruiter ki Jobs fetch karne ka endpoint
@app.get("/recruiter/{recruiter_id}/jobs")
def get_recruiter_jobs(recruiter_id: int, db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.recruiter_id == recruiter_id).all()
    return jobs

# 2. Applicants/Responses fetch karne ka endpoint
@app.get("/recruiter/jobs/{job_id}/responses")
def get_job_responses(job_id: int, db: Session = Depends(get_db)):
    # Pehle dekhein ki is Job ke liye kitni applications aayi hain
    applications = db.query(Application).filter(Application.job_id == job_id).all()
    
    responses = []
    for app in applications:
        # Har application ke liye User table se applicant ki detail nikalein
        user = db.query(User).filter(User.id == app.employee_id).first()
        if user:
            responses.append({
                "application_id": app.id,
                "employee_name": user.name,
                "employee_email": user.email,
                "employee_mobile": getattr(user, "mobile", "N/A"), # Agar mobile column hai toh
                "employee_resume": app.resume_path # Path to PDF
            })
            
    # Frontend exactly isi structure ki umeed kar raha hai
    return {"job_id": job_id, "responses": responses}


@app.get("/match-score")
def get_match_score(job_id: int, employee_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    employee = db.query(User).filter(User.id == employee_id).first()
    
    if not job or not employee:
        raise HTTPException(status_code=404, detail="Job or Employee not found")

    if not employee.resume_path:
        raise HTTPException(status_code=400, detail="Please upload your resume first!")

    resume_full_path = os.path.join(UPLOAD_DIR, employee.resume_path)
    if not os.path.exists(resume_full_path):
        raise HTTPException(status_code=404, detail="Resume file missing on server")

    try:
        with open(resume_full_path, "rb") as f:
            resume_bytes = f.read()

        prompt = f"""
        Analyze this Resume PDF against the Job Requirements.
        JOB TITLE: {job.title}
        REQUIRED SKILLS: {job.skills}
        JOB DESCRIPTION: {job.description}

        EXTRA INFO:
        Experience: {employee.experience}
        Manual Skills: {employee.skills_manual}
        Projects: {employee.projects}

        Compare the extracted skills from the resume with the required skills.
        Return ONLY a JSON object:
        {{
          "score": (integer 0-100),
          "matched_skills": ["list of matching skills found"],
          "missing_skills": ["list of critical skills missing from resume"],
          "improvement_suggestions": "Provide 3 short actionable tips."
        }}
        """
        
        time.sleep(1) # Rate limit protection
        response = client.models.generate_content(
            model=AI_MODEL,
            contents=[types.Part.from_bytes(data=resume_bytes, mime_type='application/pdf'), prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
        
    except Exception as e:
        print(f"Match Score Error: {e}")
        raise HTTPException(status_code=500, detail="AI Match Analysis failed")

@app.get("/jobs")
def get_jobs(db: Session = Depends(get_db)):
    return db.query(Job).all()

@app.get("/user/{user_id}")
def get_user_details(user_id: int, db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == user_id).first()

@app.post("/employee/apply")
def apply_job(job_id: int = Form(...), employee_id: int = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == employee_id).first()
    
    
    if not user or not user.resume_path:
        return {"error": "Resume not found in profile!"}, 400
    
    existing_application = db.query(Application).filter(
        Application.job_id == job_id,
        Application.employee_id == employee_id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )

    # DB mein path ko 'resumes/filename.pdf' ke format mein save karein
    db_path = user.resume_path
    if not db_path.startswith("resumes/"):
        db_path = f"resumes/{db_path}"

    new_app = Application(
        job_id=job_id, 
        employee_id=employee_id, 
        resume_path=db_path 
    )
    db.add(new_app)
    db.commit()
    return {"message": "Applied successfully!"}








@app.get("/resumes/{filename}")
async def view_resume(filename: str):
    # Base directory nikalna (jahan main.py hai)
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # Pura rasta banana: [BASE_DIR]/resumes/[filename]
    file_path = os.path.join(BASE_DIR, "resumes", filename)
    
    # DEBUG: Terminal mein rasta print hoga, use dekhiye!
    print(f"--- Checking Path: {file_path} ---")

    if not os.path.exists(file_path):
        print(f"--- Error: File not found at {file_path} ---")
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=file_path, media_type='application/pdf')








@app.post("/user/set-role")
def set_user_role(user_id: int = Form(...), role: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user: 
        user.role = role
        db.commit()
    return {"message": "Role updated"}

