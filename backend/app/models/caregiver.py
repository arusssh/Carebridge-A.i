from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class CaregiverRole(str, Enum):
    PRIMARY_CAREGIVER = "PRIMARY_CAREGIVER"
    FAMILY_OBSERVER = "FAMILY_OBSERVER"
    HOME_NURSE = "HOME_NURSE"
    PHYSICIAN = "PHYSICIAN"

class CaregiverMember(BaseModel):
    id: str = Field(default_factory=lambda: f"cg-{uuid.uuid4().hex[:8]}")
    name: str
    relationship: str  # "Daughter", "Spouse", "Home Health RN", "Son"
    role: CaregiverRole = CaregiverRole.PRIMARY_CAREGIVER
    phone_number: str = "+1 (555) 329-8472"
    email: Optional[str] = None
    receive_sms: bool = True
    receive_missed_dose_alerts: bool = True
    can_complete_tasks: bool = True

class CareActivityLogItem(BaseModel):
    id: str = Field(default_factory=lambda: f"act-{uuid.uuid4().hex[:8]}")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    actor_name: str
    actor_role: str
    action_type: str  # "TASK_COMPLETED", "MEDICATION_ADMINISTERED", "AMBIGUITY_FLAGGED", "NOTE_ADDED"
    description: str
    item_id: Optional[str] = None

class CareCircle(BaseModel):
    care_plan_id: str
    patient_name: str
    members: List[CaregiverMember] = []
    activity_feed: List[CareActivityLogItem] = []
