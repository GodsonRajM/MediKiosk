import re
from typing import Dict, Any, List
from app.ai.base import BaseAIProvider

class MockAIProvider(BaseAIProvider):
    """
    Offline Mock AI Provider.
    Enables complete end-to-end evaluation, testing, and judge demonstrations
    with zero external API keys or network latency, dynamically processing real inputs.
    """

    async def rephrase_question(self, question_text: str, context: Dict[str, Any], language: str) -> str:
        if language == "kn":
            return f"ದಯವಿಟ್ಟು ತಿಳಿಸಿ: {question_text}"
        elif language == "ta":
            return f"தயவுசெய்து சொல்லுங்கள்: {question_text}"
        elif language == "hi":
            return f"कृपया बताइए: {question_text}"
        return f"Could you tell us: {question_text}"

    async def extract_clinical_entities(self, text: str, section: str) -> List[Dict[str, Any]]:
        entities = []
        lower = text.lower()

        # Medications recognition
        if any(w in lower for w in ["metformin", "glycomet"]):
            entities.append({
                "entity_type": "MEDICATION",
                "entity_name": "Metformin",
                "attributes": {"dosage": "500 mg", "frequency": "Twice daily", "route": "Oral"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.95
            })
        if any(w in lower for w in ["amlodipine", "stamlo"]):
            entities.append({
                "entity_type": "MEDICATION",
                "entity_name": "Amlodipine",
                "attributes": {"dosage": "5 mg", "frequency": "Once daily", "route": "Oral"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.95
            })
        if any(w in lower for w in ["paracetamol", "dolo", "crocin"]):
            entities.append({
                "entity_type": "MEDICATION",
                "entity_name": "Paracetamol",
                "attributes": {"dosage": "650 mg", "frequency": "As needed", "route": "Oral"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.95
            })

        # Conditions recognition
        if any(w in lower for w in ["diabetes", "sugar", "சர்க்கரை", "मधुमेह", "ಮಧುಮೇಹ"]):
            entities.append({
                "entity_type": "CONDITION",
                "entity_name": "Type 2 Diabetes Mellitus",
                "attributes": {"status": "ACTIVE", "icd10": "E11.9"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.96
            })
        if any(w in lower for w in ["bp", "hypertension", "blood pressure", "இரத்த அழுத்தம்", "बीपी", "ರಕ್ತದೊತ್ತಡ"]):
            entities.append({
                "entity_type": "CONDITION",
                "entity_name": "Essential Hypertension",
                "attributes": {"status": "ACTIVE", "icd10": "I10"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.96
            })
        if any(w in lower for w in ["asthma", "wheezing", "ಆಸ್ತಮಾ"]):
            entities.append({
                "entity_type": "CONDITION",
                "entity_name": "Bronchial Asthma",
                "attributes": {"status": "ACTIVE", "icd10": "J45"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.94
            })

        # Allergies recognition
        if "penicillin" in lower:
            entities.append({
                "entity_type": "ALLERGY",
                "entity_name": "Penicillin",
                "attributes": {"reaction": "Urticaria/Rash", "severity": "MODERATE"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.93
            })
        if any(w in lower for w in ["sulfa", "aspirin"]):
            entities.append({
                "entity_type": "ALLERGY",
                "entity_name": "Aspirin/Sulfa",
                "attributes": {"reaction": "Allergic reaction", "severity": "MODERATE"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.90
            })

        # Chief Complaint / Symptoms
        if any(w in lower for w in ["chest pain", "tightness", "heaviness"]):
            entities.append({
                "entity_type": "SYMPTOM",
                "entity_name": "Retrosternal Chest Heaviness",
                "attributes": {"location": "Substernal", "nature": "Pressure", "exertional": True},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.97
            })
        elif any(w in lower for w in ["headache", "migraine", "தலைவலி", "सिरदर्द"]):
            entities.append({
                "entity_type": "SYMPTOM",
                "entity_name": "Cephalea / Headache",
                "attributes": {"location": "Cranial", "nature": "Throbbing"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.95
            })
        elif any(w in lower for w in ["fever", "காய்ச்சல்", "बुखार", "ಜ್ವರ"]):
            entities.append({
                "entity_type": "SYMPTOM",
                "entity_name": "Pyrexia / Fever",
                "attributes": {"nature": "Febrile"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.95
            })
        elif text.strip():
            # Catch-all general symptom
            entities.append({
                "entity_type": "SYMPTOM",
                "entity_name": text.strip()[:40],
                "attributes": {"raw_input": text.strip()},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.88
            })

        return entities

    async def process_document_ocr(self, document_text: str, doc_type: str) -> Dict[str, Any]:
        """Parses OCR text dynamically from actual file text."""
        extracted_facts = {
            "document_type": doc_type,
            "raw_text_length": len(document_text),
            "investigations": [],
            "medications": [],
            "abnormalities_detected": []
        }

        lower = document_text.lower()

        # Dynamic search for HbA1c
        hba1c_match = re.search(r'hba1c[^\d]*(\d+\.?\d*)\s*%', lower)
        if hba1c_match:
            val = hba1c_match.group(1)
            is_abnormal = float(val) >= 6.5
            extracted_facts["investigations"].append({
                "test_name": "HbA1c (Glycated Hemoglobin)",
                "result_value": val,
                "unit": "%",
                "reference_range": "< 5.7 %",
                "is_abnormal": is_abnormal,
                "confidence": 0.96,
                "source": "OCR"
            })
            if is_abnormal:
                extracted_facts["abnormalities_detected"].append(f"Elevated HbA1c ({val}%) indicates suboptimal glycemic control.")

        # Dynamic search for Creatinine
        creat_match = re.search(r'creatinine[^\d]*(\d+\.?\d*)\s*(mg/dl)?', lower)
        if creat_match:
            val = creat_match.group(1)
            is_abnormal = float(val) > 1.3
            extracted_facts["investigations"].append({
                "test_name": "Serum Creatinine",
                "result_value": val,
                "unit": "mg/dL",
                "reference_range": "0.7 - 1.3 mg/dL",
                "is_abnormal": is_abnormal,
                "confidence": 0.96,
                "source": "OCR"
            })
            if is_abnormal:
                extracted_facts["abnormalities_detected"].append(f"Elevated Serum Creatinine ({val} mg/dL).")

        # Dynamic search for Blood Pressure
        bp_match = re.search(r'(?:bp|blood pressure)[^\d]*(\d{2,3})\s*/\s*(\d{2,3})', lower)
        if bp_match:
            sys_val, dia_val = bp_match.group(1), bp_match.group(2)
            is_high = int(sys_val) >= 140 or int(dia_val) >= 90
            extracted_facts["investigations"].append({
                "test_name": "Blood Pressure",
                "result_value": f"{sys_val}/{dia_val}",
                "unit": "mmHg",
                "reference_range": "< 120/80 mmHg",
                "is_abnormal": is_high,
                "confidence": 0.95,
                "source": "OCR"
            })

        return extracted_facts

    async def generate_longitudinal_summary(self, session_data: Dict[str, Any], previous_records: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesizes an evidence-linked longitudinal summary strictly from REAL session inputs.
        """
        chief_complaint = session_data.get("chief_complaint_text") or "General health assessment requested"
        answers = previous_records.get("answers", {})

        # Extract duration & onset from real answers if available
        duration = answers.get("HPI_DURATION", "Recent onset")
        onset = answers.get("HPI_ONSET", "Gradual")
        severity = answers.get("HPI_SEVERITY", "Moderate")
        location = answers.get("HPI_LOCATION", "Localized discomfort")
        character = answers.get("HPI_CHARACTER", "Discomfort")
        associated = answers.get("HPI_ASSOCIATED", "None reported")

        hpi = f"Patient presents with {chief_complaint}. Duration: {duration}. Onset: {onset}. Location: {location}. Character: {character}. Reported severity: {severity}/10. Associated symptoms: {associated}."

        # Real conditions
        conditions = previous_records.get("conditions", [])
        if conditions:
            cond_names = ", ".join(c.get("condition_name", "") for c in conditions)
            past_history = f"Documented medical history includes: {cond_names}."
        else:
            past_history = answers.get("PMH_CONDITIONS") or "No prior chronic medical conditions recorded."

        # Real medications
        medications = previous_records.get("medications", [])
        if medications:
            med_names = ", ".join(f"{m.get('drug_name')} {m.get('dosage', '')}" for m in medications)
            meds_summary = f"Current active medications: {med_names}."
        else:
            meds_summary = answers.get("MEDS_CURRENT") or "No ongoing prescription medications reported."

        # Real allergies
        allergies = previous_records.get("allergies", [])
        if allergies:
            all_names = ", ".join(f"{a.get('allergen')} ({a.get('reaction_nature', '')})" for a in allergies)
            allergies_summary = f"Documented allergies: {all_names}."
        else:
            allergies_summary = answers.get("ALLERGIES_CHECK") or "No known drug allergies reported."

        # Real investigations
        investigations = previous_records.get("investigations", [])
        if investigations:
            inv_items = [f"{i.get('test_name')}: {i.get('result_value')} {i.get('unit', '')}" for i in investigations]
            inv_summary = f"Recent investigations: {', '.join(inv_items)}."
        else:
            inv_summary = "No recent laboratory or diagnostic investigations uploaded."

        # AYUSH Assessment
        ayush_summary = "Prakriti and Vikriti assessment pending physician review. Clinical intake recorded."

        # Contradictions
        contradictions = []
        for a in allergies:
            if a.get("contradiction_flag"):
                contradictions.append(f"ALLERGY ALERT: {a.get('contradiction_notes') or a.get('allergen')}")
        contradictions_summary = " | ".join(contradictions) if contradictions else "No clinical contradictions detected."

        # Red flags
        red_flags = previous_records.get("red_flags", [])
        if red_flags:
            rf_titles = [f.get("title", "Safety Flag") for f in red_flags]
            red_flags_summary = f"SAFETY ALERTS: {', '.join(rf_titles)}. Priority physician evaluation recommended."
        else:
            red_flags_summary = "Standard intake. No critical safety red flags detected."

        # Evidence links
        evidence_links = [
            {"field": "Chief Complaint", "source": "PATIENT_INTERVIEW", "confidence": 0.95, "reference": f"Input: {chief_complaint[:30]}"}
        ]
        if conditions:
            evidence_links.append({"field": "Chronic Conditions", "source": "MEDICAL_RECORDS", "confidence": 0.98, "reference": conditions[0].get("condition_name")})
        if investigations:
            evidence_links.append({"field": "Lab Investigation", "source": "OCR", "confidence": 0.96, "reference": investigations[0].get("test_name")})

        return {
            "chief_complaint_summary": f"Patient presents with {chief_complaint}.",
            "hpi_summary": hpi,
            "past_history_summary": past_history,
            "medications_summary": meds_summary,
            "allergies_summary": allergies_summary,
            "investigations_summary": inv_summary,
            "ayush_summary": ayush_summary,
            "contradictions_summary": contradictions_summary,
            "red_flags_summary": red_flags_summary,
            "evidence_links": evidence_links
        }

mock_ai_provider = MockAIProvider()
