"""Integration tests using the booking routes and an isolated SQLite database."""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, time, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Barrier
import unittest

from fastapi import BackgroundTasks, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.api.routes.admin_bookings import approve_booking
from app.api.routes.bookings import cancel_my_booking, check_booking_availability, create_booking
from app.api.routes.seat_passes import reserve_seat
from app.database import Base
from app.models import BookingStatus, Facility, User, UserRole
from app.schemas.booking import BookingAvailabilityRequest, BookingCreate
from app.schemas.seat_pass import SeatPassCreate
from app.services.booking_conflicts import CAMPUS_ZONE
from app.services.database_guards import ensure_booking_guards


class SeatBookingsTest(unittest.TestCase):
    def setUp(self):
        temporary = TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.engine = create_engine(f"sqlite:///{Path(temporary.name) / 'test.db'}")
        self.addCleanup(self.engine.dispose)
        Base.metadata.create_all(self.engine)
        ensure_booking_guards(self.engine)
        self.day = datetime.now(CAMPUS_ZONE).date() + timedelta(days=7)
        self.start = datetime.combine(self.day, time(10), CAMPUS_ZONE)
        with Session(self.engine) as db:
            for user_id, role in enumerate((UserRole.STUDENT, UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN), 1):
                db.add(User(id=user_id, role=role, full_name=f"Tester {user_id}",
                            email=f"tester{user_id}@example.edu", password_hash="unused"))
            db.add(Facility(id=1, name="Study desks", location="Library", description="Numbered desks",
                            booking_mode="study_seat", seat_tier=1, seat_layout="library", capacity=3))
            db.add(Facility(id=2, name="Classroom", location="North", description="Teaching room",
                            booking_mode="teaching", seat_layout="classroom", capacity=3))
            db.commit()

    def book(self, user_id, seat, *, facility_id=1, start=None):
        start = start or self.start
        payload = BookingCreate(facility_id=facility_id, starts_at=start, ends_at=start + timedelta(hours=1),
                                seat_number=seat, purpose="Study session")
        with Session(self.engine) as db:
            booking = create_booking(payload, db, db.get(User, user_id))
            return booking.id, booking.status

    def test_students_can_book_different_seats_at_the_same_time(self):
        self.assertEqual(self.book(1, 1)[1], BookingStatus.APPROVED)
        slot = BookingAvailabilityRequest(facility_id=1, starts_at=self.start, ends_at=self.start + timedelta(hours=1))
        with Session(self.engine) as db:
            for student, can_book in ((1, False), (2, True)):
                result = check_booking_availability(slot, db, db.get(User, student))
                self.assertEqual(result.is_available, can_book)
                self.assertEqual(result.seat_capacity, 3)
                self.assertEqual(result.available_seats, [2, 3])
        self.assertEqual(self.book(2, 2)[1], BookingStatus.APPROVED)
        self.assertEqual(self.book(2, 1, start=self.start + timedelta(hours=1))[1], BookingStatus.APPROVED)

    def test_concurrent_students_cannot_both_claim_one_seat(self):
        ready = Barrier(2)

        def attempt(user_id):
            ready.wait(timeout=5)
            try:
                return self.book(user_id, 1)[1].value
            except HTTPException as error:
                return error.status_code

        with ThreadPoolExecutor(max_workers=2) as workers:
            self.assertCountEqual(workers.map(attempt, (1, 2)), ("approved", 409))

    def test_approving_a_whole_classroom_rechecks_all_seats(self):
        room, status = self.book(3, None, facility_id=2)
        self.assertEqual(status, BookingStatus.PENDING)
        seat, _ = self.book(1, 1, facility_id=2)
        with Session(self.engine) as db, self.assertRaises(HTTPException) as conflict:
            approve_booking(room, BackgroundTasks(), db, db.get(User, 4))
        self.assertEqual(conflict.exception.status_code, 409)
        with Session(self.engine) as db:
            cancel_my_booking(seat, db, db.get(User, 1))
            approved = approve_booking(room, BackgroundTasks(), db, db.get(User, 4))
            self.assertEqual(approved.status, BookingStatus.APPROVED)
        with self.assertRaises(HTTPException) as conflict:
            self.book(2, 3, facility_id=2)
        self.assertEqual(conflict.exception.status_code, 409)

    def test_passes_and_hourly_seats_share_inventory_and_midnight_boundaries(self):
        self.book(1, 1)
        payload = SeatPassCreate(facility_id=1, plan_id="focus-week", starts_on=self.day, seat_number=1)
        with Session(self.engine) as db, self.assertRaises(HTTPException) as conflict:
            reserve_seat(payload, db, db.get(User, 2))
        self.assertEqual(conflict.exception.status_code, 409)
        with Session(self.engine) as db:
            reserve_seat(payload.model_copy(update={"seat_number": 2}), db, db.get(User, 2))
        # End exactly at the first midnight, and start at the exclusive last midnight.
        midnight = datetime.combine(self.day, time.min, CAMPUS_ZONE)
        self.assertEqual(self.book(1, 2, start=midnight - timedelta(hours=1))[1], BookingStatus.APPROVED)
        with self.assertRaises(HTTPException) as conflict:
            self.book(1, 2, start=midnight)
        self.assertEqual(conflict.exception.status_code, 409)
        self.assertEqual(self.book(1, 2, start=midnight + timedelta(days=7))[1], BookingStatus.APPROVED)


class LegacyBookingMigrationTest(unittest.TestCase):
    def test_existing_approved_record_remains_a_whole_room_booking(self):
        engine = create_engine("sqlite://")
        self.addCleanup(engine.dispose)
        with engine.begin() as conn:
            conn.exec_driver_sql("""
                CREATE TABLE bookings (id INTEGER PRIMARY KEY, facility_id INTEGER,
                                       starts_at TEXT, ends_at TEXT, status TEXT)
            """)
            conn.exec_driver_sql("""
                INSERT INTO bookings VALUES (1, 1, '2030-01-01 09:00', '2030-01-01 10:00', 'APPROVED')
            """)
        ensure_booking_guards(engine)
        ensure_booking_guards(engine)
        with engine.connect() as conn:
            self.assertEqual(conn.exec_driver_sql("SELECT id, status, seat_number FROM bookings").all(),
                             [(1, "APPROVED", None)])
