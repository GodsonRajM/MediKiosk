-- ==============================================================================
-- MediKiosk Normalized Database Schema (PostgreSQL / Supabase)
-- Smart India Hackathon 2026 — Problem Statement SIH26047
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'PATIENT',
    'DOCTOR',
    'TRIAGE_STAFF',
    'ADMIN'
);

CREATE TYPE identifier_type AS ENUM (
    'INTERNAL_MEDIKIOSK_ID',
    'ABHA_NUMBER',
    'ABHA_ADDRESS',
    'HOSPITAL_PATIENT_ID',
    'AADHAAR_REFERENCE'
);

CREATE TYPE clinical_data_source AS ENUM (
    'PATIENT_INTERVIEW',
    'DOCTOR_INPUT',
    'OCR',
    'DOCUMENT_AI',
    'PREVIOUS_RECORD',
    'AYUSH_INTERVIEW',
    'SYSTEM_RULE'
);

CREATE TYPE consent_status AS ENUM (
    'GRANTED',
    'DENIED',
    'REVOKED'
);

CREATE TYPE consent_category AS ENUM (
    'CLINICAL_HISTORY',
    'VOICE_PROCESSING',
    'MEDICAL_DOCUMENTS',
    'DOCTOR_SHARING',
    'HIS_SHARING',
    'ABDM_SHARING',
    'RESEARCH_ANALYTICS'
);

CREATE TYPE session_status AS ENUM (
    'INITIATED',
    'CONSENT_PENDING',
    'IN_PROGRESS',
    'AWAITING_DOCUMENTS',
    'PROCESSING_AI',
    'READY_FOR_REVIEW',
    'DOCTOR_REVIEWING',
    'COMPLETED',
    'ABANDONED'
);

