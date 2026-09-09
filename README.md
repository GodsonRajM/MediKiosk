# MediKiosk

> **Pre-consultation, AI-assisted patient case-taking system**  
> *Smart India Hackathon 2026 — Problem Statement SIH26047 (Ministry of Ayush track)*  
> *"MediKiosk moves clinical history-taking from inside the doctor's 3-minute consultation to before the consultation."*  
> *"AI prepares the case; the doctor owns the clinical decision."*

---

## 🏛️ System Overview

MediKiosk is an interactive, browser-based clinical history-taking kiosk engineered for OPD waiting rooms. It enables patients to complete comprehensive clinical intake—via voice, touch, document scanning, and AYUSH-specific questioning—**before** stepping into the doctor's consultation chamber.

The system synthesizes patient responses, historical records, and uploaded lab/prescription documents into an evidence-linked, verifiable clinical summary delivered directly to the physician's dashboard.

### Core Architectural Principles
1. **Software-Only Architecture**: Operates on any standard touch-enabled device, laptop, or tablet without custom hardware.
2. **Deterministic Clinical Question Graph**: Clinical flow is strictly governed by a deterministic state machine; LLMs are restricted to natural language phrasing and entity extraction.
3. **Doctor In The Loop**: AI never concludes or diagnoses. Every extracted fact carries `source`, `confidence`, and `doctor_verified` attributes.
4. **Functional AYUSH Mode**: Comprehensive Dashavidha Pariksha and Ahara-Vihara clinical history capture.
5. **Deterministic Safety / Red-Flag Engine**: High-risk findings trigger immediate non-diagnostic triage alerts (*"Priority clinical assessment recommended"*).
6. **Interoperability**: First-class support for HL7 FHIR R4 JSON bundles and ABDM M1/M2/M3 mock adapters.

---

## 🔒 Privacy & Compliance Notice

> **Regulatory Notice**: Designed with privacy-by-design principles and intended to align with applicable Indian data protection, ABDM consent, and healthcare security requirements. Production deployment requires formal security and compliance validation.

- **Zero Diagnostic Claims**: MediKiosk does not replace medical practitioners, prescribe drugs, or formulate treatment decisions.
- **Controlled Identifiers**: Internal IDs use format `MK-000001`. ABHA numbers and hospital MRNs are mapped in isolated identifier registries. Raw Aadhaar numbers are never used as internal keys.
- **Granular Consent**: Explicit, recorded, revocable multi-category consent artifacts.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node.js 24+)
- Python 3.10+ (tested on Python 3.14+)
- Git

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the Kiosk and Portals.

---

## 👥 Authentication & Real User Roles

MediKiosk contains **ZERO dummy/mock data**. Accounts are registered directly through the platform with genuine ID generation:

| Role | Registration & ID Format | Description |
| :--- | :--- | :--- |
| **Patient** | Register via `PATIENT LOGIN` → Receives unique `MK-XXXXXX` | Completes pre-consultation clinical intake and manages medical history |
| **Doctor** | Register via `DOCTOR LOGIN` → Receives unique `DK-XXXXXX` | Reviews patient clinical summaries, verifies intake facts, and monitors red flags |

---

## 📂 Repository Structure

- `backend/`: FastAPI application, clinical question graph, rule engines, AI services, and adapters.
- `frontend/`: Next.js 14+ App Router, accessible kiosk interface, physician verification portal.
- `database/`: Supabase PostgreSQL schema and RLS policies.
- `docs/`: In-depth architecture, API documentation, demo walk-throughs, and AYUSH specification.
