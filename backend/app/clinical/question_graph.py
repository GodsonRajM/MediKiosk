"""
Clinical Question Graph Engine.
Governs structured clinical pathways and controls interview question sequencing.
"""
import json
import os
from typing import Dict, Any, List, Optional
from app.schemas.question import QuestionResponse, QuestionOption

GRAPH_FILE_PATH = os.path.join(os.path.dirname(__file__), "question_graph.json")


class ClinicalQuestionGraph:
    def __init__(self, json_path: str = GRAPH_FILE_PATH):
        with open(json_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)
        self.pathways: Dict[str, Any] = self.data.get("pathways", {})

    def detect_pathway(self, chief_complaint: str) -> str:
        """Determines matching pathway based on chief complaint keywords."""
        complaint = chief_complaint.lower()
        if any(term in complaint for term in ["chest", "heart", "angina", "discomfort in chest", "நெஞ்சு"]):
            return "chest_pain"
        if any(term in complaint for term in ["fever", "temperature", "chills", "காய்ச்சல்", "बुखार"]):
            return "fever"
        if any(term in complaint for term in ["cough", "phlegm", "cold", "இருமல்", "खांसी"]):
            return "cough"
        if any(term in complaint for term in ["stomach", "abdomen", "belly", "வயிறு", "पेट"]):
            return "abdominal_pain"
        if any(term in complaint for term in ["headache", "head pain", "migraine", "தலைவலி", "सिरदर्द"]):
            return "headache"
        return "chest_pain"  # Default clinical intake pathway

    def get_pathway(self, pathway_name: str) -> Optional[Dict[str, Any]]:
        return self.pathways.get(pathway_name)

    def get_next_question(
        self,
        pathway_name: str,
        answered_slots: Dict[str, Any]
    ) -> Optional[QuestionResponse]:
        """Finds the next unanswered required slot in the pathway."""
        pathway = self.get_pathway(pathway_name)
        if not pathway:
            return None

        questions = pathway.get("questions", [])
        for idx, q in enumerate(questions):
            slot = q.get("slot")
            if slot not in answered_slots or answered_slots[slot] is None:
                options = [
                    QuestionOption(
                        id=opt["id"],
                        label=opt["label"],
                        value=opt["value"],
                        icon=opt.get("icon")
                    )
                    for opt in q.get("options", [])
                ]
                return QuestionResponse(
                    id=f"{pathway_name}_{q['code']}",
                    question_code=q["code"],
                    section=q.get("section", "symptoms"),
                    question_text=q["text"],
                    question_type=q["type"],
                    options=options,
                    sequence=idx + 1,
                    required=True,
                    help_text=q.get("help_text")
                )
        return None

    def get_total_questions_count(self, pathway_name: str) -> int:
        pathway = self.get_pathway(pathway_name)
        return len(pathway.get("questions", [])) if pathway else 0


clinical_graph = ClinicalQuestionGraph()
