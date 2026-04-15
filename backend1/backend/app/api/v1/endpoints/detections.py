from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from datetime import datetime
from app import crud, models, schemas
from app.api import deps
from app.core.push import send_push_notification
import shutil
import os
import uuid
import json
import asyncio
import math
from app.core.websockets import manager

router = APIRouter()

# In-memory throttle cache: "detection_id::camera_id" -> datetime of last trigger
_detection_throttle_cache: dict = {}


def _enrich_detection(db: Session, detection: models.Detection) -> dict:
    """Build a rich response dict for a detection, resolving dynamic data labels."""
    data = {
        "id": detection.id,
        "category": detection.category,
        "name": detection.name,
        "description": detection.description,
        "age": detection.age,
        "location": detection.location,
        "subcategory": detection.subcategory,
        "crimeType": detection.crime_type,
        "imageUrls": detection.image_urls or [],
        "status": detection.status,
        "createdAt": detection.created_at.isoformat() if detection.created_at else "",
        "updatedAt": detection.updated_at.isoformat() if detection.updated_at else "",
        "detectedCameraIds": detection.detected_camera_ids or [],
        "detectionEvents": [],
        "formTemplateId": detection.form_template_id,
        "dynamicData": detection.dynamic_data,
        "resolvedDynamicData": [],
        "assignedCompanyId": detection.assigned_company_id,
        "assignedCompanyName": None,
        "handlingStatus": detection.handling_status,
        "handlingNotes": detection.handling_notes,
        "handlingProofUrls": detection.handling_proof_urls or [],
        "eligibleForAssignment": detection.eligible_for_assignment
    }
    
    if detection.assigned_company_id:
        assigned_org = db.query(models.Organization).filter(models.Organization.id == detection.assigned_company_id).first()
        if assigned_org:
            data["assignedCompanyName"] = assigned_org.name
            
            # For traffic companies, populate assignedOfficers from TrafficAlert records
            if assigned_org.company_type == "traffic_police":
                alerts = db.query(models.TrafficAlert).filter(
                    models.TrafficAlert.detection_id == detection.id
                ).all()
                officers_list = []
                for alert in alerts:
                    officer_user = alert.officer
                    officers_list.append({
                        "officerName": officer_user.full_name if officer_user else "Unknown",
                        "officerEmail": officer_user.email if officer_user else "",
                        "distanceKm": round(alert.distance_km, 2) if alert.distance_km else None,
                        "status": alert.status,
                        "alertId": alert.id,
                        "assignedAt": alert.created_at.isoformat() if alert.created_at else None
                    })
                data["assignedOfficers"] = officers_list
    # Vehicle-specific fields
    data["plateNumber"] = detection.plate_number
    data["code"] = detection.code
    data["region"] = detection.region
    
    # Enrich detection events with camera coordinates and normalize snapshotUrls
    if detection.detection_events:
        enriched_events = []
        for event in detection.detection_events:
            enriched_event = event.copy()
            camera = db.query(models.Camera).filter(models.Camera.id == event.get('cameraId')).first()
            if camera:
                enriched_event['lat'] = camera.lat
                enriched_event['lng'] = camera.lng
            # Ensure snapshotUrls array is always present
            if 'snapshotUrls' not in enriched_event or not enriched_event['snapshotUrls']:
                if enriched_event.get('snapshotUrl'):
                    enriched_event['snapshotUrls'] = [enriched_event['snapshotUrl']]
                else:
                    enriched_event['snapshotUrls'] = []
            enriched_events.append(enriched_event)
        data["detectionEvents"] = enriched_events

    # Resolve dynamic data labels from form template
    if detection.dynamic_data and detection.form_template_id:
        template = db.query(models.FormTemplate).filter(
            models.FormTemplate.id == detection.form_template_id
        ).first()
        if template and template.fields:
            field_map = {f.get('id'): f.get('label') for f in template.fields if isinstance(f, dict)}
            resolved = []
            for field_id, value in detection.dynamic_data.items():
                label = field_map.get(field_id, field_id)
                resolved.append({"label": label, "value": value})
            data["resolvedDynamicData"] = resolved
    
    return data

