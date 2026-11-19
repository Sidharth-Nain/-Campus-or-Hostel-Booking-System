"""Administrator CRUD routes for the campus facility directory."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.database import get_db
from app.models import Facility, User
from app.schemas.facility import FacilityCreate, FacilityRead, FacilityUpdate


router = APIRouter(prefix="/admin/facilities")
DatabaseSession = Annotated[Session, Depends(get_db)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]


def get_managed_facility(facility_id: int, database: Session) -> Facility:
    """Return active or inactive facilities to an administrator."""

    facility = database.get(Facility, facility_id)
    if facility is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found.")
    return facility


def ensure_unique_location(
    database: Session,
    name: str,
    location: str,
    facility_id: int | None = None,
) -> None:
    """Keep duplicate facility and location combinations out of the directory."""

    statement = select(Facility.id).where(
        func.lower(Facility.name) == name.lower(),
        func.lower(Facility.location) == location.lower(),
    )
    if facility_id is not None:
        statement = statement.where(Facility.id != facility_id)
    if database.scalar(statement.limit(1)) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A facility with this name and location already exists.",
        )


def commit_facility(database: Session, facility: Facility) -> Facility:
    """Commit one change and translate a database race into a useful response."""

    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A facility with this name and location already exists.",
        ) from None
    database.refresh(facility)
    return facility


@router.get("", response_model=list[FacilityRead], summary="List facilities for management")
def list_managed_facilities(
    database: DatabaseSession,
    _: CurrentAdmin,
) -> list[Facility]:
    """Return active and inactive facilities for the administrator workspace."""

    statement = select(Facility).order_by(Facility.is_active.desc(), Facility.name)
    return list(database.scalars(statement))


@router.post(
    "",
    response_model=FacilityRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a facility",
)
def create_facility(
    payload: FacilityCreate,
    database: DatabaseSession,
    _: CurrentAdmin,
) -> Facility:
    """Add a validated, active facility to the campus directory."""

    ensure_unique_location(database, payload.name, payload.location)
    facility = Facility(**payload.model_dump(), is_active=True)
    database.add(facility)
    return commit_facility(database, facility)


@router.patch("/{facility_id}", response_model=FacilityRead, summary="Update a facility")
def update_facility(
    facility_id: int,
    payload: FacilityUpdate,
    database: DatabaseSession,
    _: CurrentAdmin,
) -> Facility:
    """Edit details or restore an inactive facility."""

    facility = get_managed_facility(facility_id, database)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("booking_mode", facility.booking_mode) != facility.booking_mode:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A facility's booking type cannot change once created.",
        )
    if changes.get("seat_tier", facility.seat_tier) != facility.seat_tier or (
        facility.booking_mode == "study_seat" and changes.get("capacity", facility.capacity) != facility.capacity
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The seat count and plan tier cannot be changed after creation.",
        )
    proposed_name = changes.get("name", facility.name)
    proposed_location = changes.get("location", facility.location)
    ensure_unique_location(database, proposed_name, proposed_location, facility.id)
    for field, value in changes.items():
        setattr(facility, field, value)
    return commit_facility(database, facility)


@router.delete("/{facility_id}", response_model=FacilityRead, summary="Deactivate a facility")
def deactivate_facility(
    facility_id: int,
    database: DatabaseSession,
    _: CurrentAdmin,
) -> Facility:
    """Remove a facility from student pages without deleting booking history."""

    facility = get_managed_facility(facility_id, database)
    facility.is_active = False
    return commit_facility(database, facility)
