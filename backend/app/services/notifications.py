import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()


def send_email_notification(to_email: str, subject: str, body: str) -> tuple[bool, str]:
    if not to_email:
        return False, "supplier email missing"

    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user).strip()
    smtp_tls = os.getenv("SMTP_USE_TLS", "1").strip() == "1"

    if not smtp_host or not smtp_user or not smtp_password or not smtp_from:
        return False, "SMTP is not configured"

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = smtp_from
    message["To"] = to_email
    message.set_content(body)

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            if smtp_tls:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(message)
        return True, "email sent"
    except Exception as exc:
        return False, f"email error: {exc}"
