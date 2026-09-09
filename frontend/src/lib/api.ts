const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiService {
  private static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("medikiosk_token");
    }
    return null;
  }

  public static setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("medikiosk_token", token);
    }
  }

  public static removeToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("medikiosk_token");
      localStorage.removeItem("medikiosk_user");
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 401) {
        if (
          typeof window !== "undefined" &&
          !endpoint.includes("/auth/login") &&
          !endpoint.includes("/auth/patient/signup") &&
          !endpoint.includes("/auth/doctor/signup")
        ) {
          this.removeToken();
          window.dispatchEvent(new CustomEvent("medikiosk_auth_expired", { detail: { endpoint } }));
        }
      }
      let errorMsg = res.status === 401 ? "Your session has expired. Please log in again." : `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        if (typeof errorData === "string") {
          errorMsg = errorData;
        } else if (errorData && typeof errorData === "object") {
          if (Array.isArray(errorData.detail)) {
            // FastAPI validation error list
            errorMsg = errorData.detail
              .map((d: any) => {
                const loc = d.loc ? d.loc.filter((x: any) => x !== "body").join(".") : "";
                return `${loc ? loc + ": " : ""}${d.msg || JSON.stringify(d)}`;
              })
              .join("; ");
          } else if (typeof errorData.detail === "string") {
            errorMsg = errorData.detail;
          } else if (errorData.detail && typeof errorData.detail === "object") {
            const d = errorData.detail;
            const parts: string[] = [];
            if (d.message) parts.push(d.message);
            if (d.code) parts.push(`Code: ${d.code}`);
            if (d.details) parts.push(`Details: ${d.details}`);
            if (d.hint) parts.push(`Hint: ${d.hint}`);
            errorMsg = parts.length > 0 ? parts.join(" | ") : JSON.stringify(d);
          } else if (errorData.message) {
            const parts: string[] = [errorData.message];
            if (errorData.code) parts.push(`Code: ${errorData.code}`);
            if (errorData.details) parts.push(`Details: ${errorData.details}`);
            if (errorData.hint) parts.push(`Hint: ${errorData.hint}`);
            errorMsg = parts.join(" | ");
          } else {
            errorMsg = JSON.stringify(errorData);
          }
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // Auth Endpoints
  static async registerPatient(data: any) {
    return this.request<any>("/auth/patient/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async registerDoctor(data: any) {
    return this.request<any>("/auth/doctor/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async login(identifier: string, password: string) {
    return this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  }

  static async forgotPassword(email: string) {
    return this.request<any>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  static async getMe() {
    return this.request<any>("/auth/me");
  }

  // Patient Endpoints
  static async getPatientProfile() {
    return this.request<any>("/patients/profile");
  }

  static async updatePatientProfile(data: any) {
    return this.request<any>("/patients/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async getPatientHistory() {
    return this.request<any[]>("/patients/history");
  }

  static async addPatientHistory(data: any) {
    return this.request<any>("/patients/history", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async deletePatientHistory(id: string) {
    return this.request<any>(`/patients/history/${id}`, {
      method: "DELETE",
    });
  }

  static async getPatientTimeline() {
    return this.request<any[]>("/patients/timeline");
  }

  // Medical Documents
  static async uploadDocument(formData: FormData) {
    return this.request<any>("/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  // Doctor-Patient Relationships
  static async getAvailableDoctors() {
    return this.request<any[]>("/doctors");
  }

  static async connectDoctor(doctorIdentifier?: string, doctorName?: string) {
    return this.request<any>("/relationships/connect", {
      method: "POST",
      body: JSON.stringify({
        doctor_identifier: doctorIdentifier,
        doctor_name: doctorName,
      }),
    });
  }

  static async getCurrentConnection() {
    return this.request<any>("/relationships/current");
  }

  // Clinical Interviews & AI Question Graph
  static async startInterview(sessionId?: string, doctorId?: string, language: string = "en") {
    return this.request<any>("/interviews/start", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        doctor_id: doctorId,
        language,
      }),
    });
  }

  static async submitAnswer(sessionId: string, questionId: string, answerText: string, language: string = "en") {
    return this.request<any>("/interviews/answer", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        question_id: questionId,
        answer_text: answerText,
        language,
      }),
    });
  }

  static async getLatestSummary() {
    return this.request<any>("/summaries/latest");
  }

  // Doctor Portal Endpoints
  static async getAssignedPatients() {
    return this.request<any[]>("/doctors/patients");
  }

  static async searchPatients(query: string) {
    return this.request<any[]>(`/doctors/patients/search?query=${encodeURIComponent(query)}`);
  }

  static async getPatientCase(patientId: string) {
    return this.request<any>(`/doctors/patients/${patientId}/case`);
  }

  static async verifySummary(patientId: string, summaryId: string, notes: string) {
    return this.request<any>(`/doctors/patients/${patientId}/verify-summary`, {
      method: "POST",
      body: JSON.stringify({ summary_id: summaryId, notes }),
    });
  }

  // Emergency Medical Portal & SOS
  static async getEmergencySettings() {
    return this.request<any>("/emergency/settings");
  }

  static async toggleEmergencyAccess(data: {
    is_enabled: boolean;
    blood_group?: string;
    emergency_contact?: string;
    special_instructions?: string;
  }) {
    return this.request<any>("/emergency/toggle", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getPublicEmergencyView(token: string) {
    return this.request<any>(`/emergency/view/${token}`);
  }

  static async triggerEmergencySOS(data: {
    token: string;
    latitude?: number;
    longitude?: number;
    note?: string;
  }) {
    return this.request<any>("/emergency/sos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getTriageAlerts() {
    return this.request<any[]>("/emergency/triage-alerts");
  }

  // Admin Portal & Operational Analytics
  static async getSystemMetrics() {
    return this.request<any>("/admin/metrics");
  }

  static async getAuditLogs() {
    return this.request<any[]>("/admin/audit-logs");
  }
}
