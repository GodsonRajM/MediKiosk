export type UserRole = 'PATIENT' | 'DOCTOR' | 'TRIAGE_STAFF' | 'ADMIN';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  patient_id?: string;
  medikiosk_id?: string;
}

export interface Patient {
  id: string;
  medikiosk_id: string;
  full_name: string;
  date_of_birth?: string;
  age?: number;
  gender: string;
  phone: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  preferred_language: string;
}

export interface ClinicalSession {
  id: string;
  patient_id: string;
  session_status: string;
  mode: 'STANDARD' | 'AYUSH';
  current_step: string;
  selected_language: string;
  chief_complaint_text?: string;
  started_at: string;
}

export interface Question {
  question_id: string;
  section: string;
  question_text: string;
  question_text_en: string;
  question_text_ta?: string;
  question_text_hi?: string;
  input_type: 'text' | 'choice' | 'scale' | 'voice';
  options: string[];
  is_required: boolean;
  clinical_category: string;
  total_nodes: number;
  current_index: number;
}

export interface RedFlag {
  id: string;
  session_id: string;
  patient_id: string;
  rule_id: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  title: string;
  clinical_recommendation: string;
  triggered_criteria: string[];
  is_active: boolean;
  created_at: string;
}

export interface TriageAlert {
  id: string;
  red_flag_id: string;
  patient_id: string;
  patient_name: string;
  medikiosk_id: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  reason: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'ESCALATED' | 'CLOSED';
  action_taken?: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  patient_id: string;
  event_date: string;
  event_type: string;
  title: string;
  description?: string;
  source: string;
  confidence: number;
}

export interface AyushAssessment {
  session_id: string;
  prakriti: {
    primary: string;
    vata_score: number;
    pitta_score: number;
    kapha_score: number;
  };
  vikriti: {
    imbalance: string;
    dosha_status: string;
  };
  sara: string;
  samhanana: string;
  pramana: {
    height_cm?: number;
    weight_kg?: number;
    assessment: string;
  };
  satmya: string;
  sattva: string;
  ahara_shakti: {
    abhyavaharana_shakti: string;
    jarana_shakti: string;
  };
  vyayama_shakti: string;
  vaya: string;
  ahara_vihara: {
    meal_timing: string;
    appetite: string;
    food_preferences: string;
    water_intake_liters: number;
    daily_routine: string;
    sleep_duration_hours: number;
    sleep_quality: string;
    physical_exercise: string;
  };
  doctor_verified: boolean;
  doctor_notes?: string;
}

export interface DoctorQueueItem {
  patient_id: string;
  medikiosk_id: string;
  patient_name: string;
  age: number;
  gender: string;
  chief_complaint: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  has_red_flags: boolean;
  red_flag_count: number;
  wait_time_minutes: number;
  completion_percentage: number;
  session_id: string;
  session_status: string;
}
