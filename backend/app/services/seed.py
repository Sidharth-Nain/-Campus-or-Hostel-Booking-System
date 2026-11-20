"""Starter campus catalog and compatibility for databases from earlier days."""

from sqlalchemy import Engine, func, inspect, select, text, update
from sqlalchemy.dialects.postgresql import insert as postgres_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from app.models import Facility


def facility_row(
    name: str,
    description: str,
    capacity: int,
    location: str,
    category: str,
    amenities: tuple[str, ...],
    booking_mode: str = "standard",
    seat_tier: int | None = None,
    seat_layout: str | None = None,
) -> dict:
    return {
        "name": name,
        "description": description,
        "capacity": capacity,
        "location": location,
        "category": category,
        "amenities": list(amenities),
        "booking_mode": booking_mode,
        "seat_tier": seat_tier,
        "seat_layout": seat_layout,
    }


LEGACY_FACILITIES = (
    facility_row("Central Library Study Room", "A quiet collaborative study room with a display and whiteboard.", 8,
                 "Library, Level 1", "Study", ("Quiet zone", "Whiteboard", "Display", "Wi-Fi"), "study_room", seat_layout="library"),
    facility_row("Seminar Hall A", "A presentation-ready space for talks, workshops, and society events.", 80,
                 "Main Block, Floor 2", "Events", ("Projector", "PA system", "Wi-Fi", "Air conditioning")),
    facility_row("Computer Lab 3", "A supervised lab with workstations for technical sessions.", 40,
                 "Technology Block", "Labs", ("Desktop computers", "Projector", "Internet", "Air conditioning"), seat_layout="lab"),
    facility_row("Football Ground", "An outdoor field for team practice and inter-college events.", 120,
                 "South Campus", "Sports", ("Full-size pitch", "Goal posts", "Changing rooms", "Floodlights")),
    facility_row("Innovation Studio", "A flexible project room for maker sessions and teamwork.", 20,
                 "Innovation Centre", "Creative", ("Project worktables", "Whiteboards", "Display", "Wi-Fi"), seat_layout="studio"),
    facility_row("Basketball Court", "An indoor court for training and recreational games.", 30,
                 "Sports Complex", "Sports", ("Scoreboard", "Changing rooms", "Drinking water", "Indoor court")),
)


STARTER_FACILITIES = (
    *LEGACY_FACILITIES,
    facility_row("AI Lab", "A practical lab for machine learning workshops and development projects.", 40,
                 "Technology Block, Floor 2", "Labs", ("GPU workstations", "Projector", "Internet", "Air conditioning"), seat_layout="lab"),
    facility_row("Robotics Lab", "A supervised workbench space for prototyping and testing robotics projects.", 24,
                 "Engineering Block, Ground floor", "Labs", ("Electronics benches", "Soldering stations", "Tool kits", "Internet"), seat_layout="lab"),
    facility_row("Design Workshop", "A workshop with large tables for model-making and collaborative design.", 20,
                 "Arts Centre, Floor 1", "Creative", ("Cutting mats", "Large worktables", "Tool storage", "Sink"), seat_layout="studio"),
    facility_row("Badminton Court", "A marked indoor court suitable for singles or doubles games.", 8,
                 "Indoor Sports Centre, Court 1", "Sports", ("Net", "Non-slip floor", "Changing rooms", "Drinking water")),
    facility_row("Table Tennis Room", "An indoor training room with tables for student matches and practice.", 12,
                 "Indoor Sports Centre, Floor 1", "Sports", ("Four tables", "Paddles", "Equipment storage", "Ventilation")),
    facility_row("Classroom North 101", "A full classroom for tutorials, guest teaching, and revision sessions.", 32,
                 "North Academic Block, Ground floor", "Teaching", ("Whiteboard", "Projector", "Wi-Fi", "Air conditioning"), "teaching", seat_layout="classroom"),
    facility_row("Classroom North 204", "A flexible classroom for group instruction and discussion-based lessons.", 36,
                 "North Academic Block, Floor 2", "Teaching", ("Movable desks", "Whiteboard", "Projector", "Wi-Fi"), "teaching", seat_layout="classroom"),
    facility_row("Smart Classroom C12", "An accessible teaching room for hybrid classes and demonstrations.", 48,
                 "Learning Centre, Floor 1", "Teaching", ("Interactive display", "Video conferencing", "Wi-Fi", "Step-free access"), "teaching", seat_layout="classroom"),
    facility_row("Lecture Hall East", "A tiered hall for large classes, academic workshops, and guest lectures.", 140,
                 "East Academic Block, Ground floor", "Teaching", ("Projector", "Microphones", "Hearing loop", "Step-free access"), "teaching"),
    facility_row("Quiet Study Desks", "Numbered desks in the library's supervised quiet study area.", 24,
                 "Library, Level 2", "Study", ("Power outlets", "Wi-Fi", "Desk lamps", "Quiet zone"), "study_seat", 1, "library"),
    facility_row("Silent Reading Carrels", "Individual carrels for uninterrupted reading and long study sessions.", 16,
                 "Library, Level 3", "Study", ("Desk dividers", "Adjustable lighting", "Power outlets", "Quiet zone"), "study_seat", 2, "library"),
    facility_row("Group Study Desk Bay", "Numbered desks in an open study bay where low-volume discussion is welcome.", 20,
                 "Student Commons, Level 1", "Study", ("Whiteboards", "Power outlets", "Wi-Fi", "Step-free access"), "study_seat", 2, "library"),
    facility_row("Coding Commons Desks", "Reserved workstation seats for sustained programming and practice.", 18,
                 "Technology Block, Floor 1", "Study", ("Desktop computers", "Dual monitors", "Internet", "Air conditioning"), "study_seat", 3, "lab"),
    facility_row("Research Workstations", "Numbered workstations for extended research and independent projects.", 12,
                 "Learning Centre, Floor 2", "Study", ("Workstations", "External monitors", "Internet", "Adjustable chairs"), "study_seat", 4, "lab"),
)


