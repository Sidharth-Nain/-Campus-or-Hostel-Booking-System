"""Email notifications for administrator booking decisions."""

import logging
import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage

from app.core.config import get_settings
from app.models import BookingStatus


logger = logging.getLogger("campusflow.notifications")


def send_booking_decision_email(
    recipient_email: str,
    recipient_name: str,
    facility_name: str,
    starts_at: datetime,
    ends_at: datetime,
    decision: BookingStatus,
) -> None:
    """Send one decision email, or preview it safely during local development."""

    settings = get_settings()
    decision_text = "approved" if decision == BookingStatus.APPROVED else "rejected"
    subject = f"Campus Flow booking {decision_text}: {facility_name}"
    body = (
        f"Hello {recipient_name},\n\n"
        f"Your booking request for {facility_name} has been {decision_text}.\n"
        f"Start: {starts_at.isoformat()}\n"
        f"End: {ends_at.isoformat()}\n\n"
        "You can review the latest status in My bookings on Campus Flow.\n\n"
        "Campus Flow"
    )

    if not settings.smtp_host:
        logger.warning(
            "Development email preview | to=%s | subject=%s | %s",
            recipient_email,
            subject,
            body.replace("\n", " "),
        )
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from_email
    message["To"] = recipient_email
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            if settings.smtp_use_tls:
                server.starttls(context=ssl.create_default_context())
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
    except (OSError, smtplib.SMTPException):
        # Email delivery must not undo a decision already committed to the DB.
        logger.exception("Could not send booking decision email to %s", recipient_email)
