-- ==============================================================================
-- MediKiosk Synthetic Demo Seed Data
-- Smart India Hackathon 2026 — Problem Statement SIH26047
-- ==============================================================================

-- Clean previous seed entries if any
TRUNCATE TABLE audit_logs, fhir_exports, doctor_reviews, summary_sections, summaries,
               triage_alerts, red_flags, ayush_assessments, medical_timeline,
               document_entities, documents, investigations, personal_history,
               family_history, allergies, medications, surgical_history,
               medical_conditions, clinical_entities, answers, questions,
               interviews, consents, clinical_sessions, patient_access,
               patient_identifiers, patients, users CASCADE;

-- ------------------------------------------------------------------------------
-- 1. USERS (Patient, Doctor, Triage, Admin)
-- Password hash corresponds to 'patient123', 'doctor123', etc. (argon2 / bcrypt demo string)
-- ------------------------------------------------------------------------------

INSERT INTO users (id, email, phone, password_hash, role, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'patient@medikiosk.local', '+919876543210', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'PATIENT', TRUE),
('00000000-0000-0000-0000-000000000002', 'doctor@medikiosk.local', '+919876543211', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'DOCTOR', TRUE),
('00000000-0000-0000-0000-000000000003', 'triage@medikiosk.local', '+919876543212', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'TRIAGE_STAFF', TRUE),
('00000000-0000-0000-0000-000000000004', 'admin@medikiosk.local', '+919876543213', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ADMIN', TRUE);

-- ------------------------------------------------------------------------------
-- 2. DEMO PATIENT (MK-000001, 52M, Tamil)
-- ------------------------------------------------------------------------------

INSERT INTO patients (id, user_id, medikiosk_id, full_name, date_of_birth, age, gender, phone, email, emergency_contact_name, emergency_contact_phone, preferred_language) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'MK-000001', 'Sundaram Ramaswamy', '1974-05-12', 52, 'Male', '+919876543210', 'sundaram.r@demo.local', 'Meenakshi Ramaswamy', '+919876543299', 'ta');

-- Identifiers: MediKiosk ID, ABHA Number, Hospital MRN (Never raw Aadhaar as primary key)
INSERT INTO patient_identifiers (patient_id, identifier_type, identifier_value, issuing_system, verified) VALUES
('11111111-1111-1111-1111-111111111111', 'INTERNAL_MEDIKIOSK_ID', 'MK-000001', 'MediKiosk System', TRUE),
('11111111-1111-1111-1111-111111111111', 'ABHA_NUMBER', '91-4521-8890-1234', 'ABDM Sandbox', TRUE),
('11111111-1111-1111-1111-111111111111', 'ABHA_ADDRESS', 'sundaram.ramaswamy@abdm', 'ABDM Sandbox', TRUE),
('11111111-1111-1111-1111-111111111111', 'HOSPITAL_PATIENT_ID', 'GMC-OPD-9042', 'Govt Medical College Hospital', TRUE);

-- Active Doctor-Patient Encounter Access
INSERT INTO patient_access (patient_id, doctor_id, expires_at, is_active) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', NOW() + INTERVAL '24 hours', TRUE);

-- ------------------------------------------------------------------------------
-- 3. HISTORICAL CLINICAL FACTS (Pre-existing Baseline)
-- ------------------------------------------------------------------------------

-- Past Conditions
INSERT INTO medical_conditions (patient_id, condition_name, icd10_code, status, diagnosed_year, source, confidence, doctor_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'Type 2 Diabetes Mellitus', 'E11.9', 'ACTIVE', 2018, 'PREVIOUS_RECORD', 0.98, TRUE),
('11111111-1111-1111-1111-111111111111', 'Essential Hypertension', 'I10', 'ACTIVE', 2020, 'PREVIOUS_RECORD', 0.98, TRUE);

-- Past Medications
INSERT INTO medications (patient_id, drug_name, dosage, frequency, route, duration, status, source, confidence, doctor_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'Metformin', '500 mg', 'Twice daily', 'Oral', '6 years', 'CURRENT', 'PREVIOUS_RECORD', 0.96, TRUE),
('11111111-1111-1111-1111-111111111111', 'Amlodipine', '5 mg', 'Once daily', 'Oral', '4 years', 'CURRENT', 'PREVIOUS_RECORD', 0.96, TRUE);

