"""Response schema for public facility information."""

from pydantic import BaseModel, ConfigDict


class FacilityRead(BaseModel):
    """The facility fields students may see before booking."""

    id: int
    name: str
    description: str
    capacity: int
    location: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
