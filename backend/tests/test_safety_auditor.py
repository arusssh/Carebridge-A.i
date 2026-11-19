import pytest
from backend.app.services.ai_extractor import AIExtractor
from backend.app.services.safety_auditor import SafetyAuditor
from backend.app.models.care_plan import ValidationStatus
from backend.app.models.safety import AmbiguityType

def test_safety_audit_flags_missing_dosage():
    vague_text = """
    DISCHARGE MEDICATIONS:
    1. Take pain medication as needed for chest wall discomfort.
    2. Check blood sugar regularly.
    """
    plan = AIExtractor.extract_care_plan(vague_text)
    audit = SafetyAuditor.audit_care_plan(plan)

    assert audit.ambiguities_count >= 1
    # Check that pain medication was flagged
    flag_types = [f.ambiguity_type for f in audit.flags]
    assert AmbiguityType.MISSING_DOSAGE in flag_types or AmbiguityType.UNBOUNDED_PRN in flag_types
    # Check that safety score is reduced from 100
    assert audit.safety_score < 100.0

def test_human_validation_clears_flag():
    text = "DISCHARGE MEDICATIONS:\n1. Aspirin 81 mg oral tablet daily."
    plan = AIExtractor.extract_care_plan(text)
    # Validate manually
    plan.medications[0].validation_status = ValidationStatus.HUMAN_VALIDATED
    audit = SafetyAuditor.audit_care_plan(plan)
    assert audit.safety_score == 100.0
    assert audit.ambiguities_count == 0
