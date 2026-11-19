from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class NotificationChannel(str, Enum):
    SMS = "SMS"
    WHATSAPP = "WHATSAPP"
    PUSH = "PUSH"
    EMAIL = "EMAIL"

class DeliveryMode(str, Enum):
    SIMULATED = "SIMULATED"
    REAL_EMAIL = "REAL_EMAIL"
    REAL_SMS = "REAL_SMS"

class NotificationStatus(str, Enum):
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"

class NotificationMessage(BaseModel):
    id: str = Field(default_factory=lambda: f"notif-{uuid.uuid4().hex[:8]}")
    recipient_name: str
    phone_number: str
    recipient_email: Optional[str] = None
    channel: NotificationChannel = NotificationChannel.SMS
    delivery_mode: DeliveryMode = DeliveryMode.SIMULATED
    message_body: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    status: NotificationStatus = NotificationStatus.DELIVERED
    task_id: Optional[str] = None
    action_prompt: Optional[str] = "Reply 1 to confirm taken, or click link"
    action_taken: bool = False
    delivery_report: Optional[Dict[str, Any]] = None

class SendNotificationRequest(BaseModel):
    recipient_name: str = "Patient"
    phone_number: str = "+1 (555) 234-8901"
    recipient_email: Optional[str] = None
    channel: NotificationChannel = NotificationChannel.SMS
    delivery_mode: DeliveryMode = DeliveryMode.SIMULATED
    message_body: str
    task_id: Optional[str] = None
    smtp_config: Optional[Dict[str, Any]] = None
    twilio_config: Optional[Dict[str, Any]] = None

class NotificationReplyRequest(BaseModel):
    notification_id: str
    reply_text: str  # e.g. "1" or "YES" or "TAKEN"
