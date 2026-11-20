"""Core SQLAlchemy models matching the Day 2 database design."""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum as SqlEnum, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"
    TEACHER = "teacher"


class BookingStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole, native_enum=False), default=UserRole.STUDENT, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    bookings: Mapped[list["Booking"]] = relationship(foreign_keys="Booking.user_id", back_populates="requester")
    reviewed_bookings: Mapped[list["Booking"]] = relationship(foreign_keys="Booking.reviewed_by", back_populates="reviewer")


class Facility(Base):
    __tablename__ = "facilities"
    __table_args__ = (
        UniqueConstraint("name", "location", name="facilities_name_location_unique"),
        CheckConstraint("capacity > 0", name="facilities_capacity_positive"),
        CheckConstraint("booking_mode IN ('standard', 'teaching', 'study_room', 'study_seat')", name="facilities_booking_mode_valid"),
        CheckConstraint("seat_layout IN ('lab', 'classroom', 'library', 'studio')", name="facilities_seat_layout_valid"),
        CheckConstraint(
            "(booking_mode = 'study_seat' AND seat_tier IS NOT NULL AND seat_tier BETWEEN 1 AND 4)"
            " OR (booking_mode <> 'study_seat' AND seat_tier IS NULL)",
            name="facilities_seat_tier_valid",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    location: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(40), default="General", server_default="General", nullable=False)
    amenities: Mapped[list[str]] = mapped_column(JSON, default=list, server_default="[]", nullable=False)
    booking_mode: Mapped[str] = mapped_column(String(20), default="standard", server_default="standard", nullable=False)
    seat_tier: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seat_layout: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="facility")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("ends_at > starts_at", name="bookings_valid_interval"),
        CheckConstraint("seat_number > 0", name="bookings_seat_positive"),
        Index("bookings_facility_time_idx", "facility_id", "starts_at", "ends_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id", ondelete="RESTRICT"), nullable=False)
    seat_number: Mapped[int | None] = mapped_column(Integer)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    purpose: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(SqlEnum(BookingStatus, native_enum=False), default=BookingStatus.PENDING, nullable=False)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    requester: Mapped[User] = relationship(foreign_keys=[user_id], back_populates="bookings")
    reviewer: Mapped[User | None] = relationship(foreign_keys=[reviewed_by], back_populates="reviewed_bookings")
    facility: Mapped[Facility] = relationship(back_populates="bookings")