CREATE TYPE red_flag_severity AS ENUM (
    'LOW',
    'MODERATE',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE triage_status AS ENUM (
    'ACTIVE',
    'ACKNOWLEDGED',
    'UNDER_REVIEW',
    'ESCALATED',
    'CLOSED'
);

CREATE TYPE verification_action AS ENUM (
    'CONFIRMED',
    'EDITED',
    'REJECTED',
    'ADDED'
);

CREATE TYPE document_type AS ENUM (
    'PRESCRIPTION',
    'LAB_REPORT',
    'DISCHARGE_SUMMARY',
    'IMAGING_REPORT',
    'OTHER'
);

-- ------------------------------------------------------------------------------
-- 1. USERS & PROFILES
-- ------------------------------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(32) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'PATIENT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    medikiosk_id VARCHAR(32) UNIQUE NOT NULL, -- Format: MK-000001
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    age INT,
    gender VARCHAR(32) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(32),
    preferred_language VARCHAR(32) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patient_identifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    identifier_type identifier_type NOT NULL,
    identifier_value VARCHAR(255) NOT NULL,
    issuing_system VARCHAR(128) NOT NULL DEFAULT 'MediKiosk',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patient_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encounter_id UUID,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------------------------
-- 2. CLINICAL SESSIONS & CONSENT
-- ------------------------------------------------------------------------------

CREATE TABLE clinical_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_status session_status NOT NULL DEFAULT 'INITIATED',
    mode VARCHAR(32) NOT NULL DEFAULT 'STANDARD', -- 'STANDARD' or 'AYUSH'
    current_step VARCHAR(64) NOT NULL DEFAULT 'CONSENT',
    selected_language VARCHAR(32) NOT NULL DEFAULT 'en',
    chief_complaint_text TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    consent_type consent_category NOT NULL,
    status consent_status NOT NULL DEFAULT 'GRANTED',
    version VARCHAR(32) NOT NULL DEFAULT '1.0',
    language VARCHAR(32) NOT NULL DEFAULT 'en',
    audio_confirmation_recorded BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. INTERVIEWS, QUESTIONS & RAW ANSWERS
-- ------------------------------------------------------------------------------

CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    current_node_id VARCHAR(64) NOT NULL DEFAULT 'CHIEF_COMPLAINT',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE questions (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'CHIEF_COMPLAINT_ONSET'
    section VARCHAR(64) NOT NULL,
    question_text_en TEXT NOT NULL,
    question_text_ta TEXT,
    question_text_hi TEXT,
    input_type VARCHAR(32) NOT NULL DEFAULT 'text', -- 'text', 'choice', 'voice', 'scale'
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    clinical_category VARCHAR(64) NOT NULL
);

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES questions(id),
    raw_answer_text TEXT NOT NULL,
    audio_transcript TEXT,
    input_method VARCHAR(32) NOT NULL DEFAULT 'touch', -- 'voice', 'touch', 'keyboard'
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. STRUCTURED CLINICAL FACTS (Evidence-linked with Source & Confidence)
-- ------------------------------------------------------------------------------

CREATE TABLE clinical_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    entity_type VARCHAR(64) NOT NULL, -- 'SYMPTOM', 'CONDITION', 'MEDICATION', 'ALLERGY'
    entity_name VARCHAR(255) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    source clinical_data_source NOT NULL DEFAULT 'PATIENT_INTERVIEW',
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE medical_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    condition_name VARCHAR(255) NOT NULL,
    icd10_code VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'HISTORICAL', 'SUSPECTED'
    diagnosed_year INT,
    source clinical_data_source NOT NULL DEFAULT 'PATIENT_INTERVIEW',
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE surgical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    procedure_name VARCHAR(255) NOT NULL,
    indication TEXT,
    approximate_date DATE,
    hospital_name VARCHAR(255),
    outcome VARCHAR(64),
    source clinical_data_source NOT NULL DEFAULT 'PATIENT_INTERVIEW',
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    drug_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(64),
    frequency VARCHAR(64),
    route VARCHAR(32) DEFAULT 'Oral',
    duration VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'CURRENT', -- 'CURRENT', 'DISCONTINUED'
    source clinical_data_source NOT NULL DEFAULT 'PATIENT_INTERVIEW',
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    allergen VARCHAR(255) NOT NULL,
    reaction_nature TEXT,
    severity VARCHAR(32) NOT NULL DEFAULT 'MODERATE', -- 'MILD', 'MODERATE', 'SEVERE'
    source clinical_data_source NOT NULL DEFAULT 'PATIENT_INTERVIEW',
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    contradiction_flag BOOLEAN NOT NULL DEFAULT FALSE,
    contradiction_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE family_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    relation VARCHAR(64) NOT NULL,
    condition_name VARCHAR(255) NOT NULL,
    source clinical_data_source NOT NULL DEFAULT 'PATIENT_INTERVIEW',
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE personal_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    diet_type VARCHAR(64),
    sleep_pattern VARCHAR(64),
    physical_activity VARCHAR(64),
    smoking_status VARCHAR(64),
    alcohol_status VARCHAR(64),
    source clinical_data_source NOT NULL DEFAULT 'PATIENT_INTERVIEW',
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    document_id UUID,
    test_name VARCHAR(255) NOT NULL,
    result_value VARCHAR(128) NOT NULL,
    unit VARCHAR(64),
    reference_range VARCHAR(128),
    is_abnormal BOOLEAN NOT NULL DEFAULT FALSE,
    test_date DATE,
    source clinical_data_source NOT NULL DEFAULT 'OCR',
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. DOCUMENTS & OCR EXTRACTION
-- ------------------------------------------------------------------------------

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    document_type document_type NOT NULL DEFAULT 'PRESCRIPTION',
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    ocr_raw_text TEXT,
    ocr_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'FAILED'
    has_handwriting BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    entity_type VARCHAR(64) NOT NULL,
    entity_key VARCHAR(128) NOT NULL,
    entity_value TEXT NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 0.850,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. MEDICAL TIMELINE (Chronological unified events)
-- ------------------------------------------------------------------------------

CREATE TABLE medical_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(64) NOT NULL, -- 'DIAGNOSIS', 'MEDICATION', 'LAB_RESULT', 'SURGERY', 'AYUSH_RECORD'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source clinical_data_source NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. AYUSH ASSESSMENTS (Structured Dashavidha Pariksha + Ahara-Vihara)
-- ------------------------------------------------------------------------------

CREATE TABLE ayush_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    -- Dashavidha Pariksha Parameters (Structured)
    prakriti JSONB NOT NULL DEFAULT '{"primary": "Vata-Pitta", "vata_score": 0, "pitta_score": 0, "kapha_score": 0}'::jsonb,
    vikriti JSONB NOT NULL DEFAULT '{"imbalance": "Pitta", "dosha_status": "Aggravated"}'::jsonb,
    sara VARCHAR(64) DEFAULT 'Madhyama', -- Tissue excellence: Pravara, Madhyama, Avara
    samhanana VARCHAR(64) DEFAULT 'Madhyama', -- Compactness/Build
    pramana JSONB NOT NULL DEFAULT '{"height_cm": null, "weight_kg": null, "assessment": "Madhyama"}'::jsonb,
    satmya VARCHAR(64) DEFAULT 'Madhyama', -- Habituation/Adaptability
    sattva VARCHAR(64) DEFAULT 'Madhyama', -- Mental endurance: Pravara, Madhyama, Avara
    ahara_shakti JSONB NOT NULL DEFAULT '{"abhyavaharana_shakti": "Madhyama", "jarana_shakti": "Madhyama"}'::jsonb,
    vyayama_shakti VARCHAR(64) DEFAULT 'Madhyama', -- Physical work capacity
    vaya VARCHAR(64) DEFAULT 'Madhyama', -- Age group: Bala, Madhyama, Vriddha
    -- Ahara-Vihara Assessment
    ahara_vihara JSONB NOT NULL DEFAULT '{
        "meal_timing": "Regular",
        "appetite": "Moderate",
        "food_preferences": "Warm, Cooked",
        "water_intake_liters": 2.5,
        "daily_routine": "Regular",
        "sleep_duration_hours": 7,
        "sleep_quality": "Sound",
        "physical_exercise": "Brisk walking 30 mins"
    }'::jsonb,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    doctor_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. SAFETY ENGINE: RED FLAGS & TRIAGE ALERTS
