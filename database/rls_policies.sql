-- ==============================================================================
-- MediKiosk Row Level Security (RLS) Policies (Supabase Postgres)
-- Smart India Hackathon 2026 — Problem Statement SIH26047
-- ==============================================================================

-- Enable RLS on all clinical and demographic tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayush_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE red_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_exports ENABLE ROW LEVEL SECURITY;

-- Helper Function: Extract authenticated user ID
CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Helper Function: Check user role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role) RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users
        WHERE id = auth_user_id() AND role = required_role
    );
$$ LANGUAGE SQL STABLE;

-- Helper Function: Check active doctor-patient access
CREATE OR REPLACE FUNCTION doctor_has_patient_access(target_patient_id UUID) RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM patient_access
        WHERE patient_id = target_patient_id
          AND doctor_id = auth_user_id()
          AND is_active = TRUE
          AND expires_at > NOW()
    );
$$ LANGUAGE SQL STABLE;

-- ------------------------------------------------------------------------------
-- 1. PATIENTS POLICIES
-- ------------------------------------------------------------------------------

-- Patients can view their own record
CREATE POLICY patient_view_own ON patients
    FOR SELECT
    USING (user_id = auth_user_id());

-- Doctors with active authorization can view patient profile
CREATE POLICY doctor_view_consented_patient ON patients
    FOR SELECT
    USING (user_has_role('DOCTOR') AND doctor_has_patient_access(id));

-- Triage staff can view patients with active alerts
CREATE POLICY triage_view_patients ON patients
    FOR SELECT
    USING (user_has_role('TRIAGE_STAFF'));

-- Admin full view
CREATE POLICY admin_view_all_patients ON patients
    FOR ALL
    USING (user_has_role('ADMIN'));

-- ------------------------------------------------------------------------------
-- 2. CLINICAL SESSIONS & CONSENTS POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY patient_manage_own_sessions ON clinical_sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = clinical_sessions.patient_id
              AND patients.user_id = auth_user_id()
        )
    );

CREATE POLICY doctor_view_sessions ON clinical_sessions
    FOR SELECT
    USING (user_has_role('DOCTOR') AND doctor_has_patient_access(patient_id));

CREATE POLICY patient_manage_consents ON consents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = consents.patient_id
              AND patients.user_id = auth_user_id()
        )
    );

CREATE POLICY doctor_view_consents ON consents
    FOR SELECT
    USING (user_has_role('DOCTOR') AND doctor_has_patient_access(patient_id));

-- ------------------------------------------------------------------------------
-- 3. MEDICAL FACTS & TIMELINE POLICIES
-- ------------------------------------------------------------------------------

-- Medical conditions
CREATE POLICY patient_view_conditions ON medical_conditions
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = medical_conditions.patient_id AND patients.user_id = auth_user_id()));

CREATE POLICY doctor_view_conditions ON medical_conditions
    FOR ALL
    USING (user_has_role('DOCTOR') AND doctor_has_patient_access(patient_id));

-- Medications
CREATE POLICY patient_view_medications ON medications
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = medications.patient_id AND patients.user_id = auth_user_id()));

CREATE POLICY doctor_view_medications ON medications
    FOR ALL
    USING (user_has_role('DOCTOR') AND doctor_has_patient_access(patient_id));

-- Allergies
CREATE POLICY patient_view_allergies ON allergies
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = allergies.patient_id AND patients.user_id = auth_user_id()));

CREATE POLICY doctor_view_allergies ON allergies
    FOR ALL
    USING (user_has_role('DOCTOR') AND doctor_has_patient_access(patient_id));

-- Medical timeline
CREATE POLICY patient_view_timeline ON medical_timeline
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = medical_timeline.patient_id AND patients.user_id = auth_user_id()));

CREATE POLICY doctor_view_timeline ON medical_timeline
    FOR SELECT
    USING (user_has_role('DOCTOR') AND doctor_has_patient_access(patient_id));

-- ------------------------------------------------------------------------------
-- 4. AYUSH ASSESSMENTS POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY patient_manage_ayush ON ayush_assessments
    FOR ALL
    USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = ayush_assessments.patient_id AND patients.user_id = auth_user_id()));

CREATE POLICY doctor_manage_ayush ON ayush_assessments
    FOR ALL
    USING (user_has_role('DOCTOR') AND doctor_has_patient_access(patient_id));

-- ------------------------------------------------------------------------------
-- 5. RED FLAGS & TRIAGE ALERTS POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY triage_manage_alerts ON triage_alerts
    FOR ALL
    USING (user_has_role('TRIAGE_STAFF') OR user_has_role('DOCTOR') OR user_has_role('ADMIN'));

CREATE POLICY patient_view_red_flags ON red_flags
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = red_flags.patient_id AND patients.user_id = auth_user_id()));

-- ------------------------------------------------------------------------------
-- 6. DOCTOR REVIEWS & AUDIT POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY doctor_create_reviews ON doctor_reviews
    FOR ALL
    USING (user_has_role('DOCTOR') AND doctor_id = auth_user_id());

CREATE POLICY patient_view_reviews ON doctor_reviews
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = doctor_reviews.patient_id AND patients.user_id = auth_user_id()));

CREATE POLICY audit_append_only ON audit_logs
    FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY admin_view_audit ON audit_logs
    FOR SELECT
    USING (user_has_role('ADMIN'));
