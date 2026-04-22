import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import engine
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount static files
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(api_router, prefix=settings.API_V1_STR)

from datetime import datetime, timedelta
from app import crud, models
from app.db.session import SessionLocal
import asyncio

async def reset_camera_alerts():
    """
    Background task to automatically reset camera alert status (is_flagged)
    if no detection has occurred within the configured timeout period.
    """
    while True:
        try:
            db = SessionLocal()
            # Default to 5 minutes if not set
            timeout_mins = crud.system_setting.get_value(db, "camera_alert_timeout_minutes", 5)
            cutoff_time = datetime.utcnow() - timedelta(minutes=float(timeout_mins))
            
            stale_cameras = db.query(models.Camera).filter(
                models.Camera.is_flagged == True,
                models.Camera.last_detection_at < cutoff_time
            ).all()
            
            if stale_cameras:
                logger.info(f"Auto-resetting alerts for {len(stale_cameras)} cameras (timeout: {timeout_mins}m)")
                for camera in stale_cameras:
                    camera.is_flagged = False
                db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Error in reset_camera_alerts background task: {e}")
            if 'db' in locals(): db.close()
        
        await asyncio.sleep(30) # Check every 30 seconds

@app.on_event("startup")
async def startup_event():
    try:
        # Try to create a connection and execute a simple query
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database!")
        
        # Start background task
        asyncio.create_task(reset_camera_alerts())
    except Exception as e:
        logger.error(f"Failed to connect to the database: {e}")

@app.get("/")
def root():
    return {"message": "CIMS Backend is running"}
