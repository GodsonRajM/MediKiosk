import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

class RedFlagRuleEngine:
    """
    Deterministic Safety Rule Engine.
    Evaluates patient responses and clinical parameters against evidence-based rules.
    Outputs strict non-diagnostic triage advisories (never diagnostic conclusions).
    """

    def evaluate_session(self, chief_complaint: str, answers_map: Dict[str, str], patient_history: List[str]) -> List[Dict[str, Any]]:
        triggered_flags = []
        cc_lower = chief_complaint.lower() if chief_complaint else ""
        combined_text = (cc_lower + " " + " ".join(answers_map.values())).lower()

        # RULE 1: Retrosternal chest pain / exertion + dyspnea (Demo scenario)
        has_chest_pain = any(k in combined_text for k in ["chest pain", "chest tightness", "heaviness in chest", "நெஞ்சு வலி", "மார்பு வலி", "सीने में दर्द"])
        has_dyspnea = any(k in combined_text for k in ["shortness of breath", "breathlessness", "difficulty breathing", "மூச்சுத் திணறல்", "சாஸ் फूलना"])
        has_exertion = any(k in combined_text for k in ["exertion", "walking", "stairs", "நடக்கும் போது", "चलने पर"])

        if has_chest_pain and (has_dyspnea or has_exertion):
            criteria = []
            if has_chest_pain: criteria.append("chest_pain_present: true")
            if has_dyspnea: criteria.append("associated_dyspnea: true")
            if has_exertion: criteria.append("exertional_provocation: true")

            triggered_flags.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_CHEST_PAIN_EXERTIONAL_SOB",
                "severity": "CRITICAL",
                "title": "Exertional Retrosternal Chest Pain with Dyspnea",
                "clinical_recommendation": "Priority clinical assessment recommended. Urgent 12-lead ECG and physician evaluation advised.",
                "triggered_criteria": criteria,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            })

        # RULE 2: Severe acute pain (scale >= 8/10)
        severity_ans = answers_map.get("HPI_SEVERITY", "")
        if severity_ans in ["8", "9", "10"]:
            triggered_flags.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_SEVERE_ACUTE_PAIN",
                "severity": "HIGH",
                "title": "High-Intensity Pain Reported",
                "clinical_recommendation": "Priority clinical assessment recommended. Rapid analgesic and diagnostic assessment indicated.",
                "triggered_criteria": [f"pain_scale_reported: {severity_ans}/10"],
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            })

        # RULE 3: Sudden onset neurologial / dizziness / syncope
        if any(k in combined_text for k in ["fainting", "syncope", "passed out", "loss of consciousness", "சுயநினைவு இழப்பு", "बेहोश"]):
            triggered_flags.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_SYNCOPE_EPISODE",
                "severity": "CRITICAL",
                "title": "Reported Episode of Syncope or Loss of Consciousness",
                "clinical_recommendation": "Priority clinical assessment recommended. Immediate vitals assessment and neurology/cardiology review advised.",
                "triggered_criteria": ["syncope_symptom: true"],
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            })

        return triggered_flags

red_flag_engine = RedFlagRuleEngine()
