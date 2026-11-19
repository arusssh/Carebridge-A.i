export type ValidationStatus = 'AI_GENERATED' | 'HUMAN_VALIDATED' | 'FLAGGED_AMBIGUOUS' | 'REJECTED';

export type TaskCategory = 
  | 'MEDICATION' 
  | 'VITALS_CHECK' 
  | 'WOUND_CARE' 
  | 'PHYSICAL_THERAPY' 
  | 'DIET_LIFESTYLE' 
  | 'LAB_TEST' 
  | 'APPOINTMENT' 
  | 'OTHER';

export type TaskUrgency = 'ROUTINE' | 'IMPORTANT' | 'CRITICAL';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME' | 'AS_NEEDED' | 'SPECIFIC_TIME';

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  purpose?: string;
  duration?: string;
  special_instructions?: string;
  is_prn: boolean;
  validation_status: ValidationStatus;
  source_snippet?: string;
  confidence_score: number;
  clarification_note?: string;
}

export interface AppointmentItem {
  id: string;
  provider_name: string;
  specialty?: string;
  purpose: string;
  timeframe_description: string;
  target_day_offset?: number;
  scheduled_datetime?: string;
  location?: string;
  prep_instructions?: string;
  validation_status: ValidationStatus;
  source_snippet?: string;
  confidence_score: number;
  clarification_note?: string;
}

export interface CareTaskItem {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  urgency: TaskUrgency;
  frequency: string;
  time_of_day: TimeOfDay;
  target_day_offset?: number;
  status: TaskStatus;
  validation_status: ValidationStatus;
  source_snippet?: string;
  completion_notes?: string;
  completed_at?: string;
  clarification_note?: string;
}

export interface RedFlagItem {
  id: string;
  symptom: string;
  action_required: string;
  contact_target: string;
  source_snippet?: string;
}

export interface RestrictionItem {
  id: string;
  category: string;
  description: string;
  duration?: string;
  source_snippet?: string;
}

export interface CarePlan {
  id: string;
  patient_name: string;
  patient_id?: string;
  diagnosis_summary: string;
  hospital_name?: string;
  primary_physician?: string;
  discharge_date?: string;
  medications: MedicationItem[];
  appointments: AppointmentItem[];
  tasks: CareTaskItem[];
  red_flags: RedFlagItem[];
  restrictions: RestrictionItem[];
  raw_source_text: string;
  created_at: string;
  updated_at: string;
}

export interface AmbiguityFlag {
  item_id: string;
  item_type: string;
  field_name: string;
  ambiguity_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  suggested_clarification_question: string;
  source_snippet?: string;
}

export interface SafetyAuditResult {
  care_plan_id: string;
  total_items_inspected: number;
  ambiguities_count: number;
  flags: AmbiguityFlag[];
  safety_score: number;
  readiness_status: string;
  audit_notes: string[];
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timeframe: string;
  target_day_offset: number;
  validation_status: ValidationStatus;
  details: string;
  urgency: string;
}

export interface TimelineBucket {
  phase: string;
  day_min: number;
  day_max: number;
  events: TimelineEvent[];
}

export interface AdherenceStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  adherence_rate: number;
  categories: Record<string, { total: number; completed: number }>;
}

export interface PresetCase {
  id: string;
  title: string;
  category: string;
  patient_name: string;
  patient_age: number;
  preview: string;
}

export interface MetricScore {
  precision: number;
  recall: number;
  f1: number;
  ground_truth_count: number;
  predicted_count: number;
  true_positive_count: number;
}

export interface BenchmarkCaseResult {
  case_id: string;
  case_title: string;
  medication_metrics: MetricScore;
  appointment_metrics: MetricScore;
  task_metrics: MetricScore;
  ambiguity_recall: number;
  hallucination_count: number;
  hallucinations_detected: string[];
  execution_time_ms: number;
}

export interface OverallBenchmarkReport {
  timestamp: string;
  total_cases_evaluated: number;
  average_f1_score: number;
  hallucination_prevention_rate: number;
  ambiguity_detection_sensitivity: number;
  average_latency_ms: number;
  case_results: BenchmarkCaseResult[];
  safety_audit_compliance: string;
  bloom_taxonomy_summary: Record<string, string>;
}

// Option 4: Caregiver Types
export type CaregiverRole = 'PRIMARY_CAREGIVER' | 'FAMILY_OBSERVER' | 'HOME_NURSE' | 'PHYSICIAN';

export interface CaregiverMember {
  id: string;
  name: string;
  relationship: string;
  role: CaregiverRole;
  phone_number: string;
  email?: string;
  receive_sms: boolean;
  receive_missed_dose_alerts: boolean;
  can_complete_tasks: boolean;
}

export interface CareActivityLogItem {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  action_type: string;
  description: string;
  item_id?: string;
}

export interface CareCircle {
  care_plan_id: string;
  patient_name: string;
  members: CaregiverMember[];
  activity_feed: CareActivityLogItem[];
}

// Option 2: Notification Types
export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'PUSH' | 'EMAIL';
export type DeliveryMode = 'SIMULATED' | 'REAL_EMAIL' | 'REAL_SMS';
export type NotificationStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface NotificationMessage {
  id: string;
  recipient_name: string;
  phone_number: string;
  recipient_email?: string;
  channel: NotificationChannel;
  delivery_mode: DeliveryMode;
  message_body: string;
  timestamp: string;
  status: NotificationStatus;
  task_id?: string;
  action_prompt?: string;
  action_taken: boolean;
  delivery_report?: any;
}

export interface AuthUser {
  name: string;
  mrn: string;
  role: 'Patient' | 'Primary Caregiver' | 'Clinician';
  facility?: string;
  loginTime: string;
}


