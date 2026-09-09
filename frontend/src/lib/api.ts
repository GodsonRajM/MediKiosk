const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('medikiosk_token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Authentication & Registration
  registerPatient: (data: any) =>
    fetchApi<any>('/auth/register/patient', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerDoctor: (data: any) =>
    fetchApi<any>('/auth/register/doctor', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (identifier: string, password: string, expected_role?: string) =>
    fetchApi<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, expected_role }),
    }),

  forgotPassword: (identifier: string, new_password: string) =>
    fetchApi<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, new_password }),
    }),

  googleAuth: (payload: { email: string; name?: string; role?: string }) =>
    fetchApi<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyOtp: (phone: string, otp_code: string) =>
    fetchApi<any>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp_code }),
    }),

  getMe: () => fetchApi<any>('/auth/me'),

  // Doctors
  getDoctors: () => fetchApi<any[]>('/doctors'),
  searchDoctors: (q: string) => fetchApi<any[]>(`/doctors/search?q=${encodeURIComponent(q)}`),
  connectDoctor: (patient_id: string, doctor_id: string) =>
    fetchApi<any>('/doctors/connect', {
      method: 'POST',
      body: JSON.stringify({ patient_id, doctor_id }),
    }),

  // Patients
  getPatient: (id: string) => fetchApi<any>(`/patients/${id}`),
  updatePatient: (id: string, data: any) =>
    fetchApi<any>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  searchPatients: (q: string) => fetchApi<any[]>(`/patients/search?q=${encodeURIComponent(q)}`),

  // Medical History CRUD (Scans, Prescriptions, Lab Tests)
  getPatientHistory: (patient_id: string) =>
    fetchApi<any[]>(`/patients/${patient_id}/history`),

  createPatientHistory: (patient_id: string, record: any) =>
    fetchApi<any>(`/patients/${patient_id}/history`, {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  deletePatientHistory: (patient_id: string, record_id: string) =>
    fetchApi<any>(`/patients/${patient_id}/history/${record_id}`, {
      method: 'DELETE',
    }),

  // File Upload with OCR
  uploadDocumentFile: async (patient_id: string, file: File, doc_type: string = 'LAB_REPORT', session_id?: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('medikiosk_token') : null;
    const formData = new FormData();
    formData.append('patient_id', patient_id);
    formData.append('doc_type', doc_type);
    if (session_id) formData.append('session_id', session_id);
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },

  // Session & Intake
  createSession: (patient_id: string, mode: string = 'STANDARD', language: string = 'en') =>
    fetchApi<any>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ patient_id, mode, selected_language: language, preferred_language: language }),
    }),

  recordConsent: (session_id: string, consents: any[], language: string = 'en') =>
    fetchApi<any>(`/sessions/${session_id}/consent`, {
      method: 'POST',
      body: JSON.stringify({ consents, language, audio_recorded: true }),
    }),

  // Interview Question Graph
  getNextQuestion: (session_id: string) =>
    fetchApi<any>(`/interviews/${session_id}/next-question`),

  submitAnswer: (session_id: string, question_id: string, answer_text: string, input_method: string = 'touch') =>
    fetchApi<any>(`/interviews/${session_id}/answers`, {
      method: 'POST',
      body: JSON.stringify({ question_id, answer_text, input_method }),
    }),

  getPatientDocuments: (patient_id: string) =>
    fetchApi<any>(`/documents/patient/${patient_id}`),

  getTimeline: (patient_id: string) =>
    fetchApi<any>(`/timeline/${patient_id}`),

  getRedFlags: (session_id: string) =>
    fetchApi<any>(`/red-flags/session/${session_id}`),

  getAyushAssessment: (session_id: string) =>
    fetchApi<any>(`/ayush/${session_id}`),

  getSummary: (session_id: string) =>
    fetchApi<any>(`/summaries/${session_id}`),

  // Doctor Clinical Queue & Review
  getDoctorQueue: () => fetchApi<any>('/doctors/queue'),
  getPatientFullRecord: (patient_id: string) =>
    fetchApi<any>(`/doctors/patient/${patient_id}/full-record`),

  verifyField: (session_id: string, field_id: string, field_type: string, action: 'CONFIRMED' | 'FLAGGED_CONTRADICTION') =>
    fetchApi<any>(`/doctors/review/${session_id}/verify-field`, {
      method: 'POST',
      body: JSON.stringify({ field_id, field_type, action }),
    }),

  signOffCase: (session_id: string, clinical_notes: string, provisional_plan: string) =>
    fetchApi<any>(`/doctors/review/${session_id}/sign-off`, {
      method: 'POST',
      body: JSON.stringify({ clinical_notes, provisional_plan }),
    }),

  getFhirBundle: (patient_id: string) =>
    fetchApi<any>(`/fhir/patient/${patient_id}/bundle`),

  // Triage & ABDM Integrations
  getTriageAlerts: () => fetchApi<any[]>('/triage/alerts'),
  takeTriageAction: (alertId: string, status: string, actionNote: string) =>
    fetchApi<any>(`/triage/alerts/${alertId}/action`, {
      method: 'POST',
      body: JSON.stringify({ status, action_taken: actionNote }),
    }),
  verifyAbha: (abha_id: string) =>
    fetchApi<any>('/abdm/verify-abha', {
      method: 'POST',
      body: JSON.stringify({ abha_id }),
    }),
};
