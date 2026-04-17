import shutil
import uuid
import os
import asyncio
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

@router.get("/assignments")
def get_assignments(
    status: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get active assignments for the current officer.
    """
    assignments = crud.traffic_alert.get_user_assignments(db, user_id=current_user.id, status=status)
    result = []
    for a in assignments:
        det = a.detection
        cam = None
        if det and det.detected_camera_ids:
            cam = db.query(models.Camera).filter(models.Camera.id == det.detected_camera_ids[-1]).first()
            
        result.append({
            "id": a.id,
            "detectionId": a.detection_id,
            "cameraId": cam.id if cam else "Unknown",
            "cameraName": cam.name if cam else "Unknown",
            "distanceKm": a.distance_at_assignment,
            "status": a.status,
            "notes": a.notes,
            "proofUrls": a.proof_urls,
            "createdAt": a.assigned_at.isoformat() if a.assigned_at else None,
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

@router.get("/assignments/{id}")
def get_assignment_detail(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get specific assignment details.
    """
    assignment = crud.traffic_alert.get_assignment(db, assignment_id=id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    det = assignment.detection
    cam = None
    if det and det.detected_camera_ids:
        cam = db.query(models.Camera).filter(models.Camera.id == det.detected_camera_ids[-1]).first()
        
    return {
        "id": assignment.id,
        "detectionId": assignment.detection_id,
        "cameraId": cam.id if cam else "Unknown",
        "cameraName": cam.name if cam else "Unknown",
        "distanceKm": assignment.distance_at_assignment,
        "status": assignment.status,
        "notes": assignment.notes,
        "proofUrls": assignment.proof_urls,
        "createdAt": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
        "closedAt": assignment.closed_at.isoformat() if assignment.closed_at else None,
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

@router.post("/assignments/{id}/close")
def close_assignment(
    id: str,
    status: str = Form(...),
    notes: Optional[str] = Form(None),
    proofFiles: List[UploadFile] = File(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Close an assignment (resolve or fail) with optional proof.
    """
    assignment = crud.traffic_alert.get_assignment(db, assignment_id=id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    valid_statuses = ["closed_resolved", "closed_failed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status transition. Must be closed_resolved or closed_failed")

    # If the detection is already handled, you can still close it locally, but parent isn't overwritten.
    proof_urls = []
    if proofFiles:
        for imageFile in proofFiles:
            file_extension = os.path.splitext(imageFile.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join("uploads", unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(imageFile.file, buffer)
            proof_urls.append(f"/uploads/{unique_filename}")

    updated_assignment = crud.traffic_alert.update_assignment_status(
        db, assignment_id=id, status=status, notes=notes, proof_urls=proof_urls if proof_urls else None
    )

    # First-to-close behavior syncs parent detection globally
    det = assignment.detection
    if det and det.handling_status not in ["resolved", "failed"]:
        internal_status = "resolved" if status == "closed_resolved" else "failed"
        det.handling_status = internal_status
        if notes:
            det.handling_notes = notes
        if updated_assignment.proof_urls:
            det.handling_proof_urls = updated_assignment.proof_urls
        db.commit()
        
        # Broadcast assignment closed event to dashboard
        asyncio.create_task(manager.broadcast_to_org(
            str(det.organization_id),
            {
                "type": "assignment_updated",
                "detectionId": det.id,
                "status": internal_status
            }
        ))

    return {"msg": "Assignment closed", "status": updated_assignment.status}

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
