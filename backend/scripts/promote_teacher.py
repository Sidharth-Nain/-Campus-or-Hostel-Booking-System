"""Give an existing verified account teacher access from the local terminal."""

import argparse
import sys
from pathlib import Path

from sqlalchemy import select


BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIRECTORY))

from app.database import Base, SessionLocal, engine
from app.models import User, UserRole


def main() -> None:
    parser = argparse.ArgumentParser(description="Grant teaching bookings to a verified registered user.")
    parser.add_argument("email", help="Verified teacher's registered email address")
    arguments = parser.parse_args()
    normalized_email = arguments.email.strip().lower()

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as database:
        user = database.scalar(select(User).where(User.email == normalized_email))
        if user is None:
            raise SystemExit(f"No account found for {normalized_email}. Register it through the API first.")
        if user.role == UserRole.TEACHER:
            print(f"{normalized_email} already has teacher access.")
            return
        if user.role != UserRole.STUDENT:
            raise SystemExit("Use a separate account for teaching; existing administrator access was not changed.")

        user.role = UserRole.TEACHER
        database.commit()
        print(f"Granted teacher access to {normalized_email}.")


if __name__ == "__main__":
    main()
