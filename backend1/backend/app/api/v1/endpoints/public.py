from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import struct
from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/detections", response_model=List[schemas.DetectionPublic])
def get_public_detections(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Publicly accessible endpoint to retrieve all detections including facial embeddings.
    No authentication required.
    """
    detections = db.query(models.Detection).all()
    results = []
    
    for d in detections:
        # Convert model to dict compatible with Detection schema aliases
        # We manually build the response to ensure embeddings are decoded
        det_data = {
            "id": d.id,
            "category": d.category,
            "name": d.name,
            "description": d.description,
            "age": d.age,
            "location": d.location,
            "subcategory": d.subcategory,
            "crimeType": d.crime_type,
            "imageUrls": d.image_urls or [],
            "status": d.status,
            "createdAt": d.created_at.isoformat() if d.created_at else None,
            "updatedAt": d.updated_at.isoformat() if d.updated_at else None,
            "detectedCameraIds": d.detected_camera_ids or [],
            "detectionEvents": d.detection_events or [],
            "formTemplateId": d.form_template_id,
            "dynamicData": d.dynamic_data or {},
            "assignedCompanyId": d.assigned_company_id,
            "handlingStatus": d.handling_status,
            "handlingNotes": d.handling_notes,
            "handlingProofUrls": d.handling_proof_urls or [],
            "eligibleForAssignment": d.eligible_for_assignment,
            "plateNumber": d.plate_number,
            "code": d.code,
            "region": d.region,
            "faceEmbedding": None
        }
        
        if d.face_embedding:
            try:
                # Convert bytes back to list of floats
                # Detection stored floats (float32)
                num_floats = len(d.face_embedding) // 4
                vector = list(struct.unpack(f"{num_floats}f", d.face_embedding))
                det_data["faceEmbedding"] = vector
            except Exception:
                det_data["faceEmbedding"] = None
                
        results.append(det_data)
        
    return results
