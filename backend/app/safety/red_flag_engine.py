from typing import List, Dict, Any

class RedFlagEngine:
    """
    Deterministic Safety & Red-Flag Engine for MediKiosk.
    Evaluates clinical entities and answers against evidence-based triage rules.
    Never diagnoses; flags critical presentations for priority medical assessment.
    """
    
    def evaluate(self, answers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        alerts = []
        
        # Flatten answers into map
        ans_map = {}
        for a in answers:
            qid = a.get("question_id")
            val = str(a.get("answer_text", "")).lower()
            ans_map[qid] = val

        # 1. Cardiovascular / Acute Coronary Syndrome Warning
        primary = ans_map.get("q_chief_complaint", "")
        assoc = ans_map.get("q_associated_symptoms", "")
        sev = ans_map.get("q_severity", "")

        is_chest_pain = "chest" in primary or "chest_pain" in primary
        has_dyspnea = "shortness_of_breath" in assoc or "breathing" in assoc or "sweat" in assoc

        if is_chest_pain and has_dyspnea:
            alerts.append({
                "rule_id": "RF-CARDIO-001",
                "level": "CRITICAL",
                "message": "Potential Acute Cardiopulmonary Presentation detected (Chest discomfort with dyspnea/diaphoresis).",
                "triage_recommendation": "Priority clinical assessment recommended. Immediate ECG and vitals evaluation advised.",
                "symptoms": ["Chest Pain", "Shortness of Breath / Diaphoresis"]
            })
        elif is_chest_pain:
            alerts.append({
                "rule_id": "RF-CARDIO-002",
                "level": "HIGH",
                "message": "Acute Chest Discomfort reported.",
                "triage_recommendation": "Priority OPD assessment advised.",
                "symptoms": ["Chest Pain"]
            })

        # 2. Critical Pain Severity Rule
        if "critical_9_10" in sev or "9" in sev or "10" in sev:
            alerts.append({
                "rule_id": "RF-PAIN-001",
                "level": "HIGH",
                "message": "High Acute Pain Scale reported (Score 9-10).",
                "triage_recommendation": "Expedited clinical triage for pain stabilization.",
                "symptoms": ["Severe Discomfort (9-10/10)"]
            })

        return alerts

red_flag_engine = RedFlagEngine()
