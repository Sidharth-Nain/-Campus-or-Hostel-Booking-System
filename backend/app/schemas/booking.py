"""Request and response schemas for student facility bookings."""

from datetime import datetime, timedelta, timezone
from typing import Self

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models import BookingStatus
from app.schemas.facility import FacilityRead


class BookingCreate(BaseModel):
    """A student's request for one facility and time interval."""

    facility_id: int = Field(gt=0)
    starts_at: datetime
    ends_at: datetime
    purpose: str = Field(min_length=3, max_length=500)

    @field_validator("purpose")
    @classmethod
    def clean_purpose(cls, value: str) -> str:
        """Remove surrounding whitespace and reject an empty reason."""

        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("Purpose must contain at least 3 characters.")
        return cleaned

    @model_validator(mode="after")
    def validate_booking_interval(self) -> Self:
        """Require a future, timezone-aware booking of at most 12 hours."""

        if self.starts_at.utcoffset() is None or self.ends_at.utcoffset() is None:
            raise ValueError("Booking times must include a timezone.")
        if self.starts_at <= datetime.now(timezone.utc):
            raise ValueError("Booking start time must be in the future.")
        if self.ends_at <= self.starts_at:
            raise ValueError("Booking end time must be after the start time.")
        if self.ends_at - self.starts_at > timedelta(hours=12):
            raise ValueError("A booking cannot be longer than 12 hours.")
        return self


class BookingRead(BaseModel):
    """Booking information safe to return to its requesting student."""

    id: int
    facility_id: int
    starts_at: datetime
    ends_at: datetime
    purpose: str
    status: BookingStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


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
    facility: FacilityRead
    reviewed_by: int | None
    reviewed_at: datetime | None
