# MediKiosk End-to-End Demo Walkthrough

> **Smart India Hackathon 2026 — Problem Statement SIH26047**  
> *Target Scenario*: Demo Patient `MK-000001` (Sundaram Ramaswamy, 52M, Tamil)

---

## 🎯 The Primary Golden Path Scenario

### Patient Profile
- **Identifier**: `MK-000001`
- **Demographics**: 52-year-old male, Tamil native speaker
- **Chief Complaint**: Retrosternal chest tightness and breathlessness for 2 days on exertion
- **Pre-existing History**: Type 2 Diabetes (2018), Hypertension (2020)
- **Current Medications**: Metformin 500mg BD, Amlodipine 5mg OD
- **Allergy Contradiction**: Hospital record notes Penicillin hypersensitivity; patient verbally denies allergies during intake
- **Recent Lab Data**: Uploads lab report showing HbA1c 8.2% (uncontrolled)

---

## 👣 Step-by-Step Walkthrough

### Phase 1: Patient Kiosk Interaction
1. **Welcome & Language**:
   - Patient touches screen or selects language: **Tamil (தமிழ்)** or **English**.
   - Kiosk adjusts voice synthesis and text immediately.
2. **Identification & Login**:
   - Enter `MK-000001` or phone number `+91 98765 43210` with instant demo OTP verification.
3. **Multi-Category Consent**:
   - Explains in plain Tamil/English: Clinical History, Voice Processing, Document OCR, Doctor Sharing.
   - Patient grants consent with optional voice confirmation.
4. **Chief Complaint**:
   - Voice or touch entry: *"Chest pain and shortness of breath for past two days"*.
5. **Deterministic Clinical Interview**:
   - Question Graph triggers HPI chain:
     - Onset (Sudden / Gradual)
     - Severity (6 / 10)
     - Character (Pressure / Heaviness)
     - Aggravating factors (Walking briskly / Climbing stairs)
     - Relieving factors (Rest)
     - Associated symptoms (Breathlessness)
6. **AYUSH Intake**:
   - Dashavidha Pariksha questions: Prakriti assessment, Agni/Ahara Shakti, Vyayama Shakti.
   - Ahara-Vihara lifestyle habits captured in structured categories.
7. **Document Scanning & OCR**:
   - Patient scans/uploads lab report.
   - Document AI extracts HbA1c: 8.2%, flagged as abnormal with 97% confidence.
8. **Real-time Safety Alert**:
   - Deterministic Red-Flag Engine triggers:
     - Rule: `RULE_CHEST_PAIN_EXERTIONAL_SOB`
     - Text: *"Priority clinical assessment recommended"*
     - Alert dispatched in real time to Triage Staff desk.

---

### Phase 2: Triage Staff Console
1. Triage nurse sees high-priority red alert for `MK-000001`.
2. Acknowledges alert, checks vitals, and assigns immediate doctor room priority.

---

### Phase 3: Doctor Consultation Portal
1. Doctor logs into `/doctor` portal.
2. `MK-000001` appears at the top of the queue marked **HIGH PRIORITY / RED FLAG**.
3. Doctor opens case:
   - Views AI Longitudinal Summary with evidence badges.
   - Inspects Medical Timeline merging 2018 Diabetes, 2020 Hypertension, 2026 HbA1c 8.2%, and current acute chest pain.
   - Notices **Allergy Contradiction Alert**: Historical Penicillin allergy vs. patient's verbal intake. Doctor confirms allergy status with patient.
   - Reviews structured AYUSH Dashavidha Pariksha findings.
4. Doctor uses granular verification controls:
   - Confirms Metformin and Amlodipine adherence.
   - Verifies HbA1c lab extraction against original uploaded document scan.
   - Signs off on final clinical case record.

---

### Phase 4: Interoperability Export
1. Doctor clicks **Export FHIR R4 JSON**.
2. System produces fully compliant HL7 FHIR Bundle with `Patient`, `Condition`, `Observation`, `MedicationStatement`, `AllergyIntolerance`.
3. Demonstrates mock ABDM M1/M2/M3 transaction.
