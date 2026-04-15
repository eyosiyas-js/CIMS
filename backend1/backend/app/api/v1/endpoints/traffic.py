import shutil
import uuid
import os
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.core.websockets import manager

router = APIRouter()

@router.post("/location")
def update_location(
    lat: float = Form(...),
    lng: float = Form(...),
    heading: Optional[float] = Form(None),
    speed: Optional[float] = Form(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update officer's live GPS location.
    """
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    try:
        crud.officer_location.upsert_location(
            db, 
            user_id=current_user.id, 
            org_id=current_user.organization_id,
            lat=lat, 
            lng=lng, 
            heading=heading, 
            speed=speed
        )
        return {"msg": "Location updated successfully"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.post("/offline")
def go_offline(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark officer as offline.
    """
    crud.officer_location.set_offline(db, user_id=current_user.id)
    return {"msg": "Marked offline successfully"}

@router.get("/location/status")
def get_location_status(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get officer's current location status.
    """
    loc = db.query(models.OfficerLocation).filter(models.OfficerLocation.user_id == current_user.id).first()
    if not loc:
        return {"is_online": False}
    return {
        "is_online": loc.is_online,
        "last_seen": loc.last_seen.isoformat() if loc.last_seen else None,
        "lat": loc.lat,
        "lng": loc.lng
    }

@router.get("/alerts")
def get_alerts(
    status: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get active alerts for the current officer.
    """
    alerts = crud.traffic_alert.get_officer_alerts(db, officer_id=current_user.id, status=status)
    result = []
    for a in alerts:
        det = a.detection
        cam = a.camera
        result.append({
            "id": a.id,
            "detectionId": a.detection_id,
            "cameraId": a.camera_id,
            "cameraName": cam.name if cam else "Unknown",
            "distanceKm": a.distance_km,
            "status": a.status,
            "notes": a.notes,
            "proofUrls": a.proof_urls,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
            "detectionInfo": {
                "category": det.category,
                "name": det.name,
                "plateNumber": det.plate_number,
                "description": det.description,
                "imageUrls": det.image_urls
            } if det else None,
            "cameraInfo": {
                "lat": cam.lat,
                "lng": cam.lng
            } if cam else None
        })
    return result

@router.get("/alerts/{id}")
def get_alert_detail(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get specific alert details.
    """
    alert = crud.traffic_alert.get_alert(db, alert_id=id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    det = alert.detection
    cam = alert.camera
    return {
        "id": alert.id,
        "detectionId": alert.detection_id,
        "cameraId": alert.camera_id,
        "cameraName": cam.name if cam else "Unknown",
        "distanceKm": alert.distance_km,
        "status": alert.status,
        "notes": alert.notes,
        "proofUrls": alert.proof_urls,
        "createdAt": alert.created_at.isoformat() if alert.created_at else None,
        "acceptedAt": alert.accepted_at.isoformat() if alert.accepted_at else None,
        "resolvedAt": alert.resolved_at.isoformat() if alert.resolved_at else None,
        "detectionInfo": {
            "category": det.category,
            "name": det.name,
            "plateNumber": det.plate_number,
            "description": det.description,
            "imageUrls": det.image_urls
        } if det else None,
        "cameraInfo": {
            "lat": cam.lat,
            "lng": cam.lng
        } if cam else None
    }

@router.post("/alerts/{id}/respond")
def respond_to_alert(
    id: str,
    status: str = Form(...),
    notes: Optional[str] = Form(None),
    proofFiles: List[UploadFile] = File(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Respond to an alert (accept, update status, resolve, fail) with optional proof.
    """
    alert = crud.traffic_alert.get_alert(db, alert_id=id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    valid_statuses = ["accepted", "en_route", "on_scene", "resolved", "failed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status transition")

    proof_urls = []
    if proofFiles:
        for imageFile in proofFiles:
            file_extension = os.path.splitext(imageFile.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join("uploads", unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(imageFile.file, buffer)
            proof_urls.append(f"/uploads/{unique_filename}")

    updated_alert = crud.traffic_alert.update_alert_status(
        db, alert_id=id, status=status, notes=notes, proof_urls=proof_urls if proof_urls else None
    )

    # Sync detection's handling status globally
    if status in ["resolved", "failed"]:
        det = alert.detection
        if det:
            det.handling_status = status
            if notes:
                det.handling_notes = notes
            if updated_alert.proof_urls:
                det.handling_proof_urls = updated_alert.proof_urls
            db.commit()

    return {"msg": "Alert status updated", "status": updated_alert.status}

@router.get("/nearby")
def get_nearby_officers(
    lat: float,
    lng: float,
    radius: float = 2.0,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("detections.manage")),
) -> Any:
    """
    View online officers near a location.
    """
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    nearby_tuples = crud.officer_location.find_nearby_officers(
        db, org_id=current_user.organization_id, lat=lat, lng=lng, radius_km=radius
    )
    
    return [
        {
            "userId": off.user_id,
            "fullName": off.user.full_name if off.user else "Unknown",
            "lat": off.lat,
            "lng": off.lng,
            "distanceKm": dist,
            "lastSeen": off.last_seen.isoformat() if off.last_seen else None
        }
        for (off, dist) in nearby_tuples
    ]
