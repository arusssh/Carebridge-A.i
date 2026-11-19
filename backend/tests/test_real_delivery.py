import pytest
from backend.app.services.real_delivery_service import RealDeliveryService

def test_real_delivery_service_html_generation():
    html = RealDeliveryService.generate_reminder_html(
        patient_name="Robert Miller",
        task_title="Take Metoprolol Tartrate 25mg",
        task_description="Take oral tablet twice daily with meals."
    )
    assert "CareBridge AI" in html
    assert "Robert Miller" in html
    assert "Metoprolol" in html
    assert "Mark as Taken" in html

def test_real_email_reports_missing_credentials_gracefully():
    # Without credentials, it should report a clear diagnostic message without crashing
    res = RealDeliveryService.send_real_email(
        to_email="test@example.com",
        subject="Test Reminder",
        text_body="Test Body"
    )
    assert res["success"] is False
    assert "credentials missing" in res["error"].lower()

def test_real_sms_reports_missing_credentials_gracefully():
    res = RealDeliveryService.send_real_sms(
        to_phone="+15551234567",
        message_body="Test SMS"
    )
    assert res["success"] is False
    assert "credentials missing" in res["error"].lower()
