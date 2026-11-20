"""Shared overlap checks for the Campus Flow booking engine."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import false, or_, select, union_all, update
from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus, Facility
from app.models.seat_pass import SeatPass


CAMPUS_ZONE = ZoneInfo("Asia/Kolkata")


def lock_booking_writes(database: Session, facility_id: int) -> None:
    """Hold the same facility lock as pass purchases until the transaction ends."""

    if database.get_bind().dialect.name == "sqlite":
        # SQLite serializes writers across tables, including a zero-row update.
        database.execute(update(Booking).where(false()).values(id=Booking.id))
    else:
        database.execute(select(Facility.id).where(Facility.id == facility_id).with_for_update())


def _utc(value: datetime) -> datetime:
    # SQLite returns stored UTC timestamps without the timezone marker.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _occupied_resources(
    facility_id: int,
    starts_at: datetime,
    ends_at: datetime,
    exclude_booking_id: int | None = None,
):
    """Select the occupied seat numbers. A NULL represents the entire room."""

    starts_at, ends_at = _utc(starts_at), _utc(ends_at)
    bookings = select(Booking.seat_number).where(
        Booking.facility_id == facility_id,
        Booking.status == BookingStatus.APPROVED,
        Booking.starts_at < ends_at,
        Booking.ends_at > starts_at,
    )
    if exclude_booking_id is not None:
        bookings = bookings.where(Booking.id != exclude_booking_id)

    first_day = starts_at.astimezone(CAMPUS_ZONE).date()
    last_day = (ends_at - timedelta(microseconds=1)).astimezone(CAMPUS_ZONE).date()
    passes = select(SeatPass.seat_number).where(
        SeatPass.facility_id == facility_id,
        SeatPass.status == "reserved",
        SeatPass.starts_on <= last_day,
        SeatPass.ends_on > first_day,
    )
    return union_all(bookings, passes).subquery()


def occupied_seats_for_slot(
    database: Session, facility: Facility, starts_at: datetime, ends_at: datetime,
) -> set[int]:
    resources = _occupied_resources(facility.id, starts_at, ends_at)
    seats = set(database.scalars(select(resources.c.seat_number)))
    return set(range(1, facility.capacity + 1)) if None in seats else seats


def reservation_conflicts(
    database: Session, facility_id: int, starts_at: datetime, ends_at: datetime,
    *, seat_number: int | None = None, exclude_booking_id: int | None = None,
) -> bool:
    resources = _occupied_resources(facility_id, starts_at, ends_at, exclude_booking_id)
    query = select(resources.c.seat_number)
    if seat_number is not None:
        query = query.where(or_(resources.c.seat_number.is_(None), resources.c.seat_number == seat_number))
    return bool(database.scalar(select(query.exists())))


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
