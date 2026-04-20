from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    is_super = current_user.role.name == "Super Admin"
    org_id = current_user.organization_id
    
    if is_super:
        return {
            "activeCompanies": db.query(models.Organization).filter(models.Organization.status == "active").count(),
            "totalCompanies": db.query(models.Organization).count(),
            "totalUsers": db.query(models.User).count(),
            "totalDevices": db.query(models.Camera).count(),
            "onlineDevices": db.query(models.Camera).filter(models.Camera.status == "online").count(),
            "totalDetections": db.query(models.Detection).count()
        }
    else:
        descendants = crud.company.get_descendant_org_ids(db, org_id)
        
        # Count cameras via CameraAccess join
        total_devices = db.query(models.Camera).join(models.CameraAccess).filter(models.CameraAccess.organization_id.in_(descendants)).count()
        online_devices = db.query(models.Camera).join(models.CameraAccess).filter(
            models.CameraAccess.organization_id.in_(descendants), 
            models.Camera.status == "online"
        ).count()

        return {
            "activeCompanies": db.query(models.Organization).filter(models.Organization.id.in_(descendants), models.Organization.status == "active").count(),
            "totalCompanies": len(descendants),
            "totalUsers": db.query(models.User).filter(models.User.organization_id.in_(descendants)).count(),
            "totalDevices": total_devices,
            "onlineDevices": online_devices,
            "totalDetections": db.query(models.Detection).filter(models.Detection.organization_id.in_(descendants)).count()
        }

def get_detection_trends(
    db: Session,
    org_id: Optional[str] = None,
    time_series: str = "monthly",
) -> Any:
    """
    Get real detection trends (weekly, monthly, yearly) from the database.
    """
    import datetime

    today = datetime.date.today()
    results = []

    if time_series == "weekly":
        # Get last 12 weeks
        periods = []
        start_of_week = today - datetime.timedelta(days=today.weekday())
        for i in range(12):
            w_start = start_of_week - datetime.timedelta(weeks=i)
            w_end = w_start + datetime.timedelta(days=6)
            periods.append((w_start, w_end))
        periods.reverse()
        
        for p_start, p_end in periods:
            det_query = db.query(models.Detection)
            if org_id:
                desc_ids = crud.company.get_descendant_org_ids(db, org_id)
                det_query = det_query.filter(models.Detection.organization_id.in_(desc_ids))
            
            d_count = det_query.filter(
                models.Detection.created_at >= datetime.datetime.combine(p_start, datetime.time.min),
                models.Detection.created_at <= datetime.datetime.combine(p_end, datetime.time.max)
            ).count()
            
            results.append({
                "period": f"W{p_start.isocalendar()[1]}",
                "detections": d_count,
            })
            
    elif time_series == "yearly":
        periods = [today.year - i for i in range(5)]
        periods.reverse()
        for y in periods:
            det_query = db.query(models.Detection)
            if org_id:
                desc_ids = crud.company.get_descendant_org_ids(db, org_id)
                det_query = det_query.filter(models.Detection.organization_id.in_(desc_ids))
            
            d_count = det_query.filter(func.extract('year', models.Detection.created_at) == y).count()
            results.append({
                "period": str(y),
                "detections": d_count,
            })
            
    else: # monthly
        months = []
        for i in range(6):
            m = today.month - i
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            months.append((y, m, datetime.date(y, m, 1).strftime("%b")))
        months.reverse()
        
        for y, m_num, month_name in months:
            det_query = db.query(models.Detection)
            if org_id:
                desc_ids = crud.company.get_descendant_org_ids(db, org_id)
                det_query = det_query.filter(models.Detection.organization_id.in_(desc_ids))
            
            d_count = det_query.filter(
                func.extract('year', models.Detection.created_at) == y,
                func.extract('month', models.Detection.created_at) == m_num
            ).count()
            results.append({
                "period": month_name,
                "detections": d_count,
            })

    return results

