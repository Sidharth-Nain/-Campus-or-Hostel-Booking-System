"""Upgrade older bookings and enforce exclusive access to approved seats or rooms."""

from sqlalchemy import Engine, inspect, text


def ensure_booking_guards(engine: Engine) -> None:
    """Keep existing reservations as whole-room bookings when no seat was recorded."""

    with engine.begin() as connection:
        if engine.dialect.name == "sqlite":
            connection.exec_driver_sql("BEGIN IMMEDIATE")
        elif engine.dialect.name == "postgresql":
            connection.execute(text("SELECT pg_advisory_xact_lock(hashtext('campusflow_booking_guards'))"))

        columns = {column["name"] for column in inspect(connection).get_columns("bookings")}
        if "seat_number" not in columns:
            connection.exec_driver_sql(
                "ALTER TABLE bookings ADD COLUMN seat_number INTEGER CHECK (seat_number > 0)"
            )

        if engine.dialect.name == "sqlite":
            # SQLite serializes writers. These triggers enforce the rule even
            # for inserts and approvals performed outside the API.
            for operation in ("INSERT", "UPDATE"):
                connection.exec_driver_sql(f"""
                    CREATE TRIGGER IF NOT EXISTS bookings_seat_overlap_{operation.lower()}
                    BEFORE {operation} ON bookings
                    WHEN NEW.status = 'APPROVED' AND EXISTS (
                        SELECT 1 FROM bookings AS other
                        WHERE other.facility_id = NEW.facility_id
                          AND other.status = 'APPROVED'
                          AND other.id <> NEW.id
                          AND other.starts_at < NEW.ends_at
                          AND other.ends_at > NEW.starts_at
                          AND (other.seat_number IS NULL OR NEW.seat_number IS NULL
                               OR other.seat_number = NEW.seat_number)
                    )
                    BEGIN
                        SELECT RAISE(ABORT, 'Approved seat or room booking overlaps.');
                    END
                """)
        elif engine.dialect.name == "postgresql":
            connection.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS btree_gist")
            connection.exec_driver_sql("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conrelid = 'bookings'::regclass
                          AND conname = 'approved_seat_or_room_times_do_not_overlap'
                    ) THEN
                        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS approved_booking_times_do_not_overlap;
                        -- A NULL seat yields an unbounded range, covering every seat.
                        ALTER TABLE bookings ADD CONSTRAINT approved_seat_or_room_times_do_not_overlap
                        EXCLUDE USING gist (
                            facility_id WITH =,
                            int8range(seat_number::bigint, seat_number::bigint, '[]') WITH &&,
                            tstzrange(starts_at, ends_at, '[)') WITH &&
                        ) WHERE (status = 'APPROVED');
                    END IF;
                END $$;
            """)
