"""Administrator review queue and booking-decision routes."""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_admin
from app.database import get_db
from app.models import Booking, BookingStatus, Facility, User
from app.schemas.booking import AdminBookingRead


router = APIRouter(prefix="/admin/bookings")
DatabaseSession = Annotated[Session, Depends(get_db)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]


def booking_with_details_statement():
    """Build the common query that includes student and facility details."""

    return select(Booking).options(
        joinedload(Booking.requester),
        joinedload(Booking.facility),
    )


def get_booking_for_review(booking_id: int, database: Session) -> Booking:
    """Return one booking with review details or a clear 404 response."""

    booking = database.scalar(
        booking_with_details_statement().where(Booking.id == booking_id)
    )
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")
    return booking


def ensure_pending(booking: Booking) -> None:
    """Prevent a second decision from replacing a completed decision."""

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending bookings can be reviewed.",
        )


@router.get("", response_model=list[AdminBookingRead], summary="List bookings for review")
def list_bookings_for_review(
    database: DatabaseSession,
    _: CurrentAdmin,
    booking_status: Annotated[
        str,
        Query(
            alias="status",
            pattern="^(all|pending|approved|rejected|cancelled)$",
            description="Filter by status. Use 'all' to return every booking.",
        ),
    ] = "pending",
) -> list[Booking]:
    """Return the administrator queue, pending by default."""

    statement = booking_with_details_statement().order_by(Booking.created_at.asc())
    if booking_status != "all":
        statement = statement.where(Booking.status == BookingStatus(booking_status))
    return list(database.scalars(statement).unique())


@router.patch("/{booking_id}/approve", response_model=AdminBookingRead, summary="Approve a booking")
def approve_booking(
    booking_id: int,
    database: DatabaseSession,
    current_admin: CurrentAdmin,
) -> Booking:
    """Approve a pending request when its facility interval remains available."""

    booking = get_booking_for_review(booking_id, database)
    ensure_pending(booking)

    facility = database.get(Facility, booking.facility_id)
    if facility is None or not facility.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This facility is no longer active.",
        )

    conflict = database.scalar(
        select(Booking.id)
        .where(
            Booking.id != booking.id,
            Booking.facility_id == booking.facility_id,
            Booking.status == BookingStatus.APPROVED,
            Booking.starts_at < booking.ends_at,
            Booking.ends_at > booking.starts_at,
        )
        .limit(1)
    )
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An approved booking already occupies this facility and time.",
        )

    booking.status = BookingStatus.APPROVED
    booking.reviewed_by = current_admin.id
    booking.reviewed_at = datetime.now(timezone.utc)
    try:
        database.commit()
    except IntegrityError:
        # PostgreSQL's exclusion constraint remains the final protection if two
        # administrators approve conflicting requests at nearly the same time.
        database.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another booking was approved for this facility and time.",
        ) from None

    return get_booking_for_review(booking.id, database)


@router.patch("/{booking_id}/reject", response_model=AdminBookingRead, summary="Reject a booking")
def reject_booking(
    booking_id: int,
    database: DatabaseSession,
    current_admin: CurrentAdmin,
) -> Booking:
    """Reject a pending request and record who made the decision."""

    booking = get_booking_for_review(booking_id, database)
    ensure_pending(booking)
    booking.status = BookingStatus.REJECTED
    booking.reviewed_by = current_admin.id
    booking.reviewed_at = datetime.now(timezone.utc)
    database.commit()
    return get_booking_for_review(booking.id, database)
