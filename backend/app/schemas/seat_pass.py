"""API request and response types for student seat passes."""

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.facility import FacilityRead


class SeatPassPlan(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    name: str
    description: str
    price_inr: int
    days: int
    tier: int


class SeatPassCreate(BaseModel):
    plan_id: str = Field(min_length=1, max_length=32)
    facility_id: int = Field(gt=0)
    seat_number: int = Field(gt=0)
    starts_on: date


class SeatPassAvailability(BaseModel):
    facility_id: int
    starts_on: date
    ends_on: date = Field(description="Exclusive end date, in campus time (Asia/Kolkata).")
    available_seats: list[int]
    message: str | None = None


class SeatPassRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plan_id: str
    price_inr: int
    facility: FacilityRead
    seat_number: int
    starts_on: date
    ends_on: date = Field(description="Exclusive end date, in campus time (Asia/Kolkata).")
    status: Literal["reserved", "cancelled"]
