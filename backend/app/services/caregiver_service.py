from typing import Dict, List, Optional
from datetime import datetime
from ..models.caregiver import CareCircle, CaregiverMember, CareActivityLogItem, CaregiverRole

class CaregiverService:
    """
    Caregiver Multi-User Synchronization & Care Circle Collaboration Service.
    Coordinates between patient, adult family caregivers, and home health nurses.
    """

    # In-memory stores for Care Circles
    CIRCLES: Dict[str, CareCircle] = {}

    @classmethod
    def get_or_create_circle(cls, care_plan_id: str, patient_name: str = "Patient") -> CareCircle:
        if care_plan_id in cls.CIRCLES:
            return cls.CIRCLES[care_plan_id]

        # Initialize default collaborative care circle
        circle = CareCircle(
            care_plan_id=care_plan_id,
            patient_name=patient_name,
            members=[
                CaregiverMember(
                    name="Primary Caregiver",
                    relationship="Family Advocate",
                    role=CaregiverRole.PRIMARY_CAREGIVER,
                    phone_number="+1 (555) 438-9201",
                    email="caregiver@carebridge.local",
                    receive_sms=True,
                    receive_missed_dose_alerts=True,
                    can_complete_tasks=True
                ),
                CaregiverMember(
                    name="Elena Rostova, RN",
                    relationship="Visiting Nurse",
                    role=CaregiverRole.HOME_NURSE,
                    phone_number="+1 (555) 890-1123",
                    email="rostova.rn@metrohealth.org",
                    receive_sms=True,
                    receive_missed_dose_alerts=True,
                    can_complete_tasks=True
                )
            ],
            activity_feed=[
                CareActivityLogItem(
                    actor_name="Clinical Care Coordinator",
                    actor_role="Care Team Lead",
                    action_type="CIRCLE_INITIALIZED",
                    description=f"Initialized secure clinical care circle for {patient_name}."
                ),
                CareActivityLogItem(
                    actor_name="CareBridge Safety AI",
                    actor_role="Clinical Guardrail Engine",
                    action_type="SYSTEM_READY",
                    description=f"Automated dosage ambiguity guardrails activated for {patient_name}."
                )
            ]
        )
        cls.CIRCLES[care_plan_id] = circle
        return circle

    @classmethod
    def add_member(cls, care_plan_id: str, member: CaregiverMember) -> CareCircle:
        circle = cls.get_or_create_circle(care_plan_id)
        circle.members.append(member)
        circle.activity_feed.insert(0, CareActivityLogItem(
            actor_name="Care Coordinator",
            actor_role="System",
            action_type="MEMBER_ADDED",
            description=f"Added {member.name} ({member.relationship}) to Care Circle as {member.role}."
        ))
        return circle

    @classmethod
    def log_activity(cls, care_plan_id: str, actor_name: str, actor_role: str, action_type: str, description: str, item_id: Optional[str] = None):
        circle = cls.get_or_create_circle(care_plan_id)
        circle.activity_feed.insert(0, CareActivityLogItem(
            actor_name=actor_name,
            actor_role=actor_role,
            action_type=action_type,
            description=description,
            item_id=item_id
        ))
        # Keep latest 50 entries
        if len(circle.activity_feed) > 50:
            circle.activity_feed = circle.activity_feed[:50]
        return circle
