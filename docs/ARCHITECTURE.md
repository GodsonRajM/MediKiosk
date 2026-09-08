# MediKiosk System Architecture

> **Pre-consultation, AI-assisted patient case-taking system**  
> *Smart India Hackathon 2026 — Problem Statement SIH26047 (Ministry of Ayush track)*

---

## 1. Five-Layer Architecture

```
                    MEDIKIOSK
                        │
             ┌──────────┴──────────┐
       PATIENT EXPERIENCE      CLINICAL ENGINE
       (voice/touch, language,   (question graph,
        accessibility)            clinical state, safety rules)
             └──────────┬──────────┘
                  STRUCTURED DATA
        ┌───────────────┼────────────────┐
     HISTORY          DOCUMENTS         AYUSH
        └───────────────┼────────────────┘
                  MEDICAL TIMELINE
                        │
                 LONGITUDINAL AI
             ┌──────────┴──────────┐
         RED FLAGS               SUMMARY
             └──────────┬──────────┘
                  DOCTOR REVIEW
                        │
                 FINAL RECORD
                        │
                 FHIR / ABDM
```

### Layer 1: Patient Experience & Frontend
- Built on **Next.js 14+ (App Router)**, React, TypeScript, and Tailwind CSS.
- **Kiosk-Optimized**: High contrast, oversized touch targets, audio prompts, TalkBack-ready accessibility.
- **Multilingual Support**: English, Tamil (`ta`), Hindi (`hi`).
- **Input Modality**: Voice-first with seamless touch/text fallbacks at every stage.

### Layer 2: Clinical Engine & Backend
- Built on **Python & FastAPI** (monolithic service architecture for high cohesion and zero microservice latency).
- **Deterministic Question Graph**: Controls clinical progression, ensuring systematic HPI, PMH, surgical, medication, allergy, and review-of-systems capture.
- **Safety Engine**: Real-time rule-based red flag detection that runs independently of generative AI.
- **AYUSH Clinical Workflow**: Dashavidha Pariksha and Ahara-Vihara assessment module.

### Layer 3: Data & Security Layer
- **Database**: Supabase PostgreSQL with normalized relational architecture (28 discrete tables; zero unstructured text blob storage).
- **Security**: Strict Row-Level Security (RLS) policies enforcing patient isolation and consented doctor access.
- **Audit Trails**: Immutable append-only audit logging recording all consent, access, AI inference, and verification actions.

### Layer 4: Intelligence & AI Layer
- **AI Abstraction**: Clean provider interface supporting `AI_PROVIDER=mock` (zero external dependencies) and `AI_PROVIDER=gemini` (Google Gemini 1.5/2.0).
- **Role of Generative AI**:
  - Voice transcription and natural language phrasing.
  - Entity extraction from free-form speech/text into strict Pydantic schemas.
  - OCR document understanding and table extraction.
  - Longitudinal synthesis and contradiction detection.
- **Hard Constraints**: AI never diagnoses, prescribes, or controls clinical branching unsupervised.

### Layer 5: Interoperability Layer
- **FHIR Adapter**: Maps verified clinical encounters into HL7 FHIR R4 JSON bundles (`Patient`, `Condition`, `Observation`, `MedicationStatement`, `AllergyIntolerance`, `DocumentReference`).
- **ABDM Adapter**: Mock-first implementation of Ayushman Bharat Digital Mission M1 (ABHA creation/auth), M2 (Consent management), and M3 (Health data exchange).

---

## 2. Deterministic Clinical Question Graph vs. LLM Natural Language Layer

```
┌────────────────────────────────────────────────────────┐
│        DETERMINISTIC CLINICAL QUESTION GRAPH           │
│   (Decides WHAT to ask, tracks clinical state, nodes)  │
└───────────────────────────┬────────────────────────────┘
                            │ Dispatches Target Question & Constraints
                            ▼
┌────────────────────────────────────────────────────────┐
│               LLM NATURAL LANGUAGE LAYER               │
│   - Rephrases into empathetic, multilingual questions   │
│   - Extracts structured clinical entities from answers │
└───────────────────────────┬────────────────────────────┘
                            │ Validated Structured Fact {source, confidence}
                            ▼
┌────────────────────────────────────────────────────────┐
│                 PYDANTIC VALIDATION                    │
│   (Rejects malformed output, enforces business rules)  │
└───────────────────────────┬────────────────────────────┘
                            │ Persists to DB
                            ▼
┌────────────────────────────────────────────────────────┐
│            DETERMINISTIC SAFETY RULE ENGINE            │
│   (Evaluates Red-Flags: Chest Pain + SOB = Urgent)     │
└────────────────────────────────────────────────────────┘
```

---

## 3. Privacy & Compliance Framework

> **Privacy Statement**: Designed with privacy-by-design principles and intended to align with applicable Indian data protection, ABDM consent, and healthcare security requirements. Production deployment requires formal security and compliance validation.

1. **No External Patient Identifiers as Primary Keys**: Internal IDs strictly follow `MK-000001` format. ABHA IDs and MRNs reside in `patient_identifiers`.
2. **Explicit Consent Lifecycle**: Patients grant granular consent per category (`CLINICAL_HISTORY`, `VOICE_PROCESSING`, `MEDICAL_DOCUMENTS`, `DOCTOR_SHARING`). Every consent event is recorded with version, timestamp, and revocation capability.
3. **No Patient Medical Data in URLs, Client Storage, or Unencrypted Logs**: All doctor queries require active session tokens and validated patient access grants.