-- Documented Allergy (Penicillin - for surfacing contradiction demo)
INSERT INTO allergies (patient_id, allergen, reaction_nature, severity, source, confidence, doctor_verified, contradiction_flag, contradiction_notes) VALUES
('11111111-1111-1111-1111-111111111111', 'Penicillin', 'Urticaria and facial rash', 'MODERATE', 'PREVIOUS_RECORD', 0.95, TRUE, TRUE, 'Hospital records (2019) note Penicillin hypersensitivity; patient stated "no allergies" during kiosk intake. Doctor verification required.');

-- Past Investigation (HbA1c 8.2%)
INSERT INTO investigations (patient_id, test_name, result_value, unit, reference_range, is_abnormal, test_date, source, confidence, doctor_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'HbA1c (Glycated Hemoglobin)', '8.2', '%', '< 5.7', TRUE, '2026-06-15', 'PREVIOUS_RECORD', 0.99, TRUE),
('11111111-1111-1111-1111-111111111111', 'Serum Creatinine', '1.0', 'mg/dL', '0.7 - 1.3', FALSE, '2026-06-15', 'PREVIOUS_RECORD', 0.99, TRUE);

-- ------------------------------------------------------------------------------
-- 4. ACTIVE CLINICAL SESSION (Demo Scenario SIH26047)
-- ------------------------------------------------------------------------------

INSERT INTO clinical_sessions (id, patient_id, session_status, mode, current_step, selected_language, chief_complaint_text) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'READY_FOR_REVIEW', 'AYUSH', 'SUMMARY', 'ta', 'Retrosternal chest tightness and breathlessness on exertion for past 2 days');

-- Consents Granted
INSERT INTO consents (patient_id, session_id, consent_type, status, version, language, audio_confirmation_recorded) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'CLINICAL_HISTORY', 'GRANTED', '1.0', 'ta', TRUE),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'VOICE_PROCESSING', 'GRANTED', '1.0', 'ta', TRUE),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'MEDICAL_DOCUMENTS', 'GRANTED', '1.0', 'ta', TRUE),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'DOCTOR_SHARING', 'GRANTED', '1.0', 'ta', TRUE);

-- Red Flag Triggered (Chest Pain + Breathlessness)
INSERT INTO red_flags (id, session_id, patient_id, rule_id, severity, title, clinical_recommendation, triggered_criteria, is_active) VALUES
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'RULE_CHEST_PAIN_EXERTIONAL_SOB', 'CRITICAL', 'Exertional Retrosternal Chest Pain with Dyspnea', 'Priority clinical assessment recommended. Immediate ECG and physician evaluation advised.', '["chest_pain_location: retrosternal", "duration: 2 days", "exertional: true", "associated_symptom: breathlessness"]'::jsonb, TRUE);

-- Triage Alert Dispatched
INSERT INTO triage_alerts (id, red_flag_id, patient_id, status, action_taken) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'ACTIVE', 'Alert dispatched to Triage Console. Patient waiting in Bay 2.');

-- AYUSH Assessment (Dashavidha Pariksha + Ahara-Vihara)
INSERT INTO ayush_assessments (id, patient_id, session_id, prakriti, vikriti, sara, samhanana, pramana, satmya, sattva, ahara_shakti, vyayama_shakti, vaya, ahara_vihara, doctor_verified) VALUES
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
 '{"primary": "Pitta-Kapha", "vata_score": 25, "pitta_score": 45, "kapha_score": 30}'::jsonb,
 '{"imbalance": "Vata-Pitta", "dosha_status": "Prana Vata and Sadhaka Pitta disturbance indicated by chest heaviness"}'::jsonb,
 'Madhyama', 'Madhyama',
 '{"height_cm": 168, "weight_kg": 74, "bmi": 26.2, "assessment": "Madhyama"}'::jsonb,
 'Madhyama (Habituated to South Indian vegetarian diet with rice and curd)',
 'Madhyama',
 '{"abhyavaharana_shakti": "Madhyama", "jarana_shakti": "Avara (Sluggish digestion after heavy meals)"}'::jsonb,
 'Avara (Easily fatigued upon climbing stairs recently)',
 'Madhyama (52 years, adult stage)',
 '{
    "meal_timing": "Irregular due to shop hours",
    "appetite": "Moderate with mild post-prandial heaviness",
    "food_preferences": "Pungent, warm, cooked vegetarian food",
    "water_intake_liters": 2.0,
    "daily_routine": "Wakes at 6:30 AM, sleeps around 11:30 PM",
    "sleep_duration_hours": 6,
    "sleep_quality": "Disturbed by chest discomfort over last two nights",
    "physical_exercise": "Walking 15 mins daily; discontinued recently due to breathlessness"
 }'::jsonb,
 FALSE);

