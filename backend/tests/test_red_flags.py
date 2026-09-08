import pytest
from app.safety.red_flag_engine import red_flag_engine

def test_chest_pain_and_dyspnea_trigger():
    cc = "Chest pain for 2 days"
    answers = {
        "HPI_LOCATION": "Center of chest",
        "HPI_AGGRAVATING": "Walking or physical exertion",
        "HPI_ASSOCIATED": "Shortness of breath"
    }
    flags = red_flag_engine.evaluate_session(chief_complaint=cc, answers_map=answers, patient_history=["Diabetes"])
    assert len(flags) > 0
    assert flags[0]["rule_id"] == "RULE_CHEST_PAIN_EXERTIONAL_SOB"
    assert flags[0]["severity"] == "CRITICAL"
    # Ensure non-diagnostic advisory wording
    assert "Priority clinical assessment recommended" in flags[0]["clinical_recommendation"]
    assert "heart attack" not in flags[0]["clinical_recommendation"].lower()

def test_no_red_flag_for_mild_symptoms():
    cc = "Mild runny nose"
    answers = {
        "HPI_DURATION": "1 - 3 days",
        "HPI_SEVERITY": "2",
        "HPI_ASSOCIATED": "None of these"
    }
    flags = red_flag_engine.evaluate_session(chief_complaint=cc, answers_map=answers, patient_history=[])
    assert len(flags) == 0
