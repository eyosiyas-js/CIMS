from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.operational import Camera, Detection, CameraAccess, WeaponDetection
from app.schemas.operational import DetectionCreate, DetectionUpdate, CameraUpdate, CameraCreate, WeaponDetectionCreate
import uuid

class CRUDCamera:
    def get_all(self, db: Session, organization_id: str = None, is_super: bool = False):
        if is_super:
            return db.query(Camera).all()
        if organization_id:
            # Join with CameraAccess to find cameras the organization has access to
            return db.query(Camera).join(CameraAccess).filter(CameraAccess.organization_id == organization_id).all()
        return []

    def create(self, db: Session, *, obj_in: CameraCreate, organization_id: Optional[str] = None):
        db_obj = Camera(
            id=f"cam-{uuid.uuid4()}",
            name=obj_in.name,
            location=obj_in.location,
            lat=obj_in.lat,
            lng=obj_in.lng,
            status=obj_in.status,
            is_flagged=obj_in.isFlagged,
            stream_url=obj_in.streamUrl,
            camera_stream_id=obj_in.cameraStreamId,
            organization_id=organization_id or obj_in.organizationId,
            linked_traffic_company_id=obj_in.linkedTrafficCompanyId
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def toggle_access(self, db: Session, *, camera_id: str, organization_id: str, has_access: bool):
        existing = db.query(CameraAccess).filter(
            CameraAccess.camera_id == camera_id,
            CameraAccess.organization_id == organization_id
        ).first()
        
        if has_access and not existing:
            new_access = CameraAccess(
                id=f"acc-{uuid.uuid4()}",
                camera_id=camera_id,
                organization_id=organization_id
            )
            db.add(new_access)
        elif not has_access and existing:
            db.delete(existing)
            
        db.commit()
        return True

    def get(self, db: Session, id: str):
        return db.query(Camera).filter(Camera.id == id).first()

    def update(self, db: Session, *, db_obj: Camera, obj_in: CameraUpdate):
        update_data = obj_in.dict(exclude_unset=True)
        if "isFlagged" in update_data:
            update_data["is_flagged"] = update_data.pop("isFlagged")
        if "streamUrl" in update_data:
            update_data["stream_url"] = update_data.pop("streamUrl")
        if "organizationId" in update_data:
            update_data["organization_id"] = update_data.pop("organizationId")
        if "linkedTrafficCompanyId" in update_data:
            update_data["linked_traffic_company_id"] = update_data.pop("linkedTrafficCompanyId")
        if "cameraStreamId" in update_data:
            update_data["camera_stream_id"] = update_data.pop("cameraStreamId")
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

class CRUDDetection:
    def get_all(self, db: Session, organization_id: str = None):
        if organization_id:
            return db.query(Detection).filter(Detection.organization_id == organization_id).all()
        return db.query(Detection).all()

    def get(self, db: Session, id: str):
        return db.query(Detection).filter(Detection.id == id).first()

    def create(self, db: Session, *, obj_in: DetectionCreate, organization_id: str, user_id: str):
        db_obj = Detection(
            id=f"det-{id(obj_in)}",
            category=obj_in.category,
            name=obj_in.name,
            description=obj_in.description,
            age=obj_in.age,
            location=obj_in.location,
            subcategory=obj_in.subcategory,
            crime_type=obj_in.crimeType,
            image_urls=obj_in.imageUrls,
            status=obj_in.status,
            organization_id=organization_id,
            user_id=user_id,
            form_template_id=obj_in.formTemplateId,
            dynamic_data=obj_in.dynamicData,
            eligible_for_assignment=obj_in.eligibleForAssignment,
            # Vehicle-specific fields
            plate_number=obj_in.plateNumber,
            code=obj_in.code,
            region=obj_in.region,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Detection, obj_in: DetectionUpdate):
        update_data = obj_in.dict(exclude_unset=True)
        # Map camelCase schema fields to snake_case model fields
        field_map = {
            "imageUrls": "image_urls",
            "crimeType": "crime_type",
            "formTemplateId": "form_template_id",
            "dynamicData": "dynamic_data",
            "eligibleForAssignment": "eligible_for_assignment",
            "plateNumber": "plate_number",
            "code": "code",
            "region": "region",
        }
        for camel, snake in field_map.items():
            if camel in update_data:
                update_data[snake] = update_data.pop(camel)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: str):
        obj = db.query(Detection).get(id)
        db.delete(obj)
        db.commit()
        return obj


class CRUDWeaponDetection:
    def get_all(self, db: Session, organization_id: str = None):
        if organization_id:
            return db.query(WeaponDetection).filter(
                WeaponDetection.organization_id == organization_id
            ).order_by(WeaponDetection.created_at.desc()).all()
        return db.query(WeaponDetection).order_by(WeaponDetection.created_at.desc()).all()

    def get(self, db: Session, id: str):
        return db.query(WeaponDetection).filter(WeaponDetection.id == id).first()

    def create(self, db: Session, *, obj_in: WeaponDetectionCreate, organization_id: str = None):
        db_obj = WeaponDetection(
            id=f"wpn-{uuid.uuid4()}",
            weapon_type=obj_in.weaponType,
            description=obj_in.description,
            confidence=obj_in.confidence,
            image_url=obj_in.imageUrl,
            camera_id=obj_in.cameraId,
            camera_name=obj_in.cameraName,
            organization_id=organization_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


camera = CRUDCamera()
detection = CRUDDetection()
weapon_detection = CRUDWeaponDetection()

