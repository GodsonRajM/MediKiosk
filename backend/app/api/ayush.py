import uuid
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.core.database import db

router = APIRouter(prefix="/ayush", tags=["AYUSH Clinical Assessment"])

@router.get("/{session_id}")
async def get_ayush_assessment(session_id: str):
    assessment = db.ayush_assessments.get(session_id)
    if not assessment:
        # Default assessment template
        return {
            "session_id": session_id,
            "prakriti": {"primary": "Vata-Pitta", "vata_score": 40, "pitta_score": 40, "kapha_score": 20},
            "vikriti": {"imbalance": "Pitta", "dosha_status": "Aggravated"},
            "sara": "Madhyama",
            "samhanana": "Madhyama",
            "pramana": {"height_cm": 168, "weight_kg": 74, "assessment": "Madhyama"},
            "satmya": "Madhyama",
            "sattva": "Madhyama",
            "ahara_shakti": {"abhyavaharana_shakti": "Madhyama", "jarana_shakti": "Madhyama"},
            "vyayama_shakti": "Madhyama",
            "vaya": "Madhyama",
            "ahara_vihara": {
                "meal_timing": "Regular",
                "appetite": "Moderate",
                "food_preferences": "Warm, Cooked",
                "water_intake_liters": 2.5,
                "daily_routine": "Regular",
                "sleep_duration_hours": 7,
                "sleep_quality": "Sound",
                "physical_exercise": "Walking 30 mins"
            },
            "doctor_verified": False,
            "doctor_notes": ""
        }
    return assessment

@router.post("/{session_id}")
async def update_ayush_assessment(session_id: str, data: Dict[str, Any]):
    current = db.ayush_assessments.get(session_id, {})
    current.update(data)
    current["session_id"] = session_id
    db.ayush_assessments[session_id] = current
    return {"status": "SUCCESS", "ayush_assessment": current}