CATALOG_COLUMNS = {
    "category": "VARCHAR(40) NOT NULL DEFAULT 'General'",
    "amenities": "JSON NOT NULL DEFAULT '[]'",
    "booking_mode": "VARCHAR(20) NOT NULL DEFAULT 'standard'",
    "seat_tier": "INTEGER",
    "seat_layout": "VARCHAR(20) CHECK (seat_layout IN ('lab', 'classroom', 'library', 'studio'))",
}


def upgrade_facility_catalog(engine: Engine) -> None:
    """Add catalog metadata in place before reading facilities on startup."""

    with engine.begin() as connection:
        if engine.dialect.name == "sqlite":
            connection.exec_driver_sql("BEGIN IMMEDIATE")
        elif engine.dialect.name == "postgresql":
            connection.execute(text("SELECT pg_advisory_xact_lock(hashtext('campusflow_facility_catalog'))"))
        existing = {column["name"] for column in inspect(connection).get_columns("facilities")}
        added = []
        for name, definition in CATALOG_COLUMNS.items():
            if name not in existing:
                connection.exec_driver_sql(f"ALTER TABLE facilities ADD COLUMN {name} {definition}")
                added.append(name)

        if not added:
            return
        if "seat_layout" in added:
            connection.execute(
                update(Facility)
                .where(Facility.booking_mode.in_(("study_room", "study_seat")))
                .values(seat_layout="library", updated_at=Facility.updated_at)
            )
        for record in STARTER_FACILITIES:
            connection.execute(
                update(Facility)
                .where(
                    func.lower(Facility.name) == record["name"].lower(),
                    func.lower(Facility.location) == record["location"].lower(),
                )
                .values(updated_at=Facility.updated_at, **{column: record[column] for column in added})
            )


def seed_facilities(database: Session) -> None:
    """Add missing catalog records without modifying any existing facilities."""

    existing = {
        (name.lower(), location.lower())
        for name, location in database.execute(select(Facility.name, Facility.location))
    }
    missing = [
        record for record in STARTER_FACILITIES
        if (record["name"].lower(), record["location"].lower()) not in existing
    ]
    if not missing:
        return

    insert = {"sqlite": sqlite_insert, "postgresql": postgres_insert}.get(database.get_bind().dialect.name)
    if insert is None:
        database.add_all(Facility(**record) for record in missing)
    else:
        database.execute(
            insert(Facility).values(missing).on_conflict_do_nothing(index_elements=["name", "location"])
        )
    database.commit()
