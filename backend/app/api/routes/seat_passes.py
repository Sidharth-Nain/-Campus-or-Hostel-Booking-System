"""Reserve, list, and cancel student demo seat passes."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.database import get_db
from app.models import User, UserRole
from app.models.seat_pass import SeatPass
from app.schemas.seat_pass import SeatPassAvailability, SeatPassCreate, SeatPassPlan, SeatPassRead
from app.services.seat_passes import (
    OWN_PASS_CONFLICT,
    SEAT_PASS_PLANS,
    campus_today,
    get_seat_facility,
    lock_pass_writes,
    occupied_seats,
    plan_period,
    student_has_pass,
)


router = APIRouter(prefix="/seat-passes")
DatabaseSession = Annotated[Session, Depends(get_db)]


def get_current_student(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Seat passes are available to students only.")
    return current_user


CurrentStudent = Annotated[User, Depends(get_current_student)]


@router.get("/plans", response_model=list[SeatPassPlan], summary="List demo student seat plans")
def list_plans() -> tuple[SeatPassPlan, ...]:
    """Return fixed-duration plans with sample prices. No payment or renewal is performed."""

    return SEAT_PASS_PLANS


@router.get("/availability", response_model=SeatPassAvailability, summary="Find seats free for a whole plan period")
def check_seat_availability(
    database: DatabaseSession,
    student: CurrentStudent,
    plan_id: Annotated[str, Query(min_length=1, max_length=32)],
    facility_id: Annotated[int, Query(gt=0)],
    starts_on: date,
) -> SeatPassAvailability:
    plan, ends_on = plan_period(plan_id, starts_on)
    facility = get_seat_facility(database, facility_id, plan)
    if student_has_pass(database, student.id, starts_on, ends_on):
        seats, message = [], OWN_PASS_CONFLICT
    else:
        taken = occupied_seats(database, facility.id, starts_on, ends_on)
        seats = [seat for seat in range(1, facility.capacity + 1) if seat not in taken]
        message = None if seats else "No seats are available for the full period."
    return SeatPassAvailability(
        facility_id=facility.id, starts_on=starts_on, ends_on=ends_on, available_seats=seats, message=message,
    )


@router.post("", response_model=SeatPassRead, status_code=status.HTTP_201_CREATED, summary="Reserve a numbered seat")
def reserve_seat(payload: SeatPassCreate, database: DatabaseSession, student: CurrentStudent) -> SeatPass:
    lock_pass_writes(database, student.id)
    plan, ends_on = plan_period(payload.plan_id, payload.starts_on)
    facility = get_seat_facility(database, payload.facility_id, plan, lock=True)
    if payload.seat_number > facility.capacity:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "That seat does not exist at this facility.")
    if student_has_pass(database, student.id, payload.starts_on, ends_on):
        raise HTTPException(status.HTTP_409_CONFLICT, OWN_PASS_CONFLICT)
    if payload.seat_number in occupied_seats(database, facility.id, payload.starts_on, ends_on):
        raise HTTPException(status.HTTP_409_CONFLICT, "That seat is already reserved for part of this period.")

    reservation = SeatPass(
        user_id=student.id, facility=facility, plan_id=plan.id, price_inr=plan.price_inr,
        seat_number=payload.seat_number, starts_on=payload.starts_on, ends_on=ends_on,
    )
    database.add(reservation)
    database.commit()
    return reservation


@router.get("", response_model=list[SeatPassRead], summary="List my seat passes")
def list_my_passes(database: DatabaseSession, student: CurrentStudent) -> list[SeatPass]:
    return list(database.scalars(
        select(SeatPass).options(joinedload(SeatPass.facility))
        .where(SeatPass.user_id == student.id)
        .order_by(SeatPass.starts_on.desc(), SeatPass.id.desc())
    ))


@router.patch("/{reservation_id}/cancel", response_model=SeatPassRead, summary="Cancel my seat pass")
def cancel_seat_pass(
    reservation_id: Annotated[int, Path(gt=0)], database: DatabaseSession, student: CurrentStudent,
) -> SeatPass:
    lock_pass_writes(database, student.id)
    reservation = database.scalar(
        select(SeatPass).options(joinedload(SeatPass.facility))
        .where(SeatPass.id == reservation_id, SeatPass.user_id == student.id)
    )
    if reservation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Seat pass not found.")
    if reservation.status != "reserved" or reservation.ends_on <= campus_today():
        raise HTTPException(status.HTTP_409_CONFLICT, "This seat pass can no longer be cancelled.")
    reservation.status = "cancelled"
    database.commit()
    return reservation
