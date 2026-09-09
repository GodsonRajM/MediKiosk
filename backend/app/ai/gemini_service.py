import json
from typing import Dict, List, Any, Optional
from app.core.config import settings

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class GeminiClinicalService:
    """
    AI Clinical Intelligence Service powered by Google Gemini.
    Strictly follows 'AI prepares the case; doctor owns the clinical decision'.
    Never diagnoses or prescribes.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        if HAS_GENAI and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            except Exception as e:
                print(f"[Gemini] Warning: Initializing Gemini model failed: {e}")
                self.model = None

    def extract_clinical_entities(self, question_field: str, answer_text: str) -> Dict[str, Any]:
        """
        Parses free-text patient response into normalized clinical entity dictionary.
        """
        if self.model and answer_text:
            prompt = (
                f"You are a clinical NLP extractor in an OPD kiosk. Extract key clinical facts from this patient answer.\n"
                f"Field: {question_field}\n"
                f"Patient Answer: {answer_text}\n"
                f"Return ONLY valid JSON matching: {{\"field\": \"{question_field}\", \"value\": \"<extracted fact>\", \"confidence\": 0.95}}"
            )
            try:
                resp = self.model.generate_content(prompt)
                text = resp.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)
            except Exception:
                pass
        
        # Deterministic extraction fallback
        return {
            "field": question_field,
            "value": answer_text.strip(),
            "confidence": 0.95,
            "source": "patient_answer"
        }

    def process_medical_document(self, file_content: bytes, mime_type: str, file_name: str) -> Dict[str, Any]:
        """
        Processes uploaded medical documents (scans, PDFs, prescriptions) via Gemini Vision.
        Extracts condition names, medications, lab values, and dates.
        """
        if self.model and file_content:
            try:
                part = {
                    "mime_type": mime_type,
                    "data": file_content
                }
                prompt = (
                    "You are a medical document OCR engine. Extract text and key clinical entities from this uploaded report.\n"
                    "Extract diagnoses, medications, dosages, and dates.\n"
                    "Return valid JSON: {\"extracted_text\": \"<text>\", \"entities\": [{\"entity_type\": \"medication|diagnosis|lab\", \"entity_name\": \"...\", \"entity_value\": \"...\", \"confidence\": 0.95}]}"
                )
                resp = self.model.generate_content([prompt, part])
                text = resp.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                return json.loads(text)
            except Exception as e:
                print(f"[Gemini] Document OCR note: {e}")

        # Fallback text representation from file name and metadata
        return {
            "extracted_text": f"Document: {file_name} processed. Clinical scan received for doctor review.",
            "entities": [
                {
                    "entity_type": "document",
                    "entity_name": "Medical Report",
                    "entity_value": file_name,
                    "confidence": 0.90,
                    "verified": False
                }
            ]
        }

    def synthesize_medical_summary(
        self,
        patient_profile: Dict[str, Any],
        answers: List[Dict[str, Any]],
        previous_history: List[Dict[str, Any]],
        document_entities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Synthesizes structured pre-consultation summary from:
        1. Current interview answers
        2. Relevant previous patient history from Supabase
        3. Extracted medical document entities
        """
        ans_dict = {a.get("question_id"): a.get("answer_text") for a in answers}
        
        # Real answers mapped to clinical summary fields
        primary_symptom = ans_dict.get("q_chief_complaint", "Not specified")
        duration = ans_dict.get("q_duration", "Not specified")
        severity = ans_dict.get("q_severity", "Not specified")
        associated = ans_dict.get("q_associated_symptoms", "None reported")
        past_conditions = ans_dict.get("q_past_conditions", "None reported")
        allergies = ans_dict.get("q_allergies", "No known drug allergies")
        medications = ans_dict.get("q_medications", "None reported")

        # Compile previous history if present in Supabase
        prev_conditions = [h.get("title") for h in previous_history if h.get("category") == "condition"]
        prev_surgeries = [h.get("title") for h in previous_history if h.get("category") == "surgery"]
        prev_allergies = [h.get("title") for h in previous_history if h.get("category") == "allergy"]

        # Compile document items
        docs_summary = [f"{e.get('entity_name')}: {e.get('entity_value')}" for e in document_entities]

        summary_data = {
            "patient_info": {
                "name": patient_profile.get("full_name", "Patient"),
                "age": patient_profile.get("age", "N/A"),
                "phone": patient_profile.get("phone", "N/A"),
                "blood_group": patient_profile.get("blood_group", "N/A")
            },
            "chief_complaint": primary_symptom,
            "history_of_present_illness": f"Patient reports {primary_symptom} with onset/duration: {duration}. Severity scale: {severity}. Associated symptoms: {associated}.",
            "past_medical_history": prev_conditions if prev_conditions else [past_conditions],
            "past_surgical_history": prev_surgeries if prev_surgeries else ["None reported"],
            "current_medications": [medications] if medications and medications != "None" else [],
            "allergies": prev_allergies if prev_allergies else [allergies],
            "uploaded_document_findings": docs_summary if docs_summary else ["No documents uploaded for this intake"],
            "ayush_assessment": {
                "prakriti": ans_dict.get("q_ayush_prakriti", "Not assessed"),
                "agni": ans_dict.get("q_ayush_agni", "Not assessed"),
                "koshtha": ans_dict.get("q_ayush_koshtha", "Not assessed"),
                "nidra_vihara": ans_dict.get("q_ayush_nidra", "Not assessed")
            },
            "clinical_notice": "AI prepares the case; the doctor owns the clinical decision. Not a diagnostic formulation."
        }

        # If Gemini is configured, enhance the narrative synthesis
        if self.model:
            try:
                prompt = (
                    "You are a medical scribe summarizing pre-consultation OPD history for a doctor.\n"
                    f"Patient Data: {json.dumps(summary_data)}\n"
                    "Generate a concise, doctor-readable clinical case summary JSON matching the keys:\n"
                    "{\"chief_complaint\": \"...\", \"history_of_present_illness\": \"...\", \"past_medical_history\": [...], \"current_medications\": [...], \"allergies\": [...]}\n"
                    "Do NOT formulate a diagnosis. Return ONLY valid JSON."
                )
                resp = self.model.generate_content(prompt)
                text = resp.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                ai_enhanced = json.loads(text)
                summary_data.update(ai_enhanced)
            except Exception:
                pass

        return summary_data

gemini_service = GeminiClinicalService()
