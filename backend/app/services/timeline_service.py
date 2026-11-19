from typing import List, Dict, Any
from ..models.care_plan import CarePlan

class TimelineService:
    """
    CareBridge AI Recovery Timeline Generator.
    Sequences appointments, milestone care tasks, and medication schedule limits
    into an intuitive day-by-day care roadmap.
    """

    @classmethod
    def generate_timeline(cls, care_plan: CarePlan) -> List[Dict[str, Any]]:
        # Define milestone phase buckets
        buckets = [
            {"phase": "Day 0 - Discharge & Immediate Home Setup", "day_min": 0, "day_max": 0, "events": []},
            {"phase": "Days 1 to 3 - Early Recovery & Vitals Baseline", "day_min": 1, "day_max": 3, "events": []},
            {"phase": "Days 4 to 7 - First Week Stabilization", "day_min": 4, "day_max": 7, "events": []},
            {"phase": "Days 8 to 14 - Critical Follow-ups & Wound Checks", "day_min": 8, "day_max": 14, "events": []},
            {"phase": "Days 15 to 30 - Rehabilitation & Specialist Reviews", "day_min": 15, "day_max": 30, "events": []},
            {"phase": "Day 30+ - Long-term Recovery & Maintenance", "day_min": 31, "day_max": 999, "events": []}
        ]

        # 1. Map Appointments
        for apt in care_plan.appointments:
            offset = apt.target_day_offset or 14
            event = {
                "id": apt.id,
                "type": "APPOINTMENT",
                "title": f"Visit: {apt.provider_name}",
                "subtitle": apt.specialty or "Clinic Consultation",
                "timeframe": apt.timeframe_description,
                "target_day_offset": offset,
                "validation_status": apt.validation_status,
                "details": apt.purpose,
                "urgency": "IMPORTANT"
            }
            cls._assign_to_bucket(buckets, offset, event)

        # 2. Map Key Milestone Tasks & Duration-bound Meds
        for task in care_plan.tasks:
            if "lab" in task.title.lower() or "draw" in task.title.lower():
                cls._assign_to_bucket(buckets, 10, {
                    "id": task.id,
                    "type": "LAB_MILESTONE",
                    "title": task.title,
                    "subtitle": "Diagnostic Testing",
                    "timeframe": "Day 10 Post-Discharge",
                    "target_day_offset": 10,
                    "validation_status": task.validation_status,
                    "details": task.description,
                    "urgency": "IMPORTANT"
                })
            elif "staple" in task.title.lower() or "suture" in task.title.lower():
                cls._assign_to_bucket(buckets, 14, {
                    "id": task.id,
                    "type": "PROCEDURE_MILESTONE",
                    "title": task.title,
                    "subtitle": "Wound & Suture Assessment",
                    "timeframe": "Day 12-14 Post-Discharge",
                    "target_day_offset": 14,
                    "validation_status": task.validation_status,
                    "details": task.description,
                    "urgency": "CRITICAL"
                })

        for med in care_plan.medications:
            if med.duration or "14 days" in med.frequency.lower():
                cls._assign_to_bucket(buckets, 14, {
                    "id": f"med-end-{med.id}",
                    "type": "MEDICATION_COMPLETION",
                    "title": f"Complete Course: {med.name}",
                    "subtitle": "Course Termination",
                    "timeframe": "Day 14",
                    "target_day_offset": 14,
                    "validation_status": med.validation_status,
                    "details": f"Expected completion of {med.name} ({med.dosage}). Do not stop prematurely without doctor guidance.",
                    "urgency": "ROUTINE"
                })

        # Remove empty buckets
        active_buckets = [b for b in buckets if len(b["events"]) > 0]
        return active_buckets

    @classmethod
    def _assign_to_bucket(cls, buckets: List[Dict[str, Any]], offset: int, event: Dict[str, Any]):
        for b in buckets:
            if b["day_min"] <= offset <= b["day_max"]:
                b["events"].append(event)
                return
        buckets[-1]["events"].append(event)
