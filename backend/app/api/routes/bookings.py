"""Authenticated student booking routes for the Day 6 milestone."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models import Booking, BookingStatus, Facility, User, UserRole
from app.schemas.booking import BookingCreate, BookingRead


router = APIRouter(prefix="/bookings")
DatabaseSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def get_owned_booking(booking_id: int, user_id: int, database: Session) -> Booking:
    """Find a booking belonging to the current user without exposing other users' data."""

    booking = database.scalar(
        select(Booking).where(Booking.id == booking_id, Booking.user_id == user_id)
    )
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")
    return booking


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED, summary="Request a facility booking")
def create_booking(
    payload: BookingCreate,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Booking:
    """Create a pending request after basic facility and overlap validation."""

    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only student accounts can request bookings.",
        )

    facility = database.scalar(
        select(Facility).where(
            Facility.id == payload.facility_id,
            Facility.is_active.is_(True),
        )
    )
    if facility is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found.")

    # Approved reservations block everyone. A student's own pending request also
    # blocks an identical overlapping request, preventing accidental duplicates.
    conflict = database.scalar(
        select(Booking.id)
        .where(
            Booking.facility_id == payload.facility_id,
            Booking.starts_at < payload.ends_at,
            Booking.ends_at > payload.starts_at,
            or_(
                Booking.status == BookingStatus.APPROVED,
                and_(
                    Booking.user_id == current_user.id,
                    Booking.status == BookingStatus.PENDING,
                ),
            ),
        )
        .limit(1)
    )
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This facility already has a conflicting booking or request.",
        )

    booking = Booking(
        user_id=current_user.id,
        facility_id=payload.facility_id,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        purpose=payload.purpose,
        status=BookingStatus.PENDING,
    )
    database.add(booking)
    database.commit()
    database.refresh(booking)
    return booking


@router.get("", response_model=list[BookingRead], summary="List my bookings")
def list_my_bookings(database: DatabaseSession, current_user: CurrentUser) -> list[Booking]:
    """Return only bookings requested by the authenticated user."""

    statement = (
        select(Booking)
        .where(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
    )
    return list(database.scalars(statement))


@router.get("/{booking_id}", response_model=BookingRead, summary="Get one of my bookings")
def read_my_booking(
    booking_id: int,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Booking:
    """Return one booking only when it belongs to the authenticated user."""

    return get_owned_booking(booking_id, current_user.id, database)


@router.patch("/{booking_id}/cancel", response_model=BookingRead, summary="Cancel my booking")
def cancel_my_booking(
    booking_id: int,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Booking:
    """Cancel a pending or approved booking owned by the current user."""

    booking = get_owned_booking(booking_id, current_user.id, database)
    if booking.status not in {BookingStatus.PENDING, BookingStatus.APPROVED}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This booking can no longer be cancelled.",
        )

    booking.status = BookingStatus.CANCELLED
    booking.reviewed_by = None
    booking.reviewed_at = None
    database.commit()
    database.refresh(booking)
    return booking
