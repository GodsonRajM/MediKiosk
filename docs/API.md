# MediKiosk REST API Specification

> **Backend Engine**: FastAPI (Python 3.10+)  
> **Base URL**: `http://localhost:8000/api/v1`  
> **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 1. Authentication & RBAC (`/auth`)

### `POST /auth/login`
Authenticates a user by email/phone or MediKiosk ID with password.
- **Request**:
  ```json
  {
    "identifier": "MK-000001",
    "password": "patient123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "email": "patient@medikiosk.local",
      "role": "PATIENT",
      "patient_id": "11111111-1111-1111-1111-111111111111",
      "medikiosk_id": "MK-000001"
    }
  }
  ```

### `POST /auth/otp/send` & `POST /auth/otp/verify`
Mock OTP workflow for passwordless patient kiosk login.

---

## 2. Patients & Demographics (`/patients`)

### `GET /patients/{id}`
Retrieves demographic profile and external identifiers (`patient_identifiers`).
- **Authorization**: Self (`PATIENT`), Consented `DOCTOR`, `TRIAGE_STAFF`, or `ADMIN`.

### `POST /patients`
Registers a new patient and generates next sequential `MK-XXXXXX` ID.

---

## 3. Clinical Sessions & Consent (`/sessions`)

### `POST /sessions`
Initiates a new clinical intake session.
- **Request**:
  ```json
  {
    "patient_id": "11111111-1111-1111-1111-111111111111",
    "mode": "AYUSH",
    "selected_language": "ta"
  }
  ```

### `POST /sessions/{id}/consent`
Records multi-category granular consent.
- **Request**:
  ```json
  {
    "consents": [
      {"category": "CLINICAL_HISTORY", "status": "GRANTED"},
      {"category": "VOICE_PROCESSING", "status": "GRANTED"},
      {"category": "MEDICAL_DOCUMENTS", "status": "GRANTED"},
      {"category": "DOCTOR_SHARING", "status": "GRANTED"}
    ],
    "language": "ta",
    "audio_recorded": true
  }
  ```

---

## 4. Interviews & Question Graph (`/interviews`)

### `GET /interviews/{session_id}/next-question`
Retrieves the next clinical question determined by the deterministic graph.
- **Response** (`200 OK`):
  ```json
  {
    "question_id": "HPI_CHEST_PAIN_SEVERITY",
    "section": "HPI",
    "question_text": "On a scale of 1 to 10, how severe is your chest pain?",
    "input_type": "scale",
    "options": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    "is_required": true
  }
  ```

### `POST /interviews/{session_id}/answers`
Submits raw answer, triggers structured entity extraction and red-flag evaluation.
- **Request**:
  ```json
  {
    "question_id": "HPI_CHEST_PAIN_SEVERITY",
    "answer_text": "Around 6 out of 10, feels like heavy pressure",
    "input_method": "voice",
    "audio_transcript": "Around 6 out of 10, feels like heavy pressure"
  }
  ```

---

## 5. Documents & OCR (`/documents`)

### `POST /documents/upload`
Uploads prescription or lab report file (multipart/form-data).

### `POST /documents/{id}/process`
Runs document understanding pipeline (`mock` or `gemini-vision`) to extract medications, dosages, lab values, and normal ranges.

---

## 6. Safety & Triage (`/red-flags`, `/triage`)

### `GET /red-flags/session/{session_id}`
Returns active safety flags for a clinical session.

### `GET /triage/alerts`
Live alert feed for hospital triage desk.
- **Authorization**: `TRIAGE_STAFF`, `DOCTOR`, `ADMIN`.

### `POST /triage/alerts/{id}/acknowledge`
Acknowledge or update triage alert status (`ACKNOWLEDGED`, `UNDER_REVIEW`, `ESCALATED`, `CLOSED`).

---

## 7. AYUSH Clinical Engine (`/ayush`)

### `GET /ayush/{session_id}`
Retrieves structured Dashavidha Pariksha and Ahara-Vihara parameters.

### `POST /ayush/{session_id}`
Updates individual Dashavidha Pariksha parameters with validation.

---

## 8. Doctor Verification & Sign-Off (`/doctors`)

### `GET /doctors/queue`
Retrieves prioritized patient queue for the logged-in doctor.

### `POST /doctors/review/{session_id}/verify-field`
Granular field-level verification:
- **Request**:
  ```json
  {
    "field_id": "med_metformin_01",
    "action": "CONFIRMED",
    "doctor_notes": "Adherent to Metformin 500mg BD"
  }
  ```

### `POST /doctors/review/{session_id}/sign-off`
Doctor finalizes clinical intake and generates immutable clinical record.

---

## 9. Interoperability (`/fhir`, `/abdm`)

### `GET /fhir/patient/{id}/bundle`
Exports complete encounter as standard HL7 FHIR R4 Bundle JSON.

### `POST /abdm/consent/request`
Mock ABDM M2 consent artifact request.
