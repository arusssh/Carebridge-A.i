import os
import smtplib
import urllib.request
import urllib.parse
import base64
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional

class RealDeliveryService:
    """
    CareBridge AI Real-World Communication Dispatcher.
    Delivers authentic emails and cellular SMS to real devices.
    """

    @classmethod
    def send_real_email(
        cls,
        to_email: str,
        subject: str,
        text_body: str,
        html_body: Optional[str] = None,
        smtp_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Sends an authentic email from 'CareBridge AI' to any valid inbox using SMTP.
        Defaults to environment variables if smtp_config is not provided.
        """
        cfg = smtp_config or {}
        host = cfg.get("host") or os.environ.get("SMTP_HOST", "smtp.gmail.com")
        port = int(cfg.get("port") or os.environ.get("SMTP_PORT", 587))
        user = cfg.get("user") or os.environ.get("SMTP_USER", "")
        password = cfg.get("password") or os.environ.get("SMTP_PASSWORD", "")
        from_email = cfg.get("from_email") or user or "reminders@carebridge.ai"
        from_name = cfg.get("from_name", "CareBridge AI")

        if not user or not password:
            return {
                "success": False,
                "error": "SMTP credentials missing. Please provide your Email/App Password in the Gateway Settings card.",
                "details": f"Attempted to send to {to_email} via {host}:{port}"
            }

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_email}>"
            msg["To"] = to_email

            part1 = MIMEText(text_body, "plain")
            msg.attach(part1)

            if html_body:
                part2 = MIMEText(html_body, "html")
                msg.attach(part2)

            with smtplib.SMTP(host, port, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, password)
                server.sendmail(from_email, [to_email], msg.as_string())

            return {
                "success": True,
                "message": f"Real email delivered to {to_email} from '{from_name}'!",
                "recipient": to_email,
                "host": host
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to deliver email: {str(e)}",
                "recipient": to_email
            }

    @classmethod
    def send_real_sms(
        cls,
        to_phone: str,
        message_body: str,
        twilio_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Sends an authentic SMS to a real mobile number via Twilio API.
        """
        cfg = twilio_config or {}
        account_sid = cfg.get("account_sid") or os.environ.get("TWILIO_ACCOUNT_SID", "")
        auth_token = cfg.get("auth_token") or os.environ.get("TWILIO_AUTH_TOKEN", "")
        from_number = cfg.get("from_number") or os.environ.get("TWILIO_PHONE_NUMBER", "")

        if not account_sid or not auth_token or not from_number:
            return {
                "success": False,
                "error": "Twilio SMS credentials missing. Please enter your Twilio Account SID, Auth Token, and Twilio Phone Number in the Gateway Settings panel.",
                "details": f"Target phone: {to_phone}"
            }

        # Format target phone (ensure E.164 formatting)
        clean_phone = to_phone.strip()
        if not clean_phone.startswith("+"):
            clean_phone = f"+{clean_phone}"

        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        payload = urllib.parse.urlencode({
            "To": clean_phone,
            "From": from_number,
            "Body": f"CareBridge AI: {message_body}"
        }).encode("utf-8")

        auth_header = base64.b64encode(f"{account_sid}:{auth_token}".encode("utf-8")).decode("ascii")
        req = urllib.request.Request(url, data=payload, method="POST")
        req.add_header("Authorization", f"Basic {auth_header}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                return {
                    "success": True,
                    "message": f"Real SMS dispatched to {to_phone} via cellular carrier!",
                    "sid": res_body.get("sid"),
                    "status": res_body.get("status")
                }
        except urllib.error.HTTPError as e:
            err_content = e.read().decode("utf-8")
            return {
                "success": False,
                "error": f"Twilio API Error ({e.code}): {err_content}",
                "recipient": to_phone
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to send SMS: {str(e)}",
                "recipient": to_phone
            }

    @classmethod
    def generate_reminder_html(cls, patient_name: str, task_title: str, task_description: str, action_url: str = "#") -> str:
        """Generates an empathetic, clean, clinical HTML email."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
            .card {{ max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #0284c7, #0d9488); padding: 24px; color: #ffffff; }}
            .header h1 {{ margin: 0; font-size: 20px; }}
            .content {{ padding: 24px; color: #1e293b; line-height: 1.6; font-size: 14px; }}
            .task-box {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0; }}
            .btn {{ display: inline-block; background-color: #0d9488; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 12px; }}
            .footer {{ background: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>CareBridge AI &bull; Healthcare Companion</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Prescribed Care Reminder for {patient_name}</p>
            </div>
            <div class="content">
              <p>Hello <strong>{patient_name}</strong>,</p>
              <p>This is your automated care coordination reminder from <strong>CareBridge AI</strong>.</p>
              <div class="task-box">
                <strong style="color: #166534; font-size: 16px;">{task_title}</strong>
                <p style="margin: 6px 0 0 0; color: #374151;">{task_description}</p>
              </div>
              <p>Once completed, confirm your task to keep your family care circle updated:</p>
              <a href="{action_url}" class="btn">Mark as Taken / Completed</a>
            </div>
            <div class="footer">
              Sent safely by CareBridge AI. Never alter medication doses without consulting your physician.
            </div>
          </div>
        </body>
        </html>
        """
