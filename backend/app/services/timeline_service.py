"""
Medical Timeline Service.
Retrieves and aggregates chronological health milestones for a patient.
"""
from typing import List, Dict, Any
from app.db.database import db


class TimelineService:
    @staticmethod
    def get_patient_timeline(patient_id: str) -> List[Dict[str, Any]]:
        events = db.timeline.get(patient_id, [])
        # Sort chronologically descending
        return sorted(events, key=lambda x: x.get("event_date", ""), reverse=True)


timeline_service = TimelineService()
