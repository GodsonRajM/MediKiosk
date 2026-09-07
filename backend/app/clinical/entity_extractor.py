"""
Clinical Entity Extraction and Answer Normalization.
Maps raw speech-to-text or touch selections into canonical clinical slot variables.
"""
from typing import Dict, Any, Optional


class ClinicalEntityExtractor:
    """Normalizes raw patient inputs into structured clinical variables."""

    @staticmethod
    def normalize_answer(question_code: str, raw_answer: str) -> Dict[str, Any]:
        raw_clean = raw_answer.strip().lower()
        
        # Mapping rules based on question codes
        if question_code == "CP_LOCATION":
            if any(w in raw_clean for w in ["retrosternal", "center", "middle", "breastbone", "நெஞ்சு நடுவில்"]):
                return {"slot": "location", "normalized": "retrosternal", "entity_type": "symptom_location"}
            if any(w in raw_clean for w in ["left", "left side", "இடது"]):
                return {"slot": "location", "normalized": "left_chest", "entity_type": "symptom_location"}
            return {"slot": "location", "normalized": raw_clean, "entity_type": "symptom_location"}

        if question_code == "CP_CHARACTER":
            if any(w in raw_clean for w in ["pressure", "heaviness", "tight", "squeezing", "பாரம்", "அழுத்தம்"]):
                return {"slot": "character", "normalized": "heaviness_pressure", "entity_type": "symptom_character"}
            if any(w in raw_clean for w in ["sharp", "stabbing", "குத்துவது"]):
                return {"slot": "character", "normalized": "sharp_pleuritic", "entity_type": "symptom_character"}
            if any(w in raw_clean for w in ["burn", "acidity", "நெஞ்செரிச்சல்"]):
                return {"slot": "character", "normalized": "burning", "entity_type": "symptom_character"}
            return {"slot": "character", "normalized": raw_clean, "entity_type": "symptom_character"}

        if question_code == "CP_SEVERITY":
            if any(w in raw_clean for w in ["severe", "7", "8", "9", "10", "high"]):
                return {"slot": "severity", "normalized": "severe", "entity_type": "severity"}
            if any(w in raw_clean for w in ["mod", "4", "5", "6"]):
                return {"slot": "severity", "normalized": "moderate", "entity_type": "severity"}
            return {"slot": "severity", "normalized": "mild", "entity_type": "severity"}

        if question_code == "CP_ASSOCIATED":
            items = []
            if any(w in raw_clean for w in ["breath", "shortness", "மூச்சுத்திணறல்", "दम"]):
                items.append("breathlessness")
            if any(w in raw_clean for w in ["sweat", "perspir", "வியர்வை", "पसीना"]):
                items.append("sweating")
            if any(w in raw_clean for w in ["dizzy", "giddi", "மயக்கம்"]):
                items.append("dizziness")
            if not items:
                items.append(raw_clean)
            return {"slot": "associated_symptoms", "normalized": items, "entity_type": "associated_symptoms"}

        # General slot fallback
        return {"slot": question_code.lower(), "normalized": raw_clean, "entity_type": "clinical_attribute"}


entity_extractor = ClinicalEntityExtractor()
