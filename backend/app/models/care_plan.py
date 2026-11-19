from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class ValidationStatus(str, Enum):
    AI_GENERATED = "AI_GENERATED"
    HUMAN_VALIDATED = "HUMAN_VALIDATED"
    FLAGGED_AMBIGUOUS = "FLAGGED_AMBIGUOUS"
    REJECTED = "REJECTED"

class TaskCategory(str, Enum):
    MEDICATION = "MEDICATION"
    VITALS_CHECK = "VITALS_CHECK"
    WOUND_CARE = "WOUND_CARE"
    PHYSICAL_THERAPY = "PHYSICAL_THERAPY"
    DIET_LIFESTYLE = "DIET_LIFESTYLE"
    LAB_TEST = "LAB_TEST"
    APPOINTMENT = "APPOINTMENT"
    OTHER = "OTHER"

class TaskUrgency(str, Enum):
    ROUTINE = "ROUTINE"
    IMPORTANT = "IMPORTANT"
    CRITICAL = "CRITICAL"

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"

class TimeOfDay(str, Enum):
    MORNING = "MORNING"
    AFTERNOON = "AFTERNOON"
    EVENING = "EVENING"
    BEDTIME = "BEDTIME"
    AS_NEEDED = "AS_NEEDED"
    SPECIFIC_TIME = "SPECIFIC_TIME"

class MedicationItem(BaseModel):
    id: str = Field(default_factory=lambda: f"med-{uuid.uuid4().hex[:8]}")
    name: str
    dosage: str
    frequency: str
    route: str = "Oral"
    purpose: Optional[str] = None
    duration: Optional[str] = None
    special_instructions: Optional[str] = None
    is_prn: bool = False
    validation_status: ValidationStatus = ValidationStatus.AI_GENERATED
    source_snippet: Optional[str] = None
    confidence_score: float = 0.95
    clarification_note: Optional[str] = None

class AppointmentItem(BaseModel):
    id: str = Field(default_factory=lambda: f"apt-{uuid.uuid4().hex[:8]}")
    provider_name: str
    specialty: Optional[str] = None
    purpose: str
    timeframe_description: str
    target_day_offset: Optional[int] = None
    scheduled_datetime: Optional[str] = None
    location: Optional[str] = "Clinic / Telehealth"
    prep_instructions: Optional[str] = None
    validation_status: ValidationStatus = ValidationStatus.AI_GENERATED
    source_snippet: Optional[str] = None
    confidence_score: float = 0.92
    clarification_note: Optional[str] = None

class CareTaskItem(BaseModel):
    id: str = Field(default_factory=lambda: f"tsk-{uuid.uuid4().hex[:8]}")
    title: str
    description: str
    category: TaskCategory = TaskCategory.OTHER
    urgency: TaskUrgency = TaskUrgency.ROUTINE
    frequency: str = "Daily"
    time_of_day: TimeOfDay = TimeOfDay.MORNING
    target_day_offset: Optional[int] = None
    status: TaskStatus = TaskStatus.PENDING
    validation_status: ValidationStatus = ValidationStatus.AI_GENERATED
    source_snippet: Optional[str] = None
    completion_notes: Optional[str] = None
    completed_at: Optional[str] = None
    clarification_note: Optional[str] = None

class RedFlagItem(BaseModel):
    id: str = Field(default_factory=lambda: f"rf-{uuid.uuid4().hex[:8]}")
    symptom: str
    action_required: str
    contact_target: str = "Emergency Room / Call 911"
    source_snippet: Optional[str] = None

class RestrictionItem(BaseModel):
    id: str = Field(default_factory=lambda: f"res-{uuid.uuid4().hex[:8]}")
    category: str
    description: str
    duration: Optional[str] = None
    source_snippet: Optional[str] = None

class CarePlan(BaseModel):
    id: str = Field(default_factory=lambda: f"cp-{uuid.uuid4().hex[:8]}")
    patient_name: str = "Patient"
    patient_id: Optional[str] = None
    diagnosis_summary: str
    hospital_name: Optional[str] = "Regional Medical Center"
    primary_physician: Optional[str] = None
    discharge_date: Optional[str] = None
    medications: List[MedicationItem] = []
    appointments: List[AppointmentItem] = []
    tasks: List[CareTaskItem] = []
    red_flags: List[RedFlagItem] = []
    restrictions: List[RestrictionItem] = []
    raw_source_text: str = ""
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class IngestDocumentRequest(BaseModel):
    document_title: Optional[str] = "Clinical Discharge Document"
    raw_text: str
    patient_name: Optional[str] = "Patient"
    preset_id: Optional[str] = None

class ValidateItemRequest(BaseModel):
    item_type: str  # "medication", "appointment", "task"
    item_id: str
    new_status: ValidationStatus
    updated_fields: Optional[Dict[str, Any]] = None
    clarification_note: Optional[str] = None

class UpdateTaskStatusRequest(BaseModel):
    status: TaskStatus
    completion_notes: Optional[str] = None
