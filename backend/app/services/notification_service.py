from typing import List, Dict, Optional, Any
from datetime import datetime
from ..models.notification import (
    NotificationMessage,
    NotificationChannel,
    NotificationStatus,
    DeliveryMode,
    SendNotificationRequest
)
from .real_delivery_service import RealDeliveryService

class NotificationService:
    """
    CareBridge AI Mobile Push, SMS & Real Email Dispatcher.
    Delivers both simulated device previews and authentic real-world notifications.
    """

    MESSAGES: List[NotificationMessage] = []

    @classmethod
    def get_all_messages(cls) -> List[NotificationMessage]:
        return cls.MESSAGES

    @classmethod
    def send_notification(cls, req: SendNotificationRequest) -> NotificationMessage:
        delivery_report = None
        status = NotificationStatus.DELIVERED

        # 1. Real Email Delivery
        if req.delivery_mode == DeliveryMode.REAL_EMAIL and req.recipient_email:
            subject = f"CareBridge AI Care Reminder: {req.message_body[:40]}..."
            html = RealDeliveryService.generate_reminder_html(
                patient_name=req.recipient_name,
                task_title="Medication & Care Reminder",
                task_description=req.message_body,
                action_url="http://127.0.0.1:8000"
            )
            report = RealDeliveryService.send_real_email(
                to_email=req.recipient_email,
                subject=subject,
                text_body=req.message_body,
                html_body=html,
                smtp_config=req.smtp_config
            )
            delivery_report = report
            if not report.get("success"):
                status = NotificationStatus.FAILED

        # 2. Real SMS Delivery
        elif req.delivery_mode == DeliveryMode.REAL_SMS:
            report = RealDeliveryService.send_real_sms(
                to_phone=req.phone_number,
                message_body=req.message_body,
                twilio_config=req.twilio_config
            )
            delivery_report = report
            if not report.get("success"):
                status = NotificationStatus.FAILED

        # 3. Simulated Delivery
        else:
            delivery_report = {
                "success": True,
                "mode": "SIMULATED",
                "message": f"Simulated {req.channel} reminder rendered on device mockup"
            }

        msg = NotificationMessage(
            recipient_name=req.recipient_name,
            phone_number=req.phone_number,
            recipient_email=req.recipient_email,
            channel=req.channel,
            delivery_mode=req.delivery_mode,
            message_body=req.message_body,
            status=status,
            task_id=req.task_id,
            action_prompt="Reply 1 to confirm taken, or click link",
            action_taken=False,
            delivery_report=delivery_report
        )
        cls.MESSAGES.insert(0, msg)
        return msg

    @classmethod
    def process_reply(cls, notif_id: str, reply_text: str) -> Optional[NotificationMessage]:
        for msg in cls.MESSAGES:
            if msg.id == notif_id:
                msg.action_taken = True
                return msg
        return None
