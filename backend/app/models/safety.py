from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class AmbiguityType(str, Enum):
    MISSING_DOSAGE = "MISSING_DOSAGE"
    VAGUE_FREQUENCY = "VAGUE_FREQUENCY"
    MISSING_DURATION = "MISSING_DURATION"
    UNBOUNDED_PRN = "UNBOUNDED_PRN"
    VAGUE_TIMEFRAME = "VAGUE_TIMEFRAME"
    INCOMPLETE_TASK = "INCOMPLETE_TASK"
    CONTRADICTION = "CONTRADICTION"
    MISSING_TARGET_VALUE = "MISSING_TARGET_VALUE"

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AmbiguityFlag(BaseModel):
    item_id: str
    item_type: str  # "medication", "appointment", "task", "restriction"
    field_name: str
    ambiguity_type: AmbiguityType
    severity: SeverityLevel
    description: str
    suggested_clarification_question: str
    source_snippet: Optional[str] = None

class SafetyAuditResult(BaseModel):
    care_plan_id: str
    total_items_inspected: int
    ambiguities_count: int
    flags: List[AmbiguityFlag] = []
    safety_score: float = 100.0  # 0 to 100%
    readiness_status: str = "SAFE_FOR_REVIEW"  # "READY_FOR_VALIDATION", "REQUIRES_ATTENTION", "CRITICAL_CLARIFICATION_NEEDED"
    audit_notes: List[str] = []
