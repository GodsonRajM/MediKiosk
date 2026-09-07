"""
Timeline Builder from Clinical Documents and Intake Events.
Synthesizes chronological health milestones for physician visualization.
"""
import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone


class TimelineBuilder:
    @staticmethod
    def build_events_from_document(
        patient_id: str,
        document_id: str,
        extracted_entities: Dict[str, Any],
        document_date: str = "2026-02-20"
    ) -> List[Dict[str, Any]]:
        events = []
        
        # 1. Add lab test events
        for lab in extracted_entities.get("investigations", []):
            events.append({
                "id": str(uuid.uuid4()),
                "patient_id": patient_id,
                "event_date": document_date,
                "event_type": "lab_test",
                "title": f"Lab: {lab.get('test_name')}",
                "description": f"Result: {lab.get('result')} {lab.get('unit', '')} {'(Abnormal / Elevated)' if lab.get('abnormal') else ''}",
                "source_type": "document",
                "source_id": document_id,
                "confidence": 0.95,
                "created_at": datetime.now(timezone.utc).isoformat()
            })

        # 2. Add prescription events
        med_names = [m.get("name") for m in extracted_entities.get("medications", []) if m.get("name")]
        if med_names:
            events.append({
                "id": str(uuid.uuid4()),
                "patient_id": patient_id,
                "event_date": document_date,
                "event_type": "prescription",
                "title": "Prescription Refill / Update",
                "description": f"Active medications: {', '.join(med_names)}",
                "source_type": "document",
                "source_id": document_id,
                "confidence": 0.95,
                "created_at": datetime.now(timezone.utc).isoformat()
            })

        return events


timeline_builder = TimelineBuilder()
