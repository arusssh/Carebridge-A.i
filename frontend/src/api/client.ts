import { 
  CarePlan, 
  SafetyAuditResult, 
  TimelineBucket, 
  AdherenceStats, 
  PresetCase, 
  ValidationStatus,
  TaskStatus,
  OverallBenchmarkReport 
} from '../types';

const API_BASE = '/api';

export async function fetchPresets(): Promise<PresetCase[]> {
  const res = await fetch(`${API_BASE}/presets`);
  if (!res.ok) throw new Error('Failed to load presets');
  return res.json();
}

export async function fetchPreset(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/presets/${id}`);
  if (!res.ok) throw new Error('Failed to load preset case');
  return res.json();
}

export interface IngestResponse {
  care_plan: CarePlan;
  safety_audit: SafetyAuditResult;
  timeline: TimelineBucket[];
  adherence: AdherenceStats;
}

export async function ingestDocument(data: {
  raw_text: string;
  patient_name?: string;
  preset_id?: string;
  document_title?: string;
}): Promise<IngestResponse> {
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ingestion failed' }));
    throw new Error(err.detail || 'Ingestion failed');
  }
  return res.json();
}

export async function fetchCarePlan(planId: string): Promise<IngestResponse> {
  const res = await fetch(`${API_BASE}/careplan/${planId}`);
  if (!res.ok) throw new Error('Failed to fetch care plan');
  return res.json();
}

export async function validateItem(
  planId: string,
  data: {
    item_type: 'medication' | 'appointment' | 'task';
    item_id: string;
    new_status: ValidationStatus;
    updated_fields?: Record<string, any>;
    clarification_note?: string;
  }
): Promise<{ status: string; updated_item: any; safety_audit: SafetyAuditResult }> {
  const res = await fetch(`${API_BASE}/careplan/${planId}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to validate item');
  return res.json();
}

export async function updateTaskStatus(
  planId: string,
  taskId: string,
  data: { status: TaskStatus; completion_notes?: string }
): Promise<{ status: string; task: any; adherence: AdherenceStats }> {
  const res = await fetch(`${API_BASE}/careplan/${planId}/tasks/${taskId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function fetchDoctorQuestions(planId: string): Promise<{
  patient_name: string;
  primary_physician: string;
  questions_count: number;
  questions: Array<{
    category: string;
    severity: string;
    question: string;
    context: string;
    source_snippet?: string;
  }>;
}> {
  const res = await fetch(`${API_BASE}/careplan/${planId}/clarifications`);
  if (!res.ok) throw new Error('Failed to fetch doctor clarification questions');
  return res.json();
}

export async function runBenchmark(): Promise<OverallBenchmarkReport> {
  const res = await fetch(`${API_BASE}/benchmark/run`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to execute benchmark');
  return res.json();
}

// Gemini Vision Configuration API
export async function fetchGeminiConfig(): Promise<{
  has_key: boolean;
  key_preview: string;
  active_model: string;
  supported_models: string[];
}> {
  const res = await fetch(`${API_BASE}/config/gemini-key`);
  if (!res.ok) throw new Error('Failed to fetch Gemini configuration');
  return res.json();
}

export async function saveGeminiConfig(apiKey: string): Promise<{
  status: string;
  has_key: boolean;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/config/gemini-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey })
  });
  if (!res.ok) throw new Error('Failed to save Gemini key');
  return res.json();
}

// Option 1: File/Camera Upload & OCR
export async function uploadDocument(
  file: File, 
  patientName?: string,
  apiKey?: string
): Promise<IngestResponse & { parsed_metadata: any }> {
  const formData = new FormData();
  formData.append('file', file);
  if (patientName && patientName.trim()) {
    formData.append('patient_name', patientName.trim());
  }
  if (apiKey && apiKey.trim()) {
    formData.append('api_key', apiKey.trim());
  }

  const headers: Record<string, string> = {};
  if (apiKey && apiKey.trim()) {
    headers['X-Gemini-API-Key'] = apiKey.trim();
  }

  const res = await fetch(`${API_BASE}/upload-document`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload and OCR failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

// Option 4: Caregiver Circle API
export async function fetchCareCircle(planId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/careplan/${planId}/circle`);
  if (!res.ok) throw new Error('Failed to load care circle');
  return res.json();
}

export async function addCaregiverMember(planId: string, member: any): Promise<any> {
  const res = await fetch(`${API_BASE}/careplan/${planId}/circle/member`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member)
  });
  if (!res.ok) throw new Error('Failed to add caregiver member');
  return res.json();
}

export async function logCaregiverActivity(
  planId: string,
  data: { actor_name: string; actor_role: string; action_type: string; description: string; item_id?: string }
): Promise<any> {
  const formData = new FormData();
  formData.append('actor_name', data.actor_name);
  formData.append('actor_role', data.actor_role);
  formData.append('action_type', data.action_type);
  formData.append('description', data.description);
  if (data.item_id) formData.append('item_id', data.item_id);

  const res = await fetch(`${API_BASE}/careplan/${planId}/circle/activity`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to record activity log');
  return res.json();
}

// Option 2: Notifications API
export async function fetchNotifications(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/notifications`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function sendNotification(data: {
  recipient_name: string;
  phone_number: string;
  recipient_email?: string;
  channel: string;
  delivery_mode?: 'SIMULATED' | 'REAL_EMAIL' | 'REAL_SMS';
  message_body: string;
  task_id?: string;
  smtp_config?: any;
  twilio_config?: any;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to send notification');
  return res.json();
}

export async function replyNotification(data: {
  notification_id: string;
  reply_text: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/notifications/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to process reply');
  return res.json();
}

