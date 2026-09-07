"""
Deterministic Clinical Red Flag Engine.
Evaluates safety escalation rules without making clinical diagnoses.
Adheres strictly to clinical decision support standards.
"""
from typing import Dict, Any, List


class RedFlagRule:
    def __init__(self, code: str, severity: str, message: str):
        self.code = code
        self.severity = severity  # 'high', 'medium', 'low'
        self.message = message


class RedFlagEngine:
    """Evaluates deterministic clinical safety triggers across answered fields and symptoms."""

    @staticmethod
    def evaluate(answered_slots: Dict[str, Any], chief_complaint: str = "") -> List[Dict[str, Any]]:
        flags: List[Dict[str, Any]] = []
        
        # 1. High Risk: Chest Discomfort + Associated Breathlessness
        associated = answered_slots.get("associated_symptoms", [])
        if isinstance(associated, str):
            associated = [associated]

        has_breathlessness = (
            "breathlessness" in associated or
            "shortness of breath" in str(answered_slots).lower() or
            "breathless" in chief_complaint.lower()
        )
        has_chest_pain = (
            answered_slots.get("location") in ["retrosternal", "left_chest"] or
            "chest" in chief_complaint.lower() or
            answered_slots.get("character") in ["heaviness_pressure"]
        )

        if has_chest_pain and has_breathlessness:
            flags.append({
                "rule_code": "CHEST_PAIN_BREATHLESSNESS",
                "severity": "high",
                "message": "Priority clinical assessment recommended: Retrosternal exertional discomfort associated with breathlessness in patient with cardiovascular risk factors.",
                "action": "immediate_triage"
            })

        # 2. High Risk: Thunderclap headache onset
        if answered_slots.get("onset") == "thunderclap":
            flags.append({
                "rule_code": "THUNDERCLAP_HEADACHE",
                "severity": "high",
                "message": "Priority clinical assessment recommended: Acute sudden onset severe headache requires urgent physical examination.",
                "action": "immediate_triage"
            })

        # 3. Medium Risk: Hemoptysis (Blood in cough)
        if answered_slots.get("type") == "hemoptysis":
            flags.append({
                "rule_code": "HEMOPTYSIS_DETECTED",
                "severity": "high",
                "message": "Priority clinical assessment recommended: Blood streaked sputum noted. Physician evaluation required.",
                "action": "physician_evaluation"
            })

        # 4. Severe Pain Score
        if answered_slots.get("severity") == "severe":
            flags.append({
                "rule_code": "ACUTE_SEVERE_PAIN",
                "severity": "medium",
                "message": "Moderate-to-severe symptom intensity reported (7-10/10). Expedited review recommended.",
                "action": "expedited_queue"
            })

        return flags


red_flag_engine = RedFlagEngine()
