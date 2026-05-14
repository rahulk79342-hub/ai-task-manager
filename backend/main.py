from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import tasks, ai
from auth import router as auth_router        # ← import auth router
from database import engine, Base

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Task Manager API",
    description="Full-stack task manager with Claude AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──────────────────────────────
app.include_router(auth_router)               # handles /api/auth/register and /api/auth/login
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(ai.router,    prefix="/api/ai",    tags=["ai"])

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Server is running"}