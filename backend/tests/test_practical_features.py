import pytest
import io
import pypdf
from backend.app.services.document_parser import DocumentParser
from backend.app.services.caregiver_service import CaregiverService
from backend.app.services.notification_service import NotificationService
from backend.app.models.caregiver import CaregiverMember, CaregiverRole
from backend.app.models.notification import SendNotificationRequest, NotificationChannel

def test_document_parser_image_ocr():
    dummy_bytes = b"fake image bytes"
    result = DocumentParser.parse_image(dummy_bytes, "prescription_slip.jpg")
    assert result["success"] is True
    assert "PATIENT" in result["text"]
    assert "MEDICATIONS" in result["text"]

def test_handwriting_cv_engine_image_parsing():
    import cv2
    import numpy as np

    img = np.ones((800, 600, 3), dtype=np.uint8) * 240
    cv2.putText(img, "Dr. Manisha Agarwal, MD", (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (20, 20, 20), 2)
    cv2.putText(img, "Patient: Arjun", (40, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (120, 30, 10), 2)
    cv2.putText(img, "Rx:", (40, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (20, 20, 20), 2)
    cv2.putText(img, "1. Tab Augmentin 625mg 1-0-1 for 5 days", (40, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (120, 30, 10), 2)
    cv2.putText(img, "Advise: Warm water gargle bd", (40, 320), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (120, 30, 10), 2)
    cv2.putText(img, "Follow up in 7 days", (40, 400), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (120, 30, 10), 2)

    _, buf = cv2.imencode(".png", img)
    img_bytes = buf.tobytes()

    result = DocumentParser.parse_image(img_bytes, "clinic_handwritten_prescription.png")
    assert result["success"] is True
    assert "Augmentin" in result["text"] or "Tab" in result["text"] or "Manisha" in result["text"]
    assert result.get("is_handwriting_optimized") is True

def test_caregiver_circle_management():
    circle = CaregiverService.get_or_create_circle("test-plan-1", "Robert Miller")
    assert len(circle.members) >= 2
    assert len(circle.activity_feed) >= 2

    # Add a new member
    new_member = CaregiverMember(
        name="Dr. Emily Thorne",
        relationship="Primary Care Physician",
        role=CaregiverRole.PHYSICIAN,
        phone_number="+1 555-908-1122"
    )
    updated = CaregiverService.add_member("test-plan-1", new_member)
    assert any(m.name == "Dr. Emily Thorne" for m in updated.members)
    assert any("Dr. Emily Thorne" in act.description for act in updated.activity_feed)

def test_notification_dispatch_and_reply():
    req = SendNotificationRequest(
        recipient_name="Robert Miller",
        phone_number="+1 555-123-4567",
        channel=NotificationChannel.SMS,
        message_body="Take Aspirin 81mg",
        task_id="tsk-123"
    )
    msg = NotificationService.send_notification(req)
    assert msg.id is not None
    assert msg.action_taken is False

    # Simulate two-way reply
    updated_msg = NotificationService.process_reply(msg.id, "1")
    assert updated_msg is not None
    assert updated_msg.action_taken is True
