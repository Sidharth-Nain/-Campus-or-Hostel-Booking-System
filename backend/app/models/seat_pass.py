"""A student's reservation of the same numbered seat for a plan period."""

from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.entities import Facility


class SeatPass(Base):
    __tablename__ = "seat_passes"
    __table_args__ = (
        CheckConstraint("ends_on > starts_on", name="seat_pass_period_valid"),
        CheckConstraint("seat_number > 0", name="seat_pass_number_positive"),
        CheckConstraint("price_inr >= 0", name="seat_pass_price_nonnegative"),
        CheckConstraint("status IN ('reserved', 'cancelled')", name="seat_pass_status_valid"),
        Index("seat_pass_facility_period_idx", "facility_id", "status", "starts_on", "ends_on"),
        Index("seat_pass_student_period_idx", "user_id", "status", "starts_on", "ends_on"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id", ondelete="RESTRICT"))
    plan_id: Mapped[str] = mapped_column(String(32))
    price_inr: Mapped[int]
    seat_number: Mapped[int]
    starts_on: Mapped[date] = mapped_column(Date)
    ends_on: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(10), default="reserved")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    facility: Mapped[Facility] = relationship()
