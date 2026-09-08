from pydantic import BaseModel
from typing import Optional, Dict, Any

class PrakritiSchema(BaseModel):
    primary: str = "Vata-Pitta"
    vata_score: int = 33
    pitta_score: int = 33
    kapha_score: int = 34

class VikritiSchema(BaseModel):
    imbalance: str = "Pitta"
    dosha_status: str = "Aggravated"

class AharaShaktiSchema(BaseModel):
    abhyavaharana_shakti: str = "Madhyama"
    jarana_shakti: str = "Madhyama"

class AharaViharaSchema(BaseModel):
    meal_timing: str = "Regular"
    appetite: str = "Moderate"
    food_preferences: str = "Warm, Cooked"
    water_intake_liters: float = 2.5
    daily_routine: str = "Regular"
    sleep_duration_hours: int = 7
    sleep_quality: str = "Sound"
    physical_exercise: str = "Walking 30 mins"

class AyushAssessmentResponse(BaseModel):
    id: str
    patient_id: str
    session_id: str
    prakriti: PrakritiSchema
    vikriti: VikritiSchema
    sara: str = "Madhyama"
    samhanana: str = "Madhyama"
    pramana: Dict[str, Any] = {"assessment": "Madhyama"}
    satmya: str = "Madhyama"
    sattva: str = "Madhyama"
    ahara_shakti: AharaShaktiSchema
    vyayama_shakti: str = "Madhyama"
    vaya: str = "Madhyama"
    ahara_vihara: AharaViharaSchema
    doctor_verified: bool = False
    doctor_notes: Optional[str] = None
