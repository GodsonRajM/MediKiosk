import pytest
from app.clinical.question_graph import clinical_graph

def test_question_graph_first_question():
    q = clinical_graph.get_next_question(answered_ids=[], mode="STANDARD", language="en")
    assert q is not None
    assert q.question_id == "CHIEF_COMPLAINT"
    assert q.section == "Chief Complaint"
    assert q.current_index == 1

def test_question_graph_tamil_language():
    q = clinical_graph.get_next_question(answered_ids=[], mode="STANDARD", language="ta")
    assert q is not None
    assert "மருத்துவமனைக்கு" in q.question_text

def test_question_graph_traversal():
    answered = ["CHIEF_COMPLAINT", "HPI_DURATION"]
    q = clinical_graph.get_next_question(answered_ids=answered, mode="STANDARD", language="en")
    assert q is not None
    assert q.question_id == "HPI_ONSET"
    assert q.current_index == 3

def test_question_graph_ayush_nodes():
    standard_nodes = clinical_graph.get_node_list(mode="STANDARD")
    ayush_nodes = clinical_graph.get_node_list(mode="AYUSH")
    assert len(ayush_nodes) > len(standard_nodes)
    assert any(n["id"] == "AYUSH_PRAKRITI_DIGESTION" for n in ayush_nodes)
