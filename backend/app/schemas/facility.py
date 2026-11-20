"""Request and response schemas for campus facilities."""

from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, ValidationInfo, field_validator, model_validator


BookingMode = Literal["standard", "teaching", "study_room", "study_seat"]
SeatLayout = Literal["lab", "classroom", "library", "studio"]
Amenity = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
Category = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=40)]


class FacilityFields(BaseModel):
    """Shared, validated fields used when an administrator edits a space."""

    name: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=10, max_length=2000)
    capacity: int = Field(gt=0, le=10000)
    location: str = Field(min_length=2, max_length=160)
    category: Category = "General"
    amenities: list[Amenity] = Field(default_factory=list, max_length=12)
    booking_mode: BookingMode = "standard"
    seat_tier: int | None = Field(default=None, ge=1, le=4)
    seat_layout: SeatLayout | None = None

    @field_validator("name", "description", "location")
    @classmethod
    def clean_text(cls, value: str, info: ValidationInfo) -> str:
        """Trim text so whitespace cannot pass the length validation."""

        cleaned = value.strip()
        minimum = 10 if info.field_name == "description" else 2
        if len(cleaned) < minimum:
            raise ValueError(f"This field must contain at least {minimum} characters.")
        return cleaned


class FacilityCreate(FacilityFields):
    """Information required to add a facility to the directory."""

    @model_validator(mode="after")
    def validate_seat_tier(self) -> Self:
        if (self.booking_mode == "study_seat") != (self.seat_tier is not None):
            raise ValueError("Set a plan tier only for numbered-seat facilities.")
        if self.booking_mode in {"study_room", "study_seat"} and self.seat_layout is None:
            self.seat_layout = "library"
        return self


class FacilityUpdate(BaseModel):
    """Fields an administrator may change on an existing facility."""

    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, min_length=10, max_length=2000)
    capacity: int | None = Field(default=None, gt=0, le=10000)
    location: str | None = Field(default=None, min_length=2, max_length=160)
    category: Category | None = None
    amenities: list[Amenity] | None = Field(default=None, max_length=12)
    booking_mode: BookingMode | None = None
    seat_tier: int | None = Field(default=None, ge=1, le=4)
    seat_layout: SeatLayout | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def reject_explicit_nulls(self) -> Self:
        """Allow omitted fields, but reject attempts to erase required data."""

        if any(
            value is None for field, value in self.model_dump(exclude_unset=True).items()
            if field not in {"seat_tier", "seat_layout"}
        ):
            raise ValueError("Updated facility fields cannot be null.")
        return self

    @field_validator("name", "description", "location")
    @classmethod
    def clean_optional_text(cls, value: str | None, info: ValidationInfo) -> str | None:
        """Trim submitted text while leaving omitted fields unchanged."""

        if value is None:
            return value
        cleaned = value.strip()
        minimum = 10 if info.field_name == "description" else 2
        if len(cleaned) < minimum:
            raise ValueError(f"This field must contain at least {minimum} characters.")
        return cleaned


class FacilityRead(BaseModel):
    """The facility fields students may see before booking."""

    id: int
    name: str
    description: str
    capacity: int
    location: str
    is_active: bool
    category: str
    amenities: list[str]
    booking_mode: BookingMode
    seat_tier: int | None
    seat_layout: SeatLayout | None

    model_config = ConfigDict(from_attributes=True)
