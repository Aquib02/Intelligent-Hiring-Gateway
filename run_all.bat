@echo off
echo ==========================================
echo Starting Intelligent Hiring Gateway
echo ==========================================

start "IHG Backend (FastAPI)" cmd /k "cd /d %~dp0Backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

start "IHG Frontend (Vite React)" cmd /k "cd /d %~dp0Frontend && npm run dev"

echo Backend running on: http://localhost:8000
echo Frontend running on: http://localhost:5173
echo ==========================================
