"""Small development seed set for the Day 2 facility interface."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Facility


STARTER_FACILITIES = (
    {
        "name": "Central Library Study Room",
        "description": "A quiet collaborative study room with a display and whiteboard.",
        "capacity": 8,
        "location": "Library, Level 1",
    },
    {
        "name": "Seminar Hall A",
        "description": "A presentation-ready space for talks, workshops, and society events.",
        "capacity": 80,
        "location": "Main Block, Floor 2",
    },
    {
        "name": "Computer Lab 3",
        "description": "A supervised lab with workstations for technical sessions.",
        "capacity": 40,
        "location": "Technology Block",
    },
    {
        "name": "Football Ground",
        "description": "An outdoor field for team practice and inter-college events.",
        "capacity": 120,
        "location": "South Campus",
    },
)


def seed_facilities(database: Session) -> None:
    """Add starter facilities once, without duplicating later launches."""

    existing = database.scalar(select(Facility.id).limit(1))
    if existing is not None:
        return

    database.add_all(Facility(**facility) for facility in STARTER_FACILITIES)
    database.commit()
