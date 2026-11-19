import re
from typing import List, Tuple
from ..models.care_plan import (
    CarePlan,
    MedicationItem,
    AppointmentItem,
    CareTaskItem,
    ValidationStatus
)
from ..models.safety import (
    SafetyAuditResult,
    AmbiguityFlag,
    AmbiguityType,
    SeverityLevel
)

class SafetyAuditor:
    """
    CareBridge AI Clinical Safety & Ambiguity Auditor.
    Enforces strict guardrails against ungrounded instructions, vague medical directions,
    and missing dosage parameters.
    """

    # Vague frequency trigger words
    VAGUE_FREQUENCY_PATTERNS = [
        r"\bregularly\b",
        r"\bas needed\b(?!.*\bmax\b)",
        r"\bperiodically\b",
        r"\bas instructed\b",
        r"\bsometime\b",
        r"\bsoon\b",
        r"\bif needed\b",
        r"\bwhenever\b"
    ]

    # Vague timeframe trigger words for appointments
    VAGUE_TIMEFRAME_PATTERNS = [
        r"\bsoon\b",
        r"\blater\b",
        r"\bas needed\b",
        r"\bif symptoms persist\b",
        r"\beventually\b"
    ]

    @classmethod
    def audit_care_plan(cls, care_plan: CarePlan) -> SafetyAuditResult:
        flags: List[AmbiguityFlag] = []
        total_items = 0

        # 1. Audit Medications
        for med in care_plan.medications:
            total_items += 1
            med_flags = cls._audit_medication(med)
            if med_flags:
                flags.extend(med_flags)
                if med.validation_status != ValidationStatus.HUMAN_VALIDATED:
                    med.validation_status = ValidationStatus.FLAGGED_AMBIGUOUS
                    med.clarification_note = med_flags[0].suggested_clarification_question

        # 2. Audit Appointments
        for apt in care_plan.appointments:
            total_items += 1
            apt_flags = cls._audit_appointment(apt)
            if apt_flags:
                flags.extend(apt_flags)
                if apt.validation_status != ValidationStatus.HUMAN_VALIDATED:
                    apt.validation_status = ValidationStatus.FLAGGED_AMBIGUOUS
                    apt.clarification_note = apt_flags[0].suggested_clarification_question

        # 3. Audit Tasks
        for task in care_plan.tasks:
            total_items += 1
            task_flags = cls._audit_task(task)
            if task_flags:
                flags.extend(task_flags)
                if task.validation_status != ValidationStatus.HUMAN_VALIDATED:
                    task.validation_status = ValidationStatus.FLAGGED_AMBIGUOUS
                    task.clarification_note = task_flags[0].suggested_clarification_question

        # Compute Safety Score (100 base, deductions based on severity)
        deduction = 0.0
        for f in flags:
            if f.severity == SeverityLevel.CRITICAL:
                deduction += 25.0
            elif f.severity == SeverityLevel.HIGH:
                deduction += 15.0
            elif f.severity == SeverityLevel.MEDIUM:
                deduction += 8.0
            else:
                deduction += 4.0

        safety_score = max(0.0, min(100.0, 100.0 - deduction))

        readiness = "READY_FOR_VALIDATION"
        if any(f.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH] for f in flags):
            readiness = "CRITICAL_CLARIFICATION_NEEDED"
        elif flags:
            readiness = "REQUIRES_ATTENTION"

        notes = []
        if flags:
            notes.append(f"Identified {len(flags)} clinical ambiguity flag(s) requiring human verification.")
        else:
            notes.append("All instructions passed automated completeness and safety syntax checks.")

        return SafetyAuditResult(
            care_plan_id=care_plan.id,
            total_items_inspected=total_items,
            ambiguities_count=len(flags),
            flags=flags,
            safety_score=round(safety_score, 1),
            readiness_status=readiness,
            audit_notes=notes
        )

    @classmethod
    def _audit_medication(cls, med: MedicationItem) -> List[AmbiguityFlag]:
        flags: List[AmbiguityFlag] = []
        name_lower = med.name.lower()
        dosage_lower = (med.dosage or "").strip().lower()
        freq_lower = (med.frequency or "").strip().lower()

        # Check for missing or unknown dosage
        if not med.dosage or dosage_lower in ["unknown", "n/a", "none", "", "unspecified", "tbd"]:
            flags.append(AmbiguityFlag(
                item_id=med.id,
                item_type="medication",
                field_name="dosage",
                ambiguity_type=AmbiguityType.MISSING_DOSAGE,
                severity=SeverityLevel.HIGH,
                description=f"Medication '{med.name}' is missing an explicit milligram or unit dosage.",
                suggested_clarification_question=f"What is the exact strength/dosage for {med.name} (e.g. 5 mg, 500 mg)?",
                source_snippet=med.source_snippet
            ))

        # Check for generic "pain medication" placeholder without concrete drug
        if any(generic in name_lower for generic in ["pain medication", "pain meds", "pain pill", "analgesic"]):
            flags.append(AmbiguityFlag(
                item_id=med.id,
                item_type="medication",
                field_name="name",
                ambiguity_type=AmbiguityType.MISSING_DOSAGE,
                severity=SeverityLevel.HIGH,
                description=f"Generic reference '{med.name}' does not specify which active pharmaceutical drug to take.",
                suggested_clarification_question=f"Which specific pain medication was prescribed (e.g., Tylenol, Oxycodone, Celebrex)?",
                source_snippet=med.source_snippet
            ))

        # Check for PRN without daily max limit
        if med.is_prn or "as needed" in freq_lower or "prn" in freq_lower:
            spec = (med.special_instructions or "").lower()
            combined = f"{freq_lower} {spec}"
            if "max" not in combined and "exceed" not in combined and "limit" not in combined:
                flags.append(AmbiguityFlag(
                    item_id=med.id,
                    item_type="medication",
                    field_name="frequency",
                    ambiguity_type=AmbiguityType.UNBOUNDED_PRN,
                    severity=SeverityLevel.MEDIUM,
                    description=f"Medication '{med.name}' is prescribed 'as needed' without a maximum daily ceiling or dose limit.",
                    suggested_clarification_question=f"What is the maximum number of doses of {med.name} that can be safely taken in 24 hours?",
                    source_snippet=med.source_snippet
                ))

        # Check for vague frequency
        for pattern in [r"\bregularly\b", r"\bas instructed\b", r"\bperiodically\b"]:
            if re.search(pattern, freq_lower):
                flags.append(AmbiguityFlag(
                    item_id=med.id,
                    item_type="medication",
                    field_name="frequency",
                    ambiguity_type=AmbiguityType.VAGUE_FREQUENCY,
                    severity=SeverityLevel.MEDIUM,
                    description=f"Medication '{med.name}' has vague scheduling wording ('{med.frequency}').",
                    suggested_clarification_question=f"How many times per day or at what specific hours should {med.name} be taken?",
                    source_snippet=med.source_snippet
                ))

        return flags

    @classmethod
    def _audit_appointment(cls, apt: AppointmentItem) -> List[AmbiguityFlag]:
        flags: List[AmbiguityFlag] = []
        timeframe_lower = (apt.timeframe_description or "").lower().strip()

        for pattern in cls.VAGUE_TIMEFRAME_PATTERNS:
            if re.search(pattern, timeframe_lower):
                flags.append(AmbiguityFlag(
                    item_id=apt.id,
                    item_type="appointment",
                    field_name="timeframe_description",
                    ambiguity_type=AmbiguityType.VAGUE_TIMEFRAME,
                    severity=SeverityLevel.MEDIUM,
                    description=f"Appointment with '{apt.provider_name}' has an undefined timeframe ('{apt.timeframe_description}').",
                    suggested_clarification_question=f"Within what timeframe (e.g. 7 days, 2 weeks, 1 month) should the appointment with {apt.provider_name} be scheduled?",
                    source_snippet=apt.source_snippet
                ))
                break

        return flags

    @classmethod
    def _audit_task(cls, task: CareTaskItem) -> List[AmbiguityFlag]:
        flags: List[AmbiguityFlag] = []
        text_lower = f"{task.title} {task.description}".lower()

        # Check for vague regularity
        if re.search(r"\bregularly\b", text_lower) and not re.search(r"\b(daily|twice|every|\d+\s*times)\b", text_lower):
            flags.append(AmbiguityFlag(
                item_id=task.id,
                item_type="task",
                field_name="frequency",
                ambiguity_type=AmbiguityType.VAGUE_FREQUENCY,
                severity=SeverityLevel.MEDIUM,
                description=f"Task '{task.title}' specifies 'regularly' without defined hourly or daily intervals.",
                suggested_clarification_question=f"How often should '{task.title}' be performed (e.g. 3 times daily, before meals)?",
                source_snippet=task.source_snippet
            ))

        # Check for unquantified restrictions/tasks (e.g. limit screen time without duration)
        if "limit screen" in text_lower and not re.search(r"\b(\d+\s*min|\d+\s*hour|graduated)\b", text_lower):
            flags.append(AmbiguityFlag(
                item_id=task.id,
                item_type="task",
                field_name="description",
                ambiguity_type=AmbiguityType.INCOMPLETE_TASK,
                severity=SeverityLevel.LOW,
                description=f"Task '{task.title}' recommends limiting exertion without specific duration limits or rest intervals.",
                suggested_clarification_question="What is the recommended daily screen time limit in minutes/hours during recovery?",
                source_snippet=task.source_snippet
            ))

        return flags
