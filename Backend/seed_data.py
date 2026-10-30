import sys
import os
sys.path.append(os.path.dirname(__file__))

from main import get_db, User, Job, hash_password

def seed():
    db = next(get_db())
    print("Connecting to database for seeding...")

    # 1. Candidate Demo User
    candidate = db.query(User).filter(User.email == "candidate.demo@gateway.ai").first()
    if not candidate:
        candidate = User(
            email="candidate.demo@gateway.ai",
            password=hash_password("CandidatePass123!"),
            role="jobseeker",
            name="Aman Sharma",
            education="B.Tech Computer Science",
            mobile="+91 98765 43210",
            current_role="Full Stack Developer",
            preferred_role="Senior Full Stack Engineer",
            experience="3 Years",
            preferred_location="Remote / Bengaluru",
            skills="React, Node.js, Python, FastAPI, Docker, PostgreSQL, MySQL, Tailwind CSS",
            skills_manual="React, Node.js, Python, FastAPI, Docker, MySQL",
            expected_salary="₹18,00,000 - ₹24,00,000",
            availability="Immediate (15 Days)"
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        print("Created candidate.demo@gateway.ai")
    else:
        candidate.password = hash_password("CandidatePass123!")
        db.commit()
        print("Updated candidate.demo@gateway.ai password")

    # 2. Recruiter Demo User
    recruiter = db.query(User).filter(User.email == "recruiter.demo@gateway.ai").first()
    if not recruiter:
        recruiter = User(
            email="recruiter.demo@gateway.ai",
            password=hash_password("RecruiterPass123!"),
            role="recruiter",
            name="Priya Verma",
            current_role="Talent Acquisition Lead",
            mobile="+91 98111 22334"
        )
        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)
        print("Created recruiter.demo@gateway.ai")
    else:
        recruiter.password = hash_password("RecruiterPass123!")
        db.commit()
        print("Updated recruiter.demo@gateway.ai password")

    # 3. Seed Jobs
    existing_jobs = db.query(Job).count()
    if existing_jobs == 0:
        sample_jobs = [
            Job(
                title="Senior Full Stack Engineer",
                company="Nexus Tech Labs",
                location="Bengaluru / Remote",
                job_type="Full-time",
                salary_range="₹22,00,000 - ₹30,00,000",
                description="We are seeking an experienced Full Stack Engineer proficient in React, FastAPI, and MySQL to design scalable cloud-native architectures.",
                recruiter_id=recruiter.id,
                skills="React, Python, FastAPI, MySQL, Tailwind CSS, Docker"
            ),
            Job(
                title="AI / ML Systems Engineer",
                company="Hyperion AI",
                location="Hyderabad / Hybrid",
                job_type="Full-time",
                salary_range="₹25,00,000 - ₹38,00,000",
                description="Join our core AI team to implement LLM pipelines, RAG systems, and generative agent workflows using PyTorch and Gemini APIs.",
                recruiter_id=recruiter.id,
                skills="Python, PyTorch, Gemini API, FastAPI, Vector DB, NLP"
            ),
            Job(
                title="Frontend Architect (React / Next.js)",
                company="Starlight Digital",
                location="Remote",
                job_type="Full-time",
                salary_range="₹18,00,000 - ₹26,00,000",
                description="Looking for a design-savvy frontend architect who excels at building lightning-fast interactive dashboards, microfrontends, and charting suites.",
                recruiter_id=recruiter.id,
                skills="React, TypeScript, Tailwind CSS, Recharts, Vite"
            ),
            Job(
                title="DevOps & Cloud Reliability Engineer",
                company="CloudScale Networks",
                location="Pune / Remote",
                job_type="Full-time",
                salary_range="₹20,00,000 - ₹28,00,000",
                description="Architect CI/CD pipelines, monitor containerized services, and optimize cloud infrastructure on AWS and Render.",
                recruiter_id=recruiter.id,
                skills="Docker, Kubernetes, AWS, CI/CD, Python, Linux"
            ),
            Job(
                title="Product Designer & UX Lead",
                company="InnoDesign Studios",
                location="Gurugram / On-site",
                job_type="Full-time",
                salary_range="₹16,00,000 - ₹22,00,000",
                description="Craft frictionless candidate journeys, recruiter analytics panels, and enterprise design systems for modern SaaS platforms.",
                recruiter_id=recruiter.id,
                skills="Figma, UI/UX, Design Systems, Wireframing, User Research"
            ),
        ]
        db.add_all(sample_jobs)
        db.commit()
        print(f"Added {len(sample_jobs)} sample industry jobs!")
    else:
        print(f"Database already has {existing_jobs} jobs.")

    print("Seeding completed successfully.")

if __name__ == "__main__":
    seed()
