"""Request and response schemas for campus facilities."""

from typing import Self

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator, model_validator


class FacilityFields(BaseModel):
    """Shared, validated fields used when an administrator edits a space."""

    name: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=10, max_length=2000)
    capacity: int = Field(gt=0, le=10000)
    location: str = Field(min_length=2, max_length=160)

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


class FacilityUpdate(BaseModel):
    """Fields an administrator may change on an existing facility."""

    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, min_length=10, max_length=2000)
    capacity: int | None = Field(default=None, gt=0, le=10000)
    location: str | None = Field(default=None, min_length=2, max_length=160)
    is_active: bool | None = None

    @model_validator(mode="after")
    def reject_explicit_nulls(self) -> Self:
        """Allow omitted fields, but reject attempts to erase required data."""

        if any(value is None for value in self.model_dump(exclude_unset=True).values()):
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

    model_config = ConfigDict(from_attributes=True)
