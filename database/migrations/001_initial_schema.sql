-- ============================================================
-- MediKiosk (SIH26047) Initial Database Schema Migration
-- Target: PostgreSQL / Supabase
-- Version: 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_user_id);

-- ============================================================
-- 2. PATIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    date_of_birth DATE,
    age INTEGER CHECK (age >= 0 AND age <= 130),
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'undisclosed')),
    phone TEXT,
    abha_id TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_abha ON patients(abha_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- ============================================================
-- 3. PATIENT ACCESS (Authorization & Access Grants)
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('encounter', 'consent', 'requested', 'emergency')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked', 'expired', 'denied')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_access_doctor ON patient_access(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_patient_access_patient ON patient_access(patient_id, status);

-- ============================================================
-- 4. SESSIONS (Kiosk & Web Intake Sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    session_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
    device_type TEXT NOT NULL DEFAULT 'kiosk_touch' CHECK (device_type IN ('kiosk_touch', 'tablet', 'desktop', 'mobile')),
    language TEXT NOT NULL DEFAULT 'en',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);

-- ============================================================
-- 5. CONSENTS (Granular Consent-First Framework)
-- ============================================================
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'clinical_history', 'voice_processing', 'document_processing',
        'doctor_sharing', 'abdm_exchange', 'research'
    )),
    status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'denied', 'revoked')),
    language TEXT NOT NULL DEFAULT 'en',
    consent_version TEXT NOT NULL DEFAULT 'v1.0',
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_patient ON consents(patient_id, consent_type);

-- ============================================================
-- 6. INTERVIEWS (Adaptive Clinical Intake)
-- ============================================================
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    chief_complaint TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('started', 'in_progress', 'completed', 'cancelled')),
    current_section TEXT NOT NULL DEFAULT 'chief_complaint',
    pathway TEXT, -- e.g., chest_pain, fever, cough
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_patient ON interviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- ============================================================
-- 7. QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_code TEXT NOT NULL,
    section TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('single_choice', 'multi_choice', 'scale', 'text', 'voice')),
    options JSONB DEFAULT '[]'::jsonb,
    sequence INTEGER NOT NULL,
    required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_interview ON questions(interview_id, sequence);

-- ============================================================
-- 8. ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    raw_answer TEXT NOT NULL,
    normalized_answer TEXT,
    input_method TEXT NOT NULL CHECK (input_method IN ('touch', 'voice', 'text')),
    language TEXT NOT NULL DEFAULT 'en',
    confidence NUMERIC(4, 3) DEFAULT 1.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answers_interview ON answers(interview_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- ============================================================
-- 9. CLINICAL ENTITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS clinical_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'symptom', 'duration', 'diagnosis', 'medication',
        'allergy', 'investigation', 'severity', 'ayush_prakriti',
        'ayush_agni', 'ayush_koshtha', 'risk_factor'
    )),
    entity_name TEXT NOT NULL,
    value TEXT NOT NULL,
    normalized_value TEXT,
    source TEXT NOT NULL DEFAULT 'patient_interview',
    confidence NUMERIC(4, 3) DEFAULT 1.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_entities_interview ON clinical_entities(interview_id);
CREATE INDEX IF NOT EXISTS idx_clinical_entities_type ON clinical_entities(entity_type);

-- ============================================================
-- 10. DOCUMENTS (Private Storage References)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'prescription', 'lab_report', 'discharge_summary', 'radiology', 'other'
    )),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    ocr_status TEXT NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'failed', 'needs_review')),
    document_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_patient ON documents(patient_id);

-- ============================================================
-- 11. DOCUMENT ENTITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS document_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('medication', 'lab_test', 'diagnosis', 'doctor_note', 'vital')),
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT,
    reference_range TEXT,
    confidence NUMERIC(4, 3) DEFAULT 1.000,
    source_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_entities_document ON document_entities(document_id);

-- ============================================================
-- 12. MEDICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    dose TEXT NOT NULL,
    frequency TEXT NOT NULL,
    route TEXT DEFAULT 'oral',
    start_date DATE,
    end_date DATE,
    source TEXT NOT NULL DEFAULT 'self_reported', -- self_reported | document_ocr
    confidence NUMERIC(4, 3) DEFAULT 1.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);

-- ============================================================
-- 13. INVESTIGATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    test_name TEXT NOT NULL,
    result TEXT NOT NULL,
    unit TEXT,
    reference_range TEXT,
    abnormal BOOLEAN NOT NULL DEFAULT false,
    test_date DATE,
    confidence NUMERIC(4, 3) DEFAULT 1.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investigations_patient ON investigations(patient_id);

-- ============================================================
-- 14. MEDICAL TIMELINE
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('symptom_onset', 'lab_test', 'prescription', 'past_diagnosis', 'procedure')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('interview', 'document', 'external_record')),
    source_id UUID,
    confidence NUMERIC(4, 3) DEFAULT 1.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_patient_date ON medical_timeline(patient_id, event_date DESC);

-- ============================================================
-- 15. RED FLAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS red_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    rule_code TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    message TEXT NOT NULL,
    source_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_red_flags_patient ON red_flags(patient_id, status);

-- ============================================================
-- 16. SUMMARIES (Clinical Pre-Consultation Summaries)
-- ============================================================
CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    content JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'verified', 'rejected')),
    ai_generated BOOLEAN NOT NULL DEFAULT true,
    doctor_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_summaries_patient ON summaries(patient_id);

-- ============================================================
-- 17. DOCTOR REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('confirm', 'edit', 'reject')),
    edited_content JSONB,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_summary ON doctor_reviews(summary_id);

-- ============================================================
-- 18. AUDIT LOGS (Privacy-Preserving Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_logs(patient_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE red_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check doctor active access to patient
CREATE OR REPLACE FUNCTION has_doctor_patient_access(p_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM patient_access pa
        JOIN users u ON u.id = pa.doctor_id
        WHERE u.auth_user_id = auth.uid()
          AND pa.patient_id = p_id
          AND pa.status = 'approved'
          AND (pa.expires_at IS NULL OR pa.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Patients table policies:
-- Patients can read their own record; Doctors can read if approved access exists; Admins full access
CREATE POLICY patients_admin_all ON patients FOR ALL USING (is_admin());
CREATE POLICY patients_read_doctor ON patients FOR SELECT USING (has_doctor_patient_access(id));

-- Summaries policies:
CREATE POLICY summaries_admin_all ON summaries FOR ALL USING (is_admin());
CREATE POLICY summaries_read_doctor ON summaries FOR SELECT USING (has_doctor_patient_access(patient_id));
CREATE POLICY summaries_update_doctor ON summaries FOR UPDATE USING (has_doctor_patient_access(patient_id));

-- Medical timeline policies:
CREATE POLICY timeline_read_doctor ON medical_timeline FOR SELECT USING (has_doctor_patient_access(patient_id));

-- Red flags policies:
CREATE POLICY red_flags_read_doctor ON red_flags FOR SELECT USING (has_doctor_patient_access(patient_id));

-- Documents policies:
CREATE POLICY documents_read_doctor ON documents FOR SELECT USING (has_doctor_patient_access(patient_id));

-- Audit logs policies:
CREATE POLICY audit_insert_all ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY audit_select_admin ON audit_logs FOR SELECT USING (is_admin());