@router.get("/dashboard/trends", response_model=List[schemas.DetectionTrend])
def get_dashboard_trends(
    time_series: str = "monthly",
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    return get_detection_trends(db, current_user.organization_id if current_user.role.name != "Super Admin" else None, time_series)

@router.get("/dashboard/logs", response_model=List[schemas.ActivityLog])
def get_activity_logs(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    """
    Get recent activity logs.
    """
    is_super = current_user.role.name == "Super Admin"
    org_id = current_user.organization_id
    
    logs = []
    
    # Fetch recent detections
    det_query = db.query(models.Detection)
    if not is_super:
        desc_ids = crud.company.get_descendant_org_ids(db, org_id)
        det_query = det_query.filter(models.Detection.organization_id.in_(desc_ids))
    
    detections = det_query.order_by(models.Detection.created_at.desc()).limit(5).all()
    for d in detections:
        logs.append({
            "id": f"log-det-{d.id}",
            "userId": d.user_id or "system",
            "userName": d.user.full_name if d.user else "System",
            "companyName": d.organization.name if d.organization else "Unknown",
            "action": f"detected {d.category}",
            "target": d.name,
            "timestamp": d.created_at,
            "type": "detection"
        })
        
    # Sort by timestamp
    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    return logs[:10]


@router.get("/analytics/summary", response_model=schemas.AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    """
    Get full analytics summary.
    """
    all_companies = [
        {"name": "Metro Police Dept", "detections": 1540, "cameras": 120},
        {"name": "City Watch Corp", "detections": 620, "cameras": 65},
        {"name": "Sentinel Services", "detections": 1100, "cameras": 90},
        {"name": "SafeStreet Inc", "detections": 310, "cameras": 30},
        {"name": "Guardian Security", "detections": 150, "cameras": 18},
    ]
    
    if current_user.role.name == "Super Admin":
        company_activity = all_companies
    else:
        # Filter to only show the user's specific company stats if available in the mock data
        # or show a generic entry for their organization
        org_name = current_user.organization.name if current_user.organization else "Your Organization"
        company_activity = [next((c for c in all_companies if c["name"] == org_name), 
                                 {"name": org_name, "detections": 0, "cameras": 0})]

    return {
        "monthlyDetections": [
            {"month": "Jul", "detections": 120},
            {"month": "Aug", "detections": 145},
            {"month": "Sep", "detections": 165},
            {"month": "Oct", "detections": 190},
            {"month": "Nov", "detections": 210},
            {"month": "Dec", "detections": 180},
            {"month": "Jan", "detections": 230},
        ],
        "companyActivity": company_activity
    }

# ── Helper to validate feature cascading ──
def validate_feature_cascade(db: Session, parent_id: Optional[str], features: Optional[dict]):
    if not parent_id or not features:
        return
        
    parent_org = db.query(models.Organization).filter(models.Organization.id == parent_id).first()
    if not parent_org:
        raise HTTPException(status_code=400, detail="Parent organization not found")
        
    parent_features = parent_org.features or {}
    
    # Define permission ranks to check if child exceeds parent
    rank = {"none": 0, "view": 1, "full": 2}
    
    for feature_key in ["detections", "fingerprint"]:
        p_val = parent_features.get(feature_key, "full")
        c_val = features.get(feature_key, "full")
        
        if rank.get(c_val, 2) > rank.get(p_val, 2):
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot grant '{c_val}' access for {feature_key} because parent only has '{p_val}' access."
            )

# ── Companies ───────────────────────────────────

@router.get("/companies", response_model=List[schemas.Company])
def get_companies(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role.name == "Super Admin":
        return crud.company.get_all(db)
    elif current_user.role.name == "Company Admin":
        descendant_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
        orgs = db.query(models.Organization).filter(models.Organization.id.in_(descendant_ids)).all()
        return orgs
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")

@router.post("/companies", response_model=schemas.Company)
def create_company(
    *,
    db: Session = Depends(deps.get_db),
    obj_in: schemas.CompanyCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    # Security check setup
    if current_user.role.name not in ["Super Admin", "Company Admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if current_user.role.name == "Company Admin":
        if not obj_in.parentId:
            # Implicitly default to current org if none provided
            obj_in.parentId = current_user.organization_id
        else:
            # Check if requested parentId is within the admin's descendants
            desc_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
            if obj_in.parentId not in desc_ids:
                raise HTTPException(status_code=403, detail="Cannot create company outside of your hierarchy")
                
    # Validate feature inheritance
    validate_feature_cascade(db, obj_in.parentId, obj_in.features)

    return crud.company.create(db, obj_in=obj_in)

@router.patch("/companies/{id}", response_model=schemas.Msg)
def update_company(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    obj_in: schemas.CompanyUpdate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role.name not in ["Super Admin", "Company Admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    company = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if current_user.role.name == "Company Admin":
        # Can only edit self or descendants
        desc_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
        if id not in desc_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions to edit this company")
            
        # Optional: prevent re-parenting outside hierarchy
        if obj_in.parentId and obj_in.parentId not in desc_ids:
            raise HTTPException(status_code=403, detail="Cannot assign parent outside of your hierarchy")
            
    # Validate feature inheritance using the effective parent (might be changing)
    effective_parent = obj_in.parentId if obj_in.parentId is None else company.parent_id
    if "parentId" in obj_in.dict(exclude_unset=True):
        effective_parent = obj_in.parentId
        
    effective_features = obj_in.features if obj_in.features is not None else company.features
    
    validate_feature_cascade(db, effective_parent, effective_features)

    crud.company.update(db, db_obj=company, obj_in=obj_in)
    
    # Enforce cascade downward: if we restrict a feature, we must ensure children are restricted
    # Enforce cascade downward
    if obj_in.features:
        if obj_in.cascade_features:
            # Forcefully sync all children to match the parent
            sync_children_features(db, id, obj_in.features)
        else:
            # Standard restriction enforcement
            check_and_update_children_features(db, id, obj_in.features)
        
    return {"msg": "Company updated"}

def sync_children_features(db: Session, parent_id: str, parent_features: dict):
    """
    Forcefully set all descendant organizations to have the exact same features as the parent.
    """
    children = db.query(models.Organization).filter(models.Organization.parent_id == parent_id).all()
    for child in children:
        crud.company.update(db, db_obj=child, obj_in=schemas.CompanyUpdate(features=parent_features))
        sync_children_features(db, child.id, parent_features)
    
def check_and_update_children_features(db: Session, parent_id: str, parent_features: dict):
    rank = {"none": 0, "view": 1, "full": 2}
    children = db.query(models.Organization).filter(models.Organization.parent_id == parent_id).all()
    for child in children:
        child_features = child.features or {}
        needs_update = False
        
        for feature_key in ["detections", "fingerprint"]:
            p_val = parent_features.get(feature_key, "full")
            c_val = child_features.get(feature_key, "full")
            
            if rank.get(c_val, 2) > rank.get(p_val, 2):
                child_features[feature_key] = p_val
                needs_update = True
                
        if needs_update:
            # We don't recursively call validation because we explicitly force the cascade here
            crud.company.update(db, db_obj=child, obj_in=schemas.CompanyUpdate(features=child_features))
            # Recurse downward
            check_and_update_children_features(db, child.id, child_features)

@router.delete("/companies/{id}", response_model=schemas.Msg)
def delete_company(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role.name not in ["Super Admin", "Company Admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if current_user.role.name == "Company Admin":
        desc_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
        if id not in desc_ids:
             raise HTTPException(status_code=403, detail="Not enough permissions to delete this company")
        if id == current_user.organization_id:
             raise HTTPException(status_code=400, detail="Cannot delete your own organization")
             
    # Optionally: prevent deletion if it has children, or rely on DB cascading/foreign keys
    children = db.query(models.Organization).filter(models.Organization.parent_id == id).first()
    if children:
        raise HTTPException(status_code=400, detail="Cannot delete company with child companies. Reassign or delete children first.")

    crud.company.remove(db, id=id)
    return {"msg": "Company deleted"}

# ── Users ───────────────────────────────────────

@router.get("/users", response_model=List[schemas.AdminUser])
def get_admin_users(
    company_id: Optional[str] = None,
    include_children: bool = True,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("users.view")),
) -> Any:
    # If Super Admin, get all or filtered by company.
    # If Company Admin, get only from their org AND descendants.
    is_super = current_user.role.name == "Super Admin"
    
    # Resolve the root org_id to filter by
    target_org_id = None
    if is_super:
        if company_id and company_id != "all":
            target_org_id = company_id
    else:
        # Company Admin or lower: restricted to their own hierarchy
        if company_id and company_id != "all":
            desc_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
            if company_id in desc_ids:
                target_org_id = company_id
            else:
                raise HTTPException(status_code=403, detail="Cannot access users outside of your hierarchy")
        else:
            target_org_id = current_user.organization_id

    # Apply filtering
    query = db.query(models.User)
    if target_org_id:
        if include_children:
            desc_ids = crud.company.get_descendant_org_ids(db, target_org_id)
            query = query.filter(models.User.organization_id.in_(desc_ids))
        else:
            query = query.filter(models.User.organization_id == target_org_id)

    users = query.all()
    return [
        {
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "companyId": u.organization_id,
            "companyName": u.organization.name if u.organization else "",
            "role": u.role.name if u.role else "User",
            "status": u.status,
            "lastLogin": "",
            "createdAt": u.created_at.isoformat() if u.created_at else ""
        } for u in users
    ]

@router.post("/users", response_model=schemas.AdminUser)
def create_admin_user(
    *,
    db: Session = Depends(deps.get_db),
    obj_in: schemas.AdminUserCreate,
    current_user: models.User = Depends(deps.PermissionChecker("users.manage")),
) -> Any:
    # Security: Ensure non-super admin can only create users in their own org
    org_id = obj_in.companyId
    if current_user.role.name != "Super Admin":
        org_id = current_user.organization_id
    
    # Find role by name within the target organization or system roles
    role = db.query(models.Role).filter(
        models.Role.name == obj_in.role,
        (models.Role.organization_id == org_id) | (models.Role.is_system == True)
    ).first()
    
    if not role:
        raise HTTPException(status_code=400, detail=f"Role '{obj_in.role}' not found for this organization")

    user_in = schemas.UserCreate(
        email=obj_in.email,
        password="Password123", # Set a default password
        full_name=obj_in.name,
        organization_id=org_id,
        role_id=role.id,
        status=obj_in.status
    )
    user = crud.user.create(db, obj_in=user_in)
    return {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "companyId": user.organization_id,
        "companyName": user.organization.name if user.organization else "",
        "role": obj_in.role,
        "status": user.status,
        "lastLogin": "",
        "createdAt": user.created_at.isoformat()
    }

@router.patch("/users/{id}", response_model=schemas.AdminUser)
def update_admin_user(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    obj_in: schemas.AdminUserUpdate,
    current_user: models.User = Depends(deps.PermissionChecker("users.manage")),
) -> Any:
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ownership Check
    if current_user.role.name != "Super Admin":
        desc_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
        if user.organization_id not in desc_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions to edit this user")
    
    update_data = obj_in.dict(exclude_unset=True)
    if "role" in update_data:
        # Scope role search to the organization + system roles
        role = db.query(models.Role).filter(
            models.Role.name == update_data["role"],
            (models.Role.organization_id == user.organization_id) | (models.Role.is_system == True)
        ).first()
        if role:
            user.role_id = role.id
        else:
            raise HTTPException(status_code=400, detail=f"Role '{update_data['role']}' not valid for this organization")
    
    if "companyId" in update_data and current_user.role.name == "Super Admin":
        user.organization_id = update_data["companyId"]

    # Use crud.user.update for the rest
    user = crud.user.update(db, db_obj=user, obj_in=schemas.UserUpdate(**update_data))
    
    return {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "companyId": user.organization_id,
        "companyName": user.organization.name if user.organization else "",
        "role": user.role.name if user.role else "User",
        "status": user.status,
        "lastLogin": "",
        "createdAt": user.created_at.isoformat()
    }

@router.delete("/users/{id}", response_model=schemas.Msg)
def delete_admin_user(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.PermissionChecker("users.manage")),
) -> Any:
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Ownership Check
    if current_user.role.name != "Super Admin":
        desc_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
        if user.organization_id not in desc_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions to delete this user")
        
    crud.user.remove(db, id=id)
    return {"msg": "User deleted"}

# ── Roles ───────────────────────────────────────

@router.get("/roles", response_model=List[schemas.Role])
def get_roles(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("settings.view")),
) -> Any:
    if current_user.role.name == "Super Admin":
        return crud.role.get_all(db, organization_id=None, include_system=True)
    else:
        # Company admins only see their own custom roles (no system roles)
        return crud.role.get_all(db, organization_id=current_user.organization_id, include_system=False)

@router.get("/roles/permissions", response_model=List[str])
def get_all_permissions(
    current_user: models.User = Depends(deps.PermissionChecker("settings.view")),
) -> Any:
    return [
        "cameras.view", "cameras.manage",
        "detections.view", "detections.manage",
        "users.view", "users.manage",
        "reports.view", "reports.manage",
        "settings.view", "settings.manage",
        "notifications.view", "notifications.manage",
    ]

@router.post("/roles", response_model=schemas.Role)
def create_role(
    *,
    db: Session = Depends(deps.get_db),
    obj_in: schemas.RoleCreate,
    current_user: models.User = Depends(deps.PermissionChecker("settings.manage")),
) -> Any:
    return crud.role.create(db, obj_in=obj_in, organization_id=current_user.organization_id)

@router.patch("/roles/{id}", response_model=schemas.Role)
def update_role(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    obj_in: schemas.RoleUpdate,
    current_user: models.User = Depends(deps.PermissionChecker("settings.manage")),
) -> Any:
    role = db.query(models.Role).filter(models.Role.id == id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check ownership
    if current_user.role.name != "Super Admin":
        if role.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        if role.is_system:
             raise HTTPException(status_code=403, detail="Cannot edit system roles")

    return crud.role.update(db, db_obj=role, obj_in=obj_in)

@router.delete("/roles/{id}", response_model=schemas.Msg)
def delete_role(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.PermissionChecker("settings.manage")),
) -> Any:
    role = db.query(models.Role).filter(models.Role.id == id).first()
    if role:
        if current_user.role.name != "Super Admin" and (role.organization_id != current_user.organization_id or role.is_system):
             raise HTTPException(status_code=403, detail="Not enough permissions")
        crud.role.remove(db, id=id)
    return {"msg": "Role deleted"}
# ── Form Templates ──────────────────────────────
@router.get("/forms/active", response_model=Optional[schemas.FormTemplate])
def get_active_form_template(
    detection_type: str = "person",
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    org_id = current_user.organization_id
    if not org_id:
        return None
        
    t = db.query(models.FormTemplate).filter(
        models.FormTemplate.is_active == True,
        models.FormTemplate.organization_id == org_id,
        models.FormTemplate.detection_type == detection_type
    ).first()
    if not t:
        return None
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "fields": t.fields,
        "isActive": t.is_active,
        "detectionType": t.detection_type,
        "createdAt": t.created_at.isoformat(),
        "updatedAt": t.updated_at.isoformat()
    }

@router.get("/forms", response_model=List[schemas.FormTemplate])
def get_form_templates(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("settings.view")),
) -> Any:
    if current_user.role.name == "Super Admin":
        templates = crud.form_template.get_all(db, organization_id=None)
    else:
        if not current_user.organization_id:
            return []
        templates = crud.form_template.get_all(db, organization_id=current_user.organization_id)
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "fields": t.fields,
            "isActive": t.is_active,
            "detectionType": t.detection_type,
            "createdAt": t.created_at.isoformat(),
            "updatedAt": t.updated_at.isoformat()
        }
        for t in templates
    ]

@router.post("/forms", response_model=schemas.FormTemplate)
def create_form_template(
    *,
    db: Session = Depends(deps.get_db),
    obj_in: schemas.FormTemplateCreate,
    current_user: models.User = Depends(deps.PermissionChecker("settings.manage")),
) -> Any:
    org_id = current_user.organization_id
    if not org_id and current_user.role.name != "Super Admin":
        raise HTTPException(status_code=400, detail="User must belong to an organization to create forms")
        
    # If new template is active, deactivate others of the same detection type for this organization
    if obj_in.isActive:
        db.query(models.FormTemplate).filter(
            models.FormTemplate.organization_id == org_id,
            models.FormTemplate.detection_type == (obj_in.detectionType or "person")
        ).update({"is_active": False})
        
    t = crud.form_template.create(db, obj_in=obj_in, organization_id=org_id)
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "fields": t.fields,
        "isActive": t.is_active,
        "detectionType": t.detection_type,
        "createdAt": t.created_at.isoformat(),
        "updatedAt": t.updated_at.isoformat()
    }

@router.patch("/forms/{id}", response_model=schemas.FormTemplate)
def update_form_template(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    obj_in: schemas.FormTemplateUpdate,
    current_user: models.User = Depends(deps.PermissionChecker("settings.manage")),
) -> Any:
    template = db.query(models.FormTemplate).filter(models.FormTemplate.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")
    
    # Ownership check
    if current_user.role.name != "Super Admin" and template.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not enough permissions to edit this template")
    
    # If activating this template, deactivate all others of the same detection type for this organization
    update_data = obj_in.dict(exclude_unset=True)
    if update_data.get("isActive"):
        effective_type = update_data.get("detectionType", template.detection_type)
        db.query(models.FormTemplate).filter(
            models.FormTemplate.organization_id == template.organization_id,
            models.FormTemplate.detection_type == effective_type,
            models.FormTemplate.id != id
        ).update({"is_active": False})

    t = crud.form_template.update(db, db_obj=template, obj_in=obj_in)
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "fields": t.fields,
        "isActive": t.is_active,
        "detectionType": t.detection_type,
        "createdAt": t.created_at.isoformat(),
        "updatedAt": t.updated_at.isoformat()
    }

@router.delete("/forms/{id}", response_model=schemas.Msg)
def delete_form_template(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.PermissionChecker("settings.manage")),
) -> Any:
    template = db.query(models.FormTemplate).filter(models.FormTemplate.id == id).first()
    if template:
        if current_user.role.name != "Super Admin" and template.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        crud.form_template.remove(db, id=id)
    return {"msg": "Form template deleted"}

# ── Devices ─────────────────────────────────────

@router.get("/devices")
def get_devices(
    company_id: Optional[str] = None,
    include_children: bool = True,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("cameras.view")),
) -> Any:
    is_super = current_user.role.name == "Super Admin"
    
    # Resolve the root org_id to filter by
    target_org_id = None
    if is_super:
        if company_id and company_id != "all":
            target_org_id = company_id
    else:
        if company_id and company_id != "all":
            desc_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
            if company_id in desc_ids:
                target_org_id = company_id
            else:
                raise HTTPException(status_code=403, detail="Cannot access devices outside of your hierarchy")
        else:
            target_org_id = current_user.organization_id

    # Apply filtering
    if is_super and (not target_org_id or target_org_id == "all"):
        query = db.query(models.Camera)
    else:
        # Resolve all org IDs to include in the filter
        if target_org_id:
            if include_children:
                org_ids = crud.company.get_descendant_org_ids(db, target_org_id)
            else:
                org_ids = [target_org_id]
            query = db.query(models.Camera).join(models.CameraAccess).filter(models.CameraAccess.organization_id.in_(org_ids))
        else:
            # For non-super admin without explicit company_id, use their own hierarchy
            org_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
            query = db.query(models.Camera).join(models.CameraAccess).filter(models.CameraAccess.organization_id.in_(org_ids))

    devices = query.all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "type": "camera",
            "companyId": d.organization_id,
            "companyName": d.owner.name if d.owner else "",
            "linkedTrafficCompanyId": d.linked_traffic_company_id,
            "location": d.location,
            "status": d.status,
            "lastActivity": d.updated_at.isoformat(),
            "firmware": "v1.0.0"
        }
        for d in devices
    ]
