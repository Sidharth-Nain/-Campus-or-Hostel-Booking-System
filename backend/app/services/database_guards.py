"""Database-level safety rules that are specific to PostgreSQL."""

from sqlalchemy import Engine, text


def ensure_postgres_booking_guards(engine: Engine) -> None:
    """Install the final approved-booking overlap constraint on PostgreSQL.

    API checks provide friendly errors. This exclusion constraint is the final
    concurrency guard when two approval requests arrive at nearly the same time.
    SQLite remains the simple local-development database and skips this rule.
    """

    if engine.dialect.name != "postgresql":
        return

    with engine.begin() as connection:
        connection.execute(text("SELECT pg_advisory_xact_lock(hashtext('campusflow_booking_guards'))"))
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
        connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'approved_booking_times_do_not_overlap'
                    ) THEN
                        ALTER TABLE bookings
                        ADD CONSTRAINT approved_booking_times_do_not_overlap
                        EXCLUDE USING gist (
                            facility_id WITH =,
                            tstzrange(starts_at, ends_at, '[)') WITH &&
                        )
                        WHERE (status = 'APPROVED');
                    END IF;
                END
                $$;
                """
            )
        )
