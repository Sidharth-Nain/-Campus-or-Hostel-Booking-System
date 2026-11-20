"""One-time facility bookings for students and verified teachers."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.database import get_db
from app.models import Booking, BookingStatus, Facility, User, UserRole
from app.schemas.booking import (
    BookingAvailabilityRead,
    BookingAvailabilityRequest,
    BookingCreate,
    BookingRead,
)
from app.services.booking_conflicts import (
    duplicate_student_request_id,
    lock_booking_writes,
    occupied_seats_for_slot,
    reservation_conflicts,
)


router = APIRouter(prefix="/bookings")
DatabaseSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def get_owned_booking(booking_id: int, user_id: int, database: Session, *, lock: bool = False) -> Booking:
    """Find a booking belonging to the current user without exposing other users' data."""

    owned_booking = (Booking.id == booking_id, Booking.user_id == user_id)
    if lock:
        facility_id = database.scalar(select(Booking.facility_id).where(*owned_booking))
        if facility_id is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found.")
        lock_booking_writes(database, facility_id)
    booking = database.scalar(
        select(Booking)
        .options(joinedload(Booking.facility))
        .where(*owned_booking)
    )
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")
    return booking


def get_active_facility(facility_id: int, database: Session) -> Facility:
    """Return a bookable facility or a consistent not-found response."""

    facility = database.scalar(
        select(Facility).where(
            Facility.id == facility_id,
            Facility.is_active.is_(True),
        )
    )
    if facility is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found.")
    return facility


def get_requestable_facility(facility_id: int, database: Session, requester: User) -> Facility:
    """Apply the same role and room rules for preview and submission."""

    if requester.role not in {UserRole.STUDENT, UserRole.TEACHER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account cannot request bookings.")

    facility = get_active_facility(facility_id, database)
    if requester.role == UserRole.TEACHER and facility.booking_mode != "teaching":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teachers can reserve whole classrooms and teaching halls only. Libraries are for study.",
        )
    if requester.role == UserRole.STUDENT and facility.booking_mode == "teaching" and not facility.seat_layout:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified teacher accounts can request this classroom or teaching hall.",
        )
    return facility


@router.post(
    "/check-availability",
    response_model=BookingAvailabilityRead,
    summary="Check a facility time slot",
)
def check_booking_availability(
    payload: BookingAvailabilityRequest,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> BookingAvailabilityRead:
    """Return free seats or whole-space availability without identifying other students."""

    facility = get_requestable_facility(payload.facility_id, database, current_user)
    available_seats = None
    if current_user.role == UserRole.STUDENT and facility.seat_layout:
        occupied = occupied_seats_for_slot(database, facility, payload.starts_at, payload.ends_at)
        available_seats = [seat for seat in range(1, facility.capacity + 1) if seat not in occupied]
        available = bool(available_seats)
        message = "Choose an available seat." if available else "No seats are free for the full time slot."
    else:
        available = not reservation_conflicts(database, facility.id, payload.starts_at, payload.ends_at)
        message = "This space is available to request." if available else "A reservation overlaps this time slot."

    if available and duplicate_student_request_id(
        database, current_user.id, facility.id, payload.starts_at, payload.ends_at,
    ) is not None:
        available = False
        message = "You already have an overlapping booking or request at this facility."

    return BookingAvailabilityRead(
        **payload.model_dump(), is_available=available, message=message, available_seats=available_seats,
        seat_capacity=facility.capacity if available_seats is not None else None,
    )


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED, summary="Reserve a seat or request a whole facility")
def create_booking(
    payload: BookingCreate,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Booking:
    """Immediately confirm a numbered seat, or queue a whole-space request for review."""

    lock_booking_writes(database, payload.facility_id)
    facility = get_requestable_facility(payload.facility_id, database, current_user)
    seat = payload.seat_number
    if current_user.role == UserRole.STUDENT and facility.seat_layout:
        if seat is None or seat > facility.capacity:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Choose a seat numbered 1 to {facility.capacity}.")
    elif seat is not None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "This booking is for the whole space.")
    elif payload.purpose is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Enter a purpose for your whole-space request.")

    if reservation_conflicts(database, facility.id, payload.starts_at, payload.ends_at, seat_number=seat):
        detail = (
            "This seat is already reserved for part of that time."
            if seat is not None else "A reservation already occupies this space for part of that time."
        )
        raise HTTPException(status.HTTP_409_CONFLICT, detail)

    if duplicate_student_request_id(
        database,
        current_user.id,
        payload.facility_id,
        payload.starts_at,
        payload.ends_at,
    ) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an overlapping booking or request at this facility.",
        )

    booking = Booking(
        user_id=current_user.id,
        facility_id=payload.facility_id,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        seat_number=seat,
        purpose=payload.purpose or "Individual seat reservation",
        status=BookingStatus.APPROVED if seat is not None else BookingStatus.PENDING,
    )
    database.add(booking)
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Availability changed. Check your time slot again.") from None
    return get_owned_booking(booking.id, current_user.id, database)


@router.get("", response_model=list[BookingRead], summary="List my bookings")
def list_my_bookings(database: DatabaseSession, current_user: CurrentUser) -> list[Booking]:
    """Return only bookings requested by the authenticated user."""

    statement = (
        select(Booking)
        .options(joinedload(Booking.facility))
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

    booking = get_owned_booking(booking_id, current_user.id, database, lock=True)
    if booking.status not in {BookingStatus.PENDING, BookingStatus.APPROVED}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This booking can no longer be cancelled.",
        )

    booking.status = BookingStatus.CANCELLED
    booking.reviewed_by = None
    booking.reviewed_at = None
    database.commit()
    return get_owned_booking(booking.id, current_user.id, database)
