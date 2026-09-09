from typing import Dict, List, Optional, Any
from app.schemas.clinical import QuestionNode, QuestionOption

CLINICAL_QUESTIONS: List[QuestionNode] = [
    # 1. Chief Complaint
    QuestionNode(
        id="q_chief_complaint",
        section="Chief Complaint",
        question_type="single_choice",
        clinical_field="primary_symptom",
        text={
            "en": "What is the main health issue or symptom that brought you to the hospital today?",
            "kn": "ಇಂದು ನಿಮ್ಮನ್ನು ಆಸ್ಪತ್ರೆಗೆ ಕರೆತಂದ ಮುಖ್ಯ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಅಥವಾ ಲಕ್ಷಣ ಯಾವುದು?",
            "ta": "இன்று உங்களை மருத்துவமனைக்கு வரவழைத்த முக்கிய உடல்நலப் பிரச்சினை என்ன?",
            "hi": "आज आपको अस्पताल लाने वाली मुख्य स्वास्थ्य समस्या या लक्षण क्या है?"
        },
        options=[
            QuestionOption(id="opt_chest_pain", label={"en": "Chest Pain / Discomfort", "kn": "ಎದೆ ನೋವು / ಅಸ್ವಸ್ಥತೆ", "ta": "மார்பு வலி / அசௌகரியம்", "hi": "सीने में दर्द / बेचैनी"}, value="chest_pain"),
            QuestionOption(id="opt_fever", label={"en": "Fever / Chills", "kn": "ಜ್ವರ / ಚಳಿ", "ta": "காய்ச்சல் / குளிர்", "hi": "बुखार / ठंड लगना"}, value="fever"),
            QuestionOption(id="opt_cough", label={"en": "Cough / Breathing Issue", "kn": "ಕೆಮ್ಮು / ಉಸಿರಾಟದ ತೊಂದರೆ", "ta": "இருமல் / மூச்சுத்திணறல்", "hi": "खांसी / सांस लेने में तकलीफ"}, value="cough_dyspnea"),
            QuestionOption(id="opt_stomach", label={"en": "Abdominal / Stomach Pain", "kn": "ಹೊಟ್ಟೆ ನೋವು", "ta": "வயிற்று வலி", "hi": "पेट दर्द"}, value="abdominal_pain"),
            QuestionOption(id="opt_headache", label={"en": "Severe Headache / Dizziness", "kn": "ತೀವ್ರ ತಲೆನೋವು / ತಲೆತಿರುಗುವಿಕೆ", "ta": "கடுமையான தலைவலி / தலைச்சுற்றல்", "hi": "सिरदर्द / चक्कर आना"}, value="headache_dizziness"),
            QuestionOption(id="opt_joint", label={"en": "Joint Pain / Body Ache", "kn": "ಕೀಲು ನೋವು / ಮೈಕೈ ನೋವು", "ta": "மூட்டு வலி / உடல் வலி", "hi": "जोड़ों का दर्द / बदन दर्द"}, value="joint_pain"),
            QuestionOption(id="opt_other", label={"en": "Other General Symptom", "kn": "ಇತರ ಲಕ್ಷಣ", "ta": "பிற அறிகுறிகள்", "hi": "अन्य सामान्य लक्षण"}, value="other")
        ]
    ),

    # 2. Duration / Onset
    QuestionNode(
        id="q_duration",
        section="History of Present Illness",
        question_type="single_choice",
        clinical_field="symptom_duration",
        text={
            "en": "How long have you been experiencing this symptom?",
            "kn": "ಈ ಸಮಸ್ಯೆಯು ನಿಮಗೆ ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ?",
            "ta": "இந்த அறிகுறி உங்களுக்கு எத்தனை நாட்களாக இருக்கிறது?",
            "hi": "यह लक्षण आपको कितने समय से महसूस हो रहा है?"
        },
        options=[
            QuestionOption(id="opt_dur_today", label={"en": "Started today (acute)", "kn": "ಇಂದಷ್ಟೇ ಪ್ರಾರಂಭವಾಗಿದೆ", "ta": "இன்றே தொடங்கியது", "hi": "आज ही शुरू हुआ"}, value="less_than_24h"),
            QuestionOption(id="opt_dur_days", label={"en": "1 to 3 days", "kn": "೧ ರಿಂದ ೩ ದಿನಗಳು", "ta": "1 முதல் 3 நாட்கள்", "hi": "1 से 3 दिन"}, value="1_3_days"),
            QuestionOption(id="opt_dur_week", label={"en": "1 to 2 weeks", "kn": "೧ ರಿಂದ ೨ ವಾರಗಳು", "ta": "1 முதல் 2 வாரங்கள்", "hi": "1 से 2 सप्ताह"}, value="1_2_weeks"),
            QuestionOption(id="opt_dur_month", label={"en": "More than a month (chronic)", "kn": "ಒಂದು ತಿಂಗಳಿಗಿಂತ ಹೆಚ್ಚು", "ta": "ஒரு மாதத்திற்கும் மேலாக", "hi": "एक महीने से अधिक"}, value="chronic")
        ]
    ),

    # 3. Severity (1 - 10)
    QuestionNode(
        id="q_severity",
        section="History of Present Illness",
        question_type="single_choice",
        clinical_field="pain_severity",
        text={
            "en": "On a scale of 1 to 10, how severe is your discomfort right now?",
            "kn": "೧ ರಿಂದ ೧೦ ರ ಮಾಪಕದಲ್ಲಿ ನಿಮ್ಮ ತೊಂದರೆ ಎಷ್ಟು ತೀವ್ರವಾಗಿದೆ?",
            "ta": "1 முதல் 10 வரையிலான அளவில் உங்கள் வலி அல்லது அசௌகரியம் எவ்வளவு தீவிரமானது?",
            "hi": "1 से 10 के पैमाने पर, आपकी तकलीफ कितनी गंभीर है?"
        },
        options=[
            QuestionOption(id="opt_sev_mild", label={"en": "1 - 3: Mild (Noticeable, manageable)", "kn": "೧ - ೩: ಸೌಮ್ಯ (ನಿರ್ವಹಿಸಬಹುದಾದ)", "ta": "1 - 3: லேசானது", "hi": "1 - 3: हल्का"}, value="mild_1_3"),
            QuestionOption(id="opt_sev_mod", label={"en": "4 - 6: Moderate (Interferes with work)", "kn": "೪ - ೬: ಮಧ್ಯಮ", "ta": "4 - 6: மிதமானது", "hi": "4 - 6: मध्यम"}, value="moderate_4_6"),
            QuestionOption(id="opt_sev_high", label={"en": "7 - 8: Severe (Hard to concentrate)", "kn": "೭ - ೮: ತೀವ್ರ", "ta": "7 - 8: தீவிரமானது", "hi": "7 - 8: तीव्र"}, value="severe_7_8"),
            QuestionOption(id="opt_sev_crit", label={"en": "9 - 10: Critical (Unbearable)", "kn": "೯ - ೧೦: ಅತ್ಯಂತ ತೀವ್ರ", "ta": "9 - 10: தாங்க முடியாதது", "hi": "9 - 10: अत्यधिक असहनीय"}, value="critical_9_10")
        ]
    ),

    # 4. Associated Symptoms / Red Flags Check
    QuestionNode(
        id="q_associated_symptoms",
        section="Review of Systems",
        question_type="single_choice",
        clinical_field="associated_symptoms",
        text={
            "en": "Are you experiencing any of the following accompanying symptoms?",
            "kn": "ನೀವು ಈ ಕೆಳಗಿನ ಯಾವುದೇ ಸಂಬಂಧಿತ ಲಕ್ಷಣಗಳನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೀರಾ?",
            "ta": "பின்வரும் தொடர்புடைய அறிகுறிகளில் ஏதேனும் உங்களுக்கு உள்ளதா?",
            "hi": "क्या आप निम्नलिखित में से किसी लक्षण का अनुभव कर रहे हैं?"
        },
        options=[
            QuestionOption(id="opt_assoc_none", label={"en": "None of these", "kn": "ಯಾವುದೂ ಇಲ್ಲ", "ta": "எதுவுமில்லை", "hi": "इनमें से कोई नहीं"}, value="none"),
            QuestionOption(id="opt_assoc_dyspnea", label={"en": "Shortness of breath / Breathing difficulty", "kn": "ಉಸಿರಾಟದ ತೊಂದರೆ", "ta": "மூச்சுத் திணறல்", "hi": "सांस लेने में कठिनाई"}, value="shortness_of_breath"),
            QuestionOption(id="opt_assoc_sweat", label={"en": "Profuse cold sweating / Dizziness", "kn": "ವಿಪರೀತ ಬೆವರು / ತಲೆತಿರುಗುವಿಕೆ", "ta": "குளிர் வியர்வை / மயக்கம்", "hi": "अचानक पसीना आना / चक्कर"}, value="sweating_dizziness"),
            QuestionOption(id="opt_assoc_nausea", label={"en": "Nausea or Vomiting", "kn": "ವಾಕರಿಕೆ ಅಥವಾ ವಾಂತಿ", "ta": "குமட்டல் அல்லது வாந்தி", "hi": "उल्टी या मतली"}, value="nausea_vomiting")
        ]
    ),

    # 5. Past Medical History
    QuestionNode(
        id="q_past_conditions",
        section="Past Medical History",
        question_type="single_choice",
        clinical_field="chronic_conditions",
        text={
            "en": "Do you have any diagnosed pre-existing medical conditions?",
            "kn": "ನಿಮಗೆ ಈ ಹಿಂದೆ ಯಾವುದೇ ದೀರ್ಘಕಾಲದ ಕಾಯಿಲೆಗಳಿವೆಯೇ?",
            "ta": "உங்களுக்கு ஏற்கனவே கண்டறியப்பட்ட மருத்துவ நிலைகள் ஏதேனும் உள்ளதா?",
            "hi": "क्या आपको पहले से कोई पुरानी बीमारी (डायबिटीज, बीपी, आदि) है?"
        },
        options=[
            QuestionOption(id="opt_cond_none", label={"en": "No known chronic conditions", "kn": "ಯಾವುದೇ ದೀರ್ಘಕಾಲದ ಕಾಯಿಲೆಗಳಿಲ್ಲ", "ta": "எந்த நோயும் இல்லை", "hi": "कोई पुरानी बीमारी नहीं"}, value="none"),
            QuestionOption(id="opt_cond_htn_dm", label={"en": "Diabetes and/or Hypertension (BP)", "kn": "ಮಧುಮೇಹ ಮತ್ತು/ಅಥವಾ ರಕ್ತದೊತ್ತಡ", "ta": "நீரிழிவு மற்றும்/அல்லது உயர் இரத்த அழுத்தம்", "hi": "मधुमेह (शुगर) और/या उच्च रक्तचाप (BP)"}, value="diabetes_hypertension"),
            QuestionOption(id="opt_cond_cardiac", label={"en": "Heart Disease / Previous Stent", "kn": "ಹೃದಯ ರೋಗ", "ta": "இதய நோய்", "hi": "हृदय रोग"}, value="heart_disease"),
            QuestionOption(id="opt_cond_asthma", label={"en": "Asthma / Respiratory illness", "kn": "ಉಬ್ಬಸ / ಅಸ್ತಮಾ", "ta": "ஆஸ்துமா / சுவாச நோய்", "hi": "अस्थमा / सांस की बीमारी"}, value="asthma_copd")
        ]
    ),

    # 6. Allergies
    QuestionNode(
        id="q_allergies",
        section="Allergies",
        question_type="single_choice",
        clinical_field="drug_allergies",
        text={
            "en": "Do you have any known allergies to medicines, foods, or substances?",
            "kn": "ನಿಮಗೆ ಯಾವುದೇ ಔಷಧಿ ಅಥವಾ ಆಹಾರದ ಅಲರ್ಜಿ ಇದೆಯೇ?",
            "ta": "மருந்துகள் அல்லது உணவுப் பொருட்களுக்கு ஏதேனும் ஒவ்வாமை (Allergy) உள்ளதா?",
            "hi": "क्या आपको किसी दवा, भोजन या अन्य चीज से कोई एलर्जी है?"
        },
        options=[
            QuestionOption(id="opt_all_none", label={"en": "No known allergies (NKDA)", "kn": "ಯಾವುದೇ ಅಲರ್ಜಿ ಇಲ್ಲ", "ta": "எந்த ஒவ்வாமையும் இல்லை", "hi": "कोई ज्ञात एलर्जी नहीं"}, value="none"),
            QuestionOption(id="opt_all_penicillin", label={"en": "Penicillin / Antibiotic allergy", "kn": "ಪೆನ್ಸಿಲಿನ್ / ಆ್ಯಂಟಿಬಯೋಟಿಕ್ ಅಲರ್ಜಿ", "ta": "பென்சிலின் / நுண்ணுயிர் எதிர்ப்பி ஒவ்வாமை", "hi": "पेनिसिलिन / एंटीबायोटिक एलर्जी"}, value="penicillin_allergy"),
            QuestionOption(id="opt_all_nsaids", label={"en": "Painkiller / Aspirin / NSAID allergy", "kn": "ನೋವು ನಿವಾರಕ ಔಷಧಿ ಅಲರ್ಜಿ", "ta": "வலி நிவாரணி மாத்திரை ஒவ்வாமை", "hi": "दर्द निवारक दवा एलर्जी"}, value="nsaids_allergy"),
            QuestionOption(id="opt_all_other", label={"en": "Other food or substance allergy", "kn": "ಇತರ ಅಲರ್ಜಿ", "ta": "பிற ஒவ்வாமை", "hi": "अन्य एलर्जी"}, value="other_allergy")
        ]
    ),

    # 7. Current Medications
    QuestionNode(
        id="q_medications",
        section="Medications",
        question_type="text",
        clinical_field="current_medications",
        text={
            "en": "Are you currently taking any regular prescription or over-the-counter medicines? Please mention names or type 'None'.",
            "kn": "ನೀವು ಪ್ರಸ್ತುತ ಯಾವುದೇ ನಿಯಮಿತ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ? ಹೆಸರುಗಳನ್ನು ಬರೆಯಿರಿ ಅಥವಾ 'ಯಾವುದೂ ಇಲ್ಲ' ಎಂದು ನಮೂದಿಸಿ.",
            "ta": "தற்போது வழக்கமாக ஏதேனும் மருந்துகள் எடுத்துக்கொள்கிறீர்களா? பெயர்களைக் குறிப்பிடவும் அல்லது 'இல்லை' என எழுதவும்.",
            "hi": "क्या आप वर्तमान में कोई नियमित दवाएं ले रहे हैं? कृपया नाम लिखें या 'कोई नहीं' लिखें।"
        }
    )
]

class ClinicalQuestionGraph:
    """
    Deterministic Clinical Question Graph Engine.
    Executes a structured clinical history intake workflow.
    """
    def __init__(self):
        self.nodes: Dict[str, QuestionNode] = {q.id: q for q in CLINICAL_QUESTIONS}
        self.node_order: List[str] = [q.id for q in CLINICAL_QUESTIONS]

    def get_first_question(self) -> QuestionNode:
        return self.nodes[self.node_order[0]]

    def get_question_by_id(self, question_id: str) -> Optional[QuestionNode]:
        return self.nodes.get(question_id)

    def get_next_question(self, current_question_id: str, answer_value: str, answers_so_far: List[Dict[str, Any]]) -> Optional[QuestionNode]:
        """
        Calculates next question using deterministic clinical graph rules.
        """
        if current_question_id not in self.node_order:
            return None
        
        idx = self.node_order.index(current_question_id)
        if idx + 1 < len(self.node_order):
            next_id = self.node_order[idx + 1]
            return self.nodes[next_id]
        
        return None

clinical_graph = ClinicalQuestionGraph()