-- ------------------------------------------------------------------------------

CREATE TABLE red_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    rule_id VARCHAR(64) NOT NULL,
    severity red_flag_severity NOT NULL DEFAULT 'HIGH',
    title VARCHAR(255) NOT NULL,
    clinical_recommendation TEXT NOT NULL DEFAULT 'Priority clinical assessment recommended',
    triggered_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE triage_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    red_flag_id UUID NOT NULL REFERENCES red_flags(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    status triage_status NOT NULL DEFAULT 'ACTIVE',
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. LONGITUDINAL AI CASE SUMMARIES
-- ------------------------------------------------------------------------------

CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    chief_complaint_summary TEXT NOT NULL,
    hpi_summary TEXT NOT NULL,
    past_history_summary TEXT NOT NULL,
    medications_summary TEXT NOT NULL,
    allergies_summary TEXT NOT NULL,
    investigations_summary TEXT NOT NULL,
    ayush_summary TEXT,
    contradictions_summary TEXT,
    red_flags_summary TEXT,
    evidence_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE summary_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
    section_name VARCHAR(64) NOT NULL,
    section_content TEXT NOT NULL,
    evidence_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. DOCTOR REVIEWS & FIELD-LEVEL VERIFICATIONS
-- ------------------------------------------------------------------------------

CREATE TABLE doctor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_verifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    clinical_notes TEXT,
    provisional_plan TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_signed_off BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. AUDIT LOGS & IMMUTABLE TRAILS
-- ------------------------------------------------------------------------------

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    session_id UUID REFERENCES clinical_sessions(id) ON DELETE SET NULL,
    action_type VARCHAR(64) NOT NULL, -- 'CONSENT_GRANTED', 'ACCESS_DOCTOR', 'DATA_EXTRACTED', 'VERIFICATION'
    resource_accessed VARCHAR(128) NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. FHIR & ABDM EXPORTS
-- ------------------------------------------------------------------------------

CREATE TABLE fhir_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    doctor_review_id UUID REFERENCES doctor_reviews(id) ON DELETE SET NULL,
    bundle_json JSONB NOT NULL,
    fhir_version VARCHAR(32) NOT NULL DEFAULT 'R4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ------------------------------------------------------------------------------

CREATE INDEX idx_patients_medikiosk_id ON patients(medikiosk_id);
CREATE INDEX idx_patient_identifiers_patient_id ON patient_identifiers(patient_id);
CREATE INDEX idx_clinical_sessions_patient_id ON clinical_sessions(patient_id);
CREATE INDEX idx_clinical_sessions_status ON clinical_sessions(session_status);
CREATE INDEX idx_answers_interview_id ON answers(interview_id);
CREATE INDEX idx_clinical_entities_session_id ON clinical_entities(session_id);
CREATE INDEX idx_medications_patient_id ON medications(patient_id);
CREATE INDEX idx_allergies_patient_id ON allergies(patient_id);
CREATE INDEX idx_timeline_patient_id_date ON medical_timeline(patient_id, event_date DESC);
CREATE INDEX idx_red_flags_session_id ON red_flags(session_id);
CREATE INDEX idx_triage_alerts_status ON triage_alerts(status);
CREATE INDEX idx_audit_logs_patient_id ON audit_logs(patient_id);
