# MediKiosk REST API Specification
Smart India Hackathon 2026 — Problem Statement SIH26047

> **Backend Engine**: FastAPI (Python 3.10+)  
> **Base URL**: `http://localhost:8000/api/v1`  
> **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)  
> **Zero Dummy Data**: Strictly persistent with Supabase PostgreSQL and authentic user generation.

---

## 1. Authentication & Role-Based Access (`/auth`)

### `POST /auth/patient/signup`
Registers a genuine patient with atomic `MK-XXXXXX` identifier generation.
- **Mandatory Consent**: Must include `consent_accepted: true`. If `false`, rejects with `400 Bad Request`.
- **Request Body**:
  ```json
  {
    "full_name": "Ramesh Kumar",
    "email": "ramesh.kumar@hospital.org",
    "password": "SecurePassword123!",
    "age": 52,
    "phone": "+919876543210",
    "address": "Bangalore, Karnataka",
    "blood_group": "B+",
    "emergency_contact": "+919876543211",
    "consent_accepted": true
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 7200,
    "user": {
      "sub": "uuid-here",
      "email": "ramesh.kumar@hospital.org",
      "role": "patient",
      "medikiosk_id": "MK-000001",
      "name": "Ramesh Kumar"
    }
  }
  ```

### `POST /auth/doctor/signup`
Registers a genuine OPD doctor with atomic `DK-XXXXXX` identifier generation.
- **Request Body**:
  ```json
  {
    "full_name": "Dr. Ananya Sharma",
    "email": "dr.ananya@hospital.org",
    "password": "DoctorSecure123!",
    "age": 38,
    "phone": "+919844433221",
    "address": "Chennai, Tamil Nadu",
    "specialization": "Cardiology",
    "emergency_contact": "+919844433220",
    "consent_accepted": true
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 7200,
    "user": {
      "sub": "uuid-here",
      "email": "dr.ananya@hospital.org",
      "role": "doctor",
      "doctor_id": "DK-000001",
      "name": "Dr. Ananya Sharma"
    }
  }
  ```

### `POST /auth/login`
Authenticates a user via Patient ID (`MK-XXXXXX`), Doctor ID (`DK-XXXXXX`), or Email.
- **Enforcement**: Verifies password and checks active consent.

### `POST /auth/forgot-password` & `POST /auth/reset-password`
Handles password recovery and updates the hashed credential.

### `GET /auth/me`
Retrieves authenticated profile and identifier.

---

## 2. Doctor-Patient Connection (`/relationships`)

### `POST /relationships/connect`
Connects a patient to an attending doctor via Doctor ID (`DK-XXXXXX`) or Name.
- Creates active relationship in `doctor_patient_relationships`.
- Creates active intake session in `clinical_sessions`.

### `GET /relationships/current`
Returns patient's active connected doctor and session status.

---

## 3. AI Clinical History Taking (`/interviews`)

### `POST /interviews/start`
Starts clinical interview and returns the first question node from the Question Graph.

### `POST /interviews/answer`
Submits answer to current question.
- Extracts structured clinical entities via Gemini.
- Evaluates real-time deterministic red-flags.
- Returns next question or synthesizes the final pre-consultation medical summary upon completion.

---

## 4. Patient Medical Records (`/patients`)

- `GET /patients/profile`: Get profile demographics.
- `PUT /patients/profile`: Update profile demographics.
- `GET /patients/history`: Retrieve real medical history records (returns empty array if none recorded).
- `POST /patients/history`: Add condition, surgery, medication, or allergy record + writes to timeline.
- `DELETE /patients/history/{id}`: Delete medical history record + updates timeline.
- `GET /patients/timeline`: Unified chronological medical timeline.

---

## 5. Medical Documents & OCR (`/documents`)

### `POST /documents/upload`
Multipart upload for prescriptions, lab reports, and scans.
- Performs Gemini Vision OCR.
- Stores extracted entities and updates patient timeline.

---

## 6. Doctor Portal APIs (`/doctors`)

- `GET /doctors`: List available OPD doctors for patient selection.
- `GET /doctors/patients`: List patients actively connected to this doctor.
- `GET /doctors/patients/search?query=...`: Live query by patient name or `MK-XXXXXX` ID.
- `GET /doctors/patients/{id}/case`: Enforces authorization check. Returns patient summary, timeline, documents, and FHIR R4 Bundle.
- `POST /doctors/patients/{id}/verify-summary`: Records doctor verification.
