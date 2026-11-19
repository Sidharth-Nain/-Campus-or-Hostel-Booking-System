"""Shared overlap checks for the Campus Flow booking engine."""

from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus


def approved_conflict_id(
    database: Session,
    facility_id: int,
    starts_at: datetime,
    ends_at: datetime,
    exclude_booking_id: int | None = None,
) -> int | None:
    """Return an approved overlapping booking, if one exists.

    The strict comparisons intentionally use a half-open interval: a booking
    ending at 11:00 does not conflict with another starting at 11:00.
    """

    statement = (
        select(Booking.id)
        .where(
            Booking.facility_id == facility_id,
            Booking.status == BookingStatus.APPROVED,
            Booking.starts_at < ends_at,
            Booking.ends_at > starts_at,
        )
        .limit(1)
    )
    if exclude_booking_id is not None:
        statement = statement.where(Booking.id != exclude_booking_id)
    return database.scalar(statement)


def duplicate_student_request_id(
    database: Session,
    user_id: int,
    facility_id: int,
    starts_at: datetime,
    ends_at: datetime,
) -> int | None:
    """Detect an overlapping request the same student has already submitted."""

    return database.scalar(
        select(Booking.id)
        .where(
            Booking.user_id == user_id,
            Booking.facility_id == facility_id,
            Booking.starts_at < ends_at,
            Booking.ends_at > starts_at,
            or_(
                Booking.status == BookingStatus.PENDING,
                Booking.status == BookingStatus.APPROVED,
            ),
        )
        .limit(1)
    )
