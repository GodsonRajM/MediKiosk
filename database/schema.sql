-- ==============================================================================
-- MediKiosk Database Schema
-- Smart India Hackathon 2026 — Problem Statement SIH26047 (Ministry of Ayush)
-- "Pre-consultation, AI-assisted patient case-taking system"
--
-- NOTE: ZERO dummy/mock data. Pure DDL schema and atomic identifier sequences.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Atomic Identifier Sequences (MK-000001 / DK-000001)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS id_sequences (
    prefix VARCHAR(10) PRIMARY KEY,
    last_val BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize sequence rows if not existing
INSERT INTO id_sequences (prefix, last_val) 
VALUES ('MK', 0), ('DK', 0)
ON CONFLICT (prefix) DO NOTHING;

-- Function to atomically generate next formatted ID
CREATE OR REPLACE FUNCTION get_next_formatted_id(p_prefix VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    next_num BIGINT;
    formatted_id VARCHAR;
BEGIN
    UPDATE id_sequences
    SET last_val = last_val + 1,
        updated_at = NOW()
    WHERE prefix = p_prefix
    RETURNING last_val INTO next_num;

    formatted_id := p_prefix || '-' || LPAD(next_num::TEXT, 6, '0');
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. User Profiles (Extends auth.users or standalone users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'triage', 'admin')),
    full_name VARCHAR(255) NOT NULL,
    age INT,
    phone VARCHAR(50),
    address TEXT,
    blood_group VARCHAR(10),
    emergency_contact VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ------------------------------------------------------------------------------
-- 3. Patient Identifiers (MK-000001 & ABHA mapping)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_identifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    medikiosk_id VARCHAR(20) UNIQUE NOT NULL,
    abha_number VARCHAR(50),
    abha_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_identifiers_medikiosk_id ON patient_identifiers(medikiosk_id);
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_profile_id ON patient_identifiers(profile_id);

-- ------------------------------------------------------------------------------
-- 4. Doctor Identifiers (DK-000001)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctor_identifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id VARCHAR(20) UNIQUE NOT NULL,
    specialization VARCHAR(100) DEFAULT 'General Medicine',
    department VARCHAR(100) DEFAULT 'OPD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_identifiers_doctor_id ON doctor_identifiers(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_identifiers_profile_id ON doctor_identifiers(profile_id);

-- ------------------------------------------------------------------------------
-- 5. Mandatory Consents
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL DEFAULT 'clinical_intake_and_privacy',
    consent_status VARCHAR(20) NOT NULL CHECK (consent_status IN ('granted', 'revoked')),
    consent_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    consent_text TEXT NOT NULL,
    ip_address VARCHAR(50),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_user_id ON consents(user_id);

-- ------------------------------------------------------------------------------
-- 6. Doctor-Patient Connection Relationships
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctor_patient_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dpr_patient ON doctor_patient_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_dpr_doctor ON doctor_patient_relationships(doctor_id);

-- ------------------------------------------------------------------------------
-- 7. Clinical Intake Sessions & Interviews
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_status VARCHAR(30) NOT NULL DEFAULT 'in_progress' CHECK (session_status IN ('in_progress', 'completed', 'aborted')),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_clinical_sessions_patient ON clinical_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_sessions_doctor ON clinical_sessions(doctor_id);

CREATE TABLE IF NOT EXISTS clinical_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_node_id VARCHAR(100),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES clinical_interviews(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    section VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    structured_data JSONB DEFAULT '{}'::jsonb,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_answers_interview ON clinical_answers(interview_id);

CREATE TABLE IF NOT EXISTS clinical_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    confidence NUMERIC(4,3) DEFAULT 1.0,
    source VARCHAR(50) DEFAULT 'patient_answer',
    doctor_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_entities_session ON clinical_entities(session_id);

-- ------------------------------------------------------------------------------
-- 8. Patient Medical History (Conditions, Surgeries, Medications, Allergies)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('condition', 'surgery', 'medication', 'allergy', 'family', 'social', 'investigation')),
    title VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    date_recorded DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON medical_history(patient_id);

-- ------------------------------------------------------------------------------
-- 9. Medical Documents & OCR Extracted Entities
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    ocr_status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
    ocr_text TEXT,
    ocr_confidence NUMERIC(4,3) DEFAULT 0.95,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_docs_patient ON medical_documents(patient_id);

CREATE TABLE IF NOT EXISTS document_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES medical_documents(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_value TEXT NOT NULL,
    confidence NUMERIC(4,3) DEFAULT 0.95,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. Unified Medical Timeline
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50) NOT NULL CHECK (source IN ('history', 'document', 'interview', 'summary')),
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_patient_date ON medical_timeline(patient_id, event_date DESC);

-- ------------------------------------------------------------------------------
-- 11. AI Medical Summaries & Doctor Reviews
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES clinical_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    red_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_summaries_patient ON medical_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_summaries_doctor ON medical_summaries(doctor_id);

CREATE TABLE IF NOT EXISTS doctor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id UUID NOT NULL REFERENCES medical_summaries(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'reviewed' CHECK (status IN ('reviewed', 'amended')),
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. Security Audit Logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
