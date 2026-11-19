import pytest
from backend.app.services.ai_extractor import AIExtractor
from backend.app.models.care_plan import ValidationStatus

SAMPLE_NOTE = """
PATIENT: Robert Miller, 64M.
HOSPITAL: St. Jude Heart Center.
DISCHARGE DIAGNOSIS: Status-post coronary artery bypass grafting.

DISCHARGE MEDICATIONS:
1. Aspirin 81 mg oral tablet daily with breakfast.
2. Metoprolol Tartrate 25 mg oral tablet twice daily.
3. Take pain medication as needed for chest wall discomfort.

APPOINTMENTS & FOLLOW-UP:
1. Follow-up with Dr. Vance in Cardiothoracic Surgery Clinic in 10 to 14 days.

CARE TASKS & MONITORING:
- Weigh yourself every morning after urination and before breakfast.
- Check and record blood pressure twice daily.

RED FLAG SYMPTOMS:
- Crushing chest pressure or shortness of breath at rest.
"""

def test_extract_medications():
    plan = AIExtractor.extract_care_plan(SAMPLE_NOTE, patient_name="Robert Miller")
    assert plan.patient_name == "Robert Miller"
    assert len(plan.medications) >= 3
    med_names = [m.name for m in plan.medications]
    assert any("Aspirin" in name for name in med_names)
    assert any("Metoprolol" in name for name in med_names)
    assert any("Pain" in name for name in med_names)

def test_source_snippet_provenance():
    plan = AIExtractor.extract_care_plan(SAMPLE_NOTE)
    for med in plan.medications:
        assert med.source_snippet is not None
        assert len(med.source_snippet) > 0
    for apt in plan.appointments:
        assert apt.source_snippet is not None

def test_extract_appointments_and_tasks():
    plan = AIExtractor.extract_care_plan(SAMPLE_NOTE)
    assert len(plan.appointments) >= 1
    assert "Dr. Vance" in plan.appointments[0].provider_name
    assert len(plan.tasks) >= 2
    assert len(plan.red_flags) >= 1

def test_dynamic_patient_extraction_without_preloaded_defaults():
    dynamic_note = """
    PATIENT: Arjun
    DIAGNOSIS: Acute Bronchitis
    HOSPITAL: City General Hospital
    DISCHARGE MEDS:
    1. Amoxicillin 500mg oral three times daily for 7 days.
    FOLLOW-UP SCHEDULE:
    1. Follow-up with Dr. Rajesh Patel in 7 days.
    """
    plan = AIExtractor.extract_care_plan(dynamic_note)
    assert plan.patient_name == "Arjun"
    assert "Bronchitis" in plan.diagnosis_summary
    assert len(plan.medications) == 1
    assert "Amoxicillin" in plan.medications[0].name
    # Ensure patient/diagnosis metadata was not leaked as a medication
    for m in plan.medications:
        assert "Arjun" not in m.name
        assert "Robert Miller" not in m.name
        assert "Bronchitis" not in m.name
    assert len(plan.appointments) == 1
    assert "Dr. Rajesh Patel" in plan.appointments[0].provider_name

def test_handwritten_doctor_prescription_extraction():
    rx_slip = """
    Dr. (Mrs.) Manisha Agarwal
    M.B.B.S., M.D. (Obst. & Gynae), General Physician
    Clinic Reg. No: 37511
    Patient Name: Arjun
    Age: 32 Yrs    BP: 120/80
    Rx:
    1. Tab Augmentin 625mg 1-0-1 x 5 days
    2. Tab Pantocid 40mg 1-0-0 AC x 5 days
    3. Tab Dolo 650mg SOS for fever
    4. Syrup Grilinctus 2 tsp TDS x 3 days
    Advise: Steam inhalation twice daily with warm water.
    Investigation: Complete Blood Count (CBC) with ESR.
    Follow-up: Review after 5 days with CBC report.
    """
    plan = AIExtractor.extract_care_plan(rx_slip)
    assert plan.patient_name == "Arjun"
    assert "Manisha Agarwal" in plan.primary_physician
    assert len(plan.medications) == 4
    med_names = [m.name for m in plan.medications]
    assert any("Augmentin" in n for n in med_names)
    assert any("Pantocid" in n for n in med_names)
    assert any("Dolo" in n for n in med_names)
    assert any("Grilinctus" in n for n in med_names)
    # Check 1-0-1 frequency was translated into Twice daily
    augmentin = next(m for m in plan.medications if "Augmentin" in m.name)
    assert "Twice daily" in augmentin.frequency
    # Check follow up appointment extracted
    assert len(plan.appointments) >= 1
    assert plan.appointments[0].target_day_offset == 5


