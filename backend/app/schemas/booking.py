"""Request and response schemas for one-time space bookings."""

from datetime import datetime, timedelta, timezone
from typing import Self

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models import BookingStatus
from app.schemas.facility import FacilityRead


class BookingInterval(BaseModel):
    """A validated future time range used by booking operations."""

    starts_at: datetime
    ends_at: datetime

    @model_validator(mode="after")
    def validate_booking_interval(self) -> Self:
        """Require a future, timezone-aware booking of at most 12 hours."""

        if self.starts_at.utcoffset() is None or self.ends_at.utcoffset() is None:
            raise ValueError("Booking times must include a timezone.")
        self.starts_at = self.starts_at.astimezone(timezone.utc)
        self.ends_at = self.ends_at.astimezone(timezone.utc)
        if self.starts_at <= datetime.now(timezone.utc):
            raise ValueError("Booking start time must be in the future.")
        if self.ends_at <= self.starts_at:
            raise ValueError("Booking end time must be after the start time.")
        if self.ends_at - self.starts_at > timedelta(hours=12):
            raise ValueError("A booking cannot be longer than 12 hours.")
        return self


class BookingCreate(BookingInterval):
    """A seat reservation or whole-facility request for one time interval."""

    facility_id: int = Field(gt=0)
    purpose: str | None = Field(default=None, min_length=3, max_length=500)
    seat_number: int | None = Field(default=None, gt=0, strict=True)

    @field_validator("purpose")
    @classmethod
    def clean_purpose(cls, value: str | None) -> str | None:
        """Remove surrounding whitespace and reject an empty reason."""

        if value is None:
            return None
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("Purpose must contain at least 3 characters.")
        return cleaned


class BookingAvailabilityRequest(BookingInterval):
    """A facility and interval the student wants to check before requesting."""

    facility_id: int = Field(gt=0)


class BookingAvailabilityRead(BaseModel):
    """Privacy-safe availability result for the requested interval."""

    facility_id: int
    starts_at: datetime
    ends_at: datetime
    is_available: bool
    message: str
    available_seats: list[int] | None = None
    seat_capacity: int | None = None


class BookingRead(BaseModel):
    """Booking information safe to return to its requesting student."""

    id: int
    facility_id: int
    starts_at: datetime
    ends_at: datetime
    purpose: str
    seat_number: int | None
    status: BookingStatus
    created_at: datetime
    facility: FacilityRead

    model_config = ConfigDict(from_attributes=True)

    @field_validator("starts_at", "ends_at", "created_at")
    @classmethod
    def restore_sqlite_timezone(cls, value: datetime) -> datetime:
        """SQLite returns stored UTC timestamps without their timezone marker."""

        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


class BookingRequesterRead(BaseModel):
    """Student identity shown to an administrator reviewing a request."""

    id: int
    full_name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class AdminBookingRead(BookingRead):
    """Expanded booking information for the administrator review queue."""

    user_id: int
    requester: BookingRequesterRead
    reviewed_by: int | None
    reviewed_at: datetime | None