-- Unified Medical Timeline
INSERT INTO medical_timeline (patient_id, session_id, event_date, event_type, title, description, source, confidence) VALUES
('11111111-1111-1111-1111-111111111111', NULL, '2018-03-10', 'DIAGNOSIS', 'Type 2 Diabetes Mellitus Diagnosed', 'Fasting Blood Sugar 168 mg/dL; initiated Metformin 500mg daily.', 'PREVIOUS_RECORD', 0.98),
('11111111-1111-1111-1111-111111111111', NULL, '2019-08-22', 'ALLERGY', 'Penicillin Hypersensitivity Incident', 'Developed generalized rash and lip edema following Amoxicillin prescription.', 'PREVIOUS_RECORD', 0.95),
('11111111-1111-1111-1111-111111111111', NULL, '2020-11-05', 'DIAGNOSIS', 'Essential Hypertension Diagnosed', 'Blood pressure 150/94 mmHg; initiated Amlodipine 5mg OD.', 'PREVIOUS_RECORD', 0.98),
('11111111-1111-1111-1111-111111111111', NULL, '2026-06-15', 'LAB_RESULT', 'HbA1c Lab Report (8.2%)', 'Suboptimal glycemic control (HbA1c 8.2%); diabetic diet reinforcement.', 'OCR', 0.97),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-09-06', 'SYMPTOM', 'Onset of Exertional Chest Heaviness', 'Patient reports retrosternal pressure when walking up slight incline.', 'PATIENT_INTERVIEW', 0.94),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-09-08', 'RED_FLAG', 'Safety Alert: Exertional Chest Pain & Dyspnea', 'Priority clinical assessment recommended. Rule ID: RULE_CHEST_PAIN_EXERTIONAL_SOB.', 'SYSTEM_RULE', 1.00);

-- AI Case Summary (Evidence-Linked)
INSERT INTO summaries (id, session_id, patient_id, chief_complaint_summary, hpi_summary, past_history_summary, medications_summary, allergies_summary, investigations_summary, ayush_summary, contradictions_summary, red_flags_summary, evidence_links, is_finalized) VALUES
('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
 'Retrosternal chest heaviness and breathlessness for past 2 days, provoked by physical exertion.',
 'Patient describes retrosternal tightness rated 6/10 that began 2 days ago. Symptoms worsen on climbing stairs or walking briskly and subside after 5-10 minutes of rest. Associated with mild dyspnea on exertion. Denies nausea, radiation to left jaw/arm, or diaphoresis.',
 'Known Type 2 Diabetes Mellitus (8 years) and Essential Hypertension (6 years).',
 'Metformin 500 mg BD (oral, active), Amlodipine 5 mg OD (oral, active). Good self-reported adherence.',
 'Hospital records indicate Penicillin hypersensitivity (2019). During intake, patient responded "no known allergies". Flagged for doctor verification.',
 'Most recent HbA1c (June 2026): 8.2% (elevated, indicating uncontrolled glycemic index). Normal serum creatinine (1.0 mg/dL).',
 'Prakriti: Pitta-Kapha. Vikriti: Prana Vata and Sadhaka Pitta disturbance. Ahara Shakti: Madhyama with sluggish digestion (Jarana Shakti Avara). Sleep disturbed past 2 nights.',
 'ALLERGY CONTRADICTION: Prior medical record notes severe Penicillin allergy (2019); patient denied allergies during kiosk intake. Physician verification required.',
 'CRITICAL SAFETY ALERT: Priority clinical assessment recommended due to new-onset exertional retrosternal chest pain with breathlessness in patient with cardiovascular risk factors (DM + HTN).',
 '[
    {"field": "Chief Complaint", "source": "PATIENT_INTERVIEW", "confidence": 0.95, "reference": "Voice answer node CC_01"},
    {"field": "Metformin 500mg", "source": "PREVIOUS_RECORD", "confidence": 0.98, "reference": "Prescription GMC-2026"},
    {"field": "HbA1c 8.2%", "source": "OCR", "confidence": 0.97, "reference": "Lab Report Doc-0012"},
    {"field": "Penicillin Contradiction", "source": "SYSTEM_RULE", "confidence": 1.0, "reference": "Allergy cross-check"}
 ]'::jsonb,
 FALSE);
