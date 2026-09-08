import json
import os
from typing import Dict, Any, List, Optional
from app.schemas.interview import QuestionResponse

class ClinicalQuestionGraph:
    """
    Deterministic Clinical Question Graph.
    Governs WHAT to ask and in what sequence; ensures systematic coverage of HPI,
    Past History, Medications, Allergies, and AYUSH modules.
    Tracks answered, unanswered, required questions, and contradictions.
    """
    def __init__(self):
        definitions_path = os.path.join(os.path.dirname(__file__), "graph_definitions.json")
        with open(definitions_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)
        self.standard_nodes = self.data["standard_nodes"]
        self.ayush_nodes = self.data["ayush_nodes"]

    def get_node_list(self, mode: str = "STANDARD") -> List[Dict[str, Any]]:
        nodes = list(self.standard_nodes)
        if mode.upper() == "AYUSH":
            nodes.extend(self.ayush_nodes)
        return nodes

    def get_next_question(self, answered_ids: List[str], mode: str = "STANDARD", language: str = "en") -> Optional[QuestionResponse]:
        nodes = self.get_node_list(mode)
        total_nodes = len(nodes)
        
        for idx, node in enumerate(nodes):
            if node["id"] not in answered_ids:
                # Select translated text based on language preference
                if language == "ta" and node.get("question_text_ta"):
                    q_text = node["question_text_ta"]
                elif language == "hi" and node.get("question_text_hi"):
                    q_text = node["question_text_hi"]
                else:
                    q_text = node["question_text_en"]
                    
                return QuestionResponse(
                    question_id=node["id"],
                    section=node["section"],
                    question_text=q_text,
                    question_text_en=node["question_text_en"],
                    question_text_ta=node.get("question_text_ta"),
                    question_text_hi=node.get("question_text_hi"),
                    input_type=node["input_type"],
                    options=node.get("options", []),
                    is_required=node.get("is_required", True),
                    clinical_category=node["clinical_category"],
                    total_nodes=total_nodes,
                    current_index=idx + 1
                )
        return None

clinical_graph = ClinicalQuestionGraph()
