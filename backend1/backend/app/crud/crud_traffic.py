import math
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session
from app.models.operational import OfficerLocation, DetectionAssignment

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
        
        print(f"[DISPATCH] === Officer Search Start ===")
        print(f"[DISPATCH] Camera coords: ({lat}, {lng}), radius: {radius_km}km, include_external: {include_external}")
        print(f"[DISPATCH] Primary org: {primary_org_id}, staleness cutoff: {five_mins_ago}")
        
        if include_external:
            # Get all traffic_police organization IDs
            traffic_orgs = db.query(Organization.id).filter(
                Organization.company_type == "traffic_police",
                Organization.status == "active"
            ).all()
            traffic_org_ids = [o.id for o in traffic_orgs]
            print(f"[DISPATCH] External mode: searching {len(traffic_org_ids)} traffic orgs: {traffic_org_ids}")
            
            # First check ALL officers in these orgs (regardless of online/staleness)
            all_officers_in_orgs = db.query(OfficerLocation).filter(
                OfficerLocation.organization_id.in_(traffic_org_ids)
            ).all()
            print(f"[DISPATCH] Total OfficerLocation rows in target orgs: {len(all_officers_in_orgs)}")
            for o in all_officers_in_orgs:
                print(f"[DISPATCH]   - user={o.user_id}, online={o.is_online}, last_seen={o.last_seen}, lat={o.lat}, lng={o.lng}")
            
            online_officers = db.query(OfficerLocation).filter(
                OfficerLocation.organization_id.in_(traffic_org_ids),
                OfficerLocation.is_online == True,
                OfficerLocation.last_seen >= five_mins_ago
            ).all()
        else:
            # First check ALL officers in this org (regardless of online/staleness)
            all_officers_in_org = db.query(OfficerLocation).filter(
                OfficerLocation.organization_id == primary_org_id
            ).all()
            print(f"[DISPATCH] Total OfficerLocation rows in org {primary_org_id}: {len(all_officers_in_org)}")
            for o in all_officers_in_org:
                age_str = ""
                if o.last_seen:
                    age_seconds = (datetime.utcnow() - o.last_seen).total_seconds()
                    age_str = f", age={age_seconds:.0f}s"
                    if age_seconds > 300:
                        print(f"[DISPATCH]   - user={o.user_id}, online={o.is_online}, last_seen={o.last_seen}{age_str} [STALE > 5min]")
                    else:
                        print(f"[DISPATCH]   - user={o.user_id}, online={o.is_online}, last_seen={o.last_seen}{age_str} [FRESH]")
                else:
                    print(f"[DISPATCH]   - user={o.user_id}, online={o.is_online}, last_seen=None [NO TIMESTAMP]")
                if not o.is_online:
                    print(f"[DISPATCH]     ^ EXCLUDED: is_online=False")
            
            online_officers = self.get_online_officers(db, primary_org_id)
        
        print(f"[DISPATCH] Officers passing online+freshness filter: {len(online_officers)}")
        if len(online_officers) == 0:
            if len(all_officers_in_org if not include_external else all_officers_in_orgs) == 0:
                print(f"[DISPATCH] REASON: No OfficerLocation records exist for this org. Officers must send POST /officers/location first.")
            else:
                print(f"[DISPATCH] REASON: Officers exist but are STALE (last_seen > 5 min ago) or OFFLINE (is_online=False).")
        
        nearby = []
        for officer in online_officers:
            dist = haversine_km(lat, lng, officer.lat, officer.lng)
            print(f"[DISPATCH] Officer {officer.user_id}: distance={dist:.2f}km, radius={radius_km}km, in_range={'YES' if dist <= radius_km else 'NO'}")
            if dist <= radius_km:
                nearby.append((officer, dist))
        
        if len(online_officers) > 0 and len(nearby) == 0:
            print(f"[DISPATCH] REASON: {len(online_officers)} officer(s) are online but ALL are outside the {radius_km}km radius.")
        
        nearby.sort(key=lambda x: x[1])
        print(f"[DISPATCH] === Result: {len(nearby)} officer(s) dispatched ===")
        return nearby

    def set_offline(self, db: Session, user_id: str) -> Optional[OfficerLocation]:
        db_obj = db.query(OfficerLocation).filter(OfficerLocation.user_id == user_id).first()
        if db_obj:
            db_obj.is_online = False
            db.commit()
            db.refresh(db_obj)
        return db_obj

class CRUDDetectionAssignment:
    def create_assignment(
        self, db: Session, detection_id: str, user_id: str, distance_km: float
    ) -> DetectionAssignment:
        db_obj = DetectionAssignment(
            id=f"asg-{uuid.uuid4()}",
            detection_id=detection_id,
            user_id=user_id,
            distance_at_assignment=distance_km,
            status="assigned"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_user_assignments(self, db: Session, user_id: str, status: Optional[str] = None) -> List[DetectionAssignment]:
        query = db.query(DetectionAssignment).filter(DetectionAssignment.user_id == user_id)
        if status:
            query = query.filter(DetectionAssignment.status == status)
        return query.order_by(DetectionAssignment.created_at.desc()).all()
        
    def get_assignment(self, db: Session, assignment_id: str) -> Optional[DetectionAssignment]:
        return db.query(DetectionAssignment).filter(DetectionAssignment.id == assignment_id).first()

    def update_assignment_status(
        self, db: Session, assignment_id: str, status: str, notes: Optional[str] = None, proof_urls: Optional[List[str]] = None
    ) -> Optional[DetectionAssignment]:
        db_obj = self.get_assignment(db, assignment_id)
        if not db_obj:
            return None
        
        db_obj.status = status
        
        if status in ["closed_resolved", "closed_failed"]:
            db_obj.closed_at = datetime.utcnow()
            
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

    def expire_stale_assignments(self, db: Session, timeout_minutes: int = 120) -> int:
        timeout_threshold = datetime.utcnow() - timedelta(minutes=timeout_minutes)
        stale_assignments = db.query(DetectionAssignment).filter(
            DetectionAssignment.status == "assigned",
            DetectionAssignment.created_at <= timeout_threshold
        ).all()
        
        count = len(stale_assignments)
        for asg in stale_assignments:
            asg.status = "closed_failed"
        
        if count > 0:
            db.commit()
            
        return count

officer_location = CRUDOfficerLocation()
traffic_alert = CRUDDetectionAssignment()
