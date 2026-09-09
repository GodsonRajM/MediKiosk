-- ==============================================================================
-- MediKiosk Supabase Row Level Security (RLS) Policies
-- Smart India Hackathon 2026 — Problem Statement SIH26047
-- ==============================================================================

-- Enable RLS on all primary tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patient_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policy
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Service role has full access to profiles" 
ON profiles FOR ALL 
USING (auth.role() = 'service_role');

-- 2. Patient Identifiers Policy
CREATE POLICY "Patients view own identifiers" 
ON patient_identifiers FOR SELECT 
USING (auth.uid() = profile_id);

CREATE POLICY "Doctors view assigned patient identifiers" 
ON patient_identifiers FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM doctor_patient_relationships 
        WHERE doctor_id = auth.uid() 
          AND patient_id = patient_identifiers.profile_id
    )
);

-- 3. Doctor Identifiers Policy
CREATE POLICY "Anyone can view doctor listings for connection" 
ON doctor_identifiers FOR SELECT 
USING (true);

-- 4. Consents Policy
CREATE POLICY "Users can view own consent" 
ON consents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can record own consent" 
ON consents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Doctor Patient Relationships
CREATE POLICY "Patients view own doctor relationships" 
ON doctor_patient_relationships FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors view own patient relationships" 
ON doctor_patient_relationships FOR SELECT 
USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can create doctor relationships" 
ON doctor_patient_relationships FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

-- 6. Medical History Policy
CREATE POLICY "Patients manage own medical history" 
ON medical_history FOR ALL 
USING (auth.uid() = patient_id);

CREATE POLICY "Authorized doctors view patient medical history" 
ON medical_history FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM doctor_patient_relationships 
        WHERE doctor_id = auth.uid() 
          AND patient_id = medical_history.patient_id
    )
);

-- 7. Medical Documents Policy
CREATE POLICY "Patients manage own medical documents" 
ON medical_documents FOR ALL 
USING (auth.uid() = patient_id);

CREATE POLICY "Authorized doctors view patient medical documents" 
ON medical_documents FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM doctor_patient_relationships 
        WHERE doctor_id = auth.uid() 
          AND patient_id = medical_documents.patient_id
    )
);

-- 8. Medical Summaries Policy
CREATE POLICY "Patients view own summaries" 
ON medical_summaries FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Authorized doctors view and verify summaries" 
ON medical_summaries FOR ALL 
USING (
    doctor_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM doctor_patient_relationships 
        WHERE doctor_id = auth.uid() 
          AND patient_id = medical_summaries.patient_id
    )
);
