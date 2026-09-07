"""
AYUSH Clinical Ontology and Structured Assessment Framework.
Maintains standardized Ayurvedic, Yoga & Naturopathy, Unani, Siddha, and Homeopathy clinical entities.
Prevents ungrounded or hallucinated terminology.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# Valid standardized Ayurvedic Clinical Terminology sets
VALID_PRAKRITI = {"Vata", "Pitta", "Kapha", "Vata-Pitta", "Pitta-Kapha", "Vata-Kapha", "Tridoshic (Sama)"}
VALID_AGNI = {"Sama (Balanced)", "Vishama (Irregular / Vata)", "Tikshna (Intense / Pitta)", "Manda (Sluggish / Kapha)"}
VALID_KOSHTHA = {"Krura (Hard / Constipated)", "Madhyama (Moderate)", "Mrudu (Soft / Lax)"}
VALID_SARA = {"Pravara (Superior)", "Madhyama (Medium)", "Avara (Inferior)"}
VALID_SAMHANANA = {"Susamhata (Compact)", "Madhyama (Moderate)", "Hina (Poor)"}
VALID_AHARA_SHAKTI = {"Pravara (High)", "Madhyama (Moderate)", "Avara (Poor)"}
VALID_VYAYAMA_SHAKTI = {"Pravara (High)", "Madhyama (Moderate)", "Avara (Poor)"}
VALID_SATTVA = {"Pravara (High mental endurance)", "Madhyama (Moderate)", "Avara (Low/Fragile)"}


class AyushClinicalProfile(BaseModel):
    """Dashavidha and Rogi-Pariksha structured profile."""
    prakriti: Optional[str] = Field(None, description="Innate constitutional dosha disposition")
    vikriti: Optional[str] = Field(None, description="Current pathological doshic imbalance")
    sara: Optional[str] = Field(None, description="Tissue vitality / Dhatu excellence")
    samhanana: Optional[str] = Field(None, description="Body compactness")
    pramana: Optional[str] = Field(None, description="Anthropometric proportions")
    satmya: Optional[str] = Field(None, description="Habituation / Dietary adaptability")
    sattva: Optional[str] = Field(None, description="Mental strength / resilience")
    ahara_shakti: Optional[str] = Field(None, description="Digestive and intake capacity")
    vyayama_shakti: Optional[str] = Field(None, description="Physical endurance / capacity for exertion")
    vaya: Optional[str] = Field(None, description="Age / Chronological life stage")

    # Rogi-Roga examination fields
    ahara: Optional[str] = Field(None, description="Dietary patterns and nutrition")
    vihara: Optional[str] = Field(None, description="Lifestyle, physical movement and sleep habits")
    agni: Optional[str] = Field(None, description="Digestive fire state")
    koshtha: Optional[str] = Field(None, description="Bowel and digestive tract motility")
    nidana: Optional[List[str]] = Field(default_factory=list, description="Etiological / contributing factors")
    samprapti: Optional[str] = Field(None, description="Pathogenesis description summary")

    @classmethod
    def validate_term(cls, field_name: str, value: str) -> bool:
        """Verifies that an AYUSH term conforms to standardized clinical ontology."""
        valid_map = {
            "prakriti": VALID_PRAKRITI,
            "agni": VALID_AGNI,
            "koshtha": VALID_KOSHTHA,
            "sara": VALID_SARA,
            "samhanana": VALID_SAMHANANA,
            "ahara_shakti": VALID_AHARA_SHAKTI,
            "vyayama_shakti": VALID_VYAYAMA_SHAKTI,
            "sattva": VALID_SATTVA,
        }
        allowed = valid_map.get(field_name)
        if not allowed:
            return True
        return any(term.lower() in value.lower() for term in allowed)


def get_default_ayush_intake_questions() -> List[Dict[str, Any]]:
    """Returns standardized quick-select intake questions for AYUSH parameters."""
    return [
        {
            "code": "AYUSH_AGNI",
            "section": "ayush_assessment",
            "text": "How is your appetite and digestion usually?",
            "type": "single_choice",
            "options": [
                {"id": "agni_sama", "label": "Regular and predictable appetite (Sama Agni)", "value": "Sama (Balanced)"},
                {"id": "agni_vishama", "label": "Irregular - hungry some days, not on others (Vishama Agni)", "value": "Vishama (Irregular / Vata)"},
                {"id": "agni_tikshna", "label": "Strong, intense hunger with burning/acidic sensation (Tikshna Agni)", "value": "Tikshna (Intense / Pitta)"},
                {"id": "agni_manda", "label": "Low appetite, feeling heavy even after small meals (Manda Agni)", "value": "Manda (Sluggish / Kapha)"}
            ]
        },
        {
            "code": "AYUSH_KOSHTHA",
            "section": "ayush_assessment",
            "text": "How are your bowel movements?",
            "type": "single_choice",
            "options": [
                {"id": "koshtha_regular", "label": "Normal, daily without strain (Madhyama)", "value": "Madhyama (Moderate)"},
                {"id": "koshtha_hard", "label": "Hard, dry stools or frequent constipation (Krura)", "value": "Krura (Hard / Constipated)"},
                {"id": "koshtha_soft", "label": "Loose, easily triggered by mild foods or milk (Mrudu)", "value": "Mrudu (Soft / Lax)"}
            ]
        }
    ]
