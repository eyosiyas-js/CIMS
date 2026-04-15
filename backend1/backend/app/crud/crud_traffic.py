import math
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session
from app.models.operational import OfficerLocation, TrafficAlert

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat/2)**2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2)
    return R * 2 * math.asin(math.sqrt(a))

class CRUDOfficerLocation:
    def upsert_location(
        self, db: Session, user_id: str, org_id: str, lat: float, lng: float, 
        heading: Optional[float] = None, speed: Optional[float] = None
    ) -> OfficerLocation:
        db_obj = db.query(OfficerLocation).filter(OfficerLocation.user_id == user_id).first()
        if db_obj:
            db_obj.lat = lat
            db_obj.lng = lng
            db_obj.heading = heading
            db_obj.speed = speed
            db_obj.is_online = True
            db_obj.last_seen = datetime.utcnow()
        else:
            db_obj = OfficerLocation(
                id=f"loc-{uuid.uuid4()}",
                user_id=user_id,
                organization_id=org_id,
                lat=lat,
                lng=lng,
                heading=heading,
                speed=speed,
                is_online=True,
                last_seen=datetime.utcnow()
            )
            db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_online_officers(self, db: Session, org_id: str) -> List[OfficerLocation]:
        # Consider an officer online if `is_online` is True and `last_seen` is within last 5 minutes
        five_mins_ago = datetime.utcnow() - timedelta(minutes=5)
        return db.query(OfficerLocation).filter(
            OfficerLocation.organization_id == org_id,
            OfficerLocation.is_online == True,
            OfficerLocation.last_seen >= five_mins_ago
        ).all()

    def find_nearby_officers(self, db: Session, org_id: str, lat: float, lng: float, radius_km: float = 2.0):
        """Find nearby online officers within a SINGLE organization."""
        online_officers = self.get_online_officers(db, org_id)
        nearby = []
        for officer in online_officers:
            dist = haversine_km(lat, lng, officer.lat, officer.lng)
            if dist <= radius_km:
                nearby.append((officer, dist))
        nearby.sort(key=lambda x: x[1])
        return nearby

    def find_nearby_officers_multi(self, db: Session, primary_org_id: str, lat: float, lng: float, radius_km: float = 2.0, include_external: bool = False):
        """
        Find nearby online officers. 
        - If include_external is False: only officers from primary_org_id
        - If include_external is True: officers from ALL traffic_police companies
        """
        from app.models.organization_role import Organization

        five_mins_ago = datetime.utcnow() - timedelta(minutes=5)
        
        if include_external:
            # Get all traffic_police organization IDs
            traffic_orgs = db.query(Organization.id).filter(
                Organization.company_type == "traffic_police",
                Organization.status == "active"
            ).all()
            traffic_org_ids = [o.id for o in traffic_orgs]
            
            online_officers = db.query(OfficerLocation).filter(
                OfficerLocation.organization_id.in_(traffic_org_ids),
                OfficerLocation.is_online == True,
                OfficerLocation.last_seen >= five_mins_ago
            ).all()
        else:
            online_officers = self.get_online_officers(db, primary_org_id)
        
        nearby = []
        for officer in online_officers:
            dist = haversine_km(lat, lng, officer.lat, officer.lng)
            if dist <= radius_km:
                nearby.append((officer, dist))
        nearby.sort(key=lambda x: x[1])
        return nearby

    def set_offline(self, db: Session, user_id: str) -> Optional[OfficerLocation]:
        db_obj = db.query(OfficerLocation).filter(OfficerLocation.user_id == user_id).first()
        if db_obj:
            db_obj.is_online = False
            db.commit()
            db.refresh(db_obj)
        return db_obj

class CRUDTrafficAlert:
    def create_alert(
        self, db: Session, detection_id: str, officer_id: str, camera_id: str, 
        org_id: str, distance_km: float
    ) -> TrafficAlert:
        db_obj = TrafficAlert(
            id=f"alert-{uuid.uuid4()}",
            detection_id=detection_id,
            officer_id=officer_id,
            camera_id=camera_id,
            organization_id=org_id,
            distance_km=distance_km,
            status="dispatched"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_officer_alerts(self, db: Session, officer_id: str, status: Optional[str] = None) -> List[TrafficAlert]:
        query = db.query(TrafficAlert).filter(TrafficAlert.officer_id == officer_id)
        if status:
            query = query.filter(TrafficAlert.status == status)
        return query.order_by(TrafficAlert.created_at.desc()).all()
        
    def get_alert(self, db: Session, alert_id: str) -> Optional[TrafficAlert]:
        return db.query(TrafficAlert).filter(TrafficAlert.id == alert_id).first()

    def update_alert_status(
        self, db: Session, alert_id: str, status: str, notes: Optional[str] = None, proof_urls: Optional[List[str]] = None
    ) -> Optional[TrafficAlert]:
        db_obj = self.get_alert(db, alert_id)
        if not db_obj:
            return None
        
        db_obj.status = status
        
        if status == "accepted":
            db_obj.accepted_at = datetime.utcnow()
        elif status in ["resolved", "failed"]:
            db_obj.resolved_at = datetime.utcnow()
            
        if notes is not None:
            db_obj.notes = notes
            
        if proof_urls is not None:
            if db_obj.proof_urls:
                db_obj.proof_urls = list(set(db_obj.proof_urls + proof_urls))
            else:
                db_obj.proof_urls = proof_urls
                
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def expire_stale_alerts(self, db: Session, timeout_minutes: int = 10) -> int:
        timeout_threshold = datetime.utcnow() - timedelta(minutes=timeout_minutes)
        stale_alerts = db.query(TrafficAlert).filter(
            TrafficAlert.status == "dispatched",
            TrafficAlert.created_at <= timeout_threshold
        ).all()
        
        count = len(stale_alerts)
        for alert in stale_alerts:
            alert.status = "expired"
        
        if count > 0:
            db.commit()
            
        return count

officer_location = CRUDOfficerLocation()
traffic_alert = CRUDTrafficAlert()
