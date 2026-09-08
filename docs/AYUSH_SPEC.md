# MediKiosk AYUSH Clinical Specification (SIH26047)

> **Ministry of Ayush Track — Patient Case-Taking Software**  
> *Dashavidha Pariksha (Ten-Fold Examination) & Ahara-Vihara Assessment Protocol*

---

## 1. Clinical Context & Mandate

Problem Statement **SIH26047** requires a comprehensive pre-consultation system capable of capturing traditional Ayurvedic diagnostic factors alongside modern clinical history. MediKiosk implements AYUSH Mode not as a cosmetic badge, but as a fully functional clinical workflow that produces structured, search-ready data aligned with classical Ayurvedic clinical methodology.

---

## 2. Dashavidha Pariksha Parameters

Every parameter is stored as a discrete, typed field (never unstructured text blobs):

| # | Parameter | Classical Meaning | MediKiosk Kiosk Patient Question Phrasing | Structured Output |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Prakriti** | Baseline constitutional phenotype | Body response to weather, physical traits, emotional baseline | Primary & Secondary Dosha (`Vata`, `Pitta`, `Kapha`) with percentage scores |
| 2 | **Vikriti** | Current state of doshic imbalance | Nature of presenting symptoms, temperature sensation, digestive distress | Imbalanced dosha status (`Vata`, `Pitta`, `Kapha`) |
| 3 | **Sara** | Tissue vitality / Constitutional essence | General resilience, muscle firmness, skin lustre | `Pravara` (Superior), `Madhyama` (Medium), `Avara` (Inferior) |
| 4 | **Samhanana** | Body compactness and symmetry | Physical build, joint stability (neutral phrasing) | `Pravara`, `Madhyama`, `Avara` |
| 5 | **Pramana** | Anthropometric measurements | Height, weight, abdominal girth | Calculated BMI & anthropometric evaluation |
| 6 | **Satmya** | Habituation / Adaptability | Foods and environments naturally tolerated | Adaptability category & habituated foods |
| 7 | **Sattva** | Mental resilience and tolerance | Pain tolerance, stress handling, emotional balance | `Pravara` (High), `Madhyama` (Moderate), `Avara` (Low) |
| 8 | **Ahara Shakti** | Digestive capacity | `Abhyavaharana Shakti` (appetite) & `Jarana Shakti` (digestion rate) | Discrete ratings for food intake and digestion comfort |
| 9 | **Vyayama Shakti** | Physical work capacity | Stamina, fatigue on light vs. heavy physical activity | `Pravara`, `Madhyama`, `Avara` |
| 10 | **Vaya** | Chronological / Biological age group | Derived automatically from patient DOB/age | `Bala` (Childhood), `Madhyama` (Adult), `Vriddha` (Elderly) |

---

## 3. Ahara-Vihara Assessment Protocol

Captures lifestyle and dietetics foundational to Ayurvedic therapeutics:

### Ahara (Dietary Practices)
- **Meal Timing**: Regular fixed timings vs. irregular.
- **Appetite (Agni)**: `Mandagni` (sluggish), `Tikshnagni` (intense), `Vishamagni` (irregular), `Samagni` (balanced).
- **Dietary Preference**: Warm vs. cold foods, predominant tastes (*Rasa*: Sweet, Sour, Salty, Pungent, Bitter, Astringent).
- **Water Consumption**: Quantity and temperature preference (warm vs. chilled).

### Vihara (Daily Regimen & Lifestyle)
- **Daily Routine (Dinacharya)**: Wake-up time, sleep schedule, bowel regularity.
- **Sleep Quality (Nidra)**: Sound sleep, insomnia, interrupted sleep, daytime sleepiness (*Divasvapna*).
- **Physical Activity (Vyayama)**: Sedentary, moderate walking, strenuous manual labor.
- **Stress Factors**: Occupational mental stress or emotional strain.

---

## 4. Ethical Boundaries & AI Role

- **AI Never Makes Final Ayurvedic Diagnoses**: The Prakriti questionnaire provides a system-generated preliminary estimation for the Ayurvedic physician to evaluate.
- **Doctor Authority**: The physician retains sole authority to confirm, re-classify, or edit any Dashavidha Pariksha rating.
- **Controlled Terminology**: Strictly uses classical Sanskrit terminology accompanied by plain-language vernacular equivalents in Tamil and Hindi.