@router.get("/analytics/detailed", response_model=schemas.DetailedAnalytics)
def get_detailed_analytics(
    company_id: Optional[str] = None,
    include_children: bool = True,
    location: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_series: str = "monthly",
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    """
    Get detailed analytics with filtering.
    Includes resolution rate, accept rate, avg handling time, and handling status breakdown.
    """
    import datetime

    org_ids = _resolve_org_ids(db, current_user, company_id, include_children)

    # Base detection query
    det_query = db.query(models.Detection)
    if org_ids:
        det_query = det_query.filter(models.Detection.organization_id.in_(org_ids))
    if location:
        det_query = det_query.filter(models.Detection.location == location)
    if category and category != "all":
        det_query = det_query.filter(models.Detection.category == category)
    if status and status != "all":
        det_query = det_query.filter(models.Detection.handling_status == status)
    if start_date:
        try:
            sd = datetime.datetime.fromisoformat(start_date)
            det_query = det_query.filter(models.Detection.created_at >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.datetime.fromisoformat(end_date)
            det_query = det_query.filter(models.Detection.created_at <= ed)
        except ValueError:
            pass
    
    total_detections = det_query.count()

    # Resolution rate: resolved / total assigned (not unassigned)
    assigned_query = det_query.filter(models.Detection.handling_status != "unassigned")
    assigned_count = assigned_query.count()
    resolved_count = det_query.filter(models.Detection.handling_status == "resolved").count()
    resolution_rate = round((resolved_count / assigned_count * 100) if assigned_count > 0 else 0, 1)

    # Accept rate: (in_progress + resolved + failed) / total
    accepted_statuses = ["in_progress", "resolved", "failed"]
    accepted_count = det_query.filter(models.Detection.handling_status.in_(accepted_statuses)).count()
    accept_rate = round((accepted_count / total_detections * 100) if total_detections > 0 else 0, 1)

    # Avg handling time: for resolved detections, diff between updated_at and created_at
    resolved_dets = det_query.filter(models.Detection.handling_status == "resolved").all()
    if resolved_dets:
        total_hours = sum(
            (d.updated_at - d.created_at).total_seconds() / 3600
            for d in resolved_dets if d.updated_at and d.created_at
        )
        avg_handling_time = round(total_hours / len(resolved_dets), 1)
    else:
        avg_handling_time = None

    # Records by Category
    cat_base = db.query(
        models.Detection.category, 
        func.count(models.Detection.id).label("count")
    ).group_by(models.Detection.category)
    if org_ids:
        cat_base = cat_base.filter(models.Detection.organization_id.in_(org_ids))
    
    records_by_category = [
        {"category": c.category, "count": c.count, "trend": 0.0}
        for c in cat_base.all()
    ]

    # Records by Location
    loc_base = db.query(
        models.Detection.location, 
        func.count(models.Detection.id).label("count")
    ).group_by(models.Detection.location)
    if org_ids:
        loc_base = loc_base.filter(models.Detection.organization_id.in_(org_ids))
    
    records_by_location = [
        {"location": l.location or "Unknown", "count": l.count}
        for l in loc_base.all()
    ]

    # Handling Status Breakdown
    hs_base = db.query(
        models.Detection.handling_status,
        func.count(models.Detection.id).label("count")
    ).group_by(models.Detection.handling_status)
    if org_ids:
        hs_base = hs_base.filter(models.Detection.organization_id.in_(org_ids))
    
    handling_status_breakdown = [
        {"status": h.handling_status or "unassigned", "count": h.count}
        for h in hs_base.all()
    ]

    target_org_id = company_id if (company_id and company_id != "all") else None
    if not current_user.role.name == "Super Admin" and not target_org_id:
        target_org_id = current_user.organization_id

    return {
        "totalDetections": total_detections,
        "resolutionRate": resolution_rate,
        "acceptRate": accept_rate,
        "avgHandlingTimeHours": avg_handling_time,
        "recordsByCategory": records_by_category,
        "recordsByLocation": records_by_location,
        "handlingStatusBreakdown": handling_status_breakdown,
        "monthlyTrends": get_detection_trends(db, target_org_id, time_series),
    }

@router.get("/analytics/raw", response_model=List[schemas.RawSubmission])
def get_raw_submissions(
    company_id: Optional[str] = None,
    include_children: bool = True,
    category: Optional[str] = None,
    status: Optional[str] = None,
    crime_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    """
    Get raw detection submissions with enhanced filtering.
    """
    import datetime

    org_ids = _resolve_org_ids(db, current_user, company_id, include_children)

    results = []

    det_query = db.query(models.Detection)
    if org_ids:
        det_query = det_query.filter(models.Detection.organization_id.in_(org_ids))
    if category and category != "all":
        det_query = det_query.filter(models.Detection.category == category)
    if status and status != "all":
        det_query = det_query.filter(models.Detection.handling_status == status)
    if crime_type and crime_type != "all":
        det_query = det_query.filter(models.Detection.crime_type == crime_type)
    if start_date:
        try:
            sd = datetime.datetime.fromisoformat(start_date)
            det_query = det_query.filter(models.Detection.created_at >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.datetime.fromisoformat(end_date)
            det_query = det_query.filter(models.Detection.created_at <= ed)
        except ValueError:
            pass
    
    detections = det_query.order_by(models.Detection.created_at.desc()).limit(100).all()
    for d in detections:
        assigned_name = None
        if d.assigned_company_id:
            assigned_org = db.query(models.Organization).filter(models.Organization.id == d.assigned_company_id).first()
            assigned_name = assigned_org.name if assigned_org else None

        # Resolve dynamic data labels from form template
        resolved_dynamic = []
        if d.dynamic_data and d.form_template_id:
            template = db.query(models.FormTemplate).filter(
                models.FormTemplate.id == d.form_template_id
            ).first()
            if template and template.fields:
                field_map = {f.get('id'): f.get('label') for f in template.fields if isinstance(f, dict)}
                for field_id, value in d.dynamic_data.items():
                    label = field_map.get(field_id, field_id)
                    resolved_dynamic.append({"label": label, "value": value})

        results.append({
            "id": d.id,
            "type": "detection",
            "title": d.name or f"Detection {d.id[:8]}",
            "category": d.category,
            "location": d.location or "Unknown",
            "status": d.status,
            "handlingStatus": d.handling_status,
            "crimeType": d.crime_type,
            "timestamp": d.created_at,
            "companyName": d.organization.name if d.organization else "Unknown",
            "assignedCompanyName": assigned_name,
            "details": {"subcategory": d.subcategory, "age": d.age},
            "description": d.description,
            "imageUrls": d.image_urls or [],
            "subcategory": d.subcategory,
            "plateNumber": d.plate_number,
            "code": d.code,
            "region": d.region,
            "age": d.age,
            "eligibleForAssignment": d.eligible_for_assignment,
            "handlingNotes": d.handling_notes,
            "handlingProofUrls": d.handling_proof_urls or [],
            "resolvedDynamicData": resolved_dynamic,
            "detectionEvents": d.detection_events or [],
        })

    results.sort(key=lambda x: x["timestamp"], reverse=True)
    return results[:100]


# ── Crime Type Analytics ─────────────────────────

@router.get("/analytics/crime-types", response_model=schemas.CrimeTypeAnalyticsResponse)
def get_crime_type_analytics(
    company_id: Optional[str] = None,
    include_children: bool = True,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_series: str = "monthly",
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    """
    Crime type analysis: distribution, trends, by-location, by-company, and time-of-day heatmap.
    """
    import datetime

    org_ids = _resolve_org_ids(db, current_user, company_id, include_children)

    base_q = db.query(models.Detection).filter(models.Detection.crime_type.isnot(None), models.Detection.crime_type != "")
    if org_ids:
        base_q = base_q.filter(models.Detection.organization_id.in_(org_ids))
    if start_date:
        try:
            base_q = base_q.filter(models.Detection.created_at >= datetime.datetime.fromisoformat(start_date))
        except ValueError:
            pass
    if end_date:
        try:
            base_q = base_q.filter(models.Detection.created_at <= datetime.datetime.fromisoformat(end_date))
        except ValueError:
            pass

    # 1. Distribution by crime type
    dist = db.query(
        models.Detection.crime_type,
        func.count(models.Detection.id).label("count")
    ).filter(models.Detection.crime_type.isnot(None), models.Detection.crime_type != "")
    if org_ids:
        dist = dist.filter(models.Detection.organization_id.in_(org_ids))
    distribution = [{"crimeType": r.crime_type, "count": r.count} for r in dist.group_by(models.Detection.crime_type).all()]

    # 2. Trends over time
    all_crime_dets = base_q.all()
    month_crime = {}
    for d in all_crime_dets:
        if d.created_at:
            if time_series == "weekly":
                w_start = d.created_at.date() - datetime.timedelta(days=d.created_at.weekday())
                period = f"W{w_start.isocalendar()[1]} {w_start.year}"
                sort_key = (w_start.year, w_start.isocalendar()[1])
            elif time_series == "yearly":
                period = str(d.created_at.year)
                sort_key = (d.created_at.year, 0)
            else:
                period = d.created_at.strftime("%b %Y")
                sort_key = (d.created_at.year, d.created_at.month)
            
            key = (sort_key, period, d.crime_type)
            month_crime[key] = month_crime.get(key, 0) + 1
    
    trends_over_time = [
        {"period": k[1], "crimeType": k[2], "count": v}
        for k, v in sorted(month_crime.items(), key=lambda x: x[0][0])
    ]

    # 3. By location
    loc_crime = db.query(
        models.Detection.location,
        models.Detection.crime_type,
        func.count(models.Detection.id).label("count")
    ).filter(models.Detection.crime_type.isnot(None), models.Detection.crime_type != "")
    if org_ids:
        loc_crime = loc_crime.filter(models.Detection.organization_id.in_(org_ids))
    by_location = [
        {"location": r.location or "Unknown", "crimeType": r.crime_type, "count": r.count}
        for r in loc_crime.group_by(models.Detection.location, models.Detection.crime_type).all()
    ]

    # 4. By company
    comp_crime = db.query(
        models.Organization.name,
        models.Detection.crime_type,
        func.count(models.Detection.id).label("count")
    ).join(models.Organization, models.Detection.organization_id == models.Organization.id
    ).filter(models.Detection.crime_type.isnot(None), models.Detection.crime_type != "")
    if org_ids:
        comp_crime = comp_crime.filter(models.Detection.organization_id.in_(org_ids))
    by_company = [
        {"companyName": r.name, "crimeType": r.crime_type, "count": r.count}
        for r in comp_crime.group_by(models.Organization.name, models.Detection.crime_type).all()
    ]

    # 5. Time of day heatmap (hour vs crime type)
    heatmap_data = {}
    for d in all_crime_dets:
        if d.created_at:
            hour = d.created_at.hour
            key = (hour, d.crime_type)
            heatmap_data[key] = heatmap_data.get(key, 0) + 1
    
    heatmap = [
        {"hour": k[0], "crimeType": k[1], "count": v}
        for k, v in sorted(heatmap_data.items())
    ]

    return {
        "distribution": distribution,
        "trendsOverTime": trends_over_time,
        "byLocation": by_location,
        "byCompany": by_company,
        "heatmap": heatmap,
    }


# ── Company Comparison ───────────────────────────

@router.get("/analytics/company-comparison", response_model=schemas.CompanyComparisonResponse)
def get_company_comparison(
    company_ids: str = "",  # comma-separated company IDs
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_series: str = "monthly",
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    """
    Compare multiple companies on detection-handling metrics.
    Access control: Parent companies can compare children, Super Admin can compare all.
    """
    import datetime

    is_super = current_user.role.name == "Super Admin"
    requested_ids = [cid.strip() for cid in company_ids.split(",") if cid.strip()]

    if not requested_ids:
        # Default: show the user's company + its children
        if is_super:
            all_orgs = db.query(models.Organization).limit(10).all()
            requested_ids = [o.id for o in all_orgs]
        else:
            requested_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)

    # Access control
    if not is_super:
        allowed_ids = set(crud.company.get_descendant_org_ids(db, current_user.organization_id))
        requested_ids = [cid for cid in requested_ids if cid in allowed_ids]

    companies_result = []
    trends_result = []

    for cid in requested_ids:
        org = db.query(models.Organization).filter(models.Organization.id == cid).first()
        if not org:
            continue

        det_query = db.query(models.Detection).filter(
            models.Detection.assigned_company_id == cid
        )
        if start_date:
            try:
                det_query = det_query.filter(models.Detection.created_at >= datetime.datetime.fromisoformat(start_date))
            except ValueError:
                pass
        if end_date:
            try:
                det_query = det_query.filter(models.Detection.created_at <= datetime.datetime.fromisoformat(end_date))
            except ValueError:
                pass

        total = det_query.count()
        resolved = det_query.filter(models.Detection.handling_status == "resolved").count()
        failed = det_query.filter(models.Detection.handling_status == "failed").count()
        
        # Resolution rate
        assigned = det_query.filter(models.Detection.handling_status != "unassigned").count()
        res_rate = round((resolved / assigned * 100) if assigned > 0 else 0, 1)

        # Accept rate
        accepted = det_query.filter(models.Detection.handling_status.in_(["in_progress", "resolved", "failed"])).count()
        acc_rate = round((accepted / total * 100) if total > 0 else 0, 1)

        # Reopen rate: approximated – detections that went back to pending after being resolved
        # For now, use failed / total as a proxy
        reopen_rate = round((failed / total * 100) if total > 0 else 0, 1)

        # Avg response time & resolution time from timestamps
        resolved_dets = det_query.filter(models.Detection.handling_status == "resolved").all()
        avg_res_time = None
        if resolved_dets:
            total_hours = sum(
                (d.updated_at - d.created_at).total_seconds() / 3600
                for d in resolved_dets if d.updated_at and d.created_at
            )
            avg_res_time = round(total_hours / len(resolved_dets), 1)

        companies_result.append({
            "companyId": cid,
            "companyName": org.name,
            "totalDetections": total,
            "resolvedCount": resolved,
            "resolutionRate": res_rate,
            "avgResponseTimeHours": avg_res_time,
            "avgResolutionTimeHours": avg_res_time,
            "reopenRate": reopen_rate,
            "slaComplianceRate": res_rate,  # placeholder: same as res rate until SLA data exists
            "acceptRate": acc_rate,
        })

        # Trend for this company
        all_dets = det_query.all()
        month_counts = {}
        for d in all_dets:
            if d.created_at:
                if time_series == "weekly":
                    w_start = d.created_at.date() - datetime.timedelta(days=d.created_at.weekday())
                    period = f"W{w_start.isocalendar()[1]} {w_start.year}"
                    sort_key = (w_start.year, w_start.isocalendar()[1])
                elif time_series == "yearly":
                    period = str(d.created_at.year)
                    sort_key = (d.created_at.year, 0)
                else:
                    period = d.created_at.strftime("%b %Y")
                    sort_key = (d.created_at.year, d.created_at.month)
                
                key = (sort_key, period)
                month_counts[key] = month_counts.get(key, 0) + 1
        
        for k, count in sorted(month_counts.items(), key=lambda x: x[0][0]):
            trends_result.append({
                "period": k[1],
                "companyId": cid,
                "companyName": org.name,
                "detections": count,
            })

    return {
        "companies": companies_result,
        "trends": trends_result,
    }


# ── Performance Metrics ──────────────────────────

@router.get("/analytics/performance", response_model=schemas.PerformanceResponse)
def get_performance_metrics(
    company_id: Optional[str] = None,
    include_children: bool = True,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("reports.view")),
) -> Any:
    """
    Performance metrics per assigned company: response time, resolution time, SLA compliance.
    """
    org_ids = _resolve_org_ids(db, current_user, company_id, include_children)

    # Get all companies that have been assigned detections
    assigned_companies = db.query(
        models.Detection.assigned_company_id
    ).filter(
        models.Detection.assigned_company_id.isnot(None)
    ).distinct().all()

    company_perf = []
    for (ac_id,) in assigned_companies:
        if org_ids and ac_id not in org_ids:
            continue

        org = db.query(models.Organization).filter(models.Organization.id == ac_id).first()
        if not org:
            continue

        det_query = db.query(models.Detection).filter(
            models.Detection.assigned_company_id == ac_id
        )
        total_handled = det_query.filter(models.Detection.handling_status != "unassigned").count()
        resolved = det_query.filter(models.Detection.handling_status == "resolved").count()
        failed = det_query.filter(models.Detection.handling_status == "failed").count()

        resolved_dets = det_query.filter(models.Detection.handling_status == "resolved").all()
        avg_res_time = None
        if resolved_dets:
            total_hours = sum(
                (d.updated_at - d.created_at).total_seconds() / 3600
                for d in resolved_dets if d.updated_at and d.created_at
            )
            avg_res_time = round(total_hours / len(resolved_dets), 1)

        sla_rate = round((resolved / total_handled * 100) if total_handled > 0 else 0, 1)

        company_perf.append({
            "companyId": ac_id,
            "companyName": org.name,
            "avgResponseTimeHours": avg_res_time,
            "avgResolutionTimeHours": avg_res_time,
            "totalHandled": total_handled,
            "resolvedCount": resolved,
            "failedCount": failed,
            "slaComplianceRate": sla_rate,
        })

    return {"companies": company_perf}


# ── Shared helper ────────────────────────────────

def _resolve_org_ids(db: Session, current_user, company_id: Optional[str], include_children: bool):
    """Resolve which org IDs to filter by based on user role and params."""
    is_super = current_user.role.name == "Super Admin"
    target_org_id = None
    if is_super:
        if company_id and company_id != "all":
            target_org_id = company_id
    else:
        if company_id and company_id != "all":
            desc_ids = crud.company.get_descendant_org_ids(db, current_user.organization_id)
            if company_id in desc_ids:
                target_org_id = company_id
            else:
                raise HTTPException(status_code=403, detail="Cannot access data outside of your hierarchy")
        else:
            target_org_id = current_user.organization_id

    org_ids = None
    if target_org_id:
        if include_children:
            org_ids = crud.company.get_descendant_org_ids(db, target_org_id)
        else:
            org_ids = [target_org_id]
    return org_ids

# --- System Settings ---

@router.get("/settings", response_model=List[schemas.SystemSetting])
def get_system_settings(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("settings.view")),
) -> Any:
    """
    Get all system-wide settings. Super Admin only.
    """
    if current_user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admins can access system settings")
    return db.query(models.SystemSetting).all()

@router.get("/settings/{key}", response_model=schemas.SystemSetting)
def get_system_setting(
    key: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("settings.view")),
) -> Any:
    """
    Get a specific system-wide setting.
    """
    if current_user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admins can access system settings")
    setting = crud.system_setting.get(db, key=key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.put("/settings/{key}", response_model=schemas.SystemSetting)
def update_system_setting(
    *,
    key: str,
    obj_in: schemas.SystemSettingUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.PermissionChecker("settings.manage")),
) -> Any:
    """
    Update a dynamic system setting. Create if not exists.
    """
    if current_user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admins can change system settings")
    
    setting = crud.system_setting.get(db, key=key)
    if not setting:
        return crud.system_setting.create(db, obj_in=schemas.SystemSettingCreate(key=key, **obj_in.model_dump()))
    
    return crud.system_setting.update(db, db_obj=setting, obj_in=obj_in)

