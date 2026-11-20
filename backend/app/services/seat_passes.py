"""Plan rules, interval checks, and transaction locks for numbered seats."""

from datetime import date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy import false, select, update
from sqlalchemy.orm import Session

from app.models import Facility, User
from app.models.seat_pass import SeatPass
from app.schemas.seat_pass import SeatPassPlan
from app.services.booking_conflicts import CAMPUS_ZONE, occupied_seats_for_slot


OWN_PASS_CONFLICT = "You already have a seat pass that overlaps these dates."
SEAT_PASS_PLANS = (
    SeatPassPlan(id="focus-week", name="Focus Week", description="Keep one quiet desk for a week of focused study.", price_inr=99, days=7, tier=1),
    SeatPassPlan(id="study-sprint", name="Study Sprint", description="Choose a quiet desk, reading carrel, or group study bay for two weeks.", price_inr=179, days=14, tier=2),
    SeatPassPlan(id="campus-desk", name="Campus Desk", description="Add Coding Commons desks to your choices for 30 days.", price_inr=299, days=30, tier=3),
    SeatPassPlan(id="studio-desk", name="Studio Desk", description="Choose from every seat-pass space, including research workstations, for 30 days.", price_inr=449, days=30, tier=4),
)
PLANS_BY_ID = {plan.id: plan for plan in SEAT_PASS_PLANS}


def campus_today() -> date:
    return datetime.now(CAMPUS_ZONE).date()


def plan_period(plan_id: str, starts_on: date) -> tuple[SeatPassPlan, date]:
    plan = PLANS_BY_ID.get(plan_id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Seat plan not found.")
    if starts_on < campus_today():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Choose today or a later campus date.")
    try:
        return plan, starts_on + timedelta(days=plan.days)
    except OverflowError:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "The start date is too far in the future.") from None


def lock_pass_writes(database: Session, user_id: int) -> None:
    """Serialize SQLite writes or lock the student before any PostgreSQL facility lock."""

    if database.get_bind().dialect.name == "sqlite":
        database.execute(update(SeatPass).where(false()).values(id=SeatPass.id))
    else:
        # NO KEY UPDATE serializes pass purchases by this student while allowing
        # a simultaneous hourly booking to verify its foreign key to the user.
        database.execute(select(User.id).where(User.id == user_id).with_for_update(key_share=True)).scalar_one()


def get_seat_facility(
    database: Session, facility_id: int, plan: SeatPassPlan, *, lock: bool = False
) -> Facility:
    statement = select(Facility).where(Facility.id == facility_id)
    if lock:
        statement = statement.with_for_update()
    facility = database.scalar(statement)
    if facility is None or not facility.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Facility not found.")
    if facility.booking_mode != "study_seat" or facility.seat_tier is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "This facility does not offer numbered seats.")
    if facility.seat_tier > plan.tier:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This facility requires a higher seat plan.")
    return facility


def overlapping_passes(starts_on: date, ends_on: date) -> tuple:
    return (SeatPass.status == "reserved", SeatPass.starts_on < ends_on, SeatPass.ends_on > starts_on)


def student_has_pass(database: Session, user_id: int, starts_on: date, ends_on: date) -> bool:
    return database.scalar(
        select(SeatPass.id)
        .where(SeatPass.user_id == user_id, *overlapping_passes(starts_on, ends_on))
        .limit(1)
    ) is not None


def occupied_seats(database: Session, facility: Facility, starts_on: date, ends_on: date) -> set[int]:
    """Check the same numbered-seat inventory as hourly bookings for the entire pass."""

    starts_at = datetime.combine(starts_on, time.min, CAMPUS_ZONE)
    ends_at = datetime.combine(ends_on, time.min, CAMPUS_ZONE)
    return occupied_seats_for_slot(database, facility, starts_at, ends_at)
