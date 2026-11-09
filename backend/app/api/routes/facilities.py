"""Read-only facility endpoints for the Day 4 database milestone."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Facility
from app.schemas.facility import FacilityRead


router = APIRouter(prefix="/facilities")


@router.get("", response_model=list[FacilityRead], summary="List active facilities")
def list_facilities(database: Session = Depends(get_db)) -> list[Facility]:
    """Return facilities students can currently browse."""

    statement = select(Facility).where(Facility.is_active.is_(True)).order_by(Facility.name)
    return list(database.scalars(statement))


@router.get("/{facility_id}", response_model=FacilityRead, summary="Get one facility")
def get_facility(facility_id: int, database: Session = Depends(get_db)) -> Facility:
    """Return a selected active facility, or a clear not-found response."""

    facility = database.scalar(
        select(Facility).where(Facility.id == facility_id, Facility.is_active.is_(True))
    )
    if facility is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found.")
    return facility
