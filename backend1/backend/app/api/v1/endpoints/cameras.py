from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.Camera])
def get_cameras(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("cameras.view")),
) -> Any:
    """
    Retrieve cameras.
    """
    is_super = current_user.role.name == "Super Admin"
    cameras = crud.camera.get_all(db, organization_id=current_user.organization_id, is_super=is_super)
    return [
        {
            "id": c.id,
            "name": c.name,
            "location": c.location,
            "lat": c.lat,
            "lng": c.lng,
            "status": c.status,
            "isFlagged": c.is_flagged,
            "streamUrl": c.stream_url,
            "cameraStreamId": c.camera_stream_id,
            "organizationId": c.organization_id,
            "linkedTrafficCompanyId": c.linked_traffic_company_id,
            "linkedTrafficCompanyName": c.linked_traffic_company.name if c.linked_traffic_company else None,
            "lastDetection": "2 mins ago" # Placeholder
        }
        for c in cameras
    ]

@router.get("/{id}", response_model=schemas.Camera)
def get_camera_by_id(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("cameras.view")),
) -> Any:
    """
    Get camera by ID.
    """
    camera = crud.camera.get(db, id=id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    if current_user.role.name != "Super Admin":
        # Check if user's organization has access
        access = db.query(models.CameraAccess).filter(
            models.CameraAccess.camera_id == id,
            models.CameraAccess.organization_id == current_user.organization_id
        ).first()
        if not access:
            raise HTTPException(status_code=403, detail="Not enough permissions to view this camera")
    
    return {
        "id": camera.id,
        "name": camera.name,
        "location": camera.location,
        "lat": camera.lat,
        "lng": camera.lng,
        "status": camera.status,
        "isFlagged": camera.is_flagged,
        "streamUrl": camera.stream_url,
        "cameraStreamId": camera.camera_stream_id,
        "organizationId": camera.organization_id,
        "linkedTrafficCompanyId": camera.linked_traffic_company_id,
        "linkedTrafficCompanyName": camera.linked_traffic_company.name if camera.linked_traffic_company else None,
        "lastDetection": "5 mins ago" # Placeholder
    }

@router.get("/{id}/stream")
def start_camera_stream(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("cameras.view")),
) -> Any:
    """
    Start camera stream.
    """
    camera = crud.camera.get(db, id=id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    if current_user.role.name != "Super Admin":
        access = db.query(models.CameraAccess).filter(
            models.CameraAccess.camera_id == id,
            models.CameraAccess.organization_id == current_user.organization_id
        ).first()
        if not access:
            raise HTTPException(status_code=403, detail="Not enough permissions to access this stream")
    
    # In a real implementation, this would trigger the backend to start 
    # capturing frames and pushing them to the WebSocket.
    return {"status": "success", "message": "Stream started", "id": id}

@router.post("/", response_model=schemas.Camera)
def create_camera(
    *,
    db: Session = Depends(deps.get_db),
    obj_in: schemas.CameraCreate,
    current_user: models.User = Depends(deps.PermissionChecker("cameras.manage")),
) -> Any:
    """
    Create new camera (Super Admin only recommended).
    """
    if current_user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can add cameras to the global pool")
    
    camera = crud.camera.create(db, obj_in=obj_in)
    
    return {
        "id": camera.id,
        "name": camera.name,
        "location": camera.location,
        "lat": camera.lat,
        "lng": camera.lng,
        "status": camera.status,
        "isFlagged": camera.is_flagged,
        "streamUrl": camera.stream_url,
        "cameraStreamId": camera.camera_stream_id,
        "organizationId": camera.organization_id,
        "linkedTrafficCompanyId": camera.linked_traffic_company_id,
        "linkedTrafficCompanyName": camera.linked_traffic_company.name if camera.linked_traffic_company else None,
        "lastDetection": None
    }

@router.put("/{id}", response_model=schemas.Camera)
def update_camera(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    obj_in: schemas.CameraUpdate,
    current_user: models.User = Depends(deps.PermissionChecker("cameras.manage")),
) -> Any:
    """
    Update a camera.
    """
    if current_user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can edit cameras")
    
    camera = crud.camera.get(db, id=id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    camera = crud.camera.update(db, db_obj=camera, obj_in=obj_in)
    return {
        "id": camera.id,
        "name": camera.name,
        "location": camera.location,
        "lat": camera.lat,
        "lng": camera.lng,
        "status": camera.status,
        "isFlagged": camera.is_flagged,
        "streamUrl": camera.stream_url,
        "cameraStreamId": camera.camera_stream_id,
        "organizationId": camera.organization_id,
        "linkedTrafficCompanyId": camera.linked_traffic_company_id,
        "linkedTrafficCompanyName": camera.linked_traffic_company.name if camera.linked_traffic_company else None,
        "lastDetection": None
    }

@router.delete("/{id}", response_model=schemas.Msg)
def delete_camera(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.PermissionChecker("cameras.manage")),
) -> Any:
    """
    Delete a camera.
    """
    if current_user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can delete cameras")
    
    camera = crud.camera.get(db, id=id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    db.delete(camera)
    db.commit()
    return {"msg": "Camera deleted successfully"}

@router.get("/{id}/access-orgs", response_model=List[str])
def get_camera_access_orgs(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("cameras.manage")),
) -> Any:
    """
    Get list of organization IDs that have access to this camera.
    """
    if current_user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can view camera access lists")
        
    access_records = db.query(models.CameraAccess).filter(models.CameraAccess.camera_id == id).all()
    return [a.organization_id for a in access_records]

@router.post("/{id}/access", response_model=schemas.Msg)
def toggle_camera_access(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    obj_in: schemas.CameraAccessToggle,
    current_user: models.User = Depends(deps.PermissionChecker("cameras.manage")),
) -> Any:
    """
    Toggle camera access for an organization.
    """
    if current_user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can manage camera access")
    
    camera = crud.camera.get(db, id=id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    crud.camera.toggle_access(
        db, 
        camera_id=id, 
        organization_id=obj_in.organizationId, 
        has_access=obj_in.hasAccess
    )
    
    action = "granted" if obj_in.hasAccess else "revoked"
    return {"msg": f"Access {action} successfully"}
