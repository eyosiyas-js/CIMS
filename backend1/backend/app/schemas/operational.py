from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# ── Camera Schemas ──────────────────────────────
class CameraBase(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: Optional[str] = "online"
    isFlagged: Optional[bool] = False
    streamUrl: Optional[str] = None
    cameraStreamId: Optional[str] = None
    organizationId: Optional[str] = None
    linkedTrafficCompanyId: Optional[str] = None

class CameraUpdate(CameraBase):
    pass

class CameraCreate(CameraBase):
    name: str # Name is required for creation

class Camera(CameraBase):
    id: str
    organization_id: Optional[str] = None
    lastDetection: Optional[str] = None
    lastDetectionAt: Optional[datetime] = None
    linkedTrafficCompanyName: Optional[str] = None

    class Config:
        from_attributes = True

class CameraAccessBase(BaseModel):
    cameraId: str
    organizationId: str

class CameraAccess(CameraAccessBase):
    id: str
    createdAt: datetime

    class Config:
        from_attributes = True

class CameraAccessToggle(BaseModel):
    organizationId: str
    hasAccess: bool

# ── Detection Schemas ───────────────────────────
class DetectionBase(BaseModel):
    category: str # person, vehicle
    name: str
    description: Optional[str] = None
    age: Optional[str] = None
    location: Optional[str] = None
    subcategory: Optional[str] = None
    crimeType: Optional[str] = None
    imageUrls: Optional[List[str]] = []
    status: Optional[str] = "pending"
    formTemplateId: Optional[str] = None
    dynamicData: Optional[dict] = None
    assignedCompanyId: Optional[str] = None
    handlingStatus: Optional[str] = "unassigned"
    handlingNotes: Optional[str] = None
    handlingProofUrls: Optional[List[str]] = None
    eligibleForAssignment: Optional[bool] = True
    allowExternalAssignment: Optional[bool] = False
    # Vehicle-specific fields
    plateNumber: Optional[str] = None
    code: Optional[str] = None
    region: Optional[str] = None

class DetectionCreate(DetectionBase):
    pass

class DetectionUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    age: Optional[str] = None
    location: Optional[str] = None
    subcategory: Optional[str] = None
    crimeType: Optional[str] = None
    imageUrls: Optional[List[str]] = None
    status: Optional[str] = None
    formTemplateId: Optional[str] = None
    dynamicData: Optional[dict] = None
    assignedCompanyId: Optional[str] = None
    handlingStatus: Optional[str] = None
    handlingNotes: Optional[str] = None
    handlingProofUrls: Optional[List[str]] = None
    eligibleForAssignment: Optional[bool] = None
    # Vehicle-specific fields
    plateNumber: Optional[str] = None
    code: Optional[str] = None
    region: Optional[str] = None

class DetectionAction(BaseModel):
    status: str # "in_progress", "resolved", "failed"
    notes: Optional[str] = None
    proofUrls: Optional[List[str]] = None

class Detection(DetectionBase):
    id: str
    createdAt: str
    updatedAt: str
    detectedCameraIds: Optional[List[str]] = []
    detectionEvents: Optional[List[dict]] = []
    resolvedDynamicData: Optional[List[dict]] = []
    assignedCompanyName: Optional[str] = None
    assignedOfficers: Optional[List[dict]] = None
    dispatchMessage: Optional[str] = None
    assignmentType: Optional[str] = None

    class Config:
        from_attributes = True
        alias_generator = lambda string: "".join(
            word.capitalize() if i > 0 else word 
            for i, word in enumerate(string.split("_"))
        )
        populate_by_name = True

class DetectionPublic(Detection):
    faceEmbedding: Optional[List[float]] = None

# ── Weapon Detection Schemas ────────────────────
class WeaponDetectionBase(BaseModel):
    weaponType: str
    description: Optional[str] = None
    confidence: Optional[float] = None
    imageUrl: Optional[str] = None
    cameraId: Optional[str] = None
    cameraName: Optional[str] = None

class WeaponDetectionCreate(WeaponDetectionBase):
    pass

class WeaponDetection(WeaponDetectionBase):
    id: str
    organizationId: Optional[str] = None
    assignedCompanyName: Optional[str] = None
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True
        alias_generator = lambda string: "".join(
            word.capitalize() if i > 0 else word 
            for i, word in enumerate(string.split("_"))
        )
        populate_by_name = True

