"""
Hira Institute (معهد حراء) - Quran Institute Management System
Main FastAPI Application
"""
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import database connection
from database import client

# Import all routers
from routes import (
    auth_router,
    users_router,
    students_router,
    teachers_router,
    halaqas_router,
    staff_router,
    evaluations_router,
    sessions_router,
    reports_router,
    export_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Hira Institute API",
    description="معهد حراء - Quran Institute Management System API",
    version="1.0.0"
)

# Create main API router with /api prefix
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(students_router)
api_router.include_router(teachers_router)
api_router.include_router(halaqas_router)
api_router.include_router(staff_router)
api_router.include_router(evaluations_router)
api_router.include_router(sessions_router)
api_router.include_router(reports_router)
api_router.include_router(export_router)

# Include API router in main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info("Hira Institute API starting up...")


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown."""
    client.close()
    logger.info("Hira Institute API shutting down...")