@router.get("/", response_model=List[schemas.Detection])
def get_detections(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("detections.view")),
) -> Any:
    """
    Retrieve detections.
    """
    if current_user.role.name == "Super Admin":
        detections = db.query(models.Detection).all()
    else:
        from sqlalchemy import or_
        detections = db.query(models.Detection).filter(
            or_(
                models.Detection.organization_id == current_user.organization_id,
                models.Detection.assigned_company_id == current_user.organization_id
            )
        ).all()
    return [_enrich_detection(db, d) for d in detections]

@router.post("/", response_model=schemas.Detection)
async def create_detection(
    *,
    db: Session = Depends(deps.get_db),
    category: str = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    subcategory: Optional[str] = Form(None),
    crimeType: Optional[str] = Form(None),
    cameraId: Optional[str] = Form(None),
    formTemplateId: Optional[str] = Form(None),
    dynamicData: Optional[str] = Form(None),
    eligibleForAssignment: Optional[str] = Form(None),
    allowExternalAssignment: Optional[str] = Form(None),
    plateNumber: Optional[str] = Form(None),
    code: Optional[str] = Form(None),
    region: Optional[str] = None, # Form parameter
    imageFiles: List[UploadFile] = File(None),
    current_user: models.User = Depends(deps.PermissionChecker("detections.manage")),
) -> Any:
    """
    Create new detection (with multipart support).
    """
    # ── Traffic Police enforcement: can only submit vehicle detections ──
    user_org = db.query(models.Organization).filter(
        models.Organization.id == current_user.organization_id
    ).first()
    if user_org and user_org.company_type == "traffic_police" and category != "vehicle":
        raise HTTPException(
            status_code=403,
            detail="Traffic Police companies can only submit vehicle detections"
        )

    import datetime as dt

    # Debouncing / Grouping:
    # If the simulation (or engine) constantly fires detections for the same entity,
    # we should group them by forwarding to `update_detection` which handles event throttling.
    if cameraId:
        COOLDOWN_SECONDS = 300
        cutoff_time = dt.datetime.utcnow() - dt.timedelta(seconds=COOLDOWN_SECONDS)
        
        existing_detection = db.query(models.Detection).filter(
            models.Detection.organization_id == current_user.organization_id,
            models.Detection.category == category,
            models.Detection.name == name,
            models.Detection.updated_at >= cutoff_time
        ).order_by(models.Detection.updated_at.desc()).first()
        
        if existing_detection:
            # Route directly to update_detection to merge instead of duplicating
            return await update_detection(
                db=db,
                id=existing_detection.id,
                category=category,
                name=name,
                description=description,
                age=age,
                location=location,
                subcategory=subcategory,
                crimeType=crimeType,
                status=None,
                cameraId=cameraId,
                formTemplateId=formTemplateId,
                dynamicData=dynamicData,
                eligibleForAssignment=eligibleForAssignment,
                plateNumber=plateNumber,
                code=code,
                region=region,
                imageFiles=imageFiles,
                current_user=current_user
            )

    # Parse boolean safely
    is_eligible_for_assignment = True # Default to True if not provided
    if eligibleForAssignment is not None:
        val = str(eligibleForAssignment).lower().strip()
        is_eligible_for_assignment = val in ("true", "1", "yes", "on")
        print(f"DEBUG: create_detection received eligibleForAssignment='{eligibleForAssignment}', parsed as {is_eligible_for_assignment}")

    is_allow_external = False
    if allowExternalAssignment is not None:
        val = str(allowExternalAssignment).lower().strip()
        is_allow_external = val in ("true", "1", "yes", "on")

    # Actual file saving
    image_urls = []
    if imageFiles:
        for imageFile in imageFiles:
            file_extension = os.path.splitext(imageFile.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join("uploads", unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(imageFile.file, buffer)
            image_urls.append(f"/uploads/{unique_filename}")
    
    # Parse dynamicData JSON string if provided
    parsed_dynamic_data = None
    if dynamicData:
        try:
            parsed_dynamic_data = json.loads(dynamicData)
        except (json.JSONDecodeError, TypeError):
            parsed_dynamic_data = None

    # Validate form template belongs to the organization
    if formTemplateId:
        template = db.query(models.FormTemplate).filter(
            models.FormTemplate.id == formTemplateId,
            models.FormTemplate.organization_id == current_user.organization_id
        ).first()
        if not template:
            raise HTTPException(status_code=400, detail="Invalid form template for your organization")
    
    obj_in = schemas.DetectionCreate(
        category=category,
        name=name,
        description=description,
        age=age,
        location=location,
        subcategory=subcategory,
        crimeType=crimeType if subcategory == "criminal" else None,
        imageUrls=image_urls,
        formTemplateId=formTemplateId,
        dynamicData=parsed_dynamic_data,
        eligibleForAssignment=is_eligible_for_assignment,
        allowExternalAssignment=is_allow_external,
        plateNumber=plateNumber,
        code=code,
        region=region
    )
    
    try:
        from app.services.face_service import get_largest_face_embedding
        face_embedding = None
        if image_urls:
            local_path = image_urls[0].lstrip("/")
            if os.path.exists(local_path):
                embedding = get_largest_face_embedding(local_path)
                if embedding:
                    face_embedding = embedding
    except Exception as e:
        import logging
        logging.error(f"Failed to extract face embedding: {e}")
        face_embedding = None

    detection = crud.detection.create(
        db, obj_in=obj_in, 
        organization_id=current_user.organization_id,
        user_id=current_user.id
    )
    
    # Ensure allow_external_assignment is set
    detection.allow_external_assignment = is_allow_external
    db.add(detection)
    db.commit()
    db.refresh(detection)
    
    if face_embedding:
        detection.face_embedding = face_embedding
        db.add(detection)
        db.commit()
        db.refresh(detection)

    if cameraId:
        camera = crud.camera.get(db, id=cameraId)
        if camera:
            # Check if organization has access to this camera
            access = db.query(models.CameraAccess).filter(
                models.CameraAccess.camera_id == cameraId,
                models.CameraAccess.organization_id == detection.organization_id
            ).first()
            
            if not access:
                raise HTTPException(status_code=400, detail="The organization does not have access to this camera")
            
            # Auto-assign logic
            if detection.handling_status == "unassigned":
                # Determine if the submitting organization is a traffic police company
                submitting_org = db.query(models.Organization).filter(
                    models.Organization.id == detection.organization_id
                ).first()
                is_traffic_org = submitting_org and submitting_org.company_type == "traffic_police"

                if is_traffic_org and detection.category == "vehicle":
                    # ═══ TRAFFIC COMPANY FLOW ═══
                    # Assign to same company (the traffic company itself)
                    detection.assigned_company_id = detection.organization_id
                    detection.handling_status = "pending"
                    
                    # Dispatch to nearby officers (geo proximity)
                    if camera.lat and camera.lng:
                        include_external = detection.allow_external_assignment
                        nearby = crud.officer_location.find_nearby_officers_multi(
                            db, primary_org_id=detection.organization_id,
                            lat=camera.lat, lng=camera.lng, radius_km=2.0,
                            include_external=include_external
                        )
                        for officer, dist in nearby:
                            alert = crud.traffic_alert.create_alert(
                                db, detection_id=detection.id, officer_id=officer.user_id, 
                                camera_id=camera.id, org_id=officer.organization_id, distance_km=dist
                            )
                            # WebSocket push
                            asyncio.create_task(manager.send_to_user(
                                str(officer.user_id),
                                {
                                    "type": "traffic_alert",
                                    "alertId": alert.id,
                                    "detectionId": detection.id,
                                    "cameraId": camera.id,
                                    "cameraName": camera.name,
                                    "distanceKm": dist,
                                    "plateNumber": detection.plate_number,
                                    "description": detection.description,
                                    "timestamp": datetime.utcnow().isoformat()
                                }
                            ))
                            # Expo Push
                            if getattr(officer.user, 'expo_push_token', None):
                                asyncio.create_task(send_push_notification(
                                    expo_push_token=officer.user.expo_push_token,
                                    title="🚨 Traffic Alert: " + (detection.plate_number or "Unknown Vehicle"),
                                    body=f"Flagged vehicle detected {dist:.1f} km away at {camera.name}.",
                                    data={"route": f"/alerts/{alert.id}", "alertId": alert.id, "detectionId": detection.id}
                                ))
                else:
                    # ═══ NON-TRAFFIC COMPANY FLOW ═══
                    if camera.linked_traffic_company_id and detection.category == "vehicle":
                        # Check if the linked company is a traffic_police org
                        linked_org = db.query(models.Organization).filter(
                            models.Organization.id == camera.linked_traffic_company_id
                        ).first()
                        detection.assigned_company_id = camera.linked_traffic_company_id
                        detection.handling_status = "pending"
                        
                        # If the linked company IS traffic_police → dispatch to its officers
                        if linked_org and linked_org.company_type == "traffic_police" and camera.lat and camera.lng:
                            print(f"[TRAFFIC DISPATCH] Camera {camera.name} (lat={camera.lat}, lng={camera.lng}) linked to traffic company '{linked_org.name}' (id={linked_org.id})")
                            include_external = detection.allow_external_assignment
                            nearby = crud.officer_location.find_nearby_officers_multi(
                                db, primary_org_id=linked_org.id,
                                lat=camera.lat, lng=camera.lng, radius_km=5.0,
                                include_external=include_external
                            )
                            print(f"[TRAFFIC DISPATCH] Found {len(nearby)} nearby officers (external={include_external})")
                            for officer, dist in nearby:
                                print(f"[TRAFFIC DISPATCH] → Officer {officer.user_id} (org={officer.organization_id}) at {dist:.2f}km")
                                alert = crud.traffic_alert.create_alert(
                                    db, detection_id=detection.id, officer_id=officer.user_id,
                                    camera_id=camera.id, org_id=officer.organization_id, distance_km=dist
                                )
                                print(f"[TRAFFIC DISPATCH]   Created TrafficAlert id={alert.id}")
                                asyncio.create_task(manager.send_to_user(
                                    str(officer.user_id),
                                    {
                                        "type": "traffic_alert",
                                        "alertId": alert.id,
                                        "detectionId": detection.id,
                                        "cameraId": camera.id,
                                        "cameraName": camera.name,
                                        "distanceKm": dist,
                                        "plateNumber": detection.plate_number,
                                        "description": detection.description,
                                        "timestamp": datetime.utcnow().isoformat()
                                    }
                                ))
                                if getattr(officer.user, 'expo_push_token', None):
                                    asyncio.create_task(send_push_notification(
                                        expo_push_token=officer.user.expo_push_token,
                                        title="🚨 Traffic Alert: " + (detection.plate_number or "Unknown Vehicle"),
                                        body=f"Flagged vehicle detected {dist:.1f} km away at {camera.name}.",
                                        data={"route": f"/alerts/{alert.id}", "alertId": alert.id, "detectionId": detection.id}
                                    ))
                            if len(nearby) == 0:
                                print(f"[TRAFFIC DISPATCH] ⚠ No online officers found near camera. Check OfficerLocation records.")
                    elif detection.eligible_for_assignment and camera.organization_id:
                        detection.assigned_company_id = camera.organization_id
                        detection.handling_status = "pending"
                    else:
                        detection.assigned_company_id = detection.organization_id
                        detection.handling_status = "pending"

            camera.is_flagged = True
            
            # Update detected cameras
            detection.detected_camera_ids = [cameraId]
            
            # Record detection event
            new_event = {
                "id": str(uuid.uuid4()),
                "cameraId": camera.id,
                "cameraName": camera.name,
                "timestamp": datetime.utcnow().isoformat(),
                "snapshotUrl": detection.image_urls[0] if detection.image_urls else None,
                "snapshotUrls": [detection.image_urls[0]] if detection.image_urls else [],
            }
            detection.detection_events = [new_event]
            flag_modified(detection, 'detection_events')
            flag_modified(detection, 'detected_camera_ids')
            
            # Create DB notifications
            notif_org_id = detection.organization_id
            org_users = db.query(models.User).filter(models.User.organization_id == notif_org_id).all()
            for u in org_users:
                perms = u.role.permissions if u.role and u.role.permissions else []
                if "*" in perms or "notifications.view" in perms:
                    notif = models.Notification(
                        id=str(uuid.uuid4()),
                        user_id=u.id,
                        type="alert",
                        title=f"Detection Alert: {camera.name}",
                        message=f"{detection.category} detected at {camera.name}",
                        action_url=f"/cameras?id={camera.id}"
                    )
                    db.add(notif)
            
            db.commit()
            db.refresh(detection)
            
            # Notify via websocket
            asyncio.create_task(manager.broadcast_to_org(
                str(notif_org_id),
                {
                    "type": "new_detection",
                    "title": f"Detection Alert: {camera.name}",
                    "message": f"{detection.category} detected at {camera.name}",
                    "cameraId": camera.id,
                    "detectionId": detection.id,
                    "timestamp": detection.updated_at.isoformat() if detection.updated_at else datetime.utcnow().isoformat(),
                    "cameraCount": 1,
                    "events": [new_event]
                }
            ))

    return _enrich_detection(db, detection)

@router.get("/{id}", response_model=schemas.Detection)
def get_detection(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.PermissionChecker("detections.view")),
) -> Any:
    """
    Get detection by ID.
    """
    detection = crud.detection.get(db, id=id)
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    if current_user.role.name != "Super Admin":
        if detection.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return _enrich_detection(db, detection)

@router.put("/{id}", response_model=schemas.Detection)
async def update_detection(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    category: str = Form(None),
    name: str = Form(None),
    description: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    subcategory: Optional[str] = Form(None),
    crimeType: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    cameraId: Optional[str] = Form(None),
    formTemplateId: Optional[str] = Form(None),
    dynamicData: Optional[str] = Form(None),
    eligibleForAssignment: Optional[str] = Form(None),
    plateNumber: Optional[str] = Form(None),
    code: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    imageFiles: List[UploadFile] = File(None),
    current_user: models.User = Depends(deps.PermissionChecker("detections.manage")),
) -> Any:
    """
    Update detection.
    """
    detection = crud.detection.get(db, id=id)
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    if current_user.role.name != "Super Admin":
        if detection.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    from typing import Dict, Any
    update_data: Dict[str, Any] = {}
    if category is not None: update_data["category"] = category
    if name is not None: update_data["name"] = name
    if description is not None: update_data["description"] = description
    if age is not None: update_data["age"] = age
    if location is not None: update_data["location"] = location
    if subcategory is not None: update_data["subcategory"] = subcategory
    if crimeType is not None: update_data["crimeType"] = crimeType
    if status is not None: update_data["status"] = status
    if formTemplateId is not None: update_data["formTemplateId"] = formTemplateId
    
    if plateNumber is not None: update_data["plateNumber"] = plateNumber
    if code is not None: update_data["code"] = code
    if region is not None: update_data["region"] = region
    
    if eligibleForAssignment is not None:
        val = str(eligibleForAssignment).lower().strip()
        update_data["eligibleForAssignment"] = val in ("true", "1", "yes", "on")
        print(f"DEBUG: update_detection received eligibleForAssignment='{eligibleForAssignment}', parsed as {update_data['eligibleForAssignment']}")
    uploaded_proof_urls = []
    if imageFiles:
        for imageFile in imageFiles:
            file_extension = os.path.splitext(imageFile.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join("uploads", unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(imageFile.file, buffer)
            uploaded_proof_urls.append(f"/uploads/{unique_filename}")
        
        # If cameraId is NOT present, this is a manual update (Edit Request)
        # In this case, we SHOULD update the reference images and face embedding.
        if not cameraId:
            update_data["imageUrls"] = uploaded_proof_urls
            try:
                from app.services.face_service import get_largest_face_embedding
                local_path = uploaded_proof_urls[0].lstrip("/")
                if os.path.exists(local_path):
                    embedding = get_largest_face_embedding(local_path)
                    if embedding:
                        detection.face_embedding = embedding
                        db.add(detection)
                        db.commit()
            except Exception as e:
                import logging
                logging.error(f"Failed to extract face embedding on manual update: {e}")

    obj_in = schemas.DetectionUpdate(**update_data)
    detection = crud.detection.update(db, db_obj=detection, obj_in=obj_in)
    
    if cameraId:
        camera = crud.camera.get(db, id=cameraId)
        if camera:
            # Check if organization has access to this camera
            access = db.query(models.CameraAccess).filter(
                models.CameraAccess.camera_id == cameraId,
                models.CameraAccess.organization_id == detection.organization_id
            ).first()
            
            if not access:
                raise HTTPException(status_code=400, detail="The organization does not have access to this camera")
            
            # ═══════════════════════════════════════════════════════
            # THROTTLE CHECK — uses in-memory cache, not DB state
            # ═══════════════════════════════════════════════════════
            throttle_key = f"{detection.id}::{cameraId}"
            now = datetime.utcnow()
            is_throttled = False

            if throttle_key in _detection_throttle_cache:
                last_trigger = _detection_throttle_cache[throttle_key]
                elapsed = (now - last_trigger).total_seconds()
                print(f"[THROTTLE] key={throttle_key}, elapsed={elapsed:.1f}s")
                if elapsed < 300:  # 5 minutes
                    is_throttled = True

            new_snapshot = uploaded_proof_urls[0] if uploaded_proof_urls else f"https://picsum.photos/seed/{camera.id}_{int(now.timestamp())}/800/450"

            if is_throttled:
                # ── THROTTLED: just append image to latest event, no notification ──
                print(f"[THROTTLE] SUPPRESSED — aggregating image only")
                curr_events = list(detection.detection_events or [])

                # Find the most recent event from this camera and append image
                for i in range(len(curr_events) - 1, -1, -1):
                    if str(curr_events[i].get("cameraId", "")) == str(cameraId):
                        evt = dict(curr_events[i])
                        urls = list(evt.get("snapshotUrls", []))
                        if not urls and evt.get("snapshotUrl"):
                            urls.append(evt["snapshotUrl"])
                        urls.append(new_snapshot)
                        evt["snapshotUrls"] = urls
                        curr_events[i] = evt
                        break

                detection.detection_events = curr_events
                flag_modified(detection, 'detection_events')

                if detection.status not in ["resolved", "failed"]:
                    detection.status = "detected"

                db.add(detection)
                db.commit()
                db.refresh(detection)
            else:
                # ── NOT THROTTLED: full new event + notification ──
                _detection_throttle_cache[throttle_key] = now
                # Clean stale cache entries
                stale = [k for k, v in _detection_throttle_cache.items() if (now - v).total_seconds() > 600]
                for k in stale:
                    del _detection_throttle_cache[k]

                print(f"[THROTTLE] NEW EVENT — setting cache for {throttle_key}")

                if detection.handling_status == "unassigned":
                    submitting_org = db.query(models.Organization).filter(
                        models.Organization.id == detection.organization_id
                    ).first()
                    is_traffic_org = submitting_org and submitting_org.company_type == "traffic_police"

                    if is_traffic_org and detection.category == "vehicle":
                        # ═══ TRAFFIC COMPANY FLOW ═══
                        detection.assigned_company_id = detection.organization_id
                        detection.handling_status = "pending"
                        
                        if camera.lat and camera.lng:
                            include_external = detection.allow_external_assignment
                            nearby = crud.officer_location.find_nearby_officers_multi(
                                db, primary_org_id=detection.organization_id,
                                lat=camera.lat, lng=camera.lng, radius_km=2.0,
                                include_external=include_external
                            )
                            for officer, dist in nearby:
                                alert = crud.traffic_alert.create_alert(
                                    db, detection_id=detection.id, officer_id=officer.user_id,
                                    camera_id=camera.id, org_id=officer.organization_id, distance_km=dist
                                )
                                asyncio.create_task(manager.send_to_user(
                                    str(officer.user_id),
                                    {
                                        "type": "traffic_alert",
                                        "alertId": alert.id,
                                        "detectionId": detection.id,
                                        "cameraId": camera.id,
                                        "cameraName": camera.name,
                                        "distanceKm": dist,
                                        "plateNumber": detection.plate_number,
                                        "description": detection.description,
                                        "timestamp": datetime.utcnow().isoformat()
                                    }
                                ))
                                if getattr(officer.user, 'expo_push_token', None):
                                    asyncio.create_task(send_push_notification(
                                        expo_push_token=officer.user.expo_push_token,
                                        title="🚨 Traffic Alert: " + (detection.plate_number or "Unknown Vehicle"),
                                        body=f"Flagged vehicle detected {dist:.1f} km away at {camera.name}.",
                                        data={"route": f"/alerts/{alert.id}", "alertId": alert.id, "detectionId": detection.id}
                                    ))
                    else:
                        # ═══ NON-TRAFFIC COMPANY FLOW ═══
                        if camera.linked_traffic_company_id and detection.category == "vehicle":
                            linked_org = db.query(models.Organization).filter(
                                models.Organization.id == camera.linked_traffic_company_id
                            ).first()
                            detection.assigned_company_id = camera.linked_traffic_company_id
                            detection.handling_status = "pending"
                            
                            if linked_org and linked_org.company_type == "traffic_police" and camera.lat and camera.lng:
                                print(f"[TRAFFIC DISPATCH UPDATE] Camera {camera.name} linked to traffic company '{linked_org.name}'")
                                include_external = detection.allow_external_assignment
                                nearby = crud.officer_location.find_nearby_officers_multi(
                                    db, primary_org_id=linked_org.id,
                                    lat=camera.lat, lng=camera.lng, radius_km=5.0,
                                    include_external=include_external
                                )
                                print(f"[TRAFFIC DISPATCH UPDATE] Found {len(nearby)} nearby officers")
                                for officer, dist in nearby:
                                    print(f"[TRAFFIC DISPATCH UPDATE] → Officer {officer.user_id} at {dist:.2f}km")
                                    alert = crud.traffic_alert.create_alert(
                                        db, detection_id=detection.id, officer_id=officer.user_id,
                                        camera_id=camera.id, org_id=officer.organization_id, distance_km=dist
                                    )
                                    asyncio.create_task(manager.send_to_user(
                                        str(officer.user_id),
                                        {
                                            "type": "traffic_alert",
                                            "alertId": alert.id,
                                            "detectionId": detection.id,
                                            "cameraId": camera.id,
                                            "cameraName": camera.name,
                                            "distanceKm": dist,
                                            "plateNumber": detection.plate_number,
                                            "description": detection.description,
                                            "timestamp": datetime.utcnow().isoformat()
                                        }
                                    ))
                                    if getattr(officer.user, 'expo_push_token', None):
                                        asyncio.create_task(send_push_notification(
                                            expo_push_token=officer.user.expo_push_token,
                                            title="🚨 Traffic Alert: " + (detection.plate_number or "Unknown Vehicle"),
                                            body=f"Flagged vehicle detected {dist:.1f} km away at {camera.name}.",
                                            data={"route": f"/alerts/{alert.id}", "alertId": alert.id, "detectionId": detection.id}
                                        ))
                                if len(nearby) == 0:
                                    print(f"[TRAFFIC DISPATCH UPDATE] ⚠ No online officers found near camera.")
                        elif detection.eligible_for_assignment and camera.organization_id:
                            detection.assigned_company_id = camera.organization_id
                            detection.handling_status = "pending"
                        else:
                            detection.assigned_company_id = detection.organization_id
                            detection.handling_status = "pending"

                # ═══ RETROACTIVE REPAIR (For Detections without Officers) ═══
                if detection.assigned_company_id:
                    assigned_org = db.query(models.Organization).filter(
                        models.Organization.id == detection.assigned_company_id
                    ).first()
                    if assigned_org and assigned_org.company_type == "traffic_police":
                        existing_alerts = db.query(models.TrafficAlert).filter(
                            models.TrafficAlert.detection_id == detection.id
                        ).count()
                        if existing_alerts == 0 and camera.lat and camera.lng:
                            print(f"[TRAFFIC RETRO-DISPATCH] Repairing dispatch for detection {detection.id}")
                            include_external = detection.allow_external_assignment
                            nearby = crud.officer_location.find_nearby_officers_multi(
                                db, primary_org_id=assigned_org.id,
                                lat=camera.lat, lng=camera.lng, radius_km=5.0,
                                include_external=include_external
                            )
                            for officer, dist in nearby:
                                print(f"[TRAFFIC RETRO-DISPATCH] → Officer {officer.user_id} at {dist:.2f}km")
                                alert = crud.traffic_alert.create_alert(
                                    db, detection_id=detection.id, officer_id=officer.user_id,
                                    camera_id=camera.id, org_id=officer.organization_id, distance_km=dist
                                )
                                asyncio.create_task(manager.send_to_user(
                                    str(officer.user_id),
                                    {
                                        "type": "traffic_alert",
                                        "alertId": alert.id,
                                        "detectionId": detection.id,
                                        "cameraId": camera.id,
                                        "cameraName": camera.name,
                                        "distanceKm": dist,
                                        "plateNumber": detection.plate_number,
                                        "description": detection.description,
                                        "timestamp": datetime.utcnow().isoformat()
                                    }
                                ))

                camera.is_flagged = True
                
                curr_cameras = detection.detected_camera_ids or []
                if cameraId not in curr_cameras:
                    new_cameras = list(curr_cameras)
                    new_cameras.append(cameraId)
                    detection.detected_camera_ids = new_cameras
                    flag_modified(detection, 'detected_camera_ids')

                new_event = {
                    "id": str(uuid.uuid4()),
                    "cameraId": camera.id,
                    "cameraName": camera.name,
                    "timestamp": now.isoformat(),
                    "snapshotUrl": new_snapshot,
                    "snapshotUrls": [new_snapshot],
                }
                curr_events = list(detection.detection_events or [])
                curr_events.append(new_event)
                detection.detection_events = curr_events
                flag_modified(detection, 'detection_events')

                if detection.status not in ["resolved", "failed"]:
                    detection.status = "detected"
                
                notif_org_id = detection.organization_id
                org_users = db.query(models.User).filter(models.User.organization_id == notif_org_id).all()
                for u in org_users:
                    perms = u.role.permissions if u.role and u.role.permissions else []
                    if "*" in perms or "notifications.view" in perms:
                        notif = models.Notification(
                            id=str(uuid.uuid4()),
                            user_id=u.id,
                            type="alert",
                            title=f"Detection Alert: {camera.name}",
                            message=f"{detection.category} detected at {camera.name}",
                            action_url=f"/cameras?id={camera.id}"
                        )
                        db.add(notif)
                
                db.add(detection)
                db.commit()
                db.refresh(detection)
                
                asyncio.create_task(manager.broadcast_to_org(
                    str(notif_org_id),
                    {
                        "type": "alert",
                        "title": f"Detection Alert: {camera.name}",
                        "message": f"{detection.category} detected at {camera.name}",
                        "cameraId": camera.id,
                        "detectionId": detection.id,
                        "timestamp": detection.updated_at.isoformat() if detection.updated_at else "",
                        "cameraCount": len(detection.detected_camera_ids or []),
                        "events": curr_events
                    }
                ))
    
    return _enrich_detection(db, detection)

@router.delete("/{id}", response_model=schemas.Detection)
def delete_detection(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.PermissionChecker("detections.manage")),
) -> Any:
    """
    Delete detection.
    """
    detection = crud.detection.get(db, id=id)
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    if current_user.role.name != "Super Admin":
        if detection.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    result = _enrich_detection(db, detection)
    crud.detection.remove(db, id=id)
    return result

@router.post("/{id}/action", response_model=schemas.Detection)
async def handle_detection_action(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    status: str = Form(...),
    notes: Optional[str] = Form(None),
    proofFiles: List[UploadFile] = File(None),
    current_user: models.User = Depends(deps.PermissionChecker("detections.manage")),
) -> Any:
    """
    Handle detection assignment action, optionally accepting proof images and notes.
    """
    detection = crud.detection.get(db, id=id)
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
        
    if current_user.role.name != "Super Admin":
        if detection.assigned_company_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not assigned to this company")
            
    if status not in ["in_progress", "resolved", "failed"]:
        raise HTTPException(status_code=400, detail="Invalid action status")
        
    detection.handling_status = status
    # Main status should reflect handling status (e.g., "in_progress", "resolved", "failed")
    detection.status = status

    if notes:
        detection.handling_notes = notes
        
    if proofFiles:
        proof_urls = []
        for file in proofFiles:
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join("uploads", unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            proof_urls.append(f"/uploads/{unique_filename}")
        detection.handling_proof_urls = list(proof_urls)
        
    db.commit()
    db.refresh(detection)
    return _enrich_detection(db, detection)
