# MediKiosk End-to-End Real-Data Workflow & Demo Guide
Smart India Hackathon 2026 — Problem Statement SIH26047

> *"MediKiosk moves clinical history-taking from inside the doctor's 3-minute consultation to before the consultation."*  
> *"AI prepares the case; the doctor owns the clinical decision."*  
> **Rule**: ZERO dummy data. Every patient and doctor account is genuinely registered through the app.

---

## 👣 Step-by-Step Complete Walkthrough

### Phase 1: Real Doctor Registration
1. Open [http://localhost:3000](http://localhost:3000).
2. Click **DOCTOR LOGIN** at top.
3. Click **Create New Account**.
4. Fill in:
   - Full Name: `Dr. Rajesh Varma`
   - Email: `dr.rajesh@hospital.org`
   - Password: `DoctorPass123!`
   - Age: `45`, Phone: `+919876543210`
   - Specialization: `Cardiology / OPD`
   - Mandatory Consent: Check *"I understand and grant mandatory consent"*.
5. Click **Register & Generate Doctor ID**.
6. System assigns a genuine unique ID (e.g. `DK-000001`) and redirects to Doctor Portal.
7. Click Logout to prepare for patient intake.

---

### Phase 2: Real Patient Registration & Consent
1. On the main login page, click **PATIENT LOGIN**.
2. Click **Create New Account**.
3. Fill in:
   - Full Name: `Suresh Patel`
   - Email: `suresh.patel@hospital.org`
   - Password: `PatientPass123!`
   - Age: `54`, Phone: `+919811122233`
   - Address: `Ahmedabad, Gujarat`
   - Mandatory Consent: Check *"Mandatory Clinical Intake & Privacy Consent"*.
4. Click **Register & Generate Patient ID**.
5. System assigns a genuine unique ID (e.g. `MK-000001`) and enters Patient Portal.

---

### Phase 3: Patient Connects to Doctor & Takes AI Intake
1. On the Patient Home Page:
   - Under **Connect with your Doctor**, enter `DK-000001` or select `Dr. Rajesh Varma`.
   - Click **Connect Doctor**.
2. Active connection is confirmed. Click **Begin AI Clinical Intake**.
3. Step through the Clinical Question Graph:
   - **Chief Complaint**: Select `Chest Pain / Discomfort`.
   - **Duration**: Select `1 to 3 days`.
   - **Severity**: Select `9 - 10: Critical (Unbearable)`.
   - **Associated Symptoms**: Select `Shortness of breath / Breathing difficulty`.
   - The deterministic Red-Flag Engine instantly triggers:  
     *"Priority Clinical Assessment Recommended (Potential Acute Cardiopulmonary Presentation)"*.
   - Complete remaining past conditions, allergies, and regular medications.
4. The AI synthesizes the pre-consultation clinical summary and securely routes it to Dr. Rajesh Varma's queue.

---

### Phase 4: Patient Adds History & Uploads Documents
1. Open the left sliding drawer menu and select **Medical History**.
2. Notice the initial clean empty state: *"No Medical History Available"*.
3. Click **Add Medical Record**:
   - Category: `Allergy`
   - Title: `Penicillin Allergy`
   - Click Save. Notice the record appears instantly in the chronological timeline!
4. Under **Upload Medical Document**:
   - Upload a test prescription or lab report (PDF/JPG/PNG).
   - Gemini Vision OCR extracts text and structured clinical entities.
   - The upload is recorded in the medical timeline.

---

### Phase 5: Doctor Reviews Case, Red Flags & Verifies
1. Log into Doctor Portal using `DK-000001` and password.
2. In the **Connected Patients Queue**, observe `Suresh Patel` (`MK-000001`) with an active **Red Flag** alert.
3. Click **Review Clinical Case**:
   - Inspect the prominent **Red-Flag Banner**.
   - Review the structured **AI Pre-Consultation Summary**: Chief complaint, HPI narrative, conditions, and medications.
   - Review the patient's **Medical Timeline** and uploaded OCR documents.
4. Click **Confirm & Verify Clinical Summary** (*"AI prepares the case; the doctor owns the clinical decision"*).
5. Click **Export HL7 FHIR R4 Bundle** to preview and download standard interoperable FHIR JSON.
